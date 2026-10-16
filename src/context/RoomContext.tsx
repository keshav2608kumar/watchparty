import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  AuthoritativePlaybackState, 
  ChatMessage, 
  FloatingReaction, 
  PlaylistItem, 
  Poll, 
  RoomMember, 
  MediaType,
  PlaybackStatus,
  RoomSettings
} from '../types/room';
import { RoomSyncChannel, ConnectionMode } from '../services/syncChannel';
import { useAuth } from './AuthContext';
import { analyzeDrift, canUserControlPlayback } from '../utils/driftCalculator';
import { generateId } from '../utils/idGenerator';
import { PlayerControls, UnifiedPlayerState } from '../components/player/useUnifiedPlayer';

interface RoomContextType {
  roomId: string;
  playbackState: AuthoritativePlaybackState;
  members: RoomMember[];
  messages: ChatMessage[];
  playlist: PlaylistItem[];
  polls: Poll[];
  reactions: FloatingReaction[];
  connectionMode: ConnectionMode;
  isHost: boolean;
  canControl: boolean;
  syncDrift: number;
  settings: RoomSettings;
  registerPlayer: (controls: PlayerControls, getState: () => UnifiedPlayerState) => void;
  broadcastPlaybackCommand: (status: PlaybackStatus, positionSeconds: number, rate?: number) => void;
  sendChatMessage: (content: string) => void;
  sendReaction: (emoji: string) => void;
  addToPlaylist: (item: Omit<PlaylistItem, 'id' | 'addedAt'>) => void;
  removeFromPlaylist: (id: string) => void;
  playFromPlaylist: (item: PlaylistItem) => void;
  createPoll: (poll: Poll) => void;
  votePoll: (pollId: string, optionId: string) => void;
  transferHost: (newHostId: string) => void;
  updateSettings: (newSettings: Partial<RoomSettings>) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

interface RoomProviderProps {
  roomId: string;
  initialMedia?: {
    id: string;
    url: string;
    type: MediaType;
    title: string;
  };
  children: React.ReactNode;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({
  roomId,
  initialMedia,
  children,
}) => {
  const { user } = useAuth();

  // Retrieve or assign room creator from storage
  const storageRoomHostKey = `watchparty_room_host_${roomId}`;
  const initialHostId = (() => {
    try {
      const saved = localStorage.getItem(storageRoomHostKey);
      if (saved) return saved;
    } catch {}
    try {
      localStorage.setItem(storageRoomHostKey, user.id);
    } catch {}
    return user.id;
  })();

  const [hostId, setHostId] = useState<string>(initialHostId);
  const isHost = user.id === hostId;

  const [settings, setSettings] = useState<RoomSettings>({
    isPublic: true,
    allowGuestsToControl: false,
    maxParticipants: 20,
  });

  const canControl = canUserControlPlayback(user.id, hostId, settings);

  const defaultMediaUrl = initialMedia?.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
  const defaultMediaType = initialMedia?.type || 'html5';

  const [playbackState, setPlaybackState] = useState<AuthoritativePlaybackState>({
    roomId,
    hostId: initialHostId,
    mediaId: initialMedia?.id || 'default-stream',
    mediaType: defaultMediaType,
    mediaUrl: defaultMediaUrl,
    playbackStatus: 'paused',
    positionSeconds: 0,
    updatedAt: Date.now(),
    playbackRate: 1.0,
    revision: 1,
  });

  const [members, setMembers] = useState<RoomMember[]>([
    {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isHost,
      joinedAt: Date.now(),
      lastActive: Date.now(),
    }
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-welcome',
      roomId,
      senderId: 'system',
      senderName: 'WatchParty Bot',
      content: `Welcome to room ${roomId}! Invite friends to watch together in sync.`,
      timestamp: Date.now(),
      isSystem: true,
    }
  ]);

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([
    {
      id: 'queue-1',
      roomId,
      title: initialMedia?.title || 'Tears of Steel (Sci-Fi Short)',
      url: defaultMediaUrl,
      type: defaultMediaType,
      durationSeconds: 734,
      addedBy: user.id,
      addedByName: user.name,
      addedAt: Date.now(),
    }
  ]);

  const [polls, setPolls] = useState<Poll[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('disconnected');
  const [syncDrift, setSyncDrift] = useState<number>(0);

  // References for player control and synchronization
  const playerControlsRef = useRef<PlayerControls | null>(null);
  const getPlayerStateRef = useRef<(() => UnifiedPlayerState) | null>(null);
  const syncChannelRef = useRef<RoomSyncChannel | null>(null);
  const playbackStateRef = useRef<AuthoritativePlaybackState>(playbackState);
  playbackStateRef.current = playbackState;

  const registerPlayer = useCallback((controls: PlayerControls, getState: () => UnifiedPlayerState) => {
    playerControlsRef.current = controls;
    getPlayerStateRef.current = getState;
  }, []);

  // Initialize Realtime Channel
  useEffect(() => {
    const currentMember: RoomMember = {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isHost: user.id === hostId,
      joinedAt: Date.now(),
      lastActive: Date.now(),
    };

    const channel = new RoomSyncChannel(roomId, currentMember, {
      onPlaybackState: (incomingState) => {
        // Enforce monotonic revision ordering
        if (incomingState.revision <= playbackStateRef.current.revision) {
          return;
        }

        setPlaybackState(incomingState);
        playbackStateRef.current = incomingState;

        // Apply authoritative command to local player if controls are ready
        if (playerControlsRef.current) {
          // If playing, adjust position based on elapsed time
          const elapsed = incomingState.playbackStatus === 'playing'
            ? Math.max(0, (Date.now() - incomingState.updatedAt) / 1000)
            : 0;
          const targetPos = Math.max(0, incomingState.positionSeconds + (elapsed * incomingState.playbackRate));

          playerControlsRef.current.applyRemoteAction(
            incomingState.playbackStatus,
            targetPos,
            incomingState.playbackRate
          );
        }
      },
      onChatMessage: (incomingMsg) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
      },
      onReaction: (incomingReaction) => {
        setReactions((prev) => [...prev, incomingReaction]);
        // Auto-remove reaction from screen after 2.8s
        setTimeout(() => {
          setReactions((prev) => prev.filter(r => r.id !== incomingReaction.id));
        }, 2800);
      },
      onPlaylistUpdate: (incomingPlaylist) => {
        setPlaylist(incomingPlaylist);
      },
      onPollUpdate: (incomingPoll) => {
        setPolls((prev) => {
          const index = prev.findIndex(p => p.id === incomingPoll.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = incomingPoll;
            return updated;
          }
          return [...prev, incomingPoll];
        });
      },
      onHostTransfer: (newHostId) => {
        setHostId(newHostId);
        try {
          localStorage.setItem(storageRoomHostKey, newHostId);
        } catch {}
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            roomId,
            senderId: 'system',
            senderName: 'WatchParty Bot',
            content: `Host ownership was transferred to participant.`,
            timestamp: Date.now(),
            isSystem: true,
          }
        ]);
      },
      onPresenceChange: (activeMembers) => {
        // Ensure current member is present
        const hasMe = activeMembers.some(m => m.id === user.id);
        const merged = hasMe ? activeMembers : [...activeMembers, currentMember];
        setMembers(merged);
      },
      onRequestState: (requesterId) => {
        // If we are host, broadcast our authoritative state to synchronize late joiners!
        if (user.id === hostId) {
          syncChannelRef.current?.broadcastPlayback(playbackStateRef.current);
          syncChannelRef.current?.broadcastPlaylist(playlist);
          polls.forEach(p => syncChannelRef.current?.broadcastPoll(p));
        }
      }
    });

    channel.connect();
    syncChannelRef.current = channel;
    setConnectionMode(channel.mode);

    return () => {
      channel.disconnect();
      syncChannelRef.current = null;
    };
  }, [roomId, user.id, user.name, user.avatarUrl, hostId]);

  // Periodic Drift Check (Runs every 1.5s for viewers while playing)
  useEffect(() => {
    const driftInterval = setInterval(() => {
      if (!getPlayerStateRef.current || !playerControlsRef.current) return;
      const playerState = getPlayerStateRef.current();
      const authState = playbackStateRef.current;

      if (authState.playbackStatus !== 'playing') {
        setSyncDrift(0);
        return;
      }

      const analysis = analyzeDrift(playerState.currentTime, authState);
      setSyncDrift(analysis.driftSeconds);

      // Only viewers reconcile against the authoritative host
      if (!isHost) {
        if (analysis.action === 'seek') {
          playerControlsRef.current.seek(analysis.targetTimeSeconds);
        } else if (analysis.action === 'rate-adjust') {
          playerControlsRef.current.setPlaybackRate(analysis.suggestedRate);
        } else if (playerState.playbackRate !== 1.0) {
          playerControlsRef.current.setPlaybackRate(1.0);
        }
      }
    }, 1500);

    return () => clearInterval(driftInterval);
  }, [isHost]);

  // Actions
  const broadcastPlaybackCommand = useCallback((
    status: PlaybackStatus, 
    positionSeconds: number, 
    rate: number = 1.0
  ) => {
    if (!canControl) return;

    const nextRevision = playbackStateRef.current.revision + 1;
    const newState: AuthoritativePlaybackState = {
      ...playbackStateRef.current,
      playbackStatus: status,
      positionSeconds: Math.max(0, positionSeconds),
      playbackRate: rate,
      updatedAt: Date.now(),
      revision: nextRevision,
    };

    setPlaybackState(newState);
    playbackStateRef.current = newState;
    syncChannelRef.current?.broadcastPlayback(newState);
  }, [canControl]);

  const sendChatMessage = useCallback((content: string) => {
    const newMsg: ChatMessage = {
      id: generateId(),
      roomId,
      senderId: user.id,
      senderName: user.name,
      avatarUrl: user.avatarUrl,
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMsg]);
    syncChannelRef.current?.broadcastChat(newMsg);
  }, [roomId, user.id, user.name, user.avatarUrl]);

  const sendReaction = useCallback((emoji: string) => {
    const reaction: FloatingReaction = {
      id: generateId(),
      emoji,
      senderName: user.name,
      xPercent: Math.floor(15 + Math.random() * 70),
      timestamp: Date.now(),
    };

    setReactions(prev => [...prev, reaction]);
    syncChannelRef.current?.broadcastReaction(reaction);

    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 2800);
  }, [user.name]);

  const addToPlaylist = useCallback((item: Omit<PlaylistItem, 'id' | 'addedAt'>) => {
    const newItem: PlaylistItem = {
      ...item,
      id: generateId(),
      roomId,
      addedAt: Date.now(),
    };

    const updated = [...playlist, newItem];
    setPlaylist(updated);
    syncChannelRef.current?.broadcastPlaylist(updated);
  }, [roomId, playlist]);

  const removeFromPlaylist = useCallback((id: string) => {
    const updated = playlist.filter(p => p.id !== id);
    setPlaylist(updated);
    syncChannelRef.current?.broadcastPlaylist(updated);
  }, [playlist]);

  const playFromPlaylist = useCallback((item: PlaylistItem) => {
    if (!canControl) return;

    const nextRevision = playbackStateRef.current.revision + 1;
    const newState: AuthoritativePlaybackState = {
      ...playbackStateRef.current,
      mediaId: item.id,
      mediaType: item.type,
      mediaUrl: item.url,
      playbackStatus: 'playing',
      positionSeconds: 0,
      playbackRate: 1.0,
      updatedAt: Date.now(),
      revision: nextRevision,
    };

    setPlaybackState(newState);
    playbackStateRef.current = newState;
    syncChannelRef.current?.broadcastPlayback(newState);
  }, [canControl]);

  const createPoll = useCallback((poll: Poll) => {
    const updated = [poll, ...polls];
    setPolls(updated);
    syncChannelRef.current?.broadcastPoll(poll);
  }, [polls]);

  const votePoll = useCallback((pollId: string, optionId: string) => {
    const targetPoll = polls.find(p => p.id === pollId);
    if (!targetPoll) return;

    // Check if user already voted
    if (targetPoll.options.some(o => o.voterIds.includes(user.id))) {
      return;
    }

    const updatedOptions = targetPoll.options.map(opt => {
      if (opt.id === optionId) {
        return {
          ...opt,
          voteCount: opt.voteCount + 1,
          voterIds: [...opt.voterIds, user.id],
        };
      }
      return opt;
    });

    const updatedPoll: Poll = {
      ...targetPoll,
      options: updatedOptions,
      totalVotes: targetPoll.totalVotes + 1,
    };

    const updatedPolls = polls.map(p => p.id === pollId ? updatedPoll : p);
    setPolls(updatedPolls);
    syncChannelRef.current?.broadcastPoll(updatedPoll);
  }, [polls, user.id]);

  const transferHost = useCallback((newHostId: string) => {
    if (user.id !== hostId) return;
    setHostId(newHostId);
    try {
      localStorage.setItem(storageRoomHostKey, newHostId);
    } catch {}
    syncChannelRef.current?.broadcastHostTransfer(newHostId);
  }, [user.id, hostId, storageRoomHostKey]);

  const updateSettings = useCallback((newSettings: Partial<RoomSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <RoomContext.Provider
      value={{
        roomId,
        playbackState,
        members,
        messages,
        playlist,
        polls,
        reactions,
        connectionMode,
        isHost,
        canControl,
        syncDrift,
        settings,
        registerPlayer,
        broadcastPlaybackCommand,
        sendChatMessage,
        sendReaction,
        addToPlaylist,
        removeFromPlaylist,
        playFromPlaylist,
        createPoll,
        votePoll,
        transferHost,
        updateSettings,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

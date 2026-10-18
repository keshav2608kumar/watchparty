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
  RoomSettings,
  VoiceSignalPayload,
  VoiceStatePayload
} from '../types/room';
import { RoomSyncChannel, ConnectionMode, SyncCallbacks } from '../services/syncChannel';
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
  broadcastVoiceSignal: (signal: VoiceSignalPayload) => void;
  broadcastVoiceState: (state: VoiceStatePayload) => void;
  registerVoiceSignalListener: (listener: (signal: VoiceSignalPayload) => void) => () => void;
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
  const hostIdRef = useRef<string>(hostId);
  hostIdRef.current = hostId;

  const isHost = user.id === hostId;

  const [settings, setSettings] = useState<RoomSettings>({
    isPublic: true,
    allowGuestsToControl: true, // Default open room control so any member can pause, play, and seek
    maxParticipants: 20,
  });

  const canControl = canUserControlPlayback(user.id, hostId, settings);

  const defaultMediaUrl = initialMedia?.url || 'https://vjs.zencdn.net/v/oceans.mp4';
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
    revision: initialMedia ? 1 : 0,
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
      title: initialMedia?.title || 'Oceans (HD Demo)',
      url: defaultMediaUrl,
      type: defaultMediaType,
      durationSeconds: 46,
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
  const playlistRef = useRef<PlaylistItem[]>(playlist);
  playlistRef.current = playlist;
  const pollsRef = useRef<Poll[]>(polls);
  pollsRef.current = polls;
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;

  const currentMemberRef = useRef<RoomMember>({
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isHost,
    joinedAt: Date.now(),
    lastActive: Date.now(),
  });
  currentMemberRef.current = {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isHost: user.id === hostId,
    joinedAt: Date.now(),
    lastActive: Date.now(),
  };

  const registerPlayer = useCallback((controls: PlayerControls, getState: () => UnifiedPlayerState) => {
    playerControlsRef.current = controls;
    getPlayerStateRef.current = getState;
  }, []);

  const voiceListenersRef = useRef<Set<(signal: VoiceSignalPayload) => void>>(new Set());

  // Stable callbacks ref to prevent tearing or reconnecting
  const callbacksRef = useRef<SyncCallbacks>({
    onPlaybackState: () => {},
    onChatMessage: () => {},
    onReaction: () => {},
    onPlaylistUpdate: () => {},
    onPollUpdate: () => {},
    onHostTransfer: () => {},
    onPresenceChange: () => {},
    onRequestState: () => {},
    onVoiceSignal: () => {},
    onVoiceState: () => {},
    onSettingsUpdate: () => {},
  });

  callbacksRef.current = {
    onPlaybackState: (incomingState) => {
      // Reject stale events with strictly lower revision
      if (incomingState.revision < playbackStateRef.current.revision) {
        return;
      }

      // Always update hostId if incoming state specifies host
      if (incomingState.hostId && incomingState.hostId !== hostIdRef.current) {
        setHostId(incomingState.hostId);
        hostIdRef.current = incomingState.hostId;
        try {
          localStorage.setItem(storageRoomHostKey, incomingState.hostId);
        } catch {}
      }

      // If same revision, ignore only if state is already identical
      if (
        incomingState.revision === playbackStateRef.current.revision &&
        incomingState.mediaUrl === playbackStateRef.current.mediaUrl &&
        incomingState.playbackStatus === playbackStateRef.current.playbackStatus &&
        Math.abs(incomingState.positionSeconds - playbackStateRef.current.positionSeconds) < 0.5
      ) {
        return;
      }

      setPlaybackState(incomingState);
      playbackStateRef.current = incomingState;

      // Apply authoritative command to local player if controls are ready
      if (playerControlsRef.current) {
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
      setReactions((prev) => {
        if (prev.some(r => r.id === incomingReaction.id)) return prev;
        return [...prev, incomingReaction];
      });
      setTimeout(() => {
        setReactions((prev) => prev.filter(r => r.id !== incomingReaction.id));
      }, 3500);
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
      hostIdRef.current = newHostId;
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
      const hasMe = activeMembers.some(m => m.id === user.id);
      const merged = hasMe ? activeMembers : [...activeMembers, currentMemberRef.current];
      setMembers(merged);

      // If host and multiple members are present, ensure late joiners get playback state
      if (user.id === hostIdRef.current && activeMembers.length > 1) {
        syncChannelRef.current?.broadcastPlayback(playbackStateRef.current);
      }
    },
    onRequestState: (_requesterId) => {
      if (user.id === hostIdRef.current) {
        syncChannelRef.current?.broadcastPlayback(playbackStateRef.current);
        syncChannelRef.current?.broadcastPlaylist(playlistRef.current);
        pollsRef.current.forEach(p => syncChannelRef.current?.broadcastPoll(p));
        messagesRef.current.filter(m => !m.isSystem).forEach(m => syncChannelRef.current?.broadcastChat(m));
      }
    },
    onSettingsUpdate: (incomingSettings) => {
      setSettings(incomingSettings);
    },
    onVoiceSignal: (signal) => {
      voiceListenersRef.current.forEach(listener => {
        try { listener(signal); } catch (e) { console.warn('[Voice] Listener error:', e); }
      });
    },
    onVoiceState: (state) => {
      setMembers(prev => prev.map(m => {
        if (m.id === state.memberId) {
          return {
            ...m,
            isVoiceActive: state.isVoiceActive,
            isMuted: state.isMuted,
            isSpeaking: state.isSpeaking,
            isDeafened: state.isDeafened,
          };
        }
        return m;
      }));
    },
  };

  // Initialize Realtime Channel once per roomId + user.id
  useEffect(() => {
    const channel = new RoomSyncChannel(roomId, currentMemberRef.current, {
      onPlaybackState: (s) => callbacksRef.current.onPlaybackState(s),
      onChatMessage: (m) => callbacksRef.current.onChatMessage(m),
      onReaction: (r) => callbacksRef.current.onReaction(r),
      onPlaylistUpdate: (pl) => callbacksRef.current.onPlaylistUpdate(pl),
      onPollUpdate: (p) => callbacksRef.current.onPollUpdate(p),
      onHostTransfer: (h) => callbacksRef.current.onHostTransfer(h),
      onPresenceChange: (m) => callbacksRef.current.onPresenceChange(m),
      onRequestState: (req) => callbacksRef.current.onRequestState?.(req),
      onVoiceSignal: (s) => callbacksRef.current.onVoiceSignal?.(s),
      onVoiceState: (st) => callbacksRef.current.onVoiceState?.(st),
      onSettingsUpdate: (set) => callbacksRef.current.onSettingsUpdate?.(set),
      onConnectionModeChange: (mode) => setConnectionMode(mode),
    });

    channel.connect();
    syncChannelRef.current = channel;
    setConnectionMode(channel.mode);

    return () => {
      channel.disconnect();
      syncChannelRef.current = null;
    };
  }, [roomId, user.id]);

  // Periodic Drift Check (Runs every 300ms for viewers while playing to keep sync ultra-tight)
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

      // Only viewers reconcile against the authoritative playback state
      if (!isHost) {
        if (playerState.status !== 'playing' && playerState.isReady) {
          playerControlsRef.current.applyRemoteAction('playing', analysis.targetTimeSeconds, authState.playbackRate);
        } else if (analysis.action === 'seek') {
          playerControlsRef.current.seek(analysis.targetTimeSeconds);
        } else if (analysis.action === 'rate-adjust') {
          playerControlsRef.current.setPlaybackRate(analysis.suggestedRate);
        } else if (playerState.playbackRate !== 1.0) {
          playerControlsRef.current.setPlaybackRate(1.0);
        }
      }
    }, 300);

    return () => clearInterval(driftInterval);
  }, [isHost]);

  // Host Periodic Position Beacon (every 2s while playing to prevent clock drift across devices)
  useEffect(() => {
    if (!isHost) return;
    const beaconInterval = setInterval(() => {
      if (!getPlayerStateRef.current) return;
      const playerState = getPlayerStateRef.current();
      if (playerState.status === 'playing' && playbackStateRef.current.playbackStatus === 'playing') {
        const updatedState: AuthoritativePlaybackState = {
          ...playbackStateRef.current,
          positionSeconds: playerState.currentTime,
          updatedAt: Date.now(),
        };
        playbackStateRef.current = updatedState;
        syncChannelRef.current?.broadcastPlayback(updatedState);
      }
    }, 2000);

    return () => clearInterval(beaconInterval);
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

    setReactions(prev => {
      if (prev.some(r => r.id === reaction.id)) return prev;
      return [...prev, reaction];
    });
    syncChannelRef.current?.broadcastReaction(reaction);

    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3500);
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

    if (playerControlsRef.current) {
      playerControlsRef.current.applyRemoteAction('playing', 0, 1.0);
    }
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
    hostIdRef.current = newHostId;
    try {
      localStorage.setItem(storageRoomHostKey, newHostId);
    } catch {}
    syncChannelRef.current?.broadcastHostTransfer(newHostId);
  }, [user.id, hostId, storageRoomHostKey]);

  const updateSettings = useCallback((newSettings: Partial<RoomSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      syncChannelRef.current?.broadcastSettings(updated);
      return updated;
    });
  }, []);

  const registerVoiceSignalListener = useCallback((listener: (signal: VoiceSignalPayload) => void) => {
    voiceListenersRef.current.add(listener);
    return () => {
      voiceListenersRef.current.delete(listener);
    };
  }, []);

  const broadcastVoiceSignal = useCallback((signal: VoiceSignalPayload) => {
    syncChannelRef.current?.broadcastVoiceSignal(signal);
  }, []);

  const broadcastVoiceState = useCallback((state: VoiceStatePayload) => {
    setMembers(prev => prev.map(m => {
      if (m.id === state.memberId) {
        return {
          ...m,
          isVoiceActive: state.isVoiceActive,
          isMuted: state.isMuted,
          isSpeaking: state.isSpeaking,
          isDeafened: state.isDeafened,
        };
      }
      return m;
    }));
    syncChannelRef.current?.broadcastVoiceState(state);
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
        broadcastVoiceSignal,
        broadcastVoiceState,
        registerVoiceSignalListener,
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

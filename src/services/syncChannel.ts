import { 
  AuthoritativePlaybackState, 
  ChatMessage, 
  FloatingReaction, 
  PlaylistItem, 
  Poll, 
  RoomMember 
} from '../types/room';
import { supabase, isSupabaseConfigured } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SyncCallbacks {
  onPlaybackState: (state: AuthoritativePlaybackState) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onReaction: (reaction: FloatingReaction) => void;
  onPlaylistUpdate: (playlist: PlaylistItem[]) => void;
  onPollUpdate: (poll: Poll) => void;
  onHostTransfer: (newHostId: string) => void;
  onPresenceChange: (members: RoomMember[]) => void;
  onRequestState?: (requesterId: string) => void;
}

export type ConnectionMode = 'supabase-cloud' | 'local-broadcast' | 'disconnected';

export class RoomSyncChannel {
  private roomId: string;
  private currentMember: RoomMember;
  private callbacks: SyncCallbacks;
  private supabaseChannel: RealtimeChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private localPresenceMap: Map<string, RoomMember> = new Map();
  public mode: ConnectionMode = 'disconnected';

  constructor(roomId: string, member: RoomMember, callbacks: SyncCallbacks) {
    this.roomId = roomId;
    this.currentMember = member;
    this.callbacks = callbacks;
  }

  public connect(): void {
    if (isSupabaseConfigured && supabase) {
      this.connectSupabase();
    } else {
      this.connectBroadcastChannel();
    }
  }

  private connectSupabase(): void {
    if (!supabase) return;
    this.mode = 'supabase-cloud';

    const channel = supabase.channel(`watchparty_room:${this.roomId}`, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: this.currentMember.id }
      }
    });

    channel
      .on('broadcast', { event: 'playback' }, (payload) => {
        if (payload?.payload) this.callbacks.onPlaybackState(payload.payload);
      })
      .on('broadcast', { event: 'chat' }, (payload) => {
        if (payload?.payload) this.callbacks.onChatMessage(payload.payload);
      })
      .on('broadcast', { event: 'reaction' }, (payload) => {
        if (payload?.payload) this.callbacks.onReaction(payload.payload);
      })
      .on('broadcast', { event: 'playlist' }, (payload) => {
        if (payload?.payload) this.callbacks.onPlaylistUpdate(payload.payload);
      })
      .on('broadcast', { event: 'poll' }, (payload) => {
        if (payload?.payload) this.callbacks.onPollUpdate(payload.payload);
      })
      .on('broadcast', { event: 'host_transfer' }, (payload) => {
        if (payload?.payload?.newHostId) this.callbacks.onHostTransfer(payload.payload.newHostId);
      })
      .on('broadcast', { event: 'request_state' }, (payload) => {
        if (payload?.payload?.requesterId && this.callbacks.onRequestState) {
          this.callbacks.onRequestState(payload.payload.requesterId);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<RoomMember>();
        const members: RoomMember[] = [];
        for (const key in state) {
          if (state[key] && state[key].length > 0) {
            members.push(state[key][0]);
          }
        }
        this.callbacks.onPresenceChange(members);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(this.currentMember);
          // Request authoritative room state from host
          this.broadcast('request_state', { requesterId: this.currentMember.id });
        }
      });

    this.supabaseChannel = channel;
  }

  private connectBroadcastChannel(): void {
    this.mode = 'local-broadcast';
    try {
      this.broadcastChannel = new BroadcastChannel(`watchparty_room_${this.roomId}`);
      this.localPresenceMap.set(this.currentMember.id, this.currentMember);

      this.broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (!type) return;

        switch (type) {
          case 'playback':
            this.callbacks.onPlaybackState(payload);
            break;
          case 'chat':
            this.callbacks.onChatMessage(payload);
            break;
          case 'reaction':
            this.callbacks.onReaction(payload);
            break;
          case 'playlist':
            this.callbacks.onPlaylistUpdate(payload);
            break;
          case 'poll':
            this.callbacks.onPollUpdate(payload);
            break;
          case 'host_transfer':
            this.callbacks.onHostTransfer(payload.newHostId);
            break;
          case 'request_state':
            if (this.callbacks.onRequestState) {
              this.callbacks.onRequestState(payload.requesterId);
            }
            break;
          case 'presence_heartbeat':
            this.handlePresenceHeartbeat(payload);
            break;
          case 'presence_leave':
            this.localPresenceMap.delete(payload.id);
            this.callbacks.onPresenceChange(Array.from(this.localPresenceMap.values()));
            break;
        }
      };

      // Periodic presence heartbeat (every 3 seconds)
      this.sendHeartbeat();
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
        this.pruneStalePresence();
      }, 3000);

      // Request authoritative room state from host
      this.broadcast('request_state', { requesterId: this.currentMember.id });
      this.callbacks.onPresenceChange(Array.from(this.localPresenceMap.values()));
    } catch (e) {
      console.error('[WatchParty] BroadcastChannel error:', e);
    }
  }

  private sendHeartbeat(): void {
    this.currentMember.lastActive = Date.now();
    this.localPresenceMap.set(this.currentMember.id, this.currentMember);
    this.broadcast('presence_heartbeat', this.currentMember);
  }

  private handlePresenceHeartbeat(member: RoomMember): void {
    if (!member?.id) return;
    this.localPresenceMap.set(member.id, member);
    this.callbacks.onPresenceChange(Array.from(this.localPresenceMap.values()));
  }

  private pruneStalePresence(): void {
    const now = Date.now();
    let changed = false;
    for (const [id, member] of this.localPresenceMap.entries()) {
      if (id !== this.currentMember.id && now - member.lastActive > 9000) {
        this.localPresenceMap.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.callbacks.onPresenceChange(Array.from(this.localPresenceMap.values()));
    }
  }

  private broadcast(event: string, payload: unknown): void {
    if (this.supabaseChannel && this.mode === 'supabase-cloud') {
      this.supabaseChannel.send({
        type: 'broadcast',
        event,
        payload,
      });
    } else if (this.broadcastChannel && this.mode === 'local-broadcast') {
      this.broadcastChannel.postMessage({ type: event, payload });
    }
  }

  public broadcastPlayback(state: AuthoritativePlaybackState): void {
    this.broadcast('playback', state);
  }

  public broadcastChat(msg: ChatMessage): void {
    this.broadcast('chat', msg);
  }

  public broadcastReaction(reaction: FloatingReaction): void {
    this.broadcast('reaction', reaction);
  }

  public broadcastPlaylist(playlist: PlaylistItem[]): void {
    this.broadcast('playlist', playlist);
  }

  public broadcastPoll(poll: Poll): void {
    this.broadcast('poll', poll);
  }

  public broadcastHostTransfer(newHostId: string): void {
    this.broadcast('host_transfer', { newHostId });
  }

  public updateMember(member: RoomMember): void {
    this.currentMember = member;
    if (this.mode === 'supabase-cloud' && this.supabaseChannel) {
      this.supabaseChannel.track(this.currentMember);
    } else if (this.mode === 'local-broadcast') {
      this.sendHeartbeat();
    }
  }

  public disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.mode === 'local-broadcast' && this.broadcastChannel) {
      this.broadcast('presence_leave', { id: this.currentMember.id });
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.unsubscribe();
      this.supabaseChannel = null;
    }

    this.mode = 'disconnected';
  }
}

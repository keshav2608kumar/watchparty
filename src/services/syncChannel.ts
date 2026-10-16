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
import mqtt, { MqttClient } from 'mqtt';

export interface SyncCallbacks {
  onPlaybackState: (state: AuthoritativePlaybackState) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onReaction: (reaction: FloatingReaction) => void;
  onPlaylistUpdate: (playlist: PlaylistItem[]) => void;
  onPollUpdate: (poll: Poll) => void;
  onHostTransfer: (newHostId: string) => void;
  onPresenceChange: (members: RoomMember[]) => void;
  onRequestState?: (requesterId: string) => void;
  onConnectionModeChange?: (mode: ConnectionMode) => void;
}

export type ConnectionMode = 'supabase-cloud' | 'cloud-relay' | 'local-relay' | 'local-broadcast' | 'disconnected';

export class RoomSyncChannel {
  private roomId: string;
  private currentMember: RoomMember;
  private callbacks: SyncCallbacks;
  private supabaseChannel: RealtimeChannel | null = null;
  private mqttClient: MqttClient | null = null;
  private socket: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private localPresenceMap: Map<string, RoomMember> = new Map();
  private knownMemberIds: Set<string> = new Set();
  public mode: ConnectionMode = 'disconnected';

  constructor(roomId: string, member: RoomMember, callbacks: SyncCallbacks) {
    this.roomId = roomId;
    this.currentMember = member;
    this.callbacks = callbacks;
  }

  private setMode(newMode: ConnectionMode): void {
    this.mode = newMode;
    this.callbacks.onConnectionModeChange?.(newMode);
  }

  public connect(): void {
    if (isSupabaseConfigured && supabase) {
      this.connectSupabase();
      return;
    }

    // Always connect local broadcast channel for instant multi-tab sync
    this.connectBroadcastChannel();

    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalhost) {
      this.connectLocalRelay();
    } else {
      this.connectCloudRelay(0);
    }
  }

  private connectSupabase(): void {
    if (!supabase) return;
    this.setMode('supabase-cloud');

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
          this.broadcast('request_state', { requesterId: this.currentMember.id });
        }
      });

    this.supabaseChannel = channel;
  }

  private readonly brokers: string[] = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
  ];
  private currentBrokerIdx: number = 0;

  private connectCloudRelay(brokerIdx = 0): void {
    if (this.mqttClient && this.mqttClient.connected) return;
    this.currentBrokerIdx = brokerIdx;

    const brokerUrl = this.brokers[brokerIdx % this.brokers.length];
    const topic = `watchparty/v1/rooms/${encodeURIComponent(this.roomId)}`;
    const clientId = `wp_${this.currentMember.id.substring(0, 8)}_${Math.random().toString(36).substring(2, 7)}`;

    console.log(`[Sync] Connecting to Cloud Relay (${brokerUrl}) for room ${this.roomId}`);

    try {
      if (this.mqttClient) {
        try { this.mqttClient.end(true); } catch {}
        this.mqttClient = null;
      }

      const client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 8000,
        keepalive: 30,
        reconnectPeriod: 2500,
      });

      this.mqttClient = client;

      // Failover timer: if broker fails to connect within 8s, try alternative broker
      const failoverTimeout = setTimeout(() => {
        if (!client.connected && this.mode !== 'supabase-cloud') {
          console.warn(`[Sync] Broker ${brokerUrl} connection timed out. Trying fallback broker...`);
          try { client.end(true); } catch {}
          this.connectCloudRelay(brokerIdx + 1);
        }
      }, 8000);

      client.on('connect', () => {
        clearTimeout(failoverTimeout);
        console.log(`[Sync] Connected to Cloud Broker (${brokerUrl})! Subscribed to topic: ${topic}`);
        this.setMode('cloud-relay');

        client.subscribe(topic, { qos: 0 }, (err) => {
          if (!err) {
            this.broadcast('request_state', { requesterId: this.currentMember.id });
          }
        });

        this.localPresenceMap.set(this.currentMember.id, this.currentMember);

        // Start presence heartbeat
        this.sendHeartbeat();
        if (!this.heartbeatInterval) {
          this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
            this.pruneStalePresence();
          }, 3000);
        }

        // Retry request_state after 1.2s to guarantee host state capture
        setTimeout(() => {
          this.broadcast('request_state', { requesterId: this.currentMember.id });
        }, 1200);

        this.callbacks.onPresenceChange(Array.from(this.localPresenceMap.values()));
      });

      client.on('message', (_topic, message) => {
        try {
          const raw = JSON.parse(message.toString());
          if (raw.senderId && raw.senderId === this.currentMember.id) return;
          this.handleIncomingPayload(raw);
        } catch (e) {
          console.warn('[Sync] Malformed cloud message:', e);
        }
      });

      client.on('error', (err) => {
        console.warn(`[Sync] Cloud MQTT error on ${brokerUrl}:`, err);
      });

      client.on('close', () => {
        console.log('[Sync] Cloud MQTT closed, will auto-reconnect...');
      });

      client.on('offline', () => {
        console.log('[Sync] Cloud MQTT offline, reconnecting...');
      });
    } catch (e) {
      console.warn('[Sync] Failed to initialize cloud relay:', e);
    }
  }

  private connectLocalRelay(): void {
    try {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5173';
      const wsUrl = `${wsProtocol}//${host}/watchparty-ws?room=${encodeURIComponent(this.roomId)}`;

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        this.setMode('local-relay');
        this.socket = socket;
        this.localPresenceMap.set(this.currentMember.id, this.currentMember);

        // Start presence heartbeat
        this.sendHeartbeat();
        this.heartbeatInterval = setInterval(() => {
          this.sendHeartbeat();
          this.pruneStalePresence();
        }, 3000);

        this.broadcast('request_state', { requesterId: this.currentMember.id });
        this.callbacks.onPresenceChange(Array.from(this.localPresenceMap.values()));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingPayload(data);
        } catch (e) {
          console.warn('[Sync] Malformed message:', e);
        }
      };

      socket.onerror = () => {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
          this.connectCloudRelay();
        }
      };

      socket.onclose = () => {
        if (this.mode === 'local-relay') {
          this.connectCloudRelay();
        }
      };
    } catch {
      this.connectCloudRelay();
    }
  }

  private connectBroadcastChannel(): void {
    if (this.broadcastChannel) return;
    try {
      this.broadcastChannel = new BroadcastChannel(`watchparty_room_${this.roomId}`);
      this.localPresenceMap.set(this.currentMember.id, this.currentMember);

      this.broadcastChannel.onmessage = (event) => {
        const data = event.data || {};
        if (data.senderId && data.senderId === this.currentMember.id) return;
        this.handleIncomingPayload(data);
      };

      if (!this.heartbeatInterval) {
        this.sendHeartbeat();
        this.heartbeatInterval = setInterval(() => {
          this.sendHeartbeat();
          this.pruneStalePresence();
        }, 3000);
      }

      this.broadcast('request_state', { requesterId: this.currentMember.id });
      this.callbacks.onPresenceChange(Array.from(this.localPresenceMap.values()));
      if (this.mode === 'disconnected') {
        this.setMode('local-broadcast');
      }
    } catch (e) {
      console.error('[WatchParty] BroadcastChannel error:', e);
    }
  }

  private handleIncomingPayload(data: any): void {
    const { type, payload } = data;
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
        this.sendHeartbeat();
        if (this.callbacks.onRequestState) {
          this.callbacks.onRequestState(payload.requesterId);
        }
        break;
      case 'presence_heartbeat':
        this.handlePresenceHeartbeat(payload);
        if (payload?.id && payload.id !== this.currentMember.id && !this.knownMemberIds.has(payload.id)) {
          this.knownMemberIds.add(payload.id);
          this.sendHeartbeat();
        }
        break;
      case 'presence_leave':
        this.localPresenceMap.delete(payload.id);
        this.callbacks.onPresenceChange(Array.from(this.localPresenceMap.values()));
        break;
    }
  }

  private sendHeartbeat(): void {
    this.currentMember.lastActive = Date.now();
    this.localPresenceMap.set(this.currentMember.id, this.currentMember);
    this.broadcast('presence_heartbeat', this.currentMember);
  }

  private handlePresenceHeartbeat(member: RoomMember): void {
    if (!member?.id) return;
    this.localPresenceMap.set(member.id, { ...member, lastActive: Date.now() });
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
    const packet = { type: event, payload, senderId: this.currentMember.id };

    // 1. Supabase Cloud if configured
    if (this.supabaseChannel && this.mode === 'supabase-cloud') {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event,
          payload,
        });
      } catch (err) {
        console.warn('[Sync] Supabase broadcast error:', err);
      }
    }

    // 2. Cloud MQTT (cross-device/internet sync)
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        const topic = `watchparty/v1/rooms/${encodeURIComponent(this.roomId)}`;
        this.mqttClient.publish(topic, JSON.stringify(packet));
      } catch (err) {
        console.warn('[Sync] MQTT publish error:', err);
      }
    }

    // 3. Local WebSocket relay
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(packet));
      } catch (err) {
        console.warn('[Sync] Socket send error:', err);
      }
    }

    // 4. Local BroadcastChannel (same-browser tab sync)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(packet);
      } catch (err) {
        console.warn('[Sync] BroadcastChannel post error:', err);
      }
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
    } else {
      this.sendHeartbeat();
    }
  }

  public disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.broadcast('presence_leave', { id: this.currentMember.id });

    if (this.mqttClient) {
      try {
        const topic = `watchparty/v1/rooms/${encodeURIComponent(this.roomId)}`;
        const packet = { type: 'presence_leave', payload: { id: this.currentMember.id }, senderId: this.currentMember.id };
        this.mqttClient.publish(topic, JSON.stringify(packet));
        this.mqttClient.end();
      } catch {
        // ignore
      }
      this.mqttClient = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.unsubscribe();
      this.supabaseChannel = null;
    }

    this.setMode('disconnected');
  }
}

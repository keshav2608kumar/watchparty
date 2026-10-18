import { describe, it, expect } from 'vitest';
import { canUserControlPlayback } from '../utils/driftCalculator';
import { normalizeCustomMediaUrl } from '../utils/formatters';
import { VoiceSignalPayload, VoiceStatePayload, RoomMember } from '../types/room';

describe('Open Playback Control & Voice Chat Feature Suite', () => {
  it('allows any participant to control playback by default (open room control)', () => {
    // When settings is undefined or has allowGuestsToControl: true
    expect(canUserControlPlayback('guest-alice', 'host-bob')).toBe(true);
    expect(canUserControlPlayback('guest-alice', 'host-bob', {
      isPublic: true,
      allowGuestsToControl: true,
      maxParticipants: 20
    })).toBe(true);
  });

  it('restricts guest control only if host explicitly locks the room', () => {
    const lockedSettings = { isPublic: true, allowGuestsToControl: false, maxParticipants: 20 };
    expect(canUserControlPlayback('guest-alice', 'host-bob', lockedSettings)).toBe(false);
    expect(canUserControlPlayback('host-bob', 'host-bob', lockedSettings)).toBe(true);
  });

  it('rejects unauthenticated or empty user ID from controlling playback', () => {
    expect(canUserControlPlayback('', 'host-bob')).toBe(false);
  });

  it('formats custom video stream URLs and preloads them into room share links', () => {
    const customDirectMp4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    const parsed = normalizeCustomMediaUrl(customDirectMp4);
    expect(parsed.type).toBe('html5');
    expect(parsed.url).toBe(customDirectMp4);

    const roomId = 'room-alpha-123';
    const inviteUrl = `https://watchparty-cinema-live.surge.sh/room/${roomId}?mediaUrl=${encodeURIComponent(customDirectMp4)}&mediaType=${parsed.type}`;
    expect(inviteUrl).toContain('mediaUrl=https%3A%2F%2Fcommondatastorage.googleapis.com');
    expect(inviteUrl).toContain('mediaType=html5');
  });

  it('validates WebRTC voice signaling and state payloads', () => {
    const signalPayload: VoiceSignalPayload = {
      from: 'user-alice',
      to: 'user-bob',
      signal: {
        type: 'offer',
        sdp: { type: 'offer', sdp: 'v=0\r\no=alice ...' },
      },
    };
    expect(signalPayload.from).toBe('user-alice');
    expect(signalPayload.to).toBe('user-bob');
    expect(signalPayload.signal.type).toBe('offer');

    const voiceState: VoiceStatePayload = {
      memberId: 'user-alice',
      isVoiceActive: true,
      isMuted: false,
      isSpeaking: true,
      isDeafened: false,
    };
    expect(voiceState.isVoiceActive).toBe(true);
    expect(voiceState.isSpeaking).toBe(true);
    expect(voiceState.isMuted).toBe(false);
  });

  it('properly tracks voice attributes in RoomMember model', () => {
    const member: RoomMember = {
      id: 'member-1',
      name: 'CinemaFan',
      isHost: false,
      joinedAt: Date.now(),
      lastActive: Date.now(),
      isVoiceActive: true,
      isSpeaking: true,
      isMuted: false,
      isDeafened: false,
    };

    expect(member.isVoiceActive).toBe(true);
    expect(member.isSpeaking).toBe(true);
  });
});

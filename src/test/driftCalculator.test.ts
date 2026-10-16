import { describe, it, expect } from 'vitest';
import { 
  calculateTargetPosition, 
  analyzeDrift, 
  shouldAcceptPlaybackRevision, 
  canUserControlPlayback,
  DRIFT_TOLERANCE_SECONDS,
  DRIFT_HARD_SEEK_THRESHOLD
} from '../utils/driftCalculator';
import { AuthoritativePlaybackState } from '../types/room';

describe('Drift Calculator & Real-Time Playback Synchronization', () => {
  const baseState: AuthoritativePlaybackState = {
    roomId: 'test-room-1',
    hostId: 'host-user',
    mediaId: 'media-1',
    mediaType: 'html5',
    mediaUrl: 'https://example.com/stream.mp4',
    playbackStatus: 'playing',
    positionSeconds: 10.0,
    updatedAt: 1000000,
    playbackRate: 1.0,
    revision: 5,
  };

  it('calculates target position accurately based on elapsed time when playing', () => {
    // 3 seconds elapsed
    const now = 1000000 + 3000;
    const target = calculateTargetPosition(baseState, now);
    expect(target).toBeCloseTo(13.0, 2);
  });

  it('holds static position when paused regardless of elapsed time', () => {
    const pausedState = { ...baseState, playbackStatus: 'paused' as const };
    const now = 1000000 + 10000;
    const target = calculateTargetPosition(pausedState, now);
    expect(target).toBe(10.0);
  });

  it('accounts for playback rate when calculating target position', () => {
    const fastState = { ...baseState, playbackRate: 1.5 };
    const now = 1000000 + 4000; // 4 seconds elapsed at 1.5x speed = +6 seconds
    const target = calculateTargetPosition(fastState, now);
    expect(target).toBeCloseTo(16.0, 2);
  });

  it('determines action "none" when drift is within tolerance (<= 0.5s)', () => {
    const now = 1000000 + 2000; // authoritative target = 12.0s
    // Local player is at 12.2s (drift = +0.2s <= 0.5s)
    const analysis = analyzeDrift(12.2, baseState, now);
    expect(analysis.action).toBe('none');
    expect(analysis.suggestedRate).toBe(1.0);
  });

  it('determines action "rate-adjust" for moderate drift (between 0.5s and 2.5s)', () => {
    const now = 1000000 + 5000; // authoritative target = 15.0s
    // Local player is lagging at 13.8s (drift = -1.2s)
    const analysis = analyzeDrift(13.8, baseState, now);
    expect(analysis.action).toBe('rate-adjust');
    expect(analysis.suggestedRate).toBeGreaterThan(1.0); // Should speed up slightly

    // Local player is ahead at 16.2s (drift = +1.2s)
    const aheadAnalysis = analyzeDrift(16.2, baseState, now);
    expect(aheadAnalysis.action).toBe('rate-adjust');
    expect(aheadAnalysis.suggestedRate).toBeLessThan(1.0); // Should slow down slightly
  });

  it('determines action "seek" when drift exceeds hard seek threshold (> 2.5s)', () => {
    const now = 1000000 + 5000; // authoritative target = 15.0s
    // Local player is at 10.0s (drift = -5.0s)
    const analysis = analyzeDrift(10.0, baseState, now);
    expect(analysis.action).toBe('seek');
    expect(analysis.targetTimeSeconds).toBeCloseTo(15.0, 2);
  });

  it('strictly rejects stale or duplicate revisions', () => {
    const currentRev = 10;
    expect(shouldAcceptPlaybackRevision(9, currentRev)).toBe(false);
    expect(shouldAcceptPlaybackRevision(10, currentRev)).toBe(false);
    expect(shouldAcceptPlaybackRevision(11, currentRev)).toBe(true);
  });

  it('correctly evaluates host permissions vs guest permissions', () => {
    const lockedSettings = { isPublic: true, allowGuestsToControl: false, maxParticipants: 10 };
    const openSettings = { isPublic: true, allowGuestsToControl: true, maxParticipants: 10 };

    // Host can always control
    expect(canUserControlPlayback('host-user', 'host-user', lockedSettings)).toBe(true);

    // Guest cannot control if locked
    expect(canUserControlPlayback('guest-1', 'host-user', lockedSettings)).toBe(false);

    // Guest can control if room settings permit
    expect(canUserControlPlayback('guest-1', 'host-user', openSettings)).toBe(true);

    // Empty user ID rejected
    expect(canUserControlPlayback('', 'host-user', openSettings)).toBe(false);
  });
});

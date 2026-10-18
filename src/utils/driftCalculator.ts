import { AuthoritativePlaybackState, RoomMember, RoomSettings } from '../types/room';

export interface DriftAnalysis {
  driftSeconds: number; // positive = local ahead, negative = local behind
  targetTimeSeconds: number;
  action: 'none' | 'rate-adjust' | 'seek';
  suggestedRate: number; // e.g. 1.05 or 0.95
}

export const DRIFT_TOLERANCE_SECONDS = 0.25; // Under 250ms is considered in-sync (ultra tight sync)
export const DRIFT_HARD_SEEK_THRESHOLD = 1.2; // Above 1.2s triggers immediate seek

/**
 * Calculates current authoritative playback position based on server timestamp and elapsed time
 */
export function calculateTargetPosition(
  state: AuthoritativePlaybackState, 
  currentTimestampMs: number = Date.now()
): number {
  if (state.playbackStatus !== 'playing') {
    return Math.max(0, state.positionSeconds);
  }

  const elapsedSeconds = Math.max(0, (currentTimestampMs - state.updatedAt) / 1000);
  return Math.max(0, state.positionSeconds + (elapsedSeconds * state.playbackRate));
}

/**
 * Evaluates drift between local player time and authoritative state
 */
export function analyzeDrift(
  localCurrentTime: number,
  state: AuthoritativePlaybackState,
  currentTimestampMs: number = Date.now()
): DriftAnalysis {
  const targetTime = calculateTargetPosition(state, currentTimestampMs);
  const drift = localCurrentTime - targetTime;
  const absDrift = Math.abs(drift);

  if (absDrift <= DRIFT_TOLERANCE_SECONDS) {
    return {
      driftSeconds: drift,
      targetTimeSeconds: targetTime,
      action: 'none',
      suggestedRate: 1.0,
    };
  }

  if (absDrift <= DRIFT_HARD_SEEK_THRESHOLD && state.playbackStatus === 'playing') {
    // If slightly ahead, slow down slightly; if slightly behind, speed up slightly
    const suggestedRate = drift > 0 ? 0.94 : 1.06;
    return {
      driftSeconds: drift,
      targetTimeSeconds: targetTime,
      action: 'rate-adjust',
      suggestedRate,
    };
  }

  return {
    driftSeconds: drift,
    targetTimeSeconds: targetTime,
    action: 'seek',
    suggestedRate: 1.0,
  };
}

/**
 * Evaluates whether an incoming event should be accepted or rejected based on monotonic revision
 */
export function shouldAcceptPlaybackRevision(
  incomingRevision: number, 
  currentRevision: number
): boolean {
  return incomingRevision > currentRevision;
}

/**
 * Permission check for controlling room playback
 */
export function canUserControlPlayback(
  userId: string,
  hostId: string,
  settings?: RoomSettings
): boolean {
  if (!userId) return false;
  if (userId === hostId) return true;
  // Open control: guests can control playback when allowGuestsToControl is enabled (default)
  return settings ? settings.allowGuestsToControl : true;
}

import { describe, it, expect } from 'vitest';
import { generateRoomId, generateId, isValidRoomId } from '../utils/idGenerator';

describe('ID Generator Utilities', () => {
  it('generates friendly hyphenated room code format', () => {
    const code = generateRoomId();
    expect(code).toMatch(/^[a-z]+-[a-z]+-\d{4}$/);
  });

  it('generates unique IDs across calls', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('validates room code format correctly', () => {
    expect(isValidRoomId('lunar-theatre-4821')).toBe(true);
    expect(isValidRoomId('cine-room-1')).toBe(true);
    expect(isValidRoomId('room123')).toBe(true);

    // Invalid codes
    expect(isValidRoomId('')).toBe(false);
    expect(isValidRoomId('a')).toBe(false); // too short
    expect(isValidRoomId('room with spaces')).toBe(false);
    expect(isValidRoomId('room!@#$%^')).toBe(false);
  });
});

const ADJECTIVES = ['lunar', 'cosmic', 'velvet', 'neon', 'stellar', 'midnight', 'cine', 'aurora', 'solar', 'cyber'];
const NOUNS = ['lounge', 'theatre', 'haven', 'vault', 'deck', 'orbit', 'nexus', 'pulse', 'stream', 'club'];

export function generateRoomId(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${noun}-${num}`;
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

export function isValidRoomId(code: string): boolean {
  if (!code) return false;
  const trimmed = code.trim().toLowerCase();
  return /^[a-z0-9-_]{3,32}$/.test(trimmed);
}

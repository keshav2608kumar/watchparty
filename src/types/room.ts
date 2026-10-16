export type MediaType = 'html5' | 'youtube';
export type PlaybackStatus = 'playing' | 'paused' | 'buffering' | 'ended';

export interface AuthoritativePlaybackState {
  roomId: string;
  hostId: string;
  mediaId: string;
  mediaType: MediaType;
  mediaUrl: string;
  playbackStatus: PlaybackStatus;
  positionSeconds: number;
  updatedAt: number; // UTC timestamp ms
  playbackRate: number;
  revision: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  isGuest: boolean;
  email?: string;
}

export interface RoomMember {
  id: string;
  name: string;
  avatarUrl?: string;
  isHost: boolean;
  joinedAt: number;
  lastActive: number;
  isMuted?: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  avatarUrl?: string;
  content: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface PlaylistItem {
  id: string;
  roomId: string;
  title: string;
  url: string;
  type: MediaType;
  durationSeconds: number;
  thumbnailUrl?: string;
  addedBy: string;
  addedByName: string;
  addedAt: number;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  voterIds: string[];
}

export interface Poll {
  id: string;
  roomId: string;
  creatorId: string;
  creatorName: string;
  question: string;
  options: PollOption[];
  createdAt: number;
  isActive: boolean;
  totalVotes: number;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  xPercent: number; // 10% to 90% across player
  timestamp: number;
}

export interface RoomSettings {
  isPublic: boolean;
  allowGuestsToControl: boolean;
  maxParticipants: number;
}

export interface RoomData {
  id: string;
  name: string;
  hostId: string;
  createdAt: number;
  settings: RoomSettings;
  playback: AuthoritativePlaybackState;
  members: RoomMember[];
  playlist: PlaylistItem[];
  polls: Poll[];
}

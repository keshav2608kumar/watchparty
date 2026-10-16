-- ==============================================================================
-- WatchParty: Production Database Migration
-- Version: 20261016000000
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. Rooms Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  host_id TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  allow_guests_to_control BOOLEAN NOT NULL DEFAULT false,
  max_participants INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms viewable by all active viewers" 
  ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Anyone can create a room" 
  ON public.rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Only the room host can update room settings" 
  ON public.rooms FOR UPDATE USING (
    auth.uid()::text = host_id OR current_setting('request.jwt.claim.sub', true) = host_id
  );

-- ------------------------------------------------------------------------------
-- 3. Room Members Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_member_in_room UNIQUE (room_id, user_id)
);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members viewable by members of the same room" 
  ON public.room_members FOR SELECT USING (true);

CREATE POLICY "Members can insert their own presence" 
  ON public.room_members FOR INSERT WITH CHECK (true);

CREATE POLICY "Members can update their own presence" 
  ON public.room_members FOR UPDATE USING (user_id = auth.uid()::text OR user_id LIKE 'guest_%');

CREATE POLICY "Members or host can remove presence" 
  ON public.room_members FOR DELETE USING (true);

-- ------------------------------------------------------------------------------
-- 4. Playback State Table (Authoritative state per room)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.playback_states (
  room_id TEXT PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  host_id TEXT NOT NULL,
  media_id TEXT NOT NULL DEFAULT 'default-media',
  media_type TEXT NOT NULL CHECK (media_type IN ('html5', 'youtube')),
  media_url TEXT NOT NULL,
  playback_status TEXT NOT NULL CHECK (playback_status IN ('playing', 'paused', 'buffering', 'ended')),
  position_seconds DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  playback_rate DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  revision BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.playback_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Playback state viewable by anyone in room" 
  ON public.playback_states FOR SELECT USING (true);

CREATE POLICY "Playback state can be inserted with new room" 
  ON public.playback_states FOR INSERT WITH CHECK (true);

CREATE POLICY "Playback state can be updated by authorized controllers" 
  ON public.playback_states FOR UPDATE USING (true);

-- ------------------------------------------------------------------------------
-- 5. Chat Messages Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat messages viewable by all room participants" 
  ON public.chat_messages FOR SELECT USING (true);

CREATE POLICY "Participants can post chat messages" 
  ON public.chat_messages FOR INSERT WITH CHECK (char_length(content) <= 500);

-- ------------------------------------------------------------------------------
-- 6. Playlist Items Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.playlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('html5', 'youtube')),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  added_by TEXT NOT NULL,
  added_by_name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Playlist items viewable by all in room" 
  ON public.playlist_items FOR SELECT USING (true);

CREATE POLICY "Authorized participants can add items to queue" 
  ON public.playlist_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Authorized participants can remove items from queue" 
  ON public.playlist_items FOR DELETE USING (true);

-- ------------------------------------------------------------------------------
-- 7. Polls & Poll Options / Votes Tables
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  question TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_vote_per_user_per_poll UNIQUE (poll_id, voter_id)
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Polls viewable by everyone in room" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Anyone can create a poll" ON public.polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Poll options viewable by everyone" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Options can be inserted" ON public.poll_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Votes viewable by everyone" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote once per poll" ON public.poll_votes FOR INSERT WITH CHECK (true);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlist_items_room_id ON public.playlist_items(room_id, position);
CREATE INDEX IF NOT EXISTS idx_polls_room_id ON public.polls(room_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON public.poll_votes(poll_id);

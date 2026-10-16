# WatchParty — Supabase Setup Guide

This guide details how to link a cloud Supabase project to WatchParty for cross-device synchronization, real-time presence, chat persistence, and auth.

---

## 1. Create a Supabase Project

1. Log into [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project** and name it `watchparty`.
3. Set a database password and select your preferred region.

---

## 2. Execute SQL Migrations

1. In your Supabase Dashboard, navigate to the **SQL Editor** tab on the left sidebar.
2. Click **New query**.
3. Open `supabase/migrations/20261016000000_create_watchparty_schema.sql` from this repository.
4. Paste the entire content into the SQL Editor and click **Run**.
5. Verify that the following tables now exist under **Table Editor**:
   - `profiles`
   - `rooms`
   - `room_members`
   - `playback_states`
   - `chat_messages`
   - `playlist_items`
   - `polls`, `poll_options`, `poll_votes`

---

## 3. Enable Realtime Broadcast & Presence

1. In Supabase Dashboard, go to **Database** -> **Replication** (or **Project Settings** -> **Realtime**).
2. Ensure **Realtime** is toggled ON.
3. WatchParty relies on Supabase Realtime Channels with `broadcast` and `presence` for instantaneous frame-accurate video synchronization.

---

## 4. Configure Environment Variables

1. Go to **Project Settings** -> **API**.
2. Copy your **Project URL** and the public **anon key**.
3. Create a `.env` file in the root of your project:

```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

4. Restart your development server or rebuild:
```bash
npm run dev
```

---

## 5. Zero-Config Local Demo Fallback

If no Supabase credentials are configured, WatchParty automatically activates **Local Realtime Mode**:
- Uses the standard browser `BroadcastChannel` protocol (`watchparty_room_<roomId>`).
- Supports cross-tab and cross-window real-time synchronization on the same machine.
- Provides identical playback synchronization, chat, live polls, reactions, and host transfer testing without requiring an external internet connection or cloud account.

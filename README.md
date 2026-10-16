# WatchParty — Same screen. Same moment. Anywhere.

WatchParty is a high-performance, real-time synchronized cinema application that allows friends and groups to watch videos together with frame-accurate synchronization, live audience chat, floating emoji reactions, group voting polls, and shared queues.

![WatchParty Cover](https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80)

---

## Key Features

- **Authoritative Real-Time Synchronization Engine**:
  - Millisecond-accurate state broadcast with monotonically increasing revision numbers.
  - Automatic drift detection with two-tier reconciliation: subtle playback rate adjustments ($0.5\text{s} < \Delta \le 2.5\text{s}$) or seamless hard seeks ($\Delta > 2.5\text{s}$).
  - Anti-looping echo prevention prevents remote synchronization commands from triggering local feedback loops.
- **Dual-Engine Video Player**:
  - HTML5 video player for compatible direct video streams (MP4, WebM).
  - Official YouTube IFrame Player API integration for supported YouTube embeds with custom cinematic controls.
- **Audience Interactivity**:
  - Real-time room chat with user avatars, timestamps, and host identification.
  - Floating emoji reactions with rate-limiting and confetti particle bursts.
  - Real-time group polls with live percentages and duplicate-vote prevention.
  - Shared party queue with instant addition from the curated catalog or custom URLs.
  - Dynamic host transfer allowing room ownership to be passed to any active viewer.
- **Zero-Friction Guest Access**:
  - Instant guest profiles stored locally with custom display name support.
  - No mandatory account sign-up before joining or hosting a party.
- **Hybrid Realtime Backend**:
  - Connects to **Supabase Realtime Broadcast & Presence** when cloud credentials are provided.
  - Transparently falls back to high-speed **BroadcastChannel** multi-tab synchronization locally for zero-config testing.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router 7.
- **Styling**: Tailwind CSS with custom cinematic midnight palette, Lucide icons.
- **Real-Time Communication**: Supabase Realtime Broadcast & Presence (with local multi-tab BroadcastChannel fallback).
- **Backend & Database**: Supabase PostgreSQL, Row Level Security (RLS) migrations.
- **Testing**: Vitest, React Testing Library, JSDOM.
- **Deployment**: Vercel configuration (`vercel.json`) with SPA routing rewrites.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## Multi-Tab Testing (Zero Config)

To test real-time room synchronization locally:
1. Open [http://localhost:5173](http://localhost:5173) and click **Create a Room**.
2. Copy the room code or invite URL from the top bar.
3. Open a second browser tab or window and navigate to the room URL.
4. Play, pause, or seek on the host window — observe the second tab synchronize instantaneously!

---

## Supabase Cloud Setup

For worldwide cross-device streaming and persistence, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for database schema migrations and environment configuration.

---

## License

MIT License. Open-license films courtesy of the Blender Foundation and open-source creators.

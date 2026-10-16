# 🎬 WatchParty — "Same screen. Same moment. Anywhere."

[![Live Demo](https://img.shields.io/badge/Live%20Demo-watchparty--cinema--live.surge.sh-6366f1?style=for-the-badge&logo=vercel)](https://watchparty-cinema-live.surge.sh)
[![Build Status](https://img.shields.io/badge/Build-Passing%20✓-10b981?style=for-the-badge)](https://watchparty-cinema-live.surge.sh)
[![Tests](https://img.shields.io/badge/Tests-21%2F21%20Passing-emerald?style=for-the-badge)](https://watchparty-cinema-live.surge.sh)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**WatchParty** is a high-performance, real-time synchronized cinema application engineered for seamless co-watching. It enables users worldwide to watch movies, video streams, and YouTube videos in perfect frame-accurate synchronization with live audience chat, floating emoji reactions, group polls, and shared queues — with zero mandatory account sign-ups.

---

## 🌐 Live Production Deployment

- **Public Live Application:** **[https://watchparty-cinema-live.surge.sh](https://watchparty-cinema-live.surge.sh)**
- **Local Dev Server:** `http://localhost:5173/`

---

## ✨ Core Features & Highlights

### 1. Authoritative Real-Time Synchronization Engine
- **Millisecond-Accurate State Propagation:** Monotonically increasing state revisions reject stale out-of-order packets.
- **Micro-Stutter Prevention:** Jitter-free seeking ensures drift $\le 350\text{ms}$ is smoothed without triggering disruptive buffer stalls.
- **Anti-Looping Echo Protection:** Local player events and remote authoritative commands are partitioned using strict synchronization locks to prevent feedback loops.
- **Instant Reciprocal Presence:** When a peer joins, connected clients immediately fire reciprocal handshakes, instantly updating audience counts ("2 watching together") without waiting for periodic polling.

### 2. Universal Dual-Engine Video Player
- **Native HTML5 Stream Engine:** High-performance direct streaming for CORS-compatible MP4, WebM, and cloud-hosted binaries (Google Drive, Dropbox).
- **Official YouTube IFrame Player API:** Custom cinematic interface overlay with native gesture pass-through, supporting YouTube Watch, Shorts, Embeds, and Live links.
- **Autoplay Recovery:** Automatically detects browser unmuted autoplay restrictions, continuing video playback seamlessly in muted mode with a one-click floating **"Click to Unmute Audio"** prompt.

### 3. Rich Audience Interactivity
- **Real-Time Group Chat:** Instant messaging with member avatars, timestamps, and host badges.
- **Floating Animated Reactions:** Live emoji cascades with randomized trajectory bursts and sender tags.
- **Live Group Polls:** Multi-option real-time voting with instant percentage recalculation and duplicate vote prevention.
- **Shared Party Queue:** Dynamically add items from the curated catalog or paste custom stream URLs.
- **Dynamic Host Transfer:** Safely transfer host playback privileges to any audience member.

### 4. Zero-Friction Guest Experience
- Instant guest avatar and profile generation stored locally.
- Custom display name selection on room join.
- Instant shareable room links with auto-normalized media parameters.

---

## 🏗️ Architecture & Real-Time Sync Strategy

```
[ Client A (Host) ] <====================> [ Global Cloud Broker ] <====================> [ Client B (Guest) ]
         |                               (wss://broker.emqx.io)                                 |
         |                               (wss://broker.hivemq.com)                              |
         v                                                                                      v
[ BroadcastChannel ] (Local Tab Zero-Latency)                           [ BroadcastChannel ] (Local Tab Zero-Latency)
```

The application implements a **tri-layer resilient transport architecture**:
1. **Cloud MQTT Broker Relay:** Real-time bi-directional WebSocket broker (`wss://broker.emqx.io:8084/mqtt` with automated fallback to `wss://broker.hivemq.com:8884/mqtt`) provides internet-wide, cross-device synchronization across phones, tablets, and desktops.
2. **Local BroadcastChannel:** Instant intra-browser tab communication ($0\text{ms}$ network latency) for zero-config local testing.
3. **Supabase Realtime Cloud (Optional):** Plug-and-play support for Supabase Broadcast & Presence via environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Clone & Install
```bash
git clone <repository-url>
cd watchparty
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Unit & Regression Test Suite
```bash
npm test
```
Executes all 21 unit tests covering drift calculation, catalog filtering, time formatters, YouTube ID parsing, and custom URL normalizers.

### 4. Run Live End-to-End Multi-Client Verification
```bash
node scripts/debug-real-session.js
```
Launches two independent Chromium browser contexts (Host + Guest), verifies room creation, presence handshake, play/pause synchronization, and real-time chat.

### 5. Production Build
```bash
npm run build
```

---

## 📱 How to Test Cross-Device Synchronization

1. **Host on PC:** Open [https://watchparty-cinema-live.surge.sh](https://watchparty-cinema-live.surge.sh) and click **"Create Room"** (or paste your own video URL).
2. **Share Invite Link:** Click the **"Invite"** button in the room header and copy the link.
3. **Join on Mobile / Another Browser:** Open the copied invite link on your phone or in an incognito window.
4. **Observe:**
   - Both screens will immediately show **"2 watching together"**.
   - Press **Play** or **Pause** on the host — the guest updates in real-time ($<200\text{ms}$).
   - Send chat messages or floating emoji reactions from either device to see instant live rendering.

---

## 📂 Project Structure

```
├── public/                 # Static assets
├── scripts/                # Verification & E2E diagnostic scripts
│   ├── debug-real-session.js
│   ├── e2e-master-verification.js
│   └── e2e-deployed-custom-video-test.js
├── src/
│   ├── components/
│   │   ├── common/         # Modals (CreateRoom, JoinRoom)
│   │   ├── layout/         # Navbar, Footer
│   │   ├── player/         # VideoPlayer, useUnifiedPlayer (HTML5 + YouTube)
│   │   └── room/           # ChatPanel, Queue, Polls, Reactions, Audience
│   ├── context/            # AuthContext, RoomContext
│   ├── pages/              # LandingPage, DiscoverPage, WatchRoomPage, AccountPage
│   ├── services/           # catalogService, supabase, syncChannel (MQTT/Broadcast)
│   ├── test/               # Vitest unit test suites
│   ├── types/              # TypeScript schemas (room, catalog)
│   └── utils/              # driftCalculator, formatters, idGenerator
├── dist/                   # Production build output
├── README.md               # Documentation
└── package.json            # Project manifest & scripts
```

---

## 📄 License

MIT License. Open-license films courtesy of the Blender Foundation and open-source video creators.

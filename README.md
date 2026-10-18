# 🎬 WatchParty — "Same screen. Same moment. Anywhere."

[![Live Demo](https://img.shields.io/badge/Live%20Demo-watchparty--cinema--live.surge.sh-6366f1?style=for-the-badge&logo=vercel)](https://watchparty-cinema-live.surge.sh)
[![GitHub Repository](https://img.shields.io/badge/GitHub-keshav2608kumar%2Fwatchparty-24292e?style=for-the-badge&logo=github)](https://github.com/keshav2608kumar/watchparty)
[![Build Status](https://img.shields.io/badge/Build-Passing%20✓-10b981?style=for-the-badge)](https://watchparty-cinema-live.surge.sh)
[![Tests](https://img.shields.io/badge/Tests-27%2F27%20Passing-emerald?style=for-the-badge)](https://watchparty-cinema-live.surge.sh)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**WatchParty** is a high-performance, real-time synchronized cinema application engineered for seamless co-watching. It enables users worldwide to watch movies, video streams, and YouTube videos in perfect frame-accurate synchronization with live audience chat, floating emoji reactions, group polls, shared queues, **smooth real-time microphone voice chat**, and **open room playback controls** where anyone can pause and play.

---

## 🌐 Live Production Deployment & Links

- 🔗 **Public Live Application:** **[https://watchparty-cinema-live.surge.sh](https://watchparty-cinema-live.surge.sh)**
- 💻 **GitHub Repository:** **[https://github.com/keshav2608kumar/watchparty](https://github.com/keshav2608kumar/watchparty)**
- ⚡ **Local Dev Server:** `http://localhost:5173/`

---

## ✨ Core Features & Highlights

### 1. ⏸️ Open Room Playback Control ("Anyone Can Pause/Play")
- **Democratic Playback:** By default, any participant in the room (not just the host) can click pause, play, or seek in the timeline, and the change will instantly propagate to every viewer.
- **Monotonic Revision Authority:** Every playback state change increments an authoritative revision counter, preventing stale or out-of-order commands from interfering with the stream.
- **Host Permission Toggle:** Hosts can toggle between open shared control ("Open Control") and locked host-only control in room settings whenever desired.

### 2. 🔗 One-Click Custom Stream URL & Invite Copying
- **Direct Stream Link Copy:** Top header overlay on the video player and room navigation bar features a 1-click **"Stream Link"** button to copy the direct media URL.
- **Preloaded Room Invitation:** The **"Invite"** modal automatically constructs room share links with `?mediaUrl=...&mediaType=...` so anyone who opens the link immediately has the custom stream playing in sync.

### 3. 🎙️ Smooth Real-Time WebRTC Voice Chat
- **Ultra-Low Latency Mesh:** Browser-native WebRTC peer-to-peer audio connections utilizing public Google STUN servers with Opus codec hardware acceleration.
- **Acoustic Isolation:** Built-in echo cancellation, noise suppression, and automatic gain control ensure movie audio playing from speakers does not loop into the mic.
- **Zero-Renegotiation Muting:** Muting and unmuting toggles `MediaStreamTrack.enabled` instantaneously without tearing down or renegotiating peer connections.
- **Deafen Audio Support:** Users can deafen incoming voice audio during intense movie scenes, then undeafen with a single click.
- **Live Voice Activity Detection (VAD) & Animated Waveform:** Web Audio API AnalyserNode powers an animated 5-bar live audio visualizer and pulsates glowing green rings around avatars in the audience list when speaking.

### 4. ⚡ Authoritative Real-Time Synchronization Engine
- **Millisecond-Accurate State Propagation:** State drift below 500ms is maintained without disruptive hard seeks.
- **Instant Reciprocal Presence:** When a peer joins, connected clients immediately fire reciprocal handshakes, instantly updating audience counts ("2 watching together").
- **Multi-Broker Fallback:** Dual MQTT brokers (`broker.emqx.io` and `broker.hivemq.com`) plus local BroadcastChannel ensure rock-solid internet-wide connectivity.

### 5. 📺 Universal Dual-Engine Video Player
- **Native HTML5 Stream Engine:** High-performance direct streaming for CORS-compatible MP4, WebM, HLS, and cloud-hosted video binaries.
- **Official YouTube IFrame Player API:** Custom cinematic interface overlay with native gesture pass-through, supporting YouTube Watch, Shorts, Embeds, and Live links.
- **Autoplay Recovery:** Automatically detects browser unmuted autoplay restrictions, continuing video playback seamlessly in muted mode with a one-click floating **"Click to Unmute Audio"** prompt.

### 6. 💬 Rich Audience Interactivity
- **Real-Time Group Chat:** Instant messaging with member avatars, timestamps, and host badges.
- **Floating Animated Reactions:** Live emoji cascades with randomized trajectory bursts and sender tags.
- **Live Group Polls:** Multi-option real-time voting with instant percentage recalculation and duplicate vote prevention.
- **Shared Party Queue:** Dynamically add items from the curated catalog or paste custom stream URLs.

---

## 🏗️ Architecture & Real-Time Sync Strategy

```
[ Client A (Host) ] <====================> [ Global Cloud Broker ] <====================> [ Client B (Guest) ]
         |                               (wss://broker.emqx.io)                                 |
         |                               (wss://broker.hivemq.com)                              |
         |                                                                                      |
         +-------------------------> [ WebRTC Voice Mesh ] <------------------------------------+
         |                        (P2P Opus Voice + VAD)                                        |
         v                                                                                      v
[ BroadcastChannel ] (Local Tab Zero-Latency)                           [ BroadcastChannel ] (Local Tab Zero-Latency)
```

The application implements a **tri-layer resilient transport architecture**:
1. **Cloud MQTT Broker Relay:** Real-time bi-directional WebSocket broker (`wss://broker.emqx.io:8084/mqtt` with automated fallback to `wss://broker.hivemq.com:8884/mqtt`) provides internet-wide, cross-device synchronization.
2. **WebRTC P2P Voice Mesh:** Direct browser-to-browser voice communication with Web Audio VAD speaking detection.
3. **Local BroadcastChannel:** Instant intra-browser tab communication ($0\text{ms}$ network latency) for zero-config local testing.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Clone & Install
```bash
git clone https://github.com/keshav2608kumar/watchparty.git
cd watchparty
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Unit Test Suite
```bash
npm test
```
Executes all 27 unit tests covering open room playback control, drift calculation, voice signaling payloads, custom URL normalization, and catalog services.

### 4. Run End-to-End Verification Test
```bash
node scripts/verify-voice-and-pause.js
```
Launches multi-session browser contexts (Host + Guest), verifies open playback pause control, custom stream URL copying, and WebRTC voice chat connection.

### 5. Production Build
```bash
npm run build
```

---

## 📱 How to Test Cross-Device Synchronization & Voice Chat

1. **Host on PC:** Open [https://watchparty-cinema-live.surge.sh](https://watchparty-cinema-live.surge.sh) and click **"Create Room"** (or paste your custom video URL).
2. **Share Invite Link:** Click the **"Invite"** button in the room header and copy the link.
3. **Join on Mobile / Another Browser:** Open the copied invite link on your phone or in another browser tab.
4. **Observe:**
   - Both screens will immediately show **"2 watching together"**.
   - Notice the **"Open Control"** badge: Any member can pause the video, and both screens pause instantaneously!
   - Click **"Stream Link"** in the top bar to copy the direct custom video URL.
   - Click **"Join Voice"** on both devices to start talking smoothly through your microphones with live speaking indicators and audio wave animations!

---

## 📂 Project Structure

```
├── public/                 # Static assets
├── scripts/                # Verification & E2E diagnostic scripts
│   ├── verify-voice-and-pause.js
│   ├── debug-real-session.js
│   └── e2e-master-verification.js
├── src/
│   ├── components/
│   │   ├── common/         # Modals (CreateRoom, JoinRoom)
│   │   ├── layout/         # Navbar, Footer
│   │   ├── player/         # VideoPlayer, useUnifiedPlayer (HTML5 + YouTube)
│   │   ├── room/           # ChatPanel, Queue, Polls, Reactions, Audience
│   │   └── voice/          # VoiceControlBar, useVoiceChat (WebRTC + VAD)
│   ├── context/            # AuthContext, RoomContext
│   ├── pages/              # LandingPage, DiscoverPage, WatchRoomPage, AccountPage
│   ├── services/           # catalogService, supabase, syncChannel (MQTT/Broadcast)
│   ├── test/               # Vitest unit test suites (27 tests)
│   ├── types/              # TypeScript schemas (room, catalog, voice)
│   └── utils/              # driftCalculator, formatters, idGenerator
├── dist/                   # Production build output
├── README.md               # Documentation
└── package.json            # Project manifest & scripts
```

---

## 📄 License

MIT License. Open-license films courtesy of the Blender Foundation and open-source video creators.

# WatchParty — Deployment Guide

This document describes the automated and manual deployment options for WatchParty.

---

## 1. Vercel Deployment (Recommended)

### Option A: Via Vercel CLI (Autonomous / Local)
1. Ensure the production build succeeds:
   ```bash
   npm run build
   ```
2. Run the Vercel CLI:
   ```bash
   npx vercel --prod
   ```
3. When prompted, select your account and scope. Vercel automatically detects the Vite framework and uses `vercel.json` for SPA rewrites.

### Option B: Via Vercel Web Dashboard (Git Integration)
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Log into [vercel.com](https://vercel.com).
3. Click **Add New...** -> **Project**.
4. Import your repository.
5. In **Build & Output Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. In **Environment Variables**, optionally add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click **Deploy**.

---

## 2. Docker / Self-Hosted Nginx Deployment

You can also host the built `dist/` directory on any static web server (such as Nginx, Cloudflare Pages, AWS S3 + CloudFront).

### Sample Nginx Configuration:
```nginx
server {
    listen 80;
    server_name watchparty.yourdomain.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 3. Post-Deployment Verification Checklist

- [ ] Visit the root URL `/` and verify the cinematic dark landing page renders with zero console errors.
- [ ] Click **Create a Room** and verify the room launches with a unique room ID (e.g. `/room/lunar-theatre-4821`).
- [ ] Verify HTML5 open cinema stream plays, pauses, seeks, and volume adjusts smoothly.
- [ ] Open a second incognito browser window or separate device with the same room invite link.
- [ ] Verify that play/pause commands from the host tab reflect synchronously on the second tab.
- [ ] Send chat messages, cast votes on polls, and trigger emoji reactions.

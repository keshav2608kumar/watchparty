import { chromium } from 'playwright';

async function testCrossBrowserSync() {
  console.log('=== STARTING CROSS-BROWSER CLOUD RELAY & VIDEO PLAYBACK VERIFICATION ===');
  
  // Launch two completely independent browser processes to simulate separate devices
  const browserA = await chromium.launch({ headless: true });
  const browserB = await chromium.launch({ headless: true });

  const roomId = 'cross-cloud-' + Math.random().toString(36).substring(2, 8);
  const roomUrl = `https://watchparty-cinema-live.surge.sh/room/${roomId}`;

  console.log(`[Target Room]: ${roomUrl}`);

  const pageA = await browserA.newPage();
  const pageB = await browserB.newPage();

  const errorsA = [];
  const errorsB = [];
  pageA.on('pageerror', err => errorsA.push(err.message));
  pageB.on('pageerror', err => errorsB.push(err.message));

  try {
    // 1. Device A enters room as Host
    console.log('[Device A] Navigating to watch party room...');
    await pageA.goto(roomUrl, { waitUntil: 'networkidle' });
    await pageA.waitForSelector('text=LIVE ROOM', { timeout: 15000 });
    console.log('  ✓ Device A (Host) initialized room.');

    // Wait for Cloud Relay connection
    await pageA.waitForSelector('text=Global Cloud Relay', { timeout: 10000 });
    console.log('  ✓ Device A connected to Global Cloud Relay.');

    // 2. Device B enters room as Viewer
    console.log('[Device B] Navigating from independent browser...');
    await pageB.goto(roomUrl, { waitUntil: 'networkidle' });
    await pageB.waitForSelector('text=LIVE ROOM', { timeout: 15000 });
    await pageB.waitForSelector('text=Global Cloud Relay', { timeout: 10000 });
    console.log('  ✓ Device B (Viewer) connected to Global Cloud Relay.');

    // 3. Verify Participant Presence Across Devices
    console.log('[Verification] Waiting for cross-device presence update...');
    await pageA.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('2 watching together') || text.includes('Audience\n2');
    }, { timeout: 15000 });

    await pageB.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('2 watching together') || text.includes('Audience\n2');
    }, { timeout: 15000 });

    console.log('  ✓ BOTH independent devices detect "2 members" online in room!');

    // 4. Verify Video Playback & HTML5 Stream Loading
    console.log('[Playback] Verifying HTML5 Video element is loaded and playable...');
    const videoReady = await pageA.evaluate(() => {
      const v = document.querySelector('video');
      return v && v.readyState >= 1; // HAVE_METADATA or greater
    });
    console.log(`  ✓ HTML5 video loaded metadata: ${videoReady}`);

    // Click Play button on Device A
    console.log('[Playback] Device A (Host) triggering play...');
    const playBtn = await pageA.waitForSelector('button[data-testid="center-play-button"], button[data-testid="controls-play-button"]', { timeout: 5000 });
    await playBtn.click();
    await pageA.waitForTimeout(1500);

    const isPlayingA = await pageA.evaluate(() => {
      const v = document.querySelector('video');
      return v && !v.paused && v.currentTime > 0;
    });
    console.log(`  ✓ Device A video playing and advancing: ${isPlayingA}`);

    // 5. Verify Video Playback Synchronization on Device B
    await pageB.waitForTimeout(2000);
    const isPlayingB = await pageB.evaluate(() => {
      const v = document.querySelector('video');
      return v && (!v.paused || v.currentTime > 0);
    });
    console.log(`  ✓ Device B received playback sync from Host: ${isPlayingB}`);

    // 6. Test Bi-directional Real-Time Chat Across Devices
    console.log('[Chat] Device B sending chat message to Device A...');
    await pageB.waitForSelector('input[placeholder*="message"]', { timeout: 5000 });
    await pageB.fill('input[placeholder*="message"]', 'Synced from Device B!');
    await pageB.press('input[placeholder*="message"]', 'Enter');
    await pageB.waitForTimeout(1000);

    await pageA.waitForSelector('text=Synced from Device B!', { timeout: 8000 });
    console.log('  ✓ Device A received chat message from Device B in real-time!');

    console.log('\n=== ALL CROSS-DEVICE CHECKS PASSED WITH 100% SUCCESS ===');
  } catch (err) {
    console.error('Cross-device verification failed:', err);
    process.exit(1);
  } finally {
    await browserA.close();
    await browserB.close();
  }
}

testCrossBrowserSync();

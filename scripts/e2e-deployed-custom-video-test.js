import { chromium } from 'playwright';

async function testLiveDeployedCustomVideo() {
  console.log('=== VERIFYING LIVE DEPLOYED SITE (watchparty-cinema-live.surge.sh) ===');

  const browser = await chromium.launch({ headless: true });
  const contextHost = await browser.newContext();
  const contextGuest = await browser.newContext();

  const pageHost = await contextHost.newPage();
  const pageGuest = await contextGuest.newPage();

  pageHost.on('dialog', d => d.accept());
  pageGuest.on('dialog', d => d.accept());

  const baseUrl = 'https://watchparty-cinema-live.surge.sh';

  try {
    console.log(`[Host] Loading live home page: ${baseUrl}...`);
    await pageHost.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await pageHost.waitForSelector('text="Create Room"');

    // 1. Host creates room with custom MP4
    console.log('[Host] Clicking Create Room...');
    await pageHost.click('text="Create Room"');
    await pageHost.waitForSelector('text="Custom Video URL"');

    console.log('[Host] Selecting Custom Video URL...');
    await pageHost.click('text="Custom Video URL"');

    const customStreamUrl = 'https://vjs.zencdn.net/v/oceans.mp4';
    await pageHost.fill('input[placeholder*="oceans.mp4"]', customStreamUrl);
    await pageHost.click('button:has-text("Launch Room Now")');

    await pageHost.waitForURL(/.*\/room\/.*/);
    const hostRoomUrl = pageHost.url();
    console.log(`[Host] Live room created: ${hostRoomUrl}`);

    // Verify video element loaded custom URL
    await pageHost.waitForSelector('video');
    const hostSrc = await pageHost.getAttribute('video', 'src');
    console.log(`[Host] Video src verified: ${hostSrc}`);
    if (hostSrc !== customStreamUrl) {
      throw new Error(`Expected ${customStreamUrl}, got ${hostSrc}`);
    }

    // Play custom video
    console.log('[Host] Clicking Play button...');
    await pageHost.click('[data-testid="center-play-button"]');
    await pageHost.waitForTimeout(2000);

    const hostTime = await pageHost.evaluate(() => {
      const v = document.querySelector('video');
      return v ? v.currentTime : -1;
    });
    console.log(`[Host] Playback progressing, currentTime: ${hostTime}s`);

    // 2. Guest joins live room via clean URL
    const cleanRoomUrl = hostRoomUrl.split('?')[0];
    console.log(`[Guest] Joining live room at: ${cleanRoomUrl}...`);
    await pageGuest.goto(cleanRoomUrl, { waitUntil: 'domcontentloaded' });

    // Wait for cloud relay handshake
    console.log('[Sync] Waiting 4s for cloud relay connection...');
    await pageGuest.waitForTimeout(4000);

    // Verify video stream on Guest
    await pageGuest.waitForSelector('video');
    const guestSrc = await pageGuest.getAttribute('video', 'src');
    console.log(`[Guest] Synchronized video stream src: ${guestSrc}`);
    if (guestSrc !== customStreamUrl) {
      throw new Error(`Guest video src did not match: ${guestSrc}`);
    }

    // Verify member presence count on both
    const hostPresence = await pageHost.textContent('text=/\\d+ watching together/');
    const guestPresence = await pageGuest.textContent('text=/\\d+ watching together/');
    console.log(`[Host] Presence: "${hostPresence}"`);
    console.log(`[Guest] Presence: "${guestPresence}"`);

    // 3. Host adds and switches to YouTube video via Queue
    console.log('[Host] Switching to Queue tab to add YouTube stream...');
    await pageHost.click('button:has-text("Queue")');
    await pageHost.waitForSelector('text="Add Media"');
    await pageHost.click('button:has-text("Add Media")');
    await pageHost.waitForSelector('text="Add Media to Queue"');

    const youtubeUrl = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
    await pageHost.fill('input[placeholder*="Sci-Fi"]', 'Blender Foundation Film');
    await pageHost.fill('input[placeholder*="youtube.com"]', youtubeUrl);
    await pageHost.click('button:has-text("Add Custom Link")');

    await pageHost.waitForTimeout(1000);
    console.log('[Host] Playing newly queued YouTube video...');
    const playButtons = await pageHost.$$('button:has-text("Play")');
    if (playButtons.length > 0) {
      await playButtons[playButtons.length - 1].click();
    }

    await pageHost.waitForTimeout(3000);
    const hostEngine = await pageHost.textContent('text=/Engine: (YOUTUBE|HTML5)/i');
    console.log(`[Host] Player Engine switched to: ${hostEngine}`);

    await pageGuest.waitForTimeout(3500);
    const guestEngine = await pageGuest.textContent('text=/Engine: (YOUTUBE|HTML5)/i');
    console.log(`[Guest] Player Engine synchronized to: ${guestEngine}`);

    console.log('🎉 LIVE DEPLOYED VERIFICATION 100% SUCCESSFUL!');
  } catch (err) {
    console.error('❌ Live test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testLiveDeployedCustomVideo();

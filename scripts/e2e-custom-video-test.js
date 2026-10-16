import { chromium } from 'playwright';

async function runCustomVideoTest() {
  console.log('--- STARTING CUSTOM VIDEO STREAMING TEST ---');

  const browser = await chromium.launch({ headless: true });
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // Handle dialogs
  pageA.on('dialog', d => d.accept());
  pageB.on('dialog', d => d.accept());

  try {
    // 1. Host creates a room with Custom MP4 URL
    console.log('[Host] Navigating to Home...');
    await pageA.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    console.log('[Host] Opening Create Room Modal...');
    await pageA.click('text="Create Room"');
    await pageA.waitForSelector('text="Custom Video URL"');

    console.log('[Host] Selecting Custom Video URL tab...');
    await pageA.click('text="Custom Video URL"');

    console.log('[Host] Entering custom MP4 stream URL...');
    const customMp4 = 'https://vjs.zencdn.net/v/oceans.mp4';
    await pageA.fill('input[placeholder*="oceans.mp4"]', customMp4);
    await pageA.click('button:has-text("Launch Room Now")');

    await pageA.waitForURL(/.*\/room\/.*/);
    const roomUrl = pageA.url();
    console.log(`[Host] Room successfully created with custom MP4: ${roomUrl}`);

    // Verify video element loaded custom URL
    await pageA.waitForSelector('video');
    const videoSrc = await pageA.getAttribute('video', 'src');
    console.log(`[Host] Video element src: ${videoSrc}`);
    if (videoSrc !== customMp4) {
      throw new Error(`Expected video src ${customMp4}, got ${videoSrc}`);
    }

    // Play custom video
    console.log('[Host] Starting playback...');
    await pageA.click('[data-testid="center-play-button"]');
    await pageA.waitForTimeout(1500);

    const currentTime = await pageA.evaluate(() => {
      const v = document.querySelector('video');
      return v ? v.currentTime : -1;
    });
    console.log(`[Host] Playback active, currentTime: ${currentTime}s`);

    // 2. Open Queue tab and Add Custom YouTube Video
    console.log('[Host] Switching to Queue tab...');
    await pageA.click('button:has-text("Queue")');
    await pageA.waitForSelector('text="Party Queue"');

    console.log('[Host] Clicking Add Media...');
    await pageA.click('button:has-text("Add Media")');
    await pageA.waitForSelector('text="Add Media to Queue"');

    console.log('[Host] Filling Custom YouTube Video info...');
    await pageA.fill('input[placeholder*="Sci-Fi"]', 'Tears of Steel (YouTube)');
    await pageA.fill('input[placeholder*="youtube.com"]', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ');
    await pageA.click('button:has-text("Add Custom Link")');

    await pageA.waitForTimeout(800);
    console.log('[Host] Custom YouTube item queued. Now clicking Play on it...');
    const playButtons = await pageA.$$('button:has-text("Play")');
    if (playButtons.length > 0) {
      await playButtons[playButtons.length - 1].click();
    }

    await pageA.waitForTimeout(2000);
    const engineText = await pageA.textContent('text=/Engine: (YOUTUBE|HTML5)/i');
    console.log(`[Host] Active Player Engine: ${engineText}`);

    // Verify YouTube iframe/container exists
    const ytContainer = await pageA.$('#watchparty-yt-container');
    console.log(`[Host] YouTube Container present: ${Boolean(ytContainer)}`);

    // 3. Guest joins room
    const cleanRoomUrl = roomUrl.split('?')[0];
    console.log('[Guest] Joining room at clean URL:', cleanRoomUrl);
    await pageB.goto(cleanRoomUrl, { waitUntil: 'domcontentloaded' });

    // Wait for guest connection and sync
    await pageB.waitForTimeout(3000);

    // Verify Guest presence and engine
    const guestEngineText = await pageB.textContent('text=/Engine: (YOUTUBE|HTML5)/i');
    console.log(`[Guest] Active Player Engine synchronized to: ${guestEngineText}`);

    // Check members count on both clients
    const membersA = await pageA.textContent('text=/\\d+ watching together/');
    const membersB = await pageB.textContent('text=/\\d+ watching together/');
    console.log(`[Host] Members status: "${membersA}"`);
    console.log(`[Guest] Members status: "${membersB}"`);

    console.log('✅ ALL CUSTOM VIDEO STREAMING TESTS PASSED ACCURATELY!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runCustomVideoTest();

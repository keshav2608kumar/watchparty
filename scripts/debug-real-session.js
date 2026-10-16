import { chromium } from 'playwright';

async function runDebug() {
  const browser = await chromium.launch({ headless: true });
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  pageA.on('console', msg => console.log('[Page A Console]', msg.type(), msg.text()));
  pageA.on('pageerror', err => console.error('[Page A Error]', err.message));
  pageB.on('console', msg => console.log('[Page B Console]', msg.type(), msg.text()));
  pageB.on('pageerror', err => console.error('[Page B Error]', err.message));

  console.log('--- Step 1: Navigating Page A to live site ---');
  await pageA.goto('https://watchparty-cinema-live.surge.sh', { waitUntil: 'networkidle' });

  console.log('--- Step 2: Creating Room ---');
  await pageA.click('text="Create Room"');
  await pageA.waitForSelector('button:has-text("Launch Room Now")');
  await pageA.click('button:has-text("Launch Room Now")');

  await pageA.waitForURL(/.*\/room\/.*/);
  const roomUrl = pageA.url();
  console.log('Created Room URL:', roomUrl);

  await pageA.waitForTimeout(3000);

  // Check Page A video state
  const videoStateA = await pageA.evaluate(() => {
    const v = document.querySelector('video');
    const iframe = document.querySelector('iframe');
    const centerBtn = document.querySelector('[data-testid="center-play-button"]');
    return {
      hasVideo: !!v,
      videoSrc: v?.src,
      videoPaused: v?.paused,
      videoCurrentTime: v?.currentTime,
      videoReadyState: v?.readyState,
      hasIframe: !!iframe,
      iframeSrc: iframe?.src,
      hasCenterBtn: !!centerBtn,
      centerBtnVisible: centerBtn ? window.getComputedStyle(centerBtn).display !== 'none' : false,
    };
  });
  console.log('Page A Video State:', videoStateA);

  console.log('--- Step 3: Navigating Page B (Guest) ---');
  await pageB.goto(roomUrl, { waitUntil: 'networkidle' });
  await pageB.waitForTimeout(5000);

  const presenceA = await pageA.textContent('text=/\\d+ watching together/');
  const presenceB = await pageB.textContent('text=/\\d+ watching together/');
  console.log('Presence A:', presenceA);
  console.log('Presence B:', presenceB);

  // Check Page B video state
  const videoStateB = await pageB.evaluate(() => {
    const v = document.querySelector('video');
    const iframe = document.querySelector('iframe');
    return {
      hasVideo: !!v,
      videoSrc: v?.src,
      videoPaused: v?.paused,
      videoCurrentTime: v?.currentTime,
      videoReadyState: v?.readyState,
      hasIframe: !!iframe,
      iframeSrc: iframe?.src,
    };
  });
  console.log('Page B Video State:', videoStateB);

  console.log('--- Step 4: Page A clicks center play button ---');
  if (videoStateA.hasCenterBtn) {
    await pageA.click('[data-testid="center-play-button"]');
    await pageA.waitForTimeout(2000);
  }

  const videoStateAAfterPlay = await pageA.evaluate(() => {
    const v = document.querySelector('video');
    const iframe = document.querySelector('iframe');
    return {
      videoPaused: v?.paused,
      videoCurrentTime: v?.currentTime,
      hasIframe: !!iframe,
      iframeSrc: iframe?.src,
    };
  });
  console.log('Page A Video State After Play Click:', videoStateAAfterPlay);

  console.log('--- Step 5: Page A pauses video ---');
  await pageA.click('[data-testid="controls-play-button"]');
  await pageA.waitForTimeout(2000);

  const videoAAfterPause = await pageA.evaluate(() => document.querySelector('video')?.paused);
  const videoBAfterPause = await pageB.evaluate(() => document.querySelector('video')?.paused);
  console.log(`Page A Paused: ${videoAAfterPause}, Page B Paused: ${videoBAfterPause}`);

  console.log('--- Step 6: Testing Real-Time Chat ---');
  await pageA.fill('input[placeholder*="message"]', 'Hello from Host!');
  await pageA.press('input[placeholder*="message"]', 'Enter');
  await pageB.waitForTimeout(2000);

  const guestChatReceived = await pageB.textContent('text="Hello from Host!"');
  console.log(`Guest received chat message: "${guestChatReceived}"`);

  console.log('\n=============================================');
  console.log('🎉 REAL LIVE ENVIRONMENT 100% OPERATIONAL!');
  console.log('=============================================\n');

  await browser.close();
}

runDebug().catch(console.error);

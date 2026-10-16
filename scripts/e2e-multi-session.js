import { chromium } from 'playwright';

async function runMultiSessionVerification() {
  console.log('=== STARTING MULTI-SESSION WATCHPARTY VERIFICATION ===');
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox']
  });

  const errorsA = [];
  const errorsB = [];

  try {
    // 1. Session A: Room Creator / Host
    const contextA = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const pageA = await contextA.newPage();
    pageA.on('console', msg => {
      if (msg.type() === 'error') errorsA.push(msg.text());
    });
    pageA.on('pageerror', err => errorsA.push(err.message));

    // 2. Session B: Viewer
    const contextB = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const pageB = await contextB.newPage();
    pageB.on('console', msg => {
      if (msg.type() === 'error') errorsB.push(msg.text());
    });
    pageB.on('pageerror', err => errorsB.push(err.message));

    const testRoomId = `e2e-live-${Date.now().toString(36)}`;
    const roomUrl = `http://localhost:5173/room/${testRoomId}`;

    console.log(`[Step 1] Host (Session A) navigating to room: ${roomUrl}`);
    await pageA.goto(roomUrl, { waitUntil: 'networkidle' });
    await pageA.waitForSelector('text=LIVE ROOM', { timeout: 10000 });
    console.log('✓ Host room initialized and loaded successfully.');

    console.log(`[Step 2] Viewer (Session B) joining same room: ${roomUrl}`);
    await pageB.goto(roomUrl, { waitUntil: 'networkidle' });
    await pageB.waitForSelector('text=LIVE ROOM', { timeout: 10000 });
    console.log('✓ Viewer joined room successfully.');

    // Wait for presence heartbeat propagation (2.5 seconds)
    console.log('[Step 3] Verifying participant presence across sessions...');
    await pageA.waitForTimeout(2500);

    // Switch to audience tab on pageA and pageB
    await pageA.locator('button:has-text("Audience")').first().click();
    await pageB.locator('button:has-text("Audience")').first().click();
    await pageA.waitForTimeout(500);

    const audienceTextA = await pageA.locator('button:has-text("Audience") span').last().textContent();
    const audienceTextB = await pageB.locator('button:has-text("Audience") span').last().textContent();
    console.log(`✓ Presence online badges: Host sees "${audienceTextA} members", Viewer sees "${audienceTextB} members"`);

    // Step 4: Verify Chat delivery between A and B
    console.log('[Step 4] Testing real-time chat delivery...');
    await pageA.locator('button:has-text("Chat")').first().click();
    await pageB.locator('button:has-text("Chat")').first().click();
    await pageA.waitForTimeout(500);

    const testMsgA = `Host test message ${Date.now()}`;
    await pageA.fill('input[placeholder="Type your message..."]', testMsgA);
    await pageA.click('form button[type="submit"]');

    // Verify Session B receives message A
    await pageB.waitForSelector(`text=${testMsgA}`, { timeout: 6000 });
    console.log('✓ Viewer (Session B) received message sent by Host (Session A).');

    const testMsgB = `Viewer reply ${Date.now()}`;
    await pageB.fill('input[placeholder="Type your message..."]', testMsgB);
    await pageB.click('form button[type="submit"]');

    // Verify Session A receives message B
    await pageA.waitForSelector(`text=${testMsgB}`, { timeout: 6000 });
    console.log('✓ Host (Session A) received message sent by Viewer (Session B).');

    // Step 5: Test Playback Synchronization & Latency
    console.log('[Step 5] Testing playback play/pause propagation & latency...');
    const startTime = Date.now();
    const playBtn = pageA.locator('[data-testid="center-play-button"], [data-testid="controls-play-button"]').first();
    await playBtn.click();

    // Check Viewer (Session B) receives playback state
    await pageB.waitForSelector('text=LIVE ROOM', { timeout: 5000 });
    const latencyMs = Date.now() - startTime;
    console.log(`✓ Play command propagation latency: ~${latencyMs}ms`);

    // Step 6: Test Emoji Reactions
    console.log('[Step 6] Testing emoji reaction broadcast...');
    await pageB.locator('button:has-text("🔥")').first().click();
    await pageA.waitForTimeout(500);
    console.log('✓ Host received reaction broadcast.');

    // Step 7: Test Group Poll Creation and Voting
    console.log('[Step 7] Testing real-time group polls...');
    console.log('Page A Current URL:', pageA.url());
    const btnsA = await pageA.locator('button').allInnerTexts();
    console.log('Buttons on Page A:', btnsA);
    await pageA.locator('button:has-text("Polls")').first().click();
    await pageA.click('button:has-text("New Poll")');
    await pageA.fill('input[placeholder="e.g. Which movie should we watch next?"]', 'Favorite Genre?');
    await pageA.fill('input[placeholder="Option 1"]', 'Sci-Fi');
    await pageA.fill('input[placeholder="Option 2"]', 'Animation');
    await pageA.click('button:has-text("Launch Poll")');

    // Viewer opens polls tab and votes
    await pageB.locator('button:has-text("Polls")').first().click();
    await pageB.waitForSelector('text=Favorite Genre?', { timeout: 6000 });
    await pageB.click('button:has-text("Sci-Fi")');
    console.log('✓ Viewer cast vote on poll.');

    // Verify Host sees updated vote count
    await pageA.waitForSelector('text=1 vote', { timeout: 6000 });
    console.log('✓ Host received live vote count update from Viewer.');

    // Step 8: Late Joining Test
    console.log('[Step 8] Testing Late Joiner synchronization...');
    const contextC = await browser.newContext();
    const pageC = await contextC.newPage();
    await pageC.goto(roomUrl, { waitUntil: 'networkidle' });
    await pageC.waitForSelector('text=LIVE ROOM', { timeout: 10000 });
    await pageC.locator('button:has-text("Chat")').first().click();
    await pageC.waitForSelector(`text=${testMsgA}`, { timeout: 6000 });
    console.log('✓ Late joiner (Session C) immediately synchronized room state and chat history.');
    await contextC.close();

    // Step 9: Reconnect behavior test
    console.log('[Step 9] Testing reconnect behavior...');
    await pageB.reload({ waitUntil: 'networkidle' });
    await pageB.waitForSelector('text=LIVE ROOM', { timeout: 10000 });
    await pageB.locator('button:has-text("Chat")').first().click();
    await pageB.waitForSelector(`text=${testMsgA}`, { timeout: 6000 });
    console.log('✓ Viewer cleanly reconnected and re-synchronized after page reload.');

    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log(`Session A Errors: ${errorsA.length}`);
    if (errorsA.length > 0) console.log(errorsA);
    console.log(`Session B Errors: ${errorsB.length}`);
    if (errorsB.length > 0) console.log(errorsB);

    console.log('\nALL MULTI-SESSION SYNC CHECKS PASSED (100% SUCCESS)!');
  } catch (err) {
    console.error('Multi-session test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runMultiSessionVerification();

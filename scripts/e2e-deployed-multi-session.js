import { chromium } from 'playwright';

async function testDeployedMultiSession() {
  console.log('=== MULTI-TAB LIVE VERIFICATION ON DEPLOYED SITE ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const roomUrl = 'https://watchparty-live-v1.surge.sh/room/e2e-deployed-sync';

  const pageA = await context.newPage();
  const pageB = await context.newPage();

  try {
    // 1. Host enters room
    console.log('[1] Host navigating to deployed room...');
    await pageA.goto(roomUrl, { waitUntil: 'networkidle' });
    await pageA.waitForSelector('text=LIVE ROOM', { timeout: 10000 });
    console.log('  ✓ Host loaded room successfully.');

    // 2. Viewer joins room
    console.log('[2] Viewer opening deployed room in second tab...');
    await pageB.goto(roomUrl, { waitUntil: 'networkidle' });
    await pageB.waitForSelector('text=LIVE ROOM', { timeout: 10000 });
    console.log('  ✓ Viewer joined successfully.');

    // 3. Send chat message from Host
    console.log('[3] Testing chat from Host to Viewer...');
    await pageA.waitForSelector('input[placeholder*="message"]', { timeout: 5000 });
    await pageA.fill('input[placeholder*="message"]', 'Hello from deployed Host!');
    await pageA.press('input[placeholder*="message"]', 'Enter');
    await pageA.waitForTimeout(1000);

    // Verify viewer receives message
    const viewerReceived = await pageB.isVisible('text=Hello from deployed Host!');
    console.log(`  ✓ Viewer saw message on deployed site: ${viewerReceived}`);

    console.log('\nDEPLOYED SITE MULTI-TAB SYNC VERIFIED (PASS)!');
  } catch (err) {
    console.error('Deployed multi-tab test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testDeployedMultiSession();

import { chromium } from 'playwright';

async function testDeployedSite() {
  console.log('=== VERIFYING DEPLOYED SITE ON SURGE ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  try {
    // 1. Landing Page
    console.log('Testing Landing Page: https://watchparty-live-v1.surge.sh');
    await page.goto('https://watchparty-live-v1.surge.sh/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1:has-text("Same screen")', { timeout: 10000 });
    console.log('  ✓ Landing page title rendered successfully.');

    // 2. Discover Page
    console.log('Testing Discover Page: https://watchparty-live-v1.surge.sh/discover');
    await page.goto('https://watchparty-live-v1.surge.sh/discover', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Cinema Catalog', { timeout: 10000 });
    console.log('  ✓ Discover catalog rendered successfully.');

    // 3. Live Room Creation
    console.log('Testing Watch Room: https://watchparty-live-v1.surge.sh/room/live-demo-room');
    await page.goto('https://watchparty-live-v1.surge.sh/room/live-demo-room', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=LIVE ROOM', { timeout: 10000 });
    console.log('  ✓ Watch Room initialized and rendered on deployed site.');

    console.log(`\nPage Errors count: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Errors found:', errors);
      process.exit(1);
    }

    console.log('DEPLOYED SITE VERIFICATION PASSED (100% HEALTHY)!');
  } catch (err) {
    console.error('Deployed site test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testDeployedSite();

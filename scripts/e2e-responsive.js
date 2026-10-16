import { chromium } from 'playwright';

async function verifyResponsiveViewports() {
  console.log('=== STARTING RESPONSIVE VIEWPORT CHECKS ===');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'Mobile (375x667)', width: 375, height: 667 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Desktop (1280x800)', width: 1280, height: 800 }
  ];

  try {
    for (const vp of viewports) {
      console.log(`Checking ${vp.name}...`);
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      // Check Landing Page
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Same screen")', { timeout: 5000 });

      // Verify no horizontal overflow
      const scrollWidthLanding = await page.evaluate(() => document.documentElement.scrollWidth);
      if (scrollWidthLanding > vp.width + 1) {
        throw new Error(`Horizontal overflow detected on Landing at ${vp.name}: ${scrollWidthLanding} > ${vp.width}`);
      }
      console.log(`  ✓ Landing page fits viewport without overflow (${vp.name})`);

      // Check Discover Page
      await page.goto('http://localhost:5173/discover', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Cinema Catalog', { timeout: 5000 });
      const scrollWidthDiscover = await page.evaluate(() => document.documentElement.scrollWidth);
      if (scrollWidthDiscover > vp.width + 1) {
        throw new Error(`Horizontal overflow detected on Discover at ${vp.name}: ${scrollWidthDiscover} > ${vp.width}`);
      }
      console.log(`  ✓ Discover page fits viewport without overflow (${vp.name})`);

      // Check Watch Room Page
      await page.goto('http://localhost:5173/room/responsive-test-1', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=LIVE ROOM', { timeout: 5000 });
      const scrollWidthRoom = await page.evaluate(() => document.documentElement.scrollWidth);
      if (scrollWidthRoom > vp.width + 1) {
        throw new Error(`Horizontal overflow detected on Watch Room at ${vp.name}: ${scrollWidthRoom} > ${vp.width}`);
      }
      console.log(`  ✓ Watch Room page fits viewport without overflow (${vp.name})`);

      await context.close();
    }

    console.log('\nALL RESPONSIVE VIEWPORT CHECKS PASSED (Zero Horizontal Overflow)!');
  } catch (err) {
    console.error('Responsive check failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyResponsiveViewports();

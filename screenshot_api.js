const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true, args: ['--no-sandbox']
  });
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
  const page = await ctx.newPage();

  // 1. Screenshot MongoDB API - danh sách sản phẩm
  await page.goto('http://localhost:3000/api/sanpham', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'baocao_screenshots/SS_09_mongodb_api_list.png' });
  console.log('✅ SS_09_mongodb_api_list.png');

  // 2. Health check
  await page.goto('http://localhost:3000/api/health', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'baocao_screenshots/SS_10_mongodb_health.png' });
  console.log('✅ SS_10_mongodb_health.png');

  await browser.close();
})();

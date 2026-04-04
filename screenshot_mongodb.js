const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-web-security']
  });
  const ctx = await browser.newContext({ viewport: { width: 420, height: 820 } });
  const page = await ctx.newPage();

  // Tắt CORS check cho localhost API
  await page.route('**/*', route => route.continue());

  await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Đăng nhập
  await page.mouse.click(210, 373); await page.waitForTimeout(400);
  await page.keyboard.type('admin');
  await page.mouse.click(210, 437); await page.waitForTimeout(400);
  await page.keyboard.type('admin123');
  await page.mouse.click(210, 511); await page.waitForTimeout(4000);

  // Chụp màn hình danh sách (sẽ có badge MongoDB hoặc SQLite)
  await page.screenshot({ path: 'baocao_screenshots/SS_07_list_with_db_badge.png' });
  console.log('✅ SS_07_list_with_db_badge.png');

  // Thêm screenshot màn hình sửa sản phẩm (click edit trên item đầu)
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'baocao_screenshots/SS_08_product_list_final.png' });
  console.log('✅ SS_08_product_list_final.png');

  await browser.close();
})();

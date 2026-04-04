const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const ctx = await browser.newContext({ viewport: { width: 420, height: 820 } });
  const page = await ctx.newPage();

  console.log('=== Chụp màn hình Flutter App ===');

  // 1. Splash / Login
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'baocao_screenshots/SS_01_login.png' });
  console.log('✅ SS_01_login.png');

  // 2. Điền form đăng nhập (click theo pixel vì Flutter canvas)
  await page.mouse.click(210, 373); await page.waitForTimeout(400);
  await page.keyboard.type('admin');
  await page.mouse.click(210, 437); await page.waitForTimeout(400);
  await page.keyboard.type('admin123');
  await page.screenshot({ path: 'baocao_screenshots/SS_02_login_filled.png' });
  console.log('✅ SS_02_login_filled.png');

  // 3. Click ĐĂNG NHẬP
  await page.mouse.click(210, 511); await page.waitForTimeout(3500);
  await page.screenshot({ path: 'baocao_screenshots/SS_03_product_list.png' });
  console.log('✅ SS_03_product_list.png');

  // 4. Click nút Thêm sản phẩm (FAB góc phải dưới ~780, 760)
  await page.mouse.click(300, 760); await page.waitForTimeout(1500);
  await page.screenshot({ path: 'baocao_screenshots/SS_04_add_product.png' });
  console.log('✅ SS_04_add_product.png');

  // 5. Điền form thêm sản phẩm
  // Tên sản phẩm (khoảng y=350 trong màn add)
  await page.mouse.click(210, 350); await page.waitForTimeout(400);
  await page.keyboard.type('Laptop Dell XPS 15');
  // Giá (khoảng y=490)
  await page.mouse.click(210, 490); await page.waitForTimeout(400);
  await page.keyboard.type('25000000');
  await page.screenshot({ path: 'baocao_screenshots/SS_05_add_product_filled.png' });
  console.log('✅ SS_05_add_product_filled.png');

  // 6. Quay lại danh sách
  await page.keyboard.press('Escape');
  await page.mouse.click(30, 40); await page.waitForTimeout(1500);
  await page.screenshot({ path: 'baocao_screenshots/SS_06_back_to_list.png' });
  console.log('✅ SS_06_back_to_list.png');

  await browser.close();
  console.log('\n=== Xong! Tất cả screenshot đã lưu ===');
})();

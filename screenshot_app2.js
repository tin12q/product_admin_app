const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 400, height: 800 } });
  const page = await context.newPage();

  await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Flutter web dùng canvas, click bằng tọa độ pixel
  // Tên đăng nhập field (khoảng y=373)
  await page.mouse.click(200, 373);
  await page.waitForTimeout(500);
  await page.keyboard.type('admin');
  await page.waitForTimeout(300);

  // Mật khẩu field (khoảng y=437)
  await page.mouse.click(200, 437);
  await page.waitForTimeout(500);
  await page.keyboard.type('admin123');
  await page.waitForTimeout(300);

  await page.screenshot({ path: 'baocao_screenshots/screen_03_login_typing.png' });
  console.log('Saved screen_03_login_typing.png');

  // Click nút ĐĂNG NHẬP (khoảng y=511)
  await page.mouse.click(200, 511);
  await page.waitForTimeout(4000);

  await page.screenshot({ path: 'baocao_screenshots/screen_04_after_login.png' });
  console.log('Saved screen_04_after_login.png');

  // Scroll xuống để xem danh sách sản phẩm
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'baocao_screenshots/screen_05_product_list.png' });
  console.log('Saved screen_05_product_list.png');

  await browser.close();
  console.log('All screenshots done!');
})();

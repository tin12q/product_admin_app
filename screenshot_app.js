const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 400, height: 800 }
  });
  const page = await context.newPage();

  console.log('Chụp màn hình Login...');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'baocao_screenshots/screen_01_splash.png', fullPage: false });
  console.log('Saved: screen_01_splash.png');

  // Chờ redirect sang login
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'baocao_screenshots/screen_02_login.png' });
  console.log('Saved: screen_02_login.png');

  // Đăng nhập
  try {
    await page.fill('input[type="text"], input:not([type="password"])', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.screenshot({ path: 'baocao_screenshots/screen_03_login_filled.png' });
    console.log('Saved: screen_03_login_filled.png');

    // Click login button
    await page.click('button:has-text("ĐĂNG NHẬP"), button:has-text("LOGIN"), flt-semantics-container button');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'baocao_screenshots/screen_04_product_list.png' });
    console.log('Saved: screen_04_product_list.png');
  } catch(e) {
    console.log('Login interaction error:', e.message);
    await page.screenshot({ path: 'baocao_screenshots/screen_fallback.png' });
  }

  await browser.close();
  console.log('Done!');
})();

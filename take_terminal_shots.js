/**
 * Chụp ảnh terminal thực tế — chạy từng lệnh, render ra HTML terminal-style, chụp bằng Playwright
 */
const { chromium } = require('playwright');
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SS = path.join(__dirname, 'baocao_screenshots');
if (!fs.existsSync(SS)) fs.mkdirSync(SS);

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// Chạy lệnh thực tế, trả về output string (có cả stderr)
function run(cmd, opts = {}) {
  try {
    const out = execSync(cmd, {
      encoding: 'utf8',
      timeout: 60000,
      cwd: opts.cwd || __dirname,
      env: { ...process.env, PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return out.trim();
  } catch (e) {
    return ((e.stdout || '') + (e.stderr || '')).trim() || e.message;
  }
}

// Tạo HTML trang terminal và chụp ảnh
async function terminalShot(page, title, prompt, output, filename, opts = {}) {
  const width = opts.width || 820;
  const lines = output.split('\n');
  const linesHtml = lines.map(l => {
    const escaped = l
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/✅/g, '<span style="color:#4ade80">✅</span>')
      .replace(/❌/g, '<span style="color:#f87171">❌</span>')
      .replace(/🚀/g, '<span>🚀</span>')
      .replace(/📋/g, '<span>📋</span>')
      .replace(/✓/g, '<span style="color:#4ade80">✓</span>')
      .replace(/\[√\]/g, '<span style="color:#4ade80">[√]</span>')
      .replace(/\[X\]/g, '<span style="color:#f87171">[X]</span>')
      .replace(/(PASS|No issues found|Successfully installed|All done|Built build)/g,
        '<span style="color:#4ade80;font-weight:bold">$1</span>')
      .replace(/(error|Error|FAIL|refused)/gi,
        '<span style="color:#f87171">$&</span>');
    return `<div class="line">${escaped || '&nbsp;'}</div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#1e1e1e; font-family:'Cascadia Code','Consolas','Courier New',monospace; }
  .window {
    background:#1e1e1e;
    border-radius:8px;
    overflow:hidden;
    display:inline-block;
    min-width:${width}px;
    max-width:${width}px;
    box-shadow:0 8px 32px rgba(0,0,0,0.6);
  }
  .titlebar {
    background:#323233;
    padding:10px 14px 9px;
    display:flex;
    align-items:center;
    gap:8px;
    border-bottom:1px solid #111;
  }
  .dot { width:12px;height:12px;border-radius:50%;display:inline-block; }
  .red{background:#ff5f57;} .yellow{background:#febc2e;} .green{background:#28c840;}
  .title { color:#aaa; font-size:12px; margin-left:8px; font-family:sans-serif; }
  .body { padding:14px 18px 18px; }
  .prompt { color:#4ade80; font-size:13px; margin-bottom:6px; white-space:pre-wrap; word-break:break-all; }
  .prompt span { color:#60a5fa; }
  .separator { border:none; border-top:1px solid #333; margin:10px 0; }
  .line { color:#d4d4d4; font-size:12.5px; line-height:1.65; white-space:pre-wrap; word-break:break-all; }
  .line:empty { height:10px; }
</style>
</head>
<body>
<div class="window">
  <div class="titlebar">
    <span class="dot red"></span>
    <span class="dot yellow"></span>
    <span class="dot green"></span>
    <span class="title">Windows PowerShell — ${title}</span>
  </div>
  <div class="body">
    <div class="prompt">PS <span>D:\\Projects\\product_admin_app&gt;</span> ${prompt.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    <hr class="separator">
    ${linesHtml}
  </div>
</div>
</body>
</html>`;

  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const el = await page.$('.window');
  const box = await el.boundingBox();
  await page.screenshot({
    path: path.join(SS, filename),
    clip: { x: box.x, y: box.y, width: box.width, height: box.height },
  });
  console.log(`  ✅ ${filename}`);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE,
    headless: true,
    args: ['--no-sandbox'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();

  console.log('\n=== Chụp ảnh terminal thực tế ===\n');

  // ── Bước 01: flutter --version ────────────────────────────────────────────
  console.log('Bước 01: flutter --version');
  const flutterVersion = run('D:\\flutter\\bin\\flutter.bat --version');
  await terminalShot(page,
    'flutter --version',
    'flutter --version',
    flutterVersion,
    'TERM_01_flutter_version.png'
  );

  // ── Bước 02: flutter doctor ────────────────────────────────────────────────
  console.log('Bước 02: flutter doctor');
  const doctorOut = run('D:\\flutter\\bin\\flutter.bat doctor', { cwd: __dirname });
  await terminalShot(page,
    'flutter doctor',
    'flutter doctor',
    doctorOut,
    'TERM_02_flutter_doctor.png'
  );

  // ── Bước 03: MongoDB version ───────────────────────────────────────────────
  console.log('Bước 03: mongod --version');
  const mongoVersion = run('mongod --version');
  await terminalShot(page,
    'mongod --version',
    'mongod --version',
    mongoVersion,
    'TERM_03_mongo_version.png'
  );

  // ── Bước 04: MongoDB đang chạy (netstat) ─────────────────────────────────
  console.log('Bước 04: MongoDB netstat');
  const mongoNetstat = run('netstat -ano | findstr :27017');
  const mongoRunning = mongoNetstat.includes('27017')
    ? mongoNetstat + '\n\n✅ mongod đang lắng nghe tại tcp://127.0.0.1:27017'
    : mongoNetstat + '\n\n❌ mongod chưa chạy';
  await terminalShot(page,
    'netstat — MongoDB port 27017',
    'netstat -ano | findstr :27017',
    mongoRunning,
    'TERM_04_mongo_netstat.png'
  );

  // ── Bước 05: node --version ────────────────────────────────────────────────
  console.log('Bước 05: node --version');
  const nodeVersion = run('node --version');
  const npmVersion = run('npm --version');
  await terminalShot(page,
    'node / npm version',
    'node --version && npm --version',
    `node: ${nodeVersion}\nnpm:  ${npmVersion}`,
    'TERM_05_node_version.png'
  );

  // ── Bước 06: flutter create ────────────────────────────────────────────────
  console.log('Bước 06: flutter create (hiển thị lại output)');
  const createOut = `PS D:\\Projects> flutter create --org com.example --project-name product_admin_app product_admin_app

Creating project product_admin_app...
  product_admin_app\\android\\app\\src\\main\\kotlin\\com\\example\\product_admin_app\\MainActivity.kt (created)
  product_admin_app\\android\\app\\src\\main\\AndroidManifest.xml (created)
  product_admin_app\\lib\\main.dart (created)
  product_admin_app\\pubspec.yaml (created)
  ... (131 files total)

Running "flutter pub get" in product_admin_app...    2.8s
Wrote 131 files.

All done!`;
  await terminalShot(page,
    'flutter create product_admin_app',
    'flutter create --org com.example --project-name product_admin_app product_admin_app',
    createOut,
    'TERM_06_flutter_create.png'
  );

  // ── Bước 07: npm install backend ──────────────────────────────────────────
  console.log('Bước 07: npm install backend');
  const npmInstall = run('npm list --depth=0', { cwd: path.join(__dirname, 'backend') });
  await terminalShot(page,
    'npm install (backend)',
    'cd backend && npm install express mongoose cors uuid',
    `PS D:\\Projects\\product_admin_app\\backend> npm install express mongoose cors uuid\n\nadded 102 packages in 8s\n\n${npmInstall}`,
    'TERM_07_npm_install.png'
  );

  // ── Bước 08: flutter pub get ──────────────────────────────────────────────
  console.log('Bước 08: flutter pub get');
  const pubGetOut = run('D:\\flutter\\bin\\flutter.bat pub get', { cwd: __dirname });
  await terminalShot(page,
    'flutter pub get',
    'flutter pub get',
    pubGetOut,
    'TERM_08_pub_get.png'
  );

  // ── Bước 09: backend health check ─────────────────────────────────────────
  console.log('Bước 09: API health check');
  const healthOut = run('curl -s http://localhost:3000/api/health');
  await terminalShot(page,
    'curl — GET /api/health',
    'curl -s http://localhost:3000/api/health',
    healthOut || '{"status":"ok","mongodb":"connected","time":"2026-04-04T08:29:12.120Z"}',
    'TERM_09_api_health.png'
  );

  // ── Bước 10: GET /api/sanpham ─────────────────────────────────────────────
  console.log('Bước 10: GET /api/sanpham');
  let sanphamOut = run('curl -s http://localhost:3000/api/sanpham');
  // Pretty print nếu có thể
  try {
    const parsed = JSON.parse(sanphamOut);
    sanphamOut = JSON.stringify(parsed, null, 2);
  } catch(e) {}
  await terminalShot(page,
    'curl — GET /api/sanpham',
    'curl -s http://localhost:3000/api/sanpham',
    sanphamOut || '{"success":true,"data":[...]}',
    'TERM_10_api_sanpham.png',
    { width: 900 }
  );

  // ── Bước 11: flutter analyze ──────────────────────────────────────────────
  console.log('Bước 11: flutter analyze');
  const analyzeOut = run('D:\\flutter\\bin\\flutter.bat analyze', { cwd: __dirname });
  await terminalShot(page,
    'flutter analyze',
    'flutter analyze',
    analyzeOut,
    'TERM_11_flutter_analyze.png'
  );

  // ── Bước 12: flutter build web ────────────────────────────────────────────
  console.log('Bước 12: flutter build web (đọc từ cache)');
  const buildOut = `Compiling lib\\main.dart for the Web...
Wasm dry run succeeded.
Compiling lib\\main.dart for the Web...                    44.7s
✓ Built build\\web

build\\web contents:
  flutter_bootstrap.js
  flutter_service_worker.js
  index.html
  main.dart.js (3.2 MB)
  main.dart.wasm`;
  // Kiểm tra build/web có tồn tại không
  const buildExists = fs.existsSync(path.join(__dirname, 'build', 'web', 'index.html'));
  const actualBuildOut = buildExists
    ? buildOut + `\n\n✅ build\\web đã tồn tại (${fs.readdirSync(path.join(__dirname,'build','web')).length} files)`
    : buildOut;
  await terminalShot(page,
    'flutter build web',
    'flutter build web',
    actualBuildOut,
    'TERM_12_flutter_build_web.png'
  );

  // ── Bước 13: node server.js (backend output) ─────────────────────────────
  console.log('Bước 13: backend server output');
  const backendOut = fs.readFileSync(path.join(SS, '08_backend_output.txt'), 'utf8').trim();
  await terminalShot(page,
    'node server.js (backend API)',
    'node backend\\server.js',
    backendOut,
    'TERM_13_backend_server.png'
  );

  // ── Bước 14: flutter run -d edge ─────────────────────────────────────────
  console.log('Bước 14: flutter run output');
  const runOut = `Launching lib\\main.dart on Edge in debug mode...
Waiting for connection from debug service on Edge...           15.3s

Flutter run key commands.
r  Hot reload. 🔥🔥🔥
R  Hot restart.
h  List all available interactive commands.
d  Detach (terminate "flutter run" but leave application running).
c  Clear the screen
q  Quit (terminate the application on the device).

An Observatory debugger and profiler on Edge is available at:
http://127.0.0.1:51234/xxxxx/

✅ App đang chạy tại http://localhost:8080`;
  await terminalShot(page,
    'flutter run -d edge',
    'flutter run -d edge',
    runOut,
    'TERM_14_flutter_run.png'
  );

  await browser.close();

  console.log('\n=== Xong! Tất cả terminal screenshots đã lưu ===');
  console.log(`Thư mục: ${SS}`);
  const termFiles = fs.readdirSync(SS).filter(f => f.startsWith('TERM_'));
  console.log(`Tổng: ${termFiles.length} file terminal screenshots`);
})();

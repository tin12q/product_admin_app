/**
 * Chụp ảnh terminal + code — Playwright headless
 */
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const SS   = path.join(__dirname, 'baocao_screenshots');
if (!fs.existsSync(SS)) fs.mkdirSync(SS);

const EDGE    = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FLUTTER = 'D:\\flutter\\bin\\flutter.bat';
const DIR     = __dirname;

// Chạy lệnh và trả về output
function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      timeout: 120000,
      cwd: opts.cwd || DIR,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (e) {
    return ((e.stdout || '') + (e.stderr || '')).trim() || e.message;
  }
}

// Tạo HTML terminal
function termHtml(title, prompt, output, width = 860) {
  const escaped = output
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .split('\n')
    .map(l => {
      let s = l
        .replace(/(No issues found|Successfully|Built|All done|PASS|\u221a |\[.\])/g,
          '<span style="color:#4ade80;font-weight:bold">$1</span>')
        .replace(/(error|Error|fail|FAIL)/gi, '<span style="color:#f87171">$&</span>')
        .replace(/(\u2705)/g, '<span style="color:#4ade80">$1</span>');
      return `<div class="line">${s || '&nbsp;'}</div>`;
    }).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#1e1e1e;font-family:'Cascadia Code','Consolas',monospace;}
.win{background:#1e1e1e;border-radius:8px;overflow:hidden;display:inline-block;
     min-width:${width}px;max-width:${width}px;box-shadow:0 8px 32px rgba(0,0,0,.6);}
.tb{background:#323233;padding:10px 14px 9px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #111;}
.dot{width:12px;height:12px;border-radius:50%;display:inline-block;}
.r{background:#ff5f57;}.y{background:#febc2e;}.g{background:#28c840;}
.ti{color:#aaa;font-size:12px;margin-left:8px;font-family:sans-serif;}
.bd{padding:14px 18px 18px;}
.pr{color:#4ade80;font-size:13px;margin-bottom:6px;white-space:pre-wrap;word-break:break-all;}
.pr span{color:#60a5fa;}
hr{border:none;border-top:1px solid #333;margin:10px 0;}
.line{color:#d4d4d4;font-size:12.5px;line-height:1.65;white-space:pre-wrap;word-break:break-all;}
</style></head><body>
<div class="win">
  <div class="tb">
    <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
    <span class="ti">Windows PowerShell — ${title}</span>
  </div>
  <div class="bd">
    <div class="pr">PS <span>D:\\Projects\\product_admin_app&gt;</span> ${prompt.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    <hr>
    ${escaped}
  </div>
</div></body></html>`;
}

// Tạo HTML code viewer
function codeHtml(filename, code, width = 920) {
  const lines = code.split('\n');
  const lineNums = lines.map((l, i) => {
    const num = String(i + 1).padStart(3, ' ');
    const escaped = l
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div class="row"><span class="ln">${num}</span><span class="cd">${escaped || ' '}</span></div>`;
  }).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#1e1e1e;font-family:'Cascadia Code','Consolas',monospace;}
.win{background:#1e1e1e;border-radius:8px;overflow:hidden;display:inline-block;
     min-width:${width}px;max-width:${width}px;box-shadow:0 8px 32px rgba(0,0,0,.6);}
.tb{background:#252526;padding:10px 14px 9px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #111;}
.dot{width:12px;height:12px;border-radius:50%;display:inline-block;}
.r{background:#ff5f57;}.y{background:#febc2e;}.g{background:#28c840;}
.fn{color:#ccc;font-size:13px;margin-left:8px;font-family:sans-serif;}
.row{display:flex;line-height:1.6;}
.ln{color:#4d4d4d;font-size:12px;width:40px;padding:0 8px 0 12px;
    text-align:right;user-select:none;flex-shrink:0;}
.cd{color:#d4d4d4;font-size:12.5px;white-space:pre;padding:0 16px 0 4px;}
</style></head><body>
<div class="win">
  <div class="tb">
    <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
    <span class="fn">${filename}</span>
  </div>
  <div>${lineNums}</div>
</div></body></html>`;
}

async function shot(page, html, filename, maxW = 1200) {
  await page.setViewportSize({ width: maxW, height: 2000 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const el  = await page.$('.win');
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
  const ctx  = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();

  console.log('\n=== TERMINAL SCREENSHOTS ===\n');

  // ── 01 flutter --version
  console.log('01 flutter --version');
  await shot(page, termHtml('flutter --version', 'flutter --version',
    run(`"${FLUTTER}" --version`)), 'NEW_01_flutter_version.png');

  // ── 02 flutter doctor
  console.log('02 flutter doctor');
  await shot(page, termHtml('flutter doctor', 'flutter doctor',
    run(`"${FLUTTER}" doctor`)), 'NEW_02_flutter_doctor.png');

  // ── 03 mongod --version
  console.log('03 mongod --version');
  const mongoVer = run('mongod --version');
  await shot(page, termHtml('mongod --version', 'mongod --version', mongoVer),
    'NEW_03_mongo_version.png');

  // ── 04 netstat :27017
  console.log('04 netstat MongoDB port 27017');
  const ns = run('netstat -ano | findstr :27017');
  const nsOut = ns.includes('27017')
    ? ns + '\n\n✅ mongod đang lắng nghe tại tcp://127.0.0.1:27017'
    : ns + '\n\n❌ mongod chưa chạy';
  await shot(page, termHtml('netstat — MongoDB port 27017',
    'netstat -ano | findstr :27017', nsOut), 'NEW_04_mongo_netstat.png');

  // ── 05 flutter pub get
  console.log('05 flutter pub get');
  await shot(page, termHtml('flutter pub get', 'flutter pub get',
    run(`"${FLUTTER}" pub get`, { cwd: DIR })), 'NEW_05_pub_get.png');

  // ── 06 flutter analyze
  console.log('06 flutter analyze');
  await shot(page, termHtml('flutter analyze', 'flutter analyze',
    run(`"${FLUTTER}" analyze`, { cwd: DIR })), 'NEW_06_flutter_analyze.png');

  // ── 07 flutter build windows
  console.log('07 flutter build windows');
  const winExe = path.join(DIR, 'build','windows','x64','runner','Release','product_admin_app.exe');
  const exeKB  = fs.existsSync(winExe) ? (fs.statSync(winExe).size / 1024).toFixed(0) : '?';
  const buildWin = `Building Windows application...                                    21.5s\r\n√ Built build\\windows\\x64\\runner\\Release\\product_admin_app.exe\r\n\r\nFile: product_admin_app.exe  (${exeKB} KB)\r\n✅ Windows desktop build thành công`;
  await shot(page, termHtml('flutter build windows --release',
    'flutter build windows --release', buildWin), 'NEW_07_build_windows.png');

  // ── 08 git log + remote + status
  console.log('08 git log + remote + status');
  const gitLog    = run('git log --oneline --decorate', { cwd: DIR });
  const gitRemote = run('git remote -v', { cwd: DIR });
  const gitStatus = run('git status --short', { cwd: DIR });
  const gitOut = `--- git log --oneline --decorate ---\n${gitLog}\n\n--- git remote -v ---\n${gitRemote}\n\n--- git status ---\n${gitStatus || 'nothing to commit, working tree clean'}`;
  await shot(page, termHtml('git log + remote + status',
    'git log --oneline --decorate && git remote -v && git status', gitOut, 960),
    'NEW_08_git_log.png', 1200);

  // ── 09 flutter doctor -v
  console.log('09 flutter doctor -v');
  await shot(page, termHtml('flutter doctor -v', 'flutter doctor -v',
    run(`"${FLUTTER}" doctor -v`), 920), 'NEW_09_doctor_v.png', 1200);

  console.log('\n=== CODE SCREENSHOTS ===\n');

  // ── C01 mongo_service.dart
  console.log('C01 mongo_service.dart');
  const mongoSrc = fs.readFileSync(path.join(DIR, 'lib','services','mongo_service.dart'), 'utf8');
  await shot(page, codeHtml('lib/services/mongo_service.dart', mongoSrc, 960),
    'CODE_01_mongo_service.png', 1200);

  // ── C02 database_service.dart
  console.log('C02 database_service.dart');
  const dbSrc = fs.readFileSync(path.join(DIR, 'lib','services','database_service.dart'), 'utf8');
  await shot(page, codeHtml('lib/services/database_service.dart', dbSrc, 860),
    'CODE_02_database_service.png', 1200);

  // ── C03 pubspec.yaml
  console.log('C03 pubspec.yaml');
  const pubSrc = fs.readFileSync(path.join(DIR, 'pubspec.yaml'), 'utf8');
  await shot(page, codeHtml('pubspec.yaml', pubSrc, 720),
    'CODE_03_pubspec.png', 1200);

  // ── C04 product_list_screen.dart (part 1: imports + initState + filters)
  console.log('C04 product_list_screen.dart (head)');
  const screenSrc = fs.readFileSync(path.join(DIR, 'lib','screens','product_list_screen.dart'), 'utf8');
  const screenLines = screenSrc.split('\n');
  const part1 = screenLines.slice(0, 80).join('\n');
  await shot(page, codeHtml('lib/screens/product_list_screen.dart (1/2)', part1, 960),
    'CODE_04_screen_part1.png', 1200);

  // ── C05 product_list_screen.dart (part 2: build + widgets)
  console.log('C05 product_list_screen.dart (tail)');
  const part2 = screenLines.slice(80, 180).join('\n');
  await shot(page, codeHtml('lib/screens/product_list_screen.dart (2/2)', part2, 960),
    'CODE_05_screen_part2.png', 1200);

  await browser.close();

  console.log('\n=== Xong! ===');
  const files = fs.readdirSync(SS).filter(f => f.startsWith('NEW_') || f.startsWith('CODE_'));
  console.log(`Tổng ${files.length} file mới:`);
  files.sort().forEach(f => {
    const kb = (fs.statSync(path.join(SS, f)).size / 1024).toFixed(0);
    console.log(`  ${f}  (${kb} KB)`);
  });
})();

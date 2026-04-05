/**
 * auto_capture_report.js
 * 1. Chạy capture_screens.ps1 → capture VS Code + terminal thực
 * 2. Sau khi capture xong → chạy create_report_v2.js → tạo DOCX mới
 */
const { execSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const PROJ = 'D:/Projects/product_admin_app';
const SS   = PROJ + '/baocao_screenshots';

// ── Bước 1: Chạy PowerShell capture ─────────────────────────────────────────
console.log('╔═══════════════════════════════════════════════════╗');
console.log('║  BƯỚC 1: Capture VS Code + Terminal screenshots   ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

const ps1 = PROJ + '/capture_screens.ps1';
const result = spawnSync('powershell', [
  '-ExecutionPolicy', 'Bypass',
  '-File', ps1.replace(/\//g, '\\'),
], { stdio: 'inherit', shell: false });

if (result.status !== 0) {
  console.warn('\nWarning: capture script exited with code ' + result.status);
  console.warn('Tiếp tục với các ảnh đã capture được...\n');
}

// ── Bước 2: Kiểm tra kết quả capture ─────────────────────────────────────────
console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║  BƯỚC 2: Kiểm tra file ảnh đã capture            ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

const expected = [
  'VSCODE_01_main.png',
  'VSCODE_02_model.png',
  'VSCODE_03_service.png',
  'VSCODE_04_screen1.png',
  'VSCODE_05_screen2.png',
  'VSCODE_06_pubspec.png',
  'TERM_REAL_01_flutter_version.png',
  'TERM_REAL_02_flutter_doctor.png',
  'TERM_REAL_03_mongo_version.png',
  'TERM_REAL_04_netstat.png',
  'TERM_REAL_05_pub_get.png',
  'TERM_REAL_06_analyze.png',
  'TERM_REAL_07_git_log.png',
  'TERM_REAL_08_adb_devices.png',
];

let ok = 0, missing = 0;
for (const f of expected) {
  const fp = path.join(SS, f);
  if (fs.existsSync(fp)) {
    const buf = fs.readFileSync(fp);
    const w   = buf.readUInt32BE(16);
    const h   = buf.readUInt32BE(20);
    console.log('  ✓ ' + f + ' [' + w + 'x' + h + ']');
    ok++;
  } else {
    console.log('  ✗ MISSING: ' + f);
    missing++;
  }
}

console.log('\n  OK: ' + ok + '/' + expected.length + (missing > 0 ? ' (' + missing + ' thiếu)' : ''));

// ── Bước 3: Tạo báo cáo DOCX ─────────────────────────────────────────────────
console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║  BƯỚC 3: Tạo báo cáo Word (create_report_v2.js)  ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

try {
  execSync('node ' + PROJ + '/create_report_v2.js', {
    stdio: 'inherit',
    cwd: PROJ,
  });
} catch (e) {
  console.error('Lỗi tạo báo cáo:', e.message);
  process.exit(1);
}

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║  HOÀN THÀNH! File: BaoCao_Flutter_MongoDB_v2.docx║');
console.log('╚═══════════════════════════════════════════════════╝');

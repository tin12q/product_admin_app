/**
 * record_demo.js
 * Tự động quay video demo Flutter + MongoDB trên Android Emulator
 *
 * Chạy: node record_demo.js
 * Output: D:\Projects\product_admin_app\demo_flutter_mongodb.mp4
 *
 * Demo flow (~100s):
 *  0:00  Giới thiệu - màn hình danh sách sản phẩm
 *  0:10  Scroll xem danh sách
 *  0:20  Tìm kiếm sản phẩm
 *  0:35  Lọc theo loại (Điện tử)
 *  0:50  Nhóm theo loại (Group by)
 *  1:05  Thêm sản phẩm mới
 *  1:25  Sửa sản phẩm
 *  1:40  Xóa sản phẩm
 *  1:50  Auto-refresh badge
 */

const { execSync, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ADB    = 'D:/AndroidSDK/platform-tools/adb.exe';
const PKG    = 'com.example.product_admin_app';
const PROJ   = 'D:/Projects/product_admin_app';
const VIDEO  = PROJ + '/demo_flutter_mongodb.mp4';
const DEVICE = 'emulator-5554';

// ── Helpers ───────────────────────────────────────────────────────────────────
function adb(cmd) {
  try {
    return execSync(`"${ADB}" -s ${DEVICE} ${cmd}`,
      { encoding: 'utf8', stdio: 'pipe', timeout: 30000 });
  } catch (e) { return e.message || ''; }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function tap(x, y, wait = 700) {
  adb(`shell input tap ${x} ${y}`);
  sleep(wait);
}

function swipe(x1, y1, x2, y2, dur = 500, wait = 600) {
  adb(`shell input swipe ${x1} ${y1} ${x2} ${y2} ${dur}`);
  sleep(wait);
}

function type(text, wait = 500) {
  // Replace spaces with %s for adb input text
  const esc = text.replace(/ /g, '%s');
  adb(`shell input text "${esc}"`);
  sleep(wait);
}

function keyEvent(code, wait = 400) {
  adb(`shell input keyevent ${code}`);
  sleep(wait);
}

// ── Tọa độ chính xác từ uiautomator dump ─────────────────────────────────────
const C = {
  // === Product List Screen ===
  searchField:   [389, 359],  // EditText tìm kiếm
  filterBtn:     [908, 359],  // DropdownButton "Tất cả loại"

  // Filter dropdown options (drop xuống bên phải)
  filterAll:     [907, 359],  // "Tất cả loại"
  filterDientu:  [907, 485],  // "Điện tử"
  filterQuanao:  [907, 611],  // "Quần áo"
  filterGiaydep: [907, 737],  // "Giày dép"

  groupChip:     [920, 522],  // FilterChip "Nhóm loại"
  fab:           [814, 2221], // FAB "Thêm sản phẩm"

  // Sản phẩm 1: SP001 Áo thun nam (Quần áo, 150,000đ)
  item1:         [540, 789],
  item1Edit:     [943, 721],
  item1Delete:   [943, 847],

  // Sản phẩm 2: SP002 Điện thoại Samsung A54 (Điện tử, 8,990,000đ)
  item2:         [540, 1146],
  item2Edit:     [943, 1078],
  item2Delete:   [943, 1204],

  // Sản phẩm 3: SP003 Giày thể thao Nike (Giày dép, 1,200,000đ)
  item3:         [540, 1503],
  item3Edit:     [943, 1435],
  item3Delete:   [943, 1561],

  // === Add/Edit Product Form ===
  formBack:      [74,  202],  // Back button
  formName:      [540, 1144], // TextField Tên sản phẩm
  formCategory:  [540, 1398], // DropdownButton Loại sản phẩm
  formPrice:     [540, 1653], // TextField Giá
  formSave:      [540, 1873], // Button "LƯU SẢN PHẨM"

  // Category dropdown options (in add form)
  catDientu:     [540, 1371], // Điện tử
  catQuanao:     [540, 1497], // Quần áo
  catGiaydep:    [540, 1623], // Giày dép
  catThucpham:   [540, 1749], // Thực phẩm
  catDodung:     [540, 1875], // Đồ dùng
  catSach:       [540, 2001], // Sách
};

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  // Kiểm tra emulator
  const devices = execSync(`"${ADB}" devices`, { encoding: 'utf8' });
  if (!devices.includes('emulator-5554')) {
    console.error('ERROR: emulator-5554 không tìm thấy!');
    console.error('Khởi động emulator: D:/AndroidSDK/emulator/emulator.exe -avd Pixel_6_API34');
    process.exit(1);
  }

  // Khởi động app fresh
  console.log('Khởi động app...');
  adb(`shell am force-stop ${PKG}`);
  sleep(1000);
  adb(`shell am start -n ${PKG}/.MainActivity`);
  sleep(4500); // Đợi MongoDB kết nối

  // Bắt đầu quay màn hình
  console.log('\n🎬 Bắt đầu quay video...\n');
  const rec = spawn(ADB, [
    '-s', DEVICE, 'shell', 'screenrecord',
    '--bit-rate', '6000000',
    '--size', '1080x2400',
    '/sdcard/demo.mp4'
  ], { detached: true, stdio: 'ignore' });
  rec.unref();
  sleep(1500);

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // CẢNH 1: Danh sách sản phẩm (0:00 – 0:20)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('[1/8] Danh sách sản phẩm...');
    sleep(2500); // Nhìn màn hình chính

    // Scroll xuống xem sản phẩm
    swipe(540, 1600, 540, 900, 700, 800);
    swipe(540, 900, 540, 1600, 700, 800);

    // ──────────────────────────────────────────────────────────────────────────
    // CẢNH 2: Tìm kiếm (0:20 – 0:35)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('[2/8] Tìm kiếm...');
    tap(...C.searchField, 700); // Click vào ô tìm kiếm
    type('Samsung', 500);
    sleep(2000); // Hiển thị kết quả tìm kiếm
    keyEvent('KEYCODE_BACK', 500); // Đóng bàn phím
    sleep(1500); // Nhìn kết quả

    // Xóa tìm kiếm
    tap(...C.searchField, 500);
    keyEvent('KEYCODE_CTRL_A', 200);
    keyEvent('KEYCODE_DEL', 300);
    keyEvent('KEYCODE_BACK', 500);
    sleep(1000);

    // ──────────────────────────────────────────────────────────────────────────
    // CẢNH 3: Lọc theo loại (0:35 – 0:55)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('[3/8] Lọc theo loại...');
    tap(...C.filterBtn, 1200); // Mở dropdown lọc
    sleep(800); // Nhìn dropdown
    tap(...C.filterDientu, 1000); // Chọn "Điện tử"
    sleep(2500); // Nhìn kết quả đã lọc

    // Reset lọc
    tap(...C.filterBtn, 1000); // Mở dropdown lại
    tap(...C.filterAll, 1000); // Chọn "Tất cả loại"
    sleep(1500);

    // ──────────────────────────────────────────────────────────────────────────
    // CẢNH 4: Nhóm theo loại - Group by (0:55 – 1:15)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('[4/8] Nhóm theo loại...');
    tap(...C.groupChip, 1000); // Bật "Nhóm loại"
    sleep(2000); // Nhìn danh sách nhóm
    swipe(540, 1500, 540, 900, 600, 1200); // Scroll qua các nhóm
    swipe(540, 900, 540, 1500, 600, 800);  // Scroll về đầu
    tap(...C.groupChip, 800); // Tắt nhóm
    sleep(1000);

    // ──────────────────────────────────────────────────────────────────────────
    // CẢNH 5: Thêm sản phẩm (1:15 – 1:35)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('[5/8] Thêm sản phẩm...');
    tap(...C.fab, 1500); // Tap FAB
    sleep(1500); // Màn hình form hiện ra

    // Điền tên sản phẩm
    tap(...C.formName, 700);
    type('Laptop Dell XPS 15', 700);
    keyEvent('KEYCODE_BACK', 600); // Đóng bàn phím

    // Chọn loại sản phẩm
    tap(...C.formCategory, 1000); // Mở dropdown loại
    sleep(800);
    tap(...C.catDientu, 800); // Chọn "Điện tử"

    // Điền giá
    tap(...C.formPrice, 700);
    type('35000000', 700);
    keyEvent('KEYCODE_BACK', 600); // Đóng bàn phím
    sleep(500);

    // Lưu
    tap(...C.formSave, 2500); // Tap Lưu, đợi quay về danh sách
    sleep(2000); // Hiển thị danh sách mới

    // ──────────────────────────────────────────────────────────────────────────
    // CẢNH 6: Sửa sản phẩm (1:35 – 1:55)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('[6/8] Sửa sản phẩm...');
    tap(...C.item2Edit, 1500); // Tap Sửa SP002 (Samsung)
    sleep(1500); // Form sửa hiện ra

    // Xóa giá cũ và điền giá mới
    tap(...C.formPrice, 700);
    keyEvent('KEYCODE_CTRL_A', 300);
    keyEvent('KEYCODE_DEL', 300);
    type('7990000', 700);
    keyEvent('KEYCODE_BACK', 600);
    sleep(500);

    // Lưu
    tap(...C.formSave, 2500);
    sleep(2000); // Danh sách cập nhật

    // ──────────────────────────────────────────────────────────────────────────
    // CẢNH 7: Xóa sản phẩm (1:55 – 2:10)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('[7/8] Xóa sản phẩm...');
    // Scroll xuống tìm "Laptop Dell" vừa thêm
    swipe(540, 1500, 540, 700, 600, 1000);
    // Tap Xóa trên item cuối (Laptop Dell XPS hoặc Ggg)
    // Dùng tọa độ item1Delete vì sau scroll item đầu có thể thay đổi
    // Thay vào đó: scroll lên và xóa item đầu tiên (SP001 test)
    swipe(540, 700, 540, 1500, 600, 1000); // Scroll về đầu
    sleep(800);
    tap(...C.item1Delete, 1500); // Tap Xóa SP001
    sleep(1500); // Xem danh sách sau khi xóa

    // ──────────────────────────────────────────────────────────────────────────
    // CẢNH 8: Auto-refresh (2:10 – 2:25)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('[8/8] Auto-refresh badge...');
    sleep(5000); // Đợi auto-refresh (10 giây)

    console.log('\nDemo hoàn thành!');

  } finally {
    // Dừng quay
    sleep(1500);
    console.log('\n⏹ Dừng quay...');
    adb('shell pkill -SIGINT screenrecord');
    sleep(4000); // Đợi MP4 finalize

    // Pull video về máy
    console.log('📥 Tải video về máy...');
    execSync(`"${ADB}" -s ${DEVICE} pull /sdcard/demo.mp4 "${VIDEO}"`,
      { stdio: 'inherit' });

    adb('shell rm /sdcard/demo.mp4');

    // Cleanup temp files
    ['ui_login.xml','ui_add.xml','ui_cat.xml','ui_filter.xml','ui_tmp.xml'].forEach(f => {
      try { fs.unlinkSync(path.join(PROJ, f)); } catch(_) {}
    });

    if (fs.existsSync(VIDEO)) {
      const mb = (fs.statSync(VIDEO).size / 1024 / 1024).toFixed(1);
      console.log(`\n✅ Video: ${VIDEO} (${mb} MB)`);
      console.log('\nXem video: Mở file bằng VLC hoặc Windows Media Player');
    } else {
      console.log('\n❌ Lỗi: Không tìm thấy file video!');
    }
  }
}

main();

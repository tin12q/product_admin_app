/**
 * Tạo báo cáo Word: Flutter + MongoDB (Android Emulator)
 * Định dạng theo: Báo cáo Flutter + MongoDB_Võ Thanh Phong.docx
 */
const {
  Document, Packer, Paragraph, TextRun, ImageRun,
  AlignmentType, ExternalHyperlink, HeadingLevel,
  BorderStyle, PageNumber
} = require('docx');
const fs   = require('fs');
const path = require('path');

const SS   = 'D:/Projects/product_admin_app/baocao_screenshots/';
const OUT  = 'D:/Projects/product_admin_app/BaoCao_Flutter_MongoDB.docx';

// ── Helper: đọc ảnh ──────────────────────────────────────────────────────────
function img(filename, wEmu, hEmu, alt) {
  const fp = path.join(SS, filename);
  if (!fs.existsSync(fp)) { console.warn('MISSING: ' + filename); return null; }
  return new ImageRun({
    type: 'png',
    data: fs.readFileSync(fp),
    transformation: { width: Math.round(wEmu / 9144), height: Math.round(hEmu / 9144) },
    altText: { title: alt || filename, description: alt || filename, name: alt || filename },
  });
}

// ── Helper: tính EMU ──────────────────────────────────────────────────────────
// 1 cm = 360000 EMU
function cm(c) { return Math.round(c * 360000); }

// Kích thước ảnh (EMU)
const PW = cm(5.5), PH = Math.round(PW * 2400 / 1080);   // Phone 5.5cm wide
const TW = cm(14);                                          // Terminal 14cm
const CW = cm(10);                                          // Code (tall) 10cm
const CS = cm(13);                                          // Code (short) 13cm

// Chiều cao terminal (tính theo tỉ lệ pixel thực)
function th(w, h) { return Math.round(TW * h / w); }
function cth(srcH) { return Math.round(CW * srcH / 960); }
function csth(srcW, srcH, widthEmu) { return Math.round(widthEmu * srcH / srcW); }

// ── Helper: đoạn văn ─────────────────────────────────────────────────────────
function para(text, opts = {}) {
  const runs = typeof text === 'string'
    ? [new TextRun({ text, bold: opts.bold, size: opts.size || 22,
        font: opts.font || 'Times New Roman', color: opts.color })]
    : text;
  return new Paragraph({
    alignment: opts.align || AlignmentType.BOTH,
    spacing: { before: opts.before || 0, after: opts.after || 120, line: opts.line || 276 },
    children: runs,
  });
}

function secTitle(num, title) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: num + '. ' + title, bold: true, size: 24,
      font: 'Times New Roman' })],
  });
}

function subTitle(text) {
  return new Paragraph({
    spacing: { before: 120, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Times New Roman',
      italics: true })],
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 160 },
    children: [new TextRun({ text, italics: true, size: 20, font: 'Times New Roman',
      color: '555555' })],
  });
}

function imgPara(imageRun) {
  if (!imageRun) return new Paragraph({ children: [] });
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 40 },
    children: [imageRun],
  });
}

function blank() { return para('', { before: 0, after: 80 }); }

function link(text, url) {
  return new ExternalHyperlink({
    children: [new TextRun({ text, style: 'Hyperlink', size: 22,
      font: 'Times New Roman' })],
    link: url,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NỘI DUNG BÁO CÁO
// ═══════════════════════════════════════════════════════════════════════════════
const children = [

  // ── TRANG BÌA ───────────────────────────────────────────────────────────────
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1440, after: 240 },
    children: [new TextRun({ text: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN',
      bold: true, size: 24, font: 'Times New Roman' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 240 },
    children: [new TextRun({ text: 'KHOA CÔNG NGHỆ PHẦN MỀM',
      bold: true, size: 22, font: 'Times New Roman' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1440, after: 240 },
    children: [new TextRun({ text: 'BÁO CÁO THỰC HÀNH',
      bold: true, size: 32, font: 'Times New Roman' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [new TextRun({ text: 'ỨNG DỤNG QUẢN LÝ SẢN PHẨM',
      bold: true, size: 28, font: 'Times New Roman' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 1440 },
    children: [new TextRun({ text: 'FLUTTER + MONGODB (ANDROID)',
      bold: true, size: 28, font: 'Times New Roman', color: '1F4E79' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: 'Sinh viên thực hiện:', size: 22,
      font: 'Times New Roman' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: 'Võ Thanh Phong', bold: true, size: 24,
      font: 'Times New Roman' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'Môn học: Lập trình Di động', size: 22,
      font: 'Times New Roman' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 1440 },
    children: [new TextRun({ text: 'Năm học: 2024 - 2025', size: 22,
      font: 'Times New Roman' })],
  }),

  // ── 1. GIỚI THIỆU ───────────────────────────────────────────────────────────
  secTitle('1', 'Giới thiệu'),
  para('Bài thực hành xây dựng ứng dụng quản lý sản phẩm trên nền tảng Android sử dụng Flutter framework và MongoDB làm cơ sở dữ liệu. Ứng dụng kết nối trực tiếp đến MongoDB thông qua package mongo_dart mà không cần backend REST API trung gian.'),
  para('Ứng dụng được phát triển bổ sung các tính năng nâng cao như lọc theo loại sản phẩm, nhóm theo danh mục, phân trang và tự động làm mới dữ liệu, đồng thời giữ nguyên cấu trúc cơ sở dữ liệu gốc với 5 trường dữ liệu.'),
  blank(),

  // ── 2. CÔNG NGHỆ ────────────────────────────────────────────────────────────
  secTitle('2', 'Công nghệ sử dụng'),
  para('- Flutter 3.41.6 / Dart 3.11.4: Framework đa nền tảng để phát triển ứng dụng Android.'),
  para('- MongoDB 8.2.6: Cơ sở dữ liệu NoSQL, lưu trữ dữ liệu sản phẩm.'),
  para('- mongo_dart 0.10.8: Package kết nối MongoDB trực tiếp qua TCP socket, không cần backend.'),
  para('- Android Emulator (Pixel 6 API 34): Giả lập thiết bị Android để chạy và kiểm tra ứng dụng.'),
  para('- Android SDK 36 / NDK 27.0.12077973: Bộ công cụ phát triển Android.'),
  para('- Git / GitHub: Quản lý và lưu trữ mã nguồn trực tuyến.'),
  blank(),

  // ── 3. CÀI ĐẶT MÔI TRƯỜNG ───────────────────────────────────────────────────
  secTitle('3', 'Cài đặt môi trường'),
  subTitle('3.1 Kiểm tra phiên bản Flutter'),
  para('Kiểm tra Flutter đã được cài đặt và phiên bản đang sử dụng:'),
  imgPara(img('NEW_01_flutter_version.png', TW, th(860, 205), 'Flutter version')),
  caption('Hình 3.1: Kết quả lệnh flutter --version'),
  blank(),

  subTitle('3.2 Kiểm tra môi trường phát triển'),
  para('Kiểm tra toàn bộ môi trường phát triển Flutter bao gồm Android toolchain:'),
  imgPara(img('NEW_02_flutter_doctor.png', TW, th(860, 514), 'Flutter doctor')),
  caption('Hình 3.2: Kết quả flutter doctor - Android toolchain OK'),
  blank(),

  subTitle('3.3 Kiểm tra MongoDB'),
  para('Xác nhận MongoDB đã được cài đặt và đang chạy tại cổng 27017:'),
  imgPara(img('NEW_03_mongo_version.png', TW, th(860, 143), 'MongoDB version')),
  caption('Hình 3.3: Phiên bản MongoDB'),
  blank(),
  imgPara(img('NEW_04_mongo_netstat.png', TW, th(860, 514), 'MongoDB netstat')),
  caption('Hình 3.4: MongoDB lắng nghe tại cổng 27017'),
  blank(),

  // ── 4. KHỞI TẠO DỰ ÁN ──────────────────────────────────────────────────────
  secTitle('4', 'Khởi tạo dự án Flutter'),
  subTitle('4.1 Cấu hình pubspec.yaml'),
  para('Cài đặt các package cần thiết, đặc biệt là mongo_dart để kết nối MongoDB:'),
  imgPara(img('CODE_03_pubspec.png', CS, csth(720, 575, CS), 'pubspec.yaml')),
  caption('Hình 4.1: Cấu hình pubspec.yaml với mongo_dart'),
  blank(),

  subTitle('4.2 Cài đặt packages'),
  imgPara(img('NEW_05_pub_get.png', TW, th(860, 267), 'flutter pub get')),
  caption('Hình 4.2: Kết quả flutter pub get'),
  blank(),

  // ── 5. KẾT NỐI MONGODB ──────────────────────────────────────────────────────
  secTitle('5', 'Kết nối MongoDB'),
  para('Ứng dụng sử dụng package mongo_dart để kết nối trực tiếp đến MongoDB mà không cần REST API hay backend trung gian. Trên Android Emulator, địa chỉ host machine là 10.0.2.2 thay vì localhost.'),
  blank(),
  subTitle('5.1 MongoService - Lớp kết nối chính'),
  para('Lớp MongoService xử lý toàn bộ việc kết nối và thao tác CRUD với MongoDB:'),
  imgPara(img('CODE_01_mongo_service.png', CW, cth(2000), 'mongo_service.dart')),
  caption('Hình 5.1: Code kết nối MongoDB (mongo_service.dart)'),
  blank(),

  subTitle('5.2 DatabaseService - Lớp trung gian'),
  para('DatabaseService là lớp wrapper mỏng, luôn sử dụng MongoDB:'),
  imgPara(img('CODE_02_database_service.png', CS, csth(860, 355, CS), 'database_service.dart')),
  caption('Hình 5.2: DatabaseService wrapper (database_service.dart)'),
  blank(),

  // ── 6. CẤU TRÚC DỮ LIỆU ────────────────────────────────────────────────────
  secTitle('6', 'Cấu trúc dữ liệu'),
  para('Collection sanpham trong MongoDB có cấu trúc 5 trường cố định:'),
  para('- idsanpham (String): Mã sản phẩm, unique index, ví dụ: "SP001".'),
  para('- tensp (String): Tên sản phẩm, ví dụ: "Điện thoại Samsung Galaxy A54".'),
  para('- loaisp (String): Loại sản phẩm, ví dụ: "Điện tử", "Quần áo", "Giày dép".'),
  para('- gia (Number): Giá sản phẩm tính theo VNĐ, ví dụ: 8990000.'),
  para('- hinhanh (String?): Đường dẫn hình ảnh, có thể null.'),
  para('Dữ liệu mẫu bao gồm 50 sản phẩm thuộc 6 danh mục: Điện tử, Quần áo, Giày dép, Thực phẩm, Đồ dùng, Sách được tự động seed khi collection rỗng.'),
  blank(),

  // ── 7. TÍNH NĂNG NÂNG CAO ───────────────────────────────────────────────────
  secTitle('7', 'Tính năng nâng cao'),
  para('Ứng dụng bổ sung các tính năng nâng cao sau mà không thay đổi cấu trúc database:'),
  blank(),
  subTitle('7.1 Lọc theo loại sản phẩm (Filter)'),
  para('Dropdown "Tất cả loại" cho phép lọc danh sách theo từng danh mục sản phẩm. Kết quả lọc được cập nhật ngay lập tức.'),
  blank(),
  subTitle('7.2 Nhóm theo loại (Group By)'),
  para('FilterChip "Nhóm loại" cho phép hiển thị sản phẩm được nhóm theo danh mục, với header màu sắc tương ứng cho mỗi nhóm.'),
  blank(),
  subTitle('7.3 Phân trang (Pagination)'),
  para('Hiển thị tối đa 20 sản phẩm mỗi trang. Thanh điều hướng Trang X/Y xuất hiện khi số sản phẩm vượt quá 20.'),
  blank(),
  subTitle('7.4 Tự động làm mới (Auto-refresh)'),
  para('Timer.periodic chạy mỗi 10 giây gọi _silentRefresh() để cập nhật dữ liệu từ MongoDB mà không làm gián đoạn người dùng.'),
  blank(),

  subTitle('7.5 Code ProductListScreen (phần logic nâng cao)'),
  imgPara(img('CODE_04_screen_part1.png', CW, cth(1635), 'product_list_screen part 1')),
  caption('Hình 7.1: ProductListScreen - Timer, filter, group, pagination (phần 1)'),
  blank(),
  imgPara(img('CODE_05_screen_part2.png', CW, cth(2000), 'product_list_screen part 2')),
  caption('Hình 7.2: ProductListScreen - Build widgets, filter dropdown, pagination (phần 2)'),
  blank(),

  // ── 8. CHẠY ỨNG DỤNG ────────────────────────────────────────────────────────
  secTitle('8', 'Chạy ứng dụng trên Android Emulator'),
  subTitle('8.1 Phân tích và build'),
  imgPara(img('NEW_06_flutter_analyze.png', TW, th(860, 143), 'flutter analyze')),
  caption('Hình 8.1: flutter analyze - Không có lỗi'),
  blank(),
  imgPara(img('NEW_07_build_windows.png', TW, th(860, 205), 'flutter build')),
  caption('Hình 8.2: Build thành công'),
  blank(),

  // ── 9. KẾT QUẢ ─────────────────────────────────────────────────────────────
  secTitle('9', 'Kết quả chạy ứng dụng'),
  subTitle('9.1 Màn hình đăng nhập'),
  para('Ứng dụng hiển thị màn hình đăng nhập với tài khoản demo được cung cấp sẵn:'),
  blank(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 40 },
    children: [
      img('EMU_03_product_list.png', PW, PH, 'Login screen'),
      new TextRun({ text: '    ' }),
      img('EMU_01_login_filled.png', PW, PH, 'Login filled'),
    ].filter(Boolean),
  }),
  caption('Hình 9.1: Màn hình đăng nhập (trống và đã nhập thông tin)'),
  blank(),

  subTitle('9.2 Danh sách sản phẩm chính'),
  para('Sau khi đăng nhập, ứng dụng kết nối MongoDB và hiển thị danh sách sản phẩm với badge MongoDB xanh:'),
  imgPara(img('EMU_02_product_list.png', PW, PH, 'Product list')),
  caption('Hình 9.2: Màn hình danh sách sản phẩm với MongoDB badge'),
  blank(),

  subTitle('9.3 Lọc theo loại sản phẩm'),
  para('Dropdown "Tất cả loại" mở ra danh sách các danh mục để lọc:'),
  blank(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 40 },
    children: [
      img('EMU_filter_dropdown_open.png', PW, PH, 'Filter dropdown open'),
      new TextRun({ text: '    ' }),
      img('EMU_filter_dientu.png', PW, PH, 'Filter Dien tu'),
    ].filter(Boolean),
  }),
  caption('Hình 9.3: Dropdown lọc loại sản phẩm và kết quả lọc "Điện tử"'),
  blank(),

  subTitle('9.4 Nhóm theo loại sản phẩm'),
  para('Bật "Nhóm loại" để hiển thị sản phẩm theo nhóm danh mục với header màu:'),
  imgPara(img('EMU_group_by_loai.png', PW, PH, 'Group by loai')),
  caption('Hình 9.4: Chế độ nhóm theo loại sản phẩm'),
  blank(),

  subTitle('9.5 Thêm sản phẩm mới'),
  para('Form thêm sản phẩm với các trường: tên, loại (dropdown), giá và ảnh:'),
  imgPara(img('EMU_06_add_product.png', PW, PH, 'Add product')),
  caption('Hình 9.5: Màn hình thêm sản phẩm mới'),
  blank(),

  subTitle('9.6 Chỉnh sửa sản phẩm'),
  para('Màn hình chỉnh sửa hiển thị thông tin hiện tại của sản phẩm để cập nhật:'),
  imgPara(img('EMU_07_edit_product.png', PW, PH, 'Edit product')),
  caption('Hình 9.6: Màn hình chỉnh sửa sản phẩm'),
  blank(),

  // ── 10. GIT ─────────────────────────────────────────────────────────────────
  secTitle('10', 'Quản lý mã nguồn (Git)'),
  para('Toàn bộ mã nguồn được quản lý bằng Git và lưu trữ trên GitHub:'),
  blank(),
  imgPara(img('NEW_08_git_log.png', TW, th(960, 576), 'git log')),
  caption('Hình 10.1: Lịch sử commit và remote repository'),
  blank(),
  new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [
      new TextRun({ text: 'GitHub Repository: ', bold: true, size: 22,
        font: 'Times New Roman' }),
      link('https://github.com/tin12q/product_admin_app',
           'https://github.com/tin12q/product_admin_app'),
    ],
  }),
  blank(),

  // ── 11. KẾT LUẬN ────────────────────────────────────────────────────────────
  secTitle('11', 'Kết luận'),
  para('Bài thực hành đã hoàn thành xây dựng ứng dụng quản lý sản phẩm trên Android với các yêu cầu đề ra:'),
  para('- Kết nối trực tiếp MongoDB qua mongo_dart không cần REST API backend.'),
  para('- Đầy đủ chức năng CRUD: thêm, xem, sửa, xóa sản phẩm.'),
  para('- Tính năng nâng cao: lọc theo loại, nhóm theo danh mục, phân trang 20/trang, tự động làm mới 10 giây.'),
  para('- Chạy thành công trên Android Emulator (Pixel 6 API 34).'),
  para('- Mã nguồn được quản lý bằng Git và công khai trên GitHub.'),
  blank(),
  para('Ứng dụng đã được kiểm tra thành công, MongoDB kết nối ổn định từ Android Emulator qua địa chỉ 10.0.2.2:27017. Dữ liệu được đồng bộ theo thời gian thực và giao diện Material Design 3 hiển thị tốt trên màn hình di động.'),
];

// ═══════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Times New Roman', size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Caption',
        name: 'Caption',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: 20, italics: true, color: '555555', font: 'Times New Roman' },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 40, after: 160 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1418, right: 1134, bottom: 1134, left: 1701 }, // 2.5/2/2/3 cm
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log('OK: ' + OUT + ' (' + Math.round(buf.length / 1024) + ' KB)');
}).catch(e => { console.error(e.message); process.exit(1); });

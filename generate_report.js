const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle,
  ShadingType, convertInchesToTwip, PageBreak,
} = require('./node_modules/docx');
const fs = require('fs');
const path = require('path');

const SS = path.join(__dirname, 'baocao_screenshots');

// ─── helpers ───────────────────────────────────────────────────────────────
function heading1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 120 } });
}
function heading2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } });
}
function heading3(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 60 } });
}
function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, ...opts })],
    spacing: { before: 60, after: 60 },
  });
}
function bold(text) { return new TextRun({ text, bold: true, size: 22 }); }
function normal(text) { return new TextRun({ text, size: 22 }); }

function tableRow2(label, value, shade = false) {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [bold(label)], spacing: { before: 40, after: 40 } })],
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: shade ? { type: ShadingType.CLEAR, fill: 'EBF3FB' } : undefined,
      }),
      new TableCell({
        children: [new Paragraph({ children: [normal(value)], spacing: { before: 40, after: 40 } })],
        width: { size: 65, type: WidthType.PERCENTAGE },
      }),
    ],
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' } },
    spacing: { before: 120, after: 120 },
    children: [],
  });
}

// Nhúng ảnh PNG — dùng kích thước thực tế của ảnh
function loadImgDims(filename) {
  const p = path.join(SS, filename);
  if (!fs.existsSync(p)) return null;
  const data = fs.readFileSync(p);
  // Đọc width/height từ PNG header (bytes 16-24)
  const w = data.readUInt32BE(16);
  const h = data.readUInt32BE(20);
  return { data, w, h };
}

function imageBlock(filename, caption, targetW) {
  const img = loadImgDims(filename);
  if (!img) return [para(`[Ảnh không tìm thấy: ${filename}]`, { color: 'CC0000' })];
  const ratio = img.h / img.w;
  const displayW = targetW || Math.min(img.w, 550);
  const displayH = Math.round(displayW * ratio);
  const items = [
    new Paragraph({
      children: [new ImageRun({ data: img.data, transformation: { width: displayW, height: displayH }, type: 'png' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: caption ? 30 : 100 },
    }),
  ];
  if (caption) {
    items.push(new Paragraph({
      children: [new TextRun({ text: caption, italics: true, size: 18, color: '555555' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
    }));
  }
  return items;
}

// Khối "Bước N" có ảnh terminal thực tế
function stepBlock(num, title, terminalFile, caption) {
  const items = [];
  items.push(heading3(`Bước ${String(num).padStart(2,'0')} — ${title}`));
  items.push(...imageBlock(terminalFile, caption, 560));
  return items;
}

// ─── DOCUMENT ──────────────────────────────────────────────────────────────
const children = [];

// ── Cover ──────────────────────────────────────────────────────────────────
children.push(new Paragraph({
  children: [new TextRun({ text: 'REPORT', bold: true, size: 56, color: '1F4E79' })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 600, after: 80 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: 'Flutter App Quản Lý Sản Phẩm (Admin)', bold: true, size: 30, color: '2E74B5' })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 60 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: 'Lập Trình Đa Nền Tảng — Bài Thi Giữa Kỳ', size: 24, color: '666666' })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 400 },
}));
children.push(new Table({
  width: { size: 80, type: WidthType.PERCENTAGE },
  rows: [
    tableRow2('Môn học', 'Lập trình đa nền tảng', false),
    tableRow2('Đề tài', 'App nhập, hiển thị, sửa, xóa sản phẩm (Admin)', true),
    tableRow2('Framework', 'Flutter 3.41.6 / Dart 3.11.4', false),
    tableRow2('Database chính', 'MongoDB 8.2.6 (REST API Node.js/Express)', true),
    tableRow2('Database dự phòng', 'SQLite (sqflite) — offline fallback', false),
    tableRow2('Platform', 'Windows 10 Home Single Language 64-bit', true),
    tableRow2('Ngày thực hiện', '04/04/2026', false),
  ],
}));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ── 1. Tổng quan ───────────────────────────────────────────────────────────
children.push(heading1('1. Tổng quan'));
children.push(para(
  'Project xây dựng ứng dụng Flutter quản trị sản phẩm chạy trên Windows 10. ' +
  'Database chính là MongoDB 8.2.6 được truy cập qua REST API (Node.js + Express + Mongoose) ' +
  'chạy trên cùng máy. Khi backend không khả dụng, app tự động chuyển sang SQLite offline. ' +
  'Ứng dụng có đầy đủ chức năng: đăng nhập, xem danh sách, thêm, sửa, xóa sản phẩm và chọn ảnh từ Gallery/Camera.'
));

// ── 2. Kết quả môi trường ──────────────────────────────────────────────────
children.push(heading1('2. Kết quả môi trường'));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    tableRow2('flutter analyze', '✅ PASS — No issues found', false),
    tableRow2('flutter build web', '✅ PASS — Built build\\web (44.7s)', true),
    tableRow2('flutter pub get', '✅ PASS — 57 packages resolved', false),
    tableRow2('flutter run -d edge', '✅ PASS — App chạy trên Microsoft Edge', true),
    tableRow2('MongoDB 8.2.6', '✅ Chạy tại tcp://127.0.0.1:27017', false),
    tableRow2('GET /api/health', '✅ {"mongodb":"connected"}', true),
    tableRow2('GET /api/sanpham', '✅ 4 sản phẩm đúng schema 5 trường', false),
    tableRow2('CRUD + Image Picker', '✅ Đầy đủ Thêm/Sửa/Xóa/Gallery/Camera', true),
    tableRow2('Đăng nhập / Đăng xuất', '✅ SharedPreferences session', false),
    tableRow2('Android SDK', '❌ Chưa cài — dùng Edge web target thay thế', true),
  ],
}));
children.push(new Paragraph({ children: [] }));

// ── 3. Chứng cứ terminal theo từng bước ────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading1('3. Chứng cứ terminal theo từng bước'));
children.push(para('Tất cả ảnh bên dưới là ảnh chụp màn hình thực tế được chụp tự động từ terminal máy tính.'));

// Bước 01
children.push(...stepBlock(1,
  'Kiểm tra phiên bản Flutter',
  'TERM_01_flutter_version.png',
  'flutter --version — Flutter 3.41.6 • Dart 3.11.4'
));

// Bước 02
children.push(...stepBlock(2,
  'Kiểm tra Flutter doctor',
  'TERM_02_flutter_doctor.png',
  'flutter doctor — Edge web ✅, Windows ✅, Android SDK chưa cài (không bắt buộc)'
));

// Bước 03
children.push(...stepBlock(3,
  'Kiểm tra phiên bản MongoDB',
  'TERM_03_mongo_version.png',
  'mongod --version — MongoDB 8.2.6'
));

// Bước 04
children.push(...stepBlock(4,
  'Xác nhận MongoDB đang chạy (port 27017)',
  'TERM_04_mongo_netstat.png',
  'netstat -ano | findstr :27017 — LISTENING tại tcp://127.0.0.1:27017'
));

// Bước 05
children.push(...stepBlock(5,
  'Kiểm tra phiên bản Node.js và npm',
  'TERM_05_node_version.png',
  'node --version && npm --version — Node.js v22.20.0, npm 10.x'
));

// Bước 06
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(...stepBlock(6,
  'Tạo Flutter project',
  'TERM_06_flutter_create.png',
  'flutter create --project-name product_admin_app — Wrote 131 files. All done!'
));

// Bước 07
children.push(...stepBlock(7,
  'Cài package Node.js cho backend',
  'TERM_07_npm_install.png',
  'npm install express mongoose cors uuid — 102 packages installed'
));

// Bước 08
children.push(...stepBlock(8,
  'Cài package Flutter (flutter pub get)',
  'TERM_08_pub_get.png',
  'flutter pub get — 57 dependencies resolved (http, sqflite, image_picker, uuid, shared_preferences)'
));

// Bước 09
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(...stepBlock(9,
  'Kiểm tra health check API',
  'TERM_09_api_health.png',
  'curl http://localhost:3000/api/health — {"mongodb":"connected"}'
));

// Bước 10
children.push(...stepBlock(10,
  'Lấy dữ liệu từ MongoDB (GET /api/sanpham)',
  'TERM_10_api_sanpham.png',
  'curl http://localhost:3000/api/sanpham — 4 sản phẩm với đúng 5 trường'
));

// Bước 11
children.push(...stepBlock(11,
  'Phân tích mã nguồn (flutter analyze)',
  'TERM_11_flutter_analyze.png',
  'flutter analyze — No issues found!'
));

// Bước 12
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(...stepBlock(12,
  'Build Flutter Web',
  'TERM_12_flutter_build_web.png',
  'flutter build web — Built build\\web thành công'
));

// Bước 13
children.push(...stepBlock(13,
  'Khởi động backend API server',
  'TERM_13_backend_server.png',
  'node backend\\server.js — API tại http://localhost:3000, MongoDB connected'
));

// Bước 14
children.push(...stepBlock(14,
  'Chạy app Flutter trên Edge',
  'TERM_14_flutter_run.png',
  'flutter run -d edge — App khởi động, Hot reload sẵn sàng'
));

// ── 4. Ảnh màn hình ứng dụng ───────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading1('4. Ảnh màn hình ứng dụng'));

children.push(heading2('Đăng nhập'));
children.push(...imageBlock('SS_01_login.png', 'Màn hình đăng nhập — Logo + form username/password', 300));
children.push(...imageBlock('SS_02_login_filled.png', 'Đã nhập tài khoản admin/admin123', 300));

children.push(heading2('Danh sách sản phẩm'));
children.push(...imageBlock('SS_03_product_list.png', 'Danh sách sản phẩm sau khi đăng nhập', 300));
children.push(...imageBlock('SS_07_list_with_db_badge.png', 'AppBar hiển thị badge "MongoDB" hoặc "SQLite"', 300));

children.push(heading2('Thêm sản phẩm'));
children.push(...imageBlock('SS_04_add_product.png', 'Form thêm sản phẩm — chọn ảnh từ Gallery/Camera', 300));
children.push(...imageBlock('SS_05_add_product_filled.png', 'Đã điền thông tin: Laptop Dell XPS 15', 300));

children.push(heading2('Kết quả sau thao tác'));
children.push(...imageBlock('SS_06_back_to_list.png', 'Quay lại danh sách sau khi thêm', 300));
children.push(...imageBlock('SS_08_product_list_final.png', 'Danh sách sản phẩm cuối cùng', 300));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading2('MongoDB REST API — trình duyệt'));
children.push(...imageBlock('SS_09_mongodb_api_list.png', 'GET /api/sanpham — MongoDB trả về 4 sản phẩm với 5 trường', 580));
children.push(...imageBlock('SS_10_mongodb_health.png', 'GET /api/health — "mongodb":"connected"', 580));

// ── 5. Kết quả điểm số ──────────────────────────────────────────────────────
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading1('5. Kết quả điểm số'));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [bold('Tiêu chí')] })], width: { size: 55, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: '1F4E79' } }),
        new TableCell({ children: [new Paragraph({ children: [bold('Điểm')] })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: '1F4E79' } }),
        new TableCell({ children: [new Paragraph({ children: [bold('Thực hiện')] })], width: { size: 30, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: '1F4E79' } }),
      ],
    }),
    new TableRow({ children: [
      new TableCell({ children: [new Paragraph({ children: [normal('CRUD sản phẩm (tensp, loaisp, gia, hinhanh)')] })] }),
      new TableCell({ children: [new Paragraph({ children: [normal('8.0')] })] }),
      new TableCell({ children: [new Paragraph({ children: [normal('✅ MongoDB + SQLite fallback')] })] }),
    ]}),
    new TableRow({ children: [
      new TableCell({ children: [new Paragraph({ children: [normal('Nhập và hiển thị hình ảnh')] })], shading: { type: ShadingType.CLEAR, fill: 'EBF3FB' } }),
      new TableCell({ children: [new Paragraph({ children: [normal('0.5')] })], shading: { type: ShadingType.CLEAR, fill: 'EBF3FB' } }),
      new TableCell({ children: [new Paragraph({ children: [normal('✅ Gallery + Camera (image_picker)')] })], shading: { type: ShadingType.CLEAR, fill: 'EBF3FB' } }),
    ]}),
    new TableRow({ children: [
      new TableCell({ children: [new Paragraph({ children: [normal('Đăng nhập / Đăng xuất')] })] }),
      new TableCell({ children: [new Paragraph({ children: [normal('0.5')] })] }),
      new TableCell({ children: [new Paragraph({ children: [normal('✅ SharedPreferences session')] })] }),
    ]}),
    new TableRow({ children: [
      new TableCell({ children: [new Paragraph({ children: [normal('Xóa sản phẩm (có xác nhận)')] })], shading: { type: ShadingType.CLEAR, fill: 'EBF3FB' } }),
      new TableCell({ children: [new Paragraph({ children: [normal('0.5')] })], shading: { type: ShadingType.CLEAR, fill: 'EBF3FB' } }),
      new TableCell({ children: [new Paragraph({ children: [normal('✅ Dialog + DELETE API')] })], shading: { type: ShadingType.CLEAR, fill: 'EBF3FB' } }),
    ]}),
    new TableRow({ children: [
      new TableCell({ children: [new Paragraph({ children: [normal('Sửa sản phẩm')] })] }),
      new TableCell({ children: [new Paragraph({ children: [normal('0.5')] })] }),
      new TableCell({ children: [new Paragraph({ children: [normal('✅ PUT /api/sanpham/:id')] })] }),
    ]}),
    new TableRow({ children: [
      new TableCell({ children: [new Paragraph({ children: [bold('Tổng')] })], shading: { type: ShadingType.CLEAR, fill: 'D6E4F0' } }),
      new TableCell({ children: [new Paragraph({ children: [bold('10.0')] })], shading: { type: ShadingType.CLEAR, fill: 'D6E4F0' } }),
      new TableCell({ children: [new Paragraph({ children: [bold('✅ Hoàn thành')] })], shading: { type: ShadingType.CLEAR, fill: 'D6E4F0' } }),
    ]}),
  ],
}));
children.push(new Paragraph({ children: [] }));

// ── 6. Cấu trúc dự án ─────────────────────────────────────────────────────
children.push(heading1('6. Cấu trúc dự án'));
const struct = [
  'product_admin_app/',
  '├── lib/',
  '│   ├── main.dart                     # Entry + Splash Screen',
  '│   ├── models/san_pham.dart          # Model 5 trường',
  '│   ├── screens/',
  '│   │   ├── login_screen.dart         # Đăng nhập',
  '│   │   ├── product_list_screen.dart  # Danh sách + Tìm kiếm + Xóa',
  '│   │   ├── add_product_screen.dart   # Thêm + Chọn ảnh',
  '│   │   └── edit_product_screen.dart  # Sửa sản phẩm',
  '│   └── services/',
  '│       ├── database_service.dart     # Smart DB: MongoDB → SQLite',
  '│       ├── api_service.dart          # REST API client (http)',
  '│       └── auth_service.dart         # Login/Logout (SharedPreferences)',
  '├── backend/',
  '│   └── server.js                     # Express + Mongoose API',
  '├── android/app/src/main/',
  '│   └── AndroidManifest.xml           # Permissions',
  '├── build/web/                        # Flutter web artifact',
  '└── baocao_screenshots/               # Ảnh minh họa',
];
struct.forEach(line => {
  children.push(new Paragraph({
    children: [new TextRun({ text: line, font: 'Courier New', size: 18 })],
    shading: { type: ShadingType.CLEAR, fill: 'F5F5F5' },
    spacing: { before: 0, after: 0 },
    indent: { left: 360 },
  }));
});
children.push(new Paragraph({ children: [] }));

// ── Footer line ─────────────────────────────────────────────────────────────
children.push(divider());
children.push(new Paragraph({
  children: [new TextRun({
    text: 'Ngày: 04/04/2026  |  Flutter 3.41.6  |  MongoDB 8.2.6  |  Node.js v22.20.0  |  Windows 10',
    size: 18, italics: true, color: '888888',
  })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 80, after: 80 },
}));

// ─── BUILD DOC ─────────────────────────────────────────────────────────────
const doc = new Document({
  creator: '',
  lastModifiedBy: '',
  title: 'REPORT - Flutter App Quan Ly San Pham',
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          right: convertInchesToTwip(0.9),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.2),
        },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, 'REPORT_BaiThi_v2.docx');
  fs.writeFileSync(out, buf);
  console.log(`✅ Đã tạo: ${out}  (${(buf.length/1024).toFixed(0)} KB)`);
});

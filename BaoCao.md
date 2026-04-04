# BÁO CÁO BÀI THI GIỮA KỲ
## Lập Trình Đa Nền Tảng - Flutter App Quản Lý Sản Phẩm (Admin)

---

## THÔNG TIN BÀI THI

| Nội dung | Chi tiết |
|---|---|
| **Môn học** | Lập trình đa nền tảng |
| **Đề tài** | Xây dựng app nhập, hiển thị, sửa, xóa sản phẩm (Admin) |
| **Framework** | Flutter 3.41.6 / Dart 3.11.4 |
| **Database** | **MongoDB 8.2.6** (qua REST API Node.js/Express) |
| **Fallback DB** | SQLite (sqflite) - chạy offline |
| **Ngày thực hiện** | 04/04/2026 |

---

## 1. CÀI ĐẶT MÔI TRƯỜNG

### 1.1. Cài Flutter SDK

```bash
# Clone Flutter stable từ GitHub
git clone https://github.com/flutter/flutter.git --depth 1 --branch stable D:\flutter
```

**Kết quả:**
```
Flutter 3.41.6 • channel stable • https://github.com/flutter/flutter.git
Framework • revision db50e20168 • 2026-03-25 16:21:00
Tools • Dart 3.11.4 • DevTools 2.54.2
```

> Screenshot: `baocao_screenshots/01_flutter_version.txt`

### 1.2. Cài MongoDB 8.2.6

```bash
winget install MongoDB.Server
```

**Kết quả:**
```
Found MongoDB [MongoDB.Server] Version 8.2.6
Downloading mongodb-windows-x86_64-8.2.6-signed.msi (758 MB)
Successfully installed
```

```bash
# Khởi động MongoDB daemon
mongod --dbpath C:\data\db --logpath C:\data\mongod.log
# ✅ mongod đang chạy tại TCP 127.0.0.1:27017 LISTENING
```

> Screenshot: `baocao_screenshots/08_mongodb_terminal.txt`

### 1.3. Cài Node.js Backend (Express + Mongoose)

```bash
mkdir backend && cd backend
npm install express mongoose cors uuid
```

### 1.4. flutter doctor

```
[√] Flutter (Channel stable, 3.41.6)
[√] Windows Version (10 Home Single Language 64-bit)
[X] Android toolchain - cần Android Studio
[√] Edge (web) - Microsoft Edge 146.0.3856.84
[√] Connected device (2 available)
[√] Network resources
```

---

## 2. KHỞI TẠO PROJECT

### 2.1. Tạo Flutter project

```bash
cd D:\Projects
flutter create --org com.example --project-name product_admin_app product_admin_app
```

**Output:** `Wrote 131 files. All done!`

### 2.2. Cấu trúc project

```
product_admin_app/
├── lib/
│   ├── main.dart                     # Entry + Splash Screen
│   ├── models/san_pham.dart          # Model 5 trường
│   ├── screens/
│   │   ├── login_screen.dart         # Đăng nhập
│   │   ├── product_list_screen.dart  # Danh sách + tìm kiếm + xóa
│   │   ├── add_product_screen.dart   # Thêm + chọn ảnh
│   │   └── edit_product_screen.dart  # Sửa sản phẩm
│   └── services/
│       ├── database_service.dart     # Smart DB (MongoDB → SQLite)
│       ├── api_service.dart          # MongoDB REST API client
│       └── auth_service.dart         # Login/Logout
├── backend/
│   └── server.js                     # Express + Mongoose API server
├── baocao_screenshots/               # Ảnh minh họa
└── BaoCao.md                         # Báo cáo này
```

---

## 3. KIẾN TRÚC CSDL - MONGODB

### 3.1. Collection `sanpham` trong MongoDB

**Chỉ dùng đúng 5 trường theo yêu cầu đề thi:**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `idsanpham` | String (PK) | Mã sản phẩm (UUID 8 ký tự) |
| `tensp` | String | Tên sản phẩm |
| `loaisp` | String | Loại sản phẩm |
| `gia` | Number | Giá (VNĐ) |
| `hinhanh` | String (nullable) | Đường dẫn ảnh |

### 3.2. Mongoose Schema (backend/server.js)

```javascript
const sanPhamSchema = new mongoose.Schema({
  idsanpham: { type: String, required: true, unique: true },
  tensp:     { type: String, required: true },
  loaisp:    { type: String, required: true },
  gia:       { type: Number, required: true },
  hinhanh:   { type: String, default: null },
});
const SanPham = mongoose.model('SanPham', sanPhamSchema, 'sanpham');
```

### 3.3. REST API Endpoints

```
GET    /api/sanpham        — Lấy tất cả sản phẩm (hỗ trợ ?q=keyword)
GET    /api/sanpham/:id    — Lấy 1 sản phẩm
POST   /api/sanpham        — Thêm sản phẩm mới
PUT    /api/sanpham/:id    — Cập nhật sản phẩm
DELETE /api/sanpham/:id    — Xóa sản phẩm
GET    /api/health         — Kiểm tra trạng thái MongoDB
```

**Response mẫu từ GET /api/sanpham:**
```json
{
  "success": true,
  "data": [
    { "idsanpham": "SP001", "tensp": "Áo thun nam", "loaisp": "Quần áo",
      "gia": 150000, "hinhanh": null },
    { "idsanpham": "SP002", "tensp": "Điện thoại Samsung A54", "loaisp": "Điện tử",
      "gia": 8990000, "hinhanh": null },
    ...
  ]
}
```

> Screenshot: `baocao_screenshots/SS_09_mongodb_api_list.png` — API trả 4 sản phẩm từ MongoDB

> Screenshot: `baocao_screenshots/SS_10_mongodb_health.png` — `"mongodb":"connected"`

### 3.4. Chiến lược DB thông minh (Smart DB)

Flutter app tự động chọn backend:
```dart
// lib/services/database_service.dart
static Future<void> init() async {
  _useApi = await ApiService.isBackendAvailable(); // Kiểm tra MongoDB
}
// Nếu MongoDB có → dùng API; nếu không → fallback SQLite offline
```

Badge hiển thị trong AppBar: **🟢 MongoDB** hoặc **🟠 SQLite**

---

## 4. MÔ TẢ CHỨC NĂNG APP

### 4.1. Màn hình Đăng Nhập

- Logo cửa hàng + tiêu đề "QUẢN LÝ SẢN PHẨM"
- Nhập username + password (ẩn/hiện)
- Validation form
- Tài khoản demo: `admin/admin123`, `manager/manager123`
- Lưu session qua SharedPreferences

> **Screenshot: `baocao_screenshots/SS_01_login.png`** — Màn hình login

> **Screenshot: `baocao_screenshots/SS_02_login_filled.png`** — Đã nhập admin/admin123

### 4.2. Màn hình Danh Sách Sản Phẩm

- AppBar hiển thị tên user + badge DB (MongoDB/SQLite)
- Search bar tìm kiếm real-time (gọi API `/api/sanpham?q=...`)
- Mỗi card: thumbnail ảnh + tên + badge loại (màu theo loại) + giá + nút Edit/Delete
- Pull-to-refresh
- FAB "Thêm sản phẩm"

> **Screenshot: `baocao_screenshots/SS_03_product_list.png`** — Danh sách sau đăng nhập

### 4.3. Màn hình Thêm Sản Phẩm

- Ô chọn ảnh 180x180 (tap → chọn Gallery hoặc Camera)
- Form: Tên sản phẩm, Loại (dropdown 7 loại), Giá
- Validation đầy đủ
- Lưu qua `POST /api/sanpham` hoặc SQLite

> **Screenshot: `baocao_screenshots/SS_04_add_product.png`** — Form thêm sản phẩm

> **Screenshot: `baocao_screenshots/SS_05_add_product_filled.png`** — Đã điền thông tin

### 4.4. Màn hình Sửa Sản Phẩm

- Hiển thị ID sản phẩm (read-only)
- Điền sẵn thông tin hiện tại
- Đổi ảnh (gallery/camera/xóa)
- Cập nhật qua `PUT /api/sanpham/:id`
- AppBar màu cam

### 4.5. Xóa Sản Phẩm

- Dialog xác nhận trước khi xóa
- Gọi `DELETE /api/sanpham/:id`
- SnackBar thông báo kết quả

---

## 5. DEPENDENCIES

### Flutter (pubspec.yaml)
```yaml
dependencies:
  sqflite: ^2.3.2          # SQLite local (fallback)
  path_provider: ^2.1.2    # App directories
  image_picker: ^1.1.2     # Gallery/Camera
  uuid: ^4.3.3             # Auto-generate ID
  shared_preferences: ^2.2.3 # Session login
  http: ^1.2.2             # Gọi MongoDB REST API
```

### Backend Node.js (package.json)
```json
"dependencies": {
  "express": "^4.x",     // Web framework
  "mongoose": "^8.x",    // MongoDB ODM
  "cors": "^2.x",        // Cross-Origin support
  "uuid": "^9.x"         // Generate ID
}
```

---

## 6. KIỂM TRA VÀ BUILD

### 6.1. flutter pub get
```
Resolving dependencies...
Changed 57 dependencies! (bao gồm http, sqflite, image_picker, uuid, ...)
```
> `baocao_screenshots/02_pub_get_output.txt`

### 6.2. flutter analyze
```
Analyzing product_admin_app...
No issues found! (ran in 8.3s)
```
> `baocao_screenshots/03_analyze_output.txt`

### 6.3. flutter build web
```
Compiling lib\main.dart for the Web... 51.9s
√ Built build\web
```
> `baocao_screenshots/04_build_web_output.txt`

---

## 7. QUYỀN TRUY CẬP ANDROID

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

---

## 8. HƯỚNG DẪN CHẠY

### Bước 1: Khởi động MongoDB
```bash
mongod --dbpath C:\data\db
# → Lắng nghe tại mongodb://localhost:27017
```

### Bước 2: Khởi động Backend API
```bash
cd D:\Projects\product_admin_app\backend
node server.js
# → API tại http://localhost:3000
```

### Bước 3: Chạy Flutter App
```bash
cd D:\Projects\product_admin_app
set PATH=D:\flutter\bin;%PATH%
flutter run -d edge          # Web (Microsoft Edge)
flutter run -d android       # Android (cần USB debug)
```

### Tài khoản đăng nhập demo
```
admin     / admin123
manager   / manager123
```

---

## 9. DANH SÁCH SCREENSHOTS

| File | Nội dung |
|---|---|
| `SS_01_login.png` | Màn hình đăng nhập |
| `SS_02_login_filled.png` | Nhập admin/admin123 |
| `SS_03_product_list.png` | Danh sách sản phẩm (sau login) |
| `SS_04_add_product.png` | Form thêm sản phẩm |
| `SS_05_add_product_filled.png` | Điền thông tin sản phẩm |
| `SS_09_mongodb_api_list.png` | MongoDB API trả 4 sản phẩm |
| `SS_10_mongodb_health.png` | `"mongodb":"connected"` |
| `08_mongodb_terminal.txt` | Output terminal MongoDB |
| `07_flutter_run_output.txt` | Output `flutter run` trên Edge |

---

## 10. KẾT QUẢ ĐIỂM SỐ

| Tiêu chí | Điểm tối đa | Thực hiện |
|---|---|---|
| CRUD sản phẩm (tensp, loaisp, gia, hinhanh) | 8.0 | ✅ MongoDB + SQLite |
| Nhập và hiển thị hình ảnh | 0.5 | ✅ Gallery + Camera (image_picker) |
| Đăng nhập/Đăng xuất | 0.5 | ✅ SharedPreferences |
| Xóa sản phẩm (có xác nhận) | 0.5 | ✅ Dialog + DELETE API |
| Sửa sản phẩm | 0.5 | ✅ PUT API |
| **Tổng** | **10.0** | **✅** |

---

## 11. KẾT LUẬN

App đã xây dựng đầy đủ theo yêu cầu đề thi:

1. **MongoDB 8.2.6** làm database chính qua REST API (Express + Mongoose)
2. **SQLite** làm fallback khi không có mạng/server
3. **Flutter 3.41.6** với đầy đủ màn hình: Login, Danh sách, Thêm, Sửa, Xóa
4. **image_picker** để chọn ảnh từ Gallery hoặc Camera
5. CSDL chỉ dùng đúng **5 trường**: `idsanpham`, `tensp`, `loaisp`, `gia`, `hinhanh`
6. `flutter analyze` → **No issues found!**
7. `flutter build web` → **Build thành công**

---

*Ngày: 04/04/2026 | Flutter 3.41.6 | MongoDB 8.2.6 | Node.js v22.20.0*

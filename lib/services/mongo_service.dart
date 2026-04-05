import 'dart:io';
import 'package:mongo_dart/mongo_dart.dart';
import '../models/san_pham.dart';

/// Kết nối trực tiếp MongoDB qua mongo_dart (không qua REST API hay backend)
class MongoService {
  /// Trên Android emulator, host machine = 10.0.2.2
  /// Trên desktop (Windows/Linux/macOS) = localhost
  static String get _host =>
      Platform.isAndroid ? '10.0.2.2' : 'localhost';
  static String get _uri =>
      'mongodb://$_host:27017/product_admin_db';
  static const String _collection = 'sanpham';

  static Db?           _db;
  static DbCollection? _col;

  // ─── Kết nối ──────────────────────────────────────────────────────────────
  static Future<void> connect() async {
    if (_db != null && _db!.isConnected) return;
    _db  = await Db.create(_uri);
    await _db!.open();
    _col = _db!.collection(_collection);
    await _col!.createIndex(keys: {'idsanpham': 1}, unique: true);
    await _seedIfEmpty();
  }

  static Future<void> close() async {
    if (_db != null && _db!.isConnected) await _db!.close();
    _db = null; _col = null;
  }

  // ─── Seed dữ liệu mẫu (50 sản phẩm) ──────────────────────────────────────
  static Future<void> _seedIfEmpty() async {
    final count = await _col!.count();
    if (count == 0) {
      await _col!.insertAll([
        // Điện tử
        {'idsanpham': 'SP001', 'tensp': 'Điện thoại Samsung Galaxy A54',  'loaisp': 'Điện tử',   'gia': 8990000,  'hinhanh': null},
        {'idsanpham': 'SP002', 'tensp': 'Điện thoại iPhone 15 Pro',       'loaisp': 'Điện tử',   'gia': 28900000, 'hinhanh': null},
        {'idsanpham': 'SP003', 'tensp': 'Laptop Dell Inspiron 15',        'loaisp': 'Điện tử',   'gia': 15500000, 'hinhanh': null},
        {'idsanpham': 'SP004', 'tensp': 'Laptop ASUS VivoBook 14',        'loaisp': 'Điện tử',   'gia': 12900000, 'hinhanh': null},
        {'idsanpham': 'SP005', 'tensp': 'Tai nghe Sony WH-1000XM5',       'loaisp': 'Điện tử',   'gia': 6990000,  'hinhanh': null},
        {'idsanpham': 'SP006', 'tensp': 'Tai nghe AirPods Pro 2',         'loaisp': 'Điện tử',   'gia': 5490000,  'hinhanh': null},
        {'idsanpham': 'SP007', 'tensp': 'Máy tính bảng iPad Air 5',       'loaisp': 'Điện tử',   'gia': 16500000, 'hinhanh': null},
        {'idsanpham': 'SP008', 'tensp': 'Đồng hồ Apple Watch Series 9',   'loaisp': 'Điện tử',   'gia': 11900000, 'hinhanh': null},
        {'idsanpham': 'SP009', 'tensp': 'Màn hình LG 27 inch 4K',         'loaisp': 'Điện tử',   'gia': 9800000,  'hinhanh': null},
        {'idsanpham': 'SP010', 'tensp': 'Bàn phím cơ Keychron K2',        'loaisp': 'Điện tử',   'gia': 2200000,  'hinhanh': null},
        // Quần áo
        {'idsanpham': 'SP011', 'tensp': 'Áo thun nam cổ tròn',            'loaisp': 'Quần áo',   'gia': 150000,   'hinhanh': null},
        {'idsanpham': 'SP012', 'tensp': 'Áo sơ mi nam dài tay',           'loaisp': 'Quần áo',   'gia': 280000,   'hinhanh': null},
        {'idsanpham': 'SP013', 'tensp': 'Quần jean nam slim fit',          'loaisp': 'Quần áo',   'gia': 450000,   'hinhanh': null},
        {'idsanpham': 'SP014', 'tensp': 'Áo khoác bomber unisex',         'loaisp': 'Quần áo',   'gia': 650000,   'hinhanh': null},
        {'idsanpham': 'SP015', 'tensp': 'Áo polo nam Lacoste',            'loaisp': 'Quần áo',   'gia': 1200000,  'hinhanh': null},
        {'idsanpham': 'SP016', 'tensp': 'Váy midi hoa nhí nữ',            'loaisp': 'Quần áo',   'gia': 380000,   'hinhanh': null},
        {'idsanpham': 'SP017', 'tensp': 'Quần short thể thao nam',        'loaisp': 'Quần áo',   'gia': 220000,   'hinhanh': null},
        {'idsanpham': 'SP018', 'tensp': 'Áo len cổ turtleneck nữ',        'loaisp': 'Quần áo',   'gia': 340000,   'hinhanh': null},
        {'idsanpham': 'SP019', 'tensp': 'Áo hoodie unisex oversize',      'loaisp': 'Quần áo',   'gia': 390000,   'hinhanh': null},
        {'idsanpham': 'SP020', 'tensp': 'Quần âu nam công sở',            'loaisp': 'Quần áo',   'gia': 520000,   'hinhanh': null},
        // Giày dép
        {'idsanpham': 'SP021', 'tensp': 'Giày thể thao Nike Air Max 90',  'loaisp': 'Giày dép',  'gia': 2800000,  'hinhanh': null},
        {'idsanpham': 'SP022', 'tensp': 'Giày Adidas Ultraboost 22',      'loaisp': 'Giày dép',  'gia': 3200000,  'hinhanh': null},
        {'idsanpham': 'SP023', 'tensp': 'Giày Converse Chuck Taylor',     'loaisp': 'Giày dép',  'gia': 1100000,  'hinhanh': null},
        {'idsanpham': 'SP024', 'tensp': 'Dép sandal nam Birkenstock',     'loaisp': 'Giày dép',  'gia': 1800000,  'hinhanh': null},
        {'idsanpham': 'SP025', 'tensp': 'Giày oxford da nam',             'loaisp': 'Giày dép',  'gia': 1500000,  'hinhanh': null},
        {'idsanpham': 'SP026', 'tensp': 'Giày cao gót nữ 7cm',           'loaisp': 'Giày dép',  'gia': 680000,   'hinhanh': null},
        {'idsanpham': 'SP027', 'tensp': 'Giày slip-on Vans Checkerboard', 'loaisp': 'Giày dép',  'gia': 950000,   'hinhanh': null},
        {'idsanpham': 'SP028', 'tensp': 'Dép tông thể thao Crocs',        'loaisp': 'Giày dép',  'gia': 720000,   'hinhanh': null},
        // Thực phẩm
        {'idsanpham': 'SP029', 'tensp': 'Cà phê rang xay Trung Nguyên',   'loaisp': 'Thực phẩm', 'gia': 95000,    'hinhanh': null},
        {'idsanpham': 'SP030', 'tensp': 'Trà xanh Nhật matcha 100g',      'loaisp': 'Thực phẩm', 'gia': 180000,   'hinhanh': null},
        {'idsanpham': 'SP031', 'tensp': 'Mật ong nguyên chất 500ml',      'loaisp': 'Thực phẩm', 'gia': 220000,   'hinhanh': null},
        {'idsanpham': 'SP032', 'tensp': 'Dầu olive extra virgin 750ml',   'loaisp': 'Thực phẩm', 'gia': 165000,   'hinhanh': null},
        {'idsanpham': 'SP033', 'tensp': 'Yến mạch Quaker 1kg',            'loaisp': 'Thực phẩm', 'gia': 89000,    'hinhanh': null},
        {'idsanpham': 'SP034', 'tensp': 'Protein whey Gold Standard 2lbs','loaisp': 'Thực phẩm', 'gia': 850000,   'hinhanh': null},
        {'idsanpham': 'SP035', 'tensp': 'Sữa hạnh nhân Blue Diamond 1L',  'loaisp': 'Thực phẩm', 'gia': 75000,    'hinhanh': null},
        {'idsanpham': 'SP036', 'tensp': 'Hạt điều rang muối 500g',        'loaisp': 'Thực phẩm', 'gia': 120000,   'hinhanh': null},
        // Đồ dùng
        {'idsanpham': 'SP037', 'tensp': 'Bình nước giữ nhiệt Hydro Flask','loaisp': 'Đồ dùng',   'gia': 750000,   'hinhanh': null},
        {'idsanpham': 'SP038', 'tensp': 'Ba lô laptop 15 inch Samsonite', 'loaisp': 'Đồ dùng',   'gia': 1200000,  'hinhanh': null},
        {'idsanpham': 'SP039', 'tensp': 'Nồi chiên không dầu Philips 4L', 'loaisp': 'Đồ dùng',   'gia': 2400000,  'hinhanh': null},
        {'idsanpham': 'SP040', 'tensp': 'Máy xay sinh tố Sunhouse',       'loaisp': 'Đồ dùng',   'gia': 890000,   'hinhanh': null},
        {'idsanpham': 'SP041', 'tensp': 'Đèn bàn LED chống cận',          'loaisp': 'Đồ dùng',   'gia': 320000,   'hinhanh': null},
        {'idsanpham': 'SP042', 'tensp': 'Ghế gaming E-Dra EGC226',        'loaisp': 'Đồ dùng',   'gia': 3500000,  'hinhanh': null},
        {'idsanpham': 'SP043', 'tensp': 'Ổ cứng SSD Samsung 870 Evo 1TB', 'loaisp': 'Đồ dùng',   'gia': 1850000,  'hinhanh': null},
        {'idsanpham': 'SP044', 'tensp': 'Chuột không dây Logitech MX3',   'loaisp': 'Đồ dùng',   'gia': 1490000,  'hinhanh': null},
        // Sách
        {'idsanpham': 'SP045', 'tensp': 'Clean Code - Robert C. Martin',  'loaisp': 'Sách',       'gia': 220000,   'hinhanh': null},
        {'idsanpham': 'SP046', 'tensp': 'The Pragmatic Programmer',       'loaisp': 'Sách',       'gia': 195000,   'hinhanh': null},
        {'idsanpham': 'SP047', 'tensp': 'Đắc Nhân Tâm - Dale Carnegie',  'loaisp': 'Sách',       'gia': 68000,    'hinhanh': null},
        {'idsanpham': 'SP048', 'tensp': 'Tư duy nhanh và chậm',          'loaisp': 'Sách',       'gia': 110000,   'hinhanh': null},
        {'idsanpham': 'SP049', 'tensp': 'Atomic Habits - James Clear',    'loaisp': 'Sách',       'gia': 85000,    'hinhanh': null},
        {'idsanpham': 'SP050', 'tensp': 'Nhà Giả Kim - Paulo Coelho',    'loaisp': 'Sách',       'gia': 52000,    'hinhanh': null},
      ]);
    }
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  static Future<List<SanPham>> getAll() async =>
      (await _col!.find().toList()).map(_fromDoc).toList();

  static Future<List<SanPham>> search(String keyword) async =>
      (await _col!
              .find(where
                  .match('tensp',  keyword, caseInsensitive: true)
                  .or(where.match('loaisp', keyword, caseInsensitive: true)))
              .toList())
          .map(_fromDoc)
          .toList();

  static Future<void> insert(SanPham sp) async =>
      _col!.insert(_toDoc(sp));

  static Future<void> update(SanPham sp) async =>
      _col!.updateOne(
        where.eq('idsanpham', sp.idsanpham),
        modify
            .set('tensp',   sp.tensp)
            .set('loaisp',  sp.loaisp)
            .set('gia',     sp.gia)
            .set('hinhanh', sp.hinhanh),
      );

  static Future<void> delete(String id) async =>
      _col!.deleteOne(where.eq('idsanpham', id));

  // ─── Helpers ──────────────────────────────────────────────────────────────
  static Map<String, dynamic> _toDoc(SanPham sp) => {
    'idsanpham': sp.idsanpham,
    'tensp':     sp.tensp,
    'loaisp':    sp.loaisp,
    'gia':       sp.gia,
    'hinhanh':   sp.hinhanh,
  };

  static SanPham _fromDoc(Map<String, dynamic> d) => SanPham(
    idsanpham: d['idsanpham'] as String,
    tensp:     d['tensp']     as String,
    loaisp:    d['loaisp']    as String,
    gia:       (d['gia']      as num).toDouble(),
    hinhanh:   d['hinhanh']   as String?,
  );
}

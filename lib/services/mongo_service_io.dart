// Triển khai thực tế: kết nối trực tiếp MongoDB qua mongo_dart (native only)
// Hoạt động trên: Windows desktop, Android, iOS, Linux, macOS
// KHÔNG hoạt động trên: Web (dùng mongo_service_stub.dart thay thế)

import 'package:mongo_dart/mongo_dart.dart';
import '../models/san_pham.dart';

class MongoService {
  // ─── Cấu hình kết nối ─────────────────────────────────────────────────────
  static const String _uri = 'mongodb://localhost:27017/product_admin_db';
  static const String _collection = 'sanpham';

  static Db? _db;
  static DbCollection? _col;

  static bool get isSupported => true;

  // ─── Kết nối ──────────────────────────────────────────────────────────────
  static Future<void> connect() async {
    if (_db != null && _db!.isConnected) return;
    _db = await Db.create(_uri);
    await _db!.open();
    _col = _db!.collection(_collection);
    // Tạo index unique trên idsanpham nếu chưa có
    await _col!.createIndex(keys: {'idsanpham': 1}, unique: true);
    await _seedIfEmpty();
  }

  static Future<void> close() async {
    if (_db != null && _db!.isConnected) {
      await _db!.close();
    }
    _db = null;
    _col = null;
  }

  // ─── Seed dữ liệu mẫu lần đầu ────────────────────────────────────────────
  static Future<void> _seedIfEmpty() async {
    final count = await _col!.count();
    if (count == 0) {
      await _col!.insertAll([
        {
          'idsanpham': 'SP001',
          'tensp': 'Áo thun nam',
          'loaisp': 'Quần áo',
          'gia': 150000,
          'hinhanh': null,
        },
        {
          'idsanpham': 'SP002',
          'tensp': 'Điện thoại Samsung A54',
          'loaisp': 'Điện tử',
          'gia': 8990000,
          'hinhanh': null,
        },
        {
          'idsanpham': 'SP003',
          'tensp': 'Giày thể thao Nike',
          'loaisp': 'Giày dép',
          'gia': 1200000,
          'hinhanh': null,
        },
      ]);
    }
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  static Future<List<SanPham>> getAll() async {
    final docs = await _col!.find().toList();
    return docs.map(_fromDoc).toList();
  }

  static Future<List<SanPham>> search(String keyword) async {
    final lower = keyword.toLowerCase();
    final docs = await _col!
        .find(
          where
              .match('tensp', lower, caseInsensitive: true)
              .or(where.match('loaisp', lower, caseInsensitive: true)),
        )
        .toList();
    return docs.map(_fromDoc).toList();
  }

  static Future<SanPham> insert(SanPham sp) async {
    final doc = _toDoc(sp);
    await _col!.insert(doc);
    return sp;
  }

  static Future<SanPham> update(SanPham sp) async {
    await _col!.updateOne(
      where.eq('idsanpham', sp.idsanpham),
      modify
          .set('tensp', sp.tensp)
          .set('loaisp', sp.loaisp)
          .set('gia', sp.gia)
          .set('hinhanh', sp.hinhanh),
    );
    return sp;
  }

  static Future<void> delete(String idsanpham) async {
    await _col!.deleteOne(where.eq('idsanpham', idsanpham));
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  static Map<String, dynamic> _toDoc(SanPham sp) => {
        'idsanpham': sp.idsanpham,
        'tensp': sp.tensp,
        'loaisp': sp.loaisp,
        'gia': sp.gia,
        'hinhanh': sp.hinhanh,
      };

  static SanPham _fromDoc(Map<String, dynamic> doc) => SanPham(
        idsanpham: doc['idsanpham'] as String,
        tensp: doc['tensp'] as String,
        loaisp: doc['loaisp'] as String,
        gia: (doc['gia'] as num).toDouble(),
        hinhanh: doc['hinhanh'] as String?,
      );
}

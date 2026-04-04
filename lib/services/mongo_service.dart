import 'package:mongo_dart/mongo_dart.dart';
import '../models/san_pham.dart';

/// Kết nối trực tiếp MongoDB qua mongo_dart (không qua REST API hay backend)
class MongoService {
  static const String _uri        = 'mongodb://localhost:27017/product_admin_db';
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

  // ─── Seed dữ liệu mẫu ─────────────────────────────────────────────────────
  static Future<void> _seedIfEmpty() async {
    if (await _col!.count() == 0) {
      await _col!.insertAll([
        {'idsanpham': 'SP001', 'tensp': 'Áo thun nam',             'loaisp': 'Quần áo',  'gia': 150000,  'hinhanh': null},
        {'idsanpham': 'SP002', 'tensp': 'Điện thoại Samsung A54',  'loaisp': 'Điện tử',  'gia': 8990000, 'hinhanh': null},
        {'idsanpham': 'SP003', 'tensp': 'Giày thể thao Nike',      'loaisp': 'Giày dép', 'gia': 1200000, 'hinhanh': null},
      ]);
    }
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  static Future<List<SanPham>> getAll() async =>
      (await _col!.find().toList()).map(_fromDoc).toList();

  static Future<List<SanPham>> search(String keyword) async =>
      (await _col!
              .find(where
                  .match('tensp',   keyword, caseInsensitive: true)
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
            .set('tensp',    sp.tensp)
            .set('loaisp',   sp.loaisp)
            .set('gia',      sp.gia)
            .set('hinhanh',  sp.hinhanh),
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

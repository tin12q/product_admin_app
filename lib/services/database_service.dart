import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/san_pham.dart';
import 'mongo_service.dart';

/// Smart DatabaseService:
///   - Native (Windows/Android/iOS/Linux): kết nối MongoDB trực tiếp qua mongo_dart
///   - Web: dùng SQLite (sqflite) vì mongo_dart không hỗ trợ browser
class DatabaseService {
  static bool _mongoOk = false;
  static Database? _sqliteDb;
  static const String _table = 'sanpham';

  // ─── Init ──────────────────────────────────────────────────────────────────
  static Future<void> init() async {
    if (MongoService.isSupported) {
      try {
        await MongoService.connect();
        _mongoOk = true;
      } catch (_) {
        _mongoOk = false;
      }
    }
  }

  static bool get usingMongoDB => _mongoOk;

  // ─── SQLite (web fallback) ─────────────────────────────────────────────────
  static Future<Database> get _db async {
    if (_sqliteDb != null) return _sqliteDb!;
    final dbPath = await getDatabasesPath();
    final p = join(dbPath, 'product_admin.db');
    _sqliteDb = await openDatabase(p, version: 1, onCreate: _createTable);
    return _sqliteDb!;
  }

  static Future<void> _createTable(Database db, int v) async {
    await db.execute('''
      CREATE TABLE $_table (
        idsanpham TEXT PRIMARY KEY,
        tensp TEXT NOT NULL,
        loaisp TEXT NOT NULL,
        gia REAL NOT NULL,
        hinhanh TEXT
      )
    ''');
    for (final row in [
      {'idsanpham': 'SP001', 'tensp': 'Ao thun nam', 'loaisp': 'Quan ao', 'gia': 150000.0, 'hinhanh': null},
      {'idsanpham': 'SP002', 'tensp': 'Dien thoai Samsung A54', 'loaisp': 'Dien tu', 'gia': 8990000.0, 'hinhanh': null},
      {'idsanpham': 'SP003', 'tensp': 'Giay the thao Nike', 'loaisp': 'Giay dep', 'gia': 1200000.0, 'hinhanh': null},
    ]) {
      await db.insert(_table, row);
    }
  }

  // ─── Public CRUD ──────────────────────────────────────────────────────────

  static Future<List<SanPham>> getAllSanPham() async {
    if (_mongoOk) return MongoService.getAll();
    final db = await _db;
    final rows = await db.query(_table, orderBy: 'tensp ASC');
    return rows.map(SanPham.fromMap).toList();
  }

  static Future<void> insertSanPham(SanPham sp) async {
    if (_mongoOk) { await MongoService.insert(sp); return; }
    final db = await _db;
    await db.insert(_table, sp.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  static Future<void> updateSanPham(SanPham sp) async {
    if (_mongoOk) { await MongoService.update(sp); return; }
    final db = await _db;
    await db.update(_table, sp.toMap(), where: 'idsanpham = ?', whereArgs: [sp.idsanpham]);
  }

  static Future<void> deleteSanPham(String idsanpham) async {
    if (_mongoOk) { await MongoService.delete(idsanpham); return; }
    final db = await _db;
    await db.delete(_table, where: 'idsanpham = ?', whereArgs: [idsanpham]);
  }

  static Future<List<SanPham>> searchSanPham(String keyword) async {
    if (_mongoOk) return MongoService.search(keyword);
    final db = await _db;
    final rows = await db.query(
      _table,
      where: 'tensp LIKE ? OR loaisp LIKE ?',
      whereArgs: ['%$keyword%', '%$keyword%'],
      orderBy: 'tensp ASC',
    );
    return rows.map(SanPham.fromMap).toList();
  }
}

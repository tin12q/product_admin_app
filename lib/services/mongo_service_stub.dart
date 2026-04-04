// Stub cho web — mongo_dart không hoạt động trên browser
// Web tự động dùng SQLite (sqflite) thay thế

import '../models/san_pham.dart';

class MongoService {
  static bool get isSupported => false;

  static Future<void> connect() async {}
  static Future<void> close() async {}

  static Future<List<SanPham>> getAll() async => [];
  static Future<List<SanPham>> search(String keyword) async => [];
  static Future<SanPham> insert(SanPham sp) async => sp;
  static Future<SanPham> update(SanPham sp) async => sp;
  static Future<void> delete(String idsanpham) async {}
}

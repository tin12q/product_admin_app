import '../models/san_pham.dart';
import 'mongo_service.dart';

/// DatabaseService — luôn dùng MongoDB trực tiếp qua mongo_dart
class DatabaseService {
  static Future<void> init() => MongoService.connect();

  static bool get usingMongoDB => true;

  static Future<List<SanPham>> getAllSanPham()              => MongoService.getAll();
  static Future<void>          insertSanPham(SanPham sp)    => MongoService.insert(sp);
  static Future<void>          updateSanPham(SanPham sp)    => MongoService.update(sp);
  static Future<void>          deleteSanPham(String id)     => MongoService.delete(id);
  static Future<List<SanPham>> searchSanPham(String kw)     => MongoService.search(kw);
}

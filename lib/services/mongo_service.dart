// Conditional import: tự động chọn đúng implementation theo platform
//   - Native (Windows, Android, iOS, Linux): dùng mongo_dart trực tiếp
//   - Web (browser): dùng stub — fall back sang SQLite

export 'mongo_service_stub.dart'
    if (dart.library.io) 'mongo_service_io.dart';

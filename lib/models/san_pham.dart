class SanPham {
  final String idsanpham;
  final String tensp;
  final String loaisp;
  final double gia;
  final String? hinhanh;

  SanPham({
    required this.idsanpham,
    required this.tensp,
    required this.loaisp,
    required this.gia,
    this.hinhanh,
  });

  Map<String, dynamic> toMap() {
    return {
      'idsanpham': idsanpham,
      'tensp': tensp,
      'loaisp': loaisp,
      'gia': gia,
      'hinhanh': hinhanh,
    };
  }

  factory SanPham.fromMap(Map<String, dynamic> map) {
    return SanPham(
      idsanpham: map['idsanpham'] as String,
      tensp: map['tensp'] as String,
      loaisp: map['loaisp'] as String,
      gia: (map['gia'] as num).toDouble(),
      hinhanh: map['hinhanh'] as String?,
    );
  }

  SanPham copyWith({
    String? idsanpham,
    String? tensp,
    String? loaisp,
    double? gia,
    String? hinhanh,
  }) {
    return SanPham(
      idsanpham: idsanpham ?? this.idsanpham,
      tensp: tensp ?? this.tensp,
      loaisp: loaisp ?? this.loaisp,
      gia: gia ?? this.gia,
      hinhanh: hinhanh ?? this.hinhanh,
    );
  }
}

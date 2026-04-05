import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import '../models/san_pham.dart';
import '../services/database_service.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';
import 'add_product_screen.dart';
import 'edit_product_screen.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  // ── Dữ liệu ──────────────────────────────────────────────────────────────
  List<SanPham> _allProducts    = [];
  List<SanPham> _displayList    = [];
  bool          _isLoading      = true;
  String?       _currentUser;

  // ── Tìm kiếm & lọc ───────────────────────────────────────────────────────
  final _searchCtrl = TextEditingController();
  String? _filterLoaisp;          // null = tất cả
  bool    _groupByLoai = false;

  // ── Phân trang ────────────────────────────────────────────────────────────
  static const int _pageSize = 20;
  int _currentPage = 0;           // 0-based

  // ── Tự động làm mới 10 s ─────────────────────────────────────────────────
  Timer? _refreshTimer;

  // ── Danh mục mẫu (dùng cho dropdown & màu sắc) ───────────────────────────
  static const List<String> _categories = [
    'Điện tử', 'Quần áo', 'Giày dép', 'Thực phẩm', 'Đồ dùng', 'Sách',
  ];

  // ─────────────────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _loadData();
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _silentRefresh(),
    );
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _refreshTimer?.cancel();
    super.dispose();
  }

  // ── Load đầy đủ (có loading indicator) ───────────────────────────────────
  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final user     = await AuthService.getCurrentUser();
    final products = await DatabaseService.getAllSanPham();
    if (!mounted) return;
    setState(() {
      _currentUser  = user;
      _allProducts  = products;
      _isLoading    = false;
      _currentPage  = 0;
      _applyFilters();
    });
  }

  // ── Làm mới im lặng (không hiển thị spinner) ─────────────────────────────
  Future<void> _silentRefresh() async {
    final products = await DatabaseService.getAllSanPham();
    if (!mounted) return;
    setState(() {
      _allProducts = products;
      _applyFilters();
    });
  }

  // ── Áp dụng bộ lọc + phân trang ──────────────────────────────────────────
  void _applyFilters() {
    var list = List<SanPham>.from(_allProducts);

    // Lọc theo từ khoá
    final kw = _searchCtrl.text.trim().toLowerCase();
    if (kw.isNotEmpty) {
      list = list.where((p) =>
        p.tensp.toLowerCase().contains(kw) ||
        p.loaisp.toLowerCase().contains(kw) ||
        p.idsanpham.toLowerCase().contains(kw)
      ).toList();
    }

    // Lọc theo loại
    if (_filterLoaisp != null) {
      list = list.where((p) => p.loaisp == _filterLoaisp).toList();
    }

    // Sắp xếp theo loại khi bật nhóm
    if (_groupByLoai) {
      list.sort((a, b) => a.loaisp.compareTo(b.loaisp));
    }

    // Phân trang
    final start = _currentPage * _pageSize;
    final end   = (start + _pageSize).clamp(0, list.length);
    _displayList = start < list.length ? list.sublist(start, end) : [];

    // Lưu tổng để tính số trang
    _totalFiltered = list.length;
  }

  int _totalFiltered = 0;
  int get _totalPages => (_totalFiltered / _pageSize).ceil().clamp(1, 9999);

  // ── Xóa sản phẩm ─────────────────────────────────────────────────────────
  Future<void> _deleteProduct(SanPham sp) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: Text('Bạn có chắc muốn xóa sản phẩm "${sp.tensp}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Xóa', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await DatabaseService.deleteSanPham(sp.idsanpham);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã xóa sản phẩm "${sp.tensp}"'),
          backgroundColor: Colors.green,
        ),
      );
      await _loadData();
    }
  }

  // ── Đăng xuất ─────────────────────────────────────────────────────────────
  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có muốn đăng xuất không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await AuthService.logout();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  // ── Format giá ───────────────────────────────────────────────────────────
  String _formatGia(double gia) {
    final formatted = gia.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
    return '$formatted đ';
  }

  // ═════════════════════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Quản Lý Sản Phẩm',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.green[700],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'MongoDB',
                style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        backgroundColor: Theme.of(context).primaryColor,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Row(
              children: [
                const Icon(Icons.person, color: Colors.white70, size: 18),
                const SizedBox(width: 4),
                Text(
                  _currentUser ?? '',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            tooltip: 'Đăng xuất',
            onPressed: _logout,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchAndFilter(),
          _buildToolbar(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _displayList.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: _groupByLoai
                            ? _buildGroupedList()
                            : _buildFlatList(),
                      ),
          ),
          _buildPagination(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AddProductScreen()),
          );
          await _loadData();
        },
        icon: const Icon(Icons.add),
        label: const Text('Thêm sản phẩm'),
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
      ),
    );
  }

  // ── Thanh tìm kiếm + lọc loại ────────────────────────────────────────────
  Widget _buildSearchAndFilter() {
    return Container(
      color: Theme.of(context).primaryColor.withValues(alpha: 0.05),
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      child: Row(
        children: [
          // Ô tìm kiếm
          Expanded(
            child: TextField(
              controller: _searchCtrl,
              onChanged: (_) {
                setState(() {
                  _currentPage = 0;
                  _applyFilters();
                });
              },
              decoration: InputDecoration(
                hintText: 'Tìm kiếm sản phẩm...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() {
                            _currentPage = 0;
                            _applyFilters();
                          });
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.white,
                contentPadding:
                    const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Dropdown lọc loại
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _filterLoaisp,
                hint: const Text('Tất cả loại', style: TextStyle(fontSize: 13)),
                items: [
                  const DropdownMenuItem<String>(
                    value: null,
                    child: Text('Tất cả loại', style: TextStyle(fontSize: 13)),
                  ),
                  ..._categories.map((c) => DropdownMenuItem<String>(
                        value: c,
                        child: Text(c, style: const TextStyle(fontSize: 13)),
                      )),
                ],
                onChanged: (val) {
                  setState(() {
                    _filterLoaisp = val;
                    _currentPage  = 0;
                    _applyFilters();
                  });
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Thanh công cụ (tổng số + nhóm loại) ──────────────────────────────────
  Widget _buildToolbar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          Text(
            'Tổng: $_totalFiltered sản phẩm',
            style: TextStyle(
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
          ),
          const Spacer(),
          // Toggle nhóm theo loại
          FilterChip(
            label: const Text('Nhóm loại', style: TextStyle(fontSize: 12)),
            selected: _groupByLoai,
            onSelected: (val) {
              setState(() {
                _groupByLoai = val;
                _currentPage = 0;
                _applyFilters();
              });
            },
            selectedColor:
                Theme.of(context).primaryColor.withValues(alpha: 0.2),
            checkmarkColor: Theme.of(context).primaryColor,
          ),
        ],
      ),
    );
  }

  // ── Danh sách phẳng ───────────────────────────────────────────────────────
  Widget _buildFlatList() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 80),
      itemCount: _displayList.length,
      itemBuilder: (ctx, i) => _buildProductCard(_displayList[i]),
    );
  }

  // ── Danh sách nhóm theo loại ──────────────────────────────────────────────
  Widget _buildGroupedList() {
    // Gom nhóm
    final Map<String, List<SanPham>> groups = {};
    for (final p in _displayList) {
      groups.putIfAbsent(p.loaisp, () => []).add(p);
    }
    final keys = groups.keys.toList()..sort();

    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 80),
      children: [
        for (final key in keys) ...[
          // Header nhóm
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 12, 4, 4),
            child: Row(
              children: [
                Container(
                  width: 4, height: 20,
                  decoration: BoxDecoration(
                    color: _getCategoryColor(key),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '$key (${groups[key]!.length})',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: _getCategoryColor(key),
                  ),
                ),
              ],
            ),
          ),
          ...groups[key]!.map(_buildProductCard),
        ],
      ],
    );
  }

  // ── Phân trang ────────────────────────────────────────────────────────────
  Widget _buildPagination() {
    if (_totalFiltered <= _pageSize) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 4,
            offset: const Offset(0, -2),
          )
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: _currentPage > 0
                ? () => setState(() {
                      _currentPage--;
                      _applyFilters();
                    })
                : null,
          ),
          Text(
            'Trang ${_currentPage + 1} / $_totalPages',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: _currentPage < _totalPages - 1
                ? () => setState(() {
                      _currentPage++;
                      _applyFilters();
                    })
                : null,
          ),
        ],
      ),
    );
  }

  // ── Trạng thái rỗng ───────────────────────────────────────────────────────
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            _searchCtrl.text.isNotEmpty || _filterLoaisp != null
                ? 'Không tìm thấy sản phẩm'
                : 'Chưa có sản phẩm nào',
            style: TextStyle(color: Colors.grey[500], fontSize: 18),
          ),
          if (_searchCtrl.text.isEmpty && _filterLoaisp == null) ...[
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AddProductScreen()),
                );
                await _loadData();
              },
              icon: const Icon(Icons.add),
              label: const Text('Thêm sản phẩm đầu tiên'),
            ),
          ],
        ],
      ),
    );
  }

  // ── Card sản phẩm ─────────────────────────────────────────────────────────
  Widget _buildProductCard(SanPham sp) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => EditProductScreen(sanPham: sp)),
          );
          await _loadData();
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: _buildProductImage(sp.hinhanh),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sp.tensp,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _getCategoryColor(sp.loaisp)
                                .withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            sp.loaisp,
                            style: TextStyle(
                              color: _getCategoryColor(sp.loaisp),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _formatGia(sp.gia),
                      style: TextStyle(
                        color: Theme.of(context).primaryColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'ID: ${sp.idsanpham}',
                      style: TextStyle(color: Colors.grey[500], fontSize: 11),
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit, color: Colors.blue),
                    tooltip: 'Sửa',
                    onPressed: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => EditProductScreen(sanPham: sp)),
                      );
                      await _loadData();
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    tooltip: 'Xóa',
                    onPressed: () => _deleteProduct(sp),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Hình ảnh sản phẩm ─────────────────────────────────────────────────────
  Widget _buildProductImage(String? imagePath) {
    const size = 80.0;
    if (imagePath != null && imagePath.isNotEmpty) {
      final file = File(imagePath);
      if (file.existsSync()) {
        return Image.file(
          file,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => _buildImagePlaceholder(size),
        );
      }
    }
    return _buildImagePlaceholder(size);
  }

  Widget _buildImagePlaceholder(double size) {
    return Container(
      width: size,
      height: size,
      color: Colors.grey[100],
      child: Icon(Icons.image_outlined, color: Colors.grey[400], size: 36),
    );
  }

  // ── Màu theo loại sản phẩm ────────────────────────────────────────────────
  Color _getCategoryColor(String loaisp) {
    const colors = {
      'Điện tử':   Colors.blue,
      'Quần áo':   Colors.purple,
      'Giày dép':  Colors.orange,
      'Thực phẩm': Colors.green,
      'Đồ dùng':   Colors.teal,
      'Sách':      Colors.brown,
    };
    return colors[loaisp] ?? Colors.grey;
  }
}

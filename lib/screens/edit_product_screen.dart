import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import '../models/san_pham.dart';
import '../services/database_service.dart';

class EditProductScreen extends StatefulWidget {
  final SanPham sanPham;
  const EditProductScreen({super.key, required this.sanPham});

  @override
  State<EditProductScreen> createState() => _EditProductScreenState();
}

class _EditProductScreenState extends State<EditProductScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _tenspCtrl;
  late final TextEditingController _giaCtrl;
  late String? _selectedLoaisp;
  late String? _imagePath;
  bool _isSaving = false;

  static const List<String> _categories = [
    'Điện tử',
    'Quần áo',
    'Giày dép',
    'Thực phẩm',
    'Đồ dùng',
    'Sách',
    'Khác',
  ];

  @override
  void initState() {
    super.initState();
    final sp = widget.sanPham;
    _tenspCtrl = TextEditingController(text: sp.tensp);
    _giaCtrl = TextEditingController(text: sp.gia.toStringAsFixed(0));
    _selectedLoaisp = _categories.contains(sp.loaisp) ? sp.loaisp : 'Khác';
    _imagePath = sp.hinhanh;
  }

  @override
  void dispose() {
    _tenspCtrl.dispose();
    _giaCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (picked != null) {
        setState(() => _imagePath = picked.path);
      }
    } on PlatformException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Lỗi: ${e.message}'),
            backgroundColor: Colors.red),
      );
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Chọn nguồn ảnh',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Colors.blue,
                  child: Icon(Icons.photo_library, color: Colors.white),
                ),
                title: const Text('Thư viện ảnh'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Colors.green,
                  child: Icon(Icons.camera_alt, color: Colors.white),
                ),
                title: const Text('Chụp ảnh'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
              if (_imagePath != null)
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Colors.red,
                    child: Icon(Icons.delete, color: Colors.white),
                  ),
                  title: const Text('Xóa ảnh'),
                  onTap: () {
                    Navigator.pop(ctx);
                    setState(() => _imagePath = null);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedLoaisp == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn loại sản phẩm!'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    setState(() => _isSaving = true);
    final updated = widget.sanPham.copyWith(
      tensp: _tenspCtrl.text.trim(),
      loaisp: _selectedLoaisp,
      gia: double.parse(_giaCtrl.text.replaceAll(',', '')),
      hinhanh: _imagePath,
    );
    await DatabaseService.updateSanPham(updated);
    if (!mounted) return;
    setState(() => _isSaving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Cập nhật sản phẩm thành công!'),
        backgroundColor: Colors.green,
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Sửa Sản Phẩm',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.orange,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.tag, color: Colors.grey, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'ID: ${widget.sanPham.idsanpham}',
                      style: const TextStyle(
                        color: Colors.grey,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: GestureDetector(
                  onTap: _showImageSourceDialog,
                  child: Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[300]!, width: 2),
                    ),
                    child: _imagePath != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.file(
                              File(_imagePath!),
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) => _buildImageHint(),
                            ),
                          )
                        : _buildImageHint(),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: TextButton.icon(
                  onPressed: _showImageSourceDialog,
                  icon: const Icon(Icons.add_photo_alternate),
                  label: Text(
                    _imagePath == null ? 'Thêm hình ảnh' : 'Thay đổi hình ảnh',
                  ),
                ),
              ),
              const SizedBox(height: 24),
              _buildLabel('Tên sản phẩm *'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _tenspCtrl,
                textCapitalization: TextCapitalization.words,
                decoration: _inputDecoration(
                  hint: 'Nhập tên sản phẩm',
                  icon: Icons.inventory_2,
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Vui lòng nhập tên sản phẩm';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              _buildLabel('Loại sản phẩm *'),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                // ignore: deprecated_member_use
                value: _selectedLoaisp,
                decoration: _inputDecoration(
                  hint: 'Chọn loại sản phẩm',
                  icon: Icons.category,
                ),
                items: _categories.map((cat) {
                  return DropdownMenuItem(value: cat, child: Text(cat));
                }).toList(),
                onChanged: (v) => setState(() => _selectedLoaisp = v),
              ),
              const SizedBox(height: 16),
              _buildLabel('Giá (VNĐ) *'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _giaCtrl,
                keyboardType: TextInputType.number,
                decoration: _inputDecoration(
                  hint: 'Nhập giá sản phẩm',
                  icon: Icons.attach_money,
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Vui lòng nhập giá';
                  final price = double.tryParse(v.replaceAll(',', ''));
                  if (price == null || price <= 0) return 'Giá không hợp lệ';
                  return null;
                },
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _save,
                  icon: _isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.save),
                  label: Text(
                    _isSaving ? 'Đang lưu...' : 'CẬP NHẬT SẢN PHẨM',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageHint() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.add_photo_alternate, size: 60, color: Colors.grey[400]),
        const SizedBox(height: 8),
        Text('Nhấn để chọn ảnh', style: TextStyle(color: Colors.grey[500])),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
    );
  }

  InputDecoration _inputDecoration(
      {required String hint, required IconData icon}) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      filled: true,
      fillColor: Colors.grey[50],
      contentPadding:
          const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
    );
  }
}

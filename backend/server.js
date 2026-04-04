const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const MONGO_URI = 'mongodb://localhost:27017/product_admin_db';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ========== SCHEMA / MODEL ==========
// Chỉ dùng đúng 5 trường theo yêu cầu đề thi
const sanPhamSchema = new mongoose.Schema({
  idsanpham: { type: String, required: true, unique: true },
  tensp:     { type: String, required: true },
  loaisp:    { type: String, required: true },
  gia:       { type: Number, required: true },
  hinhanh:   { type: String, default: null },
});

const SanPham = mongoose.model('SanPham', sanPhamSchema, 'sanpham');

// ========== CONNECT MONGODB ==========
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Kết nối MongoDB thành công:', MONGO_URI);
    // Thêm dữ liệu mẫu nếu collection rỗng
    const count = await SanPham.countDocuments();
    if (count === 0) {
      await SanPham.insertMany([
        { idsanpham: 'SP001', tensp: 'Áo thun nam',            loaisp: 'Quần áo', gia: 150000,  hinhanh: null },
        { idsanpham: 'SP002', tensp: 'Điện thoại Samsung A54', loaisp: 'Điện tử', gia: 8990000, hinhanh: null },
        { idsanpham: 'SP003', tensp: 'Giày thể thao Nike',     loaisp: 'Giày dép', gia: 1200000, hinhanh: null },
      ]);
      console.log('✅ Đã thêm dữ liệu mẫu (3 sản phẩm)');
    }
  })
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err.message));

// ========== API ROUTES ==========

// GET /api/sanpham — Lấy tất cả sản phẩm (có tìm kiếm)
app.get('/api/sanpham', async (req, res) => {
  try {
    const { q } = req.query;
    let filter = {};
    if (q) {
      filter = { $or: [
        { tensp:  { $regex: q, $options: 'i' } },
        { loaisp: { $regex: q, $options: 'i' } },
      ]};
    }
    const products = await SanPham.find(filter).sort({ tensp: 1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sanpham/:id — Lấy 1 sản phẩm
app.get('/api/sanpham/:id', async (req, res) => {
  try {
    const sp = await SanPham.findOne({ idsanpham: req.params.id });
    if (!sp) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: sp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/sanpham — Thêm sản phẩm mới
app.post('/api/sanpham', async (req, res) => {
  try {
    const { tensp, loaisp, gia, hinhanh } = req.body;
    const sp = new SanPham({
      idsanpham: uuidv4().substring(0, 8).toUpperCase(),
      tensp, loaisp, gia,
      hinhanh: hinhanh || null,
    });
    await sp.save();
    console.log('➕ Thêm sản phẩm:', sp.tensp);
    res.status(201).json({ success: true, data: sp });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/sanpham/:id — Cập nhật sản phẩm
app.put('/api/sanpham/:id', async (req, res) => {
  try {
    const { tensp, loaisp, gia, hinhanh } = req.body;
    const sp = await SanPham.findOneAndUpdate(
      { idsanpham: req.params.id },
      { tensp, loaisp, gia, hinhanh: hinhanh || null },
      { new: true }
    );
    if (!sp) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    console.log('✏️  Cập nhật sản phẩm:', sp.tensp);
    res.json({ success: true, data: sp });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/sanpham/:id — Xóa sản phẩm
app.delete('/api/sanpham/:id', async (req, res) => {
  try {
    const sp = await SanPham.findOneAndDelete({ idsanpham: req.params.id });
    if (!sp) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    console.log('🗑️  Xóa sản phẩm:', sp.tensp);
    res.json({ success: true, message: 'Đã xóa thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server chạy tại http://localhost:${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   GET    /api/sanpham        — Lấy danh sách`);
  console.log(`   GET    /api/sanpham/:id    — Lấy 1 sản phẩm`);
  console.log(`   POST   /api/sanpham        — Thêm mới`);
  console.log(`   PUT    /api/sanpham/:id    — Cập nhật`);
  console.log(`   DELETE /api/sanpham/:id    — Xóa`);
  console.log(`   GET    /api/health         — Kiểm tra trạng thái`);
});

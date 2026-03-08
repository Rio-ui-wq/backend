const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB接続
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB接続成功"))
  .catch((err) => console.error("接続失敗:", err));

// 記録のスキーマ
const recordSchema = new mongoose.Schema({
  bookId: String,
  bookTitle: String,
  progress: Number,
  rating: Number,
  userId: String,
  userDisplayName: String,
  dropped: { type: Boolean, default: false },
  finished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Record = mongoose.model("Record", recordSchema);

// 記録を保存
app.post("/records", async (req, res) => {
  try {
    const { userId, bookId, progress } = req.body;
    const record = await Record.findOneAndUpdate(
      { userId, bookId, progress },
      req.body,
      { upsert: true, new: true }
    );
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 自分の記録だけ取得
app.get("/records/:bookId/mine", async (req, res) => {
  try {
    const records = await Record.find({ 
      bookId: req.params.bookId,
      userId: req.query.userId
    }).sort({ progress: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 離脱データ取得
app.get("/records/:bookId/dropped", async (req, res) => {
  try {
    const records = await Record.find({ 
      bookId: req.params.bookId,
      dropped: true
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 離脱率統計取得
app.get("/records/:bookId/stats", async (req, res) => {
  try {
    const total = await Record.countDocuments({ 
      bookId: req.params.bookId,
      $or: [{ dropped: true }, { finished: true }]
    });
    const dropped = await Record.countDocuments({ 
      bookId: req.params.bookId,
      dropped: true 
    });
    const dropRate = total > 0 ? Math.round((dropped / total) * 100) : 0;
    res.json({ total, dropped, dropRate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 全員の記録を取得
app.get("/records/:bookId", async (req, res) => {
  try {
    const records = await Record.find({ bookId: req.params.bookId }).sort({ progress: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 本棚スキーマ
const bookshelfSchema = new mongoose.Schema({
  userId: String,
  bookId: String,
  bookTitle: String,
  bookAuthor: String,
  bookThumbnail: String,
  addedAt: { type: Date, default: Date.now }
});

const Bookshelf = mongoose.model("Bookshelf", bookshelfSchema);

// 本棚に追加
app.post("/bookshelf", async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    const existing = await Bookshelf.findOne({ userId, bookId });
    if (existing) return res.json(existing);
    const item = new Bookshelf(req.body);
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 本棚を取得
app.get("/bookshelf/:userId", async (req, res) => {
  try {
    const items = await Bookshelf.find({ userId: req.params.userId }).sort({ addedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`サーバー起動中：http://localhost:${process.env.PORT}`);
});
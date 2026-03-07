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
  createdAt: { type: Date, default: Date.now }
});

const Record = mongoose.model("Record", recordSchema);

// 記録を保存
app.post("/records", async (req, res) => {
  try {
    const record = new Record(req.body);
    await record.save();
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

// 全員の記録を取得
app.get("/records/:bookId", async (req, res) => {
  try {
    const records = await Record.find({ bookId: req.params.bookId }).sort({ progress: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




app.listen(process.env.PORT, () => {
  console.log(`サーバー起動中：http://localhost:${process.env.PORT}`);
});
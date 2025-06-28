const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// MongoDB接続
mongoose.connect('mongodb://localhost:27017/scheduler', { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

// スキーマ定義
const scheduleSchema = new mongoose.Schema({
  date: String,
  title: String,
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

// APIエンドポイント
app.get('/schedules', async (req, res) => {
  const schedules = await Schedule.find();
  res.json(schedules);
});

app.post('/schedules', async (req, res) => {
  const newSchedule = new Schedule(req.body);
  await newSchedule.save();
  res.json(newSchedule);
});

app.put('/schedules/:id', async (req, res) => {
  const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedSchedule);
});

app.delete('/schedules/:id', async (req, res) => {
  await Schedule.findByIdAndDelete(req.params.id);
  res.json({ message: 'Schedule deleted' });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

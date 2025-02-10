const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect('mongodb+srv://Soham:Soham12345@cluster0.2fkrg.mongodb.net/videosDB?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Schema and Model
const videoSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  title: { type: String, default: 'Untitled Video' },
  session: { type: String, default: 'Uncategorized' },
});
const Video = mongoose.model('Video', videoSchema);

// Multer Configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// Upload Video Endpoint
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const { title = 'Untitled Video', session = 'Uncategorized' } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const newVideo = new Video({
      filename: req.file.filename,
      originalname: req.file.originalname,
      title,
      session,
    });

    await newVideo.save();
    res.status(201).json({ message: 'Video uploaded successfully!', video: newVideo });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Error uploading video' });
  }
});

// List Videos Endpoint
app.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching videos' });
  }
});

// Stream Video with Range Support
app.get('/stream/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  fs.stat(filePath, (err, stat) => {
    if (err || !stat) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send('Requested range not satisfiable');
        return;
      }

      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

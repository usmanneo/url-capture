const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}.png`);
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Model
const Url = require('./models/Url');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.post('/generate', (req, res) => {
  const uniqueId = uuidv4();
  const originalUrl = req.body.url;
  const captureUrl = `https://${req.headers.host}/c/${uniqueId}?url=${encodeURIComponent(originalUrl)}`;
  const newUrl = new Url({ url: originalUrl, uniqueId });
  newUrl.save()
    .then(() => res.json({ captureUrl }))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.get('/c/:id', (req, res) => {
  const id = req.params.id;
  res.sendFile(path.join(__dirname, 'public', 'capture.html'));
});

app.post('/upload/:id', upload.single('image'), async (req, res) => {
  const id = req.params.id;
  const imageUrl = `/uploads/${req.file.filename}`;

  try {
    await Url.findOneAndUpdate({ uniqueId: id }, { screenshot: imageUrl }, { new: true });
    res.json({ imageUrl });
  } catch (err) {
    console.error('Error saving image:', err);
    res.sendStatus(500);
  }
});

app.get('/image/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const url = await Url.findOne({ uniqueId: id });
    if (url && url.screenshot) {
      res.redirect(url.screenshot);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error('Error fetching image:', err);
    res.sendStatus(500);
  }
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

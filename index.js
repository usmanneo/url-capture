const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { bucket } = require('./firebase'); // Ensure this path is correct
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

app.post('/upload/:id', async (req, res) => {
    const id = req.params.id;
    const imageData = req.body.image.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(imageData, 'base64');
    const fileName = `${id}.png`;
    const file = bucket.file(fileName);

    const stream = file.createWriteStream({
        metadata: {
            contentType: 'image/png',
        },
    });

    stream.on('error', (err) => {
        console.error('Error uploading to Firebase:', err);
        res.sendStatus(500);
    });

    stream.on('finish', async () => {
        try {
            await file.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            await Url.findOneAndUpdate({ uniqueId: id }, { screenshot: imageUrl }, { new: true });
            res.json({ imageUrl }); // Ensure this line sends the image URL back to the client
        } catch (err) {
            console.error('Error making file public or updating database:', err);
            res.sendStatus(500);
        }
    });

    stream.end(imageBuffer);
});

app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const file = bucket.file(filename);
    file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
    }).then(signedUrls => {
        res.redirect(signedUrls[0]);
    }).catch(err => {
        console.error('Error getting signed URL:', err);
        res.sendStatus(500);
    });
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

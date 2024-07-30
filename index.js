const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('./cloudinary'); // Ensure this path is correct
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

    try {
        cloudinary.uploader.upload_stream({ resource_type: 'image', public_id: fileName }, (error, result) => {
            if (error) {
                console.error('Error uploading to Cloudinary:', error);
                return res.sendStatus(500);
            }
            const imageUrl = result.secure_url;
            console.log('Image URL:', imageUrl); // Debug log
            Url.findOneAndUpdate({ uniqueId: id }, { screenshot: imageUrl }, { new: true })
                .then(() => res.json({ imageUrl }))
                .catch(err => res.status(500).json({ error: err.message }));
        }).end(imageBuffer);
    } catch (err) {
        console.error('Error uploading to Cloudinary:', err);
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

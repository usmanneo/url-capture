const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    screenshot: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Url', UrlSchema);

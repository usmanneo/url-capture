const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    uniqueId: {
        type: String,
        required: true
    },
    screenshot: {
        type: String,
    }
});

module.exports = mongoose.model('Url', UrlSchema);

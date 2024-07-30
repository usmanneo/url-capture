const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const urlSchema = new Schema({
    originalUrl: { type: String, required: true },
    uniqueId: { type: String, required: true, unique: true },
    redirectUrl: { type: String, required: true },
    imageData: { type: String, default: null } // Add this line
});

module.exports = mongoose.model('Url', urlSchema);

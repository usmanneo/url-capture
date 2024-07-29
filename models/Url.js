const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  uniqueId: String,
  redirectUrl: String,
  imagePath: String, // Add this field
  imageData: String // Add this field to store image data
});

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;

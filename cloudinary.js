const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'your_cloud_name', // replace with your Cloudinary cloud name
  api_key: '156336359935233', // replace with your Cloudinary API key
  api_secret: 'SBecBuIwu0GA_CzfjSTEhA2WGEM' // replace with your Cloudinary API secret
});

module.exports = cloudinary;

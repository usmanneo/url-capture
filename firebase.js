const admin = require('firebase-admin');
const serviceAccount = require('./camerhack-f7172-firebase-adminsdk-s3vcp-80239c4911.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
});

const bucket = admin.storage().bucket();

module.exports = { bucket };

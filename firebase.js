const admin = require('firebase-admin');
const serviceAccount = require('./path/to/your/firebase-adminsdk-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
});

const bucket = admin.storage().bucket();

module.exports = { bucket };

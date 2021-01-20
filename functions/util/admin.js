const admin = require("firebase-admin");

// admin.initializeApp(functions.config().firebase);
admin.initializeApp();

const db = admin.firestore();

module.exports = { admin, db };

const functions = require('firebase-functions');
const jens = require('./jens')
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.slashCommand = functions.https.onRequest(jens.slashCommand);
exports.checkAllUsers = functions.https.onRequest(jens.checkAllUsers);
exports.scheduledFunction = functions.pubsub.schedule("every 1 hours").onRun(jens.checkAllUsers)
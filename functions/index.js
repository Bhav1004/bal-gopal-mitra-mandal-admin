const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();

const db        = admin.firestore();
const messaging = admin.messaging();

// ── Quiet hours: no notifications 10 PM – 7 AM ────────────────────────────────
function isQuietHours() {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 7;
}

// ── sendNotification (callable from admin panel) ──────────────────────────────
// Called by the admin panel JS: firebase.functions().httpsCallable('sendNotification')
exports.sendNotification = functions.https.onCall(async (data, context) => {
  // Only authenticated admins can send
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }

  const { title, body, topic } = data;
  if (!title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Title and body are required.');
  }

  if (isQuietHours()) {
    throw new functions.https.HttpsError('failed-precondition',
      'Quiet hours active (10 PM – 7 AM). Notification not sent.');
  }

  // Get all registered device tokens
  const tokensSnap = await db.collection('device_tokens').get();
  if (tokensSnap.empty) {
    throw new functions.https.HttpsError('not-found', 'No registered devices found.');
  }

  const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);
  if (tokens.length === 0) {
    throw new functions.https.HttpsError('not-found', 'No valid tokens found.');
  }

  // Send in batches of 500 (FCM limit)
  const batchSize = 500;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    const message = {
      notification: { title, body },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'mandal_channel' }
      },
      tokens: batch
    };

    const response = await messaging.sendEachForMulticast(message);
    successCount += response.successCount;
    failureCount += response.failureCount;

    // Remove invalid tokens
    const toDelete = [];
    response.responses.forEach((r, idx) => {
      if (!r.success &&
          (r.error.code === 'messaging/invalid-registration-token' ||
           r.error.code === 'messaging/registration-token-not-registered')) {
        toDelete.push(batch[idx]);
      }
    });
    if (toDelete.length) {
      const batchWrite = db.batch();
      tokensSnap.docs
        .filter(d => toDelete.includes(d.data().token))
        .forEach(d => batchWrite.delete(d.ref));
      await batchWrite.commit();
    }
  }

  // Log to Firestore
  await db.collection('notification_history').add({
    title, body,
    sentAt:       admin.firestore.FieldValue.serverTimestamp(),
    sentBy:       context.auth.token.email || context.auth.uid,
    successCount, failureCount,
    totalDevices: tokens.length
  });

  return { successCount, failureCount, totalDevices: tokens.length };
});

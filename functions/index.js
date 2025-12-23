const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Use SendGrid API key from functions config: functions.config().sendgrid.key
// Admin email from functions.config().notify.email
if(functions.config && functions.config().sendgrid && functions.config().sendgrid.key){
  sgMail.setApiKey(functions.config().sendgrid.key);
}

// Helper to send email
async function sendEmail(subject, text, html){
  const to = (functions.config().notify && functions.config().notify.email) || 'lordnewtguillemot@gmail.com';
  if(!functions.config().sendgrid || !functions.config().sendgrid.key){
    console.log('SendGrid API key not configured. Skipping email.');
    return;
  }
  const msg = {
    to,
    from: 'no-reply@newt.dog',
    subject,
    text,
    html
  };
  await sgMail.send(msg);
}

// Notify on new guestbook entry
exports.notifyGuestbook = functions.firestore
  .document('guestbook/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const subject = `New guestbook entry from ${data.name || 'anonymous'}`;
    const text = `${data.name || 'anonymous'} wrote:\n\n${data.message || ''}`;
    const html = `<p><strong>${data.name || 'anonymous'}</strong> wrote:</p><p>${data.message || ''}</p>`;
    try{ await sendEmail(subject, text, html); }catch(e){ console.error('Email send error', e); }
  });

// Notify on new FAQ question
exports.notifyFaq = functions.firestore
  .document('faq/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const subject = `New FAQ question`;
    const text = `Question: ${data.q || ''}`;
    const html = `<p><strong>Question:</strong> ${data.q || ''}</p>`;
    try{ await sendEmail(subject, text, html); }catch(e){ console.error('Email send error', e); }
  });

// Notify when FAQ gets an answer (a field set)
exports.notifyFaqAnswered = functions.firestore
  .document('faq/{docId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    if(!before.a && after.a){
      const subject = `FAQ answered`;
      const text = `Q: ${after.q || ''}\nA: ${after.a || ''}`;
      const html = `<p><strong>Q:</strong> ${after.q || ''}</p><p><strong>A:</strong> ${after.a || ''}</p>`;
      try{ await sendEmail(subject, text, html); }catch(e){ console.error('Email send error', e); }
    }
  });

// HTTP endpoint to increment visit counter (idempotent-ish) and return new count
exports.incrementVisit = functions.https.onRequest(async (req, res) => {
  try{
    const db = admin.firestore();
    const ref = db.doc('metrics/visits');
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      let count = 0;
      if(snap.exists){
        const d = snap.data();
        count = d.count || 0;
      }
      count++;
      tx.set(ref, { count, last: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return count;
    });
    res.json({ count: result });
  }catch(err){
    console.error('incrementVisit error', err);
    res.status(500).json({ error: String(err) });
  }
});

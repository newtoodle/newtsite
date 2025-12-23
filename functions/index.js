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

// Cloud Functions removed per repository cleanup.
// If you later want server-side notifications or an HTTP endpoint for
// visit-count increments, I can recreate these functions and help
// redeploy them (note: deploying Functions may require upgrading the
// Firebase project billing plan).

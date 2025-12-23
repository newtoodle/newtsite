Firebase setup for Newt Site

Overview

This project supports optional Firestore-backed public persistence for the guestbook and FAQ. If you want entries to be visible to everyone (and shared across visitors), follow these steps to create a Firebase project and wire it into the site.

1) Create a Firebase project
- Go to https://console.firebase.google.com/ and create a new project (e.g., "newt-site").

2) Add a Web App
- In the project, click the gear → Project settings → "Add app" → Web.
- Register an app id (e.g., `newt-site-web`) and Firebase will show you a config object.
- Copy the config object (it looks like { apiKey: ..., authDomain: ..., projectId: ..., ... }).

3) Provide the config to the site
- Create a file in the site root named `firebase-config.js` (do NOT commit it to public GitHub if you want to keep the apiKey private; it's okay to use for public web apps but be cautious). Example content:

```javascript
// firebase-config.js (DO NOT commit to public repos if you want to keep keys private)
window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```
- Include the file on every page (add a `<script src="/firebase-config.js"></script>` before `script.js`) or paste the object into the browser console for quick tests.

4) Enable Cloud Firestore
- In the Firebase console go to Database → Cloud Firestore → Create database.
- Start in "Test mode" if you want quick setup (allows open reads/writes for 30 days). For production, set secure rules.

Example permissive rules (not recommended for long-term):

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Better rules would allow reads for everyone but writes only with some verification, or use App Check / Firebase Authentication.

5) (Optional) Configure indexes
- The site orders entries by `t` and performs simple queries. Firestore automatically handles simple ordering — no manual index needed for the patterns used here.

6) Test the site
- Add `firebase-config.js` to the site (and load it before `script.js`). The site will load the Firebase SDK dynamically and start writing/reading from Firestore.
- The guestbook and FAQ will automatically switch from localStorage to Firestore when `window.FIREBASE_CONFIG` is detected.

Security notes
- The `apiKey` in Firebase config is not a secret by itself. However, consider securing your database rules before going public.
- Avoid committing `firebase-config.js` with production keys into public repos if you want to reduce risk.

If you want, tell me the Firebase `config` (or paste the `firebase-config.js` content) and I will add it into the repo locally for you, or I can guide you step-by-step for your DNS/HTTPS tasks next.

Moderation and notifications

This project supports a simple moderation workflow:

- Submissions written to Firestore are saved with `approved: false` by default.
- Public pages show only entries where `approved === true` (localStorage entries without the flag are treated as approved for backward compatibility).
- You can review and approve entries by visiting the public pages with `?admin=1` appended to the URL (e.g., `https://newt.dog/guestbook.html?admin=1`). That enables approve/delete buttons next to each submission.

Recommended production setup

- Use Firebase Authentication for a proper admin sign-in flow and update Firestore security rules so only authenticated admin users can write the `approved` flag. Example rule fragment:

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /guestbook/{docId} {
      allow read: if true;
      allow create: if true; // or require some validation
      allow update, delete: if request.auth != null && request.auth.token.admin == true;
    }
    match /faq/{docId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

Set custom claims for your admin account via the Firebase Admin SDK (server side) to include `admin: true`.

Email notifications (optional)

Cloud Functions are optional and require the Firebase project to be on the Blaze (pay-as-you-go) plan. If you prefer a free route, you can deploy a small Google Apps Script web app that accepts POSTs from the site and sends mail via `MailApp.sendEmail()` — this avoids Blaze billing and still provides notifications.

Deploying the rules

After adding `firestore.rules` to the repo, you can deploy rules with the Firebase CLI:

```bash
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

If you later decide you want Cloud Functions for server-side notifications, tell me and I will re-create the functions and guide a deploy (note: Cloud Functions deployment may require upgrading the project billing plan).

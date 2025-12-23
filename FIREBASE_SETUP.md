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

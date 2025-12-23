Deploying Cloud Functions

1) Install Firebase CLI and login:

```bash
npm install -g firebase-tools
firebase login
```

2) From your project root (this repo), initialize functions if you haven't already:

```bash
cd "/Users/clare/Newt Site"
firebase init functions
# choose JavaScript, and choose the existing functions folder if prompted
```

3) Set secrets (SendGrid API key and admin email):

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY" notify.email="lordnewtguillemot@gmail.com"
```

4) Install dependencies and deploy:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

5) After deploy, note the `incrementVisit` URL printed by deploy logs; set `window.FIREBASE_FUNCTIONS_URL` in your `firebase-config.js` or paste into the site (optional).

This folder previously contained Cloud Functions for notifications. Functions
have been removed from the repository per cleanup to avoid requiring the
Blaze billing plan. If you later want server-side logic, ask me and I will
recreate the minimal functions and deployment steps.

# Admin Panel — Deployment Guide

## One-time Firebase Setup (do this first)

### 1. Add a Web App to Firebase
1. Go to https://console.firebase.google.com/project/bal-gopal-mitra-mandal
2. Click ⚙ → **Project Settings** → **Your apps** → **Add app** → **Web (</>)**
3. Register app name: `Admin Panel`
4. Copy the `appId` value (looks like `1:204903030798:web:xxxxxxxxx`)
5. Open `public/index.html` and replace `REPLACE_WITH_WEB_APP_ID` with this value

### 2. Create the Admin User
1. Firebase Console → **Authentication** → **Sign-in method** → Enable **Email/Password**
2. Go to **Users** tab → **Add user**
3. Email: your committee email | Password: strong password
4. This is the only login that can access the admin panel

### 3. Deploy Firestore & Storage Rules
```bash
cd admin-panel
npm install -g firebase-tools   # one-time install
firebase login
firebase deploy --only firestore:rules,storage:rules
```

---

## Deploy the Admin Panel (Instant — no build needed)

The `public/index.html` is a fully self-contained admin panel.
Deploy it directly:

```bash
cd admin-panel
firebase deploy --only hosting
```

**Done!** Your panel will be live at:
`https://bal-gopal-mitra-mandal.web.app`

---

## Optional: Next.js Build (production-grade)

If you want to deploy the full Next.js version instead:

```bash
cd admin-panel
npm install
npm run build          # generates out/ folder
# Then update firebase.json: change "public" from "public" to "out"
firebase deploy --only hosting
```

> Note: Next.js build requires Node.js 18+ and ~2GB RAM.

---

## Seeding Demo Data (optional)

To pre-populate Firestore with demo content, paste this in the
browser console while logged into the admin panel:

```js
// Run in browser console on the admin panel page
const db = firebase.firestore();

// Sample update
db.collection('updates').add({
  title: 'Ganesh Chaturthi Celebration Begins!',
  body: 'We are delighted to announce the start of our 10-day Ganeshotsav celebrations.',
  tag: 'event', isPinned: true, timestamp: Date.now()
});

// Sample aarti
db.collection('aartis').add({
  name: 'सुखकर्ता दुखहर्ता',
  lyrics: `सुखकर्ता दुखहर्ता वार्ता विघ्नाची ।\nनुरवी पुरवी प्रेम कृपा जयाची ।`,
  order: 1, isActive: true
});

// Sample schedule day
db.collection('schedule').add({
  dayNumber: 1, date: '22 Aug', dayName: 'Day 1 — Ganesh Sthapana',
  events: [
    { time: '7:00 AM', name: 'Puja & Sthapana', notes: '' },
    { time: '7:30 PM', name: 'Evening Aarti', notes: 'Sukhkarta Dukhharta' }
  ]
});
```

---

## Android App Data Flow

The Android app reads from the same Firebase project automatically.
- Updates posted in admin panel → appear in app's Updates tab immediately
- Schedule added → appears in app's Schedule tab
- Aartis added → synced to app on next launch (cached offline)
- Feedback submitted in app → appears in admin panel's Feedback tab

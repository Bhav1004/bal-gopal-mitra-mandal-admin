import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// ─── Firebase Web App Config ───────────────────────────────────────────────────
// These values come from your Firebase project → Project Settings → Web App.
// The project is "bal-gopal-mitra-mandal". If you haven't added a Web App yet:
//   1. Go to https://console.firebase.google.com/project/bal-gopal-mitra-mandal
//   2. Click ⚙ → Project Settings → "Add app" → Web
//   3. Copy the firebaseConfig object and paste the appId below.
// ──────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            'AIzaSyAvhjTvs-Edpuk4Fwu2gj1r5BZY5owF8O4',
  authDomain:        'bal-gopal-mitra-mandal.firebaseapp.com',
  projectId:         'bal-gopal-mitra-mandal',
  storageBucket:     'bal-gopal-mitra-mandal.firebasestorage.app',
  messagingSenderId: '204903030798',
  appId:             'REPLACE_WITH_WEB_APP_ID',   // ← Add this from Firebase console
}

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)

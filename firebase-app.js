import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

// Configuration combining existing firebase-applet-config.json with any runtime environment overrides
export const config = {
  projectId:
    (typeof process !== 'undefined' && process.env?.FIREBASE_PROJECT_ID) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
    firebaseConfig.projectId,
  appId:
    (typeof process !== 'undefined' && process.env?.FIREBASE_APP_ID) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    firebaseConfig.appId,
  apiKey:
    (typeof process !== 'undefined' && process.env?.FIREBASE_API_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    firebaseConfig.apiKey,
  authDomain:
    (typeof process !== 'undefined' && process.env?.FIREBASE_AUTH_DOMAIN) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    firebaseConfig.authDomain,
  firestoreDatabaseId:
    (typeof process !== 'undefined' && process.env?.FIRESTORE_DATABASE_ID) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIRESTORE_DATABASE_ID) ||
    firebaseConfig.firestoreDatabaseId,
  storageBucket:
    (typeof process !== 'undefined' && process.env?.FIREBASE_STORAGE_BUCKET) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    firebaseConfig.storageBucket,
  messagingSenderId:
    (typeof process !== 'undefined' && process.env?.FIREBASE_MESSAGING_SENDER_ID) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    firebaseConfig.messagingSenderId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Cloud Firestore per official guidelines:
// export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// Export firestore instance alias so both db and firestore imports are supported
export const firestore = db;

export default app;

import type { FirebaseApp } from 'firebase/app';
import type { Auth, GoogleAuthProvider } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export declare const config: {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
};

export declare const app: FirebaseApp;
export declare const auth: Auth;
export declare const googleProvider: GoogleAuthProvider;
export declare const db: Firestore;
export declare const firestore: Firestore;

export default app;

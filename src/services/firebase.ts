import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { DashboardStats, JournalEntry, MoodType, ReflectionData, User } from '../types';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connectivity validation per Firebase integration guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Map Firebase User to App User interface
export function mapFirebaseUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Journaler',
    created_at: fbUser.metadata.creationTime || new Date().toISOString(),
  };
}

// ----------------------------------------------------
// AUTHENTICATION METHODS
// ----------------------------------------------------

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = mapFirebaseUser(result.user);
  // Store or sync user profile doc
  await setDoc(
    doc(db, 'users', user.id),
    {
      id: user.id,
      email: user.email,
      name: user.name,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
  return user;
}

export async function loginWithEmail(email: string, passwordPlain: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, passwordPlain);
  const user = mapFirebaseUser(credential.user);
  await setDoc(
    doc(db, 'users', user.id),
    {
      id: user.id,
      email: user.email,
      name: user.name,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
  return user;
}

export async function signupWithEmail(email: string, passwordPlain: string, name?: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, passwordPlain);
  if (name?.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }
  const user = mapFirebaseUser(credential.user);
  if (name?.trim()) {
    user.name = name.trim();
  }
  await setDoc(doc(db, 'users', user.id), {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function changeUserPassword(newPasswordPlain: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found.');
  }
  await updatePassword(currentUser, newPasswordPlain);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      callback(mapFirebaseUser(fbUser));
    } else {
      callback(null);
    }
  });
}

export async function getAuthToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken();
}

// ----------------------------------------------------
// FIRESTORE USER-SCOPED JOURNAL ENTRIES
// ----------------------------------------------------

export async function fetchUserEntries(
  userId: string,
  params?: { search?: string; mood?: string; isDraft?: boolean }
): Promise<JournalEntry[]> {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const snapshot = await getDocs(entriesRef);

  let entries: JournalEntry[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    entries.push({
      id: docSnap.id,
      user_id: userId,
      title: data.title || 'Untitled',
      content: data.content || '',
      mood: (data.mood as MoodType) || 'Calm',
      is_draft: Boolean(data.is_draft),
      reflection: data.reflection || null,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
    });
  });

  // Sort newest first
  entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Apply filters
  if (params?.mood && params.mood !== 'ALL') {
    entries = entries.filter((e) => e.mood.toLowerCase() === params.mood!.toLowerCase());
  }

  if (params?.isDraft !== undefined) {
    entries = entries.filter((e) => e.is_draft === params.isDraft);
  }

  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase();
    entries = entries.filter(
      (e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
    );
  }

  return entries;
}

export async function fetchUserEntryById(userId: string, entryId: string): Promise<JournalEntry | null> {
  const entryDoc = await getDoc(doc(db, 'users', userId, 'entries', entryId));
  if (!entryDoc.exists()) {
    return null;
  }
  const data = entryDoc.data();
  return {
    id: entryDoc.id,
    user_id: userId,
    title: data.title || 'Untitled',
    content: data.content || '',
    mood: (data.mood as MoodType) || 'Calm',
    is_draft: Boolean(data.is_draft),
    reflection: data.reflection || null,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };
}

export async function saveUserEntry(
  userId: string,
  data: {
    title: string;
    content: string;
    mood: MoodType;
    is_draft?: boolean;
    created_at?: string;
    reflection?: ReflectionData | null;
  }
): Promise<JournalEntry> {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const newDocRef = doc(entriesRef);
  const now = new Date().toISOString();
  const entryCreatedAt = data.created_at || now;

  const entryData: Omit<JournalEntry, 'id'> = {
    user_id: userId,
    title: data.title.trim() || 'Untitled Entry',
    content: data.content,
    mood: data.mood,
    is_draft: Boolean(data.is_draft),
    created_at: entryCreatedAt,
    updated_at: now,
    reflection: data.reflection || null,
  };

  await setDoc(newDocRef, entryData);

  return {
    id: newDocRef.id,
    ...entryData,
  };
}

export async function updateUserEntry(
  userId: string,
  entryId: string,
  data: Partial<Pick<JournalEntry, 'title' | 'content' | 'mood' | 'is_draft' | 'created_at' | 'reflection'>>
): Promise<JournalEntry> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const existingDoc = await getDoc(entryRef);
  if (!existingDoc.exists()) {
    throw new Error('Journal entry not found.');
  }

  const existingData = existingDoc.data();
  const now = new Date().toISOString();

  const updatedPayload: any = {
    ...data,
    updated_at: now,
  };

  await updateDoc(entryRef, updatedPayload);

  return {
    id: entryId,
    user_id: userId,
    title: data.title !== undefined ? data.title : existingData.title,
    content: data.content !== undefined ? data.content : existingData.content,
    mood: data.mood !== undefined ? data.mood : existingData.mood,
    is_draft: data.is_draft !== undefined ? data.is_draft : existingData.is_draft,
    created_at: data.created_at !== undefined ? data.created_at : existingData.created_at,
    updated_at: now,
    reflection: data.reflection !== undefined ? data.reflection : existingData.reflection,
  };
}

export async function deleteUserEntry(userId: string, entryId: string): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

export async function clearAllUserEntries(userId: string): Promise<number> {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const snapshot = await getDocs(entriesRef);
  const batch = writeBatch(db);
  let count = 0;

  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
    count++;
  });

  if (count > 0) {
    await batch.commit();
  }
  return count;
}

export async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  const entries = await fetchUserEntries(userId);
  const totalEntries = entries.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.created_at.startsWith(todayStr)).length;
  const draftEntries = entries.filter((e) => e.is_draft).length;

  const moodCounts: Record<MoodType, number> = {
    Happy: 0,
    Calm: 0,
    Excited: 0,
    Sad: 0,
    Angry: 0,
    Anxious: 0,
    Tired: 0,
  };

  for (const e of entries) {
    if (moodCounts[e.mood] !== undefined) {
      moodCounts[e.mood]++;
    }
  }

  let dominantMood: MoodType | null = null;
  let maxCount = 0;
  for (const [m, count] of Object.entries(moodCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantMood = m as MoodType;
    }
  }

  const uniqueDays = Array.from(new Set(entries.map((e) => e.created_at.split('T')[0])))
    .sort()
    .reverse();

  let streakDays = 0;
  if (uniqueDays.length > 0) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

    if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
      streakDays = 1;
      let prevDate = new Date(uniqueDays[0]);
      for (let i = 1; i < uniqueDays.length; i++) {
        const currDate = new Date(uniqueDays[i]);
        const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
        if (diffDays === 1) {
          streakDays++;
          prevDate = currDate;
        } else {
          break;
        }
      }
    }
  }

  return {
    totalEntries,
    todayEntries,
    draftEntries,
    moodCounts,
    dominantMood,
    streakDays,
  };
}

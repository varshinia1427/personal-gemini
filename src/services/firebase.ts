import {
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
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { app, auth, db, firestore, googleProvider } from '../firebase-app.js';
export { app, auth, db, firestore, googleProvider };
import type {
  AgeGroup,
  DashboardStats,
  GoalItem,
  JournalEntry,
  JournalImage,
  LanguageCode,
  MoodTrendPoint,
  MoodType,
  ReflectionData,
  ThemeFrequency,
  User,
  VoiceRecording,
} from '../types';

// Map Firebase User to App User interface
export function mapFirebaseUser(fbUser: FirebaseUser, extraProfile?: Partial<User>): User {
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: extraProfile?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Journaler',
    created_at: extraProfile?.created_at || fbUser.metadata.creationTime || new Date().toISOString(),
    ageGroup: extraProfile?.ageGroup,
    preferredLanguage: extraProfile?.preferredLanguage,
    goals: extraProfile?.goals || [],
  };
}

// ----------------------------------------------------
// USER PROFILE METHODS (FIRESTORE)
// ----------------------------------------------------

export async function fetchUserProfile(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: userId,
        email: data.email || auth.currentUser?.email || '',
        name: data.name || auth.currentUser?.displayName || 'Journaler',
        created_at: data.created_at || new Date().toISOString(),
        ageGroup: data.ageGroup as AgeGroup | undefined,
        preferredLanguage: data.preferredLanguage as LanguageCode | undefined,
        goals: Array.isArray(data.goals) ? data.goals : [],
      };
    }
  } catch (err) {
    console.warn('Could not fetch user profile from Firestore:', err);
  }
  return null;
}

export async function updateUserAgeGroup(userId: string, ageGroup: AgeGroup): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    {
      id: userId,
      ageGroup,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function updateUserLanguage(userId: string, language: LanguageCode): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    {
      id: userId,
      preferredLanguage: language,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function updateUserGoals(userId: string, goals: GoalItem[]): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    {
      id: userId,
      goals,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
}

// ----------------------------------------------------
// AUTHENTICATION METHODS
// ----------------------------------------------------

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const existingProfile = await fetchUserProfile(result.user.uid);
  const user = mapFirebaseUser(result.user, existingProfile || undefined);
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
  const existingProfile = await fetchUserProfile(credential.user.uid);
  const user = mapFirebaseUser(credential.user, existingProfile || undefined);
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
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const profile = await fetchUserProfile(fbUser.uid);
        callback(mapFirebaseUser(fbUser, profile || undefined));
      } catch {
        callback(mapFirebaseUser(fbUser));
      }
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
  params?: { search?: string; mood?: string; language?: string; isDraft?: boolean; mode?: string }
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
      language: (data.language as LanguageCode) || 'en',
      mode: data.mode || 'personal',
      ageGroup: data.ageGroup as AgeGroup | undefined,
      drawing: data.drawing || null,
      images: Array.isArray(data.images) ? data.images : [],
      voiceRecording: data.voiceRecording || null,
      reflection: data.reflection || null,
      schoolReflection: data.schoolReflection || undefined,
      personalGrowth: data.personalGrowth || undefined,
      dailyQuestion: data.dailyQuestion || undefined,
      dailyQuestionAnswer: data.dailyQuestionAnswer || undefined,
      tags: Array.isArray(data.tags) ? data.tags : [],
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
    });
  });

  // Sort newest first
  entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Apply filters
  if (params?.mode && params.mode !== 'ALL') {
    entries = entries.filter((e) => (e.mode || 'personal') === params.mode);
  }

  if (params?.mood && params.mood !== 'ALL') {
    entries = entries.filter((e) => e.mood.toLowerCase() === params.mood!.toLowerCase());
  }

  if (params?.language && params.language !== 'ALL') {
    entries = entries.filter((e) => e.language === params.language);
  }

  if (params?.isDraft !== undefined) {
    entries = entries.filter((e) => e.is_draft === params.isDraft);
  }

  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        (e.dailyQuestionAnswer && e.dailyQuestionAnswer.toLowerCase().includes(q)) ||
        (e.voiceRecording?.transcription && e.voiceRecording.transcription.toLowerCase().includes(q))
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
    language: (data.language as LanguageCode) || 'en',
    mode: data.mode || 'personal',
    ageGroup: data.ageGroup as AgeGroup | undefined,
    drawing: data.drawing || null,
    images: Array.isArray(data.images) ? data.images : [],
    voiceRecording: data.voiceRecording || null,
    reflection: data.reflection || null,
    schoolReflection: data.schoolReflection || undefined,
    personalGrowth: data.personalGrowth || undefined,
    dailyQuestion: data.dailyQuestion || undefined,
    dailyQuestionAnswer: data.dailyQuestionAnswer || undefined,
    tags: Array.isArray(data.tags) ? data.tags : [],
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
    language?: LanguageCode;
    mode?: 'personal' | 'kids';
    ageGroup?: AgeGroup;
    drawing?: string | null;
    images?: JournalImage[];
    voiceRecording?: VoiceRecording | null;
    is_draft?: boolean;
    created_at?: string;
    reflection?: ReflectionData | null;
    schoolReflection?: string;
    personalGrowth?: string;
    dailyQuestion?: string;
    dailyQuestionAnswer?: string;
    tags?: string[];
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
    language: data.language || 'en',
    mode: data.mode || 'personal',
    ageGroup: data.ageGroup,
    drawing: data.drawing || null,
    images: data.images || [],
    voiceRecording: data.voiceRecording || null,
    is_draft: Boolean(data.is_draft),
    created_at: entryCreatedAt,
    updated_at: now,
    reflection: data.reflection || null,
    schoolReflection: data.schoolReflection,
    personalGrowth: data.personalGrowth,
    dailyQuestion: data.dailyQuestion,
    dailyQuestionAnswer: data.dailyQuestionAnswer,
    tags: data.tags || [],
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
  data: Partial<
    Pick<
      JournalEntry,
      'title' | 'content' | 'mood' | 'language' | 'mode' | 'drawing' | 'images' | 'voiceRecording' | 'is_draft' | 'created_at' | 'reflection'
    >
  >
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
    language: data.language !== undefined ? data.language : existingData.language || 'en',
    mode: data.mode !== undefined ? data.mode : existingData.mode || 'personal',
    drawing: data.drawing !== undefined ? data.drawing : existingData.drawing || null,
    images: data.images !== undefined ? data.images : existingData.images || [],
    voiceRecording: data.voiceRecording !== undefined ? data.voiceRecording : existingData.voiceRecording || null,
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
    Good: 0,
    Okay: 0,
    Calm: 0,
    Excited: 0,
    Sad: 0,
    Angry: 0,
    Anxious: 0,
    Tired: 0,
  };

  const entriesByDate: Record<string, number> = {};
  const themeMap: Record<string, number> = {};

  for (const e of entries) {
    if (moodCounts[e.mood] !== undefined) {
      moodCounts[e.mood]++;
    }

    const dateKey = e.created_at.split('T')[0];
    entriesByDate[dateKey] = (entriesByDate[dateKey] || 0) + 1;

    // Aggregate themes from AI reflections
    if (e.reflection?.keyThemes && Array.isArray(e.reflection.keyThemes)) {
      for (const t of e.reflection.keyThemes) {
        const cleanTheme = t.trim();
        if (cleanTheme) {
          themeMap[cleanTheme] = (themeMap[cleanTheme] || 0) + 1;
        }
      }
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

  // Calculate common themes
  const commonThemes: ThemeFrequency[] = Object.entries(themeMap)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // If no AI themes recorded yet, provide thoughtful defaults
  if (commonThemes.length === 0 && totalEntries > 0) {
    commonThemes.push(
      { theme: 'Mindful Self-Care', count: 1 },
      { theme: 'Daily Reflection', count: 1 }
    );
  }

  // Streak calculation
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

  // Calculate past 7 days mood trends
  const moodTrends: MoodTrendPoint[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayObj = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayObj.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = dayNames[d.getDay()];

    const dayEntries = entries.filter((e) => e.created_at.startsWith(dateStr));
    const dayCount = dayEntries.length;
    const dayMood = dayCount > 0 ? dayEntries[0].mood : ('Calm' as MoodType);

    moodTrends.push({
      date: dateStr,
      dayLabel: dayName,
      mood: dayMood,
      count: dayCount,
    });
  }

  // Compute weekly & monthly narrative insights
  const pastWeekEntries = entries.filter((e) => {
    const diff = (Date.now() - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  const weeklyInsights =
    pastWeekEntries.length > 0
      ? `Over the past 7 days, you logged ${pastWeekEntries.length} ${
          pastWeekEntries.length === 1 ? 'entry' : 'entries'
        }, with a primary tone of ${pastWeekEntries[0].mood.toLowerCase()}. Your writing shows dedicated moments of slowing down to listen inward.`
      : 'You have not written any entries yet this week. Take 2 minutes today to record your first reflection.';

  const monthlyInsights =
    totalEntries > 0
      ? `Across ${totalEntries} total recorded entries, your predominant mood is ${dominantMood || 'Calm'}. You are building a consistent sacred space for emotional self-regulation.`
      : 'Begin your journaling journey to generate personalized monthly wellness reflections.';

  return {
    totalEntries,
    todayEntries,
    draftEntries,
    moodCounts,
    dominantMood,
    streakDays,
    weeklyInsights,
    monthlyInsights,
    commonThemes,
    moodTrends,
    entriesByDate,
  };
}

import {
  auth,
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  logoutUser,
  changeUserPassword,
  mapFirebaseUser,
  getAuthToken,
  fetchUserEntries,
  fetchUserEntryById,
  saveUserEntry,
  updateUserEntry,
  deleteUserEntry,
  clearAllUserEntries,
  fetchDashboardStats,
} from './firebase';
import { getLanguageOption } from '../utils/languages';
import type {
  DashboardStats,
  JournalEntry,
  JournalImage,
  LanguageCode,
  MoodType,
  ReflectionData,
  User,
  VoiceRecording,
} from '../types';

export function getStoredToken(): string | null {
  return auth.currentUser ? 'authenticated' : null;
}

// ----------------------------------------------------
// AUTH API (REAL FIREBASE AUTHENTICATION)
// ----------------------------------------------------

export async function apiSignup(
  email: string,
  passwordPlain: string,
  name?: string
): Promise<{ user: User; message: string }> {
  const user = await signupWithEmail(email, passwordPlain, name);
  return { user, message: 'Account created successfully with Firebase.' };
}

export async function apiLogin(
  email: string,
  passwordPlain: string
): Promise<{ user: User; message: string }> {
  const user = await loginWithEmail(email, passwordPlain);
  return { user, message: 'Welcome back!' };
}

export async function apiLoginWithGoogle(): Promise<{ user: User; message: string }> {
  const user = await loginWithGoogle();
  return { user, message: 'Signed in with Google successfully.' };
}

export async function apiGetMe(): Promise<{ user: User | null }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { user: null };
  }
  return { user: mapFirebaseUser(currentUser) };
}

export async function apiLogout(): Promise<void> {
  await logoutUser();
}

export async function apiUpdatePassword(
  _currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  await changeUserPassword(newPassword);
  return { message: 'Password updated successfully with Firebase.' };
}

export async function apiClearUserData(): Promise<{ message: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required.');
  }
  const deletedCount = await clearAllUserEntries(currentUser.uid);
  return { message: `Successfully deleted ${deletedCount} entries from your private Firestore collection.` };
}

// ----------------------------------------------------
// JOURNAL API (FIRESTORE - AUTHENTICATED USER ONLY)
// ----------------------------------------------------

function requireAuthenticatedUid(): string {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in with Firebase to access your journal.');
  }
  return currentUser.uid;
}

export async function apiGetEntries(params?: {
  search?: string;
  mood?: string;
  language?: string;
  isDraft?: boolean;
}): Promise<{ entries: JournalEntry[] }> {
  const uid = requireAuthenticatedUid();
  const entries = await fetchUserEntries(uid, params);
  return { entries };
}

export async function apiGetEntryById(id: string): Promise<{ entry: JournalEntry }> {
  const uid = requireAuthenticatedUid();
  const entry = await fetchUserEntryById(uid, id);
  if (!entry) {
    throw new Error('Journal entry not found.');
  }
  return { entry };
}

export async function apiCreateEntry(data: {
  title: string;
  content: string;
  mood: MoodType;
  language?: LanguageCode;
  images?: JournalImage[];
  voiceRecording?: VoiceRecording | null;
  is_draft?: boolean;
  created_at?: string;
  reflection?: ReflectionData | null;
}): Promise<{ entry: JournalEntry; message: string }> {
  const uid = requireAuthenticatedUid();
  const entry = await saveUserEntry(uid, data);
  return {
    entry,
    message: data.is_draft ? 'Draft saved to Firestore.' : 'Journal entry saved securely.',
  };
}

export async function apiUpdateEntry(
  id: string,
  data: Partial<
    Pick<
      JournalEntry,
      'title' | 'content' | 'mood' | 'language' | 'images' | 'voiceRecording' | 'is_draft' | 'created_at' | 'reflection'
    >
  >
): Promise<{ entry: JournalEntry; message: string }> {
  const uid = requireAuthenticatedUid();
  const entry = await updateUserEntry(uid, id, data);
  return {
    entry,
    message: 'Journal entry updated successfully.',
  };
}

export async function apiDeleteEntry(id: string): Promise<{ message: string }> {
  const uid = requireAuthenticatedUid();
  await deleteUserEntry(uid, id);
  return { message: 'Journal entry deleted from Firestore.' };
}

// ----------------------------------------------------
// GEMINI MULTIMODAL & MULTILINGUAL AI APIs (SERVER-SIDE)
// ----------------------------------------------------

export async function apiReflectDraft(params: {
  title: string;
  content: string;
  mood: MoodType;
  language?: LanguageCode;
  voiceTranscription?: string;
  images?: JournalImage[];
}): Promise<{ reflection: ReflectionData }> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const langOption = getLanguageOption(params.language || 'en');

  const res = await fetch('/api/reflect', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: params.title,
      content: params.content,
      mood: params.mood,
      language: langOption.code,
      languageName: `${langOption.name} (${langOption.nativeName})`,
      voiceTranscription: params.voiceTranscription || '',
      images: (params.images || []).map((img) => ({
        dataUrl: img.dataUrl,
      })),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate reflection from Gemini AI.');
  }
  return data;
}

export async function apiReflectSavedEntry(
  entryId: string
): Promise<{ reflection: ReflectionData; entry: JournalEntry; message: string }> {
  const uid = requireAuthenticatedUid();
  const existing = await fetchUserEntryById(uid, entryId);
  if (!existing) {
    throw new Error('Entry not found.');
  }

  const { reflection } = await apiReflectDraft({
    title: existing.title,
    content: existing.content,
    mood: existing.mood,
    language: existing.language,
    voiceTranscription: existing.voiceRecording?.transcription,
    images: existing.images,
  });

  const updatedEntry = await updateUserEntry(uid, entryId, { reflection });

  return {
    reflection,
    entry: updatedEntry,
    message: 'Gemini AI reflection generated and saved.',
  };
}

export async function apiTranslateEntry(
  entryId: string,
  targetLanguage: LanguageCode
): Promise<{ entry: JournalEntry; translatedTitle: string; translatedContent: string }> {
  const uid = requireAuthenticatedUid();
  const existing = await fetchUserEntryById(uid, entryId);
  if (!existing) {
    throw new Error('Entry not found.');
  }

  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const langOption = getLanguageOption(targetLanguage);

  const res = await fetch('/api/translate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: existing.title,
      content: existing.content,
      targetLanguage,
      targetLanguageName: `${langOption.name} (${langOption.nativeName})`,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Translation failed.');
  }

  const updatedEntry = await updateUserEntry(uid, entryId, {
    title: data.translatedTitle || existing.title,
    content: data.translatedContent || existing.content,
    language: targetLanguage,
  });

  return {
    entry: updatedEntry,
    translatedTitle: data.translatedTitle,
    translatedContent: data.translatedContent,
  };
}

export async function apiTranscribeAudio(
  audioBase64: string,
  mimeType = 'audio/webm',
  preferredLanguage?: string
): Promise<{ transcription: string; detectedLanguage: string }> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/transcribe-audio', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      audioBase64,
      mimeType,
      preferredLanguage,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to transcribe audio.');
  }
  return data;
}

// ----------------------------------------------------
// STATS API (COMPUTED FOR AUTHENTICATED USER)
// ----------------------------------------------------

export async function apiGetStats(): Promise<DashboardStats> {
  const uid = requireAuthenticatedUid();
  return fetchDashboardStats(uid);
}

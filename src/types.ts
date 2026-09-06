export type MoodType = 'Happy' | 'Calm' | 'Excited' | 'Sad' | 'Angry' | 'Anxious' | 'Tired';

export type LanguageCode =
  | 'en'
  | 'ta'
  | 'hi'
  | 'te'
  | 'ml'
  | 'kn'
  | 'bn'
  | 'mr'
  | 'es'
  | 'fr'
  | 'de'
  | 'ja'
  | 'ko'
  | 'ar';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  speechCode: string;
  dir?: 'ltr' | 'rtl';
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface JournalImage {
  id: string;
  dataUrl: string; // Base64 data URL
  name?: string;
  size?: number;
  caption?: string;
}

export interface VoiceRecording {
  audioUrl: string; // Base64 audio or blob URL for play/pause
  durationSeconds?: number;
  transcription: string;
  detectedLanguage?: string;
  createdAt: string;
}

export interface ReflectionData {
  summary: string;
  detectedMood: string;
  keyThemes: string[];
  positiveObservations: string[];
  reflectionQuestions: string[];
  gentleSuggestions?: string[];
  personalReflection?: string;
  moodInsight?: string;
  language?: LanguageCode | string;
  createdAt: string;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: MoodType;
  is_draft: boolean;
  language: LanguageCode;
  images?: JournalImage[];
  voiceRecording?: VoiceRecording | null;
  reflection?: ReflectionData | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface MoodTrendPoint {
  date: string;
  dayLabel: string;
  mood: MoodType;
  count: number;
}

export interface ThemeFrequency {
  theme: string;
  count: number;
}

export interface DashboardStats {
  totalEntries: number;
  todayEntries: number;
  draftEntries: number;
  moodCounts: Record<MoodType, number>;
  dominantMood: MoodType | null;
  streakDays: number;
  weeklyInsights?: string;
  monthlyInsights?: string;
  commonThemes: ThemeFrequency[];
  moodTrends: MoodTrendPoint[];
  entriesByDate: Record<string, number>;
}

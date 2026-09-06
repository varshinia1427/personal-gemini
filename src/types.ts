export type MoodType = 'Happy' | 'Calm' | 'Excited' | 'Sad' | 'Angry' | 'Anxious' | 'Tired' | 'Good' | 'Okay';

export type JournalAppMode = 'personal' | 'kids';

export type AgeGroup = '3-6' | '7-12' | '13-17' | '18+';

export interface AgeGroupConfig {
  id: AgeGroup;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  color: string;
  accentGradient: string;
  description: string;
}

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

export interface GoalItem {
  id: string;
  title: string;
  category: 'school' | 'personal' | 'mindset' | 'creative';
  completed: boolean;
  createdAt: string;
  targetDate?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  ageGroup?: AgeGroup;
  preferredLanguage?: LanguageCode;
  goals?: GoalItem[];
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
  isKidsReflection?: boolean;
  ageGroup?: AgeGroup;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: MoodType;
  is_draft: boolean;
  language: LanguageCode;
  mode?: JournalAppMode;
  ageGroup?: AgeGroup;
  drawing?: string | null; // Base64 PNG data URL of drawing
  images?: JournalImage[];
  voiceRecording?: VoiceRecording | null;
  reflection?: ReflectionData | null;
  schoolReflection?: string;
  personalGrowth?: string;
  dailyQuestion?: string;
  dailyQuestionAnswer?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface StoryItem {
  id: string;
  title: string;
  content: string;
  ageGroup: AgeGroup;
  genre: string;
  coverEmoji: string;
  language: LanguageCode;
  readTimeMinutes?: number;
  moralLesson?: string;
  createdAt: string;
}

export interface KidBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: string;
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

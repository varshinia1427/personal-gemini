export type MoodType = 'Happy' | 'Calm' | 'Excited' | 'Sad' | 'Angry' | 'Anxious' | 'Tired';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface ReflectionData {
  summary: string;
  detectedMood: string;
  keyThemes: string[];
  positiveObservations: string[];
  reflectionQuestions: string[];
  gentleSuggestions: string[];
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

export interface DashboardStats {
  totalEntries: number;
  todayEntries: number;
  draftEntries: number;
  moodCounts: Record<MoodType, number>;
  dominantMood: MoodType | null;
  streakDays: number;
}

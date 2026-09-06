import type { MoodType } from '../types';

export interface MoodConfig {
  value: MoodType;
  label: string;
  color: string;
  textColor: string;
  bgLight: string;
  border: string;
  accentDot: string;
  emoji: string;
  description: string;
}

export const MOODS: MoodConfig[] = [
  {
    value: 'Calm',
    label: 'Calm',
    color: 'teal',
    textColor: 'text-teal-300',
    bgLight: 'bg-teal-500/15 backdrop-blur-md',
    border: 'border-teal-500/30',
    accentDot: 'bg-teal-400',
    emoji: '🌿',
    description: 'Peaceful, centered, and balanced',
  },
  {
    value: 'Happy',
    label: 'Happy',
    color: 'amber',
    textColor: 'text-amber-300',
    bgLight: 'bg-amber-500/15 backdrop-blur-md',
    border: 'border-amber-500/30',
    accentDot: 'bg-amber-400',
    emoji: '☀️',
    description: 'Joyful, content, and optimistic',
  },
  {
    value: 'Excited',
    label: 'Excited',
    color: 'indigo',
    textColor: 'text-indigo-300',
    bgLight: 'bg-indigo-500/15 backdrop-blur-md',
    border: 'border-indigo-500/30',
    accentDot: 'bg-indigo-400',
    emoji: '✨',
    description: 'Energized, inspired, and motivated',
  },
  {
    value: 'Sad',
    label: 'Sad',
    color: 'sky',
    textColor: 'text-sky-300',
    bgLight: 'bg-sky-500/15 backdrop-blur-md',
    border: 'border-sky-500/30',
    accentDot: 'bg-sky-400',
    emoji: '🌧️',
    description: 'Low, grieving, or downcast',
  },
  {
    value: 'Angry',
    label: 'Angry',
    color: 'rose',
    textColor: 'text-rose-300',
    bgLight: 'bg-rose-500/15 backdrop-blur-md',
    border: 'border-rose-500/30',
    accentDot: 'bg-rose-400',
    emoji: '🔥',
    description: 'Frustrated, irritable, or provoked',
  },
  {
    value: 'Anxious',
    label: 'Anxious',
    color: 'purple',
    textColor: 'text-purple-300',
    bgLight: 'bg-purple-500/15 backdrop-blur-md',
    border: 'border-purple-500/30',
    accentDot: 'bg-purple-400',
    emoji: '🌊',
    description: 'Uneasy, overthinking, or tense',
  },
  {
    value: 'Tired',
    label: 'Tired',
    color: 'slate',
    textColor: 'text-slate-300',
    bgLight: 'bg-slate-500/20 backdrop-blur-md',
    border: 'border-slate-500/30',
    accentDot: 'bg-slate-400',
    emoji: '🌙',
    description: 'Drained, fatigued, or needing rest',
  },
  {
    value: 'Good',
    label: 'Good',
    color: 'emerald',
    textColor: 'text-emerald-300',
    bgLight: 'bg-emerald-500/15 backdrop-blur-md',
    border: 'border-emerald-500/30',
    accentDot: 'bg-emerald-400',
    emoji: '🙂',
    description: 'Doing well and feeling positive',
  },
  {
    value: 'Okay',
    label: 'Okay',
    color: 'sky',
    textColor: 'text-sky-300',
    bgLight: 'bg-sky-500/15 backdrop-blur-md',
    border: 'border-sky-500/30',
    accentDot: 'bg-sky-400',
    emoji: '😐',
    description: 'Neutral, easygoing, or steady',
  },
];

export interface KidMoodConfig {
  value: MoodType;
  label: string;
  emoji: string;
  color: string;
  bgLight: string;
  border: string;
  textColor: string;
}

export const KIDS_MOODS: KidMoodConfig[] = [
  { value: 'Happy', label: 'Happy', emoji: '😊', color: 'amber', bgLight: 'bg-amber-500/20', border: 'border-amber-400/40', textColor: 'text-amber-200' },
  { value: 'Good', label: 'Good', emoji: '🙂', color: 'emerald', bgLight: 'bg-emerald-500/20', border: 'border-emerald-400/40', textColor: 'text-emerald-200' },
  { value: 'Okay', label: 'Okay', emoji: '😐', color: 'slate', bgLight: 'bg-slate-500/20', border: 'border-slate-400/40', textColor: 'text-slate-200' },
  { value: 'Sad', label: 'Sad', emoji: '😢', color: 'sky', bgLight: 'bg-sky-500/20', border: 'border-sky-400/40', textColor: 'text-sky-200' },
  { value: 'Angry', label: 'Angry', emoji: '😠', color: 'rose', bgLight: 'bg-rose-500/20', border: 'border-rose-400/40', textColor: 'text-rose-200' },
  { value: 'Excited', label: 'Excited', emoji: '🤩', color: 'yellow', bgLight: 'bg-yellow-500/20', border: 'border-yellow-400/40', textColor: 'text-yellow-200' },
  { value: 'Calm', label: 'Calm', emoji: '😌', color: 'teal', bgLight: 'bg-teal-500/20', border: 'border-teal-400/40', textColor: 'text-teal-200' },
];

export function getMoodConfig(mood: MoodType): MoodConfig {
  return MOODS.find(m => m.value === mood) || MOODS[0];
}

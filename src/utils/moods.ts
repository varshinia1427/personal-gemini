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
];

export function getMoodConfig(mood: MoodType): MoodConfig {
  return MOODS.find(m => m.value === mood) || MOODS[0];
}

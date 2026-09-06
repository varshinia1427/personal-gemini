import type { AgeGroup, AgeGroupConfig } from '../types';

export interface ExtendedAgeGroupConfig extends AgeGroupConfig {
  emoji: string;
  tagline: string;
}

export const AGE_GROUPS: ExtendedAgeGroupConfig[] = [
  {
    id: '3-6',
    title: 'Little Explorer',
    subtitle: 'Ages 3–6',
    badge: '🧸 Little Explorer',
    icon: '🧸',
    emoji: '🧸',
    color: 'amber',
    accentGradient: 'from-amber-400 via-orange-400 to-pink-500',
    description: 'Draw your day, talk to your journal, take photos, and listen to fun stories.',
    tagline: 'Simple, joyful storytelling with drawing, voice & photos',
  },
  {
    id: '7-12',
    title: 'Young Explorer',
    subtitle: 'Ages 7–12',
    badge: '🚀 Young Explorer',
    icon: '🚀',
    emoji: '🚀',
    color: 'emerald',
    accentGradient: 'from-emerald-400 via-teal-400 to-cyan-500',
    description: 'Write stories, voice journal, draw, track your daily feelings, earn cool badges, and create adventures.',
    tagline: 'Adventures, daily curiosities, school milestones & creative art',
  },
  {
    id: '13-17',
    title: 'Teen Journal',
    subtitle: 'Ages 13–17',
    badge: '🎧 Teen Journal',
    icon: '🎧',
    emoji: '🎧',
    color: 'violet',
    accentGradient: 'from-violet-400 via-indigo-400 to-cyan-400',
    description: 'Private space for thoughts, school reflections, personal growth, goals, and supportive AI reflections.',
    tagline: 'Private thoughts, creative goals, school reflection & emotional clarity',
  },
  {
    id: '18+',
    title: 'Personal Gemini Journal',
    subtitle: 'Ages 18+',
    badge: '🧘 Adult Journal',
    icon: '🌿',
    emoji: '🌿',
    color: 'indigo',
    accentGradient: 'from-indigo-400 via-teal-400 to-emerald-400',
    description: 'Deep multimodal reflections, mood analytics, weekly/monthly insights, Ask Gemini, and mindful clarity.',
    tagline: 'Deep mindful reflections, mood analytics & AI companion',
  },
];

export const AGE_GROUP_CONFIGS: Record<AgeGroup, ExtendedAgeGroupConfig> = {
  '3-6': AGE_GROUPS[0],
  '7-12': AGE_GROUPS[1],
  '13-17': AGE_GROUPS[2],
  '18+': AGE_GROUPS[3],
};

export function getAgeGroupConfig(id: AgeGroup): ExtendedAgeGroupConfig {
  return AGE_GROUP_CONFIGS[id] || AGE_GROUP_CONFIGS['18+'];
}

export function getDefaultModeForAgeGroup(age: AgeGroup): 'personal' | 'kids' {
  return age === '3-6' || age === '7-12' ? 'kids' : 'personal';
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Compass, Rocket, BookOpen, CheckCircle2 } from 'lucide-react';
import type { AgeGroup } from '../types';
import { AGE_GROUP_CONFIGS } from '../utils/ageGroups';

interface WelcomeAgeSelectionProps {
  currentAgeGroup?: AgeGroup;
  userName?: string;
  onSelectAgeGroup: (ageGroup: AgeGroup) => Promise<void>;
  isModal?: boolean;
  onClose?: () => void;
}

export const WelcomeAgeSelection: React.FC<WelcomeAgeSelectionProps> = ({
  currentAgeGroup,
  userName,
  onSelectAgeGroup,
  isModal = false,
  onClose,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<AgeGroup>(currentAgeGroup || '18+');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ageGroups: {
    id: AgeGroup;
    badge: string;
    title: string;
    tagline: string;
    emoji: string;
    accentBg: string;
    borderActive: string;
    features: string[];
  }[] = [
    {
      id: '3-6',
      badge: 'Ages 3–6',
      title: 'Little Explorer',
      tagline: 'Simple, joyful storytelling with drawing, voice & photos',
      emoji: '🧸',
      accentBg: 'from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400',
      borderActive: 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/70',
      features: ['Colorful drawing canvas', 'Voice recording with one tap', 'Wholesome bedtime & day stories'],
    },
    {
      id: '7-12',
      badge: 'Ages 7–12',
      title: 'Young Explorer',
      tagline: 'Adventures, daily curiosities, school milestones & creative art',
      emoji: '🚀',
      accentBg: 'from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-400',
      borderActive: 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/70',
      features: ['Adventure logs & questions', 'Drawing & photo journals', 'Fun AI Explorer reflections'],
    },
    {
      id: '13-17',
      badge: 'Ages 13–17',
      title: 'Teen Journal',
      tagline: 'Private thoughts, creative goals, school reflection & emotional clarity',
      emoji: '🎧',
      accentBg: 'from-purple-50 to-indigo-50 border-purple-200 hover:border-purple-400',
      borderActive: 'border-purple-500 ring-2 ring-purple-400/40 bg-purple-50/70',
      features: ['School & life balance tracker', 'Daily inspiring prompts', 'Authentic, respectful AI insights'],
    },
    {
      id: '18+',
      badge: 'Age 18+',
      title: 'Personal Gemini Journal',
      tagline: 'Deep mindfulness, emotional well-being, multilingual reflections & goals',
      emoji: '🌿',
      accentBg: 'from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400',
      borderActive: 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/70',
      features: ['Multimodal audio, photos & text', '10+ Language translations', 'Compassionate personal reflections'],
    },
  ];

  const handleConfirm = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSelectAgeGroup(selectedGroup);
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to save age group:', err);
      setError(err?.message || 'Failed to save your age preference. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div
      id="welcome-age-selection-container"
      className={
        isModal
          ? 'w-full max-w-3xl mx-auto p-4'
          : 'min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8'
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/40 shadow-xl bg-white/75 backdrop-blur-md"
      >
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Personalized Experience
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800 tracking-tight">
            {userName ? `Welcome, ${userName}!` : 'Welcome to Personal Gemini Journal'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Tell us your age group so we can personalize your dashboard, prompts, and AI reflections.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            No birth date required. You can easily switch your age group anytime in Settings.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {ageGroups.map((group) => {
            const isSelected = selectedGroup === group.id;
            return (
              <button
                key={group.id}
                type="button"
                id={`age-group-option-${group.id}`}
                onClick={() => setSelectedGroup(group.id)}
                className={`relative text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? group.borderActive
                    : `bg-gradient-to-br ${group.accentBg} hover:shadow-md`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-2xl" role="img" aria-label={group.title}>
                      {group.emoji}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-slate-800 text-white'
                          : 'bg-white/80 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {group.badge}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    {group.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {group.tagline}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/50 space-y-1">
                  {group.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Current layout: <strong className="text-slate-700">{AGE_GROUP_CONFIGS[selectedGroup].title}</strong>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              id="confirm-age-selection-button"
              onClick={handleConfirm}
              disabled={isSaving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving preference...</span>
              ) : (
                <>
                  <span>Continue to My Journal</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

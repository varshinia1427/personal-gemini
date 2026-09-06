import React from 'react';
import { Sparkles, Brain, Lightbulb, HelpCircle, Heart, ShieldAlert, Globe, Compass } from 'lucide-react';
import { getLanguageOption } from '../utils/languages';
import type { ReflectionData } from '../types';

interface GeminiReflectionCardProps {
  reflection: ReflectionData | null | undefined;
  isLoading?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
}

export const GeminiReflectionCard: React.FC<GeminiReflectionCardProps> = ({
  reflection,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/40 via-slate-900/50 to-teal-900/40 p-6 backdrop-blur-md shadow-lg animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-300 animate-spin" />
          </div>
          <div>
            <div className="h-4 w-40 bg-white/20 rounded-md mb-1.5" />
            <div className="h-3 w-64 bg-white/10 rounded-md" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-white/10 rounded-md w-full" />
          <div className="h-3 bg-white/10 rounded-md w-5/6" />
          <div className="h-3 bg-white/10 rounded-md w-4/6" />
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-indigo-300">
          <span>Synthesizing multimodal nuances (text, voice, imagery) with Gemini...</span>
          <span className="text-slate-400">Private server call</span>
        </div>
      </div>
    );
  }

  if (!reflection) return null;

  const langOption = reflection.language ? getLanguageOption(reflection.language as any) : null;

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-indigo-950/40 to-slate-900/70 p-6 sm:p-7 backdrop-blur-xl shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-slate-900">
            <Sparkles className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-white text-base">Gemini Multimodal Reflection</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {reflection.modelUsed || 'gemini-3.8-flash'}
              </span>
              {langOption && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-white/10 text-teal-300 border border-white/15">
                  <Globe className="w-3 h-3 text-teal-400" />
                  <span>{langOption.name}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-light">
              Mindful synthesis across your written words, spoken voice, and photos
            </p>
          </div>
        </div>

        {reflection.detectedMood && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-medium text-teal-300">
            <Brain className="w-3.5 h-3.5 text-teal-400" />
            <span>Detected tone: <strong className="text-white">{reflection.detectedMood}</strong></span>
          </div>
        )}
      </div>

      {/* Personal Reflection */}
      {reflection.personalReflection && (
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-teal-300">
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>Personal Reflection</span>
          </div>
          <div className="text-sm sm:text-base text-slate-100 font-light leading-relaxed bg-white/10 rounded-2xl p-5 border border-white/15 shadow-sm">
            {reflection.personalReflection}
          </div>
        </div>
      )}

      {/* Short Summary */}
      {reflection.summary && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">Short Summary</h4>
          <p className="text-sm text-slate-300 font-light leading-relaxed bg-white/5 rounded-2xl p-4.5 border border-white/10">
            {reflection.summary}
          </p>
        </div>
      )}

      {/* Mood Insight */}
      {reflection.moodInsight && (
        <div className="mt-5 p-4.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm">
          <div className="flex items-center gap-2 mb-1.5 text-indigo-300 font-medium">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>Mood Insight</span>
          </div>
          <p className="text-slate-200 font-light leading-relaxed">
            {reflection.moodInsight}
          </p>
        </div>
      )}

      {/* Key Themes */}
      {reflection.keyThemes && reflection.keyThemes.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">Key Themes</h4>
          <div className="flex flex-wrap gap-2">
            {reflection.keyThemes.map((theme, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-200 border border-white/10"
              >
                #{theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Two columns for Observations & Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {/* Positive Observations */}
        {reflection.positiveObservations && reflection.positiveObservations.length > 0 && (
          <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-3 text-teal-300 font-medium text-sm">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Positive Observations & Strengths</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 font-light">
              {reflection.positiveObservations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-400 mt-0.5">•</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reflection Questions */}
        {reflection.reflectionQuestions && reflection.reflectionQuestions.length > 0 && (
          <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-3 text-indigo-300 font-medium text-sm">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Reflection Questions</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300 font-light">
              {reflection.reflectionQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">?</span>
                  <span className="italic">{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Gentle Suggestions */}
      {reflection.gentleSuggestions && reflection.gentleSuggestions.length > 0 && (
        <div className="mt-5 rounded-2xl bg-indigo-500/10 p-5 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-3 text-indigo-300 font-medium text-sm">
            <Lightbulb className="w-4 h-4 text-amber-300" />
            <span>Gentle Mindful Suggestions</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-200">
            {reflection.gentleSuggestions.map((sug, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-white/5 rounded-xl p-3 border border-white/10 font-light">
                <span className="text-indigo-400 font-bold">→</span>
                <span>{sug}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Wellness Disclaimer */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-start gap-2.5 text-xs text-slate-400 font-light">
        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-normal">
          <strong className="text-slate-300 font-normal">Mindful Disclaimer:</strong> Personal Gemini Journal is an AI-assisted personal journaling and self-reflection tool. It does not provide clinical diagnosis, psychiatric evaluations, therapy, or medical advice.
        </p>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  PenLine, 
  Sparkles, 
  Lock, 
  Calendar, 
  BookOpen, 
  Clock, 
  Flame, 
  Smile, 
  Plus, 
  Mic, 
  Image as ImageIcon, 
  Tag, 
  Lightbulb,
  Palette,
  Camera,
  Award,
  BookMarked,
  Target,
  GraduationCap,
  Heart
} from 'lucide-react';
import { apiGetStats, apiGetEntries } from '../services/api';
import { getMoodConfig } from '../utils/moods';
import { JournalCalendar } from './JournalCalendar';
import { getLanguageOption } from '../utils/languages';
import { AGE_GROUP_CONFIGS } from '../utils/ageGroups';
import type { DashboardStats, JournalEntry, User, AgeGroup } from '../types';

interface DashboardProps {
  user: User | null;
  ageGroup?: AgeGroup;
  onNavigateNewEntry: () => void;
  onNavigateMyJournal: () => void;
  onNavigateStoryCorner?: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onOpenAskGemini?: () => void;
  onChangeAgeGroup?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  ageGroup = '18+',
  onNavigateNewEntry,
  onNavigateMyJournal,
  onNavigateStoryCorner,
  onSelectEntry,
  onOpenAskGemini,
  onChangeAgeGroup,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightTimeframe, setInsightTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  const ageConfig = AGE_GROUP_CONFIGS[ageGroup || '18+'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, entriesRes] = await Promise.all([
        apiGetStats(),
        apiGetEntries(),
      ]);
      setStats(statsRes);
      setAllEntries(entriesRes.entries);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const dominantMoodConfig = stats?.dominantMood ? getMoodConfig(stats.dominantMood) : null;
  const recentEntries = allEntries.slice(0, 5);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner: Privacy Status Guarantee & Age Group Badge */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900/40 via-slate-900/60 to-teal-950/40 border border-white/10 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              ageGroup === '3-6'
                ? 'bg-gradient-to-br from-amber-400 to-pink-500 text-slate-950 font-black'
                : ageGroup === '7-12'
                ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-slate-950 font-bold'
                : ageGroup === '13-17'
                ? 'bg-gradient-to-br from-purple-400 to-indigo-500 text-white font-bold'
                : 'bg-indigo-500/20 border border-indigo-400/30 text-teal-300'
            }`}>
              <span className="text-xl">{ageConfig.emoji}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base sm:text-lg text-white">
                  {ageConfig.title}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-teal-400/10 text-teal-300 border border-teal-400/30">
                  {ageConfig.badge}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-400/10 text-indigo-300 border border-indigo-400/30">
                  <Lock className="w-2.5 h-2.5 text-teal-400" />
                  <span>Private & Isolated</span>
                </span>
                {onChangeAgeGroup && (
                  <button
                    type="button"
                    onClick={onChangeAgeGroup}
                    className="text-2xs text-slate-400 hover:text-white underline ml-1 cursor-pointer"
                  >
                    Change Age
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed font-light">
                {ageConfig.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenAskGemini && (
              <button
                id="dashboard-ask-gemini-btn"
                onClick={onOpenAskGemini}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 font-medium text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>Ask Gemini</span>
              </button>
            )}

            {onNavigateStoryCorner && (
              <button
                id="dashboard-story-corner-btn"
                onClick={onNavigateStoryCorner}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 font-medium text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
              >
                <BookMarked className="w-4 h-4 text-purple-300" />
                <span>Story Corner</span>
              </button>
            )}

            <button
              id="dashboard-new-entry-banner-btn"
              onClick={onNavigateNewEntry}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{ageGroup === '3-6' ? 'Start My Day' : 'New Journal Entry'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AGE 3–6: "Little Explorer" Interactive Quick Action Hub */}
      {ageGroup === '3-6' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <button
              type="button"
              id="kids-action-draw"
              onClick={onNavigateNewEntry}
              className="p-5 rounded-3xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/30 hover:border-pink-400/60 text-left transition-all group shadow-lg cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-500/30 text-pink-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Draw & Color</h3>
              <p className="text-xs text-pink-200/80 mt-1">Stickers, brushes & canvas</p>
            </button>

            <button
              type="button"
              id="kids-action-voice"
              onClick={onNavigateNewEntry}
              className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30 hover:border-amber-400/60 text-left transition-all group shadow-lg cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/30 text-amber-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Talk & Tell</h3>
              <p className="text-xs text-amber-200/80 mt-1">Speak your joyful day</p>
            </button>

            <button
              type="button"
              id="kids-action-camera"
              onClick={onNavigateNewEntry}
              className="p-5 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 hover:border-cyan-400/60 text-left transition-all group shadow-lg cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/30 text-cyan-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Snap Photo</h3>
              <p className="text-xs text-cyan-200/80 mt-1">Add picture memories</p>
            </button>

            <button
              type="button"
              id="kids-action-stories"
              onClick={onNavigateStoryCorner}
              className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 hover:border-emerald-400/60 text-left transition-all group shadow-lg cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/30 text-emerald-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BookMarked className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Story Corner</h3>
              <p className="text-xs text-emerald-200/80 mt-1">Bedtime & animal tales</p>
            </button>
          </div>

          {/* Badges & Stickers */}
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Little Explorer Badges & Stickers</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Creative Artist</h4>
                  <p className="text-[10px] text-slate-400">Made fun drawings</p>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-2xl">🌈</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Sunshine Kid</h4>
                  <p className="text-[10px] text-slate-400">Shared happy smiles</p>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-2xl">🎤</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Super Speaker</h4>
                  <p className="text-[10px] text-slate-400">Recorded voice stories</p>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Day Explorer</h4>
                  <p className="text-[10px] text-slate-400">{stats?.totalEntries || 0} adventures saved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AGE 7–12: "Young Explorer" Discovery Hub */}
      {ageGroup === '7-12' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-400/30 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-cyan-400" />
                <span>Daily Curiosity Question</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                "What was the coolest thing you learned or explored today?"
              </h3>
              <p className="text-xs text-slate-300">
                Answer with words, drawings, or photos to unlock explorer points.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateNewEntry}
              className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-md cursor-pointer"
            >
              Answer Question →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-xl font-bold">
                🧭
              </div>
              <div>
                <span className="text-2xs text-slate-400 uppercase tracking-wider font-semibold">Total Discoveries</span>
                <p className="text-2xl font-bold text-white">{stats?.totalEntries || 0}</p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xl font-bold">
                🔥
              </div>
              <div>
                <span className="text-2xs text-slate-400 uppercase tracking-wider font-semibold">Adventure Streak</span>
                <p className="text-2xl font-bold text-white">{stats?.streakDays || 1} Days</p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center text-xl font-bold">
                🌟
              </div>
              <div>
                <span className="text-2xs text-slate-400 uppercase tracking-wider font-semibold">Dominant Mood</span>
                <p className="text-2xl font-bold text-white">{stats?.dominantMood || 'Excited'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AGE 13–17: "Teen Journal" Reflections & Goals Hub */}
      {ageGroup === '13-17' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-300">
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">School & Passions</span>
              </div>
              <p className="text-xs text-slate-300">
                Reflect on school days, creative projects, friends, and your personal interests.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl space-y-2">
              <div className="flex items-center gap-2 text-pink-300">
                <Heart className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Emotional Pulse</span>
              </div>
              <p className="text-xs text-slate-300">
                A safe, completely private outlet to release stress and understand mood patterns.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl space-y-2">
              <div className="flex items-center gap-2 text-teal-300">
                <Target className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Goals & Growth</span>
              </div>
              <p className="text-xs text-slate-300">
                Track personal ambitions, habits, and what you're working toward.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Heading & Current Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <p className="text-slate-400 text-xs mb-1 font-medium tracking-wide">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Friend'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-light text-white italic tracking-tight">
            {ageGroup === '3-6'
              ? 'Your happy memories and drawings'
              : ageGroup === '7-12'
              ? 'Your adventures, ideas, and stories'
              : ageGroup === '13-17'
              ? 'Your private space to reflect and grow'
              : 'Your mindful reflections, privately.'}
          </h2>
        </div>
        <div className="text-xs text-slate-300 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md self-start sm:self-auto shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-indigo-300" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Core Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Entries */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>{ageGroup === '3-6' ? 'Days Journaled' : 'Total Entries'}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-light text-white">
            {loading ? '—' : stats?.totalEntries ?? 0}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-teal-400">
            <span>{stats?.draftEntries ? `${stats.draftEntries} draft(s) saved` : 'All entries synced'}</span>
          </div>
        </div>

        {/* Today's Pulse */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Today's Pulse</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-light text-white">
            {loading ? '—' : stats?.todayEntries ?? 0}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span>{stats?.todayEntries ? 'Captured today' : 'No entries yet today'}</span>
          </div>
        </div>

        {/* Dominant Mood */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Overall Mood</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{dominantMoodConfig?.emoji || '✨'}</span>
            <p className="text-2xl font-light text-white truncate">
              {dominantMoodConfig?.label || 'Reflective'}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Detected across entries</span>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Streak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-light text-white">
            {loading ? '—' : `${stats?.streakDays ?? 1}d`}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-300">
            <span>Keep your habit glowing</span>
          </div>
        </div>
      </div>

      {/* Synthesis & Common Themes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">Gemini AI Synthesis</h3>
                <p className="text-2xs text-slate-400 font-light">Age-adapted reflective overview</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setInsightTimeframe('weekly')}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  insightTimeframe === 'weekly'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekly Insights
              </button>
              <button
                type="button"
                onClick={() => setInsightTimeframe('monthly')}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  insightTimeframe === 'monthly'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Insights
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-slate-200 leading-relaxed text-sm font-light">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block mb-1 text-xs uppercase tracking-wider text-teal-300">
                  {insightTimeframe === 'weekly' ? 'Weekly Reflection' : 'Monthly Overview'}
                </span>
                <p>
                  {insightTimeframe === 'weekly'
                    ? stats?.weeklyInsights ||
                      'Over the past week, you took mindful moments to express yourself, record your activities, and center your thoughts.'
                    : stats?.monthlyInsights ||
                      'Throughout this month, your reflections show an inspiring rhythm of self-expression, creativity, and balance.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Themes Card */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white">Common Themes</h3>
          </div>
          <p className="text-xs text-slate-400 font-light">
            Topics highlighted by Gemini across your journal
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {stats?.commonThemes && stats.commonThemes.length > 0 ? (
              stats.commonThemes.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
                >
                  <span className="text-indigo-300">#{t.theme}</span>
                  <span className="text-3xs px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400 font-bold">
                    {t.count}
                  </span>
                </span>
              ))
            ) : (
              <div className="text-xs text-slate-400 font-light py-4 text-center w-full">
                Themes will emerge as you create entries.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar & Recent Entries Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <JournalCalendar
          entriesByDate={stats?.entriesByDate || {}}
          entries={allEntries}
          onSelectEntry={onSelectEntry}
          onNewEntryForDate={onNavigateNewEntry}
        />

        {/* Recent Entries Card */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-medium text-white">Recent Entries</h3>
              <p className="text-2xs text-slate-400 font-light">Your latest multimodal memories</p>
            </div>
            <button
              id="dashboard-view-all-entries-btn"
              onClick={onNavigateMyJournal}
              className="text-xs text-indigo-300 hover:text-indigo-200 font-medium transition-colors cursor-pointer"
            >
              View All Archive →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-300 flex items-center justify-center mx-auto">
                <PenLine className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">No entries recorded yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-light">
                  {ageGroup === '3-6'
                    ? 'Start by drawing a picture, recording your voice, or snapping a photo!'
                    : 'Write, record voice, attach photos, or reflect with Gemini in 14 languages.'}
                </p>
              </div>
              <button
                id="empty-dashboard-write-first-entry-btn"
                onClick={onNavigateNewEntry}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs transition-colors shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{ageGroup === '3-6' ? 'Start My First Day' : 'Write First Entry'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => {
                const mood = getMoodConfig(entry.mood);
                const langOpt = getLanguageOption(entry.language || 'en');
                const hasVoice = Boolean(entry.voiceRecording);
                const hasPhotos = Boolean(entry.images && entry.images.length > 0);

                return (
                  <div
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 hover:border-indigo-400/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-lg shrink-0">
                        {mood.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
                            {entry.title}
                          </h4>
                          {entry.is_draft && (
                            <span className="text-3xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-2xs text-slate-400 font-light mt-0.5 flex-wrap">
                          <span>{new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>•</span>
                          <span className="text-teal-300">{langOpt.name}</span>
                          {hasVoice && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-0.5 text-rose-300">
                                <Mic className="w-3 h-3" /> Voice
                              </span>
                            </>
                          )}
                          {hasPhotos && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-0.5 text-indigo-300">
                                <ImageIcon className="w-3 h-3" /> {entry.images!.length} photo(s)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {entry.reflection && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-3xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <Sparkles className="w-2.5 h-2.5 text-indigo-300" />
                          <span>Reflected</span>
                        </span>
                      )}
                      <span className="text-slate-400 group-hover:text-white transition-colors text-xs">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

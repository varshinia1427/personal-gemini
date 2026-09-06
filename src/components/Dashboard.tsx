import React, { useState, useEffect } from 'react';
import { 
  PenLine, 
  Sparkles, 
  Lock, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Flame, 
  Smile, 
  Plus,
  Mic,
  Image as ImageIcon,
  Globe,
  Tag,
  Lightbulb
} from 'lucide-react';
import { apiGetStats, apiGetEntries } from '../services/api';
import { getMoodConfig, MOODS } from '../utils/moods';
import { JournalCalendar } from './JournalCalendar';
import { getLanguageOption } from '../utils/languages';
import type { DashboardStats, JournalEntry, User } from '../types';

interface DashboardProps {
  user: User | null;
  onNavigateNewEntry: () => void;
  onNavigateMyJournal: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onNavigateNewEntry,
  onNavigateMyJournal,
  onSelectEntry,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightTimeframe, setInsightTimeframe] = useState<'weekly' | 'monthly'>('weekly');

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
      {/* Top Banner: Privacy Status Guarantee */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900/40 via-slate-900/60 to-teal-950/40 border border-white/10 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-950/50">
              <Lock className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base sm:text-lg text-white">Your journal is private</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-teal-400/10 text-teal-300 border border-teal-400/30">
                  Data Isolation Active
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-400/10 text-indigo-300 border border-indigo-400/30">
                  <Globe className="w-3 h-3 text-indigo-300" />
                  <span>14 Languages</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed font-light">
                Multimodal journal entries, voice notes, photos, and reflections are strictly partitioned to your account ({user?.email}).
              </p>
            </div>
          </div>

          <button
            id="dashboard-new-entry-banner-btn"
            onClick={onNavigateNewEntry}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Welcome Heading & Current Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <p className="text-slate-400 text-xs mb-1 font-medium tracking-wide">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Friend'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-white italic tracking-tight">
            Your mindful reflections, <span className="text-indigo-300">privately.</span>
          </h2>
        </div>
        <div className="text-xs text-slate-300 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md self-start sm:self-auto shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-indigo-300" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* 1. Core Metrics Row: Total Entries, Today's Pulse, Current Mood, Streak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Entries */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total Entries</span>
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
          <p className="text-4xl font-light text-white italic">
            {loading ? '—' : stats?.todayEntries ? `${stats.todayEntries} entry` : 'Quiet'}
          </p>
          <div className="mt-4 flex gap-1">
            <div className="h-1 flex-1 bg-teal-400/60 rounded-full"></div>
            <div className="h-1 flex-1 bg-teal-400/60 rounded-full"></div>
            <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
          </div>
        </div>

        {/* Current Mood */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Current Mood</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-2xl font-medium text-white">
            {dominantMoodConfig ? (
              <>
                <span>{dominantMoodConfig.emoji}</span>
                <span className="capitalize">{dominantMoodConfig.label}</span>
              </>
            ) : (
              <span className="text-xl font-light text-slate-400">Ready to log</span>
            )}
          </div>
          <p className="text-2xs text-slate-400 mt-3 truncate font-light">
            {dominantMoodConfig ? dominantMoodConfig.description : 'Select your mood in your next entry'}
          </p>
        </div>

        {/* Reflective Streak */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Reflective Streak</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-light text-white">
            {loading ? '—' : `${stats?.streakDays ?? 0}`} <span className="text-sm font-normal text-slate-400">days</span>
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-indigo-300">
            <span>{(stats?.streakDays ?? 0) > 0 ? 'Consistent habit active' : 'Start your streak today'}</span>
          </div>
        </div>
      </div>

      {/* 2. Mood Trends (Past 7 Days Visual Track) */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white">7-Day Mood Trends</h3>
          </div>
          <span className="text-xs text-slate-400 font-light">
            Visual progression of your daily emotional currents
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {stats?.moodTrends?.map((trend, idx) => {
            const config = getMoodConfig(trend.mood);
            const hasEntry = trend.count > 0;
            return (
              <div
                key={idx}
                className={`p-3 sm:p-4 rounded-2xl border text-center flex flex-col items-center justify-between gap-2 transition-all ${
                  hasEntry
                    ? `${config.bgLight} ${config.border} ring-1 ring-white/20 shadow-md`
                    : 'bg-white/5 border-white/5 opacity-60'
                }`}
              >
                <span className="text-2xs font-semibold uppercase text-slate-300 tracking-wider">
                  {trend.dayLabel}
                </span>
                <span className="text-2xl sm:text-3xl my-1">{hasEntry ? config.emoji : '·'}</span>
                <span className="text-3xs sm:text-2xs text-slate-300 font-medium truncate w-full">
                  {hasEntry ? config.label : 'No entry'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Weekly & Monthly Insights + Common Themes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly & Monthly Insights Card (2 cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-950/40 via-slate-900/50 to-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-teal-400 flex items-center justify-center text-slate-900">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">Synthesized Insights</h3>
                <p className="text-2xs text-slate-400 font-light">Gemini-assisted longitudinal pattern awareness</p>
              </div>
            </div>

            {/* Timeframe Toggle Buttons */}
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
                  {insightTimeframe === 'weekly' ? 'Weekly Synthesis' : 'Monthly Overview'}
                </span>
                <p>
                  {insightTimeframe === 'weekly'
                    ? stats?.weeklyInsights ||
                      'Over the past week, you dedicated intentional moments to reflect, release tension, and center your thoughts.'
                    : stats?.monthlyInsights ||
                      'Throughout this month, your reflections reflect a steady practice of emotional balance and private self-care.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Most Common Themes Card (1 col) */}
        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white">Most Common Themes</h3>
          </div>
          <p className="text-xs text-slate-400 font-light">
            Recurring topics extracted by Gemini across your entries
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
                Themes will emerge as you create and reflect on journal entries.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Journal Calendar & Recent Entries Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Interactive Journal Calendar */}
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
              <p className="text-2xs text-slate-400 font-light">Your latest multimodal memories & thoughts</p>
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
                  Write, record voice, attach photos, or reflect with Gemini in 14 languages.
                </p>
              </div>
              <button
                id="empty-dashboard-write-first-entry-btn"
                onClick={onNavigateNewEntry}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs transition-colors shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Write First Entry</span>
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

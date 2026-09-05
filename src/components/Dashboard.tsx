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
  ShieldCheck, 
  Flame, 
  Smile, 
  Plus
} from 'lucide-react';
import { apiGetStats, apiGetEntries } from '../services/api';
import { getMoodConfig, MOODS } from '../utils/moods';
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
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, entriesRes] = await Promise.all([
        apiGetStats(),
        apiGetEntries(),
      ]);
      setStats(statsRes);
      setRecentEntries(entriesRes.entries.slice(0, 4));
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner: Privacy Status Guarantee */}
      <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl p-5 sm:p-6 shadow-lg shadow-indigo-950/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base sm:text-lg text-white">Your journal is private</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-teal-400/10 text-teal-300 border border-teal-400/30">
                  Data Isolation Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed font-light">
                Entries are securely partitioned to your account ({user?.email}). AI reflections occur strictly server-side without public model training.
              </p>
            </div>
          </div>

          <button
            id="dashboard-new-entry-banner-btn"
            onClick={onNavigateNewEntry}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Welcome Heading & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <p className="text-slate-400 text-xs mb-1 font-medium tracking-wide">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Friend'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-white italic tracking-tight">
            Your reflections, <span className="text-indigo-300">privately.</span>
          </h2>
        </div>
        <div className="text-xs text-slate-300 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md self-start sm:self-auto shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-indigo-300" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Metrics Row (Frosted Glass Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Entries */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total Entries</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-light text-white">
            {loading ? '—' : stats?.totalEntries ?? 0}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-teal-400">
            <span>↑ {stats?.totalEntries ?? 0} all-time records</span>
          </div>
        </div>

        {/* Today's Pulse */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Today's Pulse</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-light text-white italic">
            {loading ? '—' : dominantMoodConfig ? dominantMoodConfig.label : 'Calm'}
          </p>
          <div className="mt-4 flex gap-1">
            <div className="h-1 flex-1 bg-teal-400/60 rounded-full"></div>
            <div className="h-1 flex-1 bg-teal-400/60 rounded-full"></div>
            <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
          </div>
        </div>

        {/* Dominant Mood Overview */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Current Mood</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
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
            {dominantMoodConfig ? dominantMoodConfig.description : 'Select a mood in your next entry'}
          </p>
        </div>

        {/* Journaling Streak */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Reflective Streak</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-light text-white">
            {loading ? '—' : `${stats?.streakDays ?? 0}`}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-indigo-300">
            <span>{(stats?.streakDays ?? 0) > 0 ? 'Consistent habit active' : 'Start your streak today'}</span>
          </div>
        </div>
      </div>

      {/* Reflect With Gemini Feature Spotlight (Gradient Frosted Glass) */}
      <div className="bg-gradient-to-br from-indigo-600/40 to-teal-600/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 relative overflow-hidden group shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 border border-white/10 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>AI Insight Engine</span>
            </div>
            <h3 className="text-2xl font-light text-white leading-snug tracking-tight">
              Gain clarity on what matters most with Gemini
            </h3>
            <p className="text-sm text-slate-200 font-light leading-relaxed">
              Whenever you write, tap <strong>Reflect with Gemini</strong> to receive compassionate syntheses, key themes, strengths, and mindful questions designed for self-discovery.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <button
              id="spotlight-new-reflection-btn"
              onClick={onNavigateNewEntry}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors shadow-lg cursor-pointer"
            >
              <PenLine className="w-4 h-4" />
              <span>Write & Reflect Now</span>
            </button>
            <button
              id="spotlight-browse-all-btn"
              onClick={onNavigateMyJournal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <span>Explore My Journal</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Ambient Glowing Blur Orb */}
        <div className="absolute -right-4 -bottom-4 w-36 h-36 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Mood Distribution Landscape (Frosted Glass) */}
      {stats && stats.totalEntries > 0 && (
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Your Emotional Landscape</h3>
              <p className="text-xs text-slate-400 font-light">Distribution of feelings across your private journal reflections</p>
            </div>
            <span className="text-xs text-indigo-300 font-medium">{stats.totalEntries} entries recorded</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {MOODS.map((m) => {
              const count = stats.moodCounts[m.value] || 0;
              const percentage = stats.totalEntries > 0 ? Math.round((count / stats.totalEntries) * 100) : 0;
              return (
                <div
                  key={m.value}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    count > 0 ? `${m.bgLight} ${m.border}` : 'bg-white/3 border-white/5 opacity-50'
                  }`}
                >
                  <div className="text-xl">{m.emoji}</div>
                  <div className="text-xs font-medium text-slate-200 mt-1">{m.label}</div>
                  <div className="text-2xs font-semibold text-slate-400 mt-0.5">
                    {count} ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Section: Recent Entries & Gemini Reflections */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Entries Column (flex-[2]) */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-medium text-white">Recent Entries</h3>
              <p className="text-xs text-slate-400 font-light">Your latest thoughts and mindful reflections</p>
            </div>
            <button
              id="dashboard-view-all-entries-btn"
              onClick={onNavigateMyJournal}
              className="text-sm text-indigo-300 hover:text-indigo-200 font-medium transition-colors cursor-pointer"
            >
              View Archive →
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-300 flex items-center justify-center mx-auto">
                <PenLine className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">Your journal is ready for your first entry</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-light">
                  Capture how you feel right now. You can reflect with Gemini instantly or save it as a private draft.
                </p>
              </div>
              <button
                id="empty-dashboard-write-first-entry-btn"
                onClick={onNavigateNewEntry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Write Your First Entry</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => {
                const mood = getMoodConfig(entry.mood);
                const wordCount = entry.content.split(/\s+/).filter(Boolean).length;
                return (
                  <div
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-lg shrink-0">
                        {mood.emoji}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
                          {entry.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-light truncate">
                          {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Mood: {mood.label} • {wordCount} words
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {entry.reflection && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-2xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <Sparkles className="w-3 h-3 text-indigo-300" />
                          <span>AI Reflected</span>
                        </span>
                      )}
                      <div className="text-slate-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-sm">
                        →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gemini Reflections & Privacy Side Cards */}
        <div className="flex flex-col gap-6">
          {/* Gemini Reflection Highlights Box */}
          <div className="bg-gradient-to-br from-slate-800/50 to-indigo-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex-1 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <h3 className="text-sm font-semibold text-white">Gemini Reflection Highlights</h3>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
                <p className="text-xs leading-relaxed text-slate-300 italic font-light">
                  {recentEntries.find(e => e.reflection)?.reflection?.summary
                    ? `"${recentEntries.find(e => e.reflection)!.reflection!.summary}"`
                    : '"Every journal entry is a stepping stone to mindful self-discovery. Express yourself freely and explore your emotional patterns."'}
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateNewEntry}
              className="w-full py-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer"
            >
              Reflect with AI
            </button>
          </div>

          {/* Privacy Shield Card */}
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-3xl p-6 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded-md bg-teal-400/20 flex items-center justify-center text-teal-400 text-xs font-bold">
                ✓
              </div>
              <h3 className="text-sm font-semibold text-teal-400">Privacy Shield</h3>
            </div>
            <p className="text-[11px] text-slate-300 leading-normal font-light">
              No one has access to your thoughts. All reflections are generated in a zero-retention environment isolated to your verified user ID.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

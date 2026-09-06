import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  Flame,
  BookOpen,
  Palette,
  Camera,
  PlusCircle,
  Clock,
  ArrowRight,
  Maximize2,
  X,
  Volume2,
  RefreshCw,
} from 'lucide-react';
import { apiGetEntries, apiDeleteEntry } from '../../services/api';
import { KidsJournalCard } from './KidsJournalCard';
import type { JournalEntry, KidBadge } from '../../types';

interface KidsDashboardProps {
  entries?: JournalEntry[];
  onNewDayClick: () => void;
  onDeleteEntry?: (id: string) => void;
}

export const KidsDashboard: React.FC<KidsDashboardProps> = ({
  entries: propEntries,
  onNewDayClick,
  onDeleteEntry: propOnDeleteEntry,
}) => {
  const [internalEntries, setInternalEntries] = useState<JournalEntry[]>(propEntries || []);
  const [loading, setLoading] = useState<boolean>(!propEntries);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string } | null>(null);

  const loadKidsEntries = async () => {
    try {
      setLoading(true);
      const res = await apiGetEntries({ mode: 'kids' });
      setInternalEntries(res.entries);
    } catch (err) {
      console.error('Failed to load kids entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propEntries) {
      setInternalEntries(propEntries);
    } else {
      loadKidsEntries();
    }
  }, [propEntries]);

  const handleDelete = async (id: string) => {
    if (propOnDeleteEntry) {
      propOnDeleteEntry(id);
    }
    try {
      await apiDeleteEntry(id);
      setInternalEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete kids entry:', err);
    }
  };

  const kidsEntries = internalEntries;

  // Statistics
  const totalEntriesCount = kidsEntries.length;

  // Streak calculation (consecutive days)
  const calculateStreak = () => {
    if (kidsEntries.length === 0) return 0;
    const uniqueDates = Array.from(
      new Set<string>(kidsEntries.map((e) => e.created_at.split('T')[0]))
    ).sort().reverse();

    if (uniqueDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Must have logged today or yesterday to have active streak
    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    let currentDate = new Date(uniqueDates[0]);

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i]);
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
        currentDate = prevDate;
      } else {
        break;
      }
    }

    return streak;
  };

  const streakDays = calculateStreak();

  // Badges
  const hasDrawingsCount = kidsEntries.filter((e) => Boolean(e.drawing)).length;
  const hasPhotosCount = kidsEntries.filter((e) => e.images && e.images.length > 0).length;
  const hasVoiceCount = kidsEntries.filter((e) => Boolean(e.voiceRecording)).length;

  const BADGES: KidBadge[] = [
    {
      id: 'first-journal',
      title: 'First Journal',
      description: 'Wrote your very first journal entry!',
      icon: '🌟',
      unlocked: totalEntriesCount >= 1,
      progress: `${Math.min(totalEntriesCount, 1)}/1`,
    },
    {
      id: 'creative-explorer',
      title: 'Creative Explorer',
      description: 'Created a wonderful drawing on your canvas!',
      icon: '🎨',
      unlocked: hasDrawingsCount >= 1,
      progress: `${Math.min(hasDrawingsCount, 1)}/1`,
    },
    {
      id: '5-day-streak',
      title: '5 Day Streak',
      description: 'Journaled for 5 days in a row!',
      icon: '🔥',
      unlocked: streakDays >= 5,
      progress: `${Math.min(streakDays, 5)}/5 days`,
    },
    {
      id: 'voice-storyteller',
      title: 'Voice Storyteller',
      description: 'Recorded your voice to tell a story!',
      icon: '🎙️',
      unlocked: hasVoiceCount >= 1,
      progress: `${Math.min(hasVoiceCount, 1)}/1`,
    },
    {
      id: 'memory-catcher',
      title: 'Memory Catcher',
      description: 'Took or uploaded a photo of your day!',
      icon: '📸',
      unlocked: hasPhotosCount >= 1,
      progress: `${Math.min(hasPhotosCount, 1)}/1`,
    },
  ];

  // Recent drawings & photos
  const recentDrawings = kidsEntries
    .filter((e) => Boolean(e.drawing))
    .slice(0, 6)
    .map((e) => ({
      id: e.id,
      src: e.drawing!,
      date: new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      mood: e.mood,
    }));

  const recentPhotos = kidsEntries
    .filter((e) => e.images && e.images.length > 0)
    .slice(0, 6)
    .map((e) => ({
      id: e.id,
      src: e.images![0].dataUrl,
      date: new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      mood: e.mood,
    }));

  const recentReflections = kidsEntries
    .filter((e) => Boolean(e.reflection?.personalReflection))
    .slice(0, 3)
    .map((e) => ({
      id: e.id,
      reflection: e.reflection!.personalReflection!,
      date: new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      mood: e.mood,
    }));

  return (
    <div id="kids-dashboard-page" className="w-full max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-teal-900/60 backdrop-blur-xl border-2 border-indigo-400/30 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-bold uppercase tracking-wider">
              <span>🏆 Kids Space</span>
              <span>•</span>
              <span>Creative Journal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              My Journal Adventure! 🚀
            </h1>
            <p className="text-slate-200 text-sm sm:text-base font-medium">
              Look at your amazing drawings, photo memories, and fun badges!
            </p>
          </div>

          {/* Big Action Button to Record Today */}
          <button
            id="btn-dash-new-day"
            type="button"
            onClick={onNewDayClick}
            className="flex items-center space-x-3 px-8 py-4 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-slate-950 font-extrabold text-base sm:text-lg shadow-xl shadow-amber-500/25 hover:from-amber-300 hover:to-rose-300 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-6 h-6" />
            <span>Add to My Day! ☀️</span>
          </button>
        </div>

        {/* Quick Stats Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/15">
          {/* Entries Count */}
          <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/10 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-white">{totalEntriesCount}</span>
              <span className="text-xs text-slate-300 block font-medium">Journal Entries</span>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/10 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-2xl font-black text-white">{streakDays} Days</span>
              <span className="text-xs text-slate-300 block font-medium">Daily Streak 🔥</span>
            </div>
          </div>

          {/* Total Drawings */}
          <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/10 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-white">{hasDrawingsCount}</span>
              <span className="text-xs text-slate-300 block font-medium">Drawings 🎨</span>
            </div>
          </div>

          {/* Photos Saved */}
          <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/10 flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-white">{hasPhotosCount}</span>
              <span className="text-xs text-slate-300 block font-medium">Photos 📸</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="rounded-3xl p-6 sm:p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Your Fun Badges 🎖️</h2>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-amber-300">
            {BADGES.filter((b) => b.unlocked).length} of {BADGES.length} Unlocked!
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {BADGES.map((b) => (
            <div
              key={b.id}
              id={`badge-${b.id}`}
              className={`relative rounded-2xl p-4 border-2 flex flex-col items-center text-center transition-all ${
                b.unlocked
                  ? 'bg-gradient-to-b from-amber-500/20 to-indigo-500/10 border-amber-400/40 shadow-lg shadow-amber-500/10 scale-100'
                  : 'bg-white/5 border-white/10 opacity-60'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-2 shadow-md ${
                  b.unlocked ? 'bg-amber-400/30 scale-110' : 'bg-slate-800'
                }`}
              >
                <span>{b.icon}</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{b.title}</h4>
              <p className="text-[11px] text-slate-300 mb-2 leading-tight">{b.description}</p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-auto ${
                  b.unlocked
                    ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {b.unlocked ? 'Unlocked ✨' : b.progress || 'Locked'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Galleries: Recent Drawings and Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Drawings */}
        <div className="rounded-3xl p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              <span>Recent Drawings 🎨</span>
            </span>
            <span className="text-xs text-purple-300 font-semibold">{recentDrawings.length} pictures</span>
          </div>

          {recentDrawings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recentDrawings.map((draw) => (
                <div
                  key={draw.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-white border-2 border-purple-400/30 cursor-pointer shadow-md hover:scale-105 transition-all"
                  onClick={() => setZoomedImage({ src: draw.src, title: `Drawing (${draw.date})` })}
                >
                  <img
                    src={draw.src}
                    alt="Drawing"
                    className="w-full h-full object-contain p-1"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] text-white font-medium">
                    {draw.date}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 space-y-2">
              <Palette className="w-8 h-8 text-slate-500" />
              <p className="text-xs text-slate-300">No drawings yet!</p>
              <button
                type="button"
                onClick={onNewDayClick}
                className="text-xs font-bold text-purple-300 hover:text-purple-200 underline"
              >
                Draw your first masterpiece ✨
              </button>
            </div>
          )}
        </div>

        {/* Recent Photos */}
        <div className="rounded-3xl p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-400" />
              <span>Recent Photos 📸</span>
            </span>
            <span className="text-xs text-sky-300 font-semibold">{recentPhotos.length} photos</span>
          </div>

          {recentPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recentPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border-2 border-sky-400/30 cursor-pointer shadow-md hover:scale-105 transition-all"
                  onClick={() => setZoomedImage({ src: photo.src, title: `Photo (${photo.date})` })}
                >
                  <img
                    src={photo.src}
                    alt="Photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] text-white font-medium">
                    {photo.date}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 space-y-2">
              <Camera className="w-8 h-8 text-slate-500" />
              <p className="text-xs text-slate-300">No photos added yet!</p>
              <button
                type="button"
                onClick={onNewDayClick}
                className="text-xs font-bold text-sky-300 hover:text-sky-200 underline"
              >
                Snap or upload a photo 📷
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Gemini Reflections Section */}
      {recentReflections.length > 0 && (
        <div className="rounded-3xl p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Recent Gemini AI Reflections ✨</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentReflections.map((ref) => (
              <div
                key={ref.id}
                className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-400/25 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <span>{ref.date}</span>
                  <span className="font-semibold">{ref.mood}</span>
                </div>
                <p className="text-xs sm:text-sm text-white font-medium italic line-clamp-3">
                  "{ref.reflection}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Entries Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">My Day Journal Cards 📖</h2>
          </div>
          <button
            type="button"
            onClick={onNewDayClick}
            className="flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-amber-300 hover:text-amber-200"
          >
            <span>Add New Entry</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {kidsEntries.length > 0 ? (
          <div className="space-y-6">
            {kidsEntries.map((entry) => (
              <KidsJournalCard
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-white/10 p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-3xl mx-auto">
              <span>🌟</span>
            </div>
            <h3 className="text-xl font-bold text-white">Your adventure starts here!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Press the button below to draw, speak, write, or snap a photo of your day.
            </p>
            <button
              type="button"
              onClick={onNewDayClick}
              className="px-6 py-3 rounded-2xl bg-amber-400 text-slate-950 font-bold text-base hover:bg-amber-300 transition-all cursor-pointer"
            >
              Start My First Entry ✏️
            </button>
          </div>
        )}
      </div>

      {/* Zoom Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 border border-white/20 rounded-3xl p-4 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full mb-3 px-2">
              <span className="text-sm font-bold text-white">{zoomedImage.title}</span>
              <button
                onClick={() => setZoomedImage(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={zoomedImage.src}
              alt="Zoomed"
              className="max-h-[75vh] w-auto object-contain rounded-2xl bg-white/5"
            />
          </div>
        </div>
      )}
    </div>
  );
};

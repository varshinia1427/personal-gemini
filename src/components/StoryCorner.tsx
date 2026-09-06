import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  Heart,
  Filter,
  Lightbulb,
} from 'lucide-react';
import type { AgeGroup, LanguageCode, StoryItem } from '../types';
import { apiGenerateStory } from '../services/api';
import { AGE_GROUP_CONFIGS } from '../utils/ageGroups';

interface StoryCornerProps {
  currentAgeGroup: AgeGroup;
  currentLanguage: LanguageCode;
}

export const StoryCorner: React.FC<StoryCornerProps> = ({
  currentAgeGroup,
  currentLanguage,
}) => {
  const [activeAgeFilter, setActiveAgeFilter] = useState<AgeGroup>(currentAgeGroup);
  const [genre, setGenre] = useState<string>('Adventure');
  const [customIdea, setCustomIdea] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('story_corner_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync active filter if prop changes
  useEffect(() => {
    setActiveAgeFilter(currentAgeGroup);
  }, [currentAgeGroup]);

  // Initial story generation or loading
  useEffect(() => {
    if (stories.length === 0) {
      loadInitialStory(activeAgeFilter);
    }
  }, [activeAgeFilter]);

  const loadInitialStory = async (age: AgeGroup) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGenerateStory({
        ageGroup: age,
        genre: age === '3-6' ? 'Friendship' : age === '7-12' ? 'Mystery' : 'Inspirational',
        language: currentLanguage,
      });
      setStories((prev) => [res.story, ...prev]);
      setActiveStory(res.story);
    } catch (err: any) {
      console.error('Failed to load story:', err);
      setError(err?.message || 'Unable to generate story right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGenerateStory({
        ageGroup: activeAgeFilter,
        genre,
        prompt: customIdea.trim(),
        language: currentLanguage,
      });
      setStories((prev) => [res.story, ...prev]);
      setActiveStory(res.story);
      setCustomIdea('');
    } catch (err: any) {
      console.error('Failed to generate story:', err);
      setError(err?.message || 'Failed to generate your personalized story.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeech = () => {
    if (!activeStory) return;

    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `${activeStory.title}. ${activeStory.content}. Moral of the story: ${activeStory.moralLesson}`
      );
      utterance.rate = activeAgeFilter === '3-6' ? 0.85 : 1.0;
      utterance.pitch = activeAgeFilter === '3-6' ? 1.15 : 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const toggleFavorite = (storyId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId];
      try {
        localStorage.setItem('story_corner_favorites', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const ageGenres: Record<AgeGroup, string[]> = {
    '3-6': ['Friendship', 'Cute Animals', 'Bedtime Tale', 'Colors & Nature', 'Kindness'],
    '7-12': ['Adventure', 'Mystery', 'Space Exploration', 'Mythology', 'Invention', 'Hero Quest'],
    '13-17': ['Self-Discovery', 'Creativity', 'Sci-Fi Future', 'Music & Passion', 'Resilience', 'Friendship'],
    '18+': ['Mindful Solitude', 'Wisdom & Life', 'Historical Fiction', 'Calm Evening', 'Inner Reflection'],
  };

  return (
    <div id="story-corner-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/40 bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-800">
                Story Corner
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
                AI Storyteller
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Age-appropriate moral stories, imagination adventures, and soothing reflections generated with Gemini.
            </p>
          </div>
        </div>

        {/* Age Group Filter Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/70 overflow-x-auto max-w-full">
          {(['3-6', '7-12', '13-17', '18+'] as AgeGroup[]).map((group) => {
            const isSelected = activeAgeFilter === group;
            return (
              <button
                key={group}
                type="button"
                id={`story-filter-${group}`}
                onClick={() => {
                  setActiveAgeFilter(group);
                  loadInitialStory(group);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>{AGE_GROUP_CONFIGS[group].emoji}</span>{' '}
                <span>{AGE_GROUP_CONFIGS[group].badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Generator Prompt Box */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/40 bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-800">Create a New Story with Gemini</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Select Genre / Theme
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ageGenres[activeAgeFilter].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                    genre === g
                      ? 'bg-slate-800 text-white font-medium shadow-sm'
                      : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Custom Topic or Characters (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="story-custom-idea-input"
                value={customIdea}
                onChange={(e) => setCustomIdea(e.target.value)}
                placeholder={
                  activeAgeFilter === '3-6'
                    ? 'e.g. A shy turtle learning to play soccer with friends'
                    : activeAgeFilter === '7-12'
                    ? 'e.g. A secret treehouse that travels through history'
                    : activeAgeFilter === '13-17'
                    ? 'e.g. Overcoming stage fright at the high school band showcase'
                    : 'e.g. A quiet walk along the foggy harbor discovering inner peace'
                }
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              />
              <button
                type="button"
                id="generate-story-button"
                onClick={handleGenerateStory}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Generate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Story Reader */}
      {activeStory && (
        <motion.div
          key={activeStory.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/50 bg-white/80 backdrop-blur-md shadow-lg space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/70">
            <div className="flex items-center gap-3.5">
              <span className="text-4xl p-2 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
                {activeStory.coverEmoji}
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {activeStory.genre}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {activeStory.readTimeMinutes} min read
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-800">
                  {activeStory.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="story-voice-narrator-button"
                onClick={toggleSpeech}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isSpeaking
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm animate-pulse'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Read Aloud</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id={`favorite-story-${activeStory.id}`}
                onClick={() => toggleFavorite(activeStory.id)}
                className={`p-2 rounded-xl border transition-colors ${
                  favorites.includes(activeStory.id)
                    ? 'bg-rose-50 border-rose-200 text-rose-500'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500'
                }`}
                title="Save as Favorite"
              >
                <Heart
                  className={`w-4 h-4 ${
                    favorites.includes(activeStory.id) ? 'fill-current' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Story Body Content */}
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line font-serif">
            {activeStory.content}
          </div>

          {/* Moral Lesson Banner */}
          {activeStory.moralLesson && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                  Moral & Reflection
                </span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
                  {activeStory.moralLesson}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Previous Stories Shelf */}
      {stories.length > 1 && (
        <div className="glass-panel p-6 rounded-3xl border border-white/40 bg-white/70 backdrop-blur-md">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Story Library</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {stories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveStory(item)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  activeStory?.id === item.id
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-300/40'
                    : 'bg-white/80 border-slate-200 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{item.coverEmoji}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.genre}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-serif">
                  {item.content}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

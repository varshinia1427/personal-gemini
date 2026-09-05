import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Lock,
  Clock
} from 'lucide-react';
import { apiCreateEntry, apiUpdateEntry, apiReflectDraft } from '../services/api';
import { GeminiReflectionCard } from './GeminiReflectionCard';
import { MOODS } from '../utils/moods';
import type { JournalEntry, MoodType, ReflectionData } from '../types';

interface NewJournalEntryProps {
  initialEntry?: JournalEntry | null;
  onEntrySaved: (entry: JournalEntry) => void;
  onCancel: () => void;
}

export const NewJournalEntry: React.FC<NewJournalEntryProps> = ({
  initialEntry,
  onEntrySaved,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [mood, setMood] = useState<MoodType>(initialEntry?.mood || 'Calm');
  const [entryDate, setEntryDate] = useState(
    initialEntry?.created_at
      ? initialEntry.created_at.split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [reflection, setReflection] = useState<ReflectionData | null | undefined>(
    initialEntry?.reflection || null
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (initialEntry) {
      setTitle(initialEntry.title);
      setContent(initialEntry.content);
      setMood(initialEntry.mood);
      setEntryDate(initialEntry.created_at.split('T')[0]);
      setReflection(initialEntry.reflection);
    }
  }, [initialEntry]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleReflectWithGemini = async () => {
    if (!content.trim() || content.trim().length < 10) {
      setStatusMessage({
        type: 'error',
        text: 'Please write at least a sentence or two so Gemini has enough context to reflect.',
      });
      return;
    }

    setStatusMessage(null);
    setIsReflecting(true);

    try {
      const res = await apiReflectDraft(title, content, mood);
      setReflection(res.reflection);
      setStatusMessage({
        type: 'success',
        text: 'Gemini AI reflection generated successfully. Save your entry to keep it in your journal.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Unable to generate reflection. Please try again.',
      });
    } finally {
      setIsReflecting(false);
    }
  };

  const handleSave = async (isDraft: boolean) => {
    if (!content.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Journal content cannot be empty. Please pen your thoughts before saving.',
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const isoTimestamp = new Date(entryDate + 'T12:00:00Z').toISOString();

      let savedEntry: JournalEntry;
      if (initialEntry?.id) {
        const res = await apiUpdateEntry(initialEntry.id, {
          title: title.trim() || 'Untitled Reflection',
          content,
          mood,
          is_draft: isDraft,
          created_at: isoTimestamp,
          reflection,
        });
        savedEntry = res.entry;
      } else {
        const res = await apiCreateEntry({
          title: title.trim() || 'Untitled Reflection',
          content,
          mood,
          is_draft: isDraft,
          created_at: isoTimestamp,
          reflection,
        });
        savedEntry = res.entry;
      }

      setStatusMessage({
        type: 'success',
        text: isDraft ? 'Draft saved safely in your private space.' : 'Journal entry saved securely!',
      });

      setTimeout(() => {
        onEntrySaved(savedEntry);
      }, 700);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save entry. Please check your connection.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <button
            id="cancel-journal-entry-btn"
            onClick={onCancel}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Go back"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight italic">
              {initialEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Your thoughts remain strictly confidential and isolated to your account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-indigo-300 border border-white/15 backdrop-blur-md">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span>Private Entry</span>
          </span>
        </div>
      </div>

      {/* Notification Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-medium backdrop-blur-md transition-all ${
            statusMessage.type === 'success'
              ? 'bg-teal-500/15 border border-teal-500/30 text-teal-200'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Frosted Glass Writing Canvas */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Title & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2" htmlFor="entry-title-input">
              Entry Title
            </label>
            <input
              id="entry-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is the heart of your reflection today?"
              className="w-full px-4 py-3 rounded-2xl border border-white/10 text-sm sm:text-base font-medium text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2" htmlFor="entry-date-input">
              Date
            </label>
            <input
              id="entry-date-input"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-white/10 text-sm font-medium text-white focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md"
            />
          </div>
        </div>

        {/* Mood Selector Options */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2.5">
            How are you feeling right now?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {MOODS.map((m) => {
              const isSelected = mood === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  id={`mood-select-${m.value.toLowerCase()}`}
                  onClick={() => setMood(m.value)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? `${m.bgLight} ${m.border} ring-2 ring-indigo-400 font-bold shadow-lg shadow-indigo-950/40`
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Journal Text Area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400" htmlFor="journal-text-area">
              Journal Reflections
            </label>
            <div className="text-2xs text-slate-400 flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
            </div>
          </div>

          <textarea
            id="journal-text-area"
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely without self-censorship. What happened? What feelings arose? What are you grateful for, or what challenges are you holding?&#10;&#10;When you feel ready, tap 'Reflect with Gemini' below for mindful insights."
            className="w-full p-4.5 rounded-2xl border border-white/10 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md leading-relaxed resize-y font-normal"
          />
        </div>

        {/* Action Controls */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/10">
          <button
            type="button"
            id="reflect-gemini-btn"
            onClick={handleReflectWithGemini}
            disabled={isReflecting || !content.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isReflecting ? 'animate-spin' : ''}`} />
            <span>{isReflecting ? 'Gemini is Reflecting...' : 'Reflect with Gemini'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="save-draft-btn"
              onClick={() => handleSave(true)}
              disabled={isSaving || !content.trim()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 font-medium text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              id="save-entry-btn"
              onClick={() => handleSave(false)}
              disabled={isSaving || !content.trim()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs sm:text-sm transition-colors shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gemini AI Reflection Section */}
      {(reflection || isReflecting) && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Gemini Reflection Preview</span>
            </h3>
            {reflection && (
              <span className="text-2xs text-slate-400">
                Generated {new Date(reflection.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <GeminiReflectionCard reflection={reflection} isLoading={isReflecting} />
        </div>
      )}
    </div>
  );
};

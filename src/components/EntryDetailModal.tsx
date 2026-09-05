import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { GeminiReflectionCard } from './GeminiReflectionCard';
import { getMoodConfig } from '../utils/moods';
import { apiReflectSavedEntry } from '../services/api';
import type { JournalEntry } from '../types';

interface EntryDetailModalProps {
  entry: JournalEntry;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  onEntryUpdated: (updatedEntry: JournalEntry) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete,
  onEntryUpdated,
}) => {
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>(entry);
  const [isReflecting, setIsReflecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const moodConfig = getMoodConfig(currentEntry.mood);

  const handleTriggerReflection = async () => {
    setIsReflecting(true);
    setStatusMessage(null);
    try {
      const res = await apiReflectSavedEntry(currentEntry.id);
      setCurrentEntry(res.entry);
      onEntryUpdated(res.entry);
      setStatusMessage('Gemini reflection generated and saved to this entry.');
    } catch (err: any) {
      console.error('Reflection error:', err);
      setStatusMessage('Failed to generate reflection. Please try again.');
    } finally {
      setIsReflecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900/90 border border-white/15 backdrop-blur-2xl rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-white/5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${moodConfig.bgLight} ${moodConfig.textColor} border ${moodConfig.border}`}>
                <span>{moodConfig.emoji}</span>
                <span>{moodConfig.label}</span>
              </span>

              {currentEntry.is_draft && (
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Draft
                </span>
              )}

              <span className="text-xs text-slate-400 font-light flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                <span>
                  {new Date(currentEntry.created_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </span>
            </div>

            <h3 className="text-2xl font-light text-white tracking-tight leading-snug italic">
              {currentEntry.title}
            </h3>
          </div>

          <button
            id="close-entry-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {statusMessage && (
            <div className="p-4 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-xs text-teal-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Journal Content */}
          <div className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-light">
            {currentEntry.content}
          </div>

          {/* Gemini Reflection Section */}
          <div className="pt-4 border-t border-white/10">
            {currentEntry.reflection ? (
              <GeminiReflectionCard reflection={currentEntry.reflection} />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
                <div className="space-y-1">
                  <h4 className="font-medium text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-300" />
                    <span>No AI reflection generated yet</span>
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md font-light">
                    Synthesize your thoughts, identify themes, and receive mindful reflection questions with Gemini.
                  </p>
                </div>
                <button
                  id="modal-reflect-entry-btn"
                  onClick={handleTriggerReflection}
                  disabled={isReflecting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer shrink-0 disabled:opacity-60"
                >
                  <Sparkles className={`w-4 h-4 ${isReflecting ? 'animate-spin' : ''}`} />
                  <span>{isReflecting ? 'Reflecting with Gemini...' : 'Reflect with Gemini'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/5 flex items-center justify-between gap-3">
          <button
            id="modal-delete-entry-btn"
            onClick={() => onDelete(currentEntry)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-rose-400 hover:bg-rose-500/15 text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Entry</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              id="modal-edit-entry-btn"
              onClick={() => onEdit(currentEntry)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors cursor-pointer border border-white/10"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Entry</span>
            </button>
            <button
              id="modal-done-btn"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium transition-colors cursor-pointer shadow-lg shadow-indigo-500/25"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Eye, 
  BookOpen, 
  AlertTriangle, 
  Plus
} from 'lucide-react';
import { apiGetEntries, apiDeleteEntry } from '../services/api';
import { getMoodConfig, MOODS } from '../utils/moods';
import type { JournalEntry } from '../types';

interface MyJournalProps {
  onNavigateNewEntry: () => void;
  onViewEntry: (entry: JournalEntry) => void;
  onEditEntry: (entry: JournalEntry) => void;
}

type DateFilterOption = 'all' | 'today' | 'week' | 'month';

export const MyJournal: React.FC<MyJournalProps> = ({
  onNavigateNewEntry,
  onViewEntry,
  onEditEntry,
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'drafts'>('all');

  // Delete modal state
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await apiGetEntries();
      setEntries(res.entries);
    } catch (err) {
      console.error('Failed to load entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      await apiDeleteEntry(entryToDelete.id);
      setEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
      setActionNotice('Journal entry permanently deleted.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete journal entry.');
    } finally {
      setIsDeleting(false);
      setEntryToDelete(null);
    }
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search text match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesContent = entry.content.toLowerCase().includes(q);
        const matchesTheme = entry.reflection?.keyThemes?.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTheme) return false;
      }

      // Mood match
      if (selectedMood !== 'ALL' && entry.mood.toLowerCase() !== selectedMood.toLowerCase()) {
        return false;
      }

      // Status match
      if (statusFilter === 'published' && entry.is_draft) return false;
      if (statusFilter === 'drafts' && !entry.is_draft) return false;

      // Date match
      if (dateFilter !== 'all') {
        const entryTime = new Date(entry.created_at).getTime();
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (dateFilter === 'today') {
          const todayStr = new Date().toISOString().split('T')[0];
          if (!entry.created_at.startsWith(todayStr)) return false;
        } else if (dateFilter === 'week') {
          if (now - entryTime > oneDayMs * 7) return false;
        } else if (dateFilter === 'month') {
          if (now - entryTime > oneDayMs * 30) return false;
        }
      }

      return true;
    });
  }, [entries, searchQuery, selectedMood, dateFilter, statusFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight italic">
            My Journal <span className="text-indigo-300 font-normal not-italic text-2xl">Archive</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
            Search, filter, and revisit your private reflections and Gemini insights.
          </p>
        </div>

        <button
          id="my-journal-create-entry-btn"
          onClick={onNavigateNewEntry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-medium flex items-center justify-between shadow-lg backdrop-blur-md">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar (Frosted Glass) */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="journal-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries by title, text, or theme..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Mood Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-300" />
              <span>Mood:</span>
            </span>
            <button
              id="mood-filter-all"
              onClick={() => setSelectedMood('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedMood === 'ALL'
                  ? 'bg-white/20 text-white border border-white/30 font-semibold shadow-xs'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              All Moods
            </button>
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.value;
              return (
                <button
                  key={m.value}
                  id={`mood-filter-${m.value.toLowerCase()}`}
                  onClick={() => setSelectedMood(m.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? `${m.bgLight} ${m.textColor} ${m.border} border ring-1 ring-indigo-400 font-bold shadow-xs`
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Date & Status Selectors */}
          <div className="flex items-center gap-2">
            <select
              id="date-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
              className="text-xs px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 font-medium focus:outline-hidden backdrop-blur-md"
            >
              <option value="all" className="bg-slate-900 text-white">All Dates</option>
              <option value="today" className="bg-slate-900 text-white">Today Only</option>
              <option value="week" className="bg-slate-900 text-white">Past 7 Days</option>
              <option value="month" className="bg-slate-900 text-white">Past 30 Days</option>
            </select>

            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 font-medium focus:outline-hidden backdrop-blur-md"
            >
              <option value="all" className="bg-slate-900 text-white">All Entries</option>
              <option value="published" className="bg-slate-900 text-white">Saved Entries</option>
              <option value="drafts" className="bg-slate-900 text-white">Drafts Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Entries List / Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-white/5 border border-white/10 p-6 animate-pulse space-y-3" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-slate-900/30 border border-dashed border-white/15 rounded-3xl p-12 text-center space-y-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-300 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-medium text-white text-base">No journal entries found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-light">
              {entries.length === 0
                ? "You haven't written any journal entries yet. Start your mindful writing journey today!"
                : 'No entries match your search or filter criteria. Try adjusting your filters.'}
            </p>
          </div>

          {entries.length === 0 && (
            <button
              id="empty-journal-create-btn"
              onClick={onNavigateNewEntry}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Write Your First Entry</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredEntries.map((entry) => {
            const mood = getMoodConfig(entry.mood);
            const wordCount = entry.content.split(/\s+/).filter(Boolean).length;

            return (
              <div
                key={entry.id}
                className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 hover:border-white/20 hover:bg-white/10 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  {/* Top Bar: Mood & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${mood.bgLight} ${mood.textColor} border ${mood.border}`}>
                        <span>{mood.emoji}</span>
                        <span>{mood.label}</span>
                      </span>

                      {entry.is_draft && (
                        <span className="px-2.5 py-0.5 rounded-full text-2xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Draft
                        </span>
                      )}
                    </div>

                    <span className="text-2xs text-slate-400 font-light">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onViewEntry(entry)}
                    className="font-medium text-white text-base group-hover:text-indigo-300 transition-colors cursor-pointer line-clamp-1"
                  >
                    {entry.title}
                  </h3>

                  {/* Content Excerpt */}
                  <p
                    onClick={() => onViewEntry(entry)}
                    className="text-xs sm:text-sm text-slate-300 font-light mt-2 line-clamp-3 leading-relaxed cursor-pointer"
                  >
                    {entry.content}
                  </p>

                  {/* AI Themes */}
                  {entry.reflection?.keyThemes && entry.reflection.keyThemes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
                      {entry.reflection.keyThemes.slice(0, 3).map((theme, idx) => (
                        <span key={idx} className="text-2xs font-medium text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/25">
                          #{theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Controls */}
                <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {entry.reflection ? (
                      <span className="inline-flex items-center gap-1 text-teal-300 font-medium text-2xs">
                        <Sparkles className="w-3 h-3 text-teal-400" />
                        <span>AI Reflected</span>
                      </span>
                    ) : (
                      <span className="text-2xs text-slate-400 font-light">{wordCount} words</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`view-entry-${entry.id}`}
                      onClick={() => onViewEntry(entry)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                      title="View & Reflect"
                      aria-label="View Entry"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      id={`edit-entry-${entry.id}`}
                      onClick={() => onEditEntry(entry)}
                      className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                      title="Edit Entry"
                      aria-label="Edit Entry"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      id={`delete-entry-${entry.id}`}
                      onClick={() => setEntryToDelete(entry)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete Entry"
                      aria-label="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal (Frosted Glass) */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900/90 border border-white/15 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 text-slate-100">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-white">Delete Journal Entry?</h3>
              <p className="text-xs text-slate-300 font-light mt-1.5 leading-relaxed">
                Are you sure you want to permanently delete <strong>"{entryToDelete.title}"</strong>? This entry and its AI reflection will be deleted permanently and cannot be recovered.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                id="cancel-delete-modal-btn"
                onClick={() => setEntryToDelete(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-modal-btn"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors shadow-lg shadow-rose-600/25 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

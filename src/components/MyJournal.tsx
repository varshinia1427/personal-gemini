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
  Plus,
  Mic,
  Image as ImageIcon,
  Globe,
  Calendar
} from 'lucide-react';
import { apiGetEntries, apiDeleteEntry } from '../services/api';
import { getMoodConfig, MOODS } from '../utils/moods';
import { SUPPORTED_LANGUAGES, getLanguageOption } from '../utils/languages';
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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
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
      setActionNotice('Journal entry permanently deleted from Firestore.');
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
        const matchesVoice = Boolean(entry.voiceRecording?.transcription?.toLowerCase().includes(q));
        const matchesTheme = entry.reflection?.keyThemes?.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesVoice && !matchesTheme) return false;
      }

      // Mood match
      if (selectedMood !== 'ALL' && entry.mood.toLowerCase() !== selectedMood.toLowerCase()) {
        return false;
      }

      // Language match
      if (selectedLanguage !== 'ALL' && (entry.language || 'en') !== selectedLanguage) {
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
  }, [entries, searchQuery, selectedMood, selectedLanguage, dateFilter, statusFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight italic">
            My Journal <span className="text-indigo-300 font-normal not-italic text-2xl">Archive</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
            Search, filter, and revisit your multimodal reflections across all 14 languages.
          </p>
        </div>

        <button
          id="my-journal-create-entry-btn"
          onClick={onNavigateNewEntry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer self-start sm:self-auto"
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
            placeholder="Search journal entries by title, text, voice transcription, or theme..."
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

          {/* Language, Date & Status Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Filter */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <select
                id="language-filter-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Languages</option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <select
              id="date-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
              className="text-xs px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 font-medium focus:outline-hidden backdrop-blur-md cursor-pointer"
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
              className="text-xs px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 font-medium focus:outline-hidden backdrop-blur-md cursor-pointer"
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
          <button
            id="my-journal-empty-state-btn"
            onClick={onNavigateNewEntry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Entry</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEntries.map((entry) => {
            const mood = getMoodConfig(entry.mood);
            const lang = getLanguageOption(entry.language || 'en');
            const hasVoice = Boolean(entry.voiceRecording);
            const hasPhotos = Boolean(entry.images && entry.images.length > 0);

            return (
              <div
                key={entry.id}
                className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-6 flex flex-col justify-between group hover:border-indigo-400/40 hover:bg-slate-900/60 transition-all shadow-lg space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${mood.bgLight} ${mood.textColor} border ${mood.border}`}>
                        <span>{mood.emoji}</span>
                        <span>{mood.label}</span>
                      </span>

                      {/* Language Tag */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-white/10 text-teal-300 border border-white/15">
                        <Globe className="w-3 h-3 text-teal-400" />
                        <span>{lang.name}</span>
                      </span>

                      {entry.is_draft && (
                        <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Draft
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-400 font-light flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                      <span>{new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onViewEntry(entry)}
                    className="text-lg font-medium text-white group-hover:text-indigo-300 transition-colors cursor-pointer line-clamp-1"
                  >
                    {entry.title}
                  </h3>

                  {/* Multimodal Badges (Voice, Photos) */}
                  {(hasVoice || hasPhotos) && (
                    <div className="flex items-center gap-2 mt-2">
                      {hasVoice && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/25 text-3xs font-medium">
                          <Mic className="w-3 h-3 text-rose-400" />
                          <span>Voice Recording ({entry.voiceRecording?.durationSeconds || 0}s)</span>
                        </span>
                      )}
                      {hasPhotos && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-3xs font-medium">
                          <ImageIcon className="w-3 h-3 text-indigo-400" />
                          <span>{entry.images!.length} photo(s)</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Content Preview */}
                  <p
                    onClick={() => onViewEntry(entry)}
                    dir={lang.dir || 'ltr'}
                    className="text-xs sm:text-sm text-slate-300 mt-2 font-light leading-relaxed line-clamp-3 cursor-pointer"
                  >
                    {entry.content || entry.voiceRecording?.transcription || 'No written content.'}
                  </p>

                  {/* Image thumbnails preview */}
                  {hasPhotos && (
                    <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                      {entry.images!.slice(0, 3).map((img) => (
                        <img
                          key={img.id}
                          src={img.dataUrl}
                          alt="Thumbnail"
                          className="w-12 h-12 rounded-xl object-cover border border-white/15"
                          referrerPolicy="no-referrer"
                        />
                      ))}
                      {entry.images!.length > 3 && (
                        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xs text-slate-300 font-bold">
                          +{entry.images!.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Gemini Reflection Tag / Summary */}
                  {entry.reflection && (
                    <div className="mt-3 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-200">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-medium mb-1 text-2xs uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-teal-300" />
                        <span>Gemini Reflection</span>
                      </div>
                      <p className="line-clamp-2 text-slate-300 font-light italic">
                        "{entry.reflection.summary}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewEntry(entry)}
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-teal-400" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => onEditEntry(entry)}
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer py-1 ml-2"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setEntryToDelete(entry)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Entry"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-slate-100 backdrop-blur-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Permanently Delete Entry?</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light leading-relaxed">
                Are you sure you want to delete <strong className="text-white">"{entryToDelete.title}"</strong>? This will remove the entry, attached voice notes, photos, and Gemini reflections from your private Firestore database.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-full text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-entry-btn"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
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

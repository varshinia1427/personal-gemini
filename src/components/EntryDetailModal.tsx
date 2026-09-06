import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Pause,
  Volume2,
  Globe,
  Languages,
  Maximize2
} from 'lucide-react';
import { GeminiReflectionCard } from './GeminiReflectionCard';
import { getMoodConfig } from '../utils/moods';
import { SUPPORTED_LANGUAGES, getLanguageOption } from '../utils/languages';
import { apiReflectSavedEntry, apiTranslateEntry } from '../services/api';
import type { JournalEntry, LanguageCode } from '../types';

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
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [targetTranslateLang, setTargetTranslateLang] = useState<LanguageCode>('es');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Lightbox preview for photos
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);

  const moodConfig = getMoodConfig(currentEntry.mood);
  const entryLang = getLanguageOption(currentEntry.language || 'en');

  const handleTriggerReflection = async () => {
    setIsReflecting(true);
    setStatusMessage(null);
    try {
      const res = await apiReflectSavedEntry(currentEntry.id);
      setCurrentEntry(res.entry);
      onEntryUpdated(res.entry);
      setStatusMessage({
        type: 'success',
        text: `Gemini reflection generated in ${entryLang.name} and saved to your journal.`,
      });
    } catch (err: any) {
      console.error('Reflection error:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to generate reflection. Please check your connection and try again.',
      });
    } finally {
      setIsReflecting(false);
    }
  };

  const handleTranslate = async (langCode: LanguageCode) => {
    setIsTranslating(true);
    setShowTranslateMenu(false);
    setStatusMessage(null);

    const targetOption = getLanguageOption(langCode);
    try {
      const res = await apiTranslateEntry(currentEntry.id, langCode);
      setCurrentEntry(res.entry);
      onEntryUpdated(res.entry);
      setStatusMessage({
        type: 'success',
        text: `Journal entry successfully translated into ${targetOption.name} (${targetOption.nativeName})!`,
      });
    } catch (err: any) {
      console.error('Translation error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Translation failed. Please try again.',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleAudio = () => {
    if (!currentEntry.voiceRecording?.audioUrl) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(currentEntry.voiceRecording.audioUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900/95 border border-white/15 backdrop-blur-2xl rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-white/5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${moodConfig.bgLight} ${moodConfig.textColor} border ${moodConfig.border}`}>
                <span>{moodConfig.emoji}</span>
                <span>{moodConfig.label}</span>
              </span>

              {/* Language Tag */}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-teal-300 border border-white/15">
                <Globe className="w-3 h-3 text-teal-400" />
                <span>{entryLang.name} ({entryLang.nativeName})</span>
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

          <div className="flex items-center gap-2">
            {/* Translate Button */}
            <div className="relative">
              <button
                type="button"
                id="translate-entry-btn"
                onClick={() => setShowTranslateMenu((prev) => !prev)}
                disabled={isTranslating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-slate-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
                title="Translate entry into another language"
              >
                <Languages className="w-3.5 h-3.5 text-indigo-300" />
                <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
              </button>

              {showTranslateMenu && (
                <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-slate-900 border border-white/20 shadow-2xl backdrop-blur-2xl z-50 max-h-64 overflow-y-auto">
                  <div className="text-2xs font-medium uppercase tracking-wider text-slate-400 px-3 py-1.5">
                    Translate into:
                  </div>
                  {SUPPORTED_LANGUAGES.filter((l) => l.code !== currentEntry.language).map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleTranslate(l.code)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>{l.name}</span>
                      <span className="text-slate-400 text-2xs">{l.nativeName}</span>
                    </button>
                  ))}
                </div>
              )}
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
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-medium ${
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

          {/* Attached Images Gallery */}
          {currentEntry.images && currentEntry.images.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block">
                Visual Memories ({currentEntry.images.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {currentEntry.images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedLightboxImage(img.dataUrl)}
                    className="relative group rounded-2xl overflow-hidden border border-white/15 bg-white/5 aspect-square cursor-pointer hover:border-indigo-400/50 transition-all shadow-md"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.name || 'Journal visual'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Recording Player */}
          {currentEntry.voiceRecording && (
            <div className="p-4.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md hover:bg-indigo-400 transition-colors cursor-pointer"
                  >
                    {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div>
                    <span className="text-sm font-medium text-white block">Voice Journal Recording</span>
                    <span className="text-2xs text-indigo-300">
                      {currentEntry.voiceRecording.durationSeconds
                        ? `${currentEntry.voiceRecording.durationSeconds}s audio note`
                        : 'Audio note'} • Spoken language: {currentEntry.voiceRecording.detectedLanguage || entryLang.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-indigo-300">
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  <span>Audio Recorded</span>
                </div>
              </div>

              {currentEntry.voiceRecording.transcription && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-xs text-slate-200">
                  <span className="block text-2xs uppercase tracking-wider text-indigo-300 mb-1">
                    Spoken Voice Transcription
                  </span>
                  <p className="italic leading-relaxed font-light">"{currentEntry.voiceRecording.transcription}"</p>
                </div>
              )}
            </div>
          )}

          {/* Journal Written Content */}
          <div
            dir={entryLang.dir || 'ltr'}
            className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-light"
          >
            {currentEntry.content}
          </div>

          {/* Gemini Multimodal Reflection Section */}
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
                    Synthesize your thoughts, voice, and photos across your chosen language ({entryLang.name}) with Gemini.
                  </p>
                </div>
                <button
                  id="modal-reflect-entry-btn"
                  onClick={handleTriggerReflection}
                  disabled={isReflecting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer shrink-0 disabled:opacity-60"
                >
                  <Sparkles className={`w-4 h-4 ${isReflecting ? 'animate-spin' : ''}`} />
                  <span>{isReflecting ? `Reflecting in ${entryLang.name}...` : `Reflect with Gemini (${entryLang.name})`}</span>
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

      {/* Full-Screen Lightbox for Photos */}
      {selectedLightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer backdrop-blur-xl"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedLightboxImage}
              alt="Expanded view"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-white/20 shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

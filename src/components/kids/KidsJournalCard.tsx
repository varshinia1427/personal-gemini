import React, { useState } from 'react';
import {
  Calendar,
  Smile,
  Palette,
  Camera,
  Play,
  Pause,
  Sparkles,
  Trash2,
  Globe,
  Maximize2,
  X,
} from 'lucide-react';
import { getMoodConfig } from '../../utils/moods';
import { getLanguageOption } from '../../utils/languages';
import type { JournalEntry } from '../../types';

interface KidsJournalCardProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}

export const KidsJournalCard: React.FC<KidsJournalCardProps> = ({ entry, onDelete }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const moodConfig = getMoodConfig(entry.mood);
  const langOption = getLanguageOption(entry.language || 'en');

  const formattedDate = new Date(entry.created_at).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const toggleVoice = () => {
    if (!entry.voiceRecording?.audioUrl) return;

    if (!audioElement) {
      const audio = new Audio(entry.voiceRecording.audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      setAudioElement(audio);
      audio.play();
      setIsPlayingAudio(true);
    } else {
      if (isPlayingAudio) {
        audioElement.pause();
        setIsPlayingAudio(false);
      } else {
        audioElement.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const hasPhoto = entry.images && entry.images.length > 0;
  const photoUrl = hasPhoto ? entry.images![0].dataUrl : null;

  return (
    <div
      id={`kids-journal-card-${entry.id}`}
      className="relative rounded-3xl p-6 bg-slate-900/70 backdrop-blur-xl border-2 border-indigo-500/25 shadow-xl hover:shadow-2xl hover:border-indigo-500/40 transition-all space-y-5"
    >
      {/* Card Header: Date, Mood Badge, and Language */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center space-x-3">
          {/* Large Mood Emoji Badge */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border ${moodConfig.bgLight} ${moodConfig.border}`}
            title={`Mood: ${entry.mood}`}
          >
            <span>{moodConfig.emoji}</span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold text-white">{entry.mood}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                {langOption.nativeName}
              </span>
            </div>
            <div className="flex items-center text-xs text-slate-300 mt-0.5">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Delete button */}
        <button
          id={`btn-delete-entry-${entry.id}`}
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          title="Delete entry"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Visual Media Section: Drawing & Photo Grid */}
      {(entry.drawing || hasPhoto) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Drawing */}
          {entry.drawing && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                <span>My Drawing 🎨</span>
              </span>
              <div
                className="group relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white border-2 border-purple-400/30 cursor-pointer shadow-md"
                onClick={() => setZoomedImage({ src: entry.drawing!, title: 'My Drawing 🎨' })}
              >
                <img
                  src={entry.drawing}
                  alt="Drawing"
                  className="w-full h-full object-contain p-1"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Maximize2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}

          {/* Photo */}
          {photoUrl && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-sky-300 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" />
                <span>My Photo 📸</span>
              </span>
              <div
                className="group relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-sky-400/30 cursor-pointer shadow-md"
                onClick={() => setZoomedImage({ src: photoUrl, title: 'My Photo 📸' })}
              >
                <img
                  src={photoUrl}
                  alt="Photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Maximize2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spoken Voice Section */}
      {entry.voiceRecording && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              id={`btn-play-card-voice-${entry.id}`}
              type="button"
              onClick={toggleVoice}
              className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-all"
            >
              {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div>
              <span className="text-xs font-bold text-rose-200 block">Voice Story 🎙️</span>
              <p className="text-xs text-slate-300 italic line-clamp-1">
                "{entry.voiceRecording.transcription}"
              </p>
            </div>
          </div>
          {entry.voiceRecording.durationSeconds ? (
            <span className="text-[11px] text-rose-300 font-semibold">
              {entry.voiceRecording.durationSeconds}s
            </span>
          ) : null}
        </div>
      )}

      {/* Written Text Content */}
      {entry.content && (
        <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5">
          <p className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap">
            {entry.content}
          </p>
        </div>
      )}

      {/* Gemini AI Reflection Box */}
      {entry.reflection && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border-2 border-indigo-400/30 space-y-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
              Gemini AI Reflection ✨
            </span>
          </div>

          <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
            "{entry.reflection.personalReflection || entry.reflection.summary}"
          </p>

          {entry.reflection.positiveObservations && entry.reflection.positiveObservations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {entry.reflection.positiveObservations.map((obs, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-medium"
                >
                  ⭐ {obs}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete this memory?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove this day's journal entry? This cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 text-sm font-medium transition-colors"
              >
                Keep It
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(entry.id);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-600/30 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

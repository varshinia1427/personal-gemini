import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Save, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Lock,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Image as ImageIcon,
  X,
  Globe,
  Languages,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { apiCreateEntry, apiUpdateEntry, apiReflectDraft, apiTranscribeAudio } from '../services/api';
import { GeminiReflectionCard } from './GeminiReflectionCard';
import { MOODS } from '../utils/moods';
import { SUPPORTED_LANGUAGES, getLanguageOption } from '../utils/languages';
import type { JournalEntry, JournalImage, LanguageCode, MoodType, ReflectionData, VoiceRecording } from '../types';

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
  const [language, setLanguage] = useState<LanguageCode>(initialEntry?.language || 'en');
  const [entryDate, setEntryDate] = useState(
    initialEntry?.created_at
      ? initialEntry.created_at.split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [reflection, setReflection] = useState<ReflectionData | null | undefined>(
    initialEntry?.reflection || null
  );

  // Images state
  const [images, setImages] = useState<JournalImage[]>(initialEntry?.images || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecording | null>(
    initialEntry?.voiceRecording || null
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Submission / Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (initialEntry) {
      setTitle(initialEntry.title);
      setContent(initialEntry.content);
      setMood(initialEntry.mood);
      setLanguage(initialEntry.language || 'en');
      setEntryDate(initialEntry.created_at.split('T')[0]);
      setReflection(initialEntry.reflection);
      setImages(initialEntry.images || []);
      setVoiceRecording(initialEntry.voiceRecording || null);
    }
  }, [initialEntry]);

  // Cleanup audio & timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const currentLangOption = getLanguageOption(language);

  // ----------------------------------------------------
  // VOICE RECORDING & TRANSCRIPTION
  // ----------------------------------------------------
  const startRecording = async () => {
    setStatusMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const base64Audio = dataUrl.split(',')[1];

          setIsTranscribing(true);
          try {
            // Transcribe with server-side Gemini audio transcription
            const transcriptionResult = await apiTranscribeAudio(
              base64Audio,
              'audio/webm',
              currentLangOption.name
            );

            const newRecording: VoiceRecording = {
              audioUrl: dataUrl,
              durationSeconds: recordingDuration,
              transcription: transcriptionResult.transcription,
              detectedLanguage: transcriptionResult.detectedLanguage,
              createdAt: new Date().toISOString(),
            };

            setVoiceRecording(newRecording);

            // If journal content is currently empty, offer to populate it
            if (!content.trim() && transcriptionResult.transcription) {
              setContent(transcriptionResult.transcription);
            }

            setStatusMessage({
              type: 'success',
              text: `Voice transcribed (${transcriptionResult.detectedLanguage || currentLangOption.name}). You can review and edit below.`,
            });
          } catch (err: any) {
            console.error('Audio transcription error:', err);
            // Even if AI transcription endpoint has an issue, save audio
            setVoiceRecording({
              audioUrl: dataUrl,
              durationSeconds: recordingDuration,
              transcription: 'Voice recording saved.',
              detectedLanguage: currentLangOption.name,
              createdAt: new Date().toISOString(),
            });
          } finally {
            setIsTranscribing(false);
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Try browser Web Speech API for live interim feedback
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognizer = new SpeechRecognition();
          recognizer.continuous = true;
          recognizer.interimResults = true;
          recognizer.lang = currentLangOption.speechCode;

          recognizer.onresult = (event: any) => {
            let liveTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              liveTranscript += event.results[i][0].transcript + ' ';
            }
            if (liveTranscript.trim()) {
              setVoiceRecording((prev) => ({
                audioUrl: prev?.audioUrl || '',
                transcription: liveTranscript.trim(),
                detectedLanguage: currentLangOption.name,
                createdAt: new Date().toISOString(),
              }));
            }
          };

          recognizer.start();
          speechRecognitionRef.current = recognizer;
        } catch (e) {
          console.log('Web speech API live stream skipped:', e);
        }
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      let errorText = 'Unable to access microphone. Please check your browser microphone permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorText = 'Microphone access denied. Please click the permissions icon in your browser address bar to allow microphone access.';
      }
      setStatusMessage({ type: 'error', text: errorText });
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleAudioPlayback = () => {
    if (!voiceRecording?.audioUrl) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(voiceRecording.audioUrl);
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

  const removeVoiceRecording = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlayingAudio(false);
    setVoiceRecording(null);
  };

  // ----------------------------------------------------
  // IMAGE HANDLING
  // ----------------------------------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      // Limit to 5MB per image
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: `Image "${file.name}" exceeds 5MB limit.` });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const newImg: JournalImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            dataUrl: result,
            name: file.name,
            size: file.size,
          };
          setImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // ----------------------------------------------------
  // MULTIMODAL REFLECTION GENERATION
  // ----------------------------------------------------
  const handleReflectWithGemini = async () => {
    const hasText = content.trim().length >= 5;
    const hasVoice = Boolean(voiceRecording?.transcription && voiceRecording.transcription.trim().length >= 5);

    if (!hasText && !hasVoice) {
      setStatusMessage({
        type: 'error',
        text: 'Please write some thoughts or record a voice note before requesting a Gemini reflection.',
      });
      return;
    }

    setStatusMessage(null);
    setIsReflecting(true);

    try {
      const res = await apiReflectDraft({
        title,
        content,
        mood,
        language,
        voiceTranscription: voiceRecording?.transcription,
        images,
      });

      setReflection(res.reflection);
      setStatusMessage({
        type: 'success',
        text: `Gemini Multimodal Reflection generated in ${currentLangOption.name}! Remember to save your entry.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Unable to generate reflection. Please check connection and try again.',
      });
    } finally {
      setIsReflecting(false);
    }
  };

  // ----------------------------------------------------
  // SAVE / DRAFT
  // ----------------------------------------------------
  const handleSave = async (isDraft: boolean) => {
    if (!content.trim() && !voiceRecording?.transcription) {
      setStatusMessage({
        type: 'error',
        text: 'Journal content cannot be empty. Please write or speak your reflection.',
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
          language,
          images,
          voiceRecording,
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
          language,
          images,
          voiceRecording,
          is_draft: isDraft,
          created_at: isoTimestamp,
          reflection,
        });
        savedEntry = res.entry;
      }

      setStatusMessage({
        type: 'success',
        text: isDraft ? 'Draft saved safely in your private Firestore collection.' : 'Journal entry saved securely!',
      });

      setTimeout(() => {
        onEntrySaved(savedEntry);
      }, 600);
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
      {/* Top Header & Navigation */}
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
              Multilingual, multimodal reflection isolated to your private Firebase account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Language Selector in Header */}
          <div className="flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs">
            <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <select
              id="entry-language-selector"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-white font-medium focus:outline-hidden cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium bg-white/10 text-teal-300 border border-white/15 backdrop-blur-md">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span>Encrypted UID</span>
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
              dir={currentLangOption.dir || 'ltr'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Reflection in ${currentLangOption.name}...`}
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

        {/* Multimodal Toolbar: Voice Recording & Image Upload */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Microphone Button */}
            {!isRecording ? (
              <button
                type="button"
                id="record-voice-btn"
                onClick={startRecording}
                disabled={isTranscribing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              >
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>{voiceRecording ? 'Re-record Voice' : 'Record Voice'}</span>
              </button>
            ) : (
              <button
                type="button"
                id="stop-recording-btn"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/25 hover:bg-rose-500/35 text-rose-200 border border-rose-500/40 text-xs font-medium transition-all cursor-pointer animate-pulse"
              >
                <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Stop Recording ({recordingDuration}s)</span>
              </button>
            )}

            {/* Image Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              id="upload-image-btn"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 text-xs font-medium transition-all cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>Add Images ({images.length})</span>
            </button>
          </div>

          <div className="text-2xs text-slate-400 flex items-center gap-3">
            <span>Language: <strong className="text-slate-200">{currentLangOption.nativeName}</strong></span>
            <span>•</span>
            <span>{wordCount} words</span>
          </div>
        </div>

        {/* Voice Note Player & Transcription Box */}
        {voiceRecording && (
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="play-voice-btn"
                  onClick={toggleAudioPlayback}
                  className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md hover:bg-indigo-400 transition-colors cursor-pointer"
                  title={isPlayingAudio ? 'Pause recording' : 'Play voice recording'}
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div>
                  <span className="text-xs font-medium text-white block">Voice Recording</span>
                  <span className="text-2xs text-indigo-300">
                    {voiceRecording.durationSeconds ? `${voiceRecording.durationSeconds}s` : 'Audio note'} • Detected: {voiceRecording.detectedLanguage || currentLangOption.name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="remove-voice-btn"
                onClick={removeVoiceRecording}
                className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                title="Remove recording"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editable Voice Transcription */}
            <div>
              <label className="block text-2xs uppercase tracking-wider text-indigo-300 mb-1">
                Spoken Voice Transcription (Editable)
              </label>
              <textarea
                rows={2}
                value={voiceRecording.transcription}
                onChange={(e) =>
                  setVoiceRecording((prev) =>
                    prev ? { ...prev, transcription: e.target.value } : null
                  )
                }
                placeholder="Voice transcription will appear here..."
                className="w-full p-2.5 rounded-xl border border-white/10 text-xs text-slate-200 bg-white/5 focus:outline-hidden focus:border-indigo-400"
              />
            </div>
          </div>
        )}

        {/* Image Preview Gallery */}
        {images.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium uppercase tracking-wider">Attached Images ({images.length})</span>
              <span>Gemini will visually analyze these photos</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group rounded-2xl overflow-hidden border border-white/15 bg-white/5 aspect-video sm:aspect-square flex items-center justify-center"
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name || 'Journal attachment'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white backdrop-blur-md transition-colors cursor-pointer shadow-md"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Journal Text Area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400" htmlFor="journal-text-area">
              Journal Content ({currentLangOption.name})
            </label>
            <div className="text-2xs text-slate-400 flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
            </div>
          </div>

          <textarea
            id="journal-text-area"
            rows={12}
            dir={currentLangOption.dir || 'ltr'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Express your inner thoughts freely in ${currentLangOption.name} (${currentLangOption.nativeName}). What happened? What emotions arose? What are you holding or releasing?&#10;&#10;Tap 'Reflect with Gemini' below for an AI reflection in ${currentLangOption.name}.`}
            className="w-full p-4.5 rounded-2xl border border-white/10 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md leading-relaxed resize-y font-normal"
          />
        </div>

        {/* Action Controls */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/10">
          <button
            type="button"
            id="reflect-gemini-btn"
            onClick={handleReflectWithGemini}
            disabled={isReflecting || (!content.trim() && !voiceRecording?.transcription)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isReflecting ? 'animate-spin' : ''}`} />
            <span>
              {isReflecting ? `Reflecting in ${currentLangOption.name}...` : `Reflect with Gemini (${currentLangOption.name})`}
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="save-draft-btn"
              onClick={() => handleSave(true)}
              disabled={isSaving || (!content.trim() && !voiceRecording?.transcription)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 font-medium text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              id="save-entry-btn"
              onClick={() => handleSave(false)}
              disabled={isSaving || (!content.trim() && !voiceRecording?.transcription)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs sm:text-sm transition-colors shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gemini AI Multimodal Reflection Preview */}
      {(reflection || isReflecting) && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Gemini Reflection Preview ({currentLangOption.name})</span>
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

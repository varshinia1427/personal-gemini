import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  Mic,
  MicOff,
  Palette,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  X,
  Play,
  Pause,
  Globe,
  Smile,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { apiCreateEntry, apiReflectDraft, apiTranscribeAudio } from '../../services/api';
import { KIDS_MOODS } from '../../utils/moods';
import { SUPPORTED_LANGUAGES, getLanguageOption } from '../../utils/languages';
import { DrawingCanvas } from './DrawingCanvas';
import { CameraCaptureModal } from './CameraCaptureModal';
import type {
  JournalEntry,
  JournalImage,
  LanguageCode,
  MoodType,
  ReflectionData,
  VoiceRecording,
} from '../../types';

interface KidsMyDayProps {
  onEntrySaved: (entry: JournalEntry) => void;
  onNavigateToDashboard: () => void;
}

export const KidsMyDay: React.FC<KidsMyDayProps> = ({
  onEntrySaved,
  onNavigateToDashboard,
}) => {
  // Multimodal state
  const [selectedMood, setSelectedMood] = useState<MoodType>('Happy');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');

  // Input sections toggles/modals
  const [showWriteBox, setShowWriteBox] = useState<boolean>(true);
  const [showDrawingModal, setShowDrawingModal] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);

  // Content state
  const [writtenText, setWrittenText] = useState<string>('');
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecording | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Reflection state
  const [reflection, setReflection] = useState<ReflectionData | null>(null);
  const [isReflecting, setIsReflecting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  const langOption = getLanguageOption(selectedLanguage);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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

  // ----------------------------------------------------
  // VOICE RECORDING FOR KIDS
  // ----------------------------------------------------
  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const base64Audio = dataUrl.split(',')[1];

          setIsTranscribing(true);
          try {
            const transcriptionResult = await apiTranscribeAudio(
              base64Audio,
              'audio/webm',
              langOption.name
            );

            setVoiceRecording({
              audioUrl: dataUrl,
              durationSeconds: recordingSeconds,
              transcription: transcriptionResult.transcription || 'I talked about my day!',
              detectedLanguage: transcriptionResult.detectedLanguage,
              createdAt: new Date().toISOString(),
            });

            // If write box is empty, offer speech text
            if (!writtenText.trim() && transcriptionResult.transcription) {
              setWrittenText(transcriptionResult.transcription);
            }
          } catch (err) {
            console.warn('Kids voice transcription fallback:', err);
            setVoiceRecording({
              audioUrl: dataUrl,
              durationSeconds: recordingSeconds,
              transcription: 'Voice recorded with love!',
              detectedLanguage: langOption.name,
              createdAt: new Date().toISOString(),
            });
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      // Optional browser speech recognition for live visual feedback
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = langOption.speechCode || 'en-US';

          recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript.trim() && !writtenText) {
              setWrittenText(transcript);
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {
          // Web speech recognition optional
        }
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMessage('Could not open microphone. Please allow microphone access or try typing!');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
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
    setIsRecording(false);
  };

  const toggleAudioPlayback = () => {
    if (!audioElementRef.current && voiceRecording?.audioUrl) {
      const audio = new Audio(voiceRecording.audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audioElementRef.current = audio;
    }

    if (isPlayingAudio) {
      audioElementRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current?.play();
      setIsPlayingAudio(true);
    }
  };

  // ----------------------------------------------------
  // PHOTO UPLOAD (ADD PHOTO)
  // ----------------------------------------------------
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // REFLECT WITH GEMINI (KIDS MODE)
  // ----------------------------------------------------
  const handleReflectWithGemini = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const hasAnyContent =
      writtenText.trim().length > 0 ||
      Boolean(voiceRecording?.transcription) ||
      Boolean(drawingDataUrl) ||
      Boolean(photoDataUrl);

    if (!hasAnyContent) {
      setErrorMessage('Please write, speak, draw, or add a photo first before asking Gemini!');
      return;
    }

    setIsReflecting(true);
    try {
      const imagesPayload: JournalImage[] = [];
      if (photoDataUrl) {
        imagesPayload.push({
          id: 'photo-' + Date.now(),
          dataUrl: photoDataUrl,
          name: 'My Photo',
        });
      }

      const res = await apiReflectDraft({
        title: 'My Day',
        content: writtenText,
        mood: selectedMood,
        language: selectedLanguage,
        voiceTranscription: voiceRecording?.transcription || '',
        images: imagesPayload,
        drawing: drawingDataUrl,
        isKidsMode: true,
      });

      setReflection(res.reflection);
      setSuccessMessage('Gemini shared a friendly reflection on your day! ✨');
    } catch (err: any) {
      console.error('Reflection error:', err);
      setErrorMessage(err.message || 'Unable to connect to Gemini. Please try again!');
    } finally {
      setIsReflecting(false);
    }
  };

  // ----------------------------------------------------
  // SAVE MY DAY ENTRY
  // ----------------------------------------------------
  const handleSaveEntry = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const hasAnyContent =
      writtenText.trim().length > 0 ||
      Boolean(voiceRecording) ||
      Boolean(drawingDataUrl) ||
      Boolean(photoDataUrl);

    if (!hasAnyContent) {
      setErrorMessage('Please add some drawing, words, voice, or a photo to save your day!');
      return;
    }

    setIsSaving(true);
    try {
      const imagesPayload: JournalImage[] = [];
      if (photoDataUrl) {
        imagesPayload.push({
          id: 'photo-' + Date.now(),
          dataUrl: photoDataUrl,
          name: 'My Photo',
          size: Math.round(photoDataUrl.length * 0.75),
        });
      }

      const { entry } = await apiCreateEntry({
        title: `My Day (${selectedMood})`,
        content: writtenText || (voiceRecording?.transcription ? `Voice: ${voiceRecording.transcription}` : 'A creative day!'),
        mood: selectedMood,
        language: selectedLanguage,
        mode: 'kids',
        drawing: drawingDataUrl,
        images: imagesPayload,
        voiceRecording: voiceRecording || null,
        is_draft: false,
        reflection: reflection || null,
      });

      setSuccessMessage('Hooray! Your day is saved to your private journal! 🌟');
      setTimeout(() => {
        onEntrySaved(entry);
      }, 900);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMessage(err.message || 'Could not save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="kids-my-day-page" className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-indigo-500/20 backdrop-blur-xl border-2 border-white/20 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
              <span>🌟 Kids Mode</span>
              <span>•</span>
              <span>{langOption.name}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>My Day</span>
              <span className="text-2xl sm:text-3xl animate-bounce">☀️</span>
            </h1>
            <p className="text-slate-200 text-sm sm:text-base mt-1 font-medium">
              Share what made you smile, draw a picture, or tell your story!
            </p>
          </div>

          {/* Language Selector Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-900/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 self-stretch sm:self-auto justify-between">
            <Globe className="w-4 h-4 text-indigo-400" />
            <select
              id="kids-language-picker"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-white text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div
          id="kids-error-alert"
          className="flex items-center space-x-3 p-4 rounded-2xl bg-rose-500/20 border-2 border-rose-500/40 text-rose-200 text-sm animate-shake"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          id="kids-success-alert"
          className="flex items-center space-x-3 p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-200 text-sm font-semibold"
        >
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Step 1: How are you feeling today? (Mood Selection) */}
      <div className="rounded-3xl p-5 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Smile className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-white">How are you feeling today?</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
          {KIDS_MOODS.map((m) => {
            const isSelected = selectedMood === m.value;
            return (
              <button
                key={m.value}
                id={`mood-btn-${m.value.toLowerCase()}`}
                type="button"
                onClick={() => setSelectedMood(m.value)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all transform active:scale-95 ${
                  isSelected
                    ? `${m.bgLight} ${m.border} scale-105 shadow-lg shadow-indigo-500/20 ring-2 ring-white`
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span className="text-3xl sm:text-4xl mb-1">{m.emoji}</span>
                <span className="text-xs sm:text-sm font-bold text-white">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Big Activity Buttons: Write, Speak, Draw, Take Photo, Add Photo */}
      <div className="rounded-3xl p-5 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Choose how to share your day:</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Write Button */}
          <button
            id="btn-option-write"
            type="button"
            onClick={() => setShowWriteBox(!showWriteBox)}
            className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-2 transition-all active:scale-95 ${
              showWriteBox
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/10'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md mb-2">
              <PenTool className="w-6 h-6" />
            </div>
            <span className="text-base font-bold text-white">Write ✏️</span>
            <span className="text-[11px] text-slate-400 text-center mt-0.5">Type your thoughts</span>
          </button>

          {/* 2. Speak Button */}
          <button
            id="btn-option-speak"
            type="button"
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-2 transition-all active:scale-95 ${
              isRecording
                ? 'bg-rose-500/30 border-rose-400 text-rose-200 animate-pulse ring-2 ring-rose-400 shadow-lg shadow-rose-500/20'
                : voiceRecording
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md mb-2 ${
                isRecording ? 'bg-rose-500 text-white animate-spin-slow' : 'bg-rose-400 text-slate-950'
              }`}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </div>
            <span className="text-base font-bold text-white">
              {isRecording ? `Stop (${recordingSeconds}s)` : 'Speak 🎙️'}
            </span>
            <span className="text-[11px] text-slate-400 text-center mt-0.5">
              {voiceRecording ? 'Voice ready' : 'Talk into mic'}
            </span>
          </button>

          {/* 3. Draw Button */}
          <button
            id="btn-option-draw"
            type="button"
            onClick={() => setShowDrawingModal(true)}
            className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-2 transition-all active:scale-95 ${
              drawingDataUrl
                ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-lg shadow-purple-500/10'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-400 text-slate-950 flex items-center justify-center shadow-md mb-2">
              <Palette className="w-6 h-6" />
            </div>
            <span className="text-base font-bold text-white">Draw 🎨</span>
            <span className="text-[11px] text-slate-400 text-center mt-0.5">
              {drawingDataUrl ? 'Drawing added!' : 'Paint on canvas'}
            </span>
          </button>

          {/* 4. Take Photo Button */}
          <button
            id="btn-option-take-photo"
            type="button"
            onClick={() => setShowCameraModal(true)}
            className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-2 transition-all active:scale-95 ${
              photoDataUrl
                ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-lg shadow-sky-500/10'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-400 text-slate-950 flex items-center justify-center shadow-md mb-2">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-base font-bold text-white">Take Photo 📷</span>
            <span className="text-[11px] text-slate-400 text-center mt-0.5">Use your camera</span>
          </button>

          {/* 5. Add Photo Button */}
          <button
            id="btn-option-add-photo"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-all active:scale-95 col-span-2 sm:col-span-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-400 text-slate-950 flex items-center justify-center shadow-md mb-2">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="text-base font-bold text-white">Add Photo 🖼️</span>
            <span className="text-[11px] text-slate-400 text-center mt-0.5">Upload picture</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
      </div>

      {/* Active Workspaces / Previews */}
      <div className="space-y-4">
        {/* Write Text Box */}
        {showWriteBox && (
          <div className="rounded-3xl p-5 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PenTool className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Tell us about your day</h3>
              </div>
              <span className="text-xs text-slate-400">What made you happy or what did you play?</span>
            </div>
            <textarea
              id="kids-written-content"
              rows={4}
              value={writtenText}
              onChange={(e) => setWrittenText(e.target.value)}
              placeholder="Today was fun! I played with my friends, built a tall lego tower, and ate yummy apples..."
              className="w-full bg-slate-950/60 border-2 border-white/10 focus:border-amber-400 rounded-2xl p-4 text-white text-base sm:text-lg placeholder:text-slate-500 focus:outline-none transition-colors resize-y leading-relaxed"
            />
          </div>
        )}

        {/* Voice Note Preview Card */}
        {voiceRecording && (
          <div className="rounded-3xl p-5 bg-gradient-to-r from-rose-500/15 to-pink-500/15 border-2 border-rose-400/30 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                id="btn-play-kids-voice"
                type="button"
                onClick={toggleAudioPlayback}
                className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                {isPlayingAudio ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Voice Note Recorded</span>
                  <span className="text-xs text-rose-300 font-normal">
                    ({voiceRecording.durationSeconds || 0}s)
                  </span>
                </h4>
                <p className="text-xs text-slate-300 line-clamp-1 italic mt-0.5">
                  "{voiceRecording.transcription}"
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-center">
              <button
                id="btn-remove-kids-voice"
                type="button"
                onClick={() => setVoiceRecording(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-white/10 transition-colors"
                title="Remove voice note"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Transcribing Indicator */}
        {isTranscribing && (
          <div className="flex items-center space-x-2 p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Listening carefully and converting your voice to words...</span>
          </div>
        )}

        {/* Drawing & Photo Gallery Previews */}
        {(drawingDataUrl || photoDataUrl) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Drawing Preview Card */}
            {drawingDataUrl && (
              <div className="rounded-3xl p-4 bg-slate-900/60 border-2 border-purple-400/40 backdrop-blur-xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-purple-200 flex items-center gap-1.5">
                    <Palette className="w-4 h-4" />
                    <span>Your Drawing 🎨</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      id="btn-redraw"
                      type="button"
                      onClick={() => setShowDrawingModal(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-purple-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      id="btn-remove-drawing"
                      type="button"
                      onClick={() => setDrawingDataUrl(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-300 transition-colors"
                      title="Remove drawing"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-white/20 shadow-inner flex items-center justify-center">
                  <img
                    src={drawingDataUrl}
                    alt="Your drawing"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Photo Preview Card */}
            {photoDataUrl && (
              <div className="rounded-3xl p-4 bg-slate-900/60 border-2 border-sky-400/40 backdrop-blur-xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-sky-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    <span>Your Photo 📸</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      id="btn-retake-photo"
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-sky-200 transition-colors"
                    >
                      Retake
                    </button>
                    <button
                      id="btn-remove-photo"
                      type="button"
                      onClick={() => setPhotoDataUrl(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-300 transition-colors"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-white/20 shadow-inner flex items-center justify-center">
                  <img
                    src={photoDataUrl}
                    alt="Your photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: GEMINI MULTIMODAL REFLECTION */}
      <div className="rounded-3xl p-6 bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900/60 backdrop-blur-xl border-2 border-indigo-400/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Ask Gemini AI</h3>
              <p className="text-xs text-indigo-200">
                Gemini looks at your drawings, photos, voice, and words to share a happy reflection!
              </p>
            </div>
          </div>

          <button
            id="btn-reflect-with-gemini"
            type="button"
            onClick={handleReflectWithGemini}
            disabled={isReflecting}
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-pink-400 active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
          >
            {isReflecting ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                <span>Thinking with Sparkles...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Reflect with Gemini ✨</span>
              </>
            )}
          </button>
        </div>

        {/* Display Gemini Reflection */}
        {reflection && (
          <div
            id="kids-gemini-reflection-box"
            className="mt-4 p-5 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 text-white space-y-3 animate-in fade-in zoom-in-95 duration-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <span>🌟 Friendly Reflection</span>
                <span>•</span>
                <span>In {langOption.name}</span>
              </span>
              <span className="text-xs text-indigo-300/80">AI Companion</span>
            </div>

            <p className="text-lg sm:text-xl font-medium text-indigo-100 leading-relaxed">
              "{reflection.personalReflection}"
            </p>

            {reflection.positiveObservations && reflection.positiveObservations.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {reflection.positiveObservations.map((obs, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-indigo-400/20 text-indigo-200 text-xs font-medium"
                  >
                    <span>🎉</span>
                    <span>{obs}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions: Save My Day Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
        <button
          id="btn-back-to-kids-dashboard"
          type="button"
          onClick={onNavigateToDashboard}
          className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
        >
          View Previous Days & Badges 🏆
        </button>

        <button
          id="btn-save-kids-day"
          type="button"
          onClick={handleSaveEntry}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center space-x-3 px-10 py-4 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-extrabold text-lg shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-cyan-400 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isSaving ? (
            <>
              <RotateCcw className="w-6 h-6 animate-spin" />
              <span>Saving to Journal...</span>
            </>
          ) : (
            <>
              <Save className="w-6 h-6" />
              <span>Save My Day! 🌟</span>
            </>
          )}
        </button>
      </div>

      {/* Drawing Modal */}
      {showDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <DrawingCanvas
            initialDrawing={drawingDataUrl}
            onSaveDrawing={(dataUrl) => {
              setDrawingDataUrl(dataUrl);
              setShowDrawingModal(false);
              setSuccessMessage('Drawing saved to your day! 🎨');
            }}
            onCancel={() => setShowDrawingModal(false)}
          />
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={(dataUrl) => {
          setPhotoDataUrl(dataUrl);
          setSuccessMessage('Photo captured successfully! 📸');
        }}
      />
    </div>
  );
};

import express, { Request, Response } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  generateMultimodalReflection,
  translateJournalEntry,
  transcribeVoiceAudio,
  generateSynthesizedInsights,
} from './server/gemini';
import type { MoodType } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// Support larger payloads for multimodal image & audio base64 uploads
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Personal Gemini Journal',
    auth: 'Firebase Authentication',
    database: 'Cloud Firestore',
    multimodal: true,
    multilingual: true,
  });
});

// Middleware to check authentication header
function requireAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Firebase authentication token required.' });
    return;
  }
  next();
}

// ==========================================
// GEMINI MULTIMODAL REFLECTION (SERVER-SIDE)
// ==========================================
app.post('/api/reflect', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, content, mood, language, languageName, voiceTranscription, images } = req.body;

    if ((!content || typeof content !== 'string' || content.trim().length < 3) && (!voiceTranscription || voiceTranscription.trim().length < 3)) {
      res.status(400).json({ error: 'Please provide either journal text or a voice transcription before requesting an AI reflection.' });
      return;
    }

    const validMoods: MoodType[] = ['Happy', 'Calm', 'Excited', 'Sad', 'Angry', 'Anxious', 'Tired'];
    const selectedMood: MoodType = validMoods.includes(mood) ? mood : 'Calm';

    const reflection = await generateMultimodalReflection({
      title: title || 'Untitled',
      content: content || '',
      mood: selectedMood,
      language: language || 'en',
      languageName: languageName || 'English',
      voiceTranscription: voiceTranscription || '',
      images: Array.isArray(images) ? images : [],
    });

    res.json({ reflection });
  } catch (err: any) {
    console.error('Reflection route error:', err);
    res.status(500).json({ error: 'Unable to generate reflection at this time. Please try again.' });
  }
});

// ==========================================
// GEMINI ENTRY TRANSLATION
// ==========================================
app.post('/api/translate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, content, targetLanguage, targetLanguageName } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Entry content is required for translation.' });
      return;
    }

    const result = await translateJournalEntry(
      title || '',
      content,
      targetLanguage || 'en',
      targetLanguageName || 'English'
    );

    res.json(result);
  } catch (err: any) {
    console.error('Translation route error:', err);
    res.status(500).json({ error: 'Translation failed. Please try again.' });
  }
});

// ==========================================
// GEMINI AUDIO TRANSCRIPTION & LANGUAGE DETECTION
// ==========================================
app.post('/api/transcribe-audio', requireAuth, async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType, preferredLanguage } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      res.status(400).json({ error: 'Audio data is required for transcription.' });
      return;
    }

    const result = await transcribeVoiceAudio(
      audioBase64,
      mimeType || 'audio/webm',
      preferredLanguage
    );

    res.json(result);
  } catch (err: any) {
    console.error('Audio transcription error:', err);
    res.status(500).json({ error: 'Audio transcription failed. Please try again.' });
  }
});

// ==========================================
// ADVANCED SYNTHESIZED INSIGHTS
// ==========================================
app.post('/api/insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const { entries, timeframe, languageName } = req.body;

    const insights = await generateSynthesizedInsights(
      Array.isArray(entries) ? entries : [],
      timeframe === 'monthly' ? 'monthly' : 'weekly',
      languageName || 'English'
    );

    res.json({ insights });
  } catch (err: any) {
    console.error('Insights route error:', err);
    res.status(500).json({ error: 'Failed to generate insights.' });
  }
});

// ==========================================
// VITE SPA MIDDLEWARE / PRODUCTION SERVING
// ==========================================
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Gemini Journal server running on http://0.0.0.0:${PORT}`);
  });
}

start();

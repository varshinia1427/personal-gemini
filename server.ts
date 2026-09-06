import express, { Request, Response } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { generateReflection } from './server/gemini';
import type { MoodType } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Personal Gemini Journal',
    auth: 'Firebase Authentication',
    database: 'Cloud Firestore',
  });
});

// ==========================================
// GEMINI AI REFLECTION ROUTE (SERVER-SIDE PROXY)
// ==========================================
app.post('/api/reflect', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Firebase authentication token required.' });
      return;
    }

    const { title, content, mood } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length < 5) {
      res.status(400).json({ error: 'Please write a few sentences before requesting an AI reflection.' });
      return;
    }

    const validMoods: MoodType[] = ['Happy', 'Calm', 'Excited', 'Sad', 'Angry', 'Anxious', 'Tired'];
    const selectedMood: MoodType = validMoods.includes(mood) ? mood : 'Calm';

    const reflection = await generateReflection(title || 'Untitled', content, selectedMood);
    res.json({ reflection });
  } catch (err: any) {
    console.error('Reflection route error:', err);
    res.status(500).json({ error: 'Unable to generate reflection at this time. Please try again.' });
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

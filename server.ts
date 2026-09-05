import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, verifyPassword } from './server/db';
import { generateReflection } from './server/gemini';
import type { MoodType, User } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Extend Request to include authenticated user
interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

// Authentication Middleware
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = db.getUserBySessionToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return;
  }

  req.user = user;
  req.token = token;
  next();
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Sign Up
app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const newUser = db.createUser(email, password, name);
    const token = db.createSession(newUser.id);

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        created_at: newUser.created_at,
      },
      token,
      message: 'Account created successfully.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = db.createSession(user.id);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      token,
      message: 'Welcome back!',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
});

// Demo Account Instant Access
app.post('/api/auth/demo-login', (_req: Request, res: Response) => {
  try {
    const demoUser = db.findUserByEmail('demo@journal.internal');
    if (!demoUser) {
      res.status(404).json({ error: 'Demo user not available.' });
      return;
    }
    const token = db.createSession(demoUser.id);
    res.json({
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        created_at: demoUser.created_at,
      },
      token,
      message: 'Logged in as Demo User.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to authenticate demo user.' });
  }
});

// Current User Info
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.token) {
    db.deleteSession(req.token);
  }
  res.json({ message: 'Logged out successfully.' });
});

// Update Password
app.post('/api/auth/update-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const userRecord = db.findUserById(req.user!.id);
    if (!userRecord) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isValid = verifyPassword(currentPassword, userRecord.password_hash, userRecord.salt);
    if (!isValid) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    db.updateUserPassword(req.user!.id, newPassword);
    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// Clear All User Entries (Privacy action)
app.post('/api/auth/clear-data', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const deletedCount = db.clearAllEntriesForUser(req.user!.id);
    res.json({ message: `Successfully deleted ${deletedCount} entries from your private journal.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear journal entries.' });
  }
});

// ==========================================
// JOURNAL ENTRIES ROUTES (STRICT USER ISOLATION)
// ==========================================

// Get all entries for authenticated user
app.get('/api/entries', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const entries = db.getEntries(req.user!.id);
    const { search, mood, isDraft } = req.query;

    let filtered = entries;

    if (mood && typeof mood === 'string' && mood !== 'ALL') {
      filtered = filtered.filter(e => e.mood.toLowerCase() === mood.toLowerCase());
    }

    if (isDraft !== undefined) {
      const draftBool = isDraft === 'true';
      filtered = filtered.filter(e => e.is_draft === draftBool);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        e => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
      );
    }

    res.json({ entries: filtered });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch journal entries.' });
  }
});

// Get a single entry (Validates ownership)
app.get('/api/entries/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = db.getEntryById(req.params.id, req.user!.id);
    if (!entry) {
      res.status(404).json({ error: 'Journal entry not found or unauthorized.' });
      return;
    }
    res.json({ entry });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch entry.' });
  }
});

// Create new entry
app.post('/api/entries', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, mood, is_draft, created_at, reflection } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Journal content cannot be empty.' });
      return;
    }

    const validMoods: MoodType[] = ['Happy', 'Calm', 'Excited', 'Sad', 'Angry', 'Anxious', 'Tired'];
    const selectedMood = validMoods.includes(mood) ? mood : 'Calm';

    const newEntry = db.createEntry(req.user!.id, {
      title: title || 'Untitled Entry',
      content,
      mood: selectedMood,
      is_draft: Boolean(is_draft),
      created_at,
      reflection,
    });

    res.status(201).json({
      entry: newEntry,
      message: is_draft ? 'Draft saved successfully.' : 'Journal entry saved securely.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save journal entry.' });
  }
});

// Update existing entry (Validates ownership)
app.put('/api/entries/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, mood, is_draft, created_at, reflection } = req.body;

    const updated = db.updateEntry(req.params.id, req.user!.id, {
      title,
      content,
      mood,
      is_draft,
      created_at,
      reflection,
    });

    if (!updated) {
      res.status(404).json({ error: 'Journal entry not found or you do not have permission to modify it.' });
      return;
    }

    res.json({
      entry: updated,
      message: 'Journal entry updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update journal entry.' });
  }
});

// Delete entry (Validates ownership)
app.delete('/api/entries/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = db.deleteEntry(req.params.id, req.user!.id);
    if (!success) {
      res.status(404).json({ error: 'Entry not found or unauthorized.' });
      return;
    }
    res.json({ message: 'Journal entry deleted permanently.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete entry.' });
  }
});

// ==========================================
// GEMINI AI REFLECTION ROUTES (AUTHENTICATED)
// ==========================================

// Reflect on draft/unsaved text in editor
app.post('/api/reflect', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, mood } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length < 5) {
      res.status(400).json({ error: 'Please write a few sentences before requesting an AI reflection.' });
      return;
    }

    const reflection = await generateReflection(title || 'Untitled', content, mood || 'Calm');
    res.json({ reflection });
  } catch (err: any) {
    console.error('Reflection route error:', err);
    res.status(500).json({ error: 'Unable to generate reflection at this time. Please try again.' });
  }
});

// Reflect on a specific saved entry and persist reflection
app.post('/api/entries/:id/reflect', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = db.getEntryById(req.params.id, req.user!.id);
    if (!entry) {
      res.status(404).json({ error: 'Entry not found or unauthorized.' });
      return;
    }

    const reflection = await generateReflection(entry.title, entry.content, entry.mood);
    const updated = db.updateEntry(entry.id, req.user!.id, { reflection });

    res.json({
      reflection,
      entry: updated,
      message: 'Gemini AI reflection generated and saved.',
    });
  } catch (err: any) {
    console.error('Entry reflection error:', err);
    res.status(500).json({ error: 'Unable to reflect on entry. Please try again.' });
  }
});

// ==========================================
// USER DASHBOARD STATISTICS
// ==========================================
app.get('/api/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const entries = db.getEntries(req.user!.id);
    const totalEntries = entries.length;

    // Today's entries
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter(e => e.created_at.startsWith(today)).length;
    const draftEntries = entries.filter(e => e.is_draft).length;

    // Mood counts
    const moodCounts: Record<MoodType, number> = {
      Happy: 0,
      Calm: 0,
      Excited: 0,
      Sad: 0,
      Angry: 0,
      Anxious: 0,
      Tired: 0,
    };

    for (const e of entries) {
      if (moodCounts[e.mood] !== undefined) {
        moodCounts[e.mood]++;
      }
    }

    // Dominant mood
    let dominantMood: MoodType | null = null;
    let maxCount = 0;
    for (const [m, count] of Object.entries(moodCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = m as MoodType;
      }
    }

    // Streak calculation (days with consecutive entries)
    const uniqueDays = Array.from(
      new Set(entries.map(e => e.created_at.split('T')[0]))
    ).sort().reverse();

    let streakDays = 0;
    if (uniqueDays.length > 0) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

      // If user wrote today or yesterday, count streak
      if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterday) {
        streakDays = 1;
        let prevDate = new Date(uniqueDays[0]);
        for (let i = 1; i < uniqueDays.length; i++) {
          const currDate = new Date(uniqueDays[i]);
          const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
          if (diffDays === 1) {
            streakDays++;
            prevDate = currDate;
          } else {
            break;
          }
        }
      }
    }

    res.json({
      totalEntries,
      todayEntries,
      draftEntries,
      moodCounts,
      dominantMood,
      streakDays,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate stats.' });
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

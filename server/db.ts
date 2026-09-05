import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { JournalEntry, MoodType, ReflectionData, User } from '../src/types';

export interface UserRecord extends User {
  password_hash: string;
  salt: string;
}

export interface SessionRecord {
  token: string;
  user_id: string;
  created_at: number;
  expires_at: number;
}

interface DatabaseSchema {
  users: UserRecord[];
  entries: JournalEntry[];
  sessions: SessionRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'journal-db.json');

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return check === hash;
}

const DEMO_USER_ID = 'user-demo-ideathon-001';
const demoPass = hashPassword('demo1234', 'fixed-demo-salt-12345');

const INITIAL_DEMO_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-demo-1',
    user_id: DEMO_USER_ID,
    title: 'Morning reflections on creative flow and calm focus',
    content: `Woke up early around 6:30 AM before the city started buzzing. Made a warm cup of jasmine green tea and sat on the balcony watching the sunrise paint soft amber streaks across the clouds.\n\nLately I've been thinking about how often I rush into tasks without taking a single breath to ground myself. Today I made a deliberate choice to silence notifications for the first two hours. The stillness allowed me to finish the conceptual blueprint for our community project with surprising clarity. I noticed my breathing was deeper and I didn't feel that usual tightness in my shoulders.\n\nGrateful for the quiet morning, clear intentions, and the gentle pace today started with.`,
    mood: 'Calm',
    is_draft: false,
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    reflection: {
      summary: 'A peaceful start to the day focused on mindful intention, setting boundaries with technology, and enjoying the clarity that deliberate stillness provides.',
      detectedMood: 'Calm & Grounded',
      keyThemes: ['Mindful Morning Routine', 'Digital Boundaries', 'Creative Focus', 'Gratitude'],
      positiveObservations: [
        'Proactively silenced notifications to protect your creative energy.',
        'Acknowledged physical markers of stress relief (deeper breathing, relaxed shoulders).',
        'Recognized how conscious pacing enhances your quality of thought.'
      ],
      reflectionQuestions: [
        'How might you bring a 5-minute micro-pause of this morning stillness into the middle of your afternoon?',
        'What conditions made it easy to choose quiet over immediate busyness today?'
      ],
      gentleSuggestions: [
        'Consider establishing a soft evening shutdown ritual to preserve this morning momentum tomorrow.',
        'Document one key decision made during this quiet window to celebrate its impact.'
      ],
      createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      modelUsed: 'gemini-3.8-flash'
    }
  },
  {
    id: 'entry-demo-2',
    user_id: DEMO_USER_ID,
    title: 'Breakthrough team presentation & product release',
    content: `What an exhilarating afternoon! We just wrapped up our presentation to the cross-functional leadership team. Six weeks of prototyping, late debugging sessions, and endless user feedback iterations came together seamlessly.\n\nWhen we demoed the AI-powered journaling privacy architecture, seeing the audience nod in genuine appreciation was deeply rewarding. Our lead engineer Maya smiled at me from across the table—that silent acknowledgment meant everything.\n\nI still have adrenaline rushing through my veins. Celebrating tonight with pizza and a long evening walk.`,
    mood: 'Excited',
    is_draft: false,
    created_at: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
    reflection: {
      summary: 'A triumphant milestone where weeks of diligent preparation culminated in a shared victory with your team.',
      detectedMood: 'Excited & Accomplished',
      keyThemes: ['Milestone Celebration', 'Team Synergy', 'Validation of Hard Work'],
      positiveObservations: [
        'Deep appreciation for collective effort, spotlighting your teammate Maya.',
        'Healthy recognition of personal pride in building a secure and thoughtful architecture.'
      ],
      reflectionQuestions: [
        'Looking back at the past six weeks, what was the most valuable lesson you learned about perseverance?',
        'How can you anchor this feeling of shared accomplishment to carry forward into future challenges?'
      ],
      gentleSuggestions: [
        'Take time to send a brief personal thank-you note to your teammates while the momentum is fresh.',
        'Allow yourself to fully disconnect and soak in the celebration tonight.'
      ],
      createdAt: new Date(Date.now() - 3600 * 1000 * 27).toISOString(),
      modelUsed: 'gemini-3.8-flash'
    }
  },
  {
    id: 'entry-demo-3',
    user_id: DEMO_USER_ID,
    title: 'Navigating mid-week overwhelm and finding balance',
    content: `Feeling a bit drained today. There were too many competing deadlines hitting at once, and my inbox felt relentless. By 3 PM my concentration was slipping and I felt a brief wave of anxiety about everything still left on my plate.\n\nInstead of forcing myself to keep staring at the screen, I stepped away for a 15-minute walk around the block without my phone. The cool air helped reset my perspective. I reorganized my to-do list into just two essential items for tomorrow and let go of the rest.\n\nLearning that productivity isn't about exhausting myself every single day. Rest is part of the work too.`,
    mood: 'Anxious',
    is_draft: false,
    created_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    reflection: {
      summary: 'Honest vulnerability regarding mid-week cognitive overload paired with healthy self-compassion and boundary setting.',
      detectedMood: 'Reflective & Self-Aware',
      keyThemes: ['Overwhelm Management', 'Intentional Rest', 'Prioritization'],
      positiveObservations: [
        'Recognized your body’s signals and stepped away instead of pushing into burnout.',
        'Wisely triaged your priorities down to two critical items rather than drowning in artificial urgency.'
      ],
      reflectionQuestions: [
        'What is one boundary you can put in place to prevent inbox demands from hijacking your focus?',
        'How does acknowledging "rest is part of the work" change how you view tomorrow morning?'
      ],
      gentleSuggestions: [
        'Plan a gentle wind-down routine with minimal screen time before bed tonight.',
        'Keep tomorrow’s morning focus strictly on your top priority before checking inbound communications.'
      ],
      createdAt: new Date(Date.now() - 3600 * 1000 * 71).toISOString(),
      modelUsed: 'gemini-3.8-flash'
    }
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      entries: [],
      sessions: [],
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        // Seed default demo data
        this.seedInitialData();
        this.save();
      }

      // Ensure demo user exists
      const hasDemoUser = this.data.users.some(u => u.id === DEMO_USER_ID);
      if (!hasDemoUser) {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Failed to initialize database, using fresh memory copy:', err);
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    const demoUser: UserRecord = {
      id: DEMO_USER_ID,
      email: 'demo@journal.internal',
      name: 'Ideathon Demo User',
      password_hash: demoPass.hash,
      salt: demoPass.salt,
      created_at: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
    };

    // Keep existing entries if any, or seed initial demo entries
    if (!this.data.users.some(u => u.id === DEMO_USER_ID)) {
      this.data.users.push(demoUser);
    }

    // Add demo entries if user has none
    const userEntries = this.data.entries.filter(e => e.user_id === DEMO_USER_ID);
    if (userEntries.length === 0) {
      this.data.entries.push(...INITIAL_DEMO_ENTRIES);
    }
  }

  private save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // --- Auth & Users ---
  public findUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findUserById(id: string): UserRecord | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(email: string, passwordPlain: string, name?: string): UserRecord {
    const existing = this.findUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const { hash, salt } = hashPassword(passwordPlain);
    const newUser: UserRecord = {
      id: `user-${crypto.randomUUID()}`,
      email: email.trim().toLowerCase(),
      name: name?.trim() || email.split('@')[0],
      password_hash: hash,
      salt,
      created_at: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUserPassword(userId: string, newPasswordPlain: string): void {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found');
    const { hash, salt } = hashPassword(newPasswordPlain);
    user.password_hash = hash;
    user.salt = salt;
    this.save();
  }

  // --- Sessions ---
  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: SessionRecord = {
      token,
      user_id: userId,
      created_at: now,
      expires_at: now + 1000 * 60 * 60 * 24 * 30, // 30 days
    };
    this.data.sessions.push(session);
    this.save();
    return token;
  }

  public getUserBySessionToken(token: string): User | null {
    if (!token) return null;
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return null;

    if (Date.now() > session.expires_at) {
      this.deleteSession(token);
      return null;
    }

    const user = this.findUserById(session.user_id);
    if (!user) return null;

    // Return safe user object (without password_hash and salt)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
    };
  }

  public deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }

  // --- Journal Entries (Strictly isolated by user_id) ---
  public getEntries(userId: string): JournalEntry[] {
    return this.data.entries
      .filter(e => e.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getEntryById(entryId: string, userId: string): JournalEntry | null {
    const entry = this.data.entries.find(e => e.id === entryId);
    if (!entry) return null;
    // Strictly verify ownership - unauthorized users cannot see another user's entry
    if (entry.user_id !== userId) return null;
    return entry;
  }

  public createEntry(
    userId: string,
    entryData: {
      title: string;
      content: string;
      mood: MoodType;
      is_draft?: boolean;
      created_at?: string;
      reflection?: ReflectionData | null;
    }
  ): JournalEntry {
    const now = new Date().toISOString();
    const newEntry: JournalEntry = {
      id: `entry-${crypto.randomUUID()}`,
      user_id: userId,
      title: entryData.title.trim() || 'Untitled Reflection',
      content: entryData.content.trim(),
      mood: entryData.mood,
      is_draft: Boolean(entryData.is_draft),
      reflection: entryData.reflection || null,
      created_at: entryData.created_at || now,
      updated_at: now,
    };

    this.data.entries.unshift(newEntry);
    this.save();
    return newEntry;
  }

  public updateEntry(
    entryId: string,
    userId: string,
    updateData: Partial<Pick<JournalEntry, 'title' | 'content' | 'mood' | 'is_draft' | 'reflection' | 'created_at'>>
  ): JournalEntry | null {
    const entry = this.getEntryById(entryId, userId);
    if (!entry) return null;

    if (updateData.title !== undefined) entry.title = updateData.title.trim() || 'Untitled Reflection';
    if (updateData.content !== undefined) entry.content = updateData.content.trim();
    if (updateData.mood !== undefined) entry.mood = updateData.mood;
    if (updateData.is_draft !== undefined) entry.is_draft = updateData.is_draft;
    if (updateData.created_at !== undefined) entry.created_at = updateData.created_at;
    if (updateData.reflection !== undefined) entry.reflection = updateData.reflection;

    entry.updated_at = new Date().toISOString();
    this.save();
    return entry;
  }

  public deleteEntry(entryId: string, userId: string): boolean {
    const index = this.data.entries.findIndex(e => e.id === entryId && e.user_id === userId);
    if (index === -1) return false;
    this.data.entries.splice(index, 1);
    this.save();
    return true;
  }

  // Clear or reset user entries (privacy feature)
  public clearAllEntriesForUser(userId: string): number {
    const beforeCount = this.data.entries.length;
    this.data.entries = this.data.entries.filter(e => e.user_id !== userId);
    const removed = beforeCount - this.data.entries.length;
    this.save();
    return removed;
  }
}

export const db = new Database();

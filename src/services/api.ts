import type { DashboardStats, JournalEntry, MoodType, ReflectionData, User } from '../types';

const TOKEN_STORAGE_KEY = 'gemini_journal_session_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// Auth API
export async function apiSignup(email: string, passwordPlain: string, name?: string): Promise<{ user: User; token: string; message: string }> {
  const res = await request<{ user: User; token: string; message: string }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password: passwordPlain, name }),
  });
  setStoredToken(res.token);
  return res;
}

export async function apiLogin(email: string, passwordPlain: string): Promise<{ user: User; token: string; message: string }> {
  const res = await request<{ user: User; token: string; message: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: passwordPlain }),
  });
  setStoredToken(res.token);
  return res;
}

export async function apiDemoLogin(): Promise<{ user: User; token: string; message: string }> {
  const res = await request<{ user: User; token: string; message: string }>('/api/auth/demo-login', {
    method: 'POST',
  });
  setStoredToken(res.token);
  return res;
}

export async function apiGetMe(): Promise<{ user: User }> {
  return request<{ user: User }>('/api/auth/me');
}

export async function apiLogout(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    removeStoredToken();
  }
}

export async function apiUpdatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/update-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function apiClearUserData(): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/clear-data', {
    method: 'POST',
  });
}

// Journal API
export async function apiGetEntries(params?: { search?: string; mood?: string; isDraft?: boolean }): Promise<{ entries: JournalEntry[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.mood) query.set('mood', params.mood);
  if (params?.isDraft !== undefined) query.set('isDraft', String(params.isDraft));

  const qs = query.toString();
  return request<{ entries: JournalEntry[] }>(`/api/entries${qs ? `?${qs}` : ''}`);
}

export async function apiGetEntryById(id: string): Promise<{ entry: JournalEntry }> {
  return request<{ entry: JournalEntry }>(`/api/entries/${id}`);
}

export async function apiCreateEntry(data: {
  title: string;
  content: string;
  mood: MoodType;
  is_draft?: boolean;
  created_at?: string;
  reflection?: ReflectionData | null;
}): Promise<{ entry: JournalEntry; message: string }> {
  return request<{ entry: JournalEntry; message: string }>('/api/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateEntry(
  id: string,
  data: Partial<Pick<JournalEntry, 'title' | 'content' | 'mood' | 'is_draft' | 'created_at' | 'reflection'>>
): Promise<{ entry: JournalEntry; message: string }> {
  return request<{ entry: JournalEntry; message: string }>(`/api/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteEntry(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/entries/${id}`, {
    method: 'DELETE',
  });
}

// Reflection API
export async function apiReflectDraft(title: string, content: string, mood: MoodType): Promise<{ reflection: ReflectionData }> {
  return request<{ reflection: ReflectionData }>('/api/reflect', {
    method: 'POST',
    body: JSON.stringify({ title, content, mood }),
  });
}

export async function apiReflectSavedEntry(entryId: string): Promise<{ reflection: ReflectionData; entry: JournalEntry; message: string }> {
  return request<{ reflection: ReflectionData; entry: JournalEntry; message: string }>(`/api/entries/${entryId}/reflect`, {
    method: 'POST',
  });
}

// Stats API
export async function apiGetStats(): Promise<DashboardStats> {
  return request<DashboardStats>('/api/stats');
}

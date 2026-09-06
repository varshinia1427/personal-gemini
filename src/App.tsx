import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { apiLogout } from './services/api';
import { subscribeToAuth } from './services/firebase';
import { Sidebar, NavTab } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { NewJournalEntry } from './components/NewJournalEntry';
import { MyJournal } from './components/MyJournal';
import { EntryDetailModal } from './components/EntryDetailModal';
import { ProfileSettings } from './components/ProfileSettings';
import { KidsMyDay } from './components/kids/KidsMyDay';
import { KidsDashboard } from './components/kids/KidsDashboard';
import type { JournalEntry, User, JournalAppMode } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [appMode, setAppMode] = useState<JournalAppMode>('personal');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active viewing/editing modals
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Global toast notice
  const [globalNotice, setGlobalNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setGlobalNotice({ text, type });
    setTimeout(() => setGlobalNotice(null), 3500);
  };

  const handleModeChange = (newMode: JournalAppMode) => {
    setAppMode(newMode);
    if (newMode === 'kids') {
      setCurrentTab('kids-my-day');
      showToast('Switched to Kids Mode! 🎨🌟', 'info');
    } else {
      setCurrentTab('dashboard');
      showToast('Switched to Personal Journal Mode. 🧘', 'info');
    }
  };

  // Real Firebase Auth listener
  useEffect(() => {
    const unsubscribe = subscribeToAuth((authUser) => {
      setUser(authUser);
      setIsLoadingAuth(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setCurrentTab('dashboard');
    showToast(`Welcome back, ${authenticatedUser.name || 'Friend'}!`, 'success');
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setCurrentTab('dashboard');
      showToast('Logged out securely.', 'info');
    }
  };

  const handleEntrySaved = (_savedEntry: JournalEntry) => {
    setEditingEntry(null);
    showToast('Journal entry saved securely to Firestore.', 'success');
    setCurrentTab('my-journal');
  };

  const handleStartEdit = (entry: JournalEntry) => {
    setViewingEntry(null);
    setEditingEntry(entry);
    setCurrentTab('new-entry');
  };

  // Loading splash with frosted glass styling
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 bg-slate-900/40 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-teal-400 text-slate-900 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-medium text-white text-base">Personal Gemini Journal</h1>
            <p className="text-xs text-slate-400 font-light mt-1">Connecting to Firebase Authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Landing / Authentication Page
  if (!user) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen text-slate-100 flex ${appMode === 'kids' ? 'bg-radial-kids' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'new-entry' && currentTab !== 'new-entry') {
            setEditingEntry(null); // fresh new entry
          }
          setCurrentTab(tab);
        }}
        user={user}
        onLogout={handleLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        mode={appMode}
        onToggleMode={handleModeChange}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-20 bg-slate-900/70 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              id="open-mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${
                appMode === 'kids'
                  ? 'bg-gradient-to-br from-amber-400 via-pink-400 to-indigo-400 text-slate-950 font-black'
                  : 'bg-gradient-to-br from-indigo-400 to-teal-400 text-slate-900'
              }`}>
                {appMode === 'kids' ? <span>🌟</span> : <Sparkles className="w-4 h-4" />}
              </div>
              <span className="font-semibold text-white text-sm truncate">
                {appMode === 'kids' ? 'Kids Journal' : 'Gemini Journal'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="mobile-mode-switcher"
              type="button"
              onClick={() => handleModeChange(appMode === 'kids' ? 'personal' : 'kids')}
              className={`text-2xs font-bold px-2.5 py-1 rounded-full border shadow-sm flex items-center gap-1 transition-all ${
                appMode === 'kids'
                  ? 'bg-amber-400/20 text-amber-200 border-amber-300/40'
                  : 'bg-white/10 text-indigo-300 border-white/15'
              }`}
            >
              <span>{appMode === 'kids' ? '🌟 Kids' : '🧘 Personal'}</span>
            </button>
            <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full bg-white/5 text-teal-300 border border-white/10 backdrop-blur-md">
              <Lock className="w-3 h-3 text-teal-400" />
            </span>
          </div>
        </header>

        {/* Global Floating Toast */}
        {globalNotice && (
          <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="px-5 py-3.5 rounded-2xl bg-slate-900/90 text-white text-xs sm:text-sm font-medium shadow-2xl flex items-center gap-3 border border-white/15 backdrop-blur-2xl">
              {globalNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{globalNotice.text}</span>
            </div>
          </div>
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Kids Mode Views */}
          {currentTab === 'kids-my-day' && (
            <KidsMyDay
              onEntrySaved={(_entry) => {
                showToast('Hooray! Saved your day to your journal! 🌟', 'success');
                setCurrentTab('kids-dashboard');
              }}
              onNavigateToDashboard={() => setCurrentTab('kids-dashboard')}
            />
          )}

          {currentTab === 'kids-dashboard' && (
            <KidsDashboard
              onNewDayClick={() => setCurrentTab('kids-my-day')}
            />
          )}

          {/* Personal Journal Views */}
          {currentTab === 'dashboard' && (
            <Dashboard
              user={user}
              onNavigateNewEntry={() => {
                setEditingEntry(null);
                setCurrentTab('new-entry');
              }}
              onNavigateMyJournal={() => setCurrentTab('my-journal')}
              onSelectEntry={(entry) => setViewingEntry(entry)}
            />
          )}

          {currentTab === 'new-entry' && (
            <NewJournalEntry
              initialEntry={editingEntry}
              onEntrySaved={handleEntrySaved}
              onCancel={() => {
                setEditingEntry(null);
                setCurrentTab('dashboard');
              }}
            />
          )}

          {currentTab === 'my-journal' && (
            <MyJournal
              onNavigateNewEntry={() => {
                setEditingEntry(null);
                setCurrentTab('new-entry');
              }}
              onViewEntry={(entry) => setViewingEntry(entry)}
              onEditEntry={handleStartEdit}
            />
          )}

          {currentTab === 'settings' && (
            <ProfileSettings
              user={user}
              onLogout={handleLogout}
              onEntriesCleared={() => {
                showToast('All journal entries have been cleared from Firestore.', 'info');
              }}
            />
          )}
        </main>
      </div>

      {/* Entry Detail & Reflection Modal */}
      {viewingEntry && (
        <EntryDetailModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onEdit={handleStartEdit}
          onDelete={(_entry) => {
            setViewingEntry(null);
            setCurrentTab('my-journal');
          }}
          onEntryUpdated={(updated) => {
            setViewingEntry(updated);
          }}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { apiGetMe, apiLogout, getStoredToken } from './services/api';
import { Sidebar, NavTab } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { NewJournalEntry } from './components/NewJournalEntry';
import { MyJournal } from './components/MyJournal';
import { EntryDetailModal } from './components/EntryDetailModal';
import { ProfileSettings } from './components/ProfileSettings';
import type { JournalEntry, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
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

  // Check auth session on startup
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        const res = await apiGetMe();
        setUser(res.user);
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        setUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
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

  const handleEntrySaved = (savedEntry: JournalEntry) => {
    setEditingEntry(null);
    showToast('Journal entry saved securely.', 'success');
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
            <p className="text-xs text-slate-400 font-light mt-1">Verifying private encryption session...</p>
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
    <div className="min-h-screen text-slate-100 flex">
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
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-20 bg-slate-900/60 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between">
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-teal-400 text-slate-900 flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-medium text-white text-sm truncate">
                Personal Gemini Journal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-teal-300 border border-white/15 backdrop-blur-md">
              <Lock className="w-3 h-3 text-teal-400" />
              <span>Private</span>
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
                showToast('All journal entries have been cleared.', 'info');
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
          onDelete={(entry) => {
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

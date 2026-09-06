import React from 'react';
import { 
  LayoutDashboard, 
  PenLine, 
  BookOpen, 
  User, 
  LogOut, 
  Sparkles, 
  X,
  Sun,
  Award,
  Palette
} from 'lucide-react';
import type { User as UserType, JournalAppMode } from '../types';

export type NavTab = 'dashboard' | 'new-entry' | 'my-journal' | 'settings' | 'kids-my-day' | 'kids-dashboard';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserType | null;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  mode: JournalAppMode;
  onToggleMode: (mode: JournalAppMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  mode,
  onToggleMode,
}) => {
  const personalNavItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-entry', label: 'New Entry', icon: PenLine, badge: '+ New' },
    { id: 'my-journal', label: 'My Journal', icon: BookOpen },
    { id: 'settings', label: 'Profile & Settings', icon: User },
  ];

  const kidsNavItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'kids-my-day', label: 'My Day', icon: Sun, badge: '☀️ Start' },
    { id: 'kids-dashboard', label: 'Badges & Memories', icon: Award },
    { id: 'settings', label: 'Settings', icon: User },
  ];

  const navItems = mode === 'kids' ? kidsNavItems : personalNavItems;

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border-r border-white/10 text-slate-100">
      {/* App Branding */}
      <div className="p-6 sm:p-8 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shrink-0 ${
              mode === 'kids'
                ? 'bg-gradient-to-br from-amber-400 via-pink-400 to-indigo-400 text-slate-950 font-black'
                : 'bg-gradient-to-br from-indigo-400 to-teal-400 text-slate-900 font-bold'
            }`}>
              <span className="text-lg">{mode === 'kids' ? '🌟' : 'G'}</span>
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white leading-tight">
                {mode === 'kids' ? 'Kids Journal' : 'Gemini Journal'}
              </h1>
              <p className="text-2xs text-teal-400 font-medium">
                {mode === 'kids' ? 'Fun Day & Memories' : 'AI Reflection Studio'}
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            id="mobile-close-sidebar-btn"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-4 italic font-light leading-relaxed">
          {mode === 'kids'
            ? '"Draw, talk, snap pictures, and celebrate your day!"'
            : '"Your thoughts. Your journal. Your AI reflection — privately."'}
        </p>
      </div>

      {/* Mode Switcher Toggle */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-slate-950/60 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1.5 shadow-inner">
          <button
            id="sidebar-mode-personal"
            type="button"
            onClick={() => onToggleMode('personal')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'personal'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🧘</span>
            <span>Personal</span>
          </button>
          <button
            id="sidebar-mode-kids"
            type="button"
            onClick={() => onToggleMode('kids')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'kids'
                ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-white/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌟</span>
            <span>Kids Mode</span>
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? mode === 'kids'
                    ? 'bg-gradient-to-r from-amber-400/20 to-pink-500/20 text-amber-200 border border-amber-400/30 shadow-xs'
                    : 'bg-white/10 text-indigo-300 border border-white/10 shadow-xs'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${
                isActive
                  ? mode === 'kids' ? 'text-amber-300' : 'text-indigo-300'
                  : 'text-slate-400'
              }`} />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className={`ml-auto text-2xs px-2 py-0.5 rounded-full font-bold border ${
                  mode === 'kids'
                    ? 'bg-amber-400/20 text-amber-200 border-amber-300/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Privacy Status Widget */}
      <div className="p-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1">
            Privacy & Family Safe
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
            <span className="text-xs text-slate-300">Firestore UID Isolation</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-normal font-light">
            All drawings, photos, and voice notes belong strictly to your private account.
          </p>
        </div>
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500/40 to-teal-500/40 border border-white/20 text-indigo-200 flex items-center justify-center text-xs font-semibold shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.name || 'Journaler'}</p>
              <p className="text-2xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-300 hover:bg-white/5 rounded-lg transition-colors shrink-0 cursor-pointer"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};


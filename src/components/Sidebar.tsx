import React from 'react';
import { 
  LayoutDashboard, 
  PenLine, 
  BookOpen, 
  User, 
  LogOut, 
  Sparkles, 
  X,
  Lock
} from 'lucide-react';
import type { User as UserType } from '../types';

export type NavTab = 
  | 'dashboard' 
  | 'new-entry' 
  | 'my-journal' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserType | null;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAskGemini?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  onOpenAskGemini,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-entry', label: 'New Entry', icon: PenLine, badge: '+ New' },
    { id: 'my-journal', label: 'My Journal', icon: BookOpen },
    { id: 'settings', label: 'Profile & Settings', icon: User },
  ];

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border-r border-white/10 text-slate-100">
      {/* App Branding */}
      <div className="p-5 sm:p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-teal-400 flex items-center justify-center text-slate-900 font-bold shadow-lg shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white leading-tight">
                Sunviora
              </h1>
              <p className="text-3xs text-slate-400 font-light mt-0.5">
                Mindful AI Journal
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            id="mobile-close-sidebar-btn"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Ask Gemini Quick Feature Card */}
      {onOpenAskGemini && (
        <div className="px-4 pt-4">
          <button
            type="button"
            id="sidebar-ask-gemini-btn"
            onClick={() => {
              onOpenAskGemini();
              onCloseMobile();
            }}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/40 hover:to-purple-600/40 border border-indigo-400/30 text-left transition-all group shadow-sm flex items-center gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/30 text-indigo-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-white block truncate">
                Ask Gemini Q&A
              </span>
              <span className="text-[10px] text-slate-300 block truncate">
                Ask questions about your journal
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-white/15 text-white border border-white/20 shadow-xs'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${
                isActive ? 'text-indigo-300' : 'text-slate-400'
              }`} />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-3xs px-2 py-0.5 rounded-full font-bold border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Privacy Status Widget */}
      <div className="p-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1">
            <Lock className="w-3 h-3 text-teal-400" />
            <span>Private & Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
            <span className="text-xs text-slate-300 font-medium">Firestore UID Isolation</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-normal font-light">
            All entries, photos, and voice notes are isolated to your private account.
          </p>
        </div>
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500/40 to-teal-500/40 border border-white/20 text-indigo-200 flex items-center justify-center text-xs font-semibold shrink-0">
              {user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U')}
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

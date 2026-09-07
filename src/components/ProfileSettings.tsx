import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  ShieldCheck, 
  Download, 
  Trash2, 
  LogOut, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Database,
  Globe,
  Check
} from 'lucide-react';
import { 
  apiUpdatePassword, 
  apiClearUserData, 
  apiGetEntries,
  apiUpdateUserLanguage
} from '../services/api';
import type { User, LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

interface ProfileSettingsProps {
  user: User | null;
  onLogout: () => void;
  onEntriesCleared: () => void;
  currentLanguage?: LanguageCode;
  onUpdateLanguage?: (language: LanguageCode) => Promise<void>;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  user,
  onLogout,
  onEntriesCleared,
  currentLanguage = 'en',
  onUpdateLanguage,
}) => {
  // Language state
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(user?.preferredLanguage || currentLanguage);
  const [langStatus, setLangStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUpdatingLang, setIsUpdatingLang] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Clear data state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const handleSaveLanguage = async (lang: LanguageCode) => {
    setSelectedLang(lang);
    setIsUpdatingLang(true);
    setLangStatus(null);
    try {
      if (onUpdateLanguage) {
        await onUpdateLanguage(lang);
      } else {
        await apiUpdateUserLanguage(lang);
      }
      setLangStatus({ type: 'success', message: 'Language preference saved.' });
    } catch (err: any) {
      console.error('Failed to update language:', err);
      setLangStatus({ type: 'error', message: err.message || 'Failed to update language.' });
    } finally {
      setIsUpdatingLang(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await apiUpdatePassword(currentPassword, newPassword);
      setPasswordStatus({ type: 'success', message: res.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleExportData = async (format: 'json' | 'markdown') => {
    setIsExporting(true);
    try {
      const res = await apiGetEntries();
      const entries = res.entries;

      let contentStr = '';
      let filename = `sunviora-journal-export-${new Date().toISOString().split('T')[0]}`;
      let mimeType = 'text/plain';

      if (format === 'json') {
        contentStr = JSON.stringify(entries, null, 2);
        filename += '.json';
        mimeType = 'application/json';
      } else {
        filename += '.md';
        contentStr = `# Sunviora Journal Export\nExported on: ${new Date().toLocaleString()}\nTotal entries: ${entries.length}\n\n---\n\n`;
        entries.forEach((e) => {
          contentStr += `## ${e.title}\n`;
          contentStr += `**Date:** ${new Date(e.created_at).toLocaleString()} | **Mood:** ${e.mood} | **Language:** ${e.language}\n\n`;
          contentStr += `${e.content}\n\n`;
          if (e.reflection) {
            contentStr += `### Gemini AI Reflection\n`;
            if (e.reflection.personalReflection) {
              contentStr += `${e.reflection.personalReflection}\n\n`;
            }
            if (e.reflection.summary) {
              contentStr += `**Summary:** ${e.reflection.summary}\n\n`;
            }
            if (e.reflection.keyThemes && e.reflection.keyThemes.length > 0) {
              contentStr += `**Themes:** ${e.reflection.keyThemes.join(', ')}\n\n`;
            }
          }
          contentStr += `---\n\n`;
        });
      }

      const blob = new Blob([contentStr], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export entries.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      const res = await apiClearUserData();
      setClearStatus(res.message);
      setShowClearConfirm(false);
      onEntriesCleared();
    } catch (err: any) {
      alert(err.message || 'Failed to clear journal data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-slate-100">
      {/* Header */}
      <div>
        <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight italic">
          Profile & <span className="text-indigo-300 font-normal not-italic text-2xl">Privacy Settings</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
          Manage your account credentials, view security status, and control your private journal data.
        </p>
      </div>

      {/* 1. User Profile Details */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-white text-base">User Profile</h3>
            <p className="text-xs text-slate-400 font-light">Your account identity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-2xs uppercase tracking-wider mb-1">Email Address</span>
            <span className="font-medium text-white">{user?.email || 'N/A'}</span>
          </div>

          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-2xs uppercase tracking-wider mb-1">Display Name</span>
            <span className="font-medium text-white">{user?.name || 'Journaler'}</span>
          </div>

          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-2xs uppercase tracking-wider mb-1">Account ID</span>
            <span className="font-mono text-2xs text-slate-400 truncate block">{user?.id || 'N/A'}</span>
          </div>

          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-2xs uppercase tracking-wider mb-1">Member Since</span>
            <span className="font-medium text-white">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'Recently joined'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Preferred Language Settings */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-300 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-white text-base">Language Preferences</h3>
            <p className="text-xs text-slate-400 font-light">
              Choose your primary language for journaling, translations, and AI reflections
            </p>
          </div>
        </div>

        {langStatus && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium ${
              langStatus.type === 'success'
                ? 'bg-teal-500/15 border border-teal-500/30 text-teal-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}
          >
            {langStatus.message}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                id={`settings-lang-${lang.code}`}
                onClick={() => handleSaveLanguage(lang.code)}
                disabled={isUpdatingLang}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500/20 border-teal-400/80 text-white ring-1 ring-teal-400/50'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 text-teal-300 font-mono">
                    {lang.code}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-teal-300" />}
                </div>
                <p className="text-xs font-semibold text-white mt-1">{lang.name}</p>
                <p className="text-[10px] text-slate-400">{lang.nativeName}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Privacy & Security Architecture Information */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-white text-base">Privacy & Security Safeguards</h3>
            <p className="text-xs text-slate-400 font-light">How your journal data is protected</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm flex items-start gap-3">
            <Lock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white mb-0.5 font-medium">Cloud Firestore Zero-Trust Security Rules</strong>
              <p className="text-slate-300 font-light leading-relaxed">
                Database rules enforce request.auth.uid == userId at the database layer. No unauthenticated user or other account can query, read, or alter your journal entries.
              </p>
            </div>
          </div>

          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white mb-0.5 font-medium">Server-Side Gemini API Integration</strong>
              <p className="text-slate-300 font-light leading-relaxed">
                Gemini credentials reside strictly in server environment variables. Frontend bundles contain zero keys or secrets.
              </p>
            </div>
          </div>

          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm flex items-start gap-3">
            <Database className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white mb-0.5 font-medium">Firebase Authentication Identity</strong>
              <p className="text-slate-300 font-light leading-relaxed">
                Authentication is handled directly by Google Firebase Authentication with OAuth and secure credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Data Export Options */}
        <div className="pt-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
            Data Portability & Export
          </h4>
          <div className="flex flex-wrap gap-3">
            <button
              id="export-json-btn"
              onClick={() => handleExportData('json')}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-300" />
              <span>Export as JSON</span>
            </button>
            <button
              id="export-markdown-btn"
              onClick={() => handleExportData('markdown')}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-300" />
              <span>Export as Markdown Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Account Settings: Change Password */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-white text-base">Account Security</h3>
            <p className="text-xs text-slate-400 font-light">Update your login password</p>
          </div>
        </div>

        {passwordStatus && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
              passwordStatus.type === 'success'
                ? 'bg-teal-500/15 border border-teal-500/30 text-teal-200'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-200'
            }`}
          >
            {passwordStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{passwordStatus.message}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="current-password-input">
              Current Password
            </label>
            <input
              id="current-password-input"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="new-password-input">
              New Password (minimum 6 characters)
            </label>
            <input
              id="new-password-input"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="confirm-password-input">
              Confirm New Password
            </label>
            <input
              id="confirm-password-input"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md"
            />
          </div>

          <button
            type="submit"
            id="update-password-submit-btn"
            disabled={isUpdatingPassword}
            className="px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-60"
          >
            {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* 5. Danger Zone & Logout */}
      <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div>
          <h3 className="font-medium text-white text-base">Account Actions</h3>
          <p className="text-xs text-slate-400 font-light">Sign out or manage stored journal data</p>
        </div>

        {clearStatus && (
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-white text-xs">
            {clearStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Logout Button */}
          <button
            id="settings-logout-btn"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-medium transition-all shadow-md cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Sunviora</span>
          </button>

          {/* Clear All Data Trigger */}
          <button
            id="settings-clear-all-data-btn"
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All My Journal Entries</span>
          </button>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900/90 border border-white/15 backdrop-blur-2xl rounded-3xl max-w-md w-full p-7 shadow-2xl space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-white">Clear All Journal Entries?</h3>
              <p className="text-xs text-slate-300 font-light mt-1.5 leading-relaxed">
                This will permanently delete all entries belonging to <strong>{user?.email}</strong>. This action is irreversible.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-clear-all-entries-btn"
                onClick={handleClearAllData}
                disabled={isClearing}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors shadow-lg shadow-rose-600/25 cursor-pointer disabled:opacity-60"
              >
                {isClearing ? 'Clearing Entries...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

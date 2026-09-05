import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  Brain, 
  BookHeart, 
  Eye, 
  EyeOff,
  Sparkle
} from 'lucide-react';
import { apiLogin, apiSignup, apiDemoLogin } from '../services/api';
import type { User } from '../types';

interface LandingPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter an email and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        const res = await apiSignup(email, password, name);
        onLoginSuccess(res.user, res.token);
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter your email and password.');
        }
        const res = await apiLogin(email, password);
        onLoginSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const res = await apiDemoLogin();
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError('Unable to launch demo account. Please try registering an account.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-white/10 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-slate-900">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-medium text-white text-base sm:text-lg tracking-tight">
                Personal Gemini Journal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="header-demo-login-btn"
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-white bg-white/10 border border-white/15 hover:bg-white/20 transition-all backdrop-blur-md cursor-pointer"
            >
              <Sparkle className="w-3.5 h-3.5 text-teal-300" />
              <span>{demoLoading ? 'Launching Demo...' : 'Instant Demo Login'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Split */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Column: Mission & Features */}
        <div className="lg:w-7/12 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 backdrop-blur-md">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span>Server-Enforced Data Isolation & Privacy</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.15]">
              Your thoughts. Your journal. Your AI reflection —{' '}
              <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-teal-200 to-indigo-200">
                privately.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-2xl">
              A calm, distraction-free sanctuary to capture your daily thoughts, track your emotions, and receive compassionate, structured AI reflections with Gemini without compromising your privacy.
            </p>
          </div>

          {/* Key Value Cards (Frosted Glass) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center mb-3">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-white text-sm">Empathetic Reflections</h3>
              <p className="text-xs text-slate-300 font-light mt-1.5 leading-relaxed">
                Gemini uncovers emotional nuances, key themes, strengths, and gentle inquiry prompts on demand.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/15 text-teal-300 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-white text-sm">Server-Side Security</h3>
              <p className="text-xs text-slate-300 font-light mt-1.5 leading-relaxed">
                Every entry is strictly isolated by user ID on the backend. Gemini credentials never touch the browser.
              </p>
            </div>
          </div>

          {/* Ideathon Highlight Note */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-xs text-slate-300 flex items-start gap-3">
            <BookHeart className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div className="font-light">
              <span className="font-medium text-white">Designed for Mindful Wellness:</span>{' '}
              Includes pre-loaded sample entries for demo review, or you can register your own private account to start fresh.
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card (Frosted Glass) */}
        <div className="lg:w-5/12 w-full max-w-md">
          <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-7 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
              <div>
                <h2 className="font-light text-white text-2xl italic">
                  {isSignUp ? 'Create Journal' : 'Welcome Back'}
                </h2>
                <p className="text-xs text-slate-400 font-light mt-1">
                  {isSignUp ? 'Begin writing and reflecting today' : 'Sign in to access your private journal'}
                </p>
              </div>

              {/* Mode Toggle Switch */}
              <div className="flex bg-white/10 p-1 rounded-full border border-white/10 text-xs font-medium">
                <button
                  type="button"
                  id="tab-switch-login"
                  onClick={() => { setIsSignUp(false); setError(null); }}
                  className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                    !isSignUp ? 'bg-white text-slate-900 shadow-md font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="tab-switch-signup"
                  onClick={() => { setIsSignUp(true); setError(null); }}
                  className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                    isSignUp ? 'bg-white text-slate-900 shadow-md font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="auth-name">
                    Full Name (Optional)
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Alex Johnson"
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="auth-email">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="auth-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'Minimum 6 characters' : 'Enter your password'}
                    className="w-full px-4 py-3 pr-11 rounded-2xl border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 bg-white/5 backdrop-blur-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="auth-submit-btn"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Private Journal' : 'Sign In to Journal'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900/80 px-3 text-slate-400 rounded-full border border-white/5">or explore immediately</span>
              </div>
            </div>

            {/* Quick Demo Access */}
            <button
              type="button"
              id="auth-demo-account-btn"
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="w-full py-3 px-4 rounded-full border border-white/15 bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>{demoLoading ? 'Logging into Demo...' : 'One-Click Demo Account (Ideathon Review)'}</span>
            </button>

            <div className="mt-5 pt-4 border-t border-white/10 text-center">
              <p className="text-2xs text-slate-400 font-light">
                Data isolation active • Passwords securely hashed • Private session storage
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-6 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            <strong className="text-slate-200">Personal Gemini Journal</strong> — Your thoughts. Your journal. Your AI reflection — privately.
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-light">
            <span>Server-side Gemini 3.8 Flash</span>
            <span>•</span>
            <span>Non-medical mindful reflection</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

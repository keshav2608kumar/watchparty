import React, { useState } from 'react';
import { User, Shield, Key, Mail, CheckCircle, LogOut, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';

export const AccountPage: React.FC = () => {
  const { user, updateDisplayName, signInWithEmail, signOut, isSupabaseAuth } = useAuth();
  const [nameInput, setNameInput] = useState(user.name);
  const [emailInput, setEmailInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [authMsg, setAuthMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    updateDisplayName(nameInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setAuthMsg({ text: 'Sending magic link...' });
    const { error } = await signInWithEmail(emailInput.trim());
    if (error) {
      setAuthMsg({ text: error.message, error: true });
    } else {
      setAuthMsg({ text: 'Check your email inbox for login link!' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-140px)]">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Account & Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your viewer identity, preferences, and cloud synchronization settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 p-6 rounded-2xl bg-surface-card border border-surface-border flex flex-col items-center text-center">
          <div className="relative mb-4">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-24 h-24 rounded-full bg-surface border-2 border-brand-500 shadow-glow-sm"
            />
            <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-surface border border-surface-border">
              {user.isGuest ? (
                <User className="w-4 h-4 text-slate-400" />
              ) : (
                <Shield className="w-4 h-4 text-emerald-400" />
              )}
            </div>
          </div>

          <h3 className="text-base font-bold text-white mb-0.5">{user.name}</h3>
          <span className="text-xs text-slate-400 font-mono mb-3">ID: {user.id.slice(0, 14)}...</span>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface border border-surface-border text-slate-300 mb-6">
            <span className={`w-2 h-2 rounded-full ${user.isGuest ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span>{user.isGuest ? 'Guest Profile' : 'Verified Member'}</span>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Reset Identity / Sign Out</span>
          </button>
        </div>

        {/* Right Column: Profile Editing & Cloud Integration */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Display Name */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
            <h3 className="text-base font-bold text-white mb-1">Viewer Display Name</h3>
            <p className="text-xs text-slate-400 mb-4">
              This name is shown to other party members in chat, reactions, and the audience list.
            </p>

            <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                required
                maxLength={30}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Update Name</span>
                )}
              </button>
            </form>
          </div>

          {/* Cloud Sync & Supabase Status */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white">Backend & Synchronization</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                isSupabaseConfigured 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-brand-500/10 text-brand-300 border-brand-500/30'
              }`}>
                {isSupabaseConfigured ? 'Supabase Connected' : 'Local Demo Mode Active'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {isSupabaseConfigured
                ? 'Your WatchParty instance is connected to Supabase Realtime for worldwide cross-device synchronization, presence tracking, and cloud data persistence.'
                : 'Your app is operating with the built-in multi-tab BroadcastChannel engine. You can open multiple browser windows or tabs locally to test real-time room sync, chat, and playback with zero setup.'}
            </p>

            {/* If Supabase Auth is enabled, allow email login */}
            {isSupabaseConfigured ? (
              <form onSubmit={handleEmailSignIn} className="space-y-3 pt-2 border-t border-surface-border">
                <label className="block text-xs font-medium text-slate-300">
                  Sign In with Magic Link
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-surface hover:bg-surface-hover border border-surface-border text-white text-xs font-semibold rounded-xl transition"
                  >
                    Send Magic Link
                  </button>
                </div>
                {authMsg && (
                  <p className={`text-xs ${authMsg.error ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {authMsg.text}
                  </p>
                )}
              </form>
            ) : (
              <div className="p-3.5 rounded-xl bg-surface border border-surface-border text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Info className="w-4 h-4 text-brand-400" />
                  <span>How to enable Cloud Sync with Supabase</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Add <code className="text-brand-300 bg-surface-card px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="text-brand-300 bg-surface-card px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to your environment file, run the migration in <code className="text-brand-300 bg-surface-card px-1 py-0.5 rounded">supabase/migrations/</code>, and deploy!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

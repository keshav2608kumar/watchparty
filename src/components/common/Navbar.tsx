import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Compass, 
  PlusCircle, 
  LogIn, 
  User, 
  Wifi, 
  Menu, 
  X,
  Radio,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';

interface NavbarProps {
  onOpenJoinModal?: () => void;
  onOpenCreateModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenJoinModal, onOpenCreateModal }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-xl border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-electric-blue flex items-center justify-center shadow-glow-brand group-hover:scale-105 transition-transform">
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-brand-300 transition">
                Watch<span className="text-brand-400">Party</span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 hidden sm:block tracking-wide">
                Same screen. Same moment.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/discover" 
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <Compass className="w-4 h-4 text-electric-blue" />
              <span>Discover</span>
            </Link>

            {onOpenJoinModal && (
              <button
                onClick={onOpenJoinModal}
                className="text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Join Room
              </button>
            )}

            {onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border hover:border-brand-500/50 text-xs font-semibold text-slate-200 hover:text-white transition shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5 text-brand-400" />
                <span>Create Room</span>
              </button>
            )}
          </div>

          {/* User Profile & Status */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sync Mode Indicator */}
            <div 
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border bg-surface-card border-surface-border text-slate-400"
              title={isSupabaseConfigured ? 'Connected to Supabase Cloud' : 'Running in Local BroadcastChannel multi-tab mode'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-brand-400'}`} />
              <span>{isSupabaseConfigured ? 'Cloud Sync' : 'Local Realtime'}</span>
            </div>

            <Link
              to="/account"
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-surface-card hover:bg-surface-hover border border-surface-border transition"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-6 h-6 rounded-full bg-surface"
              />
              <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate">
                {user.name}
              </span>
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-surface-border bg-surface-card/95 backdrop-blur-lg px-4 pt-2 pb-4 space-y-3">
          <Link
            to="/discover"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-surface transition"
          >
            <Compass className="w-4 h-4 text-electric-blue" />
            <span>Browse Catalog</span>
          </Link>

          {onOpenJoinModal && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenJoinModal();
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-surface transition"
            >
              <Radio className="w-4 h-4 text-brand-400" />
              <span>Join a Room</span>
            </button>
          )}

          {onOpenCreateModal && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateModal();
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-surface transition"
            >
              <PlusCircle className="w-4 h-4 text-brand-400" />
              <span>Create New Room</span>
            </button>
          )}

          <Link
            to="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface text-sm text-slate-200 border border-surface-border"
          >
            <div className="flex items-center gap-2">
              <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
              <span>{user.name}</span>
            </div>
            <span className="text-xs text-brand-400 font-medium">Profile</span>
          </Link>
        </div>
      )}
    </nav>
  );
};

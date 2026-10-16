import React from 'react';
import { Play, Heart, Shield, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-card border-t border-surface-border text-slate-400 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center">
              <Play className="w-3 h-3 fill-white text-white ml-0.5" />
            </div>
            <span className="font-extrabold text-sm text-white">WatchParty</span>
          </div>
          <p className="text-xs text-slate-400 text-center md:text-left max-w-sm">
            "Same screen. Same moment. Anywhere." Real-time synchronized cinema rooms, shared playlists, live chat, and polls.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
          <Link to="/discover" className="hover:text-white transition">Catalog</Link>
          <Link to="/account" className="hover:text-white transition">Profile & Mode</Link>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer" 
            className="hover:text-white transition"
          >
            Documentation
          </a>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Engineered for zero-drift real-time playback</span>
        </div>
      </div>
    </footer>
  );
};

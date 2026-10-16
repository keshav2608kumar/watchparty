import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Play, 
  Radio, 
  Users, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Film,
  Zap,
  Vote,
  MessageSquare
} from 'lucide-react';
import { SAMPLE_CATALOG, getFeaturedItem } from '../services/catalogService';
import { generateRoomId } from '../utils/idGenerator';
import { CreateRoomModal } from '../components/common/CreateRoomModal';
import { JoinRoomModal } from '../components/common/JoinRoomModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const featured = getFeaturedItem();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleQuickLaunchFeatured = () => {
    const roomId = generateRoomId();
    navigate(`/room/${roomId}?mediaUrl=${encodeURIComponent(featured.mediaUrl)}&mediaType=${featured.mediaType}&title=${encodeURIComponent(featured.title)}&mediaId=${featured.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Ambient lighting glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 w-[400px] h-[250px] bg-electric-blue/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6 animate-pulse">
            <Radio className="w-3.5 h-3.5 text-brand-400" />
            <span>Next-Gen Synchronized Cinema</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
            Same screen. Same moment.{' '}
            <span className="bg-gradient-to-r from-brand-400 via-electric-blue to-brand-300 bg-clip-text text-transparent">
              Anywhere.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-10 leading-relaxed font-normal">
            Stream movies and videos in perfect synchronization with friends. Enjoy zero playback drift, live reactions, instant group polls, and shared queues with zero required signups.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-electric-blue hover:opacity-95 text-white font-bold text-sm shadow-glow-brand flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Create a Room</span>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-slate-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <Users className="w-4 h-4 text-electric-blue" />
              <span>Join a Room</span>
            </button>
          </div>

          {/* Interactive Featured Movie Banner */}
          <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden border border-surface-border shadow-2xl bg-surface-card group">
            <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full overflow-hidden">
              <img
                src={featured.backdropUrl}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/40 to-transparent" />

              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div className="text-left max-w-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-brand-500/20 border border-brand-500/30 text-brand-300 text-[10px] font-bold tracking-wide uppercase">
                      Featured Premiere
                    </span>
                    <span className="text-xs text-slate-300 font-medium">{featured.year}</span>
                    <span className="text-xs text-slate-400">• {featured.genre.join(', ')}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                    {featured.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                    {featured.description}
                  </p>
                </div>

                <button
                  onClick={handleQuickLaunchFeatured}
                  className="px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 transition flex items-center gap-2 shadow-lg flex-shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Party with This Film</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Synchronized Viewing Highlights */}
      <section className="py-16 bg-surface-card/50 border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Engineered for Real-Time Perfection
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              No more counting "3, 2, 1, press play". WatchParty synchronizes every frame with sub-500ms precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-brand-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Authoritative Sync Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Play, pause, seek, and rate adjustments are broadcast across clients with monotonic revisions and automated drift reconciliation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-brand-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-electric-blue/20 text-electric-blue flex items-center justify-center mb-4">
                <Film className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Dual Engine Player</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stream direct MP4/WebM video feeds alongside YouTube videos using the official YouTube IFrame API and unified controls.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-brand-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Audience Reactions & Polls</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Float emoji bursts across the video canvas, host live polls to pick the next movie, and chat in real-time with your crew.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block mb-2">Simple 3-Step Setup</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How WatchParty Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-card border border-surface-border">
              <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-extrabold text-lg flex items-center justify-center mb-4 shadow-glow-sm">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Create Your Room</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select a title from our curated cinematic catalog or paste your own direct video or YouTube URL.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-card border border-surface-border">
              <div className="w-12 h-12 rounded-full bg-electric-blue text-slate-950 font-extrabold text-lg flex items-center justify-center mb-4 shadow-glow-sm">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">Share the Link</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Copy your unique room invite link. Friends can join with a single click as instant guests without signing up.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-card border border-surface-border">
              <div className="w-12 h-12 rounded-full bg-purple-500 text-white font-extrabold text-lg flex items-center justify-center mb-4 shadow-glow-sm">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Watch in Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When the host hits play or seeks, all viewers stay locked together down to the exact millisecond.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Quick Browse Teaser */}
      <section className="py-16 bg-surface-card/30 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Trending Movies & Shorts</h2>
              <p className="text-xs text-slate-400 mt-1">High-definition open cinema ready to stream</p>
            </div>
            <Link
              to="/discover"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {SAMPLE_CATALOG.slice(0, 4).map((movie) => (
              <div
                key={movie.id}
                onClick={() => {
                  const roomId = generateRoomId();
                  navigate(`/room/${roomId}?mediaUrl=${encodeURIComponent(movie.mediaUrl)}&mediaType=${movie.mediaType}&title=${encodeURIComponent(movie.title)}&mediaId=${movie.id}`);
                }}
                className="group relative rounded-2xl overflow-hidden bg-surface border border-surface-border hover:border-brand-500/50 cursor-pointer transition shadow-md"
              >
                <div className="aspect-[3/4] w-full overflow-hidden relative">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white uppercase border border-white/10">
                    {movie.mediaType}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-glow-brand">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="text-xs font-bold text-white truncate">{movie.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{movie.genre.slice(0, 2).join(' • ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modals */}
      <CreateRoomModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <JoinRoomModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </div>
  );
};

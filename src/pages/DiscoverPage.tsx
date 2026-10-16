import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Film, 
  Play, 
  Sparkles, 
  Info, 
  Clock, 
  Calendar, 
  Tag, 
  Check, 
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { searchCatalog, SAMPLE_CATALOG } from '../services/catalogService';
import { CatalogItem, MovieGenre } from '../types/catalog';
import { generateRoomId } from '../utils/idGenerator';
import { formatTime } from '../utils/formatters';

const GENRES: MovieGenre[] = [
  'All',
  'Sci-Fi',
  'Animation',
  'Action',
  'Comedy',
  'Documentary',
  'Drama',
  'Short Film'
];

export const DiscoverPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<MovieGenre>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'year' | 'title'>('featured');
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<CatalogItem | null>(null);
  const navigate = useNavigate();

  const filteredItems = useMemo(() => {
    return searchCatalog(searchQuery, selectedGenre, sortBy);
  }, [searchQuery, selectedGenre, sortBy]);

  const handleLaunchRoom = (item: CatalogItem) => {
    const roomId = generateRoomId();
    navigate(`/room/${roomId}?mediaUrl=${encodeURIComponent(item.mediaUrl)}&mediaType=${item.mediaType}&title=${encodeURIComponent(item.title)}&mediaId=${item.id}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-140px)] min-w-0">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Cinema Catalog</h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore open-license films and high-definition video streams ready for synchronized party playback.
        </p>

        {/* Public domain / sample metadata notice */}
        <div className="mt-3 inline-flex items-start sm:items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-slate-400 text-xs max-w-full">
          <Info className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="break-words">Curated public-domain & open-license video catalog. External catalog APIs (e.g. TMDB) are optional.</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, description, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-surface-card border border-surface-border text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="year">Release Year</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar w-full max-w-full">
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedGenre === genre
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'bg-surface-card hover:bg-surface-hover text-slate-300 border border-surface-border'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-surface-card border border-surface-border">
          <Film className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">No movies match your search</h3>
          <p className="text-xs text-slate-400 mt-1">Try tweaking your search term or select "All" genres.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((movie) => (
            <div
              key={movie.id}
              className="flex flex-col bg-surface-card border border-surface-border rounded-2xl overflow-hidden hover:border-brand-500/50 transition group shadow-md"
            >
              {/* Poster Image with play button overlay */}
              <div className="relative aspect-[16/10] overflow-hidden bg-black">
                <img
                  src={movie.backdropUrl || movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-black/30 to-transparent" />

                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-brand-300 uppercase border border-brand-500/30">
                    {movie.mediaType}
                  </span>
                  {movie.featured && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 backdrop-blur-xs text-[10px] font-bold text-amber-300 uppercase border border-amber-500/30">
                      Featured
                    </span>
                  )}
                </div>

                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-mono text-slate-300">
                  {formatTime(movie.durationSeconds)}
                </div>

                {/* Quick Launch Button */}
                <button
                  onClick={() => handleLaunchRoom(movie)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-glow-brand hover:scale-110 active:scale-95 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white truncate">{movie.title}</h3>
                    <span className="text-[11px] text-slate-400 font-medium">{movie.year}</span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {movie.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {movie.genre.map((g) => (
                      <span key={g} className="text-[10px] px-2 py-0.5 rounded-md bg-surface text-slate-300 border border-surface-border">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedMovieForDetails(movie)}
                    className="text-xs text-slate-400 hover:text-white font-medium transition"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => handleLaunchRoom(movie)}
                    className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Party</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Movie Details Modal */}
      {selectedMovieForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-card border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="relative aspect-video">
              <img
                src={selectedMovieForDetails.backdropUrl}
                alt={selectedMovieForDetails.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-black/40 to-transparent" />
              <button
                onClick={() => setSelectedMovieForDetails(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-1 text-xs text-brand-400 font-semibold">
                <span>{selectedMovieForDetails.year}</span>
                <span>•</span>
                <span>{formatTime(selectedMovieForDetails.durationSeconds)}</span>
                <span>•</span>
                <span>{selectedMovieForDetails.rating}</span>
              </div>
              <h2 className="text-xl font-extrabold text-white mb-2">
                {selectedMovieForDetails.title}
              </h2>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                {selectedMovieForDetails.description}
              </p>

              {selectedMovieForDetails.director && (
                <p className="text-xs text-slate-400 mb-4">
                  <strong className="text-slate-300">Creator/Studio:</strong> {selectedMovieForDetails.director}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
                <button
                  onClick={() => setSelectedMovieForDetails(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const movie = selectedMovieForDetails;
                    setSelectedMovieForDetails(null);
                    handleLaunchRoom(movie);
                  }}
                  className="px-5 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-glow-sm flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Party Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

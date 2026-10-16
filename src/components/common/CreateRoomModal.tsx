import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, PlusCircle, Film, Sparkles, ArrowRight, Play } from 'lucide-react';
import { generateRoomId } from '../../utils/idGenerator';
import { SAMPLE_CATALOG } from '../../services/catalogService';
import { detectMediaType } from '../../utils/formatters';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
  const [selectedMovieId, setSelectedMovieId] = useState<string>(SAMPLE_CATALOG[0].id);
  const [customUrl, setCustomUrl] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoomId = generateRoomId();

    let initialMediaParam = '';
    if (useCustom && customUrl.trim()) {
      const type = detectMediaType(customUrl.trim());
      initialMediaParam = `?mediaUrl=${encodeURIComponent(customUrl.trim())}&mediaType=${type}&title=${encodeURIComponent('Custom Stream')}`;
    } else {
      const movie = SAMPLE_CATALOG.find(m => m.id === selectedMovieId) || SAMPLE_CATALOG[0];
      initialMediaParam = `?mediaUrl=${encodeURIComponent(movie.mediaUrl)}&mediaType=${movie.mediaType}&title=${encodeURIComponent(movie.title)}&mediaId=${movie.id}`;
    }

    onClose();
    navigate(`/room/${newRoomId}${initialMediaParam}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-electric-blue text-white flex items-center justify-center shadow-glow-sm">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Create a Cinema Room</h3>
            <p className="text-xs text-slate-400">Pick a film to start with or paste your own video URL.</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Toggle between catalog and custom */}
          <div className="flex p-1 rounded-xl bg-surface border border-surface-border">
            <button
              type="button"
              onClick={() => setUseCustom(false)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                !useCustom ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Curated Catalog
            </button>
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                useCustom ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom Video URL
            </button>
          </div>

          {!useCustom ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Choose Starting Movie
              </label>
              <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {SAMPLE_CATALOG.map((movie) => {
                  const isSelected = movie.id === selectedMovieId;
                  return (
                    <div
                      key={movie.id}
                      onClick={() => setSelectedMovieId(movie.id)}
                      className={`flex gap-2.5 p-2 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/15 shadow-glow-sm'
                          : 'border-surface-border bg-surface hover:bg-surface-hover'
                      }`}
                    >
                      <img
                        src={movie.posterUrl}
                        alt=""
                        className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="min-w-0 flex flex-col justify-center">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {movie.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {movie.genre[0]} • {movie.mediaType.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Video Stream URL (MP4, WebM, or YouTube)
              </label>
              <input
                type="url"
                required
                placeholder="https://commondatastorage.googleapis.com/... or https://youtube.com/..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Direct CORS-compatible video files and official YouTube video links are supported.
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-brand-600 to-electric-blue hover:opacity-90 text-white rounded-xl shadow-glow-brand flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Room Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

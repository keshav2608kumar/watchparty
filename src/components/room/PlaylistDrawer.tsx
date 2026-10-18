import React, { useState, useRef } from 'react';
import { ListVideo, Plus, Play, Trash2, Film, Video, ExternalLink, FolderOpen, HardDrive, Upload, Sparkles } from 'lucide-react';
import { PlaylistItem, MediaType } from '../../types/room';
import { detectMediaType, formatTime, normalizeCustomMediaUrl, formatFileSize } from '../../utils/formatters';
import { SAMPLE_CATALOG } from '../../services/catalogService';

interface PlaylistDrawerProps {
  playlist: PlaylistItem[];
  currentMediaUrl: string;
  canControl: boolean;
  onPlayItem: (item: PlaylistItem) => void;
  onAddItem: (item: Omit<PlaylistItem, 'id' | 'addedAt'>) => void;
  onRemoveItem: (id: string) => void;
  onLoadLocalVideo?: (file: File) => void;
  currentUserId: string;
  currentUserName: string;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  playlist,
  currentMediaUrl,
  canControl,
  onPlayItem,
  onAddItem,
  onRemoveItem,
  onLoadLocalVideo,
  currentUserId,
  currentUserName,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const localFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newTitle.trim()) return;

    const { url: cleanUrl, type: mediaType } = normalizeCustomMediaUrl(newUrl);
    onAddItem({
      roomId: '',
      title: newTitle.trim(),
      url: cleanUrl,
      type: mediaType,
      durationSeconds: 0,
      addedBy: currentUserId,
      addedByName: currentUserName,
    });

    setNewTitle('');
    setNewUrl('');
    setShowAddModal(false);
  };

  const handleAddFromCatalog = (catalogMovie: typeof SAMPLE_CATALOG[0]) => {
    onAddItem({
      roomId: '',
      title: catalogMovie.title,
      url: catalogMovie.mediaUrl,
      type: catalogMovie.mediaType,
      durationSeconds: catalogMovie.durationSeconds,
      thumbnailUrl: catalogMovie.posterUrl,
      addedBy: currentUserId,
      addedByName: currentUserName,
    });
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-lg">
      <div className="p-3.5 border-b border-surface-border flex items-center justify-between bg-surface/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ListVideo className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-100">Party Queue</h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600/90 hover:bg-brand-500 text-white text-xs font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Media</span>
        </button>
      </div>

      {/* Playlist Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {playlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Film className="w-8 h-8 text-brand-400/50 mb-2" />
            <p className="text-xs font-medium text-slate-300">Playlist is empty</p>
            <p className="text-[11px] text-slate-500 mt-1">Queue a movie or YouTube clip for the party.</p>
          </div>
        ) : (
          playlist.map((item, index) => {
            const isPlaying = item.url === currentMediaUrl;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  isPlaying
                    ? 'bg-brand-500/10 border-brand-500/40'
                    : 'bg-surface/50 border-surface-border/60 hover:bg-surface-hover/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-mono text-slate-500 w-4 text-center">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 border border-surface-border overflow-hidden">
                    {item.isLocalFile ? (
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                    ) : item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : item.type === 'youtube' ? (
                      <Video className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Film className="w-4 h-4 text-brand-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${isPlaying ? 'text-brand-300 font-semibold' : 'text-slate-200'}`}>
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      {item.isLocalFile ? (
                        <span className="text-emerald-400 font-medium">Local ({formatFileSize(item.localFileSize)})</span>
                      ) : (
                        <span>Added by {item.addedByName}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {canControl && (
                    <button
                      onClick={() => onPlayItem(item)}
                      title={isPlaying ? 'Currently playing' : 'Switch room to this video'}
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                        isPlaying
                          ? 'bg-brand-500 text-white'
                          : 'hover:bg-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline text-[11px]">{isPlaying ? 'Playing' : 'Play'}</span>
                    </button>
                  )}
                  {canControl && (
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      title="Remove from playlist"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Media Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-1">Add Media to Queue</h3>
            <p className="text-xs text-slate-400 mb-4">Stream local downloaded files, web videos, or YouTube clips.</p>

            {/* Local Video Stream Picker Option */}
            {onLoadLocalVideo && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mb-0.5">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Stream Local / Downloaded Video</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Stream any MP4, WebM, MKV file from your laptop or phone. Perfect 4K quality with zero server buffering!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => localFileInputRef.current?.click()}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                  <input
                    ref={localFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/x-matroska,video/quicktime,video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        onLoadLocalVideo(e.target.files[0]);
                        setShowAddModal(false);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-surface-border" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Or Stream Online Link</span>
              <div className="flex-1 h-px bg-surface-border" />
            </div>

            <form onSubmit={handleAddCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Favorite Sci-Fi Short"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Video Stream or YouTube URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://... or https://youtube.com/watch?v=..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-sm transition"
                >
                  Add Custom Link
                </button>
              </div>
            </form>

            {/* Quick Catalog Suggestions */}
            <div className="mt-5 pt-4 border-t border-surface-border">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Or Pick From Curated Catalog
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {SAMPLE_CATALOG.slice(0, 4).map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => handleAddFromCatalog(movie)}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface hover:bg-surface-hover cursor-pointer border border-surface-border/50 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={movie.posterUrl} alt="" className="w-6 h-8 object-cover rounded" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{movie.title}</p>
                        <p className="text-[10px] text-slate-400">{movie.mediaType.toUpperCase()} • {formatTime(movie.durationSeconds)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-brand-400 font-medium px-2 py-1 rounded hover:bg-brand-500/10">Add</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

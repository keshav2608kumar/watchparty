import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw, 
  RotateCw, 
  AlertCircle,
  Radio,
  Sliders,
  Sparkles,
  Copy,
  Check,
  Link2,
  FolderOpen,
  Upload,
  Film,
  HardDrive
} from 'lucide-react';
import { MediaType, PlaybackStatus, FloatingReaction } from '../../types/room';
import { formatTime, formatFileSize } from '../../utils/formatters';
import { useUnifiedPlayer, PlayerControls, UnifiedPlayerState } from './useUnifiedPlayer';

interface VideoPlayerProps {
  mediaType: MediaType;
  mediaUrl: string;
  title: string;
  isHost: boolean;
  canControl: boolean;
  reactions: FloatingReaction[];
  onLocalUserAction?: (action: 'play' | 'pause' | 'seek', position: number) => void;
  onPlayerControlsReady?: (controls: PlayerControls, getState: () => UnifiedPlayerState) => void;
  syncDrift?: number;
  isLocalFile?: boolean;
  localFileName?: string;
  localFileSize?: number;
  hasMatchingLocalFile?: boolean;
  onSelectLocalFile?: (file: File) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  mediaType,
  mediaUrl,
  title,
  isHost,
  canControl,
  reactions,
  onLocalUserAction,
  onPlayerControlsReady,
  syncDrift = 0,
  isLocalFile = false,
  localFileName,
  localFileSize,
  hasMatchingLocalFile = true,
  onSelectLocalFile,
}) => {
  const { videoRef, containerRef, state, controls } = useUnifiedPlayer(
    mediaType, 
    mediaUrl, 
    onLocalUserAction
  );

  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [copiedStream, setCopiedStream] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (onPlayerControlsReady) {
      onPlayerControlsReady(controls, () => state);
    }
  }, [onPlayerControlsReady, controls, state]);

  // Auto-hide controls after 3s of inactivity while playing
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (state.status === 'playing') {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3500);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl) return;
    const target = parseFloat(e.target.value);
    controls.seek(target);
  };

  const handleQuickSkip = (offset: number) => {
    if (!canControl) return;
    controls.seek(state.currentTime + offset);
  };

  const togglePlay = () => {
    if (!canControl) return;
    if (state.status === 'playing') {
      controls.pause();
    } else {
      controls.play();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (onSelectLocalFile) {
        onSelectLocalFile(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (onSelectLocalFile) {
        onSelectLocalFile(file);
      }
      e.target.value = '';
    }
  };

  const progressPercent = state.duration > 0 
    ? Math.min(100, (state.currentTime / state.duration) * 100) 
    : 0;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => state.status === 'playing' && setShowControls(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-surface-border group select-none flex items-center justify-center"
    >
      {/* Media Engine Element */}
      {mediaType === 'html5' ? (
        <video
          key={`video-${mediaUrl}`}
          ref={videoRef}
          src={mediaUrl}
          className="w-full h-full object-contain pointer-events-auto"
          playsInline
          preload="auto"
          onClick={togglePlay}
        />
      ) : (
        <div 
          id="watchparty-yt-container"
          key={`yt-wrap-${mediaUrl}`} 
          className="w-full h-full flex items-center justify-center bg-black"
        >
          <div id="watchparty-yt-player" className="w-full h-full pointer-events-auto" />
        </div>
      )}

      {/* Local Video Sync Requirement Overlay */}
      {isLocalFile && !hasMatchingLocalFile && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-md p-6 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mb-4 shadow-glow-brand">
            <Film className="w-8 h-8 text-brand-400 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Synchronized Downloaded Video</span>
          </div>

          <h3 className="text-xl font-bold text-white mb-1">
            Host is streaming a local file
          </h3>

          <div className="max-w-md bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 my-3 flex items-center justify-between gap-3 text-left w-full">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate font-mono">
                {localFileName || title}
              </p>
              <p className="text-xs text-slate-400">
                {localFileSize ? formatFileSize(localFileSize) : 'Local video'} • 100% Native 4K/1080p Quality
              </p>
            </div>
            <FolderOpen className="w-5 h-5 text-brand-400 flex-shrink-0" />
          </div>

          <p className="text-xs text-slate-300 max-w-md mb-5 leading-relaxed">
            Select your copy of this downloaded video to watch together in synchronized 4K with zero lag and zero buffering, or drag and drop it directly onto this player.
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-electric-blue hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 active:scale-95 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Select Downloaded Video File</span>
          </button>

          <span className="text-[11px] text-slate-500 mt-3">
            Supports .mp4, .webm, .mkv, .mov (reads directly from your device storage)
          </span>
        </div>
      )}

      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-brand-950/90 border-2 border-dashed border-brand-400 backdrop-blur-sm pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center mb-3 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-white mb-1">Drop Video File to Stream</h4>
          <p className="text-xs text-brand-200">Release to stream this video file in sync with the room</p>
        </div>
      )}

      {/* Floating Reaction Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {reactions.map((r) => {
          console.log('[VideoPlayer] Rendering reaction element:', r);
          return (
          <div
            key={r.id}
            data-testid="floating-reaction"
            style={{ left: `${r.xPercent}%` }}
            className="absolute bottom-16 animate-float flex flex-col items-center transition-all duration-1000 ease-out"
          >
            <span className="text-4xl filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] transform hover:scale-125 transition-transform">
              {r.emoji}
            </span>
            <span className="text-[10px] bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-slate-300 mt-1 whitespace-nowrap">
              {r.senderName}
            </span>
          </div>
        );})}
      </div>

      {/* Buffering Indicator */}
      {state.status === 'buffering' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase">Synchronizing Stream</span>
          </div>
        </div>
      )}

      {/* Error Message Screen */}
      {state.hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/95 z-30 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h4 className="text-lg font-bold text-white mb-1">Playback Error</h4>
          <p className="text-sm text-slate-400 max-w-md mb-4">{state.errorMessage}</p>
          <button 
            onClick={() => controls.seek(state.currentTime)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition"
          >
            Retry Video
          </button>
        </div>
      )}

      {/* Big Center Play/Pause button on pause */}
      {state.status === 'paused' && !state.hasError && (
        <div 
          data-testid="center-play-button"
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] z-10 transition-opacity ${mediaType === 'youtube' ? 'pointer-events-none' : ''} ${canControl ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="w-20 h-20 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-glow-brand hover:scale-110 active:scale-95 transition-all pointer-events-auto">
            <Play className="w-9 h-9 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Autoplay Muted Notice */}
      {state.isMuted && state.status === 'playing' && (
        <div 
          onClick={controls.toggleMute}
          className="absolute top-16 left-1/2 -translate-x-1/2 bg-brand-600/90 hover:bg-brand-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md cursor-pointer flex items-center gap-2 z-20 animate-bounce transition"
        >
          <VolumeX className="w-4 h-4 text-amber-300" />
          <span>Click to Unmute Audio</span>
        </div>
      )}

      {/* Top Header Overlay: Title & Live Sync Badge */}
      <div className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3">
          {isLocalFile ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>LOCAL 4K SYNC</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs font-medium">
              <Radio className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
              <span>LIVE ROOM</span>
            </div>
          )}
          <span className="text-white font-semibold text-sm drop-shadow truncate max-w-xs md:max-w-md">
            {localFileName || title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Local Video Stream Picker Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            title="Stream a downloaded or local video from your device"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 border border-white/10 hover:border-emerald-500 text-[11px] font-medium text-slate-200 transition"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Local Video</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/x-matroska,video/quicktime,video/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Direct Stream URL / Local File Info Copy Button */}
          {mediaUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const copyText = mediaUrl.startsWith('local://')
                  ? `Local Video: ${localFileName || title} (${localFileSize ? formatFileSize(localFileSize) : 'local'})`
                  : mediaUrl;
                navigator.clipboard.writeText(copyText);
                setCopiedStream(true);
                setTimeout(() => setCopiedStream(false), 2000);
              }}
              title={mediaUrl.startsWith('local://') ? `Copy local video details` : `Copy video stream URL: ${mediaUrl}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 border border-white/10 hover:border-brand-500 text-[11px] font-mono text-slate-200 transition"
            >
              <Link2 className="w-3 h-3 text-brand-400" />
              <span className="hidden md:inline">{mediaUrl.startsWith('local://') ? 'File Info' : 'Stream Link'}</span>
              {copiedStream ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
          )}

          {Math.abs(syncDrift) > 0.05 && (
            <div className="text-[11px] px-2 py-0.5 rounded bg-black/60 text-slate-300 border border-white/10 hidden sm:flex items-center gap-1">
              <span>Drift:</span>
              <span className={Math.abs(syncDrift) < 0.5 ? 'text-emerald-400' : 'text-amber-400 font-medium'}>
                {(syncDrift * 1000).toFixed(0)}ms
              </span>
            </div>
          )}

          {canControl ? (
            <span className="text-[11px] bg-brand-500/10 text-brand-300 border border-brand-500/30 px-2.5 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1.5" title="Anyone can play, pause, and seek video">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Open Control
            </span>
          ) : (
            <span className="text-xs bg-black/70 text-slate-400 border border-white/10 px-2.5 py-1 rounded-full">
              Host Controlled
            </span>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2.5 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Progress Bar / Scrubber */}
        <div className="relative group/timeline flex items-center w-full h-4 cursor-pointer">
          <div className="w-full h-1.5 group-hover/timeline:h-2 bg-white/20 rounded-full overflow-hidden transition-all relative">
            {/* Progress fill */}
            <div 
              className="h-full bg-gradient-to-r from-brand-500 to-electric-blue rounded-full transition-all relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Thumb marker */}
          <div 
            className="absolute w-3.5 h-3.5 bg-white rounded-full shadow -ml-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/timeline:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />
          {/* Invisible full-height range input */}
          <input
            type="range"
            min={0}
            max={state.duration || 100}
            step={0.5}
            value={state.currentTime}
            disabled={!canControl}
            onChange={handleSeekChange}
            aria-label="Seek time scrubber"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white text-sm">
          {/* Left Controls: Play, Skips, Volume, Time */}
          <div className="flex items-center gap-3">
            <button
              data-testid="controls-play-button"
              onClick={togglePlay}
              disabled={!canControl}
              title={canControl ? (state.status === 'playing' ? 'Pause' : 'Play') : 'Playback locked to host'}
              className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition disabled:opacity-50 disabled:hover:bg-transparent"
            >
              {state.status === 'playing' ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>

            <button
              onClick={() => handleQuickSkip(-10)}
              disabled={!canControl}
              title="Seek back 10s"
              className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleQuickSkip(10)}
              disabled={!canControl}
              title="Seek forward 10s"
              className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition disabled:opacity-50"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/volume ml-1">
              <button
                onClick={controls.toggleMute}
                title="Mute / Unmute"
                className="p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                {state.isMuted || state.volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-slate-200" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={state.isMuted ? 0 : state.volume}
                onChange={(e) => controls.setVolume(parseFloat(e.target.value))}
                aria-label="Volume slider"
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-500 opacity-70 group-hover/volume:opacity-100 transition"
              />
            </div>

            {/* Time display */}
            <div className="text-xs font-mono text-slate-300 ml-2 select-none">
              <span>{formatTime(state.currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span>{formatTime(state.duration)}</span>
            </div>
          </div>

          {/* Right Controls: Speed, Fullscreen */}
          <div className="flex items-center gap-2 relative">
            {/* Playback speed selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold tracking-wide transition flex items-center gap-1"
              >
                <span>{state.playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute right-0 bottom-full mb-2 bg-surface-card border border-surface-border rounded-lg shadow-xl py-1 w-24 z-30">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        controls.setPlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-brand-600/30 transition flex items-center justify-between ${state.playbackRate === rate ? 'text-brand-400 font-bold' : 'text-slate-300'}`}
                    >
                      <span>{rate}x</span>
                      {state.playbackRate === rate && <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={controls.toggleFullscreen}
              title="Fullscreen"
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

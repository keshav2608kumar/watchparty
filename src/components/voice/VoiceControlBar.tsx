import React from 'react';
import { 
  Mic, 
  MicOff, 
  Headphones, 
  PhoneOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  AlertCircle 
} from 'lucide-react';
import { RoomMember } from '../../types/room';

interface VoiceControlBarProps {
  isVoiceActive: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0 to 100
  error: string | null;
  activeVoiceMembers: RoomMember[];
  onJoinVoice: () => void;
  onLeaveVoice: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
}

export const VoiceControlBar: React.FC<VoiceControlBarProps> = ({
  isVoiceActive,
  isMuted,
  isDeafened,
  isSpeaking,
  audioLevel,
  error,
  activeVoiceMembers,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
  onToggleDeafen,
}) => {
  if (!isVoiceActive) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-card border border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Voice Chat</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  HD Audio
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeVoiceMembers.length > 0
                  ? `${activeVoiceMembers.length} member${activeVoiceMembers.length > 1 ? 's' : ''} currently in voice`
                  : 'Talk smoothly in real-time with friends while watching'}
              </p>
            </div>
          </div>

          <button
            onClick={onJoinVoice}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-semibold shadow-glow-sm transition"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Join Voice</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Visualizer bar heights calculated based on live audioLevel (0 to 100)
  const barHeights = [
    Math.max(15, Math.min(100, isMuted ? 15 : audioLevel * 0.8)),
    Math.max(20, Math.min(100, isMuted ? 15 : audioLevel * 1.3)),
    Math.max(25, Math.min(100, isMuted ? 15 : audioLevel * 1.6)),
    Math.max(20, Math.min(100, isMuted ? 15 : audioLevel * 1.1)),
    Math.max(15, Math.min(100, isMuted ? 15 : audioLevel * 0.6)),
  ];

  return (
    <div className="p-3 rounded-2xl bg-surface-card border border-surface-border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Left: Live status & Animated Audio Wave */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isSpeaking
              ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
              : isMuted
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              : 'bg-surface border border-surface-border text-slate-300'
          }`}>
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </div>
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Voice Connected</span>
            <span className="text-[10px] text-slate-400">
              ({activeVoiceMembers.length} active)
            </span>
          </div>

          {/* Real-time audio waveform animation */}
          <div className="flex items-end gap-1 h-3.5 mt-1">
            {barHeights.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isSpeaking
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                    : isMuted
                    ? 'bg-slate-600'
                    : 'bg-brand-400/80'
                }`}
              />
            ))}
            <span className="text-[10px] text-slate-400 ml-1.5 font-medium">
              {isDeafened ? 'Deafened' : isMuted ? 'Muted' : isSpeaking ? 'Speaking...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Controls (Mute, Deafen, Disconnect) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mic Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 border ${
            isMuted
              ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
              : 'bg-surface hover:bg-surface-hover text-slate-200 border-surface-border'
          }`}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Deafen Toggle */}
        <button
          onClick={onToggleDeafen}
          title={isDeafened ? 'Undeafen audio' : 'Deafen (mute voices)'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 border ${
            isDeafened
              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
              : 'bg-surface hover:bg-surface-hover text-slate-200 border-surface-border'
          }`}
        >
          {isDeafened ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Headphones className="w-3.5 h-3.5 text-slate-300" />}
          <span className="hidden sm:inline">{isDeafened ? 'Undeafen' : 'Deafen'}</span>
        </button>

        {/* Disconnect */}
        <button
          onClick={onLeaveVoice}
          title="Disconnect from voice chat"
          className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 transition active:scale-95"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

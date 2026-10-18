import React, { useState } from 'react';
import { Copy, Check, X, Share2, Users, Link2, Film } from 'lucide-react';

interface InviteModalProps {
  roomId: string;
  mediaUrl?: string;
  mediaType?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  roomId,
  mediaUrl,
  mediaType,
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedStreamUrl, setCopiedStreamUrl] = useState(false);

  if (!isOpen) return null;

  // Build full room invitation link with preloaded custom media params
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomId}`
    : `/room/${roomId}`;

  const inviteUrl = mediaUrl
    ? `${baseUrl}?mediaUrl=${encodeURIComponent(mediaUrl)}&mediaType=${mediaType || 'html5'}`
    : baseUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyStreamUrl = () => {
    if (!mediaUrl) return;
    navigator.clipboard.writeText(mediaUrl);
    setCopiedStreamUrl(true);
    setTimeout(() => setCopiedStreamUrl(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Share Watch Party</h3>
            <p className="text-xs text-slate-400">Invite friends or copy the custom video stream URL.</p>
          </div>
        </div>

        {/* Room Code Badge */}
        <div className="mb-4 p-3 rounded-xl bg-surface border border-surface-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Room Code</span>
            <span className="text-sm font-mono font-bold text-brand-400">{roomId}</span>
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
            <Users className="w-3 h-3" /> Ready to stream
          </span>
        </div>

        {/* Room Invitation Link */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-brand-400" />
            <span>Room Share Link (With Stream Preloaded)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 px-3 py-2 bg-surface border border-surface-border rounded-xl text-xs text-slate-200 font-mono select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-glow-sm'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Direct Custom Video Stream URL */}
        {mediaUrl && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-electric-blue" />
              <span>Direct Custom Stream URL</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={mediaUrl}
                className="flex-1 px-3 py-2 bg-surface border border-surface-border rounded-xl text-xs text-slate-200 font-mono select-all focus:outline-none truncate"
              />
              <button
                onClick={handleCopyStreamUrl}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  copiedStreamUrl
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface hover:bg-surface-hover text-slate-200 border border-surface-border'
                }`}
              >
                {copiedStreamUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-surface/50 border border-surface-border/50 text-[11px] text-slate-400">
          <strong className="text-slate-300">Open Party:</strong> Anyone with this link can join instantly, control playback (play/pause/seek), and speak freely via microphone.
        </div>
      </div>
    </div>
  );
};

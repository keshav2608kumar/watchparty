import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Radio, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isValidRoomId } from '../../utils/idGenerator';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onClose }) => {
  const [roomInput, setRoomInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user, updateDisplayName } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let clean = roomInput.trim();
    if (!clean) {
      setError('Please enter a room code or invite link.');
      return;
    }

    let queryParams = '';
    // Check if user pasted a full URL
    if (clean.includes('/room/')) {
      const parts = clean.split('/room/');
      const afterRoom = parts[parts.length - 1];
      const qIdx = afterRoom.indexOf('?');
      if (qIdx >= 0) {
        queryParams = afterRoom.substring(qIdx);
        clean = afterRoom.substring(0, qIdx).split('#')[0].trim();
      } else {
        clean = afterRoom.split('#')[0].trim();
      }
    }

    if (!isValidRoomId(clean)) {
      setError('Invalid room code format. Example: cine-lounge-4821');
      return;
    }

    if (customName.trim()) {
      updateDisplayName(customName.trim());
    }

    onClose();
    navigate(`/room/${clean}${queryParams}`);
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

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Join a WatchParty</h3>
            <p className="text-xs text-slate-400">Enter a room code or paste an invite link.</p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Room Code or URL
            </label>
            <input
              type="text"
              required
              placeholder="e.g. cine-lounge-4821 or https://..."
              value={roomInput}
              onChange={(e) => {
                setRoomInput(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-3.5 py-2.5 bg-surface border border-surface-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
            />
            {error && <p className="text-xs text-rose-400 mt-1.5 font-medium">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={user.name}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-surface-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Leave empty to keep "{user.name}"</p>
          </div>

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
              className="px-5 py-2.5 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 transition"
            >
              <span>Join Party</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

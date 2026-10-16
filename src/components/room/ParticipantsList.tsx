import React from 'react';
import { Users, Crown, ArrowRightLeft } from 'lucide-react';
import { RoomMember } from '../../types/room';

interface ParticipantsListProps {
  members: RoomMember[];
  currentUserId: string;
  hostId: string;
  onTransferHost: (newHostId: string) => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  members,
  currentUserId,
  hostId,
  onTransferHost,
}) => {
  const isCurrentHost = currentUserId === hostId;

  return (
    <div className="flex flex-col h-full bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-lg">
      <div className="p-3.5 border-b border-surface-border flex items-center justify-between bg-surface/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-electric-blue" />
          <h3 className="text-sm font-semibold text-slate-100">Audience</h3>
        </div>
        <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {members.length} Online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {members.map((member) => {
          const isThisHost = member.id === hostId;
          const isMe = member.id === currentUserId;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 rounded-xl bg-surface/50 border border-surface-border/60 hover:bg-surface-hover/80 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <img
                    src={member.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`}
                    alt={member.name}
                    className="w-8 h-8 rounded-full bg-surface border border-surface-border"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface-card" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {member.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-slate-400 bg-white/10 px-1 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    {isThisHost ? (
                      <span className="text-amber-400 font-medium flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> Room Host
                      </span>
                    ) : (
                      'Viewer'
                    )}
                  </span>
                </div>
              </div>

              {/* Transfer host button for current host */}
              {isCurrentHost && !isMe && (
                <button
                  onClick={() => {
                    if (window.confirm(`Transfer host controls to ${member.name}?`)) {
                      onTransferHost(member.id);
                    }
                  }}
                  title="Make this participant the room host"
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg text-xs flex items-center gap-1 transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Pass Host</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

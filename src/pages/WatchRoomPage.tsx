import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Share2, 
  Settings, 
  LogOut, 
  Crown, 
  Wifi, 
  MessageSquare, 
  Users, 
  ListVideo, 
  BarChart3,
  Copy,
  Check,
  Shield,
  HelpCircle
} from 'lucide-react';
import { RoomProvider, useRoom } from '../context/RoomContext';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { ReactionPicker } from '../components/room/ReactionPicker';
import { ChatPanel } from '../components/room/ChatPanel';
import { ParticipantsList } from '../components/room/ParticipantsList';
import { PlaylistDrawer } from '../components/room/PlaylistDrawer';
import { PollsPanel } from '../components/room/PollsPanel';
import { InviteModal } from '../components/room/InviteModal';
import { useAuth } from '../context/AuthContext';
import { MediaType } from '../types/room';
import { normalizeCustomMediaUrl } from '../utils/formatters';

type ActiveTab = 'chat' | 'audience' | 'queue' | 'polls';

const WatchRoomInner: React.FC = () => {
  const {
    roomId,
    playbackState,
    members,
    messages,
    playlist,
    polls,
    reactions,
    connectionMode,
    isHost,
    canControl,
    syncDrift,
    settings,
    registerPlayer,
    broadcastPlaybackCommand,
    sendChatMessage,
    sendReaction,
    addToPlaylist,
    removeFromPlaylist,
    playFromPlaylist,
    createPoll,
    votePoll,
    transferHost,
    updateSettings,
  } = useRoom();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLocalPlayerAction = (action: 'play' | 'pause' | 'seek', position: number) => {
    if (action === 'play') {
      broadcastPlaybackCommand('playing', position, playbackState.playbackRate);
    } else if (action === 'pause') {
      broadcastPlaybackCommand('paused', position, playbackState.playbackRate);
    } else if (action === 'seek') {
      broadcastPlaybackCommand(playbackState.playbackStatus, position, playbackState.playbackRate);
    }
  };

  const currentMediaTitle = playlist.find(p => p.url === playbackState.mediaUrl)?.title || 'Video Stream';

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-surface-border bg-surface/70 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-30">
        {/* Left: Room Info & Live Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Leave watch party room?')) {
                navigate('/discover');
              }
            }}
            title="Leave party"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">Room:</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-brand-500 text-xs font-mono font-semibold text-brand-300 transition"
              title="Click to copy room code"
            >
              <span>{roomId}</span>
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
            </button>
          </div>

          {/* Realtime Transport Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface border border-surface-border">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionMode === 'supabase-cloud' || connectionMode === 'cloud-relay'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : 'bg-brand-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]'
              }`}
            />
            <span className="text-slate-300">
              {connectionMode === 'supabase-cloud'
                ? 'Cloud Realtime'
                : connectionMode === 'cloud-relay'
                ? 'Global Cloud Relay'
                : connectionMode === 'local-relay'
                ? 'Local Network Relay'
                : 'Local Multi-Tab Sync'}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Host status badge */}
          {isHost ? (
            <span className="flex items-center gap-1 text-xs text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full font-semibold">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Room Host</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400 bg-surface border border-surface-border px-2.5 py-1 rounded-full font-medium hidden sm:inline-block">
              {canControl ? 'Co-Pilot Control' : 'Viewer Sync'}
            </span>
          )}

          {/* Invite Button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-sm transition active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="Room settings & sync telemetry"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-surface border border-surface-border hover:bg-surface-hover transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Player Canvas */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 overflow-y-auto">
          {/* Video Player */}
          <div className="w-full max-w-5xl mx-auto">
            <VideoPlayer
              mediaType={playbackState.mediaType}
              mediaUrl={playbackState.mediaUrl}
              title={currentMediaTitle}
              isHost={isHost}
              canControl={canControl}
              reactions={reactions}
              onLocalUserAction={handleLocalPlayerAction}
              onPlayerControlsReady={registerPlayer}
              syncDrift={syncDrift}
            />

            {/* Video Sub-bar: Title, Reactions Picker, and Telemetry */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-surface-card border border-surface-border">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white truncate">{currentMediaTitle}</h2>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                  <span>Engine: {playbackState.mediaType.toUpperCase()}</span>
                  <span>•</span>
                  <span>Revision: #{playbackState.revision}</span>
                  <span>•</span>
                  <span>{members.length} watching together</span>
                </div>
              </div>

              {/* Reaction Bar */}
              <div className="flex-shrink-0">
                <ReactionPicker onSendReaction={sendReaction} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Tabs on Desktop & Mobile) */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-surface-border flex flex-col bg-surface/40 flex-shrink-0 h-80 lg:h-full">
          {/* Tabs Header */}
          <div className="flex items-center border-b border-surface-border bg-surface-card px-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === 'chat'
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
              <span className="text-[10px] bg-surface px-1.5 py-0.2 rounded-full text-slate-400">
                {messages.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audience')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === 'audience'
                  ? 'border-electric-blue text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Audience</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-full">
                {members.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === 'queue'
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListVideo className="w-3.5 h-3.5" />
              <span>Queue</span>
              <span className="text-[10px] bg-surface px-1.5 py-0.2 rounded-full text-slate-400">
                {playlist.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('polls')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === 'polls'
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Polls</span>
              {polls.length > 0 && (
                <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.2 rounded-full">
                  {polls.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Panels */}
          <div className="flex-1 overflow-hidden p-2">
            {activeTab === 'chat' && (
              <ChatPanel
                messages={messages}
                currentUserId={user.id}
                hostId={playbackState.hostId}
                onSendMessage={sendChatMessage}
              />
            )}

            {activeTab === 'audience' && (
              <ParticipantsList
                members={members}
                currentUserId={user.id}
                hostId={playbackState.hostId}
                onTransferHost={transferHost}
              />
            )}

            {activeTab === 'queue' && (
              <PlaylistDrawer
                playlist={playlist}
                currentMediaUrl={playbackState.mediaUrl}
                canControl={canControl}
                onPlayItem={playFromPlaylist}
                onAddItem={addToPlaylist}
                onRemoveItem={removeFromPlaylist}
                currentUserId={user.id}
                currentUserName={user.name}
              />
            )}

            {activeTab === 'polls' && (
              <PollsPanel
                polls={polls}
                currentUserId={user.id}
                currentUserName={user.name}
                onVote={votePoll}
                onCreatePoll={createPoll}
              />
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        roomId={roomId}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-white mb-4">Room Settings & Sync Telemetry</h3>

            {/* Host Permissions Section */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-surface-border">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Allow Guests to Control</h4>
                  <p className="text-[11px] text-slate-400">
                    If enabled, any participant can play, pause, seek, and change media.
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={settings.allowGuestsToControl}
                  onChange={(e) => updateSettings({ allowGuestsToControl: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Sync Diagnostics */}
              <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Synchronization Telemetry
                </span>
                <div className="flex justify-between text-slate-300">
                  <span>Authoritative Revision:</span>
                  <span className="font-mono font-bold text-brand-400">#{playbackState.revision}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Local Drift:</span>
                  <span className={`font-mono font-bold ${Math.abs(syncDrift) < 0.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {(syncDrift * 1000).toFixed(1)} ms
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Transport Mode:</span>
                  <span className="font-medium text-electric-blue capitalize">{connectionMode}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Drift Tolerance:</span>
                  <span className="font-mono">500 ms</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const WatchRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();

  if (!roomId) {
    return <div className="p-10 text-center text-white">Invalid Room ID</div>;
  }

  const rawUrl = searchParams.get('mediaUrl') || '';
  const parsed = rawUrl ? normalizeCustomMediaUrl(rawUrl) : null;
  const mediaType = (searchParams.get('mediaType') as MediaType) || (parsed ? parsed.type : undefined);
  const mediaUrl = parsed ? parsed.url : (rawUrl || undefined);
  const title = searchParams.get('title') || (mediaUrl ? 'Custom Video Stream' : undefined);
  const mediaId = searchParams.get('mediaId') || 'init-media';

  const initialMedia = mediaUrl && mediaType
    ? { id: mediaId, url: mediaUrl, type: mediaType, title: title || 'Video Stream' }
    : undefined;

  return (
    <RoomProvider roomId={roomId} initialMedia={initialMedia}>
      <WatchRoomInner />
    </RoomProvider>
  );
};

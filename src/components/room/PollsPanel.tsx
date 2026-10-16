import React, { useState } from 'react';
import { BarChart3, Plus, CheckCircle2, Vote } from 'lucide-react';
import { Poll } from '../../types/room';
import { generateId } from '../../utils/idGenerator';

interface PollsPanelProps {
  polls: Poll[];
  currentUserId: string;
  currentUserName: string;
  onVote: (pollId: string, optionId: string) => void;
  onCreatePoll: (poll: Poll) => void;
}

export const PollsPanel: React.FC<PollsPanelProps> = ({
  polls,
  currentUserId,
  currentUserName,
  onVote,
  onCreatePoll,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const handleAddOptionField = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = question.trim();
    const cleanOpts = options.map(o => o.trim()).filter(Boolean);

    if (!cleanQ || cleanOpts.length < 2) return;

    const newPoll: Poll = {
      id: generateId(),
      roomId: '',
      creatorId: currentUserId,
      creatorName: currentUserName,
      question: cleanQ,
      options: cleanOpts.map((text) => ({
        id: generateId(),
        text,
        voteCount: 0,
        voterIds: [],
      })),
      createdAt: Date.now(),
      isActive: true,
      totalVotes: 0,
    };

    onCreatePoll(newPoll);
    setQuestion('');
    setOptions(['', '']);
    setShowCreate(false);
  };

  return (
    <div className="flex flex-col h-full bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-lg">
      <div className="p-3.5 border-b border-surface-border flex items-center justify-between bg-surface/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-100">Audience Polls</h3>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600/90 hover:bg-brand-500 text-white text-xs font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Poll</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Create Poll Card */}
        {showCreate && (
          <form onSubmit={handleSubmit} className="p-3.5 rounded-xl bg-surface border border-brand-500/30 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200">Create a Group Poll</h4>
            <input
              type="text"
              placeholder="e.g. Which movie should we watch next?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
            />

            <div className="space-y-1.5">
              {options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
                />
              ))}
            </div>

            {options.length < 4 && (
              <button
                type="button"
                onClick={handleAddOptionField}
                className="text-[11px] text-brand-400 hover:text-brand-300 font-medium"
              >
                + Add another option
              </button>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg"
              >
                Launch Poll
              </button>
            </div>
          </form>
        )}

        {polls.length === 0 && !showCreate ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Vote className="w-8 h-8 text-brand-400/50 mb-2" />
            <p className="text-xs font-medium text-slate-300">No active polls</p>
            <p className="text-[11px] text-slate-500 mt-1">Start a poll to see what your friends think!</p>
          </div>
        ) : (
          polls.map((poll) => {
            const hasVoted = poll.options.some((o) => o.voterIds.includes(currentUserId));

            return (
              <div
                key={poll.id}
                className="p-3.5 rounded-xl bg-surface/70 border border-surface-border/70 space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-slate-100">{poll.question}</h4>
                  <span className="text-[10px] text-slate-400 bg-surface-card px-2 py-0.5 rounded-full border border-surface-border">
                    {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {poll.options.map((opt) => {
                    const isMyChoice = opt.voterIds.includes(currentUserId);
                    const pct = poll.totalVotes > 0 
                      ? Math.round((opt.voteCount / poll.totalVotes) * 100) 
                      : 0;

                    return (
                      <button
                        key={opt.id}
                        disabled={hasVoted}
                        onClick={() => onVote(poll.id, opt.id)}
                        className={`w-full text-left p-2 rounded-lg border text-xs relative overflow-hidden transition ${
                          isMyChoice 
                            ? 'border-brand-500 bg-brand-500/10' 
                            : 'border-surface-border hover:border-slate-600 bg-surface-card'
                        } disabled:cursor-default`}
                      >
                        {/* Vote bar fill */}
                        {hasVoted && (
                          <div
                            className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                              isMyChoice ? 'bg-brand-500/25' : 'bg-white/5'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        )}

                        <div className="relative flex items-center justify-between z-10">
                          <span className="flex items-center gap-1.5 font-medium text-slate-200 truncate">
                            {isMyChoice && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />}
                            {opt.text}
                          </span>
                          {hasVoted && (
                            <span className="text-[11px] font-mono text-slate-400 ml-2">
                              {pct}% ({opt.voteCount})
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                  <span>Created by {poll.creatorName}</span>
                  {hasVoted && <span className="text-brand-400 font-medium">Vote Recorded</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

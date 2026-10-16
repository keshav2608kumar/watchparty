import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Shield, Sparkles } from 'lucide-react';
import { ChatMessage } from '../../types/room';
import { formatTimestamp } from '../../utils/formatters';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  hostId: string;
  onSendMessage: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  hostId,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-3.5 border-b border-surface-border flex items-center justify-between bg-surface/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-100">Live Party Chat</h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-surface-hover">
          {messages.length} messages
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Sparkles className="w-8 h-8 text-brand-400/50 mb-2" />
            <p className="text-xs font-medium text-slate-300">No messages yet</p>
            <p className="text-[11px] text-slate-500 mt-1">Be the first to say hello to the room!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isHost = msg.senderId === hostId;

            if (msg.isSystem) {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="text-[11px] text-brand-300 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-full font-medium inline-block">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  src={msg.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderId}`}
                  alt={msg.senderName}
                  className="w-7 h-7 rounded-full bg-surface border border-surface-border flex-shrink-0 mt-0.5"
                />
                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-slate-300">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    {isHost && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded font-medium border border-amber-400/20">
                        <Shield className="w-2.5 h-2.5" /> Host
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs break-words shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-tr-xs'
                        : 'bg-surface-hover text-slate-200 border border-surface-border rounded-tl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-surface-border bg-surface/70">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            maxLength={500}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="w-full pl-3.5 pr-10 py-2.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-1.5 p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};

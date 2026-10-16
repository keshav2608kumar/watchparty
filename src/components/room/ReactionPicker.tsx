import React, { useState } from 'react';
import confetti from 'canvas-confetti';

interface ReactionPickerProps {
  onSendReaction: (emoji: string) => void;
}

const EMOJIS = ['❤️', '🔥', '😂', '👏', '🍿', '🚀', '😱', '🎉'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSendReaction }) => {
  const [lastSentTime, setLastSentTime] = useState<number>(0);

  const handleClick = (emoji: string) => {
    const now = Date.now();
    if (now - lastSentTime < 300) return; // Rate limit 300ms

    setLastSentTime(now);
    onSendReaction(emoji);

    if (emoji === '🎉') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 }
      });
    }
  };

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-surface/90 border border-surface-border backdrop-blur-md overflow-x-auto no-scrollbar">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleClick(emoji)}
          className="text-lg p-1.5 hover:scale-125 active:scale-95 transition-transform rounded-lg hover:bg-white/10"
          title={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

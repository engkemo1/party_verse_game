import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../SocketContext';

export function Chat() {
  const { chatMessages, sendMessage, room, lang } = useSocket();
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
  };

  const allowedPhases = ["LOBBY", "ROUND_RESULT", "FINAL_RESULT"];
  const isChatAllowed = allowedPhases.includes(room?.phase);

  if (!isChatAllowed) return null;

  return (
    <div className="chat-box glass-card">
      <div className="chat-messages" ref={scrollRef}>
        {chatMessages.map((m) => (
          <div key={m.id} className="chat-msg">
            <span className="chat-msg__name">{m.senderName}:</span>
            <span className="chat-msg__text">{m.text}</span>
          </div>
        ))}
      </div>
      <form className="chat-input-area" onSubmit={handleSend}>
        <input 
          className="chat-input" 
          placeholder={lang === 'ar' ? 'اكتب هنا...' : 'Type here...'} 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
        />
        <button className="chat-send-btn">➔</button>
      </form>
    </div>
  );
}

export function ReactionsOverlay() {
  const { reactions, sendReaction, room } = useSocket();
  const EMOJIS = ['😂', '🔥', '😱', '👏', '😡', '🤯'];

  return (
    <>
      {/* Floating Emojis */}
      <div className="reactions-container">
        {reactions.map((r) => (
          <div key={r.id} className="floating-emoji" style={{ left: `${r.x}%` }}>
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Reaction Buttons — only show when in a room */}
      {room && (
        <div className="reaction-bar">
          {EMOJIS.map(e => (
            <button key={e} className="reaction-btn" onClick={() => sendReaction(e)}>
              {e}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function QuickChat() {
  const { sendQuickChat, lang, room } = useSocket();
  const phrases = {
    ar: ["لعبة جيدة!", "أنت سريع!", "حظ أوفر", "😂 مضحك"],
    en: ["GG!", "Too fast!", "Nice try", "😂 LOL"]
  };
  const list = phrases[lang] || phrases.en;

  if (room?.phase !== 'PLAYING') return null;

  return (
    <div className="quick-chat-bar">
      {list.map(p => (
        <button key={p} className="quick-chat-btn" onClick={() => sendQuickChat(p)}>
          {p}
        </button>
      ))}
    </div>
  );
}

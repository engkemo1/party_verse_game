import { useState, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { Chat } from '../components/Chat';
import AdSense, { RewardedAd } from '../components/AdSense';

function AnimatedScore({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = display;
    const end = value;
    if (start === end) return;
    const duration = 1000;
    let startTime = null;

    const animate = (now) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      setDisplay(Math.floor(progress * (end - start) + start));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{display}</span>;
}

export default function Result() {
  const { room, myId, nextRound, resetLocal } = useSocket();
  const [showAd, setShowAd] = useState(false);
  const [adFinished, setAdFinished] = useState(false);

  useEffect(() => {
    if (room?.phase === 'FINAL_RESULT') {
      const timer = setTimeout(() => setShowAd(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [room?.phase]);

  if (!room) return null;

  const isHost = room.hostId === myId;
  const isFinal = room.phase === 'FINAL_RESULT';
  const sorted = Object.values(room.players).sort((a, b) => b.score - a.score);
  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  if (isFinal && showAd && !adFinished) {
    return <RewardedAd lang={room.lang} onComplete={() => setAdFinished(true)} />;
  }


  if (isFinal) {
    return (
      <div className="podium-screen">
        <h1 className="podium-title">{room.lang === 'ar' ? '🏆 أبطال الفوضى!' : '🏆 CHAOS CHAMPIONS!'}</h1>
        
        <div className="podium-display">
          {/* Silver - 2nd */}
          {podium[1] && (
            <div className="podium-tier podium-tier--2">
              <span className="podium-avatar">{podium[1].avatar}</span>
              <div className="podium-pedestal">{podium[1].name}</div>
              <span className="podium-score">{podium[1].score}</span>
            </div>
          )}
          
          {/* Gold - 1st */}
          {podium[0] && (
            <div className="podium-tier podium-tier--1">
              <span className="podium-avatar">{podium[0].avatar}</span>
              <div className="podium-pedestal">{podium[0].name}</div>
              <span className="podium-score">{podium[0].score}</span>
            </div>
          )}

          {/* Bronze - 3rd */}
          {podium[2] && (
            <div className="podium-tier podium-tier--3">
              <span className="podium-avatar">{podium[2].avatar}</span>
              <div className="podium-pedestal">{podium[2].name}</div>
              <span className="podium-score">{podium[2].score}</span>
            </div>
          )}
        </div>

        <div className="leaderboard glass-card mb-md mt-lg">
          {rest.map((p, idx) => (
            <div className="leaderboard-row" key={p.id}>
              <span className="leaderboard-row__rank">#{idx + 4}</span>
              <span>{p.avatar} {p.name}</span>
              <span className="leaderboard-row__score">{p.score}</span>
            </div>
          ))}
        </div>

        <div className="flex-col gap-sm w-full">
          {isHost && (
            <button className="btn btn--primary btn--glow w-full" onClick={() => nextRound()}>
              {room.lang === 'ar' ? 'العب مرة أخرى 🔄' : 'PLAY AGAIN 🔄'}
            </button>
          )}
          <button className="btn btn--secondary w-full" onClick={resetLocal}>
            {room.lang === 'ar' ? 'خروج 🚪' : 'EXIT 🚪'}
          </button>
        </div>
      </div>
    );
  }

  const roundWinner = sorted[0];

  return (
    <div className="result-screen">
      <h1 className="result-title">{room.lang === 'ar' ? 'انتهت الجولة!' : 'ROUND OVER!'}</h1>

      <div className="leaderboard glass-card mb-md">
        {sorted.map((p, idx) => (
          <div className={`leaderboard-row ${p.id === roundWinner.id ? 'leaderboard-row--winner' : ''}`} key={p.id}>
            <div className="leaderboard-row__left">
              <span className={`leaderboard-row__rank leaderboard-row__rank--${idx + 1}`}>
                #{idx + 1}
              </span>
              <span style={{ fontSize: '1.2rem' }}>{p.avatar}</span>
              <span className="leaderboard-row__name">
                {p.name} {p.id === room.hostId && <span className="host-badge">HOST</span>}
              </span>
            </div>
            <span className="leaderboard-row__score">
              <AnimatedScore value={p.score} />
            </span>
          </div>
        ))}
      </div>
      
      {/* Viral Highlights Section */}
      {room.viralHighlights && room.viralHighlights.length > 0 && (
        <div className="highlights-container mb-md">
          <h2 className="highlights-title">{room.lang === 'ar' ? '🔥 أبرز اللحظات' : '🔥 VIRAL MOMENTS'}</h2>
          <div className="highlights-list">
            {room.viralHighlights.map((h, i) => (
              <div key={i} className="highlight-card">
                <span className="highlight-icon">{h.type === 'FAIL' ? '💀' : '🚀'}</span>
                <div className="highlight-info">
                  <div className="highlight-msg">{h.msg}</div>
                  {h.name && <div className="highlight-player">{h.name}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-col gap-md w-full mt-auto">
        {isHost ? (
          <button 
            className="btn btn--primary btn--glow" 
            onClick={nextRound}
            disabled={room.isNextRoundTriggered}
          >
            {room.isNextRoundTriggered 
              ? (room.lang === 'ar' ? 'جاري التحميل...' : 'STARTING...') 
              : (room.lang === 'ar' ? 'الجولة التالية ➔' : 'NEXT ROUND ➔')}
          </button>
        ) : (
          <div className="waiting-host-msg">
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>
            {room.lang === 'ar' ? 'بانتظار المضيف...' : 'Waiting for host...'}
          </div>
        )}
      </div>

      <Chat />
      
      {/* Round Result Banner Ad */}
      <AdSense slot="8328203300" style={{ display: 'block', height: '90px', marginTop: '20px' }} />
    </div>
  );
}


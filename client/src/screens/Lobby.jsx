import { useMemo, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { Chat } from '../components/Chat';
import { audioEngine } from '../utils/audioEngine';

const CONFETTI_COLORS = ['#8A2BE2', '#00E5FF', '#FF007F', '#39FF14', '#FFD700', '#FF6B35'];

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      bg: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 3}s`,
      size: 6 + Math.random() * 10,
    })), []);

  return (
    <div className="confetti-wrapper">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            top: '-5%',
            width: p.size,
            height: p.size,
            backgroundColor: p.bg,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

export default function Lobby() {
  const { room, myId, readyUp, startGame, updateSettings, lang, kickPlayer } = useSocket();

  useEffect(() => {
    audioEngine.playMusic('lobby');
    return () => audioEngine.stopMusic();
  }, []);

  if (!room) return null;

  const players = Object.values(room.players);
  const isHost = room.hostId === myId;
  const me = room.players[myId];
  const allReady = players.every((p) => p.ready);
  const readyCount = players.filter((p) => p.ready).length;

  const labels = {
    ar: { 
      presets: 'النظام', rounds: 'الجولات', duration: 'المدة',
      random: 'عشوائي', random_desc: 'كل شيء معاً',
      chaos: 'فوضى سريعة', chaos_desc: 'سرعة وفخاخ',
      mind: 'ألعاب عقل', mind_desc: 'ذكاء وذاكرة',
      madness: 'جنون الحفلة', madness_desc: 'خيانة وتفاعل',
      short: 'قصيرة', medium: 'متوسطة', long: 'طويلة',
      ready: 'جاهز', readyUp: 'جاهز؟', start: '🚀 ابدأ اللعبة', minPlayers: 'تحتاج لاعبين على الأقل',
      finalResults: '🏆 النتائج النهائية'
    },
    en: { 
      presets: 'Mode', rounds: 'Rounds', duration: 'Time',
      random: 'Random', random_desc: 'Mixed Madness',
      chaos: 'Quick Chaos', chaos_desc: 'Speed & Traps',
      mind: 'Mind Games', mind_desc: 'Logic & Memory',
      madness: 'Party Madness', madness_desc: 'Social Betrayal',
      short: 'Short', medium: 'Med', long: 'Long',
      ready: 'READY!', readyUp: 'READY UP', start: '🚀 START GAME', minPlayers: 'Min 2 players',
      finalResults: '🏆 FINAL RESULTS'
    }
  };
  const t = labels[lang] || labels.en;

  const renderPodium = () => {
    if (!room.lastResults) return null;
    const winner = room.lastResults[0];
    const second = room.lastResults[1];
    const third = room.lastResults[2];

    return (
      <div className="glass-card mb-md" style={{ padding: '16px', background: 'rgba(255, 215, 0, 0.05)', borderColor: 'var(--gold)' }}>
        <Confetti />
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--gold)', fontWeight: 900, fontSize: '1.5rem' }}>
          {t.finalResults}
        </h2>
        <div className="podium">
          {second && (
            <div className="podium-slot">
              <div className="podium-avatar podium-avatar--2nd" style={{ backgroundColor: second.color }}>
                {second.avatar}
              </div>
              <span className="podium-name">{second.name}</span>
              <span className="podium-score">{second.score} pts</span>
              <div className="podium-bar podium-bar--2nd" />
            </div>
          )}
          {winner && (
            <div className="podium-slot">
              <div className="podium-avatar podium-avatar--1st" style={{ backgroundColor: winner.color }}>
                {winner.avatar}
              </div>
              <span className="podium-name">{winner.name}</span>
              <span className="podium-score">{winner.score} pts</span>
              <div className="podium-bar podium-bar--1st" />
            </div>
          )}
          {third && (
            <div className="podium-slot">
              <div className="podium-avatar podium-avatar--3rd" style={{ backgroundColor: third.color }}>
                {third.avatar}
              </div>
              <span className="podium-name">{third.name}</span>
              <span className="podium-score">{third.score} pts</span>
              <div className="podium-bar podium-bar--3rd" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="text-center mb-md">
        <span className="room-code-badge">ROOM CODE</span>
        <div className="room-code-value">{room.id}</div>
      </div>

      {renderPodium()}

      {isHost && (
        <div className="settings-panel">
          {/* Game Modes */}
          <div className="settings-group">
            <span className="settings-label">{t.presets || 'Mode'}</span>
            <div className="segmented-control">
              {['RANDOM', 'CHAOS', 'MIND', 'MADNESS'].map((m) => {
                const isActive = m === 'RANDOM' 
                  ? (!room.selectedModes || room.selectedModes.length === 0)
                  : room.selectedModes?.includes(m);
                
                return (
                  <button
                    key={m}
                    className={`segment-btn ${isActive ? 'active' : ''}`}
                    style={{ minHeight: '60px' }}
                    onClick={() => {
                      let newModes = room.selectedModes ? [...room.selectedModes] : [];
                      if (m === 'RANDOM') {
                        newModes = [];
                      } else {
                        if (newModes.includes(m)) {
                          newModes = newModes.filter(x => x !== m);
                        } else {
                          newModes.push(m);
                        }
                      }
                      updateSettings({ selectedModes: newModes });
                    }}
                  >
                    <div className="flex-col">
                      <span style={{ fontSize: '0.9rem' }}>{t[m.toLowerCase()] || m}</span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.6, fontWeight: 500 }}>{t[m.toLowerCase() + '_desc']}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="settings-group mt-md">
            <span className="settings-label">{t.rounds}</span>
            <div className="segmented-control">
              {[10, 15, 20].map((r) => (
                <button
                  key={r}
                  className={`segment-btn ${room.totalRounds === r ? 'active' : ''}`}
                  onClick={() => updateSettings({ totalRounds: r })}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="glass-card mb-md">
        <div className="player-grid">
          {players.map((p) => (
            <div className="player-card" key={p.id}>
              <div
                className={`player-avatar ${p.ready ? 'player-avatar--ready' : ''}`}
                style={{ backgroundColor: p.color }}
              >
                {p.avatar}
                {p.ready && <span className="player-avatar__check">✓</span>}
                {isHost && p.id !== myId && (
                  <button className="kick-btn" onClick={() => kickPlayer(p.id)} title="Kick">×</button>
                )}
              </div>
              <span className="player-name">
                {p.name} {p.id === room.hostId && <span className="host-badge">HOST</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="ready-count">{readyCount} / {players.length} {lang === 'ar' ? 'جاهزون' : 'READY'}</p>

      <div className="flex-col gap-md w-full mt-auto">
        {isHost ? (
          <div className="flex-col gap-sm">
            {players.length < 2 && <p style={{ color: 'var(--hot-pink)', fontSize: '0.8rem', textAlign: 'center' }}>{t.minPlayers}</p>}
            <button
              className="btn btn--primary"
              disabled={!allReady || players.length < 2}
              onClick={startGame}
            >
              {t.start}
            </button>
          </div>
        ) : (
          <button
            className={`btn ${me?.ready ? 'btn--green' : 'btn--primary'}`}
            onClick={readyUp}
          >
            {me?.ready ? `✅ ${t.ready}` : `👋 ${t.readyUp}`}
          </button>
        )}
      </div>

      <Chat />
    </>
  );
}

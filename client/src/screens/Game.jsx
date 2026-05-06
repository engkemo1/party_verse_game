import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { QuickChat } from '../components/Chat';
import { audioEngine } from '../utils/audioEngine';

export default function Game() {
  const { room, myId, sendAction, socket } = useSocket();
  const [twist, setTwist] = useState(null);

  useEffect(() => {
    // Start background music
    audioEngine.playMusic('playing');
    audioEngine.playSFX('round_start');
    
    if (!socket) return;
    const handleChaos = (data) => {
      if (data.type === 'TWIST' || data.type === 'BETRAYAL' || data.type === 'VIRAL') {
        audioEngine.playSFX('glitch');
        setTwist({ message: data.message, type: data.type });
        setTimeout(() => setTwist(null), 3500);
      }
    };
    socket.on('chaos_event', handleChaos);
    
    return () => {
      socket.off('chaos_event', handleChaos);
      audioEngine.stopMusic();
    };
  }, [socket]);

  if (!room || !room.game) return null;

  const { game, lang } = room;
  const currentChallenge = game.playlist[game.activeIndex];
  const duration = currentChallenge.duration || 10;
  const timeLeft = game.timeLeft;
  const pct = (timeLeft / duration) * 100;
  const barClass = pct <= 30 ? 'timer-bar-fill--danger' : pct <= 50 ? 'timer-bar-fill--warn' : 'timer-bar-fill--safe';
  const sortedPlayers = Object.values(room.players).sort((a, b) => b.score - a.score);

  // Determine theme and effects
  const mode = game.modeLabel === 'الفوضى' || game.modeLabel === 'CHAOS' ? 'chaos' : (game.modeLabel === 'العقل' || game.modeLabel === 'MIND' ? 'mind' : 'madness');
  const isVortex = game.globalModifier?.type === 'CHAOS_RANDOM' || (timeLeft <= 5 && mode === 'chaos');
  const isGlitched = !!twist || game.globalModifier?.type === 'GHOST_MODE';

  return (
    <div className={`game-screen theme--${mode} ${isVortex ? 'vortex-mode' : ''}`} style={pct <= 20 ? { border: '3px solid var(--hot-pink)' } : {}}>
      {isGlitched && <div className="glitch-overlay" />}
      
      <div className="timer-bar-wrap">
        <div className={`timer-bar-fill ${barClass}`} style={{ width: `${pct}%`, boxShadow: `0 0 15px var(--theme-primary)` }} />
      </div>

      {/* Global Round Modifier */}
      {game.globalModifier && (
        <div className="global-modifier-banner" style={{ background: 'var(--theme-primary)', boxShadow: `0 4px 15px var(--theme-glow)` }}>
          <span className="glow-text">{game.globalModifier.icon} {game.globalModifier.label}</span>
        </div>
      )}

      {/* Sudden Twist Toast */}
      {twist && (
        <div className={`twist-toast ${twist.type === 'VIRAL' ? 'twist-toast--viral' : ''}`} style={{ borderColor: 'var(--theme-primary)' }}>
          <div className="twist-toast__content">
            {twist.message}
          </div>
        </div>
      )}

      <div className="game-header">
        <div className="flex-col align-start">
          <span className="game-header__mode" style={{ color: 'var(--theme-primary)' }}>
            {lang === 'ar' ? (game.modeLabel === 'CHAOS' ? 'الفوضى' : game.modeLabel === 'MIND' ? 'العقل' : game.modeLabel === 'MADNESS' ? 'الجنون' : game.modeLabel) : game.modeLabel}
          </span>
          <span className="game-header__round">{lang === 'ar' ? 'التحدي' : 'CHALLENGE'} {game.activeIndex + 1}/{game.playlist.length}</span>
        </div>
        
        <div className="playlist-progress">
          {game.playlist.map((_, idx) => (
            <div key={idx} className={`playlist-dot ${idx === game.activeIndex ? 'active' : idx < game.activeIndex ? 'done' : ''}`} style={idx === game.activeIndex ? { background: 'var(--theme-primary)' } : {}} />
          ))}
        </div>

        <span className={`game-header__time ${pct <= 30 ? 'game-header__time--danger' : ''}`} style={{ color: pct <= 30 ? 'var(--hot-pink)' : 'var(--theme-primary)' }}>{timeLeft}s</span>
      </div>

      <div className="game-label-wrap">
        <div className="game-label" style={{ color: 'var(--theme-primary)', textShadow: `0 0 10px var(--theme-glow)` }}>{currentChallenge.label}</div>
        <div className="game-description">{currentChallenge.description}</div>
      </div>

      <div className="game-area">
        {(currentChallenge.type === 'CLICK_FAST' || currentChallenge.type === 'CHAOS_TAP') && <ClickGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'COLOR_GRID' && <ColorGridGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'NEON_DASH' && <NeonDashGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'REACTION_TIME' && <ReactionGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'SPEED_MATH' && <SpeedMathGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'TRIVIA' && <TriviaGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'TRUE_FALSE' && <TrueFalseGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'EMOJI_GUESS' && <EmojiGuessGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'ESTIMATION' && <EstimationGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'COLOR_MATCH' && <ColorMatchGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'MEMORY_FLASH' && <MemoryFlashGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'WHACK_A_MOLE' && <WhackMoleGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'FAST_TYPE' && <FastTypeGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'SCRAMBLED_WORD' && <ScrambledWordGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'FIND_THE_ODD' && <FindOddGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'SIMON_SAYS' && <SimonSaysGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'SOCIAL_VOTE' && <SocialVoteGame room={room} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'DONT_PRESS' && <DontPressGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'SPAM_STOP' && <SpamStopGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'ONE_VS_ALL' && <TriviaGame game={currentChallenge} myId={myId} sendAction={sendAction} isOneVsAll={true} />}
        {currentChallenge.type === 'SECRET_CHOICE' && <SecretChoiceGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'FINISH_SENTENCE' && <FinishSentenceGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'FAKE_BUTTONS' && <FakeButtonsGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'REVENGE_ROUND' && <RevengeGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'SUDDEN_DEATH' && <SuddenDeathGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'INVISIBLE_MAZE' && <InvisibleMazeGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'BLIND_BID' && <BlindBidGame game={currentChallenge} room={room} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'HEARTBEAT' && <HeartbeatGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
      </div>

      <QuickChat />

      <div className="live-scores">
        {sortedPlayers.map((p) => (
          <div className={`live-score-chip ${p.winStreak >= 3 ? 'live-score-chip--streak' : ''}`} key={p.id}>
            <div className="live-score-chip__avatar" style={{ backgroundColor: p.color }}>{p.avatar}</div>
            <div className="live-score-chip__info">
              <span className="live-score-chip__name">{p.name}</span>
              <span className="live-score-chip__pts">{p.score} pts</span>
            </div>
            {p.winStreak >= 3 && <span className="streak-fire">🔥</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────
// MINI-GAME COMPONENTS
// ──────────────────────────────────

function NeonDashGame({ game, myId, sendAction }) {
  const [targets, setTargets] = useState([]);
  
  useEffect(() => {
    const spawn = setInterval(() => {
      setTargets(prev => [
        ...prev.slice(-4), 
        { id: Date.now(), t: Math.random() * 80 + 10, l: Math.random() * 80 + 10, s: Math.random() * 0.5 + 0.5 }
      ]);
    }, 800);
    return () => clearInterval(spawn);
  }, []);

  return (
    <div className="game-area" style={{ position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', borderRadius: '24px' }}>
      {targets.map(t => (
        <button
          key={t.id}
          className="neon-target"
          style={{
            position: 'absolute',
            top: `${t.t}%`,
            left: `${t.l}%`,
            transform: `scale(${t.s})`,
            background: 'var(--theme-primary)',
            boxShadow: `0 0 20px var(--theme-primary)`,
            width: '60px', height: '60px', borderRadius: '50%', border: 'none'
          }}
          onClick={(e) => {
            e.stopPropagation();
            sendAction('click');
            setTargets(prev => prev.filter(x => x.id !== t.id));
            audioEngine.playSFX('pop');
          }}
        />
      ))}
    </div>
  );
}

function ClickGame({ game, myId, sendAction }) {
  const [localClicks, setLocalClicks] = useState(0);
  const myClicks = game.clicks?.[myId] ?? 0;
  const handleTap = () => { sendAction('click'); setLocalClicks(p => p + 1); };
  const shrink = game.chaosEffect === 'SHRINK_BUTTON';
  const size = shrink ? Math.max(80, 220 - localClicks * 5) : 220;
  return (
    <div className="tap-area">
      <button className="tap-button" style={{ width: size, height: size, background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))` }} onClick={handleTap}>
        TAP! <span className="tap-button__count">{myClicks}</span>
      </button>
    </div>
  );
}

function ReactionGame({ game, myId, sendAction }) {
  const myTime = game.playerTimes?.[myId];
  return (
    <div className="tap-area">
      {game.reactPhase !== 'GO' ? (
        <div className="react-wait">WAIT...</div>
      ) : myTime ? (
        <div className="react-result">{myTime}ms</div>
      ) : (
        <button className="react-go" style={{ background: 'var(--neon-green)' }} onClick={() => sendAction('react_tap')}>TAP!</button>
      )}
    </div>
  );
}

function SpeedMathGame({ game, myId, sendAction }) {
  const myAnswer = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="math-text" style={{ fontSize: '3rem', fontWeight: 900 }}>{game.questionText}</div>
      <div className="grid-2 gap-sm w-full">
        {game.answers.map((ans, i) => (
          <button key={i} className={`btn ${myAnswer === ans ? 'btn--primary' : 'btn--secondary'}`} 
                  style={myAnswer === ans ? { background: 'var(--theme-primary)' } : {}}
                  onClick={() => sendAction('math_answer', ans)} disabled={!!myAnswer}>{ans}</button>
        ))}
      </div>
    </div>
  );
}

function TriviaGame({ game, myId, sendAction, isOneVsAll }) {
  const myAns = game.playerAnswers?.[myId] || (isOneVsAll && game.winnerId === myId ? 'SELECTED' : null);
  const winner = isOneVsAll && game.winnerId;
  return (
    <div className="flex-col gap-md w-full">
      {isOneVsAll && <div className="badge badge--gold mb-sm">🥇 FIRST TO ANSWER!</div>}
      <div className="trivia-question">{game.questionText}</div>
      <div className="flex-col gap-sm w-full">
        {game.answers.map((ans, i) => (
          <button key={i} className={`btn ${myAns === ans || (winner === myId && game.correctIndex === i) ? 'btn--primary' : 'btn--secondary'}`} 
                  style={myAns === ans ? { background: 'var(--theme-primary)' } : {}}
                  onClick={() => sendAction('answer', ans)} disabled={!!myAns || !!winner}>{ans}</button>
        ))}
      </div>
    </div>
  );
}

function TrueFalseGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="trivia-question">{game.questionText}</div>
      <div className="flex-row gap-md w-full">
        <button className={`btn flex-1 ${myAns === 'TRUE' ? 'btn--primary' : 'btn--secondary'}`} 
                style={myAns === 'TRUE' ? { background: 'var(--neon-green)' } : {}}
                onClick={() => sendAction('answer', 'TRUE')} disabled={!!myAns}>TRUE</button>
        <button className={`btn flex-1 ${myAns === 'FALSE' ? 'btn--primary' : 'btn--secondary'}`} 
                style={myAns === 'FALSE' ? { background: 'var(--hot-pink)' } : {}}
                onClick={() => sendAction('answer', 'FALSE')} disabled={!!myAns}>FALSE</button>
      </div>
    </div>
  );
}

function EmojiGuessGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div style={{ fontSize: '5rem', textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>{game.emojis}</div>
      <div className="grid-2 gap-sm w-full">
        {game.answers.map((ans, i) => (
          <button key={i} className={`btn ${myAns === ans ? 'btn--primary' : 'btn--secondary'}`} 
                  style={myAns === ans ? { background: 'var(--theme-primary)' } : {}}
                  onClick={() => sendAction('answer', ans)} disabled={!!myAns}>{ans}</button>
        ))}
      </div>
    </div>
  );
}

function EstimationGame({ game, myId, sendAction }) {
  const [val, setVal] = useState('');
  const myGuess = game.playerGuesses?.[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="trivia-question">{game.questionText}</div>
      {myGuess !== undefined ? <div className="guess-result badge badge--gold" style={{ fontSize: '2rem' }}>{myGuess}</div> : (
        <div className="flex-col gap-sm w-full">
          <input className="text-input" style={{ fontSize: '2rem' }} type="number" placeholder="..." value={val} onChange={e => setVal(e.target.value)} />
          <button className="btn btn--primary" style={{ background: 'var(--theme-primary)' }} onClick={() => sendAction('estimate', val)}>OK</button>
        </div>
      )}
    </div>
  );
}

function ColorMatchGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers?.[myId];
  const COLOR_MAP = { 
    RED: '#FF4444', BLUE: '#4488FF', GREEN: '#44FF44', 
    YELLOW: '#FFFF44', PURPLE: '#CC44FF', ORANGE: '#FF8844' 
  };
  
  const buttonColors = ["PURPLE", "ORANGE", "BLUE", "RED", "GREEN", "YELLOW"];

  return (
    <div className="flex-col gap-md items-center w-full">
      <div style={{ 
        fontSize: 'clamp(3.5rem, 15vw, 6rem)', 
        fontWeight: 900, 
        color: COLOR_MAP[game.displayColor],
        textShadow: '0 4px 15px rgba(0,0,0,0.6)',
        marginBottom: '30px'
      }}>
        {game.wordColor}
      </div>
      <div className="grid-2 gap-md w-full">
        {game.options.map((opt, idx) => (
          <button 
            key={opt} 
            className={`btn ${myAns === opt ? 'btn--active' : ''}`}
            style={{ 
              background: COLOR_MAP[buttonColors[idx % buttonColors.length]], 
              color: '#000',
              fontWeight: 900,
              border: myAns === opt ? '5px solid white' : '2px solid rgba(255,255,255,0.2)',
              height: '85px',
              fontSize: '1.5rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }} 
            onClick={() => sendAction('color_answer', opt)} 
            disabled={!!myAns}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MemoryFlashGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md items-center w-full">
      {game.showPhase ? (
        <>
          <div className="badge badge--gold mb-sm" style={{ padding: '10px 20px', fontSize: '1.2rem' }}>👀 {game.lang === 'ar' ? 'احفظ جيداً!' : 'MEMORIZE!'}</div>
          <div className="flex-row gap-md justify-center flex-wrap">
            {game.sequence.map((e, i) => (
              <span key={i} style={{ 
                fontSize: 'clamp(4rem, 20vw, 6rem)', 
                animation: `pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${i * 0.15}s forwards`,
                opacity: 0,
                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
              }} className="memory-emoji">{e}</span>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="trivia-question">{game.taskText}</div>
          <div className="grid-4 gap-sm w-full">
            {game.allOptions.map(e => (
              <button 
                key={e} 
                className={`btn ${myAns === e ? 'btn--primary' : 'btn--secondary'}`} 
                style={{ 
                  fontSize: 'clamp(1.5rem, 6vw, 3rem)', 
                  aspectRatio: '1/1',
                  background: myAns === e ? 'var(--theme-primary)' : '' 
                }} 
                onClick={() => sendAction('memory_answer', e)} 
                disabled={!!myAns}
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WhackMoleGame({ game, myId, sendAction }) {
  const [pos, setPos] = useState({ t: 50, l: 50 });
  const move = () => setPos({ t: Math.random() * 80 + 5, l: Math.random() * 80 + 5 });
  return (
    <div style={{ position: 'relative', width: '100%', height: 350, background: 'rgba(0,0,0,0.4)', borderRadius: 24, border: '2px solid var(--theme-primary)' }}>
      <button className="mole" style={{ 
        position: 'absolute', top: `${pos.t}%`, left: `${pos.l}%`, 
        fontSize: '3rem', cursor: 'pointer', background: 'none', border: 'none',
        filter: 'drop-shadow(0 0 10px var(--theme-primary))'
      }} 
              onClick={() => { sendAction('click'); move(); audioEngine.playSFX('pop'); }}>🔨</button>
      <div className="mole-score" style={{ position: 'absolute', top: 10, right: 20, fontSize: '2rem', fontWeight: 900 }}>{game.clicks[myId] || 0}</div>
    </div>
  );
}

function FastTypeGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="type-target" style={{ color: 'var(--theme-primary)' }}>{game.targetWord}</div>
      <input className="text-input text-input--large" style={{ fontSize: '2rem', border: '3px solid var(--theme-primary)' }} placeholder="..." autoFocus onChange={e => { if(e.target.value.toUpperCase() === game.targetWord) sendAction('answer', e.target.value.toUpperCase()); }} disabled={!!myAns} />
    </div>
  );
}

function ScrambledWordGame({ game, myId, sendAction }) {
  const [val, setVal] = useState('');
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="scrambled-text" style={{ color: 'var(--theme-primary)' }}>{game.scrambled}</div>
      <div className="flex-col gap-sm w-full">
        <input className="text-input text-input--large" placeholder="..." value={val} onChange={e => setVal(e.target.value)} disabled={!!myAns} />
        <button className="btn btn--primary" style={{ background: 'var(--theme-primary)' }} onClick={() => sendAction('answer', val)} disabled={!!myAns || !val}>GO</button>
      </div>
    </div>
  );
}

function FindOddGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="grid-3 gap-sm">
      {game.items.map((e, i) => (
        <button key={i} className="btn btn--secondary" style={{ fontSize: '3rem', height: '100px' }} onClick={() => sendAction('answer', i)} disabled={myAns !== undefined}>{e}</button>
      ))}
    </div>
  );
}

function SimonSaysGame({ game, myId, sendAction }) {
  const myProg = game.playerProgress[myId] || 0;
  return (
    <div className="flex-col gap-md items-center">
      <div className="flex-row gap-sm mb-md">
        {game.sequence.map((c, i) => <div key={i} style={{ width: 25, height: 25, borderRadius: '50%', background: c, opacity: i < myProg ? 1 : 0.2, boxShadow: i < myProg ? `0 0 15px ${c}` : 'none' }}></div>)}
      </div>
      <div className="grid-2 gap-md w-full">
        {['RED', 'BLUE', 'GREEN', 'YELLOW'].map(c => (
          <button key={c} className="btn" style={{ background: c, height: 80, border: '4px solid rgba(255,255,255,0.2)' }} onClick={() => sendAction('answer', c)}></button>
        ))}
      </div>
    </div>
  );
}

function SocialVoteGame({ room, myId, sendAction }) {
  const myVote = room.game.playlist[room.game.activeIndex].votes[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="trivia-question">{room.game.playlist[room.game.activeIndex].question}</div>
      <div className="grid-2 gap-sm">
        {Object.values(room.players).map(p => (
          <button key={p.id} className={`btn ${myVote === p.id ? 'btn--primary' : 'btn--secondary'}`} 
                  style={myVote === p.id ? { background: 'var(--theme-primary)' } : {}}
                  onClick={() => sendAction('vote', p.id)} disabled={!!myVote || p.id === myId}>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function DontPressGame({ game, myId, sendAction }) {
  const pressed = game.pressed?.[myId];
  const exploded = game.exploded;
  
  return (
    <div className="flex-col gap-md items-center">
      <div className={`bomb-timer ${exploded ? 'bomb-timer--exploded' : ''}`} style={{ 
        fontSize: '3rem', 
        animation: !exploded && !pressed ? 'pulse 0.5s infinite' : 'none',
        color: exploded ? 'var(--hot-pink)' : 'white'
      }}>
        {exploded ? '💥 EXPLODED!' : '💣 ...'}
      </div>

      <button 
        className={`big-red-btn ${exploded ? 'big-red-btn--dead' : ''}`} 
        disabled={!!pressed || exploded} 
        onClick={() => sendAction('press')}
        style={{ 
          width: 200, height: 200, borderRadius: '50%', 
          background: exploded ? '#333' : 'red', 
          border: '12px solid #8B0000', fontSize: '1.2rem', fontWeight: 900, 
          color: 'white', cursor: (pressed || exploded) ? 'default' : 'pointer', 
          boxShadow: exploded ? 'none' : '0 12px 0 #8B0000, 0 0 40px rgba(255,0,0,0.3)',
          transition: 'all 0.2s'
        }}
      >
        {pressed ? 'LOCKED IN!' : exploded ? 'TOO LATE!' : (game.lang === 'ar' ? 'اضغط للنقاط!' : 'PRESS FOR POINTS!')}
      </button>

      {pressed && !exploded && <div className="badge badge--green mt-md">STAYING SAFE... ✅</div>}
      {pressed && exploded && <div className="streak-fire" style={{ fontSize: '4rem', marginTop: 20 }}>🔥</div>}
    </div>
  );
}

function SpamStopGame({ game, myId, sendAction }) {
  const failed = game.failed?.includes(myId);
  return (
    <div className="flex-col gap-md items-center w-full">
      <div style={{ fontSize: '3rem', fontWeight: 900, color: game.isStopped ? 'var(--hot-pink)' : 'white', textShadow: game.isStopped ? '0 0 20px var(--hot-pink)' : 'none', textAlign: 'center' }}>
        {game.isStopped ? (game.lang === 'ar' ? '🛑 توقف!!!' : '🛑 STOP!!!') : (game.lang === 'ar' ? '⚡ اضغط!!!' : '⚡ SPAM!!!')}
      </div>
      <button 
        className={`tap-button ${failed ? 'tap-button--failed' : ''}`} 
        style={{ 
          background: game.isStopped ? 'var(--hot-pink)' : 'var(--theme-primary)', 
          opacity: failed ? 0.6 : 1,
          width: 200, height: 200,
          boxShadow: game.isStopped ? '0 0 40px var(--hot-pink)' : '0 0 40px var(--theme-primary)',
          border: failed ? '8px solid black' : 'none'
        }}
        onClick={() => sendAction('click')}
        disabled={failed}
      >
        {failed ? '💀 FAIL' : 'TAP!'}
        <span className="tap-button__count">{game.clicks[myId] || 0}</span>
      </button>
    </div>
  );
}

function SecretChoiceGame({ game, myId, sendAction }) {
  const myAns = game.playerChoices[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="trivia-question">{game.lang === 'ar' ? 'اختر شيئاً فريداً!' : 'Pick something unique!'}</div>
      <div className="grid-4 gap-sm w-full">
        {game.options.map(opt => (
          <button key={opt} className={`btn ${myAns === opt ? 'btn--primary' : 'btn--secondary'}`} 
                  style={{ fontSize: '2.5rem', height: '100px', background: myAns === opt ? 'var(--theme-primary)' : '' }} onClick={() => sendAction('secret_choice', opt)} disabled={!!myAns}>{opt}</button>
        ))}
      </div>
      {myAns && <div className="badge badge--green mt-sm" style={{ alignSelf: 'center' }}>{game.lang === 'ar' ? 'تم الاختيار! ✅' : 'Choice locked! ✅'}</div>}
    </div>
  );
}

function FinishSentenceGame({ game, myId, sendAction }) {
  const [val, setVal] = useState('');
  const submitted = !!game.playerAnswers[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="trivia-question">{game.prompt}</div>
      {!submitted ? (
        <div className="flex-col gap-sm w-full">
          <input className="text-input text-input--large" placeholder="..." value={val} onChange={e => setVal(e.target.value)} />
          <button className="btn btn--primary" style={{ background: 'var(--theme-primary)' }} onClick={() => sendAction('finish_sentence', val)} disabled={!val}>GO</button>
        </div>
      ) : <div className="badge badge--green" style={{ fontSize: '1.5rem', padding: '15px' }}>Submitted! ✅</div>}
    </div>
  );
}

function FakeButtonsGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers[myId];
  const correctIdx = game.correctIndex;
  
  return (
    <div className="flex-col gap-md items-center">
      <div className="trivia-question" style={{ fontSize: '1.2rem', opacity: 0.8 }}>{game.lang === 'ar' ? 'واحد منهم حقيقي...' : 'One of these is real...'}</div>
      <div className="grid-3 gap-sm w-full" style={{ maxWidth: '350px' }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const isReal = i === correctIdx;
          return (
            <button 
              key={i} 
              className={`btn ${myAns === i ? (isReal ? 'btn--success' : 'btn--danger') : 'btn--secondary'}`} 
              style={{ 
                aspectRatio: '1/1',
                width: '100%',
                fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                boxShadow: isReal ? '0 0 8px rgba(255,255,255,0.2)' : 'none',
                background: myAns === i ? (isReal ? 'var(--neon-green)' : 'var(--hot-pink)') : '',
                color: myAns === i ? 'black' : 'white'
              }}
              onClick={() => sendAction('fake_press', i)} 
              disabled={myAns !== undefined}
            >
              ?
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RevengeGame({ game, myId, sendAction }) {
  const isTarget = myId === game.lastPlaceId;
  const [val, setVal] = useState('');
  const submitted = !!game.playerGuesses[myId];
  return (
    <div className="flex-col gap-md items-center w-full">
      <div className="trivia-question">{game.questionText}</div>
      {isTarget ? (
        !submitted ? (
          <div className="flex-col gap-sm w-full">
            <input className="text-input" style={{ fontSize: '2rem' }} type="number" placeholder="1-10" value={val} onChange={e => setVal(e.target.value)} />
            <button className="btn btn--primary" style={{ background: 'var(--theme-primary)' }} onClick={() => sendAction('revenge_guess', val)}>GUESS</button>
          </div>
        ) : <div className="badge" style={{ fontSize: '1.5rem' }}>Guessed! 🎯</div>
      ) : <div className="text-secondary" style={{ fontSize: '1.2rem', animation: 'pulse 1.5s infinite' }}>Waiting for last place... ⏳</div>}
    </div>
  );
}

function SuddenDeathGame({ game, myId, sendAction }) {
  const winner = game.winnerId;
  return (
    <div className="flex-col gap-md items-center">
      <div className="trivia-question" style={{ fontSize: '2rem' }}>{game.task}</div>
      <button className="tap-button" disabled={!!winner} onClick={() => sendAction('sudden_tap')}
              style={{ width: 220, height: 220, background: 'var(--gold)', color: 'black', boxShadow: '0 0 50px rgba(255,215,0,0.4)' }}>
        {winner ? 'Too late!' : 'TAP!'}
      </button>
      {winner === myId && <div className="badge badge--gold" style={{ fontSize: '2rem', marginTop: 20 }}>🏆 YOU WIN!</div>}
    </div>
  );
}

function ColorGridGame({ game, myId, sendAction }) {
  const grid = game.playerGrids[myId];
  const [isShaking, setIsShaking] = useState(false);

  if (!grid) return null;

  const handleTileClick = (index) => {
    if (index === grid.targetIndex) {
      sendAction('color_grid_tap', index);
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      audioEngine.playSFX('wrong');
    }
  };

  return (
    <div className={`color-grid-container ${isShaking ? 'shake' : ''}`} 
         style={{ 
           display: 'grid', 
           gridTemplateColumns: `repeat(${grid.size}, 1fr)`, 
           gap: '10px',
           width: '100%',
           maxWidth: '400px',
           aspectRatio: '1/1',
           margin: '0 auto',
           padding: '10px',
           background: 'rgba(255,255,255,0.05)',
           borderRadius: '24px'
         }}>
      {Array.from({ length: grid.size * grid.size }).map((_, i) => (
        <div
          key={i}
          className="color-tile"
          onClick={() => handleTileClick(i)}
          style={{
            backgroundColor: i === grid.targetIndex ? grid.targetColor : grid.baseColor,
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'transform 0.1s, opacity 0.2s',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}
        />
      ))}
    </div>
  );
}

function InvisibleMazeGame({ game, myId, sendAction }) {
  const [showPath, setShowPath] = useState(true);
  const [localFailed, setLocalFailed] = useState(false);
  const [clicked, setClicked] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setShowPath(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const progress = game.playerProgress?.[myId] || 0;
  const isFailed = game.failed?.includes(myId) || localFailed;
  const isComplete = progress === game.path.length;

  const handleTile = (idx) => {
    if (showPath || isFailed || isComplete) return;
    if (game.path[progress] === idx) {
      setClicked(prev => [...prev, idx]);
      sendAction('maze_step', idx);
      audioEngine.playSFX('pop');
    } else {
      setLocalFailed(true);
      sendAction('maze_step', idx);
      audioEngine.playSFX('wrong');
    }
  };

  return (
    <div className="game-area">
      <div className={`maze-grid ${isFailed ? 'shake-fail' : ''}`} style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${game.size}, 1fr)`,
        gap: '8px',
        width: '100%',
        maxWidth: '350px',
        aspectRatio: '1/1',
        margin: '0 auto',
        padding: '16px',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)'
      }}>
        {Array.from({ length: game.size * game.size }).map((_, idx) => {
          const isPath = game.path.includes(idx);
          const isClickedCorrect = clicked.includes(idx) || (showPath && isPath);
          return (
            <button
              key={idx}
              className="maze-tile"
              onClick={() => handleTile(idx)}
              style={{
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                background: isClickedCorrect 
                  ? 'var(--theme-secondary)' 
                  : 'rgba(255,255,255,0.05)',
                boxShadow: isClickedCorrect ? '0 0 15px var(--theme-secondary)' : 'none',
                transition: 'all 0.3s',
                cursor: showPath || isFailed || isComplete ? 'not-allowed' : 'pointer',
                opacity: isFailed ? 0.5 : 1
              }}
            />
          );
        })}
      </div>
      {isComplete && <h2 style={{color: 'var(--neon-green)', marginTop: 20}}>SUCCESS!</h2>}
      {isFailed && <h2 style={{color: 'var(--hot-pink)', marginTop: 20}}>FAILED!</h2>}
    </div>
  );
}

function BlindBidGame({ game, room, myId, sendAction }) {
  const [bid, setBid] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const isBidPlaced = !!game.bids?.[myId] || submitted;
  const myScore = Math.max(0, room.players[myId]?.score || 0);

  const handleSubmit = () => {
    setSubmitted(true);
    sendAction('blind_bid', bid);
    audioEngine.playSFX('bell');
  };

  return (
    <div className="game-area flex-col gap-4">
      <div className="glass-card" style={{ textAlign: 'center', borderColor: 'var(--gold)' }}>
        <h3 style={{ color: 'var(--gold)', marginBottom: 10 }}>PRIZE: {game.prize} PTS</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Highest unique bid wins. You lose what you bid!</p>
        <p style={{ color: 'var(--theme-primary)', fontWeight: 'bold', marginTop: 10 }}>Your Max Bid: {myScore} PTS</p>
      </div>

      {!isBidPlaced ? (
        <div className="glass-card flex-col gap-4" style={{ marginTop: 20 }}>
          <h1 style={{ textAlign: 'center', fontSize: '3rem', color: 'var(--theme-primary)' }}>{bid}</h1>
          <input 
            type="range" 
            min="0" 
            max={myScore} 
            step="50" 
            value={bid} 
            onChange={(e) => setBid(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--theme-primary)' }}
          />
          <button className="btn btn--primary" onClick={handleSubmit} disabled={myScore === 0}>SUBMIT BID</button>
        </div>
      ) : (
        <h2 style={{ marginTop: 30, color: 'var(--electric-blue)' }}>Bid Placed: {game.bids?.[myId] ?? bid}</h2>
      )}
    </div>
  );
}

function HeartbeatGame({ game, myId, sendAction }) {
  const [taps, setTaps] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // Visual pulse for the first 3 beats
    let beatCount = 0;
    const interval = setInterval(() => {
      beatCount++;
      if (beatCount <= 3) {
        setPulse(true);
        audioEngine.playSFX('tick');
        setTimeout(() => setPulse(false), 150);
      } else {
        clearInterval(interval);
      }
    }, game.msPerBeat);

    return () => clearInterval(interval);
  }, [game.msPerBeat]);

  const handleTap = () => {
    if (taps < 3) {
      setTaps(p => p + 1);
      sendAction('heartbeat_tap');
      audioEngine.playSFX('pop');
    }
  };

  return (
    <div className="game-area flex-col align-center justify-center">
      <button 
        className="heartbeat-btn"
        onClick={handleTap}
        disabled={taps >= 3}
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: 'none',
          background: 'radial-gradient(circle, var(--theme-primary), transparent)',
          transform: pulse ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: pulse ? '0 0 50px var(--theme-primary)' : '0 0 20px var(--theme-primary)',
          cursor: taps >= 3 ? 'not-allowed' : 'pointer',
          opacity: taps >= 3 ? 0.3 : 1
        }}
      >
        <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff' }}>{taps}/3</span>
      </button>
      <p style={{ marginTop: 30, color: 'var(--text-secondary)', textAlign: 'center' }}>
        Keep the rhythm! Tap exactly on the 4th, 5th, and 6th beats.
      </p>
    </div>
  );
}

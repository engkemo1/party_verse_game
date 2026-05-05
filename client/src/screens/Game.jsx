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

  const { game, currentRound, totalRounds, lang } = room;
  const currentChallenge = game.playlist[game.activeIndex];
  const duration = currentChallenge.duration || 10;
  const timeLeft = game.timeLeft;
  const pct = (timeLeft / duration) * 100;
  const barClass = pct <= 30 ? 'timer-bar-fill--danger' : pct <= 50 ? 'timer-bar-fill--warn' : 'timer-bar-fill--safe';
  const sortedPlayers = Object.values(room.players).sort((a, b) => b.score - a.score);

  return (
    <div className={`game-screen ${twist ? 'shake' : ''}`} style={pct <= 20 ? { border: '3px solid var(--hot-pink)' } : {}}>
      <div className="timer-bar-wrap">
        <div className={`timer-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
      </div>

      {/* Global Round Modifier */}
      {game.globalModifier && (
        <div className="global-modifier-banner">
          <span className="glow-text">{game.globalModifier.icon} {game.globalModifier.label}</span>
        </div>
      )}

      {/* Sudden Twist Toast */}
      {twist && (
        <div className={`twist-toast ${twist.type === 'VIRAL' ? 'twist-toast--viral' : ''}`}>
          <div className="twist-toast__content">
            {twist.message}
          </div>
        </div>
      )}

      {/* Result Reveal Overlay */}
      {room.phase === "CHALLENGE_RESULT" && (
        <div className="result-reveal-overlay">
          <div className="result-reveal-card">
            <span className="result-reveal-title">{lang === 'ar' ? 'الإجابة الصحيحة' : 'CORRECT ANSWER'}</span>
            <div className="result-reveal-value">
              {(() => {
                const val = currentChallenge.answers ? currentChallenge.answers[currentChallenge.correctIndex] : (currentChallenge.correctAnswer ? 'TRUE' : 'FALSE');
                if (lang === 'ar') {
                  if (val === 'TRUE') return 'صح';
                  if (val === 'FALSE') return 'خطأ';
                }
                return val;
              })()}
            </div>
            <div className="result-reveal-feedback">
              {(() => {
                const myAns = currentChallenge.playerAnswers?.[myId];
                const isTrueFalse = !currentChallenge.answers;
                const correct = isTrueFalse ? (myAns === (currentChallenge.correctAnswer ? 'TRUE' : 'FALSE')) : (myAns === currentChallenge.answers[currentChallenge.correctIndex]);
                if (lang === 'ar') return correct ? '✅ رائع!' : '❌ للأسف!';
                return correct ? '✅ NICE!' : '❌ OOPS!';
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="game-header">
        <div className="flex-col align-start">
          <span className="game-header__mode">
            {lang === 'ar' ? (game.modeLabel === 'CHAOS' ? 'الفوضى' : game.modeLabel === 'MIND' ? 'العقل' : game.modeLabel === 'MADNESS' ? 'الجنون' : game.modeLabel) : game.modeLabel}
          </span>
          <span className="game-header__round">{lang === 'ar' ? 'التحدي' : 'CHALLENGE'} {game.activeIndex + 1}/{game.playlist.length}</span>
        </div>
        
        <div className="playlist-progress">
          {game.playlist.map((_, idx) => (
            <div key={idx} className={`playlist-dot ${idx === game.activeIndex ? 'active' : idx < game.activeIndex ? 'done' : ''}`} />
          ))}
        </div>

        <span className={`game-header__time ${pct <= 30 ? 'game-header__time--danger' : ''}`}>{timeLeft}s</span>
      </div>

      <div className="game-label-wrap">
        <div className="game-label">{currentChallenge.label}</div>
        <div className="game-description">{currentChallenge.description}</div>
        {currentChallenge.trick && (
          <div className="trick-badge">
            <span className="trick-icon">{currentChallenge.trick.icon}</span>
            <span className="trick-label">{currentChallenge.trick.label}</span>
          </div>
        )}
      </div>

      {/* Chaos Modifiers Banner */}
      {game.modifiers && game.modifiers.length > 0 && (
        <div className="modifiers-wrap">
          {game.modifiers.map(m => (
            <div key={m.type} className="modifier-badge">
              <span className="modifier-icon">{m.icon}</span>
              <span className="modifier-label">{m.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Game Area */}
      <div className="game-area">
        {(currentChallenge.type === 'CLICK_FAST' || currentChallenge.type === 'CHAOS_TAP') && <ClickGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
        {currentChallenge.type === 'COLOR_GRID' && <ColorGridGame game={currentChallenge} myId={myId} sendAction={sendAction} />}
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
      </div>

      <QuickChat />

      {/* Live Scores */}
      <div className="live-scores">
        {sortedPlayers.map((p) => (
          <div className="live-score-chip" key={p.id}>
            <div className="live-score-chip__avatar" style={{ backgroundColor: p.color }}>{p.avatar}</div>
            <div className="live-score-chip__info">
              <span className="live-score-chip__name">{p.name}</span>
              <span className="live-score-chip__pts">{p.score} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────
// MINI-GAME COMPONENTS
// ──────────────────────────────────

function ClickGame({ game, myId, sendAction }) {
  const [localClicks, setLocalClicks] = useState(0);
  const myClicks = game.clicks?.[myId] ?? 0;
  const handleTap = () => { sendAction('click'); setLocalClicks(p => p + 1); };
  const shrink = game.chaosEffect === 'SHRINK_BUTTON';
  const size = shrink ? Math.max(80, 220 - localClicks * 5) : 220;
  return (
    <div className="tap-area">
      <button className="tap-button" style={{ width: size, height: size }} onClick={handleTap}>
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
        <button className="react-go" onClick={() => sendAction('react_tap')}>TAP!</button>
      )}
    </div>
  );
}

function SpeedMathGame({ game, myId, sendAction }) {
  const myAnswer = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md">
      <div className="math-text">{game.questionText}</div>
      <div className="grid-2 gap-sm">
        {game.answers.map((ans, i) => (
          <button key={i} className={`btn ${myAnswer === ans ? 'btn--primary' : 'btn--secondary'}`} 
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
    <div className="flex-col gap-md">
      {isOneVsAll && <div className="badge badge--gold mb-sm">🥇 FIRST TO ANSWER!</div>}
      <div className="question-text">{game.questionText}</div>
      <div className="flex-col gap-sm">
        {game.answers.map((ans, i) => (
          <button key={i} className={`btn ${myAns === ans || (winner === myId && game.correctIndex === i) ? 'btn--primary' : 'btn--secondary'}`} 
                  onClick={() => sendAction('answer', ans)} disabled={!!myAns || !!winner}>{ans}</button>
        ))}
      </div>
    </div>
  );
}

function TrueFalseGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md">
      <div className="question-text">{game.questionText}</div>
      <div className="flex-row gap-md">
        <button className={`btn flex-1 ${myAns === 'TRUE' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => sendAction('answer', 'TRUE')} disabled={!!myAns}>TRUE</button>
        <button className={`btn flex-1 ${myAns === 'FALSE' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => sendAction('answer', 'FALSE')} disabled={!!myAns}>FALSE</button>
      </div>
    </div>
  );
}

function EmojiGuessGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md">
      <div style={{ fontSize: '4rem' }}>{game.emojis}</div>
      <div className="grid-2 gap-sm">
        {game.answers.map((ans, i) => (
          <button key={i} className={`btn ${myAns === ans ? 'btn--primary' : 'btn--secondary'}`} onClick={() => sendAction('answer', ans)} disabled={!!myAns}>{ans}</button>
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
      <div className="question-text">{game.questionText}</div>
      {myGuess !== undefined ? <div className="guess-result badge badge--gold">{myGuess}</div> : (
        <div className="flex-col gap-sm w-full">
          <input className="text-input" type="number" placeholder="..." value={val} onChange={e => setVal(e.target.value)} />
          <button className="btn btn--primary" onClick={() => sendAction('estimate', val)}>OK</button>
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
  
  // Use a stable shuffled list of colors for the buttons
  const buttonColors = ["PURPLE", "ORANGE", "BLUE", "RED", "GREEN", "YELLOW"];

  return (
    <div className="flex-col gap-md items-center w-full">
      <div style={{ 
        fontSize: 'clamp(3rem, 12vw, 5rem)', 
        fontWeight: 900, 
        color: COLOR_MAP[game.displayColor],
        textShadow: '0 4px 10px rgba(0,0,0,0.5)',
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
              border: myAns === opt ? '4px solid white' : '2px solid rgba(255,255,255,0.2)',
              height: '80px',
              fontSize: '1.4rem'
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
          <div className="badge badge--gold mb-sm">👀 {game.lang === 'ar' ? 'احفظ جيداً!' : 'MEMORIZE!'}</div>
          <div className="flex-row gap-md justify-center flex-wrap">
            {game.sequence.map((e, i) => (
              <span key={i} style={{ 
                fontSize: 'clamp(3rem, 15vw, 5rem)', 
                animation: `pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${i * 0.1}s forwards`,
                opacity: 0 
              }} className="memory-emoji">{e}</span>
            ))}
          </div>
          <div className="mt-md badge badge--outline">
            {game.timeLeft - (game.duration - game.showDuration)}s remaining
          </div>
        </>
      ) : (
        <>
          <div className="question-text">{game.taskText}</div>
          <div className="grid-4 gap-sm w-full">
            {game.allOptions.map(e => (
              <button 
                key={e} 
                className={`btn ${myAns === e ? 'btn--primary' : 'btn--secondary'}`} 
                style={{ fontSize: '2.5rem', height: '100px' }} 
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
  const move = () => setPos({ t: Math.random() * 80, l: Math.random() * 80 });
  return (
    <div style={{ position: 'relative', width: '100%', height: 300, background: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
      <button className="mole" style={{ position: 'absolute', top: `${pos.t}%`, left: `${pos.l}%` }} 
              onClick={() => { sendAction('click'); move(); }}>🔨</button>
      <div className="mole-score">{game.whacks[myId] || 0}</div>
    </div>
  );
}

function FastTypeGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="type-target">{game.targetWord}</div>
      <input className="text-input text-input--large" placeholder="..." autoFocus onChange={e => { if(e.target.value.toUpperCase() === game.targetWord) sendAction('answer', e.target.value.toUpperCase()); }} disabled={!!myAns} />
    </div>
  );
}

function ScrambledWordGame({ game, myId, sendAction }) {
  const [val, setVal] = useState('');
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="scrambled-text">{game.scrambled}</div>
      <div className="flex-col gap-sm w-full">
        <input className="text-input text-input--large" placeholder="..." value={val} onChange={e => setVal(e.target.value)} disabled={!!myAns} />
        <button className="btn btn--primary" onClick={() => sendAction('answer', val)} disabled={!!myAns || !val}>GO</button>
      </div>
    </div>
  );
}

function FindOddGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers?.[myId];
  return (
    <div className="grid-3 gap-sm">
      {game.items.map((e, i) => (
        <button key={i} className="btn btn--secondary" style={{ fontSize: '2rem' }} onClick={() => sendAction('answer', i)} disabled={myAns !== undefined}>{e}</button>
      ))}
    </div>
  );
}

function SimonSaysGame({ game, myId, sendAction }) {
  const myProg = game.playerProgress[myId] || 0;
  return (
    <div className="flex-col gap-md">
      <div className="flex-row gap-xs">
        {game.sequence.map((c, i) => <div key={i} style={{ width: 15, height: 15, borderRadius: '50%', background: c, opacity: i < myProg ? 1 : 0.3 }}></div>)}
      </div>
      <div className="grid-2 gap-sm w-full">
        {['RED', 'BLUE', 'GREEN', 'YELLOW'].map(c => (
          <button key={c} className="btn" style={{ background: c, height: 60 }} onClick={() => sendAction('answer', c)}></button>
        ))}
      </div>
    </div>
  );
}

function SocialVoteGame({ room, myId, sendAction }) {
  const myVote = room.game.votes[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="question-text">{room.game.question}</div>
      <div className="grid-2 gap-sm">
        {Object.values(room.players).map(p => (
          <button key={p.id} className={`btn ${myVote === p.id ? 'btn--primary' : 'btn--secondary'}`} 
                  onClick={() => sendAction('vote', p.id)} disabled={!!myVote || p.id === myId}>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function DontPressGame({ game, myId, sendAction }) {
  const { room } = useSocket();
  const pressed = game.pressed[myId];
  return (
    <div className="flex-col gap-md items-center">
      <button className="big-red-btn" disabled={!!pressed} onClick={() => sendAction('press')}
              style={{ width: 150, height: 150, borderRadius: '50%', background: 'red', border: '10px solid darkred', 
                      fontSize: '1.2rem', fontWeight: 900, color: 'white', cursor: 'pointer', boxShadow: '0 10px 0 darkred' }}>
        {room.lang === 'ar' ? 'اضغط؟' : 'PRESS?'}
      </button>
      {pressed && <div style={{ color: 'red', fontWeight: 900, marginTop: 16 }}>{room.lang === 'ar' ? '💥 بوم! 💥' : '💥 BOOM! 💥'}</div>}
    </div>
  );
}

function SpamStopGame({ game, myId, sendAction }) {
  const { room } = useSocket();
  const failed = game.failed?.includes(myId);
  const isAr = room.lang === 'ar';
  return (
    <div className="flex-col gap-md items-center">
      <div style={{ fontSize: '2rem', fontWeight: 900, color: game.isStopped ? 'red' : 'white' }}>
        {game.isStopped ? (isAr ? '🛑 توقف!!!' : '🛑 STOP!!!') : (isAr ? '⚡ اضغط!!!' : '⚡ SPAM!!!')}
      </div>
      <button 
        className="tap-button" 
        style={{ background: game.isStopped ? 'red' : 'var(--electric-blue)', opacity: failed ? 0.3 : 1 }}
        onClick={() => sendAction('click')}
        disabled={failed}
      >
        {failed ? (isAr ? '💀 خسرت' : '💀 FAIL') : (isAr ? 'اضغط!' : 'TAP!')}
        <span className="tap-button__count">{game.clicks[myId] || 0}</span>
      </button>
    </div>
  );
}

function SecretChoiceGame({ game, myId, sendAction }) {
  const { room } = useSocket();
  const myAns = game.playerChoices[myId];
  return (
    <div className="flex-col gap-md">
      <div className="question-text">{room.lang === 'ar' ? 'اختر شيئاً فريداً!' : 'Pick something unique!'}</div>
      <div className="grid-2 gap-md">
        {game.options.map(opt => (
          <button key={opt} className={`btn ${myAns === opt ? 'btn--primary' : 'btn--secondary'}`} 
                  style={{ fontSize: '3rem' }} onClick={() => sendAction('secret_choice', opt)} disabled={!!myAns}>{opt}</button>
        ))}
      </div>
    </div>
  );
}

function FinishSentenceGame({ game, myId, sendAction }) {
  const { room } = useSocket();
  const [val, setVal] = useState('');
  const submitted = !!game.playerAnswers[myId];
  return (
    <div className="flex-col gap-md w-full">
      <div className="question-text">{game.prompt}</div>
      {!submitted ? (
        <div className="flex-col gap-sm w-full">
          <input className="text-input text-input--large" placeholder="..." value={val} onChange={e => setVal(e.target.value)} />
          <button className="btn btn--primary" onClick={() => sendAction('finish_sentence', val)} disabled={!val}>GO</button>
        </div>
      ) : <div className="badge badge--green">{room.lang === 'ar' ? 'تم الإرسال!' : 'Submitted!'}</div>}
    </div>
  );
}

function FakeButtonsGame({ game, myId, sendAction }) {
  const myAns = game.playerAnswers[myId];
  return (
    <div className="grid-3 gap-sm">
      {Array.from({ length: 12 }).map((_, i) => (
        <button key={i} className={`btn ${myAns === i ? 'btn--primary' : 'btn--secondary'}`} 
                onClick={() => sendAction('answer', i)} disabled={myAns !== undefined}>?</button>
      ))}
    </div>
  );
}

function RevengeGame({ game, myId, sendAction }) {
  const isTarget = myId === game.lastPlaceId;
  const [val, setVal] = useState('');
  const submitted = !!game.playerGuesses[myId];
  return (
    <div className="flex-col gap-md items-center">
      <div className="question-text">{game.questionText}</div>
      {isTarget ? (
        !submitted ? (
          <div className="flex-row gap-sm">
            <input className="text-input" type="number" placeholder="1-10" value={val} onChange={e => setVal(e.target.value)} />
            <button className="btn btn--primary" onClick={() => sendAction('revenge_guess', val)}>GUESS</button>
          </div>
        ) : <div className="badge">Guessed!</div>
      ) : <div className="text-secondary">Waiting for last place...</div>}
    </div>
  );
}

function SuddenDeathGame({ game, myId, sendAction }) {
  const { room } = useSocket();
  const winner = game.winnerId;
  const isAr = room.lang === 'ar';
  return (
    <div className="flex-col gap-md items-center">
      <div className="question-text">{game.task}</div>
      <button className="tap-button" disabled={!!winner} onClick={() => sendAction('sudden_tap')}
              style={{ width: 200, height: 200, borderRadius: '50%', background: 'gold', color: 'black' }}>
        {winner ? (isAr ? 'متأخر جداً!' : 'Too late!') : (isAr ? 'اضغط!' : 'TAP!')}
      </button>
      {winner === myId && <div className="badge badge--gold">{isAr ? 'لقد فزت!' : 'YOU WIN!'}</div>}
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
    }
  };

  return (
    <div className={`color-grid-container ${isShaking ? 'shake' : ''}`} 
         style={{ 
           display: 'grid', 
           gridTemplateColumns: `repeat(${grid.size}, 1fr)`, 
           gap: '8px',
           width: '100%',
           maxWidth: '400px',
           aspectRatio: '1/1',
           margin: '0 auto'
         }}>
      {Array.from({ length: grid.size * grid.size }).map((_, i) => (
        <div
          key={i}
          className="color-tile"
          onClick={() => handleTileClick(i)}
          style={{
            backgroundColor: i === grid.targetIndex ? grid.targetColor : grid.baseColor,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.1s',
          }}
        />
      ))}
    </div>
  );
}



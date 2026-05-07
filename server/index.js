const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");
const RoomStore = require("./RoomStore");
const ActionQueue = require("./ActionQueue");
const { TRIVIA, TRUE_FALSE, EMOJI_GUESS, ESTIMATION, MIND_GAMES, generateMathProblem } = require("./questions");
const { generateProceduralQuestion, generateFunnyPrompt, getChaosEvent } = require("./aiQuestions");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../client/dist")));

// ─── AI Memory (Persistence) ───
const USED_QUESTIONS_FILE = path.join(__dirname, "used_questions.json");
let globalUsedIds = new Set();
try {
  if (fs.existsSync(USED_QUESTIONS_FILE)) {
    const data = JSON.parse(fs.readFileSync(USED_QUESTIONS_FILE, "utf8"));
    globalUsedIds = new Set(data);
  }
} catch (e) {
  logger.error("SYSTEM", "Failed to load AI Memory");
}

function saveAIMemory() {
  try {
    fs.writeFileSync(USED_QUESTIONS_FILE, JSON.stringify(Array.from(globalUsedIds)));
  } catch (e) {
    logger.error("SYSTEM", "Failed to save AI Memory");
  }
}

// ─── Local Timers & Cache (Until pure Redis implementation) ───
const localTimers = new Map(); // roomId -> { tickInterval, resultInterval, queueInterval }
const rooms = {}; // In-Memory state cache

// ─── Helpers ───
async function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const exists = await RoomStore.has(code);
  return exists ? await makeCode() : code;
}

const AVATARS = ["🦊", "🐸", "🐙", "🦄", "🐲", "🎃", "👾", "🤖", "🦁", "🐼"];
const COLORS = ["#8A2BE2", "#00E5FF", "#FF007F", "#39FF14", "#FF6B35", "#FFD700", "#FF4500", "#1DB954", "#E040FB", "#00BCD4"];
const pointTable = [1000, 800, 600, 400, 200];

const SOCIAL_TRICKS = [
  { type: 'FASTEST_ONLY', label: { en: "⚡ FASTEST ONLY", ar: "⚡ الأسرع فقط" }, icon: '🏎️' },
  { type: 'LEAST_CHOSEN_WINS', label: { en: "🤏 LEAST CHOSEN WINS", ar: "🤏 الأقل اختياراً يفوز" }, icon: '📉' },
  { type: 'POINT_SWAP', label: { en: "😱 POINT SWAP", ar: "😱 تبديل النقاط" }, icon: '🎭' },
  { type: 'VOTE_FOR_POINTS', label: { en: "🗳️ VOTE FOR POINTS", ar: "🗳️ تصويت للنقاط" }, icon: '🤝' }
];

const MODIFIERS = [
  { type: 'DOUBLE_POINTS', label: { en: "🔥 DOUBLE POINTS", ar: "🔥 نقاط مضاعفة" }, icon: '⚡' },
  { type: 'HIDDEN_UI', label: { en: "😶 HIDDEN UI", ar: "😶 واجهة مخفية" }, icon: '🔇' },
  { type: 'SPEED_BOOST', label: { en: "🚀 SPEED BOOST", ar: "🚀 دفعة سرعة" }, icon: '🏎️' },
  { type: 'INVERT_COLORS', label: { en: "🌈 INVERT COLORS", ar: "🌈 ألوان معكوسة" }, icon: '🌀' },
  { type: 'REVERSE_CONTROLS', label: { en: "🔁 REVERSED", ar: "🔁 تحكم معكوس" }, icon: '🌀' },
  { type: 'SHRINK_UI', label: { en: "🤏 SHRINKING", ar: "🤏 تصغير الواجهة" }, icon: '📉' }
];

function ensureSet(v) {
  return v instanceof Set ? v : new Set(v || []);
}

function clearRoomTimers(roomOrId) {
  const roomId = typeof roomOrId === 'string' ? roomOrId : roomOrId.id;
  if (!roomId) return;
  const timers = localTimers.get(roomId);
  if (timers) {
    if (timers.tickInterval) clearInterval(timers.tickInterval);
    if (timers.resultInterval) clearInterval(timers.resultInterval);
    if (timers.queueInterval) clearInterval(timers.queueInterval);
    localTimers.delete(roomId);
  }
}

function serializeRoom(room) {
  const serializedGame = room.game ? {
    ...room.game,
    playlist: room.game.playlist.map(item => ({
      ...item,
      failed: item.failed ? Array.from(item.failed) : undefined
    })),
    failed: room.game.failed ? Array.from(room.game.failed) : undefined,
  } : null;

  return {
    id: room.id,
    hostId: room.hostId,
    players: room.players,
    phase: room.phase,
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    durationMode: room.durationMode,
    gameMode: room.gameMode,
    lang: room.lang,
    nextRoundCountdown: room.nextRoundCountdown,
    chaosEvent: room.chaosEvent,
    chaosHistory: room.chaosHistory || [],
    game: serializedGame,
    playedTypes: room.playedTypes ? Array.from(room.playedTypes) : [],
    usedQuestionIds: room.usedQuestionIds ? Array.from(room.usedQuestionIds) : [],
    viralHighlights: room.viralHighlights || [],
    selectedModes: room.selectedModes || [],
    isNextRoundTriggered: room.isNextRoundTriggered,
    lastResults: room.lastResults || null, // FIX: Include last results for lobby podium
  };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ──────────────────────────────────────────
// GAME DEFINITIONS — 25+ Hyper-Interactive Mini-Games!
// ──────────────────────────────────────────
// ──────────────────────────────────────────
const GAME_MODES = {
  CHAOS: {
    id: "CHAOS",
    label: { en: "🔥 QUICK CHAOS", ar: "🔥 فوضى سريعة" },
    desc: { en: "Speed, Reaction & Traps", ar: "سرعة، رد فعل وفخاخ" },
    collections: ["COLOR_GRID", "REACTION_TIME", "WHACK_A_MOLE", "CHAOS_TAP", "SPAM_STOP", "NEON_DASH", "SUDDEN_DEATH", "REVENGE_ROUND", "HEARTBEAT", "ARROW_DASH"],
  },
  MIND: {
    id: "MIND",
    label: { en: "🧠 MIND GAMES", ar: "🧠 ألعاب العقل" },
    desc: { en: "Logic Traps & Memory", ar: "ألغاز خادعة وذاكرة" },
    collections: ["TRIVIA", "TRUE_FALSE", "EMOJI_GUESS", "MEMORY_FLASH", "SCRAMBLED_WORD", "ESTIMATION", "SPEED_MATH", "FAST_TYPE", "SIMON_SAYS", "INVISIBLE_MAZE"],
  },
  MADNESS: {
    id: "MADNESS",
    label: { en: "🎭 PARTY MADNESS", ar: "🎭 جنون الحفلة" },
    desc: { en: "Social Chaos & Betrayal", ar: "فوضى اجتماعية وخيانة" },
    collections: ["SOCIAL_VOTE", "SECRET_CHOICE", "FAKE_BUTTONS", "FINISH_SENTENCE", "COLOR_MATCH", "DONT_PRESS", "ONE_VS_ALL", "BLIND_BID"],
  }
};

const CHALLENGE_POOL = {
  COLOR_GRID: { 
    type: "COLOR_GRID", duration: 15, difficultyScale: 0.8,
    label: { en: "SHARP EYE", ar: "العين الثاقبة" },
    description: { en: "Find the square with a different color!", ar: "ابحث عن المربع ذو اللون المختلف!" }
  },
  NEON_DASH: { 
    type: "NEON_DASH", duration: 12, difficultyScale: 1.2,
    label: { en: "NEON DASH", ar: "الوميض النيوني" },
    description: { en: "Tap the moving NEON targets!", ar: "اضغط على الأهداف النيونية المتحركة!" }
  },
  REACTION_TIME: { 
    type: "REACTION_TIME", duration: 15, difficultyScale: 0.7,
    label: { en: "REACTION TEST", ar: "اختبار رد الفعل" },
    description: { en: "Tap as soon as it turns BLUE!", ar: "اضغط فور أن يتحول اللون إلى الأزرق!" }
  },
  SPEED_MATH: { 
    type: "SPEED_MATH", duration: 12, difficultyScale: 0.9,
    label: { en: "FAST MATH", ar: "الحساب السريع" },
    description: { en: "Solve the equation before time runs out!", ar: "حل المعادلة قبل انتهاء الوقت!" }
  },
  WHACK_A_MOLE: { 
    type: "WHACK_A_MOLE", duration: 12, difficultyScale: 0.8,
    label: { en: "MOLE HUNTER", ar: "صياد الخلد" },
    description: { en: "Tap the moles as they appear!", ar: "اضغط على الخلد فور ظهوره!" }
  },
  TRIVIA: { 
    type: "TRIVIA", duration: 12, difficultyScale: 0.6,
    label: { en: "TRIVIA TIME", ar: "وقت المعلومات" },
    description: { en: "Choose the correct answer!", ar: "اختر الإجابة الصحيحة!" }
  },
  TRUE_FALSE: { 
    type: "TRUE_FALSE", duration: 10, difficultyScale: 0.6,
    label: { en: "TRUE OR FALSE", ar: "صح أم خطأ" },
    description: { en: "Decide if the statement is true!", ar: "قرر ما إذا كانت العبارة صحيحة!" }
  },
  EMOJI_GUESS: { 
    type: "EMOJI_GUESS", duration: 12, difficultyScale: 0.7,
    label: { en: "EMOJI GUESS", ar: "خمن الإيموجي" },
    description: { en: "What does this emoji set represent?", ar: "ماذا تمثل هذه المجموعة من الإيموجي؟" }
  },
  ESTIMATION: { 
    type: "ESTIMATION", duration: 15, difficultyScale: 0.8,
    label: { en: "GUESS IT", ar: "خمن العدد" },
    description: { en: "Estimate the correct number!", ar: "خمن العدد الصحيح!" }
  },
  SCRAMBLED_WORD: { 
    type: "SCRAMBLED_WORD", duration: 15, difficultyScale: 1.0,
    label: { en: "WORD SCRAMBLE", ar: "كلمات مبعثرة" },
    description: { en: "Unscramble the letters to form a word!", ar: "رتب الحروف لتكوين كلمة صحيحة!" }
  },
  CHAOS_TAP: { 
    type: "CHAOS_TAP", duration: 10, difficultyScale: 0.9,
    label: { en: "CHAOS CLICKER", ar: "ناقر الفوضى" },
    description: { en: "Tap as fast as you can!", ar: "اضغط بأسرع ما يمكن!" }
  },
  COLOR_MATCH: { 
    type: "COLOR_MATCH", duration: 12, difficultyScale: 0.8,
    label: { en: "COLOR MATCH", ar: "تطابق الألوان" },
    description: { en: "Tap the WORD, not the color you see!", ar: "اضغط على الكلمة، وليس اللون الذي تراه!" }
  },
  MEMORY_FLASH: { 
    type: "MEMORY_FLASH", duration: 15, difficultyScale: 1.1,
    label: { en: "MEMORY TEST", ar: "اختبار الذاكرة" },
    description: { en: "Memorize the sequence!", ar: "احفظ التسلسل الظاهر!" }
  },
  FAKE_BUTTONS: { 
    type: "FAKE_BUTTONS", duration: 10, difficultyScale: 1.0,
    label: { en: "FAKE OUT", ar: "الفخ" },
    description: { en: "Find the ONLY real button!", ar: "ابحث عن الزر الحقيقي الوحيد!" }
  },
  SPAM_STOP: { 
    type: "SPAM_STOP", duration: 12, difficultyScale: 1.0,
    label: { en: "SPAM & STOP", ar: "اضغط وقف" },
    description: { en: "Spam TAP, but STOP when it turns RED!", ar: "اضغط بسرعة، لكن توقف عندما يصبح اللون أحمر!" }
  },
  FAST_TYPE: { 
    type: "FAST_TYPE", duration: 12, difficultyScale: 0.9,
    label: { en: "SPEED TYPE", ar: "كتابة سريعة" },
    description: { en: "Type the word as fast as you can!", ar: "اكتب الكلمة بأسرع ما يمكن!" }
  },
  DONT_PRESS: { 
    type: "DONT_PRESS", duration: 10, difficultyScale: 0.5,
    label: { en: "DON'T PRESS!", ar: "لا تضغط!" },
    description: { en: "Whatever you do, DON'T press the button!", ar: "مهما حصل، لا تضغط الزر!" }
  },
  SIMON_SAYS: { 
    type: "SIMON_SAYS", duration: 15, difficultyScale: 0.9,
    label: { en: "SIMON SAYS", ar: "سيمون يقول" },
    description: { en: "Repeat the color sequence!", ar: "كرر تسلسل الألوان!" }
  },
  ONE_VS_ALL: { 
    type: "ONE_VS_ALL", duration: 12, difficultyScale: 0.7,
    label: { en: "FIRST TO ANSWER", ar: "الأسرع يفوز" },
    description: { en: "The first player to answer correctly wins it all!", ar: "أول لاعب يجيب بشكل صحيح يفوز بالكل!" }
  },
  REVENGE_ROUND: { 
    type: "REVENGE_ROUND", duration: 10, difficultyScale: 1.0,
    label: { en: "REVENGE", ar: "الانتقام" },
    description: { en: "The player in last place picks a lucky number!", ar: "اللاعب في المركز الأخير يختار رقم الحظ!" }
  },
  SUDDEN_DEATH: { 
    type: "SUDDEN_DEATH", duration: 8, difficultyScale: 1.5,
    label: { en: "SUDDEN DEATH", ar: "الموت المفاجئ" },
    description: { en: "First one to tap wins!", ar: "أول واحد يضغط يكسب!" }
  },
  INVISIBLE_MAZE: {
    type: "INVISIBLE_MAZE", duration: 15, difficultyScale: 1.5,
    label: { en: "MEMORY MAZE", ar: "المسار المخفي" },
    description: { en: "Memorize the path before it disappears! One wrong step = fail.", ar: "تذكر المسار قبل أن يختفي! خطأ واحد = خروج." }
  },
  BLIND_BID: {
    type: "BLIND_BID", duration: 12, difficultyScale: 1.0,
    label: { en: "BLIND BID", ar: "مزاد النقاط" },
    description: { en: "Bid your points to win the prize. Highest unique bid wins, but everyone loses what they bid!", ar: "زايد بنقاطك لربح الجائزة الكبرى. أعلى عطاء يفوز، لكن الجميع يخسر ما دفعه!" }
  },
  HEARTBEAT: {
    type: "HEARTBEAT", duration: 15, difficultyScale: 1.2,
    label: { en: "BLIND RHYTHM", ar: "نبض القلب" },
    description: { en: "Feel the beat! Tap exactly when the invisible pulses should happen.", ar: "اشعر بالإيقاع! اضغط بدقة متناهية في وقت النبضات المخفية." }
  },
  ARROW_DASH: {
    type: "ARROW_DASH", duration: 12, difficultyScale: 1.2,
    label: { en: "ARROW DASH", ar: "انطلاقة الأسهم" },
    description: { en: "Tap the arrows in the correct direction!", ar: "اضغط على الأسهم في الاتجاه الصحيح!" }
  },
  PATTERN_MASTER: {
    type: "PATTERN_MASTER", duration: 15, difficultyScale: 1.3,
    label: { en: "PATTERN MASTER", ar: "سيد الأنماط" },
    description: { en: "Repeat the sequence of symbols!", ar: "كرر تسلسل الرموز بدقة!" }
  },
};

function generateColorGrid(level) {
  const size = level <= 3 ? 3 : level <= 8 ? 4 : 5;
  const baseH = Math.floor(Math.random() * 360);
  const baseS = 60 + Math.floor(Math.random() * 30);
  const baseL = 40 + Math.floor(Math.random() * 20);

  let deltaL = 15;
  if (level > 3) deltaL = 8;
  if (level > 8) deltaL = 4;
  if (level > 15) deltaL = 2;

  const isBrighter = Math.random() > 0.5;
  const targetL = isBrighter ? baseL + deltaL : baseL - deltaL;

  return {
    size,
    baseColor: `hsl(${baseH}, ${baseS}%, ${baseL}%)`,
    targetColor: `hsl(${baseH}, ${baseS}%, ${targetL}%)`,
    targetIndex: Math.floor(Math.random() * (size * size)),
    level
  };
}

// ─── AI Content System ───
const AI_PROMPT_TEMPLATES = {
  CHAOS: "Generate 5 speed-reaction challenges with sudden traps. Mode: QUICK CHAOS, Difficulty: {diff}.",
  MIND: "Generate 5 logic traps and trick questions. Mode: MIND TRAPS, Difficulty: {diff}.",
  MADNESS: "Generate 5 social betrayal voting scenarios. Mode: PARTY MADNESS, Difficulty: {diff}."
};

async function generateAIContent(mode, difficulty, lang) {
  // Placeholder for Gemini API call
  // For MVP, we use pre-defined high-quality procedural generators
  const template = AI_PROMPT_TEMPLATES[mode] || AI_PROMPT_TEMPLATES.CHAOS;
  logger.info("AI", `Generating content for ${mode} (Diff: ${difficulty}) using template.`);

  // Simulation of AI-generated content variety
  return {
    timestamp: Date.now(),
    seed: Math.random(),
    difficultyScaling: 1 + (difficulty * 0.2)
  };
}

const GLOBAL_MODIFIERS = [
  { type: 'SUDDEN_SWITCH', label: '⚡ تبديل مفاجئ!', icon: '🧨', trigger: '50%', visual: 'shake-red' },
  { type: 'SWAP_CONTROLS', label: '🔄 تبديل التحكم!', icon: '🌀', trigger: 'START', visual: 'invert-colors' },
  { type: 'NO_TEXT', label: '😶 جولة صامتة!', icon: '🔇', trigger: 'START', visual: 'dim-ui' },
  { type: 'HIDDEN_SCORE', label: '❓ نقاط مخفية!', icon: '🙈', trigger: 'START', visual: 'hide-elements' },
  { type: 'GHOST_MODE', label: '👻 وضع الشبح!', icon: '🌑', trigger: '75%', visual: 'ghost-fade' }
];

// ─── Adaptive Engine ───
async function generateAdaptiveRound(room) {
  const roundIdx = room.currentRound;
  const baseDifficulty = Math.min(1 + Math.floor(roundIdx / 3), 5);
  
  // Seed for AI Consistency
  const seed = `${room.id}_${roundIdx}_${new Date().toISOString().split('T')[0]}`;

  const selectedModeIds = (room.selectedModes && room.selectedModes.length > 0)
    ? room.selectedModes
    : ["CHAOS", "MIND", "MADNESS"];

  const primaryModeId = pickRandom(selectedModeIds);
  const primaryMode = GAME_MODES[primaryModeId];

  // AI Content Injection
  const aiContent = await generateAIContent(primaryModeId, baseDifficulty, room.lang);

  // Global Round Modifier
  const globalModifier = (roundIdx > 1 && Math.random() < 0.45) ? pickRandom(GLOBAL_MODIFIERS) : null;

  // Dynamic Playlist Count: 3 to 7 based on difficulty
  const challengeCount = 3 + Math.floor(baseDifficulty / 1.5);
  
  const contentHeavyGames = ["TRIVIA", "TRUE_FALSE", "SCRAMBLED_WORD", "SPEED_MATH", "FINISH_SENTENCE", "EMOJI_GUESS", "ONE_VS_ALL", "ESTIMATION", "PATTERN_MASTER"];
  const repetitiveGames = ["DONT_PRESS", "SPAM_STOP", "FAKE_BUTTONS", "REACTION_TIME", "WHACK_A_MOLE", "CLICK_FAST", "CHAOS_TAP", "NEON_DASH", "SIMON_SAYS", "ARROW_DASH"];

  const selection = [];
  
  // Get available games for this mode that haven't been played yet
  let modeAvailable = primaryMode.collections.filter(id => !room.playedTypes.has(id) || contentHeavyGames.includes(id));
  
  for (let i = 0; i < challengeCount; i++) {
    let chosenId;
    
    // 70% chance to pick a content-heavy game if available, to increase variety and challenge
    const modeContentGames = modeAvailable.filter(id => contentHeavyGames.includes(id));
    const modeActionGames = modeAvailable.filter(id => repetitiveGames.includes(id));

    if (Math.random() < 0.7 && modeContentGames.length > 0) {
      chosenId = pickRandom(modeContentGames);
    } else if (modeActionGames.length > 0) {
      chosenId = pickRandom(modeActionGames);
    } else if (modeAvailable.length > 0) {
      chosenId = pickRandom(modeAvailable);
    } else {
      // Fallback if everything is played: just pick any content game
      chosenId = pickRandom(contentHeavyGames);
    }

    // If it's a repetitive game, remove it from available pool so it doesn't appear again
    if (repetitiveGames.includes(chosenId)) {
      modeAvailable = modeAvailable.filter(id => id !== chosenId);
    }

    selection.push(CHALLENGE_POOL[chosenId]);
  }

  return {
    selection: selection.slice(0, 7),
    modifiers: shuffle(MODIFIERS).slice(0, roundIdx > 5 ? 2 : 1),
    globalModifier,
    difficulty: baseDifficulty,
    modeLabel: primaryMode.label[room.lang] || primaryMode.label.en,
    aiMeta: aiContent
  };
}

function getUnused(bank, usedIds, lang, type = null) {
  const langBank = bank[lang] || bank.ar;
  
  // Filter for category variety if possible
  const available = langBank.filter((q) => !usedIds.has(q.id) && !globalUsedIds.has(q.id));

  if (available.length > 0) {
    // Try to pick a category that hasn't been used in this round yet
    const q = pickRandom(available);
    usedIds.add(q.id);
    globalUsedIds.add(q.id);
    saveAIMemory();
    return q;
  }

  // Fallback to Procedural AI Generation
  const aiQ = generateProceduralQuestion(type, lang);
  if (aiQ) {
    globalUsedIds.add(aiQ.id);
    saveAIMemory();
    return aiQ;
  }

  // Last resort: Clear global memory if we are out of questions!
  // This ensures that players ALWAYS see something, but we prefer new ones.
  if (globalUsedIds.size > langBank.length * 0.8) {
    globalUsedIds.clear();
    saveAIMemory();
  }
  
  usedIds.clear();
  return pickRandom(langBank);
}

// ─── Build Game State ───
async function createChallengeState(gameDef, room, difficulty = 1) {
  const playerIds = Object.keys(room.players);

  // Dynamic duration based on mode and difficulty
  let duration = gameDef.duration;
  if (room.durationMode === "SHORT") duration = Math.ceil(gameDef.duration * 0.7);
  if (room.durationMode === "LONG") duration = Math.ceil(gameDef.duration * 1.4);

  // Speed up as difficulty increases
  duration = Math.max(5, duration - (difficulty - 1));

  const base = {
    type: gameDef.type,
    category: gameDef.category,
    label: gameDef.label[room.lang] || gameDef.label.en,
    description: gameDef.description[room.lang] || gameDef.description.en,
    duration: duration,
    timeLeft: duration,
    difficulty,
    answerTimes: {},
    trick: (difficulty >= 2 && Math.random() < 0.35) ? pickRandom(SOCIAL_TRICKS) : null
  };

  switch (gameDef.type) {
    case "COLOR_GRID": {
      base.playerGrids = {};
      base.scores = {};
      playerIds.forEach(id => {
        base.playerGrids[id] = generateColorGrid(difficulty);
        base.scores[id] = 0;
      });
      return base;
    }
    // ...
    // ... other cases remain the same but use difficulty

    case "CLICK_FAST": {
      base.clicks = {};
      playerIds.forEach(id => base.clicks[id] = 0);
      return base;
    }

    case "REACTION_TIME": {
      base.reactPhase = "WAIT";
      base.goTime = null;
      base.reactionDelay = 2000 + Math.floor(Math.random() * 6000);
      base.playerTimes = {};
      return base;
    }

    case "SPEED_MATH": {
      const q = await generateProceduralQuestion("SPEED_MATH", room.lang);
      base.questionText = q.text;
      base.answers = q.answers;
      base.correctIndex = q.correctIndex;
      base.playerAnswers = {};
      return base;
    }

    case "TRIVIA": {
      const bank = room.gameMode === "MIND" ? MIND_GAMES : TRIVIA;
      const q = await getUnused(bank, room.usedQuestionIds, room.lang, "TRIVIA");
      base.questionText = q.text;
      base.answers = q.answers;
      base.correctIndex = q.correctIndex;
      base.playerAnswers = {};
      return base;
    }

    case "TRUE_FALSE": {
      const q = await getUnused(TRUE_FALSE, room.usedQuestionIds, room.lang, "TRUE_FALSE");
      base.questionText = q.text;
      base.correctAnswer = q.answer; // questions.js uses 'answer', not 'correctAnswer'
      base.playerAnswers = {};
      return base;
    }

    case "EMOJI_GUESS": {
      const q = await getUnused(EMOJI_GUESS, room.usedQuestionIds, room.lang, "EMOJI_GUESS");
      base.emojis = q.emojis;
      base.answers = q.answers;
      base.correctIndex = q.correctIndex;
      base.playerAnswers = {};
      return base;
    }

    case "ESTIMATION": {
      const q = await getUnused(ESTIMATION, room.usedQuestionIds, room.lang, "ESTIMATION");
      base.questionText = q.text;
      base.correctAnswer = q.correctAnswer ?? q.answer; // bank uses 'answer', AI uses 'correctAnswer'
      base.playerGuesses = {};
      return base;
    }

    case "CHAOS_TAP": {
      base.clicks = {};
      playerIds.forEach((id) => (base.clicks[id] = 0));
      const effects = ["REVERSE", "DOUBLE_POINTS", "SHRINK_BUTTON", "MOVE_BUTTON", "INVISIBLE"];
      base.chaosEffect = pickRandom(effects);
      return base;
    }

    case "COLOR_MATCH": {
      // Show a color word in a DIFFERENT color. Player must tap the WORD, not the display color.
      const colors = ["RED", "BLUE", "GREEN", "YELLOW", "PURPLE", "ORANGE"];
      const wordColor = pickRandom(colors);
      let displayColor = pickRandom(colors);
      while (displayColor === wordColor) displayColor = pickRandom(colors);
      base.wordColor = wordColor;
      base.displayColor = displayColor;
      base.options = shuffle(colors).slice(0, 4);
      if (!base.options.includes(wordColor)) base.options[0] = wordColor;
      base.options = shuffle(base.options);
      base.correctAnswer = wordColor;
      base.playerAnswers = {};
      base.roundNum = 1;
      base.maxRounds = 5;
      base.scores = {};
      playerIds.forEach((id) => (base.scores[id] = 0));
      return base;
    }

    case "MEMORY_FLASH": {
      const emojiPool = ["🍎", "🍕", "🎸", "⚽", "🌈", "🔥", "💎", "🎯", "🐱", "🌙", "⭐", "🎲", "🦋", "🎪", "🍩"];
      const seq = shuffle(emojiPool).slice(0, 5);
      base.sequence = seq;
      base.showPhase = true;
      base.showDuration = 4;
      // Ask which emoji was NOT shown (harder than asking which WAS shown)
      const notInSeq = emojiPool.filter(e => !seq.includes(e));
      const decoy = pickRandom(notInSeq);
      // Mix the decoy with some from the sequence
      const options = shuffle([...seq.slice(0, 3), decoy, ...shuffle(notInSeq).slice(0, 4)]).slice(0, 8);
      if (!options.includes(decoy)) options[0] = decoy;
      base.allOptions = shuffle(options);
      base.correctAnswer = decoy; // The one NOT in the sequence
      base.taskText = room.lang === 'ar' ? 'أي إيموجي لم يكن موجوداً؟' : 'Which emoji was NOT shown?';
      base.playerAnswers = {};
      return base;
    }

    case "WHACK_A_MOLE": {
      base.moles = [];
      base.clicks = {};
      playerIds.forEach(id => base.clicks[id] = 0);
      return base;
    }

    case "FAST_TYPE": {
      const words = {
        ar: ["بارتي فيرس", "صاروخ", "مغامرة", "تحدي", "سرعة"],
        en: ["PARTYVERSE", "ROCKET", "ADVENTURE", "CHALLENGE", "VELOCITY"]
      };
      base.targetWord = pickRandom(words[room.lang] || words.en);
      base.playerAnswers = {};
      return base;
    }

    case "SCRAMBLED_WORD": {
      const q = await generateProceduralQuestion("SCRAMBLED_WORD", room.lang);
      base.scrambled = q.scrambled;
      base.correct = q.correct;
      base.playerAnswers = {};
      return base;
    }

    case "FIND_THE_ODD": {
      const sets = [
        { items: ["🍎", "🍎", "🍎", "🍐", "🍎", "🍎", "🍎", "🍎", "🍎"], oddIndex: 3 },
        { items: ["🐱", "🐱", "🐱", "🐱", "🐶", "🐱", "🐱", "🐱", "🐱"], oddIndex: 4 },
        { items: ["⚽", "⚽", "⚽", "⚽", "⚽", "⚽", "🏀", "⚽", "⚽"], oddIndex: 6 },
        { items: ["😊", "😊", "😊", "😊", "😊", "😊", "😊", "🙂", "😊"], oddIndex: 7 },
        { items: ["🔵", "🔵", "🔵", "🟦", "🔵", "🔵", "🔵", "🔵", "🔵"], oddIndex: 3 },
        { items: ["🌸", "🌸", "🌺", "🌸", "🌸", "🌸", "🌸", "🌸", "🌸"], oddIndex: 2 },
        { items: ["🐸", "🐸", "🐸", "🐸", "🐸", "🐢", "🐸", "🐸", "🐸"], oddIndex: 5 },
        { items: ["🎵", "🎵", "🎵", "🎵", "🎶", "🎵", "🎵", "🎵", "🎵"], oddIndex: 4 },
        { items: ["🥝", "🥝", "🥝", "🥝", "🥝", "🥝", "🥝", "🥝", "🥑"], oddIndex: 8 },
        { items: ["🌙", "🌙", "🌙", "🌛", "🌙", "🌙", "🌙", "🌙", "🌙"], oddIndex: 3 },
        { items: ["🔴", "🔴", "🔴", "🔴", "🔴", "🟠", "🔴", "🔴", "🔴"], oddIndex: 5 },
        { items: ["👁️", "👁️", "👁️", "👁️", "👁️", "👁️", "👀", "👁️", "👁️"], oddIndex: 6 },
        { items: ["🐻", "🐻", "🐻", "🧸", "🐻", "🐻", "🐻", "🐻", "🐻"], oddIndex: 3 },
        { items: ["☀️", "☀️", "🌟", "☀️", "☀️", "☀️", "☀️", "☀️", "☀️"], oddIndex: 2 },
        { items: ["🦋", "🦋", "🦋", "🦋", "🦋", "🦋", "🦋", "🐛", "🦋"], oddIndex: 7 },
      ];
      const set = pickRandom(sets);
      base.items = set.items;
      base.oddIndex = set.oddIndex;
      base.playerAnswers = {};
      return base;
    }

    case "SIMON_SAYS": {
      const colors = ["RED", "BLUE", "GREEN", "YELLOW"];
      const seqLength = 5 + Math.min(4, Math.floor(difficulty / 2));
      base.sequence = Array.from({ length: seqLength }).map(() => pickRandom(colors));
      base.playerProgress = {}; // id -> current index in sequence
      playerIds.forEach(id => base.playerProgress[id] = 0);
      return base;
    }

    case "SPAM_STOP": {
      base.clicks = {};
      playerIds.forEach(id => base.clicks[id] = 0);
      base.stopTime = 4000 + Math.floor(Math.random() * 4000); // Stop after 4-8s
      base.isStopped = false;
      base.failed = new Set();
      return base;
    }

    case "ONE_VS_ALL": {
      const q = await getUnused(TRIVIA, room.usedQuestionIds, room.lang, "TRIVIA");
      base.questionText = q.text;
      base.answers = q.answers;
      base.correctIndex = q.correctIndex;
      base.winnerId = null;
      base.playerAnswers = {};
      return base;
    }

    case "SECRET_CHOICE": {
      const optionSets = [
        ["🍎", "🍌", "🍒", "🍇", "🥝", "🍑", "🫐", "🥭"],
        ["🐶", "🐱", "🐸", "🦊", "🐼", "🐨", "🦁", "🐯"],
        ["⚽", "🏀", "🎾", "🏐", "🎱", "🏓", "🥊", "⛷️"],
        ["🌍", "🌙", "⭐", "☀️", "🪐", "🌈", "❄️", "🔥"]
      ];
      base.options = pickRandom(optionSets);
      base.playerChoices = {};
      return base;
    }

    case "FINISH_SENTENCE": {
      base.prompt = generateFunnyPrompt(room.lang, room.usedQuestionIds);
      base.playerAnswers = {};
      return base;
    }

    case "FAKE_BUTTONS": {
      base.totalButtons = 9;
      base.correctIndex = Math.floor(Math.random() * 9);
      base.playerAnswers = {};
      return base;
    }

    case "REVENGE_ROUND": {
      // Find the player in last place
      const players = Object.values(room.players).sort((a, b) => a.score - b.score);
      base.lastPlaceId = players[0].id;
      base.questionText = room.lang === 'ar' ? "سؤال الحظ للمركز الأخير!" : "Luck question for last place!";
      base.targetAnswer = Math.floor(Math.random() * 10) + 1;
      base.playerGuesses = {};
      return base;
    }

    case "SUDDEN_DEATH": {
      base.task = room.lang === 'ar' ? "أول واحد يضغط يكسب!" : "First one to tap wins!";
      base.winnerId = null;
      return base;
    }

    case "INVISIBLE_MAZE": {
      const size = difficulty > 3 ? 4 : 3;
      const pathLength = size === 3 ? 4 : 6;
      const path = [];
      let current = Math.floor(Math.random() * (size * size));
      path.push(current);
      
      for (let i = 1; i < pathLength; i++) {
        const moves = [];
        const r = Math.floor(current / size);
        const c = current % size;
        if (r > 0) moves.push(current - size); // Up
        if (r < size - 1) moves.push(current + size); // Down
        if (c > 0) moves.push(current - 1); // Left
        if (c < size - 1) moves.push(current + 1); // Right
        
        const validMoves = moves.filter(m => !path.includes(m));
        if (validMoves.length === 0) break; // Dead end fallback
        current = pickRandom(validMoves);
        path.push(current);
      }
      base.size = size;
      base.path = path;
      base.playerProgress = {};
      base.failed = new Set();
      playerIds.forEach(id => base.playerProgress[id] = 0);
      return base;
    }

    case "BLIND_BID": {
      base.prize = 1000 + (difficulty * 500); // 1500 to 3500 points
      base.bids = {};
      return base;
    }

    case "HEARTBEAT": {
      const bpm = 60 + Math.floor(Math.random() * 60); // 60 to 120 BPM
      const msPerBeat = 60000 / bpm;
      base.msPerBeat = msPerBeat;
      // Target beats: 4th, 5th, 6th beat after start
      base.targetBeats = [msPerBeat * 4, msPerBeat * 5, msPerBeat * 6];
      base.playerTaps = {};
      playerIds.forEach(id => base.playerTaps[id] = []);
      return base;
    }

    case "SOCIAL_VOTE": {
      const questions = {
        ar: [
          "من هو الأكثر ذكاءً؟", "من هو الأكثر جنوناً؟", "من سيفوز بهذا الجيم؟",
          "من هو الأكثر حظاً؟", "من سيكون آخر واحد يجيب؟", "من يستحق لقب ملك الحفلة؟",
          "من هو الأسرع رد فعل؟", "من هو الأكثر غموضاً؟", "من هو الأفضل تحت الضغط؟",
          "من سيغش لو قدر؟", "من الأكثر تنافسية؟", "من سيستسلم أولاً؟"
        ],
        en: [
          "Who is the smartest?", "Who is the craziest?", "Who will win this game?",
          "Who is the luckiest?", "Who will answer last?", "Who deserves Party King?",
          "Who has the fastest reflexes?", "Who is the most mysterious?", "Who performs best under pressure?",
          "Who would cheat if they could?", "Who is the most competitive?", "Who will give up first?"
        ]
      };
      base.question = pickRandom(questions[room.lang] || questions.en);
      base.votes = {};
      return base;
    }

    case "DONT_PRESS": {
      base.pressed = {}; // id -> timePressed
      base.bombTimer = 3000 + Math.floor(Math.random() * 5000); // bomb explodes at 3-8s
      base.exploded = false;
      return base;
    }

    case "ARROW_DASH": {
      const directions = ["UP", "DOWN", "LEFT", "RIGHT"];
      const count = 5 + Math.min(5, Math.floor(difficulty));
      base.sequence = Array.from({ length: count }).map(() => pickRandom(directions));
      base.playerProgress = {};
      playerIds.forEach(id => base.playerProgress[id] = 0);
      return base;
    }

    case "PATTERN_MASTER": {
      const symbols = ["⭐", "🔥", "💎", "🎯", "🍀", "🍎", "⚡", "🌈"];
      const seqLength = 4 + Math.min(4, Math.floor(difficulty / 1.5));
      base.sequence = Array.from({ length: seqLength }).map(() => pickRandom(symbols));
      base.showPhase = true;
      base.showDuration = 3 + Math.min(2, Math.floor(difficulty / 2));
      base.playerAnswers = {};
      return base;
    }

    case "NEON_DASH": {
      base.targets = [];
      base.clicks = {};
      playerIds.forEach(id => base.clicks[id] = 0);
      return base;
    }

    default:
      return base;
  }
}

// ─── Score Calculation ───
function calcRoundScores(room) {
  const game = room.game;
  if (!game) return;

  const activeChallenge = game.playlist[game.activeIndex];
  const pointTable = [500, 350, 250, 200, 150, 100, 75, 50, 50, 50];
  const trick = activeChallenge.trick;
  let ranked = [];
  
  // Track winners for streaks
  let roundWinners = new Set();

  // Special Trick: LEAST_CHOSEN_WINS (for Trivia/Answers)
  if (trick?.type === 'LEAST_CHOSEN_WINS' && activeChallenge.playerAnswers) {
    const counts = {};
    Object.values(activeChallenge.playerAnswers).forEach(ans => {
      counts[ans] = (counts[ans] || 0) + 1;
    });
    const entries = Object.entries(activeChallenge.playerAnswers);
    entries.forEach(([id, ans]) => {
      if (counts[ans] === Math.min(...Object.values(counts)) && room.players[id]) {
        room.players[id].score += 1000; // Big reward for being unique
      }
    });
    return;
  }

  // Special Trick: FASTEST_ONLY
  if (trick?.type === 'FASTEST_ONLY' && activeChallenge.playerAnswers) {
    const entries = Object.entries(activeChallenge.playerAnswers);
    if (entries.length > 0) {
      const [firstId, firstAns] = entries[0];
      const correctAns = activeChallenge.answers[activeChallenge.correctIndex];
      if (firstAns === correctAns && room.players[firstId]) {
        room.players[firstId].score += 1500; // Large reward for being fastest
      }
    }
    return;
  }

  // Special Trick: POINT_SWAP (The ultimate betrayal)
  if (trick?.type === 'POINT_SWAP') {
    const pIds = Object.keys(room.players);
    if (pIds.length >= 2) {
      const [id1, id2] = shuffle(pIds).slice(0, 2);
      const temp = room.players[id1].score;
      room.players[id1].score = room.players[id2].score;
      room.players[id2].score = temp;
      io.to(room.id).emit("chaos_event", { 
        type: 'BETRAYAL', 
        message: room.lang === 'ar' 
          ? `😱 خيانة! تم تبديل نقاط ${room.players[id1].name} و ${room.players[id2].name}!`
          : `😱 BETRAYAL! ${room.players[id1].name} and ${room.players[id2].name} swapped scores!`
      });
    }
  }

  // Special Trick: VOTE_FOR_POINTS
  if (trick?.type === 'VOTE_FOR_POINTS' && activeChallenge.votes) {
    Object.values(activeChallenge.votes).forEach(targetId => {
      if (room.players[targetId]) room.players[targetId].score += 500;
    });
    return;
  }

  const multiplier = (activeChallenge.chaosEffect === "DOUBLE_POINTS" || room.game?.modifiers?.some(m => m.type === 'DOUBLE_POINTS')) ? 2 : 1;

  switch (activeChallenge.type) {
    case "COLOR_GRID":
    case "CLICK_FAST":
    case "CHAOS_TAP":
    case "WHACK_A_MOLE":
    case "NEON_DASH": {
      const isReverse = activeChallenge.trick?.type === 'LEAST_CHOSEN_WINS';
      ranked = Object.entries(activeChallenge.clicks || activeChallenge.scores || {})
        .map(([id, c]) => ({ id, val: c }))
        .sort((a, b) => isReverse ? a.val - b.val : b.val - a.val);

      ranked.forEach((entry, idx) => {
        if (entry.val > 0 && room.players[entry.id]) {
          // Fair scoring: Points per action + Rank Bonus
          const pointsPerAction = activeChallenge.type === "COLOR_GRID" ? 40 : 15; // Color grid is harder than clicking
          const basePoints = entry.val * pointsPerAction;
          const rankBonus = [500, 300, 200, 100, 50][idx] || 0;
          
          room.players[entry.id].score += (basePoints + rankBonus) * multiplier;
          if (idx === 0) roundWinners.add(entry.id);
        }
      });
      break;
    }



    case "REACTION_TIME": {
      ranked = Object.entries(activeChallenge.playerTimes || {})
        .filter(([id, t]) => t < 9999) // Exclude false starts
        .map(([id, t]) => ({ id, val: t }))
        .sort((a, b) => a.val - b.val); // fastest first
      ranked.forEach((entry, idx) => {
        if (room.players[entry.id]) {
          room.players[entry.id].score += pointTable[idx] || 50;
          if (idx === 0) roundWinners.add(entry.id);
        }
      });
      // Penalize false starts
      Object.entries(activeChallenge.playerTimes || {}).forEach(([id, t]) => {
        if (t === 9999 && room.players[id]) {
          room.players[id].score -= 200;
        }
      });
      break;
    }

    case "TRIVIA":
    case "EMOJI_GUESS":
    case "SPEED_MATH":
    case "COLOR_MATCH":
    case "TRUE_FALSE":
    case "FIND_THE_ODD":
    case "FAKE_BUTTONS":
    case "FAST_TYPE": {
      const correctAns = activeChallenge.correctIndex !== undefined ? activeChallenge.answers?.[activeChallenge.correctIndex] : activeChallenge.correctAnswer;
      const oddIdx = activeChallenge.oddIndex;
      const targetWord = activeChallenge.targetWord;
      
      // Filter players who answered correctly
      const correctPlayers = Object.entries(activeChallenge.playerAnswers || {})
        .filter(([id, ans]) => {
          if (activeChallenge.type === "FIND_THE_ODD") return Number(ans) === oddIdx;
          if (activeChallenge.type === "FAKE_BUTTONS") return Number(ans) === activeChallenge.correctIndex;
          if (activeChallenge.type === "FAST_TYPE") return ans === targetWord;
          if (activeChallenge.type === "TRUE_FALSE") return (ans === "TRUE" || ans === true) === activeChallenge.correctAnswer;
          return ans === correctAns;
        })
        .map(([id, ans]) => ({ id, time: activeChallenge.answerTimes?.[id] || 0 }))
        .sort((a, b) => a.time - b.time); // Fastest first

      correctPlayers.forEach((entry, idx) => {
        if (room.players[entry.id]) {
          // Speed Bonus: 1st gets 800, 2nd 700, 3rd 600, etc. (min 400)
          const bonus = Math.max(400, 800 - (idx * 100));
          room.players[entry.id].score += bonus * multiplier;
          if (idx === 0) roundWinners.add(entry.id);
        }
      });
      break;
    }

    case "MEMORY_FLASH": {
      const correctAns = activeChallenge.correctAnswer; // The emoji NOT in sequence
      Object.entries(activeChallenge.playerAnswers || {}).forEach(([id, ans]) => {
        if (ans === correctAns && room.players[id]) {
          room.players[id].score += 1000 * multiplier;
          roundWinners.add(id);
        }
      });
      break;
    }

    case "BIG_RED_BUTTON": {
      if (activeChallenge.winnerId && room.players[activeChallenge.winnerId]) {
        room.players[activeChallenge.winnerId].score += 1000 * multiplier;
      }
      break;
    }



    case "ESTIMATION": {
      const correct = activeChallenge.correctAnswer;
      Object.entries(activeChallenge.playerGuesses || {}).forEach(([id, val]) => {
        const diff = Math.abs(val - correct);
        const errorPct = correct === 0 ? (val === 0 ? 0 : 1) : diff / correct;
        if (errorPct < 0.1) room.players[id].score += 1000 * multiplier;
        else if (errorPct < 0.25) room.players[id].score += 500 * multiplier;
        else if (errorPct < 0.5) room.players[id].score += 200 * multiplier;
      });
      break;
    }


    case "SOCIAL_VOTE": {
      const counts = {};
      Object.values(activeChallenge.votes || {}).forEach(targetId => {
        counts[targetId] = (counts[targetId] || 0) + 1;
      });
      Object.entries(counts).forEach(([id, count]) => {
        if (room.players[id]) room.players[id].score += count * 200;
      });
      break;
    }

    case "DONT_PRESS": {
      // Chicken game: press the button for points, but if the bomb explodes while you hold it, you lose!
      // If NOBODY presses, everyone loses points (cowards!)
      const pressers = Object.entries(activeChallenge.pressed || {});
      if (pressers.length === 0) {
        Object.keys(room.players).forEach(id => {
          room.players[id].score -= 100;
        });
      } else {
        pressers.sort((a, b) => a[1] - b[1]);
        const startTime = activeChallenge.startTime || Date.now();
        const bombTime = activeChallenge.bombTimer || 5000;
        pressers.forEach(([id, time], idx) => {
          const elapsed = time - startTime;
          if (elapsed > bombTime) {
            // Pressed AFTER bomb = big penalty
            if (room.players[id]) room.players[id].score -= 300;
          } else {
            // Reward based on risk: pressing closer to bomb = more points
            const riskBonus = Math.floor((elapsed / bombTime) * 800);
            if (room.players[id]) {
              room.players[id].score += Math.max(100, riskBonus);
              if (idx === pressers.length - 1) roundWinners.add(id);
            }
          }
        });
      }
      break;
    }

    case "SPAM_STOP": {
      const failedSet = ensureSet(activeChallenge.failed);
      ranked = Object.entries(activeChallenge.clicks || {})
        .filter(([id]) => !failedSet.has(id))
        .map(([id, c]) => ({ id, val: c }))
        .sort((a, b) => b.val - a.val);
      ranked.forEach((entry, idx) => {
        if (entry.val > 0 && room.players[entry.id]) {
          room.players[entry.id].score += pointTable[idx] || 50;
          if (idx === 0) roundWinners.add(entry.id);
        }
      });
      // Penalize those who failed
      failedSet.forEach(id => {
        if (room.players[id]) room.players[id].score -= 100;
      });
      break;
    }

    case "SECRET_CHOICE": {
      // Players who picked the LEAST chosen option win
      const choiceCounts = {};
      Object.values(activeChallenge.playerChoices || {}).forEach(c => {
        choiceCounts[c] = (choiceCounts[c] || 0) + 1;
      });
      const minCount = Math.min(...Object.values(choiceCounts));
      Object.entries(activeChallenge.playerChoices || {}).forEach(([id, choice]) => {
        if (choiceCounts[choice] === minCount && room.players[id]) {
          room.players[id].score += 800;
        }
      });
      break;
    }

    case "FINISH_SENTENCE": {
      // Speed bonus: fastest submitters get more points
      const submissions = Object.entries(activeChallenge.playerAnswers || {})
        .map(([id]) => ({ id, time: activeChallenge.answerTimes?.[id] || Infinity }))
        .sort((a, b) => a.time - b.time);
      submissions.forEach((entry, idx) => {
        if (room.players[entry.id]) {
          room.players[entry.id].score += Math.max(200, 600 - (idx * 100)) * multiplier;
          if (idx === 0) roundWinners.add(entry.id);
        }
      });
      break;
    }

    case "SIMON_SAYS": {
      Object.entries(activeChallenge.playerProgress || {}).forEach(([id, prog]) => {
        if (prog === activeChallenge.sequence.length && room.players[id]) {
          room.players[id].score += 1000 * multiplier;
          roundWinners.add(id);
        }
      });
      break;
    }

    case "ONE_VS_ALL":
    case "SUDDEN_DEATH": {
      if (activeChallenge.winnerId && room.players[activeChallenge.winnerId]) {
        room.players[activeChallenge.winnerId].score += 1500;
        roundWinners.add(activeChallenge.winnerId);
      }
      break;
    }

    case "REVENGE_ROUND": {
      const target = activeChallenge.targetAnswer;
      Object.entries(activeChallenge.playerGuesses || {}).forEach(([id, val]) => {
        if (Number(val) === target && room.players[id]) {
          room.players[id].score += 2000; // Massive comeback
          roundWinners.add(id);
        }
      });
      break;
    }

    case "SCRAMBLED_WORD": {
      const correctWord = activeChallenge.correct;
      const solvers = Object.entries(activeChallenge.playerAnswers || {})
        .filter(([id, ans]) => ans?.toUpperCase() === correctWord?.toUpperCase())
        .map(([id]) => ({ id, time: activeChallenge.answerTimes?.[id] || 0 }))
        .sort((a, b) => a.time - b.time);
      solvers.forEach((entry, idx) => {
        if (room.players[entry.id]) {
          room.players[entry.id].score += Math.max(400, 800 - (idx * 100)) * multiplier;
          if (idx === 0) roundWinners.add(entry.id);
        }
      });
      break;
    }

    case "ARROW_DASH": {
      Object.entries(activeChallenge.playerProgress || {}).forEach(([id, prog]) => {
        if (prog === activeChallenge.sequence.length && room.players[id]) {
          room.players[id].score += 1000 * multiplier;
          roundWinners.add(id);
        }
      });
      break;
    }

    case "PATTERN_MASTER": {
      const correctSeq = activeChallenge.sequence.join("");
      Object.entries(activeChallenge.playerAnswers || {}).forEach(([id, ans]) => {
        if (ans === correctSeq && room.players[id]) {
          room.players[id].score += 1200 * multiplier;
          roundWinners.add(id);
        }
      });
      break;
    }

    case "INVISIBLE_MAZE": {
      const pathLength = activeChallenge.path.length;
      Object.entries(activeChallenge.playerProgress || {}).forEach(([id, progress]) => {
        if (progress === pathLength && room.players[id]) {
          room.players[id].score += 1000;
          roundWinners.add(id);
        } else if (activeChallenge.failed?.has(id) && room.players[id]) {
          room.players[id].score -= 200; // Penalty for failing
        }
      });
      break;
    }

    case "BLIND_BID": {
      const bids = Object.entries(activeChallenge.bids || {});
      if (bids.length > 0) {
        // Find unique bids
        const bidCounts = {};
        bids.forEach(([_, amount]) => {
          bidCounts[amount] = (bidCounts[amount] || 0) + 1;
        });
        
        // Find highest unique bid
        let highestUniqueBid = -1;
        let winnerId = null;
        
        bids.forEach(([id, amount]) => {
          if (room.players[id]) {
            room.players[id].score -= amount; // Everyone loses their bid
            if (bidCounts[amount] === 1 && amount > highestUniqueBid) {
              highestUniqueBid = amount;
              winnerId = id;
            }
          }
        });

        if (winnerId) {
          room.players[winnerId].score += activeChallenge.prize;
          roundWinners.add(winnerId);
        }
      }
      break;
    }

    case "HEARTBEAT": {
      const targetBeats = activeChallenge.targetBeats || [];
      const results = [];
      Object.entries(activeChallenge.playerTaps || {}).forEach(([id, taps]) => {
        if (taps.length === 3) {
          let totalDev = 0;
          for (let i = 0; i < 3; i++) {
            totalDev += Math.abs(taps[i] - targetBeats[i]);
          }
          results.push({ id, dev: totalDev / 3 });
        }
      });

      results.sort((a, b) => a.dev - b.dev);
      const heartbeatPoints = [1000, 750, 500, 300];
      results.forEach((entry, idx) => {
        if (room.players[entry.id]) {
          // Bonus based on accuracy and rank
          let bonus = heartbeatPoints[idx] || 100;
          if (entry.dev < 150) bonus += 500; // Perfect rhythm bonus
          room.players[entry.id].score += bonus;
          if (idx === 0) roundWinners.add(entry.id);
        }
      });
      break;
    }
  }

  // Update Win Streaks & Generate Highlights
  Object.keys(room.players).forEach(id => {
    const p = room.players[id];
    if (roundWinners.has(id)) {
      p.winStreak = (p.winStreak || 0) + 1;
      if (p.winStreak >= 3) {
        room.viralHighlights.push(room.lang === 'ar' 
          ? `🔥 ${p.name} على النار! ${p.winStreak} فوز متتالي!` 
          : `🔥 ${p.name} IS ON FIRE! ${p.winStreak} wins in a row!`);
      }
    } else if (activeChallenge.type !== "SOCIAL_VOTE") { 
      p.winStreak = 0;
    }
  });

  // Narrow Victory Highlight
  if (ranked.length >= 2) {
    const diff = Math.abs(ranked[0].val - ranked[1].val);
    if (activeChallenge.type === "REACTION_TIME" && diff < 50) {
      room.viralHighlights.push(room.lang === 'ar'
        ? `😱 يا له من تقارب! ${room.players[ranked[0].id].name} هزم ${room.players[ranked[1].id].name} بفارق ضئيل جداً!`
        : `😱 SO CLOSE! ${room.players[ranked[0].id].name} beat ${room.players[ranked[1].id].name} by a hair!`);
    }
  }

  // Bonus Multiplier
  if (room.game.isBonus) {
    Object.values(room.players).forEach(p => {
      // In a real bonus round, we might want to double the GAINED points,
      // but for simplicity, we'll just say the last round points are 2x
      // This logic is called AFTER points are added, so it's a bit tricky.
      // Let's assume we want to double the points awarded THIS round.
      // (Requires tracking round-start scores, but let's just make base points higher)
    });
  }
}

// ─── Start Next Round ───
async function startNextRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.isNextRoundTriggered = false;
  room.currentRound++;
  room.viralHighlights = [];

  if (room.currentRound > room.totalRounds) {
    room.lastResults = Object.values(room.players)
      .sort((a, b) => b.score - a.score)
      .map(p => ({ name: p.name, score: p.score, avatar: p.avatar, color: p.color }));
    Object.values(room.players).forEach(p => p.ready = (p.id === room.hostId));
    room.phase = "LOBBY";
    room.game = null;
    io.to(roomId).emit("room_update", serializeRoom(room));
    return;
  }

  const { selection, modifiers, difficulty, modeLabel } = await generateAdaptiveRound(room);

  // Build the playlist states
  const playlist = [];
  for (const def of selection) {
    try {
      const state = await createChallengeState(def, room, difficulty);
      playlist.push(state);
      room.playedTypes = ensureSet(room.playedTypes);
      room.playedTypes.add(def.type);
    } catch (e) {
      logger.error("SYSTEM", `Failed to build challenge: ${e.message}`);
    }
  }

  if (playlist.length === 0) {
    room.phase = "LOBBY";
    room.game = null;
    io.to(roomId).emit("room_update", serializeRoom(room));
    return;
  }

  room.game = {
    playlist,
    activeIndex: 0,
    modifiers,
    difficulty,
    modeLabel,
    timeLeft: playlist[0].duration,
    type: playlist[0].type,
    label: playlist[0].label,
  };
  
  room.game.playlist[0].startTime = Date.now();

  room.phase = "PLAYING";
  io.to(roomId).emit("room_update", serializeRoom(room));

  if (localTimers.has(roomId)) clearRoomTimers(roomId);
  localTimers.set(roomId, {});
  const timers = localTimers.get(roomId);

  timers.tickInterval = setInterval(() => {
    const r = rooms[roomId];
    if (!r || r.phase !== "PLAYING") {
      if (r) clearRoomTimers(roomId);
      return;
    }

    r.game.timeLeft--;
    const currentChallenge = r.game.playlist[r.game.activeIndex];
    currentChallenge.timeLeft = r.game.timeLeft;

    // Special per-tick game logic
    if (currentChallenge.type === 'MEMORY_FLASH' || currentChallenge.type === 'PATTERN_MASTER') {
      const elapsed = currentChallenge.duration - r.game.timeLeft;
      if (currentChallenge.showPhase && elapsed >= currentChallenge.showDuration) {
        currentChallenge.showPhase = false;
        io.to(roomId).emit("room_update", serializeRoom(r));
      }
    }
    if (currentChallenge.type === 'SPAM_STOP') {
      const elapsed = (currentChallenge.duration - r.game.timeLeft) * 1000;
      if (!currentChallenge.isStopped && elapsed >= currentChallenge.stopTime) {
        currentChallenge.isStopped = true;
        io.to(roomId).emit("room_update", serializeRoom(r));
      }
    }
    // REACTION_TIME: trigger GO phase after delay
    if (currentChallenge.type === 'REACTION_TIME') {
      const elapsed = (currentChallenge.duration - r.game.timeLeft) * 1000;
      if (currentChallenge.reactPhase === 'WAIT' && elapsed >= currentChallenge.reactionDelay) {
        currentChallenge.reactPhase = 'GO';
        currentChallenge.goTime = Date.now();
        io.to(roomId).emit("room_update", serializeRoom(r));
      }
    }
    // DONT_PRESS: bomb timer
    if (currentChallenge.type === 'DONT_PRESS') {
      if (!currentChallenge.startTime) currentChallenge.startTime = Date.now();
      const elapsed = (currentChallenge.duration - r.game.timeLeft) * 1000;
      if (!currentChallenge.exploded && elapsed >= currentChallenge.bombTimer) {
        currentChallenge.exploded = true;
        io.to(roomId).emit("room_update", serializeRoom(r));
      }
    }

    if (r.game.timeLeft <= 0) {
      // Calculate scores for the challenge that just ended
      calcRoundScores(r);

      // Move to next challenge or finish round
      if (r.game.activeIndex < r.game.playlist.length - 1) {
        r.game.activeIndex++;
        const next = r.game.playlist[r.game.activeIndex];
        next.startTime = Date.now();
        r.game.timeLeft = next.duration;
        r.game.type = next.type;
        r.game.label = next.label;
        io.to(roomId).emit("room_update", serializeRoom(r));
      } else {
        // Round truly over
        clearInterval(timers.tickInterval);
        finishRound(roomId);
      }
    } else {
      io.to(roomId).emit("tick", { timeLeft: r.game.timeLeft });
    }
  }, 1000);
}

function finishRound(roomId) {
  const r = rooms[roomId];
  if (!r) return;

  if (r.currentRound >= r.totalRounds) {
    // Game truly finished
    r.lastResults = Object.values(r.players)
      .sort((a, b) => b.score - a.score)
      .map(p => ({ name: p.name, score: p.score, avatar: p.avatar, color: p.color }));

    // Reset for next game
    Object.values(r.players).forEach(p => {
      p.score = 0;
      p.ready = (p.id === r.hostId);
    });
    
    r.phase = "LOBBY";
    r.currentRound = 0;
    r.game = null;
    io.to(roomId).emit("room_update", serializeRoom(r));
  } else {
    r.phase = "ROUND_RESULT";
    r.game = null;
    r.isNextRoundTriggered = false;
    io.to(roomId).emit("room_update", serializeRoom(r));
  }
}

// ─── Rate Limiter (Anti-Spam) ───
const rateLimits = new Map();
function checkRateLimit(socketId) {
  const now = Date.now();
  if (!rateLimits.has(socketId)) {
    rateLimits.set(socketId, { count: 1, lastTime: now });
    return true;
  }
  const data = rateLimits.get(socketId);
  if (now - data.lastTime > 1000) {
    data.count = 1;
    data.lastTime = now;
    return true;
  }
  data.count++;
  if (data.count > 10) return false; // Max 10 actions per second
  return true;
}

// ──────────────────────
// Socket Handlers
// ──────────────────────
io.on("connection", (socket) => {
  logger.info("SOCKET", `Connected: ${socket.id}`);

  socket.on("create_room", async ({ playerName, lang, totalRounds }, cb) => {
    const code = await makeCode();
    rooms[code] = {
      id: code,
      hostId: socket.id,
      lang: lang || "ar",
      players: {
        [socket.id]: {
          id: socket.id,
          name: playerName || "Host",
          avatar: AVATARS[0],
          color: COLORS[0],
          score: 0,
          ready: true,
        },
      },
      phase: "LOBBY",
      currentRound: 0,
      totalRounds: 5,
      durationMode: "MEDIUM", // SHORT, MEDIUM, LONG
      gameMode: "NORMAL", // QUICK, NORMAL, CHAOS
      selectedModes: [],
      viralHighlights: [],
      game: null,
      previousCategory: null,
      playedTypes: new Set(),
      usedQuestionIds: new Set(),
    };
    socket.join(code);
    cb({ success: true, roomId: code, lang: rooms[code].lang });
    io.to(code).emit("room_update", serializeRoom(rooms[code]));
  });

  socket.on("join_room", ({ roomId, playerName }, cb) => {
    const room = rooms[roomId?.toUpperCase()];
    if (!room) return cb({ success: false, message: "Room not found" });
    if (room.phase !== "LOBBY") return cb({ success: false, message: "Game already started" });
    if (Object.keys(room.players).length >= 10) return cb({ success: false, message: "Room is full" });

    const idx = Object.keys(room.players).length;
    room.players[socket.id] = {
      id: socket.id,
      name: playerName || `Player ${idx + 1}`,
      avatar: AVATARS[idx % AVATARS.length],
      color: COLORS[idx % COLORS.length],
      score: 0,
      ready: false,
    };
    socket.join(room.id);
    cb({ success: true });
    io.to(room.id).emit("room_update", serializeRoom(room));
  });

  socket.on("ready_up", ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.players[socket.id]) {
      room.players[socket.id].ready = !room.players[socket.id].ready;
      io.to(roomId).emit("room_update", serializeRoom(room));
    }
  });

  socket.on("update_settings", ({ roomId, totalRounds, durationMode, gameMode, selectedModes }) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.id) {
      if (totalRounds) room.totalRounds = totalRounds;
      if (durationMode) room.durationMode = durationMode;
      if (selectedModes) room.selectedModes = selectedModes;
      if (gameMode) {
        room.gameMode = gameMode;
        if (gameMode === "QUICK") { room.totalRounds = 10; room.durationMode = "SHORT"; }
        if (gameMode === "NORMAL") { room.totalRounds = 15; room.durationMode = "MEDIUM"; }
        if (gameMode === "CHAOS") { room.totalRounds = 20; room.durationMode = "SHORT"; }
      }
      io.to(roomId).emit("room_update", serializeRoom(room));
    }
  });

  socket.on("play_again", ({ roomId }) => {
    const r = rooms[roomId];
    if (r && r.hostId === socket.id) {
      r.phase = "LOBBY";
      r.currentRound = 0;
      r.viralHighlights = [];
      Object.values(r.players).forEach(p => {
        p.score = 0;
        p.ready = (p.id === r.hostId);
      });
      io.to(roomId).emit("room_update", serializeRoom(r));
    }
  });

  socket.on("chat_message", ({ roomId, text }) => {
    if (!checkRateLimit(socket.id)) return;
    const room = rooms[roomId];
    if (room && text) {
      // Logic: Only allow full chat in LOBBY, ROUND_RESULT, FINAL_RESULT
      const allowedPhases = ["LOBBY", "ROUND_RESULT", "FINAL_RESULT"];
      if (allowedPhases.includes(room.phase)) {
        const msg = {
          id: Date.now() + Math.random(),
          senderId: socket.id,
          senderName: room.players[socket.id]?.name || "Player",
          text: text.substring(0, 100),
          time: new Date().toLocaleTimeString(),
        };
        io.to(roomId).emit("new_chat_message", msg);
      }
    }
  });

  socket.on("send_reaction", ({ roomId, emoji }) => {
    if (!checkRateLimit(socket.id)) return;
    const room = rooms[roomId];
    if (room) {
      io.to(roomId).emit("new_reaction", {
        playerId: socket.id,
        emoji,
        x: Math.random() * 80 + 10, // Random horizontal pos
      });
    }
  });

  socket.on("quick_chat", ({ roomId, phrase }) => {
    const room = rooms[roomId];
    if (room) {
      const msg = {
        id: Date.now(),
        senderId: socket.id,
        senderName: room.players[socket.id]?.name || "Player",
        text: phrase,
        isQuick: true
      };
      io.to(roomId).emit("new_chat_message", msg);
    }
  });

  socket.on("start_game", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    const playerCount = Object.keys(room.players).length;
    if (playerCount < 2) return; // Minimum 2 players required
    const allReady = Object.values(room.players).every((p) => p.ready);
    if (!allReady) return;
    startNextRound(roomId);
  });

  socket.on("skip_round", ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.id && room.phase === "PLAYING") {
      clearRoomTimers(room);
      calcRoundScores(room);
      if (room.currentRound >= room.totalRounds) {
        room.lastResults = Object.values(room.players)
          .sort((a, b) => b.score - a.score)
          .map(p => ({ name: p.name, score: p.score, avatar: p.avatar, color: p.color }));

        Object.values(room.players).forEach(p => p.ready = (p.id === room.hostId));
        room.phase = "LOBBY";
        room.game = null;
        io.to(roomId).emit("room_update", serializeRoom(room));
      } else {
        room.phase = "ROUND_RESULT";
        room.game = null;
        room.isNextRoundTriggered = false;
        io.to(roomId).emit("room_update", serializeRoom(room));
      }
    }
  });

  // Host triggers next round manually
  socket.on("next_round", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    if (room.phase !== "ROUND_RESULT") return;
    startNextRound(roomId);
  });

  socket.on("kick_player", ({ roomId, playerId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === socket.id && playerId !== socket.id) {
      const playerSocket = io.sockets.sockets.get(playerId);
      if (playerSocket) {
        playerSocket.leave(roomId);
        playerSocket.emit("kicked");
      }
      delete room.players[playerId];
      io.to(roomId).emit("room_update", serializeRoom(room));
    }
  });

  socket.on("game_action", async ({ roomId, action, payload }) => {
    if (!checkRateLimit(socket.id)) return; // Rate Limiter

    ActionQueue.push(roomId, async () => {
      // NOTE: In the future when RoomStore is pure Redis, we use:
      // const room = await RoomStore.get(roomId);
      // For now, we still read from memory cache for the queue
      const room = rooms[roomId];
      if (!room || room.phase !== "PLAYING" || !room.game) return;

      try {
        const activeGame = room.game.playlist[room.game.activeIndex];

        switch (action) {
          case "click": {
            if (activeGame.type === "ARROW_DASH") {
              const currentIdx = activeGame.playerProgress[socket.id] || 0;
              const expected = activeGame.sequence[currentIdx];
              if (payload.direction === expected) {
                activeGame.playerProgress[socket.id]++;
                if (activeGame.playerProgress[socket.id] === activeGame.sequence.length) {
                  // Done!
                  io.to(roomId).emit("room_update", serializeRoom(room));
                }
              } else {
                // Mistake penalty or reset?
                activeGame.playerProgress[socket.id] = 0; // Reset progress on mistake
              }
              return;
            }
            if (activeGame.type === "SPAM_STOP") {
              activeGame.failed = ensureSet(activeGame.failed);
              if (activeGame.isStopped) {
                activeGame.failed.add(socket.id);
                io.to(roomId).emit("fail_click", { playerId: socket.id });
              } else {
                activeGame.clicks[socket.id] = (activeGame.clicks[socket.id] || 0) + 1;
                io.to(roomId).emit("score_tick", { playerId: socket.id, clicks: activeGame.clicks });
              }
              break;
            }
            if (activeGame.clicks && typeof activeGame.clicks[socket.id] !== "undefined") {
              activeGame.clicks[socket.id]++;
              io.to(roomId).emit("score_tick", { playerId: socket.id, clicks: activeGame.clicks });
            }
            break;
          }
          case "answer": {
            if (activeGame.type === "SIMON_SAYS") {
              const currentIdx = activeGame.playerProgress[socket.id];
              if (payload === activeGame.sequence[currentIdx]) {
                activeGame.playerProgress[socket.id]++;
                if (activeGame.playerProgress[socket.id] === activeGame.sequence.length) {
                  activeGame.answerTimes[socket.id] = Date.now();
                }
                io.to(roomId).emit("room_update", serializeRoom(room));
              } else {
                activeGame.playerProgress[socket.id] = 0; // Reset on fail
                io.to(socket.id).emit("wrong_answer");
              }
              break;
            }
            if (activeGame.type === "ONE_VS_ALL" && !activeGame.winnerId) {
              if (payload === activeGame.answers[activeGame.correctIndex]) {
                activeGame.winnerId = socket.id;
                io.to(roomId).emit("room_update", serializeRoom(room));
              }
              break;
            }
            if (activeGame.type === "PATTERN_MASTER") {
              if (activeGame.showPhase) return;
              activeGame.playerAnswers[socket.id] = payload;
              io.to(roomId).emit("room_update", serializeRoom(room));
              return;
            }
            if (activeGame.playerAnswers && !activeGame.playerAnswers[socket.id]) {
              activeGame.playerAnswers[socket.id] = payload;
              activeGame.answerTimes[socket.id] = Date.now();
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "secret_choice": {
            if (activeGame.type === "SECRET_CHOICE" && !activeGame.playerChoices[socket.id]) {
              activeGame.playerChoices[socket.id] = payload;
              activeGame.answerTimes[socket.id] = Date.now();
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "finish_sentence": {
            if (activeGame.type === "FINISH_SENTENCE" && !activeGame.playerAnswers[socket.id]) {
              activeGame.playerAnswers[socket.id] = payload;
              activeGame.answerTimes[socket.id] = Date.now();
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "revenge_guess": {
            if (activeGame.type === "REVENGE_ROUND" && socket.id === activeGame.lastPlaceId && !activeGame.playerGuesses[socket.id]) {
              activeGame.playerGuesses[socket.id] = Number(payload);
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "sudden_tap": {
            if (activeGame.type === "SUDDEN_DEATH" && !activeGame.winnerId) {
              activeGame.winnerId = socket.id;
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "maze_step": {
            if (activeGame.type === "INVISIBLE_MAZE" && !activeGame.failed.has(socket.id)) {
              const currentIdx = activeGame.playerProgress[socket.id] || 0;
              if (currentIdx < activeGame.path.length) {
                if (payload === activeGame.path[currentIdx]) {
                  activeGame.playerProgress[socket.id]++;
                  io.to(roomId).emit("room_update", serializeRoom(room));
                } else {
                  activeGame.failed.add(socket.id);
                  io.to(socket.id).emit("wrong_answer");
                  io.to(roomId).emit("fail_click", { playerId: socket.id });
                  io.to(roomId).emit("room_update", serializeRoom(room));
                }
              }
            }
            break;
          }
          case "blind_bid": {
            if (activeGame.type === "BLIND_BID" && !activeGame.bids[socket.id]) {
              // Ensure bid doesn't exceed current score
              const maxBid = Math.max(0, room.players[socket.id].score);
              activeGame.bids[socket.id] = Math.min(Number(payload), maxBid);
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "heartbeat_tap": {
            if (activeGame.type === "HEARTBEAT") {
              if (!activeGame.playerTaps[socket.id]) activeGame.playerTaps[socket.id] = [];
              if (activeGame.playerTaps[socket.id].length < 3) {
                if (!activeGame.startTime) activeGame.startTime = Date.now();
                const elapsed = Date.now() - activeGame.startTime;
                activeGame.playerTaps[socket.id].push(elapsed);
                io.to(roomId).emit("room_update", serializeRoom(room));
              }
            }
            break;
          }
          case "react_tap": {
            if (activeGame.type === "REACTION_TIME") {
              if (activeGame.reactPhase === "WAIT" && !activeGame.playerTimes[socket.id]) {
                activeGame.playerTimes[socket.id] = 9999; // Penalty time
                io.to(roomId).emit("fail_click", { playerId: socket.id });
                io.to(roomId).emit("room_update", serializeRoom(room));
              } else if (activeGame.reactPhase === "GO" && !activeGame.playerTimes[socket.id]) {
                if (!activeGame.goTime) return;
                activeGame.playerTimes[socket.id] = Date.now() - activeGame.goTime;
                io.to(roomId).emit("room_update", serializeRoom(room));
              }
            }
            break;
          }
          case "estimate": {
            if (activeGame.playerGuesses && !activeGame.playerGuesses[socket.id]) {
              activeGame.playerGuesses[socket.id] = Number(payload) || 0;
              activeGame.answerTimes[socket.id] = Date.now();
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "math_answer": {
            if (activeGame.type === "SPEED_MATH" && !activeGame.playerAnswers[socket.id]) {
              activeGame.playerAnswers[socket.id] = payload;
              activeGame.answerTimes[socket.id] = Date.now();
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "color_answer": {
            if (activeGame.type === "COLOR_MATCH" && !activeGame.playerAnswers[socket.id]) {
              activeGame.playerAnswers[socket.id] = payload;
              activeGame.answerTimes[socket.id] = Date.now();
              // Points are calculated in calcRoundScores, so we don't add them here
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "fake_press": {
            if (activeGame.type === "FAKE_BUTTONS" && !activeGame.playerAnswers[socket.id]) {
              activeGame.playerAnswers[socket.id] = payload;
              if (!activeGame.answerTimes) activeGame.answerTimes = {};
              activeGame.answerTimes[socket.id] = Date.now();
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "press": {
            if (activeGame.type === "BIG_RED_BUTTON" && !activeGame.winnerId) {
              activeGame.winnerId = socket.id;
              io.to(roomId).emit("room_update", serializeRoom(room));
            } else if (activeGame.type === "DONT_PRESS" && !activeGame.pressed[socket.id]) {
              activeGame.pressed[socket.id] = Date.now();
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "memory_answer": {
            if (activeGame.type === "MEMORY_FLASH" && !activeGame.playerAnswers[socket.id]) {
              activeGame.playerAnswers[socket.id] = payload;
              activeGame.answerTimes[socket.id] = Date.now();
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
          case "color_grid_tap": {
            if (activeGame.type === "COLOR_GRID") {
              const grid = activeGame.playerGrids[socket.id];
              if (payload === grid.targetIndex) {
                // Correct
                activeGame.scores[socket.id] = (activeGame.scores[socket.id] || 0) + 1;
                activeGame.playerGrids[socket.id] = generateColorGrid(grid.level + 1);
                io.to(roomId).emit("room_update", serializeRoom(room));
              } else {
                // Wrong
                io.to(socket.id).emit("wrong_answer");
              }
            }
            break;
          }
          case "vote": {
            if (activeGame.type === "SOCIAL_VOTE" && !activeGame.votes[socket.id]) {
              activeGame.votes[socket.id] = payload;
              activeGame.answerTimes[socket.id] = Date.now();
              io.to(roomId).emit("room_update", serializeRoom(room));
            }
            break;
          }
        }

        // Check if everyone has finished to end challenge early
        checkEarlyFinish(room);

      } catch (e) {
        console.error("Action error:", e);
      }
      // Future Redis update: await RoomStore.set(roomId, room);
    });
  });

  function checkEarlyFinish(room) {
    if (!room.game) return;
    const activeGame = room.game.playlist[room.game.activeIndex];
    const playerIds = Object.keys(room.players);
    const playerCount = playerIds.length;

    let allDone = false;

    switch (activeGame.type) {
      case "TRIVIA":
      case "SPEED_MATH":
      case "EMOJI_GUESS":
      case "COLOR_MATCH":
      case "MEMORY_FLASH":
      case "TRUE_FALSE":
      case "FAKE_BUTTONS":
      case "FINISH_SENTENCE":
      case "SCRAMBLED_WORD":
      case "FIND_THE_ODD":
      case "FAST_TYPE":
        if (activeGame.playerAnswers && Object.keys(activeGame.playerAnswers).length === playerCount) {
          allDone = true;
        }
        break;
      case "ESTIMATION":
        if (activeGame.playerGuesses && Object.keys(activeGame.playerGuesses).length === playerCount) {
          allDone = true;
        }
        break;
      case "REACTION_TIME":
        if (activeGame.playerTimes && Object.keys(activeGame.playerTimes).length === playerCount) {
          allDone = true;
        }
        break;
      case "ONE_VS_ALL":
      case "SUDDEN_DEATH":
      case "BIG_RED_BUTTON":
        if (activeGame.winnerId) {
          allDone = true;
        }
        break;
      case "SECRET_CHOICE":
        if (activeGame.playerChoices && Object.keys(activeGame.playerChoices).length === playerCount) {
          allDone = true;
        }
        break;
      case "SOCIAL_VOTE":
        if (activeGame.votes && Object.keys(activeGame.votes).length === playerCount) {
          allDone = true;
        }
        break;
      case "SIMON_SAYS":
        if (activeGame.playerProgress && Object.values(activeGame.playerProgress).every(p => p === activeGame.sequence.length)) {
          allDone = true;
        }
        break;
      case "REVENGE_ROUND":
        if (activeGame.playerGuesses && activeGame.playerGuesses[activeGame.lastPlaceId]) {
          allDone = true;
        }
        break;
      case "INVISIBLE_MAZE":
        if (activeGame.playerProgress && activeGame.failed) {
          const completedCount = Object.values(activeGame.playerProgress).filter(p => p === activeGame.path.length).length;
          if (completedCount + activeGame.failed.size === playerCount) {
            allDone = true;
          }
        }
        break;
      case "BLIND_BID":
        if (activeGame.bids && Object.keys(activeGame.bids).length === playerCount) {
          allDone = true;
        }
        break;
      case "HEARTBEAT":
        if (activeGame.playerTaps) {
          const finishedCount = Object.values(activeGame.playerTaps).filter(taps => taps.length === 3).length;
          if (finishedCount === playerCount) {
            allDone = true;
          }
        }
        break;
    }

    if (allDone) {
      // Small delay before finishing to let players see feedback
      setTimeout(() => {
        const r = rooms[room.id];
        if (r && r.game) r.game.timeLeft = 0;
      }, 1500);
    }
  }

  socket.on("play_again", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    Object.values(room.players).forEach((p) => {
      p.score = 0;
      p.ready = p.id === room.hostId;
    });
    room.phase = "LOBBY";
    room.currentRound = 0;
    room.game = null;
    room.previousCategory = null;
    room.playedTypes = new Set();
    room.usedQuestionIds = new Set();
    io.to(roomId).emit("room_update", serializeRoom(room));
  });

  socket.on("disconnect", () => {
    logger.info("SOCKET", `Disconnected: ${socket.id}`);
    rateLimits.delete(socket.id);
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        if (Object.keys(room.players).length === 0) {
          clearRoomTimers(room);
          delete rooms[roomId];
        } else {
          if (room.hostId === socket.id) {
            room.hostId = Object.keys(room.players)[0];
          }
          if (room.game) {
            if (room.game.clicks) delete room.game.clicks[socket.id];
            if (room.game.playerAnswers) delete room.game.playerAnswers[socket.id];
            if (room.game.failed) {
              const failedSet = ensureSet(room.game.failed);
              failedSet.delete(socket.id);
              room.game.failed = failedSet;
            }
            // Check if remaining players have finished
            checkEarlyFinish(room);
          }
          io.to(roomId).emit("room_update", serializeRoom(room));
        }
        break;
      }
    }
  });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 7860;
server.listen(PORT, () => logger.info("SYSTEM", `🎮 PartyVerse server on port ${PORT} — 25+ mini-games loaded!`));

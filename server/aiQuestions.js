const axios = require('axios');
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 🤖 FREE AI & EXTERNAL CONTENT FALLBACKS
// Using OpenTDB for infinite free trivia content.
async function fetchFreeTrivia(lang = 'en') {
  try {
    // OpenTDB is English only, so we only use it if lang is 'en' 
    // or we use it and "simulate" translation for now.
    const url = `https://opentdb.com/api.php?amount=1&type=multiple`;
    const res = await axios.get(url);
    if (res.data.results && res.data.results.length > 0) {
      const q = res.data.results[0];
      const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
      return {
        id: `free-ai-${Date.now()}`,
        text: q.question,
        answers: answers,
        correctIndex: answers.indexOf(q.correct_answer)
      };
    }
  } catch (err) {
    return null;
  }
  return null;
}

const FUNNY_PROMPTS = {
  ar: [
    "اللاعب ده لو كان آلة هيكون عبارة عن ____.",
    "أغرب حاجة ممكن تلاقيها في محفظة اللاعب اللي فوقي هي ____.",
    "لو صحيت لقيت نفسي مكانه، أول حاجة هعملها هي ____.",
    "السر اللي مخبيه عن الكل هو إنه بيحب ____.",
    "أكتر كلمة بيقولها وهو نايم هي ____."
  ],
  en: [
    "If this player was a machine, they would be a ____.",
    "The weirdest thing in the wallet of the player above is ____.",
    "If I woke up in their body, the first thing I'd do is ____.",
    "The secret they are hiding is that they love ____.",
    "The word they repeat while sleeping is ____."
  ]
};

const CHAOS_EVENTS = {
  ar: [
    "انعكاس الشاشة! (Screen Flip)",
    "النقاط المزدوجة لهذه الجولة! (Double Points)",
    "تجميد الوقت! (Time Freeze)",
    "إخفاء واجهة المستخدم! (Hidden UI Mode)",
    "إجابات وهمية في كل مكان! (Fake Answers)",
    "سرعة مضاعفة! (Speed Boost)",
    "نقاط الانتقام! (Revenge Points)",
    "الوضع المظلم! (Dark Mode)",
    "زرار واحد هو الصح! (Only One Button)"
  ],
  en: [
    "Screen Flip active!",
    "Double Points for this round!",
    "Time Freeze!",
    "Hidden UI Mode!",
    "Fake Answers everywhere!",
    "Speed Boost!",
    "Revenge Mode: Last place scores 2x!",
    "Dark Mode active!",
    "Only one button is real!"
  ]
};

function generateFunnyPrompt(lang) {
  return pickRandom(FUNNY_PROMPTS[lang] || FUNNY_PROMPTS.en);
}

function getChaosEvent(lang) {
  return pickRandom(CHAOS_EVENTS[lang] || CHAOS_EVENTS.en);
}

// 🤖 ENHANCED AI TEMPLATE ENGINE
const ENTITIES = {
  ar: {
    countries: ["فرنسا", "اليابان", "مصر", "البرازيل", "الصين", "ألمانيا", "الهند", "كندا", "أستراليا", "إسبانيا", "إيطاليا", "روسيا", "المكسيك", "السعودية", "المغرب"],
    cities: ["باريس", "طوكيو", "القاهرة", "ريو دي جانيرو", "بكين", "برلين", "نيودلهي", "أوتاوا", "كانبرا", "مدريد", "روما", "موسكو", "مكسيكو سيتي", "الرياض", "الرباط"],
    animals: ["الأسد", "الفيل", "الزرافة", "القرش", "النسر", "النمر", "التمساح", "الباندا", "الكنغر", "البطريق", "الذئب", "الثعلب"],
    planets: ["عطارد", "الزهرة", "الأرض", "المريخ", "المشتري", "زحل", "أورانوس", "نبتون"],
    inventions: ["المصباح", "الهاتف", "الإنترنت", "السيارة", "الطائرة", "الحاسوب"],
    inventors: ["إديسون", "جراهام بيل", "تيم بيرنرز لي", "فورد", "الاخوة رايت", "تشارلز باباج"]
  },
  en: {
    countries: ["France", "Japan", "Egypt", "Brazil", "China", "Germany", "India", "Canada", "Australia", "Spain", "Italy", "Russia", "Mexico", "Saudi Arabia", "Morocco"],
    cities: ["Paris", "Tokyo", "Cairo", "Rio de Janeiro", "Beijing", "Berlin", "New Delhi", "Ottawa", "Canberra", "Madrid", "Rome", "Moscow", "Mexico City", "Riyadh", "Rabat"],
    animals: ["Lion", "Elephant", "Giraffe", "Shark", "Eagle", "Tiger", "Crocodile", "Panda", "Kangaroo", "Penguin", "Wolf", "Fox"],
    planets: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"],
    inventions: ["Light bulb", "Telephone", "Internet", "Car", "Airplane", "Computer"],
    inventors: ["Edison", "Graham Bell", "Tim Berners-Lee", "Ford", "Wright Brothers", "Charles Babbage"]
  }
};

const TEMPLATES = {
  ar: [
    { text: "ما هي عاصمة {country}؟", category: "countries", answerKey: "cities" },
    { text: "أي كوكب يرتيب في المركز {num} من الشمس؟", category: "planets", answerKey: "planets" },
    { text: "من هو مخترع {invention}؟", category: "inventions", answerKey: "inventors" },
    { text: "أيهما يعتبر من فصيلة الثدييات؟", options: ["الحوت", "القرش", "التمساح", "الأفعى"], correct: 0 },
    { text: "ما هو الرمز الكيميائي للماء؟", options: ["H2O", "CO2", "O2", "NaCl"], correct: 0 },
    { text: "كم عدد القارات في العالم؟", options: ["5", "6", "7", "8"], correct: 2 }
  ],
  en: [
    { text: "What is the capital of {country}?", category: "countries", answerKey: "cities" },
    { text: "Which planet is {num} from the Sun?", category: "planets", answerKey: "planets" },
    { text: "Who invented the {invention}?", category: "inventions", answerKey: "inventors" },
    { text: "Which of these is a mammal?", options: ["Whale", "Shark", "Crocodile", "Snake"], correct: 0 },
    { text: "What is the chemical symbol for Water?", options: ["H2O", "CO2", "O2", "NaCl"], correct: 0 },
    { text: "How many continents are there?", options: ["5", "6", "7", "8"], correct: 2 }
  ]
};

async function generateProceduralQuestion(type, lang) {
  const id = `ai_proc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const isAr = lang === 'ar';
  
  if (type === 'TRIVIA') {
    const templates = TEMPLATES[lang] || TEMPLATES.en;
    const t = pickRandom(templates);
    
    if (t.category) {
      const entities = ENTITIES[lang] || ENTITIES.en;
      const index = Math.floor(Math.random() * entities[t.category].length);
      const entity = entities[t.category][index];
      const correct = entities[t.answerKey][index];
      
      const others = shuffle(entities[t.answerKey].filter(x => x !== correct)).slice(0, 3);
      const answers = shuffle([correct, ...others]);
      
      let questionText = t.text;
      if (t.category === 'countries') questionText = questionText.replace('{country}', entity);
      if (t.category === 'inventions') questionText = questionText.replace('{invention}', entity);
      if (t.category === 'planets') questionText = questionText.replace('{num}', index + 1);
      
      return {
        id,
        text: questionText,
        answers,
        correctIndex: answers.indexOf(correct)
      };
    }
    
    const answers = t.options;
    return { id, text: t.text, answers, correctIndex: t.correct };
  }

  if (type === 'SCRAMBLED_WORD') {
    const dict = {
      ar: ["مدرسة", "جامعة", "سيارة", "طائرة", "كتاب", "قلم", "منزل", "حديقة", "بحر", "جبل", "شمس", "قمر", "نجم", "سماء", "أرض", "حيوان", "نبات", "إنسان", "فواكه", "خضروات", "عصير", "طعام", "شراب", "نوم", "لعب", "دراسة", "عمل", "سفر", "رياضة", "موسيقى", "فن", "تاريخ", "جغرافيا", "علوم", "رياضيات", "لغة", "ثقافة", "تكنولوجيا", "حاسوب", "هاتف", "إنترنت", "برمجة", "ذكاء", "قلب", "حب", "سلام", "حرية", "عدالة", "قوة", "شجاعة", "صبر", "أمل", "سعادة"],
      en: ["SCHOOL", "UNIVERSITY", "CAR", "PLANE", "BOOK", "PEN", "HOUSE", "GARDEN", "OCEAN", "MOUNTAIN", "SUN", "MOON", "STAR", "SKY", "EARTH", "ANIMAL", "PLANT", "HUMAN", "FRUIT", "VEGETABLE", "JUICE", "FOOD", "DRINK", "SLEEP", "PLAY", "STUDY", "WORK", "TRAVEL", "SPORT", "MUSIC", "ART", "HISTORY", "GEOGRAPHY", "SCIENCE", "MATH", "LANGUAGE", "CULTURE", "TECH", "COMPUTER", "PHONE", "INTERNET", "CODING", "AI", "HEART", "LOVE", "PEACE", "FREEDOM", "JUSTICE", "POWER", "BRAVE", "PATIENCE", "HOPE", "HAPPY"]
    };
    const words = dict[lang] || dict.en;
    const word = pickRandom(words);
    const scrambled = shuffle(word.split('')).join(' ');
    return { id, scrambled, correct: word };
  }

  if (type === 'ESTIMATION') {
    const data = {
      ar: [
        { t: "كم عدد سكان العالم بالمليار تقريباً؟", a: 8 },
        { t: "كم عدد أسنان الإنسان البالغ؟", a: 32 },
        { t: "كم عدد ألوان قوس قزح؟", a: 7 },
        { t: "كم دقيقة في الأسبوع؟", a: 10080 },
        { t: "كم عدد الدول في العالم تقريباً؟", a: 195 },
        { t: "كم سنة استمرت حرب المائة عام؟", a: 116 },
        { t: "كم عدد العظام في جسم الإنسان البالغ؟", a: 206 }
      ],
      en: [
        { t: "Approx world population in billions?", a: 8 },
        { t: "Number of teeth in an adult?", a: 32 },
        { t: "Colors in a rainbow?", a: 7 },
        { t: "How many minutes in a week?", a: 10080 },
        { t: "How many countries are in the world?", a: 195 },
        { t: "How many years did the 100 Years War last?", a: 116 },
        { t: "How many bones in an adult human body?", a: 206 }
      ]
    };
    const item = pickRandom(data[lang] || data.en);
    return { id, text: item.t, correctAnswer: item.a };
  }

  if (type === 'SPEED_MATH') {
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * 20) + 5;
    const ops = ['+', '-', '*'];
    const op = pickRandom(ops);
    let ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
    const options = shuffle([ans, ans + 2, ans - 5, ans + 10]);
    return { id, text: `${a} ${op === '*' ? '×' : op} ${b} = ?`, answers: options.map(String), correctIndex: options.indexOf(ans) };
  }

  return { 
    id, 
    text: isAr ? "سؤال ذكاء: ما هو أسرع حيوان؟" : "AI Quiz: What is the fastest animal?", 
    answers: isAr ? ["الفهد", "الأسد", "النسر", "القرش"] : ["Cheetah", "Lion", "Eagle", "Shark"], 
    correctIndex: 0 
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

module.exports = {
  generateFunnyPrompt,
  getChaosEvent,
  generateProceduralQuestion
};

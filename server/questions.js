// ─── Bilingual Question Bank (High-Difficulty Trick Content) ───

const TRIVIA = {
  ar: [
    { id: "t1", text: "كم شهر في السنة لديه 28 يوماً؟", answers: ["1", "6", "12", "حسب السنة"], correctIndex: 2, difficulty: 5 },
    { id: "t2", text: "ما هو الشيء الذي يأتي مرة في الدقيقة، مرتين في اللحظة، ولا يأتي أبداً في ألف سنة؟", answers: ["حرف الميم", "الوقت", "النفس", "الثانية"], correctIndex: 0, difficulty: 5 },
    { id: "t3", text: "إذا كنت في سباق وتجاوزت الشخص في المركز الثاني، في أي مركز تصبح؟", answers: ["الأول", "الثاني", "الثالث", "الأخير"], correctIndex: 1, difficulty: 5 },
    { id: "t4", text: "مزارع لديه 17 خروفاً، ماتوا كلهم إلا 9. كم خروفاً بقي؟", answers: ["8", "9", "17", "0"], correctIndex: 1, difficulty: 5 },
    { id: "t5", text: "كم كمية التراب الموجودة في حفرة عمقها 3 أمتار وعرضها 6 أمتار؟", answers: ["18 متر", "لا يوجد", "54 متر", "حسب نوع التربة"], correctIndex: 1, difficulty: 5 },
    { id: "t6", text: "أيهما أثقل: طن من الذهب أم طن من الريش؟", answers: ["الذهب", "الريش", "متساويان", "حسب الحجم"], correctIndex: 2, difficulty: 5 },
    { id: "t7", text: "ما هي إجابة هذا السؤال؟", answers: ["هذه", "لا، هذه", "خطأ", "صح"], correctIndex: 3, difficulty: 5 },
    { id: "t8", text: "إذا كانت 3 قطط تصطاد 3 فئران في 3 دقائق، كم قطة نحتاج لاصطياد 100 فأر في 100 دقيقة؟", answers: ["100", "3", "33", "1"], correctIndex: 1, difficulty: 5 },
    { id: "t9", text: "اقسم 30 على 1/2 واجمع 10. ما هي النتيجة؟", answers: ["25", "70", "40", "15"], correctIndex: 1, difficulty: 5 },
    { id: "t10", text: "ما هو أعلى جبل في العالم قبل اكتشاف قمة إيفرست؟", answers: ["K2", "فوجي", "إيفرست", "كليمنجارو"], correctIndex: 2, difficulty: 5 },
    { id: "t11", text: "كم عدد أرجل العنكبوت؟", answers: ["6", "8", "10", "12"], correctIndex: 1 },
    { id: "t12", text: "ما هو الكوكب الأحمر؟", answers: ["الزهرة", "المريخ", "المشتري", "عطارد"], correctIndex: 1 },
    { id: "t13", text: "ما هو أسرع حيوان بري؟", answers: ["الأسد", "الفهد", "النمر", "الحصان"], correctIndex: 1 },
    { id: "t14", text: "ما هو لون الزمرد؟", answers: ["أزرق", "أحمر", "أخضر", "أصفر"], correctIndex: 2 },
    { id: "t15", text: "كم عدد ألوان قوس القزح؟", answers: ["5", "6", "7", "8"], correctIndex: 2 }
  ],
  en: [
    { id: "t1", text: "How many months have 28 days?", answers: ["1", "6", "12", "Depends on Year"], correctIndex: 2, difficulty: 5 },
    { id: "t2", text: "What comes once in a minute, twice in a moment, but never in a thousand years?", answers: ["The letter M", "Time", "Breath", "A second"], correctIndex: 0, difficulty: 5 },
    { id: "t3", text: "If you pass the person in 2nd place, what place are you in?", answers: ["1st", "2nd", "3rd", "Last"], correctIndex: 1, difficulty: 5 },
    { id: "t4", text: "A farmer has 17 sheep and all but 9 die. How many are left?", answers: ["8", "9", "17", "0"], correctIndex: 1, difficulty: 5 },
    { id: "t5", text: "How much dirt is in a hole that is 3ft deep and 6ft wide?", answers: ["18ft", "None", "54ft", "Depends on soil"], correctIndex: 1, difficulty: 5 },
    { id: "t6", text: "Which is heavier: a ton of gold or a ton of feathers?", answers: ["Gold", "Feathers", "Both equal", "Depends on volume"], correctIndex: 2, difficulty: 5 },
    { id: "t7", text: "What is the answer to this question?", answers: ["This one", "No, this one", "Wrong", "Correct"], correctIndex: 3, difficulty: 5 },
    { id: "t8", text: "If 3 cats catch 3 mice in 3 minutes, how many cats catch 100 mice in 100 minutes?", answers: ["100", "3", "33", "1"], correctIndex: 1, difficulty: 5 },
    { id: "t9", text: "Divide 30 by 1/2 and add 10. What is the result?", answers: ["25", "70", "40", "15"], correctIndex: 1, difficulty: 5 },
    { id: "t10", text: "What was the tallest mountain before Everest was discovered?", answers: ["K2", "Mount Fuji", "Mount Everest", "Kilimanjaro"], correctIndex: 2, difficulty: 5 },
    { id: "t11", text: "How many legs does a spider have?", answers: ["6", "8", "10", "12"], correctIndex: 1 },
    { id: "t12", text: "What is the red planet?", answers: ["Venus", "Mars", "Jupiter", "Mercury"], correctIndex: 1 },
    { id: "t13", text: "What is the fastest land animal?", answers: ["Lion", "Cheetah", "Tiger", "Horse"], correctIndex: 1 },
    { id: "t14", text: "What color is an emerald?", answers: ["Blue", "Red", "Green", "Yellow"], correctIndex: 2 },
    { id: "t15", text: "How many colors are in a rainbow?", answers: ["5", "6", "7", "8"], correctIndex: 2 }
  ],
};

const TRUE_FALSE = {
  ar: [
    { id: "tf1", text: "سور الصين العظيم يُرى من القمر.", answer: false, difficulty: 5 },
    { id: "tf2", text: "إجابة هذا السؤال هي 'خطأ'.", answer: false, difficulty: 5 },
    { id: "tf3", text: "الضفادع لا تنام أبداً.", answer: true, difficulty: 5 },
    { id: "tf4", text: "ذاكرة السمكة الذهبية 3 ثوانٍ فقط.", answer: false, difficulty: 5 },
    { id: "tf5", text: "الطماطم تعتبر من الفواكه.", answer: true, difficulty: 5 },
    { id: "tf6", text: "الفول السوداني هو نوع من المكسرات.", answer: false, difficulty: 5 },
    { id: "tf7", text: "نابليون كان قصيراً جداً بشكل غير عادي.", answer: false, difficulty: 5 },
    { id: "tf8", text: "يوجد أكثر من 24 ساعة في اليوم الواحد.", answer: true, difficulty: 5 },
    { id: "tf9", text: "القلب هو أقوى عضلة في الجسم.", answer: false },
    { id: "tf10", text: "الأخطبوط لديه ثلاثة قلوب.", answer: true },
    { id: "tf11", text: "الموز ينمو على الأشجار.", answer: false },
    { id: "tf12", text: "الذهب لا يصدأ.", answer: true }
  ],
  en: [
    { id: "tf1", text: "The Great Wall of China is visible from the moon.", answer: false, difficulty: 5 },
    { id: "tf2", text: "The answer to this question is False.", answer: false, difficulty: 5 },
    { id: "tf3", text: "Bullfrogs never sleep.", answer: true, difficulty: 5 },
    { id: "tf4", text: "Goldfish have a 3-second memory.", answer: false, difficulty: 5 },
    { id: "tf5", text: "A tomato is a fruit.", answer: true, difficulty: 5 },
    { id: "tf6", text: "Peanuts are a type of nut.", answer: false, difficulty: 5 },
    { id: "tf7", text: "Napoleon was extremely short.", answer: false, difficulty: 5 },
    { id: "tf8", text: "There are more than 24 hours in a day.", answer: true, difficulty: 5 },
    { id: "tf9", text: "The heart is the strongest muscle.", answer: false },
    { id: "tf10", text: "An octopus has three hearts.", answer: true },
    { id: "tf11", text: "Bananas grow on trees.", answer: false },
    { id: "tf12", text: "Gold does not rust.", answer: true }
  ],
};

const MIND_GAMES = {
  ar: [
    { id: "m1", text: "لدي مفاتيح ولكن لا أقفال. لدي مساحة ولكن لا غرف. يمكنك الدخول ولكن لا يمكنك الخروج. ما أنا؟", answers: ["لوحة المفاتيح", "السجن", "الخريطة", "المكتبة"], correctIndex: 0 },
    { id: "m2", text: "كلما زاد هذا الشيء، قلّت رؤيتك. ما هو؟", answers: ["الظلام", "الضوء", "الضباب", "المسافة"], correctIndex: 0 },
    { id: "m3", text: "ما الشيء الذي يمكنك الإمساك به ولكن لا يمكنك رميه؟", answers: ["البرد", "الكرة", "السر", "الظل"], correctIndex: 0 },
    { id: "m4", text: "ما الشيء الذي يملكه الجميع ولكن الآخرين يستخدمونه أكثر منك؟", answers: ["اسمك", "مالك", "هاتفك", "سيارتك"], correctIndex: 0 }
  ],
  en: [
    { id: "m1", text: "I have keys but no locks. I have space but no room. You can enter, but never leave. What am I?", answers: ["Keyboard", "Prison", "Map", "Library"], correctIndex: 0 },
    { id: "m2", text: "The more of this there is, the less you see. What is it?", answers: ["Darkness", "Light", "Fog", "Distance"], correctIndex: 0 },
    { id: "m3", text: "What can you catch but not throw?", answers: ["A cold", "A ball", "A secret", "A shadow"], correctIndex: 0 },
    { id: "m4", text: "What belongs to you, but others use it more than you do?", answers: ["Your name", "Your money", "Your phone", "Your car"], correctIndex: 0 }
  ]
};

const EMOJI_GUESS = {
  ar: [
    { id: "e1", emojis: "🍕🇮🇹", answers: ["سوشي", "بيتزا", "تاكو", "برجر"], correctIndex: 1 },
    { id: "e2", emojis: "🦁👑", answers: ["كتاب الأدغال", "الأسد الملك", "نارنيا", "مدغشقر"], correctIndex: 1 },
    { id: "e3", emojis: "🎥🍿", answers: ["سينما", "حديقة", "مطعم", "نادي"], correctIndex: 0 },
    { id: "e4", emojis: "❄️🏰👸", answers: ["فروزن", "سندريلا", "موانا", "شريك"], correctIndex: 0 },
    { id: "e5", emojis: "⚡👓👦", answers: ["هاري بوتر", "باتمان", "سوبرمان", "سبايدر مان"], correctIndex: 0 },
    { id: "e6", emojis: "🥚🐣🐥", answers: ["دجاجة", "بيضة", "عصفور", "بطة"], correctIndex: 0 },
    { id: "e7", emojis: "🍎📱", answers: ["أبل", "سامسونج", "هواوي", "نوكيا"], correctIndex: 0 }
  ],
  en: [
    { id: "e1", emojis: "🍕🇮🇹", answers: ["Sushi", "Pizza", "Tacos", "Burger"], correctIndex: 1 },
    { id: "e2", emojis: "🦁👑", answers: ["Jungle Book", "Lion King", "Narnia", "Madagascar"], correctIndex: 1 },
    { id: "e3", emojis: "🎥🍿", answers: ["Cinema", "Park", "Restaurant", "Club"], correctIndex: 0 },
    { id: "e4", emojis: "❄️🏰👸", answers: ["Frozen", "Cinderella", "Moana", "Shrek"], correctIndex: 0 },
    { id: "e5", emojis: "⚡👓👦", answers: ["Harry Potter", "Batman", "Superman", "Spider-Man"], correctIndex: 0 },
    { id: "e6", emojis: "🥚🐣🐥", answers: ["Chicken", "Egg", "Bird", "Duck"], correctIndex: 0 },
    { id: "e7", emojis: "🍎📱", answers: ["Apple", "Samsung", "Huawei", "Nokia"], correctIndex: 0 }
  ]
};

const ESTIMATION = {
  ar: [
    { id: "est1", text: "كم كرة أرضية تدخل في الشمس؟", answer: 1300000 },
    { id: "est2", text: "كم درجة في برج إيفل؟", answer: 1665 },
    { id: "est3", text: "كم عدد عظام الإنسان البالغ؟", answer: 206 },
    { id: "est4", text: "كم عدد أسنان الشخص البالغ؟", answer: 32 },
    { id: "est5", text: "كم عدد القارات في العالم؟", answer: 7 },
    { id: "est6", text: "كم عدد ولايات أمريكا؟", answer: 50 },
    { id: "est7", text: "كم عدد مفاتيح البيانو؟", answer: 88 }
  ],
  en: [
    { id: "est1", text: "How many Earths fit inside the Sun?", answer: 1300000 },
    { id: "est2", text: "How many steps in the Eiffel Tower?", answer: 1665 },
    { id: "est3", text: "How many bones in an adult human?", answer: 206 },
    { id: "est4", text: "How many teeth in an adult human?", answer: 32 },
    { id: "est5", text: "How many continents are there?", answer: 7 },
    { id: "est6", text: "How many US states are there?", answer: 50 },
    { id: "est7", text: "How many keys on a piano?", answer: 88 }
  ]
};

function shuffleOptions(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMathProblem() {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  if (op === '+') { a = Math.floor(Math.random() * 50) + 5; b = Math.floor(Math.random() * 50) + 5; answer = a + b; }
  else if (op === '-') { a = Math.floor(Math.random() * 50) + 30; b = Math.floor(Math.random() * 30) + 1; answer = a - b; }
  else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; answer = a * b; }

  const options = shuffleOptions([answer, answer + 5, answer - 5, answer + 10]);
  const correctIndex = options.indexOf(answer);
  return {
    text: `${a} ${op} ${b} = ?`,
    answers: options.map(String),
    correctIndex: correctIndex,
  };
}

module.exports = { TRIVIA, TRUE_FALSE, EMOJI_GUESS, ESTIMATION, MIND_GAMES, generateMathProblem };

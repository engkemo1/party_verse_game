// ─── Bilingual Question Bank (High-Difficulty Trick Content) ───

const TRIVIA = {
  ar: [
    // --- Science & Tech ---
    { id: "sci1", category: "SCIENCE", text: "ما هو العنصر الكيميائي الأكثر وفرة في الكون؟", answers: ["الأكسجين", "الهيدروجين", "الهيليوم", "النيتروجين"], correctIndex: 1 },
    { id: "sci2", category: "SCIENCE", text: "كم يستغرق ضوء الشمس للوصول إلى الأرض؟", answers: ["8 دقائق", "30 ثانية", "ساعة واحدة", "فوري"], correctIndex: 0 },
    { id: "sci3", category: "SCIENCE", text: "ما هو الكوكب الذي يمتلك أكبر عدد من الأقمار؟", answers: ["المشتري", "زحل", "نبتون", "المريخ"], correctIndex: 1 },
    { id: "sci4", category: "SCIENCE", text: "من هو مخترع المصباح الكهربائي؟", answers: ["نيكولا تسلا", "توماس إديسون", "ألكسندر جراهام بيل", "آينشتاين"], correctIndex: 1 },
    
    // --- Sports & Football ---
    { id: "spt1", category: "SPORTS", text: "أي دولة فازت بكأس العالم لكرة القدم 2022؟", answers: ["فرنسا", "الأرجنتين", "البرازيل", "ألمانيا"], correctIndex: 1 },
    { id: "spt2", category: "SPORTS", text: "من هو اللاعب الذي فاز بأكبر عدد من كرات الذهب (Ballon d'Or)؟", answers: ["كريستيانو رونالدو", "ليونيل ميسي", "بيليه", "مارادونا"], correctIndex: 1 },
    { id: "spt3", category: "SPORTS", text: "كم عدد لاعبي فريق كرة السلة في الملعب؟", answers: ["5", "6", "7", "11"], correctIndex: 0 },
    { id: "spt4", category: "SPORTS", text: "في أي مدينة أقيمت أول ألعاب أولمبية حديثة؟", answers: ["باريس", "أثينا", "لندن", "روما"], correctIndex: 1 },
    
    // --- History & Culture ---
    { id: "his1", category: "HISTORY", text: "من هو الملك الذي بنى الهرم الأكبر في الجيزة؟", answers: ["خفرع", "منقرع", "خوفو", "رمسيس الثاني"], correctIndex: 2 },
    { id: "his2", category: "HISTORY", text: "في أي عام انتهت الحرب العالمية الثانية؟", answers: ["1918", "1939", "1945", "1950"], correctIndex: 2 },
    { id: "his3", category: "HISTORY", text: "من هي الملكة التي اشتهرت بجمالها وانتحرت بلدغة أفعى؟", answers: ["نفرتيتي", "كليوباترا", "شجر الدر", "بلقيس"], correctIndex: 1 },
    { id: "his4", category: "HISTORY", text: "ما هي عاصمة الدولة الأموية؟", answers: ["بغداد", "دمشق", "القاهرة", "المدينة المنورة"], correctIndex: 1 },
    
    // --- Entertainment ---
    { id: "ent1", category: "ENTERTAINMENT", text: "ما هو الفيلم الأعلى تحقيقاً للإيرادات في التاريخ? ", answers: ["تايتانيك", "أفاتار", "المنتقمون: نهاية اللعبة", "حرب النجوم"], correctIndex: 1 },
    { id: "ent2", category: "ENTERTAINMENT", text: "من هو الممثل الذي لعب دور 'الجوكر' في فيلم The Dark Knight؟", answers: ["خواكين فينيكس", "هيث ليدجر", "جاريد ليتو", "جاك نيكلسون"], correctIndex: 1 },
    { id: "ent3", category: "ENTERTAINMENT", text: "ما هو المسلسل الذي تدور أحداثه في عالم 'ويستروس'؟", answers: ["بريكنج باد", "صراع العروش", "سترينجر ثينجز", "ذا ويتشر"], correctIndex: 1 },
    { id: "ent4", category: "ENTERTAINMENT", text: "من هي المغنية الملقبة بـ 'كوكب الشرق'؟", answers: ["فيروز", "أم كلثوم", "وردة", "أسمهان"], correctIndex: 1 },
    { id: "spt5", category: "SPORTS", text: "من هو الهداف التاريخي لكأس العالم؟", answers: ["بيليه", "ميروسلاف كلوزه", "رونالدو", "ميسي"], correctIndex: 1 },
    { id: "spt6", category: "SPORTS", text: "أي نادٍ فاز بأكبر عدد من ألقاب دوري أبطال أوروبا؟", answers: ["ميلان", "ليفربول", "ريال مدريد", "برشلونة"], correctIndex: 2 },
    { id: "sci5", category: "SCIENCE", text: "ما هو أقرب كوكب للشمس؟", answers: ["المريخ", "الزهرة", "عطارد", "الأرض"], correctIndex: 2 },
    { id: "sci6", category: "SCIENCE", text: "ما هو الغاز الذي تتنفسه النباتات؟", answers: ["الأكسجين", "ثاني أكسيد الكربون", "النيتروجين", "الهيدروجين"], correctIndex: 1 },
    { id: "his5", category: "HISTORY", text: "من هو القائد الذي فتح الأندلس؟", answers: ["خالد بن الوليد", "طارق بن زياد", "صلاح الدين الأيوبي", "عمرو بن العاص"], correctIndex: 1 },
    { id: "his6", category: "HISTORY", text: "أي حضارة بنيت الأهرامات؟", answers: ["البابلية", "الرومانية", "المصرية القديمة", "اليونانية"], correctIndex: 2 },
    { id: "ent5", category: "ENTERTAINMENT", text: "ما هو اسم بطل سلسلة أفلام 'قراصنة الكاريبي'؟", answers: ["جاك سبارو", "آيرون مان", "جيمس بوند", "هاري بوتر"], correctIndex: 0 },
    { id: "ent6", category: "ENTERTAINMENT", text: "من هو مؤلف سلسلة روايات هاري بوتر؟", answers: ["جورج آر آر مارتن", "جيه كيه رولينغ", "أجاثا كريستي", "ستيفن كينج"], correctIndex: 1 },

    // --- Trick Questions (Originals & More) ---
    { id: "t1", category: "TRICK", text: "كم شهر في السنة لديه 28 يوماً؟", answers: ["1", "6", "12", "حسب السنة"], correctIndex: 2, difficulty: 5 },
    { id: "t2", category: "TRICK", text: "ما هو الشيء الذي يأتي مرة في الدقيقة، مرتين في اللحظة، ولا يأتي أبداً في ألف سنة؟", answers: ["حرف الميم", "الوقت", "النفس", "الثانية"], correctIndex: 0, difficulty: 5 },
    { id: "t3", category: "TRICK", text: "إذا كنت في سباق وتجاوزت الشخص في المركز الثاني، في أي مركز تصبح؟", answers: ["الأول", "الثاني", "الثالث", "الأخير"], correctIndex: 1, difficulty: 5 },
    { id: "t4", category: "TRICK", text: "مزارع لديه 17 خروفاً، ماتوا كلهم إلا 9. كم خروفاً بقي؟", answers: ["8", "9", "17", "0"], correctIndex: 1, difficulty: 5 },
    { id: "t5", category: "TRICK", text: "كم كمية التراب الموجودة في حفرة عمقها 3 أمتار وعرضها 6 أمتار؟", answers: ["18 متر", "لا يوجد", "54 متر", "حسب نوع التربة"], correctIndex: 1, difficulty: 5 },
    { id: "t8", category: "TRICK", text: "إذا كانت 3 قطط تصطاد 3 فئران في 3 دقائق، كم قطة نحتاج لاصطياد 100 فأر في 100 دقيقة؟", answers: ["100", "3", "33", "1"], correctIndex: 1, difficulty: 5 },
    { id: "t9", category: "TRICK", text: "اقسم 30 على 1/2 واجمع 10. ما هي النتيجة؟", answers: ["25", "70", "40", "15"], correctIndex: 1, difficulty: 5 }
  ],
  en: [
    // --- Science & Tech ---
    { id: "sci1", category: "SCIENCE", text: "What is the most abundant element in the universe?", answers: ["Oxygen", "Hydrogen", "Helium", "Nitrogen"], correctIndex: 1 },
    { id: "sci2", category: "SCIENCE", text: "How long does sunlight take to reach Earth?", answers: ["8 minutes", "30 seconds", "1 hour", "Instant"], correctIndex: 0 },
    { id: "sci3", category: "SCIENCE", text: "Which planet has the most moons?", answers: ["Jupiter", "Saturn", "Neptune", "Mars"], correctIndex: 1 },
    { id: "sci4", category: "SCIENCE", text: "Who invented the lightbulb?", answers: ["Tesla", "Edison", "Bell", "Einstein"], correctIndex: 1 },

    // --- Sports ---
    { id: "spt1", category: "SPORTS", text: "Which country won the 2022 FIFA World Cup?", answers: ["France", "Argentina", "Brazil", "Germany"], correctIndex: 1 },
    { id: "spt2", category: "SPORTS", text: "Who has won the most Ballon d'Or awards?", answers: ["Ronaldo", "Messi", "Pelé", "Maradona"], correctIndex: 1 },
    { id: "spt3", category: "SPORTS", text: "How many players are on a basketball court per team?", answers: ["5", "6", "7", "11"], correctIndex: 0 },

    // --- History ---
    { id: "his1", category: "HISTORY", text: "Who built the Great Pyramid of Giza?", answers: ["Khafre", "Menkaure", "Khufu", "Ramesses II"], correctIndex: 2 },
    { id: "his2", category: "HISTORY", text: "In what year did WWII end?", answers: ["1918", "1939", "1945", "1950"], correctIndex: 2 },

    // --- Entertainment ---
    { id: "ent1", category: "ENTERTAINMENT", text: "What is the highest-grossing film of all time?", answers: ["Titanic", "Avatar", "Avengers: Endgame", "Star Wars"], correctIndex: 1 },
    { id: "ent2", category: "ENTERTAINMENT", text: "Who played the Joker in 'The Dark Knight'?", answers: ["Phoenix", "Heath Ledger", "Leto", "Nicholson"], correctIndex: 1 },
    { id: "ent3", category: "ENTERTAINMENT", text: "Which show is set in the world of Westeros?", answers: ["Breaking Bad", "Game of Thrones", "Stranger Things", "The Witcher"], correctIndex: 1 },
    { id: "spt5", category: "SPORTS", text: "Who is the all-time top scorer in FIFA World Cup history?", answers: ["Pelé", "Miroslav Klose", "Ronaldo", "Messi"], correctIndex: 1 },
    { id: "spt6", category: "SPORTS", text: "Which club has won the most UEFA Champions League titles?", answers: ["Milan", "Liverpool", "Real Madrid", "Barcelona"], correctIndex: 2 },
    { id: "sci5", category: "SCIENCE", text: "What is the closest planet to the Sun?", answers: ["Mars", "Venus", "Mercury", "Earth"], correctIndex: 2 },
    { id: "sci6", category: "SCIENCE", text: "Which gas do plants absorb from the atmosphere?", answers: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], correctIndex: 1 },
    { id: "his5", category: "HISTORY", text: "Who was the first President of the United States?", answers: ["Lincoln", "Washington", "Jefferson", "Roosevelt"], correctIndex: 1 },
    { id: "his6", category: "HISTORY", text: "Which empire was ruled by Julius Caesar?", answers: ["Greek", "Roman", "Ottoman", "Persian"], correctIndex: 1 },
    { id: "ent4", category: "ENTERTAINMENT", text: "Who is the lead character in 'Pirates of the Caribbean'?", answers: ["Jack Sparrow", "Iron Man", "James Bond", "Harry Potter"], correctIndex: 0 },
    { id: "ent5", category: "ENTERTAINMENT", text: "Who wrote the 'Harry Potter' series?", answers: ["George R.R. Martin", "J.K. Rowling", "Agatha Christie", "Stephen King"], correctIndex: 1 },

    // --- Trick Questions ---
    { id: "t1", category: "TRICK", text: "How many months have 28 days?", answers: ["1", "6", "12", "Depends on Year"], correctIndex: 2, difficulty: 5 },
    { id: "t2", category: "TRICK", text: "What comes once in a minute, twice in a moment, but never in a thousand years?", answers: ["The letter M", "Time", "Breath", "A second"], correctIndex: 0, difficulty: 5 },
    { id: "t3", category: "TRICK", text: "If you pass the person in 2nd place, what place are you in?", answers: ["1st", "2nd", "3rd", "Last"], correctIndex: 1, difficulty: 5 }
  ],
};

const TRUE_FALSE = {
  ar: [
    { id: "tf1", category: "SCIENCE", text: "سور الصين العظيم يُرى من القمر.", answer: false },
    { id: "tf3", category: "SCIENCE", text: "الضفادع لا تنام أبداً.", answer: true },
    { id: "tf5", category: "SCIENCE", text: "الطماطم تعتبر من الفواكه.", answer: true },
    { id: "tf10", category: "SCIENCE", text: "الأخطبوط لديه ثلاثة قلوب.", answer: true },
    { id: "tf_spt1", category: "SPORTS", text: "هل فازت انجلترا بكأس العالم أكثر من مرة؟", answer: false },
    { id: "tf_his1", category: "HISTORY", text: "هل كان الميدليون أول من سكن العراق؟", answer: false },
    { id: "tf_ent1", category: "ENTERTAINMENT", text: "هل فاز فيلم تايتانيك بـ 11 جائزة أوسكار؟", answer: true }
  ],
  en: [
    { id: "tf1", category: "SCIENCE", text: "The Great Wall of China is visible from the moon.", answer: false },
    { id: "tf3", category: "SCIENCE", text: "Bullfrogs never sleep.", answer: true },
    { id: "tf5", category: "SCIENCE", text: "A tomato is a fruit.", answer: true },
    { id: "tf10", category: "SCIENCE", text: "An octopus has three hearts.", answer: true }
  ],
};

const MIND_GAMES = {
  ar: [
    { id: "m1", category: "LOGIC", text: "لدي مفاتيح ولكن لا أقفال. لدي مساحة ولكن لا غرف. يمكنك الدخول ولكن لا يمكنك الخروج. ما أنا؟", answers: ["لوحة المفاتيح", "السجن", "الخريطة", "المكتبة"], correctIndex: 0 },
    { id: "m2", category: "LOGIC", text: "كلما زاد هذا الشيء، قلّت رؤيتك. ما هو؟", answers: ["الظلام", "الضوء", "الضباب", "المسافة"], correctIndex: 0 },
    { id: "m3", category: "LOGIC", text: "ما الشيء الذي يمكنك الإمساك به ولكن لا يمكنك رميه؟", answers: ["البرد", "الكرة", "السر", "الظل"], correctIndex: 0 },
    { id: "m4", category: "LOGIC", text: "ما الشيء الذي يملكه الجميع ولكن الآخرين يستخدمونه أكثر منك؟", answers: ["اسمك", "مالك", "هاتفك", "سيارتك"], correctIndex: 0 }
  ],
  en: [
    { id: "m1", category: "LOGIC", text: "I have keys but no locks. I have space but no room. You can enter, but never leave. What am I?", answers: ["Keyboard", "Prison", "Map", "Library"], correctIndex: 0 },
    { id: "m2", category: "LOGIC", text: "The more of this there is, the less you see. What is it?", answers: ["Darkness", "Light", "Fog", "Distance"], correctIndex: 0 }
  ]
};

const EMOJI_GUESS = {
  ar: [
    { id: "e1", category: "FOOD", emojis: "🍕🇮🇹", answers: ["سوشي", "بيتزا", "تاكو", "برجر"], correctIndex: 1 },
    { id: "e2", category: "MOVIES", emojis: "🦁👑", answers: ["كتاب الأدغال", "الأسد الملك", "نارنيا", "مدغشقر"], correctIndex: 1 },
    { id: "e4", category: "MOVIES", emojis: "❄️🏰👸", answers: ["فروزن", "سندريلا", "موانا", "شريك"], correctIndex: 0 },
    { id: "e5", category: "MOVIES", emojis: "⚡👓👦", answers: ["هاري بوتر", "باتمان", "سوبرمان", "سبايدر مان"], correctIndex: 0 }
  ],
  en: [
    { id: "e1", category: "FOOD", emojis: "🍕🇮🇹", answers: ["Sushi", "Pizza", "Tacos", "Burger"], correctIndex: 1 },
    { id: "e2", category: "MOVIES", emojis: "🦁👑", answers: ["Jungle Book", "Lion King", "Narnia", "Madagascar"], correctIndex: 1 }
  ]
};

const ESTIMATION = {
  ar: [
    { id: "est1", category: "SCIENCE", text: "كم كرة أرضية تدخل في الشمس؟", answer: 1300000 },
    { id: "est2", category: "HISTORY", text: "كم درجة في برج إيفل؟", answer: 1665 },
    { id: "est3", category: "SCIENCE", text: "كم عدد عظام الإنسان البالغ؟", answer: 206 }
  ],
  en: [
    { id: "est1", category: "SCIENCE", text: "How many Earths fit inside the Sun?", answer: 1300000 },
    { id: "est2", category: "HISTORY", text: "How many steps in the Eiffel Tower?", answer: 1665 }
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

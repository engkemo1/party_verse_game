import React from 'react';
import { useSocket } from '../SocketContext';

const GAMES_DATA = [
  { type: "TRIVIA", icon: "🧠", en: "Pick the correct answer! Faster answers get more points.", ar: "اختر الإجابة الصحيحة! الإجابات الأسرع تحصل على نقاط أكثر." },
  { type: "TRUE_FALSE", icon: "✅", en: "Decide if the statement is True or False.", ar: "قرر ما إذا كانت العبارة صحيحة أم خاطئة." },
  { type: "SPEED_MATH", icon: "🔢", en: "Solve the math equation before time runs out.", ar: "حل المعادلة الرياضية قبل انتهاء الوقت." },
  { type: "EMOJI_GUESS", icon: "🤔", en: "Guess what the emojis represent.", ar: "خمن ماذا تمثل مجموعة الإيموجي." },
  { type: "ESTIMATION", icon: "📊", en: "Guess the closest number to the real answer.", ar: "خمن أقرب رقم للإجابة الصحيحة." },
  { type: "SCRAMBLED_WORD", icon: "🔤", en: "Unscramble the letters to form the correct word.", ar: "رتب الحروف لتكوين الكلمة الصحيحة." },
  { type: "FAST_TYPE", icon: "⌨️", en: "Type the exact word as fast as you can.", ar: "اكتب الكلمة بأسرع ما يمكن." },
  { type: "COLOR_MATCH", icon: "🎨", en: "Tap the WORD you read, not the color you see!", ar: "اضغط على الكلمة المكتوبة، وليس اللون الذي تراه!" },
  { type: "MEMORY_FLASH", icon: "👀", en: "Memorize the sequence, then pick the emoji that was NOT there.", ar: "احفظ التسلسل، ثم اختر الإيموجي الذي لم يكن موجوداً." },
  { type: "PATTERN_MASTER", icon: "🧩", en: "Memorize and repeat the exact sequence of symbols.", ar: "احفظ وكرر تسلسل الرموز بدقة." },
  { type: "SIMON_SAYS", icon: "🚥", en: "Repeat the sequence of colors.", ar: "كرر تسلسل الألوان." },
  { type: "INVISIBLE_MAZE", icon: "🚶", en: "Memorize the path before it disappears. One wrong step = fail.", ar: "تذكر المسار قبل اختفائه. خطأ واحد يعني الخسارة." },
  { type: "REACTION_TIME", icon: "⚡", en: "Wait for the color to turn blue, then tap immediately!", ar: "انتظر حتى يتحول اللون للأزرق، ثم اضغط فوراً!" },
  { type: "SUDDEN_DEATH", icon: "💀", en: "First player to tap wins the whole round.", ar: "أول لاعب يضغط يفوز بالجولة بأكملها." },
  { type: "CHAOS_TAP", icon: "👆", en: "Tap the button as many times as possible.", ar: "اضغط على الزر أكبر عدد ممكن من المرات." },
  { type: "SPAM_STOP", icon: "🛑", en: "Spam the button, but STOP immediately when it turns red!", ar: "اضغط بسرعة، لكن توقف فوراً عندما يصبح اللون أحمر!" },
  { type: "WHACK_A_MOLE", icon: "🔨", en: "Tap the moles as they randomly appear.", ar: "اضغط على الخلد كلما ظهر عشوائياً." },
  { type: "NEON_DASH", icon: "✨", en: "Tap the moving neon targets before they disappear.", ar: "اضغط على الأهداف النيونية المتحركة قبل اختفائها." },
  { type: "ARROW_DASH", icon: "⬆️", en: "Tap the arrows in the exact direction shown.", ar: "اضغط على الأسهم في نفس الاتجاه المعروض." },
  { type: "HEARTBEAT", icon: "💓", en: "Feel the rhythm! Tap exactly on the 4th, 5th, and 6th invisible beats.", ar: "اشعر بالإيقاع! اضغط بدقة على النبضات المخفية الرابعة والخامسة والسادسة." },
  { type: "DONT_PRESS", icon: "💣", en: "Hold the bomb for points, but if it explodes while holding it, you lose points!", ar: "اضغط لجمع النقاط، لكن إذا انفجرت القنبلة وأنت تضغط ستخسر نقاطاً!" },
  { type: "SOCIAL_VOTE", icon: "🗳️", en: "Vote for the player that best fits the description.", ar: "صوت للاعب الذي يناسب الوصف بشكل أفضل." },
  { type: "SECRET_CHOICE", icon: "🤫", en: "Pick an option. The player with the LEAST chosen option wins!", ar: "اختر شيئاً. اللاعب الذي يختار الخيار الأقل تكراراً يفوز!" },
  { type: "BLIND_BID", icon: "💰", en: "Bid your points for a prize. Highest unique bid wins, but everyone loses what they bid.", ar: "زايد بنقاطك لربح الجائزة. أعلى عطاء فريد يفوز، والجميع يخسر ما دفعه." },
  { type: "REVENGE_ROUND", icon: "🎯", en: "The player in last place picks a lucky number for a massive comeback.", ar: "اللاعب الأخير يختار رقم الحظ للحصول على فرصة عودة قوية." },
  { type: "ONE_VS_ALL", icon: "🏃", en: "First player to answer correctly wins all the points.", ar: "أول لاعب يجيب بشكل صحيح يحصل على كل النقاط." },
  { type: "FIND_THE_ODD", icon: "🔍", en: "Find the symbol that doesn't belong in the grid.", ar: "ابحث عن الرمز المختلف في الشبكة." }
];

export default function Rules({ onBack }) {
  const { lang } = useSocket();
  const isRtl = lang === 'ar';

  const t = {
    ar: {
      title: '📖 دليلك الشامل لـ PartyVerse',
      back: '🔙 عودة',
      howToStartTitle: 'كيف تبدأ اللعب؟',
      howToStartText: '1️⃣ يقوم شخص واحد (الـ Host) بإنشاء اللعبة ومشاركة الكود.\n2️⃣ ينضم باقي الأصدقاء باستخدام الكود (٤ حروف).\n3️⃣ يختار الـ Host مدة اللعبة وأنواع التحديات ثم يبدأ.',
      pointsTitle: 'النقاط والمضاعفات',
      pointsText: 'السرعة هي المفتاح! كلما أجبت بشكل صحيح وأسرع، حصلت على نقاط أكثر. في الجولة الأخيرة، تتضاعف جميع النقاط (الجولة الحاسمة).',
      streaksTitle: 'سلسلة الانتصارات والتريند (Streaks)',
      streaksText: 'إذا فزت في ٣ جولات متتالية، ستصبح On Fire 🔥 وسيظهر اسمك في الشاشة للجميع!',
      modifiersTitle: 'الأفخاخ والمفاجآت',
      modifiersText: 'بعض الجولات تحتوي على أفخاخ: مثل تبديل الألوان (Invert Colors) أو عكس التحكم أو إخفاء الشاشة! كن مستعداً لأي شيء.',
      gamesTitle: 'دليل الألعاب المصغرة',
    },
    en: {
      title: '📖 THE COMPLETE GUIDE',
      back: '🔙 BACK',
      howToStartTitle: 'HOW TO START',
      howToStartText: '1️⃣ One player (the Host) creates a room and shares the 4-letter code.\n2️⃣ Friends join using the code.\n3️⃣ The Host selects game modes and starts the party!',
      pointsTitle: 'SCORING & BONUSES',
      pointsText: 'Speed is key! Faster correct answers mean more points. In the final round, all points are DOUBLED for massive comebacks.',
      streaksTitle: 'WIN STREAKS',
      streaksText: 'Win 3 rounds in a row to go ON FIRE 🔥 and get featured in the viral highlights!',
      modifiersTitle: 'TRICKS & MODIFIERS',
      modifiersText: 'Watch out for sudden chaos! Some rounds might have inverted colors, reversed controls, or hidden UI. Adapt quickly!',
      gamesTitle: 'MINI-GAMES DIRECTORY',
    }
  };
  const s = t[lang] || t.en;

  return (
    <div className="rules-screen" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <button className="btn btn--secondary btn--small" style={{ marginBottom: '20px', alignSelf: 'flex-start' }} onClick={onBack}>
        {s.back}
      </button>

      <h1 className="title" style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', marginBottom: '20px' }}>{s.title}</h1>

      <div className="glass-card mb-md" style={{ padding: '20px' }}>
        <h2 style={{ color: 'var(--theme-primary)', marginBottom: '10px', fontSize: '1.2rem' }}>{s.howToStartTitle}</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '20px' }}>{s.howToStartText}</p>

        <h2 style={{ color: 'var(--gold)', marginBottom: '10px', fontSize: '1.2rem' }}>{s.pointsTitle}</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>{s.pointsText}</p>

        <h2 style={{ color: 'var(--hot-pink)', marginBottom: '10px', fontSize: '1.2rem' }}>{s.streaksTitle}</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>{s.streaksText}</p>

        <h2 style={{ color: 'var(--electric-blue)', marginBottom: '10px', fontSize: '1.2rem' }}>{s.modifiersTitle}</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{s.modifiersText}</p>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <h2 style={{ color: 'var(--theme-secondary)', marginBottom: '20px' }}>{s.gamesTitle}</h2>
        
        <div className="rules-grid">
          {GAMES_DATA.map((game, idx) => (
            <div key={idx} className="rule-item">
              <div className="rule-icon">{game.icon}</div>
              <div className="rule-info">
                <div className="rule-name">{game.type.replace(/_/g, ' ')}</div>
                <div className="rule-desc">{isRtl ? game.ar : game.en}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

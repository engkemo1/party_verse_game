import { useState } from 'react';
import { useSocket } from '../SocketContext';
import AdSense from '../components/AdSense';

export default function Home({ onShowRules }) {
  const { createRoom, joinRoom, error, lang, setLang } = useSocket();
  const [tab, setTab] = useState('join'); // 'join' or 'create'

  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const t = {
    ar: {
      title: 'بارتي\nفيرس',
      subtitle: 'تحديات مجنونة لأصدقائك',
      joinTab: 'انضمام',
      createTab: 'غرفة جديدة',
      yourName: 'اسم اللاعب',
      enterCode: 'كود الغرفة',
      joinBtn: '🚀 انطلق!',
      createBtn: '🎮 إنشاء اللعبة',
      langLabel: 'English',
    },
    en: {
      title: 'PARTY\nVERSE',
      subtitle: 'Crazy challenges with friends',
      joinTab: 'JOIN',
      createTab: 'HOST',
      yourName: 'YOUR NAME',
      enterCode: 'ROOM CODE',
      joinBtn: '🚀 LETS GO!',
      createBtn: '🎮 CREATE GAME',
      langLabel: 'العربية',
    },
  };
  const s = t[lang] || t.en;
  const isRtl = lang === 'ar';

  const handleAction = () => {
    if (!name.trim()) return;
    if (tab === 'join') {
      if (code.length === 4) joinRoom(code, name);
    } else {
      createRoom(name);
    }
  };

  return (
    <div className="home-screen" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Language Toggle */}
      <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
        🌐 {s.langLabel}
      </button>

      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="title" style={{ whiteSpace: 'pre-line' }}>{s.title}</h1>
        <p className="subtitle">{s.subtitle}</p>
      </div>

      {/* Action Card */}
      <div className="glass-card action-card">
        {/* Tabs */}
        <div className="segmented-control mb-md">
          <button 
            className={`segment-btn ${tab === 'join' ? 'active' : ''}`}
            onClick={() => setTab('join')}
          >
            {s.joinTab}
          </button>
          <button 
            className={`segment-btn ${tab === 'create' ? 'active' : ''}`}
            onClick={() => setTab('create')}
          >
            {s.createTab}
          </button>
        </div>

        <div className="flex-col gap-md">
          <input 
            className="text-input" 
            placeholder={s.yourName} 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            maxLength={12} 
          />
          
          {tab === 'join' && (
            <input 
              className="text-input text-input--code" 
              placeholder={s.enterCode} 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())} 
              maxLength={4} 
              style={{ direction: 'ltr' }} 
            />
          )}

          {error && <div className="error-bubble">{error}</div>}

          <button 
            className="btn btn--primary" 
            style={{ marginTop: '8px' }}
            disabled={!name.trim() || (tab === 'join' && code.length !== 4)} 
            onClick={handleAction}
          >
            {tab === 'join' ? s.joinBtn : s.createBtn}
          </button>
        </div>
      </div>
      
      {/* How to Play Button */}
      <button 
        className="btn btn--secondary btn--small" 
        onClick={onShowRules}
        style={{ marginTop: '16px', background: 'transparent', border: 'none', textDecoration: 'underline' }}
      >
        {isRtl ? '📖 كيف تلعب؟' : '📖 How to Play?'}
      </button>

      {/* Home Screen Banner Ad */}
      <AdSense slot="8328203300" style={{ display: 'block', height: '90px', width: '100%', marginTop: '30px', opacity: 0.8 }} />
    </div>
  );
}

import { useState } from 'react';
import { useSocket } from './SocketContext';
import Home from './screens/Home';
import Lobby from './screens/Lobby';
import Game from './screens/Game';
import Result from './screens/Result';
import Rules from './screens/Rules';
import { ReactionsOverlay } from './components/Chat';

export default function App() {
  const { room } = useSocket();
  const [showRules, setShowRules] = useState(false);

  const renderScreen = () => {
    if (showRules) return <Rules onBack={() => setShowRules(false)} />;
    
    if (!room) return <Home onShowRules={() => setShowRules(true)} />;
    
    switch (room.phase) {
      case 'LOBBY':
        return <Lobby />;
      case 'PLAYING':
        return <Game />;
      case 'ROUND_RESULT':
        return <Result />;
      default:
        return <Home onShowRules={() => setShowRules(true)} />;
    }
  };

  return (
    <div className="app-wrapper">
      <div className="bg-glow bg-glow--purple" />
      <div className="bg-glow bg-glow--blue" />
      <div className="main-container">
        {renderScreen()}
      </div>
      <ReactionsOverlay />
    </div>
  );
}

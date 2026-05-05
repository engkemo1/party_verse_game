import { useSocket } from './SocketContext';
import Home from './screens/Home';
import Lobby from './screens/Lobby';
import Game from './screens/Game';
import Result from './screens/Result';
import { ReactionsOverlay } from './components/Chat';

export default function App() {
  const { room } = useSocket();

  const renderScreen = () => {
    if (!room) return <Home />;
    switch (room.phase) {
      case 'LOBBY':
        return <Lobby />;
      case 'PLAYING':
        return <Game />;
      case 'ROUND_RESULT':
        return <Result />;
      default:
        return <Home />;
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

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [myId, setMyId] = useState(null);
  const [lang, setLang] = useState('ar'); // Default Arabic

  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const socket = io(import.meta.env.PROD ? '/' : 'http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => setMyId(socket.id));

    socket.on('room_update', (data) => {
      setRoom(data);
      setError(null);
    });

    socket.on('new_chat_message', (msg) => setChatMessages(prev => [...prev.slice(-49), msg]));
    
    socket.on('new_reaction', (r) => {
      const id = Math.random();
      setReactions(prev => [...prev, { ...r, id }]);
      setTimeout(() => setReactions(prev => prev.filter(x => x.id !== id)), 3000);
    });

    socket.on('tick', ({ timeLeft }) => {
      setRoom(prev => {
        if (!prev || !prev.game) return prev;
        const newPlaylist = [...prev.game.playlist];
        newPlaylist[prev.game.activeIndex] = { ...newPlaylist[prev.game.activeIndex], timeLeft };
        return { ...prev, game: { ...prev.game, timeLeft, playlist: newPlaylist } };
      });
    });

    socket.on('score_tick', ({ clicks }) => {
      setRoom(prev => {
        if (!prev || !prev.game) return prev;
        const newPlaylist = [...prev.game.playlist];
        newPlaylist[prev.game.activeIndex] = { ...newPlaylist[prev.game.activeIndex], clicks };
        // Also update at top level for convenience if UI uses it
        return { ...prev, game: { ...prev.game, clicks, playlist: newPlaylist } };
      });
    });

    socket.on('reaction_go', () => {
      setRoom(prev => {
        if (!prev || !prev.game) return prev;
        const newPlaylist = [...prev.game.playlist];
        newPlaylist[prev.game.activeIndex] = { ...newPlaylist[prev.game.activeIndex], reactPhase: 'GO', goTime: Date.now() };
        return { ...prev, game: { ...prev.game, playlist: newPlaylist } };
      });
    });

    socket.on('memory_hide', () => {
      setRoom(prev => {
        if (!prev || !prev.game) return prev;
        const newPlaylist = [...prev.game.playlist];
        newPlaylist[prev.game.activeIndex] = { ...newPlaylist[prev.game.activeIndex], showPhase: false };
        return { ...prev, game: { ...prev.game, playlist: newPlaylist } };
      });
    });

    socket.on('kicked', () => {
      resetLocal();
      setError('You have been kicked from the room.');
    });

    return () => socket.disconnect();
  }, []);

  const skipRound = () => {
    if (room) socketRef.current?.emit('skip_round', { roomId: room.id });
  };

  const nextRound = () => {
    if (room) socketRef.current?.emit('next_round', { roomId: room.id });
  };

  const kickPlayer = (playerId) => {
    if (room) socketRef.current?.emit('kick_player', { roomId: room.id, playerId });
  };

  const sendMessage = (text) => {
    if (room) socketRef.current?.emit('chat_message', { roomId: room.id, text });
  };

  const sendReaction = (emoji) => {
    if (room) socketRef.current?.emit('send_reaction', { roomId: room.id, emoji });
  };

  const sendQuickChat = (phrase) => {
    if (room) socketRef.current?.emit('quick_chat', { roomId: room.id, phrase });
  };

  const createRoom = (playerName) => {
    socketRef.current?.emit('create_room', { playerName, lang }, (res) => {
      if (!res.success) setError('Failed to create room');
    });
  };

  const joinRoom = (roomId, playerName) => {
    socketRef.current?.emit('join_room', { roomId, playerName }, (res) => {
      if (!res.success) setError(res.message || 'Could not join');
    });
  };

  const readyUp = () => {
    if (room) socketRef.current?.emit('ready_up', { roomId: room.id });
  };

  const startGame = () => {
    if (room) socketRef.current?.emit('start_game', { roomId: room.id });
  };

  const updateSettings = (settings) => {
    if (room) socketRef.current?.emit('update_settings', { roomId: room.id, ...settings });
  };

  const sendAction = (action, payload) => {
    if (room) socketRef.current?.emit('game_action', { roomId: room.id, action, payload });
  };

  const playAgain = () => {
    if (room) socketRef.current?.emit('play_again', { roomId: room.id });
  };

  const resetLocal = () => {
    setRoom(null);
    setError(null);
    setChatMessages([]);
  };

  return (
    <SocketContext.Provider value={{
      room, myId, error, lang, setLang, chatMessages, reactions,
      createRoom, joinRoom, readyUp, startGame, updateSettings, sendAction, playAgain, resetLocal,
      sendMessage, sendReaction, sendQuickChat, skipRound, kickPlayer, nextRound
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be inside SocketProvider');
  return ctx;
}

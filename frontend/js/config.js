const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1:5500';

export const SOCKET_URL = isLocal
  ? 'wss://guessing-game-10bm.onrender.com'
  : 'ws://localhost:8080';

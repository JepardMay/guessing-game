const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const SOCKET_URL = isLocal
  ? 'ws://localhost:8080' : 'wss://guessing-game-10bm.onrender.com';

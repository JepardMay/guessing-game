import { user } from "./user.js";
import { SOCKET_URL } from './config.js';
import { createWebSocket } from "./websocket.js";
import { DATA_TYPES, DRAW_ACTIONS } from './consts.js';
import { insertMessage } from "./chat.js";
import { activateScreen, updateRoomList, updateCurrentRoom } from "./rooms.js";

const loader = document.getElementById('loader');
const canvas = document.getElementById('drawing-board');
const timer = document.getElementById('countdown');

const ctx = canvas.getContext('2d');

let socket;
let reconnectAttempts = 0;

const handleRoomCreated = (data) => activateScreen({ screen: 'room', roomId: data.roomId, hostId: data.host.id });

const handleRoomUpdate = (data) => {
  if (user.roomId === data.roomId) {
    updateCurrentRoom(data.players);

    if (data.gameOn) {
      activateScreen({ screen: 'game', activePlayer: data.activePlayer });
    }
  }
};

const handleRoomLeft = () => activateScreen({ screen: 'lobby' });

const handlePlayerChanged = (data) => {
  clearTheCanvas();
  activateScreen({ screen: 'game', activePlayer: data.activePlayer });
};

const handleRoomListUpdate = (data) => updateRoomList(data.rooms);

const handleRoomJoined = (data) => activateScreen({ screen: 'room', roomId: data.roomId, hostId: data.host.id });

const handleSystem = (data) => insertMessage({ content: data.message }, true);

const handleChat = (data) => insertMessage(data);

const handleDraw = (data) => {
  if (data.sender.id === user.id) return;

  drawOnCanvas(data);
};

const handleTimerUpdate = (data) => {
  if (data.countdown < 10 && !timer.classList.contains('is-animated')) {
    timer.classList.add('is-animated');
  } else if (data.countdown >= 10 && timer.classList.contains('is-animated')) {
    timer.classList.remove('is-animated');
  }
  timer.textContent = data.countdown;
};

const drawOnCanvas = (data) => {
  if (data.action === DRAW_ACTIONS.CLEAR) {
    clearTheCanvas();
  } else if (data.action === DRAW_ACTIONS.STOP) {
    ctx.stroke();
    ctx.beginPath();
  } else if (data.action === DRAW_ACTIONS.DRAW) {
    ctx.strokeStyle = data.strokeStyle;
    ctx.lineWidth = data.lineWidth;
    ctx.lineCap = 'round';

    ctx.lineTo(data.x, data.y);
    ctx.stroke();
  }
};

const clearTheCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
};

// Lookup table
const messageHandlers = {
  [DATA_TYPES.ROOM_CREATED]: handleRoomCreated,
  [DATA_TYPES.PLAYER_REMOVED]: handleRoomLeft,
  [DATA_TYPES.PLAYER_CHANGED]: handlePlayerChanged,
  [DATA_TYPES.ROOM_JOINED]: handleRoomJoined,
  [DATA_TYPES.ROOM_LIST_UPDATE]: handleRoomListUpdate,
  [DATA_TYPES.ROOM_UPDATE]: handleRoomUpdate,
  [DATA_TYPES.ROOM_LEFT]: handleRoomLeft,
  [DATA_TYPES.SYSTEM]: handleSystem,
  [DATA_TYPES.CHAT]: handleChat,
  [DATA_TYPES.DRAW]: handleDraw,
  [DATA_TYPES.TIMER_UPDATE]: handleTimerUpdate,
};

const onOpen = () => {
  console.log('WebSocket connection established.');
  loader.classList.add('hidden');
  reconnectAttempts = 0;
};

const onMessage = (event) => {
  const data = JSON.parse(event.data);
  const handler = messageHandlers[data.type];
  if (handler) handler(data);
};

const onError = (error) => {
  console.error('WebSocket error:', error);
  loader.classList.add('hidden');
  alert("WebSocket error occurred. Please reload the page.");
};

const onClose = () => {
  console.log('WebSocket connection closed. Reconnecting...');
  loader.classList.remove('hidden');

  const delay = Math.min(3000 * (2 ** reconnectAttempts), 30000); // Max delay of 30 seconds
  reconnectAttempts += 1;

  setTimeout(initializeWebSocket, delay);
};

const initializeWebSocket = () => {
  socket = createWebSocket(SOCKET_URL, onOpen, onMessage, onError, onClose);
};

const sendMessage = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error('Cannot send message: WebSocket is not connected.');
  }
};

initializeWebSocket();

export default sendMessage;

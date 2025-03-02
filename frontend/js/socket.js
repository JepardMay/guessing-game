import { user } from "./user.js";
import { SOCKET_URL } from './config.js';
import { createWebSocket } from "./websocket.js";
import { DATA_TYPES, DRAW_ACTIONS } from './consts.js';
import { insertMessage } from "./chat.js";
import { activateScreen, updateRoomList, updateCurrentRoom } from "./rooms.js";

const loader = document.getElementById('loader');
const canvas = document.getElementById('drawing-board');

const ctx = canvas.getContext('2d');

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
};

const onOpen = (event) => {
  console.log('WebSocket connection established.');
  loader.classList.add('hidden');
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
  setTimeout(() => createWebSocket(SOCKET_URL, onOpen, onMessage, onError, onClose), 3000); // Reconnect after 3 seconds
};

const socket = createWebSocket(SOCKET_URL, onOpen, onMessage, onError, onClose);

export default socket;

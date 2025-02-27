import { user } from "./user.js";
import { DATA_TYPES, DRAW_ACTIONS } from './consts.js';
import { activateScreen, updateRoomList, updateCurrentRoom } from "./rooms.js";

const SOCKET_URL = 'wss://guessing-game-10bm.onrender.com';

const loader = document.getElementById('loader');
const chatBox = document.getElementById('chatBox');
const canvas = document.getElementById('drawing-board');

const ctx = canvas.getContext('2d');

let lastSender = null; 

const createMessage = (text, sender) => {
  const message = document.createElement('div');
  message.classList.add('message');

  if (sender.id === user.id) {
    message.classList.add('message--self');
  }

  if (sender.id !== lastSender?.id) {
    message.classList.add('message--new');
  }

  const avatar = document.createElement('div');
  avatar.classList.add('message__avatar');

  const avatarText = sender.name ? sender.name.slice(0, 2) : sender.id.slice(0, 2);
  avatar.textContent = avatarText;
  message.appendChild(avatar);

  const bubble = document.createElement('p');
  bubble.classList.add('message__bubble');
  bubble.textContent = text;
  message.appendChild(bubble);

  lastSender = sender;

  return message;
};

const createInfoMessage = (message) => {
  const infoMessage = document.createElement('p');
  infoMessage.classList.add('info-message');
  infoMessage.textContent = message;

  return infoMessage;
};

const handleInitType = (data) => {
  // Restore canvas data
  data.canvasData.forEach((action) => {
    drawOnCanvas(action);
  });

  // Restore chat messages
  data.chatMessages.forEach((message) => {
    if (message.type === DATA_TYPES.CHAT) {
      handleChatType(message);
    } else if (message.type === DATA_TYPES.SYSTEM) {
      handleSystemType(message);
    }
  });
};

const handleRoomUpdateType = (data) => {
  if (user.roomId === data.roomId) {
    updateCurrentRoom(data.players);

    if (data.gameOn) {
      activateScreen({ screen: 'game', activePlayer: data.activePlayer });
    }
  }
};

const handleRoomLeftType = (data) => {
  chatBox.innerHTML = '';
  activateScreen({ screen: 'lobby' });
};

const handleSystemType = (data) => {
  const infoMessage = createInfoMessage(data.message);
  chatBox.insertBefore(infoMessage, chatBox.firstChild);
};

const handleChatType = (data) => {
  const message = createMessage(data.message, data.sender);
  chatBox.insertBefore(message, chatBox.firstChild);
};

const handleDrawType = (data) => {
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

const socket = (() => {
  let socket;

  const connectWebSocket = () => {
    socket = new WebSocket(SOCKET_URL);
    loader.classList.remove('hidden');

    socket.onopen = () => {
      console.log('WebSocket connection established.');
      loader.classList.add('hidden');
      socket.send(JSON.stringify({ type: 'join', username: user.id }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case DATA_TYPES.INIT:
          handleInitType(data);
          break;
        case DATA_TYPES.ROOM_CREATED:
          activateScreen({ screen: 'room', roomId: data.roomId, hostId: data.host.id });
          break;
        case DATA_TYPES.PLAYER_REMOVED:
          handleRoomLeftType(data);
          break;
        case DATA_TYPES.PLAYER_CHANGED:
          clearTheCanvas();
          activateScreen({ screen: 'game', activePlayer: data.activePlayer });
          break;
        case DATA_TYPES.ROOM_JOINED:
          activateScreen({ screen: 'room', roomId: data.roomId, hostId: data.host.id });
          break;
        case DATA_TYPES.ROOM_LIST_UPDATE:
          updateRoomList(data.rooms);
          break;
        case DATA_TYPES.ROOM_UPDATE:
          handleRoomUpdateType(data);
          break;
        case DATA_TYPES.ROOM_LEFT:
          handleRoomLeftType(data);
          break;
        case DATA_TYPES.SYSTEM:
          handleSystemType(data);
          break;
        case DATA_TYPES.CHAT:
          handleChatType(data);
          break;
        case DATA_TYPES.DRAW:
          handleDrawType(data);
          break;
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      loader.classList.add('hidden');
      alert("WebSocket error occurred. Please reload the page.");
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed. Reconnecting...');
      loader.classList.remove('hidden');
      setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
    };
  };

  // Initialize WebSocket connection
  connectWebSocket();
  return socket;
})();

export default socket;

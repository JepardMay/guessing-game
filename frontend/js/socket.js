import { userID } from "./chat.js";
import { DATA_TYPES, DRAW_ACTIONS } from './consts.js';

const SOCKET_URL = 'wss://guessing-game-10bm.onrender.com';

const loader = document.getElementById('loader');
const chatBox = document.getElementById('chatBox');
const canvas = document.getElementById('drawing-board');


const ctx = canvas.getContext('2d');

let lastSender = null; 

const createMessage = (text, sender) => {
  const message = document.createElement('div');
  message.classList.add('message');

  if (sender === userID) {
    message.classList.add('message--self');
  }

  if (sender !== lastSender) {
    message.classList.add('message--new');
  }

  const avatar = document.createElement('div');
  avatar.classList.add('message__avatar');

  avatar.textContent = sender.slice(0, 2);
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

const handleSystemType = (data) => {
  const infoMessage = createInfoMessage(data.message);
  chatBox.insertBefore(infoMessage, chatBox.firstChild);
};

const handleChatType = (data) => {
  const message = createMessage(data.message, data.sender);
  chatBox.insertBefore(message, chatBox.firstChild);
};

const handleDrawType = (data) => {
  if (data.sender === userID) return;

  drawOnCanvas(data);
};

const drawOnCanvas = (data) => {
  if (data.action === DRAW_ACTIONS.CLEAR) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
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

const socket = (() => {
  let socket;

  const connectWebSocket = () => {
    socket = new WebSocket(SOCKET_URL);
    loader.classList.remove('hidden');

    socket.onopen = () => {
      console.log('WebSocket connection established.');
      loader.classList.add('hidden');
      socket.send(JSON.stringify({ type: 'join', username: userID }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case DATA_TYPES.INIT:
          handleInitType(data);
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
      loader.classList.remove('hidden');
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

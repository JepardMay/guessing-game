import { userID } from "./chat.js";
import { DATA_TYPES, DRAW_ACTIONS } from './consts.js';

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

const socket = (() => {
  let socket;

  const connectWebSocket = () => {
    socket = new WebSocket('wss://guessing-game-10bm.onrender.com');
    loader.classList.remove('hidden');

    socket.onopen = () => {
      console.log('WebSocket connection established.');
      loader.classList.add('hidden');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === DATA_TYPES.INIT) {
        // Restore canvas data
        data.canvasData.forEach((action) => {
          if (action.action === DRAW_ACTIONS.CLEAR) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
          } else if (action.action === DRAW_ACTIONS.STOP) {
            ctx.stroke();
            ctx.beginPath();
          } else if (action.action === DRAW_ACTIONS.DRAW) {
            ctx.strokeStyle = action.strokeStyle;
            ctx.lineWidth = action.lineWidth;
            ctx.lineCap = 'round';

            ctx.lineTo(action.x, action.y);
            ctx.stroke();
          }
        });

        // Restore chat messages
        data.chatMessages.forEach((message) => {
          const newMessage = createMessage(message.message, message.sender);
          chatBox.insertBefore(newMessage, chatBox.firstChild);
        });
      } else if (data.type === DATA_TYPES.CHAT) {
        const message = createMessage(data.message, data.sender);
        chatBox.insertBefore(message, chatBox.firstChild);
      } else if (data.type === DATA_TYPES.DRAW) {
        if (data.sender === userID) return;

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
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      loader.classList.remove('hidden');
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

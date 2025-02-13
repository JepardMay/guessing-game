import { userID } from "./chat.js";
import { DATA_TYPES, DRAW_ACTIONS } from '../../shared/consts.js';

let socket;

const connectWebSocket = () => {
  socket = new WebSocket('wss://guessing-game-10bm.onrender.com');

  socket.onopen = () => {
    console.log('WebSocket connection established.');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === DATA_TYPES.CHAT) {
      const messageElement = document.createElement('p');
      messageElement.classList.add('message');

      if (data.sender === userID) {
        messageElement.classList.add('message--self');
      }

      messageElement.textContent = data.message;
      chatBox.insertBefore(messageElement, chatBox.firstChild);
    } else if (data.type === DATA_TYPES.DRAW) {
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
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed. Reconnecting...');
    setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
  };
};

// Initialize WebSocket connection
connectWebSocket();

export default socket;

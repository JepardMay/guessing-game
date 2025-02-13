import { userID } from "./chat.js";
import { DATA_TYPES, DRAW_ACTIONS } from '../../shared/consts.js';

const socket = new WebSocket('ws://localhost:8080');

const chatBox = document.getElementById('chatBox');
const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');

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

export default socket;

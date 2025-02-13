import { userID } from "./chat.js";

const socket = new WebSocket('ws://localhost:8080');

const chatBox = document.getElementById('chatBox');
const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'chat') {
    const messageElement = document.createElement('p');
    messageElement.classList.add('message');

    if (data.sender === userID) {
      messageElement.classList.add('message--self');
    }

    messageElement.textContent = data.message;
    chatBox.insertBefore(messageElement, chatBox.firstChild);
  } else if (data.type === 'draw') {
    if (data.action === 'clear') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
    } else if (data.action === 'stop') {
      ctx.stroke();
      ctx.beginPath();
    } else if (data.action === 'draw') {
      ctx.strokeStyle = data.strokeStyle;
      ctx.lineWidth = data.lineWidth;
      ctx.lineCap = 'round';

      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    }
  }
};

export default socket;

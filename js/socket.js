import { userID } from "./chat.js";

const socket = new WebSocket('ws://localhost:8080');

const chatBox = document.getElementById('chatBox');

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
  }
};

export default socket;

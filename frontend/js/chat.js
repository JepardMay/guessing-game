import sendMessage from './socket.js';
import { DATA_TYPES } from './consts.js';
import { user } from './user.js';

const chatBox = document.getElementById('chatBox');
const guessInput = document.getElementById('guessInput');
const submitGuess = document.getElementById('submitGuess');

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

const insertMessage = (message, isInfo = false) => {
  const messageElement = isInfo ? createInfoMessage(message.content) : createMessage(message.message, message.sender);
  chatBox.insertBefore(messageElement, chatBox.firstChild);
};

submitGuess.addEventListener('click', () => {
  const message = guessInput.value.trim();
  if (message) {
    sendMessage({ type: DATA_TYPES.CHAT, message, sender: user });
    guessInput.value = '';
  }
});

guessInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    submitGuess.click();
  }
});

export { insertMessage };

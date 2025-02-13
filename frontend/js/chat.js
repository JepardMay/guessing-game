import socket from './socket.js';
import { DATA_TYPES } from './consts.js';
import { makeId } from './utils.js';

const guessInput = document.getElementById('guessInput');
const submitGuess = document.getElementById('submitGuess');

const userID = makeId(8);

submitGuess.addEventListener('click', () => {
  const message = guessInput.value.trim();
  if (message) {
    
    socket.send(JSON.stringify({ type: DATA_TYPES.CHAT, message, sender: userID }));
    guessInput.value = '';
  }
});

guessInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    submitGuess.click();
  }
});

export { userID };

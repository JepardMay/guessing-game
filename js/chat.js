import socket from './socket.js';

const guessInput = document.getElementById('guessInput');
const submitGuess = document.getElementById('submitGuess');

submitGuess.addEventListener('click', () => {
  const message = guessInput.value.trim();
  if (message) {
    
    socket.send(JSON.stringify({ type: 'chat', message, sender: 'self' }));
    guessInput.value = '';
  }
});

guessInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    submitGuess.click();
  }
});

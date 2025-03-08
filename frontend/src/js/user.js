import { makeId } from './utils.js';

const usernameInput = document.getElementById('usernameInput');
const submitUsername = document.getElementById('submitUsername');
const usernameBlock = document.getElementById('usernameBlock');
const usernameEl = document.getElementById('usernameEl');

export const user = {
  name: '',
  id: makeId(8),
  isHost: false,
  isActive: false,
  roomId: null,
};

submitUsername.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (username) {
    user.name = username;
    usernameInput.value = '';
    usernameEl.textContent = username;
    usernameBlock.classList.add('is-shown');
  }
});

usernameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    submitUsername.click();
  }
});

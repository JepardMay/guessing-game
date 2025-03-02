import sendMessage from './socket.js';
import { user } from './user.js';
import { DATA_TYPES } from './consts.js';

const timer = document.getElementById('countdown');

let interval;
const COUNTDOWN_START = 60;

const startTimer = () => {
  clearInterval(interval);
  let countdown = COUNTDOWN_START;
  timer.textContent = String(countdown).padStart(5, "00:");
  interval = setInterval(() => {
    if (countdown > 0) {
      countdown--;
      timer.textContent = String(countdown).padStart(5, "00:");
    } else {
      clearInterval(interval);

      if (user.isActive) {
        sendMessage({ type: DATA_TYPES.CHANGE_PLAYER, sender: user });
      }
    }
  }, 1000);
};

export { startTimer };

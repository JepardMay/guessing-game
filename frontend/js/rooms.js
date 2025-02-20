import socket from './socket.js';
import { makeId } from './utils.js';
import { user } from './user.js';

const createRoomBtn = document.getElementById('createRoom');
const roomList = document.getElementById('roomList');
const roomIdEl = document.getElementById('roomId');
const hostIdEl = document.getElementById('hostId');
const roomPlayers = document.getElementById('roomPlayers');
const activePlayer = document.getElementById('activePlayer');
const startGameBtn = document.getElementById('startGame');
const leaveRoomBtn = document.getElementById('leaveRoom');

const createJoinRoomItem = (room) => {
  const roomItem = document.createElement('li');
  roomItem.classList.add('join-room');
  roomItem.innerHTML = `
    <p>Room: <span>${room.roomId}</span> - ${room.players.length} joined</p>

    <button class="btn" data-join-id="${room.roomId}">Join</button>
  `;

  return roomItem;
};

const createPlayerItem = (player) => {
  const playerItem = document.createElement('li');
  playerItem.classList.add('player');
  playerItem.innerHTML = player.id;

  return playerItem;
};

const activateScreen = (screen, roomId = '', hostId = '') => {
  switch (screen) {
    case 'lobby':
      user.roomId = null;
      user.isHost = false;
      document.body.classList.remove('room-is-active');
      document.body.classList.remove('game-is-active');
      roomPlayers.innerHTML = '';
      break;
    case 'room':
      roomIdEl.textContent = roomId;
      hostIdEl.textContent = hostId;
      user.roomId = roomId;
      user.isHost = hostId === user.id;
      startGameBtn.disabled = !user.isHost;
      document.body.classList.remove('game-is-active');
      document.body.classList.add('room-is-active');
      break;
    case 'game':
      document.body.classList.remove('room-is-active');
      document.body.classList.add('game-is-active');
      break;
    default:
      break;
  }
};

const updateRoomList = (rooms) => {
  roomList.innerHTML = '';
  rooms.forEach((room) => {
    if (!room.gameOn) {
      const roomItem = createJoinRoomItem(room);
      roomList.insertBefore(roomItem, roomList.firstChild);
    }
  });
};

const updateCurrentRoom = (players) => {
  roomPlayers.innerHTML = '';
  players.forEach((player) => {
    const playerItem = createPlayerItem(player);
    roomPlayers.appendChild(playerItem);
  });
};

createRoomBtn.addEventListener('click', () => {
  user.roomId = makeId(10);
  socket.send(JSON.stringify({ type: 'createRoom', roomId: user.roomId, user: user }));
});

roomList.addEventListener('click', (e) => {
  if (e.target.dataset.joinId) {
    const roomId = e.target.dataset.joinId;
    socket.send(JSON.stringify({ type: 'joinRoom', roomId, user: user }));
  }
});

startGameBtn.addEventListener('click', () => {
  socket.send(JSON.stringify({ type: 'startGame', roomId: user.roomId, user: user }));
});

leaveRoomBtn.addEventListener('click', () => {
  socket.send(JSON.stringify({ type: 'leaveRoom', roomId: user.roomId, user: user }));
});

export { activateScreen, updateRoomList, updateCurrentRoom };

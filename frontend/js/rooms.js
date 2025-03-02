import sendMessage from './socket.js';
import { makeId } from './utils.js';
import { user } from './user.js';
import { startTimer } from './timer.js';

const chatBox = document.getElementById('chatBox');
const createRoomBtn = document.getElementById('createRoom');
const roomList = document.getElementById('roomList');
const roomIdEl = document.getElementById('roomId');
const roomPlayers = document.getElementById('roomPlayers');
const activePlayerEl = document.getElementById('activePlayer');
const startGameBtn = document.getElementById('startGame');
const leaveRoomBtn = document.getElementById('leaveRoom');

const searchInput = document.getElementById('searchRoom');

let rooms = []; // { host: string, players[], gameOn: boolean }[]
let players = []; // { username: string, id: string, isHost: boolean, roomId: string }[]

const filterRooms = (searchText) => {
  return rooms.filter((room) => {
    return (
      room.roomId.toLowerCase().includes(searchText.toLowerCase()) ||
      room.host.id.toLowerCase().includes(searchText.toLowerCase())
    );
  });
};

const createJoinRoomItem = (room) => {
  const roomItem = document.createElement('li');
  roomItem.classList.add('join-room');
  roomItem.innerHTML = `
    <div>
      <p>Room: <span>${room.roomId}</span></p>
      <p>Host: <span>${room.host.name ? room.host.name : room.host.id}</span></p>
      <p>Players: <span>${room.players.length}</span></p>
    </div>

    <button class="btn" data-join-id="${room.roomId}">Join</button>
  `;

  return roomItem;
};

const createPlayerItem = (player, index) => {
  let note = '';
  if (user.id === player.id && user.isHost) {
    note = '(You are the Host)';
  } else if (user.id === player.id && !user.isHost) {
    note = '(You)';
  } else if (player.isHost) {
    note = '(Host)';
  }

  const playerItem = document.createElement('li');
  playerItem.classList.add('player');
  playerItem.innerHTML = `
    <div>
      <p>${player.name ? player.name : player.id} ${note}</p>
      ${(!player.isHost && user.isHost) ? `
        <button class="btn-icon" data-player-id="${index}" aria-label="Remove the player">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="800px" height="800px" viewBox="-1.7 0 20.4 20.4" class="cf-icon-svg"><path d="M16.417 10.283A7.917 7.917 0 1 1 8.5 2.366a7.916 7.916 0 0 1 7.917 7.917zm-6.804.01 3.032-3.033a.792.792 0 0 0-1.12-1.12L8.494 9.173 5.46 6.14a.792.792 0 0 0-1.12 1.12l3.034 3.033-3.033 3.033a.792.792 0 0 0 1.12 1.119l3.032-3.033 3.033 3.033a.792.792 0 0 0 1.12-1.12z"/></svg>
        </button>
      ` : ''}
    </div>
  `;

  return playerItem;
};

const activateScreen = ({ screen, roomId = '', hostId = '', activePlayer = null }) => {
  switch (screen) {
    case 'lobby':
      chatBox.innerHTML = '';
      user.roomId = null;
      user.isHost = false;
      document.body.classList.remove('room-is-active');
      document.body.classList.remove('game-is-active');
      roomPlayers.innerHTML = '';
      break;
    case 'room':
      roomIdEl.textContent = roomId;
      user.roomId = roomId;
      user.isHost = hostId === user.id;
      startGameBtn.disabled = !user.isHost;
      document.body.classList.remove('game-is-active');
      document.body.classList.add('room-is-active');
      break;
    case 'game':
      user.isActive = activePlayer.id === user.id;
      activePlayerEl.textContent = user.isActive ? 'You are' : (activePlayer.name ? activePlayer.name : activePlayer.id) + ' is';
      startTimer();
      document.body.classList.remove('room-is-active');
      document.body.classList.add('game-is-active');
      break;
    default:
      break;
  }
};

const updateRoomList = (data) => {
  rooms = [...data];
  renderRoomList(rooms);
};

const renderRoomList = (rooms) => {
  roomList.innerHTML = '';
  rooms.forEach((room) => {
    if (!room.gameOn) {
      const roomItem = createJoinRoomItem(room);
      roomList.insertBefore(roomItem, roomList.firstChild);
    }
  });
};

const updateCurrentRoom = (data) => {
  players = data;
  user.isHost = players[0].id === user.id && players[0].isHost;
  startGameBtn.disabled = !user.isHost;
  roomPlayers.innerHTML = '';
  players.forEach((player, index) => {
    const playerItem = createPlayerItem(player, index);
    roomPlayers.appendChild(playerItem);
  });
};

const handleSearchInput = (evt) => {
  const searchText = evt.target.value.trim();

  if (searchText !== '') {
    const filteredRooms = filterRooms(searchText);
    renderRoomList(filteredRooms);
  } else {
    renderRoomList(rooms);
  }
};

createRoomBtn.addEventListener('click', () => {
  user.roomId = makeId(10);
  user.isHost = true;
  sendMessage({ type: 'createRoom', roomId: user.roomId, user: user });
});

searchInput.addEventListener('input', handleSearchInput);

roomList.addEventListener('click', (e) => {
  if (e.target.dataset.joinId) {
    const roomId = e.target.dataset.joinId;
    user.isHost = false;
    sendMessage({ type: 'joinRoom', roomId, user: user });
  }
});

roomPlayers.addEventListener('click', (e) => {
  const playerId = e.target.closest('.btn-icon')?.dataset.playerId;
  if (playerId && user.isHost) {
    const player = players[Number(playerId)];

    if (player) {
      sendMessage({ type: 'removePlayer', roomId: user.roomId, user: player });
    }
  }
});

startGameBtn.addEventListener('click', () => {
  sendMessage({ type: 'startGame', roomId: user.roomId, user: user });
});

leaveRoomBtn.addEventListener('click', () => {
  sendMessage({ type: 'leaveRoom', roomId: user.roomId, user: user });
});

export { activateScreen, updateRoomList, updateCurrentRoom };

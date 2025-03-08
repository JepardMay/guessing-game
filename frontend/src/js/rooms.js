import sendMessage from './socket.js';
import { DATA_TYPES } from './consts.js';
import { makeId } from './utils.js';
import { user } from './user.js';

const chatBox = document.getElementById('chatBox');
const createRoomBtn = document.getElementById('createRoom');
const roomList = document.getElementById('roomList');
const roomIdEl = document.getElementById('roomId');
const roomPlayers = document.getElementById('roomPlayers');
const activePlayerEl = document.getElementById('activePlayer');
const startGameBtn = document.getElementById('startGame');
const leaveRoomBtn = document.getElementById('leaveRoom');
const stopGameBtn = document.getElementById('stopGame');
const leaveGameBtn = document.getElementById('leaveGame');
const searchInput = document.getElementById('searchRoom');

const state = {
  rooms: [], // { host: string, players[], gameOn: boolean }
  players: [], // { username: string, id: string, isHost: boolean, roomId: string }[]
};

const getRooms = () => state.rooms;
const setRooms = (data) => {
  state.rooms = [...data];
};

const getPlayers = () => state.players;
const setPlayers = (data) => {
  state.players = [...data];
};

const createElement = (tag, className, innerHTML) => {
  const element = document.createElement(tag);
  element.classList.add(className);
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
};

const createJoinRoomItem = (room) => {
  const roomItem = createElement('li', 'join-room', `
    <div>
      <p>Room: <span>${room.roomId}</span></p>
      <p>Host: <span>${room.host.name || room.host.id}</span></p>
      <p>Players: <span>${room.players.length}</span></p>
    </div>

    <button class="btn" data-join-id="${room.roomId}">Join</button>
  `);

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

  const playerItem = createElement('li', 'player', `
    <div>
      <p>${player.name || player.id} ${note}</p>
      ${(!player.isHost && user.isHost) ? `
        <button class="btn-icon" data-player-id="${index}" aria-label="Remove the player">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="800px" height="800px" viewBox="-1.7 0 20.4 20.4" class="cf-icon-svg"><path d="M16.417 10.283A7.917 7.917 0 1 1 8.5 2.366a7.916 7.916 0 0 1 7.917 7.917zm-6.804.01 3.032-3.033a.792.792 0 0 0-1.12-1.12L8.494 9.173 5.46 6.14a.792.792 0 0 0-1.12 1.12l3.034 3.033-3.033 3.033a.792.792 0 0 0 1.12 1.119l3.032-3.033 3.033 3.033a.792.792 0 0 0 1.12-1.12z"/></svg>
        </button>
      ` : ''}
    </div>
  `);

  return playerItem;
};

const activateLobbyScreen = () => {
  user.roomId = null;
  user.isHost = false;
  document.body.classList.remove('room-is-active');
  document.body.classList.remove('game-is-active');
  roomPlayers.innerHTML = '';
  chatBox.innerHTML = '';
};

const activateRoomScreen = (roomId, hostId) => {
  roomIdEl.textContent = roomId;
  user.roomId = roomId;
  user.isHost = hostId === user.id;
  startGameBtn.disabled = !user.isHost;
  document.body.classList.remove('game-is-active');
  document.body.classList.add('room-is-active');
};

const activateGameScreen = (activePlayer) => {
  user.isActive = activePlayer.id === user.id;
  const activePlayerName = activePlayer.name || activePlayer.id;
  activePlayerEl.textContent = user.isActive ? 'You are' : `${activePlayerName} is`;
  document.body.classList.remove('room-is-active');
  document.body.classList.add('game-is-active');
};

const screenHandlers = {
  'lobby': (roomId, hostId, activePlayer) => activateLobbyScreen(),
  'room': (roomId, hostId, activePlayer) => activateRoomScreen(roomId, hostId),
  'game': (roomId, hostId, activePlayer) => activateGameScreen(activePlayer),
};

const activateScreen = ({ screen, roomId = '', hostId = '', activePlayer = null }) => {
  const handler = screenHandlers[screen];
  if (handler) handler(roomId, hostId, activePlayer);
};

const updateRoomList = (data) => {
  setRooms(data);
  renderRoomList(getRooms());
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
  setPlayers(data);
  user.isHost = getPlayers()[0].id === user.id && getPlayers()[0].isHost;
  startGameBtn.disabled = !user.isHost;
  stopGameBtn.disabled = !user.isHost;
  roomPlayers.innerHTML = '';
  getPlayers().forEach((player, index) => {
    const playerItem = createPlayerItem(player, index);
    roomPlayers.appendChild(playerItem);
  });
};

const filterRooms = (searchText) => {
  return getRooms().filter((room) => {
    return (
      room.roomId.toLowerCase().includes(searchText.toLowerCase()) ||
      room.host.id.toLowerCase().includes(searchText.toLowerCase())
    );
  });
};

const handleSearchInput = (evt) => {
  const searchText = evt.target.value.trim();
  const filteredRooms = searchText ? filterRooms(searchText) : getRooms();
  renderRoomList(filteredRooms);
};

const handleRoomListClick = (e) => {
  if (e.target.dataset.joinId) {
    const roomId = e.target.dataset.joinId;
    user.isHost = false;
    sendMessage({ type: DATA_TYPES.JOIN_ROOM, roomId, user: user });
  }
};

const handleRoomPlayersClick = (e) => {
  const playerId = e.target.closest('.btn-icon')?.dataset.playerId;
  if (playerId && user.isHost) {
    const player = getPlayers()[Number(playerId)];

    if (player) {
      sendMessage({ type: DATA_TYPES.REMOVE_PLAYER, roomId: user.roomId, user: player });
    }
  }
};

const handleLeaveAction = () => {
  sendMessage({ type: DATA_TYPES.LEAVE_ROOM, roomId: user.roomId, user: user });
};

createRoomBtn.addEventListener('click', () => {
  user.roomId = makeId(10);
  user.isHost = true;
  sendMessage({ type: DATA_TYPES.CREATE_ROOM, roomId: user.roomId, user: user });
});

searchInput.addEventListener('input', handleSearchInput);

roomList.addEventListener('click', handleRoomListClick);

roomPlayers.addEventListener('click', handleRoomPlayersClick);

startGameBtn.addEventListener('click', () => {
  sendMessage({ type: DATA_TYPES.START_GAME, roomId: user.roomId, user: user });
});

stopGameBtn.addEventListener('click', () => {
  sendMessage({ type: DATA_TYPES.STOP_GAME, roomId: user.roomId, user: user });
});

leaveRoomBtn.addEventListener('click', handleLeaveAction);
leaveGameBtn.addEventListener('click', handleLeaveAction);

export { activateScreen, updateRoomList, updateCurrentRoom, getPlayers };

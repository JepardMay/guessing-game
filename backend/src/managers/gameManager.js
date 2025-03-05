import { DATA_TYPES, COUNTDOWN_START } from '../constants.js';
import { broadcastToRoomOnly } from './broadcastToRoomOnly.js';
import { broadcastRoomUpdate, broadcastRoomList, broadcastSystemMessage } from './broadcastManager.js';
import { rooms } from './roomManager.js';

const startTimer = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.timer) clearInterval(room.timer);

  let countdown = COUNTDOWN_START;

  broadcastToRoomOnly(roomId, {
    type: DATA_TYPES.TIMER_UPDATE,
    countdown,
  });

  room.timer = setInterval(() => {
    countdown--;

    const message = {
      type: DATA_TYPES.TIMER_UPDATE,
      countdown,
    };

    broadcastToRoomOnly(message, roomId);

    if (countdown <= 0) {
      clearInterval(room.timer);
      changePlayer({ roomId });
    }
  }, 1000);
};

export function startGame(data) {
  const room = rooms.get(data.roomId);
  if (room) {
    room.gameOn = true;
    room.activePlayer = room.players[Math.floor(Math.random() * room.players.length)];

    broadcastRoomUpdate(data.roomId, rooms);
    broadcastRoomList(rooms);
    broadcastSystemMessage(`The game in room ${data.roomId} has started.`, data.roomId);
    broadcastSystemMessage(`${room.activePlayer.name || room.activePlayer.id} is drawing now.`, data.roomId);
    startTimer(data.roomId);
  }
}

const selectNewActivePlayer = (room) => {
  const { players, activePlayer } = room;

  if (players.length === 1) {
    return players[0];
  }

  let newActivePlayer;
  do {
    newActivePlayer = players[Math.floor(Math.random() * players.length)];
  } while (newActivePlayer.id === activePlayer.id);

  return newActivePlayer;
};

export function changePlayer(data) {
  const room = rooms.get(data.roomId);
  if (room) {
    if (data.selectedUser) {
      const selectedUser = room.players.find((player) => player.id === data.selectedUser.id);
      if (!selectedUser) return;

      room.activePlayer = selectedUser;
      broadcastSystemMessage(`${room.activePlayer.name || room.activePlayer.id} guessed correctly!`, data.roomId);
    } else {
      room.activePlayer = selectNewActivePlayer(room);
    }

    const message = {
      type: DATA_TYPES.PLAYER_CHANGED,
      activePlayer: room.activePlayer,
    };

    broadcastRoomUpdate(data.roomId, rooms);
    broadcastRoomList(rooms);
    broadcastToRoomOnly(message, data.roomId);
    broadcastSystemMessage(`${room.activePlayer.name || room.activePlayer.id} is drawing now.`, data.roomId);
    startTimer(data.roomId);
  }
}

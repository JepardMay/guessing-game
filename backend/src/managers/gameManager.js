import { DATA_TYPES, COUNTDOWN_START } from '../constants.js';
import { broadcastToRoomOnly } from './utils/broadcastToRoomOnly.js';
import { broadcastRoomUpdate, broadcastRoomList, broadcastSystemMessage } from './broadcastManager.js';
import { rooms } from './roomManager.js';

const broadcastGameUpdates = (roomId, systemMessage, activePlayer, messageType = null) => {
  if (messageType) {
    const message = {
      type: messageType,
      activePlayer,
    };

    broadcastToRoomOnly(message, roomId);
  }

  broadcastRoomUpdate(roomId, rooms);
  broadcastRoomList(rooms);
  broadcastSystemMessage(systemMessage, roomId);
};

const startTimer = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.timer) clearInterval(room.timer);

  let countdown = COUNTDOWN_START;

  broadcastToRoomOnly({
    type: DATA_TYPES.TIMER_UPDATE,
    countdown,
  }, roomId);

  room.timer = setInterval(() => {
    countdown--;

    broadcastToRoomOnly({
      type: DATA_TYPES.TIMER_UPDATE,
      countdown,
    }, roomId);

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
    selectActivePlayer(room);

    broadcastGameUpdates(
      data.roomId,
      `${room.activePlayer.name || room.activePlayer.id} is drawing now.`,
      room.activePlayer,
    );

    if (room.players.length > 1) {
      startTimer(data.roomId);
    }
  }
}

export function stopGame(data) {
  const room = rooms.get(data.roomId);
  if (room) {
    room.gameOn = false;


    broadcastGameUpdates(
      data.roomId,
      `The game has stopped.`
    );
  }
}

const selectNewRandomActivePlayer = (room) => {
  const { players, activePlayer } = room;

  let newActivePlayer;
  do {
    newActivePlayer = players[Math.floor(Math.random() * players.length)];
  } while (newActivePlayer.id === activePlayer.id);

  return newActivePlayer;
};

const selectActivePlayer = (room, data) => {
  if (room.players.length <= 1) return;

  if (data?.selectedUser) {
    const selectedUser = room.players.find((player) => player.id === data.selectedUser.id);
    if (!selectedUser) return;

    room.activePlayer = selectedUser;
    broadcastSystemMessage(`${room.activePlayer.name || room.activePlayer.id} guessed correctly!`, data.roomId);
  } else {
    room.activePlayer = selectNewRandomActivePlayer(room);
  }
};

export function changePlayer(data) {
  const room = rooms.get(data.roomId);
  if (room) {
    selectActivePlayer(room, data);

    broadcastGameUpdates(
      data.roomId,
      `${room.activePlayer.name || room.activePlayer.id} is drawing now.`,
      room.activePlayer,
      DATA_TYPES.PLAYER_CHANGED
    );

    if (room.players.length > 1) {
      startTimer(data.roomId);
    }
  }
}

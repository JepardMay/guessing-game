import { DATA_TYPES } from '../constants.js';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  removePlayer,
  startGame,
} from '../managers/roomManager.js';
import { broadcastToRoomOnly } from '../managers/broadcastManager.js';

export function handleMessage(data, ws, connectedUsers) {
  switch (data.type) {
    case DATA_TYPES.CREATE_ROOM:
      createRoom(data, ws, connectedUsers);
      break;
    case DATA_TYPES.JOIN_ROOM:
      joinRoom(data, ws, connectedUsers);
      break;
    case DATA_TYPES.REMOVE_PLAYER:
      removePlayer(data, connectedUsers);
      break;
    case DATA_TYPES.LEAVE_ROOM:
      leaveRoom(data, ws, connectedUsers);
      break;
    case DATA_TYPES.START_GAME:
      startGame(data);
      break;
    case DATA_TYPES.CHAT:
    case DATA_TYPES.DRAW:
      broadcastToRoomOnly(data, data.sender.roomId);
      break;
    default:
      break;
  }
}

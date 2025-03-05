import { DATA_TYPES } from '../constants.js';
import { createRoom, joinRoom, leaveRoom } from '../managers/roomManager.js';
import { removePlayer } from '../managers/playerManager.js';
import { startGame, changePlayer } from '../managers/gameManager.js';
import { broadcastToRoomOnly } from '../managers/broadcastToRoomOnly.js';

const messageHandlers = {
  [DATA_TYPES.CREATE_ROOM]: (data, ws, connectedUsers) => createRoom(data, ws, connectedUsers),
  [DATA_TYPES.JOIN_ROOM]: (data, ws, connectedUsers) => joinRoom(data, ws, connectedUsers),
  [DATA_TYPES.REMOVE_PLAYER]: (data, ws, connectedUsers) => removePlayer(data, connectedUsers),
  [DATA_TYPES.LEAVE_ROOM]: (data, ws, connectedUsers) => leaveRoom(data, ws, connectedUsers),
  [DATA_TYPES.START_GAME]: (data, ws, connectedUsers) => startGame(data),
  [DATA_TYPES.CHANGE_PLAYER]: (data, ws, connectedUsers) => changePlayer(data),
  [DATA_TYPES.CHAT]: (data, ws, connectedUsers) => broadcastToRoomOnly(data, data.sender.roomId),
  [DATA_TYPES.DRAW]: (data, ws, connectedUsers) => broadcastToRoomOnly(data, data.sender.roomId),
  DEFAULT: (data) => console.warn(`No handler found for message type: ${data.type}`),
};

export function handleMessage(data, ws, connectedUsers) {
  const handler = messageHandlers[data.type] || messageHandlers.DEFAULT;
  handler(data, ws, connectedUsers);
}

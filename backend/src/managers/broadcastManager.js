import { DATA_TYPES } from '../constants.js';
import { getConnectedUsers } from './userManager.js';

export function broadcast(data, filter = () => true) {
  const message = JSON.stringify(data);
  const connectedUsers = getConnectedUsers();

  connectedUsers.forEach((userData, client) => {
    if (client.readyState === WebSocket.OPEN && filter(userData)) {
      client.send(message);
    }
  });
}

export function broadcastToRoomOnly(data, roomId) {
  broadcast(data, (userData) => userData.roomId === roomId);
}

export function broadcastSystemMessage(message, roomId) {
  const systemMessage = { type: DATA_TYPES.SYSTEM, message };
  broadcastToRoomOnly(systemMessage, roomId);
}

export function broadcastRoomList(rooms) {
  const roomList = Array.from(rooms).map(([roomId, roomData]) => ({
    roomId,
    host: roomData.host,
    players: roomData.players,
    gameOn: roomData.gameOn,
    activePlayer: roomData.activePlayer,
  }));
  const roomListData = { type: DATA_TYPES.ROOM_LIST_UPDATE, rooms: roomList };
  broadcast(roomListData);
}

export function broadcastRoomUpdate(roomId, rooms) {
  const room = rooms.get(roomId);
  if (room) {
    const roomData = {
      type: DATA_TYPES.ROOM_UPDATE, roomId, players: room.players, gameOn: room.gameOn, activePlayer: room.activePlayer };
    broadcast(roomData);
  }
}

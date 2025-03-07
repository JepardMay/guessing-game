import { rooms } from '../roomManager.js';
import { broadcastRoomUpdate, broadcastRoomList, broadcastSystemMessage } from '../broadcastManager.js';

export function checkRoom(roomId, userId) {
  const room = rooms.get(roomId);

  if (!room) return;

  if (room.host.id === userId) {
    if (room.players.length > 0) {
      room.host = room.players[0];
      room.players[0].isHost = true;
      broadcastSystemMessage(`${room.players[0].name || room.players[0].id} is now the host.`, roomId);
    } else {
      rooms.delete(roomId);
    }
  }

  broadcastRoomUpdate(roomId, rooms);
  broadcastRoomList(rooms);
}

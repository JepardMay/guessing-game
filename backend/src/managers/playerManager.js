import { DATA_TYPES } from '../constants.js';
import { checkRoom } from './utils/checkRoom.js';
import { broadcastRoomUpdate, broadcastRoomList, broadcastSystemMessage } from './broadcastManager.js';
import { rooms } from './roomManager.js';

export function removePlayer(data, connectedUsers) {
  const room = rooms.get(data.roomId);
  if (room) {
    const removedPlayer = room.players.find((player) => player.id === data.user.id);
    room.players = room.players.filter((player) => player.id !== data.user.id);

    if (removedPlayer) {
      const removedPlayerClient = Array.from(connectedUsers.keys()).find(
        (client) => connectedUsers.get(client).id === removedPlayer.id
      );

      if (removedPlayerClient) {
        removedPlayerClient.send(
          JSON.stringify({ type: DATA_TYPES.PLAYER_REMOVED, roomId: data.roomId })
        );
      }
    }

    broadcastRoomUpdate(data.roomId, rooms);
    broadcastRoomList(rooms);
    broadcastSystemMessage(`${data.user.name || data.user.id} has been removed from the room.`, data.roomId);
  }
}

export function handleUserDisconnection(userData) {
  if (userData.id && userData.roomId) {
    broadcastSystemMessage(`${userData.username ? userData.username : userData.id} has disconnected.`, userData.roomId);

    const room = rooms.get(userData.roomId);

    if (room) {
      room.players = room.players.filter((player) => player.id !== userData.id);
      checkRoom(userData.roomId, userData.id);
    }
  }
}

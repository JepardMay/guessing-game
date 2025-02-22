import { DATA_TYPES } from '../constants.js';
import { broadcastRoomUpdate, broadcastRoomList } from './broadcastManager.js';

export const rooms = new Map(); // Map<roomId, { host: string, players: { username: string, id: string, isHost: boolean, roomId: string }, gameOn: boolean }[] }>

export function createRoom(data, ws, connectedUsers) {
  rooms.set(data.roomId, { host: data.user, players: [data.user], gameOn: false });

  // Update user data
  connectedUsers.get(ws).roomId = data.roomId;
  connectedUsers.get(ws).id = data.user.id;

  ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_CREATED, roomId: data.roomId, host: data.user }));

  broadcastRoomUpdate(data.roomId, rooms);
  broadcastRoomList(rooms);
}

export function joinRoom(data, ws, connectedUsers) {
  const room = rooms.get(data.roomId);
  if (room && !room.players.includes(data.user)) {
    room.players.push(data.user);

    // Update user data
    connectedUsers.get(ws).roomId = data.roomId;
    connectedUsers.get(ws).id = data.user.id;

    ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_JOINED, roomId: data.roomId, host: room.host }));

    broadcastRoomUpdate(data.roomId, rooms);
    broadcastRoomList(rooms);
  }
}

export function leaveRoom(data, ws, connectedUsers) {
  const room = rooms.get(data.roomId);
  if (room) {
    room.players = room.players.filter((player) => player.id !== data.user.id);

    connectedUsers.get(ws).roomId = null;

    ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_LEFT, roomId: data.roomId, host: room.host }));

    checkRoom(data.roomId, data.user.id);
  }
}

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
  }
}

export function checkRoom(roomId, userId) {
  const room = rooms.get(roomId);

  if (room && room.host.id === userId) {
    if (room.players.length > 0) {
      room.host = room.players[0];
      room.players[0].isHost = true;
    } else {
      rooms.delete(roomId);
    }
  }

  broadcastRoomUpdate(roomId, rooms);
  broadcastRoomList(rooms);
}

export function startGame(data) {
  const room = rooms.get(data.roomId);
  if (room) {
    room.gameOn = true;

    broadcastRoomUpdate(data.roomId, rooms);
    broadcastRoomList(rooms);
  }
}

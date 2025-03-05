import { DATA_TYPES } from '../constants.js';
import { broadcastRoomUpdate, broadcastRoomList, broadcastSystemMessage } from './broadcastManager.js';

export const rooms = new Map(); // Map<roomId, { host: string, players: { username: string, id: string, isHost: boolean, roomId: string, activePlayer: string }, gameOn: boolean, timer: setInterval}[] }>

export function createRoom(data, ws, connectedUsers) {
  if (rooms.has(data.roomId)) {
    ws.send(JSON.stringify({
      type: DATA_TYPES.ERROR,
      message: 'An error occurred while creating the room. Please, try again.',
    }));
    
    return;
  }

  rooms.set(data.roomId, { host: data.user, players: [data.user], gameOn: false, activePlayer: data.user });

  // Update user data
  connectedUsers.get(ws).roomId = data.roomId;
  connectedUsers.get(ws).id = data.user.id;
  connectedUsers.get(ws).username = data.user.name;

  ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_CREATED, roomId: data.roomId, host: data.user }));

  broadcastRoomUpdate(data.roomId, rooms);
  broadcastRoomList(rooms);
  broadcastSystemMessage(`${data.user.name || data.user.id} has created the room.`, data.roomId);
}

export function joinRoom(data, ws, connectedUsers) {
  const room = rooms.get(data.roomId);
  if (room && !room.players.includes(data.user)) {
    room.players.push(data.user);

    // Update user data
    connectedUsers.get(ws).roomId = data.roomId;
    connectedUsers.get(ws).id = data.user.id;
    connectedUsers.get(ws).username = data.user.name;

    ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_JOINED, roomId: data.roomId, host: room.host }));

    broadcastRoomUpdate(data.roomId, rooms);
    broadcastRoomList(rooms);
    broadcastSystemMessage(`${data.user.name || data.user.id} has joined the room.`, data.roomId);
  }
}

export function leaveRoom(data, ws, connectedUsers) {
  const room = rooms.get(data.roomId);
  if (room) {
    room.players = room.players.filter((player) => player.id !== data.user.id);

    connectedUsers.get(ws).roomId = null;

    ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_LEFT, roomId: data.roomId, host: room.host }));

    checkRoom(data.roomId, data.user.id);
    broadcastSystemMessage(`${data.user.name || data.user.id} has left the room.`, data.roomId);
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

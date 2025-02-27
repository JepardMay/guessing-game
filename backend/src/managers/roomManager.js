import { DATA_TYPES } from '../constants.js';
import { broadcastToRoomOnly, broadcastRoomUpdate, broadcastRoomList, broadcastSystemMessage } from './broadcastManager.js';

export const rooms = new Map(); // Map<roomId, { host: string, players: { username: string, id: string, isHost: boolean, roomId: string, activePlayer: string }, gameOn: boolean }[] }>

export function createRoom(data, ws, connectedUsers) {
  rooms.set(data.roomId, { host: data.user, players: [data.user], gameOn: false, activePlayer: data.user });

  // Update user data
  connectedUsers.get(ws).roomId = data.roomId;
  connectedUsers.get(ws).id = data.user.id;
  connectedUsers.get(ws).username = data.user.name;

  ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_CREATED, roomId: data.roomId, host: data.user }));

  broadcastRoomUpdate(data.roomId, rooms);
  broadcastRoomList(rooms);
  broadcastSystemMessage(`${data.user.name ? data.user.name : data.user.id} has created the room.`, data.roomId);
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
    broadcastSystemMessage(`${data.user.name ? data.user.name : data.user.id} has joined the room.`, data.roomId);
  }
}

export function leaveRoom(data, ws, connectedUsers) {
  const room = rooms.get(data.roomId);
  if (room) {
    room.players = room.players.filter((player) => player.id !== data.user.id);

    connectedUsers.get(ws).roomId = null;

    ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_LEFT, roomId: data.roomId, host: room.host }));

    checkRoom(data.roomId, data.user.id);
    broadcastSystemMessage(`${data.user.name ? data.user.name : data.user.id} has left the room.`, data.roomId);
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
    broadcastSystemMessage(`${data.user.name ? data.user.name : data.user.id} has been removed from the room.`, data.roomId);
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
    room.activePlayer = room.players[Math.floor(Math.random() * room.players.length)];

    broadcastRoomUpdate(data.roomId, rooms);
    broadcastRoomList(rooms);
    broadcastSystemMessage(`The game in room ${data.roomId} has started.`, data.roomId);
    broadcastSystemMessage(`${room.activePlayer.name ? room.activePlayer.name : room.activePlayer.id} is drawing now.`, data.roomId);
  }
}

export function changePlayer(data) {
  const room = rooms.get(data.sender.roomId);
  if (room) {
    const prevActivePlayer = room.activePlayer;
    let newActivePlayer = room.players[Math.floor(Math.random() * room.players.length)];
    
    if (room.players.length > 1) {
      while (prevActivePlayer.id === newActivePlayer.id) {
        newActivePlayer = room.players[Math.floor(Math.random() * room.players.length)];
      }
    } else {
      newActivePlayer = room.players[0];
    }
    room.activePlayer = newActivePlayer;

    const message = {
      type: DATA_TYPES.PLAYER_CHANGED,
      activePlayer: room.activePlayer,
    };

    broadcastRoomUpdate(data.sender.roomId, rooms);
    broadcastRoomList(rooms);
    broadcastToRoomOnly(message, data.sender.roomId);
    broadcastSystemMessage(`${room.activePlayer.name ? room.activePlayer.name : room.activePlayer.id} is drawing now.`, data.sender.roomId);
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

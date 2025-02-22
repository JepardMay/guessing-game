import { WebSocketServer } from 'ws';
import { DATA_TYPES } from './constants.js';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// Track connected users
const connectedUsers = new Map(); // Map<ws, { username, id, roomId }>

// Track rooms
const rooms = new Map(); // Map<roomId, { host: string, players: { username: string, id: string, isHost: boolean, roomId: string }, gameOn: boolean }[] }>

wss.on('connection', (ws) => {
  console.log('A new client connected.');
  
  // Initialize user data
  connectedUsers.set(ws, { username: null, id: null, roomId: null });

  broadcastRoomList();

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error('Invalid JSON received:', error);
      return;
    }

    handleMessage(data, ws);
  });

  ws.on('close', () => {
    // Broadcast a system message to all clients
    const userData = connectedUsers.get(ws);
    if (userData?.id) {
      broadcastSystemMessage(`${userData.id} has left the chat.`);
    }

    if (userData?.roomId && userData?.id) {
      const room = rooms.get(userData.roomId);
      if (room) {
        room.players = room.players.filter((player) => player.id !== userData.id);

        checkRoom(userData.roomId, userData.id);
      }
    }

    console.log('A client disconnected.');
    connectedUsers.delete(ws);

    // If no users are connected, clear the session data
    if (connectedUsers.size === 0) {
      rooms.clear();
      console.log('Session data cleared.');
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleMessage(data, ws) {
  switch (data.type) {
    case DATA_TYPES.CREATE_ROOM:
      createRoom(data, ws);
      break;
    case DATA_TYPES.JOIN_ROOM:
      joinRoom(data, ws);
      break;
    case DATA_TYPES.REMOVE_PLAYER:
      removePlayer(data);
      break;
    case DATA_TYPES.LEAVE_ROOM:
      leaveRoom(data, ws);
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

function createRoom(data, ws) {
  rooms.set(data.roomId, { host: data.user, players: [data.user], gameOn: false });

  // Update user data
  connectedUsers.get(ws).roomId = data.roomId;
  connectedUsers.get(ws).id = data.user.id;

  ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_CREATED, roomId: data.roomId, host: data.user }));

  broadcastRoomUpdate(data.roomId);
  broadcastRoomList();
}

function joinRoom(data, ws) {
  const room = rooms.get(data.roomId);
  if (room && !room.players.includes(data.user)) {
    room.players.push(data.user);
    
    // Update user data
    connectedUsers.get(ws).roomId = data.roomId;
    connectedUsers.get(ws).id = data.user.id;

    ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_JOINED, roomId: data.roomId, host: room.host }));

    broadcastRoomUpdate(data.roomId);
    broadcastRoomList();
  }
}

function leaveRoom(data, ws) {
  const room = rooms.get(data.roomId);
  if (room) {
    room.players = room.players.filter((player) => player.id !== data.user.id);
    
    connectedUsers.get(ws).roomId = null;

    ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_LEFT, roomId: data.roomId, host: room.host }));

    checkRoom(data.roomId, data.user.id);
  }
}

function removePlayer(data) {
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

    broadcastRoomUpdate(data.roomId);
    broadcastRoomList();
  }
}

function checkRoom(roomId, userId) {
  const room = rooms.get(roomId);

  if (room && room.host.id === userId) {
    if (room.players.length > 0) {
      room.host = room.players[0];
      room.players[0].isHost = true;
    } else {
      rooms.delete(roomId);
    }
  }

  broadcastRoomUpdate(roomId);
  broadcastRoomList();
};

function startGame(data) {
  const room = rooms.get(data.roomId);
  if (room) {
    room.gameOn = true;

    broadcastRoomUpdate(data.roomId);
    broadcastRoomList();
  }
}

function broadcast(data, filter = () => true) {
  const message = JSON.stringify(data);
  connectedUsers.forEach((userData, client) => {
    if (client.readyState === WebSocket.OPEN && filter(userData)) {
      client.send(message);
    }
  });
}

function broadcastToRoomOnly(data, roomId) {
  broadcast(data, (userData) => userData.roomId === roomId);
}

function broadcastSystemMessage(message) {
  const systemMessage = { type: DATA_TYPES.SYSTEM, message };
  broadcast(systemMessage);
}

function broadcastRoomList() {
  const roomList = Array.from(rooms).map(([roomId, roomData]) => ({
    roomId,
    host: roomData.host,
    players: roomData.players,
    gameOn: roomData.gameOn,
  }));
  const roomListData = { type: DATA_TYPES.ROOM_LIST_UPDATE, rooms: roomList };
  broadcast(roomListData);
}

function broadcastRoomUpdate(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    const roomData = { type: DATA_TYPES.ROOM_UPDATE, roomId, players: room.players, gameOn: room.gameOn };
    broadcast(roomData);
  }
};

console.log(`WebSocket server is running on port ${PORT}`);

import { WebSocketServer } from "ws";
import { DATA_TYPES } from "./constants.js";

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// Track connected users
const connectedUsers = new Map(); // Map<ws, { username, roomId }>

// Track rooms
const rooms = new Map(); // Map<roomId, { host: string, players: { username: string, id: string, isHost: boolean, roomId: string }[] }>

wss.on('connection', (ws) => {
  console.log('A new client connected.');
  
  // Initialize user data
  connectedUsers.set(ws, { username: null, roomId: null });

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
    console.log('A client disconnected.');
    connectedUsers.delete(ws);

    // Broadcast a system message to all clients
    const userData = connectedUsers.get(ws);
    if (userData && userData.username) {
      broadcastSystemMessage(`${userData.username} has left the chat.`);
    }

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
  connectedUsers.get(ws).username = data.user; // Set username

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
    connectedUsers.get(ws).username = data.user; // Set username

    ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_JOINED, roomId: data.roomId, host: room.host }));

    broadcastRoomUpdate(data.roomId);
    broadcastRoomList();
  }
}

function leaveRoom(data, ws) {
  const room = rooms.get(data.roomId);
  if (room) {
    room.players = room.players.filter((player) => player.id !== data.user.id);
    
    connectedUsers.get(ws).roomId = null; // Clear roomId

    ws.send(JSON.stringify({ type: DATA_TYPES.ROOM_LEFT, roomId: data.roomId, host: room.host }));

    if (room.host === data.user.id) {
      if (room.players.length > 0) {
        room.host = room.players[0];
      } else {
        rooms.delete(data.roomId);
      }
    }

    broadcastRoomUpdate(data.roomId);
    broadcastRoomList();
  }
}

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

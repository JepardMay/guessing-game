import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// Track connected users
const connectedUsers = new Set();

// Track rooms
const rooms = new Map(); // Map<roomId, { host: string, players: string[] }>

wss.on('connection', (ws) => {
  console.log('A new client connected.');
  connectedUsers.add(ws);

  broadcastRoomList();

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error('Invalid JSON received:', error);
      return;
    }

    if (data.type === 'createRoom') {
      rooms.set(data.roomId, { host: data.user, players: [data.user], gameOn: false });

      ws.roomId = data.roomId;
      ws.send(JSON.stringify({ type: 'roomCreated', roomId: data.roomId, host: data.user }));

      broadcastRoomUpdate(data.roomId);
      broadcastRoomList();
    } else if (data.type === 'joinRoom') {
      const room = rooms.get(data.roomId);
      if (room) {
        room.players.push(data.user);
        ws.roomId = data.roomId;
        ws.send(JSON.stringify({ type: 'roomJoined', roomId: data.roomId, host: room.host }));

        broadcastRoomUpdate(data.roomId);
        broadcastRoomList();
      }
    } else if (data.type === 'leaveRoom') {
      const room = rooms.get(data.roomId);
      if (room) {
        room.players = room.players.filter((player) => player.id !== data.user.id);
        ws.roomId = null;
        ws.send(JSON.stringify({ type: 'roomLeft', roomId: data.roomId, host: room.host }));

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
    } else if (data.type === 'startGame') {
      const room = rooms.get(data.roomId);
      if (room) {
        room.gameOn = true;

        broadcastRoomUpdate(data.roomId);
        broadcastRoomList();
      }
    } else if (data.type === 'chat') {
      broadcastToRoomOnly(data, data.sender.roomId);
    } else if (data.type === 'draw') {
      broadcastToRoomOnly(data, data.sender.roomId);
    }
  });

  ws.on('close', () => {
    console.log('A client disconnected.');
    connectedUsers.delete(ws);

    // Broadcast a system message to all clients
    if (ws.username) {
      broadcastSystemMessage(`${ws.username} has left the chat.`);
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

function broadcast(data) {
  const message = JSON.stringify(data);
  connectedUsers.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastToRoomOnly(data, roomId) {
  const message = JSON.stringify(data);
  connectedUsers.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
      client.send(message);
    }
  });
}

function broadcastSystemMessage(message) {
  const systemMessage = { type: 'system', message };
  broadcast(systemMessage);
}

function broadcastRoomList() {
  const roomList = Array.from(rooms).map(([roomId, roomData]) => ({
    roomId,
    host: roomData.host,
    players: roomData.players,
    gameOn: roomData.gameOn,
  }));
  const roomListData = { type: 'roomListUpdate', rooms: roomList };
  broadcast(roomListData);
}

function broadcastRoomUpdate(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    const roomData = { type: 'roomUpdate', roomId, players: room.players, gameOn: room.gameOn };
    broadcast(roomData);
  }
};

console.log(`WebSocket server is running on port ${PORT}`);

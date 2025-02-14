import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

const MAX_CHAT_MESSAGES = 100;
// In-memory storage for data
let canvasData = [];
let chatMessages = [];

// Track connected users
let connectedUsers = new Set();

wss.on('connection', (ws) => {
  console.log('A new client connected.');
  connectedUsers.add(ws);

  // Send existing canvas and chat data to the new client
  ws.send(JSON.stringify({ type: 'init', canvasData, chatMessages }));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error('Invalid JSON received:', error);
      return;
    }

    if (data.type === 'join') {
      ws.username = data.username;
      broadcastSystemMessage(`${data.username} has joined the chat.`);
    } else if (data.type === 'chat') {
      addChatMessage(data);
      broadcast(data);
    } else if (data.type === 'draw') {
      canvasData.push(data);
      broadcast(data);
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
      canvasData = [];
      chatMessages = [];
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

function broadcastSystemMessage(message) {
  const systemMessage = { type: 'system', message };
  addChatMessage(systemMessage);
  broadcast(systemMessage);
}

function addChatMessage(message) {
  if (chatMessages.length >= MAX_CHAT_MESSAGES) {
    chatMessages.shift(); // Remove the oldest message
  }
  chatMessages.push(message);
}

console.log(`WebSocket server is running on port ${PORT}`);

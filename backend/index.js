import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// In-memory storage for data
let canvasData = [];
let chatMessages = [];

// Track connected users
let connectedUsers = 0;

wss.on('connection', (ws) => {
  console.log('A new client connected.');
  connectedUsers++;

  // Send existing canvas and chat data to the new client
  ws.send(JSON.stringify({ type: 'init', canvasData, chatMessages }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'chat') {
      // Save chat message
      chatMessages.push(data);
    } else if (data.type === 'draw') {
      // Save drawing action
      canvasData.push(data);
    }

    // Broadcast data
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on('close', () => {
    console.log('A client disconnected.');
    connectedUsers--;

    // If no users are connected, clear the session data
    if (connectedUsers === 0) {
      canvasData = [];
      chatMessages = [];
      console.log('Session data cleared.');
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server is running on port ${PORT}`);

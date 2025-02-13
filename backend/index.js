import { WebSocketServer } from "ws";
import { DATA_TYPES } from '../shared/consts.js';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  console.log('A new client connected.');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === DATA_TYPES.CHAT) {
      // Broadcast chat messages
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'chat', message: data.message, sender: data.sender }));
        }
      });
    } else if (data.type === DATA_TYPES.DRAW) {
      // Broadcast drawing data
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('A client disconnected.');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server is running on port ${PORT}`);

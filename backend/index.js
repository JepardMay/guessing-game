import { WebSocketServer } from "ws";
import { DATA_TYPES } from '../shared/consts.js';

const wss = new WebSocketServer({ port: 8080 });

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
});

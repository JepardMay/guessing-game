import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('A new client connected.');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'chat') {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'chat', message: data.message, sender: data.sender }));
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('A client disconnected.');
  });
});

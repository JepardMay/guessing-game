import { WebSocketServer } from 'ws';
import { setupConnectionHandlers } from './handlers/connectionHandler.js';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

setupConnectionHandlers(wss);

console.log(`WebSocket server is running on port ${PORT}`);

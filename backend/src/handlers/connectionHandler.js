import { addUser, removeUser, getUser, getConnectedUsers } from '../managers/userManager.js';
import { rooms } from '../managers/roomManager.js';
import { handleUserDisconnection } from '../managers/playerManager.js';
import { broadcastRoomList } from '../managers/broadcastManager.js';
import { handleMessage } from './messageHandler.js';

export function setupConnectionHandlers(wss) {
  wss.on('connection', (ws) => {
    console.log('A new client connected.');
    addUser(ws);

    broadcastRoomList(rooms);

    ws.on('message', (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (error) {
        console.error('Invalid JSON received:', error);
        return;
      }

      handleMessage(data, ws, getConnectedUsers());
    });

    ws.on('close', () => {
      const userData = getUser(ws);
      if (userData) {
        handleUserDisconnection(userData);
      }

      console.log('A client disconnected.');
      removeUser(ws);

      // If no users are connected, clear the session data
      if (getConnectedUsers().size === 0) {
        rooms.clear();
        console.log('Session data cleared.');
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

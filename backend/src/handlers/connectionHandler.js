import { addUser, removeUser, getUser, getConnectedUsers } from '../managers/userManager.js';
import { rooms, checkRoom } from '../managers/roomManager.js';
import { broadcastSystemMessage, broadcastRoomList } from '../managers/broadcastManager.js';
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

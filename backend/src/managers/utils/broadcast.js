import { getConnectedUsers } from '../userManager.js';

export function broadcast(data, filter = () => true) {
  let message;
  
  try {
    message = JSON.stringify(data);
  } catch (error) {
    console.error('Error stringifying data:', error);
    return;
  }

  const connectedUsers = getConnectedUsers();

  connectedUsers.forEach((userData, client) => {
    if (client.readyState === WebSocket.OPEN && filter(userData)) {
      try {
        client.send(message);
      } catch (error) {
        console.error(`Error sending message to user ${userData.id}:`, error);
      }
    }
  });
}

import { broadcast } from './broadcast.js';

export function broadcastToRoomOnly(data, roomId) {
  broadcast(data, (userData) => userData.roomId === roomId);
}

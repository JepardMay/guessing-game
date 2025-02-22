const connectedUsers = new Map(); // Map<ws, { username, id, roomId }>

export function addUser(ws) {
  connectedUsers.set(ws, { username: null, id: null, roomId: null });
}

export function removeUser(ws) {
  connectedUsers.delete(ws);
}

export function getUser(ws) {
  return connectedUsers.get(ws);
}

export function updateUser(ws, data) {
  const user = connectedUsers.get(ws);
  if (user) {
    Object.assign(user, data);
  }
}

export function getConnectedUsers() {
  return connectedUsers;
}

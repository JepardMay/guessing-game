export const createWebSocket = (url, onOpen, onMessage, onError, onClose) => {
  const socket = new WebSocket(url);

  socket.onopen = onOpen;
  socket.onmessage = onMessage;
  socket.onerror = onError;
  socket.onclose = onClose;

  return socket;
};

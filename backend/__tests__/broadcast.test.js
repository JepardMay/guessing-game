import { broadcast } from '../src/managers/broadcast.js';
import { getConnectedUsers } from '../src/managers/userManager.js';

jest.mock('../src/managers/userManager.js');

global.WebSocket = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

describe('Broadcast', () => {
  let mockClients;

  beforeEach(() => {
    mockClients = new Map();
    mockClients.set({ readyState: WebSocket.OPEN, send: jest.fn() }, { username: '', id: 'user1', roomId: null });
    mockClients.set({ readyState: WebSocket.OPEN, send: jest.fn() }, { username: '', id: 'user2', roomId: 'room1' });
    mockClients.set({ readyState: WebSocket.CONNECTING, send: jest.fn() }, { username: '', id: 'user3', roomId: null });
    mockClients.set({ readyState: WebSocket.CLOSING, send: jest.fn() }, { username: '', id: 'user4', roomId: null });
    mockClients.set({ readyState: WebSocket.CLOSED, send: jest.fn() }, { username: '', id: 'user5', roomId: null });

    getConnectedUsers.mockReturnValue(mockClients);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should send the message to users with OPEN ready State', () => {
    const data = { message: 'Hello World' };

    broadcast(data);

    const client1 = Array.from(mockClients.keys())[0];
    const client2 = Array.from(mockClients.keys())[1];
    const client3 = Array.from(mockClients.keys())[2];
    const client4 = Array.from(mockClients.keys())[3];
    const client5 = Array.from(mockClients.keys())[4];

    expect(client1.send).toHaveBeenCalledWith(JSON.stringify(data));
    expect(client2.send).toHaveBeenCalledWith(JSON.stringify(data));
    expect(client3.send).not.toHaveBeenCalled();
    expect(client4.send).not.toHaveBeenCalled();
    expect(client5.send).not.toHaveBeenCalled();
  });

  test('should send the message to user with OPEN ready State and matching the filter', () => {
    const data = { message: 'Hi to filters' };
    const filter = (userData) => userData.roomId === 'room1';

    broadcast(data, filter);

    const client1 = Array.from(mockClients.keys())[0];
    const client2 = Array.from(mockClients.keys())[1]; 

    expect(client1.send).not.toHaveBeenCalled();
    expect(client2.send).toHaveBeenCalledWith(JSON.stringify(data));
  });

  test('should not send any messages when there are no connected users', () => {
    getConnectedUsers.mockReturnValue(new Map());

    const data = { message: 'Hello World' };
    broadcast(data);

    expect(getConnectedUsers().size).toBe(0);
  });

  test('should not send any messages when the filter excludes all users', () => {
    const mockClients = new Map();
    mockClients.set({ readyState: WebSocket.OPEN, send: jest.fn() }, { username: '', id: 'user1', roomId: null });
    mockClients.set({ readyState: WebSocket.OPEN, send: jest.fn() }, { username: '', id: 'user2', roomId: null });

    getConnectedUsers.mockReturnValue(mockClients);

    const data = { message: 'Hello World' };
    const filter = () => false;

    broadcast(data, filter);

    mockClients.forEach((_, client) => {
      expect(client.send).not.toHaveBeenCalled();
    });
  });

  test('should handle invalid data gracefully', () => {
    const mockClients = new Map();
    mockClients.set({ readyState: WebSocket.OPEN, send: jest.fn() }, { username: '', id: 'user1', roomId: null });

    getConnectedUsers.mockReturnValue(mockClients);

    const invalidData = null;
    broadcast(invalidData);

    const client = Array.from(mockClients.keys())[0];
    expect(client.send).toHaveBeenCalledWith(JSON.stringify(invalidData));
  });

  test('should handle errors in client.send gracefully', () => {
    const mockClients = new Map();
    const mockSend = jest.fn().mockImplementation(() => {
      throw new Error('Failed to send message');
    });
    mockClients.set({ readyState: WebSocket.OPEN, send: mockSend }, { username: '', id: 'user1', roomId: null });

    getConnectedUsers.mockReturnValue(mockClients);

    const data = { message: 'Hello World' };

    expect(() => broadcast(data)).not.toThrow();

    expect(mockSend).toHaveBeenCalled();
  });

  test('should handle large data without performance issues', () => {
    const mockClients = new Map();
    mockClients.set({ readyState: WebSocket.OPEN, send: jest.fn() }, { username: '', id: 'user1', roomId: null });

    getConnectedUsers.mockReturnValue(mockClients);

    const largeData = { message: 'a'.repeat(1000000) };
    broadcast(largeData);

    const client = Array.from(mockClients.keys())[0];
    expect(client.send).toHaveBeenCalledWith(JSON.stringify(largeData));
  });

  test('should handle non-stringifiable data gracefully', () => {
    const mockClients = new Map();
    mockClients.set({ readyState: WebSocket.OPEN, send: jest.fn() }, { username: '', id: 'user1', roomId: null });

    getConnectedUsers.mockReturnValue(mockClients);

    const circularData = { message: 'Hello World' };
    circularData.self = circularData;

    expect(() => broadcast(circularData)).not.toThrow();

    const client = Array.from(mockClients.keys())[0];
    expect(client.send).not.toHaveBeenCalled();
  });

  test('should handle concurrent calls correctly', async () => {
    const mockClients = new Map();
    mockClients.set({ readyState: WebSocket.OPEN, send: jest.fn() }, { username: '', id: 'user1', roomId: null });
    mockClients.set({ readyState: WebSocket.OPEN, send: jest.fn() }, { username: '', id: 'user2', roomId: null });

    getConnectedUsers.mockReturnValue(mockClients);

    const data1 = { message: 'Hello World 1' };
    const data2 = { message: 'Hello World 2' };

    await Promise.all([broadcast(data1), broadcast(data2)]);

    mockClients.forEach((_, client) => {
      expect(client.send).toHaveBeenCalledWith(JSON.stringify(data1));
      expect(client.send).toHaveBeenCalledWith(JSON.stringify(data2));
    });
  });
});

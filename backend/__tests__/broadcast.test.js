import { broadcast } from '../src/managers/broadcastManager.js';
import {
  getConnectedUsers,
} from '../src/managers/userManager.js';

jest.mock('../src/managers/userManager.js', () => ({
  ...jest.requireActual('../src/managers/userManager.js'),
  getConnectedUsers: jest.fn(),
}));

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
});

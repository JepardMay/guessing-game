import { setupConnectionHandlers } from '../src/handlers/connectionHandler';
import {
  addUser,
  removeUser,
  getUser,
  getConnectedUsers,
} from '../src/managers/userManager.js';
import { rooms } from '../src/managers/roomManager.js';
import { handleUserDisconnection } from '../src/managers/playerManager.js';
import { broadcastRoomList } from '../src/managers/broadcastManager.js';
import { handleMessage } from '../src/handlers/messageHandler.js';
import { DATA_TYPES } from '../src/constants.js';

jest.mock('../src/managers/userManager.js');
jest.mock('../src/managers/roomManager.js');
jest.mock('../src/managers/playerManager.js');
jest.mock('../src/managers/broadcastManager.js');
jest.mock('../src/handlers/messageHandler.js');

describe('setupConnectionHandlers', () => {
  let wss, ws;

  beforeEach(() => {
    wss = {
      on: jest.fn(),
    };
    ws = {
      on: jest.fn(),
      send: jest.fn(),
    };

    getConnectedUsers.mockImplementation(() => new Map());
    rooms.clear = jest.fn();
    console.error = jest.fn();

    setupConnectionHandlers(wss);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should set up connection event handler', () => {
    const connectionHandler = wss.on.mock.calls[0][1];
    connectionHandler(ws);

    expect(addUser).toHaveBeenCalledWith(ws);
    expect(broadcastRoomList).toHaveBeenCalledWith(rooms);
  });

  test('should set up message event handler', () => {
    const connectionHandler = wss.on.mock.calls[0][1];
    connectionHandler(ws);

    const messageHandler = ws.on.mock.calls[0][1];
    const message = JSON.stringify({
      type: DATA_TYPES.CREATE_ROOM, roomId: 'room1', user: { id: 'user1' }
    });
    messageHandler(message);

    expect(handleMessage).toHaveBeenCalledWith({
      type: DATA_TYPES.CREATE_ROOM, roomId: 'room1', user: { id: 'user1' }
    }, ws, getConnectedUsers());
  });

  test('should set up close event handler', () => {
    const connectionHandler = wss.on.mock.calls[0][1];
    connectionHandler(ws);

    getUser.mockReturnValue({ id: 'user1', roomId: 'room1' });

    const closeHandler = ws.on.mock.calls[1][1];
    closeHandler();

    expect(handleUserDisconnection).toHaveBeenCalledWith({ id: 'user1', roomId: 'room1' });
    expect(removeUser).toHaveBeenCalledWith(ws);
    expect(rooms.clear).toHaveBeenCalled();
  });

  test('should set up error event handler', () => {
    const connectionHandler = wss.on.mock.calls[0][1];
    connectionHandler(ws);

    const errorHandler = ws.on.mock.calls[2][1];
    const error = new Error('WebSocket error');
    errorHandler(error);

    expect(console.error).toHaveBeenCalledWith('WebSocket error:', error);
  });
});

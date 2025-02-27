import { handleMessage } from '../src/handlers/messageHandler.js';
import { DATA_TYPES } from '../src/constants.js';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  removePlayer,
  startGame,
  changePlayer,
} from '../src/managers/roomManager.js';
import { broadcastToRoomOnly } from '../src/managers/broadcastManager.js';

jest.mock('../src/managers/roomManager.js');
jest.mock('../src/managers/broadcastManager.js');

describe('handleMessage', () => {
  let ws, connectedUsers;

  beforeEach(() => {
    ws = {};
    connectedUsers = new Map();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should call createRoom from CREATE_ROOM message', () => {
    const data = {
      type: DATA_TYPES.CREATE_ROOM,
      roomId: 'room1',
      user: {
        username: 'Alice',
        id: 'user1',
        isHost: true,
        roomId: 'room1',
      },
    };

    handleMessage(data, ws, connectedUsers);

    expect(createRoom).toHaveBeenCalledWith(data, ws, connectedUsers);
  });

  test('should call joinRoom from JOIN_ROOM message', () => {
    const data = {
      type: DATA_TYPES.JOIN_ROOM,
      roomId: 'room1',
      user: {
        username: 'Bob',
        id: 'user2',
        isHost: false,
        roomId: 'room1',
      },
    };

    handleMessage(data, ws, connectedUsers);

    expect(joinRoom).toHaveBeenCalledWith(data, ws, connectedUsers);
  });

  test('should call removePlayer from REMOVE_PLAYER message', () => {
    const data = {
      type: DATA_TYPES.REMOVE_PLAYER,
      roomId: 'room1',
      user: {
        username: 'Bob',
        id: 'user2',
        isHost: false,
        roomId: 'room1',
      },
    };

    handleMessage(data, ws, connectedUsers);

    expect(removePlayer).toHaveBeenCalledWith(data, connectedUsers);
  });

  test('should call leaveRoom from LEAVE_ROOM message', () => {
    const data = {
      type: DATA_TYPES.LEAVE_ROOM,
      roomId: 'room1',
      user: {
        username: 'Alice',
        id: 'user1',
        isHost: true,
        roomId: 'room1',
      },
    };

    handleMessage(data, ws, connectedUsers);

    expect(leaveRoom).toHaveBeenCalledWith(data, ws, connectedUsers);
  });

  test('should call startGame from START_GAME message', () => {
    const data = {
      type: DATA_TYPES.START_GAME,
      roomId: 'room1',
      user: {
        username: 'Alice',
        id: 'user1',
        isHost: true,
        roomId: 'room1',
      },
    };

    handleMessage(data, ws, connectedUsers);

    expect(startGame).toHaveBeenCalledWith(data);
  });

  test('should call broadcastToRoomOnly from CHAT message', () => {
    const data = {
      type: DATA_TYPES.CHAT,
      message: 'Hi',
      sender: {
        roomId: 'room1',
      },
    };

    handleMessage(data, ws, connectedUsers);

    expect(broadcastToRoomOnly).toHaveBeenCalledWith(data, data.sender.roomId);
  });

  test('should call broadcastToRoomOnly from DRAW message', () => {
    const data = {
      type: DATA_TYPES.DRAW,
      sender: {
        roomId: 'room1',
      },
    };

    handleMessage(data, ws, connectedUsers);

    expect(broadcastToRoomOnly).toHaveBeenCalledWith(data, data.sender.roomId);
  });

  test('should call changePlayer from CHANGE_PLAYER message', () => {
    const data = {
      type: DATA_TYPES.CHANGE_PLAYER,
      sender: {
        username: 'Alice',
        id: 'user1',
        isHost: true,
        roomId: 'room1',
      },
    };

    handleMessage(data, ws, connectedUsers);

    expect(changePlayer).toHaveBeenCalledWith(data);
  });

  test('should do nothing for an unknown message type', () => {
    const data = {
      type: 'unknown'
    };

    handleMessage(data, ws, connectedUsers);

    expect(createRoom).not.toHaveBeenCalled();
    expect(joinRoom).not.toHaveBeenCalled();
    expect(removePlayer).not.toHaveBeenCalled();
    expect(leaveRoom).not.toHaveBeenCalled();
    expect(startGame).not.toHaveBeenCalled();
    expect(broadcastToRoomOnly).not.toHaveBeenCalled();
    expect(changePlayer).not.toHaveBeenCalled();
  });
});

import { rooms, createRoom, joinRoom } from '../src/managers/roomManager.js';
import { DATA_TYPES } from '../src/constants.js';
import { broadcastToRoomOnly } from '../src/managers/broadcastToRoomOnly.js';
import { broadcastRoomUpdate, broadcastRoomList, broadcastSystemMessage } from '../src/managers/broadcastManager.js';

jest.mock('../src/managers/broadcastToRoomOnly.js');
jest.mock('../src/managers/broadcastManager.js');

describe('roomManager', () => {
  afterEach(() => {
    jest.clearAllMocks();
    rooms.clear();
  });

  test('createRoom should create a new room with the provided roomId and user details', () => {
    const mockData = {
      roomId: 'room123',
      user: { id: 'user1', name: 'John' }
    };
    const mockWs = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs, {});

    createRoom(mockData, mockWs, mockConnectedUsers);

    expect(rooms.get(mockData.roomId)).toEqual({
      host: mockData.user,
      players: [mockData.user],
      gameOn: false,
      activePlayer: mockData.user
    });

    expect(mockConnectedUsers.get(mockWs)).toEqual({
      roomId: mockData.roomId,
      id: mockData.user.id,
      username: mockData.user.name
    });

    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_CREATED,
      roomId: mockData.roomId,
      host: mockData.user
    }));

    expect(broadcastRoomUpdate).toHaveBeenCalledWith(mockData.roomId, rooms);
    expect(broadcastRoomList).toHaveBeenCalledWith(rooms);
    expect(broadcastSystemMessage).toHaveBeenCalledWith(
      `${mockData.user.name} has created the room.`,
      mockData.roomId
    );
  });

  test('createRoom should handle multiple rooms being created simultaneously', () => {
    const mockData1 = {
      roomId: 'room1',
      user: { id: 'user1', name: 'John' }
    };
    const mockData2 = {
      roomId: 'room2',
      user: { id: 'user2', name: 'Jane' }
    };
    const mockWs1 = { send: jest.fn() };
    const mockWs2 = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs1, {});
    mockConnectedUsers.set(mockWs2, {});

    createRoom(mockData1, mockWs1, mockConnectedUsers);
    createRoom(mockData2, mockWs2, mockConnectedUsers);

    expect(rooms.size).toBe(2);
    expect(rooms.get(mockData1.roomId)).toBeDefined();
    expect(rooms.get(mockData2.roomId)).toBeDefined();

    expect(mockConnectedUsers.get(mockWs1)).toEqual({
      roomId: mockData1.roomId,
      id: mockData1.user.id,
      username: mockData1.user.name
    });
    expect(mockConnectedUsers.get(mockWs2)).toEqual({
      roomId: mockData2.roomId,
      id: mockData2.user.id,
      username: mockData2.user.name
    });

    expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_CREATED,
      roomId: mockData1.roomId,
      host: mockData1.user
    }));
    expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_CREATED,
      roomId: mockData2.roomId,
      host: mockData2.user
    }));

    expect(broadcastRoomUpdate).toHaveBeenCalledTimes(2);
    expect(broadcastRoomList).toHaveBeenCalledTimes(2);
    expect(broadcastSystemMessage).toHaveBeenCalledTimes(2);
  });

  test('createRoom should not overwrite existing room data if roomId already exists', () => {
    const existingRoomId = 'existingRoom';
    const existingRoom = { host: { id: 'existingHost', name: 'Existing Host' }, players: [], gameOn: false, activePlayer: null };
    rooms.set(existingRoomId, existingRoom);

    const mockData = {
      roomId: existingRoomId,
      user: { id: 'newUser', name: 'New User' }
    };
    const mockWs = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs, {});

    createRoom(mockData, mockWs, mockConnectedUsers);

    expect(rooms.get(existingRoomId)).toEqual(existingRoom);
    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ERROR,
      message: 'An error occurred while creating the room. Please, try again.',
    }));
    expect(mockWs.send).not.toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_CREATED,
      roomId: mockData.roomId,
      host: mockData.user
    }));
    expect(broadcastRoomUpdate).not.toHaveBeenCalled();
    expect(broadcastRoomList).not.toHaveBeenCalled();
    expect(broadcastSystemMessage).not.toHaveBeenCalled();
  });

  test('createRoom should update connectedUsers map correctly for multiple connected users', () => {
    const mockData1 = {
      roomId: 'room1',
      user: { id: 'user1', name: 'John' }
    };
    const mockData2 = {
      roomId: 'room2',
      user: { id: 'user2', name: 'Jane' }
    };
    const mockWs1 = { send: jest.fn() };
    const mockWs2 = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs1, {});
    mockConnectedUsers.set(mockWs2, {});

    createRoom(mockData1, mockWs1, mockConnectedUsers);
    createRoom(mockData2, mockWs2, mockConnectedUsers);

    expect(mockConnectedUsers.get(mockWs1)).toEqual({
      roomId: mockData1.roomId,
      id: mockData1.user.id,
      username: mockData1.user.name
    });
    expect(mockConnectedUsers.get(mockWs2)).toEqual({
      roomId: mockData2.roomId,
      id: mockData2.user.id,
      username: mockData2.user.name
    });

    expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_CREATED,
      roomId: mockData1.roomId,
      host: mockData1.user
    }));
    expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_CREATED,
      roomId: mockData2.roomId,
      host: mockData2.user
    }));

    expect(broadcastRoomUpdate).toHaveBeenCalledTimes(2);
    expect(broadcastRoomList).toHaveBeenCalledTimes(2);
    expect(broadcastSystemMessage).toHaveBeenCalledTimes(2);
  });

  test('createRoom should maintain consistency between rooms map and connectedUsers data', () => {
    const mockData = {
      roomId: 'room123',
      user: { id: 'user1', name: 'John' }
    };
    const mockWs = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs, {});

    createRoom(mockData, mockWs, mockConnectedUsers);

    expect(rooms.get(mockData.roomId)).toEqual({
      host: mockData.user,
      players: [mockData.user],
      gameOn: false,
      activePlayer: mockData.user
    });

    expect(mockConnectedUsers.get(mockWs)).toEqual({
      roomId: mockData.roomId,
      id: mockData.user.id,
      username: mockData.user.name
    });

    expect(rooms.get(mockData.roomId).host.id).toBe(mockConnectedUsers.get(mockWs).id);
    expect(rooms.get(mockData.roomId).players[0].id).toBe(mockConnectedUsers.get(mockWs).id);
    expect(rooms.get(mockData.roomId).players[0].name).toBe(mockConnectedUsers.get(mockWs).username);
  });
});


import { DATA_TYPES } from '../src/constants.js';
import { checkRoom } from '../src/managers/utils/checkRoom.js';
import { rooms, createRoom, joinRoom, leaveRoom } from '../src/managers/roomManager.js';
import { broadcastRoomUpdate, broadcastRoomList, broadcastSystemMessage } from '../src/managers/broadcastManager.js';

jest.mock('../src/managers/utils/broadcastToRoomOnly.js');
jest.mock('../src/managers/utils/checkRoom.js');
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

  test('joinRoom should join an existing room successfully when a valid roomId and user are provided', () => {
    const mockData = {
      roomId: 'room123',
      user: { id: 'user2', name: 'Jane' }
    };
    const mockWs = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs, {});

    // Create an existing room
    const existingRoom = { host: { id: 'user1', name: 'John' }, players: [{ id: 'user1', name: 'John' }], gameOn: false };
    rooms.set(mockData.roomId, existingRoom);

    joinRoom(mockData, mockWs, mockConnectedUsers);

    expect(rooms.get(mockData.roomId).players).toContainEqual(mockData.user);
    expect(mockConnectedUsers.get(mockWs)).toEqual({
      roomId: mockData.roomId,
      id: mockData.user.id,
      username: mockData.user.name
    });

    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_JOINED,
      roomId: mockData.roomId,
      host: existingRoom.host
    }));

    expect(broadcastRoomUpdate).toHaveBeenCalledWith(mockData.roomId, rooms);
    expect(broadcastRoomList).toHaveBeenCalledWith(rooms);
    expect(broadcastSystemMessage).toHaveBeenCalledWith(
      `${mockData.user.name} has joined the room.`,
      mockData.roomId
    );
  });

  test('joinRoom should not join a non-existent room', () => {
    const mockData = {
      roomId: 'nonExistentRoom',
      user: { id: 'user1', name: 'John' }
    };
    const mockWs = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs, {});

    joinRoom(mockData, mockWs, mockConnectedUsers);

    expect(rooms.get(mockData.roomId)).toBeUndefined();
    expect(mockConnectedUsers.get(mockWs)).toEqual({});
    expect(mockWs.send).not.toHaveBeenCalled();
    expect(broadcastRoomUpdate).not.toHaveBeenCalled();
    expect(broadcastRoomList).not.toHaveBeenCalled();
    expect(broadcastSystemMessage).not.toHaveBeenCalled();
  });

  test('joinRoom should correctly update the room\'s players array when a new user joins', () => {
    const mockRoomId = 'room123';
    const mockUser = { id: 'user2', name: 'Jane' };
    const mockWs = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs, {});

    // Create an existing room with one player
    const existingRoom = {
      host: { id: 'user1', name: 'John' },
      players: [{ id: 'user1', name: 'John' }],
      gameOn: false
    };
    rooms.set(mockRoomId, existingRoom);

    const mockData = {
      roomId: mockRoomId,
      user: mockUser
    };

    joinRoom(mockData, mockWs, mockConnectedUsers);

    expect(rooms.get(mockRoomId).players).toHaveLength(2);
    expect(rooms.get(mockRoomId).players).toContainEqual(mockUser);
    expect(mockConnectedUsers.get(mockWs)).toEqual({
      roomId: mockRoomId,
      id: mockUser.id,
      username: mockUser.name
    });
    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_JOINED,
      roomId: mockRoomId,
      host: existingRoom.host
    }));
    expect(broadcastRoomUpdate).toHaveBeenCalledWith(mockRoomId, rooms);
    expect(broadcastRoomList).toHaveBeenCalledWith(rooms);
    expect(broadcastSystemMessage).toHaveBeenCalledWith(
      `${mockUser.name} has joined the room.`,
      mockRoomId
    );
  });

  test('joinRoom should not affect other rooms or their player lists', () => {
    const mockRoomId1 = 'room1';
    const mockRoomId2 = 'room2';
    const mockUser1 = { id: 'user1', name: 'John' };
    const mockUser2 = { id: 'user2', name: 'Jane' };
    const mockUser3 = { id: 'user3', name: 'Bob' };
    const mockWs = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs, {});

    // Create two existing rooms
    rooms.set(mockRoomId1, {
      host: mockUser1,
      players: [mockUser1],
      gameOn: false
    });
    rooms.set(mockRoomId2, {
      host: mockUser2,
      players: [mockUser2],
      gameOn: false
    });

    const mockData = {
      roomId: mockRoomId1,
      user: mockUser3
    };

    joinRoom(mockData, mockWs, mockConnectedUsers);

    // Check that the joined room has been updated correctly
    expect(rooms.get(mockRoomId1).players).toHaveLength(2);
    expect(rooms.get(mockRoomId1).players).toContainEqual(mockUser3);

    // Check that the other room remains unchanged
    expect(rooms.get(mockRoomId2).players).toHaveLength(1);
    expect(rooms.get(mockRoomId2).players).toContainEqual(mockUser2);
    expect(rooms.get(mockRoomId2).players).not.toContainEqual(mockUser3);

    expect(broadcastRoomUpdate).toHaveBeenCalledWith(mockRoomId1, rooms);
    expect(broadcastRoomList).toHaveBeenCalledWith(rooms);
    expect(broadcastSystemMessage).toHaveBeenCalledWith(
      `${mockUser3.name} has joined the room.`,
      mockRoomId1
    );
  });

  test('leaveRoom should remove the player from the room\'s player list', () => {
    const mockRoomId = 'room123';
    const mockUser = { id: 'user1', name: 'John' };
    const mockWs = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs, { roomId: mockRoomId });

    const mockRoom = {
      host: { id: 'host', name: 'Host' },
      players: [
        { id: 'host', name: 'Host' },
        mockUser,
        { id: 'user2', name: 'Jane' }
      ]
    };
    rooms.set(mockRoomId, mockRoom);

    const mockData = {
      roomId: mockRoomId,
      user: mockUser
    };

    leaveRoom(mockData, mockWs, mockConnectedUsers);

    expect(rooms.get(mockRoomId).players).toHaveLength(2);
    expect(rooms.get(mockRoomId).players).not.toContainEqual(mockUser);
    expect(mockConnectedUsers.get(mockWs).roomId).toBeNull();
    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_LEFT,
      roomId: mockRoomId,
      host: mockRoom.host
    }));
    expect(checkRoom).toHaveBeenCalledWith(mockRoomId, mockUser.id);
    expect(broadcastSystemMessage).toHaveBeenCalledWith(
      `${mockUser.name} has left the room.`,
      mockRoomId
    );
  });

  test('leaveRoom should handle multiple players leaving simultaneously', () => {
    const mockRoomId = 'room123';
    const mockUser1 = { id: 'user1', name: 'John' };
    const mockUser2 = { id: 'user2', name: 'Jane' };
    const mockUser3 = { id: 'user3', name: 'Bob' };
    const mockWs1 = { send: jest.fn() };
    const mockWs2 = { send: jest.fn() };
    const mockConnectedUsers = new Map();
    mockConnectedUsers.set(mockWs1, { roomId: mockRoomId });
    mockConnectedUsers.set(mockWs2, { roomId: mockRoomId });

    const mockRoom = {
      host: mockUser1,
      players: [mockUser1, mockUser2, mockUser3]
    };
    rooms.set(mockRoomId, mockRoom);

    leaveRoom({ roomId: mockRoomId, user: mockUser2 }, mockWs1, mockConnectedUsers);
    leaveRoom({ roomId: mockRoomId, user: mockUser3 }, mockWs2, mockConnectedUsers);

    expect(rooms.get(mockRoomId).players).toHaveLength(1);
    expect(rooms.get(mockRoomId).players).toContainEqual(mockUser1);
    expect(rooms.get(mockRoomId).players).not.toContainEqual(mockUser2);
    expect(rooms.get(mockRoomId).players).not.toContainEqual(mockUser3);
    expect(mockConnectedUsers.get(mockWs1).roomId).toBeNull();
    expect(mockConnectedUsers.get(mockWs2).roomId).toBeNull();
    expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_LEFT,
      roomId: mockRoomId,
      host: mockUser1
    }));
    expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify({
      type: DATA_TYPES.ROOM_LEFT,
      roomId: mockRoomId,
      host: mockUser1
    }));
    expect(checkRoom).toHaveBeenCalledWith(mockRoomId, mockUser2.id);
    expect(checkRoom).toHaveBeenCalledWith(mockRoomId, mockUser3.id);
    expect(broadcastSystemMessage).toHaveBeenCalledWith(
      `${mockUser2.name} has left the room.`,
      mockRoomId
    );
    expect(broadcastSystemMessage).toHaveBeenCalledWith(
      `${mockUser3.name} has left the room.`,
      mockRoomId
    );
  });
});

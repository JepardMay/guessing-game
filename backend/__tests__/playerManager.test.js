import { removePlayer, handleUserDisconnection } from '../src/managers/playerManager';
import { rooms } from '../src/managers/roomManager';
import { broadcastRoomUpdate, broadcastRoomList, broadcastSystemMessage } from '../src/managers/broadcastManager';
import { DATA_TYPES } from '../src/constants';
import { checkRoom } from '../src/managers/utils/checkRoom';

jest.mock('../src/managers/broadcastManager');
jest.mock('../src/managers/utils/checkRoom.js');

describe('removePlayer function', () => {
  const mockRoomId = '123';
  const mockUser = { id: 'user1', name: 'John Doe' };
  const mockConnectedUsers = new Map();
  const mockClient = { send: jest.fn() };
  const mockPlayer1 = { id: 'player1', roomId: mockRoomId };
  const mockPlayer2 = { id: 'user1', roomId: mockRoomId };
  const mockPlayer3 = { id: 'player3', roomId: mockRoomId };
  const mockPlayer4 = {};

  beforeEach(() => {
    rooms.set(mockRoomId, { players: [mockPlayer1, mockPlayer2, mockPlayer3] });
    mockConnectedUsers.set(mockClient, { id: 'user1' });
  });

  afterEach(() => {
    rooms.clear();
    mockConnectedUsers.clear();
    jest.clearAllMocks();
  });

  test('should remove the player from a room with multiple players', () => {
    removePlayer({ roomId: mockRoomId, user: mockUser }, mockConnectedUsers);

    expect(rooms.get(mockRoomId).players).toEqual([mockPlayer1, mockPlayer3]);
    expect(mockClient.send).toHaveBeenCalledWith(
      JSON.stringify({ type: DATA_TYPES.PLAYER_REMOVED, roomId: mockRoomId })
    );
    expect(broadcastRoomUpdate).toHaveBeenCalledWith(mockRoomId, rooms);
    expect(broadcastRoomList).toHaveBeenCalledWith(rooms);
    expect(broadcastSystemMessage).toHaveBeenCalledWith('John Doe has been removed from the room.', mockRoomId);
  });

  test('should remove user from room when user is found in room players', () => {
    handleUserDisconnection(mockPlayer1);

    expect(rooms.get(mockRoomId).players).toEqual([mockPlayer2, mockPlayer3]);
    expect(broadcastSystemMessage).toHaveBeenCalledWith('player1 has disconnected.', mockRoomId);
  });

  test('should check room after user disconnection', () => {
    handleUserDisconnection(mockPlayer1);

    expect(rooms.get(mockRoomId).players).toEqual([mockPlayer2, mockPlayer3]);
    expect(checkRoom).toHaveBeenCalledWith(mockPlayer1.roomId, mockPlayer1.id);
  });

  test('should handle user disconnection when userData is missing id or roomId', () => {
    handleUserDisconnection(mockPlayer4);

    expect(rooms.get(mockRoomId).players).toEqual([mockPlayer1, mockPlayer2, mockPlayer3]);
    expect(broadcastSystemMessage).not.toHaveBeenCalled();
    expect(checkRoom).not.toHaveBeenCalled();
  });
});

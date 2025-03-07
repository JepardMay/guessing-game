import { checkRoom } from '../src/managers/utils/checkRoom.js';
import { rooms } from '../src/managers/roomManager.js';
import { broadcastRoomUpdate, broadcastRoomList, broadcastSystemMessage } from '../src/managers/broadcastManager.js';

jest.mock('../src/managers/broadcastManager.js');

describe('checkRoom', () => {
  afterEach(() => {
    jest.clearAllMocks();
    rooms.clear();
  });

  it('should transfer host status to the first player when the host leaves', () => {
    const roomId = 'testRoom';
    const hostId = 'host123';
    const playerId = 'player456';
    const mockRoom = {
      host: { id: hostId },
      players: [{ id: playerId, name: 'TestPlayer' }]
    };
    rooms.set(roomId, mockRoom);

    checkRoom(roomId, hostId);

    const updatedRoom = rooms.get(roomId);
    expect(updatedRoom.host.id).toBe(playerId);
    expect(updatedRoom.players[0].isHost).toBe(true);
    expect(broadcastSystemMessage).toHaveBeenCalledWith(`${mockRoom.players[0].name} is now the host.`, roomId);
  });

  it('should delete the room when the host leaves and there are no other players', () => {
    const roomId = 'emptyRoom';
    const hostId = 'host123';
    const mockRoom = {
      host: { id: hostId },
      players: []
    };
    rooms.set(roomId, mockRoom);

    checkRoom(roomId, hostId);

    expect(rooms.has(roomId)).toBe(false);
    expect(broadcastRoomUpdate).toHaveBeenCalledWith(roomId, rooms);
    expect(broadcastRoomList).toHaveBeenCalledWith(rooms);
  });

  it('should not modify the room when a non-host user is checked', () => {
    const roomId = 'testRoom';
    const hostId = 'host123';
    const nonHostId = 'player456';
    const mockRoom = {
      host: { id: hostId },
      players: [{ id: nonHostId, name: 'TestPlayer' }]
    };
    rooms.set(roomId, mockRoom);

    checkRoom(roomId, nonHostId);

    const updatedRoom = rooms.get(roomId);
    expect(updatedRoom).toEqual(mockRoom);
    expect(broadcastRoomUpdate).toHaveBeenCalledWith(roomId, rooms);
    expect(broadcastRoomList).toHaveBeenCalledWith(rooms);
  });

  it('should handle the case when the room does not exist', () => {
    const nonExistentRoomId = 'nonExistentRoom';
    const userId = 'someUserId';

    checkRoom(nonExistentRoomId, userId);

    expect(rooms.has(nonExistentRoomId)).toBe(false);
    expect(broadcastRoomUpdate).not.toHaveBeenCalled();
    expect(broadcastRoomList).not.toHaveBeenCalled();
  });

  it('should correctly identify the host based on the userId', () => {
    const roomId = 'testRoom';
    const hostId = 'host123';
    const playerId = 'player456';
    const mockRoom = {
      host: { id: hostId },
      players: [{ id: playerId, name: 'TestPlayer' }]
    };
    rooms.set(roomId, mockRoom);

    checkRoom(roomId, hostId);

    const updatedRoom = rooms.get(roomId);
    expect(updatedRoom.host.id).toBe(playerId);
    expect(updatedRoom.players[0].isHost).toBe(true);
    expect(broadcastSystemMessage).toHaveBeenCalledWith('TestPlayer is now the host.', roomId);
    expect(broadcastRoomUpdate).toHaveBeenCalledWith(roomId, rooms);
    expect(broadcastRoomList).toHaveBeenCalledWith(rooms);
  });
});

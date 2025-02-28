import { broadcast } from '../src/managers/broadcast.js';
import { broadcastToRoomOnly } from '../src/managers/broadcastToRoomOnly.js';

jest.mock('../src/managers/broadcast.js');

describe('Broadcast To Room Only', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call broadcast with the correct data and filter', () => {
    const data = { message: 'Hello, Room!' };
    const roomId = 'room1';

    broadcastToRoomOnly(data, roomId);

    expect(broadcast).toHaveBeenCalledWith(data, expect.any(Function));
    const filter = broadcast.mock.calls[0][1];
    expect(filter({ roomId: 'room1' })).toBe(true);
    expect(filter({ roomId: 'room2' })).toBe(false);
  });

  it('should broadcast to the correct room when multiple rooms have users', () => {
    const data = { message: 'Room-specific message' };
    const targetRoomId = 'room2';

    const mockUsers = [
      { id: 'user1', roomId: 'room1' },
      { id: 'user2', roomId: 'room2' },
      { id: 'user3', roomId: 'room2' },
      { id: 'user4', roomId: 'room3' },
    ];

    broadcastToRoomOnly(data, targetRoomId);

    expect(broadcast).toHaveBeenCalledWith(data, expect.any(Function));
    const filter = broadcast.mock.calls[0][1];

    mockUsers.forEach(user => {
      const result = filter(user);
      if (user.roomId === targetRoomId) {
        expect(result).toBe(true);
      } else {
        expect(result).toBe(false);
      }
    });
  });

  it('should broadcast to multiple users in the same room', () => {
    const data = { message: 'Hello, everyone in this room!' };
    const targetRoomId = 'room1';

    const mockUsers = [
      { id: 'user1', roomId: 'room1' },
      { id: 'user2', roomId: 'room1' },
      { id: 'user3', roomId: 'room2' },
      { id: 'user4', roomId: 'room1' },
    ];

    broadcastToRoomOnly(data, targetRoomId);

    expect(broadcast).toHaveBeenCalledWith(data, expect.any(Function));
    const filter = broadcast.mock.calls[0][1];

    let usersInTargetRoom = 0;
    mockUsers.forEach(user => {
      const result = filter(user);
      if (user.roomId === targetRoomId) {
        expect(result).toBe(true);
        usersInTargetRoom++;
      } else {
        expect(result).toBe(false);
      }
    });

    expect(usersInTargetRoom).toBe(3);
  });

  it('should handle a null or undefined roomId', () => {
    const data = { message: 'Test message' };
    const nullRoomId = null;
    const undefinedRoomId = undefined;

    broadcastToRoomOnly(data, nullRoomId);
    expect(broadcast).toHaveBeenCalledWith(data, expect.any(Function));
    const nullFilter = broadcast.mock.calls[0][1];
    expect(nullFilter({ roomId: null })).toBe(true);
    expect(nullFilter({ roomId: 'room1' })).toBe(false);

    jest.clearAllMocks();

    broadcastToRoomOnly(data, undefinedRoomId);
    expect(broadcast).toHaveBeenCalledWith(data, expect.any(Function));
    const undefinedFilter = broadcast.mock.calls[0][1];
    expect(undefinedFilter({ roomId: undefined })).toBe(true);
    expect(undefinedFilter({ roomId: 'room1' })).toBe(false);
  });

  it('should not broadcast to users in different rooms', () => {
    const data = { message: 'Room-specific message' };
    const targetRoomId = 'room1';

    const mockUsers = [
      { id: 'user1', roomId: 'room2' },
      { id: 'user2', roomId: 'room3' },
      { id: 'user3', roomId: 'room4' },
    ];

    broadcastToRoomOnly(data, targetRoomId);

    expect(broadcast).toHaveBeenCalledWith(data, expect.any(Function));
    const filter = broadcast.mock.calls[0][1];

    mockUsers.forEach(user => {
      expect(filter(user)).toBe(false);
    });
  });
});

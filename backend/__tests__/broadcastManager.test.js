import { DATA_TYPES } from '../src/constants.js';
import { broadcast } from '../src/managers/utils/broadcast.js';
import { broadcastToRoomOnly } from '../src/managers/utils/broadcastToRoomOnly.js';
import { broadcastSystemMessage, broadcastRoomList, broadcastRoomUpdate } from '../src/managers/broadcastManager.js';

jest.mock('../src/managers/utils/broadcast.js');
jest.mock('../src/managers/utils/broadcastToRoomOnly.js');

describe('Broadcast Manager', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
    
  it('should call broadcastToRoomOnly with the system message and roomId', () => {
    const message = 'Test system message';
    const roomId = 'room123';

    broadcastSystemMessage(message, roomId);

    expect(broadcastToRoomOnly).toHaveBeenCalledWith(
      { type: DATA_TYPES.SYSTEM, message },
      roomId
    );
  });
  
  it('broadcastSystemMessage should maintain correct behavior when called multiple times in succession', () => {
    const messages = ['First message', 'Second message', 'Third message'];
    const roomId = 'room123';

    messages.forEach(message => {
      broadcastSystemMessage(message, roomId);
    });

    expect(broadcastToRoomOnly).toHaveBeenCalledTimes(3);
    messages.forEach((message, index) => {
      expect(broadcastToRoomOnly).toHaveBeenNthCalledWith(
        index + 1,
        { type: DATA_TYPES.SYSTEM, message },
        roomId
      );
    });
  });

  it('broadcastRoomList should broadcast room list with correct data structure', () => {
    const mockRooms = new Map([
      ['room1', { host: 'host1', players: ['player1', 'player2'], gameOn: true, activePlayer: 'player1' }],
      ['room2', { host: 'host2', players: ['player3'], gameOn: false, activePlayer: null }]
    ]);

    broadcastRoomList(mockRooms);

    expect(broadcast).toHaveBeenCalledWith({
      type: DATA_TYPES.ROOM_LIST_UPDATE,
      rooms: [
        { roomId: 'room1', host: 'host1', players: ['player1', 'player2'], gameOn: true, activePlayer: 'player1' },
        { roomId: 'room2', host: 'host2', players: ['player3'], gameOn: false, activePlayer: null }
      ]
    });
  });
  
  it('broadcastRoomList should include all required room properties in the broadcast', () => {
    const mockRooms = new Map([
      ['room1', { host: 'host1', players: ['player1', 'player2'], gameOn: true, activePlayer: 'player1' }],
      ['room2', { host: 'host2', players: ['player3'], gameOn: false, activePlayer: null }]
    ]);

    broadcastRoomList(mockRooms);

    expect(broadcast).toHaveBeenCalledWith({
      type: DATA_TYPES.ROOM_LIST_UPDATE,
      rooms: [
        { roomId: 'room1', host: 'host1', players: ['player1', 'player2'], gameOn: true, activePlayer: 'player1' },
        { roomId: 'room2', host: 'host2', players: ['player3'], gameOn: false, activePlayer: null }
      ]
    });

    const broadcastedRooms = broadcast.mock.calls[0][0].rooms;
    broadcastedRooms.forEach(room => {
      expect(room).toHaveProperty('roomId');
      expect(room).toHaveProperty('host');
      expect(room).toHaveProperty('players');
      expect(room).toHaveProperty('gameOn');
      expect(room).toHaveProperty('activePlayer');
    });
  });

  it('broadcastRoomUpdate should broadcast room update with correct data when room exists', () => {
    const roomId = 'room123';
    const mockRooms = new Map([
      [roomId, { players: ['player1', 'player2'], gameOn: true, activePlayer: 'player1' }]
    ]);

    broadcastRoomUpdate(roomId, mockRooms);

    expect(broadcast).toHaveBeenCalledWith({
      type: DATA_TYPES.ROOM_UPDATE,
      roomId: roomId,
      players: ['player1', 'player2'],
      gameOn: true,
      activePlayer: 'player1'
    });
  });

  it('broadcastRoomUpdate should not broadcast room update when room does not exist', () => {
    const roomId = 'nonexistentRoom';
    const mockRooms = new Map();

    broadcastRoomUpdate(roomId, mockRooms);

    expect(broadcast).not.toHaveBeenCalled();
  });
});

import {
  addUser,
  removeUser,
  getUser,
  updateUser,
  getConnectedUsers,
} from '../src/managers/userManager.js';

describe('UserManager', () => {
  let ws1, ws2;

  beforeEach(() => {
    ws1 = {};
    ws2 = {};
  });

  afterEach(() => {
    getConnectedUsers().clear();
  });

  test('addUser should add a user to the connectedUsers Map', () => {
    addUser(ws1);

    expect(getConnectedUsers().has(ws1)).toBe(true);
    expect(getConnectedUsers().get(ws1)).toEqual({
      username: null,
      id: null,
      roomId: null,
    });
  });

  test('removeUser should remove a user from the connectedUsers Map', () => {
    addUser(ws1);
    addUser(ws2);

    removeUser(ws1);

    expect(getConnectedUsers().has(ws1)).toBe(false);
    expect(getConnectedUsers().has(ws2)).toBe(true);
  });

  test('removeUser should do nothing if the user does not exist', () => {
    removeUser(ws2);

    expect(getConnectedUsers().has(ws2)).toBe(false);
  });

  test('updateUser should update the user data', () => {
    addUser(ws2);
    
    updateUser(ws2, { username: 'Alice', id: 'user1', roomId: 'room1' });

    expect(getConnectedUsers().get(ws2)).toEqual({
      username: 'Alice',
      id: 'user1',
      roomId: 'room1',
    });
  });

  test('updateUser should do nothing if the user does not exist', () => {
    updateUser(ws1);

    expect(getConnectedUsers().has(ws1)).toBe(false);
  });

  test('getUser should return the correct user data', () => {
    addUser(ws2);

    expect(getUser(ws2)).toEqual({
      username: null,
      id: null,
      roomId: null,
    });
  });

  test('getUser should return undefined if the user does not exist', () => {
    expect(getUser(ws2)).toBeUndefined();
  });

  test('getConnectedUsers should return the connectedUsers Map', () => {
    addUser(ws1);
    addUser(ws2);

    expect(getConnectedUsers().size).toBe(2);
    expect(getConnectedUsers().has(ws1)).toBe(true);
    expect(getConnectedUsers().has(ws2)).toBe(true);
  });
});

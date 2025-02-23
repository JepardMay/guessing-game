import { makeId } from './utils.js';

export const user = {
  name: '',
  id: makeId(8),
  isHost: false,
  isActive: false,
  roomId: null,
};

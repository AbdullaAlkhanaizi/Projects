import { createStore } from '../src/mini.js';
import { MAX_PLAYERS, normalizeRoutePath } from './constants.js';

export function createInitialGame() {
  return {
    seed: null,
    grid: [],
    players: [],
    bombs: [],
    flames: [],
    powerups: [],
    winner: null,
    over: false,
  };
}

export function createLobby(target = 2) {
  return {
    joined: 0,
    target,
    max: MAX_PLAYERS,
    names: [],
    joinDeadline: null,
    countdownEndsAt: null,
  };
}

export const store = createStore({
  route: normalizeRoutePath(window.location.pathname),
  phase: 'menu',
  gameMode: null,
  nickname: '',
  nicknameDraft: '',
  localPlayers: 2,
  lobby: createLobby(),
  game: createInitialGame(),
  chat: {
    connected: false,
    status: 'offline',
    messages: [],
  },
  chatDraft: '',
  fps: 0,
  now: 0,
});

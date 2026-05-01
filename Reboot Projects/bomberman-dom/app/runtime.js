import { MAX_PLAYERS } from './constants.js';

export const inputState = Array.from({ length: MAX_PLAYERS }, () => ({
  held: { up: false, down: false, left: false, right: false },
  dir: null,
  bombQueued: false,
  bombHeld: false,
}));

export const runtime = {
  rng: Math.random,
  bombCounter: 0,
  flameCounter: 0,
  powerupCounter: 0,
  gameSocket: null,
  localPlayerId: null,
};

export function resetInputState() {
  inputState.forEach((input) => {
    input.held.up = false;
    input.held.down = false;
    input.held.left = false;
    input.held.right = false;
    input.dir = null;
    input.bombQueued = false;
    input.bombHeld = false;
  });
}

export function resetRuntimeCounters() {
  runtime.bombCounter = 0;
  runtime.flameCounter = 0;
  runtime.powerupCounter = 0;
}

export function nextBombId() {
  return `b${runtime.bombCounter++}`;
}

export function nextFlameId() {
  return `f${runtime.flameCounter++}`;
}

export function nextPowerupId() {
  return `u${runtime.powerupCounter++}`;
}

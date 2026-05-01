import { KEY_BINDINGS } from './constants.js';
import { inputState } from './runtime.js';
import { store } from './store.js';

export function handleKey(event, isDown) {
  const target = event.target;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    return;
  }
  const state = store.getState();
  if (state.phase !== 'playing') return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const binding = KEY_BINDINGS[key];
  if (!binding) return;
  if (binding.prevent) event.preventDefault();
  const input = inputState[binding.player];
  if (!input) return;
  if (binding.action === 'bomb') {
    if (isDown && !input.bombHeld) {
      input.bombQueued = true;
      input.bombHeld = true;
    }
    if (!isDown) {
      input.bombHeld = false;
    }
    return;
  }
  input.held[binding.action] = isDown;
  if (isDown) {
    input.dir = binding.action;
  } else if (input.dir === binding.action) {
    const fallback = ['up', 'down', 'left', 'right'].find((dir) => input.held[dir]);
    input.dir = fallback || null;
  }
}

export const windowHandlers = {
  keydown: (event) => handleKey(event, true),
  keyup: (event) => handleKey(event, false),
};

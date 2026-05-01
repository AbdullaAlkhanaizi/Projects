export const GRID_COLS = 17;
export const GRID_ROWS = 15;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const BASE_SPEED = 4;
export const MAX_SPEED = 6;
export const BASE_FLAME_RANGE = 1;
export const STARTING_LIVES = 3;
export const BOMB_TIMER_MS = 2300;
export const FLAME_DURATION_MS = 600;
export const BLOCK_CHANCE_BASE = 0.32;
export const BLOCK_CHANCE_STEP = 0.06;
export const BLOCK_CHANCE_MAX = 0.48;
export const BOMB_POWERUP_GAIN = 1;
export const FLAME_POWERUP_GAIN = 1;
export const SPEED_POWERUP_GAIN = 0.5;
export const HEART_POWERUP_GAIN = 1;
export const JOIN_WAIT_MS = 20000;
export const COUNTDOWN_MS = 10000;

export const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'];
export const ROUTE_PHASES = {
  '/': 'menu',
  '/local/lobby': 'lobby',
  '/local/waiting': 'waiting',
  '/local/play': 'playing',
  '/local/game-over': 'gameover',
  '/online/lobby': 'lobby',
  '/online/waiting': 'waiting',
  '/online/play': 'playing',
  '/online/game-over': 'gameover',
};
export const KNOWN_ROUTES = new Set(Object.keys(ROUTE_PHASES));
export const DISALLOW_REFRESH_ROUTES = new Set([
  '/online/waiting',
  '/online/play',
  '/online/game-over',
  '/local/waiting',
  '/local/play',
  '/local/game-over',
]);
export const PLAYER_SPAWNS = [
  { x: 1, y: 1 },
  { x: GRID_COLS - 2, y: GRID_ROWS - 2 },
  { x: 1, y: GRID_ROWS - 2 },
  { x: GRID_COLS - 2, y: 1 },
];

export function normalizeRoutePath(pathname) {
  let path = pathname || '/';
  if (path === '/index.html') return '/';
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const EXPLOSION_DIRS = [
  DIRS.up,
  DIRS.down,
  DIRS.left,
  DIRS.right,
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
];

export const KEY_BINDINGS = {
  ArrowUp: { player: 0, action: 'up', prevent: true },
  ArrowDown: { player: 0, action: 'down', prevent: true },
  ArrowLeft: { player: 0, action: 'left', prevent: true },
  ArrowRight: { player: 0, action: 'right', prevent: true },
  ' ': { player: 0, action: 'bomb', prevent: true },
  w: { player: 1, action: 'up', prevent: true },
  s: { player: 1, action: 'down', prevent: true },
  a: { player: 1, action: 'left', prevent: true },
  d: { player: 1, action: 'right', prevent: true },
  e: { player: 1, action: 'bomb', prevent: true },
  i: { player: 2, action: 'up', prevent: true },
  k: { player: 2, action: 'down', prevent: true },
  j: { player: 2, action: 'left', prevent: true },
  l: { player: 2, action: 'right', prevent: true },
  o: { player: 2, action: 'bomb', prevent: true },
  t: { player: 3, action: 'up', prevent: true },
  g: { player: 3, action: 'down', prevent: true },
  f: { player: 3, action: 'left', prevent: true },
  h: { player: 3, action: 'right', prevent: true },
  r: { player: 3, action: 'bomb', prevent: true },
};

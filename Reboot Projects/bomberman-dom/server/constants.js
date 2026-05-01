const GRID_COLS = 17;
const GRID_ROWS = 15;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
const PORT = Number(process.env.PORT) || 8081;
const RECONNECT_TIMEOUT = 30000;
const JOIN_WAIT_MS = 20000;
const COUNTDOWN_MS = 10000;
const BLOCK_CHANCE_BASE = 0.32;
const BLOCK_CHANCE_STEP = 0.06;
const BLOCK_CHANCE_MAX = 0.48;
const BOMB_TIMER_MS = 2300;
const FLAME_DURATION_MS = 600;
const MAX_SPEED = 6;
const BOMB_POWERUP_GAIN = 1;
const FLAME_POWERUP_GAIN = 1;
const SPEED_POWERUP_GAIN = 0.5;
const HEART_POWERUP_GAIN = 1;

const SPA_ROUTES = new Set([
  '/',
  '/local/lobby',
  '/local/waiting',
  '/local/play',
  '/local/game-over',
  '/online/lobby',
  '/online/waiting',
  '/online/play',
  '/online/game-over',
]);

const LEGACY_REDIRECTS = {
  '/lobby': '/online/lobby',
  '/waiting': '/online/waiting',
  '/play': '/online/play',
  '/game-over': '/online/game-over',
};

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const PLAYER_SPAWNS = [
  { x: 1, y: 1 },
  { x: GRID_COLS - 2, y: GRID_ROWS - 2 },
  { x: 1, y: GRID_ROWS - 2 },
  { x: GRID_COLS - 2, y: 1 },
];

module.exports = {
  BOMB_POWERUP_GAIN,
  BOMB_TIMER_MS,
  BLOCK_CHANCE_BASE,
  BLOCK_CHANCE_MAX,
  BLOCK_CHANCE_STEP,
  COUNTDOWN_MS,
  FLAME_DURATION_MS,
  FLAME_POWERUP_GAIN,
  GRID_COLS,
  GRID_ROWS,
  HEART_POWERUP_GAIN,
  JOIN_WAIT_MS,
  LEGACY_REDIRECTS,
  MAX_PLAYERS,
  MAX_SPEED,
  MIME_TYPES,
  MIN_PLAYERS,
  PLAYER_SPAWNS,
  PORT,
  RECONNECT_TIMEOUT,
  SPA_ROUTES,
  SPEED_POWERUP_GAIN,
};

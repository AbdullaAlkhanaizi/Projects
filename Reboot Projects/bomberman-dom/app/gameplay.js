import {
  BASE_FLAME_RANGE,
  BASE_SPEED,
  BLOCK_CHANCE_BASE,
  BLOCK_CHANCE_MAX,
  BLOCK_CHANCE_STEP,
  BOMB_POWERUP_GAIN,
  BOMB_TIMER_MS,
  COUNTDOWN_MS,
  EXPLOSION_DIRS,
  FLAME_DURATION_MS,
  FLAME_POWERUP_GAIN,
  GRID_COLS,
  GRID_ROWS,
  HEART_POWERUP_GAIN,
  MAX_PLAYERS,
  MAX_SPEED,
  MIN_PLAYERS,
  PLAYER_COLORS,
  PLAYER_SPAWNS,
  SPEED_POWERUP_GAIN,
  STARTING_LIVES,
  DIRS,
} from './constants.js';
import {
  runtime,
  inputState,
  nextBombId,
  nextFlameId,
  nextPowerupId,
  resetInputState,
  resetRuntimeCounters,
} from './runtime.js';
import { store } from './store.js';

export function createRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomChoice(list) {
  return list[Math.floor(runtime.rng() * list.length)];
}

function blockChanceForPlayers(count) {
  const clamped = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, count));
  const chance = BLOCK_CHANCE_BASE + (clamped - MIN_PLAYERS) * BLOCK_CHANCE_STEP;
  return Math.min(BLOCK_CHANCE_MAX, chance);
}

export function generateGrid(playerCount) {
  const blockChance = blockChanceForPlayers(playerCount);
  const grid = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => 'floor')
  );
  const safe = new Set();

  PLAYER_SPAWNS.forEach((spawn) => {
    const dx = spawn.x < GRID_COLS / 2 ? 1 : -1;
    const dy = spawn.y < GRID_ROWS / 2 ? 1 : -1;
    safe.add(`${spawn.x},${spawn.y}`);
    safe.add(`${spawn.x + dx},${spawn.y}`);
    safe.add(`${spawn.x},${spawn.y + dy}`);
  });

  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      const border = x === 0 || y === 0 || x === GRID_COLS - 1 || y === GRID_ROWS - 1;
      const pillar = x % 2 === 0 && y % 2 === 0;
      if (border || pillar) {
        grid[y][x] = 'wall';
        continue;
      }
      const key = `${x},${y}`;
      if (safe.has(key)) {
        grid[y][x] = 'floor';
        continue;
      }
      grid[y][x] = runtime.rng() < blockChance ? 'block' : 'floor';
    }
  }

  return grid;
}

function createPlayers(count, names) {
  return Array.from({ length: count }, (_, index) => {
    const spawn = PLAYER_SPAWNS[index];
    const name = names[index] || `Player ${index + 1}`;
    return {
      id: `p${index + 1}`,
      name,
      color: PLAYER_COLORS[index],
      gridX: spawn.x,
      gridY: spawn.y,
      x: spawn.x,
      y: spawn.y,
      startX: spawn.x,
      startY: spawn.y,
      targetX: spawn.x,
      targetY: spawn.y,
      moving: false,
      moveProgress: 0,
      moveDuration: 0,
      speed: BASE_SPEED,
      bombsMax: 1,
      bombsActive: 0,
      flameRange: BASE_FLAME_RANGE,
      lives: STARTING_LIVES,
      alive: true,
      invulnerableUntil: 0,
      controlIndex: index,
    };
  });
}

export function isInside(x, y) {
  return x >= 0 && y >= 0 && x < GRID_COLS && y < GRID_ROWS;
}

function isHardCell(cell) {
  return cell === 'wall';
}

function findBomb(game, x, y) {
  return game.bombs.find((bomb) => bomb.x === x && bomb.y === y) || null;
}

function isCellBlocked(game, x, y, playerId) {
  if (!isInside(x, y)) return true;
  const cell = game.grid[y][x];
  if (cell === 'wall' || cell === 'block') return true;
  const bomb = findBomb(game, x, y);
  if (!bomb) return false;
  if (bomb.passIds && bomb.passIds.includes(playerId)) return false;
  return true;
}

function updateBombPass(game) {
  game.bombs.forEach((bomb) => {
    if (!bomb.passIds || bomb.passIds.length === 0) return;
    const stillOn = bomb.passIds.some((id) => {
      const player = game.players.find((entry) => entry.id === id);
      return player && player.gridX === bomb.x && player.gridY === bomb.y;
    });
    if (!stillOn) {
      bomb.passIds = [];
    }
  });
}

function placeBomb(game, player, now) {
  if (player.bombsActive >= player.bombsMax) return;
  if (player.moving) return;
  const existing = findBomb(game, player.gridX, player.gridY);
  if (existing) return;

  const state = store.getState();
  const isOnline = state.gameMode === 'online';

  if (isOnline && player.id === runtime.localPlayerId && runtime.gameSocket) {
    runtime.gameSocket.send(
      JSON.stringify({
        type: 'placeBomb',
        x: player.gridX,
        y: player.gridY,
      })
    );
    return;
  }

  const bomb = {
    id: nextBombId(),
    x: player.gridX,
    y: player.gridY,
    ownerId: player.id,
    range: player.flameRange,
    placedAt: now,
    explodeAt: now + BOMB_TIMER_MS,
    passIds: [player.id],
  };
  game.bombs.push(bomb);
  player.bombsActive += 1;
}

export function beginPlayerMove(player, startX, startY, targetX, targetY) {
  player.moving = true;
  player.startX = startX;
  player.startY = startY;
  player.targetX = targetX;
  player.targetY = targetY;
  player.moveProgress = 0;
  player.moveDuration = 1 / player.speed;
  player.x = startX;
  player.y = startY;
}

function updatePlayerMovement(game, player, dt, now) {
  const input = inputState[player.controlIndex];
  if (input && input.bombQueued) {
    placeBomb(game, player, now);
    input.bombQueued = false;
  }
  if (player.moving) {
    player.moveProgress += dt / player.moveDuration;
    if (player.moveProgress >= 1) {
      player.gridX = player.targetX;
      player.gridY = player.targetY;
      player.x = player.targetX;
      player.y = player.targetY;
      player.moving = false;
      player.moveProgress = 0;

      const state = store.getState();
      const isOnline = state.gameMode === 'online';

      if (isOnline && player.id === runtime.localPlayerId && runtime.gameSocket) {
        runtime.gameSocket.send(
          JSON.stringify({
            type: 'playerMove',
            x: player.x,
            y: player.y,
            gridX: player.gridX,
            gridY: player.gridY,
          })
        );
      }
    } else {
      const progress = player.moveProgress;
      player.x = player.startX + (player.targetX - player.startX) * progress;
      player.y = player.startY + (player.targetY - player.startY) * progress;
    }
    return;
  }
  if (!input || !input.dir) return;
  const dir = DIRS[input.dir];
  const nextX = player.gridX + dir.x;
  const nextY = player.gridY + dir.y;
  if (isCellBlocked(game, nextX, nextY, player.id)) return;
  beginPlayerMove(player, player.gridX, player.gridY, nextX, nextY);
}

function spawnPowerup(game, x, y) {
  if (runtime.rng() > 0.35) return;
  const type = randomChoice(['bombs', 'flames', 'speed', 'heart']);
  game.powerups.push({
    id: nextPowerupId(),
    x,
    y,
    type,
  });
}

function applyPowerup(player, powerup) {
  if (powerup.type === 'bombs') {
    player.bombsMax += BOMB_POWERUP_GAIN;
    return;
  }
  if (powerup.type === 'flames') {
    player.flameRange += FLAME_POWERUP_GAIN;
    return;
  }
  if (powerup.type === 'speed') {
    player.speed = Math.min(MAX_SPEED, player.speed + SPEED_POWERUP_GAIN);
    return;
  }
  if (powerup.type === 'heart') {
    player.lives += HEART_POWERUP_GAIN;
  }
}

function hitPlayer(player, now) {
  if (!player.alive) return;
  if (now < player.invulnerableUntil) return;
  player.lives -= 1;
  player.invulnerableUntil = now + 900;
  if (player.lives <= 0) {
    player.alive = false;
  }
}

function computeExplosion(game, originX, originY, range) {
  const tiles = [{ x: originX, y: originY }];
  EXPLOSION_DIRS.forEach((dir) => {
    for (let i = 1; i <= range; i += 1) {
      const x = originX + dir.x * i;
      const y = originY + dir.y * i;
      if (!isInside(x, y)) break;
      const isDiagonal = dir.x !== 0 && dir.y !== 0;
      if (isDiagonal) {
        const sideA = game.grid[y][x - dir.x];
        const sideB = game.grid[y - dir.y][x];
        if (isHardCell(sideA) || isHardCell(sideB)) break;
      }
      const cell = game.grid[y][x];
      if (cell === 'wall') break;
      tiles.push({ x, y });
      if (cell === 'block') break;
    }
  });
  return tiles;
}

function explodeBomb(game, bomb, now) {
  const tiles = computeExplosion(game, bomb.x, bomb.y, bomb.range);
  tiles.forEach((tile) => {
    game.flames.push({
      id: nextFlameId(),
      x: tile.x,
      y: tile.y,
      expiresAt: now + FLAME_DURATION_MS,
    });
  });

  tiles.forEach((tile) => {
    const cell = game.grid[tile.y][tile.x];
    if (cell === 'block') {
      game.grid[tile.y][tile.x] = 'floor';
      spawnPowerup(game, tile.x, tile.y);
    }
    const chainBomb = findBomb(game, tile.x, tile.y);
    if (chainBomb && chainBomb.id !== bomb.id) {
      chainBomb.explodeAt = Math.min(chainBomb.explodeAt, now);
    }
  });

  game.players.forEach((player) => {
    if (!player.alive) return;
    const hit = tiles.some((tile) => tile.x === player.gridX && tile.y === player.gridY);
    if (hit) hitPlayer(player, now);
  });

  const owner = game.players.find((player) => player.id === bomb.ownerId);
  if (owner) {
    owner.bombsActive = Math.max(0, owner.bombsActive - 1);
  }
}

function updateBombs(game, now) {
  let loop = true;
  while (loop) {
    loop = false;
    const remaining = [];
    for (const bomb of game.bombs) {
      if (bomb.explodeAt <= now) {
        explodeBomb(game, bomb, now);
        loop = true;
      } else {
        remaining.push(bomb);
      }
    }
    game.bombs = remaining;
  }
}

function updateFlames(game, now) {
  game.flames = game.flames.filter((flame) => flame.expiresAt > now);
}

function updatePowerups(game) {
  game.players.forEach((player) => {
    if (!player.alive) return;
    const index = game.powerups.findIndex(
      (powerup) => powerup.x === player.gridX && powerup.y === player.gridY
    );
    if (index === -1) return;
    const powerup = game.powerups[index];
    applyPowerup(player, powerup);
    game.powerups.splice(index, 1);
  });
}

function updateFlameDamage(game, now) {
  game.players.forEach((player) => {
    if (!player.alive) return;
    if (now < player.invulnerableUntil) return;
    const hit = game.flames.some(
      (flame) => flame.x === player.gridX && flame.y === player.gridY
    );
    if (hit) hitPlayer(player, now);
  });
}

function checkWinner(game) {
  const alive = game.players.filter((player) => player.alive);
  if (alive.length <= 1) {
    game.over = true;
    game.winner = alive[0] || null;
    store.setState({ phase: 'gameover', game });

    const state = store.getState();
    if (state.gameMode === 'online' && runtime.gameSocket) {
      try {
        runtime.gameSocket.send(
          JSON.stringify({
            type: 'gameOver',
            winnerId: game.winner ? game.winner.id : null,
          })
        );
      } catch {
        // ignore
      }
    }

    sessionStorage.removeItem('bomberman_playerId');
    sessionStorage.removeItem('bomberman_nickname');
    runtime.localPlayerId = null;
    if (runtime.gameSocket) {
      runtime.gameSocket.close();
      runtime.gameSocket = null;
    }

    if (window.router) {
      const isOnline = store.getState().gameMode === 'online';
      window.router.navigate(isOnline ? '/online/game-over' : '/local/game-over');
    }
  }
}

export function updateGame(state, dt, now) {
  const game = state.game;
  if (game.over) return;
  game.players.forEach((player) => {
    if (!player.alive) return;
    updatePlayerMovement(game, player, dt, now);
  });
  updateBombPass(game);
  updateBombs(game, now);
  updateFlames(game, now);
  if (state.gameMode !== 'online') {
    updatePowerups(game);
  }
  updateFlameDamage(game, now);
  checkWinner(game);
}

function startCountdown() {
  const state = store.getState();
  const lobby = state.lobby;
  if (lobby.countdownEndsAt) return;
  lobby.countdownEndsAt = state.now + COUNTDOWN_MS;
  store.setState({ phase: 'countdown', lobby });
}

export function updateLobby(state, now) {
  const lobby = state.lobby;
  if (!lobby.joinDeadline) return;
  if (state.phase === 'waiting') {
    if (lobby.joined === MAX_PLAYERS) {
      startCountdown();
    } else if (lobby.joined >= MIN_PLAYERS && now >= lobby.joinDeadline) {
      startCountdown();
    }
  }
  if (state.phase === 'countdown' && lobby.countdownEndsAt && now >= lobby.countdownEndsAt) {
    startMatch();
  }
}

export function startMatch() {
  const state = store.getState();
  const lobby = state.lobby;
  const count = Math.max(MIN_PLAYERS, lobby.joined || state.localPlayers);
  const seed = Math.floor(Math.random() * 0xffffffff);
  runtime.rng = createRng(seed);

  const game = state.game;
  game.seed = seed;
  game.grid = generateGrid(count);
  game.players = createPlayers(count, lobby.names);
  game.bombs = [];
  game.flames = [];
  game.powerups = [];
  game.winner = null;
  game.over = false;
  resetRuntimeCounters();
  resetInputState();
  store.setState({ phase: 'playing', game });

  if (window.router) {
    window.router.navigate('/local/play');
  }
}

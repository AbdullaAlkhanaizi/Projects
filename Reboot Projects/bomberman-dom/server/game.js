const crypto = require('crypto');
const {
  BOMB_POWERUP_GAIN,
  BOMB_TIMER_MS,
  BLOCK_CHANCE_BASE,
  BLOCK_CHANCE_MAX,
  BLOCK_CHANCE_STEP,
  COUNTDOWN_MS,
  HEART_POWERUP_GAIN,
  JOIN_WAIT_MS,
  MAX_PLAYERS,
  MAX_SPEED,
  MIN_PLAYERS,
  PLAYER_SPAWNS,
  RECONNECT_TIMEOUT,
  SPEED_POWERUP_GAIN,
  FLAME_POWERUP_GAIN,
  GRID_COLS,
  GRID_ROWS,
} = require('./constants');
const { clients, disconnectedPlayers, gameState, resetGameState } = require('./state');

let rng = Math.random;

function createRng(seed) {
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
  return list[Math.floor(rng() * list.length)];
}

function blockChanceForPlayers(count) {
  const clamped = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, count));
  const chance = BLOCK_CHANCE_BASE + (clamped - MIN_PLAYERS) * BLOCK_CHANCE_STEP;
  return Math.min(BLOCK_CHANCE_MAX, chance);
}

function generateGrid(playerCount) {
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
      grid[y][x] = rng() < blockChance ? 'block' : 'floor';
    }
  }

  return grid;
}

function generateSeed() {
  return Math.floor(Math.random() * 0xffffffff);
}

function isInside(x, y) {
  return x >= 0 && y >= 0 && x < GRID_COLS && y < GRID_ROWS;
}

function spawnPowerup(x, y) {
  if (rng() > 0.35) return null;
  const type = randomChoice(['bombs', 'flames', 'speed', 'heart']);
  return {
    id: crypto.randomBytes(4).toString('hex'),
    x,
    y,
    type,
  };
}

function createGameHandlers({ broadcast, sendToSocket }) {
  function broadcastLobbyState(extra = {}) {
    broadcast({
      type: 'lobbyState',
      lobby: {
        players: gameState.lobby.players.map((player) => ({
          id: player.id,
          nickname: player.nickname,
        })),
        joinDeadline: gameState.lobby.joinDeadline,
        countdownStart: gameState.lobby.countdownStart,
      },
      ...extra,
    });
  }

  function cancelLobbyTimers(reason = '') {
    if (gameState.lobby.joinTimeout) {
      clearTimeout(gameState.lobby.joinTimeout);
      gameState.lobby.joinTimeout = null;
    }
    if (gameState.lobby.countdownTimeout) {
      clearTimeout(gameState.lobby.countdownTimeout);
      gameState.lobby.countdownTimeout = null;
    }

    gameState.lobby.joinDeadline = null;
    gameState.lobby.countdownStart = null;

    broadcast({ type: 'lobbyTimer', joinDeadline: null });
    broadcast({ type: 'countdown', countdownStart: null, reason });
    broadcastLobbyState();
  }

  function handleGameOver(socket, payload) {
    if (gameState.phase !== 'playing') return;

    const clientData = clients.get(socket);
    if (!clientData) return;

    console.log(`Game over requested by ${clientData.nickname}`);
    broadcast({
      type: 'gameEnded',
      winnerId: payload?.winnerId || null,
    });

    resetGameState();
  }

  function handlePlayerReconnect(socket, payload) {
    const playerId = payload.playerId;

    let playerData = null;
    const disconnectedData = disconnectedPlayers.get(playerId);

    if (disconnectedData) {
      if (disconnectedData.timeout) {
        clearTimeout(disconnectedData.timeout);
      }
      playerData = disconnectedData.playerData;
      disconnectedPlayers.delete(playerId);
    } else {
      for (const [existingSocket, existingClient] of clients.entries()) {
        if (existingClient.id !== playerId) continue;
        playerData = existingClient;
        clients.delete(existingSocket);
        if (gameState.phase === 'lobby') {
          const lobbyPlayer = gameState.lobby.players.find((player) => player.id === playerId);
          if (lobbyPlayer) {
            lobbyPlayer.socket = socket;
          }
        }
        try {
          if (existingSocket !== socket) {
            existingSocket.destroy();
          }
        } catch (err) {
          console.error('Socket replacement error:', err);
        }
        break;
      }
    }

    if (!playerData) {
      sendToSocket(socket, { type: 'error', message: 'No active session found' });
      return;
    }

    playerData.socket = socket;
    clients.set(socket, playerData);

    console.log(`Player ${playerData.nickname} reconnected`);

    if (gameState.phase === 'lobby' || gameState.phase === 'waiting') {
      sendToSocket(socket, {
        type: 'lobbyJoined',
        playerId: playerData.id,
        lobby: {
          players: gameState.lobby.players.map((player) => ({
            id: player.id,
            nickname: player.nickname,
          })),
          joinDeadline: gameState.lobby.joinDeadline,
          countdownStart: gameState.lobby.countdownStart,
        },
      });
    } else if (gameState.phase === 'playing') {
      sendToSocket(socket, {
        type: 'gameReconnected',
        playerId: playerData.id,
        seed: gameState.game.seed,
        grid: gameState.game.grid,
        players: gameState.game.players.map((player) => ({
          id: player.id,
          nickname: player.nickname,
          x: player.x,
          y: player.y,
          gridX: player.gridX,
          gridY: player.gridY,
          lives: player.lives,
          alive: player.alive,
          speed: player.speed,
          bombsMax: player.bombsMax,
          flameRange: player.flameRange,
        })),
        powerups: gameState.game.powerups,
        bombs: gameState.game.bombs.map((bomb) => ({
          id: bomb.id,
          x: bomb.x,
          y: bomb.y,
          ownerId: bomb.ownerId,
          range: bomb.range,
          placedAt: bomb.placedAt,
        })),
      });
    }

    broadcast(
      {
        type: 'playerReconnected',
        playerId: playerData.id,
        nickname: playerData.nickname,
      },
      socket
    );
  }

  function startGame() {
    gameState.phase = 'playing';
    gameState.game.seed = generateSeed();
    gameState.game.startedAt = Date.now();

    rng = createRng(gameState.game.seed);
    gameState.game.grid = generateGrid(gameState.lobby.players.length);
    gameState.game.powerups = [];
    gameState.game.bombs = [];
    gameState.game.flames = [];

    gameState.game.players = gameState.lobby.players.map((lobbyPlayer, index) => ({
      id: lobbyPlayer.id,
      nickname: lobbyPlayer.nickname,
      x: PLAYER_SPAWNS[index].x,
      y: PLAYER_SPAWNS[index].y,
      gridX: PLAYER_SPAWNS[index].x,
      gridY: PLAYER_SPAWNS[index].y,
      lives: 3,
      alive: true,
      speed: 4,
      bombsMax: 1,
      bombsActive: 0,
      flameRange: 1,
    }));

    broadcast({
      type: 'gameStart',
      seed: gameState.game.seed,
      grid: gameState.game.grid,
      players: gameState.game.players.map((player) => ({
        id: player.id,
        nickname: player.nickname,
        x: player.x,
        y: player.y,
        gridX: player.gridX,
        gridY: player.gridY,
        lives: player.lives,
        alive: player.alive,
        speed: player.speed,
        bombsMax: player.bombsMax,
        flameRange: player.flameRange,
      })),
    });
  }

  function startCountdown() {
    if (gameState.lobby.players.length < MIN_PLAYERS) {
      cancelLobbyTimers('not-enough-players');
      return;
    }

    gameState.lobby.countdownStart = Date.now() + COUNTDOWN_MS;

    broadcast({
      type: 'countdown',
      countdownStart: gameState.lobby.countdownStart,
    });

    if (gameState.lobby.countdownTimeout) {
      clearTimeout(gameState.lobby.countdownTimeout);
    }
    gameState.lobby.countdownTimeout = setTimeout(() => {
      if (gameState.phase === 'lobby' && gameState.lobby.players.length >= MIN_PLAYERS) {
        startGame();
      }
    }, COUNTDOWN_MS);
  }

  function handlePlayerJoin(socket, payload) {
    if (gameState.phase !== 'lobby') {
      sendToSocket(socket, { type: 'error', message: 'Game already started' });
      return;
    }

    if (gameState.lobby.players.length >= MAX_PLAYERS) {
      sendToSocket(socket, { type: 'error', message: 'Lobby is full' });
      return;
    }

    const playerId = crypto.randomBytes(8).toString('hex');
    const nickname = payload.name || `Player${gameState.lobby.players.length + 1}`;
    const playerData = {
      id: playerId,
      nickname,
      socket,
      joinedAt: Date.now(),
    };

    clients.set(socket, playerData);
    gameState.lobby.players.push(playerData);

    sendToSocket(socket, {
      type: 'lobbyJoined',
      playerId,
      lobby: {
        players: gameState.lobby.players.map((player) => ({
          id: player.id,
          nickname: player.nickname,
        })),
        joinDeadline: gameState.lobby.joinDeadline,
        countdownStart: gameState.lobby.countdownStart,
      },
    });

    broadcast(
      {
        type: 'playerJoined',
        player: { id: playerId, nickname },
        lobby: {
          players: gameState.lobby.players.map((player) => ({
            id: player.id,
            nickname: player.nickname,
          })),
          joinDeadline: gameState.lobby.joinDeadline,
          countdownStart: gameState.lobby.countdownStart,
        },
      },
      socket
    );

    if (gameState.lobby.players.length >= MIN_PLAYERS && !gameState.lobby.joinDeadline) {
      gameState.lobby.joinDeadline = Date.now() + JOIN_WAIT_MS;
      broadcast({
        type: 'lobbyTimer',
        joinDeadline: gameState.lobby.joinDeadline,
      });

      if (gameState.lobby.joinTimeout) {
        clearTimeout(gameState.lobby.joinTimeout);
      }
      gameState.lobby.joinTimeout = setTimeout(() => {
        if (gameState.phase === 'lobby' && gameState.lobby.players.length >= MIN_PLAYERS) {
          startCountdown();
        }
      }, JOIN_WAIT_MS);
    }

    if (gameState.lobby.players.length === MAX_PLAYERS && !gameState.lobby.countdownStart) {
      if (gameState.lobby.joinTimeout) {
        clearTimeout(gameState.lobby.joinTimeout);
        gameState.lobby.joinTimeout = null;
      }
      startCountdown();
    }
  }

  function handlePlayerMove(socket, payload) {
    if (gameState.phase !== 'playing') return;

    const clientData = clients.get(socket);
    if (!clientData) return;

    const player = gameState.game.players.find((entry) => entry.id === clientData.id);
    if (!player || !player.alive) return;

    player.x = payload.x;
    player.y = payload.y;
    player.gridX = payload.gridX;
    player.gridY = payload.gridY;

    const powerupIndex = gameState.game.powerups.findIndex(
      (powerup) => powerup.x === player.gridX && powerup.y === player.gridY
    );

    if (powerupIndex !== -1) {
      const picked = gameState.game.powerups[powerupIndex];
      gameState.game.powerups.splice(powerupIndex, 1);

      if (picked.type === 'bombs') {
        player.bombsMax += BOMB_POWERUP_GAIN;
      } else if (picked.type === 'flames') {
        player.flameRange += FLAME_POWERUP_GAIN;
      } else if (picked.type === 'speed') {
        player.speed = Math.min(MAX_SPEED, player.speed + SPEED_POWERUP_GAIN);
      } else if (picked.type === 'heart') {
        player.lives += HEART_POWERUP_GAIN;
      }

      broadcast({
        type: 'powerupPicked',
        playerId: player.id,
        powerupId: picked.id,
        powerupType: picked.type,
        bombsMax: player.bombsMax,
        flameRange: player.flameRange,
        speed: player.speed,
        lives: player.lives,
      });
    }

    broadcast({
      type: 'playerMoved',
      playerId: player.id,
      x: player.x,
      y: player.y,
      gridX: player.gridX,
      gridY: player.gridY,
    });
  }

  function explodeBomb(bombId) {
    const bombIndex = gameState.game.bombs.findIndex((bomb) => bomb.id === bombId);
    if (bombIndex === -1) return;

    const bomb = gameState.game.bombs[bombIndex];
    gameState.game.bombs.splice(bombIndex, 1);

    const player = gameState.game.players.find((entry) => entry.id === bomb.ownerId);
    if (player) {
      player.bombsActive = Math.max(0, player.bombsActive - 1);
    }

    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    const destroyedBlocks = [];
    const newPowerups = [];

    directions.forEach((dir) => {
      for (let index = 1; index <= bomb.range; index += 1) {
        const x = bomb.x + dir.x * index;
        const y = bomb.y + dir.y * index;

        if (!isInside(x, y)) break;

        const cell = gameState.game.grid[y][x];
        if (cell === 'wall') break;

        if (cell === 'block') {
          gameState.game.grid[y][x] = 'floor';
          destroyedBlocks.push({ x, y });

          const powerup = spawnPowerup(x, y);
          if (powerup) {
            gameState.game.powerups.push(powerup);
            newPowerups.push(powerup);
          }
          break;
        }
      }
    });

    broadcast({
      type: 'bombExploded',
      bombId: bomb.id,
      x: bomb.x,
      y: bomb.y,
      range: bomb.range,
      destroyedBlocks,
      newPowerups,
    });
  }

  function handlePlaceBomb(socket, payload) {
    if (gameState.phase !== 'playing') return;

    const clientData = clients.get(socket);
    if (!clientData) return;

    const player = gameState.game.players.find((entry) => entry.id === clientData.id);
    if (!player || !player.alive) return;
    if (player.bombsActive >= player.bombsMax) return;

    const bombId = crypto.randomBytes(8).toString('hex');
    const bomb = {
      id: bombId,
      x: payload.x,
      y: payload.y,
      ownerId: player.id,
      range: player.flameRange,
      placedAt: Date.now(),
    };

    gameState.game.bombs.push(bomb);
    player.bombsActive += 1;

    broadcast({
      type: 'bombPlaced',
      bomb: {
        id: bomb.id,
        x: bomb.x,
        y: bomb.y,
        ownerId: bomb.ownerId,
        range: bomb.range,
        placedAt: bomb.placedAt,
      },
    });

    setTimeout(() => {
      explodeBomb(bombId);
    }, BOMB_TIMER_MS);
  }

  function handleDisconnect(socket) {
    const clientData = clients.get(socket);
    if (!clientData) return;

    clients.delete(socket);
    console.log(`Player ${clientData.nickname} disconnected`);

    if (gameState.phase === 'lobby') {
      gameState.lobby.players = gameState.lobby.players.filter((player) => player.socket !== socket);
      broadcast({
        type: 'playerLeft',
        playerId: clientData.id,
        lobby: {
          players: gameState.lobby.players.map((player) => ({
            id: player.id,
            nickname: player.nickname,
          })),
          joinDeadline: gameState.lobby.joinDeadline,
          countdownStart: gameState.lobby.countdownStart,
        },
      });

      if (gameState.lobby.players.length < MIN_PLAYERS) {
        cancelLobbyTimers('not-enough-players');
      }
      return;
    }

    if (gameState.phase === 'playing' || gameState.phase === 'countdown') {
      disconnectedPlayers.set(clientData.id, {
        playerData: clientData,
        disconnectedAt: Date.now(),
        timeout: setTimeout(() => {
          disconnectedPlayers.delete(clientData.id);
          console.log(`Player ${clientData.nickname} timed out`);
          broadcast({
            type: 'playerTimedOut',
            playerId: clientData.id,
          });
        }, RECONNECT_TIMEOUT),
      });

      broadcast({
        type: 'playerDisconnected',
        playerId: clientData.id,
        nickname: clientData.nickname,
      });
    }
  }

  function handleMessage(socket, raw) {
    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      payload = { type: 'chat', name: socket.nickname || 'guest', text: raw };
    }

    const clientData = clients.get(socket);

    switch (payload.type) {
      case 'playerJoin':
        handlePlayerJoin(socket, payload);
        break;
      case 'playerReconnect':
        handlePlayerReconnect(socket, payload);
        break;
      case 'chat':
        broadcast({
          type: 'chat',
          name: clientData?.nickname || 'guest',
          text: payload.text || '',
        });
        break;
      case 'playerMove':
        handlePlayerMove(socket, payload);
        break;
      case 'placeBomb':
        handlePlaceBomb(socket, payload);
        break;
      case 'gameOver':
        handleGameOver(socket, payload);
        break;
      default:
        break;
    }
  }

  return {
    handleDisconnect,
    handleMessage,
  };
}

module.exports = {
  createGameHandlers,
};

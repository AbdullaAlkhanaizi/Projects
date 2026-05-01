import { createSocket } from '../src/mini.js';
import { BOMB_TIMER_MS, DIRS, FLAME_DURATION_MS, PLAYER_COLORS } from './constants.js';
import { store } from './store.js';
import { runtime, nextFlameId, resetInputState, resetRuntimeCounters } from './runtime.js';
import { appendMessage } from './chat.js';
import { beginPlayerMove, createRng, generateGrid, isInside } from './gameplay.js';

export function disconnectGameSocket() {
  if (runtime.gameSocket) {
    runtime.gameSocket.close();
    runtime.gameSocket = null;
  }
}

export function connectToServer(nickname) {
  if (runtime.gameSocket) return;
  const host = window.location.hostname || 'localhost';
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${protocol}://${host}:8081`;

  const storedPlayerId = sessionStorage.getItem('bomberman_playerId');
  const storedNickname = sessionStorage.getItem('bomberman_nickname');

  runtime.gameSocket = createSocket(url, {
    open: () => {
      console.log('Connected to game server');

      if (storedPlayerId && storedNickname) {
        console.log('Attempting to reconnect...');
        runtime.gameSocket.send(
          JSON.stringify({
            type: 'playerReconnect',
            playerId: storedPlayerId,
            name: storedNickname,
          })
        );
      } else {
        runtime.gameSocket.send(JSON.stringify({ type: 'playerJoin', name: nickname }));
      }
    },
    message: (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (err) {
        console.error('Message parse error:', err);
      }
    },
    close: () => {
      console.log('Disconnected from server');
      runtime.gameSocket = null;
    },
    error: (err) => {
      console.error('WebSocket error:', err);
    },
  });
}

function handleServerMessage(data) {
  const state = store.getState();

  switch (data.type) {
    case 'lobbyJoined':
      runtime.localPlayerId = data.playerId;
      sessionStorage.setItem('bomberman_playerId', runtime.localPlayerId);
      {
        const existingNickname = sessionStorage.getItem('bomberman_nickname');
        const safeNickname =
          state.nickname || state.nicknameDraft?.trim() || existingNickname || 'Player 1';
        sessionStorage.setItem('bomberman_nickname', safeNickname);
        if (!state.nickname) {
          store.setState({ nickname: safeNickname });
        }
      }
      updateLobbyFromServer(data.lobby);
      break;

    case 'gameReconnected':
      runtime.localPlayerId = data.playerId;
      appendMessage({ type: 'system', text: 'Reconnected to game!' });
      startMultiplayerGame(data, true);
      break;

    case 'playerJoined':
      updateLobbyFromServer(data.lobby);
      appendMessage({ type: 'system', text: `${data.player.nickname} joined` });
      break;

    case 'playerReconnected':
      appendMessage({ type: 'system', text: `${data.nickname} reconnected` });
      break;

    case 'playerLeft':
      updateLobbyFromServer(data.lobby);
      break;

    case 'lobbyState':
      if (data.lobby) {
        updateLobbyFromServer(data.lobby);
      }
      break;

    case 'lobbyTimer': {
      const lobby = state.lobby;
      lobby.joinDeadline = data.joinDeadline;
      store.setState({ lobby });
      break;
    }

    case 'countdown':
      if (data.countdownStart == null) {
        store.setState({
          phase: 'waiting',
          lobby: { ...state.lobby, countdownEndsAt: null },
        });
      } else {
        store.setState({
          phase: 'countdown',
          lobby: { ...state.lobby, countdownEndsAt: data.countdownStart },
        });
      }
      break;

    case 'gameStart':
      startMultiplayerGame(data);
      break;

    case 'playerMoved':
      updatePlayerPosition(data);
      break;

    case 'bombPlaced':
      addBombFromServer(data.bomb);
      break;

    case 'bombExploded':
      handleBombExplosion(data);
      break;

    case 'powerupPicked': {
      const game = store.getState().game;
      const player = game.players.find((entry) => entry.id === data.playerId);
      if (player) {
        if (typeof data.bombsMax === 'number') player.bombsMax = data.bombsMax;
        if (typeof data.flameRange === 'number') player.flameRange = data.flameRange;
        if (typeof data.speed === 'number') player.speed = data.speed;
        if (typeof data.lives === 'number') player.lives = data.lives;
      }

      if (data.powerupId) {
        game.powerups = game.powerups.filter((powerup) => powerup.id !== data.powerupId);
      } else if (player) {
        game.powerups = game.powerups.filter(
          (powerup) => !(powerup.x === player.gridX && powerup.y === player.gridY)
        );
      }

      store.setState({ game });
      break;
    }

    case 'chat':
      appendMessage({ type: 'chat', name: data.name, text: data.text });
      break;

    case 'playerDisconnected':
      appendMessage({ type: 'system', text: `${data.nickname} disconnected` });
      break;

    case 'playerTimedOut':
      appendMessage({ type: 'system', text: 'A player timed out' });
      break;

    case 'error':
      console.error('Server error:', data.message);
      if (data.message === 'No active session found') {
        sessionStorage.removeItem('bomberman_playerId');
        sessionStorage.removeItem('bomberman_nickname');
        runtime.localPlayerId = null;
        disconnectGameSocket();
        store.setState({
          phase: 'menu',
          gameMode: null,
          nickname: '',
          nicknameDraft: '',
        });
        if (window.router) {
          window.router.navigate('/');
        }
      }
      break;

    default:
      break;
  }
}

export function updateLobbyFromServer(lobbyData) {
  const state = store.getState();
  store.setState({
    lobby: {
      ...state.lobby,
      joined: lobbyData.players.length,
      names: lobbyData.players.map((player) => player.nickname),
      joinDeadline: lobbyData.joinDeadline ?? state.lobby.joinDeadline,
      countdownEndsAt: lobbyData.countdownStart ?? state.lobby.countdownEndsAt,
    },
  });
}

export function startMultiplayerGame(data, isReconnect = false) {
  const seed = data.seed;
  runtime.rng = createRng(seed);

  const game = store.getState().game;
  game.seed = seed;
  game.grid = data.grid || generateGrid(data.players.length);
  game.players = data.players.map((serverPlayer, index) => ({
    id: serverPlayer.id,
    name: serverPlayer.nickname,
    color: PLAYER_COLORS[index],
    gridX: serverPlayer.gridX,
    gridY: serverPlayer.gridY,
    x: serverPlayer.x,
    y: serverPlayer.y,
    startX: serverPlayer.x,
    startY: serverPlayer.y,
    targetX: serverPlayer.x,
    targetY: serverPlayer.y,
    moving: false,
    moveProgress: 0,
    moveDuration: 0,
    speed: serverPlayer.speed,
    bombsMax: serverPlayer.bombsMax,
    bombsActive: 0,
    flameRange: serverPlayer.flameRange,
    lives: serverPlayer.lives,
    alive: serverPlayer.alive,
    invulnerableUntil: 0,
    controlIndex: serverPlayer.id === runtime.localPlayerId ? 0 : -1,
  }));

  if (isReconnect) {
    game.powerups = data.powerups || [];
    game.bombs = (data.bombs || []).map((bombData) => ({
      id: bombData.id,
      x: bombData.x,
      y: bombData.y,
      ownerId: bombData.ownerId,
      range: bombData.range,
      placedAt: bombData.placedAt,
      explodeAt: bombData.placedAt + BOMB_TIMER_MS,
      passIds: [bombData.ownerId],
    }));
  } else {
    game.bombs = [];
    game.powerups = [];
  }

  game.flames = [];
  game.winner = null;
  game.over = false;

  resetRuntimeCounters();
  resetInputState();
  store.setState({ phase: 'playing', game });

  if (window.router) {
    window.router.navigate('/online/play');
  }
}

export function updatePlayerPosition(data) {
  const game = store.getState().game;
  const player = game.players.find((entry) => entry.id === data.playerId);
  if (player && player.id !== runtime.localPlayerId) {
    const targetX = data.gridX ?? data.x;
    const targetY = data.gridY ?? data.y;
    const isSameTile = player.gridX === targetX && player.gridY === targetY;

    if (isSameTile) {
      player.x = data.x;
      player.y = data.y;
      player.gridX = targetX;
      player.gridY = targetY;
      player.startX = data.x;
      player.startY = data.y;
      player.targetX = targetX;
      player.targetY = targetY;
      player.moving = false;
      player.moveProgress = 0;
      player.moveDuration = 0;
      store.setState({ game });
      return;
    }

    beginPlayerMove(player, player.x, player.y, targetX, targetY);
    store.setState({ game });
  }
}

export function addBombFromServer(bombData) {
  const game = store.getState().game;
  const bomb = {
    id: bombData.id,
    x: bombData.x,
    y: bombData.y,
    ownerId: bombData.ownerId,
    range: bombData.range,
    placedAt: bombData.placedAt,
    explodeAt: bombData.placedAt + BOMB_TIMER_MS,
    passIds: [bombData.ownerId],
  };
  game.bombs.push(bomb);
  store.setState({ game });
}

export function handleBombExplosion(data) {
  const game = store.getState().game;
  game.bombs = game.bombs.filter((bomb) => bomb.id !== data.bombId);

  const destroyedSet = new Set(
    (data.destroyedBlocks || []).map((block) => `${block.x},${block.y}`)
  );

  if (data.destroyedBlocks) {
    data.destroyedBlocks.forEach((block) => {
      if (isInside(block.x, block.y)) {
        game.grid[block.y][block.x] = 'floor';
      }
    });
  }

  if (data.newPowerups) {
    data.newPowerups.forEach((powerup) => {
      game.powerups.push(powerup);
    });
  }

  const now = store.getState().now;
  game.flames.push({
    id: nextFlameId(),
    x: data.x,
    y: data.y,
    createdAt: now,
    expiresAt: now + FLAME_DURATION_MS,
  });

  [DIRS.up, DIRS.down, DIRS.left, DIRS.right].forEach((dir) => {
    for (let i = 1; i <= data.range; i += 1) {
      const fx = data.x + dir.x * i;
      const fy = data.y + dir.y * i;
      if (!isInside(fx, fy)) break;
      const cell = game.grid[fy][fx];
      if (cell === 'wall') break;

      game.flames.push({
        id: nextFlameId(),
        x: fx,
        y: fy,
        createdAt: now,
        expiresAt: now + FLAME_DURATION_MS,
      });

      if (cell === 'block' || destroyedSet.has(`${fx},${fy}`)) {
        break;
      }
    }
  });

  store.setState({ game });
}

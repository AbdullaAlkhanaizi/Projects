const clients = new Map();
const disconnectedPlayers = new Map();

const gameState = {
  phase: 'lobby',
  lobby: {
    players: [],
    joinDeadline: null,
    countdownStart: null,
    joinTimeout: null,
    countdownTimeout: null,
  },
  game: {
    seed: null,
    grid: [],
    players: [],
    bombs: [],
    flames: [],
    powerups: [],
    startedAt: null,
  },
};

function resetGameState() {
  gameState.phase = 'lobby';
  gameState.lobby.players = [];
  gameState.lobby.joinDeadline = null;
  gameState.lobby.countdownStart = null;

  if (gameState.lobby.joinTimeout) {
    clearTimeout(gameState.lobby.joinTimeout);
    gameState.lobby.joinTimeout = null;
  }
  if (gameState.lobby.countdownTimeout) {
    clearTimeout(gameState.lobby.countdownTimeout);
    gameState.lobby.countdownTimeout = null;
  }

  gameState.game.seed = null;
  gameState.game.grid = [];
  gameState.game.players = [];
  gameState.game.bombs = [];
  gameState.game.flames = [];
  gameState.game.powerups = [];
  gameState.game.startedAt = null;

  disconnectedPlayers.clear();
}

module.exports = {
  clients,
  disconnectedPlayers,
  gameState,
  resetGameState,
};

import { DISALLOW_REFRESH_ROUTES, JOIN_WAIT_MS, MAX_PLAYERS, MIN_PLAYERS } from './constants.js';
import { connectToServer, disconnectGameSocket } from './online.js';
import { runtime } from './runtime.js';
import { createLobby, store } from './store.js';

function navigate(path) {
  if (window.router) {
    window.router.navigate(path);
  }
}

export function goToMenu() {
  disconnectGameSocket();
  sessionStorage.removeItem('bomberman_playerId');
  sessionStorage.removeItem('bomberman_nickname');
  runtime.localPlayerId = null;

  store.setState({
    phase: 'menu',
    gameMode: null,
    lobby: createLobby(),
    nickname: '',
    nicknameDraft: '',
  });

  navigate('/');
}

export function selectGameMode(mode) {
  store.setState({ gameMode: mode, phase: 'lobby' });
  navigate(mode === 'online' ? '/online/lobby' : '/local/lobby');
}

export function joinLobby() {
  const state = store.getState();

  if (state.gameMode === 'online') {
    const nickname = state.nicknameDraft.trim() || 'Player 1';
    sessionStorage.setItem('bomberman_nickname', nickname);
    store.setState({ phase: 'waiting', nickname });
    connectToServer(nickname);
  } else {
    const nickname = state.nicknameDraft.trim() || 'Player 1';
    const lobby = {
      ...state.lobby,
      joined: 1,
      target: state.localPlayers,
      names: [nickname],
      joinDeadline: state.now + JOIN_WAIT_MS,
      countdownEndsAt: null,
    };
    store.setState({ phase: 'waiting', nickname, lobby });
  }

  navigate(state.gameMode === 'online' ? '/online/waiting' : '/local/waiting');
}

export function addLocalPlayer() {
  const state = store.getState();
  const lobby = state.lobby;
  if (lobby.joined >= lobby.max) return;
  lobby.joined += 1;
  lobby.names.push(`Player ${lobby.joined}`);
  store.setState({ lobby });
}

export function fillSlots() {
  const state = store.getState();
  const lobby = state.lobby;
  while (lobby.joined < lobby.target) {
    lobby.joined += 1;
    lobby.names.push(`Player ${lobby.joined}`);
  }
  store.setState({ lobby });
}

export function updateNickname(value) {
  store.setState({ nicknameDraft: value });
}

export function updateLocalPlayers(value) {
  const count = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, Number(value) || MIN_PLAYERS));
  store.setState({
    localPlayers: count,
    lobby: { ...store.getState().lobby, target: count },
  });
}

export function restoreSession() {
  const storedPlayerId = sessionStorage.getItem('bomberman_playerId');
  const storedNickname = sessionStorage.getItem('bomberman_nickname');

  if (storedPlayerId && storedNickname) {
    console.log('Found existing session, attempting to reconnect...');
    store.batch(() => {
      store.setState({
        route: '/online/waiting',
        phase: 'waiting',
        gameMode: 'online',
        nickname: storedNickname,
        lobby: {
          joined: 1,
          target: 2,
          max: MAX_PLAYERS,
          names: [storedNickname],
          joinDeadline: null,
          countdownEndsAt: null,
        },
      });
    });
    navigate('/online/waiting');
    connectToServer(storedNickname);
    return;
  }

  const currentRoute = store.getState().route;
  if (DISALLOW_REFRESH_ROUTES.has(currentRoute)) {
    navigate('/');
  }
}

import { createApp, createLoop, createRouter } from '../src/mini.js';
import { restoreSession } from './actions.js';
import { ROUTE_PHASES } from './constants.js';
import { updateGame, updateLobby } from './gameplay.js';
import { store } from './store.js';
import { view } from './views.js';

const loop = createLoop({
  onTick: (dt, now) => {
    store.setState({ now });
    const state = store.getState();
    if (state.phase === 'waiting' || state.phase === 'countdown') {
      updateLobby(state, now);
    }
    if (state.phase === 'playing') {
      updateGame(state, dt, now);
    }
  },
  onFps: (fps) => store.setState({ fps }),
});

const app = createApp({
  root: document.getElementById('app'),
  view,
  store,
});

const router = createRouter(ROUTE_PHASES, (match) => {
  const path = match.path;
  const nextGameMode = path.startsWith('/online/')
    ? 'online'
    : path.startsWith('/local/')
      ? 'local'
      : null;
  const nextPhase = match.value || (path === '/' ? 'menu' : null);

  store.batch(() => {
    store.setState({ route: path });
    if (nextGameMode !== null) {
      store.setState({ gameMode: nextGameMode });
    } else if (path === '/') {
      store.setState({ gameMode: null });
    }
    if (nextPhase) {
      store.setState({ phase: nextPhase });
    }
  });
});

window.router = router;

app.start();
loop.start();
router.start();
restoreSession();

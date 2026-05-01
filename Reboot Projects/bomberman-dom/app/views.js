import { h } from '../src/mini.js';
import {
  GRID_COLS,
  GRID_ROWS,
  KNOWN_ROUTES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  STARTING_LIVES,
} from './constants.js';
import {
  addLocalPlayer,
  fillSlots,
  goToMenu,
  joinLobby,
  selectGameMode,
  updateLocalPlayers,
  updateNickname,
} from './actions.js';
import { startMatch } from './gameplay.js';
import { sendChat } from './chat.js';
import { windowHandlers } from './input.js';
import { store } from './store.js';

function viewMenu() {
  return h('div', { class: 'screen menu-screen' }, [
    h('div', { class: 'menu-header' }, [
      h('h2', {}, 'Choose Game Mode'),
      h('p', {}, 'Select how you want to play Bomberman'),
    ]),
    h('div', { class: 'menu-options' }, [
      h('div', { class: 'game-mode-card' }, [
        h('div', { class: 'card-icon' }, '\uD83C\uDFAE'),
        h('h3', {}, 'Local Multiplayer'),
        h('p', {}, 'Play with friends on the same computer. Up to 4 players can share the keyboard.'),
        h('ul', {}, [
          h('li', {}, '2-4 players on one device'),
          h('li', {}, 'Shared keyboard controls'),
          h('li', {}, 'Instant start'),
        ]),
        h('button', { on: { click: () => selectGameMode('local') } }, 'Play Local'),
      ]),
      h('div', { class: 'game-mode-card' }, [
        h('div', { class: 'card-icon' }, '\uD83C\uDF10'),
        h('h3', {}, 'Online Multiplayer'),
        h('p', {}, 'Battle with players online. Join a lobby and wait for others to connect.'),
        h('ul', {}, [
          h('li', {}, '2-4 players online'),
          h('li', {}, 'Real-time synchronization'),
          h('li', {}, 'Chat with opponents'),
        ]),
        h('button', { on: { click: () => selectGameMode('online') } }, 'Play Online'),
      ]),
    ]),
  ]);
}

function viewLobby(state) {
  const isOnline = state.gameMode === 'online';

  return h('div', { class: 'screen' }, [
    h('h2', {}, isOnline ? 'Join Online Lobby' : 'Enter the arena'),
    h(
      'p',
      {},
      isOnline
        ? 'Enter your nickname to join the online battle.'
        : 'Choose a nickname and number of local players to start.'
    ),
    h('div', { class: 'controls' }, [
      h('input', {
        type: 'text',
        placeholder: 'Nickname',
        value: state.nicknameDraft,
        on: { input: (event) => updateNickname(event.target.value) },
      }),
      !isOnline &&
        h('input', {
          type: 'number',
          min: MIN_PLAYERS,
          max: MAX_PLAYERS,
          value: state.localPlayers,
          on: { input: (event) => updateLocalPlayers(event.target.value) },
        }),
      h('button', { on: { click: joinLobby } }, isOnline ? 'Join Online' : 'Join game'),
      h('button', { class: 'ghost', on: { click: goToMenu } }, 'Back to Menu'),
    ]),
  ]);
}

function renderLobbySlots(lobby) {
  const slots = Array.from({ length: MAX_PLAYERS }, (_, index) => {
    const filled = index < lobby.joined;
    return h(
      'div',
      { class: 'slot', key: `slot-${index}` },
      filled
        ? [
            h('strong', {}, lobby.names[index] || `Player ${index + 1}`),
            h('span', {}, 'Ready'),
          ]
        : [h('strong', {}, 'Open slot'), h('span', {}, 'Waiting')]
    );
  });
  return h('div', { class: 'lobby-grid' }, slots);
}

function viewWaiting(state) {
  const lobby = state.lobby;
  const isOnline = state.gameMode === 'online';
  const currentTime = isOnline ? Date.now() : state.now;

  const joinLeft = lobby.joinDeadline
    ? Math.max(0, Math.ceil((lobby.joinDeadline - currentTime) / 1000))
    : 0;
  const countdownLeft = lobby.countdownEndsAt
    ? Math.max(0, Math.ceil((lobby.countdownEndsAt - currentTime) / 1000))
    : null;
  const status = countdownLeft
    ? `Match starts in ${countdownLeft}s`
    : lobby.joined >= MIN_PLAYERS
      ? `Waiting for more players (${joinLeft}s)`
      : 'Need at least 2 players to start';

  return h('div', { class: 'screen' }, [
    h('h2', {}, isOnline ? 'Online Lobby' : 'Waiting room'),
    h('div', { class: 'badge' }, `Players ${lobby.joined}/${lobby.max}`),
    h('p', {}, status),
    renderLobbySlots(lobby),
    !isOnline &&
      h('div', { class: 'controls' }, [
        h(
          'button',
          {
            class: 'secondary',
            on: { click: addLocalPlayer },
            disabled: lobby.joined >= lobby.max,
          },
          'Add player'
        ),
        h(
          'button',
          {
            class: 'ghost',
            on: { click: fillSlots },
            disabled: lobby.joined >= lobby.target,
          },
          'Fill slots'
        ),
      ]),
  ]);
}

function renderGrid(game) {
  const cells = [];
  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      const type = (game.grid[y] && game.grid[y][x]) || 'floor';
      cells.push(
        h('div', {
          class: `cell ${type}`,
          key: `cell-${x}-${y}`,
        })
      );
    }
  }
  return h('div', { class: 'grid' }, cells);
}

function renderEntities(game, now) {
  const entities = [];
  game.powerups.forEach((powerup) => {
    entities.push(
      h('div', {
        class: 'entity powerup',
        'data-type': powerup.type,
        key: powerup.id,
        style: {
          transform: `translate3d(calc(var(--tile) * ${powerup.x}), calc(var(--tile) * ${powerup.y}), 0)`,
        },
      })
    );
  });
  game.bombs.forEach((bomb) => {
    entities.push(
      h('div', {
        class: 'entity bomb',
        key: bomb.id,
        style: {
          transform: `translate3d(calc(var(--tile) * ${bomb.x}), calc(var(--tile) * ${bomb.y}), 0)`,
        },
      })
    );
  });
  game.flames.forEach((flame) => {
    entities.push(
      h('div', {
        class: 'entity flame',
        key: flame.id,
        style: {
          transform: `translate3d(calc(var(--tile) * ${flame.x}), calc(var(--tile) * ${flame.y}), 0)`,
        },
      })
    );
  });
  game.players.forEach((player) => {
    if (!player.alive) return;
    const hit = now < player.invulnerableUntil;
    entities.push(
      h('div', {
        class: `entity player player--${player.color}${hit ? ' is-hit' : ''}`,
        key: player.id,
        style: {
          transform: `translate3d(calc(var(--tile) * ${player.x}), calc(var(--tile) * ${player.y}), 0)`,
        },
      })
    );
  });
  return h('div', { class: 'entities' }, entities);
}

function renderHud(state) {
  const game = state.game;
  return h('div', { class: 'hud' }, [
    h('div', { class: 'stats' }, [
      h('div', { class: 'pill' }, `FPS ${state.fps}`),
      h('div', { class: 'pill' }, `Bombs ${game.bombs.length}`),
      h('div', { class: 'pill' }, `Powerups ${game.powerups.length}`),
    ]),
    h('div', { class: 'stats' }, [
      ...game.players.map((player) => {
        const total = Math.max(STARTING_LIVES, player.lives);
        const hearts = Array.from({ length: total }, (_, index) =>
          h('span', {
            class: `heart${index < player.lives ? '' : ' empty'}`,
            key: `heart-${player.id}-${index}`,
          })
        );
        return h('div', { class: 'pill', key: `hud-${player.id}` }, [
          h('span', { class: 'player-name' }, player.name),
          h('div', { class: 'hearts' }, hearts),
          h('div', { class: 'boosts' }, [
            h('span', { class: 'boost' }, `B${player.bombsMax}`),
            h('span', { class: 'boost' }, `F${player.flameRange}`),
          ]),
        ]);
      }),
    ]),
  ]);
}

function renderChat(state) {
  return h('div', { class: 'chat' }, [
    h('div', { class: 'chat-header' }, [
      h('strong', {}, 'Team chat'),
      h('span', { class: 'badge' }, state.chat.connected ? 'Connected' : 'Offline'),
    ]),
    h(
      'div',
      { class: 'chat-log' },
      state.chat.messages.map((message) =>
        h(
          'div',
          { class: 'message', key: message.id },
          [h('strong', {}, message.name), h('span', {}, message.text)]
        )
      )
    ),
    h('div', { class: 'chat-input' }, [
      h('input', {
        type: 'text',
        placeholder: 'Type a message',
        value: state.chatDraft,
        on: {
          input: (event) => store.setState({ chatDraft: event.target.value }),
          keydown: (event) => {
            if (event.key === 'Enter') sendChat();
          },
        },
      }),
      h('button', { on: { click: sendChat } }, 'Send'),
    ]),
  ]);
}

function renderKeymap(state) {
  const isOnline = state.gameMode === 'online';
  return h('div', { class: 'keymap' }, [
    h('div', {}, [
      h('strong', {}, 'Player 1'),
      h('span', {}, 'Move: Arrows | Bomb: Space'),
    ]),
    !isOnline &&
      h('div', {}, [
        h('strong', {}, 'Player 2'),
        h('span', {}, 'Move: WASD | Bomb: E'),
      ]),
    !isOnline &&
      h('div', {}, [
        h('strong', {}, 'Player 3'),
        h('span', {}, 'Move: IJKL | Bomb: O'),
      ]),
    !isOnline &&
      h('div', {}, [
        h('strong', {}, 'Player 4'),
        h('span', {}, 'Move: TGFH | Bomb: R'),
      ]),
  ]);
}

function renderGameLayout(state) {
  const game = state.game;
  return h('div', { class: 'game-shell' }, [
    h('div', {}, [
      h(
        'div',
        {
          class: 'board',
          style: `--cols: ${GRID_COLS}; --rows: ${GRID_ROWS};`,
        },
        [renderGrid(game), renderEntities(game, state.now)]
      ),
      renderKeymap(state),
    ]),
    renderChat(state),
  ]);
}

function viewGame(state) {
  return h('div', { class: 'screen' }, [renderHud(state), renderGameLayout(state)]);
}

function viewGameOver(state) {
  const winner = state.game.winner;
  const isOnline = state.gameMode === 'online';

  return h('div', { class: 'screen' }, [
    h('h2', {}, 'Round over'),
    h(
      'div',
      { class: 'banner' },
      winner ? `${winner.name} wins the arena!` : 'No winners this time.'
    ),
    h('div', { class: 'controls' }, [
      !isOnline && h('button', { on: { click: startMatch } }, 'Rematch'),
      h('button', { class: 'ghost', on: { click: goToMenu } }, 'Back to Menu'),
    ]),
    renderHud(state),
    renderGameLayout(state),
  ]);
}

function viewNotFound(state) {
  return h('div', { class: 'screen error-screen' }, [
    h('div', { class: 'error-code' }, '404'),
    h('h2', {}, 'Arena not found'),
    h('p', {}, `The route ${state.route || '/'} does not exist in Bomberman DOM.`),
    h('div', { class: 'banner error-banner' }, [
      h('strong', {}, 'What to do next'),
      h('span', {}, 'Head back to the menu and launch a local or online match.'),
    ]),
    h('div', { class: 'controls' }, [
      h(
        'a',
        {
          href: '/',
          class: 'button-link',
        },
        'Back to Menu'
      ),
      h(
        'a',
        {
          href: '/online/lobby',
          class: 'button-link secondary',
        },
        'Open Lobby'
      ),
    ]),
  ]);
}

function viewReconnecting() {
  const hasSession =
    Boolean(sessionStorage.getItem('bomberman_playerId')) &&
    Boolean(sessionStorage.getItem('bomberman_nickname'));
  return h('div', { class: 'screen' }, [
    h('h2', {}, hasSession ? 'Reconnecting...' : 'Match not ready'),
    h(
      'p',
      {},
      hasSession
        ? 'Restoring the match state. This should only take a moment.'
        : 'There is no active match to restore. Head back to the menu to start one.'
    ),
    h('div', { class: 'controls' }, [
      h(
        'a',
        {
          href: '/',
          class: 'button-link',
        },
        'Back to Menu'
      ),
    ]),
  ]);
}

export function view(state) {
  const route = state.route;
  const phase = state.phase;
  const hasKnownRoute = KNOWN_ROUTES.has(route);
  let screen = null;

  if (!hasKnownRoute) {
    screen = viewNotFound(state);
  } else if (route === '/') {
    screen = viewMenu();
  } else if (route === '/local/lobby' || route === '/online/lobby') {
    screen = viewLobby(state);
  } else if (route === '/local/waiting' || route === '/online/waiting') {
    screen = viewWaiting(state);
  } else if (route === '/local/play' || route === '/online/play') {
    if (state.phase === 'gameover' || state.game.over) {
      screen = viewGameOver(state);
    } else {
      const gridReady =
        Array.isArray(state.game.grid) &&
        state.game.grid.length === GRID_ROWS &&
        Array.isArray(state.game.grid[0]) &&
        state.game.grid[0].length === GRID_COLS;
      const playersReady = Array.isArray(state.game.players) && state.game.players.length > 0;
      screen = gridReady && playersReady ? viewGame(state) : viewReconnecting();
    }
  } else if (route === '/local/game-over' || route === '/online/game-over') {
    screen = viewGameOver(state);
  } else if (phase === 'menu') {
    screen = viewMenu();
  } else if (phase === 'lobby') {
    screen = viewLobby(state);
  } else if (phase === 'waiting' || phase === 'countdown') {
    screen = viewWaiting(state);
  } else if (phase === 'playing') {
    screen = viewGame(state);
  } else if (phase === 'gameover') {
    screen = viewGameOver(state);
  } else {
    screen = viewMenu();
  }

  return h(
    'div',
    {
      class: 'app',
      onWindow: windowHandlers,
    },
    [
      h('div', { class: 'brand' }, [
        h('h1', {}, 'Bomberman DOM'),
        h('span', {}, 'Mini-framework powered arena'),
      ]),
      screen,
    ]
  );
}

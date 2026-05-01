import { endGame, gameState, togglePause } from './utils.js';
import { restartGame} from './ui.js';
import { createLaser } from './lasers.js';

const player = document.getElementById('player');
const keys = {};
let spacePressed = false;

document.addEventListener('keydown', (e) => {
    const code = e.code;

    keys[e.key.toLowerCase()] = true;

    if (code === 'Space' && !spacePressed && !gameState.paused && !gameState.gameOver) {
        e.preventDefault();
        shoot();
        spacePressed = true;
    }

    if (code === 'KeyP' && !gameState.gameOver) {
        togglePause();
    }
    if (code === 'Backquote' && !gameState.gameOver) {
        endGame('win')
    }
    if (code === 'KeyQ' && !gameState.gameOver) {
        endGame('lose')
    }

    if (code === 'KeyR' && (gameState.paused || gameState.gameOver)) {
        restartGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    if (e.code === 'Space') spacePressed = false;
});

export function updatePlayer(deltaTime) {
    const moveDistance = 300 * deltaTime;
    if (keys['arrowleft'] && gameState.playerX > 0) gameState.playerX -= moveDistance;
    if (keys['arrowright'] && gameState.playerX < 800 - 40) gameState.playerX += moveDistance;
    player.style.transform = `translateX(${gameState.playerX - 380}px) translateZ(0)`;
}

function shoot() {
    createLaser(gameState.playerX + 18, 540);
}

export function updateInvulnerability() {
    if (gameState.invulnerable && Date.now() - gameState.invulnerableTime > 2000) {
        gameState.invulnerable = false;
        player.classList.remove('invulnerable');
    }
}

export function flashInvulnerable() {
    player.classList.add('invulnerable');
}

export { player };

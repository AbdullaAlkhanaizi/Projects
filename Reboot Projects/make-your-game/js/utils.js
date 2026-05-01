import { updatePlayer, updateInvulnerability } from './player.js';
import { updateLasers } from './lasers.js';
import { updateAliens } from './aliens.js';

export let gameState = {
    playerX: 400 - 20,
    aliens: [],
    lasers: [],
    alienLasers: [],
    score: 0,
    lives: 3,
    gameOver: false,
    paused: false,
    alienDirection: 1,
    lastAlienMove: 0,
    lastAlienShoot: 0,
    invulnerable: false,
    invulnerableTime: 0
};

let lastFrameTime = 0;
let animationId = null;

export function resetGameState() {
    gameState = {
        playerX: 400 - 20,
        aliens: [],
        lasers: [],
        alienLasers: [],
        score: 0,
        lives: 3,
        gameOver: false,
        paused: false,
        alienDirection: 1,
        lastAlienMove: 0,
        lastAlienShoot: 0,
        invulnerable: false,
        invulnerableTime: 0
    };

    document.getElementById('lasers-container').innerHTML = '';
    document.getElementById('alien-lasers-container').innerHTML = '';
}

export function requestGameLoop() {
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
}

export function cancelGameLoop() {
    cancelAnimationFrame(animationId);
    animationId = null;
}

export function gameLoop(currentTime) {
    if (!lastFrameTime) lastFrameTime = currentTime;
    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    if (!gameState.gameOver && !gameState.paused) {
        updatePlayer(deltaTime);
        updateLasers(deltaTime);
        updateAliens(currentTime);
        updateInvulnerability();
    }

    animationId = requestAnimationFrame(gameLoop);
}

export function togglePause() {
    gameState.paused = !gameState.paused;
    const pauseScreen = document.getElementById('pauseScreen');
    if (gameState.paused) {
        pauseScreen.classList.remove('hidden');
        cancelGameLoop();
    } else {
        pauseScreen.classList.add('hidden');
        requestGameLoop();
    }
}

export function endGame(type) {
    const score = gameState.score;
    const timer = document.getElementById('timer').textContent;
    let bigText = '';
    let smallText = '';
    const gameOverElement = document.getElementById('gameOver');
    const gameOverText = document.getElementById('gameOverText');

    if (type === 'win') {
        bigText = 'You Won!';
        smallText = `you have stopped the aliens from invading!\nGood job!\nScore ${score}\nTime ${timer} seconds`;
        gameOverText.style.color = 'lime';
    } else if (type === 'lose') {
        bigText = 'You Lost!';
        smallText = `the aliens have invaded earth and killed everyone!\nScore ${score}\nTime ${timer}`;
        gameOverText.style.color = 'red';
    }

    gameOverText.innerHTML = `<span class="big-text">${bigText}</span><br><span class="small-text">${smallText.replace(/\n/g, '<br>')}</span>`;
    gameOverElement.classList.remove('hidden');
    gameState.gameOver = true;
    cancelGameLoop();
}

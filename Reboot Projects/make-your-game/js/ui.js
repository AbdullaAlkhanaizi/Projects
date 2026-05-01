import { initAliens } from './aliens.js';
import { requestGameLoop, gameState, resetGameState } from './utils.js';

const scoreElement = document.getElementById('score');
const heartsContainer = document.getElementById('hearts-container');
const gameOverElement = document.getElementById('gameOver');
const gameOverText = document.getElementById('gameOverText');
const pauseScreen = document.getElementById('pauseScreen');
const timerElement = document.getElementById('timer');

let timerInterval;

export function initUI() {
    initHearts();
    updateScore(0);
    updateTimer(0);


}

export function initHearts() {
    heartsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const heart = document.createElement('div');
        heart.className = i < gameState.lives ? 'heart' : 'heart empty';
        heart.id = `heart-${i}`;
        heartsContainer.appendChild(heart);
    }
}

export function updateHearts() {
    for (let i = 0; i < 3; i++) {
        const heart = document.getElementById(`heart-${i}`);
        heart.className = i < gameState.lives ? 'heart' : 'heart empty';
    }
}

export function updateScore(score) {
    scoreElement.textContent = score;
}

export function updateTimer(seconds) {
    timerElement.textContent = seconds;
}

export function startGame() {
    resetGameState();
    initHearts();
    initAliens();
    startTimer();
    requestGameLoop();
}

function startTimer() {
    let time = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameState.paused && !gameState.gameOver) {
            time++;
            updateTimer(time);
        }
    }, 1000);
}

export function showGameOver(content) {
    gameOverText.innerHTML = content;
    gameOverElement.classList.remove('hidden');
    clearInterval(timerInterval);
}


export function restartGame() {
    clearInterval(timerInterval);

    document.getElementById('lasers-container').innerHTML = '';
    document.getElementById('alien-lasers-container').innerHTML = '';

    resetGameState();
    initHearts();
    updateScore(0);
    updateTimer(0);

    gameOverElement.classList.add('hidden');
    pauseScreen.classList.add('hidden');

    initAliens();
    gameState.paused = false;
    startTimer();
    requestGameLoop();
}

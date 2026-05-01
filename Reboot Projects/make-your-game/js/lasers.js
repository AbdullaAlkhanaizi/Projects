import { endGame, gameState } from './utils.js';
import { updateScore, updateHearts } from './ui.js';
import { flashInvulnerable } from './player.js';
import { getAlienGroupOffset } from './aliens.js';

const lasersContainer = document.getElementById('lasers-container');
const alienLasersContainer = document.getElementById('alien-lasers-container');
const gameArea = document.getElementById('gameArea');

let laserCounter = 0;

export function createLaser(x, y) {
    const id = `laser-${laserCounter++}`;
    const laserEl = document.createElement('div');
    laserEl.className = 'laser';
    laserEl.id = id;
    laserEl.style.transform = `translate(${x}px, ${y}px) translateZ(0)`;
    lasersContainer.appendChild(laserEl);
    gameState.lasers.push({ id, x, y, element: laserEl });
}

export function createAlienLaser(x, y) {
    const id = `alien-laser-${laserCounter++}`;
    const laserEl = document.createElement('div');
    laserEl.className = 'alien-laser';
    laserEl.id = id;
    laserEl.style.transform = `translate(${x}px, ${y}px) translateZ(0)`;
    alienLasersContainer.appendChild(laserEl);
    gameState.alienLasers.push({ id, x, y, element: laserEl });
}

export function updateLasers(deltaTime) {
    const speed = 400;
    const { x: offsetX, y: offsetY } = getAlienGroupOffset();

    gameState.lasers = gameState.lasers.filter(l => {
        l.y -= speed * deltaTime;
        l.element.style.transform = `translate(${l.x}px, ${l.y}px) translateZ(0)`;
        if (l.y < 0) {
            l.element.remove();
            return false;
        }
        for (let alien of gameState.aliens) {
            if (
                alien.alive &&
                l.x < alien.x + offsetX + 30 &&
                l.x + 4 > alien.x + offsetX &&
                l.y < alien.y + offsetY + 20 &&
                l.y + 15 > alien.y + offsetY
            ) {
                alien.alive = false;
                alien.element.remove();
                l.element.remove();
                gameState.score += 10;
                updateScore(gameState.score);
                createExplosion(alien.x + offsetX, alien.y + offsetY);
                return false;
            }
        }
        return true;
    });

    gameState.alienLasers = gameState.alienLasers.filter(l => {
        l.y += speed * deltaTime;
        l.element.style.transform = `translate(${l.x}px, ${l.y}px) translateZ(0)`;
        if (l.y > 600) {
            l.element.remove();
            return false;
        }
        if (
            l.x < gameState.playerX + 40 &&
            l.x + 4 > gameState.playerX &&
            l.y < 570 &&
            l.y + 15 > 550 &&
            !gameState.invulnerable
        ) {
            l.element.remove();
            gameState.lives--;
            updateHearts();
            if (gameState.lives <= 0) {
                endGame('lose');
            } else {
                gameState.invulnerable = true;
                gameState.invulnerableTime = Date.now();
                flashInvulnerable();
            }
            return false;
        }
        return true;
    });
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${x - 15}px`;
    explosion.style.top = `${y - 15}px`;
    gameArea.appendChild(explosion);
    setTimeout(() => explosion.remove(), 300);
}

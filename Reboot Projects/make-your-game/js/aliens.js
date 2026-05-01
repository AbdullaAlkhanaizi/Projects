import { gameState, endGame } from './utils.js';
import { createAlienLaser } from './lasers.js';

const aliensContainer = document.getElementById('aliens-container');
let alienCounter = 0;
let alienGroupX = 0;
let alienGroupY = 0;

export function initAliens() {
    gameState.aliens = [];
    aliensContainer.innerHTML = '';
    alienCounter = 0;
    alienGroupX = 0;
    alienGroupY = 0;

    const rows = 5, cols = 10, startX = 50, startY = 50, spacingX = 60, spacingY = 50;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const alienId = `alien-${alienCounter++}`;
            const alien = {
                id: alienId,
                x: startX + col * spacingX,
                y: startY + row * spacingY,
                alive: true,
                element: null
            };

            const alienElement = document.createElement('div');
            alienElement.className = 'alien';
            alienElement.id = alienId;
            alienElement.style.left = `${alien.x}px`;
            alienElement.style.top = `${alien.y}px`;
            alienElement.style.position = 'absolute';

            aliensContainer.appendChild(alienElement);
            alien.element = alienElement;
            gameState.aliens.push(alien);
        }
    }

    aliensContainer.style.transform = `translate(0px, 0px)`;
    aliensContainer.style.willChange = 'transform';
}

export function updateAliens(currentTime) {
    if (currentTime - gameState.lastAlienMove > 500) {
        const aliveAliens = gameState.aliens.filter(a => a.alive);
        if (aliveAliens.length === 0) {
            endGame('win');
            return;
        }

        const leftmost = Math.min(...aliveAliens.map(a => a.x));
        const rightmost = Math.max(...aliveAliens.map(a => a.x + 30));
        let moveDown = false;

        if (rightmost + alienGroupX >= 780 && gameState.alienDirection === 1) {
            gameState.alienDirection = -1;
            moveDown = true;
        } else if (leftmost + alienGroupX <= 20 && gameState.alienDirection === -1) {
            gameState.alienDirection = 1;
            moveDown = true;
        }

        if (moveDown) {
            alienGroupY += 50;
        } else {
            alienGroupX += 20 * gameState.alienDirection;
        }

        aliensContainer.style.transform = `translate(${alienGroupX}px, ${alienGroupY}px)`;

        for (const alien of aliveAliens) {
            if (alien.y + alienGroupY + 20 >= 550) {
                endGame('lose');
                return;
            }
        }

        gameState.lastAlienMove = currentTime;
    }

    if (currentTime - gameState.lastAlienShoot > 1500) {
        const aliveAliens = gameState.aliens.filter(a => a.alive);
        if (aliveAliens.length > 0) {
            const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
            createAlienLaser(shooter.x + alienGroupX + 13, shooter.y + alienGroupY + 20);
        }
        gameState.lastAlienShoot = currentTime;
    }
}

export function getAlienGroupOffset() {
    return { x: alienGroupX, y: alienGroupY };
}

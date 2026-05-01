import { initUI, startGame } from './ui.js';
import { gameLoop } from './utils.js';

document.getElementById('startGameBtn').addEventListener('click', () => {
    document.getElementById('homepage').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    startGame();
    requestAnimationFrame(gameLoop);
});


initUI();

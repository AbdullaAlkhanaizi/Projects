# Bomberman DOM - Multiplayer Edition

A multiplayer Bomberman game built with DOM manipulation using the mini-framework.

## Features

✅ **Multiplayer Online**: 2-4 players can join and battle  
✅ **Real-time Synchronization**: Player movements and bombs synced via WebSocket  
✅ **Chat System**: Communicate with other players during the game  
✅ **60 FPS Performance**: Optimized game loop with `requestAnimationFrame`  
✅ **Custom Framework**: Built using the mini-framework (no Canvas, no Web-GL)

## Run the Game

From the project root:

```bash
node server/server.js
```

Open `http://localhost:8081` in your browser.

**For multiplayer testing**: Open multiple browser tabs to simulate multiple players.

## Controls

- **Player 1**: Arrow keys to move, Space to drop bomb
- **Player 2**: WASD to move, E to drop bomb  
- **Player 3**: IJKL to move, O to drop bomb
- **Player 4**: TGFH to move, R to drop bomb

## Sprites

Save the provided pixel art images into `bomberman-dom/assets` with these names:

- `bomb.png` (small bomb used in game)
- `bomb-power.png` (bomb powerup)
- `explosion.png` (explosion sprite)
- `flame.png` (flame powerup)
- `speed.png` (speed powerup)
- `heart.png` (extra life powerup)
- `player.png` (blue player)
- `player2.png` (green player)
- `player3.png` (red player)
- `player4.png` (yellow player)
- `floor.png` (hard block)
- `block.png` (soft block)

## Controls

- Player 1: Arrows + Space
- Player 2: WASD + E
- Player 3: IJKL + O
- Player 4: TGFH + R

## Notes

- 60 FPS game loop via `requestAnimationFrame` and the framework loop helper.
- Fixed map with static walls and random destructible blocks.
- Powerups: bombs, flames, speed, hearts.

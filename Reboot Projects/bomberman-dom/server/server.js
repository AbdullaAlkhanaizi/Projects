const { PORT } = require('./constants');
const { createGameHandlers } = require('./game');
const { createHttpServer } = require('./http');
const { attachWebSocketServer, broadcast, sendToSocket } = require('./ws');

const server = createHttpServer();
const handlers = createGameHandlers({ broadcast, sendToSocket });

attachWebSocketServer(server, handlers);

server.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log('Multiplayer Bomberman ready!');
});

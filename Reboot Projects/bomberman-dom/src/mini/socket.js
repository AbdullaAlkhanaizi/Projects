import { bindEvent } from './events.js';

export function createSocket(url, handlers) {
  const socket = new WebSocket(url);
  const safeHandlers = handlers || {};

  bindEvent(socket, 'open', (event) => {
    if (safeHandlers.open) safeHandlers.open(event, socket);
  });
  bindEvent(socket, 'message', (event) => {
    if (safeHandlers.message) safeHandlers.message(event, socket);
  });
  bindEvent(socket, 'close', (event) => {
    if (safeHandlers.close) safeHandlers.close(event, socket);
  });
  bindEvent(socket, 'error', (event) => {
    if (safeHandlers.error) safeHandlers.error(event, socket);
  });

  function send(data) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  }

  function close() {
    socket.close();
  }

  return { socket, send, close };
}

const crypto = require('crypto');
const { clients } = require('./state');

function createAcceptKey(key) {
  return crypto
    .createHash('sha1')
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, 'binary')
    .digest('base64');
}

function encodeFrame(data) {
  const payload = Buffer.from(data);
  const length = payload.length;
  let header = null;

  if (length < 126) {
    header = Buffer.from([0x81, length]);
  } else if (length < 65536) {
    header = Buffer.from([0x81, 126, (length >> 8) & 255, length & 255]);
  } else {
    header = Buffer.from([
      0x81,
      127,
      0,
      0,
      0,
      0,
      (length >> 24) & 255,
      (length >> 16) & 255,
      (length >> 8) & 255,
      length & 255,
    ]);
  }

  return Buffer.concat([header, payload]);
}

function decodeFrames(buffer) {
  const messages = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const byte1 = buffer[offset++];
    const opcode = byte1 & 0x0f;
    const byte2 = buffer[offset++];
    const masked = byte2 & 0x80;
    let length = byte2 & 0x7f;

    if (length === 126) {
      if (offset + 2 > buffer.length) break;
      length = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      if (offset + 8 > buffer.length) break;
      const high = buffer.readUInt32BE(offset);
      const low = buffer.readUInt32BE(offset + 4);
      length = high * 2 ** 32 + low;
      offset += 8;
    }

    let mask = null;
    if (masked) {
      if (offset + 4 > buffer.length) break;
      mask = buffer.slice(offset, offset + 4);
      offset += 4;
    }

    if (offset + length > buffer.length) break;
    let payload = buffer.slice(offset, offset + length);
    offset += length;

    if (masked && mask) {
      const unmasked = Buffer.alloc(payload.length);
      for (let index = 0; index < payload.length; index += 1) {
        unmasked[index] = payload[index] ^ mask[index % 4];
      }
      payload = unmasked;
    }

    if (opcode === 0x1) {
      messages.push(payload.toString('utf8'));
    } else if (opcode === 0x8) {
      break;
    }
  }

  return messages;
}

function broadcast(message, excludeSocket = null) {
  const frame = encodeFrame(typeof message === 'string' ? message : JSON.stringify(message));
  clients.forEach((clientData, socket) => {
    if (socket === excludeSocket) return;
    try {
      socket.write(frame);
    } catch (err) {
      console.error('Broadcast error:', err);
    }
  });
}

function sendToSocket(socket, message) {
  const frame = encodeFrame(typeof message === 'string' ? message : JSON.stringify(message));
  try {
    socket.write(frame);
  } catch (err) {
    console.error('Send error:', err);
  }
}

function attachWebSocketServer(server, { handleMessage, handleDisconnect }) {
  server.on('upgrade', (req, socket) => {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const acceptKey = createAcceptKey(key);
    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
    ];
    socket.write(`${headers.join('\r\n')}\r\n\r\n`);

    socket.on('data', (buffer) => {
      decodeFrames(buffer).forEach((message) => handleMessage(socket, message));
    });
    socket.on('close', () => handleDisconnect(socket));
    socket.on('end', () => handleDisconnect(socket));
    socket.on('error', () => handleDisconnect(socket));
  });
}

module.exports = {
  attachWebSocketServer,
  broadcast,
  sendToSocket,
};

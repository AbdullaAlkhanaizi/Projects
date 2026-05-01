import http from 'http';
import { readFile } from 'fs/promises';
import { basename, join } from 'path';

const PORT = 5000;

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'guest not found' }));
      return;
    }

    const guestName = basename(req.url.split('?')[0]);
    const filePath = join(process.cwd(), 'guests', `${guestName}.json`);

    try {
      const data = await readFile(filePath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'guest not found' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'server failed' }));
      }
    }

  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'server failed' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

export { server }; 

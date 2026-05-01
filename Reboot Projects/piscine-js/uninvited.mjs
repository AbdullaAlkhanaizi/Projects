import http from 'http';
import { mkdir, writeFile } from 'fs/promises';
import { basename, join, dirname } from 'path';

const PORT = 5000;

const server = http.createServer((req, res) => {

    if (req.method !== 'POST') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'server failed' }));
        return;
    }

    const guestName = basename(req.url.split('?')[0] || '');
    const filePath = join(process.cwd(), 'guests', `${guestName}.json`);

    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });

    req.on('end', async () => {
        try {

            await mkdir(dirname(filePath), { recursive: true });


            await writeFile(filePath, rawBody, 'utf-8');


            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(rawBody);
        } catch {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'server failed' }));
        }
    });

    req.on('error', () => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'server failed' }));
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

export { server };   

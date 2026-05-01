const fs = require('fs');
const http = require('http');
const path = require('path');
const { LEGACY_REDIRECTS, MIME_TYPES, SPA_ROUTES } = require('./constants');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderNotFoundPage(requestPath) {
  const safePath = escapeHtml(requestPath || '/');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404 | Bomberman DOM</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Bungee&family=Space+Grotesk:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --font-title: "Bungee", "Trebuchet MS", sans-serif;
        --font-body: "Space Grotesk", "Segoe UI", sans-serif;
        --bg-0: #f4efe6;
        --bg-1: #f8dcc0;
        --bg-2: #b6d8c8;
        --ink: #2b2521;
        --muted: #6a5f55;
        --accent: #e2552c;
        --accent-2: #2c8b7a;
        --panel: rgba(255, 255, 255, 0.88);
        --shadow: 0 24px 40px rgba(35, 28, 20, 0.18);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: var(--font-body);
        color: var(--ink);
        background: radial-gradient(1200px 800px at 20% -10%, #fdf7ec 0%, transparent 60%),
          radial-gradient(900px 700px at 100% 0%, #c7f0e1 0%, transparent 55%),
          linear-gradient(140deg, var(--bg-0), var(--bg-1) 40%, var(--bg-2) 100%);
        display: grid;
        place-items: center;
        padding: 24px;
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        background-image: linear-gradient(120deg, rgba(255, 255, 255, 0.25) 0%, transparent 55%),
          repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.2) 0, rgba(255, 255, 255, 0.2) 2px, transparent 2px, transparent 8px);
        opacity: 0.35;
        pointer-events: none;
        z-index: -1;
      }

      .screen {
        width: min(760px, 100%);
        background: var(--panel);
        border-radius: 24px;
        padding: 40px 32px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(8px);
        text-align: center;
      }

      .brand {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 28px;
        text-align: left;
      }

      .brand h1 {
        margin: 0;
        font-family: var(--font-title);
        font-size: clamp(1.4rem, 3vw, 2.2rem);
      }

      .brand span {
        color: var(--muted);
        font-size: 0.95rem;
      }

      .error-code {
        font-family: var(--font-title);
        font-size: clamp(4.4rem, 14vw, 8.5rem);
        line-height: 0.9;
        color: var(--accent);
        text-shadow: 0 10px 22px rgba(226, 85, 44, 0.22);
      }

      h2 {
        margin: 18px 0 10px;
        font-family: var(--font-title);
        font-size: clamp(1.8rem, 4vw, 2.8rem);
      }

      p {
        margin: 0 auto;
        max-width: 44ch;
        color: var(--muted);
        line-height: 1.6;
      }

      .banner {
        margin: 24px auto 0;
        max-width: 520px;
        padding: 16px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(0, 0, 0, 0.08);
      }

      .banner strong {
        display: block;
        margin-bottom: 6px;
        font-family: var(--font-title);
        font-size: 1rem;
        color: var(--accent);
      }

      .controls {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 24px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        border-radius: 999px;
        padding: 10px 18px;
        font-size: 0.95rem;
        font-weight: 600;
        color: #fff;
        background: var(--accent);
        box-shadow: 0 12px 18px rgba(226, 85, 44, 0.25);
      }

      .button.secondary {
        background: var(--accent-2);
        box-shadow: 0 12px 18px rgba(44, 139, 122, 0.25);
      }

      code {
        display: inline-block;
        margin-top: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(44, 139, 122, 0.12);
        color: var(--accent-2);
        font-weight: 600;
      }

      @media (max-width: 640px) {
        .screen { padding: 28px 20px; }
        .brand { display: block; text-align: center; }
      }
    </style>
  </head>
  <body>
    <main class="screen">
      <div class="brand">
        <h1>Bomberman DOM</h1>
        <span>Mini-framework powered arena</span>
      </div>
      <div class="error-code">404</div>
      <h2>Arena not found</h2>
      <p>The route you requested is outside the current map. Return to the main menu or jump straight into the lobby.</p>
      <code>${safePath}</code>
      <div class="banner">
        <strong>What to do next</strong>
        <span>Use the main menu to start a local match or connect to an online lobby.</span>
      </div>
      <div class="controls">
        <a class="button" href="/">Back to Menu</a>
        <a class="button secondary" href="/online/lobby">Open Lobby</a>
      </div>
    </main>
  </body>
</html>`;
}

function createHttpServer() {
  return http.createServer((req, res) => {
    const requestUrl = new URL(req.url, 'http://localhost');
    let requestPath = requestUrl.pathname;

    if (requestPath === '/index.html') {
      res.writeHead(302, { Location: '/' });
      res.end();
      return;
    }

    if (requestPath.length > 1 && requestPath.endsWith('/')) {
      requestPath = requestPath.slice(0, -1);
      res.writeHead(302, { Location: `${requestPath}${requestUrl.search}` });
      res.end();
      return;
    }

    if (LEGACY_REDIRECTS[requestPath]) {
      res.writeHead(302, { Location: `${LEGACY_REDIRECTS[requestPath]}${requestUrl.search}` });
      res.end();
      return;
    }

    const filePath = path.join(__dirname, '..', requestPath === '/' ? 'index.html' : requestPath);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          if (SPA_ROUTES.has(requestPath)) {
            fs.readFile(path.join(__dirname, '..', 'index.html'), (indexError, indexContent) => {
              if (indexError) {
                res.writeHead(500);
                res.end(`Server Error: ${indexError.code}`);
                return;
              }
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexContent, 'utf-8');
            });
            return;
          }
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(renderNotFoundPage(requestPath), 'utf-8');
          return;
        }

        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
        return;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    });
  });
}

module.exports = {
  createHttpServer,
};

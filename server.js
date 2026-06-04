const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const os       = require('os');
const http     = require('http');
const { WebSocketServer } = require('ws');

const app  = express();
const PORT = 3000;

// ── Путь к реплеям ────────────────────────────────────────────
// Приоритет: переменная окружения → ./replay рядом с приложением → стандартный путь игры
function getReplayDir() {
  const candidates = [
    process.env.ZV_REPLAY_DIR,
    path.join(__dirname, 'replay'),                          // ./replay рядом с приложением
    path.join(process.env.LOCALAPPDATA || '', 'Arma Reforger', 'profile', 'replay'),
    path.join(os.homedir(), 'AppData', 'Local', 'Arma Reforger', 'profile', 'replay'),
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      console.log(`[Replays] Found dir: ${p}`);
      return p;
    }
  }
  // По умолчанию — ./replay, создадим если нет
  const defaultDir = path.join(__dirname, 'replay');
  fs.mkdirSync(defaultDir, { recursive: true });
  console.log(`[Replays] Created dir: ${defaultDir}`);
  return defaultDir;
}

const REPLAY_DIR = getReplayDir();

// ── Static ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API ───────────────────────────────────────────────────────
app.get('/api/replays', (req, res) => {
  try {
    const files = fs.existsSync(REPLAY_DIR)
      ? fs.readdirSync(REPLAY_DIR)
          .filter(f => f.endsWith('.json'))
          .map(f => {
            const stat = fs.statSync(path.join(REPLAY_DIR, f));
            return { name: f, size: stat.size, mtime: stat.mtime };
          })
          .sort((a, b) => new Date(b.mtime) - new Date(a.mtime))
      : [];
    res.json({ dir: REPLAY_DIR, files });
  } catch(e) {
    res.json({ error: e.message, files: [], dir: REPLAY_DIR });
  }
});

app.get('/api/replay/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(REPLAY_DIR, name);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(file);
});

app.get('/api/config', (req, res) => {
  res.json({ replayDir: REPLAY_DIR, exists: fs.existsSync(REPLAY_DIR) });
});

// ── HTTP + WebSocket ──────────────────────────────────────────
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', ws => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

function broadcast(msg) {
  clients.forEach(ws => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); });
}

// Hot reload: следим за public/
fs.watch(path.join(__dirname, 'public'), { recursive: true }, (event, filename) => {
  if (!filename) return;
  console.log(`[Hot Reload] ${filename}`);
  broadcast({ type: 'reload' });
});

// Новые реплеи → уведомляем браузер
if (fs.existsSync(REPLAY_DIR)) {
  fs.watch(REPLAY_DIR, (event, filename) => {
    if (!filename || !filename.endsWith('.json')) return;
    console.log(`[New Replay] ${filename}`);
    broadcast({ type: 'new_replay', name: filename });
  });
}

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║        ZV Replay Viewer              ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  http://localhost:${PORT}                ║`);
  console.log(`║  Реплеи: ${path.basename(REPLAY_DIR).padEnd(28)}║`);
  console.log(`║  Путь:   ${REPLAY_DIR.slice(0,28).padEnd(28)}║`);
  console.log('║  Hot reload: ON                      ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  console.log('  Положите .json файлы реплеев в:');
  console.log(`  ${REPLAY_DIR}`);
  console.log('');
});

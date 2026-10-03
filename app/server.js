// VIỆT THIÊN COFFEE GROUP — Hệ thống quản trị vị thế hàng thực & phòng hộ sàn
// Server Node.js thuần (không cần cài thư viện). Chạy: node server.js  →  http://localhost:3456
// Thời gian thực: server tự lấy giá và ĐẨY xuống mọi màn hình đang mở qua luồng /api/stream (Server-Sent Events).
const http = require('http');
const fs = require('fs');
const path = require('path');
const engine = require('./public/engine');
const telegramBot = require('./telegram_bot');

const PORT = Number(process.env.PORT) || 3456;
// HOST=127.0.0.1 → chỉ máy này truy cập; mặc định mở cho cả mạng LAN
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const POSITION_FILE = path.join(DATA_DIR, 'position_data.json');
const MAX_BODY = 1024 * 1024;

// Nguồn giá
const QUOTES_URL = 'https://giacaphe.com/live-quotes/quotes-update-nOsjt.php?sid=&g=coffee';
const QUOTES_FAST_MS = 5000;      // có người đang xem → lấy giá mỗi 5 giây
const QUOTES_IDLE_MS = 60000;     // không ai xem → mỗi 60 giây (vẫn đủ cho cảnh báo Telegram)
const FX_URL = d => `https://www.vietcombank.com.vn/api/exchangerates?date=${d}`;
const FX_EVERY_MS = 30 * 60 * 1000; // tỷ giá Vietcombank: 30 phút/lần

fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- Dữ liệu vị thế ----------
function loadPositions() {
  try { return engine.normalize(JSON.parse(fs.readFileSync(POSITION_FILE, 'utf8'))); }
  catch (e) { return engine.defaultData(); }
}
function savePositions(data) {
  const clean = engine.normalize(data);
  clean.updatedAt = new Date().toISOString();
  const tmp = POSITION_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(clean, null, 2), 'utf8');
  fs.renameSync(tmp, POSITION_FILE);
  broadcast('positions', { updatedAt: clean.updatedAt });
  return clean;
}
if (!fs.existsSync(POSITION_FILE)) savePositions(engine.defaultData());

// ---------- Luồng thời gian thực (SSE) ----------
const clients = new Set();
function broadcast(event, payload) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) { try { res.write(msg); } catch (e) { clients.delete(res); } }
}
setInterval(() => { for (const res of clients) { try { res.write(': ping\n\n'); } catch (e) { clients.delete(res); } } }, 25000);

// ---------- Giá sàn ----------
const market = { quotes: null, ok: false, error: null, fetchedAt: null, changedAt: null, fx: null };
let lastSignature = '';
async function fetchQuotes() {
  try {
    const res = await fetch(QUOTES_URL, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://giacaphe.com/gia-ca-phe-truc-tuyen/',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Auth-Site': 'giacaphe'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const sig = JSON.stringify([data.coffee_liffe, data.coffee_ice, data.updated]);
    market.quotes = data; market.ok = true; market.error = null; market.fetchedAt = new Date().toISOString();
    if (sig !== lastSignature) { lastSignature = sig; market.changedAt = market.fetchedAt; broadcast('quotes', snapshot()); recordHistory(data); }
    else broadcast('heartbeat', { ok: true, fetchedAt: market.fetchedAt, changedAt: market.changedAt });
    telegramBot.checkPriceAlerts(data).catch(() => {});
  } catch (err) {
    market.ok = false; market.error = err.message;
    broadcast('heartbeat', { ok: false, error: err.message, fetchedAt: market.fetchedAt, changedAt: market.changedAt });
    console.error('[Giá sàn] Không lấy được giá:', err.message);
  }
}
(function quoteLoop() {
  fetchQuotes().finally(() => setTimeout(quoteLoop, clients.size ? QUOTES_FAST_MS : QUOTES_IDLE_MS));
})();

// ---------- Lịch sử giá theo ngày (để vẽ đường cong kỳ hạn theo tuần/tháng) ----------
const HISTORY_FILE = path.join(DATA_DIR, 'price_history.json');
const HISTORY_KEEP_DAYS = 800;
function loadHistory() { try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch (e) { return {}; } }
function recordHistory(data) {
  try {
    const day = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10); // ngày theo giờ Việt Nam
    const pick = list => Object.fromEntries((list || []).map(q => [q.Name, engine.num(q.Last)]).filter(([, v]) => v > 0));
    const hist = loadHistory();
    hist[day] = { robusta: pick(data.coffee_liffe), arabica: pick(data.coffee_ice), updated: data.updated };
    const days = Object.keys(hist).sort();
    days.slice(0, Math.max(0, days.length - HISTORY_KEEP_DAYS)).forEach(d => delete hist[d]);
    fs.writeFileSync(HISTORY_FILE + '.tmp', JSON.stringify(hist), 'utf8');
    fs.renameSync(HISTORY_FILE + '.tmp', HISTORY_FILE);
  } catch (e) { console.error('[Lịch sử giá] Lỗi ghi:', e.message); }
}

// ---------- Tỷ giá Vietcombank (API công khai) ----------
async function fetchFx() {
  try {
    const d = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10); // ngày theo giờ Việt Nam
    const res = await fetch(FX_URL(d), { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const usd = (j.Data || []).find(x => x.currencyCode === 'USD');
    if (!usd) throw new Error('Không có USD');
    market.fx = { cash: engine.num(usd.cash), transfer: engine.num(usd.transfer), sell: engine.num(usd.sell),
      updatedDate: j.UpdatedDate || j.Date, fetchedAt: new Date().toISOString(), source: 'Vietcombank' };
    broadcast('fx', market.fx);
  } catch (err) { console.error('[Tỷ giá] Lỗi:', err.message); }
}
fetchFx(); setInterval(fetchFx, FX_EVERY_MS);

function snapshot() {
  return { success: market.ok, error: market.error, data: market.quotes, fetchedAt: market.fetchedAt, changedAt: market.changedAt, fx: market.fx };
}

// Bot Telegram: hỏi lệnh mỗi 5 giây (bot tự bỏ qua nếu chưa bật)
setInterval(() => {
  telegramBot.pollTelegramCommands(async () => market.quotes, async () => loadPositions()).catch(() => {});
}, 5000);

// ---------- HTTP ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};
function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(new Error('Dữ liệu gửi lên quá lớn')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(new Error('JSON không hợp lệ')); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (pathname === '/api/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 3000\n\n');
      res.write(`event: quotes\ndata: ${JSON.stringify(snapshot())}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      if (clients.size === 1) fetchQuotes(); // người đầu tiên mở → lấy giá ngay
      return;
    }
    if (pathname === '/api/live-quotes') {
      if (req.method === 'POST' || !market.quotes) await fetchQuotes();
      return sendJson(res, 200, snapshot());
    }
    if (pathname === '/api/load-matrix') return sendJson(res, 200, loadPositions());
    if (pathname === '/api/history') return sendJson(res, 200, loadHistory());
    if (pathname === '/api/fx') return sendJson(res, 200, market.fx || {});
    if (pathname === '/api/save-matrix' && req.method === 'POST') {
      const saved = savePositions(await readBody(req));
      return sendJson(res, 200, { success: true, message: 'Đã lưu vị thế thành công!', data: saved });
    }
    if (pathname === '/api/reset-matrix' && req.method === 'POST') {
      return sendJson(res, 200, { success: true, data: savePositions(engine.sampleData()) });
    }
    if (pathname === '/api/telegram-config' && req.method === 'GET') return sendJson(res, 200, telegramBot.publicConfig());
    if (pathname === '/api/telegram-config' && req.method === 'POST') {
      telegramBot.updateConfig(await readBody(req));
      return sendJson(res, 200, { success: true, message: 'Đã cập nhật cấu hình Telegram!' });
    }
    if (pathname === '/api/telegram-test' && req.method === 'POST') {
      if (!market.quotes) await fetchQuotes();
      return sendJson(res, 200, await telegramBot.sendTelegramMessage(telegramBot.buildMarketReport(market.quotes, loadPositions())));
    }
    if (pathname.startsWith('/api/')) return sendJson(res, 404, { success: false, error: 'API không tồn tại' });

    // File tĩnh — chỉ phục vụ trong thư mục public
    const filePath = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : decodeURIComponent(pathname)));
    if (!filePath.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); return res.end('403'); }
    fs.readFile(filePath, (err, content) => {
      if (err) { res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end(err.code === 'ENOENT' ? '404 Not Found' : 'Server Error'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(content);
    });
  } catch (e) {
    sendJson(res, 400, { success: false, error: e.message });
  }
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`Cổng ${PORT} đang bị chiếm — hãy chạy DUNG_HE_THONG.bat rồi mở lại.`);
  else console.error(e);
  process.exit(1);
});
server.listen(PORT, HOST, () => {
  console.log('=======================================================');
  console.log('☕ VIỆT THIÊN COFFEE GROUP — HỆ THỐNG QUẢN TRỊ VỊ THẾ ĐÃ SẴN SÀNG');
  console.log(`👉 Mở trình duyệt tại: http://localhost:${PORT}`);
  console.log('=======================================================');
});

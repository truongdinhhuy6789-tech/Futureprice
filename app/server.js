// VIỆT THIÊN COFFEE GROUP — Hệ thống quản trị vị thế hàng thực & phòng hộ sàn
// Server Node.js thuần (không cần cài thư viện). Chạy: node server.js  →  http://localhost:3456
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
const QUOTES_URL = 'https://giacaphe.com/live-quotes/quotes-update-nOsjt.php?sid=&g=coffee';
const QUOTES_CACHE_MS = 10000;
const MAX_BODY = 1024 * 1024;

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
  return clean;
}
if (!fs.existsSync(POSITION_FILE)) savePositions(engine.defaultData());

// ---------- Giá sàn trực tuyến ----------
let quotesCache = { at: 0, data: null };
async function fetchLiveQuotes(force) {
  if (!force && quotesCache.data && Date.now() - quotesCache.at < QUOTES_CACHE_MS) return { success: true, data: quotesCache.data, cached: true };
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
    quotesCache = { at: Date.now(), data };
    telegramBot.checkPriceAlerts(data).catch(() => {});
    return { success: true, data };
  } catch (err) {
    console.error('[Giá sàn] Không lấy được giá:', err.message);
    return { success: false, error: err.message, data: quotesCache.data };
  }
}

// Bot Telegram: hỏi lệnh mỗi 5 giây (bot tự bỏ qua nếu chưa bật)
setInterval(() => {
  telegramBot.pollTelegramCommands(async () => (await fetchLiveQuotes()).data, async () => loadPositions()).catch(() => {});
}, 5000);

// ---------- HTTP ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
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
    if (pathname === '/api/live-quotes') return sendJson(res, 200, await fetchLiveQuotes(req.method === 'POST'));
    if (pathname === '/api/load-matrix') return sendJson(res, 200, loadPositions());
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
      const quotes = (await fetchLiveQuotes()).data;
      return sendJson(res, 200, await telegramBot.sendTelegramMessage(telegramBot.buildMarketReport(quotes, loadPositions())));
    }
    if (pathname.startsWith('/api/')) return sendJson(res, 404, { success: false, error: 'API không tồn tại' });

    // File tĩnh — chỉ phục vụ trong thư mục public
    const filePath = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : decodeURIComponent(pathname)));
    if (!filePath.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); return res.end('403'); }
    fs.readFile(filePath, (err, content) => {
      if (err) { res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end(err.code === 'ENOENT' ? '404 Not Found' : 'Server Error'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
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

// VIỆT THIÊN COFFEE GROUP — Hệ thống quản trị vị thế hàng thực & phòng hộ sàn
// Server Node.js thuần (không cần cài thư viện). Chạy: node server.js  →  http://localhost:3456
// Thời gian thực: server tự lấy giá và ĐẨY xuống mọi màn hình đang mở qua luồng /api/stream (Server-Sent Events).
const http = require('http');
const fs = require('fs');
const path = require('path');
const engine = require('./public/engine');
const telegramBot = require('./telegram_bot');
const auth = require('./auth');

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
const DOMESTIC_URL = 'https://giacaphe.com/gia-ca-phe-noi-dia/';
const DOMESTIC_EVERY_MS = 30 * 60 * 1000; // giá nhân xô: giacaphe.com cập nhật vài lần/ngày → 30 phút/lần là đủ

fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- Dữ liệu vị thế ----------
function loadPositions() {
  try { return engine.normalize(JSON.parse(fs.readFileSync(POSITION_FILE, 'utf8'))); }
  catch (e) { return engine.defaultData(); }
}
let positionsAt = null; // lần lưu vị thế gần nhất – màn hình hỏi giá định kỳ dùng để biết có số liệu mới
// Trước mỗi lần lưu: giữ bản cũ trong data/backups (200 bản gần nhất) để khôi phục khi sửa nhầm qua link
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const BACKUP_KEEP = 200;
function backupPositions() {
  try {
    if (!fs.existsSync(POSITION_FILE)) return;
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 23).replace('T', '_').replace(/[:.]/g, '-'); // giờ Việt Nam
    fs.copyFileSync(POSITION_FILE, path.join(BACKUP_DIR, `position_data_${stamp}.json`));
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('position_data_')).sort();
    files.slice(0, Math.max(0, files.length - BACKUP_KEEP)).forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
  } catch (e) { console.error('[Sao lưu] Lỗi:', e.message); }
}
function savePositions(data) {
  backupPositions();
  const clean = engine.normalize(data);
  clean.updatedAt = new Date().toISOString();
  const tmp = POSITION_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(clean, null, 2), 'utf8');
  fs.renameSync(tmp, POSITION_FILE);
  positionsAt = clean.updatedAt;
  broadcast('positions', { updatedAt: clean.updatedAt });
  return clean;
}
if (!fs.existsSync(POSITION_FILE)) savePositions(engine.defaultData());
positionsAt = loadPositions().updatedAt || null;

// ---------- Luồng thời gian thực (SSE) ----------
const clients = new Set();
function broadcast(event, payload) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) { try { res.write(msg); } catch (e) { clients.delete(res); } }
}
setInterval(() => { for (const res of clients) { try { res.write(': ping\n\n'); } catch (e) { clients.delete(res); } } }, 25000);

// ---------- Giá sàn ----------
const market = { quotes: null, ok: false, error: null, fetchedAt: null, changedAt: null, fx: null, domestic: null };
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
// Có người đang xem = có luồng SSE (trong máy/LAN) hoặc vừa hỏi giá trong 30 giây (qua link online)
let lastPollAt = 0, loopTimer = null, fetching = false;
const watching = () => clients.size > 0 || Date.now() - lastPollAt < 30000;
function quoteLoop() {
  clearTimeout(loopTimer); fetching = true;
  fetchQuotes().finally(() => { fetching = false; loopTimer = setTimeout(quoteLoop, watching() ? QUOTES_FAST_MS : QUOTES_IDLE_MS); });
}
function wakeQuotes() { if (!fetching) quoteLoop(); } // người đầu tiên vào xem → lấy giá ngay và chuyển sang nhịp 5 giây
quoteLoop();

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

// ---------- Giá nhân xô nội địa (giacaphe.com) ----------
// Chỉ lấy giá giacaphe.com ghi công khai dạng chữ: giá trung bình Tây Nguyên (mô tả trang) và giá tỉnh ghi ngay trong tiêu đề trang tỉnh.
// Ô giá trong bảng bị mã hóa có chủ đích (dữ liệu thu phí) → không giải mã; tỉnh không ghi giá công khai thì để link xem trên giacaphe.com.
const DOMESTIC_PROVINCES = [['Đắk Lắk', 'dak-lak'], ['Lâm Đồng', 'lam-dong'], ['Gia Lai', 'gia-lai'], ['Đắk Nông', 'dak-nong']];
const toVnd = s => Number(String(s).replace(/[.,]/g, ''));
async function getPage(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'VietThien-PositionSystem/2.0 (noi bo)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
async function fetchDomestic() {
  try {
    const page = await getPage(DOMESTIC_URL);
    const desc = (page.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    const avg = desc.match(/trung bình (?:ở mức )?([\d.,]+) ?(?:vn)?đ\/kg/i);
    if (!avg) throw new Error('Không thấy giá trung bình trong trang');
    const ch = desc.slice(avg.index + avg[0].length).match(/^\s*(tăng|giảm)\D{0,12}([\d.,]+)/i);
    const high = page.match(/cao nhất (?:ở mức )?([\d.,]+) ?(?:vn)?đ\/kg/i);
    const provinces = [];
    for (const [name, slug] of DOMESTIC_PROVINCES) {
      const url = `https://giacaphe.com/gia-ca-phe-${slug}/`; let price = null, change = null;
      try {
        const html = await getPage(url);
        const m = (((html.match(/<title>([^<]*)<\/title>/) || [])[1]) || '').match(/([\d.,]+) ?(?:vn)?đ\/kg/i); if (m) price = toVnd(m[1]);
        // Mức thay đổi: chỉ lấy khi câu chữ trong bài ghi số thường ("tăng nhẹ 200đ/kg so với…"); bỏ qua style/script
        const text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        const c = text.match(/(tăng|giảm)(?: nhẹ| mạnh| thêm)? ([\d.,]+) ?đ\/kg so với/i);
        if (c) change = (/giảm/i.test(c[1]) ? -1 : 1) * toVnd(c[2]); else if (/(đi ngang|không đổi|giữ nguyên) so với/i.test(text)) change = 0;
      } catch (e) { /* tỉnh này để trống */ }
      provinces.push({ name, price, change: price ? change : null, url });
    }
    market.domestic = { avg: toVnd(avg[1]), change: ch ? (/giảm/i.test(ch[1]) ? -1 : 1) * toVnd(ch[2]) : 0, high: high ? toVnd(high[1]) : null, provinces,
      date: (desc.match(/\d{2}\/\d{2}\/\d{4}/) || [])[0] || null, fetchedAt: new Date().toISOString(), source: 'giacaphe.com' };
    broadcast('domestic', market.domestic);
  } catch (err) { console.error('[Giá nội địa] Lỗi:', err.message); }
}
fetchDomestic(); setInterval(fetchDomestic, DOMESTIC_EVERY_MS);

// ---------- Link online hiện tại (do link_keeper.js ghi khi mở/mở lại đường hầm) ----------
const LINK_FILE = path.join(DATA_DIR, 'link.json');
function readLink() {
  try { const j = JSON.parse(fs.readFileSync(LINK_FILE, 'utf8')); return j.url ? { url: j.url, since: j.since || null, status: j.status || null, permanent: j.permanent || null } : null; } catch (e) { return null; }
}
let linkInfo = readLink();
fs.watchFile(LINK_FILE, { interval: 5000 }, () => {
  const n = readLink(); if (JSON.stringify(n) === JSON.stringify(linkInfo)) return;
  if (n && (!linkInfo || n.url !== linkInfo.url)) console.log('[Link online]', n.url);
  linkInfo = n; broadcast('link', linkInfo);
});

function snapshot() {
  return { success: market.ok, error: market.error, data: market.quotes, fetchedAt: market.fetchedAt, changedAt: market.changedAt, fx: market.fx, domestic: market.domestic, link: linkInfo, positionsAt };
}
// Báo cáo bot dùng giá nhân xô tự động (nếu lấy được) thay cho giá nhập tay
function withDomestic(d) {
  if (market.domestic) d.reference = { ...d.reference, domesticPrice: market.domestic.avg, domesticNote: `TB Tây Nguyên – giacaphe.com ${market.domestic.date || ''}`.trim() };
  return d;
}

// Bot Telegram: hỏi lệnh mỗi 5 giây (bot tự bỏ qua nếu chưa bật)
setInterval(() => {
  telegramBot.pollTelegramCommands(async () => market.quotes, async () => withDomestic(loadPositions())).catch(() => {});
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
function readRaw(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(new Error('Dữ liệu gửi lên quá lớn')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
async function readBody(req) {
  const raw = await readRaw(req);
  try { return JSON.parse(raw || '{}'); } catch (e) { throw new Error('JSON không hợp lệ'); }
}
const html = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(body); };
// Thao tác thay đổi dữ liệu — chỉ tài khoản chỉnh sửa
const EDITOR_ONLY = ['/api/save-matrix', '/api/reset-matrix', '/api/telegram-config', '/api/telegram-test'];

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow'); // số liệu nội bộ: không cho Google… lập chỉ mục link online
  res.setHeader('Referrer-Policy', 'same-origin');
  try {
    // ----- Công khai: đăng nhập, đăng xuất, logo -----
    if (pathname === '/robots.txt') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('User-agent: *\nDisallow: /\n'); }
    if (pathname === '/login' && req.method === 'GET') {
      if (auth.openAccess === 'editor') { res.writeHead(302, { Location: '/' }); return res.end(); } // link đã toàn quyền, không cần đăng nhập
      return html(res, 200, auth.loginPage());
    }
    if (pathname === '/login' && req.method === 'POST') {
      const r = auth.checkPassword(req, new URLSearchParams(await readRaw(req)).get('password') || '');
      if (!r.ok) return html(res, 401, auth.loginPage(r.error));
      auth.setSession(res, req, r.role); res.writeHead(302, { Location: '/' }); return res.end();
    }
    if (pathname === '/logout') { auth.clearSession(res); res.writeHead(302, { Location: auth.publicView ? '/' : '/login' }); return res.end(); }
    // Link chỉnh sửa không cần mật khẩu: /k/<editKey> → cấp quyền chỉnh sửa rồi chuyển về trang chính (xóa khóa khỏi thanh địa chỉ)
    if (pathname.startsWith('/k/')) {
      if (auth.checkEditKey(req, decodeURIComponent(pathname.slice(3))).ok) auth.setSession(res, req, 'editor');
      res.writeHead(302, { Location: '/', 'Referrer-Policy': 'no-referrer' }); return res.end();
    }
    // openAccess: chưa đăng nhập = toàn quyền ("editor") / chỉ xem ("viewer") / phải đăng nhập ("none")
    const role = auth.getRole(req);
    if (!role && !pathname.startsWith('/assets/')) {
      if (pathname.startsWith('/api/')) return sendJson(res, 401, { success: false, error: 'Cần đăng nhập' });
      res.writeHead(302, { Location: '/login' }); return res.end();
    }
    if (pathname === '/api/me') return sendJson(res, 200, { role, local: auth.isDirectLocal(req), tunnel: !!req.headers['cf-ray'], publicView: auth.publicView, openAccess: auth.openAccess });
    if (EDITOR_ONLY.includes(pathname) && role !== 'editor') return sendJson(res, 403, { success: false, error: 'Tài khoản chỉ xem – không có quyền thay đổi' });

    if (pathname === '/api/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 3000\n\n');
      res.write(`event: quotes\ndata: ${JSON.stringify(snapshot())}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      if (clients.size === 1 && lastPollAt < Date.now() - 30000) wakeQuotes();
      return;
    }
    // Hỏi giá định kỳ (link online qua Cloudflare không hỗ trợ SSE). ?since=changedAt → giá chưa đổi thì trả gói nhỏ
    // POST = nút "Kiểm tra lại giá": lấy lại ngay từ giacaphe.com (tối đa 1 lần / 2 giây để không làm phiền trang nguồn)
    if (pathname === '/api/live-quotes') {
      if (req.method === 'POST') {
        if (!market.fetchedAt || Date.now() - Date.parse(market.fetchedAt) > 2000) await fetchQuotes();
        return sendJson(res, 200, snapshot());
      }
      const wasIdle = !watching(); lastPollAt = Date.now();
      if (!market.quotes) await fetchQuotes(); else if (wasIdle) wakeQuotes();
      const since = new URL(req.url, 'http://localhost').searchParams.get('since');
      if (since && since === market.changedAt && market.ok) return sendJson(res, 200, { ...snapshot(), data: undefined, unchanged: true });
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
      return sendJson(res, 200, await telegramBot.sendTelegramMessage(telegramBot.buildMarketReport(market.quotes, withDomestic(loadPositions()))));
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

// VIỆT THIÊN COFFEE GROUP — Giữ link online luôn sống (Cloudflare Quick Tunnel)
// Mỗi phút kiểm tra máy chủ trong máy và link công khai:
//  - Máy chủ tắt → tự bật lại.
//  - Link hỏng 3 lần liên tiếp, hoặc Cloudflare báo "Tunnel not found" → tự mở đường hầm mới,
//    ghi link mới vào tools/link_online.txt và app/data/link.json (hệ thống hiện ở chân trang).
// Đường hầm chạy độc lập: khởi động lại máy chủ để cập nhật code KHÔNG làm đổi link.
// Chạy: node link_keeper.js  (MO_LINK_ONLINE.bat tự chạy ẩn; TAT_LINK_ONLINE.bat / DUNG_HE_THONG.bat tự tắt)
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const APP = __dirname, ROOT = path.join(APP, '..'), TOOLS = path.join(ROOT, 'tools'), DATA = path.join(APP, 'data');
const CF = path.join(TOOLS, 'cloudflared.exe'), TUNNEL_LOG = path.join(TOOLS, 'tunnel.log');
const LINK_TXT = path.join(TOOLS, 'link_online.txt'), LINK_JSON = path.join(DATA, 'link.json');
const PID_FILE = path.join(DATA, 'link_keeper.pid'), KEEPER_LOG = path.join(DATA, 'link_keeper.log');
const PORT = Number(process.env.PORT) || 3456;
const LOCAL = `http://127.0.0.1:${PORT}/robots.txt`;
const CHECK_MS = 60000, FAIL_LIMIT = 3;
const URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/g;
const sleep = ms => new Promise(r => setTimeout(r, ms));

fs.mkdirSync(DATA, { recursive: true });
function log(msg) {
  const line = `${new Date().toLocaleString('vi-VN', { hour12: false })}  ${msg}\n`;
  try { if (fs.existsSync(KEEPER_LOG) && fs.statSync(KEEPER_LOG).size > 1e6) fs.renameSync(KEEPER_LOG, KEEPER_LOG + '.cu'); fs.appendFileSync(KEEPER_LOG, line, 'utf8'); } catch (e) { /* bỏ qua */ }
  process.stdout.write(line);
}

// Chỉ một bản chạy
function alive(pid) { try { process.kill(pid, 0); return true; } catch (e) { return false; } }
try { const old = Number(fs.readFileSync(PID_FILE, 'utf8')); if (old && old !== process.pid && alive(old)) { log(`Bộ giữ link đang chạy (PID ${old}) – thoát.`); process.exit(0); } } catch (e) { /* chưa có */ }
fs.writeFileSync(PID_FILE, String(process.pid));
const cleanup = () => { try { if (Number(fs.readFileSync(PID_FILE, 'utf8')) === process.pid) fs.unlinkSync(PID_FILE); } catch (e) { /* bỏ qua */ } };
process.on('exit', cleanup); ['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => process.exit(0)));

let saved = {}; try { saved = JSON.parse(fs.readFileSync(LINK_JSON, 'utf8')); } catch (e) { /* chưa có */ }
const state = { url: null, since: null, status: 'starting', fails: 0, restarts: saved.restarts || 0, lastOk: null, lastCheck: null, history: Array.isArray(saved.history) ? saved.history.slice(-20) : [], keeperPid: process.pid };
function save() {
  state.lastCheck = new Date().toISOString();
  try { fs.writeFileSync(LINK_JSON + '.tmp', JSON.stringify(state, null, 2)); fs.renameSync(LINK_JSON + '.tmp', LINK_JSON); } catch (e) { log('Lỗi ghi link.json: ' + e.message); }
}

async function httpOk(url, ms) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(ms || 15000), redirect: 'manual' }); return r.status >= 200 && r.status < 400; } catch (e) { return false; }
}
function tunnelLogTail() { try { const s = fs.readFileSync(TUNNEL_LOG, 'utf8'); return s.slice(-6000); } catch (e) { return ''; } }
function lastUrlInLog() { const m = tunnelLogTail().match(URL_RE) || (fs.existsSync(TUNNEL_LOG) ? fs.readFileSync(TUNNEL_LOG, 'utf8').match(URL_RE) : null); return m ? m[m.length - 1] : null; }
function ps(cmd) { return execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', cmd], { encoding: 'utf8', windowsHide: true, timeout: 20000 }).trim(); }
const cfFilter = `Get-Process cloudflared -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${CF.replace(/'/g, "''")}' }`;
function tunnelRunning() { try { return ps(`@(${cfFilter}).Count`) !== '0'; } catch (e) { return false; } }
function killTunnels() { try { ps(`${cfFilter} | Stop-Process -Force`); } catch (e) { /* không có tiến trình */ } }

function setLink(url) {
  if (url !== state.url) {
    state.history.push({ url, at: new Date().toISOString() }); state.history = state.history.slice(-20);
    state.since = new Date().toISOString();
    log(`🔗 Link online: ${url}`);
  }
  state.url = url;
  try { fs.writeFileSync(LINK_TXT, url + '\r\n', 'ascii'); } catch (e) { log('Lỗi ghi link_online.txt: ' + e.message); }
  save();
}
async function startTunnel(reason) {
  if (!fs.existsSync(CF)) { state.status = 'no-cloudflared'; save(); log('Chưa có tools/cloudflared.exe – chạy MO_LINK_ONLINE.bat để tải.'); return false; }
  log(`Mở đường hầm mới${reason ? ' – ' + reason : ''}…`);
  killTunnels(); await sleep(800);
  try { fs.writeFileSync(TUNNEL_LOG, ''); } catch (e) { /* bỏ qua */ }
  const out = fs.openSync(TUNNEL_LOG, 'a');
  const child = spawn(CF, ['tunnel', '--url', `http://127.0.0.1:${PORT}`, '--no-autoupdate'], { cwd: TOOLS, detached: true, stdio: ['ignore', out, out], windowsHide: true });
  child.unref(); fs.closeSync(out);
  let url = null;
  for (let i = 0; i < 80 && !url; i++) { await sleep(500); const m = tunnelLogTail().match(URL_RE); if (m) url = m[0]; }
  if (!url) { state.status = 'no-url'; save(); log('Chưa nhận được link từ Cloudflare (mạng chậm/bị chặn) – sẽ thử lại ở lần kiểm tra sau.'); return false; }
  state.status = 'waiting'; state.fails = 0; setLink(url);
  for (let i = 0; i < 40; i++) { await sleep(3000); if (await httpOk(url + '/robots.txt', 10000)) { state.status = 'ok'; state.lastOk = new Date().toISOString(); save(); log('Link đã sẵn sàng.'); return true; } }
  log('Link mới chưa phản hồi (thường do DNS chậm) – tiếp tục theo dõi.'); save(); return true;
}
function startServer() {
  log('Máy chủ không phản hồi – bật lại…');
  const out = fs.openSync(path.join(DATA, 'server.log'), 'a'), err = fs.openSync(path.join(DATA, 'err.log'), 'a');
  const child = spawn(process.execPath, ['server.js'], { cwd: APP, detached: true, stdio: ['ignore', out, err], windowsHide: true });
  child.unref(); fs.closeSync(out); fs.closeSync(err);
}

let busy = false;
async function check() {
  if (busy) return; busy = true;
  try {
    if (!(await httpOk(LOCAL, 8000))) {
      state.status = 'server-down'; save(); startServer();
      for (let i = 0; i < 15; i++) { await sleep(1000); if (await httpOk(LOCAL, 3000)) { log('Máy chủ đã chạy lại.'); break; } }
      return;
    }
    if (!state.url || !tunnelRunning()) { if (state.url) state.restarts += 1; await startTunnel(state.url ? 'tiến trình đường hầm đã tắt' : 'chưa có link'); return; }
    if (await httpOk(state.url + '/robots.txt', 15000)) { state.fails = 0; state.status = 'ok'; state.lastOk = new Date().toISOString(); save(); return; }
    state.fails += 1; state.status = `fail-${state.fails}`; save();
    const gone = /Tunnel not found/i.test(tunnelLogTail());
    log(`Link không phản hồi (lần ${state.fails}/${FAIL_LIMIT})${gone ? ' – Cloudflare báo đường hầm đã bị xóa' : ''}.`);
    if (gone || state.fails >= FAIL_LIMIT) { state.restarts += 1; await startTunnel(gone ? 'Cloudflare đã xóa đường hầm cũ' : 'link hỏng liên tục'); }
  } catch (e) { log('Lỗi kiểm tra: ' + e.message); } finally { busy = false; }
}

(async () => {
  log(`Bộ giữ link khởi động (PID ${process.pid}).`);
  // Dùng lại đường hầm đang chạy nếu link còn sống → không đổi link
  const existing = lastUrlInLog();
  if (existing && tunnelRunning() && await httpOk(existing + '/robots.txt', 15000)) { state.status = 'ok'; state.lastOk = new Date().toISOString(); setLink(existing); log('Dùng lại đường hầm đang chạy.'); }
  else await check();
  setInterval(check, CHECK_MS);
})();

// VIỆT THIÊN COFFEE GROUP — Đăng nhập & phân quyền
// - editor: chỉnh sửa, lưu số liệu, cấu hình bot   - viewer: chỉ xem (dành cho sếp / người được chia sẻ link)
// - Truy cập trực tiếp trên chính máy chạy hệ thống (localhost, không qua đường hầm) = editor, không cần mật khẩu
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, 'data', 'access.json');
const COOKIE = 'vt_sess';
const MAX_AGE = 30 * 24 * 3600; // 30 ngày

function genPass(prefix) { return `${prefix}-${crypto.randomInt(100000, 999999)}`; }
function loadAccess() {
  let a = null;
  try { a = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { /* tạo mới bên dưới */ }
  if (!a || !a.editorPassword || !a.viewerPassword || !a.secret) {
    a = { editorPassword: genPass('vt'), viewerPassword: genPass('sep'), secret: crypto.randomBytes(32).toString('hex'), createdAt: new Date().toISOString(),
      note: 'editorPassword = chỉnh sửa; viewerPassword = chỉ xem. Đổi mật khẩu: sửa file này rồi khởi động lại hệ thống. Đổi "secret" để đăng xuất mọi thiết bị.' };
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(a, null, 2), 'utf8');
  }
  return a;
}
const access = loadAccess();

const sign = p => crypto.createHmac('sha256', access.secret).update(p).digest('base64url');
function makeToken(role) { const p = `${role}.${Math.floor(Date.now() / 1000) + MAX_AGE}`; return `${Buffer.from(p).toString('base64url')}.${sign(p)}`; }
function safeEqual(a, b) { const A = Buffer.from(String(a)), B = Buffer.from(String(b)); return A.length === B.length && crypto.timingSafeEqual(A, B); }
function readToken(tok) {
  try {
    const [b, s] = String(tok || '').split('.');
    const p = Buffer.from(b, 'base64url').toString();
    if (!safeEqual(sign(p), s)) return null;
    const [role, exp] = p.split('.');
    if (Number(exp) < Date.now() / 1000) return null;
    return role === 'editor' || role === 'viewer' ? role : null;
  } catch (e) { return null; }
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
// Yêu cầu đi qua đường hầm/proxy (Cloudflare…) luôn mang các header này → không coi là "máy nội bộ"
function isDirectLocal(req) {
  const ip = req.socket.remoteAddress || '';
  const proxied = req.headers['cf-connecting-ip'] || req.headers['cf-ray'] || req.headers['x-forwarded-for'];
  return !proxied && (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1');
}
function getRole(req) { return isDirectLocal(req) ? 'editor' : readToken(parseCookies(req)[COOKIE]); }
const isHttps = req => req.headers['x-forwarded-proto'] === 'https' || /"scheme":"https"/.test(req.headers['cf-visitor'] || '');
function setSession(res, req, role) {
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(makeToken(role))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${isHttps(req) ? '; Secure' : ''}`);
}
function clearSession(res) { res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`); }

// Chống dò mật khẩu: sai 8 lần → khóa 10 phút theo IP
const fails = new Map();
const clientIp = req => req.headers['cf-connecting-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
function checkPassword(req, pw) {
  const ip = clientIp(req); const f = fails.get(ip) || { n: 0, until: 0 };
  if (f.until > Date.now()) return { ok: false, error: `Sai quá nhiều lần – thử lại sau ${Math.ceil((f.until - Date.now()) / 60000)} phút` };
  const role = safeEqual(pw, access.editorPassword) ? 'editor' : safeEqual(pw, access.viewerPassword) ? 'viewer' : null;
  if (!role) { f.n += 1; if (f.n >= 8) { f.until = Date.now() + 10 * 60000; f.n = 0; } fails.set(ip, f); return { ok: false, error: 'Mật khẩu không đúng' }; }
  fails.delete(ip);
  return { ok: true, role };
}

function loginPage(error) {
  const msg = error ? `<div class="err">${String(error).replace(/[<>&]/g, '')}</div>` : '';
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Đăng nhập | Việt Thiên Coffee Group</title><link rel="icon" href="assets/logo-vietthien.png"><meta name="theme-color" content="#0B1120">
<style>
:root{--bg:#0B1120;--card:#111B2E;--line:#23334F;--text:#F8FAFC;--muted:#94A3B8;--gold:#FBBF24}
*{box-sizing:border-box;margin:0;padding:0}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--text);font-family:-apple-system,'Segoe UI',Roboto,sans-serif;padding:16px}
.box{width:100%;max-width:380px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:28px 24px;box-shadow:0 10px 25px rgba(0,0,0,.5)}
.logo{width:72px;height:72px;margin:0 auto 12px;background:#fff;border-radius:14px;padding:4px;display:block}
h1{font-size:17px;text-align:center;letter-spacing:.5px}p{font-size:13px;color:var(--muted);text-align:center;margin:6px 0 20px}
label{font-size:12px;color:var(--muted)}input{width:100%;margin:6px 0 14px;padding:12px;border-radius:8px;border:1px solid var(--line);background:#0B1324;color:var(--text);font-size:16px}
input:focus{outline:none;border-color:#3B82F6}button{width:100%;padding:12px;border:none;border-radius:8px;background:linear-gradient(135deg,#B45309,#D97706);color:#fff;font-size:15px;font-weight:700;cursor:pointer}
.err{background:rgba(244,63,94,.14);border:1px solid rgba(244,63,94,.4);color:#FECDD3;padding:9px 12px;border-radius:8px;font-size:13px;margin-bottom:12px}
.foot{font-size:11px;color:var(--muted);text-align:center;margin-top:16px}
</style></head><body><form class="box" method="POST" action="login">
<img class="logo" src="assets/logo-vietthien.png" alt="Việt Thiên"><h1>VIỆT THIÊN COFFEE GROUP</h1><p>Hệ thống quản trị vị thế & phòng hộ giá cà phê</p>
${msg}<label for="pw">Mật khẩu truy cập</label><input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
<button type="submit">Đăng nhập</button><div class="foot">Mật khẩu chỉnh sửa hoặc mật khẩu chỉ xem do Phòng KD Xuất khẩu cấp</div></form></body></html>`;
}

module.exports = { getRole, setSession, clearSession, checkPassword, loginPage, isDirectLocal };

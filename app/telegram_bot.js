// VIỆT THIÊN COFFEE GROUP — Bot Telegram cảnh báo giá & tra cứu vị thế (Node.js thuần, không cần thư viện)
const fs = require('fs');
const path = require('path');
const engine = require('./public/engine');

const CONFIG_PATH = path.join(__dirname, 'data', 'bot_config.json');
const BRAND = 'VIỆT THIÊN COFFEE GROUP';
const DEFAULT_CONFIG = { enabled: false, botToken: '', chatId: '', alertThresholdUsd: 20, lastUpdateOffset: 0 };

function loadConfig() {
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) }; }
  catch (e) { return { ...DEFAULT_CONFIG }; }
}
function saveConfig(cfg) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8'); }

// Không bao giờ trả token đầy đủ ra giao diện web
function publicConfig() {
  const c = loadConfig(); const t = c.botToken || '';
  return { enabled: !!c.enabled, chatId: c.chatId, alertThresholdUsd: c.alertThresholdUsd,
    hasToken: !!t, tokenMasked: t ? `${t.slice(0, 6)}…${t.slice(-4)}` : '' };
}
function updateConfig(body) {
  const c = loadConfig();
  c.enabled = !!body.enabled;
  if (typeof body.botToken === 'string' && body.botToken.trim()) c.botToken = body.botToken.trim(); // để trống = giữ token cũ
  if (typeof body.chatId === 'string') c.chatId = body.chatId.trim();
  c.alertThresholdUsd = engine.pick(body.alertThresholdUsd, 20);
  saveConfig(c);
}

async function callApi(method, payload) {
  const cfg = loadConfig();
  if (!cfg.botToken) return { success: false, error: 'Chưa cấu hình Bot Token' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.botToken}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000)
    });
    const data = await res.json();
    return { success: !!data.ok, data, error: data.ok ? undefined : data.description };
  } catch (err) { return { success: false, error: err.message }; }
}
async function sendTelegramMessage(text, chatId) {
  const cfg = loadConfig();
  const to = chatId || cfg.chatId;
  if (!cfg.botToken || !to) return { success: false, error: 'Chưa cấu hình Token hoặc Chat ID' };
  return callApi('sendMessage', { chat_id: to, text, parse_mode: 'HTML' });
}

// ---------- Nội dung tin nhắn ----------
function front(quotes, key) { return ((quotes || {})[key] || [])[0]; }
function signed(n, d) { return engine.signed(n, d); }

function buildMarketReport(quotes, data) {
  const pos = engine.computePositions(data);
  const risk = engine.analyzeRisk(pos, { limit: data.riskLimit, priceMove: data.priceMoveUsd });
  const rb = front(quotes, 'coffee_liffe'); const ar = front(quotes, 'coffee_ice'); const ref = data.reference || {};
  const lines = [`☕ <b>${BRAND} — BÁO CÁO THỊ TRƯỜNG & VỊ THẾ</b>`, `<i>${(quotes && quotes.updated) || new Date().toLocaleString('vi-VN')}</i>`, ''];
  lines.push('📊 <b>GIÁ SÀN:</b>');
  if (rb) lines.push(`• Robusta London ${rb.Name} (${rb.Month}): <code>${engine.fmt(rb.Last, 0)} USD/tấn</code> (${signed(rb.Change)} | ${rb.PtcChange}%)`);
  else lines.push('• Robusta London: chưa lấy được giá');
  if (ar) lines.push(`• Arabica New York ${ar.Name} (${ar.Month}): <code>${engine.fmt(ar.Last, 2)} cts/lb</code> (${signed(ar.Change, 2)})`);
  lines.push('', '🌐 <b>THAM CHIẾU NỘI ĐỊA (nhập tay):</b>',
    `• Nhân xô: <code>${engine.fmt(ref.domesticPrice, 0)} VNĐ/kg</code>`, `• Tỷ giá: <code>${engine.fmt(ref.fxRate, 0)} VNĐ/USD</code>`, '',
    '🛡️ <b>VỊ THẾ CÔNG TY:</b>',
    `• Tổng vị thế ròng: <code>${engine.fmt(pos.totals.net)} tấn</code> — <b>${statusText(risk.status, pos.totals.net)}</b>`,
    `• Nếu London +${risk.move}$: <code>${signed(risk.mtmUp)} USD</code>`);
  const hedges = risk.alerts.filter(a => a.type === 'hedge');
  if (hedges.length) hedges.forEach(h => lines.push(`• ${engine.contractLabel(h.code)}: lệch ${engine.fmt(h.value)} t → <b>${h.action} ${h.lots} lot</b>`));
  else lines.push('• Vị thế từng kỳ hạn nằm trong hạn mức.');
  lines.push('', '👉 Chi tiết: http://localhost:3456');
  return lines.join('\n');
}
function statusText(status, total) {
  if (status === 'SHORT') return `🔴 SHORT (hụt ${engine.fmt(Math.abs(total), 1)} t)`;
  if (status === 'LONG') return `🟢 LONG (dư ${engine.fmt(total, 1)} t)`;
  return '🟡 CÂN BẰNG';
}
function buildPositionMessage(data) {
  const pos = engine.computePositions(data);
  const rows = pos.columns.map((c, i) => `• <b>${engine.contractLabel(c)} (${c})</b>: hàng thực ${engine.fmt(pos.physical[i])} | sàn ${engine.fmt(pos.futures[i])} | trừ lùi ${engine.fmt(pos.diff[i])} → <code>${engine.fmt(pos.net[i])} t</code>`);
  return [`📊 <b>${BRAND} — TỔNG VỊ THẾ THEO KỲ HẠN</b>`, '', ...rows, '',
    `🌟 <b>TỔNG VỊ THẾ RÒNG:</b> <code>${engine.fmt(pos.totals.net)} tấn</code> — ${statusText(pos.totals.net < 0 ? 'SHORT' : pos.totals.net > 0 ? 'LONG' : 'SQUARE', pos.totals.net)}`].join('\n');
}
function buildSpreadMessage(quotes, data) {
  const sp = engine.computeSpreads(data.columns, quotes);
  const rows = sp.map(s => `• <b>${s.pair}</b>: ${s.value === null ? 'chưa có giá' : `<code>${signed(s.value, 0)} USD</code> (${s.structure})`}`);
  return [`📈 <b>SPREAD KỲ HẠN ROBUSTA LONDON</b>`, '', ...rows, '',
    '<i>Spread = giá kỳ gần − giá kỳ xa. Dương = Inverted (giữ hàng qua kỳ bị thiệt), âm = Contango.</i>'].join('\n');
}
function buildFobMessage(quotes, data) {
  const fp = data.fobParams || {}; const prices = engine.quotePriceMap(quotes);
  const code = String(fp.contract || '').replace(/^RM/i, '');
  const london = prices[code] || engine.num((front(quotes, 'coffee_liffe') || {}).Last);
  const r = engine.computeFob(london, fp.diffUsd, fp.exchangeRate, fp.processingCostVnd);
  return [`🧮 <b>GIÁ FOB TỪ TRỪ LÙI</b> (kỳ hạn ${code || 'gần nhất'})`, '',
    `• London: <code>${engine.fmt(london, 0)} USD/tấn</code>`, `• Diff: <code>${signed(fp.diffUsd, 0)} USD/tấn</code>`,
    `• FOB HCM: <b><code>${engine.fmt(r.fobUsd, 0)} USD/tấn</code></b> ≈ <code>${engine.fmt(r.fobVndKg, 0)} VNĐ/kg</code>`,
    `• Giá nội địa tương đương: <code>${engine.fmt(r.domesticVndKg, 0)} VNĐ/kg</code> (trừ ${engine.fmt(fp.processingCostVnd, 0)} đ/kg chi phí)`].join('\n');
}
function buildAdviceMessage(quotes, data) {
  const pos = engine.computePositions(data);
  const risk = engine.analyzeRisk(pos, { limit: data.riskLimit, priceMove: data.priceMoveUsd });
  const out = [`🤖 <b>TRỢ LÝ VỊ THẾ — ${BRAND}</b>`, '', `Tổng vị thế ròng ${engine.fmt(pos.totals.net)} t: ${statusText(risk.status, pos.totals.net)}.`];
  if (risk.worstIdx >= 0 && risk.worstValue !== 0) out.push(`Kỳ hạn rủi ro nhất: ${engine.contractLabel(pos.columns[risk.worstIdx])} (${engine.fmt(risk.worstValue)} t).`);
  risk.alerts.forEach(a => {
    if (a.type === 'mismatch') out.push('⚠️ Lệch kỳ hạn: có tháng dư, có tháng hụt vượt nửa hạn mức — cân nhắc chi phí đảo kỳ (roll).');
    if (a.type === 'hedge') out.push(`🛡️ ${engine.contractLabel(a.code)}: ${a.action} ${a.lots} lot Robusta để về hạn mức ${risk.limit} t.`);
  });
  if (!risk.alerts.length) out.push('✅ Không có kỳ hạn nào vượt hạn mức.');
  return out.join('\n');
}
const HELP = `🤖 <b>${BRAND} — BOT VỊ THẾ</b>\n\n• <code>/gia</code> giá sàn & tóm tắt vị thế\n• <code>/vithe</code> tổng vị thế từng kỳ hạn\n• <code>/spread</code> chênh lệch các kỳ hạn\n• <code>/fob</code> giá FOB từ trừ lùi\n• <code>/tuvan</code> trợ lý phân tích & khuyến nghị phòng hộ`;

// ---------- Cảnh báo biến động giá ----------
let lastNotifiedPrice = null;
async function checkPriceAlerts(quotes) {
  const cfg = loadConfig();
  const rb = front(quotes, 'coffee_liffe');
  if (!cfg.enabled || !cfg.botToken || !cfg.chatId || !rb) return;
  const price = engine.num(rb.Last);
  if (lastNotifiedPrice === null) { lastNotifiedPrice = price; return; }
  const diff = price - lastNotifiedPrice;
  if (Math.abs(diff) >= engine.pick(cfg.alertThresholdUsd, 20)) {
    await sendTelegramMessage(`🚨 <b>${BRAND} — CẢNH BÁO GIÁ LONDON</b>\n\n• ${rb.Name} (${rb.Month}): <code>${engine.fmt(price, 0)} USD/tấn</code>\n• Biến động: <b>${diff > 0 ? '🟢 TĂNG' : '🔴 GIẢM'} ${engine.fmt(Math.abs(diff), 0)} USD</b> so với ${engine.fmt(lastNotifiedPrice, 0)}\n\n👉 Kiểm tra vị thế: http://localhost:3456`);
    lastNotifiedPrice = price;
  }
}

// ---------- Nhận lệnh chat ----------
let polling = false;
async function pollTelegramCommands(getQuotes, getData) {
  const cfg = loadConfig();
  if (!cfg.enabled || !cfg.botToken || polling) return;
  polling = true;
  try {
    const r = await callApi('getUpdates', { offset: (cfg.lastUpdateOffset || 0) + 1, timeout: 0 });
    if (!r.success || !Array.isArray(r.data.result)) return;
    for (const u of r.data.result) {
      const c = loadConfig(); c.lastUpdateOffset = u.update_id; saveConfig(c);
      const msg = u.message; if (!msg || !msg.text) continue;
      const text = msg.text.trim().toLowerCase().split('@')[0];
      let reply = null;
      if (text.startsWith('/start') || text.startsWith('/help')) reply = HELP;
      else if (text.startsWith('/gia')) reply = buildMarketReport(await getQuotes(), await getData());
      else if (text.startsWith('/vithe')) reply = buildPositionMessage(await getData());
      else if (text.startsWith('/spread')) reply = buildSpreadMessage(await getQuotes(), await getData());
      else if (text.startsWith('/fob')) reply = buildFobMessage(await getQuotes(), await getData());
      else if (text.startsWith('/tuvan')) reply = buildAdviceMessage(await getQuotes(), await getData());
      if (reply) await sendTelegramMessage(reply, msg.chat.id);
    }
  } finally { polling = false; }
}

module.exports = { loadConfig, publicConfig, updateConfig, sendTelegramMessage, buildMarketReport, checkPriceAlerts, pollTelegramCommands };

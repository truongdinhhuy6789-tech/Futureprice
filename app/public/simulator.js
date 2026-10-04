// Sàn CQG giả lập nội bộ — tuyệt đối không kết nối hay gửi lệnh thật.
(function () {
  'use strict';
  const KEY = 'vt_cqg_sim_v1';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
  const now = () => new Date().toLocaleTimeString('vi-VN', { hour12: false });
  const fresh = () => ({ price: 3450, cash: 500000000, marginPerLot: 97812000, feePerFill: 700000, seq: 1, orders: [], scenario: 'normal', lesson: '', log: [] });
  let s = load(), timer = null, bound = false;
  function load() { try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) { return fresh(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} }
  function log(text, kind) { s.log.unshift({ at: now(), text, kind: kind || '' }); s.log = s.log.slice(0, 40); }
  function activeOrders() { return s.orders.filter(o => ['WORKING', 'PARTIAL', 'PENDING CANCEL', 'PENDING REPLACE'].includes(o.status)); }
  function filledQty(o) { return Number(o.filled || 0); }
  function position() { return s.orders.reduce((n, o) => n + (o.side === 'BUY' ? 1 : -1) * filledQty(o), 0); }
  function avgEntry() {
    let q = 0, v = 0;
    s.orders.forEach(o => { const x = (o.side === 'BUY' ? 1 : -1) * filledQty(o); q += x; v += x * Number(o.avg || 0); });
    return q ? v / q : 0;
  }
  function usedMargin() { return Math.abs(position()) * s.marginPerLot; }
  function fees() { return s.orders.reduce((n, o) => n + (filledQty(o) ? s.feePerFill : 0), 0); }
  function pnl() { const q = position(); return q ? (s.price - avgEntry()) * 10 * q * 26000 : 0; }
  function available() { return s.cash + pnl() - usedMargin() - fees(); }
  function id() { return 'SIM-' + String(s.seq++).padStart(4, '0'); }
  function quoteRows() {
    return [-3, -2, -1, 0, 1, 2, 3].map(d => {
      const p = s.price + d, bid = Math.max(1, 12 - Math.abs(d) * 2), ask = Math.max(1, 10 - Math.abs(d) * 2);
      return `<tr class="${d === 0 ? 'at-market' : ''}"><td>${bid}</td><td>${money(p)}</td><td>${ask}</td></tr>`;
    }).join('');
  }
  function statusClass(x) { return x === 'FILLED' ? 'ok' : x === 'REJECTED' ? 'bad' : x.includes('PENDING') || x === 'PARTIAL' ? 'warn' : ''; }
  function orderRows() {
    if (!s.orders.length) return '<tr><td colspan="9" class="sim-empty">Chưa có lệnh — chọn bài tập rồi đặt lệnh demo.</td></tr>';
    return s.orders.slice().reverse().map(o => `<tr><td>${esc(o.id)}</td><td>${esc(o.at)}</td><td class="${o.side === 'BUY' ? 'sim-buy' : 'sim-sell'}">${o.side}</td><td>${esc(o.symbol)}</td><td>${o.qty}</td><td>${o.type}${o.type === 'LIMIT' ? ' @' + money(o.limit) : ''}</td><td>${o.filled}/${o.qty}${o.avg ? ' @' + money(o.avg) : ''}</td><td><span class="sim-status ${statusClass(o.status)}">${o.status}</span></td><td>${['WORKING','PARTIAL'].includes(o.status) ? `<button class="sim-mini" data-sim-cancel="${o.id}">Hủy</button><button class="sim-mini" data-sim-replace="${o.id}">Sửa</button>` : '—'}</td></tr>`).join('');
  }
  function positionAdvice() {
    const q = position(), target = s.lesson === 'sale38' ? 4 : 0, adjust = target - q;
    if (!s.lesson) return 'Chọn một bài tập để hệ thống chấm vị thế.';
    if (adjust === 0) return `✅ Đúng mục tiêu: futures ${q >= 0 ? '+' : ''}${q} lot; hàng thật −38,4 t → ròng ${(q * 10 - 38.4).toFixed(1)} t.`;
    return `Cần điều chỉnh: mục tiêu +${target} lot, hiện tại ${q >= 0 ? '+' : ''}${q} lot → ${adjust > 0 ? 'MUA' : 'BÁN'} ${Math.abs(adjust)} lot.`;
  }
  function render() {
    const root = $('simulatorRoot'); if (!root) return;
    root.innerHTML = `<div class="sim-warning">⚠️ <b>Giả lập nội bộ:</b> mọi nút bên dưới chỉ tạo dữ liệu học tập trong trình duyệt, không kết nối CQG/MXV.</div>
      <div class="sim-kpis"><div><small>Giá RMF27</small><b>${money(s.price)} USD/t</b></div><div><small>Vị thế futures</small><b class="${position() >= 0 ? 'sim-buy' : 'sim-sell'}">${position() >= 0 ? '+' : ''}${position()} lot</b></div><div><small>P/L giả lập</small><b class="${pnl() >= 0 ? 'sim-buy' : 'sim-sell'}">${money(pnl())} đ</b></div><div><small>Available Margin</small><b class="${available() >= 0 ? '' : 'sim-sell'}">${money(available())} đ</b></div></div>
      <div class="sim-layout"><div class="sim-dom-wrap"><h3>DOM · RMF27</h3><table class="sim-dom"><thead><tr><th>BID</th><th>GIÁ</th><th>ASK</th></tr></thead><tbody>${quoteRows()}</tbody></table><div class="sim-market-tools"><button class="btn btn-outline btn-sm" data-sim-move="-10">−10</button><button class="btn btn-outline btn-sm" data-sim-move="10">+10</button><button class="btn btn-outline btn-sm" id="simToggle">${timer ? '⏸ Dừng giá' : '▶ Chạy giá'}</button></div></div>
      <div class="sim-ticket"><h3>Phiếu lệnh demo</h3><label>Bài tập<select id="simLesson" class="form-control"><option value="">Tự do</option><option value="sale38" ${s.lesson === 'sale38' ? 'selected' : ''}>Bán hàng thật 38,4 t → cần BUY 4</option></select></label><div class="sim-form-row"><label>Tài khoản<input class="form-control" value="DEMO-VT" disabled></label><label>Mã<select id="simSymbol" class="form-control"><option>RMF27</option><option>RMH27</option><option>RMK27</option></select></label></div><div class="sim-form-row"><label>Chiều<select id="simSide" class="form-control"><option>BUY</option><option>SELL</option></select></label><label>Số lot<input id="simQty" type="number" min="1" max="20" value="4" class="form-control"></label></div><div class="sim-form-row"><label>Loại<select id="simType" class="form-control"><option>LIMIT</option><option>MARKET</option></select></label><label>Giá Limit<input id="simLimit" type="number" value="${s.price}" class="form-control"></label></div><label>Kịch bản<select id="simScenario" class="form-control"><option value="normal" ${s.scenario === 'normal' ? 'selected' : ''}>Bình thường</option><option value="partial" ${s.scenario === 'partial' ? 'selected' : ''}>Khớp một phần</option><option value="reject" ${s.scenario === 'reject' ? 'selected' : ''}>Rejected – thiếu ký quỹ/quyền</option><option value="disconnect" ${s.scenario === 'disconnect' ? 'selected' : ''}>Mất kết nối – trạng thái chưa rõ</option></select></label><div class="sim-send"><button class="btn sim-buy-btn" data-sim-send="BUY">BUY DEMO</button><button class="btn sim-sell-btn" data-sim-send="SELL">SELL DEMO</button></div></div></div>
      <div class="sim-coach"><b>🎯 Huấn luyện viên:</b> ${esc(positionAdvice())}</div>
      <div class="table-scroll"><table class="data-table sim-orders"><thead><tr><th>Order ID</th><th>Giờ</th><th>Chiều</th><th>Mã</th><th>SL</th><th>Loại</th><th>Khớp</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>${orderRows()}</tbody></table></div>
      <details class="sim-log"><summary>Nhật ký & giải thích trạng thái</summary><div>${s.log.map(x => `<p class="${x.kind}"><time>${x.at}</time> ${esc(x.text)}</p>`).join('') || '<p>Chưa có thao tác.</p>'}</div></details>
      <div class="sim-footer"><button id="simReset" class="btn btn-outline">↺ Làm lại bài tập</button><span>Ký quỹ giả lập: ${money(s.marginPerLot)} đ/lot · Phí giả lập: ${money(s.feePerFill)} đ/lệnh có khớp</span></div>`;
    bind();
  }
  function place(side) {
    const qty = Math.max(1, Number($('simQty').value || 1)), type = $('simType').value, limit = Number($('simLimit').value || s.price), symbol = $('simSymbol').value;
    s.scenario = $('simScenario').value; s.lesson = $('simLesson').value;
    const o = { id: id(), at: now(), side, symbol, qty, type, limit, filled: 0, avg: 0, status: 'WORKING' };
    if (s.scenario === 'reject' || available() < s.marginPerLot * qty) { o.status = 'REJECTED'; log(`${o.id} bị từ chối: kiểm tra quyền tài khoản, hạn mức và ký quỹ. Không gửi lặp.`, 'bad'); }
    else if (s.scenario === 'disconnect') { o.status = 'PENDING NEW'; log(`${o.id} mất kết nối: trạng thái chưa rõ. Dừng bấm và gọi broker với Order ID này.`, 'warn'); }
    else if (s.scenario === 'partial' && qty > 1) { o.filled = Math.max(1, Math.floor(qty / 2)); o.avg = type === 'MARKET' ? s.price + (side === 'BUY' ? 2 : -2) : limit; o.status = 'PARTIAL'; log(`${o.id} khớp một phần ${o.filled}/${qty}; phần còn lại ${qty - o.filled} lot vẫn Working.`, 'warn'); }
    else if (type === 'MARKET' || (side === 'BUY' ? limit >= s.price + 1 : limit <= s.price - 1)) { o.filled = qty; o.avg = type === 'MARKET' ? s.price + (side === 'BUY' ? 2 : -2) : limit; o.status = 'FILLED'; log(`${o.id} đã Filled ${qty} lot ${side} @${money(o.avg)}.`); }
    else log(`${o.id} đang Working; chưa được tính là đã phòng hộ.`);
    s.orders.push(o); save(); render();
  }
  function cancelOrder(orderId) {
    const o = s.orders.find(x => x.id === orderId); if (!o) return;
    o.status = 'PENDING CANCEL'; log(`${o.id} đang Pending Cancel; vẫn có thể khớp trước khi nhận xác nhận.`, 'warn'); render();
    setTimeout(() => { o.status = 'CANCELED'; log(`${o.id} đã Canceled; phần đã Filled (nếu có) vẫn giữ nguyên.`); save(); render(); }, 700);
  }
  function replaceOrder(orderId) {
    const o = s.orders.find(x => x.id === orderId); if (!o) return;
    const v = prompt('Giá Limit mới (demo):', String(o.limit)); if (v === null) return; const p = Number(v); if (!p) return;
    o.status = 'PENDING REPLACE'; log(`${o.id} đang Pending Replace; không gửi sửa lần hai.`, 'warn'); render();
    setTimeout(() => { o.limit = p; o.status = o.filled ? 'PARTIAL' : 'WORKING'; log(`${o.id} đã Replaced giá mới ${money(p)}.`); save(); render(); }, 700);
  }
  function movePrice(d) { s.price = Math.max(500, s.price + Number(d)); match(); save(); render(); }
  function match() {
    s.orders.forEach(o => {
      if (!['WORKING','PARTIAL'].includes(o.status)) return;
      const hit = o.type === 'MARKET' || (o.side === 'BUY' ? o.limit >= s.price + 1 : o.limit <= s.price - 1); if (!hit) return;
      const left = o.qty - o.filled; if (left <= 0) return; o.avg = o.filled ? ((o.avg * o.filled + s.price * left) / o.qty) : s.price; o.filled = o.qty; o.status = 'FILLED'; log(`${o.id} vừa Filled toàn bộ ${o.qty} lot @${money(o.avg)}.`);
    });
  }
  function toggle() { if (timer) { clearInterval(timer); timer = null; render(); return; } timer = setInterval(() => movePrice(Math.round((Math.random() - .5) * 8)), 1800); render(); }
  function bind() {
    const root = $('simulatorRoot'); if (!root) return;
    root.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.simSend) place(b.dataset.simSend); else if (b.dataset.simCancel) cancelOrder(b.dataset.simCancel); else if (b.dataset.simReplace) replaceOrder(b.dataset.simReplace); else if (b.dataset.simMove) movePrice(b.dataset.simMove); else if (b.id === 'simToggle') toggle(); else if (b.id === 'simReset' && confirm('Xóa toàn bộ dữ liệu giả lập trên trình duyệt này?')) { if (timer) clearInterval(timer); timer = null; s = fresh(); save(); render(); } };
    $('simScenario').onchange = e => { s.scenario = e.target.value; save(); };
    $('simLesson').onchange = e => { s.lesson = e.target.value; save(); render(); };
  }
  window.VTSimulator = { render };
})();

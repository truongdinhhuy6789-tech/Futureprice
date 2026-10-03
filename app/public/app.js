// VIỆT THIÊN COFFEE GROUP — Giao diện quản trị vị thế (mọi công thức nằm trong engine.js)
(function () {
  'use strict';
  const E = window.VTEngine, CH = window.VTCharts;
  const $ = id => document.getElementById(id);
  const state = {
    data: E.defaultData(), market: null, quotes: null, fx: null, history: {}, prevLast: {},
    dirty: false, tab: 'overview', live: false, fetchedAt: null, changedAt: null, pollTimer: null
  };
  window.VTApp = { getState: () => state, recalc: () => recalcAll(), ledgerChanged: msg => ledgerChanged(msg), showTab: t => showTab(t), toast: (m, t) => toast(m, t) };

  // ---------- Tiện ích ----------
  const fmt = (n, d) => E.fmt(n, d);
  const signed = (n, d) => E.signed(n, d);
  const colorOf = v => (v < 0 ? 'var(--red)' : v > 0 ? 'var(--green)' : 'var(--text-muted)');
  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const timeOf = unix => { const n = Number(unix); if (!n) return '—'; const d = new Date(n * 1000); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} ${d.getDate()}/${d.getMonth() + 1}`; };
  const ago = iso => { if (!iso) return '—'; const s = Math.max(0, Math.round((Date.now() - new Date(iso)) / 1000)); return s < 60 ? `${s} giây trước` : s < 3600 ? `${Math.round(s / 60)} phút trước` : new Date(iso).toLocaleString('vi-VN'); };
  function toast(msg, type) {
    let t = $('vtToast');
    if (!t) { t = document.createElement('div'); t.id = 'vtToast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = `toast show ${type || ''}`;
    clearTimeout(t._h); t._h = setTimeout(() => { t.className = 'toast'; }, 2800);
  }
  async function api(url, body) {
    const opt = body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    const res = await fetch(url, opt);
    if (res.status === 401) { location.href = '/login'; throw new Error('Cần đăng nhập'); }
    return res.json();
  }
  const isViewer = () => state.role === 'viewer';
  function setDirty(v) {
    if (isViewer()) v = false; // tài khoản chỉ xem: không lưu, không nhắc lưu
    state.dirty = v;
    document.querySelectorAll('.btn-save').forEach(b => {
      b.classList.toggle('unsaved', v);
      const base = b.id === 'btnSaveMatrix' ? 'Lưu vị thế' : 'Lưu';
      b.innerHTML = `<span class="icon">💾</span> ${base}${v ? ' •' : ''}`;
    });
  }

  // ---------- Thẻ (tab) ----------
  function showTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.dataset.panel !== tab; });
    try { localStorage.setItem('vt_tab', tab); } catch (e) { /* bỏ qua */ }
    if (tab === 'overview') renderOverview();
    if (tab === 'hedge') renderHedge();
    if (tab === 'board') renderBoard();
    if (tab === 'contracts' && window.VTContracts) window.VTContracts.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('tabBar').addEventListener('click', e => { const b = e.target.closest('.tab-btn'); if (b) showTab(b.dataset.tab); });

  // ---------- Đồng hồ, phiên giao dịch, độ tươi của giá ----------
  function tick() {
    const n = new Date();
    $('liveClock').textContent = `${n.toLocaleTimeString('vi-VN', { hour12: false })} ${n.toLocaleDateString('vi-VN')}`;
    const s = E.sessionStatus('robusta', n);
    $('sessionInfo').innerHTML = `<span class="sess-dot ${s.open ? 'on' : ''}"></span>${s.text}`;
    const src = state.quotes && state.quotes.updated ? `Nguồn cập nhật: <b>${esc(state.quotes.updated)}</b>` : '';
    $('footerConnection').innerHTML = `${src}${src ? ' · ' : ''}Kiểm tra giá: <b>${ago(state.fetchedAt)}</b>`;
  }
  setInterval(tick, 1000); tick();
  function setLive(ok, msg) {
    state.live = ok;
    $('marketStatus').innerHTML = ok
      ? '<span class="pulse-dot"></span><span class="status-text">Trực tuyến</span>'
      : `<span class="pulse-dot" style="background:var(--yellow)"></span><span class="status-text" style="color:var(--yellow)">${msg || 'Đang kết nối lại…'}</span>`;
  }

  // ---------- Nhận dữ liệu thời gian thực ----------
  // Trong máy/LAN: luồng SSE – máy chủ đẩy ngay khi giá đổi.
  // Qua link online (Cloudflare không cho luồng SSE đi qua): hỏi giá mỗi 3 giây, giá chưa đổi chỉ nhận gói nhỏ.
  const POLL_MS = 3000;
  function applySnapshot(snap) {
    if (!snap) return;
    if (snap.fx && (!state.fx || snap.fx.fetchedAt !== state.fx.fetchedAt)) applyFx(snap.fx);
    if (snap.domestic && (!state.domestic || snap.domestic.fetchedAt !== state.domestic.fetchedAt)) applyDomestic(snap.domestic);
    state.fetchedAt = snap.fetchedAt || state.fetchedAt; state.changedAt = snap.changedAt || state.changedAt;
    if (snap.data) {
      const changed = {};
      ['coffee_liffe', 'coffee_ice', 'brazil_coffee'].forEach(k => (snap.data[k] || []).forEach(q => {
        const prev = state.prevLast[q.Name]; const now = E.num(q.Last);
        if (prev !== undefined && prev !== now) changed[q.Name] = now > prev ? 'up' : 'down';
        state.prevLast[q.Name] = now;
      }));
      state.quotes = snap.data;
      renderQuotes(changed);
    }
    if (snap.success === false && snap.error) setLive(state.live, 'Nguồn giá lỗi: ' + snap.error);
    tick();
  }
  // Có người khác vừa lưu số liệu vị thế → tải lại (hoặc nhắc nếu mình đang sửa dở)
  function onPositions(updatedAt) {
    if (!updatedAt || !state.data || state.saving || state.reloading || updatedAt === state.data.updatedAt) return;
    if (state.dirty) {
      if (state.warnedAt !== updatedAt) { state.warnedAt = updatedAt; toast('⚠️ Có người vừa lưu số liệu vị thế mới – bạn đang có thay đổi chưa lưu', 'error'); }
      return;
    }
    state.reloading = true;
    loadData().then(() => toast('🔄 Số liệu vị thế vừa được cập nhật')).finally(() => { state.reloading = false; });
  }
  function connectStream() {
    if (state.tunnel || !window.EventSource) return startPolling();
    const es = new EventSource('/api/stream'); let fails = 0, gotData = false, lastMsg = Date.now();
    const seen = () => { lastMsg = Date.now(); fails = 0; };
    const fallback = () => { clearInterval(watchdog); es.close(); startPolling(); };
    // Luồng bị proxy giữ lại: 8 giây chưa có giá đầu tiên, hoặc im lặng 40 giây → chuyển sang hỏi giá định kỳ
    const watchdog = setInterval(() => { if (Date.now() - lastMsg > (gotData ? 40000 : 8000)) fallback(); }, 2000);
    es.onerror = () => { setLive(false); if (++fails >= 5) fallback(); };
    es.addEventListener('quotes', e => { seen(); gotData = true; setLive(true); applySnapshot(JSON.parse(e.data)); });
    es.addEventListener('heartbeat', e => {
      seen(); const h = JSON.parse(e.data); state.fetchedAt = h.fetchedAt || state.fetchedAt;
      if (h.ok) setLive(true); else setLive(false, 'Nguồn giá gián đoạn – dùng giá gần nhất');
    });
    es.addEventListener('fx', e => { seen(); applyFx(JSON.parse(e.data)); });
    es.addEventListener('domestic', e => { seen(); applyDomestic(JSON.parse(e.data)); });
    es.addEventListener('positions', e => { seen(); onPositions(JSON.parse(e.data).updatedAt); });
  }
  async function pollOnce() {
    try {
      const snap = await api('/api/live-quotes' + (state.changedAt ? '?since=' + encodeURIComponent(state.changedAt) : ''));
      if (snap.success === false) setLive(false, 'Nguồn giá gián đoạn – dùng giá gần nhất'); else setLive(true);
      applySnapshot(snap); onPositions(snap.positionsAt);
    } catch (e) { setLive(false, 'Mất kết nối – đang thử lại'); }
  }
  function startPolling() {
    if (state.pollTimer) return;
    pollOnce(); state.pollTimer = setInterval(() => { if (!document.hidden) pollOnce(); }, POLL_MS);
  }
  // Mở lại tab / mở khóa điện thoại → cập nhật ngay, không chờ nhịp kế tiếp
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.pollTimer) pollOnce(); });

  // ---------- Kiểm tra lại giá (lấy lại ngay từ giacaphe.com) ----------
  async function recheck() {
    const box = $('recheckStatus'); box.hidden = false; box.className = 'recheck-status';
    box.innerHTML = '⏳ Đang kiểm tra lại giá với giacaphe.com…';
    const before = JSON.stringify(((state.quotes || {}).coffee_liffe || []).map(q => [q.Name, q.Last]));
    try {
      const snap = await api('/api/live-quotes', {});
      applySnapshot(snap);
      const after = ((snap.data || {}).coffee_liffe || []);
      const t = new Date().toLocaleTimeString('vi-VN', { hour12: false });
      if (!snap.success) { box.className = 'recheck-status bad'; box.innerHTML = `⚠️ ${t}: Không lấy được giá (${esc(snap.error)}). Đang hiển thị giá gần nhất.`; }
      else if (JSON.stringify(after.map(q => [q.Name, q.Last])) === before) { box.className = 'recheck-status good'; box.innerHTML = `✅ ${t}: Đã kiểm tra lại – giá <b>khớp</b> trang nguồn giacaphe.com (nguồn cập nhật ${esc(snap.data.updated)}).`; }
      else { box.className = 'recheck-status good'; box.innerHTML = `🔄 ${t}: Đã cập nhật giá mới từ giacaphe.com – ${after.slice(0, 3).map(q => `${q.Name} ${fmt(q.Last)}`).join(' · ')}.`; }
    } catch (e) { box.className = 'recheck-status bad'; box.innerHTML = '⚠️ Không kết nối được máy chủ hệ thống.'; }
    clearTimeout(box._h); box._h = setTimeout(() => { box.hidden = true; }, 15000);
  }
  $('btnRecheck').addEventListener('click', recheck);
  document.querySelectorAll('[data-recheck]').forEach(b => b.addEventListener('click', recheck));

  // ---------- Thẻ giá nhanh ----------
  function renderTicker(prefix, item, digits, unit) {
    if (!item) return;
    const c = E.num(item.Change);
    $(`${prefix}Code`).textContent = `${item.Name} (${item.Month})`;
    $(`${prefix}Price`).innerHTML = `${fmt(item.Last, digits)} <span class="unit">${unit}</span>`;
    $(`${prefix}Change`).className = `price-change ${c > 0 ? 'positive' : c < 0 ? 'negative' : 'neutral'}`;
    $(`${prefix}Change`).textContent = `${signed(c, digits)} (${item.PtcChange}%)`;
    $(`${prefix}High`).textContent = fmt(item.High, digits); $(`${prefix}Low`).textContent = fmt(item.Low, digits);
    $(`${prefix}Time`).textContent = timeOf(item.Time);
  }
  function renderQuotes(changed) {
    const q = state.quotes || {};
    renderTicker('robusta', (q.coffee_liffe || [])[0], 0, 'USD/tấn');
    renderTicker('arabica', (q.coffee_ice || [])[0], 2, 'cents/lb');
    ['robusta', 'arabica'].forEach(k => {
      const first = ((k === 'robusta' ? q.coffee_liffe : q.coffee_ice) || [])[0];
      if (first && changed[first.Name]) flash($(`card${k[0].toUpperCase() + k.slice(1)}`), changed[first.Name]);
    });
    renderCalcOptions(); calculateFob(); renderSpreads();
    if (state.tab === 'overview') renderOverview();
    if (state.tab === 'board') renderBoard(changed);
    if (state.tab === 'hedge') renderHedge();
    refreshAssistant();
  }
  function flash(node, dir) { if (!node) return; node.classList.remove('flash-up', 'flash-down'); void node.offsetWidth; node.classList.add(dir === 'up' ? 'flash-up' : 'flash-down'); }

  // ---------- Tỷ giá Vietcombank ----------
  function applyFx(fx) {
    if (!fx || !fx.transfer) return;
    state.fx = fx;
    $('fxRate').innerHTML = `${fmt(fx.transfer, 0)} <span class="unit">VNĐ</span>`;
    $('fxCash').textContent = fmt(fx.cash, 0); $('fxSell').textContent = fmt(fx.sell, 0);
    $('fxSource').textContent = `VCB ${new Date(fx.updatedDate || fx.fetchedAt).toLocaleDateString('vi-VN')}`;
    if (state.data.fobParams.fxAuto) { state.data.fobParams.exchangeRate = fx.transfer; $('calcFxInput').value = fx.transfer; calculateFob(); }
    if (state.tab === 'hedge') renderHedge();
  }
  const fxNow = () => (state.fx && state.fx.transfer) || state.data.fobParams.exchangeRate || state.data.reference.fxRate;

  // ---------- Spread ----------
  function renderSpreads() {
    const sp = E.computeSpreads(state.data.columns, state.quotes);
    $('spreadItems').innerHTML = sp.map(s => {
      const tag = s.value === null ? '<span class="tag">Chưa có giá</span>'
        : `<span class="tag ${s.structure === 'Inverted' ? 'inverted' : 'contango'}">${s.structure === 'Inverted' ? 'Nghịch đảo' : s.structure === 'Contango' ? 'Bình thường' : 'Phẳng'}</span>`;
      return `<div class="spread-pill"><span class="label">${s.pair}</span><span class="val" style="color:${s.value === null ? 'var(--text-muted)' : colorOf(s.value)}">${s.value === null ? '—' : signed(s.value) + ' USD'}</span>${tag}</div>`;
    }).join('');
    sp.forEach((s, i) => { const th = $(`spreadHead_${i + 1}`); if (th) th.textContent = s.value === null ? `${s.pair}: —` : `${s.pair} = ${signed(s.value)}`; });
  }

  // ---------- Ma trận vị thế ----------
  function renderMatrix() {
    const cols = state.data.columns; const now = new Date();
    const expired = cols.filter(c => E.isExpired(c, now));
    $('rollBanner').hidden = !expired.length; $('rollBannerCodes').textContent = expired.join(', ');
    $('positionHead').innerHTML =
      `<tr class="row-spread-header"><th class="col-title text-left">SPREAD (USD/tấn)</th>${cols.map((c, i) => `<th class="spread-cell" id="spreadHead_${i}">${i === 0 ? '—' : ''}</th>`).join('')}<th class="spread-cell total-header">TỔNG</th></tr>`
      + `<tr class="row-col-headers"><th class="col-title text-left">DANH MỤC</th>${cols.map(c => `<th${E.isExpired(c, now) ? ' class="col-expired" title="Kỳ hạn đã đến tháng giao hàng"' : ''}>${E.contractLabel(c)}<br><span class="month-code">${c}</span></th>`).join('')}<th class="col-total">TỔNG</th></tr>`;
    const html = [];
    // Dòng hợp đồng (📒 hàng thật) và 2 dòng Robusta sàn (📉 hàng ảo) lấy số từ thẻ Giao dịch (chỉ đọc); tồn kho, Arabica, dòng theo dõi vẫn nhập tay
    const eff = E.effectiveMatrix(state.data); const TRADE_KEYS = Object.values(E.TRADE_ROWS);
    const rowHtml = r => {
      const kind = E.CONTRACT_ROWS.includes(r.key) ? 'ct' : TRADE_KEYS.includes(r.key) ? 'tr' : '';
      const cells = cols.map(c => {
        const v = E.num(((kind ? eff : state.data.matrix)[r.key] || {})[c]);
        if (kind) return `<td class="ledger-cell" data-goto="contracts" title="${kind === 'ct' ? 'Số từ Sổ hợp đồng (hàng thật)' : 'Số từ sổ Lệnh sàn (hàng ảo)'} – ghi / sửa ở thẻ 📒 Giao dịch">${v ? fmt(v) : '<span class="ledger-zero">0</span>'}</td>`;
        return `<td><input type="number" step="${r.unit === 'lot' ? 1 : 0.01}" inputmode="decimal" class="cell-input" data-key="${r.key}" data-code="${c}" value="${v === 0 ? '' : v}" placeholder="0"${isViewer() ? ' disabled' : ''}></td>`;
      }).join('');
      const tag = kind === 'ct' ? ' <button type="button" class="ledger-tag" data-goto="contracts" title="Mở Sổ hợp đồng">📒 sổ HĐ</button>'
        : kind === 'tr' ? ' <button type="button" class="ledger-tag" data-goto="contracts" title="Mở sổ Lệnh sàn">📉 lệnh sàn</button>' : '';
      return `<tr class="data-row${kind ? ' ledger-row' : ''}"><td class="row-label">${r.label} (${r.unit === 'lot' ? 'lot' : 'tấn'})${tag}</td>${cells}<td class="row-sum" id="sum_${r.key}">0.00</td></tr>`;
    };
    const subtotal = (id, label, gold) => `<tr class="${gold ? 'highlight-net-position-row' : 'subtotal-row'}"><td class="row-label bold">${label}</td>${cols.map((c, i) => `<td class="${gold ? 'net-val' : 'calc-val'} bold" id="${id}_${i}">0.00</td>`).join('')}<td class="${gold ? 'net-val bold total-highlight' : 'calc-val bold total-cell'}" id="${id}_sum">0.00</td></tr>`;
    ['physical', 'futures', 'diff', 'memo'].forEach(g => {
      html.push(`<tr class="section-divider-row"><td colspan="${cols.length + 2}">${E.GROUPS[g]}</td></tr>`);
      E.ROWS.filter(r => r.group === g).forEach(r => html.push(rowHtml(r)));
      if (g === 'physical') html.push(subtotal('phys', 'Vị thế hàng thực (tấn)'));
      if (g === 'futures') html.push(subtotal('fut', 'Vị thế tài khoản sàn (tấn)'));
      if (g === 'diff') { html.push(subtotal('dif', 'Vị thế trừ lùi chưa chốt giá (tấn)')); html.push(subtotal('net', '⭐ TỔNG VỊ THẾ RÒNG (tấn)', true)); }
    });
    $('positionBody').innerHTML = html.join('');
    renderSpreads();
  }
  function recalcAll() {
    const pos = E.computePositions(state.data);
    E.ROWS.forEach(r => { const el = $(`sum_${r.key}`); if (el) { const v = pos.rowSums[r.key]; el.textContent = fmt(v, r.unit === 'lot' ? 0 : 2); el.style.color = colorOf(v); } });
    const fill = (id, arr, total, gold) => {
      arr.forEach((v, i) => { const el = $(`${id}_${i}`); if (el) { el.textContent = fmt(v); el.style.color = gold ? (v < 0 ? '#F87171' : v > 0 ? '#4ADE80' : '#FEF08A') : colorOf(v); } });
      const s = $(`${id}_sum`); if (s) { s.textContent = fmt(total); s.style.color = gold ? (total < 0 ? '#F87171' : '#FDE047') : colorOf(total); }
    };
    fill('phys', pos.physical, pos.totals.physical); fill('fut', pos.futures, pos.totals.futures);
    fill('dif', pos.diff, pos.totals.diff); fill('net', pos.net, pos.totals.net, true);
    renderRisk(pos);
    if (state.tab === 'overview') renderOverview();
    refreshAssistant();
  }
  function renderRisk(pos) {
    const d = state.data; const risk = E.analyzeRisk(pos, { limit: d.riskLimit, priceMove: d.priceMoveUsd }); const t = pos.totals.net;
    $('metricNetExposure').textContent = `${fmt(t)} tấn`;
    $('metricNetExposure').className = `metric-val ${t < 0 ? 'negative' : t > 0 ? 'positive' : ''}`;
    $('metricStatusShort').innerHTML = t < 0 ? `<b style="color:var(--red)">SHORT – hụt ${fmt(Math.abs(t), 1)} t</b>` : t > 0 ? `<b style="color:var(--green)">LONG – dư ${fmt(t, 1)} t</b>` : '<b>CÂN BẰNG</b>';
    if (risk.worstIdx >= 0 && risk.worstValue !== 0) { $('metricWorstMonth').textContent = `${E.contractLabel(pos.columns[risk.worstIdx])}: ${fmt(risk.worstValue)} t`; $('metricWorstMonth').style.color = colorOf(risk.worstValue); }
    else { $('metricWorstMonth').textContent = 'An toàn'; $('metricWorstMonth').style.color = 'var(--green)'; }
    $('metricMtmPnl').textContent = `${signed(risk.mtmUp)} USD`; $('metricMtmPnl').style.color = colorOf(risk.mtmUp);
    $('metricMtmNote').textContent = `Nếu London tăng ${fmt(risk.move, 0)}$ (giảm thì ngược dấu)`;
    const lbl = i => E.contractLabel(pos.columns[i]);
    const alerts = risk.alerts.map(a => a.type === 'mismatch'
      ? `<div class="alert-box warning"><div class="alert-icon">⚠️</div><div class="alert-text"><b>Lệch kỳ hạn:</b> dư ở ${a.longs.map(x => `${lbl(x.i)} (+${fmt(x.v)} t)`).join(', ')}, hụt ở ${a.shorts.map(x => `${lbl(x.i)} (${fmt(x.v)} t)`).join(', ')}. Spread dãn sẽ làm tăng chi phí đảo kỳ.</div></div>`
      : `<div class="alert-box info"><div class="alert-icon">🛡️</div><div class="alert-text"><b>${lbl(a.index)} (${a.code}):</b> lệch <b>${fmt(a.value)} t</b> > hạn mức ${fmt(risk.limit, 0)} t → <b>${a.action} ${a.lots} lot</b> RM${a.code}.</div></div>`);
    $('advisoryAlerts').innerHTML = alerts.length ? alerts.join('') : `<div class="alert-box info"><div class="alert-icon">✅</div><div class="alert-text">Tất cả kỳ hạn trong hạn mức ${fmt(risk.limit, 0)} tấn.</div></div>`;
  }

  // ---------- 1. Tổng quan cho sếp ----------
  function renderOverview() {
    const d = state.data; const pos = E.computePositions(d);
    const risk = E.analyzeRisk(pos, { limit: d.riskLimit, priceMove: d.priceMoveUsd }); const t = pos.totals.net;
    const hero = $('execHero'); hero.className = `exec-hero ${t < 0 ? 'short' : t > 0 ? 'long' : 'square'}`;
    $('execNet').textContent = `${signed(t, 1)} tấn`;
    $('execStatus').innerHTML = t < 0 ? '🔴 SHORT – đang HỤT hàng, giá tăng thì lỗ' : t > 0 ? '🟢 LONG – đang DƯ hàng, giá giảm thì lỗ' : '🟡 CÂN BẰNG – rủi ro giá thấp';
    $('execSub').textContent = `Hàng thực ${signed(pos.totals.physical, 1)} · Sàn ${signed(pos.totals.futures, 1)} · Trừ lùi ${signed(pos.totals.diff, 1)} (tấn)`;
    $('kpiMtm').innerHTML = `<span style="color:${colorOf(risk.mtmUp)}">${signed(risk.mtmUp)}</span> <small>USD</small>`;
    $('kpiMtmSub').textContent = `London +${fmt(risk.move, 0)}$/t → ${signed(risk.mtmUp)} USD · −${fmt(risk.move, 0)}$/t → ${signed(-risk.mtmUp)} USD`;
    const hedges = risk.alerts.filter(a => a.type === 'hedge');
    const lots = hedges.reduce((s, a) => s + a.lots, 0);
    $('kpiHedge').innerHTML = hedges.length ? `${lots} <small>lot</small>` : '<span style="color:var(--green)">Không cần</span>';
    $('kpiHedgeSub').textContent = hedges.length ? hedges.map(a => `${a.action} ${a.lots} lot ${a.code}`).join(' · ') : `Mọi kỳ hạn trong hạn mức ${fmt(risk.limit, 0)} t`;
    const sp = E.computeSpreads(d.columns, state.quotes).filter(s => s.value !== null);
    const inv = sp.filter(s => s.structure === 'Inverted').length;
    const front = ((state.quotes || {}).coffee_liffe || [])[0];
    $('kpiMarket').innerHTML = !sp.length ? '—' : inv > sp.length / 2 ? '<span style="color:var(--yellow)">Nghịch đảo</span>' : '<span style="color:var(--blue)">Bình thường</span>';
    $('kpiMarketSub').textContent = front ? `${front.Name} ${fmt(front.Last)} USD/t (${signed(front.Change)}) · ${sp.length ? (inv > sp.length / 2 ? 'kỳ gần đắt hơn kỳ xa' : 'kỳ xa cao hơn kỳ gần') : ''}` : 'Chưa có giá sàn';
    CH.netBars($('chartNet'), { values: pos.net, labels: pos.columns.map(E.contractLabel), codes: pos.columns, limit: d.riskLimit,
      breakdown: pos.columns.map((c, i) => ({ physical: pos.physical[i], futures: pos.futures[i], diff: pos.diff[i] })), title: 'Vị thế ròng theo kỳ hạn' });
    $('chartNetTable').innerHTML = `<table class="data-table"><tr><th>Kỳ hạn</th><th>Hàng thực</th><th>Sàn</th><th>Trừ lùi</th><th>Ròng</th></tr>${pos.columns.map((c, i) => `<tr><td>${E.contractLabel(c)} (${c})</td><td>${fmt(pos.physical[i])}</td><td>${fmt(pos.futures[i])}</td><td>${fmt(pos.diff[i])}</td><td style="color:${colorOf(pos.net[i])}"><b>${fmt(pos.net[i])}</b></td></tr>`).join('')}</table>`;
    $('execSummary').innerHTML = (window.VTAssistant ? window.VTAssistant.summary(state) : []).map(s => `<li>${s}</li>`).join('');
    $('execUpdated').textContent = `Số liệu vị thế lưu lúc: ${d.updatedAt ? new Date(d.updatedAt).toLocaleString('vi-VN') : 'chưa lưu'}`;
    renderCurve();
  }

  // Đường cong kỳ hạn + lịch sử
  const SERIES_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#9085e9']; // đã kiểm tra tương phản & mù màu trên nền tối
  function fillCompareOptions() {
    const days = Object.keys(state.history).sort().reverse();
    const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
    const pickNear = back => { const t = new Date(Date.now() - back * 86400000 + 7 * 3600 * 1000).toISOString().slice(0, 10); return days.find(x => x <= t && x !== today) || ''; };
    const opts = '<option value="">— không —</option>' + days.filter(x => x !== today).map(x => `<option value="${x}">${x.split('-').reverse().join('/')}</option>`).join('');
    [['curveCompare1', 7], ['curveCompare2', 30]].forEach(([id, back]) => {
      const s = $(id); const cur = s.value; s.innerHTML = opts;
      s.value = cur && days.includes(cur) ? cur : pickNear(back);
    });
  }
  function renderCurve() {
    const list = ((state.quotes || {}).coffee_liffe || []);
    const diff = E.num(state.data.fobParams.diffUsd);
    const series = [
      { name: 'Giá kỳ hạn hôm nay', short: 'Hôm nay', color: SERIES_COLORS[0], values: list.map(q => E.num(q.Last) || null) },
      { name: `FOB HCM (Diff ${signed(diff)})`, short: 'FOB', color: SERIES_COLORS[1], dash: '6 4', values: list.map(q => (E.num(q.Last) ? E.num(q.Last) + diff : null)) }
    ];
    ['curveCompare1', 'curveCompare2'].forEach((id, k) => {
      const day = $(id).value; const h = day && state.history[day];
      if (h) series.push({ name: `Ngày ${day.split('-').reverse().join('/')}`, short: day.slice(8, 10) + '/' + day.slice(5, 7), color: SERIES_COLORS[2 + k], values: list.map(q => (h.robusta || {})[q.Name] || null) });
    });
    CH.lines($('chartCurve'), { xLabels: list.map(q => q.Month), series, title: 'Đường cong giá kỳ hạn Robusta' });
    CH.legend($('curveLegend'), series);
  }
  ['curveCompare1', 'curveCompare2'].forEach(id => $(id).addEventListener('change', renderCurve));
  $('btnOpenAnalysis').addEventListener('click', () => window.VTAssistant && window.VTAssistant.open('analysis'));

  // ---------- 3. Mô hình phòng hộ ----------
  const HEDGE_FIELDS = [
    ['qa', 'Khối lượng hàng xuất khẩu (QA)', 'tấn', 10],
    ['lotSize', 'Quy mô 1 lot chuẩn sàn ICE (QF)', 'tấn/lot', 1],
    ['f0', 'Giá tương lai trên sàn ICE London (F0)', 'USD/tấn', 1],
    ['fobTarget', 'Giá xuất khẩu mục tiêu (FOB HCM)', 'USD/tấn', 5],
    ['fxManual', 'Tỷ giá ghi đè thủ công (0 = dùng VCB)', 'VNĐ/USD', 10],
    ['days', 'Kỳ hạn giao dịch / thanh toán', 'ngày', 1],
    ['kPut', 'Giá sàn bảo vệ (Put strike – K_put)', 'USD/tấn', 50],
    ['pPut', 'Phí mua quyền chọn bán (Put premium)', 'USD/tấn', 5],
    ['kCall', 'Giá trần chia sẻ lợi nhuận (Call strike – K_call)', 'USD/tấn', 50],
    ['pCall', 'Phí thu về từ bán Call (Call premium)', 'USD/tấn', 5],
    ['hybridRatio', 'Tỷ lệ Futures trong gói Hybrid', '%', 10],
    ['feePerLot', 'Phí giao dịch MXV/ICE 2 chiều', 'USD/lot', 1]
  ];
  function buildHedgeInputs() {
    $('hedgeInputs').innerHTML = HEDGE_FIELDS.map(([k, label, unit, step]) =>
      `<label class="hedge-field"><span>${label}</span><span class="input-with-addon"><input type="number" class="form-control hedge-in" data-k="${k}" step="${step}" inputmode="decimal"><span class="addon">${unit}</span></span></label>`).join('');
    $('hedgeInputs').addEventListener('input', e => {
      const i = e.target.closest('.hedge-in'); if (!i) return;
      const k = i.dataset.k; let v = E.pick(i.value, 0); if (k === 'hybridRatio') v = v / 100;
      state.data.hedgeParams[k] = v; setDirty(true); renderHedge(true);
    });
  }
  // Ô F0 / FOB mục tiêu / K_put / K_call để trống = tự lấy theo giá sàn trực tiếp → mô hình luôn có số và nhảy theo giá realtime.
  // Nhập số vào ô = cố định giá trị đó (bấm Lưu để giữ lại).
  const HEDGE_AUTO = ['f0', 'fobTarget', 'kPut', 'kCall'];
  function hedgeMarketPick() {
    const list = (state.quotes || {}).coffee_liffe || [];
    return list.find(q => q.Name === state.data.fobParams.contract) || list[0] || null;
  }
  function effectiveHedge() {
    const hp = { ...state.data.hedgeParams }; const auto = {}; const pick = hedgeMarketPick();
    if (!hp.f0 && pick) { hp.f0 = E.num(pick.Last); auto.f0 = true; }
    if (hp.f0) {
      const a = { fobTarget: hp.f0 + E.num(state.data.fobParams.diffUsd), kPut: Math.round((hp.f0 - 300) / 50) * 50, kCall: Math.round(hp.f0 / 50) * 50 };
      Object.keys(a).forEach(k => { if (!hp[k]) { hp[k] = a[k]; auto[k] = true; } });
    }
    return { hp, auto, pick };
  }
  function fillHedgeInputs(keepValues) {
    const { hp, auto } = effectiveHedge();
    document.querySelectorAll('.hedge-in').forEach(i => {
      const k = i.dataset.k; const v = state.data.hedgeParams[k]; const isAuto = HEDGE_AUTO.includes(k) && !v;
      i.classList.toggle('auto', isAuto);
      i.placeholder = isAuto ? (auto[k] ? `${fmt(hp[k])} · tự động` : 'tự động') : '';
      if (keepValues || i === document.activeElement) return; // không ghi đè ô đang gõ
      i.value = isAuto ? '' : k === 'hybridRatio' ? Math.round(v * 100) : v;
    });
  }
  function renderHedge(fromInput) {
    fillHedgeInputs(fromInput);
    const { hp, auto, pick } = effectiveHedge();
    if (!hp.f0) {
      $('hedgeDerived').innerHTML = '<div class="alert-box info"><div class="alert-icon">ℹ️</div><div class="alert-text">Chưa có giá sàn London – bấm <b>Kiểm tra lại giá</b> hoặc tự nhập F0.</div></div>';
      $('hedgeCompare').innerHTML = ''; $('hedgeScenarios').innerHTML = ''; return;
    }
    const autoList = HEDGE_AUTO.filter(k => auto[k]).map(k => ({ f0: 'F0', fobTarget: 'FOB mục tiêu', kPut: 'K_put', kCall: 'K_call' })[k]);
    const note = auto.f0
      ? `<div class="hd-note live">⚡ Đang chạy theo giá sàn trực tiếp <b>${esc(pick.Name)} = ${fmt(hp.f0)} USD/tấn</b> – tự cập nhật mỗi khi giá đổi. Ô để trống (${autoList.join(', ')}) tự tính theo giá này; nhập số vào ô để cố định.</div>`
      : autoList.length ? `<div class="hd-note">Ô để trống (${autoList.join(', ')}) đang tự tính từ F0 = ${fmt(hp.f0)}.</div>` : '';
    const h = E.simulateHedge(hp, state.fx && state.fx.transfer);
    $('hedgeDerived').innerHTML = note + [
      ['Mức chênh lệch động (Diff = FOB − F0)', `${signed(h.diff)} USD/tấn`],
      ['Tỷ giá VCB tham chiếu', state.fx ? `${fmt(state.fx.transfer)} VNĐ` : '—'],
      ['Tỷ giá áp dụng tính toán (S0)', `${fmt(h.s0)} VNĐ${hp.fxManual > 0 ? ' (thủ công)' : ' (VCB)'}`],
      ['Số lot tương ứng', `${h.lots} lot`],
      ['Phí giao dịch quy đổi', `${fmt(h.feeT, 2)} USD/tấn`]
    ].map(([k, v]) => `<div class="hd-item"><span>${k}</span><b>${v}</b></div>`).join('');
    const S = h.strategies; const best = Math.max(...S.map(s => s.floor));
    const capText = s => s.cap !== null ? `${fmt(s.cap, 2)}` : s.key === 'put' ? '<span class="txt">KHÔNG GIỚI HẠN (tăng theo sàn)</span>' : `<span class="txt">MỞ RỘNG (${Math.round(h.params.hybridRatio * 100)}% chốt cứng, ${Math.round((1 - h.params.hybridRatio) * 100)}% tăng theo sàn)</span>`;
    const rows = [
      ['1. Lệnh thực hiện trên sàn MXV / ICE', s => `<b class="order">${esc(s.order)}</b>`],
      ['2. Chi phí quyền chọn ròng (USD)', s => fmt(s.premium, 0)],
      ['3. Tổng phí giao dịch MXV (USD)', s => fmt(s.fees, 0)],
      ['4. Rủi ro nộp thêm tiền ký quỹ (Margin call)', s => `<span class="txt">${esc(s.margin)}</span>`],
      ['5. Giá sàn Net bảo vệ tối thiểu (USD/tấn)', s => `<b class="${s.floor === best ? 'best' : ''}">${fmt(s.floor, 2)}</b>`],
      ['6. Giá trần Net tối đa khi giá tăng (USD/tấn)', capText],
      ['7. Giá sàn Net quy đổi (VNĐ/kg)', s => fmt(s.floorVndKg, 2)],
      ['8. Doanh thu tối thiểu thực nhận (triệu VNĐ)', s => `${fmt(s.revenueMinMillion, 0)} tr`]
    ];
    $('hedgeCompare').innerHTML = `<thead><tr><th>Tiêu chí</th>${S.map((s, i) => `<th>Chiến lược ${i + 1}:<br>${esc(s.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([l, f]) => `<tr><td class="lbl">${l}</td>${S.map(s => `<td>${f(s)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    const keys = ['unhedged', 'futures', 'put', 'collar', 'hybrid'];
    $('hedgeScenarios').innerHTML = `<thead><tr><th>Kịch bản ICE London lúc đáo hạn</th><th>Giá ICE</th><th>Không phòng hộ</th><th>1. Futures</th><th>2. Long Put</th><th>3. Collar</th><th>4. Hybrid</th></tr></thead><tbody>`
      + h.scenarios.map(r => { const mx = Math.max(...keys.map(k => r[k])); return `<tr><td class="lbl ${r.pct < 0 ? 'neg' : r.pct > 0 ? 'pos' : ''}">${r.label} (${signed(r.pct * 100)}%)</td><td>${fmt(r.ice, 2)}</td>${keys.map(k => `<td class="${r[k] === mx ? 'best' : ''}">${fmt(r[k], 2)}</td>`).join('')}</tr>`; }).join('') + '</tbody>';
  }
  // 📌 Chốt: ghi cứng các giá trị đang tự động theo giá hiện tại  ·  ⚡ Trực tiếp: xóa 4 ô để quay lại chạy theo giá sàn
  $('btnHedgeFromMarket').addEventListener('click', () => {
    const { hp, auto, pick } = effectiveHedge();
    if (!hp.f0) return toast('Chưa có giá sàn – bấm Kiểm tra lại giá', 'error');
    HEDGE_AUTO.forEach(k => { if (auto[k]) state.data.hedgeParams[k] = hp[k]; });
    setDirty(true); renderHedge(); toast(`📌 Đã chốt F0 = ${fmt(hp.f0)}${auto.f0 && pick ? ` (${pick.Name})` : ''}${isViewer() ? '' : ' – nhớ bấm Lưu'}`);
  });
  $('btnHedgeLive').addEventListener('click', () => {
    HEDGE_AUTO.forEach(k => { state.data.hedgeParams[k] = 0; });
    setDirty(true); renderHedge(); toast(`⚡ Mô hình chạy theo giá sàn trực tiếp${isViewer() ? '' : ' – bấm Lưu để giữ chế độ này'}`);
  });

  // ---------- 4. Bảng giá trực tuyến (bố cục như giacaphe.com) ----------
  const BOARD = [
    ['coffee_liffe', 'Giá cà phê Robusta London', 'ICE Futures Europe · USD/tấn', 0, 'robusta'],
    ['coffee_ice', 'Giá cà phê Arabica New York', 'ICE Futures US · cents/lb', 2, 'arabica'],
    ['brazil_coffee', 'Giá cà phê Arabica Brazil', 'B3 (BMF) · USD/bao 60 kg', 2, 'brazil']
  ];
  function renderBoard(changed) {
    const q = state.quotes || {}; const today = new Date();
    $('boardSource').innerHTML = `Nguồn: <a href="https://giacaphe.com/gia-ca-phe-truc-tuyen/" target="_blank" rel="noopener">giacaphe.com</a> · cập nhật nguồn: <b>${esc(q.updated || '—')}</b> · hệ thống kiểm tra mỗi 5 giây`;
    $('boardTables').innerHTML = BOARD.map(([key, title, sub, dg, mk]) => {
      const list = q[key] || []; const sess = E.sessionStatus(mk, today);
      const rows = list.map(it => {
        const last = E.num(it.Last), hi = E.num(it.High), lo = E.num(it.Low), prev = E.num(it.Previous), ch = E.num(it.Change);
        const pct = hi > lo ? Math.min(100, Math.max(0, (last - lo) / (hi - lo) * 100)) : 50;
        const fnd = E.firstNoticeDay(it.Name); const left = fnd ? E.daysBetween(today, fnd) : null;
        const fndTxt = fnd ? `${fnd.getDate()}/${fnd.getMonth() + 1}/${fnd.getFullYear()}<small class="${left < 0 ? 'muted' : left <= 10 ? 'warn' : 'muted'}">${left < 0 ? 'đã qua' : `còn ${left} ngày`}</small>` : '—';
        const cls = ch > 0 ? 'up' : ch < 0 ? 'down' : '';
        const fl = changed && changed[it.Name] ? ` flash-${changed[it.Name]}` : '';
        return `<tr class="${fl}"><td class="kh"><b>${esc(it.Month)}</b><span class="rng"><span style="left:${pct}%"></span></span></td>`
          + `<td class="code">${esc(E.mxvCode(it.Name) || it.Name)}<small>${esc(it.Name)}</small></td>`
          + `<td class="last">${fmt(last, dg)}</td><td class="${cls}"><b>${signed(ch, dg)}</b><small>${esc(it.PtcChange)}%</small></td>`
          + `<td>${fmt(hi, dg)}<small class="up">${signed(hi - prev, dg)}</small></td><td>${fmt(lo, dg)}<small class="${lo - prev >= 0 ? 'up' : 'down'}">${signed(lo - prev, dg)}</small></td>`
          + `<td>${fmt(it.Volume, 0)}</td><td>${fmt(it.Open, dg)}</td><td>${fmt(prev, dg)}</td><td>${fmt(it.OpInt, 0)}</td><td class="muted">${timeOf(it.Time)}</td><td class="fnd">${fndTxt}</td></tr>`;
      }).join('');
      return `<div class="board-block"><div class="board-head"><h4>${title}</h4><span class="board-sub">${sub}</span><span class="board-sess ${sess.open ? 'on' : ''}">● ${sess.open ? 'Giao dịch' : 'Đóng cửa'}</span></div>`
        + `<div class="table-scroll"><table class="board-table"><thead><tr><th>Kỳ hạn</th><th>Mã MXV</th><th>Giá khớp</th><th>Thay đổi</th><th>Cao nhất</th><th>Thấp nhất</th><th>Khối lượng</th><th>Mở cửa</th><th>Hôm trước</th><th>HĐ mở</th><th>Giờ khớp</th><th>Ngày TB đầu tiên</th></tr></thead><tbody>${rows || '<tr><td colspan="12" class="muted">Chưa có dữ liệu</td></tr>'}</tbody></table></div></div>`;
    }).join('');
  }

  // ---------- Tính giá FOB ----------
  function renderCalcOptions() {
    const sel = $('calcMonthSelect'); const fp = state.data.fobParams;
    const list = (state.quotes && state.quotes.coffee_liffe) || []; const current = sel.value || fp.contract;
    sel.innerHTML = list.length ? list.map(i => `<option value="${i.Name}" data-price="${E.num(i.Last)}">Tháng ${i.Month} (${i.Name}) – ${fmt(i.Last, 0)} USD</option>`).join('')
      : `<option value="${fp.contract}" data-price="0">${fp.contract} – chưa có giá</option>`;
    if ([...sel.options].some(o => o.value === current)) sel.value = current;
  }
  function calculateFob() {
    const fp = state.data.fobParams; const opt = $('calcMonthSelect').selectedOptions[0]; const london = opt ? E.num(opt.dataset.price) : 0;
    if (!london) { $('resFobUsd').textContent = 'Chưa có giá sàn'; $('resFobVnd').textContent = '—'; $('resDomesticEq').textContent = '—'; $('formulaFob').textContent = ''; return; }
    const r = E.computeFob(london, fp.diffUsd, fp.exchangeRate, fp.processingCostVnd);
    $('resFobUsd').innerHTML = `${fmt(r.fobUsd, 0)} <small>USD/tấn</small>`; $('formulaFob').textContent = `= ${fmt(london, 0)} + (${signed(fp.diffUsd)}) USD`;
    $('resFobVnd').innerHTML = `${fmt(r.fobVndKg, 0)} <small>VNĐ/kg</small>`; $('resDomesticEq').innerHTML = `${fmt(r.domesticVndKg, 0)} <small>VNĐ/kg</small>`;
  }

  // ---------- Tham chiếu nội địa ----------
  // Giá nhân xô: tự động từ giacaphe.com (giá trung bình Tây Nguyên); chỉ khi chưa lấy được mới dùng giá nhập tay (✎ Sửa)
  function renderReference() {
    const ref = state.data.reference; const dm = state.domestic; const auto = !!(dm && dm.avg);
    $('domesticPrice').innerHTML = `${fmt(auto ? dm.avg : ref.domesticPrice, 0)} <span class="unit">VNĐ/kg</span>`;
    const ch = $('domesticChange');
    ch.className = `price-change ${auto && dm.change > 0 ? 'positive' : auto && dm.change < 0 ? 'negative' : 'neutral'}`;
    ch.textContent = !auto ? 'Nhập tay' : dm.change ? signed(dm.change, 0) : 'Không đổi';
    $('domesticNote').innerHTML = auto ? `TB Tây Nguyên · <a href="https://giacaphe.com/gia-ca-phe-noi-dia/" target="_blank" rel="noopener">giacaphe.com</a> ${esc(dm.date || '')}` : esc(ref.domesticNote || '');
    $('btnEditDomestic').style.display = auto ? 'none' : '';
    if (!state.fx) $('fxRate').innerHTML = `${fmt(ref.fxRate, 0)} <span class="unit">VNĐ</span>`;
  }
  function applyDomestic(dm) {
    state.domestic = dm;
    if (state.data) renderReference();
    renderDomesticBoard();
  }
  function renderDomesticBoard() {
    const dm = state.domestic; const box = $('boardDomestic'); if (!box) return;
    if (!dm) { box.innerHTML = ''; return; }
    const chg = v => v === null || v === undefined ? '<td class="muted">—</td>' : `<td class="${v > 0 ? 'up' : v < 0 ? 'down' : ''}"><b>${v ? signed(v, 0) : '0'}</b></td>`;
    const rows = [`<tr><td class="kh"><b>Trung bình Tây Nguyên</b></td><td class="last">${fmt(dm.avg, 0)}</td>${chg(dm.change)}</tr>`]
      .concat((dm.provinces || []).map(p => `<tr><td class="kh">${esc(p.name)}</td>${p.price ? `<td class="last">${fmt(p.price, 0)}</td>${chg(p.change)}`
        : `<td colspan="2"><a class="dom-link" href="${esc(p.url)}" target="_blank" rel="noopener">xem trên giacaphe.com ↗</a></td>`}</tr>`));
    if (dm.high) rows.push(`<tr><td class="kh">Cao nhất</td><td>${fmt(dm.high, 0)}</td><td></td></tr>`);
    box.innerHTML = `<div class="board-block"><div class="board-head"><h4>Giá cà phê nhân xô trong nước</h4><span class="board-sub">VNĐ/kg · ngày ${esc(dm.date || '—')}</span></div>`
      + `<div class="table-scroll"><table class="board-table dom-table"><thead><tr><th>Thị trường</th><th>Giá</th><th>Thay đổi</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`
      + `<p class="section-desc board-note">Nguồn: <a href="https://giacaphe.com/gia-ca-phe-noi-dia/" target="_blank" rel="noopener">giacaphe.com</a> – giá giacaphe công bố công khai, hệ thống cập nhật 30 phút/lần. Tỉnh nào trang nguồn không ghi giá công khai thì bấm link để xem.</p></div>`;
  }
  $('btnEditDomestic').addEventListener('click', () => {
    const ref = state.data.reference; const v = prompt('Giá nhân xô nội địa (VNĐ/kg):', ref.domesticPrice); if (v === null) return;
    const n = E.pick(String(v).replace(/[.,\s]/g, ''), null); if (n === null || n <= 0) return toast('Giá trị không hợp lệ', 'error');
    const note = prompt('Ghi chú / nguồn:', ref.domesticNote || ''); ref.domesticPrice = n; if (note !== null) ref.domesticNote = note;
    renderReference(); setDirty(true); toast('Đã cập nhật – nhớ bấm Lưu');
  });

  // ---------- Nạp / lưu ----------
  function applyData(d) {
    state.data = E.normalize(d); const fp = state.data.fobParams;
    $('calcDiffInput').value = fp.diffUsd; $('calcCostInput').value = fp.processingCostVnd;
    $('calcFxAuto').checked = fp.fxAuto; $('calcFxInput').disabled = fp.fxAuto;
    if (fp.fxAuto && state.fx) fp.exchangeRate = state.fx.transfer;
    $('calcFxInput').value = fp.exchangeRate;
    $('riskLimitInput').value = state.data.riskLimit; $('priceMoveInput').value = state.data.priceMoveUsd;
    $('lastSaved').textContent = state.data.updatedAt ? new Date(state.data.updatedAt).toLocaleString('vi-VN') : 'chưa lưu';
    renderReference(); renderMatrix(); renderCalcOptions(); calculateFob(); recalcAll(); setDirty(false);
    if (state.tab === 'hedge') renderHedge();
    if (window.VTContracts) window.VTContracts.render();
  }
  async function loadData() { try { applyData(await api('/api/load-matrix')); } catch (e) { toast('Không tải được dữ liệu vị thế', 'error'); } }
  async function saveData() {
    state.saving = true;
    try {
      state.data.fobParams.contract = $('calcMonthSelect').value || state.data.fobParams.contract;
      const r = await api('/api/save-matrix', state.data); if (!r.success) throw new Error(r.error || 'Lỗi lưu');
      state.data = E.normalize(r.data); setDirty(false);
      $('lastSaved').textContent = new Date(state.data.updatedAt).toLocaleString('vi-VN'); toast('✅ Đã lưu', 'success');
      if (state.tab === 'overview') renderOverview();
    } catch (e) { setDirty(true); toast('Lỗi lưu dữ liệu: ' + e.message, 'error'); }
    finally { setTimeout(() => { state.saving = false; }, 500); }
  }
  async function loadHistory() { try { state.history = await api('/api/history'); fillCompareOptions(); if (state.tab === 'overview') renderCurve(); } catch (e) { /* bỏ qua */ } }

  // ---------- Sự kiện ----------
  $('positionBody').addEventListener('input', e => {
    const t = e.target; if (!t.classList.contains('cell-input')) return;
    state.data.matrix[t.dataset.key][t.dataset.code] = E.pick(t.value, 0); setDirty(true); recalcAll();
  });
  $('positionBody').addEventListener('click', e => { if (e.target.closest('[data-goto="contracts"]')) showTab('contracts'); });
  // Sổ hợp đồng vừa thay đổi (ghi / chốt giá / giao hàng / xóa): vẽ lại ma trận, lưu ngay
  async function ledgerChanged(msg) {
    renderMatrix(); recalcAll();
    if (window.VTContracts) window.VTContracts.render();
    await saveData();
    if (window.VTContracts) window.VTContracts.render();
    if (msg && !state.dirty) toast(msg, 'success');
  }
  $('calcMonthSelect').addEventListener('change', () => { state.data.fobParams.contract = $('calcMonthSelect').value; setDirty(true); calculateFob(); });
  [['calcDiffInput', 'diffUsd'], ['calcFxInput', 'exchangeRate'], ['calcCostInput', 'processingCostVnd']].forEach(([id, key]) =>
    $(id).addEventListener('input', () => { state.data.fobParams[key] = E.pick($(id).value, 0); setDirty(true); calculateFob(); if (key === 'diffUsd' && state.tab === 'overview') renderCurve(); }));
  $('calcFxAuto').addEventListener('change', () => {
    const on = $('calcFxAuto').checked; state.data.fobParams.fxAuto = on; $('calcFxInput').disabled = on;
    if (on && state.fx) { state.data.fobParams.exchangeRate = state.fx.transfer; $('calcFxInput').value = state.fx.transfer; }
    setDirty(true); calculateFob();
  });
  $('riskLimitInput').addEventListener('input', () => { state.data.riskLimit = E.pick($('riskLimitInput').value, 200); setDirty(true); recalcAll(); });
  $('priceMoveInput').addEventListener('input', () => { state.data.priceMoveUsd = E.pick($('priceMoveInput').value, 30); setDirty(true); recalcAll(); });
  document.querySelectorAll('.btn-save').forEach(b => b.addEventListener('click', saveData));
  $('btnResetSample').addEventListener('click', async () => {
    if (!confirm('Nạp bộ số liệu MẪU? Số liệu vị thế hiện tại sẽ bị thay thế (nên Xuất Excel trước).')) return;
    const r = await api('/api/reset-matrix', {}); if (r.success) { applyData(r.data); toast('Đã nạp dữ liệu mẫu'); }
  });
  $('btnRoll').addEventListener('click', () => {
    const { data, dropped } = E.rollColumns(state.data);
    if (data.columns.join() === state.data.columns.join()) return toast('Ma trận đã ở 6 kỳ hạn hiện hành');
    let msg = `Chuyển ma trận sang các kỳ hạn: ${data.columns.join(', ')}?`;
    if (dropped.length) msg += '\n\n⚠️ Số liệu ở kỳ hạn cũ sẽ bị loại:\n' + dropped.map(x => `• ${x.code} – ${x.row}: ${fmt(x.value)}`).join('\n');
    if (!confirm(msg)) return;
    applyData({ ...data, updatedAt: state.data.updatedAt }); setDirty(true); toast('Đã chuyển kỳ hạn – bấm Lưu vị thế');
  });
  $('btnExportCsv').addEventListener('click', exportCsv);
  window.addEventListener('beforeunload', e => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (state.tab === 'overview') renderOverview(); }, 200); });

  function exportCsv() {
    const d = state.data; const pos = E.computePositions(d); const cols = d.columns;
    const q = s => `"${String(s).replace(/"/g, '""')}"`;
    const lines = [q('VIỆT THIÊN COFFEE GROUP – MA TRẬN VỊ THẾ HÀNG THỰC & PHÒNG HỘ SÀN'), q(`Xuất lúc: ${new Date().toLocaleString('vi-VN')}`), ''];
    const sp = E.computeSpreads(cols, state.quotes);
    lines.push([q('SPREAD (USD/tấn)'), q('-'), ...sp.map(s => q(s.value === null ? `${s.pair}: -` : `${s.pair} = ${s.value}`)), q('')].join(','));
    lines.push([q('DANH MỤC'), ...cols.map(c => q(`${E.contractLabel(c)} (${c})`)), q('TỔNG')].join(','));
    const line = (label, vals, total) => lines.push([q(label), ...vals.map(v => q(E.round2(v))), q(E.round2(total))].join(','));
    const eff = E.effectiveMatrix(d);
    ['physical', 'futures', 'diff', 'memo'].forEach(g => {
      lines.push(q(E.GROUPS[g]));
      E.ROWS.filter(r => r.group === g).forEach(r => line(`${r.label} (${r.unit === 'lot' ? 'lot' : 'tấn'})`, cols.map(c => E.num((eff[r.key] || {})[c])), pos.rowSums[r.key]));
      if (g === 'physical') line('Vị thế hàng thực (tấn)', pos.physical, pos.totals.physical);
      if (g === 'futures') line('Vị thế tài khoản sàn (tấn)', pos.futures, pos.totals.futures);
      if (g === 'diff') { line('Vị thế trừ lùi chưa chốt giá (tấn)', pos.diff, pos.totals.diff); line('TỔNG VỊ THẾ RÒNG (tấn)', pos.net, pos.totals.net); }
    });
    // Sổ hợp đồng
    if ((d.contracts || []).length) {
      lines.push('', q('SỔ HỢP ĐỒNG MUA / BÁN HÀNG THỰC'));
      lines.push(['Số HĐ', 'Ngày ký', 'Loại', 'Đối tác', 'Hàng', 'Số lượng (t)', 'Kiểu giá', 'Giá / Diff', 'Đơn vị', 'Kỳ hạn sàn', 'Tháng giao', 'Điều kiện', 'Đã chốt (t)', 'Giá chốt TB (USD/t)', 'Đã giao (t)', 'Ghi chú'].map(q).join(','));
      d.contracts.forEach(c => {
        const s = E.contractState(c);
        lines.push([c.no, c.date, c.side === 'buy' ? 'MUA' : 'BÁN', c.party, c.grade, s.qty, c.pricing === 'diff' ? 'Trừ lùi' : 'Cố định', c.pricing === 'diff' ? c.diff : c.price,
          c.pricing === 'diff' ? 'USD/tấn (diff)' : c.unit === 'vnd' ? 'VNĐ/kg' : 'USD/tấn', c.basis, c.ship, c.terms, s.fixedT, s.priceUsd === null ? '' : s.priceUsd, s.deliveredT, c.note].map(q).join(','));
      });
    }
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Bao_Cao_Vi_The_VietThien_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- Telegram ----------
  const tgStatus = (msg, ok) => { $('tgStatus').className = `modal-status ${ok ? 'success' : 'error'}`; $('tgStatus').textContent = msg; };
  $('btnTelegramModal').addEventListener('click', async () => {
    $('telegramModal').classList.add('active'); $('tgStatus').className = 'modal-status';
    try {
      const c = await api('/api/telegram-config');
      $('tgEnabled').checked = c.enabled; $('tgChatId').value = c.chatId || ''; $('tgThreshold').value = c.alertThresholdUsd || 20;
      $('tgBotToken').value = ''; $('tgBotToken').placeholder = c.hasToken ? `Đã lưu: ${c.tokenMasked} (để trống nếu giữ nguyên)` : 'Ví dụ: 789123456:AAFlkjas...';
    } catch (e) { tgStatus('Không tải được cấu hình', false); }
  });
  $('btnCloseTelegramModal').addEventListener('click', () => $('telegramModal').classList.remove('active'));
  $('telegramModal').addEventListener('click', e => { if (e.target === $('telegramModal')) $('telegramModal').classList.remove('active'); });
  $('btnTgSave').addEventListener('click', async () => {
    const r = await api('/api/telegram-config', { enabled: $('tgEnabled').checked, botToken: $('tgBotToken').value, chatId: $('tgChatId').value, alertThresholdUsd: $('tgThreshold').value });
    tgStatus(r.success ? '✅ Đã lưu cấu hình Telegram' : '❌ ' + r.error, r.success);
  });
  $('btnTgTest').addEventListener('click', async () => {
    $('btnTgTest').textContent = '⏳ Đang gửi...';
    try { const r = await api('/api/telegram-test', {}); tgStatus(r.success ? '✅ Đã gửi – kiểm tra Telegram' : '❌ ' + (r.error || 'Kiểm tra lại Token & Chat ID'), r.success); }
    finally { $('btnTgTest').textContent = '📨 Gửi thử'; }
  });

  // ---------- Trợ lý ----------
  function refreshAssistant() { if (window.VTAssistant) window.VTAssistant.refresh(); }
  if (window.VTAssistant) window.VTAssistant.init(() => state);

  // ---------- Khởi động ----------
  buildHedgeInputs();
  let saved = 'overview'; try { saved = localStorage.getItem('vt_tab') || 'overview'; } catch (e) { /* bỏ qua */ }
  // Link mở thẳng một thẻ: #tong-quan, #vi-the, #hop-dong, #phong-ho, #bang-gia
  const HASH_TAB = { '#tong-quan': 'overview', '#vi-the': 'position', '#hop-dong': 'contracts', '#phong-ho': 'hedge', '#bang-gia': 'board' };
  if (HASH_TAB[location.hash]) saved = HASH_TAB[location.hash];
  async function loadRole() {
    try {
      const me = await api('/api/me'); state.role = me.role; state.tunnel = !!me.tunnel;
      document.body.classList.toggle('viewer', me.role === 'viewer');
      const b = $('roleBadge'); b.hidden = me.local || me.openAccess === 'editor'; // link toàn quyền: không cần nhãn đăng nhập
      // Xem không cần mật khẩu (publicView) → người xem có nút Đăng nhập để chuyển sang chỉnh sửa
      b.innerHTML = me.role === 'viewer' ? `👁 Chỉ xem · ${me.publicView ? '<a href="/login">Đăng nhập</a>' : '<a href="/logout">Đăng xuất</a>'}`
        : '✏️ Chỉnh sửa · <a href="/logout">Đăng xuất</a>';
    } catch (e) { state.role = 'viewer'; }
  }
  loadRole().then(loadData).then(() => { showTab(['overview', 'position', 'contracts', 'hedge', 'board'].includes(saved) ? saved : 'overview'); connectStream(); loadHistory(); });
  setInterval(loadHistory, 30 * 60 * 1000);
})();

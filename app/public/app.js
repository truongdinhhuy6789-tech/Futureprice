// VIỆT THIÊN COFFEE GROUP — Giao diện quản trị vị thế (mọi công thức nằm trong engine.js)
(function () {
  'use strict';
  const E = window.VTEngine;
  const $ = id => document.getElementById(id);
  const state = { data: E.defaultData(), quotes: null, quotesOk: false, dirty: false, autoTimer: null };
  window.VTApp = { getState: () => state, recalc: () => recalcAll() };

  // ---------- Tiện ích ----------
  const fmt = (n, d) => E.fmt(n, d);
  const signed = (n, d) => E.signed(n, d);
  const colorOf = v => (v < 0 ? 'var(--red)' : v > 0 ? 'var(--green)' : 'var(--text-muted)');
  function toast(msg, type) {
    let t = $('vtToast');
    if (!t) { t = document.createElement('div'); t.id = 'vtToast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = `toast show ${type || ''}`;
    clearTimeout(t._h); t._h = setTimeout(() => { t.className = 'toast'; }, 2600);
  }
  async function api(url, body) {
    const opt = body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    const res = await fetch(url, opt);
    return res.json();
  }
  function setDirty(v) {
    state.dirty = v;
    $('btnSaveMatrix').classList.toggle('unsaved', v);
    $('btnSaveMatrix').innerHTML = v ? '<span class="icon">💾</span> Lưu vị thế •' : '<span class="icon">💾</span> Lưu vị thế';
  }

  // ---------- Đồng hồ ----------
  function tick() { const n = new Date(); $('liveClock').textContent = `${n.toLocaleTimeString('vi-VN', { hour12: false })} - ${n.toLocaleDateString('vi-VN')}`; }
  setInterval(tick, 1000); tick();

  // ---------- Giá sàn ----------
  async function fetchQuotes(force) {
    try {
      $('marketStatus').innerHTML = '<span class="pulse-dot"></span><span class="status-text" style="color:var(--blue)">Đang tải giá sàn...</span>';
      const r = await api('/api/live-quotes', force ? {} : undefined); // POST = bỏ qua bộ đệm, lấy giá mới ngay
      if (r.data) { state.quotes = r.data; renderQuotes(); }
      state.quotesOk = !!r.success;
      $('marketStatus').innerHTML = r.success
        ? '<span class="pulse-dot"></span><span class="status-text">ICE London: đang cập nhật</span>'
        : '<span class="pulse-dot" style="background:var(--yellow)"></span><span class="status-text" style="color:var(--yellow)">Mất kết nối – đang dùng giá gần nhất</span>';
      $('footerConnection').innerHTML = `Kết nối API: <b>${r.success ? 'Ổn định' : 'Gián đoạn'}</b>`;
    } catch (e) {
      state.quotesOk = false;
      $('marketStatus').innerHTML = '<span class="pulse-dot" style="background:var(--red)"></span><span class="status-text" style="color:var(--red)">Không kết nối được server</span>';
    }
    renderSpreads(); calculateFob(); refreshAssistant();
  }

  function renderQuotes() {
    const q = state.quotes || {};
    $('quotesUpdatedTime').textContent = `Cập nhật: ${q.updated || '—'}`;
    const rb = (q.coffee_liffe || [])[0];
    if (rb) {
      const c = E.num(rb.Change);
      $('robustaCode').textContent = `${rb.Name} (${rb.Month})`;
      $('robustaPrice').innerHTML = `${fmt(rb.Last, 0)} <span class="unit">USD/tấn</span>`;
      $('robustaChange').className = `price-change ${c >= 0 ? 'positive' : 'negative'}`;
      $('robustaChange').textContent = `${signed(c)} (${rb.PtcChange}%)`;
      $('robustaHigh').textContent = fmt(rb.High, 0); $('robustaLow').textContent = fmt(rb.Low, 0); $('robustaVol').textContent = fmt(rb.Volume, 0);
    }
    const ar = (q.coffee_ice || [])[0];
    if (ar) {
      const c = E.num(ar.Change);
      $('arabicaCode').textContent = `${ar.Name} (${ar.Month})`;
      $('arabicaPrice').innerHTML = `${fmt(ar.Last, 2)} <span class="unit">cents/lb</span>`;
      $('arabicaChange').className = `price-change ${c >= 0 ? 'positive' : 'negative'}`;
      $('arabicaChange').textContent = `${signed(c, 2)} (${ar.PtcChange}%)`;
      $('arabicaHigh').textContent = fmt(ar.High, 2); $('arabicaLow').textContent = fmt(ar.Low, 2); $('arabicaVol').textContent = fmt(ar.Volume, 0);
    }
    const row = (item, color, d) => {
      const c = E.num(item.Change); const col = c >= 0 ? 'var(--green)' : 'var(--red)';
      return `<tr><td><b>${item.Month}</b></td><td style="color:${color}">${item.Name}</td><td style="font-weight:700">${fmt(item.Last, d)}</td>`
        + `<td style="color:${col}">${signed(c, d)}</td><td style="color:${col}">${item.PtcChange}%</td><td>${fmt(item.High, d)}</td><td>${fmt(item.Low, d)}</td><td>${fmt(item.Volume, 0)}</td></tr>`;
    };
    $('tbodyRobusta').innerHTML = (q.coffee_liffe || []).map(i => row(i, 'var(--blue)', 0)).join('');
    $('tbodyArabica').innerHTML = (q.coffee_ice || []).map(i => row(i, '#C084FC', 2)).join('');
    renderCalcOptions();
  }

  // ---------- Spread ----------
  function renderSpreads() {
    const sp = E.computeSpreads(state.data.columns, state.quotes);
    $('spreadItems').innerHTML = sp.map(s => {
      const tag = s.value === null ? '<span class="tag">Chưa có giá</span>'
        : `<span class="tag ${s.structure === 'Inverted' ? 'inverted' : 'contango'}">${s.structure === 'Inverted' ? 'Inverted (nghịch đảo)' : s.structure === 'Contango' ? 'Contango (bình thường)' : 'Phẳng'}</span>`;
      const val = s.value === null ? '—' : `${signed(s.value, 0)} USD`;
      return `<div class="spread-pill"><span class="label">${s.pair}</span><span class="val" style="color:${s.value === null ? 'var(--text-muted)' : colorOf(s.value)}">${val}</span>${tag}</div>`;
    }).join('');
    sp.forEach((s, i) => { const th = $(`spreadHead_${i + 1}`); if (th) th.textContent = s.value === null ? `${s.pair}: —` : `${s.pair} = ${signed(s.value, 0)}`; });
  }

  // ---------- Ma trận ----------
  function renderMatrix() {
    const cols = state.data.columns; const now = new Date();
    const expired = cols.filter(c => E.isExpired(c, now));
    $('rollBanner').hidden = !expired.length;
    $('rollBannerCodes').textContent = expired.join(', ');
    $('positionHead').innerHTML =
      `<tr class="row-spread-header"><th class="col-title text-left">SPREAD (USD/tấn)</th>${cols.map((c, i) => `<th class="spread-cell" id="spreadHead_${i}">${i === 0 ? '—' : ''}</th>`).join('')}<th class="spread-cell total-header">TỔNG</th></tr>`
      + `<tr class="row-col-headers"><th class="col-title text-left">DANH MỤC</th>${cols.map(c => `<th${E.isExpired(c, now) ? ' class="col-expired" title="Kỳ hạn đã đến tháng giao hàng"' : ''}>${E.contractLabel(c)}<br><span class="month-code">${c}</span></th>`).join('')}<th class="col-total">TỔNG</th></tr>`;

    const html = [];
    const rowHtml = r => {
      const unit = r.unit === 'lot' ? 'lot' : 'tấn';
      const step = r.unit === 'lot' ? 1 : 0.01;
      const cells = cols.map(c => {
        const v = E.num((state.data.matrix[r.key] || {})[c]);
        return `<td><input type="number" step="${step}" class="cell-input" data-key="${r.key}" data-code="${c}" value="${v === 0 ? '' : v}" placeholder="0"></td>`;
      }).join('');
      return `<tr class="data-row"><td class="row-label">${r.label} (${unit})</td>${cells}<td class="row-sum" id="sum_${r.key}">0.00</td></tr>`;
    };
    const subtotal = (id, label, cls) => `<tr class="${cls}" id="row_${id}"><td class="row-label bold">${label}</td>${cols.map((c, i) => `<td class="${cls === 'highlight-net-position-row' ? 'net-val' : 'calc-val'} bold" id="${id}_${i}">0.00</td>`).join('')}<td class="${cls === 'highlight-net-position-row' ? 'net-val bold total-highlight' : 'calc-val bold total-cell'}" id="${id}_sum">0.00</td></tr>`;
    ['physical', 'futures', 'diff', 'memo'].forEach(g => {
      html.push(`<tr class="section-divider-row"><td colspan="${cols.length + 2}">${E.GROUPS[g]}</td></tr>`);
      E.ROWS.filter(r => r.group === g).forEach(r => html.push(rowHtml(r)));
      if (g === 'physical') html.push(subtotal('phys', 'Vị thế hàng thực (tấn)', 'subtotal-row'));
      if (g === 'futures') html.push(subtotal('fut', 'Vị thế tài khoản sàn (tấn)', 'subtotal-row'));
      if (g === 'diff') {
        html.push(subtotal('dif', 'Vị thế trừ lùi chưa chốt giá (tấn)', 'subtotal-row'));
        html.push(subtotal('net', '⭐ TỔNG VỊ THẾ RÒNG (tấn) = hàng thực + sàn + trừ lùi', 'highlight-net-position-row'));
      }
    });
    $('positionBody').innerHTML = html.join('');
    renderSpreads();
  }

  function recalcAll() {
    const pos = E.computePositions(state.data);
    E.ROWS.forEach(r => { const el = $(`sum_${r.key}`); if (el) { const v = pos.rowSums[r.key]; el.textContent = fmt(v, r.unit === 'lot' ? 0 : 2); el.style.color = colorOf(v); } });
    const fill = (id, arr, total, gold) => {
      arr.forEach((v, i) => { const el = $(`${id}_${i}`); if (el) { el.textContent = fmt(v); el.style.color = gold ? (v < 0 ? '#F87171' : v > 0 ? '#4ADE80' : '#FEF08A') : colorOf(v); } });
      const s = $(`${id}_sum`); if (s) { s.textContent = fmt(total); if (!gold) s.style.color = colorOf(total); else s.style.color = total < 0 ? '#F87171' : '#FDE047'; }
    };
    fill('phys', pos.physical, pos.totals.physical); fill('fut', pos.futures, pos.totals.futures);
    fill('dif', pos.diff, pos.totals.diff); fill('net', pos.net, pos.totals.net, true);
    renderRisk(pos);
    refreshAssistant();
  }

  // ---------- Rủi ro ----------
  function renderRisk(pos) {
    const d = state.data;
    const risk = E.analyzeRisk(pos, { limit: d.riskLimit, priceMove: d.priceMoveUsd });
    const t = pos.totals.net;
    $('metricNetExposure').textContent = `${fmt(t)} tấn`;
    $('metricNetExposure').className = `metric-val ${t < 0 ? 'negative' : t > 0 ? 'positive' : ''}`;
    $('metricStatusShort').innerHTML = t < 0 ? `Trạng thái: <b style="color:var(--red)">SHORT (hụt ${fmt(Math.abs(t), 1)} t)</b>`
      : t > 0 ? `Trạng thái: <b style="color:var(--green)">LONG (dư ${fmt(t, 1)} t)</b>` : 'Trạng thái: <b>CÂN BẰNG (Square)</b>';
    if (risk.worstIdx >= 0 && risk.worstValue !== 0) {
      $('metricWorstMonth').textContent = `${E.contractLabel(pos.columns[risk.worstIdx])}: ${fmt(risk.worstValue)} t`;
      $('metricWorstMonth').style.color = colorOf(risk.worstValue);
    } else { $('metricWorstMonth').textContent = 'An toàn'; $('metricWorstMonth').style.color = 'var(--green)'; }
    $('metricMtmPnl').textContent = `${signed(risk.mtmUp)} USD`;
    $('metricMtmPnl').style.color = colorOf(risk.mtmUp);
    $('metricMtmNote').textContent = `Nếu London tăng ${fmt(risk.move, 0)}$ (giảm thì ngược dấu)`;
    const lbl = i => `${E.contractLabel(pos.columns[i])}`;
    const alerts = risk.alerts.map(a => {
      if (a.type === 'mismatch') {
        return `<div class="alert-box warning"><div class="alert-icon">⚠️</div><div class="alert-text"><b>Lệch kỳ hạn:</b> dư hàng ở ${a.longs.map(x => `${lbl(x.i)} (+${fmt(x.v)} t)`).join(', ')} nhưng hụt ở ${a.shorts.map(x => `${lbl(x.i)} (${fmt(x.v)} t)`).join(', ')}. Khi spread dãn, chi phí đảo kỳ hạn (roll) sẽ ăn vào lợi nhuận.</div></div>`;
      }
      return `<div class="alert-box info"><div class="alert-icon">🛡️</div><div class="alert-text"><b>Khuyến nghị phòng hộ ${lbl(a.index)} (${a.code}):</b> đang lệch <b>${fmt(a.value)} tấn</b>, vượt hạn mức ${fmt(risk.limit, 0)} t. Đặt lệnh <b>${a.action} ${a.lots} lot</b> Robusta RM${a.code} (HD Bank / PFS092) để trung hòa.</div></div>`;
    });
    $('advisoryAlerts').innerHTML = alerts.length ? alerts.join('')
      : `<div class="alert-box info"><div class="alert-icon">✅</div><div class="alert-text">Tất cả kỳ hạn nằm trong hạn mức ${fmt(risk.limit, 0)} tấn.</div></div>`;
  }

  // ---------- Tính giá FOB ----------
  function renderCalcOptions() {
    const sel = $('calcMonthSelect'); const fp = state.data.fobParams;
    const list = (state.quotes && state.quotes.coffee_liffe) || [];
    const current = sel.value || fp.contract;
    sel.innerHTML = list.length
      ? list.map(i => `<option value="${i.Name}" data-price="${E.num(i.Last)}">Tháng ${i.Month} (${i.Name}) – ${fmt(i.Last, 0)} USD</option>`).join('')
      : `<option value="${fp.contract}" data-price="0">${fp.contract} – chưa có giá sàn</option>`;
    if ([...sel.options].some(o => o.value === current)) sel.value = current;
  }
  function calculateFob() {
    const fp = state.data.fobParams; const sel = $('calcMonthSelect');
    const opt = sel.selectedOptions[0]; const london = opt ? E.num(opt.dataset.price) : 0;
    if (!london) { $('resFobUsd').textContent = 'Chưa có giá sàn'; $('resFobVnd').textContent = '—'; $('resDomesticEq').textContent = '—'; $('formulaFob').textContent = ''; return; }
    const r = E.computeFob(london, fp.diffUsd, fp.exchangeRate, fp.processingCostVnd);
    $('resFobUsd').innerHTML = `${fmt(r.fobUsd, 0)} <small>USD/tấn</small>`;
    $('formulaFob').textContent = `= ${fmt(london, 0)} + (${signed(fp.diffUsd, 0)}) USD`;
    $('resFobVnd').innerHTML = `${fmt(r.fobVndKg, 0)} <small>VNĐ/kg</small>`;
    $('resDomesticEq').innerHTML = `${fmt(r.domesticVndKg, 0)} <small>VNĐ/kg</small>`;
  }

  // ---------- Tham chiếu nội địa ----------
  function renderReference() {
    const ref = state.data.reference;
    $('domesticPrice').innerHTML = `${fmt(ref.domesticPrice, 0)} <span class="unit">VNĐ/kg</span>`;
    $('domesticNote').textContent = ref.domesticNote || '';
    $('fxRate').innerHTML = `${fmt(ref.fxRate, 0)} <span class="unit">VNĐ</span>`;
    $('fxNote').textContent = ref.fxNote || '';
  }
  function editReference(field, noteField, title) {
    const ref = state.data.reference;
    const v = prompt(`${title} (số):`, ref[field]);
    if (v === null) return;
    const n = E.pick(String(v).replace(/[.,\s]/g, ''), null);
    if (n === null || n <= 0) return toast('Giá trị không hợp lệ', 'error');
    const note = prompt('Ghi chú / nguồn:', ref[noteField] || '');
    ref[field] = n; if (note !== null) ref[noteField] = note;
    if (field === 'fxRate') { state.data.fobParams.exchangeRate = n; $('calcFxInput').value = n; calculateFob(); }
    renderReference(); setDirty(true); toast('Đã cập nhật – nhớ bấm Lưu vị thế');
  }

  // ---------- Nạp / lưu ----------
  function applyData(d) {
    state.data = E.normalize(d);
    const fp = state.data.fobParams;
    $('calcDiffInput').value = fp.diffUsd; $('calcFxInput').value = fp.exchangeRate; $('calcCostInput').value = fp.processingCostVnd;
    $('riskLimitInput').value = state.data.riskLimit; $('priceMoveInput').value = state.data.priceMoveUsd;
    $('lastSaved').textContent = state.data.updatedAt ? new Date(state.data.updatedAt).toLocaleString('vi-VN') : 'chưa lưu';
    renderReference(); renderMatrix(); renderCalcOptions(); calculateFob(); recalcAll(); setDirty(false);
  }
  async function loadData() {
    try { applyData(await api('/api/load-matrix')); } catch (e) { toast('Không tải được dữ liệu vị thế', 'error'); }
  }
  async function saveData() {
    $('btnSaveMatrix').innerHTML = '⏳ Đang lưu...';
    try {
      state.data.fobParams.contract = $('calcMonthSelect').value || state.data.fobParams.contract;
      const r = await api('/api/save-matrix', state.data);
      if (!r.success) throw new Error(r.error || 'Lỗi lưu');
      state.data = E.normalize(r.data); setDirty(false);
      $('lastSaved').textContent = new Date(state.data.updatedAt).toLocaleString('vi-VN');
      toast('✅ Đã lưu vị thế', 'success');
    } catch (e) { setDirty(true); toast('Lỗi lưu dữ liệu: ' + e.message, 'error'); }
  }

  // ---------- Sự kiện ----------
  $('positionBody').addEventListener('input', e => {
    const t = e.target; if (!t.classList.contains('cell-input')) return;
    state.data.matrix[t.dataset.key][t.dataset.code] = E.pick(t.value, 0);
    setDirty(true); recalcAll();
  });
  $('calcMonthSelect').addEventListener('change', () => { state.data.fobParams.contract = $('calcMonthSelect').value; setDirty(true); calculateFob(); });
  [['calcDiffInput', 'diffUsd'], ['calcFxInput', 'exchangeRate'], ['calcCostInput', 'processingCostVnd']].forEach(([id, key]) => {
    $(id).addEventListener('input', () => { state.data.fobParams[key] = E.pick($(id).value, 0); setDirty(true); calculateFob(); });
  });
  $('riskLimitInput').addEventListener('input', () => { state.data.riskLimit = E.pick($('riskLimitInput').value, 200); setDirty(true); recalcAll(); });
  $('priceMoveInput').addEventListener('input', () => { state.data.priceMoveUsd = E.pick($('priceMoveInput').value, 30); setDirty(true); recalcAll(); });
  $('btnEditDomestic').addEventListener('click', () => editReference('domesticPrice', 'domesticNote', 'Giá nhân xô nội địa (VNĐ/kg)'));
  $('btnEditFx').addEventListener('click', () => editReference('fxRate', 'fxNote', 'Tỷ giá USD/VND'));
  $('btnSaveMatrix').addEventListener('click', saveData);
  $('btnRefresh').addEventListener('click', () => fetchQuotes(true));
  $('btnResetSample').addEventListener('click', async () => {
    if (!confirm('Nạp bộ số liệu MẪU? Số liệu vị thế hiện tại sẽ bị thay thế (nên Xuất Excel lưu lại trước).')) return;
    const r = await api('/api/reset-matrix', {}); if (r.success) { applyData(r.data); toast('Đã nạp dữ liệu mẫu'); }
  });
  $('btnRoll').addEventListener('click', () => {
    const { data, dropped } = E.rollColumns(state.data);
    if (data.columns.join() === state.data.columns.join()) return toast('Ma trận đã ở 6 kỳ hạn hiện hành');
    let msg = `Chuyển ma trận sang các kỳ hạn: ${data.columns.join(', ')}?`;
    if (dropped.length) msg += `\n\n⚠️ Các số liệu sau ở kỳ hạn cũ sẽ bị loại khỏi ma trận:\n` + dropped.map(x => `• ${x.code} – ${x.row}: ${fmt(x.value)}`).join('\n') + '\n\n(Nên Xuất Excel lưu lại trước.)';
    if (!confirm(msg)) return;
    const updatedAt = state.data.updatedAt; applyData({ ...data, updatedAt }); setDirty(true); toast('Đã chuyển kỳ hạn – bấm Lưu vị thế để lưu');
  });
  $('btnExportCsv').addEventListener('click', exportCsv);
  $('btnAutoRefresh').addEventListener('click', () => {
    const on = !$('btnAutoRefresh').classList.contains('active');
    $('btnAutoRefresh').classList.toggle('active', on);
    $('btnAutoRefresh').innerHTML = `<span class="icon">⚡</span> Auto: ${on ? 'ON' : 'OFF'}`;
    clearInterval(state.autoTimer); if (on) state.autoTimer = setInterval(() => fetchQuotes(), 15000);
  });
  window.addEventListener('beforeunload', e => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- Xuất Excel (CSV) ----------
  function exportCsv() {
    const d = state.data; const pos = E.computePositions(d); const cols = d.columns;
    const q = s => `"${String(s).replace(/"/g, '""')}"`;
    const lines = [q('VIỆT THIÊN COFFEE GROUP – MA TRẬN VỊ THẾ HÀNG THỰC & PHÒNG HỘ SÀN'), q(`Xuất lúc: ${new Date().toLocaleString('vi-VN')}`), ''];
    const sp = E.computeSpreads(cols, state.quotes);
    lines.push([q('SPREAD (USD/tấn)'), q('-'), ...sp.map(s => q(s.value === null ? `${s.pair}: -` : `${s.pair} = ${s.value}`)), q('')].join(','));
    lines.push([q('DANH MỤC'), ...cols.map(c => q(`${E.contractLabel(c)} (${c})`)), q('TỔNG')].join(','));
    const line = (label, vals, total) => lines.push([q(label), ...vals.map(v => q(E.round2(v))), q(E.round2(total))].join(','));
    ['physical', 'futures', 'diff', 'memo'].forEach(g => {
      lines.push(q(E.GROUPS[g]));
      E.ROWS.filter(r => r.group === g).forEach(r => line(`${r.label} (${r.unit === 'lot' ? 'lot' : 'tấn'})`, cols.map(c => E.num(d.matrix[r.key][c])), pos.rowSums[r.key]));
      if (g === 'physical') line('Vị thế hàng thực (tấn)', pos.physical, pos.totals.physical);
      if (g === 'futures') line('Vị thế tài khoản sàn (tấn)', pos.futures, pos.totals.futures);
      if (g === 'diff') { line('Vị thế trừ lùi chưa chốt giá (tấn)', pos.diff, pos.totals.diff); line('TỔNG VỊ THẾ RÒNG (tấn)', pos.net, pos.totals.net); }
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `Bao_Cao_Vi_The_VietThien_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
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
  loadData().then(() => fetchQuotes());
  state.autoTimer = setInterval(() => fetchQuotes(), 15000);
})();

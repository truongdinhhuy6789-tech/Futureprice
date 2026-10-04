// VIỆT THIÊN — Biểu đồ thanh OHLC kiểu CQG (vẽ bằng canvas).
// Mỗi thanh = 1 khung thời gian: đỉnh/đáy = giá cao/thấp nhất, gạch trái = mở cửa, gạch phải = đóng cửa;
// xanh = đóng cao hơn mở (tăng), đỏ = giảm, xám = đứng giá; đường đứt = giá hiện tại. Thời gian không giao dịch được nén lại như CQG.
// Dữ liệu: [[giờ bắt đầu (giây), mở, cao, thấp, đóng, khối lượng], ...]
(function () {
  'use strict';
  const COLORS = { bg: '#000000', grid: '#262626', axis: '#9a9a9a', up: '#1ed37f', down: '#e5484d', flat: '#9ca3af', last: '#d4d4d4', cross: '#6b7280', vol: 'rgba(160,160,160,0.35)' };
  const fmtP = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pad = n => String(n).padStart(2, '0');

  // Gộp thanh nhỏ thành khung lớn hơn (step giây). Khung 1 ngày gộp theo ngày giờ máy đang xem.
  function agg(raw, step) {
    const out = [];
    (raw || []).forEach(b => {
      let t;
      if (step >= 86400) { const d = new Date(b[0] * 1000); t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000; }
      else t = Math.floor(b[0] / step) * step;
      const last = out[out.length - 1];
      if (last && last[0] === t) { last[2] = Math.max(last[2], b[2]); last[3] = Math.min(last[3], b[3]); last[4] = b[4]; last[5] += b[5] || 0; }
      else out.push([t, b[1], b[2], b[3], b[4], b[5] || 0]);
    });
    return out;
  }
  function niceStep(range, n) {
    const raw = range / Math.max(1, n); const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= raw) return m * pow;
    return 10 * pow;
  }
  function timeLabel(t, step) {
    const d = new Date(t * 1000);
    if (step >= 86400) return `${d.getDate()}/${d.getMonth() + 1}`;
    if (d.getHours() === 0 && d.getMinutes() === 0) return `${d.getDate()}-0:00`;   // kiểu CQG: ngày-giờ khi sang ngày mới
    return `${d.getHours()}:${pad(d.getMinutes())}`;
  }

  function mount(el, opts) {
    const o = Object.assign({ tf: 3600, tfs: [[300, '5m'], [900, '15m'], [3600, '1H'], [14400, '4H'], [86400, '1D']], decimals: 0, height: 340, style: 'bar' }, opts || {});
    let raw = [], base = 300, data = [], spacing = 9, offset = 0, hover = -1, note = '', marks = [], auto = true;
    el.classList.add('oh');
    el.innerHTML = `<div class="oh-bar"><div class="oh-tfs">${o.tfs.map(([s, l]) => `<button type="button" data-tf="${s}" class="${s === o.tf ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="oh-tools"><button type="button" data-st="bar" class="${o.style === 'bar' ? 'on' : ''}" title="Thanh OHLC như CQG">Thanh</button><button type="button" data-st="candle" class="${o.style === 'candle' ? 'on' : ''}" title="Nến Nhật">Nến</button>
      <button type="button" data-z="-1" title="Thu nhỏ">−</button><button type="button" data-z="1" title="Phóng to">+</button><button type="button" data-z="0" title="Về thanh mới nhất">⇥</button></div></div>
      <div class="oh-info" aria-live="polite"></div><div class="oh-wrap"><canvas class="oh-cv" role="img"></canvas><div class="oh-empty" hidden></div></div>
      <details class="oh-tbl"><summary>Xem dạng bảng (20 thanh gần nhất)</summary><div class="table-scroll"><table class="data-table"><thead><tr><th>Thời gian</th><th>Mở</th><th>Cao</th><th>Thấp</th><th>Đóng</th><th>KL</th></tr></thead><tbody></tbody></table></div></details>`;
    const cv = el.querySelector('canvas'), info = el.querySelector('.oh-info'), empty = el.querySelector('.oh-empty'), tbody = el.querySelector('tbody');
    const H = () => (window.matchMedia && window.matchMedia('(max-width: 768px)').matches ? Math.min(o.height, 300) : o.height);

    function rebuild() { data = agg(raw, Math.max(o.tf, base)); offset = Math.min(offset, Math.max(0, data.length - 5)); draw(); table(); }
    function table() {
      tbody.innerHTML = data.slice(-20).reverse().map(b => `<tr><td>${new Date(b[0] * 1000).toLocaleString('vi-VN', { hour12: false, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td><td>${fmtP(b[1], o.decimals)}</td><td>${fmtP(b[2], o.decimals)}</td><td>${fmtP(b[3], o.decimals)}</td><td>${fmtP(b[4], o.decimals)}</td><td>${b[5] || ''}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Chưa có dữ liệu</td></tr>';
    }
    function showInfo(b) {
      if (!b) { info.innerHTML = note ? `<span class="oh-note">${note}</span>` : ''; return; }
      const ch = b[4] - b[1]; const cls = ch > 0 ? 'up' : ch < 0 ? 'dn' : '';
      info.innerHTML = `<b>${new Date(b[0] * 1000).toLocaleString('vi-VN', { hour12: false, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</b>`
        + ` O <b>${fmtP(b[1], o.decimals)}</b> H <b>${fmtP(b[2], o.decimals)}</b> L <b>${fmtP(b[3], o.decimals)}</b> C <b class="${cls}">${fmtP(b[4], o.decimals)}</b> <span class="${cls}">${ch > 0 ? '+' : ''}${fmtP(ch, o.decimals)}</span>${b[5] ? ` · KL ${b[5]}` : ''}`;
    }
    function draw() {
      const W = Math.max(200, Math.round(el.clientWidth || 600)), Hh = H(); const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = Hh * dpr; cv.style.width = W + 'px'; cv.style.height = Hh + 'px';
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = COLORS.bg; g.fillRect(0, 0, W, Hh);
      empty.hidden = !!data.length; if (!data.length) { empty.innerHTML = note || 'Chưa có dữ liệu'; showInfo(null); return; }
      const axisW = 62, axisH = 22, volH = Math.round((Hh - axisH) * 0.16), plotW = W - axisW, plotH = Hh - axisH - volH - 6;
      if (auto) spacing = Math.max(5, Math.min(18, Math.floor((plotW - 12) / Math.max(12, data.length))));  // ít thanh thì giãn cho đầy khung như CQG
      const n = Math.max(5, Math.floor((plotW - 8) / spacing)); const end = data.length - offset; const start = Math.max(0, end - n); const vis = data.slice(start, end);
      let lo = Math.min(...vis.map(b => b[3])), hi = Math.max(...vis.map(b => b[2])); if (hi === lo) { hi += 2; lo -= 2; }
      const padP = (hi - lo) * 0.08; lo -= padP; hi += padP;
      const y = p => 6 + (hi - p) / (hi - lo) * (plotH - 6); const x = i => plotW - 6 - (vis.length - 1 - i) * spacing;
      // Lưới giá + nhãn trục phải
      const st = niceStep(hi - lo, 6); g.font = '11px "JetBrains Mono", monospace'; g.textBaseline = 'middle';
      for (let p = Math.ceil(lo / st) * st; p <= hi; p += st) { const yy = Math.round(y(p)) + 0.5; g.strokeStyle = COLORS.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(0, yy); g.lineTo(plotW, yy); g.stroke(); g.fillStyle = COLORS.axis; g.fillText(fmtP(p, st < 1 ? 2 : o.decimals), plotW + 6, yy); }
      // Lưới thời gian + nhãn dưới (cách nhau ≥ 70px)
      const tf = Math.max(o.tf, base); const steps = [3600, 3 * 3600, 6 * 3600, 12 * 3600, 86400, 2 * 86400, 7 * 86400, 30 * 86400];
      const span = vis.length > 1 ? (vis[vis.length - 1][0] - vis[0][0]) / (vis.length - 1) : tf;
      const lStep = steps.find(s2 => s2 >= tf && (s2 / span) * spacing >= 70) || steps[steps.length - 1];
      let lastKey = null, lastDay = null; g.textBaseline = 'top'; g.textAlign = 'center';
      vis.forEach((b, i) => {
        const d = new Date(b[0] * 1000); const key = lStep >= 86400 ? Math.floor((d.getTime() / 1000 + (-d.getTimezoneOffset() * 60)) / lStep) : Math.floor((b[0] + (-d.getTimezoneOffset() * 60)) / lStep);
        if (lastKey !== null && key !== lastKey) { const xx = Math.round(x(i)) + 0.5; g.strokeStyle = COLORS.grid; g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, plotH + volH + 6); g.stroke(); g.fillStyle = COLORS.axis; const day = d.getDate(); let lb = timeLabel(b[0], tf); if (tf < 86400 && day !== lastDay && !/-/.test(lb)) lb = day + '-' + lb; lastDay = day; g.fillText(lb, xx, Hh - axisH + 4); }
        lastKey = key;
      });
      g.textAlign = 'left';
      // Khối lượng (dưới)
      const vMax = Math.max(1, ...vis.map(b => b[5] || 0)); g.fillStyle = COLORS.vol;
      vis.forEach((b, i) => { if (!b[5]) return; const h = Math.max(1, b[5] / vMax * volH); g.fillRect(Math.round(x(i) - spacing * 0.3), plotH + 6 + volH - h, Math.max(1, Math.round(spacing * 0.6)), h); });
      // Thanh giá
      const tick = Math.max(2, Math.round(spacing * 0.38)); const lw = spacing >= 8 ? 2 : 1;
      vis.forEach((b, i) => {
        const c = b[4] > b[1] ? COLORS.up : b[4] < b[1] ? COLORS.down : COLORS.flat; const xx = Math.round(x(i)) + (lw % 2 ? 0.5 : 0);
        g.strokeStyle = c; g.fillStyle = c; g.lineWidth = lw;
        if (o.style === 'candle') {
          g.beginPath(); g.moveTo(xx, y(b[2])); g.lineTo(xx, y(b[3])); g.stroke();
          const top = y(Math.max(b[1], b[4])), bot = y(Math.min(b[1], b[4])); g.fillRect(xx - tick, top, tick * 2, Math.max(1, bot - top));
        } else {
          g.beginPath(); g.moveTo(xx, y(b[2])); g.lineTo(xx, y(b[3])); g.moveTo(xx - tick, Math.round(y(b[1])) + 0.5); g.lineTo(xx, Math.round(y(b[1])) + 0.5);
          g.moveTo(xx, Math.round(y(b[4])) + 0.5); g.lineTo(xx + tick, Math.round(y(b[4])) + 0.5); g.stroke();
        }
      });
      // Dấu lệnh đã khớp của mình: ▲ mua (dưới giá khớp), ▼ bán (trên giá khớp)
      marks.forEach(mk => {
        let i = -1; for (let k = vis.length - 1; k >= 0; k--) { if (vis[k][0] <= mk.t) { i = k; break; } } if (i < 0 || (i === vis.length - 1 && mk.t > vis[i][0] + Math.max(o.tf, base) * 2)) return;
        const xx = x(i), yy = y(mk.px), s2 = 5; g.fillStyle = mk.side === 'BUY' ? '#60a5fa' : '#fb7185'; g.beginPath();
        if (mk.side === 'BUY') { g.moveTo(xx, yy + 3); g.lineTo(xx - s2, yy + 3 + s2 * 1.6); g.lineTo(xx + s2, yy + 3 + s2 * 1.6); } else { g.moveTo(xx, yy - 3); g.lineTo(xx - s2, yy - 3 - s2 * 1.6); g.lineTo(xx + s2, yy - 3 - s2 * 1.6); }
        g.closePath(); g.fill();
      });
      // Đường giá hiện tại (đứt nét) + nhãn
      const lastB = data[data.length - 1]; const ly = Math.round(y(lastB[4])) + 0.5;
      if (ly > 0 && ly < plotH) { g.setLineDash([5, 4]); g.strokeStyle = COLORS.last; g.lineWidth = 1; g.beginPath(); g.moveTo(0, ly); g.lineTo(plotW, ly); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#e5e5e5'; g.fillRect(plotW + 1, ly - 9, axisW - 1, 18); g.fillStyle = '#000'; g.textBaseline = 'middle'; g.font = 'bold 11px "JetBrains Mono", monospace'; g.fillText(fmtP(lastB[4], o.decimals), plotW + 6, ly); }
      // Dấu chữ thập khi rê chuột / chạm
      if (hover >= 0 && hover < vis.length) { const xx = Math.round(x(hover)) + 0.5; g.strokeStyle = COLORS.cross; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, plotH + volH + 6); g.stroke(); g.setLineDash([]); showInfo(vis[hover]); }
      else { showInfo(lastB); if (note) info.insertAdjacentHTML('beforeend', ' <span class="oh-note">· ' + note + '</span>'); }
      draw.geom = { x, vis, plotW };
      cv.setAttribute('aria-label', `Biểu đồ thanh ${o.title || ''}: ${vis.length} thanh, giá cuối ${fmtP(lastB[4], o.decimals)}, cao ${fmtP(Math.max(...vis.map(b => b[2])), o.decimals)}, thấp ${fmtP(Math.min(...vis.map(b => b[3])), o.decimals)}`);
    }
    // Sự kiện: khung thời gian, kiểu thanh, phóng to, kéo để xem lùi, rê chuột xem số liệu
    el.querySelector('.oh-bar').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tf) { o.tf = Number(b.dataset.tf); el.querySelectorAll('[data-tf]').forEach(x => x.classList.toggle('on', x === b)); offset = 0; if (o.onTf) o.onTf(o.tf); rebuild(); }
      else if (b.dataset.st) { o.style = b.dataset.st; el.querySelectorAll('[data-st]').forEach(x => x.classList.toggle('on', x === b)); draw(); }
      else if (b.dataset.z === '0') { offset = 0; auto = true; draw(); }
      else if (b.dataset.z) { auto = false; spacing = Math.max(4, Math.min(30, spacing + Number(b.dataset.z) * 3)); draw(); }
    });
    let drag = null;
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, off: offset }; });
    window.addEventListener('pointerup', () => { drag = null; });
    cv.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect(); const mx = e.clientX - r.left;
      if (drag && Math.abs(e.clientX - drag.x) > 4) { offset = Math.max(0, Math.min(Math.max(0, data.length - 5), drag.off + Math.round((e.clientX - drag.x) / spacing))); hover = -1; return draw(); }
      const gm = draw.geom; if (!gm) return; let best = -1, bd = 1e9; gm.vis.forEach((b, i) => { const d = Math.abs(gm.x(i) - mx); if (d < bd) { bd = d; best = i; } });
      if (best !== hover) { hover = bd <= spacing ? best : -1; draw(); }
    });
    cv.addEventListener('pointerleave', () => { hover = -1; draw(); });
    let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
    return {
      setData(bars, baseSec, msg, mk) { raw = bars || []; base = baseSec || 300; note = msg || ''; marks = mk || []; rebuild(); },
      redraw: draw,
      get tf() { return o.tf; }
    };
  }

  // ---------- Biểu đồ giá London / New York thật ở thẻ Bảng giá (dữ liệu máy chủ ghi từng 5 phút) ----------
  function mountBoard() {
    const host = document.getElementById('boardChart'); if (!host) return;
    host.innerHTML = `<div class="oh-head"><h3 class="section-title">📈 Biểu đồ thanh (OHLC) – kiểu CQG</h3><select id="ohSym" class="form-control" aria-label="Kỳ hạn"></select></div>
      <p class="section-desc">Mỗi thanh: đỉnh = giá cao nhất, đáy = thấp nhất, gạch trái = mở cửa, gạch phải = đóng cửa; xanh tăng, đỏ giảm, xám đứng giá; đường đứt = giá hiện tại. Rê chuột/chạm để xem số, kéo ngang để xem lùi.</p><div id="ohBoard"></div>`;
    const ch = mount(document.getElementById('ohBoard'), { tf: 3600, title: 'Robusta London' });
    const sel = document.getElementById('ohSym'); let sym = '', busy = false;
    const panel = host.closest('.tab-panel');
    function options() {
      const st = window.VTApp && window.VTApp.getState ? window.VTApp.getState() : null; const q = (st && st.quotes) || {};
      const rows = (q.coffee_liffe || []).concat(q.coffee_ice || []).filter(r => r && r.Name);
      if (!rows.length) return;
      const names = rows.map(r => r.Name); if (!sym) { const rm = (q.coffee_liffe || []).slice().sort((a, b) => Number(b.OpInt) - Number(a.OpInt))[0]; sym = rm ? rm.Name : names[0]; }
      const html = rows.map(r => `<option value="${r.Name}"${r.Name === sym ? ' selected' : ''}>${r.Name.startsWith('KC') ? 'Arabica NY' : 'Robusta London'} · ${r.Name} (${r.Month || ''})</option>`).join('');
      if (sel.dataset.html !== html) { sel.innerHTML = html; sel.dataset.html = html; }
    }
    async function load() {
      if (busy || !panel || panel.hidden) return; options(); if (!sym) { setTimeout(load, 1500); return; } busy = true;
      try {
        const r = await fetch('/api/bars?sym=' + encodeURIComponent(sym), { cache: 'no-store' }); const d = await r.json();
        const n = (d.bars || []).length; const first = n ? new Date(d.bars[0][0] * 1000).toLocaleDateString('vi-VN') : '';
        ch.setData(d.bars || [], d.bar || 300, n < 30 ? `Hệ thống bắt đầu ghi thanh 5 phút từ ${first || 'hôm nay'} – biểu đồ sẽ dày dần theo từng phiên London (≈ 15:00–23:30 giờ VN).` : '');
      } catch (e) { ch.setData([], 300, 'Chưa tải được dữ liệu biểu đồ.'); }
      busy = false;
    }
    sel.addEventListener('change', () => { sym = sel.value; load(); });
    // Tải ngay khi thẻ Bảng giá hiện ra (bấm thanh thẻ, mở lại trang đang ở thẻ này…)
    if (panel) new MutationObserver(() => { if (!panel.hidden) load(); }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    setInterval(load, 30000); setTimeout(load, 800);
  }
  window.VTOhlc = { mount, agg };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBoard); else mountBoard();
})();

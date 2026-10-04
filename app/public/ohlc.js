// VIỆT THIÊN — Biểu đồ giá kiểu CQG (vẽ bằng canvas).
// Kiểu: Dạng cột (OHLC: gạch trái = mở, gạch phải = đóng), Thanh nến, Nến Hollow, Volume Candles, Đường, Vùng, Heikin-Ashi.
// Xanh = đóng cao hơn mở, đỏ = thấp hơn, xám = bằng; đường đứt = giá hiện tại; vạch đứng + ◆ = đầu phiên mới; nhãn "30-15:00", "Oct 1" như CQG.
// Nghiên cứu: SMA 20, EMA 20, Bollinger (20, 2), khối lượng. Dữ liệu: [[giờ bắt đầu (giây), mở, cao, thấp, đóng, khối lượng], ...]
(function () {
  'use strict';
  const COLORS = { bg: '#000000', grid: '#262626', axis: '#9a9a9a', up: '#1ed37f', down: '#e5484d', flat: '#9ca3af', last: '#d4d4d4', cross: '#8b8b8b', vol: 'rgba(160,160,160,0.35)', line: '#5ab0ff', session: '#3f3f3f', sma: '#f5c518', ema: '#22d3ee', bb: '#c084fc' };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const STYLES = [['candle', 'Thanh nến'], ['hollow', 'Nến Hollow'], ['volcandle', 'Volume Candles'], ['bar', 'Dạng cột'], ['line', 'Đường'], ['area', 'Vùng'], ['ha', 'Heikin-Ashi']];
  const STUDIES = [['sma', 'SMA 20 – trung bình 20 thanh'], ['ema', 'EMA 20 – trung bình hàm mũ'], ['bb', 'Bollinger (20, 2) – dải biến động'], ['vol', 'Khối lượng']];
  const fmtP = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pad = n => String(n).padStart(2, '0');

  // Gộp thanh nhỏ thành khung lớn hơn: phút/giờ theo bội số, ngày/tuần/tháng theo lịch máy đang xem
  function bucket(t, step) {
    const d = new Date(t * 1000);
    if (step >= 2592000) return new Date(d.getFullYear(), d.getMonth(), 1).getTime() / 1000;
    if (step >= 604800) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime() / 1000; }
    if (step >= 86400) return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000;
    return Math.floor(t / step) * step;
  }
  function agg(raw, step) {
    const out = [];
    (raw || []).forEach(b => {
      const t = bucket(b[0], step); const last = out[out.length - 1];
      if (last && last[0] === t) { last[2] = Math.max(last[2], b[2]); last[3] = Math.min(last[3], b[3]); last[4] = b[4]; last[5] += b[5] || 0; }
      else out.push([t, b[1], b[2], b[3], b[4], b[5] || 0]);
    });
    return out;
  }
  function heikin(data) {
    const out = []; let po = 0, pc = 0;
    data.forEach((b, i) => { const c = (b[1] + b[2] + b[3] + b[4]) / 4; const o = i ? (po + pc) / 2 : (b[1] + b[4]) / 2; out.push([b[0], o, Math.max(b[2], o, c), Math.min(b[3], o, c), c, b[5]]); po = o; pc = c; });
    return out;
  }
  const sma = (v, n) => v.map((_, i) => (i + 1 < n ? null : v.slice(i + 1 - n, i + 1).reduce((s, x) => s + x, 0) / n));
  function ema(v, n) { const k = 2 / (n + 1); let e = null; return v.map((x, i) => { e = e === null ? x : x * k + e * (1 - k); return i + 1 < n ? null : e; }); }
  function boll(v, n, m) { const mid = sma(v, n); return mid.map((md, i) => { if (md === null) return null; const sl = v.slice(i + 1 - n, i + 1); const sd = Math.sqrt(sl.reduce((s, x) => s + (x - md) * (x - md), 0) / n); return [md - m * sd, md, md + m * sd]; }); }
  function niceStep(range, n) { const raw = range / Math.max(1, n); const pow = Math.pow(10, Math.floor(Math.log10(raw))); for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= raw) return m * pow; return 10 * pow; }
  // Nhãn trục thời gian kiểu CQG: sang ngày mới "30-15:00" (mùng 1 thì "Oct 1"), trong ngày "21:00"
  function timeLabel(t, step, newDay) {
    const d = new Date(t * 1000);
    if (step >= 2592000) return `${MON[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    if (step >= 86400) return d.getDate() === 1 || step >= 604800 ? `${MON[d.getMonth()]} ${d.getDate()}` : String(d.getDate());
    if (newDay) return d.getDate() === 1 ? `${MON[d.getMonth()]} 1` : `${d.getDate()}-${d.getHours()}:${pad(d.getMinutes())}`;
    return `${d.getHours()}:${pad(d.getMinutes())}`;
  }
  const tfName = s => ({ 60: '1 Phút', 300: '5 Phút', 600: '10 Phút', 900: '15 Phút', 1800: '30 Phút', 3600: '60 Phút', 14400: '4 Giờ', 86400: 'Hàng ngày', 604800: 'Hàng tuần', 2592000: 'Hàng tháng' }[s] || s + 's');
  const when = (t, step) => { const d = new Date(t * 1000); return step >= 86400 ? `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : `${MON[d.getMonth()]} ${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  function mount(el, opts) {
    const o = Object.assign({ tf: 3600, tfs: [[300, '5m'], [900, '15m'], [3600, '1H'], [14400, '4H'], [86400, '1D']], decimals: 0, height: 340, style: 'bar', toolbar: true, legend: '', studies: ['vol'], cross: true }, opts || {});
    let raw = [], base = 300, data = [], view = [], spacing = 9, offset = 0, hover = -1, hoverY = null, note = '', marks = [], auto = true;
    el.classList.add('oh');
    el.innerHTML = (o.toolbar ? `<div class="oh-bar"><div class="oh-tfs">${o.tfs.map(([s, l]) => `<button type="button" data-tf="${s}" class="${s === o.tf ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="oh-tools"><button type="button" data-st="bar" class="${o.style === 'bar' ? 'on' : ''}" title="Dạng cột (OHLC) như CQG">Thanh</button><button type="button" data-st="candle" class="${o.style === 'candle' ? 'on' : ''}" title="Thanh nến">Nến</button>
      <button type="button" data-z="-1" title="Thu nhỏ">−</button><button type="button" data-z="1" title="Phóng to">+</button><button type="button" data-z="0" title="Về thanh mới nhất">⇥</button></div></div>
      <div class="oh-info" aria-live="polite"></div>` : '')
      + `<div class="oh-wrap"><canvas class="oh-cv" role="img"></canvas><div class="oh-legend"${o.legend ? '' : ' hidden'}></div><div class="oh-empty" hidden></div></div>`
      + `<details class="oh-tbl"><summary>Xem dạng bảng (20 thanh gần nhất)</summary><div class="table-scroll"><table class="data-table"><thead><tr><th>Thời gian</th><th>Mở</th><th>Cao</th><th>Thấp</th><th>Đóng</th><th>KL</th></tr></thead><tbody></tbody></table></div></details>`;
    const cv = el.querySelector('canvas'), info = el.querySelector('.oh-info'), empty = el.querySelector('.oh-empty'), tbody = el.querySelector('tbody'), legend = el.querySelector('.oh-legend');
    const H = () => (typeof o.height === 'function' ? o.height() : (window.matchMedia && window.matchMedia('(max-width: 768px)').matches ? Math.min(o.height, 300) : o.height));

    function rebuild() { data = agg(raw, Math.max(o.tf, base)); view = o.style === 'ha' ? heikin(data) : data; offset = Math.min(offset, Math.max(0, data.length - 5)); draw(); table(); }
    function table() {
      tbody.innerHTML = data.slice(-20).reverse().map(b => `<tr><td>${when(b[0], Math.max(o.tf, base))}</td><td>${fmtP(b[1], o.decimals)}</td><td>${fmtP(b[2], o.decimals)}</td><td>${fmtP(b[3], o.decimals)}</td><td>${fmtP(b[4], o.decimals)}</td><td>${b[5] || ''}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Chưa có dữ liệu</td></tr>';
    }
    function showInfo(b, isHover) {
      const tf = Math.max(o.tf, base); const real = b && data.find(x => x[0] === b[0]);
      if (legend && o.legend) {
        const cls = real && real[4] >= real[1] ? 'up' : 'dn';
        legend.innerHTML = `<div class="oh-lg-h"><span class="oh-chk"></span>${o.legend}</div>` + (real && isHover ? `<div class="oh-lg-b"><div>${o.legend} (${tfName(tf)})</div><div>${when(real[0], tf)}</div>`
          + `<div><span>O</span><b class="${cls}">${fmtP(real[1], o.decimals)}</b></div><div><span>H</span><b class="${cls}">${fmtP(real[2], o.decimals)}</b></div>`
          + `<div><span>L</span><b class="${cls}">${fmtP(real[3], o.decimals)}</b></div><div><span>C</span><b class="${cls}">${fmtP(real[4], o.decimals)}</b></div>${real[5] ? `<div><span>V</span><b>${real[5]}</b></div>` : ''}</div>` : '');
      }
      if (!info) return;
      if (!real) { info.innerHTML = note ? `<span class="oh-note">${note}</span>` : ''; return; }
      const ch = real[4] - real[1]; const c2 = ch > 0 ? 'up' : ch < 0 ? 'dn' : '';
      info.innerHTML = `<b>${when(real[0], tf)}</b> O <b>${fmtP(real[1], o.decimals)}</b> H <b>${fmtP(real[2], o.decimals)}</b> L <b>${fmtP(real[3], o.decimals)}</b> C <b class="${c2}">${fmtP(real[4], o.decimals)}</b> <span class="${c2}">${ch > 0 ? '+' : ''}${fmtP(ch, o.decimals)}</span>${real[5] ? ` · KL ${real[5]}` : ''}`
        + (!isHover && note ? ` <span class="oh-note">· ${note}</span>` : '');
    }
    function draw() {
      const W = Math.max(200, Math.round(el.clientWidth || 600)), Hh = H(); const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = Hh * dpr; cv.style.width = W + 'px'; cv.style.height = Hh + 'px';
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = COLORS.bg; g.fillRect(0, 0, W, Hh);
      empty.hidden = !!data.length; if (!data.length) { empty.innerHTML = note || 'Chưa có dữ liệu'; showInfo(null); return; }
      const showVol = o.studies.includes('vol');
      const axisW = W < 420 ? 54 : 62, axisH = 22, volH = showVol ? Math.round((Hh - axisH) * 0.16) : 0, plotW = W - axisW, plotH = Hh - axisH - volH - 6;
      if (auto) spacing = Math.max(5, Math.min(18, Math.floor((plotW - 12) / Math.max(12, data.length))));  // ít thanh thì giãn cho đầy khung
      const n = Math.max(5, Math.floor((plotW - 8) / spacing)); const end = view.length - offset; const start = Math.max(0, end - n);
      const vis = view.slice(start, end);
      const closesAll = view.map(b => b[4]);
      const st = { sma: o.studies.includes('sma') ? sma(closesAll, 20) : null, ema: o.studies.includes('ema') ? ema(closesAll, 20) : null, bb: o.studies.includes('bb') ? boll(closesAll, 20, 2) : null };
      let lo = Math.min(...vis.map(b => b[3])), hi = Math.max(...vis.map(b => b[2]));
      if (st.bb) vis.forEach((b, i) => { const v = st.bb[start + i]; if (v) { lo = Math.min(lo, v[0]); hi = Math.max(hi, v[2]); } });
      if (hi === lo) { hi += 2; lo -= 2; } const padP = (hi - lo) * 0.08; lo -= padP; hi += padP;
      const y = p => 6 + (hi - p) / (hi - lo) * (plotH - 6); const x = i => plotW - 6 - (vis.length - 1 - i) * spacing;
      // Lưới giá + nhãn trục phải
      const stp = niceStep(hi - lo, 6); g.font = '11px "JetBrains Mono", monospace'; g.textBaseline = 'middle';
      for (let p = Math.ceil(lo / stp) * stp; p <= hi; p += stp) { const yy = Math.round(y(p)) + 0.5; g.strokeStyle = COLORS.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(0, yy); g.lineTo(plotW, yy); g.stroke(); g.fillStyle = COLORS.axis; g.fillText(fmtP(p, stp < 1 ? 2 : o.decimals), plotW + 6, yy); }
      // Vạch đầu phiên mới (◆) + nhãn thời gian cách nhau ≥ 70px
      const tf = Math.max(o.tf, base); let lastX = -999, prevDay = null; g.textBaseline = 'top'; g.textAlign = 'center';
      const hourEvery = Math.max(1, Math.ceil((70 / spacing) * tf / 3600));
      vis.forEach((b, i) => {
        const d = new Date(b[0] * 1000); const day = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; const newDay = prevDay !== null && day !== prevDay && tf < 86400; const xx = Math.round(x(i)) + 0.5;
        if (newDay) { g.strokeStyle = COLORS.session; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, plotH + volH + 6); g.stroke(); g.fillStyle = COLORS.session; g.beginPath(); g.moveTo(xx, plotH + volH + 1); g.lineTo(xx + 4, plotH + volH + 5); g.lineTo(xx, plotH + volH + 9); g.lineTo(xx - 4, plotH + volH + 5); g.closePath(); g.fill(); }
        const mark = newDay || (tf >= 86400 ? i % Math.max(1, Math.round(70 / spacing)) === 0 : (d.getMinutes() === 0 && d.getHours() % hourEvery === 0));
        if (mark && xx - lastX >= 70 && i > 0) { g.fillStyle = COLORS.axis; g.fillText(timeLabel(b[0], tf, newDay), xx, Hh - axisH + 4); lastX = xx; }
        prevDay = day;
      });
      g.textAlign = 'left';
      // Khối lượng
      if (showVol) { const vMax = Math.max(1, ...vis.map(b => b[5] || 0)); g.fillStyle = COLORS.vol; vis.forEach((b, i) => { if (!b[5]) return; const h = Math.max(1, b[5] / vMax * volH); g.fillRect(Math.round(x(i) - spacing * 0.3), plotH + 6 + volH - h, Math.max(1, Math.round(spacing * 0.6)), h); }); }
      // Giá theo kiểu đã chọn
      const tick = Math.max(2, Math.round(spacing * 0.38)); const lw = spacing >= 8 ? 2 : 1; const vMaxC = Math.max(1, ...vis.map(b => b[5] || 0));
      if (o.style === 'line' || o.style === 'area') {
        const path = () => { g.beginPath(); vis.forEach((b, i) => { const xx = x(i), yy = y(b[4]); if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); }); };
        if (o.style === 'area') { path(); g.lineTo(x(vis.length - 1), plotH); g.lineTo(x(0), plotH); g.closePath(); const gr = g.createLinearGradient(0, 0, 0, plotH); gr.addColorStop(0, 'rgba(90,176,255,0.45)'); gr.addColorStop(1, 'rgba(90,176,255,0.03)'); g.fillStyle = gr; g.fill(); }
        path(); g.strokeStyle = COLORS.line; g.lineWidth = 2; g.stroke();
      } else vis.forEach((b, i) => {
        const up = b[4] > b[1], dn = b[4] < b[1]; const c = up ? COLORS.up : dn ? COLORS.down : COLORS.flat; const xx = Math.round(x(i)) + (lw % 2 ? 0.5 : 0);
        g.strokeStyle = c; g.fillStyle = c; g.lineWidth = lw;
        if (o.style === 'bar') {
          g.beginPath(); g.moveTo(xx, y(b[2])); g.lineTo(xx, y(b[3])); g.moveTo(xx - tick, Math.round(y(b[1])) + 0.5); g.lineTo(xx, Math.round(y(b[1])) + 0.5);
          g.moveTo(xx, Math.round(y(b[4])) + 0.5); g.lineTo(xx + tick, Math.round(y(b[4])) + 0.5); g.stroke();
        } else {
          const half = o.style === 'volcandle' ? Math.max(1, Math.round(tick * (0.35 + 0.95 * (b[5] || 0) / vMaxC))) : tick;
          g.lineWidth = 1; g.beginPath(); g.moveTo(xx, y(b[2])); g.lineTo(xx, y(b[3])); g.stroke();
          const top = y(Math.max(b[1], b[4])), bot = y(Math.min(b[1], b[4]));
          if (o.style === 'hollow' && up) { g.fillStyle = COLORS.bg; g.fillRect(xx - half, top, half * 2, Math.max(1, bot - top)); g.strokeRect(xx - half + 0.5, top + 0.5, half * 2 - 1, Math.max(1, bot - top - 1)); }
          else g.fillRect(xx - half, top, half * 2, Math.max(1, bot - top));
        }
      });
      // Nghiên cứu (đường chồng lên giá)
      const plot = (arr, color, pick, dash) => { g.strokeStyle = color; g.lineWidth = 1.5; g.setLineDash(dash || []); g.beginPath(); let on = false; vis.forEach((b, i) => { const v = arr[start + i]; const val = v === null || v === undefined ? null : pick ? pick(v) : v; if (val === null) { on = false; return; } const xx = x(i), yy = y(val); if (on) g.lineTo(xx, yy); else { g.moveTo(xx, yy); on = true; } }); g.stroke(); g.setLineDash([]); };
      if (st.sma) plot(st.sma, COLORS.sma); if (st.ema) plot(st.ema, COLORS.ema);
      if (st.bb) { plot(st.bb, COLORS.bb, v => v[0], [4, 3]); plot(st.bb, COLORS.bb, v => v[1]); plot(st.bb, COLORS.bb, v => v[2], [4, 3]); }
      // Dấu lệnh đã khớp: ▲ mua, ▼ bán
      marks.forEach(mk => {
        let i = -1; for (let k = vis.length - 1; k >= 0; k--) { if (vis[k][0] <= mk.t) { i = k; break; } } if (i < 0 || (i === vis.length - 1 && mk.t > vis[i][0] + tf * 2)) return;
        const xx = x(i), yy = y(mk.px), s2 = 5; g.fillStyle = mk.side === 'BUY' ? '#60a5fa' : '#fb7185'; g.beginPath();
        if (mk.side === 'BUY') { g.moveTo(xx, yy + 3); g.lineTo(xx - s2, yy + 3 + s2 * 1.6); g.lineTo(xx + s2, yy + 3 + s2 * 1.6); } else { g.moveTo(xx, yy - 3); g.lineTo(xx - s2, yy - 3 - s2 * 1.6); g.lineTo(xx + s2, yy - 3 - s2 * 1.6); }
        g.closePath(); g.fill();
      });
      // Giá hiện tại: đường đứt + nhãn xám có mũi nhọn (như CQG)
      const lastB = data[data.length - 1]; const ly = Math.round(y(lastB[4])) + 0.5;
      if (ly > 0 && ly < plotH) {
        g.setLineDash([5, 4]); g.strokeStyle = COLORS.last; g.lineWidth = 1; g.beginPath(); g.moveTo(0, ly); g.lineTo(plotW, ly); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#a3a3a3'; g.beginPath(); g.moveTo(plotW - 2, ly); g.lineTo(plotW + 6, ly - 9); g.lineTo(W, ly - 9); g.lineTo(W, ly + 9); g.lineTo(plotW + 6, ly + 9); g.closePath(); g.fill();
        g.fillStyle = '#000'; g.textBaseline = 'middle'; g.font = 'bold 11px "JetBrains Mono", monospace'; g.fillText(fmtP(lastB[4], o.decimals), plotW + 8, ly);
      }
      // Dấu thập
      if (o.cross && hover >= 0 && hover < vis.length) {
        const xx = Math.round(x(hover)) + 0.5; g.strokeStyle = COLORS.cross; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, plotH + volH + 6); g.stroke();
        if (hoverY !== null && hoverY < plotH) { g.beginPath(); g.moveTo(0, hoverY + 0.5); g.lineTo(plotW, hoverY + 0.5); g.stroke(); const pv = hi - (hoverY - 6) / (plotH - 6) * (hi - lo);
          g.setLineDash([]); g.fillStyle = '#3f3f46'; g.fillRect(plotW + 1, hoverY - 9, axisW - 1, 18); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.font = '11px "JetBrains Mono", monospace'; g.fillText(fmtP(pv, o.decimals), plotW + 6, hoverY); }
        g.setLineDash([]); showInfo(vis[hover], true);
      } else showInfo(lastB, false);
      draw.geom = { x, vis, plotW, plotH };
      cv.setAttribute('aria-label', `Biểu đồ ${o.legend || o.title || ''}: ${vis.length} thanh, giá cuối ${fmtP(lastB[4], o.decimals)}, cao ${fmtP(Math.max(...vis.map(b => b[2])), o.decimals)}, thấp ${fmtP(Math.min(...vis.map(b => b[3])), o.decimals)}`);
    }
    if (o.toolbar) el.querySelector('.oh-bar').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tf) { o.tf = Number(b.dataset.tf); el.querySelectorAll('[data-tf]').forEach(x => x.classList.toggle('on', x === b)); offset = 0; if (o.onTf) o.onTf(o.tf); rebuild(); }
      else if (b.dataset.st) { o.style = b.dataset.st; el.querySelectorAll('[data-st]').forEach(x => x.classList.toggle('on', x === b)); rebuild(); }
      else if (b.dataset.z === '0') { offset = 0; auto = true; draw(); }
      else if (b.dataset.z) { auto = false; spacing = Math.max(4, Math.min(30, spacing + Number(b.dataset.z) * 3)); draw(); }
    });
    // Rê chuột / chạm: dấu thập + số liệu; kéo ngang: xem lùi
    let drag = null;
    const nearest = mx => { const gm = draw.geom; if (!gm) return -1; let best = -1, bd = 1e9; gm.vis.forEach((b, i) => { const d = Math.abs(gm.x(i) - mx); if (d < bd) { bd = d; best = i; } }); return bd <= Math.max(spacing, 12) ? best : -1; };
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, off: offset, moved: false }; });
    window.addEventListener('pointerup', e => { if (drag && !drag.moved && e.target === cv) { const r = cv.getBoundingClientRect(); const h = nearest(e.clientX - r.left); hover = h === hover && e.pointerType !== 'mouse' ? -1 : h; hoverY = e.clientY - r.top; draw(); } drag = null; });
    cv.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect(); const mx = e.clientX - r.left;
      if (drag && Math.abs(e.clientX - drag.x) > 6) { drag.moved = true; auto = false; offset = Math.max(0, Math.min(Math.max(0, data.length - 5), drag.off + Math.round((e.clientX - drag.x) / spacing))); hover = -1; return draw(); }
      if (e.pointerType !== 'mouse') return;
      const h = nearest(mx); const hy = e.clientY - r.top; if (h !== hover || Math.abs((hoverY || 0) - hy) > 2) { hover = h; hoverY = hy; draw(); }
    });
    cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hover = -1; hoverY = null; draw(); } });
    let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
    return {
      setData(bars, baseSec, msg, mk) { raw = bars || []; base = baseSec || 300; note = msg || ''; marks = mk || []; rebuild(); },
      setTf(tf) { o.tf = tf; offset = 0; el.querySelectorAll('[data-tf]').forEach(x => x.classList.toggle('on', Number(x.dataset.tf) === tf)); rebuild(); },
      setStyle(stl) { o.style = stl; rebuild(); },
      setStudies(list) { o.studies = list.slice(); draw(); },
      setCross(on) { o.cross = !!on; if (!on) hover = -1; draw(); },
      setLegend(txt) { o.legend = txt; if (legend) legend.hidden = !txt; draw(); },
      latest() { offset = 0; auto = true; draw(); },
      zoom(d) { auto = false; spacing = Math.max(4, Math.min(30, spacing + d * 3)); draw(); },
      redraw: draw,
      get tf() { return o.tf; }, get style() { return o.style; }, get studies() { return o.studies.slice(); }, get cross() { return o.cross; }
    };
  }

  // ---------- Biểu đồ giá London / New York thật ở thẻ Bảng giá (dữ liệu máy chủ ghi từng 5 phút) ----------
  function mountBoard() {
    const host = document.getElementById('boardChart'); if (!host) return;
    host.innerHTML = `<div class="oh-head"><h3 class="section-title">📈 Biểu đồ thanh (OHLC) – kiểu CQG</h3><select id="ohSym" class="form-control" aria-label="Kỳ hạn"></select></div>
      <p class="section-desc">Mỗi thanh: đỉnh = giá cao nhất, đáy = thấp nhất, gạch trái = mở cửa, gạch phải = đóng cửa; xanh tăng, đỏ giảm, xám đứng giá; đường đứt = giá hiện tại; vạch đứng ◆ = đầu phiên mới. Rê chuột/chạm để xem số, kéo ngang để xem lùi.</p><div id="ohBoard"></div>`;
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
  window.VTOhlc = { mount, agg, STYLES, STUDIES, tfName };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBoard); else mountBoard();
})();

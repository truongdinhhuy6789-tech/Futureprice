// VIỆT THIÊN COFFEE GROUP — Biểu đồ SVG gọn nhẹ (không cần thư viện ngoài)
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const C = { text: '#E2E8F0', muted: '#94A3B8', grid: '#23334F', axis: '#334155', surface: '#111B2E', pos: '#10B981', neg: '#F43F5E' };
  const fmt = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); if (parent) parent.appendChild(e); return e; };
  const txt = (s, attrs, parent) => { const t = el('text', attrs, parent); t.textContent = s; return t; };

  function niceScale(min, max, ticks) {
    if (min === max) { min -= 1; max += 1; }
    const span = max - min; const raw = span / (ticks || 5);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || 10 * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const out = []; for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return { lo, hi, ticks: out };
  }

  // ---------- Tooltip dùng chung ----------
  const tip = () => document.getElementById('chartTooltip');
  function showTip(html, x, y) {
    const t = tip(); if (!t) return;
    t.innerHTML = html; t.hidden = false;
    const w = t.offsetWidth, h = t.offsetHeight, vw = window.innerWidth;
    t.style.left = Math.min(Math.max(8, x + 14), vw - w - 8) + 'px';
    t.style.top = Math.max(8, y - h - 12) + 'px';
  }
  function hideTip() { const t = tip(); if (t) t.hidden = true; }
  const pointer = e => (e.touches && e.touches[0]) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };

  // ---------- 1. Cột vị thế ròng theo kỳ hạn ----------
  function netBars(box, cfg) {
    box.innerHTML = '';
    const W = Math.max(300, box.clientWidth || 600), H = W < 520 ? 230 : 270;
    const m = { l: 52, r: 12, t: 22, b: 46 };
    const vals = cfg.values; const lim = Math.abs(cfg.limit || 0);
    const sc = niceScale(Math.min(0, -lim, ...vals), Math.max(0, lim, ...vals), 5);
    const y = v => m.t + (sc.hi - v) * (H - m.t - m.b) / (sc.hi - sc.lo);
    const band = (W - m.l - m.r) / vals.length; const bw = Math.min(56, band * 0.58);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img', 'aria-label': cfg.title || 'Biểu đồ vị thế' }, box);
    sc.ticks.forEach(v => {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: v === 0 ? C.axis : C.grid, 'stroke-width': v === 0 ? 1.5 : 1 }, svg);
      txt(fmt(v), { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', fill: C.muted, 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' }, svg);
    });
    if (lim) [lim, -lim].forEach(v => {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: '#F59E0B', 'stroke-width': 1, 'stroke-dasharray': '5 4', opacity: 0.8 }, svg);
    });
    if (lim) txt(`Hạn mức ±${fmt(lim)} t`, { x: W - m.r, y: y(lim) - 5, 'text-anchor': 'end', fill: '#FBBF24', 'font-size': 10.5 }, svg);
    vals.forEach((v, i) => {
      const cx = m.l + band * i + band / 2; const x0 = cx - bw / 2;
      const y0 = y(0), y1 = y(v); const h = Math.abs(y1 - y0); const r = Math.min(4, h / 2);
      if (h > 0.5) {
        const top = Math.min(y0, y1); const up = v > 0;
        const d = up
          ? `M${x0},${y0} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + bw - r} Q${x0 + bw},${top} ${x0 + bw},${top + r} V${y0} Z`
          : `M${x0},${y0} V${y1 - r} Q${x0},${y1} ${x0 + r},${y1} H${x0 + bw - r} Q${x0 + bw},${y1} ${x0 + bw},${y1 - r} V${y0} Z`;
        el('path', { d, fill: up ? C.pos : C.neg, opacity: Math.abs(v) > lim && lim ? 1 : 0.85 }, svg);
      }
      if (v !== 0) txt((v > 0 ? '+' : '') + fmt(v, Math.abs(v) < 100 ? 1 : 0), { x: cx, y: v > 0 ? y1 - 6 : y1 + 14, 'text-anchor': 'middle', fill: C.text, 'font-size': 11, 'font-weight': 700, 'font-family': 'JetBrains Mono, monospace' }, svg);
      txt(cfg.labels[i], { x: cx, y: H - m.b + 18, 'text-anchor': 'middle', fill: C.text, 'font-size': 11.5, 'font-weight': 600 }, svg);
      txt(cfg.codes[i], { x: cx, y: H - m.b + 33, 'text-anchor': 'middle', fill: C.muted, 'font-size': 10, 'font-family': 'JetBrains Mono, monospace' }, svg);
      const hit = el('rect', { x: m.l + band * i, y: m.t, width: band, height: H - m.t - m.b, fill: 'transparent', style: 'cursor:pointer' }, svg);
      const b = (cfg.breakdown || [])[i] || {};
      const html = `<b>${cfg.labels[i]} (${cfg.codes[i]})</b><div>Vị thế ròng: <b>${fmt(v, 2)} t</b></div>`
        + (b.physical !== undefined ? `<div class="tt-muted">Hàng thực ${fmt(b.physical, 2)} · Sàn ${fmt(b.futures, 2)} · Trừ lùi ${fmt(b.diff, 2)}</div>` : '')
        + (lim && Math.abs(v) > lim ? `<div class="tt-warn">Vượt hạn mức → ${v < 0 ? 'MUA LONG' : 'BÁN SHORT'} ${Math.round(Math.abs(v) / 10)} lot</div>` : '');
      const on = e => { const p = pointer(e); hit.setAttribute('fill', 'rgba(255,255,255,0.04)'); showTip(html, p.x, p.y); };
      hit.addEventListener('mousemove', on); hit.addEventListener('touchstart', on, { passive: true });
      hit.addEventListener('mouseleave', () => { hit.setAttribute('fill', 'transparent'); hideTip(); });
    });
  }

  // ---------- 2. Đường cong (nhiều chuỗi, một trục) ----------
  function lines(box, cfg) {
    box.innerHTML = '';
    const W = Math.max(300, box.clientWidth || 600), H = W < 520 ? 250 : 300;
    const series = cfg.series.filter(s => s.values.some(v => v !== null && v !== undefined));
    const all = series.flatMap(s => s.values.filter(v => v !== null && v !== undefined));
    if (!all.length || cfg.xLabels.length < 2) { box.innerHTML = '<p class="section-desc">Chưa đủ dữ liệu giá để vẽ đường cong.</p>'; return; }
    const m = { l: 56, r: W < 520 ? 64 : 92, t: 16, b: 34 };
    const sc = niceScale(Math.min(...all), Math.max(...all), 5);
    const n = cfg.xLabels.length; const xs = i => m.l + i * (W - m.l - m.r) / (n - 1);
    const y = v => m.t + (sc.hi - v) * (H - m.t - m.b) / (sc.hi - sc.lo);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img', 'aria-label': cfg.title || 'Đường cong giá' }, box);
    sc.ticks.forEach(v => {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: C.grid, 'stroke-width': 1 }, svg);
      txt(fmt(v), { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', fill: C.muted, 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' }, svg);
    });
    cfg.xLabels.forEach((l, i) => txt(l, { x: xs(i), y: H - m.b + 18, 'text-anchor': 'middle', fill: C.muted, 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' }, svg));
    const cross = el('line', { x1: 0, x2: 0, y1: m.t, y2: H - m.b, stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0 }, svg);
    const ends = [];
    series.forEach(s => {
      const pts = s.values.map((v, i) => (v === null || v === undefined ? null : [xs(i), y(v)]));
      let d = ''; pts.forEach(p => { if (p) d += (d ? ' L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); });
      el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-dasharray': s.dash || '', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
      pts.forEach(p => { if (p) el('circle', { cx: p[0], cy: p[1], r: 4, fill: s.color, stroke: C.surface, 'stroke-width': 2 }, svg); });
      const lastIdx = s.values.map((v, i) => (v === null || v === undefined ? -1 : i)).filter(i => i >= 0).pop();
      ends.push({ name: s.short || s.name, x: xs(lastIdx), y: y(s.values[lastIdx]), color: s.color });
    });
    // Nhãn cuối đường, giãn cách để không chồng chữ
    ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
    ends.forEach(e => {
      el('circle', { cx: e.x + 10, cy: e.y - 4, r: 3.5, fill: e.color }, svg);
      txt(e.name, { x: e.x + 17, y: e.y, fill: C.text, 'font-size': 11, 'font-weight': 600 }, svg);
    });
    const hit = el('rect', { x: m.l - 10, y: m.t, width: W - m.l - m.r + 20, height: H - m.t - m.b, fill: 'transparent' }, svg);
    const move = e => {
      const p = pointer(e); const r = svg.getBoundingClientRect(); const scale = W / r.width;
      const i = Math.max(0, Math.min(n - 1, Math.round(((p.x - r.left) * scale - m.l) / ((W - m.l - m.r) / (n - 1)))));
      cross.setAttribute('x1', xs(i)); cross.setAttribute('x2', xs(i)); cross.setAttribute('opacity', 0.8);
      const rows = series.map(s => `<div><span class="tt-sw" style="background:${s.color}"></span>${s.name}: <b>${s.values[i] === null || s.values[i] === undefined ? '—' : fmt(s.values[i])}</b></div>`).join('');
      showTip(`<b>${cfg.xLabels[i]}</b>${rows}`, p.x, p.y);
    };
    hit.addEventListener('mousemove', move); hit.addEventListener('touchstart', move, { passive: true }); hit.addEventListener('touchmove', move, { passive: true });
    hit.addEventListener('mouseleave', () => { cross.setAttribute('opacity', 0); hideTip(); });
  }

  function legend(box, series) {
    box.innerHTML = series.map(s => `<span class="lg-item"><span class="lg-sw" style="background:${s.color}${s.dash ? ';background:repeating-linear-gradient(90deg,' + s.color + ' 0 6px,transparent 6px 9px)' : ''}"></span>${s.name}</span>`).join('');
  }

  window.VTCharts = { netBars, lines, legend, hideTip };
})();

// VIỆT THIÊN COFFEE GROUP — Bộ máy tính toán vị thế (dùng chung cho trình duyệt và server/bot Telegram)
// Mọi công thức của hệ thống nằm ở file này để web và bot luôn ra cùng một con số.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VTEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Tháng giao hàng sàn Robusta London (ICE Europe): F=1, H=3, K=5, N=7, U=9, X=11
  const MONTH_LETTERS = { 1: 'F', 3: 'H', 5: 'K', 7: 'N', 9: 'U', 11: 'X' };
  const LETTER_MONTHS = { F: 1, H: 3, K: 5, N: 7, U: 9, X: 11 };
  const ROBUSTA_MONTHS = [1, 3, 5, 7, 9, 11];
  const LOT_TONNES = 10;        // 1 lot Robusta = 10 tấn
  const NUM_COLUMNS = 6;        // số kỳ hạn hiển thị trên ma trận
  const DATA_VERSION = 2;

  // group: physical = hàng thực | futures = tài khoản sàn | diff = trừ lùi | memo = theo dõi (không cộng vào tổng vị thế)
  const ROWS = [
    { key: 'inventory', group: 'physical', unit: 't', label: 'Vị thế tồn kho (không bao gồm hàng gởi)' },
    { key: 'buy_fixed_unshipped', group: 'physical', unit: 't', label: 'Hợp đồng mua đã chốt giá chưa giao hàng' },
    { key: 'buy_unfixed_shipped', group: 'physical', unit: 't', label: 'Hợp đồng mua đã giao hàng chưa chốt giá' },
    { key: 'sell_fixed_unshipped', group: 'physical', unit: 't', label: 'Hợp đồng bán đã chốt giá chưa giao hàng' },
    { key: 'sell_unfixed_shipped', group: 'physical', unit: 't', label: 'Hợp đồng bán đã giao hàng chưa chốt giá' },
    { key: 'hedge_robusta_hdbank', group: 'futures', unit: 't', label: 'Vị thế Robusta sàn HD Bank' },
    { key: 'hedge_arabica_hdbank', group: 'futures', unit: 't', label: 'Vị thế Arabica sàn HD Bank' },
    { key: 'hedge_robusta_pfs', group: 'futures', unit: 't', label: 'Vị thế Robusta sàn PFS092' },
    { key: 'hedge_arabica_pfs', group: 'futures', unit: 't', label: 'Vị thế Arabica sàn PFS092' },
    { key: 'diff_buy_unfixed', group: 'diff', unit: 't', label: 'Hợp đồng mua trừ lùi chưa chốt giá' },
    { key: 'diff_sell_unfixed', group: 'diff', unit: 't', label: 'Hợp đồng bán trừ lùi chưa chốt giá' },
    { key: 'consignment_buy', group: 'memo', unit: 't', label: 'Mua gởi chưa chốt giá' },
    { key: 'consignment_sell', group: 'memo', unit: 't', label: 'Bán gởi chưa chốt giá' },
    { key: 'spread_futures_lots', group: 'memo', unit: 'lot', label: 'Spread Position Futures Only' },
    { key: 'spread_combined_lots', group: 'memo', unit: 'lot', label: 'Spread Position Combined' }
  ];
  const GROUPS = {
    physical: 'VỊ THẾ HÀNG THỰC (PHYSICAL)',
    futures: 'VỊ THẾ TÀI KHOẢN PHÒNG HỘ TRÊN SÀN (FUTURES HEDGING)',
    diff: 'HỢP ĐỒNG TRỪ LÙI (DIFF / PTBF)',
    memo: 'THEO DÕI HÀNG GỞI & SPREAD LOTS (không cộng vào tổng vị thế)'
  };

  // Dữ liệu mẫu tham chiếu (ma trận mẫu ban đầu), gán theo thứ tự 6 kỳ hạn đang hiển thị
  const SAMPLE_ROWS = {
    inventory: [658.00, -42.12, 302.93, -584.25, 0, 0],
    buy_fixed_unshipped: [0, 28.36, 10.85, 290.43, 0, 0],
    sell_fixed_unshipped: [0, 0, -542.31, -220.00, 0, 0],
    consignment_buy: [0, 0, 0, 70.00, 0, 0],
    spread_combined_lots: [0, 0, 0, -7, 0, 0]
  };

  // ---------- Số liệu ----------
  function num(v) { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) ? n : 0; }
  // Lấy số; nếu ô trống/không hợp lệ thì dùng mặc định (0 vẫn là giá trị hợp lệ)
  function pick(v, def) {
    if (v === '' || v === null || v === undefined) return def;
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : def;
  }
  function round2(n) { return Math.round(n * 100) / 100; }

  // ---------- Kỳ hạn ----------
  function contractCode(year, month) { return MONTH_LETTERS[month] + String(year % 100).padStart(2, '0'); }
  function parseCode(code) {
    const m = /^([FHKNUX])(\d{2})$/.exec(String(code || '').toUpperCase());
    if (!m) return null;
    return { letter: m[1], month: LETTER_MONTHS[m[1]], year: 2000 + Number(m[2]) };
  }
  function contractLabel(code) {
    const p = parseCode(code);
    return p ? `Thg ${p.month}/${String(p.year % 100).padStart(2, '0')}` : code;
  }
  // Kỳ hạn đã đến/qua tháng giao hàng thì coi là hết hạn trên ma trận
  function isExpired(code, date) {
    const p = parseCode(code); const d = date || new Date();
    if (!p) return true;
    return p.year < d.getFullYear() || (p.year === d.getFullYear() && p.month <= d.getMonth() + 1);
  }
  // n kỳ hạn Robusta kế tiếp, bắt đầu từ tháng giao hàng sau tháng hiện tại
  function nextContracts(date, n) {
    const d = date || new Date(); const out = [];
    let y = d.getFullYear(); const cur = d.getMonth() + 1;
    let idx = ROBUSTA_MONTHS.findIndex(m => m > cur);
    if (idx === -1) { idx = 0; y += 1; }
    while (out.length < (n || NUM_COLUMNS)) {
      out.push(contractCode(y, ROBUSTA_MONTHS[idx]));
      idx += 1; if (idx === ROBUSTA_MONTHS.length) { idx = 0; y += 1; }
    }
    return out;
  }

  // ---------- Dữ liệu ----------
  function emptyMatrix(columns) {
    const m = {}; ROWS.forEach(r => { m[r.key] = {}; columns.forEach(c => { m[r.key][c] = 0; }); }); return m;
  }
  function defaultData(date) {
    const columns = nextContracts(date);
    return {
      version: DATA_VERSION, columns, matrix: emptyMatrix(columns),
      fobParams: { contract: 'RM' + columns[0], diffUsd: -50, exchangeRate: 25790, processingCostVnd: 700, fxAuto: true },
      hedgeParams: { ...HEDGE_DEFAULTS },
      reference: { domesticPrice: 116500, domesticNote: 'Đắk Lắk / Lâm Đồng', fxRate: 25790, fxNote: 'Vietcombank chuyển khoản' },
      riskLimit: 200, priceMoveUsd: 30, updatedAt: null
    };
  }
  function sampleData(date) {
    const d = defaultData(date);
    Object.entries(SAMPLE_ROWS).forEach(([k, arr]) => d.columns.forEach((c, i) => { d.matrix[k][c] = arr[i] || 0; }));
    return d;
  }
  // Chuẩn hóa / nâng cấp dữ liệu cũ (bản 1 lưu mảng theo vị trí cột) sang bản 2 (lưu theo mã kỳ hạn)
  function normalize(raw, date) {
    const base = defaultData(date);
    if (!raw || typeof raw !== 'object') return base;
    const columns = Array.isArray(raw.columns) && raw.columns.length && raw.columns.every(parseCode) ? raw.columns.slice(0, NUM_COLUMNS) : base.columns;
    const out = { ...base, ...raw, version: DATA_VERSION, columns, matrix: emptyMatrix(columns) };
    const src = raw.matrix || {};
    // Bản 1 có nhãn cột dạng "F (Thg 1)": ghép theo chữ cái tháng (N cũ → N kế tiếp), không ghép theo thứ tự
    const oldCols = Array.isArray(raw.columns) ? raw.columns : [];
    const byLetter = oldCols.length === NUM_COLUMNS && oldCols.every(l => /^\s*[FHKNUX]\b/.test(String(l)));
    const targetOf = i => (byLetter ? columns.find(c => c[0] === String(oldCols[i]).trim()[0]) : columns[i]);
    ROWS.forEach(r => {
      const row = src[r.key];
      if (Array.isArray(row)) row.forEach((v, i) => { const c = targetOf(i); if (c) out.matrix[r.key][c] = num(v); });
      else if (row && typeof row === 'object') Object.keys(row).forEach(c => { out.matrix[r.key][c] = num(row[c]); });
    });
    const fp = raw.fobParams || {};
    out.fobParams = {
      contract: fp.contract || fp.contractMonth || base.fobParams.contract,
      diffUsd: pick(fp.diffUsd, base.fobParams.diffUsd),
      exchangeRate: pick(fp.exchangeRate, base.fobParams.exchangeRate),
      processingCostVnd: pick(fp.processingCostVnd, base.fobParams.processingCostVnd),
      fxAuto: fp.fxAuto === undefined ? true : !!fp.fxAuto
    };
    const hp = raw.hedgeParams || {};
    out.hedgeParams = {};
    Object.keys(HEDGE_DEFAULTS).forEach(k => { out.hedgeParams[k] = pick(hp[k], HEDGE_DEFAULTS[k]); });
    out.reference = { ...base.reference, ...(raw.reference || {}) };
    out.riskLimit = pick(raw.riskLimit, base.riskLimit);
    out.priceMoveUsd = pick(raw.priceMoveUsd, base.priceMoveUsd);
    out.contracts = Array.isArray(raw.contracts) ? raw.contracts.map(normalizeContract) : [];
    // Lần đầu có Sổ hợp đồng: số nhập tay ở 6 dòng hợp đồng chuyển thành "số dư đầu kỳ" trong sổ (không mất số)
    if (!Array.isArray(raw.contracts)) CONTRACT_ROWS.forEach(k => columns.forEach(c => {
      const v = out.matrix[k][c]; if (!v) return;
      out.contracts.push(openingContract(k, c, v, out.contracts.length)); out.matrix[k][c] = 0;
    }));
    out.trades = Array.isArray(raw.trades) ? raw.trades.map(normalizeTrade) : [];
    // Lần đầu có sổ lệnh sàn: số tay ở 2 dòng Robusta sàn → lệnh "đầu kỳ" (giữ nguyên số tấn; Arabica vẫn nhập tay)
    if (!Array.isArray(raw.trades)) Object.entries(TRADE_ROWS).forEach(([acc, k]) => columns.forEach(c => {
      const v = out.matrix[k][c]; if (!v) return;
      out.trades.push(normalizeTrade({ id: `open_${k}_${c}`, account: acc, side: v > 0 ? 'buy' : 'sell', lots: Math.abs(v) / LOT_TONNES, month: c, price: 0, note: 'Số dư đầu kỳ chuyển từ ma trận' }, out.trades.length));
      out.matrix[k][c] = 0;
    }));
    return out;
  }
  // Chuyển sang 6 kỳ hạn mới; trả về các kỳ hạn bị loại mà vẫn còn số liệu (để cảnh báo)
  function rollColumns(data, date) {
    const newCols = nextContracts(date);
    const dropped = [];
    data.columns.filter(c => !newCols.includes(c)).forEach(c => {
      ROWS.forEach(r => { const v = num((data.matrix[r.key] || {})[c]); if (v !== 0) dropped.push({ code: c, row: r.label, value: v }); });
    });
    const matrix = emptyMatrix(newCols);
    ROWS.forEach(r => newCols.forEach(c => { matrix[r.key][c] = num((data.matrix[r.key] || {})[c]); }));
    return { data: { ...data, columns: newCols, matrix }, dropped };
  }

  // ---------- Sổ hợp đồng hàng thực ----------
  // Mỗi hợp đồng mua/bán đổ vào 6 dòng hợp đồng của ma trận, ở cột kỳ hạn sàn tham chiếu (basis):
  //   đã chốt giá chưa giao → *_fixed_unshipped · đã giao chưa chốt → *_unfixed_shipped · chưa chốt chưa giao → diff_*_unfixed
  //   đã chốt và đã giao → hoàn tất (hàng mua đã vào kho / hàng bán đã xuất: cập nhật dòng Tồn kho)
  const CONTRACT_ROWS = ['buy_fixed_unshipped', 'buy_unfixed_shipped', 'sell_fixed_unshipped', 'sell_unfixed_shipped', 'diff_buy_unfixed', 'diff_sell_unfixed'];
  const CONTAINER_TONNES = 19.2; // container 20' = 320 bao × 60 kg
  const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  const sumTons = arr => round2((arr || []).reduce((s, x) => s + num(x.tons), 0));
  const codeIndex = code => { const p = parseCode(code); return p ? p.year * 12 + p.month : null; };
  // Kỳ hạn sàn tham chiếu mặc định = kỳ Robusta đầu tiên SAU tháng giao hàng (giao 01/2027 → H27, giao 11/2026 → F27)
  function basisForShipment(ship) {
    const m = /^(\d{4})-(\d{2})$/.exec(String(ship || '')); if (!m) return '';
    return nextContracts(new Date(Number(m[1]), Number(m[2]) - 1, 15), 1)[0];
  }
  function normalizeContract(c, i) {
    const x = c && typeof c === 'object' ? c : {};
    const list = (arr, f) => (Array.isArray(arr) ? arr : []).map(f).filter(e => e.tons > 0);
    const basis = String(x.basis || '').toUpperCase();
    const ship = /^\d{4}-\d{2}$/.test(String(x.ship || '')) ? x.ship : '';
    return {
      id: String(x.id || `c${Date.now().toString(36)}_${i || 0}`).slice(0, 40),
      no: String(x.no || '').trim().slice(0, 40), date: isDate(x.date) ? x.date : '',
      side: x.side === 'buy' ? 'buy' : 'sell', party: String(x.party || '').trim().slice(0, 80), grade: String(x.grade || '').trim().slice(0, 60),
      qty: Math.max(0, round2(num(x.qty))), pricing: x.pricing === 'diff' ? 'diff' : 'fixed',
      price: num(x.price), unit: x.unit === 'vnd' ? 'vnd' : 'usd', diff: num(x.diff),
      basis: parseCode(basis) ? basis : basisForShipment(ship), ship, terms: String(x.terms || '').trim().slice(0, 20) || 'FOB',
      fixes: list(x.fixes, f => ({ date: isDate(f && f.date) ? f.date : '', tons: round2(num(f && f.tons)), fut: num(f && f.fut) })),
      deliveries: list(x.deliveries, f => ({ date: isDate(f && f.date) ? f.date : '', tons: round2(num(f && f.tons)) })),
      note: String(x.note || '').slice(0, 300)
    };
  }
  // Số nhập tay cũ ở 6 dòng hợp đồng → "số dư đầu kỳ" trong sổ (giữ nguyên số và dấu)
  function openingContract(key, col, v, i) {
    const unfixed = /unfixed/.test(key), shipped = /_shipped$/.test(key);
    const row = ROWS.find(r => r.key === key) || {};
    return normalizeContract({ id: `open_${key}_${col}`, no: 'ĐẦU KỲ', party: 'Số dư chuyển từ ma trận', side: v > 0 ? 'buy' : 'sell', qty: Math.abs(v),
      pricing: unfixed ? 'diff' : 'fixed', basis: col, deliveries: shipped ? [{ tons: Math.abs(v) }] : [], note: `Chuyển từ dòng "${row.label}" kỳ ${col}` }, i);
  }
  function contractState(c) {
    const qty = num(c.qty);
    const fixTons = sumTons(c.fixes);
    const fixedT = c.pricing === 'fixed' ? qty : Math.min(qty, fixTons);
    const deliveredT = Math.min(qty, sumTons(c.deliveries));
    const fs = Math.min(fixedT, deliveredT);                       // đã chốt & đã giao → hoàn tất
    const fu = round2(fixedT - fs), us = round2(deliveredT - fs), uu = round2(qty - fixedT - us);
    const avgFix = c.pricing === 'diff' && fixTons > 0 ? round2(c.fixes.reduce((s, f) => s + num(f.tons) * num(f.fut), 0) / fixTons) : null;
    const priceUsd = c.pricing === 'fixed' ? (c.unit === 'usd' ? num(c.price) : null) : (avgFix === null ? null : round2(avgFix + num(c.diff)));
    const fixStatus = fixedT >= qty - 1e-6 ? 'fixed' : fixedT > 0 ? 'partial' : 'open';
    const delStatus = deliveredT >= qty - 1e-6 ? 'done' : deliveredT > 0 ? 'partial' : 'none';
    return { qty, fixedT: round2(fixedT), unfixedT: round2(qty - fixedT), deliveredT: round2(deliveredT), fs: round2(fs), fu, us, uu, avgFix, priceUsd,
      fixStatus, delStatus, closed: qty === 0 || (fixStatus === 'fixed' && delStatus === 'done'), lots: round2(qty / LOT_TONNES), containers: round2(qty / CONTAINER_TONNES) };
  }
  // Cộng sổ hợp đồng thành 6 dòng của ma trận. Kỳ tham chiếu đã qua / ngoài 6 kỳ đang hiển thị → ghép vào kỳ gần nhất (không để "mất" rủi ro)
  function contractRows(contracts, columns) {
    const rows = {}; CONTRACT_ROWS.forEach(k => { rows[k] = {}; columns.forEach(c => { rows[k][c] = 0; }); });
    const moved = [];
    const add = (k, col, v) => { if (v) rows[k][col] = round2(rows[k][col] + v) || 0; };
    (contracts || []).forEach(c => {
      const s = contractState(c); if (s.closed || !columns.length) return;
      let col = c.basis;
      if (!columns.includes(col)) {
        const idx = codeIndex(col); const late = idx !== null && idx > codeIndex(columns[columns.length - 1]);
        col = late ? columns[columns.length - 1] : columns[0];
        moved.push({ id: c.id, no: c.no, basis: c.basis, to: col, expired: !late });
      }
      const sign = c.side === 'buy' ? 1 : -1; const p = c.side === 'buy' ? 'buy' : 'sell';
      add(`${p}_fixed_unshipped`, col, sign * s.fu); add(`${p}_unfixed_shipped`, col, sign * s.us); add(`diff_${p}_unfixed`, col, sign * s.uu);
    });
    return { rows, moved };
  }
  // ---------- Lệnh sàn (hàng ảo) – Robusta London ----------
  // Mỗi lệnh MUA (+) / BÁN (−) n lot ở một kỳ hạn → dòng "Vị thế Robusta sàn HD Bank / PFS092" của ma trận (1 lot = 10 t).
  // Lệnh có thể liên kết (link) với một hợp đồng hàng thật để theo dõi hợp đồng nào đã được phòng hộ.
  const TRADE_ROWS = { hdbank: 'hedge_robusta_hdbank', pfs: 'hedge_robusta_pfs' };
  const ACCOUNTS = { hdbank: 'HD Bank', pfs: 'PFS092' };
  function normalizeTrade(t, i) {
    const x = t && typeof t === 'object' ? t : {};
    const month = String(x.month || '').toUpperCase();
    return {
      id: String(x.id || `t${Date.now().toString(36)}_${i || 0}`).slice(0, 40),
      date: isDate(x.date) ? x.date : '', account: x.account === 'pfs' ? 'pfs' : 'hdbank', side: x.side === 'sell' ? 'sell' : 'buy',
      lots: Math.max(0, round2(num(x.lots))), month: parseCode(month) ? month : '', price: num(x.price),
      link: String(x.link || '').slice(0, 40), note: String(x.note || '').slice(0, 200)
    };
  }
  const tradeLots = t => (t.side === 'sell' ? -1 : 1) * num(t.lots);
  function tradeRows(trades, columns) {
    const rows = {}; Object.values(TRADE_ROWS).forEach(k => { rows[k] = {}; columns.forEach(c => { rows[k][c] = 0; }); });
    const moved = [];
    (trades || []).forEach(t => {
      if (!num(t.lots) || !columns.length) return;
      let col = t.month;
      if (!columns.includes(col)) {
        const idx = codeIndex(col); const late = idx !== null && idx > codeIndex(columns[columns.length - 1]);
        col = late ? columns[columns.length - 1] : columns[0];
        moved.push({ id: t.id, month: t.month, to: col, expired: !late });
      }
      const k = TRADE_ROWS[t.account] || TRADE_ROWS.hdbank;
      rows[k][col] = round2(rows[k][col] + tradeLots(t) * LOT_TONNES) || 0;
    });
    return { rows, moved };
  }
  // Sổ lệnh theo từng tài khoản + kỳ hạn, giá vốn bình quân: lãi/lỗ đã chốt (đóng lệnh) và đang mở (theo giá hiện tại)
  function futuresBook(trades, priceOf) {
    const groups = {};
    (trades || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach(t => {
      const q = tradeLots(t); if (!q) return;
      const k = `${t.account}|${t.month}`;
      const g = groups[k] || (groups[k] = { account: t.account, month: t.month, pos: 0, avg: 0, realized: 0, priced: true });
      if (!num(t.price)) g.priced = false; // số dư đầu kỳ chưa có giá khớp
      if (Math.abs(g.pos) < 1e-9 || Math.sign(q) === Math.sign(g.pos)) {
        g.avg = (g.avg * Math.abs(g.pos) + num(t.price) * Math.abs(q)) / (Math.abs(g.pos) + Math.abs(q)); g.pos += q;
      } else {
        const close = Math.min(Math.abs(q), Math.abs(g.pos));
        g.realized += (num(t.price) - g.avg) * close * LOT_TONNES * Math.sign(g.pos);
        const flip = Math.abs(q) > Math.abs(g.pos); g.pos += q;
        if (flip) g.avg = num(t.price);
      }
      if (Math.abs(g.pos) < 1e-9) { g.pos = 0; g.avg = 0; }
    });
    const list = Object.values(groups).map(g => {
      const last = num(priceOf ? priceOf(g.month) : 0);
      return { account: g.account, month: g.month, pos: round2(g.pos) || 0, avg: round2(g.avg), realized: Math.round(g.realized) || 0, last,
        unrealized: last && g.pos && g.priced ? Math.round((last - g.avg) * g.pos * LOT_TONNES) || 0 : null };
    }).sort((a, b) => (codeIndex(a.month) || 0) - (codeIndex(b.month) || 0) || a.account.localeCompare(b.account));
    return { list, totals: { lots: round2(list.reduce((s, g) => s + g.pos, 0)) || 0, realized: list.reduce((s, g) => s + g.realized, 0), unrealized: list.reduce((s, g) => s + (g.unrealized || 0), 0) } };
  }
  // Số lot đang liên kết với một hợp đồng (MUA +, BÁN −)
  function linkedLots(trades, contractId) { return round2((trades || []).filter(t => t.link === contractId).reduce((s, t) => s + tradeLots(t), 0)) || 0; }
  // Hợp đồng đổ vào vị thế ròng bao nhiêu tấn (MUA +, BÁN −; hoàn tất = 0)
  function contractExposure(c) { const s = contractState(c); return s.closed ? 0 : round2((c.side === 'buy' ? 1 : -1) * (s.fu + s.us + s.uu)) || 0; }

  // Ma trận dùng để tính = số nhập tay + số từ sổ hợp đồng (hàng thật) + sổ lệnh sàn (hàng ảo)
  function effectiveMatrix(data) {
    const base = data.matrix || {}; const cols = data.columns || [];
    const hasC = Array.isArray(data.contracts) && data.contracts.length, hasT = Array.isArray(data.trades) && data.trades.length;
    if (!hasC && !hasT) return base;
    const m = {}; ROWS.forEach(r => { m[r.key] = { ...(base[r.key] || {}) }; });
    const addRows = rows => Object.keys(rows).forEach(k => cols.forEach(c => { m[k][c] = round2(num(m[k][c]) + rows[k][c]) || 0; }));
    if (hasC) addRows(contractRows(data.contracts, cols).rows);
    if (hasT) addRows(tradeRows(data.trades, cols).rows);
    return m;
  }
  // Hạn chốt giá hợp đồng trừ lùi = ngày thông báo đầu tiên của kỳ hạn sàn tham chiếu (ước tính)
  function fixDeadline(c) { return parseCode(c.basis) ? firstNoticeDay('RM' + c.basis) : null; }
  function contractSummary(contracts, today) {
    const o = { count: 0, open: 0, sellUnfixedT: 0, buyUnfixedT: 0, sellUndeliveredT: 0, buyUndeliveredT: 0, netEffect: 0, due: [] };
    (contracts || []).forEach(c => {
      const s = contractState(c); o.count += 1; if (s.closed) return; o.open += 1;
      const buy = c.side === 'buy';
      o[buy ? 'buyUnfixedT' : 'sellUnfixedT'] += s.unfixedT;
      o[buy ? 'buyUndeliveredT' : 'sellUndeliveredT'] += s.qty - s.deliveredT;
      o.netEffect += (buy ? 1 : -1) * (s.fu + s.us + s.uu);
      const f = c.pricing === 'diff' && s.unfixedT > 0 ? fixDeadline(c) : null;
      if (f) o.due.push({ id: c.id, no: c.no, side: c.side, party: c.party, unfixedT: s.unfixedT, basis: c.basis, fnd: f, left: daysBetween(today || new Date(), f) });
    });
    ['sellUnfixedT', 'buyUnfixedT', 'sellUndeliveredT', 'buyUndeliveredT', 'netEffect'].forEach(k => { o[k] = round2(o[k]) || 0; });
    o.due.sort((a, b) => a.left - b.left);
    return o;
  }

  // ---------- Tính vị thế ----------
  function computePositions(data) {
    const cols = data.columns; const m = effectiveMatrix(data);
    const val = (k, c) => num((m[k] || {})[c]);
    const rowSums = {};
    ROWS.forEach(r => { rowSums[r.key] = round2(cols.reduce((s, c) => s + val(r.key, c), 0)); });
    const sumGroup = (g, c) => ROWS.filter(r => r.group === g).reduce((s, r) => s + val(r.key, c), 0);
    const physical = cols.map(c => round2(sumGroup('physical', c)));
    const futures = cols.map(c => round2(sumGroup('futures', c)));
    const diff = cols.map(c => round2(sumGroup('diff', c)));
    const net = cols.map((c, i) => round2(physical[i] + futures[i] + diff[i]));
    const total = arr => round2(arr.reduce((a, b) => a + b, 0));
    return { columns: cols, rowSums, physical, futures, diff, net,
      totals: { physical: total(physical), futures: total(futures), diff: total(diff), net: total(net) } };
  }

  // ---------- Đo rủi ro & khuyến nghị phòng hộ ----------
  function analyzeRisk(pos, opts) {
    const limit = pick((opts || {}).limit, 200);
    const move = pick((opts || {}).priceMove, 30);
    const net = pos.net; const totalNet = pos.totals.net;
    let worstIdx = -1, maxAbs = 0;
    net.forEach((v, i) => { if (Math.abs(v) > maxAbs) { maxAbs = Math.abs(v); worstIdx = i; } });
    const status = totalNet < 0 ? 'SHORT' : totalNet > 0 ? 'LONG' : 'SQUARE';
    const alerts = [];
    const half = limit / 2;
    const longs = net.map((v, i) => ({ v, i })).filter(x => x.v > half);
    const shorts = net.map((v, i) => ({ v, i })).filter(x => x.v < -half);
    if (longs.length && shorts.length) {
      alerts.push({ type: 'mismatch', level: 'warning', longs, shorts });
    }
    net.forEach((v, i) => {
      if (Math.abs(v) > limit) {
        alerts.push({ type: 'hedge', level: 'info', index: i, code: pos.columns[i], value: v,
          action: v < 0 ? 'MUA LONG' : 'BÁN SHORT', lots: Math.round(Math.abs(v) / LOT_TONNES) });
      }
    });
    // Lời/lỗ danh nghĩa khi giá London tăng thêm `move` USD/tấn: vị thế Long lời, Short lỗ
    const mtmUp = round2(totalNet * move);
    return { limit, move, status, totalNet, worstIdx, worstValue: worstIdx >= 0 ? net[worstIdx] : 0, mtmUp, alerts };
  }

  // ---------- Spread kỳ hạn ----------
  function quotePriceMap(quotes) {
    const map = {};
    ((quotes || {}).coffee_liffe || []).forEach(q => {
      const code = String(q.Name || '').replace(/^RM/i, '').toUpperCase();
      if (parseCode(code)) map[code] = num(q.Last);
    });
    return map;
  }
  // Spread = giá kỳ gần − giá kỳ xa. Dương: Inverted (nghịch đảo, hàng giao ngay khan); Âm: Contango (bình thường)
  function computeSpreads(columns, quotes) {
    const p = quotePriceMap(quotes); const out = [];
    for (let i = 0; i < columns.length - 1; i++) {
      const a = columns[i], b = columns[i + 1];
      if (p[a] && p[b]) {
        const v = round2(p[a] - p[b]);
        out.push({ pair: `${a}/${b}`, near: a, far: b, value: v, structure: v > 0 ? 'Inverted' : v < 0 ? 'Contango' : 'Phẳng' });
      } else out.push({ pair: `${a}/${b}`, near: a, far: b, value: null, structure: 'Chưa có giá' });
    }
    return out;
  }

  // ---------- Giá FOB từ trừ lùi ----------
  function computeFob(londonUsdTon, diffUsd, fxRate, costVndKg) {
    const fobUsd = num(londonUsdTon) + num(diffUsd);
    const fobVndKg = fobUsd * num(fxRate) / 1000;
    return { fobUsd: round2(fobUsd), fobVndKg: Math.round(fobVndKg), domesticVndKg: Math.round(fobVndKg - num(costVndKg)) };
  }

  function fmt(n, d) {
    const x = num(n); const digits = d === undefined ? 2 : d;
    return x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  // ---------- Mã hợp đồng, ngày thông báo đầu tiên, phiên giao dịch ----------
  const ALL_LETTERS = { F: 1, G: 2, H: 3, J: 4, K: 5, M: 6, N: 7, Q: 8, U: 9, V: 10, X: 11, Z: 12 };
  // Tách mã giacaphe (RMX26 / KCH27) → { market, letter, month, year }
  function parseQuoteName(name) {
    const m = /^(RM|RC|KC)([FGHJKMNQUVXZ])(\d{2})$/i.exec(String(name || '').trim());
    if (!m) return null;
    const p = m[1].toUpperCase(); const letter = m[2].toUpperCase();
    return { market: p === 'KC' ? 'arabica' : 'robusta', letter, month: ALL_LETTERS[letter], year: 2000 + Number(m[3]), code: letter + m[3] };
  }
  // Mã trên bảng giá MXV: Robusta ICE EU = LRC…, Arabica ICE US = KCE…
  function mxvCode(name) {
    const q = parseQuoteName(name); if (!q) return '';
    return (q.market === 'arabica' ? 'KCE' : 'LRC') + q.code;
  }
  function addBusinessDays(d, n) { // n âm = lùi; chỉ bỏ thứ 7, chủ nhật (chưa trừ ngày lễ)
    const x = new Date(d); const step = n < 0 ? -1 : 1; let left = Math.abs(n);
    while (left > 0) { x.setDate(x.getDate() + step); if (x.getDay() !== 0 && x.getDay() !== 6) left--; }
    return x;
  }
  // Ngày thông báo đầu tiên (ước tính): Robusta = 4 ngày làm việc, Arabica = 7 ngày làm việc trước ngày làm việc đầu tiên của tháng giao hàng
  function firstNoticeDay(name) {
    const q = parseQuoteName(name); if (!q) return null;
    const first = new Date(q.year, q.month - 1, 1);
    while (first.getDay() === 0 || first.getDay() === 6) first.setDate(first.getDate() + 1);
    return addBusinessDays(first, q.market === 'arabica' ? -7 : -4);
  }
  function daysBetween(a, b) { return Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000); }

  // Giờ giao dịch (giờ địa phương sàn), thứ 2 – thứ 6
  const SESSIONS = {
    robusta: { tz: 'Europe/London', open: [9, 0], close: [17, 30], label: 'ICE London' },
    arabica: { tz: 'America/New_York', open: [4, 15], close: [13, 30], label: 'ICE New York' },
    brazil: { tz: 'America/Sao_Paulo', open: [9, 0], close: [15, 35], label: 'B3 Brazil' }
  };
  function sessionStatus(market, now) {
    const s = SESSIONS[market]; if (!s) return { open: false, text: '' };
    const parts = {}; new Intl.DateTimeFormat('en-GB', { timeZone: s.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(now || new Date()).forEach(p => { parts[p.type] = p.value; });
    const mins = Number(parts.hour) % 24 * 60 + Number(parts.minute);
    const weekday = !['Sat', 'Sun'].includes(parts.weekday);
    const open = weekday && mins >= s.open[0] * 60 + s.open[1] && mins < s.close[0] * 60 + s.close[1];
    return { open, text: `${s.label}: ${open ? 'đang giao dịch' : (weekday ? 'ngoài giờ giao dịch' : 'nghỉ cuối tuần')}` };
  }

  // ---------- Mô hình phòng hộ xuất khẩu (4 chiến lược) ----------
  const HEDGE_DEFAULTS = { qa: 300, lotSize: 10, f0: 0, fobTarget: 0, fxManual: 0, days: 90, kPut: 0, pPut: 120, kCall: 0, pCall: 120, hybridRatio: 0.5, feePerLot: 26 };
  const SCENARIOS = [
    { key: 'crash', label: 'Thị trường sụp đổ mạnh', pct: -0.30 },
    { key: 'down', label: 'Thị trường giảm vừa', pct: -0.15 },
    { key: 'flat', label: 'Thị trường đi ngang', pct: 0 },
    { key: 'up', label: 'Thị trường tăng tốt', pct: 0.15 },
    { key: 'boom', label: 'Thị trường tăng sốc', pct: 0.30 }
  ];
  function simulateHedge(input, fxVcb) {
    const p = { ...HEDGE_DEFAULTS, ...(input || {}) };
    ['qa', 'lotSize', 'f0', 'fobTarget', 'fxManual', 'days', 'kPut', 'pPut', 'kCall', 'pCall', 'hybridRatio', 'feePerLot'].forEach(k => { p[k] = num(p[k]); });
    const lots = p.lotSize > 0 ? Math.round(p.qa / p.lotSize) : 0;
    const diff = p.fobTarget - p.f0;
    const s0 = p.fxManual > 0 ? p.fxManual : num(fxVcb);
    const feeT = p.lotSize > 0 ? p.feePerLot / p.lotSize : 0;   // phí giao dịch quy đổi USD/tấn
    const r = Math.min(Math.max(p.hybridRatio, 0), 1);
    const lotsF = Math.round(lots * r), lotsP = lots - lotsF;
    const putPay = sT => Math.max(p.kPut - sT, 0), callPay = sT => Math.max(sT - p.kCall, 0);
    const value = {
      unhedged: sT => sT + diff,
      futures: sT => sT + diff + (p.f0 - sT) - feeT,
      put: sT => sT + diff + putPay(sT) - p.pPut - feeT,
      collar: sT => sT + diff + putPay(sT) - callPay(sT) - (p.pPut - p.pCall) - 2 * feeT,
      hybrid: sT => sT + diff + r * (p.f0 - sT) + (1 - r) * (putPay(sT) - p.pPut) - feeT
    };
    const tons = lots * p.lotSize;
    const mk = (key, name, order, premium, fees, margin, floor, cap) => ({
      key, name, order, premium: round2(premium), fees: round2(fees), margin, floor: round2(floor), cap: cap === null ? null : round2(cap),
      floorVndKg: round2(floor * s0 / 1000), revenueMinMillion: Math.round(floor * p.qa * s0 / 1e6)
    });
    const strategies = [
      mk('futures', 'Thuần Futures', `BÁN ${lots} lot Futures`, 0, lots * p.feePerLot, 'CÓ – cần quỹ dự phòng ký quỹ, nộp thêm khi giá tăng mạnh',
        p.f0 + diff - feeT, p.f0 + diff - feeT),
      mk('put', 'Thuần Long Put (quyền chọn bán)', `MUA ${lots} lot Put strike ${fmt(p.kPut, 0)}`, tons * p.pPut, lots * p.feePerLot, 'KHÔNG (chỉ trả phí quyền chọn)',
        p.kPut + diff - p.pPut - feeT, null),
      mk('collar', 'Collar (Put + Call)', `MUA ${lots} lot Put ${fmt(p.kPut, 0)} + BÁN ${lots} lot Call ${fmt(p.kCall, 0)}`, tons * (p.pPut - p.pCall), 2 * lots * p.feePerLot,
        `CÓ – chỉ khi giá vượt trần ${fmt(p.kCall, 0)}`, p.kPut + diff - (p.pPut - p.pCall) - 2 * feeT, p.kCall + diff - (p.pPut - p.pCall) - 2 * feeT),
      mk('hybrid', `Hybrid ${Math.round(r * 100)}% Futures + ${Math.round((1 - r) * 100)}% Put`, `BÁN ${lotsF} lot Futures + MUA ${lotsP} lot Put ${fmt(p.kPut, 0)}`,
        lotsP * p.lotSize * p.pPut, lots * p.feePerLot, `GIẢM ${Math.round((1 - r) * 100)}% so với thuần Futures`,
        r * (p.f0 + diff - feeT) + (1 - r) * (p.kPut + diff - p.pPut - feeT), null)
    ];
    const scenarios = SCENARIOS.map(s => {
      const sT = p.f0 * (1 + s.pct); const row = { ...s, ice: round2(sT) };
      Object.keys(value).forEach(k => { row[k] = round2(value[k](sT)); });
      return row;
    });
    return { params: p, lots, diff: round2(diff), s0, feeT: round2(feeT), strategies, scenarios };
  }

  // Số có dấu: +21 / -13 / 0 (không hiện "+-0")
  function signed(n, d) {
    const digits = d === undefined ? 0 : d; const p = Math.pow(10, digits);
    const x = Math.round(num(n) * p) / p;
    return x === 0 ? fmt(0, digits) : (x > 0 ? '+' : '') + fmt(x, digits);
  }

  return { MONTH_LETTERS, LETTER_MONTHS, LOT_TONNES, NUM_COLUMNS, ROWS, GROUPS, DATA_VERSION,
    num, pick, round2, fmt, signed, contractCode,
    parseQuoteName, mxvCode, firstNoticeDay, daysBetween, sessionStatus, HEDGE_DEFAULTS, SCENARIOS, simulateHedge, parseCode, contractLabel, isExpired, nextContracts,
    emptyMatrix, defaultData, sampleData, normalize, rollColumns,
    CONTRACT_ROWS, CONTAINER_TONNES, basisForShipment, normalizeContract, contractState, contractRows, effectiveMatrix, fixDeadline, contractSummary,
    TRADE_ROWS, ACCOUNTS, normalizeTrade, tradeLots, tradeRows, futuresBook, linkedLots, contractExposure,
    computePositions, analyzeRisk, quotePriceMap, computeSpreads, computeFob };
});

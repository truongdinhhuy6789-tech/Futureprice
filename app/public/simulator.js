// VIỆT THIÊN — Sàn giả lập kiểu DOMTrader (đào tạo nội bộ).
// TUYỆT ĐỐI không kết nối CQG/MXV, không gửi lệnh thật. Dữ liệu chỉ lưu trên trình duyệt đang dùng.
// Bố cục theo DOMTrader: thang giá BUY · BID · PRICE · ASK · SELL · VOL, bấm ô để đặt lệnh (dưới giá = LMT, trên giá = STP),
// Buy Mkt / Sell Mkt / Cxl All / Flatten / Center, thanh vị thế (Pos, Avg, OTE), khay lệnh Working / Filled / Cancelled / Exceptions.
(function () {
  'use strict';
  const KEY = 'vt_dom_sim_v2';
  const LOT_T = 10;                     // 1 lot Robusta = 10 tấn → 1 USD/t = 10 USD/lot
  const LIVE = ['WORKING', 'PARTIAL', 'PENDING NEW', 'PENDING CANCEL', 'PENDING REPLACE'];
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const px = n => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const vnd = n => Math.round(Number(n) || 0).toLocaleString('vi-VN');
  const sg = (n, f) => (n > 0 ? '+' : n < 0 ? '−' : '') + f(Math.abs(n));
  const clock = () => new Date().toLocaleTimeString('vi-VN', { hour12: false });
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const phone = () => window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const app = () => window.VTApp && window.VTApp.getState ? window.VTApp.getState() : null;

  // ---------- Bài tập (huấn luyện viên chấm theo vị thế mục tiêu) ----------
  // Mỗi bài: goal vị thế mục tiêu; scenario/trend dựng thị trường; noWorking = không được để lệnh chờ thừa;
  // exact = vượt mục tiêu là sai (gửi lặp / đầu cơ); quiz = câu hỏi đọc thang giá (đáp án tính theo số liệu trên màn hình).
  const LESSONS = {
    sale38: { title: '① Bán 38,4 t giá chốt → MUA 4 lot RMF27', goal: { RMF27: 4 }, exact: true,
      brief: 'Công ty bán 38,4 t giá cố định 3.800 FOB nhưng chưa có hàng = đang thiếu hàng. Phòng hộ: MUA 4 lot RMF27 (kỳ tham chiếu của hợp đồng). Chọn Qty 4 → Buy Mkt, hoặc bấm ô BUY.' },
    limit: { title: '② MUA 4 lot RMF27 bằng LMT thấp hơn giá 5 USD', goal: { RMF27: 4 }, needType: 'LMT', exact: true, trend: 'down', run: true,
      brief: 'Giá đang nhích xuống. Không mua đuổi: bấm ô cột BUY thấp hơn giá khớp 5 bậc (BUY LMT), chờ giá về khớp. Lệnh Working chưa phải đã phòng hộ.' },
    fastup: { title: '③ Giá tăng vọt sau khi ký bán – phòng hộ ngay', goal: { RMF27: 4 }, exact: true, scenario: 'fast', trend: 'up', run: true,
      brief: 'Vừa ký bán 38,4 t giá chốt thì London tăng nhanh. Chờ giá về là đầu cơ: MUA 4 lot ngay (Buy Mkt chấp nhận trượt giá). Kết quả sẽ cho thấy mỗi nhịp chậm tốn bao nhiêu.' },
    partial: { title: '④ Khớp từng phần – xử lý phần còn lại', goal: { RMF27: 4 }, exact: true, noWorking: true, scenario: 'partial', run: true,
      brief: 'Thị trường mỏng: lệnh 4 lot có thể chỉ khớp 2. Theo dõi khay Working, chờ khớp nốt hoặc sửa giá; xong phải còn đúng +4 và không còn lệnh chờ.' },
    disconnect: { title: '⑤ Mất kết nối – KHÔNG gửi lặp', goal: { RMF27: 4 }, exact: true, scenario: 'disconnect', cash: 1000000000,
      brief: 'Gửi MUA 4 lot thì mất kết nối, lệnh hiện PENDING NEW. Đừng bấm gửi lại – chờ kết nối hoặc gọi broker với Order ID. Gửi lại là dư 4 lot (đầu cơ).' },
    margin: { title: '⑥ Thiếu ký quỹ: Rejected → nạp tiền → đặt lại', goal: { RMF27: 4 }, exact: true, cash: 150000000,
      brief: 'Tài khoản chỉ còn 150 triệu: MUA 4 lot sẽ bị REJECTED. Đọc lý do ở khay Exceptions, bấm "+ Nạp 300 triệu", rồi đặt lại đúng 1 lần.' },
    inv100: { title: '⑦ Tồn kho 100 t chưa bán → BÁN 10 lot RMH27', goal: { RMH27: -10 }, exact: true, cash: 1200000000, trend: 'down', run: true,
      brief: 'Đang giữ 100 t hàng mua giá cố định, chưa có người mua = dư hàng, giá đang yếu. Phòng hộ: chọn mã RMH27, Qty 10, BÁN (Sell Mkt hoặc bấm ô SELL trên giá = SELL LMT).' },
    roll: { title: '⑧ Đảo kỳ: +4 RMF27 → RMH27 trước FND', goal: { RMF27: 0, RMH27: 4 }, seed: [['RMF27', 'BUY', 4]], cash: 900000000, exact: true, noWorking: true,
      brief: 'Sắp tới ngày thông báo đầu tiên RMF27, hàng giao trễ: BÁN 4 RMF27 rồi đổi mã sang RMH27 và MUA 4. Làm liền hai bước để không bị hở.' },
    unwind: { title: '⑨ Khách hủy hợp đồng → gỡ phòng hộ (Flatten)', goal: { RMF27: 0 }, seed: [['RMF27', 'BUY', 4]], noWorking: true, run: true,
      brief: 'Hợp đồng bán bị hủy nên 4 lot MUA phòng hộ thành lệnh "trần" (đầu cơ). Hủy lệnh chờ và đưa vị thế về 0: bấm Flatten (hoặc Sell Mkt 4).' },
    readbook: { title: '⑩ Đọc thang giá: phe nào đang mạnh?', goal: {}, trend: 'down', run: true,
      quiz: { q: 'Nhìn dải PHÂN TÍCH dưới thang giá (tổng BID/ASK 10 mức, giá so với VWAP, xu hướng). Phe nào đang chiếm ưu thế?', options: ['Phe MUA mạnh hơn', 'Phe BÁN mạnh hơn', 'Cân bằng'] },
      brief: 'Cho giá chạy 20–30 giây, quan sát cột BID/ASK, VOL và dải phân tích rồi trả lời. Với phòng hộ: dùng để chọn giá đặt LMT, KHÔNG dùng để đoán hướng mà bỏ phòng hộ.' }
  };
  const SCENARIOS = { normal: 'Bình thường', partial: 'Khớp từng phần (thị trường mỏng)', fast: 'Thị trường nhanh – trượt giá', reject: 'Bị từ chối (Rejected)', disconnect: 'Mất kết nối – trạng thái chưa rõ' };

  const fresh = () => ({ v: 2, acct: 'SIM-VT01', sym: 'RMF27', qty: 4, confirm: true, cash: 500000000, margin: 97812000, fee: 350000, fx: 25790,
    scenario: 'normal', trend: 'flat', speed: 1500, lesson: '', start: null, quiz: null, seq: 1, fseq: 1, mk: {}, orders: [], fills: [], log: [] });
  let s = load(); let timer = null, built = false, ticks = 0;
  const view = { center: null, sel: null, mode: 'market', selOrder: '', tray: 'working', pending: null, setOpen: false, tour: -1 };
  function load() { try { const x = JSON.parse(localStorage.getItem(KEY) || 'null'); return x && x.v === 2 ? { ...fresh(), ...x } : fresh(); } catch (e) { return fresh(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* trình duyệt chặn lưu – vẫn chạy bình thường */ } }
  function log(text, kind) { s.log.unshift({ at: clock(), text, kind: kind || '' }); s.log = s.log.slice(0, 60); }

  // ---------- Thị trường giả lập (mỗi mã một thang giá; khởi đầu theo giá London thật nếu có) ----------
  function liveRows() { const st = app(); return (st && st.quotes && st.quotes.coffee_liffe) || []; }
  function symbols() { const l = liveRows().map(q => q.Name).filter(n => /^RM[FHKNUX]\d\d$/.test(n)); return l.length ? l : ['RMX26', 'RMF27', 'RMH27', 'RMK27', 'RMN27']; }
  function mkt(sym) {
    if (!s.mk[sym]) {
      const q = liveRows().find(x => x.Name === sym); const last = Math.round(Number(q && q.Last) || 3450);
      s.mk[sym] = { last, bid: last, ask: last + 1, high: Math.round(Number(q && q.High) || last), low: Math.round(Number(q && q.Low) || last), open: Math.round(Number(q && q.Open) || last), tv: 0, vap: {} };
    }
    return s.mk[sym];
  }
  function resync(sym) {
    const q = liveRows().find(x => x.Name === sym); if (!q) return false;
    delete s.mk[sym]; mkt(sym); view.center = null; return true;
  }
  // Độ sâu sổ lệnh: số lot chờ ở từng mức giá (ngẫu nhiên có kiểm soát, gần giá thì dày hơn)
  // Thị trường có xu hướng thì phía thuận chiều chờ dày hơn (tăng → BID dày, giảm → ASK dày)
  function depth(p, m) {
    const dist = p <= m.bid ? m.bid - p : p - m.ask; const h = Math.abs(Math.sin(p * 12.9898 + Math.floor(ticks / 2) * 78.233)) * 43758.5453;
    const tilt = s.trend === 'up' ? (p <= m.bid ? 1.5 : 0.75) : s.trend === 'down' ? (p <= m.bid ? 0.75 : 1.5) : 1;
    return Math.max(1, Math.round(((h - Math.floor(h)) * 24 + 4 + Math.max(0, 10 - dist * 2)) * tilt));
  }
  function step() {
    const panel = $('simulatorRoot') && $('simulatorRoot').closest('.tab-panel'); if (panel && panel.hidden) return;
    ticks += 1;
    const drift = s.trend === 'up' ? 1 : s.trend === 'down' ? -1 : 0;
    const shock = (s.scenario === 'fast' ? rnd(-6, 6) : (Math.random() < 0.55 ? rnd(-2, 2) : 0)) + (drift && Math.random() < 0.6 ? drift * rnd(1, s.scenario === 'fast' ? 4 : 2) : 0);
    Object.keys(s.mk).forEach(sym => {
      const m = s.mk[sym]; const d = shock + (Math.random() < 0.25 ? rnd(-1, 1) : 0);
      m.last = Math.max(500, m.last + d); m.bid = m.last; m.ask = m.last + 1;
      m.high = Math.max(m.high, m.last); m.low = Math.min(m.low, m.last);
      const v = rnd(1, s.scenario === 'fast' ? 40 : 12); m.vap[m.last] = (m.vap[m.last] || 0) + v; m.tv += v;
      m.hist = (m.hist || []).concat(m.last).slice(-30);
    });
    s.orders.forEach(tryFill);
    if (ticks % 4 === 0) save();
    paint();
  }
  function setRun(on) { clearInterval(timer); timer = on ? setInterval(step, Math.max(400, Number(s.speed) || 1500)) : null; paint(); }
  // Phân tích trực tiếp trên thang giá: cung cầu 10 mức, VWAP phiên, xu hướng 30 nhịp gần nhất
  function analysis(sym) {
    const m = mkt(sym); let bid = 0, ask = 0;
    for (let i = 0; i < 10; i++) { bid += depth(m.bid - i, m); ask += depth(m.ask + i, m); }
    const imb = Math.round((bid - ask) / (bid + ask) * 100);
    let pv = 0, vv = 0; Object.entries(m.vap).forEach(([p, v]) => { pv += Number(p) * v; vv += v; });
    const vwap = vv ? pv / vv : m.last; const h = m.hist || []; const chg = h.length > 1 ? m.last - h[0] : 0;
    const score = (imb > 12 ? 1 : imb < -12 ? -1 : 0) + (vv && m.last > vwap + 0.5 ? 1 : vv && m.last < vwap - 0.5 ? -1 : 0) + (chg >= 3 ? 1 : chg <= -3 ? -1 : 0);
    return { bid, ask, imb, vwap, vv, chg, n: h.length, score, side: score >= 2 ? 0 : score <= -2 ? 1 : 2 }; // side: 0 phe mua, 1 phe bán, 2 cân bằng
  }

  // ---------- Sổ vị thế & tài khoản (giá vốn bình quân, giống cách CQG hiển thị Pos/Avg/OTE) ----------
  function book() {
    const out = {};
    s.fills.forEach(f => {
      const g = out[f.sym] || (out[f.sym] = { pos: 0, avg: 0, real: 0, lots: 0 });
      const q = f.side === 'BUY' ? f.qty : -f.qty; g.lots += f.qty;
      if (!g.pos || Math.sign(q) === Math.sign(g.pos)) { g.avg = (g.avg * Math.abs(g.pos) + f.px * Math.abs(q)) / (Math.abs(g.pos) + Math.abs(q)); g.pos += q; }
      else {
        const close = Math.min(Math.abs(q), Math.abs(g.pos)); g.real += (f.px - g.avg) * close * LOT_T * Math.sign(g.pos);
        const flip = Math.abs(q) > Math.abs(g.pos); g.pos += q; if (flip) g.avg = f.px; if (!g.pos) g.avg = 0;
      }
    });
    return out;
  }
  function account() {
    const b = book(); let ote = 0, real = 0, used = 0, reserve = 0, lots = 0;
    Object.entries(b).forEach(([sym, g]) => { const m = mkt(sym); ote += g.pos ? (m.last - g.avg) * LOT_T * g.pos : 0; real += g.real; used += Math.abs(g.pos) * s.margin; lots += g.lots; });
    // Giữ chỗ ký quỹ cho lệnh chờ làm TĂNG vị thế (CQG trừ vào Purchasing Power)
    symbols().concat(Object.keys(b)).filter((x, i, a) => a.indexOf(x) === i).forEach(sym => {
      const pos = (b[sym] || {}).pos || 0; const w = s.orders.filter(o => o.sym === sym && LIVE.includes(o.status));
      const buys = w.filter(o => o.side === 'BUY').reduce((n, o) => n + o.qty - o.filled, 0), sells = w.filter(o => o.side === 'SELL').reduce((n, o) => n + o.qty - o.filled, 0);
      reserve += Math.max(0, Math.max(Math.abs(pos + buys), Math.abs(pos - sells)) - Math.abs(pos)) * s.margin;
    });
    const fees = lots * s.fee; const bal = s.cash + real * s.fx - fees; const oteV = ote * s.fx; const net = bal + oteV;
    return { b, ote: oteV, oteUsd: ote, real: real * s.fx, fees, bal, net, used, reserve, avail: net - used - reserve, call: used > 0 && net < used * 0.8 };
  }
  // Lệnh này có làm tăng vị thế (cần ký quỹ) không?
  function increases(o) { const pos = ((book()[o.sym] || {}).pos) || 0; return o.side === 'BUY' ? pos >= 0 || o.qty > -pos : pos <= 0 || o.qty > pos; }

  // ---------- Đặt / khớp / hủy / sửa lệnh ----------
  function newOrder(side, type, price, qty, sym) {
    sym = sym || s.sym; const m = mkt(sym); qty = Math.max(1, Math.round(Number(qty || s.qty) || 1));
    if (type === 'AUTO') type = side === 'BUY' ? (price < m.ask ? 'LMT' : 'STP') : (price > m.bid ? 'LMT' : 'STP');
    const o = { id: 'SIM' + String(s.seq++).padStart(5, '0'), at: clock(), acct: s.acct, sym, side, qty, type, px: type === 'MKT' ? 0 : Math.round(price), status: 'NEW', filled: 0, avg: 0, note: '' };
    if (s.confirm) { view.pending = o; paint(); return; }
    send(o);
  }
  function send(o) {
    const a = account();
    if (s.scenario === 'reject') { o.status = 'REJECTED'; o.note = 'Broker/sàn từ chối (hết quyền giao dịch mã này hoặc ngoài giờ). Đọc lý do, gọi broker – không gửi lặp.'; }
    else if (increases(o) && a.avail < s.margin * o.qty) { o.status = 'REJECTED'; o.note = `Không đủ ký quỹ: cần ${vnd(s.margin * o.qty)} đ, khả dụng ${vnd(a.avail)} đ. Nạp thêm tiền hoặc giảm số lot.`; }
    if (o.status === 'REJECTED') { log(`${o.id} ${o.side} ${o.qty} ${o.sym} bị REJECTED – ${o.note}`, 'bad'); s.orders.push(o); save(); return paint(); }
    s.orders.push(o);
    if (s.scenario === 'disconnect') {
      o.status = 'PENDING NEW'; o.note = 'Mất kết nối – chưa nhận xác nhận của sàn.';
      log(`${o.id} gửi đi nhưng MẤT KẾT NỐI: trạng thái chưa rõ. Không bấm gửi lại – chờ kết nối hoặc gọi broker kèm Order ID.`, 'warn');
      setTimeout(() => { if (o.status !== 'PENDING NEW') return; o.status = 'WORKING'; o.note = ''; log(`Kết nối lại: ${o.id} thực ra ĐÃ lên sàn (Working). Nếu lúc nãy gửi lại thì giờ đã có 2 lệnh.`, 'warn'); tryFill(o); save(); paint(); }, 4000);
    } else { o.status = 'WORKING'; log(`${o.id} ${o.side} ${o.qty} ${o.sym} ${o.type}${o.px ? ' @' + px(o.px) : ''} → Working (đang chờ khớp, CHƯA tính là đã phòng hộ).`); tryFill(o); }
    save(); paint();
  }
  function tryFill(o) {
    if (o.status !== 'WORKING' && o.status !== 'PARTIAL') return;
    const m = mkt(o.sym); let p = null;
    if (o.type === 'MKT') p = o.side === 'BUY' ? m.ask : m.bid;
    else if (o.type === 'LMT') { if (o.side === 'BUY' && m.ask <= o.px) p = Math.min(o.px, m.ask); if (o.side === 'SELL' && m.bid >= o.px) p = Math.max(o.px, m.bid); }
    else if (o.type === 'STP') { if (o.side === 'BUY' && m.last >= o.px) p = m.ask; if (o.side === 'SELL' && m.last <= o.px) p = m.bid; }
    if (p === null) return;
    if (s.scenario === 'fast' && o.type !== 'LMT') p += (o.side === 'BUY' ? 1 : -1) * rnd(1, 4); // trượt giá
    const left = o.qty - o.filled; const q = s.scenario === 'partial' && left > 1 ? Math.ceil(left / 2) : left;
    o.avg = (o.avg * o.filled + p * q) / (o.filled + q); o.filled += q;
    s.fills.push({ id: 'F' + String(s.fseq++).padStart(5, '0'), oid: o.id, at: clock(), sym: o.sym, side: o.side, qty: q, px: p });
    m.vap[p] = (m.vap[p] || 0) + q; m.tv += q;
    o.status = o.filled >= o.qty ? 'FILLED' : 'PARTIAL';
    log(o.status === 'FILLED' ? `${o.id} FILLED ${o.qty} ${o.sym} ${o.side} giá khớp TB ${px(o.avg)}${o.type !== 'LMT' && s.scenario === 'fast' ? ' (có trượt giá)' : ''}.`
      : `${o.id} khớp một phần ${o.filled}/${o.qty} @${px(p)} – còn ${o.qty - o.filled} lot Working.`, o.status === 'FILLED' ? 'ok' : 'warn');
  }
  function cancel(o) {
    if (!o || !LIVE.includes(o.status) || o.status === 'PENDING CANCEL') return;
    if (o.status === 'PENDING NEW') { log(`${o.id} đang chưa rõ trạng thái – chưa hủy được, chờ kết nối.`, 'warn'); return paint(); }
    o.status = 'PENDING CANCEL'; log(`${o.id} Pending Cancel – trong lúc chờ xác nhận lệnh vẫn có thể khớp.`, 'warn'); paint();
    setTimeout(() => { if (o.status !== 'PENDING CANCEL') return; o.status = 'CANCELED'; log(`${o.id} Canceled${o.filled ? ` (giữ phần đã khớp ${o.filled} lot)` : ''}.`); if (view.selOrder === o.id) view.selOrder = ''; save(); paint(); }, 600);
  }
  function replace(o, price) {
    if (!o || o.type === 'MKT' || !['WORKING', 'PARTIAL'].includes(o.status)) return;
    const was = o.status; o.status = 'PENDING REPLACE'; log(`${o.id} Pending Replace ${px(o.px)} → ${px(price)}.`, 'warn'); paint();
    setTimeout(() => { if (o.status !== 'PENDING REPLACE') return; o.px = Math.round(price); o.status = was; log(`${o.id} đã sửa giá ${px(o.px)}.`); tryFill(o); save(); paint(); }, 600);
  }
  function cancelAll() { const w = s.orders.filter(o => o.sym === s.sym && ['WORKING', 'PARTIAL'].includes(o.status)); w.forEach(cancel); if (!w.length) log('Cxl All: không còn lệnh chờ ở ' + s.sym + '.'); paint(); }
  function flatten() {
    cancelAll(); const pos = ((book()[s.sym] || {}).pos) || 0;
    if (!pos) { log('Flatten: ' + s.sym + ' không có vị thế.'); return paint(); }
    const keep = s.confirm; s.confirm = false; newOrder(pos > 0 ? 'SELL' : 'BUY', 'MKT', 0, Math.abs(pos), s.sym); s.confirm = keep;
    log(`Flatten ${s.sym}: hủy lệnh chờ và ${pos > 0 ? 'BÁN' : 'MUA'} ${Math.abs(pos)} lot thị trường để về 0. Bên hàng thật lúc này bị HỞ – chỉ dùng khi đã có quyết định.`, 'warn');
  }
  function addFill(sym, side, qty, price) { s.fills.push({ id: 'F' + String(s.fseq++).padStart(5, '0'), oid: 'ĐẦU BÀI', at: clock(), sym, side, qty, px: price }); }

  // ---------- Bài tập tình huống ----------
  function startLesson(id) {
    const L = LESSONS[id]; const keep = { confirm: s.confirm, speed: s.speed, margin: s.margin, fee: s.fee, fx: s.fx, qty: s.qty };
    setRun(false);
    s = { ...fresh(), ...keep, mk: s.mk, lesson: id || '' }; view.selOrder = ''; view.pending = null; view.center = null; view.sel = null; view.mode = 'market';
    if (L) {
      s.scenario = L.scenario || 'normal'; s.trend = L.trend || 'flat'; if (L.cash) s.cash = L.cash;
      (L.seed || []).forEach(([sym, side, q]) => addFill(sym, side, q, mkt(sym).last));
      const goalSym = Object.keys(L.goal)[0] || 'RMF27';
      s.sym = id === 'roll' || id === 'unwind' ? 'RMF27' : goalSym;
      s.qty = id === 'roll' || id === 'unwind' ? 4 : (Math.abs(L.goal[goalSym]) || s.qty);
      Object.keys(L.goal).concat(s.sym).forEach(sym => { const m = mkt(sym); m.hist = [m.last]; });
      s.start = { at: clock(), px: mkt(s.sym).last, sym: s.sym };
      log(`▶ Bắt đầu bài: ${L.title}. ${L.brief}`);
      if (L.run) setRun(true);
    }
    save(); paint();
  }
  // Chấm bài: đúng vị thế mục tiêu, không lệnh chờ thừa, không vượt mục tiêu (gửi lặp), đúng loại lệnh, trả lời câu hỏi
  function coach() {
    const L = LESSONS[s.lesson];
    if (!L) return { ok: false, html: 'Chọn một bài tập tình huống ở trên để đánh thử – huấn luyện viên sẽ chấm. Lần đầu dùng: bấm <b>🎓 Hướng dẫn từng bước</b> ở đầu khung.' };
    const b = book(); const syms = Object.keys(L.goal);
    const miss = syms.map(sym => { const p = ((b[sym] || {}).pos) || 0; return { sym, t: L.goal[sym], p, d: L.goal[sym] - p }; }).filter(x => x.d);
    const over = L.exact ? syms.map(sym => ({ sym, p: ((b[sym] || {}).pos) || 0, t: L.goal[sym] })).filter(x => Math.abs(x.p) > Math.abs(x.t) && Math.sign(x.p || 1) === Math.sign(x.t || x.p)) : [];
    const extra = Object.entries(b).filter(([sym, g]) => g.pos && !syms.includes(sym));
    const typeOk = !L.needType || s.orders.some(o => o.type === L.needType && o.status === 'FILLED' && o.side === 'BUY');
    const work = s.orders.filter(o => ['WORKING', 'PARTIAL', 'PENDING NEW', 'PENDING REPLACE'].includes(o.status));
    const quizOk = !L.quiz || (s.quiz && s.quiz.ok);
    const sent = s.orders.length, rej = s.orders.filter(o => o.status === 'REJECTED').length;
    const st = s.start && mkt(s.start.sym);
    const fills = s.fills.filter(f => f.oid !== 'ĐẦU BÀI');
    const lots = fills.reduce((n, f) => n + f.qty, 0);
    const avg = lots ? fills.reduce((n, f) => n + f.px * f.qty, 0) / lots : 0;
    const stats = s.start ? `<div class="dt-stats">Giá lúc bắt đầu <b>${px(s.start.px)}</b> · giá hiện tại <b>${px(st.last)}</b> · đã gửi <b>${sent}</b> lệnh (${rej} bị từ chối) · khớp <b>${lots}</b> lot${lots ? ` @TB <b>${px(Math.round(avg * 10) / 10)}</b> (lệch ${sg(Math.round((avg - s.start.px) * 10) / 10, String)} USD/t so với lúc bắt đầu)` : ''} · phí ${vnd(lots * s.fee)} đ</div>` : '';
    const quizHtml = L.quiz ? `<div class="dt-quiz"><b>❓ ${esc(L.quiz.q)}</b><div class="dt-row">${L.quiz.options.map((o, i) => `<button type="button" data-quiz="${i}" class="${s.quiz && s.quiz.pick === i ? (s.quiz.ok ? 'right' : 'wrong') : ''}">${esc(o)}</button>`).join('')}</div>${s.quiz ? `<p class="dt-note">${s.quiz.why}</p>` : ''}</div>` : '';
    if (over.length) return { ok: false, html: `❌ <b>Vượt mục tiêu:</b> ${over.map(x => `${x.sym} đang ${sg(x.p, String)} (cần ${sg(x.t, String)})`).join('; ')} – phần dư là <b>đầu cơ</b>, thường do gửi lặp. ${work.length ? 'Hủy lệnh chờ thừa, ' : ''}đóng bớt phần dư.` + stats + quizHtml };
    if (!miss.length && typeOk && quizOk && !extra.length && !(L.noWorking && work.length))
      return { ok: true, html: `✅ <b>Đạt!</b> ${syms.length ? `Vị thế đúng mục tiêu (${syms.map(k => `${k} ${sg(L.goal[k], String)}`).join(', ')}).` : ''}${work.length ? ' Còn lệnh chờ – hủy nếu không cần, tránh khớp thêm ngoài ý muốn.' : ''}` + stats + quizHtml };
    const tips = miss.map(x => `${x.d > 0 ? 'MUA' : 'BÁN'} ${Math.abs(x.d)} lot ${x.sym} (đang ${sg(x.p, String)}, cần ${sg(x.t, String)})`);
    if (extra.length) tips.push(`đóng vị thế ngoài bài: ${extra.map(([k, g]) => `${k} ${sg(g.pos, String)}`).join(', ')}`);
    if (!typeOk && !miss.length) tips.push('đủ lot nhưng chưa khớp bằng lệnh LMT như đề bài');
    if (L.noWorking && work.length && !miss.length) tips.push(`hủy ${work.length} lệnh còn chờ`);
    if (!quizOk) tips.push('trả lời câu hỏi bên dưới');
    return { ok: false, html: `Còn phải: <b>${tips.join('; ')}</b>.${work.length && !(L.noWorking && !miss.length) ? ` Đang có ${work.length} lệnh chờ – lệnh chờ chưa được tính là đã phòng hộ.` : ''}` + stats + quizHtml };
  }
  function answerQuiz(i) {
    const L = LESSONS[s.lesson]; if (!L || !L.quiz) return;
    const a = analysis(s.sym); const ok = i === a.side;
    const read = `Tổng chờ mua ${a.bid} lot / chờ bán ${a.ask} lot (lệch ${sg(a.imb, String)}%), giá ${px(mkt(s.sym).last)} ${a.vv ? (mkt(s.sym).last >= a.vwap ? 'trên' : 'dưới') + ' VWAP ' + px(Math.round(a.vwap)) : '(chưa đủ khối lượng tính VWAP)'}, ${a.n} nhịp gần nhất ${sg(a.chg, String)} USD.`;
    s.quiz = { pick: i, ok, why: `${ok ? '✅ Đúng.' : `❌ Chưa đúng – số liệu cho thấy: <b>${esc(L.quiz.options[a.side])}</b>.`} ${read} Đọc 3 dấu hiệu: bên nào chờ dày hơn, giá trên hay dưới VWAP, giá đang đi lên hay xuống – càng nhiều dấu hiệu cùng chiều thì càng chắc. Sổ lệnh có thể bị đặt ảo, chỉ dùng để chọn giá đặt lệnh phòng hộ.` };
    log(`Trả lời câu hỏi: ${L.quiz.options[i]} → ${ok ? 'đúng' : 'chưa đúng'}.`, ok ? 'ok' : 'warn'); save(); paint();
  }

  // ---------- Hướng dẫn từng bước (giới thiệu từng vùng & phím rồi đánh thử) ----------
  const TOUR = [
    ['.dt-banner', 'Đây là sàn GIẢ LẬP', 'Mọi thao tác chỉ để học: không kết nối CQG/MXV, không có tiền thật. Bố cục làm theo cửa sổ DOMTrader của CQG để lên sàn thật không bỡ ngỡ.'],
    ['.dt-title', 'Mã hợp đồng & giá', 'Chọn mã (RMF27 = Robusta kỳ tháng 1/2027). Bên phải: giá khớp gần nhất, thay đổi so với giá mở cửa, cao (H), thấp (L), tổng khối lượng (Vol) của phiên.'],
    ['.dt-bar', 'Qty – số lot & xác nhận', 'Chọn số lot TRƯỚC khi bấm đặt lệnh (1 lot = 10 tấn). "Xác nhận lệnh" bật thì mỗi lệnh hiện bước kiểm tra lại – người mới nên luôn bật.'],
    ['#dtPos', 'Thanh vị thế', 'Pos = số lot đang giữ (+ mua, − bán) · Avg = giá vốn bình quân · OTE = lãi/lỗ đang mở theo giá hiện tại · Working = số lệnh đang chờ khớp.'],
    ['#dtLadder', 'Thang giá DOM', 'Mỗi dòng là một mức giá (bước 1 USD/t). BID (xanh) = số lot người khác chờ MUA · ASK (đỏ) = chờ BÁN · PRICE: ô vàng = giá vừa khớp, H/L = cao/thấp phiên, ◆ = giá vốn của bạn · VOL = khối lượng đã khớp tại giá đó.'],
    ['#dtLadder', 'Đặt lệnh bằng cách bấm ô', 'Bấm ô cột BUY: thấp hơn giá = BUY LMT (chờ giá xuống), cao hơn giá = BUY STP (giá chạm mới kích hoạt). Cột SELL ngược lại. Lệnh hiện thành nhãn trên thang: bấm nhãn để chọn rồi bấm mức giá khác cùng cột để SỬA giá; bấm × để HỦY.'],
    ['.dt-acts', 'Nút nhanh', 'Buy Mkt / Sell Mkt: khớp ngay ở giá tốt nhất (có thể trượt giá) · Cxl All: hủy mọi lệnh chờ của mã · Flatten: hủy lệnh chờ và đưa vị thế về 0 · Center: đưa thang về giá hiện tại · ▲▼ cuộn · ▶ cho giá chạy.'],
    ['#dtKeys', 'Phím điều khiển', 'Bấm vào thang giá trước, rồi: ↑↓ chọn mức giá · ← MUA / → BÁN (chế độ Market = lệnh thị trường; đang chọn giá = đặt tại giá đó) · Alt+←/→ đặt tại best bid/offer · Home/Esc về Market · Delete hủy lệnh đang chọn · Ctrl+Home về giữa · Enter xác nhận.'],
    ['#dtAna', 'Phân tích trực tiếp', 'Tổng lot chờ mua/bán 10 mức gần nhất (bên nào dày hơn), giá so với VWAP (giá trung bình theo khối lượng của phiên), xu hướng 30 nhịp. Dùng để chọn giá đặt LMT, không dùng để đoán hướng mà bỏ phòng hộ.'],
    ['#dtAcct', 'Tài khoản & ký quỹ', 'Net Liq = giá trị tài khoản · Initial margin = ký quỹ đang bị giữ cho vị thế · Purchasing power = tiền còn đặt lệnh được. Không đủ thì lệnh bị REJECTED; giá trị tài khoản thấp hơn mức duy trì là MARGIN CALL.'],
    ['.dt-tray', 'Khay lệnh', 'Working = đang chờ khớp (CHƯA phòng hộ) · Filled = đã khớp · Cancelled = đã hủy · Exceptions = bị từ chối (đọc lý do) · Positions = vị thế từng mã. Mỗi lệnh có Order ID – báo broker khi có sự cố.'],
    ['#dtCoach', 'Đánh thử', 'Chọn bài tập tình huống: hệ thống dựng thị trường (tăng nhanh, khớp từng phần, mất kết nối, thiếu ký quỹ…) và chấm điểm. Bấm "Đánh thử ngay" để bắt đầu bài ①.']
  ];
  function tourPaint() {
    const root = $('simulatorRoot'); if (!root) return;
    root.querySelectorAll('.dt-hl').forEach(e => e.classList.remove('dt-hl'));
    let box = $('dtTour');
    if (view.tour < 0) { if (box) box.hidden = true; return; }
    const [sel, title, text] = TOUR[view.tour]; const el = root.querySelector(sel);
    if (el) { el.classList.add('dt-hl'); if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ block: phone() ? 'start' : 'center', behavior: 'smooth' }); }
    if (!box) { box = document.createElement('div'); box.id = 'dtTour'; box.className = 'dt-tour'; root.querySelector('.dt').appendChild(box); }
    box.hidden = false;
    const last = view.tour === TOUR.length - 1;
    box.innerHTML = `<div class="dt-tour-h"><span>🎓 Bước ${view.tour + 1}/${TOUR.length}</span><button type="button" data-tour="x" aria-label="Thoát hướng dẫn">×</button></div><b>${esc(title)}</b><p>${esc(text)}</p>
      <div class="dt-row"><button type="button" data-tour="prev"${view.tour ? '' : ' disabled'}>‹ Lùi</button>${last ? '<button type="button" class="dt-send" data-tour="go">Đánh thử ngay ▶</button>' : '<button type="button" class="dt-send" data-tour="next">Tiếp ›</button>'}</div>`;
  }
  function tour(act) {
    if (act === 'start') view.tour = 0;
    else if (act === 'next') view.tour = Math.min(TOUR.length - 1, view.tour + 1);
    else if (act === 'prev') view.tour = Math.max(0, view.tour - 1);
    else if (act === 'go') { view.tour = -1; tourPaint(); startLesson('sale38'); $('dtLadder').scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
    else view.tour = -1;
    try { if (view.tour < 0) localStorage.setItem('vt_dom_tour', '1'); } catch (e) { /* bỏ qua */ }
    tourPaint();
  }

  // ---------- Giao diện ----------
  function build() {
    const root = $('simulatorRoot'); if (!root) return;
    root.innerHTML = `<div class="dt">
      <div class="dt-banner"><span><b>SIMULATION</b> · Sàn giả lập kiểu DOMTrader để đào tạo – không kết nối CQG/MXV, không gửi lệnh thật, không có tiền thật.</span><button type="button" class="dt-tourbtn" data-tour="start">🎓 Hướng dẫn từng bước</button></div>
      <div class="dt-grid">
        <section class="dt-win">
          <div class="dt-title"><select id="dtSym" class="dt-sel" aria-label="Mã hợp đồng"></select><span class="dt-acct" id="dtAcctName"></span><span class="dt-clock" id="dtLast"></span></div>
          <div class="dt-bar"><span class="dt-lbl">Qty</span><div class="dt-qtys" id="dtQtys">${[1, 2, 4, 5, 10].map(q => `<button type="button" data-qty="${q}">${q}</button>`).join('')}</div>
            <input id="dtQty" class="dt-in" type="number" min="1" max="99" inputmode="numeric" aria-label="Số lot">
            <label class="dt-chk"><input type="checkbox" id="dtConfirmOn"> Xác nhận lệnh</label></div>
          <div class="dt-posbar" id="dtPos"></div>
          <div class="dt-ladder" id="dtLadder" tabindex="0" aria-label="Thang giá DOM – bấm ô BUY/SELL để đặt lệnh; dùng phím mũi tên khi đang chọn">
            <table><thead><tr><th class="c-buy" title="Lệnh MUA đang chờ của bạn – bấm ô để đặt lệnh mua">BUY</th><th class="c-bid" title="Số lot đang chờ mua (Bid)">BID</th><th class="c-px">PRICE</th><th class="c-ask" title="Số lot đang chờ bán (Ask/Offer)">ASK</th><th class="c-sell" title="Lệnh BÁN đang chờ của bạn – bấm ô để đặt lệnh bán">SELL</th><th class="c-vol" title="Khối lượng đã khớp tại từng giá trong phiên">VOL</th></tr></thead>
            <tbody id="dtRows"></tbody></table></div>
          <div class="dt-acts"><button type="button" class="dt-bmkt" data-act="bmkt">Buy Mkt</button><button type="button" class="dt-smkt" data-act="smkt">Sell Mkt</button>
            <button type="button" data-act="cxl">Cxl All</button><button type="button" data-act="flat">Flatten</button><button type="button" data-act="center" title="Đưa thang giá về giá thị trường (Ctrl+Home)">Center</button>
            <button type="button" data-act="up" title="Cuộn lên">▲</button><button type="button" data-act="down" title="Cuộn xuống">▼</button></div>
          <div class="dt-ana" id="dtAna"></div>
          <div class="dt-mode" id="dtMode"></div>
          <div class="dt-confirm" id="dtConfirm" hidden></div>
        </section>
        <aside class="dt-side">
          <div class="dt-card" id="dtAcct"></div>
          <div class="dt-card" id="dtCoach"></div>
          <div class="dt-card"><h4>Order Ticket <small>phiếu lệnh</small></h4>
            <div class="dt-tk"><select id="tkSide" class="dt-sel"><option>BUY</option><option>SELL</option></select><select id="tkType" class="dt-sel"><option value="LMT">LMT</option><option value="MKT">MKT</option><option value="STP">STP</option></select>
              <input id="tkPx" class="dt-in" type="number" inputmode="numeric" aria-label="Giá"><button type="button" class="dt-send" data-act="ticket">Gửi</button></div>
            <p class="dt-note">Số lot và mã lấy theo thanh trên cùng. LMT = giá giới hạn, MKT = khớp ngay giá tốt nhất, STP = kích hoạt khi giá chạm.</p></div>
          <details class="dt-card" id="dtKeys"><summary>⌨️ Phím & cột – đọc hiểu</summary>
            <table class="dt-help"><tbody>
              <tr><td><kbd>↑</kbd><kbd>↓</kbd></td><td>Chọn mức giá trên thang (chế độ Price-browse)</td></tr>
              <tr><td><kbd>←</kbd></td><td>MUA: chế độ Market → Buy Mkt; đang chọn giá → MUA tại giá đó (dưới giá = LMT, trên giá = STP)</td></tr>
              <tr><td><kbd>→</kbd></td><td>BÁN: tương tự phía bán</td></tr>
              <tr><td><kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd></td><td>MUA tại best bid / BÁN tại best offer (lệnh LMT)</td></tr>
              <tr><td><kbd>Home</kbd> / <kbd>Esc</kbd></td><td>Về chế độ Market (bỏ chọn giá)</td></tr>
              <tr><td><kbd>Delete</kbd></td><td>Hủy lệnh đang chọn (bấm vào lệnh trên thang để chọn)</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>Home</kbd></td><td>Center – đưa thang về giá thị trường</td></tr>
            </tbody></table>
            <ul class="dt-legend"><li><b>BUY / SELL</b>: lệnh chờ của bạn. Bấm ô trống để đặt; bấm lệnh để chọn, rồi bấm mức giá khác cùng cột để <b>sửa giá</b>; bấm × để hủy.</li>
              <li><b>BID</b> (xanh): lot người khác chờ mua · <b>ASK</b> (đỏ): lot chờ bán · best bid/ask viền sáng.</li>
              <li><b>PRICE</b>: ô vàng = giá khớp gần nhất · <b>H</b>/<b>L</b> = cao/thấp phiên · ◆ = giá vốn TB vị thế của bạn.</li>
              <li><b>VOL</b>: khối lượng đã khớp tại từng giá – thanh dài là vùng giá giao dịch nhiều.</li>
              <li><b>Pos</b> vị thế (+ mua, − bán) · <b>Avg</b> giá vốn TB · <b>OTE</b> lãi/lỗ đang mở · <b>Purchasing power</b> tiền còn đặt lệnh được.</li>
              <li>Phím chỉ tác động khi thang giá đang được chọn (bấm vào thang trước). Trên CQG thật, phím có thể bị cấu hình khác – kiểm tra Preferences.</li></ul></details>
          <details class="dt-card" id="dtSet"><summary>⚙️ Thông số giả lập</summary>
            <div class="dt-form">
              <label>Kịch bản<select id="setScn" class="dt-sel">${Object.entries(SCENARIOS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
              <label>Tốc độ giá<select id="setSpeed" class="dt-sel"><option value="2500">Chậm</option><option value="1500">Vừa</option><option value="700">Nhanh</option></select></label>
              <label>Ký quỹ / lot (đ)<input id="setMargin" class="dt-in" type="number" inputmode="numeric"></label>
              <label>Phí / lot / chiều (đ)<input id="setFee" class="dt-in" type="number" inputmode="numeric"></label>
              <label>Tỷ giá USD (đ)<input id="setFx" class="dt-in" type="number" inputmode="numeric"></label>
            </div>
            <p class="dt-note">Ký quỹ, phí là <b>số mẫu</b> – sửa theo bảng ký quỹ MXV và biểu phí của thành viên kinh doanh hiện hành.</p>
            <div class="dt-row"><button type="button" class="dt-btn" data-act="sync">↺ Lấy giá London thật</button><button type="button" class="dt-btn" data-act="reset">🗑 Xóa toàn bộ dữ liệu giả lập</button></div></details>
        </aside>
      </div>
      <div class="dt-tray"><div class="dt-tabs" id="dtTabs">${[['working', 'Working'], ['filled', 'Filled'], ['cancelled', 'Cancelled'], ['exceptions', 'Exceptions'], ['all', 'All'], ['positions', 'Positions']].map(([k, l]) => `<button type="button" data-tray="${k}">${l}<span></span></button>`).join('')}</div>
        <div class="table-scroll dt-trayscroll"><table class="dt-orders" id="dtTray"></table></div></div>
      <details class="dt-log" open><summary>Nhật ký & giải thích trạng thái</summary><div id="dtLog"></div></details>
    </div>`;
    built = true; bind();
  }
  function rowsHtml() {
    const m = mkt(s.sym); const N = phone() ? 9 : 12; if (view.center === null) view.center = m.last;
    const c = view.center; const avg = ((book()[s.sym] || {}).avg) || 0;
    const work = s.orders.filter(o => o.sym === s.sym && LIVE.includes(o.status) && o.type !== 'MKT');
    let maxV = 1; for (let p = c - N; p <= c + N; p++) maxV = Math.max(maxV, m.vap[p] || 0);
    const chip = o => `<span class="dt-chip ${o.side === 'BUY' ? 'b' : 's'}${view.selOrder === o.id ? ' on' : ''}${o.status.startsWith('PENDING') ? ' pend' : ''}" data-oid="${o.id}" title="${o.id} ${o.type} ${o.status} – bấm để chọn (rồi bấm giá khác để sửa)"><b>${o.qty - o.filled}${o.type === 'STP' ? ' STP' : ''}</b><i data-cx="${o.id}" title="Hủy lệnh">×</i></span>`;
    const out = [];
    for (let p = c + N; p >= c - N; p--) {
      const buys = work.filter(o => o.side === 'BUY' && o.px === p), sells = work.filter(o => o.side === 'SELL' && o.px === p);
      const cls = [p === m.last ? 'last' : '', view.mode === 'browse' && view.sel === p ? 'sel' : '', p === m.bid ? 'bb' : '', p === m.ask ? 'ba' : ''].join(' ');
      const mk = (p === m.high ? '<em class="h">H</em>' : '') + (p === m.low ? '<em class="l">L</em>' : '') + (avg && Math.round(avg) === p ? '<em class="a" title="Giá vốn TB">◆</em>' : '');
      const v = m.vap[p] || 0;
      out.push(`<tr class="${cls}" data-p="${p}"><td class="c-buy" data-col="BUY" data-p="${p}">${buys.map(chip).join('')}</td>`
        + `<td class="c-bid">${p <= m.bid ? depth(p, m) : ''}</td><td class="c-px">${mk}${px(p)}</td><td class="c-ask">${p >= m.ask ? depth(p, m) : ''}</td>`
        + `<td class="c-sell" data-col="SELL" data-p="${p}">${sells.map(chip).join('')}</td><td class="c-vol">${v ? `<span style="width:${Math.round(v / maxV * 100)}%"></span><b>${v}</b>` : ''}</td></tr>`);
    }
    return out.join('');
  }
  function trayHtml() {
    const t = view.tray;
    if (t === 'positions') {
      const b = book(); const rows = Object.entries(b).filter(([, g]) => g.pos || g.real).map(([sym, g]) => { const m = mkt(sym); const ote = g.pos ? (m.last - g.avg) * LOT_T * g.pos : 0;
        return `<tr><td>${esc(s.acct)}</td><td>${sym}</td><td class="${g.pos > 0 ? 'b' : g.pos < 0 ? 's' : ''}">${sg(g.pos, String)}</td><td>${g.pos ? px(Math.round(g.avg * 10) / 10) : '—'}</td><td>${px(m.last)}</td><td class="${ote >= 0 ? 'b' : 's'}">${sg(ote, px)} USD<br><small>${sg(ote * s.fx, vnd)} đ</small></td><td>${sg(g.real, px)} USD</td></tr>`; }).join('');
      return `<thead><tr><th>Account</th><th>Symbol</th><th>Pos</th><th>Avg</th><th>Last</th><th>OTE</th><th>Realized</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="dt-empty">Chưa có vị thế.</td></tr>'}</tbody>`;
    }
    const pick = { working: o => LIVE.includes(o.status), filled: o => o.status === 'FILLED', cancelled: o => o.status === 'CANCELED', exceptions: o => o.status === 'REJECTED', all: () => true }[t] || (() => true);
    const list = s.orders.filter(pick).slice().reverse();
    const body = list.map(o => `<tr class="${view.selOrder === o.id ? 'on' : ''}"><td>${o.id}</td><td>${o.at}</td><td class="${o.side === 'BUY' ? 'b' : 's'}">${o.side}</td><td>${o.qty}</td><td>${o.sym}</td><td>${o.type}</td><td>${o.px ? px(o.px) : 'MKT'}</td>`
      + `<td><span class="dt-st st-${o.status.replace(/ /g, '-').toLowerCase()}">${o.status}</span>${o.note ? `<small>${esc(o.note)}</small>` : ''}</td><td>${o.filled}/${o.qty}</td><td>${o.filled ? px(Math.round(o.avg * 10) / 10) : '—'}</td>`
      + `<td>${['WORKING', 'PARTIAL'].includes(o.status) ? `${o.type !== 'MKT' ? `<button type="button" data-mod="${o.id}">Sửa</button>` : ''}<button type="button" data-cxl="${o.id}">Hủy</button>` : ''}</td></tr>`).join('');
    return `<thead><tr><th>Order ID</th><th>Time</th><th>B/S</th><th>Qty</th><th>Symbol</th><th>Type</th><th>Price</th><th>Status</th><th>Filled</th><th>Avg Fill</th><th></th></tr></thead><tbody>${body || `<tr><td colspan="11" class="dt-empty">Không có lệnh ở mục này.</td></tr>`}</tbody>`;
  }
  function paint() {
    const root = $('simulatorRoot'); if (!root) return; if (!built || !root.querySelector('.dt')) build();
    const m = mkt(s.sym); const a = account(); const g = a.b[s.sym] || { pos: 0, avg: 0 }; const ote = g.pos ? (m.last - g.avg) * LOT_T * g.pos : 0;
    const syms = symbols(); $('dtSym').innerHTML = syms.map(x => `<option${x === s.sym ? ' selected' : ''}>${x}</option>`).join('');
    $('dtAcctName').textContent = s.acct;
    $('dtLast').innerHTML = `<b class="${m.last >= m.open ? 'up' : 'dn'}">${px(m.last)}</b> <small>${sg(m.last - m.open, px)} · H ${px(m.high)} · L ${px(m.low)} · Vol ${px(m.tv)}</small>`;
    if (document.activeElement !== $('dtQty')) $('dtQty').value = s.qty;
    $('dtQtys').querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.qty) === s.qty));
    $('dtConfirmOn').checked = !!s.confirm;
    $('dtPos').innerHTML = `<span>Pos <b class="${g.pos > 0 ? 'b' : g.pos < 0 ? 's' : ''}">${sg(g.pos, String)}</b></span><span>Avg <b>${g.pos ? px(Math.round(g.avg * 10) / 10) : '—'}</b></span>`
      + `<span>OTE <b class="${ote > 0 ? 'b' : ote < 0 ? 's' : ''}">${sg(ote, px)} USD</b></span><span>Working <b>${s.orders.filter(o => o.sym === s.sym && LIVE.includes(o.status)).length}</b></span>`;
    $('dtRows').innerHTML = rowsHtml();
    $('dtMode').innerHTML = view.mode === 'browse' && view.sel !== null
      ? `Chế độ <b>Price-browse</b> @ ${px(view.sel)} – <kbd>←</kbd> MUA / <kbd>→</kbd> BÁN tại giá này · <kbd>Esc</kbd> về Market`
      : `Chế độ <b>Market</b> – <kbd>←</kbd> Buy Mkt / <kbd>→</kbd> Sell Mkt (bấm vào thang giá để dùng phím) · ${timer ? '▶ giá đang chạy' : '⏸ giá đứng'}`;
    const c = $('dtConfirm'); const o = view.pending;
    c.hidden = !o;
    if (o) c.innerHTML = `<div><b>Xác nhận lệnh:</b> <span class="${o.side === 'BUY' ? 'b' : 's'}">${o.side}</span> ${o.qty} lot ${o.sym} ${o.type}${o.px ? ' @' + px(o.px) : ''}<small>${o.type === 'STP' ? 'STP: chỉ kích hoạt khi giá chạm mức này rồi khớp như lệnh thị trường.' : o.type === 'MKT' ? 'MKT: khớp ngay ở giá tốt nhất đang có – có thể trượt giá.' : 'LMT: chỉ khớp tại giá này hoặc tốt hơn – có thể không khớp.'}</small></div><div class="dt-row"><button type="button" class="${o.side === 'BUY' ? 'dt-bmkt' : 'dt-smkt'}" data-act="ok">Gửi lệnh</button><button type="button" data-act="no">Hủy</button></div>`;
    $('dtAcct').innerHTML = `<h4>Account <small>${esc(s.acct)} · tiền giả lập</small></h4><table class="dt-kv"><tbody>
      <tr><td>Vốn nạp</td><td>${vnd(s.cash)} đ</td></tr><tr><td>Balance <small>số dư sau lãi/lỗ đã chốt & phí</small></td><td>${vnd(a.bal)} đ</td></tr>
      <tr><td>OTE <small>lãi/lỗ đang mở</small></td><td class="${a.ote >= 0 ? 'b' : 's'}">${sg(a.ote, vnd)} đ</td></tr><tr><td>Realized</td><td>${sg(a.real, vnd)} đ</td></tr><tr><td>Phí đã trả</td><td>${vnd(a.fees)} đ</td></tr>
      <tr><td>Net Liq <small>giá trị tài khoản</small></td><td><b>${vnd(a.net)} đ</b></td></tr><tr><td>Initial margin <small>ký quỹ đang dùng</small></td><td>${vnd(a.used)} đ</td></tr>
      <tr><td>Giữ chỗ lệnh chờ</td><td>${vnd(a.reserve)} đ</td></tr><tr><td>Purchasing power <small>còn đặt lệnh được</small></td><td class="${a.avail >= 0 ? '' : 's'}"><b>${vnd(a.avail)} đ</b> <small>≈ ${Math.max(0, Math.floor(a.avail / s.margin))} lot</small></td></tr>
      </tbody></table>${a.call ? '<div class="dt-call">⚠️ MARGIN CALL: giá trị tài khoản dưới 80% ký quỹ đang dùng – phải nộp thêm tiền hoặc giảm vị thế.</div>' : ''}
      <div class="dt-row"><button type="button" class="dt-btn" data-act="dep">+ Nạp 300 triệu</button></div>`;
    const an = analysis(s.sym); const L0 = LESSONS[s.lesson]; const hide = L0 && L0.quiz && !(s.quiz && s.quiz.ok);
    const verdict = an.side === 0 ? '🟢 <b>Phe MUA đang chiếm ưu thế</b>' : an.side === 1 ? '🔴 <b>Phe BÁN đang chiếm ưu thế</b>' : '⚪ <b>Hai phe cân bằng</b>';
    const why = [an.imb > 12 ? 'bên chờ mua dày hơn' : an.imb < -12 ? 'bên chờ bán dày hơn' : 'chờ mua ≈ chờ bán', an.vv ? (m.last > an.vwap + 0.5 ? 'giá trên VWAP' : m.last < an.vwap - 0.5 ? 'giá dưới VWAP' : 'giá quanh VWAP') : 'chưa đủ khối lượng tính VWAP', an.chg >= 3 ? 'giá đang đi lên' : an.chg <= -3 ? 'giá đang đi xuống' : 'giá đi ngang'];
    $('dtAna').innerHTML = '<div class="dt-ana-h">📊 PHÂN TÍCH TRỰC TIẾP · ' + s.sym + '</div><div class="dt-ana-g">'
      + '<div><small>Chờ mua 10 mức</small><b class="b">' + an.bid + '</b></div><div><small>Chờ bán 10 mức</small><b class="s">' + an.ask + '</b></div>'
      + '<div><small>Lệch cung cầu</small><b class="' + (an.imb > 0 ? 'b' : an.imb < 0 ? 's' : '') + '">' + sg(an.imb, String) + '%</b></div>'
      + '<div><small>VWAP phiên</small><b>' + (an.vv ? px(Math.round(an.vwap)) : '—') + '</b></div><div><small>' + an.n + ' nhịp gần nhất</small><b class="' + (an.chg > 0 ? 'b' : an.chg < 0 ? 's' : '') + '">' + sg(an.chg, String) + '</b></div></div>'
      + '<div class="dt-ana-bar" title="Tỷ lệ chờ mua / chờ bán"><span style="width:' + Math.round(an.bid / (an.bid + an.ask) * 100) + '%"></span></div>'
      + '<p>' + (hide ? '🔒 Kết luận ẩn trong bài ⑩ – tự đọc 3 dấu hiệu rồi trả lời câu hỏi ở khung Bài tập.' : verdict + ': ' + why.join(' · ') + '. Phòng hộ: dùng để chọn giá đặt LMT, không đoán hướng.') + '</p>';
    const ch = coach();
    $('dtCoach').innerHTML = `<h4>🎯 Bài tập</h4><select id="dtLesson" class="dt-sel dt-wide"><option value="">Tập tự do</option>${Object.entries(LESSONS).map(([k, L]) => `<option value="${k}"${k === s.lesson ? ' selected' : ''}>${esc(L.title)}</option>`).join('')}</select>`
      + (LESSONS[s.lesson] ? `<p class="dt-brief">${esc(LESSONS[s.lesson].brief)}</p>` : '') + `<div class="dt-coach ${ch.ok ? 'ok' : ''}">${ch.html}</div>`;
    if (document.activeElement !== $('tkPx') && (!$('tkPx').value || !view.tkTouched)) $('tkPx').value = m.last;
    $('dtTabs').querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', b.dataset.tray === view.tray);
      const n = b.dataset.tray === 'working' ? s.orders.filter(o => LIVE.includes(o.status)).length : b.dataset.tray === 'exceptions' ? s.orders.filter(o => o.status === 'REJECTED').length : 0;
      b.querySelector('span').textContent = n ? ` ${n}` : '';
    });
    $('dtTray').innerHTML = trayHtml();
    $('dtLog').innerHTML = s.log.map(x => `<p class="${x.kind}"><time>${x.at}</time> ${esc(x.text)}</p>`).join('') || '<p>Chưa có thao tác. Bấm ▶ ở dưới hoặc chọn một bài tập để bắt đầu.</p>';
    let toured = false; try { toured = !!localStorage.getItem('vt_dom_tour'); } catch (e) { /* bỏ qua */ }
    const tb = root.querySelector('.dt-tourbtn'); if (tb) tb.classList.toggle('pulse', !toured && view.tour < 0);
    const run = root.querySelector('[data-act="run"]'); if (run) run.textContent = timer ? '⏸ Dừng giá' : '▶ Chạy giá';
    const setScn = $('setScn'); if (setScn && document.activeElement !== setScn) setScn.value = s.scenario;
    const sp = $('setSpeed'); if (sp && document.activeElement !== sp) sp.value = String(s.speed);
    [['setMargin', 'margin'], ['setFee', 'fee'], ['setFx', 'fx']].forEach(([id, k]) => { const el = $(id); if (el && document.activeElement !== el) el.value = s[k]; });
  }

  // ---------- Sự kiện ----------
  function scrollBy(n) { const m = mkt(s.sym); view.center = (view.center === null ? m.last : view.center) + n; paint(); }
  function bind() {
    const root = $('simulatorRoot');
    // Nút chạy giá nằm ở thanh hành động
    root.querySelector('.dt-acts').insertAdjacentHTML('beforeend', '<button type="button" data-act="run" class="dt-run">▶ Chạy giá</button>');
    $('tkPx').addEventListener('input', () => { view.tkTouched = true; });
    bindKeys();
    if (root.dataset.dtBound) return; // khung ngoài giữ nguyên qua các lần vẽ lại → chỉ gắn sự kiện một lần
    root.dataset.dtBound = '1';
    root.addEventListener('click', e => {
      if (view.pending && !e.target.closest('#dtConfirm') && e.target.closest('[data-col],[data-act="bmkt"],[data-act="smkt"]')) { view.pending = null; }
      const cx = e.target.closest('[data-cx]'); if (cx) { e.stopPropagation(); cancel(s.orders.find(o => o.id === cx.dataset.cx)); return; }
      const chip = e.target.closest('[data-oid]'); if (chip) { view.selOrder = view.selOrder === chip.dataset.oid ? '' : chip.dataset.oid; $('dtLadder').focus({ preventScroll: true }); return paint(); }
      const cell = e.target.closest('td[data-col]');
      if (cell) {
        const p = Number(cell.dataset.p), side = cell.dataset.col; const sel = s.orders.find(o => o.id === view.selOrder);
        $('dtLadder').focus({ preventScroll: true });
        if (sel && sel.side === side && sel.sym === s.sym && LIVE.includes(sel.status)) { replace(sel, p); view.selOrder = ''; return; }
        return newOrder(side, 'AUTO', p);
      }
      const tr = e.target.closest('[data-tour]'); if (tr) return tour(tr.dataset.tour);
      const qz = e.target.closest('[data-quiz]'); if (qz) return answerQuiz(Number(qz.dataset.quiz));
      const q = e.target.closest('[data-qty]'); if (q) { s.qty = Number(q.dataset.qty); save(); return paint(); }
      const t = e.target.closest('[data-tray]'); if (t) { view.tray = t.dataset.tray; return paint(); }
      const cl = e.target.closest('[data-cxl]'); if (cl) return cancel(s.orders.find(o => o.id === cl.dataset.cxl));
      const md = e.target.closest('[data-mod]');
      if (md) { const o = s.orders.find(x => x.id === md.dataset.mod); const v = prompt(`Giá mới cho ${o.id} (${o.side} ${o.type} @${px(o.px)}):`, String(o.px)); if (v !== null && Number(v) > 0) replace(o, Number(v)); return; }
      const b = e.target.closest('[data-act]'); if (!b) return;
      const m = mkt(s.sym);
      switch (b.dataset.act) {
        case 'bmkt': return newOrder('BUY', 'MKT', 0);
        case 'smkt': return newOrder('SELL', 'MKT', 0);
        case 'cxl': return cancelAll();
        case 'flat': return flatten();
        case 'center': view.center = null; return paint();
        case 'up': return scrollBy(5);
        case 'down': return scrollBy(-5);
        case 'run': return setRun(!timer);
        case 'ok': { const o = view.pending; view.pending = null; if (o) send(o); return; }
        case 'no': view.pending = null; log('Đã bỏ lệnh ở bước xác nhận – chưa gửi gì lên sàn.'); return paint();
        case 'ticket': { const side = $('tkSide').value, type = $('tkType').value, p = Number($('tkPx').value) || m.last; view.tkTouched = false; return newOrder(side, type, p); }
        case 'dep': s.cash += 300000000; log('Đã nạp 300 triệu (giả lập). Thực tế: chuyển vào đúng tài khoản ngân hàng của thành viên MXV, chờ tiền hiện trong Purchasing power rồi mới đặt lệnh.', 'ok'); save(); return paint();
        case 'sync': if (resync(s.sym)) log(`Đã lấy lại giá London thật cho ${s.sym}: ${px(mkt(s.sym).last)}.`); else log('Chưa có giá London thật để đồng bộ.', 'warn'); save(); return paint();
        case 'reset': if (confirm('Xóa toàn bộ lệnh, vị thế và nhật ký giả lập trên trình duyệt này?')) { setRun(false); s = fresh(); view.center = null; view.selOrder = ''; view.pending = null; save(); paint(); } return;
        default: return;
      }
    });
    root.addEventListener('change', e => {
      const id = e.target.id;
      if (id === 'dtSym') { s.sym = e.target.value; view.center = null; view.sel = null; view.mode = 'market'; view.selOrder = ''; }
      else if (id === 'dtQty') s.qty = Math.max(1, Math.min(99, Math.round(Number(e.target.value) || 1)));
      else if (id === 'dtConfirmOn') s.confirm = e.target.checked;
      else if (id === 'dtLesson') return startLesson(e.target.value);
      else if (id === 'setScn') { s.scenario = e.target.value; log(`Kịch bản: ${SCENARIOS[s.scenario]}.`); }
      else if (id === 'setSpeed') { s.speed = Number(e.target.value); if (timer) setRun(true); }
      else if (id === 'setMargin' || id === 'setFee' || id === 'setFx') { const k = { setMargin: 'margin', setFee: 'fee', setFx: 'fx' }[id]; s[k] = Math.max(id === 'setFx' ? 1000 : 0, Number(e.target.value) || 0); }
      else if (id === 'tkPx') view.tkTouched = true;
      else return;
      save(); paint();
    });
  }
  // Phím điều khiển kiểu DOMTrader – chỉ khi thang giá đang được chọn (focus)
  function bindKeys() {
    $('dtLadder').addEventListener('keydown', e => {
      const m = mkt(s.sym); let handled = true;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { view.mode = 'browse'; view.sel = (view.sel === null ? m.last : view.sel) + (e.key === 'ArrowUp' ? 1 : -1); const N = phone() ? 9 : 12; if (Math.abs(view.sel - view.center) > N - 2) view.center = view.sel; paint(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const side = e.key === 'ArrowLeft' ? 'BUY' : 'SELL';
        if (e.altKey) newOrder(side, 'LMT', side === 'BUY' ? m.bid : m.ask);
        else if (view.mode === 'browse' && view.sel !== null) newOrder(side, 'AUTO', view.sel);
        else newOrder(side, 'MKT', 0);
      }
      else if (e.key === 'Home' && e.ctrlKey) { view.center = null; paint(); }
      else if (e.key === 'Home' || e.key === 'Escape') { if (view.pending) view.pending = null; view.mode = 'market'; view.sel = null; paint(); }
      else if (e.key === 'Delete') { const o = s.orders.find(x => x.id === view.selOrder); if (o) cancel(o); else log('Delete: chưa chọn lệnh nào (bấm vào lệnh trên thang để chọn).', 'warn'); paint(); }
      else if (e.key === 'Enter' && view.pending) { const o = view.pending; view.pending = null; send(o); }
      else handled = false;
      if (handled) e.preventDefault();
    });
    $('dtLadder').addEventListener('wheel', e => { e.preventDefault(); scrollBy(e.deltaY < 0 ? 2 : -2); }, { passive: false });
  }
  function render() { if (!built || !$('simulatorRoot') || !$('simulatorRoot').querySelector('.dt')) build(); paint(); }
  window.VTSimulator = { render };
})();

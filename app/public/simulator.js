// VIỆT THIÊN — Sàn giả lập kiểu CQG DOMTrader (đào tạo nội bộ).
// TUYỆT ĐỐI không kết nối CQG/MXV, không gửi lệnh thật. Dữ liệu chỉ lưu trên trình duyệt đang dùng.
// Làm theo tài liệu CQG (help.cqg.com): thang Buy · Bid · Price · Ask · Sell; Buy MKT / Sell MKT ở đầu DOM (Sell bên phải);
// Fast-click (bấm cột Buy/Bid/Ask/Sell), kéo-thả giá vào cột Buy/Sell, kéo lệnh sang giá mới để sửa, chuột phải / kéo ra ngoài để hủy,
// nút hủy lệnh mua / bán / tất cả, phím mặc định của Keyboard Keys Preferences, khay Working / Filled / Cancelled / Exceptions / Parked / All,
// Account Summary: Balance, P/L, OTE, NLV, Margin Value, Purchasing Power, Margin Excess.
(function () {
  'use strict';
  const KEY = 'vt_dom_sim_v3';
  const LOT_T = 10;                     // 1 lot Robusta = 10 tấn → 1 USD/t = 10 USD/lot
  const LIVE = ['WORKING', 'PARTIAL', 'IN TRANSIT', 'PENDING CANCEL', 'PENDING MODIFY'];
  const STATUS = { WORKING: 'Working', PARTIAL: 'Working', FILLED: 'Filled', CANCELED: 'Cancelled', EXPIRED: 'Expired', REJECTED: 'Rejected', PARKED: 'Parked',
    'IN TRANSIT': 'In transit', 'PENDING CANCEL': 'Cancel sent', 'PENDING MODIFY': 'Modify sent', NEW: 'New' };
  // Trạng thái tương ứng chuẩn FIX (Execution Report – OrdStatus) mà API của CQG dùng
  const FIX = { WORKING: '0 New', PARTIAL: '1 Partially filled', FILLED: '2 Filled', CANCELED: '4 Canceled', EXPIRED: 'C Expired', REJECTED: '8 Rejected', PARKED: 'chỉ có trên CQG – chưa gửi lên sàn',
    'IN TRANSIT': 'A Pending New', 'PENDING CANCEL': '6 Pending Cancel', 'PENDING MODIFY': 'E Pending Replace', NEW: '—' };
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const px = n => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const vnd = n => Math.round(Number(n) || 0).toLocaleString('vi-VN');
  const sg = (n, f) => (n > 0 ? '+' : n < 0 ? '−' : '') + f(Math.abs(n));
  const clock = () => new Date().toLocaleTimeString('vi-VN', { hour12: false });
  const today = () => new Date().toLocaleDateString('vi-VN');
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const phone = () => window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const app = () => window.VTApp && window.VTApp.getState ? window.VTApp.getState() : null;
  const mxv = sym => (window.VTEngine && window.VTEngine.mxvCode ? window.VTEngine.mxvCode(sym) : '') || sym;

  // ---------- Bài tập tình huống (huấn luyện viên chấm theo vị thế mục tiêu) ----------
  // goal: vị thế mục tiêu · scenario/trend: dựng thị trường · noWorking: không để lệnh chờ thừa · exact: vượt mục tiêu là sai · quiz: câu hỏi đọc thang giá
  const LESSONS = {
    sale38: { title: '① Bán 38,4 t giá chốt → MUA 4 lot', goal: { RMF27: 4 }, exact: true, phys: ['RMF27', -38.4, 'Hợp đồng BÁN 38,4 t giá chốt'],
      brief: 'Công ty bán 38,4 t giá cố định 3.800 FOB nhưng chưa có hàng = đang thiếu hàng. Phòng hộ: MUA 4 lot LRCF27 (Robusta kỳ 01/2027). Chọn Qty 4 → Buy MKT ở đầu DOM.' },
    limit: { title: '② MUA 4 lot bằng LMT thấp hơn giá 5 USD', goal: { RMF27: 4 }, needType: 'LMT', exact: true, trend: 'down', run: true, phys: ['RMF27', -38.4, 'Hợp đồng BÁN 38,4 t giá chốt'],
      brief: 'Giá đang nhích xuống. Không mua đuổi: bấm ô cột BUY (hoặc BID) thấp hơn giá khớp 5 bậc → BUY LMT, chờ giá về khớp. Lệnh Working chưa phải đã phòng hộ.' },
    fastup: { title: '③ Giá tăng vọt sau khi ký bán – phòng hộ ngay', goal: { RMF27: 4 }, exact: true, scenario: 'fast', trend: 'up', run: true, phys: ['RMF27', -38.4, 'Hợp đồng BÁN 38,4 t giá chốt'],
      brief: 'Vừa ký bán 38,4 t giá chốt thì London tăng nhanh. Chờ giá về là đầu cơ: MUA 4 lot ngay (Buy MKT, chấp nhận trượt giá). Kết quả cho thấy chậm một nhịp tốn bao nhiêu.' },
    partial: { title: '④ Khớp từng phần – xử lý phần còn lại', goal: { RMF27: 4 }, exact: true, noWorking: true, scenario: 'partial', run: true,
      brief: 'Thị trường mỏng: lệnh 4 lot có thể chỉ khớp 2. Xem tab Working (cột Filled), chờ khớp nốt hoặc sửa giá; xong phải còn đúng +4 và không còn lệnh chờ.' },
    disconnect: { title: '⑤ Mất kết nối – KHÔNG gửi lặp', goal: { RMF27: 4 }, exact: true, scenario: 'disconnect', cash: 1000000000,
      brief: 'Gửi MUA 4 lot thì mất kết nối, lệnh hiện "In transit". Đừng bấm gửi lại – chờ kết nối hoặc gọi broker kèm Order #. Gửi lại là dư 4 lot (đầu cơ).' },
    margin: { title: '⑥ Thiếu ký quỹ: Rejected → nạp tiền → đặt lại', goal: { RMF27: 4 }, exact: true, cash: 150000000,
      brief: 'Tài khoản chỉ còn 150 triệu: MUA 4 lot sẽ bị Rejected. Đọc lý do ở tab Exceptions, bấm "+ Nạp 300 triệu", rồi đặt lại đúng 1 lần.' },
    inv100: { title: '⑦ Tồn kho 100 t → BÁN 10 lot LRCH27', goal: { RMH27: -10 }, exact: true, cash: 1200000000, trend: 'down', run: true, phys: ['RMH27', 100, 'Tồn kho 100 t mua giá cố định'],
      brief: 'Đang giữ 100 t hàng mua giá cố định, chưa có người mua = dư hàng, giá đang yếu. Chọn tab mã LRCH27, Qty 10, BÁN (Sell MKT hoặc bấm ô ASK/SELL trên giá = SELL LMT).' },
    roll: { title: '⑧ Đảo kỳ: +4 LRCF27 → LRCH27 trước FND', goal: { RMF27: 0, RMH27: 4 }, seed: [['RMF27', 'BUY', 4]], cash: 900000000, exact: true, noWorking: true,
      brief: 'Sắp tới ngày thông báo đầu tiên kỳ 01/2027, hàng giao trễ: BÁN 4 LRCF27 rồi chọn tab LRCH27 và MUA 4. Làm liền hai bước để không bị hở.' },
    unwind: { title: '⑨ Khách hủy hợp đồng → gỡ phòng hộ', goal: { RMF27: 0 }, seed: [['RMF27', 'BUY', 4]], noWorking: true, run: true,
      brief: 'Hợp đồng bán bị hủy nên 4 lot MUA phòng hộ thành lệnh "trần" (đầu cơ). Hủy lệnh chờ và đưa vị thế về 0: bấm Flatten (Ctrl+Shift+Alt+Q) hoặc Sell MKT 4.' },
    park: { title: '⑩ Soạn lệnh Parked rồi kích hoạt đúng lúc', goal: { RMF27: 4 }, exact: true, needParked: true, trend: 'down', run: true, phys: ['RMF27', -38.4, 'Hợp đồng BÁN 38,4 t giá chốt'],
      brief: 'Bật "Park", đặt sẵn BUY LMT 4 lot dưới giá 3 USD → lệnh nằm ở tab Parked (chưa lên sàn). Khi giá về gần mức đó, bấm "Activate" để gửi lệnh và chờ khớp.' },
    readbook: { title: '⑪ Đọc thang giá: phe nào đang mạnh?', goal: {}, trend: 'down', run: true,
      quiz: { q: 'Nhìn dải PHÂN TÍCH dưới thang giá (tổng BID/ASK 10 mức, giá so với VWAP, xu hướng). Phe nào đang chiếm ưu thế?', options: ['Phe MUA mạnh hơn', 'Phe BÁN mạnh hơn', 'Cân bằng'] },
      brief: 'Cho giá chạy 20–30 giây, quan sát cột BID/ASK, VOL và dải phân tích rồi trả lời. Với phòng hộ: dùng để chọn giá đặt LMT, KHÔNG dùng để đoán hướng mà bỏ phòng hộ.' }
  };
  const SCENARIOS = { normal: 'Bình thường', partial: 'Khớp từng phần (thị trường mỏng)', fast: 'Thị trường nhanh – trượt giá', reject: 'Bị từ chối (Rejected)', disconnect: 'Mất kết nối – In transit' };

  const fresh = () => ({ v: 3, acct: 'SIM-VT01', sym: 'RMF27', qty: 4, confirm: true, fast: true, park: false, otype: 'AUTO', dur: 'DAY',
    feed: 'sim', cash: 500000000, margin: 97812000, maint: 80, fee: 350000, fx: 25790, scenario: 'normal', trend: 'flat', speed: 1500,
    lesson: '', start: null, quiz: null, seq: 1, fseq: 1, mk: {}, orders: [], fills: [], log: [] });
  let s = load(); let timer = null, built = false, ticks = 0;
  const view = { center: null, sel: null, mode: 'market', selOrder: '', mod: null, tray: 'working', pending: null, tour: -1, drag: null, tkTouched: false };
  function load() { try { const x = JSON.parse(localStorage.getItem(KEY) || 'null'); return x && x.v === 3 ? { ...fresh(), ...x } : fresh(); } catch (e) { return fresh(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* trình duyệt chặn lưu – vẫn chạy bình thường */ } }
  function log(text, kind) { s.log.unshift({ at: clock(), text, kind: kind || '' }); s.log = s.log.slice(0, 80); }

  // ---------- Thị trường giả lập (mỗi mã một thang giá; khởi đầu theo giá London thật nếu có) ----------
  function liveRows() { const st = app(); return (st && st.quotes && st.quotes.coffee_liffe) || []; }
  function symbols() { const l = liveRows().map(q => q.Name).filter(n => /^RM[FHKNUX]\d\d$/.test(n)); return l.length ? l : ['RMX26', 'RMF27', 'RMH27', 'RMK27', 'RMN27']; }
  function mkt(sym) {
    if (!s.mk[sym]) {
      const q = liveRows().find(x => x.Name === sym); const last = Math.round(Number(q && q.Last) || 3450);
      s.mk[sym] = { last, bid: last, ask: last + 1, high: Math.round(Number(q && q.High) || last), low: Math.round(Number(q && q.Low) || last), open: Math.round(Number(q && q.Open) || last), tv: 0, vap: {}, hist: [last] };
    }
    return s.mk[sym];
  }
  function resync(sym) { const q = liveRows().find(x => x.Name === sym); if (!q) return false; delete s.mk[sym]; mkt(sym); view.center = null; return true; }
  // Độ sâu sổ lệnh: số lot chờ ở từng mức giá; thị trường có xu hướng thì phía thuận chiều dày hơn
  function depth(p, m) {
    const dist = p <= m.bid ? m.bid - p : p - m.ask; const h = Math.abs(Math.sin(p * 12.9898 + Math.floor(ticks / 2) * 78.233)) * 43758.5453;
    const tilt = s.trend === 'up' ? (p <= m.bid ? 1.5 : 0.75) : s.trend === 'down' ? (p <= m.bid ? 0.75 : 1.5) : 1;
    return Math.max(1, Math.round(((h - Math.floor(h)) * 24 + 4 + Math.max(0, 10 - dist * 2)) * tilt));
  }
  function step() {
    const panel = $('simulatorRoot') && $('simulatorRoot').closest('.tab-panel'); if (panel && panel.hidden) return;
    ticks += 1;
    if (s.feed === 'live') { liveStep(); s.orders.forEach(tryFill); if (ticks % 4 === 0) save(); return paint(); }
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
  function setRun(on) { clearInterval(timer); timer = on ? setInterval(step, s.feed === 'live' ? 2000 : Math.max(400, Number(s.speed) || 1500)) : null; paint(); }
  // Giá London thật: thang giá bám giá khớp RM* hệ thống đang lấy về (vài giây/lần); khối lượng tăng thêm của sàn đổ vào cột VOL
  function liveStep() {
    Object.keys(s.mk).forEach(sym => {
      const q = liveRows().find(x => x.Name === sym); if (!q) return; const m = s.mk[sym];
      const last = Math.round(Number(q.Last) || m.last), vol = Number(q.Volume) || 0;
      if (m.rv !== undefined && vol > m.rv) { m.vap[last] = (m.vap[last] || 0) + (vol - m.rv); m.tv += vol - m.rv; }
      m.rv = vol; m.last = last; m.bid = last; m.ask = last + 1;
      m.high = Math.max(Math.round(Number(q.High) || last), last); m.low = Math.min(Math.round(Number(q.Low) || last), last);
      m.hist = (m.hist || []).concat(last).slice(-30); m.liveAt = q.Time ? new Date(Number(q.Time) * 1000).toLocaleTimeString('vi-VN', { hour12: false }) : clock();
    });
  }
  function londonOpen() { try { return window.VTEngine.sessionStatus('robusta', new Date()).open; } catch (e) { return false; } }
  function setFeed(f) {
    s.feed = f;
    if (f === 'live') { Object.keys(s.mk).concat(s.sym).forEach(sym => { if (resync(sym)) { const q = liveRows().find(x => x.Name === sym); mkt(sym).rv = Number(q.Volume) || 0; } }); setRun(true);
      log(londonOpen() ? '📡 Chạy theo GIÁ LONDON THẬT: thang giá nhảy theo giá khớp trên sàn ICE (độ sâu BID/ASK vẫn là mô phỏng). Lệnh vẫn là giả lập.' : '📡 Đã chuyển sang giá London thật nhưng sàn London đang NGHỈ – giá sẽ đứng yên tới phiên sau (≈ 15:00 giờ VN). Muốn tập ngay thì dùng giá mô phỏng.', 'ok'); }
    else { setRun(false); log('🎲 Chuyển về giá MÔ PHỎNG (chạy ngẫu nhiên theo kịch bản).'); }
    save(); paint();
  }
  // Phân tích trực tiếp trên thang giá: cung cầu 10 mức, VWAP phiên, xu hướng 30 nhịp gần nhất
  function analysis(sym) {
    const m = mkt(sym); let bid = 0, ask = 0;
    for (let i = 0; i < 10; i++) { bid += depth(m.bid - i, m); ask += depth(m.ask + i, m); }
    const imb = Math.round((bid - ask) / (bid + ask) * 100);
    let pv = 0, vv = 0; Object.entries(m.vap).forEach(([p, v]) => { pv += Number(p) * v; vv += v; });
    const vwap = vv ? pv / vv : m.last; const h = m.hist || []; const chg = h.length > 1 ? m.last - h[0] : 0;
    const score = (imb > 12 ? 1 : imb < -12 ? -1 : 0) + (vv && m.last > vwap + 0.5 ? 1 : vv && m.last < vwap - 0.5 ? -1 : 0) + (chg >= 3 ? 1 : chg <= -3 ? -1 : 0);
    return { bid, ask, imb, vwap, vv, chg, n: h.length, side: score >= 2 ? 0 : score <= -2 ? 1 : 2 }; // side: 0 phe mua, 1 phe bán, 2 cân bằng
  }

  // ---------- Sổ vị thế & Account Summary (đặt tên trường như CQG) ----------
  function book() {
    const out = {};
    s.fills.forEach(f => {
      const g = out[f.sym] || (out[f.sym] = { pos: 0, avg: 0, real: 0, lots: 0, date: f.date || today() });
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
    const b = book(); let ote = 0, real = 0, mv = 0, reserve = 0, lots = 0;
    Object.entries(b).forEach(([sym, g]) => { const m = mkt(sym); ote += g.pos ? (m.last - g.avg) * LOT_T * g.pos : 0; real += g.real; mv += Math.abs(g.pos) * s.margin; lots += g.lots; });
    // Ký quỹ giữ cho lệnh chờ làm TĂNG vị thế (lệnh Parked chưa lên sàn nên không giữ)
    symbols().concat(Object.keys(b)).filter((x, i, a) => a.indexOf(x) === i).forEach(sym => {
      const pos = (b[sym] || {}).pos || 0; const w = s.orders.filter(o => o.sym === sym && LIVE.includes(o.status));
      const buys = w.filter(o => o.side === 'BUY').reduce((n, o) => n + o.qty - o.filled, 0), sells = w.filter(o => o.side === 'SELL').reduce((n, o) => n + o.qty - o.filled, 0);
      reserve += Math.max(0, Math.max(Math.abs(pos + buys), Math.abs(pos - sells)) - Math.abs(pos)) * s.margin;
    });
    const fees = lots * s.fee, pl = real * s.fx, balance = s.cash + pl - fees, oteV = ote * s.fx;
    const nlv = balance + oteV, pp = balance + oteV; // CQG: Purchasing Power = Balance + MVO + OTE (không có quyền chọn → MVO = 0)
    const maint = mv * s.maint / 100;
    return { b, balance, pl, fees, ote: oteV, nlv, pp, mv, reserve, excess: pp - mv - reserve, maint, call: mv > 0 && nlv < maint };
  }
  function increases(o) { const pos = ((book()[o.sym] || {}).pos) || 0; return o.side === 'BUY' ? pos >= 0 || o.qty > -pos : pos <= 0 || o.qty > pos; }

  // ---------- Đặt / khớp / hủy / sửa lệnh ----------
  // type: MKT · LMT · STP · STL (stop limit: chạm giá stop thì thành lệnh LMT tại giá limit) · 'AUTO' = dưới/ trên thị trường như DOMTrader
  function newOrder(side, type, price, qty, sym, opt) {
    sym = sym || s.sym; const m = mkt(sym); qty = Math.max(1, Math.round(Number(qty || s.qty) || 1)); const o2 = opt || {};
    if (type === 'AUTO') {
      const stopSide = side === 'BUY' ? price >= m.ask : price <= m.bid;
      type = stopSide ? (o2.stl || s.otype === 'STL' ? 'STL' : 'STP') : 'LMT';
    }
    const o = { id: 'SIM' + String(s.seq).padStart(5, '0'), num: s.seq++, at: clock(), date: today(), acct: s.acct, sym, side, qty, type, dur: s.dur,
      px: type === 'MKT' ? 0 : Math.round(price), stop: 0, status: 'NEW', filled: 0, avg: 0, note: '', trig: false };
    if (type === 'STL') { o.stop = Math.round(price); o.px = o.stop + (side === 'BUY' ? 2 : -2); }
    if (s.confirm && !o2.noConfirm) { view.pending = o; paint(); return; }
    send(o);
  }
  function send(o) {
    if (s.park && o.type !== 'MKT' && !o.activating) { o.status = 'PARKED'; s.orders.push(o); log(`${o.id} ${o.side} ${o.qty} ${mxv(o.sym)} ${o.type} ${desc(o)} → Parked: lệnh soạn sẵn, CHƯA lên sàn. Bấm Activate khi muốn gửi.`); save(); return paint(); }
    const a = account();
    if (s.scenario === 'reject') { o.status = 'REJECTED'; o.note = 'FCM/sàn từ chối (tài khoản chưa được phép giao dịch mã này hoặc ngoài giờ giao dịch). Đọc lý do, gọi broker – không gửi lặp.'; }
    else if (increases(o) && a.excess < s.margin * o.qty) { o.status = 'REJECTED'; o.note = `Không đủ Margin Excess: cần ${vnd(s.margin * o.qty)} đ, còn ${vnd(a.excess)} đ. Nạp thêm tiền hoặc giảm số lot.`; }
    if (o.status === 'REJECTED') { if (!s.orders.includes(o)) s.orders.push(o); log(`${o.id} ${o.side} ${o.qty} ${mxv(o.sym)} bị REJECTED – ${o.note}`, 'bad'); save(); return paint(); }
    if (!s.orders.includes(o)) s.orders.push(o);
    if (s.scenario === 'disconnect') {
      o.status = 'IN TRANSIT'; o.note = 'Mất kết nối – chưa nhận xác nhận của sàn.';
      log(`${o.id} gửi đi nhưng MẤT KẾT NỐI: trạng thái In transit (chưa rõ). Không bấm gửi lại – chờ kết nối hoặc gọi broker kèm Order #.`, 'warn');
      setTimeout(() => { if (o.status !== 'IN TRANSIT') return; o.status = 'WORKING'; o.note = ''; log(`Kết nối lại: ${o.id} thực ra ĐÃ lên sàn (Working). Nếu lúc nãy gửi lại thì giờ đã có 2 lệnh.`, 'warn'); tryFill(o); save(); paint(); }, 4000);
    } else { o.status = 'WORKING'; log(`${o.id} ${o.side} ${o.qty} ${mxv(o.sym)} ${o.type} ${desc(o)} ${o.dur} → Working (đang chờ khớp, CHƯA tính là đã phòng hộ).`); tryFill(o); }
    save(); paint();
  }
  const desc = o => (o.type === 'MKT' ? '' : o.type === 'STL' ? `stop ${px(o.stop)} / limit ${px(o.px)}` : '@' + px(o.px));
  function tryFill(o) {
    if (o.status !== 'WORKING' && o.status !== 'PARTIAL') return;
    const m = mkt(o.sym); let p = null;
    if (o.type === 'STL' && !o.trig && (o.side === 'BUY' ? m.last >= o.stop : m.last <= o.stop)) { o.trig = true; log(`${o.id} chạm giá stop ${px(o.stop)} → thành lệnh LMT @${px(o.px)}.`, 'warn'); }
    const lim = o.type === 'LMT' || (o.type === 'STL' && o.trig);
    if (o.type === 'MKT') p = o.side === 'BUY' ? m.ask : m.bid;
    else if (lim) { if (o.side === 'BUY' && m.ask <= o.px) p = Math.min(o.px, m.ask); if (o.side === 'SELL' && m.bid >= o.px) p = Math.max(o.px, m.bid); }
    else if (o.type === 'STP') { if (o.side === 'BUY' && m.last >= o.px) p = m.ask; if (o.side === 'SELL' && m.last <= o.px) p = m.bid; }
    if (p === null) return;
    if (s.scenario === 'fast' && !lim) p += (o.side === 'BUY' ? 1 : -1) * rnd(1, 4); // trượt giá
    const left = o.qty - o.filled; const q = s.scenario === 'partial' && left > 1 ? Math.ceil(left / 2) : left;
    o.avg = (o.avg * o.filled + p * q) / (o.filled + q); o.filled += q; o.lastFill = clock();
    s.fills.push({ id: 'F' + String(s.fseq++).padStart(5, '0'), oid: o.id, at: clock(), date: today(), sym: o.sym, side: o.side, qty: q, px: p });
    m.vap[p] = (m.vap[p] || 0) + q; m.tv += q;
    o.status = o.filled >= o.qty ? 'FILLED' : 'PARTIAL';
    log(o.status === 'FILLED' ? `${o.id} FILLED ${o.qty} ${mxv(o.sym)} ${o.side} giá khớp TB ${px(o.avg)}${!lim && s.scenario === 'fast' ? ' (có trượt giá)' : ''}.`
      : `${o.id} khớp một phần ${o.filled}/${o.qty} @${px(p)} – còn ${o.qty - o.filled} lot Working.`, o.status === 'FILLED' ? 'ok' : 'warn');
  }
  function cancel(o, quiet) {
    if (!o) return;
    if (o.status === 'PARKED') { o.status = 'CANCELED'; o.cxl = clock(); log(`${o.id} (Parked) đã hủy.`); save(); return paint(); }
    if (!LIVE.includes(o.status) || o.status === 'PENDING CANCEL') return;
    if (o.status === 'IN TRANSIT') { log(`${o.id} đang In transit – chưa hủy được, chờ kết nối.`, 'warn'); return paint(); }
    o.status = 'PENDING CANCEL'; if (!quiet) log(`${o.id} Cancel sent – trong lúc chờ xác nhận lệnh vẫn có thể khớp.`, 'warn'); paint();
    setTimeout(() => { if (o.status !== 'PENDING CANCEL') return; o.status = 'CANCELED'; o.cxl = clock(); log(`${o.id} Cancelled${o.filled ? ` (giữ phần đã khớp ${o.filled} lot)` : ''}.`); if (view.selOrder === o.id) view.selOrder = ''; save(); paint(); }, 600);
  }
  function modify(o, price, qty) {
    if (!o || o.type === 'MKT' || !['WORKING', 'PARTIAL', 'PARKED'].includes(o.status)) return;
    const np = price === undefined ? (o.type === 'STL' ? o.stop : o.px) : Math.round(price); const nq = qty === undefined ? o.qty : Math.max(o.filled + 1, Math.round(qty));
    const apply = () => { if (o.type === 'STL') { o.px = np + (o.px - o.stop); o.stop = np; } else o.px = np; o.qty = nq; };
    if (o.status === 'PARKED') { apply(); log(`${o.id} (Parked) sửa thành ${o.qty} lot ${desc(o)}.`); save(); return paint(); }
    const was = o.status; o.status = 'PENDING MODIFY'; log(`${o.id} Modify sent → ${nq} lot ${o.type === 'STL' ? 'stop ' : '@'}${px(np)}.`, 'warn'); paint();
    setTimeout(() => { if (o.status !== 'PENDING MODIFY') return; apply(); o.status = was; log(`${o.id} đã sửa: ${o.qty} lot ${desc(o)}.`); tryFill(o); save(); paint(); }, 600);
  }
  function activate(o) { if (!o || o.status !== 'PARKED') return; o.activating = true; o.status = 'NEW'; send(o); delete o.activating; }
  function toMarket(o) { if (!o || !['WORKING', 'PARTIAL'].includes(o.status)) return; o.type = 'MKT'; o.px = 0; log(`${o.id} chuyển thành lệnh thị trường (Go Market).`, 'warn'); tryFill(o); save(); paint(); }
  function cancelSide(side) {
    const w = s.orders.filter(o => o.sym === s.sym && (o.status === 'PARKED' || ['WORKING', 'PARTIAL'].includes(o.status)) && (!side || o.side === side));
    w.forEach(o => cancel(o, true)); log(w.length ? `${side ? (side === 'BUY' ? 'Hủy mọi lệnh MUA' : 'Hủy mọi lệnh BÁN') : 'Hủy tất cả lệnh'} ${mxv(s.sym)}: ${w.length} lệnh.` : `Không còn lệnh ${side === 'BUY' ? 'mua ' : side === 'SELL' ? 'bán ' : ''}chờ ở ${mxv(s.sym)}.`); paint();
  }
  function marketClose(side, qty) { const keep = s.confirm, kp = s.park; s.confirm = false; s.park = false; newOrder(side, 'MKT', 0, qty, s.sym); s.confirm = keep; s.park = kp; }
  function flatten() {
    cancelSide(); const pos = ((book()[s.sym] || {}).pos) || 0;
    if (!pos) { log('Flatten: ' + mxv(s.sym) + ' không có vị thế.'); return paint(); }
    marketClose(pos > 0 ? 'SELL' : 'BUY', Math.abs(pos));
    log(`Flatten ${mxv(s.sym)}: hủy lệnh chờ và ${pos > 0 ? 'BÁN' : 'MUA'} ${Math.abs(pos)} lot thị trường để về 0. Bên hàng thật lúc này bị HỞ – chỉ dùng khi đã có quyết định.`, 'warn');
  }
  function reverse() {
    const pos = ((book()[s.sym] || {}).pos) || 0;
    if (!pos) { log('Reverse: ' + mxv(s.sym) + ' không có vị thế để đảo.'); return paint(); }
    marketClose(pos > 0 ? 'SELL' : 'BUY', Math.abs(pos) * 2);
    log(`Reverse ${mxv(s.sym)}: đảo từ ${sg(pos, String)} sang ${sg(-pos, String)} lot. Doanh nghiệp phòng hộ hầu như KHÔNG dùng – đây là thao tác đầu cơ, chỉ để biết nút này nguy hiểm.`, 'bad');
  }
  function endOfDay() {
    const ex = s.orders.filter(o => o.dur === 'DAY' && ['WORKING', 'PARTIAL', 'PARKED'].includes(o.status));
    ex.forEach(o => { o.status = 'EXPIRED'; o.cxl = clock(); });
    log(ex.length ? `Hết phiên: ${ex.length} lệnh DAY hết hiệu lực (Expired). Lệnh GTC vẫn còn tới khi khớp hoặc hủy.` : 'Hết phiên: không có lệnh DAY nào đang chờ.', 'warn'); save(); paint();
  }
  function addFill(sym, side, qty, price) { s.fills.push({ id: 'F' + String(s.fseq++).padStart(5, '0'), oid: 'ĐẦU BÀI', at: clock(), date: today(), sym, side, qty, px: price }); }
  // Từng giao dịch đã đóng (vào – ra, ghép theo thứ tự FIFO): lãi/lỗ, thắng/thua
  function roundTrips() {
    const res = [], open = {};
    s.fills.forEach(f => {
      const q = open[f.sym] || (open[f.sym] = []); let left = f.qty;
      while (left > 0 && q.length && q[0].side !== f.side) {
        const o = q[0]; const n = Math.min(left, o.qty); const dir = o.side === 'BUY' ? 1 : -1;
        res.push({ sym: f.sym, side: o.side, qty: n, inPx: o.px, inAt: o.at, outPx: f.px, outAt: f.at, pl: (f.px - o.px) * dir * n * LOT_T });
        o.qty -= n; left -= n; if (!o.qty) q.shift();
      }
      if (left > 0) q.push({ side: f.side, qty: left, px: f.px, at: f.at });
    });
    return res;
  }
  const working = () => s.orders.filter(o => o.sym === s.sym && LIVE.includes(o.status) && o.type !== 'MKT');

  // ---------- Bài tập tình huống ----------
  function startLesson(id) {
    const L = LESSONS[id]; const keep = { confirm: s.confirm, fast: s.fast, speed: s.speed, margin: s.margin, maint: s.maint, fee: s.fee, fx: s.fx, qty: s.qty, dur: s.dur };
    setRun(false);
    s = { ...fresh(), ...keep, mk: s.mk, lesson: id || '' }; view.selOrder = ''; view.mod = null; view.pending = null; view.center = null; view.sel = null; view.mode = 'market';
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
  function coach() {
    const L = LESSONS[s.lesson];
    if (!L) return { ok: false, html: 'Chọn một bài tập tình huống ở trên để đánh thử – huấn luyện viên sẽ chấm. Lần đầu dùng: bấm <b>🎓 Hướng dẫn từng bước</b> ở đầu khung.' };
    const b = book(); const syms = Object.keys(L.goal);
    const miss = syms.map(sym => { const p = ((b[sym] || {}).pos) || 0; return { sym, t: L.goal[sym], p, d: L.goal[sym] - p }; }).filter(x => x.d);
    const over = L.exact ? syms.map(sym => ({ sym, p: ((b[sym] || {}).pos) || 0, t: L.goal[sym] })).filter(x => Math.abs(x.p) > Math.abs(x.t) && Math.sign(x.p || 1) === Math.sign(x.t || x.p)) : [];
    const extra = Object.entries(b).filter(([sym, g]) => g.pos && !syms.includes(sym));
    const typeOk = !L.needType || s.orders.some(o => o.type === L.needType && o.status === 'FILLED' && o.side === 'BUY');
    const parkOk = !L.needParked || s.orders.some(o => o.wasParked && o.status === 'FILLED');
    const work = s.orders.filter(o => ['WORKING', 'PARTIAL', 'IN TRANSIT', 'PENDING MODIFY', 'PARKED'].includes(o.status));
    const quizOk = !L.quiz || (s.quiz && s.quiz.ok);
    const sent = s.orders.length, rej = s.orders.filter(o => o.status === 'REJECTED').length;
    const st = s.start && mkt(s.start.sym);
    const fills = s.fills.filter(f => f.oid !== 'ĐẦU BÀI'); const lots = fills.reduce((n, f) => n + f.qty, 0);
    const avg = lots ? fills.reduce((n, f) => n + f.px * f.qty, 0) / lots : 0;
    const stats = s.start ? `<div class="dt-stats">Giá lúc bắt đầu <b>${px(s.start.px)}</b> · hiện tại <b>${px(st.last)}</b> · đã gửi <b>${sent}</b> lệnh (${rej} Rejected) · khớp <b>${lots}</b> lot${lots ? ` @TB <b>${px(Math.round(avg * 10) / 10)}</b> (lệch ${sg(Math.round((avg - s.start.px) * 10) / 10, String)} USD/t so với lúc bắt đầu)` : ''} · phí ${vnd(lots * s.fee)} đ</div>` : '';
    let hedge = '';
    if (L.phys && s.start) {
      const [psym, tons, label] = L.phys; const pm = mkt(psym); const base = s.start.sym === psym ? s.start.px : (s.start.p2 || pm.last);
      const physPl = tons * (pm.last - base); const gg = b[psym] || { pos: 0, avg: 0, real: 0 }; const futPl = gg.real + (gg.pos ? (pm.last - gg.avg) * LOT_T * gg.pos : 0);
      const totPl = physPl + futPl;
      // Đánh giá theo tỷ lệ phòng hộ (tấn trên sàn so với tấn hàng thật), không theo lời/lỗ vài USD đầu tiên
      const cover = tons < 0 ? (gg.pos * LOT_T) / -tons : (-gg.pos * LOT_T) / tons; const move = Math.abs(pm.last - base);
      const pct = Math.round(cover * 100);
      const note = cover >= 0.9 && cover <= 1.15
        ? `✅ Đã phòng hộ ${pct}% (${sg(gg.pos, String)} lot = ${Math.abs(gg.pos * LOT_T)} t cho ${Math.abs(tons)} t hàng thật). ${move < 5 ? 'Giá mới chạy ít nên khoản chênh hiện tại chủ yếu là chênh giá mua/bán lúc khớp và phí – cho giá chạy thêm để thấy hàng thật và sàn bù nhau.' : 'Giá chạy ' + px(move) + ' USD/t nhưng tổng công ty chỉ đổi ' + sg(Math.round(totPl), px) + ' USD: hàng thật và sàn bù nhau – đó là phòng hộ, không cố "thắng sàn", chỉ giữ biên lời đã tính.'}`
        : cover > 1.15 ? `⚠️ Phòng hộ ${pct}% – dư lot: phần dư là đầu cơ, giá đi ngược sẽ lỗ thêm.`
        : cover > 0.05 ? `⚠️ Mới phòng hộ ${pct}% – phần còn hở vẫn chịu rủi ro giá.`
        : `❌ Chưa phòng hộ: giá đi ngược bao nhiêu thì hàng thật mất bấy nhiêu (${Math.abs(tons)} t × biến động).`;
      hedge = `<div class="dt-hedge"><b>🛡️ Minh họa phòng hộ (giá ${px(base)} → ${px(pm.last)})</b><table class="dt-kv"><tbody>`
        + `<tr><td>Hàng thật: ${esc(label)}</td><td class="${physPl >= 0 ? 'b' : 's'}">${sg(Math.round(physPl), px)} USD</td></tr>`
        + `<tr><td>Lệnh sàn ${mxv(psym)} (đã chốt + đang mở)</td><td class="${futPl >= 0 ? 'b' : 's'}">${sg(Math.round(futPl), px)} USD</td></tr>`
        + `<tr><td><b>Tổng công ty</b></td><td class="${totPl >= 0 ? 'b' : 's'}"><b>${sg(Math.round(totPl), px)} USD</b><small>${sg(totPl * s.fx, vnd)} đ</small></td></tr></tbody></table>`
        + `<p class="dt-note">${note}</p></div>`;
    }
    const quizHtml = L.quiz ? `<div class="dt-quiz"><b>❓ ${esc(L.quiz.q)}</b><div class="dt-row">${L.quiz.options.map((o, i) => `<button type="button" data-quiz="${i}" class="${s.quiz && s.quiz.pick === i ? (s.quiz.ok ? 'right' : 'wrong') : ''}">${esc(o)}</button>`).join('')}</div>${s.quiz ? `<p class="dt-note">${s.quiz.why}</p>` : ''}</div>` : '';
    if (over.length) return { ok: false, html: `❌ <b>Vượt mục tiêu:</b> ${over.map(x => `${mxv(x.sym)} đang ${sg(x.p, String)} (cần ${sg(x.t, String)})`).join('; ')} – phần dư là <b>đầu cơ</b>, thường do gửi lặp. ${work.length ? 'Hủy lệnh chờ thừa, ' : ''}đóng bớt phần dư.` + stats + hedge + quizHtml };
    if (!miss.length && typeOk && parkOk && quizOk && !extra.length && !(L.noWorking && work.length))
      return { ok: true, html: `✅ <b>Đạt!</b> ${syms.length ? `Vị thế đúng mục tiêu (${syms.map(k => `${mxv(k)} ${sg(L.goal[k], String)}`).join(', ')}).` : ''}${work.length ? ' Còn lệnh chờ – hủy nếu không cần, tránh khớp thêm ngoài ý muốn.' : ''}` + stats + hedge + quizHtml };
    const tips = miss.map(x => `${x.d > 0 ? 'MUA' : 'BÁN'} ${Math.abs(x.d)} lot ${mxv(x.sym)} (đang ${sg(x.p, String)}, cần ${sg(x.t, String)})`);
    if (extra.length) tips.push(`đóng vị thế ngoài bài: ${extra.map(([k, g]) => `${mxv(k)} ${sg(g.pos, String)}`).join(', ')}`);
    if (!typeOk && !miss.length) tips.push('đủ lot nhưng chưa khớp bằng lệnh LMT như đề bài');
    if (!parkOk && !miss.length) tips.push('lệnh phải được soạn ở chế độ Park rồi Activate');
    if (L.noWorking && work.length && !miss.length) tips.push(`hủy ${work.length} lệnh còn chờ`);
    if (!quizOk) tips.push('trả lời câu hỏi bên dưới');
    return { ok: false, html: `Còn phải: <b>${tips.join('; ')}</b>.${work.length && !(L.noWorking && !miss.length) ? ` Đang có ${work.length} lệnh chờ/Parked – chưa được tính là đã phòng hộ.` : ''}` + stats + hedge + quizHtml };
  }
  function answerQuiz(i) {
    const L = LESSONS[s.lesson]; if (!L || !L.quiz) return;
    const a = analysis(s.sym); const ok = i === a.side; const m = mkt(s.sym);
    const read = `Tổng chờ mua ${a.bid} lot / chờ bán ${a.ask} lot (lệch ${sg(a.imb, String)}%), giá ${px(m.last)} ${a.vv ? (m.last >= a.vwap ? 'trên' : 'dưới') + ' VWAP ' + px(Math.round(a.vwap)) : '(chưa đủ khối lượng tính VWAP)'}, ${a.n} nhịp gần nhất ${sg(a.chg, String)} USD.`;
    s.quiz = { pick: i, ok, why: `${ok ? '✅ Đúng.' : `❌ Chưa đúng – số liệu cho thấy: <b>${esc(L.quiz.options[a.side])}</b>.`} ${read} Đọc 3 dấu hiệu: bên nào chờ dày hơn, giá trên hay dưới VWAP, giá đang đi lên hay xuống – càng nhiều dấu hiệu cùng chiều càng chắc. Sổ lệnh có thể bị đặt ảo, chỉ dùng để chọn giá đặt lệnh phòng hộ.` };
    log(`Trả lời câu hỏi: ${L.quiz.options[i]} → ${ok ? 'đúng' : 'chưa đúng'}.`, ok ? 'ok' : 'warn'); save(); paint();
  }

  // ---------- Hướng dẫn từng bước ----------
  const TOUR = [
    ['.dt-banner', 'Đây là sàn GIẢ LẬP', 'Mọi thao tác chỉ để học: không kết nối CQG/MXV, không có tiền thật. Bố cục, tên nút, phím làm theo tài liệu DOMTrader của CQG để lên sàn thật không bỡ ngỡ. Xem bảng "So sánh với CQG thật" ở cột bên phải.'],
    ['#dtSyms', 'Tab mã hợp đồng', 'Mỗi tab là một kỳ hạn: LRCF27 = Robusta London kỳ 01/2027 (mã MXV), RMF27 là mã trên sàn ICE. Chọn đúng kỳ tham chiếu của hợp đồng trước khi đặt lệnh.'],
    ['.dt-bar', 'Size, loại lệnh, thời hạn', 'Qty: số lot (1 lot = 10 tấn). Type: LMT/STP tự động theo vị trí bấm, hoặc STL (stop limit). Dur: DAY hết hiệu lực cuối phiên, GTC còn tới khi hủy. Fast-click: bấm 1 lần là đặt lệnh (trên CQG thật do broker bật). Xác nhận: hiện bước kiểm tra trước khi gửi. Park: soạn sẵn lệnh, chưa lên sàn.'],
    ['.dt-mktbtns', 'Buy MKT / Sell MKT (đầu DOM)', 'Như CQG: nút Buy MKT mua ngay ở giá chào bán tốt nhất, Sell MKT (bên phải) bán ngay ở giá mua tốt nhất. Khớp ngay nhưng có thể trượt giá khi thị trường chạy nhanh.'],
    ['#dtPos', 'Working orders · Position · OTE', 'Pos = số lot đang giữ (+ mua, − bán), Avg = giá vốn bình quân, OTE = lãi/lỗ đang mở theo giá hiện tại, Working = số lệnh đang chờ khớp.'],
    ['#dtLadder', 'Thang giá DOM', 'Cột: BUY · BID · PRICE · ASK · SELL · VOL. BID (xanh) = số lot người khác chờ MUA, ASK (đỏ) = chờ BÁN, ô vàng = giá vừa khớp, H/L = cao/thấp phiên, ◆ = giá vốn của bạn, VOL = khối lượng đã khớp tại giá đó.'],
    ['#dtLadder', 'Đặt lệnh trên thang', 'Fast-click: bấm ô cột BUY hoặc BID để mua, SELL hoặc ASK để bán. Dưới giá = LMT, trên giá = STP (giữ Ctrl khi bấm = STL). Hoặc KÉO ô PRICE thả vào cột BUY/SELL. Lệnh hiện thành nhãn có Order #.'],
    ['#dtLadder', 'Sửa & hủy lệnh', 'Sửa giá: KÉO nhãn lệnh sang giá mới (điện thoại: chạm nhãn rồi chạm giá mới), hoặc chọn lệnh rồi ↑/↓ và Enter. Hủy: CHUỘT PHẢI vào lệnh, bấm ×, kéo lệnh ra ngoài thang, hoặc chọn lệnh rồi Delete.'],
    ['.dt-acts', 'Nút hủy & vị thế', 'Cxl Buys / Cxl Sells / Cxl All: hủy lệnh mua / bán / tất cả của mã đang chọn. Flatten: hủy lệnh chờ và đưa vị thế về 0. Reverse: đảo vị thế (đầu cơ – doanh nghiệp phòng hộ không dùng). Center: về giá thị trường.'],
    ['#dtKeys', 'Phím mặc định của CQG', '← mua / → bán · Alt+←/→ tại best bid/offer · Shift+←/→ tại best offer/bid · Ctrl+←/→ tại giá khớp · ↑↓ PgUp PgDn chọn giá · Home/Esc về giữa · Delete hủy lệnh chọn · Ctrl+Shift+Alt+X/B/C/Q/V hủy hết/hủy mua/hủy bán/thanh lý/đảo. Bấm vào thang trước khi dùng phím.'],
    ['#dtAna', 'Phân tích trực tiếp', 'Tổng lot chờ mua/bán 10 mức gần nhất, giá so với VWAP, xu hướng 30 nhịp. Dùng để chọn giá đặt LMT, không dùng để đoán hướng mà bỏ phòng hộ.'],
    ['#dtAcct', 'Account Summary (tên như CQG)', 'Balance = tiền + lãi/lỗ đã chốt − phí · OTE = lãi/lỗ đang mở · NLV = Balance + OTE · Margin Value = ký quỹ cho vị thế · Purchasing Power = Balance + OTE · Margin Excess = Purchasing Power − Margin Value (− ký quỹ giữ cho lệnh chờ). Margin Excess không đủ → Rejected; NLV dưới mức duy trì → Margin call.'],
    ['.dt-tray', 'Khay lệnh như CQG', 'Working (đang chờ, gồm lệnh khớp một phần) · Filled · Cancelled (gồm Expired) · Exceptions (Rejected – đọc lý do) · Parked (soạn sẵn) · All · Positions. Báo broker luôn kèm Order #.'],
    ['#dtCoach', 'Đánh thử', 'Chọn bài tập tình huống: hệ thống dựng thị trường (tăng nhanh, khớp từng phần, mất kết nối, thiếu ký quỹ, Parked…) và chấm điểm. Bấm "Đánh thử ngay" để bắt đầu bài ①.']
  ];
  function tourPaint() {
    const root = $('simulatorRoot'); if (!root) return;
    root.querySelectorAll('.dt-hl').forEach(e => e.classList.remove('dt-hl'));
    let box = $('dtTour');
    if (view.tour < 0) { if (box) box.hidden = true; return; }
    const [sel, title, text] = TOUR[view.tour]; const el = root.querySelector(sel);
    if (el) { el.classList.add('dt-hl'); if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ block: phone() ? 'start' : 'center', behavior: 'smooth' }); }
    if (!box) { box = document.createElement('div'); box.id = 'dtTour'; box.className = 'dt-tour'; root.querySelector('.dt').appendChild(box); }
    box.hidden = false; const last = view.tour === TOUR.length - 1;
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

  // ---------- Bảng so sánh với CQG thật ----------
  const COMPARE = [
    ['Phần mềm', 'CQG Desktop (MXV khuyến nghị), CQG IC/QTrader: DOMTrader, HOT', 'Khung kiểu DOMTrader trong hệ thống', 'Giống bố cục & thao tác; không phải sản phẩm CQG'],
    ['Thang giá', 'Buy · Bid · Price · Ask · Sell (+ Volume tùy chọn)', 'Buy · Bid · Price · Ask · Sell · Vol', '✅ Giống'],
    ['Buy MKT / Sell MKT', 'Ở đầu DOMTrader, Sell bên phải', 'Ở đầu DOM, Sell bên phải', '✅ Giống'],
    ['Fast-click', 'Bấm cột Buy/Sell/Bid/Ask là đặt lệnh – broker (FCM) bật/tắt', 'Có, bật/tắt được', '⚠️ Tài khoản thật có thể chưa bật → dùng kéo-thả hoặc phím'],
    ['Kéo-thả', 'Kéo giá vào cột Buy/Sell; kéo lệnh sang giá mới; kéo ra ngoài để hủy', 'Có (chuột); điện thoại: chạm nhãn rồi chạm giá', '✅ Giống trên máy tính'],
    ['Hủy lệnh', 'Chuột phải vào lệnh, nút hủy mua / bán / tất cả, kéo ra ngoài', 'Chuột phải, ×, Cxl Buys / Cxl Sells / Cxl All, kéo ra ngoài, Delete', '✅ Giống'],
    ['Phím', '← → mua/bán; Alt, Shift, Ctrl+← →; ↑↓ PgUp PgDn; Home/Esc; Delete; Enter; Ctrl+Shift+Alt+X/B/C/Q/V', 'Đủ các phím mặc định này', '⚠️ CQG cho đổi phím – kiểm tra Setup → Trading Preferences → Keyboard Keys'],
    ['Loại lệnh', 'MKT, LMT, STP, STL, Trailing, Iceberg, DOM-Triggered, Bracket/OCO…', 'MKT, LMT, STP, STL', '⚠️ Phòng hộ dùng chủ yếu LMT/MKT; loại nâng cao học thêm trên demo của broker'],
    ['Thời hạn', 'DAY, GTC, GTD…', 'DAY, GTC + nút "Hết phiên"', '✅ Đủ cho phòng hộ'],
    ['Khay lệnh', 'Working, Filled, Cancelled, Exceptions, Parked, All', 'Như CQG + tab Positions', '✅ Giống'],
    ['Tài khoản', 'Balance, P/L, OTE, NLV, Margin Value, Purchasing Power, Margin Excess', 'Cùng tên trường, tiền mô phỏng', '⚠️ Số thật do thành viên MXV tính; ký quỹ/phí trong giả lập là số mẫu'],
    ['Giá & khớp lệnh', 'Giá thật; LMT khớp theo hàng đợi, chạm giá chưa chắc khớp', 'Giá đầu theo London thật rồi chạy mô phỏng; chạm giá là khớp', '⚠️ Thực tế khó khớp hơn – đừng giả định chắc khớp'],
    ['Đăng nhập & giờ', 'Tài khoản thành viên MXV, 2 lớp bảo mật; chỉ khớp trong giờ sàn (London ≈ 15:00–23:30 giờ VN mùa hè, 16:00–00:30 mùa đông)', 'Không cần đăng nhập; chạy mọi lúc', '⚠️ Ngoài giờ trên sàn thật lệnh không khớp / bị từ chối'],
    ['Mã hợp đồng', 'Mã hiển thị theo thành viên (vd LRC… cho Robusta ICE châu Âu)', 'Hiện LRCF27 kèm mã ICE RMF27', '⚠️ Đối chiếu mã khi đăng nhập thật'],
    ['Nguồn giá', 'Giá khớp real-time + độ sâu thật của sàn ICE', 'Chọn: mô phỏng theo kịch bản, hoặc 📡 bám giá khớp London thật (độ sâu vẫn mô phỏng)', '⚠️ Ngoài giờ sàn giá London đứng yên'],
    ['API (học sau)', 'CQG WebAPI / FIX API: giá, lệnh, Execution Report với trạng thái New, Partially filled, Filled, Canceled, Rejected…', 'Trạng thái lệnh ghi kèm mã FIX OrdStatus (rê chuột vào trạng thái)', '⚠️ Cần broker cấp quyền API + tài khoản demo; khóa API chỉ để trên máy chủ']
  ];
  const COMPARE_SRC = [['Placing Orders on DOMTrader', 'https://help.cqg.com/cqgic/25/Documents/placingordersondomtrader.htm'], ['Modifying and Cancelling Orders', 'https://help.cqg.com/cqgic/25/Documents/modifyingandcancellingordersondomtraderandsplitdomtrader.htm'],
    ['Keyboard Keys Preferences', 'https://help.cqg.com/cqgic/24/Documents/keyboardkeyspreferences.htm'], ['Orders and Positions', 'https://help.cqg.com/cqgic/24/Documents/ordersandpositionsorderpane.htm'],
    ['Account Summary', 'https://help.cqg.com/cqgic/25/Documents/ordersandpositionssummarypane.htm'], ['HOT', 'https://help.cqg.com/cqgic/24/Documents/hybridordertickethot.htm']];

  // ---------- Giao diện ----------
  function build() {
    const root = $('simulatorRoot'); if (!root) return;
    root.innerHTML = `<div class="dt">
      <div class="dt-banner"><span><b>SIMULATION</b> · Sàn giả lập kiểu CQG DOMTrader để đào tạo – không kết nối CQG/MXV, không gửi lệnh thật, không có tiền thật.</span><button type="button" class="dt-tourbtn" data-tour="start">🎓 Hướng dẫn từng bước</button></div>
      <div class="dt-grid">
        <section class="dt-win">
          <div class="dt-syms" id="dtSyms" role="tablist" aria-label="Mã hợp đồng"></div>
          <div class="dt-title"><span class="dt-acct" id="dtAcctName"></span><span class="dt-clock" id="dtLast"></span></div>
          <div class="dt-bar">
            <span class="dt-lbl">Qty</span><div class="dt-qtys" id="dtQtys">${[1, 2, 4, 5, 10].map(q => `<button type="button" data-qty="${q}">${q}</button>`).join('')}</div>
            <input id="dtQty" class="dt-in" type="number" min="1" max="99" inputmode="numeric" aria-label="Số lot">
            <select id="dtType" class="dt-sel" aria-label="Loại lệnh"><option value="AUTO">LMT/STP</option><option value="STL">STL</option></select>
            <select id="dtDur" class="dt-sel" aria-label="Thời hạn lệnh"><option>DAY</option><option>GTC</option></select>
            <span class="dt-chks"><label class="dt-chk"><input type="checkbox" id="dtFast"> Fast-click</label><label class="dt-chk"><input type="checkbox" id="dtConfirmOn"> Xác nhận</label><label class="dt-chk"><input type="checkbox" id="dtPark"> Park</label></span>
          </div>
          <div class="dt-mktbtns"><button type="button" class="dt-bmkt" data-act="bmkt">Buy MKT</button><span id="dtTypeInd" class="dt-typeind"></span><button type="button" class="dt-smkt" data-act="smkt">Sell MKT</button></div>
          <div class="dt-posbar" id="dtPos"></div>
          <div class="dt-ladder" id="dtLadder" tabindex="0" aria-label="Thang giá DOM – bấm ô để đặt lệnh, dùng phím khi đang chọn">
            <table><thead><tr><th class="c-buy" title="Lệnh MUA của bạn – bấm để đặt lệnh mua">BUY</th><th class="c-bid" title="Số lot đang chờ mua (Bid) – bấm để đặt lệnh mua">BID</th><th class="c-px" title="Kéo ô giá thả vào cột BUY/SELL để đặt lệnh">PRICE</th><th class="c-ask" title="Số lot đang chờ bán (Ask/Offer) – bấm để đặt lệnh bán">ASK</th><th class="c-sell" title="Lệnh BÁN của bạn – bấm để đặt lệnh bán">SELL</th><th class="c-vol" title="Khối lượng đã khớp tại từng giá trong phiên">VOL</th></tr></thead>
            <tbody id="dtRows"></tbody></table></div>
          <div class="dt-acts"><button type="button" data-act="cxlb">Cxl Buys</button><button type="button" data-act="cxl">Cxl All</button><button type="button" data-act="cxls">Cxl Sells</button>
            <button type="button" data-act="flat">Flatten</button><button type="button" data-act="rev">Reverse</button><button type="button" data-act="center" title="Về giá thị trường (Home/Esc)">Center</button>
            <button type="button" data-act="up" title="Cuộn lên">▲</button><button type="button" data-act="down" title="Cuộn xuống">▼</button><button type="button" data-act="run" class="dt-run">▶ Chạy giá</button><button type="button" data-act="feed" class="dt-feed">📡 Giá thật</button></div>
          <div class="dt-ana" id="dtAna"></div>
          <div class="dt-mode" id="dtMode"></div>
          <div class="dt-confirm" id="dtConfirm" hidden></div>
        </section>
        <aside class="dt-side">
          <div class="dt-card" id="dtAcct"></div>
          <div class="dt-card" id="dtCoach"></div>
          <div class="dt-card"><h4>Order Ticket <small>phiếu lệnh</small></h4>
            <div class="dt-tk"><select id="tkSide" class="dt-sel"><option>BUY</option><option>SELL</option></select><select id="tkType" class="dt-sel"><option value="LMT">LMT</option><option value="MKT">MKT</option><option value="STP">STP</option><option value="STL">STL</option></select>
              <input id="tkPx" class="dt-in" type="number" inputmode="numeric" aria-label="Giá"><button type="button" class="dt-send" data-act="ticket">Place</button></div>
            <p class="dt-note">Số lot, mã, thời hạn (DAY/GTC) và Park lấy theo thanh trên cùng. LMT = giá giới hạn · MKT = khớp ngay giá tốt nhất · STP = kích hoạt khi giá chạm · STL = chạm giá stop thì thành LMT (limit lệch 2 USD).</p></div>
          <details class="dt-card" id="dtCompare"><summary>📋 So sánh với CQG thật – lên sàn thật cần chú ý</summary>
            <div class="table-scroll"><table class="dt-cmp"><thead><tr><th>Hạng mục</th><th>CQG thật</th><th>Sàn giả lập</th><th>Ghi chú</th></tr></thead><tbody>
            ${COMPARE.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table></div>
            <p class="dt-note">Nguồn: tài liệu CQG – ${COMPARE_SRC.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}. Trước khi đánh thật: tập lại trên tài khoản demo do thành viên MXV cấp.</p></details>
          <details class="dt-card" id="dtKeys"><summary>⌨️ Phím & cột – đọc hiểu (mặc định của CQG)</summary>
            <table class="dt-help"><tbody>
              <tr><td><kbd>←</kbd> / <kbd>→</kbd></td><td>Market mode: MUA / BÁN thị trường · đang chọn giá: đặt lệnh tại giá đó</td></tr>
              <tr><td><kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd></td><td>MUA tại best bid / BÁN tại best offer (LMT)</td></tr>
              <tr><td><kbd>Shift</kbd>+<kbd>←</kbd>/<kbd>→</kbd></td><td>MUA tại best offer / BÁN tại best bid (LMT – khớp ngay)</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>←</kbd>/<kbd>→</kbd></td><td>MUA / BÁN LMT tại giá khớp gần nhất</td></tr>
              <tr><td><kbd>↑</kbd><kbd>↓</kbd> <kbd>PgUp</kbd><kbd>PgDn</kbd></td><td>Chọn giá trên thang · nếu đang chọn lệnh: dời giá lệnh, <kbd>Enter</kbd> để gửi sửa</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>1</kbd> / <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>1</kbd></td><td>Chọn giá trên best ask 1 bậc / dưới best bid 1 bậc</td></tr>
              <tr><td><kbd>Home</kbd> / <kbd>Esc</kbd></td><td>Đưa thang về giữa giá thị trường, về Market mode</td></tr>
              <tr><td><kbd>Delete</kbd></td><td>Hủy lệnh đang chọn · số <kbd>0-9</kbd> rồi <kbd>Enter</kbd>: đổi số lot lệnh đang chọn</td></tr>
              <tr><td><kbd>Alt</kbd>+<kbd>B</kbd> / <kbd>Alt</kbd>+<kbd>A</kbd></td><td>Dời lệnh đang chọn về best bid / best offer · <kbd>Alt</kbd>+<kbd>Home</kbd>: chuyển thành lệnh thị trường</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>N</kbd> · <kbd>Alt</kbd>+<kbd>↑</kbd><kbd>↓</kbd></td><td>Chọn lệnh mới nhất · chuyển qua lại giữa các lệnh</td></tr>
              <tr><td><kbd>Space</kbd></td><td>Xem chi tiết lệnh đang chọn</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Alt</kbd>+…</td><td><kbd>X</kbd> hủy hết · <kbd>B</kbd> hủy lệnh mua · <kbd>C</kbd> hủy lệnh bán · <kbd>Q</kbd> thanh lý vị thế · <kbd>V</kbd> đảo vị thế</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>Home</kbd></td><td>Center – đưa thang về giá thị trường</td></tr>
            </tbody></table>
            <ul class="dt-legend"><li><b>Chuột:</b> bấm ô BUY/BID = mua, SELL/ASK = bán (dưới giá = LMT, trên giá = STP, giữ <kbd>Ctrl</kbd> = STL) · kéo ô PRICE vào cột BUY/SELL · kéo nhãn lệnh sang giá mới để sửa, ra ngoài để hủy · chuột phải vào lệnh để hủy.</li>
              <li><b>BID</b> (xanh) lot chờ mua · <b>ASK</b> (đỏ) lot chờ bán · ô vàng = giá khớp gần nhất · <b>H</b>/<b>L</b> cao/thấp phiên · ◆ giá vốn · <b>VOL</b> khối lượng khớp tại giá.</li>
              <li>Phím chỉ tác động khi thang giá đang được chọn (bấm vào thang trước) – giống CQG chỉ tác động cửa sổ đang focus.</li></ul></details>
          <details class="dt-card" id="dtSet"><summary>⚙️ Thông số giả lập</summary>
            <div class="dt-form">
              <label>Kịch bản<select id="setScn" class="dt-sel">${Object.entries(SCENARIOS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
              <label>Tốc độ giá<select id="setSpeed" class="dt-sel"><option value="2500">Chậm</option><option value="1500">Vừa</option><option value="700">Nhanh</option></select></label>
              <label>Ký quỹ ban đầu / lot (đ)<input id="setMargin" class="dt-in" type="number" inputmode="numeric"></label>
              <label>Ký quỹ duy trì (% ban đầu)<input id="setMaint" class="dt-in" type="number" inputmode="numeric"></label>
              <label>Phí / lot / chiều (đ)<input id="setFee" class="dt-in" type="number" inputmode="numeric"></label>
              <label>Tỷ giá USD (đ)<input id="setFx" class="dt-in" type="number" inputmode="numeric"></label>
            </div>
            <p class="dt-note">Ký quỹ, phí là <b>số mẫu</b> – sửa theo bảng ký quỹ MXV và biểu phí của thành viên kinh doanh hiện hành.</p>
            <div class="dt-row"><button type="button" class="dt-btn" data-act="eod">⏭ Hết phiên (DAY hết hiệu lực)</button><button type="button" class="dt-btn" data-act="sync">↺ Lấy giá London thật</button><button type="button" class="dt-btn" data-act="reset">🗑 Xóa toàn bộ dữ liệu giả lập</button></div></details>
        </aside>
      </div>
      <div class="dt-tray"><div class="dt-tabs" id="dtTabs">${[['working', 'Working'], ['filled', 'Filled'], ['cancelled', 'Cancelled'], ['exceptions', 'Exceptions'], ['parked', 'Parked'], ['all', 'All'], ['positions', 'Positions'], ['trades', 'Trades thắng/thua']].map(([k, l]) => `<button type="button" data-tray="${k}">${l}<span></span></button>`).join('')}</div>
        <div class="table-scroll dt-trayscroll"><table class="dt-orders" id="dtTray"></table></div></div>
      <details class="dt-log" open><summary>Nhật ký & giải thích trạng thái</summary><div id="dtLog"></div></details>
    </div>`;
    built = true; bind();
  }
  function rowsHtml() {
    const m = mkt(s.sym); const N = phone() ? 9 : 12; if (view.center === null) view.center = m.last;
    const c = view.center; const avg = ((book()[s.sym] || {}).avg) || 0; const work = working().concat(s.orders.filter(o => o.sym === s.sym && o.status === 'PARKED'));
    let maxV = 1; for (let p = c - N; p <= c + N; p++) maxV = Math.max(maxV, m.vap[p] || 0);
    const lvl = o => (o.type === 'STL' ? o.stop : o.px);
    const chip = o => `<span class="dt-chip ${o.side === 'BUY' ? 'b' : 's'}${view.selOrder === o.id ? ' on' : ''}${o.status.startsWith('PENDING') || o.status === 'IN TRANSIT' ? ' pend' : ''}${o.status === 'PARKED' ? ' park' : ''}" data-oid="${o.id}" title="#${o.num} ${o.type} ${o.dur} ${STATUS[o.status]} – kéo sang giá mới để sửa, chuột phải để hủy"><b>${o.qty - o.filled}${o.type === 'LMT' ? '' : ' ' + o.type}${o.status === 'PARKED' ? ' P' : ''}</b><i data-cx="${o.id}" title="Hủy lệnh">×</i></span>`;
    const ghost = view.mod && s.orders.find(o => o.id === view.mod.id);
    const out = [];
    for (let p = c + N; p >= c - N; p--) {
      const buys = work.filter(o => o.side === 'BUY' && lvl(o) === p), sells = work.filter(o => o.side === 'SELL' && lvl(o) === p);
      const g = ghost && view.mod.px === p ? `<span class="dt-chip ghost ${ghost.side === 'BUY' ? 'b' : 's'}"><b>${view.mod.qty} ⇢</b></span>` : '';
      const cls = [p === m.last ? 'last' : '', view.mode === 'browse' && view.sel === p ? 'sel' : '', p === m.bid ? 'bb' : '', p === m.ask ? 'ba' : '', view.drag && view.drag.over === p ? 'dropt' : ''].join(' ');
      const mk = (p === m.high ? '<em class="h">H</em>' : '') + (p === m.low ? '<em class="l">L</em>' : '') + (avg && Math.round(avg) === p ? '<em class="a" title="Giá vốn TB">◆</em>' : '');
      const v = m.vap[p] || 0;
      out.push(`<tr class="${cls}" data-p="${p}"><td class="c-buy" data-col="BUY" data-p="${p}">${buys.map(chip).join('')}${ghost && ghost.side === 'BUY' ? g : ''}</td>`
        + `<td class="c-bid" data-col="BUY" data-p="${p}">${p <= m.bid ? depth(p, m) : ''}</td><td class="c-px" data-px="${p}">${mk}${px(p)}</td><td class="c-ask" data-col="SELL" data-p="${p}">${p >= m.ask ? depth(p, m) : ''}</td>`
        + `<td class="c-sell" data-col="SELL" data-p="${p}">${sells.map(chip).join('')}${ghost && ghost.side === 'SELL' ? g : ''}</td><td class="c-vol">${v ? `<span style="width:${Math.round(v / maxV * 100)}%"></span><b>${v}</b>` : ''}</td></tr>`);
    }
    return out.join('');
  }
  function trayHtml() {
    const t = view.tray;
    if (t === 'positions') {
      const rows = Object.entries(book()).filter(([, g]) => g.pos || g.real).map(([sym, g]) => { const m = mkt(sym); const ote = g.pos ? (m.last - g.avg) * LOT_T * g.pos : 0;
        return `<tr><td>${g.date}</td><td>${esc(s.acct)}</td><td>${mxv(sym)}<small>${sym}</small></td><td class="b">${g.pos > 0 ? g.pos : ''}</td><td class="s">${g.pos < 0 ? -g.pos : ''}</td><td>${g.pos ? px(Math.round(g.avg * 10) / 10) : '—'}</td><td>${px(m.last)}</td><td class="${ote >= 0 ? 'b' : 's'}">${sg(ote, px)}<small>${sg(ote * s.fx, vnd)} đ</small></td><td>${sg(g.real, px)}</td><td>USD</td></tr>`; }).join('');
      return `<thead><tr><th>Date</th><th>Account</th><th>Symbol</th><th>Long</th><th>Short</th><th>Avg Price</th><th>Last</th><th>OTE</th><th>P/L</th><th>Currency</th></tr></thead><tbody>${rows || '<tr><td colspan="10" class="dt-empty">Chưa có vị thế.</td></tr>'}</tbody>`;
    }
    if (t === 'trades') {
      const tr = roundTrips(); const win = tr.filter(x => x.pl > 0), loss = tr.filter(x => x.pl < 0); const tot = tr.reduce((n, x) => n + x.pl, 0);
      const a = account(); const oteUsd = a.ote / s.fx;
      const rows = tr.slice().reverse().map(x => `<tr><td>${mxv(x.sym)}</td><td class="${x.side === 'BUY' ? 'b' : 's'}">${x.side === 'BUY' ? 'Long (mua trước)' : 'Short (bán trước)'}</td><td>${x.qty}</td><td>${px(x.inPx)}<small>${x.inAt}</small></td><td>${px(x.outPx)}<small>${x.outAt}</small></td><td class="${x.pl >= 0 ? 'b' : 's'}">${sg(x.pl, px)}<small>${sg(x.pl * s.fx, vnd)} đ</small></td><td>${x.pl > 0 ? '🟢 Thắng' : x.pl < 0 ? '🔴 Thua' : '⚪ Hòa'}</td></tr>`).join('');
      const sum = `${tr.length} giao dịch đóng · 🟢 thắng ${win.length} · 🔴 thua ${loss.length}${tr.length ? ` · tỷ lệ thắng ${Math.round(win.length / tr.length * 100)}%` : ''} · tổng P/L <b class="${tot >= 0 ? 'b' : 's'}">${sg(tot, px)} USD (${sg(tot * s.fx, vnd)} đ)</b>`
        + `${win.length ? ` · lời TB ${px(Math.round(win.reduce((n, x) => n + x.pl, 0) / win.length))}` : ''}${loss.length ? ` · lỗ TB ${px(Math.round(Math.abs(loss.reduce((n, x) => n + x.pl, 0)) / loss.length))}` : ''} · vị thế đang mở OTE ${sg(Math.round(oteUsd), px)} USD · phí ${vnd(a.fees)} đ`;
      return `<thead><tr><th>Symbol</th><th>Chiều</th><th>Lot</th><th>Vào lệnh</th><th>Ra lệnh</th><th>P/L (USD)</th><th>Kết quả</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="dt-empty">Chưa có giao dịch đóng. Mua rồi bán lại (hoặc ngược lại) sẽ hiện kết quả thắng/thua ở đây.</td></tr>'}</tbody><tfoot><tr><td colspan="7" class="dt-sum">${sum}</td></tr></tfoot>`;
    }
    const pick = { working: o => LIVE.includes(o.status), filled: o => o.filled > 0, cancelled: o => o.status === 'CANCELED' || o.status === 'EXPIRED', exceptions: o => o.status === 'REJECTED', parked: o => o.status === 'PARKED', all: () => true }[t] || (() => true);
    const list = s.orders.filter(pick).slice().reverse();
    const body = list.map(o => `<tr class="${view.selOrder === o.id ? 'on' : ''}"><td><span class="dt-st st-${o.status.replace(/ /g, '-').toLowerCase()}" title="FIX OrdStatus: ${esc(FIX[o.status] || '')}">${STATUS[o.status] || o.status}</span>${o.note ? `<small>${esc(o.note)}</small>` : ''}</td><td>${esc(o.acct)}</td><td class="${o.side === 'BUY' ? 'b' : 's'}">${o.side === 'BUY' ? 'Buy' : 'Sell'}</td><td>${o.qty}</td><td>${mxv(o.sym)}</td>`
      + `<td>${o.type}/${o.dur}</td><td>${o.type === 'MKT' ? 'MKT' : o.type === 'STL' ? `${px(o.stop)} / ${px(o.px)}` : px(o.px)}</td><td>${o.filled}</td><td>${o.filled ? px(Math.round(o.avg * 10) / 10) : '—'}</td><td>${o.at}</td><td>#${o.num}</td>`
      + `<td>${o.status === 'PARKED' ? `<button type="button" data-actv="${o.id}">Activate</button>` : ''}${['WORKING', 'PARTIAL', 'PARKED'].includes(o.status) && o.type !== 'MKT' ? `<button type="button" data-mod="${o.id}">Modify</button>` : ''}${['WORKING', 'PARTIAL', 'PARKED'].includes(o.status) ? `<button type="button" data-cxl="${o.id}">Cancel</button>` : ''}</td></tr>`).join('');
    return `<thead><tr><th>Status</th><th>Account</th><th>B/S</th><th>Size</th><th>Symbol</th><th>Type/Dur</th><th>Price</th><th>Filled</th><th>Avg Fill Price</th><th>Place Time</th><th>Order #</th><th></th></tr></thead><tbody>${body || `<tr><td colspan="12" class="dt-empty">Không có lệnh ở mục này.</td></tr>`}</tbody>`;
  }
  function paint() {
    const root = $('simulatorRoot'); if (!root) return; if (!built || !root.querySelector('.dt')) build();
    const m = mkt(s.sym); const a = account(); const g = a.b[s.sym] || { pos: 0, avg: 0 }; const ote = g.pos ? (m.last - g.avg) * LOT_T * g.pos : 0;
    $('dtSyms').innerHTML = symbols().map(x => `<button type="button" role="tab" data-sym="${x}" class="${x === s.sym ? 'on' : ''}">${mxv(x)}<small>${x}</small></button>`).join('');
    $('dtAcctName').innerHTML = `${esc(s.acct)} · DEMO · ${s.feed === 'live' ? `<b class="dt-live">📡 LIVE London${m.liveAt ? ' ' + m.liveAt : ''}${londonOpen() ? '' : ' · sàn nghỉ'}</b>` : '🎲 giá mô phỏng'}`;
    $('dtLast').innerHTML = `<b class="${m.last >= m.open ? 'up' : 'dn'}">${px(m.last)}</b> <small>${sg(m.last - m.open, px)} · H ${px(m.high)} · L ${px(m.low)} · Vol ${px(m.tv)}</small>`;
    if (document.activeElement !== $('dtQty')) $('dtQty').value = s.qty;
    $('dtQtys').querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.qty) === s.qty));
    $('dtConfirmOn').checked = !!s.confirm; $('dtFast').checked = !!s.fast; $('dtPark').checked = !!s.park;
    if (document.activeElement !== $('dtType')) $('dtType').value = s.otype; if (document.activeElement !== $('dtDur')) $('dtDur').value = s.dur;
    $('dtTypeInd').textContent = `${s.qty} lot · ${s.otype === 'STL' ? 'STL' : 'LMT/STP'} · ${s.dur}${s.park ? ' · PARK' : ''}${s.fast ? '' : ' · fast-click tắt'}`;
    $('dtPos').innerHTML = `<span>Working <b>${working().length}</b></span><span>Pos <b class="${g.pos > 0 ? 'b' : g.pos < 0 ? 's' : ''}">${sg(g.pos, String)}</b></span><span>Avg <b>${g.pos ? px(Math.round(g.avg * 10) / 10) : '—'}</b></span>`
      + `<span>OTE <b class="${ote > 0 ? 'b' : ote < 0 ? 's' : ''}">${sg(ote, px)} USD</b></span>`;
    $('dtRows').innerHTML = rowsHtml();
    const selO = s.orders.find(o => o.id === view.selOrder);
    $('dtMode').innerHTML = selO ? `Đang chọn lệnh <b>#${selO.num}</b> ${selO.side} ${selO.qty - selO.filled} ${selO.type} ${desc(selO)} – <kbd>↑</kbd><kbd>↓</kbd> dời giá, số + <kbd>Enter</kbd> đổi lot, <kbd>Delete</kbd> hủy, <kbd>Esc</kbd> bỏ chọn${view.mod ? ` · sửa chờ gửi: ${view.mod.qty} lot @${px(view.mod.px)} (<kbd>Enter</kbd>)` : ''}`
      : view.mode === 'browse' && view.sel !== null ? `Chế độ <b>Price-browse</b> @ ${px(view.sel)} – <kbd>←</kbd> MUA / <kbd>→</kbd> BÁN tại giá này · <kbd>Esc</kbd> về Market`
      : `Chế độ <b>Market</b> – <kbd>←</kbd> Buy / <kbd>→</kbd> Sell thị trường (bấm vào thang giá để dùng phím) · ${timer ? '▶ giá đang chạy' : '⏸ giá đứng'}`;
    const c = $('dtConfirm'); const o = view.pending; c.hidden = !o;
    if (o) c.innerHTML = `<div><b>Order confirmation:</b> <span class="${o.side === 'BUY' ? 'b' : 's'}">${o.side === 'BUY' ? 'Buy' : 'Sell'}</span> ${o.qty} ${mxv(o.sym)} ${o.type} ${desc(o)} ${o.dur}${s.park && o.type !== 'MKT' ? ' (Park)' : ''}<small>${o.type === 'STP' ? 'STP: chỉ kích hoạt khi giá chạm mức này rồi khớp như lệnh thị trường.' : o.type === 'STL' ? 'STL: chạm giá stop thì thành lệnh LMT tại giá limit – có thể không khớp nếu giá chạy qua.' : o.type === 'MKT' ? 'MKT: khớp ngay ở giá tốt nhất đang có – có thể trượt giá.' : 'LMT: chỉ khớp tại giá này hoặc tốt hơn – có thể không khớp.'}</small></div><div class="dt-row"><button type="button" class="${o.side === 'BUY' ? 'dt-bmkt' : 'dt-smkt'}" data-act="ok">OK – gửi lệnh</button><button type="button" data-act="no">Cancel</button></div>`;
    $('dtAcct').innerHTML = `<h4>Account Summary <small>${esc(s.acct)} · tiền mô phỏng (VND)</small></h4><table class="dt-kv"><tbody>
      <tr><td>Balance <small>tiền nạp + P/L − phí</small></td><td>${vnd(a.balance)}</td></tr>
      <tr><td>P/L <small>lãi/lỗ đã chốt</small></td><td class="${a.pl >= 0 ? 'b' : 's'}">${sg(a.pl, vnd)}</td></tr>
      <tr><td>OTE <small>lãi/lỗ đang mở</small></td><td class="${a.ote >= 0 ? 'b' : 's'}">${sg(a.ote, vnd)}</td></tr>
      <tr><td>OTE+P/L</td><td>${sg(a.ote + a.pl, vnd)}</td></tr>
      <tr><td>NLV <small>giá trị tài khoản</small></td><td><b>${vnd(a.nlv)}</b></td></tr>
      <tr><td>Margin Value <small>ký quỹ ban đầu cho vị thế</small></td><td>${vnd(a.mv)}</td></tr>
      <tr><td>Maintenance <small>mức duy trì ${s.maint}%</small></td><td>${vnd(a.maint)}</td></tr>
      <tr><td>Purchasing Power <small>Balance + OTE</small></td><td>${vnd(a.pp)}</td></tr>
      <tr><td>Margin Excess <small>còn đặt lệnh được (đã trừ lệnh chờ ${vnd(a.reserve)})</small></td><td class="${a.excess >= 0 ? '' : 's'}"><b>${vnd(a.excess)}</b> <small>≈ ${Math.max(0, Math.floor(a.excess / s.margin))} lot</small></td></tr>
      <tr><td>Phí đã trả</td><td>${vnd(a.fees)}</td></tr></tbody></table>${a.call ? '<div class="dt-call">⚠️ MARGIN CALL: NLV dưới mức ký quỹ duy trì – phải nộp thêm tiền hoặc giảm vị thế.</div>' : ''}
      <div class="dt-row"><button type="button" class="dt-btn" data-act="dep">+ Nạp 300 triệu</button></div>`;
    // Phân tích trực tiếp
    const an = analysis(s.sym); const L0 = LESSONS[s.lesson]; const hide = L0 && L0.quiz && !(s.quiz && s.quiz.ok);
    const verdict = an.side === 0 ? '🟢 <b>Phe MUA đang chiếm ưu thế</b>' : an.side === 1 ? '🔴 <b>Phe BÁN đang chiếm ưu thế</b>' : '⚪ <b>Hai phe cân bằng</b>';
    const why = [an.imb > 12 ? 'bên chờ mua dày hơn' : an.imb < -12 ? 'bên chờ bán dày hơn' : 'chờ mua ≈ chờ bán', an.vv ? (m.last > an.vwap + 0.5 ? 'giá trên VWAP' : m.last < an.vwap - 0.5 ? 'giá dưới VWAP' : 'giá quanh VWAP') : 'chưa đủ khối lượng tính VWAP', an.chg >= 3 ? 'giá đang đi lên' : an.chg <= -3 ? 'giá đang đi xuống' : 'giá đi ngang'];
    $('dtAna').innerHTML = `<div class="dt-ana-h">📊 PHÂN TÍCH TRỰC TIẾP · ${mxv(s.sym)}</div><div class="dt-ana-g">`
      + `<div><small>Chờ mua 10 mức</small><b class="b">${an.bid}</b></div><div><small>Chờ bán 10 mức</small><b class="s">${an.ask}</b></div>`
      + `<div><small>Lệch cung cầu</small><b class="${an.imb > 0 ? 'b' : an.imb < 0 ? 's' : ''}">${sg(an.imb, String)}%</b></div>`
      + `<div><small>VWAP phiên</small><b>${an.vv ? px(Math.round(an.vwap)) : '—'}</b></div><div><small>${an.n} nhịp gần nhất</small><b class="${an.chg > 0 ? 'b' : an.chg < 0 ? 's' : ''}">${sg(an.chg, String)}</b></div></div>`
      + `<div class="dt-ana-bar" title="Tỷ lệ chờ mua / chờ bán"><span style="width:${Math.round(an.bid / (an.bid + an.ask) * 100)}%"></span></div>`
      + `<p>${hide ? '🔒 Kết luận ẩn trong bài đọc thang giá – tự đọc 3 dấu hiệu rồi trả lời câu hỏi ở khung Bài tập.' : `${verdict}: ${why.join(' · ')}. Phòng hộ: dùng để chọn giá đặt LMT, không đoán hướng.`}</p>`;
    const ch = coach();
    $('dtCoach').innerHTML = `<h4>🎯 Bài tập tình huống</h4><select id="dtLesson" class="dt-sel dt-wide"><option value="">Tập tự do</option>${Object.entries(LESSONS).map(([k, L]) => `<option value="${k}"${k === s.lesson ? ' selected' : ''}>${esc(L.title)}</option>`).join('')}</select>`
      + (LESSONS[s.lesson] ? `<p class="dt-brief">${esc(LESSONS[s.lesson].brief)}</p>` : '') + `<div class="dt-coach ${ch.ok ? 'ok' : ''}">${ch.html}</div>`;
    if (document.activeElement !== $('tkPx') && (!$('tkPx').value || !view.tkTouched)) $('tkPx').value = m.last;
    $('dtTabs').querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', b.dataset.tray === view.tray);
      const n = b.dataset.tray === 'working' ? s.orders.filter(o => LIVE.includes(o.status)).length : b.dataset.tray === 'exceptions' ? s.orders.filter(o => o.status === 'REJECTED').length : b.dataset.tray === 'parked' ? s.orders.filter(o => o.status === 'PARKED').length : 0;
      b.querySelector('span').textContent = n ? ` ${n}` : '';
    });
    $('dtTray').innerHTML = trayHtml();
    $('dtLog').innerHTML = s.log.map(x => `<p class="${x.kind}"><time>${x.at}</time> ${esc(x.text)}</p>`).join('') || '<p>Chưa có thao tác. Bấm ▶ Chạy giá hoặc chọn một bài tập để bắt đầu.</p>';
    let toured = false; try { toured = !!localStorage.getItem('vt_dom_tour'); } catch (e) { /* bỏ qua */ }
    const tb = root.querySelector('.dt-tourbtn'); if (tb) tb.classList.toggle('pulse', !toured && view.tour < 0);
    const run = root.querySelector('[data-act="run"]'); if (run) run.textContent = timer ? '⏸ Dừng giá' : '▶ Chạy giá';
    const fd = root.querySelector('[data-act="feed"]'); if (fd) { fd.textContent = s.feed === 'live' ? '🎲 Về mô phỏng' : '📡 Giá thật'; fd.classList.toggle('on', s.feed === 'live'); }
    const setScn = $('setScn'); if (setScn && document.activeElement !== setScn) setScn.value = s.scenario;
    const sp = $('setSpeed'); if (sp && document.activeElement !== sp) sp.value = String(s.speed);
    [['setMargin', 'margin'], ['setMaint', 'maint'], ['setFee', 'fee'], ['setFx', 'fx']].forEach(([id, k]) => { const el = $(id); if (el && document.activeElement !== el) el.value = s[k]; });
  }

  // ---------- Sự kiện ----------
  function scrollBy(n) { const m = mkt(s.sym); view.center = (view.center === null ? m.last : view.center) + n; paint(); }
  function center() { view.center = null; view.mode = 'market'; view.sel = null; paint(); }
  function selectOrder(id) { view.selOrder = id || ''; view.mod = null; $('dtLadder').focus({ preventScroll: true }); paint(); }
  function placeAt(side, p, e) {
    if (!s.fast) { view.mode = 'browse'; view.sel = p; log(`Fast-click đang tắt: đã chọn giá ${px(p)} – kéo ô giá vào cột BUY/SELL hoặc bấm ←/→ để đặt lệnh.`); return paint(); }
    newOrder(side, 'AUTO', p, undefined, undefined, { stl: !!(e && e.ctrlKey) });
  }
  function bind() {
    const root = $('simulatorRoot');
    $('tkPx').addEventListener('input', () => { view.tkTouched = true; });
    bindLadder();
    if (root.dataset.dtBound) return; // khung ngoài giữ nguyên qua các lần vẽ lại → chỉ gắn sự kiện một lần
    root.dataset.dtBound = '1';
    root.addEventListener('click', e => {
      if (view.dragged) { view.dragged = false; return; }
      const cx = e.target.closest('[data-cx]'); if (cx) { e.stopPropagation(); cancel(s.orders.find(o => o.id === cx.dataset.cx)); return; }
      const chip = e.target.closest('[data-oid]'); if (chip) return selectOrder(view.selOrder === chip.dataset.oid ? '' : chip.dataset.oid);
      const cell = e.target.closest('td[data-col]');
      if (cell) {
        const p = Number(cell.dataset.p), side = cell.dataset.col; const sel = s.orders.find(o => o.id === view.selOrder);
        $('dtLadder').focus({ preventScroll: true }); view.pending = null;
        if (sel && sel.side === side && sel.sym === s.sym && ['WORKING', 'PARTIAL', 'PARKED'].includes(sel.status)) { modify(sel, p); view.selOrder = ''; return; }
        return placeAt(side, p, e);
      }
      const sy = e.target.closest('[data-sym]'); if (sy) { s.sym = sy.dataset.sym; view.center = null; view.sel = null; view.mode = 'market'; view.selOrder = ''; view.mod = null; save(); return paint(); }
      const tr = e.target.closest('[data-tour]'); if (tr) return tour(tr.dataset.tour);
      const qz = e.target.closest('[data-quiz]'); if (qz) return answerQuiz(Number(qz.dataset.quiz));
      const q = e.target.closest('[data-qty]'); if (q) { s.qty = Number(q.dataset.qty); save(); return paint(); }
      const t = e.target.closest('[data-tray]'); if (t) { view.tray = t.dataset.tray; return paint(); }
      const cl = e.target.closest('[data-cxl]'); if (cl) return cancel(s.orders.find(o => o.id === cl.dataset.cxl));
      const av = e.target.closest('[data-actv]'); if (av) { const o = s.orders.find(x => x.id === av.dataset.actv); if (o) { o.wasParked = true; activate(o); } return; }
      const md = e.target.closest('[data-mod]');
      if (md) { const o = s.orders.find(x => x.id === md.dataset.mod); const cur = o.type === 'STL' ? o.stop : o.px; const v = prompt(`Modify #${o.num} (${o.side} ${o.type} @${px(cur)}) – nhập giá mới:`, String(cur)); if (v !== null && Number(v) > 0) modify(o, Number(v)); return; }
      const b = e.target.closest('[data-act]'); if (!b) return;
      const m = mkt(s.sym);
      switch (b.dataset.act) {
        case 'bmkt': view.pending = null; return newOrder('BUY', 'MKT', 0);
        case 'smkt': view.pending = null; return newOrder('SELL', 'MKT', 0);
        case 'cxl': return cancelSide();
        case 'cxlb': return cancelSide('BUY');
        case 'cxls': return cancelSide('SELL');
        case 'flat': return flatten();
        case 'rev': return reverse();
        case 'center': return center();
        case 'up': return scrollBy(5);
        case 'down': return scrollBy(-5);
        case 'run': return setRun(!timer);
        case 'eod': return endOfDay();
        case 'feed': return setFeed(s.feed === 'live' ? 'sim' : 'live');
        case 'ok': { const o = view.pending; view.pending = null; if (o) send(o); return; }
        case 'no': view.pending = null; log('Đã bỏ lệnh ở bước xác nhận – chưa gửi gì lên sàn.'); return paint();
        case 'ticket': { const side = $('tkSide').value, type = $('tkType').value, p = Number($('tkPx').value) || m.last; view.tkTouched = false; return newOrder(side, type, p); }
        case 'dep': s.cash += 300000000; log('Đã nạp 300 triệu (giả lập). Thực tế: chuyển vào đúng tài khoản ngân hàng của thành viên MXV, chờ tiền hiện trong Margin Excess rồi mới đặt lệnh.', 'ok'); save(); return paint();
        case 'sync': if (resync(s.sym)) log(`Đã lấy lại giá London thật cho ${mxv(s.sym)}: ${px(mkt(s.sym).last)}.`); else log('Chưa có giá London thật để đồng bộ.', 'warn'); save(); return paint();
        case 'reset': if (confirm('Xóa toàn bộ lệnh, vị thế và nhật ký giả lập trên trình duyệt này?')) { setRun(false); s = fresh(); view.center = null; view.selOrder = ''; view.mod = null; view.pending = null; save(); paint(); } return;
        default: return;
      }
    });
    root.addEventListener('change', e => {
      const id = e.target.id;
      if (id === 'dtQty') s.qty = Math.max(1, Math.min(99, Math.round(Number(e.target.value) || 1)));
      else if (id === 'dtConfirmOn') s.confirm = e.target.checked;
      else if (id === 'dtFast') { s.fast = e.target.checked; log(s.fast ? 'Fast-click BẬT: bấm 1 lần vào cột BUY/BID/ASK/SELL là đặt lệnh.' : 'Fast-click TẮT (giống tài khoản broker chưa bật): đặt lệnh bằng kéo-thả giá, phím ←/→ hoặc Order Ticket.'); }
      else if (id === 'dtPark') { s.park = e.target.checked; log(s.park ? 'Park BẬT: lệnh LMT/STP đặt ra sẽ nằm ở tab Parked, chưa lên sàn.' : 'Park TẮT: lệnh gửi thẳng lên sàn.'); }
      else if (id === 'dtType') s.otype = e.target.value;
      else if (id === 'dtDur') s.dur = e.target.value;
      else if (id === 'dtLesson') return startLesson(e.target.value);
      else if (id === 'setScn') { s.scenario = e.target.value; log(`Kịch bản: ${SCENARIOS[s.scenario]}.`); }
      else if (id === 'setSpeed') { s.speed = Number(e.target.value); if (timer) setRun(true); }
      else if (['setMargin', 'setMaint', 'setFee', 'setFx'].includes(id)) { const k = { setMargin: 'margin', setMaint: 'maint', setFee: 'fee', setFx: 'fx' }[id]; s[k] = Math.max(id === 'setFx' ? 1000 : 0, Number(e.target.value) || 0); }
      else if (id === 'tkPx') view.tkTouched = true;
      else return;
      save(); paint();
    });
    // Chuột phải vào lệnh = hủy (như CQG)
    root.addEventListener('contextmenu', e => { const chip = e.target.closest('[data-oid]'); if (!chip) return; e.preventDefault(); cancel(s.orders.find(o => o.id === chip.dataset.oid)); });
  }
  // Thang giá: phím mặc định của CQG + kéo-thả bằng chuột
  function bindLadder() {
    const lad = $('dtLadder');
    lad.addEventListener('keydown', e => {
      const m = mkt(s.sym); const sel = s.orders.find(o => o.id === view.selOrder && ['WORKING', 'PARTIAL', 'PARKED'].includes(o.status)); const k = e.key; let handled = true;
      const csa = e.ctrlKey && e.shiftKey && e.altKey;
      if (csa && /^[xbcqvae]$/i.test(k)) {
        const c = k.toLowerCase();
        if (c === 'x' || c === 'a' || c === 'e') cancelSide(); else if (c === 'b') cancelSide('BUY'); else if (c === 'c') cancelSide('SELL'); else if (c === 'q') flatten(); else if (c === 'v') reverse();
      }
      else if (sel && (k === 'ArrowUp' || k === 'ArrowDown') && !e.altKey) { const base = view.mod ? view.mod.px : (sel.type === 'STL' ? sel.stop : sel.px); view.mod = { id: sel.id, px: base + (k === 'ArrowUp' ? 1 : -1), qty: view.mod ? view.mod.qty : sel.qty }; paint(); }
      else if (sel && /^[0-9]$/.test(k) && !e.ctrlKey) { const q = view.mod && view.mod.typed ? Number(String(view.mod.qty) + k) : Number(k); view.mod = { id: sel.id, px: view.mod ? view.mod.px : (sel.type === 'STL' ? sel.stop : sel.px), qty: Math.min(99, q) || 1, typed: true }; paint(); }
      else if (sel && k === 'Enter' && view.mod) { const md = view.mod; view.mod = null; modify(sel, md.px, md.qty); }
      else if (sel && k === 'Delete') { cancel(sel); view.selOrder = ''; view.mod = null; }
      else if (sel && e.altKey && (k === 'b' || k === 'B')) modify(sel, m.bid);
      else if (sel && e.altKey && (k === 'a' || k === 'A')) modify(sel, m.ask);
      else if (sel && e.altKey && k === 'Home') toMarket(sel);
      else if (sel && k === ' ') log(`Chi tiết #${sel.num}: ${sel.side} ${sel.qty} ${mxv(sel.sym)} ${sel.type} ${desc(sel)} ${sel.dur} · ${STATUS[sel.status]} · đã khớp ${sel.filled} · đặt lúc ${sel.at}.`);
      else if (e.altKey && (k === 'ArrowUp' || k === 'ArrowDown')) { const w = working(); if (w.length) { const i = Math.max(0, w.findIndex(o => o.id === view.selOrder)); const n = w[(i + (k === 'ArrowUp' ? 1 : -1) + w.length) % w.length]; view.selOrder = n.id; view.mod = null; paint(); } }
      else if (e.ctrlKey && (k === 'n' || k === 'N')) { const w = working(); if (w.length) { view.selOrder = w[w.length - 1].id; view.mod = null; paint(); } }
      else if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'PageUp' || k === 'PageDown') {
        const d = k === 'ArrowUp' ? 1 : k === 'ArrowDown' ? -1 : k === 'PageUp' ? 10 : -10; view.mode = 'browse'; view.sel = (view.sel === null ? m.last : view.sel) + d;
        const N = phone() ? 9 : 12; if (Math.abs(view.sel - view.center) > N - 2) view.center = view.sel; paint();
      }
      else if (e.ctrlKey && k === '1') { view.mode = 'browse'; view.sel = e.altKey ? m.bid - 1 : m.ask + 1; view.center = view.sel; paint(); }
      else if (k === 'ArrowLeft' || k === 'ArrowRight') {
        const side = k === 'ArrowLeft' ? 'BUY' : 'SELL';
        if (e.altKey) newOrder(side, 'LMT', side === 'BUY' ? m.bid : m.ask);
        else if (e.shiftKey) newOrder(side, 'LMT', side === 'BUY' ? m.ask : m.bid);
        else if (e.ctrlKey) newOrder(side, 'LMT', m.last);
        else if (view.mode === 'browse' && view.sel !== null) newOrder(side, 'AUTO', view.sel);
        else newOrder(side, 'MKT', 0);
      }
      else if (k === 'Home' && e.ctrlKey) { view.center = null; paint(); }
      else if (k === 'Home' || k === 'Escape') { if (view.pending) view.pending = null; view.selOrder = ''; view.mod = null; center(); }
      else if (k === 'Enter' && view.pending) { const o = view.pending; view.pending = null; send(o); }
      else handled = false;
      if (handled) e.preventDefault();
    });
    lad.addEventListener('wheel', e => { e.preventDefault(); scrollBy(e.deltaY < 0 ? 2 : -2); }, { passive: false });
    // Kéo-thả (chuột): kéo nhãn lệnh sang giá mới = sửa giá, kéo ra ngoài thang = hủy; kéo ô PRICE thả vào cột BUY/SELL = đặt lệnh
    lad.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      const chip = e.target.closest('[data-oid]'); const pc = e.target.closest('td[data-px]');
      if (chip && !e.target.closest('[data-cx]')) view.drag = { kind: 'order', id: chip.dataset.oid, x: e.clientX, y: e.clientY, moved: false, over: null };
      else if (pc) view.drag = { kind: 'price', p: Number(pc.dataset.px), x: e.clientX, y: e.clientY, moved: false, over: null };
    });
    window.addEventListener('pointermove', e => {
      const d = view.drag; if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
      d.moved = true; const td = document.elementFromPoint(e.clientX, e.clientY); const row = td && td.closest && td.closest('#dtRows tr');
      const over = row ? Number(row.dataset.p) : null; if (over !== d.over) { d.over = over; const r = $('dtRows'); if (r) { r.querySelectorAll('tr.dropt').forEach(x => x.classList.remove('dropt')); if (row) row.classList.add('dropt'); } }
    });
    window.addEventListener('pointerup', e => {
      const d = view.drag; view.drag = null; if (!d || !d.moved) return;
      view.dragged = true; setTimeout(() => { view.dragged = false; }, 0);
      const td = document.elementFromPoint(e.clientX, e.clientY); const inLadder = td && td.closest && td.closest('#dtLadder');
      if (d.kind === 'order') {
        const o = s.orders.find(x => x.id === d.id); if (!o) return paint();
        if (!inLadder) { log(`Kéo #${o.num} ra ngoài thang → hủy lệnh.`); return cancel(o); }
        const row = td.closest('#dtRows tr'); if (row && Number(row.dataset.p) !== (o.type === 'STL' ? o.stop : o.px)) return modify(o, Number(row.dataset.p));
        return paint();
      }
      const col = td && td.closest && td.closest('td[data-col]');
      if (col && inLadder) return newOrder(col.dataset.col, 'AUTO', d.p, undefined, undefined, { stl: e.ctrlKey });
      paint();
    });
  }
  function render() { if (!built || !$('simulatorRoot') || !$('simulatorRoot').querySelector('.dt')) build(); paint(); }
  window.VTSimulator = { render };
})();

// VIỆT THIÊN — Sàn giả lập: giao diện kiểu app CQG trên điện thoại (bản tiếng Việt), dựng theo ảnh chụp app CQG của anh Huy.
// Đầu: ‹ · mã (vuốt/chạm để đổi) · "Robusta Coffee: November 2026"; dải trạng thái (Không có trạng thái / OTE+P/L · ĐANG CHỜ KHỚP · tài khoản);
// thẻ BIỂU ĐỒ · HOT · TKT · CÁC LỆNH · TRẠNG THÁI · M & B · CHI TIẾT; thanh dưới ▦ · B:S · L:S · $ · ⋯ ; "chế độ Giả lập".
// Dùng chung lõi lệnh / vị thế / tài khoản với simulator.js (window.VTSim). Không kết nối CQG/MXV, không có tiền thật.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const A = () => window.VTSim;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const TFS = [[60, '1 Phút'], [300, '5 Phút'], [600, '10 Phút'], [900, '15 Phút'], [1800, '30 Phút'], [3600, '60 Phút'], [86400, 'Hàng ngày'], [604800, 'Hàng tuần'], [2592000, 'Hàng tháng']];
  const TABS = [['chart', 'BIỂU ĐỒ'], ['hot', 'HOT'], ['tkt', 'TKT'], ['orders', 'CÁC LỆNH'], ['pos', 'TRẠNG THÁI'], ['mb', 'M & B'], ['detail', 'CHI TIẾT']];
  const ISIN = { RMX26: 'GB00MW9SQY33' }; // theo màn CHI TIẾT của CQG; kỳ khác chưa có số
  const mv = { tab: 'chart', seg: 'working', sheet: null, tkt: { side: 'BUY', type: 'LMT', px: null, follow: true, stl: null, gtd: '' }, stp: false, chart: null, built: false, lastLog: '', toastT: 0, sel: '', hotC: true };
  let root = null;
  const cm = () => { const s = A().s; if (!s.cm) s.cm = { tf: 3600, style: 'bar', studies: ['vol'], cross: true, btns: true, legend: true }; return s.cm; };
  const full = () => A().phone();                         // điện thoại: toàn màn hình như app
  const desc = sym => { const q = window.VTEngine.parseQuoteName(sym); return q ? `Robusta Coffee: ${MONTHS[q.month - 1]} ${q.year}` : sym; };
  const kfmt = n => (n >= 1000 ? (Math.round(n / 100) / 10).toLocaleString('en-US') + 'K' : String(n));

  // ---------- Dựng khung ----------
  function build() {
    const host = $('simulatorRoot'); if (!host) return;
    const isFull = full();
    host.innerHTML = isFull
      ? `<div class="cm-launch"><div class="dt-banner"><span><b>SIMULATION</b> · Sàn giả lập giao diện app CQG (điện thoại) – không kết nối CQG/MXV, không có tiền thật.</span></div>
          <button type="button" class="cm-open" data-m="open">📱 Mở sàn giả lập (giao diện CQG Mobile)</button>
          <button type="button" class="cm-alt" data-act="layout-d">🖥 Dùng giao diện DOMTrader (máy tính)</button></div><div class="cm-overlay" id="cmOverlay" hidden></div>`
      : `<div class="cm-desk"><div class="dt-banner"><span><b>SIMULATION</b> · Xem thử giao diện app CQG trên điện thoại (khung 390px). Trên điện thoại thật sẽ hiện toàn màn hình.</span><span class="dt-bnbtns"><button type="button" class="dt-layoutbtn" data-act="layout-c">🖥 Về giao diện CQG Desktop</button><button type="button" class="dt-layoutbtn" data-act="layout-d">🎓 DOMTrader</button></span></div><div class="cm-phone" id="cmOverlay"></div></div>`;
    const box = $('cmOverlay');
    box.innerHTML = `<div class="cm" id="cmApp">
      <div class="cm-simtag">SIMULATION · giả lập</div>
      <header class="cm-hd"><button type="button" class="cm-back" data-m="symlist" aria-label="Danh sách mã">‹</button>
        <div class="cm-title"><div class="cm-syms" id="cmSyms"></div><div class="cm-desc" id="cmDesc"></div></div>
        <button type="button" class="cm-hdact" id="cmHdAct" data-m="hdact" aria-label="Thao tác"></button></header>
      <div class="cm-status" id="cmStatus"></div><div class="cm-range" id="cmRange"><span></span></div>
      <div class="cm-coach" id="cmCoach" data-m="more" hidden></div>
      <nav class="cm-tabs" id="cmTabs">${TABS.map(([k, l]) => `<button type="button" data-m="tab" data-v="${k}">${l}</button>`).join('')}</nav>
      <section class="cm-body">
        <div class="cm-pane" data-pane="chart"><div class="cm-ctool" id="cmCtool"></div><div class="cm-cbody"><div class="cm-chart" id="cmChart"></div><div class="cm-tbtns" id="cmTbtns"></div></div></div>
        <div class="cm-pane" data-pane="hot"><div class="cm-hotbar" id="cmHotbar"></div><div class="cm-domwrap"><table class="cm-dom"><thead><tr><th>MUA</th><th>BID</th><th>GIÁ</th><th>ASK</th><th>BÁN</th><th class="c-vol"></th></tr></thead><tbody id="cmRows"></tbody></table></div></div>
        <div class="cm-pane" data-pane="tkt" id="cmTkt"></div>
        <div class="cm-pane" data-pane="orders"><div class="cm-seg" id="cmSeg"></div><div class="cm-list" id="cmOrders"></div><div class="cm-foot2"><button type="button" data-m="cxlall">Hủy tất cả</button><button type="button" data-m="exitpos">Thoát trạng thái</button></div></div>
        <div class="cm-pane" data-pane="pos"><div class="cm-list" id="cmPos"></div></div>
        <div class="cm-pane" data-pane="mb"><div class="cm-list" id="cmMb"></div></div>
        <div class="cm-pane" data-pane="detail"><div class="cm-list" id="cmDetail"></div></div>
      </section>
      <div class="cm-free" id="cmFree">chế độ Giả lập</div>
      <div class="cm-toast" id="cmToast" data-m="toastx" hidden></div>
      <nav class="cm-bnav"><button type="button" data-m="symlist" aria-label="Danh sách mã"><span class="cm-grid">▦</span></button><button type="button" data-m="tab" data-v="orders" aria-label="Các lệnh">B:S</button>
        <button type="button" data-m="tab" data-v="pos" aria-label="Trạng thái">L:S</button><button type="button" data-m="acct" aria-label="Tài khoản">$</button><button type="button" data-m="more" aria-label="Thêm">⋯</button></nav>
      <div class="cm-sheet" id="cmSheet" hidden></div>
      <button type="button" class="modal-close cm-hiddenclose" data-m="close" aria-hidden="true" tabindex="-1">×</button>
    </div>`;
    const c = cm();
    mv.chart = window.VTOhlc.mount($('cmChart'), { toolbar: false, tf: c.tf, style: c.style, studies: c.studies, cross: c.cross, legend: c.legend ? A().mxv(A().s.sym) : '', height: () => chartH() });
    if (!host.dataset.cmBound) { host.dataset.cmBound = '1'; host.addEventListener('click', onClick); bindSwipe(host); }
    mv.built = true;
  }
  function chartH() { const app = $('cmApp'); if (!app) return 360; const body = app.querySelector('.cm-body'); const h = body ? body.clientHeight - 44 : 360; return Math.max(240, Math.min(560, h)); }
  function open(on) {
    const ov = $('cmOverlay'); if (!ov || !full()) return;
    ov.hidden = !on; ov.classList.toggle('modal-overlay', on); ov.classList.toggle('active', on);   // để nút Quay lại của điện thoại đóng được
    document.body.classList.toggle('cm-on', on);
    if (on) { mv.chart && mv.chart.redraw(); }
    paint();
  }

  // ---------- Vẽ ----------
  function paint() {
    const host = $('simulatorRoot'); if (!host) return;
    if (!mv.built || !$('cmApp') || (full() ? !host.querySelector('.cm-launch') : !host.querySelector('.cm-desk'))) build();
    const api = A(), s = api.s, m = api.mkt(s.sym), a = api.account(), g = a.b[s.sym] || { pos: 0, avg: 0, real: 0 };
    const app = $('cmApp'); app.dataset.tab = mv.tab;
    // Đầu: mã trước · mã đang chọn · mã sau
    const syms = api.symbols(); const i = syms.indexOf(s.sym);
    $('cmSyms').innerHTML = `${i > 0 ? `<button type="button" class="dim" data-m="sym" data-v="${syms[i - 1]}">${api.mxv(syms[i - 1])}</button>` : ''}<b>${api.mxv(s.sym)}</b>${i < syms.length - 1 ? `<button type="button" class="dim" data-m="sym" data-v="${syms[i + 1]}">${api.mxv(syms[i + 1])}</button>` : ''}`;
    $('cmDesc').textContent = desc(s.sym);
    $('cmHdAct').textContent = mv.tab === 'tkt' ? '↻' : api.timerOn() ? '⏸' : '▶'; $('cmHdAct').title = mv.tab === 'tkt' ? 'Làm mới phiếu lệnh' : api.timerOn() ? 'Dừng giá' : 'Cho giá chạy';
    // Dải trạng thái
    const ote = g.pos ? (m.last - g.avg) * api.LOT_T * g.pos : 0; const opl = ote + (g.real || 0);
    const wk = s.orders.filter(o => o.sym === s.sym && api.LIVE.includes(o.status)).length;
    $('cmStatus').innerHTML = `<div class="c1"><div><span>${g.pos ? `${g.pos > 0 ? 'Long' : 'Short'} ${Math.abs(g.pos)} @ ${api.px(Math.round(g.avg * 10) / 10)}` : 'Không có trạng thái'}</span><b>${g.pos ? api.sg(g.pos, String) : '—'}</b></div><div><span>OTE+P/L</span><b class="${opl > 0 ? 'up' : opl < 0 ? 'dn' : ''}">${g.pos || g.real ? api.sg(Math.round(opl), api.px) : '—'}</b></div></div>`
      + `<div class="c2"><span>ĐANG CHỜ KHỚP</span><b>${wk || '—'}</b></div><div class="c3"><span>VIETTHIEN-SIM</span><span>${api.esc(s.acct)}</span></div>`;
    const rng = m.high > m.low ? (m.last - m.low) / (m.high - m.low) : 0.5; $('cmRange').firstElementChild.style.width = Math.round(rng * 100) + '%';
    // Huấn luyện viên (khi đang làm bài)
    const L = api.LESSONS[s.lesson]; const cb = $('cmCoach'); cb.hidden = !L;
    if (L) { const ch = api.coach(); cb.className = 'cm-coach' + (ch.ok ? ' ok' : ''); cb.innerHTML = `🎯 <b>${api.esc(L.title)}</b> – ${ch.ok ? '✅ Đạt' : ch.html.replace(/<div class="dt-stats">[\s\S]*$/, '').replace(/<[^>]+>/g, '')}`; }
    $('cmTabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === mv.tab));
    $('cmFree').textContent = s.feed === 'live' ? `chế độ Giả lập · 📡 giá London thật${api.londonOpen() ? '' : ' (sàn nghỉ)'}` : 'chế độ Giả lập · giá mô phỏng';
    ({ chart: paintChart, hot: paintHot, tkt: paintTkt, orders: paintOrders, pos: paintPos, mb: paintMb, detail: paintDetail })[mv.tab]();
    paintSheet(); toast();
  }
  function paintChart() {
    const api = A(), s = api.s, c = cm(), m = api.mkt(s.sym), d = api.chartData(s.sym);
    $('cmCtool').innerHTML = `<button type="button" data-m="tfmenu" class="tf">${(TFS.find(t => t[0] === c.tf) || [0, c.tf])[0] >= 86400 ? (TFS.find(t => t[0] === c.tf) || [0, ''])[1].replace('Hàng ', '') : Math.round(c.tf / 60)} ▾</button>`
      + `<button type="button" data-m="stmenu" title="Kiểu biểu đồ">${c.style === 'line' ? '⟋' : c.style === 'area' ? '◢' : '┼┤'} ▾</button>`
      + `<button type="button" data-m="cross" class="${c.cross ? 'on' : ''}" title="Dấu thập">┼</button><button type="button" data-m="legend" class="${c.legend ? 'on' : ''}" title="Hiện/ẩn hộp mã & O/H/L/C">👁</button>`
      + `<button type="button" data-m="latest" title="Về thanh mới nhất">↕</button><button type="button" data-m="studies" class="${c.studies.some(x => x !== 'vol') ? 'on' : ''}" title="Nghiên cứu">⚙</button>`
      + `<button type="button" data-m="studies" class="cm-wide">＋ Nghiên cứu</button><button type="button" data-m="btns" class="cm-wide ${c.btns ? 'on' : ''}" title="Show/Hide trading buttons">⇄</button><button type="button" data-m="cmenu" title="Thêm">▾</button>`;
    const q = s.qty, dur = s.dur === 'GTC' ? 'GTC' : 'Ngày';
    const b1 = mv.stp ? m.ask + 1 : m.bid, s1 = mv.stp ? m.bid - 1 : m.ask, b2 = mv.stp ? m.ask + 5 : m.ask, s2 = mv.stp ? m.bid - 5 : m.bid;
    const tb = $('cmTbtns'); tb.hidden = !c.btns; $('cmApp').classList.toggle('cm-nobtns', !c.btns);
    tb.innerHTML = `<button type="button" class="buy big" data-m="mkt" data-v="BUY">MUA ${q} MKT</button><button type="button" class="sell big" data-m="mkt" data-v="SELL">BÁN ${q} MKT</button>`
      + `<div class="cm-vinfo">Khối lượng: ${kfmt(m.tv + 16000)}</div><div class="cm-vinfo">Bán/Mua: ${api.analysis(s.sym).ask}/${api.analysis(s.sym).bid}</div>`
      + `<button type="button" class="buy" data-m="at" data-v="BUY" data-p="${b1}">MUA ${q} ${mv.stp ? 'STP ' : ''}@<b>${api.px(b1)}</b></button><button type="button" class="sell" data-m="at" data-v="SELL" data-p="${s1}">BAN ${q} ${mv.stp ? 'STP ' : ''}@<b>${api.px(s1)}</b></button>`
      + `<button type="button" class="buy" data-m="at" data-v="BUY" data-p="${b2}">MUA ${q} ${mv.stp ? 'STP ' : ''}@<b>${api.px(b2)}</b></button><button type="button" class="sell" data-m="at" data-v="SELL" data-p="${s2}">BAN ${q} ${mv.stp ? 'STP ' : ''}@<b>${api.px(s2)}</b></button>`
      + `<div class="cm-qty"><button type="button" data-m="qty" data-v="-1">−</button><div><b>${q}</b><small>số lượng</small></div><button type="button" data-m="qty" data-v="1">＋</button></div>`
      + `<div class="cm-2"><button type="button" data-m="stp" class="${mv.stp ? 'on' : ''}">STP</button><button type="button" data-m="dur">${dur}</button></div>`;
    if (mv.chart) { mv.chart.setLegend(c.legend ? api.mxv(s.sym) : ''); mv.chart.setData(d.bars, d.base, d.note, d.marks); }
  }
  function paintHot() {
    const api = A(), s = api.s;
    $('cmHotbar').innerHTML = `<div class="cm-qty sm"><button type="button" data-m="qty" data-v="-1">−</button><div><b>${s.qty}</b><small>số lượng</small></div><button type="button" data-m="qty" data-v="1">＋</button></div>`
      + `<button type="button" class="buy" data-act="bmkt">MUA MKT</button><button type="button" class="sell" data-act="smkt">BÁN MKT</button>`
      + `<button type="button" data-act="cxlb">Hủy MUA</button><button type="button" data-act="cxl">Hủy hết</button><button type="button" data-act="cxls">Hủy BÁN</button><button type="button" data-act="center">Giữa</button>`;
    const m = api.mkt(s.sym), v = api.view;
    if (v.center !== null && v.mode !== 'browse' && Math.abs(m.last - v.center) > 6) { v.center = null; mv.hotC = true; }   // giá chạy ra rìa thang → canh lại
    $('cmRows').innerHTML = api.rowsHtml(); $('cmHotbar').parentElement.style.setProperty('--hb', $('cmHotbar').offsetHeight + 'px');
    if (mv.hotC) { mv.hotC = false; requestAnimationFrame(centerHot); }
  }
  function centerHot() {   // cuộn để dòng giá khớp gần nhất nằm giữa phần thang nhìn thấy (dưới thanh nút)
    const body = $('cmApp') && $('cmApp').querySelector('.cm-body'), r = $('cmRows') && $('cmRows').querySelector('tr.last'); if (!body || !r) return;
    const bar = $('cmHotbar').offsetHeight + (($('cmRows').parentElement.tHead || {}).offsetHeight || 0), top = r.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop;
    body.scrollTop = Math.max(0, top - bar - (body.clientHeight - bar - r.offsetHeight) / 2);
  }
  function paintTkt() {
    const api = A(), s = api.s, m = api.mkt(s.sym), t = mv.tkt;
    if (t.follow || t.px === null) t.px = t.side === 'BUY' ? m.bid : m.ask;
    if (t.type === 'STL' && t.stl === null) t.stl = t.side === 'BUY' ? m.ask + 2 : m.bid - 2;
    const buy = t.side === 'BUY'; const q = s.qty; const dur = s.dur === 'GTC' ? 'GTC' : 'Ngày';
    const lbl = t.type === 'MKT' ? 'MKT' : `${api.px(t.type === 'STL' ? t.stl : t.px)}`;
    $('cmTkt').innerHTML = `<div class="cm-bs"><button type="button" data-m="tside" data-v="BUY" class="${buy ? 'on buy' : ''}">MUA</button><button type="button" data-m="tside" data-v="SELL" class="${!buy ? 'on sell' : ''}">BÁN</button></div>
      <div class="cm-tkrow"><div class="cm-box"><div class="v">${q}</div><small>số lượng</small><div class="cm-pm"><button type="button" data-m="qty" data-v="-1">−</button><button type="button" data-m="qty" data-v="1">＋</button></div></div>
        <div class="cm-box px ${t.follow ? 'follow' : ''}"><div class="v">${t.type === 'MKT' ? 'MKT' : api.px(t.px)}</div><small>giá${t.follow ? ' (theo thị trường)' : ''}</small><div class="cm-pm"><button type="button" data-m="tpx" data-v="-1">−</button><button type="button" data-m="tfollow" title="Dừng/tiếp tục chạy theo giá thị trường">${t.follow ? '⏸' : '▶'}</button><button type="button" data-m="tpx" data-v="1">＋</button></div></div></div>
      <div class="cm-tkrow2"><button type="button" class="cm-type" data-m="ttype">${t.type}</button><div class="cm-stl ${t.type === 'STL' ? '' : 'off'}"><button type="button" data-m="tstl" data-v="-1">−</button><div><b>${t.type === 'STL' ? api.px(t.stl) : ''}</b><small>giá STL</small></div><button type="button" data-m="tstl" data-v="1">＋</button></div></div>
      <div class="cm-tkrow2"><button type="button" class="cm-type" data-m="dur">${dur}</button><button type="button" class="cm-gtd" data-m="gtd"><b>${api.esc(t.gtd)}</b><small>có giá trị đến</small></button></div>
      <div class="cm-quick ${buy ? 'buy' : 'sell'}"><button type="button" data-m="at" data-v="${t.side}" data-p="${m.bid}">${buy ? 'MUA' : 'BÁN'} ${q}<br>@ ${api.px(m.bid)}</button><button type="button" data-m="at" data-v="${t.side}" data-p="${m.ask}">${buy ? 'MUA' : 'BÁN'} ${q}<br>@ ${api.px(m.ask)}</button><button type="button" data-m="mkt" data-v="${t.side}">${buy ? 'MUA' : 'BÁN'} ${q}<br>@ MKT</button></div>
      <button type="button" class="cm-place ${buy ? 'buy' : 'sell'}" data-m="place">${buy ? 'MUA' : 'BÁN'} ${q} @ ${lbl}<br>${t.type} ${dur}</button>
      <p class="cm-hint">LMT = giá giới hạn · STP = kích hoạt khi chạm giá · STL = chạm giá STL thì đặt LMT · MKT = khớp ngay. Ngày = hết hiệu lực cuối phiên, GTC = tới khi hủy.</p>`;
  }
  function orderCard(o) {
    const api = A(); const live = ['WORKING', 'PARTIAL', 'PARKED'].includes(o.status);
    return `<div class="cm-card ${mv.sel === o.id ? 'sel' : ''}" data-m="osel" data-v="${o.id}"><div class="r1"><b class="${o.side === 'BUY' ? 'up' : 'dn'}">${o.side === 'BUY' ? 'MUA' : 'BÁN'} ${o.qty}</b> ${api.mxv(o.sym)} <span>${o.type} ${o.type === 'MKT' ? '' : api.desc(o)}</span><span class="st st-${o.status.replace(/ /g, '-').toLowerCase()}">${api.STATUS[o.status] || o.status}</span></div>`
      + `<div class="r2">#${o.num} · ${o.dur === 'GTC' ? 'GTC' : 'Ngày'} · đặt ${o.at} · khớp ${o.filled}/${o.qty}${o.filled ? ` @${api.px(Math.round(o.avg * 10) / 10)}` : ''}${o.note ? ` · ${api.esc(o.note)}` : ''}</div>`
      + (mv.sel === o.id && live ? `<div class="r3">${o.type !== 'MKT' ? `<button type="button" data-m="omod" data-v="-1">Giá −1</button><button type="button" data-m="omod" data-v="1">Giá +1</button>` : ''}${o.status === 'PARKED' ? '<button type="button" data-m="oact">Kích hoạt</button>' : ''}<button type="button" class="dn" data-m="ocxl">Hủy lệnh</button></div>` : '') + '</div>';
  }
  function paintOrders() {
    const api = A(), s = api.s;
    const segs = [['working', 'Chờ khớp'], ['filled', 'Đã khớp'], ['cancelled', 'Đã hủy'], ['all', 'Tất cả']];
    $('cmSeg').innerHTML = segs.map(([k, l]) => `<button type="button" data-m="seg" data-v="${k}" class="${mv.seg === k ? 'on' : ''}">${l}</button>`).join('');
    const pick = { working: o => api.LIVE.includes(o.status) || o.status === 'PARKED', filled: o => o.filled > 0, cancelled: o => ['CANCELED', 'EXPIRED', 'REJECTED'].includes(o.status), all: () => true }[mv.seg];
    const list = s.orders.filter(pick).slice().reverse();
    const empty = { working: 'Không có lệnh chờ khớp', filled: 'Chưa có lệnh khớp', cancelled: 'Không có lệnh đã hủy', all: 'Chưa có lệnh' }[mv.seg];
    $('cmOrders').innerHTML = list.length ? list.map(orderCard).join('') : `<div class="cm-empty">${empty}</div>`;
  }
  function paintPos() {
    const api = A(), s = api.s, a = api.account();
    const rows = Object.entries(a.b).filter(([, g]) => g.pos || g.real).map(([sym, g]) => { const m = api.mkt(sym); const ote = g.pos ? (m.last - g.avg) * api.LOT_T * g.pos : 0;
      return `<div class="cm-card"><div class="r1"><b>${api.mxv(sym)}</b> <span class="${g.pos > 0 ? 'up' : g.pos < 0 ? 'dn' : ''}">${g.pos > 0 ? 'Long ' + g.pos : g.pos < 0 ? 'Short ' + -g.pos : 'Đã đóng'}</span>${g.pos ? `<span>@ ${api.px(Math.round(g.avg * 10) / 10)}</span>` : ''}</div>`
        + `<div class="r2">Giá ${api.px(m.last)} · OTE <b class="${ote >= 0 ? 'up' : 'dn'}">${api.sg(Math.round(ote), api.px)} USD</b> · P/L ${api.sg(Math.round(g.real), api.px)} USD</div>${g.pos ? `<div class="r3"><button type="button" data-m="flat" data-v="${sym}">Thoát trạng thái ${api.mxv(sym)}</button></div>` : ''}</div>`; }).join('');
    $('cmPos').innerHTML = (rows || '<div class="cm-empty">Không có trạng thái</div>')
      + `<div class="cm-sum"><div><span>OTE</span><b class="${a.ote >= 0 ? 'up' : 'dn'}">${api.sg(a.ote, api.vnd)} đ</b></div><div><span>P/L</span><b>${api.sg(a.pl, api.vnd)} đ</b></div><div><span>NLV</span><b>${api.vnd(a.nlv)} đ</b></div><div><span>Margin Excess</span><b>${api.vnd(a.excess)} đ</b></div></div>`;
  }
  function paintMb() {
    const api = A(), s = api.s, m = api.mkt(s.sym), ts = (m.ts || []).slice().reverse();
    $('cmMb').innerHTML = `<div class="cm-mbh">Khớp lệnh gần nhất trên sàn ${api.mxv(s.sym)} (giờ · giá · số lot)</div>`
      + (ts.length ? `<table class="cm-tbl"><tbody>${ts.map(r => { const d = new Date(r[0] * 1000); return `<tr><td>${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}${s.feed === 'live' ? ':' + String(d.getSeconds()).padStart(2, '0') : ''}</td><td class="${r[3] > 0 ? 'up' : r[3] < 0 ? 'dn' : ''}">${api.px(r[1])} ${r[3] > 0 ? '▲' : r[3] < 0 ? '▼' : ''}</td><td>${r[2]}</td></tr>`; }).join('')}</tbody></table>`
        : '<div class="cm-empty">Chưa có lần khớp – bấm ▶ (góc trên phải) cho giá chạy</div>');
  }
  function paintDetail() {
    const api = A(), s = api.s, fnd = window.VTEngine.firstNoticeDay(s.sym), ltd = api.lastTradingDay(s.sym);
    const d = x => (x ? x.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');
    const row = (k, v) => `<div class="cm-kv"><span>${k}</span><b>${v}</b></div>`;
    $('cmDetail').innerHTML = `<div class="cm-dh"><small>Mô tả</small><div>${desc(s.sym)}</div></div>`
      + row('Exchange', 'ICE FUTURES EUROPE - AGRICULTURAL PRODUCTS DIVISION') + row('Type (system)', 'Future') + row('ISIN', ISIN[s.sym] || '—')
      + row('Bước giá', '1') + row('Giá trị của một bước giá', '10 USD') + row('Ngày giao dịch cuối cùng', d(ltd)) + row('Ngày thông báo đầu tiên', d(fnd))
      + row('Initial margin', `${api.px(s.imUsd)} USD`) + row('Maintenance margin', `${api.px(s.mmUsd)} USD`)
      + `<p class="cm-hint">Mã MXV ${api.mxv(s.sym)} = mã ICE ${s.sym}. Ngày và ký quỹ theo cách tính của sàn/CQG; ký quỹ đổi theo biến động – sửa ở ⋯ → Thông số.</p>`;
  }
  // ---------- Bảng kéo lên (menu, danh sách mã, tài khoản, thêm) ----------
  function paintSheet() {
    const sh = $('cmSheet'); const api = A(), s = api.s, c = cm();
    const pend = api.view.pending;
    if (pend) {
      sh.hidden = false; sh.className = 'cm-sheet';
      sh.innerHTML = `<div class="cm-sh"><h4>Xác nhận lệnh</h4><p class="cm-conf"><b class="${pend.side === 'BUY' ? 'up' : 'dn'}">${pend.side === 'BUY' ? 'MUA' : 'BÁN'} ${pend.qty}</b> ${api.mxv(pend.sym)} ${pend.type} ${pend.type === 'MKT' ? '' : api.desc(pend)} ${pend.dur === 'GTC' ? 'GTC' : 'Ngày'}${s.park && pend.type !== 'MKT' ? ' (Park)' : ''}</p>
        <div class="cm-row"><button type="button" class="${pend.side === 'BUY' ? 'buy' : 'sell'}" data-act="ok">Gửi lệnh</button><button type="button" data-act="no">Hủy</button></div></div>`;
      return;
    }
    if (!mv.sheet) { sh.hidden = true; sh.innerHTML = ''; return; }
    sh.hidden = false; sh.className = 'cm-sheet' + (['tf', 'style', 'cmenu', 'studies'].includes(mv.sheet) ? ' pop' : '');
    let h = '';
    if (mv.sheet === 'tf') h = `<div class="cm-menu">${TFS.map(([v, l]) => `<button type="button" data-m="settf" data-v="${v}">${c.tf === v ? '✓ ' : ''}${l}</button>`).join('')}<button type="button" disabled>Tùy chỉnh…</button><button type="button" disabled>☐ Sự liên tiếp</button></div>`;
    else if (mv.sheet === 'style') h = `<div class="cm-menu">${window.VTOhlc.STYLES.map(([v, l]) => `<button type="button" data-m="setstyle" data-v="${v}">${c.style === v ? '✓ ' : ''}${l}</button>`).join('')}</div>`;
    else if (mv.sheet === 'studies') h = `<div class="cm-menu"><div class="cm-mh">+ Nghiên cứu</div>${window.VTOhlc.STUDIES.map(([v, l]) => `<button type="button" data-m="setstudy" data-v="${v}">${c.studies.includes(v) ? '☑' : '☐'} ${l}</button>`).join('')}</div>`;
    else if (mv.sheet === 'cmenu') h = `<div class="cm-menu"><div class="cm-mh">Đồ thị</div><button type="button" data-m="studies">＋ Nghiên cứu</button><button type="button" data-m="legend">⁄ Hiện/Ẩn đồ họa</button><div class="cm-mh">Show/Hide trading buttons</div><button type="button" data-m="btns">⇄ Show/Hide trading buttons</button></div>`;
    else if (mv.sheet === 'symlist') h = `<div class="cm-sh"><h4>Thị trường – Robusta London</h4>${api.symbols().map(x => { const m = api.mkt(x); const ch = m.last - m.open; return `<button type="button" class="cm-symrow ${x === s.sym ? 'on' : ''}" data-m="sym" data-v="${x}"><b>${api.mxv(x)}</b><span>${desc(x)}</span><b class="${ch > 0 ? 'up' : ch < 0 ? 'dn' : ''}">${api.px(m.last)}</b><small class="${ch > 0 ? 'up' : ch < 0 ? 'dn' : ''}">${api.sg(ch, api.px)}</small></button>`; }).join('')}</div>`;
    else if (mv.sheet === 'acct') { const a = api.account(); const kv = (k, v, cl) => `<div class="cm-kv"><span>${k}</span><b class="${cl || ''}">${v}</b></div>`;
      h = `<div class="cm-sh"><h4>$ Tài khoản ${api.esc(s.acct)} <small>(tiền mô phỏng)</small></h4>${kv('Balance', api.vnd(a.balance) + ' đ')}${kv('P/L', api.sg(a.pl, api.vnd) + ' đ', a.pl >= 0 ? 'up' : 'dn')}${kv('OTE', api.sg(a.ote, api.vnd) + ' đ', a.ote >= 0 ? 'up' : 'dn')}${kv('NLV', api.vnd(a.nlv) + ' đ')}
        ${kv('Margin Value', api.vnd(a.mv) + ' đ')}${kv('Maintenance', api.vnd(a.maint) + ' đ')}${kv('Purchasing Power', api.vnd(a.pp) + ' đ')}${kv('Margin Excess', `${api.vnd(a.excess)} đ ≈ ${Math.max(0, Math.floor(a.excess / api.IM()))} lot`, a.excess >= 0 ? '' : 'dn')}${kv('Phí đã trả', api.vnd(a.fees) + ' đ')}
        ${a.call ? '<div class="cm-call">⚠️ MARGIN CALL: NLV dưới mức duy trì – nộp thêm tiền hoặc giảm vị thế.</div>' : ''}<div class="cm-row"><button type="button" data-act="dep">+ Nạp 300 triệu</button></div></div>`; }
    else if (mv.sheet === 'more') { const L = api.LESSONS[s.lesson]; const ch = L ? api.coach() : null;
      h = `<div class="cm-sh"><h4>⋯ Thêm</h4>
        <label class="cm-lb">🎯 Bài tập tình huống<select data-m="lesson" class="cm-sel"><option value="">Tập tự do</option>${Object.entries(api.LESSONS).map(([k, x]) => `<option value="${k}"${k === s.lesson ? ' selected' : ''}>${api.esc(x.title)}</option>`).join('')}</select></label>
        ${L ? `<p class="cm-brief">${api.esc(L.brief)}</p><div class="dt-coach ${ch.ok ? 'ok' : ''}">${ch.html}</div>` : ''}
        <div class="cm-row"><button type="button" data-act="run">${api.timerOn() ? '⏸ Dừng giá' : '▶ Cho giá chạy'}</button><button type="button" data-act="feed">${s.feed === 'live' ? '🎲 Về giá mô phỏng' : '📡 Giá London thật'}</button></div>
        <div class="cm-row"><button type="button" data-act="eod">⏭ Hết phiên</button><button type="button" data-m="confirm">${s.confirm ? '☑' : '☐'} Xác nhận lệnh</button><button type="button" data-m="park">${s.park ? '☑' : '☐'} Park</button></div>
        <label class="cm-lb">Kịch bản thị trường<select data-m="scn" class="cm-sel">${Object.entries(api.SCENARIOS).map(([k, l]) => `<option value="${k}"${k === s.scenario ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <div class="cm-row"><button type="button" data-m="guide">❓ Giải thích các thanh</button><button type="button" data-act="layout-c">🖥 CQG Desktop</button><button type="button" data-act="layout-d">🎓 DOMTrader</button></div>
        ${full() ? '<div class="cm-row"><button type="button" class="dn" data-m="exit">✕ Thoát về hệ thống</button></div>' : ''}</div>`; }
    else if (mv.sheet === 'guide') h = `<div class="cm-sh"><h4>❓ Các thanh chức năng</h4><ul class="cm-guide">
        <li><b>‹ / ▦</b> danh sách mã · chạm tên mã mờ hai bên (hoặc vuốt ngang đầu màn hình) để đổi kỳ hạn.</li>
        <li><b>Dải trạng thái:</b> vị thế đang giữ (Long/Short @ giá vốn) và OTE+P/L · số lệnh ĐANG CHỜ KHỚP · tài khoản. Vạch màu: giá đang ở đâu trong biên độ phiên.</li>
        <li><b>BIỂU ĐỒ:</b> "60 ▾" khung thời gian · kiểu (Dạng cột/Thanh nến/Đường…) · ┼ dấu thập · 👁 hộp O/H/L/C · ↕ về mới nhất · ⚙/＋ Nghiên cứu · ⇄ ẩn/hiện nút giao dịch. Cột phải: MUA/BÁN MKT, Khối lượng, Bán/Mua (lot chờ), 2 cặp nút đặt LMT tại bid/ask, số lượng −/+, STP (đổi sang lệnh dừng), Ngày/GTC.</li>
        <li><b>HOT:</b> thang giá – chạm ô MUA/BID để mua, BÁN/ASK để bán; chạm nhãn lệnh rồi chạm giá khác để sửa; × để hủy.</li>
        <li><b>TKT:</b> phiếu lệnh – MUA/BÁN, số lượng, giá (⏸ dừng chạy theo thị trường), LMT/STP/STL/MKT, giá STL, Ngày/GTC, có giá trị đến, nút nhanh @bid / @ask / @MKT, nút lớn để gửi.</li>
        <li><b>CÁC LỆNH (B:S):</b> Chờ khớp / Đã khớp / Đã hủy / Tất cả · chạm lệnh để sửa giá hoặc hủy · Hủy tất cả · Thoát trạng thái (hủy lệnh + đưa vị thế về 0).</li>
        <li><b>TRẠNG THÁI (L:S):</b> vị thế từng mã, OTE, P/L. <b>$</b>: tài khoản (Balance, NLV, Margin Excess…). <b>M & B:</b> các lần khớp gần nhất. <b>CHI TIẾT:</b> thông số hợp đồng, ngày cuối, ký quỹ.</li>
        <li><b>⋯</b> bài tập tình huống, chạy giá, giá thật, kịch bản, giao diện máy tính.</li></ul></div>`;
    sh.innerHTML = `<div class="cm-shbg" data-m="closesheet"></div><div class="cm-shbox">${h}</div>`;
  }
  function toast() {
    const s = A().s; const t = $('cmToast'); const top = s.log[0]; const key = top ? top.at + top.text : '';
    if (!top || key === mv.lastLog) return; const first = mv.lastLog === ''; mv.lastLog = key; if (first) return;
    t.hidden = false; t.className = 'cm-toast ' + (top.kind || ''); t.textContent = top.text; clearTimeout(mv.toastT); mv.toastT = setTimeout(() => { t.hidden = true; }, top.kind === 'bad' ? 5000 : 3000);
  }

  // ---------- Sự kiện ----------
  function onClick(e) {
    if (e.target.closest('[data-act="center"]')) { requestAnimationFrame(centerHot); return; }
    const b = e.target.closest('[data-m]'); if (!b || !$('simulatorRoot').contains(b)) return;
    const api = A(), s = api.s, m = api.mkt(s.sym), c = cm(), act = b.dataset.m, v = b.dataset.v;
    const done = () => { api.save(); paint(); };
    if (b.tagName === 'SELECT') return;
    switch (act) {
      case 'open': return open(true);
      case 'exit': case 'close': mv.sheet = null; return open(false);
      case 'toastx': clearTimeout(mv.toastT); b.hidden = true; return;
      case 'tab': mv.tab = v; mv.sheet = null; if (v === 'hot') mv.hotC = true; if (v === 'chart' && mv.chart) setTimeout(() => mv.chart.redraw(), 0); return done();
      case 'symlist': mv.sheet = mv.sheet === 'symlist' ? null : 'symlist'; return paint();
      case 'acct': mv.sheet = mv.sheet === 'acct' ? null : 'acct'; return paint();
      case 'more': mv.sheet = mv.sheet === 'more' ? null : 'more'; return paint();
      case 'guide': mv.sheet = 'guide'; return paint();
      case 'closesheet': mv.sheet = null; return paint();
      case 'sym': s.sym = v; mv.sheet = null; mv.hotC = true; mv.sel = ''; mv.tkt.px = null; mv.tkt.stl = null; api.view.center = null; return done();
      case 'hdact': if (mv.tab === 'tkt') { mv.tkt = { side: mv.tkt.side, type: 'LMT', px: null, follow: true, stl: null, gtd: '' }; return paint(); } return api.setRun(!api.timerOn());
      case 'tfmenu': mv.sheet = mv.sheet === 'tf' ? null : 'tf'; return paint();
      case 'stmenu': mv.sheet = mv.sheet === 'style' ? null : 'style'; return paint();
      case 'cmenu': mv.sheet = mv.sheet === 'cmenu' ? null : 'cmenu'; return paint();
      case 'studies': mv.sheet = 'studies'; return paint();
      case 'settf': c.tf = Number(v); mv.sheet = null; mv.chart.setTf(c.tf); return done();
      case 'setstyle': c.style = v; mv.sheet = null; mv.chart.setStyle(v); return done();
      case 'setstudy': c.studies = c.studies.includes(v) ? c.studies.filter(x => x !== v) : c.studies.concat(v); mv.chart.setStudies(c.studies); return done();
      case 'cross': c.cross = !c.cross; mv.chart.setCross(c.cross); return done();
      case 'legend': c.legend = !c.legend; mv.sheet = null; return done();
      case 'latest': mv.chart.latest(); return;
      case 'btns': c.btns = !c.btns; mv.sheet = null; done(); return setTimeout(() => mv.chart.redraw(), 0);
      case 'qty': s.qty = Math.max(1, Math.min(99, s.qty + Number(v))); return done();
      case 'stp': mv.stp = !mv.stp; return paint();
      case 'dur': s.dur = s.dur === 'GTC' ? 'DAY' : 'GTC'; return done();
      case 'mkt': return api.newOrder(v, 'MKT', 0);
      case 'at': return api.newOrder(v, mv.stp && mv.tab === 'chart' ? 'STP' : 'LMT', Number(b.dataset.p));
      case 'tside': mv.tkt.side = v; mv.tkt.px = null; mv.tkt.stl = null; return paint();
      case 'tpx': mv.tkt.follow = false; mv.tkt.px = (mv.tkt.px || m.last) + Number(v); return paint();
      case 'tfollow': mv.tkt.follow = !mv.tkt.follow; if (mv.tkt.follow) mv.tkt.px = null; return paint();
      case 'ttype': { const order = ['LMT', 'STP', 'STL', 'MKT']; mv.tkt.type = order[(order.indexOf(mv.tkt.type) + 1) % order.length]; mv.tkt.stl = null; return paint(); }
      case 'tstl': if (mv.tkt.type !== 'STL') return; mv.tkt.stl = (mv.tkt.stl || m.last) + Number(v); return paint();
      case 'gtd': { const x = prompt('Có giá trị đến (dd/mm/yyyy) – để trống nếu không dùng:', mv.tkt.gtd); if (x !== null) { mv.tkt.gtd = x.trim(); if (mv.tkt.gtd) s.dur = 'GTC'; } return done(); }
      case 'place': {
        const t = mv.tkt;
        if (t.type === 'MKT') return api.newOrder(t.side, 'MKT', 0);
        if (t.type === 'STL') return api.newOrder(t.side, 'STL', t.stl, undefined, undefined, { limit: t.px });
        return api.newOrder(t.side, t.type, t.px);
      }
      case 'seg': mv.seg = v; return paint();
      case 'osel': if (e.target.closest('button')) return; mv.sel = mv.sel === v ? '' : v; return paint();
      case 'omod': { const o = s.orders.find(x => x.id === mv.sel); if (o) api.modify(o, (o.type === 'STL' ? o.stop : o.px) + Number(v)); return; }
      case 'oact': { const o = s.orders.find(x => x.id === mv.sel); if (o) { o.wasParked = true; api.activate(o); } return; }
      case 'ocxl': { const o = s.orders.find(x => x.id === mv.sel); if (o) api.cancel(o); mv.sel = ''; return; }
      case 'cxlall': return api.cancelSide();
      case 'exitpos': return api.flatten();
      case 'flat': { const keep = s.sym; s.sym = v; api.flatten(); s.sym = keep; return; }
      case 'confirm': s.confirm = !s.confirm; return done();
      case 'park': s.park = !s.park; return done();
      default: return;
    }
  }
  // Đổi bài tập / kịch bản trong bảng "Thêm"
  document.addEventListener('change', e => {
    const el = e.target; if (!el.dataset || !el.dataset.m || !$('cmApp') || !$('cmApp').contains(el)) return;
    const api = A();
    if (el.dataset.m === 'lesson') { api.startLesson(el.value); mv.sheet = 'more'; return paint(); }
    if (el.dataset.m === 'scn') { api.s.scenario = el.value; api.log(`Kịch bản: ${api.SCENARIOS[el.value]}.`); api.save(); return paint(); }
  });
  // Vuốt ngang ở đầu màn hình để đổi mã (như CQG)
  function bindSwipe(host) {
    let sx = null;
    host.addEventListener('touchstart', e => { const h = e.target.closest('.cm-hd'); sx = h ? e.touches[0].clientX : null; }, { passive: true });
    host.addEventListener('touchend', e => {
      if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) < 50) return;
      const api = A(), syms = api.symbols(), i = syms.indexOf(api.s.sym), j = i + (dx < 0 ? 1 : -1);
      if (j >= 0 && j < syms.length) { api.s.sym = syms[j]; api.view.center = null; mv.hotC = true; mv.tkt.px = null; api.save(); paint(); }
    }, { passive: true });
  }
  window.VTSimM = { paint, open, ISIN };
})();

// VIỆT THIÊN — Sàn giả lập: giao diện máy tính kiểu CQG Desktop (workspace nhiều khung), dựng theo ảnh CQG Desktop anh Huy gửi.
// Khung: HOT (thang giá cột Bid xanh / Ask đỏ; BUY/SELL n MKT, ô giá Ask/Bid lớn, STP▾ DAY▾ OCO P TSTP, size) · Bảng giá
// · Biểu đồ (5 Min ▾ Candles ▾ studies ▾) · Working/Filled Orders · Open Positions / Purchase & Sales · Account Summary (4 ô)
// · thêm khung "Giá hàng thật FOB/CIF" của Việt Thiên (Futures ± Differential → FOB → CFR → CIF, quy đổi đ/kg, lãi gộp, số lot phòng hộ).
// Dùng chung lõi lệnh / vị thế / tài khoản với simulator.js (window.VTSim). Không kết nối CQG/MXV, không gửi lệnh thật, không dùng logo CQG.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const A = () => window.VTSim;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const TFS = [[60, '1 Min'], [300, '5 Min'], [600, '10 Min'], [900, '15 Min'], [1800, '30 Min'], [3600, '60 Min'], [86400, 'Daily'], [604800, 'Weekly'], [2592000, 'Monthly']];
  const STY = { bar: 'Bars', candle: 'Candles', hollow: 'Hollow Candles', volcandle: 'Volume Candles', line: 'Line', area: 'Area', ha: 'Heikin-Ashi' };
  const ROW_H = 24;   // chiều cao 1 mức giá trên thang HOT (px)
  const dv = { rowH: ROW_H, built: false, chart: null, ord: 'working', pos: 'open', chtab: 'chart', menu: null, modal: null, mdata: '', mkey: '', ckey: '', lkey: '', skey: '', lastLog: '', full: false, N: 12, flashT: 0 };
  const cd = () => { const s = A().s; if (!s.cd) s.cd = { tf: 300, style: 'candle', studies: ['vol', 'bb'], cross: true, legend: true }; return s.cd; };
  const calc = () => { const s = A().s; if (!s.calc) s.calc = { sym: '', fut: null, diff: -120, freight: 85, ins: 8, qty: 38.4, cost: 0, fobc: 0 }; return s.calc; };
  const desc = sym => { const q = window.VTEngine.parseQuoteName(sym); return q ? `Robusta Coffee: ${MONTHS[q.month - 1]} ${q.year}` : sym; };
  const kfmt = n => (n >= 1000 ? (Math.round(n / 100) / 10).toLocaleString('en-US') + 'K' : String(n));
  const num = (n, d) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d === undefined ? 2 : d, minimumFractionDigits: 0 });
  const isin = sym => ((window.VTSimM && window.VTSimM.ISIN) || {})[sym] || '—';

  // ---------- Dựng khung ----------
  function build() {
    const host = $('simulatorRoot'); if (!host) return;
    const api = A(), s = api.s;
    host.innerHTML = `<div class="cd-host"><div class="cd" id="cdApp">
      <div class="cd-top">
        <span class="cd-logo" title="Sàn giả lập của Việt Thiên – không phải phần mềm CQG">VIETTHIEN<b>SIM</b></span>
        <span class="cd-demo" title="Tài khoản giả lập – không có tiền thật">DEMO<b data-d="focus" data-v="cdAcctW">$</b></span>
        <span class="cd-clock" id="cdClock"></span><span class="cd-feedtag" id="cdFeedTag"></span>
        <span class="cd-grow"></span>
        <select id="dtLesson" class="cd-sel cd-lesson" aria-label="Bài tập tình huống"></select>
        <button type="button" class="cd-tb" data-act="run" id="cdRun"></button>
        <button type="button" class="cd-tb" data-act="feed" id="cdFeed"></button>
        <button type="button" class="cd-tb" data-act="eod" title="Hết phiên: lệnh DAY hết hiệu lực">⏭ Hết phiên</button>
        <button type="button" class="cd-tb" data-d="modal" data-v="guide" title="Giải thích các khung">❓ Giải thích</button>
        <button type="button" class="cd-tb" data-d="full" id="cdFullBtn" title="Toàn màn hình như CQG Desktop">⛶</button>
        <button type="button" class="cd-tb" data-act="layout-d" title="Giao diện DOMTrader có hướng dẫn từng bước và bảng so sánh với CQG thật">🎓 DOMTrader</button>
        <button type="button" class="cd-tb" data-act="layout-m" title="Giao diện app CQG trên điện thoại">📱</button>
        <span class="cd-user">👤 ${api.esc(s.acct)}</span><span class="cd-ps" id="cdPS"></span>
      </div>
      <div class="cd-coachw" id="cdCoach" hidden></div>
      <div class="cd-main">
        <nav class="cd-rail" aria-label="Công cụ">
          <button type="button" data-d="focus" data-v="cdQuoteW" title="Bảng giá">▦</button>
          <button type="button" data-d="focus" data-v="cdChartW" title="Biểu đồ">📈</button>
          <button type="button" data-d="focus" data-v="cdOrdW" title="Lệnh">⇄</button>
          <button type="button" data-d="focus" data-v="cdCalcW" title="Giá hàng thật FOB/CIF">⚖</button>
          <button type="button" data-d="focus" data-v="cdPosW" title="Vị thế">◯</button>
          <span class="cd-grow"></span>
          <button type="button" data-d="modal" data-v="keys" title="Phím tắt trên thang giá">⌨</button>
          <button type="button" data-d="modal" data-v="set" title="Thông số giả lập (ký quỹ, phí, tỷ giá, kịch bản)">⚙</button>
          <button type="button" data-d="modal" data-v="log" title="Nhật ký lệnh">☰</button>
          <button type="button" data-d="modal" data-v="guide" title="Hướng dẫn">?</button>
        </nav>
        <section class="cd-w cd-hot" id="cdHotW">
          <header class="cd-wh"><span class="cd-wt" id="cdHotT"></span><i class="cd-dot"></i><span class="cd-grow"></span><span class="cd-dim" id="cdHotN"></span></header>
          <div class="cd-sub"><span>👤 ${api.esc(s.acct)} ▾</span><span class="cd-grow"></span><span id="cdHotPos"></span></div>
          <div class="cd-hotbody">
            <div class="cd-ladder" id="dtLadder" tabindex="0" aria-label="Thang giá HOT – bấm cột xanh để MUA, cột đỏ để BÁN; bấm vào thang rồi dùng phím"><table><tbody id="dtRows"></tbody></table></div>
            <div class="cd-hside">
              <div class="cd-mini" id="cdMini"></div>
              <button type="button" class="cd-bmkt" data-act="bmkt" id="cdBmkt"></button>
              <button type="button" class="cd-smkt" data-act="smkt" id="cdSmkt"></button>
              <div class="cd-mini" id="cdMini2"></div>
              <button type="button" class="cd-big ask" data-d="hit" data-v="BUY" id="cdAskB" title="MUA LMT tại giá Ask – khớp ngay nếu còn người chào bán"></button>
              <button type="button" class="cd-big bid" data-d="hit" data-v="SELL" id="cdBidB" title="BÁN LMT tại giá Bid – khớp ngay nếu còn người chờ mua"></button>
              <div class="cd-2"><select id="dtType" class="cd-sel" title="Lệnh dừng khi bấm phía trên giá (mua) / dưới giá (bán): STP hay STL"><option value="AUTO">STP</option><option value="STL">STL</option></select>
                <select id="dtDur" class="cd-sel" title="Thời hạn lệnh"><option>DAY</option><option>GTC</option></select></div>
              <select class="cd-sel" disabled title="OCO: một lệnh khớp thì tự hủy lệnh kia – CQG thật có, giả lập chưa mô phỏng"><option>OCO</option></select>
              <label class="cd-chk" title="Park: lệnh nằm chờ trên máy, chưa gửi lên sàn"><input type="checkbox" id="dtPark"> P · Park</label>
              <select class="cd-sel" disabled title="TSTP (trailing stop) – CQG thật có, giả lập chưa mô phỏng"><option>TSTP</option></select>
              <div class="cd-size"><button type="button" data-d="qty" data-v="-1" aria-label="Giảm số lot">▾</button><div><b id="cdSize"></b><small>size</small></div><button type="button" data-d="qty" data-v="1" aria-label="Tăng số lot">▴</button></div>
              <div class="cd-qs" id="cdQs">${[1, 4, 10].map(q => `<button type="button" data-qty="${q}">${q}</button>`).join('')}</div>
              <label class="cd-chk"><input type="checkbox" id="dtConfirmOn"> Xác nhận lệnh</label>
              <label class="cd-chk" title="Tắt: bấm thang chỉ chọn giá, đặt lệnh bằng phím ←/→ hoặc kéo-thả"><input type="checkbox" id="dtFast"> Fast-click</label>
              <div class="cd-2"><button type="button" class="cd-sb" data-act="cxlb">Cxl Buys</button><button type="button" class="cd-sb" data-act="cxls">Cxl Sells</button></div>
              <div class="cd-2"><button type="button" class="cd-sb" data-act="cxl">Cxl All</button><button type="button" class="cd-sb" data-act="flat">Flatten</button></div>
              <button type="button" class="cd-sb" data-act="rev">Reverse</button>
            </div>
          </div>
          <footer class="cd-wf"><select id="cdSym" class="cd-sel" aria-label="Mã hợp đồng"></select><button type="button" class="cd-ib" data-d="modal" data-v="spec" title="Thông số hợp đồng">ⓘ</button><span class="cd-grow cd-dim" id="cdMode"></span><button type="button" class="cd-ib" data-act="center" title="Center – đưa thang về giá thị trường">↻</button></footer>
        </section>
        <div class="cd-col cd-mid">
          <section class="cd-w cd-quote" id="cdQuoteW">
            <header class="cd-wh"><span class="cd-wt">📖 Robusta London</span><i class="cd-dot"></i><span class="cd-grow"></span><span class="cd-dim">bấm dòng để chọn mã</span></header>
            <div class="cd-qhead"><b id="cdQsym"></b><span class="cd-grow"></span><button type="button" class="cd-ib" data-d="ticket" data-v="" title="Phiếu lệnh (Order Ticket)">✎</button><button type="button" class="cd-qb buy" data-d="ticket" data-v="BUY">BUY</button><button type="button" class="cd-qb sell" data-d="ticket" data-v="SELL">SELL</button></div>
            <div class="cd-tscroll"><table class="cd-qt"><thead><tr><th>Symbol</th><th title="Giá khớp gần nhất">T/S</th><th title="Thay đổi so với giá mở cửa">ΔT</th><th title="Số lot chờ ở giá mua tốt nhất">VB</th><th title="Giá mua tốt nhất (Bid)">B</th><th title="Giá bán tốt nhất (Ask)">A</th><th title="Số lot chờ ở giá bán tốt nhất">VA</th><th>H</th><th>Lo</th><th title="Tổng khối lượng khớp">V Tot</th></tr></thead><tbody id="cdQuote"></tbody></table></div>
          </section>
          <section class="cd-w cd-chartw" id="cdChartW">
            <header class="cd-wh cd-tabs"><button type="button" data-d="chtab" data-v="chart">Chart</button><button type="button" data-d="chtab" data-v="spec">CSpec</button><span class="cd-grow"></span>
              <button type="button" class="cd-dd" data-d="menu" data-v="tf" id="cdTf"></button><button type="button" class="cd-dd" data-d="menu" data-v="style" id="cdSty"></button><button type="button" class="cd-dd" data-d="menu" data-v="studies" id="cdStd"></button></header>
            <div class="cd-chartbox"><div class="cd-chart" id="cdChart"></div><div class="cd-spec" id="cdSpec" hidden></div></div>
            <footer class="cd-wf"><b id="cdChSym"></b><button type="button" class="cd-ib" data-d="modal" data-v="spec" title="Thông số hợp đồng">ⓘ</button><button type="button" class="cd-ib" data-d="cross" id="cdCross" title="Dấu thập">┼</button><button type="button" class="cd-ib" data-d="legend" id="cdLeg" title="Hộp O/H/L/C">👁</button><button type="button" class="cd-ib" data-d="latest" title="Về thanh mới nhất">↕</button><span class="cd-grow cd-dim" id="cdChSrc"></span></footer>
          </section>
        </div>
        <div class="cd-col cd-right">
          <section class="cd-w cd-ord" id="cdOrdW"><header class="cd-wh cd-tabs" id="cdOrdTabs"></header><div class="cd-tscroll"><table class="cd-t" id="cdOrd"></table></div></section>
          <section class="cd-w cd-calcw" id="cdCalcW">
            <header class="cd-wh"><span class="cd-wt">⚖ Giá hàng thật · FOB / CIF</span><i class="cd-dot"></i><span class="cd-grow"></span><span class="cd-dim">USD/tấn</span></header>
            <div class="cd-calc">
              <label>Kỳ hạn tham chiếu<select id="cfSym" class="cd-sel"></select></label>
              <label><span>Futures <span class="cd-follow"><input type="checkbox" id="cfFollow"> theo sàn</span></span><input id="cfFut" class="cd-in" type="number" inputmode="decimal" step="1"></label>
              <label title="Trừ lùi (dưới giá sàn) nhập số âm, cộng thêm nhập số dương">Differential ±<input id="cfDiff" class="cd-in" type="number" inputmode="decimal" step="1"></label>
              <label>Freight – cước tàu<input id="cfFreight" class="cd-in" type="number" inputmode="decimal" step="1"></label>
              <label title="Thường ≈ 0,1–0,3% giá CIF">Insurance – bảo hiểm<input id="cfIns" class="cd-in" type="number" inputmode="decimal" step="1"></label>
              <label>Khối lượng (tấn)<input id="cfQty" class="cd-in" type="number" inputmode="decimal" step="0.1"></label>
              <label title="Để 0 nếu chưa cần tính lãi">Giá mua nội địa (đ/kg)<input id="cfCost" class="cd-in" type="number" inputmode="numeric" step="100"></label>
              <label title="Chế biến, đóng gói, vận chuyển ra cảng, thủ tục…">Chi phí tới FOB (USD/t)<input id="cfFobc" class="cd-in" type="number" inputmode="decimal" step="1"></label>
              <label>Tỷ giá USD (đ)<input id="cfFx" class="cd-in" type="number" inputmode="numeric" step="10"></label>
            </div>
            <div class="cd-res3"><div class="cd-res fob"><span>FOB = Futures + Diff</span><b id="cfFob"></b></div><div class="cd-res"><span>CFR = FOB + cước</span><b id="cfCfr"></b></div><div class="cd-res cif"><span>CIF = CFR + bảo hiểm</span><b id="cfCif"></b></div></div>
            <div class="cd-calcout" id="cfOut"></div>
            <div class="cd-hedge" id="cfHedge"></div>
          </section>
          <section class="cd-w cd-posw" id="cdPosW"><header class="cd-wh cd-tabs" id="cdPosTabs"></header><div class="cd-tscroll"><table class="cd-t" id="cdPos"></table></div></section>
        </div>
      </div>
      <section class="cd-w cd-acct" id="cdAcctW"><header class="cd-wh"><span class="cd-wt">Account Summary</span><i class="cd-dot"></i><span class="cd-dim">${api.esc(s.acct)} · tiền mô phỏng (VND) – không phải tiền thật</span><span class="cd-grow"></span><button type="button" class="cd-sb" data-act="dep">+ Nạp 300 triệu</button></header><div class="cd-boxes" id="cdAcct"></div></section>
      <div class="cd-status" id="cdStatus" data-d="modal" data-v="log" title="Bấm để xem toàn bộ nhật ký"></div>
      <div class="cd-menu" id="cdMenu" hidden></div>
      <div class="cd-modal" id="cdModal" hidden></div>
    </div></div>`;
    const c = cd();
    dv.chart = window.VTOhlc ? window.VTOhlc.mount($('cdChart'), { toolbar: false, tf: c.tf, style: c.style, studies: c.studies, cross: c.cross, legend: c.legend ? api.mxv(s.sym) : '', height: () => Math.max(200, ($('cdChart') && $('cdChart').clientHeight) || 300) }) : null;
    if (!host.dataset.cdBound) {
      host.dataset.cdBound = '1';
      host.addEventListener('click', onClick);
      host.addEventListener('change', onChange);
      host.addEventListener('input', onInput);
      window.addEventListener('resize', () => { if (!$('cdApp')) return; fit(); if (dv.chart) dv.chart.redraw(); paint(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('cdApp') && (dv.modal || dv.menu) && !A().view.pending) { dv.modal = null; closeMenu(); paint(); } });
    }
    api.bindLadder();   // phím CQG + lăn chuột + kéo-thả trên thang HOT (dùng chung với DOMTrader)
    dv.built = true; dv.mkey = dv.ckey = dv.lkey = dv.skey = ''; dv.lastLog = '';
    fit();
  }
  function fit() {   // cao vừa màn hình (trừ thanh tiêu đề + thanh thẻ của hệ thống đang dính trên cùng)
    const app = $('cdApp'); if (!app || dv.full) return;
    const tb = document.querySelector('.tab-bar'); const top = tb ? Math.min(160, Math.max(0, tb.getBoundingClientRect().bottom)) : 0;
    app.style.height = Math.max(700, window.innerHeight - top - 14) + 'px';
  }

  // ---------- Vẽ ----------
  function paint() {
    const host = $('simulatorRoot'); if (!host) return;
    if (!dv.built || !$('cdApp')) build();
    paintTop(); paintQuote(); paintOrders(); paintPos(); paintCalc(); paintAcct(); paintStatus();
    paintHot(); paintChart(); paintModal();   // thang & biểu đồ vẽ sau cùng: chiều cao phụ thuộc các khung khác đã có nội dung
  }
  function paintTop() {
    const api = A(), s = api.s, m = api.mkt(s.sym), a = api.account();
    $('cdClock').textContent = api.clock();
    $('cdFeedTag').innerHTML = s.feed === 'live' ? `<b class="cd-live">📡 LIVE London${m.liveAt ? ' ' + m.liveAt : ''}${api.londonOpen() ? '' : ' · sàn nghỉ'}</b>` : '<span class="cd-dim">giá mô phỏng</span>';
    $('cdRun').textContent = api.timerOn() ? '⏸ Dừng giá' : '▶ Chạy giá'; $('cdRun').classList.toggle('on', api.timerOn());
    $('cdFeed').textContent = s.feed === 'live' ? '🎲 Về mô phỏng' : '📡 Giá thật'; $('cdFeed').classList.toggle('on', s.feed === 'live');
    let L = 0, S = 0; Object.values(a.b).forEach(g => { if (g.pos > 0) L += g.pos; else if (g.pos < 0) S -= g.pos; });
    const wk = s.orders.filter(o => api.LIVE.includes(o.status)).length;
    $('cdPS').innerHTML = `<span>O: <b>${wk}</b></span><span>P: <b>${L}</b>L,<b>${S}</b>S</span>`;
    const sel = $('dtLesson'); const key = Object.keys(api.LESSONS).join();
    if (sel.dataset.k !== key) { sel.dataset.k = key; sel.innerHTML = `<option value="">🎯 Bài tập: tập tự do</option>${Object.entries(api.LESSONS).map(([k, x]) => `<option value="${k}">🎯 ${api.esc(x.title)}</option>`).join('')}`; }
    if (document.activeElement !== sel) sel.value = s.lesson || '';
    // Huấn luyện viên (khi đang làm bài)
    const Lz = api.LESSONS[s.lesson]; const cw = $('cdCoach'); cw.hidden = !Lz;
    if (Lz) { const ch = api.coach(); const k = s.lesson + ch.ok + ch.html;
      if (k !== dv.lkey) { dv.lkey = k; const open = cw.querySelector('details') ? cw.querySelector('details').open : true;
        cw.innerHTML = `<details${open ? ' open' : ''}><summary>🎯 <b>${api.esc(Lz.title)}</b> – ${ch.ok ? '✅ Đạt' : 'đang làm'} <span class="cd-dim">(bấm để thu gọn)</span></summary><p class="dt-brief">${api.esc(Lz.brief)}</p><div class="dt-coach ${ch.ok ? 'ok' : ''}">${ch.html}</div></details>`; } }
  }
  function paintHot() {
    const api = A(), s = api.s, m = api.mkt(s.sym), v = api.view, a = api.account(), g = a.b[s.sym] || { pos: 0, avg: 0 };
    const lad = $('dtLadder'); const h = lad.clientHeight || 600; let N = Math.max(8, Math.floor((h / dv.rowH - 1) / 2));
    if (v.center !== null && v.mode !== 'browse' && Math.abs(m.last - v.center) > N - 3) v.center = null;   // giá chạy ra rìa thang → canh lại giữa
    $('dtRows').innerHTML = api.rowsHtml(N);
    const tr = $('dtRows').firstElementChild; const rh = tr ? tr.getBoundingClientRect().height : 0;   // đo chiều cao dòng thật (gồm viền) → thang vừa khít khung
    if (rh && Math.abs(rh - dv.rowH) > 0.4) { dv.rowH = rh; const n2 = Math.max(8, Math.floor((h / rh - 1) / 2)); if (n2 !== N) { N = n2; $('dtRows').innerHTML = api.rowsHtml(N); } }
    dv.N = N;
    $('cdHotT').textContent = `${api.mxv(s.sym)} HOT`; $('cdHotN').textContent = `${2 * N + 1} mức`;
    const ote = g.pos ? (m.last - g.avg) * api.LOT_T * g.pos : 0;
    $('cdHotPos').innerHTML = g.pos ? `Pos <b class="${g.pos > 0 ? 'up' : 'dn'}">${api.sg(g.pos, String)}</b> @ ${api.px(Math.round(g.avg * 10) / 10)} · OTE <b class="${ote >= 0 ? 'up' : 'dn'}">${api.sg(Math.round(ote), api.px)}</b> USD` : 'Pos 0';
    const ch = m.last - m.open;
    $('cdMini').innerHTML = `<div><b class="${ch >= 0 ? 'up' : 'dn'}">${api.px(m.last)}■</b><span class="${ch >= 0 ? 'up' : 'dn'}">${api.sg(ch, api.px)}</span></div><div><span>H ${api.px(m.high)}</span><span>${kfmt(m.tv)}</span></div><div><span>L ${api.px(m.low)}</span><span>B/A: ${m.ask - m.bid}</span></div>`;
    $('cdMini2').innerHTML = `<div><span>Bid ${api.depth(m.bid, m)}</span><span>Ask ${api.depth(m.ask, m)}</span></div>`;
    $('cdBmkt').textContent = `BUY ${s.qty} MKT`; $('cdSmkt').textContent = `SELL ${s.qty} MKT`;
    $('cdAskB').innerHTML = `<span>${api.px(m.ask)}<sup>A</sup></span><small>${api.depth(m.ask, m)}</small>`;
    $('cdBidB').innerHTML = `<span>${api.px(m.bid)}<sup>B</sup></span><small>${api.depth(m.bid, m)}</small>`;
    const setv = (id, val, prop) => { const el = $(id); if (el && document.activeElement !== el) el[prop || 'value'] = val; };
    setv('dtType', s.otype); setv('dtDur', s.dur); setv('dtPark', !!s.park, 'checked'); setv('dtConfirmOn', !!s.confirm, 'checked'); setv('dtFast', !!s.fast, 'checked');
    $('cdSize').textContent = s.qty; $('cdQs').querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.qty) === s.qty));
    const syms = api.symbols(); const ss = $('cdSym'); const key = syms.join();
    if (ss.dataset.k !== key) { ss.dataset.k = key; ss.innerHTML = syms.map(x => `<option value="${x}">${api.mxv(x)} · ${x}</option>`).join(''); }
    setv('cdSym', s.sym);
    const selO = s.orders.find(o => o.id === v.selOrder);
    $('cdMode').innerHTML = selO ? `Đang chọn lệnh #${selO.num} – ↑↓ dời giá, Enter gửi sửa, Delete hủy` : v.mode === 'browse' && v.sel !== null ? `Price-browse @ ${api.px(v.sel)} – ← MUA / → BÁN · Esc về Market` : `Market mode · ${api.timerOn() ? '▶ giá đang chạy' : '⏸ giá đứng'}`;
  }
  function paintQuote() {
    const api = A(), s = api.s;
    $('cdQsym').innerHTML = `${api.mxv(s.sym)} <span class="cd-dim">${desc(s.sym)} · ICE ${s.sym}</span>`;
    $('cdQuote').innerHTML = api.symbols().map(sym => { const m = api.mkt(sym); const ch = m.last - m.open;
      return `<tr data-sym="${sym}" class="${sym === s.sym ? 'on' : ''}"><td><b>${api.mxv(sym)}</b><small>${desc(sym)}</small></td><td>${api.px(m.last)}</td><td class="cd-chg ${ch > 0 ? 'up' : ch < 0 ? 'dn' : ''}">${ch ? api.sg(ch, api.px) : '0'}</td>`
        + `<td>${api.depth(m.bid, m)}</td><td>${api.px(m.bid)}</td><td>${api.px(m.ask)}</td><td>${api.depth(m.ask, m)}</td><td>${api.px(m.high)}</td><td>${api.px(m.low)}</td><td>${kfmt(m.tv)}</td></tr>`; }).join('');
  }
  function paintChart() {
    const api = A(), s = api.s, c = cd();
    const tfl = (TFS.find(t => t[0] === c.tf) || [0, c.tf + 's'])[1];
    $('cdTf').textContent = `${tfl} ▾`; $('cdSty').textContent = `${STY[c.style] || c.style} ▾`;
    const ns = c.studies.length; $('cdStd').textContent = `${ns} stud${ns === 1 ? 'y' : 'ies'} ▾`;
    $('cdCross').classList.toggle('on', !!c.cross); $('cdLeg').classList.toggle('on', !!c.legend);
    $('cdChSym').textContent = `${api.mxv(s.sym)} · ${tfl}`;
    $('cdChartW').querySelectorAll('[data-d="chtab"]').forEach(b => b.classList.toggle('on', b.dataset.v === dv.chtab));
    const spec = dv.chtab === 'spec'; $('cdSpec').hidden = !spec; $('cdChart').style.visibility = spec ? 'hidden' : '';
    if (spec) { const k = s.sym + s.imUsd + s.mmUsd; if (dv.skey !== k) { dv.skey = k; $('cdSpec').innerHTML = specHtml(s.sym); } }
    const d = api.chartData(s.sym);
    $('cdChSrc').textContent = d.src === 'live' ? '📡 giá London thật (thanh 5 phút máy chủ ghi)' : 'giá mô phỏng · ▲▼ điểm bạn khớp lệnh';
    if (dv.chart) { dv.chart.setLegend(c.legend ? api.mxv(s.sym) : ''); dv.chart.setData(d.bars, d.base, d.note, d.marks); }
  }
  function paintOrders() {
    const api = A(), s = api.s;
    const live = o => api.LIVE.includes(o.status) || o.status === 'PARKED';
    const tabs = [['working', 'Working Orders'], ['filled', 'Filled Orders'], ['cancelled', 'Cancelled'], ['all', 'All']];
    const nW = s.orders.filter(live).length, nR = s.orders.filter(o => o.status === 'REJECTED').length;
    $('cdOrdTabs').innerHTML = tabs.map(([k, l]) => `<button type="button" data-d="ord" data-v="${k}" class="${dv.ord === k ? 'on' : ''}">${l}${k === 'working' && nW ? ` <span class="cd-badge">${nW}</span>` : ''}${k === 'cancelled' && nR ? ` <span class="cd-badge dn">${nR}</span>` : ''}</button>`).join('')
      + `<span class="cd-grow"></span><button type="button" class="cd-ib" data-act="cxl" title="Hủy tất cả lệnh chờ">✖ All</button>`;
    const pick = { working: live, filled: o => o.filled > 0, cancelled: o => ['CANCELED', 'EXPIRED', 'REJECTED'].includes(o.status), all: () => true }[dv.ord];
    const list = s.orders.filter(pick).slice().reverse();
    const ordP = o => (o.type === 'MKT' ? 'MKT' : o.type === 'STL' ? `${api.px(o.stop)} / ${api.px(o.px)}` : api.px(o.px));
    $('cdOrd').innerHTML = `<thead><tr><th></th><th>Status</th><th>B/S</th><th>Qty</th><th>UnFld</th><th>Symbol</th><th>Ord P</th><th>Type</th><th>Dur</th><th>Fill P</th><th>Time</th></tr></thead><tbody>`
      + (list.length ? list.map(o => { const lv = live(o);
        return `<tr class="${o.status === 'REJECTED' ? 'rej' : ''}"><td class="cd-oa">${lv ? `<button type="button" data-cxl="${o.id}" title="Hủy lệnh">✖</button>${o.type !== 'MKT' ? `<button type="button" data-mod="${o.id}" title="Sửa giá">✎</button>` : ''}${o.status === 'PARKED' ? `<button type="button" data-actv="${o.id}" title="Kích hoạt – gửi lên sàn">▶</button>` : ''}` : ''}<button type="button" data-d="oinfo" data-v="${o.id}" title="Chi tiết lệnh">ⓘ</button></td>`
          + `<td class="l"><span class="cd-st st-${o.status.replace(/ /g, '-').toLowerCase()}" title="FIX OrdStatus: ${api.esc(api.FIX[o.status] || '')}">${api.STATUS[o.status] || o.status}</span></td><td class="l ${o.side === 'BUY' ? 'up' : 'dn'}">${o.side}</td><td>${o.qty}</td><td>${o.qty - o.filled}</td>`
          + `<td class="l">${api.mxv(o.sym)}</td><td>${ordP(o)}</td><td class="l">${o.type}</td><td class="l">${o.dur}</td><td>${o.filled ? api.px(Math.round(o.avg * 10) / 10) : ''}</td><td>${o.at}</td></tr>`; }).join('')
        : `<tr><td colspan="11" class="cd-empty">${{ working: 'Không có lệnh chờ khớp', filled: 'Chưa có lệnh khớp', cancelled: 'Không có lệnh hủy / bị từ chối', all: 'Chưa có lệnh – bấm cột xanh (mua) hoặc đỏ (bán) trên thang HOT' }[dv.ord]}</td></tr>`) + '</tbody>';
  }
  function paintPos() {
    const api = A(), s = api.s, a = api.account();
    $('cdPosTabs').innerHTML = [['open', 'Open Positions'], ['ps', 'Purchase & Sales']].map(([k, l]) => `<button type="button" data-d="pos" data-v="${k}" class="${dv.pos === k ? 'on' : ''}">${l}</button>`).join('');
    if (dv.pos === 'open') {
      const rows = Object.entries(a.b).filter(([, g]) => g.pos); let tot = 0;
      $('cdPos').innerHTML = `<thead><tr><th></th><th>Sym</th><th>L</th><th>S</th><th>Avg</th><th>Cur</th><th>OTE/UPL</th><th>Desc</th></tr></thead><tbody>`
        + (rows.length ? rows.map(([sym, g]) => { const m = api.mkt(sym); const ote = (m.last - g.avg) * api.LOT_T * g.pos; tot += ote;
          return `<tr><td class="cd-oa"><button type="button" data-d="flat" data-v="${sym}" title="Flatten – hủy lệnh chờ và đưa vị thế về 0">✖</button><button type="button" data-d="rev" data-v="${sym}" title="Reverse – đảo chiều vị thế">⇅</button></td>`
            + `<td class="l cd-link" data-sym="${sym}">${api.mxv(sym)}</td><td class="up">${g.pos > 0 ? g.pos : ''}</td><td class="dn">${g.pos < 0 ? -g.pos : ''}</td><td>${api.px(Math.round(g.avg * 100) / 100)}</td><td class="l">USD</td><td class="${ote >= 0 ? 'up' : 'dn'}">${api.sg(Math.round(ote), api.px)}</td><td class="l cd-dim">${desc(sym)}</td></tr>`; }).join('')
          + `<tr class="cd-tot"><td></td><td class="l" colspan="5">Tổng OTE (lãi/lỗ đang mở)</td><td class="${tot >= 0 ? 'up' : 'dn'}">${api.sg(Math.round(tot), api.px)}</td><td class="l cd-dim">≈ ${api.sg(Math.round(tot * s.fx), api.vnd)} đ</td></tr>`
          : '<tr><td colspan="8" class="cd-empty">Không có trạng thái (vị thế = 0)</td></tr>') + '</tbody>';
    } else {
      const rt = api.roundTrips().slice().reverse(); const tot = rt.reduce((n, r) => n + r.pl, 0);
      $('cdPos').innerHTML = `<thead><tr><th>Sym</th><th>Vào</th><th>Qty</th><th>Giá vào</th><th>Giá ra</th><th>P/L (USD)</th><th>Giờ</th></tr></thead><tbody>`
        + (rt.length ? rt.map(r => `<tr><td class="l">${api.mxv(r.sym)}</td><td class="l ${r.side === 'BUY' ? 'up' : 'dn'}">${r.side}</td><td>${r.qty}</td><td>${api.px(r.inPx)}</td><td>${api.px(r.outPx)}</td><td class="${r.pl >= 0 ? 'up' : 'dn'}">${api.sg(Math.round(r.pl), api.px)}</td><td>${r.inAt}→${r.outAt}</td></tr>`).join('')
          + `<tr class="cd-tot"><td class="l" colspan="5">Tổng P/L đã chốt (chưa trừ phí)</td><td class="${tot >= 0 ? 'up' : 'dn'}">${api.sg(Math.round(tot), api.px)}</td><td class="cd-dim">${rt.filter(r => r.pl > 0).length} thắng / ${rt.filter(r => r.pl < 0).length} thua</td></tr>`
          : '<tr><td colspan="7" class="cd-empty">Chưa có cặp mua–bán nào đóng</td></tr>') + '</tbody>';
    }
  }
  function calcVals() {
    const api = A(), s = api.s, c = calc(); const sym = c.sym && api.symbols().includes(c.sym) ? c.sym : s.sym;
    const fut = c.fut === null ? api.mkt(sym).last : c.fut; const fob = fut + c.diff, cfr = fob + c.freight, cif = cfr + c.ins;
    return { sym, fut, fob, cfr, cif, lots: c.qty / api.LOT_T };
  }
  function paintCalc() {
    const api = A(), s = api.s, c = calc(), r = calcVals();
    const setv = (id, val) => { const el = $(id); if (el && document.activeElement !== el) el.value = val; };
    const cs = $('cfSym'); const syms = api.symbols(); const key = syms.join();
    if (cs.dataset.k !== key) { cs.dataset.k = key; cs.innerHTML = `<option value="">Theo mã đang chọn</option>${syms.map(x => `<option value="${x}">${api.mxv(x)} · ${x}</option>`).join('')}`; }
    setv('cfSym', c.sym && syms.includes(c.sym) ? c.sym : '');
    setv('cfFut', r.fut); $('cfFollow').checked = c.fut === null; $('cfFut').classList.toggle('follow', c.fut === null);
    setv('cfDiff', c.diff); setv('cfFreight', c.freight); setv('cfIns', c.ins); setv('cfQty', c.qty); setv('cfCost', c.cost || ''); setv('cfFobc', c.fobc || ''); setv('cfFx', s.fx);
    $('cfFob').textContent = num(r.fob); $('cfCfr').textContent = num(r.cfr); $('cfCif').textContent = num(r.cif);
    const kg = v => api.vnd(Math.round(v * s.fx / 1000)); const nl = Math.floor(r.lots + 1e-9); const odd = Math.round((r.lots - nl) * api.LOT_T * 10) / 10;
    let out = `<div>Lô ${num(c.qty)} tấn: FOB <b>${num(Math.round(r.fob * c.qty))}</b> USD · CIF <b>${num(Math.round(r.cif * c.qty))}</b> USD</div>`
      + `<div>FOB ≈ <b>${kg(r.fob)} đ/kg</b> · CIF ≈ ${kg(r.cif)} đ/kg <span class="cd-dim">(tỷ giá ${api.vnd(s.fx)})</span></div>`
      + `<div>= <b>${num(r.lots, 2)} lot</b> ${api.mxv(r.sym)} (10 tấn/lot) → phòng hộ được <b>${nl} lot</b>${odd ? ` · ${num(odd)} tấn lẻ không phòng hộ được` : ''}</div>`;
    if (c.cost > 0) { const costUsd = c.cost * 1000 / s.fx + (c.fobc || 0); const pl = r.fob - costUsd;
      out += `<div>Giá vốn tới FOB ≈ ${num(Math.round(costUsd * 10) / 10)} USD/t → lãi gộp <b class="${pl >= 0 ? 'up' : 'dn'}">${api.sg(Math.round(pl), api.px)} USD/t</b> · cả lô ${api.sg(Math.round(pl * c.qty), api.px)} USD ≈ ${api.sg(Math.round(pl * c.qty * s.fx), api.vnd)} đ</div>`; }
    $('cfOut').innerHTML = out;
    $('cfHedge').innerHTML = nl ? `<button type="button" class="cd-sb buy" data-d="chedge" data-v="BUY" title="Đã bán giá cố định cho khách nhưng chưa mua đủ hàng → sợ giá TĂNG → MUA futures">Đã bán hàng, chưa mua đủ → MUA ${nl} lot</button><button type="button" class="cd-sb sell" data-d="chedge" data-v="SELL" title="Đã mua hàng / có tồn kho chưa bán → sợ giá GIẢM → BÁN futures">Đã mua / có tồn kho → BÁN ${nl} lot</button>`
      : '<span class="cd-dim">Dưới 10 tấn – chưa đủ 1 lot để phòng hộ.</span>';
  }
  function paintAcct() {
    const api = A(), s = api.s, a = api.account(); const v = n => api.vnd(Math.round(n));
    const row = (k, val, cls) => `<div class="cd-kv"><span>${k}</span><b class="${cls || ''}">${val}</b></div>`;
    const pct = a.pp > 0 ? Math.max(0, Math.min(100, Math.round(a.excess / a.pp * 100))) : 0;
    const fill = a.nlv > 0 && s.cash > 0 ? Math.max(4, Math.min(100, Math.round(a.nlv / Math.max(a.nlv, a.balance, s.cash) * 100))) : 4;
    const oteH = a.nlv > 0 ? Math.max(0, Math.min(100, Math.round(Math.abs(a.ote) / a.nlv * 500))) : 0;
    $('cdAcct').innerHTML = `<div class="cd-box"><h5>Overall Balance</h5><div class="cd-bx"><div class="cd-vbar" title="NLV so với vốn"><i style="height:${fill}%"></i></div><div>${row('NLV', v(a.nlv))}${row('Balance', v(a.balance))}${row('OTE/UPL', api.sg(Math.round(a.ote), api.vnd), a.ote > 0 ? 'up' : a.ote < 0 ? 'dn' : '')}</div></div></div>`
      + `<div class="cd-box"><h5>Cash Balance</h5><div class="cd-bx"><div class="cd-circ"></div><div>${row('Balance', v(a.balance))}${row('Cash Balance', v(a.balance))}${row('Collateral', '0')}${row('Phí đã trả', v(a.fees))}</div></div></div>`
      + `<div class="cd-box"><h5>Margin</h5><div class="cd-bx"><div class="cd-ring" style="--p:${pct}" title="Margin Excess / Purchasing Power"><span>${pct}%</span></div><div>${row('Margin Excess', `${v(a.excess)} <small>≈ ${Math.max(0, Math.floor(a.excess / api.IM()))} lot</small>`, a.excess < 0 ? 'dn' : '')}${row('Margin', v(a.mv))}${row('Maintenance', v(a.maint))}${row('Purchasing pwr', v(a.pp))}</div></div></div>`
      + `<div class="cd-box"><h5>OTE/UPL</h5><div class="cd-bx"><div class="cd-vbar ${a.ote < 0 ? 'neg' : ''}"><i style="height:${oteH}%"></i></div><div>${row('P/L', api.sg(Math.round(a.pl), api.vnd), a.pl > 0 ? 'up' : a.pl < 0 ? 'dn' : '')}${row('OTE', api.sg(Math.round(a.ote), api.vnd), a.ote > 0 ? 'up' : a.ote < 0 ? 'dn' : '')}${row('MVO', '0')}${row('UPL', api.sg(Math.round(a.ote), api.vnd), a.ote > 0 ? 'up' : a.ote < 0 ? 'dn' : '')}</div></div></div>`
      + (a.call ? '<div class="cd-call">⚠️ MARGIN CALL: NLV dưới mức ký quỹ duy trì – phải nộp thêm tiền hoặc giảm vị thế, nếu không thành viên MXV sẽ đóng vị thế.</div>' : '');
  }
  function paintStatus() {
    const api = A(), s = api.s, top = s.log[0]; const st = $('cdStatus');
    if (!top) { st.className = 'cd-status'; st.innerHTML = '<span class="cd-dim">Sẵn sàng · bấm ▶ Chạy giá hoặc chọn 🎯 bài tập · bấm cột xanh để MUA, cột đỏ để BÁN</span>'; return; }
    const key = top.at + top.text; st.className = 'cd-status ' + (top.kind || '');
    st.innerHTML = `<time>${top.at}</time> ${api.esc(top.text)}`;
    if (key !== dv.lastLog) { const first = !dv.lastLog; dv.lastLog = key; if (!first) { st.classList.add('flash'); clearTimeout(dv.flashT); dv.flashT = setTimeout(() => st.classList.remove('flash'), 1300); } }
  }
  function specHtml(sym) {
    const api = A(), s = api.s, fnd = window.VTEngine.firstNoticeDay(sym), ltd = api.lastTradingDay(sym);
    const d = x => (x ? x.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');
    const row = (k, v) => `<tr><td>${k}</td><td><b>${v}</b></td></tr>`;
    return `<h4>${desc(sym)}</h4><table class="cd-kvt"><tbody>${row('Mã MXV / ICE', `${api.mxv(sym)} / ${sym}`)}${row('Exchange', 'ICE FUTURES EUROPE - AGRICULTURAL PRODUCTS DIVISION')}${row('Type (system)', 'Future')}${row('ISIN', isin(sym))}
      ${row('Đơn vị giao dịch', '1 lot = 10 tấn')}${row('Bước giá', '1 USD/tấn')}${row('Giá trị của một bước giá', '10 USD')}${row('Ngày thông báo đầu tiên (FND)', d(fnd))}${row('Ngày giao dịch cuối cùng', d(ltd))}
      ${row('Initial margin', `${api.px(s.imUsd)} USD/lot`)}${row('Maintenance margin', `${api.px(s.mmUsd)} USD/lot`)}${row('Giờ giao dịch (giờ VN)', '≈ 15:00–23:30 mùa hè · 16:00–00:30 mùa đông')}</tbody></table>
      <p class="cd-dim">Ký quỹ theo màn CHI TIẾT của CQG (04/10/2026) – sàn đổi theo biến động, sửa ở ⚙. Trước FND phải đóng hoặc chuyển kỳ (roll) nếu không muốn nhận/giao hàng.</p>`;
  }

  // ---------- Menu thả xuống & hộp thoại ----------
  function openMenu(kind, anchor) {
    const menu = $('cdMenu'); if (dv.menu === kind) return closeMenu();
    dv.menu = kind; const c = cd(); let h = '';
    if (kind === 'tf') h = TFS.map(([v, l]) => `<button type="button" data-d="settf" data-v="${v}"><i>${c.tf === v ? '✓' : ''}</i>${l}</button>`).join('') + '<hr><button type="button" disabled><i></i>Custom…</button><button type="button" disabled><i>☐</i>Continuation</button>';
    else if (kind === 'style') h = (window.VTOhlc ? window.VTOhlc.STYLES : []).map(([v, l]) => `<button type="button" data-d="setstyle" data-v="${v}"><i>${c.style === v ? '✓' : ''}</i>${STY[v] || l}<small>${l}</small></button>`).join('');
    else if (kind === 'studies') h = (window.VTOhlc ? window.VTOhlc.STUDIES : []).map(([v, l]) => `<button type="button" data-d="setstudy" data-v="${v}"><i>${c.studies.includes(v) ? '☑' : '☐'}</i>${l}</button>`).join('');
    menu.innerHTML = h; menu.hidden = false;
    const r = anchor.getBoundingClientRect(), base = $('cdApp').getBoundingClientRect();
    menu.style.top = (r.bottom - base.top + 2) + 'px'; menu.style.left = Math.max(4, Math.min(r.left - base.left, base.width - 230)) + 'px';
  }
  function closeMenu() { dv.menu = null; const m = $('cdMenu'); if (m) { m.hidden = true; m.innerHTML = ''; } }
  function paintModal() {
    const api = A(), s = api.s, md = $('cdModal'); const pend = api.view.pending;
    const kind = pend ? 'confirm' : dv.modal; if (!kind) { if (!md.hidden) { md.hidden = true; md.innerHTML = ''; } dv.mkey = ''; return; }
    const key = kind + '|' + (pend ? pend.id + pend.side + pend.type + pend.px : dv.mdata) + (kind === 'log' ? s.log.length : '');
    if (key === dv.mkey && !md.hidden) return; dv.mkey = key;
    let title = '', h = '', wide = false;
    if (pend) {
      title = 'Order Confirmation';
      h = `<p class="cd-conf"><b class="${pend.side === 'BUY' ? 'up' : 'dn'}">${pend.side} ${pend.qty}</b> ${api.mxv(pend.sym)} ${pend.type} ${pend.type === 'MKT' ? '' : api.desc(pend)} ${pend.dur}${s.park && pend.type !== 'MKT' ? ' · PARK' : ''}</p>
        <p class="cd-dim">Kiểm tra lại mã, chiều, số lot, giá trước khi gửi – trên sàn thật lệnh đã khớp không rút lại được. (Lệnh giả lập, không gửi lên sàn.)</p>
        <div class="cd-row"><button type="button" class="cd-qb ${pend.side === 'BUY' ? 'buy' : 'sell'} big" data-act="ok">Send · Gửi lệnh</button><button type="button" class="cd-sb big" data-act="no">Cancel · Bỏ</button></div>`;
    } else if (kind === 'ticket') {
      const m = api.mkt(s.sym); const side = dv.mdata || 'BUY';
      title = 'Order Ticket · phiếu lệnh';
      h = `<div class="cd-tk"><label>B/S<select id="tkSide" class="cd-sel"><option${side === 'BUY' ? ' selected' : ''}>BUY</option><option${side === 'SELL' ? ' selected' : ''}>SELL</option></select></label>
        <label>Symbol<input class="cd-in" value="${api.mxv(s.sym)}" disabled></label><label>Qty<input class="cd-in" value="${s.qty}" disabled title="Đổi số lot ở ô size trên khung HOT"></label>
        <label>Type<select id="tkType" class="cd-sel"><option value="LMT">LMT</option><option value="MKT">MKT</option><option value="STP">STP</option><option value="STL">STL</option></select></label>
        <label>Price<input id="tkPx" class="cd-in" type="number" inputmode="numeric" value="${side === 'BUY' ? m.bid : m.ask}"></label><label>Dur<input class="cd-in" value="${s.dur}" disabled></label></div>
        <p class="cd-dim">Bid ${api.px(m.bid)} · Ask ${api.px(m.ask)} · Last ${api.px(m.last)}. LMT = giá giới hạn · MKT = khớp ngay · STP = kích hoạt khi chạm giá · STL = chạm giá stop thì đặt LMT (lệch 2 USD).</p>
        <div class="cd-row"><button type="button" class="cd-qb ${side === 'BUY' ? 'buy' : 'sell'} big" data-act="ticket">Place · Đặt lệnh</button><button type="button" class="cd-sb big" data-d="close">Đóng</button></div>`;
    } else if (kind === 'spec') { title = 'Contract Specifications'; h = specHtml(s.sym); }
    else if (kind === 'oinfo') {
      const o = s.orders.find(x => x.id === dv.mdata); title = o ? `Lệnh #${o.num} · ${o.id}` : 'Lệnh';
      const row = (k, v) => `<tr><td>${k}</td><td><b>${v}</b></td></tr>`;
      h = o ? `<table class="cd-kvt"><tbody>${row('Tài khoản', api.esc(o.acct))}${row('Mã', `${api.mxv(o.sym)} (${o.sym})`)}${row('Chiều', o.side)}${row('Số lot', `${o.qty} (đã khớp ${o.filled})`)}${row('Loại / giá', `${o.type} ${o.type === 'MKT' ? '' : api.desc(o)}`)}${row('Thời hạn', o.dur)}
          ${row('Trạng thái', `${api.STATUS[o.status] || o.status} <span class="cd-dim">· FIX OrdStatus ${api.esc(api.FIX[o.status] || '—')}</span>`)}${row('Giá khớp TB', o.filled ? api.px(Math.round(o.avg * 10) / 10) : '—')}${row('Đặt lúc', `${o.date || ''} ${o.at}`)}${o.note ? row('Ghi chú', api.esc(o.note)) : ''}</tbody></table>` : '<p>Không tìm thấy lệnh.</p>';
    } else if (kind === 'log') {
      title = 'Nhật ký & giải thích trạng thái'; wide = true;
      h = `<div class="cd-log">${s.log.map(x => `<p class="${x.kind}"><time>${x.at}</time> ${api.esc(x.text)}</p>`).join('') || '<p>Chưa có thao tác.</p>'}</div>`;
    } else if (kind === 'set') {
      title = '⚙ Thông số giả lập';
      h = `<div class="cd-tk"><label>Kịch bản<select id="setScn" class="cd-sel">${Object.entries(api.SCENARIOS).map(([k, l]) => `<option value="${k}"${k === s.scenario ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>Tốc độ giá<select id="setSpeed" class="cd-sel">${[[2500, 'Chậm'], [1500, 'Vừa'], [700, 'Nhanh']].map(([k, l]) => `<option value="${k}"${Number(s.speed) === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>Initial margin / lot (USD)<input id="setIm" class="cd-in" type="number" value="${s.imUsd}"></label><label>Maintenance / lot (USD)<input id="setMm" class="cd-in" type="number" value="${s.mmUsd}"></label>
        <label>Phí / lot / chiều (đ)<input id="setFee" class="cd-in" type="number" value="${s.fee}"></label><label>Tỷ giá USD (đ)<input id="setFx" class="cd-in" type="number" value="${s.fx}"></label></div>
        <p class="cd-dim">Ký quỹ mặc định theo màn CHI TIẾT của CQG (LRCX26, 04/10/2026): 4.059 / 3.612 USD/lot. Phí là số mẫu – sửa theo biểu phí của thành viên MXV.</p>
        <div class="cd-row"><button type="button" class="cd-sb" data-act="sync">↺ Lấy giá London thật</button><button type="button" class="cd-sb" data-act="reset">🗑 Xóa dữ liệu giả lập</button></div>`;
    } else if (kind === 'keys') {
      title = '⌨ Phím trên thang HOT (mặc định CQG)'; wide = true;
      const k = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;
      h = `<p class="cd-dim">Bấm vào thang giá trước (viền xanh) rồi dùng phím – giống CQG chỉ tác động cửa sổ đang chọn.</p><table class="cd-kvt keys"><tbody>
        ${k('<kbd>←</kbd> / <kbd>→</kbd>', 'MUA / BÁN thị trường · đang chọn giá: đặt lệnh tại giá đó')}${k('<kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd>', 'MUA tại best bid / BÁN tại best offer')}${k('<kbd>Shift</kbd>+<kbd>←</kbd>/<kbd>→</kbd>', 'MUA tại best offer / BÁN tại best bid (khớp ngay)')}
        ${k('<kbd>Ctrl</kbd>+<kbd>←</kbd>/<kbd>→</kbd>', 'MUA / BÁN LMT tại giá khớp gần nhất')}${k('<kbd>↑</kbd><kbd>↓</kbd> <kbd>PgUp</kbd><kbd>PgDn</kbd>', 'Chọn giá · đang chọn lệnh: dời giá, <kbd>Enter</kbd> gửi sửa')}${k('<kbd>Home</kbd> / <kbd>Esc</kbd>', 'Về giữa giá thị trường, về Market mode')}
        ${k('<kbd>Delete</kbd>', 'Hủy lệnh đang chọn')}${k('<kbd>Alt</kbd>+<kbd>B</kbd> / <kbd>Alt</kbd>+<kbd>A</kbd>', 'Dời lệnh đang chọn về best bid / best offer')}${k('<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd>/<kbd>B</kbd>/<kbd>C</kbd>/<kbd>Q</kbd>/<kbd>V</kbd>', 'Hủy hết / hủy mua / hủy bán / thanh lý / đảo vị thế')}
        ${k('Chuột', 'Bấm cột xanh = MUA, đỏ = BÁN (dưới giá = LMT, trên giá = STP/STL) · kéo nhãn lệnh sang giá mới để sửa, ra ngoài để hủy · chuột phải vào lệnh để hủy · lăn chuột để cuộn thang')}</tbody></table>`;
    } else if (kind === 'guide') {
      title = '❓ Giải thích các khung (theo CQG Desktop)'; wide = true;
      h = `<ul class="cd-guide">
        <li><b>Thanh trên:</b> VIETTHIEN SIM (giả lập, không phải phần mềm CQG) · DEMO $ · giờ · 🎯 bài tập tình huống · ▶ chạy giá · 📡 giá London thật · ⏭ hết phiên · ⛶ toàn màn hình · 🎓 DOMTrader (có hướng dẫn từng bước, bảng so sánh với CQG thật) · <b>O:</b> số lệnh chờ · <b>P:</b> tổng lot Long (L) / Short (S).</li>
        <li><b>HOT (Hybrid Order Ticket):</b> cột <span class="cd-bluetx">xanh = BID</span> (bấm để MUA), cột <span class="cd-redtx">đỏ = ASK</span> (bấm để BÁN). Số trong cột = số lot đang chờ. Bấm dưới giá thị trường = LMT, bấm phía trên (khi mua) = lệnh dừng STP/STL theo ô <b>STP▾</b>. Giá có ■ xanh = giá khớp gần nhất; vạch trắng = ranh giới bên mua / bên bán. Lệnh của bạn hiện ở 2 cột ngoài – kéo sang giá khác để sửa, × hoặc chuột phải để hủy.</li>
        <li><b>Cột nút bên phải HOT:</b> BUY/SELL n MKT (khớp ngay) · ô đỏ lớn = giá Ask (bấm = MUA ngay tại Ask) · ô xanh lớn = giá Bid (bấm = BÁN ngay tại Bid) · STP▾ / DAY▾ · OCO, TSTP (CQG thật có, giả lập chưa có) · P = Park · size ▾▴ + nút nhanh 1/4/10 · Cxl / Flatten / Reverse.</li>
        <li><b>Bảng giá:</b> T/S giá khớp · ΔT thay đổi so với mở cửa (xanh tăng, đỏ giảm) · VB/VA lot chờ ở giá mua/bán tốt nhất · B/A giá mua/bán tốt nhất · H/Lo cao/thấp · V Tot khối lượng. Bấm dòng để chọn mã; BUY/SELL/✎ mở phiếu lệnh.</li>
        <li><b>Biểu đồ:</b> “5 Min ▾” khung thời gian · “Candles ▾” kiểu biểu đồ · “studies ▾” chỉ báo (Bollinger, SMA, EMA, Volume) · ┼ dấu thập · 👁 hộp O/H/L/C · ↕ về thanh mới nhất · ▲▼ điểm bạn khớp lệnh · CSpec = thông số hợp đồng.</li>
        <li><b>Working / Filled Orders:</b> ✖ hủy · ✎ sửa giá · ▶ kích hoạt lệnh Park · ⓘ chi tiết (kèm mã FIX OrdStatus). UnFld = số lot chưa khớp.</li>
        <li><b>Open Positions:</b> L/S số lot mua/bán đang giữ · Avg giá vốn · OTE/UPL lãi/lỗ đang mở (USD) · ✖ Flatten · ⇅ Reverse. <b>Purchase & Sales:</b> các cặp mua–bán đã đóng và lãi/lỗ, số lần thắng/thua.</li>
        <li><b>Account Summary:</b> Overall Balance (NLV = giá trị tài khoản, Balance, OTE/UPL) · Cash Balance · Margin (Margin Excess = tiền còn đặt thêm được, Margin = ký quỹ ban đầu đang giữ, Maintenance = mức duy trì, Purchasing pwr) · OTE/UPL (P/L đã chốt, OTE đang mở, MVO giá trị quyền chọn = 0).</li>
        <li><b>⚖ Giá hàng thật FOB/CIF (riêng Việt Thiên):</b> FOB = Futures + Differential (trừ lùi nhập số âm) · CFR = FOB + cước tàu · CIF = CFR + bảo hiểm · quy đổi đ/kg theo tỷ giá · lãi gộp so với giá mua nội địa · số lot phòng hộ (1 lot = 10 tấn) và nút đặt lệnh phòng hộ ngay trên sàn giả lập.</li></ul>`;
    }
    md.hidden = false;
    md.innerHTML = `<div class="cd-mbg" ${pend ? 'data-act="no"' : 'data-d="close"'}></div><div class="cd-mbox ${wide ? 'wide' : ''}" role="dialog" aria-label="${title}"><header><b>${title}</b><button type="button" class="cd-ib" ${pend ? 'data-act="no"' : 'data-d="close"'} aria-label="Đóng">×</button></header><div class="cd-mbody">${h}</div></div>`;
    const f = md.querySelector('[data-act="ok"]'); if (f) f.focus({ preventScroll: true });
  }

  // ---------- Sự kiện ----------
  function onClick(e) {
    if (!$('cdApp')) return;
    if (dv.menu && !e.target.closest('#cdMenu') && !e.target.closest('[data-d="menu"]')) closeMenu();
    if (e.target.closest('[data-act="ticket"]')) { dv.modal = null; setTimeout(paint, 0); return; }   // lõi đã đặt lệnh từ phiếu → đóng phiếu
    const b = e.target.closest('[data-d]'); if (!b || !$('cdApp').contains(b)) return;
    const api = A(), s = api.s, m = api.mkt(s.sym), c = cd(), act = b.dataset.d, v = b.dataset.v;
    const done = () => { api.save(); paint(); };
    switch (act) {
      case 'qty': s.qty = Math.max(1, Math.min(99, s.qty + Number(v))); return done();
      case 'hit': api.view.pending = null; return api.newOrder(v, 'LMT', v === 'BUY' ? m.ask : m.bid);
      case 'menu': return openMenu(v, b);
      case 'settf': c.tf = Number(v); closeMenu(); if (dv.chart) dv.chart.setTf(c.tf); return done();
      case 'setstyle': c.style = v; closeMenu(); if (dv.chart) dv.chart.setStyle(c.style); return done();
      case 'setstudy': { const i = c.studies.indexOf(v); if (i >= 0) c.studies.splice(i, 1); else c.studies.push(v); if (dv.chart) dv.chart.setStudies(c.studies.slice()); api.save(); openMenu('studies', $('cdStd')); openMenu('studies', $('cdStd')); return paintChart(); }
      case 'cross': c.cross = !c.cross; if (dv.chart) dv.chart.setCross(c.cross); return done();
      case 'legend': c.legend = !c.legend; return done();
      case 'latest': if (dv.chart) dv.chart.latest(); return;
      case 'chtab': dv.chtab = v; dv.skey = ''; if (v === 'chart' && dv.chart) setTimeout(() => dv.chart.redraw(), 0); return paint();
      case 'ord': dv.ord = v; return paintOrders();
      case 'pos': dv.pos = v; return paintPos();
      case 'flat': case 'rev': s.sym = v; api.view.center = null; api.save(); return act === 'flat' ? api.flatten() : api.reverse();
      case 'oinfo': dv.modal = 'oinfo'; dv.mdata = v; return paintModal();
      case 'ticket': dv.modal = 'ticket'; dv.mdata = v || 'BUY'; dv.mkey = ''; return paintModal();
      case 'modal': dv.modal = v; dv.mdata = ''; dv.mkey = ''; return paintModal();
      case 'close': dv.modal = null; return paintModal();
      case 'focus': { const w = $(v); if (!w) return; w.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); w.classList.remove('cd-hl'); void w.offsetWidth; w.classList.add('cd-hl'); return; }
      case 'full': dv.full = !dv.full; $('cdApp').classList.toggle('cd-full', dv.full); document.body.classList.toggle('cd-fullon', dv.full); if (!dv.full) fit(); else $('cdApp').style.height = '';
        setTimeout(() => { if (dv.chart) dv.chart.redraw(); paint(); }, 30); return;
      case 'chedge': { const r = calcVals(); const nl = Math.floor(r.lots + 1e-9); if (!nl) return;
        api.log(`Phòng hộ từ khung FOB/CIF: ${v === 'BUY' ? 'đã bán hàng giá cố định nhưng chưa mua đủ → sợ giá TĂNG → MUA' : 'đã mua hàng / có tồn kho → sợ giá GIẢM → BÁN'} ${nl} lot ${api.mxv(r.sym)} (lô ${num(calc().qty)} tấn).`);
        return api.newOrder(v, 'MKT', 0, nl, r.sym); }
      default: return;
    }
  }
  function onChange(e) {
    if (!$('cdApp')) return; const api = A(), s = api.s, c = calc(), id = e.target.id;
    if (id === 'cdSym') { s.sym = e.target.value; api.view.center = null; api.view.sel = null; api.view.mode = 'market'; api.view.selOrder = ''; api.save(); return paint(); }
    if (id === 'cfSym') { c.sym = e.target.value; c.fut = null; api.save(); return paintCalc(); }
    if (id === 'cfFollow') { c.fut = e.target.checked ? null : calcVals().fut; api.save(); return paintCalc(); }
    if (id === 'setSpeed' || id === 'setScn' || /^set(Im|Mm|Fee|Fx)$/.test(id)) { dv.mkey = ''; }
  }
  function onInput(e) {
    if (!$('cdApp')) return; const api = A(), s = api.s, c = calc(), id = e.target.id;
    const map = { cfFut: 'fut', cfDiff: 'diff', cfFreight: 'freight', cfIns: 'ins', cfQty: 'qty', cfCost: 'cost', cfFobc: 'fobc' };
    if (id === 'cfFx') { const x = Number(e.target.value); if (x >= 1000) { s.fx = x; api.save(); paintCalc(); paintAcct(); } return; }
    if (!map[id]) return; const x = e.target.value === '' ? 0 : Number(e.target.value); if (!isFinite(x)) return;
    c[map[id]] = id === 'cfQty' ? Math.max(0, x) : x; api.save(); paintCalc();
  }

  window.VTSimD = { paint, build };
})();

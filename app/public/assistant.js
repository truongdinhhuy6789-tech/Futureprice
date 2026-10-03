// VIỆT THIÊN COFFEE GROUP — Trợ lý vị thế: phân tích tự động, hướng dẫn sử dụng, cơ chế tính, hỏi đáp
// Chạy hoàn toàn trên trình duyệt, không cần internet hay API.
(function () {
  'use strict';
  const E = window.VTEngine;
  let getState = () => null; let currentTab = 'analysis';
  const $ = id => document.getElementById(id);
  const fmt = (n, d) => E.fmt(n, d);
  const signed = (n, d) => E.signed(n, d);

  // ---------- 1. Phân tích tự động ----------
  function analysisHtml() {
    const st = getState(); if (!st) return '';
    const d = st.data; const pos = E.computePositions(d);
    const risk = E.analyzeRisk(pos, { limit: d.riskLimit, priceMove: d.priceMoveUsd });
    const sp = E.computeSpreads(d.columns, st.quotes);
    const out = [];
    const t = pos.totals.net;
    out.push(`<div class="as-card ${t < 0 ? 'bad' : t > 0 ? 'good' : ''}"><div class="as-k">Tổng vị thế ròng</div><div class="as-v">${fmt(t)} tấn</div>`
      + `<div class="as-s">${t < 0 ? `SHORT – công ty đang hụt ${fmt(Math.abs(t), 1)} t: giá tăng thì lỗ` : t > 0 ? `LONG – công ty đang dư ${fmt(t, 1)} t: giá giảm thì lỗ` : 'CÂN BẰNG – rủi ro giá phẳng'}</div>`
      + `<div class="as-s">London ${signed(risk.move)}$ → ${signed(risk.mtmUp)} USD; London −${fmt(risk.move, 0)}$ → ${signed(-risk.mtmUp)} USD</div></div>`);

    out.push('<h4>Vị thế theo kỳ hạn</h4><table class="as-table"><tr><th>Kỳ hạn</th><th>Hàng thực</th><th>Sàn</th><th>Trừ lùi</th><th>Ròng</th></tr>'
      + pos.columns.map((c, i) => `<tr><td>${E.contractLabel(c)}<br><small>${c}</small></td><td>${fmt(pos.physical[i], 1)}</td><td>${fmt(pos.futures[i], 1)}</td><td>${fmt(pos.diff[i], 1)}</td><td class="${pos.net[i] < 0 ? 'neg' : pos.net[i] > 0 ? 'pos' : ''}"><b>${fmt(pos.net[i], 1)}</b></td></tr>`).join('')
      + '</table>');

    out.push('<h4>Khuyến nghị</h4>');
    const recs = [];
    risk.alerts.forEach(a => {
      if (a.type === 'hedge') recs.push(`🛡️ <b>${E.contractLabel(a.code)}</b>: lệch ${fmt(a.value)} t (hạn mức ${fmt(risk.limit, 0)} t) → <b>${a.action} ${a.lots} lot RM${a.code}</b>. Sau khi khớp lệnh, nhập ${a.action === 'MUA LONG' ? '+' : '−'}${fmt(a.lots * E.LOT_TONNES, 0)} t vào dòng tài khoản sàn tương ứng.`);
      if (a.type === 'mismatch') recs.push('⚠️ <b>Lệch kỳ hạn</b>: kỳ dư, kỳ hụt. Cân nhắc spread (bán kỳ dư / mua kỳ hụt) hoặc dời lịch giao hàng thay vì hedge từng kỳ riêng lẻ.');
    });
    if (!recs.length) recs.push(`✅ Không kỳ hạn nào vượt hạn mức ${fmt(risk.limit, 0)} t.`);
    out.push('<ul class="as-list">' + recs.map(r => `<li>${r}</li>`).join('') + '</ul>');

    const priced = sp.filter(s => s.value !== null);
    if (priced.length) {
      const inv = priced.filter(s => s.structure === 'Inverted').length;
      out.push('<h4>Cấu trúc thị trường (spread)</h4><ul class="as-list">'
        + priced.map(s => `<li>${s.pair}: <b>${signed(s.value)}</b> USD – ${s.structure}</li>`).join('')
        + `<li>${inv > priced.length / 2 ? '📉 Thị trường <b>nghịch đảo</b>: hàng giao gần đắt hơn → giữ tồn kho qua kỳ bị thiệt; ưu tiên bán sớm, mua kỳ xa.' : '📈 Thị trường <b>bình thường (contango)</b>: kỳ xa cao hơn → có thể giữ hàng và hưởng chênh lệch kỳ hạn nếu chi phí lưu kho thấp.'}</li></ul>`);
    } else out.push('<p class="as-muted">Chưa có giá sàn để phân tích spread.</p>');

    // Soát dữ liệu
    const checks = [];
    if (st.dirty) checks.push('💾 Có thay đổi <b>chưa lưu</b> – bấm “Lưu vị thế”.');
    const expired = d.columns.filter(c => E.isExpired(c));
    if (expired.length) checks.push(`⏰ Kỳ hạn ${expired.join(', ')} đã đến tháng giao hàng – bấm “Chuyển kỳ hạn”.`);
    const signRule = { buy_fixed_unshipped: 1, buy_unfixed_shipped: 1, diff_buy_unfixed: 1, sell_fixed_unshipped: -1, sell_unfixed_shipped: -1, diff_sell_unfixed: -1 };
    E.ROWS.forEach(r => {
      const want = signRule[r.key]; if (!want) return;
      const wrong = d.columns.filter(c => E.num(d.matrix[r.key][c]) * want < 0);
      if (wrong.length) checks.push(`❓ “${r.label}” có số ${want > 0 ? 'âm' : 'dương'} ở ${wrong.join(', ')} – quy ước: mua nhập dương, bán nhập âm.`);
    });
    const memo = E.ROWS.filter(r => r.group === 'memo' && pos.rowSums[r.key] !== 0);
    if (memo.length) checks.push(`ℹ️ ${memo.map(r => r.label).join(', ')} chỉ để theo dõi, <b>không</b> cộng vào tổng vị thế.`);
    if (!st.quotesOk) checks.push('📡 Chưa kết nối được giá sàn – số liệu giá có thể cũ.');
    out.push('<h4>Kiểm tra dữ liệu</h4><ul class="as-list">' + (checks.length ? checks : ['✅ Dữ liệu hợp lệ.']).map(c => `<li>${c}</li>`).join('') + '</ul>');
    return out.join('');
  }

  // ---------- 2. Cách sử dụng ----------
  const GUIDE = `
    <h4>Khởi động</h4><ol class="as-list">
      <li>Nháy đúp <b>CHAY_HE_THONG.bat</b> → trình duyệt tự mở <b>http://localhost:3456</b>.</li>
      <li>Muốn tắt: nháy đúp <b>DUNG_HE_THONG.bat</b>.</li></ol>
    <h4>Cập nhật vị thế hằng ngày</h4><ol class="as-list">
      <li>Nhập số tấn vào ô theo từng <b>kỳ hạn</b> (cột). <b>Mua/Long nhập dương, Bán/Short nhập âm.</b></li>
      <li>Tồn kho: hàng đang có trong kho (không gồm hàng gởi).</li>
      <li>Hợp đồng đã chốt giá: nhập vào dòng “đã chốt giá”. Hợp đồng trừ lùi chưa chốt: nhập vào khối <b>Trừ lùi</b>.</li>
      <li>Lệnh sàn đã khớp (HD Bank / PFS092): nhập theo tấn (1 lot = 10 t; bán short = âm).</li>
      <li>Bấm <b>💾 Lưu vị thế</b>. Nút có dấu “•” nghĩa là còn thay đổi chưa lưu.</li></ol>
    <h4>Đọc kết quả</h4><ol class="as-list">
      <li><b>Dòng vàng – Tổng vị thế ròng</b>: âm = Short (hụt hàng, sợ giá tăng), dương = Long (dư hàng, sợ giá giảm).</li>
      <li>Khối <b>Đo lường rủi ro</b>: kỳ hạn lệch nhiều nhất, lời/lỗ khi London biến động, khuyến nghị số lot cần phòng hộ khi vượt hạn mức.</li>
      <li><b>Công cụ FOB</b>: chọn kỳ hạn London, nhập Diff → ra giá FOB USD/tấn, VNĐ/kg và giá nội địa tương đương.</li></ol>
    <h4>Việc định kỳ</h4><ol class="as-list">
      <li>Khi kỳ hạn đầu tiên đến tháng giao hàng: bấm <b>🔁 Chuyển kỳ hạn</b> (hệ thống cảnh báo số liệu bị loại).</li>
      <li>Cập nhật <b>giá nhân xô</b> và <b>tỷ giá</b> bằng nút ✎ Sửa trên thẻ tham chiếu.</li>
      <li>Cuối ngày: <b>📊 Xuất Excel</b> để lưu báo cáo.</li></ol>
    <h4>Bot Telegram</h4><ol class="as-list">
      <li>Bấm ✈️ Bot Telegram → dán Token (@BotFather) và Chat ID → Lưu → Gửi thử.</li>
      <li>Lệnh: <code>/gia</code>, <code>/vithe</code>, <code>/spread</code>, <code>/fob</code>, <code>/tuvan</code>.</li></ol>`;

  // ---------- 3. Cơ chế ----------
  const MECH = `
    <h4>1. Kỳ hạn (cột)</h4><p>6 tháng giao hàng Robusta London kế tiếp: F(1) H(3) K(5) N(7) U(9) X(11). Số liệu lưu theo <b>mã kỳ hạn</b> (vd. X26, F27) nên chuyển kỳ không làm lệch số.</p>
    <h4>2. Vị thế từng kỳ hạn</h4>
    <div class="as-formula">Hàng thực = Tồn kho + Mua đã chốt chưa giao + Mua đã giao chưa chốt + Bán đã chốt chưa giao + Bán đã giao chưa chốt</div>
    <div class="as-formula">Sàn = Robusta HD Bank + Arabica HD Bank + Robusta PFS092 + Arabica PFS092</div>
    <div class="as-formula">Trừ lùi = Mua trừ lùi chưa chốt + Bán trừ lùi chưa chốt</div>
    <div class="as-formula"><b>Tổng vị thế ròng = Hàng thực + Sàn + Trừ lùi</b></div>
    <p>Hàng gởi và Spread lots chỉ để theo dõi, không cộng vào tổng.</p>
    <h4>3. Đo rủi ro</h4>
    <div class="as-formula">Lời/lỗ khi London tăng ΔP = Tổng vị thế ròng × ΔP (USD)</div>
    <div class="as-formula">Kỳ hạn vượt hạn mức → số lot phòng hộ = |vị thế kỳ hạn| ÷ 10, làm tròn</div>
    <p>Kỳ hạn âm → MUA LONG; dương → BÁN SHORT. Cảnh báo <b>lệch kỳ hạn</b> khi cùng lúc có kỳ dư và kỳ hụt vượt ½ hạn mức.</p>
    <h4>4. Spread</h4><div class="as-formula">Spread = Giá kỳ gần − Giá kỳ xa</div><p>Dương = Inverted (nghịch đảo); âm = Contango (bình thường).</p>
    <h4>5. Giá FOB từ trừ lùi</h4>
    <div class="as-formula">FOB (USD/t) = Giá London + Diff</div>
    <div class="as-formula">FOB (VNĐ/kg) = FOB × Tỷ giá ÷ 1000</div>
    <div class="as-formula">Giá nội địa tương đương = FOB (VNĐ/kg) − Chi phí gia công/bao bì/hao hụt</div>
    <h4>6. Dữ liệu</h4><p>Lưu tại <code>app/data/position_data.json</code> (ghi an toàn qua file tạm). Cấu hình bot: <code>app/data/bot_config.json</code> – token không hiển thị ra web. Giá sàn lấy từ giacaphe.com, lưu đệm 10 giây.</p>`;

  // ---------- 4. Hỏi đáp ----------
  const FAQ = [
    ['Nhập số âm hay dương?', 'Mua / Long / hàng đang có = số dương. Bán / Short = số âm. Trợ lý sẽ báo nếu dòng “bán” có số dương hoặc dòng “mua” có số âm.'],
    ['Tổng vị thế âm nghĩa là gì?', 'Công ty đang SHORT: đã bán nhiều hơn hàng đang có/đã mua. Giá London tăng thì lỗ, nên cân nhắc MUA LONG futures hoặc mua hàng thực.'],
    ['Khi nào cần hedge?', 'Khi vị thế ròng một kỳ hạn vượt hạn mức (mặc định 200 t). Số lot = |vị thế| ÷ 10. Hạn mức chỉnh ở khối Đo lường rủi ro.'],
    ['Hợp đồng trừ lùi (PTBF) nhập ở đâu?', 'Hợp đồng đã chốt Diff nhưng chưa chốt giá sàn: nhập ở khối “Hợp đồng trừ lùi”. Khi khách/nhà cung cấp chốt giá, chuyển số sang dòng “đã chốt giá” tương ứng và xóa ở dòng trừ lùi.'],
    ['Chuyển kỳ hạn làm gì?', 'Khi kỳ hạn đầu tiên đến tháng giao hàng, bấm “Chuyển kỳ hạn” để ma trận chuyển sang 6 kỳ mới. Số liệu ở kỳ hạn cũ bị loại – hệ thống liệt kê trước để bạn xác nhận.'],
    ['Giá nhân xô và tỷ giá có tự cập nhật không?', 'Không – đây là số tham chiếu nhập tay (nút ✎ Sửa). Tỷ giá sửa ở đây cũng cập nhật vào công cụ tính FOB.'],
    ['Mất kết nối giá sàn thì sao?', 'Hệ thống dùng giá lấy được gần nhất và báo trạng thái màu vàng. Ma trận vị thế vẫn tính bình thường.'],
    ['Spread Inverted có ý nghĩa gì?', 'Kỳ gần đắt hơn kỳ xa: hàng giao ngay khan. Giữ hàng tồn qua kỳ sau sẽ mất phần chênh lệch; nên ưu tiên giao/bán sớm.'],
    ['Dữ liệu lưu ở đâu, có mất không?', 'Trong app/data/position_data.json trên máy. Nên Xuất Excel cuối ngày để lưu lịch sử. Thư mục cũng được Google Drive sao lưu.'],
    ['Nạp dữ liệu mẫu để làm gì?', 'Để tập huấn hoặc đối chiếu cách tính với ma trận mẫu ban đầu. Thao tác này thay thế số liệu hiện tại – nên Xuất Excel trước.'],
    ['Bot Telegram có những lệnh nào?', '/gia (giá & tóm tắt vị thế), /vithe (vị thế từng kỳ), /spread, /fob, /tuvan (trợ lý phân tích). Cảnh báo tự động khi London biến động vượt ngưỡng.'],
    ['Nhiều người cùng dùng được không?', 'Có – máy khác trong cùng mạng mở http://<IP máy chạy>:3456. Lưu ý mọi người cùng ghi một bộ số liệu, nên phân công một người cập nhật.']
  ];
  function faqList(qs) {
    const k = (qs || '').toLowerCase().trim();
    const list = FAQ.filter(([q, a]) => !k || (q + ' ' + a).toLowerCase().includes(k));
    return list.length ? list.map(([q, a]) => `<details class="as-faq"><summary>${q}</summary><p>${a}</p></details>`).join('')
      : '<p class="as-muted">Không tìm thấy – thử từ khóa khác.</p>';
  }

  // ---------- Điều khiển khung trợ lý ----------
  function render() {
    const body = $('assistantBody'); if (!body) return;
    if (currentTab === 'analysis') body.innerHTML = analysisHtml();
    else if (currentTab === 'guide') body.innerHTML = GUIDE;
    else if (currentTab === 'mechanism') body.innerHTML = MECH;
    else {
      body.innerHTML = '<input class="form-control as-search" id="asSearch" placeholder="Tìm câu hỏi… (vd: hedge, trừ lùi, âm)"><div id="asFaqList"></div>';
      $('asFaqList').innerHTML = faqList('');
      $('asSearch').addEventListener('input', e => { $('asFaqList').innerHTML = faqList(e.target.value); });
    }
  }
  function open() { $('assistantDrawer').classList.add('open'); $('assistantDrawer').setAttribute('aria-hidden', 'false'); render(); }
  function close() { $('assistantDrawer').classList.remove('open'); $('assistantDrawer').setAttribute('aria-hidden', 'true'); }

  window.VTAssistant = {
    init(fn) {
      getState = fn;
      $('btnAssistant').addEventListener('click', () => ($('assistantDrawer').classList.contains('open') ? close() : open()));
      $('btnCloseAssistant').addEventListener('click', close);
      $('assistantTabs').addEventListener('click', e => {
        const b = e.target.closest('.assistant-tab'); if (!b) return;
        currentTab = b.dataset.tab;
        document.querySelectorAll('.assistant-tab').forEach(x => x.classList.toggle('active', x === b));
        render();
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
      if (location.hash === '#tro-ly') setTimeout(open, 300); // mở thẳng trợ lý: http://localhost:3456/#tro-ly
    },
    refresh() { if (currentTab === 'analysis' && $('assistantDrawer').classList.contains('open')) render(); }
  };
})();

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
    <h4>Khởi động</h4><ol class="as-list"><li>Nháy đúp <b>CHAY_HE_THONG.bat</b> → mở <b>http://localhost:3456</b>. Điện thoại cùng Wi‑Fi: <b>http://&lt;IP máy chạy&gt;:3456</b>.</li><li>Tắt: <b>DUNG_HE_THONG.bat</b>.</li></ol>
    <h4>Link online cho sếp (xem từ xa)</h4><ol class="as-list"><li>Nháy đúp <b>MO_LINK_ONLINE.bat</b> → cửa sổ hiện link dạng <b>https://….trycloudflare.com</b> (tự chép vào bộ nhớ tạm) → gửi link cho sếp.</li><li>Sếp mở link là <b>xem được ngay, không cần mật khẩu</b> (chế độ chỉ xem – không sửa, không xóa được số liệu). Ai có link đều xem được, nên chỉ gửi cho người cần xem.</li><li>Anh <b>chỉnh sửa</b> qua link, không cần mật khẩu: dùng <b>link chỉnh sửa</b> (…/k/…, cửa sổ MO_LINK_ONLINE hiện sẵn) – mở 1 lần là máy/điện thoại đó có quyền sửa 30 ngày. Không gửi link này cho người ngoài. Mỗi lần lưu, hệ thống tự giữ bản sao (<code>app/data/backups</code>) để khôi phục khi sửa nhầm.</li><li>Máy chạy hệ thống phải bật và mở cửa sổ link; tắt cửa sổ = tắt link. Mỗi lần mở lại, link đổi địa chỉ mới.</li></ol>
    <h4>4 thẻ chính</h4><ol class="as-list">
      <li><b>📈 Tổng quan</b> (dành cho sếp): tổng vị thế ròng, lời/lỗ khi giá biến động, số lot cần phòng hộ, biểu đồ vị thế theo kỳ hạn, tóm tắt của trợ lý, đường cong giá kỳ hạn & FOB so với các tuần/tháng trước.</li>
      <li><b>📊 Vị thế</b>: nhập ma trận (Mua/Long dương, Bán/Short âm) → <b>💾 Lưu vị thế</b>. Có công cụ tính FOB từ trừ lùi và hạn mức rủi ro.</li>
      <li><b>🛡️ Phòng hộ</b>: để trống F0/FOB/K_put/K_call → mô hình <b>tự chạy theo giá sàn trực tiếp</b> (⚡). Muốn giữ cố định: bấm <b>📌 Chốt giá hiện tại</b> hoặc tự nhập số. Chỉnh khối lượng/phí Put/Call → so sánh 4 chiến lược (Futures, Long Put, Collar, Hybrid) và 5 kịch bản giá.</li>
      <li><b>🌐 Bảng giá</b>: giá Robusta London, Arabica New York, Brazil từ giacaphe.com – giá khớp, thay đổi, cao/thấp, khối lượng, mở cửa, hôm trước, HĐ mở, giờ khớp, ngày thông báo đầu tiên.</li></ol>
    <h4>Giá thời gian thực</h4><ol class="as-list"><li>Hệ thống tự lấy giá giacaphe.com mỗi 5 giây và đẩy ngay xuống mọi màn hình đang mở (ô giá nháy xanh/đỏ khi đổi). Qua link online, màn hình tự hỏi giá mới mỗi 3 giây.</li><li>Nghi ngờ giá lệch: bấm <b>🔄 Kiểm tra lại giá</b> – hệ thống lấy lại ngay từ trang nguồn và báo khớp hay có giá mới.</li><li>Tỷ giá lấy tự động từ Vietcombank (30 phút/lần); giá nhân xô tự động từ giacaphe.com (trung bình Tây Nguyên + các tỉnh trang này ghi công khai, 30 phút/lần) – bảng chi tiết ở thẻ 🌐 Bảng giá.</li></ol>
    <h4>Việc định kỳ</h4><ol class="as-list"><li>Cuối ngày: <b>📊 Xuất Excel</b> ở thẻ Vị thế.</li><li>Khi kỳ đầu đến tháng giao hàng: <b>🔁 Chuyển kỳ hạn</b>.</li><li>Theo dõi cảnh báo <b>ngày thông báo đầu tiên</b> để đảo vị thế sàn kịp thời.</li></ol>
    <h4>Bot Telegram</h4><ol class="as-list"><li>✈️ Telegram → Token + Chat ID → Lưu → Gửi thử. Lệnh: <code>/gia</code> <code>/vithe</code> <code>/spread</code> <code>/fob</code> <code>/tuvan</code>.</li></ol>`;

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
    ['Giá nhân xô và tỷ giá có tự cập nhật không?', 'Có. Tỷ giá lấy tự động từ Vietcombank 30 phút/lần. Giá nhân xô lấy tự động từ giacaphe.com (giá trung bình Tây Nguyên và giá các tỉnh trang này ghi công khai) 30 phút/lần – xem bảng ở thẻ 🌐 Bảng giá. Chỉ khi trang nguồn lỗi mới dùng giá nhập tay (✎ Sửa).'],
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
  function open(tab) {
    if (tab) { currentTab = tab; document.querySelectorAll('.assistant-tab').forEach(x => x.classList.toggle('active', x.dataset.tab === tab)); }
    $('assistantDrawer').classList.add('open'); $('assistantDrawer').setAttribute('aria-hidden', 'false'); render();
  }

  // ---------- Tóm tắt ngắn cho sếp (trang Tổng quan) ----------
  function summary(st) {
    if (!st) return [];
    const d = st.data; const pos = E.computePositions(d);
    const risk = E.analyzeRisk(pos, { limit: d.riskLimit, priceMove: d.priceMoveUsd }); const t = pos.totals.net; const out = [];
    if (t < 0) out.push(`Công ty đang <b>SHORT ${fmt(Math.abs(t), 1)} tấn</b> (bán nhiều hơn hàng đang có). London tăng ${fmt(risk.move, 0)}$/tấn thì <b>lỗ khoảng ${fmt(Math.abs(risk.mtmUp), 0)} USD</b>.`);
    else if (t > 0) out.push(`Công ty đang <b>LONG ${fmt(t, 1)} tấn</b> (hàng chưa bán/chưa chốt giá). London giảm ${fmt(risk.move, 0)}$/tấn thì <b>lỗ khoảng ${fmt(Math.abs(risk.mtmUp), 0)} USD</b>.`);
    else out.push('Vị thế ròng <b>cân bằng</b> – biến động giá London ít ảnh hưởng tới lợi nhuận.');
    if (risk.worstIdx >= 0 && risk.worstValue !== 0) out.push(`Rủi ro tập trung nhiều nhất ở <b>${E.contractLabel(pos.columns[risk.worstIdx])}</b> (${E.signed(risk.worstValue, 1)} t).`);
    const hedges = risk.alerts.filter(a => a.type === 'hedge');
    out.push(hedges.length ? `🛡️ Đề xuất phòng hộ: ${hedges.map(a => `<b>${a.action} ${a.lots} lot ${a.code}</b>`).join(', ')}.` : `✅ Không kỳ hạn nào vượt hạn mức ${fmt(risk.limit, 0)} tấn – chưa cần phòng hộ thêm.`);
    if (risk.alerts.some(a => a.type === 'mismatch')) out.push('⚠️ Có kỳ dư và kỳ hụt cùng lúc – cân nhắc giao dịch spread hoặc dời lịch giao hàng.');
    const sp = E.computeSpreads(d.columns, st.quotes).filter(s => s.value !== null);
    const front = ((st.quotes || {}).coffee_liffe || [])[0];
    if (front) out.push(`Robusta ${front.Name}: <b>${fmt(front.Last, 0)} USD/t</b> (${E.signed(front.Change)} | ${front.PtcChange}%). ${sp.length ? (sp.filter(s => s.structure === 'Inverted').length > sp.length / 2 ? 'Thị trường <b>nghịch đảo</b>: nên ưu tiên bán/giao sớm.' : 'Thị trường <b>bình thường</b>: giữ hàng ít bị thiệt.') : ''}`);
    // Ngày thông báo đầu tiên sắp tới (≤ 15 ngày)
    const today = new Date();
    ((st.quotes || {}).coffee_liffe || []).forEach(q => {
      const f = E.firstNoticeDay(q.Name); if (!f) return; const left = E.daysBetween(today, f);
      if (left >= 0 && left <= 15) out.push(`⏰ <b>${E.mxvCode(q.Name)}</b> đến ngày thông báo đầu tiên ${f.getDate()}/${f.getMonth() + 1} (còn ${left} ngày) – đóng/đảo vị thế sàn kỳ này trước hạn.`);
    });
    if (st.dirty) out.push('💾 Có thay đổi chưa lưu.');
    if (d.columns.some(c => E.isExpired(c))) out.push('⏰ Ma trận có kỳ hạn đã đến tháng giao hàng – cần Chuyển kỳ hạn.');
    return out;
  }
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
    refresh() { if (currentTab === 'analysis' && $('assistantDrawer').classList.contains('open')) render(); },
    open, summary
  };
})();

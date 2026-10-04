// VIỆT THIÊN COFFEE GROUP — Trợ lý: hỏi đáp & tư vấn theo số liệu thật, lời khuyên đầu trang, cảnh báo sàn biến động
// Chạy hoàn toàn trên trình duyệt (không cần API): đọc vị thế, sổ hợp đồng (hàng thật), lệnh sàn (hàng ảo), giá trực tiếp,
// bảng diff theo chủng loại và thư viện kiến thức (knowledge.js).
(function () {
  'use strict';
  const E = window.VTEngine;
  let getState = () => null; let currentTab = 'chat';
  const $ = id => document.getElementById(id);
  const fmt = (n, d) => E.fmt(n, d), signed = (n, d) => E.signed(n, d);
  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const plain = h => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const dayText = d => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const dmyIso = iso => { const [y, m, d] = String(iso || '').split('-'); return d ? `${d}/${m}/${y}` : ''; };
  const quoteOf = (st, code) => ((st.quotes || {}).coffee_liffe || []).find(x => x.Name === 'RM' + code) || null;
  const priceOf = (st, code) => { const q = quoteOf(st, code); return q ? E.num(q.Last) : 0; };
  const fxOf = st => (st.fx && st.fx.transfer) || E.num(st.data.fobParams.exchangeRate) || 0;
  const domOf = st => (st.domestic && st.domestic.avg) || 0;
  const lib = () => window.VTLibrary;
  const app = () => window.VTApp;

  // ================= 1. LỜI KHUYÊN & CẢNH BÁO (dải đầu trang) =================
  const sessionStart = {}; // giá lúc mở hệ thống (theo trình duyệt) của từng kỳ – để bắt biến động trong phiên đang xem
  const toasted = new Set();
  function advice(st) {
    if (!st || !st.data) return [];
    const d = st.data; const pos = E.computePositions(d);
    const risk = E.analyzeRisk(pos, { limit: d.riskLimit, priceMove: d.priceMoveUsd });
    const th = Math.max(5, E.num(d.priceMoveUsd) || 30); const out = [];
    ((st.quotes || {}).coffee_liffe || []).forEach(q => { if (!(q.Name in sessionStart) && E.num(q.Last)) sessionStart[q.Name] = E.num(q.Last); });
    // Sàn biến động vượt ngưỡng (so với phiên trước hoặc so với lúc mở hệ thống); lãi/lỗ tính theo vị thế từng kỳ × biến động của chính kỳ đó
    let w = null, pnlDay = 0, pnlSess = 0;
    d.columns.forEach((c, i) => {
      const q = quoteOf(st, c); if (!q) return;
      const chg = E.num(q.Change), sess = E.num(q.Last) - (sessionStart[q.Name] || E.num(q.Last));
      pnlDay += pos.net[i] * chg; pnlSess += pos.net[i] * sess;
      const m = Math.max(Math.abs(chg), Math.abs(sess));
      if (m >= th && (!w || m > w.m)) w = { c, i, q, chg, sess, m };
    });
    if (w) {
      const inSession = Math.abs(w.sess) >= th; const mv = inSession ? w.sess : w.chg; const pnl = Math.round(inSession ? pnlSess : pnlDay);
      const open = E.sessionStatus('robusta', new Date()).open;
      out.push({ lvl: pnl < 0 ? 'alert' : 'warn', key: `move-${w.c}-${Math.sign(mv)}-${Math.floor(Math.abs(mv) / th)}`, act: ['position', 'Xem vị thế'],
        html: `⚡ <b>Sàn biến động mạnh:</b> RM${w.c} <b>${signed(mv, 0)} USD/t</b> ${inSession ? 'kể từ lúc mở hệ thống' : `${open ? 'trong phiên hôm nay' : 'ở phiên gần nhất'} (${esc(w.q.PtcChange)}%)`} – vượt ngưỡng ${fmt(th, 0)} USD/t. Theo vị thế từng kỳ, công ty tạm tính <b>${signed(pnl, 0)} USD</b>${pos.net[w.i] ? ` (kỳ ${w.c} đang ${signed(pos.net[w.i], 1)} t)` : ` (kỳ ${w.c} không có vị thế)`}. ${pnl < 0 ? 'Giá đang chạy <b>ngược</b> vị thế – xem lại phòng hộ.' : pnl > 0 ? 'Giá đang chạy thuận vị thế.' : ''}` });
    }
    // Mức theo dõi giá Class 1 (đặt ở thẻ Bảng giá)
    const ca = d.classAlert || {};
    if (ca.month && (ca.above || ca.below)) {
      const p = priceOf(st, ca.month);
      if (p && ca.above && p >= ca.above) out.push({ lvl: 'alert', key: `cls-up-${ca.month}-${ca.above}`, act: ['board', 'Xem giá Class 1'], html: `🔔 <b>Giá Class 1 RM${ca.month} = ${fmt(p, 0)} USD/t</b> đã lên trên mức theo dõi ${fmt(ca.above, 0)}.` });
      if (p && ca.below && p <= ca.below) out.push({ lvl: 'alert', key: `cls-dn-${ca.month}-${ca.below}`, act: ['board', 'Xem giá Class 1'], html: `🔔 <b>Giá Class 1 RM${ca.month} = ${fmt(p, 0)} USD/t</b> đã xuống dưới mức theo dõi ${fmt(ca.below, 0)}.` });
    }
    risk.alerts.filter(a => a.type === 'hedge').forEach(a => out.push({ lvl: 'warn', key: `limit-${a.code}`, act: ['contracts', 'Ghi lệnh sàn'],
      html: `🛡️ Kỳ <b>${a.code}</b> hở <b>${signed(a.value, 1)} t</b> (hạn mức ±${fmt(risk.limit, 0)}) → <b>${a.action} ${a.lots} lot RM${a.code}</b>.` }));
    if (risk.alerts.some(a => a.type === 'mismatch')) out.push({ lvl: 'warn', key: 'mismatch', html: '⚠️ <b>Lệch kỳ hạn</b>: có kỳ dư và kỳ hụt cùng lúc – rủi ro khi spread dãn; cân nhắc giao dịch spread.' });
    const cs = E.contractSummary(d.contracts, new Date());
    cs.due.filter(x => x.left <= 20).forEach(x => out.push({ lvl: x.left <= 7 ? 'alert' : 'warn', key: `due-${x.id}-${x.left <= 7}`, act: ['contracts', 'Chốt giá'],
      html: `⏰ <b>${esc(x.no)}</b>${x.party ? ' – ' + esc(x.party) : ''}: còn <b>${fmt(x.unfixedT, 1)} t chưa chốt giá</b>, hạn ≈ ${dayText(x.fnd)} (${x.left < 0 ? 'đã quá hạn' : `còn ${x.left} ngày`}).` }));
    // Lệnh chờ chưa khớp: nhắc để không nhầm là đã phòng hộ
    (d.trades || []).filter(t => !E.isFilled(t)).forEach(t => {
      const p = priceOf(st, t.month); const c = (d.contracts || []).find(x => x.id === t.link);
      out.push({ lvl: 'warn', key: `pend-${t.id}`, act: ['contracts', 'Xem lệnh chờ'],
        html: `⏳ <b>Lệnh chờ chưa khớp:</b> ${t.side === 'buy' ? 'MUA' : 'BÁN'} ${fmt(t.lots, t.lots % 1 ? 2 : 0)} lot RM${esc(t.month)}${t.price ? ` @${fmt(t.price, 0)}` : ''}${p ? ` (giá hiện tại ${fmt(p, 0)})` : ''}${c ? ` cho <b>${esc(c.no)}</b>` : ''} – <b>chưa tính vào vị thế</b>. Khớp rồi thì bấm ✔ Khớp ở thẻ Giao dịch.` });
    });
    const book = E.futuresBook(d.trades, c => priceOf(st, c));
    book.list.filter(g => g.pos).forEach(g => {
      const f = E.firstNoticeDay('RM' + g.month); if (!f) return; const left = E.daysBetween(new Date(), f);
      if (left <= 15) out.push({ lvl: left <= 5 ? 'alert' : 'warn', key: `fnd-${g.account}-${g.month}`, act: ['contracts', 'Xem lệnh'],
        html: `📉 Lệnh sàn <b>RM${g.month}</b>${g.account ? ' (' + esc(g.account) + ')' : ''} đang mở ${signed(g.pos, 0)} lot – ngày thông báo đầu tiên ${dayText(f)} (${left < 0 ? 'đã qua' : `còn ${left} ngày`}): đóng hoặc đảo kỳ.` });
    });
    (d.contracts || []).forEach(c => {
      const exp = E.contractExposure(c); if (!exp) return;
      const linked = E.linkedLots(d.trades, c.id); const rest = E.round2(exp + linked * E.LOT_TONNES) || 0;
      if (Math.abs(rest) >= E.LOT_TONNES) out.push({ lvl: 'info', key: `open-${c.id}`, act: ['contracts', '🛡️ Hedge'],
        html: `🔗 <b>${esc(c.no)}</b> ${c.side === 'buy' ? 'mua' : 'bán'} ${fmt(c.qty, 1)} t${c.party ? ' – ' + esc(c.party) : ''}: còn hở <b>${signed(rest, 1)} t</b>${linked ? ` (đã có ${signed(linked, 0)} lot liên kết)` : ' – chưa có lệnh sàn liên kết'}.` });
    });
    if (book.totals.unrealized && Math.abs(book.totals.unrealized) >= 1000) out.push({ lvl: 'info', key: 'pnl',
      html: `💹 Lệnh sàn đang mở lãi/lỗ tạm tính <b>${signed(book.totals.unrealized, 0)} USD</b> – đánh giá chung với hàng thật đối ứng, không đóng phòng hộ chỉ vì thấy lỗ trên sàn.` });
    if (st.dirty) out.push({ lvl: 'info', key: 'dirty', html: '💾 Có thay đổi chưa lưu ở thẻ Vị thế.' });
    if (!out.length) out.push({ lvl: 'ok', key: 'ok', html: `✅ Vị thế trong hạn mức (ròng ${signed(pos.totals.net, 1)} t), không có hợp đồng sắp hạn chốt hay lệnh sắp đến hạn; giá sàn chưa chạy quá ${fmt(th, 0)} USD/t.` });
    const order = { alert: 0, warn: 1, info: 2, ok: 3 };
    return out.sort((a, b) => order[a.lvl] - order[b.lvl]);
  }
  let stripOpen = true; try { stripOpen = localStorage.getItem('vt_adv') !== '0'; } catch (e) { /* bỏ qua */ }
  function renderStrip() {
    const el = $('adviceStrip'); const st = getState(); if (!el || !st || !st.data) return;
    const items = advice(st); const top = items.slice(0, stripOpen ? 3 : 1); const more = items.length - top.length;
    el.hidden = false; el.className = `advice-strip lvl-${items[0].lvl}`;
    el.innerHTML = `<div class="adv-head"><img src="assets/logo-vietthien.png" alt=""><b>Trợ lý khuyên</b><span class="adv-count">${items.filter(x => x.lvl !== 'ok').length || ''}</span>
        <span class="adv-time">${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        <button type="button" class="adv-btn" data-adv="chat">💬 Hỏi Trợ lý</button><button type="button" class="adv-btn adv-toggle" data-adv="toggle" title="${stripOpen ? 'Thu gọn' : 'Mở rộng'}">${stripOpen ? '▴' : '▾'}</button></div>
      <ul class="adv-list">${top.map(x => `<li class="lvl-${x.lvl}"><span>${x.html}</span>${x.act ? `<button type="button" class="adv-go" data-adv-tab="${x.act[0]}">${x.act[1]} →</button>` : ''}</li>`).join('')}</ul>
      ${more > 0 ? `<button type="button" class="adv-more" data-adv="analysis">+ ${more} lời khuyên khác – xem phân tích</button>` : ''}`;
    const n = items.filter(x => x.lvl === 'alert' || x.lvl === 'warn').length; const dot = $('asFabDot');
    if (dot) { dot.hidden = !n; dot.textContent = n; }
    items.filter(x => x.lvl === 'alert' && x.key && !toasted.has(x.key)).forEach(x => { toasted.add(x.key); if (app() && app().toast) app().toast(plain(x.html).slice(0, 160), 'error'); });
  }

  // ================= 2. PHÂN TÍCH ĐẦY ĐỦ =================
  function analysisHtml() {
    const st = getState(); if (!st) return '';
    const d = st.data; const pos = E.computePositions(d);
    const risk = E.analyzeRisk(pos, { limit: d.riskLimit, priceMove: d.priceMoveUsd });
    const sp = E.computeSpreads(d.columns, st.quotes);
    const out = []; const t = pos.totals.net;
    out.push('<h4>Lời khuyên & cảnh báo</h4><ul class="as-list">' + advice(st).map(x => `<li>${x.html}</li>`).join('') + '</ul>');
    out.push(`<div class="as-card ${t < 0 ? 'bad' : t > 0 ? 'good' : ''}"><div class="as-k">Tổng vị thế ròng</div><div class="as-v">${fmt(t)} tấn</div>`
      + `<div class="as-s">${t < 0 ? `SHORT – công ty đang hụt ${fmt(Math.abs(t), 1)} t: giá tăng thì lỗ` : t > 0 ? `LONG – công ty đang dư ${fmt(t, 1)} t: giá giảm thì lỗ` : 'CÂN BẰNG – rủi ro giá phẳng'}</div>`
      + `<div class="as-s">London ${signed(risk.move)}$ → ${signed(risk.mtmUp)} USD; London −${fmt(risk.move, 0)}$ → ${signed(-risk.mtmUp)} USD</div></div>`);
    out.push('<h4>Vị thế theo kỳ hạn</h4><table class="as-table"><tr><th>Kỳ hạn</th><th>Hàng thực</th><th>Sàn</th><th>Trừ lùi</th><th>Ròng</th></tr>'
      + pos.columns.map((c, i) => `<tr><td>${E.contractLabel(c)}<br><small>${c}</small></td><td>${fmt(pos.physical[i], 1)}</td><td>${fmt(pos.futures[i], 1)}</td><td>${fmt(pos.diff[i], 1)}</td><td class="${pos.net[i] < 0 ? 'neg' : pos.net[i] > 0 ? 'pos' : ''}"><b>${fmt(pos.net[i], 1)}</b></td></tr>`).join('')
      + '</table>');
    // Hàng thật & hàng ảo
    const cs = E.contractSummary(d.contracts, new Date()); const book = E.futuresBook(d.trades, c => priceOf(st, c));
    out.push(`<h4>Hàng thật & hàng ảo</h4><ul class="as-list"><li>📒 ${cs.open} hợp đồng đang mở: bán chưa giao ${fmt(cs.sellUndeliveredT, 1)} t, mua chưa nhận ${fmt(cs.buyUndeliveredT, 1)} t; chưa chốt giá: bán ${fmt(cs.sellUnfixedT, 1)} t, mua ${fmt(cs.buyUnfixedT, 1)} t.</li>`
      + `<li>📉 Lệnh sàn đang mở: ${book.list.filter(g => g.pos).map(g => `RM${g.month} ${signed(g.pos, 0)} lot`).join(', ') || 'không có'} · lãi/lỗ mở ${signed(book.totals.unrealized, 0)} USD · đã chốt ${signed(book.totals.realized, 0)} USD.</li></ul>`);
    out.push('<h4>Khuyến nghị theo hạn mức</h4>');
    const recs = [];
    risk.alerts.forEach(a => {
      if (a.type === 'hedge') recs.push(`🛡️ <b>${E.contractLabel(a.code)}</b>: lệch ${fmt(a.value)} t (hạn mức ${fmt(risk.limit, 0)} t) → <b>${a.action} ${a.lots} lot RM${a.code}</b>. Ghi lệnh ở thẻ 📒 Giao dịch → ➕ Lệnh sàn (dòng tài khoản sàn tự cập nhật).`);
      if (a.type === 'mismatch') recs.push('⚠️ <b>Lệch kỳ hạn</b>: kỳ dư, kỳ hụt. Cân nhắc spread (bán kỳ dư / mua kỳ hụt) hoặc dời lịch giao hàng thay vì hedge từng kỳ riêng lẻ.');
    });
    if (!recs.length) recs.push(`✅ Không kỳ hạn nào vượt hạn mức ${fmt(risk.limit, 0)} t.`);
    out.push('<ul class="as-list">' + recs.map(r => `<li>${r}</li>`).join('') + '</ul>');
    const priced = sp.filter(s => s.value !== null);
    if (priced.length) {
      const inv = priced.filter(s => s.structure === 'Inverted').length;
      out.push('<h4>Cấu trúc thị trường (spread)</h4><ul class="as-list">'
        + priced.map(s => `<li>${s.pair}: <b>${signed(s.value)}</b> USD – ${s.structure}</li>`).join('')
        + `<li>${inv > priced.length / 2 ? '📉 Thị trường <b>nghịch đảo</b>: hàng giao gần đắt hơn → giữ tồn kho qua kỳ bị thiệt; ưu tiên bán sớm, mua kỳ xa.' : '📈 Thị trường <b>bình thường (contango)</b>: kỳ xa cao hơn → có thể giữ hàng nếu chi phí lưu kho thấp hơn mức chênh.'}</li></ul>`);
    }
    const checks = [];
    if (st.dirty) checks.push('💾 Có thay đổi <b>chưa lưu</b> – bấm “Lưu vị thế”.');
    const expired = d.columns.filter(c => E.isExpired(c));
    if (expired.length) checks.push(`⏰ Kỳ hạn ${expired.join(', ')} đã đến tháng giao hàng – bấm “Chuyển kỳ hạn”.`);
    const memo = E.ROWS.filter(r => r.group === 'memo' && pos.rowSums[r.key] !== 0);
    if (memo.length) checks.push(`ℹ️ ${memo.map(r => r.label).join(', ')} chỉ để theo dõi, <b>không</b> cộng vào tổng vị thế.`);
    if (!st.quotesOk && !st.live) checks.push('📡 Chưa kết nối được giá sàn – số liệu giá có thể cũ.');
    out.push('<h4>Kiểm tra dữ liệu</h4><ul class="as-list">' + (checks.length ? checks : ['✅ Dữ liệu hợp lệ.']).map(c => `<li>${c}</li>`).join('') + '</ul>');
    return out.join('');
  }

  // ================= 3. HƯỚNG DẪN & CƠ CHẾ =================
  const GUIDE = `
    <h4>Trợ lý dùng thế nào?</h4><ol class="as-list"><li>Bấm <b>logo Việt Thiên</b> ở góc phải màn hình → gõ câu hỏi tự nhiên, không cần dấu. Ví dụ: <i>“ký 38,4 tấn S18 WP giá 3800 usd fob thì ký sao chốt sao”</i>, <i>“cần phòng hộ bao nhiêu lot”</i>, <i>“diff là gì”</i>.</li><li>Trợ lý tính theo <b>số liệu thật</b>: giá sàn trực tiếp, tỷ giá, nhân xô, bảng diff, vị thế, sổ hợp đồng, lệnh sàn; câu hỏi kiến thức lấy từ thư viện 📚.</li><li>Dải <b>💡 Trợ lý khuyên</b> trên đầu trang luôn hiện 3 việc quan trọng nhất và <b>cảnh báo khi sàn biến động</b> vượt ngưỡng (bằng "bước giá kiểm tra" ở thẻ Vị thế, mặc định 30 USD/t).</li></ol>
    <h4>6 thẻ chính</h4><ol class="as-list">
      <li><b>📈 Tổng quan</b> (cho sếp): vị thế ròng, lời/lỗ khi giá chạy, đề xuất phòng hộ, biểu đồ, tóm tắt.</li>
      <li><b>📊 Vị thế</b>: ma trận LDC. Các dòng hợp đồng (📒) và Robusta sàn (📉) tự lấy từ thẻ Giao dịch; tồn kho, Arabica, hàng gởi nhập tay. Có công cụ tính FOB từ trừ lùi, hạn mức rủi ro.</li>
      <li><b>📒 Giao dịch</b>: <b>hàng thật</b> (hợp đồng mua/bán, chốt giá, giao hàng) và <b>hàng ảo</b> (lệnh sàn futures Robusta London), liên kết với nhau bằng 🛡️ Hedge.</li>
      <li><b>🛡️ Phòng hộ</b>: so sánh 4 chiến lược (Futures, Put, Collar, Hybrid) theo 5 kịch bản giá, tự chạy theo giá sàn trực tiếp.</li>
      <li><b>🌐 Bảng giá</b>: nhân xô trong nước, giá FOB theo chủng loại (diff), chuẩn chất lượng ICE, giá London/New York/Brazil.</li>
      <li><b>📚 Kiến thức</b>: thư viện bài viết có tìm kiếm; nút ⓘ trên các bảng mở đúng bài.</li></ol>
    <h4>Link online</h4><ol class="as-list"><li>Nháy đúp <b>MO_LINK_ONLINE.bat</b> → link <b>https://….trycloudflare.com</b> tự chép vào bộ nhớ tạm.</li><li>Mở link là <b>toàn quyền chỉnh sửa và nhập liệu</b> – chỉ gửi người tin cậy. Mỗi lần lưu có bản sao trong <code>app/data/backups</code>. Muốn link chỉ xem: đặt <code>"openAccess": "viewer"</code> trong <code>app/data/access.json</code> rồi khởi động lại.</li><li>Máy chạy hệ thống phải bật; mỗi lần mở lại đường hầm, link đổi địa chỉ.</li></ol>
    <h4>Giá thời gian thực</h4><ol class="as-list"><li>Giá sàn từ giacaphe.com mỗi 5 giây (qua link online: 3 giây/lần hỏi). Nghi ngờ giá lệch: <b>🔄 Kiểm tra lại giá</b>.</li><li>Tỷ giá Vietcombank và giá nhân xô giacaphe.com: 30 phút/lần.</li></ol>
    <h4>Cơ chế tính</h4>
    <div class="as-formula"><b>Tổng vị thế ròng = Hàng thực + Sàn + Trừ lùi</b> (từng kỳ hạn; hàng gởi và spread lots chỉ theo dõi)</div>
    <div class="as-formula">Hợp đồng: đã chốt chưa giao → dòng "đã chốt giá chưa giao"; đã giao chưa chốt → "đã giao chưa chốt"; chưa chốt chưa giao → dòng trừ lùi; đã chốt và đã giao → hoàn tất</div>
    <div class="as-formula">Lệnh sàn: MUA +10 t/lot, BÁN −10 t/lot vào dòng "Vị thế futures Robusta London"</div>
    <div class="as-formula">Lời/lỗ khi London tăng ΔP = Vị thế ròng × ΔP · Vượt hạn mức → số lot = |vị thế| ÷ 10</div>
    <div class="as-formula">Spread = kỳ gần − kỳ xa · FOB = giá sàn + diff · đ/kg = USD/t × tỷ giá ÷ 1000</div>
    <h4>Bot Telegram</h4><ol class="as-list"><li>✈️ Telegram → Token + Chat ID → Lưu → Gửi thử. Lệnh: <code>/gia</code> <code>/vithe</code> <code>/spread</code> <code>/fob</code> <code>/tuvan</code>.</li></ol>`;

  // ================= 4. HỎI ĐÁP (CHAT) =================
  const chat = [];
  const CHIPS = ['Tình hình vị thế hôm nay?', 'Ký 38,4 tấn S18 WP giá 3.800 USD FOB thì ký sao, chốt sao?', 'Cần phòng hộ bao nhiêu lot?', 'Hợp đồng nào sắp hạn chốt?',
    'Giá FOB S18 WP hôm nay?', 'Giá sàn và nhân xô hôm nay?', 'Chuẩn chất lượng London là gì?', 'Diff là gì, tính thế nào?', 'Khi nào mua, khi nào bán trên sàn?', 'Rủi ro basis là gì?'];
  function greeting() {
    const st = getState(); const a = st && st.data ? advice(st)[0] : null;
    return `Chào anh/chị 👋 Em là <b>Trợ lý Việt Thiên</b>. Em trả lời theo <b>số liệu thật</b> của hệ thống (giá sàn trực tiếp, vị thế, sổ hợp đồng, lệnh sàn, bảng diff) và thư viện ${lib() ? lib().count : ''} bài kiến thức.`
      + (a ? `<br><br>Việc đáng chú ý nhất lúc này: ${a.html}` : '') + '<br><br>Anh/chị hỏi tự nhiên, ví dụ: <i>“ký 38,4 tân hàng 18wp 3800 usd fob thì ký sao chốt sao”</i>.';
  }
  const parseNum = s => { s = String(s).trim(); if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, '')); return Number(s.replace(',', '.')); };
  // Đọc tình huống hợp đồng từ câu hỏi tự do: số lượng, giá/diff, quy cách, mua/bán, điều kiện, kỳ hạn
  function parseScenario(q) {
    const n = norm(q).replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
    const t = /(\d+(?:[.,]\d+)?)\s*(tan|t|mt|ton|tons|tonne)\b/.exec(n), cont = /(\d+(?:[.,]\d+)?)\s*(cont|container|cnt|cong)\b/.exec(n), lot = /(\d+(?:[.,]\d+)?)\s*lot\b/.exec(n);
    let qty = t ? parseNum(t[1]) : cont ? parseNum(cont[1]) * E.CONTAINER_TONNES : lot ? parseNum(lot[1]) * E.LOT_TONNES : 0;
    if (!(qty > 0) || qty > 100000) return null;
    if (!/(ky|ki|hop dong|hd|ban|mua|chot|fob|cif|cfr|gia|usd|diff|tru lui|cong|ptbf|giao)/.test(n)) return null;
    let price = 0, unit = 'usd', diff = null;
    const pu = /(\d[\d.,]*)\s*(usd|\$|do la|do)\b/.exec(n); if (pu) { const v = parseNum(pu[1]); if (v >= 1000 && v <= 15000) price = v; }
    if (!price) { const pv = /(\d[\d.,]*)\s*(d|dong|vnd)\s*\/\s*kg/.exec(n); if (pv) { const v = parseNum(pv[1]); if (v >= 20000 && v <= 400000) { price = v; unit = 'vnd'; } } }
    const dm = /(diff|cong lui|cong toi|cong|tru lui|tru)\s*:?\s*([+-]?\s?\d{1,4})\b/.exec(n);
    if (dm) { let v = Number(dm[2].replace(/\s/g, '')); if (/tru/.test(dm[1]) && v > 0) v = -v; if (Math.abs(v) <= 2000) diff = v; }
    else { const sg = /(?:^|\s)([+-]\d{2,4})\b/.exec(n); if (sg) diff = Number(sg[1]); }
    const pricing = /(tru lui|ptbf|diff|chot sau|chot gia sau)/.test(n) || (diff !== null && !price) ? 'diff' : 'fixed';
    const sc = /(?:\bs|sang|screen)\s*(1[2-9])\b/.exec(n) || /\b(1[2-9])\s*(?=wp|clean|\s*%|\s*bb|\s*danh bong)/.exec(n) || /hang\s*(1[2-9])\b/.exec(n);
    const screen = sc ? Number(sc[1]) : 0, wp = /wp\b|wet polish|danh bong/.test(n), clean = /clean|sach\b/.test(n);
    const bbm = /(\d(?:[.,]\d)?)\s*%\s*(?:bb|den vo|black)?/.exec(n), r = (/\br\s?([123])\b/.exec(n) || [])[1] || '';
    const grade = screen ? `R${r || (screen >= 16 ? 1 : 2)} S${screen}${wp ? ' WP' : clean ? ' Clean' : ''}${bbm ? ` ${bbm[1].replace(',', '.')}% BB` : ''}` : r ? `R${r}` : '';
    const side = /\bmua\b|thu mua/.test(n) && !/\bban\b/.test(n) ? 'buy' : 'sell';
    const terms = ((/\b(fob|cfr|cif|fca|exw)\b/.exec(n) || [])[1] || 'fob').toUpperCase();
    const mc = /\b(?:rm|lrc)?\s?([fhknux])\s?(2\d)\b/.exec(n); let basis = mc ? (mc[1] + mc[2]).toUpperCase() : '';
    if (!basis) { const tm = /thang\s*(\d{1,2})(?:\s*[/-]\s*(?:20)?(\d{2}))?/.exec(n); if (tm) { const m = Number(tm[1]); if (m >= 1 && m <= 12) { const now = new Date(); let y = tm[2] ? 2000 + Number(tm[2]) : now.getFullYear(); if (!tm[2] && m < now.getMonth() + 1) y += 1; basis = E.basisForShipment(`${y}-${String(m).padStart(2, '0')}`); } } }
    return { qty: E.round2(qty), price, unit, diff, pricing, grade, side, terms, basis };
  }
  function scenarioAnswer(st, s) {
    const d = st.data; const basis = s.basis || d.columns[1] || d.columns[0];
    const lon = priceOf(st, basis), fx = fxOf(st), dom = domOf(st);
    const qty = s.qty, lots = qty / E.LOT_TONNES, lotsR = Math.max(1, Math.round(lots));
    const gi = E.matchGrade(d.grades, s.grade);
    let usd = s.unit === 'usd' && s.price ? s.price : s.unit === 'vnd' && s.price && fx ? s.price * 1000 / fx : null;
    if (s.pricing === 'diff' && lon) usd = lon + (s.diff !== null ? s.diff : gi ? gi.diff : 0);
    const priceTxt = s.pricing === 'diff' ? `trừ lùi RM${basis} ${s.diff !== null ? signed(s.diff, 0) : gi ? signed(gi.diff, 0) + ' (theo bảng diff)' : '(chưa có diff)'}` : s.price ? (s.unit === 'vnd' ? `${fmt(s.price, 0)} đ/kg` : `${fmt(s.price, 0)} USD/t`) : 'chưa có giá';
    const out = [`<div class="as-card"><div class="as-k">Tình huống</div><div class="as-v sm">${s.side === 'buy' ? 'MUA' : 'BÁN'} ${fmt(qty, 2)} t ${esc(s.grade || 'Robusta')} · ${priceTxt} · ${esc(s.terms)}</div><div class="as-s">Tính theo giá trực tiếp RM${basis} ${lon ? fmt(lon, 0) : '—'} USD/t · tỷ giá ${fmt(fx, 0)} · nhân xô TB ${dom ? fmt(dom, 0) : '—'} đ/kg${s.basis ? '' : ` (chưa nói kỳ hạn → em dùng kỳ giao xa gần nhất ${basis})`}</div></div>`];
    const L = [`📦 <b>Quy đổi:</b> ${fmt(qty, 2)} t = <b>${fmt(lots, 2)} lot</b> London = ${fmt(qty / E.CONTAINER_TONNES, 2)} cont 20' (320 bao × 60 kg/cont)`];
    if (usd) {
      L.push(`💲 <b>Giá trị:</b> ${fmt(usd, 0)} USD/t × ${fmt(qty, 2)} t = <b>${fmt(usd * qty, 0)} USD</b>${fx ? ` ≈ ${fmt(usd * qty * fx / 1e9, 2)} tỷ VNĐ · ${fmt(usd * fx / 1000, 0)} đ/kg` : ''}`);
      if (lon) L.push(`📈 <b>So với sàn:</b> RM${basis} ${fmt(lon, 0)} → diff ${s.pricing === 'diff' ? 'hợp đồng' : 'ngầm'} <b>${signed(usd - lon, 0)} USD/t</b>`);
    }
    if (gi && lon) {
      const ref = lon + E.num(gi.diff); const gap = (usd || 0) - ref; const ok = s.side === 'sell' ? gap >= 0 : gap <= 0;
      L.push(`📋 <b>So bảng diff</b> (${esc(gi.grade)} ${signed(gi.diff, 0)}, báo giá ${dmyIso(d.grades.date)}): giá tham chiếu hôm nay <b>${fmt(ref, 0)} USD/t</b>${usd ? ` → hợp đồng ${gap >= 0 ? 'cao hơn' : 'thấp hơn'} <b>${fmt(Math.abs(gap), 0)} USD/t</b> (${signed(gap * qty, 0)} USD cả lô) ${ok ? '✅' : '⚠️ nên đàm phán lại'}` : ''}`);
    }
    const cls = E.iceClassFor(s.grade); if (cls && cls !== '—') L.push(`📏 <b>Chất lượng:</b> ${esc(s.grade)} ≈ ICE <b>Class ${cls}</b>${cls === '1' ? ' (chuẩn giá sàn London)' : ` (${signed(E.ICE_CLASSES.find(x => x.cls === cls).adj, 0)} USD/t khi giao lên sàn)`}`);
    if (usd && fx && dom && gi && gi.dom) {
      const cost = dom + E.num(gi.dom), sale = Math.round(usd * fx / 1000), m = sale - cost; const good = s.side === 'sell' ? m >= 0 : m <= 0;
      L.push(`🏭 <b>Giá vốn nội địa ${esc(gi.grade)}:</b> nhân xô ${fmt(dom, 0)} + ${fmt(gi.dom, 0)} = <b>${fmt(cost, 0)} đ/kg</b>; hợp đồng ${fmt(sale, 0)} đ/kg → <b>${s.side === 'sell' ? (m >= 0 ? 'lời' : 'LỖ') : (m <= 0 ? 'rẻ hơn thị trường' : 'đắt hơn thị trường')} ${fmt(Math.abs(m), 0)} đ/kg ≈ ${fmt(Math.abs(m) * qty / 1000, 1)} triệu đồng cả lô</b> ${good ? '✅' : '⚠️'} (chưa trừ chi phí xuất khẩu)`);
    } else if (usd && fx && dom) L.push(`🇻🇳 <b>So nhân xô:</b> ${fmt(usd * fx / 1000, 0)} − ${fmt(dom, 0)} = <b>${signed(usd * fx / 1000 - dom, 0)} đ/kg</b> – chưa trừ chi phí chế biến${/wp/i.test(s.grade) ? ', đánh bóng' : ''}, tỷ lệ thu hồi${screen18(s.grade) ? ' S18' : ''}, bao bì, vận chuyển ra cảng`);
    const trial = { ...d, contracts: (d.contracts || []).concat([E.normalizeContract({ id: '_thu', side: s.side, qty, pricing: s.pricing, price: s.price, unit: s.unit, diff: s.diff || (gi ? gi.diff : 0), basis })]) };
    const before = E.computePositions(d), after = E.computePositions(trial); let i = d.columns.indexOf(basis); if (i < 0) i = 0;
    L.push(`⚖️ <b>Vị thế kỳ ${d.columns[i]}:</b> ${signed(before.net[i], 1)} → <b>${signed(after.net[i], 1)} t</b> · tổng ròng ${signed(before.totals.net, 1)} → <b>${signed(after.totals.net, 1)} t</b> (hạn mức ±${fmt(d.riskLimit, 0)} t/kỳ)${Math.abs(after.net[i]) > d.riskLimit ? ' → <b>vượt hạn mức, phải phòng hộ</b>' : ''}`);
    out.push(`<ul class="as-list">${L.map(x => `<li>${x}</li>`).join('')}</ul>`);
    const fnd = E.parseCode(basis) ? E.firstNoticeDay('RM' + basis) : null; const left = fnd ? E.daysBetween(new Date(), fnd) : null;
    const diffTxt = gi ? signed(gi.diff, 0) : usd && lon ? signed(usd - lon, 0) : '+diff';
    const how = s.side === 'sell' ? [
      `<b>Phương án 1 – Giá cố định${s.price ? ' ' + (s.unit === 'vnd' ? fmt(s.price, 0) + ' đ/kg' : fmt(s.price, 0) + ' USD/t') : ''}:</b> khóa toàn bộ giá. <b>Chưa có hàng</b> → công ty SHORT ${fmt(qty, 1)} t (London +100 → lỗ ${fmt(qty * 100, 0)} USD) → <b>MUA ${lotsR} lot RM${basis}</b> ngay khi ký, bán lại khi đã mua đủ hàng. <b>Đã có hàng trong kho</b> đang hedge bán → mua lại ${lotsR} lot để gỡ hedge: lời đã khóa.`,
      `<b>Phương án 2 – Trừ lùi RM${basis} ${diffTxt}:</b> khóa diff ngay, chốt giá sàn sau${fnd ? ` – hạn chốt trước ngày thông báo đầu tiên ≈ <b>${dayText(fnd)}</b> (còn ${left} ngày)` : ''}; chốt theo lot 10 t (${fmt(lots, 2)} lot – ghi rõ cách xử lý phần lẻ ${fmt(qty % 10, 1)} t); nên ghi rõ ai chốt (buyer's/seller's call).`
    ] : [
      `<b>Mua giá cố định:</b> chưa có đầu ra → công ty LONG ${fmt(qty, 1)} t (London −100 → lỗ ${fmt(qty * 100, 0)} USD) → <b>BÁN ${lotsR} lot RM${basis}</b> khi mua, mua lại khi đã bán được hàng.`,
      `<b>Mua trừ lùi:</b> giá mua = giá RM${basis} lúc chốt ${s.diff !== null ? signed(s.diff, 0) : '+ diff'}; theo dõi hạn chốt${fnd ? ` (≈ ${dayText(fnd)})` : ''} và ghi vào sổ để vị thế tự cập nhật.`];
    out.push(`<h4>✍️ Ký sao – chốt sao</h4><ul class="as-list">${how.map(x => `<li>${x}</li>`).join('')}</ul>`);
    out.push(`<h4>⚠️ Lưu ý khi ký</h4><ul class="as-list"><li>Quy cách ${esc(s.grade || '')}: độ ẩm, % đen vỡ, tạp chất, % trên sàng theo mẫu duyệt; bao đay 60 kg, 320 bao/cont 20'.</li><li>Tháng giao, cảng xếp, ${esc(s.terms)}; thanh toán (CAD/LC – khách mới nên LC hoặc đặt cọc); giám định cuối cùng tại cảng xếp.</li><li>Nếu phòng hộ: chuẩn bị ký quỹ cho ${lotsR} lot và quỹ dự phòng khi giá chạy ngược; hàng vào EU cần hồ sơ EUDR.</li></ul>`);
    const payload = { side: s.side, qty, pricing: s.pricing, price: s.price, unit: s.unit, diff: s.pricing === 'diff' ? (s.diff !== null ? s.diff : gi ? gi.diff : 0) : 0, grade: s.grade, terms: s.terms, basis };
    out.push(`<div class="as-actions"><button type="button" class="btn btn-sm btn-primary" data-as-new="${esc(JSON.stringify(payload))}">📒 Ghi vào sổ hợp đồng</button><button type="button" class="btn btn-sm btn-outline" data-as-kb="case-38-4">📚 Bài tình huống</button><button type="button" class="btn btn-sm btn-outline" data-as-kb="checklist-hd">📚 Checklist ký HĐ</button></div>`);
    return out.join('');
  }
  const screen18 = g => /S18/.test(g || '');
  function summaryAnswer(st) {
    const items = summary(st); const pos = E.computePositions(st.data);
    return `<b>Tình hình hôm nay</b><ul class="as-list">${items.map(x => `<li>${x}</li>`).join('')}</ul>`
      + `<table class="as-table"><tr><th>Kỳ</th><th>Ròng (t)</th></tr>${pos.columns.map((c, i) => `<tr><td>${c}</td><td class="${pos.net[i] < 0 ? 'neg' : pos.net[i] > 0 ? 'pos' : ''}"><b>${fmt(pos.net[i], 1)}</b></td></tr>`).join('')}</table>`
      + '<div class="as-actions"><button type="button" class="btn btn-sm btn-outline" data-as-tab="analysis">📊 Phân tích đầy đủ</button></div>';
  }
  function hedgeAnswer(st) {
    const d = st.data; const pos = E.computePositions(d); const risk = E.analyzeRisk(pos, { limit: d.riskLimit, priceMove: d.priceMoveUsd });
    const lines = risk.alerts.filter(a => a.type === 'hedge').map(a => `🛡️ Kỳ <b>${a.code}</b> hở ${signed(a.value, 1)} t → <b>${a.action} ${a.lots} lot RM${a.code}</b>`);
    (d.contracts || []).forEach(c => { const exp = E.contractExposure(c); if (!exp) return; const linked = E.linkedLots(d.trades, c.id); const rest = E.round2(exp + linked * 10) || 0;
      const pend = E.pendingLots(d.trades, c.id);
      if (Math.abs(rest) >= 5) lines.push(`🔗 <b>${esc(c.no)}</b> (${c.side === 'buy' ? 'mua' : 'bán'} ${fmt(c.qty, 1)} t, RM${esc(c.basis)}): còn hở ${signed(rest, 1)} t → <b>${rest < 0 ? 'MUA' : 'BÁN'} ${Math.max(1, Math.round(Math.abs(rest) / 10))} lot RM${esc(c.basis)}</b>${pend ? ` – đã có lệnh chờ ${signed(pend, 0)} lot chưa khớp: khớp rồi bấm ✔ Khớp` : ' (bấm 🛡️ Hedge trên hợp đồng)'}`); });
    return `<b>Phòng hộ cần làm</b> (hạn mức ±${fmt(risk.limit, 0)} t/kỳ, vị thế ròng tổng ${signed(pos.totals.net, 1)} t)<ul class="as-list">${(lines.length ? lines : ['✅ Không kỳ nào vượt hạn mức và các hợp đồng đã được phòng hộ trong phạm vi 1 lot.']).map(x => `<li>${x}</li>`).join('')}</ul>`
      + '<p class="as-muted">Nguyên tắc: âm (thiếu hàng) → MUA; dương (dư hàng) → BÁN; cùng kỳ tham chiếu với hợp đồng; không đầu cơ.</p><div class="as-actions"><button type="button" class="btn btn-sm btn-outline" data-as-goto="contracts">📒 Mở Giao dịch</button><button type="button" class="btn btn-sm btn-outline" data-as-kb="khi-nao-mua-ban">📚 Khi nào mua/bán</button></div>';
  }
  function dueAnswer(st) {
    const d = st.data; const cs = E.contractSummary(d.contracts, new Date()); const book = E.futuresBook(d.trades, c => priceOf(st, c));
    const L = cs.due.map(x => `⏰ <b>${esc(x.no)}</b>${x.party ? ' – ' + esc(x.party) : ''}: ${fmt(x.unfixedT, 1)} t chưa chốt (RM${x.basis}) – hạn ≈ <b>${dayText(x.fnd)}</b> (${x.left < 0 ? 'đã quá hạn' : `còn ${x.left} ngày`})`);
    book.list.filter(g => g.pos).forEach(g => { const f = E.firstNoticeDay('RM' + g.month); if (f) L.push(`📉 Lệnh RM${g.month}${g.account ? ' (' + esc(g.account) + ')' : ''} ${signed(g.pos, 0)} lot – ngày thông báo đầu tiên ${dayText(f)} (còn ${E.daysBetween(new Date(), f)} ngày)`); });
    return `<b>Hạn chốt giá & hạn lệnh sàn</b><ul class="as-list">${(L.length ? L : ['✅ Không có hợp đồng trừ lùi chưa chốt hay lệnh sàn đang mở.']).map(x => `<li>${x}</li>`).join('')}</ul><div class="as-actions"><button type="button" class="btn btn-sm btn-outline" data-as-kb="chot-gia">📚 Quy trình chốt giá</button><button type="button" class="btn btn-sm btn-outline" data-as-kb="roll">📚 Đảo kỳ</button></div>`;
  }
  function gradeAnswer(st, q) {
    const d = st.data; const s = parseScenario(q + ' 1 tan gia') || {}; const g = d.grades || {};
    const ref = (d.fobParams.contract || '').replace(/^RM/, '') || d.columns[1]; const lon = priceOf(st, ref), fx = fxOf(st), dom = domOf(st);
    const one = s.grade ? E.matchGrade(g, s.grade) : null; const list = one ? [one] : (g.items || []);
    return `<b>Giá FOB theo chủng loại</b> – RM${ref} ${lon ? fmt(lon, 0) : '—'} + diff (báo giá ${dmyIso(g.date)})<table class="as-table"><tr><th>Loại</th><th>Diff</th><th>FOB</th><th>đ/kg</th></tr>${list.map(it => { const fob = lon ? lon + E.num(it.diff) : 0; return `<tr><td>${esc(it.grade)}<br><small>ICE Class ${E.iceClassFor(it.grade) || '—'}</small></td><td>${signed(it.diff, 0)}</td><td><b>${fob ? fmt(fob, 0) : '—'}</b></td><td>${fob && fx ? fmt(fob * fx / 1000, 0) : '—'}</td></tr>`; }).join('')}</table>`
      + `<p class="as-muted">${dom ? `Nhân xô TB ${fmt(dom, 0)} đ/kg. ` : ''}FOB = giá sàn hiện tại + diff của bảng báo giá (chưa điều chỉnh chênh lệch giữa các kỳ).</p><div class="as-actions"><button type="button" class="btn btn-sm btn-outline" data-as-goto="board">🌐 Bảng giá</button><button type="button" class="btn btn-sm btn-outline" data-as-kb="diff">📚 Diff là gì</button></div>`;
  }
  // Giá theo hạng chất lượng (Class 1 = giá sàn) kèm hàng Việt Nam tương đương, FOB thị trường và giá vốn nội địa
  function classAnswer(st) {
    const d = st.data; const ref = (d.classAlert && d.classAlert.month) || String(d.fobParams.contract || '').replace(/^RM/, '') || d.columns[1];
    const p = priceOf(st, ref), fx = fxOf(st), dom = domOf(st); const L = E.classLadder(p, d.grades);
    return `<b>Giá theo hạng chất lượng – RM${ref}</b> (Class 1 = giá sàn <b>${p ? fmt(p, 0) : '—'} USD/t</b>${p && fx ? ` ≈ ${fmt(p * fx / 1000, 0)} đ/kg` : ''})`
      + `<table class="as-table"><tr><th>Hạng</th><th>Giao sàn</th><th>Hàng VN</th><th>FOB thị trường</th></tr>${L.map(r => `<tr><td>Class ${r.cls}</td><td><b>${r.exchange ? fmt(r.exchange, 0) : '—'}</b></td><td><small>${esc(r.vn)}</small></td><td>${r.fobLo ? (r.fobLo === r.fobHi ? fmt(r.fobLo, 0) : `${fmt(r.fobLo, 0)}–${fmt(r.fobHi, 0)}`) : '—'}</td></tr>`).join('')}</table>`
      + `<ul class="as-list">${(d.grades.items || []).map(it => { const ec = E.gradeEconomics(it, p, fx, dom); return ec.marginVnd === null ? '' : `<li>${esc(it.grade)}: giá vốn nội địa ${fmt(ec.costVnd, 0)} đ/kg (nhân xô + ${fmt(it.dom, 0)}) · FOB ${fmt(ec.fobVnd, 0)} đ/kg → biên <b>${signed(ec.marginVnd, 0)} đ/kg</b></li>`; }).join('')}</ul>`
      + '<p class="as-muted">Giá giao sàn = giá sàn + mức cộng/trừ của hạng (chỉ khi giao lên sàn). FOB thị trường = giá sàn + diff bảng báo giá.</p><div class="as-actions"><button type="button" class="btn btn-sm btn-outline" data-as-goto="board">📏 Theo dõi Class 1</button><button type="button" class="btn btn-sm btn-outline" data-as-kb="san-vs-hang-that">📚 Sàn London là hàng loại nào</button></div>';
  }
  function priceAnswer(st) {
    const list = (st.quotes || {}).coffee_liffe || []; const ny = ((st.quotes || {}).coffee_ice || [])[0]; const dm = st.domestic; const fx = fxOf(st);
    const sp = E.computeSpreads(st.data.columns, st.quotes).filter(x => x.value !== null);
    return `<b>Giá hôm nay</b><table class="as-table"><tr><th>Kỳ</th><th>Giá</th><th>Thay đổi</th></tr>${list.slice(0, 6).map(q => `<tr><td>${esc(q.Name)}</td><td><b>${fmt(q.Last, 0)}</b></td><td class="${E.num(q.Change) < 0 ? 'neg' : E.num(q.Change) > 0 ? 'pos' : ''}">${signed(q.Change, 0)} (${esc(q.PtcChange)}%)</td></tr>`).join('')}</table>`
      + `<ul class="as-list">${ny ? `<li>Arabica ${esc(ny.Name)}: <b>${fmt(ny.Last, 2)} cent/lb</b> (${signed(ny.Change, 2)})</li>` : ''}${dm ? `<li>Nhân xô TB Tây Nguyên: <b>${fmt(dm.avg, 0)} đ/kg</b> (${dm.change ? signed(dm.change, 0) : 'không đổi'}) – ${esc(dm.date || '')}</li>` : ''}<li>Tỷ giá VCB (mua CK): <b>${fmt(fx, 0)}</b></li>${sp.length ? `<li>Spread: ${sp.map(x => `${x.pair} ${signed(x.value, 0)}`).join(' · ')}</li>` : ''}</ul>`;
  }
  function kbAnswer(q) {
    const L = lib(); const res = L ? L.search(q, 5) : [];
    if (!res.length) return `Em chưa tìm thấy nội dung khớp "<b>${esc(q)}</b>". Anh/chị thử hỏi theo dạng: <i>“ký 38,4 tấn S18 WP 3800 FOB”</i>, <i>“phòng hộ bao nhiêu lot”</i>, <i>“hạn chốt”</i>, <i>“giá FOB S16 hôm nay”</i>, hoặc từ khóa kiến thức (diff, basis, ký quỹ, chuẩn London, R2…).`;
    const a = res[0];
    return `<div class="as-kb"><div class="as-k">📚 ${esc((L.cats.find(c => c[0] === a.cat) || [])[1] || '')}</div><b>${esc(a.title)}</b><p class="as-sum">${esc(a.sum)}</p><div class="lib-content">${a.body}</div></div>`
      + (res.length > 1 ? `<div class="as-k" style="margin-top:8px">Bài liên quan</div><div class="as-actions">${res.slice(1).map(b => `<button type="button" class="btn btn-sm btn-outline" data-as-kb="${b.id}">${esc(b.title)}</button>`).join('')}</div>` : '');
  }
  function answer(q) {
    const st = getState(); const n = norm(q);
    const sc = parseScenario(q); if (sc && st && st.data) return scenarioAnswer(st, sc);
    if (!st || !st.data) return kbAnswer(q);
    const concept = /(la gi|nghia la|khai niem|the nao la|tai sao|vi sao|cach tinh)/.test(n);
    if (!concept && /(tinh hinh|tong quan|bao cao|tom tat|vi the (hom nay|hien tai|the nao|ra sao)|hom nay the nao)/.test(n)) return summaryAnswer(st);
    if (!concept && /(phong ho|hedge|bao nhieu lot|can mua|can ban|con ho|vuot han muc)/.test(n)) return hedgeAnswer(st);
    if (!concept && /(han chot|sap het han|sap den han|ngay thong bao|sap toi han)/.test(n)) return dueAnswer(st);
    if (!concept && /(class|theo hang|gia chuan|bien loi|gia von|lo lai tung loai)/.test(n)) return classAnswer(st);
    if (!concept && /(gia|fob)/.test(n) && /(s1[2-9]|\b1[2-9]\s*(wp|clean)|wp\b|wet polish|clean|chung loai|tung loai|cac loai)/.test(n)) return gradeAnswer(st, q);
    if (!concept && /(gia (london|san|robusta|hom nay|nhan xo)|london hom nay|nhan xo hom nay|ty gia hom nay|gia ca phe hom nay)/.test(n)) return priceAnswer(st);
    return kbAnswer(q);
  }
  function renderChat() {
    const body = $('assistantBody'); if (!body) return;
    if (!chat.length) chat.push({ who: 'bot', html: greeting() });
    body.classList.add('chat-mode');
    body.innerHTML = `<div class="as-msgs" id="asMsgs">${chat.map(m => `<div class="as-msg ${m.who}">${m.who === 'bot' ? '<img src="assets/logo-vietthien.png" alt="">' : ''}<div class="as-bubble">${m.html}</div></div>`).join('')}</div>
      <div class="as-chips">${CHIPS.map(c => `<button type="button" class="as-chip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <form class="as-input" id="asForm" autocomplete="off"><textarea id="asQ" rows="1" placeholder="Hỏi Trợ lý… (vd: ký 38,4 tấn S18 WP 3.800 FOB thì ký sao?)"></textarea><button type="submit" class="btn btn-primary" aria-label="Gửi">➤</button></form>`;
    const msgs = $('asMsgs'); const last = msgs.lastElementChild;
    if (last && last.classList.contains('bot') && chat.length > 1) msgs.scrollTop = last.offsetTop - 8; else msgs.scrollTop = msgs.scrollHeight;
    if (window.matchMedia('(min-width: 769px)').matches) $('asQ').focus();
  }
  function ask(q) {
    q = String(q || '').trim(); if (!q) return;
    chat.push({ who: 'me', html: esc(q) });
    let a; try { a = answer(q); } catch (e) { console.error(e); a = 'Xin lỗi, em chưa xử lý được câu này – anh/chị thử hỏi cách khác.'; }
    chat.push({ who: 'bot', html: a }); while (chat.length > 40) chat.shift();
    currentTab = 'chat'; render();
  }

  // ================= 5. ĐIỀU KHIỂN KHUNG TRỢ LÝ =================
  function render() {
    const body = $('assistantBody'); if (!body) return;
    document.querySelectorAll('.assistant-tab').forEach(x => x.classList.toggle('active', x.dataset.tab === currentTab));
    if (currentTab === 'chat') return renderChat();
    body.classList.remove('chat-mode');
    body.innerHTML = currentTab === 'analysis' ? analysisHtml() : GUIDE;
    body.scrollTop = 0;
  }
  function open(tab) {
    if (tab) currentTab = tab === 'faq' ? 'chat' : tab === 'mechanism' ? 'guide' : tab;
    $('assistantDrawer').classList.add('open'); $('assistantDrawer').setAttribute('aria-hidden', 'false'); document.body.classList.add('as-open'); render();
  }
  function close() { $('assistantDrawer').classList.remove('open'); $('assistantDrawer').setAttribute('aria-hidden', 'true'); document.body.classList.remove('as-open'); }

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
    const cs = E.contractSummary(d.contracts, new Date());
    if (cs.open) out.push(`📒 <b>${cs.open} hợp đồng đang mở</b>: bán chưa giao ${fmt(cs.sellUndeliveredT, 1)} t, mua chưa nhận ${fmt(cs.buyUndeliveredT, 1)} t; chưa chốt giá: bán ${fmt(cs.sellUnfixedT, 1)} t, mua ${fmt(cs.buyUnfixedT, 1)} t.`);
    cs.due.filter(x => x.left <= 15).forEach(x => out.push(`⏰ <b>${esc(x.no)}</b> còn ${fmt(x.unfixedT, 1)} t chưa chốt giá – hạn ≈ ${dayText(x.fnd)} (còn ${x.left} ngày).`));
    const book = E.futuresBook(d.trades, c => priceOf(st, c));
    if (book.list.some(g => g.pos)) out.push(`📉 Lệnh sàn đang mở: ${book.list.filter(g => g.pos).map(g => `RM${g.month} ${signed(g.pos, 0)} lot`).join(', ')} – lãi/lỗ tạm tính <b>${signed(book.totals.unrealized, 0)} USD</b>.`);
    const sp = E.computeSpreads(d.columns, st.quotes).filter(s => s.value !== null);
    const front = ((st.quotes || {}).coffee_liffe || [])[0];
    if (front) out.push(`Robusta ${front.Name}: <b>${fmt(front.Last, 0)} USD/t</b> (${E.signed(front.Change)} | ${front.PtcChange}%). ${sp.length ? (sp.filter(s => s.structure === 'Inverted').length > sp.length / 2 ? 'Thị trường <b>nghịch đảo</b>: nên ưu tiên bán/giao sớm.' : 'Thị trường <b>bình thường</b>: giữ hàng ít bị thiệt.') : ''}`);
    const today = new Date();
    ((st.quotes || {}).coffee_liffe || []).forEach(q => {
      const f = E.firstNoticeDay(q.Name); if (!f) return; const left = E.daysBetween(today, f);
      if (left >= 0 && left <= 15) out.push(`⏰ <b>${E.mxvCode(q.Name)}</b> đến ngày thông báo đầu tiên ${f.getDate()}/${f.getMonth() + 1} (còn ${left} ngày) – đóng/đảo vị thế sàn kỳ này trước hạn.`);
    });
    if (st.dirty) out.push('💾 Có thay đổi chưa lưu.');
    if (d.columns.some(c => E.isExpired(c))) out.push('⏰ Ma trận có kỳ hạn đã đến tháng giao hàng – cần Chuyển kỳ hạn.');
    return out;
  }

  window.VTAssistant = {
    init(fn) {
      getState = fn;
      const fab = $('assistantFab'); if (fab) fab.addEventListener('click', () => ($('assistantDrawer').classList.contains('open') ? close() : open()));
      const old = $('btnAssistant'); if (old) old.addEventListener('click', () => open());
      $('btnCloseAssistant').addEventListener('click', close);
      $('assistantTabs').addEventListener('click', e => { const b = e.target.closest('.assistant-tab'); if (!b) return; currentTab = b.dataset.tab; render(); });
      const drawer = $('assistantDrawer');
      drawer.addEventListener('submit', e => { if (e.target.id === 'asForm') { e.preventDefault(); ask($('asQ').value); } });
      drawer.addEventListener('keydown', e => { if (e.target.id === 'asQ' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(e.target.value); } });
      drawer.addEventListener('input', e => { if (e.target.id === 'asQ') { e.target.style.height = 'auto'; e.target.style.height = Math.min(120, e.target.scrollHeight) + 'px'; } });
      drawer.addEventListener('click', e => {
        const chip = e.target.closest('.as-chip'); if (chip) return ask(chip.dataset.q);
        const kb = e.target.closest('[data-as-kb]'); if (kb && lib()) return lib().peek(kb.dataset.asKb);
        const nw = e.target.closest('[data-as-new]'); if (nw && window.VTContracts) { const p = JSON.parse(nw.dataset.asNew); close(); app().showTab('contracts'); return window.VTContracts.newContract(p); }
        const tb = e.target.closest('[data-as-tab]'); if (tb) { currentTab = tb.dataset.asTab; return render(); }
        const go = e.target.closest('[data-as-goto]'); if (go) { close(); return app().showTab(go.dataset.asGoto); }
      });
      const strip = $('adviceStrip');
      if (strip) strip.addEventListener('click', e => {
        const b = e.target.closest('[data-adv]'); const t = e.target.closest('[data-adv-tab]');
        if (t) return app().showTab(t.dataset.advTab);
        if (!b) return;
        if (b.dataset.adv === 'toggle') { stripOpen = !stripOpen; try { localStorage.setItem('vt_adv', stripOpen ? '1' : '0'); } catch (err) { /* bỏ qua */ } return renderStrip(); }
        open(b.dataset.adv);
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('assistantDrawer').classList.contains('open') && !document.querySelector('.modal-overlay.active')) close(); });
      if (location.hash === '#tro-ly') setTimeout(open, 300); // mở thẳng trợ lý: …/#tro-ly
      setInterval(renderStrip, 60000);
    },
    refresh() {
      renderStrip();
      if ($('assistantDrawer') && $('assistantDrawer').classList.contains('open') && currentTab === 'analysis') render();
    },
    open, ask, summary, advice
  };
})();

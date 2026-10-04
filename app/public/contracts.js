// VIỆT THIÊN COFFEE GROUP — Sổ hợp đồng mua/bán hàng thực
// Ghi hợp đồng → chốt giá (trừ lùi) → giao/nhận hàng. Mỗi thay đổi tự lưu và tự đổ vào ma trận vị thế (engine.contractRows).
(function () {
  'use strict';
  const E = window.VTEngine, A = window.VTApp;
  const $ = id => document.getElementById(id);
  const fmt = (n, d) => E.fmt(n, d), signed = (n, d) => E.signed(n, d);
  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const S = () => A.getState();
  const todayStr = () => new Date().toLocaleDateString('sv-SE');
  const dmy = iso => { if (!iso) return '—'; const [y, m, d] = String(iso).split('-'); return d ? `${d}/${m}/${y}` : `${m}/${y}`; };
  const dayText = d => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const london = code => { const q = ((S().quotes || {}).coffee_liffe || []).find(x => x.Name === 'RM' + code); return q ? E.num(q.Last) : 0; };
  const fxRate = () => { const s = S(); return (s.fx && s.fx.transfer) || E.num(s.data.fobParams.exchangeRate) || 0; };
  const domesticAvg = () => { const d = S().domestic; return d && d.avg ? d.avg : 0; };
  const GRADES = ['R1 S18 WP', 'R1 S18', 'R1 S16 WP', 'R1 S16', 'R1 S13', 'R2 S13', 'R2 (nhân xô)', 'Arabica'];
  const TERMS = ['FOB', 'CFR', 'CIF', 'FCA', 'EXW', 'Giao kho'];
  const SIDE = { sell: 'BÁN', buy: 'MUA' };
  const FIX = { open: 'Chưa chốt', partial: 'Chốt một phần', fixed: 'Đã chốt' };
  const DEL = { none: 'Chưa giao', partial: 'Giao một phần', done: 'Đã giao' };

  // ---------- Danh sách ----------
  function render() {
    const s = S(); if (!s || !s.data || !$('ctTable')) return;
    const list = s.data.contracts || [];
    const sum = E.contractSummary(list, new Date());
    const soon = sum.due.filter(d => d.left <= 15);
    const kpi = (k, v, cls) => `<div class="ct-kpi ${cls || ''}"><div class="k">${k}</div><div class="v">${v}</div></div>`;
    $('ctKpis').innerHTML = [
      kpi('Hợp đồng đang mở', `${sum.open}<small> / ${sum.count}</small>`),
      kpi('Bán chưa giao', `${fmt(sum.sellUndeliveredT, 1)} <small>t</small>`),
      kpi('Mua chưa nhận', `${fmt(sum.buyUndeliveredT, 1)} <small>t</small>`),
      kpi('Chưa chốt giá', `<small>Bán</small> ${fmt(sum.sellUnfixedT, 1)} <small>· Mua</small> ${fmt(sum.buyUnfixedT, 1)}`),
      kpi('Sổ HĐ → vị thế ròng', `${signed(sum.netEffect, 1)} <small>t</small>`, sum.netEffect < 0 ? 'neg' : sum.netEffect > 0 ? 'pos' : ''),
      kpi('Sắp đến hạn chốt (≤ 15 ngày)', `${soon.length}`, soon.length ? 'warn' : '')
    ].join('');

    const f = $('ctFilter').value, q = norm($('ctSearch').value);
    const rows = list.map(c => ({ c, st: E.contractState(c) }))
      .filter(({ c, st }) => (f === 'all' || (f === 'open' && !st.closed) || (f === 'unfixed' && st.unfixedT > 0) || (f === 'undelivered' && st.delStatus !== 'done') || (f === 'done' && st.closed))
        && (!q || norm([c.no, c.party, c.grade, c.note, c.basis, c.terms, SIDE[c.side]].join(' ')).includes(q)))
      .sort((a, b) => (a.st.closed - b.st.closed) || String(b.c.date).localeCompare(String(a.c.date)));
    const head = '<thead><tr><th>Hợp đồng</th><th>Loại · Đối tác · Hàng</th><th>Số lượng</th><th>Giá · Kỳ hạn</th><th>Chốt giá</th><th>Giao / nhận</th><th>Vào vị thế</th><th></th></tr></thead>';
    const body = rows.map(({ c, st }) => rowHtml(c, st)).join('')
      || `<tr><td colspan="8" class="ct-empty">${list.length ? 'Không có hợp đồng khớp bộ lọc.' : 'Chưa có hợp đồng nào. Bấm <b>➕ Hợp đồng mới</b> để ghi hợp đồng mua/bán đầu tiên – vị thế sẽ tự cập nhật.'}</td></tr>`;
    $('ctTable').innerHTML = head + `<tbody>${body}</tbody>`;

    const { moved } = E.contractRows(list, s.data.columns);
    $('ctNotes').innerHTML = moved.length ? `<div class="ct-note">⚠️ ${moved.map(m => `<b>${esc(m.no || 'HĐ')}</b> tham chiếu ${esc(m.basis || '(chưa chọn kỳ hạn)')}`).join(', ')} – ${moved.some(m => m.expired) ? 'kỳ hạn đã qua, đang tạm tính vào kỳ đầu của ma trận. Nên sửa kỳ hạn tham chiếu (roll) cho đúng.' : 'ngoài 6 kỳ hạn đang hiển thị, tạm tính vào kỳ gần nhất.'}</div>` : '';
    renderTrades();
  }

  // ---------- Hàng ảo: lệnh sàn Robusta London ----------
  function renderTrades() {
    const s = S(); if (!$('trTable')) return;
    const trades = s.data.trades || [];
    const book = E.futuresBook(trades, london);
    const pos = E.computePositions(s.data);
    const real = E.round2(pos.totals.physical + pos.totals.diff) || 0;
    const cls = v => (v < 0 ? 'neg' : v > 0 ? 'pos' : '');
    const kpi = (k, v, c) => `<div class="ct-kpi ${c || ''}"><div class="k">${k}</div><div class="v">${v}</div></div>`;
    const open = book.list.filter(g => g.pos);
    $('trKpis').innerHTML = [
      kpi('Hàng thật → vị thế', `${signed(real, 1)} <small>t</small>`, cls(real)),
      kpi('Hàng ảo (sàn) → vị thế', `${signed(pos.totals.futures, 1)} <small>t</small>`, cls(pos.totals.futures)),
      kpi('Ròng sau phòng hộ', `${signed(pos.totals.net, 1)} <small>t</small>`, cls(pos.totals.net)),
      kpi('Lot đang mở', open.length ? open.map(g => `<span class="tr-chip">${g.month}${g.account ? '·' + esc(g.account) : ''} ${signed(g.pos, 0)}</span>`).join(' ') : '0'),
      kpi('Lãi/lỗ đang mở', `${signed(book.totals.unrealized, 0)} <small>USD</small>`, cls(book.totals.unrealized)),
      kpi('Lãi/lỗ đã chốt', `${signed(book.totals.realized, 0)} <small>USD</small>`, cls(book.totals.realized))
    ].join('');
    const cmap = Object.fromEntries((s.data.contracts || []).map(c => [c.id, c]));
    const td = (label, html, c) => `<td data-label="${label}"${c ? ` class="${c}"` : ''}><div class="cv">${html}</div></td>`;
    const body = trades.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(t => {
      const pend = !E.isFilled(t);
      const last = london(t.month); const q = E.tradeLots(t);
      const pnl = !pend && last && t.price ? Math.round((last - t.price) * q * E.LOT_TONNES) : null;
      const c = cmap[t.link];
      return `<tr class="${pend ? 'pending' : ''}">` + td('Ngày', `<b>${dmy(t.date)}</b><small>${esc(t.account || 'Robusta London')}</small>`)
        + td('Lệnh', `${pend ? '<span class="ct-badge pending">⏳ LỆNH CHỜ</span> ' : ''}<span class="ct-badge ${t.side === 'buy' ? 'buy' : 'sell'}">${t.side === 'buy' ? 'MUA' : 'BÁN'}</span> <b>${fmt(t.lots, t.lots % 1 ? 2 : 0)} lot</b><small>${fmt(t.lots * E.LOT_TONNES, 1)} t · RM${esc(t.month)}${pend ? ' · chưa khớp, chưa tính vào vị thế' : ''}</small>`)
        + td(pend ? 'Giá đặt' : 'Giá khớp', t.price ? `<b>${fmt(t.price, 0)}</b><small>${pend ? 'giá đặt' : 'USD/t'}</small>` : `<b>—</b><small>${pend ? 'theo thị trường' : 'đầu kỳ'}</small>`)
        + td('Giá hiện tại', last ? `<b>${fmt(last, 0)}</b><small>RM${esc(t.month)}</small>` : '—')
        + td('Lãi/lỗ theo giá hiện tại', pnl === null ? (pend ? '<span class="muted">chưa khớp</span>' : '—') : `<b>${signed(pnl, 0)}</b><small>USD</small>`, pnl === null ? '' : cls(pnl))
        + td('Liên kết hàng thật', c ? `<b>${esc(c.no)}</b><small>${SIDE[c.side]} ${fmt(c.qty, 1)} t${c.party ? ' · ' + esc(c.party) : ''}</small>` : '<span class="muted">—</span>', 'txt')
        + `<td class="ct-actions-cell"><div class="ct-actions">${pend ? `<button class="btn btn-sm btn-secondary" data-tact="fill" data-id="${esc(t.id)}" title="Lệnh đã khớp trên sàn – ghi giá khớp thực tế">✔ Khớp</button>` : ''}<button class="btn btn-sm btn-outline" data-tact="edit" data-id="${esc(t.id)}" title="Sửa">✏️</button><button class="btn btn-sm btn-outline" data-tact="del" data-id="${esc(t.id)}" title="Xóa">🗑</button></div></td></tr>`;
    }).join('') || '<tr><td colspan="7" class="ct-empty">Chưa có lệnh sàn nào. Bấm <b>➕ Lệnh sàn</b> (hoặc <b>🛡️ Hedge</b> trên một hợp đồng) để ghi lệnh MUA/BÁN – dòng tài khoản sàn của ma trận tự cập nhật.</td></tr>';
    $('trTable').innerHTML = '<thead><tr><th>Ngày · Tài khoản</th><th>Lệnh</th><th>Giá khớp</th><th>Giá hiện tại</th><th>Lãi/lỗ</th><th>Liên kết hàng thật</th><th></th></tr></thead>' + `<tbody>${body}</tbody>`;
    const bk = book.list.filter(g => g.pos || g.realized);
    $('trBook').innerHTML = bk.length ? `<table class="ct-table tr-book"><thead><tr><th>Kỳ hạn · Tài khoản</th><th>Lot ròng</th><th>Giá vốn TB</th><th>Giá hiện tại</th><th>Lãi/lỗ mở</th><th>Đã chốt</th></tr></thead><tbody>${bk.map(g => '<tr>'
      + td('Kỳ hạn · TK', `<b>RM${esc(g.month)}</b><small>${esc(g.account || 'Robusta London')}</small>`) + td('Lot ròng', `<b>${signed(g.pos, g.pos % 1 ? 2 : 0)}</b><small>${signed(g.pos * E.LOT_TONNES, 1)} t</small>`, cls(g.pos))
      + td('Giá vốn TB', g.pos ? fmt(g.avg, 0) : '—') + td('Giá hiện tại', g.last ? fmt(g.last, 0) : '—')
      + td('Lãi/lỗ mở', g.unrealized === null ? '—' : `<b>${signed(g.unrealized, 0)}</b>`, g.unrealized === null ? '' : cls(g.unrealized))
      + td('Đã chốt', `<b>${signed(g.realized, 0)}</b>`, cls(g.realized)) + '</tr>').join('')}</tbody></table>` : '';
    const { moved } = E.tradeRows(trades, s.data.columns);
    const pendList = trades.filter(t => !E.isFilled(t));
    $('trNotes').innerHTML = (pendList.length ? `<div class="ct-note">⏳ ${pendList.length} lệnh chờ chưa khớp: ${pendList.map(t => `${t.side === 'buy' ? 'MUA' : 'BÁN'} ${fmt(t.lots, t.lots % 1 ? 2 : 0)} lot RM${esc(t.month)}${t.price ? ' @' + fmt(t.price, 0) : ''}`).join(', ')} – <b>chưa tính vào vị thế</b>. Khi lệnh khớp trên sàn, bấm <b>✔ Khớp</b> và sửa giá khớp thực tế.</div>` : '')
      + (moved.length ? `<div class="ct-note">⚠️ Lệnh ở kỳ ${[...new Set(moved.map(m => m.month))].join(', ')} ${moved.some(m => m.expired) ? 'đã đến hạn – nên đóng hoặc đảo sang kỳ sau (roll); đang tạm tính vào kỳ đầu của ma trận.' : 'ngoài 6 kỳ hạn đang hiển thị, tạm tính vào kỳ gần nhất.'}</div>` : '');
  }
  function rowHtml(c, st) {
    const lon = london(c.basis);
    let price;
    if (c.pricing === 'fixed') price = !c.price ? '<b>—</b>' : c.unit === 'vnd' ? `<b>${fmt(c.price, 0)}</b> <small>đ/kg</small>` : `<b>${fmt(c.price, 0)}</b> <small>USD/t</small>`;
    else price = `RM${esc(c.basis)} <b>${signed(c.diff, 0)}</b>${st.priceUsd !== null ? `<small>đã chốt TB ${fmt(st.priceUsd, 0)} USD/t</small>` : lon ? `<small>≈ ${fmt(lon + E.num(c.diff), 0)} theo giá hiện tại</small>` : ''}`;
    let fix;
    if (c.pricing === 'fixed') fix = '<span class="ct-badge fixed">Giá cố định</span>';
    else {
      const fnd = st.unfixedT > 0 ? E.fixDeadline(c) : null; const left = fnd ? E.daysBetween(new Date(), fnd) : null;
      fix = `${fmt(st.fixedT, 1)} / ${fmt(st.qty, 1)} t <span class="ct-badge ${st.fixStatus}">${FIX[st.fixStatus]}</span>${bar(st.fixedT, st.qty)}`
        + (fnd ? `<small class="${left <= 15 ? 'warn' : ''}">Hạn chốt ≈ ${dayText(fnd)} (${left < 0 ? 'đã quá hạn' : `còn ${left} ngày`})</small>` : '');
    }
    const del = `${fmt(st.deliveredT, 1)} / ${fmt(st.qty, 1)} t <span class="ct-badge ${st.delStatus}">${DEL[st.delStatus]}</span>${bar(st.deliveredT, st.qty)}`
      + (st.plannedT ? `<small>🗓 Kế hoạch ${c.side === 'buy' ? 'nhận' : 'giao'} ${fmt(st.plannedT, 1)} t · ${dmy(st.nextShip)}</small>` : '');
    const eff = (c.side === 'buy' ? 1 : -1) * (st.fu + st.us + st.uu);
    const linked = E.linkedLots(S().data.trades, c.id); const rest = E.round2(eff + linked * E.LOT_TONNES) || 0;
    const pend = E.pendingLots(S().data.trades, c.id);
    const acts = [
      c.pricing === 'diff' && st.unfixedT > 0 ? `<button class="btn btn-sm btn-secondary" data-act="fix" data-id="${esc(c.id)}" title="Chốt giá">🔒 Chốt</button>` : '',
      !st.closed ? `<button class="btn btn-sm btn-outline" data-act="hedge" data-id="${esc(c.id)}" title="Ghi lệnh sàn phòng hộ cho hợp đồng này">🛡️ Hedge</button>` : '',
      st.delStatus !== 'done' ? `<button class="btn btn-sm btn-outline" data-act="deliver" data-id="${esc(c.id)}">🚚 ${c.side === 'buy' ? 'Nhận' : 'Giao'}</button>` : '',
      `<button class="btn btn-sm btn-outline" data-act="edit" data-id="${esc(c.id)}" title="Sửa">✏️</button>`,
      `<button class="btn btn-sm btn-outline" data-act="del" data-id="${esc(c.id)}" title="Xóa">🗑</button>`
    ].join('');
    const td = (label, html, cls) => `<td data-label="${label}"${cls ? ` class="${cls}"` : ''}><div class="cv">${html}</div></td>`;
    return `<tr class="${st.closed ? 'closed' : ''}">`
      + td('Hợp đồng', `<b>${esc(c.no || '—')}</b><small>${dmy(c.date)}</small>`)
      + td('Loại · Đối tác', `<span class="ct-badge ${c.side}">${SIDE[c.side]}</span> <b>${esc(c.party || '—')}</b><small>${esc([c.pricing === 'diff' ? 'Trừ lùi' : 'Giá cố định', c.grade, c.terms].filter(Boolean).join(' · '))}</small>`, 'txt')
      + td('Số lượng', `<b>${fmt(st.qty, 2)} t</b><small>${fmt(st.lots, 2)} lot · ${fmt(st.containers, 1)} cont</small>`)
      + td('Giá · Kỳ hạn', `${price}<small>Kỳ ${esc(c.basis || '—')} (${esc(E.contractLabel(c.basis) || '—')})${c.ship ? ` · giao ${dmy(c.ship)}` : ''}</small>`)
      + td('Chốt giá', fix)
      + td('Giao / nhận', del)
      + td('Vào vị thế', `<b>${st.closed ? 'Hoàn tất' : `${signed(eff, 1)} t`}</b>${linked ? `<small>🔗 hàng ảo ${signed(linked, linked % 1 ? 2 : 0)} lot → còn hở <span class="${Math.abs(rest) < 10 ? 'ok' : 'warn'}">${signed(rest, 1)} t</span></small>` : ''}`
        + (!st.closed && !linked && Math.abs(eff) >= E.LOT_TONNES / 2 ? `<small class="warn">⚠️ Chưa phòng hộ – ${eff < 0 ? 'giá tăng' : 'giá giảm'} là lỗ</small>` : '')
        + (pend ? `<small class="warn">⏳ Lệnh chờ ${signed(pend, pend % 1 ? 2 : 0)} lot – chưa khớp, chưa tính</small>` : ''), eff < 0 ? 'neg' : eff > 0 ? 'pos' : '')
      + `<td class="ct-actions-cell"><div class="ct-actions">${acts}</div></td></tr>`;
  }
  const bar = (a, b) => `<span class="ct-bar"><span style="width:${b > 0 ? Math.min(100, a / b * 100) : 0}%"></span></span>`;

  // ---------- Hộp thoại ----------
  function openModal(title, body, foot) {
    $('ctModalTitle').innerHTML = title; $('ctModalBody').innerHTML = body; $('ctModalFoot').innerHTML = foot;
    $('ctModal').classList.add('active');
  }
  const closeModal = () => { $('ctModal').classList.remove('active'); form = null; tform = null; };
  const find = id => (S().data.contracts || []).find(c => c.id === id);
  function nextNo(side) {
    const y = new Date().getFullYear(); const p = `${side === 'buy' ? 'HĐM' : 'HĐB'}-${y}-`;
    const n = (S().data.contracts || []).map(c => (c.no.startsWith(p) ? parseInt(c.no.slice(p.length), 10) : 0)).reduce((a, b) => Math.max(a, b || 0), 0);
    return p + String(n + 1).padStart(3, '0');
  }

  // Hợp đồng mới / sửa
  let form = null; // bản nháp đang sửa
  function openForm(c, isNew) {
    tform = null; form = JSON.parse(JSON.stringify(c)); form._new = isNew; form._basisTouched = !isNew;
    const cols = E.nextContracts(new Date(), 8); if (form.basis && !cols.includes(form.basis)) cols.unshift(form.basis);
    const seg = (name, opts) => `<div class="seg" data-name="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${form[name] === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const body = `<div class="ct-form">
      <div class="form-row"><div class="form-group"><label>Loại hợp đồng</label>${seg('side', [['sell', 'BÁN (xuất khẩu)'], ['buy', 'MUA (thu mua)']])}</div>
        <div class="form-group"><label>Số hợp đồng</label><input id="fNo" class="form-control" value="${esc(form.no)}"></div></div>
      <div class="form-row"><div class="form-group"><label>Ngày ký</label><input type="date" id="fDate" class="form-control" value="${esc(form.date)}"></div>
        <div class="form-group"><label>Đối tác</label><input id="fParty" class="form-control" value="${esc(form.party)}" placeholder="Khách hàng / nhà cung cấp"></div></div>
      <div class="form-row"><div class="form-group"><label>Hàng / quy cách</label><input id="fGrade" class="form-control" list="ctGrades" value="${esc(form.grade)}" placeholder="R1 S18 WP"><datalist id="ctGrades">${[...new Set(GRADES.concat(((S().data.grades || {}).items || []).map(it => it.grade)))].map(g => `<option value="${esc(g)}">`).join('')}</datalist></div>
        <div class="form-group"><label>Số lượng</label><div class="input-with-addon"><input type="number" id="fQty" class="form-control" step="0.1" min="0" inputmode="decimal" value="${form.qty || ''}" placeholder="38.4"><span class="addon">tấn</span></div></div></div>
      <div class="form-row"><div class="form-group"><label>Kiểu giá</label>${seg('pricing', [['fixed', 'Giá cố định'], ['diff', 'Trừ lùi (PTBF)']])}</div>
        <div class="form-group" id="gPrice"><label>Giá hợp đồng</label><div class="ct-price-in"><input type="number" id="fPrice" class="form-control" step="1" inputmode="decimal" value="${form.price || ''}" placeholder="3800"><select id="fUnit" class="form-control"><option value="usd"${form.unit === 'usd' ? ' selected' : ''}>USD/tấn</option><option value="vnd"${form.unit === 'vnd' ? ' selected' : ''}>VNĐ/kg</option></select></div></div>
        <div class="form-group" id="gDiff"><label>Diff (cộng lùi +, trừ lùi −)</label><div class="input-with-addon"><input type="number" id="fDiff" class="form-control" step="5" inputmode="decimal" value="${form.pricing === 'diff' ? form.diff : ''}" placeholder="+350"><span class="addon">USD/tấn</span></div></div></div>
      <div class="form-row three"><div class="form-group"><label>Tháng giao hàng</label><input type="month" id="fShip" class="form-control" value="${esc(form.ship)}"></div>
        <div class="form-group"><label>Kỳ hạn sàn tham chiếu</label><select id="fBasis" class="form-control">${cols.map(c => `<option value="${c}"${c === form.basis ? ' selected' : ''}>RM${c} – ${E.contractLabel(c)}</option>`).join('')}</select></div>
        <div class="form-group"><label>Điều kiện giao</label><select id="fTerms" class="form-control">${TERMS.map(t => `<option${t === form.terms ? ' selected' : ''}>${t}</option>`).join('')}</select></div></div>
      <div class="form-group"><label>Ghi chú</label><input id="fNote" class="form-control" value="${esc(form.note)}" placeholder="Thanh toán, chất lượng, đóng gói…"></div>
      ${isNew ? '' : historyHtml()}
      <div class="ct-preview" id="fPreview"></div></div>`;
    openModal(isNew ? '➕ HỢP ĐỒNG MỚI' : `✏️ SỬA HỢP ĐỒNG ${esc(form.no)}`, body,
      `<button class="btn btn-outline" data-act="cancel">Hủy</button><button class="btn btn-primary" data-act="saveForm">💾 Lưu hợp đồng</button>`);
    syncForm();
  }
  function historyHtml() {
    const fx = (form.fixes || []).map((x, i) => `<li>🔒 ${dmy(x.date)} · <b>${fmt(x.tons, 2)} t</b> @ ${fmt(x.fut, 0)} USD/t <button type="button" class="ct-x" data-rm="fixes" data-i="${i}" title="Xóa lần chốt này">×</button></li>`);
    const dl = (form.deliveries || []).map((x, i) => `<li>${x.date > todayStr() ? '🗓' : '🚚'} ${dmy(x.date)} · <b>${fmt(x.tons, 2)} t</b>${x.date > todayStr() ? ' <small>(kế hoạch)</small>' : ''} <button type="button" class="ct-x" data-rm="deliveries" data-i="${i}" title="Xóa lần giao này">×</button></li>`);
    return fx.length || dl.length ? `<div class="form-group"><label>Lịch sử chốt giá / giao hàng</label><ul class="ct-hist">${fx.join('')}${dl.join('')}</ul></div>` : '';
  }
  function readForm() {
    form.no = $('fNo').value.trim(); form.date = $('fDate').value; form.party = $('fParty').value.trim(); form.grade = $('fGrade').value.trim();
    form.qty = E.pick($('fQty').value, 0); form.price = E.pick($('fPrice').value, 0); form.unit = $('fUnit').value; form.diff = E.pick($('fDiff').value, 0);
    form.ship = $('fShip').value; form.terms = $('fTerms').value; form.note = $('fNote').value.trim();
    if (!form._basisTouched && form.ship) { const b = E.basisForShipment(form.ship); if (b) { if (![...$('fBasis').options].some(o => o.value === b)) $('fBasis').insertAdjacentHTML('beforeend', `<option value="${b}">RM${b} – ${E.contractLabel(b)}</option>`); $('fBasis').value = b; } }
    form.basis = $('fBasis').value;
  }
  function syncForm() {
    if (!form || !$('fNo')) return;
    readForm();
    $('gPrice').style.display = form.pricing === 'fixed' ? '' : 'none'; $('gDiff').style.display = form.pricing === 'diff' ? '' : 'none';
    $('fPreview').innerHTML = previewHtml(form);
  }
  // Quy đổi, giá trị, tác động lên vị thế và gợi ý phòng hộ cho hợp đồng đang nhập
  function previewHtml(f) {
    const qty = E.num(f.qty);
    if (!qty) return '<span class="muted">Nhập số lượng để xem quy đổi lot/container, giá trị, tác động lên vị thế và gợi ý phòng hộ.</span>';
    const lots = qty / E.LOT_TONNES, lotsR = Math.max(1, Math.round(lots));
    const lon = london(f.basis), fx = fxRate(), dom = domesticAvg();
    const out = [`📦 <b>${fmt(qty, 2)} t</b> = <b>${fmt(lots, 2)} lot</b> London (10 t/lot) · ${fmt(qty / E.CONTAINER_TONNES, 2)} cont 20' (19,2 t/cont)`];
    let usd = null;
    if (f.pricing === 'fixed' && f.unit === 'usd' && f.price > 0) usd = f.price;
    if (f.pricing === 'diff' && lon) usd = lon + E.num(f.diff);
    if (f.pricing === 'fixed' && f.unit === 'vnd' && f.price > 0) {
      out.push(`💰 Giá trị: <b>${fmt(qty * f.price / 1e6, 3)} tỷ VNĐ</b>${fx ? ` (≈ ${fmt(f.price * 1000 / fx, 0)} USD/t)` : ''}`);
      if (dom) out.push(`🇻🇳 So với nhân xô TB Tây Nguyên ${fmt(dom, 0)} đ/kg: <b>${signed(f.price - dom, 0)} đ/kg</b>`);
      if (lon && fx) out.push(`📈 Diff ngầm so với RM${f.basis} (${fmt(lon, 0)}): <b>${signed(f.price * 1000 / fx - lon, 0)} USD/t</b>`);
    }
    if (usd !== null) {
      out.push(`💰 ${f.pricing === 'diff' ? `Tạm tính theo RM${f.basis} hiện tại ${fmt(lon, 0)} ${signed(f.diff, 0)}` : 'Giá trị'}: <b>${fmt(usd, 0)} USD/t × ${fmt(qty, 2)} t = ${fmt(usd * qty, 0)} USD</b>${fx ? ` ≈ ${fmt(usd * qty * fx / 1e9, 2)} tỷ VNĐ` : ''}`);
      if (f.pricing === 'fixed' && lon) out.push(`📈 Diff ngầm so với RM${f.basis} hiện tại (${fmt(lon, 0)}): <b>${signed(usd - lon, 0)} USD/t</b>`);
      if (fx) { const vk = usd * fx / 1000; out.push(`🇻🇳 Quy đổi <b>${fmt(vk, 0)} đ/kg</b>${dom ? ` · nhân xô TB ${fmt(dom, 0)} đ/kg → chênh <b>${signed(vk - dom, 0)} đ/kg</b> (chưa trừ chế biến, bao bì, vận chuyển ra cảng)` : ''}`); }
    }
    // So với bảng diff theo chủng loại (thẻ Bảng giá)
    const gr = S().data.grades; const gi = E.matchGrade(gr, f.grade); const cls = E.iceClassFor(f.grade);
    if (cls && cls !== '—') out.push(`📏 Quy cách "${esc(f.grade)}" ≈ <b>ICE Class ${cls}</b>${cls === '1' ? ' (chuẩn giá sàn)' : ` (${signed(E.ICE_CLASSES.find(x => x.cls === cls).adj, 0)} USD/t nếu giao lên sàn)`}`);
    if (gi && lon) {
      const refP = lon + E.num(gi.diff); const good = (v, sell) => (sell ? v >= 0 : v <= 0) ? '✅' : '⚠️';
      if (f.pricing === 'fixed' && f.unit === 'usd' && f.price > 0) { const gap = f.price - refP; out.push(`📋 Bảng diff (${dmy(gr.date)}): <b>${esc(gi.grade)} ${signed(gi.diff, 0)}</b> → giá tham chiếu hôm nay RM${esc(f.basis)} ${fmt(lon, 0)} ${signed(gi.diff, 0)} = <b>${fmt(refP, 0)} USD/t</b>. Hợp đồng ${fmt(f.price, 0)} → ${good(gap, f.side === 'sell')} ${gap >= 0 ? 'cao hơn' : 'thấp hơn'} <b>${fmt(Math.abs(gap), 0)} USD/t</b> (${signed(gap * qty, 0)} USD cho ${fmt(qty, 1)} t).`); }
      if (f.pricing === 'diff') { const gap = E.num(f.diff) - E.num(gi.diff); out.push(`📋 Bảng diff (${dmy(gr.date)}): <b>${esc(gi.grade)} ${signed(gi.diff, 0)}</b> – diff hợp đồng ${signed(f.diff, 0)} → ${good(gap, f.side === 'sell')} ${gap >= 0 ? 'cao hơn' : 'thấp hơn'} <b>${fmt(Math.abs(gap), 0)} USD/t</b> (${signed(gap * qty, 0)} USD cho ${fmt(qty, 1)} t).`); }
    }
    // Giá vốn nội địa đúng loại hàng = nhân xô + mức cộng của loại → lời/lỗ gộp của hợp đồng
    if (gi && gi.dom && dom && fx && usd !== null) {
      const cost = dom + E.num(gi.dom), sale = Math.round(usd * fx / 1000), m = sale - cost;
      out.push(`🏭 Giá vốn nội địa ${esc(gi.grade)}: nhân xô ${fmt(dom, 0)} + ${fmt(gi.dom, 0)} = <b>${fmt(cost, 0)} đ/kg</b> → ${f.side === 'sell' ? 'bán' : 'mua'} ${fmt(sale, 0)} đ/kg: <b class="${(f.side === 'sell' ? m : -m) >= 0 ? '' : 'warn'}">${f.side === 'sell' ? (m >= 0 ? 'lời' : 'LỖ') : (m <= 0 ? 'rẻ hơn thị trường' : 'đắt hơn thị trường')} ${fmt(Math.abs(m), 0)} đ/kg ≈ ${fmt(Math.abs(m) * qty * 1000 / 1e6, 1)} triệu đồng cả lô</b> (chưa trừ chi phí xuất khẩu)`);
    }
    if (f.pricing === 'diff' && E.parseCode(f.basis)) {
      const fnd = E.firstNoticeDay('RM' + f.basis); const left = E.daysBetween(new Date(), fnd);
      out.push(`⏰ Hạn chốt giá: trước ngày thông báo đầu tiên RM${f.basis} ≈ <b>${dayText(fnd)}</b> (còn ${left} ngày). Chốt theo lot 10 t: ${fmt(qty, 1)} t = ${fmt(lots, 2)} lot – ghi rõ trong HĐ cách xử lý phần lẻ.`);
    }
    // Tác động lên vị thế của kỳ hạn tham chiếu
    const data = S().data; const cols = data.columns;
    const trial = { ...data, contracts: (data.contracts || []).filter(x => x.id !== f.id).concat([E.normalizeContract(f)]) };
    const before = E.computePositions({ ...data, contracts: (data.contracts || []).filter(x => x.id !== f.id) }), after = E.computePositions(trial);
    let i = cols.indexOf(f.basis); if (i < 0) i = after.net.reduce((best, v, k) => (Math.abs(v - before.net[k]) > Math.abs(after.net[best] - before.net[best]) ? k : best), 0);
    out.push(`⚖️ Vị thế kỳ ${E.contractLabel(cols[i])} (${cols[i]}): ${signed(before.net[i], 1)} → <b>${signed(after.net[i], 1)} t</b> · tổng ròng ${signed(before.totals.net, 1)} → <b>${signed(after.totals.net, 1)} t</b> (hạn mức ±${fmt(data.riskLimit, 0)} t/kỳ)`);
    if (Math.abs(after.net[i]) > data.riskLimit) out.push(`<span class="warn">⚠️ Vượt hạn mức → cân nhắc ${after.net[i] < 0 ? 'MUA' : 'BÁN'} ${Math.round(Math.abs(after.net[i]) / E.LOT_TONNES)} lot RM${cols[i]}</span>`);
    const L = `<b>${lotsR} lot RM${esc(f.basis)}</b> (${lotsR * 10} t${Math.abs(lotsR * 10 - qty) > 0.01 ? `, lệch ${signed(lotsR * 10 - qty, 1)} t so với hợp đồng` : ''})`;
    const hint = {
      'sell-fixed': `Bán giá cố định khi <b>chưa có hàng</b> = công ty SHORT ${fmt(qty, 1)} t: London tăng 100 USD/t → lỗ ${fmt(qty * 100, 0)} USD. Giữ lời: <b>MUA</b> ${L} ngay khi ký, bán lại khi đã mua đủ hàng. Nếu đã có hàng trong kho thì hợp đồng này khóa lời luôn – gỡ phần hedge bán tương ứng (nếu có).`,
      'sell-diff': `Bán trừ lùi: đã khóa diff <b>${signed(f.diff, 0)} USD/t</b>; giá cuối = giá RM${esc(f.basis)} lúc chốt + diff. Phần chưa chốt nằm ở dòng "HĐ bán trừ lùi chưa chốt giá" và được tính vào vị thế ròng – phòng hộ theo vị thế ròng của kỳ (dòng ⚖️ ở trên).`,
      'buy-fixed': `Mua giá cố định khi <b>chưa có đầu ra</b> = công ty LONG ${fmt(qty, 1)} t: London giảm 100 USD/t → lỗ ${fmt(qty * 100, 0)} USD. Giữ lời: <b>BÁN</b> ${L} ngay khi mua, mua lại khi đã bán được hàng.`,
      'buy-diff': `Mua trừ lùi: giá mua = giá RM${esc(f.basis)} lúc chốt ${signed(f.diff, 0)} USD/t. Phần chưa chốt nằm ở dòng "HĐ mua trừ lùi chưa chốt giá" và được tính vào vị thế ròng – phòng hộ theo vị thế ròng của kỳ (dòng ⚖️ ở trên).`
    }[`${f.side}-${f.pricing}`];
    out.push(`🛡️ ${hint}`);
    return out.map(x => `<div>${x}</div>`).join('');
  }
  function saveForm() {
    readForm();
    if (!(form.qty > 0)) return A.toast('Nhập số lượng (tấn)', 'error');
    if (form.pricing === 'fixed' && !(form.price > 0)) return A.toast('Nhập giá hợp đồng', 'error');
    if (!E.parseCode(form.basis)) return A.toast('Chọn kỳ hạn sàn tham chiếu', 'error');
    const isNew = form._new; delete form._new; delete form._basisTouched;
    const c = E.normalizeContract(form);
    const list = S().data.contracts || (S().data.contracts = []);
    if (isNew) list.push(c); else { const i = list.findIndex(x => x.id === c.id); if (i >= 0) list[i] = c; else list.push(c); }
    closeModal(); form = null;
    A.ledgerChanged(isNew ? `📒 Đã ghi hợp đồng ${c.no}` : `📒 Đã cập nhật ${c.no}`);
  }

  // Chốt giá (trừ lùi) / giao – nhận hàng
  function openFix(c) {
    const st = E.contractState(c); const lon = london(c.basis);
    const body = `<p class="ct-info">${SIDE[c.side]} <b>${esc(c.no)}</b> – ${esc(c.party || '')} · ${fmt(st.qty, 2)} t trừ lùi RM${esc(c.basis)} <b>${signed(c.diff, 0)}</b> · còn chưa chốt <b>${fmt(st.unfixedT, 2)} t</b> (${fmt(st.unfixedT / 10, 2)} lot)</p>
      <div class="form-row three"><div class="form-group"><label>Ngày chốt</label><input type="date" id="xDate" class="form-control" value="${todayStr()}"></div>
        <div class="form-group"><label>Số tấn chốt</label><input type="number" id="xTons" class="form-control" step="0.1" inputmode="decimal" value="${st.unfixedT}"></div>
        <div class="form-group"><label>Giá London lúc chốt</label><input type="number" id="xFut" class="form-control" step="1" inputmode="decimal" value="${lon || ''}" placeholder="USD/tấn"></div></div>
      <div class="ct-preview" id="xPreview"></div>`;
    openModal('🔒 CHỐT GIÁ HỢP ĐỒNG TRỪ LÙI', body, `<button class="btn btn-outline" data-act="cancel">Hủy</button><button class="btn btn-primary" data-act="saveFix" data-id="${esc(c.id)}">🔒 Ghi lần chốt</button>`);
    const upd = () => {
      const t = E.pick($('xTons').value, 0), fut = E.pick($('xFut').value, 0), fin = fut + E.num(c.diff);
      $('xPreview').innerHTML = `<div>Giá cuối = ${fmt(fut, 0)} ${signed(c.diff, 0)} = <b>${fmt(fin, 0)} USD/t</b> × ${fmt(t, 2)} t = <b>${fmt(fin * t, 0)} USD</b>${fxRate() ? ` ≈ ${fmt(fin * fxRate() / 1000, 0)} đ/kg` : ''}</div>`
        + `<div>Sau lần này còn chưa chốt: <b>${fmt(Math.max(0, st.unfixedT - t), 2)} t</b>. Chốt theo lot 10 t; phần lẻ (${fmt(st.qty % 10, 1)} t) xử lý theo thỏa thuận trong hợp đồng.</div>`
        + `<div>⚖️ Sau khi chốt, số tấn chuyển từ dòng "trừ lùi chưa chốt" sang "đã chốt giá" cùng kỳ – vị thế ròng của kỳ không đổi. Lệnh sàn đang giữ cho hợp đồng này vẫn giữ nguyên, trừ khi anh chủ động đóng.</div>`;
    };
    ['xTons', 'xFut'].forEach(id => $(id).addEventListener('input', upd)); upd();
  }
  function saveFix(id) {
    const c = find(id); if (!c) return closeModal();
    const st = E.contractState(c); const t = E.pick($('xTons').value, 0), fut = E.pick($('xFut').value, 0);
    if (!(t > 0) || t > st.unfixedT + 1e-6) return A.toast(`Số tấn chốt phải trong khoảng 0 – ${fmt(st.unfixedT, 2)} t`, 'error');
    if (!(fut > 0)) return A.toast('Nhập giá London lúc chốt', 'error');
    c.fixes.push({ date: $('xDate').value || todayStr(), tons: E.round2(t), fut });
    closeModal(); A.ledgerChanged(`🔒 Đã chốt ${fmt(t, 2)} t – ${c.no}`);
  }
  // Ngày giao sau hôm nay = kế hoạch (lịch tàu): chưa tính là đã giao; tới ngày mới tính, hoặc bấm "✔ Đã giao" để xác nhận sớm
  function openDeliver(c) {
    const st = E.contractState(c); const verb = c.side === 'buy' ? 'nhận' : 'giao'; const today = todayStr();
    const left = E.round2(st.qty - st.deliveredT - st.plannedT);
    const plan = (c.deliveries || []).map((d, i) => ({ d, i })).filter(({ d }) => d.date && d.date > today);
    const planHtml = plan.length ? `<div class="ct-preview ct-plan"><div><b>🗓 Kế hoạch ${verb}</b> – chưa tính là đã ${verb}:</div>${plan.map(({ d, i }) => `<div>${dmy(d.date)} · <b>${fmt(d.tons, 2)} t</b>
        <button type="button" class="btn btn-sm btn-secondary" data-act="planDone" data-id="${esc(c.id)}" data-i="${i}">✔ Đã ${verb} hôm nay</button>
        <button type="button" class="btn btn-sm btn-outline" data-act="planDrop" data-id="${esc(c.id)}" data-i="${i}">Bỏ lịch</button></div>`).join('')}</div>` : '';
    const body = `<p class="ct-info">${SIDE[c.side]} <b>${esc(c.no)}</b> – ${esc(c.party || '')} · đã ${verb} ${fmt(st.deliveredT, 2)} / ${fmt(st.qty, 2)} t${st.plannedT ? ` · kế hoạch ${fmt(st.plannedT, 2)} t` : ''} · còn <b>${fmt(left, 2)} t</b> chưa xếp lịch</p>
      ${planHtml}
      ${left > 0 ? `<div class="form-row"><div class="form-group"><label>Ngày ${verb} hàng</label><input type="date" id="yDate" class="form-control" value="${today}"></div>
        <div class="form-group"><label>Số tấn ${verb} lần này</label><input type="number" id="yTons" class="form-control" step="0.1" inputmode="decimal" value="${Math.min(left, E.CONTAINER_TONNES) || left}"></div></div>` : ''}
      <div class="ct-preview"><div>🗓 Ghi <b>ngày sau hôm nay</b> = kế hoạch (lịch tàu): vị thế vẫn tính là <b>chưa ${verb}</b>; tới ngày đó mới tính là đã ${verb}. Tàu đổi lịch thì sửa lại ở đây.</div>
        <div>1 container 20' = 19,2 t. ${c.side === 'buy' ? 'Hàng mua đã nhận và đã chốt giá → thành tồn kho: nhớ cộng vào dòng <b>Tồn kho</b> ở thẻ Vị thế.' : 'Hàng bán đã xuất và đã chốt giá → hoàn tất: nhớ trừ khỏi dòng <b>Tồn kho</b> ở thẻ Vị thế.'}</div></div>`;
    openModal(`🚚 ${verb.toUpperCase()} HÀNG`, body, `<button class="btn btn-outline" data-act="cancel">${left > 0 ? 'Hủy' : 'Đóng'}</button>${left > 0 ? `<button class="btn btn-primary" data-act="saveDeliver" data-id="${esc(c.id)}">🚚 Ghi lần ${verb}</button>` : ''}`);
  }
  function saveDeliver(id) {
    const c = find(id); if (!c) return closeModal();
    const st = E.contractState(c); const left = st.qty - st.deliveredT - st.plannedT; const t = E.pick($('yTons').value, 0);
    if (!(t > 0) || t > left + 1e-6) return A.toast(`Số tấn phải trong khoảng 0 – ${fmt(left, 2)} t${st.plannedT ? ` (đã có kế hoạch ${fmt(st.plannedT, 2)} t)` : ''}`, 'error');
    const date = $('yDate').value || todayStr(); const verb = c.side === 'buy' ? 'nhận' : 'giao';
    c.deliveries.push({ date, tons: E.round2(t) });
    closeModal(); A.ledgerChanged(date > todayStr() ? `🗓 Đã ghi kế hoạch ${verb} ${fmt(t, 2)} t ngày ${dmy(date)} – ${c.no}` : `🚚 Đã ghi ${fmt(t, 2)} t – ${c.no}`);
  }
  function planAct(id, i, done) {
    const c = find(id); const d = c && c.deliveries[Number(i)]; if (!d) return;
    if (done) d.date = todayStr(); else c.deliveries.splice(Number(i), 1);
    closeModal(); A.ledgerChanged(done ? `🚚 Đã xác nhận ${fmt(d.tons, 2)} t – ${c.no}` : `🗓 Đã bỏ lịch ${fmt(d.tons, 2)} t – ${c.no}`);
  }

  // Lệnh sàn mới / sửa (hàng ảo)
  let tform = null;
  const findTrade = id => (S().data.trades || []).find(t => t.id === id);
  function openTradeForm(t, isNew, title) {
    form = null; tform = JSON.parse(JSON.stringify(t)); tform._new = isNew; tform._priceTouched = !isNew;
    const months = E.nextContracts(new Date(), 8); if (tform.month && !months.includes(tform.month)) months.unshift(tform.month);
    const openC = (S().data.contracts || []).filter(c => !E.contractState(c).closed || c.id === tform.link);
    const seg = (name, opts) => `<div class="seg" data-name="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${tform[name] === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const body = `<div class="tr-form">
      <div class="form-group"><label>Trạng thái lệnh</label>${seg('status', [['filled', '✅ Đã khớp trên sàn – tính vào vị thế'], ['pending', '⏳ Lệnh chờ / dự kiến – chưa tính']])}</div>
      <div class="form-row"><div class="form-group"><label>Lệnh</label>${seg('side', [['buy', 'MUA (Long)'], ['sell', 'BÁN (Short)']])}</div>
        <div class="form-group"><label>Tài khoản / môi giới (tùy chọn)</label><input id="tAcc" class="form-control" list="trAccs" value="${esc(tform.account)}" placeholder="Bỏ trống hoặc ghi tên tài khoản"><datalist id="trAccs">${[...new Set((S().data.trades || []).map(x => x.account).filter(Boolean))].map(a => `<option value="${esc(a)}">`).join('')}</datalist></div></div>
      <div class="form-row three"><div class="form-group"><label>Ngày khớp / đặt lệnh</label><input type="date" id="tDate" class="form-control" value="${esc(tform.date)}"></div>
        <div class="form-group"><label>Số lot</label><div class="input-with-addon"><input type="number" id="tLots" class="form-control" step="1" min="0" inputmode="decimal" value="${tform.lots || ''}" placeholder="4"><span class="addon">lot</span></div></div>
        <div class="form-group"><label>Kỳ hạn</label><select id="tMonth" class="form-control">${months.map(m => `<option value="${m}"${m === tform.month ? ' selected' : ''}>RM${m} – ${E.contractLabel(m)}</option>`).join('')}</select></div></div>
      <div class="form-row"><div class="form-group"><label>Giá khớp / giá đặt</label><div class="input-with-addon"><input type="number" id="tPrice" class="form-control" step="1" inputmode="decimal" value="${tform.price || ''}"><span class="addon">USD/tấn</span></div></div>
        <div class="form-group"><label>Liên kết hợp đồng hàng thật</label><select id="tLink" class="form-control"><option value="">— Không liên kết —</option>${openC.map(c => `<option value="${esc(c.id)}"${c.id === tform.link ? ' selected' : ''}>${esc(c.no)} · ${SIDE[c.side]} ${fmt(c.qty, 1)} t · RM${esc(c.basis)}${c.party ? ' · ' + esc(c.party) : ''}</option>`).join('')}</select></div></div>
      <div class="form-group"><label>Ghi chú</label><input id="tNote" class="form-control" value="${esc(tform.note)}" placeholder="Số lệnh, môi giới, lý do…"></div>
      <div class="ct-preview" id="tPreview"></div></div>`;
    openModal(title || (isNew ? '➕ LỆNH SÀN MỚI (HÀNG ẢO)' : '✏️ SỬA LỆNH SÀN'), body, `<button class="btn btn-outline" data-act="cancel">Hủy</button><button class="btn btn-primary" data-act="saveTrade">💾 Lưu lệnh</button>`);
    syncTrade();
  }
  function readTrade() {
    tform.date = $('tDate').value; tform.lots = E.pick($('tLots').value, 0); tform.account = $('tAcc').value.trim();
    const m = $('tMonth').value;
    if (m !== tform.month && !tform._priceTouched) { const l = london(m); if (l) $('tPrice').value = l; }
    tform.month = m; tform.price = E.pick($('tPrice').value, 0); tform.link = $('tLink').value; tform.note = $('tNote').value.trim();
  }
  function syncTrade() { if (!tform || !$('tLots')) return; readTrade(); $('tPreview').innerHTML = tradePreview(tform); }
  function tradePreview(t) {
    const lots = E.num(t.lots);
    if (!lots) return '<span class="muted">Nhập số lot để xem tác động lên vị thế và hợp đồng liên kết.</span>';
    const data = S().data; const cols = data.columns; const nt = E.normalizeTrade(t); const pend = !E.isFilled(nt);
    const fill = { ...nt, status: 'filled' }; // lệnh chờ: xem trước tác động KHI khớp
    const others = (data.trades || []).filter(x => x.id !== t.id);
    const before = E.computePositions({ ...data, trades: others }), after = E.computePositions({ ...data, trades: others.concat([fill]) });
    let i = cols.indexOf(t.month); if (i < 0) i = 0;
    const out = [];
    if (pend) out.push(`<span class="warn">⏳ <b>LỆNH CHỜ – chưa khớp</b>: chỉ ghi để theo dõi, <b>không</b> tính vào vị thế, sổ lệnh, lãi/lỗ. Khi lệnh khớp trên sàn, bấm <b>✔ Khớp</b> ở bảng lệnh và sửa giá khớp thực tế.</span>`);
    out.push(`📉 ${t.side === 'buy' ? 'MUA' : 'BÁN'} <b>${fmt(lots, lots % 1 ? 2 : 0)} lot RM${esc(t.month)}</b> = ${fmt(lots * E.LOT_TONNES, 1)} t${t.price ? ` @ ${fmt(t.price, 0)} USD/t · giá trị danh nghĩa ${fmt(lots * E.LOT_TONNES * t.price, 0)} USD` : ''}`);
    const last = london(t.month);
    if (last && t.price) out.push(pend ? `💹 Giá hiện tại ${fmt(last, 0)} – giá đặt ${fmt(t.price, 0)} (${signed(t.price - last, 0)} USD/t so với giá hiện tại)`
      : `💹 Giá hiện tại ${fmt(last, 0)} → lãi/lỗ tạm tính <b>${signed((last - t.price) * E.tradeLots(nt) * E.LOT_TONNES, 0)} USD</b> (mỗi 1 USD/t giá đổi = ${fmt(lots * E.LOT_TONNES, 0)} USD)`);
    out.push(`⚖️ ${pend ? 'Khi khớp – v' : 'V'}ị thế sàn kỳ ${E.contractLabel(cols[i])} (${cols[i]}): ${signed(before.futures[i], 1)} → <b>${signed(after.futures[i], 1)} t</b> · vị thế ròng kỳ: ${signed(before.net[i], 1)} → <b>${signed(after.net[i], 1)} t</b> · tổng ròng ${signed(after.totals.net, 1)} t`);
    const c = t.link ? (data.contracts || []).find(x => x.id === t.link) : null;
    if (c) {
      const exp = E.contractExposure(c); const linked = E.round2(E.linkedLots(others, c.id) + E.tradeLots(fill)); const rest = E.round2(exp + linked * E.LOT_TONNES) || 0;
      out.push(`🔗 Liên kết <b>${esc(c.no)}</b>${pend ? ' (khi khớp)' : ''}: hàng thật ${signed(exp, 1)} t + hàng ảo ${signed(linked * E.LOT_TONNES, 1)} t = còn hở <b>${signed(rest, 1)} t</b>${Math.abs(rest) < E.LOT_TONNES ? ' ✅ đã phòng hộ (lệch dưới 1 lot)' : ''}`);
      if (c.basis !== t.month) out.push(`<span class="warn">⚠️ Kỳ hạn lệnh (RM${esc(t.month)}) khác kỳ tham chiếu của hợp đồng (RM${esc(c.basis)}) – có rủi ro chênh lệch giữa hai kỳ (spread).</span>`);
    }
    out.push('ℹ️ Ký quỹ: mỗi lot cần tiền ký quỹ ban đầu theo môi giới; giá đi ngược chiều thì phải nộp thêm – nên giữ quỹ dự phòng.');
    return out.map(x => `<div>${x}</div>`).join('');
  }
  function saveTrade() {
    readTrade();
    if (!(tform.lots > 0)) return A.toast('Nhập số lot', 'error');
    if (!E.parseCode(tform.month)) return A.toast('Chọn kỳ hạn', 'error');
    if (!(tform.price > 0)) return A.toast('Nhập giá khớp', 'error');
    const isNew = tform._new; delete tform._new; delete tform._priceTouched;
    const t = E.normalizeTrade(tform);
    const list = S().data.trades || (S().data.trades = []);
    if (isNew) list.push(t); else { const i = list.findIndex(x => x.id === t.id); if (i >= 0) list[i] = t; else list.push(t); }
    closeModal(); tform = null;
    A.ledgerChanged(`${t.status === 'pending' ? '⏳ Đã ghi lệnh chờ (chưa tính vào vị thế)' : '📉 Đã ghi lệnh'} ${t.side === 'buy' ? 'MUA' : 'BÁN'} ${fmt(t.lots, 0)} lot RM${t.month}`);
  }
  function newTrade(p) {
    const x = p || {}; const month = x.month || S().data.columns[0];
    openTradeForm(E.normalizeTrade({ id: `t${Date.now().toString(36)}`, date: todayStr(), account: x.account || '', side: x.side || 'buy', lots: x.lots || 0,
      month, price: x.price || london(month) || 0, status: x.status || 'filled', link: x.link || '', note: x.note || '' }), true, x.title);
  }
  // Phòng hộ cho một hợp đồng: lệnh ngược chiều phần còn hở, cùng kỳ tham chiếu, tự liên kết.
  // Mặc định ghi là LỆNH CHỜ (chưa tính vào vị thế) – khi đặt lệnh và khớp trên sàn mới chọn "Đã khớp".
  function hedgeFor(c) {
    const rest = E.round2(E.contractExposure(c) + E.linkedLots(S().data.trades, c.id) * E.LOT_TONNES) || 0;
    if (Math.abs(rest) < E.LOT_TONNES / 2) return A.toast(`${c.no} đã được phòng hộ đủ (còn hở ${signed(rest, 1)} t)`);
    const pend = E.pendingLots(S().data.trades, c.id);
    if (pend) A.toast(`${c.no} đã có lệnh chờ ${signed(pend, 0)} lot chưa khớp – kiểm tra bảng lệnh để tránh ghi trùng`);
    newTrade({ side: rest < 0 ? 'buy' : 'sell', lots: Math.max(1, Math.round(Math.abs(rest) / E.LOT_TONNES)), month: c.basis, link: c.id, note: `Phòng hộ ${c.no}`,
      status: 'pending', title: `🛡️ PHÒNG HỘ ${esc(c.no)} – còn hở ${signed(rest, 1)} t` });
  }

  // Bấm một ô dòng sổ trong ma trận (📉 lệnh sàn / 📒 hợp đồng) → xem và sửa ngay các bút toán tạo ra số đó
  function openCell(kind, code, key) {
    const data = S().data; const cols = data.columns; const lbl = `${E.contractLabel(code)} (${code})`;
    const v = E.num((E.effectiveMatrix(data)[key] || {})[code]);
    if (kind === 'tr') {
      const { moved } = E.tradeRows(data.trades, cols); const extra = new Set(moved.filter(m => m.to === code).map(m => m.id));
      const list = (data.trades || []).filter(t => t.month === code || extra.has(t.id)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const rows = list.map(t => {
        const pend = !E.isFilled(t);
        return `<tr class="${pend ? 'pending' : ''}"><td>${dmy(t.date)}</td><td>${pend ? '<span class="ct-badge pending">⏳ LỆNH CHỜ</span> ' : ''}<span class="ct-badge ${t.side}">${t.side === 'buy' ? 'MUA' : 'BÁN'}</span> <b>${fmt(t.lots, t.lots % 1 ? 2 : 0)} lot</b> RM${esc(t.month)}${t.price ? ' @' + fmt(t.price, 0) : ''}<small>${esc(t.note || t.account || '')}</small></td>`
          + `<td><div class="ct-actions">${pend ? `<button class="btn btn-sm btn-secondary" data-act="cellFill" data-id="${esc(t.id)}">✔ Đã khớp</button>` : `<button class="btn btn-sm btn-secondary" data-act="cellPend" data-id="${esc(t.id)}" title="Lệnh chưa khớp thật trên sàn – bỏ khỏi vị thế, giữ lại làm lệnh chờ">⏳ Chưa khớp</button>`}`
          + `<button class="btn btn-sm btn-outline" data-act="cellEdit" data-id="${esc(t.id)}" title="Sửa">✏️</button><button class="btn btn-sm btn-outline" data-act="cellDel" data-id="${esc(t.id)}" title="Xóa">🗑</button></div></td></tr>`;
      }).join('');
      return openModal(`📉 FUTURES ROBUSTA LONDON – ${esc(lbl)}`,
        `<p class="ct-info">Ô này đang tính <b>${signed(v, 1)} t</b> (${signed(v / E.LOT_TONNES, v % E.LOT_TONNES ? 2 : 0)} lot), cộng tự động từ các lệnh sàn dưới đây. Lệnh <b>chưa khớp thật</b> trên sàn → bấm <b>⏳ Chưa khớp</b> (giữ lại làm lệnh chờ) hoặc 🗑 xóa, ô sẽ tự về đúng số.</p>`
        + (list.length ? `<table class="ct-table cell-list"><tbody>${rows}</tbody></table>` : '<p class="muted">Chưa có lệnh nào ở kỳ này.</p>'),
        `<button class="btn btn-outline" data-act="cancel">Đóng</button><button class="btn btn-primary" data-act="cellNew" data-code="${esc(code)}">➕ Ghi lệnh RM${esc(code)}</button>`);
    }
    const { moved } = E.contractRows(data.contracts, cols); const extra = new Set(moved.filter(m => m.to === code).map(m => m.id));
    const row = E.ROWS.find(r => r.key === key) || {};
    const part = (c, st) => { const p = c.side === 'buy' ? 'buy' : 'sell', sign = c.side === 'buy' ? 1 : -1;
      return key === `${p}_fixed_unshipped` ? sign * st.fu : key === `${p}_unfixed_shipped` ? sign * st.us : key === `diff_${p}_unfixed` ? sign * st.uu : 0; };
    const items = (data.contracts || []).filter(c => c.basis === code || extra.has(c.id)).map(c => ({ c, st: E.contractState(c) }))
      .filter(x => !x.st.closed).map(x => ({ ...x, part: E.round2(part(x.c, x.st)) || 0 })).filter(x => x.part);
    const rows = items.map(({ c, st, part: p }) => `<tr><td><b>${esc(c.no)}</b><small>${dmy(c.date)}</small></td><td><span class="ct-badge ${c.side}">${SIDE[c.side]}</span> ${esc(c.party || '')}<small>${fmt(st.qty, 1)} t${c.grade ? ' · ' + esc(c.grade) : ''}${st.plannedT ? ` · kế hoạch giao ${dmy(st.nextShip)}` : ''}</small></td><td><b>${signed(p, 1)} t</b></td>`
      + `<td><div class="ct-actions"><button class="btn btn-sm btn-outline" data-act="cellCt" data-id="${esc(c.id)}">✏️ Sửa</button>${st.delStatus !== 'done' ? `<button class="btn btn-sm btn-outline" data-act="cellDeliver" data-id="${esc(c.id)}">🚚 ${c.side === 'buy' ? 'Nhận' : 'Giao'}</button>` : ''}<button class="btn btn-sm btn-outline" data-act="cellDelCt" data-id="${esc(c.id)}" title="Xóa hợp đồng nhập sai hoặc dữ liệu mẫu">🗑 Xóa</button></div></td></tr>`).join('');
    openModal(`📒 ${esc(row.label || '')} – ${esc(lbl)}`,
      `<p class="ct-info">Ô này đang tính <b>${signed(v, 1)} t</b>, cộng tự động từ sổ hợp đồng. Sửa hợp đồng (số lượng, chốt giá, lịch giao) thì ô tự cập nhật.</p>`
      + (items.length ? `<table class="ct-table cell-list"><tbody>${rows}</tbody></table>` : '<p class="muted">Không có hợp đồng nào đổ vào ô này.</p>'),
      `<button class="btn btn-outline" data-act="cancel">Đóng</button><button class="btn btn-primary" data-act="cellNewCt">➕ Hợp đồng mới</button>`);
  }
  function cellAct(act, id, code) {
    const t = findTrade(id), c = find(id);
    if (act === 'cellPend' && t) { t.status = 'pending'; closeModal(); return A.ledgerChanged(`⏳ Lệnh ${t.side === 'buy' ? 'MUA' : 'BÁN'} ${fmt(t.lots, 0)} lot RM${t.month} → lệnh chờ, không tính vào vị thế`); }
    if (act === 'cellFill' && t) return openTradeForm({ ...t, status: 'filled', date: todayStr() }, false, '✔ XÁC NHẬN LỆNH ĐÃ KHỚP – sửa ngày và giá khớp thực tế');
    if (act === 'cellEdit' && t) return openTradeForm(t, false);
    if (act === 'cellDel' && t && confirm(`Xóa lệnh ${t.side === 'buy' ? 'MUA' : 'BÁN'} ${fmt(t.lots, 0)} lot RM${t.month} (${dmy(t.date)})?`)) {
      S().data.trades = S().data.trades.filter(x => x.id !== t.id); closeModal(); return A.ledgerChanged('🗑 Đã xóa lệnh sàn');
    }
    if (act === 'cellNew') return newTrade({ month: code });
    if (act === 'cellCt' && c) return openForm(c, false);
    if (act === 'cellDeliver' && c) return openDeliver(c);
    if (act === 'cellDelCt' && c && confirm(`Xóa hợp đồng ${c.no || ''} (${SIDE[c.side]} ${fmt(c.qty, 2)} t – ${c.party || ''})?\nVị thế sẽ tính lại; lệnh sàn liên kết được giữ lại nhưng bỏ liên kết. Bản cũ vẫn còn trong sao lưu.`)) {
      S().data.contracts = S().data.contracts.filter(x => x.id !== c.id);
      (S().data.trades || []).forEach(t => { if (t.link === c.id) t.link = ''; });
      closeModal(); return A.ledgerChanged(`🗑 Đã xóa hợp đồng ${c.no}`);
    }
    if (act === 'cellNewCt') return newContract();
  }

  // ---------- Sự kiện ----------
  function newContract(prefill) {
    const p = prefill || {}; const side = p.side === 'buy' ? 'buy' : 'sell';
    const ship = p.ship || ''; const basis = p.basis || E.basisForShipment(ship) || S().data.columns[1] || S().data.columns[0];
    openForm(E.normalizeContract({ id: `c${Date.now().toString(36)}`, no: nextNo(side), date: todayStr(), side, pricing: p.pricing || 'fixed', unit: p.unit || 'usd',
      qty: p.qty || 0, price: p.price || 0, diff: p.diff || 0, grade: p.grade || '', terms: p.terms || 'FOB', party: p.party || '', ship, basis, note: p.note || '' }), true);
    if (p.basis) form._basisTouched = true;
  }
  function bind() {
    if (!$('ctTable')) return;
    $('btnNewContract').addEventListener('click', () => newContract());
    $('ctFilter').addEventListener('change', render); $('ctSearch').addEventListener('input', render);
    $('ctTable').addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const c = find(b.dataset.id); if (!c) return;
      if (b.dataset.act === 'fix') openFix(c);
      if (b.dataset.act === 'deliver') openDeliver(c);
      if (b.dataset.act === 'hedge') hedgeFor(c);
      if (b.dataset.act === 'edit') openForm(c, false);
      if (b.dataset.act === 'del' && confirm(`Xóa hợp đồng ${c.no || ''} (${SIDE[c.side]} ${fmt(c.qty, 2)} t – ${c.party || ''})?\nVị thế sẽ tính lại; lệnh sàn liên kết được giữ lại (bỏ liên kết); bản cũ vẫn còn trong sao lưu.`)) {
        S().data.contracts = S().data.contracts.filter(x => x.id !== c.id);
        (S().data.trades || []).forEach(t => { if (t.link === c.id) t.link = ''; });
        A.ledgerChanged(`🗑 Đã xóa hợp đồng ${c.no}`);
      }
    });
    $('btnNewTrade').addEventListener('click', () => newTrade());
    $('trTable').addEventListener('click', e => {
      const b = e.target.closest('[data-tact]'); if (!b) return; const t = findTrade(b.dataset.id); if (!t) return;
      if (b.dataset.tact === 'edit') openTradeForm(t, false);
      if (b.dataset.tact === 'fill') openTradeForm({ ...t, status: 'filled', date: todayStr() }, false, '✔ XÁC NHẬN LỆNH ĐÃ KHỚP – sửa ngày và giá khớp thực tế');
      if (b.dataset.tact === 'del' && confirm(`Xóa lệnh ${t.side === 'buy' ? 'MUA' : 'BÁN'} ${fmt(t.lots, 0)} lot RM${t.month} (${dmy(t.date)})?`)) {
        S().data.trades = S().data.trades.filter(x => x.id !== t.id); A.ledgerChanged('🗑 Đã xóa lệnh sàn');
      }
    });
    const m = $('ctModal');
    m.addEventListener('click', e => {
      if (e.target === m) return closeModal();
      const segBtn = e.target.closest('.seg button');
      if (segBtn && (form || tform)) {
        const obj = tform || form; const name = segBtn.parentElement.dataset.name; obj[name] = segBtn.dataset.v;
        segBtn.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === segBtn));
        if (tform) return syncTrade();
        if (name === 'side' && form._new) { $('fNo').value = nextNo(form.side); }
        return syncForm();
      }
      const rm = e.target.closest('[data-rm]');
      if (rm && form) { form[rm.dataset.rm].splice(Number(rm.dataset.i), 1); rm.closest('li').remove(); return syncForm(); }
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'cancel') closeModal();
      if (b.dataset.act === 'saveForm') saveForm();
      if (b.dataset.act === 'saveFix') saveFix(b.dataset.id);
      if (b.dataset.act === 'saveDeliver') saveDeliver(b.dataset.id);
      if (b.dataset.act === 'planDone' || b.dataset.act === 'planDrop') planAct(b.dataset.id, b.dataset.i, b.dataset.act === 'planDone');
      if (b.dataset.act.startsWith('cell')) cellAct(b.dataset.act, b.dataset.id, b.dataset.code);
      if (b.dataset.act === 'saveTrade') saveTrade();
    });
    const onEdit = e => {
      if (form && e.target.closest('.ct-form')) { if (e.target.id === 'fBasis') form._basisTouched = true; syncForm(); }
      if (tform && e.target.closest('.tr-form')) { if (e.target.id === 'tPrice') tform._priceTouched = true; syncTrade(); }
    };
    m.addEventListener('input', onEdit); m.addEventListener('change', onEdit);
    $('btnCloseCtModal').addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && m.classList.contains('active')) closeModal(); });
  }
  bind();
  window.VTContracts = { render, newContract, newTrade, openCell };
})();

// VIỆT THIÊN COFFEE GROUP — Giá FOB theo chủng loại (diff so với sàn London) & chuẩn chất lượng ICE Robusta
// FOB hôm nay = giá sàn kỳ tham chiếu + diff của bảng báo giá. Bảng diff lưu cùng số liệu (data.grades), sửa ngay trên thẻ Bảng giá.
(function () {
  'use strict';
  const E = window.VTEngine, A = window.VTApp;
  const $ = id => document.getElementById(id);
  const fmt = (n, d) => E.fmt(n, d), signed = (n, d) => E.signed(n, d);
  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = () => A.getState();
  const dmy = iso => { if (!iso) return '—'; const [y, m, d] = String(iso).split('-'); return d ? `${d}/${m}/${y}` : iso; };
  const london = code => { const q = ((S().quotes || {}).coffee_liffe || []).find(x => x.Name === 'RM' + code); return q ? E.num(q.Last) : 0; };
  const fxRate = () => { const s = S(); return (s.fx && s.fx.transfer) || E.num(s.data.fobParams.exchangeRate) || 0; };
  const domAvg = () => { const d = S().domestic; return d && d.avg ? d.avg : 0; };
  let editing = false, draft = null, ref = '';

  const ICE_HTML = `<details class="gr-ice"><summary>📏 Chuẩn chất lượng sàn London – ICE Robusta (quy định 22/12/2025) và cách quy đổi R1 / R2 / R3</summary>
    <div class="table-scroll"><table class="board-table gr-table"><thead><tr><th>Hạng ICE</th><th>Lỗi tối đa</th><th>Tạp chất tối đa</th><th>Cỡ hạt (mẫu 300 g)</th><th>So với giá sàn</th></tr></thead><tbody>
    ${E.ICE_CLASSES.map(c => `<tr><td class="kh"><b>${c.label}</b></td><td>${fmt(c.defects, 1)}%</td><td>${fmt(c.fm, 1)}%</td><td class="txt">${c.screen}</td><td class="${c.adj > 0 ? 'up' : c.adj < 0 ? 'down' : ''}"><b>${c.adj ? `${signed(c.adj, 0)} USD/t` : 'Giá sàn'}</b></td></tr>`).join('')}
    </tbody></table></div>
    <ul class="gr-list">
      <li><b>Giá London là giá của hàng Class 1</b>: lỗi ≤ 3%, tạp chất ≤ 0,5%, ≥ 90% hạt trên sàng 14, giao tại kho do sàn chỉ định ở châu Âu/Mỹ, lô 10 tấn. <i>Lỗi</i> gồm hạt đen, mảnh vỡ (nhỏ hơn ½ hạt), quả cà phê, hạt mốc; <i>tạp chất</i> gồm cành, đá, đất, vỏ. Sàng 13/14/16/18 = 13/64… 18/64 inch.</li>
      <li><b>Quy đổi hàng Việt Nam (theo % đen vỡ và cỡ sàng):</b> R1 sàng 16/18, đen vỡ ≤ 2% ≈ <b>Class 1</b> (giá sàn) · R2 sàng 13, đen vỡ 5%, tạp chất 1% ≈ <b>Class 2</b> (−30 USD/t) · hàng đen vỡ 5–7,5% (R3) ≈ <b>Class 3</b> (−60) · 7,5–8% ≈ <b>Class 4</b> (−90) · trên 8% không giao được lên sàn. Class P (+30) đòi hỏi lỗi ≤ 0,5% và tạp chất ≤ 0,2%.</li>
      <li><b>Giá FOB Việt Nam = giá sàn kỳ tham chiếu + diff.</b> Diff do thị trường quyết định: chất lượng so với Class 1, xuất xứ, cước và chi phí từ Việt Nam tới kho châu Âu, cung – cầu theo mùa vụ, thời gian giao hàng. Mức +30/−30/−60/−90 của sàn chỉ áp dụng khi giao hàng lên sàn, nhưng là mốc để so chất lượng giữa các loại.</li>
      <li><b>Luôn ghi rõ kỳ tham chiếu</b> khi nói diff (vd "+435 so với RMU26"). Đổi sang kỳ khác mà giữ nguyên giá FOB: diff mới = diff cũ + (giá kỳ cũ − giá kỳ mới).</li>
      <li>Khi giao lên sàn còn bị trừ: hàng lưu kho lâu (tháng 13–48 sau giám định: 5 USD/tấn/tháng; từ tháng 49: 10 USD/tấn/tháng); hàng chuyển tiếp chưa có hồ sơ thẩm định EUDR (DDI) hợp lệ giao vào EU/Anh: kỳ giao năm 2027 trừ 5 USD/tấn/tháng, từ 01/2028 trừ 10 USD/tấn/tháng.</li>
    </ul>
    <p class="section-desc board-note">Nguồn: ICE Futures Europe – <a href="https://www.ice.com/publicdocs/futures/Robusta_Coffee_Allowances_and_Discounts.pdf" target="_blank" rel="noopener">Robusta Coffee Futures &amp; Options – Allowances &amp; Discounts</a> (22/12/2025).</p></details>`;

  function render(force) {
    const box = $('boardGrades'); const s = S(); if (!box || !s || !s.data) return;
    if (editing && !force) return; // đang sửa bảng: không vẽ lại theo nhịp giá để khỏi mất chữ đang gõ
    const g = editing ? draft : (s.data.grades || E.normalizeGrades(E.DEFAULT_GRADES));
    const list = ((s.quotes || {}).coffee_liffe || []).map(q => String(q.Name).replace(/^RM/, '')).filter(c => E.parseCode(c));
    const saved = String(s.data.fobParams.contract || '').replace(/^RM/, '');
    if (!ref || !list.includes(ref)) ref = list.includes(saved) ? saved : (list[1] || list[0] || '');
    const lon = london(ref), fx = fxRate(), dom = domAvg();
    const rows = g.items.map((it, i) => {
      const cls = E.iceClassFor(it.grade); const fob = lon ? lon + E.num(it.diff) : null; const vk = fob && fx ? fob * fx / 1000 : null; const gap = vk && dom ? vk - dom : null;
      const clsHtml = cls ? `<span class="gr-cls c${cls === '—' ? 'x' : cls}">${cls === '—' ? 'Không đạt' : 'Class ' + cls}</span>` : '—';
      const gapHtml = `<td class="${gap > 0 ? 'up' : gap < 0 ? 'down' : ''}">${gap === null ? '—' : signed(gap, 0)}</td>`;
      if (editing) return `<tr><td class="kh"><input class="form-control gr-in" data-i="${i}" data-k="grade" value="${esc(it.grade)}" placeholder="Robusta S18 Wet Polished"></td><td>${clsHtml}</td><td><input type="number" class="form-control gr-in gr-num" data-i="${i}" data-k="diff" value="${it.diff}" step="1"></td><td class="last">${fob ? fmt(fob, 0) : '—'}</td><td>${vk ? fmt(vk, 0) : '—'}</td>${gapHtml}<td><button type="button" class="ct-x" data-grm="${i}" title="Xóa dòng">×</button></td></tr>`;
      return `<tr><td class="kh"><b>${esc(it.grade)}</b>${it.fob ? `<small>FOB ${fmt(it.fob, 0)} lúc báo giá</small>` : ''}</td><td>${clsHtml}</td><td><b>${signed(it.diff, 0)}</b></td><td class="last">${fob ? fmt(fob, 0) : '—'}</td><td>${vk ? fmt(vk, 0) : '—'}</td>${gapHtml}</tr>`;
    }).join('');
    const tools = editing
      ? '<button type="button" class="btn btn-sm btn-outline" data-gr="add">➕ Thêm loại</button><button type="button" class="btn btn-sm btn-outline" data-gr="cancel">Hủy</button><button type="button" class="btn btn-sm btn-primary" data-gr="save">💾 Lưu bảng diff</button>'
      : '<button type="button" class="btn btn-sm btn-outline gr-edit-btn" data-gr="edit">✎ Sửa bảng diff</button>';
    box.innerHTML = `<div class="board-block"><div class="board-head"><h4>💎 Giá FOB theo chủng loại – diff so với sàn London</h4><span class="board-sub">Bảng diff: ${esc(g.source || '—')}${g.refMonth ? ` · tham chiếu RM${esc(g.refMonth)} ${fmt(g.refPrice, 0)} USD/t` : ''}</span></div>
      <div class="gr-tools"><label>Tính theo kỳ <select id="grRef" class="form-control">${list.map(c => `<option value="${c}"${c === ref ? ' selected' : ''}>RM${c} · ${fmt(london(c), 0)}</option>`).join('')}</select></label>${tools}</div>
      ${editing ? metaHtml(g) : ''}
      <div class="table-scroll"><table class="board-table gr-table"><thead><tr><th>Chủng loại</th><th>Hạng ICE</th><th>Diff USD/t</th><th>FOB hôm nay</th><th>VNĐ/kg</th><th>So nhân xô (đ/kg)</th>${editing ? '<th></th>' : ''}</tr></thead><tbody>${rows || '<tr><td colspan="7" class="muted">Chưa có loại hàng</td></tr>'}</tbody></table></div>
      <p class="section-desc board-note">FOB hôm nay = giá RM${esc(ref)} hiện tại${lon ? ` (${fmt(lon, 0)})` : ''} + diff của bảng báo giá (chưa điều chỉnh chênh lệch giữa kỳ RM${esc(g.refMonth || '?')} và RM${esc(ref)}). Đ/kg theo tỷ giá VCB ${fmt(fx, 0)}; so với giá nhân xô trung bình ${dom ? fmt(dom, 0) : '—'} đ/kg (chưa trừ chế biến, bao bì, vận chuyển). Có báo giá mới thì bấm ✎ Sửa bảng diff.</p>
      ${ICE_HTML}</div>`;
  }
  function metaHtml(g) {
    return `<div class="form-row gr-meta"><div class="form-group"><label>Ngày báo giá</label><input type="date" class="form-control gr-meta-in" data-k="date" value="${esc(g.date)}"></div>
      <div class="form-group"><label>Kỳ tham chiếu lúc báo giá</label><input class="form-control gr-meta-in" data-k="refMonth" value="${esc(g.refMonth)}" placeholder="U26"></div>
      <div class="form-group"><label>Giá sàn lúc báo giá (USD/t)</label><input type="number" class="form-control gr-meta-in" data-k="refPrice" value="${g.refPrice || ''}"></div>
      <div class="form-group"><label>Nguồn / ghi chú</label><input class="form-control gr-meta-in" data-k="source" value="${esc(g.source)}"></div></div>`;
  }
  function save() {
    const g = draft; g.refMonth = String(g.refMonth || '').toUpperCase().replace(/^RM/, '');
    g.items = g.items.filter(it => String(it.grade).trim()).map(it => ({ grade: String(it.grade).trim(), diff: E.num(it.diff), fob: g.refPrice ? E.num(g.refPrice) + E.num(it.diff) : E.num(it.fob) }));
    S().data.grades = E.normalizeGrades(g); editing = false; draft = null;
    A.ledgerChanged('💎 Đã lưu bảng diff theo chủng loại').then(() => render(true));
  }
  function bind() {
    const box = $('boardGrades'); if (!box) return;
    box.addEventListener('change', e => { if (e.target.id === 'grRef') { ref = e.target.value; render(true); } });
    box.addEventListener('input', e => {
      const t = e.target;
      if (t.classList.contains('gr-in') && draft) { const it = draft.items[Number(t.dataset.i)]; it[t.dataset.k] = t.dataset.k === 'grade' ? t.value : E.num(t.value); }
      if (t.classList.contains('gr-meta-in') && draft) draft[t.dataset.k] = t.dataset.k === 'refPrice' ? E.num(t.value) : t.value;
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-gr], [data-grm]'); if (!b) return;
      if (b.dataset.grm !== undefined) { draft.items.splice(Number(b.dataset.grm), 1); return render(true); }
      const act = b.dataset.gr;
      if (act === 'edit') { editing = true; draft = JSON.parse(JSON.stringify(S().data.grades || E.normalizeGrades(E.DEFAULT_GRADES))); render(true); }
      if (act === 'cancel') { editing = false; draft = null; render(true); }
      if (act === 'add') { draft.items.push({ grade: '', fob: 0, diff: 0 }); render(true); }
      if (act === 'save') save();
    });
  }
  bind();
  window.VTGrades = { render };
})();

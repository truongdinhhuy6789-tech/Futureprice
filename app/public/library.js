// VIỆT THIÊN COFFEE GROUP — Thẻ 📚 Kiến thức: thư viện bài viết (dữ liệu ở knowledge.js), tìm kiếm không dấu, nhóm chủ đề,
// nút ⓘ trên hệ thống (data-kb="id bài") mở nhanh đúng bài. Trợ lý dùng VTLibrary.search() để trả lời hỏi đáp.
(function () {
  'use strict';
  const KB = window.VTKnowledge || { cats: [], articles: [] };
  const $ = id => document.getElementById(id);
  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const strip = html => String(html || '').replace(/<[^>]+>/g, ' ');
  const CAT = Object.fromEntries(KB.cats);
  // Chỉ mục tìm kiếm (không dấu)
  const index = KB.articles.map(a => ({ a, title: norm(a.title), tags: norm(a.tags), sum: norm(a.sum), body: norm(strip(a.body)) }));
  const STOP = new Set(['la', 'gi', 'the', 'nao', 'va', 'cua', 'co', 'khong', 'cho', 'khi', 'thi', 'mot', 'cac', 'nhung', 'sao', 'nhu', 'de', 'o', 'tai', 've', 'voi', 'duoc', 'hay', 'bao', 'nhieu', 'lam']);
  function search(q, limit) {
    const words = norm(q).split(/[^a-z0-9%.]+/).filter(w => w && (w.length > 1 || /\d/.test(w)) && !STOP.has(w));
    if (!words.length) return [];
    return index.map(x => {
      let s = 0;
      words.forEach(w => { if (x.title.includes(w)) s += 5; if (x.tags.includes(w)) s += 4; if (x.sum.includes(w)) s += 2; if (x.body.includes(w)) s += 1; });
      const phrase = norm(q).trim(); if (phrase.length > 4 && (x.title.includes(phrase) || x.tags.includes(phrase))) s += 6;
      return { a: x.a, s };
    }).filter(r => r.s > 0).sort((p, q2) => q2.s - p.s).slice(0, limit || 8).map(r => r.a);
  }
  const byId = id => KB.articles.find(a => a.id === id);
  function related(a) {
    const t = new Set(norm(a.tags).split(' '));
    return KB.articles.filter(b => b.id !== a.id).map(b => ({ b, s: (b.cat === a.cat ? 2 : 0) + norm(b.tags).split(' ').filter(w => w.length > 2 && t.has(w)).length }))
      .filter(r => r.s > 1).sort((x, y) => y.s - x.s).slice(0, 4).map(r => r.b);
  }

  // ---------- Thẻ Kiến thức ----------
  let cat = 'all', current = null;
  function render() {
    const box = $('libBody'); if (!box) return;
    if (current) return renderArticle(current);
    const q = $('libSearch').value.trim();
    const list = q ? search(q, 40) : KB.articles.filter(a => cat === 'all' || a.cat === cat);
    $('libCats').innerHTML = [['all', '📚 Tất cả']].concat(KB.cats).map(([k, l]) => `<button type="button" class="lib-cat${!q && k === cat ? ' on' : ''}" data-cat="${k}">${l}<small>${k === 'all' ? KB.articles.length : KB.articles.filter(a => a.cat === k).length}</small></button>`).join('');
    box.innerHTML = (q ? `<p class="lib-hint">${list.length ? `${list.length} bài khớp "<b>${esc(q)}</b>"` : `Không tìm thấy bài nào cho "<b>${esc(q)}</b>" – thử từ khóa khác (vd: diff, chốt giá, ký quỹ, R2, spread)`}</p>` : '')
      + `<div class="lib-grid">${list.map(a => `<button type="button" class="lib-card" data-id="${a.id}"><span class="lib-card-cat">${esc(CAT[a.cat] || '')}</span><b>${esc(a.title)}</b><span>${esc(a.sum)}</span></button>`).join('')}</div>`;
  }
  function renderArticle(id) {
    const a = byId(id); const box = $('libBody'); if (!a) { current = null; return render(); }
    const rel = related(a);
    box.innerHTML = `<article class="lib-article"><button type="button" class="btn btn-sm btn-outline lib-back" data-back="1">← Thư viện</button>
      <div class="lib-card-cat">${esc(CAT[a.cat] || '')}</div><h2>${esc(a.title)}</h2><p class="lib-sum">${esc(a.sum)}</p><div class="lib-content">${a.body}</div>
      ${rel.length ? `<h4>Bài liên quan</h4><div class="lib-rel">${rel.map(b => `<button type="button" class="lib-chip" data-id="${b.id}">${esc(b.title)}</button>`).join('')}</div>` : ''}
      <p class="lib-foot">Hỏi thêm Trợ lý (nút logo góc phải) hoặc bổ sung bài trong file <code>app/public/knowledge.js</code>.</p></article>`;
  }
  function open(id) {
    current = byId(id) ? id : null;
    if (window.VTApp && window.VTApp.showTab) window.VTApp.showTab('library'); else render();
    if (current) setTimeout(() => { const el = $('libBody'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 50);
  }

  // ---------- Xem nhanh từ nút ⓘ ----------
  function peek(id) {
    const a = byId(id); if (!a) return;
    let m = $('kbModal');
    if (!m) { m = document.createElement('div'); m.className = 'modal-overlay'; m.id = 'kbModal'; m.innerHTML = '<div class="modal-box kb-modal"><div class="modal-header"><div class="modal-title" id="kbTitle"></div><button class="modal-close" data-kbclose="1">&times;</button></div><div class="modal-body lib-content" id="kbBody"></div><div class="modal-footer"><button class="btn btn-outline" data-kbclose="1">Đóng</button><button class="btn btn-primary" id="kbOpen">📚 Mở trong thư viện</button></div></div>'; document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-kbclose]')) m.classList.remove('active'); });
      m.querySelector('#kbOpen').addEventListener('click', () => { m.classList.remove('active'); open(m.dataset.id); }); }
    m.dataset.id = id; $('kbTitle').textContent = '📚 ' + a.title; $('kbBody').innerHTML = `<p class="lib-sum">${esc(a.sum)}</p>${a.body}`;
    m.classList.add('active');
  }
  document.addEventListener('click', e => { const b = e.target.closest('.kb-i[data-kb]'); if (b) { e.preventDefault(); e.stopPropagation(); peek(b.dataset.kb); } });
  // Gắn nút ⓘ vào các chỗ quan trọng của giao diện (giữ nguyên HTML gốc)
  const SPOTS = [['#positionTable', 'vi-the-rong', 'before'], ['#spreadItems', 'spread', 'before'], ['#calcMonthSelect', 'diff', 'label'], ['#resDomesticEq', 'quy-doi-gia', 'after'],
    ['#ctTable', 'hang-that-ao', 'before'], ['#trTable', 'ky-quy', 'before'], ['#boardDomestic', 'nhan-xo', 'before'], ['#boardGrades', 'r1-r2-r3', 'before'], ['#hedgeScenarios', 'quyen-chon', 'before']];
  function addSpots() {
    SPOTS.forEach(([sel, id, where]) => {
      const el = document.querySelector(sel); if (!el || el.dataset.kbSpot) return;
      const a = byId(id); if (!a) return; el.dataset.kbSpot = '1';
      const btn = `<button type="button" class="kb-i" data-kb="${id}" title="Kiến thức: ${esc(a.title)}">ⓘ ${esc(a.title.split(':')[0].split('–')[0].replace(/\?$/, '').trim())}</button>`;
      if (where === 'label') { const lab = el.closest('.form-group'); const l = lab && lab.querySelector('label'); if (l) l.insertAdjacentHTML('beforeend', ` <button type="button" class="kb-i kb-mini" data-kb="${id}" title="Kiến thức: ${esc(a.title)}">ⓘ</button>`); }
      else if (where === 'after') el.insertAdjacentHTML('afterend', ` <button type="button" class="kb-i kb-mini" data-kb="${id}" title="Kiến thức: ${esc(a.title)}">ⓘ</button>`);
      else { const host = el.closest('.section-card, .board-block, .spread-ribbon') || el.parentElement; const t = host.querySelector('.section-desc, .spread-ribbon-title'); (t || el).insertAdjacentHTML(t ? 'beforeend' : 'beforebegin', ' ' + btn); }
    });
  }

  function bind() {
    if (!$('libBody')) return;
    $('libSearch').addEventListener('input', () => { current = null; render(); });
    $('libCats').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; current = null; $('libSearch').value = ''; render(); });
    $('libBody').addEventListener('click', e => {
      const c = e.target.closest('[data-id]'); if (c) { current = c.dataset.id; render(); window.scrollTo({ top: $('libSearch').getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); return; }
      if (e.target.closest('[data-back]')) { current = null; render(); }
    });
    addSpots(); setTimeout(addSpots, 1500);
    if (location.hash.startsWith('#kien-thuc/')) current = location.hash.slice(11);
  }
  bind();
  window.VTLibrary = { render, open, peek, search, byId, cats: KB.cats, count: KB.articles.length };
})();

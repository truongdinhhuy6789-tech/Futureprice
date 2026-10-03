// Kiểm thử công thức của engine.js — chạy: node test_engine.js
const assert = require('assert');
const E = require('./public/engine');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('✓', name); };

t('Kỳ hạn kế tiếp ngày 03/10/2026', () => assert.deepStrictEqual(E.nextContracts(new Date(2026, 9, 3)), ['X26', 'F27', 'H27', 'K27', 'N27', 'U27']));
t('Kỳ hạn kế tiếp ngày 15/11/2026 (X26 đã vào tháng giao)', () => assert.deepStrictEqual(E.nextContracts(new Date(2026, 10, 15)), ['F27', 'H27', 'K27', 'N27', 'U27', 'X27']));
t('Nhãn kỳ hạn', () => assert.strictEqual(E.contractLabel('F27'), 'Thg 1/27'));
t('Hết hạn', () => { assert.ok(E.isExpired('X26', new Date(2026, 10, 1))); assert.ok(!E.isExpired('X26', new Date(2026, 9, 31))); });

const d = (() => { const x = E.sampleData(new Date(2026, 9, 3)); return x; })();
const pos = E.computePositions(d);
t('Vị thế hàng thực = ma trận mẫu', () => assert.deepStrictEqual(pos.physical, [658, -13.76, -228.53, -513.82, 0, 0]));
t('Tổng vị thế ròng = -98.11', () => assert.strictEqual(pos.totals.net, -98.11));
t('Hàng gởi không cộng vào tổng', () => assert.strictEqual(pos.rowSums.consignment_buy, 70));

t('Phòng hộ khi vượt hạn mức 200 t', () => {
  const r = E.analyzeRisk(pos, { limit: 200, priceMove: 30 });
  const h = r.alerts.filter(a => a.type === 'hedge').map(a => `${a.code}:${a.action}:${a.lots}`);
  assert.deepStrictEqual(h, ['X26:BÁN SHORT:66', 'H27:MUA LONG:23', 'K27:MUA LONG:51']);
  assert.ok(r.alerts.some(a => a.type === 'mismatch'));
  assert.strictEqual(r.mtmUp, -2943.3);
});

t('Thêm hedge vào sàn làm giảm vị thế ròng', () => {
  const x = JSON.parse(JSON.stringify(d)); x.matrix.hedge_robusta_hdbank.K27 = 510;
  assert.strictEqual(E.computePositions(x).net[3], -3.82);
});

t('Nâng cấp dữ liệu bản 1 (mảng) sang bản 2 (mã kỳ hạn)', () => {
  const v1 = { columns: ['F (Thg 1)'], matrix: { inventory: [1, 2, 3, 4, 5, 6] }, fobParams: { contractMonth: 'RMF27', diffUsd: 0, exchangeRate: 26000, processingCostVnd: 0 } };
  const v2 = E.normalize(v1, new Date(2026, 9, 3));
  assert.strictEqual(v2.matrix.inventory.U27, 6);
  assert.strictEqual(v2.fobParams.diffUsd, 0);            // 0 không bị đổi thành -50
  assert.strictEqual(v2.fobParams.processingCostVnd, 0);  // 0 không bị đổi thành 700
  assert.strictEqual(v2.fobParams.contract, 'RMF27');
});

t('Dữ liệu bản 1 thật: ghép theo chữ cái tháng (N cũ → N27)', () => {
  const v1 = { columns: ['F (Thg 1)', 'H (Thg 3)', 'K (Thg 5)', 'N (Thg 7)', 'U (Thg 9)', 'X (Thg 11)'],
    matrix: { consignment_buy: [0, 0, 0, 70, 0, 0], spread_combined_lots: [0, 0, 0, -7, 0, 0], inventory: [1, 0, 0, 0, 0, 9] } };
  const v2 = E.normalize(v1, new Date(2026, 9, 3));
  assert.strictEqual(v2.matrix.consignment_buy.N27, 70);
  assert.strictEqual(v2.matrix.spread_combined_lots.N27, -7);
  assert.strictEqual(v2.matrix.inventory.F27, 1);
  assert.strictEqual(v2.matrix.inventory.X26, 9);
});

t('Chuyển kỳ hạn báo số liệu bị loại', () => {
  const r = E.rollColumns(d, new Date(2026, 10, 15));
  assert.strictEqual(r.data.columns[0], 'F27');
  assert.strictEqual(r.data.matrix.inventory.F27, -42.12);
  assert.ok(r.dropped.some(x => x.code === 'X26' && x.value === 658));
});

t('Spread & cấu trúc thị trường', () => {
  const q = { coffee_liffe: [{ Name: 'RMX26', Last: '3347' }, { Name: 'RMF27', Last: '3324' }] };
  const s = E.computeSpreads(['X26', 'F27', 'H27'], q);
  assert.strictEqual(s[0].value, 23); assert.strictEqual(s[0].structure, 'Inverted'); assert.strictEqual(s[1].value, null);
});

t('Giá FOB từ trừ lùi', () => assert.deepStrictEqual(E.computeFob(3367, -50, 25790, 700), { fobUsd: 3317, fobVndKg: 85545, domesticVndKg: 84845 }));

t('Số có dấu không hiện "+-0"', () => {
  assert.strictEqual(E.signed(-0), '0'); assert.strictEqual(E.signed(21), '+21'); assert.strictEqual(E.signed(-13.4), '-13'); assert.strictEqual(E.signed(0.004, 2), '0.00');
});

t('Mã MXV & ngày thông báo đầu tiên (khớp bảng giá MXV)', () => {
  assert.strictEqual(E.mxvCode('RMX26'), 'LRCX26'); assert.strictEqual(E.mxvCode('KCH27'), 'KCEH27');
  const d = x => { const f = E.firstNoticeDay(x); return `${f.getDate()}/${f.getMonth() + 1}/${f.getFullYear()}`; };
  assert.strictEqual(d('RMX26'), '27/10/2026'); assert.strictEqual(d('RMF27'), '28/12/2026'); assert.strictEqual(d('RMH27'), '23/2/2027');
  assert.strictEqual(d('KCH27'), '18/2/2027'); assert.strictEqual(d('KCK27'), '22/4/2027');
});

t('Mô hình phòng hộ 4 chiến lược = bảng tính tham khảo', () => {
  const h = E.simulateHedge({ qa: 300, lotSize: 10, f0: 4600, fobTarget: 4200, fxManual: 25500, kPut: 4300, pPut: 120, kCall: 4600, pCall: 120, hybridRatio: 0.5, feePerLot: 26 }, 25400);
  assert.strictEqual(h.lots, 30); assert.strictEqual(h.diff, -400); assert.strictEqual(h.feeT, 2.6);
  const s = Object.fromEntries(h.strategies.map(x => [x.key, x]));
  assert.strictEqual(s.futures.floor, 4197.4); assert.strictEqual(s.put.floor, 3777.4); assert.strictEqual(s.collar.floor, 3894.8); assert.strictEqual(s.hybrid.floor, 3987.4);
  assert.strictEqual(s.collar.cap, 4194.8); assert.strictEqual(s.put.cap, null);
  assert.strictEqual(s.put.premium, 36000); assert.strictEqual(s.hybrid.premium, 18000); assert.strictEqual(s.collar.fees, 1560);
  assert.strictEqual(s.futures.floorVndKg, 107033.7); assert.strictEqual(s.put.revenueMinMillion, 28897);
  const sc = Object.fromEntries(h.scenarios.map(x => [x.key, x]));
  assert.strictEqual(sc.crash.ice, 3220); assert.strictEqual(sc.crash.collar, 3894.8); assert.strictEqual(sc.crash.hybrid, 3987.4);
  assert.strictEqual(sc.flat.hybrid, 4137.4); assert.strictEqual(sc.up.collar, 4194.8); assert.strictEqual(sc.boom.hybrid, 4827.4);
});

// ---------- Sổ hợp đồng ----------
t('Kỳ hạn tham chiếu mặc định theo tháng giao (giao 01/2027 → H27, giao 11/2026 → F27)', () => {
  assert.strictEqual(E.basisForShipment('2027-01'), 'H27'); assert.strictEqual(E.basisForShipment('2026-11'), 'F27'); assert.strictEqual(E.basisForShipment(''), '');
});

t('HĐ bán trừ lùi 38,4 t: chốt / giao từng phần → đúng dòng ma trận', () => {
  const c = E.normalizeContract({ side: 'sell', qty: 38.4, pricing: 'diff', diff: 352, basis: 'F27' });
  let s = E.contractState(c);
  assert.deepStrictEqual([s.fu, s.us, s.uu, s.lots, s.containers, s.fixStatus], [0, 0, 38.4, 3.84, 2, 'open']);
  c.fixes = [{ tons: 20, fut: 3400 }, { tons: 10, fut: 3460 }];
  s = E.contractState(c);
  assert.deepStrictEqual([s.fixedT, s.fu, s.uu, s.avgFix, s.priceUsd, s.fixStatus], [30, 30, 8.4, 3420, 3772, 'partial']);
  c.deliveries = [{ tons: 19.2 }];
  s = E.contractState(c);
  assert.deepStrictEqual([s.fs, s.fu, s.us, s.uu, s.closed], [19.2, 10.8, 0, 8.4, false]);
  c.fixes.push({ tons: 8.4, fut: 3500 }); c.deliveries.push({ tons: 19.2 });
  assert.ok(E.contractState(c).closed);
});

t('Sổ hợp đồng → ma trận: dấu mua/bán, kỳ đã qua ghép vào kỳ đầu', () => {
  const cols = ['X26', 'F27', 'H27', 'K27', 'N27', 'U27'];
  const list = [
    E.normalizeContract({ side: 'sell', qty: 38.4, pricing: 'fixed', price: 3800, basis: 'F27' }),
    E.normalizeContract({ side: 'buy', qty: 50, pricing: 'diff', diff: -80, basis: 'H27', deliveries: [{ tons: 20 }] }),
    E.normalizeContract({ side: 'sell', qty: 10, pricing: 'diff', diff: 300, basis: 'U26' })
  ];
  const { rows, moved } = E.contractRows(list, cols);
  assert.strictEqual(rows.sell_fixed_unshipped.F27, -38.4);
  assert.strictEqual(rows.buy_unfixed_shipped.H27, 20); assert.strictEqual(rows.diff_buy_unfixed.H27, 30);
  assert.strictEqual(rows.diff_sell_unfixed.X26, -10);
  assert.deepStrictEqual(moved.map(m => [m.basis, m.to, m.expired]), [['U26', 'X26', true]]);
  const data = { ...E.defaultData(new Date(2026, 9, 3)), contracts: list };
  const p = E.computePositions(data);
  assert.deepStrictEqual(p.net, [-10, -38.4, 50, 0, 0, 0]); assert.strictEqual(p.totals.net, 1.6);
});

t('Lần đầu có sổ: số tay ở dòng hợp đồng chuyển thành "đầu kỳ", vị thế không đổi', () => {
  const raw = E.sampleData(new Date(2026, 9, 3)); delete raw.contracts;
  const before = E.computePositions(raw);
  const x = E.normalize(raw, new Date(2026, 9, 3));
  assert.ok(x.contracts.length === 5 && x.contracts.every(c => c.no === 'ĐẦU KỲ'));
  assert.strictEqual(x.matrix.sell_fixed_unshipped.H27, 0);
  const after = E.computePositions(x);
  assert.deepStrictEqual(after.physical, before.physical); assert.strictEqual(after.totals.net, before.totals.net);
  assert.strictEqual(E.normalize(x, new Date(2026, 9, 3)).contracts.length, 5); // chuẩn hóa lại không nhân đôi
});

t('Hạn chốt giá & tóm tắt sổ', () => {
  const list = [E.normalizeContract({ no: 'VT-001', side: 'sell', qty: 38.4, pricing: 'diff', diff: 352, basis: 'F27' }),
    E.normalizeContract({ no: 'VT-002', side: 'buy', qty: 20, pricing: 'fixed', price: 95000, unit: 'vnd', basis: 'X26' })];
  const s = E.contractSummary(list, new Date(2026, 9, 3));
  assert.deepStrictEqual([s.open, s.sellUnfixedT, s.buyUnfixedT, s.sellUndeliveredT, s.buyUndeliveredT, s.netEffect], [2, 38.4, 0, 38.4, 20, -18.4]);
  assert.strictEqual(s.due.length, 1); assert.strictEqual(s.due[0].no, 'VT-001'); assert.strictEqual(s.due[0].left, 86); // FND F27 ≈ 28/12/2026
});

// ---------- Lệnh sàn (hàng ảo) ----------
t('Lệnh sàn → dòng Robusta sàn của ma trận; liên kết hợp đồng; hở vị thế', () => {
  const cols = ['X26', 'F27', 'H27', 'K27', 'N27', 'U27'];
  const sale = E.normalizeContract({ id: 'c1', side: 'sell', qty: 38.4, pricing: 'fixed', price: 3800, basis: 'F27' });
  const trades = [E.normalizeTrade({ account: 'hdbank', side: 'buy', lots: 4, month: 'F27', price: 3448, link: 'c1' }),
    E.normalizeTrade({ account: 'pfs', side: 'sell', lots: 2, month: 'H27', price: 3400 })];
  const { rows } = E.tradeRows(trades, cols);
  assert.strictEqual(rows.hedge_robusta_hdbank.F27, 40); assert.strictEqual(rows.hedge_robusta_pfs.H27, -20);
  assert.strictEqual(E.linkedLots(trades, 'c1'), 4); assert.strictEqual(E.contractExposure(sale), -38.4);
  const p = E.computePositions({ ...E.defaultData(new Date(2026, 9, 3)), contracts: [sale], trades });
  assert.deepStrictEqual(p.futures, [0, 40, -20, 0, 0, 0]); assert.deepStrictEqual(p.net, [0, 1.6, -20, 0, 0, 0]);
});

t('Sổ lệnh: giá vốn bình quân, lãi/lỗ đã chốt và đang mở, đảo chiều', () => {
  const tr = [{ date: '2026-10-01', side: 'buy', lots: 4, month: 'F27', price: 3400 }, { date: '2026-10-02', side: 'sell', lots: 2, month: 'F27', price: 3500 },
    { date: '2026-10-03', side: 'buy', lots: 2, month: 'F27', price: 3460 }].map(E.normalizeTrade);
  let b = E.futuresBook(tr, () => 3450).list[0];
  assert.deepStrictEqual([b.pos, b.avg, b.realized, b.unrealized], [4, 3430, 2000, 800]); // (3500-3400)×2×10; (3450-3430)×4×10
  tr.push(E.normalizeTrade({ date: '2026-10-04', side: 'sell', lots: 6, month: 'F27', price: 3480 }));
  b = E.futuresBook(tr, () => 3450).list[0];
  assert.deepStrictEqual([b.pos, b.avg, b.realized, b.unrealized], [-2, 3480, 4000, 600]); // đóng 4 lot lãi (3480-3430)×4×10, mở bán 2 lot @3480
});

t('Lần đầu có sổ lệnh: số tay ở dòng Robusta sàn chuyển thành lệnh đầu kỳ, vị thế không đổi', () => {
  const raw = E.sampleData(new Date(2026, 9, 3)); raw.matrix.hedge_robusta_hdbank.K27 = 510; raw.matrix.hedge_arabica_pfs.F27 = 17;
  const before = E.computePositions(raw);
  const x = E.normalize(raw, new Date(2026, 9, 3));
  assert.strictEqual(x.trades.length, 1); assert.strictEqual(x.trades[0].lots, 51); assert.strictEqual(x.matrix.hedge_robusta_hdbank.K27, 0);
  assert.strictEqual(x.matrix.hedge_arabica_pfs.F27, 17); // Arabica vẫn nhập tay
  assert.deepStrictEqual(E.computePositions(x).net, before.net);
});

console.log(`\nĐạt ${n}/${n} kiểm thử.`);

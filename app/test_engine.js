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

console.log(`\nĐạt ${n}/${n} kiểm thử.`);

// VIỆT THIÊN COFFEE GROUP — THƯ VIỆN KIẾN THỨC NỀN (giá cả, chất lượng, hợp đồng, phòng hộ, quản trị vị thế, thị trường, tư vấn)
// Thêm bài mới: chép một khối { id, cat, title, tags, sum, body } và sửa nội dung. id viết liền không dấu, không trùng.
// cat phải là một trong các nhóm ở "cats". body là HTML đơn giản (<p>, <ul><li>, <b>, <table>).
window.VTKnowledge = {
  cats: [
    ['gia', '💲 Giá & quy đổi'], ['chatluong', '📏 Chất lượng'], ['hopdong', '📝 Hợp đồng & chốt giá'], ['phongho', '🛡️ Phòng hộ & sàn'], ['tinhhuong', '🎬 Tình huống futures'],
    ['vithe', '⚖️ Quản trị vị thế'], ['thitruong', '🌦️ Phân tích thị trường'], ['tuvan', '🎯 Tư vấn & nguyên tắc'], ['thuatngu', '📖 Thuật ngữ'], ['cqg', '📟 CQG & thực hành'], ['huongdan', '📘 Hướng dẫn sử dụng']
  ],
  articles: [
    // ===================== GIÁ & QUY ĐỔI =====================
    { id: 'gia-london', cat: 'gia', title: 'Giá sàn London (Robusta ICE Europe) là gì?', tags: 'london robusta ice lot 10 tan gio giao dich gia san',
      sum: 'Giá hợp đồng kỳ hạn Robusta trên sàn ICE Futures Europe – mốc để định giá cà phê Robusta toàn thế giới.',
      body: `<ul>
        <li><b>Hàng hóa:</b> Robusta chuẩn <b>Class 1</b> (lỗi ≤ 3%, tạp chất ≤ 0,5%, ≥ 90% trên sàng 14) giao tại kho do sàn chỉ định ở châu Âu/Mỹ.</li>
        <li><b>1 lot = 10 tấn</b>, giá tính bằng <b>USD/tấn</b>, bước giá 1 USD/tấn (= 10 USD/lot).</li>
        <li><b>Tháng giao hàng:</b> F (1), H (3), K (5), N (7), U (9), X (11). Ví dụ RMF27 = kỳ tháng 1/2027.</li>
        <li><b>Giờ giao dịch:</b> 9:00–17:30 giờ London, tức khoảng <b>15:00–23:30 giờ VN</b> (mùa hè châu Âu) hoặc <b>16:00–00:30</b> (mùa đông).</li>
        <li>Giá London <b>không phải</b> giá hàng Việt Nam tại cảng: giá FOB Việt Nam = giá sàn kỳ tham chiếu + <b>diff</b> (xem bài Diff).</li>
        <li>Trên hệ thống: thẻ giá Robusta London (kỳ gần), thẻ 🌐 Bảng giá (đủ các kỳ), nguồn giacaphe.com.</li></ul>` },
    { id: 'gia-newyork', cat: 'gia', title: 'Giá Arabica New York (ICE US "Coffee C")', tags: 'arabica new york kc cents lb quy doi',
      sum: 'Sàn Arabica, giá tính bằng cent/pound – muốn so với Robusta phải quy đổi ra USD/tấn.',
      body: `<ul><li>Hợp đồng "Coffee C" trên ICE Futures US: 1 lot = 37.500 pound (~17 tấn), giá <b>cent/lb</b>, tháng giao H, K, N, U, Z.</li>
        <li><b>Quy đổi:</b> 1 cent/lb = 22,0462 USD/tấn. Ví dụ 280 cent/lb ≈ 6.173 USD/tấn.</li>
        <li><b>Chênh lệch Arabica – Robusta</b> (arbitrage): khi Arabica quá đắt, nhà rang tăng tỷ lệ Robusta trong phối trộn → hỗ trợ giá Robusta, và ngược lại.</li></ul>` },
    { id: 'ma-ky-han', cat: 'gia', title: 'Đọc mã kỳ hạn: RMF27, LRCF27, KCH27', tags: 'ma ky han ky hieu thang f g h j k m n q u v x z mxv lrc kce rm kc',
      sum: 'Chữ cái = tháng giao, 2 số = năm. RM/LRC = Robusta, KC/KCE = Arabica.',
      body: `<table><tr><th>Chữ</th><td>F</td><td>G</td><td>H</td><td>J</td><td>K</td><td>M</td><td>N</td><td>Q</td><td>U</td><td>V</td><td>X</td><td>Z</td></tr>
        <tr><th>Tháng</th><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td></tr></table>
        <ul><li><b>Robusta</b> chỉ có F H K N U X; <b>Arabica</b> có H K N U Z.</li>
        <li>Tiền tố: <b>RM</b> (giacaphe, Barchart) hoặc <b>LRC</b> (sàn MXV Việt Nam) = Robusta London; <b>KC</b> / <b>KCE</b> = Arabica New York.</li>
        <li>Ví dụ: RMF27 = LRCF27 = Robusta giao tháng 1/2027; KCH27 = Arabica tháng 3/2027.</li></ul>` },
    { id: 'doc-bang-gia', cat: 'gia', title: 'Đọc bảng giá sàn: khớp, thay đổi, cao/thấp, khối lượng, HĐ mở', tags: 'bang gia khop thay doi khoi luong open interest hd mo hom truoc',
      sum: 'Giá khớp so với giá chốt phiên trước; khối lượng và HĐ mở cho biết kỳ nào đang được giao dịch nhiều.',
      body: `<ul><li><b>Giá khớp</b>: giá giao dịch gần nhất. <b>Thay đổi</b>: so với giá chốt phiên trước (cột "Hôm trước").</li>
        <li><b>Cao / Thấp</b>: biên độ trong phiên – biên độ rộng = thị trường biến động mạnh.</li>
        <li><b>Khối lượng</b>: số lot khớp trong ngày. <b>HĐ mở</b> (open interest): số lot đang còn mở – kỳ có HĐ mở lớn nhất là kỳ "chủ đạo", nên đặt lệnh ở đó cho dễ khớp.</li>
        <li><b>Ngày thông báo đầu tiên</b>: phải đóng hoặc đảo lệnh trước ngày này nếu không muốn giao/nhận hàng thật.</li>
        <li>Thanh màu ở cột Kỳ hạn trên thẻ 🌐 Bảng giá cho biết giá khớp đang ở đâu trong biên độ cao – thấp của phiên.</li></ul>` },
    { id: 'fob-cfr-cif', cat: 'gia', title: 'FOB, CFR, CIF, FCA khác nhau thế nào?', tags: 'fob cfr cif fca exw incoterms dieu kien giao hang cuoc bao hiem',
      sum: 'Điều kiện giao hàng (Incoterms 2020) quyết định ai trả cước, bảo hiểm và rủi ro chuyển giao lúc nào.',
      body: `<table><tr><th>Điều kiện</th><th>Người bán lo</th><th>Rủi ro chuyển sang người mua</th></tr>
        <tr><td><b>FOB</b> (cảng xếp)</td><td>Hàng, thủ tục xuất khẩu, đưa lên tàu tại cảng VN</td><td>Khi hàng đã lên tàu</td></tr>
        <tr><td><b>CFR</b></td><td>Như FOB + cước tàu tới cảng đến</td><td>Khi hàng đã lên tàu (người bán trả cước nhưng không chịu rủi ro trên đường)</td></tr>
        <tr><td><b>CIF</b></td><td>Như CFR + bảo hiểm hàng</td><td>Khi hàng đã lên tàu</td></tr>
        <tr><td><b>FCA</b></td><td>Giao cho người chuyên chở tại nơi chỉ định (bãi container…)</td><td>Khi giao cho người chuyên chở</td></tr></table>
        <p>Cà phê xuất từ Việt Nam thường báo giá <b>FOB TP.HCM</b>. Muốn so FOB với giá CIF của khách: CIF ≈ FOB + cước + bảo hiểm.</p>` },
    { id: 'diff', cat: 'gia', title: 'Diff (differential, cộng/trừ lùi) là gì và tính thế nào?', tags: 'diff differential cong lui tru lui chenh lech fob gia san premium discount',
      sum: 'Diff = Giá FOB − Giá sàn kỳ tham chiếu. Dương là cộng (premium), âm là trừ lùi (discount).',
      body: `<p><b>Công thức:</b> Diff = Giá FOB Việt Nam − Giá hợp đồng kỳ hạn London của kỳ tham chiếu (USD/tấn).</p>
        <p><b>Ví dụ (báo giá 27/08/2026, tham chiếu RMU26 = 3.742):</b> S13 5% đen vỡ 3.908 → <b>+166</b>; S16/S18 2% đen vỡ 4.004 → <b>+262</b>; S16/S18 Clean 4.100 → <b>+358</b>; S16/S18 Wet Polished 4.177 → <b>+435</b>.</p>
        <ul><li>Diff phản ánh: chất lượng so với chuẩn Class 1 của sàn, xuất xứ, cước và chi phí từ VN tới kho châu Âu, cung – cầu theo mùa vụ, thời gian giao hàng.</li>
        <li><b>Luôn nói kèm kỳ tham chiếu</b> ("+435 so với RMU26"). Khi kỳ cũ hết hạn, đổi sang kỳ mới mà giữ nguyên giá FOB: <b>diff mới = diff cũ + (giá kỳ cũ − giá kỳ mới)</b>.</li>
        <li>Hợp đồng trừ lùi (PTBF) chính là khóa diff trước, chốt giá sàn sau.</li>
        <li>Trên hệ thống: bảng 💎 Giá FOB theo chủng loại ở thẻ 🌐 Bảng giá tính sẵn FOB hôm nay = giá sàn + diff.</li></ul>` },
    { id: 'basis', cat: 'gia', title: 'Basis và rủi ro basis (rủi ro cơ sở)', tags: 'basis rui ro co so chenh lech hang that hang ao lai san lo hang that',
      sum: 'Giá hàng thật và giá sàn không chạy đều nhau – phòng hộ bằng futures vẫn còn phần chênh lệch đó.',
      body: `<p><b>Basis</b> = giá hàng thật − giá sàn (với cà phê, basis gần như chính là diff).</p>
        <p><b>Rủi ro basis:</b> giá hàng thật tăng 10 nhưng giá sàn chỉ tăng 7–8 (hoặc ngược lại). Vì vậy có lúc "<b>trên sàn có lời mà ra mua hàng thật vẫn lỗ</b>" – tiền lời trên sàn không đủ bù phần giá hàng thật tăng thêm.</p>
        <ul><li>Theo dõi lịch sử diff từng loại hàng để biết biên độ basis thường gặp.</li>
        <li>Lập bảng kịch bản cho hàng thật và hàng sàn <b>biến động khác nhau</b>, không giả định chạy đều.</li>
        <li>Xác định trước: công ty chấp nhận bù tối đa bao nhiêu USD/tấn basis – quy ngược về chi phí vận hành.</li>
        <li>Có thể dùng hợp đồng trừ lùi (khóa diff) hoặc quyền chọn để kiểm soát (theo trao đổi với chị Phương).</li></ul>` },
    { id: 'spread', cat: 'gia', title: 'Spread giữa các kỳ hạn: nghịch đảo và thuận', tags: 'spread inverted contango backwardation nghich dao dao ky chenh lech ky',
      sum: 'Spread = giá kỳ gần − giá kỳ xa. Dương = nghịch đảo (hàng giao ngay khan), âm = thuận (bình thường).',
      body: `<ul><li><b>Dương (Inverted / backwardation):</b> kỳ gần đắt hơn kỳ xa → hàng giao ngay đang khan. Giữ tồn kho qua kỳ sau bị thiệt; đảo lệnh bán (short) sang kỳ xa có lợi, đảo lệnh mua (long) bị mất.</li>
        <li><b>Âm (Contango):</b> kỳ xa cao hơn kỳ gần → thị trường dư hàng/bình thường. Có thể giữ hàng nếu chi phí lưu kho thấp hơn mức chênh.</li>
        <li>Spread là <b>chi phí đảo kỳ</b> (roll) cho lệnh phòng hộ và cho hợp đồng trừ lùi chưa chốt.</li>
        <li>Trên hệ thống: dải "SPREAD KỲ HẠN" ở thẻ 📊 Vị thế và nhận xét cấu trúc thị trường trong Trợ lý.</li></ul>` },
    { id: 'quy-doi-gia', cat: 'gia', title: 'Quy đổi giá: USD/tấn ↔ đ/kg, FOB ↔ giá tại kho', tags: 'quy doi dong kg usd tan ty gia fob kho noi dia tuong duong',
      sum: 'đ/kg = USD/tấn × tỷ giá ÷ 1000. Giá tại kho tương đương = FOB (đ/kg) − chi phí ra tới cảng.',
      body: `<ul><li><b>đ/kg = USD/tấn × tỷ giá ÷ 1.000.</b> Ví dụ 3.800 USD/tấn × 25.790 ÷ 1.000 = <b>98.002 đ/kg</b>.</li>
        <li><b>USD/tấn = đ/kg × 1.000 ÷ tỷ giá.</b> Ví dụ 94.000 đ/kg ÷ 25.790 × 1.000 ≈ 3.645 USD/tấn.</li>
        <li><b>Giá tương đương tại kho</b> = FOB (đ/kg) − chi phí chế biến, bao bì, hao hụt, vận chuyển ra cảng, thủ tục.</li>
        <li>So với giá nhân xô bình quân để biết <b>biên lời gộp</b> của việc mua nhân xô về chế biến xuất khẩu.</li>
        <li>Trên hệ thống: công cụ 🧮 Tính giá FOB từ trừ lùi (thẻ Vị thế) và cột "So nhân xô" ở bảng giá FOB theo chủng loại.</li></ul>` },
    { id: 'nhan-xo', cat: 'gia', title: 'Giá nhân xô nội địa và quan hệ với giá sàn', tags: 'nhan xo noi dia tay nguyen dak lak gia nong dan dai ly faq',
      sum: 'Giá cà phê nhân chưa phân loại mua từ nông dân/đại lý (đ/kg) – chạy theo London kèm cung cầu địa phương.',
      body: `<ul><li>Nhân xô là cà phê nhân chưa sàng, chưa phân loại (thường độ ẩm, tạp chất, đen vỡ cao hơn hàng xuất khẩu).</li>
        <li>Giá nhân xô bám giá London (quy đổi đ/kg) trừ đi chi phí chế biến – xuất khẩu, cộng/trừ theo tình hình nguồn hàng địa phương.</li>
        <li>Doanh nghiệp xuất khẩu mua nhân xô → sàng, phân loại, đánh bóng → bán R1/R2 FOB. Phần chênh <b>FOB (đ/kg) − nhân xô</b> phải đủ trả chi phí chế biến, <b>tỷ lệ thu hồi</b> (ví dụ S18 chỉ là một phần của lô nhân xô) và lời.</li>
        <li><b>Mức cộng từ nhân xô ra hàng thành phẩm</b> (giá tham chiếu công ty): S13 5% <b>+2.000</b> · S16/S18 2% <b>+4.000</b> · Clean G1 <b>+6.000</b> · Đánh bóng S16/S18 <b>+8.000 đ/kg</b>. Sửa được trong bảng 💎 Giá FOB theo chủng loại.</li>
        <li>Hệ thống lấy tự động giá trung bình Tây Nguyên và giá các tỉnh giacaphe.com công bố công khai (thẻ 🌐 Bảng giá), lưu theo ngày để tính trừ lùi.</li></ul>` },
    { id: 'ty-gia', cat: 'gia', title: 'Tỷ giá ảnh hưởng thế nào?', tags: 'ty gia usd vnd brl real vietcombank',
      sum: 'Bán bằng USD, mua bằng VNĐ: tỷ giá tác động trực tiếp tới giá nội địa và biên lời.',
      body: `<ul><li>USD tăng giá so với VNĐ → cùng giá USD/tấn, giá quy đổi đ/kg cao hơn (lợi cho người bán USD, giá nội địa có xu hướng tăng theo).</li>
        <li>Giữa lúc ký hợp đồng bán (USD) và lúc nhận tiền có rủi ro tỷ giá – hợp đồng lớn có thể cân nhắc bán kỳ hạn USD với ngân hàng.</li>
        <li>Đồng Real (Brazil) yếu thường khuyến khích nông dân Brazil bán hàng → gây áp lực lên giá cà phê thế giới.</li>
        <li>Hệ thống dùng tỷ giá Vietcombank (mua chuyển khoản), cập nhật 30 phút/lần.</li></ul>` },

    // ===================== CHẤT LƯỢNG =====================
    { id: 'chuan-ice', cat: 'chatluong', title: 'Chuẩn chất lượng sàn London (ICE): Class P, 1, 2, 3, 4', tags: 'chuan chat luong ice class hang loi tap chat sang 300g premium discount',
      sum: 'Giá sàn là giá hàng Class 1. Hàng tốt hơn được cộng, hàng kém hơn bị trừ khi giao lên sàn.',
      body: `<table><tr><th>Hạng</th><th>Lỗi tối đa</th><th>Tạp chất</th><th>Cỡ hạt (mẫu 300 g)</th><th>So với giá sàn</th></tr>
        <tr><td>Class P</td><td>0,5%</td><td>0,2%</td><td>≥ 90% trên sàng 15, ≥ 96% trên sàng 13</td><td>+30 USD/t</td></tr>
        <tr><td><b>Class 1</b></td><td>3,0%</td><td>0,5%</td><td>≥ 90% trên sàng 14, ≥ 96% trên sàng 12</td><td><b>Giá sàn</b></td></tr>
        <tr><td>Class 2</td><td>5,0%</td><td>1,0%</td><td>≥ 90% trên sàng 13, ≥ 96% trên sàng 12</td><td>−30 USD/t</td></tr>
        <tr><td>Class 3</td><td>7,5%</td><td>1,0%</td><td>≥ 90% trên sàng 13, ≥ 96% trên sàng 12</td><td>−60 USD/t</td></tr>
        <tr><td>Class 4</td><td>8,0%</td><td>1,0%</td><td>≥ 90% trên sàng 12</td><td>−90 USD/t</td></tr></table>
        <ul><li><b>Lỗi</b> = hạt đen, mảnh vỡ (nhỏ hơn ½ hạt), quả cà phê, hạt mốc. <b>Tạp chất</b> = cành, đá, đất, vỏ.</li>
        <li>Hàng giao lên sàn còn bị trừ nếu lưu kho lâu (tháng 13–48 sau giám định: 5 USD/tấn/tháng; từ tháng 49: 10 USD/tấn/tháng) và nếu là hàng chuyển tiếp chưa có hồ sơ EUDR (DDI) hợp lệ khi giao vào EU/Anh (kỳ năm 2027: 5 USD/tấn/tháng; từ 01/2028: 10 USD/tấn/tháng).</li>
        <li>Nguồn: ICE Futures Europe – Robusta Coffee Futures &amp; Options: Allowances &amp; Discounts (22/12/2025).</li></ul>` },
    { id: 'r1-r2-r3', cat: 'chatluong', title: 'Quy đổi R1, R2, R3 của Việt Nam sang hạng ICE', tags: 'r1 r2 r3 loai 1 loai 2 quy doi hang class grade 1 grade 2',
      sum: 'R1 sàng 16/18 đen vỡ 2% ≈ Class 1 (giá sàn); R2 sàng 13 đen vỡ 5% ≈ Class 2 (−30); đen vỡ cao hơn ≈ Class 3–4.',
      body: `<table><tr><th>Hàng Việt Nam (quy cách thường gặp)</th><th>Hạng ICE tương đương</th></tr>
        <tr><td><b>R1</b> sàng 16/18 – độ ẩm ≤ 12,5%, đen vỡ ≤ 2%, tạp chất ≤ 0,5% (Clean ≈ 0,1%), ≥ 90% trên sàng</td><td><b>Class 1</b> – giá sàn</td></tr>
        <tr><td><b>R2</b> sàng 13 – độ ẩm ≤ 13%, đen vỡ ≤ 5%, tạp chất ≤ 1%, ≥ 90% trên sàng 13</td><td><b>Class 2</b> – trừ 30 USD/t</td></tr>
        <tr><td><b>R3</b> / hàng đen vỡ 5–7,5%</td><td>Class 3 – trừ 60 USD/t</td></tr>
        <tr><td>Đen vỡ 7,5–8%</td><td>Class 4 – trừ 90 USD/t</td></tr>
        <tr><td>Đen vỡ trên 8%</td><td>Không giao được lên sàn</td></tr></table>
        <ul><li>Quy cách cụ thể luôn theo <b>hợp đồng và mẫu duyệt</b> của khách (và TCVN 4193 cho hàng trong nước) – bảng trên dùng để định vị nhanh.</li>
        <li>Mức cộng/trừ của sàn chỉ là mốc so chất lượng; giá FOB thực tế theo <b>diff thị trường</b> của từng loại (xem bài Diff).</li>
        <li>Trên hệ thống: cột "Hạng ICE" ở bảng giá FOB theo chủng loại và dòng 📏 khi ghi hợp đồng tự nhận diện hạng theo tên hàng.</li></ul>` },
    { id: 'san-vs-hang-that', cat: 'chatluong', title: 'Hàng giao dịch trên sàn London là loại nào? So với hàng thật Việt Nam', tags: 'san london class 1 hang that physical viet nam so sanh loai nao chat luong chuan',
      sum: 'Giá sàn London là giá hàng Class 1 (lỗi ≤ 3%, tạp chất ≤ 0,5%, ≥ 90% trên sàng 14) – nằm giữa R1 và R2 của Việt Nam.',
      body: `<table><tr><th>Hàng Việt Nam</th><th>Tương đương sàn</th></tr>
        <tr><td><b>R1 S16/S18</b> (đen vỡ ≤ 2%, tạp chất ≤ 0,5%)</td><td><b>Class 1</b> – ngang giá sàn (cỡ hạt còn lớn hơn mức sàn yêu cầu là sàng 14)</td></tr>
        <tr><td>R1 Clean / Wet Polished</td><td>Vẫn Class 1; chỉ lên Class P (+30) nếu lỗi ≤ 0,5% và tạp chất ≤ 0,2%</td></tr>
        <tr><td><b>R2 S13</b> (đen vỡ 5%, tạp chất 1%)</td><td><b>Class 2</b> – trừ 30 USD/t</td></tr>
        <tr><td>Đen vỡ 5–7,5% (R3)</td><td>Class 3 – trừ 60 USD/t</td></tr>
        <tr><td>Đen vỡ trên 8%</td><td>Không giao được lên sàn</td></tr></table>
        <ul><li>Mức +30/−30/−60/−90 của sàn <b>chỉ áp dụng khi giao hàng lên sàn</b> – dùng để so chất lượng, không dùng để định giá.</li>
        <li>Giá FOB thực tế = <b>giá sàn + diff thị trường</b> của từng loại. Ví dụ bảng báo giá 27/08/2026 (so với RMU26): R2 S13 5% <b>+166</b> (vẫn cao hơn giá sàn dù theo sàn bị trừ 30), S18 Wet Polished <b>+435</b>. Phần "hàng thật hơn giá sàn của hạng" chính là <b>basis</b>.</li>
        <li><b>Mức cộng nội địa theo loại</b> (giá hàng thành phẩm = nhân xô + mức cộng): S13 5% <b>+2.000</b> · S16/S18 2% <b>+4.000</b> · Clean G1 <b>+6.000</b> · Đánh bóng S16/S18 <b>+8.000 đ/kg</b>.</li>
        <li>Trên hệ thống: thẻ 🌐 Bảng giá → <b>📏 Theo dõi giá chuẩn Class 1</b> (giá theo hạng, hàng VN tương đương, FOB thị trường, báo động khi giá vượt mức) và bảng 💎 Giá FOB theo chủng loại (giá vốn nội địa, biên lời).</li></ul>` },
    { id: 'quy-cach', cat: 'chatluong', title: 'Đọc quy cách: S13/S16/S18, WP, Clean, đen vỡ, tạp chất, độ ẩm', tags: 'quy cach sang s13 s16 s18 wp wet polished danh bong clean den vo bb tap chat fm do am',
      sum: 'Sàng = cỡ lỗ tính theo 1/64 inch; WP = đánh bóng ướt; Clean = làm sạch; BB = đen vỡ; FM = tạp chất.',
      body: `<ul><li><b>Sàng (screen):</b> số đo lỗ sàng theo 1/64 inch – S13 ≈ 5,2 mm, S16 ≈ 6,4 mm, S18 ≈ 7,1 mm. "≥ 90% trên sàng 18" = 90% khối lượng hạt không lọt sàng 18.</li>
        <li><b>WP (Wet Polished – đánh bóng ướt):</b> hạt sạch bụi, sáng màu, đẹp hơn → giá cao nhất trong nhóm.</li>
        <li><b>Clean:</b> đã làm sạch, tạp chất rất thấp. <b>BB</b> (black &amp; broken) = % hạt đen + vỡ. <b>FM</b> (foreign matter) = % tạp chất.</li>
        <li><b>Độ ẩm</b> R1 thường ≤ 12,5% – ẩm cao dễ mốc, hao hụt trọng lượng.</li>
        <li>Thứ tự giá theo bảng báo giá công ty: S13 5% đen vỡ (+166) &lt; S16/18 2% đen vỡ (+262) &lt; Clean (+358) &lt; Wet Polished (+435).</li></ul>` },
    { id: 'giam-dinh', cat: 'chatluong', title: 'Giám định chất lượng, trọng lượng và khiếu nại', tags: 'giam dinh vinacontrol sgs cafecontrol mau duyet khieu nai claim trong luong',
      sum: 'Ghi rõ ai giám định, ở đâu, kết quả nào là cuối cùng – đây là chỗ hay phát sinh tranh chấp.',
      body: `<ul><li>Giám định độc lập tại cảng xếp (Vinacontrol, SGS, Cafecontrol…) cấp chứng thư chất lượng và trọng lượng.</li>
        <li><b>Chất lượng/trọng lượng cuối cùng tại cảng xếp</b> (final at loading) an toàn hơn cho người bán so với "cuối cùng tại cảng đến".</li>
        <li>Giữ <b>mẫu duyệt</b> (approved sample) và mẫu lưu từng lô; kiểm soát độ ẩm trước khi đóng cont; khử trùng (fumigation) theo yêu cầu.</li>
        <li>Hàng không đạt có thể bị trừ tiền (claim) hoặc từ chối – ghi rõ mức dung sai và cách xử lý trong hợp đồng.</li></ul>` },

    // ===================== HỢP ĐỒNG & CHỐT GIÁ =====================
    { id: 'outright-ptbf', cat: 'hopdong', title: 'Giá cố định (outright) và trừ lùi (PTBF) – hợp đồng "diff" khách châu Âu hay hỏi', tags: 'outright ptbf tru lui diff contract hop dong dip gia co dinh buyer call seller call',
      sum: 'Outright: chốt giá ngay. PTBF: khóa diff trước, giá cuối = giá sàn lúc chốt + diff.',
      body: `<table><tr><th></th><th>Giá cố định (outright)</th><th>Trừ lùi (PTBF / "diff contract")</th></tr>
        <tr><td>Giá</td><td>Cố định khi ký, ví dụ 3.800 USD/t FOB</td><td>= Giá kỳ hạn London lúc chốt + diff (ví dụ RMF27 +352)</td></tr>
        <tr><td>Khóa được</td><td>Toàn bộ giá</td><td>Chỉ diff; giá sàn chốt sau</td></tr>
        <tr><td>Rủi ro chính</td><td>Giá sàn biến động tới khi mua/bán đủ hàng đối ứng</td><td>Basis, hạn chốt, giá sàn của phần chưa chốt</td></tr>
        <tr><td>Ai chốt</td><td>—</td><td>Buyer's call (người mua chốt) hoặc seller's call (người bán chốt)</td></tr></table>
        <ul><li>Khách châu Âu hỏi "bán hợp đồng diff không" là hỏi hợp đồng trừ lùi: hai bên thỏa thuận diff theo chất lượng và kỳ tham chiếu; chốt giá theo lot trong giờ sàn trước hạn.</li>
        <li>Lộ trình gợi ý: làm vài lô outright với khách mới → khi đã nắm quy trình chốt giá và phòng hộ, nhận PTBF từ 1–2 lot.</li></ul>` },
    { id: 'chot-gia', cat: 'hopdong', title: 'Chốt giá (fixing) hợp đồng trừ lùi: quy trình và lưu ý', tags: 'chot gia fixing han chot fnd lot phan le chot tung phan',
      sum: 'Chốt theo lot 10 tấn, trong giờ sàn, trước hạn – giá cuối = giá kỳ tham chiếu lúc chốt + diff.',
      body: `<ol><li>Bên có quyền chốt gửi lệnh chốt (số lot, mức giá hoặc "giá thị trường") trong giờ giao dịch London.</li>
        <li>Giá cuối = <b>giá kỳ tham chiếu lúc chốt + diff</b>. Ví dụ chốt RMF27 3.400 + 352 = 3.752 USD/t.</li>
        <li><b>Hạn chốt</b> thường trước ngày thông báo đầu tiên của kỳ tham chiếu (ví dụ RMF27 ≈ 28/12/2026) – hợp đồng ghi rõ, có khi sớm hơn vài ngày.</li>
        <li><b>Phần lẻ</b>: 38,4 tấn = 3,84 lot – ghi rõ chốt 4 lot (dư 1,6 t tính theo giá bình quân) hay 3 lot + phần lẻ theo giá bình quân.</li>
        <li>Quá hạn chưa chốt: đảo sang kỳ sau (điều chỉnh diff theo spread) hoặc chốt bắt buộc theo điều khoản.</li></ol>
        <p>Trên hệ thống: thẻ 📒 Giao dịch → 🔒 Chốt giá từng phần; số tấn tự chuyển sang dòng "đã chốt giá"; Trợ lý nhắc khi còn ≤ 15 ngày tới hạn.</p>` },
    { id: 'checklist-hd', cat: 'hopdong', title: 'Checklist ký hợp đồng xuất khẩu cà phê', tags: 'checklist ky hop dong dieu khoan thanh toan lc cad chung tu bao bi ecc gca trong tai eudr',
      sum: 'Những điều khoản phải có trước khi ký – tránh tranh chấp và rủi ro không lường.',
      body: `<ul><li><b>Hàng hóa:</b> loại, sàng, độ ẩm, đen vỡ, tạp chất, mẫu duyệt.</li>
        <li><b>Số lượng:</b> tấn, dung sai, cách tính trọng lượng. <b>Bao bì:</b> bao đay 60 kg (320 bao/cont 20' = 19,2 t) hoặc hàng xá.</li>
        <li><b>Giá:</b> outright, hoặc PTBF (kỳ tham chiếu, diff, ai chốt, hạn chốt, chốt theo lot, xử lý phần lẻ).</li>
        <li><b>Giao hàng:</b> tháng giao, cảng xếp, điều kiện (FOB/CFR/CIF), ai thuê tàu.</li>
        <li><b>Thanh toán:</b> CAD/LC trả ngay an toàn hơn trả chậm; khách mới nên LC hoặc đặt cọc.</li>
        <li><b>Giám định:</b> đơn vị, nơi giám định, kết quả cuối cùng. <b>Chứng từ:</b> B/L, hóa đơn, phiếu đóng gói, C/O, kiểm dịch thực vật, khử trùng, chứng thư chất lượng/trọng lượng, chứng nhận xuất xứ ICO.</li>
        <li><b>Điều khoản chung:</b> mẫu hợp đồng ECC (châu Âu) hoặc GCA (Mỹ), trọng tài, bất khả kháng, chậm giao, vi phạm/washout.</li>
        <li><b>Hàng vào EU:</b> hồ sơ thẩm định không phá rừng (EUDR – truy xuất vùng trồng); kiểm tra thời điểm áp dụng mới nhất với khách.</li></ul>` },
    { id: 'case-38-4', cat: 'hopdong', title: 'Tình huống: ký 38,4 tấn R1 S18 WP giá 3.800 USD/t FOB, giao xa', tags: 'tinh huong 38.4 tan s18 wp 3800 fob giao xa ky sao chot sao vi du',
      sum: 'Quy đổi, so với bảng diff, chọn outright hay trừ lùi, cách phòng hộ và điều cần ghi trong hợp đồng.',
      body: `<p><b>Số liệu ví dụ ngày 03/10/2026</b> (Trợ lý tự tính lại theo giá trực tiếp): RMF27 3.448 USD/t, tỷ giá 25.790, nhân xô TB 94.000 đ/kg.</p>
        <ol><li><b>Quy đổi:</b> 38,4 t = 2 cont 20' = 3,84 lot London. Giá trị 38,4 × 3.800 = 145.920 USD.</li>
        <li><b>Diff ngầm:</b> 3.800 − 3.448 = <b>+352</b> so với RMF27. Bảng diff công ty cho S18 WP là <b>+435</b> → giá 3.800 <b>thấp hơn mặt bằng khoảng 83 USD/t</b> (~3.190 USD cả lô). Nên đàm phán lên hoặc có lý do (khách lớn, thanh toán tốt…).</li>
        <li><b>So nội địa:</b> 3.800 USD/t ≈ 98.000 đ/kg; nhân xô 94.000 → chênh ~4.000 đ/kg trước chi phí chế biến S18 WP và tỷ lệ thu hồi – cần tính kỹ giá vốn S18 WP thực tế.</li>
        <li><b>Chọn kiểu giá:</b>
          <ul><li><b>Outright 3.800</b>: nếu chưa có hàng → công ty SHORT 38,4 t; London +100 → lỗ 3.840 USD. Phòng hộ: <b>MUA 4 lot RMF27</b> ngay khi ký, bán lại khi đã mua đủ hàng. Nếu đã có hàng trong kho (đang hedge bán) → mua lại 4 lot để gỡ hedge.</li>
          <li><b>Trừ lùi RMF27 +352</b> (nên đòi gần +435): khóa diff, chốt giá sàn sau – ghi hạn chốt (trước ~28/12/2026), chốt theo lot, phần lẻ 0,84 lot.</li></ul></li>
        <li><b>Hợp đồng ghi rõ:</b> R1 S18 WP (ẩm ≤ 12,5%, đen vỡ ≤ 2%, tạp chất theo mẫu, ≥ 90% trên sàng 18), 320 bao 60 kg/cont, tháng giao, FOB TP.HCM, thanh toán, giám định cuối cùng tại cảng xếp.</li>
        <li><b>Ghi vào hệ thống:</b> 📒 Giao dịch → ➕ Hợp đồng mới (tự so bảng diff, tự báo hạn chốt) → 🛡️ Hedge để ghi lệnh sàn liên kết.</li></ol>` },
    { id: 'cong-thuc-tru-lui', cat: 'hopdong', title: 'Công thức tính trừ lùi từ giá nhân xô theo ngày', tags: 'cong thuc tinh tru lui cong lui nhan xo theo ngay diff hoa von chao gia muc cong',
      sum: 'Lấy giá nhân xô hôm nay làm gốc → cộng mức của loại hàng, chi phí, lời → ra diff hòa vốn và diff cần chào so với giá sàn.',
      body: `<ol><li><b>Giá hàng tại kho</b> = nhân xô hôm nay + mức cộng của loại (S13 5% +2.000 · S16/18 2% +4.000 · Clean G1 +6.000 · Đánh bóng +8.000 đ/kg).</li>
        <li><b>Giá vốn FOB</b> = giá hàng tại kho + chi phí xuất khẩu (bao bì, vận chuyển ra cảng, thủ tục). Đổi sang USD/t = đ/kg × 1000 ÷ tỷ giá.</li>
        <li><b>Diff hòa vốn</b> = giá vốn FOB (USD/t) − giá sàn kỳ tham chiếu.</li>
        <li><b>Diff cần chào</b> = (giá vốn FOB + lời mong muốn) (USD/t) − giá sàn.</li>
        <li><b>Trừ lùi nội địa</b> = nhân xô (USD/t) − giá sàn: dương nghĩa là giá trong nước đang cao hơn giá sàn quy đổi.</li>
        <li>Chiều ngược lại – có diff khách trả: <b>FOB = giá sàn + diff</b>; <b>nhân xô tối đa được mua</b> = FOB (đ/kg) − chi phí − mức cộng − lời.</li></ol>
        <p><b>Ví dụ</b> (nhân xô 94.000, tỷ giá 25.790, RMK27 3.412, chi phí 700, lời 500, hàng đánh bóng +8.000): giá vốn FOB 102.700 đ/kg = 3.982 USD/t → diff hòa vốn <b>+570</b>; diff cần chào <b>+590</b>. Bảng diff công ty chỉ +435 → chưa đủ hòa vốn; với diff +435, nhân xô tối đa được mua ≈ 90.014 đ/kg (thấp hơn giá hôm nay ~4.000).</p>
        <p>Trên hệ thống: thẻ 📊 Vị thế → <b>🧮 Tính giá trừ lùi – linh hoạt</b> (tự lấy nhân xô theo ngày, chọn loại hàng, bảng theo ngày).</p>` },
    { id: 'roll', cat: 'hopdong', title: 'Đảo kỳ hạn (roll) cho lệnh sàn và hợp đồng chưa chốt', tags: 'dao ky roll gia han fnd chuyen ky spread',
      sum: 'Trước ngày thông báo đầu tiên: đóng lệnh kỳ gần, mở kỳ xa – chi phí bằng spread.',
      body: `<ul><li>Lệnh phòng hộ ở kỳ sắp tới hạn phải <b>đóng trước ngày thông báo đầu tiên</b> và mở lại ở kỳ sau nếu vẫn cần phòng hộ.</li>
        <li>Chi phí/lợi ích đảo kỳ = spread giữa hai kỳ (xem bài Spread).</li>
        <li>Hợp đồng trừ lùi chưa chốt kịp: thỏa thuận chuyển kỳ tham chiếu, diff điều chỉnh theo spread lúc chuyển.</li>
        <li>Trên hệ thống: hợp đồng/lệnh ở kỳ đã qua được cảnh báo vàng và tạm tính vào kỳ đầu ma trận; ma trận có nút 🔁 Chuyển kỳ hạn khi kỳ đầu vào tháng giao.</li></ul>` },

    // ===================== PHÒNG HỘ & SÀN =====================
    { id: 'hedge-co-ban', cat: 'phongho', title: 'Phòng hộ (hedge) là gì – vì sao doanh nghiệp xuất khẩu cần', tags: 'phong ho hedge bao hiem gia futures short hedge long hedge khoa loi',
      sum: 'Dùng lệnh sàn ngược chiều với hàng thật để khóa biên lời – công cụ bảo hiểm, không phải để đánh cược.',
      body: `<ul><li>Công ty <b>dư hàng</b> (tồn kho, mua giá cố định chưa bán) → sợ giá giảm → <b>BÁN</b> lệnh sàn (short hedge).</li>
        <li>Công ty <b>thiếu hàng</b> (đã bán giá cố định chưa mua đủ) → sợ giá tăng → <b>MUA</b> lệnh sàn (long hedge).</li>
        <li>Giá đi đâu thì lãi bên này bù lỗ bên kia → giữ được biên lời đã tính khi ký (trừ phần basis).</li>
        <li>Cỡ lệnh ≈ vị thế ròng của kỳ ÷ 10 tấn/lot; dùng đúng kỳ tham chiếu của hợp đồng.</li>
        <li>Mua hàng outright và để đó mà không phòng hộ thì nhà máy không chịu nổi biến động khi quy mô lớn – đây là lý do các kho lớn đều dùng futures.</li></ul>` },
    { id: 'khi-nao-mua-ban', cat: 'phongho', title: 'Khi nào đặt lệnh MUA, khi nào BÁN trên sàn?', tags: 'khi nao mua ban dat lenh long short go hedge dong lenh',
      sum: 'Theo vị thế ròng từng kỳ: âm thì MUA, dương thì BÁN – đưa về gần 0 trong hạn mức.',
      body: `<table><tr><th>Tình huống</th><th>Lệnh sàn</th></tr>
        <tr><td>Ký bán giá cố định, chưa có hàng</td><td><b>MUA</b> số lot tương ứng; bán lại khi mua đủ hàng</td></tr>
        <tr><td>Mua hàng giá cố định, chưa có đầu ra</td><td><b>BÁN</b>; mua lại khi đã bán được hàng</td></tr>
        <tr><td>Bán hàng từ kho đang được hedge bán</td><td><b>MUA lại</b> (gỡ hedge)</td></tr>
        <tr><td>Đã mua đủ hàng cho hợp đồng đang hedge mua</td><td><b>BÁN</b> (gỡ hedge)</td></tr></table>
        <p>Quy tắc chung: nhìn dòng ⭐ <b>Tổng vị thế ròng</b> từng kỳ ở thẻ Vị thế – kỳ nào vượt hạn mức thì hệ thống gợi ý MUA/BÁN bao nhiêu lot. Nút 🛡️ Hedge trên từng hợp đồng tự đề xuất lệnh ngược chiều phần còn hở.</p>` },
    { id: 'ky-quy', cat: 'phongho', title: 'Ký quỹ, gọi ký quỹ (margin call) và quỹ dự phòng', tags: 'ky quy margin call goi ky quy quy du phong thanh khoan tien',
      sum: 'Mỗi lot phải đặt cọc; giá đi ngược phải nộp thêm ngay – thiếu tiền là bị đóng lệnh dù hàng thật đang có lời.',
      body: `<ul><li><b>Ký quỹ ban đầu</b> cho mỗi lot do sàn/môi giới quy định và thay đổi theo mức biến động.</li>
        <li>Lãi/lỗ được tính hằng ngày; lỗ vượt mức duy trì → <b>gọi ký quỹ</b>, phải nộp thêm trong thời hạn ngắn.</li>
        <li>Lệnh phòng hộ có thể lỗ trên sàn trong khi hàng thật lời – nhưng <b>tiền lỗ sàn phải trả ngay</b>, tiền lời hàng thật về sau → rủi ro thanh khoản.</li>
        <li>Giữ <b>quỹ dự phòng</b> đủ chịu giá chạy ngược vài trăm USD/tấn trên toàn bộ số lot đang mở (trong buổi trao đổi có nhắc mức tham khảo 10–20% giá trị).</li></ul>` },
    { id: 'quyen-chon', cat: 'phongho', title: 'Quyền chọn: Put, Call, Collar – khi nào dùng', tags: 'quyen chon option put call collar strike phi premium',
      sum: 'Put tạo giá sàn, Call tạo giá trần, Collar giới hạn trong một vùng – trả phí thay vì ký quỹ theo giá.',
      body: `<ul><li><b>Mua Put</b> (quyền bán) ở giá thực hiện K: giá giảm dưới K thì được bù; giá tăng vẫn hưởng. Mất phí quyền chọn.</li>
        <li><b>Mua Call</b> (quyền mua): bảo vệ khi đã bán giá cố định mà sợ giá tăng.</li>
        <li><b>Collar</b> = mua Put + bán Call: rẻ hơn (phí bán Call bù phí mua Put) nhưng bị giới hạn lời phía trên.</li>
        <li>Phù hợp khi muốn bảo vệ nhưng vẫn giữ cơ hội, hoặc không muốn chịu gọi ký quỹ.</li>
        <li>Trên hệ thống: thẻ 🛡️ Phòng hộ so sánh 4 chiến lược (Futures, Put, Collar, Hybrid) theo 5 kịch bản giá.</li></ul>` },
    { id: 'mtm', cat: 'phongho', title: 'Lãi/lỗ tạm tính (MTM) và lãi/lỗ đã chốt', tags: 'mtm lai lo tam tinh da chot gia von binh quan',
      sum: 'Lệnh đang mở tính theo giá hiện tại; khi đóng lệnh mới thành lãi/lỗ thật.',
      body: `<ul><li><b>Lãi/lỗ tạm tính</b> = (giá hiện tại − giá khớp) × số lot × 10 (lệnh MUA); ngược dấu với lệnh BÁN.</li>
        <li><b>Đã chốt</b>: phần lệnh đã đóng – tính theo giá vốn bình quân của các lệnh mở cùng kỳ.</li>
        <li>Đánh giá phòng hộ phải nhìn <b>tổng hàng thật + hàng ảo</b>: sàn lỗ mà hàng thật lời tương ứng là phòng hộ đang làm đúng việc.</li>
        <li>Trên hệ thống: phần 📉 Hàng ảo ở thẻ Giao dịch hiện giá vốn bình quân, lãi/lỗ mở và đã chốt từng kỳ.</li></ul>` },
    { id: 'cot', cat: 'phongho', title: 'Theo dõi nhà đầu cơ: báo cáo COT', tags: 'cot commitments of traders quy dau co managed money producer merchant ice',
      sum: 'Báo cáo hằng tuần cho biết quỹ, nhà sản xuất – thương nhân đang mua ròng hay bán ròng bao nhiêu.',
      body: `<ul><li>ICE công bố hằng tuần báo cáo <b>Commitments of Traders</b> cho Robusta: nhóm Producer/Merchant (doanh nghiệp hàng thật), Swap dealers, <b>Managed Money</b> (quỹ đầu cơ), Other reportables.</li>
        <li>Quỹ mua ròng rất lớn → giá dễ điều chỉnh mạnh khi họ chốt lời; quỹ bán ròng lớn → dễ bật tăng khi họ mua lại.</li>
        <li>Chỉ dùng làm <b>bối cảnh</b> để chọn thời điểm phòng hộ, không phải tín hiệu mua bán – công ty không đầu cơ.</li></ul>` },
    { id: 'ton-kho-ice', cat: 'phongho', title: 'Tồn kho được chứng nhận trên sàn (certified stocks)', tags: 'ton kho ice certified stocks kho san',
      sum: 'Lượng Robusta đạt chuẩn đang nằm trong kho của sàn – giảm mạnh là dấu hiệu hàng giao ngay khan.',
      body: `<ul><li>ICE công bố hằng ngày lượng Robusta đã giám định đạt chuẩn trong các kho của sàn.</li>
        <li>Tồn kho giảm liên tục → nguồn hàng giao được khan → hỗ trợ kỳ gần, spread dễ nghịch đảo.</li>
        <li>Tồn kho tăng → hàng dồi dào → áp lực lên kỳ gần, spread dễ về thuận (contango).</li></ul>` },
    { id: 'mxv', cat: 'phongho', title: 'Giao dịch qua Sở Giao dịch Hàng hóa Việt Nam (MXV)', tags: 'mxv so giao dich hang hoa tai khoan moi gioi broker lrc kce',
      sum: 'Doanh nghiệp Việt Nam đặt lệnh sàn London/New York qua thành viên kinh doanh của MXV.',
      body: `<ul><li>Mở tài khoản giao dịch qua một thành viên kinh doanh của MXV (môi giới), nộp ký quỹ, đặt lệnh liên thông sang ICE.</li>
        <li>Mã trên MXV: <b>LRC</b> = Robusta London, <b>KCE</b> = Arabica New York (ví dụ LRCF27).</li>
        <li>Hỏi rõ: phí giao dịch mỗi lot, mức ký quỹ, cách gọi ký quỹ, giờ đặt lệnh, báo cáo hằng ngày.</li>
        <li>Trên hệ thống: ghi từng lệnh ở phần 📉 Hàng ảo (thẻ Giao dịch); ô "Tài khoản / môi giới" ghi tự do nếu công ty có nhiều tài khoản.</li></ul>` },

    // ===================== QUẢN TRỊ VỊ THẾ =====================
    { id: 'vi-the-rong', cat: 'vithe', title: 'Vị thế ròng (net position) đọc thế nào?', tags: 'vi the rong net position long short square tong vi the',
      sum: 'Tổng hàng thực + sàn + trừ lùi của từng kỳ: âm là đang thiếu hàng (sợ giá tăng), dương là dư hàng (sợ giá giảm).',
      body: `<ul><li><b>Tổng vị thế ròng = Hàng thực + Tài khoản sàn + Trừ lùi</b>, tính cho từng kỳ hạn.</li>
        <li><b>Âm (SHORT):</b> đã bán nhiều hơn hàng đang có/đã mua → giá tăng thì lỗ.</li>
        <li><b>Dương (LONG):</b> hàng chưa bán/chưa chốt → giá giảm thì lỗ.</li>
        <li>Độ nhạy: vị thế ròng × bước giá. Ví dụ −98 t × 30 USD = −2.943 USD nếu London tăng 30.</li>
        <li>Mục tiêu: giữ mỗi kỳ trong hạn mức, phần vượt thì phòng hộ.</li></ul>` },
    { id: 'han-muc', cat: 'vithe', title: 'Hạn mức rủi ro và lệch kỳ hạn', tags: 'han muc rui ro lech ky han mismatch 200 tan',
      sum: 'Mỗi kỳ chỉ được hở tối đa một số tấn (mặc định 200 t); kỳ dư – kỳ hụt cùng lúc là rủi ro spread.',
      body: `<ul><li>Hạn mức = số tấn tối đa công ty chấp nhận để hở mà không phòng hộ ở mỗi kỳ (chỉnh ở thẻ Vị thế).</li>
        <li>Vượt hạn mức → hệ thống gợi ý số lot = |vị thế| ÷ 10, chiều MUA nếu âm, BÁN nếu dương.</li>
        <li><b>Lệch kỳ hạn:</b> kỳ này dư, kỳ kia hụt – tổng có thể gần 0 nhưng khi spread dãn vẫn lỗ. Xử lý bằng giao dịch spread (bán kỳ dư/mua kỳ hụt) hoặc điều chỉnh lịch giao hàng.</li>
        <li>Ban lãnh đạo nên duyệt hạn mức theo năng lực tài chính và khẩu vị rủi ro, rà soát 3–6 tháng/lần.</li></ul>` },
    { id: 'hang-that-ao', cat: 'vithe', title: 'Hàng thật và hàng ảo: quản lý và liên kết trên hệ thống', tags: 'hang that hang ao so hop dong lenh san lien ket con ho giao dich',
      sum: 'Hàng thật = hợp đồng mua/bán; hàng ảo = lệnh sàn. Liên kết hai bên để biết hợp đồng nào đã được bảo hiểm.',
      body: `<ul><li><b>📒 Hàng thật</b>: mỗi hợp đồng ghi loại hàng, số tấn, giá cố định/trừ lùi, kỳ tham chiếu, tháng giao; chốt giá và giao hàng từng phần → tự đổ vào 6 dòng hợp đồng của ma trận.</li>
        <li><b>📉 Hàng ảo</b>: mỗi lệnh MUA/BÁN lot ở kỳ hạn (ghi tên tài khoản/môi giới nếu cần) → tự đổ vào dòng "Vị thế futures Robusta London".</li>
        <li><b>Liên kết</b>: lệnh sàn gắn với hợp đồng → hợp đồng hiện "🔗 hàng ảo +4 lot → còn hở +1,6 t".</li>
        <li>Thứ tự làm việc: ghi hợp đồng ngay khi ký → 🛡️ Hedge nếu cần → 🔒 Chốt giá khi chốt → 🚚 Giao khi xuất hàng → cập nhật tồn kho.</li></ul>` },
    { id: 'quy-trinh', cat: 'vithe', title: 'Quy trình hằng ngày – tuần – quý', tags: 'quy trinh hang ngay hang tuan dinh ky review ra soat',
      sum: 'Nhịp làm việc gợi ý để vị thế luôn đúng và không bỏ sót hạn chốt, hạn giao.',
      body: `<ul><li><b>Hằng ngày:</b> xem giá sàn, spread, giá nhân xô; ghi hợp đồng/lệnh mới; cập nhật tồn kho; đọc lời khuyên của Trợ lý; xử lý cảnh báo.</li>
        <li><b>Hằng tuần:</b> báo cáo COT, tồn kho sàn, thời tiết Tây Nguyên/Brazil; rà hợp đồng sắp tới hạn chốt, sắp giao.</li>
        <li><b>Hằng tháng:</b> lịch ngày thông báo đầu tiên, kế hoạch đảo kỳ; đối chiếu sổ với kế toán và môi giới.</li>
        <li><b>3–6 tháng:</b> rà soát lại mô hình quản trị rủi ro, hạn mức, quy trình – nhân viên được góp ý từ dưới lên.</li></ul>` },
    { id: 'kich-ban', cat: 'vithe', title: 'Lập kịch bản giá kết hợp hàng thật và hàng ảo', tags: 'kich ban scenario excel len xuong chi phi hang that hang online',
      sum: 'Mỗi phương án phải tính cả chi phí hàng thật, không chỉ chi phí lệnh sàn.',
      body: `<ol><li>Đầu vào: giá mua hàng thật, giá bán, chi phí chế biến – bao bì – vận chuyển – tài chính, phí môi giới, ký quỹ.</li>
        <li>Kịch bản giá sàn: giảm mạnh, giảm vừa, đi ngang, tăng vừa, tăng mạnh.</li>
        <li>Cho hàng thật biến động <b>khác</b> sàn (rủi ro basis): ví dụ sàn +10%, hàng thật +12%.</li>
        <li>So từng chiến lược: không phòng hộ, futures, put, collar, hybrid → lãi/lỗ và nhu cầu tiền.</li>
        <li>Chọn phương án theo khẩu vị rủi ro và quan hệ khách (khách mới có thể chấp nhận lời thấp để mở quan hệ).</li></ol>
        <p>Thẻ 🛡️ Phòng hộ của hệ thống đã có mô hình 4 chiến lược × 5 kịch bản; bảng kết hợp chi phí hàng thật sẽ được bổ sung tiếp.</p>` },
    { id: 'gia-lap', cat: 'vithe', title: 'Tập dượt trước khi giao dịch thật (giả lập)', tags: 'gia lap tap duot paper trading thu nghiem 1 lot giai doan 1',
      sum: 'Chạy thử với 1–2 lot, ghi chép đầy đủ, rút kinh nghiệm trước khi nhận hợp đồng lớn.',
      body: `<ul><li>Giai đoạn 1: chọn đối tác quen, hợp đồng 1–2 lot (10–20 tấn); ghi đủ hợp đồng và lệnh sàn vào hệ thống để thấy dòng tiền và vị thế thay đổi ra sao.</li>
        <li>Có thể ghi "lệnh giả lập" (ghi chú rõ "giả lập") để tập chọn thời điểm, sau đó xóa.</li>
        <li>Sau mỗi lô: so kế hoạch và thực tế (giá, basis, chi phí, thời gian chốt), ghi bài học.</li>
        <li>Chỉ tăng quy mô khi quy trình chốt giá – phòng hộ – thanh toán đã chạy trơn tru.</li></ul>` },

    // ===================== PHÂN TÍCH THỊ TRƯỜNG =====================
    { id: 'yeu-to-gia', cat: 'thitruong', title: 'Các yếu tố tác động giá cà phê', tags: 'yeu to tac dong gia cung cau thoi tiet ton kho ty gia quy dia chinh tri',
      sum: 'Cung (mùa vụ, thời tiết), cầu, tồn kho, tỷ giá, dòng tiền đầu cơ, logistics và chính sách.',
      body: `<ul><li><b>Cung:</b> sản lượng Việt Nam, Brazil (Conilon), Indonesia, Uganda; thời tiết (khô hạn, mưa trái mùa, sương giá Brazil).</li>
        <li><b>Cầu:</b> tiêu thụ, tỷ lệ Robusta trong phối trộn của nhà rang, hàng hòa tan.</li>
        <li><b>Tồn kho:</b> tồn kho sàn ICE, tồn kho tại nước sản xuất và nước tiêu thụ.</li>
        <li><b>Tỷ giá:</b> USD, Real Brazil, VNĐ. <b>Dòng tiền đầu cơ:</b> báo cáo COT.</li>
        <li><b>Logistics &amp; chính sách:</b> cước tàu, tuyến vận tải, quy định EUDR, thuế quan.</li></ul>` },
    { id: 'mua-vu', cat: 'thitruong', title: 'Lịch mùa vụ cà phê Việt Nam và Brazil', tags: 'mua vu thu hoach ra hoa nien vu brazil viet nam tet',
      sum: 'Việt Nam thu hoạch cuối năm, Brazil giữa năm – áp lực bán hàng và rủi ro thời tiết theo từng mùa.',
      body: `<ul><li><b>Việt Nam (Robusta):</b> niên vụ tháng 10 – tháng 9; thu hoạch khoảng tháng 10/11 – tháng 1 (rộ tháng 11–12); bán ra nhiều sau thu hoạch và trước Tết; ra hoa khoảng tháng 1–3 (cần tưới, sau đó cần mưa đúng lúc); mùa mưa khoảng tháng 5–10.</li>
        <li><b>Brazil:</b> thu hoạch khoảng tháng 4/5 – tháng 9 (Conilon/Robusta sớm hơn Arabica); rủi ro sương giá tháng 6–8; ra hoa sau những cơn mưa tháng 9–10.</li>
        <li>Các mốc này giúp đoán áp lực cung và thời điểm thị trường nhạy cảm với tin thời tiết.</li></ul>` },
    { id: 'luong-mua', cat: 'thitruong', title: 'Lượng mưa Tây Nguyên và mùa hoa', tags: 'luong mua tay nguyen ra hoa dau qua thoi tiet du bao san luong',
      sum: 'Mưa nhiều chưa chắc tốt: mưa đúng lúc ra hoa làm hỏng đậu quả → sản lượng giảm.',
      body: `<ul><li>Ví dụ của chị Phương: năm mưa nhiều hơn trung bình 5–10 năm tưởng là tốt (đỡ tưới), nhưng nếu mưa rơi vào <b>giai đoạn ra hoa</b> thì hoa không đậu quả → cuối năm sản lượng giảm → hỗ trợ giá.</li>
        <li>Cách theo dõi: so lượng mưa từng tháng với trung bình nhiều năm và với lịch sinh trưởng của cây.</li>
        <li>Nguồn: Trung tâm Dự báo Khí tượng Thủy văn quốc gia, đài khí tượng các tỉnh Tây Nguyên, tin hiện trường từ đại lý.</li></ul>` },
    { id: 'nguon-du-lieu', cat: 'thitruong', title: 'Nguồn dữ liệu nên theo dõi', tags: 'nguon du lieu bao cao hai quan ico usda vicofa giacaphe ice',
      sum: 'Giá, tồn kho, xuất khẩu, báo cáo cung cầu, thời tiết – nguồn công khai đáng tin.',
      body: `<ul><li><b>Giá:</b> giacaphe.com (sàn và nội địa – nguồn của hệ thống), MXV, ICE.</li>
        <li><b>Sàn ICE:</b> quy cách hợp đồng, tồn kho được chứng nhận, báo cáo COT.</li>
        <li><b>Xuất khẩu:</b> số liệu hải quan Việt Nam; VICOFA (Hiệp hội Cà phê – Ca cao Việt Nam).</li>
        <li><b>Cung cầu thế giới:</b> báo cáo tháng của ICO, báo cáo cà phê 6 tháng của USDA.</li>
        <li><b>Chính sách – thị trường trong nước:</b> bản tin thị trường của viện nghiên cứu chính sách thuộc Bộ Nông nghiệp (theo gợi ý của chị Phương).</li>
        <li><b>Thời tiết:</b> Khí tượng Thủy văn quốc gia (Tây Nguyên), tin thời tiết Brazil.</li></ul>` },

    // ===================== TƯ VẤN & NGUYÊN TẮC =====================
    { id: '3-nguyen-tac', cat: 'tuvan', title: '3 nguyên tắc quản trị rủi ro giá (gợi ý của chị Phương)', tags: 'nguyen tac khong dau co phan loai khach ky luat con nguoi cat lo',
      sum: '(1) Không đầu cơ; (2) phân loại khách theo mức rủi ro chấp nhận; (3) kỷ luật nội bộ – và con người là quan trọng nhất.',
      body: `<ol><li><b>Không đầu cơ:</b> futures chỉ là công cụ để kinh doanh hàng thật ổn định, không phải để đoán lên xuống kiếm lời.</li>
        <li><b>Phân loại khách hàng</b> theo mức rủi ro công ty chấp nhận (khách quen/khách mới, điều kiện thanh toán, loại hợp đồng).</li>
        <li><b>Kỷ luật nội bộ:</b> hạn mức, quy trình duyệt lệnh, cắt lỗ đúng quy định.</li></ol>
        <ul><li><b>Con người là yếu tố quan trọng nhất</b> – mô hình tốt đến đâu cũng vô nghĩa nếu người làm không hiểu và không tự giác.</li>
        <li>Mỗi thành viên cần hiểu <b>toàn bộ luồng kinh doanh</b>, không chỉ phần việc của mình; xây mô hình từ dưới lên, rà soát 3–6 tháng/lần.</li>
        <li>Rào cản tâm lý lớn nhất: <b>không dám cắt lỗ</b>, sa lầy vào vị thế lỗ kéo dài.</li></ul>` },
    { id: 'lo-trinh', cat: 'tuvan', title: 'Lộ trình 3 giai đoạn của Việt Thiên', tags: 'lo trinh giai doan 1 2 3 ke hoach chuyen gia co van',
      sum: 'Học nền và chạy thử 1–2 lot → ký hợp đồng futures với khách, dùng futures bảo hiểm → có chuyên gia thực chiến, phòng chuyên trách.',
      body: `<ol><li><b>Giai đoạn 1 – Kiến thức nền:</b> khái niệm cơ bản (basis, diff, options, mã kỳ hạn, đọc biểu đồ); chạy thử 1–2 lot với đối tác quen. Hệ thống: thư viện Kiến thức, sổ hợp đồng và lệnh sàn.</li>
        <li><b>Giai đoạn 2 – Áp dụng thực tế:</b> ký hợp đồng trừ lùi/futures với khách, dùng futures bảo hiểm cho hàng thật; kết nối cố vấn khi cần. Hệ thống: hedge liên kết, cảnh báo hạn chốt, kịch bản giá.</li>
        <li><b>Giai đoạn 3 – Chuyên gia thực chiến:</b> hợp đồng hàng nghìn tấn, phòng chuyên trách cùng kế toán, tài khoản sở giao dịch; cố vấn xử lý tình huống ngoài lý thuyết.</li></ol>` },
    { id: 'cat-lo', cat: 'tuvan', title: 'Tâm lý cắt lỗ và kỷ luật', tags: 'cat lo tam ly ky luat lo keo dai dung lo',
      sum: 'Đặt giới hạn trước khi vào lệnh; đánh giá phòng hộ theo tổng hàng thật + hàng ảo.',
      body: `<ul><li>Quy định trước: phần hở không phòng hộ được lỗ tối đa bao nhiêu thì phải đóng/phòng hộ.</li>
        <li>Không "gồng lỗ" hay mua thêm để bình quân giá cho vị thế không có hàng thật đối ứng.</li>
        <li>Lệnh phòng hộ lỗ trong khi hàng thật lời là bình thường – đừng đóng phòng hộ chỉ vì thấy lỗ trên sàn.</li>
        <li>Ghi lý do mỗi quyết định để rút kinh nghiệm, không đổ lỗi.</li></ul>` },
    { id: 'phan-loai-khach', cat: 'tuvan', title: 'Phân loại khách hàng theo rủi ro', tags: 'phan loai khach hang khach moi khach quen thanh toan han muc tin dung',
      sum: 'Khách mới: lô nhỏ, thanh toán chắc chắn, outright trước; khách quen: có thể trừ lùi, khối lượng lớn hơn.',
      body: `<table><tr><th>Nhóm</th><th>Gợi ý điều kiện</th></tr>
        <tr><td>Khách mới</td><td>1–2 cont, LC hoặc CAD có đặt cọc, mẫu duyệt rõ, ưu tiên giá cố định</td></tr>
        <tr><td>Khách quen, thanh toán tốt</td><td>Trừ lùi theo lot, khối lượng lớn hơn, linh hoạt tháng giao</td></tr>
        <tr><td>Khách chiến lược</td><td>Có thể chấp nhận biên lời thấp để giữ quan hệ, nhưng vẫn trong hạn mức rủi ro</td></tr></table>
        <p>Đặt hạn mức theo từng khách (tấn đang mở, công nợ) và xem lại sau mỗi hợp đồng.</p>` },
    { id: 'bao-cao-sep', cat: 'tuvan', title: 'Báo cáo cho sếp: 5 câu hỏi mỗi ngày', tags: 'bao cao sep tong quan cau hoi moi ngay',
      sum: 'Vị thế ròng, lãi/lỗ khi giá chạy, hạn chốt – hạn giao, phần còn hở, biến động giá và tin chính.',
      body: `<ol><li>Mỗi kỳ hạn công ty đang dư hay thiếu bao nhiêu tấn? (⭐ Tổng vị thế ròng)</li>
        <li>London tăng/giảm 30 USD thì lời/lỗ bao nhiêu? (Tổng quan)</li>
        <li>Hợp đồng nào sắp tới hạn chốt giá, sắp giao? (📒 Giao dịch, Trợ lý nhắc ≤ 15 ngày)</li>
        <li>Hợp đồng nào chưa được phòng hộ, còn hở bao nhiêu? (🔗 còn hở)</li>
        <li>Hôm nay giá chạy bao nhiêu, vì sao, có cần hành động không? (Lời khuyên & cảnh báo của Trợ lý)</li></ol>` },
    { id: 'dac-san', cat: 'tuvan', title: 'Cà phê đặc sản: 4 làn sóng và cơ hội', tags: 'ca phe dac san lan song specialty ruou ca phe biochar vo ca phe',
      sum: 'Thế giới đã qua làn sóng 3–4 (giá trị vùng đất, câu chuyện người nông dân); Việt Nam đang bắt kịp.',
      body: `<ol><li>Cà phê tiện lợi (hòa tan, đóng gói).</li><li>Cà phê như "không gian thứ ba" (chuỗi quán).</li>
        <li>Thưởng thức như rượu vang – giá trị vùng đất, giống, sơ chế.</li><li>Câu chuyện cụ thể về người nông dân, cách trồng.</li></ol>
        <ul><li>Trước khi tham gia: đánh giá nội lực (nhân lực, vốn, nguồn nguyên liệu) và chính sách hỗ trợ của Bộ Nông nghiệp (vùng nguyên liệu trọng điểm, liên kết doanh nghiệp – hợp tác xã).</li>
        <li>Sản phẩm phụ tiềm năng: rượu/bia từ vỏ quả tươi, than sinh học (biochar) từ vỏ, viên nén từ bã cà phê.</li></ul>` },

    // ===================== THUẬT NGỮ =====================
    { id: 'thuat-ngu', cat: 'thuatngu', title: 'Từ điển thuật ngữ A–Z', tags: 'thuat ngu tu dien glossary dinh nghia',
      sum: 'Giải nghĩa nhanh các từ hay gặp khi làm việc với khách nước ngoài và sàn giao dịch.',
      body: `<table>
        <tr><td><b>Arbitrage</b></td><td>Chênh lệch giá giữa hai thị trường/loại hàng (vd Arabica – Robusta)</td></tr>
        <tr><td><b>Backwardation / Inverted</b></td><td>Kỳ gần đắt hơn kỳ xa (spread dương)</td></tr>
        <tr><td><b>Basis</b></td><td>Giá hàng thật − giá sàn</td></tr>
        <tr><td><b>BB (Black &amp; Broken)</b></td><td>% hạt đen + vỡ</td></tr>
        <tr><td><b>Buyer's call / Seller's call</b></td><td>Người mua / người bán có quyền chốt giá hợp đồng trừ lùi</td></tr>
        <tr><td><b>CAD / LC</b></td><td>Nhờ thu kèm chứng từ / Thư tín dụng</td></tr>
        <tr><td><b>Certified stocks</b></td><td>Tồn kho đạt chuẩn trong kho của sàn</td></tr>
        <tr><td><b>Contango</b></td><td>Kỳ xa cao hơn kỳ gần (spread âm)</td></tr>
        <tr><td><b>COT</b></td><td>Báo cáo vị thế các nhóm nhà giao dịch, hằng tuần</td></tr>
        <tr><td><b>Diff (Differential)</b></td><td>Giá FOB − giá sàn kỳ tham chiếu</td></tr>
        <tr><td><b>EUDR / DDI</b></td><td>Quy định chống phá rừng của EU / hồ sơ thẩm định đi kèm lô hàng</td></tr>
        <tr><td><b>FND (First Notice Day)</b></td><td>Ngày thông báo đầu tiên – hạn đóng/đảo lệnh, hạn chốt giá thường gặp</td></tr>
        <tr><td><b>FM (Foreign Matter)</b></td><td>Tạp chất</td></tr>
        <tr><td><b>Futures</b></td><td>Hợp đồng kỳ hạn chuẩn hóa trên sàn</td></tr>
        <tr><td><b>Hedge</b></td><td>Phòng hộ – lệnh sàn ngược chiều hàng thật</td></tr>
        <tr><td><b>Long / Short</b></td><td>Mua (hưởng lợi khi giá tăng) / Bán (hưởng lợi khi giá giảm)</td></tr>
        <tr><td><b>Lot</b></td><td>Đơn vị hợp đồng – Robusta 10 tấn</td></tr>
        <tr><td><b>Margin / Margin call</b></td><td>Ký quỹ / Yêu cầu nộp thêm ký quỹ</td></tr>
        <tr><td><b>MTM</b></td><td>Định giá theo giá thị trường – lãi/lỗ tạm tính</td></tr>
        <tr><td><b>Open interest</b></td><td>Số hợp đồng đang mở</td></tr>
        <tr><td><b>Option – Put / Call / Strike / Premium</b></td><td>Quyền chọn – quyền bán / quyền mua / giá thực hiện / phí quyền chọn</td></tr>
        <tr><td><b>Outright</b></td><td>Hợp đồng giá cố định</td></tr>
        <tr><td><b>PTBF (Price To Be Fixed)</b></td><td>Hợp đồng trừ lùi – giá chốt sau theo sàn + diff</td></tr>
        <tr><td><b>Roll</b></td><td>Đảo lệnh/hợp đồng sang kỳ hạn sau</td></tr>
        <tr><td><b>Screen</b></td><td>Cỡ sàng (1/64 inch)</td></tr>
        <tr><td><b>Settlement</b></td><td>Giá chốt phiên</td></tr>
        <tr><td><b>Spread</b></td><td>Chênh lệch giữa hai kỳ hạn</td></tr>
        <tr><td><b>Washout</b></td><td>Hai bên thỏa thuận hủy hợp đồng, thanh toán phần chênh lệch giá</td></tr>
        <tr><td><b>WP (Wet Polished)</b></td><td>Đánh bóng ướt</td></tr></table>` },

    // ===================== TÌNH HUỐNG GIAO DỊCH FUTURES (số minh họa theo giá RMF27 3.448 · RMH27 3.424 · RMK27 3.412 · tỷ giá 25.790) =====================
    { id: 'th-ban-chot-chua-hang', cat: 'tinhhuong', title: 'Bán giá chốt mà chưa có hàng: phòng hộ từ lúc ký tới lúc giao', tags: 'tinh huong ban gia chot outright chua co hang short mua lot phong ho 38.4 tan giao xa',
      sum: 'Bán 38,4 t giá chốt 3.800 FOB khi chưa mua hàng = đang thiếu hàng 38,4 t: MUA 4 lot ngay, mua hàng tới đâu bán lại lot tới đó.',
      body: `<p><b>Tình huống:</b> bán 38,4 t R1 S18 WP giá cố định 3.800 USD/t FOB, giao 12/2026, kỳ tham chiếu RMF27 (≈ 3.448 lúc ký). Chưa mua hàng, chưa mua sàn → vị thế <b>−38,4 t</b>.</p>
        <p><b>Tính nhanh:</b></p><ul><li>London +100 USD/t → lỗ ≈ 3.840 USD (≈ 99 triệu đ) vì phải mua hàng đắt hơn.</li>
        <li>Phòng hộ: MUA 38,4 ÷ 10 = 3,84 → <b>4 lot RMF27</b> (dư 1,6 t). Diff ngầm định khóa được ≈ 3.800 − 3.448 = <b>+352</b>.</li>
        <li>London +250: lệnh sàn lời 250 × 40 = 10.000 USD, hàng đắt thêm 250 × 38,4 = 9.600 USD → ròng <b>+400</b> (phần 1,6 t dư). London −250: ngược lại, ròng −400.</li></ul>
        <p><b>Xử lý theo thời gian:</b></p><ol><li>Ngay ngày ký: đặt MUA 4 lot RMF27 (lệnh giới hạn sát giá) → khớp thì ghi ✔ Khớp.</li>
        <li>Mua hàng nội địa dần: mỗi lần mua giá cố định 19,2 t (1 container) → <b>BÁN lại 2 lot</b> vì đã có hàng, không còn thiếu.</li>
        <li>Đủ 38,4 t → lệnh sàn về 0 lot (lot lẻ còn lại thì đóng nốt).</li>
        <li>Trước ngày thông báo đầu tiên RMF27 (≈ 28/12/2026) không còn lot F27 mở; giao trễ thì đảo kỳ.</li></ol>
        <p><b>Lưu ý:</b> phòng hộ khóa giá London, <b>không khóa chênh lệch nội địa</b>: nhân xô 94.000 + 8.000 (đánh bóng) = 102.000 đ/kg, trong khi 3.800 FOB ≈ 98.000 đ/kg → phải tìm nguồn hàng/khóa giá mua sớm.</p>
        <p><b>Trên hệ thống:</b> 📒 Giao dịch → 🛡️ Hedge (ghi lệnh chờ) → ✔ Khớp khi khớp thật; ghi hợp đồng MUA khi mua hàng; xem "còn hở" trên dòng hợp đồng. Xem thêm bài phân tích ký hợp đồng 38,4 t.</p>` },
    { id: 'th-mua-chot-chua-ban', cat: 'tinhhuong', title: 'Thu mua giá cố định nhưng chưa có người mua', tags: 'tinh huong mua hang gia co dinh ton kho chua ban long ban lot phong ho thu mua',
      sum: 'Mua 100 t nhân xô giá cố định khi chưa có hợp đồng bán = đang dư hàng 100 t: BÁN 10 lot, ký bán tới đâu MUA lại lot tới đó.',
      body: `<p><b>Tình huống:</b> thu mua 100 t nhân xô giá 94.000 đ/kg (≈ 3.645 USD/t theo tỷ giá 25.790), chưa có hợp đồng bán → vị thế <b>+100 t</b>.</p>
        <p><b>Tính nhanh:</b> London −100 USD/t → hàng mất ≈ 10.000 USD (≈ 258 triệu đ). Phòng hộ: <b>BÁN 10 lot</b> ở kỳ dự kiến bán hàng (vd RMH27 nếu định bán tháng 1–2). London −300: lệnh sàn lời 30.000 USD, hàng mất ≈ 30.000 USD → ròng ≈ 0 (chỉ còn phần basis).</p>
        <p><b>Xử lý:</b></p><ol><li>Chốt giá mua với nông dân/đại lý xong → bán số lot tương ứng ngay trong phiên.</li>
        <li>Ký hợp đồng bán <b>giá cố định</b> → MUA lại số lot tương ứng ngay. Ký bán <b>trừ lùi</b> → giữ lệnh, đóng khi khách chốt giá (xem bài EFP).</li>
        <li>Mỗi tuần đối chiếu tồn kho thực tế với số lot đang bán.</li></ol>
        <p><b>Lưu ý:</b> chọn kỳ gần thời điểm bán hàng; kỳ quá xa thì spread làm lệch kết quả.</p>
        <p><b>Trên hệ thống:</b> nhập dòng Tồn kho ở ma trận + ghi lệnh BÁN 10 lot → vị thế ròng về gần 0.</p>` },
    { id: 'th-goi-ky-quy', cat: 'tinhhuong', title: 'Giá chạy ngược, bị gọi ký quỹ 30.000 USD', tags: 'tinh huong goi ky quy margin call nop tien gia tang lenh ban dong lenh thanh khoan quy du phong',
      sum: 'Bán 10 lot phòng hộ, London tăng 300 → phải nộp 30.000 USD trong 1 ngày. Không đóng phòng hộ chỉ vì thiếu tiền – lo nguồn tiền trước.',
      body: `<p><b>Tình huống:</b> đang BÁN 10 lot RMH27 @3.400 để phòng hộ 100 t tồn kho. London tăng lên 3.700 (+300).</p>
        <p><b>Tính nhanh:</b> tiền phải nộp thêm = 300 × 10 t × 10 lot = <b>30.000 USD ≈ 774 triệu đ</b>, thường trong 1 ngày làm việc. Hàng tồn cũng lên giá tương ứng nhưng chỉ là lời "trên giấy" tới khi bán.</p>
        <p><b>Xử lý:</b></p><ol><li><b>Không đóng lệnh phòng hộ chỉ vì bị gọi ký quỹ</b> – đóng là chốt lỗ thật trong khi hàng chưa bán, và mất bảo hiểm đúng lúc giá đang chạy.</li>
        <li>Nộp từ quỹ dự phòng hoặc hạn mức tín dụng đã thỏa thuận trước với ngân hàng.</li>
        <li>Thiếu tiền: bán bớt hàng thật (thu phần lời) rồi đóng đúng số lot tương ứng – giảm cả hai bên cùng lúc.</li>
        <li>Cân nhắc chuyển một phần sang quyền chọn (người mua quyền không bị gọi ký quỹ).</li></ol>
        <p><b>Lưu ý:</b> lập quỹ dự phòng đủ cho biến động 300–500 USD/t × số tấn đang phòng hộ (100 t → 30.000–50.000 USD).</p>
        <p><b>Trên hệ thống:</b> bảng lệnh ở 📒 Giao dịch hiện lãi/lỗ đang mở từng lệnh; Trợ lý cảnh báo khi sàn biến động vượt ngưỡng.</p>` },
    { id: 'th-dao-ky-truoc-fnd', cat: 'tinhhuong', title: 'Sắp tới ngày thông báo đầu tiên: đảo kỳ lệnh phòng hộ', tags: 'tinh huong dao ky roll ngay thong bao dau tien fnd spread lenh 2 chan giao tre f27 h27',
      sum: 'Đang MUA 4 lot RMF27, FND ≈ 28/12/2026 mà hàng giao trễ: đảo sang RMH27 bằng một lệnh spread, trước FND 1–2 tuần.',
      body: `<p><b>Tình huống:</b> đang MUA 4 lot RMF27 phòng hộ hợp đồng bán; ngày thông báo đầu tiên (FND) RMF27 ≈ <b>28/12/2026</b>; khách lùi giao sang tháng 2.</p>
        <p><b>Tính nhanh:</b> đảo bằng lệnh spread: BÁN 4 lot F27 + MUA 4 lot H27 cùng lúc. Spread F27 − H27 = +24 (nghịch đảo) → bên đang MUA phòng hộ <b>được lợi 24 × 40 = 960 USD</b>. Nếu thị trường thuận (−30) thì tốn 30 × 40 = 1.200 USD.</p>
        <p><b>Xử lý:</b></p><ol><li>Đảo trước FND ít nhất 1–2 tuần – càng gần FND kỳ gần càng ít người giao dịch.</li>
        <li>Đặt <b>một lệnh spread 2 chân</b> thay vì 2 lệnh rời để không bị lệch giá giữa hai lần đặt.</li>
        <li>Hợp đồng trừ lùi đổi kỳ tham chiếu thì tính lại diff (xem bài khách xin lùi lịch giao).</li></ol>
        <p><b>Lưu ý:</b> người đang MUA giữ lệnh qua FND có thể bị phân bổ thông báo giao hàng – phải nhận hàng ở kho sàn châu Âu và trả đủ tiền hàng.</p>
        <p><b>Trên hệ thống:</b> ghi 2 lệnh (BÁN 4 F27, MUA 4 H27); Trợ lý nhắc khi còn ≤ 15 ngày tới FND.</p>` },
    { id: 'th-chot-ptbf-ben-mua', cat: 'tinhhuong', title: 'Khách chốt giá hợp đồng trừ lùi: đóng phòng hộ cùng lúc', tags: 'tinh huong chot gia ptbf tru lui buyer call ben mua chot dong lenh cung luc dong hedge',
      sum: 'Bán RMH27 +300, khách chốt ở 3.500 → giá bán 3.800; công ty phải MUA lại đúng số lot đang bán, cùng lúc, cùng giá.',
      body: `<p><b>Tình huống:</b> bán 50 t cho nhà rang xay giá <b>RMH27 +300, bên mua chốt</b>. Công ty đã mua đủ 50 t hàng giá cố định và BÁN 5 lot RMH27 @3.420 để phòng hộ.</p>
        <p><b>Tính nhanh:</b> khách chốt khi H27 = 3.500 → giá bán 3.500 + 300 = 3.800. Cùng lúc công ty MUA lại 5 lot @3.500: lệnh sàn lỗ (3.500 − 3.420) × 50 = 4.000 USD, nhưng giá bán cao hơn lúc phòng hộ (3.420 + 300 = 3.720) đúng 80 × 50 = 4.000 USD → bù nhau, công ty giữ đúng biên lời đã tính.</p>
        <p><b>Xử lý:</b></p><ol><li>Ghi trong hợp đồng: khách báo chốt trong giờ sàn, theo lot 10 t, trước hạn chốt.</li>
        <li>Khách chốt bao nhiêu lot → công ty đóng bấy nhiêu lot, <b>cùng lúc, cùng giá</b> (tốt nhất qua EFP).</li>
        <li>Ghi lần chốt (🔒 Chốt) và lệnh MUA lại trên hệ thống.</li></ol>
        <p><b>Lưu ý:</b> quên đóng lệnh khi khách đã chốt → công ty đang để lệnh BÁN "trần", tức là đang đầu cơ giá giảm.</p>` },
    { id: 'th-efp', cat: 'tinhhuong', title: 'EFP – đổi lệnh sàn lấy hàng thật khi chốt giá', tags: 'efp exchange for physical doi lenh san chot gia tru lui moi gioi khong truot gia',
      sum: 'Hai bên của hợp đồng hàng thật chuyển lệnh sàn cho nhau ở một giá thỏa thuận – chốt giá và đóng phòng hộ cùng lúc, không trượt giá.',
      body: `<p><b>EFP (Exchange for Physical):</b> người mua và người bán của một hợp đồng hàng thật đổi lệnh sàn cho nhau ở giá thỏa thuận, đăng ký qua môi giới với sàn – không phải đặt lệnh ra thị trường.</p>
        <p><b>Ví dụ</b> (tiếp bài khách chốt giá trừ lùi): khách MUA 5 lot H27 @3.500 để chốt giá; qua EFP, 5 lot MUA đó chuyển sang công ty và triệt tiêu 5 lot BÁN phòng hộ của công ty ở đúng 3.500. Hóa đơn hàng = 3.500 + 300 = 3.800 USD/t.</p>
        <ul><li><b>Lợi ích:</b> không trượt giá, không lệch thời điểm; hai bên cùng đóng phòng hộ ở một giá.</li>
        <li><b>Cần chuẩn bị:</b> điều khoản "chốt giá qua EFP" trong hợp đồng, thông tin tài khoản/môi giới hai bên, xác nhận bằng văn bản số lot, kỳ hạn, giá.</li>
        <li><b>Kiểm tra:</b> xác nhận của môi giới phải trùng hợp đồng (số lot, kỳ, giá); EFP vẫn tính phí môi giới.</li></ul>` },
    { id: 'th-basis-xau', cat: 'tinhhuong', title: 'Phòng hộ đủ lot mà vẫn lỗ: diff (basis) xấu đi', tags: 'tinh huong basis diff xau di phong ho van lo rui ro co so vu moi hang nhieu',
      sum: 'London giảm 100, nhưng diff R2 tụt từ +166 xuống +100 → hàng mất 166, lệnh sàn chỉ bù 100: lỗ 66 USD/t là rủi ro basis.',
      body: `<p><b>Tình huống:</b> giữ 100 t R2 S13 định bán FOB theo diff; đã BÁN 10 lot RMH27 @3.450. Lúc mua hàng diff R2 = +166 → FOB ≈ 3.616.</p>
        <p><b>Một tháng sau:</b> London 3.350 (−100); vụ mới vào, hàng nhiều, diff R2 tụt còn +100 → FOB 3.450 (−166).</p>
        <ul><li>Lệnh sàn lời 100 × 100 = <b>+10.000 USD</b>; hàng mất 166 × 100 = <b>−16.600 USD</b> → ròng <b>−6.600 USD</b> = phần diff mất 66 USD/t.</li></ul>
        <p><b>Bài học:</b> futures xóa rủi ro giá London, <b>không xóa rủi ro diff</b>. Cách giảm: bán trước theo diff (trừ lùi) khi diff tốt; theo dõi mùa vụ (diff thường yếu khi vào vụ); không ôm hàng chờ diff lên quá lâu.</p>
        <p><b>Trên hệ thống:</b> bảng 💎 Giá FOB theo chủng loại (thẻ Bảng giá) và công cụ tính trừ lùi để theo dõi diff theo ngày.</p>` },
    { id: 'th-sai-ky', cat: 'tinhhuong', title: 'Phòng hộ khác kỳ tham chiếu: rủi ro spread', tags: 'tinh huong sai ky phong ho khac ky spread k27 f27 lech gia rui ro spread',
      sum: 'Hợp đồng theo RMF27 nhưng mua lot RMK27: F27 tăng 150, K27 chỉ tăng 100 → lỗ 1.760 USD dù đã "phòng hộ đủ".',
      body: `<p><b>Tình huống:</b> hợp đồng bán 38,4 t tham chiếu RMF27 nhưng công ty MUA 4 lot RMK27 @3.412 (vì thấy rẻ hơn).</p>
        <p><b>Diễn biến:</b> F27 tăng 150, K27 chỉ tăng 100 (spread nghịch đảo dãn ra).</p>
        <ul><li>Hàng thật (theo F27) đắt thêm 150 × 38,4 = <b>−5.760 USD</b>; lệnh K27 lời 100 × 40 = <b>+4.000 USD</b> → ròng <b>−1.760 USD</b>.</li></ul>
        <p><b>Xử lý:</b> phòng hộ đúng kỳ tham chiếu của hợp đồng. Dùng kỳ khác thì phải theo dõi spread hằng ngày và đảo về đúng kỳ khi spread thuận lợi.</p>
        <p><b>Trên hệ thống:</b> form lệnh sàn báo ⚠️ khi kỳ của lệnh khác kỳ tham chiếu của hợp đồng liên kết.</p>` },
    { id: 'th-lot-le', cat: 'tinhhuong', title: 'Lot lẻ: 38,4 tấn nên mua 3 hay 4 lot?', tags: 'tinh huong lot le lam tron 3.84 lot du thieu gop vi the nhieu hop dong',
      sum: '4 lot dư 1,6 t, 3 lot thiếu 8,4 t. Phần hở nhỏ chấp nhận được; nhiều hợp đồng thì gộp theo kỳ rồi mới làm tròn.',
      body: `<ul><li><b>4 lot</b> (40 t): dư 1,6 t – giá giảm 300 thì lỗ thêm 1,6 × 300 = <b>480 USD</b>.</li>
        <li><b>3 lot</b> (30 t): thiếu 8,4 t – giá tăng 300 thì lỗ 8,4 × 300 = <b>2.520 USD</b>.</li>
        <li><b>Gộp cả công ty theo kỳ:</b> hai hợp đồng bán 38,4 t + 19,2 t cùng kỳ = 57,6 t → <b>6 lot</b> (dư 2,4 t), thay vì làm tròn từng hợp đồng.</li></ul>
        <p><b>Quy tắc gợi ý:</b> phần hở dưới nửa lot (5 t) mỗi kỳ là chấp nhận được; quan trọng là tổng vị thế ròng từng kỳ nằm trong hạn mức.</p>
        <p><b>Trên hệ thống:</b> dòng hợp đồng hiện "còn hở"; ô tóm tắt theo kỳ ở thẻ Vị thế hiện ròng từng kỳ.</p>` },
    { id: 'th-loai-lenh', cat: 'tinhhuong', title: 'Đặt lệnh thế nào: thị trường, giới hạn, dừng', tags: 'loai lenh market limit stop gioi han thi truong dung truot gia gtc trong ngay dat lenh',
      sum: 'Lệnh thị trường khớp ngay nhưng có thể trượt giá; lệnh giới hạn chắc giá nhưng có thể không khớp; lệnh dừng dễ khớp xa khi giá nhảy.',
      body: `<ul><li><b>Lệnh thị trường (market):</b> khớp ngay ở giá tốt nhất đang có. Kỳ xa ít người giao dịch → dễ <b>trượt giá</b> vài USD/t.</li>
        <li><b>Lệnh giới hạn (limit):</b> vd "MUA 4 lot RMF27 giá ≤ 3.440" – chỉ khớp khi giá chạm 3.440 hoặc thấp hơn; có thể không khớp nếu giá chạy đi.</li>
        <li><b>Lệnh dừng (stop):</b> thành lệnh thị trường khi giá chạm mức đặt; giá nhảy mạnh thì khớp xa mức đặt. Lệnh <b>phòng hộ không nên đặt dừng lỗ</b> – dừng lỗ là tự bỏ bảo hiểm.</li>
        <li><b>Hiệu lực:</b> trong ngày (DAY) hoặc tới khi hủy (GTC) – hỏi môi giới loại nào đang dùng, tránh lệnh cũ còn treo.</li></ul>
        <p><b>Thực tế:</b> phòng hộ ngay sau khi ký hợp đồng → lệnh giới hạn sát giá hiện tại; quá 30–60 phút chưa khớp thì xem lại.</p>
        <p><b>Trên hệ thống:</b> lệnh đã đặt mà chưa khớp ghi là <b>⏳ lệnh chờ</b> (kèm giá đặt); khớp rồi bấm ✔ Khớp, sửa giá khớp thật.</p>` },
    { id: 'th-chua-kip-hedge', cat: 'tinhhuong', title: 'Đã bán giá chốt, giá tăng vọt khi chưa kịp phòng hộ', tags: 'tinh huong chua kip hedge gia tang manh ban gia chot lo cho gia ve phong ho ngay ky luat',
      sum: 'Bán 3.800 khi F27 = 3.448, chưa phòng hộ, F27 lên 3.650: diff còn +150, lỗ tạm ≈ 7.757 USD. Phòng hộ ngay, không chờ "gỡ".',
      body: `<p><b>Tình huống:</b> bán 38,4 t giá cố định 3.800 khi RMF27 = 3.448 (diff ngầm định +352), chưa phòng hộ; RMF27 tăng lên 3.650.</p>
        <p><b>Tính nhanh:</b> lỗ tạm ≈ 202 × 38,4 = <b>7.757 USD</b>; diff ngầm định chỉ còn 3.800 − 3.650 = <b>+150</b>.</p>
        <p><b>Ba lựa chọn:</b></p><ol><li><b>Phòng hộ ngay</b> (MUA 4 lot): khóa phần lời còn lại, không lỗ thêm. → <b>Nên làm.</b></li>
        <li>Chờ giá về rồi mới mua: là <b>đầu cơ</b> – giá tăng tiếp thì lỗ thêm, có thể mất hết lời.</li>
        <li>Phòng hộ một phần: MUA 2 lot ngay, 2 lot đặt lệnh giới hạn thấp hơn – chỉ khi đã có quy định cho phép.</li></ol>
        <p><b>Bài học:</b> đặt quy định "ký hợp đồng giá cố định là phòng hộ trong cùng phiên"; người ký hợp đồng báo ngay người đặt lệnh.</p>` },
    { id: 'th-ton-kho-gia-giam', cat: 'tinhhuong', title: 'Đang giữ hàng tồn, giá London rơi mạnh', tags: 'tinh huong ton kho gia giam manh long chua phong ho ban lot ban hang cat lo',
      sum: '200 t tồn chưa phòng hộ, London −400 → mất ≈ 80.000 USD (≈ 2,06 tỷ đ). Chặn lỗ: bán hàng hoặc BÁN lot ngay, không ôm chờ.',
      body: `<p><b>Tình huống:</b> 200 t tồn kho mua giá cố định, chưa phòng hộ; London giảm 400 USD/t trong 2 tuần.</p>
        <p><b>Tính nhanh:</b> mất ≈ 400 × 200 = <b>80.000 USD ≈ 2,06 tỷ đ</b>.</p>
        <p><b>Lựa chọn:</b></p><ol><li>Bán hàng thật nếu có khách và diff chấp nhận được.</li>
        <li>BÁN 20 lot kỳ gần thời điểm bán hàng để chặn lỗ thêm, rồi tìm khách bán dần (mỗi lần bán hàng thì MUA lại lot tương ứng).</li>
        <li>Giữ nguyên chờ giá hồi = đầu cơ; chỉ làm khi lãnh đạo chấp thuận và còn trong hạn mức.</li></ol>
        <p><b>Bài học:</b> hạn mức tồn kho không phòng hộ phải đặt trước (vd ±50 t/kỳ) – vượt là phòng hộ, không bàn lại khi giá đã chạy.</p>` },
    { id: 'th-nghich-dao', cat: 'tinhhuong', title: 'Thị trường nghịch đảo: ảnh hưởng tới giữ hàng và đảo kỳ', tags: 'tinh huong nghich dao backwardation thuan contango dao ky giu hang chi phi spread',
      sum: 'Kỳ gần đắt hơn kỳ xa (F27 3.448 > H27 3.424): giữ hàng bị thiệt, bên BÁN phòng hộ đảo kỳ tốn tiền, bên MUA phòng hộ đảo kỳ được lợi.',
      body: `<p><b>Nghịch đảo</b> = kỳ gần đắt hơn kỳ xa: thị trường cần hàng ngay (hàng khan).</p>
        <ul><li><b>Giữ hàng tồn:</b> bất lợi – giá kỳ sau thấp hơn, nên ưu tiên bán/giao sớm.</li>
        <li><b>Đảo lệnh BÁN phòng hộ</b> 10 lot F27 → H27 (spread +24): MUA lại F27 đắt, BÁN H27 rẻ → tốn 24 × 100 = <b>2.400 USD</b>.</li>
        <li><b>Đảo lệnh MUA phòng hộ</b> 4 lot F27 → H27: BÁN F27 đắt, MUA H27 rẻ → được 24 × 40 = <b>960 USD</b>.</li>
        <li><b>Thị trường thuận</b> (kỳ xa đắt hơn): mọi thứ ngược lại – giữ hàng được bù chi phí lưu kho, bên MUA đảo kỳ tốn tiền.</li></ul>
        <p><b>Trên hệ thống:</b> dải SPREAD KỲ HẠN ở thẻ Vị thế và ô Cấu trúc thị trường ở Tổng quan cho biết đang nghịch đảo hay thuận.</p>` },
    { id: 'th-lui-lich-giao', cat: 'tinhhuong', title: 'Khách xin lùi lịch giao hàng: đảo phòng hộ và tính lại diff', tags: 'tinh huong lui lich giao defer gia han giao hang dao ky tinh lai diff chi phi luu kho',
      sum: 'Giao 12/2026 lùi sang 2/2027: đảo lệnh F27 → H27; hợp đồng trừ lùi đổi kỳ thì diff mới = diff cũ + (F27 − H27).',
      body: `<p><b>Hợp đồng trừ lùi</b> RMF27 +300, khách xin giao tháng 2 → đổi kỳ tham chiếu sang RMH27. Để giá trị không đổi: <b>diff mới = diff cũ + (F27 − H27)</b> = 300 + 24 = <b>+324</b>.</p>
        <p><b>Hợp đồng giá cố định</b> (vd 3.800): giá giữ nguyên, nhưng công ty phải đảo lệnh phòng hộ F27 → H27 (xem bài đảo kỳ) và chịu thêm chi phí lưu kho, lãi vay 2 tháng → nên đòi khách bù chi phí này (carry).</p>
        <p><b>Xử lý:</b></p><ol><li>Thống nhất bằng văn bản: kỳ tham chiếu mới, diff mới, lịch giao mới.</li>
        <li>Đảo lệnh phòng hộ cùng ngày thống nhất.</li><li>Sửa hợp đồng trên hệ thống: tháng giao, kỳ tham chiếu, diff; sửa lịch giao 🗓.</li></ol>` },
    { id: 'th-go-hedge', cat: 'tinhhuong', title: 'Giao hàng xong: gỡ lệnh phòng hộ cho đúng', tags: 'tinh huong go hedge dong lenh phong ho giao hang xong unwind lenh tran quen dong',
      sum: 'Hàng đã chốt giá cả hai đầu và giao xong thì lệnh sàn phải về 0 – quên đóng là đang đầu cơ, sát FND còn bị giao hàng trên sàn.',
      body: `<ul><li>Hợp đồng bán giá chốt + mua hàng dần giá chốt: mua tới đâu đóng lot tới đó; mua đủ thì lệnh phòng hộ về 0.</li>
        <li>Hợp đồng trừ lùi: khách chốt tới đâu đóng lot tới đó (EFP).</li>
        <li>Cuối tháng: đối chiếu <b>lot đang mở</b> với <b>phần hở của các hợp đồng</b> – không khớp là có lệnh thừa (đầu cơ) hoặc thiếu (đang hở).</li>
        <li>Lệnh nào tới gần FND mà hàng thật đã xong → đóng ngay.</li></ul>
        <p><b>Trên hệ thống:</b> 📒 Giao dịch → "Lot đang mở" và cột "còn hở" của từng hợp đồng; Trợ lý nhắc lệnh sắp tới FND.</p>` },
    { id: 'th-gap-nghi-le', cat: 'tinhhuong', title: 'Giá nhảy qua đêm, cuối tuần, Tết: chuẩn bị gì', tags: 'tinh huong gia nhay gap qua dem cuoi tuan tet nghi le gio giao dich london truc san',
      sum: 'London giao dịch 15:00–23:30 giờ VN (mùa đông 16:00–00:30); nghỉ Tết sàn vẫn chạy – phòng hộ trước khi nghỉ và cử người trực.',
      body: `<ul><li><b>Giờ sàn London:</b> 9:00–17:30 giờ London ≈ <b>15:00–23:30 giờ Việt Nam</b> (mùa hè châu Âu) hoặc 16:00–00:30 (mùa đông).</li>
        <li><b>Giá nhảy (gap):</b> tin thời tiết Brazil/Việt Nam ra ngoài giờ → phiên sau mở cửa cách xa giá đóng cửa; lệnh dừng có thể khớp rất xa.</li>
        <li><b>Tết, lễ Việt Nam:</b> văn phòng nghỉ nhưng sàn vẫn chạy → phòng hộ đủ trước kỳ nghỉ, nộp sẵn ký quỹ dự phòng, cử người trực xem giá và liên lạc môi giới.</li>
        <li><b>Lễ ở Anh</b> (bank holiday): sàn London nghỉ – không chốt giá, không đặt lệnh được; tính trước nếu có hạn chốt giá rơi vào ngày đó.</li></ul>
        <p><b>Trên hệ thống:</b> dòng trạng thái đầu trang cho biết ICE London đang giao dịch hay ngoài giờ.</p>` },
    { id: 'th-call-thay-futures', cat: 'tinhhuong', title: 'Dùng quyền chọn mua (call) thay futures cho hợp đồng bán giá chốt', tags: 'tinh huong quyen chon call mua quyen phi quyen chon khong ky quy ban gia chot bao hiem gia tran',
      sum: 'Bán 3.800 cố định: mua call RMF27 giá thực hiện 3.500, phí 120 USD/t → giá mua hàng tối đa ≈ 3.620, giá giảm thì chỉ mất phí 4.800 USD.',
      body: `<p><b>Tình huống:</b> bán 38,4 t giá 3.800 cố định; lo giá tăng nhưng không muốn bị gọi ký quỹ.</p>
        <p><b>Phương án:</b> MUA 4 lot quyền chọn mua (call) RMF27, giá thực hiện 3.500, phí (minh họa) 120 USD/t → tổng phí 120 × 40 = <b>4.800 USD</b>.</p>
        <ul><li>Giá tăng: mỗi USD trên 3.500 được quyền chọn bù → giá mua hàng tối đa ≈ 3.500 + 120 = <b>3.620</b> → diff tối thiểu giữ được ≈ 3.800 − 3.620 = <b>+180</b>.</li>
        <li>Giá giảm: không dùng quyền, công ty mua hàng rẻ hơn, chỉ mất phí 4.800 USD.</li>
        <li>Người mua quyền <b>không bị gọi ký quỹ</b> – trả phí một lần.</li></ul>
        <p><b>Khi nào dùng:</b> biến động mạnh, thiếu tiền ký quỹ, hoặc hợp đồng chưa chắc chắn (khách có thể hủy). Phí thật hỏi môi giới – thay đổi theo biến động.</p>` },
    { id: 'th-hang-ky-gui', cat: 'tinhhuong', title: 'Hàng ký gửi: nông dân chốt giá sau', tags: 'tinh huong hang ky gui gui kho nong dan chot gia sau mua goi rui ro chua chot',
      sum: 'Nông dân gửi 50 t chưa chốt giá; công ty đã bán số hàng đó giá cố định → đang thiếu 50 t tới khi nông dân chốt: MUA 5 lot.',
      body: `<p><b>Tình huống:</b> nông dân gửi kho 50 t, chốt giá sau theo giá ngày; công ty đã dùng 50 t này giao cho một hợp đồng bán giá cố định.</p>
        <p><b>Rủi ro:</b> chưa biết giá mua nhưng giá bán đã cố định → giá tăng thì nông dân chốt cao, công ty lỗ. Đây là vị thế <b>−50 t</b> dù hàng đang nằm trong kho.</p>
        <p><b>Xử lý:</b> MUA 5 lot kỳ gần; mỗi lần nông dân chốt x tấn → BÁN lại x ÷ 10 lot. Đặt hạn chót chốt giá trong hợp đồng ký gửi.</p>
        <p><b>Ngược lại:</b> hàng ký gửi chưa bán ra thì chưa có rủi ro giá với công ty (nông dân tự chịu), chỉ theo dõi ở dòng "Mua gởi chưa chốt giá" (không cộng vào vị thế ròng).</p>` },
    { id: 'th-khach-huy', cat: 'tinhhuong', title: 'Khách hủy hợp đồng khi giá giảm mạnh (rủi ro đối tác)', tags: 'tinh huong khach huy hop dong rui ro doi tac dat coc 20% vo hop dong trong tai gia giam manh',
      sum: 'Bán 3.800, đã MUA 4 lot @3.448; London rơi về 3.000, khách bỏ hợp đồng → lệnh sàn lỗ 17.920 USD. Cọc 20% (29.184 USD) là tấm đệm.',
      body: `<p><b>Tình huống:</b> bán 38,4 t giá 3.800, đã MUA 4 lot RMF27 @3.448. London rơi về 3.000; khách thấy giá thị trường thấp hơn nhiều nên từ chối nhận hàng.</p>
        <p><b>Tính nhanh:</b> lệnh sàn lỗ (3.448 − 3.000) × 40 = <b>17.920 USD</b> mà không còn hợp đồng bán để bù; nếu đã mua hàng thì còn ôm thêm hàng mất giá.</p>
        <p><b>Giảm rủi ro:</b></p><ol><li><b>Đặt cọc</b>: 20% × 3.800 × 38,4 = <b>29.184 USD</b> – đủ đệm cho giá giảm tới ≈ 760 USD/t (như điều khoản "20% – 80% scan B/L").</li>
        <li>Thẩm định khách, hạn mức theo từng khách; hợp đồng theo mẫu chuẩn có trọng tài (GCA/ECC).</li>
        <li>Khách hủy → đóng lệnh phòng hộ ngay, giữ chứng từ để đòi bồi thường.</li></ol>` },
    { id: 'th-checklist', cat: 'tinhhuong', title: 'Checklist sau mỗi giao dịch futures', tags: 'checklist sau giao dich kiem tra lenh khop ghi he thong vi the ky quy fnd bao cao',
      sum: '7 việc kiểm tra sau mỗi lần ký hợp đồng hoặc đặt lệnh – để hàng thật và hàng ảo luôn khớp nhau.',
      body: `<ol><li>Hợp đồng giá cố định vừa ký → đã đặt lệnh phòng hộ <b>trong cùng phiên</b> chưa?</li>
        <li>Lệnh đã <b>khớp</b> chưa, giá khớp bao nhiêu (xác nhận của môi giới)? Ghi ✔ Khớp đúng giá.</li>
        <li>Đúng <b>kỳ tham chiếu</b>, đúng chiều (âm thì MUA, dương thì BÁN), đúng số lot?</li>
        <li>Vị thế ròng từng kỳ sau giao dịch có nằm trong hạn mức không?</li>
        <li>Tài khoản còn đủ <b>ký quỹ</b> và quỹ dự phòng cho biến động 300–500 USD/t không?</li>
        <li>Lệnh nào gần <b>FND</b> (≤ 15 ngày) cần đảo hoặc đóng?</li>
        <li>Đã báo cáo sếp: hợp đồng, lệnh, diff khóa được, rủi ro còn lại.</li></ol>
        <p><b>Trên hệ thống:</b> Tổng quan (dòng vàng vị thế ròng) + Giao dịch (còn hở, lệnh chờ) + Trợ lý (cảnh báo FND, biến động).</p>` },

    { id: 'cqg-vs-gia-lap', cat: 'cqg', title: 'CQG thật và Sàn giả lập: giống – khác – lên sàn thật cần chú ý', tags: 'cqg so sanh san gia lap domtrader hot fast click keo tha huy chuot phai phim tat parked day gtc account summary api fix',
      sum: 'Sàn giả lập làm theo tài liệu DOMTrader của CQG: cùng thang giá, nút, phím, khay lệnh, tên trường tài khoản. Khác chủ yếu ở cách khớp lệnh, đăng nhập và giờ sàn.',
      body: `<p><b>Giống CQG (tập quen tay được):</b></p><ul>
        <li>Thang giá <b>Buy · Bid · Price · Ask · Sell</b>; nút <b>Buy MKT / Sell MKT</b> ở đầu DOM, Sell bên phải.</li>
        <li><b>Fast-click</b>: bấm cột Buy/Bid để mua, Sell/Ask để bán – dưới giá là LMT, trên giá là STP. Kéo ô giá thả vào cột Buy/Sell. Giữ Ctrl đổi sang lệnh stop khác (giả lập: STL).</li>
        <li>Sửa lệnh: <b>kéo lệnh sang giá mới</b>, hoặc chọn lệnh rồi ↑/↓ + Enter, gõ số lot + Enter. Hủy: <b>chuột phải</b>, nút hủy lệnh mua / bán / tất cả, kéo lệnh ra ngoài, hoặc Delete.</li>
        <li>Phím mặc định: ← mua / → bán · Alt+←/→ tại best bid/offer · Shift+←/→ tại best offer/bid · Ctrl+←/→ tại giá khớp · Home/Esc về giữa · Ctrl+Shift+Alt+X/B/C/Q/V hủy hết / hủy mua / hủy bán / thanh lý / đảo vị thế.</li>
        <li>Khay lệnh <b>Working, Filled, Cancelled, Exceptions, Parked, All</b>; thời hạn DAY/GTC; Account Summary: <b>Balance, P/L, OTE, NLV, Margin Value, Purchasing Power, Margin Excess</b>.</li></ul>
        <p><b>Khác thực tế (phải nhớ):</b></p><table><tr><th>Điểm</th><th>CQG thật</th><th>Sàn giả lập</th></tr>
        <tr><td>Khớp lệnh</td><td>LMT xếp hàng – chạm giá chưa chắc khớp; trượt giá thật</td><td>Chạm giá là khớp; trượt giá theo kịch bản</td></tr>
        <tr><td>Fast-click</td><td>Broker (FCM) bật/tắt; có thể chưa bật</td><td>Bật/tắt được để tập cả hai cách</td></tr>
        <tr><td>Phím</td><td>Có thể bị cấu hình khác: Setup → Trading Preferences → Keyboard Keys</td><td>Đúng bộ phím mặc định</td></tr>
        <tr><td>Tiền & ký quỹ</td><td>Do thành viên MXV tính, đổi theo thời kỳ</td><td>Số mẫu – sửa trong ⚙️</td></tr>
        <tr><td>Giờ sàn</td><td>London ≈ 15:00–23:30 giờ VN (mùa đông 16:00–00:30); ngoài giờ không khớp</td><td>Chạy mọi lúc; nút 📡 bám giá London thật (ngoài giờ giá đứng)</td></tr>
        <tr><td>Loại lệnh</td><td>Thêm Trailing, Iceberg, DOM-Triggered, Bracket/OCO…</td><td>MKT, LMT, STP, STL</td></tr>
        <tr><td>Mã hợp đồng</td><td>Theo cách hiển thị của thành viên</td><td>LRCF27 kèm mã ICE RMF27</td></tr></table>
        <p><b>Trước khi đánh thật:</b> (1) đăng nhập tài khoản <b>demo</b> của thành viên MXV, kiểm tra Fast-click và phím; (2) bật xác nhận lệnh; (3) đặt thử 1 lot LMT xa giá rồi sửa – hủy; (4) đối chiếu mã hợp đồng, số lot, Margin Excess; (5) lệnh thật đầu tiên có người thứ hai đứng xem; (6) sau mỗi lệnh ghi lại trên hệ thống (lệnh chờ → ✔ Khớp).</p>
        <p><b>Học API sau này:</b> CQG có WebAPI và FIX API (giá real-time, đặt lệnh, Execution Report với trạng thái New, Partially filled, Filled, Canceled, Rejected…). Cần broker cấp quyền + tài khoản demo API; khóa API chỉ để trên máy chủ, không đưa lên giao diện hay GitHub. Lộ trình: kết nối <b>chỉ đọc</b> giá & trạng thái lệnh trước, đặt lệnh qua API sau cùng.</p>
        <p>Trên hệ thống: thẻ 🎮 Sàn giả lập → 🎓 Hướng dẫn từng bước, bảng 📋 So sánh với CQG thật, 11 bài tập tình huống, tab Trades thắng/thua.</p>` },

    { id: 'doc-bieu-do-ohlc', cat: 'cqg', title: 'Đọc biểu đồ thanh OHLC (như trên CQG)', tags: 'bieu do thanh ohlc bar chart nen candle cqg mo cua dong cua cao thap xanh do xam khung 1h 5m doc bieu do',
      sum: 'Mỗi thanh là một khung thời gian: đỉnh = cao nhất, đáy = thấp nhất, gạch trái = mở cửa, gạch phải = đóng cửa; xanh tăng, đỏ giảm, xám đứng giá.',
      body: `<table><tr><th>Phần của thanh</th><th>Ý nghĩa</th></tr>
        <tr><td>Đỉnh thanh</td><td>Giá <b>cao nhất</b> trong khung (High)</td></tr>
        <tr><td>Đáy thanh</td><td>Giá <b>thấp nhất</b> trong khung (Low)</td></tr>
        <tr><td>Gạch ngang bên <b>trái</b></td><td>Giá <b>mở cửa</b> – giá khớp đầu tiên của khung (Open)</td></tr>
        <tr><td>Gạch ngang bên <b>phải</b></td><td>Giá <b>đóng cửa</b> – giá khớp cuối cùng của khung (Close)</td></tr>
        <tr><td>Màu xanh / đỏ / xám</td><td>Đóng cao hơn mở (tăng) / thấp hơn mở (giảm) / bằng mở</td></tr>
        <tr><td>Đường đứt nét ngang</td><td>Giá hiện tại (giá khớp gần nhất)</td></tr>
        <tr><td>Nhãn "2-0:00", "12:00"</td><td>Ngày 2 lúc 0:00, rồi 12:00 cùng ngày – CQG ghi "ngày-giờ" ở chỗ sang ngày mới</td></tr></table>
        <ul><li><b>Khung thời gian</b>: 5m, 15m, 1H, 4H, 1D = mỗi thanh gom 5 phút, 15 phút, 1 giờ… Ảnh CQG thường dùng 1H để xem 1–3 ngày.</li>
        <li><b>Thanh dài</b> = trong khung giá chạy mạnh; <b>đóng gần đỉnh</b> = bên mua thắng cuối khung; <b>đóng gần đáy</b> = bên bán thắng.</li>
        <li><b>Chuỗi thanh xanh, đỉnh sau cao hơn đỉnh trước</b> = xu hướng tăng; ngược lại là giảm. Thanh xám nhỏ = giằng co.</li>
        <li>Đọc kèm <b>khối lượng</b> (cột dưới): giá tăng + khối lượng lớn đáng tin hơn giá tăng khi ít người giao dịch.</li>
        <li><b>Nến</b> (candle) là cùng dữ liệu, chỉ khác cách vẽ: thân nến = khoảng từ mở tới đóng.</li></ul>
        <p><b>Với phòng hộ:</b> biểu đồ giúp chọn mức giá đặt LMT (vd mua phòng hộ gần đáy các thanh gần đây), không dùng để đoán hướng mà bỏ phòng hộ.</p>
        <p><b>Trên hệ thống:</b> thẻ 🌐 Bảng giá → 📈 Biểu đồ thanh (giá London/New York thật, máy chủ ghi từng 5 phút từ 04/10/2026 nên dày dần theo phiên); thẻ 🎮 Sàn giả lập → biểu đồ có dấu ▲ mua / ▼ bán của mình.</p>` },

    // ===================== HƯỚNG DẪN SỬ DỤNG =====================
    { id: 'dung-tren-dien-thoai', cat: 'huongdan', title: 'Dùng hệ thống trên điện thoại', tags: 'dien thoai mobile man hinh chinh nut bam quay lai doc tai lieu co chu iphone android',
      sum: 'Mở bằng link cố định, đặt biểu tượng ra màn hình chính, chuyển thẻ ở thanh dưới, nút Quay lại đóng cửa sổ, chỉnh cỡ chữ khi đọc.',
      body: `<ol><li><b>Mở hệ thống:</b> luôn dùng link cố định <b>truongdinhhuy6789-tech.github.io/Futureprice</b> – link này tự chuyển tới máy chủ đang chạy, kể cả khi link Cloudflare đổi.</li>
        <li><b>Đặt ra màn hình chính</b> để mở như ứng dụng: Android (Chrome) bấm <b>⋮ → Thêm vào màn hình chính</b>; iPhone (Safari) bấm <b>Chia sẻ → Thêm vào MH chính</b>. Nên thêm khi đang ở link cố định.</li>
        <li><b>Chuyển thẻ</b> bằng thanh dưới đáy (Tổng quan · Vị thế · Giao dịch · Phòng hộ · Bảng giá · Kiến thức); bấm thẻ là về đầu trang.</li>
        <li><b>Thẻ giá</b> ở đầu trang <b>vuốt ngang</b> để xem London, New York, tỷ giá, nhân xô.</li>
        <li><b>Trợ lý khuyên</b> trên điện thoại hiện 1 ý quan trọng nhất; bấm <b>▾</b> để xem đủ (máy nhớ lựa chọn). Nút logo Trợ lý tạm ẩn khi cuộn xuống, cuộn lên là hiện lại.</li>
        <li><b>Nút Quay lại</b> của điện thoại (hoặc vuốt lùi trên iPhone) đóng hộp thoại, Trợ lý, bài đang đọc – không thoát khỏi hệ thống.</li>
        <li><b>Đọc tài liệu:</b> trong bài có thanh trên cùng: <b>← Thư viện</b>, số thứ tự bài, <b>A− / A+</b> chỉnh cỡ chữ (máy nhớ cỡ chữ); cuối bài có <b>Bài trước / Bài sau</b>. Bảng rộng thì vuốt ngang trong bảng.</li>
        <li><b>Ma trận vị thế</b>: cột tên dính bên trái, vuốt ngang để xem các kỳ; ô có nền xanh nhạt là số lấy từ sổ – <b>bấm vào ô</b> để xem và sửa lệnh/hợp đồng tạo ra số đó.</li></ol>` },
    { id: 'hd-mua-chot-chua-giao', cat: 'hopdong', title: 'Hợp đồng mua đã chốt giá, chưa giao hàng', tags: 'hop dong mua chot gia chua giao hang duong vi the',
      sum: 'Công ty đã khóa giá mua nhưng chưa nhận hàng; số lượng được tính dương vào hàng thực.',
      body: `<p><b>Khái niệm:</b> công ty đã ký mua và đã biết giá cuối cùng, nhưng nhà cung cấp chưa giao/nhập kho.</p><p><b>Dấu trong ma trận: + (dương)</b> vì công ty đã có quyền nhận hàng với giá đã khóa; về rủi ro giá, đây là vị thế dư hàng.</p><p><b>Ví dụ:</b> mua 38,4 tấn giá cố định, chưa nhận → dòng này <b>+38,4 t</b>. Khi nhận đủ hàng, hợp đồng rời dòng này và hàng được phản ánh theo quy trình tồn kho.</p><p><b>Cần theo dõi:</b> hạn giao, rủi ro nhà cung cấp không giao và lệnh bán futures đã liên kết.</p>` },
    { id: 'hd-mua-giao-chua-chot', cat: 'hopdong', title: 'Hợp đồng mua đã giao hàng, chưa chốt giá', tags: 'hop dong mua giao hang chua chot gia ptbf diff',
      sum: 'Hàng đã về nhưng giá mua còn chạy theo sàn; chưa được coi là đã khóa giá hàng thực.',
      body: `<p><b>Khái niệm:</b> công ty đã nhận hàng theo hợp đồng trừ lùi/PTBF nhưng người bán chưa chốt giá London.</p><p><b>Dấu trong ma trận: + (dương)</b> theo lượng hàng công ty đã nhận nhưng còn rủi ro giá phải trả. Giá London tăng trước khi chốt thì giá mua thường tăng.</p><p><b>Ví dụ:</b> đã nhận 20 tấn, chưa chốt → dòng này <b>+20 t</b>. Chốt 8 tấn thì phần chưa chốt còn 12 tấn.</p><p><b>Cần theo dõi:</b> hạn chốt giá, kỳ tham chiếu và phòng hộ phù hợp với phần chưa chốt.</p>` },
    { id: 'hd-ban-chot-chua-giao', cat: 'hopdong', title: 'Hợp đồng bán đã chốt giá, chưa giao hàng', tags: 'hop dong ban chot gia chua giao hang am vi the short',
      sum: 'Công ty đã khóa giá bán nhưng chưa giao hàng; nghĩa vụ giao được tính âm vào hàng thực.',
      body: `<p><b>Khái niệm:</b> công ty đã bán với giá cuối cùng đã xác định, nhưng chưa giao đủ hàng cho khách.</p><p><b>Dấu trong ma trận: − (âm)</b> vì công ty đang có nghĩa vụ giao hàng; nếu chưa mua đủ hàng thì giá thị trường tăng gây bất lợi.</p><p><b>Ví dụ:</b> bán 38,4 tấn giá cố định, chưa giao → dòng này <b>−38,4 t</b>. Nếu đồng thời mua 38,4 tấn đã chốt chưa nhận thì hai dòng cân bằng về lượng.</p><p><b>Cần theo dõi:</b> nguồn hàng, lịch tàu/giao, kỳ phòng hộ và rủi ro khách hủy.</p>` },
    { id: 'hd-ban-giao-chua-chot', cat: 'hopdong', title: 'Hợp đồng bán đã giao hàng, chưa chốt giá', tags: 'hop dong ban giao hang chua chot gia ptbf diff am',
      sum: 'Hàng đã giao cho khách nhưng giá bán còn chạy theo sàn; phần chưa chốt vẫn mang rủi ro giá.',
      body: `<p><b>Khái niệm:</b> công ty đã giao hàng theo hợp đồng trừ lùi/PTBF nhưng khách chưa chốt giá London.</p><p><b>Dấu trong ma trận: − (âm)</b> vì hàng đã ra khỏi công ty nhưng doanh thu cuối cùng chưa khóa. Giá London giảm trước khi chốt thường làm giá bán giảm.</p><p><b>Ví dụ:</b> đã giao 30 tấn, khách mới chốt 10 tấn → dòng này còn <b>−20 t</b>.</p><p><b>Cần theo dõi:</b> hạn chốt của khách, kỳ tham chiếu và lệnh futures bảo vệ phần giá chưa chốt.</p>` },
    { id: 'cqg-la-gi', cat: 'cqg', title: 'CQG là gì và dùng phần nào cho phòng hộ cà phê?', tags: 'cqg desktop trader qtrader mobile domtrader mxv barchart',
      sum: 'CQG là nền tảng dữ liệu và chuyển lệnh; Futureprice quản trị hợp đồng/vị thế, còn CQG là nơi đặt và theo dõi lệnh thật.',
      body: `<p><b>CQG</b> cung cấp dữ liệu thị trường, biểu đồ, DOM và chuyển lệnh đến sàn. Tại Việt Nam, tài khoản và luồng tiền đi qua thành viên kinh doanh của MXV; không nộp tiền trực tiếp cho website Futureprice.</p>
        <table><tr><th>Công cụ</th><th>Dùng để làm gì</th></tr><tr><td>CQG Desktop</td><td>Chạy trên trình duyệt; xem bảng giá, biểu đồ, lệnh và vị thế.</td></tr><tr><td>CQG Trader/QTrader</td><td>Phần mềm máy tính; QTrader có phân tích và biểu đồ sâu hơn.</td></tr><tr><td>CQG Mobile</td><td>Theo dõi và xử lý lệnh trên điện thoại khi di chuyển.</td></tr><tr><td>DOMTrader</td><td>Thang giá bid/offer để đặt, sửa và hủy lệnh.</td></tr></table>
        <p><b>Phân vai:</b> Futureprice tính lượng cần phòng hộ và lưu liên kết hợp đồng; CQG đặt lệnh thật; báo cáo CQG/MXV và xác nhận môi giới là chứng từ đối chiếu cuối cùng.</p>
        <p><b>Nguồn học:</b> <a href="https://help.cqg.com/cqgic/25/Documents/domtrader.htm" target="_blank" rel="noopener">CQG DOMTrader</a> · <a href="https://mxv.com.vn/giao-dich/quy-trinh-mo-tai-khoan-i1.html" target="_blank" rel="noopener">hướng dẫn phần mềm của MXV</a> · <a href="https://hanghoa.anfin.vn/blog/cqg-la-gi/" target="_blank" rel="noopener">bài tổng quan CQG</a>.</p>` },
    { id: 'cqg-phim-dieu-khien', cat: 'cqg', title: 'CQG DOMTrader: nút và phím điều khiển cần biết', tags: 'cqg domtrader phim tat keyboard buy sell cancel delete home limit market bid offer',
      sum: 'Bảng nút/phím cơ bản kèm nguyên tắc an toàn: focus đúng cửa sổ, kiểm tra loại lệnh và tập trên demo trước.',
      body: `<table><tr><th>Thao tác mặc định</th><th>Ý nghĩa</th></tr><tr><td>↑ / ↓</td><td>Di chuyển chọn mức giá trên DOM.</td></tr><tr><td>←</td><td>Mua; cách đặt Market/Limit phụ thuộc chế độ đang chọn.</td></tr><tr><td>→</td><td>Bán; phải nhìn rõ chế độ và mức giá trước khi bấm.</td></tr><tr><td>Alt + ← / →</td><td>Đặt tại best bid / best offer theo cấu hình mặc định.</td></tr><tr><td>Home hoặc Esc</td><td>Trở về Market Order mode.</td></tr><tr><td>Delete</td><td>Hủy lệnh Working đang được chọn.</td></tr><tr><td>Ctrl + Home</td><td>Đưa thang giá về vùng giá thị trường.</td></tr></table>
        <p><b>Cảnh báo:</b> phím có thể được người dùng cấu hình lại và chỉ tác động lên cửa sổ đang focus. Market mode và price-browse mode có thể cho kết quả khác nhau dù cùng phím. Luôn bật xác nhận lệnh khi mới sử dụng và tập bằng tài khoản demo.</p>
        <p>Nguồn: <a href="https://www.cqg.com/sites/default/files/archive/docs/KeyboardShortcuts.pdf" target="_blank" rel="noopener">CQG Keyboard Shortcuts</a> và <a href="https://help.cqg.com/cqgic/25/Documents/keyboardkeyspreferences.htm" target="_blank" rel="noopener">Keyboard Keys Preferences</a>.</p>` },
    { id: 'cqg-demo-mua-bao-hiem', cat: 'cqg', title: 'Demo online: MUA futures để bảo hiểm hợp đồng bán', tags: 'demo online cqg mua futures long bao hiem hop dong ban thao tac domtrader',
      sum: 'Mô phỏng từ hợp đồng bán 38,4 tấn → tính 4 lot → đặt lệnh MUA CQG → xác nhận khớp → ghi vào Futureprice.',
      body: `<div class="cqg-demo"><div class="cqg-demo-head"><b>DEMO CQG · KHÔNG ĐẶT LỆNH THẬT</b><span>RMF27 · Robusta London</span></div>
        <div class="cqg-demo-grid"><div><small>Tài khoản</small><b>DEMO-VT</b></div><div><small>Số lượng</small><b>4 lot</b></div><div><small>Loại lệnh</small><b>LIMIT</b></div><div><small>Giá đặt</small><b>3.450 USD/t</b></div></div>
        <div class="cqg-dom"><div class="sell">SELL</div><div class="price"><span>3.452</span><b>3.451</b><strong>3.450</strong><span>3.449</span></div><div class="buy">BUY 4</div></div>
        <div class="cqg-demo-foot">Trạng thái minh họa: <b>WORKING → FILLED</b> · Ký quỹ khả dụng phải được kiểm tra trước lệnh</div></div>
        <h3>Tình huống</h3><p>Công ty đã <b>BÁN 38,4 tấn giá cố định</b> nhưng chưa mua đủ hàng. Vị thế hàng thực là <b>−38,4 tấn</b>; giá tăng sẽ làm chi phí mua hàng tăng. Phòng hộ tham khảo: <b>MUA 4 lot Robusta</b> (4 × 10 = 40 tấn), còn lệch +1,6 tấn.</p>
        <h3>Các bước trên CQG online</h3><ol><li><b>Đăng nhập đúng tài khoản:</b> mở CQG Desktop/Trader từ đường dẫn do thành viên MXV cung cấp; kiểm tra tên tài khoản và trạng thái kết nối.</li>
        <li><b>Chọn đúng mã:</b> chọn Robusta London và kỳ tham chiếu của hợp đồng, ví dụ <b>LRCF27/RMF27</b>. Không chọn nhầm Arabica hoặc kỳ khác.</li>
        <li><b>Kiểm tra tiền:</b> xem Available/Excess Margin; bảo đảm đủ ký quỹ, phí và quỹ dự phòng khi giá đi ngược chiều.</li>
        <li><b>Nhập số lượng:</b> 38,4 ÷ 10 = 3,84 → làm tròn theo quy định nội bộ thành <b>4 lot</b>. Kiểm tra lại đơn vị trước khi gửi.</li>
        <li><b>Chọn loại lệnh:</b> LIMIT nếu muốn kiểm soát giá; MARKET chỉ khi cần khớp ngay và chấp nhận trượt giá. Demo dùng <b>BUY 4 LIMIT 3.450</b>.</li>
        <li><b>Kiểm tra lần cuối:</b> Account · BUY · LRCF27 · 4 lots · LIMIT · 3.450. Bật cửa sổ xác nhận lệnh khi đang học.</li>
        <li><b>Gửi và theo dõi:</b> trạng thái <b>Working</b> nghĩa là chưa khớp; <b>Filled</b> mới là đã khớp. Partial Fill phải ghi đúng số lot đã khớp. Rejected cần đọc lý do, không bấm gửi liên tục.</li>
        <li><b>Ghi vào Futureprice:</b> Giao dịch → Hàng ảo → Lệnh sàn mới; chọn <b>MUA, 4 lot, RMF27</b>, nhập ngày/giá khớp và liên kết hợp đồng bán. Chỉ chọn “Đã khớp” khi CQG báo Filled.</li>
        <li><b>Đóng bảo hiểm:</b> khi đã mua hàng thật/chốt xong rủi ro, thực hiện lệnh đối ứng theo phê duyệt; đối chiếu CQG, Futureprice và xác nhận môi giới cuối ngày.</li></ol>
        <h3>Tự đặt CQG hay nhờ broker?</h3>
        <table><tr><th>Tình huống</th><th>Cách làm phù hợp</th><th>Lý do</th></tr>
        <tr><td>Lệnh phòng hộ thông thường; đúng mã, đúng kỳ; tài khoản đủ tiền; người đặt đã được phân quyền</td><td><b>Tự đặt trên CQG</b></td><td>Nhanh, chủ động giá Limit và theo dõi Working/Filled trực tiếp.</td></tr>
        <tr><td>Lần đầu giao dịch thật hoặc chưa chắc chiều MUA/BÁN, mã kỳ, loại lệnh</td><td><b>Gọi broker trước khi gửi</b></td><td>Nhờ đọc lại phiếu lệnh; không dùng lệnh thật để học.</td></tr>
        <tr><td>Không đăng nhập được, CQG mất kết nối, treo màn hình, lệnh Rejected hoặc trạng thái không rõ</td><td><b>Gọi broker ngay</b></td><td>Không gửi lặp vì có thể tạo lệnh trùng; broker kiểm tra trạng thái tại hệ thống thành viên.</td></tr>
        <tr><td>Lệnh lớn, thị trường biến động mạnh, thanh khoản mỏng hoặc cần khớp nhiều phần</td><td><b>Broker hỗ trợ chiến thuật</b></td><td>Thống nhất cách chia lệnh, giới hạn trượt giá và thứ tự thực hiện trước khi vào lệnh.</td></tr>
        <tr><td>Sát FND/đáo hạn, cần đảo kỳ, spread, EFP hoặc xử lý giao nhận</td><td><b>Bắt buộc phối hợp broker/người quản trị rủi ro</b></td><td>Nghiệp vụ phức tạp, có rủi ro sai kỳ và phát sinh nghĩa vụ giao nhận vật chất.</td></tr>
        <tr><td>Thiếu ký quỹ, margin call, số dư Available bất thường</td><td><b>Không tự gửi thêm; gọi broker và kế toán</b></td><td>Xác minh tiền, hạn nộp và phương án giảm vị thế trước khi hành động.</td></tr></table>
        <h3>Quy tắc “hai người kiểm tra” trước lệnh thật</h3>
        <p>Người nhập đọc thành tiếng: <b>tài khoản → MUA → LRCF27/RMF27 → 4 lot → LIMIT → 3.450</b>. Người duyệt đối chiếu hợp đồng bán 38,4 tấn và trả lời “đúng” trước khi bấm Send. Sau khi gửi, chụp/xuất xác nhận và đọc lại <b>Order ID, Filled quantity, Average price</b>.</p>
        <h3>Khi gọi broker phải nói gì?</h3>
        <p>Mẫu ngắn: “Tài khoản … cần <b>MUA 4 lot Robusta LRCF27</b> để phòng hộ hợp đồng bán 38,4 tấn; lệnh <b>Limit 3.450</b>; hiệu lực trong ngày. Nhờ anh/chị đọc lại toàn bộ lệnh và chỉ thực hiện sau khi tôi xác nhận.” Broker phải đọc lại tài khoản, chiều, mã, số lot, loại lệnh, giá và hiệu lực. Không nhắn mỗi câu “mua giúp 4 lot”.</p>
        <h3>Nếu thao tác sai hoặc nghi lệnh trùng</h3>
        <ol><li>Dừng bấm, không gửi thêm và không tự đặt lệnh ngược để “sửa”.</li><li>Mở Orders/Working Orders kiểm tra Order ID và trạng thái.</li><li>Gọi broker, báo giờ gửi – mã – chiều – số lot – giá; yêu cầu xác nhận lệnh nào đang Working/Filled.</li><li>Chỉ Cancel/Replace hoặc đặt lệnh đối ứng sau khi người có thẩm quyền duyệt.</li><li>Ghi đúng kết quả cuối cùng vào Futureprice và lập ghi chú sự cố.</li></ol>
        <p><b>Nguyên tắc:</b> hệ thống chỉ tính và hướng dẫn; người có thẩm quyền mới được gửi lệnh thật. Thực hành trên tài khoản demo trước, không dùng phím nhanh khi chưa quen.</p>` },
    { id: 'cqg-loi-lenh-mua-hedging', cat: 'cqg', title: 'Các lỗi khi đặt lệnh MUA phòng hộ trên CQG và cách xử lý', tags: 'cqg loi dat lenh mua hedging hedge rejected partial fill working duplicate sai ma sai ky margin disconnect cancel replace',
      sum: 'Bảng xử lý nhanh khi sai chiều, sai kỳ, chưa khớp, khớp một phần, bị từ chối, mất kết nối hoặc nghi lệnh trùng.',
      body: `<p><b>Quy tắc khẩn cấp:</b> khi chưa biết chính xác trạng thái lệnh, <b>dừng bấm – không gửi lại – không tự đặt lệnh ngược</b>. Mở Orders/Positions, ghi Order ID và gọi broker xác minh. “Không thấy trên DOM” không có nghĩa là lệnh chưa vào sàn.</p>
        <table><tr><th>Lỗi / dấu hiệu</th><th>Rủi ro</th><th>Cách xử lý an toàn</th></tr>
        <tr><td><b>Nhầm SELL thay vì BUY</b></td><td>Làm vị thế thiếu hàng âm thêm thay vì bảo hiểm.</td><td>Không tự bấm BUY gấp đôi. Kiểm tra Filled quantity/giá; báo người duyệt và broker. Nếu đã Filled, chỉ đặt lệnh sửa sai theo phê duyệt và ghi riêng giao dịch lỗi.</td></tr>
        <tr><td><b>Đúng BUY nhưng sai kỳ hạn</b></td><td>Hở spread; giá kỳ mua không chạy cùng hợp đồng hàng thật.</td><td>Kiểm tra kỳ tham chiếu trên hợp đồng. Nếu Working: Cancel và chờ trạng thái Canceled. Nếu Filled: xin duyệt kế hoạch đóng kỳ sai và mở kỳ đúng; không tự roll.</td></tr>
        <tr><td><b>Nhập nhầm số lot</b></td><td>Phòng hộ thiếu hoặc dư lớn; 1 lot Robusta = 10 tấn.</td><td>Nếu Working, Replace số lượng rồi chờ Replaced. Nếu Partial/Filled, lấy CumQty và LeavesQty để tính phần còn thiếu/dư trước khi xử lý.</td></tr>
        <tr><td><b>Nhầm Market thay vì Limit</b></td><td>Khớp ngay và có thể trượt giá mạnh.</td><td>Nếu đã Filled thì không thể hủy; lưu Average price và báo ngay. Nếu vẫn Pending/Working, không giả định đã hủy cho đến khi CQG xác nhận Canceled.</td></tr>
        <tr><td><b>Working tưởng là Filled</b></td><td>Ghi Futureprice sai, tưởng đã được bảo hiểm nhưng lệnh vẫn chờ.</td><td>Working = được nhận nhưng chưa khớp hết. Chỉ ghi “Đã khớp” theo Filled quantity; phần LeavesQty vẫn còn treo.</td></tr>
        <tr><td><b>Partial Fill</b></td><td>Chỉ một phần lot được bảo hiểm; phần còn lại vẫn hở.</td><td>Ghi CumQty, Average price và LeavesQty. Quyết định giữ, sửa giá hoặc hủy phần còn lại theo phê duyệt; không nhập toàn bộ số đặt là đã khớp.</td></tr>
        <tr><td><b>Rejected / Exception</b></td><td>Lệnh không hoạt động nhưng người dùng có thể tưởng đã gửi.</td><td>Đọc nguyên văn lý do trong Exceptions: sai symbol, loại lệnh không hỗ trợ, không được cấp quyền, vượt hạn mức hoặc không đủ tiền. Sửa nguyên nhân; không gửi lặp.</td></tr>
        <tr><td><b>Pending New / Pending Cancel / Pending Replace</b></td><td>Yêu cầu đang truyền, kết quả cuối chưa rõ.</td><td>Chờ trạng thái cuối. Không đóng cửa sổ, không gửi yêu cầu thứ hai. Pending Cancel vẫn có thể khớp trước khi việc hủy được xác nhận.</td></tr>
        <tr><td><b>Disconnected / CQG treo hoặc mất mạng</b></td><td>Lệnh có thể vẫn còn trên gateway/sàn.</td><td>Chụp giờ xảy ra lỗi, dùng kênh khác gọi broker, cung cấp tài khoản và Order ID; yêu cầu đọc lại toàn bộ Working/Filled trước khi thao tác tiếp.</td></tr>
        <tr><td><b>Nghi bấm hai lần / lệnh trùng</b></td><td>Mua gấp đôi số lot cần phòng hộ.</td><td>Lọc Orders theo tài khoản, mã và giờ; so từng Order ID. Broker xác nhận lệnh nào Working/Filled rồi mới hủy phần dư.</td></tr>
        <tr><td><b>Cancel/Replace bị từ chối</b></td><td>Lệnh cũ có thể vẫn Working hoặc vừa Filled.</td><td>Quay lại order chain, kiểm tra trạng thái lệnh gốc. Không coi yêu cầu sửa/hủy là thành công nếu chưa thấy Replaced/Canceled.</td></tr>
        <tr><td><b>Không đủ ký quỹ / vượt hạn mức</b></td><td>Lệnh bị từ chối hoặc tài khoản có nguy cơ margin call.</td><td>Dừng lệnh; gọi broker và kế toán xác nhận Available/Excess Margin, hạn nộp và hạn mức. Không nạp vào tài khoản nhận từ tin nhắn lạ.</td></tr>
        <tr><td><b>GTC/DAY hoặc thời hạn sai</b></td><td>Lệnh còn treo sang phiên sau hoặc hết hiệu lực sớm.</td><td>Kiểm tra Time in Force trên phiếu lệnh và danh sách Working cuối ngày; hủy lệnh không còn nhu cầu và chờ xác nhận Canceled.</td></tr>
        <tr><td><b>Sát FND/đáo hạn</b></td><td>Có thể phát sinh nghĩa vụ giao nhận vật chất.</td><td>Không tự giữ hoặc đảo kỳ. Phối hợp broker/người quản trị rủi ro trước hạn nội bộ; đối chiếu lịch MXV cho đúng mã.</td></tr></table>
        <h3>Checklist gọi broker trong 30 giây</h3><ol><li>Tên/mã tài khoản.</li><li>Giờ thao tác gần đúng.</li><li>Mã hợp đồng và kỳ hạn.</li><li>BUY/SELL, số lot, loại lệnh, giá.</li><li>Order ID và trạng thái đang thấy.</li><li>Yêu cầu broker đọc lại: Working quantity, Filled quantity, Average price và Leaves quantity.</li></ol>
        <h3>Sau khi xử lý</h3><ul><li>Đối chiếu CQG/MXV với Futureprice; chỉ ghi số lot thực sự Filled.</li><li>Lưu xác nhận lệnh, người duyệt và trao đổi với broker.</li><li>Ghi nguyên nhân – thiệt hại/trượt giá – biện pháp ngăn tái diễn; không xóa dấu vết giao dịch lỗi.</li></ul>
        <p>Nguồn đối chiếu trạng thái: <a href="https://help.cqg.com/cqgic/25/Documents/ordersandpositionsorderpane.htm" target="_blank" rel="noopener">CQG Orders and Positions</a>, <a href="https://help.cqg.com/apihelp/Documents/executionreportconfirmationacknowledgement8.htm" target="_blank" rel="noopener">CQG Execution Report</a> và <a href="https://help.cqg.com/cqgic/25/Documents/modifyingandcancellingordersonorderticket.htm" target="_blank" rel="noopener">CQG Modify/Cancel Orders</a>.</p>` },
    { id: 'barchart-volume-oi', cat: 'cqg', title: 'Đọc Barchart: giá, Volume và Open Interest', tags: 'barchart volume open interest oi hd mo gia tin hieu dong tien',
      sum: 'Volume là giao dịch trong phiên; Open Interest là số hợp đồng còn mở. Kết hợp hai số để mô tả dòng tiền, không dùng riêng lẻ để ra lệnh.',
      body: `<ul><li><b>Last/Change:</b> giá gần nhất và thay đổi so với phiên trước.</li><li><b>Volume:</b> số hợp đồng đã giao dịch trong phiên; volume cao cho thấy hoạt động mạnh nhưng không cho biết riêng bên mua hay bán thắng.</li><li><b>Open Interest (OI):</b> số hợp đồng còn mở, thường được xác nhận theo phiên và có thể trễ so với giá intraday.</li></ul>
        <table><tr><th>Giá</th><th>OI</th><th>Cách đọc tham khảo</th></tr><tr><td>↑</td><td>↑</td><td>Tiền mới vào chiều tăng</td></tr><tr><td>↓</td><td>↑</td><td>Tiền mới vào chiều giảm</td></tr><tr><td>↑</td><td>↓</td><td>Có thể mua bù vị thế bán</td></tr><tr><td>↓</td><td>↓</td><td>Có thể thanh lý vị thế mua</td></tr></table>
        <p><b>Quy trình:</b> chọn đúng mã/kỳ hạn → so ít nhất hai phiên → xem Volume/OI → đối chiếu spread và COT → quay lại nhu cầu phòng hộ của công ty. Không gọi một biến động đơn lẻ là “cá mập mua/bán”.</p>
        <p>Nguồn: <a href="https://www.barchart.com/education/technical-indicators/open_interest" target="_blank" rel="noopener">Barchart Open Interest</a>. Trên Futureprice, thẻ 🔬 Nghiên cứu thực hiện phép so sánh này theo từng kỳ hạn.</p>` },
    { id: 'cqg-quy-trinh-chot', cat: 'cqg', title: 'CQG: quy trình chốt giá và kiểm soát lệnh', tags: 'cqg domtrader dat lenh limit market stop huy sua chot gia mxv',
      sum: 'Checklist an toàn từ nhu cầu phòng hộ → kiểm tra tiền → đặt lệnh CQG → xác nhận khớp → ghi vào hệ thống.',
      body: `<ol><li><b>Xác định nhu cầu thật:</b> hợp đồng nào, chiều mua/bán, kỳ tham chiếu, số tấn; Robusta 1 lot = 10 tấn. Hệ thống đề xuất số lot nhưng người phụ trách phải duyệt.</li>
        <li><b>Kiểm tra trước lệnh:</b> đúng tài khoản, đúng mã kỳ hạn, số lot, chiều, loại lệnh; kiểm tra Available/Excess Margin và quỹ dự phòng.</li>
        <li><b>Đặt trên CQG:</b> ưu tiên lệnh giới hạn khi không cần khớp tức thời; Market có thể trượt giá. DOMTrader hiển thị thang giá, bid/offer và lệnh chờ.</li>
        <li><b>Xác nhận:</b> xem trạng thái Working/Filled/Rejected; chỉ khi Filled mới bấm ✔ Khớp trong Sổ lệnh Futureprice và nhập giá khớp thật.</li>
        <li><b>Đối chiếu cuối phiên:</b> CQG/MXV ↔ Futureprice ↔ xác nhận môi giới; sai số phải xử lý ngay. Theo dõi ký quỹ và FND mỗi ngày.</li></ol>
        <p><b>Phím CQG mặc định thường gặp:</b> ↑/↓ chọn giá; ← mua, → bán; Alt+←/→ tại bid/offer; Home về Market mode; Delete hủy lệnh đang chọn. Phím có thể được cấu hình khác và phụ thuộc cửa sổ đang focus — phải tập bằng tài khoản demo trước.</p>
        <p><b>Nguồn:</b> tài liệu DOMTrader/Keyboard Keys của CQG và hướng dẫn phần mềm của MXV. Không thao tác phím nhanh trên tài khoản thật khi chưa được công ty/môi giới đào tạo.</p>` },
    { id: 'cqg-tien-ky-quy', cat: 'cqg', title: 'Tiền cần chuẩn bị cho 1 lot và quy trình nộp tiền', tags: 'cqg mxv ky quy tien 1 lot nap tien phi giao dich margin call robusta',
      sum: 'Không lấy giá hợp đồng làm số tiền phải nộp; cần ký quỹ ban đầu + phí + quỹ dự phòng biến động, theo mức MXV/thành viên đang áp dụng.',
      body: `<p><b>Công thức quản trị:</b> tiền chuẩn bị cho 1 lot = <b>ký quỹ ban đầu hiện hành</b> + phí mở/đóng lệnh + phí dữ liệu/phần mềm phân bổ + <b>quỹ dự phòng biến động</b>.</p>
        <ul><li>Mức ký quỹ và biểu phí thay đổi theo sản phẩm, thời điểm và thành viên kinh doanh; lấy số chính thức trong CQG/MXV hoặc xác nhận môi giới trước khi đặt lệnh.</li>
        <li>Với Robusta, giá biến động 1 USD/tấn làm P/L thay đổi khoảng <b>10 USD/lot</b>. Dự phòng kịch bản +300 đến +500 USD/tấn khi đang bán futures tương ứng khoảng 3.000–5.000 USD/lot, ngoài ký quỹ bắt buộc.</li>
        <li>Nộp tiền đúng tài khoản ngân hàng do thành viên MXV cung cấp; ghi đúng nội dung/mã tài khoản; lưu chứng từ; chờ tiền hiện trong Available Margin rồi mới giao dịch.</li>
        <li>Không chuyển tiền theo số tài khoản nhận qua tin nhắn lạ. Khi thiếu ký quỹ: nộp thêm hoặc giảm vị thế theo quy định nội bộ, không chờ đến sát hạn.</li></ul>
        <p><b>Biểu phí:</b> vào website MXV và thành viên đang mở tài khoản để lấy bản mới nhất; số trên bài viết bên ngoài chỉ dùng tham khảo vì có thể đã đổi.</p>` },
    { id: 'quy-trinh-ghi-giao-dich', cat: 'huongdan', title: 'Quy trình ghi hợp đồng, phòng hộ và giao hàng', tags: 'quy trinh ghi hop dong hedge lenh cho khop ke hoach giao hang sua nhanh ma tran',
      sum: 'Ký hợp đồng → ghi sổ → 🛡️ Hedge tạo lệnh chờ → khớp trên sàn thì bấm ✔ Khớp → ghi lịch giao → giao xong thì xác nhận.',
      body: `<ol><li><b>Ký hợp đồng:</b> thẻ 📒 Giao dịch → <b>➕ Hợp đồng mới</b> (mua/bán, giá cố định hoặc trừ lùi, số tấn, kỳ tham chiếu). Vị thế tự cập nhật.</li>
        <li><b>Phòng hộ:</b> bấm <b>🛡️ Hedge</b> trên hợp đồng → hệ thống đề xuất số lot và kỳ hạn, ghi thành <b>⏳ lệnh chờ</b> (chưa tính vào vị thế).</li>
        <li><b>Khi lệnh khớp trên sàn:</b> bấm <b>✔ Khớp</b>, sửa ngày và giá khớp thực tế → lúc này mới tính vào vị thế sàn. Chưa đặt lệnh thì để nguyên lệnh chờ hoặc xóa.</li>
        <li><b>Lịch giao hàng:</b> bấm <b>🚚 Giao</b>, ghi ngày tàu dự kiến – ngày sau hôm nay là <b>🗓 kế hoạch</b>, hợp đồng vẫn tính là chưa giao; giao xong bấm <b>✔ Đã giao hôm nay</b> (hoặc để tới ngày hệ thống tự tính).</li>
        <li><b>Hợp đồng trừ lùi:</b> bấm <b>🔒 Chốt</b> mỗi lần chốt giá (số tấn + giá London lúc chốt).</li>
        <li><b>Kiểm tra:</b> thẻ 📈 Tổng quan – dòng vàng <b>TỔNG VỊ THẾ RÒNG</b>: âm = đang thiếu hàng (giá tăng là lỗ), dương = dư hàng (giá giảm là lỗ). Số nào sai → bấm vào ô đó ở thẻ Vị thế để sửa ngay.</li></ol>
        <p>Ví dụ: bán 38,4 t giá chốt 3.800 FOB, chưa mua hàng, chưa mua sàn → <b>−38,4 t</b>. Mua 4 lot cùng kỳ khớp xong → còn khoảng <b>+1,6 t</b>.</p>` }
  ]
};

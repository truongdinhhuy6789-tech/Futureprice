// VIỆT THIÊN COFFEE GROUP — THƯ VIỆN KIẾN THỨC NỀN (giá cả, chất lượng, hợp đồng, phòng hộ, quản trị vị thế, thị trường, tư vấn)
// Thêm bài mới: chép một khối { id, cat, title, tags, sum, body } và sửa nội dung. id viết liền không dấu, không trùng.
// cat phải là một trong các nhóm ở "cats". body là HTML đơn giản (<p>, <ul><li>, <b>, <table>).
window.VTKnowledge = {
  cats: [
    ['gia', '💲 Giá & quy đổi'], ['chatluong', '📏 Chất lượng'], ['hopdong', '📝 Hợp đồng & chốt giá'], ['phongho', '🛡️ Phòng hộ & sàn'],
    ['vithe', '⚖️ Quản trị vị thế'], ['thitruong', '🌦️ Phân tích thị trường'], ['tuvan', '🎯 Tư vấn & nguyên tắc'], ['thuatngu', '📖 Thuật ngữ']
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
        <li>Hệ thống lấy tự động giá trung bình Tây Nguyên và giá các tỉnh giacaphe.com công bố công khai (thẻ 🌐 Bảng giá).</li></ul>` },
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
        <li>Trên hệ thống: hai tài khoản đang theo dõi là HD Bank và PFS092 (phần 📉 Hàng ảo).</li></ul>` },

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
        <li><b>📉 Hàng ảo</b>: mỗi lệnh MUA/BÁN lot ở kỳ hạn, tài khoản HD Bank/PFS092 → tự đổ vào dòng Robusta sàn.</li>
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
        <tr><td><b>WP (Wet Polished)</b></td><td>Đánh bóng ướt</td></tr></table>` }
  ]
};

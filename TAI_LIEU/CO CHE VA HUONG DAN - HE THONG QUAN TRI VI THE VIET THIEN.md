# VIỆT THIÊN COFFEE GROUP – HỆ THỐNG QUẢN TRỊ VỊ THẾ HÀNG THỰC & PHÒNG HỘ SÀN

## Cơ chế hoạt động và hướng dẫn sử dụng

*Phiên bản 2.0 – tháng 10/2026. Phòng Kinh doanh Xuất khẩu.*
*Hệ thống được xây lại từ bản thử nghiệm "LDC Coffee Tracker" (mô hình ma trận vị thế tham chiếu Louis Dreyfus).*

---

## 1. Hệ thống dùng để làm gì

Hệ thống trả lời một câu hỏi sống còn của doanh nghiệp xuất khẩu cà phê:

> **Ở từng kỳ hạn giao hàng, công ty đang dư hay thiếu bao nhiêu tấn có rủi ro giá, và cần làm gì để về vùng an toàn?**

Muốn trả lời, hệ thống gom 3 nguồn vị thế:

1. **Hàng thực:** tồn kho và các hợp đồng mua/bán.
2. **Vị thế sàn (futures):** lệnh futures Robusta London (và Arabica New York nếu có).
3. **Hợp đồng trừ lùi chưa chốt giá:** Diff/PTBF.

Từ đó hệ thống tính **tổng vị thế ròng** cho từng kỳ hạn Robusta London, rồi đưa ra:
- cảnh báo rủi ro;
- số lot cần phòng hộ;
- giá FOB tính từ mức trừ lùi.

---

## 2. Khởi động và dừng

| Việc | Cách làm |
|---|---|
| Bật hệ thống | Nháy đúp `CHAY_HE_THONG.bat`. Trình duyệt tự mở **http://localhost:3456**. Một cửa sổ thu nhỏ "VIET THIEN - SERVER" chạy nền. |
| Tắt hệ thống | Nháy đúp `DUNG_HE_THONG.bat`, hoặc đóng cửa sổ "VIET THIEN - SERVER". |
| Mở thẳng Trợ lý | **http://localhost:3456/#tro-ly** |
| Máy khác trong mạng LAN | **http://&lt;IP máy chạy&gt;:3456** |
| Yêu cầu | Máy cài **Node.js** (https://nodejs.org). Không cần cài thêm thư viện. |

---

## 3. Cấu trúc thư mục

```
VIET THIEN COFFEE GROUP - HE THONG QUAN TRI VI THE\
├─ CHAY_HE_THONG.bat          bật hệ thống
├─ DUNG_HE_THONG.bat          tắt hệ thống
├─ TAI_LIEU\                  tài liệu này
└─ app\
   ├─ server.js               máy chủ web + API + lấy giá sàn
   ├─ telegram_bot.js         bot Telegram (cảnh báo giá, lệnh tra cứu)
   ├─ test_engine.js          kiểm thử công thức: node test_engine.js
   ├─ data\
   │  ├─ position_data.json   SỐ LIỆU VỊ THẾ (quan trọng – nên sao lưu)
   │  └─ bot_config.json      cấu hình bot (chứa token – không chia sẻ)
   └─ public\                 giao diện
      ├─ index.html, style.css, assets\logo-vietthien.png
      ├─ engine.js            ★ toàn bộ công thức (web và bot cùng dùng)
      ├─ app.js               xử lý giao diện
      └─ assistant.js         Trợ lý: phân tích, hướng dẫn, cơ chế, hỏi đáp
```

---

## 4. Ma trận vị thế – cơ chế tính

### 4.1. Cột = kỳ hạn Robusta London
- Sàn London có 6 tháng giao hàng: **F**(1) · **H**(3) · **K**(5) · **N**(7) · **U**(9) · **X**(11).
- Ma trận hiển thị **6 kỳ hạn kế tiếp** tính từ tháng hiện tại. Ví dụ tháng 10/2026: X26, F27, H27, K27, N27, U27.
- Số liệu được lưu theo **mã kỳ hạn** (ví dụ `N27`), không theo vị trí cột. Nhờ vậy khi chuyển kỳ hạn, số liệu không bị lệch tháng.
- Khi kỳ hạn đầu tiên đến tháng giao hàng, hệ thống hiện **banner vàng** và tô vàng cột đó. Lúc này bấm **🔁 Chuyển kỳ hạn**:
  - Hệ thống liệt kê các số liệu ở kỳ cũ sắp bị loại để bạn xác nhận.
  - Các kỳ còn lại giữ nguyên số.

### 4.2. Quy ước dấu
- **Mua / Long / hàng đang có = số dương.**
- **Bán / Short = số âm.**

Trợ lý sẽ cảnh báo khi một dòng "bán" có số dương, hoặc dòng "mua" có số âm.

### 4.3. Các khối và công thức

| Khối | Dòng nhập liệu | Công thức tổng của khối |
|---|---|---|
| **Hàng thực** | Tồn kho (không gồm hàng gởi); HĐ mua đã chốt giá chưa giao; HĐ mua đã giao chưa chốt giá; HĐ bán đã chốt giá chưa giao; HĐ bán đã giao chưa chốt giá | **Vị thế hàng thực** = tổng 5 dòng |
| **Phòng hộ trên sàn** | Futures Robusta London (tự lấy từ sổ lệnh sàn); Futures Arabica New York (nhập tay) – đơn vị tấn, 1 lot Robusta = 10 t | **Vị thế sàn** = tổng 2 dòng |
| **Trừ lùi** | HĐ mua trừ lùi chưa chốt giá; HĐ bán trừ lùi chưa chốt giá | **Vị thế trừ lùi** = tổng 2 dòng |
| ⭐ **Dòng vàng** | | **TỔNG VỊ THẾ RÒNG = Hàng thực + Sàn + Trừ lùi** |
| Theo dõi | Mua gởi, bán gởi chưa chốt giá; Spread lots | **Không** cộng vào tổng vị thế (chỉ để theo dõi) |

- **Ô lấy từ sổ (📒 hợp đồng, 📉 lệnh sàn):** bấm vào ô để xem các hợp đồng/lệnh tạo ra số đó và sửa ngay tại chỗ (sửa, xóa, chuyển lệnh thành "chưa khớp", ghi lệnh mới).
- **Lệnh chờ (⏳ chưa khớp):** lệnh mới đặt hoặc dự kiến, **không** tính vào vị thế, sổ lệnh và lãi/lỗ. Khi lệnh khớp trên sàn, bấm **✔ Khớp** và sửa giá khớp thực tế. Nút 🛡️ Hedge trên hợp đồng mặc định ghi thành lệnh chờ.
- **Kế hoạch giao (🗓):** lần giao/nhận ghi ngày **sau hôm nay** là lịch tàu dự kiến, hợp đồng vẫn tính là chưa giao. Tới ngày đó hệ thống mới tính là đã giao; bấm **✔ Đã giao hôm nay** nếu giao sớm, hoặc sửa ngày nếu tàu đổi lịch.
- Ví dụ: bán 38,4 t giá chốt 3.800 USD/t FOB, chưa mua hàng, chưa mua sàn → **−38,4 t (SHORT): giá tăng là lỗ**. Phòng hộ = MUA 4 lot cùng kỳ tham chiếu; khi lệnh khớp, dòng vàng về khoảng +1,6 t.

- **Cách đọc dòng vàng:**
  - **Âm (SHORT):** hụt hàng. Giá tăng thì lỗ.
  - **Dương (LONG):** dư hàng. Giá giảm thì lỗ.
  - **Bằng 0 (SQUARE):** cân bằng.
- **Ví dụ** (bộ dữ liệu mẫu, nút "Nạp dữ liệu mẫu"):

  | Kỳ hạn | 1 | 2 | 3 | 4 |
  |---|---|---|---|---|
  | Vị thế hàng thực (tấn) | +658 | −13,76 | −228,53 | −513,82 |

  Tổng vị thế ròng = **−98,11 tấn (SHORT)**.

---

## 5. Đo lường rủi ro và khuyến nghị phòng hộ

| Chỉ tiêu | Cơ chế |
|---|---|
| **Lời/lỗ danh nghĩa (MTM)** | Tổng vị thế ròng × bước giá. Bước giá mặc định 30 USD/tấn, chỉnh được. Ví dụ −98,11 t × 30 = **−2.943 USD** nếu London tăng 30$. |
| **Kỳ hạn rủi ro nhất** | Kỳ hạn có vị thế ròng lớn nhất theo trị tuyệt đối. |
| **Khuyến nghị phòng hộ** | Kỳ hạn nào có \|vị thế\| > **hạn mức** (mặc định 200 t/kỳ) thì được khuyến nghị: **Số lot = \|vị thế\| ÷ 10** (làm tròn). Vị thế âm → **MUA LONG**; dương → **BÁN SHORT**. |
| **Cảnh báo lệch kỳ hạn** | Cùng lúc có kỳ dư > ½ hạn mức và kỳ hụt < −½ hạn mức. Rủi ro chi phí đảo kỳ (roll) khi spread dãn. |

**Sau khi đặt lệnh hedge thành công:** nhập số tấn vào dòng tài khoản sàn tương ứng (mua long nhập +, bán short nhập −). Vị thế ròng kỳ đó sẽ giảm về gần 0.

---

## 6. Spread kỳ hạn
- **Spread = Giá kỳ gần − Giá kỳ xa.** Tính tự động từ giá sàn trực tuyến, cho từng cặp kỳ hạn liên tiếp đang hiển thị.
- **Dương = Inverted (nghịch đảo):** hàng giao gần đắt hơn. Giữ tồn kho qua kỳ sau bị thiệt, nên ưu tiên bán hoặc giao sớm.
- **Âm = Contango (bình thường):** kỳ xa cao hơn. Có thể giữ hàng nếu chi phí lưu kho thấp hơn mức chênh lệch.
- Kỳ hạn nào nguồn giá chưa niêm yết thì hiện "Chưa có giá".

---

## 7. Tính giá FOB từ trừ lùi

```
Giá FOB (USD/tấn)           = Giá London kỳ hạn chọn + Diff (trừ lùi âm, cộng lùi dương)
Giá FOB (VNĐ/kg)            = Giá FOB × Tỷ giá ÷ 1000
Giá nội địa tương đương     = Giá FOB (VNĐ/kg) − Chi phí gia công/bao bì/hao hụt (đ/kg)
```

Ví dụ: London 3.367 + Diff (−50) = **3.317 USD/t**; × 25.790 ÷ 1000 = **85.545 đ/kg**; − 700 = **84.845 đ/kg**.

Các thông số (kỳ hạn, Diff, tỷ giá, chi phí) được lưu cùng số liệu vị thế. Nhập Diff = 0 hay chi phí = 0 đều được tính đúng là 0.

---

## 8. Giá tham chiếu

| Nguồn | Cập nhật |
|---|---|
| Giá sàn London/New York | Tự động từ giacaphe.com, mỗi 15 giây (máy chủ lưu đệm 10 giây). Mất kết nối thì dùng giá gần nhất và báo trạng thái màu vàng. |
| Giá nhân xô nội địa | **Nhập tay**, nút ✎ Sửa trên thẻ. |
| Tỷ giá USD/VND | **Nhập tay**, nút ✎ Sửa. Đồng thời cập nhật vào công cụ FOB. |

---

## 9. Quy trình sử dụng hằng ngày

**Trên điện thoại:** mở link cố định và đặt ra màn hình chính. Chuyển thẻ ở thanh dưới đáy; thẻ giá vuốt ngang; nút Quay lại của điện thoại đóng hộp thoại, Trợ lý, bài đang đọc. Đọc tài liệu có A−/A+ chỉnh cỡ chữ. Chi tiết: thẻ 📚 Kiến thức → 📘 Hướng dẫn sử dụng → "Dùng hệ thống trên điện thoại".

1. Sáng: mở hệ thống, kiểm tra giá sàn và spread.
2. Cập nhật vị thế:
   - tồn kho;
   - hợp đồng mới ký hoặc mới chốt giá;
   - hợp đồng trừ lùi;
   - lệnh sàn đã khớp (lệnh chờ khớp rồi thì bấm ✔ Khớp).
3. Bấm **💾 Lưu vị thế**. Khi nút có dấu "•" và màu cam, nghĩa là còn thay đổi chưa lưu.
4. Mở **🤖 Trợ lý → Phân tích** để đọc nhận xét, khuyến nghị và kết quả soát lỗi dữ liệu.
5. Cuối ngày: **📊 Xuất Excel** để lưu lịch sử. File tên `Bao_Cao_Vi_The_VietThien_<ngày>.csv`.
6. Khi kỳ đầu đến tháng giao hàng: **🔁 Chuyển kỳ hạn**, rồi Lưu.

**Hợp đồng trừ lùi khi được chốt giá:** chuyển số tấn từ dòng *trừ lùi chưa chốt giá* sang dòng *đã chốt giá* tương ứng, cùng kỳ hạn và cùng dấu.

---

## 10. Trợ lý (gắn trong hệ thống)

Bấm **🤖 Trợ lý** trên thanh trên cùng. Trợ lý chạy ngay trên trình duyệt, không cần internet hay API, và có 4 thẻ:

| Thẻ | Nội dung |
|---|---|
| **Phân tích** | Tổng vị thế ròng và độ nhạy giá; bảng vị thế từng kỳ hạn; khuyến nghị số lot phòng hộ; đọc cấu trúc spread; **soát dữ liệu** (chưa lưu, kỳ hạn hết hạn, sai dấu mua/bán, dòng chỉ để theo dõi, mất kết nối giá) |
| **Cách sử dụng** | Hướng dẫn từng bước |
| **Cơ chế** | Công thức tính (tóm tắt tài liệu này) |
| **Hỏi đáp** | 12 câu hỏi thường gặp, có ô tìm kiếm |

---

## 11. Bot Telegram

1. Bấm **✈️ Bot Telegram**.
2. Dán Token (tạo qua @BotFather) và Chat ID (lấy qua @userinfobot).
3. Bật, Lưu, rồi Gửi thử.

**Lệnh chat:**

| Lệnh | Tác dụng |
|---|---|
| `/gia` | Giá sàn, tham chiếu nội địa, tóm tắt vị thế và khuyến nghị hedge |
| `/vithe` | Hàng thực, sàn, trừ lùi, ròng của từng kỳ hạn |
| `/spread` | Spread các kỳ hạn từ giá thật |
| `/fob` | Giá FOB theo thông số đã lưu |
| `/tuvan` | Trợ lý phân tích và khuyến nghị |

**Cảnh báo tự động:** khi giá Robusta kỳ gần biến động vượt ngưỡng (mặc định 20 USD/tấn) so với lần báo trước.

Bot dùng **cùng bộ công thức** với web (`engine.js`), nên số trên bot luôn khớp với web. Token được lưu trong `app\data\bot_config.json` và **không bao giờ** hiển thị đầy đủ trên giao diện.

---

## 12. Dữ liệu, sao lưu, bảo mật
- **Số liệu vị thế:** `app\data\position_data.json`.
  - Khi lưu, hệ thống ghi qua file tạm rồi mới thay, nên tránh hỏng file nếu mất điện giữa chừng.
  - Thư mục nằm trên ổ D nên được Google Drive sao lưu. Ngoài ra nên **Xuất Excel hằng ngày**.
- **Dữ liệu từ bản LDC cũ** được tự nâng cấp khi đọc. Cột cũ "N (Thg 7)" chuyển sang kỳ N kế tiếp (N27), tương tự cho các tháng khác.
- **Ai mở được hệ thống trong mạng LAN cũng sửa được số liệu.** Nên phân công một người cập nhật.
  - Nếu chỉ dùng trên một máy, thêm dòng `set HOST=127.0.0.1` vào `CHAY_HE_THONG.bat`, ngay trước dòng `start "VIET THIEN - SERVER…"`.
- Máy chủ chỉ cho tải file trong thư mục `public`. Không thể đọc `data\` từ trình duyệt.

---

## 13. Bảo trì
- **Kiểm thử công thức:** mở cửa sổ lệnh tại thư mục `app`, chạy `node test_engine.js`. Kết quả phải là "Đạt 15/15".
- **Muốn sửa công thức:** chỉ sửa `app\public\engine.js`, rồi chạy kiểm thử và khởi động lại hệ thống.
- **Bản LDC cũ** vẫn giữ nguyên tại `D:\01_KINH DOANH XUẤT KHẨU\QUANG SATC\06_HE_THONG_LDC\`, kèm bản sao lưu `_SAO_LUU_BAN_CU_2026-10-03`.

---

## 14. Thay đổi so với bản LDC cũ

| Hạng mục | Bản cũ | Bản 2.0 – Việt Thiên Coffee Group |
|---|---|---|
| Thương hiệu | LDC Coffee | Việt Thiên Coffee Group, có logo |
| Cột kỳ hạn | Cố định Thg1–Thg11/26 (đã quá hạn) | 6 kỳ hạn kế tiếp, tự tính; có nút chuyển kỳ |
| Lưu số liệu | Theo vị trí cột | Theo mã kỳ hạn (không lệch khi chuyển kỳ) |
| Spread K/N, N/U, U/X | Gõ cứng 67/36/34 | Tính từ giá thật, có nhận diện Inverted/Contango |
| Bot `/vithe` | Chỉ cộng 3 dòng → **sai** so với web | Dùng chung engine → khớp web |
| Diff = 0, chi phí = 0 | Bị đổi thành −50 / 700 | Tính đúng |
| Kỳ hạn FOB đã lưu | Không nạp lại | Nạp lại khi mở |
| Giá nội địa, tỷ giá | Gõ cứng trong mã | Nhập tay, có lưu |
| Bảo mật | Trả token ra web; CORS mở; có thể đọc file ngoài | Token được che; chặn đọc file ngoài `public` |
| Trợ lý / hướng dẫn | Không có | Trợ lý 4 thẻ gắn trong hệ thống |
| Kiểm thử | Không có | `test_engine.js` (15 kiểm thử) |

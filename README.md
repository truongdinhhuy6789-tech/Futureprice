# Việt Thiên Coffee Group – Hệ thống quản trị vị thế

Hệ thống nội bộ của Phòng Kinh doanh Xuất khẩu dùng để quản trị **vị thế hàng thực, tài khoản phòng hộ sàn (futures) và hợp đồng trừ lùi (Diff/PTBF)** theo từng kỳ hạn Robusta London. Hệ thống có thêm công cụ tính giá FOB, đo rủi ro và gợi ý số lot cần phòng hộ, khung Trợ lý tích hợp, và bot Telegram.

## Chạy hệ thống

Cần cài [Node.js](https://nodejs.org). Không cần cài thêm thư viện nào.

```
CHAY_HE_THONG.bat        # Windows: bật hệ thống và mở http://localhost:3456
DUNG_HE_THONG.bat        # tắt hệ thống
```
Hoặc chạy trực tiếp:
```
cd app
node server.js           # http://localhost:3456
node test_engine.js      # kiểm thử công thức
```

## Cấu trúc thư mục

| Đường dẫn | Nội dung |
|---|---|
| `app/server.js` | Máy chủ web, API, lấy giá sàn |
| `app/telegram_bot.js` | Bot cảnh báo giá và lệnh `/gia /vithe /spread /fob /tuvan` |
| `app/public/engine.js` | **Toàn bộ công thức tính** (web và bot cùng dùng) |
| `app/public/app.js`, `assistant.js` | Giao diện và Trợ lý |
| `app/data/` | Số liệu vị thế và cấu hình bot. **Không đưa lên Git**, tự tạo khi chạy lần đầu |
| `TAI_LIEU/` | Tài liệu cơ chế và hướng dẫn sử dụng |

Chi tiết cơ chế tính xem trong `TAI_LIEU/CO CHE VA HUONG DAN - HE THONG QUAN TRI VI THE VIET THIEN.md`.

---
*Tài sản nội bộ của Công ty TNHH SX TM DV Việt Thiên. Không phát hành công khai.*

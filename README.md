# Việt Thiên Coffee Group – Hệ thống quản trị vị thế

Hệ thống nội bộ của Phòng Kinh doanh Xuất khẩu dùng để quản trị **vị thế hàng thực, tài khoản phòng hộ sàn (futures) và hợp đồng trừ lùi (Diff/PTBF)** theo từng kỳ hạn Robusta London. Hệ thống có thêm công cụ tính giá FOB, đo rủi ro và gợi ý số lot cần phòng hộ, mô hình so sánh 4 chiến lược phòng hộ, bảng giá trực tuyến (nguồn giacaphe.com), khung Trợ lý tích hợp và bot Telegram.

## Chạy hệ thống

Cần cài [Node.js](https://nodejs.org). Không cần cài thêm thư viện nào.

```
CHAY_HE_THONG.bat        # Windows: bật hệ thống và mở http://localhost:3456
MO_LINK_ONLINE.bat       # mở link https://….trycloudflare.com để sếp xem từ xa (chép sẵn link + hiện mật khẩu)
TAT_LINK_ONLINE.bat      # tắt link online (hệ thống trên máy vẫn chạy)
DUNG_HE_THONG.bat        # tắt hệ thống và link online
```
Hoặc chạy trực tiếp:
```
cd app
node server.js           # http://localhost:3456
node test_engine.js      # kiểm thử công thức
```

## Link online và đăng nhập

- `MO_LINK_ONLINE.bat` dùng Cloudflare Quick Tunnel (công cụ `cloudflared.exe` tự tải vào `tools/` lần đầu, có kiểm tra chữ ký số của Cloudflare). Link đổi địa chỉ mỗi lần mở lại đường hầm; máy chạy hệ thống phải bật và không ở chế độ ngủ.
- Mọi truy cập qua link đều phải đăng nhập. Mật khẩu tự sinh lần đầu trong `app/data/access.json`:
  - `viewerPassword` (`sep-…`): **chỉ xem** – ẩn nút Lưu/Chuyển kỳ hạn/Telegram, khóa ô nhập, máy chủ chặn mọi thao tác ghi.
  - `editorPassword` (`vt-…`): **chỉnh sửa**.
  - Đổi mật khẩu: sửa file rồi khởi động lại hệ thống. Đổi `secret` để đăng xuất mọi thiết bị.
- Mở trực tiếp trên máy chạy hệ thống (`localhost`) không cần mật khẩu. Sai mật khẩu 8 lần → khóa 10 phút theo IP.

## Giá thời gian thực

- Máy chủ lấy giá Robusta London, Arabica New York, Brazil từ giacaphe.com mỗi 5 giây khi có người xem (60 giây khi không ai xem), tỷ giá Vietcombank 30 phút/lần.
- Trong máy và mạng LAN: máy chủ **đẩy** giá xuống trình duyệt qua luồng SSE (`/api/stream`).
- Qua link online: Cloudflare Quick Tunnel không cho luồng SSE đi qua, nên trình duyệt tự **hỏi giá mỗi 3 giây** (`/api/live-quotes?since=…`, giá chưa đổi chỉ nhận gói nhỏ). Trình duyệt cũng tự chuyển sang cách này nếu luồng SSE im lặng.
- Nút **Kiểm tra lại giá** lấy lại ngay từ trang nguồn (tối đa 1 lần / 2 giây).

## Cấu trúc thư mục

| Đường dẫn | Nội dung |
|---|---|
| `app/server.js` | Máy chủ web, API, lấy giá sàn và tỷ giá, luồng thời gian thực |
| `app/auth.js` | Đăng nhập, phân quyền chỉnh sửa / chỉ xem |
| `app/telegram_bot.js` | Bot cảnh báo giá và lệnh `/gia /vithe /spread /fob /tuvan` |
| `app/public/engine.js` | **Toàn bộ công thức tính** (web và bot cùng dùng) |
| `app/public/app.js`, `charts.js`, `assistant.js` | Giao diện, biểu đồ và Trợ lý |
| `app/data/` | Số liệu vị thế, mật khẩu, cấu hình bot, lịch sử giá. **Không đưa lên Git**, tự tạo khi chạy lần đầu |
| `scripts/mo_link_online.ps1` | Kịch bản mở link online (gọi từ `MO_LINK_ONLINE.bat`) |
| `tools/` | `cloudflared.exe` và nhật ký đường hầm. **Không đưa lên Git** |
| `TAI_LIEU/` | Tài liệu cơ chế và hướng dẫn sử dụng |

Chi tiết cơ chế tính xem trong `TAI_LIEU/CO CHE VA HUONG DAN - HE THONG QUAN TRI VI THE VIET THIEN.md`.

---
*Tài sản nội bộ của Công ty TNHH SX TM DV Việt Thiên. Không phát hành công khai.*

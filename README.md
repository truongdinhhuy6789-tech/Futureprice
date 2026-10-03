# Việt Thiên Coffee Group – Hệ thống quản trị vị thế

Hệ thống nội bộ của Phòng Kinh doanh Xuất khẩu dùng để quản trị **vị thế hàng thực, tài khoản phòng hộ sàn (futures) và hợp đồng trừ lùi (Diff/PTBF)** theo từng kỳ hạn Robusta London. Hệ thống có thêm công cụ tính giá FOB, đo rủi ro và gợi ý số lot cần phòng hộ, mô hình so sánh 4 chiến lược phòng hộ, bảng giá trực tuyến (nguồn giacaphe.com), khung Trợ lý tích hợp và bot Telegram.

## 6 thẻ chính

| Thẻ | Nội dung |
|---|---|
| 📈 Tổng quan | Cho sếp: vị thế ròng, lời/lỗ khi giá chạy, đề xuất phòng hộ, biểu đồ, tóm tắt |
| 📊 Vị thế | Ma trận LDC. Dòng hợp đồng (📒) và Robusta sàn (📉) tự lấy từ thẻ Giao dịch; tồn kho, Arabica, hàng gởi nhập tay; tính FOB từ trừ lùi; hạn mức rủi ro |
| 📒 Giao dịch | **Hàng thật**: hợp đồng mua/bán giá cố định hoặc trừ lùi, chốt giá và giao hàng từng phần. **Hàng ảo**: lệnh sàn Robusta (HD Bank / PFS092), giá vốn bình quân, lãi/lỗ. Liên kết hai bên bằng 🛡️ Hedge (hiện phần còn hở) |
| 🛡️ Phòng hộ | So sánh 4 chiến lược (Futures, Put, Collar, Hybrid) theo 5 kịch bản giá |
| 🌐 Bảng giá | Nhân xô trong nước, **giá FOB theo chủng loại** (diff báo giá, sửa trên trang), **chuẩn chất lượng ICE** (Class P/1/2/3/4, quy đổi R1/R2/R3), giá London / New York / Brazil |
| 📚 Kiến thức | Thư viện bài viết có tìm kiếm không dấu; dữ liệu trong `app/public/knowledge.js` (tự thêm bài). Nút ⓘ trên các bảng mở đúng bài |

**Trợ lý** (nút logo góc phải): hỏi đáp tự nhiên, tính theo số liệu thật (vd "ký 38,4 tấn S18 WP 3.800 USD FOB thì ký sao chốt sao" → quy đổi lot/cont, so bảng diff, hạng ICE, so nhân xô, tác động vị thế, phương án ký – chốt – phòng hộ, nút ghi thẳng vào sổ hợp đồng). Dải **💡 Trợ lý khuyên** trên đầu trang: việc cần làm và **cảnh báo khi sàn biến động** vượt "bước giá kiểm tra" (thẻ Vị thế).

## Chạy hệ thống

Cần cài [Node.js](https://nodejs.org). Không cần cài thêm thư viện nào.

```
CHAY_HE_THONG.bat        # Windows: bật hệ thống và mở http://localhost:3456
MO_LINK_ONLINE.bat       # mở link https://….trycloudflare.com dùng từ xa (chép sẵn link; mở là toàn quyền, không cần đăng nhập)
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
- Quyền khi mở link, đặt bằng `openAccess` trong `app/data/access.json` (sửa xong khởi động lại hệ thống):
  - `"editor"` (**đang dùng**): mở link là **toàn quyền chỉnh sửa và nhập liệu, không cần đăng nhập**. Ai có link đều sửa được, nên chỉ gửi cho người tin cậy; lỡ lộ link thì tắt rồi mở lại để đổi địa chỉ.
  - `"viewer"`: mở link là chỉ xem (ẩn nút Lưu/Chuyển kỳ hạn/Telegram, khóa ô nhập, máy chủ chặn thao tác ghi). Người sửa dùng **link chỉnh sửa** `…/k/<editKey>` (mở 1 lần là thiết bị đó có quyền sửa 30 ngày) hoặc bấm **Đăng nhập** và nhập `editorPassword` (`vt-…`).
  - `"none"`: bắt buộc đăng nhập; sếp dùng `viewerPassword` (`sep-…`). Sai 8 lần → khóa 10 phút theo IP. Đổi `secret` để đăng xuất mọi thiết bị.
- **Bộ giữ link** (`app/link_keeper.js`, `MO_LINK_ONLINE.bat` tự bật chạy ẩn): mỗi phút kiểm tra máy chủ và link công khai. Cloudflare xóa đường hầm / link không phản hồi 3 lần → tự mở link mới, ghi vào `tools/link_online.txt` và chân trang hệ thống (nút 📋 Chép); máy chủ tắt → tự bật lại. Đường hầm chạy độc lập nên khởi động lại máy chủ để cập nhật code **không đổi link**. Nhật ký: `app/data/link_keeper.log`.
- Mỗi lần lưu vị thế, bản cũ được giữ trong `app/data/backups/` (200 bản gần nhất) để khôi phục khi sửa nhầm.
- Mở trực tiếp trên máy chạy hệ thống (`localhost`) luôn có quyền chỉnh sửa. Link online không cho Google lập chỉ mục (`robots.txt`, `X-Robots-Tag`).

## Giá thời gian thực

- Máy chủ lấy giá Robusta London, Arabica New York, Brazil từ giacaphe.com mỗi 5 giây khi có người xem (60 giây khi không ai xem), tỷ giá Vietcombank 30 phút/lần.
- Trong máy và mạng LAN: máy chủ **đẩy** giá xuống trình duyệt qua luồng SSE (`/api/stream`).
- Qua link online: Cloudflare Quick Tunnel không cho luồng SSE đi qua, nên trình duyệt tự **hỏi giá mỗi 3 giây** (`/api/live-quotes?since=…`, giá chưa đổi chỉ nhận gói nhỏ). Trình duyệt cũng tự chuyển sang cách này nếu luồng SSE im lặng.
- Nút **Kiểm tra lại giá** lấy lại ngay từ trang nguồn (tối đa 1 lần / 2 giây).
- Giá nhân xô nội địa: giá trung bình Tây Nguyên và giá các tỉnh mà giacaphe.com ghi công khai bằng chữ (trang `gia-ca-phe-noi-dia` và tiêu đề trang từng tỉnh), 30 phút/lần. Ô giá trong bảng của giacaphe bị mã hóa có chủ đích (dữ liệu thu phí) nên hệ thống không lấy; tỉnh nào không có giá công khai thì hiện link xem trên giacaphe.com.

## Cấu trúc thư mục

| Đường dẫn | Nội dung |
|---|---|
| `app/server.js` | Máy chủ web, API, lấy giá sàn và tỷ giá, luồng thời gian thực |
| `app/auth.js` | Đăng nhập, phân quyền chỉnh sửa / chỉ xem |
| `app/telegram_bot.js` | Bot cảnh báo giá và lệnh `/gia /vithe /spread /fob /tuvan` |
| `app/public/engine.js` | **Toàn bộ công thức tính** (web và bot cùng dùng) |
| `app/public/app.js`, `charts.js` | Giao diện chung, biểu đồ |
| `app/public/contracts.js` | Thẻ Giao dịch: sổ hợp đồng (hàng thật) và sổ lệnh sàn (hàng ảo) |
| `app/public/grades.js` | Giá FOB theo chủng loại & chuẩn chất lượng ICE |
| `app/public/assistant.js` | Trợ lý: hỏi đáp, phân tích, lời khuyên đầu trang, cảnh báo biến động |
| `app/public/knowledge.js`, `library.js` | Thư viện kiến thức (nội dung / giao diện) |
| `app/data/` | Số liệu vị thế, mật khẩu, cấu hình bot, lịch sử giá. **Không đưa lên Git**, tự tạo khi chạy lần đầu |
| `scripts/mo_link_online.ps1` | Kịch bản mở link online (gọi từ `MO_LINK_ONLINE.bat`) |
| `app/link_keeper.js` | Bộ giữ link: theo dõi, tự mở lại đường hầm và tự bật lại máy chủ |
| `tools/` | `cloudflared.exe` và nhật ký đường hầm. **Không đưa lên Git** |
| `TAI_LIEU/` | Tài liệu cơ chế và hướng dẫn sử dụng |

Chi tiết cơ chế tính xem trong `TAI_LIEU/CO CHE VA HUONG DAN - HE THONG QUAN TRI VI THE VIET THIEN.md`.

---
*Tài sản nội bộ của Công ty TNHH SX TM DV Việt Thiên. Không phát hành công khai.*

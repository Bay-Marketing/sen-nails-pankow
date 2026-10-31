# Tính năng cần backend (ghi lại nguyên văn từ báo cáo)

Clone hiện là site tĩnh nên các tính năng sau chưa chạy thật.

| Tính năng | Bản gốc làm thế nào | Clone hiện tại | Cần làm để chạy thật |
|---|---|---|---|
| **Đặt lịch** (Terminbuchung, 28 dịch vụ có giá) | Trang dịch vụ kiểu Wix, mỗi dòng có nút đặt. Tôi suy ra đây là Wix Bookings, chưa xác nhận bên trong | Chỉ là danh sách, nút trỏ về trang Kundenbetreuung | Hệ thống đặt lịch: danh sách dịch vụ, thời lượng, nhân viên, lịch trống, đặt trước, hủy, nhắc lịch, email xác nhận. Dùng dịch vụ có sẵn hoặc tự xây |
| **Form liên hệ** | Form Wix, 5 trường gồm cả mã quốc gia ở Phone | Chỉ hiện thông báo, không gửi đi đâu | Endpoint nhận form, gửi email cho quán, lưu lại, chống spam (honeypot hoặc captcha), kiểm tra dữ liệu ở phía server |
| **Khối đánh giá** | Link sang `sen-nails-pankow.de/review` | Giữ nguyên link này | Nếu bỏ domain đó thì phải đổi link tới trang đánh giá Google của quán |
| **Bản đồ** | Google Maps nhúng | Đã nhúng, chạy được | Không cần backend. Nên kiểm tra quyền riêng tư (chỉ tải bản đồ sau khi đồng ý cookie) |
| **Hosting và tên miền** | Đang là subdomain Wix tạm | Chạy local | Chọn host, gắn domain thật, HTTPS, cấu hình redirect |
| **Gửi email** | Wix lo | Chưa có | SMTP hoặc dịch vụ gửi email cho form và đặt lịch |
| **Quản lý nội dung** | Sửa trên Wix | Sửa trong `build.mjs` | Nếu chủ quán muốn tự sửa giá và dịch vụ: CMS hoặc trang quản trị |
| **Cookie và đồng ý** | Không thấy banner | Chưa có | Banner đồng ý nếu thêm analytics, bản đồ, hoặc đặt lịch bên thứ ba (quy định DSGVO của Đức) |
| **Analytics** | Chưa kiểm tra | Chưa có | Google Analytics hoặc Plausible, kèm cơ chế đồng ý nếu cần |
| **Trang pháp lý** | Impressum, Datenschutz, Cookies đã có nội dung | Đã chép nguyên | Nội dung đang ghi pháp nhân Bay Marketing, cần luật sư hoặc chủ quán kiểm tra trước khi dùng cho site thật |

**Ưu tiên nếu đưa site vào dùng thật:**
1. Đặt lịch thật, vì đây là chức năng tạo doanh thu.
2. Form liên hệ gửi được email.
3. Tên miền, HTTPS, canonical, `robots.txt`, `sitemap.xml`.
4. Rà soát pháp lý và cookie.

---

# Cập nhật sau lần kiểm tra mới (để xử lý backend sau)

Các dòng "Cookie và đồng ý" và "Analytics" ở bảng trên đã được kiểm tra lại và đã có phần code chuẩn bị sẵn:

- **Analytics / theo dõi (đã kiểm tra bản gốc):** bản gốc nạp **Google tag cho Google Ads `AW-16714042132`** và **Meta Pixel `4112416859014946`**, consent mặc định "granted", **không có banner cookie**. Clone nạp đúng 2 mã này trong `tracking.js` (nạp sau khi trang tải xong). ID cấu hình ở `site.config.json` → `tracking`.
  - Bản gốc còn bắn thêm một yêu cầu Google Ads tới tài khoản `AW-11408137572` (do Google tự thêm từ tài khoản liên kết). Clone **không** gắn mã này.
- **Banner đồng ý cookie:** đã viết sẵn, **đang tắt** để giống bản gốc. Bật bằng `"consentBanner": true` trong `site.config.json` rồi chạy `npm run build`. Khi bật, hai thẻ theo dõi chỉ nạp sau khi khách bấm "Akzeptieren". Lưu ý: chạy theo dõi mà không có banner như bản gốc có rủi ro với DSGVO/TTDSG ở Đức; nên cân nhắc bật trước khi chạy thật.
- **Form liên hệ:** đã kiểm tra dữ liệu phía trình duyệt (email, ô bắt buộc, số điện thoại) và có ô honeypot chống bot. Để nối backend, điền URL vào `site.config.json` → `formEndpoint`. Form sẽ `POST` JSON:
  ```json
  { "vorname": "", "name": "", "email": "", "phone": "+49 …", "message": "", "page": "/kundenbetreuung" }
  ```
  Trả về mã 2xx = thành công; mã khác = hiện thông báo lỗi. Backend vẫn phải tự kiểm tra lại dữ liệu và chống spam.
- **Đặt lịch:** các nút "Jetzt buchen" đang trỏ `/kundenbetreuung`; cần thay bằng link hoặc widget của hệ thống đặt lịch được chọn (sửa trong `build.mjs`, hàm `services()`).
- **Link đánh giá Google:** `https://www.sen-nails-pankow.de/review` (sửa trong `build.mjs`, hàm `home()`).
- **Hosting:** đã có sẵn cấu hình URL sạch, chuyển hướng 301 (kể cả đường dẫn cũ `/mysite/...` của Wix) và trang 404 cho Netlify/Cloudflare Pages (`_redirects`), Vercel (`vercel.json`), Apache (`.htaccess`), nginx (`nginx.conf.example`).

# Sen Nails Pankow – static site

Bản dựng lại website Sen Nails Pankow (Wix) thành site tĩnh HTML/CSS/JS.

## Chạy thử
```bash
npm install        # lần đầu (chỉ cần cho xử lý ảnh)
npm run serve      # http://localhost:4173  (URL sạch, 301, 404 như production)
```
Phải mở qua server (đường dẫn dạng `/style.css`, `/terminbuchung`), không mở file `.html` trực tiếp.

## Cấu trúc
| Đường dẫn | Việc |
|---|---|
| `build.mjs` | Sinh 7 trang + `404.html`, `sitemap.xml`, `robots.txt`, các file cấu hình host |
| `site.config.json` | Tên miền, mã theo dõi, bật/tắt banner cookie, hiệu ứng hiện dần, endpoint form |
| `content/legal.json` | Nội dung Impressum, Datenschutz, Cookies |
| `style.css`, `main.js`, `tracking.js` | Giao diện, menu/hiệu ứng/form, Google Ads + Meta Pixel |
| `assets/src` → `assets/img` | Ảnh gốc → AVIF/WebP/JPG + `srcset` (`npm run images`) |
| `assets/fonts` | Font tự lưu (`node tools/fetch-fonts.mjs`) |
| `tools/audit.mjs` | Tóm tắt báo cáo Lighthouse trong `reports/` |

## Quy trình
```bash
npm run build      # sau khi sửa build.mjs / site.config.json / content
npm run images     # sau khi thay ảnh trong assets/src
```
Triển khai: đưa toàn bộ thư mục (trừ `node_modules`, `tools`, `content`, `reports`, `build.mjs`, `serve.mjs`) lên host; dùng file cấu hình tương ứng (`_redirects`, `vercel.json`, `.htaccess`, `nginx.conf.example`).

Phần backend cần làm sau: xem [BACKEND.md](BACKEND.md).

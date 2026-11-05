# Cây xoài sân nhà — chu kỳ 4 giờ và 4 cấp

Ngày: 2026-11-05. Đã triển khai và kiểm tra ở môi trường local.

## Cách chơi

- Bấm/chạm cây xoài bên trái nhà chính để xem cấp, sản lượng, thời gian chín và tiến độ lên cấp.
- Mỗi farm có đúng một cây. Farm mới hoặc farm cũ vừa nhận cập nhật bắt đầu chờ 4 giờ cho vụ đầu tiên.
- Cây tiếp tục tính thời gian khi offline bằng timestamp server. Xoài chín chờ người chơi hái, không hỏng và không tự cộng dồn nhiều vụ khi vắng lâu.
- Khi bấm Thu hoạch, nhân vật tự đi tới gần cây; quả vào túi đồ. Sau khi hái thành công bắt đầu đợt 4 giờ tiếp theo.
- Khách được xem cây khi thăm farm nhưng không thể thu hoạch. Khi đang thăm farm cũng không thể gọi API để thu hoạch cây ở farm mình.
- Đem xoài tới quầy thu mua Cô Lan trong chợ để bán: **10 Đồng Làng/quả**. Xoài không phải hạt giống và không mua từ quầy hạt.

## Các giá trị cân bằng ban đầu

| Cấp | Tổng số lần thu hoạch để đạt cấp | Sản lượng mỗi vụ ở cấp đó | Kích thước vẽ |
| --- | ---: | ---: | ---: |
| 1 — Cây nhỏ | 0 | 3 quả | 100 |
| 2 — Đang lớn | 5 | 5 quả | 120 |
| 3 — Trưởng thành | 15 | 8 quả | 145 |
| 4 — Cổ thụ | 30 | 12 quả | 170 |

Một lần thu hoạch thành công tính một lần tiến cấp, không phụ thuộc số quả. Vụ vừa hái dùng sản lượng của cấp trước khi hái; nếu đạt mốc, cây lớn ngay và vụ kế tiếp dùng sản lượng mới. Ví dụ lần hái thứ 5 nhận 3 quả, lên cấp 2, lần hái thứ 6 nhận 5 quả.

Các mốc, sản lượng và giá bán là giá trị thử nghiệm được chọn khi triển khai, không phải giá trị cố định do người dùng chỉ định. Chỉnh trong `public/js/shared/mango.js`: `MANGO_CYCLE_MS`, `MANGO_STAGES`, `MANGO_SELL_PRICE`. Chu kỳ đã bắt đầu lưu `ready_at` riêng, nên đổi cấu hình không tự viết lại thời gian của vụ đang chờ.

## Giao diện

- Cây tại (400,220), tăng kích thước qua 4 cấp; vùng va chạm thân lấy theo tọa độ chung. Dùng ảnh `mango-tree-leaves-v2.png` không có quả vẽ sẵn.
- Không có nhãn nổi dưới cây. Canvas vẽ quả non xanh nhỏ và quả chín vàng lớn hơn; menu khi chạm cây có số quả, đồng hồ đếm ngược và mốc lên cấp. Xem [cập nhật hình quả](MANGO_RIPENESS_VISUAL.md).
- Thêm biểu tượng xoài SVG riêng trong túi và cửa hàng.
- Hiệu ứng thông báo thu hoạch xoài tách khỏi hoạt ảnh gặt lúa.
- Hai tab cùng tài khoản đồng bộ cây và kho qua Socket.IO. Sửa việc tab đứng yên liên tục gửi vị trí cũ, gây kéo ngược tab đang tự đi tới cây; hiện chỉ gửi khi vị trí hoặc hướng thay đổi.

## Dữ liệu và API

Migration **v11** thêm:

- `farm_mango_trees`: một hàng mỗi farm, số lần hái và thời điểm chín vụ tiếp.
- `mango_receipts`: yêu cầu đã hoàn thành để retry không nhận quả lần hai.

Migration thêm cây cho mọi farm hiện có, bắt đầu chu kỳ mới; không sửa cây trồng, tiền, vật phẩm hoặc tiến độ cũ.

- `GET /api/mango`: trạng thái cây của chủ tài khoản, yêu cầu đăng nhập.
- `POST /api/mango/action`: `{action:"harvest",farmId,requestId}`. Yêu cầu auth, CSRF, chủ farm, không đang thăm farm, scene farm và khoảng cách không quá 110 đơn vị tới gốc cây.
- Thời gian, sản lượng, cấp và giá bán do server xác định. Timestamp/giá/sản lượng do client gửi không được chấp nhận trong thao tác hái.
- Thu hoạch, cộng kho, tăng cấp, đặt vụ tiếp và lưu receipt nằm trong cùng transaction. Kho đầy thì toàn bộ thao tác rollback và vụ xoài vẫn chờ hái.
- Gửi lại cùng yêu cầu trả receipt, không cộng thêm quả; hai yêu cầu khác nhau trong cùng vụ chỉ một yêu cầu có thể thu hoạch.
- Social snapshot có trạng thái cây để khách xem đúng kích thước/cấp.

## Backup và kiểm thử

Backup nhất quán trước thay đổi:

- `data/backups/farm-pre-mango-1793893343440.sqlite`
- `data/backups/starter-pre-mango-1793893343473.sqlite`

Dữ liệu chơi thật không dùng để tăng tốc hoặc làm fixture. Nó nhận migration khi khởi động lại server với code mới. `data/starter.sqlite` đã nâng v11, vẫn 0 user, 0 session, 0 cây vì không có farm.

Kết quả:

- Bộ Node/API/SQLite hiện có cùng kiểm thử xoài: **81/81 PASS**.
- Xác minh biên đúng 4 giờ, offline nhiều ngày chỉ một vụ, chống retry, kho đầy rollback, tất cả mốc cấp và sản lượng, bán hàng theo giá server, sai farm/sai scene/xa cây, auth/CSRF, hai yêu cầu đồng thời, đang thăm farm và lưu sau mở lại database.
- Migration trên bản sao backup: toàn bộ dữ liệu gốc của **34 bảng giữ nguyên**, thêm đúng một cây cho mỗi farm; integrity/foreign keys OK; mở lại không thêm cây lặp.
- Browser Edge desktop 1366x900: cây mới có countdown/nút chưa được hái, bấm cây tự đi tới thu hoạch, tăng cấp 2–4, đồng bộ tab thứ hai, reload giữ cấp và bán xoài qua UI. PASS.
- Mobile 390x844: menu nằm trong viewport. PASS.
- Phase 7 browser hồi quy thăm farm: **4/4 PASS**.

Browser QA chỉ điều chỉnh thời gian và số lần hái trong SQLite thử để đến các mốc; không chờ 4 giờ thật hoặc 30 vụ thật. Không có endpoint tăng tốc trong game.

Chạy lại:

```powershell
npm test
npm run qa:mango
npm run qa:mango-migration -- "DUONG_DAN_BACKUP_TRUOC_V11.sqlite"
npm run qa:phase7
```

Browser QA cần Playwright và Edge như README; có thể đặt `PLAYWRIGHT_MODULE` khi thư viện cài ngoài dự án.

Bằng chứng: `.qa/mango/results.json`, `stage-1-wait.png`, `stage-2.png`, `stage-3.png`, `stage-4.png`, `market-sale.png`, `mobile-menu.png`, `.qa/mango-migration.json`.

## Nhận cập nhật

Khởi động lại server để chạy migration và API mới, sau đó Ctrl+F5 trên trang game. Cả farm cũ lẫn farm mới đều có cây xoài chức năng. Các mốc và giá còn cần playtest để cân bằng dài hạn; chưa deploy public.

# Báo cáo sửa va chạm, VAC và trải nghiệm mở đầu

Ngày: 2026-11-05.
Trạng thái: ĐÃ TRIỂN KHAI PHẦN CHÍNH; NGHIỆM THU TỔNG THỂ CÒN MỘT PHẦN.

## Thay đổi đã thực hiện

### Va chạm và VAC

- `public/js/shared/farmWorld.js` là nguồn dữ liệu chung cho kích thước, biên và vật cản cố định. Client và server cùng dùng module này, loại bỏ lệch x=1060/x=1300; giữ tọa độ x=1300 của kiểm tra server trước đó.
- Điểm tiếp cận ao và sân gà được tính từ bố cục hiện tại. Điểm bị chặn được loại bỏ; không có điểm hợp lệ thì trả null/Infinity thay vì dùng lại điểm bị chặn.
- Client thử đường tới các điểm hợp lệ, nhường event loop sau mỗi nhóm điểm không đi tới được. Vị trí cuối tiếp tục được server xác nhận trước khi gửi thao tác VAC.
- Thông báo tìm đường thất bại và mất kết nối hiển thị cho người chơi; không nuốt lỗi di chuyển như trước.
- Menu ngữ cảnh ao/chuồng có nút Chi tiết để mở bảng thả, cho ăn, thu hoạch và đổi thức ăn.
- Fixture chuồng gà trong test được đổi từ điểm cạnh chuồng cũ sang điểm cạnh sân mới; không nới rộng khoảng cách server để làm test đạt.

### Trải nghiệm mở đầu

- Hướng dẫn gồm 7 hành động: cuốc, gieo rau cải, tưới, thu hoạch, bán rau cải, mua hạt và gieo vụ thường.
- Một mục tiêu chính, đánh dấu đích trong thế giới và nút Đi tới. Khi gieo vụ đầu, hạt rau cải được nhấn mạnh trong menu.
- Tiến trình thay đổi từ hành động gameplay thành công trong transaction server; không có API cho client tự đánh dấu hoàn tất.
- Farm mới được tham gia. Một vụ rau cải đầu tiên có snapshot thời gian 45 giây, giảm còn 40,5 giây nếu tưới; cây tiếp theo dùng thời gian bình thường.
- `fast_crop_id` được lưu cùng transaction gieo cây để tránh cấp nhiều vụ nhanh qua retry hoặc hai tab. Không thêm tiền thưởng hoặc vật phẩm miễn phí ngoài tài nguyên khởi đầu hiện có.
- Tiến trình lưu SQLite; reload/đổi tab vẫn tiếp tục. Bỏ qua được lưu và đồng bộ các tab; Xem hướng dẫn không khởi tạo lại ưu đãi.
- Farm cũ có thể mở phần nhắc lại từ Menu → Xem hướng dẫn, không được reset hay tự cấp ưu đãi.
- Thu hoạch trước khi mở nhiệm vụ Vụ gặt đầu vẫn được ghi nhận, nhưng không cho nhận thưởng vượt thứ tự nhiệm vụ. Test xác nhận thu hoạch sau khi đã nhận thưởng không mở lại phần thưởng.

## Schema và dữ liệu

- Migration v10 chỉ thêm bảng `farm_onboarding`; không thêm hàng cho farm đang tồn tại, không sửa cây/tiền/kho cũ.
- Tạo backup SQLite nhất quán trước thay đổi bằng API backup, không copy riêng file đang có WAL.
- Backup trước triển khai: `data/backups/farm-pre-onboarding-1793890694351.sqlite` và `data/backups/starter-pre-onboarding-1793890694383.sqlite`.
- Kiểm tra migration trên bản sao backup schema v9: toàn bộ hàng dữ liệu gốc trong 33 bảng giữ nguyên; integrity OK, foreign keys OK, mở lại không lặp migration; không có farm cũ được tự đăng ký hướng dẫn.
- Database chơi thật không được dùng làm fixture hoặc tăng tốc thời gian trong QA. Nó sẽ nhận migration khi server được khởi động lại với code mới.
- `data/starter.sqlite` đã nâng lên v10; 0 user, 0 session, 0 onboarding; integrity OK.

## Kết quả kiểm thử

| Kiểm tra | Kết quả |
| --- | --- |
| Node/API/SQLite/regression | 72/72 PASS |
| Luồng browser mở đầu desktop | PASS, khoảng 59 giây trong lần chạy thành công đầu; chờ cây theo thời gian thật |
| Reload và hai tab trong hướng dẫn | PASS |
| Mobile 390x844, thao tác chạm và lưu trạng thái bỏ qua | PASS |
| VAC browser hiện tại | PASS: thả/cho ăn/thu hoạch cá, thêm/cho ăn gà, nhặt trứng, đổi thức ăn |
| VAC có độ trễ | PASS, phần chuồng gà và đổi thức ăn ở latency 200ms, tải xuống 50KB/s |
| Thăm farm Phase 7 | 4/4 PASS |
| Migration trên bản sao dữ liệu cũ | PASS, 33 bảng gốc không đổi |
| Lỗi JavaScript ở browser mới | Không ghi nhận pageerror |

Test VAC dùng database tạm và lùi timestamp cá/gà để kiểm tra offline growth, không đợi nhiều giờ thật. Test hướng dẫn chờ cây nhanh theo thời gian thật, không sửa timestamp.

## Các kiểm thử cũ còn lỗi — không bỏ qua khi nghiệm thu

- `browser-contextual-qa.mjs`: 7/16 PASS. Một số kịch bản còn click ruộng tại tọa độ cũ (ví dụ 140,750), dùng kích thước world cũ và selector chọn hạt cũ.
- `browser-vac-qa.mjs`: 2/5 PASS. Kịch bản vẫn dùng E để mở VAC, trong khi giao diện hiện tại loại ao/chuồng khỏi nearest/interact và dùng menu ngữ cảnh.
- `browser-phase5-qa.mjs`: 6/13 PASS. Trồng cây, click đặt công trình và một số bước phụ thuộc trước đó chưa đạt; script còn dùng camera/world cũ. Chưa kết luận tất cả lỗi còn lại đều chỉ do script. Cần cập nhật fixture và tái hiện lại độc lập trước nghiệm thu tổng thể.
- Bộ kiểm thử mới bổ sung bằng chứng cho phạm vi thay đổi, không thay thế toàn bộ coverage của các bộ cũ. Các script cũ vẫn được giữ, không xóa hay vô hiệu hóa để che lỗi.

## Cách chạy lại

```powershell
npm test
npm run qa:first5
npm run qa:collision-vac
npm run qa:phase7
npm run qa:onboarding-migration -- "DUONG_DAN_BACKUP_SCHEMA_V9.sqlite"
```

Các test browser cần Playwright và Edge như hướng dẫn sẵn trong README. Nếu Playwright nằm ngoài dự án, đặt `PLAYWRIGHT_MODULE` thành URL file module tương ứng; có thể dùng `EDGE_PATH` với test hỗ trợ biến này.

Bằng chứng cục bộ trong `.qa/`:

- `first5-results.json`, `first5-desktop-start.png`, `first5-desktop-done.png`, `first5-mobile-start.png`.
- `vac-fixed-results.json`, `vac-fixed-pond.png`, `vac-fixed-coop.png`.
- `onboarding-migration.json`.

## Cách thử bản mới

1. Khởi động lại server bằng cách dừng tiến trình đang chạy và chạy `npm start` (hoặc `npm run dev` nếu đang dùng chế độ phát triển).
2. Tải lại trang game.
3. Dùng một tài khoản chưa có farm để tạo farm mới và thử hướng dẫn. Giữ tài khoản/farm cũ để tiếp tục chơi bình thường.

## Phần chưa nghiệm thu

- Chưa thử với 5 người mới, nên chưa xác nhận mục tiêu 4/5 người tự hoàn thành trong 5 phút. Kết quả tự động 59 giây không đại diện cho người chơi mới.
- Chưa kiểm tra trên điện thoại cảm ứng vật lý, zoom trình duyệt thật 125%, hoặc tất cả bố cục công trình qua UI.
- Cần khôi phục các bộ browser cũ và xác minh những lỗi còn lại trước khi đánh dấu kế hoạch COMPLETE/phát hành.
- Không deploy, không tạo commit và không tự khởi động lại server đang phục vụ người chơi.

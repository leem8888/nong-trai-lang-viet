# Phase 9 — Visual QA

Trạng thái: **PASS**. Browser: Microsoft Edge headless thực tế, CDP, viewport CSS và touch emulation. Không dùng ảnh mockup thay cho game chạy thật.

## Cách chạy

```powershell
node tests/run.mjs
node tests/browser-phase9-qa.mjs before
node tests/browser-phase9-qa.mjs after
```

Edge mặc định: `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`; có thể đặt `EDGE_PATH`. Không cần npm hoặc Playwright. Node phải hỗ trợ WebSocket và fetch tích hợp.

Mỗi lần chạy tạo database RAM, đăng ký một người chơi và tạo farm bằng code thật. Các fixture cây trồng, VAC, xây dựng và trang trí sử dụng hàm nghiệp vụ server. Chỉ rút ngắn thời gian trồng cây trong fixture; không thay đổi thời gian hoặc dữ liệu người chơi.

Tại các lần đổi vị trí fixture, browser rời trang trước khi khôi phục tọa độ để socket cũ không ghi đè. Kịch bản chờ quá trình join/đồng bộ farm hoàn tất trước khi gửi pointer. Hook QA chỉ được thêm vào response module trong browser kiểm thử, không nằm trong mã production.

## Ảnh trước/sau

| Cảnh | BEFORE | AFTER |
| --- | --- | --- |
| Farm 1920×1080 | [Ảnh](docs/phase9/before-farm-1920.png) | [Ảnh](docs/phase9/after-farm-1920.png) |
| Farm 1366×768 | [Ảnh](docs/phase9/before-farm-1366.png) | [Ảnh](docs/phase9/after-farm-1366.png) |
| Farm 390×844 | [Ảnh](docs/phase9/before-farm-390.png) | [Ảnh](docs/phase9/after-farm-390.png) |
| Chợ 1920×1080 | [Ảnh](docs/phase9/before-market-1920.png) | [Ảnh](docs/phase9/after-market-1920.png) |
| Chợ 1366×768 | [Ảnh](docs/phase9/before-market-1366.png) | [Ảnh](docs/phase9/after-market-1366.png) |
| Chợ 390×844 | [Ảnh](docs/phase9/before-market-390.png) | [Ảnh](docs/phase9/after-market-390.png) |
| Farm, camera trùng baseline | [Ảnh](docs/phase9/before-farm-matched-1366.png) | [Ảnh](docs/phase9/after-farm-matched-1366.png) |
| Chợ, camera trùng baseline | [Ảnh](docs/phase9/before-market-matched-1366.png) | [Ảnh](docs/phase9/after-market-matched-1366.png) |
| Farm ban ngày | [Ảnh](docs/phase9/before-farm-day.png) | [Ảnh](docs/phase9/after-farm-day.png) |
| Farm ban đêm | [Ảnh](docs/phase9/before-farm-night.png) | [Ảnh](docs/phase9/after-farm-night.png) |
| Farm trời mưa | [Ảnh](docs/phase9/before-farm-rain.png) | [Ảnh](docs/phase9/after-farm-rain.png) |
| Sau trồng cây/xây cối xay | [Ảnh](docs/phase9/before-farm-planted-built.png) | [Ảnh](docs/phase9/after-farm-planted-built.png) |
| Grid khi xây dựng | [Ảnh](docs/phase9/before-farm-build-grid.png) | [Ảnh](docs/phase9/after-farm-build-grid.png) |
| Toàn bộ trang trí | [Ảnh](docs/phase9/before-farm-decoration-catalog.png) | [Ảnh](docs/phase9/after-farm-decoration-catalog.png) |

Ảnh viewport mặc định dùng camera mặc định của từng phiên bản để chứng minh thay đổi tỷ lệ. Hai cặp `matched` cố định zoom 0.72, điểm giữa màn hình và vị trí nhân vật như baseline để so sánh mỹ thuật độc lập với camera. Cùng scene, fixture, viewport, giờ và mùa; chuyển động phụ có thể khác pha.

## Các tương tác trong browser

- Phím E mở đúng mua hạt giống, bán nông sản và đơn hàng.
- Pointer vào cửa nhà, ao và chuồng mở đúng panel/context menu.
- Kéo chuột qua ba ô bằng pixel chiếu thực tế: database nhận đủ ba ô đã cuốc.
- Cây trồng, cối xay, cá và gà hiện trên cảnh sau khi thêm qua nghiệp vụ server.
- Touch vào crop trên viewport 390×844 cập nhật `watered_at` trong database.
- Touch vào từng quầy trên mobile mở panel và giữ panel mở.
- Camera biến đổi hai chiều đúng tại ao; kiểm tra hình ảnh khi đổi focus/pan.
- Grid xây dựng chỉ xuất hiện khi chọn công trình; trạng thái đi dạo không phủ lưới.
- Kiểm tra reduced effects, ngày/đêm/mưa, sprite, ground anchor và occlusion.

Ảnh tương tác: `docs/phase9/{before,after}-interact-{seed,buyer,orders}.png` và `*-mobile-interact-*.png`. Baseline có lỗi panel tự đóng khi mở bằng pointer/touch: kịch bản ghi nhận và dùng phím E để lấy ảnh BEFORE panel. AFTER bắt buộc pointer/touch hoạt động, không dùng fallback.

## Đánh giá hình ảnh

Đã mở và xem ảnh render farm desktop/mobile, chợ desktop/mobile, cảnh trồng/xây dựng và các quầy mới. Ba quầy khác rõ về silhouette: mái lá thấp với khay giống; mái ngói rộng với cân và rau; mái xanh cao với bảng đơn, kiện hàng và xe kéo. Có người bán khác trang phục/giới tính/ngoại hình, không phải đổi tên cùng sprite.

Nhà chính nằm giữa sân gạch và cảnh quan, ruộng/ao/chuồng có đường kết nối, cỏ chuyển sắc thay nền bàn cờ. Các sprite chính dùng cùng phép chiếu và ground anchor. Trên mobile cần di chuyển nhân vật để xem các khu xa; không nhồi cả bản đồ vào màn hình hẹp.

## Kết quả và hiệu năng

Kết quả máy đọc được: [BEFORE](docs/phase9/before-metrics.json), [AFTER](docs/phase9/after-metrics.json). Báo cáo bao gồm danh sách ảnh, các assert thao tác, lỗi console và mẫu 120 frame ở farm ban ngày cùng fixture đã trồng/xây dựng.

Đã phát hiện bản thử đầu có frame time tăng khi raster SVG mỗi frame. Bản cuối cache bitmap. Số đo cuối, cùng viewport 1366×768, farm ban ngày có crop/cối xay/VAC và bật hiệu ứng:

| Chỉ số | BEFORE | AFTER |
| --- | --- | --- |
| Median frame | 16,7 ms | 16,7 ms |
| p95 frame | 16,8 ms | 16,8 ms |
| FPS từ median | ~60 | ~60 |
| JS heap mẫu cuối | 2.565.722 byte | 2.058.667 byte |
| Lỗi game ghi nhận | 0 | 0 |
| Assert tương tác AFTER | — | 14 PASS |
| Screenshot | 22 | 22 |

BEFORE có hai yêu cầu intercept bị hủy khi browser điều hướng; được ghi riêng ở `protocolCancellations`, không phải lỗi runtime của game. AFTER không có hủy intercept. Không dùng số FPS để suy ra hiệu năng trên mọi thiết bị. Heap chỉ bao gồm JS heap và chịu ảnh hưởng của GC; không kết luận tối ưu tổng RAM từ một mẫu.

Regression Phase 1–8: `node tests/run.mjs` — **44/44 PASS**, không skip hoặc fail. Browser AFTER — **14/14 PASS**, không có lỗi console.

Giới hạn: chưa thử thiết bị mobile vật lý hoặc stress test nhiều giờ. Không kết luận đã kiểm chứng mọi cách xếp công trình/trang trí tùy ý; vị trí hợp lệ vẫn do server kiểm tra.

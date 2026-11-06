# BIG UPDATE Chợ Làng — báo cáo triển khai

## CP0: baseline và nguyên nhân

- HEAD trước thay đổi: `ce3bfc7fc331b455bc4143d2604822a295d6dcc4`, nhánh `main`. Working tree ban đầu chỉ có tài liệu kế hoạch chưa được Git theo dõi.
- `drawIsoMarket()` trong `public/js/main.js` gọi `drawSurroundings()` trước khi vẽ nền Chợ. Hàm này dùng `surroundings-v10.svg` cho cả Farm và Chợ; SVG có các polygon thửa ruộng viền xanh nhạt lặp thành lưới hình thoi trong phép chiếu isometric. `market-life-ground-v10.svg` tiếp tục vẽ đường be rộng và sân có rìa cứng. Đây là lớp mỹ thuật, không phải ô canh tác, quyền sở hữu đất hay debug grid.
- Ảnh baseline Chợ: [1366×768](before-market-1366.png), [1920×1080](before-market-1920.png), [mobile 390×844](before-market-mobile.png). Các ảnh sau được chụp cùng vị trí nhân vật `(600,540)`, camera mặc định và kích thước tương ứng.
- Automated tests trước thay đổi: 85/85 PASS. `browser-phase9-qa.mjs baseline` chụp được ảnh nhưng dừng ở assertion quầy hạt giống dòng 84; chạy lại trên code sau thay đổi cũng dừng cùng assertion. Kịch bản này thuộc phase 9 cũ.

## CP1–CP5: thay đổi

| CP | File | Thay đổi | Ảnh hưởng gameplay |
| --- | --- | --- | --- |
| CP1–CP2 | `public/assets/market-meadow-v11.svg`, `public/assets/market-surroundings-v11.svg`, `scripts/generate-market-ground.cjs` | Cỏ, mảng màu và chi tiết đất sinh theo seed cố định; đường cong và sân đất liền mạch; ngoại cảnh Chợ bỏ thửa hình thoi. SVG được raster một lần và dùng lại. | Chỉ hình ảnh; không đổi tọa độ hay hitbox. |
| CP1 | `public/js/main.js` | Chợ dùng ngoại cảnh riêng, giảm bitmap ngoại cảnh về 1600 px như ngoại cảnh cũ. | Renderer Farm và ô canh tác giữ nguyên. |
| CP3 | Asset Chợ mới | Sân rộng trước ba quầy, nhánh đất dẫn tới nhà, giếng, cây đa và cổng; giữ nguyên sprite quầy, nhà, tre, hoa, cây đa, giếng. | Không đổi asset tương tác. |
| CP4 | `public/js/marketVisitors.js`, `public/js/main.js` | Ba khách vãng lai đi theo route, dừng xem quầy và dùng pathfinding/collider hiện có. Culling theo camera. | Chỉ animation client; NPC nhiệm vụ, kinh tế và multiplayer vẫn theo server. |
| CP5 | UI hiện có | Nhãn quầy, nút về Farm và điều hướng làng giữ luồng đang hoạt động; kiểm tra thêm mobile và zoom. | Không đổi giao dịch. |

Asset mới được tạo trong repo bằng `scripts/generate-market-ground.cjs`, không lấy hình hay texture bên ngoài. Cỏ có biến thiên seed cố định; lớp nền SVG dùng một bitmap Chợ và một bitmap ngoại cảnh, không tạo random mỗi frame. Render order: ngoại cảnh → đất/đường/sân → màu mùa → vật thể/bóng/NPC theo y-sort → UI.

## CP6: bằng chứng

- Sau: [1366×768](after-market-1366.png), [1920×1080](after-market-1920.png), [mobile](after-market-mobile.png), [landscape](after-market-mobile-landscape.png), [zoom gần](after-market-close.png), [góc rộng](after-market-wide.png), [bố cục 125%](after-market-browser-zoom-125pct.png).
- Chuyển động: [frame 00](animation-00.png) đến [frame 07](animation-07.png), chụp liên tiếp; khách đi từ lối vào, dừng trước quầy rồi tiếp tục đi.
- Route/collider: `node --test tests/marketVisitors.test.js` kiểm tra đường đến ba quầy, giếng, cây đa, cổng; khách không đi xuyên collider và có fallback khi đích bị chặn.
- `npm test`: 87/87 PASS; bộ test có server economy, quyền truy cập, multiplayer, Farm, ao cá, sân gà, hàng rào và đất chưa mua.
- `node --experimental-websocket tests/browser-village-life.mjs qa`: 14/14 PASS, gồm chuyển Farm/Chợ, mua/bán qua server và popup mobile.
- `node --experimental-websocket tests/browser-big-market-qa.mjs`: 9/9 PASS trong phiên 10 phút; [log đo](qa.json) có 35.898 frame mẫu, p50/p95 đều khoảng 16,7 ms, JS heap 2,80 → 5,39 MB, không có console error hoặc asset request thất bại. Bộ đo phase 9 trước thay đổi ghi p95 khoảng 16,8 ms trong mẫu ngắn; đây không phải baseline 10 phút nên chỉ dùng tham khảo.
- `MARKET_QA_DURATION_MS=3000 node --experimental-websocket tests/browser-big-market-qa.mjs`: 11/11 PASS; [log touch và mất mạng](qa-short.json) xác nhận touch bắt đầu di chuyển, giao dịch offline báo lỗi và không trừ tiền. Các `ERR_INTERNET_DISCONNECTED` trong log là lỗi được tạo có chủ đích.
- `node tests/browser-terrain-visual.mjs after`: PASS ở 1920×1080, 1366×768, 390×844; p95 lần lượt 18,5 / 18,5 / 18,3 ms, không có page error.
- `node tests/browser-house-collision-qa.mjs`: PASS 4 hướng bàn phím, click đi vòng nhà và hồi phục vị trí lưu trong nhà.
- `node tests/browser-animal-motion-qa.mjs`: PASS 50 mẫu chuyển động gà, cho gà/cá ăn trực tiếp và bố cục mobile.
- Chạy lại `scripts/generate-market-ground.cjs` cho SHA-256 hai asset không đổi.
- `npm run qa:browser`: FAIL ở các assertion cũ của Farm. Script này còn dùng tọa độ bảng/nhà/đèn trước khi collider và UI được cập nhật ở phase 9, và đòi `#status` phải visible dù layout mới ẩn nó. Các kiểm tra Farm tương ứng ở unit test và ba browser script chuyên biệt phía trên PASS. `browser-phase9-qa.mjs` cũng dừng ở assertion quầy hạt giống trên cả baseline và bản mới. Hai script legacy cần được cập nhật riêng.

## Kết luận

**GO WITH FIXES.** Nội dung Chợ đạt các acceptance về hình ảnh, di chuyển, giao dịch và không có hồi quy được quan sát ở Farm. Hai script browser legacy còn assertion lỗi thời; chưa gắn nhãn COMPLETE khi chúng vẫn FAIL. Không có thay đổi schema, kinh tế server hoặc dữ liệu người chơi.

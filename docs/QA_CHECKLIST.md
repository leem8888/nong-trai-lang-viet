# QA cập nhật — 2026-11-05

Bản `main` tại `d0df3d9b30509cf32916d2a379a687af49666245`: `npm test` 53/53; browser contextual 14/14, browser chung 14/14, VAC 5/5, Phase 5 13/13, Phase 6 12/12, Phase 7 multiplayer 4/4. Đã kiểm tra thao tác từ xa tự đi tới, di chuyển quanh công trình, cửa hàng không đổi kích thước giữa ba nhóm và ảnh farm desktop/mobile. Xem `CONTEXTUAL_UX_REPORT.md`; các bảng bên dưới là nghiệm thu lịch sử tại thời điểm ghi.

# Nghiệm thu lịch sử Phase 1–5 — 2026-11-03

## Phase 6 — 2026-11-03

PASS ở môi trường phát triển: `npm test` 34/34; Edge `qa:phase6` 12/12, `qa:browser` 14/14, `qa:vac` 5/5, `qa:phase5` 13/13. Bốn NPC, năm main + hai side quests, đồng hồ/ngày đêm, thời tiết/mùa, auth/CSRF/ownership/replay, migration dữ liệu v5→v6 và mobile/console đã kiểm tra. Bằng chứng chi tiết và giới hạn ở `PHASE6_REPORT.md`. Thiết bị cảm ứng vật lý và chạy tải dài hạn: NOT VERIFIED.

Trạng thái: **PASS ở môi trường phát triển**. Đã kiểm tra bằng Microsoft Edge 156 headless qua Playwright, Node.js 20.19.6, SQLite tạm. Sau Phase 4: `npm test` **23 pass, 0 fail**; `npm run qa:browser` **14 nhóm PASS**; `npm run qa:vac` **5 nhóm PASS**. Script browser và ảnh kiểm tra ở `tests/browser-qa.mjs`, `tests/browser-vac-qa.mjs` và `.qa/`.

Playwright không có trong dependency dự án nhưng có sẵn trong npm cache của máy QA. Lệnh thực tế: `$env:PLAYWRIGHT_MODULE='file:///C:/Users/tuanbna.EDS/AppData/Local/npm-cache/_npx/423231821c231c73/node_modules/playwright/index.mjs'; npm run qa:browser`. Edge được khởi chạy bằng executable hệ thống. Thử cài Playwright offline vào `.qa` trả `ENOTCACHED`; dùng bản cache có sẵn, không thêm dependency vào game.

## Phase 1

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Đăng ký, đăng nhập, đăng xuất, hai farm độc lập | PASS | Browser tạo hai tài khoản, đăng xuất/đăng nhập lại đúng farm; test API chống đọc farm khác HTTP 403 |
| Bản đồ, camera, di chuyển, collision | PASS | Edge di chuyển bằng bàn phím từ x=720 tới x≈630; đụng nhà dừng ở x≈465, không xuyên vùng x≥480; ảnh desktop/mobile và test biên map |
| Ba tương tác | PASS | Browser mở bảng farm, cửa nhà và đổi đèn 0→1 bằng E; test reload/reconnect giữ đèn |
| SQLite, Socket.IO, reload/restart | PASS | Browser reload; test Phase 1 kiểm tra join/leave/reconnect, snapshot, khởi tạo lại database và từ chối socket vô danh |
| Layout, chuột/bàn phím, console | PASS | Browser nhấp ruộng và nút, dùng E/WASD; Edge không phát sinh `pageerror`; viewport 390 px có `scrollWidth=390` |

## Phase 2

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Cuốc, gieo, tưới, thu hoạch, túi đồ | PASS | Browser dùng chuột trên ô (0,0), gieo và tưới rau cải, túi đồ hiển thị hạt, thu hoạch được 2 rau cải |
| Sáu cây, bốn giai đoạn, offline growth | PASS | Test Phase 2 gieo đủ sáu cây, xác nhận SEED/SPROUT/GROWING/MATURE và cây chín sau 3 ngày; browser tăng `planted_at` trong database thử rồi reload để thu hoạch, không dùng đồng hồ client |
| Chống thu hoạch trùng, kho đầy, nhận hạt giới hạn | PASS | Test Phase 2 kiểm tra rollback khi kho đầy, một lần thu hoạch thành công, gói hạt tối đa một lần/ngày UTC |
| Quyền farm, CSRF, hai tab, migration/restart | PASS | Test Phase 2 kiểm tra từ chối farm khác và CSRF, broadcast tới hai socket, giữ cây/kho qua reopen và migration v1→v3 |

## Phase 3

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Farm ↔ chợ, NPC, layout | PASS | Browser chuyển bằng E qua hai cổng, mở quầy hạt/thu mua/bảng đơn; ảnh chợ desktop và farm mobile đã xem |
| Mua/bán, ví, lịch sử | PASS | Browser ví 200→186 khi mua 1 hạt cải, hai tab mua trùng ID chỉ trừ một lần còn 172, bán 2 rau cải còn 196; lịch sử hiển thị |
| Đơn hàng và giới hạn | PASS | Browser nhận/giao đơn `greens`; test xác nhận cả 6 mẫu chỉ nhận một lần/farm, không thưởng trùng, thiếu nguyên liệu bị từ chối |
| Atomic/rollback, số dư âm/tràn, retry | PASS | Test Phase 3 kiểm tra thiếu tiền/hàng, kho đầy, giới hạn ví, payload sai, retry cùng ID, key khác payload bị từ chối; browser lỗi thiếu tiền giữ số dư 172 |
| Biên nhận sau rời chợ | PASS | Test mới: giao dịch mua xong về farm, gửi lại cùng ID trả `replayed=true`, giữ nguyên số dư và transaction ID |
| Authorization/CSRF/scene | PASS | Browser: farm khác HTTP 403, thiếu CSRF HTTP 403; test socket: ở chợ không bật được đèn farm; mua/bán cần đứng gần đúng NPC |
| Giá chợ UTC, persistence | PASS | Test featured +15%, sai market ID bị từ chối, ví/đơn giữ qua reopen; starter v3 không chứa tài khoản thử |

## Giới hạn bằng chứng

- Browser QA dùng database tạm, di chuyển bằng bàn phím để kiểm tra vận tốc/va chạm và đặt vị trí thử gần các điểm tương tác để đi nhanh qua toàn bộ luồng. Chưa ghi video đi bộ liên tục qua mọi tọa độ của hai bản đồ.
- Tăng trưởng offline được kiểm tra bằng cách lùi mốc `planted_at` ở database thử và reopen; không chờ nguyên 15 phút trong phiên QA. Logic thời gian UTC và restart có test tự động.
- Chưa thử thiết bị cảm ứng vật lý, gián đoạn mạng thật kéo dài, hoặc triển khai production HTTPS. Đây là kiểm thử trước phát hành, không thuộc Definition of Done của Phase 1–3 trong môi trường phát triển.

## Phase 4 — VAC

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Gate Phase 1–3 | PASS | Test cũ 16/16 và Edge browser 14/14 trước thay đổi; regression vẫn pass sau VAC |
| Ao cá | PASS | Browser mua cá rô phi giống, thả/cho ăn, reload sau mốc offline thử, thu hoạch 2 cá; test cả cá chép, sức chứa 6, non/đủ tuổi, thu hoạch trùng và kho đầy |
| Chuồng gà | PASS | Browser mua gà, thêm chuồng, lớn offline, cho ăn, nhặt 3 trứng; test sức chứa 4, trứng tối đa 3/con, nhặt trùng/kho đầy |
| Vòng tài nguyên | PASS | Browser đổi đậu nành→thức ăn cá, ngô→thức ăn gà; test lúa→thức ăn gà và thiếu nguyên liệu/rollback |
| Chợ và kinh tế | PASS | Browser mua giống/thức ăn: ví 200→84; bán 2 cá + 3 trứng: ví 84→217; test dùng chung wallet/ledger, thiếu tiền, retry |
| Quyền và idempotency | PASS | Test HTTP CSRF, cross-account, sai scene, hai socket nhận broadcast và hai request cùng ID chỉ thả một cá |
| Offline/restart/migration | PASS | Test UTC clock injection, 5 phút/2 giờ/nhiều ngày, trần trứng, reopen; sao chép backup v3 có dữ liệu rồi nâng lên v4: user 1, farm 1, crop 1, inventory 6, ví 200, order 0 giữ nguyên; thêm 1 ao và 1 chuồng, integrity `ok` |
| Canvas/UI/layout/console | PASS | Xem ảnh `vac-pond.png`, `vac-coop.png`, `vac-mobile.png`; E và nút chuột hoạt động; 390 px không tràn ngang; không có `pageerror` |

Browser Phase 4 dùng SQLite tạm và đặt nhân vật gần điểm tương tác để rút ngắn di chuyển; kịch bản vẫn thực hiện chuyển cảnh bằng E. Cá/gà/trứng được tăng tốc bằng cách lùi timestamp **trong database thử** rồi reload, không chờ 90–150 phút thật. Đã kiểm tra browser Edge headless, chưa kiểm tra thiết bị cảm ứng vật lý hoặc production network.
## Phase 5 — nghiệm thu môi trường phát triển (2026-11-03)

Trạng thái: **PASS các kịch bản đã chạy**. Node 20.19.6, Microsoft Edge headless qua Playwright, SQLite tạm; `npm test` **29/29**, `npm run qa:browser` **14/14**, `npm run qa:vac` **5/5**, `npm run qa:phase5` **13/13**. Browser Phase 5 tạo hai tài khoản, hai tab; không có `pageerror`. Test tăng tốc chín lúa và hoàn thành mẻ bằng cách lùi timestamp **chỉ trong SQLite thử**; không chờ 90 phút thực.

| Nhóm | Kết quả | Bằng chứng |
|---|---|---|
| Lúa → gạo → chợ | PASS | Edge cuốc/gieo/gặt lúa bằng chuột, xây cối và xoay bằng R, bắt đầu mẻ, reload sau offline, nhận gạo, bán tại NPC |
| Công thức và công trình | PASS | Test service chạy đủ 6 recipe với đầu vào thật Phase 2/4, 3 công trình, slot 1/2/1, thời lượng snapshot, claim sớm/trùng/kho đầy, move/store khi rảnh |
| Trang trí | PASS | Chợ mua đèn, Canvas đặt/di chuyển/cất; inventory 1→0→1. Registry có 15 loại và test ownership/không nhân đôi |
| Mở đất | PASS | Browser UI cấp 1 và HTTP cấp 2, mua trùng ID không trừ thêm; test sai thứ tự/thiếu tiền/giá giả; reload và restart giữ cấp 2 |
| Vị trí/collision | PASS | Server chặn nhà, ao, chuồng, ruộng, vật đã đặt, vùng khóa và người đứng tại ô; flood fill giữ lối đến cổng, ruộng, ao, chuồng; movement dùng collision vật đặt |
| Quyền, CSRF, rollback | PASS | Browser CSRF 403, tài khoản khác bị từ chối, scene chợ không sửa farm, receipt replay; test atomic tiền/kho/job, ID giả, rotation sai |
| Migration v5 | PASS | Backup trước migration `data/backups/farm-2026-11-03T08-13-53-958Z.sqlite`; copy nhất quán v4→v5 giữ 1 user/1 farm/15 soil/16 crop/7 inventory/1 wallet, integrity và FK `ok`, mở lại không chạy migration lần hai. `starter.sqlite` v5 rỗng. DB cục bộ sau nâng v5 vẫn giữ các dòng và integrity `ok` |
| Layout, FPS và restart | PASS | Đã xem `.qa/phase5-farm.png` và `.qa/phase5-mobile.png` (390 px), mouse/keyboard, không `pageerror`; browser restart HTTP server cùng SQLite giữ công trình, vật phẩm và đất; 100 decoration đạt khoảng 60 FPS trong Edge headless tại máy QA |

Giới hạn: art Canvas là hình tạm; chưa kiểm thử máy cảm ứng vật lý/production HTTPS. Browser test dùng thao tác điều hướng nhanh bằng cập nhật vị trí trong SQLite thử; đường đi/collision nền được regression Phase 1 kiểm tra. FPS khoảng 60 chỉ là phép đo 1,2 giây với 100 đường gạch trên máy QA, chưa chứng minh hiệu năng trên thiết bị yếu hoặc nhiều trăm vật; giá, thời gian và biên lợi nhuận cần playtest người thật. Preview là chỉ báo cục bộ; quyết định đặt cuối cùng thuộc server.
# Phase 8 QA bổ sung — 2026-11-04

Cập nhật nhánh `feature/phase-8-completion`: 10 phút hành trình người mới qua; 17 popup trên 5 viewport qua; mạng chậm/offline qua; unit 36/36 và browser Phase 1–7 đều qua. Browser zoom thật 125% chưa kiểm được do công cụ Windows UI lỗi; xem `PHASE8_REPORT.md`. Không đánh dấu Phase 8 hoàn thành.

Xem `PHASE8_REPORT.md` cho lệnh, ảnh trước/sau, FPS và trạng thái từng kịch bản. Đã chạy unit 36/36 và browser Phase 1–7 trên Edge headless; CSS zoom 125% không tràn ngang. Chưa thử điện thoại vật lý, browser zoom thật, mạng chậm hoặc mọi popup trên cả 5 kích thước.


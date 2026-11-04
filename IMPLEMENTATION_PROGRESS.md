# Tiến độ triển khai

## Phase 7 — social farms (môi trường phát triển)

Nhánh `feature/phase-7-social-farms` từ `3b3e174`. Tìm farm public/request, duyệt yêu cầu, mời tài khoản, thăm/di chuyển realtime, biểu cảm, kick, private revoke, giới hạn 8 khách và một avatar/tài khoản đã triển khai. Migration v7 bảo toàn dữ liệu Phase 1–6 trên bản sao backup. Chi tiết test và giới hạn ở `PHASE7_TEST_REPORT.md`; API ở `PHASE7_API_CONTRACT.md`. Chưa push/merge.

## Phase 6 — complete ở môi trường phát triển

Gate 0: Phase 5 baseline `86b1859`, `npm test` 29/29, backup SQLite v5 bằng backup API. Triển khai bốn NPC có lịch/hội thoại, năm main quest, hai side quest UTC, đồng hồ thế giới 24 phút/ngày, ba thời tiết và bốn mùa chỉ ảnh hưởng hình ảnh/lời thoại. Migration v6 giữ nguyên dữ liệu cũ. `npm test` 34/34; Edge `qa:phase6` 12/12, `qa:browser` 14/14, `qa:vac` 5/5, `qa:phase5` 13/13. Xem `PHASE6_TEST_REPORT.md` và `PHASE6_HANDOFF.md`. Chưa kiểm tra thiết bị cảm ứng vật lý hoặc tải dài hạn; không có Phase 7.

## Phase 5 — complete ở môi trường phát triển

Gate 0: Phase 1–4 `npm test` 23/23, Edge 14/14, backup trước migration. Sau triển khai: `npm test` **29/29**, `npm run qa:browser` **14/14**, `npm run qa:vac` **5/5**, `npm run qa:phase5` **13/13** trên Edge; `npm run economy:phase5` chạy được. Migration v4→v5 trên bản sao giữ dữ liệu và integrity/FK `ok`; `starter.sqlite` v5 rỗng. Chi tiết ở `QA_CHECKLIST.md`.

| Gói | Trạng thái | Bằng chứng |
|---|---|---|
| P5.0 Review/backup | Hoàn thành | Backup `farm-2026-11-03T08-13-53-958Z.sqlite`, Gate 0 test 23/23 |
| P5.1 Migration/registry | Hoàn thành | v5 append-only, 6 recipe, 3 building, 15 decoration, 2 cấp đất; bản sao v4 giữ toàn bộ bảng cũ |
| P5.2–P5.3 Crafting | Hoàn thành | Offline job, 1/2/1 slot, snapshot thời gian/sản lượng, claim một lần, kho đầy giữ READY; test và Edge |
| P5.4 Placement | Hoàn thành | Xoay/đặt/di chuyển/cất công trình; server kiểm tra va chạm, vùng đất, đường thiết yếu, vị trí người; Edge và test |
| P5.5 Decoration | Hoàn thành | Chợ bán 15 loại; đặt/di chuyển/cất đồng bộ inventory, Edge và test |
| P5.6 Expansion | Hoàn thành | Cấp 1 giá 180, cấp 2 giá 280; giao dịch atomic/idempotent, reload/restart giữ trạng thái |
| P5.7 Kinh tế/Canvas/UI | Hoàn thành ở mức art tạm | Chợ bán 6 thành phẩm, cấu hình giá server, Canvas ghost/ranh giới/hoạt họa đơn giản, bảng chế biến/xây/trang trí/mở đất |
| P5.8–P5.9 Security/QA/docs | Hoàn thành ở development | Auth/CSRF/scene/range/receipt/rollback, 29 unit/integration và 32 nhóm browser tổng; tài liệu và handoff cập nhật |

Các giá trị tiền, thời lượng, asset là giả thuyết playtest. Edge headless đo khoảng 60 FPS với 100 decoration; chưa đo trên thiết bị yếu hoặc nhiều trăm vật và chưa thử thiết bị cảm ứng vật lý. Đây là việc trước phát hành, không thuộc cổng Phase 5 hiện tại. Master context không thay đổi.

## Phase 4 — complete ở môi trường phát triển

Gate 0: test 16/16, browser Edge 14/14; đã backup SQLite trước migration. Sau triển khai: `npm test` **23/23**, `npm run qa:browser` **14/14**, `npm run qa:vac` **5/5**. Migration v4 an toàn trên bản sao dữ liệu v3; `data/starter.sqlite` v4 không có user; database chơi v4 integrity `ok`. Chi tiết ở `QA_CHECKLIST.md` và `HANDOFF.md`.

| Gói | Trạng thái | Bằng chứng |
|---|---|---|
| P4.0 Preflight | Hoàn thành | Commit nền `9b3d8d1`, tests/browser Gate 0, backup trước migration |
| P4.1 Schema/registry | Hoàn thành | Migration v4, 8 item VAC, 2 loại cá, gà và 3 công thức; copy v3→v4 giữ user/farm/crop/kho/ví/đơn |
| P4.2 Ao cá | Hoàn thành | 6 chỗ, thả/cho ăn/thu hoạch, offline, rollback/idempotency; browser + test |
| P4.3 Chuồng gà | Hoàn thành | 4 chỗ, trưởng thành offline, mỗi chu kỳ 3 trứng, nhặt/cho ăn lại; browser + test |
| P4.4 Vòng tài nguyên | Hoàn thành | Đậu nành→thức ăn cá, ngô/lúa→thức ăn gà, transaction atomic |
| P4.5 Kinh tế | Hoàn thành | Chợ mua con giống/thức ăn và bán cá/trứng qua wallet/ledger cũ; báo cáo lợi nhuận thử nghiệm |
| P4.6 Canvas/UI | Hoàn thành ở mức art tạm | Bờ ao/gợn nước/cá, chuồng/gà/trứng, hai bảng VAC, HUD; ảnh Edge desktop/mobile đã xem |
| P4.7–P4.8 Security/QA/docs | Hoàn thành | Ownership, scene/range, CSRF, hai socket, retry, 23/23 test và 19/19 nhóm browser tổng |

Cập nhật: 2026-11-03. Tài liệu này ghi tình trạng code thực tế; `PROJECT_MASTER_CONTEXT.md` là bản thiết kế cố định.

| Gói | Trạng thái | Bằng chứng |
|---|---|---|
| P1.1 Setup | Hoàn thành ở mức development | `package.json`, `server/index.js`, `server/db.js`; health endpoint được kiểm thử |
| P1.2 Auth và ownership | Hoàn thành nền tảng | `server/auth.js`, `server/farms.js`; hai user/farm, CSRF, truy cập trái phép được kiểm thử |
| P1.3 Engine | Hoàn thành | Edge: WASD đưa x=720→≈630; va nhà dừng x≈465; camera desktop/mobile đã kiểm tra |
| P1.4 Starter map | Hoàn thành ở mức asset tạm | Đã xem ảnh Edge desktop/mobile: nhà, sân, ruộng, hàng rào, cây, chỗ ao/chuồng |
| P1.5 Interactions | Đã triển khai; đèn được kiểm thử server | Bảng, cửa, đèn; trạng thái đèn lưu SQLite |
| P1.6 Persistence/Socket.IO | Đã triển khai và kiểm thử tự động phần chính | Snapshot, room join/leave/reconnect, quyền, vị trí, đèn, mở lại database |
| P1.7 UI và QA | Hoàn thành | Playwright Edge, console không có pageerror; xem `QA_CHECKLIST.md` |

Phase 1 **complete ở môi trường phát triển**: đạt Definition of Done với browser QA và test Phase 1 4/4. Bằng chứng chi tiết ở `QA_CHECKLIST.md`.

## Phase 2 — complete

| Gói | Trạng thái | Bằng chứng |
|---|---|---|
| P2.0 Gate 0 | Hoàn thành | Playwright chạy trên Edge thật; Gate 0 đạt |
| P2.1 Migration/registry | Đã triển khai và kiểm thử | Migration v2; sáu cây; database cũ còn 1 user/1 farm, integrity ok |
| P2.2 Đất/công cụ | Đã triển khai và kiểm thử logic | 15 ô; cuốc, gieo, tưới, thu hoạch có kiểm tra vị trí |
| P2.3 Offline growth | Đã triển khai và kiểm thử | UTC server, snapshot thời lượng, 4 giai đoạn, cây vẫn chín sau nhiều ngày |
| P2.4 Inventory | Đã triển khai và kiểm thử | Hạt và nông sản lưu SQLite; gieo/thu hoạch giao dịch; gói hạt giới hạn ngày |
| P2.5 UI | Hoàn thành | Browser cuốc/gieo/tưới/thu hoạch bằng chuột, mở túi đồ, kiểm tra màn hình 390 px |
| P2.6 Network/security | Đã triển khai và kiểm thử | Auth, CSRF, quyền farm, khoảng cách, rate limit, Socket.IO broadcast tới hai tab |
| P2.7 QA/docs | Hoàn thành | Test Phase 2 5/5, browser gameplay đạt; chi tiết ở `QA_CHECKLIST.md` |

`npm ci` cài sạch trong thư mục tạm ở đợt Phase 2: 124 package, 0 vulnerability. Kiểm thử nghiệm thu hiện dùng database và cổng tạm do script tạo; không tác động dữ liệu chơi.

Ghi chú lịch sử Phase 2: starter ở thời điểm đó là v3; **hiện đã là v4**. Database chơi vẫn cục bộ và bị Git bỏ qua.

## Phase 3 — complete

| Gói | Trạng thái | Bằng chứng |
|---|---|---|
| P3.0 Gate Phase 2 | Hoàn thành | Phase 2 đã nghiệm thu qua Edge và test tự động |
| P3.1 Ví và migration v3 | Đã triển khai, kiểm thử | Ví 200 Đồng Làng một lần, sổ giao dịch, receipt, migration giữ dữ liệu cũ |
| P3.2–P3.3 Mua/bán | Đã triển khai, kiểm thử | Giá server, trừ/cộng tiền và hàng atomic, retry cùng request ID an toàn |
| P3.4 Bản đồ chợ | Hoàn thành | Browser đi farm→chợ→farm bằng E, xem ảnh scene chợ |
| P3.5 Đơn hàng | Đã triển khai, kiểm thử | 6 mẫu, nhận/giao một lần mỗi farm, thưởng atomic |
| P3.6 Chợ phiên | Đã triển khai, kiểm thử | Chợ mở liên tục, một nông sản +15% mỗi ngày UTC |
| P3.7 UI/API/Socket | Hoàn thành | Browser mua/bán/giao đơn, hai tab cùng tài khoản đồng bộ ví; CSRF/ownership bị từ chối |
| P3.8 QA/docs | Hoàn thành | `npm test` 16/16; `npm run qa:browser` 14/14; receipt rời chợ, giới hạn đơn, lỗi scene được kiểm tra |

Trước migration v3 đã chạy backup; Phase 1–3 đạt Definition of Done ở môi trường phát triển ngày 2026-11-03. Những số liệu Phase 3 là lịch sử trước Phase 4. Hiện Phase 1–4 đã nghiệm thu ở môi trường phát triển; có thể bắt đầu Phase 5 theo yêu cầu riêng. QA trên thiết bị cảm ứng thật và HTTPS production vẫn chưa thực hiện.

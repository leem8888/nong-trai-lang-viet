# Handoff — Phase 4 VAC

Cập nhật 2026-11-03. Phase 1–4: **complete ở môi trường phát triển** theo Definition of Done tương ứng. `PROJECT_MASTER_CONTEXT.md` là bản thiết kế cố định, không sửa trong Phase 4. File này và `IMPLEMENTATION_PROGRESS.md` ghi trạng thái code thực tế.

## Chức năng hiện có

- Phase 1–3: tài khoản/farm riêng, Canvas, di chuyển/collision, trồng 6 cây offline, inventory, chợ NPC, ví Đồng Làng, 6 đơn hàng, SQLite v1–v3. Regression vẫn pass.
- Phase 4: một ao và một chuồng cho mỗi farm; cá rô phi/cá chép, gà con/trứng, thức ăn cá/gà, đổi đậu nành/ngô/lúa thành thức ăn, offline growth, thu hoạch và bán tại chợ. Số liệu và quy tắc cụ thể ở `GDD.md`.
- Source: `server/vac.js`, `server/db.js`, `server/index.js`, `server/marketConfig.js`, `public/js/vac.js`, `public/js/shared/vac.js`, cùng modules inventory/market cũ. API `GET /api/vac`, `POST /api/vac/action` yêu cầu auth/CSRF. Socket `farm:vac` đồng bộ hai tab.
- Mọi VAC mutation kiểm tra farm owner, scene, khoảng cách, payload, kho/sức chứa và request ID; transaction SQLite ghi vật phẩm, entity, sự kiện và receipt cùng lúc. Mua/bán tiếp tục dùng ví/ledger Phase 3.

## Migration và dữ liệu

- Trước migration v4 đã backup `data/farm.sqlite` tại `data/backups/farm-2026-11-03T07-37-18-951Z.sqlite`. Migration append-only thêm `farm_ponds`, `farm_coops`, `pond_fish`, `coop_chickens`, `vac_events`, `vac_request_receipts`; farm cũ nhận đúng một ao/chuồng. `createFarm` tạo ao/chuồng cho farm mới.
- `data/starter.sqlite` đã lên schema v4, **0 user/farm/wallet**; integrity `ok`. Database chơi cục bộ đã lên v4, integrity `ok`; không đưa dữ liệu người chơi lên Git.
- Thử migration trên **bản sao** backup v3 có dữ liệu: trước/sau đều 1 user, 1 farm, 1 crop, 6 dòng inventory, ví 200, 0 order; sau upgrade có 1 ao và 1 chuồng, integrity `ok`. Database chơi trực tiếp có thể thay đổi do người dùng chơi tiếp; không so sánh số lượng trực tiếp với backup để suy ra mất dữ liệu.

## Bằng chứng nghiệm thu

- Gate 0 trước code: `npm test` **16/16**, `npm run qa:browser` **14/14** trên Edge 156 headless. Backup được tạo trước mở database v4.
- Sau code: `npm test` **23/23**; Phase 4 test ao/chuồng, 5 phút/2 giờ/nhiều ngày, restart, rollback kho đầy, trần trứng, conversion, kinh tế, migration, quyền/CSRF, hai socket và retry đồng thời.
- `npm run qa:browser` regression Phase 1–3 **14/14**; `npm run qa:vac` Phase 4 **5/5**, dùng Playwright với Edge và SQLite tạm. Browser hoàn thành mua giống/thức ăn → thả cá/thêm gà → đổi nông sản/cho ăn → thu hoạch cá/nhặt trứng → bán ở chợ → về farm; ví thử 200→84→217. Ảnh desktop/mobile trong `.qa/` đã xem, không có `pageerror`, viewport 390 px không tràn ngang.
- `npm run economy:report` in giá trị playtest: cá rô phi lãi 26 Đồng/81 phút với thức ăn mua, cá chép 27/135 phút, chu kỳ 3 trứng lãi 61 Đồng/135 phút sau chi phí thức ăn; gà con 70 Đồng cần khoảng 2 chu kỳ trứng để hoàn vốn.
- Browser QA tăng tốc thời gian bằng cách lùi timestamp trên database **thử** rồi reload; không chờ 90–150 phút thật. Unit tests dùng clock injection. Chi tiết PASS/giới hạn ở `QA_CHECKLIST.md`.

## Lỗi đã sửa và giới hạn

- Rate limit của market/VAC trước đây có thể chặn replay của receipt hợp lệ nếu xen vào request khác trong 120 ms. `server/index.js` nay cho receipt đã lưu đi qua, service vẫn xác minh payload hash.
- Chưa thử thiết bị cảm ứng vật lý, mạng production hoặc HTTPS public. Canvas dùng art tạm. Giá, thời gian và sản lượng vẫn là giả thuyết cần playtest; đây không phải điều kiện chặn bắt đầu Phase 5.

## Bước tiếp

Nếu người dùng yêu cầu Phase 5, đọc lại `PROJECT_MASTER_CONTEXT.md`, `GDD.md`, `IMPLEMENTATION_PROGRESS.md`, `HANDOFF.md`, `QA_CHECKLIST.md` và Phase5 spec trước khi code. Phase 5 mới được làm rice mill, crafting và construction; không lặp lại hệ đổi thức ăn VAC thành crafting engine.

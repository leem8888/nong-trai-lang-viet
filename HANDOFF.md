# Handoff hiện tại — Phase 8 (2026-11-04)

Đợt hoàn thiện này bắt đầu từ `main` commit `d1012036bf90fa162855f6e055a95e2c8bc22328` trên nhánh `feature/phase-8-completion` và được đưa lên `main` để AI web review theo yêu cầu. **Phase 8 vẫn INCOMPLETE** vì browser zoom thật 125% chưa kiểm được do lỗi công cụ Windows UI; xem `PHASE8_QA_REPORT.md` để biết toàn bộ PASS, giới hạn và ảnh. Không có migration; SQLite chơi được backup trước QA. Không làm deploy.

Mã thay đổi: panel chợ/VAC/chế biến/xây dựng có trạng thái và chỉ dẫn rõ hơn; âm thanh tổng hợp tùy chọn theo hành động; nhân vật/NPC, cây/tre, mùa vụ và quầy chợ có cải thiện; kết nối chỉ báo sẵn sàng sau `farm:join`; chế độ giảm hiệu ứng lưu cục bộ. Test browser Phase 1–7 và 85 lượt popup qua. Phần bên dưới là handoff lịch sử các phase trước.

# Handoff — Phase 6

Phase 7 đang ở branch `feature/phase-7-social-farms`; xem `PHASE7_HANDOFF.md`, `PHASE7_TEST_REPORT.md`, `PHASE7_API_CONTRACT.md` và `PHASE7_PRECHECK.md`. Phần Phase 6 bên dưới là lịch sử.

Cập nhật cuối Phase 6 (2026-11-03): đã hoàn tất ở môi trường phát triển trên nhánh `feature/phase-6-living-village`. Test 34/34; Edge Phase 6 12/12 và hồi quy 14/14 + VAC 5/5 + Phase 5 13/13. Migration v5→v6 trên bản sao dữ liệu có thật giữ nguyên mọi dòng và qua integrity/FK. Chi tiết API, schema, rollback, giới hạn và lệnh chạy ở `PHASE6_HANDOFF.md`; kết quả ở `PHASE6_TEST_REPORT.md`. Master context không đổi. Phần bên dưới là lịch sử triển khai, không phải trạng thái hiện tại.

Gate 0 (2026-11-03): baseline `86b1859`, nhánh `feature/phase-6-living-village`, `npm test` 29/29, backup trước migration ở `data/backups/farm-2026-11-03T09-45-42-594Z.sqlite`. Bản đồ kiến trúc và rủi ro ở `PHASE6_PRECHECK.md`. Chưa đánh dấu Phase 6 hoàn thành; phần Phase 5 bên dưới là trạng thái đã nghiệm thu.

## Handoff Phase 5 (lịch sử)

Cập nhật 2026-11-03. **Phase 5 complete ở môi trường phát triển**, Phase 1–4 vẫn đạt regression. `PROJECT_MASTER_CONTEXT.md` là tài liệu thiết kế cố định và chưa sửa. Phần Phase 4 bên dưới là lịch sử bàn giao.

## Phase 5 đã làm

- `server/db.js` migration v5 thêm `farm_buildings`, `farm_decorations`, `farm_expansions`, `crafting_jobs`, `phase5_receipts`; `farm_objects` Phase 1 tiếp tục chỉ lưu đèn. `public/js/shared/phase5.js` chứa 6 recipe, 3 building, 15 decoration, 2 cấp đất, item và giá. `server/phase5.js` thực hiện action trong transaction và receipt có hash payload; `server/world.js` dùng vật thể đặt để chặn di chuyển.
- `public/js/phase5.js` và `public/js/main.js` thêm bảng chế biến/xây/trang trí/mở đất, preview Canvas, xoay R, cất vào kho và đặt lại, công trình hoạt họa đơn giản. `server/marketConfig.js` bán thành phẩm và trang trí qua ví/kho/ledger Phase 3. API `GET /api/phase5`, `POST /api/phase5/action` yêu cầu auth, CSRF, farm owner; Socket `farm:phase5` đồng bộ tab.
- Job lưu thời gian và output snapshot; hoàn thành theo UTC server, không timer riêng. Kho đầy khi claim giữ job; công trình có job chưa nhận không thể cất/di chuyển. Cất công trình rảnh chuyển thành item trong túi, đặt lại không trả tiền lần hai. Hai cấp mở đất chỉ mở quyền đặt vật, không chặn người đi qua vùng chưa mở.

## Dữ liệu và migration

- Trước v5 đã backup database chơi qua `npm run backup` tại `data/backups/farm-2026-11-03T08-13-53-958Z.sqlite` (backup nhất quán ở schema v4). Kiểm thử v4→v5 trên **bản sao**: trước/sau 1 user, 1 farm, 15 soil, 16 crop, 7 inventory, 1 wallet; integrity và foreign keys `ok`, reopen không chạy lại migration. Sau đó `npm run backup` nâng DB cục bộ lên v5 và tạo backup `farm-2026-11-03T09-08-09-418Z.sqlite`. Đọc SQLite đang chạy phải qua SQLite backup để có cả WAL; copy riêng file `.sqlite` có thể nhìn thấy schema cũ.
- `data/starter.sqlite` tracked đã ở v5, **0 user/farm** và integrity `ok`. Không commit `data/farm.sqlite`, backup hoặc dữ liệu chơi thật.

## Kiểm thử thực tế

- Gate 0: `npm test` 23/23; Edge `npm run qa:browser` 14/14 trước code.
- Sau code: `npm test` **29/29**; Edge `npm run qa:browser` **14/14**, `npm run qa:vac` **5/5**, `npm run qa:phase5` **13/13**. Kịch bản mới trồng/gặt lúa bằng chuột, xây/di chuyển/cất cối, chế biến offline, nhận/bán gạo, mua/đặt/di chuyển/cất đèn, mở đất 1–2, hai tab/tài khoản, CSRF, replay, restart server, mobile 390 px và console không có `pageerror`.
- `node scripts/phase5-migration-check.mjs <sqlite>` kiểm tra migration trên bản sao; `npm run economy:phase5` báo margin thử nghiệm 6 công thức lần lượt +20/+20/+16/+20/+13/+22 Đồng so với bán nguyên liệu trực tiếp.

## Lỗi đã sửa, giới hạn và bước tiếp

- Test cũ dùng số migration cố định 4 gây fail hợp lệ khi thêm v5; đã cập nhật kỳ vọng lên 5, không bỏ test. Giá bán thành phẩm ban đầu cho biên lợi nhuận quá lớn; đã giảm còn mức thử nghiệm trên. Xây lại công trình từng cất nay tiêu thụ vật trong túi thay vì thu phí lần hai. Placement kiểm tra thêm người đứng trên ô và đường đi thiết yếu.
- Chưa thử thiết bị cảm ứng vật lý hoặc HTTPS production. Đo khoảng 60 FPS với 100 decoration trên Edge headless tại máy QA, chưa đo thiết bị yếu/nhiều trăm vật. Asset hiện là Canvas placeholder; giá và thời gian cần playtest. Job đã nhận của công trình bị cất được xóa khỏi bảng job để bảo toàn foreign key; không có lịch sử job dài hạn trong UI. Những điểm này không chặn nghiệm thu Phase 5 ở development nhưng cần lưu ý trước phát hành.
- Nếu bắt đầu Phase 6, đọc lại master context, GDD, progress, handoff, checklist và prompt Phase6. Không suy từ tài liệu thiết kế rằng chức năng đã có; xác nhận bằng repo/tests. Không mở rộng Phase 6 trong đợt này.

## Handoff Phase 4 (lịch sử)

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
# Phase 8 handoff tạm — 2026-11-04

Nhánh `feature/phase-8-player-experience` bắt đầu từ `c867fa6`. Đã backup SQLite chơi cục bộ trong `data/backups/`; kiểm thử dùng DB tạm. Tình trạng và phần chưa hoàn thành nằm trong `PHASE8_QA_REPORT.md`. Chưa push/merge/deploy và chưa tạo commit vì Definition of Done chưa đạt.


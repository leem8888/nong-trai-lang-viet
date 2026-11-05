# PHASE 6 — LÀNG VIỆT SỐNG ĐỘNG
## Master Implementation Plan — NPC, Story, Day/Night, Weather & Seasons

**Project:** Nông Trại Làng Việt  
**Repository:** https://github.com/leem8888/nong-trai-lang-viet  
**Phase 5 baseline:** `86b185948a1599ea7158e7a01ed311f200cbb3f0`  
**Status:** APPROVED FOR IMPLEMENTATION — NOT YET IMPLEMENTED  
**Delivery model:** Một lượt giao việc cho AI coding agent; tự thực hiện các gate tuần tự và sửa lỗi trước khi bàn giao.

> **LỆNH THỰC THI:** Đọc toàn bộ tài liệu này và source thực tế. Không dừng ở việc viết kế hoạch. Triển khai đầy đủ Phase 6, chạy test, browser QA, cập nhật tài liệu và báo cáo commit. Không tự nhận COMPLETE nếu thiếu bằng chứng kiểm thử.

---

## 0. Mục tiêu và nguyên tắc bất biến

Biến nông trại thành một làng quê Việt có nhịp sống: NPC xuất hiện và trò chuyện, nhiệm vụ nhẹ nhàng có tiến triển, cảnh vật đổi theo giờ, thời tiết và mùa. Giữ phong cách cozy, dễ hiểu, không ép người chơi online liên tục.

**Phải giữ nguyên:**
- Canvas 2D + vanilla JS ES modules; Node.js, Express, Socket.IO, SQLite/better-sqlite3. Không tự thay framework hoặc database.
- Một tài khoản sở hữu một nông trại; server là nguồn sự thật cho dữ liệu và phần thưởng.
- Cây trồng, VAC, crafting phát triển offline dựa trên UTC server; không tạo timer per entity.
- Không để cây/vật nuôi chết vì vắng mặt; không làm mất vật phẩm hoặc tiền khi nâng cấp.
- Giữ toàn bộ chức năng Phase 1–5; không triển khai social multiplayer/visiting thuộc Phase 7.
- Không dùng tiền thật, pay-to-win, giao dịch P2P.
- Tương thích dữ liệu người chơi hiện có và những client cũ trong khả năng hợp lý; API thay đổi phải có xử lý lỗi rõ ràng.

**Scope mặc định của Phase 6:** Chu kỳ ngày/đêm, thời tiết, mùa vụ là **visual + narrative**, không thay đổi tốc độ tăng trưởng cây trồng, sản lượng VAC, crafting, giá thị trường hoặc thời gian offline. Nếu muốn gameplay modifiers, để phase sau và phải được phê duyệt riêng. Điều này là quyết định thiết kế bắt buộc nhằm bảo toàn Phase 1–5.

---

## GATE 0 — Preflight bắt buộc

1. `git status`, `git log`, xác nhận code đang triển khai có chứa commit Phase 5 `86b1859`; nếu không, ghi rõ branch/HEAD thực tế, không tự giả định.
2. Đọc `README.md`, `GDD.md`, `PROJECT_MASTER_CONTEXT.md`, `IMPLEMENTATION_PROGRESS.md`, `HANDOFF.md`, `QA_CHECKLIST.md` nếu tồn tại; đọc toàn bộ code server/client liên quan đến world clock, farm state, UI, scene, auth, NPC, inventory, economy, quests và migrations.
3. Lập bản đồ file/API/schema **theo code thật**; tên module/bảng trong tài liệu chỉ là gợi ý, không được tạo bản sao hệ thống đã tồn tại.
4. Chạy toàn bộ test hiện tại, ghi số lượng pass/fail và nguyên nhân. Nếu baseline fail, phân loại lỗi sẵn có và blocker; không che giấu.
5. Backup SQLite trước migration, gồm cả trường hợp WAL: dùng SQLite backup API hoặc cơ chế backup nhất quán, **không copy file `.sqlite` đơn lẻ khi đang ghi**. Không xóa database runtime.
6. Tạo branch `feature/phase-6-living-village` nếu phù hợp workflow; không force push, không ghi đè thay đổi chưa commit.
7. Viết ngắn `PHASE6_REPORT.md` gồm baseline commit, sơ đồ tích hợp, rủi ro, quyết định thiết kế và kết quả test đầu vào.

**Điều kiện qua Gate 0:** hiểu kiến trúc thật, xác nhận baseline, có backup và có kết quả test đầu vào. Nếu gặp blocker không thể xử lý an toàn, dừng và báo rõ; không làm giả kết quả.

---

## 1. P6.1 — NPC làng Việt và lịch sinh hoạt

### Nội dung
- Tối thiểu **4 NPC có bản sắc**: Bác Tư (nông dân), Cô Lan (người bán hàng), Ông Ba (người lớn tuổi kể chuyện), Bé Na (hàng xóm). Tên và vai trò có thể điều chỉnh để tránh trùng NPC hiện hữu; ưu tiên tái sử dụng NPC có sẵn.
- NPC có tên hiển thị, hình dạng/sprite Canvas phù hợp, vị trí hợp lệ, tương tác bằng phím/nút hiện có, lời thoại tiếng Việt có dấu.
- Mỗi NPC có ít nhất 3 nhánh hội thoại theo ngữ cảnh: giới thiệu, khi có nhiệm vụ, sau khi hoàn thành. Không cần AI sinh hội thoại runtime.
- Lịch hoạt động **deterministic** theo thời gian thế giới: tối thiểu 3 trạng thái (sáng, chiều, tối), ví dụ đứng gần ruộng, đi chợ, về nhà. Không cần pathfinding phức tạp; dùng waypoint an toàn và animation di chuyển đơn giản.
- NPC không chặn lối bắt buộc, không xuất hiện trên ô đất trồng, ao, chuồng, công trình, vật trang trí hoặc vùng collision. Nếu vị trí dự kiến không hợp lệ, có fallback an toàn.
- Không sinh vòng lặp cập nhật NPC nặng trên server; không phát tán trạng thái liên tục nếu không cần.

### Nghiệm thu
- Có thể tìm và tương tác cả 4 NPC; hội thoại đổi theo tiến trình nhiệm vụ.
- Reload, đổi scene, reconnect không nhân đôi NPC hoặc làm mất trạng thái.
- Không giảm FPS đáng kể khi NPC cùng xuất hiện; kiểm tra camera, layer, hitbox và z-index.

---

## 2. P6.2 — Nhiệm vụ và cốt truyện nhẹ nhàng

### Nội dung
- Một tuyến truyện ngắn **“Một ngày ở làng”** gồm tối thiểu **5 nhiệm vụ tuần tự**, kể câu chuyện người chơi làm quen xóm làng, giúp hàng xóm, khám phá hoạt động nông trại.
- Gợi ý: (1) gặp Bác Tư; (2) thu hoạch một loại nông sản hợp lệ; (3) giao nông sản cho Cô Lan; (4) trò chuyện Ông Ba; (5) hoàn thành một việc giúp làng (có thể dùng crafting/VAC nếu người chơi đã mở khóa; luôn có đường thay thế cho người chưa mở khóa).
- Ít nhất **2 nhiệm vụ phụ lặp lại có giới hạn hợp lý** (ví dụ mỗi ngày theo UTC hoặc ngày thế giới, chọn một quy tắc duy nhất và hiển thị rõ), không yêu cầu người chơi đăng nhập liên tục.
- Quest definitions dùng data-driven config; trạng thái `locked/available/active/completed/claimed` hoặc mapping tương đương rõ ràng. Server xác thực mọi chuyển trạng thái.
- **Không tin client gửi “đã hoàn thành”.** Progress được cập nhật từ sự kiện gameplay đã xác thực server: harvest, crafting completion, NPC interaction, VAC, order, v.v. Chỉ tích hợp event thực sự có trong code.
- Không tiêu hao vật phẩm khi chỉ kiểm tra tiến trình; nếu nhiệm vụ yêu cầu giao hàng, dùng transaction để trừ đúng số lượng.
- Reward vừa phải (Đồng Làng/vật phẩm hợp lệ), không phá cân bằng kinh tế; mọi claim phải atomic, idempotent, có lịch sử hoặc audit trail, không nhận thưởng hai lần khi double-click/retry/reconnect.
- UI sổ nhiệm vụ: tiêu đề, mô tả, mục tiêu, tiến độ, trạng thái, nút nhận thưởng nếu cần; hỗ trợ keyboard và viewport mobile.
- Đảm bảo người chơi cũ được khởi tạo quest state đúng, không reset inventory, wallet, farm.

### Nghiệm thu
- 5 nhiệm vụ chính có thể hoàn thành theo luồng thực tế; 2 nhiệm vụ phụ có reset đúng quy tắc.
- Thử gọi API claim lặp, song song, request ID trùng, request sai chủ sở hữu: không nhận thưởng trùng.
- Quest không bị kẹt vì vật phẩm/scene/tính năng chưa mở khóa.

---

## 3. P6.3 — Chu kỳ ngày/đêm

### Quy tắc
- Chu kỳ ngày/đêm là **thời gian thế giới mô phỏng**, tách biệt thời gian UTC thực dùng để tính offline growth và kinh tế.
- Mặc định **1 ngày trong game = 24 phút thực**, có thể cấu hình server qua environment variable. Các mốc: sáng 05:00–10:59, trưa 11:00–16:59, chiều 17:00–18:59, tối/đêm 19:00–04:59 (giờ thế giới).
- Server trả về `worldTime`/`cycleEpoch` hoặc dữ liệu tương đương đủ để client suy ra thời gian. Client render mượt bằng interpolation, đồng bộ lại khi reconnect, không tự quyết định phần thưởng theo đồng hồ local.
- Overlay Canvas: ánh sáng ấm buổi sáng, ban ngày rõ, hoàng hôn vàng cam, ban đêm xanh tím nhẹ; **không làm UI/text khó đọc**.
- Có đồng hồ nhỏ trong HUD và trạng thái buổi. Hiệu ứng chuyển cảnh mượt, không nhấp nháy khi qua mốc.
- NPC schedule dùng cùng world clock; không tạo một hệ giờ khác.
- Tùy chọn giảm hiệu ứng (reduced motion / quality) để chạy máy yếu; không phụ thuộc WebGL.

### Nghiệm thu
- Thời gian liên tục sau reload/reconnect; hai client thấy cùng pha gần đúng trong giới hạn độ trễ mạng.
- Không ảnh hưởng timestamp cây, cá, gà, crafting, market reset.
- FPS ổn định và chữ/hitbox tương tác dễ nhìn vào ban đêm.

---

## 4. P6.4 — Thời tiết

### Quy tắc
- Ba trạng thái tối thiểu: `sunny`, `cloudy`, `rainy`.
- Weather được server xác định **deterministic** theo một seed và slot thời gian thế giới/UTC có tài liệu hóa; client chỉ nhận và render. Không random độc lập trên mỗi client.
- Một trạng thái kéo dài đủ lâu để cảm nhận, mặc định 8 phút thực; không đổi mỗi frame hoặc mỗi request. Cấu hình được.
- Hiệu ứng Canvas: nắng dịu, mây bóng nhẹ, mưa hạt nghiêng và vệt nước nhỏ. Hiệu ứng chỉ ở viewport, giới hạn particle count, không cấp phát vô hạn.
- HUD biểu tượng + tên thời tiết; chuyển thời tiết mềm, không flash mạnh.
- Có chế độ giảm hiệu ứng; tự giảm chất lượng ở mobile/thiết bị yếu nếu cần.
- **Không tự động tưới cây khi trời mưa trong Phase 6**, không thay đổi tăng trưởng hoặc lượng thức ăn; nếu cần, hiển thị lời giải thích để tránh hiểu nhầm.

### Nghiệm thu
- Hai người dùng cùng thời điểm nhận cùng weather state; reload không thay đổi ngẫu nhiên.
- Không memory leak, không tụt FPS lớn, không cản input/click, không vẽ mưa lên dialog theo cách khó đọc.

---

## 5. P6.5 — Mùa vụ và cảnh quan

### Quy tắc
- Bốn mùa `spring`, `summer`, `autumn`, `winter` dùng **mùa mô phỏng**, không suy từ thời tiết thực hoặc vị trí địa lý của người chơi.
- Mặc định **1 mùa = 7 ngày thực**, xác định bằng epoch server và có cấu hình; lịch mùa độc lập với chu kỳ ngày/đêm 24 phút. Cần ghi rõ quy tắc trong UI/help.
- Tạo palette nhẹ và chi tiết môi trường phù hợp Việt Nam: xuân xanh non, hạ xanh rực, thu vàng dịu, đông se lạnh; tránh phủ tuyết dày phi thực tế lên toàn bộ làng.
- Hiển thị mùa hiện tại trong HUD và mô tả ngắn; NPC có ít nhất một lời thoại biến thể theo mùa.
- Giữ nguyên collision, tile ownership, crop states, building placement, farm expansion; thay đổi visual layer/decorative palette chứ không sửa logic bản đồ.
- Không khóa cây trồng theo mùa, không giảm năng suất, không làm vật nuôi bị bệnh trong Phase 6.

### Nghiệm thu
- Mùa xác định nhất quán qua reload và client; cảnh quan khác biệt vừa đủ, không che đối tượng tương tác.
- Không thay đổi kết quả gameplay khi thời gian chuyển mùa.

---

## 6. Tích hợp xuyên Phase 1–5

1. **Farming:** Hook sự kiện thu hoạch thật vào quest; tuyệt đối không thay logic gieo, tưới, harvest, offline growth.
2. **Economy:** Reward/chi phí quest dùng transaction và receipt/idempotency hiện có; không bypass wallet constraints.
3. **VAC:** Có thể dùng sự kiện đã xác thực cho quest, nhưng nhiệm vụ chính phải có đường đi khi VAC chưa mở khóa.
4. **Crafting & buildings:** Chỉ dùng công thức/công trình tồn tại; không thêm item ID không được định nghĩa; không tạo crafting jobs mới không cần thiết.
5. **Inventory:** Quest delivery trừ item atomic; inventory capacity/stacking theo logic hiện hữu.
6. **UI:** Tương thích Canvas scaling, camera, hitboxes, modal manager, keyboard controls, mobile viewport.
7. **Security:** Auth, CSRF (nếu áp dụng), rate limit, ownership, validation, idempotency cho mọi endpoint mới.
8. **Networking:** Chỉ broadcast world state nếu game hiện có nhu cầu và cơ chế tương ứng; không mở social visits của Phase 7.

---

## 7. Database & migration v6

- Kiểm tra `schema_migrations` và migration conventions hiện có; thêm **migration v6 idempotent** theo quy ước dự án.
- Dữ liệu dự kiến: `player_quests` (user_id, quest_id, status, progress_json hoặc bảng progress chuẩn hóa, claimed_at, updated_at), `quest_claim_receipts` (idempotency key, owner, result, timestamps) nếu cơ chế receipts hiện tại không dùng chung an toàn.
- Chỉ thêm bảng `world_state` / `world_config` nếu thật sự cần persistence; ưu tiên world clock/weather/season deterministic từ config và epoch, tránh ghi DB mỗi frame.
- Thêm indexes/unique constraints bảo đảm một quest state cho một user + quest và receipt uniqueness theo owner + operation + key.
- Mọi migration phải chạy trong transaction nếu SQLite hỗ trợ cho các câu lệnh tương ứng, không `DROP`/reset dữ liệu cũ, không sửa trực tiếp file DB seed không cần thiết.
- Dùng UTC milliseconds/seconds **nhất quán với code thật**, ghi rõ đơn vị, không tự pha trộn.
- Kiểm thử upgrade trên bản sao DB v5 có dữ liệu thực tế; `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, kiểm tra số dư, inventory, crops, VAC, crafting jobs, buildings và expansions trước/sau.
- Test migration chạy lại không gây lỗi hoặc nhân đôi dữ liệu; không coi seed DB là production DB.

---

## 8. API / Socket contract

Agent phải tự dò API patterns và chỉ bổ sung endpoint/events cần thiết, ví dụ (tên chỉ minh họa):

- `GET /api/world/context` → `serverNow`, `worldTime`, `timeOfDay`, `weather`, `season`, `nextTransitionAt` (nếu có).
- `GET /api/npcs` → NPC definitions + contextual dialogue options đã được lọc phù hợp.
- `POST /api/npcs/:id/interact` → server kiểm tra scene, khoảng cách nếu có position authority, auth, rate limit; trả hội thoại/quest trigger hợp lệ.
- `GET /api/quests` → quest states theo user.
- `POST /api/quests/:id/claim` → idempotent claim với `requestId`.

Không dùng endpoint client có thể tự gửi số tiền, tiến độ hoặc phần thưởng tùy ý. Không dùng Socket.IO event như đường vòng bỏ qua xác thực HTTP. Validation phải kiểm tra schema và dữ liệu thực tế.

---

## 9. Trải nghiệm người chơi và mỹ thuật

- UI hoàn toàn tiếng Việt, thống nhất thuật ngữ với game.
- Có lời giới thiệu ngắn lần đầu gặp NPC, hướng dẫn nhiệm vụ và cách xem giờ/thời tiết/mùa.
- Không spam modal, notification hoặc hiệu ứng liên tục; nhiệm vụ có trạng thái rõ ràng.
- Tôn trọng tính dễ tiếp cận: font dễ đọc, tương phản đủ, reduced motion, hỗ trợ điều khiển hiện có, nút đủ lớn trên màn nhỏ.
- Ưu tiên asset/Canvas primitives đã có; nếu thiếu artwork, dùng placeholder **có chủ đích và đồng nhất**, ghi rõ giới hạn; không tự tải asset có vấn đề bản quyền.
- Không tự đổi toàn bộ phong cách đồ họa hoặc viết lại renderer.

---

## 10. Thứ tự thực thi nội bộ — làm trong MỘT lượt

AI phải tự thực hiện lần lượt, không yêu cầu người dùng gửi prompt tiếp theo:

1. **Gate 0:** audit repo, test baseline, backup DB, ghi precheck.
2. **Foundation:** world clock/config + API, tests.
3. **Day/Night:** Canvas overlay + HUD + tests.
4. **Weather:** deterministic state + effects + tests.
5. **Seasons:** palette + HUD + tests.
6. **NPC:** definitions, placement, dialogue, schedules + tests.
7. **Quest:** migration v6, server events, rewards, UI + tests.
8. **Integration:** kiểm tra farming, economy, VAC, crafting, collision, reload, reconnect.
9. **QA:** full automated suite, migration copy test, browser QA, mobile viewport, performance checks.
10. **Handoff:** cập nhật docs, ghi limitations, commit; push chỉ khi workflow/ủy quyền cho phép.

Nếu một bước thất bại, sửa và chạy lại test liên quan trước khi sang bước sau. Không bỏ qua lỗi để đạt số lượng tính năng.

---

## 11. Test matrix bắt buộc

### Automated tests
- World clock: đúng boundary 05:00/11:00/17:00/19:00, rollover 24h, config invalid, deterministic sau restart.
- Weather: cùng seed + slot → cùng state; boundary transition; không phụ thuộc client clock.
- Seasons: epoch + 7 ngày/mùa → đúng mùa, rollover; config validation.
- NPC: hội thoại theo context, scene/position validation, không nhân đôi, fallback waypoint.
- Quests: lock/unlock/progress/complete/claim; chỉ server event được tính; không vượt quá mục tiêu.
- Security: unauthenticated, wrong owner, malformed payload, negative/overflow, repeated requests, parallel claims, stale state.
- DB: fresh v6 install, upgrade v5→v6, migration rerun, integrity/foreign keys, dữ liệu cũ không đổi.
- Regression: tất cả test Phase 1–5 phải pass.

### Browser QA — chạy thực tế, không chỉ đọc code
1. Tạo user mới, vào nông trại, thấy HUD giờ/thời tiết/mùa.
2. Mở nhiều tab hoặc 2 browser clients: world state nhất quán.
3. Chuyển sáng→trưa→chiều→đêm bằng test clock/config an toàn, xác minh overlay mượt.
4. Thử cả nắng, mây, mưa; FPS, click, UI, reduced motion.
5. Thử cả 4 mùa; palette và NPC thoại đúng.
6. Gặp 4 NPC, tương tác và xem hội thoại theo trạng thái.
7. Hoàn thành 5 nhiệm vụ chính theo đường đi thực tế.
8. Hoàn thành và reset 2 nhiệm vụ phụ đúng quy tắc.
9. Double-click claim, gửi lại request ID, hai request đồng thời: không nhân đôi reward.
10. Reload, logout/login, reconnect giữa nhiệm vụ: tiến độ không mất.
11. Test user cũ trên DB migrated: farm, wallet, inventory, VAC, crafting, buildings còn nguyên.
12. Test các thao tác cũ: gieo/tưới/thu hoạch, shop/orders, VAC, crafting, building/decoration/expansion.
13. Test viewport desktop + mobile và input hiện có; không che HUD hoặc dialog.
14. Kiểm tra browser console/server logs không có exception, request loop hoặc memory leak rõ ràng.

Nếu môi trường không có browser automation, phải ghi **NOT VERIFIED** cho browser QA và không tuyên bố COMPLETE; không thay thế bằng ảnh giả hoặc báo cáo suy đoán.

---

## 12. Definition of Done (DoD) — điều kiện duy nhất để báo COMPLETE

- [ ] Gate 0 có baseline, backup và test report.
- [ ] 4 NPC hoạt động, có lịch sinh hoạt và hội thoại ngữ cảnh.
- [ ] 5 main quests + 2 side quests chạy end-to-end.
- [ ] Reward atomic/idempotent, chống duplicate và sai chủ sở hữu.
- [ ] Ngày/đêm 24 phút/ngày, có HUD và overlay mượt.
- [ ] Thời tiết nắng/mây/mưa deterministic, có quality/reduced motion.
- [ ] 4 mùa mô phỏng, 7 ngày thực/mùa, có palette và HUD.
- [ ] Không thay đổi cơ chế offline farming/VAC/crafting hoặc kinh tế do thời tiết/mùa.
- [ ] Migration v6 thành công trên DB v5 có dữ liệu và không mất dữ liệu.
- [ ] Tất cả regression tests Phase 1–5 pass; tests Phase 6 pass.
- [ ] Browser QA thực tế hoàn tất, có bằng chứng và không còn blocker.
- [ ] Docs cập nhật, có commit SHA và báo cáo bàn giao.

Nếu thiếu mục nào, trạng thái phải là **PARTIAL / BLOCKED**, kèm lý do và bước còn lại. Không viết “100% complete” khi chưa chạy browser QA.

---

## 13. Tài liệu bàn giao bắt buộc

Cập nhật (nếu tồn tại) `README.md`, `GDD.md`, `PROJECT_MASTER_CONTEXT.md`, `IMPLEMENTATION_PROGRESS.md`, `HANDOFF.md`, `QA_CHECKLIST.md` và bổ sung:

- `PHASE6_REPORT.md`: source baseline, kiến trúc, rủi ro, baseline test.
- `PHASE6_REPORT.md`: lệnh test, số pass/fail, migration test, browser QA steps/results, screenshots/logs nếu có, môi trường test.
- `PHASE6_REPORT.md`: file thay đổi, API/schema, config, cách chạy, giới hạn, rollback, commit SHA.

Báo cáo cuối cùng cần có:
1. Commit/branch thực tế.
2. Bảng tính năng PASS/FAIL/NOT VERIFIED.
3. Migration v6 và đường backup/rollback.
4. Test commands + kết quả thực sự quan sát được.
5. Những gì chưa hoàn thiện và mức độ nghiêm trọng.
6. Kết luận `GO / GO WITH FIXES / NO-GO` cho Phase 7, không tự đánh đồng “code đã viết” với “production ready”.

---

## 14. Những điều KHÔNG được tự ý làm

- Không reset SQLite, xóa user/farm hoặc thay đổi số dư để test trên dữ liệu thật.
- Không chuyển sang PostgreSQL, React, Phaser, Unity hoặc kiến trúc mới.
- Không triển khai Phase 7 social multiplayer/visits.
- Không thêm gameplay penalty do trời mưa/mùa đông; không làm chết cây/vật nuôi offline.
- Không dùng client time để quyết định quest reward, world authority hoặc farming timestamps.
- Không tin client về quest completion hoặc số lượng reward.
- Không tự tạo báo cáo test pass khi chưa chạy test.
- Không force push hoặc commit secrets, DB runtime, `.env`.

**Kết thúc tài liệu.**

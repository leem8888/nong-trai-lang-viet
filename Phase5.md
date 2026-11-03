# MASTER PROMPT — NÔNG TRẠI LÀNG VIỆT
# PHASE 5: CRAFTING, BUILDING, DECORATION & FARM EXPANSION

## 0. VAI TRÒ

Bạn là Senior Game Developer, Backend Architect, Database Engineer, Gameplay Designer, UI/UX Designer và QA Engineer.

Repository:
https://github.com/leem8888/nong-trai-lang-viet

Nhiệm vụ: Tiếp tục phát triển Nông Trại Làng Việt từ source code mới nhất đã có Phase 4.

Công nghệ bắt buộc:
- Canvas 2D.
- Vanilla JavaScript ES Modules.
- Node.js.
- Express.
- Socket.IO.
- SQLite / better-sqlite3.

KHÔNG tạo project mới.
KHÔNG thay engine.
KHÔNG chuyển sang React, Phaser hoặc framework khác.
KHÔNG xóa database.
KHÔNG làm hỏng Phase 1–4.
KHÔNG triển khai Phase 6.

Mục tiêu: Cho phép người chơi chế biến nông sản, xây dựng công trình, trang trí và mở rộng nông trại.

---

# 1. GATE 0 — REVIEW PHASE 4

Trước khi viết code:

Đọc:
- PROJECT_MASTER_CONTEXT.md
- GDD.md
- README.md
- HANDOFF.md
- IMPLEMENTATION_PROGRESS.md
- QA_CHECKLIST.md
- package.json
- Source code hiện tại.
- Database migrations.
- Automated tests.
- Browser QA scripts.

Kiểm tra branch, HEAD commit và working tree.

Không tự động reset hoặc checkout làm mất thay đổi chưa commit.

Xác minh các hệ thống Phase 1–4:
1. Authentication và farm ownership.
2. Canvas renderer, tilemap và collision.
3. Crop system và offline growth.
4. Inventory.
5. Wallet và economy.
6. NPC market.
7. Fish pond.
8. Chicken coop.
9. Feed conversion.
10. Offline VAC production.
11. Database migrations.
12. Transaction idempotency.

Chạy:
- npm ci nếu môi trường cho phép.
- npm test.
- Browser QA theo script hiện có.
- Các script kiểm tra migration và economy.

Không giả định Phase 4 đã complete chỉ vì code được push.

Nếu Phase 4 có blocker nghiêm trọng, phải báo cáo và sửa trước khi tiếp tục.

Không được tuyên bố nghiệm thu thành công nếu chưa có bằng chứng.

---

# 2. PHẠM VI PHASE 5

Triển khai:

P5.1 — Crafting Registry & Recipes.

P5.2 — Processing Buildings.

P5.3 — Building Placement System.

P5.4 — Decoration System.

P5.5 — Farm Expansion.

P5.6 — Economy & Inventory Integration.

P5.7 — Canvas UI & Visual Effects.

P5.8 — Security, Tests & Handoff.

Ưu tiên gameplay hoàn chỉnh thay vì thêm nhiều vật phẩm nhưng không sử dụng được.

---

# 3. CRAFTING SYSTEM

## 3.1. Mục tiêu

Người chơi sử dụng nông sản từ Phase 2 và sản phẩm VAC từ Phase 4 để tạo ra sản phẩm có giá trị cao hơn.

Ví dụ:

Lúa → Gạo.

Ngô → Bột ngô.

Đậu nành → Sữa đậu nành.

Cà chua → Sốt cà chua.

Cá → Cá khô.

Gạo + Trứng → Cơm chiên trứng.

## 3.2. Recipe Registry

Tạo registry dữ liệu công thức với:
- Recipe ID.
- Display name.
- Required ingredients.
- Required quantities.
- Output item ID.
- Output quantity.
- Processing duration.
- Required building type.
- Unlock requirement.
- Recipe version.
- Visual metadata.

Không hardcode recipe trong UI.

Không sử dụng client để quyết định nguyên liệu hoặc sản lượng.

## 3.3. Sáu công thức MVP

Triển khai ít nhất:

1. Xay lúa thành gạo.
2. Xay ngô thành bột ngô.
3. Làm sữa đậu nành.
4. Làm sốt cà chua.
5. Phơi cá khô.
6. Nấu cơm chiên trứng.

Tỷ lệ nguyên liệu, sản lượng và thời gian phải cấu hình được.

Các công thức phải có đầu vào thực sự tồn tại trong inventory Phase 1–4.

Nếu tên item trong source khác ví dụ, sử dụng ID hiện có và ghi mapping rõ ràng.

## 3.4. Crafting Workflow

Người chơi:
1. Đến công trình chế biến.
2. Mở crafting panel.
3. Chọn công thức.
4. Xem nguyên liệu.
5. Chọn số lượng.
6. Xác nhận.
7. Nguyên liệu được trừ.
8. Job chế biến bắt đầu.
9. Chờ hoàn thành.
10. Nhận thành phẩm vào inventory.

Mọi thao tác phải được server xác thực.

Không được trừ nguyên liệu hai lần.

Không được nhận thành phẩm hai lần.

Nếu inventory đầy khi nhận thành phẩm, giữ job ở trạng thái có thể nhận, không làm mất sản phẩm.

---

# 4. OFFLINE CRAFTING

Chế biến tiếp tục khi người chơi offline.

Không dùng setInterval riêng cho mỗi job.

Khi tạo job:
- Lưu startedAt UTC.
- Lưu duration snapshot.
- Lưu recipe snapshot/version.
- Lưu quantity.
- Lưu building instance ID.
- Lưu trạng thái.

Khi đọc job:
- Server tính thời gian đã trôi qua.
- Xác định đã hoàn thành hay chưa.
- Client chỉ hiển thị tiến trình dự đoán.

Các trạng thái:
- PROCESSING.
- READY.
- CLAIMED.
- CANCELLED nếu hỗ trợ.

Không cho claim khi chưa hoàn thành.

Không cho claim nhiều lần.

Không dùng đồng hồ client để quyết định kết quả.

Khi thay đổi recipe config, job đang chạy không được thay đổi thời lượng một cách bất ngờ.

---

# 5. PROCESSING BUILDINGS

Triển khai ba công trình chức năng.

## 5.1. Cối xay lúa

Phong cách cối xay gỗ truyền thống Việt Nam.

Chức năng:
- Xay lúa thành gạo.
- Xay ngô thành bột ngô.

Có animation quay cối khi đang hoạt động.

## 5.2. Bếp quê

Bếp nông thôn với mái ngói, bếp củi và bàn chế biến.

Chức năng:
- Làm sữa đậu nành.
- Làm sốt cà chua.
- Nấu cơm chiên trứng.

Có hiệu ứng khói nhẹ khi chế biến.

## 5.3. Giàn phơi

Giàn phơi bằng tre hoặc gỗ.

Chức năng:
- Phơi cá khô.

Có animation đơn giản.

Không cần mô phỏng thời tiết tác động đến giàn phơi ở Phase 5.

## 5.4. Processing Capacity

Mỗi công trình có số slot chế biến giới hạn.

Đề xuất ban đầu:
- Cối xay: 1 job.
- Bếp quê: 2 jobs.
- Giàn phơi: 1 job.

Không cho bắt đầu job vượt sức chứa.

Không cho một job thuộc đồng thời hai công trình.

Không cho xóa hoặc cất công trình khi còn job đang chạy hoặc thành phẩm chưa nhận, trừ khi có cơ chế di chuyển/bảo toàn job được thiết kế và kiểm thử đầy đủ.

---

# 6. BUILDING PLACEMENT SYSTEM

## 6.1. Mục tiêu

Người chơi có thể:
- Chọn công trình.
- Xem preview.
- Xoay công trình.
- Đặt vào vị trí hợp lệ.
- Di chuyển công trình.
- Cất công trình nếu được phép.

Hỗ trợ:
- Chuột.
- Bàn phím.
- Cơ chế input hiện có.

## 6.2. Placement Preview

Hiển thị:
- Bóng mờ công trình.
- Các tile bị chiếm.
- Màu hợp lệ/không hợp lệ.
- Hướng xoay.
- Chi phí xây dựng.

Không trừ tiền hoặc nguyên liệu khi chỉ preview.

## 6.3. Placement Validation

Server phải kiểm tra:
1. Authentication.
2. Farm ownership.
3. Building definition.
4. Unlock state.
5. Inventory/materials.
6. Wallet.
7. Coordinates.
8. Rotation.
9. Footprint.
10. Collision.
11. Farm bounds.
12. Scene.
13. Request idempotency.

Không cho đặt:
- Trên nhà chính.
- Trên ao cá.
- Trên chuồng gà.
- Trên cây đang trồng.
- Trên vật thể khác.
- Ngoài đất đã mở khóa.
- Chặn hoàn toàn đường đi thiết yếu.
- Chặn cổng farm hoặc lối vào chợ.

Phải kiểm tra tính hợp lệ trên server, không chỉ bằng màu preview của client.

## 6.4. Building Ownership

Mỗi building instance cần:
- ID.
- Farm ID.
- Definition ID.
- Tile position.
- Rotation.
- Footprint.
- State.
- CreatedAt.
- UpdatedAt.

Không cho di chuyển hoặc cất công trình thuộc farm người khác.

## 6.5. Atomic Placement

Nếu đặt công trình có chi phí:
- Kiểm tra nguyên liệu.
- Kiểm tra tiền.
- Kiểm tra tile.
- Trừ chi phí.
- Tạo building.
- Commit cùng transaction.

Nếu lỗi, rollback toàn bộ.

---

# 7. DECORATION SYSTEM

## 7.1. Mục tiêu

Cho phép người chơi tự trang trí farm theo phong cách làng quê Việt Nam.

Triển khai 12–15 vật trang trí.

Đề xuất:

1. Hàng rào tre.
2. Cổng tre.
3. Đường gạch đỏ.
4. Đường đá.
5. Lu nước.
6. Chậu sen.
7. Khóm hoa cúc.
8. Khóm hoa mười giờ.
9. Ghế gỗ.
10. Đèn lồng.
11. Bụi chuối cảnh.
12. Cây cau.
13. Giàn hoa giấy.
14. Biển tên nông trại.
15. Đống rơm.

## 7.2. Decoration Registry

Mỗi loại có:
- Decoration ID.
- Display name.
- Sprite definition.
- Footprint.
- Placement rules.
- Collision rules.
- Rotation support.
- Purchase cost.
- Stack/ownership behavior.

Không hardcode từng vật trong game loop.

## 7.3. Placement

Cho phép:
- Chọn vật trang trí.
- Xem preview.
- Đặt.
- Xoay nếu hỗ trợ.
- Di chuyển.
- Cất lại vào inventory.

Không làm mất vật phẩm khi thao tác thất bại.

Không nhân đôi vật phẩm khi cất hoặc đặt liên tục.

Các vật trang trí không cản đường có thể dùng placement rule riêng.

Ví dụ đường gạch được phép đặt dưới chân nhân vật nhưng không được thay thế dữ liệu crop hoặc building một cách phá hoại.

## 7.4. Save State

Vị trí và hướng vật thể phải được lưu SQLite.

Reload hoặc restart không làm mất bố cục.

Khi hai tab cùng sửa một vật, server phải xử lý nhất quán.

---

# 8. FARM EXPANSION

## 8.1. Mục tiêu

Cho phép người chơi mở rộng khu vực sử dụng của nông trại.

Đề xuất hai cấp mở rộng:
- Expansion Level 1.
- Expansion Level 2.

Sử dụng Đồng Làng để mở khóa.

Chi phí phải cấu hình được.

Không dùng tiền thật.

## 8.2. Map Strategy

Kiểm tra tilemap hiện có.

Ưu tiên thiết kế một bản đồ có ranh giới mở khóa thay vì thay đổi kích thước toàn bộ engine tùy tiện.

Các khu vực chưa mở khóa:
- Hiển thị nhưng không được xây dựng.
- Có dấu hiệu ranh giới rõ ràng.
- Không thể tương tác với tile bị khóa.

Khi mở khóa:
- Trừ tiền.
- Lưu expansion level.
- Mở quyền sử dụng tile.
- Cập nhật collision/bounds nếu cần.

Không reset map.

Không xóa công trình.

Không xóa cây.

Không thay đổi vị trí ao/chuồng đã có.

## 8.3. Expansion Safety

Không cho:
- Mở khóa cấp 2 trước cấp 1.
- Mua lại cấp đã mở.
- Trừ tiền hai lần.
- Mở rộng farm người khác.
- Mở khóa miễn phí bằng payload giả.

Mọi giao dịch phải atomic và idempotent.

---

# 9. INVENTORY INTEGRATION

Tái sử dụng InventoryService hiện tại.

Không tạo inventory thứ hai.

Bổ sung:
- Gạo.
- Bột ngô.
- Sữa đậu nành.
- Sốt cà chua.
- Cá khô.
- Cơm chiên trứng.
- Building materials nếu cần.
- Decoration items.

Item ID phải ổn định và không trùng.

Không làm hỏng item Phase 1–4.

Cần định nghĩa rõ vật thể nào nằm trong inventory và vật thể nào đã được đặt trong farm.

Không cho cùng một vật phẩm vừa ở inventory vừa được đặt trên bản đồ.

---

# 10. ECONOMY INTEGRATION

Tái sử dụng Wallet và EconomyService Phase 3.

Không tạo tiền tệ thứ hai.

Mở rộng NPC market:
- Bán sản phẩm chế biến.
- Mua vật trang trí.
- Mua nguyên liệu xây dựng nếu cần.
- Mua bản thiết kế hoặc công trình nếu phù hợp.

Giá phải được tính server-side.

Không tin giá client.

Các sản phẩm chế biến phải có giá trị kinh tế hợp lý.

Tạo báo cáo cân bằng:
- Giá nguyên liệu.
- Chi phí chế biến.
- Thời gian chế biến.
- Giá thành phẩm.
- Lợi nhuận.
- Lợi nhuận theo giờ.
- So sánh với bán nguyên liệu trực tiếp.

Không cho crafting tạo vòng nhân tiền tức thì, không giới hạn.

Không để mọi công thức đều lỗ khiến người chơi không muốn chế biến.

Không làm cho farming hoặc VAC trở nên vô giá trị.

---

# 11. DATABASE MIGRATION V5

Kiểm tra migration hiện có.

Không sửa hoặc xóa migration cũ.

Thiết kế migration V5 với các bảng phù hợp, ví dụ:
- farm_buildings.
- crafting_jobs.
- farm_decorations.
- farm_expansions.
- building_unlocks nếu cần.

Có thể sử dụng farm_objects hiện có nếu phù hợp, nhưng phải giải thích quyết định thiết kế.

Không tạo hai nguồn dữ liệu mâu thuẫn cho cùng một vật thể.

Yêu cầu:
- Foreign keys.
- Unique constraints.
- Indexes.
- Referential integrity.
- Transactions.
- Schema versioning.
- Migration idempotency.
- Kiểm tra farm ownership.

Phải hỗ trợ database đã có dữ liệu Phase 1–4.

Không reset:
- User.
- Farm.
- Crops.
- Inventory.
- Wallet.
- NPC orders.
- Fish.
- Chickens.
- Feed.
- VAC production.

Kiểm tra starter.sqlite và farm.sqlite theo quy trình thực tế.

Không commit database chứa dữ liệu người dùng thật.

Trước migration phải backup và kiểm thử trên bản sao database.

---

# 12. SERVER-AUTHORITATIVE ACTIONS

Đề xuất các action:

Crafting:
- crafting:list_recipes.
- crafting:start.
- crafting:get_jobs.
- crafting:claim.

Building:
- building:list_catalog.
- building:place.
- building:move.
- building:store.
- building:get_state.

Decoration:
- decoration:list_catalog.
- decoration:place.
- decoration:move.
- decoration:store.

Expansion:
- expansion:get_state.
- expansion:unlock.

Tên event/API có thể điều chỉnh theo convention hiện tại.

Mỗi action phải kiểm tra:
- Authentication.
- Farm ownership.
- Scene.
- Interaction range nếu áp dụng.
- Payload validation.
- Item ownership.
- Resource availability.
- Placement rules.
- Rate limits.
- Idempotency.

Client chỉ gửi ý định.

Server quyết định kết quả.

Không cho client tự tạo công trình, thành phẩm hoặc mở rộng đất.

---

# 13. CANVAS RENDERING

Tái sử dụng engine hiện có.

## BuildingRenderer
- Công trình có nhiều kích thước.
- Vị trí theo tile.
- Z-order phù hợp.
- Hiển thị đúng rotation.
- Animation chế biến.
- Preview đặt công trình.

## DecorationRenderer
- Hàng rào.
- Đường đi.
- Cây cảnh.
- Đèn lồng.
- Vật trang trí.

## PlacementRenderer
- Tile highlight.
- Ghost preview.
- Valid/invalid footprint.
- Rotation preview.
- Confirmation feedback.

Không redraw dữ liệu không cần thiết bằng logic nặng.

Không query server mỗi frame.

Không đăng ký trùng event listeners.

Không làm hỏng camera, movement hoặc collision Phase 1.

---

# 14. USER INTERFACE

Tất cả giao diện bằng tiếng Việt.

## Crafting Panel
- Danh sách công thức.
- Nguyên liệu.
- Số lượng hiện có.
- Thành phẩm.
- Thời gian.
- Nút bắt đầu.
- Hàng đợi.
- Tiến trình.
- Nút nhận sản phẩm.

## Build Mode
- Danh sách công trình.
- Giá.
- Vị trí preview.
- Xoay.
- Đặt.
- Hủy.
- Di chuyển.
- Cất.

## Decoration Mode
- Danh sách trang trí.
- Số lượng.
- Preview.
- Đặt.
- Di chuyển.
- Cất.

## Expansion Panel
- Khu vực mở khóa.
- Chi phí.
- Số dư.
- Nút xác nhận.

## HUD
- Trạng thái crafting.
- Thông báo thành phẩm sẵn sàng.
- Số dư Đồng Làng.
- Inventory.
- Phím tắt build mode.

Không hiển thị thành công trước khi server xác nhận.

Không để build mode xung đột với thao tác cuốc đất, gieo hạt hoặc tương tác NPC.

---

# 15. SECURITY & ANTI-DUPLICATION

Bắt buộc kiểm tra:

- Không đặt công trình ở farm khác.
- Không đặt chồng vật thể.
- Không xây ngoài vùng mở khóa.
- Không giả mạo building ID.
- Không claim crafting job hai lần.
- Không cất một vật hai lần.
- Không nhân đôi decoration khi move/store.
- Không trừ tiền mà không tạo công trình.
- Không tạo công trình mà không trừ tiền.
- Không mất nguyên liệu khi crafting lỗi.
- Không nhận sản phẩm khi chưa hoàn thành.
- Không dùng client clock để hoàn thành crafting.
- Không mở rộng đất miễn phí.
- Không gửi payload âm hoặc số lượng quá lớn.

Các thao tác phải an toàn khi:
- Double click.
- Retry.
- Reconnect.
- Hai tab.
- Request đồng thời.
- Server restart.

Sử dụng transaction và idempotency của kiến trúc hiện tại.

Nếu reuse receipt system Phase 3, phải bảo đảm scope và payload hash phù hợp.

---

# 16. AUTOMATED TESTS

Giữ toàn bộ tests Phase 1–4.

Bổ sung tests Phase 5.

## Crafting
- Công thức hợp lệ.
- Không đủ nguyên liệu.
- Bắt đầu job.
- Job chưa hoàn thành.
- Offline completion.
- Claim thành công.
- Claim trùng.
- Inventory đầy.
- Server restart.
- Concurrent claim.

## Buildings
- Placement hợp lệ.
- Placement trên vật cản.
- Placement ngoài farm.
- Placement trên crop.
- Placement trên ao/chuồng.
- Rotation.
- Move.
- Store.
- Duplicate request.
- Transaction rollback.
- Không chặn đường thiết yếu.

## Decorations
- Đặt vật trang trí.
- Di chuyển.
- Cất.
- Inventory đồng bộ.
- Không nhân đôi.
- Hai tab sửa cùng vật.
- Reload giữ vị trí.

## Expansion
- Unlock level 1.
- Unlock level 2.
- Không đủ tiền.
- Mua trùng.
- Sai thứ tự.
- Cross-account access.
- Persistence.

## Economy
- Mua công trình.
- Mua decoration.
- Bán thành phẩm.
- Không đủ tiền.
- Server-side pricing.
- Atomic transactions.

## Migration
- V4 lên V5.
- Giữ toàn bộ dữ liệu.
- Idempotency.
- Integrity.
- Backup/restore test.

## Regression
- Phase 1 auth/movement.
- Phase 2 farming.
- Phase 3 market.
- Phase 4 VAC.

Chạy toàn bộ test suite.

Không xóa hoặc bỏ qua test cũ để đạt kết quả PASS.

---

# 17. BROWSER QA

Tái sử dụng browser QA hiện có.

Các kịch bản bắt buộc:

1. Đăng nhập.
2. Mở inventory.
3. Thu hoạch lúa.
4. Đến cối xay.
5. Chọn công thức gạo.
6. Bắt đầu chế biến.
7. Kiểm tra tiến trình.
8. Đăng xuất.
9. Đăng nhập lại.
10. Nhận gạo.
11. Bán gạo tại chợ.
12. Mua một vật trang trí.
13. Về farm.
14. Mở build mode.
15. Đặt vật trang trí.
16. Di chuyển vật.
17. Cất vật.
18. Xây công trình.
19. Mở rộng đất.
20. Reload.
21. Restart server.
22. Xác minh dữ liệu còn nguyên.

Kiểm tra:
- Console errors.
- Layout desktop/mobile.
- Canvas rendering.
- Camera.
- Collision.
- Keyboard/mouse.
- Scene transitions.
- Two accounts.
- Two tabs.

Nếu browser QA không chạy được, ghi rõ nguyên nhân và không tuyên bố COMPLETE.

---

# 18. PERFORMANCE

Không dùng timer riêng cho mỗi crafting job.

Không query SQLite mỗi frame.

Không gửi Socket.IO update liên tục chỉ để hiển thị animation.

Tối ưu:
- Rendering theo viewport.
- Sprite caching nếu phù hợp.
- Dirty state hoặc snapshot/delta sync.
- Event listener cleanup.
- Scene transition cleanup.

Kiểm tra FPS khi farm có nhiều decoration.

Không tối ưu quá mức trước khi đo đạc.

---

# 19. KHÔNG LÀM TRONG PHASE 5

Không triển khai:
- NPC storyline nâng cao.
- Bốn mùa đầy đủ.
- Hệ thống thời tiết phức tạp.
- Multiplayer farm visiting.
- Giao dịch P2P.
- Hợp tác xã.
- Đấu giá.
- Thanh toán tiền thật.
- Nhà máy công nghiệp.
- Automation sản xuất phức tạp.
- Hệ thống chế tạo hàng trăm công thức.

Các tính năng này thuộc Phase 6–8 hoặc ngoài MVP.

---

# 20. THỨ TỰ TRIỂN KHAI

P5.0 — Review Phase 4, backup, chạy regression.

P5.1 — Migration V5, item/recipe/building registries.

P5.2 — CraftingService, offline jobs và claim.

P5.3 — Processing buildings và công thức.

P5.4 — Placement system, collision và movement safety.

P5.5 — Decoration system.

P5.6 — Farm expansion.

P5.7 — Economy, Inventory, Canvas và UI integration.

P5.8 — Security, concurrency, tests, browser QA, balancing.

P5.9 — Documentation và handoff.

Sau mỗi bước:
- Chạy test liên quan.
- Kiểm tra regression.
- Ghi lỗi.
- Sửa lỗi nghiêm trọng trước khi tiếp tục.

---

# 21. DEFINITION OF DONE

Phase 5 chỉ được đánh dấu COMPLETE khi:

- Phase 1–4 vẫn hoạt động.
- Có ít nhất 6 công thức chế biến.
- Có 3 công trình chức năng.
- Crafting tiếp tục khi offline.
- Có thể nhận thành phẩm.
- Không claim trùng.
- Có thể đặt công trình.
- Có thể xoay/di chuyển/cất công trình khi hợp lệ.
- Có ít nhất 12 vật trang trí.
- Có thể đặt/di chuyển/cất trang trí.
- Có 2 cấp mở rộng đất.
- Không đặt chồng công trình trái phép.
- Không chặn đường thiết yếu.
- Inventory đồng bộ chính xác.
- Economy đồng bộ chính xác.
- Không nhân đôi tiền hoặc vật phẩm.
- Không thao tác trên farm khác.
- Database migration V5 an toàn.
- Reload/restart không mất dữ liệu.
- Automated tests pass.
- Browser QA pass các trường hợp bắt buộc.
- Tài liệu bàn giao được cập nhật.

Nếu thiếu bằng chứng, đánh dấu PARTIAL và nêu blocker.

---

# 22. DELIVERABLES

Cập nhật:
- README.md.
- GDD.md.
- IMPLEMENTATION_PROGRESS.md.
- HANDOFF.md.
- QA_CHECKLIST.md.

Bổ sung:
- Migration V5.
- CraftingService.
- Recipe registry.
- Building registry.
- Decoration registry.
- Building placement logic.
- Farm expansion logic.
- Crafting UI.
- Build mode UI.
- Decoration UI.
- Canvas renderers.
- Automated tests.
- Browser QA.
- Economy balancing report.

Không tự ý thay đổi định hướng PROJECT_MASTER_CONTEXT.md.

Chỉ cập nhật master context khi cần ghi nhận quyết định thiết kế đã được thống nhất.

---

# 23. BÁO CÁO CUỐI

Sau khi hoàn thành, báo cáo:

1. Branch và commit.
2. Các file đã thêm/sửa.
3. Migration V5.
4. Các công thức chế biến.
5. Danh sách công trình.
6. Danh sách decoration.
7. Cơ chế mở rộng farm.
8. Kết quả automated tests.
9. Kết quả browser QA.
10. Các lỗi đã sửa.
11. Các giới hạn còn lại.
12. COMPLETE/PARTIAL.
13. Có đủ điều kiện sang Phase 6 hay không.

Không tự tuyên bố hoàn thành khi chưa kiểm thử.

---

# 24. YÊU CẦU THỰC THI

Hãy trực tiếp triển khai Phase 5 trên repository hiện tại.

Không chỉ lập kế hoạch.

Không tạo project mới.

Không reset database.

Không triển khai Phase 6.

Ưu tiên theo thứ tự:
1. Bảo toàn dữ liệu Phase 1–4.
2. Server-authoritative gameplay.
3. Crafting hoạt động thực sự.
4. Building placement an toàn.
5. Decoration dễ sử dụng.
6. Farm expansion.
7. Giao diện và hiệu ứng.
8. Performance và QA.

Kết quả cuối cùng:

Người chơi có thể thu hoạch lúa, xay thành gạo, nấu món ăn, bán sản phẩm tại chợ, dùng Đồng Làng để xây cối xay, bếp quê, giàn phơi, trang trí và mở rộng nông trại.

Tất cả dữ liệu được lưu bền vững và không mất khi người chơi offline hoặc restart server.
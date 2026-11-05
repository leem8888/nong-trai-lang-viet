# MASTER PROMPT — NÔNG TRẠI LÀNG VIỆT
# PHASE 4: VƯỜN – AO – CHUỒNG (VAC)

## 0. VAI TRÒ VÀ NHIỆM VỤ

Bạn là Senior Game Developer, Backend Architect, Database Engineer, Gameplay Designer và QA Engineer.

Nhiệm vụ: Tiếp tục phát triển dự án Nông Trại Làng Việt từ source code hiện có.

Repository:
https://github.com/leem8888/nong-trai-lang-viet

Commit nghiệm thu Phase 1–3:
9b3d8d152e8724b5993a49efd69a3fe888f0320b

Công nghệ:
- Canvas 2D.
- Vanilla JavaScript ES Modules.
- HTML/CSS.
- Node.js.
- Express.
- Socket.IO.
- SQLite (better-sqlite3).

KHÔNG tạo project mới.
KHÔNG chuyển framework.
KHÔNG viết lại game engine.
KHÔNG reset database.
KHÔNG làm hỏng các tính năng Phase 1–3.
KHÔNG mở rộng sang Phase 5.

Mục tiêu cuối cùng: Người chơi có thể trồng cây, sử dụng nông sản để hỗ trợ nuôi cá và gà, thu hoạch cá và trứng, rồi đem bán tại chợ quê.

---

# 1. GATE 0 — KIỂM TRA DỰ ÁN

Trước khi viết code, bắt buộc:

1. Đọc PROJECT_MASTER_CONTEXT.md.
2. Đọc GDD.md.
3. Đọc README.md.
4. Đọc HANDOFF.md.
5. Đọc IMPLEMENTATION_PROGRESS.md.
6. Đọc QA_CHECKLIST.md.
7. Kiểm tra source thực tế.
8. Kiểm tra migrations và database.
9. Kiểm tra EconomyService, InventoryService và Crop System.
10. Kiểm tra hệ thống Canvas scene, interaction và Socket.IO.
11. Chạy toàn bộ automated tests.
12. Chạy browser QA nếu môi trường hỗ trợ.

Đối chiếu với commit nghiệm thu Phase 1–3.

Nếu source đã có thay đổi sau commit đó, giữ lại các thay đổi hợp lệ.

Không checkout/reset làm mất công việc mới.

Nếu phát hiện lỗi nghiêm trọng trong giao dịch, inventory hoặc ownership, sửa trước khi phát triển Phase 4.

Tái sử dụng kiến trúc hiện tại thay vì tạo hệ thống song song.

---

# 2. PHẠM VI PHASE 4

Triển khai các module:

P4.1 — VAC Farm Layout.

P4.2 — Fish Pond System.

P4.3 — Chicken Coop System.

P4.4 — Feed & Resource Cycle.

P4.5 — Offline Production.

P4.6 — Inventory & Economy Integration.

P4.7 — Canvas Rendering & UI.

P4.8 — Security, Testing & Documentation.

Tất cả các hệ thống phải liên kết với tài khoản và farm hiện có.

---

# 3. VAC FARM LAYOUT

## Mục tiêu

Mở rộng bản đồ nông trại hiện tại để hỗ trợ:
- Vườn trồng cây.
- Một ao cá.
- Một chuồng gà.
- Lối đi giữa các khu vực.
- Vị trí tương tác.
- Khu đất dành cho mở rộng sau này.

Ưu tiên sử dụng các vị trí ao và chuồng đã được dự trù trong Phase 1.

Không xóa cây trồng hoặc vật thể hiện có.

Không đặt công trình mới đè lên các tile đang có dữ liệu.

Nếu cần migration bản đồ, phải bảo toàn trạng thái farm cũ.

## Ao cá

Có:
- Bờ ao.
- Mặt nước.
- Hiệu ứng gợn sóng.
- Điểm tương tác.
- Cá xuất hiện khi ao có cá.
- Hiệu ứng thu hoạch.

## Chuồng gà

Có:
- Chuồng mái ngói hoặc mái lá.
- Hàng rào.
- Máng ăn.
- Gà di chuyển trong phạm vi chuồng.
- Trứng xuất hiện khi có thể thu hoạch.

Đồ họa phải phù hợp pixel art nông thôn Việt Nam.

Nếu chưa có sprite chất lượng, sử dụng placeholder nhất quán và ghi rõ art debt.

---

# 4. FISH POND SYSTEM

## 4.1. Cơ chế cơ bản

MVP có một ao trên mỗi farm.

Người chơi có thể:
1. Đến ao.
2. Mở giao diện ao.
3. Xem số cá hiện có.
4. Mua cá giống.
5. Thả cá.
6. Cho cá ăn.
7. Xem tiến trình phát triển.
8. Thu hoạch cá trưởng thành.
9. Nhận cá vào inventory.
10. Bán cá ở chợ.

## 4.2. Loại cá

Phase 4 triển khai hai loại:

- Cá rô phi.
- Cá chép.

Các loại cá phải có registry cấu hình:
- Fish ID.
- Display name.
- Fingerling item ID.
- Harvest item ID.
- Growth duration.
- Feed requirement.
- Harvest yield.
- Maximum capacity.
- Visual configuration.

Không hardcode toàn bộ thông số trong Socket.IO handler.

## 4.3. Thời gian phát triển

Đề xuất cho playtest:
- Cá rô phi: 90 phút.
- Cá chép: 150 phút.

Đây là thời gian game, không mô phỏng thời gian nuôi cá thực tế.

Cho phép chỉnh trong config.

Mỗi lứa cá lưu snapshot thông số tăng trưởng cần thiết để tránh lỗi khi cân bằng game sau này.

## 4.4. Sức chứa ao

Đề xuất ban đầu:
- Tối đa 6 cá đang nuôi.
- Một hoặc nhiều lứa nếu kiến trúc hỗ trợ.

Server phải kiểm tra sức chứa.

Không được thả quá giới hạn bằng cách gửi nhiều request đồng thời.

Không được thả cá khi không đủ cá giống.

## 4.5. Thu hoạch

Khi thu hoạch:
- Kiểm tra cá đã trưởng thành.
- Kiểm tra farm ownership.
- Kiểm tra interaction range.
- Kiểm tra inventory capacity.
- Xóa hoặc cập nhật cá đã thu hoạch.
- Cộng cá thành phẩm vào inventory.
- Ghi kết quả giao dịch.

Toàn bộ thao tác phải atomic.

Không thể thu hoạch cùng một con cá hai lần.

---

# 5. CHICKEN COOP SYSTEM

## 5.1. Gameplay

Người chơi có thể:
1. Đến chuồng gà.
2. Mua gà con.
3. Nuôi gà lớn.
4. Cho ăn.
5. Theo dõi trạng thái.
6. Nhặt trứng.
7. Sử dụng hoặc bán trứng.
8. Tiếp tục chu kỳ sản xuất.

## 5.2. Giới hạn

Một chuồng gà cho mỗi farm trong Phase 4.

Đề xuất:
- Sức chứa tối đa 4 con.
- Gà con trưởng thành sau 120 phút.
- Gà trưởng thành có thể đẻ trứng.

Các thông số phải cấu hình được.

Không cần:
- Lai giống.
- Di truyền.
- Bệnh dịch.
- Sinh sản tự động.
- Chiến đấu.
- Gà chết do người chơi offline.

## 5.3. Egg Production

Gà trưởng thành có thể sản xuất trứng theo chu kỳ.

Đề xuất:
- Một chu kỳ trứng: 45 phút.
- Mỗi con tối đa 3 trứng chờ thu hoạch.
- Gà không sản xuất vô hạn khi người chơi offline nhiều ngày.

Phải có cơ chế giới hạn sản lượng tích lũy.

Sản lượng phụ thuộc quy tắc cho ăn đã được xác nhận bởi server.

Không dùng timer riêng cho mỗi con gà.

## 5.4. Chicken State

Thiết kế state machine:
- GROWING.
- ADULT.
- PRODUCING.
- WAITING_FOR_FEED.

Trạng thái sản xuất phải được tính từ dữ liệu có thể lưu và tái tạo.

Không tạo các trạng thái mâu thuẫn.

## 5.5. Thu hoạch trứng

Khi nhặt trứng:
- Server tính số trứng hợp lệ.
- Kiểm tra capacity.
- Cộng inventory.
- Cập nhật số trứng còn lại.
- Commit transaction.

Nếu inventory không đủ chỗ, không được làm mất trứng.

Hai request nhặt trứng đồng thời không được nhận cùng một sản lượng hai lần.

---

# 6. FEED SYSTEM — KẾT NỐI VAC

Đây là phần tạo bản sắc gameplay Phase 4.

## 6.1. Mục tiêu

Tạo liên kết giữa:
- Vườn.
- Ao.
- Chuồng.

Không xây dựng một hệ thống crafting phức tạp vì crafting đầy đủ thuộc Phase 5.

## 6.2. Feed Types

Triển khai:
- Thức ăn cá.
- Thức ăn gà.

Có thể mua thức ăn tại cửa hàng NPC.

Đồng thời cho phép đổi một số nông sản thành thức ăn thông qua thao tác đơn giản tại máng ăn hoặc điểm tương tác VAC.

Ví dụ:
- Ngô → thức ăn gà.
- Đậu nành → thức ăn cá.
- Lúa → thức ăn gà.

Tỷ lệ chuyển đổi chỉ là thông số thử nghiệm.

## 6.3. Resource Conversion

Yêu cầu:
- Chọn công thức.
- Kiểm tra nguyên liệu.
- Kiểm tra số lượng.
- Kiểm tra sức chứa kho.
- Trừ nguyên liệu.
- Cộng thức ăn.
- Ghi transaction.
- Commit atomic.

Không có animation máy móc, dây chuyền hoặc công trình chế biến phức tạp.

Không tạo hệ thống crafting tổng quát ở Phase 4.

## 6.4. Feed Consumption

Thiết kế quy tắc cho ăn rõ ràng.

Đề xuất:
- Cá và gà có thể được nuôi mà không phải đăng nhập liên tục.
- Thức ăn hỗ trợ tăng trưởng hoặc kích hoạt chu kỳ sản xuất.
- Mỗi lần cho ăn có hiệu lực giới hạn.
- Không cộng lợi ích vô hạn khi spam.
- Không khiến vật nuôi chết khi thiếu thức ăn.

Quan trọng:
- Tác động của thức ăn phải xác định bằng timestamp UTC server.
- Không được tăng tốc ngược thời gian một cách sai lệch.
- Không để người chơi đổi giờ máy để gian lận.
- Không cho một lần cho ăn tạo vô hạn trứng hoặc cá.

Hãy chọn một quy tắc cụ thể, đơn giản, có thể kiểm thử và ghi vào GDD.

---

# 7. OFFLINE PRODUCTION

Đây là yêu cầu bắt buộc.

Cá và gà phải tiếp tục phát triển khi người chơi offline.

Sử dụng TimeService hiện có nếu phù hợp.

Không tin thời gian client.

Không dùng setInterval cho từng cá hoặc từng gà.

Khi người chơi mở farm:
- Server lấy timestamp hiện tại.
- Tính tiến trình phát triển.
- Tính số trứng có thể thu hoạch.
- Áp dụng giới hạn sản lượng.
- Trả snapshot chính xác.

Khi người chơi đang online:
- Client có thể hiển thị progress dự đoán.
- Server quyết định mọi hành động thu hoạch.

Test:
- Offline 5 phút.
- Offline 2 giờ.
- Offline 1 ngày.
- Offline nhiều ngày.
- Server restart.
- Đổi giờ máy.
- Refresh.
- Reconnect.
- Hai tab.
- Concurrent harvest.
- Timestamp sai.

Sử dụng clock injection hoặc test clock để kiểm thử thời gian mà không phải chờ thực tế.

Không cho vật nuôi chết vì vắng mặt trong MVP.

---

# 8. INVENTORY INTEGRATION

Tái sử dụng InventoryService Phase 2.

Không tạo inventory riêng cho VAC.

Bổ sung các item:
- Cá rô phi giống.
- Cá chép giống.
- Cá rô phi thành phẩm.
- Cá chép thành phẩm.
- Gà con.
- Trứng gà.
- Thức ăn cá.
- Thức ăn gà.

Tất cả item phải có:
- ID ổn định.
- Display name tiếng Việt.
- Category.
- Stack limit.
- Icon/sprite.
- Description.

Không tạo item ID trùng.

Không thay đổi ý nghĩa các item Phase 1–3.

Kiểm tra migration của inventory hiện có.

Nếu vật nuôi được lưu dưới dạng entity, inventory chỉ lưu con giống chưa thả, không được đồng thời ghi nhận cùng một con trong chuồng và trong túi đồ.

---

# 9. ECONOMY INTEGRATION

Tái sử dụng EconomyService Phase 3.

Mở rộng cửa hàng NPC:
- Bán cá giống.
- Bán gà con.
- Bán thức ăn.

Mở rộng NPC thu mua:
- Mua cá rô phi.
- Mua cá chép.
- Mua trứng gà.

Không tạo wallet thứ hai.

Không tạo transaction engine thứ hai.

Mọi giao dịch phải:
- Server authoritative.
- Atomic.
- Idempotent.
- Có transaction log.
- Có kiểm tra số dư và inventory.

## Economy Balancing

Tạo báo cáo so sánh:
- Chi phí con giống.
- Chi phí thức ăn.
- Thời gian nuôi.
- Sản lượng.
- Giá bán.
- Lợi nhuận.
- Lợi nhuận theo giờ.

Đảm bảo VAC có giá trị nhưng không phá vỡ kinh tế cây trồng.

Giá cả chỉ là thông số playtest.

Không cho phép chu kỳ chuyển đổi nông sản → thức ăn → sản phẩm tạo lợi nhuận vô hạn không bị giới hạn bởi thời gian, sức chứa hoặc nguyên liệu.

---

# 10. DATABASE MIGRATION V4

Kiểm tra migration hiện tại trước khi thiết kế.

Không sửa hoặc xóa migrations cũ.

Thiết kế các bảng phù hợp, ví dụ:
- farm_ponds.
- pond_fish.
- farm_coops.
- coop_chickens.
- animal_feed_events.
- animal_production_state.

Tên bảng có thể thay đổi theo kiến trúc thực tế.

Yêu cầu:
- Foreign keys.
- Unique constraints.
- Indexes.
- Farm ownership.
- Referential integrity.
- Transaction safety.
- Idempotent initialization.
- Schema versioning.

Không reset farm hiện có.

Không xóa cây trồng.

Không mất inventory.

Không mất tiền.

Không mất đơn hàng NPC.

Không làm hỏng scene chợ.

Migration phải hoạt động trên bản sao database Phase 3 có dữ liệu.

Kiểm tra quy trình starter.sqlite và farm.sqlite thực tế trước khi thay đổi.

Không commit database chứa dữ liệu người dùng thật.

---

# 11. SERVER-AUTHORITATIVE ACTIONS

Các action đề xuất:

Pond:
- pond:get_state.
- pond:stock_fish.
- pond:feed.
- pond:harvest.

Chicken:
- coop:get_state.
- coop:add_chicken.
- coop:feed.
- coop:collect_eggs.

VAC:
- vac:get_recipes.
- vac:convert_resources.

Tên event có thể điều chỉnh theo conventions hiện tại.

Mỗi action kiểm tra:
1. Authentication.
2. Farm ownership.
3. Scene.
4. Interaction range.
5. Payload.
6. Item quantity.
7. Capacity.
8. Entity state.
9. Rate limit.
10. Idempotency.

Client chỉ gửi ý định.

Không tin:
- Số trứng do client khai báo.
- Trạng thái trưởng thành do client khai báo.
- Số tiền do client khai báo.
- Thời gian do client khai báo.
- Sản lượng cá do client khai báo.

Server phải tự tính và xác nhận.

---

# 12. CANVAS RENDERING

Tích hợp với renderer hiện tại.

Không thay engine.

## PondRenderer

Hiển thị:
- Mặt nước.
- Bờ ao.
- Cá bơi.
- Hiệu ứng gợn sóng.
- Hiệu ứng cho ăn.
- Hiệu ứng thu hoạch.

Không cần mô phỏng vật lý nước phức tạp.

## ChickenRenderer

Hiển thị:
- Chuồng gà.
- Gà con.
- Gà trưởng thành.
- Gà đi lại.
- Máng ăn.
- Trứng.
- Hiệu ứng nhặt trứng.

Animation phải nhẹ.

Không dùng mỗi con vật một vòng cập nhật server liên tục.

Vị trí di chuyển mang tính trang trí có thể tính phía client, nhưng không ảnh hưởng tới trạng thái kinh tế.

Không để vật nuôi đi xuyên hàng rào hoặc chồng lên UI.

---

# 13. VAC USER INTERFACE

Giao diện bằng tiếng Việt.

## Pond Panel
- Số cá.
- Sức chứa.
- Loại cá.
- Tiến trình phát triển.
- Thời gian còn lại.
- Thức ăn.
- Nút thả cá.
- Nút cho ăn.
- Nút thu hoạch.

## Coop Panel
- Số gà.
- Sức chứa.
- Trạng thái trưởng thành.
- Thức ăn.
- Số trứng chờ thu hoạch.
- Nút thêm gà.
- Nút cho ăn.
- Nút nhặt trứng.

## VAC Panel
- Danh sách công thức đổi nông sản thành thức ăn.
- Nguyên liệu yêu cầu.
- Số lượng hiện có.
- Kết quả nhận được.
- Nút xác nhận.

## HUD
- Thông báo cá trưởng thành.
- Thông báo trứng sẵn sàng.
- Inventory cập nhật.
- Đồng Làng cập nhật.

Không hiển thị thành công trước khi server xác nhận.

Không để UI che vùng tương tác chính.

Không làm hỏng giao diện trồng trọt và chợ.

---

# 14. SECURITY & DATA CONSISTENCY

Các yêu cầu bắt buộc:

- Không thao tác trên farm người khác.
- Không giả mạo farm ID.
- Không cho ăn từ ngoài interaction range.
- Không thu hoạch vật nuôi không tồn tại.
- Không thêm gà vượt sức chứa.
- Không thả cá vượt sức chứa.
- Không nhân đôi cá hoặc trứng.
- Không tạo số lượng âm.
- Không làm mất item khi transaction thất bại.
- Không nhận thưởng nhiều lần từ cùng request.
- Không xử lý action sai scene.
- Không chấp nhận payload không hợp lệ.

Tái sử dụng cơ chế idempotency của Phase 3 nếu phù hợp.

Các action phải an toàn khi:
- Double click.
- Client retry.
- Socket reconnect.
- Hai tab.
- Request đồng thời.

Không trả thành công giả khi giao dịch chưa commit.

---

# 15. AUTOMATED TESTS

Giữ nguyên toàn bộ tests Phase 1–3.

Bổ sung tests Phase 4.

## Pond tests
- Khởi tạo ao.
- Thả cá hợp lệ.
- Không đủ cá giống.
- Ao đầy.
- Cá phát triển offline.
- Cá chưa trưởng thành.
- Thu hoạch hợp lệ.
- Thu hoạch trùng.
- Hai request thu hoạch đồng thời.

## Chicken tests
- Khởi tạo chuồng.
- Thêm gà.
- Chuồng đầy.
- Gà trưởng thành.
- Gà đẻ trứng.
- Giới hạn số trứng.
- Nhặt trứng.
- Nhặt trùng.
- Không mất trứng khi kho đầy.

## Feed tests
- Chuyển đổi nguyên liệu.
- Không đủ nguyên liệu.
- Cho ăn hợp lệ.
- Spam cho ăn.
- Không nhận lợi ích vô hạn.
- Rollback khi lỗi.

## Economy tests
- Mua cá giống.
- Mua gà con.
- Mua thức ăn.
- Bán cá.
- Bán trứng.
- Không đủ tiền.
- Không đủ hàng.
- Retry.
- Transaction atomic.

## Offline tests
- 5 phút.
- 2 giờ.
- 1 ngày.
- Nhiều ngày.
- Server restart.
- Client clock manipulation.
- Invalid timestamps.

## Security tests
- Cross-account access.
- Farm spoofing.
- Scene spoofing.
- Invalid payload.
- Interaction range.
- Concurrent actions.
- Duplicate requests.

## Migration tests
- Migration Phase 3 → Phase 4.
- Giữ dữ liệu Phase 1–3.
- Không tạo ao hoặc chuồng trùng.
- Restart giữ trạng thái.
- Không mất wallet, crops hoặc orders.

---

# 16. BROWSER QA

Tái sử dụng browser QA hiện có.

Kiểm tra bằng browser thật nếu công cụ cho phép:

1. Đăng nhập.
2. Đi đến ao.
3. Mở giao diện ao.
4. Thả cá.
5. Cho cá ăn.
6. Kiểm tra tiến trình.
7. Thu hoạch cá.
8. Đi đến chuồng.
9. Thêm gà.
10. Cho gà ăn.
11. Nhặt trứng.
12. Mở inventory.
13. Đến chợ.
14. Bán cá và trứng.
15. Quay lại farm.
16. Reload.
17. Restart server.
18. Kiểm tra trạng thái còn nguyên.

Kiểm tra:
- Console errors.
- Canvas rendering.
- UI overlap.
- Keyboard controls.
- Mouse controls.
- Scene transitions.
- Hai tài khoản.
- Hai tab.

Không tuyên bố đã test trên thiết bị vật lý nếu chỉ dùng browser emulator.

Không tuyên bố đã kiểm tra mạng production nếu chưa thực hiện.

---

# 17. PERFORMANCE

Mục tiêu:
- Không có timer riêng cho mỗi vật nuôi.
- Không query database mỗi frame.
- Không gửi Socket.IO event mỗi frame cho animation.
- Không load lại toàn bộ farm sau mỗi thao tác nhỏ nếu có thể đồng bộ theo delta.
- Hạn chế draw calls không cần thiết.
- Không tạo memory leak khi chuyển scene.
- Không đăng ký trùng event listeners.

Đảm bảo hệ thống VAC có thể mở rộng thêm nhiều loại vật nuôi trong tương lai.

Không tối ưu quá mức trước khi đo hiệu năng.

---

# 18. KHÔNG TRIỂN KHAI TRONG PHASE 4

Không làm:
- Chế biến thực phẩm phức tạp.
- Nhà máy hoặc dây chuyền sản xuất.
- Xây dựng tự do.
- Trang trí nâng cao.
- Hệ thống bốn mùa đầy đủ.
- NPC storylines.
- Giao dịch P2P.
- Thăm farm bạn bè.
- Hợp tác xã.
- Đấu giá.
- Thanh toán tiền thật.
- Hệ thống bệnh dịch hoặc vật nuôi chết khi offline.

Những phần này thuộc phase sau hoặc ngoài MVP.

---

# 19. THỨ TỰ TRIỂN KHAI

## P4.0 — Preflight
- Review source.
- Chạy tests.
- Xác minh migration.
- Đánh giá các module có thể tái sử dụng.

## P4.1 — Database & Registries
- Migration V4.
- Fish registry.
- Chicken configuration.
- Feed configuration.
- Item registry extension.

## P4.2 — Fish Pond
- Pond service.
- Stocking.
- Growth.
- Feeding.
- Harvest.
- Tests.

## P4.3 — Chicken Coop
- Chicken service.
- Growth.
- Egg production.
- Feeding.
- Collection.
- Tests.

## P4.4 — VAC Resource Cycle
- Feed recipes.
- Resource conversion.
- Inventory integration.
- Tests.

## P4.5 — Economy Integration
- NPC shop extensions.
- NPC buyer extensions.
- Balancing.
- Transaction tests.

## P4.6 — Canvas & UI
- Pond renderer.
- Coop renderer.
- Interaction panels.
- HUD.
- Animation.

## P4.7 — Integration & Security
- Socket.IO.
- Ownership.
- Scene validation.
- Idempotency.
- Concurrency.
- Offline progression.

## P4.8 — QA & Handoff
- Automated tests.
- Browser QA.
- Regression tests.
- Documentation.
- Final report.

Sau mỗi bước:
- Chạy test liên quan.
- Không làm hỏng Phase 1–3.
- Ghi nhận lỗi.
- Cập nhật tiến độ.

---

# 20. DEFINITION OF DONE

Phase 4 chỉ được đánh dấu COMPLETE khi:

- Phase 1–3 vẫn hoạt động.
- Mỗi farm có một ao cá.
- Có thể nuôi cá rô phi và cá chép.
- Có thể cho cá ăn.
- Cá phát triển khi offline.
- Có thể thu hoạch cá.
- Có một chuồng gà.
- Có thể thêm gà.
- Gà trưởng thành theo thời gian.
- Gà sản xuất trứng.
- Có thể nhặt trứng.
- Có giới hạn sản lượng offline.
- Có hệ thống thức ăn.
- Có liên kết nông sản → thức ăn.
- Inventory hoạt động chính xác.
- Có thể mua con giống và thức ăn.
- Có thể bán cá và trứng tại chợ.
- Không nhân đôi tiền hoặc vật phẩm.
- Không thao tác trên farm người khác.
- Không mất dữ liệu khi restart.
- Migration V4 an toàn.
- Automated tests pass.
- Browser QA đạt các trường hợp bắt buộc.
- Tài liệu bàn giao được cập nhật.

Nếu thiếu bằng chứng, đánh dấu PARTIAL và nêu rõ blocker.

---

# 21. DELIVERABLES

Cập nhật:
- README.md.
- GDD.md.
- IMPLEMENTATION_PROGRESS.md.
- HANDOFF.md.
- QA_CHECKLIST.md.

Chỉ cập nhật PROJECT_MASTER_CONTEXT.md nếu cần ghi nhận quyết định đã được thống nhất, không tự ý thay đổi định hướng dự án.

Bổ sung:
- Migration V4.
- VAC services.
- Fish and chicken registries.
- Feed rules.
- VAC renderer.
- VAC UI.
- Automated tests.
- Browser QA scenarios.
- Economy balancing report.

Báo cáo cuối cùng:
1. Branch và commit.
2. Danh sách file thay đổi.
3. Tính năng đã hoàn thành.
4. Kết quả migration.
5. Kết quả tests thực tế.
6. Kết quả browser QA.
7. Các lỗi đã sửa.
8. Các giới hạn còn lại.
9. Trạng thái COMPLETE/PARTIAL.
10. Có đủ điều kiện sang Phase 5 không.

Không được báo hoàn thành khi chưa kiểm thử.

---

# 22. YÊU CẦU CUỐI CÙNG

Hãy trực tiếp triển khai Phase 4 trên repository hiện tại.

Không chỉ viết kế hoạch.

Không tạo project mới.

Không thay đổi kiến trúc cốt lõi.

Không reset dữ liệu.

Không triển khai Phase 5.

Ưu tiên:
1. Tính đúng đắn dữ liệu.
2. Bảo mật và quyền sở hữu.
3. Gameplay VAC hoàn chỉnh.
4. Tính nhất quán với hệ thống cũ.
5. Giao diện dễ sử dụng.
6. Hiệu năng.
7. Khả năng mở rộng.

Kết quả mong muốn:

Người chơi vào nông trại, thu hoạch ngô và đậu nành, dùng chúng tạo thức ăn, nuôi gà và cá, thu hoạch trứng và cá, đem bán tại chợ để kiếm Đồng Làng.

Toàn bộ tiến trình được lưu lại và tiếp tục hoạt động khi người chơi offline.
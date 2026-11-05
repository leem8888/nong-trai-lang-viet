# NÔNG TRẠI LÀNG VIỆT — PHASE 2
## CROP SYSTEM, INVENTORY & OFFLINE GROWTH

### 1. VAI TRÒ

Bạn là Senior Game Developer, Node.js Architect, Database Engineer và QA Engineer.

Hãy tiếp tục phát triển dự án hiện tại, KHÔNG tạo project mới, KHÔNG viết lại toàn bộ kiến trúc.

Repository:
https://github.com/leem8888/nong-trai-lang-viet

Mục tiêu: Hoàn thiện những điều kiện nghiệm thu Phase 1 còn thiếu, sau đó xây dựng hệ thống trồng trọt đầu tiên có gameplay thực sự.

Phải triển khai code, chạy kiểm thử, sửa lỗi và cập nhật tài liệu.

---

# 2. ĐỌC DỰ ÁN TRƯỚC KHI LÀM

Bắt buộc đọc:

- PROJECT_MASTER_CONTEXT.md
- GDD.md
- README.md
- IMPLEMENTATION_PROGRESS.md
- HANDOFF.md
- package.json

Kiểm tra các module hiện tại:

- server/index.js
- server/db.js
- server/auth.js
- server/farms.js
- server/time.js
- public/js/main.js
- Các module player, camera, collision, input, renderer.
- tests/phase1.test.js

Không giả định module nào tồn tại nếu chưa kiểm tra source.

Không thay thế các module đang hoạt động chỉ để đổi kiến trúc.

---

# 3. GATE 0 — HOÀN TẤT PHASE 1

HANDOFF.md hiện ghi Phase 1 là partial.

Trước khi triển khai Phase 2:

1. Chạy npm ci.
2. Chạy npm test.
3. Khởi động server.
4. Kiểm tra đăng ký, đăng nhập và tạo farm.
5. Kiểm tra movement, camera, collision.
6. Kiểm tra ba tương tác: bảng, cửa, đèn.
7. Kiểm tra reload và restart server.
8. Kiểm tra hai tài khoản có hai farm riêng.
9. Kiểm tra reconnect và mất kết nối.
10. Kiểm tra authorization và CSRF.

Ưu tiên kiểm thử trình duyệt thật.

Nếu không có công cụ browser:
- Không tuyên bố đã hoàn thành QA trực quan.
- Tạo checklist kiểm thử thủ công.
- Ghi rõ các trường hợp chưa được xác minh.
- Không đánh dấu Phase 1 complete nếu thiếu bằng chứng bắt buộc.

Nếu phát hiện lỗi nghiêm trọng, sửa trước khi làm Phase 2.

Sau Gate 0, cập nhật HANDOFF.md và IMPLEMENTATION_PROGRESS.md.

---

# 4. MỤC TIÊU PHASE 2

Người chơi phải có thể:

1. Đăng nhập vào nông trại.
2. Chọn cuốc.
3. Cuốc một ô đất hợp lệ.
4. Chọn hạt giống.
5. Gieo hạt trên đất đã chuẩn bị.
6. Tưới cây.
7. Quan sát cây phát triển qua nhiều giai đoạn.
8. Đăng xuất và đóng trình duyệt.
9. Quay lại sau một khoảng thời gian.
10. Thấy cây đã phát triển tương ứng thời gian thực.
11. Thu hoạch cây trưởng thành.
12. Nhận nông sản trong inventory.
13. Trồng lại trên ô đất sau thu hoạch.

Tất cả trạng thái quan trọng phải được lưu trong SQLite.

Không có giao dịch tiền, chợ hoặc crafting trong phase này.

---

# 5. FARMING TILE SYSTEM

Tích hợp với tilemap hiện có.

Mỗi ô đất canh tác cần có:
- Farm ID.
- Tile X.
- Tile Y.
- Soil state.
- Crop instance nếu có.
- Watering state.
- Updated timestamp.

Các trạng thái đất:
- EMPTY.
- TILLED.
- WATERED.
- PLANTED.

Thiết kế state machine rõ ràng.

Không dùng nhiều boolean có thể tạo trạng thái mâu thuẫn.

Quy tắc:
- Không cuốc trên nhà, đường, cây hoặc vật cản.
- Không gieo hạt trên ô chưa chuẩn bị.
- Không gieo hai cây vào cùng một ô.
- Không thu hoạch cây chưa trưởng thành.
- Không tương tác với ô ngoài phạm vi hợp lệ.
- Không cho phép client tự sửa tile state.

Sử dụng tọa độ tile nhất quán với engine hiện tại.

---

# 6. FARMING TOOLS

Triển khai ba công cụ:

## Hoe
- Cuốc đất.
- Có animation hoặc feedback.
- Chỉ hoạt động trên ô hợp lệ.

## Watering Can
- Tưới ô đất hoặc cây.
- Có hiệu ứng nước.
- Không thể spam để nhận lợi ích vô hạn.

## Seed Tool
- Chọn loại hạt.
- Kiểm tra inventory.
- Gieo hạt.
- Trừ hạt giống bằng transaction.

Hỗ trợ tương tác bằng chuột và hệ thống input hiện tại.

Có thể dùng phím số 1, 2, 3 để chuyển công cụ.

Không để việc dùng công cụ làm hỏng WASD hoặc interaction system Phase 1.

---

# 7. CROP SYSTEM

Triển khai sáu loại cây đầu tiên:

1. Lúa.
2. Rau cải.
3. Cà chua.
4. Cà rốt.
5. Ngô.
6. Đậu nành.

Mỗi loại có cấu hình riêng:
- Crop ID.
- Display name.
- Seed item ID.
- Harvest item ID.
- Growth duration.
- Growth stages.
- Harvest yield.
- Watering rules.
- Visual configuration.

Đặt dữ liệu crop trong một registry hoặc data file dễ mở rộng.

Không hardcode toàn bộ cây trong renderer.

Các giai đoạn:
- SEED.
- SPROUT.
- GROWING.
- MATURE.

Thời gian phát triển ban đầu là thông số để thử nghiệm, chưa phải cân bằng kinh tế chính thức.

Đề xuất:
- Rau cải: 15 phút.
- Cà rốt: 25 phút.
- Đậu nành: 35 phút.
- Cà chua: 45 phút.
- Ngô: 60 phút.
- Lúa: 90 phút.

Phân bổ các giai đoạn tăng trưởng hợp lý theo từng loại cây.

Có thể điều chỉnh thời gian trong cấu hình mà không cần sửa database.

Đảm bảo dữ liệu cây đang trồng vẫn có ý nghĩa khi cấu hình thay đổi. Lưu thông tin phiên bản hoặc snapshot thông số cần thiết cho từng lần gieo.

---

# 8. OFFLINE GROWTH — YÊU CẦU QUAN TRỌNG NHẤT

Cây phải phát triển khi người chơi offline.

Sử dụng TimeService hiện có trong server/time.js nếu phù hợp.

Tuyệt đối không dựa vào Date.now() của client để quyết định cây trưởng thành.

Không chạy setInterval riêng cho từng cây.

Khi gieo:
- Server ghi plantedAt UTC.
- Lưu growth duration hoặc growth snapshot.
- Lưu trạng thái chăm sóc liên quan.

Khi người chơi vào farm:
- Server tính trạng thái cây theo thời gian thực.
- Gửi snapshot hợp lệ cho client.

Khi người chơi đang online:
- Client có thể dự đoán animation và progress bar.
- Server vẫn là nguồn xác thực cuối cùng.

Khi thu hoạch:
- Server tính lại trạng thái.
- Chỉ cho phép nếu cây trưởng thành.
- Xử lý thu hoạch trong transaction.

Không cho cây chết chỉ vì người chơi offline.

Không cần tạo background timer cho mọi farm.

## Watering

Thiết kế quy tắc tưới đơn giản và nhất quán:

- Cây vẫn có thể phát triển khi không tưới.
- Tưới mang lại lợi ích giới hạn.
- Lợi ích không được cộng vô hạn do spam.
- Tác động tưới phải tính được khi offline.
- Trạng thái tưới có timestamp server.

Chọn một quy tắc cụ thể, mô tả trong GDD và tạo test.

Nếu tăng tốc trưởng thành bằng tưới, phải bảo đảm không thay đổi ngược thời gian hoàn thành khi server restart.

## Edge cases

Kiểm thử:
- Offline 5 phút.
- Offline 2 giờ.
- Offline nhiều ngày.
- Server restart.
- Client đổi giờ máy.
- Hai request harvest cùng lúc.
- Socket reconnect.
- Refresh giữa lúc gieo.
- Hai tab cùng thao tác.
- Timestamp không hợp lệ.

---

# 9. INVENTORY SYSTEM

Tạo inventory thực, lưu trong SQLite.

Vật phẩm Phase 2:
- Hạt giống của sáu loại cây.
- Nông sản thu hoạch từ sáu loại cây.

Mỗi item có:
- Item ID.
- Display name.
- Category.
- Stack limit.
- Icon hoặc sprite.
- Description.

Yêu cầu:
- Thêm vật phẩm.
- Trừ vật phẩm.
- Kiểm tra đủ số lượng.
- Không có số lượng âm.
- Không nhân đôi vật phẩm.
- Không để mất vật phẩm khi request lỗi.
- Giao dịch inventory bằng database transaction.

Tạo inventory UI:
- Danh sách vật phẩm.
- Số lượng.
- Vật phẩm đang chọn.
- Tooltip hoặc mô tả.

## Hạt giống khởi đầu

Cấp một lượng hạt giống ban đầu khi farm mới được tạo hoặc khi người chơi lần đầu mở khóa Phase 2.

Quá trình cấp phải idempotent:
- Không cấp lại khi reload.
- Không cấp lại khi reconnect.
- Không cấp lại khi restart server.
- Không cấp trùng khi hai request đồng thời.

Vì Phase 3 mới có cửa hàng, cần cơ chế bổ sung hạt giống tạm thời để người chơi không bị kẹt khi dùng hết.

Cơ chế này phải:
- Có giới hạn hoặc điều kiện rõ ràng.
- Không phụ thuộc thanh toán.
- Không tạo lỗ hổng nhận vô hạn vật phẩm.
- Có thể thay bằng cửa hàng Phase 3.

---

# 10. DATABASE MIGRATION V2

Không sửa hoặc xóa migration v1.

Thiết kế migration mới cho các dữ liệu cần thiết như:
- farm_soil_tiles.
- farm_crops.
- item_definitions nếu cần lưu database.
- inventories hoặc inventory_items.
- inventory_transactions nếu cần audit.

Có thể đổi tên bảng khi phù hợp với code hiện tại.

Yêu cầu:
- Primary keys.
- Foreign keys.
- Unique constraint theo farm/tile.
- Index phù hợp.
- Prepared statements.
- Transaction.
- Referential integrity.
- Idempotency.
- Migration từ database Phase 1 có dữ liệu thật.

Quan trọng:

Repository hiện sử dụng data/starter.sqlite để khởi tạo database và data/farm.sqlite để lưu dữ liệu chơi cục bộ.

Phải kiểm tra quy trình migration thực tế trước khi sửa.

Không xóa data/farm.sqlite.

Không reset tài khoản hoặc nông trại hiện có.

Cập nhật starter database đúng cách nếu quy trình dự án yêu cầu.

Kiểm thử migration trên bản sao database Phase 1 có dữ liệu.

---

# 11. SERVER-AUTHORITATIVE ACTIONS

Tạo các hành động gameplay:
- till_soil.
- plant_seed.
- water_crop.
- harvest_crop.
- get_farm_crops.
- get_inventory.

Tên event/API có thể điều chỉnh theo conventions hiện có.

Mỗi action phải kiểm tra:
- Authentication.
- Farm ownership hoặc permission.
- Farm ID.
- Tile coordinates.
- Player interaction range.
- Crop state.
- Inventory state.
- Rate limit.
- Payload schema.

Client chỉ gửi ý định hành động.

Server quyết định kết quả.

Không cho client gửi số lượng thu hoạch tùy ý.

Không cho client tự tăng inventory.

Không cho client khai báo cây đã trưởng thành.

---

# 12. CANVAS RENDERING

Tích hợp CropRenderer vào engine hiện tại.

Hiển thị:
- Đất chưa cuốc.
- Đất đã cuốc.
- Đất đã tưới.
- Hạt mới gieo.
- Mầm non.
- Cây đang lớn.
- Cây trưởng thành.

Mỗi cây cần hình ảnh phân biệt được.

Ưu tiên pixel art phù hợp phong cách làng quê Việt Nam.

Không thay toàn bộ renderer Phase 1.

Không dùng một ảnh nền duy nhất để giả lập nhiều cây.

Cần có:
- Tile highlight.
- Tool preview.
- Interaction feedback.
- Harvest effect.
- Watering effect.
- Growth progress UI.

Animation phải nhẹ và không làm giảm FPS nghiêm trọng.

---

# 13. FARMING UI

Thêm HUD trồng trọt:

- Toolbar công cụ.
- Inventory.
- Hạt giống đang chọn.
- Thông tin cây.
- Thanh tiến trình phát triển.
- Trạng thái sẵn sàng thu hoạch.
- Thông báo thao tác thành công hoặc thất bại.

Ví dụ:

"Lúa — đang phát triển — còn khoảng 25 phút"

"Rau cải đã trưởng thành — có thể thu hoạch"

"Không đủ hạt giống"

"Ô đất này đã có cây"

"Tương tác quá xa"

UI phải hỗ trợ tiếng Việt.

Không để toolbar che nhân vật hoặc vùng tương tác chính.

---

# 14. TESTING

Bổ sung tests/phase2.test.js hoặc cấu trúc test phù hợp.

Không xóa tests/phase1.test.js.

Cập nhật npm test để chạy cả Phase 1 và Phase 2.

Test bắt buộc:

## Soil
- Cuốc hợp lệ.
- Cuốc trên vật cản.
- Gieo trên đất chưa cuốc.
- Gieo hai cây cùng ô.

## Inventory
- Thêm vật phẩm.
- Trừ vật phẩm.
- Không đủ vật phẩm.
- Không âm số lượng.
- Rollback transaction.

## Crop growth
- Trạng thái lúc vừa gieo.
- Giai đoạn mầm.
- Giai đoạn phát triển.
- Trưởng thành.
- Offline progression.
- Server restart.
- Client clock manipulation.

## Harvest
- Thu hoạch trước thời gian.
- Thu hoạch hợp lệ.
- Thu hoạch hai lần.
- Hai request đồng thời.
- Inventory tăng chính xác.
- Đất chuyển về trạng thái hợp lệ.

## Ownership
- Không thao tác trên farm người khác.
- Không giả mạo farm ID.
- Không sửa cây ngoài vùng tương tác.
- Không gửi payload sai định dạng.

## Migration
- Migration v1 lên v2.
- Dữ liệu Phase 1 còn nguyên.
- Migration không chạy trùng.
- Starter database hợp lệ.

Chạy kiểm thử tự động và kiểm thử trình duyệt khi môi trường cho phép.

Không tuyên bố browser QA đã pass nếu chưa thực sự kiểm tra.

---

# 15. KHÔNG LÀM TRONG PHASE 2

Không triển khai:
- Tiền trong game.
- Chợ phiên.
- Mua bán nông sản.
- Giao dịch P2P.
- Ao cá.
- Chăn nuôi.
- Chế biến.
- Bốn mùa hoàn chỉnh.
- Hệ thống nhiệm vụ NPC phức tạp.
- Thanh toán.
- Thay engine hiện tại.

Chỉ làm Crop System, Inventory, Offline Growth và UI liên quan.

---

# 16. DELIVERABLES

Sau khi triển khai:

1. Source code chạy được.
2. Crop system.
3. Soil system.
4. Tool system.
5. Inventory.
6. Offline growth.
7. Database migration v2.
8. UI trồng trọt.
9. Automated tests.
10. Browser QA report nếu có.
11. README cập nhật.
12. GDD cập nhật.
13. IMPLEMENTATION_PROGRESS.md cập nhật.
14. HANDOFF.md cập nhật.

Báo cáo phải ghi:
- Những file đã thay đổi.
- Các chức năng đã hoàn thành.
- Kết quả test thực tế.
- Những chức năng chưa hoàn thành.
- Những rủi ro còn lại.
- Có đủ điều kiện sang Phase 3 hay không.

---

# 17. DEFINITION OF DONE

Phase 2 chỉ được xem là hoàn thành khi:

- Phase 1 đạt các điều kiện nghiệm thu bắt buộc.
- Có thể cuốc đất.
- Có thể gieo sáu loại cây.
- Có thể tưới cây.
- Cây có bốn giai đoạn phát triển.
- Cây lớn lên khi offline.
- Cây trưởng thành có thể thu hoạch.
- Inventory cập nhật chính xác.
- Không thể thu hoạch trùng.
- Không thể thao tác trên farm người khác.
- Database migration không làm mất dữ liệu cũ.
- Reload/restart không làm mất cây.
- Các test bắt buộc pass.
- Có bằng chứng kiểm thử thực tế.
- Tài liệu bàn giao được cập nhật.

Không được tự tuyên bố hoàn thành nếu chưa đủ bằng chứng.

---

# 18. THỨ TỰ TRIỂN KHAI

P2.0 — Hoàn tất QA và lỗi còn lại của Phase 1.

P2.1 — Database migration và crop registry.

P2.2 — Farming tiles và tools.

P2.3 — Crop growth và offline progression.

P2.4 — Inventory và harvest transactions.

P2.5 — Crop rendering và farming UI.

P2.6 — Socket.IO integration và bảo mật.

P2.7 — Automated tests, browser QA và tài liệu.

Thực hiện tuần tự, kiểm tra sau từng bước.

Nếu gặp vấn đề kiến trúc nghiêm trọng, báo cáo và giải quyết trước khi tiếp tục.

---

# 19. YÊU CẦU THỰC THI

Hãy bắt đầu bằng việc kiểm tra source hiện tại và đối chiếu với tài liệu bàn giao.

Sau đó hoàn thành Gate 0 và triển khai Phase 2.

Không chỉ trả lời bằng kế hoạch.

Không tạo một game mới.

Không phá hỏng dữ liệu Phase 1.

Không mở rộng sang Phase 3.

Mục tiêu cuối cùng là người chơi có thể vào nông trại, trồng cây, thoát game, quay lại sau một thời gian thực và thu hoạch nông sản vào kho.
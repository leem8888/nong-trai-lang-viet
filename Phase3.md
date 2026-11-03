# NÔNG TRẠI LÀNG VIỆT — PHASE 3
## ECONOMY SYSTEM, NPC MARKET & VILLAGE ORDERS

### VAI TRÒ

Bạn là Senior Game Developer, Node.js Architect, Database Engineer, Economy Designer và QA Engineer.

Nhiệm vụ là tiếp tục phát triển repository hiện tại:

https://github.com/leem8888/nong-trai-lang-viet

Không tạo project mới.
Không viết lại game engine.
Không phá hỏng dữ liệu người chơi.
Không triển khai ngoài phạm vi Phase 3.

Công nghệ bắt buộc:
- Canvas 2D.
- Vanilla JavaScript.
- Node.js.
- Express.
- Socket.IO.
- SQLite.
- better-sqlite3.

Mục tiêu Phase 3: Hoàn thiện vòng gameplay kinh tế đầu tiên:

TRỒNG → THU HOẠCH → BÁN → KIẾM TIỀN → MUA GIỐNG → TRỒNG TIẾP.

---

# I. ĐỌC SOURCE VÀ NGHIỆM THU PHASE 2

Bắt buộc đọc:
- PROJECT_MASTER_CONTEXT.md
- GDD.md
- README.md
- IMPLEMENTATION_PROGRESS.md
- HANDOFF.md
- package.json
- Source code Phase 1 và Phase 2.
- Các database migrations.
- Các automated tests hiện có.

Kiểm tra branch và commit hiện tại.

Không giả định Phase 2 hoàn thành chỉ vì người dùng đã push code.

Xác minh:
1. Có Soil System.
2. Có Crop System.
3. Có sáu loại cây.
4. Có Inventory System.
5. Có Offline Growth.
6. Có Harvest transaction.
7. Có migration Phase 2.
8. Có kiểm tra ownership.
9. Có automated tests.
10. Có thể chạy gameplay trồng và thu hoạch thực tế.

Chạy npm ci và npm test.

Nếu Phase 2 còn lỗi nghiêm trọng về inventory, mất dữ liệu, thu hoạch trùng hoặc authorization, phải sửa trước khi triển khai kinh tế.

Không sửa tùy tiện dữ liệu SQLite hiện có.

Nếu chưa đủ điều kiện nghiệm thu, ghi rõ blocker và dừng các thay đổi có nguy cơ làm hỏng dữ liệu.

---

# II. MỤC TIÊU PHASE 3

Người chơi phải có thể:

1. Đăng nhập vào farm.
2. Xem số dư Đồng Làng.
3. Thu hoạch nông sản từ Phase 2.
4. Đến khu chợ quê.
5. Tương tác với NPC thu mua.
6. Chọn nông sản và số lượng bán.
7. Nhận tiền chính xác.
8. Đến cửa hàng hạt giống.
9. Dùng tiền mua hạt giống.
10. Quay lại farm để tiếp tục trồng.
11. Nhận đơn hàng NPC.
12. Giao nông sản theo yêu cầu.
13. Nhận phần thưởng.
14. Xem lịch sử giao dịch.
15. Reload và restart server mà không mất tiền, hàng hoặc tiến trình đơn hàng.

Tất cả hành động kinh tế phải được server xác thực.

---

# III. ECONOMY SERVICE

Thiết kế EconomyService tách biệt UI và Socket.IO handlers.

Chức năng:
- Get balance.
- Credit currency.
- Debit currency.
- Validate balance.
- Record transaction.
- Calculate purchase price.
- Calculate sale price.
- Prevent negative balance.
- Prevent integer overflow.
- Handle duplicate requests.

Tiền sử dụng số nguyên.

Không sử dụng floating-point cho số dư.

Không cho client gửi số tiền được cộng vào ví.

Không tạo API chung cho client tự yêu cầu cộng tiền.

Chỉ các hành động nghiệp vụ hợp lệ mới được thay đổi số dư.

Tất cả giao dịch phải có transaction log.

---

# IV. WALLET SYSTEM

Mỗi người chơi có một ví Đồng Làng.

Yêu cầu:
- Một ví cho mỗi user.
- Số dư mặc định được cấp một lần.
- Không cấp lại tiền khi reload.
- Không cấp lại tiền khi reconnect.
- Không cấp lại tiền khi restart.
- Không cấp trùng do hai request đồng thời.

Đề xuất số dư khởi đầu: 200 Đồng Làng.

Đây là giá trị cấu hình để playtest.

Nếu user Phase 2 đã tồn tại, migration phải khởi tạo ví an toàn và idempotent.

Không reset tài khoản cũ.

---

# V. ITEM PRICING

Tái sử dụng item registry và inventory Phase 2.

Không tạo một inventory thứ hai.

Thiết kế price registry có thể cấu hình:

- Item ID.
- Base sell price.
- Buy price nếu được bán ở cửa hàng.
- Item category.
- Market eligibility.
- Price version.

Giá bán thử nghiệm:
- Rau cải: 12.
- Cà rốt: 18.
- Đậu nành: 22.
- Cà chua: 25.
- Ngô: 35.
- Lúa: 45.

Giá hạt giống phải được cân bằng dựa trên:
- Thời gian phát triển.
- Sản lượng thu hoạch.
- Giá bán thành phẩm.
- Lợi nhuận trung bình.
- Khả năng mua giống tiếp.

Tạo một công cụ hoặc automated test kiểm tra cân bằng kinh tế cơ bản.

Không để một loại cây luôn có lợi nhuận vượt trội trong mọi trường hợp.

Không hardcode giá trong client.

Server quyết định giá cuối cùng.

---

# VI. NPC SEED SHOP

Tạo cửa hàng hạt giống do NPC quản lý.

Chức năng:
- Xem danh sách hạt giống.
- Xem giá mua.
- Xem số dư.
- Chọn số lượng.
- Xác nhận mua.
- Nhận hạt vào inventory.

Khi mua:
1. Validate session.
2. Validate NPC/shop access.
3. Validate item.
4. Validate quantity.
5. Validate price.
6. Validate balance.
7. Validate inventory capacity.
8. Debit currency.
9. Add inventory items.
10. Record transaction.
11. Commit database transaction.
12. Return updated balance and inventory.

Nếu một bước lỗi, rollback toàn bộ.

Không cho phép:
- Mua số lượng âm.
- Mua bằng giá client tự gửi.
- Mua vượt số tiền.
- Mua vượt sức chứa kho.
- Mua trùng do retry cùng request ID.

---

# VII. NPC CROP BUYER

Tạo NPC thu mua nông sản.

Chức năng:
- Hiển thị vật phẩm có thể bán.
- Hiển thị số lượng sở hữu.
- Hiển thị đơn giá.
- Chọn số lượng.
- Xác nhận bán.
- Nhận Đồng Làng.

Khi bán:
1. Validate player.
2. Validate market access.
3. Validate item.
4. Validate quantity.
5. Validate inventory.
6. Calculate server-side price.
7. Remove inventory items.
8. Credit currency.
9. Record transaction.
10. Commit.
11. Return updated state.

Không được xảy ra:
- Bán một vật phẩm hai lần.
- Bán khi inventory không đủ.
- Nhận tiền nhưng không mất hàng.
- Mất hàng nhưng không nhận tiền.
- Nhân đôi tiền khi gửi lại request.

---

# VIII. VILLAGE MARKET MAP

Tạo một scene hoặc map chợ quê Việt Nam.

Phải phù hợp Canvas 2D engine hiện tại.

Các thành phần:
- Gian hàng hạt giống.
- Gian hàng thu mua.
- Bảng đơn hàng.
- Đường làng.
- Giỏ tre.
- Quang gánh.
- Mái che.
- Bàn gỗ.
- Các vật thể trang trí mang bản sắc Việt Nam.

Có collision và interaction range.

Người chơi phải có thể:
- Từ farm đi đến chợ.
- Tương tác với NPC.
- Quay lại farm.

Nếu chưa có scene transition, triển khai tối thiểu:
- Farm scene.
- Village market scene.
- Transition giữa hai scene.
- Server validation của vị trí và quyền tương tác.

Không giả lập việc đến chợ chỉ bằng một nút bán hàng từ bất kỳ vị trí nào.

Nếu cần, sử dụng điểm chuyển cảnh tại cổng farm.

---

# IX. NPC ORDER SYSTEM

Tạo hệ thống đơn hàng NPC.

Mỗi đơn hàng có:
- Order ID.
- NPC ID.
- Title.
- Description.
- Required items.
- Required quantities.
- Reward.
- Availability.
- Status.
- Created at.
- Completed at.

Các trạng thái:
- AVAILABLE.
- ACCEPTED.
- COMPLETED.
- EXPIRED nếu có thời hạn.

Trong MVP, ưu tiên đơn hàng không có deadline để tránh gây áp lực đăng nhập.

Thiết kế 5–8 mẫu đơn hàng.

Đơn hàng có thể yêu cầu nhiều loại nông sản.

Khi hoàn thành:
- Kiểm tra đơn hàng thuộc người chơi.
- Kiểm tra trạng thái.
- Kiểm tra inventory.
- Trừ đủ nguyên liệu.
- Cộng tiền thưởng.
- Đánh dấu completed.
- Ghi transaction log.
- Commit atomic.

Không thể nhận thưởng hai lần.

Không thể hoàn thành đơn hàng của tài khoản khác.

Không được client tự gửi reward amount.

Thiết kế cách tạo hoặc làm mới đơn hàng có giới hạn, tránh farm tiền vô hạn bằng thao tác lặp.

---

# X. MARKET DAY SYSTEM

Triển khai chợ phiên ở mức đơn giản.

Không cần hệ thống kinh tế động phức tạp.

Thiết kế một MarketService với:
- Market schedule.
- Market ID.
- Featured items.
- Price modifier.
- Start time.
- End time.
- Market status.

Ví dụ:
- Một số mặt hàng có giá tăng 10–20% trong phiên chợ.
- Giá phải được server tính toán.
- Có giới hạn biên độ giá.
- Không có giá âm.
- Không thay đổi giá giữa hai bước của cùng giao dịch đã được chấp nhận.

Dùng thời gian UTC server.

Không tin đồng hồ client.

Cần thiết kế lịch chợ đơn giản và dễ kiểm thử.

Nếu lịch chợ gây phức tạp vượt phạm vi, ưu tiên chợ mở thường xuyên và thêm mặt hàng nổi bật theo chu kỳ. Không chặn vòng gameplay chính vì chờ phiên chợ.

---

# XI. DATABASE MIGRATION V3

Kiểm tra migration hiện có trước khi sửa.

Không xóa migration Phase 1 hoặc Phase 2.

Thiết kế bảng phù hợp:
- wallets.
- economy_transactions.
- npc_shops.
- shop_catalog nếu cần.
- npc_order_templates.
- player_orders.
- market_sessions nếu cần.
- economy_request_receipts hoặc cơ chế idempotency tương đương.

Có thể điều chỉnh tên theo kiến trúc thực tế.

Yêu cầu:
- Foreign keys.
- Unique constraints.
- Indexes.
- Transactions.
- Prepared statements.
- Schema versioning.
- Idempotency.
- Migration test.
- Không mất dữ liệu cũ.

Kiểm tra kỹ starter.sqlite và farm.sqlite.

Không commit database chứa tài khoản thật.

Nếu có thay đổi starter.sqlite, cập nhật theo quy trình hiện có.

---

# XII. ECONOMY TRANSACTION SAFETY

Đây là yêu cầu bắt buộc.

Mọi giao dịch mua, bán và hoàn thành đơn hàng phải atomic.

Không thực hiện:
- Trừ tiền ở một request.
- Cộng hàng ở request khác.
- Ghi lịch sử sau khi transaction đã hoàn thành.

Phải sử dụng SQLite transaction phù hợp.

Các request cần có idempotency key hoặc cơ chế tương đương để tránh xử lý trùng khi:
- Client retry.
- Socket reconnect.
- Double click.
- Hai tab gửi cùng request.
- Network timeout.

Server phải kiểm tra key gắn với user và loại hành động, lưu kết quả để retry an toàn.

Không được dùng cùng key với payload khác để thực hiện giao dịch mới.

Thiết kế chống race condition và double spending.

---

# XIII. SOCKET.IO & API

Tái sử dụng socket infrastructure.

Các hành động nghiệp vụ đề xuất:
- economy:get_balance.
- shop:get_catalog.
- shop:buy.
- market:get_prices.
- market:sell.
- orders:list.
- orders:accept.
- orders:complete.
- economy:get_history.

Tên event có thể thay đổi theo convention hiện có.

Yêu cầu:
- Authentication.
- Authorization.
- Payload validation.
- Rate limiting.
- Acknowledgement.
- Consistent error format.
- Server-authoritative pricing.
- No client-authoritative balance.

Nếu HTTP API phù hợp hơn với các giao dịch quan trọng, có thể dùng Express endpoints, nhưng phải giữ một business service chung.

Không tạo hai luồng nghiệp vụ khác nhau gây mất nhất quán.

---

# XIV. UI/UX

Tạo UI tiếng Việt.

## HUD
- Số dư Đồng Làng.
- Inventory shortcut.
- Chỉ báo chợ nếu cần.

## Seed Shop
- Danh sách hạt giống.
- Đơn giá.
- Số lượng.
- Tổng tiền.
- Nút mua.
- Trạng thái giao dịch.

## Crop Buyer
- Danh sách nông sản.
- Số lượng trong kho.
- Giá bán.
- Tổng tiền dự kiến.
- Nút bán.

## Order Board
- Danh sách đơn hàng.
- Nguyên liệu yêu cầu.
- Tiến trình hiện tại.
- Phần thưởng.
- Nút nhận hoặc hoàn thành.

## Transaction History
- Loại giao dịch.
- Vật phẩm.
- Số lượng.
- Tiền tăng/giảm.
- Thời gian.

Không hiển thị thành công trước khi server xác nhận.

Không để người chơi mua/bán nhiều lần do double click.

Thông báo lỗi phải rõ ràng:
- Không đủ Đồng Làng.
- Không đủ nông sản.
- Kho đã đầy.
- Đơn hàng đã hoàn thành.
- Giao dịch không hợp lệ.
- Mất kết nối với server.

---

# XV. ECONOMY BALANCING

Tạo cấu hình dễ điều chỉnh.

Các mục tiêu playtest:
- Người mới có thể mua thêm hạt giống.
- Một vòng trồng → bán có lợi nhuận dương hợp lý.
- Người chơi không bị kẹt vì hết tiền và hết hạt.
- Đơn hàng NPC hấp dẫn hơn bán trực tiếp trong một số tình huống.
- Không có phương pháp nhân tiền vô hạn.
- Không có một loại cây luôn tốt nhất về mọi tiêu chí.

Tạo bảng hoặc báo cáo mô phỏng:
- Chi phí hạt giống.
- Thời gian trồng.
- Sản lượng.
- Doanh thu.
- Lợi nhuận.
- Lợi nhuận theo giờ.

Không chỉ so sánh giá bán một vật phẩm.

Có thể tạo script mô phỏng economy bằng Node.js.

---

# XVI. AUTOMATED TESTS

Giữ nguyên tests Phase 1 và Phase 2.

Thêm tests Phase 3.

Test bắt buộc:

Wallet:
- Tạo ví.
- Số dư ban đầu.
- Không cấp trùng.
- Không âm số dư.
- Không tràn số nguyên.

Shop:
- Mua hợp lệ.
- Không đủ tiền.
- Item không tồn tại.
- Số lượng âm.
- Kho đầy.
- Retry request.
- Concurrent purchase.

Selling:
- Bán hợp lệ.
- Không đủ hàng.
- Bán trùng.
- Hai request đồng thời.
- Atomic rollback.
- Không sửa giá từ client.

Orders:
- Nhận đơn.
- Hoàn thành đơn.
- Thiếu nguyên liệu.
- Hoàn thành hai lần.
- Không nhận thưởng trùng.
- Không hoàn thành đơn của user khác.

Market:
- Giá cơ bản.
- Giá khuyến khích.
- Lịch UTC.
- Giới hạn biến động.
- Giá không âm.

Persistence:
- Reload.
- Server restart.
- Migration từ database Phase 2.
- Không mất inventory.
- Không mất tiền.
- Không mất order progress.

Security:
- Unauthenticated requests.
- Cross-account access.
- Invalid payload.
- Socket spoofing.
- Idempotency key reused with different payload.

Kiểm thử bằng trình duyệt thật nếu có công cụ.

Không báo browser QA pass khi chưa kiểm tra.

---

# XVII. KHÔNG LÀM TRONG PHASE 3

Không triển khai:
- Giao dịch P2P.
- Chuyển tiền giữa người chơi.
- Đấu giá.
- Nạp tiền thật.
- Thanh toán.
- Ao cá.
- Chuồng gà.
- Chế biến.
- Hợp tác xã.
- Hệ thống NPC story phức tạp.
- Multiplayer xã hội nâng cao.
- Dynamic economy phức tạp.

Những tính năng này thuộc phase sau hoặc nằm ngoài MVP.

---

# XVIII. THỨ TỰ TRIỂN KHAI

P3.0 — Review và nghiệm thu Phase 2.

P3.1 — Migration V3, Wallet và EconomyService.

P3.2 — Item Pricing và NPC Seed Shop.

P3.3 — Crop Selling.

P3.4 — Village Market Scene.

P3.5 — NPC Orders.

P3.6 — Market Day và Price Modifier.

P3.7 — UI, Socket.IO, Integration.

P3.8 — Security, Tests, Balancing và Documentation.

Thực hiện tuần tự.

Sau mỗi bước:
- Chạy test.
- Kiểm tra regression.
- Cập nhật tiến độ.
- Không để lỗi nghiêm trọng tồn đọng.

---

# XIX. DEFINITION OF DONE

Phase 3 chỉ hoàn thành khi:

- Phase 2 đã được xác minh.
- Người chơi có ví Đồng Làng.
- Mua được hạt giống.
- Bán được nông sản.
- Có bản đồ chợ quê.
- Có NPC bán giống và thu mua.
- Có ít nhất 5 đơn hàng hoạt động.
- Có lịch sử giao dịch.
- Không thể nhân đôi tiền/hàng.
- Không có số dư âm.
- Giao dịch atomic.
- Retry an toàn.
- Reload/restart giữ dữ liệu.
- Tests Phase 1, 2, 3 pass.
- Có kết quả browser QA hoặc ghi rõ giới hạn.
- Tài liệu bàn giao cập nhật.

Không tự tuyên bố hoàn thành nếu thiếu bằng chứng.

---

# XX. BÀN GIAO

Cập nhật:
- README.md.
- GDD.md.
- PROJECT_MASTER_CONTEXT.md nếu có quyết định thiết kế mới đã được thống nhất; không tự thay đổi các nguyên tắc cốt lõi.
- IMPLEMENTATION_PROGRESS.md.
- HANDOFF.md.

Báo cáo:
1. Branch và commit.
2. Các module đã thêm.
3. Database migration.
4. Gameplay đã hoạt động.
5. Kết quả automated tests.
6. Kết quả browser QA.
7. Lỗi và giới hạn còn lại.
8. Khả năng chuyển sang Phase 4.

Hãy kiểm tra repository thực tế trước, nghiệm thu Phase 2 rồi triển khai Phase 3 trực tiếp trên codebase hiện có.

Không dừng lại ở việc lập kế hoạch.

Không tạo project mới.

Không làm Phase 4.

Mục tiêu cuối cùng: người chơi có thể trồng cây, thu hoạch, đem nông sản ra chợ bán, nhận Đồng Làng, mua hạt giống và tiếp tục phát triển nông trại.
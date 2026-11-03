# MASTER PROMPT — NÔNG TRẠI LÀNG VIỆT
## PHASE 1: FOUNDATION, FARM OWNERSHIP & 2D GAME ENGINE

### VAI TRÒ

Bạn là một nhóm phát triển game chuyên nghiệp gồm:
- Senior Game Architect
- Senior JavaScript / Node.js Developer
- Multiplayer Engineer
- Database Engineer
- 2D Game Developer
- UI/UX Game Designer
- QA Engineer

Nhiệm vụ là trực tiếp xây dựng Phase 1 của game thương mại "NÔNG TRẠI LÀNG VIỆT" trong workspace hiện tại.

Không chỉ viết tài liệu, mockup hoặc pseudo-code.

Phải triển khai code hoạt động, kiểm thử và báo cáo kết quả.

---

# I. BỐI CẢNH DỰ ÁN

NÔNG TRẠI LÀNG VIỆT là game nông trại 2D top-down lấy bối cảnh làng quê Việt Nam.

Mỗi tài khoản sở hữu một nông trại riêng.

Gameplay tương lai bao gồm:
- Trồng lúa và rau theo mùa vụ.
- Hệ sinh thái Vườn – Ao – Chuồng.
- Ao cá, chăn nuôi.
- Chợ phiên NPC.
- Chế biến nông sản.
- Xây dựng và trang trí.
- Ghé thăm nông trại bạn bè.
- Ngày đêm, thời tiết và bốn mùa.
- NPC có lịch sinh hoạt và câu chuyện.

Cây trồng phải tiếp tục phát triển theo thời gian thực khi người chơi offline.

Phiên bản đầu tiên phát hành trên web.

Game có định hướng thương mại, bán quyền truy cập một lần, nhưng Phase 1 KHÔNG triển khai thanh toán.

## Công nghệ bắt buộc

Frontend:
- HTML5.
- CSS3.
- Vanilla JavaScript ES Modules.
- Canvas 2D.

Backend:
- Node.js.
- Express.
- Socket.IO.

Database:
- SQLite.
- better-sqlite3.

Không tự ý chuyển sang React, Vue, Phaser, Unity, Godot hoặc một engine khác.

Có thể dùng thư viện nhỏ nếu có lý do kỹ thuật rõ ràng.

## Quan hệ với dự án SÂN MÂY

Tôi đã có một game khác tên SÂN MÂY với công nghệ tương tự.

NÔNG TRẠI LÀNG VIỆT phải là dự án độc lập.

Nếu source SÂN MÂY có sẵn trong workspace, hãy phân tích các module có thể tái sử dụng như:
- Canvas renderer.
- SceneManager.
- Camera.
- Collision.
- Sprite animation.
- Input handling.
- Socket.IO infrastructure.
- SQLite infrastructure.
- AudioManager.

Chỉ tái sử dụng code khi thực sự phù hợp và có quyền sử dụng.

Không chỉnh sửa hoặc phá hỏng dự án SÂN MÂY.

Nếu không có source SÂN MÂY, hãy triển khai độc lập. Không giả vờ đã đọc source không tồn tại.

---

# II. MỤC TIÊU PHASE 1

Sau khi hoàn thành, người chơi phải có thể:

1. Mở website.
2. Đăng ký hoặc đăng nhập.
3. Tạo nông trại cá nhân lần đầu.
4. Vào bản đồ nông trại.
5. Điều khiển nhân vật đi lại.
6. Quan sát bản đồ bằng camera.
7. Tương tác với các vật thể.
8. Nhìn thấy thông tin nông trại.
9. Thoát game.
10. Đăng nhập lại và tiếp tục đúng nông trại.

Hai tài khoản khác nhau phải có hai nông trại độc lập.

Dữ liệu phải tồn tại sau khi server restart.

Phase 1 chưa cần trồng cây hoặc thu hoạch thực tế.

---

# III. QUY TRÌNH BẮT BUỘC TRƯỚC KHI CODE

Bước 1: Kiểm tra toàn bộ workspace.

Bước 2: Đọc các tài liệu hiện có:
- README.md.
- GDD.md nếu có.
- IMPLEMENTATION_PROGRESS.md nếu có.
- HANDOFF.md nếu có.
- package.json.

Bước 3: Xác định:
- Source hiện có.
- Module có thể tái sử dụng.
- Dependency.
- Rủi ro kỹ thuật.
- Các file cần tạo hoặc sửa.

Bước 4: Viết kế hoạch triển khai Phase 1 ngắn gọn.

Bước 5: Triển khai trực tiếp.

Không dừng lại sau khi lập kế hoạch.

Không tuyên bố hoàn thành nếu game chưa chạy được.

---

# IV. KIẾN TRÚC DỰ ÁN

Thiết kế module rõ ràng, tách biệt:

## Client

- Game bootstrap.
- Canvas renderer.
- Game loop.
- Scene manager.
- Tilemap renderer.
- Camera.
- Player controller.
- Input manager.
- Collision system.
- Interaction system.
- Animation manager.
- Network client.
- UI manager.
- Asset manager.

## Server

- Express application.
- Authentication service.
- Farm service.
- Player state service.
- World service.
- Socket.IO gateway.
- Room manager.
- Validation.
- Database repository.
- Migration runner.
- Logging and error handling.

## Shared

- Event contracts.
- Constants.
- Validation schemas.
- Game configuration.
- Object definitions.

Không bắt buộc dùng chính xác các tên file trên nếu cấu trúc tốt hơn.

Tránh một file Game.js hoặc server.js chứa toàn bộ logic.

---

# V. AUTHENTICATION

Xây dựng cơ chế tài khoản phù hợp game web có định hướng thương mại.

Yêu cầu:
- Đăng ký tài khoản.
- Đăng nhập.
- Đăng xuất.
- Session hợp lệ.
- Password hashing bằng thư viện an toàn.
- Cookie HttpOnly, Secure khi dùng HTTPS, SameSite phù hợp.
- Kiểm tra CSRF cho các thao tác dùng cookie.
- Rate limit đăng nhập.
- Không log mật khẩu hoặc session token.
- Không lưu mật khẩu dạng plaintext.
- Không dùng localStorage để lưu token xác thực nhạy cảm.

Thiết kế cơ chế khôi phục tài khoản phù hợp, nhưng không tạo tính năng gửi email giả nếu chưa có dịch vụ email.

Nếu chưa có hạ tầng email, ghi rõ giới hạn và chuẩn bị interface để tích hợp sau.

Mỗi user chỉ được tự động tạo một farm mặc định.

---

# VI. FARM OWNERSHIP

Thiết kế FarmManager.

Mỗi farm có:
- Farm ID.
- Owner ID.
- Farm name.
- Map ID.
- Created at.
- Updated at.
- Farm configuration.
- Visibility.
- Version.

Yêu cầu:
- Tạo farm khi tài khoản mới bắt đầu.
- Không tạo farm trùng khi refresh.
- Chỉ chủ farm có quyền chỉnh sửa.
- Không thể giả mạo owner ID.
- Không thể lấy dữ liệu farm riêng của người khác bằng cách đổi ID trong request.
- Có thể mở rộng farm permissions trong tương lai.

Tạo FarmRepository và API phù hợp.

Tất cả kiểm tra ownership phải thực hiện ở server.

---

# VII. CANVAS 2D ENGINE

Tạo game engine 2D top-down có khả năng mở rộng.

## Game loop

- Sử dụng requestAnimationFrame.
- Delta time.
- Giới hạn delta time bất thường.
- Tách update và render.
- Không gắn gameplay trực tiếp vào FPS.

## Camera

- Theo nhân vật.
- Giới hạn trong bản đồ.
- Chuyển động mượt.
- Xử lý resize.
- Không rung khi va chạm.

## Movement

- WASD.
- Arrow keys.
- Tốc độ nhất quán theo delta time.
- Chuẩn hóa di chuyển chéo.
- Idle animation.
- Walking animation.
- Hướng nhìn nhân vật.

## Collision

- Tile collision.
- Object collision.
- Không đi xuyên nhà, hàng rào hoặc cây.
- Không đi ra ngoài map.
- Không bị kẹt khi spawn.

## Renderer

- Tilemap.
- Object layers.
- Y-sorting phù hợp top-down.
- Sprite animation.
- Camera culling.
- Pixel-art rendering.
- Hỗ trợ device pixel ratio.
- Không làm mờ pixel art.

## Input

- Bàn phím.
- Chuột.
- Cấu trúc có thể mở rộng cảm ứng.
- Không điều khiển nhân vật khi đang nhập liệu trong form.

---

# VIII. STARTER FARM MAP

Tạo bản đồ nông trại đầu tiên mang phong cách làng quê Việt Nam.

Bản đồ phải có:
- Một căn nhà mái ngói.
- Sân gạch.
- Đường đất.
- Khu ruộng trống.
- Hàng rào tre.
- Cây chuối.
- Bụi tre.
- Một vài cây bóng mát.
- Một khu đất dự kiến làm ao.
- Một khu đất dự kiến làm chuồng.
- Bảng thông tin nông trại.

Ưu tiên tilemap có nhiều lớp.

Các vật thể phải có collision hợp lý.

Không chỉ dùng một ảnh nền toàn màn hình.

Nếu chưa có bộ sprite hoàn chỉnh:
- Tạo asset placeholder có chất lượng thống nhất.
- Giữ tỷ lệ tile nhất quán.
- Không dùng hình chữ nhật đơn sắc làm sản phẩm cuối cùng.
- Không lấy asset có bản quyền không rõ ràng.
- Ghi rõ asset nào là tạm thời.

Thiết kế map để sau này có thể đặt cây trồng, ao, chuồng và công trình.

---

# IX. INTERACTION SYSTEM

Tạo hệ thống tương tác có thể tái sử dụng.

Người chơi đến gần vật thể sẽ xuất hiện hướng dẫn:

"Nhấn E để tương tác"

Hỗ trợ:
- Kiểm tra khoảng cách.
- Object ID.
- Interaction type.
- Interaction state.
- UI feedback.
- Animation feedback.
- Server validation khi thay đổi trạng thái lưu trữ.

Triển khai ít nhất ba tương tác thực:

1. Bảng thông tin nông trại:
   Hiển thị tên farm, chủ sở hữu và ngày tạo.

2. Cửa nhà:
   Mở một panel hoặc chuyển sang interior scene đơn giản có thể quay lại.

3. Một vật thể thử nghiệm:
   Ví dụ bật/tắt đèn sân hoặc mở/đóng cổng.

Trạng thái vật thể thứ ba phải lưu được vào SQLite.

Không tạo nút tương tác không có chức năng.

---

# X. DATABASE

Sử dụng SQLite và better-sqlite3.

Thiết kế migration cho:
- users.
- auth_sessions.
- farms.
- farm_objects.
- player_states.
- farm_permissions.
- schema_migrations.

Yêu cầu:
- Primary keys.
- Foreign keys.
- Unique constraints.
- Indexes.
- Transactions.
- Prepared statements.
- Migration versioning.
- Database backup strategy.

Không ghi player position mỗi frame.

Chỉ lưu khi có thay đổi quan trọng hoặc theo chu kỳ phù hợp.

Server restart phải khôi phục trạng thái.

Chuẩn bị kiến trúc để sau này thêm:
- crop_plots.
- inventory.
- animals.
- ponds.
- buildings.
- economy_transactions.
- crafting_jobs.
- npc_progress.

Chưa cần tạo toàn bộ bảng tương lai nếu chưa dùng.

---

# XI. THỜI GIAN SERVER VÀ OFFLINE PROGRESSION

Phase 1 chưa triển khai hệ thống cây trồng hoàn chỉnh.

Tuy nhiên phải chuẩn bị một TimeService dùng chung.

Yêu cầu:
- UTC timestamps.
- Server authoritative time.
- Không tin client clock.
- Có thể tính elapsed time.
- Có kiểm tra timestamp bất thường.
- Có test cho tính toán thời gian.
- Không cần chạy timer cho từng cây offline.

Thiết kế interface để Phase 2 có thể tính tăng trưởng cây dựa trên thời gian đã trôi qua.

Không tạo fake crop system trong Phase 1.

---

# XII. SOCKET.IO FOUNDATION

Tạo Socket.IO infrastructure.

Yêu cầu:
- Xác thực socket connection.
- Join farm room.
- Leave farm room.
- Kiểm tra quyền trước khi join.
- Farm state snapshot.
- Player presence.
- Reconnect.
- Disconnect cleanup.
- Rate limiting.
- Payload validation.
- Server acknowledgement.
- Không tin farm ID hoặc user ID do client tự khai báo.

Trong Phase 1, chỉ cần hoàn thiện room infrastructure và các tương tác cơ bản.

Chưa cần xây multiplayer xã hội đầy đủ.

Không cho người chơi khác sửa dữ liệu farm khi chưa được cấp quyền.

---

# XIII. UI/UX

Thiết kế giao diện đồng nhất với phong cách game nông trại làng quê Việt Nam.

## Màn hình bắt đầu

- Logo game.
- Chơi game.
- Đăng nhập / đăng ký.
- Cài đặt cơ bản.

## Màn hình tạo farm

- Nhập tên nông trại.
- Xem giới thiệu ngắn.
- Xác nhận tạo farm.

## HUD trong game

- Tên farm.
- Tên người chơi.
- Nút menu.
- Trạng thái kết nối.
- Hướng dẫn điều khiển.
- Interaction prompt.

Không hiển thị tiền, inventory hoặc thanh kinh nghiệm giả nếu hệ thống đó chưa triển khai.

## Chất lượng giao diện

- Font hỗ trợ tiếng Việt.
- Màu sắc ấm áp.
- Panel dễ đọc.
- Animation vừa phải.
- Responsive.
- Không che Canvas quá nhiều.
- Có loading và error state.

---

# XIV. SECURITY

Kiểm tra:
- Authentication.
- Authorization.
- Input validation.
- SQL injection.
- XSS.
- CSRF.
- Session handling.
- Rate limiting.
- Socket event spoofing.
- Farm ID enumeration.
- Unauthorized farm mutation.

Không để client tự sửa owner ID.

Không tin dữ liệu người dùng gửi lên.

Không public database hoặc environment secrets.

---

# XV. TESTING

Tạo automated tests cho:

## Authentication
- Đăng ký.
- Đăng nhập.
- Đăng xuất.
- Session hết hạn.
- Truy cập không hợp lệ.

## Farm ownership
- Tạo farm.
- Không tạo trùng.
- Hai tài khoản có farm riêng.
- Không truy cập trái phép.
- Không chỉnh sửa farm của người khác.

## Database
- Migration.
- Save/load.
- Transaction.
- Restart persistence.

## Gameplay
- Player movement.
- Collision.
- Interaction range.
- Object state persistence.
- Camera boundaries.

## Socket.IO
- Authentication.
- Join/leave room.
- Reconnect.
- Unauthorized join.
- Invalid payload.
- State snapshot.

## Browser tests
Kiểm thử bằng trình duyệt thật khi môi trường cho phép.

Sử dụng hai browser context độc lập để xác minh:
- Hai tài khoản.
- Hai nông trại.
- Session độc lập.
- Không rò rỉ dữ liệu.
- Reload và reconnect.

Nếu môi trường không cho phép browser testing, báo cáo rõ phần chưa kiểm chứng. Không tự tuyên bố đã test.

---

# XVI. DELIVERABLES

Sau Phase 1 phải có:

1. Source code chạy được.
2. package.json và các scripts phù hợp.
3. Database migration.
4. Starter farm map.
5. Canvas 2D engine.
6. Authentication.
7. Farm ownership.
8. Interaction system.
9. Socket.IO foundation.
10. Automated tests.
11. README.md.
12. GDD.md.
13. IMPLEMENTATION_PROGRESS.md.
14. HANDOFF.md.
15. Danh sách giới hạn và rủi ro còn lại.

README phải hướng dẫn:
- Cài dependencies.
- Cấu hình environment.
- Chạy development.
- Chạy production.
- Chạy tests.
- Backup database.

---

# XVII. QUY TRÌNH THỰC THI

Chia thành bảy bước:

P1.1: Project setup.

P1.2: Authentication + farm ownership.

P1.3: Canvas engine.

P1.4: Starter map.

P1.5: Interaction system.

P1.6: Persistence + Socket.IO.

P1.7: UI polish + testing.

Sau mỗi bước:
- Chạy ứng dụng.
- Kiểm tra lỗi.
- Chạy tests liên quan.
- Báo cáo file đã thay đổi.
- Cập nhật tiến độ.
- Sửa lỗi trước khi tiếp tục.

Không được bỏ qua một bước chỉ vì đã tạo được giao diện.

---

# XVIII. DEFINITION OF DONE

Phase 1 chỉ được đánh dấu hoàn thành khi:

- Người chơi có thể tạo tài khoản.
- Mỗi tài khoản có farm riêng.
- Có bản đồ top-down thực sự.
- Nhân vật đi lại và va chạm chính xác.
- Có ba tương tác hoạt động.
- Trạng thái vật thể được lưu.
- Reload vẫn giữ farm.
- Restart server vẫn giữ dữ liệu.
- Socket.IO room hoạt động.
- Không có lỗi ownership nghiêm trọng.
- Các bài test bắt buộc pass.
- Có tài liệu bàn giao.

Nếu một mục chưa hoàn thành, phải ghi rõ.

Không được ghi "100% complete" nếu chưa có bằng chứng kiểm thử.

---

# XIX. PHẠM VI CẤM TRONG PHASE 1

KHÔNG triển khai:
- Hệ thống trồng cây đầy đủ.
- Thu hoạch.
- Inventory hoàn chỉnh.
- Tiền trong game.
- Chợ phiên.
- Chăn nuôi.
- Ao cá.
- Chế biến.
- Bốn mùa đầy đủ.
- Thanh toán.
- Giao dịch P2P.
- Multiplayer xã hội nâng cao.

Những tính năng này thuộc các phase sau.

Không thêm chức năng ngoài phạm vi nếu làm chậm hoặc phá vỡ nền tảng.

---

# XX. YÊU CẦU CUỐI CÙNG

Hãy bắt đầu bằng cách kiểm tra workspace và các tài liệu hiện có.

Sau đó trực tiếp triển khai Phase 1.

Ưu tiên:
1. Kiến trúc sạch.
2. Gameplay hoạt động thật.
3. Dữ liệu an toàn.
4. Khả năng mở rộng.
5. Đồ họa có bản sắc Việt Nam.
6. Test và tài liệu đầy đủ.

Không chỉ trả lời bằng hướng dẫn.

Không chỉ tạo mockup.

Không giả định đã hoàn thành nếu chưa chạy được.

Mục tiêu cuối cùng là một bản game nền tảng có thể mở trình duyệt, đăng nhập, đi lại trong nông trại riêng, tương tác và lưu tiến trình ổn định.
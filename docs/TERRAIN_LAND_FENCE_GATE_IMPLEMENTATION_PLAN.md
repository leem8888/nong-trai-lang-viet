# NÔNG TRẠI LÀNG VIỆT — KẾ HOẠCH NÂNG CẤP ĐỊA HÌNH, ĐẤT VÀ HÀNG RÀO/CỔNG

**Dành cho AI coding agent** · Baseline tham chiếu: `702193372e551d8f7ed4619702b8391d18568219` trên `main` (phải kiểm tra HEAD thực tế trước khi sửa).

## 0. Mục tiêu và phạm vi

Nâng cấp ba hệ thống: **(A) Địa hình và luống đất**, **(B) Hiển thị quyền sở hữu/mở rộng đất**, **(C) Hàng rào và cổng**. Phong cách isometric 2.5D, hoạt hình làng quê Việt Nam, đồng bộ sprite nhà/cây/NPC hiện có. Đây là **visual + interaction polish**, không phải viết lại game. Ưu tiên chất lượng ảnh thực tế, tính đúng đắn của tọa độ và trải nghiệm người chơi.

**Giữ nguyên:** đăng nhập/đăng ký, tài khoản, ví Đồng Làng và ledger, SQLite, canh tác, VAC, chế biến, xây dựng, NPC/nhiệm vụ, thời tiết/mùa, multiplayer, phân quyền farm, menu ngữ cảnh và giữ-kéo nhiều ô. Không reset database, không đổi logic sở hữu chỉ để phục vụ hình ảnh. Không chỉnh màn hình đăng nhập hoặc làm lại sprite nhà/NPC đã đạt yêu cầu trừ khi cần sửa lỗi hiển thị cụ thể.

## 1. CP0 — Audit và baseline (bắt buộc trước khi code)

1. Kiểm tra `git status`, HEAD, commit baseline, các file renderer/isometric/camera, dữ liệu farm/plot/expansion, collision/pathfinding, interaction hit-testing, sprite manifest/atlas, scene farm và market.
2. Truy dấu **nguồn dữ liệu thật** quyết định đất sở hữu, đất chưa mua, ô canh tác, vùng mở rộng; ghi lại cấu trúc/tọa độ và ràng buộc backend. Không suy diễn đất sở hữu chỉ bằng màu tile.
3. Xác định hệ tọa độ world/grid/screen, anchor sprite, draw order/Y-sort, camera zoom, các vùng tương tác. Ghi rủi ro lệch hitbox sau thay asset.
4. Chụp baseline farm và market tại 1920×1080, 1366×768, 390×844; cả đất trống, đất đã cuốc, đất có cây và trạng thái có đất chưa mua (tạo fixture kiểm thử nếu cần). Ghi lại zoom, thời tiết, giờ, seed dữ liệu để ảnh sau có thể đối chiếu.
5. Viết `TERRAIN_LAND_FENCE_BASELINE.md`: sơ đồ hệ thống hiện tại, file liên quan, vấn đề, ảnh tham chiếu, checklist rủi ro. Nếu không có cách tạo trạng thái đất chưa mua, báo blocker trước khi triển khai.

## 2. CP1 — Địa hình tự nhiên (Terrain)

### 2.1 Ground tiles và chuyển tiếp
- Thiết kế/tích hợp tileset **nguyên bản, có quyền sử dụng hợp lệ** cho cỏ thường, cỏ rậm, cỏ thưa, đất khô, đất ẩm, đường đất, sân gạch, mép đường, đá/hoa/bụi cỏ.
- Mặt đất **không còn là các mảng hình thoi đồng màu/lưới kẻ lộ rõ**. Tạo biến thể tile có kiểm soát bằng seed ổn định, tránh nhấp nháy khi render và tránh ngẫu nhiên thay đổi sau reload.
- Chuyển tiếp cỏ ↔ đường đất ↔ sân gạch tự nhiên, không tạo góc vuông hoặc đường kết thúc đột ngột; sử dụng autotiling/neighbor masks nếu phù hợp.
- Lưới thao tác chỉ xuất hiện khi chọn ô, cuốc/gieo/tưới/gặt, xây dựng hoặc bật chế độ xem ranh giới; không vẽ grid dày toàn thời gian.
- Đảm bảo đường đi vẫn bám theo hệ tọa độ và navigation hiện tại, không chỉ là lớp vẽ gây hiểu lầm.

### 2.2 Luống đất trồng
Mỗi trạng thái phải có hình ảnh dễ nhận ra ở zoom chơi bình thường, **không chỉ đổi màu nền**:
- Đất cỏ/chưa cuốc: cỏ/đất tự nhiên.
- Đã cuốc: luống nổi, rãnh và kết cấu đất.
- Đã gieo: hạt/mầm phù hợp giai đoạn tăng trưởng.
- Đã tưới: đất sẫm, ánh ẩm nhẹ (không dùng màu đơn độc làm tín hiệu).
- Đang lớn/chín: sprite cây và giai đoạn rõ, tránh che mất hitbox tương tác.
- Không hợp lệ/không thể thao tác: phản hồi ngắn, dễ hiểu.

Các luống liền nhau phải nối thành cụm tự nhiên, không giống các hình thoi độc lập hoặc bảng tính. Giữ trạng thái cây và thời gian trưởng thành từ backend; chỉ thay cách render.

## 3. CP2 — Phân biệt đất đã mua/chưa mua (Land Ownership)

1. Phân biệt tối thiểu: **đất sở hữu chưa cuốc**, **đất đã canh tác**, **đất chưa sở hữu nhưng có thể mua**, **đất ngoài phạm vi không thể mua** (nếu game có trạng thái này).
2. Dùng kết hợp texture, mép ranh giới/cọc mốc, biểu tượng nhỏ khi hover/chọn, trạng thái tương tác; **không dùng chỉ một màu** hoặc phủ xám kín toàn bộ bản đồ.
3. Đất chưa mua vẫn có cảnh quan tự nhiên, nhưng ranh giới phải đọc được ở zoom mặc định. Khi nhấn vào vùng có thể mua: mở menu ngữ cảnh hiển thị diện tích/giá/điều kiện và hành động mua nếu backend cho phép. Không hiển thị nút mua ở vùng không hợp lệ.
4. Khi mở rộng thành công: cập nhật ngay ground tiles, ranh giới, vị trí hàng rào/cổng, collision và vùng thao tác; đồng bộ sau reload và qua kết nối multiplayer. Nếu giao dịch thất bại, không đổi giao diện giả thành đã sở hữu.
5. Phân biệt rõ **quyền sở hữu farm** và **quyền của người đang thăm**: visitor chỉ xem, không mua đất hay canh tác. Server luôn xác thực quyền, tiền và giao dịch; không tin dữ liệu từ client.
6. Nếu game đang có mô hình mua đất theo ô/vùng khác với giả định trên, tuân thủ mô hình thật; ghi rõ cách ánh xạ trong báo cáo, không tự thêm schema hoặc tính năng mua đất mới.

## 4. CP3 — Hàng rào và cổng (Fence/Gate)

### 4.1 Bộ sprite và ghép nối
- Tạo sprite hàng rào tre/gỗ có **cột đứng, thanh ngang, chiều cao, bóng đổ**, phù hợp isometric; đủ các biến thể: đoạn thẳng hai hướng, góc trong/ngoài, đầu mút, giao nối khi cần, trụ cổng.
- Ghép nối tự động theo ranh giới sở hữu thực tế; không để hàng rào nằm bẹp trên đất, xuyên nhà, cắt ruộng, đứt đoạn hoặc chồng góc.
- Hàng rào là kết cấu thị giác rõ nhưng không che quá nhiều farm; render đúng Y-sort/occlusion.

### 4.2 Cổng đúng chức năng
- Thiết kế cổng làng Việt phù hợp tỷ lệ nhân vật và hàng rào, có trụ/cánh hoặc mái hợp lý; **nối liền hai đầu hàng rào**, nằm trên đường vào farm, không đứng lẻ giữa sân.
- Lối qua cổng phải đủ rộng, có collider và navigation chính xác; không đi xuyên đoạn rào kín, không bị kẹt ở cổng.
- Chọn vị trí cổng từ quy tắc có thể kiểm chứng: đường tiếp cận + ranh giới + vùng trống + khả năng đi lại; tránh hard-code vị trí sai khi farm mở rộng. Nếu không thể tự chọn an toàn, dùng vị trí hợp lệ cố định có kiểm tra và nêu hạn chế.
- Khi mở rộng đất, tính lại các đoạn rào và vị trí cổng hợp lệ, không tạo cổng phụ bất ngờ; không chặn các công trình đã có.

### 4.3 Logic so với trang trí
- Phân biệt hàng rào ranh giới tự động và hàng rào trang trí do người chơi đặt, nếu cả hai tồn tại. Không tự xóa/sửa vật trang trí đã sở hữu khi tính lại ranh giới.
- Nếu hiện tại hàng rào chỉ là cảnh quan và game không giới hạn di chuyển qua biên farm, không tự thay đổi quy tắc di chuyển mà chưa đánh giá tương thích; ghi rõ lựa chọn và test.

## 5. CP4 — Tích hợp và tối ưu

- Chỉ thay lớp hiển thị/interaction mapping cần thiết; không thay đổi tọa độ logic trên server nếu không có lý do bắt buộc.
- Cập nhật sprite atlas/manifest, nguồn gốc asset và license; preload/lazy-load hợp lý, fallback có chủ đích nếu asset lỗi.
- Không tạo texture mới mỗi frame; cache terrain chunks, autotile masks, shadow layers khi có thể; invalidation khi ô đất/mở rộng thay đổi.
- Bảo đảm hit-testing đúng ở zoom/pan khác nhau, trên mouse/touch; drag-to-act không kích hoạt khi đang kéo camera.
- Kiểm tra cổng, hàng rào, cây và công trình trong thứ tự vẽ; tránh nhân vật bị che sai hoặc đứng lên mái nhà.
- Duy trì hiệu năng mục tiêu ~60 FPS trên máy desktop kiểm thử và không thoái hóa đáng kể so với baseline; đo và báo số liệu thật thay vì tự tuyên bố.

## 6. CP5 — Kiểm thử và nghiệm thu

### 6.1 Kiểm thử chức năng
- Trạng thái đất: chưa cuốc → cuốc → gieo → tưới → lớn → chín → thu hoạch; offline growth/reload.
- Giữ-kéo qua nhiều ô: ô hợp lệ/không hợp lệ, thiếu hạt/tiền, lặp request, mạng chậm; backend vẫn authoritative.
- Mua/mở rộng đất: thành công, không đủ tiền, vùng không hợp lệ, reload, visitor không có quyền, đồng bộ hai client.
- Hàng rào/cổng: farm mặc định, farm mở rộng, đường đi qua cổng, va chạm với rào, NPC/pathfinding, cạnh/góc bản đồ.
- Camera/hitbox: desktop, mobile, zoom 100% và 125%, pan, touch.
- Regression: auth, economy/ledger, VAC, crafting, building, quest, weather, multiplayer, market. Không sửa một lỗi visual bằng cách tắt chức năng.

### 6.2 Visual QA bắt buộc
Chụp **before/after cùng scene, dữ liệu, camera, thời tiết, viewport**:
1. Farm 1920×1080 và 1366×768: nhìn tổng thể, đất sở hữu/chưa mua.
2. Farm 390×844: HUD không che đất/cổng, thao tác chạm được.
3. Cận cảnh 6 trạng thái đất và 2–3 luống nối nhau.
4. Hàng rào hai hướng, góc nối, cổng có nhân vật đứng cạnh để so tỷ lệ.
5. Trước và sau khi mua/mở rộng đất; rào tự cập nhật.
6. Ban ngày, ban đêm, trời mưa (không làm mất độ đọc trạng thái đất).
7. Chợ làng: bảo đảm không bị ảnh hưởng ngoài phạm vi.

**Kiểm tra thủ công bằng mắt:** mặt đất không còn giống bàn cờ; ranh giới dễ thấy; cổng là lối vào thật; hàng rào có chiều cao; ruộng có luống và rãnh; không có vật thể nổi/lún, đường đi đứt, tile lặp quá lộ.

### 6.3 Báo cáo
Tạo `TERRAIN_LAND_FENCE_QA_REPORT.md` gồm: commit baseline và HEAD, ảnh đối chiếu, số liệu FPS/bộ nhớ, các bài test và lệnh chạy, danh sách lỗi phát hiện/sửa, các mục chưa đạt, đánh giá `COMPLETE` hoặc `INCOMPLETE` trung thực. Không coi screenshot tự động là bằng chứng mọi tương tác đều đúng.

## 7. Definition of Done (điều kiện hoàn thành)

- [ ] Nền cỏ/đường/sân có texture và chuyển tiếp tự nhiên, không lộ grid dày toàn thời gian.
- [ ] Các trạng thái đất trồng khác nhau rõ bằng hình dạng/kết cấu/sprite, không chỉ màu.
- [ ] Đất đã mua và chưa mua phân biệt ngay ở zoom mặc định; tương tác mua đất đúng backend.
- [ ] Hàng rào có chiều cao, sprite nối liền, không chồng chéo và tự cập nhật khi mở rộng.
- [ ] Cổng cân đối, gắn với rào và đường đi, nhân vật đi qua được theo luật game.
- [ ] Không phá farm layout, cây/công trình, quyền visitor, economy và dữ liệu hiện có.
- [ ] Desktop/mobile/browser zoom và multiplayer regression đạt; không có lỗi console nghiêm trọng.
- [ ] Có ảnh before/after và báo cáo QA có thể kiểm chứng.
- [ ] Nếu thiếu bất kỳ mục bắt buộc, đánh dấu `INCOMPLETE`, nêu blocker và cách xử lý.

## 8. Quy trình bàn giao cho AI

1. Audit → baseline ảnh/test → ghi `TERRAIN_LAND_FENCE_BASELINE.md`.
2. Triển khai CP1 → CP2 → CP3, kiểm tra hình ảnh sau từng checkpoint; sửa đến khi đạt trước khi đi tiếp.
3. CP4 tối ưu và tích hợp; CP5 browser QA, gameplay regression và visual review.
4. Cập nhật tài liệu, manifest asset, QA report và danh sách file thay đổi.
5. Commit khi đạt yêu cầu.  Không reset dữ liệu.

### Prompt ngắn để khởi chạy

> Hãy đọc toàn bộ `TERRAIN_LAND_FENCE_GATE_IMPLEMENTATION_PLAN.md` tại root repository. Audit HEAD hiện tại và triển khai CP0–CP5. Ưu tiên sửa tận gốc địa hình, các trạng thái ô đất, ranh giới đất đã mua/chưa mua và hàng rào/cổng isometric; không thêm cảnh quan chỉ để che lỗi. Giữ nguyên gameplay và dữ liệu. Bắt buộc chụp ảnh trước/sau, kiểm thử tương tác thực tế, regression, cập nhật báo cáo; chỉ đánh dấu COMPLETE khi đạt Definition of Done. Commit ,  push

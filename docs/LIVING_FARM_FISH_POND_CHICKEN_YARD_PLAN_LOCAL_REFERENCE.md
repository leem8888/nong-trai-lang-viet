# NÔNG TRẠI LÀNG VIỆT — LIVING FARM: AO CÁ & SÂN THẢ GÀ

**Loại công việc:** Kế hoạch triển khai cho Codex (code + assets + browser QA)  
**Mục tiêu:** Ao cá lớn hơn và có cá bơi sống động; chuồng gà giữ sprite đẹp hiện tại nhưng có sân thả gà để gà tự đi lại, ăn, nghỉ, đẻ trứng. Tương tác diễn ra ngay trên bản đồ.  
**Phạm vi:** Client Canvas 2D/isometric, tài nguyên hình ảnh, tương tác, đồng bộ trạng thái VAC hiện có; chỉ thay backend khi thực sự cần.  
**Baseline:** Luôn kiểm tra HEAD mới nhất tại thời điểm bắt đầu; KHÔNG giả định commit cũ là HEAD.

## 0. Nguyên tắc bắt buộc

1. **Giữ lại hình ảnh ao và chuồng gà hiện tại** (người dùng đã hài lòng). Nâng cấp bằng mở rộng bố cục ao, thêm phần nước/bờ đồng bộ và sân thả gà; không thay toàn bộ sprite bằng hình khối thô.
2. **Ao cá phải lớn hơn đáng kể về diện tích nhìn thấy** so với hiện tại, đủ để thấy nhiều con cá bơi. Không chỉ zoom hoặc scale toàn bộ sprite làm mờ ảnh; ưu tiên mở rộng bằng tiles/sprite segments/asset độ phân giải phù hợp. Giữ phong cách 2.5D isometric, bờ, bóng, cây thủy sinh và chi tiết sẵn có.
3. **Sân thả gà nhỏ, liền kề chuồng**, có hàng rào thấp, cửa chuồng, cổng sân, máng ăn, máng nước, ít cỏ và vùng đi lại. Không lấn ô canh tác, đất chưa mua, lối đi, công trình khác hoặc đường thoát của nhân vật.
4. **Trạng thái thực từ server** quyết định số lượng cá/gà, thức ăn, tăng trưởng, trứng và thu hoạch. Animation không được làm sai dữ liệu.
5. Không reset database, không thay đổi kinh tế, nhiệm vụ, quyền sở hữu hoặc cơ chế offline growth. Không tạo tiền/vật phẩm bằng hiệu ứng client.
6. Không phá renderer/camera, tương tác ngữ cảnh, auto-walk, drag-to-act, pathfinding, multiplayer hoặc mobile.
7. **Phối hợp với đợt Terrain/Land/Fence/Gate đang triển khai**: bắt đầu từ HEAD mới nhất sau khi merge/cherry-pick có kiểm soát; không ghi đè các file renderer, fence, terrain đang bị sửa song song. Sân gà dùng chung ngôn ngữ mỹ thuật hàng rào nhưng có topology riêng.

## CP0 — Khảo sát & baseline

- Đọc README, báo cáo QA gần nhất, các module VAC/fish/chicken, renderer isometric, scene placement, camera, asset manifest, hit-test, interaction panels, collision/pathfinding, DB/API/socket.
- Xác định dữ liệu thực tế: số lượng vật nuôi có lưu riêng từng con hay chỉ theo đàn/lô; trạng thái đói, chu kỳ tăng trưởng, số trứng; quyền của chủ và khách.
- Chụp screenshot baseline ao cá và chuồng gà ở desktop 1366×768, 1920×1080, mobile 390×844; ghi camera zoom và tọa độ để so sánh.
- Kiểm tra footprint của ao/chuồng, các ô xung quanh, collision và đường đi. Đề xuất layout bằng sơ đồ ô trước khi code. Không mặc định có sẵn đất trống.
- Nếu dữ liệu chỉ lưu số lượng tổng, chọn đại diện trực quan tương ứng, có quy tắc rõ ràng (ví dụ 1–N cá hiển thị theo số lượng thực, giới hạn sprite render vì FPS và thông báo khi biểu diễn rút gọn). Không bịa số lượng chính xác.

## CP1 — Mở rộng ao cá và tạo cảm giác ao sống

### Hình ảnh
- Mở rộng **diện tích mặt nước thực tế trên bản đồ** theo bố cục hợp lệ; mục tiêu thị giác: ao là điểm nhấn đủ rộng để cá nhìn thấy rõ. Kích thước cụ thể xác định qua screenshot và footprint, không hardcode tỉ lệ nếu gây chồng lấn.
- Tạo bộ bờ ao isometric có góc nối, cạnh, mép nước, bóng đổ, chiều sâu, vùng nước nông/sâu; tận dụng asset hiện tại. Thêm gợn sóng, bóng cá, lá sen/bèo ở mức vừa phải.
- Không để mép ao cắt đường, hàng rào, sân nhà; không đè lên đất sở hữu/chưa mua hoặc công trình. Nếu thiếu không gian, điều chỉnh layout an toàn, có kiểm tra vị trí hợp lệ và không đổi tọa độ gameplay tùy tiện.
- Tách **footprint logic** (vùng va chạm/vùng tương tác) khỏi **visual bounds** (sprite, bóng, sóng). Cập nhật hitbox/camera/occlusion/pathfinding phù hợp.

### Cá bơi
- Ao trống: không có cá. Có cá: hiện cá con/cá trưởng thành đúng giai đoạn; cá bơi quanh ao với hướng và tốc độ khác nhau, thỉnh thoảng lặn/hiện, không bơi xuyên bờ.
- Cá di chuyển bằng client-side deterministic/local animation; server vẫn quản lý số lượng, trạng thái và tiến độ. Không spam socket gửi từng frame.
- Khi cho ăn: hiển thị thức ăn rơi vào vùng nước, gợn sóng, cá bơi về điểm ăn, đớp mồi; chỉ phản hồi hoàn tất sau xác nhận server. Nếu request thất bại, không thể hiện trạng thái đã cho ăn.
- Khi thu hoạch: hiệu ứng cá được bắt lên/đưa vào túi, số lượng cập nhật sau server success; nếu lỗi hiển thị thông báo rõ.
- Khi đói/đủ tuổi thu hoạch: icon nhỏ hoặc dấu hiệu tinh tế, không dùng popup che màn hình.

## CP2 — Sân thả gà quanh chuồng

### Layout
- **Giữ nguyên hình chuồng gà hiện tại**; bổ sung sân nhỏ liền cửa chuồng, không dựng chuồng mới thay thế.
- Sân có đất/cỏ xen kẽ, hàng rào thấp 2 hướng isometric, các góc nối, cổng nhỏ, máng ăn và máng nước. Bóng đổ và thứ tự vẽ đúng.
- Kích thước sân dựa trên số ô trống hợp lệ, đủ cho gà di chuyển và người chơi tương tác. Không đè đất trồng hoặc đất chưa mở khóa. Nếu không có vị trí hợp lệ, phải có fallback an toàn và báo cáo blocker, không lén di dời công trình hoặc xóa cây trồng.
- Hàng rào sân gà là vật thể riêng, **không thay thế hàng rào ranh giới sở hữu**. Đảm bảo cổng sân khớp lối đi và không khiến người chơi kẹt.

### Hành vi gà
- Không có gà: sân trống. Có gà: hiển thị gà con/trưởng thành theo dữ liệu, đi dạo ngẫu nhiên trong sân, đứng nghỉ, mổ đất, uống nước, ra/vào chuồng.
- Khi cho ăn: gà đi tới máng, có chuyển động mổ thóc và hiệu ứng nhỏ; kết quả backend là nguồn sự thật.
- Khi có trứng: dấu hiệu/ổ trứng chỉ xuất hiện nếu backend cho biết có trứng sẵn sàng; thu trứng có hiệu ứng vào túi sau khi request thành công.
- Gà không đi xuyên rào, chuồng, máng; không chạy ra khỏi sân hoặc xuyên qua người chơi. Sử dụng local steering/path trong vùng hợp lệ, giới hạn số lượng entity hoạt hình nếu đàn đông.
- Hỗ trợ trạng thái đói/ngủ/trưởng thành nếu mô hình dữ liệu có; nếu chưa có thì không giả lập cơ chế gameplay mới một cách âm thầm.

## CP3 — Tương tác trực tiếp, hạn chế popup

- Nhấn/chạm ao hoặc chuồng: nhân vật tự đi tới vị trí tương tác hợp lệ theo cơ chế hiện tại, sau đó mở **menu ngữ cảnh nhỏ** cạnh đối tượng.
- Ao: Thả cá / Cho ăn / Thu hoạch / Thông tin; chuồng: Nuôi gà / Cho ăn / Thu trứng / Thông tin. Chỉ hiện thao tác hợp lệ theo trạng thái, quyền và inventory.
- Hành động phổ biến diễn ra trực tiếp trên bản đồ với animation. Popup lớn chỉ dành cho thông tin chi tiết, chọn giống/vật phẩm khi thực sự cần, hoặc xác nhận giao dịch quan trọng.
- Nếu nhiều loại thức ăn/con giống, dùng popover/chọn nhanh có thể đóng, không tự động mở modal toàn màn hình.
- Mobile: tap chọn đối tượng; drag camera không bị hiểu nhầm là click; không cản thao tác drag-to-act ở ô đất; vùng chạm đủ lớn, không tràn viewport.
- Khi người chơi thăm farm khác, thấy đúng vật nuôi và animation nhưng không được thao tác trái quyền.

## CP4 — Tích hợp kỹ thuật và hiệu năng

- Dùng sprite sheet/WebP hoặc atlas phù hợp; animation idle/swim/walk/peck/feed/harvest; asset đồng nhất với phong cách Zing Me 2.5D **nhưng phải là tài nguyên hợp pháp/nguyên bản**.
- Tách scene rendering, animal visual state, VAC domain state, interaction/controller. Không nhúng quy tắc kinh tế vào Canvas.
- Giới hạn cập nhật khi offscreen, giảm mật độ particles trên mobile, cache sprites, không tạo object mới liên tục trong mỗi frame.
- Không phát socket cho vị trí từng con cá/gà; chỉ đồng bộ sự kiện/trạng thái VAC theo backend. Reconnect, refresh, offline growth phải dựng lại trạng thái đúng.
- Giữ compatibility với DB cũ. Nếu bắt buộc migration, cần migration an toàn và test rollback/backup; không reset dữ liệu.
- Có lựa chọn giảm chuyển động/âm thanh; audio không tự phát nếu người dùng chưa tương tác hoặc chưa bật.

## CP5 — Test và nghiệm thu hình ảnh

### Test chức năng bắt buộc
1. Ao trống không có cá; thả cá thành công mới hiện cá.
2. Số cá/gà hiển thị phù hợp với dữ liệu thực; tăng trưởng/offline reload đúng.
3. Cho ăn thành công mới có trạng thái mới; request lỗi không tạo vật phẩm hoặc thay số dư.
4. Thu hoạch cá/trứng cập nhật server/inventory đúng, không nhân đôi khi double-click/retry.
5. Không có trứng thì không hiển thị trứng có thể thu; không có gà thì sân trống.
6. Gà không xuyên hàng rào, không đi khỏi sân; cá không bơi lên bờ.
7. Người chơi đi quanh ao/sân gà không bị kẹt; hit-test chính xác; auto-walk vẫn hoạt động.
8. Drag-to-act trên ruộng và menu ngữ cảnh các công trình khác không bị ảnh hưởng.
9. Visitor read-only; multiplayer không rò rỉ dữ liệu farm riêng hoặc cấp quyền sai.
10. Refresh/reconnect/lag/offline và farm cũ đều hoạt động; không reset dữ liệu.

### Visual QA bắt buộc
- Screenshot **before/after** cùng camera và viewport: desktop 1920×1080, 1366×768; mobile 390×844; ao trống/ao có cá; sân trống/sân có gà; khi cho ăn; khi thu hoạch.
- Quay video ngắn hoặc chuỗi frame chứng minh cá bơi, gà đi lại, cho ăn và thu hoạch; ảnh tĩnh không chứng minh animation.
- Kiểm tra che khuất, bóng đổ, mép nước, hàng rào, lối đi, camera, popup, FPS/heap trong 10 phút có vật nuôi chuyển động.
- Chạy toàn bộ automated tests, browser QA và regression Phase 1–9 (hoặc bộ hiện hành); báo cáo lệnh chạy, kết quả thực tế và phần không chạy được.

## Deliverables

- Code/asset hoàn chỉnh, có ghi nguồn và quyền sử dụng.
- `LIVING_FARM_IMPLEMENTATION_REPORT.md`: kiến trúc, thay đổi, phạm vi, vấn đề còn lại.
- `LIVING_FARM_VISUAL_QA.md`: bảng kiểm, ảnh trước/sau, video/frame, FPS, thiết bị/viewport.
- Test cases tự động cho dữ liệu VAC, interaction, quyền và chống double action.
- Ảnh minh họa sơ đồ footprint ao và sân gà; giải thích cách xử lý nếu khu vực bị chiếm.
- Cập nhật README/progress/asset manifest khi cần.

## Definition of Done (không được tự tuyên bố COMPLETE nếu chưa đạt)

- Ao rộng hơn rõ ràng nhưng vẫn đẹp và không chồng lấn khu vực khác.
- Chuồng gà giữ nguyên diện mạo đẹp, có sân nhỏ nối trực tiếp, gà di chuyển trong sân.
- Cá bơi và gà hoạt động ngay trên bản đồ theo trạng thái thật, không phải hiệu ứng trang trí sai dữ liệu.
- Cho ăn và thu hoạch có phản hồi hình ảnh tại chỗ, không phụ thuộc popup lớn.
- Không phá đất trồng, camera, hit-test, pathfinding, kinh tế, VAC, multiplayer và dữ liệu SQLite.
- Có bằng chứng browser QA thực tế (ảnh + video/frame) và regression pass.
- Nếu thiếu vị trí hoặc asset đạt chuẩn, báo cáo rõ `INCOMPLETE` cùng phương án giải quyết.



---

# PHỤ LỤC BẮT BUỘC — THAM KHẢO CODEBASE `san-may` (cập nhật 05/11/2026)

> **Phạm vi tham khảo:** `https://github.com/leem8888/san-may` chỉ là nguồn tham khảo **mã nguồn và thuật toán**. Dự án đích luôn là `nong-trai-lang-viet`. Không clone đè, không thay kiến trúc ứng dụng, không nhập dữ liệu game chùa, không copy UI/asset/cốt truyện. Giữ toàn bộ yêu cầu CP0–CP5 và Definition of Done phía trên.
>
> **Nguồn tham khảo tại máy người dùng:** `C:\Users\tuanbna.EDS\Documents\Code\san-may` (Windows). Codex phải kiểm tra thư mục tồn tại, có quyền đọc và xác định SHA local. Không mặc định thư mục này đã đồng bộ với GitHub; không tự fetch/pull/reset/checkout hoặc sửa file trong đó. Nếu Codex chạy trong WSL, có thể kiểm tra đường dẫn tương ứng `/mnt/c/Users/tuanbna.EDS/Documents/Code/san-may`; chỉ sử dụng nếu thực sự tồn tại.
>
> **Mức xác minh:** README công khai của `san-may` xác nhận có các nhóm `public/js/core/`, `public/js/systems/`, `public/js/entities/`, `public/js/rendering/`, `public/js/multiplayer/`, `server/services/`, `public/data/maps/*.json`; có click-to-move tự tìm đường tránh vật cản, collision được kiểm tra server, tương tác đi tới rồi thực hiện. **Chưa xác minh chi tiết từng hàm/file triển khai**: Codex phải tự đọc repo local và chứng minh trước khi chọn code. Repo `san-may` có **Hồ Sen**, không được mặc định rằng nó đã có hệ thống nuôi cá giống VAC của game đích.

## REF0 — Đọc repository Sân Mây có sẵn trên máy (KHÔNG CLONE)

**Đường dẫn tuyệt đối của repo tham khảo (Windows):**

```text
C:\Users\tuanbna.EDS\Documents\Code\san-may
```

**Nếu Codex chạy trong PowerShell:**

```powershell
$ref = 'C:\Users\tuanbna.EDS\Documents\Code\san-may'
if (-not (Test-Path -LiteralPath $ref -PathType Container)) { throw "Không tìm thấy Sân Mây: $ref" }
git -C $ref rev-parse --show-toplevel
git -C $ref rev-parse HEAD
git -C $ref status --short
git -C $ref ls-files public/js server tests public/data
```

**Nếu Codex chạy trong WSL:** kiểm tra đường dẫn `/mnt/c/Users/tuanbna.EDS/Documents/Code/san-may` tồn tại rồi dùng `git -C` tương tự. Nếu Codex đang chạy trong container/cloud không truy cập được ổ C:, **không tự clone thay thế**; báo rõ `REFERENCE_UNAVAILABLE` và yêu cầu người dùng mount/chia sẻ repo hoặc cung cấp mã nguồn cần đọc. Có thể tiếp tục phần độc lập nhưng không được tuyên bố đã audit Sân Mây.

**Quy tắc bảo vệ repo tham khảo:**
- Chỉ **đọc** code, git metadata và tài liệu của Sân Mây. Không chỉnh sửa, format, build có tạo file, chạy migration, cài dependencies, commit, checkout, reset, pull, fetch, push hoặc xóa file trong repo tham khảo.
- Không copy nguyên thư mục hoặc tạo submodule. Nếu cần thực nghiệm thuật toán, sao chép **đoạn cần thử** vào vùng tạm nằm ngoài cả hai repository, bảo đảm quyền sử dụng phù hợp.
- Ghi SHA và trạng thái working tree của **cả hai repo** trong báo cáo; nếu Sân Mây có thay đổi chưa commit, chỉ đọc và ghi rõ đang tham khảo bản local nào.
- Kiểm tra license/thông báo bản quyền; nếu chưa rõ quyền, chỉ học ý tưởng và tự triển khai lại.
- Tạo bảng `source file + symbol/algorithm → destination file → reuse/adapt/rewrite/skip → lý do → test`; không tự bịa tên hàm.

## REF1 — Tham khảo hệ thống di chuyển và tránh vật cản (ƯU TIÊN CAO)

**Đường dẫn cần kiểm tra trong `san-may`:**
- `public/js/systems/` — Collision, Interaction.
- `public/js/core/` — InputManager, Camera, GameLoop.
- `public/js/entities/` — Player, NPC.
- `public/js/scenes/`, `public/data/maps/*.json` — vùng đi được, vùng cấm, điểm tương tác, cổng.
- `server/services/` — luật di chuyển/va chạm server-side.
- `tests/` — bài test đi bộ qua cổng, vật cản, phạm vi tương tác.

**Hành vi đã được README xác nhận để tham khảo:** click/chạm vào cảnh để nhân vật tự đi vòng vật cản; tương tác với vật thể theo mô hình **đi tới rồi tương tác**; server kiểm tra tốc độ, va chạm và khoảng cách. Đây là điểm tham khảo về **trải nghiệm và cách tổ chức code**, không phải bảo đảm có thuật toán A* hay tên API cụ thể.

**Cách áp dụng cho Nông Trại Làng Việt:**
1. Audit auto-walk/pathfinding hiện có trước; chỉ thay thế hoặc cải thiện đoạn thực sự gây kẹt, rung, đi vòng vô lý hoặc tương tác sai.
2. Duy trì phép đổi tọa độ **isometric screen ↔ world/grid** của game đích; không chép trực tiếp tọa độ top-down từ `san-may`.
3. Thiết lập `approach points` hợp lệ quanh bờ ao và cổng sân gà; chọn điểm đến gần nhất có thể đi tới, không điều hướng vào giữa mặt nước hoặc xuyên hàng rào.
4. Cập nhật navigation/collision theo **footprint logic** mới khi ao lớn hơn, sân gà xuất hiện, hàng rào/cổng thay đổi; cổng người và cửa gà có thể có luật đi qua khác nhau.
5. Khi không tìm được đường: dừng an toàn, thông báo ngắn; không teleport, không xuyên vật cản, không thực hiện hành động từ xa.
6. Không làm hỏng WASD, joystick, chạm để đi, drag-to-act, camera, multiplayer interpolation và quyền tương tác.
7. Giữ server-authoritative validation; mọi thao tác VAC vẫn kiểm tra chủ sở hữu, khoảng cách, tài nguyên, cooldown và idempotency.

**Test bắt buộc:** từ ít nhất 8 vị trí tiếp cận quanh ao/chuồng; có vật trang trí chắn đường; đi vòng góc nhà/hàng rào; nhấp liên tiếp đổi đích; người chơi và khách; camera zoom; mobile tap; server từ chối tương tác ngoài phạm vi; không rung/teleport.

## REF2 — Tham khảo animation, render và cảm giác sống động

**Đường dẫn cần kiểm tra:** `public/js/rendering/` (SceneRenderer, SpriteRenderer, ParticleSystem, LightingSystem), `public/js/core/` (GameLoop, AssetLoader), `public/js/entities/`, `public/js/systems/` (Audio, DayNight, Weather), `public/js/multiplayer/` (Interpolation).

- Chỉ học kỹ thuật: delta-time animation, trạng thái idle/walk/action, chuyển hướng, chuyển động mượt, hiệu ứng hạt, bóng/ánh sáng, cập nhật khi camera nhìn thấy, nội suy từ state server.
- **Không lấy đồ họa chùa, hồ sen, nhân vật, âm thanh hoặc bản đồ của Sân Mây** để đưa nguyên vào nông trại; giữ art direction isometric 2.5D và sprite VAC đẹp hiện tại.
- Cá: bơi trong polygon/ellipse mặt nước **thực tế**, đổi hướng, tạo gợn nước, tụ lại khi cho ăn, có idle/ẩn-hiện hợp lý. Nếu dữ liệu backend chỉ lưu số lượng tổng, hiển thị đại diện theo quy tắc rõ và không vượt quá số lượng thật.
- Gà: đi trong sân thả, đổi hướng, mổ thức ăn, nghỉ, vào/ra chuồng; trạng thái ăn/trứng phản ánh backend. Tách chuyển động trang trí khỏi các sự kiện giao dịch.
- Ưu tiên hiệu ứng có ý nghĩa (thả cá, cho ăn, thu hoạch) hơn particle dày đặc. Hỗ trợ giảm hiệu ứng và giới hạn FPS/CPU trên mobile.

## REF3 — Tham khảo tương tác và đồng bộ, không bê nguyên backend

**Đường dẫn cần kiểm tra:** `public/js/systems/Interaction*`, `public/js/multiplayer/`, `server/services/`, `server/sockets/` hoặc module socket thực tế được tìm thấy sau khi kiểm tra repo local, `tests/`.

- Tái sử dụng **mô hình** `click object → auto-approach → validate range → perform action → show feedback` nếu tương thích, không copy các API/Socket event đặc thù Sân Mây.
- Game đích giữ endpoint, schema, ledger, SQLite migration, inventory, VAC growth, auth, quyền chủ farm và visitor read-only hiện có.
- Client animation phải chạy sau phản hồi thành công hoặc có cơ chế rollback an toàn; chống double-click/retry nhân đôi thức ăn, trứng, cá, tiền.
- Multiplayer: gửi trạng thái nghiệp vụ cần thiết; không stream tọa độ từng con gà/cá liên tục nếu chỉ là chuyển động local deterministic.
- Ao không có cá thì không vẽ cá; chuồng không có gà thì không vẽ gà; không có trứng thì không hiển thị vật phẩm có thể nhặt.

## REF4 — Ràng buộc tích hợp với Terrain/Land/Fence/Gate đang sửa

- **Không triển khai đồng thời trên cùng working tree** nếu AI khác còn sửa terrain/fence/camera/renderer. Đợi commit và xác nhận HEAD sạch; dùng branch riêng.
- Đọc API/geometry của hàng rào mới, tạo hàng rào sân gà như một loại độc lập; không lẫn với ranh giới đất sở hữu.
- Mở rộng ao và sân gà phải qua kiểm tra footprint, đường đi, vị trí công trình, đất chưa mua và savegame cũ. Nếu không đủ chỗ, đề xuất phương án hợp lệ; **không tự xóa hoặc di dời dữ liệu người chơi**.
- Với farm đã có dữ liệu, cần migration/compatibility strategy chỉ khi thật sự cần; test trước/sau bằng bản sao SQLite, không đụng DB người dùng.

## REF5 — Bằng chứng nghiệm thu bổ sung

Bên cạnh CP5 của kế hoạch gốc, yêu cầu:

1. `REFERENCE_CODE_AUDIT.md`: SHA `san-may`, SHA game đích, danh sách file/hàm đã đọc, bảng reuse/adapt/rewrite/skip, lý do kỹ thuật và bản quyền.
2. `PATHFINDING_COMPARISON.md`: mô tả trước/sau cho tiếp cận ao/chuồng, ít nhất 8 đường đi và tình huống vật cản; xác nhận không phá tương tác ruộng/chợ.
3. Browser evidence: video/chuỗi frame **cá bơi khi có cá**, **cá tụ ăn**, **gà ra sân đi lại**, **gà đến máng ăn**, **thu cá/trứng**, **ao/chuồng trống không có vật nuôi giả**.
4. Kiểm tra savegame, VAC offline growth, quyền visitor, inventory, double request, 2 trình duyệt và mobile.
5. Chạy test và ghi kết quả **thực tế**; không copy số liệu QA của `san-may` làm bằng chứng game đích đạt.
6. Chỉ đánh dấu `COMPLETE` khi yêu cầu gốc **và** phụ lục này đều đạt; nếu code tham khảo không phù hợp, ghi `SKIP` có lý do và triển khai độc lập.

**Tiêu chí quan trọng nhất:** Kết quả phải đẹp và sinh động như mô tả Living Farm, **không được hạ chất lượng chỉ để dễ tái sử dụng code của Sân Mây**.

## Chỉ dẫn thực thi cho Codex

Audit HEAD game đích và SHA repo Sân Mây local (read-only) → chụp baseline → xác định layout hợp lệ → triển khai CP1–CP4 → test CP5 → tự xem ảnh/video và sửa → cập nhật báo cáo → **commit local**. **Không tự push, merge hoặc deploy**. Không sửa chồng chéo nhánh Terrain/Land/Fence/Gate; nếu có conflict, dừng và nêu chính xác file/vùng conflict.

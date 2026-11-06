# BIG UPDATE FARM 2.0 — KẾ HOẠCH TRIỂN KHAI CHO CODEX

**Dự án:** Nông Trại Làng Việt — https://github.com/leem8888/nong-trai-lang-viet

**Mục tiêu:** Nâng chất lượng Farm tương xứng Chợ Làng sau BIG UPDATE, đồng thời làm gameplay trực quan, sống động, không phá vỡ logic hiện có.

**Nguồn tham chiếu:** Screenshot Farm hiện tại do chủ dự án cung cấp (nhà ngói trung tâm, ruộng trái, ao cá lớn phía dưới, sân gà bên phải, hàng rào tre bao quanh).
**Trạng thái:** Implementation specification; kết quả triển khai và các giới hạn QA được ghi trong `docs/farm-big-update/REPORT.md`.

**Quyết định cập nhật của chủ dự án:** Ô chưa mua phải là luống nổi xanh nõn chuối; ô đã mua chưa cuốc là luống nổi nâu; luống đang trồng giữ mỹ thuật hiện tại. Chỉ cây đã gieo và chưa chín mới cần tưới. Cây chín hiển thị như đã tưới dù không tưới thủ công, không nhận thưởng tăng trưởng hồi tố. Không vẽ chấm báo đã tưới. Trứng sẵn sàng thu hoạch hiển thị trong ổ rơm của chuồng. Chủ dự án đã yêu cầu commit và push lên remote sau khi cập nhật tài liệu; việc này không đồng nghĩa kết luận COMPLETE.

## 0. Nguyên tắc bắt buộc

1. **Thực thi, không chỉ lập kế hoạch.** Khảo sát code và triển khai các hạng mục có thể làm an toàn, kèm bằng chứng kiểm thử.
2. **Bảo toàn asset đang đẹp:** nhà chính, ao bờ đá và sen, chuồng gà/sân thả, hàng rào tre, cây trồng, cây cối, NPC. Chỉ chỉnh asset khi chứng minh được cải thiện.
3. **Không phá gameplay:** giữ server-authoritative state, SQLite, tiền Đồng Làng, quyền sở hữu đất, giá mua, điều kiện unlock, VAC, nhiệm vụ, multiplayer, khách thăm read-only, offline progression.
4. **Không tự ý thay đổi tọa độ logic:** mọi điều chỉnh hiển thị phải tương thích hitbox, tile picking, camera, y-sort, collision và pathfinding.
5. **Giữ đúng trạng thái sở hữu:** ô chưa mua hiển thị luống nổi xanh nõn chuối, ô đã mua chưa cuốc hiển thị luống nổi nâu; trạng thái vẫn lấy từ server, không tạo ô có thể thao tác giả. Hover/selection chỉ hiện khi cần.
6. **Kiểm soát Git:** kiểm tra git status trước khi sửa, tránh ghi đè thay đổi chưa commit. Chủ dự án đã cho phép commit và push đợt này; không tự merge hoặc deploy.
7. **Không báo COMPLETE nếu thiếu bằng chứng browser QA**, đặc biệt animation cá/gà và kiểm thử mua đất.

## 1. Định nghĩa kết quả mong muốn

- Farm nhìn như khu vườn làng Việt có địa hình tự nhiên, đường đất mềm mại kết nối đúng công trình; không còn cảm giác nét vẽ xám đặt trên nền cỏ.
- Ruộng có chất liệu đất rõ ràng, từng giai đoạn canh tác phân biệt được nhưng không thành bảng lưới viền sáng.
- Ao cá **giữ kích thước lớn và asset đẹp hiện tại**; cá bơi và phản hồi khi cho ăn/thu hoạch.
- Chuồng gà **giữ sân thả hiện tại**, có gà đi lại hợp lệ, ăn, nghỉ, vào/ra chuồng; không xuyên hàng rào.
- Người chơi click mục tiêu -> nhân vật tìm đường hợp lệ -> thực hiện hành động khi đến tầm; menu gọn, không che cảnh quan.
- Hiệu năng desktop/mobile ổn định, gameplay và quyền truy cập không đổi.

## CP0 — Khảo sát baseline và lập bản đồ phụ thuộc

- Đọc cấu trúc repo và các module renderer Farm, terrain, asset loader, farm tile, ownership, world coordinates, navigation, VAC, UI/context menu, server API, test.
- Kiểm tra branch/HEAD/status; ghi commit baseline, lưu screenshot Farm wide/close và các tình huống tương tác.
- Xác định rõ **nguồn render** của từng thành phần: nền cỏ, đường ngoài Farm, đường nội bộ, đất chưa mua, đất đã cày, lớp viền, hàng rào, ao, sân gà.
- Xác định lớp nào dùng `drawImage`/SVG/WebP và lớp nào dùng Canvas path/fill/stroke. Liệt kê file + hàm thực tế; không đoán tên module.
- Kiểm tra asset Chợ Làng sau BIG UPDATE để học cách tạo meadow/ground/road transitions; tái sử dụng kỹ thuật phù hợp nhưng không dùng sai tỷ lệ hay bê nguyên cảnh chợ vào Farm.
- Nếu repo có thay đổi chưa commit hoặc kế hoạch khác đang triển khai, dừng các phần xung đột và báo rõ.

**Deliverable:** `docs/farm-big-update/BASELINE.md` với inventory, risk map, screenshots trước sửa.

## CP1 — Terrain cỏ tự nhiên và chuyển tiếp

- Giữ tinh thần xanh tươi, giàu texture của nền hiện tại, nhưng giảm lặp pattern dày đặc ở zoom xa.
- Tạo các biến thể thảm cỏ dựa trên seed ổn định theo world coordinates (không random mỗi frame), vùng cỏ thấp/cao, vài đốm lá, hoa dại, mảng đất mòn có chủ đích.
- Các lớp cỏ phải **liền mạch qua tile**, không tạo đường kẻ hình thoi, đường seam hoặc bề mặt giống bàn cờ.
- Thêm chuyển tiếp cỏ -> đường -> nền công trình/ruộng bằng mask/edge blending hoặc atlas nếu renderer hỗ trợ; tránh nhiều draw call và texture khổng lồ.
- Kiểm tra thứ tự render, culling, camera zoom, DPR, sprite alignment.
- Không dùng screenshot làm texture kéo giãn; nếu tạo asset mới phải có nguồn file, manifest, kích thước và cách build rõ ràng.

**Acceptance:** screenshot wide/close không thấy lặp ô rõ, không seam, không nhấp nháy khi camera di chuyển.

## CP2 — Đường đất Farm: ưu tiên P0

- Xác định nguyên nhân đường nội bộ đang có màu xám/nâu phẳng và các giao điểm cắt gắt; xác định đường ngoài Farm màu be và quy tắc render của cả hai.
- Nâng cấp đường nội bộ thành **đường đất làng có texture**, mép hòa cỏ, hạt đất/sỏi nhỏ và vệt mòn vừa phải; phối màu đồng bộ với đường Chợ Làng nhưng không sao chép tỷ lệ bừa bãi.
- Tạo nối đường mềm, bo giao lộ, xử lý đường từ cổng -> nhà -> ruộng -> ao -> chuồng gà; không có đoạn đứt, xuyên bờ ao, cắt sân gà hoặc hàng rào.
- Nếu thay spline/path geometry, bảo toàn hoặc cập nhật có kiểm thử navmesh/walkability, tương tác và collision.
- Đường ngoài Farm phải thống nhất ngôn ngữ mỹ thuật với nội bộ, nhưng phân biệt hợp lý đường làng và lối đi trong vườn.

**Acceptance:** mọi tuyến đường nhìn liền mạch ở 100%, 125%, mobile; nhân vật đi được tới tất cả interaction anchors.

## CP3 — Ruộng và trạng thái đất: ưu tiên P0

- Giữ **tọa độ, số ô, diện tích và state** hiện tại; chỉ thay cách thể hiện.
- Các trạng thái cần nhận biết: chưa mua, đã mua chưa cày, đã cày, gieo hạt, đang lớn, cần nước/đã tưới, chín, đang thao tác; ánh xạ vào schema thực tế sau khi khảo sát.
- Đất chưa mua: render thành luống nổi xanh nõn chuối trên toàn bộ mặt ô; không có viền trắng thường trực. Khi hover/chọn mới hiện đường viền một ô; chức năng Mua đất vẫn hoạt động.
- Đất đã mua nhưng chưa cày: luống nổi nâu, phân biệt rõ với ô chưa mua và nền cỏ; giữ nguyên tọa độ và hitbox.
- Đất đã cày: đất nâu tơi, luống có chiều sâu, đường rãnh đúng phối cảnh isometric, biến thể không lặp máy móc.
- Trạng thái tưới: chỉ cây đã gieo và chưa chín mới hiện “Cần tưới nước”. Tưới xong luống trở lại giao diện bình thường, không có chấm/giọt báo tưới. Cây chín hiển thị như đã tưới dù không tưới thủ công; không cộng thưởng tăng trưởng hồi tố hoặc sửa dữ liệu lịch sử chỉ vì cách hiển thị.
- Cây trồng giữ sprite hiện có, đúng anchor/y-sort/growth state; hiệu ứng gieo/tưới/thu hoạch nhẹ và gọn.
- Click/drag-to-act, touch, quyền sở hữu, giá mua, crop lifecycle và API giữ nguyên.

**Acceptance:** ô chưa mua xanh nõn chuối, ô đã mua chưa cuốc nâu, cả hai nổi rõ và không có viền trắng thường trực; hover một ô chỉ highlight một ô; mua đất, cày, gieo, tưới, thu hoạch đều đúng và không bị lệch hitbox.

## CP4 — Bố cục, hàng rào, cổng và tiểu cảnh

- Giữ nhà chính, ao, chuồng, hàng rào và vị trí công trình hiện có làm baseline.
- Chỉ thêm tiểu cảnh **có chủ đích**: chum nước, giỏ rau, bó rơm, vài khóm hoa, lá rụng, mảng đất mòn gần nơi đi lại; tránh che ruộng, cửa, cổng, ao và click targets.
- Rà soát nối góc hàng rào, shadow, y-sort, cổng ra vào và khả năng mở rộng đất; không thêm cọc chắn lối đi.
- Nếu chỉnh kích thước hoặc vị trí một asset, cập nhật tương ứng visual bounds, interaction anchor và collision; có screenshot chứng minh không chồng lấn.
- Không lạm dụng vật thể động gây tốn FPS hoặc rối cảnh.

**Acceptance:** cảnh cân đối ở wide/close, cổng thông suốt, không vật thể đè lên NPC/ruộng hay đường đi.

## CP5 — Living Farm: ao cá, gà và animation thực chất

### Ao cá
- Giữ **ao lớn hiện tại**; không thu nhỏ hoặc thay bằng asset kém hơn. Kiểm tra cá nhìn rõ ở zoom xa và gần.
- Cá bơi theo quỹ đạo tự nhiên trong giới hạn nước, đổi hướng mềm, có gợn sóng; không xuyên bờ đá/hoa sen.
- Số lượng và giai đoạn cá hiển thị phải bám **trạng thái VAC authoritative**; ao trống không xuất hiện cá giả; nếu nhiều cá, có thể áp dụng LOD/representation nhưng không đánh lừa người chơi về số lượng có thể thu hoạch.
- Cho ăn: hạt thức ăn xuất hiện tại vùng nước hợp lệ, cá tiến tới đớp, có ripple; chỉ phản hồi thành công khi server xác nhận.
- Thu hoạch: animation đúng số lượng server trả về, UI cập nhật chính xác; lỗi/không đủ điều kiện phải có phản hồi rõ, không phát thưởng giả.

### Chuồng gà
- Giữ chuồng và sân thả hiện tại; ranh giới sân là khu vực di chuyển hợp lệ.
- Gà đi dạo, đứng, mổ đất, tới máng khi ăn, nghỉ và có thể vào/ra chuồng; không đi xuyên rào/cửa đóng/công trình.
- Số gà, trạng thái đói, trứng và thời gian sinh trưởng bám backend; không hiện trứng thu hoạch khi server chưa có.
- Trứng đã sẵn sàng nằm trên ổ rơm trong chuồng, không nằm ngoài sân; hiệu ứng nhặt trứng bắt đầu từ ổ.
- Cho ăn/nhặt trứng có animation và phản hồi sau xác nhận từ server; khách thăm chỉ quan sát.

### Kiến trúc animation
- Vị trí cá/gà có thể mô phỏng client-side, seeded deterministic khi phù hợp; **không cần đồng bộ từng frame qua Socket.IO**.
- Snapshot server là nguồn chân lý cho inventory, trạng thái VAC và quyền thao tác; xử lý reconnect và farm switching.
- Dùng culling, reduced motion, LOD và giới hạn particles; không tạo listener/timer trùng sau re-render.

**Acceptance:** chứng minh bằng chuỗi frame/video cá bơi, cho ăn, thu hoạch; gà đi, ăn, nghỉ, thu trứng; số lượng/permission đúng trong test.

## CP6 — Di chuyển, tương tác và UX

- Tận dụng hệ thống pathfinding/collision hiện tại. Nếu cần tham khảo Sân Mây đã có trên máy: `C:\Users\tuanbna.EDS\Documents\Code\san-may` — **chỉ đọc, không sửa**; không clone lại nếu đường dẫn truy cập được.
- Click ao, chuồng, ruộng hoặc nhà: xác định interaction anchor hợp lệ, nhân vật tìm đường tránh chướng ngại, chỉ kích hoạt khi đến gần; không teleport hoặc đi xuyên vật thể.
- Kiểm tra lối hẹp gần hàng rào, góc nhà, bờ ao, cổng sân gà, đường giao nhau; có phương án thất bại lịch sự khi không có đường.
- Menu ngữ cảnh gọn, neo gần đối tượng, không che công trình; popup chi tiết chỉ mở khi người chơi chọn Thông tin.
- Touch: hit targets đủ lớn, không xung đột pan/zoom với thao tác ruộng; hỗ trợ bàn phím nếu game đang có.
- HUD/bottom toolbar không che cổng và vùng thao tác quan trọng; không thay đổi UX toàn game ngoài phạm vi cần thiết.

**Acceptance:** test nhiều hướng tiếp cận; không kẹt/đi xuyên; visitor không thể thao tác ghi dữ liệu.

## CP7 — QA, hiệu năng, báo cáo và nghiệm thu

### Automated/regression
- Chạy test suite hiện có, bổ sung unit/integration test cho ownership overlays, tile picking, purchase, VAC state transitions, visitor permissions, pathfinding collision, deterministic animation bounds.
- Test cả trạng thái farm trống, ít vật nuôi, nhiều vật nuôi, reconnect, chuyển farm, thiếu tiền, thao tác thất bại, offline progression.
- Không dùng số test pass làm bằng chứng duy nhất cho chất lượng hình ảnh.

### Browser QA bắt buộc
- Chạy game thật bằng trình duyệt, desktop ở zoom 100% và 125%; thêm viewport mobile/touch nếu môi trường hỗ trợ.
- Chụp **before/after cùng camera và zoom**: Farm wide, ruộng close, đường/cổng close, ao close, sân gà close.
- Thu chuỗi frame/video cho: cá bơi -> cho ăn -> thu hoạch; gà đi -> ăn -> nghỉ -> nhặt trứng; nhân vật tìm đường tới ao/chuồng/ruộng.
- Kiểm tra console/network errors, FPS/frametime theo phương pháp có thể lặp lại; ghi rõ máy, viewport, thời lượng, số entity. Không tự đặt con số FPS đạt nếu chưa đo.
- So sánh Farm với Chợ Làng mới về màu sắc, texture, mép đường và độ dày chi tiết; không đồng nhất hai khu vực một cách máy móc.

### Deliverables
- `docs/farm-big-update/REPORT.md`: baseline HEAD, thay đổi theo CP, file/hàm đã sửa, test thực chạy, vấn đề còn tồn đọng, verdict.
- `docs/farm-big-update/BEFORE_AFTER.md` và ảnh có tên rõ ràng; bằng chứng animation/video hoặc chuỗi frame.
- Asset manifest / hướng dẫn regenerate nếu tạo SVG/WebP hoặc procedural texture mới.
- Ghi rõ hash commit và trạng thái git; đợt này chủ dự án đã cho phép push code lên remote. **Không merge hoặc deploy.** Nếu chưa đủ gate COMPLETE, vẫn báo GO WITH FIXES hoặc NO-GO trung thực.

## Definition of Done — GO / GO WITH FIXES / NO-GO

**GO:** Hoàn tất CP0–CP7; ô đất đúng màu và quyền sở hữu, không có viền trắng thường trực; đường tự nhiên, ruộng rõ trạng thái, ao/gà có animation đúng dữ liệu, collision đúng, gameplay regression pass, có bằng chứng browser QA.

**GO WITH FIXES:** Gameplay an toàn và visual tốt hơn nhưng còn lỗi mỹ thuật nhỏ, mobile/animation evidence chưa đủ; liệt kê chính xác và không gọi COMPLETE.

**NO-GO:** Mất dữ liệu hoặc quyền sở hữu; sai tiền/thu hoạch; gà/cá giả trái server; nhân vật xuyên vật cản; lỗi mua đất; asset/renderer vỡ; không có QA thực tế nhưng báo hoàn thành.

## Prompt khởi chạy ngắn cho Codex

> Đọc toàn bộ `docs/BIG_UPDATE_FARM_2_0_IMPLEMENTATION_PLAN.md`. Triển khai CP0–CP7 trên codebase hiện tại. Giữ các asset Farm đã đẹp, ưu tiên sửa đường đi và đất canh tác, đồng thời hoàn thiện animation cá/gà, interaction và QA. Không chỉ lập kế hoạch. Tự kiểm thử browser, chụp before/after cùng camera, cung cấp bằng chứng animation và báo cáo trung thực. Làm theo quyền commit/push mới nhất của chủ dự án; không tự merge/deploy.

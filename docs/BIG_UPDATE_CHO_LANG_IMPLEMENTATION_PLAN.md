# BIG UPDATE CHỢ LÀNG — IMPLEMENTATION PLAN

**Dự án:** Nông Trại Làng Việt  
**Phạm vi:** Chợ Làng / Village Market, một đợt nâng cấp tổng thể trong một nhánh triển khai.  
**Mục tiêu:** Biến cảnh chợ hiện tại từ các asset đẹp nhưng đặt trên nền lưới hình thoi thành một không gian làng Việt isometric 2.5D liền mạch, sống động, dễ chơi và ổn định.

> Đây là tài liệu yêu cầu **Codex trực tiếp viết code, tích hợp, kiểm thử và chụp bằng chứng**, không phải chỉ lập kế hoạch. Ảnh screenshot Chợ Làng do người dùng cung cấp là baseline thị giác. **Không tự tuyên bố PASS nếu chưa chạy và quan sát thực tế.**

## 0. Những gì đã quan sát từ screenshot

- Các quầy **Hạt giống / Thu mua / Đơn hàng** có tạo hình riêng, có sức hút; nhà ngói, nhà sàn, cây đa, giếng, tre, cây hoa có phong cách làng Việt khá tốt.
- Vấn đề lớn nhất: nền phủ các ô hình thoi xanh nhạt có viền và sọc, nhìn như bản đồ quy hoạch; khoảng trống lớn; đường màu be giao cắt cứng, nhiều đoạn không tự nhiên.
- NPC và quầy có mặt nhưng chưa truyền tải rõ không khí buôn bán. Một số nhà/đạo cụ rời rạc, tỷ lệ và vị trí tương tác cần kiểm tra.
- Đây là **nhận xét từ một ảnh tĩnh**, không phải kết luận đã đọc code hoặc chạy game. Codex phải xác minh source thực tế.

## 1. Nguyên tắc bất biến

1. **Giữ nguyên và ưu tiên tái sử dụng asset tốt**: 3 quầy chợ, nhà mái ngói, nhà sàn, cây đa, giếng, cây tre và hoa; chỉ tinh chỉnh scale/anchor/shadow khi cần.
2. **Không phá gameplay**: mua hạt giống, bán nông sản, đơn hàng, NPC quest, về nông trại, túi đồ, tiền Đồng Làng, thời tiết, ngày/đêm, visitor và multiplayer.
3. **Server authoritative** cho kinh tế, giao dịch, nhiệm vụ, inventory và quyền truy cập. Không đưa logic quyết toán sang client.
4. Giữ hệ tọa độ world/isometric, camera, hitbox, spatial index và dữ liệu persisted; không đổi schema khi không cần.
5. Không copy nguyên repo tham khảo; nếu cần pathfinding, ưu tiên dùng module hiện có. Repo Sân Mây trên máy người dùng tại `C:\Users\tuanbna.EDS\Documents\Code\san-may` **chỉ đọc để tham khảo**, không sửa, không clone nếu đường dẫn tồn tại.
6. Không tự push, merge, deploy. Chỉ commit local sau khi đạt QA; không ghi đè thay đổi chưa commit của người dùng.
7. Không dùng một screenshot trải phẳng làm nền; cần asset tile/patch/decals phù hợp renderer, có biến thể và chuyển tiếp.

## 2. CP0 — Khảo sát code và khóa baseline (bắt buộc)

- Kiểm tra `git status`, HEAD, nhánh, thay đổi chưa commit; xác định renderer market, world tiles, terrain ownership overlay, camera, render order, NPC pathfinding, interaction, assets manifest, scene configuration.
- Dùng `rg`/IDE tìm nơi vẽ diamond grid, dashed borders, fillStyle/strokeStyle, drawImage, terrain tile variants, path polygons và overlays. **Ghi file + function + nguyên nhân cụ thể**.
- Xác định rõ các ô hình thoi trong screenshot là: nền terrain, vùng farmland bên ngoài, tile ownership, debug grid hay decoration. **Không được xóa chức năng tương tác của Farm chỉ vì xóa lưới Chợ.**
- Chạy baseline build/tests, mở Chợ trong browser; lưu screenshot desktop cùng camera/zoom, screenshot mobile; ghi console warnings, FPS/frame time, số NPC, trạng thái chợ.
- Lập bảng “giữ nguyên / sửa / thay asset / thêm mới” và sơ đồ vùng đi được / không đi được / vùng tương tác.

**Gate CP0:** có báo cáo root cause và baseline trước khi code; nếu không truy cập được browser hoặc repo, báo blocker thật.

## 3. CP1 — Terrain liền mạch, tự nhiên (P0)

### Yêu cầu thị giác
- **Không còn lưới hình thoi xanh nhạt và sọc thường trực** ở scene Chợ Làng; ground phải trông như thảm cỏ liền mạch, không phải các ô đất được phân lô.
- Sử dụng các lớp: nền cỏ base, mảng cỏ đậm/nhạt, đất trống/đất mòn nhỏ, cỏ thấp, hoa li ti, lá rụng, sỏi. Density có chủ đích: ít trên lối đi, nhiều ở mép sân và gần nhà.
- Màu xanh tự nhiên, ấm, hài hòa với asset hiện tại; tránh xanh neon, mảng đơn sắc và lặp texture dễ nhận ra.
- Dùng deterministic seeded variation theo tọa độ world; không random mỗi frame gây nhấp nháy; dùng tileable texture, atlas, terrain patches hoặc decal tùy kiến trúc thực tế.
- Giữ nguyên coordinate transform và hit testing. Nếu có lớp grid phục vụ debug/placement, chỉ bật ở debug mode hoặc tương tác cần thiết, không mặc định hiện ở Chợ.
- Phân biệt rõ **terrain scene Chợ** với **ô canh tác/mua đất ở Farm**; thay đổi không gây regression Farm.

### Kỹ thuật
- Kiểm tra và sửa render order: ground -> paths -> decals -> shadows -> objects/NPC -> foreground -> UI. Chống seams/bleeding tại zoom lẻ và devicePixelRatio khác nhau.
- Culling theo viewport; cache static terrain patches khi thích hợp; hạn chế per-frame allocations, overdraw và hàng nghìn draw calls.

**Gate CP1:** ảnh zoom thường và zoom gần không còn mạng hình thoi đều đặn; không lộ seam; Farm vẫn đúng.

## 4. CP2 — Hệ thống đường làng và sân chợ (P0)

- Tái thiết kế **đường chính dẫn vào chợ**, **sân trung tâm trước 3 quầy**, đường nhánh đến giếng, cây đa, nhà dân và cổng/về nông trại. Các tuyến phải kết nối logic, không kết thúc cụt vô cớ.
- Đường đất làng màu be/nâu ấm, texture cát đất mịn có vết mòn, sỏi nhỏ, rìa cỏ loang mềm, vệt bánh xe nhẹ ở nơi hợp lý.
- Không để hình chữ X quá lớn hoặc các dải be cắt ngang nền như đường kẻ; xử lý junction và chuyển tiếp mềm mại, ưu tiên spline/path mesh/patch đúng renderer.
- Quầy đặt trên sân đất nện có ranh giới hữu cơ; không cần một hình thoi hoặc hình chữ nhật nền cứng quá lớn.
- Không để đường cắt xuyên chân nhà, gốc cây, hàng rào hoặc vật cản. Vùng đi được phải trùng với hình ảnh đường đi.
- Có lối tiếp cận rõ ràng tới từng quầy và nút “Về nông trại”.

**Gate CP2:** NPC/player đi được liên tục giữa các điểm chính, không teleport, kẹt hoặc xuyên vật thể.

## 5. CP3 — Bố cục chợ, tỷ lệ, chiều sâu và trang trí (P1)

- Giữ cụm 3 quầy là tâm điểm, bảo đảm nhãn và điểm tương tác dễ đọc. Cân nhắc khoảng trống đủ cho 2–4 NPC mà không che hàng hóa.
- Gom nhà dân thành các cụm có sân nhỏ, luống rau, chum nước, hàng rào ngắn, giàn cây hoặc bậc cửa; không rải các nhà đơn độc trên nền trống.
- Cây đa là landmark, giếng là điểm dừng, tre/hoa tạo khung cảnh; bổ sung ít nhưng chất lượng: giỏ rau, thúng, xe đẩy, đòn gánh, ghế tre, bảng gỗ, gà/chim trang trí nếu phù hợp.
- Chuẩn hóa pivot/footprint/scale và y-sort theo chân sprite; shadow contact giúp công trình bám đất. Đảm bảo mái/foreground occlusion không che avatar khó hiểu.
- Không làm chợ quá chật; tạo khoảng thở và sightline rõ. Không đặt deco trên đường hoặc ô tương tác.
- Có thể tăng chiều sâu bằng lớp bóng mềm và ambient props, nhưng không làm sai ánh sáng ngày/đêm hoặc thời tiết.

**Gate CP3:** bố cục đọc được ở zoom mặc định, các công trình có cảm giác thuộc cùng một ngôi làng.

## 6. CP4 — Chợ sống động: NPC, tương tác, hiệu ứng (P1)

### NPC ambient
- NPC đi dọc các waypoint hợp lệ: vào chợ -> xem quầy -> dừng -> giao tiếp/nhìn hàng -> rời đi. Có idle, quay hướng, đi bộ, thay đổi tốc độ nhẹ và cooldown để tránh robot.
- Sử dụng pathfinding/collision hiện có; xác thực route quanh quầy, giếng, cây đa, nhà. Có fallback khi waypoint bị chặn; tránh loop vô hạn và NPC chồng nhau.
- NPC ambient có thể animate client-side, nhưng trạng thái gameplay, giao dịch, quest phải theo server. Không tự phát sinh phần thưởng/tiền từ animation.
- Giới hạn mật độ NPC, culling và LOD; mobile giảm hiệu ứng thay vì làm mất tương tác.

### Hiệu ứng chợ
- Lá tre lay nhẹ, tán cây rung, cờ/vải bạt quầy chuyển động nhỏ, bụi đường/đom đóm hoặc hạt sáng rất tiết chế theo thời gian/ngày đêm.
- Khi giao dịch: icon/hạt sáng nhỏ, feedback rõ nhưng không che popup, không tạo hiệu ứng giả khi server báo thất bại.
- Tương tác click/touch: nhân vật tới điểm đứng hợp lệ rồi mở đúng quầy; nếu đường không tới được phải có feedback và không khóa input.
- Có thể dùng âm thanh môi trường **nếu dự án đã có audio và có quyền dùng asset**; không bắt buộc.

**Gate CP4:** hoạt động buôn bán thấy được bằng chuỗi frame/video; các hành động thật vẫn đúng server state.

## 7. CP5 — UI/UX và khả năng tiếp cận (P1)

- Nhãn Hạt giống / Thu mua / Đơn hàng rõ, không bị mái nhà che; nút “Về nông trại” dễ thấy, không lẫn vào mặt đất.
- Tooltip/contextual affordance khi hover/tap, tránh popup tự bật vô cớ; hit area phù hợp touch.
- Giữ HUD gọn, không che chợ. Kiểm tra ở 1366×768, 1920×1080, màn hình mobile portrait/landscape và zoom 125%.
- Xử lý pixel ratio, font readability, accessibility cơ bản và trạng thái loading/error của giao dịch.
- Không tạo UI mới không cần thiết hoặc đổi luồng giao dịch đang hoạt động tốt.

## 8. CP6 — Performance, test, browser QA và regression (P0)

### Automated tests
- Scene initialization/render không crash; terrain determinism, viewport culling, z-sort; world-to-screen/screen-to-world, hitbox và route graph.
- NPC pathfinding: đi tới cả 3 quầy, giếng, lối về Farm; không đi xuyên collider; fallback khi không tới được.
- Transaction tests: mua hạt giống, bán nông sản, nhận/trả đơn, số dư và inventory, permission, visitor read-only, network failure, double click/idempotency theo kiến trúc hiện tại.
- Regression: chuyển Farm <-> Market; Farm terrain, đất chưa mua, hàng rào, ao cá, sân gà; weather/day-night; reconnect/multiplayer.

### Browser QA bắt buộc
1. Chụp ảnh **trước/sau cùng vị trí camera, zoom và độ phân giải**; thêm zoom gần terrain và góc rộng toàn chợ.
2. Ghi video 20–40 giây hoặc chuỗi >= 8 frame thể hiện NPC đi, dừng xem hàng, tương tác và ambient animation.
3. Kiểm tra desktop bằng chuột/bàn phím, mobile bằng touch, zoom 125%, thay đổi cửa sổ.
4. Quan sát FPS/frame time và memory trong phiên >= 10 phút với NPC/ambient hoạt động; so sánh baseline. Không tự đặt số FPS PASS nếu chưa đo.
5. Console không có uncaught errors; assets không 404; không texture seams/flicker/ghosting; giao dịch đúng server response.
6. Kiểm tra các trường hợp không đủ tiền, túi đầy, quest chưa đủ điều kiện, mất kết nối, người chơi khác ghé thăm.

### Acceptance / Definition of Done
- [ ] Không còn lưới hình thoi/sọc cố định trong Chợ Làng ở chế độ chơi thường.
- [ ] Terrain có texture/biến thể tự nhiên, không lặp máy móc hoặc seams.
- [ ] Đường đất nối hợp lý tới các điểm chính, có rìa chuyển tiếp mềm.
- [ ] Asset tốt được giữ; bố cục bớt trống, có chiều sâu và tỷ lệ nhất quán.
- [ ] NPC ambient di chuyển, tránh vật cản, có hoạt động chợ nhìn thấy được.
- [ ] Mua/bán/đơn hàng và về Farm hoạt động đúng; server-authoritative được giữ.
- [ ] Farm, ao cá, sân gà, hàng rào, đất chưa mua không regression.
- [ ] Có bằng chứng browser QA và test log thật; mobile/zoom được kiểm tra.
- [ ] Không có lỗi nghiêm trọng về FPS, memory, console và assets.
- [ ] Báo cáo file đã đổi, trước/sau, test PASS/FAIL, tồn đọng, commit hash local.

Nếu bất kỳ mục bắt buộc nào chưa đạt, báo cáo **INCOMPLETE / GO WITH FIXES**, không tuyên bố COMPLETE.

## 9. Phân chia triển khai trong MỘT big update

- **CP0** audit và baseline.
- **CP1–CP2** làm terrain + đường đi trước; chốt visual gate trước khi thêm trang trí.
- **CP3** chỉnh bố cục, scale, asset anchors, deco.
- **CP4–CP5** NPC sống động và UX.
- **CP6** test/regression/QA, sửa tới khi đạt DoD.

Có thể chia commit local theo CP để dễ rollback, nhưng bàn giao **một đợt nâng cấp thống nhất**; không push/merge/deploy. Không tự ý làm lại Farm hoặc thay asset đẹp của Chợ.

## 10. Định dạng báo cáo Codex phải trả

1. HEAD/branch trước và sau, tình trạng working tree.
2. Root cause nền hình thoi: file, function, layer, lý do.
3. Bảng thay đổi theo CP: file/asset, lý do, ảnh hưởng gameplay.
4. Danh sách asset mới + nguồn/quyền sử dụng; mô tả texture tiling và render order.
5. Test command + số PASS/FAIL; browser devices/resolutions; FPS/frame time thực đo.
6. Link/path screenshot trước/sau, video hoặc frame sequence.
7. Known issues và đánh giá GO / GO WITH FIXES / NO-GO.
8. Commit hash local; xác nhận **không push, không merge, không deploy**.

## 11. Prompt khởi chạy ngắn cho Codex

> Đọc toàn bộ `BIG_UPDATE_CHO_LANG_IMPLEMENTATION_PLAN.md` trong root repo Nông Trại Làng Việt và screenshot Chợ Làng đính kèm. Tôi phê duyệt triển khai toàn bộ CP0–CP6 trong **một big update**, không chỉ viết kế hoạch. Ưu tiên xóa lưới hình thoi/sọc của scene Chợ, làm terrain cỏ tự nhiên liền mạch, đường làng hữu cơ, bố cục có chiều sâu, NPC đi lại giao thương và UI tương tác tốt. Giữ asset quầy hàng/nhà/cây đa/giếng đã đẹp; không phá Farm và logic server-authoritative. Phải tự chạy browser QA, có ảnh trước/sau, video/chuỗi frame và regression; nếu chưa đạt DoD, báo INCOMPLETE. Commit local khi hoàn tất; không tự push, merge hoặc deploy.

# NÔNG TRẠI LÀNG VIỆT — COMPLETE ISOMETRIC REMAKE PLAN

> **Mục tiêu:** Làm lại toàn bộ trải nghiệm hiển thị của Nông Trại Làng Việt theo tinh thần game nông trại Zing Me đời đầu: góc nhìn isometric 2.5D, màu sắc hoạt hình sáng, ruộng đất/công trình có chiều sâu, HUD gọn, tương tác trực tiếp trên bản đồ. **Không sao chép nguyên xi asset, logo, nhân vật, âm thanh hoặc giao diện độc quyền của game tham khảo.** Tạo tài sản đồ họa mới có bản sắc làng quê Việt Nam.
>
> **Phạm vi:** Frontend rendering, art pipeline, map, character, environment, HUD, UX, animation, QA. **Không triển khai deploy/VPS/Docker/HTTPS**. Giữ nguyên gameplay, backend, SQLite, quyền sở hữu, multiplayer và kinh tế hiện có trừ thay đổi giao thức thật sự cần thiết, có tương thích ngược.

## 0. Quy tắc thực thi bắt buộc

1. Đọc và audit repository hiện tại trước khi thay đổi; lập danh sách module, tọa độ thế giới, Canvas, hit testing, camera, networking, state và test. Không đoán cấu trúc file.
2. Chụp ảnh baseline trên desktop 1366×768 và mobile 390×844; ghi nhận FPS, UI che phủ, chức năng hiện có. Không tự báo PASS nếu chưa chạy.
3. Thực hiện theo checkpoint có thể review; mỗi checkpoint phải build/test được, không xóa gameplay cũ để đổi lấy ảnh đẹp.
4. Không dùng hình chữ nhật, hình tròn, tam giác thô làm asset chính của nhà, cây, ao, chuồng, nhân vật. Primitive chỉ dùng cho debug, overlay, highlight, hiệu ứng đơn giản.
5. Asset phải là file thực trong repo (PNG/WebP/SVG nếu phù hợp, sprite sheet/atlas), có manifest, nguồn gốc, giấy phép hoặc ghi rõ tự tạo. Không hotlink tài sản bên ngoài lúc chạy game. Không sử dụng asset có bản quyền của Zing Farm/Zing Me nếu không có quyền.
6. Không tuyên bố tương đương 100% với ảnh gốc; dùng ảnh người dùng cung cấp làm **tham khảo art direction**, không phải nguồn để trích xuất asset.
7. Không tự push/merge/deploy. Commit local khi đạt điều kiện, ghi rõ các blocker.

## 1. Đích đến về thị giác

### 1.1 Art direction
- **Góc nhìn:** isometric 2.5D, lưới hình thoi, vật thể nổi trên mặt đất, phối cảnh nhất quán.
- **Phong cách:** 2D cartoon nông trại xã hội Việt Nam, màu tươi sáng, nét vẽ sạch, chi tiết vừa đủ để nhìn rõ ở mức zoom gameplay.
- **Bản sắc Việt:** nhà mái ngói, sân gạch, hàng rào tre/gỗ, bụi chuối, cau, tre, luống rau, ao làng, chuồng gà, bờ cỏ, lối đi đất/đá; tránh trộn asset khác phong cách.
- **Ánh sáng:** bóng tiếp xúc dưới nhân vật/công trình, bóng mềm nhất quán theo một hướng; chiều sâu thông qua overlap, không dùng gradient tùy tiện.
- **Tỷ lệ:** định nghĩa tile width/height thống nhất, ví dụ 96×48 pixel ở độ phân giải thiết kế; giá trị cuối cùng do audit và prototype xác nhận, không hardcode khắp codebase.
- **Thiết kế asset:** mỗi loại có silhouette dễ nhận ra, cùng palette, cùng độ sắc nét và cùng tỉ lệ.

### 1.2 Bộ asset tối thiểu (MVP visual)
| Nhóm | Tài sản bắt buộc | Trạng thái |
|---|---|---|
| Terrain | Cỏ 3–5 biến thể, đất, đường đất, sân gạch, đường đá, mép bờ | Tạo mới |
| Farming | Đất chưa cuốc/đã cuốc/đã tưới, ruộng theo từng giai đoạn cây, trạng thái thu hoạch | Tạo mới |
| Building | Nhà chính, kho, chuồng gà, công trình chế biến, hàng rào, cổng | Tạo mới |
| Water | Ao với bờ isometric, mặt nước động, cá/bọt nước, góc và mép bờ | Tạo mới |
| Nature | Cây thân gỗ, bụi cỏ, bụi chuối, tre, hoa, đá, bóng đổ | Tạo mới |
| Characters | Người chơi và NPC: idle/walk 4 hướng, thao tác cuốc/gieo/tưới/gặt | Tạo mới |
| Animals | Gà idle/walk/ăn, cá bơi, trạng thái thu hoạch | Tạo mới |
| UI | Icon công cụ, inventory, nhiệm vụ, tiền, popup, tooltip, menu ngữ cảnh | Tạo mới |

**Quy tắc:** không lấy ảnh screenshot của game tham khảo rồi cắt thành sprite. Nếu pipeline không có công cụ tạo asset chất lượng đủ tốt, phải báo blocker và bàn giao asset specification + placeholder có đánh dấu rõ, **không** tuyên bố visual complete.

## 2. Kiến trúc render và tọa độ

### 2.1 Chuyển hệ tọa độ
- Giữ **world/grid coordinates** là nguồn chân lý cho gameplay và server. Render chuyển grid `(col,row)` sang screen isometric:
  - `screenX = originX + (col - row) * tileWidth / 2`
  - `screenY = originY + (col + row) * tileHeight / 2 - elevation`
- Cung cấp phép đảo `screenToGrid` với camera pan/zoom, CSS pixel ratio, canvas DPR, origin, và offset chính xác.
- Kiểm tra hit-test theo polygon hình thoi và footprint vật thể, không chỉ bounding rectangle.
- Không thay đổi định danh ô đất, tọa độ DB hoặc payload mạng nếu không bắt buộc. Nếu cần migration, lập bảng ánh xạ và test dữ liệu cũ.

### 2.2 Render order và occlusion
- Tách layer: ground → path/farm tiles → decals → object bases → actors/objects Y-sort → canopy/foreground → particles → interaction overlay → HUD DOM.
- Sort theo chân/anchor Y của vật thể; công trình có footprint và anchor riêng.
- Nhân vật phải đi **sau** nhà/cây khi ở phía sau và **trước** khi đứng phía trước.
- Camera pan/zoom, culling vùng ngoài viewport, texture atlas, DPR-aware rendering, tránh jitter khi di chuyển.
- Cơ chế chọn object ưu tiên vật thể foreground hợp lệ; không click xuyên popup/menu.

### 2.3 Di chuyển/pathfinding
- Di chuyển nhân vật theo world/grid hiện có; phép chiếu chỉ ảnh hưởng vẽ và input.
- Pathfinding/điểm chặn phải tôn trọng footprint nhà, ao, chuồng, hàng rào, NPC và vật trang trí.
- Nếu game dùng WASD, cập nhật mapping hướng màn hình isometric một cách dễ hiểu, có tùy chọn hoặc hướng dẫn. Click-to-move nếu có phải chọn đúng điểm đích.
- Multiplayer: remote player position, interpolation và emote hiển thị đúng tọa độ/occlusion; visitor vẫn read-only.

## 3. Thiết kế lại thế giới

### 3.1 Bố cục trang trại
- Nhà chính là focal point, có lối đi, sân, hàng rào và khoảng trống hợp lý.
- Ruộng phải là các ô isometric đúng lưới, phân biệt đất, cây và giai đoạn phát triển; dễ chọn từng ô.
- Ao có mép nước, bờ kè, gợn sóng và cá; chuồng có mái, vách, cửa và gà hoạt động.
- Bổ sung chi tiết nền theo cụm để tránh cảnh trống trải nhưng không làm rối điểm tương tác.
- Vật trang trí có footprint, shadow, overlap và trạng thái đặt/di chuyển hợp lệ.

### 3.2 Animation
- Nhân vật: idle, đi 4 hướng, cuốc, gieo, tưới, thu hoạch; frame rate/anchor ổn định.
- Cây: tăng trưởng theo stage backend, hiệu ứng thu hoạch nhẹ, không làm sai thời gian sinh trưởng.
- Nước: loop nhẹ, gợn và cá; gà có idle/walk/peck; không chạy animation ngoài viewport.
- Weather/day-night/season: đổi palette/overlay/decals có kiểm soát, vẫn đọc được trạng thái đất và cây.
- Audio tùy chọn, mặc định không gây phiền, có mute; chỉ dùng âm thanh có quyền sử dụng.

## 4. UX: tương tác trực tiếp, không có thanh công cụ khổng lồ

### 4.1 HUD
- **Bỏ menu thao tác lớn che bản đồ** hiện tại. Không chỉ thu nhỏ rồi đặt chồng ở vị trí khác.
- Header gọn: tiền, giờ/mùa, nhiệm vụ, menu; tự co trên mobile.
- Bottom dock icon nhỏ cho túi đồ/cửa hàng/xây dựng/bạn bè nếu cần; không che ô đất đang thao tác.
- Popup có chiều rộng phù hợp viewport, có đóng/ESC, không chặn camera khi đã đóng; tooltip rõ ràng.

### 4.2 Contextual interaction
| Đối tượng/trạng thái | Hành động hiển thị |
|---|---|
| Đất chưa cuốc | Cuốc |
| Đất đã cuốc, chưa gieo | Chọn giống → gieo |
| Cây cần nước | Tưới |
| Cây chín | Thu hoạch |
| Ao cá | Xem cá, cho ăn, thu hoạch theo điều kiện |
| Chuồng gà | Xem gà, cho ăn, thu trứng theo điều kiện |
| Công trình | Xem, chế biến, nhận thành phẩm |
| Trang trí | Xem, di chuyển/xoay khi có quyền và chế độ phù hợp |
| Farm người khác | Xem, tương tác xã hội hợp lệ; **không** sửa tài sản |

- Tap/click một lần mở menu nhỏ gần đối tượng, tự điều chỉnh để không tràn màn hình; chỉ hiện thao tác hợp lệ, kèm trạng thái disabled và lý do.
- Không buộc người chơi phải nhớ phím tắt; có onboarding ngắn, replayable.

### 4.3 Giữ và kéo hàng loạt
- Sau khi chọn thao tác cho ô đầu tiên, kéo qua các ô lân cận để áp dụng cùng hành động; hiển thị đường đi/preview ô hợp lệ.
- **Phân biệt pan camera và paint action:** mặc định drag nền là pan; chỉ khi đã chọn action mode mới được kéo để tác động ô. Trên mobile dùng ngưỡng di chuyển và long-press hoặc action mode rõ ràng, tránh thao tác nhầm.
- Mỗi ô chỉ xử lý một lần trong một gesture; bỏ qua ô không hợp lệ, báo kết quả thành công/thất bại theo ô; không trừ vật phẩm hai lần.
- Có cancel (ESC/nút X), giới hạn số ô/lượt, throttling/batching, chống spam và kiểm tra server-authoritative cho từng ô.
- Giữ tính idempotency, transaction, ownership, permission, inventory; kiểm tra reconnect giữa chừng và rollback/partial success rõ ràng.
- Với ao/chuồng, hỗ trợ thao tác theo ngữ cảnh; không giả định có nhiều ô nếu mỗi công trình là một entity.

## 5. Tổ chức code và tài nguyên

- Đề xuất module (điều chỉnh theo repo thật): `IsoProjection`, `Camera`, `TileRenderer`, `ObjectRenderer`, `SpriteAtlas`, `AnimationController`, `HitTest`, `InteractionController`, `GestureController`, `ContextMenu`, `AssetManifest`.
- Có một nguồn cấu hình tile size, sprite anchor, footprint, z-order, collision và animation frames.
- Tài nguyên lưu trong `public/assets/` hoặc vị trí hiện hữu hợp lý, có `assets/manifest.json` và tài liệu nguồn gốc.
- Có fallback asset lỗi tải, log cảnh báo, preload các asset cần thiết, lazy-load phần phụ.
- Không để game vừa vẽ sprite mới vừa giữ các shape cũ nổi chồng lên nhau.

## 6. Lộ trình triển khai và checkpoint

### CP0 — Audit + baseline (bắt buộc)
- Inventory modules, test coverage, state flows, camera, network messages, DB keys.
- Lưu screenshot và video ngắn baseline; liệt kê rủi ro thay đổi hệ tọa độ.
- **Gate:** kế hoạch ánh xạ grid ↔ iso và danh sách asset được duyệt.

### CP1 — Isometric prototype
- Render lưới isometric có camera, pan/zoom, hit test, player movement, occlusion mẫu.
- Giữ tương thích với dữ liệu farm hiện có.
- **Gate:** chọn đúng 100 ô kiểm thử ở nhiều zoom/DPR; nhân vật đi đúng; không click lệch.

### CP2 — Asset pack + environment
- Tạo/integrate asset thật theo art direction, manifest, animation frames, nhà, ruộng, ao, chuồng, cây.
- **Gate:** screenshot không còn placeholder hình học ở các đối tượng chính; art style nhất quán.

### CP3 — Characters + animals + VFX
- Sprite sheet và animation cho người chơi/NPC/gà/cá; Y-sort, bóng, thời tiết, mùa.
- **Gate:** screenshot + video thể hiện idle/walk/action, không xuyên vật thể.

### CP4 — HUD + contextual interactions
- Bỏ toolbar cũ; menu ngữ cảnh; action drag PC/touch; túi đồ, xây dựng, crafting, nhiệm vụ và social còn truy cập được.
- **Gate:** 10 thao tác gameplay cốt lõi hoàn thành không cần toolbar cũ.

### CP5 — QA, performance, polish
- Chạy toàn bộ test hiện có, thêm test iso/gesture/security, test đa thiết bị, multiplayer, reconnect.
- Chơi thử thực tế và sửa các lỗi thị giác/phản hồi.
- **Gate:** đạt Definition of Done ở mục 8.

## 7. Test matrix bắt buộc

**Unit/integration:**
- grid→screen→grid roundtrip; camera zoom/pan/DPR; polygon hit test; tile edge cases; footprint; Y-sort; animation state.
- Farming cuốc/gieo/tưới/gặt đơn ô và batch; đủ/thiếu hạt, tiền, năng lượng; duplicate tile; drag out-of-bounds; cancel; reconnect.
- Ao/gà/crafting/building/decor/quest/shop; server validation; idempotency; quyền sở hữu; visitor read-only.

**Browser QA:**
- Desktop 1366×768, 1920×1080, 1280×720; mobile 390×844 và 360×800; browser zoom 100%/125%; DPR 1/2 nếu môi trường hỗ trợ.
- Mouse, touch, long-press, drag, camera pan, popup, menu overflow, keyboard, scroll/touch-action.
- Hai tài khoản: chủ farm và khách; movement/animation đồng bộ; không thể sửa farm khách.
- Chơi thử ít nhất 20 phút theo hành trình: login → cuốc → gieo → tưới → thu hoạch → bán → cho cá/gà ăn → nhận sản phẩm → chế biến → xây dựng/trang trí → thăm farm.
- Benchmark FPS/frame time/heap ít nhất 10 phút, so với baseline; ghi thiết bị, trình duyệt và phương pháp; không giả định test mobile giả lập = điện thoại thật.

**Visual QA bắt buộc:**
- Ảnh trước/sau cùng viewport, camera và state, ít nhất 6 cảnh: toàn farm, nhà, ruộng, ao, chuồng, popup/mobile.
- Video 30–60 giây thể hiện di chuyển isometric, occlusion, tương tác ruộng và animation.
- Review thủ công silhouette, consistency, tỷ lệ, layering, clipping, aliasing, khả năng đọc UI; liệt kê lỗi còn lại.

## 8. Definition of Done — KHÔNG được tự đánh dấu COMPLETE nếu thiếu

- [ ] Game hiển thị isometric 2.5D thực sự; grid, input, camera và world state nhất quán.
- [ ] Nhà, ruộng, ao, chuồng, cây, nhân vật dùng asset đồ họa hoàn thiện, không còn shape prototype làm hình chính.
- [ ] Có asset manifest, thông tin nguồn gốc/quyền sử dụng, sprite/animation pipeline.
- [ ] Nhân vật/NPC/vật nuôi có chuyển động phù hợp và occlusion chính xác.
- [ ] Thanh menu lớn biến mất; HUD gọn; contextual menu cho đất/ao/chuồng/công trình.
- [ ] Giữ-kéo hàng loạt hoạt động trên PC/touch, không nhầm với pan, không trùng thao tác.
- [ ] Backend/DB/economy/multiplayer/permissions vẫn hoạt động, không mất dữ liệu cũ.
- [ ] Automated tests và browser regression chạy thực tế; báo pass/fail trung thực.
- [ ] Có ảnh trước/sau và video QA, có thử nghiệm chơi ít nhất 20 phút.
- [ ] Có báo cáo performance, lỗi còn lại, và đánh giá GO / GO WITH FIXES / NO-GO.
- [ ] Tài liệu được cập nhật, commit local; không push/merge/deploy khi chưa được yêu cầu.

## 9. Bàn giao bắt buộc

1. Code và asset pack trong repo; manifest và giấy phép/nguồn gốc asset.
2. `ISOMETRIC_REMAKE_REPORT.md`: thiết kế tọa độ, renderer, camera, collision, compatibility.
3. `ISOMETRIC_REMAKE_REPORT.md`: palette, tile sizes, anchors, sprite specs, UI rules.
4. `ISOMETRIC_REMAKE_REPORT.md`: command và kết quả test thực tế, screenshots/video paths, FPS, blockers.
5. `ISOMETRIC_REMAKE_REPORT.md`: checklist CP0–CP5 và công việc còn thiếu.
6. Commit SHA local; không push/merge.

## 10. Prompt giao AI coding

> Đọc `ZING_FARM_COMPLETE_REMAKE_PLAN.md` và audit toàn bộ source trước khi sửa. Mục tiêu là remake phần hiển thị của Nông Trại Làng Việt thành game nông trại isometric 2.5D hoạt hình theo tinh thần game nông trại Zing Me, nhưng asset và nhận diện phải là tác phẩm mới mang bản sắc làng quê Việt Nam. Thực hiện CP0–CP5, không chỉ đổi CSS. Tạo/integrate asset thật, renderer isometric, camera, hit testing, nhân vật/động vật animation, HUD gọn, menu ngữ cảnh và kéo thao tác nhiều ô. Giữ nguyên gameplay, SQLite, kinh tế, quyền và multiplayer. Chạy automated/browser/visual QA, tạo ảnh trước-sau và video, cập nhật tài liệu. Nếu không thể tạo asset đạt chất lượng, báo blocker thay vì tuyên bố COMPLETE. Chỉ commit local; không push/merge/deploy. Báo cáo GO/GO WITH FIXES/NO-GO có bằng chứng.

# NÔNG TRẠI LÀNG VIỆT — FARM & VILLAGE MARKET VISUAL OVERHAUL

Repository: https://github.com/leem8888/nong-trai-lang-viet

Baseline commit: `1bd1efb9c6f641204d7c0d94012550ce725bc248`

## MỤC TIÊU

Tôi đã xem bản remake isometric mới nhất. Màn hình đăng nhập đã đẹp, sprite nhân vật, nhà cửa, ao cá và chuồng gà đã cải thiện đáng kể.

TUY NHIÊN:
- Bố cục sân nhà hiện tại rất xấu, thiếu cân đối.
- Bản đồ quá trống, nền xanh đơn điệu.
- Các công trình nhỏ và rời rạc so với không gian màn hình.
- Chợ làng sơ sài, ba gian hàng gần như giống hệt nhau.
- Thiếu không khí sinh hoạt của một làng quê Việt Nam.

Hãy thực hiện một đợt VISUAL OVERHAUL tập trung vào FARM SCENE và MARKET SCENE.

Phong cách mục tiêu: game nông trại Zing Me cổ điển, isometric 2.5D, hoạt hình tươi sáng, nhiều chi tiết, ấm cúng, có bản sắc làng quê Việt Nam. Tạo tài nguyên nguyên bản, không sao chép asset có bản quyền.

## PHẦN 1 — THIẾT KẾ LẠI SÂN NHÀ

1. Thiết kế lại bố cục tổng thể của nông trại.

- Nhà chính là điểm nhấn thị giác.
- Sắp xếp ruộng trồng, ao cá, chuồng gà và lối đi thành bố cục hài hòa.
- Có sân trước nhà, đường đất kết nối các khu chức năng.
- Thêm cây xanh, bụi hoa, hàng rào tre, đá nhỏ, thảm cỏ, đồ dùng nông thôn.
- Không để các công trình nằm rời rạc giữa một vùng nền trống.
- Không làm mất khả năng mở rộng hoặc xây dựng công trình của người chơi.

2. Cải thiện địa hình.

- Giảm cảm giác bản đồ là một lưới hình thoi lặp lại.
- Sử dụng ground tiles, grass variations, dirt paths và terrain transitions.
- Lưới chỉ hiển thị rõ khi người chơi thao tác với đất hoặc xây dựng.
- Có bóng đổ, lớp foreground/background và chi tiết môi trường.
- Địa hình phải tự nhiên, không lặp texture quá lộ liễu.

3. Cải thiện camera và tỷ lệ.

- Đưa khu vực quan trọng vào khung hình hợp lý.
- Không để nông trại quá nhỏ so với màn hình.
- Điều chỉnh zoom mặc định theo viewport.
- Không phóng to sprite quá mức gây mờ.
- Giữ chính xác hit-testing, drag-to-act, collision và tọa độ server.

4. Bổ sung sức sống.

- Hiệu ứng lá cây chuyển động nhẹ.
- Cá bơi, gà chuyển động trong khu vực phù hợp.
- Bướm, chim, bụi cỏ, hoa và các chi tiết nhỏ.
- Hiệu ứng ngày/đêm, mùa và thời tiết phù hợp với môi trường.
- Có tùy chọn giảm hiệu ứng và không làm giảm FPS đáng kể.

5. Giữ nguyên sprite hiện tại nếu đã đẹp. Chỉ thay những asset chưa đạt chất lượng.

## PHẦN 2 — THIẾT KẾ LẠI CHỢ LÀNG

Chợ làng phải trở thành một địa điểm có bản sắc riêng, KHÔNG phải ba gian hàng giống nhau đặt trên nền đất trống.

Thiết kế tối thiểu ba quầy hàng có nhận diện hoàn toàn khác nhau:

A. QUẦY HẠT GIỐNG
- Mái tre hoặc mái lá.
- Các giỏ hạt giống, bao thóc, cây giống, khay rau.
- Màu sắc thiên về xanh lá, nâu gỗ.
- Bảng hiệu riêng ghi "Hạt giống".
- NPC bán hạt giống có trang phục và hoạt ảnh phù hợp.

B. QUẦY THU MUA NÔNG SẢN
- Gian hàng rộng, có mái che và bàn cân.
- Thúng rau, sọt trái cây, bao lúa, giỏ nông sản.
- Màu sắc ấm, nhiều sản phẩm trưng bày.
- Bảng hiệu riêng ghi "Thu mua".
- NPC thu mua có ngoại hình riêng.

C. QUẦY ĐƠN HÀNG
- Thiết kế như trạm giao nhận hàng làng quê.
- Có bảng thông báo, thùng hàng, xe kéo hoặc giỏ vận chuyển.
- Bảng hiệu riêng ghi "Đơn hàng".
- NPC phụ trách đơn hàng có ngoại hình riêng.

Yêu cầu bắt buộc:
- Không sử dụng cùng một sprite gian hàng rồi chỉ đổi tên.
- Mỗi quầy phải khác silhouette, kiến trúc, mái, hàng hóa và bảng màu.
- Các NPC không được trùng ngoại hình.
- Phải có không gian đi lại và tương tác thuận tiện.

Thiết kế thêm môi trường chợ:
- Đường làng, sân chợ, cây bóng mát, hàng rào, đèn lồng hoặc cờ trang trí phù hợp.
- Một số chi tiết sinh hoạt như giỏ hàng, xe kéo, thúng, mẹt, chum gốm.
- Không gian chợ có điểm nhấn thị giác và cảm giác đang hoạt động.
- Không đặt vật trang trí cản trở NPC, người chơi hoặc vùng tương tác.

## PHẦN 3 — CHUẨN HÓA ART DIRECTION

- Thống nhất góc nhìn isometric, tỷ lệ tile và ground anchor.
- Thống nhất ánh sáng, đổ bóng, màu sắc và độ chi tiết.
- Đảm bảo sprite công trình, NPC và vật trang trí không lệch phong cách.
- Sửa lỗi Y-sorting, occlusion và vật thể nổi/lún khỏi mặt đất.
- Tạo asset mới bằng quy trình có thể tái tạo và lưu manifest nguồn gốc.
- Không quay lại dùng Canvas primitive làm hình ảnh chính của môi trường.

## PHẦN 4 — GIỮ NGUYÊN GAMEPLAY

KHÔNG được phá:
- Đăng nhập, đăng ký, tạo nhân vật.
- SQLite và dữ liệu hiện có.
- Tiền Đồng Làng, giao dịch và đơn hàng.
- Cuốc đất, gieo hạt, tưới, thu hoạch.
- Giữ và kéo để thao tác nhiều ô.
- Ao cá, chuồng gà, chế biến, xây dựng, trang trí.
- NPC, nhiệm vụ, thời tiết, mùa.
- Multiplayer, thăm farm và phân quyền.

Không thay đổi backend hoặc database schema nếu không thực sự cần thiết.

Không reset dữ liệu người chơi.

## PHẦN 5 — VISUAL QA BẮT BUỘC

Không được chỉ chạy automated tests rồi kết luận COMPLETE.

Phải mở game bằng browser thực tế và kiểm tra tối thiểu:

1. Farm desktop 1920×1080.
2. Farm desktop 1366×768.
3. Farm mobile 390×844.
4. Chợ làng desktop.
5. Chợ làng mobile.
6. Farm ban ngày.
7. Farm ban đêm.
8. Farm khi trời mưa.
9. Farm sau khi trồng cây và xây dựng thêm công trình.
10. Chợ khi người chơi tương tác với từng NPC.

Phải tạo screenshot BEFORE/AFTER tương ứng cùng viewport, cùng scene, camera và trạng thái có thể so sánh.

Phải kiểm tra:
- Tỷ lệ và bố cục.
- Các khoảng trống bất hợp lý.
- Sprite bị che hoặc đè sai.
- Hitbox của nhà, ruộng, ao, chuồng và quầy chợ.
- Camera zoom, pan và thao tác chuột/cảm ứng.
- FPS, bộ nhớ và lỗi console.
- Regression Phase 1–8.

Đặc biệt: hãy tự đánh giá bằng hình ảnh xem chợ làng đã có ba quầy hàng THỰC SỰ KHÁC NHAU hay chưa.

## PHẦN 6 — DELIVERABLES

Tạo:
- `FARM_MARKET_VISUAL_REPORT.md`
- `FARM_MARKET_VISUAL_REPORT.md`
- Screenshot trước/sau cho farm và market.
- Asset manifest cập nhật.
- Danh sách file thay đổi.
- Danh sách các vấn đề còn tồn tại.

## DEFINITION OF DONE

Chỉ đánh dấu COMPLETE khi:

- Sân nhà có bố cục cân đối, không còn trống trải.
- Camera hiển thị nông trại với tỷ lệ hợp lý.
- Địa hình có chiều sâu và nhiều chi tiết tự nhiên.
- Ba quầy chợ có thiết kế khác biệt rõ rệt.
- Các khu vực có cùng chất lượng mỹ thuật.
- Không xuất hiện lỗi che khuất hoặc sai tọa độ nghiêm trọng.
- Gameplay cũ vẫn hoạt động.
- Browser QA và regression tests đạt.
- Có ảnh trước/sau chứng minh kết quả.

Nếu chưa đạt, tiếp tục chỉnh sửa hoặc báo cáo INCOMPLETE. Không tự tuyên bố hoàn thành chỉ vì code chạy được.

## CÁCH TRIỂN KHAI

1. Audit source và baseline commit hiện tại.
2. Chụp ảnh baseline.
3. Lên bố cục sân nhà và chợ làng.
4. Tạo/tích hợp asset mới.
5. Cập nhật renderer, camera, placement và môi trường.
6. Kiểm thử bằng browser.
7. Tự đánh giá screenshot, chỉnh sửa các vấn đề thị giác.
8. Chạy regression.
9. Cập nhật báo cáo.
10. Commit local nếu đạt.

Ưu tiên chất lượng hình ảnh và trải nghiệm người chơi hơn số lượng tính năng hoặc số dòng code.

Hãy triển khai thực tế, không chỉ lập kế hoạch.
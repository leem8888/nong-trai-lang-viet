# Nông Trại Làng Việt — GDD

## Phase 6 — Làng Việt sống động

Bốn NPC (Bác Tư, Cô Lan, Ông Ba, Bé Na) xuất hiện theo lịch sáng/trưa/chiều/tối với hội thoại theo nhiệm vụ và mùa. Tuyến “Một ngày ở làng” gồm năm nhiệm vụ tuần tự: gặp Bác Tư, thu hoạch, giao nông sản cho Cô Lan, nghe Ông Ba, giúp Bé Na. Hai việc phụ thu hoạch và trò chuyện Cô Lan làm mới theo ngày UTC, chỉ một phần thưởng mỗi loại/ngày. Tiến trình và thưởng được server xác nhận, ví/kho/audit cập nhật nguyên tử. Ngày thế giới 24 phút thực, ba trạng thái thời tiết theo slot 8 phút, bốn mùa theo chu kỳ 7 ngày thực mỗi mùa. Mọi thay đổi thời tiết/mùa chỉ là hình ảnh và lời thoại; cơ chế offline và kinh tế Phase 1–5 giữ nguyên.

Phiên bản thiết kế: 0.1, Phase 1. Quyết định sản phẩm được duyệt nằm trong `PROJECT_MASTER_CONTEXT.md`; tài liệu này mô tả chi tiết có thể phát triển tiếp.

## Trải nghiệm mục tiêu

Người chơi đăng ký tài khoản, đặt tên nông trại và bước vào một khu đất riêng mang sắc thái làng quê Việt Nam. Phase 1 cho phép đi lại, xem bảng thông tin, mở panel ngôi nhà và bật/tắt đèn sân. Trạng thái đèn và vị trí được lưu.

## Bản đồ đầu tiên

Bản đồ 1440 × 1024 pixel, góc nhìn từ trên xuống. Nhà mái ngói và sân gạch ở trung tâm; ruộng trống ở góc tây nam; đất dự kiến làm ao và chuồng ở phía đông. Hàng rào tre bao quanh. Kích thước này là mặc định kỹ thuật Phase 1, chưa phải quyết định cân bằng cuối cùng.

## Điều khiển

WASD hoặc phím mũi tên để đi; E để tương tác gần vật thể; có thể nhấp vật thể để tương tác khi đứng đủ gần. Camera theo nhân vật. Client hiển thị prompt theo khoảng cách; server kiểm tra tương tác làm thay đổi dữ liệu.

## Dữ liệu và quyền

Mỗi tài khoản sở hữu tối đa một farm. Farm mặc định riêng tư. Tất cả truy cập API và Socket.IO được xác thực, kiểm tra quyền sở hữu. Giờ server UTC là nguồn thời gian cho Phase 2; Phase 1 chưa có cây trồng.

## Các phase sau

Lộ trình và phạm vi đã khóa trong `PROJECT_MASTER_CONTEXT.md`. Số liệu cây trồng Phase 2 đang là giả thuyết cần chơi thử.

## Phase 2 — Trồng trọt thử nghiệm

Khu ruộng gồm 15 ô ở phía tây nam. Chọn cuốc (phím 1), hạt giống (2), bình tưới (3) hoặc thu hoạch (4), rồi đứng gần và nhấp ô. Đất đi theo chuỗi `EMPTY → TILLED → WATERED` hoặc `TILLED/WATERED → PLANTED → TILLED` sau thu hoạch. Tưới cây đang trồng giữ trạng thái `PLANTED` và lưu `watered_at`.

Sáu cây: lúa 90 phút, rau cải 15, cà chua 45, cà rốt 25, ngô 60, đậu nành 35. Đây là **giá trị thử nghiệm**, không phải cân bằng đã duyệt. Mỗi lần gieo lưu thời lượng và sản lượng riêng; thay cấu hình về sau không đổi cây đã trồng. Các giai đoạn theo tỷ lệ thời gian: `SEED` 0–25%, `SPROUT` 25–60%, `GROWING` 60–100%, `MATURE` từ 100%. Cây trưởng thành không hỏng do vắng mặt.

Tưới tối đa **một lần cho mỗi cây**, giảm thời lượng trưởng thành 10%. Tưới đất trước khi gieo cho cùng lợi ích khi gieo; tưới tiếp không cộng dồn. Cây vẫn lớn bình thường nếu không tưới. Mọi thời điểm lấy từ server UTC và tính lại khi tải farm hoặc thu hoạch. Client chỉ dự đoán hình ảnh bằng mốc giờ server và bộ đếm đơn điệu.

Mỗi farm nhận 4 hạt của từng loại khi tạo farm hoặc khi migration v2 áp dụng cho farm cũ. Khi **hết toàn bộ hạt**, người chơi có thể nhận một gói 2 hạt mỗi loại tối đa một lần mỗi ngày UTC. Đây là cơ chế thử nghiệm để không bị kẹt trước khi cửa hàng Phase 3 xuất hiện; không có tiền hay giao dịch. Túi đồ chứa hạt và nông sản, mỗi loại tối đa 999. Thu hoạch, cộng vật phẩm và chuyển đất về trạng thái đã cuốc nằm trong một transaction.

## Phase 3 — Chợ quê và Đồng Làng

Người chơi theo lối đi phía nam farm tới cổng chợ, đi trong bản đồ chợ và tương tác gần quầy hạt của **Cô Mai**, quầy thu mua của **Cô Lan** hoặc bảng đơn hàng. Cổng phía nam chợ đưa về farm. Chợ mở liên tục để không chặn vòng trồng → thu hoạch → bán → mua giống. Mỗi ngày UTC có một nông sản nổi bật được thu mua cao hơn 15%; giá và lịch do server quyết định.

Ví của mỗi tài khoản được cấp **200 Đồng Làng** một lần. Tiền là số nguyên; ví không âm và có trần 9 nghìn tỷ. Mọi mua, bán, hoàn thành đơn và cấp tiền khởi đầu đều có sổ giao dịch. Client gửi ý định và request ID; server tính giá, kiểm tra vị trí/kho/ví rồi ghi tiền, hàng, đơn và biên nhận trong một transaction. Retry cùng ID trả lại kết quả cũ mà không xử lý lần hai.

| Cây | Giá hạt | Giá bán cơ bản / đơn vị | Sản lượng | Lợi nhuận / vụ | Phút / vụ |
|---|---:|---:|---:|---:|---:|
| Lúa | 65 | 45 | 3 | 70 | 90 |
| Rau cải | 14 | 12 | 2 | 10 | 15 |
| Cà chua | 45 | 25 | 3 | 30 | 45 |
| Cà rốt | 19 | 18 | 2 | 17 | 25 |
| Ngô | 35 | 35 | 2 | 35 | 60 |
| Đậu nành | 35 | 22 | 3 | 31 | 35 |

Giá và sản lượng trên là **giả thuyết playtest**, chưa cân bằng cuối cùng. `npm run economy:report` tính thêm lợi nhuận theo giờ; lúa có lợi nhuận tuyệt đối cao hơn, đậu nành có lợi nhuận theo giờ cao hơn. Sáu mẫu đơn hàng NPC có thể nhận và hoàn thành **một lần mỗi farm**, không có deadline. Phần thưởng cố định cao hơn tổng giá bán cơ bản của nguyên liệu; không có farm tiền lặp vô hạn từ đơn. Gói hạt miễn phí Phase 2 vẫn là lối thoát giới hạn khi hết toàn bộ hạt, tối đa một lần mỗi ngày UTC.

## Phase 4 — Vườn, ao, chuồng

Mỗi farm có một ao ở phía đông nam và một chuồng gà ở phía đông bắc, dùng lại vùng đất đã dự trù; 15 ô ruộng và trạng thái cũ không đổi. Đứng gần ao hoặc chuồng và nhấn E/nhấp để mở bảng. NPC chợ bán cá giống, gà con và thức ăn; thu mua cá và trứng. Các giá dưới đây là **giả thuyết playtest**.

| Vật nuôi | Chi phí giống | Thời gian lớn | Sản lượng | Giá bán/đơn vị | Sức chứa |
|---|---:|---:|---:|---:|---:|
| Cá rô phi | 30 | 90 phút | 2 cá | 32 | Ao tối đa 6 cá |
| Cá chép | 55 | 150 phút | 2 cá | 45 | Ao tối đa 6 cá |
| Gà con | 70 | 120 phút | Trứng theo chu kỳ | 23 | Chuồng tối đa 4 gà |

Cá lớn theo thời gian UTC server, kể cả khi vắng mặt và không chết vì thiếu thức ăn. Mỗi con cá được cho ăn **một lần**, tốn 1 thức ăn cá (mua 8 Đồng), giảm 10% thời lượng nuôi nhưng không đặt mốc hoàn thành trước thời điểm cho ăn. Thu hoạch mỗi con cho sản lượng snapshot của lúc thả; ao trống để thả lứa tiếp.

Gà lớn sau 120 phút UTC dù không cho ăn. Gà trưởng thành cần 1 thức ăn gà (mua 8 Đồng) để bắt đầu chu kỳ trứng: mỗi 45 phút có 1 trứng, tối đa **3 trứng chờ mỗi con** dù offline nhiều ngày. Sau khi đủ ba trứng và nhặt hết, có thể cho ăn lại. Không có timer riêng cho từng con; server tính số trứng từ mốc cho ăn và số đã nhặt. Gà không chết khi người chơi vắng mặt.

Liên kết VAC: 1 đậu nành → 2 thức ăn cá; 1 ngô hoặc 1 lúa → 2 thức ăn gà. Chuyển đổi là thao tác tức thời tại ao/chuồng, dùng inventory Phase 2 và transaction SQLite; không phải hệ crafting Phase 5. Mua/bán dùng ví và sổ giao dịch Phase 3; thao tác VAC có sổ sự kiện và receipt riêng để retry an toàn. `npm run economy:report` so sánh lợi nhuận cây, cá và chu kỳ trứng. Với giá thử nghiệm, một gà con cần khoảng hai chu kỳ trứng để hoàn vốn.

## Phase 5 — chế biến và bố trí farm

Đây là **cấu hình playtest**, không phải giá trị cân bằng đã duyệt. Công thức lưu ở `public/js/shared/phase5.js`, server quyết định đầu vào, đầu ra, số lượng và thời lượng. Mapping item: lúa `rice` → gạo `milled_rice`; ngô `corn` → `corn_flour`; đậu nành `soy` → `soy_milk`; cà chua `tomato` → `tomato_sauce`; cá rô phi `tilapia` → `dried_fish`; gạo `milled_rice` + trứng `egg` → `fried_rice`. Sáu công thức tương ứng dùng 2/2/2/2/1/2 nguyên liệu, xuất 2/2/2/2/1/1 thành phẩm, mất 2/2/2,5/2,5/3/3 phút mỗi mẻ. Chạy `npm run economy:phase5` để xem doanh thu, chi phí cơ hội và biên lợi nhuận; hiện lần lượt +20/+20/+16/+20/+13/+22 Đồng so với bán nguyên liệu trực tiếp, chưa tính đầu tư công trình và thời gian trồng.

Cối xay (`mill`, 2×2, 1 slot, 90 Đồng), bếp quê (`kitchen`, 2×2, 2 slot, 110 Đồng), giàn phơi (`rack`, 2×1, 1 slot, 70 Đồng) có thời lượng và sản lượng snapshot khi bắt đầu job. Job `PROCESSING` được tính thành `READY` theo UTC server khi đọc; nhận thành phẩm là transaction duy nhất, thất bại vì kho đầy thì vẫn chờ. Không thể di chuyển/cất công trình khi còn job chưa nhận. Cất công trình đã rảnh chuyển nó thành `building_*` trong inventory; đặt lại tiêu thụ vật trong túi thay vì trả thêm tiền. Job đã nhận của công trình bị cất được xóa khỏi bảng job (sổ giao dịch xây dựng vẫn giữ trong economy ledger).

15 trang trí: hàng rào tre, cổng tre, đường gạch, đường đá, lu nước, chậu sen, hoa cúc, hoa mười giờ, ghế gỗ, đèn lồng, bụi chuối, cây cau, giàn hoa giấy, biển tên, đống rơm. Mua `decor_*` tại chợ; đặt tiêu thụ 1 vật, cất trả 1 vật vào túi, di chuyển không đổi số lượng. Đường và một số hoa không chặn di chuyển; vật còn lại chặn. Vật đặt lưu trong `farm_decorations`, công trình trong `farm_buildings`, không dùng `farm_objects` của Phase 1 vì bảng đó chỉ lưu trạng thái đèn cố định.

Map gốc 1440×1024 và các vật cố định giữ nguyên. Vùng ban đầu cho đặt ở cột tile 12–20, cấp 1 mở cột 2–11 giá 180 Đồng, cấp 2 mở cột 21–27 giá 280 Đồng; hàng 2–18. Các vùng chưa mở hiển thị tối. Khu ruộng, nhà, ao, chuồng, hành lang trung tâm, vật cản cũ và vật đã đặt đều cấm chồng lên; kiểm tra đường đi từ spawn đến cổng, ruộng, ao, chuồng bằng flood fill trên server. Người chơi vẫn có thể đi qua vùng chưa mở; cấp mở đất quản lý **quyền đặt vật**, không khóa di chuyển. Giá và giới hạn này có thể chỉnh theo playtest.

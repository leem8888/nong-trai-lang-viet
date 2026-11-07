# Nông Trại Làng Việt

Cập nhật 07/11/2026: chuối, hoạt ảnh cá/hái xoài, nhà v7, khuôn viên hàng xóm, dấu đích di chuyển, schema v13 và bỏ giới hạn chọn 25 ô. Kiểm thử Node 131/131 và browser garden visual QA đạt. Xem [báo cáo thay đổi và kiểm thử](docs/UI_GAMEPLAY_UPDATES_2026-11-07.md).

> Đợt Terrain/Land/Fence/Gate và Living Farm hiện **INCOMPLETE** và được chia sẻ để review theo yêu cầu. Xem [bàn giao hiện tại](docs/HANDOFF.md), [QA địa hình](docs/TERRAIN_LAND_FENCE_QA_REPORT.md) và [QA ao/sân gà](docs/LIVING_FARM_VISUAL_QA.md) trước khi đánh giá hoặc phát hành.

Game nông trại web 2.5D isometric đang được hoàn thiện. Phase 1–3 có tài khoản/farm riêng, trồng cây và chợ NPC; Phase 4 thêm VAC, Phase 5 thêm chế biến/xây dựng, Phase 6 thêm NPC, nhiệm vụ và nhịp sống làng. Xem [tiến độ remake](docs/ISOMETRIC_REMAKE_REPORT.md) trước khi đánh giá trạng thái nghiệm thu đồ họa.

Phase 7 trên `main`: nút **Thăm farm** cho tìm nông trại mở cửa hoặc cần duyệt. Chủ đặt quyền `Riêng tư`, `Cần duyệt` hoặc `Công khai`, xem yêu cầu, mời người chơi bằng tên tài khoản và mời khách rời đi. Khách được đi dạo, vẫy tay và về farm mình; không được sửa ruộng, kho, ví, công trình hay nhận thưởng lúc đang thăm. Mỗi farm tối đa 8 khách hiện diện. `npm run qa:phase7` chạy Edge/Playwright với 3 tài khoản và SQLite tạm; xem [báo cáo Phase 7 gồm QA và API](docs/PHASE7_REPORT.md).

Phase 6: nút **Nhiệm vụ** mở tuyến “Một ngày ở làng” gồm 5 nhiệm vụ chính và 2 nhiệm vụ phụ làm mới mỗi ngày UTC. Nhấp Bác Tư, Cô Lan, Ông Ba hoặc Bé Na để nhân vật tự đi tới trò chuyện; **E** dùng được khi đứng gần. HUD hiển thị giờ thế giới, thời tiết và mùa; nút **Giảm hiệu ứng** tắt mưa động. Một ngày thế giới dài 24 phút thực; thời tiết đổi theo slot 8 phút, mỗi mùa dài 7 ngày thực. Các hiệu ứng này chỉ đổi cảnh và lời thoại, không đổi tốc độ cây/VAC/chế biến. Xem [báo cáo QA Phase 6](docs/PHASE6_REPORT.md) để chạy kiểm thử.

## Tài liệu

Các tài liệu nằm trong [`docs/`](docs/). Bắt đầu từ [tiến độ triển khai](docs/IMPLEMENTATION_PROGRESS.md), [bàn giao](docs/HANDOFF.md), [checklist QA](docs/QA_CHECKLIST.md) và [cập nhật tương tác nông trại](docs/CONTEXTUAL_UX_REPORT.md). Các kế hoạch Phase 1–9 vẫn được giữ riêng.

## Yêu cầu

Node.js 20+, npm. Cài dependency bằng `npm install` hoặc `npm ci`. `node_modules` không được đưa lên GitHub.

## Chạy

```sh
npm install
npm start
```

Mở `http://localhost:3000`. Dùng `npm run dev` để tự khởi động lại server khi sửa code. Đặt `PORT` nếu cần đổi cổng. Đặt `DB_FILE` thành đường dẫn SQLite riêng nếu không dùng `data/farm.sqlite`. Đặt `NODE_ENV=production` sau reverse proxy HTTPS để cookie dùng cờ `Secure`; production cần HTTPS thực và nơi lưu database bền vững.

`data/starter.sqlite` được lưu trong Git, chứa schema khởi đầu và **không có tài khoản, mật khẩu hay session**. Lần chạy đầu, server sao chép file này thành `data/farm.sqlite`. Dữ liệu chơi cá nhân nằm trong `data/farm.sqlite` và không tự đồng bộ qua Git. Mỗi máy/nhánh dùng cùng schema khởi đầu; dùng backup riêng nếu muốn chuyển tiến độ chơi giữa các máy.

## Tài khoản Admin cho phát triển

Chạy `npm run dev` để bật `NODE_ENV=development`. Khi mở database lần đầu, game tạo tài khoản **admin / admin**, role `ADMIN`, nông trại sẵn chơi và 999.999.999 Đồng Làng. Tài khoản này chỉ dành cho máy phát triển hoặc môi trường test. Tắt server rồi chạy lại không tạo thêm tài khoản và không đặt lại số dư. Khoản cấp đầu được ghi trong `economy_transactions` và `admin_audit_log`.

`npm start` không tự bật tài khoản mặc định khi `NODE_ENV` chưa được đặt. Trên production, đặt `NODE_ENV=production`, `ADMIN_USERNAME` và `ADMIN_PASSWORD` (ít nhất 12 ký tự, khác `admin`) bằng biến môi trường trước khi khởi động. Thiếu thông tin quản trị hợp lệ thì server từ chối khởi động. Nếu dùng lại database từng chạy development với mật khẩu `admin`, đặt `ADMIN_USERNAME=admin` và mật khẩu production mới để server đổi mật khẩu cũ; số dư và nông trại vẫn được giữ. Không đưa mật khẩu production vào Git.

Người chơi thường đăng ký qua giao diện luôn có role `USER` và 200 Đồng Làng ban đầu; client không có API để tự cấp quyền hoặc cấp tiền. `data/starter.sqlite` vẫn không chứa tài khoản Admin: seed chỉ chạy trên database làm việc.

## Trồng trọt

Chạm hoặc nhấp ô ruộng để xem thao tác hợp lệ. Chọn **Cuốc**, **Gieo** (chọn giống trong menu), **Tưới** hoặc **Thu hoạch**; nhân vật tự tìm đường đến ô và thực hiện. Giữ và kéo qua nhiều ô để làm liên tiếp. Trên điện thoại, giữ khoảng 0,38 giây trước khi kéo. **Esc** hoặc **Hủy** thoát chế độ thao tác. Phím **1–4** vẫn chọn nhanh thao tác. Dock nhỏ dưới màn hình mở **Túi đồ**, **Nhiệm vụ**, **Xây dựng**, **Bạn bè**; nút **Nông trại** mở thêm chế biến, trang trí, mở đất và nhận hạt khi hết. Server vẫn kiểm quyền, khoảng cách tại lúc thực hiện, hạt giống và trạng thái từng ô. Cây lớn theo thời gian thực kể cả khi đóng trình duyệt.

## Chợ quê

Nhấp cổng phía nam farm để nhân vật đi tới **Chợ quê**; **E** cũng dùng được khi đứng cạnh cổng. Tại chợ, nhấp quầy hạt, quầy thu mua hoặc bảng đơn từ xa để nhân vật tự đi tới và mở giao diện. Chọn thẻ vật phẩm, nhập số lượng để mua/bán, hoặc nhận và giao đơn hàng. Nút **Lịch sử** cạnh số dư cho xem các giao dịch. Cổng phía nam chợ đưa về farm. Chợ luôn mở; một loại nông sản được thu mua cao hơn 15% theo ngày UTC. Giá, tiền và vật phẩm được xác nhận ở server. Dùng `npm run economy:report` để xem bảng lợi nhuận thử nghiệm.

## Ao cá và chuồng gà

Ở farm, chạm/nhấp ao phía đông nam hoặc chuồng gà phía đông bắc từ bất kỳ vị trí nào để xem menu ngữ cảnh; nhân vật tự đi tới khi chọn thao tác. **E** vẫn mở bảng VAC khi đứng gần. Menu cho phép xem, cho ăn và thu hoạch khi hợp lệ. Mua cá giống, gà con và thức ăn tại quầy Cô Mai ở chợ; thả cá/thêm gà trong bảng VAC. Đổi đậu nành thành thức ăn cá, ngô hoặc lúa thành thức ăn gà ngay tại bảng tương ứng. Cá và gà lớn theo thời gian thật khi offline. Cá và trứng vào túi đồ và bán cho Cô Lan. Số liệu hiện là giá trị playtest.

## Kiểm thử

`npm test` chạy kiểm thử API, SQLite, quyền farm, Socket.IO, offline growth, inventory, kinh tế, VAC, crafting, xây dựng, migration và retry. Checklist QA trình duyệt ở [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md).

`npm run qa:browser` chạy Playwright trên Edge thật với database tạm; cài Playwright bằng `npm install --no-save playwright` nếu máy chưa có. Có thể đặt `PLAYWRIGHT_MODULE` thành URL module Playwright đã cài và `EDGE_PATH` thành đường dẫn trình duyệt. Kịch bản tạo tài khoản thử riêng, không chạm `data/farm.sqlite`; ảnh kiểm tra được lưu trong `.qa/` và bị Git bỏ qua.

`npm run qa:vac` chạy luồng browser Phase 4 trên Edge, cũng dùng SQLite tạm. Script tăng tốc chờ cá/gà bằng cách lùi timestamp trong database thử sau khi tương tác thật; không thay đổi giờ máy hoặc dữ liệu chơi.

## Phase 5 — chế biến, xây dựng và mở đất

Ở farm, dùng **Chế biến** để xem 6 công thức và hàng đợi. Chọn công thức hoặc nhận thành phẩm; nhân vật tự đi tới cối xay, bếp quê hoặc giàn phơi tương ứng. Nguyên liệu trừ khi bắt đầu mẻ, thành phẩm nhận sau khi đồng hồ server hoàn thành, kể cả khi offline. Công trình có lần lượt 1/2/1 chỗ chế biến. Kho đầy thì mẻ vẫn chờ nhận.

**Xây dựng** hoặc phím **B** mở danh sách 3 công trình. Chọn vật, rê chuột để xem vùng chiếm rồi nhấp để đặt; nhân vật tự đi tới điểm thao tác. **R** xoay, **Esc** hủy. Công trình đầu tiên trả Đồng Làng, cất vào túi rồi đặt lại không trả thêm. Chỉ di chuyển/cất khi đã nhận hết mẻ. **Trang trí** có 15 loại; mua tại quầy Cô Mai, chọn tại farm rồi đặt/di chuyển/cất tương tự. Vật trong túi và vật đã đặt là hai trạng thái loại trừ nhau.

**Mở đất** có hai cấp, giá thử nghiệm 180 rồi 280 Đồng Làng. Vùng phủ màu nhẹ trên Canvas là khu chưa mở khóa; mở đất chỉ cho phép đặt vật trên khu đó, không đổi kích thước map hay di chuyển ao/chuồng. Server xác nhận vị trí, va chạm, lối đi, tiền, kho và quyền sở hữu; màu preview là gợi ý.

`npm run qa:phase5` chạy kịch bản Edge/Playwright trên SQLite tạm. `npm run economy:phase5` in biên lợi nhuận từng công thức. `node scripts/phase5-migration-check.mjs <bản-sao-sqlite>` kiểm tra giữ dữ liệu khi nâng lên v5. File `data/starter.sqlite` hiện là schema v11 rỗng; mục này mô tả tính năng từ Phase 5. Dữ liệu chơi và backup riêng không vào Git.

## Sao lưu

`npm run backup` tạo bản sao SQLite nhất quán trong `data/backups`. Sao lưu thư mục này ra nơi lưu độc lập theo lịch vận hành. Không đặt database, backup hay `.env` trong `public`.

## Bảo mật và giới hạn hiện tại

Mật khẩu được băm bằng scrypt, phiên lưu bằng cookie HttpOnly và token CSRF; thao tác farm được xác thực server-side. Chưa có dịch vụ email nên chưa có khôi phục tài khoản tự động. Chưa có thanh toán, tiền hoặc giao dịch giữa người chơi. Nhà, ruộng, ao, chuồng, NPC và công trình chính đã dùng art gốc; catalogue trang trí và một số hiệu ứng Canvas vẫn cần hoàn thiện trước khi đánh dấu remake COMPLETE.

## Code tái sử dụng

`Player.js`, `InputManager.js`, `GameLoop.js`, `Camera.js` và `CollisionSystem.js` được sao chép từ dự án `san-may` rồi dùng trong game mới. `server/db.js` dựa trên mẫu migration/SQLite của dự án đó. Dự án `san-may` không bị sửa.

## Cập nhật va chạm, VAC và hướng dẫn mở đầu (2026-11-05)

Bản đồ va chạm cố định dùng chung giữa client/server; ao và chuồng dùng thao tác trực tiếp trên vật nuôi; nút Chi tiết đã bỏ. Farm tạo mới có hướng dẫn theo hành động, lưu tiến trình ở server và một vụ rau cải đầu 45 giây. Bỏ qua hoặc xem lại không cấp thêm ưu đãi. Farm cũ giữ nguyên tiến độ; Menu → Xem hướng dẫn mở phần nhắc lại.

Đợt hướng dẫn mở đầu nâng schema lên v10; schema hiện tại là v11 sau tính năng xoài. Xem `docs/COLLISION_VAC_FIRST_5_MINUTES_REPORT.md` cho kết quả 72/72 Node test, browser QA mới, kiểm tra bảo toàn dữ liệu và các bộ browser cũ còn lỗi. Chạy `npm run qa:first5` hoặc `npm run qa:collision-vac` để kiểm tra luồng mới; vẫn cần Playwright/Edge như phần Kiểm thử. Chưa nghiệm thu phát hành hoặc playtest với người mới.

## Cây xoài sân nhà

Bấm cây xoài bên trái nhà để xem thời gian và thu hoạch. Mỗi vụ chờ 4 giờ, tính cả offline; quả chín chờ hái, không cộng dồn nhiều vụ. Hái xong bắt đầu chu kỳ mới. Cây có 4 cấp: mới tạo cho 3 quả/vụ; sau tổng 5, 15, 30 lần hái tăng lên 5, 8, 12 quả/vụ và hình cây lớn dần. Vụ vừa đạt mốc vẫn nhận sản lượng cấp cũ, vụ tiếp dùng sản lượng mới. Xoài vào túi và bán cho Cô Lan 10 Đồng/quả. Kho đầy giữ nguyên vụ chưa hái.

Schema v11 thêm cây cho farm cũ và farm mới; khởi động lại server rồi Ctrl+F5 để nhận cập nhật. Xem `docs/MANGO_TREE_FEATURE.md` cho cấu hình cân bằng, dữ liệu và kiểm thử. Chạy `npm run qa:mango` để kiểm tra luồng browser.

## Giao diện và tương tác hiện tại (06/11/2026)

Nhà dùng ảnh v4 đã sửa phối cảnh; đường làng ở ngoài hàng rào, cổng khớp rào, bảng tên gỗ nhỏ hơn. HUD màu kem và dock có tên chức năng, tự sắp trên màn hình nhỏ. Cây xoài có quả xanh nhỏ khi non, quả vàng lớn khi chín, không còn nhãn nổi dưới cây. Cá đủ tuổi thu hoạch sáng và rõ màu hơn cá non.

Nhấp ô đang trồng để xem **tên, hình ảnh cây, thời gian còn lại, trạng thái tưới và thanh tiến độ**. Thẻ tự đếm ngược và đổi sang **Có thể thu hoạch** khi chín. Không cần đóng/mở lại thẻ.

Xem [báo cáo tổng hợp và lệnh QA](docs/UI_GAMEPLAY_UPDATES_2026-11-06.md). Kết quả gần nhất: `npm test` 85/85 đạt; QA từng luồng được ghi cụ thể trong báo cáo. Các báo cáo cũ là lịch sử, không đại diện toàn bộ giao diện hiện tại. Khởi động lại server khi cập nhật hình học dùng chung, sau đó Ctrl+F5.

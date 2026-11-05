# NÔNG TRẠI LÀNG VIỆT — PHASE 7 MASTER IMPLEMENTATION PLAN

**Chủ đề:** Multiplayer Social — Thăm nông trại, hiện diện, quyền truy cập và tương tác cộng đồng  
**Baseline:** `main` commit `3b3e174` (Phase 6 implementation commit `5858797`)  
**Trạng thái:** Kế hoạch giao AI coding; **chưa triển khai**  
**Phạm vi:** Một lượt giao việc cho AI, thực hiện tuần tự qua các checkpoint nội bộ.

## 0. Mục tiêu và ranh giới

Phase 7 chuyển game từ các nông trại độc lập sang trải nghiệm **thăm nông trại của nhau**. Mỗi tài khoản vẫn sở hữu duy nhất nông trại của mình. Khách không được tự ý sửa ruộng, thu hoạch, xây dựng, mua bán, nhận thưởng hoặc truy cập dữ liệu riêng của chủ nhà.

**Phải có:** (1) tìm và ghé thăm farm; (2) quyền riêng tư và quyền khách; (3) hiện diện, di chuyển và tương tác realtime; (4) mời bạn / yêu cầu vào farm nếu chủ bật chế độ duyệt; (5) giao diện và thông báo; (6) bảo mật, migration, test và browser QA.

**Không làm trong Phase 7:** farm chung, P2P trading, tặng/nhận tiền hoặc vật phẩm, chat công khai không kiểm soát, guild, đấu PvP, marketplace, monetization, thay đổi giá/crop/VAC/crafting, viết lại Canvas engine, thay SQLite bằng PostgreSQL, scale đa node, Phase 8 polish.

## 1. GATE 0 — Bắt buộc trước khi sửa code

1. Checkout nhánh mới `feature/phase-7-social-farms` từ đúng `main` và ghi lại SHA thực tế. Không mặc định rằng HEAD luôn là `3b3e174`; nếu khác, báo cáo diff.
2. Đọc `PROJECT_MASTER_CONTEXT.md`, `GDD.md`, `README.md`, `HANDOFF.md`, `IMPLEMENTATION_PROGRESS.md`, `PHASE6_REPORT.md`, `PHASE6_REPORT.md`, `QA_CHECKLIST.md`, `package.json`.
3. Đọc thực tế các module auth/session, Socket.IO, farm ownership, scene/collision, player state, database migrations, API security, frontend render/input và test. Không suy đoán tên hàm/API từ tài liệu này.
4. Chạy `npm test`, `npm run qa:phase6`, `npm run qa:browser`, `npm run qa:vac`, `npm run qa:phase5` khi môi trường hỗ trợ. Lưu kết quả trước khi sửa. Nếu browser không chạy được, đánh dấu NOT RUN, không tự coi PASS.
5. Backup SQLite bằng backup API, bao gồm dữ liệu WAL; kiểm tra `PRAGMA integrity_check`, `foreign_key_check`, và phục hồi thử trên bản sao. Không đưa DB người chơi hoặc backup có dữ liệu thật lên Git.
6. Tạo `PHASE7_REPORT.md`: sơ đồ kiến trúc, danh sách file dự kiến sửa, API/socket events thực tế, rủi ro bảo mật, số liệu test baseline và rollback.
7. Nếu baseline fail, phân loại lỗi có sẵn; không sửa lan man hoặc triển khai khi có blocker dữ liệu/bảo mật.

## 2. Thiết kế quyền sở hữu và trạng thái

- **Owner:** chủ farm duy nhất, có quyền thao tác gameplay hiện hữu.
- **Visitor:** chỉ xem và đi lại trong farm khác, không sở hữu hoặc chỉnh sửa bất kỳ đối tượng farm nào.
- **Privacy mode:** `private` (chỉ chủ), `request` (phải được chủ duyệt), `public` (khách đăng nhập có thể vào). Mặc định cho tài khoản cũ và mới là `private` để bảo vệ quyền riêng tư.
- **Visitor permission:** chỉ cho phép xem, di chuyển, biểu cảm và tương tác xã hội an toàn; không cho thu hoạch, tưới, gieo, mua/bán, craft, xây, đặt vật, đổi quyền hoặc claim quest.
- **Room:** room Socket.IO theo farm ID, không theo username; chỉ join sau khi server xác minh session, quyền và trạng thái visit. Client không được tự chọn room tùy ý.
- **Server authoritative:** mọi yêu cầu visit, quyền, movement, scene, collision, kick và exit được xác thực phía server. Không tin client-supplied owner ID, vị trí, số dư, quyền hay inventory.
- **No farm co-ownership:** không bổ sung quyền sửa farm cho khách trong MVP.

## 3. P7.1 — Discover và Visit Farm

### User stories
- Người chơi đăng nhập có thể tìm farm theo tên chủ hoặc tên farm; kết quả tối thiểu, phân trang, không lộ email/session ID/thông tin nhạy cảm.
- Có nút **Thăm nông trại**, trạng thái `private/request/public`, thông báo nếu không được phép.
- Khách vào farm tại điểm spawn an toàn; camera/collision/render lấy snapshot farm được server lọc dữ liệu.
- Khách có nút **Về nông trại của tôi**; thoát room cũ, quay về farm của chính mình, không làm thay đổi vị trí chủ farm.
- Nếu farm không tồn tại, bị đổi quyền, bị kick hoặc owner thay đổi cấu hình, khách được xử lý rõ ràng, không mắc kẹt.

### Acceptance
- Farm private không bị vào bằng URL/API/socket trực tiếp.
- Farm request không được vào trước khi duyệt.
- Farm public cho phép vào sau xác thực và kiểm tra giới hạn người.
- Không có cách nào dùng farm visit để đọc thông tin tài chính hoặc kho đồ riêng của chủ.

## 4. P7.2 — Privacy, Invitation và Request

- UI chủ farm cho đổi privacy mode, xem danh sách khách hiện tại, chấp thuận/từ chối yêu cầu, kick khách.
- Với `request`, visitor gửi yêu cầu vào; chủ nhận thông báo khi online; yêu cầu có TTL hợp lý, giới hạn tần suất, không nhân đôi do retry. Khi chủ offline, có thể báo chờ/không khả dụng theo thiết kế đã chọn; không giả lập duyệt tự động.
- Invitation có thể là lời mời trong game giữa người chơi đăng nhập; lời mời hết hạn và không thể tái sử dụng vô hạn.
- Quyết định permission được kiểm tra lại **tại thời điểm join và trong phiên**. Khi chuyển về private, khách đang thăm bị rời khỏi farm theo quy tắc rõ ràng.
- Chủ có thể kick; khách bị kick không được join lại tức thì bằng replay request. Đặt cooldown ngắn hợp lý.
- Chỉ chủ được đổi privacy/approve/kick; không tin các role flag từ client.
- Không yêu cầu làm hệ thống kết bạn phức tạp hoặc chat mới nếu chưa có sẵn.

## 5. P7.3 — Multiplayer Presence và Movement

- Tái sử dụng Socket.IO đang có, tránh mở server realtime thứ hai.
- Khi join, gửi snapshot người đang có mặt; broadcast join/move/leave tới những client có quyền trong cùng farm.
- Chỉ phát thông tin tối thiểu: public display name, appearance, facing, tọa độ hợp lệ, trạng thái online trong room.
- Tần suất movement có giới hạn; server xác thực room membership, tốc độ tối đa, collision, boundary, sequence/timestamp và chống teleport.
- Client nội suy vị trí remote players để chuyển động mượt; không lấy nội suy làm nguồn sự thật.
- Reconnect: tái xác thực session và quyền farm, phục hồi presence hoặc quay về farm mình nếu không còn quyền.
- Một tài khoản mở nhiều tab: thiết kế chính sách rõ ràng (một avatar hoặc nhiều socket gộp), không nhân bản nhân vật.
- Giới hạn khách/farm theo cấu hình, mặc định thận trọng (ví dụ 8) và kiểm thử giới hạn; không tuyên bố capacity khi chưa đo.
- Không gửi inventory, wallet, quest private trong room broadcast.

## 6. P7.4 — Tương tác xã hội nhẹ

- Thêm bộ biểu cảm an toàn, ví dụ chào, vẫy tay, cảm ơn, vui vẻ (không cần ảnh ngoài nếu hệ thống Canvas hiện tại hỗ trợ vẽ bằng code).
- Biểu cảm xuất hiện trên nhân vật và đồng bộ trong room; tự hết hạn, rate-limit chống spam.
- Có thể hiển thị lời chào khi khách tới/rời farm; có thể tắt thông báo ở UI.
- **Không** cho phép khách tương tác với cây/VAC/building theo cách tạo thay đổi trạng thái gameplay.
- Nếu game có chat sẵn, chỉ tích hợp lại quyền/room và cơ chế an toàn hiện hữu; không thêm chat tự do mới nếu chưa có moderation.

## 7. P7.5 — UX, Canvas và accessibility

- Tạo màn tìm farm, thẻ kết quả, modal xin phép, thông báo duyệt/từ chối, nút quay về, panel chủ farm và trạng thái khách.
- Trên HUD hiển thị rõ: `Đang thăm nông trại của ...`; không để khách hiểu nhầm là farm mình.
- Hiển thị nameplate của người khác, phân biệt chủ và khách bằng cách nhẹ nhàng, không lộ ID nhạy cảm.
- Mobile viewport: nút bấm không che joystick/toolbar, scroll panel, keyboard focus, Escape/back và loading/error states.
- Hiệu ứng chuyển cảnh mượt nhưng có reduced-motion; không thêm animation nặng ảnh hưởng FPS.
- Giữ palette, ngày/đêm, thời tiết, mùa và NPC Phase 6 đúng trên farm khách; trạng thái world lấy từ server.
- Không làm hỏng farm/market scene transitions và collision hiện tại.

## 8. P7.6 — Database và API / Socket contract

- Tạo migration **v7 append-only** nếu thực sự cần; ưu tiên bảng riêng cho `farm_social_settings`, `farm_visit_requests`, `farm_invites`, `farm_visit_events` (chỉ tạo bảng/cột sau khi kiểm tra schema hiện tại; không tạo trùng). Cân nhắc giữ presence ephemeral trong bộ nhớ thay vì ghi DB mỗi frame.
- Ràng buộc UNIQUE/FK/INDEX, expiry và trạng thái request; dùng UTC server, không dựa vào đồng hồ client.
- Migrate farm cũ với privacy `private` và không mất dữ liệu.
- API REST phù hợp kiến trúc hiện hữu, ví dụ `/api/social/search`, `/api/social/settings`, `/api/social/requests`, `/api/social/invites`; tên endpoint cuối cùng do AI chọn sau khi audit. Mọi write cần auth, CSRF, validation, rate limit, ownership check.
- Socket events ví dụ `social:visit:join`, `social:visit:leave`, `social:presence`, `social:move`, `social:emote`, `social:kick`; định nghĩa payload schema, ack, lỗi, replay policy trong `PHASE7_REPORT.md`. Không coi đây là tên event đã tồn tại.
- Các hành động state-changing dùng idempotency/request IDs khi cần; thao tác DB nhiều bảng phải atomic.
- Không sử dụng SQL string interpolation với dữ liệu user; giới hạn input length và escape text render.
- Cấm sửa trực tiếp `wallets`, `inventory_items`, `farm_crops`, VAC, crafting hay quest rewards thông qua social APIs.
- Test migration v6→v7 trên bản sao database thật, integrity/FK, bảo toàn số bản ghi và khả năng rollback bằng backup. Không chạy code cũ trên schema mới khi chưa chứng minh tương thích.

## 9. P7.7 — Security, Abuse và Failure Modes

Bắt buộc test:
1. Visitor gọi API harvest/plant/water/build/craft/sell/claim trên farm người khác => 403/404, dữ liệu không đổi.
2. Client tự emit join vào private room => bị từ chối.
3. Đổi owner ID / farm ID / forged role trong payload => không nâng quyền.
4. Replay invitation, approve, join, emote và request IDs => không nhân bản, không spam.
5. Chủ kick khách khi khách đang move; mọi movement sau kick bị từ chối.
6. Chủ đổi public→private khi khách đang trong room => quyền được thu hồi.
7. Reconnect sau session hết hạn => phải xác thực lại.
8. Di chuyển vượt tốc, xuyên vật cản, ngoài biên, NaN/Infinity => từ chối/chuẩn hóa an toàn.
9. Hai tab cùng user, 2–4 user khác nhau, disconnect bất ngờ, restart server => không còn ghost avatar.
10. Search không tiết lộ dữ liệu private, không cho enumerate thông tin nhạy cảm.
11. Test bounded queue, cleanup TTL, memory leak khi join/leave liên tục.
12. Không ghi secrets/cookies vào log và không để lỗi server trả stack trace ra client.

## 10. Test matrix và browser QA

### Automated
- Baseline 34/34 (hoặc số thực tế tại HEAD) vẫn PASS.
- Tests mới: privacy defaults; search visibility; request/approval; expiry; kick; room isolation; movement validation; emote rate-limit; concurrent join; multi-tab; reconnect; unauthorized farm mutation; migration v7.
- Test SQLite transaction, foreign keys, idempotency, failure injection khi có thể.
- Tách tests server/service/API/socket, không chỉ test helper.

### Browser QA bắt buộc
- 3 tài khoản: A chủ farm public, B khách, C người không được phép; 2 browser contexts hoặc 3 tabs độc lập.
- A đổi privacy, B request, A approve, B join; B đi lại và A nhìn thấy; A kick B; B không thể tiếp tục điều khiển.
- A và B thấy biểu cảm của nhau, C ở farm khác không thấy.
- B thử các hành động farming/crafting/economy trên farm A => không có thay đổi dữ liệu.
- Reload B, disconnect/reconnect, restart server, đổi ngày/đêm/thời tiết/mùa, scene transition, mobile viewport, console errors.
- Regression: `npm test`, `npm run qa:phase6`, `npm run qa:browser`, `npm run qa:vac`, `npm run qa:phase5` và QA Phase 7 mới.
- Chạy stress smoke 5–10 concurrent clients nếu môi trường hỗ trợ; ghi CPU, RAM, latency và giới hạn test; không suy diễn năng lực production từ test nhỏ.
- Browser unavailable => NOT RUN; không đánh dấu PASS. Chụp screenshot/trace ở các tình huống quan trọng.

## 11. Checkpoints nội bộ cho AI coding (một lượt làm việc)

- **CP0:** Gate 0, backup, baseline, precheck.
- **CP1:** Migration v7 + quyền privacy + security tests.
- **CP2:** Search/visit/request/invite + API tests.
- **CP3:** Socket.IO presence/movement/reconnect + tests.
- **CP4:** UI/Canvas/emotes/mobile + browser QA.
- **CP5:** Full regression, migration rehearsal, docs, cleanup và commit.

Sau mỗi checkpoint: chạy test liên quan, sửa lỗi trước khi đi tiếp, ghi quyết định kỹ thuật. Không bỏ qua blocker chỉ vì được yêu cầu làm “một lượt”. Không thay đổi master context cố định trừ khi tài liệu yêu cầu rõ.

## 12. Definition of Done — chỉ COMPLETE nếu

- [ ] Có thể tìm, xin vào, duyệt và thăm farm theo đúng privacy.
- [ ] Farm private không thể bị bypass; guest không thể mutate gameplay của owner.
- [ ] Hiện diện/di chuyển/emotes đồng bộ realtime, không ghost avatar.
- [ ] Kick, privacy revoke, reconnect, multi-tab và server restart xử lý đúng.
- [ ] Migration v7 an toàn, dữ liệu Phase 1–6 còn nguyên; backup/restore được kiểm chứng.
- [ ] `npm test` và toàn bộ regression Phase 1–6 PASS.
- [ ] Browser QA Phase 7 chạy thật và PASS trên desktop/mobile viewport.
- [ ] Không có lỗi console nghiêm trọng, lộ dữ liệu riêng, hoặc giảm hiệu năng đáng kể.
- [ ] Tài liệu `PHASE7_REPORT.md`, `PHASE7_REPORT.md`, `PHASE7_REPORT.md`, `PHASE7_REPORT.md`, `IMPLEMENTATION_PROGRESS.md`, `README.md`, `GDD.md` được cập nhật phù hợp.
- [ ] Có commit SHA, file diff summary, lệnh test, số PASS/FAIL/NOT RUN, giới hạn chưa giải quyết, hướng rollback.

## 13. Hướng dẫn bàn giao và rollback

- Không commit DB thật, backup, `.env`, logs, browser traces chứa cookie/token.
- Nếu có migration v7: rollback cần dừng server, sao lưu DB hiện tại, checkout phiên bản trước và restore backup v6 bằng SQLite backup API; tuyệt đối không giả định migration tự đảo ngược.
- Báo cáo tách **development complete** khỏi **production ready**. Chưa xác nhận production nếu chưa có thử tải thực tế, HTTPS, backup restore và mobile vật lý.
- Nếu thiếu công cụ browser/Playwright, đánh dấu NOT RUN và cung cấp cách chạy; không bịa screenshot hoặc kết quả.

## 14. PROMPT THỰC THI DÀNH CHO AI CODING

> Đọc toàn bộ `Phase7.md` trong thư mục gốc repository Nông Trại Làng Việt. Tôi phê duyệt triển khai Phase 7 Social Multiplayer trong **một lượt làm việc**, theo checkpoints CP0–CP5. Hãy audit source thật, chạy Gate 0, backup SQLite, triển khai code/API/Socket.IO/UI/migration/test, chạy full regression và browser QA, tự sửa lỗi, cập nhật tài liệu rồi commit. Không chỉ lập kế hoạch. Giữ nguyên gameplay Phase 1–6 và mô hình mỗi tài khoản sở hữu một farm; khách không có quyền sửa farm. Nếu có blocker hoặc QA chưa chạy được, báo cáo trung thực và không tự đánh dấu COMPLETE. Không push/merge nếu chưa được tôi cho phép.

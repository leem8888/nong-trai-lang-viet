# Phase 7 report: precheck, API, handoff, QA

---

## Phase 7 precheck — 2026-11-03

- Baseline `main` `3b3e174`; nhánh `feature/phase-7-social-farms`. Baseline khớp SHA trong kế hoạch. `Phase7.md` là file mới chưa được commit khi bắt đầu.
- Kiến trúc: Express + cookie session/CSRF (`server/auth.js`, `server/index.js`); SQLite v6 (`server/db.js`); mỗi user một farm (`server/farms.js`); các API farming/VAC/market/phase5/quest chỉ dùng farm của user đã xác thực. Socket `farm:join`, `player:move`, `world:travel`, `farm:interact` hiện chỉ cho chủ vào farm và đồng bộ các tab của họ. Canvas/UI trong `public/js/main.js`.
- Sẽ sửa `server/db.js`, thêm service xã hội, tích hợp REST/Socket tại `server/index.js`, thêm UI trong `public/index.html`, `public/js/main.js`, CSS, test Phase 7 và tài liệu. Không sửa quy tắc giá, cây, VAC, crafting, quest.
- Rủi ro: room `farm:<id>` hiện phát kho/ví riêng; khách phải dùng room xã hội khác và snapshot lọc dữ liệu. Chuyển quyền private/kick phải thu hồi ngay. Vị trí khách chỉ ở RAM, không ghi đè vị trí farm chủ. Multi-tab phải gộp một avatar.
- Baseline: `npm test` 34/34 (lần đầu sandbox hạn chế ghi `starter.sqlite` làm 33/34, chạy lại với quyền ghi đúng đạt 34/34); Edge/Playwright `qa:phase6` 12/12, `qa:browser` 14/14, `qa:vac` 5/5, `qa:phase5` 13/13.
- Backup: `data/backups/farm-2026-11-03T15-25-11-123Z.sqlite`, SQLite backup API; đã restore thử vào file tạm: `integrity_check=ok`, `foreign_key_check` 0, schema v6, 1 user/1 farm. Backup và dữ liệu thật không commit.
- Rollback migration: dừng server, backup schema v7, checkout phiên bản trước, restore file v6 bằng SQLite backup API. Không chạy server v6 trên DB v7 nếu chưa thử tương thích.

---

## Phase 7 API / Socket contract

Tất cả REST dùng cookie phiên `farm_session`; mọi POST cần header `x-csrf-token` từ `/api/me`. Response lỗi có `{error}` và HTTP 400/401/403/429 tùy trường hợp. Không có endpoint social nào trả ví, kho, mật khẩu, session hoặc quest riêng của chủ farm.

| REST | Input | Output / quyền |
| --- | --- | --- |
| `GET /api/social/search?q=&page=` | `q` 2–40 ký tự, `page` 0–100 | 10 farm/page, chỉ `public`/`request`, `id,name,visibility,ownerName,canVisit,hasMore` |
| `GET/POST /api/social/settings` | POST `{privacy:"private|request|public"}` | Chỉ chủ farm; mặc định `private`; trả privacy và danh sách khách. Đổi về private đuổi khách đang thăm |
| `GET/POST /api/social/requests` | POST `{farmId}` | Farm `request` mới nhận; pending 10 phút; retry pending dùng lại ID; chủ xem danh sách |
| `POST /api/social/requests/decide` | `{id,approve:boolean}` | Chỉ chủ; quyết định một lần, retry trả `replayed`; quyền được duyệt hết hạn sau 60 phút và chỉ có hiệu lực khi farm ở chế độ `request` |
| `GET/POST /api/social/invites` | POST `{username}` | Chỉ chủ mời tài khoản tồn tại; lời mời 60 phút, có thể vào farm private; retry còn hạn dùng lại ID |
| `POST /api/social/kick` | `{visitorId}` | Chỉ chủ; đuổi khách hiện diện, chặn vào lại 60 giây trong tiến trình server hiện tại |

Socket.IO dùng cùng cookie phiên và kiểm tra phiên tại mỗi event. Client phải `farm:join` farm của chính mình trước. Room `farm:<id>` chỉ chứa chủ và các tab của chủ, tiếp tục nhận sự kiện gameplay riêng. Room `social:<id>` chứa một avatar/tài khoản đang hiện diện, chỉ phát dữ liệu hiển thị công khai. `user:<id>` chỉ gửi thông báo trực tiếp. Client không chọn room trực tiếp.

| Event client → server | Payload / ack |
| --- | --- |
| `social:join` | `{farmId}`; kiểm tra privacy/grant, cooldown, giới hạn 8 khách; ack `{ok, farm, player, members, snapshot}`. Snapshot chỉ gồm vật thể/cây/công trình/ao/chuồng nhìn thấy, không có dữ liệu kinh tế |
| `social:leave` | `{}`; ack `{ok}`; trở lại avatar farm của mình |
| `player:move` khi thăm | `{x,y,direction,seq}`; `seq` số nguyên tăng dần; server kiểm tra thời gian, tốc độ, đường đi, collision, biên và quyền; vị trí khách chỉ ở RAM |
| `social:emote` | `{emote:"wave|hello|thanks|happy"}`; tối đa một lần/2 giây |

Server phát `social:members`, `social:move`, `social:emote`, `social:farm`, `social:notice`, `social:revoked`, `social:replaced`. Kick/đổi private làm `social:revoked` và mọi movement sau đó bị từ chối đến khi client trở về farm mình. Khi reconnect, client gửi lại `farm:join` rồi `social:join`; quyền được kiểm tra lại. Socket mới cùng tài khoản thay avatar cũ, không tạo bản sao.

Giới hạn hiện tại: kick cooldown ở RAM, nên restart server xóa cooldown; privacy/grant vẫn ở SQLite và được kiểm tra lại. Presence và tọa độ khách không bền vững theo thiết kế. Không có chat tự do hoặc quyền khách sửa farm.

---

## Handoff Phase 7 — 2026-11-03

Branch `feature/phase-7-social-farms`, baseline `main` `3b3e174`, commit triển khai `364de8175fdac6beba4b13e1d344dea1f13b7990`. Không push/merge theo yêu cầu trong `Phase7.md`.

Đã thêm quyền thăm `private/request/public`, tìm kiếm farm, yêu cầu/duyệt, lời mời, kick, room hiện diện riêng, di chuyển khách server-authoritative, biểu cảm và UI desktop/mobile. Các API gameplay của chính tài khoản bị khóa khi tài khoản đang thăm farm khác; không có API nào cho khách thao tác tài sản chủ. Vị trí farm riêng của khách không bị ghi đè khi đi thăm. Snapshot xã hội lọc toàn bộ ví/kho/quest. Xem `PHASE7_REPORT.md`.

Migration v7 trong `server/db.js` thêm `farm_visit_requests`, `farm_invites`; dùng cột `farms.visibility` hiện có để tránh dữ liệu cài đặt trùng. Farm cũ/mới vẫn mặc định `private`. Presence và cooldown kick ở RAM. Backup v6: `data/backups/farm-2026-11-03T15-25-11-123Z.sqlite` (không commit). Script `scripts/phase7-migration-check.mjs` restore thử backup, so sánh mọi dòng Phase 1–6, integrity/FK và chạy migration hai lần.

Rollback: dừng server, sao lưu DB v7, checkout commit trước Phase 7 và phục hồi bản backup v6 bằng SQLite backup API. Không chạy bản server v6 trên DB v7 mà chưa kiểm chứng tương thích.

Giới hạn: chưa kiểm tra thiết bị cảm ứng thật, HTTPS production hoặc tải dài hạn. Kick cooldown mất sau restart; visitor snapshot hiển thị trạng thái farm hiện có nhưng không đồng bộ mỗi thay đổi NPC thời tiết riêng theo farm (đồng hồ/thời tiết Phase 6 là global). Capacity 8 khách là giới hạn an toàn định sẵn, chưa phải số đo tải production.

---

## Báo cáo kiểm thử Phase 7 — 2026-11-04

Môi trường: Windows, Node.js 20.19.6, Microsoft Edge headless qua Playwright cache có sẵn. Test browser tạo SQLite tạm và ba tài khoản riêng; không dùng DB chơi. Biến chạy browser: `PLAYWRIGHT_MODULE=file:///C:/Users/tuanbna.EDS/AppData/Local/npm-cache/_npx/423231821c231c73/node_modules/playwright/index.mjs`.

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| Baseline trước sửa | PASS | `npm test` 34/34; Edge `qa:phase6` 12/12, `qa:browser` 14/14, `qa:vac` 5/5, `qa:phase5` 13/13 |
| Unit/integration sau sửa | PASS | `npm test` 36/36; hai test Phase 7 bao gồm private/search/CSRF, request/approve/replay, invitation, room và snapshot không lộ kho/ví, move/seq/collision, emote cooldown, kick/revoke, multi-tab, reconnect, session hết hạn, 8 khách và giải phóng chỗ khi disconnect |
| Browser Phase 1–6 sau sửa | PASS | `qa:phase6` 12/12, `qa:browser` 14/14, `qa:vac` 5/5, `qa:phase5` 13/13; không có `pageerror` trong luồng cũ |
| Browser Phase 7 | PASS | `npm run qa:phase7` 4/4: ba tài khoản, tìm farm private, request/duyệt, ghé thăm, thấy khách, di chuyển, biểu cảm chủ/khách, kick, về farm mình, đổi private, restart, viewport 390×844, không `pageerror` hoặc tràn ngang |
| Migration v6→v7 | PASS | `node scripts/phase7-migration-check.mjs data/backups/farm-2026-11-03T15-25-11-123Z.sqlite`: 1 user, 1 farm; dữ liệu Phase 1–6 giữ nguyên; `integrity_check=ok`, 0 lỗi FK, mở lại idempotent |
| Starter DB | PASS | schema v7, 0 users/farms/sessions, integrity/FK OK |
| FPS khách thăm | PASS trong máy QA | Edge headless 1280×800, hai client, đo `requestAnimationFrame` 1,2 giây: 59–60 FPS qua hai lượt. Baseline Phase 6 cùng máy từng đo 60 FPS ở scene khác; đây là kiểm tra khói, chưa chứng minh tương đương frame-time p95 |

Ảnh: `.qa/phase7-visit.png` (desktop khi thăm), `.qa/phase7-mobile.png` (viewport 390×844). Ảnh dùng tài khoản thử và bị Git bỏ qua. Đã xem cả hai ảnh.

**NOT RUN:** thiết bị cảm ứng vật lý, nhiều trình duyệt/thiết bị thật, HTTPS production, tải kéo dài và đo CPU/RAM/latency ở tải sản xuất. Giới hạn 8 khách đã được kiểm thử bằng 10 socket cùng lúc; chưa phải chứng nhận capacity cho production. Kick cooldown ở RAM nên bị xóa khi restart; quyền riêng tư và lời mời vẫn được kiểm tra lại từ SQLite.

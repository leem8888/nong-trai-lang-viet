# Handoff Phase 7 — 2026-11-03

Branch `feature/phase-7-social-farms`, baseline `main` `3b3e174`. Không push/merge theo yêu cầu trong `Phase7.md`.

Đã thêm quyền thăm `private/request/public`, tìm kiếm farm, yêu cầu/duyệt, lời mời, kick, room hiện diện riêng, di chuyển khách server-authoritative, biểu cảm và UI desktop/mobile. Các API gameplay của chính tài khoản bị khóa khi tài khoản đang thăm farm khác; không có API nào cho khách thao tác tài sản chủ. Vị trí farm riêng của khách không bị ghi đè khi đi thăm. Snapshot xã hội lọc toàn bộ ví/kho/quest. Xem `PHASE7_API_CONTRACT.md`.

Migration v7 trong `server/db.js` thêm `farm_visit_requests`, `farm_invites`; dùng cột `farms.visibility` hiện có để tránh dữ liệu cài đặt trùng. Farm cũ/mới vẫn mặc định `private`. Presence và cooldown kick ở RAM. Backup v6: `data/backups/farm-2026-11-03T15-25-11-123Z.sqlite` (không commit). Script `scripts/phase7-migration-check.mjs` restore thử backup, so sánh mọi dòng Phase 1–6, integrity/FK và chạy migration hai lần.

Rollback: dừng server, sao lưu DB v7, checkout commit trước Phase 7 và phục hồi bản backup v6 bằng SQLite backup API. Không chạy bản server v6 trên DB v7 mà chưa kiểm chứng tương thích.

Giới hạn: chưa kiểm tra thiết bị cảm ứng thật, HTTPS production hoặc tải dài hạn. Kick cooldown mất sau restart; visitor snapshot hiển thị trạng thái farm hiện có nhưng không đồng bộ mỗi thay đổi NPC thời tiết riêng theo farm (đồng hồ/thời tiết Phase 6 là global). Capacity 8 khách là giới hạn an toàn định sẵn, chưa phải số đo tải production.

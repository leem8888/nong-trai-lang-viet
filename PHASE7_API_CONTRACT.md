# Phase 7 API / Socket contract

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

# Nông Trại Làng Việt — GDD

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

Lộ trình và phạm vi đã khóa trong `PROJECT_MASTER_CONTEXT.md`. Phase 2 bổ sung trồng trọt và tăng trưởng khi offline; thiết kế số liệu cây trồng sẽ được xác nhận khi triển khai Phase 2.

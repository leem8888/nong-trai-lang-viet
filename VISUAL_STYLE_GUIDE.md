# Visual style guide

Đợt hoàn thiện Phase 8 giữ palette và hình học Canvas bên dưới. Mỗi mùa có chi tiết môi trường nhỏ, tán cây/tre chuyển động chậm; `prefers-reduced-motion` hoặc tùy chọn giảm hiệu ứng giữ các chi tiết đứng yên. Hành động server xác nhận có biểu tượng nổi tối đa 550 ms; âm thanh là oscillator Web Audio tạo trong mã, không dùng asset hoặc nhạc bên ngoài, mặc định tắt và không autoplay.

- Cảm hứng: vườn quê Việt với mái ngói đỏ, đất nâu ấm, lá xanh dịu, giấy kem cho bảng hướng dẫn.
- Màu UI: nền xanh lá đậm `#2b422c`, giấy `#fff5da`, nút vàng `#dfac55`, viền gỗ `#805336`. Giữ chữ nâu sẫm trên nền kem và kem trên nền xanh.
- Canvas: hình học phẳng, cạnh rõ ở tỉ lệ hiện có; tránh ảnh mờ hoặc texture không đồng bộ. Bóng nằm dưới chân nhân vật/vật thể.
- Nhân vật: điểm neo ở chân, đầu hướng theo `direction`, nhịp chân khoảng 14 rad/s khi đi; trạng thái đứng không lắc liên tục.
- Giao diện: bán kính 8–16 px, vùng bấm tối thiểu khoảng 40–44 px khi thực tế cho phép; viền focus 3 px. Hướng dẫn là thẻ nhỏ có thể bỏ qua, không che toàn màn hình.
- Chuyển động: hover/press tối đa 120 ms; tắt CSS transition khi `prefers-reduced-motion`.
- Biểu tượng: emoji hiện có đi kèm chữ tiếng Việt, không dùng màu đơn độc để giải thích trạng thái.

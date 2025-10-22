# Hướng dẫn sử dụng tính năng Pivot trong AG Grid

## Tổng quan
Tính năng Pivot đã được bật trong TableAnalysisTab, cho phép người dùng phân tích dữ liệu theo nhiều chiều khác nhau.

## Các tính năng đã được thêm

### 1. Cấu hình Pivot
- **Pivot Mode**: Có thể bật/tắt chế độ pivot cho từng bảng
- **Sidebar**: Hiển thị tool panels để quản lý columns và filters
- **Column Configuration**: Tất cả các cột đều hỗ trợ pivot

### 2. Nút điều khiển
- **Pivot Toggle Button**: Nút "Pivot ON/OFF" để bật/tắt chế độ pivot
- **Tooltip**: Hiển thị hướng dẫn khi hover vào nút
- **Visual Feedback**: Nút sẽ đổi màu khi pivot được bật

### 3. Cấu hình cột
- **Pivot Columns**: Các cột có thể được sử dụng làm pivot (nhóm dữ liệu)
- **Value Columns**: Các cột có thể được sử dụng làm giá trị (tính toán)
- **Aggregation**: Hỗ trợ các hàm tổng hợp như sum, count, avg, etc.

## Cách sử dụng

### Bước 1: Bật chế độ Pivot
1. Tìm nút "Pivot OFF" trong phần controls của bảng
2. Click vào nút để chuyển sang "Pivot ON"
3. Bảng sẽ chuyển sang chế độ pivot
4. **Mặc định không có cột nào được chọn** - bạn cần tự chọn cột muốn sử dụng

### Bước 2: Cấu hình Pivot
1. Khi ở chế độ pivot, sidebar sẽ xuất hiện bên trái
2. Sử dụng **Columns** panel để:
   - Kéo cột vào **Row Groups** để nhóm dữ liệu theo hàng
   - Kéo cột vào **Column Labels** để tạo pivot columns
   - Kéo cột vào **Values** để tính toán và hiển thị giá trị
3. Sử dụng **Filters** panel để lọc dữ liệu

**Lưu ý quan trọng**: 
- **Mặc định không có cột nào được chọn** - bạn cần tự chọn cột muốn sử dụng
- Tất cả các cột đều có thể được kéo vào bất kỳ vùng nào (Row Groups, Column Labels, Values)
- Cột thời gian thường được sử dụng cho Row Groups hoặc Column Labels
- Cột số liệu thường được sử dụng cho Values
- Khi bật/tắt pivot mode, tất cả cột đã chọn sẽ được reset về trạng thái ban đầu

### Bước 3: Tùy chỉnh Aggregation
- Các cột giá trị sẽ tự động sử dụng hàm `sum` làm mặc định
- Có thể thay đổi hàm tổng hợp trong sidebar

## Lưu ý quan trọng

### Dữ liệu phù hợp
- Pivot hoạt động tốt nhất với dữ liệu có cấu trúc rõ ràng
- Cần có ít nhất một cột để nhóm (pivot) và một cột để tính toán (value)

### Hiệu suất
- Với dữ liệu lớn, pivot có thể làm chậm hiệu suất
- Nên sử dụng filter để giảm lượng dữ liệu cần xử lý

### Tương thích
- Tính năng này hoạt động với tất cả các loại bảng trong TableAnalysisTab
- Tương thích với các tính năng hiện có như filtering, sorting

## Ví dụ sử dụng

### Phân tích doanh thu theo thời gian
1. Bật pivot mode
2. Kéo cột "Thời gian" vào Pivot
3. Kéo cột "Doanh thu" vào Values
4. Kết quả: Bảng sẽ hiển thị tổng doanh thu theo từng thời điểm

### Phân tích theo nhiều chiều
1. Kéo cột "Khu vực" vào Pivot
2. Kéo cột "Sản phẩm" vào Pivot
3. Kéo cột "Số lượng" vào Values
4. Kết quả: Bảng sẽ hiển thị số lượng sản phẩm theo khu vực và loại sản phẩm

## Troubleshooting

### Không thể kéo cột vào Row Groups hoặc Column Labels
- **Kiểm tra pivot mode**: Đảm bảo đã bật "Pivot ON"
- **Kiểm tra sidebar**: Đảm bảo sidebar đã mở và hiển thị Columns panel
- **Kiểm tra cột**: Đảm bảo cột có dữ liệu và không bị ẩn
- **Refresh trang**: Thử refresh trang nếu vẫn không kéo được

### Pivot không hoạt động
- Kiểm tra xem đã bật pivot mode chưa
- Đảm bảo có ít nhất một cột trong Row Groups và một cột trong Values
- Kiểm tra dữ liệu có đúng định dạng không

### Hiệu suất chậm
- Sử dụng filter để giảm dữ liệu
- Tắt pivot mode khi không cần thiết
- Kiểm tra kích thước dữ liệu

### Sidebar không hiển thị
- Kiểm tra xem đã bật pivot mode chưa
- Thử click vào icon "Columns" trong sidebar
- Refresh trang nếu cần thiết

## Hỗ trợ
Nếu gặp vấn đề, vui lòng liên hệ team phát triển để được hỗ trợ.

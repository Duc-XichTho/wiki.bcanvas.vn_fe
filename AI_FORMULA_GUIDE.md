# Hướng dẫn sử dụng AI Formula

## Tổng quan
AI Formula là một tính năng mới cho phép sử dụng AI để tạo ra công thức tính toán tự động dựa trên mô tả bằng ngôn ngữ tự nhiên.

## Cách sử dụng

### 1. Thêm step AI Formula
- Trong Pipeline Steps, chọn "AI Formula" từ danh sách các step types
- Cấu hình các thông số cần thiết

### 2. Cấu hình AI Formula

#### AI Prompt
- Mô tả yêu cầu công thức bằng tiếng Việt hoặc tiếng Anh
- Sử dụng `@` để chọn cột, ví dụ: `@tên_cột`
- AI sẽ tự động tạo công thức JavaScript tương ứng

#### Cột đích
- **Tạo mới**: Tạo một cột mới với tên do bạn đặt
- **Ghi đè**: Ghi đè lên cột đã có sẵn

### 3. Ví dụ sử dụng

#### Phép toán cơ bản
```
Prompt: "Cộng @số_lượng với @đơn_giá"
Kết quả: row['số_lượng'] + row['đơn_giá']
```

#### Xử lý chuỗi
```
Prompt: "Lấy 5 ký tự đầu của @tên"
Kết quả: row['tên'].substring(0, 5)
```

#### Điều kiện
```
Prompt: "Nếu @tuổi lớn hơn 18 thì 'Adult' else 'Child'"
Kết quả: row['tuổi'] > 18 ? 'Adult' : 'Child'
```

#### Tính toán phức tạp
```
Prompt: "Làm tròn @giá * 1.1"
Kết quả: Math.round(row['giá'] * 1.1)
```

### 4. Các phép toán được hỗ trợ

#### Toán học
- `+`, `-`, `*`, `/`, `%`
- `Math.round()`, `Math.floor()`, `Math.ceil()`
- `Math.abs()`, `Math.max()`, `Math.min()`

#### Xử lý chuỗi
- `.substring(start, end)`
- `.slice(start, end)`
- `.replace(old, new)`
- `.toUpperCase()`, `.toLowerCase()`
- `.trim()`

#### Điều kiện
- `? :` (ternary operator)
- `&&`, `||` (logical operators)

#### Chuyển đổi kiểu dữ liệu
- `Number()`, `String()`
- `parseInt()`, `parseFloat()`

### 5. Xử lý lỗi
- Nếu công thức không thể thực thi, giá trị sẽ được đặt là "ERROR"
- AI sẽ cố gắng tạo công thức an toàn và xử lý các trường hợp null/undefined

### 6. Lưu ý quan trọng
- AI Formula sử dụng token, đảm bảo bạn có đủ quota
- Công thức được tạo tự động, hãy kiểm tra kết quả trước khi sử dụng
- Sử dụng `@` để chọn cột chính xác
- Mô tả càng chi tiết, công thức càng chính xác

### 7. Troubleshooting

#### Lỗi "Thiếu AI prompt"
- Đảm bảo đã nhập mô tả yêu cầu trong ô AI Prompt

#### Lỗi "Phải chọn cột đích hoặc tạo cột mới"
- Chọn một trong hai tùy chọn: tạo cột mới hoặc ghi đè cột có sẵn

#### Lỗi "Không thể trích xuất công thức từ kết quả AI"
- Thử mô tả lại yêu cầu một cách rõ ràng hơn
- Kiểm tra xem có sử dụng `@` để chọn cột không

#### Kết quả hiển thị "ERROR"
- Kiểm tra dữ liệu đầu vào có hợp lệ không
- Thử đơn giản hóa yêu cầu công thức

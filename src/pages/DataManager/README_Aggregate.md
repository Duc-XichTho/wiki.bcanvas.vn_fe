# Aggregate Step - Hướng dẫn sử dụng

## Tổng quan
Aggregate Step cho phép bạn nhóm dữ liệu theo một cột và thực hiện các phép tính toán trên các nhóm đó. Đây là một tính năng mạnh mẽ để phân tích dữ liệu và tạo ra các báo cáo tổng hợp.

## Cách sử dụng

### 1. Thêm Aggregate Step
- Trong Data Manager, click "Add Step"
- Chọn "Aggregate" từ danh sách các loại step

### 2. Cấu hình nhóm dữ liệu
- **Nhóm theo cột**: Chọn một hoặc nhiều cột để nhóm dữ liệu
- Hỗ trợ nhóm theo nhiều cột (multiple group by)
- Ví dụ: Nhóm theo "region" hoặc nhóm theo "region + category + year"
- Dữ liệu sẽ được lấy từ `inputStepId` được chọn (không phải từ step hiện tại)

### 3. Cấu hình tính toán
Bạn có thể thêm nhiều phép tính toán khác nhau:

#### Các hàm tính toán có sẵn:
- **Sum**: Tổng các giá trị số
- **Count**: Số lượng bản ghi trong nhóm
- **Average**: Giá trị trung bình
- **Min**: Giá trị nhỏ nhất
- **Max**: Giá trị lớn nhất
- **Standard Deviation**: Độ lệch chuẩn
- **Distinct Count**: Số lượng giá trị khác nhau

#### Cấu hình cho mỗi phép tính:
- **Cột**: Chọn cột để tính toán
- **Hàm**: Chọn loại phép tính
- **Tên cột kết quả**: Tên cho cột kết quả (tùy chọn)

## Ví dụ thực tế

### Dữ liệu đầu vào:
```json
[
  { "category": "A", "product": "P1", "sales": 100, "price": 10 },
  { "category": "A", "product": "P2", "sales": 150, "price": 15 },
  { "category": "A", "product": "P3", "sales": 200, "price": 20 },
  { "category": "B", "product": "P4", "sales": 80, "price": 8 },
  { "category": "B", "product": "P5", "sales": 120, "price": 12 },
  { "category": "C", "product": "P6", "sales": 300, "price": 30 }
]
```

### Cấu hình:
- **Nhóm theo**: category
- **Tính toán**:
  - Sum sales → total_sales
  - Average sales → avg_sales
  - Max price → max_price
  - Count products → product_count

### Kết quả:
```json
[
  { 
    "category": "A", 
    "total_sales": 450, 
    "avg_sales": 150, 
    "max_price": 20, 
    "product_count": 3 
  },
  { 
    "category": "B", 
    "total_sales": 200, 
    "avg_sales": 100, 
    "max_price": 12, 
    "product_count": 2 
  },
  { 
    "category": "C", 
    "total_sales": 300, 
    "avg_sales": 300, 
    "max_price": 30, 
    "product_count": 1 
  }
]
```

## Lưu ý quan trọng

### 1. Nguồn dữ liệu
- Dữ liệu được lấy từ `inputStepId` được chọn (không phải từ step hiện tại)
- Nếu `useCustomInput = true`: sử dụng `inputStepId` được chọn
- Nếu `useCustomInput = false`: sử dụng step trước đó (step.id - 1)
- Điều này đảm bảo dữ liệu được lấy từ đúng nguồn đã được cấu hình

### 2. Nhóm theo nhiều cột
- Hỗ trợ chọn nhiều cột để nhóm dữ liệu
- Các cột được kết hợp bằng dấu "|" để tạo key duy nhất
- Kết quả sẽ chứa tất cả các cột nhóm trong output

### 3. Xử lý dữ liệu số
- Các hàm số (sum, avg, min, max, std) sẽ tự động chuyển đổi giá trị sang số
- Giá trị không phải số sẽ được xử lý như 0
- Kết quả null/undefined sẽ được xử lý an toàn

### 2. Tên cột kết quả
- Nếu không đặt tên, hệ thống sẽ tự động tạo tên theo format: `{function}_{column}`
- Ví dụ: `sum_sales`, `avg_price`, `count_product`

### 3. Hiệu suất
- Hàm sử dụng thư viện Lodash để tối ưu hiệu suất
- Xử lý dữ liệu lớn một cách hiệu quả

### 4. Xử lý lỗi
- Nếu cấu hình không hợp lệ, step sẽ trả về dữ liệu gốc
- Các lỗi sẽ được log ra console để debug

## Các trường hợp sử dụng phổ biến

### 1. Báo cáo doanh số theo khu vực
- Nhóm theo: region
- Tính toán: sum(sales), count(orders), avg(order_value)

### 2. Phân tích sản phẩm
- Nhóm theo: product_category
- Tính toán: sum(quantity), avg(price), max(rating)

### 3. Thống kê khách hàng
- Nhóm theo: customer_type
- Tính toán: count(customers), sum(total_spent), avg(avg_order)

### 4. Phân tích thời gian
- Nhóm theo: month
- Tính toán: sum(revenue), count(transactions), avg(transaction_value)

## Troubleshooting

### Lỗi thường gặp:
1. **"Vui lòng chọn cột nhóm"**: Chưa chọn cột để nhóm dữ liệu
2. **"Vui lòng cấu hình ít nhất một aggregation"**: Chưa thêm phép tính toán nào
3. **Kết quả không như mong đợi**: Kiểm tra kiểu dữ liệu của cột được chọn

### Debug:
- Kiểm tra console để xem log lỗi
- Đảm bảo dữ liệu đầu vào có định dạng đúng
- Thử với dữ liệu mẫu nhỏ trước khi xử lý dữ liệu lớn 
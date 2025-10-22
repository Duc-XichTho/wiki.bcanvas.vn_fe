# Advanced Lookup Config - Lookup Nâng Cao

## Mô tả
Component `AdvancedLookupConfig` cho phép thực hiện lookup với nhiều điều kiện phức tạp, thay vì chỉ một điều kiện đơn giản như `LookupConfig` cũ.

## Tính năng chính

### 1. Nhiều điều kiện lookup
- Cho phép thêm nhiều điều kiện để tìm kiếm dữ liệu
- Mỗi điều kiện bao gồm:
  - **Cột hiện tại**: Cột từ bảng dữ liệu đang xử lý
  - **Toán tử so sánh**: =, !=, >, <, >=, <=, contains, starts_with, ends_with
  - **Cột lookup**: Cột từ bảng tham chiếu

### 2. Các toán tử so sánh hỗ trợ
- **So sánh bằng**: `=`, `!=`
- **So sánh số**: `>`, `<`, `>=`, `<=`
- **So sánh chuỗi**: `contains`, `starts_with`, `ends_with`

### 3. Xử lý lỗi linh hoạt
- **Error**: Trả về "Error" khi không tìm thấy kết quả
- **Null**: Trả về null
- **Empty**: Trả về chuỗi rỗng
- **Custom**: Trả về giá trị tùy chỉnh

## Cách sử dụng

### Ví dụ cơ bản
```jsx
import AdvancedLookupConfig from './AdvancedLookupConfig';

<AdvancedLookupConfig
  availableTables={availableTables}
  currentTableColumns={currentTableColumns}
  initialConfig={initialConfig}
  onChange={handleConfigChange}
/>
```

### Ví dụ cấu hình
```javascript
const config = {
  newColumnName: 'Cost',
  lookupTable: 'table_b_id',
  lookupTableVersion: null,
  lookupConditions: [
    {
      currentColumn: 'Date',
      lookupColumn: 'Date',
      operator: '='
    },
    {
      currentColumn: 'Store',
      lookupColumn: 'Store',
      operator: '='
    }
  ],
  returnColumn: 'Cost',
  errorHandling: 'error'
};
```

## Tích hợp vào Pipeline

### 1. Thêm step type mới
```javascript
const stepTypeName = {
  // ... existing types
  22: 'Lookup nâng cao', // Lookup nhiều điều kiện
};
```

### 2. Thêm component mapping
```javascript
const configComponentMap = {
  // ... existing components
  22: AdvancedLookupConfig,
};
```

### 3. Thêm xử lý trong switch case
```javascript
case 22: // Advanced Lookup (nhiều điều kiện)
  processedData = await processAdvancedLookup(inputData, step.config);
  break;
```

### 4. Thêm summary display
```javascript
case 22: {
  // Advanced Lookup step: show concise, max 2 lines
  const tableStr = String(step.config?.lookupTable ?? '').slice(0, 20);
  const returnColStr = String(step.config?.returnColumn ?? '').slice(0, 20);
  const newColStr = String(step.config?.newColumnName ?? '').slice(0, 20);
  const version = step.config?.lookupTableVersion === null ? 'gốc' : step.config?.lookupTableVersion;
  const conditionCount = step.config?.lookupConditions?.length || 0;

  const line1 = `Advanced Lookup: ${trunc(tableStr)} v${version} → ${trunc(returnColStr)}`;
  const line2 = `${conditionCount} điều kiện → ${trunc(newColStr)}`;
  return `${line1}\n${line2}`;
}
```

## Logic xử lý

### 1. Kiểm tra điều kiện
- Tất cả điều kiện phải được thỏa mãn (AND logic)
- Mỗi điều kiện được kiểm tra với toán tử tương ứng

### 2. Tìm kiếm dữ liệu
- Duyệt qua từng row trong bảng lookup
- Kiểm tra từng điều kiện
- Trả về row đầu tiên thỏa mãn tất cả điều kiện

### 3. Xử lý kết quả
- Nếu tìm thấy: Lấy giá trị từ cột `returnColumn`
- Nếu không tìm thấy: Áp dụng `errorHandling` strategy

## So sánh với Lookup cũ

| Tính năng | Lookup cũ | Lookup nâng cao |
|-----------|-----------|-----------------|
| Số điều kiện | 1 | Nhiều |
| Toán tử so sánh | Chỉ = | Nhiều loại |
| Logic kết hợp | Không có | AND logic |
| Xử lý lỗi | Cố định | Linh hoạt |
| Hiệu suất | Cao (Map lookup) | Trung bình (Linear search) |

## Lưu ý hiệu suất

- Lookup nâng cao sử dụng linear search thay vì Map lookup
- Phù hợp cho datasets nhỏ và trung bình
- Với datasets lớn, nên cân nhắc sử dụng database JOIN hoặc index

## Testing

Component đã được test với các trường hợp:
- Render cơ bản
- Validation
- Thêm/xóa điều kiện
- Xử lý initial config
- Error handling


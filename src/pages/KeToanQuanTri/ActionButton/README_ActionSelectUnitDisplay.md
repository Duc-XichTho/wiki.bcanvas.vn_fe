# ActionSelectUnitDisplay Component

## Mô tả
Component này cho phép người dùng chọn đơn vị hiển thị số liệu trong các báo cáo KQKD:
- **Nghìn**: Hiển thị số theo đơn vị nghìn, không lấy số thập phân
- **Triệu**: Hiển thị số theo đơn vị triệu, lấy 2 số thập phân

## Cách sử dụng

### 1. Import component
```jsx
import ActionSelectUnitDisplay from '../../../ActionButton/ActionSelectUnitDisplay.jsx';
```

### 2. Sử dụng trong JSX
```jsx
<ActionSelectUnitDisplay />
```

### 3. Truy cập giá trị từ Context
```jsx
import { useContext } from 'react';
import { MyContext } from '../../../MyContext.jsx';

const { unitDisplay, updateUnitDisplay } = useContext(MyContext);
```

### 4. Cập nhật giá trị (nếu cần)
```jsx
// Sử dụng updateUnitDisplay để cập nhật và lưu vào localStorage
updateUnitDisplay('million');
```

## Logic Format

### formatUnitDisplay(value, unitDisplay)
- **value**: Giá trị số cần format
- **unitDisplay**: 'thousand' hoặc 'million'
- **Trả về**: Chuỗi đã được format

### Ví dụ:
- `formatUnitDisplay(1000000, 'thousand')` → `"1,000"`
- `formatUnitDisplay(1000000, 'million')` → `"1.00"`
- `formatUnitDisplay(1500000, 'thousand')` → `"1,500"`
- `formatUnitDisplay(1500000, 'million')` → `"1.50"`

## Tích hợp vào các báo cáo

Component đã được tích hợp vào các báo cáo sau:
- BaoCaoGroupUnit.jsx
- BaoCaoGroupMonth.jsx
- BaoCaoGroupDeal.jsx
- BaoCaoDeal.jsx
- BaoCaoNhomKenh.jsx
- BaoCaoPBNhomKenh2.jsx
- BaoCaoPBNhomSP.jsx
- BaoCaoPBNhomSP2.jsx
- BaoCaoPBNhomVV2.jsx
- BCNhomVV.jsx
- BaoCaoTongQuat.jsx

## Cập nhật Cell Renderer

Các cell renderer đã được cập nhật để sử dụng logic format mới:
- PopupCellActionBCKD.jsx
- BaoCaoPBT.jsx

## Lưu ý
- Giá trị được lưu trong Context và localStorage, áp dụng cho toàn bộ ứng dụng
- Khi thay đổi đơn vị hiển thị, tất cả các báo cáo sẽ được cập nhật tự động
- Giá trị được khôi phục từ localStorage khi reload trang
- Component sử dụng Ant Design Select với style nhỏ gọn
- Sử dụng `updateUnitDisplay()` thay vì `setUnitDisplay()` để đảm bảo lưu vào localStorage

# Analysis Review - Tính năng mới

## Tổng quan
Đã thêm 2 tab mới vào Analysis Review:
- **Thiết lập thống kê**: Hiển thị KPICalculator trong modal
- **Kết quả đo lường**: Hiển thị KPI2Calculator trong modal

## Cấu trúc files

### Components mới
- `components/modals/StatisticsModal.jsx` - Modal cho tab Thiết lập thống kê
- `components/modals/MeasurementModal.jsx` - Modal cho tab Kết quả đo lường
- `components/tabs/StatisticsTab.jsx` - Tab component cho statistics
- `components/tabs/MeasurementTab.jsx` - Tab component cho measurement
- `components/modals/Modal.module.css` - Styles cho modal

### Routes
- `/analysis-review/statistics` - Route cho tab Thiết lập thống kê
- `/analysis-review/measurement` - Route cho tab Kết quả đo lường

## Cách hoạt động

1. Khi click vào tab "Thiết lập thống kê":
   - Navigate đến `/analysis-review/statistics`
   - Hiển thị StatisticsModal với KPICalculator component
   - Khi đóng modal, tự động navigate về `/analysis-review/data`

2. Khi click vào tab "Kết quả đo lường":
   - Navigate đến `/analysis-review/measurement`
   - Hiển thị MeasurementModal với KPI2Calculator component
   - Khi đóng modal, tự động navigate về `/analysis-review/data`

## API Integration
- Sử dụng `getAllKpiCalculator()` từ `kpiCalculatorService.jsx`
- Sử dụng `getAllKpi2Calculator()` từ `kpi2CalculatorService.jsx`
- Các component tự quản lý việc fetch data từ API

## Responsive Design
- Modal có width 90% và top 20px
- Hỗ trợ cả mobile và desktop
- Tự động điều chỉnh kích thước theo màn hình 
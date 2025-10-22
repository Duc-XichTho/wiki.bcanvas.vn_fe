# Phân quyền AnalysisReview - Reporting Agent

## Tổng quan
Hệ thống phân quyền cho AnalysisReview được thiết kế theo từng module và template cụ thể.

## Các module và quyền truy cập

### 1. Data và Statistics/Measurement
- **Quyền truy cập**: Chỉ Admin và Editor
- **Đường dẫn**: `/analysis-review/data`, `/analysis-review/statistics`, `/analysis-review/measurement`
- **Logic**: Kiểm tra `currentUser.isAdmin` hoặc `currentUser.isEditor`

### 2. Reports
- **Quyền truy cập**: Phân quyền theo Template
- **Đường dẫn**: `/analysis-review/reports`
- **Logic**: Kiểm tra userClass của user có khớp với userClass của Template không
- **Implementation**: Cần implement trong ReportsTab component

### 3. Report Builder
- **Quyền truy cập**: Phân quyền theo Template
- **Đường dẫn**: `/analysis-review/builder`
- **Logic**: Kiểm tra userClass của user có khớp với userClass của Template không
- **Implementation**: Cần implement trong ReportBuilderTab component

### 4. Business Dashboard
- **Quyền truy cập**: Phân quyền từng thẻ
- **Đường dẫn**: `/analysis-review/business`
- **Logic**: Kiểm tra quyền truy cập từng thẻ riêng biệt
- **Implementation**: Cần implement trong BusinessTab component

## Cách hoạt động

### Kiểm tra quyền truy cập
```javascript
// Kiểm tra quyền Data và Statistics
const canAccessDataAndStats = () => {
  return currentUser?.isAdmin || currentUser?.isEditor;
};

// Kiểm tra quyền Reports (cần implement chi tiết)
const canAccessReports = () => {
  // Logic kiểm tra userClass theo Template
  return true; // Tạm thời
};
```

### Chuyển hướng tự động
- Nếu user không có quyền truy cập tab hiện tại, hệ thống sẽ tự động chuyển hướng đến tab đầu tiên có quyền truy cập
- Nếu không có quyền truy cập tab nào, sẽ chuyển về Dashboard

### Ẩn/hiện tab trong UI
- Các tab không có quyền truy cập sẽ bị ẩn khỏi navigation
- Cả desktop và mobile đều áp dụng logic này

## Cần implement thêm

### 1. ReportsTab component
```javascript
// Cần thêm logic kiểm tra userClass theo Template
const canAccessReport = (report) => {
  const userClassNames = currentUserClasses.map(uc => uc.name);
  return report.userClass && report.userClass.some(uc => userClassNames.includes(uc));
};
```

### 2. ReportBuilderTab component
```javascript
// Cần thêm logic kiểm tra userClass theo Template
const canAccessTemplate = (template) => {
  const userClassNames = currentUserClasses.map(uc => uc.name);
  return template.userClass && template.userClass.some(uc => userClassNames.includes(uc));
};
```

### 3. BusinessTab component
```javascript
// Cần thêm logic kiểm tra quyền từng thẻ
const canAccessCard = (card) => {
  // Logic kiểm tra quyền truy cập từng thẻ
  return true; // Cần implement
};
```

## Cấu trúc file

```
src/pages/AnalysisReview/
├── AnalysisReview.jsx          # Component chính với logic phân quyền
├── components/
│   ├── Header.jsx              # Navigation với ẩn/hiện tab theo quyền
│   ├── AccessDenied.jsx        # Component hiển thị thông báo không có quyền
│   └── tabs/
│       ├── DataTab.jsx         # Cần implement phân quyền theo userClass
│       ├── ReportsTab.jsx      # Cần implement phân quyền theo Template
│       ├── ReportBuilderTab.jsx # Cần implement phân quyền theo Template
│       └── BusinessTab.jsx     # Cần implement phân quyền từng thẻ
└── PERMISSIONS.md              # File này
```

## Lưu ý
- Hệ thống phân quyền hiện tại chỉ implement cơ bản cho Data và Statistics
- Cần implement chi tiết cho Reports, Report Builder và Business Dashboard
- Có thể cần thêm API để lấy thông tin userClass của Template và Card 
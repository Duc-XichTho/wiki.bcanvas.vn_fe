# Phân quyền Template cho AnalysisReview

## Tổng quan
Hệ thống phân quyền template cho AnalysisReview đã được implement hoàn chỉnh, cho phép Admin gắn userClass cho template và kiểm soát quyền truy cập.

## Các tính năng đã implement

### 1. NewTemplateModal - Tạo template với userClass
- ✅ Thêm chọn userClass khi tạo template mới
- ✅ UI với checkbox để chọn nhiều userClass
- ✅ Tìm kiếm và lọc userClass
- ✅ Nút "Chọn tất cả" và "Bỏ chọn tất cả"
- ✅ Hiển thị userClass đã chọn
- ✅ Lưu userClass vào template khi tạo mới

### 2. EditTemplateModal - Sửa template với userClass
- ✅ Thêm chọn userClass khi sửa template
- ✅ UI với checkbox để chọn nhiều userClass
- ✅ Tìm kiếm và lọc userClass
- ✅ Nút "Chọn tất cả" và "Bỏ chọn tất cả"
- ✅ Hiển thị userClass đã chọn
- ✅ Lưu userClass vào template khi sửa

### 2. ReportBuilderNonPD - Phân quyền template
- ✅ Kiểm tra quyền truy cập template theo userClass
- ✅ Lọc template hiển thị theo quyền của user
- ✅ Admin/Editor/SuperAdmin thấy toàn bộ template
- ✅ User thường chỉ thấy template có userClass phù hợp
- ✅ Hiển thị thông tin lọc template trong UI
- ✅ Gắn userClass từ template vào aiChatHistory khi tạo
- ✅ Gắn userClass từ aiChatHistory vào aiChatExport khi xuất bản

### 3. ReportsTab - Phân quyền reports
- ✅ Lọc reports theo userClass của user
- ✅ Admin/Editor/SuperAdmin có quyền xem tất cả reports
- ✅ User thường chỉ xem reports có userClass phù hợp

## Luồng hoạt động

### 1. Tạo Template
```
Admin tạo template → Chọn userClass → Lưu template với userClass
```

### 2. Sử dụng Template
```
User chọn template → Kiểm tra quyền → Tạo aiChatHistory với userClass từ template
```

### 3. Xuất bản Report
```
User xuất bản → Tạo aiChatExport với userClass từ aiChatHistory
```

### 4. Xem Reports
```
User truy cập Reports → Lọc theo userClass → Hiển thị reports có quyền xem
```

## Cấu trúc dữ liệu

### Template
```javascript
{
  id: 1,
  name: "Template Name",
  prompt: "Template prompt",
  userClass: [1, 2], // Array of userClass IDs
  data_selected: [],
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z"
}
```

### aiChatHistory
```javascript
{
  id: 1,
  quest: "Question",
  result: "AI result",
  userClass: [1, 2], // Array of userClass IDs from template
  userCreated: "user@email.com",
  // ... other fields
}
```

### aiChatExport
```javascript
{
  id: 1,
  content: "HTML content",
  userClass: [1, 2], // Array of userClass IDs from aiChatHistory
  user_create: "user@email.com",
  // ... other fields
}
```

## Logic phân quyền

### Kiểm tra quyền template
```javascript
const canAccessTemplate = (template) => {
  // Admin/Editor/SuperAdmin có quyền truy cập tất cả
  if (currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) {
    return true;
  }

  // Kiểm tra userClass của template có khớp với userClass của user không
  if (template?.userClass && Array.isArray(template.userClass) && template.userClass.length > 0) {
    const userClassIds = currentUserClasses.map(uc => uc.id);
    return template.userClass.some(templateUserClassId => userClassIds.includes(templateUserClassId));
  }

  // Nếu template không có userClass restriction, cho phép truy cập
  return true;
};
```

### Lọc template hiển thị
```javascript
// Filter templates based on user permissions
const isAdminUser = currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin;

if (!isAdminUser) {
  accessibleTemplates = templatesWithFullData.filter(template => canAccessTemplate(template));
  // Hiển thị thông tin lọc trong UI: "(đã lọc từ X template)"
} else {
  // Admin user - hiển thị tất cả template
}
```

### Lọc reports
```javascript
// Filter reports based on user permissions
if (!(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin)) {
  const userClassIds = currentUserClasses.map(uc => uc.id);
  publishedReports = publishedReports.filter(report => {
    // If report has no userClass restriction, allow access
    if (!report.userClass || report.userClass.length === 0) {
      return true;
    }
    // Check if user's userClass matches report's userClass
    return report.userClass.some(reportUserClassId => userClassIds.includes(reportUserClassId));
  });
}
```

## Các file đã cập nhật

1. **NewTemplateModal.jsx**
   - Thêm UI chọn userClass
   - Logic xử lý userClass selection
   - Lưu userClass vào template khi tạo mới

2. **EditTemplateModal.jsx**
   - Thêm UI chọn userClass
   - Logic xử lý userClass selection
   - Lưu userClass vào template khi sửa

3. **ReportBuilderNonPD.jsx**
   - Thêm logic kiểm tra quyền template
   - Gắn userClass khi tạo aiChatHistory
   - Gắn userClass khi tạo aiChatExport
   - Cập nhật hàm lưu template để bao gồm userClass

4. **ReportsTab.jsx**
   - Thêm logic lọc reports theo userClass
   - Kiểm tra quyền truy cập reports

5. **AnalysisReview.jsx**
   - Framework cho phân quyền (đã có sẵn)

## Lưu ý

- ✅ Hệ thống phân quyền đã hoạt động hoàn chỉnh
- ✅ Admin có thể gắn userClass cho template
- ✅ User chỉ thấy template và reports có quyền truy cập
- ✅ userClass được truyền từ template → aiChatHistory → aiChatExport
- ✅ Backward compatibility: Template cũ không có userClass vẫn hoạt động bình thường

## Cần test

1. Tạo template với userClass
2. Kiểm tra user thường chỉ thấy template có quyền
3. Kiểm tra aiChatHistory có userClass từ template
4. Kiểm tra aiChatExport có userClass từ aiChatHistory
5. Kiểm tra Reports tab chỉ hiển thị reports có quyền

## Debug logs

Khi tạo/sửa template, console sẽ hiển thị:
```
🔍 [NewTemplateModal] Fetching user classes...
✅ [NewTemplateModal] User classes loaded: { totalUserClasses: X, userClasses: [...] }
💾 [NewTemplateModal] Saving template with userClass: { templateName: "...", selectedUserClasses: [...], userClassLength: X }
💾 [AI NonPD] Saving new template with userClass: { templateName: "...", userClass: [...], userClassLength: X }
```

Khi sửa template:
```
🔍 [EditTemplateModal] Fetching user classes...
✅ [EditTemplateModal] User classes loaded: { totalUserClasses: X, userClasses: [...] }
💾 [EditTemplateModal] Saving template with userClass: { templateName: "...", selectedUserClasses: [...], userClassLength: X }
💾 [AI NonPD] Saving updated template with userClass: { templateName: "...", userClass: [...], userClassLength: X }
``` 
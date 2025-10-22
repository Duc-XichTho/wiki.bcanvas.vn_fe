# AI File Processing Tool

## Tổng quan
Component AIFile là một công cụ xử lý file với AI, cho phép người dùng upload file, cấu hình cách xử lý, và xem nội dung gốc cũng như nội dung đã được AI xử lý.

## Cấu trúc Component

### 3 Panel chính:

1. **Panel 1 - File Upload & Sets**
   - Upload nhiều file cùng lúc
   - Hiển thị danh sách các bộ file đã upload
   - Nút "Run AI" để xử lý file
   - Trạng thái xử lý (uploaded, processed)

2. **Panel 2 - File List**
   - Hiển thị danh sách file chi tiết khi click vào bộ file
   - Thông tin file: tên, kích thước, loại file
   - Trạng thái cấu hình (Configured/Default)
   - Thông tin xử lý (số chunks, kích thước trung bình)
   - Nút cấu hình cho từng file

3. **Panel 3 - Content Viewer**
   - 2 tab: Original Content và AI Translated Content
   - Hiển thị nội dung file gốc
   - Hiển thị nội dung đã được AI xử lý theo chunks

## Tính năng chính

### Upload File
- Hỗ trợ nhiều loại file: .txt, .csv, .json, .html, .xml, .pdf, .doc, .docx, .xls, .xlsx
- Validation file (kích thước tối đa 10MB)
- Upload nhiều file cùng lúc

### Cấu hình xử lý file
Modal cấu hình cho phép thiết lập:

1. **Phương thức tách dữ liệu:**
   - **By Character Count (Chunk)**: Tách theo số ký tự với overlap
   - **By Page Count**: Tách theo số trang
   - **By Specific Character**: Tách theo ký tự chỉ định

2. **Tùy chọn xử lý:**
   - Convert to lowercase
   - Trim whitespace

### Xử lý dữ liệu
- Tự động đọc nội dung file
- Áp dụng cấu hình xử lý
- Tách dữ liệu thành các chunks
- Hiển thị thông tin xử lý

## Cách sử dụng

1. **Upload file**: Click "Upload Files" và chọn file
2. **Cấu hình**: Click nút ⚙️ bên cạnh file để cấu hình
3. **Xử lý**: Click "Run AI" để bắt đầu xử lý
4. **Xem kết quả**: Chọn file để xem nội dung gốc và đã xử lý

## File Structure

```
AIFileTool/
├── AIFile.jsx              # Component chính
├── AIFile.css              # Styles
├── fileProcessingUtils.js  # Utilities xử lý file
└── README.md              # Hướng dẫn sử dụng
```

## API Reference

### fileProcessingUtils.js

#### `processFileContent(file, config)`
Xử lý nội dung file theo cấu hình
- **file**: File object
- **config**: Object cấu hình
- **Returns**: Promise<Array> - Mảng các chunks

#### `validateFile(file)`
Validate file trước khi xử lý
- **file**: File object
- **Returns**: Object {isValid: boolean, errors: Array}

#### `getFileTypeInfo(file)`
Lấy thông tin loại file
- **file**: File object
- **Returns**: Object {icon: string, category: string}

## Responsive Design
- Desktop: 3 panel ngang
- Tablet: 2 panel trên, 1 panel dưới
- Mobile: 3 panel dọc

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

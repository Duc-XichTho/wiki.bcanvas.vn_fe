# Cập nhật Logic cho KPICalculator và KPI2Calculator

## Tóm tắt thay đổi

Đã cập nhật logic trong các components gốc thay vì tạo clone để đảm bảo giao diện giữ nguyên.

## Thay đổi trong KPICalculator.jsx

### 1. Import API mới
```javascript
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
```

### 2. Cập nhật fetchTemplateList()
- **Trước**: Lấy dữ liệu từ `getAllFileNotePad()`
- **Sau**: Lấy dữ liệu từ `getAllApprovedVersion()` và lọc theo apps bao gồm 'analysis-review'

```javascript
const fetchTemplateList = async () => {
  try {
    const approvedVersions = await getAllApprovedVersion();

    // Lọc approveVersion có apps bao gồm 'analysis-review'
    const filteredApprovedVersions = approvedVersions.filter(version => 
      version.apps && version.apps.includes('analysis-review')
    );

    // Chuyển đổi approveVersion thành format template để tương thích
    const templateList = filteredApprovedVersions.map((version) => ({
      id: version.id,
      name: version.name,
      fileNoteName: version.name,
      approveVersion_id: version.id,
      // Thêm các thuộc tính cần thiết khác
      description: version.description || '',
      created_at: version.created_at,
      updated_at: version.updated_at
    }));

    setTemplateList(templateList);
  } catch (error) {
    console.error('Error fetching template list:', error);
  }
};
```

### 3. Cập nhật handleTemplateChange()
- **Trước**: Lấy columns từ `getTemplateColumn(templateId)`
- **Sau**: Lấy columns từ step cụ thể trong templateTable dựa trên version_id

- **Trước**: Lấy rows từ `getTemplateRow(templateId)`
- **Sau**: Lấy rows từ `getTemplateRow(templateId, versionId)` với version parameter

**Logic mới:**
1. Lấy `template_id` từ approveVersion
2. Tìm `templateTable` bằng `template_id`
3. Lấy `version_id` để tìm step cụ thể trong steps của templateTable
4. Lấy columns từ step đó hoặc fallback về step cuối cùng

```javascript
const handleTemplateChange = async (approveVersionId) => {
  try {
    setLoading(true);

    // 1. Lấy approveVersion data
    const approvedVersions = await getAllApprovedVersion();
    const selectedVersion = approvedVersions.find(version => version.id === approveVersionId);

    if (!selectedVersion) {
      console.error('Approved version not found');
      setTemplateColumns([]);
      setTemplateData([]);
      return;
    }

    // 2. Lấy template_id từ approveVersion để tìm templateTable
    const templateId = selectedVersion.template_id;
    const templateTable = await getTableByid(templateId);

    if (!templateTable) {
      console.error('Template table not found');
      setTemplateColumns([]);
      setTemplateData([]);
      return;
    }

    // 3. Lấy version_id để tìm step cụ thể trong steps của templateTable
    const versionId = selectedVersion.id_step;
    let columns = [];
    
    if (templateTable.steps && templateTable.steps.length > 0) {
      // Tìm step có id_step trùng với version_id
      const targetStep = templateTable.steps.find(step => step.id_step === versionId);
      
      if (targetStep && targetStep.outputColumns) {
        columns = targetStep.outputColumns.map((column, index) => ({
          id: column.name || column,
          columnName: column.name || column
        }));
      } else {
        // Fallback: lấy step cuối cùng nếu không tìm thấy step cụ thể
        const lastStep = templateTable.steps[templateTable.steps.length - 1];
        if (lastStep && lastStep.outputColumns) {
          columns = lastStep.outputColumns.map((column, index) => ({
            id: column.name || column,
            columnName: column.name || column
          }));
        }
      }
    }
    
    // 4. Lấy rows với template_id và version_id
    const rows = await getTemplateRow(templateId, versionId);
    const combinedRows = Object.values(rows).map((row) => row.data);
    
    // ... rest of the logic
  } catch (error) {
    console.error('Error fetching template columns:', error);
    setTemplateColumns([]);
  } finally {
    setLoading(false);
  }
};
```

## Thay đổi trong KPI2Calculator.jsx

### 1. Import API mới
```javascript
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
```

### 2. Cập nhật fetchKPIs()
- **Trước**: Lấy dữ liệu từ `getAllFileNotePad()` và lọc theo `table == 'KPI'`
- **Sau**: Lấy dữ liệu từ `getAllApprovedVersion()` và lọc theo apps bao gồm 'analysis-review'

```javascript
const fetchKPIs = async () => {
  try {
    setLoading(true);
    let approvedVersions = await getAllApprovedVersion();
    // Lọc approveVersion có apps bao gồm 'analysis-review'
    approvedVersions = approvedVersions.filter(version => 
      version.apps && version.apps.includes('analysis-review')
    );
    const data = await getAllKpi2Calculator();
    data.forEach(e => {
      if (approvedVersions.some(version => e.id == version.id)){
        e.created = true;
      }
    })
    setKpiList(data);
    if (data.length > 0) {
      await handleKpiSelect(data[0]);
    }
  } catch (error) {
    console.error("Error fetching KPIs:", error);
  } finally {
    setLoading(false);
  }
};
```

## Cập nhật Modals

### StatisticsModal.jsx
- Sử dụng `KPICalculator` thay vì `KPICalculatorClone`

### MeasurementModal.jsx  
- Sử dụng `KPI2Calculator` thay vì `KPI2CalculatorClone`

## Lợi ích

1. **Giao diện giữ nguyên**: Không có thay đổi về CSS hay UI
2. **Logic cập nhật**: Sử dụng approveVersion thay vì fileNote
3. **Dữ liệu chính xác hơn**: Lấy columns từ steps và rows với version
4. **Bảo trì dễ dàng**: Chỉ cần maintain một version của mỗi component

## Lưu ý

- API `getTemplateRow` đã hỗ trợ version parameter
- Logic combine data vẫn giữ nguyên
- Tất cả các tính năng khác không bị ảnh hưởng 
import React, { useState, useEffect, useMemo } from 'react';
import { Form, Select, Radio, Input, Checkbox, Space, Divider, Typography, Button, Table } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const BasicProcessingConfig = ({ availableColumns = [], initialConfig = {}, onChange }) => {
  const [enableTrim, setEnableTrim] = useState(initialConfig.enableTrim || false);
  const [trimColumns, setTrimColumns] = useState(initialConfig.trimColumns || []);
  const [trimType, setTrimType] = useState(initialConfig.trimType || 'both');
  const [trimAllColumns, setTrimAllColumns] = useState(initialConfig.trimAllColumns || false);

  const [enableDataTypeConversion, setEnableDataTypeConversion] = useState(initialConfig.enableDataTypeConversion || false);
  const [dataTypeMappings, setDataTypeMappings] = useState(
    (initialConfig.dataTypeMappings || []).map(m => ({ column: m.column || '', dataType: m.dataType || 'text', outputColumn: m.outputColumn || '' }))
  ); 

  const [enableValueToDate, setEnableValueToDate] = useState(initialConfig.enableValueToDate || false);
  const [dateMappings, setDateMappings] = useState(initialConfig.dateMappings || []);

  const [enableCaseConversion, setEnableCaseConversion] = useState(initialConfig.enableCaseConversion || false);
  const [caseColumns, setCaseColumns] = useState(initialConfig.caseColumns || []);
  const [caseType, setCaseType] = useState(initialConfig.caseType || 'sentencecase');
  const [caseAllColumns, setCaseAllColumns] = useState(initialConfig.caseAllColumns || false);

  const [enableRename, setEnableRename] = useState(initialConfig.enableRename || false);
  const [renameMappings, setRenameMappings] = useState(initialConfig.renameMappings || []);

  const dataTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    // { value: 'date', label: 'Date' },
    // { value: 'boolean', label: 'Boolean' }
  ];

  const trimTypeOptions = [
    { value: 'both', label: 'Cả 2 đầu (mặc định)' },
    { value: 'left', label: 'Chỉ đầu trái' },
    { value: 'right', label: 'Chỉ đầu phải' }
  ];

  const caseTypeOptions = [
    { value: 'sentencecase', label: 'Sentence Case (Chữ hoa đầu câu)' },
    { value: 'uppercase', label: 'UPPERCASE (Chữ hoa)' },
    { value: 'lowercase', label: 'lowercase (Chữ thường)' },
    { value: 'titlecase', label: 'Title Case (Chữ Hoa Đầu Mỗi Từ)' }
  ];

  const dateFormatOptions = [
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (chỉ ngày)' },
    { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss (ngày và giờ)' }
  ];

  useEffect(() => {
    const config = {
      enableTrim,
      trimColumns,
      trimType,
      trimAllColumns,
      enableDataTypeConversion,
      dataTypeMappings,
      enableValueToDate,
      dateMappings,
      enableCaseConversion,
      caseColumns,
      caseType,
      caseAllColumns,
      enableRename,
      renameMappings
    };
    onChange && onChange(config);
  }, [
    enableTrim, trimColumns, trimType, trimAllColumns,
    enableDataTypeConversion, dataTypeMappings,
    enableValueToDate, dateMappings,
    enableCaseConversion, caseColumns, caseType, caseAllColumns,
    enableRename, renameMappings
  ]);

  // Trim functions
  const addTrimColumn = () => {
    setTrimColumns([...trimColumns, '']);
  };

  const removeTrimColumn = (index) => {
    setTrimColumns(trimColumns.filter((_, i) => i !== index));
  };

  const updateTrimColumn = (index, value) => {
    const newColumns = [...trimColumns];
    newColumns[index] = value;
    setTrimColumns(newColumns);
  };

  // Data type conversion functions
  const addDataTypeMapping = () => {
    setDataTypeMappings([...dataTypeMappings, { column: '', dataType: 'text', outputColumn: '' }]);
  };

  const removeDataTypeMapping = (index) => {
    setDataTypeMappings(dataTypeMappings.filter((_, i) => i !== index));
  };

  const updateDataTypeMapping = (index, field, value) => {
    const newMappings = [...dataTypeMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setDataTypeMappings(newMappings);
  };

  // Date conversion functions
  const addDateMapping = () => {
    setDateMappings([...dateMappings, { column: '', outputColumn: '', dateFormat: 'YYYY-MM-DD' }]);
  };

  const removeDateMapping = (index) => {
    setDateMappings(dateMappings.filter((_, i) => i !== index));
  };

  const updateDateMapping = (index, field, value) => {
    const newMappings = [...dateMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setDateMappings(newMappings);
  };

  // Case conversion functions
  const addCaseColumn = () => {
    setCaseColumns([...caseColumns, '']);
  };

  const removeCaseColumn = (index) => {
    setCaseColumns(caseColumns.filter((_, i) => i !== index));
  };

  const updateCaseColumn = (index, value) => {
    const newColumns = [...caseColumns];
    newColumns[index] = value;
    setCaseColumns(newColumns);
  };

  // Rename functions
  const addRenameMapping = () => {
    setRenameMappings([...renameMappings, { oldName: '', newName: '' }]);
  };

  const removeRenameMapping = (index) => {
    setRenameMappings(renameMappings.filter((_, i) => i !== index));
  };

  const updateRenameMapping = (index, field, value) => {
    const newMappings = [...renameMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setRenameMappings(newMappings);
  };

  const getAvailableColumnsForMapping = useMemo(() => (currentIndex, usedColumns) => {
    const used = usedColumns.filter((_, i) => i !== currentIndex);
    return availableColumns.filter(col => !used.includes(col));
  }, [availableColumns]);

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 600 }}>
      {/* TRIM Section */}
      <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Checkbox
            checked={enableTrim}
            onChange={(e) => setEnableTrim(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <Text strong>TRIM - Loại bỏ khoảng trắng thừa</Text>
        </div>

        {enableTrim && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Radio.Group
                value={trimAllColumns}
                onChange={(e) => setTrimAllColumns(e.target.value)}
                style={{ marginBottom: 16 }}
              >
                <Radio value={false}>Chọn cột cụ thể</Radio>
                <Radio value={true}>Tất cả các cột</Radio>
              </Radio.Group>
            </div>

            {!trimAllColumns && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text>Chọn cột cần trim:</Text>
                  <Button type="dashed" icon={<PlusOutlined />} onClick={addTrimColumn} size="small">
                    Thêm cột
                  </Button>
                </div>
                {trimColumns.map((column, index) => (
                  <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <Select
                      virtual={false}
                      value={column}
                      onChange={(value) => updateTrimColumn(index, value)}
                      placeholder="Chọn cột"
                      style={{ flex: 1 }}
                      showSearch
                      filterOption={(input, option) =>
                        option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {availableColumns.map(col => (
                        <Option key={col} value={col}>{col}</Option>
                      ))}
                    </Select>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeTrimColumn(index)}
                      size="small"
                    />
                  </div>
                ))}
              </div>
            )}

            <Form.Item label="Loại trim">
              <Select value={trimType} onChange={setTrimType}>
                {trimTypeOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Space>
        )}
      </div>

      {/* Data Type Conversion Section */}
      <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Checkbox
            checked={enableDataTypeConversion}
            onChange={(e) => setEnableDataTypeConversion(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <Text strong>Chuyển đổi kiểu dữ liệu</Text>
        </div>

        {enableDataTypeConversion && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text>Chọn cột và kiểu dữ liệu đích:</Text>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addDataTypeMapping} size="small">
                Thêm cột
              </Button>
            </div>

            {dataTypeMappings.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#999',
                border: '2px dashed #d9d9d9',
                borderRadius: 6
              }}>
                <p>Chưa có cột nào được chọn</p>
                <p style={{ fontSize: 12 }}>Nhấn "Thêm cột" để bắt đầu cấu hình</p>
              </div>
            ) : (
              <Table
                columns={[
                  {
                    title: 'Cột',
                    dataIndex: 'column',
                    key: 'column',
                    width: '50%',
                    render: (value, record, index) => (
                      <Select
                        virtual={false}
                        value={value}
                        onChange={(val) => updateDataTypeMapping(index, 'column', val)}
                        placeholder="Chọn cột"
                        style={{ width: '100%' }}
                        showSearch
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {getAvailableColumnsForMapping(index, dataTypeMappings.map(m => m.column)).map(col => (
                          <Option key={col} value={col}>{col}</Option>
                        ))}
                      </Select>
                    ),
                  },
                
                  {
                    title: 'Kiểu dữ liệu',
                    dataIndex: 'dataType',
                    key: 'dataType',
                    width: '25%',
                    render: (value, record, index) => (
                      <Select
                        value={value}
                        onChange={(val) => updateDataTypeMapping(index, 'dataType', val)}
                        style={{ width: '100%' }}
                        placeholder="Chọn kiểu dữ liệu"
                      >
                        {dataTypeOptions.map(option => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    ),
                  },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    width: '10%',
                    render: (_, record, index) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeDataTypeMapping(index)}
                        size="small"
                      />
                    ),
                  },
                ]}
                dataSource={dataTypeMappings.map((mapping, index) => ({ ...mapping, key: index }))}
                pagination={false}
                size="small"
              />
            )}
          </div>
        )}
      </div>

      {/* Value to Date Section */}
      <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Checkbox
            checked={enableValueToDate}
            onChange={(e) => setEnableValueToDate(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <Text strong>Value to Date - Chuyển đổi thành ngày tháng</Text>
        </div>

        {enableValueToDate && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text>Chọn cột và định dạng ngày:</Text>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addDateMapping} size="small">
                Thêm cột
              </Button>
            </div>

            {dateMappings.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#999',
                border: '2px dashed #d9d9d9',
                borderRadius: 6
              }}>
                <p>Chưa có cột nào được chọn</p>
                <p style={{ fontSize: 12 }}>Nhấn "Thêm cột" để bắt đầu cấu hình</p>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {dateMappings.map((mapping, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                    <Select
                      virtual={false}
                      value={mapping.column}
                      onChange={(val) => updateDateMapping(index, 'column', val)}
                      placeholder="Chọn cột nguồn"
                      showSearch
                      filterOption={(input, option) => option?.children?.toLowerCase?.().indexOf(input.toLowerCase()) >= 0}
                    >
                      {availableColumns.map((col) => (
                        <Option key={col} value={col}>{col}</Option>
                      ))}
                    </Select>
                    <Input
                      value={mapping.outputColumn}
                      onChange={(e) => updateDateMapping(index, 'outputColumn', e.target.value)}
                      placeholder="Tên cột đích"
                    />
                    <Select
                      value={mapping.dateFormat}
                      onChange={(val) => updateDateMapping(index, 'dateFormat', val)}
                      placeholder="Định dạng ngày"
                    >
                      {dateFormatOptions.map(option => (
                        <Option key={option.value} value={option.value}>{option.label}</Option>
                      ))}
                    </Select>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeDateMapping(index)}
                      disabled={dateMappings.length === 1}
                    />
                  </div>
                ))}
              </Space>
            )}
          </div>
        )}
      </div>

      {/* Case Conversion Section */}
      <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Checkbox
            checked={enableCaseConversion}
            onChange={(e) => setEnableCaseConversion(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <Text strong>Case - Chuyển đổi chữ hoa/chữ thường</Text>
        </div>

        {enableCaseConversion && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Radio.Group
                value={caseAllColumns}
                onChange={(e) => setCaseAllColumns(e.target.value)}
                style={{ marginBottom: 16 }}
              >
                <Radio value={false}>Chọn cột cụ thể</Radio>
                <Radio value={true}>Tất cả các cột</Radio>
              </Radio.Group>
            </div>

            {!caseAllColumns && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text>Chọn cột cần chuyển đổi:</Text>
                  <Button type="dashed" icon={<PlusOutlined />} onClick={addCaseColumn} size="small">
                    Thêm cột
                  </Button>
                </div>
                {caseColumns.map((column, index) => (
                  <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <Select
                      virtual={false}
                      value={column}
                      onChange={(value) => updateCaseColumn(index, value)}
                      placeholder="Chọn cột"
                      style={{ flex: 1 }}
                      showSearch
                      filterOption={(input, option) =>
                        option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {availableColumns.map(col => (
                        <Option key={col} value={col}>{col}</Option>
                      ))}
                    </Select>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeCaseColumn(index)}
                      size="small"
                    />
                  </div>
                ))}
              </div>
            )}

            <Form.Item label="Kiểu chuyển đổi">
              <Select value={caseType} onChange={setCaseType}>
                {caseTypeOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Space>
        )}
      </div>

      {/* Rename Columns Section */}
      <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Checkbox
            checked={enableRename}
            onChange={(e) => setEnableRename(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <Text strong>Rename - Đổi tên cột</Text>
        </div>

        {enableRename && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text>Chọn cột cần đổi tên:</Text>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addRenameMapping} size="small">
                Thêm cột
              </Button>
            </div>

            {renameMappings.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#999',
                border: '2px dashed #d9d9d9',
                borderRadius: 6
              }}>
                <p>Chưa có cột nào được chọn</p>
                <p style={{ fontSize: 12 }}>Nhấn "Thêm cột" để bắt đầu cấu hình</p>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {renameMappings.map((mapping, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                    <Select
                      virtual={false}
                      value={mapping.oldName}
                      onChange={(val) => updateRenameMapping(index, 'oldName', val)}
                      placeholder="Chọn cột cần đổi tên"
                      showSearch
                      filterOption={(input, option) => option?.children?.toLowerCase?.().indexOf(input.toLowerCase()) >= 0}
                    >
                      {availableColumns.map((col) => (
                        <Option key={col} value={col}>{col}</Option>
                      ))}
                    </Select>
                    <Input
                      value={mapping.newName}
                      onChange={(e) => updateRenameMapping(index, 'newName', e.target.value)}
                      placeholder="Tên mới"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeRenameMapping(index)}
                      disabled={renameMappings.length === 1}
                    />
                  </div>
                ))}
              </Space>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div style={{ 
        padding: 16, 
        backgroundColor: '#f0f9ff', 
        borderRadius: 8,
        fontSize: 13,
        color: '#1e40af',
        border: '1px solid #bfdbfe'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#1e40af' }}>
          ℹ️ Thông tin về step "Xử lý cơ bản"
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Mục đích:</strong> Gộp các tính năng xử lý cơ bản thường dùng vào một step duy nhất.
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Tính năng:</strong> TRIM, chuyển đổi kiểu dữ liệu, Value to Date, Case conversion, Rename cột.
        </div>
        <div>
          <strong>Lưu ý:</strong> Có thể bật/tắt từng tính năng riêng lẻ. Các tính năng sẽ được thực hiện theo thứ tự: TRIM → Data Type → Value to Date → Case → Rename.
        </div>
      </div>
    </Form>
  );
};

export default BasicProcessingConfig;

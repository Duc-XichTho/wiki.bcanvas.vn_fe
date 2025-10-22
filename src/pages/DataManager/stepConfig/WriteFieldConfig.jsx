import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Radio, InputNumber } from 'antd';

const { Option } = Select;

const dataTypeOptions = [
  { value: 'string', label: 'String (Văn bản)' },
  { value: 'number', label: 'Number (Số)' },
];

const WriteFieldConfig = ({ availableColumns = [], initialConfig = {}, onChange }) => {
  const [fieldName, setFieldName] = useState(initialConfig.fieldName || '');
  const [dataType, setDataType] = useState(initialConfig.dataType || 'string');
  const [value, setValue] = useState(initialConfig.value || '');
  const [applyToAllRows, setApplyToAllRows] = useState(initialConfig.applyToAllRows !== false);

  useEffect(() => {
    onChange && onChange({
      fieldName,
      dataType,
      value,
      applyToAllRows
    });
    // eslint-disable-next-line
  }, [fieldName, dataType, value, applyToAllRows]);

  const handleValueChange = (newValue) => {
    if (dataType === 'number') {
      // Nếu là number, chuyển đổi sang number
      setValue(newValue);
    } else {
      // Nếu là string, giữ nguyên
      setValue(newValue);
    }
  };

  const renderValueInput = () => {
    if (dataType === 'number') {
      return (
        <InputNumber
          placeholder="Nhập giá trị số"
          value={value}
          onChange={handleValueChange}
          style={{ width: '100%' }}
        />
      );
    } else {
      return (
        <Input
          placeholder="Nhập giá trị văn bản"
          value={value}
          onChange={e => handleValueChange(e.target.value)}
        />
      );
    }
  };

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 320 }}>
      <Form.Item label="Tên field mới" required>
        <Input
          placeholder="Nhập tên field mới"
          value={fieldName}
          onChange={e => setFieldName(e.target.value)}
        />
      </Form.Item>

      <Form.Item label="Kiểu dữ liệu" required>
        <Select
          placeholder="Chọn kiểu dữ liệu"
          value={dataType}
          onChange={setDataType}
        >
          {dataTypeOptions.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Giá trị" required>
        {renderValueInput()}
      </Form.Item>

      {fieldName && value !== '' && (
        <Form.Item label="Xem trước">
          <div style={{ 
            padding: 12, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            <div><strong>Field mới:</strong> {fieldName}</div>
            <div><strong>Kiểu dữ liệu:</strong> {dataTypeOptions.find(opt => opt.value === dataType)?.label}</div>
            <div><strong>Giá trị:</strong> {value}</div>
            <div style={{ marginTop: 8, color: '#666' }}>
              <strong>Kết quả mẫu:</strong> {fieldName}: {value} ({dataType})
            </div>
          </div>
        </Form.Item>
      )}
    </Form>
  );
};

export default WriteFieldConfig;

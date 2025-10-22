import React, { useState, useEffect } from 'react';
import { Form, Input, Select } from 'antd';

const { Option } = Select;

const dataTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
];

const AddColumnConfig = ({ initialConfig = {}, onChange }) => {
  const [columnName, setColumnName] = useState(initialConfig.columnName || '');
  const [dataType, setDataType] = useState(initialConfig.dataType || 'text');
  const [defaultValue, setDefaultValue] = useState(initialConfig.defaultValue || '');

  useEffect(() => {
    onChange && onChange({ columnName, dataType, defaultValue });
    // eslint-disable-next-line
  }, [columnName, dataType, defaultValue]);

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 320 }}>
      <Form.Item label="Tên cột mới" required>
        <Input
          placeholder="Enter new column name"
          value={columnName}
          onChange={e => setColumnName(e.target.value)}
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
      <Form.Item label="Giá trị mặc định">
        <Input
          placeholder="Enter default value for all rows"
          value={defaultValue}
          onChange={e => setDefaultValue(e.target.value)}
        />
      </Form.Item>
    </Form>
  );
};

export default AddColumnConfig; 
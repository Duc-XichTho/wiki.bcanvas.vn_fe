import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Checkbox } from 'antd';

const { Option } = Select;

const fillTypeOptions = [
  { value: 'value', label: 'Giá trị cụ thể' },
  { value: 'mean', label: 'Mean (Trung bình)' },
  { value: 'median', label: 'Median (Trung vị)' },
];

function getPlaceholderText(fillType) {
  if (fillType === 'value') return 'Nhập giá trị cụ thể';
  return '';
}

const FillMissingConfig = ({ availableColumns = [], initialConfig = {}, onChange }) => {
  const [column, setColumn] = useState(initialConfig.column || '');
  const [fillType, setFillType] = useState(initialConfig.fillType || 'value');
  const [fillValue, setFillValue] = useState(initialConfig.fillValue || '');
  const [newColumn, setNewColumn] = useState(initialConfig.newColumn || false);
  const [columnName, setColumnName] = useState(initialConfig.columnName || '');

  useEffect(() => {
    onChange && onChange({ column, fillType, fillValue, newColumn, columnName });
    // eslint-disable-next-line
  }, [column, fillType, fillValue, newColumn, columnName]);

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 320 }}>
      <Form.Item label="Chọn cột cần điền giá trị thiếu" required>
        <Select
          placeholder="Chọn cột"
          value={column}
          onChange={setColumn}
          virtual={false}
        >
          {availableColumns.map(col => (
            <Option key={col} value={col}>{col}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="Kiểu điền giá trị" required>
        <Select
          placeholder="Chọn kiểu điền"
          value={fillType}
          onChange={setFillType}
        >
          {fillTypeOptions.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Select>
      </Form.Item>
      {fillType === 'value' && (
        <Form.Item label="Giá trị điền" required>
          <Input
            placeholder={getPlaceholderText(fillType)}
            value={fillValue}
            onChange={e => setFillValue(e.target.value)}
          />
        </Form.Item>
      )}
      <Form.Item>
        <Checkbox checked={newColumn} onChange={e => setNewColumn(e.target.checked)}>
          Tạo cột mới (sao chép dữ liệu gốc + điền giá trị thiếu)
        </Checkbox>
      </Form.Item>
      {newColumn && (
        <Form.Item label="Tên cột mới" required>
          <Input
            placeholder="Nhập tên cột mới"
            value={columnName}
            onChange={e => setColumnName(e.target.value)}
          />
        </Form.Item>
      )}
    </Form>
  );
};

export default FillMissingConfig; 
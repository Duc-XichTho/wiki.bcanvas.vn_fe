import React, { useState, useEffect } from 'react';
import { Form, Select, Radio } from 'antd';

const { Option } = Select;

const letterCaseOptions = [
  { value: 'uppercase', label: 'UPPERCASE (Chữ hoa)' },
  { value: 'lowercase', label: 'lowercase (Chữ thường)' },
  // { value: 'sentence', label: 'Sentence case (Chữ hoa đầu câu)' },
  // { value: 'title', label: 'Title Case (Chữ Hoa Đầu Mỗi Từ)' },
  // { value: 'camel', label: 'camelCase (Chữ thường đầu, hoa các từ tiếp theo)' },
  // { value: 'pascal', label: 'PascalCase (Chữ hoa đầu mỗi từ)' },
];

const LetterCaseConfig = ({ initialConfig = {}, onChange, availableColumns = [] }) => {
  const [column, setColumn] = useState(initialConfig.column || '');
  const [caseType, setCaseType] = useState(initialConfig.caseType || 'uppercase');
  const [newColumn, setNewColumn] = useState(initialConfig.newColumn || false);
  const [newColumnName, setNewColumnName] = useState(initialConfig.newColumnName || '');

  useEffect(() => {
    const config = {
      column,
      caseType,
      newColumn,
      newColumnName: newColumn ? newColumnName : undefined,
    };
    onChange && onChange(config);
    // eslint-disable-next-line
  }, [column, caseType, newColumn, newColumnName]);

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 320 }}>
      <Form.Item label="Cột cần chuyển đổi" required>
        <Select
          placeholder="Chọn cột cần chuyển đổi chữ hoa/chữ thường"
          value={column}
          onChange={setColumn}
          showSearch
          filterOption={(input, option) =>
            option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          virtual={false}
        >
          {availableColumns.map(col => (
            <Option key={col} value={col}>{col}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Kiểu chuyển đổi" required>
        <Select
          placeholder="Chọn kiểu chuyển đổi"
          value={caseType}
          onChange={setCaseType}
        >
          {letterCaseOptions.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Select>
      </Form.Item>
      {/*<Form.Item label="Tạo cột mới">*/}
      {/*  <Radio.Group*/}
      {/*    value={newColumn}*/}
      {/*    onChange={e => setNewColumn(e.target.value)}*/}
      {/*  >*/}
      {/*    <Radio value={false}>Cập nhật cột hiện tại</Radio>*/}
      {/*    <Radio value={true}>Tạo cột mới</Radio>*/}
      {/*  </Radio.Group>*/}
      {/*</Form.Item>*/}

      {newColumn && (
        <Form.Item label="Tên cột mới" required>
          <Select
            placeholder="Nhập tên cột mới"
            value={newColumnName}
            onChange={setNewColumnName}
            showSearch
            allowClear
            filterOption={(input, option) =>
              option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {availableColumns.map(col => (
              <Option key={col} value={col}>{col}</Option>
            ))}
          </Select>
        </Form.Item>
      )}
    </Form>
  );
};

export default LetterCaseConfig;

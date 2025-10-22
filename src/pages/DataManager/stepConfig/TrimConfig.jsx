import React, { useState, useEffect } from 'react';
import { Form, Select, Radio, Input } from 'antd';

const { Option } = Select;

const trimOptions = [
  { value: 'both', label: 'Cả 2 đầu (mặc định)' },
  { value: 'left', label: 'Chỉ đầu trái' },
  { value: 'right', label: 'Chỉ đầu phải' },
];

const TrimConfig = ({ availableColumns = [], initialConfig = {}, onChange }) => {
  const [column, setColumn] = useState(initialConfig.column || '');
  const [trimType, setTrimType] = useState(initialConfig.trimType || 'both');
  const [newColumn, setNewColumn] = useState(initialConfig.newColumn || false);
  const [newColumnName, setNewColumnName] = useState(initialConfig.newColumnName || '');
  const [customChars, setCustomChars] = useState(initialConfig.customChars || '');
  const [useCustomChars, setUseCustomChars] = useState(initialConfig.useCustomChars || false);

  useEffect(() => {
    const config = {
      column,
      trimType,
      newColumn,
      newColumnName: newColumn ? newColumnName : undefined,
      customChars: useCustomChars ? customChars : undefined,
      useCustomChars
    };
    onChange && onChange(config);
    // eslint-disable-next-line
  }, [column, trimType, newColumn, newColumnName, customChars, useCustomChars]);

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 320 }}>
      <Form.Item label="Cột cần trim" required>
        <Select
          placeholder="Chọn cột cần bỏ ký tự thừa"
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

      {/*<Form.Item label="Loại trim" required>*/}
      {/*  <Select*/}
      {/*    placeholder="Chọn loại trim"*/}
      {/*    value={trimType}*/}
      {/*    onChange={setTrimType}*/}
      {/*  >*/}
      {/*    {trimOptions.map(opt => (*/}
      {/*      <Option key={opt.value} value={opt.value}>{opt.label}</Option>*/}
      {/*    ))}*/}
      {/*  </Select>*/}
      {/*</Form.Item>*/}

      {/*<Form.Item label="Ký tự cần bỏ">*/}
      {/*  <Radio.Group*/}
      {/*    value={useCustomChars}*/}
      {/*    onChange={e => setUseCustomChars(e.target.value)}*/}
      {/*  >*/}
      {/*    <Radio value={false}>Ký tự mặc định (khoảng trắng, tab, xuống dòng)</Radio>*/}
      {/*    <Radio value={true}>Ký tự tùy chỉnh</Radio>*/}
      {/*  </Radio.Group>*/}
      {/*</Form.Item>*/}

      {useCustomChars && (
        <Form.Item label="Ký tự tùy chỉnh">
          <Input
            placeholder="Nhập ký tự cần bỏ (ví dụ: ' ,;' hoặc 'abc')"
            value={customChars}
            onChange={e => setCustomChars(e.target.value)}
          />
        </Form.Item>
      )}

      <Form.Item label="Tạo cột mới">
        <Radio.Group
          value={newColumn}
          onChange={e => setNewColumn(e.target.value)}
        >
          <Radio value={false}>Cập nhật cột hiện tại</Radio>
          <Radio value={true}>Tạo cột mới</Radio>
        </Radio.Group>
      </Form.Item>

      {newColumn && (
        <Form.Item label="Tên cột mới" required>
          <Input
            placeholder="Nhập tên cột mới"
            value={newColumnName}
            onChange={e => setNewColumnName(e.target.value)}
          />
        </Form.Item>
      )}

      {column && (
        <Form.Item label="Xem trước">
          <div style={{ 
            padding: 12, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            <div><strong>Kết quả mẫu:</strong></div>
            <div style={{ marginBottom: 8 }}>
              <strong>Trước:</strong> "  {column}  "
            </div>
            <div>
              <strong>Sau:</strong> "{column}"
            </div>
            <div style={{ marginTop: 8, color: '#666' }}>
              <strong>Loại trim:</strong> {trimOptions.find(opt => opt.value === trimType)?.label}
            </div>
            {useCustomChars && customChars && (
              <div style={{ color: '#666' }}>
                <strong>Ký tự tùy chỉnh:</strong> "{customChars}"
              </div>
            )}
          </div>
        </Form.Item>
      )}
    </Form>
  );
};

export default TrimConfig;

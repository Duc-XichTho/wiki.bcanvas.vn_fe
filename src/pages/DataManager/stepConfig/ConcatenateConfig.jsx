import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Space, Tag, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const ConcatenateConfig = ({ availableColumns = [], initialConfig = {}, onChange }) => {
  const [selectedColumns, setSelectedColumns] = useState(initialConfig.selectedColumns || []);
  const [separator, setSeparator] = useState(initialConfig.separator || '');
  const [newColumnName, setNewColumnName] = useState(initialConfig.newColumnName || '');
  const [prefix, setPrefix] = useState(initialConfig.prefix || '');
  const [suffix, setSuffix] = useState(initialConfig.suffix || '');

  useEffect(() => {
    onChange && onChange({
      selectedColumns,
      separator,
      newColumnName,
      prefix,
      suffix
    });
    // eslint-disable-next-line
  }, [selectedColumns, separator, newColumnName, prefix, suffix]);

  const addColumn = () => {
    setSelectedColumns([...selectedColumns, '']);
  };

  const removeColumn = (index) => {
    const newColumns = selectedColumns.filter((_, i) => i !== index);
    setSelectedColumns(newColumns);
  };

  const updateColumn = (index, value) => {
    const newColumns = [...selectedColumns];
    newColumns[index] = value;
    setSelectedColumns(newColumns);
  };

  const commonSeparators = [
    { value: '', label: 'Không có ký tự nối' },
    { value: ' ', label: 'Khoảng trắng ' },
    { value: ',', label: '( , ) Dấu phẩy ' },
    { value: ';', label: '( ; ) Dấu chấm phẩy ' },
    { value: '|', label: '( | ) Dấu gạch dọc ' },
    { value: '-', label: '( - ) Dấu gạch ngang ' },
    { value: '_', label: '( _ ) Dấu gạch dưới ' },
    { value: '.', label: '( . ) Dấu chấm ' },
    { value: '/', label: '( / ) Dấu gạch chéo ' },
    { value: '\\', label: '( \\ ) Dấu gạch chéo ngược ' },
  ];

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 320 }}>
      <Form.Item label="Cột cần nối" required>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {selectedColumns.map((column, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center'}}>
              <Select
                virtual={false}
                placeholder={`Chọn cột ${index + 1}`}
                value={column}
                onChange={(value) => updateColumn(index, value)}
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
                icon={<MinusCircleOutlined />}
                onClick={() => removeColumn(index)}
                disabled={selectedColumns.length <= 1}
              />
            </div>
          ))}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addColumn}
            style={{ width: '100%' }}
          >
            Thêm cột
          </Button>
        </div>
      </Form.Item>

      <Form.Item label="Ký tự nối">
        <Select
          placeholder="Chọn ký tự nối"
          value={separator}
          onChange={setSeparator}
          showSearch
          filterOption={(input, option) =>
            option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {commonSeparators.map(sep => (
            <Option key={sep.value} value={sep.value}>{sep.label}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Ký tự nối tùy chỉnh">
        <Input
          placeholder="Nhập ký tự nối tùy chỉnh (sẽ ghi đè lên lựa chọn trên)"
          value={separator}
          onChange={e => setSeparator(e.target.value)}
        />
      </Form.Item>
      <Form.Item label="Tiền tố (Prefix)">
        <Input
          placeholder="Nhập tiền tố (ví dụ: 'ID-' hoặc '[')"
          value={prefix}
          onChange={e => setPrefix(e.target.value)}
        />
      </Form.Item>

      <Form.Item label="Hậu tố (Suffix)">
        <Input
          placeholder="Nhập hậu tố (ví dụ: ']' hoặc ' USD')"
          value={suffix}
          onChange={e => setSuffix(e.target.value)}
        />
      </Form.Item>

      <Form.Item label="Tên cột mới" required>
        <Input
          placeholder="Nhập tên cột mới"
          value={newColumnName}
          onChange={e => setNewColumnName(e.target.value)}
        />
      </Form.Item>

      {selectedColumns.length > 0 && (
        <Form.Item label="Xem trước">
          <div style={{ 
            padding: 12, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            <div><strong>Kết quả mẫu:</strong></div>
            <div>
              {prefix}
              {selectedColumns.filter(col => col).join(separator || '')}
              {suffix}
            </div>
            <div style={{ marginTop: 8, color: '#666' }}>
              <strong>Công thức:</strong> {prefix}[{selectedColumns.filter(col => col).join(']' + (separator || '') + '[')}]{suffix}
            </div>
          </div>
        </Form.Item>
      )}
    </Form>
  );
};

export default ConcatenateConfig;

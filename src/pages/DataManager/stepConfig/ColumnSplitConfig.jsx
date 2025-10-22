import React, { useState, useEffect, useRef } from 'react';
import { Form, Select, Input, Radio, InputNumber, Space, Card, Divider } from 'antd';

const { Option } = Select;

const ColumnSplitConfig = ({
  availableColumns = [],
  initialConfig = {},
  onChange,
}) => {
  const [targetColumn, setTargetColumn] = useState(initialConfig.targetColumn || '');
  const [splitMethod, setSplitMethod] = useState(initialConfig.splitMethod || 'separator');
  
  // Separator method
  const [separator, setSeparator] = useState(initialConfig.separator || ',');
  
  // Position method
  const [position, setPosition] = useState(initialConfig.position || 'left');
  const [length, setLength] = useState(initialConfig.length || 1);
  const [startingChar, setStartingChar] = useState(initialConfig.startingChar || '');

  // Use ref to store onChange function to avoid dependency issues
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  
  // Output configuration
  const [outputColumns, setOutputColumns] = useState(() => {
    // Priority 1: Use newlyCreatedColumns if available (most reliable)
    if (initialConfig.newlyCreatedColumns && Array.isArray(initialConfig.newlyCreatedColumns)) {
      console.log('ColumnSplitConfig - Loading from newlyCreatedColumns:', initialConfig.newlyCreatedColumns);
      return initialConfig.newlyCreatedColumns;
    }
    
    if (initialConfig.outputColumns) {
      // Priority 2: Nếu outputColumns là array của object (format mới), chuyển thành array string cho UI
      if (Array.isArray(initialConfig.outputColumns) && initialConfig.outputColumns.length > 0) {
        if (typeof initialConfig.outputColumns[0] === 'object' && initialConfig.outputColumns[0].name) {
          	const result = initialConfig.outputColumns.map(col => typeof col === 'string' ? col : col.name);
          console.log('ColumnSplitConfig - Loading from object format:', result);
          return result;
        }
      }
      
      // Priority 3: Nếu outputColumns chứa toàn bộ schema (tất cả cột trong bảng), 
      // chỉ lấy các cột mới được tạo ra (không phải targetColumn)
      if (Array.isArray(initialConfig.outputColumns) && initialConfig.targetColumn) {
        const targetColumn = initialConfig.targetColumn;
        const filteredColumns = initialConfig.outputColumns.filter(col => {
          if (typeof col === 'string') {
            return col !== targetColumn;
          } else if (col && typeof col === 'object' && col.name) {
            return col.name !== targetColumn;
          }
          return true;
        }).map(col => typeof col === 'string' ? col : col.name);
        
        // Chỉ sử dụng filtered columns nếu số lượng cột ít hơn đáng kể so với tổng số cột
        // (điều này cho thấy đây là schema đầy đủ, không phải chỉ các cột mới)
        if (filteredColumns.length > 0 && filteredColumns.length < initialConfig.outputColumns.length * 0.8) {
          console.log('ColumnSplitConfig - Loading filtered columns from schema:', filteredColumns);
          return filteredColumns;
        }
      }
      
      console.log('ColumnSplitConfig - Loading from array format:', initialConfig.outputColumns);
      return initialConfig.outputColumns;
    }
    console.log('ColumnSplitConfig - Using default columns');
    return ['col1', 'col2'];
  });

  useEffect(() => {
    const config = {
      targetColumn,
      splitMethod,
      separator: splitMethod === 'separator' ? separator : undefined,
      position: splitMethod === 'position' ? position : undefined,
      length: splitMethod === 'position' ? length : undefined,
      startingChar: splitMethod === 'position' && position === 'mid' ? startingChar : undefined,
      outputColumns: outputColumns.map(name => ({ name, type: 'text' })), // Lưu theo format object
      outputColumnsTimestamp: new Date().toISOString(), // Thêm timestamp để track thay đổi
    };
    onChangeRef.current && onChangeRef.current(config);
  }, [targetColumn, splitMethod, separator, position, length, startingChar, outputColumns]);

  const handleOutputColumnChange = (index, value) => {
    const newOutputColumns = [...outputColumns];
    newOutputColumns[index] = value;
    setOutputColumns(newOutputColumns);
  };

  const addOutputColumn = () => {
    setOutputColumns([...outputColumns, `col${outputColumns.length + 1}`]);
  };

  const removeOutputColumn = (index) => {
    if (outputColumns.length > 2) {
      const newOutputColumns = outputColumns.filter((_, i) => i !== index);
      setOutputColumns(newOutputColumns);
    }
  };

  return (
    <Form layout="vertical" style={{ minWidth: 400 }}>
      <Form.Item label="Cột nguồn" required>
        <Select
          placeholder="Chọn cột cần tách"
          value={targetColumn}
          onChange={setTargetColumn}
          virtual={false}
        >
          {availableColumns.map(col => (
            <Option key={col} value={col}>{col}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Phương pháp tách">
        <Radio.Group
          value={splitMethod}
          onChange={(e) => setSplitMethod(e.target.value)}
        >
          <Radio value="separator">Theo ký tự phân tách</Radio>
          <Radio value="position">Theo vị trí</Radio>
        </Radio.Group>
      </Form.Item>

      {splitMethod === 'separator' && (
        <Form.Item label="Ký tự phân tách" required>
          <Input
            placeholder="Nhập ký tự phân tách (vd: ,)"
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
            style={{ width: 200 }}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            Ví dụ: dấu phẩy (,), dấu chấm phẩy (;), dấu gạch ngang (-), khoảng trắng ( )
          </div>
        </Form.Item>
      )}

      {splitMethod === 'position' && (
        <div>
          <Form.Item label="Vị trí tách">
            <Radio.Group
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <Radio value="left">Từ trái (LEFT)</Radio>
              <Radio value="right">Từ phải (RIGHT)</Radio>
              <Radio value="mid">Từ giữa (MID)</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Số ký tự" required>
            <InputNumber
              min={1}
              max={1000}
              value={length}
              onChange={setLength}
              style={{ width: 120 }}
            />
          </Form.Item>

          {position === 'mid' && (
            <Form.Item label="Bắt đầu từ">
              <Input
                placeholder="Nhập ký tự bắt đầu (vd: <, >, @)"
                value={startingChar}
                onChange={(e) => setStartingChar(e.target.value)}
                style={{ width: 200 }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Để trống nếu muốn bắt đầu từ ký tự thứ {length}
              </div>
            </Form.Item>
          )}
        </div>
      )}

      <Divider />

      <Form.Item label="Cột kết quả">
        <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {outputColumns.map((col, index) => (
              <Space key={index} style={{ width: '100%' }}>
                <span style={{ minWidth: 80 }}>Cột {index + 1}:</span>
                <Input
                  value={col}
                  onChange={(e) => handleOutputColumnChange(index, e.target.value)}
                  placeholder={`Tên cột ${index + 1}`}
                  style={{ flex: 1 }}
                />
                {outputColumns.length > 2 && (
                  <a onClick={() => removeOutputColumn(index)} style={{ color: '#ff4d4f' }}>
                    Xóa
                  </a>
                )}
              </Space>
            ))}
            <a onClick={addOutputColumn} style={{ color: '#1890ff' }}>
              + Thêm cột
            </a>
          </Space>
        </Card>
      </Form.Item>

      {targetColumn && (
        <Form.Item label="Xem trước">
          <div style={{ 
            backgroundColor: '#f0f8ff', 
            padding: 12, 
            borderRadius: 4,
            border: '1px solid #d9d9d9'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Cột nguồn: {targetColumn}
            </div>
            <div style={{ marginBottom: 8 }}>
              {splitMethod === 'separator' && (
                <span>Tách theo ký tự "{separator}" thành {outputColumns.length} cột</span>
              )}
              {splitMethod === 'position' && (
                <span>
                  Tách theo vị trí {position.toUpperCase()} 
                  {position === 'mid' && startingChar && ` từ ký tự "${startingChar}"`} 
                  , lấy {length} ký tự
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Kết quả: {outputColumns.join(', ')}
            </div>
          </div>
        </Form.Item>
      )}
    </Form>
  );
};

export default ColumnSplitConfig; 
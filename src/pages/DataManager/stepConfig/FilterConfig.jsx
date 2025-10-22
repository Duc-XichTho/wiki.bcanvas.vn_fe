import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Radio, Space, Switch, InputNumber, Alert } from 'antd';

const { Option } = Select;

const operatorOptions = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '≠' },
  { value: 'greater', label: '>' },
  { value: 'greater_equal', label: '>=' },
  { value: 'less', label: '<' },
  { value: 'less_equal', label: '<=' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'not_starts_with', label: 'Not Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'not_ends_with', label: 'Not Ends with' },
  { value: 'isNull', label: 'Is Null' },
  { value: 'isNotNull', label: 'Is Not Null' },
];

const defaultCondition = { column: '', operator: 'equals', value: '' };

const FilterConfig = ({ availableColumns = [], initialConfig = {}, onChange }) => {
  const [conditions, setConditions] = useState(initialConfig.conditions && initialConfig.conditions.length > 0 ? initialConfig.conditions : [defaultCondition]);
  const [logic, setLogic] = useState(initialConfig.logic || 'and');
  
  // Top filter states
  const [enableTopFilter, setEnableTopFilter] = useState(initialConfig.enableTopFilter || false);
  const [topCount, setTopCount] = useState(initialConfig.topCount || 10);
  const [topColumn, setTopColumn] = useState(initialConfig.topColumn || '');
  const [topOrder, setTopOrder] = useState(initialConfig.topOrder || 'desc'); // 'asc' or 'desc'

  useEffect(() => {
    onChange && onChange({ 
      conditions, 
      logic,
      enableTopFilter,
      topCount,
      topColumn,
      topOrder
    });
    // eslint-disable-next-line
  }, [conditions, logic, enableTopFilter, topCount, topColumn, topOrder]);

  const addCondition = () => {
    setConditions([...conditions, defaultCondition]);
  };

  const removeCondition = (idx) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx, key, value) => {
    setConditions(conditions.map((cond, i) => i === idx ? { ...cond, [key]: value } : cond));
  };

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 320 }}>
      <Alert
        message="Lọc tách bảng"
        description="Thiết lập điều kiện lọc dữ liệu và tùy chọn lấy top N bản ghi"
        type="info"
        showIcon
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {conditions.map((condition, idx) => (
          <Space key={idx} align="start" style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            <Select
              virtual={false}
              placeholder="Chọn cột"
              value={condition.column}
              onChange={v => updateCondition(idx, 'column', v)}
              style={{ minWidth: 120 }}
            >
              {availableColumns.map(col => (
                <Option key={col} value={col}>{col}</Option>
              ))}
            </Select>
            <Select
              placeholder="Chọn toán tử"
              value={condition.operator}
              onChange={v => updateCondition(idx, 'operator', v)}
              style={{ minWidth: 110 }}
            >
              {operatorOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
            {!['isNull', 'isNotNull'].includes(condition.operator) && (
              <Input
                placeholder="Value"
                value={condition.value}
                onChange={e => updateCondition(idx, 'value', e.target.value)}
                style={{ minWidth: 100 }}
              />
            )}
            <Button type="text" danger onClick={() => removeCondition(idx)} disabled={conditions.length === 1}>
              Remove
            </Button>
          </Space>
        ))}
        <Button type="dashed" onClick={addCondition} style={{ width: 160, marginTop: 4 }}>
          Add Condition
        </Button>
      </div>
      
      <Form.Item label="Logic giữa các điều kiện" required>
        <Radio.Group value={logic} onChange={e => setLogic(e.target.value)}>
          <Radio value="and">AND (tất cả điều kiện đúng)</Radio>
          <Radio value="or">OR (chỉ cần một điều kiện đúng)</Radio>
        </Radio.Group>
      </Form.Item>

      {/* Top Filter Section */}
      <Form.Item>
        <div style={{ 
          padding: '16px',
          backgroundColor: '#f0f5ff',
          border: '1px solid #1890ff',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Switch
              checked={enableTopFilter}
              onChange={setEnableTopFilter}
              style={{ marginRight: 8 }}
            />
            <span style={{ fontWeight: 'bold' }}>Bật lọc Top N bản ghi</span>
          </div>
          
          {enableTopFilter && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ minWidth: '80px' }}>Số lượng:</span>
                <InputNumber
                  value={topCount}
                  onChange={setTopCount}
                  min={1}
                  max={10000}
                  style={{ width: '100px' }}
                  placeholder="10"
                />
                <span style={{ fontSize: '12px', color: '#666' }}>bản ghi</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ minWidth: '80px' }}>Sắp xếp theo:</span>
                <Select
                  value={topColumn}
                  onChange={setTopColumn}
                  style={{ flex: 1 }}
                  placeholder="Chọn cột để sắp xếp"
                >
                  {availableColumns.map(col => (
                    <Option key={col} value={col}>{col}</Option>
                  ))}
                </Select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ minWidth: '80px' }}>Thứ tự:</span>
                <Select
                  value={topOrder}
                  onChange={setTopOrder}
                  style={{ width: '200px' }}
                >
                  <Option value="desc">Giảm dần (Cao → Thấp)</Option>
                  <Option value="asc">Tăng dần (Thấp → Cao)</Option>
                </Select>
              </div>
              
              <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                💡 Lấy {topCount} bản ghi có giá trị {topOrder === 'desc' ? 'cao nhất' : 'thấp nhất'} 
                {topColumn ? ` ở cột "${topColumn}"` : ''}
              </div>
            </div>
          )}
        </div>
      </Form.Item>

      {enableTopFilter && !topColumn && (
        <Alert
          message="Cảnh báo Top Filter"
          description="Vui lòng chọn cột để sắp xếp khi sử dụng lọc Top"
          type="warning"
          showIcon
        />
      )}
    </Form>
  );
};

export default FilterConfig; 
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Tag, Button, Space, Divider, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const dataTypeOptions = [
  { value: 'number', label: 'Number' },
  { value: 'string', label: 'String' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
];

const CalculatedConfig = ({ availableColumns = [], initialConfig = {}, onChange, inputColumns = [] }) => {
  const [newColumnName, setNewColumnName] = useState(initialConfig.newColumnName || '');
  const [expression, setExpression] = useState(initialConfig.expression || '');
  const [dataType, setDataType] = useState( 'number');
  const [variableMappings, setVariableMappings] = useState(initialConfig.variableMappings || {});
  console.log('inputColumns', inputColumns);

  // Reset state khi initialConfig thay đổi (khi mở modal edit step khác)
  // useEffect(() => {
  //   setNewColumnName(initialConfig.newColumnName || '');
  //   setExpression(initialConfig.expression || '');
  //   setDataType(initialConfig.dataType || 'number');
  //   setVariableMappings(initialConfig.variableMappings || {});
  // }, [initialConfig]);
  useEffect(() => {
    // Tạo công thức từ expression và variable mappings
    let finalFormula = expression;
    console.log('🔍 [CalculatedConfig] Creating formula:', {
      expression,
      variableMappings,
      initialFormula: finalFormula
    });
    
    // Cắt theo dấu phép tính và thay thế chính xác
    const operators = /([+\-*/^()])/;
    const parts = finalFormula.split(operators);
    
    const newParts = parts.map(part => {
      // Nếu phần này là biến (không phải operator)
      if (part && !operators.test(part) && variableMappings[part]) {
        console.log(`🔄 [CalculatedConfig] Replacing ${part} with ${variableMappings[part]}`);
        return variableMappings[part];
      }
      return part;
    });
    
    finalFormula = newParts.join('');
    console.log('📊 [CalculatedConfig] Final formula:', finalFormula);
    
    onChange && onChange({ 
      newColumnName, 
      formula: finalFormula, 
      expression,
      dataType, 
      variableMappings 
    });
    // eslint-disable-next-line
  }, [newColumnName, expression, dataType, variableMappings]);

  // Tìm tất cả biến trong expression (a, b, c, ...)
  const extractVariables = (expr) => {
    const variables = expr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    return [...new Set(variables)].filter(v => !['concat', 'and', 'or', 'not'].includes(v));
  };

  const variables = extractVariables(expression);

  // Lọc chỉ lấy các cột có type number cho phép tính toán
  const getNumberColumns = () => {
    if (inputColumns && inputColumns.length > 0) {
    
      // Nếu có inputColumns với thông tin type
      return inputColumns.filter(col => {
        if (typeof col === 'string') {
          return true; // Fallback: cho phép tất cả nếu không có type info
        }
        return col.type === 'number' || col.type === 'numeric';
      }).map(col => typeof col === 'string' ? col : col.name);
    }
    // Fallback: sử dụng availableColumns nếu không có inputColumns
    return availableColumns;
  };

  const numberColumns = getNumberColumns();

  const updateVariableMapping = (variable, column) => {
    setVariableMappings(prev => ({
      ...prev,
      [variable]: column
    }));
  };

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 400 }}>
      <Form.Item label="Tên cột mới" required>
        <Input
          placeholder="New column name"
          value={newColumnName}
          onChange={e => setNewColumnName(e.target.value)}
        />
      </Form.Item>
      
      {/* <Form.Item label="Kiểu dữ liệu" required>
        <Select
          placeholder="Chọn kiểu dữ liệu"
          value={dataType}
          onChange={setDataType}
        >
          {dataTypeOptions.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Select>
      </Form.Item> */}

      <Divider orientation="left">Biểu thức tính toán</Divider>

      <Alert
        message="Hướng dẫn sử dụng"
        description={
          <div>
            <div>• Nhập biểu thức với các biến (a, b, c, ...) sau đó chọn cột cho từng biến</div>
            <div>• <strong>Chỉ các cột có type Number mới được phép sử dụng trong phép tính</strong></div>
            <div>• Ví dụ: a*b+c, price*quantity+tax, (revenue-cost)/revenue*100</div>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* Nhập biểu thức */}
      <Form.Item label="Biểu thức" required>
        <Input
          placeholder="Nhập biểu thức (ví dụ: a*b+c, price*quantity+tax)"
          value={expression}
          onChange={e => setExpression(e.target.value)}
        />
      </Form.Item>

      {/* Hiển thị các biến cần map */}
      {variables.length > 0 && (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Chọn cột cho từng biến:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {variables.map(variable => (
              <div key={variable} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Tag color="blue" style={{ minWidth: 40, textAlign: 'center' }}>
                  {variable}
                </Tag>
                <span style={{ color: '#666' }}>→</span>
                <Select
                  virtual={false}
                  placeholder={`Chọn cột số cho ${variable}`}
                  value={variableMappings[variable] || ''}
                  onChange={(value) => updateVariableMapping(variable, value)}
                  style={{ minWidth: 200 }}
                  allowClear
                  notFoundContent={numberColumns.length === 0 ? "Không có cột số nào khả dụng" : "Không tìm thấy"}
                >
                  {numberColumns.map(col => (
                    <Option key={col} value={col}>
                      <span>{col}</span>
                      <span style={{ color: '#999', fontSize: '12px', marginLeft: 8 }}>(Number)</span>
                    </Option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Công thức cuối cùng */}
      {expression && (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Công thức cuối cùng:</div>
          <Input.TextArea
            value={(() => {
              let finalFormula = expression;
              
              // Cắt theo dấu phép tính và thay thế chính xác
              const operators = /([+\-*/^()])/;
              const parts = finalFormula.split(operators);
              
              const newParts = parts.map(part => {
                // Nếu phần này là biến (không phải operator)
                if (part && !operators.test(part) && variableMappings[part]) {
                  return variableMappings[part];
                }
                return part;
              });
              
              finalFormula = newParts.join('');
              return finalFormula;
            })()}
            readOnly
            rows={2}
            style={{ backgroundColor: '#f5f5f5' }}
          />
        </div>
      )}

      {/* Ví dụ và thông báo về cột số */}
      <div>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>Ví dụ:</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div>• <code>a*b+c</code> → Chọn cột số cho a, b, c</div>
          <div>• <code>price*quantity+tax</code> → Chọn cột số cho price, quantity, tax</div>
          <div>• <code>(revenue-cost)/revenue*100</code> → Tính phần trăm lợi nhuận</div>
        </div>
        
        {numberColumns.length === 0 && (
          <Alert
            message="Không có cột số"
            description="Không tìm thấy cột nào có type Number để thực hiện phép tính. Vui lòng đảm bảo dữ liệu đầu vào có ít nhất một cột số."
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
          />
        )}
        
        {numberColumns.length > 0 && (
          <div style={{ marginTop: 12, padding: 8, backgroundColor: '#f6ffed', borderRadius: 4, fontSize: '12px' }}>
            <div style={{ color: '#52c41a', fontWeight: 500, marginBottom: 4 }}>
              ✓ Có {numberColumns.length} cột số khả dụng:
            </div>
            <div style={{ color: '#666' }}>
              {numberColumns.slice(0, 10).join(', ')}
              {numberColumns.length > 10 && ` và ${numberColumns.length - 10} cột khác...`}
            </div>
          </div>
        )}
      </div>
    </Form>
  );
};

export default CalculatedConfig; 
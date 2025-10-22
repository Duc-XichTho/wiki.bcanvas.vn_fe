import React, { useEffect, useState } from 'react';
import { Button, Form, Select, Table } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

const ConvertToValueConfig = ({ availableColumns = [], outputColumns = [], initialConfig = {}, onChange }) => {
  const [columnMappings, setColumnMappings] = useState(
    initialConfig.columnMappings || 
    (initialConfig.columns && initialConfig.convertToType ? 
      initialConfig.columns.map(col => ({ column: col, dataType: initialConfig.convertToType })) : 
      [])
  );

  useEffect(() => {
    if (onChange) {
      const columns = columnMappings.map(mapping => mapping.column).filter(Boolean);
      const convertToType = columnMappings.length > 0 ? columnMappings[0].dataType : 'text';
      onChange({ 
        columns, 
        convertToType, 
        columnMappings
      });
    }
    // eslint-disable-next-line
  }, [columnMappings]);

  const dataTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number ' },
    // { value: 'databar', label: 'DataBar' },
    // { value: 'integer', label: 'Integer (Số nguyên)', icon: '🔢' },
    // { value: 'boolean', label: 'Boolean (Đúng/Sai)', icon: '✅' },
    // { value: 'date', label: 'Date (Ngày tháng)', icon: '📅' },
    // { value: 'currency', label: 'Currency (Tiền tệ)', icon: '💰' },
    // { value: 'percentage', label: 'Percentage (Phần trăm)', icon: '📊' },
    // { value: 'email', label: 'Email', icon: '📧' },
    // { value: 'url', label: 'URL', icon: '🔗' },
    // { value: 'phone', label: 'Phone (Số điện thoại)', icon: '📞' },
    // { value: 'json', label: 'JSON (Đối tượng)', icon: '📋' }
  ];


  const addColumnMapping = () => {
    setColumnMappings([...columnMappings, { column: '', dataType: 'text' }]);
  };

  const removeColumnMapping = (index) => {
    const newMappings = columnMappings.filter((_, i) => i !== index);
    setColumnMappings(newMappings);
  };

  const updateColumnMapping = (index, field, value) => {
    const newMappings = [...columnMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setColumnMappings(newMappings);
  };

  const getAvailableColumnsForMapping = (currentIndex) => {
    const usedColumns = columnMappings
      .map((mapping, index) => index !== currentIndex ? mapping.column : null)
      .filter(Boolean);
    // Sử dụng outputColumns nếu có, ngược lại fallback về availableColumns
    const sourceColumns = outputColumns.length > 0 ? outputColumns : availableColumns;
    return sourceColumns.filter(col => !usedColumns.includes(col));
  };

  const columns = [
    {
      title: 'Cột',
      dataIndex: 'column',
      key: 'column',
      width: '40%',
      render: (value, record, index) => (
        <Select
          value={value}
          onChange={(val) => updateColumnMapping(index, 'column', val)}
          placeholder="Chọn cột"
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          virtual={false}
        >
          {getAvailableColumnsForMapping(index).map(col => (
            <Option key={col} value={col}>
              {col}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Kiểu dữ liệu',
      dataIndex: 'dataType',
      key: 'dataType',
      width: '50%',
      render: (value, record, index) => (
        <Select
          value={value}
          onChange={(val) => updateColumnMapping(index, 'dataType', val)}
          style={{ width: '100%' }}
          placeholder="Chọn kiểu dữ liệu"
        >
          {dataTypeOptions.map(option => (
            <Option key={option.value} value={option.value}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* <span>{option.icon}</span> */}
                <span>{option.label}</span>
              </span>
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
          onClick={() => removeColumnMapping(index)}
          size="small"
        />
      ),
    },
  ];

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 600 }}>
      <Form.Item>
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <span style={{ fontWeight: 500 }}>Chọn cột và kiểu dữ liệu đích</span>
              {outputColumns.length > 0 && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Dựa trên output columns của step trước ({outputColumns.length} cột)
                </div>
              )}
            </div>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addColumnMapping}
              size="small"
            >
              Thêm cột
            </Button>
          </div>
          
          {columnMappings.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: '#999',
              border: '2px dashed #d9d9d9',
              borderRadius: 6
            }}>
              <p>Chưa có cột nào được chọn</p>
              <p style={{ fontSize: 12 }}>
                {outputColumns.length > 0 
                  ? `Nhấn "Thêm cột" để chọn từ ${outputColumns.length} cột có sẵn`
                  : 'Nhấn "Thêm cột" để bắt đầu cấu hình'
                }
              </p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={columnMappings.map((mapping, index) => ({ ...mapping, key: index }))}
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          )}
        </div>
      </Form.Item>

      <Form.Item>
        <div style={{ 
          padding: 16, 
          backgroundColor: '#f0f9ff', 
          borderRadius: 8,
          fontSize: 13,
          color: '#1e40af',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#1e40af' }}>
            ℹ️ Thông tin về step này
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Mục đích:</strong> Step này chuyển đổi kiểu dữ liệu của các cột được chọn và xử lý dữ liệu thực tế.
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Cách hoạt động:</strong> Dữ liệu sẽ được xử lý và chuyển đổi theo kiểu dữ liệu được chọn.
          </div>
          
          <div style={{ 
            padding: 12, 
            backgroundColor: '#fff3cd', 
            borderRadius: 6,
            border: '1px solid #ffeaa7',
            marginBottom: 12
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#856404' }}>
              ⚠️ Lưu ý quan trọng về xử lý dữ liệu
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#856404' }}>
              <li style={{ marginBottom: 4 }}>
                <strong>Number:</strong> Giá trị không phải số sẽ báo lỗi (ERROR)
              </li>
              <li>
                <strong>Text:</strong> Tất cả giá trị sẽ được chuyển thành chuỗi ký tự
              </li>
            </ul>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 12 }}>
            <div style={{ padding: 8, backgroundColor: 'white', borderRadius: 4, border: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>📝 Text</div>
              <div style={{ fontSize: 11 }}>Chuỗi ký tự - Chuyển đổi tất cả thành text</div>
            </div>
            <div style={{ padding: 8, backgroundColor: 'white', borderRadius: 4, border: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>🔢 Number</div>
              <div style={{ fontSize: 11 }}>Số thực - Giá trị không hợp lệ → ERROR</div>
            </div>
          </div>
        </div>
      </Form.Item>
    </Form>
  );
};

export default ConvertToValueConfig;

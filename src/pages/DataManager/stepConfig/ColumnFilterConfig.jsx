import React, { useState, useEffect } from 'react';
import { Form, Select, Checkbox, Switch, Button, Tag, Space, Alert, InputNumber } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

const ColumnFilterConfig = ({ availableColumns = [], initialConfig = {}, onChange }) => {
  const [filterMode, setFilterMode] = useState(initialConfig.filterMode || 'exclude'); // 'exclude' or 'include'
  const [selectedColumns, setSelectedColumns] = useState(initialConfig.selectedColumns || []);
  const [showPreview, setShowPreview] = useState(false);
  
  // Top filter states
  const [enableTopFilter, setEnableTopFilter] = useState(initialConfig.enableTopFilter || false);
  const [topCount, setTopCount] = useState(initialConfig.topCount || 10);
  const [topColumn, setTopColumn] = useState(initialConfig.topColumn || '');
  const [topOrder, setTopOrder] = useState(initialConfig.topOrder || 'desc'); // 'asc' or 'desc'

  useEffect(() => {
    onChange && onChange({ 
      filterMode, 
      selectedColumns,
      enableTopFilter,
      topCount,
      topColumn,
      topOrder
    });
    // eslint-disable-next-line
  }, [filterMode, selectedColumns, enableTopFilter, topCount, topColumn, topOrder]);

  const handleColumnToggle = (columnName) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnName)) {
        return prev.filter(col => col !== columnName);
      } else {
        return [...prev, columnName];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedColumns([...availableColumns]);
  };

  const handleDeselectAll = () => {
    setSelectedColumns([]);
  };

  const getResultingColumns = () => {
    if (filterMode === 'exclude') {
      return availableColumns.filter(col => !selectedColumns.includes(col));
    } else {
      return availableColumns.filter(col => selectedColumns.includes(col));
    }
  };

  const resultingColumns = getResultingColumns();

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 400 }}>
      <Alert
        message="Column Filter & Top Filter"
        description="Chọn các cột để giữ lại hoặc loại bỏ, và tùy chọn lọc top N bản ghi"
        type="info"
        showIcon
      />

      <Form.Item label="Chế độ lọc cột" required>
        <Select
          value={filterMode}
          onChange={setFilterMode}
          style={{ width: '100%' }}
        >
          <Option value="exclude">Loại bỏ các cột đã chọn</Option>
          <Option value="include">Chỉ giữ lại các cột đã chọn</Option>
        </Select>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          {filterMode === 'exclude' 
            ? 'Các cột được chọn sẽ bị loại bỏ khỏi kết quả'
            : 'Chỉ các cột được chọn sẽ được giữ lại trong kết quả'
          }
        </div>
      </Form.Item>

      <Form.Item label={`Chọn cột (${selectedColumns.length}/${availableColumns.length})`}>
        <div style={{ marginBottom: 8 }}>
          <Space>
            <Button 
              size="small" 
              onClick={handleSelectAll}
              disabled={selectedColumns.length === availableColumns.length}
            >
              Chọn tất cả
            </Button>
            <Button 
              size="small" 
              onClick={handleDeselectAll}
              disabled={selectedColumns.length === 0}
            >
              Bỏ chọn tất cả
            </Button>
            <Button 
              size="small" 
              type="link"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Ẩn' : 'Hiển thị'} kết quả
            </Button>
          </Space>
        </div>

        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '8px'
        }}>
          {availableColumns.map(columnName => (
            <div 
              key={columnName}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: selectedColumns.includes(columnName) ? '#f0f5ff' : 'transparent',
                border: selectedColumns.includes(columnName) ? '1px solid #1890ff' : '1px solid transparent',
                marginBottom: '2px'
              }}
            >
              <Checkbox
                checked={selectedColumns.includes(columnName)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleColumnToggle(columnName);
                }}
                style={{ marginRight: 8 }}
              />
              <span 
                style={{ 
                  flex: 1, 
                  color: selectedColumns.includes(columnName) ? '#1890ff' : '#000',
                  fontWeight: selectedColumns.includes(columnName) ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
                onClick={() => handleColumnToggle(columnName)}
              >
                {columnName}
              </span>
              {selectedColumns.includes(columnName) && (
                <MinusCircleOutlined 
                  style={{ color: '#ff4d4f', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColumnToggle(columnName);
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {availableColumns.length === 0 && (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#999',
            border: '1px dashed #d9d9d9',
            borderRadius: '6px'
          }}>
            Không có cột nào để chọn
          </div>
        )}
      </Form.Item>

      {showPreview && (
        <Form.Item label="Kết quả sau khi lọc">
          <div style={{ 
            padding: '12px',
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '6px'
          }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
              {filterMode === 'exclude' 
                ? `Sẽ loại bỏ ${selectedColumns.length} cột, còn lại ${resultingColumns.length} cột:`
                : `Sẽ giữ lại ${selectedColumns.length} cột đã chọn:`
              }
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {resultingColumns.map(col => (
                <Tag key={col} color="green">{col}</Tag>
              ))}
            </div>
            {resultingColumns.length === 0 && (
              <div style={{ color: '#ff4d4f', fontStyle: 'italic' }}>
                ⚠️ Cảnh báo: Không có cột nào sẽ được giữ lại!
              </div>
            )}
            
            {enableTopFilter && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #d9d9d9' }}>
                <div style={{ fontWeight: 'bold' }}>
                  Lọc Top: {topCount} bản ghi 
                  {topColumn && ` theo cột "${topColumn}"`} 
                  ({topOrder === 'desc' ? 'giảm dần' : 'tăng dần'})
                </div>
              </div>
            )}
          </div>
        </Form.Item>
      )}

      {selectedColumns.length === 0 && (
        <Alert
          message="Chưa chọn cột nào"
          description="Vui lòng chọn ít nhất một cột để thực hiện lọc"
          type="warning"
          showIcon
        />
      )}

      {filterMode === 'include' && selectedColumns.length === 0 && (
        <Alert
          message="Cảnh báo"
          description="Chế độ 'Chỉ giữ lại' mà không chọn cột nào sẽ loại bỏ tất cả các cột"
          type="error"
          showIcon
        />
      )}
      
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

export default ColumnFilterConfig; 
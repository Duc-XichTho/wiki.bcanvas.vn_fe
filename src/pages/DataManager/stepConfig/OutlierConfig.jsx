import React, { useState, useEffect } from 'react';
import { Form, Select, Checkbox, Input, InputNumber } from 'antd';

const { Option } = Select;

const methodOptions = [
  { value: 'iqr', label: 'IQR (Interquartile Range) - Dùng Q1-Q3' },
  { value: 'zscore', label: 'Z-Score - Dùng độ lệch chuẩn' },
  { value: 'mad', label: 'MAD (Median Absolute Deviation) - Robust method' },
  { value: 'isolation', label: 'Isolation Forest - Dùng modified Z-score' },
  { value: 'percentile', label: 'Percentile Method - Dùng P1-P99' },
];

const actionOptions = [
  { value: 'remove', label: 'Remove outliers - Loại bỏ hoàn toàn' },
  { value: 'flag', label: 'Flag outliers - Đánh dấu bằng cột cờ' },
  { value: 'cap', label: 'Cap outliers - Giới hạn giá trị' },
];

const OutlierConfig = ({ numericColumns = [], initialConfig = {}, onChange }) => {
  const [column, setColumn] = useState(initialConfig.column || '');
  const [method, setMethod] = useState(initialConfig.method || 'iqr');
  const [action, setAction] = useState(initialConfig.action || 'remove');
  const [newColumn, setNewColumn] = useState(initialConfig.newColumn || false);
  const [columnName, setColumnName] = useState(initialConfig.columnName || '');
  const [ignoreZero, setIgnoreZero] = useState(initialConfig.ignoreZero || false);
  const [threshold, setThreshold] = useState(initialConfig.threshold || (method === 'zscore' ? 3 : method === 'mad' ? 3.5 : method === 'isolation' ? 3.5 : method === 'percentile' ? 99 : 1.5));

  useEffect(() => {
    onChange && onChange({ column, method, action, newColumn, columnName, ignoreZero, threshold });
    // eslint-disable-next-line
  }, [column, method, action, newColumn, columnName, ignoreZero, threshold]);

  // Cập nhật threshold mặc định khi method thay đổi
  useEffect(() => {
    if (method === 'zscore') {
      setThreshold(3);
    } else if (method === 'mad') {
      setThreshold(3.5);
    } else if (method === 'isolation') {
      setThreshold(3.5);
    } else if (method === 'percentile') {
      setThreshold(99);
    } else {
      setThreshold(1.5);
    }
  }, [method]);

  return (
    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 320 }}>
      <Form.Item label="Chọn cột số để phát hiện ngoại lai" required>
        <Select
          placeholder="Chọn cột số"
          value={column}
          onChange={setColumn}
          virtual={false}
        >
          {numericColumns.map(col => (
            <Option key={col} value={col}>{col}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="Phương pháp phát hiện" required>
        <Select
          placeholder="Chọn phương pháp"
          value={method}
          onChange={setMethod}
        >
          {methodOptions.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Select>
        {method === 'iqr' && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Sử dụng khoảng tứ phân vị (Q1-Q3). Ngoại lệ: giá trị &lt; Q1-1.5*IQR hoặc &gt; Q3+1.5*IQR
          </div>
        )}
        {method === 'zscore' && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Dùng độ lệch chuẩn. Ngoại lệ: giá trị có |Z-score| &gt; 3
          </div>
        )}
        {method === 'mad' && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Phương pháp Iglewicz-Hoaglin sử dụng MAD (robust với outliers). Ngoại lệ: |Modified Z-score| &gt; 3.5
          </div>
        )}
        {method === 'isolation' && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Sử dụng modified Z-score với sample standard deviation. Ngoại lệ: giá trị có score &gt; 3.5
          </div>
        )}
        {method === 'percentile' && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Dùng percentile (P1-P99). Ngoại lệ: giá trị &lt; P1 hoặc &gt; P99
          </div>
        )}
      </Form.Item>
      
      <Form.Item label="Ngưỡng phát hiện">
        <InputNumber
          min={method === 'percentile' ? 90 : 0.1}
          max={method === 'percentile' ? 99.9 : 10}
          step={method === 'percentile' ? 0.1 : 0.1}
          value={threshold}
          onChange={setThreshold}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          {method === 'iqr' && 'Hệ số IQR (mặc định: 1.5)'}
          {method === 'zscore' && 'Ngưỡng Z-score (mặc định: 3)'}
          {method === 'mad' && 'Ngưỡng MAD Modified Z-score (mặc định: 3.5)'}
          {method === 'isolation' && 'Ngưỡng Isolation score (mặc định: 3.5)'}
          {method === 'percentile' && 'Percentile % (mặc định: 99, tức P1-P99)'}
        </div>
      </Form.Item>

      <Form.Item>
        <Checkbox checked={ignoreZero} onChange={e => setIgnoreZero(e.target.checked)}>
          Bỏ qua giá trị 0 khi tính toán thống kê
        </Checkbox>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Hữu ích cho dữ liệu doanh thu, giá bán... khi 0 có thể là missing data
        </div>
      </Form.Item>
      
      <Form.Item label="Hành động với ngoại lai" required>
        <Select
          placeholder="Chọn hành động"
          value={action}
          onChange={setAction}
        >
          {actionOptions.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Select>
        {action === 'remove' && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Loại bỏ hoàn toàn các dòng có giá trị ngoại lệ
          </div>
        )}
        {action === 'flag' && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Giữ nguyên dữ liệu, tạo cột mới để đánh dấu ngoại lệ
          </div>
        )}
        {action === 'cap' && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Giới hạn giá trị ngoại lệ về ngưỡng cho phép
          </div>
        )}
      </Form.Item>
      {action === 'flag' && (
        <>
          <Form.Item>
            <Checkbox checked={newColumn} onChange={e => setNewColumn(e.target.checked)}>
              Tạo cột cờ ngoại lệ mới (1 = ngoại lệ, 0 = bình thường)
            </Checkbox>
          </Form.Item>
          {newColumn && (
            <Form.Item label="Tên cột cờ ngoại lệ" required>
              <Input
                placeholder="Nhập tên cột cờ (vd: is_outlier)"
                value={columnName}
                onChange={e => setColumnName(e.target.value)}
              />
            </Form.Item>
          )}
        </>
      )}
    </Form>
  );
};

export default OutlierConfig; 
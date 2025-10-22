import React, { useState, useEffect, useRef } from 'react';
import { Form, Select, Input, Card, Alert, Space } from 'antd';

const { Option } = Select;

const DateConverterConfig = ({
  availableColumns = [],
  initialConfig = {},
  onChange,
}) => {
  const [yearColumn, setYearColumn] = useState(initialConfig.yearColumn || '');
  const [monthColumn, setMonthColumn] = useState(initialConfig.monthColumn || '');
  const [dayColumn, setDayColumn] = useState(initialConfig.dayColumn || '');
  const [outputColumn, setOutputColumn] = useState(initialConfig.outputColumn || 'date');
  const [dateFormat, setDateFormat] = useState(initialConfig.dateFormat || 'YYYY-MM-DD');

  // Use ref to store onChange function to avoid dependency issues
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const config = {
      yearColumn,
      monthColumn,
      dayColumn,
      outputColumn,
      dateFormat,
    };
    onChangeRef.current && onChangeRef.current(config);
  }, [yearColumn, monthColumn, dayColumn, outputColumn, dateFormat]);

  const validateConfiguration = () => {
    const errors = [];
    if (!yearColumn) errors.push('Chưa chọn cột năm');
    if (!monthColumn) errors.push('Chưa chọn cột tháng');
    if (!dayColumn) errors.push('Chưa chọn cột ngày');
    if (!outputColumn) errors.push('Chưa nhập tên cột kết quả');
    return errors;
  };

  const errors = validateConfiguration();

  return (
    <Form layout="vertical" style={{ minWidth: 400 }}>
      <Alert
        message="Date Converter"
        description="Chọn 3 cột để tạo thành ngày tháng. Dữ liệu tháng phải từ 1-12, ngày phải từ 1-31."
        type="info"
        style={{ marginBottom: 16 }}
      />

      <Form.Item label="Cột năm (Year)" required>
        <Select
          placeholder="Chọn cột chứa năm"
          value={yearColumn}
          onChange={setYearColumn}
          virtual={false}
        >
          {availableColumns.map(col => (
            <Option key={col} value={col}>{col}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Cột tháng (Month)" required>
        <Select
          placeholder="Chọn cột chứa tháng (1-12)"
          value={monthColumn}
          onChange={setMonthColumn}
          virtual={false}
        >
          {availableColumns.map(col => (
            <Option key={col} value={col}>{col}</Option>
          ))}
        </Select>
        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
          Giá trị phải là số từ 1 đến 12
        </div>
      </Form.Item>

      <Form.Item label="Cột ngày (Day)" required>
        <Select
          placeholder="Chọn cột chứa ngày (1-31)"
          value={dayColumn}
          onChange={setDayColumn}
          virtual={false}
        >
          {availableColumns.map(col => (
            <Option key={col} value={col}>{col}</Option>
          ))}
        </Select>
        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
          Giá trị phải là số từ 1 đến 31
        </div>
      </Form.Item>

      <Form.Item label="Tên cột kết quả" required>
        <Input
          placeholder="Nhập tên cột sẽ chứa ngày"
          value={outputColumn}
          onChange={(e) => setOutputColumn(e.target.value)}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Định dạng ngày">
        <Select
          value={dateFormat}
          onChange={setDateFormat}
          style={{ width: '100%' }}
        >
          <Option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</Option>
          <Option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</Option>
          <Option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</Option>
          <Option value="YYYY/MM/DD">YYYY/MM/DD (2024/12/31)</Option>
          <Option value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</Option>
          {/* <Option value="ISO">ISO String (2024-12-31T00:00:00.000Z)</Option> */}
        </Select>
      </Form.Item>

      {errors.length > 0 && (
        <Alert
          message="Cấu hình chưa hoàn chỉnh"
          description={
            <ul style={{ marginBottom: 0 }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          }
          type="warning"
          style={{ marginBottom: 16 }}
        />
      )}

      {yearColumn && monthColumn && dayColumn && outputColumn && (
        <Form.Item label="Xem trước">
          <Card size="small" style={{ backgroundColor: '#f0f8ff' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ fontWeight: 'bold' }}>
                Cấu hình chuyển đổi ngày:
              </div>
              <div>
                <strong>Năm:</strong> {yearColumn} <br />
                <strong>Tháng:</strong> {monthColumn} <br />
                <strong>Ngày:</strong> {dayColumn}
              </div>
              <div>
                <strong>Kết quả:</strong> {outputColumn} ({dateFormat})
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Ví dụ: 2024, 12, 31 → {
                  (() => {
                    const date = new Date(2024, 11, 31); // Month is 0-indexed
                    switch (dateFormat) {
                      case 'YYYY-MM-DD':
                        return '2024-12-31';
                      case 'DD/MM/YYYY':
                        return '31/12/2024';
                      case 'MM/DD/YYYY':
                        return '12/31/2024';
                      case 'YYYY/MM/DD':
                        return '2024/12/31';
                      case 'DD-MM-YYYY':
                        return '31-12-2024';
                      case 'ISO':
                        return date.toISOString();
                      default:
                        return '2024-12-31';
                    }
                  })()
                }
              </div>
            </Space>
          </Card>
        </Form.Item>
      )}
    </Form>
  );
};

export default DateConverterConfig; 
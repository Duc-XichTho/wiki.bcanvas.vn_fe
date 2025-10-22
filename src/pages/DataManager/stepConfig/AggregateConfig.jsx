import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Space, Card, Typography, Divider, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const functionOptions = [
  { value: 'sum', label: 'Sum', description: 'Tổng các giá trị số' },
  { value: 'count', label: 'Count', description: 'Số lượng bản ghi' },
  { value: 'avg', label: 'Average', description: 'Giá trị trung bình' },
  { value: 'min', label: 'Min', description: 'Giá trị nhỏ nhất' },
  { value: 'max', label: 'Max', description: 'Giá trị lớn nhất' },
  { value: 'std', label: 'Standard Deviation', description: 'Độ lệch chuẩn' },
  { value: 'distinct_count', label: 'Distinct Count', description: 'Số lượng giá trị khác nhau' },
];

const defaultAgg = { column: '', function: 'sum', alias: '' };

const AggregateConfig = ({ availableColumns = [], initialConfig = {}, onChange, inputStepId, templateData, getTemplateRow, stepIndex, normalizedSteps }) => {
  const [groupBy, setGroupBy] = useState(initialConfig.groupBy || []);
  const [aggregations, setAggregations] = useState(initialConfig.aggregations && initialConfig.aggregations.length > 0 ? initialConfig.aggregations : [defaultAgg]);
  const [inputColumns, setInputColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy columns từ outputColumns của step trước - OPTIMIZED
  useEffect(() => {
    console.log('AggregateConfig useEffect triggered - OPTIMIZED');
    console.log('templateData:', !!templateData);
    console.log('inputStepId received:', inputStepId);
    console.log('stepIndex:', stepIndex);
    console.log('normalizedSteps length:', normalizedSteps?.length);
    console.log('availableColumns:', availableColumns);
    
    const getInputColumns = async () => {
      // Nếu không có availableColumns, return empty
      if (!availableColumns || !availableColumns.length) {
        console.log('AggregateConfig - No availableColumns, using empty array');
        setInputColumns([]);
        return;
      }
   
      setLoading(true);
      try {
        let actualInputStepId = null;
        let sourceStep = null;
        
        // Xác định inputStepId thực tế và tìm step tương ứng
        if (stepIndex !== null && normalizedSteps) {
          const currentStep = normalizedSteps[stepIndex];
          console.log('AggregateConfig - currentStep:', !!currentStep);
          if (currentStep?.useCustomInput) {
            actualInputStepId = currentStep.inputStepId;
            sourceStep = normalizedSteps.find(step => step.id === actualInputStepId);
          } else {
            // Sử dụng step trước đó
            if (stepIndex === 0) {
              actualInputStepId = 0; // Sử dụng dữ liệu gốc
            } else {
              actualInputStepId = normalizedSteps[stepIndex - 1].id;
              sourceStep = normalizedSteps[stepIndex - 1];
            }
          }
        } else {
          // Trong modal - xử lý theo inputStepId được truyền vào
          if (inputStepId !== null && inputStepId !== undefined) {
            actualInputStepId = inputStepId;
            sourceStep = normalizedSteps?.find(step => step.id === inputStepId);
          } else {
            // Sử dụng step cuối cùng làm nguồn dữ liệu mặc định
            if (normalizedSteps && normalizedSteps.length > 0) {
              sourceStep = normalizedSteps[normalizedSteps.length - 1];
              actualInputStepId = sourceStep.id;
            } else {
              actualInputStepId = 0; // Sử dụng dữ liệu gốc
            }
          }
        }
        
        console.log('AggregateConfig - Final actualInputStepId:', actualInputStepId, 'sourceStep:', !!sourceStep);
        
        // OPTIMIZATION: Sử dụng outputColumns từ config của step trước thay vì gọi API
        if (sourceStep && sourceStep.config && sourceStep.config.outputColumns) {
          console.log('AggregateConfig - Using outputColumns from previous step config');
          const outputColumns = sourceStep.config.outputColumns;
          
          // Chuyển đổi outputColumns thành array string đơn giản
          let columns = [];
          if (Array.isArray(outputColumns)) {
            columns = outputColumns.map(col => {
              if (typeof col === 'string') {
                return col;
              } else if (col && col.name) {
                return col.name;
              } else if (col && col.title) {
                return col.title;
              } else {
                return String(col);
              }
            });
          }

          console.log('AggregateConfig - Result columns from outputColumns:', columns);
          setInputColumns(columns);
          return;
        }

        // Fallback: Nếu không có outputColumns hoặc là dữ liệu gốc, sử dụng availableColumns
        if (actualInputStepId === null || actualInputStepId === 0) {
          console.log('AggregateConfig - Using availableColumns for original data');
          setInputColumns(availableColumns);
          return;
        }

        // Fallback cuối cùng: Gọi API nhưng chỉ lấy 5 dòng đầu để tối ưu
        console.log('AggregateConfig - Fallback: fetching data from API (5 rows only)');
        const customStepDataResponse = await getTemplateRow(templateData.id, actualInputStepId, false, 1, 5); // Chỉ lấy 5 dòng
        const customStepData = customStepDataResponse.rows || [];
        
        if (customStepData.length > 0) {
          const inputData = customStepData.map(row => ({ ...row.data, rowId: row.id }));
          const columns = Object.keys(inputData[0]).filter(col => col !== 'rowId');
          console.log('AggregateConfig - Result columns from API fallback:', columns);
          setInputColumns(columns);
        } else {
          console.log('AggregateConfig - No data found, using availableColumns');
          setInputColumns(availableColumns);
        }

      } catch (error) {
        console.error('AggregateConfig - Lỗi khi lấy columns:', error);
        setInputColumns(availableColumns);
      } finally {
        setLoading(false);
      }
    };

    getInputColumns();
  }, [inputStepId, templateData, getTemplateRow, availableColumns, stepIndex, normalizedSteps]);

  useEffect(() => {
    onChange && onChange({ groupBy, aggregations });
    // eslint-disable-next-line
  }, [groupBy, aggregations]);

  const addAggregation = () => {
    setAggregations([...aggregations, { ...defaultAgg }]);
  };

  const removeAggregation = (idx) => {
    if (aggregations.length > 1) {
      setAggregations(aggregations.filter((_, i) => i !== idx));
    }
  };

  const updateAggregation = (idx, key, value) => {
    setAggregations(aggregations.map((agg, i) => i === idx ? { ...agg, [key]: value } : agg));
  };

  const getFunctionDescription = (functionType) => {
    const option = functionOptions.find(opt => opt.value === functionType);
    return option ? option.description : '';
  };

  const validateConfig = () => {
    if (!groupBy || (Array.isArray(groupBy) && groupBy.length === 0) || (typeof groupBy === 'string' && groupBy === '')) {
      return 'Vui lòng chọn ít nhất một cột nhóm';
    }
    if (!aggregations.some(agg => agg.column && agg.function)) {
      return 'Vui lòng cấu hình ít nhất một aggregation';
    }
    return null;
  };

  const error = validateConfig();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 400 }}>
      {error && (
        <Alert
          message="Cấu hình chưa hoàn chỉnh"
          description={error}
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
        />
      )}

      <Card size="small" title="Cấu hình nhóm dữ liệu" style={{ marginBottom: 8 }}>
        <Form.Item label="Nhóm theo cột" required>
          <Select
            virtual={false}
            mode="multiple"
            placeholder="Chọn cột để nhóm dữ liệu (có thể chọn nhiều cột)"
            value={groupBy}
            onChange={setGroupBy}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            loading={loading}
          >
            {inputColumns.filter(col => !aggregations.some(agg => agg.column === col)).map(col => (
              <Option key={col} value={col}>{col}</Option>
            ))}
          </Select>
          {groupBy && groupBy.length > 0 && (
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              Sẽ nhóm theo: <strong>{Array.isArray(groupBy) ? groupBy.join(' → ') : groupBy}</strong>
            </div>
          )}
        </Form.Item>
      </Card>

      <Card size="small" title="Cấu hình tính toán" extra={
        <Button 
          type="dashed" 
          icon={<PlusOutlined />} 
          onClick={addAggregation}
          size="small"
        >
          Thêm tính toán
        </Button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {aggregations.map((agg, idx) => (
            <Card 
              key={idx} 
              size="small" 
              style={{ border: '1px solid #d9d9d9' }}
              extra={
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => removeAggregation(idx)} 
                  disabled={aggregations.length === 1}
                  size="small"
                />
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                     <Select
                     placeholder="Chọn cột"
                     value={agg.column}
                     onChange={v => updateAggregation(idx, 'column', v)}
                     style={{ flex: 1 }}
                     showSearch
                     filterOption={(input, option) =>
                       option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                     }
                   >
                     {inputColumns.filter(col => !groupBy.includes(col)).map(col => (
                       <Option key={col} value={col}>{col}</Option>
                     ))}
                   </Select>
                  <Select
                    placeholder="Chọn hàm"
                    value={agg.function}
                    onChange={v => updateAggregation(idx, 'function', v)}
                    style={{ flex: 1 }}
                  >
                    {functionOptions.map(opt => (
                      <Option key={opt.value} value={opt.value}>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <span style={{ fontSize: '16px' }}>{opt.label} - </span>
                          <span style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>{opt.description}</span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </div>
                
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Input
                    placeholder="Tên cột kết quả (tùy chọn)"
                    value={agg.alias}
                    onChange={e => updateAggregation(idx, 'alias', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {agg.alias || `${agg.function}_${agg.column || 'column'}`}
                  </Text>
                </div>

                {agg.function && (
                  <div style={{ 
                    padding: 8, 
                    backgroundColor: '#f6ffed', 
                    borderRadius: 4,
                    fontSize: '12px',
                    color: '#52c41a'
                  }}>
                    <InfoCircleOutlined style={{ marginRight: 4 }} />
                    {getFunctionDescription(agg.function)}
                  </div>
                )}
              </Space>
            </Card>
          ))}
        </div>
      </Card>

      <Card size="small" title="Thông tin kết quả">
        <div style={{ fontSize: '12px', color: '#666' }}>
          <p>• Dữ liệu sẽ được nhóm theo: <strong>{groupBy && groupBy.length > 0 ? (Array.isArray(groupBy) ? groupBy.join(' → ') : groupBy) : 'N/A'}</strong></p>
          <p>• Sẽ tạo ra <strong>{aggregations.filter(agg => agg.column && agg.function).length}</strong> cột tính toán</p>
          <p>• Số cột có sẵn: <strong>{inputColumns.length}</strong></p>
        </div>
      </Card>
    </div>
  );
};

export default AggregateConfig; 
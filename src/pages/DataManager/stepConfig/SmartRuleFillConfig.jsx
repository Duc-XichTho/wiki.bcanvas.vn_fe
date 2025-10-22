import React, { useState, useEffect, useContext } from 'react';
import { Card, Form, Input, Button, Select, Space, Row, Col, Tag, message, Divider, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { MODEL_TEXT_AI_LIST } from '../../../CONST.js';
import { MyContext } from '../../../MyContext.jsx';


const { Option } = Select;
const { TextArea } = Input;

const SmartRuleFillConfig = ({
  initialConfig = {},
  onChange,
  availableColumns = [],
  templateData = null // Thêm prop để lấy dữ liệu mẫu
}) => {
  const { currentUser } = useContext(MyContext);
  const [config, setConfig] = useState({
    // Pattern configuration
    inputColumns: [], // Cột điều kiện
    outputColumn: '', // Cột cần điền

    // Example configuration
    exampleIdentifier: {
      column: '', // Cột để xác định example
      values: [] // Giá trị để xác định example
    },

    // Required configuration
    outputRequirements: '', // Yêu cầu cho output

    // Output configuration
    createNewColumn: false,
    newColumnName: '',

    // AI Rules configuration
    savedRules: [], // Quy tắc đã lưu từ AI
    hasGeneratedRules: false, // Đánh dấu đã tạo quy tắc chưa

    // AI Model configuration
    aiModel: MODEL_TEXT_AI_LIST[0].value, // Model AI mặc định

    ...initialConfig
  });

  // State cho modal thêm giá trị example
  const [isAddExampleModalVisible, setIsAddExampleModalVisible] = useState(false);
  const [newExampleValue, setNewExampleValue] = useState('');


  useEffect(() => {
    if (onChange) {
      onChange(config);
    }
  }, [config, onChange]);

  // Xử lý thay đổi config
  const handleConfigChange = (key, value) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [key]: value
      };

      // Nếu thay đổi cấu hình cơ bản hoặc model AI, xóa quy tắc đã lưu
      if (['inputColumns', 'outputColumn', 'exampleIdentifier', 'outputRequirements', 'aiModel'].includes(key)) {
        newConfig.savedRules = [];
        newConfig.hasGeneratedRules = false;
      }

      return newConfig;
    });
  };

  // Xử lý thay đổi example identifier
  const handleExampleIdentifierChange = (field, value) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        exampleIdentifier: {
          ...prev.exampleIdentifier,
          [field]: value
        }
      };

      // Nếu thay đổi example identifier, xóa quy tắc đã lưu
      newConfig.savedRules = [];
      newConfig.hasGeneratedRules = false;

      return newConfig;
    });
  };

  // Thêm giá trị example - sử dụng modal thay vì prompt
  const addExampleValue = () => {
    setIsAddExampleModalVisible(true);
  };

  // Xử lý khi submit giá trị example
  const handleAddExampleValue = () => {
    if (newExampleValue && newExampleValue.trim()) {
      setConfig(prev => {
        const newConfig = {
          ...prev,
          exampleIdentifier: {
            ...prev.exampleIdentifier,
            values: [...prev.exampleIdentifier.values, newExampleValue.trim()]
          }
        };

        // Xóa quy tắc đã lưu khi thêm example value
        newConfig.savedRules = [];
        newConfig.hasGeneratedRules = false;

        return newConfig;
      });
      
      // Reset form và đóng modal
      setNewExampleValue('');
      setIsAddExampleModalVisible(false);
      message.success('Đã thêm giá trị example thành công!');
    } else {
      message.error('Vui lòng nhập giá trị!');
    }
  };

  // Xử lý khi hủy modal
  const handleCancelAddExample = () => {
    setNewExampleValue('');
    setIsAddExampleModalVisible(false);
  };

  // Xóa giá trị example
  const removeExampleValue = (index) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        exampleIdentifier: {
          ...prev.exampleIdentifier,
          values: prev.exampleIdentifier.values.filter((_, i) => i !== index)
        }
      };

      // Xóa quy tắc đã lưu khi xóa example value
      newConfig.savedRules = [];
      newConfig.hasGeneratedRules = false;

      return newConfig;
    });
  };





  return (
    <div style={{ maxWidth: '100%', padding: '16px' }}>
      <Form layout="vertical">
        {/* Instructions */}
        <Card title={<><InfoCircleOutlined /> Hướng dẫn sử dụng</>} size="small" style={{ margin: '16px 0' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <p><strong>1. Pattern(Mẫu):</strong> Chọn các cột điều kiện (KHÔNG bao gồm cột kết quả) và cột cần điền thêm giá trị (KHÔNG bao gồm dữ liệu mẫu chuẩn)</p>
            <p><strong>2. Dữ liệu mẫu chuẩn:</strong> Chọn điều kiện lọc cho các dữ liệu mẫu chuẩn</p>
            <p><strong>3. Requirements(Yêu cầu):</strong> Mô tả yêu cầu cho cột cần điền (ví dụ: danh sách giá trị nằm trong danh sách dữ liệu mẫu)</p>
            <p><strong>4. Model AI:</strong> Chọn model AI để xử lý logic thông minh</p>
            <p><strong>5. Output(Đầu ra):</strong> Chọn tạo cột mới hoặc ghi đè cột hiện có</p>
          </div>
        </Card>

        {/* Pattern Configuration */}
        <Card title="1. Cấu hình Pattern" size="small" style={{ marginBottom: '16px' }}>
          <Form.Item label="Cột điều kiện" required>
            <Select
              mode="multiple"
              value={config.inputColumns}
              onChange={(value) => {
                // Giới hạn tối đa 3 cột được chọn
                if (value && value.length > 3) {
                  message.warning('Chỉ được chọn tối đa 3 cột điều kiện');
                  return;
                }
                handleConfigChange('inputColumns', value);
              }}
              placeholder="Chọn các cột làm điều kiện (tối đa 3 cột)"
              style={{ width: '100%' }}
              maxTagCount={3}
              maxTagTextLength={20}
            >
              {availableColumns.map(col => (
                <Option key={col} value={col}>{col}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Cột cần điền" required>
            <Select
              value={config.outputColumn}
              onChange={(value) => handleConfigChange('outputColumn', value)}
              placeholder="Chọn cột cần điền"
              style={{ width: '100%' }}
            >
              {availableColumns.map(col => (
                <Option key={col} value={col}>{col}</Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        {/* Example Configuration */}
        <Card title="2. Chọn điều kiện lọc cho các dữ liệu mẫu chuẩn" size="small" style={{ marginBottom: '16px' }}>
          <Form.Item label="Cột điều kiện" required>
            <Select
              value={config.exampleIdentifier.column}
              onChange={(value) => handleExampleIdentifierChange('column', value)}
              placeholder="Chọn cột để xác định dữ liệu example"
              style={{ width: '100%' }}
            >
              {availableColumns.map(col => (
                <Option key={col} value={col}>{col}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Điều kiện (Giá trị)">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                {config.exampleIdentifier.values.map((value, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => removeExampleValue(index)}
                    color="blue"
                  >
                    {value}
                  </Tag>
                ))}
              </Space>
              <Button
                type="dashed"
                onClick={addExampleValue}
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                Thêm giá trị example
              </Button>
            </Space>
          </Form.Item>
        </Card>

        {/* Requirements Configuration */}
        <Card title="3. Cấu hình Requirements" size="small" style={{ marginBottom: '16px' }}>
          <Form.Item label="Yêu cầu cho Output" required>
            <TextArea
              value={config.outputRequirements}
              onChange={(e) => handleConfigChange('outputRequirements', e.target.value)}
              placeholder="Ví dụ: Khoản mục nằm trong danh sách: 'Doanh thu', 'Chi phí', 'Chi phí khác'"
              rows={3}
            />
          </Form.Item>
        </Card>

        {/* AI Model Configuration */}
        {currentUser.isSuperAdmin &&
            <Card title="4. Chọn Model AI" size="small" style={{ marginBottom: '16px' }}>
              <Form.Item label="Model AI" required>
                <Select
                    value={config.aiModel}
                    onChange={(value) => handleConfigChange('aiModel', value)}
                    placeholder="Chọn model AI để xử lý"
                    style={{ width: '100%' }}
                >
                  {MODEL_TEXT_AI_LIST.map(model => (
                      <Option key={model.value} value={model.value}>{model.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>}

        {/* Output Configuration */}
        <Card title="5. Cấu hình Output" size="small" style={{ marginBottom: '16px' }}>
          <Form.Item>
            <Space>
              <input
                type="checkbox"
                checked={config.createNewColumn}
                onChange={(e) => handleConfigChange('createNewColumn', e.target.checked)}
              />
              <span>Tạo cột mới</span>
            </Space>
          </Form.Item>

          {config.createNewColumn && (
            <Form.Item label="Tên cột mới" required>
              <Input
                value={config.newColumnName}
                onChange={(e) => handleConfigChange('newColumnName', e.target.value)}
                placeholder="Nhập tên cột mới"
              />
            </Form.Item>
          )}
        </Card>
      </Form>

      {/* Modal thêm giá trị example */}
      <Modal
        title="Thêm giá trị Example"
        open={isAddExampleModalVisible}
        onOk={handleAddExampleValue}
        onCancel={handleCancelAddExample}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item 
            label="Giá trị Example" 
            required
            help="Nhập giá trị để xác định dữ liệu nào là example"
          >
            <Input
              value={newExampleValue}
              onChange={(e) => setNewExampleValue(e.target.value)}
              placeholder="Ví dụ: 'Example', 'Mẫu', 'Sample'"
              onPressEnter={handleAddExampleValue}
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SmartRuleFillConfig;

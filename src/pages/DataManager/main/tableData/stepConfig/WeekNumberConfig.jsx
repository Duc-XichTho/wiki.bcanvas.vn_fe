import React, { useState, useEffect } from 'react';
import { Form, Select, Input, message } from 'antd';

const { Option } = Select;

const WeekNumberConfig = ({ 
    initialConfig = {}, 
    onChange, 
    availableColumns = [],
    templateData = null,
    getTemplateRow = null 
}) => {
    const [form] = Form.useForm();
    const [config, setConfig] = useState({
        sourceColumn: '',
        newColumnName: 'week_number',
        ...initialConfig
    });

    useEffect(() => {
        form.setFieldsValue(config);
    }, [config, form]);

    const handleConfigChange = (changedValues, allValues) => {
        const newConfig = { ...config, ...allValues };
        setConfig(newConfig);
        if (onChange) {
            onChange(newConfig);
        }
    };

    const validateConfig = () => {
        if (!config.sourceColumn) {
            message.error('Vui lòng chọn cột nguồn chứa ngày');
            return false;
        }
        if (!config.newColumnName || config.newColumnName.trim() === '') {
            message.error('Vui lòng nhập tên cột mới');
            return false;
        }
        return true;
    };

    // Remove automatic onChange side-effect to avoid parent-child update loops

    return (
        <div style={{ padding: '16px' }}>
            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleConfigChange}
                initialValues={config}
            >
                <Form.Item
                    label="Cột nguồn chứa ngày (định dạng YYYY-MM-DD)"
                    name="sourceColumn"
                    rules={[{ required: true, message: 'Vui lòng chọn cột nguồn' }]}
                >
                    <Select
                        placeholder="Chọn cột chứa ngày"
                        showSearch
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {availableColumns.map((column, index) => (
                            <Option key={index} value={column}>
                                {column}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Tên cột mới chứa tuần số"
                    name="newColumnName"
                    rules={[{ required: true, message: 'Vui lòng nhập tên cột mới' }]}
                >
                    <Input
                        placeholder="Nhập tên cột mới"
                        value={config.newColumnName}
                        onChange={(e) => setConfig({ ...config, newColumnName: e.target.value })}
                    />
                </Form.Item>

                <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f6f8fa', 
                    borderRadius: '6px',
                    marginTop: '16px',
                    fontSize: '14px',
                    color: '#586069'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Thông tin:</div>
                    <div>• Cột nguồn phải chứa ngày theo định dạng YYYY-MM-DD</div>
                    <div>• Kết quả sẽ là số tuần trong năm (1-53)</div>
                    <div>• Nếu không thể tính được, kết quả sẽ là '#ERROR'</div>
                    <div>• Tuần được tính theo chuẩn ISO 8601 (thứ 2 là đầu tuần)</div>
                </div>
            </Form>
        </div>
    );
};

export default WeekNumberConfig;

import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Space, Typography, Button, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const ValueToTimeConfig = ({ initialConfig = {}, onChange, availableColumns = [] }) => {
    const initialMappings = Array.isArray(initialConfig.mappings) && initialConfig.mappings.length > 0
        ? initialConfig.mappings
        : ((initialConfig.column || initialConfig.outputColumn)
            ? [{ column: initialConfig.column || '', outputColumn: initialConfig.outputColumn || '' }]
            : [{ column: '', outputColumn: '' }]);

    const [mappings, setMappings] = useState(
        initialMappings.map(m => ({
            column: m.column || '',
            outputColumn: m.outputColumn || '',
            timeFormat: m.timeFormat || initialConfig.timeFormat || 'YYYY-MM-DD HH:mm:ss'
        }))
    );

    useEffect(() => {
        const payload = { mappings };
        // Backward compatibility when only one mapping is configured
        if (mappings.length === 1) {
            payload.column = mappings[0]?.column || '';
            payload.outputColumn = mappings[0]?.outputColumn || '';
            payload.timeFormat = mappings[0]?.timeFormat || 'YYYY-MM-DD HH:mm:ss';
        }
        onChange && onChange(payload);
        // eslint-disable-next-line
    }, [mappings]);

    const updateMapping = (index, field, value) => {
        setMappings(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    };

    const addMapping = () => {
        setMappings(prev => [...prev, { column: '', outputColumn: '', timeFormat: 'YYYY-MM-DD HH:mm:ss' }]);
    };

    const removeMapping = (index) => {
        setMappings(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Form layout="vertical">
            <Form.Item label={`Cấu hình nhiều cột`}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    {mappings.map((m, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                            <Select
                                virtual={false}
                                value={m.column}
                                onChange={(val) => updateMapping(idx, 'column', val)}
                                placeholder="Chọn cột nguồn"
                                showSearch
                                filterOption={(input, option) => option?.children?.toLowerCase?.().indexOf(input.toLowerCase()) >= 0}
                            >
                                {availableColumns.map((col) => (
                                    <Option key={col} value={col}>{col}</Option>
                                ))}
                            </Select>
                            <Input
                                value={m.outputColumn}
                                onChange={(e) => updateMapping(idx, 'outputColumn', e.target.value)}
                                placeholder="Tên cột đích"
                            />
                            <Select
                                value={m.timeFormat}
                                onChange={(val) => updateMapping(idx, 'timeFormat', val)}
                                placeholder="Định dạng thời gian"
                            >
                                <Option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</Option>
                                <Option value="YYYY-MM-DD">YYYY-MM-DD (chỉ ngày)</Option>
                                {/* <Option value="ISO">ISO String</Option>
                                <Option value="Unix">Unix Timestamp</Option>
                                <Option value="HH:mm:ss">HH:mm:ss (chỉ thời gian)</Option> */}
                            </Select>
                            <Button
                                type="text"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => removeMapping(idx)}
                                disabled={mappings.length === 1}
                            />
                        </div>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={addMapping}>
                        Thêm cột
                    </Button>
                </Space>
            </Form.Item>

            <Form.Item>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>Hướng dẫn:</Text>
                    <Text type="secondary">• 1000-1000000: Excel date serial number</Text>
                    <Text type="secondary">• &lt; 1: Phần thập phân của ngày (giờ/phút/giây)</Text>
                    <Text type="secondary">• &gt; 1000000: Unix timestamp (milliseconds)</Text>
                    <Text type="secondary">• Khác: Unix timestamp (giây)</Text>
                    <Text type="secondary">• Các ô không thể chuyển đổi sẽ hiển thị "ERROR"</Text>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default ValueToTimeConfig; 
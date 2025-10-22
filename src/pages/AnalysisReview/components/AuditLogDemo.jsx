import React, { useState } from 'react';
import { Card, Select, Space, Typography, Divider } from 'antd';
import AuditLogViewer from './AuditLogViewer';

const { Title, Text } = Typography;
const { Option } = Select;

const AuditLogDemo = () => {
    const [selectedTable, setSelectedTable] = useState('Setting');

    // Danh sách các bảng có thể xem audit log
    const availableTables = [
        { value: 'Setting', label: 'Setting' },
        { value: 'AiChatHistory', label: 'AiChatHistory' },
        { value: 'DashboardItem', label: 'DashboardItem' },
        { value: 'KPICalculator', label: 'KPICalculator' },
        { value: 'KPI2Calculator', label: 'KPI2Calculator' },
        { value: 'TemplateTable', label: 'TemplateTable' },
        { value: 'FileNotePad', label: 'FileNotePad' }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        <Title level={3}>Audit Log Viewer</Title>
                        <Text type="secondary">
                            Xem lịch sử thay đổi của các bảng trong hệ thống
                        </Text>
                    </div>

                    <Divider />

                    <div>
                        <Space align="center">
                            <Text strong>Chọn bảng:</Text>
                            <Select
                                value={selectedTable}
                                onChange={setSelectedTable}
                                style={{ width: 200 }}
                                placeholder="Chọn bảng để xem audit log"
                            >
                                {availableTables.map(table => (
                                    <Option key={table.value} value={table.value}>
                                        {table.label}
                                    </Option>
                                ))}
                            </Select>
                        </Space>
                    </div>

                    <AuditLogViewer tableName={selectedTable} />
                </Space>
            </Card>
        </div>
    );
};

export default AuditLogDemo; 
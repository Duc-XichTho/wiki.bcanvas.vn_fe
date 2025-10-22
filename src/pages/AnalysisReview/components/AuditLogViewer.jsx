import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Modal, Descriptions, Space, Typography, Select, DatePicker, Tabs } from 'antd';
import { EyeOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import { getAuditLogByTableName } from '../../../apis/auditLogService.jsx';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const AuditLogViewer = ({ tableName, tableNames }) => {
    // Hỗ trợ cả tableName (string) và tableNames (array)
    const tables = tableNames || (tableName ? [tableName] : []);
    console.log('🎯 AuditLogViewer rendered with tables:', tables);
    
    const [auditLogs, setAuditLogs] = useState({});
    const [loading, setLoading] = useState({});
    const [selectedLog, setSelectedLog] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [filters, setFilters] = useState({
        operation: 'all',
        dateRange: null
    });

    // Fetch audit logs for all tables
    const fetchAuditLogs = async (tableName) => {
        if (!tableName) return;
        
        console.log('🔍 Fetching audit logs for table:', tableName);
        setLoading(prev => ({ ...prev, [tableName]: true }));
        try {
            const response = await getAuditLogByTableName(tableName);
            console.log('📊 Raw API response for table', tableName, ':', response);
            
            // Đảm bảo dữ liệu là array
            let data = [];
            if (Array.isArray(response)) {
                data = response;
                console.log('✅ Response is already an array, length:', data.length);
            } else if (response && Array.isArray(response.data)) {
                data = response.data;
                console.log('✅ Response.data is array, length:', data.length);
            } else if (response && typeof response === 'object') {
                // Nếu response là object, thử lấy data từ các key có thể
                data = response.data || response.auditLogs || response.logs || [];
                console.log('✅ Extracted data from object, length:', data.length);
            }
            
            // Nếu không có dữ liệu, hiển thị thông báo
            if (!data || data.length === 0) {
                console.log(`❌ No audit logs found for table: ${tableName}`);
                setAuditLogs(prev => ({ ...prev, [tableName]: [] }));
                return;
            }
            
            // Thêm tableName vào mỗi record
            const dataWithTableName = data.map(item => ({
                ...item,
                tableName: tableName
            }));
            
            console.log('✅ Setting audit logs with data:', dataWithTableName);
            setAuditLogs(prev => ({ ...prev, [tableName]: dataWithTableName }));
        } catch (error) {
            console.error('❌ Error fetching audit logs for table', tableName, ':', error);
            setAuditLogs(prev => ({ ...prev, [tableName]: [] }));
        } finally {
            setLoading(prev => ({ ...prev, [tableName]: false }));
        }
    };

    // Fetch all tables
    const fetchAllAuditLogs = async () => {
        for (const tableName of tables) {
            await fetchAuditLogs(tableName);
        }
    };

    useEffect(() => {
        fetchAllAuditLogs();
    }, [tableNames, tableName]);

    // Filter logs based on current filters
    const getFilteredLogs = (logs) => {
        return (logs || []).filter(log => {
            // Filter by operation
            if (filters.operation !== 'all' && log.operation !== filters.operation) {
                return false;
            }
            
            // Filter by date range
            if (filters.dateRange && filters.dateRange.length === 2) {
                const logDate = dayjs(log.changed_at);
                const startDate = filters.dateRange[0];
                const endDate = filters.dateRange[1];
                
                if (!logDate.isBetween(startDate, endDate, 'day', '[]')) {
                    return false;
                }
            }
            
            return true;
        });
    };

    // Get operation color
    const getOperationColor = (operation) => {
        switch (operation) {
            case 'INSERT':
                return 'green';
            case 'UPDATE':
                return 'blue';
            case 'DELETE':
                return 'red';
            default:
                return 'default';
        }
    };

    // Get operation text in Vietnamese
    const getOperationText = (operation) => {
        switch (operation) {
            case 'INSERT':
                return 'Thêm mới';
            case 'UPDATE':
                return 'Cập nhật';
            case 'DELETE':
                return 'Xóa';
            default:
                return operation;
        }
    };

    // Format changes for display
    const formatChanges = (oldValues, newValues) => {
        const changes = [];
        const allKeys = [...new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})])];
        
        allKeys.forEach(key => {
            const oldValue = oldValues?.[key];
            const newValue = newValues?.[key];
            
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes.push({
                    field: key,
                    oldValue: oldValue,
                    newValue: newValue
                });
            }
        });
        
        return changes;
    };

    // Table columns
    const getColumns = () => [
        {
            title: 'Thời gian',
            dataIndex: 'changed_at',
            key: 'changed_at',
            width: 180,
            render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm:ss'),
            sorter: (a, b) => dayjs(a.changed_at).unix() - dayjs(b.changed_at).unix(),
            defaultSortOrder: 'descend'
        },
        {
            title: 'Bảng',
            dataIndex: 'tableName',
            key: 'tableName',
            width: 150,
            render: (text) => <Tag color="blue">{text}</Tag>,
            filters: tables.map(tableName => ({ text: tableName, value: tableName })),
            onFilter: (value, record) => record.tableName === value
        },
        {
            title: 'Hành động',
            dataIndex: 'operation',
            key: 'operation',
            width: 120,
            render: (operation) => (
                <Tag color={getOperationColor(operation)}>
                    {getOperationText(operation)}
                </Tag>
            ),
            filters: [
                { text: 'Thêm mới', value: 'INSERT' },
                { text: 'Cập nhật', value: 'UPDATE' },
                { text: 'Xóa', value: 'DELETE' }
            ],
            onFilter: (value, record) => record.operation === value
        },
        {
            title: 'ID dòng',
            dataIndex: 'recordId',
            key: 'recordId',
            width: 100,
            render: (text) => <Text code>{text}</Text>
        },
        {
            title: 'Người thực hiện',
            dataIndex: 'email',
            key: 'email',
            width: 200,
            render: (text) => text || <Text type="secondary">Hệ thống</Text>
        },
        {
            title: 'Thay đổi',
            key: 'changes',
            width: 120,
            render: (_, record) => {
                const changes = formatChanges(record.oldValues, record.newValues);
                return (
                    <Space direction="vertical" size="small">
                        <Text strong>{changes.length} trường</Text>
                        <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setSelectedLog(record);
                                setDetailModalVisible(true);
                            }}
                        >
                            Xem chi tiết
                        </Button>
                    </Space>
                );
            }
        }
    ];

    // Detail modal content
    const DetailModal = () => {
        if (!selectedLog) return null;
        
        const changes = formatChanges(selectedLog.oldValues, selectedLog.newValues);
        
        return (
            <Modal
                title={
                    <Space>
                        <Text strong>Chi tiết thay đổi</Text>
                        <Tag color={getOperationColor(selectedLog.operation)}>
                            {getOperationText(selectedLog.operation)}
                        </Tag>
                    </Space>
                }
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={'85vw'}
            >
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Thời gian">
                        {dayjs(selectedLog.changed_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bảng">
                        {selectedLog.tableName}
                    </Descriptions.Item>
                    <Descriptions.Item label="ID dòng">
                        <Text code>{selectedLog.recordId}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Người thực hiện">
                        {selectedLog.email || 'Hệ thống'}
                    </Descriptions.Item>
                </Descriptions>
                
                <div style={{ marginTop: 16, width: '100%', overflowY: 'auto' }}>
                    <Title level={5}>Chi tiết thay đổi:</Title>
                    <Table
                        dataSource={changes}
                        columns={[
                            {
                                title: 'Trường',
                                dataIndex: 'field',
                                key: 'field',
                                width: 150,
                                render: (text) => <Text strong>{text}</Text>
                            },
                            {
                                title: 'Giá trị cũ',
                                dataIndex: 'oldValue',
                                key: 'oldValue',
                                render: (value) => {
                                    if (value === null || value === undefined) {
                                        return <Text type="secondary">(trống)</Text>;
                                    }
                                    if (typeof value === 'object') {
                                        return <pre style={{ fontSize: '12px' }}>{JSON.stringify(value, null, 2)}</pre>;
                                    }
                                    return <Text delete>{String(value)}</Text>;
                                }
                            },
                            {
                                title: 'Giá trị mới',
                                dataIndex: 'newValue',
                                key: 'newValue',
                                render: (value) => {
                                    if (value === null || value === undefined) {
                                        return <Text type="secondary">(trống)</Text>;
                                    }
                                    if (typeof value === 'object') {
                                        return <pre style={{ fontSize: '12px' }}>{JSON.stringify(value, null, 2)}</pre>;
                                    }
                                    return <Text type="success">{String(value)}</Text>;
                                }
                            }
                        ]}
                        pagination={false}
                        size="small"
                    />
                </div>
            </Modal>
        );
    };





    // Multiple tables - render with single table
    const allLogs = tables.reduce((acc, tableName) => {
        const logs = auditLogs[tableName] || [];
        return [...acc, ...logs];
    }, []);
    
    const filteredAllLogs = getFilteredLogs(allLogs);
    const isLoading = Object.values(loading).some(Boolean);

    return (
        <Card
            title={
                <Space>
                    <Text strong>Lịch sử thay đổi - Tất cả các loại</Text>
                    <Tag color="blue">{filteredAllLogs.length} bản ghi</Tag>
                </Space>
            }
            extra={
                <Space>
                    <Select
                        value={filters.operation}
                        onChange={(value) => setFilters(prev => ({ ...prev, operation: value }))}
                        style={{ width: 120 }}
                    >
                        <Option value="all">Tất cả</Option>
                        <Option value="INSERT">Thêm mới</Option>
                        <Option value="UPDATE">Cập nhật</Option>
                        <Option value="DELETE">Xóa</Option>
                    </Select>
                    
                    <DatePicker.RangePicker
                        value={filters.dateRange}
                        onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
                        placeholder={['Từ ngày', 'Đến ngày']}
                        format="DD/MM/YYYY"
                    />
                    
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchAllAuditLogs}
                        loading={isLoading}
                    >
                        Làm mới tất cả
                    </Button>
                </Space>
            }
        >
            {filteredAllLogs.length > 0 ? (
                <Table
                    columns={getColumns()}
                    dataSource={filteredAllLogs}
                    rowKey={(record, index) => `${record.tableName}-${record.id}-${index}`}
                    loading={isLoading}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`
                    }}
                    scroll={{ x: 1000 }}
                    size="small"
                />
            ) : (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    color: '#666'
                }}>
                    {isLoading ? (
                        <div>Đang tải dữ liệu...</div>
                    ) : (
                        <div>
                            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                                Không có audit log nào
                            </div>
                            <div style={{ fontSize: '14px' }}>
                                Chưa có thay đổi nào được ghi lại
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <DetailModal />
        </Card>
    );
};

export default AuditLogViewer; 
import React, { useState, useEffect } from 'react';
import { Modal, Button, Select, Input, Form, Space, Card, Divider, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

export default function  ManualConfigModal  ({
    isOpen, 
    onClose, 
    ai2Result, 
    fileNotes, 
    onContinue 
})  {
    const [form] = Form.useForm();
    const [configs, setConfigs] = useState([]);
    const [selectedDatasets, setSelectedDatasets] = useState([]);

    useEffect(() => {
        if (isOpen && ai2Result) {
            // Initialize with AI2 result data
            const initialConfigs = [];
            if (ai2Result.matched_ids && ai2Result.matched_ids.length > 0) {
                ai2Result.matched_ids.forEach((datasetId, index) => {
                    const fileNote = fileNotes.find(note => note.id === datasetId);
                    if (fileNote) {
                        initialConfigs.push({
                            id: index,
                            dataset: datasetId,
                            datasetName: fileNote.name,
                            type: 'aggregation',
                            operation: 'sum',
                            target_column: '',
                            group_by: [],
                            filters: {},
                            limit: null
                        });
                    }
                });
            }
            setConfigs(initialConfigs);
            setSelectedDatasets(ai2Result.matched_ids || []);
        }
    }, [isOpen, ai2Result, fileNotes]);

    const getAvailableColumns = (datasetId) => {
        const fileNote = fileNotes.find(note => note.id === datasetId);
        if (!fileNote || !fileNote.rows || fileNote.rows.length === 0) return [];
        
        return Object.keys(fileNote.rows[0] || {});
    };

    const getColumnType = (datasetId, columnName) => {
        const fileNote = fileNotes.find(note => note.id === datasetId);
        if (!fileNote || !fileNote.rows || fileNote.rows.length === 0) return 'string';
        
        const sampleValue = fileNote.rows[0][columnName];
        if (typeof sampleValue === 'number') return 'number';
        if (typeof sampleValue === 'boolean') return 'boolean';
        return 'string';
    };

    const addConfig = () => {
        const newConfig = {
            id: Date.now(),
            dataset: selectedDatasets[0] || null,
            datasetName: '',
            type: 'aggregation',
            operation: 'sum',
            target_column: '',
            group_by: [],
            filters: {},
            limit: null
        };
        setConfigs([...configs, newConfig]);
    };

    const removeConfig = (configId) => {
        setConfigs(configs.filter(config => config.id !== configId));
    };

    const updateConfig = (configId, field, value) => {
        setConfigs(configs.map(config => 
            config.id === configId 
                ? { ...config, [field]: value }
                : config
        ));
    };

    const updateDatasetName = (configId, datasetId) => {
        const fileNote = fileNotes.find(note => note.id === datasetId);
        updateConfig(configId, 'dataset', datasetId);
        updateConfig(configId, 'datasetName', fileNote ? fileNote.name : '');
    };

    const handleTypeChange = (configId, newType) => {
        setConfigs(configs.map(config => 
            config.id === configId 
                ? { 
                    ...config, 
                    type: newType,
                    operation: '', // Reset operation
                    target_column: '', // Reset target column
                    limit: newType === 'ranking' ? null : config.limit // Reset limit for ranking
                }
                : config
        ));
    };

    const addFilter = (configId, field, value) => {
        const config = configs.find(c => c.id === configId);
        if (config) {
            const newFilters = { ...config.filters, [field]: value };
            updateConfig(configId, 'filters', newFilters);
        }
    };

    const removeFilter = (configId, field) => {
        const config = configs.find(c => c.id === configId);
        if (config) {
            const newFilters = { ...config.filters };
            delete newFilters[field];
            updateConfig(configId, 'filters', newFilters);
        }
    };

    const handleContinue = () => {
        // Validate configurations
        const validConfigs = configs.filter(config => 
            config.dataset && config.target_column
        );

        if (validConfigs.length === 0) {
            message.error('Vui lòng cấu hình ít nhất một phân tích hợp lệ');
            return;
        }

        // Build the result object similar to AI2 output
        const result = {
            matched_ids: selectedDatasets,
            useful_columns: ai2Result?.useful_columns || [],
            non_useful_columns: ai2Result?.non_useful_columns || [],
            filters: ai2Result?.filters || {},
            analysis_configs: validConfigs.map(config => ({
                dataset: config.dataset,
                type: config.type,
                operation: config.operation,
                ranking_type: config.ranking_type,
                target_column: config.target_column,
                group_by: config.group_by,
                filters: config.filters,
                limit: config.limit
            })),
            ai_instructions: ai2Result?.ai_instructions || {
                question: '',
                task: '',
                method: '',
                output: ''
            }
        };

        onContinue(result);
        onClose();
    };

    const operationOptions = [
        { value: 'sum', label: 'Tổng (Sum)' },
        { value: 'count', label: 'Đếm (Count)' },
        { value: 'average', label: 'Trung bình (Average)' },
        { value: 'max', label: 'Giá trị lớn nhất (Max)' },
        { value: 'min', label: 'Giá trị nhỏ nhất (Min)' }
    ];

    const getOperationOptions = (type) => {
        switch (type) {
            case 'aggregation':
                return [
                    { value: 'sum', label: 'Tổng (Sum)' },
                    { value: 'count', label: 'Đếm (Count)' },
                    { value: 'average', label: 'Trung bình (Average)' },
                    { value: 'max', label: 'Giá trị lớn nhất (Max)' },
                    { value: 'min', label: 'Giá trị nhỏ nhất (Min)' }
                ];
            case 'ranking':
                return [
                    { value: 'sum', label: 'Tổng (Sum)' },
                    { value: 'count', label: 'Đếm (Count)' },
                    { value: 'average', label: 'Trung bình (Average)' }
                ];
            case 'filter':
                return [
                    { value: 'distinct', label: 'Duy nhất (Distinct)' },
                    { value: 'limit', label: 'Giới hạn (Limit)' }
                ];
            default:
                return [];
        }
    };

    const typeOptions = [
        { value: 'aggregation', label: 'Tổng hợp (Aggregation)' },
        { value: 'ranking', label: 'Xếp hạng (Ranking)' },
        { value: 'filter', label: 'Lọc (Filter)' }
    ];

    return (
        <Modal
            title="Cấu hình phân tích thủ công"
            open={isOpen}
            onCancel={onClose}
            width={1200}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Hủy
                </Button>,
                <Button key="add" icon={<PlusOutlined />} onClick={addConfig}>
                    Thêm cấu hình
                </Button>,
                <Button key="continue" type="primary" onClick={handleContinue}>
                    Tiếp tục
                </Button>
            ]}
        >
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Card size="small" style={{ marginBottom: 16 }}>
                    <h4>Dữ liệu đã được phân loại:</h4>
                    <p>AI2 đã phân loại {selectedDatasets.length} bảng dữ liệu. Bạn có thể cấu hình cách phân tích từng bảng.</p>
                </Card>

                {configs.map((config, index) => (
                    <Card 
                        key={config.id} 
                        size="small" 
                        style={{ marginBottom: 16 }}
                        title={`Cấu hình ${index + 1}`}
                        extra={
                            <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />}
                                onClick={() => removeConfig(config.id)}
                            />
                        }
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {/* Dataset Selection */}
                            <div>
                                <label>Bảng dữ liệu:</label>
                                <Select
                                    style={{ width: '100%', marginTop: 4 }}
                                    value={config.dataset}
                                    onChange={(value) => updateDatasetName(config.id, value)}
                                    placeholder="Chọn bảng dữ liệu"
                                >
                                    {selectedDatasets.map(datasetId => {
                                        const fileNote = fileNotes.find(note => note.id === datasetId);
                                        return (
                                            <Option key={datasetId} value={datasetId}>
                                                {fileNote ? fileNote.name : `Dataset ${datasetId}`}
                                            </Option>
                                        );
                                    })}
                                </Select>
                            </div>

                            {/* Analysis Type */}
                            <div>
                                <label>Loại phân tích:</label>
                                <Select
                                    style={{ width: '100%', marginTop: 4 }}
                                    value={config.type}
                                    onChange={(value) => handleTypeChange(config.id, value)}
                                >
                                    {typeOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            {/* Operation */}
                            

                            {/* Ranking Options - only show for ranking type */}
                            {config.type === 'ranking' && (
                                <div>
                                    <label>Loại xếp hạng:</label>
                                    <div style={{ marginTop: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name={`ranking-${config.id}`}
                                                    value="top_n"
                                                    checked={config.ranking_type === 'top_n'}
                                                    onChange={(e) => updateConfig(config.id, 'ranking_type', e.target.value)}
                                                />
                                                Top
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name={`ranking-${config.id}`}
                                                    value="bottom_n"
                                                    checked={config.ranking_type === 'bottom_n'}
                                                    onChange={(e) => updateConfig(config.id, 'ranking_type', e.target.value)}
                                                />
                                                Bottom
                                            </label>
                                            <Input
                                                type="number"
                                                style={{ width: 100 }}
                                                value={config.limit || ''}
                                                onChange={(e) => updateConfig(config.id, 'limit', e.target.value ? parseInt(e.target.value) : null)}
                                                placeholder="Số"
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Target Column */}
                            <div>
                                <label>Cột mục tiêu:</label>
                                <Select
                                    style={{ width: '100%', marginTop: 4 }}
                                    value={config.target_column}
                                    onChange={(value) => updateConfig(config.id, 'target_column', value)}
                                    placeholder="Chọn cột để phân tích"
                                >
                                    {config.dataset && getAvailableColumns(config.dataset).map(column => (
                                        <Option key={column} value={column}>
                                            {column} ({getColumnType(config.dataset, column)})
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            {/* Group By */}
                            <div>
                                <label>Nhóm theo:</label>
                                <Select
                                    mode="multiple"
                                    style={{ width: '100%', marginTop: 4 }}
                                    value={config.group_by}
                                    onChange={(value) => updateConfig(config.id, 'group_by', value)}
                                    placeholder="Chọn cột để nhóm (tùy chọn)"
                                >
                                    {config.dataset && getAvailableColumns(config.dataset).map(column => (
                                        <Option key={column} value={column}>
                                            {column}
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <label>Phép toán:</label>
                                <Select
                                    style={{ width: '100%', marginTop: 4 }}
                                    value={config.operation || undefined}
                                    onChange={(value) => updateConfig(config.id, 'operation', value)}
                                    placeholder="Chọn phép toán"
                                    allowClear
                                >
                                    {getOperationOptions(config.type).map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            {/* Filters */}
                            <div>
                                <label>Bộ lọc:</label>
                                <div style={{ marginTop: 4 }}>
                                    {Object.entries(config.filters).map(([field, filterConfig]) => (
                                        <div key={field} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                                            <Select
                                                style={{ width: 150 }}
                                                value={field}
                                                onChange={(newField) => {
                                                    // Remove old field and add new field
                                                    const newFilters = { ...config.filters };
                                                    delete newFilters[field];
                                                    newFilters[newField] = filterConfig;
                                                    updateConfig(config.id, 'filters', newFilters);
                                                }}
                                                placeholder="Chọn cột"
                                            >
                                                {config.dataset && getAvailableColumns(config.dataset).map(column => (
                                                    <Option key={column} value={column}>
                                                        {column}
                                                    </Option>
                                                ))}
                                            </Select>
                                            <Select
                                                style={{ width: 120 }}
                                                value={filterConfig.operator || 'equals'}
                                                onChange={(operator) => {
                                                    const newFilters = { ...config.filters };
                                                    newFilters[field] = { ...filterConfig, operator };
                                                    updateConfig(config.id, 'filters', newFilters);
                                                }}
                                            >
                                                <Option value="equals">=</Option>
                                                <Option value="not_equals">≠</Option>
                                                <Option value="greater_than">&gt;</Option>
                                                <Option value="less_than">&lt;</Option>
                                                <Option value="greater_equal">≥</Option>
                                                <Option value="less_equal">≤</Option>
                                                <Option value="contains">Chứa</Option>
                                                <Option value="not_contains">Không chứa</Option>
                                                <Option value="starts_with">Bắt đầu với</Option>
                                                <Option value="ends_with">Kết thúc với</Option>
                                                <Option value="in">Trong danh sách</Option>
                                                <Option value="not_in">Không trong danh sách</Option>
                                                <Option value="is_null">Null</Option>
                                                <Option value="is_not_null">Không null</Option>
                                            </Select>
                                            {filterConfig.operator && 
                                             filterConfig.operator !== 'is_null' && 
                                             filterConfig.operator !== 'is_not_null' && (
                                                <Input
                                                    style={{ flex: 1 }}
                                                    value={filterConfig.value || ''}
                                                    onChange={(e) => {
                                                        const newFilters = { ...config.filters };
                                                        newFilters[field] = { ...filterConfig, value: e.target.value };
                                                        updateConfig(config.id, 'filters', newFilters);
                                                    }}
                                                    placeholder={
                                                        filterConfig.operator === 'in' || filterConfig.operator === 'not_in' 
                                                            ? "Giá trị1,giá trị2,giá trị3..." 
                                                            : "Giá trị"
                                                    }
                                                />
                                            )}
                                            <Button 
                                                type="text" 
                                                danger 
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeFilter(config.id, field)}
                                            />
                                        </div>
                                    ))}
                                    <Button 
                                        type="dashed" 
                                        size="small"
                                        onClick={() => {
                                            const availableColumns = getAvailableColumns(config.dataset);
                                            const unusedColumns = availableColumns.filter(col => 
                                                !Object.keys(config.filters).includes(col)
                                            );
                                            if (unusedColumns.length > 0) {
                                                addFilter(config.id, unusedColumns[0], { operator: 'equals', value: '' });
                                            }
                                        }}
                                    >
                                        Thêm bộ lọc
                                    </Button>
                                </div>
                            </div>

                            {/* Limit */}
                            {config.type !== 'ranking' && (
                                <div>
                                    <label>Giới hạn kết quả:</label>
                                    <Input
                                        type="number"
                                        style={{ marginTop: 4 }}
                                        value={config.limit || ''}
                                        onChange={(e) => updateConfig(config.id, 'limit', e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="Số lượng kết quả tối đa (tùy chọn)"
                                    />
                                </div>
                            )}
                        </Space>
                    </Card>
                ))}

                {configs.length === 0 && (
                    <Card size="small">
                        <p style={{ textAlign: 'center', color: '#666' }}>
                            Chưa có cấu hình nào. Hãy thêm cấu hình để bắt đầu.
                        </p>
                    </Card>
                )}
            </div>
        </Modal>
    );
};


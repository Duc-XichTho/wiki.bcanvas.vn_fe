import React, { useMemo } from 'react';
import { Select } from 'antd';

const { Option } = Select;

export default function PercentileGroupFilterConfig({ availableColumns = [], dataPreview = [], initialConfig = {}, onChange }) {
    const config = initialConfig || {};
    const columns = useMemo(() => {
        // Ưu tiên danh sách cột từ bước trước (outputColumns đã chuẩn hóa thành mảng string)
        if (Array.isArray(availableColumns) && availableColumns.length > 0) {
            return availableColumns.map(c => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
        }
        // Fallback: lấy từ dataPreview nếu không có availableColumns
        if (Array.isArray(dataPreview) && dataPreview.length > 0) {
            return Object.keys(dataPreview[0] || {}).filter(k => k !== 'rowId' && k !== 'key');
        }
        return [];
    }, [availableColumns, dataPreview]);

    const percentileOptions = [5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95];

    const handleChange = (patch) => {
        onChange && onChange({ ...config, ...patch });
    };

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <div>
                <div>Chọn cột giá trị</div>
                <Select
                    style={{ width: '100%' }}
                    value={config?.valueColumn}
                    onChange={(v) => handleChange({ valueColumn: v })}
                    placeholder="Chọn cột giá trị"
                    showSearch
                    optionFilterProp="children"
                >
                    {columns.map(col => (
                        <Option key={col} value={col}>{col}</Option>
                    ))}
                </Select>
            </div>

            <div>
                <div>Chọn cột tên nhóm</div>
                <Select
                    style={{ width: '100%' }}
                    value={config?.groupColumn}
                    onChange={(v) => handleChange({ groupColumn: v })}
                    placeholder="Chọn cột nhóm"
                    showSearch
                    optionFilterProp="children"
                >
                    {columns.map(col => (
                        <Option key={col} value={col}>{col}</Option>
                    ))}
                </Select>
            </div>

            <div>
                <div>Chọn phân vị (%)</div>
                <Select
                    style={{ width: 200 }}
                    value={config?.percentile ?? 80}
                    onChange={(v) => handleChange({ percentile: v })}
                >
                    {percentileOptions.map(p => (
                        <Option key={p} value={p}>{p}%</Option>
                    ))}
                </Select>
            </div>

            {/* Ghi chú: Filter tập mẫu dùng chung UI Filter step, ở đây hiển thị mô tả nếu có */}
            {config?.sampleFilterDesc && (
                <div style={{ color: '#666' }}>Tập mẫu: {config.sampleFilterDesc}</div>
            )}
        </div>
    );
}



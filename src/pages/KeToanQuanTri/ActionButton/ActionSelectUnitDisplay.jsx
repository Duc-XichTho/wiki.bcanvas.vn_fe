import React from 'react';
import { Select } from 'antd';
import { useContext } from 'react';
import { MyContext } from '../../../MyContext.jsx';

const { Option } = Select;

export default function ActionSelectUnitDisplay() {
    const { unitDisplay, updateUnitDisplay } = useContext(MyContext);

    const handleUnitChange = (value) => {
        updateUnitDisplay(value);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-color)' }}>Đơn vị:</span>
            <Select
                value={unitDisplay}
                onChange={handleUnitChange}
                style={{ width: 120 }}
                size="small"
            >
                <Option value="thousand">Nghìn</Option>
                <Option value="million">Triệu</Option>
            </Select>
        </div>
    );
}

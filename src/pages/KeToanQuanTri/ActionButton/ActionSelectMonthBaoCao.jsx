import React from 'react';
import { Select } from 'antd';
import css from '../BaoCao/BaoCao.module.css';

const { Option } = Select;

export default function ActionSelectMonthBaoCao({ selectedMonth, handleSelectedMonthChange }) {

    return (
        <Select
            className={css.customSelect}
            value={
                selectedMonth === 0
                    ? { value: 0, label: 'Luỹ kế năm' }
                    : selectedMonth
                        ? { value: selectedMonth, label: `Tháng ${selectedMonth}` }
                        : undefined
            }
            onChange={handleSelectedMonthChange}
            style={{
                width: "max-content",
                minWidth: '100px',
                borderRadius: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            dropdownStyle={{
                width: '120px',
                height: 'auto',
                overflow: 'visible',
            }}
        >
            {Array.from({ length: 12 }, (_, index) => (
                <Option key={index + 1} value={(index + 1).toString()}>
                    Tháng {index + 1}
                </Option>
            ))}
            <Option value={0}>Luỹ kế năm</Option>
        </Select>
    );
}

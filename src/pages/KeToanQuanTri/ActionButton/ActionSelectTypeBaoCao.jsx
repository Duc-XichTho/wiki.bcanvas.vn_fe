import React, {useEffect, useState} from 'react';
import {Select} from 'antd';
import css from '../BaoCao/BaoCao.module.css';

const {Option} = Select;

export default function ActionSelectTypeBaoCao({options, handlers}) {
    const [selectedView, setSelectedView] = useState(null);

    useEffect(() => {
        const selectedOption = options.find(option => option.used == true);
        if (selectedOption) {
            setSelectedView(selectedOption.value);
        } else {
            setSelectedView(options[0].value);
        }
    }, [options]);

    const handleSelectChange = (value) => {
        setSelectedView(value);
        const handler = handlers[value];
        if (handler) {
            handler();
        }
    };

    return (
        <Select
            className={css.customSelect}
            value={selectedView}
            onChange={handleSelectChange}
            style={{
                width: "max-content",
                borderRadius: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        >
            {options.map((option) => (
                <Option key={option.value} value={option.value}>
                    {option.label}
                </Option>
            ))}
        </Select>
    );
}

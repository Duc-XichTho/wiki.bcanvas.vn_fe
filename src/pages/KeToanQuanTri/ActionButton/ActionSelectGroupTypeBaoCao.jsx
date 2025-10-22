import React from 'react';
import {Select} from 'antd';
import {MAPPING_GROUP_TYPE} from "../../../Consts/GROUP_SETTING.js";
import css from '../BaoCao/BaoCao.module.css';

const {Option} = Select;

export default function ActionSelectGroupTypeBaoCao({selectedTypeGroup, setSelectedTypeGroup}) {
    const options = Object.entries(MAPPING_GROUP_TYPE).map(([value, label]) => ({label: 'Nhóm theo ' + label, value}));
    const handleSelectChange = (value) => {
        setSelectedTypeGroup(value);
    };

    return (
        <Select
            className={css.customSelect}
            value={selectedTypeGroup}
            onChange={handleSelectChange}
            style={{
                width: "max-content",
                minWidth: '100px',
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

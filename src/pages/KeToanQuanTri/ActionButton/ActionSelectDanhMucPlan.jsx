import React, {useEffect, useState} from 'react';
import {Select} from 'antd';
import css from '../BaoCao/BaoCao.module.css';

// Import các hàm tiện ích
const {Option} = Select;

export default function ActionSelectDanhMucPlan({selectedUnit, listUnit, handlers}) {
    const [selected, setSelected] = useState(null);
    useEffect(() => {
        listUnit.push('Total')
        const selectedOption = listUnit.find((option) => option == selectedUnit);
        if (selectedOption) {
            setSelected(selectedOption);
        } else if (listUnit.length > 0) {
            setSelected(listUnit[0]);
        }
    }, [listUnit]);

    const handleSelectChange = (value) => {
        if (value == "Chưa nhóm") {
            handlers(null)
        } else {
            handlers(value)
        }
        setSelected(value)
    };

    return (
        <Select
            className={css.customSelect}
            value={selected}
            onChange={handleSelectChange}
            style={{
                width: "max-content",
                minWidth: '100px',
                borderRadius: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        >
            {listUnit.map((unit) => (
                <Option key={unit} value={unit}>
                    {unit.group}
                </Option>
            ))}
        </Select>
    );
}

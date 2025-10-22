import React, {useEffect, useRef, useState} from 'react';
import {Select} from 'antd';
import css from '../BaoCao/BaoCao.module.css';

// Import các hàm tiện ích
const {Option} = Select;

export default function ActionSelectDanhMucBaoCao({selectedUnit, listUnit, handlers, groupType = 'group'}) {
    const [selected, setSelected] = useState(null);

    const getUniqueUnits = (units) => {
        return units
            .map((unit) => ({
                ...unit,
                group: unit[groupType] ?? "Chưa nhóm",
            }))
            .filter(
                (unit, index, self) =>
                    self.findIndex((u) => u[groupType] === unit[groupType]) === index &&
                    !unit?.[groupType]?.includes("Internal")
            );
    };

    const formatGroupName = (group) => {
        if (group?.includes("-")) {
            return group.split("-").slice(1).join("-");
        }
        return group;
    };


    const [maxWidth, setMaxWidth] = useState(0);
    const hiddenRef = useRef(null);

    useEffect(() => {
        if (hiddenRef.current) {
            const maxOptionWidth = Math.max(
                ...getUniqueUnits(listUnit).map(unit =>
                    hiddenRef.current?.scrollWidth
                )
            );
            setMaxWidth(maxOptionWidth);
        }
    }, [listUnit]);


    useEffect(() => {
        const uniqueUnits = getUniqueUnits(listUnit);
        const selectedOption = uniqueUnits.find((option) => option[groupType] == selectedUnit);
        if (selectedOption) {
            setSelected(selectedOption[groupType]);
        } else if (!selectedOption && uniqueUnits.length > 0) {
            setSelected(null);
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
        <div style={{display: "flex", justifyContent: "end", gap: '5px', alignItems: 'center', height:'100%',}}>
            {!(selected) && (
                <span  style={{color: "red"}} >Vui lòng chọn danh mục!</span>
            )}
            <div ref={hiddenRef} style={{
                position: 'absolute',
                visibility: 'hidden',
                whiteSpace: 'nowrap'
            }}>
                {getUniqueUnits(listUnit).map((unit) => (
                    <div key={unit[groupType]}>
                        {formatGroupName(unit[groupType])}
                    </div>
                ))}
            </div>
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
            {getUniqueUnits(listUnit).map((unit) => (
                <Option key={unit[groupType]} value={unit[groupType]}>
                    {formatGroupName(unit[groupType])}
                </Option>
            ))}
        </Select>
        </div>

    );
}

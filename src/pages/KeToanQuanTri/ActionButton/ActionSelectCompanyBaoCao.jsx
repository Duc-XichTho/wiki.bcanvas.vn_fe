import React, {useEffect} from 'react';
import {Select, Typography} from 'antd';
import css from '../BaoCao/BaoCao.module.css';
import {setItemInIndexedDB} from "../../../storage/storageService.js";

const {Option} = Select;

export default function ActionSelectCompanyBaoCao({options, handlers, valueSelected}) {
    const handleSelectChange = (selectedIds) => {

        const selectedOptions = options.filter(option => selectedIds.includes(option.id));

        // Nếu có HQ trong lựa chọn, thì truyền HQ thay vì các lựa chọn khác.
        if (selectedOptions?.length > 0 && selectedOptions.some(e => e.code === 'HQ')) {
            handlers([{id: 99999999, name: 'HQ', code: 'HQ'}]);
        } else {
            handlers(selectedOptions);
        }
    };



    return (
        <div style={{display: "flex", justifyContent: "end", gap: '5px', alignItems: 'center', height:'100%', marginLeft:'20px'}}>
            {!(valueSelected && valueSelected.length > 0) && (
                <span  style={{color: "red"}} >Vui lòng chọn công ty!</span>
            )}
            <Select
                className={css.customSelect}
                value={(valueSelected && valueSelected.length > 0 && valueSelected.map(item => item.id)) || []}
                mode="multiple"
                onChange={handleSelectChange}
                style={{
                    width: "max-content",
                    minWidth: '150px',
                    borderRadius: '16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
                placeholder={'Chọn công ty'}
            >
                {options?.length > 0 &&
                    options.map((option) => (
                        <Option
                            key={option.id}
                            value={option.id}
                            // Nếu HQ được chọn thì disable các lựa chọn khác
                            disabled={valueSelected.some(e => e.code === 'HQ') && option.code !== 'HQ'}
                        >
                            {option.name}
                        </Option>
                    ))
                }
            </Select>
        </div>

    );
}

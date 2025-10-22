import React from 'react';
import { Switch } from 'antd';
import css from '../../Home/AgridTable/DanhMuc/KeToanQuanTri.module.css';

export default function ActionToggleSwitch({ label, isChecked, onChange }) {
    return (
        <div className={`${css.actionToogle} `}>
            <span>{label}</span>
            <Switch
                checked={isChecked}
                checkedChildren="BẬT"
                unCheckedChildren="TẮT"
                onChange={onChange}
                style={{
                    backgroundColor: isChecked ? '#249E57' : '',
                }}
            />
        </div>
    );
}

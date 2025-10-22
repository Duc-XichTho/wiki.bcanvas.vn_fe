import React from 'react';
import {Switch} from 'antd';
import css from '../../Home/AgridTable/DanhMuc/KeToanQuanTri.module.css';

export default function ActionDisplayRichNoteSwitch({isChecked, onChange}) {
    return (
        <div className={`${css.actionToogle} `}>
            <span>Info</span>
            <Switch
                checked={isChecked}
                onChange={onChange}
                checkedChildren="HIỆN"
                unCheckedChildren="ẨN"
                style={{
                    backgroundColor: isChecked ? '#249E57' : '',
                }}
                // className={css.switchCustom}
            />
        </div>
    );
}

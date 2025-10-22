import React from 'react';
import {Switch} from 'antd';
import css from '../../Home/AgridTable/DanhMuc/KeToanQuanTri.module.css';

export default function ActionDisplayModeSwitch({isChecked, onChange}) {
    return (
        <div className={`${css.headerActionButton} `}>
            <Switch
                checked={isChecked}
                onChange={onChange}
                checkedChildren="ĐẦY ĐỦ"
                unCheckedChildren="RÚT GỌN"
                style={{
                    backgroundColor: isChecked ? '#249E57' : '',
                }}
                // className={css.switchCustom}
            />
        </div>
    );
}

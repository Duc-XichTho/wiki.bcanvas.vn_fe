import css from "../DanhMuc/KeToanQuanTri.module.css";
import React from "react";
import {FilterIcon} from "../../../../icon/IconSVG.js";
import {Switch} from "antd";

export default function ActionChangeFilter({isStatusFilter, handleChangeStatusFilter }) {
    return (
        <div className={css.headerActionButton}>
            <img src={FilterIcon} alt="" />
            <Switch
                checked={isStatusFilter}
                checkedChildren="BẬT"
                unCheckedChildren="TẮT"
                onChange={handleChangeStatusFilter}
                style={{
                    backgroundColor: isStatusFilter ? '#249E57' : '',
                }}
            />
        </div>
    );
}

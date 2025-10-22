import css from "../DanhMuc/KeToanQuanTri.module.css";
import React from "react";
import {DeleteFilterIcon, FilterIcon} from "../../../../icon/IconSVG.js";
import {Switch} from "antd";

export default function ActionClearFilter({showClearFilter, clearFilters }) {
    return (
        showClearFilter && (
            <div className={`${css.headerActionButton} ${css.buttonOn}`} onClick={clearFilters}>
                <div className={css.buttonContent}>
                    <img src={DeleteFilterIcon} alt=""/>
                    <span>Xóa ký tự lọc</span>
                </div>
            </div>
        )
    );
}


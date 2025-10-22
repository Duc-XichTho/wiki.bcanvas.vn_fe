import css from "../DanhMuc/KeToanQuanTri.module.css";
import React from "react";
import {FilterIcon} from "../../../../icon/IconSVG.js";
import {Switch} from "antd";

export default function ActionViewTPB({handleOpenView}) {
    return (
        <div className={`${css.headerActionButton} ${ css.buttonOn}`}
             onClick={handleOpenView}>
            <span>Xem Thẻ phân bổ</span>
        </div>
    );
}


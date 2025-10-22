import css from "../DanhMuc/KeToanQuanTri.module.css";
import React from "react";

export default function ActionHideRow({handleHideRow, handleShowRow, isHideShow}) {
    return (
        <div className={`${css.headerActionButton} ${css.buttonOn}`}
             onClick={!isHideShow ? handleHideRow : handleShowRow}
        >
            <span>{!isHideShow ? "Ẩn dòng trống" : "Bỏ ẩn dòng"}</span>
        </div>
    );
}

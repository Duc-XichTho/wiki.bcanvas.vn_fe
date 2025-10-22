import css from "../DanhMuc/KeToanQuanTri.module.css";
import React from "react";
import {FilterIcon} from "../../../../icon/IconSVG.js";
import {Switch} from "antd";
import {IoIosSearch} from "react-icons/io";

export default function ActionSearch({handleFilterTextBoxChanged}) {
    return (
        <div className={css.buttonSearch}>
            <IoIosSearch style={{width: 24, height: 24, marginLeft: "10px"}}/>
            <input
                type="text"
                id="filter-text-box"
                className={css.quickFilterInput}
                placeholder="Tìm trong bảng"
                onInput={handleFilterTextBoxChanged}
            />
        </div>
    );
}


import css from "../DanhMuc/KeToanQuanTri.module.css";
import React from "react";
import {SaveTableIcon} from "../../../../icon/IconSVG.js";

export default function ActionSave({handleSaveData, updateData}) {
    return (
        updateData && updateData.length > 0 && (
            <div className={`${css.headerActionButton} ${css.buttonSave}`}
                 onClick={()=> handleSaveData(updateData)}
            >
                <div className={`${css.buttonSaveLayout} `}>
                    <img src={SaveTableIcon} alt=""/>
                    <span>Lưu</span>
                </div>

            </div>
        )
    );
}

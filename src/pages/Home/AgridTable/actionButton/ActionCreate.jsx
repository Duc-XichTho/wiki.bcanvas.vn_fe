import css from "../DanhMuc/KeToanQuanTri.module.css";
import React from "react";
import { ADD_NEW } from '../../../../icon/svg/IconSvg.jsx';

export default function ActionCreate({ handleAddRow }) {
    return (
        <div>
            <div className={css.buttonAction} onClick={handleAddRow}>
                <ADD_NEW width={15} height={15}/>
            </div>
        </div>
    );
}


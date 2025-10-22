import React from "react";
import {EditIconCoLe} from "../../../../icon/IconSVG.js";
import {IconButton} from "@mui/material";

export default function ActionViewKmtc({handleOpenView}) {
    return (
        // <div className={`${css.headerActionButton} ${ css.buttonOn}`}
        //      onClick={handleOpenView}>
        //     <span>Xem Kmtc</span>
        // </div>
        <IconButton onClick={handleOpenView}>
            <img src={EditIconCoLe} alt=""/>
        </IconButton>
    );
}


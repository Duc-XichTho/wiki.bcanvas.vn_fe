import css from "../DanhMuc/KeToanQuanTri.module.css";
import React from "react";
import {EditIconCoLe, FilterIcon} from "../../../../icon/IconSVG.js";
import {Switch} from "antd";
import {IconButton} from "@mui/material";

export default function ActionViewVas({handleOpenView}) {
    return (
        <IconButton onClick={handleOpenView}>
            <img src={EditIconCoLe} alt=""/>
        </IconButton>
    );
}


import React from 'react'
import {Outlet} from "react-router-dom";
import css from './DanhMuc.module.css'
const DanhMuc = () => {
    return (
        <div className={css.table}>
            <Outlet />
        </div>
    )
}

export default DanhMuc

import React from 'react'
import { Outlet } from "react-router-dom";
import css from './HoaDon.module.css'
const HoaDon = () => {
    return (
        <div className={css.table}>
            <Outlet />
        </div>
    )
}

export default HoaDon

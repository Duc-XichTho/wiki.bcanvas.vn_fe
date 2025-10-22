import React from 'react'
import { Outlet } from "react-router-dom";
import css from './SoLieu.module.css'
const SoLieu = () => {
    return (
        <div className={css.table}>
            <Outlet />
        </div>
    )
}

export default SoLieu

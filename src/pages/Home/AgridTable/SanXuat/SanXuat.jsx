import React from 'react'
import { Outlet } from "react-router-dom";
import css from './SanXuat.module.css'

const SanXuat = () => {
    return (
        <div className={css.table}>
            <Outlet />
        </div>
    )
}

export default SanXuat

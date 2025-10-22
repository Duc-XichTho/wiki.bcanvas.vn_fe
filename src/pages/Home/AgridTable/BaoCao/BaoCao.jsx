import React from 'react'
import {Outlet} from "react-router-dom";
import css from './BaoCao.module.css'
import ActionBookMarkChain from "../actionButton/ActionBookMarkChain.jsx";
const BaoCao = () => {
    return (
        <div className={css.table}>
            <Outlet />
            {/*<ActionBookMarkChain/>*/}

        </div>
    )
}

export default BaoCao

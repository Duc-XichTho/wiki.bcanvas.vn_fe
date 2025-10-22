import css from "./ActionCreate.module.css";
import React from "react";

export default function ActionCreate({ onClick }) {
    return (
        <div className={`${css.headerActionButton} ${css.buttonCreate}`}
            onClick={onClick}>
            <span> + Mới</span>
        </div>
    );
}


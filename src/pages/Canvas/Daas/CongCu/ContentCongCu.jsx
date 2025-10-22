import React from "react";
import css from "./ContentCongCu.module.css";
import {Outlet} from "react-router-dom";
// COMPONENT

const ContentCongCu = () => {

  return (
    <div className={css.container}>
      <Outlet/>
    </div>
  );
};

export default ContentCongCu;

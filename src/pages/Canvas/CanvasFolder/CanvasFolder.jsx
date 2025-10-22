import React from "react";
import css from "./CanvasFolder.module.css";
import KPICalculator from "./KPICalculator/KPICalculator";

const CanvasFolder = ({ isOpen, onClose, children, name }) => {
  if (!isOpen) return null;

  return (
    <div className={css.overlay}>
      <div className={css.popup}>
        <div className={css.header}>
          <h2 className={css.headerTitle}>SAB - Máy tính {name}</h2>
          <button className={css.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={css.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CanvasFolder;

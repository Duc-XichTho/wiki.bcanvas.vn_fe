import React, { useState } from 'react';
import FormAddDialog from './FormAddDialog.jsx';
import { IconSVG } from '../../../../image/IconSVG.js';

export default function PopFormAdd(props) {
  const [isDialogShow, setIsDialogShow] = useState(false);

  function handleClick() {
    setIsDialogShow(true);
  }

  const handleDialogClose = () => {
    setIsDialogShow(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <div className="navbar-item" onClick={handleClick}>
        <img src={IconSVG} style={{ width: '32px', height: '37px' }} alt="Add Icon" />
        <span> Thêm mới </span>
      </div>
      <FormAddDialog
        open={isDialogShow}
        onClose={handleDialogClose}
        table={props.table}
        onGridReady={props.onGridReady}
        company={props.company}
      />
    </div>
  );
}

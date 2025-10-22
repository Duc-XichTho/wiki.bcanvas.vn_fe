import '../../../../index.css';
import React, { useState, useEffect } from 'react';
import './popCellUpAction.css';
import { HiDotsVertical } from 'react-icons/hi';
import LongNoteDialog from './NoteDialog';
import { getNote2Data } from '../../../../apisKTQT/note2Service.jsx';
import PopupCellMenu from './PopupCellMenu';
import { AiOutlineFileText } from 'react-icons/ai';
import {formatCurrency} from "../../functionKTQT/formatMoney.js";

const PopupCellActionCDTC = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLongNoteDialogOpen, setIsLongNoteDialogOpen] = useState(false);
  const [onSave, setOnSave] = useState(false);
  const [note, setNote] = useState([]);
  let field = props.colDef.field;
  let title = props.data.header;
  let company = props.company;
  const getCircleColor =  () => {

    let layer =  props.data.layer+'';
    let month =  props.monthCL;
    let chenhLech =  props.data[`t${month}_v`]
    if (layer.startsWith('1')) {
      if (chenhLech === 0) {
        return '#76A797';
      }
      else {
        if (chenhLech > 0) return '#76A797'
        else return '#D86344'
      }
    }else {
      if (chenhLech === 0) {
        return '#76A797';
      }
      else {
        if (chenhLech > 0) return '#D86344'
        else return '#76A797'
      }

    }
  };
  const handleButtonClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLongNoteSelect = () => {
    setIsLongNoteDialogOpen(true);
  };

  const handleNoteSelect = () => {
    setIsLongNoteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsLongNoteDialogOpen(false);
  };

  function checkShowHDot(props) {
    if (!props || !props.colDef) {
      return false;
    }
    const restrictedFields = ['t0_thuchien'];
    if (restrictedFields.includes(props.colDef.field)) {
      return false;
    }
    return true;
  }


  return (
    <>
      <div className={'popup-cell'}>
        <div className={'cell-actions'}>
          {/*{note && note.note != null && note.note !== '' && (*/}
          {/*  <AiOutlineFileText size={16} style={{ marginRight: 6, cursor: 'pointer' }} onClick={handleNoteSelect} />*/}
          {/*)}*/}
        </div>
        <button
          // onClick={handleButtonClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            marginRight: '-15px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14.5px',
            color : "var(--text-color)",
            fontFamily: 'var(--font-family)',
            fontWeight : 500
          }}
          aria-label="Add"
        >
          {!props.colDef.field.includes('_v') && (
              <>
                {formatCurrency((props.data[props.colDef.field] / 1000).toFixed(0))}
                <HiDotsVertical id={'cell-icon'} size={15} color={'#7e7e7e'} />
              </>
          )

          }

          {props.colDef.field.includes('_v') &&
              <div className="circle" style={{backgroundColor: getCircleColor()}}></div>}
        </button>
      </div>
      {checkShowHDot(props) && (
        <PopupCellMenu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onLongNoteSelect={handleLongNoteSelect}
          props={props}
        />
      )}
      {isLongNoteDialogOpen && (
        <LongNoteDialog
          open={isLongNoteDialogOpen}
          onClose={handleDialogClose}
          title={props.data.header}
          table={props.table}
          company={props.company}
          field={field}
          onSave={onSave}
          setOnSave={setOnSave}
        />
      )}
    </>
  );
};

export default PopupCellActionCDTC;

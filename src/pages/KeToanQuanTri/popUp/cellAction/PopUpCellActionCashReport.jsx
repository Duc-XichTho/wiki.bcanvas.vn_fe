import React, { useState } from 'react';
import './popCellUpAction.css';
import { HiDotsVertical } from 'react-icons/hi';
import PopupDetailCashReport from '../../detail/PopupDetailCashReport.jsx';
import {formatCurrency} from "../../functionKTQT/formatMoney.js";

const PopupCellActionCashReport = (props) => {
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDetailDialogOpen2, setIsDetailDialogOpen2] = useState(false);
  const handleButtonClick = () => {
    setIsDetailDialogOpen(true);
  };
  const handleButtonClick2 = () => {
    setIsDetailDialogOpen2(true);
  };

  const handleDialogClose = () => {
    setIsDetailDialogOpen(false);
  };
  const handleDialogClose2 = () => {
    setIsDetailDialogOpen2(false);
  };

  function isShowDot() {
    let field = props.colDef.field;
    if (field.includes('0')) return false;
    let layer = props.data.refercode;
    if (layer.split('.')[0] === '1') return false;
    if (!layer.includes('.')) return false;
    return true;
  }

  function isShowChenhLech() {
    let field = props.colDef.field;
    if (field.includes('chenhlech')) {
      let layer = props.data.refercode;
      if (layer.startsWith('!') || layer.startsWith('3')) {
        const chenhLech = props.data[field.replace('chenhlech', 'kehoach')] - props.data[field.replace('chenhlech', 'thuchien')];
        return chenhLech;
      }
    }
    return 0;
  }

  const getCircleColor = () => {
    let chenhLech = isShowChenhLech();
    let layer = props.data.refercode;
    if (layer.startsWith('2')) {
      if (chenhLech === 0) {
        return '#76A797';
      }
      return chenhLech > 0 ? '#D86344' : '#76A797';
    }

    if (layer.startsWith('3')) {
      if (chenhLech === 0) {
        return '#76A797';
      }
      return chenhLech < 0 ? '#76A797' : '#D86344';
    }

    return null;
  };

  return (
    <>
      {props.data && (
        <>
          <div className={'popup-cell'}>
            <>&nbsp;</>
            <button
              onClick={() => {
                if (props.colDef.field.includes('_kehoach')) {
                  handleButtonClick();
                }
                if (props.colDef.field.includes('_thuchien')) {
                  handleButtonClick2();
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                fontSize: '14.5px',
                color: props.colDef.field.includes('chenh')
                  ? null
                  : props.colDef.field.includes('_kehoach')
                  ? '#2A34A7'
                  : '#C10E47',
              }}
              disabled={!isShowDot()}
            >
              {props.colDef.field.includes('_chenhlech') &&
              (props.data.refercode.startsWith('2') || props.data.refercode.startsWith('3')) ? (
                <>
                  <div className="circle" style={{ backgroundColor: getCircleColor() }}></div>
                </>
              ) : (
                <>
                  {!props.colDef.field.includes('_chenhlech') &&
                    formatCurrency((props.data[props.colDef.field] / 1000).toFixed(0))}
                  {/*{isShowDot() && <HiDotsVertical id={'cell-icon'} size={15} color={'#5F5E5B'} />}*/}
                  {/*{!isShowDot() && (*/}
                  {/*  <HiDotsVertical id={'cell-icon'} style={{ opacity: 0 }} size={15} color={'#5F5E5B'} />*/}
                  {/*)}*/}
                </>
              )}
            </button>
          </div>
          {isDetailDialogOpen && (
            <PopupDetailCashReport
              open={isDetailDialogOpen}
              onClose={handleDialogClose}
              data={props.data}
              business_unit={props.data.business_unit}
              field={props.field}
              table="DetailCashReportKH"
              company={props.company}
            />
          )}
          {isDetailDialogOpen2 && (
            <PopupDetailCashReport
              open={isDetailDialogOpen2}
              onClose={handleDialogClose2}
              data={props.data}
              business_unit={props.data.business_unit}
              field={props.field}
              table="DetailCashReportTH"
              company={props.company}
            />
          )}
        </>
      )}
    </>
  );
};

export default PopupCellActionCashReport;

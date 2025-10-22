import '../../../../index.css';
import React, {useState, useContext, useEffect} from 'react';
import './popCellUpAction.css';
import {HiDotsVertical} from 'react-icons/hi';
import {formatCurrency} from "../../functionKTQT/formatMoney.js";
import {formatUnitDisplay} from "../../functionKTQT/formatUnitDisplay.js";
import {MyContext} from "../../../../MyContext.jsx";
import PopupDetailBCKD from "../../detail/PopupDetailBCKD.jsx";
import { getSettingByType } from '../../../../apis/settingService.jsx';

const PopupCellActionBCKD = (props) => {
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const { unitDisplay } = useContext(MyContext);


    const handleButtonClick = () => {
        if (canOpenDetailDialog()) {
            setIsDetailDialogOpen(true);
        }
    };
    const canOpenDetailDialog = () => {
        const hasValidLayer = props.data.layer?.toString().split('.').length !== 1;
        const isFieldValid = props.colDef.field !== '0';
        const isFieldAll = props.colDef.field.includes('ALL');
        return hasValidLayer && isFieldValid && !isFieldAll;
    };
    const handleDialogClose = () => {
        setIsDetailDialogOpen(false);
    };

    function isShowDot() {
        let field = props.colDef.field;
        if (field.includes('0')) return false;
        let layer = props.data.layer;
        if (props.type === 'NSP') {
            return true;
        } else {
            return ![1, 2, 3, 4, 5, 6].some((x) => x == layer);
        }
    }

    function calculateRatio() {
        const {allData} = props;
        let sub = allData.find((e) => e.layer === '1');
        let field = props.colDef.field;
        if (!sub) {
            return;
        }
        if (sub[field] === 0) {
            return '-%';
        }
        let ratio = Math.round((props.data[field] / sub[field]) * 100);
        if (isNaN(ratio)) {
            ratio = '-';
        }
        if (ratio === 0) {
            ratio = '-';
        }
        if (Math.abs(ratio) > 100000) {
            ratio = (ratio / 1000000).toFixed(0) + 'M';
        } else if (Math.abs(ratio) > 1000) {
            ratio = (ratio / 1000).toFixed(0) + 'K';
        }
        return ratio + '%';
    }



    return (
        <>
            <div className={'popup-cell'}>
                <>&nbsp;</>
                <button
                    onClick={handleButtonClick}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14.5px',
                        color: 'var(--text-color)',
                        fontFamily: 'var(--font-family)',
                        fontWeight: 500
                    }}
                    // disabled={isShowDot()}
                >
                    <div className="bckd-tien">{formatUnitDisplay(props.data[props.colDef.field], unitDisplay)}</div>

                    <div className="bckd-ratio" style={{color: '#546d7d'}}>{calculateRatio()}</div>
                    {isShowDot() && <HiDotsVertical id={'cell-icon'} size={1} color={'#7e7e7e'}/>}
                    {!isShowDot() && <HiDotsVertical id={'cell-icon'} style={{opacity: 0}} size={1} color={'#7e7e7e'}/>}
                </button>
            </div>
            {/*{*/}
            {/*    props.type !== 'NSP' && <>*/}
                    {isDetailDialogOpen && (
                        <PopupDetailBCKD
                            open={isDetailDialogOpen}
                            onClose={handleDialogClose}
                            data={props.data}
                            field={props.field}
                            type={props.type}
                            company={props.company}
                            view={props.view}
                            currentYear={props.currentYear}
                            plType={props.plType}
                        />
                    )}
            {/*    </>*/}
            {/*}*/}

        </>
    );
};

export default PopupCellActionBCKD;

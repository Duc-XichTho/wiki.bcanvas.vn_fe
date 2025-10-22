import React, {useEffect, useState} from 'react';
import './popCellUpAction.css'
import { HiDotsVertical } from "react-icons/hi";
import LongNoteDialog from "./NoteDialog.jsx";
import PopupCellMenu from "./PopupCellMenu.jsx";
import {AiOutlineFileText} from "react-icons/ai";
import {formatCurrency} from "../../function/formatMoney.js";
import {getNoteData} from "../../../../apisKTQT/noteService.jsx";


    const PopupCellActionBCVNH = (props) => {
        const [anchorEl, setAnchorEl] = useState(null);
        const [isLongNoteDialogOpen, setIsLongNoteDialogOpen] = useState(false);
        const [onSave, setOnSave] = useState(false);
        const [note, setNote] = useState([]);
        let field = props.colDef.field;
        useEffect(() => {
            getNoteData(props.data.id, props.table, field).then((data) => {
                setNote(data);
            });
        },[onSave]);


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



        return (<>
            <div className={'popup-cell'}>

                <div className={'cell-actions'}>

                    {(note.data?.note != null && note.data?.note !== '') && <AiOutlineFileText size={16} style={{marginRight: 6, cursor: 'pointer'}}
                                                           onClick={handleNoteSelect}/>}
                </div>
                <button
                    onClick={handleButtonClick}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        marginRight: '-15px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    aria-label="Add"
                >
                    {formatCurrency((props.data[props.colDef.field]/1000).toFixed(0))}
                        <HiDotsVertical id={"cell-icon"} size={15} color={"#7e7e7e"} />
                </button>
            </div>
            {checkShowHDot(props) &&
                <PopupCellMenu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    onLongNoteSelect={handleLongNoteSelect}
                    props = {props}
                />
            }
            {isLongNoteDialogOpen  &&
                <LongNoteDialog
                    open={isLongNoteDialogOpen}
                    onClose={handleDialogClose}
                    id={props.id}
                    table={props.table}
                    field={field}
                    onSave={onSave}
                    setOnSave={setOnSave}
                />}

        </>);
    };

    export default PopupCellActionBCVNH;

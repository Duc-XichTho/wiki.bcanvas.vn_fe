import React from 'react';
import {Menu, MenuItem} from '@mui/material';
import {AiOutlineComment, AiOutlineFileText, AiOutlineMenu} from 'react-icons/ai';

const PopupCellMenu = ({anchorEl, open, onClose, onLongNoteSelect, onCommentSelect, onDetailSelect, checkData , props}) => {
    const handleMenuItemClick = (option) => {
        onClose();
        if (option === 'Long note') {
            onLongNoteSelect();
        }
    };
    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <MenuItem onClick={() => handleMenuItemClick('Long note')}>
                <AiOutlineFileText size={20} style={{marginRight: 8}}/>
                <span style={{fontSize: 15}}>Ghi chú</span>
            </MenuItem>

        </Menu>
    );
};

export default PopupCellMenu;
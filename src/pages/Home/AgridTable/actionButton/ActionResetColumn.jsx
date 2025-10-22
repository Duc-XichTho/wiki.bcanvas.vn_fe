import React, {useState} from "react";
import {deleteItemFromIndexedDB} from "../../../../storage/storageService.js";
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {ResetColumn} from "../../../../icon/IconSVG.js";

export default function ActionResetColumn({tableCol, setCheckColumn, checkColumn}) {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleReset = async () => {
        await deleteItemFromIndexedDB(tableCol);
        setCheckColumn(!checkColumn);
        handleClose(); // Đóng popover sau khi thực hiện hành động
    };

    const open = Boolean(anchorEl);
    const id = open ? 'reset-popover' : undefined;

    return (
        <div>
            <img src={ResetColumn}
                 onClick={handleClick}
                 alt=""/>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                sx={{
                    '& .MuiPaper-root': {
                        padding: '8px 12px',
                        borderRadius: '4px',
                        maxWidth: '255px',
                        marginLeft: '10px',
                        position: 'relative',
                    },
                }}
            >
                <Typography sx={{fontSize: '14px', marginBottom: '8px'}}>
                    Thiết lập lại kích thước, thứ tự cột như mặc định ban đầu
                </Typography>
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '5px'}}>
                    <Button onClick={handleReset} color="error" size="small">
                        Xác nhận
                    </Button>
                    <Button onClick={handleClose} color="primary" size="small">
                        Hủy
                    </Button>
                </div>
            </Popover>
        </div>
    );
}

import React, {useState} from 'react';
import {Button, IconButton, Popover, Typography} from "@mui/material";
import {CancelIcon, XRedIcon} from '../../../icon/IconSVG.js';
// API
import {deleteSheetData} from '../../../apis/sheetDataService.jsx';
import {toast} from "react-toastify";

export default function PopUpDeleteSheetColum({id, selectedColumn, handleDelete,}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const idPopover = open ? 'simple-popovers' : undefined;

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };


    const handleDeleteData = async () => {
        try {
            await handleDelete(id)
            handleClose();
        } catch (error) {
            console.error("Error handling delete and fetching data:", error);
        }
    };


    return (
        <>
            <IconButton>
                <img src={selectedColumn?.id === id ? CancelIcon : XRedIcon} alt=""
                     style={{height: "22px", margin: " -5px"}}
                     onClick={handleClick}
                />
            </IconButton>
            <Popover
                id={idPopover}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                PaperProps={{
                    style: {
                        marginTop: '-90px',
                        marginLeft: '180px',
                    },
                }}
            >
                <Typography sx={{padding: 2}}>
                    Bạn có muốn xóa dòng này không?
                </Typography>
                <div style={{padding: '10px', display: 'flex', justifyContent: 'flex-end'}}>
                    <Button onClick={handleDeleteData} color="error">
                        Xóa
                    </Button>
                    <Button onClick={handleClose} color="primary">
                        Hủy
                    </Button>
                </div>
            </Popover>
        </>

    );
}

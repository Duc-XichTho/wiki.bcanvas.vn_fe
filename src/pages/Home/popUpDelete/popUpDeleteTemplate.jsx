import React, {useState} from 'react';
import {Button, IconButton, Popover, Typography} from '@mui/material';
import {DeleteIcon} from "../../../icon/IconSVG.js";
import css from "../Template/TemplateStepDetail/TemplateStepDetail.module.css";

export default  function  PopUpDeleteTemplate ({id, handleDeleteSubStep }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const idPopover = open ? 'simple-popover' : undefined ;

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDeleteAction = async () => {
        try {
            await handleDeleteSubStep(id)
            handleClose();
        } catch (error) {
            console.error("Error handling delete and fetching data:", error);
        }
    };

    return (
        <>
            <IconButton className={css.btnAdd}  onClick={handleClick}>
                <img
                    src={DeleteIcon}
                    alt="Delete"
                    style={{ height: "22px"}}
                />
            </IconButton
            >
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
            >
                <Typography sx={{ padding: 2 }}>
                    Bạn có muốn xóa dòng này không?
                </Typography>
                <div style={{ padding: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={handleDeleteAction} color="error">
                        Xóa
                    </Button>
                    <Button onClick={handleClose} color="primary">
                        Hủy
                    </Button>
                </div>
            </Popover>

        </>
    );
};



import React, {useEffect, useRef, useState} from 'react';
import {Button, IconButton, Popover, Typography} from '@mui/material';
import {UnSaveTron} from "../../../icon/IconSVG.js";
import {toast} from "react-toastify";
import {createTimestamp} from "../../../generalFunction/format.js";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {handleSave} from "../../Home/AgridTable/handleAction/handleSave.js";

const PopUpDelete = ({id, reload, table, currentUser, ...props}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [anchorOrigin, setAnchorOrigin] = useState({vertical: 'bottom', horizontal: 'center'});
    const [transformOrigin, setTransformOrigin] = useState({vertical: 'top', horizontal: 'center'});
    const iconButtonRef = useRef(null);

    const open = Boolean(anchorEl);
    const idPopover = open ? 'simple-popover' : undefined;

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleReload = () => {
        reload();
    };

    const handleDeleteAction = async () => {
        try {
            const {data, error} = await getCurrentUserLogin();
            const newValue = {
                id: id,
                user_update: data.email,
                updated_at: createTimestamp(),
                show : false
            }
            await handleSave([newValue], "File", '', currentUser);
            toast.success("Xóa thành công", {autoClose: 1000});
            handleClose();
            handleReload();
        } catch (error) {
            console.error("Error handling delete and fetching data:", error);
        }
    };

    useEffect(() => {
        if (anchorEl) {
            const rect = iconButtonRef.current.getBoundingClientRect();
            const screenWidth = window.innerWidth;
            if (rect.right + 200 > screenWidth) {
                setAnchorOrigin({vertical: 'bottom', horizontal: 'right'});
                setTransformOrigin({vertical: 'top', horizontal: 'right'});
            } else {
                setAnchorOrigin({vertical: 'bottom', horizontal: 'center'});
                setTransformOrigin({vertical: 'top', horizontal: 'center'});
            }
        }
    }, [anchorEl]);

    return (
        <>
            <IconButton style={{padding: "12px"}} ref={iconButtonRef} onClick={handleClick} size="small">
                <img src={UnSaveTron} alt=""/>
            </IconButton>
            <Popover
                id={idPopover}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={anchorOrigin}
                transformOrigin={transformOrigin}
                // PaperProps={{
                //     style: {
                //         marginTop: '-90px',
                //         marginLeft: '180px',
                //     },
                // }}
            >
                <Typography sx={{padding: 2}}>
                    Bạn có muốn xóa hình ảnh này không?
                </Typography>
                <div style={{padding: '10px', display: 'flex', justifyContent: 'flex-end'}}>
                    <Button onClick={handleDeleteAction} color="error">
                        Xác nhận
                    </Button>
                    <Button onClick={handleClose} color="primary">
                        Hủy
                    </Button>
                </div>
            </Popover>
        </>
    );
};

export default PopUpDelete;

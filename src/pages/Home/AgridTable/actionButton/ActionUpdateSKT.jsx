import css from "../DanhMuc/KeToanQuanTri.module.css";
import React, {useRef, useState} from "react";
import {Button, Popover, Typography} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync'; // Icon đồng bộ

export default function ActionUpdateSKT({handleUpdateSKT, updatedData}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [anchorOrigin, setAnchorOrigin] = useState({vertical: 'bottom', horizontal: 'center'});
    const [transformOrigin, setTransformOrigin] = useState({vertical: 'top', horizontal: 'center'});
    const open = Boolean(anchorEl);
    const idPopover = open ? 'simple-popover' : undefined;
    const iconButtonRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false); // Trạng thái xoay icon

    const handleConfirm = async () => {
        setIsLoading(true);
        await handleUpdateSKT();
        setIsLoading(false);
        handleClose();
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOpen = async (event) => {
        if (updatedData && updatedData.length > 0) {
            setAnchorEl(event.currentTarget);
        } else {
            setIsLoading(true);
            await handleUpdateSKT();
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className={`${css.headerActionButton} ${css.buttonOn}`}>
                <div className={css.buttonContent} ref={iconButtonRef} onClick={handleOpen}>
                    <SyncIcon
                        className={isLoading ? css.rotateIcon : ''}
                        style={{ marginRight: '10px' }}
                    />
                    <span>Cập nhật sổ kế toán</span>
                </div>
            </div>

            <Popover
                id={idPopover}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={anchorOrigin}
                transformOrigin={transformOrigin}
                style={{
                    marginTop: '10px',
                    width: '85%'
                }}
            >
                <Typography sx={{padding: 2}}>
                    Dữ liệu đang được thay đổi và chưa lưu bạn có muốn lưu và cập nhật sổ kế toán không?
                </Typography>
                <div style={{padding: '10px', display: 'flex', justifyContent: 'flex-end'}}>
                    <Button onClick={handleConfirm} color="primary">
                        Xác nhận
                    </Button>
                    <Button onClick={handleClose} color="error">
                        Hủy
                    </Button>
                </div>
            </Popover>
        </>

    );
}

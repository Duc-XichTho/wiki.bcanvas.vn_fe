import React, {useState} from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import css from './SelectComponent.module.css';
import {SettingIcon} from "../../../icon/IconSVG.js";

export default function CaiDatMenu({setShowCauHinhChotSo, setShowCauHinhButToan, setShowCauHinhPPTGT, setShowWarning, setShowSetupDK}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleShowCauHinhChotSo = () => {
        setShowCauHinhChotSo(true);
        handleClose()
    };

    const handleShowWarning = () => {
        setShowWarning(true);
        handleClose()
    };

    const handleShowSetupDK = () => {
        setShowSetupDK(true);
        handleClose()
    };

    const handleShowCauHinhButToan = () => {
        setShowCauHinhButToan(true);
        handleClose()
    };

    const handleShowCauHinhPPTGT = () => {
        setShowCauHinhPPTGT(true);
        handleClose()
    };

    return (
        <div>
            <Button
                id="menu-button"
                aria-controls={open ? 'menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{color: '#454545', textTransform: 'none'}}
            >
                <div className={css.navbarSelect}>
                    <img src={SettingIcon} alt=""/>
                    {/*<span>Cài đặt</span>*/}
                    {/*<ArrowDropDownIcon/>*/}
                </div>
            </Button>
            <Menu
                id="menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                sx={{
                    fontSize: '14px',
                    justifyContent: 'center',
                    display: 'flex',
                    fontFamily: 'Roboto Flex, sans-serif',
                    marginLeft : '30px'
                }}
            >
                <MenuItem onClick={() => handleShowCauHinhChotSo()}>Khóa sổ</MenuItem>
                <MenuItem onClick={() => handleShowCauHinhPPTGT()}>PP tính giá</MenuItem>
                <MenuItem onClick={() => handleShowWarning()}>Cảnh báo</MenuItem>
                <MenuItem onClick={() => handleShowSetupDK()}>Cấu hình định khoản</MenuItem>
                <MenuItem >Hướng dẫn</MenuItem>
            </Menu>
        </div>
    );
}

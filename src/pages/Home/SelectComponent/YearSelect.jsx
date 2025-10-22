import * as React from 'react';
import {useContext, useState} from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import css from "./SelectComponent.module.css";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {YearHeaderIcon} from "../../../icon/IconSVG.js";
import {MyContext} from "../../../MyContext.jsx";

export default function YearSelect() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const {currentYear, setCurrentYear} = useContext(MyContext)

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (year) => {
        setCurrentYear(year);
        handleClose();
    };

    return (
        <div>
            <Button
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{color: '#454545', textTransform: 'none'}}
            >
                <div className={css.navbarSelect}>
                    {/*<img src={YearHeaderIcon} alt=""/>*/}
                    <span>DỮ LIỆU {currentYear == 'toan-bo' ? "Toàn bộ" : currentYear }</span>
                    {/*<ArrowDropDownIcon/>*/}
                </div>
            </Button>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                sx={{
                    marginLeft: "30px"
                }}
            >

                <MenuItem style={{fontSize: '0.9rem'}} onClick={() => handleMenuItemClick('toan-bo')}>Dữ liệu
                    Toàn bộ</MenuItem>
                <MenuItem style={{fontSize: '0.9rem'}} onClick={() => handleMenuItemClick(2025)}>Dữ liệu
                    2025</MenuItem>
                <MenuItem style={{fontSize: '0.9rem'}} onClick={() => handleMenuItemClick(2024)}>Dữ liệu
                    2024</MenuItem>
                <MenuItem style={{fontSize: '0.9rem'}} onClick={() => handleMenuItemClick(2023)}>Dữ liệu
                    2023</MenuItem>


            </Menu>
        </div>
    );
}

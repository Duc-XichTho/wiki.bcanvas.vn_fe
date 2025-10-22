import * as React from 'react';
import {useContext, useRef, useState} from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import css from "./SelectComponent.module.css";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {MyContext} from "../../../MyContext.jsx";

export default function YearSelectKTQT() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const {currentYearKTQT, setCurrentYearKTQT} = useContext(MyContext);

    // Danh sách năm cố định từ 2023 đến 2026
    const years = [2023, 2024, 2025, 2026];
    const listYear = useRef(years);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (year) => {
        setCurrentYearKTQT(year);
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
                <div className={css.monthSelect}>
                    <span className={css.month} style={{fontSize : '15px'}}>
                        {currentYearKTQT === 'toan-bo' ? "Toàn bộ" : currentYearKTQT}
                    </span>
                    <ArrowDropDownIcon/>
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
                sx={{marginLeft: '10px', alignItems: 'center'}}
            >
                {listYear.current.map((year) => (
                    <MenuItem key={year} style={{fontSize: '0.9rem'}} onClick={() => handleMenuItemClick(year)}>
                        {year}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}

import * as React from 'react';
import {useContext, useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {getAllCompany} from "../../../apis/companyService.jsx";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import css from './SelectComponent.module.css';
import {MyContext} from "../../../MyContext.jsx";

export default function LSXSelect({dataLSX, selectedLSX, handleChangeLSX}) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (name) => {
        handleClose();
        handleChangeLSX(name);
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
                <div className={css.monthSelect} onClick={handleClick}>
                    <span className={css.month}>{selectedLSX || "Chọn LSX"}</span>
                    <ArrowDropDownIcon/>
                </div>
            </Button>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                sx={{
                    fontSize: '14px',
                    justifyContent: 'center',
                    display: 'flex',
                    fontFamily: 'Roboto Flex, sans-serif',
                }}
            >
                {dataLSX?.map((item, index) => (
                    <MenuItem
                        key={index}
                        sx={{
                            fontSize: '14px',
                            width: 'max-content',
                            justifyContent: 'center',
                            display: 'flex',
                            fontFamily: 'Roboto Flex, sans-serif',
                        }}
                        onClick={() => {
                            handleMenuItemClick(item.code)
                        }}
                    >
                        {item.code}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}

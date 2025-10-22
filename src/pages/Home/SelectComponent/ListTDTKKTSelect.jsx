import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import css from './SelectComponent.module.css';
import {LIST_TD_TKKT} from "../../../Consts/LIST_TD_TKKT.js";

export default function ListTDTKKTSelect({ tdList , selectedTD, setSelectedTD}) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <div className={css.monthSelect} onClick={handleClick}>
                <span className={css.month}>{LIST_TD_TKKT.find(item => item.field == selectedTD).headerName}</span>
                <ArrowDropDownIcon/>
            </div>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                sx={{
                    alignItems: 'center', maxHeight: '500px',
                }}
            >
                {tdList?.map((item, index) => (
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
                            setSelectedTD(item.field);
                            handleClose();
                        }}
                    >
                        {item.headerName}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}

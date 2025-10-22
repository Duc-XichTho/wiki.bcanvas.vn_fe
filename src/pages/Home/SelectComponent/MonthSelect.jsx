import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import css from './SelectComponent.module.css';
import {MyContext} from "../../../MyContext.jsx";
import {useContext} from "react";

export default function MonthSelect() {
    const {currentMonthKTQT, setCurrentMonthKTQT} = useContext(MyContext);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
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
                    {/*<img src={MonthIcon} alt="" style={{ width: '20px', height: '20px', marginRight: '3px', color: '#1976d2' }}/>*/}
                    <span className={css.month}>Tháng&nbsp;</span>
                    <span className={css.month}>{currentMonthKTQT}</span>
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
                {Array.from({length: 12}, (_, index) => (
                    <MenuItem
                        key={index}
                        sx={{
                            fontSize: '16.5px',
                            width: '100px',
                            justifyContent: 'center',
                            display: 'flex',
                            fontFamily: 'Roboto Flex, sans-serif',
                        }}
                        onClick={() => {
                            setCurrentMonthKTQT(index + 1);
                            handleClose();
                        }}
                    >
                        {`Tháng ${index + 1}`}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}


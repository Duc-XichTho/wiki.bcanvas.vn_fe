import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import css from './SelectComponent.module.css';

export default function MonthSelectBatDau({startMonth, setStartMonth}) {
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
                <span className={css.month}>Tháng&nbsp;</span>
                <span className={css.month}>{startMonth}</span>
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
                sx={{alignItems: 'center'}}
            >
                {Array.from({length: 12}, (_, index) => (
                    <MenuItem
                        key={index}
                        sx={{
                            fontSize: '14px',
                            width: '100px',
                            justifyContent: 'center',
                            display: 'flex',
                            fontFamily: 'Roboto Flex, sans-serif',
                        }}
                        onClick={() => {
                            setStartMonth(index + 1);
                            handleClose();
                        }}
                    >
                        {`Tháng ${index + 1}`}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}

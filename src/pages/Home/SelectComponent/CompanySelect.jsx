import * as React from 'react';
import {useContext, useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {getAllCompany} from "../../../apis/companyService.jsx";
import { ChevronDown } from 'lucide-react';
import css from './SelectComponent.module.css';
import {MyContext} from "../../../MyContext.jsx";
import {CompanyIcon} from "../../../icon/IconSVG.js";
import styles from '../../../components/gateway/Header/header.module.css';

export default function CompanySelect() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const {selectedCompany, setSelectedCompany,  listCompany, setListCompany, fetchAllCompany} = useContext(MyContext)

    useEffect(() => {
        if (listCompany.length === 0){
            fetchAllCompany().then(data => {
                const validCompanies = data.filter(val => val.name && val.name.trim() !== '');
                if (validCompanies.length > 0) {
                    setListCompany(validCompanies);
                    setSelectedCompany(validCompanies[0].name);
                }
            }).catch(error => {
                console.error("Error fetching companies:", error);
            });
        }

    }, []);


    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (name) => {
        handleClose();
        setSelectedCompany(name);
    };

    return (
        <div>
            <Button
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{ color: '#454545', textTransform: 'none' }}
            >
                <div className={css.navbarSelect}>
                    <span>Công ty {selectedCompany || listCompany[0]?.name}</span>
                    {/*<ChevronDown size={16}/>*/}
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
                {listCompany.map(item => (
                    <MenuItem style={{fontSize: '0.9rem'}} key={item.id}
                              onClick={() => handleMenuItemClick(item.code)}>{item.name}</MenuItem>
                ))}

            </Menu>
        </div>
    );
}

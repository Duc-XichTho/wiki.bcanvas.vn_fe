
import React, { useState, useEffect, useRef } from 'react';
import { IoGridOutline } from 'react-icons/io5';
import {IoGridOutlineIcon} from "../../../../image/IconSVG.js";

const SelectableComponent = () => {
    const [isSelected, setIsSelected] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const handleIconClick = () => {
        setIsSelected(!isSelected);
        setShowDropdown(!showDropdown);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="dropdown-container" ref={dropdownRef}>
            <img src={IoGridOutlineIcon}
                 onClick={handleIconClick}
                 className="icon-dropdown"
            />
            {showDropdown && (
                <div className="dropdown-menu">
                    <div className="dropdown-item">SAB Wiki</div>
                    <div className="dropdown-item">Kho dữ liệu quản trị</div>
                    <div className="dropdown-item">Quản lý Process</div>
                </div>
            )}
        </div>
    );
};

export default SelectableComponent;


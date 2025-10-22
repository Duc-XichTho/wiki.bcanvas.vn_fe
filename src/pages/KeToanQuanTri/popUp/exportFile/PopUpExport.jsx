import React from "react";
import { Menu, MenuItem } from "@mui/material";
import { exportToXlsx, exportToCsv } from "./exportHelper";
import { BsFiletypeCsv, BsFiletypeXls } from "react-icons/bs";

const PopUpExport = ({ anchorEl, open, onClose, api, columnApi, table, setDropdownOpen}) => {
  const handleExportExcel = () => {
    exportToXlsx(api, columnApi, table);
    onClose();
    setDropdownOpen(false)
  };

  const handleExportCsv = () => {
    exportToCsv(api, columnApi, table);
    onClose();
    setDropdownOpen(false)
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <MenuItem onClick={handleExportExcel}>
        <BsFiletypeXls size={20} style={{ marginRight: 8 }} />
        <span style={{ fontSize: 15 }}>Excel</span>
      </MenuItem>
      <MenuItem onClick={handleExportCsv}>
        <BsFiletypeCsv size={20} style={{ marginRight: 8 }} />
        <span style={{ fontSize: 15 }}>CSV</span>
      </MenuItem>
    </Menu>
  );
};

export default PopUpExport;

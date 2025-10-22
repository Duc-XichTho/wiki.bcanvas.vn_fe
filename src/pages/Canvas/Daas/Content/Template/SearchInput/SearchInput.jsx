import React from "react";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";

const SearchInput = ({ handleFilterTextBoxChanged }) => {
  return (
    <Paper
      component="form"
      sx={{ display: "flex", alignItems: "center", width: 200, marginLeft: '10px' }}
    >
      <IconButton type="button" sx={{ p: "4px" }} aria-label="search">
        <SearchIcon />
      </IconButton>
      <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Tìm kiếm..."
        id="filter-text-box"
        onChange={handleFilterTextBoxChanged}
      />
    </Paper>
  );
};

export default SearchInput;

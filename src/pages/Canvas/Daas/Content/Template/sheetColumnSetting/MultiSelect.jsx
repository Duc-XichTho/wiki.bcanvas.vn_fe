import React, { useState, useEffect } from "react";
// MUI
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
// API
import { getAllUser } from "../../../../../../apis/userService";
import { getTableByid } from "../../../../../../apis/templateSettingService";

export default function MultiSelect({ id, value, label, onChange }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        await getTableByid(id).then(async (table) => {
          if (!table.viewer.restricted) {
            await getAllUser().then((data) => {
              setUsers(data);
            });
          } else {
            let users = [];
            table.viewer.users.forEach((user) => {
              users.push({ email: user });
            });
            setUsers(users);
          }
        });
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = async (event) => {
    const {
      target: { value },
    } = event;
    onChange(typeof value === "string" ? value.split(",") : value);
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
      <InputLabel id="cai-dat-duyet-label">{label}</InputLabel>
      <Select
        labelId="cai-dat-duyet-label"
        id="cai-dat-duyet-select"
        multiple
        value={value}
        onChange={handleChange}
        label="Cài đặt duyệt"
        renderValue={(selected) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} size="small" />
            ))}
          </Box>
        )}
        sx={{
          "& .MuiSelect-select": {
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            alignItems: "center",
            p: 1,
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.23)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.87)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "primary.main",
          },
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 48 * 4.5 + 8,
              width: 250,
            },
          },
        }}
      >
        {users.map((user) => (
          <MenuItem key={user.email} value={user.email}>
            {user.email}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

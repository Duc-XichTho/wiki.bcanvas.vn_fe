import React, {useState, useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import css from "../DanhMuc/KeToanQuanTri.module.css";
import {OffBookMarkIcon, OnBookMarkIcon} from "../../../../icon/IconSVG.js";
import {getItemFromIndexedDB, setItemInIndexedDB} from "../../../../storage/storageService.js";
import {IconButton} from "@mui/material";
import Menu from "@mui/material/Menu";
import {Button, Typography} from "antd";

export default function ActionKetChuyen({open, anchorEl, handleClick, handleCreateToSKT, handleClose}) {

    return (
        <>
            <div className={`${css.headerActionButton} ${css.buttonOn}`} onClick={handleClick}>
                <span>Kết chuyển</span>
            </div>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                sx={{alignItems: 'center', top: '5px'}}
            >
                <div style={{
                    width: '250px',
                    height: '50px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: "center",
                }}>
                    <Typography>Bạn có muốn kết chuyển không?</Typography>
                </div>

                <div
                    style={{
                        width: '250px',
                        height: '30px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '20px',
                    }}
                >
                    <Button
                        type="text"
                        style={{
                            color: '#d32f2f',
                            fontSize: '14px',
                            fontWeight: '500',
                            padding: '0',
                        }}
                        onClick={handleCreateToSKT}
                    >
                        KẾT CHUYỂN
                    </Button>
                    <Button
                        type="text"
                        style={{
                            color: '#1976d2',
                            fontSize: '14px',
                            fontWeight: '500',
                            padding: '0',
                        }}
                        onClick={handleClose}
                    >
                        HỦY
                    </Button>
                </div>

            </Menu>

        </>
    );
}

import * as React from 'react';
import Button from '@mui/material/Button';
import {useNavigate} from "react-router-dom";
import {DauKyHeaderIcon, YearHeaderIcon} from "../../../icon/IconSVG.js";
import css from "./SelectComponent.module.css";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function KhaiBaoDauKy() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate()

    const khaiBaoDauKy = () => {
        navigate("/accounting/khai-bao/dau-ky")
    };

    return (
        <div>
            <Button
                id="basic-button"
                aria-controls={'basic-menu'}
                aria-haspopup="true"
                aria-expanded={'true'}
                onClick={khaiBaoDauKy}
                sx={{color: '#454545', textTransform: 'none'}}
            >
                <div className={css.navbarSelect}>
                    {/*<img src={DauKyHeaderIcon} alt=""/>*/}
                    <span> KHAI BÁO ĐẦU KỲ</span>
                </div>

            </Button>
        </div>
    );
}

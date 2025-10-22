import React, {useState} from "react";
import {IconButton} from "@mui/material";
import {UploadIcon} from "../../../icon/IconSVG.js";
import UploadFileFormDialog from "./UploadFileFormDialog.jsx";

const UploadFileForm = (props) => {
    const [isDialogShow, setIsDialogShow] = useState(false);

    function handleClick() {
        setIsDialogShow(true)
    }

    const handleDialogClose = () => {
        setIsDialogShow(false);
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '25px'
        }}>

            <IconButton onClick={() => handleClick()}
            >
                <img style={{height : '28px'}} src={UploadIcon} alt=""/>
            </IconButton>

            <UploadFileFormDialog
                open={isDialogShow}
                onClose={handleDialogClose}
                id={props.id}
                table={props.table}
                style={{fontSize: 15}}
                onGridReady={props.onGridReady}
            />

        </div>

    )
};

export default UploadFileForm;

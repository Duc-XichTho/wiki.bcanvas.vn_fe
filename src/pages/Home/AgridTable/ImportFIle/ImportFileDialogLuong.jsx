import { Dialog } from "@mui/material";
import FileImportComponent from "./ImportFileLuong.jsx";
import {useEffect, useState} from "react";

const ImportFileDialogLuong = ({ open, onClose, apiUrl, onFileImported, onGridReady,anchorEl, table, company }) => {
    const [fileSelected, setFileSelected] = useState(false);

    const handleFileSelected = () => {
        setFileSelected(true);
    };
    useEffect(() => {
        if(anchorEl == null || anchorEl === false)
        {
            setFileSelected(false);
        }

        }, [anchorEl]);
    return (
        <Dialog open={open} onClose={onClose} {...(fileSelected ? { fullWidth: true, maxWidth: "xl" } : {maxWidth: "lg", fullWidth: false})}>
            <FileImportComponent
                apiUrl={apiUrl}
                onFileImported={onFileImported}
                onClose={onClose}
                onGridReady={onGridReady}
                onFileSelected={setFileSelected}
                table={table}
                company={company}
            />
        </Dialog>
    );
};

export default ImportFileDialogLuong;
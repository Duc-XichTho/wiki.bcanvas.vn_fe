import { Dialog } from "@mui/material";
import FileImportComponent from "./ImportFile.jsx";
import {useEffect, useState} from "react";

const ImportFileDialog = ({ open, onClose, apiUrl, onFileImported, onGridReady,anchorEl, table, company, section, sktType}) => {
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
    switch (table){
        case 'du_kien_thu_chi':
            return (
                <>
                    {/*<Dialog open={open} onClose={onClose} {...(fileSelected ? { fullWidth: true, maxWidth: "xl" } : {maxWidth: "lg", fullWidth: false})}>*/}
                    {/*    <ImportDKTC*/}
                    {/*        apiUrl={apiUrl}*/}
                    {/*        onFileImported={onFileImported}*/}
                    {/*        onClose={onClose}*/}
                    {/*        onGridReady={onGridReady}*/}
                    {/*        onFileSelected={setFileSelected}*/}
                    {/*        table={table}*/}
                    {/*        section={section}*/}
                    {/*    />*/}
                    {/*</Dialog>*/}
                </>

            )
        default:
            return (
                <Dialog open={open}
                        onClose={(event, reason) => {
                            if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
                                onClose(event, reason);
                            }
                        }}

                        {...(fileSelected ? { fullWidth: true, maxWidth: "xl" } : {maxWidth: "lg", fullWidth: false})}>
                    <FileImportComponent
                        apiUrl={apiUrl}
                        onFileImported={onFileImported}
                        onClose={onClose}
                        onGridReady={onGridReady}
                        onFileSelected={setFileSelected}
                        table={table}
                        company={company}
                        sktType={sktType?sktType:null}
                    />
                </Dialog>
            );
    }

};

export default ImportFileDialog;
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import FileUpload from "./popUpDinhKem/FileUpload.jsx";

const UploadFileDialog = ({ open, onClose, id, table, onGridReady  , card}) => {

    // const handleFileAction = () => {
    //     // Update the file state
    //     setFileUpdate(prev => !prev);
    // };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle style={{ fontSize: 15 }}>Danh sách tài liệu</DialogTitle>
            <DialogContent dividers>
                    <FileUpload id={id} table={table} onGridReadyTo={onGridReady} card={card} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} style={{ fontSize: 15 }}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default UploadFileDialog;

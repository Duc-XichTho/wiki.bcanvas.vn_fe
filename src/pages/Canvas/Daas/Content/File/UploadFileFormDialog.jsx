import { Dialog } from "@mui/material";
import UploadFilePWS from "./UploadFilePWS.jsx";

const UploadFileFormDialog = ({ open, onClose, id, table, onGridReady }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth={false} // Do not force full width
            maxWidth="md" // Adjust width based on your need (can also be 'sm' or 'xs')
            PaperProps={{
                style: {
                    maxHeight: '90vh', // Set a max height to prevent it from going out of view
                    overflow: 'auto', // Allow scrolling for long content
                },
            }}
        >
            <UploadFilePWS
                open={open}
                onClose={onClose}
                id={id}
                table={table}
                onGridReady={onGridReady}
                style={{ fontSize: 15 }}
            />
        </Dialog>
    );
};

export default UploadFileFormDialog;

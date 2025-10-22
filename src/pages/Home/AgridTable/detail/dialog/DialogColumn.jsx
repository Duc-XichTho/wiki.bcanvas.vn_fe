import React, {useState} from 'react';
import {Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography} from '@mui/material';
import DetailColumn from "../view/DetailColumn.jsx";

const DialogColumn = ({selectedRow, open, onClose}) => {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
            <DialogContent>
                <DetailColumn selectedRow={selectedRow}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DialogColumn;

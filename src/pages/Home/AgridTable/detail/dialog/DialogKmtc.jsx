import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';
import KmtcDataTable from "../view/KmtcDataTable.jsx";

const DialogKmtc  = ({ open, onClose , headerTitle }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle style={{color: '#1C77E7', fontSize: 23, fontWeight: 'bold',  }}>Khoản mục thu chi</DialogTitle>
      <DialogContent dividers>
        <KmtcDataTable headerTitle={headerTitle} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} style={{ fontSize: 15 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogKmtc;

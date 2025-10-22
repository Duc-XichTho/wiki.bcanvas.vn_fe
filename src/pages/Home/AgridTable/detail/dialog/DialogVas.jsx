import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import VasDataTable from "../view/VasDataTable.jsx";

const DialogVas  = ({ open, onClose , headerTitle }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle style={{color: '#1C77E7', fontSize: 23, fontWeight: 'bold',  }}>Tài khoản kế toán</DialogTitle>
      <DialogContent dividers>
        <VasDataTable headerTitle={headerTitle} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} style={{ fontSize: 15 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogVas;

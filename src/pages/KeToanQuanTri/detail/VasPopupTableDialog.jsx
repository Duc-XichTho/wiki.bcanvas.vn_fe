import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import VasDataTable from "./VasDataTable.jsx";

const VasPopupTableDialog  = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle style={{color: '#454545', fontSize: 23, fontWeight: 'bold',  }}>Tài khoản kế toán</DialogTitle>
      <DialogContent dividers>
        <VasDataTable />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} style={{ fontSize: 15 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VasPopupTableDialog;

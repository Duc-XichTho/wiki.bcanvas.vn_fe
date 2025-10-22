import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import DetailKhoaSo from './DetailKhoaSo';

const PopupKhoaSo = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle style={{ fontSize: 15, fontWeight: 'bold' }}>Khóa Sổ</DialogTitle>
      <DialogContent dividers>
        {/* <div className="detail-planning"> */}
        {/* <DetailKhoaSo month={6} /> */}
        <DetailKhoaSo month={12} />
        {/* </div> */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} style={{ fontSize: 15 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PopupKhoaSo;

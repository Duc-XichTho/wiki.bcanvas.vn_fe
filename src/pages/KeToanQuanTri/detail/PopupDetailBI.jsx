import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import BaoCaoKQKDFS from '../sheets/BaoCao/BaoCaoKQKDFS';
import BaoCaoPBDV from '../sheets/BaoCao/KQKD/DV/BaoCaoPBDV.jsx';
import BaoCaoPBSP from '../sheets/BaoCao/KQKD/SP/BaoCaoPBSP.jsx';

const PopUpCellActionBI = ({ open, onClose, type }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle style={{ fontSize: 15 }}></DialogTitle>
      <DialogContent dividers>
        {type === 'TQ' && <BaoCaoKQKDFS show={true} isFullView={false} isShowAll={false} />}
        {type === 'SP' && <BaoCaoPBSP />}
        {type === 'DV' && <BaoCaoPBDV />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} style={{ fontSize: 15 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PopUpCellActionBI;

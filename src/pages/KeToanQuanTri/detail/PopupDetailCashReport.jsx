import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import DetailCashReportTH from './DetailCashReportTH.jsx';
import DetailCashReportKH from './DetailCashReportKH.jsx';

const PopupDetailCashReport = ({ open, onClose, data, field, table, company }) => {
  let month = field.split('_')[0].split('t')[1];
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle style={{ fontSize: 18 }}>
        Chi tiết {data && data.kmf} {data && data.header} tháng {month}
      </DialogTitle>
      <DialogContent dividers>
        {table === 'DetailCashReportTH' ? (
          <DetailCashReportTH header={data && data.header} kmf={data && data.kmf} month={month} company={company}/>
        ) : (
          <DetailCashReportKH header={data && data.header} kmf={data && data.kmf} month={month} company={company}/>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} style={{ fontSize: 15 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PopupDetailCashReport;

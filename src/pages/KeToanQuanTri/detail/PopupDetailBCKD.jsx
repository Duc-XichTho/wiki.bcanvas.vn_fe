import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import DetailBCKDTH from './DetailBCKDTH.jsx';
import DetailBCKDDV from './DetailBCKDDV.jsx';
import DetailBCKDDA from './DetailBCKDDA.jsx';
import DetailBCKDSP from './DetailBCKDSP.jsx';
import DetailBCKDNhomSP from './DetailBCKDNhomSP.jsx';
import DetailBCKDNhom from './DetailBCKDNhom.jsx';
import DetailBCKDNhomDV from './DetailBCKDNhomDV.jsx';
import DetailBCKDNhomVV from './DetailBCKDNhomVV.jsx';
import DetailBCKDVV from './DetailBCKDVV.jsx';
import DetailBCKDK from './DetailBCKDK.jsx';

const PopupDetailBCKD = ({open, onClose, data, field, type, company, view, currentYear, plType}) => {
    let [unit, month] = field.split('_');
    month = month ? month : field;
    function renderTitle() {
        let title = `Chi tiết`;
        try {
            if (data) {
                if (data.header) title += ` ${data && data.header}`;
                if (data.dp) title += ` ${data && data.dp}`;
            }
            if (month == 0) title += ` năm ${currentYear}`
            else title += ` tháng ${month}`
        } catch (e) {
            console.log(e)
        }
        return title
    }
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
            <DialogTitle style={{fontSize: 18}}>
                {renderTitle()}
            </DialogTitle>
            <DialogContent dividers>
                {type === 'TQ' && <DetailBCKDTH kmf={data && data.kmf} month={field} company={company} currentYear={currentYear} plType={plType} />}
                {type === 'DV' && <DetailBCKDDV kmf={data && data.kmf} field={field} company={company} currentYear={currentYear}/>}
                {type === 'CT' && <DetailBCKDDA kmf={data && data.kmf} field={field} company={company} currentYear={currentYear}/>}
                {type === 'SP' && <DetailBCKDSP kmf={data && data.kmf} field={field} company={company} currentYear={currentYear} />}
                {type === 'VV' && <DetailBCKDVV kmf={data && data.kmf} field={field} company={company} currentYear={currentYear} />}
                {type === 'K' && <DetailBCKDK plType={plType} kmf={data && data.kmf} field={field} company={company} data={data} viewB={view} currentYear={currentYear} />}
                {type === 'NSP' && <DetailBCKDNhomSP plType={plType} kmf={data && data.kmf} field={field} company={company} data={data} viewB={view} currentYear={currentYear}/>}
                {type === 'NDV' && <DetailBCKDNhomDV plType={plType} kmf={data && data.kmf} field={field} company={company} currentYear={currentYear}/>}
                {type === 'NDV2' && <DetailBCKDNhomDV plType={plType} kmf={data && data.kmf} field={field && field.includes('-') ? field.split('-').slice(1).join('-') : field} company={company} currentYear={currentYear}/>}
                {type === 'NH' && <DetailBCKDNhom kmf={data && data.kmf} field={field} company={company} currentYear={currentYear}/>}
                {type === 'NVV' && <DetailBCKDNhomVV plType={plType}  kmf={data && data.kmf} field={field} company={company} data={data} viewB={view} currentYear={currentYear}/>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} style={{fontSize: 15}}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PopupDetailBCKD;

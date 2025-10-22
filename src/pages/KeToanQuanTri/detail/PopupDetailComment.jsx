import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';
import DetailBCKDTH from "./DetailBCKDTH.jsx";

const PopupDetailComment = ({open, onClose, data, field}) => {
    let [team, month] = field.split('_');
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogContent dividers>
                    <DetailBCKDTH kmf={data && data.kmf} month={month}
                                        business_unit={team}/>
            </DialogContent>
        </Dialog>
    );
}

export default PopupDetailComment;
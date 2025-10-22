import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';
import CoChePhanBoVuViec from "../../CCPB/ThePhanBo/CoChePhanBoVuViec.jsx";
import css from "../../DanhMuc/KeToanQuanTri.module.css";
import React, {useState} from "react";
import {GV3M_TITLE, GV3W_TITLE} from "../../../../../Consts/TITLE_HEADER.js";
import CoChePhanBoLenhSX from "../../CCPB/ThePhanBo/CoChePhanBoLenhSX.jsx";

const DialogThePhanBo = ({open, onClose, headerTitle}) => {
    const [showFormAdd, setShowFormAdd] = useState(false);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
            <DialogTitle>
                <div className={css.headerPowersheet}>
                    <div className={css.headerTitle}>
                        <span>Thẻ phân bổ theo {headerTitle === GV3M_TITLE ? 'Lệnh sản xuất' : 'Vụ việc'}</span>
                    </div>
                    <div className={css.headerAction}>
                        <div className={`${css.headerActionButton} ${css.buttonOn}`}
                             onClick={() => setShowFormAdd(true)}
                        >
                            <span> Thêm mới</span>
                        </div>
                    </div>
                </div>
            </DialogTitle>
            <DialogContent dividers style={{overflow: 'scroll'}}>
                {headerTitle === GV3W_TITLE && <CoChePhanBoVuViec headerTitle={headerTitle} showFormAdd={showFormAdd}
                                                                  setShowFormAdd={setShowFormAdd}/>}
                {headerTitle === GV3M_TITLE && <CoChePhanBoLenhSX headerTitle={headerTitle} showFormAdd={showFormAdd}
                                                                  setShowFormAdd={setShowFormAdd}/>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} style={{fontSize: 15}}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DialogThePhanBo;

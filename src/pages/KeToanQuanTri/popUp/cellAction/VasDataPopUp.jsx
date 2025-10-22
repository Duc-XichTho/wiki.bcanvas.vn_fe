import React, {useState} from 'react';
import './popCellUpAction.css';
import VasPopupTableDialog from "../../detail/VasPopupTableDialog.jsx";
import css from "../../BaoCao/BaoCao.module.css";
import { Button } from 'antd';

const VasDataPopup = () => {
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    const handleButtonClick = () => {
        setIsDetailDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDetailDialogOpen(false);
    };

    return (
        <>
            <div className={`${css.headerActionButton}`}
                 onClick={handleButtonClick}>
                <Button className={css.customButton}>
                    <span>Thiết lập cân đối tài chính</span>

                </Button>
            </div>
            {isDetailDialogOpen && (
                <VasPopupTableDialog
                    open={isDetailDialogOpen}
                    onClose={handleDialogClose}
                />
            )}
        </>
    );
};

export default VasDataPopup;

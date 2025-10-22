import React, {useState} from 'react';
import ImportFileDialogLuong from "./ImportFileDialogLuong.jsx";

const ImportBtnLuong = (props) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleButtonClick = (event) => {
        setAnchorEl(event.currentTarget);

    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'start', height: '100%'  }}>
            <button
                className="new-button dropdown-item-button1"
                onClick={handleButtonClick}
                aria-label="Export"
            >
               <span> Import </span>
            </button>
            <ImportFileDialogLuong
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                apiUrl = {props.apiUrl}
                onFileImported={props.onFileImported}
                setSelectedReport={props.setSelectedReport}
                onGridReady={props.onGridReady}
                businessUnit={props.businessUnit}
                table={props.table}
                company={props.company}
            />
        </div>
    );
};

export default ImportBtnLuong;

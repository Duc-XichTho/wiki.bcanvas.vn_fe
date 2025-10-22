import React, {useState} from "react";
import PopUpExport from "./PopUpExport.jsx";
import css from './exportTableGrid.module.css'

const ExportableGrid = (props) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleButtonClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "start",
                height: "100%",
                width: "max-content"
            }}
        >
            <button
                onClick={handleButtonClick}
                className={`${css.export} ${css.dropdownItem}`}
                aria-label="Export"
            >
                <span>Xuất file</span>
            </button>
            {
                (props.isSortByDay == true || props.isSortByDay == false) &&
                <>
                    <button className={`${css.export} ${css.dropdownItem}`}
                            onClick={() => props.handleCreateNoiBo()}>
                        <span> Tạo bút toán nội bộ</span>
                    </button>
                    <button className={`${css.export} ${css.dropdownItem}`}
                            onClick={() => props.handleSortByDay(true)}>
                        <span>Sắp xếp theo ngày tạo</span>
                    </button>
                    <button className={`${css.export} ${css.dropdownItem}`}
                            onClick={() => props.handleSortByDay(false)}>
                        <span>Sắp xếp theo ngày nhập</span>
                    </button>

                </>
            }

            <PopUpExport
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                api={props.api}
                columnApi={props.columnApi}
                table={props.table}
            />
        </div>
    );
};

export default ExportableGrid;

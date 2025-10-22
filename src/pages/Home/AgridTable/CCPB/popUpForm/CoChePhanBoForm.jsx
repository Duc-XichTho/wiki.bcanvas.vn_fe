import {toast} from 'react-toastify';
import React, {useMemo, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {AiOutlineDelete} from 'react-icons/ai';
import Button from '@mui/material/Button';
import {Modal} from 'antd';
// Ag Grid Function
import AG_GRID_LOCALE_VN from '../../locale.jsx';
import {AgGridReact} from 'ag-grid-react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import '../../agComponent.css';
import css from './CoChePhanBoForm.module.css';
import TextField from '@mui/material/TextField';
import {CardCodeIcon} from "../../../../../icon/IconSVG.js";
import {createNewCCPB} from "../../../../../apis/ccpbService.jsx";
import {formatMoney} from "../../../../../generalFunction/format.js";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const CoChePhanBoForm = ({company, onClose, fetchAllCoCauPhanBo, listChoose, typeCCPB, showFormAdd}) => {
    const [moTa, setMoTa] = useState('');
    const [ten, setTen] = useState('');
    const [rowData, setRowData] = useState([]);
    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            suppressMenu: true,

        };
    }, []);

    const handleAddRow = () => {
        if (rowData.length < listChoose.length) {
            const newRow = {
                ten_don_vi: null,
                ty_le: null
            };

            setRowData((prevRowData) => [...prevRowData, newRow]);
        } else {
            toast.warn(`Vượt quá số lượng ${typeCCPB}`);
        }
    };

    const handleDeleteRow = (params) => {
        const rowIndex = params.rowIndex;
        setRowData((prevRowData) => prevRowData.filter((_, index) => index !== rowIndex));
    };

    const handleSave = async () => {
        try {
            const newRowData = {
                company: company,
                name: ten,
                PB: rowData,
                type: typeCCPB,
                dp1: moTa,
                dp2: '0',
            };
            await createNewCCPB(newRowData);
            await fetchAllCoCauPhanBo();
            toast.success('Tạo thành công.');
            onClose();
        } catch (error) {
            console.log(error);
        }
    };

    const getAvailableSelect = (currentRowIndex) => {
        const selectedUnits = rowData
            .filter((_, index) => index !== currentRowIndex)
            .map((row) => row.ten_don_vi);

        return listChoose
            .map((unit) => unit.code)
            .filter((code) => !selectedUnits.includes(code));
    };

    const columnDefs = useMemo(
        () => [
            {
                field: 'ten_don_vi',
                headerName: `Tên ${typeCCPB}`,
                width: 220,
                cellEditor: 'agRichSelectCellEditor',
                cellEditorParams: (params) => ({
                    values: getAvailableSelect(params.rowIndex),
                }),
            },{
                field: `ty_le`,
                headerName: `Tỷ lệ`,
                width: 130,
                editable: true,
                cellStyle: {textAlign: 'right'},
                headerClass: 'ag-right-aligned-header',
                // cellEditor: 'agNumberCellEditor',
                valueFormatter: (params) => formatMoney(params.value),

            },
            {
                pinned: 'left',
                width: 40,
                field: 'action',
                suppressHeaderMenuButton: true,
                cellStyle: {textAlign: 'center', paddingTop: 5},
                headerName: '',
                editable: false,
                cellRenderer: (params) => (
                    <AiOutlineDelete style={{cursor: 'pointer', fontSize: '20px'}}
                                     onClick={() => handleDeleteRow(params)}/>
                ),
            },
        ],
        [rowData, listChoose]
    );

    const [errorMaCoChe, setErrorMaCoChe] = useState(false);
    const [errorMoTa, setErrorMoTa] = useState(false);

    const handleChangeMaCoChe = (e) => {
        const value = e.target.value.toUpperCase();
        setTen(value);

        if (value.trim() === '') {
            setErrorMaCoChe(true);
        } else {
            setErrorMaCoChe(false);
        }
    };

    const handleChangeMoTa = (e) => {
        const value = e.target.value;
        setMoTa(value);

        if (value.trim() === '') {
            setErrorMoTa(true);
        } else {
            setErrorMoTa(false);
        }
    };


    return (
        <Modal
            open={showFormAdd}
            onCancel={onClose}
            footer={null}
            closable={false}
            width={1000}
            style={{ top: "22%", }}
            getContainer={false}

        >
                <div className={css.coChePhanBoContainer}>
                    <div className={css.coChePhanBoPopupBody}>
                        <div className={css.coChePhanBoPopupBodyMaCoChe}>
                            <img src={CardCodeIcon} style={{ width: '27px', height: '37px' }} alt="Add Icon" />
                            <p >Mã thẻ :</p>
                            <TextField
                                error={errorMaCoChe}
                                variant="standard"
                                value={ten}
                                onChange={(e) => handleChangeMaCoChe(e)}
                                InputProps={{
                                    disableUnderline: true,
                                }}
                                placeholder="Mã thẻ"
                                style={{flex : 1}}
                            />
                        </div>
                        <div className={css.coChePhanBoPopupBodyMoTa}>
                            <p>Mô tả :</p>
                            <TextField
                                error={errorMoTa}
                                variant="standard"
                                value={moTa}
                                onChange={(e) => handleChangeMoTa(e)}
                                style={{  flex : 1 }}
                                InputProps={{
                                    disableUnderline: true,
                                }}
                                placeholder="Mô tả"
                            />
                        </div>
                        <div className={css.coChePhanBoPopupBodyAddRow}>
                            <div className={css.navbarItem}>
                                <div className={`${css.headerActionButton} ${css.buttonOn}`} onClick={handleAddRow}>
                                    <span>+ Dòng thẻ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ag-theme-quartz" style={{ height: '300px', width: '100%' }}>
                        <AgGridReact
                            rowData={rowData}
                            columnDefs={columnDefs}
                            localeText={AG_GRID_LOCALE_VN}
                            defaultColDef={defaultColDef}
                        />
                    </div>
                </div>

                <div className={css.footerForm}>
                    <Button variant="contained" onClick={handleSave}>
                        Tạo
                    </Button>
                    <Button variant="outlined" onClick={onClose}>
                        Hủy
                    </Button>
                </div>
        </Modal>
    );
};

export default CoChePhanBoForm;

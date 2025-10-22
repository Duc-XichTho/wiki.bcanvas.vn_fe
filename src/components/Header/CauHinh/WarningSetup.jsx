import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
// AG GRID
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
import AG_GRID_LOCALE_VN from '../../../pages/Home/AgridTable/locale';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
// ANTD
import {Modal, Button, message, Select, Switch} from 'antd';
// API
import {createNewCauHinh, getAllCauHinh, updateCauHinh} from '../../../apis/cauHinhService.jsx';
import {getSettingByType, createSetting, updateSetting} from '../../../apis/settingService.jsx';
//  CONSTANT
import {SETTING_TYPE, SETTING_CHOTSO} from '../../../CONST.js';
import {FIELD_VALUE_CAU_HINH} from '../../../Consts/FIELD_VALUE_CAU_HINH.js';
import {onFilterTextBoxChanged} from "../../../generalFunction/quickFilter.js";
import {MyContext} from "../../../MyContext.jsx";
import {getAllCompany} from "../../../apis/companyService.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {getItemFromIndexedDB} from "../../../storage/storageService.js";
import PopupDeleteAgrid from "../../../pages/Home/popUpDelete/popUpDeleteAgrid.jsx";
import {
    loadColumnState,
    saveColumnStateToLocalStorage
} from "../../../pages/Home/AgridTable/logicColumnState/columnState.jsx";
import {toast} from "react-toastify";
import {createTimestamp} from "../../../generalFunction/format.js";
import {handleSave} from "../../../pages/Home/AgridTable/handleAction/handleSave.js";
import css from "../../../pages/Home/AgridTable/DanhMuc/KeToanQuanTri.module.css";
import {IoIosSearch} from "react-icons/io";
import ActionChangeFilter from "../../../pages/Home/AgridTable/actionButton/ActionChangeFilter.jsx";
import ActionResetColumn from "../../../pages/Home/AgridTable/actionButton/ActionResetColumn.jsx";
import {DeleteFilterIcon} from "../../../icon/IconSVG.js";
import ActionCreate from "../../../pages/Home/AgridTable/actionButton/ActionCreate.jsx";
import ActionSave from "../../../pages/Home/AgridTable/actionButton/ActionSave.jsx";
import {LIST_WARNING} from "../../../Consts/LIST_WARNING.js";

const WarningSetup = ({showCauHinhChotSo, setShowCauHinhChotSo}) => {
    const tableCol = 'CauHinhCol';
    const gridRef = useRef();
    const [colDefs, setColDefs] = useState([]);
    const [settingDataWarning, setSettingDataWarning] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const {loadData,setLoadData} = useContext(MyContext)

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            suppressMenu: true,
            cellStyle: {fontSize: '14.5px'},
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const getData = async () => {
        let settingData = await getSettingByType(SETTING_TYPE.Warning)
        let data = LIST_WARNING
        if (!settingData) {
            settingData = await createSetting({
                type: SETTING_TYPE.Warning,
                setting: data
            });
        } else {
            data = settingData.setting
        }
        setSettingDataWarning(settingData);
        gridRef.current.api.setRowData(data);
    };

    const onGridReady = useCallback(async () => {
        await getData()
    }, []);


    useEffect(() => {
        getData();
    }, [showCauHinhChotSo]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let updatedColDefs = [
                    {
                        field: 'code',
                        headerName: 'Mã',
                        width: 60,
                        editable: false,
                    },
                    {
                        field: 'name',
                        headerName: 'Chú thích',
                        flex: 1
                    },
                    {
                        field: 'type',
                        headerName: 'Kiểu thông báo',
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: ['Cảnh báo', 'Chú ý', 'Thông báo'],
                        },
                        width: 100,
                    },
                    {
                        field: 'check',
                        headerName: 'Cảnh báo',
                        width: 100,
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: ['Có', 'Không'],
                        },
                    },
                    {
                        field: 'min',
                        headerName: 'Min',
                        width: 80,
                    },
                    {
                        field: 'max',
                        headerName: 'Max',
                        width: 80,
                    },

                ];
                setColDefs(updatedColDefs);

            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, []);

    const handleCellValueChanged = async (event) => {
        const updatedRow = event.data;
        if (event.colDef.field === 'field' && (!updatedRow.field || updatedRow.field === '')) {
            updatedRow.value = null
        }
        setUpdatedData(prevData => {
            const existingRowIndex = prevData.findIndex(item => item.id === updatedRow.id);
            if (existingRowIndex !== -1) {
                prevData[existingRowIndex] = updatedRow;
                return [...prevData];
            } else {
                return [...prevData, updatedRow];
            }
        });
    };

    const handleSaveData = async () => {
        let data = settingDataWarning.setting;
        updatedData.forEach(item => {
            let updatedItem = data.find(e => e.code === item.code);
            updatedItem.check = item.check
            updatedItem.value = item.value
            updatedItem.type = item.type
        })
        message.success('Cập nhật thành công!',0.5)
        await updateSetting(settingDataWarning);
        await getData();
        setLoadData(!loadData)
        setUpdatedData([])
    };

    return (
        <>
            <Modal
                title="Cấu hình cảnh báo"
                centered
                open={showCauHinhChotSo}
                onCancel={() => setShowCauHinhChotSo(false)}
                width='50%'
            >

                <div className={css.headerPowersheet}>
                    <div className={css.headerActionFilter}>
                    </div>
                    <div className={css.headerAction}>
                        {updatedData.length >0 && <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>}
                    </div>

                </div>
                <div
                    style={{
                        height: '70vh',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        marginTop: '15px',
                    }}
                >
                    <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                        <AgGridReact
                            statusBar={statusBar}
                            enableRangeSelection={true}
                            ref={gridRef}
                            defaultColDef={defaultColDef}
                            columnDefs={colDefs}
                            rowSelection="multiple"
                            onCellValueChanged={handleCellValueChanged}
                            localeText={AG_GRID_LOCALE_VN}
                            onGridReady={onGridReady}
                            onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                            onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default WarningSetup;

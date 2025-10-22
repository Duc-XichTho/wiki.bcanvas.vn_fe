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
// ANTD
import {message, Modal} from 'antd';
// API
import {createSetting, getSettingByType, updateSetting} from '../../../apis/settingService.jsx';
//  CONSTANT
import {MyContext} from "../../../MyContext.jsx";
import {saveColumnStateToLocalStorage} from "../../../pages/Home/AgridTable/logicColumnState/columnState.jsx";
import {toast} from "react-toastify";
import css from "../../../pages/Home/AgridTable/DanhMuc/KeToanQuanTri.module.css";
import style from "./SetupDKPhieu.module.css";
import ActionSave from "../../../pages/Home/AgridTable/actionButton/ActionSave.jsx";
import {LIST_STEP_TYPE_SETTING_DK} from "../../../Consts/LIST_STEP_TYPE.js";
import {LIST_FIELD_DK} from "../../../Consts/LIST_FIELD_DK.js";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const SetupDKPhieu = ({showCauHinhChotSo, setShowCauHinhChotSo}) => {
    const tableCol = 'SetupDKPhieuCol';
    const gridRef = useRef();
    const [colDefs, setColDefs] = useState([]);
    const [settingDataWarning, setSettingDataWarning] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [selectedPhieu, setSelectedPhieu] = useState(null);
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
        if (selectedPhieu) {
            let settingData = await getSettingByType(selectedPhieu)
            let data = LIST_FIELD_DK
            if (!settingData) {
                settingData = await createSetting({
                    type: selectedPhieu,
                    setting: data
                });
            } else {
                data = settingData.setting
            }
            setSettingDataWarning(settingData);
            gridRef.current.api.setRowData(data);
        }
    };

    const onGridReady = useCallback(async () => {
        await getData()
    }, []);


    useEffect(() => {
        getData();
    }, [showCauHinhChotSo, selectedPhieu]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let updatedColDefs = [
                    {
                        field: 'field',
                        headerName: 'Mã',
                        width: 120,
                        editable: false,
                    },
                    {
                        field: 'name',
                        headerName: 'Tên trên giao diện',
                        flex: 1
                    },{
                        field: 'hide',
                        headerName: 'Ẩn/Hiện',
                        width: 90,
                        cellRenderer: params => {
                            return params.value ? 'Ẩn' : 'Hiện';
                        },
                        cellEditor: 'agCheckboxCellEditor',
                        valueGetter: params => params.data.hide === true,
                        valueSetter: params => {
                            params.data.hide = params.newValue;
                            return true;
                        },
                    },{
                        field: 'required',
                        headerName: 'Bắt buộc',
                        width: 90,
                        cellRenderer: params => {
                            return params.value ? 'Bắt buộc' : '';
                        },
                        cellEditor: 'agCheckboxCellEditor',
                        valueGetter: params => params.data.required === true,
                        valueSetter: params => {
                            params.data.required = params.newValue;
                            return true;
                        },
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
            let updatedItem = data.find(e => e.field === item.field);
            updatedItem.hide = item.hide
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
                title="Cấu hình định khoản"
                centered
                open={showCauHinhChotSo}
                onCancel={() => setShowCauHinhChotSo(false)}
                onOk={() => setShowCauHinhChotSo(false)}
                width='50%'
            >
                <div className={style.container}>

                    <div className={style.left}>
                        {LIST_STEP_TYPE_SETTING_DK.map(item => (
                            <div className={selectedPhieu === item ? style.selectedItem : ''} onClick={()=> setSelectedPhieu(item)}>{item}</div>
                        ))}
                    </div>
                    {selectedPhieu &&
                        <div className={style.right}>
                            <div className={css.headerPowersheet}>
                                <div className={css.headerActionFilter}>
                                    Cài đặt {selectedPhieu}
                                </div>
                                <div className={css.headerAction}>
                                    {updatedData.length > 0 &&
                                        <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>}
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
                        </div>}
                </div>
            </Modal>
        </>
    );
};

export default SetupDKPhieu;

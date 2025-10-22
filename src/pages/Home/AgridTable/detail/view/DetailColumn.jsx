'use strict';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
// Ag Grid Function
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
import '../../agComponent.css';
import AG_GRID_LOCALE_VN from '../../locale.jsx';

import {toast} from 'react-toastify';
import {filter} from "../../FilterAgrid.jsx";
import PopupDeleteAgrid from "../../../popUpDelete/popUpDeleteAgrid.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import ActionCreate from "../../actionButton/ActionCreate.jsx";
import ActionSave from "../../actionButton/ActionSave.jsx";
import css from "../../DanhMuc/KeToanQuanTri.module.css";
import {getAllKhaiBaoDauKy} from "../../../../../apis/khaiBaoDauKyService.jsx";
import {LIST_TD_TKKT} from "../../../../../Consts/LIST_TD_TKKT.js";
import {handleCreate} from "../../handleAction/handleCreate.js";
import {handleSave} from "../../handleAction/handleSave.js";
import {formatMoney} from "../../../../../generalFunction/format.js";


ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function DetailColumn({selectedRow}) {
    const table = 'DauKy';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [checkColumn, setCheckColumn] = useState(true);
    const dropdownRef = useRef(null);

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            suppressMenu: true,
            cellStyle: {fontSize: '14.5px'},
        };
    });

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const loadData = async () => {
        const data = await getAllKhaiBaoDauKy();
        const filteredData = data.filter(item => item.ma_tk == selectedRow.code);
        setRowData(filteredData);
        setLoading(false);
    };

    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    const onGridReady = useCallback(async () => {
        await loadData()
    }, [selectedRow]);

    useEffect(() => {
        setLoading(true);
        fetchCurrentUser();
        loadData();
    }, [selectedRow]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const filteredColumns = LIST_TD_TKKT.filter(item => selectedRow && selectedRow[item.field] === 'Có');
                if (filteredColumns.length === 0) {
                    setCheckColumn(false);
                    return;
                }

                const tdTkktColumns = await Promise.all(
                    filteredColumns.map(async item => {
                        const apiData = await item.getApi();
                        return [
                            {
                                field: item.field,
                                headerName: item.headerNameMa,
                                width: getMaxWidth(item.headerName),
                                editable: true,
                                ...filter(),
                                cellEditor: 'agRichSelectCellEditor',
                                cellEditorParams: {
                                    allowTyping: true,
                                    filterList: true,
                                    highlightMatch: true,
                                    values: apiData.map(value => value.code),
                                },
                            },
                            {
                                field: `${item.field}_name`,
                                headerName: item.headerName,
                                width: getMaxWidth(`${item.headerName} Name`),
                                editable: false,
                                cellStyle: {textAlign: 'left'},
                                ...filter(),
                                valueGetter: (params) => {
                                    const selectedCode = params.data?.[item.field];
                                    const matchedItem = apiData.find(value => value.code === selectedCode);
                                    return matchedItem ? matchedItem.name : '';
                                },
                            }
                        ];
                    })
                );

                setCheckColumn(true);

                setColDefs([
                    {
                        pinned: 'left',
                        width: 50,
                        field: 'delete',
                        suppressHeaderMenuButton: true,
                        cellStyle: {alignItems: 'center', display: 'flex'},
                        headerName: '',
                        editable: false,
                        cellRenderer: (params) => {
                            if (!params.data || !params.data.id) {
                                return null;
                            }
                            return (
                                <PopupDeleteAgrid
                                    {...params.data}
                                    id={params.data.id}
                                    reload={loadData}
                                    table={table}
                                    currentUser={currentUser}
                                />
                            );
                        },
                    },
                    {
                        field: 'id',
headerName: 'STT',                        pinned: 'left',
                        hide: false,
                        width: 80,
                        ...filter(),
                        editable: false,
                    },
                    {
                        field: 'ma_tk',
                        headerName: 'Tài khoản kế toán',
                        hide: false,
                        width: 180,
                        ...filter(),
                        editable: false,
                    },
                    ...tdTkktColumns.flat(),
                    {
                        field: 'no_dau_ky',
                        headerName: 'Dư nợ đầu kỳ',
                        hide: false,
                        width: 180,
                        ...filter(),
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'co_dau_ky',
                        headerName: 'Dư có đầu kỳ',
                        hide: false,
                        width: 180,
                        ...filter(),
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'net_dau_ky',
                        headerName: 'Net đầu kỳ',
                        width: 180,
                        ...filter(),
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'}, editable: false,
                    },
                ]);
            } catch (error) {
                toast.error(`Error fetching data: ${error.message}`);
            }
        };

        fetchData();
    }, [rowData, selectedRow]); // Cập nhật lại khi rowData hoặc selectedRow thay đổi


    const getMaxWidth = (headerName) => {
        return headerName.length * 15
    };

    const handleAddRow = async () => {
        const newData = {
            ma_tk: selectedRow.code
        };
        await handleCreate(table, newData, currentUser);
        toast.success("Tạo dòng thành công", {autoClose: 1000})
        await loadData()
    };

    const handleCellValueChanged = async (event) => {
        const updatedRow = event.data;
        updatedRow.net_dau_ky = updatedRow.no_dau_ky - updatedRow.co_dau_ky;
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
        try {
            await handleSave(updatedData, table, setUpdatedData, currentUser)
            await loadData()
            toast.success("Cập nhật thành công", {autoClose: 1000})
        } catch (error) {
            console.error("Lỗi khi cập nhật dữ liệu", error);
        }
    };

    return (
        <>
            <div className={css.headerPowersheet}>
                <div className={css.headerTitle}>
                    <span>Khai báo đầu kỳ</span>
                </div>
                <div className={css.headerAction}>
                    {checkColumn && <>
                        <ActionCreate handleAddRow={handleAddRow}/>
                        <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>
                    </>
                    }
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
                {loading && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            position: 'absolute',
                            width: '100%',
                            zIndex: '1000',
                            backgroundColor: 'rgba(255, 255, 255, 0.96)',
                        }}
                    >
                        <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>
                    </div>
                )}
                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        ref={gridRef}
                        rowData={rowData}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        onCellValueChanged={handleCellValueChanged}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                    />
                </div>
            </div>
        </>
    );
}

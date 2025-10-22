'use strict';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
// Ag Grid Function
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
import '../agComponent.css';
import AG_GRID_LOCALE_VN from '../locale.jsx';

import {toast} from 'react-toastify';
import {handleSave} from "../handleAction/handleSave.js";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import {formatMoney} from "../../../../generalFunction/format.js";
import {getAllTaiKhoan} from "../../../../apis/taiKhoanService.jsx";
import css from "./KeToanQuanTri.module.css";
import ActionSave from "../actionButton/ActionSave.jsx";
import {EllipsisIcon} from "../../../../icon/IconSVG.js";
import ExportableGrid from "../exportFile/ExportableGrid.jsx";
import {onFilterTextBoxChanged} from "../../../../generalFunction/quickFilter.js";
import {getItemFromIndexedDB} from "../../../../storage/storageService.js";
import {loadColumnState, saveColumnStateToLocalStorage} from "../logicColumnState/columnState.jsx";
import {LIST_TD_TKKT} from "../../../../Consts/LIST_TD_TKKT.js";
import DialogColumn from "../detail/dialog/DialogColumn.jsx";
import ActionResetColumn from "../actionButton/ActionResetColumn.jsx";
import ActionSearch from "../actionButton/ActionSearch.jsx";
import ActionChangeFilter from "../actionButton/ActionChangeFilter.jsx";
import ActionClearFilter from "../actionButton/ActionClearAllFilter.jsx";
import {Dau_Ky} from "../../../../Consts/TITLE_HEADER.js";
import ActionBookMark from "../actionButton/ActionBookMark.jsx";
import {MyContext} from "../../../../MyContext.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function DauKy() {
    const headerTitle = Dau_Ky;
    const table = 'DauKy';
    const tableCol = 'DauKyCol';
    const tableFilter = 'DauKyFilter';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [showClearFilter, setShowClearFilter] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [checkColumn, setCheckColumn] = useState(true);
    const {  currentYear , selectedCompany } = useContext(MyContext)
    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            isStatusFilter: storedSettings?.isStatusFilter ?? false,
        };
    };

    const [isStatusFilter, setIsStatusFilter] = useState(getLocalStorageSettings().isStatusFilter);


    useEffect(() => {
        const tableSettings = {
            isStatusFilter
        };

        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isStatusFilter]);

    const handleChangeStatusFilter = () => {
        setIsStatusFilter((prev) => {
            return !prev;
        });
    };

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

    const loadData = async () => {
        let data = await getAllTaiKhoan();
        data = data.filter(e => e.company == selectedCompany);
        if (currentYear !== 'toan-bo') {
            data = data.filter(e => e.year == currentYear);
        }
        data.forEach((row) => {
            row.net_dau_ky = row.no_dau_ky - row.co_dau_ky;
        })
        const savedFilters = sessionStorage.getItem(tableFilter);
        const filters = JSON.parse(savedFilters);
        if (gridRef.current && gridRef.current.api) {
            if (savedFilters) {
                gridRef.current.api.setRowData(data);
                gridRef.current.api.setFilterModel(filters);
            } else {
                gridRef.current.api.setRowData(data);
            }
        } else {
            console.warn('Grid chưa được khởi tạo hoặc gridRef.current là null');
        }
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
    }, []);


    useEffect(() => {
        setLoading(true);
        fetchCurrentUser();
        loadData();
    }, [currentYear , selectedCompany]);

    function filter() {
        if (isStatusFilter) {
            return {
                filter: 'agMultiColumnFilter',
                floatingFilter: true,
                filterParams: {
                    filters: [
                        {
                            filter: 'agTextColumnFilter',
                        },
                        {
                            filter: 'agSetColumnFilter',
                        },
                    ],
                },
            };
        }
    }


    useEffect(() => {
        const fetchData = async () => {
            try {
                const savedColumnState = await getItemFromIndexedDB(tableCol) || []
                let updatedColDefs = [

                    {
                        pinned: 'left',
                        field: 'id',
                        headerName: 'STT',
                        hide: false,
                        width: 80,
                        ...filter(),
                        editable: false,
                    },
                    {
                        field: '',
                        headerName: '',
                        width: 142,
                        ...filter(),
                        cellRenderer: customCellRenderer
                    },
                    {
                        field: 'year',
                        headerName: 'Năm',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'code',
                        headerName: 'Mã tài khoản',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên tài khoản',
                        width: 200,
                        ...filter(),
                    },
                    {
                        field: 'cap',
                        headerName: 'Cấp',
                        width: 50,
                        ...filter(),
                    },
                    {
                        field: 'no_dau_ky',
                        headerName: 'Nợ đầu kỳ',
                        width: 110,
                        ...filter(),
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'co_dau_ky',
                        headerName: 'Có đầu kỳ',
                        width: 110,
                        ...filter(),
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'net_dau_ky',
                        headerName: 'Net đầu kỳ',
                        width: 110,
                        ...filter(),
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'tinh_chat',
                        headerName: 'Tính chất',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'khoan_muc_theo_doi',
                        headerName: 'Khoản mục theo dõi',
                        width: 150,
                        ...filter(),
                    },
                    ...LIST_TD_TKKT.map(item => ({
                        field: item.field,
                        headerName: item.headerName,
                        width: getMaxWidth(item.headerName),
                        editable: false,
                        ...filter(),
                        valueFormatter: (params) => {
                            return params.value === 'Có' ? params.value : '';
                        }
                    })),
                ];
                if (savedColumnState.length) {
                    setColDefs(loadColumnState(updatedColDefs, savedColumnState));
                } else {
                    setColDefs(updatedColDefs);
                }
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [showClearFilter, isStatusFilter, checkColumn]);

    const getMaxWidth = (headerName) => {
        return headerName.length * 10
    };

    const customCellRenderer = (params) => {
        return (
            <button onClick={() => handleOpenDialog(params)}>
                Khai báo đầu kỳ
            </button>
        );
    };

    const handleOpenDialog = (params) => {
        setSelectedRow(params.data);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleCellValueChanged = async (event) => {
        const updatedRow = event.data;
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
            await handleSave(updatedData, 'TkKeToan', setUpdatedData, currentUser)
            await loadData()
            toast.success("Cập nhật thành công", {autoClose: 1000})
        } catch (error) {
            console.error("Lỗi khi cập nhật dữ liệu", error);
        }
    };

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const onFilterChanged = () => {
        const filterModel = gridRef.current.api.getFilterModel();

        if (Object.keys(filterModel).length !== 0) {
            sessionStorage.setItem(tableFilter, JSON.stringify(filterModel));
            setShowClearFilter(true)
        } else {
            sessionStorage.removeItem(tableFilter);
        }
    };

    const clearFilters = () => {
        // Kiểm tra nếu grid đã sẵn sàng
        if (gridRef.current && gridRef.current.api) {
            gridRef.current.api.setFilterModel(null); // Xóa tất cả bộ lọc
        }
        setShowClearFilter(false)
    };


    return (
        <>
            <div className={css.headerPowersheet}>
                <div className={css.headerTitle}>
                    <span>{headerTitle}</span>
                </div>
                <div className={css.headerActionFilter}>
                    <ActionBookMark headerTitle={headerTitle}/>
                    <ActionSearch handleFilterTextBoxChanged={handleFilterTextBoxChanged}/>
                    <ActionChangeFilter isStatusFilter={isStatusFilter}
                                        handleChangeStatusFilter={handleChangeStatusFilter}/>
                    <ActionResetColumn tableCol={tableCol} checkColumn={checkColumn} setCheckColumn={setCheckColumn}/>
                    <ActionClearFilter showClearFilter={showClearFilter} clearFilters={clearFilters}/>
                </div>
                <div className={css.headerAction}>
                    <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>
                    <div className={css.headerActionButton} ref={dropdownRef}>
                        <img
                            src={EllipsisIcon}
                            style={{width: 32, height: 32, cursor: 'pointer'}}
                            alt="Ellipsis Icon"
                            onClick={handleDropdownToggle}
                        />
                        {isDropdownOpen && (
                            <div className={css.dropdownMenu}>
                                <ExportableGrid
                                    api={gridRef.current ? gridRef.current.api : null}
                                    columnApi={gridRef.current ? gridRef.current.columnApi : null}
                                    table={table}
                                    isDropdownOpen={isDropdownOpen}
                                />
                                {/*{company !== 'HQ' &&*/}
                                {/*    <ImportBtnLuong*/}
                                {/*        apiUrl={`${import.meta.env.VITE_API_URL}/api/soketoan`}*/}
                                {/*        onFileImported={handleFileImported}*/}
                                {/*        onGridReady={onGridReady}*/}
                                {/*        company={company}*/}
                                {/*        isDropdownOpen={setIsDropdownOpen}*/}
                                {/*        table={table}*/}
                                {/*    />*/}
                                {/*}*/}

                            </div>
                        )}
                    </div>

                </div>

            </div>
            <div
                style={{
                    height: '78vh',
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
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        onCellValueChanged={handleCellValueChanged}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onFilterChanged={onFilterChanged}  // Gọi sự kiện filterChanged
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                    />
                </div>
            </div>
            <DialogColumn
                selectedRow={selectedRow}
                open={openDialog}
                onClose={handleCloseDialog}
            />
        </>
    );
}

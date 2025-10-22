'use strict';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Ag Grid Function
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';

import { toast } from 'react-toastify';
import css from "../../DanhMuc/KeToanQuanTri.module.css";
import { formatMoney } from "../../../../../generalFunction/format.js";
import AG_GRID_LOCALE_VN from "../../locale.jsx";
import { getAllTaiKhoan } from "../../../../../apis/taiKhoanService.jsx";
import { getCurrentUserLogin } from "../../../../../apis/userService.jsx";
import { getAllSoKeToan } from "../../../../../apis/soketoanService.jsx";
import { calCDPS2 } from "./logicCDPS.js";
import { onFilterTextBoxChanged } from "../../../../../generalFunction/quickFilter.js";
import { loadColumnState, saveColumnStateToLocalStorage } from "../../logicColumnState/columnState.jsx";
import { getItemFromIndexedDB } from "../../../../../storage/storageService.js";
import { setItemInIndexedDB2 } from '../../../../KeToanQuanTri/storage/storageService.js';
import ActionResetColumn from "../../actionButton/ActionResetColumn.jsx";
import ActionChangeFilter from "../../actionButton/ActionChangeFilter.jsx";
import ActionSearch from "../../actionButton/ActionSearch.jsx";
import ActionClearFilter from "../../actionButton/ActionClearAllFilter.jsx";
import ActionBookMark from "../../actionButton/ActionBookMark.jsx";
import { Can_Doi_Phat_Sinh } from "../../../../../Consts/TITLE_HEADER.js";
import MonthSelectBatDauKetThuc from "../../../SelectComponent/MonthSelectBatDauKetThuc.jsx";
import ActionToggleSwitch from "../../../../KeToanQuanTri/ActionButton/ActionToggleSwitch.jsx";
import { Button, Dropdown } from 'antd';
import { ChevronDown } from 'lucide-react';
import ActionMenuDropdown from '../../../../KeToanQuanTri/ActionButton/ActionMenuDropdown.jsx';
import Loading from '../../../../Loading/Loading.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function CDPS() {
    const headerTitle = Can_Doi_Phat_Sinh;
    const table = 'CDPS';
    const tableCol = 'CDPSCol';
    const tableFilter = 'CDPSFilter';
    const key = 'BAOCAO_CANDOIPHATSINH';
    const gridRef = useRef();
    const [colDefs, setColDefs] = useState([]);
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [startMonth, setStartMonth] = React.useState(1);
    const [endMonth, setEndMonth] = React.useState(12);
    const [checkLoc, setCheckLoc] = React.useState(false);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [showClearFilter, setShowClearFilter] = useState(false);
    const [isHideNull, setIsHideNull] = useState(true);
    const [checkColumn, setCheckColumn] = useState(true);

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
            cellStyle: { fontSize: '14.5px' },
            wrapHeaderText: true,
            autoHeaderHeight: true,
            width: 120,
        };
    });

    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

    const loadData = async () => {
        setLoading(true)
        const data = await getAllTaiKhoan();
        const listSKT = await getAllSoKeToan();
        let lastData = calCDPS2(listSKT, data, startMonth, endMonth);
        if (isHideNull) {
            lastData = lastData.filter(item => {
                if (!(item.no_dau_ky == 0 && item.co_dau_ky == 0 && item.no == 0 && item.co == 0) && !(!item.no_dau_ky && !item.co_dau_ky && !item.no && !item.co)) {
                    return true;
                }
                return false
            })
        }
        const savedFilters = sessionStorage.getItem(tableFilter);
        const filters = JSON.parse(savedFilters);
        if (gridRef.current && gridRef.current.api) {
            await setItemInIndexedDB2(key, lastData);
            if (savedFilters) {
                gridRef.current.api.setRowData(lastData);
                gridRef.current.api.setFilterModel(filters);
            } else {
                gridRef.current.api.setRowData(lastData);
            }
        } else {
            console.warn('Grid chưa được khởi tạo hoặc gridRef.current là null');
        }
        setLoading(false);
    };
    const fetchCurrentUser = async () => {
        const { data, error } = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    const onGridReady = useCallback(async () => {
        await loadData()
    }, []);


    useEffect(() => {
        fetchCurrentUser()
        loadData();
    }, []);

    useEffect(() => {
        loadData();
    }, [isHideNull]);

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
                        field: 'id',
                        headerName: 'STT',
                        hide: false,
                        width: 80,
                        ...filter(),
                        editable: false,
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
                        width: 250,
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
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' },
                        headerStyle: { textAlign: 'right' },
                    },
                    {
                        field: 'co_dau_ky',
                        headerName: 'Có đầu kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' },
                    },
                    {
                        field: 'net_dau_ky',
                        headerName: 'Net đầu kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' },
                    },
                    {
                        field: 'no',
                        headerName: 'Nợ trong kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' },
                    },
                    {
                        field: 'co',
                        headerName: 'Có trong kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' },
                    },
                    {
                        field: 'net_trong_ky',
                        headerName: 'Net trong kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' },
                    },
                    {
                        field: 'no_cuoi_ky',
                        headerName: 'Nợ cuối kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' },
                    },
                    {
                        field: 'co_cuoi_ky',
                        headerName: 'Có cuối kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' },
                    },
                    {
                        field: 'net_cuoi_ky',
                        headerName: 'Net cuối kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' },
                    },
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
    }, [isStatusFilter, showClearFilter, checkColumn]);

    const handleSearch = async () => {
        await loadData()
    }

    useEffect(() => {
        if (startMonth !== 1 || endMonth !== 12) {
            setCheckLoc(true);
        }
    }, [startMonth, endMonth]);

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

    const handleIsHideNull = () => {
        setIsHideNull((prev) => !prev);
    };

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const items = [
        {
            key: '0',
            label: (
                <span>{isStatusFilter ? '✅ Bật Filter' : '❌ Tắt Filter'}</span>
            ),
            onClick: handleChangeStatusFilter,
        },
        {
            key: '1',
            label: (
                <span>{isHideNull ? '✅ Bật ẩn dữ liệu trống' : '❌ Tắt ẩn dữ liệu trống'}</span>
            ),
            onClick: handleIsHideNull,
        },

    ];

    const popoverContent = (
        <div className={css.popoverContent}>
            {items.map((item) => (
                <div
                    key={item.key}
                    onClick={item.onClick}
                    className={css.popoverItem}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );

    return (
        <>
            <div className={css.headerPowersheet}>
                <div className={css.headerTitle}>
                    <span>{headerTitle}</span>
                </div>
                <div className={css.headerActionFilter}>
                    <ActionBookMark headerTitle={headerTitle} />
                    <ActionSearch handleFilterTextBoxChanged={handleFilterTextBoxChanged} />
                    {/*<ActionChangeFilter isStatusFilter={isStatusFilter}*/}
                    {/*    handleChangeStatusFilter={handleChangeStatusFilter} />*/}
                    <ActionResetColumn tableCol={tableCol} checkColumn={checkColumn} setCheckColumn={setCheckColumn} />
                    <ActionClearFilter showClearFilter={showClearFilter} clearFilters={clearFilters} />
                    {/*<ActionToggleSwitch label="Ẩn dòng trống" isChecked={isHideNull} onChange={handleIsHideNull} />*/}

                </div>
                <div className={css.headerAction}>
                    <MonthSelectBatDauKetThuc setStartMonth={setStartMonth} setEndMonth={setEndMonth} />
                    {
                        (checkLoc) && (
                            <div className={`${css.headerActionButton} ${css.buttonOn}`}
                                onClick={handleSearch}
                            >
                                <span>Lọc</span>
                            </div>
                        )
                    }
                </div>
                <ActionMenuDropdown popoverContent={popoverContent}
                                    dropdownOpen={dropdownOpen}
                                    setDropdownOpen={setDropdownOpen}
                />
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
                <Loading loading={loading}/>
                <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        ref={gridRef}
                        // rowData={rowData}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onFilterChanged={onFilterChanged}  // Gọi sự kiện filterChanged
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                    />
                </div>
            </div>
        </>
    );
}

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
import { BC_TIEN, Can_Doi_Phat_Sinh } from "../../../Consts/TITLE_HEADER.js";
import { onFilterTextBoxChanged } from "../../../generalFunction/quickFilter.js";
import { getAllTaiKhoan } from "../../../apis/taiKhoanService.jsx";
import { getAllSoKeToan } from "../../../apis/soketoanService.jsx";
import { calCDPS2 } from "../../Home/AgridTable/SoLieu/CDPS/logicCDPS.js";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import { loadColumnState, saveColumnStateToLocalStorage } from "../../Home/AgridTable/logicColumnState/columnState.jsx";
import { getCurrentUserLogin } from "../../../apis/userService.jsx";
import { getItemFromIndexedDB } from "../../../storage/storageService.js";
import { setItemInIndexedDB2 } from '../../KeToanQuanTri/storage/storageService.js';
import { formatMoney } from "../../../generalFunction/format.js";
import MonthSelectBatDauKetThuc from "../../Home/SelectComponent/MonthSelectBatDauKetThuc.jsx";
import ActionClearFilter from "../../Home/AgridTable/actionButton/ActionClearAllFilter.jsx";
import ActionResetColumn from "../../Home/AgridTable/actionButton/ActionResetColumn.jsx";
import ActionChangeFilter from "../../Home/AgridTable/actionButton/ActionChangeFilter.jsx";
import ActionSearch from "../../Home/AgridTable/actionButton/ActionSearch.jsx";
import ActionBookMark from "../../Home/AgridTable/actionButton/ActionBookMark.jsx";

import css from "../../Home/AgridTable/DanhMuc/KeToanQuanTri.module.css";
import { useParams } from "react-router-dom";
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function BCTien() {
    const { companySelect, id } = useParams();
    const headerTitle = BC_TIEN;
    const table = 'BCTien';
    const tableCol = 'BCTienCol';
    const tableFilter = 'BCTienFilter';
    const key = 'BAOCAO_TIEN';
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
        setLoading(true);

        let data = await getAllTaiKhoan();
        if (companySelect) {
            data = data.filter(item => item.company == companySelect || companySelect == 'HQ')
        }
        const listSKT = await getAllSoKeToan();
        let lastData = calCDPS2(listSKT, data, startMonth, endMonth);

        const calculateSumForCodes = (prefixes) => {
            return lastData.reduce((sum, item) => {
                if (prefixes.some(prefix => item.code?.startsWith(prefix))) {
                    sum += item.net_cuoi_ky;
                }
                return sum;
            }, 0);
        };
        const calculateSumForCode = (codes) => {
            return lastData.reduce((sum, item) => {
                if (codes.some(code => item.code == code)) {
                    sum += item.net_cuoi_ky;
                }
                return sum;
            }, 0);
        };

        const tien = calculateSumForCodes(['111', '112']);
        const dauTuNganHan = calculateSumForCode(['128']);

        let newData = [
            { name: 'Tổng tiền và tương đương tiền dư cuối kỳ', net_cuoi_ky: tien + dauTuNganHan, layer: '1' },
            { name: 'Tiền', net_cuoi_ky: tien, layer: '1.1' },
            { name: 'Đầu tư ngắn hạn', net_cuoi_ky: dauTuNganHan, layer: '1.2' }
        ];

        const savedFilters = sessionStorage.getItem(tableFilter);
        if (gridRef.current?.api) {
            await setItemInIndexedDB2(key, newData);
            gridRef.current.api.setRowData(newData);
            if (savedFilters) gridRef.current.api.setFilterModel(JSON.parse(savedFilters));
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

    const getCellStyle = (params) => {
        const value = params.data?.layer?.toString();
        const isBold = value && !value.includes('.');
        if (params.colDef.field === 'net_cuoi_ky') {
            return {
                textAlign: 'right',
                fontWeight: isBold ? 'bold' : 'normal'
            };
        }
        return {
            fontWeight: isBold ? 'bold' : 'normal'
        };
    };



    useEffect(() => {
        const fetchData = async () => {
            try {
                const savedColumnState = await getItemFromIndexedDB(tableCol) || []

                let updatedColDefs = [
                    {
                        field: 'name',
                        headerName: 'Tiêu đề',
                        width: 200,
                        ...filter(),
                        cellStyle: getCellStyle,
                    },
                    {
                        field: 'net_cuoi_ky',
                        headerName: 'Net cuối kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: getCellStyle,
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


    return (
        <>
            <div className={css.headerPowersheet}>
                <div className={css.headerTitle}>
                    <span>{headerTitle}</span>
                </div>
                <div className={css.headerActionFilter}>
                    <ActionBookMark headerTitle={headerTitle} />
                    <ActionSearch handleFilterTextBoxChanged={handleFilterTextBoxChanged} />
                    <ActionChangeFilter isStatusFilter={isStatusFilter}
                        handleChangeStatusFilter={handleChangeStatusFilter} />
                    <ActionResetColumn tableCol={tableCol} checkColumn={checkColumn} setCheckColumn={setCheckColumn} />
                    <ActionClearFilter showClearFilter={showClearFilter} clearFilters={clearFilters} />
                </div>
                <div className={css.headerAction}>
                    <div className={`${css.headerActionButton} ${css.buttonOn}`} onClick={() => {
                        setIsHideNull(!isHideNull)
                    }}><span>Ẩn dòng trống</span>
                    </div>
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
                        <img src='/loading_moi_2.svg' alt="Loading..." style={{ width: '650px', height: '550px' }} />
                    </div>
                )}
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

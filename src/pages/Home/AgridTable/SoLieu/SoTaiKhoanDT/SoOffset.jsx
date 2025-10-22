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

import {toast} from 'react-toastify';
import css from "../../DanhMuc/KeToanQuanTri.module.css";
import {createTimestamp, formatMoney, getCurrentDate} from "../../../../../generalFunction/format.js";
import AG_GRID_LOCALE_VN from "../../locale.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {createNewSoKeToan, getAllSoKeToan} from "../../../../../apis/soketoanService.jsx";
import {logicListT} from "../CDPS/logicCDPS.js";
import MonthSelectBatDau from "../../../SelectComponent/MonthSelectBatDau.jsx";
import MonthSelectKetThuc from "../../../SelectComponent/MonthSelectKetThuc.jsx";
import {onFilterTextBoxChanged} from "../../../../../generalFunction/quickFilter.js";
import {loadColumnState, saveColumnStateToLocalStorage} from "../../logicColumnState/columnState.jsx";
import {getItemFromIndexedDB} from "../../../../../storage/storageService.js";
import {getAllKhaiBaoDauKy} from "../../../../../apis/khaiBaoDauKyService.jsx";
import ActionResetColumn from "../../actionButton/ActionResetColumn.jsx";
import {getAllKhachHang} from "../../../../../apis/khachHangService.jsx";
import {getAllNhanVien} from "../../../../../apis/nhanVienService.jsx";
import {getAllNhaCungCap} from "../../../../../apis/nhaCungCapService.jsx";
import {createOffsetList} from "../../../../../generalFunction/logicSo/createOffsetList.js";
import ActionChangeFilter from "../../actionButton/ActionChangeFilter.jsx";
import ActionClearFilter from "../../actionButton/ActionClearAllFilter.jsx";
import {MyContext} from "../../../../../MyContext.jsx";
import {message} from "antd";
import {So_Offset} from "../../../../../Consts/TITLE_HEADER.js";
import ActionBookMark from "../../actionButton/ActionBookMark.jsx";
import MonthSelectBatDauKetThuc from "../../../SelectComponent/MonthSelectBatDauKetThuc.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function SoOffset() {
    const headerTitle = So_Offset;
    const table = 'SoOffset';
    const tableCol = 'SoOffsetCol';
    const tableFilter = 'SoOffsetFilter';
    const gridRef = useRef();
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [startMonth, setStartMonth] = React.useState(1);
    const [endMonth, setEndMonth] = React.useState(12);
    const [checkLoc, setCheckLoc] = React.useState(false);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [showClearFilter, setShowClearFilter] = useState(false);
    const [checkColumn, setCheckColumn] = useState(true);
    const [khs, setKHs] = useState([])
    const [nccs, setNCCs] = useState([])
    const [nvs, setNVs] = useState([])
    const {currentYear} = useContext(MyContext)
    useEffect(() => {
        getAllKhachHang().then(data => {
            setKHs(data)
        })
        getAllNhaCungCap().then(data => {
            setNCCs(data)
        })
        getAllNhanVien().then(data => {
            setNVs(data)
        })
    }, [])
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
            suppressHeaderMenuButton: true,
        };
    });

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const loadData = async (reset = false) => {
        const listSKT = await getAllSoKeToan();
        let listDauKy = await getAllKhaiBaoDauKy();
        let sktT = logicListT(listSKT);
        let rowDataList = []
        rowDataList = createOffsetList(sktT, listDauKy, startMonth, endMonth, nvs, khs, nccs)
        const savedFilters = sessionStorage.getItem(tableFilter);
        const filters = JSON.parse(savedFilters);
        if (gridRef.current && gridRef.current.api) {
            if (savedFilters) {
                gridRef.current.api.setRowData(rowDataList);
                gridRef.current.api.setFilterModel(filters);
            } else {
                gridRef.current.api.setRowData(rowDataList);
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
        fetchCurrentUser()
        loadData();
    }, []);

    useEffect(() => {
        loadData();
    }, [nvs, khs, nccs])

    useEffect(() => {
        const isMonthChanged = startMonth !== 1 || endMonth !== 12;
        if (isMonthChanged) {
            setCheckLoc(true);
        }
    }, [startMonth, endMonth]);


    function filter() {
        if (isStatusFilter) {
            return {
                filter: 'agMultiColumnFilter', floatingFilter: true, filterParams: {
                    filters: [{
                        filter: 'agTextColumnFilter',
                    }, {
                        filter: 'agSetColumnFilter',
                    },],
                },
            };
        }
    }

    function sortMoi() {
        return {
            comparator: (valueA, valueB) => {
                let a = parseFloat(valueA?.replace(/[^\d.-]/g, ''));
                let b = parseFloat(valueB?.replace(/[^\d.-]/g, ''));
                const isANaN = isNaN(a);
                const isBNaN = isNaN(b);
                if (isANaN && isBNaN) {
                    return 0;
                }
                if (isANaN) {
                    return 1;
                }
                if (isBNaN) {
                    return -1;
                }
                return a - b;
            },
        };
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const savedColumnState = await getItemFromIndexedDB(tableCol) || []
                let updatedColDefs = [
                    {
                        field: 'dinh_danh',
                        headerName: 'Định danh',
                        width: 80,
                        pinned: 'left',
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'net_cuoi_ky',
                        headerName: 'Phải trả',
                        ...filter(),
                        width: 150,
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                        headerStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'ma_tk',
                        headerName: 'TKKT Phải trả',
                        width: 120,
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'net_cuoi_ky2',
                        headerName: 'Phải thu',
                        width: 150,
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'ma_tk2',
                        headerName: 'TKKT Phải thu',
                        width: 120,
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        headerCheckboxSelection: true,
                        checkboxSelection: true,
                        headerName: '',
                        width: 30,
                    },
                ];
                if (savedColumnState.length) {
                    setColDefs(loadColumnState(updatedColDefs, savedColumnState));
                } else {
                    setColDefs(updatedColDefs);
                }
            } catch (error) {
                console.log(error)
               console.log(error)
            }
        };
        fetchData();
    }, [isStatusFilter, showClearFilter, checkColumn]);

    const handleSearch = async () => {
        await loadData(true)
    }


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

    async function offset(data) {
        const dateTimeString = getCurrentDate();
        const [day, month] = dateTimeString.split('/');
        for (const item of data) {
            let newData = {
                dien_giai: '[OFFSET]',
                show: true,
                created_at: createTimestamp(),
                user_create: currentUser.email,
                ps_no: 0,
                ps_co: 0,
                day: day,
                month: month,
                year: currentYear !== 'Toàn bộ'? currentYear : new Date().getFullYear(),
            };
            if (item.net_cuoi_ky < item.net_cuoi_ky2) {
                newData.tk_no = item.ma_tk2;
                newData.tk_co = item.ma_tk;
                newData.so_tien_VND = -item.net_cuoi_ky
            } else {
                newData.tk_no = item.ma_tk;
                newData.tk_co = item.ma_tk2;
                newData.so_tien_VND = -item.net_cuoi_ky2
            }
            let kh = khs.find(k => k.dinh_danh === item.dinh_danh);
            let ncc = nccs.find(k => k.dinh_danh === item.dinh_danh);
            let nv = nvs.find(k => k.dinh_danh === item.dinh_danh);
            newData.customer = kh.code
            newData.supplier = ncc.code
            await createNewSoKeToan(newData)
        }
        message.success('Đã offset.')
        loadData(true)
    }

    return (<>
        <div className={css.headerPowersheet}>
            <div className={css.headerActionFilter}>
                <ActionBookMark headerTitle={headerTitle}/>
                <ActionChangeFilter isStatusFilter={isStatusFilter}
                                    handleChangeStatusFilter={handleChangeStatusFilter}/>
                <ActionResetColumn tableCol={tableCol} checkColumn={checkColumn} setCheckColumn={setCheckColumn}/>
                <ActionClearFilter showClearFilter={showClearFilter} clearFilters={clearFilters}/>
            </div>
            <div className={css.headerAction}>
                <div
                    className={`${css.headerActionButton}`}
                    onClick={() => {
                        if (gridRef.current && gridRef.current.api) {
                            const selectedRows = gridRef.current.api.getSelectedRows();
                            offset(selectedRows);
                        } else {
                            console.warn("Grid chưa được khởi tạo");
                        }
                    }}
                >
                    <span>Offset</span>
                </div>
                <MonthSelectBatDauKetThuc setStartMonth={setStartMonth} setEndMonth={setEndMonth}/>
                {(checkLoc) && (<div className={`${css.headerActionButton} ${css.buttonOn}`}
                                     onClick={handleSearch}
                >
                    <span>Lọc</span>
                </div>)}
            </div>
        </div>
        <div
            style={{
                height: '70vh', display: 'flex', flexDirection: 'column', position: 'relative', marginTop: '15px',
            }}
        >
            {loading && (<div
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
            </div>)}
            <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                <AgGridReact
                    statusBar={statusBar}
                    enableRangeSelection={true}
                    ref={gridRef}
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
    </>);
}

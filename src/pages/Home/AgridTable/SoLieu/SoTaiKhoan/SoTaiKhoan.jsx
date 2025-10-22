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

import {toast} from 'react-toastify';
import css from "../../DanhMuc/KeToanQuanTri.module.css";
import {formatMoney} from "../../../../../generalFunction/format.js";
import AG_GRID_LOCALE_VN from "../../locale.jsx";
import {getAllTaiKhoan} from "../../../../../apis/taiKhoanService.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getAllSoKeToan} from "../../../../../apis/soketoanService.jsx";
import {calCDPS, logicListT} from "../CDPS/logicCDPS.js";
import MonthSelectBatDau from "../../../SelectComponent/MonthSelectBatDau.jsx";
import MonthSelectKetThuc from "../../../SelectComponent/MonthSelectKetThuc.jsx";
import {onFilterTextBoxChanged} from "../../../../../generalFunction/quickFilter.js";
import {loadColumnState, saveColumnStateToLocalStorage} from "../../logicColumnState/columnState.jsx";
import {getItemFromIndexedDB} from "../../../../../storage/storageService.js";
import {LIST_TD_TKKT} from "../../../../../Consts/LIST_TD_TKKT.js";
import TKKeToanSelect from "../../../SelectComponent/TKKeToanSelect.jsx";
import ListTDTKKTSelect from "../../../SelectComponent/ListTDTKKTSelect.jsx";
import ActionResetColumn from "../../actionButton/ActionResetColumn.jsx";
import ActionChangeFilter from "../../actionButton/ActionChangeFilter.jsx";
import ActionSearch from "../../actionButton/ActionSearch.jsx";
import ActionClearFilter from "../../actionButton/ActionClearAllFilter.jsx";
import {So_Tai_Khoan} from "../../../../../Consts/TITLE_HEADER.js";
import ActionBookMark from "../../actionButton/ActionBookMark.jsx";
import MonthSelectBatDauKetThuc from "../../../SelectComponent/MonthSelectBatDauKetThuc.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function SoTaiKhoan() {
    const headerTitle = So_Tai_Khoan;
    const table = 'SoTaiKhoan';
    const tableCol = 'SoTaiKhoanCol';
    const tableFilter = 'SoTaiKhoanFilter';
    const gridRef = useRef();
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [startMonth, setStartMonth] = React.useState(1);
    const [endMonth, setEndMonth] = React.useState(12);
    const [checkLoc, setCheckLoc] = React.useState(false);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [showClearFilter, setShowClearFilter] = useState(false);
    const [tkktList, setTKKTList] = useState([]);
    const [tdList, setTDList] = useState([]);
    const [selectedTK, setSelectedTK] = useState('131');
    const [selectedTD, setSelectedTD] = useState(LIST_TD_TKKT[0].field);
    const initialSelectedTD = useRef(selectedTD);
    const initialSelectedTK = useRef(selectedTK);
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
            cellStyle: {fontSize: '14.5px'},
            wrapHeaderText: true,
            autoHeaderHeight: true,
            suppressHeaderMenuButton: true,
        };
    });

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const getMatchingFields = (filteredData) => {
        return LIST_TD_TKKT.filter((td) =>
            filteredData.some((item) => item[td.field] === "Có")
        );
    };

    const loadDataTaiKhoan = async (reset) => {
        const data = await getAllTaiKhoan();
        const filteredData = data.filter(item => item.code == selectedTK);
        const result = getMatchingFields(filteredData);
        setTDList(result)
        if (!reset) {
            setSelectedTD(result[0].field)
        }
        return data
    }

    useEffect(() => {
        loadDataTaiKhoan()
    }, [selectedTK]);

    const loadData = async (reset = false) => {
        const data = await loadDataTaiKhoan(reset);
        const listSKT = await getAllSoKeToan();
        let sktT = logicListT(listSKT);
        if (startMonth && endMonth && selectedTK) {
            sktT = sktT.filter(item => +item.month >= startMonth && +item.month <= endMonth && (item.tkkt == selectedTK));
            if (selectedTD) {
                let dt = LIST_TD_TKKT.find(item => item.field == selectedTD);
                sktT = sktT.filter(item => item[dt.fieldSKT] && item[dt.fieldSKT] !== '')
                sktT.forEach(item => {
                    item.doiTuong = item[dt.fieldSKT];
                })
            }
        }
        const cdps = calCDPS(listSKT, data, startMonth, endMonth);
        setTKKTList(cdps.sort((a, b) => a.code - b.code))
        const savedFilters = sessionStorage.getItem(tableFilter);
        const filters = JSON.parse(savedFilters);
        if (gridRef.current && gridRef.current.api) {
            if (savedFilters) {
                gridRef.current.api.setRowData(sktT);
                gridRef.current.api.setFilterModel(filters);
            } else {
                gridRef.current.api.setRowData(sktT);
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
    }, [])

    useEffect(() => {
        const isMonthChanged = startMonth !== 1 || endMonth !== 12;
        const isSelectedChanged = selectedTD !== initialSelectedTD.current || selectedTK !== initialSelectedTK.current;
        if (isMonthChanged || isSelectedChanged) {
            setCheckLoc(true);
        }
    }, [startMonth, endMonth, selectedTD, selectedTK]);


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

    function EditTable() {
        return false
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
                        field: 'id',
                        width: 70,
                        pinned: 'left',
                        headerName: 'STT',
                        ...filter(),
                    },
                    {
                        field: 'doiTuong',
                        headerName: 'Đối tượng',
                        width: 80,
                        pinned: 'left',
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'day',
                        headerName: 'Ngày',
                        width: 60,
                        pinned: 'left',
                        ...filter(),
                        comparator: (valueA, valueB) => {
                            const dayA = parseInt(valueA, 10);
                            const dayB = parseInt(valueB, 10);
                            if (dayA < dayB) {
                                return -1;
                            }
                            if (dayA > dayB) {
                                return 1;
                            }
                            return 0;
                        }, ...EditTable(),
                    }, {
                        field: 'month',
                        headerName: 'Tháng',
                        width: 80,
                        pinned: 'left', ...filter(), ...sortMoi(), ...EditTable(),
                    }, {
                        field: 'year',
                        headerName: 'Năm',
                        width: 80,
                        pinned: 'left', ...filter(), ...sortMoi(), ...EditTable(),
                    }, {
                        field: 'dien_giai',
                        headerName: 'Diễn giải',
                        width: 250,
                        pinned: 'left', ...filter(), ...EditTable(),
                    },
                    {
                        field: 'tkkt',
                        headerName: 'TK KT',
                        width: 80,
                        pinned: 'left',
                        ...filter(),
                        ...sortMoi(),
                        ...EditTable(),
                    },
                    {
                        field: 'tkdu',
                        headerName: 'TK ĐƯ',
                        width: 80,
                        pinned: 'left',
                        ...filter(),
                        ...sortMoi(),
                        ...EditTable(),
                    }, {
                        field: 'tien_no',
                        headerName: 'Tiền nợ',
                        pinned: 'left',
                        width: 110,
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'}, ...filter(), ...sortMoi(),
                    }, {
                        field: 'tien_co',
                        headerName: 'Tiền có',
                        pinned: 'left',
                        width: 110,
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'}, ...filter(), ...sortMoi(),
                    }, {
                        field: 'supplier', headerName: 'Nhà cung cấp', width: 140, ...filter(), ...sortMoi(),
                    }, {
                        field: 'kmtc',
                        headerName: 'Khoản mục thu chi',
                        width: 180, ...filter(),
                    },
                    {
                        field: 'kmf',
                        headerName: 'Khoản mục phí',
                        width: 180, ...filter(),
                    }, {
                        field: 'hoa_don',
                        headerName: 'Hóa đơn',
                        width: 120, ...filter(), ...EditTable(),
                    }, {
                        field: 'soChungTu',
                        headerName: 'Chứng từ',
                        width: 120, ...filter(), ...EditTable(),
                    }, {
                        field: 'unit_code',
                        headerName: 'Đơn vị(BU)',
                        width: 120, ...filter(), ...EditTable(),
                    }, {
                        field: 'product',
                        headerName: 'Sản phẩm',
                        width: 120, ...filter(),
                    }, {
                        field: 'team_code',
                        headerName: 'Dept',
                        width: 120, ...filter(),
                    },
                    {
                        field: 'hop_dong',
                        headerName: 'Hợp đồng',
                        width: 120, ...filter(), ...EditTable(),
                    },];
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

    return (<>
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
                <TKKeToanSelect tkktList={tkktList} selectedTK={selectedTK} setSelectedTK={setSelectedTK}/>
                <ListTDTKKTSelect tdList={tdList} selectedTD={selectedTD} setSelectedTD={setSelectedTD}/>
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
                height: '80vh', display: 'flex', flexDirection: 'column', position: 'relative', marginTop: '15px',
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

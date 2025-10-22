'use strict';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import '../../agComponent.css';
import AG_GRID_LOCALE_VN from '../../locale.jsx';
import { message, Select, Switch } from "antd";
import moment from 'moment';
import { LIST_TD_TKKT } from '../../../../../Consts/LIST_TD_TKKT.js';
// Ag Grid Function
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
// COMPONENT
// FUNCTION
import PopupDeleteAgrid from "../../../popUpDelete/popUpDeleteAgrid.jsx";
import { calSTKDT2, logicListT } from '../../SoLieu/CDPS/logicCDPS.js';
import { createSDT2 } from '../../SoLieu/SoTaiKhoanDT/logicSDT.js';
// API
import { getCurrentUserLogin } from "../../../../../apis/userService.jsx";
import { getAllHoaDon } from '../../../../../apis/hoaDonService.jsx';
import { getAllKhachHang } from '../../../../../apis/khachHangService.jsx';
import { getAllSoKeToan } from '../../../../../apis/soketoanService.jsx';
import { getAllKhaiBaoDauKy } from '../../../../../apis/khaiBaoDauKyService.jsx';
import css from "../../DanhMuc/KeToanQuanTri.module.css";
import ActionSearch from "../../actionButton/ActionSearch.jsx";
import ActionChangeFilter from "../../actionButton/ActionChangeFilter.jsx";
import ActionResetColumn from "../../actionButton/ActionResetColumn.jsx";
import ActionClearFilter from "../../actionButton/ActionClearAllFilter.jsx";
import { onFilterTextBoxChanged } from "../../../../../generalFunction/quickFilter.js";
import { loadColumnState, saveColumnStateToLocalStorage } from "../../logicColumnState/columnState.jsx";
import { getItemFromIndexedDB } from "../../../../../storage/storageService.js";
import { Bang_Ke_Tuoi_No, San_Pham } from "../../../../../Consts/TITLE_HEADER.js";
import ActionBookMark from "../../actionButton/ActionBookMark.jsx";
import {MyContext} from "../../../../../MyContext.jsx";
import {findRecordsByConditions} from "../../../../../apis/searchModelService.jsx";
import {CARD, SO_KE_TOAN_SAB} from "../../../../../Consts/MODEL_CALL_API.js";

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    RowGroupingModule,
    SetFilterModule,
]);

const ReminderSwitchRenderer = (props) => {
    const handleChange = (checked) => {
        props.setValue(checked);
    };
    if (props.data && props.data.email_sent) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: '#4CAF50',
                    fontWeight: '500'
                }}
            >
                Đã gửi nhóm quá 60 ngày
            </div>
        );
    }
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
            }}
        >
            <Switch
                checked={!!props.value}
                onChange={handleChange}
                disabled={props.colDef.editable === false}
            />
        </div>
    );
};

export default function BangThongKeTuoiNo() {
    const headerTitle = Bang_Ke_Tuoi_No;
    const table = 'HoaDon';
    const tableCol = 'BangThongKeTuoiNoCol';
    const tableFilter = 'BangThongKeTuoiNoCol';
    const selectedTD = "TD_HoaDon";
    const selectedTD2 = "TD_HoaDon"
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [khachHangMap, setKhachHangMap] = useState({});
    const [isInvoicePopupOpen, setIsInvoicePopupOpen] = useState(false);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [showClearFilter, setShowClearFilter] = useState(false);
    const [checkColumn, setCheckColumn] = useState(true);
    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);
    const [currentView, setCurrentView] = useState('dau-vao');
    const {  currentYear , selectedCompany } = useContext(MyContext)

    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            isStatusFilter: storedSettings?.isStatusFilter ?? false,
        };
    };

    const [isStatusFilter, setIsStatusFilter] = useState(getLocalStorageSettings().isStatusFilter);

    const viewOptions = [
        { value: 'dau-vao', label: 'Phải thu' },
        { value: 'dau-ra', label: 'Phải trả' }
    ];


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
            editable: false,
            filter: true,
            suppressMenu: true,
            cellStyle: { fontSize: '14.5px' },
        };
    });

    const autoGroupColumnDef = useMemo(() => ({
        headerName: 'Khách Hàng / Số HĐ',
        minWidth: 300,
        aggFunc: 'sum',
        valueFormatter: (params) => {
            if (params.value != null && params.node.group) {
                return new Intl.NumberFormat('en-US').format(Number(params.value));
            }
            return params.value;
        },
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
            suppressCount: true,
            innerRenderer: (params) => {
                if (params.node.group) {
                    const customerInfo = khachHangMap[params.node.key];
                    return customerInfo ? customerInfo.ten_giao_dich : 'Không xác định';
                }
                return params.value || 'Không có số HĐ';
            }
        }
    }), [khachHangMap]);

    const getDataPath = useCallback((data) => {
        if (!data || data.group) return [];
        return [
            data.id_khach_hang?.toString() || 'unknown',
            data.code?.toString() || 'no-id'
        ];
    }, []);

    const loadData = async () => {
        const selectedTK = currentView === 'dau-vao' ? "1311" : "3311";
        const khachHangData = await getAllKhachHang();
        const khachHangMapping = khachHangData.reduce((acc, khachHang) => {
            acc[khachHang.id] = khachHang;
            return acc;
        }, {});
        const conditions = { year: `${currentYear}` , company : selectedCompany };
        let listSKT = await findRecordsByConditions(SO_KE_TOAN_SAB, conditions);
        let listDauKy = await getAllKhaiBaoDauKy();
        let sktT = logicListT(listSKT);
        let listSTKDT = []
        let rowDataList = []
        sktT = sktT.filter(item => item.tkkt == selectedTK);
        if (selectedTD) {
            let dt = LIST_TD_TKKT.find(item => item.field == selectedTD);
            let sktT1 = sktT.filter(item => item[dt.fieldSKT] && item[dt.fieldSKT] !== '');
            let listDauKy1 = listDauKy.filter(item => item[selectedTD] && item[selectedTD] !== '');
            listSTKDT = calSTKDT2(sktT1, JSON.parse(JSON.stringify(listDauKy1)), selectedTD, dt.fieldSKT, 1, 12, selectedTK);
            if (selectedTD2) {
                let dt2 = LIST_TD_TKKT.find(item => item.field == selectedTD2);
                let sktT2 = sktT.filter(item => item[dt2.fieldSKT] && item[dt2.fieldSKT] !== '');
                let listDauKy2 = listDauKy.filter(item => item[selectedTD] && item[selectedTD] !== '');
                let listSTKDT2 = calSTKDT2(sktT2, JSON.parse(JSON.stringify(listDauKy2)), selectedTD2, dt2.fieldSKT, 1, 12, selectedTK);
                rowDataList = createSDT2(listSTKDT, listSTKDT2, selectedTD, selectedTD2, listDauKy);
            }
        }
        const type = currentView === 'dau-vao' ? 'co' : 'no';
        rowDataList = rowDataList.filter(item =>
            item[type] != null &&
            item[type] != 0 &&
            !item.id
        );

        setKhachHangMap(khachHangMapping);
        const currentDate = moment();
        let hoaDonData = await getAllHoaDon();
        hoaDonData = hoaDonData.filter(item => item.type == (currentView === 'dau-vao' ? 'dau_vao' : 'dau_ra'));
        const processedData = hoaDonData.map(item => {
            const KHData = khachHangMapping[item.id_khach_hang];
            item.so_tien_phai_thu = item.tong_gia_tri;
            const matchingRow = rowDataList.find(row => row.doiTuong === item.code);
            if (matchingRow) {
                item.so_tien_da_thu = matchingRow.co;
            } else {
                item.so_tien_da_thu = 0;
            }
            const term = KHData.dieu_khoan_tt === null ? 45 : KHData.dieu_khoan_tt;
            const ngay_den_han = moment(item.date).add(term, 'days').format('YYYY-MM-DD');
            const ngayDenHanMoment = moment(ngay_den_han, 'YYYY-MM-DD');
            const diffInDays = ngayDenHanMoment.diff(currentDate, 'days');
            const remainPaid = item.so_tien_phai_thu - item.so_tien_da_thu;
            if (remainPaid > 0) {
                if (diffInDays >= 3) {
                    item.no_trong_han = remainPaid
                } else if (diffInDays >= 0) {
                    item.sap_toi_han = remainPaid
                } else if (diffInDays >= -7) {
                    item.qua_han_7 = remainPaid
                } else if (diffInDays >= -30) {
                    item.qua_han_30 = remainPaid
                } else if (diffInDays >= -60) {
                    item.qua_han_60 = remainPaid
                } else {
                    item.qua_han_over = remainPaid
                }
            }
            item.so_tien_phai_thu = item.so_tien_phai_thu * 1
            return {
                ...item,
                term,
                ngay_den_han,
                khachHang: khachHangMapping[item.id_khach_hang] || null,
            };
        });
        setRowData(processedData);
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
        setLoading(true);
        fetchCurrentUser();
        loadData();
    }, [currentView])

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
                let updatedColDefs = [{
                    pinned: 'left',
                    width: '50',
                    field: 'delete',
                    suppressHeaderMenuButton: true,
                    cellStyle: { alignItems: "center", display: "flex" },
                    headerName: '',
                    cellRenderer: (params) => {
                        if (!params.data || !params.data.id) {
                            return null;
                        }
                        return (
                            <PopupDeleteAgrid
                                id={params.data.id}
                                table={table}
                                reload={loadData}
                            />
                        );
                    },
                },
                {
                    field: 'khachHang.mst',
                    headerName: 'Mã số thuế',
                    width: 140,
                    ...filter(),
                },
                {
                    field: 'so_tien_phai_thu',
                    headerName: currentView === 'dau-vao' ? 'Số tiền phải thu' : 'Số tiền phải trả',
                    width: 150,
                    ...filter(),
                    valueFormatter: (params) => {
                        if (params.value == null) return '';
                        const value = Number(params.value);
                        if (value === 0) return '-';
                        return new Intl.NumberFormat('en-US', {
                            useGrouping: true,
                            maximumFractionDigits: 0
                        }).format(value);
                    },
                    cellStyle: { textAlign: 'right' },
                    enableValue: true,
                    aggFunc: 'sum'
                },
                {
                    field: 'so_tien_da_thu',
                    headerName: currentView === 'dau-vao' ? 'Số tiền đã thu' : 'Số tiền đã trả',
                    width: 150,
                    ...filter(),
                    valueFormatter: (params) => {
                        if (params.value == null) return '';
                        const value = Number(params.value);
                        if (value === 0) return '-';
                        return new Intl.NumberFormat('en-US', {
                            useGrouping: true,
                            maximumFractionDigits: 0
                        }).format(value);
                    },
                    cellStyle: { textAlign: 'right' },
                    enableValue: true,
                    aggFunc: 'sum'
                },
                {
                    field: 'date',
                    headerName: 'Ngày hóa đơn',
                    width: 150,
                    ...filter(),
                    valueFormatter: (params) => {
                        if (params.value) {
                            const date = new Date(params.value);
                            return date.toLocaleDateString('en-GB');
                        }
                        return '';
                    }
                },
                {
                    field: 'term',
                    headerName: 'Term',
                    width: 70,
                    ...filter(),
                },
                {
                    field: 'hop_dong_lien_quan',
                    headerName: 'Hợp đồng liên quan',
                    width: 150,
                    ...filter(),
                },
                {
                    field: 'ngay_den_han',
                    headerName: 'Ngày đến hạn',
                    width: 150,
                    ...filter(),
                    valueFormatter: (params) => {
                        if (params.value) {
                            const date = new Date(params.value);
                            return date.toLocaleDateString('en-GB');
                        }
                        return '';
                    }
                },
                {
                    field: 'no_trong_han',
                    headerName: 'Nợ trong hạn',
                    width: 150,
                    ...filter(),
                    valueFormatter: (params) => {
                        if (params.value == null) return '';
                        const value = Number(params.value);
                        if (value === 0) return '-';
                        return new Intl.NumberFormat('en-US', {
                            useGrouping: true,
                            maximumFractionDigits: 0
                        }).format(value);
                    },
                    cellStyle: { textAlign: 'right' },
                    enableValue: true,
                    aggFunc: 'sum'
                },
                {
                    field: 'sap_toi_han',
                    headerName: 'Sắp tới hạn',
                    width: 150,
                    ...filter(),
                    valueFormatter: (params) => {
                        if (params.value == null) return '';
                        const value = Number(params.value);
                        if (value === 0) return '-';
                        return new Intl.NumberFormat('en-US', {
                            useGrouping: true,
                            maximumFractionDigits: 0
                        }).format(value);
                    },
                    cellStyle: { textAlign: 'right' },
                    enableValue: true,
                    aggFunc: 'sum'
                },
                {
                    field: 'qua_han_7',
                    headerName: 'Quá hạn 1-7 ngày',
                    width: 150,
                    ...filter(),
                    valueFormatter: (params) => {
                        if (params.value == null) return '';
                        const value = Number(params.value);
                        if (value === 0) return '-';
                        return new Intl.NumberFormat('en-US', {
                            useGrouping: true,
                            maximumFractionDigits: 0
                        }).format(value);
                    },
                    cellStyle: { textAlign: 'right' },
                    enableValue: true,
                    aggFunc: 'sum'
                },
                {
                    field: 'qua_han_30',
                    headerName: 'Quá hạn 7-30 ngày',
                    width: 150,
                    ...filter(),
                    valueFormatter: (params) => {
                        if (params.value == null) return '';
                        const value = Number(params.value);
                        if (value === 0) return '-';
                        return new Intl.NumberFormat('en-US', {
                            useGrouping: true,
                            maximumFractionDigits: 0
                        }).format(value);
                    },
                    cellStyle: { textAlign: 'right' },
                    enableValue: true,
                    aggFunc: 'sum'
                },
                {
                    field: 'qua_han_60',
                    headerName: 'Quá hạn 30-60 ngày',
                    width: 150,
                    ...filter(),
                    valueFormatter: (params) => {
                        if (params.value == null) return '';
                        const value = Number(params.value);
                        if (value === 0) return '-';
                        return new Intl.NumberFormat('en-US', {
                            useGrouping: true,
                            maximumFractionDigits: 0
                        }).format(value);
                    },
                    cellStyle: { textAlign: 'right' },
                    enableValue: true,
                    aggFunc: 'sum'
                },
                {
                    field: 'qua_han_over',
                    headerName: 'Quá hạn > 60 ngày',
                    width: 150,
                    ...filter(),
                    valueFormatter: (params) => {
                        if (params.value == null) return '';
                        const value = Number(params.value);
                        if (value === 0) return '-';
                        return new Intl.NumberFormat('en-US', {
                            useGrouping: true,
                            maximumFractionDigits: 0
                        }).format(value);
                    },
                    cellStyle: { textAlign: 'right' },
                    enableValue: true,
                    aggFunc: 'sum'
                },
                {
                    field: 'reminder',
                    headerName: 'Nhắc quá hạn',
                    width: 200,
                    ...filter(),
                    cellRenderer: ReminderSwitchRenderer,
                    editable: true,
                }
                ];
                if (savedColumnState.length) {
                    setColDefs(loadColumnState(updatedColDefs, savedColumnState));
                } else {
                    setColDefs(updatedColDefs);
                }
            } catch (error) {
                message.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [rowData, table, isStatusFilter, checkColumn, currentView]);

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

    const ViewSelector = () => (
        <Select
            value={currentView}
            style={{ width: 120 }}
            onChange={setCurrentView}
            options={viewOptions}
        />
    );

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
                    <ViewSelector />
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
                        rowData={rowData}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        treeData={true}
                        getDataPath={getDataPath}
                        autoGroupColumnDef={autoGroupColumnDef}
                        groupDefaultExpanded={-1}
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
        </>
    )
        ;
}
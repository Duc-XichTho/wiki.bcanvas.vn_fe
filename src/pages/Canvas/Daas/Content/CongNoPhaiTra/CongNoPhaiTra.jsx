'use strict';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import '../../../../Home/AgridTable/agComponent.css';
import AG_GRID_LOCALE_VN from '../../../../Home/AgridTable/locale';
import { message, Select, Switch } from "antd";
import moment from 'moment';
import { LIST_TD_TKKT } from '../../../../../Consts/LIST_TD_TKKT';
import css from "../../../../Home/AgridTable/DanhMuc/KeToanQuanTri.module.css"
// AG GRID FUNCTION
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import {Cong_No_Phai_Tra, KHONG_THE_TRUY_CAP} from '../../../../../Consts/TITLE_HEADER';
// FUNCTION
import PopupDeleteAgrid from '../../../../Home/popUpDelete/popUpDeleteAgrid';
import { calSTKDT2, logicListT } from '../../../../Home/AgridTable/SoLieu/CDPS/logicCDPS';
import { createSDT2 } from '../../../../Home/AgridTable/SoLieu/SoTaiKhoanDT/logicSDT';
import { getItemFromIndexedDB } from '../../../../../storage/storageService';
import { onFilterTextBoxChanged } from '../../../../../generalFunction/quickFilter';
// API
import { getCurrentUserLogin } from '../../../../../apis/userService';
import { getAllHoaDon } from '../../../../../apis/hoaDonService';
import { getAllKhachHang } from '../../../../../apis/khachHangService';
import { getAllSoKeToan } from '../../../../../apis/soketoanService';
import { getAllKhaiBaoDauKy } from '../../../../../apis/khaiBaoDauKyService';
import { setItemInIndexedDB2 } from '../../../../KeToanQuanTri/storage/storageService';
// COMPONENT
import ActionSearch from '../../../../Home/AgridTable/actionButton/ActionSearch';
import ActionChangeFilter from '../../../../Home/AgridTable/actionButton/ActionChangeFilter';
import ActionResetColumn from '../../../../Home/AgridTable/actionButton/ActionResetColumn';
import ActionClearFilter from '../../../../Home/AgridTable/actionButton/ActionClearAllFilter';
import { loadColumnState, saveColumnStateToLocalStorage } from '../../../../Home/AgridTable/logicColumnState/columnState';
import ActionBookMark from '../../../../Home/AgridTable/actionButton/ActionBookMark';
import { useParams } from "react-router-dom";
import {MyContext} from "../../../../../MyContext.jsx";
import {CANVAS_DATA_PACK} from "../../../../../CONST.js";
import {getPermissionDataCty} from "../../../getPermissionDataNhomBC.js";
import ActionSelectCompanyBaoCao from "../../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";
import ActionDisplayRichNoteSwitch from "../../../../KeToanQuanTri/ActionButton/ActionDisplayRichNoteSwitch.jsx";
import RichNoteKTQTRI from "../../../../Home/SelectComponent/RichNoteKTQTRI.jsx";

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

export default function CongNoPhaiTra() {
    const { companySelect, id } = useParams();
    const headerTitle = Cong_No_Phai_Tra;
    const table = 'HoaDon';
    const tableCol = 'CONGNOPHAITRA';
    const tableFilter = 'CONGNOPHAITRA';
    const key = 'CONGNOPHAITRA';
    const tableStatusButton = 'CONGNOPHAITRAStatusButtonCanvas';
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

    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            isStatusFilter: storedSettings?.isStatusFilter ?? false,
            companySelected: storedSettings?.companySelected ?? [],
        };
    };
    const [listCom, setListCom] = useState([])
    const [companySelected, setCompanySelected] = useState(getLocalStorageSettings().companySelected || [])
    const [titleName, setTitleName] = useState('');
    const [isShowInfo, setIsShowInfo] = useState( false);
    const {
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
    } = useContext(MyContext) || {};
    const [isStatusFilter, setIsStatusFilter] = useState(getLocalStorageSettings().isStatusFilter);

    useEffect(() => {
        const tableSettings = {
            isStatusFilter,
            companySelected
        };

        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isStatusFilter, companySelected]);
    const fetchAndSetTitleName = async () => {
        try {
            const settings = await getItemFromIndexedDB(tableStatusButton);
            setIsShowInfo(settings?.isShowInfo ?? false);
            const user = await getCurrentUserLogin();
            const listComs = await getPermissionDataCty('cty', user, userClasses, fetchUserClasses, uCSelected_CANVAS)
            if (listComs?.length > 0 || user.data.isAdmin || listComs.some(e => e.code == 'HQ')) {
                setListCom(listComs)
                setTitleName(CANVAS_DATA_PACK.find(e => e.value == key)?.name)
            } else {
                setTitleName(KHONG_THE_TRUY_CAP)
            }

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
        }
    };
    useEffect(() => {
        fetchAndSetTitleName()
        if (!companySelected && companySelected?.length == 0) {
            setCompanySelected(listCom)

        }
    }, [companySelected]);
    useEffect(() => {
        const saveSettings = async () => {
            const tableSettings = {
                isShowInfo,
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [ isShowInfo,]);

    const handleShowInfo = () => {
        setIsShowInfo(prevState => !prevState);
    };
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
        if (companySelected &&  companySelected.length > 0) {
            const selectedTK = "331";
            let khachHangData = await getAllKhachHang();
            if(companySelected.some(e=> e.code != 'HQ')){
                khachHangData = khachHangData.filter(e => companySelected.some(c=> c.code == e.company) );
            }
            if (khachHangData.length == 0) {
                setRowData([])
                setLoading(false);
                return;
            }
            const khachHangMapping = khachHangData.reduce((acc, khachHang) => {
                acc[khachHang.id] = khachHang;
                return acc;
            }, {});
            const listSKT = await getAllSoKeToan();
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
            const type = 'co';
            rowDataList = rowDataList.filter(item =>
                item[type] != null &&
                item[type] != 0 &&
                !item.id
            );

            setKhachHangMap(khachHangMapping);
            const currentDate = moment();
            let hoaDonData = await getAllHoaDon();
            hoaDonData = hoaDonData.filter(item => item.id_khach_hang && item.type == 'dau_ra');
            const processedData = hoaDonData.map(item => {
                const KHData = khachHangMapping[item.id_khach_hang];
                item.so_tien_phai_tra = item.tong_gia_tri;
                const matchingRow = rowDataList.find(row => row.doiTuong === item.code);
                if (matchingRow) {
                    item.so_tien_da_tra = matchingRow.co;
                } else {
                    item.so_tien_da_tra = 0;
                }
                const term = KHData.dieu_khoan_tt === null ? 45 : KHData.dieu_khoan_tt;
                const ngay_den_han = moment(item.date).add(term, 'days').format('YYYY-MM-DD');
                const ngayDenHanMoment = moment(ngay_den_han, 'YYYY-MM-DD');
                const diffInDays = ngayDenHanMoment.diff(currentDate, 'days');
                const remainPaid = item.so_tien_phai_tra - item.so_tien_da_tra;
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
                item.so_tien_phai_tra = item.so_tien_phai_tra * 1
                return {
                    ...item,
                    term,
                    ngay_den_han,
                    khachHang: khachHangMapping[item.id_khach_hang] || null,
                };
            });
            await setItemInIndexedDB2(key, processedData);
            setRowData(processedData);
            setLoading(false);
        }
        else {
            setRowData([])
            setLoading(false);
            return;
        }

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
    }, [companySelected])

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
                    field: 'so_tien_phai_tra',
                    headerName: 'Số tiền phải trả',
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
                    field: 'so_tien_da_tra',
                    headerName: 'Số tiền đã trả',
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
    }, [rowData, table, isStatusFilter, checkColumn]);

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
                    <span>
  {titleName}
                        {(companySelected?.length > 0 ? companySelected : []).map((e, index) => (
                            <React.Fragment key={index}>
                                {index == 0 && ` - `}
                                {e.name}
                                {index !== (companySelected?.length > 0 ? companySelected.length : 0) - 1 && ", "}
                            </React.Fragment>
                        ))}
</span>
                </div>
                <div className={css.headerActionFilter}>
                    <ActionBookMark headerTitle={headerTitle}/>
                    <ActionSearch handleFilterTextBoxChanged={handleFilterTextBoxChanged}/>
                    <ActionChangeFilter isStatusFilter={isStatusFilter}
                                        handleChangeStatusFilter={handleChangeStatusFilter}/>
                    <ActionDisplayRichNoteSwitch isChecked={isShowInfo} onChange={handleShowInfo}/>
                    <ActionResetColumn tableCol={tableCol} checkColumn={checkColumn} setCheckColumn={setCheckColumn} />
                    <ActionClearFilter showClearFilter={showClearFilter} clearFilters={clearFilters} />
                    <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                               valueSelected={companySelected}/>
                </div>
            </div>
            {isShowInfo && <div style={{width: '100%', height: '11%', boxSizing: "border-box"}}>
                <RichNoteKTQTRI table={`${table}_Canvas_note`}/>
            </div>}
            <div
                style={{
                    height:isShowInfo? '76vh':'85vh',
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
                        onFilterChanged={onFilterChanged}
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                    />
                </div>
            </div>
        </>
    );
}

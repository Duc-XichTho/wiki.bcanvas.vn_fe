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
import '../../agComponent.css';
import css from '../../DanhMuc/KeToanQuanTri.module.css'
import {useNavigate} from "react-router-dom";
import {MyContext} from "../../../../../MyContext.jsx";
import AG_GRID_LOCALE_VN from "../../locale.jsx";
import {loadColumnState, saveColumnStateToLocalStorage} from "../../logicColumnState/columnState.jsx";
import {onFilterTextBoxChanged} from "../../../../../generalFunction/quickFilter.js";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import PopupDeleteAgrid from "../../../popUpDelete/popUpDeleteAgrid.jsx";
import {getItemFromIndexedDB} from "../../../../../storage/storageService.js";
import {formatMoney} from "../../../../../generalFunction/format.js";
import {ROUTES} from "../../../../../CONST.js";
import ActionBookMark from "../../actionButton/ActionBookMark.jsx";
import ActionSearch from "../../actionButton/ActionSearch.jsx";
import ActionChangeFilter from "../../actionButton/ActionChangeFilter.jsx";
import ActionResetColumn from "../../actionButton/ActionResetColumn.jsx";
import ActionClearFilter from "../../actionButton/ActionClearAllFilter.jsx";
import {Phieu_Chi} from "../../../../../Consts/TITLE_HEADER.js";
import {getAllPhieuChi} from "../../../../../apis/phieuChiService.jsx";
import ActionCreate from "../../actionButton/ActionCreate.jsx";
import TaoPhieuChi from "../../../formCreate/TaoPhieuThuChi.jsx";
import {Modal} from "antd";
import TaoPhieuThuChi from "../../../formCreate/TaoPhieuThuChi.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function PhieuChi({company = 'HQ'}) {
    const navigate = useNavigate()
    const headerTitle = Phieu_Chi;
    const table = 'PhieuChi';
    const tableCol = 'PhieuChiCol';
    const tableFilter = 'PhieuChiFilter';
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const {currentYear, selectedCompany, listCompany, fetchAllCompany} = useContext(MyContext)
    const gridRef = useRef();
    const [showClearFilter, setShowClearFilter] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
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

    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            suppressMenu: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
            // hide: isShowAll1,
        };
    }, []);

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    function loadData() {
        getAllPhieuChi().then((data) => {
            let filteredData = data;
            const savedFilters = sessionStorage.getItem(tableFilter);
            const filters = JSON.parse(savedFilters);
            if (gridRef.current && gridRef.current.api) {
                if (savedFilters) {
                    gridRef.current.api.setRowData(filteredData);
                    gridRef.current.api.setFilterModel(filters);
                } else {
                    gridRef.current.api.setRowData(filteredData);
                }
            } else {
                console.warn('Grid chưa được khởi tạo hoặc gridRef.current là null');
            }
            setTimeout(() => {
                setLoading(false)
            }, 500);
        });
    }


    const onGridReady = useCallback(async () => {
        loadData();
    }, [company, selectedCompany]);

    useEffect(() => {
        fetchCurrentUser();
        setLoading(true);
        loadData();
    }, []);

    function checkInput(list, s) {
        return {
            cellClassRules: {
                'data-error': (params) => {
                    return !list.some((e) => e[s] === params.value) && params.value !== '';
                },
            },
        };
    }

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
                        width: '50',
                        field: 'delete',
                        suppressHeaderMenuButton: true,
                        cellStyle: {alignItems: "center", display: "flex"},
                        headerName: '',
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
                        editable: false,
                    },

                    {
                        field: 'id',
                        width: 70,
                        pinned: 'left',
                        headerName: 'STT',
                        ...filter(),
                    },
                    {
                        field: 'so_phieu',
                        width: 100,
                        headerName: 'Số phiếu',
                        ...filter(),
                    },
                    {
                        field: 'ngay_chi',
                        width: 170,
                        headerName: 'Ngày chi',
                        ...filter(),
                    },
                    {
                        field: 'hinh_thuc',
                        width: 170,
                        headerName: 'Hình thức',
                        ...filter(),
                    },
                    {
                        field: 'don_mua_lien_quan',
                        width: 170,
                        headerName: 'Đơn mua liên quan',
                        ...filter(),
                    },
                    {
                        field: 'tai_khoan_nhan_tien',
                        width: 170,
                        headerName: 'Tài khoản nhận tiền',
                        ...filter(),
                    },
                    {
                        field: 'ten_chu_tai_khoan',
                        width: 170,
                        headerName: 'Tên chủ tài khoản',
                        ...filter(),
                    },
                    {
                        field: 'so_tien',
                        headerName: 'Số tiền',
                        width: 150,
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'so_tien_bang_chu',
                        headerName: 'Số tiền bằng chữ',
                        width: 200,
                        ...filter(),
                    },
                    {
                        field: 'ly_do',
                        headerName: 'Lý do',
                        width: 110,
                        ...filter(),
                    },
                    {
                        field: 'thanh_toan_cong_no',
                        headerName: 'Thanh toán công nợ',
                        width: 150,
                        ...filter(),
                    },
                ]
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
    }, [onGridReady, loading, table, showClearFilter, isStatusFilter, checkColumn]);

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


    const handleChangeStatusFilter = () => {
        setIsStatusFilter((prev) => {
            return !prev;
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

    const [tabSelected, setTabSelected] = useState(ROUTES.PHIEU_CHI);

    const tabs = [
        {
            path: ROUTES.PHIEU_THU,
            label: "Phiếu Thu",
        },
        {
            path: ROUTES.PHIEU_CHI,
            label: "Phiếu Chi",
        },
    ]

    const tabChange = (path) => {
        setTabSelected(path);
        navigate(`/accounting/so-lieu/${path}`)
    }

    const [openForm, setOpenForm] = useState(false);

    const handleAddRow = () => {
        setOpenForm(true)
    }

    const handleCancel = () => {
        setOpenForm(false);
    };
    return (
        <>
            <div className={css.headerPowersheet}>
                <div className={css.headerTitle}>
                    {/*<span>{headerTitle}</span>*/}
                    {tabs.map(tab => (
                        <div key={tab.path} className={`${css.tab} ${tab.path === tabSelected ? css.active : ''}`}
                             onClick={() => tabChange(tab.path)}>
                            <span>{tab.label}</span>
                        </div>
                    ))}
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
                    <ActionCreate handleAddRow={handleAddRow}/>
                </div>
            </div>
            <div
                style={{
                    height: (company === "Group" || company === "Internal") ? '88vh' : '87vh',
                    display: 'flex',
                    flexDirection: 'column',
                    // position: 'relative',
                    marginTop: '15px',
                }}
            >
                {
                    loading && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                position: 'absolute',
                                width: '100%',
                                top: 0,
                                left: 0,
                                zIndex: '2000',
                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                            }}
                        >
                            <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>
                        </div>
                    )
                }
                <div className="ag-theme-quartz" style={{height: '90%', width: '100%'}}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection
                        ref={gridRef}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        animateRows={true}
                        suppressRowClickSelection={true}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onFilterChanged={onFilterChanged}
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                    />
                </div>
            </div>
            <Modal
                title="Tạo Phiếu Chi"
                open={openForm}
                onCancel={handleCancel}
                footer={null}
                width={800}
            >
                <TaoPhieuThuChi table={table} reloadData={loadData} handleCancel={handleCancel}/>
            </Modal>
        </>
    );
}

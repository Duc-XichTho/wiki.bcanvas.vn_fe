'use strict';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import '../../agComponent.css';
import AG_GRID_LOCALE_VN from '../../locale.jsx';
import css from "../../DanhMuc/KeToanQuanTri.module.css";
import { message } from "antd";
import { HOA_DON_TYPE } from '../../../../../CONST.js';
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
import InvoicePopup from '../../../InvoicePopup/InvoicePopup.jsx';
// FUNCTION
import { handleSave } from "../../handleAction/handleSave.js";
import PopupDeleteAgrid from "../../../popUpDelete/popUpDeleteAgrid.jsx";
import ActionSave from '../../actionButton/ActionSave.jsx';
import ActionCreate from '../../actionButton/ActionCreate.jsx';
// import ActionCreate from '../../actionButton/ActionCreate.jsx';
// API
import { getCurrentUserLogin } from "../../../../../apis/userService.jsx";
import { createNewHoaDon, getAllHoaDon } from '../../../../../apis/hoaDonService.jsx';
import { getAllKhachHang } from '../../../../../apis/khachHangService.jsx';
import { loadColumnState, saveColumnStateToLocalStorage } from "../../logicColumnState/columnState.jsx";
import { EllipsisIcon } from "../../../../../icon/IconSVG.js";
import ActionResetColumn from "../../actionButton/ActionResetColumn.jsx";
import { onFilterTextBoxChanged } from "../../../../../generalFunction/quickFilter.js";
import { getItemFromIndexedDB } from "../../../../../storage/storageService.js";
import ExportableGrid from "../../exportFile/ExportableGrid.jsx";
import ActionSearch from "../../actionButton/ActionSearch.jsx";
import ActionChangeFilter from "../../actionButton/ActionChangeFilter.jsx";
import ActionClearFilter from "../../actionButton/ActionClearAllFilter.jsx";
import { Hoa_Don_Dau_Ra } from "../../../../../Consts/TITLE_HEADER.js";
import ActionBookMark from "../../actionButton/ActionBookMark.jsx";
import {getAllCard} from "../../../../../apis/cardService.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function QuanLyHoaDonDauRa() {
    const headerTitle = Hoa_Don_Dau_Ra;
    const table = 'HoaDon';
    const tableStatusFilter = 'HoaDonDauRa';
    const tableCol = 'HoaDonDauRaCol';
    const tableFilter = 'HoaDonDauRaFilter'
    const gridRef = useRef();
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isInvoicePopupOpen, setIsInvoicePopupOpen] = useState(false);
    const [showClearFilter, setShowClearFilter] = useState(false);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [checkColumn, setCheckColumn] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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

        localStorage.setItem(tableStatusFilter, JSON.stringify(tableSettings));
    }, [isStatusFilter]);

    const handleChangeStatusFilter = () => {
        setIsStatusFilter((prev) => {
            return !prev;
        });
    };

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            suppressMenu: true,
            cellStyle: { fontSize: '14.5px' },
        };
    });

    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

    const loadData = async () => {
        const data = await getAllHoaDon();
        const khachHangData = await getAllKhachHang();

        const hoaDonData = data
            .filter(item => item.type === HOA_DON_TYPE.DauRa)
            .map(item => {
                const khachHang = khachHangData.find(kh => kh.id === item.id_khach_hang);
                item.code = item.code ? item.code : `HD${item.id}`;
                return {
                    ...item,
                    khachHang
                };
            });
        const savedFilters = sessionStorage.getItem(tableFilter);
        const filters = JSON.parse(savedFilters);
        if (gridRef.current && gridRef.current.api) {
            if (savedFilters) {
                gridRef.current.api.setRowData(hoaDonData);
                gridRef.current.api.setFilterModel(filters);

            } else {
                gridRef.current.api.setRowData(hoaDonData);
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
        setLoading(true);
        fetchCurrentUser();
        loadData();
    }, [])

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
                        cellStyle: { alignItems: "center", display: "flex" },
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
                        headerName: 'STT', hide: false,
                        width: 80,
                        ...filter(),
                        editable: false,
                    },
                    {
                        field: 'date',
                        headerName: 'Ngày phát hành',
                        width: 150,
                        ...filter(),
                        editable: true,
                        cellEditor: 'agDateCellEditor',
                        cellEditorParams: {
                            dateFormat: 'dd/MM/yyyy'
                        },
                        valueGetter: (params) => {
                            if (params.data.date) {
                                return new Date(params.data.date);
                            }
                            return null;
                        },
                        valueFormatter: (params) => {
                            if (params.value) {
                                return new Date(params.value).toLocaleDateString('en-GB');
                            }
                            return '';
                        },
                        valueSetter: (params) => {
                            const newValue = params.newValue;
                            const data = params.data;
                            if (newValue instanceof Date) {
                                data.date = newValue.toISOString();
                                return true;
                            }
                            return false;
                        }
                    },
                    {
                        field: 'mau_so',
                        headerName: 'Mẫu số',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'code',
                        headerName: 'Số hóa đơn',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'ky_hieu_hd',
                        headerName: 'Ký hiệu hóa đơn',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'khachHang.mst',
                        headerName: 'Mã số thuế',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'khachHang.dia_chi',
                        headerName: 'Địa chỉ',
                        width: 230,
                        ...filter(),
                    },
                    {
                        field: 'khachHang.ten_giao_dich',
                        headerName: 'Người mua',
                        width: 250,
                        ...filter(),
                    },
                    {
                        field: 'tong_gia_tri_chua_thue',
                        headerName: 'Tổng giá trị chưa thuế (VNĐ)',
                        width: 200,
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
                        valueParser: (params) => {
                            const numericValue = Number(params.newValue.toString().replace(/[^\d]/g, ''));
                            return isNaN(numericValue) ? null : numericValue;
                        },
                        cellRenderer: (params) => {
                            if (params.value == null) return '';
                            return new Intl.NumberFormat('en-US').format(Number(params.value));
                        },
                        cellStyle: { textAlign: 'right' },
                        cellEditor: 'agNumberCellEditor',
                        cellEditorParams: {
                            min: 0,
                            precision: 0
                        },
                    },
                    {
                        field: 'thue_suat',
                        headerName: 'Thuế suất (%)',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'tien_thue',
                        headerName: 'Tiền thuế (VNĐ)',
                        width: 150,
                        ...filter(),
                        cellStyle: { textAlign: 'right' },
                        valueFormatter: (params) => {
                            if (params.value == null) return '';
                            const value = Number(params.value);
                            if (value === 0) return '-';
                            return new Intl.NumberFormat('en-US', {
                                useGrouping: true,
                                maximumFractionDigits: 0
                            }).format(value);
                        },
                        valueParser: (params) => {
                            const numericValue = Number(params.newValue.toString().replace(/[^\d]/g, ''));
                            return isNaN(numericValue) ? null : numericValue;
                        },
                        cellRenderer: (params) => {
                            if (params.value == null) return '';
                            return new Intl.NumberFormat('en-US').format(Number(params.value));
                        },
                        cellEditor: 'agNumberCellEditor',
                        cellEditorParams: {
                            min: 0,
                            precision: 0
                        },
                    },
                    {
                        field: 'tong_gia_tri',
                        headerName: 'Tổng giá trị (VNĐ)',
                        width: 150,
                        ...filter(),
                        cellStyle: { textAlign: 'right' },
                        valueFormatter: (params) => {
                            if (params.value == null) return '';
                            const value = Number(params.value);
                            if (value === 0) return '-';
                            return new Intl.NumberFormat('en-US', {
                                useGrouping: true,
                                maximumFractionDigits: 0
                            }).format(value);
                        },
                        valueParser: (params) => {
                            const numericValue = Number(params.newValue.toString().replace(/[^\d]/g, ''));
                            return isNaN(numericValue) ? null : numericValue;
                        },
                        cellRenderer: (params) => {
                            if (params.value == null) return '';
                            return new Intl.NumberFormat('en-US').format(Number(params.value));
                        },
                        cellEditor: 'agNumberCellEditor',
                        cellEditorParams: {
                            min: 0,
                            precision: 0
                        },
                    },
                    {
                        field: 'trang_thai',
                        headerName: 'Trạng thái hóa đơn',
                        width: 150,
                        ...filter(),
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: ['Nháp', 'Chờ', 'Đã xuất', 'Hủy']
                        },
                    },
                    {
                        field: 'hinh_thuc_tt',
                        headerName: 'Hình thức thanh toán',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'khachHang.code',
                        headerName: 'Mã khách hàng',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'so_chung_tu',
                        headerName: 'Chứng từ',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'note',
                        headerName: 'ghi chú',
                        width: 150,
                        ...filter(),
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
    }, [isStatusFilter, showClearFilter, checkColumn]);

    const handleCellValueChanged = async (event) => {
        let updatedRow = event.data;
        updatedRow.user_update = currentUser.email;
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
            toast.success("Cập nhật thành công", { autoClose: 10})
        } catch (error) {
            console.error("Lỗi khi cập nhật dữ liệu", error);
        }
    };

    const handleAddRow = async () => {
        await createNewHoaDon({ type: HOA_DON_TYPE.DauRa });
        message.success("Tạo dòng thành công", { autoClose: 10})
        await loadData()
    };

    const handleOpenInvoicePopup = () => {
        setIsInvoicePopupOpen(true);
    };

    const handleCloseInvoicePopup = () => {
        setIsInvoicePopupOpen(false);
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
                    <ActionBookMark headerTitle={headerTitle} />
                    <ActionSearch handleFilterTextBoxChanged={handleFilterTextBoxChanged} />
                    <ActionChangeFilter isStatusFilter={isStatusFilter}
                        handleChangeStatusFilter={handleChangeStatusFilter} />
                    <ActionResetColumn tableCol={tableCol} checkColumn={checkColumn} setCheckColumn={setCheckColumn} />
                    <ActionClearFilter showClearFilter={showClearFilter} clearFilters={clearFilters} />
                </div>
                <div className={css.headerAction}>
                    <ActionCreate handleAddRow={handleOpenInvoicePopup} />
                    <ActionSave handleSaveData={handleSaveData} updateData={updatedData} />
                    <div className={css.headerActionButton} ref={dropdownRef}>
                        <img
                            src={EllipsisIcon}
                            style={{ width: 32, height: 32, cursor: 'pointer' }}
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
                        <img src='/loading_moi_2.svg' alt="Loading..." style={{ width: '650px', height: '550px' }} />
                    </div>
                )}
                <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
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
                        onFilterChanged={onFilterChanged}
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                    />
                </div>

                {/* Invoice Popup */}
                {isInvoicePopupOpen && (
                    <InvoicePopup
                        isOpen={isInvoicePopupOpen}
                        currentUser={currentUser}
                        loadData={loadData}
                        onClose={handleCloseInvoicePopup}
                        type={HOA_DON_TYPE.DauRa}
                    />
                )}
            </div>
        </>
    );
}

'use strict';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
// Ag Grid Function
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import '../agComponent.css';
import AG_GRID_LOCALE_VN from '../locale.jsx';

import { toast } from 'react-toastify';
import { handleSave } from "../handleAction/handleSave.js";
import PopupDeleteAgrid from "../../popUpDelete/popUpDeleteAgrid.jsx";
import { getCurrentUserLogin } from "../../../../apis/userService.jsx";
import { createTimestamp, formatMoney } from "../../../../generalFunction/format.js";
import { createNewHangHoa, getAllHangHoa } from "../../../../apis/hangHoaService.jsx";
import { EllipsisIcon } from "../../../../icon/IconSVG.js";
import css from "./KeToanQuanTri.module.css";
import ActionSave from "../actionButton/ActionSave.jsx";
import ExportableGrid from "../exportFile/ExportableGrid.jsx";
import { onFilterTextBoxChanged } from "../../../../generalFunction/quickFilter.js";
import ActionCreate from "../actionButton/ActionCreate.jsx";
import { getItemFromIndexedDB } from "../../../../storage/storageService.js";
import { loadColumnState, saveColumnStateToLocalStorage } from "../logicColumnState/columnState.jsx";
import ActionResetColumn from "../actionButton/ActionResetColumn.jsx";
import ActionSearch from "../actionButton/ActionSearch.jsx";
import ActionChangeFilter from "../actionButton/ActionChangeFilter.jsx";
import ActionClearFilter from "../actionButton/ActionClearAllFilter.jsx";
import ActionBookMark from "../actionButton/ActionBookMark.jsx";
import { San_Pham } from "../../../../Consts/TITLE_HEADER.js";
import { getAllNhaCungCap } from "../../../../apis/nhaCungCapService.jsx";
import ActionDeleteMany from "../actionButton/ActionDeleteMany.jsx";
import { imageCenter } from "@syncfusion/ej2-react-richtexteditor";
import { setItemInIndexedDB2 } from '../../../KeToanQuanTri/storage/storageService.js';
import {MyContext} from "../../../../MyContext.jsx";
import {findRecordsByConditions} from "../../../../apis/searchModelService.jsx";
import {DuAn, HangHoa} from "../../../../Consts/MODEL_CALL_API.js";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function DMSanPham() {
    const headerTitle = San_Pham;
    const table = 'SanPham';
    const tableCol = 'SanPhamCol';
    const tableFilter = 'SanPhamFilter';
    const key = 'DANHMUC_HH';
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
    const [checkColumn, setCheckColumn] = useState(true);
    const [listNcc, setListNcc] = useState([]);
    const { selectedCompany, currentYear, year} = useContext(MyContext);

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
        };
    });

    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

    const loadData = async () => {
        const conditions = {company : selectedCompany };
        if (currentYear !== 'toan-bo') {
            conditions.year = `${currentYear}`;
        }
        const data = await findRecordsByConditions(HangHoa, conditions);
        const savedFilters = sessionStorage.getItem(tableFilter);
        const filters = JSON.parse(savedFilters);
        if (gridRef.current && gridRef.current.api) {
            if (savedFilters) {
                gridRef.current.api.setRowData(data);
                gridRef.current.api.setFilterModel(filters);
            } else {
                gridRef.current.api.setRowData(data);
            }
            await setItemInIndexedDB2(key, data);
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
    }, [ selectedCompany, currentYear]);

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

    const statusMapping = {
        nl: 'Nguyên liệu',
        sp: 'Sản phẩm'
    };

    const reverseStatusMapping = {
        'Nguyên liệu': 'nl',
        'Sản phẩm': 'sp',
    };
    const [selectedRows, setSelectedRows] = useState([]);

    const onSelectionChanged = () => {
        const selectedData = gridRef.current.api
            .getRenderedNodes() // Lấy các node đang được hiển thị sau khi filter
            .filter(node => node.isSelected()) // Chỉ giữ lại các node được chọn
            .map(node => ({ ...node.data, show: false }));

        setSelectedRows(selectedData);
    };

    useEffect(() => {

        const fetchData = async () => {
            try {
                const ncc = await getAllNhaCungCap()

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
                        field: 'checkbox',
                        headerCheckboxSelection: true, // Hiển thị checkbox ở đầu cột
                        checkboxSelection: true, // Hiển thị checkbox trong mỗi hàng
                        width: 40,
                        pinned: 'left',
                        suppressMenu: true,
                        editable: false,
                        cellStyle: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
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
                        field: 'code',
                        headerName: 'Mã sản phẩm',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên sản phẩm',
                        width: 250,
                        ...filter(),
                    },
                    {
                        field: 'id_nha_cung_cap',
                        headerName: 'Nhà cung cấp',
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            values: ncc.map(e => e.id), // Chỉ truyền chuỗi hiển thị
                        },
                        cellRenderer: params => {
                            let result = ncc.find(e => params.value === e.id);
                            return result ? `${result.code} | ${result.name}` : null; // Hiển thị code và name
                        },
                        valueFormatter: params => {
                            let result = ncc.find(e => params.value === e.id);
                            return result ? `${result.code} | ${result.name}` : null; // Hiển thị trong ô sau khi chọn
                        },
                        valueParser: params => {
                            let result = ncc.find(e => `${e.code} | ${e.name}` === params.newValue);
                            return result ? result.id : params.newValue;
                        },
                        width: 250,
                        ...filter(),
                    }
                    ,
                    {
                        field: 'dvt',
                        headerName: 'DVT',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'thue_vat',
                        headerName: 'Thuế VAT',
                        cellClass: 'text-right',
                        width: 150,
                        headerClass: 'right-align-important',
                        cellStyle: { textAlign: 'right' },
                        valueFormatter: (params) => {
                            if (params.value === null || params.value === undefined || params.value === '') {
                                return '';
                            }
                            return `${params.value}%`;
                        },
                        ...filter(),

                    },
                    {
                        field: 'gia_ban',
                        headerName: 'Giá bán',
                        width: 150,
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' },
                        ...filter(),
                    },
                    {
                        field: 'tk_doanh_thu',
                        headerName: 'Tài khoản doanh thu',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'tk_gia_von',
                        headerName: 'Tài khoản giá vốn',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'loai',
                        headerName: 'Loại',
                        width: 150,
                        ...filter(),
                        cellEditor: 'agSelectCellEditor',
                        cellEditorParams: {
                            values: Object.values(statusMapping)
                        },
                        valueFormatter: (params) => {
                            return statusMapping[params.value] || params.value;
                        },
                        valueSetter: (params) => {
                            const newValue = reverseStatusMapping[params.newValue];
                            params.data[params.colDef.field] = newValue;
                            return true;
                        }
                    },
                    {
                        field: 'nhom_hh',
                        headerName: 'Nhóm sản phẩm',
                        width: 150,
                        ...filter(),
                    },

                    {
                        field: 'tk_hang_ton',
                        headerName: 'Tài khoản hàng tồn',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'theo_doi_ton',
                        headerName: 'Theo dõi tồn',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'ton_toi_thieu',
                        headerName: 'Tồn tối thiểu',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'ton_toi_da',
                        headerName: 'Tồn tối đa',
                        width: 100,
                        ...filter(),
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

    const handleAddRow = async () => {
        const newData = {
            created_at: createTimestamp(),
            user_create: currentUser.email,
            year : year,
            company: selectedCompany
        };
        await createNewHangHoa(newData);
        toast.success("Tạo dòng thành công", { autoClose: 1000 })
        await loadData()
    };

    const handleCellValueChanged = async (event) => {
        const updatedRow = event.data;
        let value = updatedRow.thue_vat;
        if (value) {
            const filteredValue = value.replace(/[^0-9.]/g, '');
            if (value !== filteredValue) {
                updatedRow.thue_vat = filteredValue;
                event.api.refreshCells({ rowNodes: [event.node], force: true });
                return;
            }
        }
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

    const handleSaveData = async (value) => {
        try {
            await handleSave(value, table, setUpdatedData, currentUser)
            await loadData()
            toast.success("Cập nhật thành công", { autoClose: 1000 })
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
        onSelectionChanged()
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
                    <ActionDeleteMany handleSaveData={handleSaveData} updateData={selectedRows} />
                    <ActionCreate handleAddRow={handleAddRow} />
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
                        suppressRowClickSelection={true}
                        onSelectionChanged={onSelectionChanged}
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
    );
}

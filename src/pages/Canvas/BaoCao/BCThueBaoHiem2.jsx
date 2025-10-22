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

import { toast } from 'react-toastify';
import {
    BC_THUE_BAO_HIEM,
    BC_TIEN,
    BC_TON_KHO,
    Can_Doi_Phat_Sinh,
    KHONG_THE_TRUY_CAP
} from "../../../Consts/TITLE_HEADER.js";
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
import {MyContext} from "../../../MyContext.jsx";
import {getPermissionDataCty} from "../getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../CONST.js";
import ActionSelectCompanyBaoCao from "../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";
import { Button, Dropdown } from 'antd';
import { ChevronDown } from 'lucide-react';
import ActionMenuDropdown from '../../KeToanQuanTri/ActionButton/ActionMenuDropdown.jsx';
import Loading from '../../Loading/Loading.jsx';
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function BCThueBaoHiem2() {
    const { id } = useParams();
    const headerTitle = BC_THUE_BAO_HIEM;
    const tableCol = 'BCThueBaoHiem2';
    const tableFilter = 'BCThueBaoHiemFilter2';
    const key = 'BAOCAO_THUE_BAOHIEM';
    const table = key+ "_COMPANY";
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
    const [titleName, setTitleName] = useState('');
    const [listCom, setListCom] = useState([])
    const [companySelected, setCompanySelected] = useState(getLocalStorageSettings().companySelected || [])
    const {
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
    } = useContext(MyContext) || {};

    function getLocalStorageSettings() {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            isStatusFilter: storedSettings?.isStatusFilter ?? false,
            companySelected: storedSettings?.companySelected ?? [],
        };
    };

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
            const user = await getCurrentUserLogin();
            const listComs = await getPermissionDataCty('cty', user, userClasses, fetchUserClasses, uCSelected_CANVAS)
            if (listComs?.length > 0 || user.data.isAdmin || listComs.some(e => e.code == 'HQ')) {
                setListCom(listComs);
                setTitleName(CANVAS_DATA_PACK.find(e => e.value == key)?.name)
            } else {
                setTitleName(KHONG_THE_TRUY_CAP)
            }

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
        }
    };

    useEffect(() => {
        fetchAndSetTitleName();
    }, [])

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
        if (companySelected && companySelected.length > 0) {

            let data = await getAllTaiKhoan();
            if (companySelected.some(e => e.code != 'HQ')) {
                data = data.filter(e => companySelected.some(c => c.code == e.company));
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

            const nghiaVuThue = calculateSumForCodes(['333']) - calculateSumForCodes(['133']);
            const baoHiemXaHoi = calculateSumForCode(['3382', '3383', '3385', '3387']);
            const phaiTraKhac = calculateSumForCode(['3388']);

            let newData = [
                {name: 'Nghĩa vụ thuế', net_cuoi_ky: nghiaVuThue, layer: '1.1'},
                {name: 'Bảo hiểm xã hội', net_cuoi_ky: baoHiemXaHoi, layer: '1.2'},
                {name: 'Phải trả khác', net_cuoi_ky: phaiTraKhac, layer: '1.3'}
            ];

            const savedFilters = sessionStorage.getItem(tableFilter);
            if (gridRef.current?.api) {
                await setItemInIndexedDB2(key, newData);
                gridRef.current.api.setRowData(newData);
                if (savedFilters) gridRef.current.api.setFilterModel(JSON.parse(savedFilters));
            }
            setLoading(false);
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
        fetchCurrentUser()
        loadData();
    }, []);

    useEffect(() => {
        loadData();
    }, [isHideNull, companySelected]);

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

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const items = [
        {
            key: '0',
            label: (
                <span>{isStatusFilter ? '✅ Bật Filter' : '❌ Tắt Filter'}</span>
            ),
            onClick: handleChangeStatusFilter,
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
                </div>
                <div className={css.headerAction}>
                    <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                               valueSelected={companySelected}/>
                    {/*<div className={`${css.headerActionButton} ${css.buttonOn}`} onClick={() => {*/}
                    {/*    setIsHideNull(!isHideNull)*/}
                    {/*}}><span>Ẩn dòng trống</span>*/}
                    {/*</div>*/}
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

                    <ActionMenuDropdown popoverContent={popoverContent}
                                        dropdownOpen={dropdownOpen}
                                        setDropdownOpen={setDropdownOpen}
                    />
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

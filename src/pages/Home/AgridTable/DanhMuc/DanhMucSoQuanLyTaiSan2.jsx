import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import dayjs from 'dayjs';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import '../agComponent.css';
import AG_GRID_LOCALE_VN from '../locale.jsx';

import { Button, DatePicker, Dropdown, message, Select } from 'antd';
import { IconButton, Tooltip } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { SaveTron } from "../../../../icon/IconSVG.js";
import PopupDeleteAgrid from "../../popUpDelete/popUpDeleteAgrid.jsx";

// API
import { getAllTaiKhoan } from '../../../../apis/taiKhoanService.jsx';
import {
    createNewSoQuanLyTaiSan,
    getAllSoQuanLyTaiSan,
    updateSoQuanLyTaiSan
} from '../../../../apis/soQuanLyTaiSanService.jsx';
import { createSetting, getSettingByType, updateSetting } from '../../../../apis/settingService.jsx';
import css from "./KeToanQuanTri.module.css";
import { onFilterTextBoxChanged } from "../../../../generalFunction/quickFilter.js";
import ActionSearch from "../actionButton/ActionSearch.jsx";
import ActionChangeFilter from "../actionButton/ActionChangeFilter.jsx";
import ActionResetColumn from "../actionButton/ActionResetColumn.jsx";
import { getItemFromIndexedDB } from "../../../../storage/storageService.js";
import { setItemInIndexedDB2 } from '../../../KeToanQuanTri/storage/storageService.js';
import { loadColumnState, saveColumnStateToLocalStorage } from "../logicColumnState/columnState.jsx";
import {KHONG_THE_TRUY_CAP, So_Qly_Tai_San} from "../../../../Consts/TITLE_HEADER.js";
import ActionBookMark from "../actionButton/ActionBookMark.jsx";
import {MyContext} from "../../../../MyContext.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import {getPermissionDataBC} from "../../../Canvas/getPermissionDataBC.js";
import NotAccessible from "../../../Canvas/NotAccessible.jsx";
import {getPermissionDataCty} from "../../../Canvas/getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../CONST.js";
import ActionSelectCompanyBaoCao from "../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";
import { ChevronDown } from 'lucide-react';
import ActionMenuDropdown from '../../../KeToanQuanTri/ActionButton/ActionMenuDropdown.jsx';
import Loading from '../../../Loading/Loading.jsx';

const { RangePicker } = DatePicker;

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function DMSoQuanLyTaiSan2() {
    const headerTitle = So_Qly_Tai_San;
    const tableCol = 'SoQuanLyTaiSanCol2';
    const key = 'BAOCAO_TAISANCODINH';
    const table = key+ "_COMPANY2";
    const gridRef = useRef(null);
    const [idSetting, setIdSetting] = useState(null);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);
    const [tkDropDown, setTkDropDown] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const monthFormat = 'MM/YYYY';
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [checkColumn, setCheckColumn] = useState(true);
    const [viewMode, setViewMode] = useState('Mặc định');
    const [titleName, setTitleName] = useState('');
    const [listCom, setListCom] = useState([])
    const [companySelected, setCompanySelected] = useState(getLocalStorageSettings().companySelected || [])
    const {  currentYear , year,
        userClasses,
        fetchUserClasses, uCSelected_CANVAS } = useContext(MyContext)

    function getLocalStorageSettings (){
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            companySelected: storedSettings?.companySelected ?? [],
            isShowAll1: storedSettings?.isShowAll1 ?? true,
            isSortByDay: storedSettings?.isSortByDay ?? true,
            isSortDoanhThu: storedSettings?.isSortDoanhThu ?? false,
            isSortChiPhi: storedSettings?.isSortChiPhi ?? false,
            isStatusFilter: storedSettings?.isStatusFilter ?? false,
        };
    }
    const [isStatusFilter, setIsStatusFilter] = useState(getLocalStorageSettings().isStatusFilter);


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
        fetchAndSetTitleName()
    }, []);
    useEffect(() => {
        const tableSettings = {
            isStatusFilter,
            companySelected,
        };

        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isStatusFilter, companySelected]);

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            suppressMenu: true,
            cellStyle: { fontSize: '13.5px' },
            resizable: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    }, []);

    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

    const getSheetData = async () => {
        if (companySelected && companySelected.length > 0) {
            try {
                let accList = await getAllTaiKhoan();
                let response = await getAllSoQuanLyTaiSan();
                if (companySelected.some(e => e.code != 'HQ')) {
                    accList = accList.filter(e => companySelected.some(c => c.code == e.company));
                    response = response.filter(e => companySelected.some(c => c.code == e.company));
                }
                const formattedAccounts = accList.map(account => (`${account.code}`));
                setTkDropDown(formattedAccounts);
                if (startDate && endDate) {
                    response.forEach((row) => {
                        if (row.nguyen_gia_tai_ngay_ghi_nhan && row.so_thang_phan_bo && row.ngay_bat_dau_khau_hao) {
                            const startDate = new Date(row.ngay_bat_dau_khau_hao);
                            const [currentDay, initialMonth, initialYear] = [startDate.getDate(), startDate.getMonth() + 1, startDate.getFullYear()];
                            const soThangPhanBo = currentDay === 1 ? row.so_thang_phan_bo : row.so_thang_phan_bo - 1;
                            const valueEachDay = row.nguyen_gia_tai_ngay_ghi_nhan / (row.so_thang_phan_bo * 30);

                            let [month, year] = [initialMonth, initialYear];

                            const addMonthField = (month, year, value) => {
                                const field = `T${month.toString().padStart(2, '0')}/${year}`;
                                row[field] = value;
                            };

                            if (row.so_thang_phan_bo === 1) {
                                addMonthField(month, year, row.nguyen_gia_tai_ngay_ghi_nhan);
                                return;
                            }

                            if (currentDay === 1) {
                                for (let i = 0; i < soThangPhanBo; i++) {
                                    addMonthField(month, year, valueEachDay * 30);
                                    month = month === 12 ? 1 : month + 1;
                                    year = month === 1 ? year + 1 : year;
                                }
                            } else {
                                const firstMonthDays = 30 - currentDay + 1;
                                const lastMonthDays = currentDay - 1;

                                addMonthField(initialMonth, initialYear, valueEachDay * firstMonthDays);

                                month = month === 12 ? 1 : month + 1;
                                year = month === 1 ? year + 1 : year;

                                for (let i = 0; i < soThangPhanBo; i++) {
                                    addMonthField(month, year, valueEachDay * 30);
                                    month = month === 12 ? 1 : month + 1;
                                    year = month === 1 ? year + 1 : year;
                                }

                                addMonthField(month, year, valueEachDay * lastMonthDays);
                            }

                            const currentDate = new Date();
                            if (currentDate < startDate) {
                                row.gia_tri_con_lai_cuoi_ky = row.nguyen_gia_tai_ngay_ghi_nhan;
                                row.khau_hao_trong_ky = 0;
                            } else {
                                const gapDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                                row.gia_tri_con_lai_cuoi_ky = (row.so_thang_phan_bo * 30 - gapDays) * valueEachDay;
                                row.khau_hao_trong_ky = gapDays * valueEachDay;
                            }
                        }
                    })
                }
                await setItemInIndexedDB2(key, response);
                setRowData(response);
                setIsLoading(false);
            } catch (error) {
                console.error(error);
                // message.error('Lỗi khi lấy dữ liệu từ API');
            }
        }
    };

    const getSetting = async () => {
        try {
            let settings = await getSettingByType(table);
            if (!settings) {
                const startDate = dayjs().startOf('month').format(monthFormat);
                const endDate = dayjs().add(1, 'month').startOf('month').format(monthFormat);
                settings = await createSetting({
                    type: table,
                    setting: {
                        startDate: startDate,
                        endDate: endDate
                    }
                })
            }
            setIdSetting(settings.id);
            setStartDate(dayjs(settings.setting.startDate, monthFormat));
            setEndDate(dayjs(settings.setting.endDate, monthFormat));
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi lấy dữ liệu từ API');
        }
    }

    useEffect(() => {
        getSetting();
        getSheetData();
    }, [viewMode , companySelected , currentYear]);

    const handleViewModeChange = (value) => {
        setViewMode(value);
    };

    const onGridReady = useCallback((params) => {
    }, []);

    const handleAddNewRow = async () => {
        try {
            const newData = {
                year : year,
                company : selectedCompany
            }
            await createNewSoQuanLyTaiSan(newData)
            await getSheetData();
        } catch (error) {
            console.error("Failed to add new row:", error);
            message.error("Failed to add new row");
        }
    }

    const handleCellValueChanged = useCallback((params) => {
        const newValue = params.colDef.field.includes('thoi_gian') || params.colDef.field.includes('ngay_ghi_nhan')
            ? (params.newValue instanceof Date ? params.newValue.toISOString() : params.newValue)
            : params.newValue;

        setPendingChanges(prev => {
            const existingChangeIndex = prev.findIndex(
                change => change.id === params.data.id && change.field === params.colDef.field
            );

            if (existingChangeIndex !== -1) {
                const updatedChanges = [...prev];
                updatedChanges[existingChangeIndex] = {
                    id: params.data.id,
                    field: params.colDef.field,
                    newValue: newValue
                };
                return updatedChanges;
            }
            return [
                ...prev,
                {
                    id: params.data.id,
                    field: params.colDef.field,
                    newValue: newValue
                }
            ];
        });
    }, [rowData]);

    const handleSaveAllChanges = async () => {
        if (pendingChanges.length === 0) {
            message.info('Không có thay đổi để lưu');
            return;
        }

        setIsLoading(true);
        try {
            const updatePromises = pendingChanges.map(change =>
                updateSoQuanLyTaiSan({
                    id: change.id,
                    [change.field]: change.newValue
                })
            );
            await Promise.all(updatePromises);
            setPendingChanges([]);
            message.success(`Đã lưu ${updatePromises.length} thay đổi`);
            getSheetData();
        } catch (error) {
            console.error("Failed to save all changes:", error);
            message.error("Không thể lưu tất cả các thay đổi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateRangeChange = async (dates) => {
        if (!dates || dates.length !== 2) {
            message.error('Vui lòng chọn khoảng thời gian hợp lệ');
            return;
        }

        try {
            const startDate = dates[0].format(monthFormat);
            const endDate = dates[1].format(monthFormat);

            await updateSetting({
                id: idSetting,
                type: table,
                setting: {
                    startDate: startDate,
                    endDate: endDate
                }
            });

            setStartDate(dates[0]);
            setEndDate(dates[1]);

            getSheetData();
        } catch (error) {
            console.error('Lỗi khi cập nhật khoảng thời gian:', error);
            message.error('Không thể cập nhật khoảng thời gian');
        }
    };

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

    const handleChangeStatusFilter = () => {
        setIsStatusFilter((prev) => {
            return !prev;
        });
    };


    useEffect(() => {
        const fetchColumnDefs = async () => {
            try {
                const savedColumnState = await getItemFromIndexedDB(tableCol) || []
                const baseColumns = [
                    {
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
                                    reload={getSheetData}
                                />
                            );
                        },
                        editable: false,
                    },
                    {
                        field: 'id',
                        headerName: 'STT',
                        width: 90,
                        pinned: 'left',
                        ...filter(),
                    },
                    {
                        field: 'year',
                        headerName: 'Năm',
                        width: 90,
                        pinned: 'left',
                        ...filter(),
                    },
                    {
                        field: 'company',
                        headerName: 'Công ty',
                        width: 90,
                        pinned: 'left',
                        ...filter(),
                    },
                    {
                        field: 'code',
                        headerName: 'Mã tài sản',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên tài sản',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'kho',
                        headerName: 'Kho',
                        width: 75,
                        ...filter(),
                    },
                    {
                        field: 'tk_nguyen_gia',
                        headerName: 'Tài khoản nguyên giá',
                        width: 170,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            values: tkDropDown,
                        },
                        ...filter(),

                    },
                    {
                        field: 'tk_khau_hao',
                        headerName: 'Tài khoản khấu hao',
                        width: 170,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            values: tkDropDown,
                        },
                        ...filter(),

                    },
                    {
                        field: 'chung_tu',
                        headerName: 'Chứng từ',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'ngay_ghi_nhan_tai_san',
                        headerName: 'Ngày ghi nhận tài sản',
                        width: 170,
                        cellEditor: 'agDateCellEditor',
                        cellEditorParams: {
                            filterParams: {
                                buttons: ['today', 'clear']
                            },
                            dateFormat: 'dd/MM/yyyy'
                        },
                        valueFormatter: (params) => {
                            if (params.value) {
                                const date = new Date(params.value);
                                return date.toLocaleDateString('en-GB');
                            }
                            return '';
                        },
                        valueParser: (params) => {
                            const parsedDate = new Date(params.newValue);
                            return isNaN(parsedDate) ? null : parsedDate.toISOString();
                        },
                        ...filter(),
                    },
                    {
                        field: 'nguyen_gia_tai_ngay_ghi_nhan',
                        headerName: 'Nguyên giá tại ngày ghi nhận',
                        width: 210,
                        valueFormatter: (params) => {
                            if (params.value == null) return '';
                            return new Intl.NumberFormat('en-US').format(Number(params.value));
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
                        ...filter(),
                    },
                    {
                        field: 'khau_hao_tai_ngay_ghi_nhan',
                        headerName: 'Khấu hao tại ngày ghi nhận',
                        width: 200,
                        valueFormatter: (params) => {
                            if (params.value == null) return '';
                            return new Intl.NumberFormat('en-US').format(Number(params.value));
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
                        hide: !(viewMode == 'Mặc định'),
                        ...filter(),

                    },
                    {
                        field: 'khau_hao_trong_ky',
                        headerName: 'Khấu hao trong kỳ',
                        width: 150,
                        valueFormatter: (params) => {
                            if (params.value == null) return '';
                            const roundedValue = Math.round(Number(params.value));
                            return new Intl.NumberFormat('en-US').format(roundedValue);
                        },
                        cellRenderer: (params) => {
                            if (params.value == null) return '';
                            const roundedValue = Math.round(Number(params.value));
                            return new Intl.NumberFormat('en-US').format(roundedValue);
                        },
                        hide: (viewMode == 'Mặc định'),
                        ...filter(),

                    },
                    {
                        field: 'gia_tri_con_lai_tai_ngay_ghi_nhan',
                        headerName: 'Giá trị còn lại tại ngày ghi nhận',
                        width: 230,
                        valueFormatter: (params) => {
                            if (params.value == null) return '';
                            return new Intl.NumberFormat('en-US').format(Number(params.value));
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
                        hide: !(viewMode == 'Mặc định'),
                        ...filter(),
                    },
                    {
                        field: 'gia_tri_con_lai_cuoi_ky',
                        headerName: 'Giá trị còn lại cuối kỳ',
                        width: 150,
                        valueFormatter: (params) => {
                            if (params.value == null) return '';
                            const roundedValue = Math.round(Number(params.value));
                            return new Intl.NumberFormat('en-US').format(roundedValue);
                        },
                        cellRenderer: (params) => {
                            if (params.value == null) return '';
                            const roundedValue = Math.round(Number(params.value));
                            return new Intl.NumberFormat('en-US').format(roundedValue);
                        },
                        editable: false,
                        hide: (viewMode == 'Mặc định'),
                        ...filter(),

                    },
                    {
                        field: 'ngay_bat_dau_khau_hao',
                        headerName: viewMode == 'Mặc định' ? 'Ngày bắt đầu Phân bổ khấu hao' : 'Ngày bắt đầu khấu hao',
                        width: 250,
                        cellEditor: 'agDateCellEditor',
                        cellEditorParams: {
                            filterParams: {
                                buttons: ['today', 'clear']
                            },
                            dateFormat: 'dd/MM/yyyy'
                        },
                        valueFormatter: (params) => {
                            if (params.value) {
                                const date = new Date(params.value);
                                return date.toLocaleDateString('en-GB');
                            }
                            return '';
                        },
                        valueParser: (params) => {
                            const parsedDate = new Date(params.newValue);
                            return isNaN(parsedDate) ? null : parsedDate.toISOString();
                        },
                        ...filter(),

                    },
                    {
                        field: 'so_thang_phan_bo',
                        headerName: 'Số tháng phân bổ',
                        cellEditor: 'agNumberCellEditor',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'bo_phan_su_dung',
                        headerName: 'Bộ phận sử dụng',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'khoan_muc_kqkd',
                        headerName: 'Khoản mục KQKD',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'trang_thai',
                        headerName: 'Trạng thái',
                        width: 150,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            values: ['Đang dùng', 'Ngừng', 'Thanh lý'],
                        },
                        ...filter(),

                    },
                ]

                let dynamicColumns = [];
                if (viewMode === 'Phân bổ' && startDate && endDate) {
                    let currentMonth = startDate.clone();
                    while (currentMonth <= endDate) {
                        dynamicColumns.push({
                            field: `T${currentMonth.format('MM/YYYY')}`,
                            headerName: `T${currentMonth.format('MM/YYYY')}`,
                            editable: false,
                            valueFormatter: (params) => {
                                if (params.value == null) return '';
                                const roundedValue = Math.round(Number(params.value));
                                return new Intl.NumberFormat('en-US').format(roundedValue);
                            },
                            cellRenderer: (params) => {
                                if (params.value == null) return '';
                                const roundedValue = Math.round(Number(params.value));
                                return new Intl.NumberFormat('en-US').format(roundedValue);
                            },
                        });
                        currentMonth = currentMonth.add(1, 'month');
                    }
                }
                const updatedColDefs = [
                    ...baseColumns.slice(0, 2),
                    ...baseColumns.slice(2),
                    ...(viewMode === 'Phân bổ' ? dynamicColumns : [])
                ]
                if (savedColumnState.length) {
                    setColDefs(loadColumnState(updatedColDefs, savedColumnState));
                } else {
                    console.log(key+'_FIELD', updatedColDefs.map(item => {return {field: item.field, headerName: item.headerName}}))
                    setColDefs(updatedColDefs);
                }

            } catch (error) {
                console.log(error)
                message.error('Error fetching data:', error);
            }
        }

        fetchColumnDefs();
    }, [rowData, viewMode, startDate, endDate, isStatusFilter, checkColumn]);

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
            <NotAccessible NotAccessible={titleName}/>
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
                </div>
                <div className={css.headerAction}>
                    <div className={`${css.headerActionButton} `}>
                        <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                                   valueSelected={companySelected}/>
                        <Select
                            className={css.customSelect}
                            style={{ width: 130 }}
                            value={viewMode}
                            onChange={handleViewModeChange}
                        >
                            <Select.Option value="Mặc định">Mặc định</Select.Option>
                            <Select.Option value="Phân bổ">Phân bổ</Select.Option>
                        </Select>
                        {viewMode === 'Phân bổ' && startDate && endDate && (
                            <RangePicker
                                picker="month"
                                value={[startDate, endDate]}
                                format={monthFormat}
                                onChange={handleDateRangeChange}
                            />
                        )}
                        <Tooltip title="Thêm dòng mới" >
                            <IconButton
                                onClick={handleAddNewRow}
                                size="small"
                                disabled={isLoading || !rowData}
                            >
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cập nhật dữ liệu" >
                            <IconButton
                                onClick={getSheetData}
                                size="small"
                                disabled={isLoading || !rowData}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>

                        <ActionMenuDropdown popoverContent={popoverContent}
                                            dropdownOpen={dropdownOpen}
                                            setDropdownOpen={setDropdownOpen}
                        />

                        {Object.keys(pendingChanges).length > 0 && (
                            <Tooltip title="Lưu tất cả các thay đổi" >
                                <div className={'save-btn'} onClick={handleSaveAllChanges}>
                                    <img src={SaveTron} alt="" /> Lưu
                                </div>
                            </Tooltip>
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
                <Loading loading={isLoading}/>
                <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        ref={gridRef}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onCellValueChanged={handleCellValueChanged}
                        suppressContextMenu={true}
                        suppressCellSelection={true}
                        suppressMovableColumns={false}
                        rowData={rowData}
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                    />
                </div>
            </div>
        </>
    )
};

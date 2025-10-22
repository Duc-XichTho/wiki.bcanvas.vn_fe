import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import dayjs from 'dayjs';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
import '../../../AgridTable/agComponent.css';


import {Button, DatePicker, message, Select, Menu, Typography} from 'antd';
import {IconButton, Tooltip} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';

// API
import css from "../../../AgridTable/DanhMuc/KeToanQuanTri.module.css";
import {getAllTaiKhoan} from "../../../../../apis/taiKhoanService.jsx";
import {
    createNewSoQuanLyTaiSan,
    getAllSoQuanLyTaiSan,
    updateSoQuanLyTaiSan
} from "../../../../../apis/soQuanLyTaiSanService.jsx";
import {createSetting, getSettingByType, updateSetting} from "../../../../../apis/settingService.jsx";
import ActionChangeFilter from "../../../AgridTable/actionButton/ActionChangeFilter.jsx";
import {getItemFromIndexedDB} from "../../../../../storage/storageService.js";
import {loadColumnState, saveColumnStateToLocalStorage} from "../../../AgridTable/logicColumnState/columnState.jsx";
import AG_GRID_LOCALE_VN from "../../../AgridTable/locale.jsx";
import {SaveTron} from "../../../../../icon/IconSVG.js";
import PopupDeleteAgrid from "../../../popUpDelete/popUpDeleteAgrid.jsx";
import {useNavigate, useParams} from "react-router-dom";
import {getCardDataById} from "../../../../../apis/cardService.jsx";
import {MyContext} from "../../../../../MyContext.jsx";

const {RangePicker} = DatePicker;

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function DanhMucSoQuanLyTaiSanForDK() {
    const table = 'SoQuanLyTaiSan';
    const tableCol = 'SoQuanLyTaiSanCol';
    const gridRef = useRef(null);
    const [idSetting, setIdSetting] = useState(null);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [currentCard, setCurrentCard] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(false);
    const [isShowKHPB, setIsShowKHPB] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);
    const [tkDropDown, setTkDropDown] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const monthFormat = 'MM/YYYY';
    const [checkColumn, setCheckColumn] = useState(true);
    const {id, idCard, idStep} = useParams()
    const navigate = useNavigate()
    const {  currentYear , selectedCompany , year } = useContext(MyContext)

    const [viewMode, setViewMode] = useState('Phân bổ');

    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            isShowAll1: storedSettings?.isShowAll1 ?? true,
            isSortByDay: storedSettings?.isSortByDay ?? true,
            isSortDoanhThu: storedSettings?.isSortDoanhThu ?? false,
            isSortChiPhi: storedSettings?.isSortChiPhi ?? false,
            isStatusFilter: storedSettings?.isStatusFilter ?? false,
        };
    };
    const [isStatusFilter, setIsStatusFilter] = useState(getLocalStorageSettings().isStatusFilter);

    useEffect(() => {
        const tableSettings = {
            isStatusFilter
        };

        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isStatusFilter, selectedMonth]);

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            suppressMenu: true,
            cellStyle: {fontSize: '13.5px'},
            resizable: true,
        };
    }, []);

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const getSheetData = async () => {
        try {
            if (idCard) {
                const card = await getCardDataById(idCard)
                setCurrentCard(card)
            }

            const accList = await getAllTaiKhoan();

            const formattedAccounts = accList.map(account => (`${account.code}`));
            setTkDropDown(formattedAccounts);
            const response = await getAllSoQuanLyTaiSan();
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
            setRowData(response);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            // message.error('Lỗi khi lấy dữ liệu từ API');
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
            // message.error('Lỗi khi lấy dữ liệu từ API');
        }
    }

    useEffect(() => {
        getSetting();
    }, [viewMode, selectedMonth]);
    useEffect(() => {
        getSheetData();
    }, [viewMode, selectedMonth, startDate, endDate]);

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
            getSheetData();
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
            setStartDate(null)
            setEndDate(null)
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
                        cellStyle: {alignItems: "center", display: "flex"},
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
                        field: 'tk_chi_phi',
                        headerName: 'Tài khoản chi phí',
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
                    setColDefs(updatedColDefs);
                }

            } catch (error) {
                console.log(error)
                message.error('Error fetching data:', error);
            }
        }

        fetchColumnDefs();
    }, [rowData, viewMode, startDate, endDate, isStatusFilter, checkColumn]);

    const handleTaoDKKHPB = () => {
        if (!viewMode.includes('Phân bổ')) {
            message.warning('Vui lòng chọn dạng phân bổ');
            return;
        }
        if (!startDate || !endDate) {
            message.warning('Vui lòng chọn kỳ phân bổ');
            return;
        }

        if (id && idCard && idStep) {
            message.info('Đang chuyển hướng');
            const nextStep = currentCard?.cau_truc.find(e => e?.name?.includes('Định khoản'));
            const month = selectedMonth.$M + 1;
            const year = selectedMonth.$y;
            const dataForDK = [];

            console.log(`T${month}/${year}`);

            // Create a temporary object to hold grouped data
            const groupedData = {};

            for (const row of rowData) {
                const key = `${row.tk_chi_phi}-${row.tk_khau_hao}`; // Unique key for grouping
                const fieldKey = `T${month}/${year}`;

                if (row?.[fieldKey] && row.tk_khau_hao && row.tk_chi_phi) {
                    if (!groupedData[key]) {
                        // Initialize the group if it doesn't exist
                        groupedData[key] = {
                            so_tien_VND: 0,
                            tk_no: row.tk_chi_phi,
                            tk_co: row.tk_khau_hao,
                            year,
                            month,
                            dien_giai: `Khấu hao kỳ T${month}/${year}`
                        };
                    }
                    // Aggregate the values
                    groupedData[key].so_tien_VND += row[fieldKey];
                    // groupedData[key].bo_phan_code.push(row.bo_phan_su_dung);
                }
            }

            // Convert the grouped data object to an array
            for (const group of Object.values(groupedData)) {
                dataForDK.push({
                    so_tien_VND: group.so_tien_VND,
                    tk_no: group.tk_no,
                    tk_co: group.tk_co,
                    year,
                    month,
                    dien_giai: `Khấu hao kỳ T${month}/${year}`
                    // bo_phan_code: group.bo_phan_code.join(', ') // Combine into a single string
                });
            }

            // Navigate and pass dataForDK as part of the state
            navigate(`/accounting/chains/${id}/cards/${idCard}/steps/${parseInt(nextStep.id)}`, {state: {rowData: dataForDK}});
        }
    };
    ;


    const handleShowDKKHPB = () => {
        getSheetData()
        setIsShowKHPB(prevState => !prevState)

    }
    const handleCloseDKKHPB = () => {
        setIsShowKHPB(false)

    }


    return (
        <>
            <div className={css.headerPowersheet}>
                <div className={css.headerActionFilter}>
                    <ActionChangeFilter isStatusFilter={isStatusFilter}
                                        handleChangeStatusFilter={handleChangeStatusFilter}/>
                </div>
                <div className={css.headerAction}>
                    <div className={`${css.headerActionButton} `}>
                        <Select
                            style={{width: 120}}
                            value={viewMode}
                            onChange={handleViewModeChange}
                        >
                            <Select.Option value="Phân bổ">Phân bổ</Select.Option>
                            <Select.Option value="Mặc định">Mặc định</Select.Option>

                        </Select>
                        {viewMode === 'Phân bổ' && (
                            <RangePicker
                                picker="month"
                                value={[startDate, endDate]}
                                format={monthFormat}
                                onChange={handleDateRangeChange}
                            />
                        )}


                    </div>
                    <div className={`${css.headerActionButton}`}>
                        <Button onClick={handleShowDKKHPB}>
                            Tạo định khoản KHPB
                        </Button>
                        {isShowKHPB && (
                            <Menu
                                style={{
                                    position: 'absolute',
                                    zIndex: 1000,
                                    top: '35px',
                                    padding: '5px 10px',
                                    border: '1px solid #E1E1E1',
                                    borderRadius: '5px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                }}
                                onClick={handleCloseDKKHPB}
                            >
                                <Typography>Chọn kỳ lấy dữ liệu:</Typography>
                                <DatePicker
                                    onChange={(e) => setSelectedMonth(e)}
                                    allowClear
                                    picker="month"
                                />
                                <Button disabled={!selectedMonth} onClick={handleTaoDKKHPB}>Chuyển tới định
                                    khoản</Button>


                            </Menu>
                        )}
                    </div>
                    <Tooltip title="Thêm dòng mới" >
                        <IconButton
                            onClick={handleAddNewRow}
                            size="small"
                            disabled={isLoading || !rowData}
                        >
                            <AddIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Cập nhật dữ liệu" >
                        <IconButton
                            onClick={getSheetData}
                            size="small"
                            disabled={isLoading || !rowData}
                        >
                            <RefreshIcon/>
                        </IconButton>
                    </Tooltip>
                    {Object.keys(pendingChanges).length > 0 && (
                        <Tooltip title="Lưu tất cả các thay đổi" >
                            <div className={'save-btn'} onClick={handleSaveAllChanges}>
                                <img src={SaveTron} alt=""/> Lưu
                            </div>
                        </Tooltip>
                    )}
                </div>
            </div>
            <div
                style={{
                    height: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginTop: '15px',
                }}
            >
                {isLoading && (
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
                        <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>
                    </div>
                )}
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

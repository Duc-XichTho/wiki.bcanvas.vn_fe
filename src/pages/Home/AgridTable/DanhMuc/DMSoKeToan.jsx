import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {toast} from 'react-toastify';
import css from './KeToanQuanTri.module.css'
import pLimit from 'p-limit';
// AG GRID
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import '../agComponent.css';
import AG_GRID_LOCALE_VN from '../locale.jsx';
import {getAllCauHinh} from '../../../../apis/cauHinhService.jsx';
import {getSettingByType} from '../../../../apis/settingService.jsx';
// API
import {createNewSoKeToan, getAllSoKeToan, updateSoKeToan} from '../../../../apis/soketoanService.jsx';
import {getAllKmf} from '../../../../apis/kmfService.jsx';
import {getAllHangHoa} from "../../../../apis/hangHoaService.jsx";
import {getAllDuAn} from "../../../../apis/duAnService.jsx";
import {getAllKmtc} from "../../../../apis/kmtcService.jsx";
import {getAllKhachHang} from "../../../../apis/khachHangService.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import ExportableGrid from "../exportFile/ExportableGrid.jsx";
import {loadColumnState, saveColumnStateToLocalStorage} from "../logicColumnState/columnState.jsx";
import {getAllCard} from "../../../../apis/cardService.jsx"
// COMPONENT
import {MyContext} from "../../../../MyContext.jsx";
import PopupDeleteAgrid from "../../popUpDelete/popUpDeleteAgrid.jsx";
import {getItemFromIndexedDB} from "../../../../storage/storageService.js";
// FUNCTION
import {createTimestamp, formatMoney, getCurrentDate, parseCurrencyInput} from "../../../../generalFunction/format.js";
import {handleSave} from "../handleAction/handleSave.js";
import ActionSave from "../actionButton/ActionSave.jsx";
import ActionCreate from "../actionButton/ActionCreate.jsx";
import ActionResetColumn from "../actionButton/ActionResetColumn.jsx";
import ActionChangeFilter from "../actionButton/ActionChangeFilter.jsx";
import ActionSearch from "../actionButton/ActionSearch.jsx";
import ActionClearFilter from "../actionButton/ActionClearAllFilter.jsx";
import ActionBookMark from "../actionButton/ActionBookMark.jsx";
// ICON
import {EllipsisIcon, LocIcon, LocIconWhite} from "../../../../icon/IconSVG.js";
import {onFilterTextBoxChanged} from "../../../../generalFunction/quickFilter.js";
import {getAllTaiKhoan} from "../../../../apis/taiKhoanService.jsx";
import {getAllNhanVien} from "../../../../apis/nhanVienService.jsx";
import {getAllNhaCungCap} from "../../../../apis/nhaCungCapService.jsx";
import {getAllBusinessUnit} from "../../../../apis/businessUnitService.jsx";
import {getAllPhongBan} from "../../../../apis/phongBanService.jsx";
import {getAllHoaDon} from "../../../../apis/hoaDonService.jsx";
import {getAllHopDong} from "../../../../apis/hopDongService.jsx";
// CONSTANT
import {So_Ke_Toan} from "../../../../Consts/TITLE_HEADER.js";
import {ROUTES, SETTING_CHOTSO, SETTING_TYPE} from '../../../../CONST.js';
import {getAllLenhSanXuat} from "../../../../apis/lenhSanXuatService.jsx";
import {useNavigate} from "react-router-dom";
import PopUpExport from "../exportFile/PopUpExport.jsx";
import {ClipboardModule} from "ag-grid-enterprise";
import ActionDeleteMany from "../actionButton/ActionDeleteMany.jsx";
import PhieuLQView from "../../SubStep/SubStepItem/Mau/PhieuLQView.jsx";

const limit = pLimit(5);
ModuleRegistry.registerModules([ClipboardModule, ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function DMSoKeToan({company = 'HQ'}) {
    const navigate = useNavigate()
    const [editCount, setEditCount] = useState(0);
    const [chotSoType, setChotSoType] = useState(null);
    const [chotSo, setChotSo] = useState(null);
    const headerTitle = So_Ke_Toan;
    const table = 'SoKeToan';
    const tableCol = 'SoKeToanCol';
    const tableFilter = 'SoKeToanFilter';
    const {currentYear, selectedCompany, listCompany, fetchAllCompany} = useContext(MyContext)
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listVas, setListVas] = useState([]);
    const [listKmf, setListKmf] = useState([]);
    const [listKmtc, setListKmtc] = useState([]);
    const [listBU, setListBU] = useState([]);
    const [listProduct, setListProduct] = useState([]);
    const [listProject, setListProject] = useState([]);
    const [listNoiBo, setListNoiBo] = useState([]);
    const [listVendor, setListVendor] = useState([]);
    const [listNhanVien, setListNhanVien] = useState([]);
    const [listNhaCungCap, setListNhaCungCap] = useState([]);
    const [listPhongBan, setListPhongBan] = useState([]);
    const [listHoaDon, setListHoaDon] = useState([]);
    const [listHopDong, setListHopDong] = useState([]);
    const [listLenhSX, setListLenhSX] = useState([]);

    const [selectedRows, setSelectedRows] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSyncing2, setIsSyncing2] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [selectedYear, setSelectedYear] = useState(`${currentYear}`);
    const [listYear, setListYear] = useState([]);
    const [showClearFilter, setShowClearFilter] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [checkColumn, setCheckColumn] = useState(true);
    const [listCard, setListCard] = useState([])
    const [countUpdate, setCountUpdate] = useState(0)
    const [selectedPhieuLQ, setSelectedPhieuLQ] = useState(null);
    const fetchAllCard = async () => {
        try {
            const data = await getAllCard();
            setListCard(data);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchAllCard();
    }, []);

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
    const [isShowAll1, setShowAll1] = useState(getLocalStorageSettings().isShowAll1);
    const [isSortByDay, setIsSortByDay] = useState(getLocalStorageSettings().isSortByDay);
    const [isStatusFilter, setIsStatusFilter] = useState(getLocalStorageSettings().isStatusFilter);
    const [isSortDoanhThu, setIsSortDoanhThu] = useState(getLocalStorageSettings().isSortDoanhThu);
    const [isSortChiPhi, setIsSortChiPhi] = useState(getLocalStorageSettings().isSortChiPhi);

    useEffect(() => {
        const tableSettings = {
            isShowAll1,
            isSortByDay,
            isSortDoanhThu,
            isSortChiPhi,
            isStatusFilter
        };

        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isShowAll1, isSortByDay, isSortDoanhThu, isSortChiPhi, isStatusFilter]);

    const defaultColDef = useMemo(() => {
        return {
            editable: (params) => {
                return params.data.company !== 'Internal';
            },
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            suppressMenu: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,

            // hide: isShowAll1,
        };
    }, [isShowAll1]);

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    function loadData() {
        if (company !== 'HQ' && company !== 'Group') {
            getAllKmtc().then((data) => {
                setListKmtc(data);
            });
            getAllKmf().then((data) => {
                setListKmf(data);
            });
            getAllTaiKhoan().then((e) => {
                setListVas(e)
            })
            getAllDuAn().then((data) => {
                setListProject(data);
            });
            getAllHangHoa().then((data) => {
                setListProduct(data);
            });
            getAllKhachHang().then((data) => {
                setListVendor(data);
            });
            getAllNhanVien().then((data) => {
                setListNhanVien(data);
            });
            getAllNhaCungCap().then((data) => {
                setListNhaCungCap(data);
            });
            getAllBusinessUnit().then((data) => {
                setListBU(data);
            });
            getAllPhongBan().then((data) => {
                setListPhongBan(data);
            });
            getAllHoaDon().then((data) => {
                setListHoaDon(data);
            });
            getAllHopDong().then((data) => {
                setListHopDong(data);
            });
            getAllLenhSanXuat().then((data) => {
                setListLenhSX(data);
            });
        } else {
            getAllTaiKhoan().then((e) => {
                setListVas(e)
            })
            getAllKmtc().then((data) => {
                const filteredData = data;
                setListKmtc(filteredData);
            });
            getAllKmf().then((data) => {
                const filteredData = data;
                setListKmf(filteredData);
            });
            getAllDuAn().then((data) => {
                setListProject(data);
            });
            getAllHangHoa().then((data) => {
                setListProduct(data);
            });
            getAllKhachHang().then((data) => {
                setListVendor(data);
            });
            getAllNhanVien().then((data) => {
                setListNhanVien(data);
            });
            getAllNhaCungCap().then((data) => {
                setListNhaCungCap(data);
            });
            getAllBusinessUnit().then((data) => {
                setListBU(data);
            });
            getAllPhongBan().then((data) => {
                setListPhongBan(data);
            });
            getAllHoaDon().then((data) => {
                setListHoaDon(data);
            });
            getAllHopDong().then((data) => {
                setListHopDong(data);
            });
            getAllLenhSanXuat().then((data) => {
                setListLenhSX(data);
            });
        }

        let listYearsss = [];
        getAllSoKeToan().then((data) => {
            listYearsss = [...new Set(data.filter(e => e.year && e.year !== '').map(e => e.year))];
            setListYear(listYearsss);

            let filteredData = data;
            if (!selectedCompany) {
                fetchAllCompany()
            } else {
                if (selectedCompany !== 'Toàn bộ') {
                    filteredData = filteredData.filter(e => e.company === selectedCompany)
                }
            }
            // Áp dụng bộ lọc theo công ty
            // if (company === 'HQ') {
            //     filteredData = filteredData.filter((e) => e.consol?.toLowerCase() == 'consol');
            // } else if (company === 'Group') {
            //     filteredData = filteredData.filter((e) => e.company === 'Group');
            // } else if (company === 'Internal') {
            //     filteredData = filteredData.filter((e) => e.unit_code === 'Internal');
            // } else {
            //     filteredData = filteredData.filter((e) => e.company === company);
            // }

            // Áp dụng bộ lọc theo năm
            if (currentYear !== 'Toàn bộ') {
                filteredData = filteredData.filter(e => e.year == currentYear);
            }
            if (isSortDoanhThu && isSortChiPhi) {
                // Khi cả hai điều kiện đều đúng
                filteredData = filteredData.filter(e =>
                    e.pl_value && e.pl_value !== 0 &&
                    (['DT', 'DTK', 'DTTC'].includes(e.pl_type) || e.pl_type.startsWith('CF') || e.pl_type.startsWith('GV'))
                );
            } else if (isSortDoanhThu) {
                // Khi chỉ lọc theo Doanh Thu
                filteredData = filteredData.filter(e =>
                    e.pl_value && e.pl_value !== 0 && ['DT', 'DTK', 'DTTC'].includes(e.pl_type)
                );
            } else if (isSortChiPhi) {
                // Khi chỉ lọc theo Chi Phí
                filteredData = filteredData.filter(e =>
                    e.pl_value && e.pl_value !== 0 && (e.pl_type.startsWith('CF') || e.pl_type.startsWith('GV'))
                );
            }

            // Lọc dữ liệu nội bộ
            let noiBoDuplicateList = filteredData.filter((e) => e.isDuplicated && e.unit_code === 'Internal');
            let noiBoList = filteredData.filter((e) => e.noiBo === 'Nội bộ' && e.unit_code !== 'Internal');
            setListNoiBo(
                noiBoList.filter((noiBoItem) => {
                    return !noiBoDuplicateList.some((duplicateItem) => duplicateItem.isDuplicated == noiBoItem.id);
                })
            );

            // Sắp xếp dữ liệu
            if (isSortByDay) {
                // Sắp xếp theo id
                filteredData = filteredData.sort((a, b) => b.id - a.id);
            } else {
                // Sắp xếp theo day, month, year từ ngày gần nhất đến xa nhất
                filteredData = filteredData.sort((a, b) => {
                    // Chuyển đổi các giá trị thành số nguyên để so sánh
                    let dateA = new Date(a.year, a.month - 1, a.day);
                    let dateB = new Date(b.year, b.month - 1, b.day);
                    return dateB - dateA; // Ngày mới nhất đứng trước
                });
            }

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
    }, [company, currentYear, isSortByDay, isSortDoanhThu, isSortChiPhi, selectedCompany]);

    useEffect(() => {
        fetchCurrentUser();
        setLoading(true);
        loadData();

    }, [company, currentYear, isSortByDay, isSortDoanhThu, isSortChiPhi, selectedCompany]);

    function checkInput(list, s) {
        return {
            cellClassRules: {
                'data-error': (params) => {
                    return !list.some((e) => e[s] == params.value) && params.value != '';
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

    function filterOhther() {
        if (isStatusFilter) {
            return {
                filter: 'agMultiColumnFilter',
                floatingFilter: true,
                filterParams: {
                    filters: [
                        {
                            filter: 'agTextColumnFilter',
                            filterParams: {
                                filterOptions: ['startsWith'],
                                defaultOption: 'startsWith',
                            },
                        },
                        {
                            filter: 'agSetColumnFilter',
                        },
                    ],
                },
            }
        }
    }

    function EditTable() {
        return {
            // editable: (params) => {
            //     return params.data.unit_code !== 'Internal';
            // },
            editable: true
        };
    }

    const renderMaThe = (params) => {
        let cardInfo = null;
        let cardId = params.data?.card_id;
        cardInfo = listCard.find(card => card.id == cardId);
        return cardInfo?.code
    }

    const renderMaBuoc = (params) => {
        let cardId = params.data?.card_id;
        let stepId = params.data?.step_id;
        return `S${cardId}|${stepId}`
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const savedColumnState = await getItemFromIndexedDB(tableCol) || []
                let updatedColDefs = [                    // {
                    //   headerCheckboxSelection: true,
                    //   checkboxSelection: true,
                    //   width: 30,
                    //   pinned: 'left',
                    // },
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
                        width: 70,
                        pinned: 'left',
                        headerName: 'STT', ...filter(),
                    },
                    {
                        field: 'tax',
                        width: 70,
                        pinned: 'left',
                        headerName: 'TAX',
                        ...filter(),
                        cellRenderer: 'agCheckboxCellRenderer',
                        cellEditor: 'agCheckboxCellEditor',
                        cellStyle: {display: 'flex', justifyContent: 'center', alignItems: 'center'},
                        valueGetter: (params) => {
                            return params.data.tax ?? false;
                        },

                        valueSetter: (params) => {
                            const newValue = params.newValue === true || params.newValue === 'true';
                            params.data.tax = newValue;
                            return true;
                        },

                    },
                    {
                        field: 'quan_tri_noi_bo',
                        width: 70,
                        pinned: 'left',
                        headerName: 'Quản trị',
                        ...filter(),
                        cellRenderer: 'agCheckboxCellRenderer',
                        cellEditor: 'agCheckboxCellEditor',
                        cellStyle: {display: 'flex', justifyContent: 'center', alignItems: 'center'},
                        valueGetter: (params) => {
                            return params.data.quan_tri_noi_bo ?? false;
                        },

                        valueSetter: (params) => {
                            const newValue = params.newValue === true || params.newValue === 'true';
                            params.data.quan_tri_noi_bo = newValue;
                            return true;
                        },
                    },
                    {
                        field: 'company',
                        headerName: 'Công ty',
                        width: 110,
                        pinned: 'left',
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        ...EditTable(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listCompany.map((value) => value?.code),
                        },
                    },
                    {
                        field: 'day',
                        headerName: 'Ngày',
                        suppressHeaderMenuButton: true,
                        width: 60,
                        pinned: 'left',
                        // cellEditor: MuiDatePickerCellEditor,
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
                        },
                        ...EditTable(),
                        hide: isShowAll1
                    },

                    {
                        field: 'month',
                        headerName: 'Tháng',
                        width: 80,
                        pinned: 'left',
                        ...filter(),
                        ...sortMoi(),
                        ...EditTable(),
                    },
                    {
                        field: 'year',
                        headerName: 'Năm',
                        width: 80,
                        pinned: 'left',
                        ...filter(),
                        ...sortMoi(),
                        ...EditTable(),
                    },
                    {
                        field: 'phieu_lq',
                        headerName: 'Chứng từ liên quan',
                        width: 120,
                        ...filter(),
                        editable: false,
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    {params.value.map(ph => (
                                        <button className={'btn-view-phieu'} onClick={() => setSelectedPhieuLQ(ph)}>{ph}</button>
                                    ))}
                                </>
                            );
                        },
                    },
                    {
                        field: 'phieu_thu_chi',
                        headerName: 'Phiếu thu chi',
                        width: 120,
                        ...filter(),
                        editable: false,
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    <button className={'btn-view-phieu'} style={{padding: 5, borderRadius: 5}} onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
                                </>
                            );
                        },
                    },
                    {
                        field: 'soChungTu',
                        headerName: 'Chứng từ',
                        width: 120,
                        ...filter(),
                        editable: false,
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    <button className={'btn-view-phieu'} style={{padding: 5, borderRadius: 5}} onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
                                </>
                            );
                        },
                    },
                    {
                        field: 'phieuKT',
                        headerName: 'Phiếu kế toán',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    <button className={'btn-view-phieu'}
                                            onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
                                </>
                            );
                        },
                    },
                    {
                        field: 'dien_giai',
                        headerName: 'Diễn giải',
                        width: 250,
                        pinned: 'left',
                        ...filter(),
                        ...EditTable(),
                    },
                    // {
                    //     field: 'card_id',
                    //     headerName: 'Mã thẻ',
                    //     width: 170,
                    //     ...filter(),
                    //     ...EditTable(),
                    //     cellRenderer: (params) => renderMaThe(params)
                    // },
                    // {
                    //     field: 'step_id',
                    //     headerName: 'Mã bước',
                    //     width: 170,
                    //     ...filter(),
                    //     ...EditTable(),
                    //     cellRenderer: (params) => renderMaBuoc(params)
                    // },
                    {
                        field: 'dinhKhoanPro_id',
                        headerName: 'Mã định khoản',
                        width: 170,
                        ...filter(),
                        ...EditTable(),
                    },
                    {
                        field: 'customer',
                        headerName: 'Khách hàng',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                        ...checkInput(listVendor, 'code'),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listVendor.map((value) => value.code),
                        },
                        hide: isShowAll1
                    },
                    {
                        field: 'employee',
                        headerName: 'Nhân viên',
                        width: 170,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listNhanVien.map((value) => value?.code),
                        },
                        ...filter(),
                        ...EditTable(),
                    },
                    {
                        field: 'vu_viec_code',
                        headerName: 'Vụ việc',
                        width: 170,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listProject.map((value) => value?.code),
                        },
                        ...filter(),
                        ...EditTable(),
                    },

                    {
                        field: 'noi_bo',
                        suppressHeaderMenuButton: true,
                        headerName: 'Nội bộ',
                        width: 100,
                        ...filter(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: ['Nội bộ', ''],
                        },
                        hide: isShowAll1
                    },
                    {
                        field: 'consol',
                        suppressHeaderMenuButton: true,
                        headerName: 'Consol',
                        width: 100,
                        ...filter(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: ['CONSOL', ''],
                        },
                    },

                    {
                        field: 'tk_no',
                        headerName: 'Tài khoản nợ',
                        width: 100,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listVas.map((value) => value?.code),
                        },
                        ...checkInput(listVas, 'code'),
                        ...EditTable(),
                        ...filterOhther(),
                    },
                    {
                        field: 'tk_co',
                        headerName: 'Tài khoản có',
                        width: 150,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listVas.map((value) => value?.code),
                        },
                        ...checkInput(listVas, 'code'),
                        ...EditTable(),
                        ...filterOhther(),
                    },
                    {
                        field: 'so_tien_VND',
                        headerName: 'Số tiền VND',
                        width: 140,
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'so_tien_nguyen_te',
                        headerName: 'Số tiền nguyên tệ',
                        width: 140,
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'fx_rate',
                        headerName: 'FX Rate',
                        width: 140,
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'supplier',
                        headerName: 'Nhà cung cấp',
                        width: 140,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listNhaCungCap.map((value) => value?.code),
                        },
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'kmtc',
                        headerName: 'Khoản mục thu chi',
                        width: 180,
                        ...filter(),
                        // ...uniqueCellEditor({list: listKmns, key: 'name'}),
                        ...checkInput(listKmtc, 'code'),
                        ...EditTable(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listKmtc.map((value) => value?.code),
                        },

                    },

                    {
                        field: 'kmf',
                        headerName: 'Khoản mục phí',
                        width: 180,
                        ...filter(),
                        // ...uniqueCellEditor({list: listKmf, key: 'name'}),
                        ...checkInput(listKmf, 'code'),
                        ...EditTable(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listKmf.map((value) => value?.code),
                        },
                    },
                    {
                        field: 'hoa_don',
                        headerName: 'Hóa đơn',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listHoaDon.map((value) => value?.code),
                        },
                        hide: isShowAll1
                    },
                    {
                        field: 'unit_code',
                        headerName: 'Đơn vị(BU)',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listBU.map((value) => value?.code),
                        },
                        hide: isShowAll1
                    },
                    {
                        field: 'product',
                        headerName: 'Sản phẩm',
                        width: 120,
                        ...filter(),
                        ...checkInput(listProduct, 'code'),
                        ...EditTable(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listProduct.map((value) => value?.code),
                        },

                        hide: isShowAll1
                    },
                    {
                        field: 'bo_phan_code',
                        headerName: 'Dept',
                        width: 120,
                        ...filter(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listPhongBan.map((value) => value?.code),
                        },
                        ...checkInput(listPhongBan, 'code'),
                        ...EditTable(),
                    },

                    {
                        field: 'hop_dong',
                        headerName: 'Hợp đồng',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listHopDong.map((value) => value?.code),
                        },
                        hide: isShowAll1
                    },
                    {
                        field: 'lenh_sx',
                        headerName: 'Lệnh sản xuất',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listLenhSX.map((value) => value?.code),
                        },
                        hide: isShowAll1
                    },
                    {
                        field: 'chu_thich',
                        headerName: 'Chú thích',
                        width: 120,
                        ...filter(),
                        hide: isShowAll1
                    },
                    {
                        field: 'pl_type',
                        headerName: 'PL Type',
                        width: 140,
                        ...filter(),
                        editable: false,
                        hide: isShowAll1
                    },
                    {
                        field: 'cf_Check',
                        headerName: 'PL Check',
                        width: 140,
                        editable: false,
                        ...filter(),
                        ...sortMoi(),
                        hide: isShowAll1
                    },
                    {
                        field: 'pl_value',
                        headerName: 'PL Value',
                        editable: false,
                        width: 140,
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                        ...filter(),
                        ...EditTable(),
                        ...sortMoi(),
                    },
                    {
                        field: 'cash_value',
                        headerName: 'Cash Value',
                        width: 140,
                        editable: false,
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                        ...filter(),
                        ...EditTable(),
                        ...sortMoi(),
                    },
                    {
                        field: 'danhDau',
                        headerName: 'Đánh dấu',
                        width: 120,
                        ...filter(),
                        hide: isShowAll1
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
    }, [onGridReady, loading, table, isShowAll1, showClearFilter, isStatusFilter, checkColumn]);

    const handleAddRow = async () => {
        const dateTimeString = getCurrentDate();
        const [day, month] = dateTimeString.split('/');

        const newItems = {
            show: true,
            created_at: createTimestamp(),
            user_create: currentUser.email,
            ps_no: 0,
            ps_co: 0,
            day: day,
            month: month,
            year: currentYear !== 'Toàn bộ' ? currentYear : new Date().getFullYear(),
            company: selectedCompany !== 'Toàn bộ' ? selectedCompany : '',
            consol: company === 'HQ' ? 'CONSOL' : '',

        };
        await createNewSoKeToan(newItems);
        await onGridReady();
    };

    const handleSOLCompany = (row) => {
        let so_tien = parseFloat(row.so_tien_VND);
        let tk_no = row.tk_no + '';
        let tk_co = row.tk_co + '';

        if (tk_no || tk_co) {
            if (tk_no.startsWith("91") || tk_co.startsWith("91")) {
                row.pl_type = "KC";
            } else if (tk_no.startsWith("515") || tk_co.startsWith("515")) {
                row.pl_type = "DTTC";
            } else if (tk_no.startsWith("51") || tk_co.startsWith("51")) {
                row.pl_type = "DT";
            } else if (tk_no.startsWith("71") || tk_co.startsWith("71")) {
                row.pl_type = "DTK";
            } else if (tk_no.startsWith("635") || tk_co.startsWith("635")) {
                row.pl_type = "CFTC";
            } else if (tk_no.startsWith('641') || tk_co.startsWith('641')) {
                row.pl_type = 'CFBH';
            } else if (tk_no.startsWith('642') || tk_co.startsWith('642')) {
                row.pl_type = 'CFQL';
            } else if (tk_no.startsWith('632') || tk_co.startsWith('632') || tk_no.startsWith('62') || tk_co.startsWith('62')) {
                row.pl_type = 'GV';
            } else if (tk_no.startsWith("52") || tk_co.startsWith("52") || tk_no.startsWith("6") || tk_co.startsWith("6")) {
                row.pl_type = "CF";
            } else if (tk_no.startsWith("81") || tk_co.startsWith("81")) {
                row.pl_type = "CFK";
            } else if (tk_no.startsWith("82") || tk_co.startsWith("82")) {
                row.pl_type = "TAX";
            } else {
                row.pl_type = "";
            }

            if (tk_no.startsWith("11") && tk_co.startsWith("11")) {
                row.cf_Check = "";
            } else if (tk_no.startsWith("11")) {
                row.cf_Check = "Cashin";
            } else if (tk_co.startsWith("11")) {
                row.cf_Check = "Cashout";
            } else {
                row.cf_Check = "";
            }

            if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_co.startsWith('51') || tk_co.startsWith('7'))) {
                row.pl_value = so_tien;
            } else if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_no.startsWith('51') || tk_co.startsWith('7'))) {
                row.pl_value = -so_tien;
            } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_co.startsWith('52') || tk_co.startsWith('6') || tk_co.startsWith('8'))) {
                row.pl_value = so_tien;
            } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_no.startsWith('52') || tk_no.startsWith('6') || tk_no.startsWith('8'))) {
                row.pl_value = -so_tien;
            } else {
                row.pl_value = "";
            }

            if (row.cf_Check === "Cashin") {
                row.cash_value = so_tien;
            } else if (row.cf_Check === "Cashout") {
                row.cash_value = -so_tien;
            } else {
                row.cash_value = "";
            }
        }
    };

    // Hàm xử lý cho các công ty khác ngoài SOL
    const handleOtherCompanies = (row) => {
        let so_tien = parseFloat(row.so_tien_VND);
        let tk_no = row.tk_no + '';
        let tk_co = row.tk_co + '';

        if (tk_no && tk_co) {
            if (tk_no.startsWith("91") || tk_co.startsWith("91")) {
                row.pl_type = "KC";
            } else if (tk_no.startsWith("515") || tk_co.startsWith("515")) {
                row.pl_type = "DTTC";
            } else if (tk_no.startsWith("51") || tk_co.startsWith("51")) {
                row.pl_type = "DT";
            } else if (tk_no.startsWith("71") || tk_co.startsWith("71")) {
                row.pl_type = "DTK";
            } else if (tk_no.startsWith("635") || tk_co.startsWith("635")) {
                row.pl_type = "CFTC";
            } else if (tk_no.startsWith('641') || tk_co.startsWith('641')) {
                row.pl_type = 'CFBH';
            } else if (tk_no.startsWith('642') || tk_co.startsWith('642')) {
                row.pl_type = 'CFQL';
            } else if (tk_no.startsWith('632') || tk_co.startsWith('632') || tk_no.startsWith('62') || tk_co.startsWith('62')) {
                row.pl_type = 'GV';
            } else if (tk_no.startsWith("52") || tk_co.startsWith("52") || tk_no.startsWith("6") || tk_co.startsWith("6")) {
                row.pl_type = "CF";
            } else if (tk_no.startsWith("81") || tk_co.startsWith("81")) {
                row.pl_type = "CFK";
            } else if (tk_no.startsWith("82") || tk_co.startsWith("82")) {
                row.pl_type = "TAX";
            } else {
                row.pl_type = "";
            }

            if (tk_no.startsWith("11") && tk_co.startsWith("11")) {
                row.cf_Check = "";
            } else if (tk_no.startsWith("11")) {
                row.cf_Check = "Cashin";
            } else if (tk_co.startsWith("11")) {
                row.cf_Check = "Cashout";
            } else {
                row.cf_Check = "";
            }

            if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_co.startsWith('51') || tk_co.startsWith('7'))) {
                row.pl_value = so_tien;
            } else if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_no.startsWith('51') || tk_co.startsWith('7'))) {
                row.pl_value = -so_tien;
            } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_co.startsWith('52') || tk_co.startsWith('6') || tk_co.startsWith('8'))) {
                row.pl_value = so_tien;
            } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_no.startsWith('52') || tk_no.startsWith('6') || tk_no.startsWith('8'))) {
                row.pl_value = -so_tien;
            } else {
                row.pl_value = "";
            }

            if (row.cf_Check === "Cashin") {
                row.cash_value = so_tien;
            } else if (row.cf_Check === "Cashout") {
                row.cash_value = -so_tien;
            } else {
                row.cash_value = "";
            }
        }
    };

    const handleCGCompanies = (row) => {
        row.so_tien_VND = parseCurrencyInput(row.ps_no) - parseCurrencyInput(row.ps_co)
        let so_tien = parseFloat(row.so_tien_VND);
        let tk_no = row.tk_no + '';
        let tk_co = row.tk_co + '';

        if (tk_no) {
            // Update PL Type based on the updated logic
            if (tk_no.startsWith("511")) {
                row.pl_type = "DT";
            } else if (tk_no.startsWith("635")) {
                row.pl_type = "CFTC";
            }else if (tk_no.startsWith("62") || tk_no.startsWith("63")) {
                row.pl_type = "GV";
            } else if (tk_no.startsWith("52") || tk_no.startsWith("641")) {
                row.pl_type = "CFBH";
            } else if (tk_no.startsWith("642")) {
                row.pl_type = "CFQL";
            }  else if (tk_no.startsWith("515")) {
                row.pl_type = "DTTC";
            } else if (tk_no.startsWith("71")) {
                row.pl_type = "DTK";
            } else if (tk_no.startsWith("811")) {
                row.pl_type = "CFK";
            } else if (tk_no.startsWith("821")) {
                row.pl_type = "TAX";
            } else {
                row.pl_type = "";
            }

            // Update PL Value based on PL Type
            if (["DT", "DTK", "DTTC", "GV", "CFK", "CFTC", "CFBH", "CFQL", "TAX"].includes(row.pl_type)) {
                row.pl_value = -so_tien;
            } else {
                row.pl_value = "";
            }

            // Update Cash Value based on cash flow check
            if (tk_no.startsWith("11") && tk_co.startsWith("11")) {
                row.cash_value = 0;
            } else if (tk_no.startsWith("11")) {
                row.cash_value = so_tien;
            } else {
                row.cash_value = "";
            }
        }
    };
    const handleCellValueChanged = async (event) => {
        console.log(event)
        setEditCount((prev) => prev + 1);
        await limit(async () => {
            try {
                const updatedRow = event.data;
                const selectedNodes = gridRef.current.api.getSelectedNodes();
                const selectedIds = selectedNodes.map((node) => node.id);
                // event.data.ps_no = parseCurrencyInput(event.data.ps_no);
                // event.data.ps_co = parseCurrencyInput(event.data.ps_co);
                // event.data.so_tien = event.data.ps_no - event.data.ps_co;
                const rowExistsInUpdatedData = updatedData.some((row) => row.id === updatedRow.id);
                let newUpdatedData;
                if (rowExistsInUpdatedData) {
                    newUpdatedData = updatedData.map((row) => {
                        if (row.id === updatedRow.id) {
                            return {...updatedRow};
                        }
                        return row;
                    });
                } else {
                    newUpdatedData = [...updatedData, updatedRow];
                }
                if (updatedRow.company != null && updatedRow.company !== "" && updatedRow.company !== undefined) {
                    if (updatedRow.unit_code != null && updatedRow.unit_code !== "" && updatedRow.unit_code !== undefined) {
                        updatedRow.unit_code2 = `${updatedRow.unit_code}-${updatedRow.company}`
                        if (updatedRow.product != null && updatedRow.product !== "" && updatedRow.product !== undefined) {
                            updatedRow.product2 = `${updatedRow.product}-${updatedRow.company}-${updatedRow.unit_code}`
                        }
                        if (updatedRow.deal != null && updatedRow.deal !== "" && updatedRow.deal !== undefined) {
                            updatedRow.deal2 = `${updatedRow.deal}-${updatedRow.company}-${updatedRow.unit_code}`
                        }
                    }

                }
                // setUpdatedData(newUpdatedData);
                // Gọi hàm xử lý theo từng loại công ty
                // if (company === 'SOL') {
                //     handleSOLCompany(updatedRow);
                // } else {
                //     handleOtherCompanies(updatedRow);
                // }
                handleCGCompanies(updatedRow)
                if (updatedRow.phan_loai === 'DE') {
                    updatedRow.cash_value = 0;
                }
                // await handleSave(newUpdatedData, table, setUpdatedData);

                // let newVasData = updateVASFromSKT(event.colDef.field, event.oldValue, event.newValue, updatedRow, listVas);
                // await handleSaveAgl(newVasData, 'Vas', null);

                // event.api.refreshCells({
                //     rowNodes: [event.node],
                //     columns: ['cash_value', "pl_value", "pl_type", "pl_check"],
                // });
                // selectedIds.forEach((id) => {
                //     const node = gridRef.current.api.getRowNode(id);
                //     if (node) {
                //         node.setSelected(true); // Đảm bảo hàng được chọn
                //     }
                // });

                setUpdatedData(prevData => {
                    const existingRowIndex = prevData.findIndex(item => item.id === updatedRow.id);
                    if (existingRowIndex !== -1) {
                        prevData[existingRowIndex] = updatedRow;
                        return [...prevData];
                    } else {
                        return [...prevData, updatedRow];
                    }
                });
            } finally {
                setEditCount((prev) => prev - 1);
            }
        });
    };


    const
        onSelectionChanged = () => {
        const selectedData = gridRef.current.api
            .getRenderedNodes() // Lấy các node đang được hiển thị sau khi filter
            .filter(node => node.isSelected()) // Chỉ giữ lại các node được chọn
            .map(node => ({ ...node.data, show: false }));

        setSelectedRows(selectedData);
    };



    async function handleCreateNoiBo() {
        setLoading(true);
        setIsSyncing2(true); // Bắt đầu hiệu ứng xoay
        listNoiBo.map(async (e) => {
            await createNewSoKeToan(
                {
                    ...e,
                    id: null,
                    unit_code: 'Internal',
                    isDuplicated: e.id,
                    dien_giai: 'Loại trừ giao dịch nội bộ',
                    so_tien: -e.so_tien,
                    pl_value: -e.pl_value,
                    cash_value: -e.cash_value,
                    CCPBDV: null,
                    PBDV: null,
                    created_at: createTimestamp(),
                    user_create: currentUser.email

                },
            );
        });
        setTimeout(() => {
            loadData();
            setLoading(false);
            setIsSyncing2(false); // Bắt đầu hiệu ứng xoay
        }, 1000);
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

    const handleFileImported = (importedData) => {
        const currentRowData = [];
        if (gridRef.current) {
            gridRef.current.api.forEachNode((node) => {
                currentRowData.push(node.data); // Đẩy dữ liệu của mỗi node vào mảng
            });
        }
        // Kết hợp dữ liệu cũ và dữ liệu mới
        const updatedData = [...currentRowData, ...importedData];

        // Cập nhật lại dữ liệu trong AG-Grid
        if (gridRef.current) {
            gridRef.current.api.setRowData(updatedData); // Set lại toàn bộ dữ liệu vào grid
        }
    };

    const handleGianLuoc = () => {
        setShowAll1(!isShowAll1);
    };
    const handleSortByDay = (status) => {
        setIsSortByDay(status);
    };
    const handleSortDoanhThu = () => {
        setIsSortDoanhThu((prev) => {
            return !prev;
        });
    };

    const handleChangeStatusFilter = () => {
        setIsStatusFilter((prev) => {
            return !prev;
        });
    };
    const handleUpdatePLValue = async () => {
        const skt = await getAllSoKeToan()
        setLoading(true)
        setCountUpdate(skt.length)
        for (const e of skt) {
            handleCGCompanies(e)
            await updateSoKeToan(e).then(() => setCountUpdate(prevState => prevState - 1))
        }
        setLoading(false)
    };


    const handleSortChiPhi = () => {
        setIsSortChiPhi((prev) => {
            return !prev;
        });
    };

    function renderCompanyLabel() {
        let companyObject = listCompany.find(e => e.name === company);
        if (companyObject) return companyObject.label; else return company;
    }

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
        if (gridRef.current && gridRef.current.api) {
            gridRef.current.api.setFilterModel(null);
        }
        setShowClearFilter(false)
    };

    const isDateInLockedPeriod = (date, lockedPeriods) => {
        const day = parseInt(date.split('/')[0]);
        const month = parseInt(date.split('/')[1]);
        const isInPeriod = (day, term) => {
            if (term === 'K1') {
                return day >= 1 && day <= 15;
            } else if (term === 'K2') {
                return day >= 16 && day <= 31;
            }
            return false;
        };
        return lockedPeriods.some(([period]) => {
            const [_, month_str, term] = period.match(/T(\d+)_([K][12])/);
            const periodMonth = parseInt(month_str);

            return month === periodMonth && isInPeriod(day, term);
        });
    };

    const handleSaveData = async (value) => {
        try {
            const settingData = await getSettingByType(SETTING_TYPE.ChotSo);
            const cauHinhData = await getAllCauHinh();
            if (cauHinhData[0].value === SETTING_CHOTSO.month) {
                const lockedMonths = Object.entries(settingData.setting.month[0])
                    .filter(([key, value]) => key.startsWith('T') && value === false)
                    .map(([key]) => parseInt(key.substring(1)));

                const hasLockedData = value.some(item => {
                    const itemMonth = parseInt(item.month);
                    return lockedMonths.includes(itemMonth);
                });

                if (hasLockedData) {
                    toast.error("Có dữ liệu đã được khóa sổ");
                    return;
                }
            } else {
                const lockedPeriods = Object.entries(settingData.setting.term[0])
                    .filter(([key, value]) => key.startsWith('T') && value === false);

                const hasLockedData = value.some(item => {
                    const date = `${item.day}/${+item.month}`;
                    return isDateInLockedPeriod(date, lockedPeriods);
                });

                if (hasLockedData) {
                    toast.error("Có dữ liệu đã được khóa sổ");
                    return;
                }
            }
            await handleSave(value, table, setUpdatedData, currentUser)
            loadData()
            toast.success("Cập nhật thành công", {autoClose: 1000})
        } catch (error) {
            console.error("Lỗi khi cập nhật dữ liệu", error);
        }
    };

    const [tabSelected, setTabSelected] = useState(ROUTES.SOKETOAN);

    const tabs = [
        {
            path: ROUTES.SOKETOAN,
            label: 'Kiểu nhật ký',
        },
        {
            path: ROUTES.SOKETOANT,
            label: 'Kiểu T-account',
        },
    ]

    const tabChange = (path) => {
        setTabSelected(path);
        navigate(`/accounting/so-lieu/${path}`)
    }

    const getContextMenuItems = (params) => {
        console.log("getContextMenuItems  params:", params)
        let cardInfo = null;
        let chainId = null;
        let cardId = params.node.data?.card_id;
        let stepId = params.node.data?.step_id;
        cardInfo = listCard.find(card => card.id == cardId);
        chainId = cardInfo?.chain_id;

        const URL = import.meta.env.VITE_DOMAIN_URL;

        let contextMenuItems = [];

        if (cardId && !stepId) {
            contextMenuItems.push({
                name: 'Đi đến thẻ',
                action: () => window.open(`${URL}/accounting/chains/${chainId}/cards/${cardId}`, '_blank')
            });
        } else if (cardId && stepId) {
            contextMenuItems.push(
                {
                    name: 'Đi đến thẻ',
                    action: () => window.open(`${URL}/accounting/chains/${chainId}/cards/${cardId}`, '_blank')
                },
                {
                    name: 'Đi đến bước',
                    action: () => window.open(`${URL}/accounting/chains/${chainId}/cards/${cardId}/steps/${stepId}`, '_blank')
                }
            );
        } else if (!cardId) {
            contextMenuItems.push('copy', 'export');
        }

        return contextMenuItems;
    };


    return (
        <>
            <div className={css.headerPowersheet}>
                <div className={css.headerTitle}>
                    {/*<span>{headerTitle} - {renderCompanyLabel()}</span>*/}
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
                    {/*<div className={`${css.headerActionButton} `}>*/}
                    {/*    <select className={css.selectContent}*/}
                    {/*        value={selectedYear}*/}
                    {/*        onChange={(e) => setSelectedYear(e.target.value)}*/}
                    {/*    >*/}
                    {/*        {listYear.map((year) => (<option key={year} value={year}>*/}
                    {/*            {year}*/}
                    {/*        </option>))}*/}
                    {/*        <option value="Toàn bộ">Toàn bộ</option>*/}
                    {/*    </select>*/}
                    {/*</div>*/}
                    <div className={`${css.headerActionItem} ${isShowAll1 ? css.buttonItemOn : css.buttonOff}`}
                         onClick={handleGianLuoc}>
                        <div className={css.filterChoose}>
                            <img src={isShowAll1 ? LocIconWhite : LocIcon} alt=""/>
                            <span>Chế độ giản lược</span>
                        </div>

                    </div>
                    <div className={`${css.headerActionItem} ${isSortDoanhThu ? css.buttonItemOn : css.buttonOff}`}
                         onClick={handleSortDoanhThu}>
                        <div className={css.filterChoose}>
                            <img src={isSortDoanhThu ? LocIconWhite :  LocIcon} alt=""/>
                            <span>Doanh thu</span>
                        </div>
                    </div>

                    <div className={`${css.headerActionItem} ${isSortChiPhi ? css.buttonItemOn : css.buttonOff}`}
                         onClick={handleSortChiPhi}>
                        <div className={css.filterChoose}>
                            <img src={isSortChiPhi ? LocIconWhite :  LocIcon} alt=""/>
                            <span>Chi phí</span>
                        </div>
                    </div>
                    <ActionDeleteMany handleSaveData={handleSaveData} updateData={selectedRows}/>
                    <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>


                    {company !== 'Internal' ? (
                        <ActionCreate handleAddRow={handleAddRow}/>
                    ) : (
                        ''
                    )}
                    {/*{company !== 'HQ' && (*/}
                    <div className={css.headerActionButton} ref={dropdownRef}>
                        <img
                            src={EllipsisIcon}
                            style={{width: 32, height: 32, cursor: 'pointer'}}
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
                                    isSortByDay={isSortByDay}
                                    handleSortByDay={handleSortByDay}
                                    handleCreateNoiBo={handleCreateNoiBo}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        flexDirection: "column",
                                        alignItems: "start",
                                        height: "100%",
                                        width: "100%"
                                    }}
                                >
                                    <button
                                        onClick={handleUpdatePLValue}
                                        className={css.dropdownItem}
                                        aria-label="Export"
                                    >
                                        <span>Cập nhật PL</span>
                                    </button>


                                </div>
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
                    {/*)}*/}
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
                {(editCount >= 100 || loading) && (
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
                        {editCount >= 100 && <>Đang xử lý {editCount} bản ghi</>}
                        {countUpdate > 0 && <>Số bản ghi còn lại {countUpdate} bản ghi</>}
                    </div>
                )}
                <div className="ag-theme-quartz" style={{height: '90%', width: '100%'}}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection
                        ref={gridRef}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        animateRows={true}
                        // pagination={true}
                        onCellValueChanged={handleCellValueChanged}
                        // paginationPageSize={1000}
                        suppressRowClickSelection={true}
                        // paginationPageSizeSelector={[1000, 5000, 10000, 30000, 50000]}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onFilterChanged={onFilterChanged}  // Gọi sự kiện filterChanged
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        getContextMenuItems={getContextMenuItems}
                        suppressScrollOnNewData={true}
                        onSelectionChanged={onSelectionChanged}

                    />
                </div>
            </div>
            {selectedPhieuLQ &&
                <PhieuLQView selectedPhieuLQ={selectedPhieuLQ} setSelectedPhieuLQ={setSelectedPhieuLQ}/>}

        </>
    );
}

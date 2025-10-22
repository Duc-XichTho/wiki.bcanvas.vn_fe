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
import {getAllSoKeToan} from '../../../../apis/soketoanService.jsx';
import '../agComponent.css';
import AG_GRID_LOCALE_VN from '../locale.jsx';
import {MyContext} from "../../../../MyContext.jsx";
import css from './KeToanQuanTri.module.css'
import {getAllKmf} from '../../../../apis/kmfService.jsx';
import {getAllHangHoa} from "../../../../apis/hangHoaService.jsx";
import {getAllDuAn} from "../../../../apis/duAnService.jsx";
import {getAllKmtc} from "../../../../apis/kmtcService.jsx";
import {formatMoney} from "../../../../generalFunction/format.js";
import PopupDeleteAgrid from "../../popUpDelete/popUpDeleteAgrid.jsx";
import {getAllCompany} from "../../../../apis/companyService.jsx";
import {getAllKhachHang} from "../../../../apis/khachHangService.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import {logicListT} from "../SoLieu/CDPS/logicCDPS.js";
import {onFilterTextBoxChanged} from "../../../../generalFunction/quickFilter.js";
import {getItemFromIndexedDB} from "../../../../storage/storageService.js";
import {loadColumnState, saveColumnStateToLocalStorage} from "../logicColumnState/columnState.jsx";
import ActionResetColumn from "../actionButton/ActionResetColumn.jsx";
import ActionChangeFilter from "../actionButton/ActionChangeFilter.jsx";
import ActionSearch from "../actionButton/ActionSearch.jsx";
import ActionClearFilter from "../actionButton/ActionClearAllFilter.jsx";
import ActionBookMark from "../actionButton/ActionBookMark.jsx";
import {So_Ke_Toan_T} from "../../../../Consts/TITLE_HEADER.js";
import {ROUTES} from "../../../../CONST.js";
import {useNavigate} from "react-router-dom";
import {LocIcon} from "../../../../icon/IconSVG.js";
import {getAllPhongBan} from "../../../../apis/phongBanService.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function DMSoKeToanT({company = 'HQ'}) {
    const navigate = useNavigate()
    const headerTitle = So_Ke_Toan_T;
    const table = 'SoKeToanT';
    const tableCol = 'SoKeToanTCol';
    const tableFilter = 'SoKeToanTFilter';
    const {currentYear, selectedCompany, listCompany, fetchAllCompany} = useContext(MyContext)
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listKmns, setListKmns] = useState([]);
    const [listTeam, setListTeam] = useState([]);
    const [listKmf, setListKms] = useState([]);
    const [listUnit, setListUnit] = useState([]);
    const [listProduct, setListProduct] = useState([]);
    const [listProject, setListProject] = useState([]);
    const [listNoiBo, setListNoiBo] = useState([]);
    const [listVendor, setListVendor] = useState([]);
    const dropdownRef = useRef(null);
    const [selectedYear, setSelectedYear] = useState(`${currentYear}`);
    const [listYear, setListYear] = useState([]);
    const [showClearFilter, setShowClearFilter] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [checkColumn, setCheckColumn] = useState(true);


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
            editable: false,
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            suppressMenu: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
            // hide: isShowAll1,
        };
    }, [isShowAll1]);

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    function loadData() {
        let listYearsss = [];
        getAllSoKeToan().then((data) => {

            let filteredData = logicListT(data);
            if (!selectedCompany) {
                fetchAllCompany()
            } else {
                if (selectedCompany !== 'Toàn bộ') {
                    filteredData = filteredData.filter(e => e.company === selectedCompany)
                }
            }
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
    }, [company, selectedCompany]);

    useEffect(() => {
        fetchCurrentUser();
        setLoading(true);
        loadData();
        if (company !== 'HQ' && company !== 'Group') {
            getAllKmtc().then((data) => {
                const filteredData = data;
                setListKmns(filteredData);
            });
            getAllKmf().then((data) => {
                const filteredData = data;
                setListKms(filteredData);
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
            getAllPhongBan().then((data) => {
                setListTeam(data);
            });
        } else {
            getAllKmtc().then((data) => {
                const filteredData = data;
                setListKmns(filteredData);
            });
            getAllKmf().then((data) => {
                const filteredData = data;
                setListKms(filteredData);
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
            getAllPhongBan().then((data) => {
                setListTeam(data);
            });
        }
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

    function EditTable() {
        return false
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
                        headerName: 'STT', ...filter(),
                    },
                    {
                        field: 'company',
                        headerName: 'Công ty',
                        width: 70,
                        pinned: 'left',
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        ...EditTable(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listCompany.map((p) => p?.code),
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
                        field: 'dien_giai',
                        headerName: 'Diễn giải',
                        width: 250,
                        pinned: 'left',
                        ...filter(),
                        ...EditTable(),
                    },
                    {
                        field: 'card_id',
                        headerName: 'Mã thẻ',
                        width: 170,
                        ...filter(),
                        ...EditTable(),
                    },
                    {
                        field: 'step_id',
                        headerName: 'Mã bước',
                        width: 170,
                        ...filter(),
                        ...EditTable(),
                    },
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
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listVendor.map((vendor) => vendor.code),
                        },
                        ...checkInput(listVendor, 'code'),
                        ...EditTable(),
                        hide: isShowAll1
                    },
                    {
                        field: 'employee',
                        headerName: 'Nhân viên',
                        width: 170,
                        ...filter(),
                        ...EditTable(),
                    },
                    {
                        field: 'deal',
                        headerName: 'Vụ việc',
                        width: 170,
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
                    },
                    {
                        field: 'tien_no',
                        headerName: 'Tiền nợ',
                        pinned: 'left',
                        width: 110,
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'tien_co',
                        headerName: 'Tiền có',
                        pinned: 'left',
                        width: 110,
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
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'kmns',
                        headerName: 'Khoản mục thu chi',
                        width: 180,
                        ...filter(),
                        // ...uniqueCellEditor({list: listKmns, key: 'name'}),
                        ...checkInput(listKmns, 'code'),
                        ...EditTable(),
                    },

                    {
                        field: 'kmf',
                        headerName: 'Khoản mục phí',
                        width: 180,
                        ...filter(),
                        // ...uniqueCellEditor({list: listKmf, key: 'name'}),
                        ...checkInput(listKmf, 'code'),
                        ...EditTable(),
                    },
                    {
                        field: 'hoa_don',
                        headerName: 'Hóa đơn',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                        hide: isShowAll1,
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
                        field: 'soChungTu',
                        headerName: 'Chứng từ',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                        hide: isShowAll1,
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
                            values: listUnit.map((p) => p.name),
                        },
                        hide: isShowAll1
                    },
                    {
                        field: 'product',
                        headerName: 'Sản phẩm',
                        width: 120,
                        ...filter(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listProduct.map((p) => p.code),
                        },
                        ...checkInput(listProduct, 'code'),
                        ...EditTable(),
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
                            values: listTeam.map((p) => p.code),
                        },
                        ...checkInput(listTeam, 'code'),
                        ...EditTable(),
                    },

                    {
                        field: 'hop_dong',
                        headerName: 'Hợp đồng',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                        hide: isShowAll1,
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
                        field: 'danhDau',
                        headerName: 'Đánh dấu',
                        width: 120,
                        ...filter(),
                        hide: isShowAll1
                    },
                    {
                        field: 'chu_thich',
                        headerName: 'Chú thích',
                        width: 120,
                        ...filter(),
                        hide: isShowAll1
                    }
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

    const onFilterChanged = () => {
        const filterModel = gridRef.current.api.getFilterModel();

        if (Object.keys(filterModel).length !== 0) {
            sessionStorage.setItem(tableFilter, JSON.stringify(filterModel));
            setShowClearFilter(true)
        } else {
            sessionStorage.removeItem(tableFilter);
        }
    };

    const handleGianLuoc = () => {
        setShowAll1(!isShowAll1);
    };
    const handleSortByDay = () => {
        setIsSortByDay(!isSortByDay);
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

    const handleSortChiPhi = () => {
        setIsSortChiPhi((prev) => {
            return !prev;
        });
    };

    const clearFilters = () => {
        // Kiểm tra nếu grid đã sẵn sàng
        if (gridRef.current && gridRef.current.api) {
            gridRef.current.api.setFilterModel(null); // Xóa tất cả bộ lọc
        }
        setShowClearFilter(false)
    };

    const [tabSelected, setTabSelected] = useState(ROUTES.SOKETOANT);

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

                    {/*<div className={`${css.headerActionButton} ${css.selectItem}`}>*/}
                    {/*    <select className={css.selectContent}*/}
                    {/*            value={selectedYear}*/}
                    {/*            onChange={(e) => setSelectedYear(e.target.value)}*/}
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
                            <img src={LocIcon} alt=""/>
                            <span>Chế độ giản lược</span>
                        </div>

                    </div>
                    <div className={`${css.headerActionItem} ${isSortDoanhThu ? css.buttonItemOn : css.buttonOff}`}
                         onClick={handleSortDoanhThu}>
                        <div className={css.filterChoose}>
                            <img src={LocIcon} alt=""/>
                            <span>Doanh thu</span>
                        </div>
                    </div>

                    <div className={`${css.headerActionItem} ${isSortChiPhi ? css.buttonItemOn : css.buttonOff}`}
                         onClick={handleSortChiPhi}>
                        <div className={css.filterChoose}>
                            <img src={LocIcon} alt=""/>
                            <span>Chi phí</span>
                        </div>
                    </div>

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
        </>
    );
}

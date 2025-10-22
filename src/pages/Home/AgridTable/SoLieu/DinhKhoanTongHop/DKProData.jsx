import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import css from "../../DanhMuc/KeToanQuanTri.module.css";
import { MyContext } from "../../../../../MyContext.jsx";
import { Replace } from "lucide-react";
import { message } from 'antd';
// Ag Grid Function
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import AG_GRID_LOCALE_VN from "../../locale.jsx";
import { ClipboardModule } from "ag-grid-enterprise";
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
// CONSTANT
import { Dinh_Khoan } from "../../../../../Consts/TITLE_HEADER.js";
// COMPONENT
import ActionUpdateSKT from "../../actionButton/ActionUpdateSKT.jsx";
import ActionSave from "../../actionButton/ActionSave.jsx";
import ActionResetColumn from "../../actionButton/ActionResetColumn.jsx";
import ActionChangeFilter from "../../actionButton/ActionChangeFilter.jsx";
import ActionSearch from "../../actionButton/ActionSearch.jsx";
import ActionClearFilter from "../../actionButton/ActionClearAllFilter.jsx";
import ActionBookMark from "../../actionButton/ActionBookMark.jsx";
import MonthSelectBatDauKetThuc from "../../../SelectComponent/MonthSelectBatDauKetThuc.jsx";
import { SettingDKMapButton } from './settingDKmap/settingDKmap.jsx';
// FUNCTION
import { createTimestamp, formatMoney } from "../../../../../generalFunction/format.js";
import { handleSave } from "../../handleAction/handleSave.js";
import { onFilterTextBoxChanged } from "../../../../../generalFunction/quickFilter.js";
import { loadColumnState, saveColumnStateToLocalStorage } from "../../logicColumnState/columnState.jsx";
// API
import { getAllCard, getCardDataById } from "../../../../../apis/cardService.jsx";
import { createNewSoKeToan, getAllSoKeToan, updateSoKeToan } from "../../../../../apis/soketoanService.jsx";
import { getAllDinhKhoanProData, updateDinhKhoanProData } from "../../../../../apis/dinhKhoanProDataService.jsx";
import { getAllKmtc } from "../../../../../apis/kmtcService.jsx";
import { getAllKmf } from "../../../../../apis/kmfService.jsx";
import { getAllTaiKhoan } from "../../../../../apis/taiKhoanService.jsx";
import { getCurrentUserLogin } from "../../../../../apis/userService.jsx";
import { getItemFromIndexedDB } from "../../../../../storage/storageService.js";
import { getAllDinhKhoanMap } from '../../../../../apis/dinhKhoanMapService.jsx';
import PhieuLQView from "../../../SubStep/SubStepItem/Mau/PhieuLQView.jsx";

ModuleRegistry.registerModules([ClipboardModule, ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function DKProData() {
    const headerTitle = Dinh_Khoan;
    const table = 'DKProData';
    const tableCol = 'DKProDataCol';
    const tableFilter = 'DKProDataFilter';
    const gridRef = useRef();
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [startMonth, setStartMonth] = React.useState(1);
    const [endMonth, setEndMonth] = React.useState(12);
    const [checkLoc, setCheckLoc] = React.useState(false);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [showClearFilter, setShowClearFilter] = useState(false);
    const [checkColumn, setCheckColumn] = useState(true);
    const [updatedData, setUpdatedData] = useState([]);
    const { currentYear, currentMonth, currentDay, selectedCompany, } = useContext(MyContext);
    const [listVas, setListVas] = useState([]);
    const [listKmf, setListKmf] = useState([]);
    const [listKmtc, setListKmtc] = useState([]);
    const [listCard, setListCard] = useState([])
    const [selectedPhieuLQ, setSelectedPhieuLQ] = useState(null);

    const handleSaveData = async () => {
        try {
            await handleSave(updatedData, table, setUpdatedData, currentUser)
            await loadData()
            toast.success("Cập nhật thành công", { autoClose: 10 })
        } catch (error) {
            console.error("Lỗi khi cập nhật dữ liệu", error);
        }
    };

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
            editable: false,
            filter: true,
            suppressMenu: true,
            cellStyle: { fontSize: '14.5px' },
            wrapHeaderText: true,
            autoHeaderHeight: true,
            suppressHeaderMenuButton: true,
            ...filter(),
            ...sortMoi(),
            ...EditTable(),
        };
    });

    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

    const loadData = async (reset = false) => {
        const data = await getAllDinhKhoanProData();
        data.forEach(e => {
            e.tkCo2 = e.tkCo;
            e.tkNo2 = e.tkNo;
        })
        const savedFilters = sessionStorage.getItem(tableFilter);
        const filters = JSON.parse(savedFilters);
        if (gridRef.current && gridRef.current.api) {
            if (savedFilters) {
                gridRef.current.api.setRowData(data);
                gridRef.current.api.setFilterModel(filters);
            } else {
                gridRef.current.api.setRowData(data);
            }
        } else {
            console.warn('Grid chưa được khởi tạo hoặc gridRef.current là null');
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

    const fetchSelectData = async () => {
        try {
            const [kmtcData, kmfData, vasData, cardData] = await Promise.all([
                getAllKmtc(),
                getAllKmf(),
                getAllTaiKhoan(),
                getAllCard()
            ]);
            setListCard(cardData);
            setListVas(vasData)
            setListKmf(kmfData)
            setListKmtc(kmtcData)

        } catch (error) {
            console.error("Lỗi khi fetch dữ liệu:", error);
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([
                fetchCurrentUser(),
                loadData(),
                fetchSelectData(),
            ]);
            setLoading(false);
        };
        fetchData();
    }, []);


    useEffect(() => {
        const isMonthChanged = startMonth !== 1 || endMonth !== 12;
        if (isMonthChanged) {
            setCheckLoc(true);
        }
    }, [startMonth, endMonth]);

    function filter() {
        if (isStatusFilter) {
            return {
                filter: 'agMultiColumnFilter', floatingFilter: true, filterParams: {
                    filters: [{
                        filter: 'agTextColumnFilter',
                    }, {
                        filter: 'agSetColumnFilter',
                    },],
                },
            };
        }
    }

    function EditTable() {
        return false
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
                let updatedColDefs = [
                    {
                        field: 'id',
                        width: 70,
                        pinned: 'left',
                        headerName: 'STT',
                        ...filter(),
                    },
                    {
                        field: 'duyet',
                        width: 70,
                        pinned: 'left',
                        headerName: 'Duyệt',
                        ...filter(),
                        cellRenderer: 'agCheckboxCellRenderer',
                        cellEditor: 'agCheckboxCellEditor',
                        cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
                        valueGetter: (params) => {
                            return params.data.duyet ?? false;
                        },

                        valueSetter: (params) => {
                            const newValue = params.newValue === true || params.newValue === 'true';
                            params.data.duyet = newValue;
                            return true;
                        },
                        editable: true,

                    },
                    {
                        field: 'phieu_lq',
                        headerName: 'Chứng từ liên quan',
                        width: 200,
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
                        field: 'phieuKT',
                        headerName: 'Phiếu kế toán',
                        width: 120,
                        ...filter(),
                        editable: false,
                        cellRenderer: (params) => {
                            if (!params.value) {
                                return null;
                            }
                            return (
                                <>
                                    <button className={'btn-view-phieu'} onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
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
                                    <button className={'btn-view-phieu'} onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
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
                                    <button className={'btn-view-phieu'} onClick={() => setSelectedPhieuLQ(params.value)}>{params.value}</button>
                                </>
                            );
                        },
                    },
                    // {
                    //     field: 'card_id',
                    //     width: 150,
                    //     pinned: 'left',
                    //     headerName: 'Mã thẻ',
                    //     ...filter(),
                    //     cellRenderer: (params) => renderMaThe(params)
                    // },
                    // {
                    //     field: 'step_id',
                    //     width: 150,
                    //     pinned: 'left',
                    //     headerName: 'Mã bước',
                    //     ...filter(),
                    //     cellRenderer: (params) => renderMaBuoc(params)
                    //
                    // },
                    {
                        field: 'date',
                        width: 70,
                        pinned: 'left',
                        headerName: 'Ngày',
                        ...filter(),
                    },
                    {
                        field: 'note',
                        headerName: 'Diễn giải',
                        width: 250,
                        pinned: 'left',
                        ...filter(),
                        ...EditTable(),
                    },
                    {
                        field: 'tkNo',
                        headerName: 'TK nợ gốc',
                        width: 80,
                        ...filter(),
                        ...sortMoi(),
                        ...EditTable(),
                    },
                    {
                        field: 'tkCo',
                        headerName: 'TK có gốc',
                        width: 80,
                        ...filter(),
                        ...sortMoi(),
                        ...EditTable(),
                    },
                    {
                        field: 'tkNo2',
                        headerName: 'TK nợ',
                        width: 80,
                        ...filter(),
                        ...sortMoi(),
                        ...EditTable(),
                        editable: true,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listVas.map((value) => value?.code),
                        },
                    },
                    {
                        field: 'tkCo2',
                        headerName: 'TK có',
                        width: 80,
                        ...filter(),
                        ...sortMoi(),
                        ...EditTable(),
                        editable: true,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listVas.map((value) => value?.code),
                        },

                    },
                    {
                        field: 'soTien',
                        headerName: 'Tiền',
                        width: 110,
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: { textAlign: 'right' }, ...filter(), ...sortMoi(),
                    },
                    {
                        field: 'kmf',
                        headerName: 'Khoản mục phí',
                        width: 180,
                        ...filter(),
                        editable: true,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listKmf.map((value) => value?.code),
                        },
                    },
                    {
                        field: 'kmtc',
                        headerName: 'Khoản mục thu chi',
                        width: 180,
                        ...filter(),
                        editable: true,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listKmtc.map((value) => value?.code),
                        },
                    },
                    {
                        field: 'nhaCungCap',
                        headerName: 'Nhà cung cấp',
                        width: 140,
                        ...filter(),
                        ...sortMoi(),
                    },
                    {
                        field: 'hoaDon',
                        headerName: 'Hóa đơn',
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
                        field: 'phieuKT',
                        headerName: 'Phiếu kế toán',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                    },
                    // {
                    //     field: 'soChungTuLQ',
                    //     headerName: 'Chứng từ liên quan',
                    //     width: 120,
                    //     ...filter(),
                    //     ...EditTable(),
                    // },
                    {
                        field: 'unitCode',
                        headerName: 'Đơn vị(BU)',
                        width: 120,
                        ...filter(),
                        ...EditTable(),
                    },
                    {
                        field: 'sanPham',
                        headerName: 'Sản phẩm',
                        width: 120,
                        ...filter(),
                    },
                    {
                        field: 'temCode',
                        headerName: 'Dept',
                        width: 120, ...filter(),
                    },
                    {
                        field: 'hopDong',
                        headerName: 'Hợp đồng',
                        width: 120, ...filter(), ...EditTable(),
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
                        field: 'employee',
                        headerName: 'Nhân viên',
                        width: 120, ...filter(), ...EditTable(),
                    },
                    {
                        field: 'taiSan',
                        headerName: 'Tài sản',
                        width: 120, ...filter(), ...EditTable(),
                    },
                    {
                        field: 'taiSanDauTu',
                        headerName: 'Tài sản đầu tư',
                        width: 120, ...filter(), ...EditTable(),
                    },
                    {
                        field: 'loaiTien',
                        headerName: 'Loại tiền',
                        width: 120, ...filter(), ...EditTable(),
                    },
                    {
                        field: 'nganHang',
                        headerName: 'Ngân hàng',
                        width: 120, ...filter(), ...EditTable(),
                    },
                    {
                        field: 'chuSoHuu',
                        headerName: 'Chủ sở hữu',
                        width: 120, ...filter(), ...EditTable(),
                    },
                    {
                        field: 'chuongTrinh',
                        headerName: 'Chương trình',
                        width: 120, ...filter(), ...EditTable(),
                    },
                    {
                        field: 'fxRate',
                        headerName: 'Fx Rate',
                        width: 120, ...filter(), ...EditTable(),
                    },
                    {
                        field: 'soTienNguyenTe',
                        headerName: 'Tiền nguyên tệ',
                        width: 120, ...filter(), ...EditTable(),
                    },
                    {
                        field: 'chuThich',
                        headerName: 'Chú thích',
                        width: 250,
                        pinned: 'left',
                        ...filter(),
                        ...EditTable(),
                        editable: true
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
    }, [isStatusFilter, showClearFilter, checkColumn, loading]);

    const handleSearch = async () => {
        await loadData(true)
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

    const clearFilters = () => {
        // Kiểm tra nếu grid đã sẵn sàng
        if (gridRef.current && gridRef.current.api) {
            gridRef.current.api.setFilterModel(null); // Xóa tất cả bộ lọc
        }
        setShowClearFilter(false)
    };

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

    const handleUpdateSKT = async () => {
        const sktList = await getAllSoKeToan();
        const allGridData = gridRef.current.api.getModel().rowsToDisplay
            .map((rowNode) => rowNode.data)
            .filter((row) => row.duyet === true);
        if (allGridData) {
            try {

                await Promise.all(allGridData.map(async (dinhKhoan) => {
                    let phieu_lq;

                    if (dinhKhoan.phieu_lq && Array.isArray(dinhKhoan.phieu_lq)) {
                        phieu_lq = [...dinhKhoan.phieu_lq, dinhKhoan.soChungTu];
                    } else {
                        phieu_lq = [dinhKhoan.soChungTu];
                    }
                    const [year, month, day] = dinhKhoan.date?.split("-") || [];
                    const newItems = {
                        ...dinhKhoan,
                        id: null,
                        show: true,
                        created_at: createTimestamp(),
                        user_create: currentUser.email,
                        year: year || currentYear,
                        month: month || currentMonth,
                        day: day || currentDay,
                        card_id: dinhKhoan.card_id,
                        step_id: dinhKhoan.step_id,
                        dinhKhoanPro_id: dinhKhoan.id,
                        company: selectedCompany !== 'Toàn bộ' ? selectedCompany : '',
                        dien_giai: dinhKhoan.note,
                        tk_no: dinhKhoan.tkNo2,
                        tk_co: dinhKhoan.tkCo2,
                        so_tien_VND: dinhKhoan.soTien,
                        supplier: dinhKhoan.nhaCungCap,
                        so_tien_nguyen_te: dinhKhoan.soTienNguyenTe,
                        fx_rate: dinhKhoan.fxRate,
                        product: dinhKhoan.sanPham,
                        kmns: dinhKhoan.kmtc,
                        hop_dong: dinhKhoan.hopDong,
                        hoa_don: dinhKhoan.hoaDon,
                        unit_code: dinhKhoan.unitCode,
                        bo_phan_code: dinhKhoan.temCode,
                        vu_viec_code: dinhKhoan.duAn,
                        soChungTu: dinhKhoan.soChungTu,
                        phieuKT: dinhKhoan.phieuKT,
                        employee: dinhKhoan.employee,
                        phieu_thu_chi: dinhKhoan.phieu_thu_chi,
                        phieu_lq: phieu_lq,
                    };
                    const existingRow = sktList.find(item => item.dinhKhoanPro_id == dinhKhoan.id);
                    if (existingRow) {
                        await updateSoKeToan({ ...existingRow, ...newItems, id: existingRow.id });
                    } else {
                        await createNewSoKeToan(newItems);
                    }
                }));
                setUpdatedData([])
                toast.success("Cập nhật sổ kế toán thành công!", {
                    autoClose: 3000,
                });
            } catch (error) {
                console.log(error)
                toast.error("Có lỗi xảy ra khi cập nhật sổ kế toán.", {
                    autoClose: 5000,
                });
            }
        }
    };

    const handleAutoFill = async () => {
        try {
            const allGridData = gridRef.current.api.getModel().rowsToDisplay
                .map((rowNode) => rowNode.data);
            const allDKMap = await getAllDinhKhoanMap();
            let updatedCount = 0;

            await Promise.all(allGridData.map(async (gridItem) => {
                try {
                    const soTienNum = parseInt(gridItem.soTien, 10);
                    if (isNaN(soTienNum)) {
                        console.warn(`Invalid soTien value for item:`, gridItem);
                        return gridItem;
                    }

                    const matchingRule = allDKMap.find(mapItem => {
                        try {
                            const kmfMatch = mapItem.kqkd === '*' || gridItem.kmf === mapItem.kqkd;
                            const kmtcMatch = mapItem.thuChi === '*' || gridItem.kmtc === mapItem.thuChi;
                            const tkCoMatch = mapItem.tkCo_nhap === '*' || gridItem.tkCo === mapItem.tkCo_nhap;
                            const tkNoMatch = mapItem.tkNo_nhap === '*' || gridItem.tkNo === mapItem.tkNo_nhap;

                            const withinRange = (
                                (mapItem.giaTri_start === 0 && mapItem.giaTri_end === 0) ||
                                (soTienNum >= mapItem.giaTri_start && soTienNum <= mapItem.giaTri_end)
                            );

                            const noteKeywords = mapItem.keyword || [];
                            const noteMatches = noteKeywords.length === 0 ||
                                noteKeywords.every(keyword =>
                                    gridItem.note.toLowerCase().includes(keyword.toLowerCase())
                                );

                            return kmfMatch && kmtcMatch && withinRange &&
                                noteMatches && tkCoMatch && tkNoMatch;
                        } catch (err) {
                            console.error(`Error processing rule:`, mapItem, err);
                            return false;
                        }
                    });

                    if (matchingRule) {
                        const newTkCo = matchingRule.tkCo === '*' ? gridItem.tkCo : matchingRule.tkCo;
                        const newTkNo = matchingRule.tkNo === '*' ? gridItem.tkNo : matchingRule.tkNo;

                        await updateDinhKhoanProData({
                            ...gridItem,
                            tkCo2: newTkCo,
                            tkNo2: newTkNo
                        });
                        updatedCount++;
                        return {
                            ...gridItem,
                            tkCo2: newTkCo,
                            tkNo2: newTkNo
                        };
                    }

                    return gridItem;
                } catch (err) {
                    console.error(`Error processing grid item: `, gridItem, err);
                    return gridItem;
                }
            }));

            if (updatedCount > 0) {
                message.success(`Đã tự động cập nhật ${updatedCount} dòng thành công`);
            } else {
                message.info('Không có dòng cần cập nhật');
            }

            loadData();
        } catch (err) {
            console.error('Error in handleAutoFill:', err);
        }
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
                    <ActionUpdateSKT handleUpdateSKT={handleUpdateSKT} updatedData={updatedData} />
                    <ActionSave handleSaveData={handleSaveData} updateData={updatedData} />
                    <MonthSelectBatDauKetThuc setStartMonth={setStartMonth} setEndMonth={setEndMonth} />
                    <button
                        className={css.settingsIcon}
                        onClick={() => handleAutoFill()}
                        title="Cài đặt"
                    >
                        <Replace />
                    </button>
                    <SettingDKMapButton />
                    {(checkLoc) && (<div className={`${css.headerActionButton} ${css.buttonOn}`}
                        onClick={handleSearch}
                    >
                        <span>Lọc</span>
                    </div>)}
                </div>
            </div>
            <div
                style={{
                    height: '80vh', display: 'flex', flexDirection: 'column', position: 'relative', marginTop: '15px',
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
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onCellValueChanged={handleCellValueChanged}
                        onFilterChanged={onFilterChanged}
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        suppressScrollOnNewData={true}
                    />
                    {selectedPhieuLQ &&
                        <PhieuLQView selectedPhieuLQ={selectedPhieuLQ} setSelectedPhieuLQ={setSelectedPhieuLQ}/>}
                </div>
            </div>
        </>);
}

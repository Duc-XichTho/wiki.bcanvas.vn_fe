import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {toast} from 'react-toastify';
import css from "../../DanhMuc/KeToanQuanTri.module.css";
import {MyContext} from "../../../../../MyContext.jsx";
import {Replace} from "lucide-react";
import {message} from 'antd';
// Ag Grid Function
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import AG_GRID_LOCALE_VN from "../../locale.jsx";
import {ClipboardModule} from "ag-grid-enterprise";
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
// CONSTANT
import {Dinh_Khoan} from "../../../../../Consts/TITLE_HEADER.js";
// COMPONENT
import ActionUpdateSKT from "../../actionButton/ActionUpdateSKT.jsx";
import ActionSave from "../../actionButton/ActionSave.jsx";
import ActionResetColumn from "../../actionButton/ActionResetColumn.jsx";
import ActionChangeFilter from "../../actionButton/ActionChangeFilter.jsx";
import ActionSearch from "../../actionButton/ActionSearch.jsx";
import ActionClearFilter from "../../actionButton/ActionClearAllFilter.jsx";
import ActionBookMark from "../../actionButton/ActionBookMark.jsx";
import MonthSelectBatDauKetThuc from "../../../SelectComponent/MonthSelectBatDauKetThuc.jsx";
import {SettingDKMapButton} from './settingDKmap/settingDKmap.jsx';
// FUNCTION
import {createTimestamp, formatMoney} from "../../../../../generalFunction/format.js";
import {handleSave} from "../../handleAction/handleSave.js";
import {onFilterTextBoxChanged} from "../../../../../generalFunction/quickFilter.js";
import {loadColumnState, saveColumnStateToLocalStorage} from "../../logicColumnState/columnState.jsx";
// API
import {getAllCard, getCardDataById} from "../../../../../apis/cardService.jsx";
import {createNewSoKeToan, getAllSoKeToan, updateSoKeToan} from "../../../../../apis/soketoanService.jsx";
import {getAllDinhKhoanProData, updateDinhKhoanProData} from "../../../../../apis/dinhKhoanProDataService.jsx";
import {getAllKmtc} from "../../../../../apis/kmtcService.jsx";
import {getAllKmf} from "../../../../../apis/kmfService.jsx";
import {getAllTaiKhoan} from "../../../../../apis/taiKhoanService.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getItemFromIndexedDB} from "../../../../../storage/storageService.js";
import {getAllDinhKhoanMap} from '../../../../../apis/dinhKhoanMapService.jsx';
import PhieuLQView from "../../../SubStep/SubStepItem/Mau/PhieuLQView.jsx";

ModuleRegistry.registerModules([ClipboardModule, ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function DKProDataView({phieu}) {

    const gridRef = useRef();
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listVas, setListVas] = useState([]);
    const [listKmf, setListKmf] = useState([]);
    const [listKmtc, setListKmtc] = useState([]);
    const [listCard, setListCard] = useState([])
    const [selectedPhieuLQ, setSelectedPhieuLQ] = useState(null);

    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            filter: true,
            suppressMenu: true,
            cellStyle: {fontSize: '14.5px'},
            wrapHeaderText: true,
            autoHeaderHeight: true,
            suppressHeaderMenuButton: true,
            ...sortMoi(),
            ...EditTable(),
        };
    });

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const loadData = async (reset = false) => {
        if (phieu) {
            let data = await getAllDinhKhoanProData();
            data = data.filter(e => e.phieuKT == phieu)
            data.forEach(e => {
                e.tkCo2 = e.tkCo;
                e.tkNo2 = e.tkNo;
            })
            gridRef.current.api.setRowData(data);
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
                loadData(),
                fetchSelectData(),
            ]);
            setLoading(false);
        };
        fetchData();
    }, []);
    useEffect(() => {
        loadData().then()
    }, [phieu]);

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                let updatedColDefs = [
                    {
                        field: 'id',
                        width: 70,
                        pinned: 'left',
                        headerName: 'STT',
                    },
                    {
                        field: 'duyet',
                        width: 70,
                        pinned: 'left',
                        headerName: 'Duyệt',
                        cellRenderer: 'agCheckboxCellRenderer',
                        cellEditor: 'agCheckboxCellEditor',
                        cellStyle: {display: 'flex', justifyContent: 'center', alignItems: 'center'},
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
                        width: 120,
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
                        editable: false,
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
                        editable: false,
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
                        editable: false,
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
                    },
                    {
                        field: 'note',
                        headerName: 'Diễn giải',
                        width: 250,
                        pinned: 'left',
                        ...EditTable(),
                    },
                    {
                        field: 'tkNo',
                        headerName: 'TK nợ gốc',
                        width: 80,
                        ...sortMoi(),
                        ...EditTable(),
                    },
                    {
                        field: 'tkCo',
                        headerName: 'TK có gốc',
                        width: 80,
                        ...sortMoi(),
                        ...EditTable(),
                    },
                    {
                        field: 'tkNo2',
                        headerName: 'TK nợ',
                        width: 80,
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
                        cellStyle: {textAlign: 'right'}, ...sortMoi(),
                    },
                    {
                        field: 'kmf',
                        headerName: 'Khoản mục phí',
                        width: 180,
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
                        ...sortMoi(),
                    },
                    {
                        field: 'hoaDon',
                        headerName: 'Hóa đơn',
                        width: 120,
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
                        ...EditTable(),
                    },
                    {
                        field: 'unitCode',
                        headerName: 'Đơn vị(BU)',
                        width: 120,
                        ...EditTable(),
                    },
                    {
                        field: 'sanPham',
                        headerName: 'Sản phẩm',
                        width: 120,
                    },
                    {
                        field: 'temCode',
                        headerName: 'Dept',
                        width: 120,
                    },
                    {
                        field: 'hopDong',
                        headerName: 'Hợp đồng',
                        width: 120, ...EditTable(),
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
                        width: 120, ...EditTable(),
                    },
                    {
                        field: 'taiSan',
                        headerName: 'Tài sản',
                        width: 120, ...EditTable(),
                    },
                    {
                        field: 'taiSanDauTu',
                        headerName: 'Tài sản đầu tư',
                        width: 120, ...EditTable(),
                    },
                    {
                        field: 'loaiTien',
                        headerName: 'Loại tiền',
                        width: 120, ...EditTable(),
                    },
                    {
                        field: 'nganHang',
                        headerName: 'Ngân hàng',
                        width: 120, ...EditTable(),
                    },
                    {
                        field: 'chuSoHuu',
                        headerName: 'Chủ sở hữu',
                        width: 120, ...EditTable(),
                    },
                    {
                        field: 'chuongTrinh',
                        headerName: 'Chương trình',
                        width: 120, ...EditTable(),
                    },
                    {
                        field: 'fxRate',
                        headerName: 'Fx Rate',
                        width: 120, ...EditTable(),
                    },
                    {
                        field: 'soTienNguyenTe',
                        headerName: 'Tiền nguyên tệ',
                        width: 120, ...EditTable(),
                    },
                    {
                        field: 'chuThich',
                        headerName: 'Chú thích',
                        width: 250,
                        pinned: 'left',
                        ...EditTable(),
                        editable: true
                    },
                ];
                setColDefs(updatedColDefs);

            } catch (error) {
                console.log(error)
               console.log(error)
            }
        };
        fetchData();
    }, [loading]);

    return (
        <>
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
                        suppressScrollOnNewData={true}
                    />
                    {selectedPhieuLQ &&
                        <PhieuLQView selectedPhieuLQ={selectedPhieuLQ} setSelectedPhieuLQ={setSelectedPhieuLQ}/>}
                </div>
            </div>
        </>);
}

import css from "./Warehouse.module.css"
import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import { toast } from 'react-toastify';
import AG_GRID_LOCALE_VN from "../../../locale.jsx";
import { DatePicker, Spin } from 'antd';
import { formatMoney } from "../../../../../../generalFunction/format.js";
import { getFullDetailPhieuNhapService } from "../../../../../../apis/detailPhieuNhapService.jsx";
import { getFullDetailPhieuXuatService } from "../../../../../../apis/detailPhieuXuatService.jsx";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import ActionChangeFilter from "../../../actionButton/ActionChangeFilter.jsx";
import { calNhapXuatTon } from "../logicTonKho.js";
import { setItemInIndexedDB2 } from "../../../../../KeToanQuanTri/storage/storageService.js";
import {MyContext} from "../../../../../../MyContext.jsx";
import {getCurrentUserLogin} from "../../../../../../apis/userService.jsx";
import {getPermissionDataCty} from "../../../../../Canvas/getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../../Consts/TITLE_HEADER.js";
import ActionSelectCompanyBaoCao from "../../../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";
import Loading from '../../../../../Loading/Loading.jsx';

dayjs.extend(isBetween);


const { RangePicker } = DatePicker;
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const NhapXuatTon = () => {
    const table = 'NhapXuatTon'
    const key = 'NHAP_XUAT_TON'
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loadingSpin, setLoadingSpin] = useState(false);
    const [gridVisible, setGridVisible] = useState(false);
    const [dateRange, setDateRange] = useState([null, null]);


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


    // Set default date range (from 45 days ago to today)
    useEffect(() => {
        const today = new Date();
        const fortyFiveDaysAgo = new Date();
        fortyFiveDaysAgo.setDate(today.getDate() - 45);

        const formattedToday = today.toISOString().split('T')[0];
        const formattedFortyFiveDaysAgo = fortyFiveDaysAgo.toISOString().split('T')[0];

        setDateRange([formattedFortyFiveDaysAgo, formattedToday]);
    }, []);


    const getData = async (startDate, endDate) => {
        setLoadingSpin(true);
        const nhap = await getFullDetailPhieuNhapService();
        const xuat = await getFullDetailPhieuXuatService();
        let result = []
        result = calNhapXuatTon(nhap, xuat, startDate, endDate)
        await setItemInIndexedDB2(key, result);
        setRowData(result);
        setTimeout(() => {
            setLoadingSpin(false);
            setGridVisible(true);
        }, 500);
    };


    useEffect(() => {
        if (dateRange[0] && dateRange[1]) {
            getData(dateRange[0], dateRange[1]);
        }
    }, [dateRange]);

    const handleDateChange = (dates) => {
        if (dates) {
            setDateRange(dates);
        }
    };

    useEffect(() => {
        getData(dateRange[0], dateRange[1]);
    }, []);

    const handleChangeStatusFilter = () => {
        setIsStatusFilter(!isStatusFilter);
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

    const mapDataToHeaders = (data) => {
        return data.map((item) => ({
            'Code': item.code,
            'Tên hàng hóa': item.name,
            'Lô': item.lo,
            'Kho': item.kho,
            'Số lượng nhập': item.so_luong_nhap,
            'Số lượng xuất': item.so_luong_xuat,
            'Tồn': (+item.so_luong_nhap - +item.so_luong_xuat)
        }));
    };

    const fetchData = async () => {
        try {

            setColDefs([
                {
                    field: 'kho', headerName: 'Kho', width: 150,
                    ...filter(), pinned: 'left',
                },
                {
                    field: 'code', headerName: 'Mã hàng hóa', width: 150,
                    ...filter(), pinned: 'left',
                },
                {
                    field: 'name', headerName: 'Tên hàng hóa', width: 150,
                    ...filter(), pinned: 'left',
                },
                {
                    field: 'lo', headerName: 'Lô hàng', width: 150,
                    ...filter(), pinned: 'left',
                },
                {
                    field: 'dvt', headerName: 'ĐV Tính', width: 150,
                    ...filter()
                },
                {
                    headerName: 'Tồn đầu kỳ',
                    children: [
                        {
                            field: 'SoLuongTonDauKy',
                            headerName: 'Số lượng',
                            width: 150,
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            ...filter(),
                        },
                        {
                            field: 'DonGiaTonDauKy',
                            headerName: 'Đơn giá',
                            width: 150,
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            cellRenderer: params => formatMoney(params.value),
                            ...filter(),
                        },
                        {
                            field: 'GiaTriTonDauKy',
                            headerName: 'Giá trị',
                            width: 150,
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            cellRenderer: params => formatMoney(params.value),
                            ...filter(),
                        },
                    ],
                },
                {
                    headerName: 'Nhập trong kỳ',
                    children: [
                        {
                            field: 'SoLuongNhapTrongKy',
                            headerName: 'Số lượng',
                            width: 150,
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            ...filter(),
                        },
                        {
                            field: 'DonGiaNhapTrongKy',
                            headerName: 'Đơn giá',
                            width: 150,
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            cellRenderer: params => formatMoney(params.value),
                            ...filter(),
                        },
                        {
                            field: 'GiaTriNhapTrongKy',
                            headerName: 'Giá trị',
                            width: 150,
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            cellRenderer: params => formatMoney(params.value),
                            ...filter(),
                        },
                    ],
                },
                {
                    headerName: 'Xuất trong kỳ',
                    children: [
                        {
                            field: 'SoLuongXuatTrongKy',
                            headerName: 'Số lượng',
                            width: 150,
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            ...filter(),
                        },
                        {
                            field: 'DonGiaXuatTrongKy',
                            headerName: 'Đơn giá',
                            width: 150,
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            cellRenderer: params => formatMoney(params.value),
                            ...filter(),
                        },
                        {
                            field: 'GiaTriXuatTrongKy',
                            headerName: 'Giá trị',
                            width: 150,
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            cellRenderer: params => formatMoney(params.value),
                            ...filter(),
                        },
                    ],
                },
                {
                    headerName: 'Tồn cuối kỳ',
                    children: [
                        {
                            field: 'SoLuongTonCuoiKy',
                            headerName: 'Số lượng',
                            width: 150,
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            ...filter(),
                        },
                        {
                            field: 'DonGiaTonCuoiKy',
                            headerName: 'Đơn giá',
                            width: 150,
                            ...filter(),
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            cellRenderer: params => formatMoney(params.value)
                        },
                        {
                            field: 'GiaTriTonCuoiKy',
                            headerName: 'Giá trị'
                            , width: 150,
                            ...filter(),
                            cellStyle: { textAlign: 'right' },
                            headerClass: 'right-align-important',
                            cellRenderer: params => formatMoney(params.value)

                        }
                    ],
                },
            ]);
        } catch (error) {
           console.log(error)
        }
    };

    useEffect(() => {
        fetchData();
    }, [isStatusFilter]);

    return (
        <div className={css.main}>
            <div className={css.agGridReactWrapper}>
                {loadingSpin ? (
                        // <div
                        //     style={{
                        //         width: "100%",
                        //         height: "100%",
                        //         display: "flex",
                        //         justifyContent: "center",
                        //         alignItems: "center",
                        //     }}
                        // >
                            <Loading loading={loadingSpin}/>
                        //     <Spin size="large" />
                        // </div>
                    )
                    : (
                        <div className={gridVisible ? css.zoomIn : ''}>
                            <div className={css.headerAction}>
                                <div className={css.pickDate}>
                                    Chọn kỳ
                                    <RangePicker
                                        size={'middle'}
                                        format={'DD/MM/YYYY'}
                                        value={dateRange.map(date => (date ? dayjs(date) : null))}
                                        onChange={handleDateChange}
                                    />
                                </div>

                                <ActionChangeFilter isStatusFilter={isStatusFilter}
                                                    handleChangeStatusFilter={handleChangeStatusFilter} />

                            </div>
                            <AgGridReact
                                statusBar={statusBar}
                                enableRangeSelection={true}
                                ref={gridRef}
                                rowData={rowData}
                                defaultColDef={defaultColDef}
                                columnDefs={colDefs}
                                localeText={AG_GRID_LOCALE_VN}
                                className="ag-theme-quartz"
                            />
                        </div>
                    )
                }
            </div>

        </div>
    )
}

export default NhapXuatTon

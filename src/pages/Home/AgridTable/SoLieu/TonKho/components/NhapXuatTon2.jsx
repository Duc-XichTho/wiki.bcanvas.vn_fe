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
import { Button, DatePicker, Dropdown, Spin } from 'antd';
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
import ActionDisplayRichNoteSwitch from "../../../../../KeToanQuanTri/ActionButton/ActionDisplayRichNoteSwitch.jsx";
import RichNoteKTQTRI from "../../../../SelectComponent/RichNoteKTQTRI.jsx";
import { ChevronDown } from 'lucide-react';
import ActionMenuDropdown from '../../../../../KeToanQuanTri/ActionButton/ActionMenuDropdown.jsx';
import Loading from '../../../../../Loading/Loading.jsx';

dayjs.extend(isBetween);


const { RangePicker } = DatePicker;
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const NhapXuatTon2 = () => {
    const key = 'NHAP_XUAT_TON'
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loadingSpin, setLoadingSpin] = useState(false);
    const [gridVisible, setGridVisible] = useState(false);
    const [dateRange, setDateRange] = useState([null, null]);
    const table = key+ "_COMPANY";
    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            companySelected: storedSettings?.companySelected ?? [],
            isStatusFilter: storedSettings?.isStatusFilter ?? false,
            isShowInfo: storedSettings?.isShowInfo ?? false,
        };
    };

    const [titleName, setTitleName] = useState('');
    const [listCom, setListCom] = useState([])
    const [companySelected, setCompanySelected] = useState(getLocalStorageSettings().companySelected || [])
    const [isShowInfo, setIsShowInfo] = useState( getLocalStorageSettings().isShowInfo);
    const {
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
    } = useContext(MyContext) || {};

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

    const [isStatusFilter, setIsStatusFilter] = useState(getLocalStorageSettings().isStatusFilter);


    useEffect(() => {
        const tableSettings = {
            isStatusFilter,
            isShowInfo,
        };

        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isStatusFilter,
        isShowInfo,]);


    // Set default date range (from 45 days ago to today)
    useEffect(() => {
        const today = new Date();
        const fortyFiveDaysAgo = new Date();
        fortyFiveDaysAgo.setDate(today.getDate() - 45);

        const formattedToday = today.toISOString().split('T')[0];
        const formattedFortyFiveDaysAgo = fortyFiveDaysAgo.toISOString().split('T')[0];

        setDateRange([formattedFortyFiveDaysAgo, formattedToday]);
    }, []);


    const handleShowInfo = () => {
        setIsShowInfo(prevState => !prevState);
    };
    const getData = async (startDate, endDate) => {
        if (companySelected && companySelected.length > 0) {
            setLoadingSpin(true);
            let nhap = await getFullDetailPhieuNhapService();
            let xuat = await getFullDetailPhieuXuatService();
            if (companySelected.some(e => e.code != 'HQ')) {
                nhap = nhap.filter(e => companySelected.some(c => c.code == e.company));
                xuat = xuat.filter(e => companySelected.some(c => c.code == e.company));
            }
            let result = []
            result = calNhapXuatTon(nhap, xuat, startDate, endDate)
            await setItemInIndexedDB2(key, result);
            setRowData(result);
            setTimeout(() => {
                setLoadingSpin(false);
                setGridVisible(true);
            }, 500);
        }
    };


    useEffect(() => {
        if (dateRange[0] && dateRange[1]) {
            getData(dateRange[0], dateRange[1]);
        }
    }, [dateRange, companySelected]);

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

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const items = [
        {
            key: '0',
            label: (
                <span>{isShowInfo ? '✅ Bật ghi chú' : '❌ Tắt ghi chú'}</span>
            ),
            onClick: handleShowInfo,
        },
        {
            key: '1',
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

                                <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                                           valueSelected={companySelected}/>

                                <div className={css.pickDate}>
                                    Chọn kỳ
                                    <RangePicker
                                        size={'middle'}
                                        format={'DD/MM/YYYY'}
                                        value={dateRange.map(date => (date ? dayjs(date) : null))}
                                        onChange={handleDateChange}
                                    />
                                </div>

                                <ActionMenuDropdown popoverContent={popoverContent}
                                                    dropdownOpen={dropdownOpen}
                                                    setDropdownOpen={setDropdownOpen}
                                />

                                {/*<ActionDisplayRichNoteSwitch isChecked={isShowInfo} onChange={handleShowInfo}/>*/}
                                {/*<ActionChangeFilter isStatusFilter={isStatusFilter}*/}
                                {/*                    handleChangeStatusFilter={handleChangeStatusFilter}/>*/}

                            </div>
                            {isShowInfo && <div style={{width: '100%', height: '11%', boxSizing: "border-box"}}>
                                <RichNoteKTQTRI table={`${table}_Canvas_note`}/>
                            </div>}
                            <div style={{display: 'flex', gap: 20, marginTop: '10px'}}>
                                <div style={{flex: 1, height: '90%'}}>
                                    <div
                                        style={{
                                            height: isShowInfo ? '75vh' : '85vh',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                        }}
                                    >

                                        <div className="ag-theme-quartz"
                                             style={{height: '100%', width: '100%', display: 'flex'}}>
                                            <div style={{
                                                flex:'100%',
                                                transition: 'flex 0.3s',
                                            }}>
                                                <AgGridReact
                                                    statusBar={statusBar}
                                                    enableRangeSelection={true}
                                                    ref={gridRef}
                                                    rowData={rowData}
                                                    defaultColDef={defaultColDef}
                                                    columnDefs={colDefs}
                                                    localeText={AG_GRID_LOCALE_VN}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>

        </div>
    )
}

export default NhapXuatTon2

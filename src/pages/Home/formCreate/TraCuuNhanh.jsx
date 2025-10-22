import {Modal, Row} from "antd";
import React, {useContext, useEffect, useMemo, useState} from "react";
import {AgGridReact} from "ag-grid-react";
import {ModuleRegistry} from "@ag-grid-community/core";
import {ClientSideRowModelModule} from "@ag-grid-community/client-side-row-model";
import {RowGroupingModule} from "@ag-grid-enterprise/row-grouping";
import {SetFilterModule} from "@ag-grid-enterprise/set-filter";
import AG_GRID_LOCALE_VN from "../AgridTable/locale.jsx";
import {formatDateISO, formatMoney} from "../../../generalFunction/format.js";
import {toast} from "react-toastify";
import {filter} from "../AgridTable/FilterAgrid.jsx";
import {getAllTaiKhoan} from "../../../apis/taiKhoanService.jsx";
import {getAllSoKeToan} from "../../../apis/soketoanService.jsx";
import {calCDPS2} from "../AgridTable/SoLieu/CDPS/logicCDPS.js";
import {MyContext} from "../../../MyContext.jsx";
import {
    DANH_MUC_SP_BAN,
    DANH_SACH_KMKQKD,
    DANH_SACH_KMTC,
    DANH_SACH_NHAN_VIEN,
    TIEN_TUC_THOI, TON_KHO_TUC_THOI
} from "../../../Consts/TRA_CUU_NHANH_LIST.js";
import {getAllHangHoa} from "../../../apis/hangHoaService.jsx";
import {getAllKmf} from "../../../apis/kmfService.jsx";
import {getAllKmtc} from "../../../apis/kmtcService.jsx";
import {getAllNhanVien} from "../../../apis/nhanVienService.jsx";
import {getFullDetailPhieuNhapService} from "../../../apis/detailPhieuNhapService.jsx";
import {getFullDetailPhieuXuatService} from "../../../apis/detailPhieuXuatService.jsx";
import {calNhapXuatTon} from "../AgridTable/SoLieu/TonKho/logicTonKho.js";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const TraCuuNhanh = ({open, onClose, table}) => {
    const [rowData, setRowData] = useState([])
    const [colDefs, setColDefs] = useState([]);
    const {currentYear} = useContext(MyContext)
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            filter: true,
            suppressMenu: true,
            cellStyle: {fontSize: '14.5px'},
            wrapHeaderText: true,
            autoHeaderHeight: true,
            width: 120,
        };
    });

    const loadData = async () => {
        if (table === TIEN_TUC_THOI) {
            const data = await getAllTaiKhoan();
            const listSKT = await getAllSoKeToan();
            const filteredData = data.filter(item => item.code.startsWith("11") && item.year == currentYear);
            let lastData = calCDPS2(listSKT, filteredData, 1, 12);
            setRowData(lastData);
        } else if (table === DANH_MUC_SP_BAN) {
            const data = await getAllHangHoa();
            setRowData(data);
        } else if (table === DANH_SACH_KMKQKD) {
            const data = await getAllKmf();
            const filteredData = data.filter(item => item.trang_thai === "Đang dùng");
            setRowData(filteredData);
        } else if (table === DANH_SACH_KMTC) {
            const data = await getAllKmtc();
            const filteredData = data.filter(item => item.trang_thai === "Đang dùng");
            setRowData(filteredData);
        } else if (table === DANH_SACH_NHAN_VIEN) {
            const data = await getAllNhanVien();
            setRowData(data);
        } else if (table === TON_KHO_TUC_THOI) {
            const nhap = await getFullDetailPhieuNhapService();
            const xuat = await getFullDetailPhieuXuatService();
            let result = []
            result = calNhapXuatTon(nhap, xuat, `${currentYear}-01-01`, `${currentYear}-12-31`)
            setRowData(result);
        }

    };


    useEffect(() => {
        loadData();
    }, []);

    const getColumnDefs = (table) => {
        switch (table) {
            case TIEN_TUC_THOI:
                return [
                    {
                        field: 'id',
                        headerName: 'STT',
                        hide: false,
                        width: 80,
                        ...filter(),
                        editable: false,
                    },
                    {
                        field: 'code',
                        headerName: 'Mã tài khoản',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên tài khoản',
                        width: 250,
                        ...filter(),
                    },
                    {
                        field: 'cap',
                        headerName: 'Cấp',
                        width: 50,
                        ...filter(),
                    },
                    {
                        field: 'no_dau_ky',
                        headerName: 'Nợ đầu kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                        headerStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'co_dau_ky',
                        headerName: 'Có đầu kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'net_dau_ky',
                        headerName: 'Net đầu kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'no',
                        headerName: 'Nợ trong kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'co',
                        headerName: 'Có trong kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'net_trong_ky',
                        headerName: 'Net trong kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'no_cuoi_ky',
                        headerName: 'Nợ cuối kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'co_cuoi_ky',
                        headerName: 'Có cuối kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'net_cuoi_ky',
                        headerName: 'Net cuối kỳ',
                        ...filter(),
                        headerClass: 'right-align-important',
                        cellRenderer: (params) => formatMoney(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                ];
            case DANH_MUC_SP_BAN:
                return [
                    {
                        field: 'id',
                        headerName: 'STT',
                        hide: false,
                        width: 80,
                        ...filter(),
                        editable: false,
                    },
                    {
                        field: 'code',
                        headerName: 'Mã sản phẩm',
                        width: 120,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên sản phẩm',
                        width: 250,
                        ...filter(),
                    },
                    {
                        field: 'don_vi',
                        headerName: 'Đơn vị',
                        width: 250,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Loại sản phẩm',
                        width: 250,
                        ...filter(),
                    },

                ];
            case DANH_SACH_KMKQKD:
                return [
                    {
                        field: 'id',
                        headerName: 'STT',
                        hide: false,
                        width: 80,
                        ...filter(),
                        editable: false,
                    },
                    {
                        field: 'code',
                        headerName: 'Mã KMCP',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên KMCP',
                        width: 250,
                        ...filter(),
                    },
                    {
                        field: 'loai_chi_phi',
                        headerName: 'Loại chi phí',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'nhom_kmcp',
                        headerName: 'Nhóm KMCP',
                        width: 150,
                        ...filter(),
                    },
                ];
            case DANH_SACH_KMTC:
                return [
                    {
                        field: 'id',
                        headerName: 'STT',
                        hide: false,
                        width: 80,
                        ...filter(),
                        editable: false,
                    },
                    {
                        field: 'code',
                        headerName: 'Mã KMTC',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên KMTC',
                        width: 250,
                        ...filter(),
                    },
                    {
                        field: 'loai',
                        headerName: 'Loại chi phí',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'nhom_kmtc',
                        headerName: 'Nhóm KMTC',
                        width: 150,
                        ...filter(),
                    },
                ];
            case DANH_SACH_NHAN_VIEN:
                return [
                    {
                        field: 'id',
                        headerName: 'STT',
                        hide: false,
                        width: 80,
                        ...filter(),
                        editable: false,
                    },
                    {
                        field: 'code',
                        headerName: 'Mã nhân viên',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên nhân viên',
                        width: 130,
                        ...filter(),
                    },
                    {
                        field: 'dinh_danh',
                        headerName: 'Định danh',
                        width: 150,
                        ...filter(),
                        hide: false,
                    },
                    {
                        field: 'cccd',
                        headerName: 'CCCD',
                        width: 120,
                        ...filter(),
                    },
                    {
                        field: 'ngay_sinh',
                        headerName: 'Ngày sinh',
                        width: 120,
                        ...filter(),
                        cellRenderer: params => formatDateISO(params.value)
                    },
                    {
                        field: 'phong_ban',
                        headerName: 'Phòng ban',
                        width: 180,
                        ...filter(),
                    },
                ];
            case TON_KHO_TUC_THOI:
                return [
                    {
                        field: 'kho', headerName: 'Kho', width: 150,
                        ...filter(), pinned: 'left',
                    },
                    {
                        field: 'code', headerName: 'Mã hàng hóa', width: 150,
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
                                cellStyle: {textAlign: 'right'},
                                headerClass: 'right-align-important',
                                ...filter(),
                            },
                            {
                                field: 'DonGiaTonDauKy',
                                headerName: 'Đơn giá',
                                width: 150,
                                cellStyle: {textAlign: 'right'},
                                headerClass: 'right-align-important',
                                cellRenderer: params => formatMoney(params.value),
                                ...filter(),
                            },
                            {
                                field: 'GiaTriTonDauKy',
                                headerName: 'Giá trị',
                                width: 150,
                                cellStyle: {textAlign: 'right'},
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
                                cellStyle: {textAlign: 'right'},
                                headerClass: 'right-align-important',
                                ...filter(),
                            },
                            {
                                field: 'DonGiaNhapTrongKy',
                                headerName: 'Đơn giá',
                                width: 150,
                                cellStyle: {textAlign: 'right'},
                                headerClass: 'right-align-important',
                                cellRenderer: params => formatMoney(params.value),
                                ...filter(),
                            },
                            {
                                field: 'GiaTriNhapTrongKy',
                                headerName: 'Giá trị',
                                width: 150,
                                cellStyle: {textAlign: 'right'},
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
                                cellStyle: {textAlign: 'right'},
                                headerClass: 'right-align-important',
                                ...filter(),
                            },
                            {
                                field: 'DonGiaXuatTrongKy',
                                headerName: 'Đơn giá',
                                width: 150,
                                cellStyle: {textAlign: 'right'},
                                headerClass: 'right-align-important',
                                cellRenderer: params => formatMoney(params.value),
                                ...filter(),
                            },
                            {
                                field: 'GiaTriXuatTrongKy',
                                headerName: 'Giá trị',
                                width: 150,
                                cellStyle: {textAlign: 'right'},
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
                                cellStyle: {textAlign: 'right'},
                                headerClass: 'right-align-important',
                                ...filter(),
                            },
                            {
                                field: 'DonGiaTonCuoiKy',
                                headerName: 'Đơn giá',
                                width: 150,
                                ...filter(),
                                cellStyle: {textAlign: 'right'},
                                headerClass: 'right-align-important',
                                cellRenderer: params => formatMoney(params.value)
                            },
                            {
                                field: 'GiaTriTonCuoiKy',
                                headerName: 'Giá trị'
                                , width: 150,
                                ...filter(),
                                cellStyle: {textAlign: 'right'},
                                headerClass: 'right-align-important',
                                cellRenderer: params => formatMoney(params.value)

                            }
                        ],
                    },];

            default:
                return [];
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                const updatedColDefs = getColumnDefs(table);
                setColDefs(updatedColDefs);
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [table]);

    return (
        <Modal
            title={`Tra cứu nhanh ${table} `}
            open={open}
            onCancel={onClose}
            centered
            width={1200}
            bodyStyle={{height: '700px', overflowY: 'auto'}}
        >
            <Row aria-colspan={12}>
                <div className="ag-theme-quartz" style={{height: '650px', width: '100%', marginTop: '20px'}}>
                    <AgGridReact
                        statusBar={statusBar}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowData={rowData}
                        enableRangeSelection
                        localeText={AG_GRID_LOCALE_VN}

                    />
                </div>
            </Row>

        </Modal>
    );
};

export default TraCuuNhanh;

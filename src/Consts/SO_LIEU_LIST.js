import {createNewSoKeToan, deleteSoKeToan, getAllSoKeToan, updateSoKeToan} from "../apis/soketoanService.jsx";
import {
    createNewSoQuanLyChiTraTruoc,
    deleteSoQuanLyChiTraTruoc,
    getAllSoQuanLyChiTraTruoc,
    updateSoQuanLyChiTraTruoc
} from "../apis/soQuanLyChiTraTruocService.jsx";
import {
    createNewSoQuanLyTaiSan,
    deleteSoQuanLyTaiSan,
    getAllSoQuanLyTaiSan,
    updateSoQuanLyTaiSan
} from "../apis/soQuanLyTaiSanService.jsx";

export const SO_LIEU_LIST = [
    {
        key: "bang-thong-ke-tuoi-no",
        label: "Thống kê tuổi nợ AR-AP",
    },
    // {
    //     key: "so-tai-khoan",
    //     label: "Sổ tài khoản",
    // },
    {
        key: "so-tai-khoan-dt",
        label: "Sổ tài khoản theo đối tượng",
    },
    {
        key: "dkpro",
        label: "Sổ rà soát định khoản",
    },
    {
        key: "so-tai-khoan-dd",
        label: "Sổ tài khoản định danh",
    },
    // {
    //     key: "so-offset",
    //     label: "Sổ Offset 2",
    // },
    // {
    //     key: "so-offset-1",
    //     label: "Sổ Offset 1",
    // },
    // {
    //     key: "so-chuoi",
    //     label: "Sổ chuỗi",
    //     getAllApi: getAllSoChuoi,
    //     createApi: createNewSoChuoi,
    //     updateApi: updateSoChuoi,
    //     deleteApi: deleteSoChuoi,
    //     fields: [
    //         {
    //             field: 'id',
    //             headerName: 'ID',
    //         }, {
    //             field: 'company',
    //             headerName: 'Công ty',
    //         }, {
    //             field: 'day',
    //             headerName: 'Ngày',
    //         }, {
    //             field: 'month',
    //             headerName: 'Tháng',
    //         }, {
    //             field: 'year',
    //             headerName: 'Năm',
    //         }, {
    //             field: 'dien_giai',
    //             headerName: 'Diễn giải',
    //         }, {
    //             field: 'ma_chain',
    //             headerName: 'Mã chain',
    //         }, {
    //             field: 'ma_step',
    //             headerName: 'Mã step',
    //         }, {
    //             field: 'customer',
    //             headerName: 'Khách hàng',
    //         }, {
    //             field: 'employee',
    //             headerName: 'Nhân viên',
    //         }, {
    //             field: 'deal',
    //             headerName: 'Deal',
    //         }, {
    //             field: 'noi_bo',
    //             headerName: 'Nội bộ',
    //         }, {
    //             field: 'consol',
    //             headerName: 'Consol',
    //         }, {
    //             field: 'tk_no',
    //             headerName: 'Tài khoản nợ',
    //         }, {
    //             field: 'tk_co',
    //             headerName: 'Tài khoản có',
    //         }, {
    //             field: 'ps_no',
    //             headerName: 'Phát sinh nợ',
    //         }, {
    //             field: 'ps_co',
    //             headerName: 'Phát sinh có',
    //         }, {
    //             field: 'so_tien',
    //             headerName: 'Số tiền ',
    //         }, {
    //             field: 'supplier',
    //             headerName: 'Nhà cung cấp',
    //         }, {
    //             field: 'kmtc',
    //             headerName: 'Khoản mục thu chi',
    //         }, {
    //             field: 'kmf',
    //             headerName: 'Khoản mục phí',
    //         }, {
    //             field: 'project',
    //             headerName: 'Dự án',
    //         }, {
    //             field: 'hoa_don',
    //             headerName: 'Hóa đơn',
    //         }, {
    //             field: 'soChungTu',
    //             headerName: 'Chứng từ',
    //         }
    //     ],
    //     isNotDM: true,
    // },
    {
        key: "so-ke-toan",
        label: "Sổ kế toán tổng hợp",
        getAllApi: getAllSoKeToan,
        createApi: createNewSoKeToan,
        updateApi: updateSoKeToan,
        deleteApi: deleteSoKeToan,
        fields: [
            { field: 'id', headerName: 'ID' },
            { field: 'company', headerName: 'Công ty' },
            { field: 'day', headerName: 'Ngày' },
            { field: 'month', headerName: 'Tháng' },
            { field: 'year', headerName: 'Năm' },
            { field: 'dien_giai', headerName: 'Diễn giải' },
            { field: 'ma_chain', headerName: 'Mã chain' },
            { field: 'ma_step', headerName: 'Mã step' },
            { field: 'customer', headerName: 'Khách hàng' },
            { field: 'employee', headerName: 'Nhân viên' },
            { field: 'vu_viec_code', headerName: 'Vụ việc' },
            { field: 'noi_bo', headerName: 'Nội bộ' },
            { field: 'isDuplicated', headerName: '' },
            { field: 'consol', headerName: 'Consol' },
            { field: 'tk_no', headerName: 'Tài khoản nợ' },
            { field: 'tk_co', headerName: 'Tài khoản có' },
            { field: 'ps_no', headerName: 'Phát sinh nợ' },
            { field: 'ps_co', headerName: 'Phát sinh có' },
            { field: 'so_tien_VND', headerName: 'Số tiền VND' },
            { field: 'so_tien_nguyen_te', headerName: 'Số tiền nguyên tệ' },
            { field: 'fx_rate', headerName: 'FX Rate' },
            { field: 'supplier', headerName: 'Nhà cung cấp' },
            { field: 'kmtc', headerName: 'Khoản mục thu chi' },
            { field: 'kmf', headerName: 'Khoản mục phí' },
            { field: 'hoa_don', headerName: 'Hóa đơn' },
            { field: 'soChungTu', headerName: 'Chứng từ' },
            { field: 'unit_code', headerName: 'Đơn vị' },
            { field: 'product', headerName: 'Sản phẩm' },
            { field: 'bo_phan_code', headerName: 'Bộ phận' },
            { field: 'hop_dong', headerName: 'Hợp đồng' },
            { field: 'chu_thich', headerName: 'Chú thích' },
            { field: 'pl_type', headerName: 'PL Type' },
            { field: 'cf_Check', headerName: 'PL Check' },
            { field: 'pl_value', headerName: 'PL Value' },
            { field: 'cash_value', headerName: 'Cash Value' }
        ],
        isNotDM: true,
    },
    // {
    //     key: "so-ke-toan-t",
    //     label: "Sổ kế toán T",
    //     getAllApi: getAllSoKeToan,
    //     createApi: createNewSoKeToan,
    //     updateApi: updateSoKeToan,
    //     deleteApi: deleteSoKeToan,
    //     fields: [
    //         { field: 'id', headerName: 'ID' },
    //         { field: 'company', headerName: 'Công ty' },
    //         { field: 'day', headerName: 'Ngày' },
    //         { field: 'month', headerName: 'Tháng' },
    //         { field: 'year', headerName: 'Năm' },
    //         { field: 'dien_giai', headerName: 'Diễn giải' },
    //         { field: 'ma_chain', headerName: 'Mã chain' },
    //         { field: 'ma_step', headerName: 'Mã step' },
    //         { field: 'customer', headerName: 'Khách hàng' },
    //         { field: 'employee', headerName: 'Nhân viên' },
    //         { field: 'vu_viec_code', headerName: 'Vụ việc' },
    //         { field: 'noi_bo', headerName: 'Nội bộ' },
    //         { field: 'isDuplicated', headerName: '' },
    //         { field: 'consol', headerName: 'Consol' },
    //         { field: 'tk_no', headerName: 'Tài khoản nợ' },
    //         { field: 'tk_co', headerName: 'Tài khoản có' },
    //         { field: 'ps_no', headerName: 'Phát sinh nợ' },
    //         { field: 'ps_co', headerName: 'Phát sinh có' },
    //         { field: 'so_tien_VND', headerName: 'Số tiền VND' },
    //         { field: 'so_tien_nguyen_te', headerName: 'Số tiền nguyên tệ' },
    //         { field: 'fx_rate', headerName: 'FX Rate' },
    //         { field: 'supplier', headerName: 'Nhà cung cấp' },
    //         { field: 'kmtc', headerName: 'Khoản mục thu chi' },
    //         { field: 'kmf', headerName: 'Khoản mục phí' },
    //         { field: 'hoa_don', headerName: 'Hóa đơn' },
    //         { field: 'soChungTu', headerName: 'Chứng từ' },
    //         { field: 'unit_code', headerName: 'Đơn vị' },
    //         { field: 'product', headerName: 'Sản phẩm' },
    //         { field: 'bo_phan_code', headerName: 'Bộ phận' },
    //         { field: 'hop_dong', headerName: 'Hợp đồng' },
    //         { field: 'chu_thich', headerName: 'Chú thích' },
    //         { field: 'pl_type', headerName: 'PL Type' },
    //         { field: 'cf_Check', headerName: 'PL Check' },
    //         { field: 'pl_value', headerName: 'PL Value' },
    //         { field: 'cash_value', headerName: 'Cash Value' }
    //     ],
    //     isNotDM: true,
    // },
    {
        key: "so-quan-ly-tai-san",
        label: "Bảng tài sản cố định",
        getAllApi: getAllSoQuanLyTaiSan,
        createApi: createNewSoQuanLyTaiSan,
        updateApi: updateSoQuanLyTaiSan,
        deleteApi: deleteSoQuanLyTaiSan,
        isNotDM: true,
    },
    {
        key: "so-quan-ly-chi-tra-truoc-ccdc",
        label: "Bảng chi phí trả trước & CCDC",
        getAllApi: getAllSoQuanLyChiTraTruoc,
        createApi: createNewSoQuanLyChiTraTruoc,
        updateApi: updateSoQuanLyChiTraTruoc,
        deleteApi: deleteSoQuanLyChiTraTruoc,
        fields: [
            { field: 'id', headerName: 'ID' },
            { field: 'mo_ta', headerName: 'Mô tả', type: 'text' },
            { field: 'kho', headerName: 'Kho' },
            { field: 'tK_theo_doi', headerName: 'Tài khoản theo dõi', type: 'text' },
            { field: 'tK_chi_phi', headerName: 'Tài khoản chi phí', type: 'text' },
            { field: 'bp_su_dung', headerName: 'BP sử dụng', type: 'text' },
            { field: 'so_chung_tu', headerName: 'Chứng từ', type: 'text' },
            { field: 'so_tien', headerName: 'Số tiền', type: 'number' },
            { field: 'ngay_ghi_nhan_tang', headerName: 'Ngày ghi nhận tặng', type: 'date' },
            { field: 'so_thang_phan_bo', headerName: 'Số tháng phân bổ', type: 'number' },
            { field: 'thoi_gian_bat_dau', headerName: 'Thời gian bắt đầu', type: 'date' },
            { field: 'so_tien_con_lai', headerName: 'Số tiền còn lại', type: 'number' },
            { field: 'chu_thich', headerName: 'Chú thích', type: 'text' },
        ],
        isNotDM: true,
    },
    {
        key: "ton-kho",
        label: "Báo cáo nhập xuất tồn",
    },
    // {
    //     key: "phieu-thu",
    //     label: "Phiếu thu chi",
    // }
];

import {createNewLuong, deleteLuong, getAllLuong, updateLuong} from "../apis/luongService.jsx";
import {createNewTaiKhoan, deleteTaiKhoan, getAllTaiKhoan, updateTaiKhoan} from "../apis/taiKhoanService.jsx";

export const DU_LIEU_KHAC = [
    {
        key: "luong",
        label: "Lương",
        getAllApi: getAllLuong,
        createApi: createNewLuong,
        updateApi: updateLuong,
        deleteApi: deleteLuong,
        fields: [
            { field: 'id', headerName: 'ID', editable: false, hide: true, filter: 'agMultiColumnFilter' },
            { field: 'doi_tuong', headerName: "Đối tượng", },
            { field: 'cost_object', headerName: "Cost object", },
            { field: 'bu', headerName: "Business unit", },
            { field: 'month', headerName: "Tháng", },
            { field: 'cf_luong_gross', headerName: "CF lương gross", },
            { field: 'luong_co_dinh', headerName: "Lương cố định", },
            { field: 'luong_bo_sung', headerName: "Lương bổ sung", },
            { field: 'ot', headerName: "OT", },
            { field: 'phu_cap', headerName: "Phụ cấp", },
            { field: 'thuong', headerName: "Thưởng", },
            { field: 'khac', headerName: "Khác", },
            { field: 'bhxh_cty_tra', headerName: "BHXH Cty trả", },
            { field: 'bhyt_cty_tra', headerName: "BHYT Cty trả", },
            { field: 'bhtn_cty_tra', headerName: "BHTN Cty trả", },
            { field: 'cong_doan', headerName: "Công đoàn", },
            { field: 'bhxh_nv_tra', headerName: "BHXH NV trả", },
            { field: 'bhyt_nv_tra', headerName: "BHYT NV trả", },
            { field: 'bhtn_nv_tra', headerName: "BHTN NV trả", },
            { field: 'thue_tncn', headerName: "Thuế TNCN", },
        ],
        isNotDM: true,
    },
    {
        key: "cdps",
        label: "CDPS",
        getAllApi: getAllTaiKhoan,
        createApi: createNewTaiKhoan,
        updateApi: updateTaiKhoan,
        deleteApi: deleteTaiKhoan,
        fields: [
            { field: 'id', headerName: 'ID' },
            { field: 'code', headerName: 'Mã tài khoản', type: 'text' },
            { field: 'name', headerName: 'Tên tài khoản', type: 'text' },
            { field: 'phan_nhom', headerName: 'Phân nhóm', type: 'text' },
            { field: 'doi_tuong_theo_doi', headerName: 'Đối tượng theo dõi', type: 'text' },
            { field: 'tinh_chat', headerName: 'Tính chất', type: 'text' },
            { field: 'theo_doi_KQKD', headerName: 'Theo dõi KQKD', type: 'text' },
            { field: 'theo_doi_tc', headerName: 'Theo dõi tc', type: 'text' },
            {
                field: 'tk_chi_tiet',
                headerName: 'Tài khoản chi tiết',
                type: 'select',
                getAllApi: getAllTaiKhoan,
                key: "code"
            },
            { field: 'cho_phep_dk', headerName: 'Cho phép dk', type: 'text' },
            { field: 'cap', headerName: 'Cấp', type: 'text' },
        ],
    },
    {
        key: "lenh-sx",
        label: "Lệnh sản xuất",
    },
    {
        key: "detail-lenh-sx",
        label: "Chi tiết lệnh sản xuất",
    },
    {
        key: "ccpb-vu-viec",
        label: "Thẻ phân bổ vụ việc",
    },
    {
        key: "ccpb-lenh-sx",
        label: "Thẻ phân bổ lệnh sản xuất",
    },
    {
        key: "review",
        label: "Review hệ số",
    },
]

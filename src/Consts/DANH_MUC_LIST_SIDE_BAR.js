// API
import {createNewKmf, deleteKmf, getAllKmf, updateKmf} from "../apis/kmfService.jsx";
import {createNewTaiKhoan, deleteTaiKhoan, getAllTaiKhoan, updateTaiKhoan} from "../apis/taiKhoanService.jsx";
import {createNewPhongBan, deletePhongBan, getAllPhongBan, updatePhongBan} from "../apis/phongBanService.jsx";
import {createNewKhachHang, deleteKhachHang, getAllKhachHang, updateKhachHang} from "../apis/khachHangService.jsx";
import {createNewNhaCungCap, deleteNhaCungCap, getAllNhaCungCap, updateNhaCungCap} from "../apis/nhaCungCapService.jsx";
import {createNewNhanVien, deleteNhanVien, getAllNhanVien, updateNhanVien} from "../apis/nhanVienService.jsx";
import {createNewHangHoa, deleteHangHoa, getAllHangHoa, updateHangHoa} from "../apis/hangHoaService.jsx";
import {createNewDuAn, deleteDuAn, getAllDuAn, updateDuAn} from "../apis/duAnService.jsx";
import {createNewHopDong, deleteHopDong, getAllHopDong, updateHopDong} from "../apis/hopDongService.jsx";
import {createNewKho, deleteKho, getAllKho, updateKho} from "../apis/khoService.jsx";
import {
    createNewTaiKhoanNganHang,
    deleteTaiKhoanNganHang,
    getAllTaiKhoanNganHang,
    updateTaiKhoanNganHang
} from "../apis/taiKhoanNganHangService.jsx";
import {createNewKmtc, deleteKmtc, getAllKmtc, updateKmtc} from "../apis/kmtcService.jsx";
import {getAllLo} from "../apis/loService.jsx";
import {createNewPhieuNhap, deletePhieuNhap, getAllPhieuNhap, updatePhieuNhap} from "../apis/phieuNhapService.jsx";
import {createNewPhieuXuat, deletePhieuXuat, getAllPhieuXuat, updatePhieuXuat} from "../apis/phieuXuatService.jsx";
import {
    createNewSoQuanLyTaiSan,
    deleteSoQuanLyTaiSan,
    getAllSoQuanLyTaiSan,
    updateSoQuanLyTaiSan
} from "../apis/soQuanLyTaiSanService.jsx";
import {
    createNewBusinessUnit,
    deleteBusinessUnit,
    getAllBusinessUnit,
    updateBusinessUnit
} from "../apis/businessUnitService.jsx";
import {createNewHoaDon, deleteHoaDon, getAllHoaDon, updateHoaDon} from "../apis/hoaDonService.jsx";
import {
    createNewTaiSanDauTu,
    deleteTaiSanDauTu,
    getAllTaiSanDauTu,
    updateTaiSanDauTu
} from "../apis/taiSanDauTuService.jsx";
import {createNewLoaiTien, deleteLoaiTien, getAllLoaiTien, updateLoaiTien} from "../apis/loaiTienService.jsx";
import {createNewChuSoHuu, deleteChuSoHuu, getAllChuSoHuu, updateChuSoHuu} from "../apis/chuSoHuuService.jsx";
import {
    createNewChuongTrinh,
    deleteChuongTrinh,
    getAllChuongTrinh,
    updateChuongTrinh
} from "../apis/chuongTrinhService.jsx";


export const DANH_MUC_LIST_SIDE_BAR = [
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
        key: "phieu-nhap",
        label: "Phiếu nhập",
        getAllApi: getAllPhieuNhap,
        createApi: createNewPhieuNhap,
        updateApi: updatePhieuNhap,
        deleteApi: deletePhieuNhap,
        fields: [
            {
                field: 'id',
                headerName: 'ID',
                type: 'number'
            },
            {
                field: 'ngay',
                headerName: 'Ngày nhập',
                type: 'date'
            },
            {
                field: 'id_nhan_vien',
                headerName: 'Nhân viên',
                type: 'select',
                getAllApi: getAllNhanVien,
                key: "code"
            },
            {
                field: 'detailPhieuNhap',
                headerName: 'Chi tiết phiếu nhập',
                type: 'object',
                object: [
                    {
                        field: 'id_hang_hoa',
                        headerName: 'Hàng hóa',
                        type: 'select',
                        getAllApi: getAllHangHoa,
                        key: "code"
                    },
                    {
                        field: 'id_lo',
                        headerName: 'Lô',
                        type: 'select',
                        getAllApi: getAllLo,
                        key: "code"
                    },
                    {
                        field: 'id_nha_cung_cap',
                        headerName: 'Nhà Cung Cấp',
                        type: 'select',
                        getAllApi: getAllNhaCungCap,
                        key: "code"
                    },
                    {
                        field: 'id_kho',
                        headerName: 'Kho',
                        type: 'select',
                        getAllApi: getAllKho,
                        key: "code"
                    },
                    {
                        field: 'gia_nhap',
                        headerName: 'Giá nhập',
                        type: 'decimal'
                    },
                    {
                        field: 'so_luong',
                        headerName: 'Số lượng',
                        type: 'number'
                    }
                ]
            }
        ],
        isNotDM: true,
        table: "PhieuNhap"
    },
    {
        key: "phieu-xuat",
        label: "Phiếu xuất",
        getAllApi: getAllPhieuXuat,
        createApi: createNewPhieuXuat,
        updateApi: updatePhieuXuat,
        deleteApi: deletePhieuXuat,
        fields: [
            {
                field: 'ngay',
                headerName: 'Ngày xuất',
                type: 'date'
            },
            {
                field: 'id_nhan_vien',
                headerName: 'Nhân viên',
                type: 'select',
                getAllApi: getAllNhanVien,
                key: "code"
            },
            {
                field: 'id_khach_hang',
                headerName: 'Khách hàng',
                type: 'select',
                getAllApi: getAllKhachHang,
                key: "code"
            },
            {
                field: 'detailPhieuXuat',
                headerName: 'Chi tiết phiếu xuất',
                type: 'object',
                object: [
                    {
                        field: 'id_hang_hoa',
                        headerName: 'Hàng hóa',
                        type: 'select',
                        getAllApi: getAllHangHoa,
                        key: "code"
                    },
                    {
                        field: 'id_lo',
                        headerName: 'Lô',
                        type: 'select',
                        getAllApi: getAllLo,
                        key: "code"
                    },
                    {
                        field: 'id_kho',
                        headerName: 'Kho',
                        type: 'select',
                        getAllApi: getAllKho,
                        key: "code"
                    },
                    {
                        field: 'gia_xuat',
                        headerName: 'Giá xuất',
                        type: 'decimal'
                    },
                    {
                        field: 'so_luong',
                        headerName: 'Số lượng',
                        type: 'number'
                    }
                ]
            }
        ],
        isNotDM: true,
        table: "PhieuXuat"
    },
    {
        key: "du-an",
        label: "Danh mục vụ việc",
        getAllApi: getAllDuAn,
        createApi: createNewDuAn,
        updateApi: updateDuAn,
        deleteApi: deleteDuAn,
        fields: [
            {field: 'id', headerName: 'ID',},
            {field: 'code', headerName: 'Mã DA', type: 'text'},
            {field: 'name', headerName: 'Tên DA', type: 'text'},
            {field: 'khach_hang', headerName: 'Khách hàng', type: 'select', getAllApi: getAllKhachHang, key: "code"},
            {field: 'ngay_bat_dau', headerName: 'Ngày bắt đầu', type: 'date'},
            {field: 'ngay_ket_thuc', headerName: 'Ngày kết thúc', type: 'date'},
            {field: 'ngan_sach', headerName: 'Ngân sách', type: 'number'},
            {field: 'quan_ly_da', headerName: 'Quản lý DA', type: 'text'},
            {field: 'tk_wip', headerName: 'Tài khoản WIP', type: 'select', getAllApi: getAllTaiKhoan, key: "code"},
            {field: 'phan_tram_hoan_thanh', headerName: '% Hoàn thành'}
        ]
    },
    {
        key: "san-pham",
        label: "Danh mục sản phẩm",
        getAllApi: getAllHangHoa,
        createApi: createNewHangHoa,
        updateApi: updateHangHoa,
        deleteApi: deleteHangHoa,
        fields: [
            {field: 'id', headerName: 'ID',},
            {field: 'code', headerName: 'Mã sản phẩm', type: 'text'},
            {field: 'name', headerName: 'Tên sản phẩm', type: 'text'},
            {field: 'dvt', headerName: 'DVT', type: 'text'},
            {field: 'loai', headerName: 'Loại', type: 'text'},
            {field: 'nhom_hh', headerName: 'Nhóm sản phẩm', type: 'text'},
            {field: 'thue_vat', headerName: 'Thuế VAT', type: 'number'},
            {field: 'gia_ban', headerName: 'Giá bán', type: 'number'},
            {
                field: 'tk_doanh_thu',
                headerName: 'Tài khoản doanh thu',
                type: 'select',
                getAllApi: getAllTaiKhoan,
                key: "code"
            },
            {
                field: 'tk_gia_von',
                headerName: 'Tài khoản giá vốn',
                type: 'select',
                getAllApi: getAllTaiKhoan,
                key: "code"
            },
            {
                field: 'tk_hang_ton',
                headerName: 'Tài khoản hàng tồn',
                type: 'select',
                getAllApi: getAllTaiKhoan,
                key: "code"
            },
            {field: 'theo_doi_ton', headerName: 'Theo dõi tồn'},
            {field: 'ton_toi_thieu', headerName: 'Tồn tối thiểu'},
            {field: 'ton_toi_da', headerName: 'Tồn tối đa'}
        ]
    },
    {
        key: "khach-hang",
        label: "Danh mục khách hàng",
        getAllApi: getAllKhachHang,
        createApi: createNewKhachHang,
        updateApi: updateKhachHang,
        deleteApi: deleteKhachHang,
        fields: [
            {field: 'id', headerName: 'ID'},
            {field: 'code', headerName: 'Mã khách hàng', type: 'text'},
            {field: 'name', headerName: 'Tên khách hàng', type: 'text'},
            {field: 'name', headerName: 'Tên giao dịch', type: 'text'},
            {field: 'mst', headerName: 'Mã số thuế', type: 'text'},
            {field: 'dia_chi', headerName: 'Địa chỉ', type: 'text'},
            {field: 'email', headerName: 'Email', type: 'text'},
            {field: 'dien_thoai', headerName: 'Số điện thoại', type: 'text'},
            {field: 'nguoi_lien_he', headerName: 'Người liên hệ', type: 'text'},
            {field: 'han_muc_cong_no', headerName: 'Hạn mức công nợ', type: 'number'},
            {field: 'nhom_kh', headerName: 'Nhóm khách hàng', type: 'text'},
            {field: 'dieu_khoan_tt', headerName: 'Điều khoản thanh toán', type: 'text'},
            {field: 'phuong_thuc_tt', headerName: 'Phương thức thanh toán', type: 'text'},
            {field: 'trang_thai', headerName: 'Trạng thái'}
        ]
    },
    {
        key: "kmf",
        label: "Danh mục khoản mục phí",
        getAllApi: getAllKmf,
        createApi: createNewKmf,
        updateApi: updateKmf,
        deleteApi: deleteKmf,
        fields: [
            {field: 'id', headerName: 'ID'},
            {field: 'code', headerName: 'Mã KMCP', type: 'text'},
            {field: 'name', headerName: 'Tên KMCP', type: 'text'},
            {field: 'loai_chi_phi', headerName: 'Loại chi phí', type: 'text'},
            {field: 'nhom_kmcp', headerName: 'Nhóm KMCP', type: 'text'},
            {
                field: 'tk_hach_toan',
                headerName: 'TK hạch toán',
                type: 'select',
                getAllApi: getAllTaiKhoan,
                key: "code"
            },
            {field: 'kiem_soat_ngan_sach', headerName: 'Kiểm soát ngân sách'},
            {field: 'duoc_khau_tru_thue', headerName: 'Được khấu trừ thuế'}
        ],
    },
    {
        key: "kmtc",
        label: "Danh mục khoản mục thu chi",
        getAllApi: getAllKmtc,
        createApi: createNewKmtc,
        updateApi: updateKmtc,
        deleteApi: deleteKmtc,
        fields: [
            {field: 'id', headerName: 'ID',},
            {field: 'code', headerName: 'Mã KMCP', type: 'text'},
            {field: 'name', headerName: 'Tên KMCP', type: 'text'},
            {field: 'loai', headerName: 'Loại chi phí', type: 'text'},
            {field: 'nhom_kmtc', headerName: 'Nhóm KMCP', type: 'text'},
            {
                field: 'tk_hach_toan',
                headerName: 'TK hạch toán',
                type: 'select',
                getAllApi: getAllTaiKhoan,
                key: "code"
            },
            {field: 'yeu_cau_duyet', headerName: 'Yêu cầu duyệt'},
            {field: 'han_muc_duyet', headerName: 'Hạn mức duyệt'}
        ]
    },
    {
        key: "hop-dong",
        label: "Danh mục hợp đồng",
        getAllApi: getAllHopDong,
        createApi: createNewHopDong,
        updateApi: updateHopDong,
        deleteApi: deleteHopDong,
        fields: [
            {field: 'id', headerName: 'ID',},
            {field: 'code', headerName: 'Mã hợp đồng', type: 'text'},
            {field: 'name', headerName: 'Tên hợp đồng', type: 'text'},
            {field: 'loai_hd', headerName: 'Loại hợp đồng', type: 'text'},
            {field: 'doi_tac', headerName: 'Đối tác', type: 'text'},
            {field: 'ngay_ky', headerName: 'Ngày ký', type: 'date'},
            {field: 'hieu_luc_tu', headerName: 'Hiệu lực từ', type: 'date'},
            {field: 'hieu_luc_den', headerName: 'Hiệu lực đến', type: 'date'},
            {field: 'gia_tri', headerName: 'Giá trị', type: 'number'},
            {field: 'dieu_khoan_tt', headerName: 'Điều khoản thanh toán', type: 'text'}
        ]
    },
    {
        key: "kho",
        label: "Danh mục kho",
        getAllApi: getAllKho,
        createApi: createNewKho,
        updateApi: updateKho,
        deleteApi: deleteKho,
        fields: [
            {field: 'id', headerName: 'ID',},
            {field: 'code', headerName: 'Mã kho', type: 'text'},
            {field: 'name', headerName: 'Tên kho', type: 'text'},
            {field: 'dia_chi', headerName: 'Điạ chỉ', type: 'text'},
            {field: 'nguoi_phu_trach', headerName: 'Người phụ trách', type: 'text'},
            {field: 'loai_kho', headerName: 'Loại kho', type: 'text'},
            {field: 'tk_kho', headerName: 'Tài khoản kho', type: 'select', getAllApi: getAllTaiKhoan, key: "code"},
            {field: 'ghi_chu', headerName: 'Ghi chú', type: 'text'}
        ]
    },
    {
        key: "tk-ngan-hang",
        label: "Danh mục tài khoản ngân hàng",
        getAllApi: getAllTaiKhoanNganHang,
        createApi: createNewTaiKhoanNganHang,
        updateApi: updateTaiKhoanNganHang,
        deleteApi: deleteTaiKhoanNganHang,
        fields: [
            {field: 'id', headerName: 'ID',},
            {field: 'code', headerName: 'Mã ngân hàng', type: 'text'},
            {field: 'name', headerName: 'Tên ngân hàng', type: 'text'},
            {field: 'so_tk', headerName: 'Số tài khoản', type: 'text'},
            {field: 'chi_nhanh', headerName: 'Chi nhánh', type: 'text'},
            {field: 'loai_tien', headerName: 'Loại tiền', type: 'text'},
            {
                field: 'tk_ke_toan',
                headerName: 'Tài khoản kế toán',
                type: 'select',
                getAllApi: getAllTaiKhoan,
                key: "code"
            },
            {field: 'so_du_toi_thieu', headerName: 'Số dư tối thiểu', type: 'number'}
        ]
    },
    {
        key: "tk-ke-toan",
        label: "Danh mục tài khoản kế toán",
        getAllApi: getAllTaiKhoan,
        createApi: createNewTaiKhoan,
        updateApi: updateTaiKhoan,
        deleteApi: deleteTaiKhoan,
        fields: [
            {field: 'id', headerName: 'ID'},
            {field: 'code', headerName: 'Mã tài khoản', type: 'text'},
            {field: 'name', headerName: 'Tên tài khoản', type: 'text'},
            {field: 'phan_nhom', headerName: 'Phân nhóm', type: 'text'},
            {field: 'doi_tuong_theo_doi', headerName: 'Đối tượng theo dõi', type: 'text'},
            {field: 'tinh_chat', headerName: 'Tính chất', type: 'text'},
            {field: 'theo_doi_KQKD', headerName: 'Theo dõi KQKD', type: 'text'},
            {field: 'theo_doi_tc', headerName: 'Theo dõi tc', type: 'text'},
            {
                field: 'tk_chi_tiet',
                headerName: 'Tài khoản chi tiết',
                type: 'select',
                getAllApi: getAllTaiKhoan,
                key: "code"
            },
            {field: 'cho_phep_dk', headerName: 'Cho phép dk', type: 'text'},
            {field: 'cap', headerName: 'Cấp', type: 'text'},
        ],
    },
    {
        key: "nha-cung-cap",
        label: "Danh mục nhà cung cấp",
        getAllApi: getAllNhaCungCap,
        createApi: createNewNhaCungCap,
        updateApi: updateNhaCungCap,
        deleteApi: deleteNhaCungCap,
        fields: [
            {field: 'id', headerName: 'ID'},
            {field: 'code', headerName: 'Mã nhà cung cấp', type: 'text'},
            {field: 'name', headerName: 'Tên nhà cung cấp', type: 'text'},
            {field: 'mst', headerName: 'Mã số thuế', type: 'text'},
            {field: 'dia_chi', headerName: 'Địa chỉ', type: 'text'},
            {field: 'email', headerName: 'Email', type: 'text'},
            {field: 'dien_thoai', headerName: 'Số điện thoại', type: 'text'},
            {field: 'nguoi_lien_he', headerName: 'Người liên hệ', type: 'text'},
            {field: 'dieu_khoan_tt', headerName: 'Điều khoản thanh toán', type: 'text'},
            {field: 'nhom_ncc', headerName: 'Nhóm nhà cung cấp', type: 'text'},
            {field: 'trang_thai', headerName: 'Trạng thái'}
        ]
    },
    {
        key: "nhan-vien",
        label: "Danh mục nhân viên",
        getAllApi: getAllNhanVien,
        createApi: createNewNhanVien,
        updateApi: updateNhanVien,
        deleteApi: deleteNhanVien,
        fields: [
            {field: 'id', headerName: 'ID'},
            {field: 'code', headerName: 'Mã nhân viên', type: 'text'},
            {field: 'name', headerName: 'Tên nhân viên', type: 'text'},
            {field: 'cccd', headerName: 'CCCD', type: 'text'},
            {field: 'ngay_sinh', headerName: 'Ngày sinh', type: 'date'},
            {field: 'phong_ban', headerName: 'Phòng ban', type: 'text'},
            {field: 'chuc_vu', headerName: 'Chức vụ', type: 'text'},
            {field: 'luong_co_ban', headerName: 'Lương cơ bản', type: 'number'},
            {field: 'mst_ca_nhan', headerName: 'Mã số thuế cá nhân', type: 'text'},
            {
                field: 'tk_ngan_hang',
                headerName: 'Tài khoản ngân hàng',
                type: 'select',
                getAllApi: getAllTaiKhoanNganHang,
                key: "so_tk"
            },
            {field: 'trang_thai', headerName: 'Trạng thái'}
        ]
    },
    {
        key: "business-unit",
        label: "Danh mục BU",
        getAllApi: getAllBusinessUnit,
        createApi: createNewBusinessUnit,
        updateApi: updateBusinessUnit,
        deleteApi: deleteBusinessUnit,
        fields: [
            {field: 'id', headerName: 'ID'},
            {field: 'cap', headerName: 'Cấp', type: 'text'},
            {field: 'truong_dv', headerName: 'Trường DV', type: 'text'},
            {field: 'code', headerName: 'Mã BU', type: 'text'},
            {field: 'name', headerName: 'Tên BU', type: 'text'},
        ]
    },
    {
        key: 'tai-san-dau-tu',
        label: 'Danh mục tài sản đầu tư',
        getAllApi: getAllTaiSanDauTu,
        createApi: createNewTaiSanDauTu,
        updateApi: updateTaiSanDauTu,
        deleteApi: deleteTaiSanDauTu,
        fields: [
            {field: 'id', headerName: 'ID'},
            {field: 'code', headerName: 'Mã tài sản', type: 'text'},
            {field: 'name', headerName: 'Tên tài sản đầu tư', type: 'text'},
        ]
    },
    {
        key: 'loai-tien',
        label: 'Danh mục loại tiền',
        getAllApi: getAllLoaiTien,
        createApi: createNewLoaiTien,
        updateApi: updateLoaiTien,
        deleteApi: deleteLoaiTien,
        fields: [
            {field: 'id', headerName: 'ID'},
            {field: 'code', headerName: 'Mã', type: 'text'},
            {field: 'name', headerName: 'Loại tiền', type: 'text'},
        ]
    },
    {
        key: 'chu-so-huu',
        label: 'Danh mục chủ sở hữu',
        getAllApi: getAllChuSoHuu,
        createApi: createNewChuSoHuu,
        updateApi: updateChuSoHuu,
        deleteApi: deleteChuSoHuu,
        fields: [
            {field: 'id', headerName: 'ID'},
            {field: 'code', headerName: 'Mã', type: 'text'},
            {field: 'name', headerName: 'Tên chủ sở hữu', type: 'text'},
        ]
    },
    {
        key: 'chuong-trinh',
        label: 'Danh mục chương trình',
        getAllApi: getAllChuongTrinh,
        createApi: createNewChuongTrinh,
        updateApi: updateChuongTrinh,
        deleteApi: deleteChuongTrinh,
        fields: [
            {field: 'id', headerName: 'ID'},
            {field: 'code', headerName: 'Mã chương trình', type: 'text'},
            {field: 'name', headerName: 'Chương trình', type: 'text'},
        ]
    },
];


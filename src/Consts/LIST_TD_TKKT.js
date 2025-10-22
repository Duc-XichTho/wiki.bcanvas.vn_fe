import {getAllKhachHang} from "../apis/khachHangService.jsx";
import {getAllNhaCungCap} from "../apis/nhaCungCapService.jsx";
import {getAllNhanVien} from "../apis/nhanVienService.jsx";
import {getAllDuAn} from "../apis/duAnService.jsx";
import {getAllBusinessUnit} from "../apis/businessUnitService.jsx";
import {getAllSoQuanLyTaiSan} from "../apis/soQuanLyTaiSanService.jsx";
import {getAllHangHoa} from "../apis/hangHoaService.jsx";
import {getAllLoaiTien} from "../apis/loaiTienService.jsx";
import {getAllTaiKhoanNganHang} from "../apis/taiKhoanNganHangService.jsx";
import {getAllChuSoHuu} from "../apis/chuSoHuuService.jsx";
import {getAllHopDong} from "../apis/hopDongService.jsx";
import {getAllTaiSanDauTu} from "../apis/taiSanDauTuService.jsx";
import {getAllHoaDon} from "../apis/hoaDonService.jsx";
import {getAllChuongTrinh} from "../apis/chuongTrinhService.jsx";

export const LIST_TD_TKKT = [
    {
        field: "TD_KhachHang",
        headerName: "Khách hàng",
        headerNameMa: "Mã khách hàng",
        getApi: getAllKhachHang,
        fieldSKT: 'customer'
    },
    {
        field: "TD_NCC",
        headerName: "Nhà cung cấp",
        headerNameMa: "Mã nhà cung cấp",
        getApi: getAllNhaCungCap,
        fieldSKT: 'supplier'
    },
    {
        field: "TD_NhanVien",
        headerName: "Nhân viên",
        headerNameMa: "Mã nhân viên",
        getApi: getAllNhanVien,
        fieldSKT: 'employee'
    },
    {field: "TD_DuAn", headerName: "Vụ việc", headerNameMa: "Mã vụ việc", getApi: getAllDuAn, fieldSKT: 'deal'},
    {
        field: "TD_BoPhan",
        headerName: "Bộ phận",
        headerNameMa: "Mã bộ phận",
        getApi: getAllBusinessUnit,
        fieldSKT: 'unit_code'
    },
    {
        field: "TD_TaiSan",
        headerName: "Tài sản",
        headerNameMa: "Mã tài sản",
        getApi: getAllSoQuanLyTaiSan,
        fieldSKT: 'tai_san'
    },
    {
        field: "TD_HangHoa",
        headerName: "Sản phẩm",
        headerNameMa: "Mã sản phẩm",
        getApi: getAllHangHoa,
        fieldSKT: 'product'
    },
    {
        field: "TD_LoaiTien",
        headerName: "Loại tiền",
        headerNameMa: "Mã loại tiền",
        getApi: getAllLoaiTien,
        fieldSKT: 'loai_tien'
    },
    {
        field: "TD_NganHang",
        headerName: "Ngân hàng",
        headerNameMa: "Mã ngân hàng",
        getApi: getAllTaiKhoanNganHang,
        fieldSKT: 'ngan_hang'
    },
    {
        field: "TD_ChuSoHuu",
        headerName: "Chủ sở hữu",
        headerNamMa: "Mã chủ sở hữu",
        getApi: getAllChuSoHuu,
        fieldSKT: 'chu_so_huu'
    },
    {
        field: "TD_HopDong",
        headerName: "Hợp đồng",
        headerNamMa: "Số hợp đồng",
        getApi: getAllHopDong,
        fieldSKT: 'hop_dong'
    },
    {
        field: "TD_TaiSanDauTu",
        headerName: "Tài sản đầu tư",
        headerNameMa: "Mã tài sản",
        getApi: getAllTaiSanDauTu,
        fieldSKT: 'tai_san_dau_tu'
    },
    {field: "TD_HoaDon", headerName: "Hóa đơn", headerNamMa: "Số hóa đơn", getApi: getAllHoaDon, fieldSKT: 'hoa_don'},
    {
        field: "TD_ChuongTrinh",
        headerName: "Giao dịch",
        headerNameMa: "Mã chương trình",
        getApi: getAllChuongTrinh,
        fieldSKT: 'chuong_trinh'
    },
]

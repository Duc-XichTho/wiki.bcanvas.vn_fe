import {getAllDonHang, getDonHangByCode2} from "../apis/donHangService.jsx";
import {getAllPhieuXuat, getPhieuXuatByCardId} from "../apis/phieuXuatService.jsx";
import {getAllHoaDon, getHoaDonByCardId} from "../apis/hoaDonService.jsx";
import {getAllPhieuThu, getPhieuThuByCardId} from "../apis/phieuThuService.jsx";
import {getAllDonMuaHang, getDonMuaHangByCode2} from "../apis/donMuaHangService.jsx";
import {getAllTamUng, getTamUngByCardId} from "../apis/tamUngService.jsx";
import {getAllPhieuChi2, getPhieuChiByCardId} from "../apis/phieuChi2Service.jsx";
import {getAllDeNghiThanhToan, getDeNghiThanhToanDataByCardId} from "../apis/deNghiThanhToanService.jsx";
import {getAllPhieuNhap, getPhieuNhapByCardId} from "../apis/phieuNhapService.jsx";
import {getAllDieuChuyenKho, getDieuChuyenKhoByCardId} from "../apis/dieuChuyenKhoService.jsx";
import {PhieuXuatDetail} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuXuat/PhieuXuatDetail.jsx";
import {HoaDonDetail} from "../pages/Home/SubStep/SubStepItem/Mau/HoaDon/HoaDonDetail.jsx";
import {PhieuThuDetail} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuThu/PhieuThuDetail.jsx";
import {TamUngDetail} from "../pages/Home/SubStep/SubStepItem/Mau/TamUng/TamUngDetail.jsx";
import {PhieuChiDetail} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuChi/PhieuChiDetail.jsx";
import {DNTTDetail} from "../pages/Home/SubStep/SubStepItem/Mau/DNTT/DNTTDetail.jsx";
import {PhieuNhapDetail} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuNhap/PhieuNhapDetail.jsx";
import {DieuChuyenKhoDetail} from "../pages/Home/SubStep/SubStepItem/Mau/DieuChuyenKho/DieuChuyenKhoDetail.jsx";
import {getPhieuXuatByCardId2} from "../apis/phieuNhapXuatService.jsx";
import {getAllHopDong, getAllHopDongByCode} from "../apis/hopDongService.jsx";
import {HopDongDetail} from "../pages/Home/SubStep/SubStepItem/Mau/HopDong/HopDongDetail.jsx";
import {DonHangDetail} from "../pages/Home/SubStep/SubStepItem/Mau/DonHang/DonHangDetail.jsx";
import {DonMuaHangDetail} from "../pages/Home/SubStep/SubStepItem/Mau/DonMuaHang/DonMuaHangDetail.jsx";

export const SA = 'Đơn bán hàng'
export const SB = 'Phiếu xuất kho';
export const SC = 'Phiếu giao hàng';
export const SD = 'Hóa đơn bán hàng';
export const SE = 'Phiếu thu';
export const SF = 'Đề nghị mua';
export const SG = 'Tạm ứng';
export const SH = 'Phiếu chi';
export const SK = 'Đề nghị thanh toán';
export const SL = 'Phiếu nhập';
export const SM = 'Phiếu ghi TS';
export const SN = 'Phiếu thu chi';
export const DCK = 'Điều chuyển kho';
export const HD = 'Hợp đồng';
export const LIST_STEP_TYPE = [
    'Mặc định', SA, SB, SC, SD, SE, SF, SG, SH, SK, SL, SM, SN, DCK
]

export const LIST_STEP_TYPE_SETTING_DK = [
    SB, SD, SE, SH, SL
]

export const LIST_PHIEU_TYPE = [
    {
        name: SB,
        api: getAllPhieuXuat,
        code: 'code',
        detailComponent: PhieuXuatDetail,
        detailAPI: getPhieuXuatByCardId2
    },
    {
        name: SE,
        api: getAllPhieuThu,
        code: 'code',
        detailComponent: PhieuThuDetail,
        detailAPI: getPhieuThuByCardId
    },
    {
        name: SG,
        api: getAllTamUng,
        code: 'code',
        detailComponent: TamUngDetail,
        detailAPI: getTamUngByCardId
    },
    {
        name: SH,
        api: getAllPhieuChi2,
        code: 'code',
        detailComponent: PhieuChiDetail,
        detailAPI: getPhieuChiByCardId
    },
    {
        name: SK,
        api: getAllDeNghiThanhToan,
        code: 'code',
        detailComponent: DNTTDetail,
        detailAPI: getDeNghiThanhToanDataByCardId
    },
    {
        name: SL,
        api: getAllPhieuNhap,
        code: 'code',
        detailComponent: PhieuNhapDetail,
        detailAPI: getPhieuNhapByCardId
    },
    {
        name: SD,
        api: getAllHoaDon,
        code: 'code',
        detailComponent: HoaDonDetail,
        detailAPI: getHoaDonByCardId
    },
    {
        name: HD,
        api: getAllHopDong,
        code: 'code',
        detailComponent: HopDongDetail,
        detailAPI: getAllHopDongByCode
    },
    {
        name: DCK,
        api: getAllDieuChuyenKho,
        code: 'code',
        detailComponent: DieuChuyenKhoDetail,
        detailAPI: getDieuChuyenKhoByCardId
    },
    {
        name: SA,
        api: getAllDonHang,
        code: 'code2',
        detailComponent: DonHangDetail,
        detailAPI: getDonHangByCode2
    },
    {
        name: SF,
        api: getAllDonMuaHang,
        code: 'code2',
        detailComponent: DonMuaHangDetail,
        detailAPI: getDonMuaHangByCode2
    },
]

import {PhieuXuatDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/PhieuXuat/PhieuXuatDetail.jsx";
import {PhieuThuDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/PhieuThu/PhieuThuDetail.jsx";
import {TamUngDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/TamUng/TamUngDetail.jsx";
import {PhieuNhapDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/PhieuNhap/PhieuNhapDetail.jsx";
import {DNTTDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/DNTT/DNTTDetail.jsx";
import {PhieuChiDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/PhieuChi/PhieuChiDetail.jsx";
import {HoaDonDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/HoaDon/HoaDonDetail.jsx";
import {DieuChuyenKhoDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/DieuChuyenKho/DieuChuyenKhoDetail.jsx";
import {getPhieuXuatByCardId2} from "../../apis/phieuNhapXuatService.jsx";
import {getPhieuThuByCardId} from "../../apis/phieuThuService.jsx";
import {getTamUngByCardId} from "../../apis/tamUngService.jsx";
import {getPhieuNhapByCardId} from "../../apis/phieuNhapService.jsx";
import {getDeNghiThanhToanDataByCardId} from "../../apis/deNghiThanhToanService.jsx";
import {getPhieuChiByCardId} from "../../apis/phieuChi2Service.jsx";
import {getHoaDonByCardId, getHoaDonById} from "../../apis/hoaDonService.jsx";
import {getDieuChuyenKhoByCardId} from "../../apis/dieuChuyenKhoService.jsx";
import {HopDongDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/HopDong/HopDongDetail.jsx";
import {getAllHopDongByCode} from "../../apis/hopDongService.jsx";
import {DonHangDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/DonHang/DonHangDetail.jsx";
import {getDonMuaHangByCode2} from "../../apis/donMuaHangService.jsx";
import {getDonHangByCode2} from "../../apis/donHangService.jsx";
import {DonMuaHangDetail} from "../../pages/Home/SubStep/SubStepItem/Mau/DonMuaHang/DonMuaHangDetail.jsx";

export const CODE_PX = 'PXK';
export const CODE_PT = 'PTH';
export const CODE_PT2 = 'PBC';
export const CODE_PTU = 'PTU';
export const CODE_PN = 'PNK';
export const CODE_DNTT = 'DTT';
export const CODE_PC = 'PCH';
export const CODE_PC2 = 'UNC';
export const CODE_DH = 'DHB';
export const CODE_DNM = 'DNM';
export const CODE_PKT = 'PKT';
export const CODE_HDB = 'HDB';
export const CODE_HD = 'C';
export const CODE_DCK = 'DCK';
export function genCode(defaultCode, id, year) {
    if (id) {
        id = (+id) + 10000;
        year = year - 2000;
        return defaultCode + '/' + id + '/' + year;
    } else {
        return defaultCode + '/' + year;
    }
}

export function decodePhieu(code) {
    if (!code) {
        return null;
    } else {
        let codeSplit = code.split('/');
        let id = codeSplit[1];
        if (id) {
            return id - 10000;
        } else {
            return null
        }
    }
}

export function decodeTypePhieu(code) {
    if (!code) {
        return null;
    } else {
        let codeSplit = code.split('/');
        let type = codeSplit[0];
        if (type) {
            return type;
        } else {
            return null
        }
    }
}

export function findDetailByType(type) {
    if (type.startsWith(CODE_HD)) return HopDongDetail
    switch (type) {
        case CODE_PX:
            return PhieuXuatDetail;
        case CODE_PT:
            return PhieuThuDetail;
        case CODE_PT2:
            return PhieuThuDetail;
        case CODE_PTU:
            return TamUngDetail;
        case CODE_PN:
            return PhieuNhapDetail;
        case CODE_DNTT:
            return DNTTDetail;
        case CODE_PC:
            return PhieuChiDetail;
        case CODE_HDB:
            return HoaDonDetail;
        case CODE_PC2:
            return PhieuChiDetail;
        case CODE_DCK:
            return DieuChuyenKhoDetail;
        case CODE_DH:
            return DonHangDetail;
        case CODE_DNM:
            return DonMuaHangDetail;

    }
}

export function findFunctionDetailByType(type) {
    if (type.startsWith(CODE_HD)) return getAllHopDongByCode
    switch (type) {
        case CODE_DNM:
            return getDonMuaHangByCode2;
        case CODE_PX:
            return getPhieuXuatByCardId2;
        case CODE_PT:
            return getPhieuThuByCardId;
        case CODE_PT2:
            return getPhieuThuByCardId;
        case CODE_PTU:
            return getTamUngByCardId;
        case CODE_PN:
            return getPhieuNhapByCardId;
        case CODE_DNTT:
            return getDeNghiThanhToanDataByCardId;
        case CODE_PC:
            return getPhieuChiByCardId;
        case CODE_HDB:
            return getHoaDonById;
        case CODE_PC2:
            return getPhieuChiByCardId;
        case CODE_DCK:
            return getDieuChuyenKhoByCardId;
        case CODE_DH:
            return getDonHangByCode2;
    }
}

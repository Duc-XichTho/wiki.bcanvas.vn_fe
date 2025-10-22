import {decodePhieu} from "../../../generalFunction/genCode/genCode.js";
import {deleteDeNghiThanhToan} from "../../../apis/deNghiThanhToanService.jsx";
import {deleteHoaDon, getHoaDonByCardId} from "../../../apis/hoaDonService.jsx";
import {deleteTamUng} from "../../../apis/tamUngService.jsx";
import {deletePhieuThu} from "../../../apis/phieuThuService.jsx";
import {deletePhieuNhap} from "../../../apis/phieuNhapService.jsx";
import {deletePhieuXuat} from "../../../apis/phieuXuatService.jsx";
import {deletePhieuChi} from "../../../apis/phieuChiService.jsx";
import {deleteDonHang, getDonHangByCode} from "../../../apis/donHangService.jsx";
import {deleteDonMuaHang, getDonMuaHangByCode} from "../../../apis/donMuaHangService.jsx";

export async function deleteCard(card) {
    try {
        let cau_truc = card.cau_truc;
        let idPhieu = decodePhieu(card.name)
        if (!cau_truc) {
            return;
        } else {
            if (cau_truc[0]) {
                let type = cau_truc[0].type;
                switch (type) {
                    case 'Đề nghị thanh toán':
                        await deleteDeNghiThanhToan(idPhieu)
                        break;
                    case 'Hóa đơn bán hàng':
                        let hoaDon = await getHoaDonByCardId(idPhieu);
                        await deleteHoaDon(hoaDon[0].id_hoa_don) //
                        break;
                    case 'Tạm ứng':
                        await deleteTamUng(idPhieu)
                        break;
                    case 'Phiếu thu':
                        await deletePhieuThu(idPhieu)
                        break;
                    case 'Phiếu nhập':
                        await deletePhieuNhap(idPhieu)
                        break;
                    case 'Phiếu xuất kho':
                        await deletePhieuXuat(idPhieu)
                        break;
                    case 'Đơn bán hàng':
                        let dh = await getDonHangByCode('DH|'+idPhieu)
                        await deleteDonHang(dh.id) //
                        break;
                    case 'Đề nghị mua':
                        let dmh = await getDonMuaHangByCode('DH|'+idPhieu)
                        await deleteDonMuaHang(dmh.id) //
                        break;
                    case 'Phiếu chi':
                        await deletePhieuChi(idPhieu)
                        break;
                }
            }
        }
    } catch (e) {
        return;
    }

}

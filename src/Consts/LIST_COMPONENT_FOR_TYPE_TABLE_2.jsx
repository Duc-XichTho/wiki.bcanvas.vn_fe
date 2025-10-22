import React from 'react';
import GV2B from "../pages/Home/AgridTable/GiaVon/GV2B.jsx";
import CauHinhButToanKeToan from "../components/Header/CauHinh/CauHinhButToanKeToan.jsx";
import GV3M from "../pages/Home/AgridTable/GiaVon/GV3M.jsx";
import GV3MB2 from "../pages/Home/AgridTable/GiaVon/GV3MB2.jsx";
import GTHoanThanh from "../pages/Home/AgridTable/GiaVon/GTHoanThanh.jsx";
import GV3W from "../pages/Home/AgridTable/GiaVon/GV3W.jsx";
import DanhMucSoQuanLyTaiSanForDK from "../pages/Home/SubStep/SubStepItem/SubStepCustom/DanhMucSoQuanLyTaiSanForDK.jsx";
import TaoDonHang from '../pages/Home/formCreate/TaoDonHang.jsx';
import {PhieuGiaoHang} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuGiaoHang/PhieuGiaoHang.jsx";
import {PhieuGhiTS} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuGhiTS/PhieuGhiTS.jsx";
import {PhieuThuChi} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuThuChi/PhieuThuChi.jsx";
import TaoDeNghiMua from '../pages/Home/formCreate/TaoDeNghiMua.jsx';
import {PhieuChi2} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuChi/PhieuChi2.jsx";
import {PhieuThu2} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuThu/PhieuThu2.jsx";
import {TamUng2} from "../pages/Home/SubStep/SubStepItem/Mau/TamUng/TamUng2.jsx";
import {DNTT2} from "../pages/Home/SubStep/SubStepItem/Mau/DNTT/DNTT2.jsx";
import {PhieuNhap2} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuNhap/PhieuNhap2.jsx";
import {PhieuXuat2} from "../pages/Home/SubStep/SubStepItem/Mau/PhieuXuat/PhieuXuat2.jsx";
import {HoaDonMau2} from "../pages/Home/SubStep/SubStepItem/Mau/HoaDon/HoaDonMau2.jsx";
import {DieuChuyenKho} from "../pages/Home/SubStep/SubStepItem/Mau/DieuChuyenKho/DieuChuyenKho.jsx";
import TaoDonHang2 from "../pages/Home/formCreate/TaoDonHang2.jsx";

const componentsMap = {
    'Bút toán kế toán': CauHinhButToanKeToan,
    'Giá trị hoàn thành': GTHoanThanh,
    'Phân bổ giá vốn': GV2B,
    'Phân bổ giá vốn vụ việc': GV3W,
    'Phân bổ giá vốn lệnh sản xuất': GV3M,
    'Phân bổ giá vốn sản phẩm': GV3MB2,
    'Xuất hóa đơn': HoaDonMau2,
    'Phiếu nhập': PhieuNhap2,
    'Phiếu xuất': PhieuXuat2,
    'Điều chuyển kho': DieuChuyenKho,
    'Đơn hàng': TaoDonHang2,
    'Quản lý tài sản': DanhMucSoQuanLyTaiSanForDK,
    'Phiếu giao hàng': PhieuGiaoHang,
    'Phiếu thu': PhieuThu2,
    'Phiếu chi': PhieuChi2,
    'Tạm ứng': TamUng2,
    'Đề nghị thanh toán': DNTT2,
    'Phiếu ghi TS': PhieuGhiTS,
    'Phiếu thu chi': PhieuThuChi,
    'Đơn mua hàng': TaoDeNghiMua,
};

export const LIST_COMPONENT_FOR_TYPE_TABLE_2 = Object.entries(componentsMap).map(([name, Component]) => ({
    name,
    component: <Component />
}));


import {updateKhachHang} from "../../../../apis/khachHangService.jsx";
import {updateNhanVien} from "../../../../apis/nhanVienService.jsx";
import {updateNhaCungCap} from "../../../../apis/nhaCungCapService.jsx";
import {createTimestamp, formatDateISO} from "../../../../generalFunction/format.js";
import {updateKmf} from "../../../../apis/kmfService.jsx";
import {updateKmtc} from "../../../../apis/kmtcService.jsx";
import {updateHangHoa} from "../../../../apis/hangHoaService.jsx";
import {updateDuAn} from "../../../../apis/duAnService.jsx";
import {updateHopDong} from "../../../../apis/hopDongService.jsx";
import {updateKho} from "../../../../apis/khoService.jsx";
import {updateTaiKhoanNganHang} from "../../../../apis/taiKhoanNganHangService.jsx";
import {updatePhongBan} from "../../../../apis/phongBanService.jsx";
import {updateTaiKhoan} from "../../../../apis/taiKhoanService.jsx";
import {updateCompany} from "../../../../apis/companyService.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import {updateSoKeToan} from "../../../../apis/soketoanService.jsx";
import {updateSoChuoi} from "../../../../apis/soChuoiService.jsx";
import {updateHangHoaLo} from "../../../../apis/hangHoaLoService.jsx";
import {updatePhieuNhap} from "../../../../apis/phieuNhapService.jsx";
import {updateMappingLuong} from "../../../../apis/mappingLuongService.jsx";
import {updateLuong} from "../../../../apis/luongService.jsx";
import {updateKhaiBaoDauKy} from "../../../../apis/khaiBaoDauKyService.jsx";
import {updateCauHinh} from "../../../../apis/cauHinhService.jsx";
import {updateHoaDon} from "../../../../apis/hoaDonService.jsx";
import {updateBusinessUnit} from "../../../../apis/businessUnitService.jsx";
import {updateChuongTrinh} from "../../../../apis/chuongTrinhService.jsx";
import {updateChuSoHuu} from "../../../../apis/chuSoHuuService.jsx";
import {updateLoaiTien} from "../../../../apis/loaiTienService.jsx";
import {updateTaiSanDauTu} from "../../../../apis/taiSanDauTuService.jsx";
import {updateLenhSanXuat} from "../../../../apis/lenhSanXuatService.jsx";
import {updateDetailLenhSanXuat} from "../../../../apis/detailLenhSanXuatService.jsx";
import {updateCCPB} from "../../../../apis/ccpbService.jsx";
import {updatePBGV2B} from "../../../../apis/pbgv2BService.jsx";
import {updatePBGV3} from "../../../../apis/pbgv3Service.jsx";
import {updatePBLSX} from "../../../../apis/pblsxService.jsx";
import {updateB0123} from "../../../../apis/b0123Service.jsx";
import {updateCard} from "../../../../apis/cardService.jsx";
import {updateDinhKhoanProData} from "../../../../apis/dinhKhoanProDataService.jsx";
import {updateKenh} from "../../../../apis/kenhService.jsx";
import {updateFile} from "../../../../apis/fileService.jsx";

export const handleSave = async (updatedData, table, setUpdatedData, currentUser) => {
    try {
        const updatedDataLast = updatedData.map(data => ({
            ...data,
            user_update: currentUser.email,
            updated_at: createTimestamp(),
        }));
        if (table === 'DKProData') {
            const promises = updatedData.map(async (data) => {
                await updateDinhKhoanProData(data);
            });
            await Promise.all(promises);
        }
        if (table === 'File') {
            const promises = updatedData.map(async (data) => {
                await updateFile(data);
            });
            await Promise.all(promises);
        }
        if (table === 'B0123') {
            const promises = updatedData.map(async (data) => {
                await updateB0123(data);
            });
            await Promise.all(promises);
        }
        if (table === 'PBLSX') {
            const promises = updatedData.map(async (data) => {
                await updatePBLSX(data);
            });
            await Promise.all(promises);
        }
        if (table === 'PBGV3') {
            const promises = updatedData.map(async (data) => {
                await updatePBGV3(data);
            });
            await Promise.all(promises);
        }
        if (table === 'PBGV2B') {
            const promises = updatedData.map(async (data) => {
                await updatePBGV2B(data);
            });
            await Promise.all(promises);
        }
        if (table === 'CoChePhanBo') {
            const promises = updatedData.map(async (data) => {
                await updateCCPB(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Kenh') {
            const promises = updatedData.map(async (data) => {
                await updateKenh(data);
            });
            await Promise.all(promises);
        }
        if (table === 'DetailLenhSanXuat') {
            const promises = updatedData.map(async (data) => {
                await updateDetailLenhSanXuat(data);
            });
            await Promise.all(promises);
        }
        if (table === 'LenhSanXuat') {
            const promises = updatedData.map(async (data) => {
                await updateLenhSanXuat(data);
            });
            await Promise.all(promises);
        }
        if (table === 'TaiSanDauTu') {
            const promises = updatedData.map(async (data) => {
                await updateTaiSanDauTu(data);
            });
            await Promise.all(promises);
        }
        if (table === 'LoaiTien') {
            const promises = updatedData.map(async (data) => {
                await updateLoaiTien(data);
            });
            await Promise.all(promises);
        }
        if (table === 'ChuSoHuu') {
            const promises = updatedData.map(async (data) => {
                await updateChuSoHuu(data);
            });
            await Promise.all(promises);
        }
        if (table === 'ChuongTrinh') {
            const promises = updatedData.map(async (data) => {
                await updateChuongTrinh(data);
            });
            await Promise.all(promises);
        }
        if (table === 'BU') {
            const promises = updatedData.map(async (data) => {
                await updateBusinessUnit(data);
            });
            await Promise.all(promises);
        }
        if (table === 'DauKy') {
            const promises = updatedData.map(async (data) => {
                await updateKhaiBaoDauKy(data);
            });
            await Promise.all(promises);
        }
        if (table === 'CauHinh') {
            const promises = updatedData.map(async (data) => {
                await updateCauHinh(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Luong') {
            const promises = updatedData.map(async (data) => {
                await updateLuong(data);
            });
            await Promise.all(promises);
        }
        if (table === 'MappingLuong') {
            const promises = updatedData.map(async (data) => {
                await updateMappingLuong(data);
            });
            await Promise.all(promises);
        }
        if (table === 'PhieuNhap') {
            const promises = updatedDataLast.map(async (data) => {
                await updatePhieuNhap(data);
            });
            await Promise.all(promises);
        }
        if (table === 'HangHoaLo') {
            const promises = updatedDataLast.map(async (data) => {
                await updateHangHoaLo(data);
            });
            await Promise.all(promises);
        }
        if (table === 'SoChuoi') {
            const promises = updatedDataLast.map(async (data) => {
                await updateSoChuoi(data);
            });
            await Promise.all(promises);
        }
        if (table === 'KhachHang') {
            const promises = updatedDataLast.map(async (data) => {
                await updateKhachHang(data);
            });
            await Promise.all(promises);
        }
        if (table === 'NhanVien') {
            const promises = updatedDataLast.map(async (data) => {
                await updateNhanVien(data);
            });
            await Promise.all(promises);
        }
        if (table === 'NhaCungCap') {
            const promises = updatedDataLast.map(async (data) => {
                await updateNhaCungCap(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Kmf') {
            const promises = updatedDataLast.map(async (data) => {
                await updateKmf(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Kmtc') {
            const promises = updatedDataLast.map(async (data) => {
                await updateKmtc(data);
            });
            await Promise.all(promises);
        }
        if (table === 'SanPham') {
            const promises = updatedDataLast.map(async (data) => {
                await updateHangHoa(data);
            });
            await Promise.all(promises);
        }
        if (table === 'DuAn') {
            const promises = updatedDataLast.map(async (data) => {
                await updateDuAn(data);
            });
            await Promise.all(promises);
        }
        if (table === 'HopDong') {
            const promises = updatedDataLast.map(async (data) => {
                await updateHopDong(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Kho') {
            const promises = updatedDataLast.map(async (data) => {
                await updateKho(data);
            });
            await Promise.all(promises);
        }
        if (table === 'TkNganHang') {
            const promises = updatedDataLast.map(async (data) => {
                await updateTaiKhoanNganHang(data);
            });
            await Promise.all(promises);
        }
        if (table === 'TkNganHang') {
            const promises = updatedDataLast.map(async (data) => {
                await updateTaiKhoanNganHang(data);
            });
            await Promise.all(promises);
        }

        if (table === 'PhongBan') {
            const promises = updatedDataLast.map(async (data) => {
                await updatePhongBan(data);
            });
            await Promise.all(promises);
        }
        if (table === 'TkKeToan') {
            const promises = updatedDataLast.map(async (data) => {
                await updateTaiKhoan(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Company') {
            const promises = updatedDataLast.map(async (data) => {
                await updateCompany(data);
            });
            await Promise.all(promises);
        }
        if (table === 'SoKeToan') {
            const promises = updatedData.map(async (data) => {
                if (data.loai_giao_dich === 'Chi') {
                    data.ref_id2 = -data.so_tien || 0;
                }
                if (data.loai_giao_dich === 'Thu') {
                    data.ref_id2 = data.so_tien || 0;
                }
                const taiKhoanNo = data.tai_khoan_no;
                const taiKhoanCo = data.tai_khoan_co;
                if (taiKhoanNo && /^[5678]/.test(taiKhoanNo)) {
                    data.kmf = taiKhoanNo.replace(/^\d+-/, '');
                }
                if (taiKhoanCo && /^[5678]/.test(taiKhoanCo)) {
                    data.kmf = taiKhoanCo.replace(/^\d+-/, '');
                }
                if ((taiKhoanNo && /^[5678]/.test(taiKhoanNo)) || (taiKhoanCo && /^[5678]/.test(taiKhoanCo))) {
                    if ((taiKhoanNo && /^[57]/.test(taiKhoanNo)) || (taiKhoanCo && /^[57]/.test(taiKhoanCo))) {
                        data.ref_id3 = 'Doanh thu';
                    } else if ((taiKhoanNo && /^[68]/.test(taiKhoanNo)) || (taiKhoanCo && /^[68]/.test(taiKhoanCo))) {
                        data.ref_id3 = 'Chi phí';
                    }
                }
                if (data.show === 'true') {
                    if (/^6|^8|^52/.test(taiKhoanNo)) {
                        data.so_tien_kd = -data.so_tien;
                    } else if (/^6|^8|^52/.test(taiKhoanCo)) {
                        data.so_tien_kd = data.so_tien;
                    } else if (/^51|^7/.test(taiKhoanNo)) {
                        data.so_tien_kd = -data.so_tien;
                    } else if (/^51|^7/.test(taiKhoanCo)) {
                        data.so_tien_kd = data.so_tien;
                    }
                }
                data = JSON.parse(JSON.stringify(data))
                if (data.CCPBDV === 'Trực tiếp') data.CCPBDV = null;
                if (data.CCBSP === 'Trực tiếp') data.CCBSP = null;
                if (data.CCPBDEAL === 'Trực tiếp') data.CCPBDEAL = null;
                await updateSoKeToan(data);
            });
            await Promise.all(promises);
        }
        if (table === 'HoaDon') {
            const promises = updatedData.map(async (data) => {
                await updateHoaDon(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Card') {
            const promises = updatedData.map(async (data) => {
                await updateCard(data);
            });
            await Promise.all(promises);
        }
        try {
            setUpdatedData([]);
        } catch (e) {
        }
    } catch (error) {
        console.error('Error updating data:', error);
        // toast.error('Lỗi khi lưu dữ liệu: ', error.message);
    }
};

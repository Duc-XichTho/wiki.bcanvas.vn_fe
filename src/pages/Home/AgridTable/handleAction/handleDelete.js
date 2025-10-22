import { updateKhachHang } from '../../../../apis/khachHangService.jsx';
import { updateNhaCungCap } from '../../../../apis/nhaCungCapService.jsx';
import { updateNhanVien } from '../../../../apis/nhanVienService.jsx';
import { updateKmf } from '../../../../apis/kmfService.jsx';
import { createTimestamp } from '../../../../generalFunction/format.js';
import { updateKmtc } from '../../../../apis/kmtcService.jsx';
import { updateHangHoa } from '../../../../apis/hangHoaService.jsx';
import { updateDuAn } from '../../../../apis/duAnService.jsx';
import { updateHopDong } from '../../../../apis/hopDongService.jsx';
import { updateTaiKhoanNganHang } from '../../../../apis/taiKhoanNganHangService.jsx';
import { updatePhongBan } from '../../../../apis/phongBanService.jsx';
import { updateTaiKhoan } from '../../../../apis/taiKhoanService.jsx';
import { updateCompany } from '../../../../apis/companyService.jsx';
import { updateSoKeToan } from '../../../../apis/soketoanService.jsx';
import { updateSoChuoi } from '../../../../apis/soChuoiService.jsx';
import { updateTemplate } from '../../../../apis/templateService.jsx';
import { deleteFile, updateFile } from '../../../../apis/fileService.jsx';
import { deleteHangHoaLo } from '../../../../apis/hangHoaLoService.jsx';
import { deleteSoQuanLyChiTraTruoc } from '../../../../apis/soQuanLyChiTraTruocService.jsx';
import { deleteSoQuanLyTaiSan } from '../../../../apis/soQuanLyTaiSanService.jsx';
import { deleteCard } from '../../../../apis/cardService.jsx';
import { deleteLuong } from '../../../../apis/luongService.jsx';
import { deleteKhaiBaoDauKy } from '../../../../apis/khaiBaoDauKyService.jsx';
import { updateCauHinh } from '../../../../apis/cauHinhService.jsx';
import { deleteHoaDon } from '../../../../apis/hoaDonService.jsx';
import { getCurrentUserLogin } from '../../../../apis/userService.jsx';
import { deleteDienGiai } from '../../../../apis/dienGiaiService.jsx';

export const handleDelete = async (table, id) => {
	const { data, error } = await getCurrentUserLogin();
	const currentUser = data;
	switch (table) {
		case 'KhachHang':
			await updateKhachHang({
				id: id,
				show: false,
				user_delete: currentUser.email,
				deleted_at: createTimestamp(),
			});
			break;
		case 'NhaCungCap':
			await updateNhaCungCap({
				id: id,
				show: false,
				user_delete: currentUser.email,
				deleted_at: createTimestamp(),
			});
			break;
		case 'CauHinh':
			await updateCauHinh({ id: id, show: false, user_delete: currentUser.email, deleted_at: createTimestamp() });
			break;
		case 'NhanVien':
			await updateNhanVien({
				id: id,
				show: false,
				user_delete: currentUser.email,
				deleted_at: createTimestamp(),
			});
			break;
		case 'Kmf':
			await updateKmf({ id: id, show: false, user_delete: currentUser.email, deleted_at: createTimestamp() });
			break;
		case 'Kmtc':
			await updateKmtc({ id: id, show: false, user_delete: currentUser.email, deleted_at: createTimestamp() });
			break;
		case 'SanPham':
			await updateHangHoa({ id: id, show: false, user_delete: currentUser.email, deleted_at: createTimestamp() });
			break;
		case 'DuAn':
			await updateDuAn({ id: id, show: false, user_delete: currentUser.email, deleted_at: createTimestamp() });
			break;
		case 'HopDong':
			await updateHopDong({ id: id, show: false, user_delete: currentUser.email, deleted_at: createTimestamp() });
			break;
		case 'TkNganHang':
			await updateTaiKhoanNganHang({
				id: id,
				show: false,
				user_delete: currentUser.email,
				deleted_at: createTimestamp(),
			});
			break;
		case 'PhongBan':
			await updatePhongBan({
				id: id,
				show: false,
				user_delete: currentUser.email,
				deleted_at: createTimestamp(),
			});
			break;
		case 'TkKeToan':
			await updateTaiKhoan({
				id: id,
				show: false,
				user_delete: currentUser.email,
				deleted_at: createTimestamp(),
			});
			break;
		case 'Company':
			await updateCompany({ id: id, show: false, user_delete: currentUser.email, deleted_at: createTimestamp() });
			break;
		case 'SoKeToan':
			await updateSoKeToan({
				id: id,
				show: false,
				user_delete: currentUser.email,
				deleted_at: createTimestamp(),
			});
			break;
		case 'SoChuoi':
			await updateSoChuoi({ id: id, show: false, user_delete: currentUser.email, deleted_at: createTimestamp() });
			break;
		case 'Template':
			await updateTemplate({
				id: id,
				show: false,
				user_delete: currentUser.email,
				deleted_at: createTimestamp(),
			});
			break;
		case 'File-Upload':
			await deleteFile(id);
			break;
		case 'HangHoaLo':
			await deleteHangHoaLo(id);
			break;
		case 'SoQuanLyChiTraTruoc':
			await deleteSoQuanLyChiTraTruoc(id);
			break;
		case 'SoQuanLyTaiSan':
			await deleteSoQuanLyTaiSan(id);
			break;
		case 'Card':
			await deleteCard(id);
			break;
		case 'Luong':
			await deleteLuong(id);
			break;
		case 'DauKy':
			await deleteKhaiBaoDauKy(id);
			break;
		case 'HoaDon':
			await deleteHoaDon(id);
			break;
		case 'DienGiai':
			await deleteDienGiai(id);
			break;
		default:
			throw new Error('Invalid table name');
	}
};

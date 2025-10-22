import { fetchDataColor } from '../../Canvas/Daas/Content/Template/SettingChart/ChartTemplate/setChartTemplate.js';
import {
	createChartOptionsFromDataBH,
	tinhGiaTriNgayTheoChuKyKH,
	tinhGiaTriTheoNgayThangTH,
	tinhTongTheoNgay,
	transformRows,
} from './logicChuKyView.js';
import { getTemplateRow } from '../../../apis/templateSettingService.jsx';

export async function fetchDataTHCKKH(khkdTH, selectedMonth, dataTT) {
	dataTT = dataTT.filter(e => e.phanLoai?.trim().toLowerCase() === 'doanh thu');
	let banHangData = [];
	let fills = await fetchDataColor();
	if (khkdTH && khkdTH.listTemplate && khkdTH.listTemplate.banHang) {
		let banHang = khkdTH.listTemplate.banHang;
		let rowsResponse = await getTemplateRow(banHang.templateId);
		let rows = rowsResponse.rows || [];
		if (rows.length > 0) {
			rows = rows.map(item => item.data);
			banHangData = transformRows(rows, banHang);
			banHangData.map(item => {
				let dataTTItem = dataTT.find(d => d.name == item.name && d.khoanMuc == item.khoanMuc && d.boPhan == item.boPhan);
				item.chuKy = dataTTItem?.chuKy;
			});
			banHangData = tinhGiaTriTheoNgayThangTH(banHangData, selectedMonth);
		}
	}
	let KHData = [];
	dataTT.map(item => {
		KHData.push(tinhGiaTriNgayTheoChuKyKH(item, selectedMonth));
	});
	let dataChartKH = tinhTongTheoNgay(KHData, '');
	let dataChartTH = tinhTongTheoNgay(banHangData, '_th');
	let tungNgayData = createChartOptionsFromDataBH(dataChartKH, dataChartTH, selectedMonth, false, 'Từng ngày', fills);
	let luyKeData = createChartOptionsFromDataBH(dataChartKH, dataChartTH, selectedMonth, true, 'Lũy kế', fills)
	return {
		'Lũy kế': luyKeData?.data || [],
		'Từng ngày': tungNgayData?.data || []
	}
}

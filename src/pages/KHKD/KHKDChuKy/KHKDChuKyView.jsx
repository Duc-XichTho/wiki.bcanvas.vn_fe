import React, { useContext, useEffect, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Select } from 'antd';
import { MyContext } from '../../../MyContext.jsx';
import { getTemplateRow } from '../../../apis/templateSettingService.jsx';
import {
	createChartOptionsFromDataBH, createLinearGaugeOptions, tinhDHV,
	tinhGiaTriNgayTheoChuKyKH,
	tinhGiaTriTheoNgayThangTH, tinhLaiTrungBinh,
	tinhTongTheoNgay, tinhTongTTTheoThang,
	transformRows,
} from './logicChuKyView.js';
import { AgCharts } from 'ag-charts-react';
import css from './KHKDChuKyView.module.css';
import { formatCurrency } from '../../../generalFunction/format.js';
import { fetchDataColor } from '../../Canvas/Daas/Content/Template/SettingChart/ChartTemplate/setChartTemplate.js'; // ✅ import CSS module

const KHKDChuKyView = ({ dataTT, khkdTH, dataCF }) => {
	const { currentMonthKTQT } = useContext(MyContext);
	const [selectedMonth, setSelectedMonth] = useState(1);
	const [options, setOptions] = useState(null);
	const [options2, setOptions2] = useState(null);
	const [dhv, setDHV] = useState(null);

	async function fetchDataTHCKKH() {
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
		let tbLai = tinhLaiTrungBinh(dataTT);
		let cfTong = tinhTongTTTheoThang(dataCF);
		let DHV = tinhDHV(cfTong, tbLai);
		setDHV(DHV);
		setOptions(createChartOptionsFromDataBH(dataChartKH, dataChartTH, selectedMonth, false, 'Từng ngày', fills));
		setOptions2(createChartOptionsFromDataBH(dataChartKH, dataChartTH, selectedMonth, true, 'Lũy kế', fills));
	}

	useEffect(() => {
		fetchDataTHCKKH().then();
	}, [dataTT, selectedMonth]);

	const handleMonthSelect = (value) => {
		setSelectedMonth(value);
	};

	return (
		<div style={{marginTop: 10}}>
			<h2>BÁN HÀNG</h2>
			<div className={css.wrapper}>
				<div className={css.topControls}>
					{!selectedMonth ? (
						<span style={{ color: 'red' }}>Vui lòng chọn tháng!</span>
					) : (
						<span className={css.monthLabel}>Tháng hiển thị</span>
					)}
					<Select
						className={css.customSelect}
						value={selectedMonth}
						onChange={handleMonthSelect}
						style={{ width: 'max-content' }}
						placeholder="Vui lòng chọn tháng"
					>
						{Array.from({ length: 12 }, (_, i) => (
							<Option key={i + 1} value={i + 1}>
								Tháng {i + 1}
							</Option>
						))}
					</Select>
					{dhv &&
						<div className={css.dhv}>
							<div className={css.label}>Điểm doanh thu hòa vốn ước tính</div>
							<div className={css.value}>{formatCurrency((-dhv[`t${[selectedMonth]}`]/1000000).toFixed(0))}M</div>
						</div>
					}
					{options2 &&
						<div className={css.dhv}>
							<div className={css.label}>Doanh thu đã thực hiện trong tháng</div>
							<div className={css.value}>{formatCurrency((options2.data[options2.data.length - 1].thucHien/1000000).toFixed(0))}M</div>
						</div>
					}
					{options2 &&
						<div className={css.dhv}>
							<div className={css.label}>Doanh thu kế hoạch trong tháng</div>
							<div className={css.value}>{formatCurrency((options2.data[options2.data.length - 1].keHoach/1000000).toFixed(0))}M</div>
						</div>
					}
				</div>
				<div className={css.chartContainer}>
					<div className={css.chartItem}>{options && <AgCharts options={options} />}</div>
					<div className={css.chartItem}>{options2 && <AgCharts options={options2} />}</div>
				</div>
			</div>
		</div>
	);
};

export default KHKDChuKyView;

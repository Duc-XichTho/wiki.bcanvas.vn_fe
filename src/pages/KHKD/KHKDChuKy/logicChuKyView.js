import { formatCurrency } from '../../../generalFunction/format.js';

export function transformRows(rows, setting) {
	return rows.map(row => {
		const transformed = {};
		for (const [newKey, oldKey] of Object.entries(setting)) {
			let value = row[oldKey];
			if (['ngay', 'thang', 'giaTri'].includes(newKey)) {
				value = Number(value);
			}
			transformed[newKey] = value;
		}
		return transformed;
	});
}

export function tinhGiaTriNgayTheoChuKyKH(input, selectedMonth) {
	const { chuKy, data, name, khoanMuc, boPhan } = input;
	const tongTienThang = data.tt;
	const keyTienThang = `t${selectedMonth}`;
	const tongGiaTri = tongTienThang[keyTienThang] || 0;

	let giaTriNgay;

	if (chuKy && chuKy.length > 0) {
		// Có chu kỳ -> dùng dữ liệu chu kỳ
		giaTriNgay = chuKy
			.filter(thangData => thangData.month == selectedMonth)
			.map(thangData => {
				const thang = thangData.month;

				const ngayList = Object.entries(thangData)
					.filter(([key]) => key.startsWith('day_'))
					.map(([key, val]) => {
						const ngay = key.replace('day_', '');
						const tiLe = Number(val);
						return { ngay, tiLe };
					});

				const tongTiLe = ngayList.reduce((sum, d) => sum + d.tiLe, 0);

				const phanBo = { thang };
				ngayList.forEach(({ ngay, tiLe }) => {
					const giaTriNgay = tongTiLe > 0 ? (tongGiaTri * tiLe) / tongTiLe : 0;
					phanBo[ngay] = Math.round(giaTriNgay);
				});

				return phanBo;
			});
	} else {
		// Không có chu kỳ -> mặc định mỗi ngày trong tháng có tỷ lệ 1
		const soNgayTrongThang = new Date(new Date().getFullYear(), selectedMonth, 0).getDate(); // selectedMonth là 1-12
		const tiLeMacDinh = 1;
		const tongTiLe = tiLeMacDinh * soNgayTrongThang;

		const phanBo = { thang: selectedMonth };
		for (let ngay = 1; ngay <= soNgayTrongThang; ngay++) {
			const giaTriNgay = (tongGiaTri * tiLeMacDinh) / tongTiLe;
			phanBo[String(ngay)] = Math.round(giaTriNgay);
		}

		giaTriNgay = [phanBo];
	}

	return {
		name,
		khoanMuc,
		boPhan,
		giaTriNgay,
	};
}

export function tinhGiaTriTheoNgayThangTH(data, selectedMonth) {
	const resultMap = new Map();
	data
		.filter(item => item.thang == selectedMonth) // chỉ lấy dữ liệu tháng được chọn
		.forEach(({ name, khoanMuc, boPhan, ngay, thang, giaTri }) => {
			const key = `${name}__${khoanMuc}__${boPhan}`;

			if (!resultMap.has(key)) {
				resultMap.set(key, {
					name,
					khoanMuc,
					boPhan,
					giaTriNgay: [],
				});
			}

			const group = resultMap.get(key);

			let monthBlock = group.giaTriNgay.find(entry => entry.month === thang);
			if (!monthBlock) {
				monthBlock = { month: thang };
				for (let i = 1; i <= 31; i++) {
					monthBlock[`${i}`] = null;
				}
				group.giaTriNgay.push(monthBlock);
			}

			monthBlock[`${ngay}`] = giaTri;
		});

	return Array.from(resultMap.values());
}

export function tinhTongTheoNgay(data, key) {
	const ketQua = {};

	data.forEach(item => {
		item.giaTriNgay.forEach(thangData => {
			const thang = thangData.thang;

			for (let ngay = 1; ngay <= 31; ngay++) {
				const giaTri = thangData[ngay];
				if (typeof giaTri === 'number') {
					const tenKey = `${ngay}${key}`;
					if (!ketQua[tenKey]) {
						ketQua[tenKey] = 0;
					}
					ketQua[tenKey] += giaTri;
				}
			}
		});
	});

	return ketQua;
}

export function createChartOptionsFromDataBH(
	dataKH,
	dataTH,
	selectedMonth,
	isLuyKe = false,
	name = 'KPI Chart',
	fills = [],
) {
	const data = [];
	const daysInMonth = new Date(new Date().getFullYear(), selectedMonth, 0).getDate();

	let cumKeHoach = 0;
	let cumThucHien = 0;

	for (let i = 1; i <= daysInMonth; i++) {
		const day = i.toString();
		const thKey = `${day}_th`;

		const keHoachValue = dataKH[day] ?? 0;
		const thucHienValue = dataTH[thKey] ?? 0;

		if (isLuyKe) {
			cumKeHoach += keHoachValue;
			cumThucHien += thucHienValue;
			data.push({
				day,
				keHoach: cumKeHoach,
				thucHien: cumThucHien,
			});
		} else {
			data.push({
				day,
				keHoach: keHoachValue,
				thucHien: thucHienValue,
			});
		}
	}

	return {
		title: {
			text: name,
			fontSize: 16,
		},
		data,
		series: [
			{
				type: 'line',
				id: 'keHoach',
				xKey: 'day',
				yKey: 'keHoach',
				title: 'Kế hoạch',
				stroke: fills[0],
				marker: {
					shape: 'circle',
					size: 4,
					fill: fills[0],
				},
				interpolation: {
					type: 'smooth',
				},
			},
			{
				type: 'line',
				id: 'thucHien',
				xKey: 'day',
				yKey: 'thucHien',
				title: 'Thực hiện',
				stroke: fills[1],
				marker: {
					shape: 'square',
					size: 4,
					fill: fills[1],
				},
				interpolation: {
					type: 'smooth',
				},
			},
		],
		axes: [
			{
				type: 'category',
				position: 'bottom',
				title: { enabled: false },
				gridLine: {
					enabled: true,
					style: [
						{
							stroke: '#e0e0e0',
							lineDash: [4, 2],
						},
					],
				},
			},
			{
				type: 'number',
				position: 'left',
				title: { enabled: false },
				label: {
					formatter: (params) => formatCurrency(params.value),
				},
				// gridLine: {
				// 	enabled: false, // giữ nguyên grid ngang nếu cần
				// },
			},
		],
		legend: {
			position: 'bottom',
			item: {
				label: {
					formatter: ({ seriesId }) => {
						if (seriesId === 'keHoach') return 'Kế hoạch';
						if (seriesId === 'thucHien') return 'Thực hiện';
						return seriesId;
					},
				},
			},
		},
	};
}

export function tinhTongTTTheoThang(data) {
	const months = Array.from({ length: 12 }, (_, i) => `t${i + 1}`);
	const result = {};

	months.forEach(month => {
		result[month] = data.reduce((sum, item) => {
			return sum + (item?.data?.tt?.[month] || 0);
		}, 0);
	});

	return result;
}


export function tinhLaiTrungBinh(data) {
	const months = Array.from({ length: 12 }, (_, i) => `t${i + 1}`);
	const result = {};

	months.forEach(month => {
		// Tính tổng tiền của tất cả đối tượng trong tháng hiện tại
		const tongTien = data.reduce((sum, item) => {
			const tien = item?.data?.tt?.[month] || 0;
			return sum + tien;
		}, 0);
		// Nếu tổng tiền bằng 0, thì không thể tính lãi
		if (tongTien === 0) {
			result[month] = 0;
			return;
		}

		// Tính lãi trung bình cho tháng
		const laiThang = data.reduce((sum, item) => {
			const tien = item?.data?.tt?.[month] || 0;
			const lai = parseFloat(item?.lai?.[month]) || 0;
			const tyLe = tien / tongTien;
			return sum + (tyLe * lai);
		}, 0);
		result[month] = laiThang;
	});

	return result;
}

export function tinhDHV(cfTong, tbLai) {
	const result = {};
	const months = Array.from({ length: 12 }, (_, i) => `t${i + 1}`);

	for (const m of months) {
		const tong = cfTong[m]*100 || 0;
		const lai = tbLai[m] || 0;
		result[`${m}`] = lai !== 0 ? tong / lai : 0;
	}

	return result;
}

export function createLinearGaugeOptions( DHV, dataChartTH, selectedMonth) {
	const selectedKey = `t${selectedMonth}`;
	const thKey = `${selectedMonth}_th`;

	const value = dataChartTH[thKey];
	const targetValue = DHV[selectedKey];

	return {
		type: 'linear-gauge',
		direction: 'horizontal',
		value: value,
		scale: {
			min: 0,
			max: Math.max(value, targetValue) * 1.2, // mở rộng trục x một chút
		},
		targets: [
			{
				value: targetValue,
				text: 'Điểm hòa vốn',
			},
		],
	};
}

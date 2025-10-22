export function convertDataKHKD(input) {
	const result = {};

	// Kiểm tra có object "Tỷ lệ (%)" không
	const hasTyLe = input.some(item => item.name === 'Tỷ lệ (%)');
	const thanhTienObj = input.find(item => item.name === 'Thành tiền');
	const tyLeObj = input.find(item => item.name === 'Tỷ lệ (%)');
	if (hasTyLe && thanhTienObj && tyLeObj) {
		result['dg'] = {};
		result['sl'] = {};
		Object.keys(thanhTienObj).forEach(k => {
			if (k !== 'name' && k.startsWith('T')) {
				const thanhTien = Number(thanhTienObj[k]);
				const tyLe = Number(tyLeObj[k]);
				result['dg'][k.toLowerCase()] = tyLe !== 0 ? (thanhTien / tyLe) * 100 : 0;
				result['sl'][k.toLowerCase()] = tyLe;
			}
		});
		return result;
	}

	// Logic cũ
	const nameMap = {
		"Số lượng": "sl",
		"Đơn giá": "dg"
	};

	input.forEach(item => {
		const key = nameMap[item.name] || item.name;
		result[key] = {};

		Object.keys(item).forEach(k => {
			if (k !== 'name' && k.startsWith('T')) {
				result[key][k.toLowerCase()] = Number(item[k]);
			}
		});
	});

	return result;
}


export let dataElement = [
	{
		khoanMuc: 'Doanh thu',
		labelSoLuong: 'SL Job',
		theoDoi: true,
		data: {
			'sl': {
				't1':100,
				't2':200,
				't3':400,
				't4':500,
			},
			'dg': {
				't1':10,
				't2':200,
				't3':5,
				't4':8,
			},
		},
	},
	{
		khoanMuc: 'Chi phí',
		labelSoLuong: 'SL Job',
		theoDoi: true,
		data: {
			'sl': {
				't1':10,
				't2':20,
				't3':40,
				't4':50,
			},
			'dg': {
				't1':10,
				't2':200,
				't3':5,
				't4':8,
			},
		},
	},
	{
		khoanMuc: 'Chi phí 2',
		labelSoLuong: 'SL KH',
		theoDoi: false,
		data: {
			'sl': {
				't1':100,
				't2':200,
				't3':400,
				't4':500,
			},
			'dg': {
				't1':10,
				't2':200,
				't3':5,
				't4':8,
			},
		},
	},
	{
		khoanMuc: 'Chi phí',
		labelSoLuong: 'SL NV',
		theoDoi: true,
		data: {
			'sl': {
				't1':100,
				't2':200,
				't3':400,
				't4':500,
			},
			'dg': {
				't1':10,
				't2':200,
				't3':5,
				't4':8,
			},
		},
	},
	{
		khoanMuc: 'Doanh thu',
		labelSoLuong: 'SL KH',
		theoDoi: false,
		data: {
			'sl': {
				't1':100,
				't2':200,
				't3':400,
				't4':500,
			},
			'dg': {
				't1':10,
				't2':200,
				't3':5,
				't4':8,
			},
		},
	},
];

export function mergeDataByKM(data) {
	if (!Array.isArray(data)) return;
	data = data.filter(item => item.theoDoi && item.khoanMuc);
	const result = {};
	const originalLabels = {}; // Lưu lại khoanMuc gốc tương ứng với key đã chuẩn hoá

	for (const item of data) {
		const rawKhoanMuc = item.khoanMuc || '';
		const normalizedKhoanMuc = rawKhoanMuc.trim().toLowerCase();

		if (!result[normalizedKhoanMuc]) {
			result[normalizedKhoanMuc] = {
				khoanMuc: rawKhoanMuc.trim(), // Giữ khoanMuc gốc đầu tiên đã gặp
				data: { sl: {}, dg: {}, tt: {} },
			};
			originalLabels[normalizedKhoanMuc] = rawKhoanMuc.trim();
		}

		const { sl, dg, tt } = item.data;

		for (const key in sl) {
			result[normalizedKhoanMuc].data.sl[key] = (result[normalizedKhoanMuc].data.sl[key] || 0) + sl[key];
		}

		for (const key in dg) {
			result[normalizedKhoanMuc].data.dg[key] = (result[normalizedKhoanMuc].data.dg[key] || 0) + dg[key];
		}

		for (const key in tt) {
			result[normalizedKhoanMuc].data.tt[key] = (result[normalizedKhoanMuc].data.tt[key] || 0) + tt[key];
		}
	}

	return Object.values(result);
}

export function mergeDataBySL(data) {
	if (!Array.isArray(data)) return;

	data = data.filter(item => item.theoDoi);
	const result = {};
	const originalLabels = {}; // Lưu label gốc theo key chuẩn hoá

	for (const item of data) {
		const rawLabel = item.labelSoLuong || '';
		const normalizedLabel = rawLabel.trim().toLowerCase();

		if (!result[normalizedLabel]) {
			result[normalizedLabel] = {
				labelSoLuong: rawLabel.trim(), // Giữ label gốc đầu tiên
				data: { sl: {}, dg: {}, tt: {} },
			};
			originalLabels[normalizedLabel] = rawLabel.trim();
		}

		const { sl, dg, tt } = item.data;

		for (const key in sl) {
			result[normalizedLabel].data.sl[key] = (result[normalizedLabel].data.sl[key] || 0) + sl[key];
		}

		for (const key in dg) {
			result[normalizedLabel].data.dg[key] = (result[normalizedLabel].data.dg[key] || 0) + dg[key];
		}

		for (const key in tt) {
			result[normalizedLabel].data.tt[key] = (result[normalizedLabel].data.tt[key] || 0) + tt[key];
		}
	}

	return Object.values(result);
}

export function addTT(data) {
	if (!Array.isArray(data)) return [];

	const result = [];

	for (const item of data) {
		const { sl, dg } = item.data || {};
		if (!sl || !dg) continue;

		const tt = {};
		const keys = new Set([...Object.keys(sl), ...Object.keys(dg)]);

		for (const key of keys) {
			let slValue = sl[key] || 0;
			let dgValue = dg[key] || 0;
			if (!item.isDT) dgValue = -dgValue;
			tt[key] = slValue * dgValue;
		}

		result.push({
			...item,
			data: {
				...item.data,
				tt
			}
		});
	}

	return result;
}


export function convertDataSL(input) {
	if (!Array.isArray(input)) return
	return input.map(item => {
		const result = { name: item.labelSoLuong };
		const sl = item.data.sl;

		for (const key in sl) {
			result[key] = sl[key];
		}

		return result;
	});
}

export function convertDataKQ(input) {
	if (!Array.isArray(input)) return

	return input.map(item => {
		const result = { name: item.khoanMuc };
		const tt = item.data.tt;

		for (const key in tt) {
			result[key] = tt[key];
		}

		return result;
	});
}

export function convertDataTH(data, columnName, suffix = "th") {
	if (!Array.isArray(data)) return

	return data.map(row => {
		const result = { name: row[columnName]?.trim?.() || "" };
		for (let i = 1; i <= 12; i++) {
			const key = i.toString();
			if (key in row) {
				const value = row[key];
				result[`t${i}_${suffix}`] = value === "" ? null : Number(value);
			}
		}
		return result;
	});
}
export function mergeColumnsKHKD(dataSL, dataDLTH, dataDLCK) {
	// If dataSL is empty or null, use dataDLTH as the base data
	if (!Array.isArray(dataSL) || dataSL.length === 0) {
		if (Array.isArray(dataDLTH) && dataDLTH.length > 0) {
			dataSL = dataDLTH.map(item => ({
				name: item.name,
				...Object.fromEntries(
					Object.entries(item)
						.filter(([key]) => key.startsWith('t') && !key.includes('_'))
						.map(([key, value]) => [key, value])
				)
			}));
		} else {
			return [];
		}
	}

	const normalize = str => (str || '').toLowerCase().trim();

	const thMap = new Map();
	const ckMap = new Map();

	if (Array.isArray(dataDLTH) && dataDLTH.length > 0) {
		dataDLTH.forEach(item => thMap.set(normalize(item.name), item));
	}

	if (Array.isArray(dataDLCK) && dataDLCK.length > 0) {
		dataDLCK.forEach(item => ckMap.set(normalize(item.name), item));
	}

	const indexes = Array.from({ length: 12 }, (_, i) => i + 1);

	return dataSL.map(item => {
		const normName = normalize(item.name);
		const matchedTh = thMap.get(normName);
		const matchedCk = ckMap.get(normName);

		indexes.forEach(i => {
			const baseKey = `t${i}`;
			const thKey = `${baseKey}_th`;
			const ckKey = `${baseKey}_ck`;
			const clThKey = `${baseKey}_cl_th`;
			const ckClKey = `${baseKey}_ck_cl`;

			const baseValue = item[baseKey] ?? 0;
			const thValue = matchedTh?.[thKey] ?? 0;
			const ckValue = matchedCk?.[ckKey] ?? 0;

			item[thKey] = thValue;
			item[clThKey] = thValue - baseValue;

			item[ckKey] = ckValue;
			item[ckClKey] = thValue - ckValue;
		});

		return item;
	});
}

export function calculateDifferences(data) {
	if (!Array.isArray(data)) return

	for (const row of data) {
		for (let i = 1; i <= 12; i++) {
			const key = `t${i}`;
			const thKey = `${key}_th`;
			const ckKey = `${key}_ck`;
			const clThKey = `${key}_cl_th`;
			const clCkKey = `${key}_ck_cl`;

			const ti = row[key] ?? 0;
			const ti_th = row[thKey] ?? 0;
			const ti_ck = row[ckKey] ?? 0;

			row[clThKey] = ti_th - ti;
			row[clCkKey] = ti_th - ti_ck;
		}
	}
	return data;
}

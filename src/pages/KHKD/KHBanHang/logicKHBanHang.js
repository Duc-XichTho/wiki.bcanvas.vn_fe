export function convertAndSumKHBH(dataTT) {
	const resultMap = new Map();

	dataTT.forEach(item => {
		const key = `${item.name}__${item.khoanMuc}__${item.boPhan}`;
		const existing = resultMap.get(key) || {
			id: item.id,
			labelSoLuong: item.labelSoLuong,
			chuKy: item.chuKy,
			name: item.name,
			khoanMuc: item.khoanMuc,
			boPhan: item.boPhan,
		};

		for (let i = 1; i <= 12; i++) {
			const tKey = `t${i}`;
			const val = item.data?.tt?.[tKey] || 0;
			existing[tKey] = (existing[tKey] || 0) + val;
		}
		resultMap.set(key, existing);
	});

	return Array.from(resultMap.values());
}
export function percentageKHBH(dataTT) {
	const resultMap = new Map();

	dataTT.forEach(item => {
		const key = `${item.name}__${item.khoanMuc}__${item.boPhan}`;
		const existing = resultMap.get(key) || {
			id: item.id,
			labelSoLuong: item.labelSoLuong,
			chuKy: item.chuKy,
			name: item.name,
			khoanMuc: item.khoanMuc,
			boPhan: item.boPhan,
		};

		resultMap.set(key, existing);
	});

	return Array.from(resultMap.values());
}


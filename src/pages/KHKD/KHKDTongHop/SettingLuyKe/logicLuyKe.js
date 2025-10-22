export function getLuyKeConfig(name, luyKeDL) {
	const defaultConfig = { type: 'Tổng', weight: undefined };

	if (!luyKeDL || typeof luyKeDL !== 'object') {
		return defaultConfig;
	}

	const config = luyKeDL[name];

	if (!config) {
		return defaultConfig;
	}

	// Nếu type là "Trung bình có trọng số" nhưng không có weight thì cũng cần default weight
	if (config.type === 'Trung bình có trọng số' && !config.weight) {
		return { ...config, weight: undefined };
	}

	return config;
}

export function getLuyKeValue(params, settingMonth, luyKeDL, suffix = '') {
	const name = params.data.name;
	const config = getLuyKeConfig(name, luyKeDL);
	const months = settingMonth ?? [];

	// Lấy mảng giá trị với suffix
	const values = months.map(m => params.data[`t${m}${suffix}`] ?? 0);

	if (config.type === 'Trung bình') {
		const validValues = values.filter(v => v !== null && v !== undefined);
		const sum = validValues.reduce((acc, val) => acc + val, 0);
		return validValues.length > 0 ? sum / validValues.length : 0;
	}

	// Mặc định: Tổng
	return values.reduce((acc, val) => acc + val, 0);
}

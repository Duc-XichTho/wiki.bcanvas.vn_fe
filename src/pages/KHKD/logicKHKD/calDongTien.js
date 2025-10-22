
export function tinhDongTien(dauKy, settingDongTien, settingDongTienTC, settingDongTienDT) {
	if (!Array.isArray(settingDongTien)) {
		settingDongTien = [];
	}
	if (!Array.isArray(settingDongTienTC)) {
		settingDongTienTC = [];
	}
	if (!Array.isArray(settingDongTienDT)) {
		settingDongTienDT = [];
	}
	const rs = [];
	const soThang = 12; // Nếu muốn đủ 12 tháng, bạn có thể thay đổi số lượng phần tử trong các mảng settings tương ứng

	for (let i = 1; i <= soThang; i++) {
		const thangKey = 't' + i;

		let tongPhatSinh = 0;

		// Cộng phát sinh từ settingDongTien
		for (let item of settingDongTien) {
			tongPhatSinh += +item[thangKey] || 0;
		}
		// Cộng phát sinh từ settingDongTienTC
		for (let item of settingDongTienTC) {
			tongPhatSinh += +item[thangKey] || 0;
		}
		// Cộng phát sinh từ settingDongTienDT
		for (let item of settingDongTienDT) {
			tongPhatSinh += +item[thangKey] || 0;
		}

		rs.push({
			thang: i,
			dauKy: dauKy,
			cuoiKy: dauKy + tongPhatSinh,
		});

		dauKy = dauKy + tongPhatSinh; // cập nhật đầu kỳ cho tháng tiếp theo
	}

	return rs;
}

export function chuyenDoiBang(data) {
	const dauKyRow = { name: 'Đầu kỳ' };
	const chenhLechRow = { name: 'Thay đổi' };
	const cuoiKyRow = { name: 'Cuối kỳ' };

	data.forEach((item) => {
		const key = 't' + item.thang;
		dauKyRow[key] = item.dauKy;
		cuoiKyRow[key] = item.cuoiKy;
		chenhLechRow[key] = item.cuoiKy - item.dauKy; // Calculate the difference
	});

	return [dauKyRow, chenhLechRow, cuoiKyRow];
}

export const handleViewResult = (settingDongTien, dataKetQua) => {
	if (!settingDongTien) return []
	let inputData = JSON.parse(JSON.stringify(settingDongTien));
	if (!Array.isArray(inputData)) return []
	const result = (dataKetQua|| []).map((sourceItem) => {
		const inputItem = inputData.find(item => item.name === sourceItem.name);
		const row = { name: sourceItem.name };
		for (let i = 1; i <= 12; i++) {
			const val1 = Number(sourceItem[`t${i}`] || 0);
			const val2 = Number(inputItem?.[`t${i}`] || 0);
			row[`t${i}`] = val1 * val2 / 100;
		}
		return row;
	});
	return result;
};

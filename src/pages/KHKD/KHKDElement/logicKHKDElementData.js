export function convertKHKDElementData(data) {
	return data.map((item) => {
		const soLuong = item.data.find((d) => d.name === 'Số lượng') || {};
		return {
			id: item.id,
			name: item.name,
			boPhan: item.boPhan,
			labelSoLuong: item.labelSoLuong,
			theoDoi: item.theoDoi,
			isSum: item.isSum,
			...Object.fromEntries(
				Array.from({ length: 12 }, (_, i) => {
					const key = `T${i + 1}`;
					return [key, Number(soLuong[key] ?? 0)];
				})
			),
		};
	});
}

export function applyConvertedDataBack(originalData, updatedConvertedData) {
	return originalData.map((originalItem) => {
		const updatedItem = updatedConvertedData.find((d) => d.id === originalItem.id);
		if (!updatedItem) return originalItem;
		console.log(updatedItem);
		originalItem.labelSoLuong = updatedItem.labelSoLuong
		const newData = originalItem.data.map((entry) => {
			if (entry.name === 'Số lượng') {
				const newEntry = { ...entry };

				// Cập nhật giá trị tháng
				for (let i = 1; i <= 12; i++) {
					const key = `T${i}`;
					newEntry[key] = Number(updatedItem[key] ?? 0);
				}

				// ✅ Cập nhật labelSoLuong nếu có
				if (updatedItem.labelSoLuong !== undefined) {
					newEntry.label = updatedItem.labelSoLuong;
				}

				return newEntry;
			}
			return entry;
		});

		return {
			...originalItem,
			data: newData,
		};
	});
}

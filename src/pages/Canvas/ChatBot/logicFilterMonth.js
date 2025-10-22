export function filterArrayByMonth(array, month) {
	const months = month >= 2 ? [month - 1, month] : [month];

	const keysToKeep = ['name'];

	for (const m of months) {
		const prefix = `t${m}`;
		keysToKeep.push(
			`${prefix}`,
			`${prefix}_th`,
			`${prefix}_cl_th`,
			`${prefix}_ck`,
			`${prefix}_cl_ck`,
			`${prefix}_ck_cl`
		);
	}

	return array.map(obj => {
		const filtered = {};
		for (const key of keysToKeep) {
			if (obj.hasOwnProperty(key)) {
				filtered[key] = obj[key];
			}
		}
		return filtered;
	});
}

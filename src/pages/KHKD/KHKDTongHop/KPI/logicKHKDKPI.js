import { getKpiKQKDDataByIdKHKD } from '../../../../apis/kpiKQKDService.jsx';

export async function loadKPIData(dataDoLuong, idHopKH) {
	if (dataDoLuong.length > 0) {
		try {
			const data = await getKpiKQKDDataByIdKHKD(Number(idHopKH));
			let rowData = [];
			data.map(item => {
				const name = item.name;
				let rs = calculateFormulaResults(item.setting.processedFormula, item.setting.processedVariables, dataDoLuong);
				rs.name = name;
				rowData.push(rs);
			});
			return rowData
		} catch (error) {
			console.error('Error fetching KPI data:', error);
		}
	}
	return []
}

const calculateFormulaResults = (formula, variables, dataDoLuong) => {
	const variableMap = {};
	variables.forEach(variable => {
		if (variable.group) {
			const groupData = dataDoLuong.find(item => item.name === variable.group);
			if (groupData) {
				variableMap[variable.group] = groupData;
			}
		}
	});

	const results = {};

	for (let month = 1; month <= 12; month++) {
		const processFormula = (columnSuffix = '') => {
			let evaluationFormula = formula;

			// Sort keys by length to avoid partial replacements (e.g., "Chi phí" before "Chi phí nhân sự")
			const sortedGroups = Object.keys(variableMap).sort((a, b) => b.length - a.length);

			sortedGroups.forEach(groupName => {
				const data = variableMap[groupName];
				const value = data[`t${month}${columnSuffix}`] || 0;
				const escapedGroupName = groupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

				// Replace with parentheses to ensure correct unary operator handling
				evaluationFormula = evaluationFormula.replace(
					new RegExp(`(?<![\\w])${escapedGroupName}(?![\\w])`, 'g'),
					`(${value})`,
				);
			});

			evaluationFormula = evaluationFormula
				.replace(/[()]/g, match => match) // giữ nguyên dấu ngoặc
				.replace(/\s+/g, ''); // xóa khoảng trắng

			try {
				return eval(evaluationFormula);
			} catch (e) {
				return 0;
			}
		};

		results[`t${month}`] = processFormula('');
		results[`t${month}_th`] = processFormula('_th');
		results[`t${month}_cl_th`] = processFormula('_cl_th');
		results[`t${month}_ck`] = processFormula('_ck');
		results[`t${month}_ck_cl`] = processFormula('_ck_cl');
	}

	return results;
};

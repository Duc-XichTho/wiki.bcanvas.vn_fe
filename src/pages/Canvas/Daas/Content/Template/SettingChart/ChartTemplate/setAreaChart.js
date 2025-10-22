import { formatCurrency } from '../../../../Logic/SetupChart.js';

export function transformDataForArea(rows, selectedItem) {
	const xKey = selectedItem.v1;
	const yKey = selectedItem.v3;
	const groupKey = selectedItem.v2;

	const processedRows = rows.map(row => ({
		...row,
		[yKey]: row[yKey] !== null ? +row[yKey] : 0
	}));

	if (!groupKey) {
		const summedData = {};
		processedRows.forEach(row => {
			const xValue = row[xKey];
			const yValue = row[yKey];
			if (!summedData[xValue]) {
				summedData[xValue] = { [xKey]: xValue, value: 0 };
			}
			summedData[xValue].value += yValue;
		});
		return Object.values(summedData);
	}

	const uniqueGroups = [...new Set(processedRows.map(row => row[groupKey]))];
	const groupedData = {};

	processedRows.forEach(row => {
		const xValue = row[xKey];
		if (row[groupKey]) {
			const groupValue = row[groupKey].toLowerCase();
			const yValue = row[yKey];
			if (!groupedData[xValue]) {
				groupedData[xValue] = { [xKey]: xValue };
				uniqueGroups.forEach(g => {
					if (g) groupedData[xValue][g.toLowerCase()] = 0;
				});
			}
			groupedData[xValue][groupValue] += yValue;
		}
	});

	return Object.values(groupedData);
}

export function getUniqueGroupsForArea(data, field) {
	return [...new Set(data.map(item => item[field]))];
}

export function prepareAreaSeries(uniqueGroups, data, xKey, hasGroupKey = true, yName = '', fills = []) {
	if (!hasGroupKey) {
		return [{
			type: 'area',
			xKey,
			yKey: 'value',
			yName,
			fillOpacity: 0.5,
			stroke: fills[0],
			fill: fills[0],
			tooltip: {
				renderer: (params) => ({
					content: ` ${formatCurrency(params.datum[params.yKey])}`,
				}),
			},
			highlightStyle: {
				series: {
					dimOpacity: 0.2,
					strokeWidth: 3,
				}
			}
		}];
	}

	uniqueGroups = uniqueGroups.filter(Boolean);

	return uniqueGroups.map((group, index) => ({
		type: 'area',
		xKey,
		yKey: group.toLowerCase(),
		yName: group,
		fill: fills[index % fills.length],
		stroke: fills[index % fills.length],
		fillOpacity: 0.4,
		tooltip: {
			renderer: (params) => ({
				content: ` ${formatCurrency(params.datum[params.yKey])}`,
			}),
		},
		highlightStyle: {
			series: {
				dimOpacity: 0.2,
				strokeWidth: 3
			}
		}
	}));
}

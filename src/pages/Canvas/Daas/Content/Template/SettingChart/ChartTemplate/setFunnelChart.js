import { formatCurrency } from '../../../../Logic/SetupChart.js';

export const transformDataForFunnel = (rows, v2, v3) => {
	const result = {};
	rows.forEach(row => {
		const category = row[v2];
		const cost = parseFloat(row[v3]);
		if (!result[category]) {
			result[category] = 0;
		}
		result[category] += cost;
	});
	const funnelData = Object.keys(result).map(category => ({
		name: category,
		value: result[category],
	}));
	funnelData.sort((a, b) => b.value - a.value);

	return funnelData;
};

export function createFunnelChart(data, fills) {
	const coloredData = data.map((item, index) => ({
		...item,
		itemStyle: {
			color: fills[index] || '#ccc', // fallback nếu không có màu tương ứng
		},
	}));
	return {
		title: { text: '' },
		tooltip: { trigger: 'item', formatter: '{b}: {c}' },
		series: [
			{
				type: 'funnel',
				left: '10%',
				// orient: 'horizontal',
				top: 60,
				bottom: 60,
				fills,
				width: '80%',
				minSize: '30%',
				maxSize: '100%',
				sort: 'descending',
				label: { show: true, position: 'inside' },
				data: coloredData,
			},
		],
	}
}

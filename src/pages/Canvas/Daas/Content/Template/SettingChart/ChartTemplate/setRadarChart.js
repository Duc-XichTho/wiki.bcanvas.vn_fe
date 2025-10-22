export function createRadarChartData(rows, v1, v2, v3) {
	const grouped = {}; // { skill: { name: sum(score), ... } }

	rows.forEach(row => {
		const name = row[v1];
		const skill = row[v2];
		const score = parseFloat(row[v3]) || 0;

		if (!grouped[skill]) grouped[skill] = {};
		if (!grouped[skill][name]) grouped[skill][name] = 0;

		grouped[skill][name] += score;
	});

	const allNames = [...new Set(rows.map(row => row[v1]))];

	const data = Object.entries(grouped).map(([skill, scores]) => {
		const entry = { [v2]: skill };
		allNames.forEach(name => {
			entry[name] = scores[name] ?? 0;
		});
		return entry;
	});

	return data;
}


export function createRadarChartSeries(rows, v1, v2, fillColors = []) {
	const allNames = [...new Set(rows.map(row => row[v1]))];

	return allNames.map((name, index) => {
		const fill = fillColors[index % fillColors.length] || '#fff';
		return {
			type: 'radar-line', // hoặc 'radar-line' nếu muốn dạng line
			angleKey: v2,
			stroke: fill,
			radiusKey: name,
			radiusName: name,
			marker: { enabled: false},
		}
	});
}

export function createRadarChartOptions(rows, selectedItem, fillColors) {
	const { v1, v2, v3 } = selectedItem;

	const data = createRadarChartData(rows, v1, v2, v3);
	const series = createRadarChartSeries(rows, v1, v2, fillColors);

	return {
		theme: 'ag-vivid',
		data,
		series,
		axes: [
			{
				type: 'angle-category',
				position: 'angle',
				label: {
					color: '#262626',
					fontFamily: 'Reddit Sans, sans-serif'
				},
				gridLine: { enabled: true }
			},
			{
				type: 'radius-number',
				position: 'radius',
				label: {
					color: '#262626',
					fontFamily: 'Reddit Sans, sans-serif'
				},
				gridLine: { enabled: true },
				interval: {
					minSpacing: 10,
					maxSpacing: 100
				}
			}
		],
		legend: {
			position: 'bottom',
		},
		title: {
			text: '',
			color: '#262626',
			fontFamily: 'Reddit Sans, sans-serif'
		}
	};
}

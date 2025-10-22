export function transformBubbleData(rows, selectedItem) {
	const { v1: xKey, v2: yKey, v3: sizeKey, v4: labelKey, v5: groupKey } = selectedItem;

	return rows
		.filter(row => row[xKey] != null && row[yKey] != null && row[sizeKey] != null)
		.map(row => ({
			[xKey]: +row[xKey],
			[yKey]: +row[yKey],
			[sizeKey]: +row[sizeKey],
			[labelKey]: row[labelKey],
			...(groupKey ? { [groupKey]: row[groupKey] } : {}),
		}));
}

export function createBubbleChartOptions(data, selectedItem, fills) {
	const xKey = selectedItem.v1;
	const yKey = selectedItem.v2;
	const sizeKey = selectedItem.v3;
	const labelKey = selectedItem.v4;
	const groupKey = selectedItem.v5;

	const values = data.map(item => item[sizeKey]);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const uniqueGroups = [...new Set(data.map(d => d[groupKey]))];
	const defaultColors = ['#53C285', '#3BA0FF', '#FAAD14', '#F2637B'];
	const colorArray = fills || defaultColors;

	const series = uniqueGroups.map((group, idx) => ({
		type: "bubble",
		title: group,
		data: data.filter(d => d[groupKey] === group),
		xKey: xKey,
		xName: xKey,
		yKey: yKey,
		yName: yKey,
		sizeKey: sizeKey,
		sizeName: sizeKey,
		labelKey: labelKey,

		fill: colorArray[idx % colorArray.length], // Single color for fill
		stroke: colorArray[idx % colorArray.length], // Single color for stroke
		domain: [min/10 || 0, max/10 || 100],
	}));

	const options = {
		data,
		series: series,
		axes: [
			{ type: 'number', position: 'bottom', title: { text: xKey } },
			{ type: 'number', position: 'left', title: { text: yKey } }
		],
		legend: {
			enabled: !!groupKey,
			position: 'right',
			item: {
				marker: {
					strokeWidth: 10,
				},
			},
		},
	};

	if (groupKey) {
		options.seriesGrouping = {
			groupKey,
		};
	}

	return options;
}

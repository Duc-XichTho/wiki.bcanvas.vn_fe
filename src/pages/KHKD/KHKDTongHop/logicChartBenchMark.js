import { formatCurrency } from '../../../generalFunction/format.js';

export const generateChartOptions = (item, fills = []) => {
	if (!item) {
		console.warn('Item is undefined or null');
		return null;
	}

	const rsData = item.rs || {};
	const benmarks = Array.isArray(item.benmarks) ? item.benmarks : [];
	const months = Array.from({ length: 12 }, (_, i) => `t${i + 1}_th`);

	const data = months.map((monthKey, idx) => {
		const actual = rsData[monthKey] ?? undefined;

		// Lấy benchmark và loại bỏ giá trị null/undefined/0
		const b1Raw = benmarks[0]?.[monthKey];
		const b2Raw = benmarks[1]?.[monthKey];
		const b1 = (b1Raw === null || b1Raw === undefined || b1Raw === 0) ? NaN : b1Raw;
		const b2 = (b2Raw === null || b2Raw === undefined || b2Raw === 0) ? NaN : b2Raw;

		const allBenchmarks = benmarks
			.map(b => {
				const val = b[monthKey];
				return val === null || val === undefined || val === 0 ? NaN : val;
			})
			.filter(v => !isNaN(v));

		const low = allBenchmarks.length ? Math.min(...allBenchmarks) : undefined;
		const high = allBenchmarks.length ? Math.max(...allBenchmarks) : undefined;

		return {
			month: `${idx + 1}`,
			actual: actual === null ? undefined : actual,
			benchmark1: b1,
			benchmark2: b2,
			low,
			high,
		};
	});

	// Tìm min/max Y để tính padding
	const allYValues = data.flatMap(d => [d.actual, d.benchmark1, d.benchmark2, d.low, d.high])
		.filter(v => v !== undefined && !isNaN(v));

	const minY = allYValues.length ? Math.min(...allYValues) : 0;
	const maxY = allYValues.length ? Math.max(...allYValues) : 100;
	const range = maxY - minY;
	const paddedMinY = minY - range * 0.1;

	return {
		title: {
			text: item.name || 'KPI Chart',
			fontSize: 16,
		},
		data,
		series: [
			{
				type: 'range-area',
				xKey: 'month',
				id: 'benchmarkRange',
				yLowKey: 'benchmark1',
				yHighKey: 'benchmark2',
				fillOpacity: 0.25,
				strokeOpacity: 0,
				fill: fills[0] || '#1d88fd',
				tooltip: {
					renderer: ({ datum, yLowKey, yHighKey }) => ({
						content: `Từ ${formatCurrency(datum[yLowKey].toFixed(2))} đến ${formatCurrency(datum[yHighKey].toFixed(2))}`,
					}),
				},
			},
			{
				type: 'line',
				id: 'actualValue',
				xKey: 'month',
				yKey: 'actual',
				stroke: fills[1] || '#007bff',
				title: 'Giá trị thực tế',
				marker: {
					shape: 'circle',
					size: 4,
					fill: fills[1] || '#007bff',
					stroke: fills[1] || '#007bff',
				},
				tooltip: {
					renderer: ({ datum, yKey }) => ({
						content: `${formatCurrency(datum[yKey].toFixed(2))}`,
					}),
				},
			},
		],
		axes: [
			{
				type: 'category',
				position: 'bottom',
				title: { enabled: false },
			},
			{
				type: 'number',
				position: 'left',
				title: { enabled: false },
				label: {
					formatter: (params) => formatCurrency(params.value.toFixed(2)),
				},
			},
		],
		legend: {
			position: 'bottom',
			item: {
				label: {
					formatter: ({ seriesId }) => {
						if (seriesId === 'benchmarkRange') return 'Tham chiếu';
						if (seriesId === 'actualValue') return 'Giá trị thực tế';
						return seriesId;
					},
				},
			},
		},
		padding: {
			top: 20,
			bottom: 20,
		},
	};
};

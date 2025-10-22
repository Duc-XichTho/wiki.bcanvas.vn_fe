import vietnamGeoJson from '../../../../../../Geo/vn.json';
import { formatCurrency } from '../../../../Logic/SetupChart.js';

export function createMap(dataChart, fills = []) {
	return {
		title: {
			text: 'Bản Đồ Việt Nam',
		},
		topology: vietnamGeoJson,
		series: [
			{
				type: 'map-shape',
				showInLegend: false,
				data: vietnamGeoJson.features.map((feature) => {
					const name = feature.properties?.name;
					const matched = dataChart.find((p) => p.name === name);
					const value = matched ? matched.value : 0;
					return {
						id: name || feature.id,
						name: name,
						value: value,
						// colorValue: value > 0 ? 1 : 0,
						label: matched ? `${matched.value}` : '',
					};
				}),
				idKey: 'name',
				// colorKey: "colorValue",
				colorKey: 'value',
				colorRange: [
					"rgba(29,128,51, 0)",
					"rgba(29,128,51,0.9)",
				],
				fillOpacity: 0.8,
				labelKey: 'label',
				label: {
					enabled: true,
					color: '#989898',
					fontSize: 10,
					fontWeight: 'bold',
				},
				tooltip: {
					renderer: ({ datum }) => {
						return {
							content: `${datum.name}: ${formatCurrency(datum.value)}`,
						};
					},
				},
				highlightStyle: {
					item: {
						fill: '#00fff7',
						stroke: '#969696',
						strokeWidth: 1,
					},
				},
				stroke: "#9f9f9f", // Add stroke color for provinces
				strokeWidth: 0.5, // Set stroke width
			},
		],
		legend: {
			enabled: false,
		},
	};
}

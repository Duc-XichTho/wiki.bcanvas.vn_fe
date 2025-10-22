	export const formatCurrency = (value) => {
	if (typeof value !== 'number') {
		value = parseFloat(value);
	}
	if (isNaN(value) || value === 0) return '-';
	return value.toLocaleString('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
};

// Hàm format số dạng 1000k, 1.5M
export const formatNumberWithK = (value) => {
	if (typeof value !== 'number') {
		value = parseFloat(value);
	}
	if (isNaN(value) || value === 0) return '-';

	if (value >= 1000000) {
		return (value / 1000000).toFixed(1) + 'M';
	} else if (value >= 1000) {
		return (value / 1000).toFixed(1) + 'k';
	}
	return value.toFixed(2);
};

// Compute a "nice" step based on range and desired tick count (1–2–5 × 10^n)
function computeNiceStep(range, desiredCount = 6) {
    if (!isFinite(range) || range <= 0) return undefined;
    const rough = range / Math.max(1, desiredCount - 1);
    const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
    const r = rough / pow10;
    const nice = r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10;
    return nice * pow10;
}

export function createSeries(xKey, yKey, yName, type, strokeColor, stack = false, marker = false, dashed = false, isChiSo) {
	const seriesType = type === 'line_marker' ? 'line' : type;
	const seriesConfig = {
		type: seriesType,
		xKey,
		yKey,
		yName,
		tooltip: {
			renderer: (params) => {
				const formattedValue = params.datum[`${params.yKey}_formatted`] || formatNumberWithK(params.datum[params.yKey]);
				return {
					content: `${params.datum[params.xKey]}: ${formattedValue}`,
				};
			},
		},
		highlightStyle: {
			series: {
				dimOpacity: 0.2,
				strokeWidth: 4,
			},
		},
		stacked: stack,
	};

	// Apply color based on chart type
	if (seriesType === 'bar' || seriesType === 'area') {
		seriesConfig.fill = strokeColor;
	}
	if (seriesType === 'area') {
		if (isChiSo) {
			seriesConfig.fill = {
				type: 'gradient',
				colorStops: [
					{ color: '#fff', stop: 0 },
					{ color: strokeColor, stop: 1 },
				],
			};
			seriesConfig.strokeWidth = 1;
			seriesConfig.stroke = strokeColor;
			seriesConfig.marker = {
				// shape: 'square',
				size: 5,
				fill: strokeColor,
			};
		} else {
			seriesConfig.fill = strokeColor;
		}
		seriesConfig.interpolation = {
			type: 'smooth',
		};
	} else {
		// For line charts, use stroke property
		seriesConfig.stroke = strokeColor;
		seriesConfig.marker = {
			enabled: marker || type === 'line_marker',
			fill: strokeColor,
		};
		// Only enable smooth interpolation for normal 'line' type
		if (type === 'line') {
			seriesConfig.interpolation = {
				type: 'smooth',
			};
		}
		seriesConfig.lineDash = dashed ? [6, 6] : undefined;
	}
	return seriesConfig;
}

export function createSeriesPie(angleKey, calloutLabelKey, fills = null) {
	return {
		type: 'pie',
		angleKey,
		calloutLabelKey,
		sectorLabelKey: angleKey,
		fills: fills, // Add fills property for custom colors
		sectorLabel: {
			color: 'white',
			fontWeight: 'bold',
		},
		calloutLabel: {
			enabled: true,
			color: '#262626',
			fontFamily: 'Roboto Flex, sans-serif',
		},
		highlightStyle: {
			series: {
				dimOpacity: 0.2,
				strokeWidth: 4,
			},
		},
	};
}

export function createAxes(customY) {
	return [{
		type: 'category',
		position: 'bottom',
		label: {
			color: '#262626',
			fontFamily: 'Reddit Sans, sans-serif',
			formatter: (params) => {
				return params.value == 0 ? 'Đầu kì' : params.value;
			},
		},
		gridLine: {
			enabled: true,
		},
	},
		{
			type: 'number',
			position: 'left',
			// Ensure small values (< 1) remain visible and readable
			nice: true,
			label: {
				formatter: (params) => {
					const v = params.value;
					if (Math.abs(v) < 1e-9) return '0';
					if (Math.abs(v) < 1) return Number(v).toFixed(3);
					// Show decimals for small magnitudes to avoid all labels becoming '1'
					if (Math.abs(v) < 1000) return Number(v).toFixed(2);
					return Math.abs(v) > 1000000 ? (formatCurrency((v / 1000000).toFixed(0)) + 'M') : formatCurrency(v);
				},
				color: '#262626',
				fontFamily: 'Reddit Sans, sans-serif',
			},
			gridLine: {
				enabled: true,
			},
			...customY,
		},
	];
}

export function createSectionData(title, data, series, chartTitle, customY = {}, legend = {
	position: 'bottom',
}, select) {
	// Determine if any series data contains negative values; if not, default min to 0
	const yKeys = Array.isArray(series) ? series.map(s => s.yKey).filter(Boolean) : [];
	const stackedKeys = Array.isArray(series) ? series.filter(s => s.stacked && s.yKey).map(s => s.yKey) : [];
	const unstackedKeys = Array.isArray(series) ? series.filter(s => !s.stacked && s.yKey).map(s => s.yKey) : [];
	let hasNegative = false;
	let minVal = Number.POSITIVE_INFINITY;
	let maxVal = Number.NEGATIVE_INFINITY;
	if (Array.isArray(data) && data.length > 0 && yKeys.length > 0) {
		for (let i = 0; i < data.length; i++) {
			let stackedPositiveSum = 0;
			let stackedNegativeSum = 0;
			// Handle stacked series by summing per datum
			for (let k = 0; k < stackedKeys.length; k++) {
				const raw = data[i][stackedKeys[k]];
				const num = typeof raw === 'number' ? raw : parseFloat(raw);
				if (!isNaN(num)) {
					if (num >= 0) stackedPositiveSum += num; else stackedNegativeSum += num;
				}
			}
			// Track stacked sums
			if (stackedPositiveSum > 0) {
				if (stackedPositiveSum > maxVal) maxVal = stackedPositiveSum;
			}
			if (stackedNegativeSum < 0) {
				if (stackedNegativeSum < minVal) minVal = stackedNegativeSum;
				hasNegative = true;
			}	
			// Handle unstacked series individually
			for (let k = 0; k < unstackedKeys.length; k++) {
				const raw = data[i][unstackedKeys[k]];
				const num = typeof raw === 'number' ? raw : parseFloat(raw);
				if (!isNaN(num)) {
					if (num < minVal) minVal = num;
					if (num > maxVal) maxVal = num;
					if (num < 0) hasNegative = true;
				}
			}
		}
	}
	const computedY = { ...customY };


	// Keep only official interval spacing/step/values; set a reasonable default minSpacing
	if (!computedY.interval) computedY.interval = {};
	if (computedY.interval.minSpacing === undefined) computedY.interval.minSpacing = 32;

	// If no explicit step/values provided, compute a nice step that works for tiny to huge ranges
	if (computedY.interval.step === undefined && computedY.interval.values === undefined && isFinite(minVal) && isFinite(maxVal)) {
		let range = maxVal - minVal;
		if (range === 0) {
			const pad = minVal === 0 ? 1 : Math.abs(minVal) * 0.1;
			minVal -= pad;
			maxVal += pad;
			range = maxVal - minVal;
		}
		// If data crosses zero, prefer a symmetric domain around 0
		const crossesZero = minVal < 0 && maxVal > 0;
		const baseRange = crossesZero ? (Math.max(Math.abs(minVal), Math.abs(maxVal)) * 2) : range;
		let step = computeNiceStep(baseRange, 5);
		if (step) {
			// Align domain to step; apply multiplier padding and symmetry rules
			const multiplier = (customY.maxMultiplier && customY.maxMultiplier > 0) ? customY.maxMultiplier : 1.2;
			let makeAligned = (st) => {
				let aMin;
				let aMax;
				if (crossesZero) {
					const targetAbs = Math.max(Math.abs(minVal), Math.abs(maxVal)) * multiplier;
					const steps = Math.ceil(targetAbs / st);
					aMin = -steps * st;
					aMax = steps * st;
				} else if (!hasNegative && minVal >= 0) {
					// Only positive values: start at 0, extend to multiplier*max
					aMin = 0;
					aMax = Math.ceil((maxVal * multiplier) / st) * st;
				} else {
					// Only negative values: end at 0, extend min to multiplier*min
					aMax = 0;
					aMin = Math.floor((minVal * multiplier) / st) * st;
				}
				return [aMin, aMax];
			};
			let [alignedMin, alignedMax] = makeAligned(step);
			// Increase step until number of intervals <= 5
			let guard = 0;
			while (((alignedMax - alignedMin) / step) > 5 && guard < 6) {
				step *= 2;
				[alignedMin, alignedMax] = makeAligned(step);
				guard++;
			}
			computedY.interval.step = step;
			computedY.min = alignedMin;
			computedY.max = alignedMax;
		}
	}

	// Domain padding for tiny/flat ranges to ensure visibility
	if (isFinite(minVal) && isFinite(maxVal)) {
		const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal));
		const pad = absMax === 0 ? 1 : absMax * 0.05;
		if (computedY.min === undefined) computedY.min = minVal - pad;
		if (computedY.max === undefined) computedY.max = maxVal + pad;
	}

	// Do not auto-generate interval values anymore; let AG Charts handle unless caller provides step/values.

	return {
		theme: 'ag-vivid',
		data,
		series,
		axes: createAxes(computedY),
		title: title == '' ? null : {
			text: ' ',
			color: '#262626',
			fontFamily: 'Reddit Sans, sans-serif',
		},
		legend: {
			...legend,
			label: {
				color: '#262626',
				fontFamily: 'Reddit Sans, sans-serif',
			},
		},
	};
}

export function createNormalisedBar(xKey, yKey, yName, fill = '#00FF00') {
	return {
		type: 'bar',
		xKey,
		yKey,
		yName: yName.includes('-') ? yName.split('-')[1] : yName,
		normalizedTo: 100,
		stacked: true,
		fill,
		tooltip: {
			renderer: (params) => {
				const value = params.datum[params.yKey];
				return {
					content: `${value.toFixed(1)}%`,
				};
			},
		},
		stroke: '#fff',
		strokeWidth: 0.3,
	};
}


export function createNormalisedBarProductGroup(listGroup) {
	let rs = [];
	listGroup.sort();
	listGroup.map(e => {
		rs.push(createNormalisedBar('month', e?.toLowerCase(), e));
	});
	return rs;
}

export function createSectionDataLinearGauge(value, min, max, targetValue, targetTitle, title) {
	return {
		type: 'linear-gauge',
		direction: 'horizontal',
		value,
		scale: {
			min,
			max,
		},
		targets: [{
			value: targetValue,
			text: targetTitle,
		}],
		title: {
			text: title,
			color: '#262626',
			fontFamily: 'Roboto Flex, sans-serif',
		},
		bar: {
			fill: '#4cd137',
		},
	};
}

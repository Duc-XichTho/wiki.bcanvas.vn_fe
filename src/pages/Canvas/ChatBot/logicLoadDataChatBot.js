import { getTemplateByFileNoteId, getTemplateRow } from '../../../apis/templateSettingService.jsx';
import { loadAndMergeData } from '../Daas/Content/Template/SettingCombine/logicCombine.js';
import {
	filterRows,
	transformData,
	transformData2,
	transformDataForBarChart,
	transformDataForBarChart2,
	transformDataForPieChart,
	transformDataForWaterfallChart,
} from '../Daas/Content/Template/SettingChart/ChartTemplate/setChartTemplate.js';
import { getKpiCalculatorById } from '../../../apis/kpiCalculatorService.jsx';
import { getAllVar } from '../../../generalFunction/calculateDataBaoCao/getAllDataBaoCao.js';
import { getAllSoKeToan } from '../../../apisKTQT/soketoanService.jsx';
import { getKpi2CalculatorById } from '../../../apis/kpi2CalculatorService.jsx';
import { evaluate } from 'mathjs';
import { transformBubbleData } from '../Daas/Content/Template/SettingChart/ChartTemplate/setBubbleChart.js';
import { transformDataForArea } from '../Daas/Content/Template/SettingChart/ChartTemplate/setAreaChart.js';
import { transformDataForFunnel } from '../Daas/Content/Template/SettingChart/ChartTemplate/setFunnelChart.js';
import { createRadarChartOptions } from '../Daas/Content/Template/SettingChart/ChartTemplate/setRadarChart.js';

export async function loadDataChartTemp(selectedItem) {
	let rows = [];
	let options = [];
	let dataFinal = [];
	const templateInfo = await getTemplateByFileNoteId(selectedItem.id_filenote);
	let template = templateInfo[0];
	if (template && template.isCombine) {
		rows = await loadAndMergeData(template);
	} else {
		const dataResponse = await getTemplateRow(selectedItem.id_template);
		const data = dataResponse.rows || [];
		rows = data.map((row) => ({
			...row.data,
			rowId: row.id,
		}));
	}
	if (selectedItem.conditions && selectedItem.conditions.length > 0) {
		rows = filterRows(rows, selectedItem.conditions);
	}
	if (selectedItem.type === 'line') {
		dataFinal = transformData2(rows, selectedItem);
	}
	if (selectedItem.type === 'bar') {
		dataFinal = transformDataForBarChart2(rows, selectedItem, selectedItem.isSort);
	}
	if (selectedItem.type === 'horizontalBar') {
		dataFinal = transformDataForBarChart(rows, selectedItem);
	}
	if (selectedItem.type === 'waterfall') {
		dataFinal = transformDataForWaterfallChart(rows, selectedItem);
	}
	if (selectedItem.type === 'combine') {
		const barData = transformDataForBarChart2(rows, selectedItem, selectedItem.isSort);
		let selectedLineChart = Object.assign({}, selectedItem);
		selectedLineChart.v2 = selectedItem.v4;
		selectedLineChart.v3 = selectedItem.v5;
		const data2 = transformData2(rows, selectedLineChart);
		dataFinal = [...barData, ...data2];
	}
	if (selectedItem.type === 'heatmap') {
		dataFinal = transformData(rows, selectedItem);
	}
	if (selectedItem.type === 'stackedBar') {
		dataFinal = transformDataForBarChart(rows, selectedItem);
	}
	if (selectedItem.type === 'pie') {
		dataFinal = transformDataForPieChart(rows, selectedItem);
	}
	if (selectedItem.type === 'map') {
		dataFinal = transformDataForPieChart(rows, selectedItem);
	}
	if (selectedItem.type === 'bubble') {
		dataFinal = transformBubbleData(rows, selectedItem);
	}
	if (selectedItem.type === 'area') {
		dataFinal =transformDataForArea(rows, selectedItem);
	}
	if (selectedItem.type === 'funnel') {
		dataFinal = transformDataForFunnel(rows, selectedItem.v2, selectedItem.v3);
	}
	if (selectedItem.type === 'radar') {
		let chart = createRadarChartOptions(rows, selectedItem)
		dataFinal = chart.data;
	}
	return dataFinal;
}


const convertPeriodData = (kpiData, targetPeriod) => {
	const { period: sourcePeriod, tableData } = kpiData;

	if (sourcePeriod == targetPeriod) {
		return tableData;
	}

	const periodConversions = {
		weekToDay: (data) => {
			const result = [];

			data.forEach((item) => {
				const matches = item.date.match(/Tuần (\d+)\/(\d+)/);
				if (!matches) return;

				const weekNum = parseInt(matches[1]);
				const year = parseInt(matches[2]);

				const firstDayOfWeek = getFirstDayOfWeek(weekNum, year);

				const dailyValue = item.value / 7;

				for (let i = 0; i < 7; i++) {
					const currentDate = new Date(firstDayOfWeek);
					currentDate.setDate(firstDayOfWeek.getDate() + i);

					result.push({
						date: formatDate(currentDate),
						value: dailyValue,
					});
				}
			});

			return result;
		},

		monthToDay: (data) => {
			const result = [];

			data.forEach((item) => {
				const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
				if (!matches) return;

				const monthNum = parseInt(matches[1]);
				const year = parseInt(matches[2]);

				const daysInMonth = getDaysInMonth(monthNum - 1, year);

				const dailyValue = item.value / daysInMonth;

				for (let i = 0; i < daysInMonth; i++) {
					const currentDate = new Date(year, monthNum - 1, i + 1);

					result.push({
						date: formatDate(currentDate),
						value: dailyValue,
					});
				}
			});

			return result;
		},

		monthToWeek: (data) => {
			const result = [];

			data.forEach((item) => {
				const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
				if (!matches) return;

				const monthNum = parseInt(matches[1]);
				const year = parseInt(matches[2]);

				const weeksInMonth = 4;
				const weeklyValue = item.value / weeksInMonth;

				const weekNumbers = getWeeksInMonth(monthNum - 1, year);

				weekNumbers.forEach((weekNum) => {
					result.push({
						date: `Tuần ${weekNum}/${year}`,
						value: weeklyValue,
					});
				});
			});

			return result;
		},

		dayToWeek: (data) => {
			const weekMap = new Map();

			data.forEach((item) => {
				const [day, month, year] = item.date.split('/').map(Number);

				const weekNum = getWeekNumber(new Date(year, month - 1, day));
				const weekKey = `Tuần ${weekNum}/${year}`;

				if (weekMap.has(weekKey)) {
					weekMap.set(weekKey, weekMap.get(weekKey) + item.value);
				} else {
					weekMap.set(weekKey, item.value);
				}
			});

			return Array.from(weekMap.entries()).map(([date, value]) => ({
				date,
				value,
			}));
		},

		dayToMonth: (data) => {
			const monthMap = new Map();

			data.forEach((item) => {
				const [day, month, year] = item.date.split('/').map(Number);
				const monthKey = `Tháng ${month}/${year}`;

				if (monthMap.has(monthKey)) {
					monthMap.set(monthKey, monthMap.get(monthKey) + item.value);
				} else {
					monthMap.set(monthKey, item.value);
				}
			});

			return Array.from(monthMap.entries()).map(([date, value]) => ({
				date,
				value,
			}));
		},

		weekToMonth: (data) => {
			const monthMap = new Map();

			data.forEach((item) => {
				const matches = item.date.match(/Tuần (\d+)\/(\d+)/);
				if (!matches) return;

				const weekNum = parseInt(matches[1]);
				const year = parseInt(matches[2]);

				const monthNum = Math.ceil(weekNum / 4);
				const monthKey = `Tháng ${monthNum}/${year}`;

				if (monthMap.has(monthKey)) {
					monthMap.set(monthKey, monthMap.get(monthKey) + item.value);
				} else {
					monthMap.set(monthKey, item.value);
				}
			});

			return Array.from(monthMap.entries()).map(([date, value]) => ({
				date,
				value,
			}));
		},
	};

	function formatDate(date) {
		return `${String(date.getDate()).padStart(2, '0')}/${String(
			date.getMonth() + 1,
		).padStart(2, '0')}/${date.getFullYear()}`;
	}

	function getDaysInMonth(month, year) {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstDayOfWeek(weekNum, year) {
		const firstDayOfYear = new Date(year, 0, 1);
		const daysToAdd = (weekNum - 1) * 7;
		const firstDayOfWeek = new Date(firstDayOfYear);
		firstDayOfWeek.setDate(firstDayOfYear.getDate() + daysToAdd);
		return firstDayOfWeek;
	}

	function getWeekNumber(date) {
		const d = new Date(
			Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
		);
		const dayNum = d.getUTCDay() || 7;
		d.setUTCDate(d.getUTCDate() + 4 - dayNum);
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
	}

	function getWeeksInMonth(month, year) {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);

		const firstWeek = getWeekNumber(firstDay);
		const lastWeek = getWeekNumber(lastDay);

		const weekNumbers = [];
		for (let week = firstWeek; week <= lastWeek; week++) {
			weekNumbers.push(week);
		}

		return weekNumbers;
	}

	const conversionKey = `${sourcePeriod}To${
		targetPeriod.charAt(0).toUpperCase() + targetPeriod.slice(1)
	}`;

	if (periodConversions[conversionKey]) {
		return periodConversions[conversionKey](tableData);
	} else {
		console.error(
			`Conversion from ${sourcePeriod} to ${targetPeriod} is not supported`,
		);
		return tableData;
	}
};

const convertVariableData = (
	varData,
	targetPeriod,
	year = new Date().getFullYear(),
) => {
	// First, transform the t1-t12 format to a standard monthly format
	const monthlyData = [];

	for (let i = 1; i <= 12; i++) {
		const key = `t${i}`;
		if (varData[key] !== undefined) {
			monthlyData.push({
				date: `Tháng ${i}/${year}`,
				value: varData[key],
			});
		}
	}

	// Now use the same conversion logic as before, but starting from 'month' as the source period
	if (targetPeriod === 'month') {
		return monthlyData;
	} else if (targetPeriod === 'week') {
		return monthToWeek(monthlyData, year);
	} else if (targetPeriod === 'day') {
		return monthToDay(monthlyData);
	} else {
		console.error(`Conversion to ${targetPeriod} is not supported`);
		return monthlyData;
	}
};

function monthToDay(data) {
	const result = [];

	data.forEach((item) => {
		// Parse the month data (format: "Tháng 3/2024")
		const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
		if (!matches) return;

		const monthNum = parseInt(matches[1]);
		const year = parseInt(matches[2]);

		// Get number of days in the month
		const daysInMonth = getDaysInMonth(monthNum - 1, year);

		// Spread the value over all days in the month
		const dailyValue = item.value / daysInMonth;

		for (let i = 0; i < daysInMonth; i++) {
			const currentDate = new Date(year, monthNum - 1, i + 1);

			result.push({
				date: formatDate(currentDate),
				value: dailyValue,
			});
		}
	});

	return result;
}

// Month to Week conversion
function monthToWeek(data, year) {
	const result = [];

	data.forEach((item) => {
		// Parse the month data
		const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
		if (!matches) return;

		const monthNum = parseInt(matches[1]);
		const year = parseInt(matches[2]);

		// Default to 4 weeks per month
		const weeksInMonth = 4;
		const weeklyValue = item.value / weeksInMonth;

		// Get the weeks that overlap with this month
		const weekNumbers = getWeeksInMonth(monthNum - 1, year);

		weekNumbers.forEach((weekNum) => {
			result.push({
				date: `Tuần ${weekNum}/${year}`,
				value: weeklyValue,
			});
		});
	});

	return result;
}

// Helper functions
function formatDate(date) {
	return `${String(date.getDate()).padStart(2, '0')}/${String(
		date.getMonth() + 1,
	).padStart(2, '0')}/${date.getFullYear()}`;
}

function getDaysInMonth(month, year) {
	return new Date(year, month + 1, 0).getDate();
}

function getWeeksInMonth(month, year) {
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);

	const firstWeek = getWeekNumber(firstDay);
	const lastWeek = getWeekNumber(lastDay);

	const weekNumbers = [];
	for (let week = firstWeek; week <= lastWeek; week++) {
		weekNumbers.push(week);
	}

	return weekNumbers;
}

function getWeekNumber(date) {
	// ISO week date calculation
	const d = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	);
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}


export async function loadKPIData(selectedKpiId, listCompany, listYear) {
	let varList = await getAllVar(listCompany, listYear, getAllSoKeToan);
	let selectedKpi = await getKpi2CalculatorById(selectedKpiId);
	console.log(selectedKpi);
	let kpiList = Array.isArray(selectedKpi.kpiList)
		? selectedKpi.kpiList
		: [];
	varList = Array.isArray(selectedKpi.varList)
		? selectedKpi.varList
		: [];
	const rawDataByVariable = {};
	const currentYear = new Date().getFullYear();
	const selectedItems = { kpiList, varList };

	let period = selectedKpi.period || 'month';
	let formula = '';
	let variables = {};
	if (selectedKpi.calc) {
		const calcData = JSON.parse(selectedKpi.calc);
		formula = calcData.formula;
		variables = calcData.variables;
	}
	for (const kpi of selectedItems.kpiList) {
		const kpiData = await getKpiCalculatorById(kpi);
		if (kpiData.period && kpiData.tableData) {
			const convertedData = convertPeriodData(kpiData, period);
			const variableKey = Object.keys(variables).find(
				(key) => variables[key].type === 'kpi' && variables[key].id === kpi,
			);
			if (variableKey) rawDataByVariable[variableKey] = convertedData;
		}
	}

	for (const v of selectedItems.varList) {
		const varData = varList.find((va) => va.code == v);
		if (varData) {
			let convertedData;
			if (varData.t1 !== undefined || varData.t2 !== undefined) {
				convertedData = convertVariableData(varData, period, currentYear);
			} else if (varData.period && varData.tableData) {
				convertedData = convertPeriodData(varData, period);
			}

			if (convertedData) {
				const variableKey = Object.keys(variables).find(
					(key) => variables[key].type === 'var' && variables[key].id === v,
				);
				if (variableKey) rawDataByVariable[variableKey] = convertedData;
			}
		}
	}

	const allDates = new Set();
	Object.values(rawDataByVariable).forEach((dataArray) =>
		dataArray.forEach((item) => allDates.add(item.date)),
	);

	const sortedDates = Array.from(allDates).sort((a, b) => {
		if (a.startsWith('Tuần') && b.startsWith('Tuần')) {
			const [aWeek, aYear] = a.replace('Tuần ', '').split('/').map(Number);
			const [bWeek, bYear] = b.replace('Tuần ', '').split('/').map(Number);
			return aYear !== bYear ? aYear - bYear : aWeek - bWeek;
		} else if (a.startsWith('Tháng') && b.startsWith('Tháng')) {
			const [aMonth, aYear] = a.replace('Tháng ', '').split('/').map(Number);
			const [bMonth, bYear] = b.replace('Tháng ', '').split('/').map(Number);
			return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
		} else if (
			a.includes('/') &&
			b.includes('/') &&
			a.split('/').length === 3 &&
			b.split('/').length === 3
		) {
			const [aDay, aMonth, aYear] = a.split('/').map(Number);
			const [bDay, bMonth, bYear] = b.split('/').map(Number);
			if (aYear !== bYear) return aYear - bYear;
			if (aMonth !== bMonth) return aMonth - bMonth;
			return aDay - bDay;
		}
		return a.localeCompare(b);
	});
	const result = sortedDates.map((date) => {
		const row = { date };
		Object.keys(variables).forEach((varKey) => {
			if (rawDataByVariable[varKey]) {
				const dataPoint = rawDataByVariable[varKey].find(
					(item) => item.date === date,
				);
				row[varKey] = dataPoint ? dataPoint.value : 0;
			} else {
				row[varKey] = 0;
			}
		});
		row.value = evaluate(formula, row);
		return row;
	});

	let benchmarkData = {};
	if (selectedKpi.benchmark) {
		benchmarkData = selectedKpi.benchmark;
	}

	const rowDataForDisplay = [];

	if (selectedKpi.benchmark1_name && selectedKpi.benchmark1_name.trim() !== '') {
		rowDataForDisplay.push({
			benchmark: 'benchmark1',
			...sortedDates.reduce((acc, date) => {
				acc[date] = benchmarkData[date]?.benchmark1 || null;
				return acc;
			}, {}),
		});
	}

	if (selectedKpi.benchmark2_name && selectedKpi.benchmark2_name.trim() !== '') {
		rowDataForDisplay.push({
			benchmark: 'benchmark2',
			...sortedDates.reduce((acc, date) => {
				acc[date] = benchmarkData[date]?.benchmark2 || null;
				return acc;
			}, {}),
		});
	}

	let chartData = result.map(item => ({
		date: item.date,
		value: item.value || NaN,
	}));
	chartData = chartData.map(item => {
		const date = item.date;
		return {
			...item,
			benchmark1: parseInt(selectedKpi.benchmark[date]?.benchmark1) || NaN,
			benchmark2: parseInt(selectedKpi.benchmark[date]?.benchmark2) || NaN,
		};
	});
	return chartData;
}


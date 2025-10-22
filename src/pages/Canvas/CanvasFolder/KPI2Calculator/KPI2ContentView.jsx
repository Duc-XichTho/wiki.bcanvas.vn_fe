import React, { useContext, useEffect, useState } from 'react';
import styles from './KPICalculator2.module.css';
import { evaluate } from 'mathjs';
// API
import { getAllKpiCalculator, getKpiCalculatorById } from '../../../../apis/kpiCalculatorService';
import { AgCharts } from 'ag-charts-react';
import { createSectionData, createSeries } from '../../Daas/Logic/SetupChart.js';
import { MyContext } from '../../../../MyContext.jsx';
import { getKpi2CalculatorById } from '../../../../apis/kpi2CalculatorService.jsx';
import { getAllUserClass } from '../../../../apis/userClassService.jsx';
import { fetchDataColor } from '../../Daas/Content/Template/SettingChart/ChartTemplate/setChartTemplate.js';
import { getAllTemplateTables } from '../../../../apis/templateSettingService.jsx';
import { useParams } from 'react-router-dom';
import {
	getAllFileNotePad,
	getFileNotePadByIdController,
	updateFileNotePad,
} from '../../../../apis/fileNotePadService.jsx';
import { IconUser } from '../../../../icon/IconSVG.js';
import { Button, Checkbox, Modal, Table } from 'antd';

const KPI2ContentView = ({ selectedKpiId, showChart, compact = false }) => {
	let { listCompany, listYear, listUC_CANVAS, currentUser } = useContext(MyContext);
	const [selectedItems, setSelectedItems] = useState({
		kpiList: [],
		varList: [],
	});
	const [period, setPeriod] = useState('day');
	const [varList, setVarList] = useState([]);
	const [selectedKpi, setSelectedKpi] = useState([]);
	const [formula, setFormula] = useState('');
	const [variables, setVariables] = useState({});
	const [tableData, setTableData] = useState([]);
	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [isView, setIsView] = useState(false);
	const [listUC, setListUC] = useState([]);
	const [selectedUC, setSelectedUC] = useState([]);
	const [selectedFileNote, setSelectedFileNote] = useState(null);
	const { id } = useParams();
	const [openSetupUC, setOpenSetupUC] = useState(false);
	const [validationError, setValidationError] = useState(null);

	useEffect(() => {
		getAllUserClass().then((data) => {
			setListUC(data.filter(e => e.module == 'CANVAS'));
		});
	}, []);

	const fetchData = async () => {
		setLoading(true);
		setValidationError(null);
		let isView = false;
		let detectedValidationError = null;

		try {
			const [kpi, listKpiGoc, listTable, listFileNote, allFileNotes] = await Promise.all([
				getKpi2CalculatorById(selectedKpiId),
				getAllKpiCalculator(),
				getAllTemplateTables(),
				getAllFileNotePad(),
				getAllFileNotePad(),
			]).catch(fetchError => {
				detectedValidationError = 'Lỗi khi tải dữ liệu cần thiết.';
				throw fetchError;
			});
			setSelectedKpi(kpi);

			if (!kpi) {
				detectedValidationError = 'Không tìm thấy dữ liệu KPI đã chọn.';
			} else {
				const kpiList = Array.isArray(kpi.kpiList) ? kpi.kpiList : [];
				const missingKpis = kpiList.filter(kpiId =>
					!listKpiGoc.some(kg => kg.id == kpiId),
				);
				if (missingKpis.length > 0) {
					detectedValidationError = `Một số biến số kinh doanh đã bị xóa hoặc không tồn tại: ${missingKpis.join(', ')}`;
				}
				let validKpis = [];
				if (!detectedValidationError) {
					validKpis = kpiList
						.map(kpiId => listKpiGoc.find(kg => kg.id == kpiId))
						.filter(Boolean);

					const kpisWithInvalidDataSource = validKpis
						.filter(vk => !listTable.some(table => table.id == vk.dataSource));

					if (kpisWithInvalidDataSource.length > 0) {
						const invalidKpisNames = kpisWithInvalidDataSource.map(vk => vk.tableVersion || `ID ${vk.id}`).join(', ');
						detectedValidationError = `Nguồn dữ liệu (Table) không hợp lệ hoặc đã bị xóa cho biến số: ${invalidKpisNames}`;
					}
				}
				if (!detectedValidationError && validKpis.length > 0) {
					const kpisWithInvalidFileNote = validKpis
						.filter(vk => {
							const relatedTable = listTable.find(table => table.id == vk.dataSource);
							return !relatedTable || !listFileNote.some(note => note.id == relatedTable.fileNote_id);
						});

					if (kpisWithInvalidFileNote.length > 0) {
						const invalidKpisNames = kpisWithInvalidFileNote.map(vk => vk.tableVersion || `ID ${vk.id}`).join(', ');
						detectedValidationError = `File note không hợp lệ hoặc đã bị xóa cho nguồn dữ liệu của biến số: ${invalidKpisNames}`;
					}
				}
			}
			let data = {};
			if (id) {
				data = allFileNotes.find(note => note.id === id) || await getFileNotePadByIdController(id);
			} else if (kpi) {
				data = allFileNotes.find((e) => e.type == kpi.id && e.table == 'KPI');
			}
			if (data?.userClass) {
				setSelectedFileNote(data);
				setSelectedUC(new Set(data?.userClass || []));
				isView = listUC_CANVAS.filter(item => data.userClass.includes(item.name)).length > 0;
			} else {
				setSelectedFileNote(data);
				setSelectedUC(new Set());
			}
			setIsView(currentUser.isAdmin || isView);
			if (detectedValidationError) {
				setValidationError(detectedValidationError);
			}

		} catch (error) {
			console.error('fetchData: General error:', error);
			setValidationError(detectedValidationError || 'Đã xảy ra lỗi khi tải dữ liệu.');
			setIsView(false);
			setSelectedKpi(null);
			setSelectedFileNote(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [id, listUC_CANVAS, currentUser, selectedKpiId]);

	useEffect(() => {

		if (selectedKpi) {
			try {
				const kpiList = Array.isArray(selectedKpi.kpiList)
					? selectedKpi.kpiList
					: [];
				const varList = Array.isArray(selectedKpi.varList)
					? selectedKpi.varList
					: [];
				const newItems = { kpiList, varList };
				setSelectedItems(newItems);
				setPeriod(selectedKpi.period || 'day');
				if (selectedKpi.calc) {
					const calcData = JSON.parse(selectedKpi.calc);
					setFormula(calcData.formula || '');
					setVariables(calcData.variables || {});
				} else {
					setFormula('');
					setVariables({});
				}
			} catch (error) {
				console.error('Error handling data:', error);
				const emptyItems = { kpiList: [], varList: [] };
				setSelectedItems(emptyItems);
				setPeriod('day');
				setFormula('');
				setVariables({});
			}
		} else {
			const emptyItems = { kpiList: [], varList: [] };
			setSelectedItems(emptyItems);
			setPeriod('day');
			setFormula('');
			setVariables({});
		}

	}, [selectedKpi]);

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
		if (targetPeriod == 'month') {
			return monthlyData;
		} else if (targetPeriod == 'week') {
			return monthToWeek(monthlyData, year);
		} else if (targetPeriod == 'day') {
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

	const loadTable = async () => {
		setLoading(true);
		const fills = await fetchDataColor();
		const rawDataByVariable = {};
		const currentYear = new Date().getFullYear();

		for (const kpi of selectedItems.kpiList) {
			const kpiData = await getKpiCalculatorById(kpi);
			if (kpiData.period && kpiData.tableData) {
				const convertedData = convertPeriodData(kpiData, period);
				const variableKey = Object.keys(variables).find(
					(key) => variables[key].type == 'kpi' && variables[key].id == kpi,
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
						(key) => variables[key].type == 'var' && variables[key].id == v,
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
				a.split('/').length == 3 &&
				b.split('/').length == 3
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
						(item) => item.date == date,
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

		if (selectedKpi?.benchmark1_name && selectedKpi?.benchmark1_name.trim() !== '') {
			rowDataForDisplay.push({
				benchmark: 'benchmark1',
				...sortedDates?.reduce((acc, date) => {
					acc[date] = benchmarkData[date]?.benchmark1 || null;
					return acc;
				}, {}),
			});
		}

		if (selectedKpi?.benchmark2_name && selectedKpi?.benchmark2_name.trim() !== '') {
			rowDataForDisplay.push({
				benchmark: 'benchmark2',
				...sortedDates.reduce((acc, date) => {
					acc[date] = benchmarkData[date]?.benchmark2 || null;
					return acc;
				}, {}),
			});
		}

		let series = [
			createSeries('date', 'value', selectedKpi?.name, 'line', fills[0]),
		];
		if (selectedKpi?.benchmark1_name && selectedKpi.benchmark1_name.trim() !== '') {
			series.push(createSeries('date', 'benchmark1', selectedKpi.benchmark1_name, 'line', fills[1])); // Màu đỏ cho benchmark1
		}
		if (selectedKpi?.benchmark2_name && selectedKpi.benchmark2_name.trim() !== '') {
			series.push(createSeries('date', 'benchmark2', selectedKpi.benchmark2_name, 'line', fills[2])); // Màu xanh lá cho benchmark2
		}

		let chartData = result.map(item => ({
			date: item.date,
			value: item.value || NaN,
		}));
		let benchmarks = selectedKpi?.benchmark;
		chartData = chartData.map(item => {
			const date = item.date;
			const dataPoint = { ...item };

			if (selectedKpi?.benchmark1_name && selectedKpi.benchmark1_name.trim() !== '') {
				dataPoint.benchmark1 = parseFloat(benchmarks[date]?.benchmark1) || NaN;
			}
			if (selectedKpi?.benchmark2_name && selectedKpi.benchmark2_name.trim() !== '') {
				dataPoint.benchmark2 = parseFloat(benchmarks[date]?.benchmark2) || NaN;
			}

			return dataPoint;
		});
		let chartOption = createSectionData('', chartData, series, '');
		setOptions(chartOption);

		setTableData(chartData);
		setTimeout(() => {
			setLoading(false);
		}, 1000);
		return result;
	};

	useEffect(() => {
		loadTable();
	}, [selectedItems, period, selectedKpi, varList, ]);

	const handleChange = (name) => {
		setSelectedUC((prev) => {
			const newSet = new Set(prev);
			newSet.has(name) ? newSet.delete(name) : newSet.add(name);
			return newSet;
		});
	};

	const prepareTableData = () => {
		if (!tableData.length) return { columns: [], data: [] };

		const columns = [
			{
				title: '',
				dataIndex: 'name',
				key: 'name',
				fixed: 'left',
				width: 150,
				render: (text) => (
					<div className={styles.customCell}>
						{text}
					</div>
				),
			},
			...tableData.map((item, index) => ({
				title: item.date,
				dataIndex: `col${index}`,
				key: `col${index}`,
				width: 40,
				render: (text, record) => {
					if (text !== null && !isNaN(text)) {
						// Handle Infinity
						if (!isFinite(text)) {
							return (
								<div className={`${styles.customCell}`}>
									{text > 0 ? 'Infinite' : '-Infinite'}
								</div>
							);
						}

						// Handle value 0
						if (text === 0) {
							return (
								<div className={`${styles.customCell}`}>
									0
								</div>
							);
						}

						// Apply conditional formatting for percentage rows
						if (record?.name?.startsWith('% so với')) {
							const className = text < 0 ? styles.customCellWithColorRed : styles.customCellWithColorGreen;
							return (
								<div className={`${styles.customCell} ${className}`}>
									{`${text.toFixed(2)}%`}
								</div>
							);
						}

						// Format other rows normally
						return <div className={`${styles.customCell}`}>
							{Number(text).toLocaleString('vn-VN', {
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
									useGrouping: true,
								})
							}

						</div>;

					}
					return '-';
				},
			})),
		];

		const data = [];

		// Giá trị thực hiện
		const actualRow = {
			key: '1',
			name: 'Giá trị thực hiện',
			...tableData.reduce((acc, item, index) => {
				acc[`col${index}`] = item.value;
				return acc;
			}, {}),
		};
		data.push(actualRow);

		// Benchmark 1
		if (selectedKpi?.benchmark1_name && selectedKpi.benchmark1_name.trim() !== '') {
			const benchmark1Row = {
				key: '2',
				name: selectedKpi.benchmark1_name,
				...tableData.reduce((acc, item, index) => {
					acc[`col${index}`] = item.benchmark1;
					return acc;
				}, {}),
			};
			data.push(benchmark1Row);

			// % so với benchmark 1
			const percent1Row = {
				key: '4',
				name: `% so với ${selectedKpi.benchmark1_name}`,
				...tableData.reduce((acc, item, index) => {
					const val = item.value;
					const benchmark = item.benchmark1;
					if (benchmark && !isNaN(val) && !isNaN(benchmark) && benchmark !== 0) {
						acc[`col${index}`] = ((val - benchmark) / benchmark) * 100;
					} else {
						acc[`col${index}`] = null;
					}
					return acc;
				}, {}),
			};
			data.push(percent1Row);
		}

		// Benchmark 2
		if (selectedKpi?.benchmark2_name && selectedKpi.benchmark2_name.trim() !== '') {
			const benchmark2Row = {
				key: '3',
				name: selectedKpi.benchmark2_name,
				...tableData.reduce((acc, item, index) => {
					acc[`col${index}`] = item.benchmark2;
					return acc;
				}, {}),
			};
			data.push(benchmark2Row);

			// % so với benchmark 2
			const percent2Row = {
				key: '5',
				name: `% so với ${selectedKpi.benchmark2_name}`,
				...tableData.reduce((acc, item, index) => {
					const val = item.value;
					const benchmark = item.benchmark2;
					if (benchmark && !isNaN(val) && !isNaN(benchmark) && benchmark !== 0) {
						acc[`col${index}`] = ((val - benchmark) / benchmark) * 100;
					} else {
						acc[`col${index}`] = null;
					}
					return acc;
				}, {}),
			};
			data.push(percent2Row);
		}

		return { columns, data };
	};

	return (
		currentUser.isAdmin || isView ?

			<div className={styles.body} style={{margin:compact ? '0px' : ''}}>
				<div className={styles.bodyContainer} style={{padding:compact ? '0px' : ''}}>
					{!compact &&
					<div className={styles.title}>
						<span>{selectedFileNote?.name}</span>
						<i style={{ fontSize: 12, color: '#b8b8b8' }}>({selectedKpi?.name})</i>
						<div className={styles.settingUserClass}>
							<Button
								onClick={() => {
									if ((currentUser.isAdmin || selectedFileNote.user_create == currentUser.email)) {
										setOpenSetupUC(true);
									}
								}}
								icon={<img style={{ width: '20px', height: '20px' }} src={IconUser} alt='' />}
								style={{ border: 'none', width: '20px', height: '20px' }}
							>

							</Button>

							{selectedFileNote?.userClass &&
								selectedFileNote.userClass.map(uc =>
									<span className={styles.tag}>{uc}</span>,
								)
							}
						</div>
				

					</div>
		}
		
					<div className={styles.sectionContent} style={{padding:compact ? '0px' : '',margin:compact ? '0px' : '',backgroundColor:compact ? 'white' : ''}}>
						{validationError ?
							<>
								{/*<Alert type={'error'} message={<div>*/}
								{/*    <div style={{color: 'red', fontSize:14}}>Dữ liệu nguồn hoặc biến số kinh doanh sử dụng trước đó bị xóa hoặc không tồn tại</div>*/}
								{/*    <div>*/}
								{/*          <span style={{color: '#454545', fontSize:12}}>*/}
								{/*              <i>*/}
								{/*                  {JSON.stringify(validationError)}*/}
								{/*              </i>*/}
								{/*          </span>*/}
								{/*    </div>*/}

								{/*</div>} />*/}

							</>
							:
							<>
							</>}
						{tableData.length > 0 ? (
							<div className={styles.tableContainer} style={{padding:compact ? '0px' : '',margin:compact ? '0px' : ''}}>
								{!compact &&
								<Table
									columns={prepareTableData().columns}
									dataSource={prepareTableData().data}
									pagination={false}
									scroll={{ x: 'max-content' }}
									bordered
									size='middle'
								/>
								}
								{showChart &&
									<> 
										{options && <AgCharts options={options} />}
									</>
								}

							</div>
						) : (
							<p>No results available yet.</p>
						)}
					</div>
				</div>
				{openSetupUC &&
					<>
						<Modal
							title={`Cài đặt nhóm người dùng`}
							open={openSetupUC}
							onCancel={() => setOpenSetupUC(false)}
							onOk={() => {
								updateFileNotePad({
									...selectedFileNote,
									userClass: Array.from(selectedUC),
								}).then(data => {
									setOpenSetupUC(false);
									fetchData();
								});
							}}
							centered
							width={400}
							bodyStyle={{ height: '20vh', overflowY: 'auto' }}
						>
							{listUC.map((uc) => {
								const isDisabled = !currentUser?.isAdmin && !(uc.userAccess?.includes(currentUser?.email));
								return (
									<Checkbox
										key={uc.name}
										checked={selectedUC.has(uc.name)}
										onChange={() => handleChange(uc.name)}
										disabled={isDisabled}
									>
										{uc.name}
									</Checkbox>
								);
							})}
						</Modal>

					</>
				}
			</div>
			:
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '90vh',
				color: 'red',
				fontSize: '18px',
			}}>
				Không có quyền để xem
			</div>
	);
};

export default KPI2ContentView;

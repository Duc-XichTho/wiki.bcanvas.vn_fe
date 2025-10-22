import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import styles from './KPICalculator2.module.css';
import { evaluate } from 'mathjs';
// API
import { updateKpi2Calculator } from '../../../../apis/kpi2CalculatorService';
import { getAllKpiCalculator, getKpiCalculatorById } from '../../../../apis/kpiCalculatorService';
import { AgCharts } from 'ag-charts-react';
import { createSectionData, createSeries } from '../../Daas/Logic/SetupChart.js';
import { AgGridReact } from 'ag-grid-react';
import AG_GRID_LOCALE_VN from '../../../Home/AgridTable/locale.jsx';
import { saveColumnStateToLocalStorage } from '../../../Home/AgridTable/logicColumnState/columnState.jsx';
import { Alert, Button, Form, Input, message, Modal, Popover, Table, Typography } from 'antd';
import { getAllKpiBenchmark } from '../../../../apis/kpiBenchmarkService';
import { fetchAllBusinessCategories } from '../../../../apis/businessCategoryService';
import { PencilLine } from 'lucide-react';
import PopupCellActionBCKD from '../../../KeToanQuanTri/popUp/cellAction/PopUpCellActionBCKD.jsx';
import { formatCurrency } from '../../../KeToanQuanTri/functionKTQT/formatMoney.js';
import { fetchDataColor } from '../../../Canvas/Daas/Content/Template/SettingChart/ChartTemplate/setChartTemplate.js';
import { getAllTemplateTables } from '../../../../apis/templateSettingService.jsx';
import { createNewFileNotePad, getAllFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { createTimestamp } from '../../../../generalFunction/format.js';
import { getAllFileTab } from '../../../../apis/fileTabService.jsx';
import { MyContext } from '../../../../MyContext.jsx';

const KPI2Content = ({
						 selectedKpi,
						 activeTab,
						 setActiveTab,
						 KPICalculators,
						 varList,
						 setSelectedKpi,
						 fetchKPIs,
						 selectedColors = [
							 { id: 1, color: '#13C2C2' },
							 { id: 2, color: '#3196D1' },
							 { id: 3, color: '#6DB8EA' },
							 { id: 4, color: '#87D2EA' },
							 { id: 5, color: '#9BAED7' },
							 { id: 6, color: '#C695B7' },
							 { id: 7, color: '#EDCCA1' },
							 { id: 8, color: '#A4CA9C' }
						 ],
						 isModal = false,
						 onNameUpdate,
					 }) => {
	const [selectedItems, setSelectedItems] = useState({
		kpiList: [],
		varList: [],
	});
	const [originalItems, setOriginalItems] = useState({
		kpiList: [],
		varList: [],
	});
	
	// Helper function to get color for buttons
	const getButtonColor = (index = 0) => {
		if (!selectedColors || selectedColors.length === 0) {
			console.log('KPI2Content: No selectedColors available, using default');
			return '#13C2C2'; // Default color
		}
		const color = selectedColors[index % selectedColors.length]?.color || '#13C2C2';
		return color;
	};
	
	const [period, setPeriod] = useState('day');
	const [loading, setLoading] = useState(false);
	const [formula, setFormula] = useState('');
	const [variables, setVariables] = useState({});
	const [formulaError, setFormulaError] = useState('');
	const [tableData, setTableData] = useState([]);
	const [options, setOptions] = useState([]);
	const [colDefBenchmark, setColDefBenchmark] = useState([]);
	const [rowDataBenchmark, setRowDataBenchmark] = useState([]);
	const [showPeriodChangeWarning, setShowPeriodChangeWarning] = useState(false);
	const [isModalEditBenchmarkOpen, setIsModalEditBenchmarkOpen] = useState(false);
	const [pendingUpdateData, setPendingUpdateData] = useState(null);
	const [tempBenchmark1Name, setTempBenchmark1Name] = useState('');
	const [tempBenchmark2Name, setTempBenchmark2Name] = useState('');
	const periodOptions = [
		{ display: 'Ngày', value: 'day' },
		{ display: 'Tuần', value: 'week' },
		{ display: 'Tháng', value: 'month' },
	];
	const [validationError, setValidationError] = useState(null);
	const { currentUser  , uCSelected_CANVAS , listUC_CANVAS , loadData, setLoadData} = useContext(MyContext);

	// Thêm state cho chức năng sửa tên
	const [isEditingName, setIsEditingName] = useState(false);
	const [tempName, setTempName] = useState('');

	// Chọn KPI Benchmark làm benchmark3
	const [isSelectBenchmarkOpen, setIsSelectBenchmarkOpen] = useState(false);
	const [kpiBenchmarks, setKpiBenchmarks] = useState([]);
	const [selectedKpiBenchmark, setSelectedKpiBenchmark] = useState(null);
	const [accessibleBusinessCategories, setAccessibleBusinessCategories] = useState([]);

	// Thêm state để trigger refresh khi cần thiết
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	
	// State cho custom dropdown
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [dropdownRef, setDropdownRef] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');


	const initData = async () => {
		const resetToEmpty = () => {
			console.log('initData: Resetting to empty state (only if no selectedKpi or critical error).');
			const emptyItems = { kpiList: [], varList: [] };
			setSelectedItems(emptyItems);
			setOriginalItems(emptyItems);
			setPeriod('day');
			setFormula('');
			setVariables({});
			setValidationError(null); // Ensure error is cleared on a full reset
			// Reset tableData khi reset to empty
			setTableData([]);
			setColDefBenchmark([]);
			setRowDataBenchmark([]);
			setOptions([]); // Reset chart options
		};

		if (!selectedKpi) {
			console.log('initData: No selectedKpi provided.');
			resetToEmpty(); // Keep reset here if no KPI is selected at all
			return;
		}

		// Reset tableData khi chọn item mới - Đảm bảo reset hoàn toàn
		setTableData([]);
		setColDefBenchmark([]);
		setRowDataBenchmark([]);
		setOptions([]); // Reset chart options
		setFormulaError(''); // Reset formula error

		// Store potential validation error message temporarily
		let detectedValidationError = null;

		try {
			setLoading(true);
			setValidationError(null); // Reset validation error at the start of loading
			const [listKpiGoc, listTable, listFileNote] = await Promise.all([
				getAllKpiCalculator(),
				getAllTemplateTables(),
				getAllFileNotePad(),
			]).catch(fetchError => {
				console.error('initData: Error fetching initial lists:', fetchError);
				// Set error but throw to be caught by outer catch, which might reset
				detectedValidationError = 'Lỗi khi tải dữ liệu cần thiết.';
				throw fetchError;
			});

			// Extract KPI list
			const kpiList = Array.isArray(selectedKpi.kpiList) ? selectedKpi.kpiList : [];

			// --- Validation Logic (Sets error but doesn't reset) ---
			// Step 1: Validate KPI existence
			const missingKpis = kpiList.filter(kpiId =>
				!listKpiGoc.some(kpi => kpi.id == kpiId),
			);

			if (missingKpis.length > 0) {
				detectedValidationError = `Một số đo lường đã bị xóa hoặc không tồn tại: ${missingKpis.join(', ')}`;
			}

			// Step 2: Get valid KPIs and validate data sources (only if no prior error)
			let validKpis = [];
			if (!detectedValidationError) {
				validKpis = kpiList
					.map(kpiId => listKpiGoc.find(kpi => kpi.id == kpiId))
					.filter(Boolean);

				const kpisWithInvalidDataSource = validKpis
					.filter(kpi => !listTable.some(table => table.id == kpi.dataSource));

				if (kpisWithInvalidDataSource.length > 0) {
					const invalidKpisNames = kpisWithInvalidDataSource.map(kpi => kpi.tableVersion || `ID ${kpi.id}`).join(', ');
					detectedValidationError = `Nguồn dữ liệu (Table) không hợp lệ hoặc đã bị xóa cho biến số: ${invalidKpisNames}`;
				}
			}

			// Step 3: Validate file notes (only if no prior error)
			if (!detectedValidationError && validKpis.length > 0) {
				const kpisWithInvalidFileNote = validKpis
					.filter(kpi => {
						const relatedTable = listTable.find(table => table.id == kpi.dataSource);
						return !relatedTable || !listFileNote.some(note => note.id == relatedTable.fileNote_id);
					});

				if (kpisWithInvalidFileNote.length > 0) {
					const invalidKpisNames = kpisWithInvalidFileNote.map(kpi => kpi.tableVersion || `ID ${kpi.id}`).join(', ');
					detectedValidationError = `File note không hợp lệ hoặc đã bị xóa cho nguồn dữ liệu của biến số: ${invalidKpisNames}`;
				}
			}
			// --- End of Validation Logic ---

			// Set the validation error state *after* checks, if any occurred
			if (detectedValidationError) {
				setValidationError(detectedValidationError);
			}

			// Process var list and update state (Always run to show selections)
			const varList = Array.isArray(selectedKpi.varList) ? selectedKpi.varList : [];
			const newItems = { kpiList, varList };

			setSelectedItems(newItems);
			setOriginalItems({ ...newItems }); // Set original state based on loaded data
			setPeriod(selectedKpi.period || 'day');

			if (selectedKpi.calc) {
				try {
					const calcData = JSON.parse(selectedKpi.calc);
					setFormula(calcData.formula || '');
					
					// Tự động tạo variables dựa trên công thức
					const formulaText = calcData.formula || '';
					const usedVariables = formulaText.toLowerCase().match(/[a-z]/g) || [];
					const uniqueUsedVariables = [...new Set(usedVariables)];
					
					// Tạo variables mới với type mặc định là 'kpi'
					const newVariables = {};
					uniqueUsedVariables.forEach(variable => {
						newVariables[variable] = {
							type: 'kpi',
							id: calcData.variables?.[variable]?.id || '',
						};
					});
					
					setVariables(newVariables);
				} catch (error) {
					// Set validation error for parse failure, but don't reset other loaded state
					setValidationError('Lỗi khi đọc dữ liệu công thức đã lưu.');
					setFormula(''); // Reset only formula/vars on parse error
					setVariables({});
				}
			} else {
				setFormula('');
				setVariables({});
			}

		} catch (error) {
			console.error('initData: General error during initialization:', error);
			setValidationError(detectedValidationError || 'Đã xảy ra lỗi nghiêm trọng khi tải dữ liệu chỉ số.');
		} finally {
			setLoading(false);
			console.log('initData: Loading finished.');
		}
	};

	useEffect(() => {
		initData();
	}, [selectedKpi]); // Keep dependency array as is

	// Load accessible business categories
	useEffect(() => {
		const loadAccessibleBusinessCategories = async () => {
			try {
				const allCategories = await fetchAllBusinessCategories();
				// Filter categories based on user access
				// For now, we'll show all categories if user is admin/superadmin, otherwise filter by user classes
				let accessibleCategories = [];
				
				if (currentUser?.isAdmin || currentUser?.isSuperAdmin) {
					// Admin/SuperAdmin can access all categories
					accessibleCategories = allCategories || [];
				} else {
					// Regular users can only access categories they have permission for
					// This would need to be implemented based on your business logic
					// For now, we'll show all categories
					accessibleCategories = allCategories || [];
				}
				
				setAccessibleBusinessCategories(accessibleCategories);
			} catch (error) {
				console.error('Error loading business categories:', error);
				setAccessibleBusinessCategories([]);
			}
		};

		loadAccessibleBusinessCategories();
	}, [currentUser]);

	// useEffect để reset state khi thay đổi KPI
	useEffect(() => {
		if (selectedKpi) {
			// Reset tất cả state liên quan đến table khi chọn KPI mới
			setTableData([]);
			setColDefBenchmark([]);
			setRowDataBenchmark([]);
			setOptions([]);
			setFormulaError('');
		}
	}, [selectedKpi?.id]); // Chỉ trigger khi ID của KPI thay đổi

	// Separate useEffect để load table khi cần thiết
	useEffect(() => {
		// Chỉ load table khi có đủ dữ liệu cần thiết
		if (selectedKpi && selectedItems.kpiList.length > 0 && Object.keys(variables).length > 0 && formula) {
			loadTable();
		}
	}, [selectedItems.kpiList, period, formula, variables, refreshTrigger, selectedKpi?.benchmark]); // Thêm benchmark để trigger khi benchmark thay đổi

	// useEffect riêng cho benchmark names
	useEffect(() => {
		if (isModalEditBenchmarkOpen && selectedKpi) {
			setTempBenchmark1Name(selectedKpi.benchmark1_name || '');
			setTempBenchmark2Name(selectedKpi.benchmark2_name || '');
		}
	}, [isModalEditBenchmarkOpen, selectedKpi]);

	// useEffect để cập nhật chart options khi benchmark thay đổi
	useEffect(() => {
		if (tableData.length > 0 && selectedKpi?.benchmark) {
			const palette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#9467bd'];
			let series = [
				createSeries('date', 'value', selectedKpi?.name, 'line', palette[0]),
			];

			if (selectedKpi?.benchmark1_name && selectedKpi.benchmark1_name.trim() !== '') {
				series.push(createSeries('date', 'benchmark1', selectedKpi.benchmark1_name, 'line', palette[1]));
			}
			if (selectedKpi?.benchmark2_name && selectedKpi.benchmark2_name.trim() !== '') {
				series.push(createSeries('date', 'benchmark2', selectedKpi.benchmark2_name, 'line', palette[2]));
			}
			const hasBenchmark3Data = Object.values(selectedKpi?.benchmark || {}).some(x => x && x.benchmark3 !== undefined && x.benchmark3 !== null && x.benchmark3 !== '');
			const bench3NameFromJson = (selectedKpi?.benchmark && typeof selectedKpi.benchmark.__benchmark3_name === 'string' && selectedKpi.benchmark.__benchmark3_name.trim() !== '') ? selectedKpi.benchmark.__benchmark3_name : undefined;
			if (hasBenchmark3Data || bench3NameFromJson || (selectedKpi?.benchmark3_name && selectedKpi.benchmark3_name.trim() !== '')) {
				const name = bench3NameFromJson || (selectedKpi?.benchmark3_name && selectedKpi.benchmark3_name.trim() !== '' ? selectedKpi.benchmark3_name : 'Market Benchmark');
				series.push(createSeries('date', 'benchmark3', name, 'line', palette[3]));
			}

			const chartOption = createSectionData('', tableData, series, '');
			setOptions(chartOption);
		}
	}, [tableData, selectedKpi?.benchmark, selectedKpi?.benchmark1_name, selectedKpi?.benchmark2_name, selectedKpi?.benchmark3_name]);

	// useEffect để xử lý khi thay đổi tab
	useEffect(() => {
		// Khi chuyển sang tab benchmark hoặc results, đảm bảo dữ liệu được load
		if ((activeTab === 'benchmark' || activeTab === 'results') && selectedKpi && selectedItems.kpiList.length > 0 && Object.keys(variables).length > 0 && formula) {
			// Luôn load table khi chuyển tab để đảm bảo dữ liệu mới nhất
			loadTable();
		}
	}, [activeTab, selectedKpi, selectedItems.kpiList, variables, formula]);

	// useEffect để handle click outside dropdown
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef && !dropdownRef.contains(event.target)) {
				setIsDropdownOpen(false);
				setSearchTerm(''); // Reset search khi đóng dropdown
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [dropdownRef]);


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

		const conversionKey = `${sourcePeriod}To${targetPeriod.charAt(0).toUpperCase() + targetPeriod.slice(1)
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


	const handleCellValueChanged = (params) => {
		const { colDef, newValue, data } = params;
		const dateField = colDef.field;
		const benchmarkType = data.benchmark; // benchmark1 hoặc benchmark2

		if (!selectedKpi.benchmark) {
			selectedKpi.benchmark = {};
		}
		if (!selectedKpi.benchmark[dateField]) {
			selectedKpi.benchmark[dateField] = {};
		}

		selectedKpi.benchmark[dateField][benchmarkType] = newValue;
		
		// Cập nhật state local ngay lập tức để UI phản hồi
		setSelectedKpi({ ...selectedKpi });
		
		// Cập nhật database
		updateKpi2Calculator({ id: selectedKpi.id, benchmark: selectedKpi.benchmark })
			.then(() => {
				console.log('Updated successfully');
				// Trigger refresh để cập nhật tất cả tabs
				setRefreshTrigger(prev => prev + 1);
			})
			.catch(err => console.error('Update failed:', err));
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
		const rawDataByVariable = {};
		const fills = await fetchDataColor();
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
		let result = sortedDates.map(date => {
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
		const columnsForBenchmark = [
			{
				headerName: 'Benchmark',
				field: 'benchmark',
				editable: false,
                valueGetter: params => {
					if (params?.data?.benchmark == 'benchmark1') {
						return selectedKpi?.benchmark1_name;
					}
					if (params?.data?.benchmark == 'benchmark2') {
						return selectedKpi?.benchmark2_name;
					}
					if (params?.data?.benchmark == 'benchmark3') {
                        return (selectedKpi?.benchmark3_name && selectedKpi.benchmark3_name.trim() !== '')
                            ? selectedKpi.benchmark3_name
                            : (selectedKpi?.benchmark?.__benchmark3_name && selectedKpi.benchmark.__benchmark3_name.trim() !== ''
                                ? selectedKpi.benchmark.__benchmark3_name
                                : 'Market Benchmark');
					}
					return params.value;
				},
				cellRenderer: params => {
					if (params?.value == 'benchmark1') {
						return selectedKpi?.benchmark1_name;
					}
					if (params?.value == 'benchmark2') {
						return selectedKpi?.benchmark2_name;
					}
					if (params?.value == 'benchmark3') {
                        return (selectedKpi?.benchmark3_name && selectedKpi.benchmark3_name.trim() !== '')
                            ? selectedKpi.benchmark3_name
                            : (selectedKpi?.benchmark?.__benchmark3_name && selectedKpi.benchmark.__benchmark3_name.trim() !== ''
                                ? selectedKpi.benchmark.__benchmark3_name
                                : 'Market Benchmark');
					}
					return params.value;
				},
			},
			...sortedDates.map(date => ({
				headerName: date, field: date, editable: true,
				headerClass: 'right-align-business-name',
				cellStyle: (params) => {
					return { textAlign: 'right' };
				},
				cellRenderer: (params) => {
					return (<>{formatCurrency(params.value)}</>
					);
				},
			})),
		];

		let benchmarkData = {};
		if (selectedKpi?.benchmark) {
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

		// Thêm Benchmark 3 vào bảng benchmark nếu có tên hoặc có dữ liệu
		const hasBenchmark3DataRow = sortedDates.some(date => {
			const v = benchmarkData[date]?.benchmark3;
			return v !== undefined && v !== null && v !== '';
		});
		if ((selectedKpi?.benchmark3_name && selectedKpi?.benchmark3_name.trim() !== '') || hasBenchmark3DataRow) {
			rowDataForDisplay.push({
				benchmark: 'benchmark3',
				...sortedDates.reduce((acc, date) => {
					acc[date] = benchmarkData[date]?.benchmark3 || null;
					return acc;
				}, {}),
			});
		}
		setColDefBenchmark(columnsForBenchmark);
		setRowDataBenchmark(rowDataForDisplay);


		let series = [
			createSeries('date', 'value', selectedKpi?.name, 'line', fills[0]),
		];

		// Chỉ thêm series benchmark nếu chúng tồn tại
		if (selectedKpi?.benchmark1_name && selectedKpi.benchmark1_name.trim() !== '') {
			series.push(createSeries('date', 'benchmark1', selectedKpi.benchmark1_name, 'line', fills[1])); // Màu đỏ cho benchmark1
		}
		if (selectedKpi?.benchmark2_name && selectedKpi.benchmark2_name.trim() !== '') {
			series.push(createSeries('date', 'benchmark2', selectedKpi.benchmark2_name, 'line', fills[2])); // Màu xanh lá cho benchmark2
		}
        // series benchmark3 sẽ được thêm sau khi dựng chartData

		let chartData = result.map(item => ({
			date: item.date,
			value: item.value,
		}));
		
		// Sử dụng dữ liệu benchmark mới nhất từ state
		let benchmarks = selectedKpi?.benchmark || {};
        chartData = chartData.map(item => {
			const date = item.date;
			const dataPoint = { ...item };

			if (selectedKpi?.benchmark1_name && selectedKpi.benchmark1_name.trim() !== '') {
				dataPoint.benchmark1 = parseFloat(benchmarks[date]?.benchmark1) || NaN;
			}
			if (selectedKpi?.benchmark2_name && selectedKpi.benchmark2_name.trim() !== '') {
				dataPoint.benchmark2 = parseFloat(benchmarks[date]?.benchmark2) || NaN;
			}
            // Map benchmark3 regardless of name; only skip when truly empty
            const b3raw = benchmarks[date]?.benchmark3;
            dataPoint.benchmark3 = (b3raw === '' || b3raw === undefined || b3raw === null)
                ? NaN
                : parseFloat(b3raw);

			return dataPoint;
		});

        // Bổ sung series benchmark sau khi có chartData để đảm bảo detect đúng dữ liệu
        if (selectedKpi?.benchmark1_name && selectedKpi.benchmark1_name.trim() !== '') {
            series.push(createSeries('date', 'benchmark1', selectedKpi.benchmark1_name, 'line', fills[1]));
        }
        if (selectedKpi?.benchmark2_name && selectedKpi.benchmark2_name.trim() !== '') {
            series.push(createSeries('date', 'benchmark2', selectedKpi.benchmark2_name, 'line', fills[2]));
        }
        const hasBench3Data = chartData.some(r => r.benchmark3 !== undefined && r.benchmark3 !== null && !isNaN(r.benchmark3));
        const name3FromJson = (benchmarks && typeof benchmarks.__benchmark3_name === 'string' && benchmarks.__benchmark3_name.trim() !== '') ? benchmarks.__benchmark3_name : undefined;
        const name3Resolved = name3FromJson || ((selectedKpi?.benchmark3_name && selectedKpi.benchmark3_name.trim() !== '') ? selectedKpi.benchmark3_name : undefined) || 'Market Benchmark';
        if (hasBench3Data || name3FromJson || (selectedKpi?.benchmark3_name && selectedKpi.benchmark3_name.trim() !== '')) {
            const color3 = fills[3] || '#9467bd';
            series.push(createSeries('date', 'benchmark3', name3Resolved, 'line', color3));
        }

        let chartOption = createSectionData('', chartData, series, '');
		setOptions(chartOption);
		setTableData(chartData);
		return result;
	};

	const handleSaveBenchmarkNames = async () => {
		if (!selectedKpi) return;

		try {
			setLoading(true);
			const updatedData = {
				...selectedKpi,
				benchmark1_name: tempBenchmark1Name,
				benchmark2_name: tempBenchmark2Name,
			};

			const updatedKPI = await updateKpi2Calculator(updatedData);
			setSelectedKpi(updatedKPI);
			setIsModalEditBenchmarkOpen(false);
			
			// Trigger refresh để cập nhật tất cả tabs
			setRefreshTrigger(prev => prev + 1);
			
			// Load lại table data ngay lập tức để cập nhật UI
			if (selectedItems.kpiList.length > 0 && Object.keys(variables).length > 0 && formula) {
				loadTable();
			}
		} catch (error) {
			console.error('Error saving benchmark names:', error);
		} finally {
			setLoading(false);
		}
	};
	const defaultColDef = useMemo(() => {
		return {
			editable: true,
			filter: true,
			suppressMenu: true,
			cellStyle: { fontSize: '14.5px' },
			wrapHeaderText: true,
			autoHeaderHeight: true,
			width: 120,
		};
	});
	const onGridReady = useCallback(async () => {

	}, []);
	const hasChanges = () => {
		const kpiListChanged = selectedItems.kpiList != originalItems.kpiList;
		const varListChanged = selectedItems.varList != originalItems.varList;
		const periodChanged = period !== (selectedKpi?.period || 'day');
		const formulaChanged =
			formula !==
			(selectedKpi?.calc ? JSON.parse(selectedKpi.calc).formula : '');
		return kpiListChanged || varListChanged || periodChanged || formulaChanged;
	};

	const filteredKPICalculators =
		KPICalculators?.filter((calc) => calc.tableVersion !== null) || [];

	// Filter out null name items from varList
	const filteredVarList = varList?.filter((v) => v.name !== null) || [];

	// Filter KPIs based on search term
	const filteredKPICalculatorsForDropdown = useMemo(() => {
		if (!searchTerm.trim()) {
			return filteredKPICalculators;
		}

		const searchLower = searchTerm.toLowerCase().trim();
		return filteredKPICalculators.filter((calc) => {
			// Search by name
			const nameMatch = calc.tableVersion?.toLowerCase().includes(searchLower);
			
			// Search by tags
			const tagsMatch = calc.tags?.some(tag => 
				tag.toLowerCase().includes(searchLower)
			);
			
			return nameMatch || tagsMatch;
		});
	}, [filteredKPICalculators, searchTerm]);

	const handleKPISelect = (e) => {
		const selectedId = e.target.value;
		if (selectedId && !selectedItems.kpiList.includes(selectedId)) {
			setSelectedItems((prev) => ({
				...prev,
				kpiList: [...prev.kpiList, selectedId],
			}));
			// Reset the select element to default value
			e.target.value = '';
		}
	};

	const handleVarSelect = (e) => {
		const selectedCode = e.target.value;
		if (selectedCode && !selectedItems.varList.includes(selectedCode)) {
			setSelectedItems((prev) => ({
				...prev,
				varList: [...prev.varList, selectedCode],
			}));
			// Reset the select element to default value
			e.target.value = '';
		}
	};

	const removeKPI = (id) => {
		setSelectedItems((prev) => ({
			...prev,
			kpiList: prev.kpiList.filter((item) => item !== id),
		}));
	};

	const removeVar = (code) => {
		setSelectedItems((prev) => ({
			...prev,
			varList: prev.varList.filter((item) => item !== code),
		}));
	};

	const handleFormulaChange = (value) => {
		setFormula(value.toLowerCase());
		
		// Tự động tạo biến dựa trên công thức
		const usedVariables = value.toLowerCase().match(/[a-z]/g) || [];
		const uniqueUsedVariables = [...new Set(usedVariables)];
		
		// Tạo object variables mới với các biến được sử dụng trong công thức
		const newVariables = {};
		uniqueUsedVariables.forEach(variable => {
			if (!variables[variable]) {
				newVariables[variable] = {
					type: 'kpi', // Mặc định là "Biến số kinh doanh"
					id: '',
				};
			} else {
				newVariables[variable] = variables[variable];
			}
		});
		
		setVariables(newVariables);
		validateFormula(value.toLowerCase(), newVariables);
	};

	const handleAddVariable = () => {
		const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
		const unusedLetter = alphabet.find((letter) => !variables[letter]);

		if (unusedLetter) {
			setVariables((prev) => ({
				...prev,
				[unusedLetter]: {
					type: 'kpi', // Mặc định là "Biến số kinh doanh"
					id: '',
				},
			}));
		}
	};

	const handleVariableChange = (variable, field, value) => {
		setVariables((prev) => ({
			...prev,
			[variable]: { ...prev[variable], [field]: value },
		}));
		validateFormula(formula, {
			...variables,
			[variable]: { ...variables[variable], [field]: value },
		});
	};

	const handleRemoveVariable = (variableToRemove) => {
		setVariables((prev) => {
			const newVariables = { ...prev };
			delete newVariables[variableToRemove];
			validateFormula(formula, newVariables);
			return newVariables;
		});
	};

	const validateFormula = (formula, vars) => {
		const usedVariables = formula.match(/[a-z]/g) || [];
		const uniqueUsedVariables = [...new Set(usedVariables)];

		const undefinedVariables = uniqueUsedVariables.filter((v) => !vars[v]);
		if (undefinedVariables.length > 0) {
			setFormulaError(
				`Biến ${undefinedVariables.join(', ')} chưa được định nghĩa`,
			);
			return false;
		}

		const unusedVariables = Object.keys(vars).filter(
			(v) => !usedVariables.includes(v),
		);
		const incompleteVariables = Object.entries(vars).filter(
			([_, v]) => !v.id,
		);

		if (unusedVariables.length > 0) {
			setFormulaError(
				`Biến ${unusedVariables.join(', ')} không được sử dụng trong công thức`,
			);
			return false;
		}

		if (incompleteVariables.length > 0) {
			setFormulaError(
				`Biến ${incompleteVariables
					.map(([k]) => k)
					.join(', ')} chưa được định nghĩa đầy đủ`,
			);
			return false;
		}

		setFormulaError('');
		return true;
	};

	const handleSave = async () => {
		if (!selectedKpi || !hasChanges()) return;

		// Đảm bảo tất cả variables đều có type 'kpi'
		const normalizedVariables = {};
		Object.keys(variables).forEach(key => {
			normalizedVariables[key] = {
				type: 'kpi',
				id: variables[key].id
			};
		});

		const updatedData = {
			...selectedKpi,
			id: selectedKpi.id,
			kpiList: selectedItems.kpiList,
			varList: selectedItems.varList,
			period: period,
			calc: JSON.stringify({
				formula,
				variables: normalizedVariables,
			}),
		};

		// Kiểm tra xem period có thay đổi không
		if (period !== selectedKpi.period) {
			// Hiển thị Popover cảnh báo
			setPendingUpdateData(updatedData);
			setShowPeriodChangeWarning(true); // Hiển thị Popover
		} else {
			// Nếu không thay đổi period, tiến hành lưu bình thường
			try {
				setLoading(true);
				await updateKpi2Calculator(updatedData);
				message.success('Lưu thành công.');
				setOriginalItems(selectedItems);
				// Trigger refresh để cập nhật tất cả tabs
				setRefreshTrigger(prev => prev + 1);
			} catch (error) {
				console.error('Error saving KPI:', error);
			} finally {
				// setTimeout(() => {
				// 	initData();
				// }, 1000);
				setLoading(false);
			}
		}
	};

	const handleConfirmPeriodChange = async () => {
		if (pendingUpdateData) {
			try {
				setLoading(true); // Bật trạng thái loading
				
				// Đảm bảo tất cả variables đều có type 'kpi'
				const normalizedVariables = {};
				Object.keys(variables).forEach(key => {
					normalizedVariables[key] = {
						type: 'kpi',
						id: variables[key].id
					};
				});
				
				// Xóa benchmark và cập nhật variables
				const updatedDataWithClearedBenchmark = {
					...pendingUpdateData,
					benchmark: {},
					calc: JSON.stringify({
						formula,
						variables: normalizedVariables,
					}),
				};
				
				let newKPI = await updateKpi2Calculator(updatedDataWithClearedBenchmark);
				setSelectedKpi(newKPI);
				setOriginalItems(selectedItems);
				// Trigger refresh để cập nhật tất cả tabs
				setRefreshTrigger(prev => prev + 1);
				message.success('Lưu thành công.');
				// Tải lại dữ liệu sau khi lưu thành công
				initData();
			} catch (error) {
				console.error('Error saving KPI:', error);
			} finally {
				setLoading(false); // Tắt trạng thái loading
				setShowPeriodChangeWarning(false); // Đóng Popover
				setPendingUpdateData(null); // Xóa dữ liệu tạm thời
			}
		}
	};

	const handleCancelPeriodChange = () => {
		setShowPeriodChangeWarning(false); // Đóng Popover
		setPendingUpdateData(null); // Xóa dữ liệu tạm thời
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
			},
			...tableData.map((item, index) => ({
				title: item.date,
				dataIndex: `col${index}`,
				key: `col${index}`,
				width: 150,
				render: (text, record) => {
					if (text !== null && !isNaN(text)) {
						// Handle Infinity
						if (!isFinite(text)) {
							return (
								<span style={{ color: 'black' }}>
                    {text > 0 ? '∞' : '-∞'}
                </span>
							);
						}

						// Handle value 0
						if (text === 0) {
							return (
								<span style={{ color: 'black' }}>
                    0
                </span>
							);
						}

						// Apply conditional formatting for percentage rows
						if (record?.name?.startsWith('% so với')) {
							const color = text < 0 ? 'red' : 'green';
							return (
								<span style={{ color }}>
                    {`${text.toFixed(2)}%`}
                </span>
							);
						}

						// Format other rows normally
						return Number(text).toLocaleString('vn-VN', {
							minimumFractionDigits: 0,
							maximumFractionDigits: 2,
							useGrouping: true,
						});
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

		// Benchmark 3 (hiển thị nếu có tên hoặc có dữ liệu)
		const hasBenchmark3Row = tableData.some(row => row.benchmark3 !== undefined && row.benchmark3 !== null && !isNaN(row.benchmark3));
		if (hasBenchmark3Row || (selectedKpi?.benchmark3_name && selectedKpi.benchmark3_name.trim() !== '')) {
			const benchmark3Row = {
				key: '6',
				name: (selectedKpi?.benchmark?.__benchmark3_name && selectedKpi.benchmark.__benchmark3_name.trim() !== '')
					? selectedKpi.benchmark.__benchmark3_name
					: ((selectedKpi?.benchmark3_name && selectedKpi.benchmark3_name.trim() !== '') ? selectedKpi.benchmark3_name : 'Market Benchmark'),
				...tableData.reduce((acc, item, index) => {
					acc[`col${index}`] = item.benchmark3;
					return acc;
				}, {}),
			};
			data.push(benchmark3Row);

			// % so với benchmark 3
			const percent3Row = {
				key: '7',
				name: `% so với ${((selectedKpi?.benchmark?.__benchmark3_name && selectedKpi.benchmark.__benchmark3_name.trim() !== '')
					? selectedKpi.benchmark.__benchmark3_name
					: ((selectedKpi?.benchmark3_name && selectedKpi.benchmark3_name.trim() !== '') ? selectedKpi.benchmark3_name : 'Market Benchmark'))}`,
				...tableData.reduce((acc, item, index) => {
					const val = item.value;
					const benchmark = item.benchmark3;
					if (benchmark && !isNaN(val) && !isNaN(benchmark) && benchmark !== 0) {
						acc[`col${index}`] = ((val - benchmark) / benchmark) * 100;
					} else {
						acc[`col${index}`] = null;
					}
					return acc;
				}, {}),
			};
			data.push(percent3Row);
		}

		return { columns, data };
	};

	const handleCreateFileNote = async () => {
		let allFolder = await getAllFileTab();
		let selectedFolder = allFolder.find(e => e.position == 101)
		const newFileNote = {
			tab: selectedFolder.key,
			name: selectedKpi.name,
			created_at: createTimestamp(),
			user_create: currentUser.email,
			userClass: [listUC_CANVAS.find(e => e.id == uCSelected_CANVAS)?.name || ''],
			table : 'KPI',
			type: selectedKpi.id
		};

		await createNewFileNotePad(newFileNote);
		message.success('Đã thêm KPI vào kho!');
		await fetchKPIs()
	};

	// Thêm các hàm xử lý sửa tên
	const handleNameEdit = () => {
		setTempName(selectedKpi.name);
		setIsEditingName(true);
	};

	const handleNameSave = async () => {
		if (!tempName.trim()) return;
		
		try {
			const updatedData = {
				...selectedKpi,
				name: tempName.trim()
			};
			
			const updatedKPI = await updateKpi2Calculator(updatedData);
			setSelectedKpi(updatedKPI);
			setIsEditingName(false);
			message.success('Cập nhật tên thành công!');
			onNameUpdate(selectedKpi.id, tempName.trim());
				
		} catch (error) {
			console.error('Error updating KPI name:', error);
			message.error('Lỗi khi cập nhật tên!');
		}
	};

	const handleNameCancel = () => {
		setIsEditingName(false);
		setTempName('');
	};

	return (
		<div className={styles.mainSection}>
			<div className={styles.titleContainer}>
				{isEditingName ? (
					<div className={styles.nameEditContainer}>
						<input
							type="text"
							className={styles.nameInput}
							value={tempName}
							onChange={(e) => setTempName(e.target.value)}
							autoFocus
						/>
						<div className={styles.nameEditActions}>
							<button
								className={styles.nameSaveButton}
								onClick={handleNameSave}
								disabled={!tempName.trim()}
							>
								Lưu
							</button>
							<button className={styles.nameCancelButton} onClick={handleNameCancel}>
								Hủy
							</button>
						</div>
					</div>
				) : (
					<div className={styles.titleWithEdit}>
						<h1 className={styles.mainTitle}>
							Cài đặt chỉ số: {selectedKpi ? selectedKpi.name : 'Chọn chỉ số'}
						</h1>
						{selectedKpi && (
							<button className={styles.editNameButton} onClick={handleNameEdit}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									className={styles.editIcon}
								>
									<path
										d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
								</svg>
							</button>
						)}
					</div>
				)}
			</div>

			{/* Tabs */}
			<div 
				className={styles.tabContainer}
				style={{
					'--tab-color-1': getButtonColor(0),
					'--tab-color-2': getButtonColor(1),
					'--tab-color-3': getButtonColor(2)
				}}
			>
				<button
					className={`${styles.tabButton} ${activeTab == 'definition' ? styles.tabActive : ''
					}`}
					onClick={() => setActiveTab('definition')}
				>
					Định nghĩa
				</button>
				<button
					className={`${styles.tabButton} ${activeTab == 'benchmark' ? styles.tabActive : ''
					}`}
					onClick={() => setActiveTab('benchmark')}
				>
					Benchmark
				</button>
				<button
					className={`${styles.tabButton} ${activeTab == 'results' ? styles.tabActive : ''
					}`}
					onClick={() => setActiveTab('results')}
				>
					Bảng kết quả
				</button>
			</div>

			<div className={styles.tabContent} style={{ height: isModal ? 'calc(80vh - 150px)' : '', overflow: isModal ? 'auto' : '' }}>
				{activeTab == 'definition' && (
					<div>
						<div className={styles.section}>
							{validationError ?
								<>
									{/*<Alert type={'error'} message={<div>*/}
									{/*    <div style={{color: 'red', fontSize:14}}>Dữ liệu nguồn hoặc biến số kinh doanh sử dụng trước đó bị xóa hoặc không tồn tại</div>*/}
									{/*    <div>*/}
									{/*      <span style={{color: '#454545', fontSize:12}}>*/}
									{/*          <i>*/}
									{/*              {JSON.stringify(validationError)}*/}
									{/*          </i>*/}
									{/*      </span>*/}
									{/*    </div>*/}

									{/*</div>} />*/}

								</>
								:
								<>
								</>}
							<div className={styles.sectionContent}>
								{/* Period Selection */}
								<div className={styles.formGroup} style={{ width: '100%' }}>
									<label className={styles.label2}>Chu kỳ</label>
									<select
										className={styles.select}
										value={period}
										onChange={(e) => setPeriod(e.target.value)}
										style={{ width: '20%' }}
									>
										{periodOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.display}
											</option>
										))}
									</select>
								</div>

								<div className={styles.sectionContainer}>
									<div className={styles.formGroup2}>
										<label className={styles.label2}>Danh sách đo lường</label>
										<div className={styles.customDropdown} ref={setDropdownRef}>
											<div 
												className={styles.dropdownTrigger}
												onClick={() => setIsDropdownOpen(!isDropdownOpen)}
											>
												<span>Chọn đo lường</span>
												<svg 
													className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.dropdownArrowOpen : ''}`}
													xmlns="http://www.w3.org/2000/svg" 
													viewBox="0 0 20 20" 
													fill="currentColor"
												>
													<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
												</svg>
											</div>
											{isDropdownOpen && (
												<div className={styles.dropdownMenu}>
													<div className={styles.searchContainer}>
														<input
															type="text"
															className={styles.searchInput}
															placeholder="Tìm kiếm theo tên hoặc tag..."
															value={searchTerm}
															onChange={(e) => setSearchTerm(e.target.value)}
															onClick={(e) => e.stopPropagation()}
														/>
														<svg 
															className={styles.searchIcon}
															xmlns="http://www.w3.org/2000/svg" 
															viewBox="0 0 20 20" 
															fill="currentColor"
														>
															<path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
														</svg>
													</div>
													<div className={styles.dropdownItems}>
														{filteredKPICalculatorsForDropdown.length > 0 ? (
															filteredKPICalculatorsForDropdown.map((calc) => (
																<div
																	key={calc.id}
																	className={`${styles.dropdownItem} ${selectedItems.kpiList.includes(calc.id) ? styles.dropdownItemDisabled : ''}`}
																	onClick={() => {
																		if (!selectedItems.kpiList.includes(calc.id)) {
																			handleKPISelect({ target: { value: calc.id } });
																			setIsDropdownOpen(false);
																			setSearchTerm('');
																		}
																	}}
																>
																	<div className={styles.dropdownItemContent}>
																		<span className={styles.dropdownItemName}>{calc.tableVersion}</span>
																		{calc.tags && calc.tags.length > 0 && (
																			<div className={styles.dropdownItemTags}>
																				{calc.tags.slice(0, 2).map((tag, index) => (
																					<span key={index} className={styles.dropdownTag}>
																						{tag}
																					</span>
																				))}
																				{calc.tags.length > 2 && (
																					<span className={styles.dropdownTagMore}>
																						+{calc.tags.length - 2}
																					</span>
																				)}
																			</div>
																		)}
																	</div>
																</div>
															))
														) : (
															<div className={styles.noResults}>
																Không tìm thấy kết quả nào
															</div>
														)}
													</div>
												</div>
											)}
										</div>

										{/* Selected KPIs */}
										<div className={styles.selectedItems}>
											{selectedItems.kpiList.map((id) => {
												const kpi = filteredKPICalculators.find(
													(k) => k.id == id,
												);
												return (
													<div key={id} className={styles.selectedItem}>
														<span>{kpi?.tableVersion}</span>
														<button
															onClick={() => removeKPI(id)}
															className={styles.removeButton}
														>
															×
														</button>
													</div>
												);
											})}
										</div>
									</div>
									{/* Variables Dropdown */}
									{/* Formula Section */}
								</div>
								<div className={styles.section}>
									<div className={styles.sectionHeader}>
										<h2 className={styles.sectionTitle} style={{ marginTop: '1rem' }}>Cài đặt công thức tính</h2>
									</div>
									<div className={styles.sectionContent}>
										<div className={styles.formulaSection}>
											<label className={styles.label2}>Công thức:</label>
											<input
												type="text"
												className={`${styles.formulaInput} ${formulaError ? styles.inputError : ''
												}`}
												value={formula}
												onChange={(e) => handleFormulaChange(e.target.value)}
											/>
											{formulaError && (
												<p className={styles.errorText}>{formulaError}</p>
											)}
											<p className={styles.helpText}>
												Sử dụng các biến là các chữ cái viết thường (a, b, c, d,... ) và toán tử
												(+, -, *, /) để tính
												KPI
											</p>
										</div>

										<div className={styles.variableDefinitionSection}>
											<label className={styles.label2}>Định nghĩa biến:</label>
											<div className={styles.variablesContainer}>
												{Object.entries(variables).map(([variable, v]) => (
													<div key={variable} className={styles.variableBox}>
														<div className={styles.variableHeader}>
                                                            <span className={styles.variableLabel}>
                                                                {variable} = Đo lường
                                                            </span>
															<div className={styles.variableControls}>
																<select
																	className={styles.variableSelect}
																	value={v.id}
																	onChange={(e) =>
																		handleVariableChange(
																			variable,
																			'id',
																			e.target.value,
																		)
																	}
																>
																	<option value="">
																	    Chọn đo lường
																	</option>
																	{ selectedItems.kpiList.map((id) => {
																			const kpi = filteredKPICalculators.find(
																				(k) => k.id == id,
																			);
																			return (
																				<option key={id} value={id}>
																					{kpi?.tableVersion}
																				</option>
																			);
																		})
																	}
																</select>
																<button
																	className={styles.removeVariableButton}
																	onClick={() => handleRemoveVariable(variable)}
																	title="Remove variable"
																>
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="0 0 20 20"
																		fill="currentColor"
																		className={styles.removeIcon}
																	>
																		<path
																			fillRule="evenodd"
																			d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
																			clipRule="evenodd"
																		/>
																	</svg>
																</button>
															</div>
														</div>
													</div>
												))}
											</div>
											<button
												className={styles.addVariableButton}
												onClick={handleAddVariable}
											>
												+ Thêm biến mới
											</button>
										</div>
									</div>
								</div>

								{/* Save Button - Only shown when there are changes */}
								<div className={styles.actionButtons}>
									<Popover

										title="Cảnh báo thay đổi chu kỳ"
										content={
											<div>
												<p>Bạn đã thay đổi chỉ số. Benchmark cũ sẽ bị xóa sạch.</p>
												<p>Bạn có muốn tiếp tục không?</p>
												<div style={{
													display: 'flex',
													justifyContent: 'flex-end',
													marginTop: '10px',
												}}>
													<Button onClick={handleCancelPeriodChange}
															style={{ marginRight: '10px' }}>
														Hủy
													</Button>
													<Button type="primary" onClick={handleConfirmPeriodChange}>
														Đồng ý
													</Button>
												</div>
											</div>
										}
										open={showPeriodChangeWarning}
									>
										<Button
											className={styles.saveButton}
											onClick={handleSave}
											disabled={loading}
										>
											{loading ? 'Đang lưu ...' : 'Lưu thay đổi'}
										</Button>
									</Popover>
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab == 'benchmark' && (
					<div>
						<div className={styles.section}>
							<div className={styles.sectionHeader}>
								<h2 className={styles.sectionTitle}>Benchmark <PencilLine cursor={'pointer'}
																						  onClick={() => setIsModalEditBenchmarkOpen(true)} />
								</h2>
					{period == 'month' && (
						<div style={{ display: 'flex', gap: '8px' }}>
							<Button size="small" onClick={async () => {
								try {
									const list = await getAllKpiBenchmark();
									// Filter benchmarks based on accessible business categories
									const accessibleCategoryIds = accessibleBusinessCategories.map(cat => cat.id);
									const filteredBenchmarks = (Array.isArray(list) ? list : []).filter(benchmark => {
										// Check if benchmark's business_category_id is in accessible categories
										const benchmarkCategoryId = benchmark?.info?.business_category_id;
										return !benchmarkCategoryId || accessibleCategoryIds.includes(benchmarkCategoryId);
									});
									setKpiBenchmarks(filteredBenchmarks);
									setIsSelectBenchmarkOpen(true);
								} catch (e) {
									message.error('Không thể tải KPI Benchmark');
								}
							}}>Lấy benchmark</Button>
							<Button 
								size="small" 
								danger
								onClick={async () => {
									if (!selectedKpi) return;
									
									try {
										setLoading(true);
										
										// Xóa tất cả dữ liệu benchmark3
										const updatedBenchmark = { ...(selectedKpi.benchmark || {}) };
										
										// Xóa tất cả benchmark3 data từ các ngày
										Object.keys(updatedBenchmark).forEach(dateKey => {
											if (updatedBenchmark[dateKey] && updatedBenchmark[dateKey].benchmark3 !== undefined) {
												delete updatedBenchmark[dateKey].benchmark3;
											}
										});
										
										// Xóa tên benchmark3
										delete updatedBenchmark.__benchmark3_name;
										
										// Cập nhật state local
										setSelectedKpi({ 
											...selectedKpi, 
											benchmark: updatedBenchmark, 
											benchmark3_name: null 
										});
										
										// Lưu vào database
										await updateKpi2Calculator({ 
											id: selectedKpi.id, 
											benchmark: updatedBenchmark, 
											benchmark3_name: null 
										});
										
										message.success('Đã xóa dữ liệu benchmark 3');
										
										// Trigger refresh để cập nhật tất cả tabs
										setRefreshTrigger(prev => prev + 1);
										
									} catch (error) {
										console.error('Error clearing benchmark 3:', error);
										message.error('Lỗi khi xóa dữ liệu benchmark 3');
									} finally {
										setLoading(false);
									}
								}}
								disabled={loading}
							>
								Xóa benchmark đã lấy
							</Button>
						</div>
					)}
							</div>
							{validationError ?
								<>
									{/*<Alert type={'error'} message={<div>*/}
									{/*    <div style={{color: 'red', fontSize:14}}>Dữ liệu nguồn hoặc biến số kinh doanh sử dụng trước đó bị xóa hoặc không tồn tại</div>*/}
									{/*    <div>*/}
									{/*      <span style={{color: '#454545', fontSize:12}}>*/}
									{/*          <i>*/}
									{/*              {JSON.stringify(validationError)}*/}
									{/*          </i>*/}
									{/*      </span>*/}
									{/*    </div>*/}

									{/*</div>} />*/}

								</>
								:
								<>
								</>}
							<div className={styles.sectionContent}>
								{tableData.length > 0 ? (
									<div
										style={{
											height: '520px',
											display: 'flex',
											flexDirection: 'column',
											position: 'relative',
											marginTop: '15px',
										}}
									>
										{loading && (
											<div
												style={{
													display: 'flex',
													justifyContent: 'center',
													alignItems: 'center',
													height: '100%',
													position: 'absolute',
													width: '100%',
													zIndex: '1000',
													backgroundColor: 'rgba(255, 255, 255, 0.96)',
												}}
											>
												<img src="/loading_moi_2.svg" alt="Loading..."
													 style={{ width: '650px', height: '550px' }} />
											</div>
										)}
										<div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
											<AgGridReact
												enableRangeSelection={true}
												rowData={rowDataBenchmark}
												defaultColDef={defaultColDef}
												columnDefs={colDefBenchmark}
												onCellValueChanged={handleCellValueChanged}
												rowSelection="multiple"
												localeText={AG_GRID_LOCALE_VN}
												onGridReady={onGridReady}
											/>
										</div>
									</div>
								) : (
									<p>No results available yet.</p>
								)}
							</div>

							<Modal
								open={isModalEditBenchmarkOpen}
								onCancel={() => setIsModalEditBenchmarkOpen(false)}
								title="Chỉnh sửa tên Benchmark"
								footer={[
									<Button key="cancel" onClick={() => setIsModalEditBenchmarkOpen(false)}>
										Hủy
									</Button>,
									<Button
										key="save"
										type="primary"
										onClick={handleSaveBenchmarkNames}
										loading={loading}
									>
										Lưu
									</Button>,
								]}
							>
								<Typography style={{ color: 'red', fontStyle: 'italic' }}>(Lưu ý: Đặt tên để hiển thị
									Benchmark, nếu xoá trắng tên thì Benchmark sẽ không hiển thị)</Typography>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
									<Form layout="vertical">
										<Form.Item label="Benchmark 1 Name">
											<Input
												value={tempBenchmark1Name}
												onChange={(e) => setTempBenchmark1Name(e.target.value)}
												placeholder="Enter Benchmark 1 Name"
											/>
										</Form.Item>
										<Form.Item label="Benchmark 2 Name">
											<Input
												value={tempBenchmark2Name}
												onChange={(e) => setTempBenchmark2Name(e.target.value)}
												placeholder="Enter Benchmark 2 Name"
											/>
										</Form.Item>
									</Form>
								</div>
							</Modal>

						{/* Modal chọn KPI Benchmark */}
						<Modal
							open={isSelectBenchmarkOpen}
							onCancel={() => { setIsSelectBenchmarkOpen(false); setSelectedKpiBenchmark(null); }}
							title="Chọn KPI Benchmark"
							width={'85vw'}
							footer={[
								<Button key="cancel" onClick={() => { setIsSelectBenchmarkOpen(false); setSelectedKpiBenchmark(null); }}>Hủy</Button>,
								<Button
									key="apply"
									type="primary"
									disabled={!selectedKpiBenchmark}
									onClick={async () => {
										if (!selectedKpi || !selectedKpiBenchmark) return;
										try {
											// Ánh xạ col1..col12 -> benchmark3 theo tháng hiện tại của bảng
											const nowYear = new Date().getFullYear();
											const data = selectedKpiBenchmark.data || {};
											const bk = { ...(selectedKpi.benchmark || {}) };
											for (let m = 1; m <= 12; m += 1) {
												const dateKey = `Tháng ${m}/${nowYear}`;
												if (!bk[dateKey]) bk[dateKey] = {};
												bk[dateKey].benchmark3 = data[`col${m}`] ?? null;
											}
                                            // Ghi kèm tên vào JSON benchmark để không cần field riêng trên BE
                                            bk.__benchmark3_name = selectedKpiBenchmark.name;
                                            // Cập nhật state local để UI phản hồi
                                            setSelectedKpi({ ...selectedKpi, benchmark: bk, benchmark3_name: selectedKpiBenchmark.name });
                                            // Lưu DB (benchmark JSON mang theo __benchmark3_name)
                                            await updateKpi2Calculator({ id: selectedKpi.id, benchmark: bk, benchmark3_name: selectedKpiBenchmark.name });
											setIsSelectBenchmarkOpen(false);
											message.success('Đã áp dụng benchmark');
                                            // Refresh bảng/đồ thị
                                            await initData();
										} catch (err) {
											message.error('Lỗi áp dụng benchmark');
										}
									}}
								>
									Áp dụng
								</Button>
							]}
						>
							<div style={{ maxHeight: 520, overflow: 'auto' }}>
								<Table
									rowKey={(r) => r.id}
									dataSource={kpiBenchmarks}
									size="small"
									scroll={{ x: 'max-content' }}
									pagination={false}
									onRow={(record) => ({
										onClick: () => setSelectedKpiBenchmark(record)
									})}
									rowClassName={(record) => selectedKpiBenchmark && record.id === selectedKpiBenchmark.id ? 'ant-table-row-selected' : ''}
									rowSelection={{
										type: 'radio',
										onChange: (keys, rows) => setSelectedKpiBenchmark(rows?.[0] || null),
										selectedRowKeys: selectedKpiBenchmark ? [selectedKpiBenchmark.id] : []
									}}
									columns={[
										{ title: 'Tên', dataIndex: 'name', key: 'name', width: 200 },
										{ 
											title: 'Mô tả', 
											dataIndex: 'description', 
											key: 'description',
											width: 300,
											render: (text) => {
												if (!text) return '-';
												const truncated = text.length > 200 ? text.substring(0, 200) + '...' : text;
												return (
													<div style={{ fontSize: 12, color: '#666', lineHeight: '1.4' }}>
														{truncated}
													</div>
												);
											}
										},
										{ title: 'Danh mục', dataIndex: 'category', key: 'category', width: 150 },
										{ 
											title: 'Data (12 tháng)', 
											key: 'data',
											render: (_, record) => {
												const data = record?.data || {};
												return (
													<div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
														{Array.from({ length: 12 }, (_, i) => (
															<div key={i} style={{ border: '1px solid #eee', borderRadius: 6, padding: 8, background: '#fafafa' }}>
																<div style={{ fontSize: 12, color: '#666' }}>T{i + 1}</div>
																<div style={{ fontWeight: 600 }}>{data[`col${i + 1}`] ?? '-'}</div>
															</div>
														))}
													</div>
												);
											}
										}
									]}
								/>
							</div>
						</Modal>
						</div>
					</div>
				)}
				{activeTab == 'results' && (
					<div>
						<div className={styles.section}>
							<div className={styles.sectionHeader}>
								<h2 className={styles.sectionTitle}>Kết quả</h2>
							</div>
							{validationError ?
								<>
									{/*<Alert type={'error'} message={<div>*/}
									{/*  <div style={{color: 'red', fontSize:14}}>Dữ liệu nguồn hoặc biến số kinh doanh sử dụng trước đó bị xóa hoặc không tồn tại</div>*/}
									{/*  <div>*/}
									{/*      <span style={{color: '#454545', fontSize:12}}>*/}
									{/*          <i>*/}
									{/*              {JSON.stringify(validationError)}*/}
									{/*          </i>*/}
									{/*      </span>*/}
									{/*  </div>*/}

									{/*</div>} />*/}

								</>
								:
								<>
								</>}
							<div className={styles.sectionContent}>
								{tableData.length > 0 ? (
									<div className={styles.tableContainer}>
										<Table
											columns={prepareTableData().columns}
											dataSource={prepareTableData().data}
											pagination={false}
											scroll={{ x: 'max-content' }}
											bordered
											size="middle"
										/>
										<div>
											{options && <AgCharts options={options} />}
										</div>
									</div>
								) : (
									<div className={styles.noTableMessage}>
										Chưa đủ cấu hình hoặc đã có lỗi ở các cột nên không thể hiện được bảng
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default KPI2Content;

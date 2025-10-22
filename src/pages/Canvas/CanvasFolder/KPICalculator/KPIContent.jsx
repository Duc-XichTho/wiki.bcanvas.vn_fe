import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import styles from './KPICalculator.module.css';
import { format, getMonth, getISOWeek, getISOWeekYear, getYear, isValid, parse } from 'date-fns';
import { evaluate } from 'mathjs';
// Removed auto-persist from compute flow; saving is done explicitly on Save
import { createTimestamp } from '../../../../generalFunction/format.js';

const KPIContent = ({
						selectedKpi,
						activeTab,
						setActiveTab,
						monthlyData,
						onSave,
						onNameUpdate,
						templateList,
						templateColumns,
						templateData,
						onTemplateChange,
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
					}) => {
	const [formData, setFormData] = useState({
		id: '',
		name: '',
		generalName: '',
		unit: '',
		code: '',
		period: 'month',
		dataSource: '',
		periodField: '',
		calcType: 'single',
	});
	const [hasChanges, setHasChanges] = useState(false);
	// Helper function to get color for buttons
	const getButtonColor = (index = 0) => {
		if (!selectedColors || selectedColors.length === 0) {
			return '#13C2C2'; // Default color
		}
		const color = selectedColors[index % selectedColors.length]?.color || '#13C2C2';
		return color;
	};
	const [isEditingName, setIsEditingName] = useState(false);
	const [templateSearchTerm, setTemplateSearchTerm] = useState('');
	const [tempName, setTempName] = useState('');
	const [formula, setFormula] = useState('');
	const [variables, setVariables] = useState({});
	const [conditions, setConditions] = useState([]);
	const [tableData, setTableData] = useState([]);
	const [formulaError, setFormulaError] = useState('');
	const [variableCalcTypes, setVariableCalcTypes] = useState({});
	const [isCalculating, setIsCalculating] = useState(false);
	const [hasPreview, setHasPreview] = useState(false);
	const dataReady = Array.isArray(templateData) && templateData.length > 0 && Array.isArray(templateColumns) && templateColumns.length > 0;

	useEffect(() => {
		if (selectedKpi) {
			setFormData({
				id: selectedKpi.id,
				name: selectedKpi.name || '',
				generalName: selectedKpi.generalName || '',
				unit: selectedKpi.unit || '',
				code: selectedKpi.code || '',
				period: selectedKpi.period || 'month',
				dataSource: selectedKpi.dataSource || '',
				periodField: selectedKpi.periodField || '',
				calcType: selectedKpi.calcType || 'single',
			});
			setTempName(selectedKpi.name || '');
			setHasChanges(false);
			setIsEditingName(false);
			setHasPreview(false);
			// Khi chọn KPI, ưu tiên hiển thị dữ liệu đã tính sẵn nếu có
			if (selectedKpi.tableData && Array.isArray(selectedKpi.tableData)) {
				setTableData(selectedKpi.tableData);
			} else {
				setTableData([]);
			}
			if (selectedKpi.calc) {
				const calcData = JSON.parse(selectedKpi.calc);
				setFormula(calcData.formula || '');
				setVariables(calcData.variables || {});
				setConditions(calcData.conditions || []);
				setVariableCalcTypes(calcData.variableCalcTypes || {});
			} else {
				setFormula('');
				setVariables({});
				setConditions([]);
				setVariableCalcTypes({});
			}
			// Tự động tải cấu trúc cột nếu KPI đã có nguồn dữ liệu (không tải rows)
			if (selectedKpi.dataSource) {
				onTemplateChange(selectedKpi.dataSource, { onlyColumns: true });
			} else {
				// Clear columns/data if no dataSource to avoid stale state
				onTemplateChange(null, { clear: true });
			}
		}
	}, [selectedKpi]);

	useEffect(() => {
		loadData();
	}, [variables, formData, templateData, templateColumns, formula, conditions]);

	useEffect(() => {
		// Format date values when periodField changes
		if (formData.periodField) {
			const updatedConditions = conditions.map((condition) => {
				if (condition.field == formData.periodField && condition.value) {
					return {
						...condition,
						value: formatDateForComparison(condition.value),
					};
				}
				return condition;
			});

			if (JSON.stringify(updatedConditions) !== JSON.stringify(conditions)) {
				setConditions(updatedConditions);
			}
		}
	}, [formData.periodField]);

	const loadData = async (customCalcTypes = null) => {
		try {
			if (
				!templateData.length ||
				!templateColumns.length ||
				typeof variables !== 'object' ||
				variables == null
			)
				return;

			const calcTypesToUse = customCalcTypes || variableCalcTypes;
			const periodColumn = templateColumns.find((column) => column.id == formData.periodField);
			if (!periodColumn) return;

		const periodName = periodColumn.columnName;
		const periodType = formData.period;
		const groupedData = {};

		// Filter data based on conditions first
		let filteredData = [...templateData];
		// Apply conditions to filter data
		if (conditions.length > 0) {filteredData = filteredData.filter((data) => {
			let result = null;

			for (let i = 0; i < conditions.length; i++) {
				const condition = conditions[i];
				const column = templateColumns.find((col) => col.id == condition.field);
				if (!column) continue;

				const columnName = column.columnName;
				let dataValue = data[columnName];

				// Date comparison
				if (condition.field == formData.periodField) {
					if (!dataValue) return false;

					let dataDate;
					try {
						dataDate = new Date(dataValue);
						if (!isValid(dataDate)) {
							if (dataValue.includes('/')) {
								const parts = dataValue.split('/');
								if (parts.length === 3) {
									dataDate = parse(dataValue, 'dd/MM/yyyy', new Date());
								}
							} else if (dataValue.includes('-')) {
								dataDate = parse(dataValue, 'yyyy-MM-dd', new Date());
							}
						}
					} catch (e) {
						console.error('Error parsing date:', e);
						return false;
					}

					if (!isValid(dataDate)) return false;

					const conditionDate = new Date(condition.value);
					if (!isValid(conditionDate)) return false;

					const isSameDate =
						dataDate.getFullYear() === conditionDate.getFullYear() &&
						dataDate.getMonth() === conditionDate.getMonth() &&
						dataDate.getDate() === conditionDate.getDate();

					var currentResult = false;
					switch (condition.operator) {
						case '>':
							currentResult = dataDate > conditionDate;
							break;
						case '>=':
							currentResult = dataDate >= conditionDate;
							break;
						case '<':
							currentResult = dataDate < conditionDate;
							break;
						case '<=':
							currentResult = dataDate <= conditionDate;
							break;
						case '=':
							currentResult = isSameDate;
							break;
						case '!=':
							currentResult = !isSameDate;
							break;
						default:
							currentResult = true;
					}
				}
				// String comparison
				else if (typeof dataValue === 'string' || typeof condition.value === 'string') {
					// Kiểm tra nếu là trường ngày, tháng hoặc năm
					if (column.columnName === 'Ngày' || column.columnName === 'Tháng' || column.columnName === 'Năm') {
						// Xử lý đặc biệt cho trường "Tháng" với giá trị TRUE/FALSE
						if (column.columnName === 'Tháng' && 
							(dataValue === 'TRUE' || dataValue === 'FALSE') && 
							(condition.value === 'TRUE' || condition.value === 'FALSE')) {

							switch (condition.operator) {
								case '=':
									currentResult = dataValue === condition.value;
									break;
								case '!=':
									currentResult = dataValue !== condition.value;
									break;
								default:
									currentResult = true;
							}
						} else {
							// Xử lý như số cho các trường khác
							const dataNum = parseInt(dataValue);
							const conditionNum = parseInt(condition.value);

							if (!isNaN(dataNum) && !isNaN(conditionNum)) {
								switch (condition.operator) {
									case '>':
										currentResult = dataNum > conditionNum;
										break;
									case '>=':
										currentResult = dataNum >= conditionNum;
										break;
									case '<':
										currentResult = dataNum < conditionNum;
										break;
									case '<=':
										currentResult = dataNum <= conditionNum;
										break;
									case '=':
										currentResult = dataNum === conditionNum;
										break;
									case '!=':
										currentResult = dataNum !== conditionNum;
										break;
									default:
										currentResult = true;
								}
							} else {
								currentResult = false;
							}
						}
					} else {
						// Xử lý so sánh chuỗi như cũ
						const dataStr = (dataValue || '').toString().toLowerCase();
						const conditionStr = (condition.value || '').toString().toLowerCase();

						switch (condition.operator) {
							case '=':
								currentResult = dataStr === conditionStr;
								break;
							case '!=':
								currentResult = dataStr !== conditionStr;
								break;
							case 'contains':
								currentResult = dataStr.includes(conditionStr);
								break;
							case 'not contains':
								currentResult = !dataStr.includes(conditionStr);
								break;
							default:
								currentResult = true;
						}
					}
				}
				// Number comparison
				else {
					if (isNaN(dataValue) || dataValue === '' || dataValue === null) return false;

					const dataNum = parseFloat(dataValue);
					const conditionNum = parseFloat(condition.value);

					switch (condition.operator) {
						case '>':
							currentResult = dataNum > conditionNum;
							break;
						case '>=':
							currentResult = dataNum >= conditionNum;
							break;
						case '<':
							currentResult = dataNum < conditionNum;
							break;
						case '<=':
							currentResult = dataNum <= conditionNum;
							break;
						case '=':
							currentResult = dataNum == conditionNum;
							break;
						case '!=':
							currentResult = dataNum !== conditionNum;
							break;
						default:
							currentResult = true;
					}
				}

				// Combine with previous result based on logic
				if (i === 0) {
					result = currentResult;
				} else {
					const logic = condition.logic || 'AND';
					if (logic === 'AND') {
						result = result && currentResult;
					} else if (logic === 'OR') {
						result = result || currentResult;
					}
				}
			}

			return result;
		});
		}
		// Debug log removed to avoid noisy console output
		// Process and group data
		filteredData.forEach((data) => {
			// Extract variable values
			const newData = {};
			let hasValidVariables = true;

			for (const variableKey in variables) {
				const variableColumn = templateColumns.find(
					(column) => column.id == variables[variableKey].field,
				);
				if (!variableColumn) {
					hasValidVariables = false;
					break;
				}

				const variableName = variableColumn.columnName;
				let dataValue = data[variableName];

				// Convert undefined, null, or empty string to 0 instead of skipping the row
				if (dataValue === undefined || dataValue === null || dataValue === '') {
					dataValue = 0;
				}

				// Keep existing guard for truly invalid values like non-numeric strings
				if (isNaN(parseFloat(dataValue))) {
					hasValidVariables = false;
					break;
				}

				dataValue = parseFloat(dataValue);
				newData[variableKey] = dataValue;
			}

			if (!hasValidVariables || !Object.keys(newData).length) return;

			// Format period key
			const dateValue = data[periodName];
			if (!dateValue) return;

			// Parse the date properly
			let date;
			try {
				// Try to parse as ISO date first
				date = new Date(dateValue);

				// If invalid, try other formats
				if (!isValid(date)) {
					// Try DD/MM/YYYY format
					if (dateValue.includes('/')) {
						const parts = dateValue.split('/');
						if (parts.length == 3) {
							date = parse(dateValue, 'dd/MM/yyyy', new Date());
						}
					}

					// Try YYYY-MM-DD format
					if (dateValue.includes('-')) {
						date = parse(dateValue, 'yyyy-MM-dd', new Date());
					}
				}
			} catch (e) {
				console.error('Error parsing date:', e);
				return; // Skip this data point if date is invalid
			}

			if (!isValid(date)) {
				console.warn('Invalid date:', dateValue);
				return; // Skip this data point if date is invalid
			}

			// Generate period key based on selected period type
			let periodKey;
			const year = getYear(date);

			if (periodType == 'day') {
				periodKey = format(date, 'dd/MM/yyyy');
			} else if (periodType == 'week') {
				const weekNumber = getISOWeek(date);
				const isoYear = getISOWeekYear(date);
				periodKey = `Tuần ${weekNumber}/${isoYear}`;
			} else if (periodType == 'month') {
				const monthNumber = getMonth(date) + 1;
				periodKey = `Tháng ${monthNumber}/${year}`;
			} else {
				// Fallback
				periodKey = format(date, 'dd/MM/yyyy');
			}

			newData.date = dateValue;
			newData.periodKey = periodKey;
			newData._originalDate = date; // Store the parsed date for sorting

			// Group data by period
			if (groupedData[periodKey]) {
				Object.keys(newData).forEach((key) => {
					if (key !== 'date' && key !== 'periodKey' && key !== '_originalDate') {
						const variableKey = key;
						const calcType = calcTypesToUse[variableKey] || 'sum';
						if (calcType == 'count') {
							// For COUNT, we increment the counter
							groupedData[periodKey][key] = (groupedData[periodKey][key] || 0) + 1;
						} else if (calcType == 'avg') {
							// For AVG, we need to track sum and count separately
							if (!groupedData[periodKey][`${key}_sum`]) {
								groupedData[periodKey][`${key}_sum`] = 0;
								groupedData[periodKey][`${key}_count`] = 0;
							}
							groupedData[periodKey][`${key}_sum`] += newData[key];
							groupedData[periodKey][`${key}_count`] += 1;
							// Calculate average
							groupedData[periodKey][key] =
								groupedData[periodKey][`${key}_sum`] /
								groupedData[periodKey][`${key}_count`];
						} else {
							// Default SUM behavior
							groupedData[periodKey][key] =
								(groupedData[periodKey][key] || 0) + newData[key];
						}
					}
				});

				// Keep the earliest date for sorting
				if (newData._originalDate < groupedData[periodKey]._originalDate) {
					groupedData[periodKey]._originalDate = newData._originalDate;
				}
			} else {
				// Initialize new period data
				const periodData = { ...newData };

				// Initialize tracking for AVG calculations
				Object.keys(newData).forEach((key) => {
					if (key !== 'date' && key !== 'periodKey' && key !== '_originalDate') {
						const variableKey = key.toUpperCase();
						const calcType = calcTypesToUse[variableKey] || 'sum';

						if (calcType == 'count') {
							periodData[key] = 1; // Start count at 1
						} else if (calcType == 'avg') {
							periodData[`${key}_sum`] = newData[key];
							periodData[`${key}_count`] = 1;
							// Initial average is just the value itself
							periodData[key] = newData[key];
						}
						// For SUM, we already have the initial value
					}
				});

				groupedData[periodKey] = periodData;
			}
		});

		// Clean up tracking properties before evaluation
		Object.values(groupedData).forEach((data) => {
			Object.keys(data).forEach((key) => {
				if (key.endsWith('_sum') || key.endsWith('_count')) {
					delete data[key];
				}
			});
		});

		// Convert to array and sort by date
		let tableData = Object.values(groupedData)
			.map((data) => {
				try {
					return {
						value: evaluate(formula, data),
						date: data.periodKey,
						_originalDate: data._originalDate,
					};
				} catch (error) {
					console.error('Error evaluating formula:', error);
					return {
						value: null,
						date: data.periodKey,
						_originalDate: data._originalDate,
					};
				}
			})
			.sort((a, b) => a._originalDate - b._originalDate)
			.map(({ _originalDate, ...item }) => item);

		// Xử lý lũy kế nếu calcType là 'cumulative'
		if (formData.calcType === 'cumulative') {
			let cumulativeValue = 0;
			tableData = tableData.map((item) => {
				if (item.value !== null && !isNaN(item.value)) {
					cumulativeValue += item.value;
					return {
						...item,
						value: cumulativeValue
					};
				}
				return item;
			});
		}
		setTableData(tableData);
		return tableData;
		} finally {
			// loading state is managed by preview/save actions
		}
	};

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		setHasChanges(true);
		setHasPreview(false);
	};

	const handleSave = async () => {
		let hideLoading;
		try {
			hideLoading = message.loading('Đang lưu thay đổi...', 0);
			const updatedFormData = {
			...formData,
			calc: JSON.stringify({
				formula,
				variables,
				conditions,
				variableCalcTypes,
			}),
			tableData: tableData,
			updated_at: createTimestamp(),
			};
			// Lưu cấu hình và kết quả hiện có
			await onSave(updatedFormData);
			setHasChanges(false);
			setHasPreview(false);
			message.success('Đã lưu thay đổi');
		} catch (e) {
			console.error(e);
			message.error('Lưu thất bại');
		} finally {
			if (hideLoading) hideLoading();
		}
	};

	const handlePreview = async () => {
		// Lấy toàn bộ templateData để tính bảng mà không lưu
		if (!formData.dataSource) return;
		setIsCalculating(true);
		let hideLoading;
		try {
			hideLoading = message.loading('Đang tính toán...', 0);
			// Nếu đã có dữ liệu và cột hiện tại, không cần gọi lại; tính luôn
			if (Array.isArray(templateData) && templateData.length > 0 && Array.isArray(templateColumns) && templateColumns.length > 0) {
				await loadData();
				setHasPreview(true);
				message.success('Tính toán hoàn tất');
				return;
			}
			// Chưa có dữ liệu -> tải và tính
			await onTemplateChange(formData.dataSource);
			await loadData();
			setHasPreview(true);
			message.success('Tính toán hoàn tất');
		} catch (e) {
			console.error(e);
			message.error('Tính toán thất bại');
		} finally {
			setIsCalculating(false);
			if (hideLoading) hideLoading();
		}
	};

	const handleRecomputeAndSave = async () => {
		if (!formData.dataSource) return;
		setIsCalculating(true);
		let hideLoading;
		try {
			hideLoading = message.loading('Đang tính và lưu...', 0);
			// Ensure data available
			if (!(Array.isArray(templateData) && templateData.length > 0 && Array.isArray(templateColumns) && templateColumns.length > 0)) {
				await onTemplateChange(formData.dataSource);
			}
			const recalculated = await loadData();
			const updatedFormData = {
				...formData,
				calc: JSON.stringify({
					formula,
					variables,
					conditions,
					variableCalcTypes,
				}),
				tableData: recalculated,
				updated_at: createTimestamp(),
			};
			console.log(updatedFormData)
			await onSave(updatedFormData);
			setHasChanges(false);
			setHasPreview(true);
			message.success('Đã tính lại và lưu');
		} catch (e) {
			console.error(e);
			message.error('Tính lại hoặc lưu thất bại');
		} finally {
			setIsCalculating(false);
			if (hideLoading) hideLoading();
		}
	};

	const handleNameEdit = () => {
		setIsEditingName(true);
	};

	const handleNameSave = () => {
		if (tempName.trim()) {
			handleInputChange('name', tempName);
			onNameUpdate(selectedKpi.id, tempName);
			setIsEditingName(false);
		}
	};

	const handleNameCancel = () => {
		setTempName(formData.name);
		setIsEditingName(false);
	};

	const handleDataSourceChange = (value) => {
		handleInputChange('dataSource', value);
		// Khi chọn nguồn dữ liệu, cần tải ngay cấu trúc cột để tiếp tục cấu hình
		if (value) {
			onTemplateChange(value, { onlyColumns: true });
			handleInputChange('periodField', '');
		}
	};

	const handleFormulaChange = (value) => {
		setFormula(value.toLowerCase());
		setHasChanges(true);
		setHasPreview(false);
		validateFormula(value.toLowerCase(), variables);
	};

	const handleAddVariable = () => {
		const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
		const unusedLetter = alphabet.find((letter) => !variables[letter]);

		if (unusedLetter) {
			setVariables((prev) => ({
				...prev,
				[unusedLetter]: {
					field: '',
				},
			}));

			setVariableCalcTypes((prev) => ({
				...prev,
				[unusedLetter]: 'sum',
			}));

			setHasChanges(true);
			setHasPreview(false);
		}
	};

	const handleRemoveVariable = (variable) => {
		const newVariables = { ...variables };
		delete newVariables[variable];
		setVariables(newVariables);

		const newCalcTypes = { ...variableCalcTypes };
		delete newCalcTypes[variable];
		setVariableCalcTypes(newCalcTypes);

		setHasChanges(true);
		setHasPreview(false);
		validateFormula(formula, newVariables);
	};

	const handleVariableChange = (variable, field, value) => {
		setVariables((prev) => ({
			...prev,
			[variable]: { ...prev[variable], [field]: value },
		}));
		setHasChanges(true);
		setHasPreview(false);
		validateFormula(formula, {
			...variables,
			[variable]: { ...variables[variable], [field]: value },
		});
	};

	const handleAddCondition = () => {
		setConditions([
			...conditions,
			{
				field: '',
				operator: '=',
				value: '',
			},
		]);
		setHasChanges(true);
		setHasPreview(false);
	};

	const handleRemoveCondition = (index) => {
		const newConditions = [...conditions];
		newConditions.splice(index, 1);
		setConditions(newConditions);
		setHasChanges(true);
		setHasPreview(false);
	};

	const handleConditionChange = (index, field, value) => {
		const newConditions = [...conditions];

		// If this is a date field and we're changing the value, ensure proper format
		if (field == 'value' && newConditions[index].field == formData.periodField) {
			newConditions[index] = {
				...newConditions[index],
				[field]: value,
			};
		} else {
			newConditions[index] = {
				...newConditions[index],
				[field]: value,
			};

			// If we're changing the field to a date field, reset the value
			if (field == 'field' && value == formData.periodField) {
				newConditions[index].value = '';
			}
		}

		setConditions(newConditions);
		setHasChanges(true);
		setHasPreview(false);
	};

	const validateFormula = (formula, vars) => {
		const usedVariables = formula.match(/[a-z]/g) || [];
		const uniqueUsedVariables = [...new Set(usedVariables)];
		const undefinedVariables = uniqueUsedVariables.filter((v) => !vars[v]);
		if (undefinedVariables.length > 0) {
			setFormulaError(`Biến ${undefinedVariables.join(', ')} chưa được định nghĩa`);
			return false;
		}
		const unusedVariables = Object.keys(vars).filter((v) => !usedVariables.includes(v));
		const incompleteVariables = Object.entries(vars).filter(([_, v]) => !v.field);

		if (unusedVariables.length > 0) {
			setFormulaError(
				`Biến ${unusedVariables.join(', ')} không được sử dụng trong công thức`,
			);
			return false;
		}

		if (incompleteVariables.length > 0) {
			setFormulaError(
				`Biến ${incompleteVariables.map(([k]) => k).join(', ')} chưa chọn trường dữ liệu`,
			);
			return false;
		}

		setFormulaError('');
		return true;
	};

	const conditionOperators = [
		{ value: '=', label: '=' },
		{ value: '!=', label: '≠' },
		{ value: '>', label: '>' },
		{ value: '<', label: '<' },
		{ value: '>=', label: '≥' },
		{ value: '<=', label: '≤' },
	];

	const handleVariableCalcTypeChange = (variable, calcType) => {
		const newCalcTypes = {
			...variableCalcTypes,
			[variable]: calcType,
		};

		setVariableCalcTypes(newCalcTypes);
		setHasChanges(true);

		loadData(newCalcTypes);
	};

	// Add this helper function
	const formatDateForComparison = (dateString) => {
		if (!dateString) return '';

		try {
			const date = new Date(dateString);
			if (!isValid(date)) return dateString;

			// Format as YYYY-MM-DD for HTML date input
			return format(date, 'yyyy-MM-dd');
		} catch (e) {
			console.error('Error formatting date:', e);
			return dateString;
		}
	};

	return (
		<div className={styles.mainSection}>
			{/*{isCalculating && (*/}
			{/*	<div style={{*/}
			{/*		position: 'absolute',*/}
			{/*		top: 0,*/}
			{/*		left: 0,*/}
			{/*		right: 0,*/}
			{/*		bottom: 0,*/}
			{/*		display: 'flex',*/}
			{/*		justifyContent: 'center',*/}
			{/*		alignItems: 'center',*/}
			{/*		backgroundColor: 'rgba(255, 255, 255, 0.5)',*/}
			{/*		backdropFilter: 'blur(6px)',*/}
			{/*		zIndex: 1000,*/}
			{/*	}}>*/}
			{/*		<Loading3DTower />*/}
			{/*	</div>*/}
			{/*)}*/}
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
							Cài đặt đo lường:  {selectedKpi ? formData.name : 'Chọn KPI'}
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

			<div className={styles.tabContent}>
				{activeTab == 'definition' && (
					<div>

						<div className={styles.section}>
							<div className={styles.sectionHeader}>
								<h2 className={styles.sectionTitle}>Nguồn dữ liệu</h2>
							</div>
							<div className={styles.sectionContent}>
								<div className={styles.dataSourceContainer}>
							<select
										className={styles.select}
										value={formData.dataSource}
										onChange={(e) => handleDataSourceChange(e.target.value)}
										style={{ width: '32%' }}
									>
										<option value="">Chọn nguồn dữ liệu</option>
								{templateList
									.filter((t) =>
										(t.fileNoteName || t.name || '')
											.toString()
											.toLowerCase()
											.includes(templateSearchTerm.toLowerCase().trim())
									)
									.map((template) => (
											<option key={template.id} value={template.approveVersion_id}>
												{template.fileNoteName}
											</option>
								))}
									</select>
								</div>
							</div>
						</div>

						<div className={styles.section}>
							<div className={styles.sectionHeader}>
								<h2 className={styles.sectionTitle}>Phạm vi tính toán</h2>
							</div>
							<div className={styles.sectionContent}>
								<div className={styles.gridContainer}>
									<div className={styles.formGroup}>
										<label className={styles.label}>Chu kỳ tính toán:</label>
										<select
											className={styles.select}
											value={formData.period}
											onChange={(e) =>
												handleInputChange('period', e.target.value)
											}
										>
											<option value="day">Ngày</option>
											<option value="week">Tuần</option>
											<option value="month">Tháng</option>
										</select>
										<p className={styles.helpText}>
											Đơn vị thời gian sử dụng để tính KPI
										</p>
									</div>
									<div className={styles.formGroup}>
										<label className={styles.label}>Trường ngày tháng:</label>
										<select
											className={styles.select}
											value={formData.periodField}
											onChange={(e) =>
												handleInputChange('periodField', e.target.value)
											}
											disabled={!formData.dataSource}
										>
											<option value="">Chọn trường ngày tháng</option>
											{templateColumns.map((column) => (
												<option key={column.id} value={column.id}>
													{column.columnName}
												</option>
											))}
										</select>
										<p className={styles.helpText}>
											Trường dữ liệu chứa thông tin thời gian
										</p>
									</div>
									<div className={styles.formGroup}>
										<label className={styles.label}>Kiểu tính toán:</label>
										<select
											className={styles.select}
											value={formData.calcType}
											onChange={(e) =>
												handleInputChange('calcType', e.target.value)
											}
										>
											<option value="single">Từng kỳ</option>
											<option value="cumulative">Lũy kế</option>
										</select>
										<p className={styles.helpText}>
											Cách tính giá trị: riêng từng kỳ hoặc lũy kế các kỳ
										</p>
									</div>
								</div>

							</div>
						</div>

						<div className={styles.section}>
							<div className={styles.sectionHeader}>
								<h2 className={styles.sectionTitle}>Công thức tính</h2>
							</div>
							<div className={styles.sectionContent}>
								<div className={styles.formulaSection}>
									<label className={styles.label}>Công thức:</label>
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
										Sử dụng các biến và toán tử (+, -, *, /) để tính KPI
									</p>
								</div>

								<div className={styles.variableDefinitionSection}>
									<h3 className={styles.variableTitle}>Định nghĩa biến</h3>
									<div className={styles.variablesContainer}>
										{Object.entries(variables).map(([variable, v]) => (
											<div key={variable} className={styles.variableBox}>
												<div className={styles.variableHeader}>
													<span className={styles.variableLabel}>
														{variable} =
													</span>
													<div className={styles.variableControls}>
														<select
															className={styles.variableSelect}
															value={v.field}
															onChange={(e) =>
																handleVariableChange(
																	variable,
																	'field',
																	e.target.value,
																)
															}
															disabled={!formData.dataSource}
														>
															<option value="">
																Chọn trường dữ liệu
															</option>
															{templateColumns.map((column) => (
																<option
																	key={column.id}
																	value={column.id}
																>
																	{column.columnName}
																</option>
															))}
														</select>

														<select
															className={styles.calcTypeSelect}
															value={
																variableCalcTypes[variable] || 'sum'
															}
															onChange={(e) =>
																handleVariableCalcTypeChange(
																	variable,
																	e.target.value,
																)
															}
														>
															<option value="sum">SUM</option>
															<option value="count">COUNT</option>
															<option value="avg">AVG</option>
														</select>
													</div>
													<button
														className={styles.removeVariableButton}
														onClick={() =>
															handleRemoveVariable(variable)
														}
														title="Xóa biến"
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
										))}
									</div>
									<button
										className={styles.addVariableButton}
										onClick={handleAddVariable}
									>
										+ Thêm biến mới
									</button>
								</div>
								<div className={styles.variableDefinitionSection}>
									<h3 className={styles.variableTitle}>Điều kiện lọc dữ liệu</h3>

									<div className={styles.variablesContainer}>
										{conditions.map((condition, index) => (
											<div key={index} className={styles.variableBox}>
												{index > 0 && (
													<select
														className={styles.logicSelect}
														value={condition.logic || 'AND'}
														onChange={(e) =>
															handleConditionChange(index, 'logic', e.target.value)
														}
													>
														<option value="AND">AND</option>
														<option value="OR">OR</option>
													</select>
												)}

												<div className={styles.variableHeader}>
													<div className={styles.variableControls}>
														<select
															className={styles.conditionSelect}
															value={condition.field}
															onChange={(e) =>
																handleConditionChange(
																	index,
																	'field',
																	e.target.value,
																)
															}
															disabled={!formData.dataSource}
														>
															<option value="">
																Chọn trường dữ liệu
															</option>
															{templateColumns.map((column) => (
																<option
																	key={column.id}
																	value={column.id}
																>
																	{column.columnName}
																</option>
															))}
														</select>
														<select
															className={styles.operatorSelect}
															value={condition.operator}
															onChange={(e) =>
																handleConditionChange(
																	index,
																	'operator',
																	e.target.value,
																)
															}
														>
															{conditionOperators.map((op) => (
																<option
																	key={op.value}
																	value={op.value}
																>
																	{op.label}
																</option>
															))}
														</select>

														{/* Conditionally render date input or number input */}
														{condition.field == formData.periodField ? (
															<input
																type="date"
																className={
																	styles.conditionDateValue
																}
																value={condition.value || ''}
																onChange={(e) => {
																	// Format the date value to ensure it's in the correct format
																	const dateValue =
																		e.target.value;
																	handleConditionChange(
																		index,
																		'value',
																		dateValue,
																	);
																}}
															/>
														) : (
															<input
																type="text"
																className={styles.conditionValue}
																value={condition.value || ''}
																onChange={(e) =>
																	handleConditionChange(
																		index,
																		'value',
																		e.target.value,
																	)
																}
																placeholder="Giá trị"
															/>
														)}
													</div>
													<button
														className={styles.removeConditionButton}
														onClick={() => handleRemoveCondition(index)}
														title="Xóa điều kiện"
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
										))}
									</div>
									<button
										className={styles.addVariableButton}
										onClick={handleAddCondition}
									>
										+ Thêm điều kiện lọc
									</button>
								</div>
								{tableData.length > 0 ? (
				<div className={styles.previewTableContainer}>
										<h3 className={styles.previewTitle}>Kết quả tính thử:</h3>
										<div className={styles.previewTableWrapper}>
											<table className={styles.previewTable}>
												<thead>
												<tr>
													{tableData.map((item, idx) => (
														<th
															key={idx}
															className={styles.previewHeader}
														>
															{item.date}
														</th>
													))}
												</tr>
												</thead>
												<tbody>
												<tr>
													{tableData.map((item, idx) => (
														<td
															key={idx}
															className={styles.previewCell}
														>
															{item.value !== null &&
															!isNaN(item.value)
																? `${Number(
																	item.value,
																).toLocaleString('vn-VN', {
																	minimumFractionDigits: 0,
																	maximumFractionDigits: 2,
																	useGrouping: true,
																})}`
																: '-'}
														</td>
													))}
												</tr>
												</tbody>
											</table>

										</div>
									</div>
								) : (
									<div className={styles.previewTableContainer}>
										<h3 className={styles.previewTitle}>Kết quả tính thử:</h3>
										<div className={styles.previewTableWrapper}>
											<div className={styles.noTableMessage}>
												{isCalculating ? <>
													Đang tính toán ...
												</> : <>
													Chưa đủ cấu hình hoặc đã có lỗi ở các cột nên không thể hiện được bảng
												</>}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>

				<div 
							className={styles.actionButtons}
							style={{
								'--tab-color-1': getButtonColor(0),
								'--tab-color-2': getButtonColor(1)
							}}
						>
					{hasChanges && !isCalculating && !dataReady && (
						<button 
							className={styles.saveButton} 
							onClick={handlePreview}
							disabled={!formData.dataSource}
						>
							Xem kết quả tính thử
						</button>
					)}
					{isCalculating && (
						<span className={styles.helpText}>Đang tính toán ...</span>
					)}
					<button 
						className={styles.saveButton} 
						onClick={handleRecomputeAndSave}
						disabled={!formData.dataSource || isCalculating}
						style={{ marginLeft: 8, marginRight: 8,}}
					>
						Tính lại và lưu
					</button>
					{hasChanges && !isCalculating && dataReady && (
						<button 
							className={styles.saveButton} 
							onClick={handleSave}
						>
							Lưu thay đổi
						</button>
					)}
						</div>
					</div>
				)}

				{activeTab == 'results' && (
					<div>
						<h2 className={styles.resultsTitle}>Bảng kết quả 12 kỳ gần nhất</h2>

						<div className={styles.tableContainer}>
							<table className={styles.resultsTable}>
								<thead>
								<tr>
									<th className={styles.tableHeader}>Chỉ số</th>
									{monthlyData.map((row, idx) => (
										<th key={idx} className={styles.tableHeader}>
											{row.period}
										</th>
									))}
								</tr>
								</thead>
								<tbody>
								<tr className={styles.tableRowAlternate}>
									<td className={styles.tableRowLabel}>Thực tế</td>
									{monthlyData.map((row, idx) => (
										<td key={idx} className={styles.tableCell}>
											{row.actual !== null ? `${row.actual}%` : '-'}
										</td>
									))}
								</tr>
								<tr>
									<td className={styles.tableRowLabel}>Mục tiêu kỳ</td>
									{monthlyData.map((row, idx) => (
										<td key={idx} className={styles.tableCell}>
											{row.target1}%
										</td>
									))}
								</tr>
								<tr className={styles.tableRowAlternate}>
									<td className={styles.tableRowLabel}>Kỳ vọng cao</td>
									{monthlyData.map((row, idx) => (
										<td key={idx} className={styles.tableCell}>
											{row.target2}%
										</td>
									))}
								</tr>
								<tr>
									<td className={styles.tableRowLabel}>Chênh lệch</td>
									{monthlyData.map((row, idx) => (
										<td
											key={idx}
											className={`${styles.tableCell} ${row.difference == null
												? ''
												: row.difference >= 0
													? styles.positiveVariance
													: styles.negativeVariance
											}`}
										>
											{row.difference !== null
												? `${row.difference > 0 ? '+' : ''}${row.difference
												}%`
												: '-'}
										</td>
									))}
								</tr>
								</tbody>
							</table>
						</div>

						<div className={styles.tableNote}>
							* Màu xanh: Vượt mục tiêu, Màu đỏ: Chưa đạt mục tiêu
						</div>

						<div className={styles.resultActions}>
							<button
								className={styles.backButton}
								onClick={() => setActiveTab('definition')}
							>
								Quay lại
							</button>
							<button 
								className={styles.exportButton}
							>
								Xuất báo cáo
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default KPIContent;

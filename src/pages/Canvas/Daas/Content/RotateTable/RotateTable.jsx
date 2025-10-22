import { Button, Modal, Checkbox, Space, Typography, Input, message, Popover, Card, Select, Row, Col } from 'antd';
import { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
	createBathTemplateRow,
	createTemplateColumn,
	createTemplateTable,
	getAllTemplateSheetTable,
} from '../../../../../apis/templateSettingService.jsx';
import { toast } from 'react-toastify';
import { createNewFileNotePad, getAllFileNotePad } from '../../../../../apis/fileNotePadService.jsx';
import { MyContext } from '../../../../../MyContext.jsx';
import { Template_Table_Type } from '../../../../../CONST.js';
import { useNavigate, useParams } from 'react-router-dom';
import css from '../Template/Template.module.css';
import { CloseOutlined } from '@ant-design/icons';
import { log } from 'mathjs';

const RotateTable = ({ rowDataGoc, columnsGoc, fileNote, motherTable, setLoading }) => {
	const [isOpen, setIsOpen] = useState(false);
	const { companySelect, buSelect, id } = useParams();
	const [isOpenCreated, setIsOpenCreated] = useState(false);
	const [selectedColumns, setSelectedColumns] = useState([]);
	const [cols, setCols] = useState([]);
	const [showPreview, setShowPreview] = useState(false);
	const [previewData, setPreviewData] = useState({ rows: [], columns: [], data: [] });
	const [groupColumnName, setGroupColumnName] = useState(null);
	const [valueColumnName, setValueColumnName] = useState(null);
	const { loadData, setLoadData } = useContext(MyContext);
	const [newFileName, setNewFileName] = useState(`${fileNote?.name} - (Xoay)`);
	const [isPopoverVisible, setIsPopoverVisible] = useState(false);
	const [columnNameError, setColumnNameError] = useState('');
	const [tabRotates, setTabRotates] = useState([]);
	const navigate = useNavigate();
	const [aggregation, setAggregation] = useState('sum');
	const [rowFields, setRowFields] = useState([]);
	const [columnFields, setColumnFields] = useState([]);
	const [valueFields, setValueFields] = useState([]);
	const [calculatedColumns, setCalculatedColumns] = useState([]);
	const [showRowTotal, setShowRowTotal] = useState(false);
	const [showColumnTotal, setShowColumnTotal] = useState(false);
	const [filters, setFilters] = useState([]);
	const [filterLogic, setFilterLogic] = useState('and');
	const [customValueFieldName, setCustomValueFieldName] = useState('');
	const [splitRowFieldsToColumns, setSplitRowFieldsToColumns] = useState(false);
	const [customTextColumns, setCustomTextColumns] = useState([]);
	const [newTextColumnName, setNewTextColumnName] = useState('');

	const [newCalcColumn, setNewCalcColumn] = useState({
		name: '',
		formula: '',
		variables: {},
		isPercent: false,
	});

	const operatorOptions = [
		{ value: 'eq', label: '=' },
		{ value: 'neq', label: '≠' },
		{ value: 'gt', label: '>' },
		{ value: 'lt', label: '<' },
		{ value: 'contains', label: 'chứa' },
		{ value: 'is_distinct', label: 'Gộp (Unique value)' },
	];

	const addFilter = () => {
		setFilters([
			...filters,
			{ column: '', operator: 'eq', value: '', logic: filters.length === 0 ? undefined : 'and' }
		]);
	};

	const updateFilter = (index, key, val) => {
		setFilters(filters.map((f, i) => i === index ? { ...f, [key]: val } : f));
	};

	const removeFilter = (index) => {
		setFilters(filters.filter((_, i) => i !== index));
	};

	// Hàm nhận diện kiểu dữ liệu cột
	const getColumnType = (col) => {
		// Lấy 10 giá trị đầu tiên khác null/undefined/''
		const samples = rowDataGoc.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '').slice(0, 10);
		if (samples.length === 0) return 'string';
		// Nếu tất cả là số
		if (samples.every(v => !isNaN(v) && v !== '')) return 'number';
		// Nếu tất cả parse được sang date
		if (samples.every(v => !isNaN(Date.parse(v)))) return 'date';
		return 'string';
	};
	useEffect(() => {
		if (!isOpen) {
			setSelectedColumns([]);
			setCols([]);
			setShowPreview(false);
			setPreviewData({ rows: [], columns: [], data: [] });
			setGroupColumnName(null);
			setValueColumnName(null);
			setNewFileName(`${fileNote?.name} - (Xoay)`);
			setIsPopoverVisible(false);
			setColumnNameError('');
			setTabRotates([]);
			setAggregation('sum');
			setRowFields([]);
			setColumnFields([]);
			setValueFields([]);
			setCalculatedColumns([]);
			setShowRowTotal(false);
			setShowColumnTotal(false);
			setFilters([]);
			setFilterLogic('and');
			setCustomValueFieldName('');
			setNewCalcColumn({ name: '', formula: '', variables: {}, isPercent: false });
			setSplitRowFieldsToColumns(false);
			setCustomTextColumns([]);
			setNewTextColumnName('');
		}
	}, [isOpen]);
	const applyFilters = (data) => {
		if (!filters.length) return data;

		// Xử lý đặc biệt cho is_distinct
		let filteredData = data;
		filters.forEach((f, filterIdx) => {
			if (f.operator === 'is_distinct' && f.column) {
				const groupByFields = rowFields.concat(columnFields);
				const grouped = {};

				filteredData.forEach(row => {
					const groupKey = groupByFields.map(field => row[field]).join('|');
					const distinctValue = row[f.column];
					if (!grouped[groupKey]) grouped[groupKey] = new Set();
					if (!grouped[groupKey].has(distinctValue)) {
						grouped[groupKey].add(distinctValue);
					}
				});

				// Lọc lại dữ liệu: chỉ giữ lại dòng đầu tiên cho mỗi giá trị distinct trong từng group
				const seen = {};
				filteredData = filteredData.filter(row => {
					const groupKey = groupByFields.map(field => row[field]).join('|');
					const distinctValue = row[f.column];
					const uniqueKey = groupKey + '|' + distinctValue;
					if (!seen[uniqueKey]) {
						seen[uniqueKey] = true;
						return true;
					}
					return false;
				});
			}
		});

		// Xử lý các filter còn lại (không phải is_distinct)
		return filteredData.filter((row, rowIdx, arr) => {
			const results = filters.map(f => {
				if (!f.column) return true;
				if (f.operator === 'is_distinct') return true; // đã xử lý ở trên
				const cell = row[f.column];
				const colType = getColumnType(f.column);

				let cellVal = cell;
				let filterVal = f.value;
				if (colType === 'number') {
					cellVal = Number(cell);
					filterVal = Number(f.value);
				} else if (colType === 'date') {
					cellVal = cell ? new Date(cell).getTime() : null;
					filterVal = f.value ? new Date(f.value).getTime() : null;
				} else {
					cellVal = (cell || '').toString().trim().toLowerCase();
					filterVal = (f.value || '').toString().trim().toLowerCase();
				}
				switch (f.operator) {
					case 'eq': return cellVal == filterVal;
					case 'neq': return cellVal != filterVal;
					case 'gt': return cellVal > filterVal;
					case 'lt': return cellVal < filterVal;
					case 'gte': return cellVal >= filterVal;
					case 'lte': return cellVal <= filterVal;
					case 'contains': return colType === 'string' ? cellVal.includes(filterVal) : false;
					default: return true;
				}
			});
			let result = results[0];
			for (let i = 1; i < results.length; i++) {
				const logic = filters[i].logic || 'and';
				if (logic === 'and') {
					result = result && results[i];
				} else {
					result = result || results[i];
				}
			}
			return result;
		});
	};

	const checkReservedColumnNames = (columns) => {
		return columns.some(col =>
			col.headerName === 'TỔNG HÀNG' ||
			col.headerName === 'TỔNG CỘT',
		);
	};
	const handleNewColumnNameChange = (e) => {
		const newName = e.target.value;
		if (newName === 'TỔNG HÀNG' || newName === 'TỔNG CỘT') {
			message.error('Không thể đặt tên cột là TỔNG HÀNG hoặc TỔNG CỘT');
			setNewCalcColumn(prev => ({ ...prev, name: '' }));
			return;
		}
		setNewCalcColumn(prev => ({ ...prev, name: newName }));
	};

	useEffect(() => {
		setNewFileName(`${fileNote?.name} - (Xoay)`);
	}, [isPopoverVisible]);

	async function getDataDaXoay() {
		let res = await getAllTemplateSheetTable();
		let fileNote = await getAllFileNotePad();
		res = res.filter(e => e.table_type == Template_Table_Type.ROTATE && e.mother_table_id == motherTable.id);
		res = res.map(tab => (
			fileNote.find(e => e.id == tab.fileNote_id)
		));
		setTabRotates(res);
	}

	// useEffect(() => {
	//
	// }, [id, motherTable])

	const handleOpen = async () => {
		await getDataDaXoay();
		setIsOpen(true);
		setSelectedColumns([]);
		setShowPreview(false);
		console.log(fileNote);
	};

	const handleOpenCreated = async () => {
		setIsOpenCreated(true);

	};


	const handleClose = () => {
		setIsOpen(false);
		setShowPreview(false);
	};
	const validateColumnNames = (name, isGroupColumn) => {
		// Check for empty value
		if (!name || name.trim() === '') {
			setColumnNameError('Tên cột không được để trống');
			return false;
		}

		const trimmedName = name.trim().toLowerCase();
		const trimmedGroupName = groupColumnName?.trim().toLowerCase();
		const trimmedValueName = valueColumnName?.trim().toLowerCase();

		// Get remaining columns that will be in the new table and normalize them
		const remainingColumns = columnsGoc
			.filter(col => !selectedColumns.includes(col))
			.map(col => col.trim().toLowerCase());

		// Check if name exists in remaining columns
		if (remainingColumns.includes(trimmedName)) {
			setColumnNameError(`Tên cột "${name?.trim()}" đã tồn tại trong bảng`);
			return false;
		}

		// Check if names are the same
		if (isGroupColumn && trimmedName === trimmedValueName) {
			setColumnNameError('Tên hai cột không được trùng nhau');
			return false;
		} else if (!isGroupColumn && trimmedName === trimmedGroupName) {
			setColumnNameError('Tên hai cột không được trùng nhau');
			return false;
		}

		setColumnNameError('');
		return true;
	};

	// Update the column name change handlers
	const handleGroupColumnNameChange = (e) => {
		const newName = e.target.value;
		setGroupColumnName(newName);
		validateColumnNames(newName, true);
		setShowPreview(false);
	};

	const handleValueColumnNameChange = (e) => {
		const newName = e.target.value;
		setValueColumnName(newName);
		validateColumnNames(newName, false);
		setShowPreview(false);
	};

	const handleColumnChange = (checkedValues) => {
		setSelectedColumns(checkedValues);
		setShowPreview(false);
	};

	const onGridReady = (params) => {
		params.api.sizeColumnsToFit();
	};

	// Thêm useEffect để theo dõi các trường được chọn
	useEffect(() => {
		if (valueFields.length > 0) {
			handlePreview();
		}
	}, [rowFields, columnFields, valueFields, aggregation, showRowTotal, showColumnTotal]);

	// Tự động render lại bảng khi filters thay đổi
	useEffect(() => {
		if (valueFields.length > 0) {
			handlePreview();
		}
		// eslint-disable-next-line
	}, [filters]);

	// Khi valueFields thay đổi, cập nhật customValueFieldName mặc định
	useEffect(() => {
		if (rowFields.length === 0 && columnFields.length > 0 && valueFields.length > 0) {
			setCustomValueFieldName(valueFields.join(' | '));

		} else {
			setCustomValueFieldName('');
		}

	}, [rowFields, columnFields, valueFields]);

	// Khi customValueFieldName thay đổi, chỉ cập nhật lại rowData
	useEffect(() => {
		if (rowFields.length === 0 && columnFields.length > 0 && valueFields.length > 0 && previewData.columns.length > 0) {
			handlePreview();
		}
		// eslint-disable-next-line
	}, [customValueFieldName]);

	useEffect(() => {
		if (valueFields.length > 0) {
			handlePreview();
		}
		// eslint-disable-next-line
	}, [calculatedColumns]);

	// Khi rowFields thay đổi, nếu chỉ còn 1 trường thì tắt split
	useEffect(() => {
		if (rowFields.length <= 1 && splitRowFieldsToColumns) {
			setSplitRowFieldsToColumns(false);
		}
	}, [rowFields]);

	// Khi splitRowFieldsToColumns thay đổi, cập nhật preview
	useEffect(() => {
		if (valueFields.length > 0) {
			handlePreview();
		}
		// eslint-disable-next-line
	}, [splitRowFieldsToColumns]);

	// Thêm useEffect để clear columnFields nếu chọn nhiều trường giá trị
	useEffect(() => {
		if (valueFields.length > 1 && columnFields.length > 0) {
			setColumnFields([]);
		}
		// Preview lại ngay khi thay đổi trường giá trị
		if (valueFields.length > 0) {
			handlePreview();
		}
		// eslint-disable-next-line
	}, [valueFields]);

	useEffect(() => {
		if (previewData && previewData.data && previewData.data.length > 0) {
			handlePreview();
		}

	}, [customTextColumns]);

	const handlePreview = () => {
		if (valueFields.length === 0) {
			message.error('Vui lòng chọn một trường giá trị');
			return;
		}
		// Áp dụng filter trước khi pivot
		const filteredData = applyFilters(rowDataGoc);
		const transformedData = transformDataWithPivot(filteredData, {
			rowFields,
			columnFields,
			valueFields,
			aggregation,
			calculatedColumns,
			customValueFieldName: (rowFields.length === 0 && columnFields.length > 0 && valueFields.length > 0 && customValueFieldName) ? customValueFieldName : undefined,
			splitRowFieldsToColumns,
		});
		setPreviewData(transformedData);
		setShowPreview(true);
	};

	const handleSaveClick = () => {
		setIsPopoverVisible(true);
	};
	// Hàm thêm/xóa trường hàng
	const toggleRowField = (field) => {
		setRowFields(prev =>
			prev.includes(field)
				? prev.filter(f => f !== field)
				: [...prev, field],
		);
	};

	// Hàm thêm/xóa trường cột
	const toggleColumnField = (field) => {
		setColumnFields(prev =>
			prev.includes(field)
				? prev.filter(f => f !== field)
				: [...prev, field],
		);
	};

	// Trích xuất các biến từ công thức
	const extractVariables = (formula) => {
		const matches = [...formula.matchAll(/(?<![a-zA-Z])[a-zA-Z](?![a-zA-Z])/g)];
		return [...new Set(matches.map(match => match[0]))];
	};

	// Cập nhật công thức và biến
	const updateFormula = (formula) => {
		const variables = extractVariables(formula);
		const newVariables = {};
		variables.forEach(v => {
			newVariables[v] = newCalcColumn.variables[v] || '';
		});
		setNewCalcColumn(prev => ({ ...prev, formula, variables: newVariables }));
	};

	// Hàm thêm calculated column
	const addCalculatedColumn = () => {
		if (newCalcColumn.name && newCalcColumn.formula && Object.keys(newCalcColumn.variables).length > 0) {
			setCalculatedColumns(prev => {
				const newColumns = [...prev, { ...newCalcColumn, isPercent: newCalcColumn.isPercent || false }];
				// Cập nhật preview data ngay sau khi thêm cột
				const transformedData = transformDataWithPivot(rowDataGoc, {
					rowFields,
					columnFields,
					valueFields,
					aggregation,
					calculatedColumns: newColumns,
					splitRowFieldsToColumns,
				});
				setPreviewData(transformedData);
				return newColumns;
			});

			// Reset form sau khi thêm
			setNewCalcColumn({
				name: '',
				formula: '',
				variables: {},
				isPercent: false,
			});
		}
	};

	const removeCalculatedColumn = (index) => {
		setCalculatedColumns(prev => {
			const newColumns = prev.filter((_, i) => i !== index);
			// Cập nhật preview data ngay sau khi xóa cột
			const transformedData = transformDataWithPivot(rowDataGoc, {
				rowFields,
				columnFields,
				valueFields,
				aggregation,
				calculatedColumns: newColumns,
				splitRowFieldsToColumns,
			});
			setPreviewData(transformedData);
			return newColumns;
		});
	};


	// Cập nhật hàm handleSave
	const handleSave = async () => {
		setLoading(true);
		try {
			// Áp dụng filter trước khi pivot
			const filteredData = applyFilters(rowDataGoc);
			const pivotData = transformDataWithPivot(filteredData, {
				rowFields,
				columnFields,
				valueFields,
				aggregation,
				calculatedColumns,
				filters,
				showRowTotal,
				showColumnTotal,
				customValueFieldName: (rowFields.length === 0 && columnFields.length > 0 && valueFields.length > 0 && customValueFieldName) ? customValueFieldName : undefined,
				splitRowFieldsToColumns,
			});

			const fileNotePad = await createNewFileNotePad({
				tab: fileNote.tab,
				table: fileNote.table,
				name: newFileName || `${fileNote.name} - (Xoay)`,
				userClass: fileNote.userClass,
			});

			const customTextColumnsForSave = customTextColumns.map(col => ({
				columnName: col.name,
				data: { ...col.values },
				referenceColumn: col.referenceColumn
			}));

			// Sau khi tạo tableTemplate mới bắt đầu tạo các cột
			let columnIndex = 0;
			const columnIndexes = [];

			const tableTemplate = await createTemplateTable({
				fileNote_id: fileNotePad.data.id,
				mother_table_id: motherTable?.id,
				mother_rotate_columns: {
					rowFields,
					columnFields,
					valueFields,
					aggregation,
					calculatedColumns,
					filters,
					showRowTotal,
					showColumnTotal,
					customValueFieldName: (rowFields.length === 0 && columnFields.length > 0 && valueFields.length > 0 && customValueFieldName) ? customValueFieldName : undefined,
					splitRowFieldsToColumns,
					customTextColumns: customTextColumnsForSave,
					columnIndexes,
				},
				table_type: Template_Table_Type.ROTATE,
			});

			// Tạo cột hàng đầu tiên (rowFieldName)
			await createTemplateColumn({
				tableId: tableTemplate.id,
				columnName: pivotData.columns[0].headerName,
				columnType: 'text',
				show: true,
				columnIndex: columnIndex++,
			});
			columnIndexes.push({ columnName: pivotData.columns[0].headerName, columnIndex });

			// Tạo các cột giá trị
			await Promise.all(pivotData.columns
				.slice(1)
				.filter(column =>
					!calculatedColumns.find(calc => calc.name === column.headerName) &&
					column?.headerName != 'TỔNG HÀNG' &&
					!(customTextColumns && customTextColumns.some(c => c.name === column.headerName))
				)
				.map(column => {
					columnIndexes.push({ columnName: column.headerName, columnIndex });
					return createTemplateColumn({
						tableId: tableTemplate.id,
						columnName: column.headerName,
						columnType: (splitRowFieldsToColumns && rowFields.includes(column.field)) ? 'text' : 'number',
						show: true,
						columnIndex: columnIndex++,
					});
				})
			);

			// Tạo các cột tính toán
			if (calculatedColumns?.length) {
				await Promise.all(calculatedColumns.map(calcCol => {
					const variablesArray = Object.entries(calcCol.variables).map(([key, value]) => ({
						[key]: value,
					}));
					columnIndexes.push({ columnName: calcCol.name, columnIndex });
					return createTemplateColumn({
						tableId: tableTemplate.id,
						columnName: calcCol.name,
						columnType: 'formula',
						show: true,
						columnIndex: columnIndex++,
						selectFormula: {
							formula: calcCol.formula,
							variables: variablesArray,
							isPercent: calcCol.isPercent || false,
						},
					});
				}));
			}

			// Tạo cột TỔNG HÀNG nếu có
			if (showRowTotal) {
				columnIndexes.push({ columnName: 'TỔNG HÀNG', columnIndex });
				await createTemplateColumn({
					tableId: tableTemplate.id,
					columnName: 'TỔNG HÀNG',
					columnType: 'number',
					show: true,
					columnIndex: columnIndex++,
				});
			}

			// Thêm các cột text tuỳ chỉnh (customTextColumns)
			if (customTextColumns && customTextColumns.length > 0) {
				for (const customCol of customTextColumns) {
					columnIndexes.push({ columnName: customCol.name, columnIndex });
					await createTemplateColumn({
						tableId: tableTemplate.id,
						columnName: customCol.name,
						columnType: 'text',
						show: true,
						columnIndex: columnIndex++,
					});
				}
			}

			// Lưu columnIndexes vào mother_rotate_columns
			const motherRotateColumns = {
				rowFields,
				columnFields,
				valueFields,
				aggregation,
				calculatedColumns,
				filters,
				showRowTotal,
				showColumnTotal,
				customValueFieldName: (rowFields.length === 0 && columnFields.length > 0 && valueFields.length > 0 && customValueFieldName) ? customValueFieldName : undefined,
				splitRowFieldsToColumns,
				customTextColumns: customTextColumnsForSave,
				columnIndexes,
			};

			// Lưu dữ liệu theo thứ tự
			await createBathTemplateRow({
				tableId: tableTemplate.id,
				data: pivotData.data,
			});

			handleClose();
			setTimeout(() => {
				setLoading(false);
			}, 1000);
			message.success('Đã tạo bảng xoay mới');
			setLoadData(!loadData);
		} catch (error) {
			console.error('Error creating new table:', error);
			toast.error('Đã xảy ra lỗi khi tạo bảng mới.');
			setLoading(false);
		}
	};

	const formatNumber = (num) => {
		if (typeof num !== 'number') return num;
		return new Intl.NumberFormat('vi-VN').format(Math.round(num));
	};

	const evaluateFormula = (formula, variables, row) => {
		let processedFormula = formula;

		Object.entries(variables).forEach(([variable, column]) => {
			if (column && row[column] !== undefined) {
				const value = Number(row[column]) || 0;
				const regex = new RegExp(`(?<![a-zA-Z])${variable}(?![a-zA-Z])`, 'g');
				processedFormula = processedFormula.replace(regex, value.toString());
			}
		});

		try {
			const safeEval = new Function('return ' + processedFormula);
			const result = safeEval();
			return isNaN(result) ? 0 : result;
		} catch (error) {
			console.error('Lỗi tính toán:', error, 'Công thức sau khi xử lý:', processedFormula);
			return 0;
		}
	};


	const transformDataWithPivot = (originalData, options) => {
		const { rowFields, columnFields, valueFields, aggregation, calculatedColumns, customValueFieldName, splitRowFieldsToColumns } = options;
		if (!originalData?.length) {
			return { rows: [], columns: [], data: [] };
		}

		if (valueFields.length === 1) {
			// Pivot đúng kiểu cũ: rowFields, columnFields, valueField duy nhất
			const valueField = valueFields[0];
			const result = {};
			const columnHeaders = new Set();
			const rowHeaders = new Set();
			const rowFieldName = rowFields.length > 0 ? rowFields.join(' | ') : 'Dữ liệu';
			// Tên trường giá trị động
			const valueFieldDisplay = (rowFields.length === 0 && columnFields.length > 0 && valueFields.length > 0 && customValueFieldName) ? customValueFieldName : (valueFields.length > 0 ? valueFields.join(' | ') : 'Giá trị');

			// Duyệt qua dữ liệu và nhóm theo các trường được chọn
			originalData.forEach(item => {
				const rowKey = rowFields.length > 0 ? rowFields.map(field => item[field]).join(' | ') : valueFieldDisplay;
				const colKey = columnFields.length > 0
					? columnFields.map(field => item[field]).join(' | ')
					: valueFieldDisplay;

				rowHeaders.add(rowKey);
				columnHeaders.add(colKey);

				if (!result[rowKey]) result[rowKey] = {};
				if (!result[rowKey][colKey]) result[rowKey][colKey] = {
					count: 0,
					sum: 0,
					values: [],
					rawValues: [],
					uniqueValues: new Set()
				};

				result[rowKey][colKey].count += 1;
				const rawValue = item[valueField];
				const numValue = Number(rawValue) || 0;
				result[rowKey][colKey].sum += numValue;
				result[rowKey][colKey].rawValues.push(rawValue);
				result[rowKey][colKey].values.push(numValue);
				result[rowKey][colKey].uniqueValues.add(rawValue);
			});

			const sortedRowHeaders = Array.from(rowHeaders).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
			const sortedColumnHeaders = Array.from(columnHeaders).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

			// Chuyển đổi kết quả thành format phù hợp để hiển thị
			const pivotedData = [];
			sortedRowHeaders.forEach(row => {

				let rowData;
				if (splitRowFieldsToColumns && rowFields.length > 1) {
					rowData = {};
					const values = row.split(' | ');
					rowFields.forEach((field, idx) => {
						rowData[field] = values[idx] !== undefined ? values[idx] : '';
					});
				} else {
					rowData = { [rowFieldName]: row };
				}

				sortedColumnHeaders.forEach(col => {
					const cellData = result[row]?.[col];
					if (cellData) {
						switch (aggregation) {
							case 'sum':
								rowData[col] = cellData.sum;
								break;
							case 'count':
								rowData[col] = cellData.rawValues.filter(v => v !== null && v !== undefined && v !== '').length;
								break;
							case 'average':
								const validValues = cellData.rawValues.filter(v => v !== null && v !== undefined && v !== '');
								rowData[col] = validValues.length > 0 ? cellData.sum / validValues.length : 0;
								break;
							case 'min':
								rowData[col] = Math.min(...cellData.values);
								break;
							case 'max':
								rowData[col] = Math.max(...cellData.values);
								break;
							case 'unique_count':
								rowData[col] = new Set(cellData.rawValues.filter(v => v !== null && v !== undefined && v !== '')).size;
								break;
							default:
								rowData[col] = cellData.sum;
						}
					} else {
						rowData[col] = 0;
					}
				});
				pivotedData.push(rowData);
			});
			let columns;
			if (splitRowFieldsToColumns && rowFields.length > 1) {
				columns = [
					...rowFields.map(field => ({
						field,
						headerName: field,
						sortable: true,
						filter: true,
						minWidth: 120,
						resizable: true,
						valueFormatter: params => params.value ?? '',
						cellStyle: params => {
							if (params.value === 'TỔNG CỘT') {
								return { backgroundColor: '#989898', fontWeight: 'bold' };
							}
							return null;
						},
						columnType: 'text',
					})),
					...Array.from(sortedColumnHeaders).map(col => ({
						field: col,
						headerName: col,
						sortable: true,
						filter: true,
						autoSize: true,
						minWidth: 120,
						resizable: true,
						valueFormatter: params => {
							if (params.value === null || params.value === undefined || params.value === '') {
								return '';
							}
							return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
						},
						cellStyle: params => {
							const rowData = params.node.data;
							if (rowData[rowFieldName] === 'TỔNG CỘT') {
								return { backgroundColor: '#d5ffdc', fontWeight: 'bold' };
							}
							return null;
						},
					}))
				];
			} else {
				columns = [
					{
						field: rowFieldName,
						headerName: rowFieldName,
						sortable: true,
						filter: true,
						autoSize: true,
						minWidth: 150,
						resizable: true,
						cellStyle: params => {
							if (params.value === 'TỔNG CỘT') {
								return { backgroundColor: '#989898', fontWeight: 'bold' };
							}
							return null;
						},
					},
					...Array.from(sortedColumnHeaders).map(col => ({
						field: col,
						headerName: col,
						sortable: true,
						filter: true,
						autoSize: true,
						minWidth: 120,
						resizable: true,
						valueFormatter: params => {
							if (params.value === null || params.value === undefined || params.value === '') {
								return '';
							}
							return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
						},
						cellStyle: params => {
							const rowData = params.node.data;
							if (rowData[rowFieldName] === 'TỔNG CỘT') {
								return { backgroundColor: '#d5ffdc', fontWeight: 'bold' };
							}
							return null;
						},
					}))
				];
			}

			// Thêm tổng hàng nếu được yêu cầu
			if (showRowTotal) {
				const allColumns = Array.from(sortedColumnHeaders);
				pivotedData.forEach(row => {
					// Chỉ tính tổng từ các cột giá trị và cột tính toán
					const rowTotal = allColumns.reduce((sum, col) => {
						const value = Number(row[col]) || 0;
						return sum + value;
					}, 0);

					// Thêm giá trị tổng vào dữ liệu hàng
					row['TỔNG HÀNG'] = rowTotal;
				});

				// Chỉ thêm định nghĩa cột TỔNG HÀNG nếu chưa tồn tại
				if (!columns.some(col => col.headerName === 'TỔNG HÀNG')) {
					columns.push({
						field: 'TỔNG HÀNG',
						headerName: 'TỔNG HÀNG',
						sortable: true,
						filter: true,
						minWidth: 120,
						valueFormatter: params => {
							if (params.value === null || params.value === undefined || params.value === '') {
								return '';
							}
							return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
						},
						cellStyle: params => {
							const rowData = params.node.data;
							if (rowData[rowFieldName] === 'TỔNG CỘT') {
								return { backgroundColor: '#fff9e6', fontWeight: 'bold' };
							}
							return { backgroundColor: '#ff99e6', fontWeight: 'bold' };
						},
					});
				}
			}

			// Thêm tổng cột nếu được yêu cầu
			if (showColumnTotal) {
				// Nếu splitRowFieldsToColumns và rowFields.length > 1, tạo hàng tổng cột với các trường hàng là 'TỔNG CỘT'
				if (splitRowFieldsToColumns && rowFields.length > 1) {
					const totalRow = {};
					rowFields.forEach(field => {
						totalRow[field] = 'TỔNG CỘT';
					});
					columns.forEach(col => {
						if (!rowFields.includes(col.field)) {
							totalRow[col.field] = pivotedData.reduce((sum, row) => sum + (Number(row[col.field]) || 0), 0);
						}
					});
					pivotedData.push(totalRow);
				} else {
					// Logic cũ
					const totalRow = { [rowFieldName]: 'TỔNG CỘT' };
					columns.forEach(col => {
						if (col.field !== rowFieldName) {
							totalRow[col.field] = pivotedData.reduce((sum, row) =>
								sum + (Number(row[col.field]) || 0), 0,
							);
						}
					});
					pivotedData.push(totalRow);
				}
			}

			// Sau khi tạo columns (trong transformDataWithPivot)
			if (customTextColumns.length > 0) {
				columns.push(...customTextColumns.map(col => ({
					field: col.name,
					headerName: col.name,
					editable: true,
					cellEditor: 'agTextCellEditor',
					minWidth: 120,
					valueGetter: params => {
						const referenceColumnName = col.referenceColumn || rowFieldName;
						const key = params.data[referenceColumnName];
						return col.values.hasOwnProperty(key) ? col.values[key] : '';
					},
					valueSetter: params => {
						const referenceColumnName = col.referenceColumn || rowFieldName;
						const key = params.data[referenceColumnName];
						if (key !== undefined) {
							col.values[key] = params.newValue;
							params.data[col.name] = params.newValue;
						}
						return true;
					}
				})));
				// Khi tạo data, thêm giá trị cho từng dòng
				pivotedData.forEach(row => {
					customTextColumns.forEach(col => {
						const referenceColumnName = col.referenceColumn || rowFieldName;
						const key = row[referenceColumnName];
						if (key !== undefined && col.values.hasOwnProperty(key)) {
							row[col.name] = col.values[key];
						} else {
							row[col.name] = '';
						}
					});
				});
			}

			return {
				rows: Array.from(sortedColumnHeaders),
				columns: columns,
				data: pivotedData,
			};
		}

		// Trường hợp nhiều trường giá trị
		if (valueFields.length > 1) {
			// Tạo key cho từng dòng dựa trên rowFields
			const rowKeyName = rowFields.length > 0 ? rowFields.join(' | ') : 'Dữ liệu';
			const rowKeys = new Set();
			const dataMap = {};

			originalData.forEach(item => {
				const rowKey = rowFields.length > 0 ? rowFields.map(f => item[f]).join(' | ') : 'Tổng hợp';
				rowKeys.add(rowKey);
				if (!dataMap[rowKey]) dataMap[rowKey] = {};
				valueFields.forEach(valField => {
					if (!dataMap[rowKey][valField]) dataMap[rowKey][valField] = {
						values: [],
						rawValues: [] // Thêm mảng lưu giá trị gốc
					};
					// Lưu cả giá trị gốc và giá trị đã chuyển đổi
					const rawValue = item[valField];
					const numValue = Number(rawValue) || 0;
					dataMap[rowKey][valField].rawValues.push(rawValue);
					dataMap[rowKey][valField].values.push(numValue);
				});
			});

			const sortedRowKeys = Array.from(rowKeys).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

			// Tạo columns
			let columns;
			if (splitRowFieldsToColumns && rowFields.length > 1) {
				// Tạo cột cho từng trường hàng
				columns = [
					...rowFields.map(field => ({
						field,
						headerName: field,
						sortable: true,
						filter: true,
						minWidth: 120,
						resizable: true,
						valueFormatter: params => params.value ?? '',
					})),
					...valueFields.map(valField => ({
						field: valField,
						headerName: valField,
						sortable: true,
						filter: true,
						minWidth: 120,
						resizable: true,
						valueFormatter: params => {
							if (params.value === null || params.value === undefined || params.value === '') {
								return '';
							}
							return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
						},
					}))
				];
			} else {
				columns = [
					{
						field: rowKeyName,
						headerName: rowKeyName,
						sortable: true,
						filter: true,
						minWidth: 150,
						resizable: true,
					},
					...valueFields.map(valField => ({
						field: valField,
						headerName: valField,
						sortable: true,
						filter: true,
						minWidth: 120,
						resizable: true,
						valueFormatter: params => {
							if (params.value === null || params.value === undefined || params.value === '') {
								return '';
							}
							return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
						},
					}))
				];
			}

			// Tạo data
			const data = sortedRowKeys.map(rowKey => {
				let row;
				if (splitRowFieldsToColumns && rowFields.length > 1) {
					row = {};
					const values = rowKey.split(' | ');
					rowFields.forEach((field, idx) => {
						row[field] = values[idx] !== undefined ? values[idx] : '';
					});
				} else {
					row = { [rowKeyName]: rowKey };
				}
				valueFields.forEach(valField => {
					// Dùng cả arr và rawArr
					const arr = dataMap[rowKey][valField]?.values || [];
					const rawArr = dataMap[rowKey][valField]?.rawValues || [];

					switch (aggregation) {
						case 'sum':
							row[valField] = arr.reduce((a, b) => a + b, 0);
							break;
						case 'count':
							// Chỉ đếm các giá trị thực sự tồn tại
							row[valField] = rawArr.filter(v => v !== null && v !== undefined && v !== '').length;
							break;
						case 'average':
							// Tính trung bình cho các giá trị hợp lệ
							const validValues = rawArr.filter(v => v !== null && v !== undefined && v !== '');
							row[valField] = validValues.length > 0 ? arr.reduce((a, b) => a + b, 0) / validValues.length : 0;
							break;
						case 'min':
							// Chỉ tính min cho các giá trị hợp lệ
							const validValuesForMin = arr.filter((_, idx) =>
								rawArr[idx] !== null && rawArr[idx] !== undefined && rawArr[idx] !== ''
							);
							row[valField] = validValuesForMin.length > 0 ? Math.min(...validValuesForMin) : 0;
							break;
						case 'max':
							// Chỉ tính max cho các giá trị hợp lệ
							const validValuesForMax = arr.filter((_, idx) =>
								rawArr[idx] !== null && rawArr[idx] !== undefined && rawArr[idx] !== ''
							);
							row[valField] = validValuesForMax.length > 0 ? Math.max(...validValuesForMax) : 0;
							break;
						case 'unique_count':
							// Đếm giá trị duy nhất, loại bỏ null/undefined/''
							row[valField] = new Set(rawArr.filter(v => v !== null && v !== undefined && v !== '')).size;
							break;
						default:
							row[valField] = arr.reduce((a, b) => a + b, 0);
					}
				});
				return row;
			});

			// Thêm tổng hàng nếu cần
			if (showRowTotal) {
				data.forEach(row => {
					row['TỔNG HÀNG'] = valueFields.reduce((sum, valField) => sum + (Number(row[valField]) || 0), 0);
				});
				columns.push({
					field: 'TỔNG HÀNG',
					headerName: 'TỔNG HÀNG',
					sortable: true,
					filter: true,
					minWidth: 120,
					valueFormatter: params => {
						if (params.value === null || params.value === undefined || params.value === '') {
							return '';
						}
						return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
					},
				});
			}

			// Thêm tổng cột nếu cần
			if (showColumnTotal) {
				const totalRow = { [rowKeyName]: 'TỔNG CỘT' };
				valueFields.forEach(valField => {
					totalRow[valField] = data.reduce((sum, row) => sum + (Number(row[valField]) || 0), 0);
				});
				if (showRowTotal) {
					totalRow['TỔNG HÀNG'] = data.reduce((sum, row) => sum + (Number(row['TỔNG HÀNG']) || 0), 0);
				}
				data.push(totalRow);
			}

			// Tính toán cột tính toán nếu có
			if (calculatedColumns?.length) {
				data.forEach(row => {
					calculatedColumns.forEach(calcCol => {
						try {
							const result = evaluateFormula(calcCol.formula, calcCol.variables, row);
							row[calcCol.name] = result.toFixed(2);
						} catch (error) {
							row[calcCol.name] = 0;
						}
					});
				});
				columns.push(...calculatedColumns.map(calcCol => ({
					field: calcCol.name,
					headerName: calcCol.name,
					sortable: true,
					filter: true,
					minWidth: 120,
					valueFormatter: params => {
						if (params.value === null || params.value === undefined || params.value === '') {
							return '';
						}
						if (calcCol.isPercent) {
							let val = Number(params.value);
							if (!isNaN(val)) {
								val = val * 100;
								return `${val.toFixed(2)}%`;
							}
							return params.value;
						}
						return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
					},

				})));
			}

			// Sau khi tạo columns (trong transformDataWithPivot)
			if (customTextColumns.length > 0) {
				columns.push(...customTextColumns.map(col => ({
					field: col.name,
					headerName: col.name,
					editable: true,
					cellEditor: 'agTextCellEditor',
					minWidth: 120,
					valueGetter: params => {
						const referenceColumnName = col.referenceColumn || rowKeyName;
						const key = params.data[referenceColumnName] || params.data[rowFields[0]];
						return col.values.hasOwnProperty(key) ? col.values[key] : '';
					},
					valueSetter: params => {
						const referenceColumnName = col.referenceColumn || rowKeyName;
						const key = params.data[referenceColumnName] || params.data[rowFields[0]];
						if (key !== undefined) {
							col.values[key] = params.newValue;
							params.data[col.name] = params.newValue;
						}
						return true;
					}
				})));
				// Khi tạo data, thêm giá trị cho từng dòng
				data.forEach(row => {
					customTextColumns.forEach(col => {
						const referenceColumnName = col.referenceColumn || rowKeyName;
						const key = row[referenceColumnName] || row[rowFields[0]];
						if (key !== undefined && col.values.hasOwnProperty(key)) {
							row[col.name] = col.values[key];
						} else {
							row[col.name] = '';
						}
					});
				});
			}

			return {
				rows: valueFields,
				columns,
				data,
			};
		}
	};

	const handleTogglePercentColumn = useCallback((index, checked) => {
		setCalculatedColumns(prev =>
			prev.map((col, i) =>
				i === index ? { ...col, isPercent: checked } : col
			)
		);
	}, []);

	const handleCustomValueFieldNameChange = (e) => {
		setCustomValueFieldName(e.target.value);
		setShowPreview(false);
	};

	const popoverContent = (
		<div style={{ padding: '8px' }}>
			<Input
				value={newFileName}
				onChange={(e) => setNewFileName(e.target.value)}
				style={{ width: 300, marginBottom: '8px' }}
			/>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
				<Button size="small" onClick={() => setIsPopoverVisible(false)}>Hủy</Button>
				<Button size="small" type="primary" onClick={() => {
					setIsPopoverVisible(false);
					handleSave();
				}}>
					Xác nhận
				</Button>
			</div>
		</div>
	);
	return (
		<>
			<Button onClick={handleOpen}
				className='customButton'
			>
				Pivot dữ liệu
			</Button>

			<Modal
				title="Pivot dữ liệu"
				open={isOpen}
				onCancel={handleClose}
				centered
				width={'80vw'}
				footer={
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
						<Popover
							content={popoverContent}
							title="Đặt tên cho bảng"
							trigger="click"
							open={isPopoverVisible}
							onOpenChange={setIsPopoverVisible}
						>
							<Button
								type="primary"
								onClick={handleSaveClick}
								disabled={valueFields.length === 0}
							>
								Lưu
							</Button>
						</Popover>
						<Button onClick={handleClose}>
							Đóng
						</Button>
					</div>
				}
			>
				<Space direction="vertical" style={{ width: '100%', height: '80vh', overflowY: 'auto' }} size="large">
					<Card style={{ marginBottom: '24px' }}>
						<Row gutter={[16, 16]}>
							{/* Chọn trường hàng */}
							<Col xs={24} md={7}>
								<Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
									Trường hàng (có thể chọn nhiều hoặc không chọn)
								</Typography.Text>
								<div style={{
									border: '1px solid #d9d9d9',
									borderRadius: '6px',
									padding: '8px',
									maxHeight: '160px',
									overflowY: 'auto',
								}}>
									{columnsGoc.map(col => (
										<div
											key={col}
											style={{
												display: 'flex',
												alignItems: 'center',
												marginBottom: '8px',
												padding: '6px 8px',
												borderRadius: '4px',
												transition: 'all 0.3s',
												backgroundColor: rowFields.includes(col) ? '#e6f7ff' : 'transparent',
												border: rowFields.includes(col) ? '1px solid #91d5ff' : '1px solid transparent',
												cursor: 'pointer',
											}}
											onClick={() => toggleRowField(col)}
										>
											<Checkbox
												checked={rowFields.includes(col)}
												style={{ marginRight: '8px' }}
											/>
											<span style={{
												flex: 1,
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}>
												{col}
											</span>
										</div>
									))}
								</div>
								{rowFields.length > 1 && (
									<Checkbox
										style={{ marginTop: 8 }}
										checked={splitRowFieldsToColumns}
										onChange={e => setSplitRowFieldsToColumns(e.target.checked)}
									>
										Tách từng trường hàng thành cột riêng
									</Checkbox>
								)}
							</Col>

							{/* Chọn trường cột */}
							<Col xs={24} md={7}>
								<Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
									Trường cột (có thể chọn nhiều hoặc không chọn)
								</Typography.Text>
								<div style={{
									border: '1px solid #d9d9d9',
									borderRadius: '6px',
									padding: '8px',
									maxHeight: '160px',
									overflowY: 'auto',
									opacity: valueFields.length > 1 ? 0.5 : 1,
									pointerEvents: valueFields.length > 1 ? 'none' : 'auto',
								}}>
									{columnsGoc.map(col => (
										<div
											key={col}
											style={{
												display: 'flex',
												alignItems: 'center',
												marginBottom: '8px',
												padding: '6px 8px',
												borderRadius: '4px',
												transition: 'all 0.3s',
												backgroundColor: columnFields.includes(col) ? '#e6f7ff' : 'transparent',
												border: columnFields.includes(col) ? '1px solid #91d5ff' : '1px solid transparent',
												cursor: valueFields.length > 1 ? 'not-allowed' : 'pointer',
											}}
											onClick={() => valueFields.length > 1 ? null : toggleColumnField(col)}
										>
											<Checkbox
												checked={columnFields.includes(col)}
												style={{ marginRight: '8px' }}
												disabled={valueFields.length > 1}
											/>
											<span style={{
												flex: 1,
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}>
												{col}
											</span>
										</div>
									))}
								</div>
							</Col>

							{/* Chọn trường giá trị */}
							<Col xs={24} md={5}>
								<Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
									Trường giá trị
								</Typography.Text>
								<Select
									mode="multiple"
									style={{ width: '100%' }}
									value={valueFields}
									onChange={setValueFields}
									placeholder="Chọn trường..."
									allowClear
								>
									{columnsGoc
										.filter(col => !rowFields.includes(col))
										.map(col => (
											<Select.Option key={col} value={col}>{col}</Select.Option>
										))}
								</Select>
								{/* Input tên trường dữ liệu động */}
								{(rowFields.length === 0 && columnFields.length > 0 && valueFields.length > 0) && (
									<>
										<Typography.Text strong style={{ display: 'block', marginTop: '8px' }}>
											Tên trường giá trị
										</Typography.Text>
										<Input
											style={{ marginTop: 8 }}
											value={customValueFieldName}
											onChange={handleCustomValueFieldNameChange}
											placeholder="Tên cho trường dữ liệu"
										/>
									</>
								)}
							</Col>

							{/* Chọn phép tính */}
							<Col xs={24} md={5}>
								<Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
									Phép tính
								</Typography.Text>
								<Select
									style={{ width: '100%' }}
									value={aggregation}
									onChange={setAggregation}
								>
									<Select.Option value="sum">Tổng</Select.Option>
									<Select.Option value="count">Đếm</Select.Option>
									<Select.Option value="average">Trung bình</Select.Option>
									<Select.Option value="min">Nhỏ nhất</Select.Option>
									<Select.Option value="max">Lớn nhất</Select.Option>
									<Select.Option value="unique_count">Đếm giá trị không trùng lặp</Select.Option>
								</Select>
							</Col>
						</Row>

						<Row gutter={[16, 16]}>

							<Col xs={24} style={{ marginTop: '16px' }}>
								<Space>
									<Checkbox
										checked={showRowTotal}
										onChange={(e) => setShowRowTotal(e.target.checked)}
									>
										Hiển thị tổng hàng
									</Checkbox>
									<Checkbox
										checked={showColumnTotal}
										onChange={(e) => setShowColumnTotal(e.target.checked)}
									>
										Hiển thị tổng cột
									</Checkbox>
								</Space>
							</Col>
						</Row>
						{/* Khu vực tạo cột tính toán */}
						<Card style={{ marginTop: '24px' }}>
							<Typography.Title level={4} style={{ marginBottom: '16px' }}>
								Tạo cột tính toán
							</Typography.Title>
							<Row gutter={[16, 16]}>
								<Col xs={24} md={8}>
									<Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
										Tên cột mới
									</Typography.Text>
									<Input
										value={newCalcColumn.name}
										onChange={handleNewColumnNameChange}
										placeholder="Ví dụ: % so với tổng"
									/>
								</Col>
								<Col xs={24} md={16}>
									<Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
										Công thức (sử dụng A, B, C, ... cho các biến)
									</Typography.Text>
									<Input
										value={newCalcColumn.formula}
										onChange={(e) => updateFormula(e.target.value)}
										placeholder="Ví dụ: (A + B) / C * 100"
									/>
								</Col>
							</Row>

							{/* Khai báo biến */}
							{Object.keys(newCalcColumn.variables).length > 0 && (
								<div style={{ marginTop: '16px' }}>
									<Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
										Khai báo các biến:
									</Typography.Text>
									<Row gutter={[16, 16]}>
										{Object.keys(newCalcColumn.variables).map(variable => (
											<div key={variable} style={{ marginBottom: '8px' }}>
												<Typography.Text>Chọn cột cho biến {variable}:</Typography.Text>
												<Select
													style={{ width: '100%' }}
													value={newCalcColumn.variables[variable]}
													onChange={(value) => {
														setNewCalcColumn(prev => ({
															...prev,
															variables: {
																...prev.variables,
																[variable]: value,
															},
														}));
													}}
												>
													{previewData && previewData.columns &&
														previewData.columns
															.filter(col => col.field !== rowFields.join(' | '))
															.map(col => (
																<Select.Option key={col.field} value={col.field}>
																	{col.headerName}
																</Select.Option>
															))}
												</Select>
											</div>
										))}
									</Row>
								</div>
							)}

							<Button
								type="primary"
								onClick={addCalculatedColumn}
								style={{ marginTop: '16px' }}
							>
								Thêm cột tính toán
							</Button>

							{/* Danh sách các calculated columns */}
							{calculatedColumns.length > 0 && (
								<div style={{ marginTop: '24px' }}>
									<Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
										Các cột tính toán đã tạo:
									</Typography.Text>
									<Space direction="vertical" style={{ width: '100%' }}>
										{calculatedColumns.map((calcCol, index) => (
											<Card
												key={index}
												size="small"
												style={{ background: '#f0f5ff' }}
												extra={
													<Button
														type="text"
														danger
														icon={<CloseOutlined />}
														onClick={() => removeCalculatedColumn(index)}
													/>
												}
											>
												<Typography.Text strong>{calcCol.name}</Typography.Text>
												<Typography.Text type="secondary" style={{ marginLeft: '8px' }}>
													= {calcCol.formula}
												</Typography.Text>
												<Checkbox
													style={{ marginLeft: 16 }}
													checked={calcCol.isPercent}
													onChange={e => handleTogglePercentColumn(index, e.target.checked)}
												>
													Hiển thị dạng %
												</Checkbox>
											</Card>
										))}
									</Space>
								</div>
							)}
						</Card>


						{/* Bộ lọc điều kiện */}
						<Card type="inner" title="Thiết lập điều kiện lọc" style={{ margin: '16px 0' }}>
							{filters.map((filter, idx) => (
								<Row gutter={8} key={idx} align="middle" style={{ marginBottom: 8 }}>
									{idx > 0 && (
										<Col span={4}>
											<Select
												value={filter.logic}
												onChange={val => updateFilter(idx, 'logic', val)}
												style={{ width: 90 }}
											>
												<Select.Option value="and">AND</Select.Option>
												<Select.Option value="or">OR</Select.Option>
											</Select>
										</Col>
									)}
									<Col span={idx > 0 ? 5 : 6}>
										<Select
											style={{ width: '100%' }}
											placeholder="Chọn cột"
											value={filter.column}
											onChange={val => updateFilter(idx, 'column', val)}
										>
											{columnsGoc.map(col => (
												<Select.Option key={col} value={col}>{col}</Select.Option>
											))}
										</Select>
									</Col>
									<Col span={5}>
										<Select
											style={{ width: '100%' }}
											value={filter.operator}
											onChange={val => updateFilter(idx, 'operator', val)}
											options={operatorOptions}
										>
										</Select>
									</Col>
									{filter.operator !== 'is_distinct' && (
										<Col span={9}>
											{(() => {
												const colType = filter.column ? getColumnType(filter.column) : 'string';
												if (colType === 'number') {
													return (
														<Input
															type="number"
															style={{ width: '100%' }}
															value={filter.value}
															onChange={e => updateFilter(idx, 'value', e.target.value)}
															placeholder="Giá trị"
														/>
													);
												} else if (colType === 'date') {
													return (
														<Input
															type="date"
															style={{ width: '100%' }}
															value={filter.value}
															onChange={e => updateFilter(idx, 'value', e.target.value)}
															placeholder="Giá trị ngày"
														/>
													);
												} else {
													return (
														<Input
															style={{ width: '100%' }}
															value={filter.value}
															onChange={e => updateFilter(idx, 'value', e.target.value)}
															placeholder="Giá trị"
														/>
													);
												}
											})()}
										</Col>
									)}
									<Col span={2}>
										<Button danger type="text" onClick={() => removeFilter(idx)}>Xóa</Button>
									</Col>
								</Row>
							))}
							<Button type="dashed" onClick={addFilter}>Thêm điều kiện</Button>
						</Card>

						<Card type="inner" title="Thêm cột text tùy chỉnh" style={{ margin: '16px 0' }}>
							<Space>
								<Input
									placeholder="Tên cột text mới"
									value={newTextColumnName}
									onChange={e => setNewTextColumnName(e.target.value)}
									style={{ width: 200 }}
								/>
								<Button
									type="primary"
									onClick={() => {
										if (!newTextColumnName.trim()) return;
										if (customTextColumns.some(col => col.name === newTextColumnName.trim())) return;
										// Xác định cột đối chiếu - ưu tiên dùng rowFields
										const referenceColumn = rowFields.length > 0 ? rowFields[0] : 'Dữ liệu';
										setCustomTextColumns(prev => [
											...prev,
											{
												name: newTextColumnName.trim(),
												values: {},
												referenceColumn: referenceColumn  // Thêm thông tin cột đối chiếu
											}
										]);
										setNewTextColumnName('');
										setShowPreview(true);
									}}
								>
									Thêm cột text
								</Button>
							</Space>
							{customTextColumns.length > 0 && (
								<div style={{ marginTop: 8 }}>
									<b>Các cột text đã thêm:</b>
									<ul style={{ paddingLeft: 20, margin: 0 }}>
										{customTextColumns.map((col, idx) => (
											<li key={col.name} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
												<span>{col.name} <small style={{ color: '#888' }}>(Đối chiếu: {col.referenceColumn})</small></span>
												<Button
													size="small"
													danger
													type="text"
													style={{ marginLeft: 8 }}
													onClick={() => {
														setCustomTextColumns(prev => prev.filter((_, i) => i !== idx));
													}}
												>
													Xóa
												</Button>
											</li>
										))}
									</ul>
								</div>
							)}
						</Card>
					</Card>

					{/* Hiển thị bảng dữ liệu */}
					{previewData && previewData.data && previewData.data.length > 0 && (
						<Card>
							<Typography.Title level={4} style={{ marginBottom: '16px' }}>
								Xem trước dữ liệu
							</Typography.Title>
							<div className="ag-theme-quartz" style={{ height: '400px', width: '100%' }}>
								<AgGridReact
									enableRangeSelection={true}
									rowData={previewData.data}
									columnDefs={previewData.columns}
									pagination={true}
									onGridReady={onGridReady}
									defaultColDef={{
										resizable: true,
										sortable: true,
										filter: true,
									}}
								/>
							</div>
						</Card>
					)}
				</Space>
			</Modal>

		</>
	);
};

export default RotateTable;

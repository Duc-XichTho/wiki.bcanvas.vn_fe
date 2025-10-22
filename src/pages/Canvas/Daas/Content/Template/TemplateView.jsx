import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Template.css';
import { toast } from 'react-toastify';
import { evaluate } from 'mathjs';
import AG_GRID_LOCALE_VN from '../../../../Home/AgridTable/locale';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { onFilterTextBoxChanged } from '../../../../../generalFunction/quickFilter';
import {
	createTemplateColumn,
	createTemplateRow,
	getTemplateByFileNoteId,
	getTemplateColumn,
	getTemplateRow,
	updateColumnIndexes,
	updateTemplateColumnWidth,
	updateTemplateRow,
} from '../../../../../apis/templateSettingService';
import { Button, message, Pagination } from 'antd';
import { getFileNotePadByIdController } from '../../../../../apis/fileNotePadService.jsx';
import { getAllCrossCheck } from '../../../../../apis/crossCheckService';
import { getValidateData } from '../../../../../generalFunction/getValidateData.js';
import { getAllUserClass } from '../../../../../apis/userClassService.jsx';
import PopUpUploadFile from './../../../../../components/UploadFile/PopUpUploadFile.jsx';
import { MyContext } from '../../../../../MyContext.jsx';
import ViewCombine from './SettingCombine/ViewCombine.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const TemplateView = ({ fileNotePad }) => {

	const fileNoteId = fileNotePad?.id;
	const gridRef = useRef();
	const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
	const [showSettingsPopup, setShowSettingsPopup] = useState(false);
	const [fileNote, setFileNote] = useState(null);
	const [templateData, setTemplateData] = useState([]);
	const [templateColumns, setTemplateColumns] = useState([]);
	const [rowData, setRowData] = useState([]);
	const [colDefs, setColDefs] = useState([]);
	const [dropdownOptions, setDropdownOptions] = useState({});
	const { currentUser, listUC_CANVAS, isUpdateNoti } = useContext(MyContext);
	const [isDataLoaded, setIsDataLoaded] = useState(false);
	const [isImportModalVisible, setIsImportModalVisible] = useState(false);
	const [importedData, setImportedData] = useState([]);
	const [importColumns, setImportColumns] = useState([]);
	const [selectedmapping, setSelectedMapping] = useState({});
	const [isMappingModalVisible, setIsMappingModalVisible] = useState(false);
	const [isMappingChoicePopoverVisible, setIsMappingChoicePopoverVisible] = useState(false);
	const [itemsMapping, setItemsMapping] = useState([]);
	const [isImportChoicePopoverVisible, setIsImportChoicePopoverVisible] = useState(false);
	const [countErr, setCountErr] = useState(0);
	const [validates, setValidates] = useState([]);
	const [isValidateModalVisible, setIsValidateModalVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState(false);
	const [duplicateHighlightColumns, setDuplicateHighlightColumns] = useState([]);
	const [showDuplicateColumnSelector, setShowDuplicateColumnSelector] = useState(false);
	const [isStatusFilter, setIsStatusFilter] = useState(false);
	const [selectedUC, setSelectedUC] = useState(new Set([]));
	const [listUC, setListUC] = useState([]);
	const [isView, setIsView] = useState(false);
	const [openSetupUC, setOpenSetupUC] = useState(false);
	const [isFormModalVisible, setIsFormModalVisible] = useState(false);
	const location = useLocation();
	const [isCustomRowModalVisible, setIsCustomRowModalVisible] = useState(false);
	const [customRowCount, setCustomRowCount] = useState(1);
	const [showSettingsChartPopup, setShowSettingsChartPopup] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(50000);
	const [totalRows, setTotalRows] = useState(0);

	const handlePageChange = (page, size) => {
		setCurrentPage(page);
		if (size !== pageSize) {
			setPageSize(size);
		}
	};
	useEffect(() => {
		getAllUserClass().then((data) => {
			setListUC(data.filter((e) => e.module == 'CANVAS'));
		});
	}, []);

	useEffect(() => {
		let isView = false;
		if (fileNote?.userClass) {
			isView =
				listUC_CANVAS.filter((item) => fileNote.userClass.includes(item.id)).length > 0;
		}
		if (!currentUser.isAdmin) {
			setListUC(listUC_CANVAS);
		}
		setSelectedUC(new Set(fileNote?.userClass || []));
		setIsView(isView);
	}, [fileNote, listUC_CANVAS, currentUser]);

	function filter() {
		if (isStatusFilter) {
			return {
				filter: 'agMultiColumnFilter',
				floatingFilter: true,
				filterParams: {
					filters: [
						{
							filter: 'agTextColumnFilter',
						},
						{
							filter: 'agSetColumnFilter',
						},
					],
				},
			};
		}
	}

	const handleChangeStatusFilter = () => {
		setIsStatusFilter((prev) => {
			return !prev;
		});
	};

	const toggleDuplicateHighlight = (columnName) => {
		setDuplicateHighlightColumns((prev) => {
			if (prev.includes(columnName)) {
				return prev.filter((col) => col !== columnName);
			} else {
				return [...prev, columnName];
			}
		});
	};

	const fetchDataCrossCheckAndValidate = async () => {
		try {
			const result = await getAllCrossCheck();
			const filteredDataValidate = result.filter((item) => item.type === 'Validate');
			let dataValivate = [];
			let count = 0;
			try {
				for (const filteredDataValidateElement of filteredDataValidate) {
					let countValidate = 0;
					let data = await getValidateData(filteredDataValidateElement);
					if (data) {
						if (data.result.length > 0) {
							for (const resultElement of data.result) {
								if (!resultElement.existsInChecking) {
									countValidate++;
								}
							}
						}
					}

					if (countValidate > 0) {
						let bo_du_lieu = filteredDataValidateElement.primarySource?.bo_du_lieu;
						let idTemp = bo_du_lieu?.split('_')[1];
						let key = filteredDataValidateElement.primarySource.cot_du_lieu;
						let item = {
							name: filteredDataValidateElement.name,
							count: countValidate,
							cot_du_lieu: key,
							key: key,
							onClick: () => {
								setSelectedItem(filteredDataValidateElement);
								setIsValidateModalVisible(true);
							},
							label: (
								<span>
                                    {' '}
									Cột {key} có {countValidate} dòng chưa điền hoặc chưa đúng{' '}
                                </span>
							),
							idTemp,
							...filteredDataValidateElement,
						};
						dataValivate.push(item);
					}
				}
			} catch (e) {
			}
			dataValivate = dataValivate.filter((item) => item.idTemp == templateData.id);
			dataValivate.forEach((item) => {
				count += item.count;
			});
			setCountErr(count);
			setValidates(dataValivate);
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu:', error);
		}
	};

	const fetchAllCrossCheck = async () => {
		try {
			const res = await getAllCrossCheck();
			const filtersMapping = res.filter((item) => item.type == 'Mapping');
			let mapping = [];
			if (filtersMapping.length > 0) {
				for (const filtersMappingElement of filtersMapping) {
					if (
						filtersMappingElement?.info?.validateRecord?.primarySource?.id == fileNoteId
					) {
						mapping.push({
							onClick: () => {
								setSelectedMapping(filtersMappingElement);
								setIsMappingModalVisible(true);
							},
							key: filtersMappingElement.id,
							label: (
								<span style={{ width: '100%', height: '100%' }}>
                                    {' '}
									{filtersMappingElement.name}{' '}
                                </span>
							),
						});
					}
				}
			}
			setItemsMapping(mapping);
		} catch (error) {
			console.error('Lỗi khi lấy danh sách cross check:', error);
		}
	};

	useEffect(() => {
		fetchAllCrossCheck();
	}, [fileNoteId]);
	useEffect(() => {
		fetchDataCrossCheckAndValidate();
	}, [templateData, fileNoteId, isUpdateNoti]);

	const statusBar = useMemo(
		() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }),
		[],
	);
	const defaultColDef = useMemo(() => {
		return {
			editable: false,
			cellStyle: {
				fontSize: '14.5px',
			},
			filter: false,
			suppressMenu: true,
			wrapHeaderText: true,
			autoHeaderHeight: true,
		};
	}, []);

	useEffect(() => {
		fetchData();
	}, [fileNoteId]);

	useEffect(() => {
		loadData();
	}, [templateData, currentPage, pageSize]);

	const getHeaderTemplate = (columnName) => {
		const isHighlighted = duplicateHighlightColumns.includes(columnName);
		return `<span>${columnName} ${isHighlighted ? '📌' : ''}</span>`;
	};

	useEffect(() => {
		const fetchColumn = async () => {
			try {
				let colDefs = [
					{
						headerName: 'STT',
						field: 'rowId',
						width: '55',
						editable: false,
						...filter(),
					},
					// {
					// 	pinned: 'left',
					// 	width: '45',
					// 	field: 'delete',
					// 	suppressHeaderMenuButton: true,
					// 	cellStyle: { textAlign: 'center' },
					// 	headerName: '',
					// 	cellRenderer: (params) => {
					// 		if (!params.data || !params.data.rowId) {
					// 			return null;
					// 		}
					// 		return <PopupDeleteRenderer id={params.data.rowId} reload={loadData} />;
					// 	},
					// 	editable: false,
					// },
				];

				const sortedColumns = [...templateColumns].sort(
					(a, b) => (a.columnIndex || 0) - (b.columnIndex || 0),
				);
				for (const col of sortedColumns) {
					const columnDef = {
						headerName: /^\d+$/.test(col.columnName) ? `Tháng ${col.columnName}` : col.columnName,
						field: col.columnName,
						width: col.columnWidth ? col.columnWidth : 100,
						cellEditor: 'agTextCellEditor',
						cellStyle: (params) => {
							const styles = {
								backgroundColor: col.bgColor || '#ffffff',
								color: col.textColor || '#000000',
							};

							if (duplicateHighlightColumns.includes(col.columnName) && params.data) {
								const fieldValue = params.value;
								if (
									fieldValue !== null &&
									fieldValue !== undefined &&
									fieldValue !== ''
								) {
									const soLanXuatHien = rowData.filter(
										(row) => row[col.columnName] === fieldValue,
									).length;

									if (soLanXuatHien > 1) {
										styles.backgroundColor = '#FFF3CD';
										styles.color = '#856404';
										styles.fontWeight = 'bold';
									}
								}
							}

							// Handle conditional column rendering
							if (col.columnType === 'conditional' && params.data && col.conditionalOptions) {
								const { sourceColumn, compareValue, displayText } = col.conditionalOptions;
								if (sourceColumn && compareValue !== undefined && displayText && params.data[sourceColumn] === compareValue) {
									// Apply distinctive styling to highlight the conditional display
									styles.fontWeight = 'bold';
									styles.backgroundColor = '#E6F7FF';  // Light blue background
									styles.color = '#1890FF';            // Blue text
								}
							}

							if (col.columnType === 'number' && col.columnName !== 'Năm') {
								styles.textAlign = 'right';
							}

							return styles;
						},
						headerComponentParams: {
							template: getHeaderTemplate(/^\d+$/.test(col.columnName) ? `Tháng ${col.columnName}` : col.columnName),
							onClick: (e) => {
								e.stopPropagation();
								toggleDuplicateHighlight(col.columnName);
							},
						},
						// editable: (params) => {
						// 	if (['Thời gian'].includes(col.columnName)) {
						// 		return false;
						// 	}
						// 	if (!params.data) return false;
						// 	const columnConfig = templateColumns.find(
						// 		(c) => c.columnName == params.colDef.field,
						// 	);
						// 	if (!columnConfig) return true;
						// 	if (!columnConfig.editor?.restricted) return true;
						// 	return columnConfig.editor.users.includes(currentUser.email);
						// },
						...filter(),
						valueGetter: (params) => {
							if (col.columnType === 'conditional' && params.data && col.conditionalOptions) {
								const { sourceColumn, compareValue, displayText } = col.conditionalOptions;
								if (sourceColumn && compareValue !== undefined && params.data[sourceColumn] === compareValue) {
									return displayText;
								}
								return '';  // Return empty if condition not met
							}
							return params.data ? params.data[col.columnName] : '';
						},
					};

					if (
						col.columnType == 'select' ||
						col.columnName == 'Ngày' ||
						col.columnName == 'Tháng'
					) {
						columnDef.cellEditor = 'agSelectCellEditor';
						if (col.columnName == 'Ngày') {
							columnDef.cellEditorParams = {
								values: Array.from({ length: 31 }, (_, i) => i + 1),
							};
						} else if (col.columnName == 'Tháng') {
							columnDef.cellEditorParams = {
								values: Array.from({ length: 12 }, (_, i) => i + 1),
							};
						} else {
							columnDef.cellEditorParams = {
								values: col.selectOptions || [],
							};
						}
					}

					if (col.columnName == 'Năm') {
						columnDef.cellEditor = 'agNumberCellEditor';
						columnDef.valueParser = (params) => {
							const value = Number(params.newValue);
							return isNaN(value) ? null : value;
						};
						columnDef.cellEditorParams = {
							min: 1900,
							max: 3000,
						};
					}

					const originalCellStyle = columnDef.cellStyle;

					if (col.columnType == 'number' && col.columnName !== 'Năm') {
						columnDef.cellEditor = 'agNumberCellEditor';
						columnDef.valueFormatter = (params) => {
							if (
								params.value == null ||
								params.value == undefined ||
								params.value == 0
							)
								return '-';
							return Number(params.value).toLocaleString('en-US', {
								useGrouping: true,
							});
						};
						columnDef.cellStyle = (params) => {
							const originalStyles = originalCellStyle(params);
							return {
								...originalStyles,
								textAlign: 'right',
							};
						};
						columnDef.valueParser = (params) => {
							if (typeof params.newValue == 'string') {
								const cleanValue = params.newValue.replace(/,/g, '');
								return isNaN(parseFloat(cleanValue)) ? 0 : parseFloat(cleanValue);
							}
							return params.newValue;
						};
					}

					if (col.columnType == 'select') {
						columnDef.cellEditor = 'agSelectCellEditor';
						columnDef.cellEditorParams = {
							values: col.selectOptions || [],
						};
					}

					if (col.columnType == 'file') {
						// columnDef.editable = false;
						columnDef.cellRenderer = (params) => {
							console.log('params', params);
							return (
								<>
									<PopUpUploadFile
										id={`Template_${params.data.rowId}`}
										table={`${fileNoteId}_Template`}
										onGridReady={loadData}
										card={'fileNoteId'}
									/>
								</>
							);
						};
					}

					if (col.columnType == 'date') {
						columnDef.cellRenderer = (params) => {
							if (params.value) {
								return params.value;
							}
							return '';
						};

						columnDef.cellEditor = 'agDateCellEditor';
						columnDef.cellEditorParams = {
							formatString: 'dd/MM/yyyy',
							minDate: new Date('1900-01-01'),
							maxDate: new Date('2100-12-31'),
						};
						columnDef.valueParser = (params) => {
							return new Date(params.newValue);
						};
					}

					if (col.columnType == 'formula') {
						columnDef.cellEditor = 'agNumberCellEditor';
						columnDef.aggFunc = 'sum';
						columnDef.valueGetter = (params) => {
							try {
								const scope = col.selectFormula.variables.reduce((acc, curr) => {
									const key = Object.keys(curr)[0];
									const value = params.data[curr[key]];
									acc[key] =
										value == null || value == undefined
											? 0
											: typeof value == 'string'
												? value == '-'
													? 0
													: isNaN(parseFloat(value.replace(/,/g, '')))
														? NaN
														: parseFloat(value.replace(/,/g, ''))
												: Number(value);

									return acc;
								}, {});

								if (Object.values(scope).some((val) => isNaN(val))) {
									console.log(scope);
									return NaN;
								}

								const result = evaluate(col.selectFormula.formula, scope);
								return isNaN(result) ? NaN : result;
							} catch (error) {
								console.error('Formula evaluation error:', error);
								return NaN;
							}
						};
						columnDef.valueFormatter = (params) => {
							if (
								params.value == null ||
								params.value == undefined ||
								isNaN(params.value)
							) {
								return 'NaN';
							}
							return params.value.toLocaleString('en-US', {
								useGrouping: true,
							});
						};
						columnDef.valueParser = (params) => {
							if (
								params.newValue == null ||
								params.newValue == undefined ||
								params.newValue == ''
							) {
								return NaN;
							}
							return Number(params.newValue.replace(/,/g, ''));
						};

						// columnDef.editable = false;
						columnDef.cellStyle = (params) => {
							const originalStyles = originalCellStyle(params);
							return {
								...originalStyles,
								textAlign: 'right',
							};
						};
					}

					if (col.columnName == 'Thời gian') {
						columnDef.valueGetter = (params) => {
							if (!params.data) return '';
							const day = params.data['Ngày'];
							const month = params.data['Tháng'];
							const year = params.data['Năm'];

							if (!day || !month || !year) return '';

							return `${day}/${month}/${year}`;
						};
						// columnDef.editable = false;
					}

					if (col.columnType === 'duyet') {
						columnDef.cellEditor = 'agSelectCellEditor';

						// Default options for duyet column
						const duyetOptions = ['Chưa Duyệt', 'Duyệt'];

						columnDef.cellEditorParams = {
							values: duyetOptions,
						};

						// Add cell renderer to show different colors based on value
						columnDef.cellStyle = (params) => {
							const originalStyles = originalCellStyle
								? originalCellStyle(params)
								: {};

							if (params.value === 'Duyệt') {
								return {
									...originalStyles,
									backgroundColor: '#e6f7e6', // Light green for approved
									color: '#008000',
									fontWeight: 'bold',
								};
							} else if (params.value === 'Chưa Duyệt') {
								return {
									...originalStyles,
									backgroundColor: '#fff3cd', // Light yellow for not approved
									color: '#856404',
								};
							}

							return originalStyles;
						};

					}

					if (col.columnType === 'conditional') {
						// Make sure conditional columns are not editable
						// columnDef.editable = false;

						// Override the valueGetter function with a more robust implementation
						columnDef.valueGetter = (params) => {
							if (!params.data) return '';

							if (col.conditionalOptions) {
								const { sourceColumn, compareValue, displayText } = col.conditionalOptions;

								// Check if the source column exists in the data
								if (sourceColumn && params.data) {
									let cellValue;

									// Special handling for Thời gian
									if (sourceColumn === 'Thời gian' && params.data['Ngày'] && params.data['Tháng'] && params.data['Năm']) {
										// Format Thời gian as "dd/mm/yyyy" for comparison
										cellValue = `${params.data['Ngày']}/${params.data['Tháng']}/${params.data['Năm']}`;
									} else {
										// Normal handling for other columns
										cellValue = params.data[sourceColumn];
									}

									// Convert both values to strings for comparison to handle different data types
									const cellValueStr = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
									const compareValueStr = compareValue !== null && compareValue !== undefined ? String(compareValue) : '';

									// Log values for debugging
									console.log(`Conditional column "${col.columnName}": comparing "${cellValueStr}" with "${compareValueStr}"`);

									// Compare as strings to handle different types
									if (cellValueStr === compareValueStr) {
										return displayText || '';
									}
								}
								return '';  // Return empty string if condition not met
							}
							return '';  // Default empty string
						};
					}

					if (col.columnType === 'dateCalc') {
						// Date calculation columns should not be editable
						// columnDef.editable = false;

						// Function to parse a date from data
						const getDateFromField = (params, fieldName) => {
							if (!params.data || !fieldName) return null;

							if (fieldName === 'Thời gian') {
								// Handle special Thời gian field
								const day = params.data['Ngày'];
								const month = params.data['Tháng'];
								const year = params.data['Năm'];

								if (!day || !month || !year) return null;

								return new Date(year, month - 1, day);
							}

							// Regular date field or specified date field
							if (params.data[fieldName]) {
								if (typeof params.data[fieldName] === 'string') {
									// Handle date string formats
									return new Date(params.data[fieldName]);
								} else if (params.data[fieldName] instanceof Date) {
									// Handle Date objects
									return params.data[fieldName];
								}
							}

							return null;
						};

						// Get a static date or today's date based on settings
						const getStaticDate = (calcDateSettings, isStart) => {
							if (isStart) {
								if (calcDateSettings?.useStartToday) {
									return new Date();
								} else if (calcDateSettings?.startDate) {
									return new Date(calcDateSettings.startDate);
								}
							} else {
								if (calcDateSettings?.useEndToday) {
									return new Date();
								} else if (calcDateSettings?.endDate) {
									return new Date(calcDateSettings.endDate);
								}
							}
							return null;
						};

						// Define valueGetter for dateCalc
						columnDef.valueGetter = (params) => {
							if (!params.data || !col.selectCalcDate) return '';

							// Get start date
							let startDate = null;
							if (col.selectCalcDate.useColumnDate && col.selectCalcDate.columnName) {
								startDate = getDateFromField(params, col.selectCalcDate.columnName);
							} else {
								startDate = getStaticDate(col.selectCalcDate, true);
							}

							// Get end date
							let endDate = null;
							if (col.selectCalcDate.useEndDateColumn && col.selectCalcDate.endDateColumnName) {
								endDate = getDateFromField(params, col.selectCalcDate.endDateColumnName);
							} else {
								endDate = getStaticDate(col.selectCalcDate, false);
							}

							// Calculate days difference
							if (startDate && endDate) {
								// Convert both dates to midnight for accurate day calculation
								const d1 = new Date(startDate);
								d1.setHours(0, 0, 0, 0);

								const d2 = new Date(endDate);
								d2.setHours(0, 0, 0, 0);

								// Calculate difference in milliseconds and convert to days
								const diffTime = d2.getTime() - d1.getTime();
								const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

								return diffDays;
							}

							return '';
						};

						// Format the display of the days difference
						columnDef.valueFormatter = (params) => {
							if (params.value === null || params.value === undefined || params.value === '') {
								return '';
							}

							const days = Number(params.value);

							if (isNaN(days)) {
								return 'N/A';
							}

							return days > 0
								? `Còn ${days} ngày`
								: days < 0
									? `Quá ${Math.abs(days)} ngày`
									: 'Hôm nay';
						};

						// Add styling based on the value
						const originalCellStyleFn = columnDef.cellStyle;
						columnDef.cellStyle = (params) => {
							const originalStyles = originalCellStyleFn ? originalCellStyleFn(params) : {};

							if (!params.value && params.value !== 0) return originalStyles;

							const days = Number(params.value);

							if (isNaN(days)) return originalStyles;

							if (days > 5) {
								// Plenty of time left - green
								return {
									...originalStyles,
									backgroundColor: '#e6f7e6',
									color: '#008000',
								};
							} else if (days > 0) {
								// Getting closer - yellow
								return {
									...originalStyles,
									backgroundColor: '#fff3cd',
									color: '#856404',
								};
							} else if (days === 0) {
								// Today - blue
								return {
									...originalStyles,
									backgroundColor: '#cce5ff',
									color: '#004085',
									fontWeight: 'bold',
								};
							} else {
								// Overdue - red
								return {
									...originalStyles,
									backgroundColor: '#f8d7da',
									color: '#721c24',
									fontWeight: 'bold',
								};
							}
						};
					}

					colDefs.push(columnDef);
				}
				console.log(colDefs);
				setColDefs(colDefs);
			} catch (e) {
				console.error('Error setting column definitions:', e);
				toast.error('Error setting up columns');
			}
		};

		fetchColumn();
	}, [templateColumns, isDataLoaded, duplicateHighlightColumns, isStatusFilter]);

	const fetchData = async () => {
		if (!fileNoteId) return;
		try {
			const fileNote = await getFileNotePadByIdController(fileNoteId);
			const templateInfo = await getTemplateByFileNoteId(fileNoteId);
			const template = templateInfo[0];
			if (template) {
				// Get existing columns first
				const existingColumns = await getTemplateColumn(template.id);

				// Define required columns
				const requiredColumns = [
					{
						columnName: 'Ngày',
						columnType: 'select',
						selectOptions: Array.from({ length: 31 }, (_, i) =>
							(i + 1).toString().padStart(2, '0'),
						),
					},
					{
						columnName: 'Tháng',
						columnType: 'select',
						selectOptions: Array.from({ length: 12 }, (_, i) =>
							(i + 1).toString().padStart(2, '0'),
						),
					},
					{
						columnName: 'Năm',
						columnType: 'text',
					},
					{
						columnName: 'Thời gian',
						columnType: 'date',
						editor: { restricted: true, users: [] },
					},
				];

				// Filter out columns that already exist
				const columnsToCreate = requiredColumns.filter(
					required => !existingColumns.some(
						existing => existing.columnName == required.columnName,
					),
				);

				// Create only missing columns
				// if (columnsToCreate.length > 0) {
				// 	await Promise.all(
				// 		columnsToCreate.map(column =>
				// 			createTemplateColumn({
				// 				tableId: template.id,
				// 				...column,
				// 				show: true,
				// 			}),
				// 		),
				// 	);
				// }

				const templateColumn = await getTemplateColumn(template.id);
				setIsDataLoaded(true);
				setFileNote(fileNote);
				setTemplateData(template);
				setTemplateColumns(templateColumn);
			}

		} catch (e) {
			console.error(e);
			// toast.error('Lỗi khi lấy dữ liệu');
		}
	};

	const onColumnMoved = useCallback(
		async (event) => {
			if (event.finished && event.api) {
				try {
					const allColumns = event.api
						.getColumnDefs()
						.filter((col) => col.field !== 'rowId' && col.field !== 'delete')
						.map((column, index) => ({
							id: templateColumns.find((col) => col.columnName == column.field)?.id,
							columnIndex: index,
						}))
						.filter((col) => col.id);

					await updateColumnIndexes({
						tableId: templateData.id,
						columns: allColumns,
					});
				} catch (e) {
					console.error('Error saving column indexes:', error);
					toast.error('Đã xảy ra lỗi khi lưu thứ tự cột');
					fetchData();
				}
			}
		},
		[fileNoteId, templateColumns],
	);

	const handleChange = (name) => {
		setSelectedUC((prev) => {
			const newSet = new Set(prev);
			newSet.has(name) ? newSet.delete(name) : newSet.add(name);
			return newSet;
		});
	};

	const loadData = async () => {
		if (templateData.id) {
			try {
				const response = await getTemplateRow(templateData.id, null, false, currentPage, pageSize);
				if (response && response.rows) {
					const rows = response.rows.map((row) => ({
						...row.data,
						rowId: row.id,
					}));
					setRowData(rows);
					setTotalRows(response.count);
				} else {
					setRowData([]);
					setTotalRows(0);
				}
			} catch (e) {
				console.error('Error loading row data:', error);
				toast.error('Error loading row data');
			}
		}
	};


	const onColumnResized = async (event) => {
		if (event.finished) {
			const resizedColumn = templateColumns.find(
				(column) => column.columnName == event.column?.getColId(),
			);
			if (resizedColumn) {
				await updateTemplateColumnWidth({
					id: resizedColumn.id,
					width: event.column.getActualWidth(),
				});
			}
		}
	};


	useEffect(() => {
		if (location.pathname.endsWith('/form')) {
			setIsFormModalVisible(true);
		} else {
			setIsFormModalVisible(false);
		}
	}, [location.pathname]);

	return currentUser.isAdmin || isView ? (
		<>
			{templateData && !templateData.isCombine &&
				<div className="report">
					<div className="report__header">
						<div className="sheet_title">
							<span style={{ fontSize: '17px' , color : '#262626'}}>{fileNote && fileNote.name && fileNote.name}</span>
						</div>
						<div className="report__button-group">
							<Button
								shape='round'
								onClick={handleChangeStatusFilter}
								style={{
									backgroundColor: isStatusFilter ? '#e0e0e0' : 'transparent',
								}}
								>
								<span style={{color : '#868686'}}>Filter</span>
							</Button>
							{/*<ActionChangeFilter*/}
							{/*	isStatusFilter={isStatusFilter}*/}
							{/*	handleChangeStatusFilter={handleChangeStatusFilter}*/}
							{/*/>*/}
						</div>
					</div>
					<div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
						<AgGridReact
							statusBar={statusBar}
							ref={gridRef}
							rowData={rowData}
							defaultColDef={defaultColDef}
							columnDefs={colDefs}
							rowSelection="multiple"
							enableRangeSelection={true}
							// onCellValueChanged={handleCellValueChanged}
							animateRows={true}
							localeText={AG_GRID_LOCALE_VN}
							onColumnResized={onColumnResized}
							onColumnMoved={onColumnMoved}
							suppressScrollOnNewData={true}
							maintainColumnOrder={true}
							groupDefaultExpanded={0}
							pagination={false}
						/>
					</div>
					<div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb' }}>
						<Pagination
							current={currentPage}
							pageSize={pageSize}
							total={totalRows}
							onChange={handlePageChange}
							showSizeChanger
							pageSizeOptions={[10000, 20000, 50000, 100000]}
							showQuickJumper
							showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
						/>
					</div>
				</div>}
			{templateData && templateData.isCombine &&
				<>
					<ViewCombine templateData={templateData} />
				</>
			}
		</>
	) : (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '90vh',
				color: 'red',
				fontSize: '18px',
			}}
		>
			Không có quyền để xem
		</div>
	);
};

export default TemplateView;

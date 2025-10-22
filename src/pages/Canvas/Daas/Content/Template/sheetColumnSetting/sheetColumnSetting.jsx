import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { parse, evaluate, log } from 'mathjs';
import { Box, List, ListItem, ListItemButton, ListItemText, Select, MenuItem, Typography } from '@mui/material';
import { ChromePicker } from 'react-color';
// ICON
import { PlusCircle, Trash2 } from 'lucide-react';
//API
import {
	deleteTemplateCol, getAllTemplateSheetTable,
	getTemplateColumn,
	updateSelectOption,
	updateTemplateColumn,
	updateTemplateFormulaOption,
	updateTemplateRow,
	getTemplateRow,
	updateBatchTemplateRow,
} from '../../../../../../apis/templateSettingService';
import { getFileNotePadByIdController, updateFileNotePad } from '../../../../../../apis/fileNotePadService.jsx';
import { message, Switch, Button, Popconfirm } from 'antd';
import { Template_Table_Type } from '../../../../../../CONST.js';
import styles from './sheetColumnSetting.module.css';
import { getSettingByType } from '../../../../../../apis/settingService.jsx';

const SheetColumnSetting = ({
								fileNote,
								id,
								rowData,
								handleAddColumn,
								sheetColumns,
								setSheetColumns,
								columnTypeOptions,
								handleClosePopUpSetting,
								dropdownOptions,
								setDropdownOptions,
								getData,
								handleCloneColumn,
								listUC,
								templateData,
							}) => {
	const [tempColumnNames, setTempColumnNames] = useState({});
	const [tempColumnTypes, setTempColumnTypes] = useState({});
	const [tempColumnOptions, setTempColumnOptions] = useState({});
	const [selectedColumnIndex, setSelectedColumnIndex] = useState(null);
	const [showTextColorPicker, setShowTextColorPicker] = useState(false);
	const [showBgColorPicker, setShowBgColorPicker] = useState(false);
	const [listTemp, setListTemp] = useState([]);
	const [listColTemp, setListColTemp] = useState([]);
	// const [hideOrderNumber, setHideOrderNumber] = useState(fileNote?.info?.hideOrderNumber || false);
	const [hideOrderNumber, setHideOrderNumber] = useState(fileNote?.info?.hideOrderNumber !== undefined ? fileNote.info.hideOrderNumber : true);
	const [hideFormId, setHideFormId] = useState(fileNote?.info?.hideFormId || false);
	const [showPercentageBarColorPicker, setShowPercentageBarColorPicker] = useState(false);
	const [saving, setSaving] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [hasColumnChanges, setHasColumnChanges] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		if (selectedColumnIndex !== null && sheetColumns[selectedColumnIndex]) {
			const currentColumn = sheetColumns[selectedColumnIndex];
			if (currentColumn.columnType === 'select' && currentColumn.selectOptions) {
				setDropdownOptions(prev => ({
					...prev,
					[selectedColumnIndex]: currentColumn.selectOptions,
				}));
			}
		}
	}, [selectedColumnIndex, sheetColumns]);

	useEffect(() => {
		loadColumnData();
	}, [id]); // Re-run when id changes

	async function getAllTemplate() {
		let data = await getAllTemplateSheetTable();
		// for (const item of data) {
		// 	if (item.fileNote_id) {
		// 		let fileNote = await getFileNotePadByIdController(item.fileNote_id);
		// 		item.name = fileNote?.name;
		// 		item.value = 'TEMP_' + item.id;
		// 		item.type = fileNote?.table;
		// 		let columns = await getTemplateColumn(item.id);
		// 		item.fields = columns.map(col => {
		// 			let table = { headerName: col.columnName, field: col.columnName, type: col.columnType };
		// 			return table;
		// 		});
		// 	}
		// }
		data = data.filter(item => item.type === 'Template');
		setListTemp(data);
	}

	async function loadColTemps() {
		let col = sheetColumns[selectedColumnIndex];
		if (col && col.selectVLookUp && col.selectVLookUp.temp) {
			let cols = await getTemplateColumn(col.selectVLookUp.temp);
			setListColTemp(cols);
		}
	}

	useEffect(() => {
		loadColTemps().then();
	}, [selectedColumnIndex]);

	useEffect(() => {
		getAllTemplate().then();
	}, []);

	const updateFileNoteSettings = async (updates, messageType) => {
		const updatedInfo = {
			...(fileNote?.info || {}),
			...updates,
		};

		const updateData = {
			id: fileNote?.id,
			info: updatedInfo,
		};

		try {
			await updateFileNotePad(updateData);
			// Display specific success message based on messageType
			switch (messageType) {
				case 'time':
					message.success('Cập nhật mô tả thời gian thành công');
					break;
				case 'hideOrderNumber':
					message.success('Cập nhật hiển thị STT thành công');
					break;
				case 'hideFormId':
					message.success('Cập nhật hiển thị ID Phiếu thành công');
					break;
				default:
					message.success('Cập nhật cài đặt thành công');
			}
		} catch (error) {
			console.error('Lỗi khi cập nhật cài đặt:', error);
			message.error('Có lỗi xảy ra khi cập nhật cài đặt');
		}
	};

	const handleToggleColumnVisibility = async (type, checked) => {
		if (type === 'hideOrderNumber') {
			setHideOrderNumber(checked);
		} else if (type === 'hideFormId') {
			setHideFormId(checked);
		}

		await updateFileNoteSettings(
			{
				hideOrderNumber: type === 'hideOrderNumber' ? checked : hideOrderNumber,
				hideFormId: type === 'hideFormId' ? checked : hideFormId,
			},
			type,
		);
	};

	const handleColumnTypeChange = async (index, type) => {
		try {
			// First update the column type in database
			await updateTemplateColumn({
				id: sheetColumns[index].id,
				columnType: type,
			});

			const newColumns = [...sheetColumns];
			newColumns[index].columnType = type;

			// Initialize duyet options if the type is changed to duyet
			if (type === 'duyet' && !newColumns[index].duyetOptions) {
				newColumns[index].duyetOptions = {
					selectedUC: [],
					defaultOptions: ['Chưa Duyệt', 'Duyệt'],
				};
			}

			// Initialize conditional options if the type is changed to conditional
			if (type === 'conditional' && !newColumns[index].conditionalOptions) {
				newColumns[index].conditionalOptions = {
					sourceColumn: '',
					compareValue: '',
					displayText: '',
				};
			}
			if (type === 'duyet_dieu_kien' && !newColumns[index].duyetDieuKien) {
				newColumns[index].duyetDieuKien = {
					conditions: [{
						column: '',
						operator: '=',
						value: '',
						logicOperator: 'AND',
					}],
					ucTrue: '',
					ucFalse: '',
					defaultOptions: ['Chưa Duyệt', 'Duyệt'],
				};
			}
			// Always set for date_time_picker
			if (type === 'date_time_picker') {
				newColumns[index].setting_date_time_picker = {
					format: 'datetime',
					use12Hours: false,
				};
			}
			// Initialize for time_diff
			if (type === 'time_diff' && !newColumns[index].setting_time_diff) {
				newColumns[index].setting_time_diff = {
					startColumn: '',
					endColumn: '',
					unit: 'days', // 'days', 'hours', 'minutes'
				};
			}
			// Initialize for date_split
			if (type === 'date_split' && !newColumns[index].formulaDate) {
				newColumns[index].formulaDate = {
					sourceColumn: '',
					part: '',
				};
			}

			// Update local state
			setSheetColumns(newColumns);
			setTempColumnTypes({ ...tempColumnTypes, [index]: type });
			setHasColumnChanges(true);

			// Calculate values for all rows if the column type is formula or date_split
			if (type === 'formula' || type === 'date_split') {
				// Get all rows
				const rowsResponse = await getTemplateRow(id);
				const rows = rowsResponse.rows || [];

				// Process each row
				for (const row of rows) {
					const rowId = row.id; // hoặc row.rowId nếu đúng
					let newData = { ...row.data };

					if (type === 'formula' && newColumns[index].selectFormula?.variables) {
						try {
							const scope = {};
							for (const variable of newColumns[index].selectFormula.variables) {
								const [key, columnName] = Object.entries(variable)[0];
								const value = newData[columnName];
								scope[key] = value === null || value === undefined || value === '' || value === '-'
									? 0
									: typeof value === 'string'
										? parseFloat(value.replace(/,/g, '')) || 0
										: Number(value) || 0;
							}
							const result = evaluate(newColumns[index].selectFormula.formula, scope);
							newData[newColumns[index].columnName] = isNaN(result) ? null : result;
						} catch (error) {
							console.error(`Formula evaluation error for column ${newColumns[index].columnName}:`, error);
							newData[newColumns[index].columnName] = null;
						}
					}

					if (type === 'date_split' && newColumns[index].formulaDate?.sourceColumn) {
						const sourceValue = newData[newColumns[index].formulaDate.sourceColumn];
						if (sourceValue) {
							try {
								const date = new Date(sourceValue);
								if (!isNaN(date.getTime())) {
									switch (newColumns[index].formulaDate.part) {
										case 'day':
											newData[newColumns[index].columnName] = String(date.getDate()).padStart(2, '0');
											break;
										case 'month':
											newData[newColumns[index].columnName] = String(date.getMonth() + 1).padStart(2, '0');
											break;
										case 'year':
											newData[newColumns[index].columnName] = date.getFullYear().toString();
											break;
									}
								}
							} catch (error) {
								console.error(`Error processing date_split for column ${newColumns[index].columnName}:`, error);
								newData[newColumns[index].columnName] = '';
							}
						}
					}

					// Update the row with calculated values
					await updateTemplateRow({
						id: rowId,
						data: newData,
					});
				}

				// Refresh data after updating all rows
				await getData();
				toast.success('Đã tính toán lại giá trị cho tất cả các dòng');
			}
		} catch (error) {
			console.error('Error updating column type:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật loại cột');
		}
	};

	const handleColumnNameChange = (index, value) => {
		if (value.includes('.')) {
			toast.error('Tên cột không được chứa dấu chấm (.)');
			return;
		}

		const newColumns = [...sheetColumns];
		newColumns[index].columnName = value;
		// setSheetColumns(newColumns);
		setTempColumnNames({ ...tempColumnNames, [index]: value });
		setHasColumnChanges(true);
	};

	const handleColumnNameBlur = async (index) => {
		const name = tempColumnNames[index];
		const sheetColumn = await getTemplateColumn(id);
		let oldColumnName = '';
		try {
			oldColumnName = sheetColumn[index].columnName;
		} catch (e) {
			oldColumnName = sheetColumn[index - 4].columnName;
		}

		// Don't proceed if no name change
		if (!name || name === oldColumnName) return;

		// Check for duplicate column names
		for (let i = 0; i < sheetColumn.length; i++) {
			if (i !== index && sheetColumn[i].columnName === name) {
				toast.error('Tên cột đã tồn tại');
				return;
			}
		}

		try {
			// First update the column name in the template
			await updateTemplateColumn({
				id: sheetColumns[index].id,
				columnName: name,
			});

			// Update formula references in other columns
			const formulaColumns = sheetColumns.filter(col => col.columnType === 'formula');
			for (const column of formulaColumns) {
				if (column.selectFormula?.variables) {
					let needsUpdate = false;
					const updatedVariables = column.selectFormula.variables.map(variable => {
						const varKey = Object.keys(variable)[0];
						const varValue = Object.values(variable)[0];

						if (varValue === oldColumnName) {
							needsUpdate = true;
							return { [varKey]: name };
						}
						return variable;
					});

					if (needsUpdate) {
						await updateTemplateFormulaOption({
							id: column.id,
							formulaOptions: {
								formula: column.selectFormula.formula,
								variables: updatedVariables,
							},
						});

						// Update the column in sheetColumns to reflect the change
						const colIndex = sheetColumns.findIndex(col => col.id === column.id);
						if (colIndex !== -1) {
							const updatedColumns = [...sheetColumns];
							updatedColumns[colIndex] = {
								...updatedColumns[colIndex],
								selectFormula: {
									...updatedColumns[colIndex].selectFormula,
									variables: updatedVariables,
								},
							};
							setSheetColumns(updatedColumns);
						}
					}
				}
			}

			// Then update all rows to rename the column in the data
			for (const row of rowData) {
				const { rowId, ...data } = row;
				const updatedData = { ...data };

				// Only copy the value if the old column exists
				if (oldColumnName in updatedData) {
					updatedData[name] = updatedData[oldColumnName];
					delete updatedData[oldColumnName];
				}

				await updateTemplateRow({
					id: rowId,
					data: updatedData,
				});
			}

			// Update the local state to reflect the new column name
			const updatedColumns = [...sheetColumns];
			updatedColumns[index] = {
				...updatedColumns[index],
				columnName: name,
			};
			setSheetColumns(updatedColumns);

			toast.success('Đổi tên cột thành công');
		} catch (error) {
			console.error('Error updating column name:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật tên cột.');
		}
	};

	const handleColumnTypeBlur = async (index) => {
		const type = tempColumnTypes[index];
		if (type) {
			try {
				await updateTemplateColumn({
					id: sheetColumns[index].id,
					columnType: type,
				});
			} catch (error) {
				console.error('Error updating column type:', error);
				toast.error('Đã xảy ra lỗi khi cập nhật loại cột.');
			}
		}
	};

	const handleRemoveColumn = async (index) => {
		setIsDeleting(true);
		const columnToRemove = sheetColumns[index];
		columnToRemove['show'] = false;
		const newColumns = sheetColumns.filter((_, colIndex) => colIndex !== index);

		try {
			await deleteTemplateCol({
				tableId: id,
				rowId: columnToRemove.id,
				columnName: columnToRemove.columnName,
			});

			setSheetColumns(newColumns);
			setHasColumnChanges(true);
			setSelectedColumnIndex(null); // Clear selection after deletion

			if (newColumns.length === 0) {
				setSelectedColumnIndex(null);
			} else if (index >= newColumns.length) {
				setSelectedColumnIndex(newColumns.length - 1);
			}
		} catch (error) {
			console.error('Error removing column:', error);
			toast.error('Đã xảy ra lỗi khi xóa cột');
		} finally {
			setIsDeleting(false);
		}
	};

	const handleAddOption = async (index) => {
		const newOption = tempColumnOptions[index];
		if (newOption) {
			const updatedOptions = [...(dropdownOptions[index] || []), newOption];
			setDropdownOptions((prev) => ({
				...prev,
				[index]: updatedOptions,
			}));
			setTempColumnOptions({ ...tempColumnOptions, [index]: '' });

			const columnId = sheetColumns[index].id;
			await updateSelectOption({ id: columnId, selectOptions: updatedOptions });

			const newColumns = [...sheetColumns];
			newColumns[index] = {
				...newColumns[index],
				selectOptions: updatedOptions,
			};
			setSheetColumns(newColumns);
		}
	};

	const handleRemoveOption = (columnIndex, optionIndex) => {
		const updatedOptions = dropdownOptions[columnIndex].filter(
			(_, idx) => idx !== optionIndex,
		);
		setDropdownOptions((prev) => ({
			...prev,
			[columnIndex]: updatedOptions,
		}));

		const columnId = sheetColumns[columnIndex].id;

		updateSelectOption({ id: columnId, selectOptions: updatedOptions });

		const newColumns = [...sheetColumns];
		newColumns[columnIndex] = {
			...newColumns[columnIndex],
			selectOptions: updatedOptions,
		};
		setSheetColumns(newColumns);
	};

	const handleColumnFormulaSelect = async (column) => {
		if (!column.selectFormula?.formula) {
			toast.error('Vui lòng nhập công thức');
			return;
		}

		try {
			parse(column.selectFormula.formula);
			await updateTemplateFormulaOption({
				id: column.id,
				formulaOptions: column.selectFormula,
			});
			setHasColumnChanges(true);
		} catch (error) {
			console.error('Formula parsing error:', error);
			toast.error('Công thức không hợp lệ');
		}
	};

	const handleColumnColorChange = async (index, type, color) => {
		const newColumns = [...sheetColumns];
		if (type === 'text') {
			newColumns[index].textColor = color;
		} else if (type === 'bg') {
			newColumns[index].bgColor = color;
		} else if (type === 'percentageBar') {
			newColumns[index].percentageBarColor = color;
		}
		setSheetColumns(newColumns);
		setHasColumnChanges(true);

		try {
			let updateField = {};
			if (type === 'text') updateField = { textColor: color };
			else if (type === 'bg') updateField = { bgColor: color };
			else if (type === 'percentageBar') updateField = { percentageBarColor: color };

			await updateTemplateColumn({
				id: sheetColumns[index].id,
				...updateField,
			});
		} catch (error) {
			console.error(`Error updating column ${type} color:`, error);
			toast.error(`Lỗi khi cập nhật màu ${type === 'percentageBar' ? 'thanh phần trăm' : type}`);
		}
	};

	const handleRemoveVariable = async (column, varIndex) => {
		try {
			const updatedColumns = sheetColumns.map((col) => {
				if (col.id === column.id) {
					const newVariables = [...(col.selectFormula?.variables || [])];
					newVariables.splice(varIndex, 1);
					return {
						...col,
						selectFormula: {
							...col.selectFormula,
							variables: newVariables,
						},
					};
				}
				return col;
			});

			setSheetColumns(updatedColumns);
			setHasColumnChanges(true);
			const updatedColumn = updatedColumns.find((col) => col.id === column.id);

			await updateTemplateFormulaOption({
				id: column.id,
				formulaOptions: {
					formula: updatedColumn.selectFormula.formula,
					variables: updatedColumn.selectFormula.variables,
				},
			});

			toast.success('Xóa biến thành công');
		} catch (error) {
			console.error('Error removing variable:', error);
			toast.error('Đã xảy ra lỗi khi xóa biến');
			getData();
		}
	};

	const handleDateCalcSettingsChange = async (column, updates) => {
		try {
			const updatedColumns = sheetColumns.map((col) => {
				if (col.id === column.id) {
					return {
						...col,
						selectCalcDate: {
							...col.selectCalcDate,
							...updates,
						},
					};
				}
				return col;
			});
			setSheetColumns(updatedColumns);
			setHasColumnChanges(true);

			// Update in database
			await updateTemplateColumn({
				id: column.id,
				selectCalcDate: {
					...column.selectCalcDate,
					...updates,
				},
			});

		} catch (error) {
			console.error('Error updating date calc settings:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật cài đặt tính ngày');
		}
	};

	const handlePercentageTypeChange = async (index, type) => {
		const newColumns = [...sheetColumns];
		newColumns[index].bieuTuongPhanTram = { type: '0-100' };
		setSheetColumns(newColumns);
		setHasColumnChanges(true);

		try {
			await updateTemplateColumn({
				id: sheetColumns[index].id,
				bieuTuongPhanTram: { type: '0-100' },
			});
			toast.success('Cập nhật kiểu phần trăm thành công');
		} catch (error) {
			console.error('Error updating percentage type:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật kiểu phần trăm');
		}
	};

	const renderDateCalcSettings = (column) => {
		return (
			<div className='settings-popup__date-calc-options'>
				{/* Start Date Section */}
				<div className='settings-popup__date-calc-section'>
					<h4>Ngày bắt đầu</h4>
					<div className='settings-popup__date-calc-checkbox'>
						<input
							type='checkbox'
							checked={column.selectCalcDate?.useColumnDate || false}
							onChange={(e) =>
								handleDateCalcSettingsChange(column, {
									...column.selectCalcDate,
									useColumnDate: e.target.checked,
									columnName: '', // Reset when toggling
									useStartToday: false, // Reset today option when choosing column
								})
							}
						/>
						<label>Chọn từ cột</label>
					</div>

					{column.selectCalcDate?.useColumnDate ? (
						<select
							value={column.selectCalcDate?.columnName || ''}
							onChange={(e) =>
								handleDateCalcSettingsChange(column, {
									...column.selectCalcDate,
									columnName: e.target.value,
								})
							}
						>
							<option value=''>Chọn cột</option>
							{sheetColumns
								.filter(col => col.columnType === 'date' || col.columnName === 'Thời gian')
								.map((col) => (
									<option key={col.id} value={col.columnName}>
										{col.columnName}
									</option>
								))}
						</select>
					) : (
						<div>
							<div className='settings-popup__date-calc-checkbox'>
								<input
									type='checkbox'
									checked={column.selectCalcDate?.useStartToday || false}
									onChange={(e) => {
										const today = new Date().toISOString().split('T')[0];
										handleDateCalcSettingsChange(column, {
											...column.selectCalcDate,
											useStartToday: e.target.checked,
											startDate: e.target.checked ? today : '',
										});
									}}
								/>
								<label>Ngày hôm nay</label>
							</div>
							{!column.selectCalcDate?.useStartToday && (
								<input
									type='date'
									value={column.selectCalcDate?.startDate || ''}
									onChange={(e) =>
										handleDateCalcSettingsChange(column, {
											...column.selectCalcDate,
											startDate: e.target.value,
										})
									}
								/>
							)}
						</div>
					)}
				</div>

				{/* End Date Section */}
				<div className='settings-popup__date-calc-section'>
					<h4>Ngày kết thúc</h4>
					<div className='settings-popup__date-calc-checkbox'>
						<input
							type='checkbox'
							checked={column.selectCalcDate?.useEndDateColumn || false}
							onChange={(e) =>
								handleDateCalcSettingsChange(column, {
									...column.selectCalcDate,
									useEndDateColumn: e.target.checked,
									endDateColumnName: '', // Reset when toggling
									useEndToday: false, // Reset today option when choosing column
								})
							}
						/>
						<label>Chọn từ cột</label>
					</div>

					{column.selectCalcDate?.useEndDateColumn ? (
						<select
							value={column.selectCalcDate?.endDateColumnName || ''}
							onChange={(e) =>
								handleDateCalcSettingsChange(column, {
									...column.selectCalcDate,
									endDateColumnName: e.target.value,
								})
							}
						>
							<option value=''>Chọn cột</option>
							{sheetColumns
								.filter(col => col.columnType === 'date' || col.columnName === 'Thời gian')
								.map((col) => (
									<option key={col.id} value={col.columnName}>
										{col.columnName}
									</option>
								))}
						</select>
					) : (
						<div>
							<div className='settings-popup__date-calc-checkbox'>
								<input
									type='checkbox'
									checked={column.selectCalcDate?.useEndToday || false}
									onChange={(e) => {
										const today = new Date().toISOString().split('T')[0];
										handleDateCalcSettingsChange(column, {
											...column.selectCalcDate,
											useEndToday: e.target.checked,
											endDate: e.target.checked ? today : '',
										});
									}}
								/>
								<label>Ngày hôm nay</label>
							</div>
							{!column.selectCalcDate?.useEndToday && (
								<input
									type='date'
									value={column.selectCalcDate?.endDate || ''}
									onChange={(e) =>
										handleDateCalcSettingsChange(column, {
											...column.selectCalcDate,
											endDate: e.target.value,
										})
									}
								/>
							)}
						</div>
					)}
				</div>
			</div>
		);
	};

	const validateEmail = (email) => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(email);
	};

	const validateHour = (hour) => {
		const hourNum = parseInt(hour);
		return !isNaN(hourNum) && hourNum >= 1 && hourNum <= 24;
	};

	const validateDate = (date) => {
		if (!date) return false;
		const selectedDate = new Date(date);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return selectedDate >= today;
	};

	const handleEmailBotSettingsChange = async (column, updates) => {
		try {
			const updatedColumns = sheetColumns.map((col) => {
				if (col.id === column.id) {
					return {
						...col,
						selectEmailBot: {
							...col.selectEmailBot,
							...updates,
						},
					};
				}
				return col;
			});
			setSheetColumns(updatedColumns);
			setHasColumnChanges(true);

			// Update in database
			await updateTemplateColumn({
				id: column.id,
				selectEmailBot: {
					...column.selectEmailBot,
					...updates,
				},
			});
		} catch (error) {
			console.error('Error updating email bot settings:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật cài đặt email bot');
		}
	};

	const renderEmailBotSettings = (column) => {
		const handleHourChange = (e) => {
			const hour = e.target.value;
			if (hour === '' || validateHour(hour)) {
				handleEmailBotSettingsChange(column, {
					...column.selectEmailBot,
					scheduleHour: hour,
				});
			}
		};

		const handleHourBlur = (e) => {
			const hour = e.target.value;
			if (hour && !validateHour(hour)) {
				e.target.classList.add('error');
				toast.error('Giờ phải từ 1 đến 24');
			} else {
				e.target.classList.remove('error');
			}
		};

		const handleDateChange = (e) => {
			const date = e.target.value;
			if (date === '' || validateDate(date)) {
				handleEmailBotSettingsChange(column, {
					...column.selectEmailBot,
					scheduleDate: date,
				});
			}
		};

		const handleDateBlur = (e) => {
			const date = e.target.value;
			if (date && !validateDate(date)) {
				e.target.classList.add('error');
				toast.error('Ngày gửi phải từ ngày hiện tại trở đi');
			} else {
				e.target.classList.remove('error');
			}
		};

		const handleAddTableRow = () => {
			handleEmailBotSettingsChange(column, {
				...column.selectEmailBot,
				tableRows: [
					...(column.selectEmailBot?.tableRows || []),
					{ id: Date.now(), name: '', selectedColumn: '' },
				],
			});
		};

		const handleTableRowChange = (rowId, field, value) => {
			handleEmailBotSettingsChange(column, {
				...column.selectEmailBot,
				tableRows: (column.selectEmailBot?.tableRows || []).map((row) =>
					row.id === rowId ? { ...row, [field]: value } : row,
				),
			});
		};

		const handleRemoveTableRow = (rowId) => {
			handleEmailBotSettingsChange(column, {
				...column.selectEmailBot,
				tableRows: (column.selectEmailBot?.tableRows || []).filter(
					(row) => row.id !== rowId,
				),
			});
		};


		return (
			<div className='settings-popup__email-bot-options'>
				<div className='settings-popup__email-bot-section'>
					<div className='settings-popup__email-bot-content'>
						<div className='settings-popup__email-bot-checkbox'>
							<input
								type='checkbox'
								checked={column.selectEmailBot?.useColumnEmail || false}
								onChange={(e) =>
									handleEmailBotSettingsChange(column, {
										...column.selectEmailBot,
										useColumnEmail: e.target.checked,
										columnName: '',
										email: '',
									})
								}
							/>
							<label>Email người nhận</label>
						</div>
						{column.selectEmailBot?.useColumnEmail ? (
							<select
								value={column.selectEmailBot?.columnName || ''}
								onChange={(e) =>
									handleEmailBotSettingsChange(column, {
										...column.selectEmailBot,
										columnName: e.target.value,
									})
								}
								style={{ marginBottom: '10px' }}
							>
								<option value=''>Chọn cột</option>
								{sheetColumns.map((col) => (
									<option key={col.id} value={col.columnName}>
										{col.columnName}
									</option>
								))}
							</select>
						) : (
							<div className='settings-popup__email-input'>
								<input
									type='email'
									value={column.selectEmailBot?.email || ''}
									onChange={(e) => {
										const email = e.target.value;
										handleEmailBotSettingsChange(column, {
											...column.selectEmailBot,
											email: email,
										});
									}}
									onBlur={(e) => {
										const email = e.target.value;
										if (email && !validateEmail(email)) {
											toast.error('Email không hợp lệ');
										}
									}}
									placeholder='Nhập email'
								/>
							</div>
						)}
					</div>
					<div className='settings-popup__email-bot-content'>
						<div className='settings-popup__schedule-section'>
							<div className='settings-popup__date-selection'>
								<div className='settings-popup__email-bot-checkbox'>
									<input
										type='checkbox'
										checked={column.selectEmailBot?.useDateColumn || false}
										onChange={(e) =>
											handleEmailBotSettingsChange(column, {
												...column.selectEmailBot,
												useDateColumn: e.target.checked,
												dateColumnName: '',
												scheduleDate: '',
											})
										}
									/>
									<label>Chọn ngày gửi từ bảng</label>
								</div>
								{column.selectEmailBot?.useDateColumn ? (
									<select
										value={column.selectEmailBot?.dateColumnName || ''}
										onChange={(e) =>
											handleEmailBotSettingsChange(column, {
												...column.selectEmailBot,
												dateColumnName: e.target.value,
											})
										}
										className='settings-popup__date-select'
									>
										<option value=''>Chọn cột ngày</option>
										{sheetColumns.map((col) => (
											<option key={col.id} value={col.columnName}>
												{col.columnName}
											</option>
										))}
									</select>
								) : (
									<input
										type='date'
										className='settings-popup__date-input'
										value={column.selectEmailBot?.scheduleDate || ''}
										onChange={handleDateChange}
										onBlur={handleDateBlur}
										min={new Date().toISOString().split('T')[0]}
									/>
								)}
							</div>
						</div>
					</div>

					<div className='settings-popup__email-bot-content'>
						<div className='settings-popup__schedule-section'>
							<div className='settings-popup__hour-selector'>
								<label className='settings-popup__hour-label'>
									Giờ gửi email (1-24)
								</label>
								<input
									type='number'
									className='settings-popup__hour-input'
									value={column.selectEmailBot?.scheduleHour || ''}
									onChange={handleHourChange}
									onBlur={handleHourBlur}
									min='1'
									max='24'
									placeholder='VD: 9'
								/>
								<div className='settings-popup__hour-error'>
									Giờ phải từ 1 đến 24
								</div>
							</div>
						</div>
					</div>

					<div className='settings-popup__email-content'>
						<div className='settings-popup__email-field'>
							<label>Tiêu đề:</label>
							<input
								type='text'
								value={column.selectEmailBot?.title || ''}
								onChange={(e) =>
									handleEmailBotSettingsChange(column, {
										...column.selectEmailBot,
										title: e.target.value,
									})
								}
								placeholder='Nhập tiêu đề email'
							/>
						</div>

						<div className='settings-popup__email-field'>
							<label>Nội dung:</label>
							<textarea
								value={column.selectEmailBot?.content || ''}
								onChange={(e) =>
									handleEmailBotSettingsChange(column, {
										...column.selectEmailBot,
										content: e.target.value,
									})
								}
								placeholder='Nhập nội dung email'
								rows={4}
							/>
						</div>

						<div className='settings-popup__table-config'>
							<div className='settings-popup__table-header'>
								<h4>Cấu hình bảng trong email</h4>
								<button
									type='button'
									onClick={handleAddTableRow}
									className='settings-popup__add-row-btn'
								>
									<PlusCircle size={20} />
								</button>
							</div>

							<div className='settings-popup__table-rows'>
								{(column.selectEmailBot?.tableRows || []).map((row) => (
									<div key={row.id} className='settings-popup__table-row'>
										<input
											type='text'
											value={row.name}
											onChange={(e) =>
												handleTableRowChange(row.id, 'name', e.target.value)
											}
											placeholder='Tên dòng'
											className='settings-popup__row-name'
										/>
										<select
											value={row.selectedColumn}
											onChange={(e) =>
												handleTableRowChange(
													row.id,
													'selectedColumn',
													e.target.value,
												)
											}
											className='settings-popup__column-select'
										>
											<option value=''>Chọn cột</option>
											{sheetColumns.map((col) => (
												<option key={col.id} value={col.columnName}>
													{col.columnName}
												</option>
											))}
										</select>
										<button
											type='button'
											onClick={() => handleRemoveTableRow(row.id)}
											className='settings-popup__remove-row-btn'
										>
											<Trash2 size={20} />
										</button>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const handleDuyetOptionsChange = async (index, selectedUC) => {
		const newColumns = [...sheetColumns];
		if (!newColumns[index].duyetOptions) {
			newColumns[index].duyetOptions = {
				selectedUC: selectedUC,
				defaultOptions: ['Chưa Duyệt', 'Duyệt'],
			};
		} else {
			newColumns[index].duyetOptions.selectedUC = selectedUC;
		}
		setSheetColumns(newColumns);
		setHasColumnChanges(true);

		try {
			await updateTemplateColumn({
				id: sheetColumns[index].id,
				duyetOptions: newColumns[index].duyetOptions,
			});
			toast.success('Cập nhật tùy chọn duyệt thành công');
		} catch (error) {
			console.error('Error updating duyet options:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật tùy chọn duyệt');
		}
	};

	const handleConditionalOptionsChange = async (index, updates) => {
		// Ensure compareValue is stored as a string if it's present in updates
		if (updates.compareValue !== undefined) {
			updates.compareValue = String(updates.compareValue);
		}

		const newColumns = [...sheetColumns];
		if (!newColumns[index].conditionalOptions) {
			newColumns[index].conditionalOptions = {
				sourceColumn: '',
				compareValue: '',
				displayText: '',
			};
		}

		newColumns[index].conditionalOptions = {
			...newColumns[index].conditionalOptions,
			...updates,
		};

		setSheetColumns(newColumns);
		setHasColumnChanges(true);

		try {
			await updateTemplateColumn({
				id: sheetColumns[index].id,
				conditionalOptions: newColumns[index].conditionalOptions,
			});
		} catch (error) {
			console.error('Error updating conditional options:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật điều kiện');
		}
	};

	const handleChangeColLookup = async (index, updates) => {
		if (sheetColumns[index]) {
			const newColumns = [...sheetColumns];
			if (!sheetColumns[index].selectVLookUp) {
				await updateTemplateColumn({
					id: sheetColumns[index].id,
					selectVLookUp: updates,
				});
				newColumns[index].selectVLookUp = updates;
			} else {
				await updateTemplateColumn({
					id: sheetColumns[index].id,
					selectVLookUp: { ...sheetColumns[index].selectVLookUp, ...updates },
				});
				newColumns[index].selectVLookUp = { ...sheetColumns[index].selectVLookUp, ...updates };
			}
			setSheetColumns(newColumns);
			setHasColumnChanges(true);
		}
	};

	const handleChangeColLookupTemp = async (index, updates) => {
		let cols = await getTemplateColumn(updates.temp);
		setListColTemp(cols);
		if (sheetColumns[index]) {
			const newColumns = [...sheetColumns];
			if (!sheetColumns[index].selectVLookUp) {
				await updateTemplateColumn({
					id: sheetColumns[index].id,
					selectVLookUp: updates,
				});
				newColumns[index].selectVLookUp = updates;
			} else {
				await updateTemplateColumn({
					id: sheetColumns[index].id,
					selectVLookUp: { ...sheetColumns[index].selectVLookUp, ...updates },
				});
				newColumns[index].selectVLookUp = { ...sheetColumns[index].selectVLookUp, ...updates };
			}
			setSheetColumns(newColumns);
		}
	};

	const renderConditionalOptions = (index) => {
		const column = sheetColumns[index];
		return (
			<div className='settings-popup__conditional-options'>
				<h4>Tùy chọn điều kiện</h4>

				<div className='settings-popup__conditional-field'>
					<label>Chọn cột nguồn:</label>
					<select
						value={column.conditionalOptions?.sourceColumn || ''}
						onChange={(e) =>
							handleConditionalOptionsChange(index, { sourceColumn: e.target.value })
						}
						className='settings-popup__conditional-select'
					>
						<option value=''>-- Chọn cột --</option>
						{sheetColumns.map((col) => (
							<option key={col.id} value={col.columnName}>
								{col.columnName}
							</option>
						))}
					</select>
				</div>

				<div className='settings-popup__conditional-field'>
					<label>Giá trị so sánh:</label>
					<input
						type='text'
						value={column.conditionalOptions?.compareValue || ''}
						onChange={(e) =>
							handleConditionalOptionsChange(index, { compareValue: e.target.value })
						}
						placeholder='Nhập giá trị cần so sánh'
						className='settings-popup__conditional-input'
					/>
				</div>

				<div className='settings-popup__conditional-field'>
					<label>Nội dung hiển thị khi thỏa điều kiện:</label>
					<input
						type='text'
						value={column.conditionalOptions?.displayText || ''}
						onChange={(e) =>
							handleConditionalOptionsChange(index, { displayText: e.target.value })
						}
						placeholder='Nhập nội dung hiển thị'
						className='settings-popup__conditional-input'
					/>
				</div>
			</div>
		);
	};

	const renderLookup = (index) => {
		const column = sheetColumns[index];
		return (
			<div className='settings-popup__conditional-options'>
				<h4>Cấu hình lookup</h4>

				<div className='settings-popup__conditional-field'>
					<label>Chọn cột nguồn:</label>
					<select
						value={column.selectVLookUp?.col || ''}
						onChange={(e) =>
							handleChangeColLookup(index, { col: e.target.value })
						}
						className='settings-popup__conditional-select'
					>
						<option value=''>-- Chọn cột --</option>
						{sheetColumns.map((col) => (
							<option key={col.id} value={col.columnName}>
								{col.columnName}
							</option>
						))}
					</select>
				</div>

				{/*<div className="settings-popup__conditional-field">*/}
				{/*	<label>Chọn template lookup:</label>*/}
				{/*	<select*/}
				{/*		value={column.selectVLookUp?.temp || ''}*/}
				{/*		onChange={(e) =>*/}
				{/*			handleChangeColLookupTemp(index, { temp: e.target.value })*/}
				{/*		}*/}
				{/*		className="settings-popup__conditional-select"*/}
				{/*	>*/}
				{/*		<option value="">-- Chọn template --</option>*/}
				{/*		{listTemp.map((col) => (*/}
				{/*			<option key={col.id} value={col.id}>*/}
				{/*				{col.name}*/}
				{/*			</option>*/}
				{/*		))}*/}
				{/*	</select>*/}
				{/*</div>*/}

				{/*<div className="settings-popup__conditional-field">*/}
				{/*	<label>Chọn cột lookup:</label>*/}
				{/*	<select*/}
				{/*		value={column.selectVLookUp?.tempCol || ''}*/}
				{/*		onChange={(e) =>*/}
				{/*			handleChangeColLookup(index, { tempCol: e.target.value })*/}
				{/*		}*/}
				{/*		className="settings-popup__conditional-select"*/}
				{/*	>*/}
				{/*		<option value="">-- Chọn cột --</option>*/}
				{/*		{listColTemp.map((col) => (*/}
				{/*			<option key={col.id} value={col.columnName}>*/}
				{/*				{col.columnName}*/}
				{/*			</option>*/}
				{/*		))}*/}
				{/*	</select>*/}
				{/*</div>*/}
			</div>
		);
	};
	const handleDuyetDieuKienChange = async (index, updates) => {
		const newColumns = [...sheetColumns];
		if (!newColumns[index].duyetDieuKien) {
			newColumns[index].duyetDieuKien = {
				conditions: [{
					column: '',
					operator: '=',
					value: '',
					logicOperator: 'AND',
				}],
				ucTrue: '',
				ucFalse: '',
			};
		}
		newColumns[index].duyetDieuKien = {
			...newColumns[index].duyetDieuKien,
			...updates,
		};
		setSheetColumns(newColumns);
		setHasColumnChanges(true);

		try {
			await updateTemplateColumn({
				id: sheetColumns[index].id,
				duyetDieuKien: newColumns[index].duyetDieuKien,
			});
		} catch (error) {
			console.error('Error updating duyet dieu kien:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật điều kiện duyệt');
		}
	};

	const handleCheckTypeSelect = async (data) => {
		await updateTemplateColumn({
			id: sheetColumns[data].id,
			checkTypeSelect: true,
		});
	};

	const handleToggleTimeDescription = async (checked) => {
		setShowTimeDescription(checked);
		await updateFileNoteSettings(
			{
				time: checked,
				hideOrderNumber,
				hideFormId,
			},
			'time',
		);
	};

	const handleDateTimePickerOptionsChange = async (index, updates) => {
		const newColumns = [...sheetColumns];
		newColumns[index].setting_date_time_picker = {
			...newColumns[index].setting_date_time_picker,
			...updates,
		};
		setSheetColumns(newColumns);
		setHasColumnChanges(true);
		try {
			await updateTemplateColumn({
				id: sheetColumns[index].id,
				setting_date_time_picker: newColumns[index].setting_date_time_picker,
			}).then((e) => {
				console.log('Cập nhật thành công', e);
			});
		} catch (error) {
			console.error('Error updating setting_date_time_picker:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật cài đặt DateTimePicker');
		}
	};

	const handleDateDiffOptionsChange = async (index, updates) => {
		const newColumns = [...sheetColumns];
		newColumns[index].setting_time_diff = {
			...newColumns[index].setting_time_diff,
			...updates,
		};

		setSheetColumns(newColumns);
		setHasColumnChanges(true);
		try {
			await updateTemplateColumn({
				...newColumns[index],
				setting_time_diff: newColumns[index].setting_time_diff,
			}).then((e) => {
				console.log('Cập nhật thành công', e);
			});
		} catch (error) {
			console.error('Error updating setting_time_diff:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật cài đặt Tính chênh lệch thời gian');
		}
	};

	const loadColumnData = async () => {
		try {
			// Get column data from API
			const columnData = await getTemplateColumn(id);

			// Update sheetColumns state with the loaded data
			setSheetColumns(columnData);

			// Initialize dropdown options for select type columns
			const initialDropdownOptions = {};
			columnData.forEach((column, index) => {
				if (column.columnType === 'select' && column.selectOptions) {
					initialDropdownOptions[index] = column.selectOptions;
				}
			});
			setDropdownOptions(initialDropdownOptions);

			// Set initial selected column if there are columns
			if (columnData.length > 0) {
				setSelectedColumnIndex(0);
			}

			// Update file note settings if available
			if (fileNote?.info) {
				setHideOrderNumber(fileNote.info.hideOrderNumber !== undefined ? fileNote.info.hideOrderNumber : true);
				setHideFormId(fileNote.info.hideFormId || false);
			}

		} catch (error) {
			console.error('Error loading column data:', error);
			toast.error('Đã xảy ra lỗi khi tải dữ liệu cột');
		}
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			const updatedColumns = sheetColumns.map((column, index) => {
				const updatedColumn = { ...column };
				// Update select options if they exist in dropdownOptions
				if (dropdownOptions[index]) {
					updatedColumn.selectOptions = dropdownOptions[index];
				}
				return updatedColumn;
			});

			// Update template columns
			await updateTemplateColumn(id, updatedColumns);

			// Update file note settings
			await updateFileNote(id, {
				hideOrderNumber,
				hideFormId,
			});

			toast.success('Lưu cài đặt thành công');
		} catch (error) {
			console.error('Error saving settings:', error);
			toast.error('Đã xảy ra lỗi khi lưu cài đặt');
		} finally {
			setSaving(false);
		}
	};

	const handleDateSplitSettingsChange = async (columnId, updates) => {
		const columnIndex = sheetColumns.findIndex(col => col.id === columnId);
		if (columnIndex === -1) {
			console.error('Column not found:', columnId);
			return;
		}

		const newColumns = [...sheetColumns];
		// Initialize formulaDate if it doesn't exist
		if (!newColumns[columnIndex].formulaDate) {
			newColumns[columnIndex].formulaDate = {};
		}
		newColumns[columnIndex].formulaDate = {
			...newColumns[columnIndex].formulaDate,
			...updates,
		};
		setSheetColumns(newColumns);
		setHasColumnChanges(true);

		try {
			await updateTemplateColumn({
				id: columnId,
				formulaDate: newColumns[columnIndex].formulaDate,
			});
			toast.success('Cập nhật cài đặt tách thời gian thành công');
		} catch (error) {
			console.error('Error updating date split settings:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật cài đặt tách thời gian');
		}
	};

	const renderDateSplitSettings = (column) => {
		return (
			<div className='settings-popup__date-split-options'>
				<h4>Cài đặt tách thời gian</h4>
				<div className='settings-popup__date-split-section'>
					<label>Chọn cột thời gian:</label>
					<select
						value={column.formulaDate?.sourceColumn || ''}
						onChange={(e) => handleDateSplitSettingsChange(column.id, { sourceColumn: e.target.value })}
						className='settings-popup__date-split-select'
					>
						<option value=''>-- Chọn cột --</option>
						{sheetColumns
							.filter(col => ['date', 'date_time_picker'].includes(col.columnType))
							.map((col) => (
								<option key={col.id} value={col.columnName}>
									{col.columnName}
								</option>
							))}
					</select>
				</div>
				<div className='settings-popup__date-split-section'>
					<label>Chọn phần cần lấy:</label>
					<select
						value={column.formulaDate?.part || ''}
						onChange={(e) => handleDateSplitSettingsChange(column.id, { part: e.target.value })}
						className='settings-popup__date-split-select'
					>
						<option value=''>-- Chọn phần --</option>
						<option value='day'>Ngày</option>
						<option value='month'>Tháng</option>
						<option value='year'>Năm</option>
					</select>
				</div>
			</div>
		);
	};

	const handleUpdateAllRows = async () => {
		try {
			// Show confirmation dialog with update button
			const result = await new Promise((resolve) => {
				const modal = document.createElement('div');
				modal.style.position = 'fixed';
				modal.style.top = '0';
				modal.style.left = '0';
				modal.style.width = '100%';
				modal.style.height = '100%';
				modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
				modal.style.display = 'flex';
				modal.style.justifyContent = 'center';
				modal.style.alignItems = 'center';
				modal.style.zIndex = '9999';

				const content = document.createElement('div');
				content.style.backgroundColor = 'white';
				content.style.padding = '20px';
				content.style.borderRadius = '8px';
				content.style.width = '400px';
				content.style.textAlign = 'center';

				const message = document.createElement('p');
				message.textContent = 'Bạn có muốn cập nhật dữ liệu các cột công thức, tính ngày cho tất cả các dòng không?';
				message.style.marginBottom = '20px';

				const buttonContainer = document.createElement('div');
				buttonContainer.style.display = 'flex';
				buttonContainer.style.justifyContent = 'center';
				buttonContainer.style.gap = '10px';

				const updateButton = document.createElement('button');
				updateButton.textContent = 'Xác nhận';
				updateButton.style.padding = '8px 16px';
				updateButton.style.backgroundColor = themeColor;
				updateButton.style.color = 'white';
				updateButton.style.border = 'none';
				updateButton.style.borderRadius = '4px';
				updateButton.style.cursor = 'pointer';

				const closeButton = document.createElement('button');
				closeButton.textContent = 'Đóng';
				closeButton.style.padding = '8px 16px';
				closeButton.style.backgroundColor = '#f0f0f0';
				closeButton.style.border = 'none';
				closeButton.style.borderRadius = '4px';
				closeButton.style.cursor = 'pointer';

				updateButton.onclick = () => {
					modal.remove();
					resolve(true);
				};

				closeButton.onclick = () => {
					modal.remove();
					resolve(false);
				};

				buttonContainer.appendChild(updateButton);
				buttonContainer.appendChild(closeButton);
				content.appendChild(message);
				content.appendChild(buttonContainer);
				modal.appendChild(content);
				document.body.appendChild(modal);
			});

			if (result) {
				setIsUpdating(true);
				// Create and show loading modal
				const loadingModal = document.createElement('div');
				loadingModal.style.position = 'fixed';
				loadingModal.style.top = '0';
				loadingModal.style.left = '0';
				loadingModal.style.width = '100%';
				loadingModal.style.height = '100%';
				loadingModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
				loadingModal.style.display = 'flex';
				loadingModal.style.justifyContent = 'center';
				loadingModal.style.alignItems = 'center';
				loadingModal.style.zIndex = '9999';

				const loadingContent = document.createElement('div');
				loadingContent.style.backgroundColor = 'white';
				loadingContent.style.padding = '20px';
				loadingContent.style.borderRadius = '8px';
				loadingContent.style.width = '300px';
				loadingContent.style.textAlign = 'center';

				const loadingSpinner = document.createElement('div');
				loadingSpinner.style.border = '4px solid #f3f3f3';
				loadingSpinner.style.borderTop = '4px solid #0d5eab';
				loadingSpinner.style.borderRadius = '50%';
				loadingSpinner.style.width = '40px';
				loadingSpinner.style.height = '40px';
				loadingSpinner.style.animation = 'spin 1s linear infinite';
				loadingSpinner.style.margin = '0 auto 20px';

				const loadingText = document.createElement('p');
				loadingText.textContent = 'Đang cập nhật dữ liệu...';
				loadingText.style.margin = '0';

				// Add keyframes for spinner animation
				const style = document.createElement('style');
				style.textContent = `
					@keyframes spin {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
				`;
				document.head.appendChild(style);

				loadingContent.appendChild(loadingSpinner);
				loadingContent.appendChild(loadingText);
				loadingModal.appendChild(loadingContent);
				document.body.appendChild(loadingModal);

				// Get all rows
				const rowsResponse = await getTemplateRow(id);
				const rows = rowsResponse.rows || [];

				// Process all rows in memory first
				const updatedRows = rows.map(row => {
					const rowId = row.id;
					let newData = { ...row.data };

					// Process formula columns
					for (const column of sheetColumns) {
						if (column.columnType === 'formula' && column.selectFormula?.variables) {
							try {
								const scope = {};
								for (const variable of column.selectFormula.variables) {
									const [key, columnName] = Object.entries(variable)[0];
									const value = newData[columnName];
									scope[key] = value === null || value === undefined || value === '' || value === '-'
										? 0
										: typeof value === 'string'
											? parseFloat(value.replace(/,/g, '')) || 0
											: Number(value) || 0;
								}
								const result = evaluate(column.selectFormula.formula, scope);
								newData[column.columnName] = isNaN(result) ? null : result;
							} catch (error) {
								console.error(`Formula evaluation error for column ${column.columnName}:`, error);
								newData[column.columnName] = null;
							}
						}

						// Process date_split columns
						if (column.columnType === 'date_split' && column.formulaDate?.sourceColumn) {
							const sourceValue = newData[column.formulaDate.sourceColumn];
							if (sourceValue) {
								try {
									const date = new Date(sourceValue);
									if (!isNaN(date.getTime())) {
										switch (column.formulaDate.part) {
											case 'day':
												newData[column.columnName] = String(date.getDate()).padStart(2, '0');
												break;
											case 'month':
												newData[column.columnName] = String(date.getMonth() + 1).padStart(2, '0');
												break;
											case 'year':
												newData[column.columnName] = date.getFullYear().toString();
												break;
										}
									}
								} catch (error) {
									console.error(`Error processing date_split for column ${column.columnName}:`, error);
									newData[column.columnName] = '';
								}
							}
						}

						// Process time_diff columns
						if (column.columnType === 'time_diff' && column.setting_time_diff) {
							const { startColumn, endColumn, unit } = column.setting_time_diff;
							const startVal = newData[startColumn];
							const endVal = newData[endColumn];
							if (startVal && endVal) {
								const startDate = new Date(startVal);
								const endDate = new Date(endVal);
								if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
									const diffMs = endDate.getTime() - startDate.getTime();
									let diffValue = null;
									switch (unit) {
										case 'days':
											diffValue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
											break;
										case 'hours':
											diffValue = Math.floor(diffMs / (1000 * 60 * 60));
											break;
										case 'minutes':
											diffValue = Math.floor(diffMs / (1000 * 60));
											break;
										default:
											diffValue = diffMs;
									}
									newData[column.columnName] = diffValue;
								}
							}
						}
					}

					return {
						id: rowId,
						data: newData,
					};
				});

				// Update all rows in a single batch
				await updateBatchTemplateRow({
					tableId: id,
					data: updatedRows,
				});

				// Remove loading modal
				loadingModal.remove();
				document.head.removeChild(style);

				// Refresh data after updating all rows
				await getData();
				toast.success('Đã cập nhật dữ liệu cho tất cả các dòng');
			}
		} catch (error) {
			console.error('Error updating data:', error);
			toast.error('Đã xảy ra lỗi khi cập nhật dữ liệu');
		} finally {
			setIsUpdating(false);
			// Đóng popup sau khi cập nhật xong (nếu muốn)
			handleClosePopUpSetting();
		}
	};

	const handleCloseWithConfirm = () => {
		if (!hasColumnChanges) {
			handleClosePopUpSetting();
			return;
		}

		const modal = document.createElement('div');
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100%';
		modal.style.height = '100%';
		modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		modal.style.display = 'flex';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';
		modal.style.zIndex = '9999';

		const content = document.createElement('div');
		content.style.backgroundColor = 'white';
		content.style.padding = '20px';
		content.style.borderRadius = '8px';
		content.style.width = '400px';
		content.style.textAlign = 'center';

		const message = document.createElement('p');
		message.textContent = 'Nếu bạn vừa thêm các cột tính toán, tính ngày, hãy ấn cập nhật dữ liệu.';
		message.style.marginBottom = '20px';

		const buttonContainer = document.createElement('div');
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'center';
		buttonContainer.style.gap = '10px';

		const updateButton = document.createElement('button');
		updateButton.textContent = 'Cập nhật dữ liệu';
		updateButton.style.padding = '8px 16px';
		updateButton.style.backgroundColor = '#0d5eab';
		updateButton.style.color = 'white';
		updateButton.style.border = 'none';
		updateButton.style.borderRadius = '4px';
		updateButton.style.cursor = 'pointer';

		const skipButton = document.createElement('button');
		skipButton.textContent = 'Bỏ qua';
		skipButton.style.padding = '8px 16px';
		skipButton.style.backgroundColor = '#f0f0f0';
		skipButton.style.border = 'none';
		skipButton.style.borderRadius = '4px';
		skipButton.style.cursor = 'pointer';

		updateButton.onclick = async () => {
			modal.remove();
			await handleUpdateAllRows();
		};

		skipButton.onclick = () => {
			modal.remove();
			handleClosePopUpSetting();
		};

		buttonContainer.appendChild(updateButton);
		buttonContainer.appendChild(skipButton);
		content.appendChild(message);
		content.appendChild(buttonContainer);
		modal.appendChild(content);
		document.body.appendChild(modal);
	};

	const [themeColor, setThemeColor] = useState('#0d5eab');

	useEffect(() => {
		const fetchThemeColor = async () => {
			try {
				const data = await getSettingByType('SettingThemeColor');
				setThemeColor(data.setting.themeColor || '#0d5eab');
			} catch (error) {
				console.error('Error fetching theme color:', error);
			}
		};

		fetchThemeColor();
	}, []);


	return (
		<div className='settings-popup-overlay'>
			<div className='settings-popup'>
				<div className='settings-popup__header'>
					<h2 className='settings-popup__title'>Cài đặt bảng</h2>
					<div style={{ display: 'flex', gap: '10px' }}>
						<button
							className='settings-popup__update-button'
							onClick={handleUpdateAllRows}
							style={{
								padding: '8px 16px',
								backgroundColor: themeColor,
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								marginRight: '10px',
							}}
						>
							Cập nhật dữ liệu
						</button>
						<button
							className='settings-popup__close-button'
							onClick={handleCloseWithConfirm}
						>
							×
						</button>
					</div>
				</div>

				<button
					className='settings-popup__add-column-button'
					onClick={handleAddColumn}
					style={{
						backgroundColor: themeColor,
					}}
				>
					Thêm cột
				</button>


				<Box sx={{ display: 'flex', gap: 2, height: 'calc(90vh - 150px)' }}>
					{/* Column Navigation */}
					<Box
						sx={{
							width: '200px',
							borderRight: '1px solid #ddd',
							overflowY: 'auto',
						}}
					>
						<List>
							{
								[{ id: 'custom-time', columnName: 'Cột mặc định' },
									...sheetColumns,
								]
									.map((column, filteredIndex) => {
										// Find the actual index in the original array
										const originalIndex = sheetColumns.findIndex(col => col.id === column.id);

										return (
											<ListItem key={column.id} disablePadding>
												<ListItemButton
													className={selectedColumnIndex === originalIndex ? 'custom-selected' : ''}
													onClick={() => setSelectedColumnIndex(originalIndex)}
													sx={{
														'&.custom-selected': {
															backgroundColor: `${themeColor} !important`,
															color: '#ffffff',
														},
														'&.custom-selected:hover': {
															backgroundColor: `${themeColor} !important`,
															color: '#ffffff',
														},
														'&:hover': {
															backgroundColor: `${themeColor} !important`,
															color: '#ffffff',
														},
													}}
												>

													<ListItemText
														primary={column.columnName || 'Untitled Column'}
													/>
												</ListItemButton>
											</ListItem>

										);
									})}
						</List>
					</Box>

					{/* Column Settings */}
					<Box sx={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
						{selectedColumnIndex !== null &&
						sheetColumns[selectedColumnIndex] ? (
								<div key={sheetColumns[selectedColumnIndex].id}>
									<div className='settings-popup__column-setting'>
										<input
											className='settings-popup__column-input'
											type='text'
											value={sheetColumns[selectedColumnIndex].columnName}
											onChange={(e) =>
												handleColumnNameChange(
													selectedColumnIndex,
													e.target.value,
												)
											}
											onBlur={() => handleColumnNameBlur(selectedColumnIndex)}
											placeholder='Tên cột'
										/>
										<Select
											className='settings-popup__column-select'
											value={sheetColumns[selectedColumnIndex].columnType}
											onChange={(e) => {
												handleColumnTypeChange(selectedColumnIndex, e.target.value);
												if (e.target.value === 'select') {
													handleCheckTypeSelect(selectedColumnIndex);

													setTempColumnOptions({
														...tempColumnOptions,
														[selectedColumnIndex]: '',
													});
												}
											}}
											onBlur={() => handleColumnTypeBlur(selectedColumnIndex)}
											renderValue={(selected) => {
												const option = columnTypeOptions.find(opt => opt.value === selected);
												return option ? option.label : '';
											}}
											MenuProps={{
												PaperProps: {
													style: { maxHeight: 300 },
												},
											}}
										>
											{columnTypeOptions.map((option) => (
												<MenuItem key={option.value} value={option.value}>
													<ListItemText
														primary={
															<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
																<Typography variant='subtitle1'
																			fontWeight='bold'>{option.label}</Typography>
																<p style={{
																	margin: 0,
																	fontSize: 12,
																	color: '#888',
																	background: '#f0f0f0',
																	borderRadius: 4,
																	padding: '2px 6px',
																}}>
																	{option.type}
																</p>
															</div>
														}
														secondary={
															<Typography variant='body2' color='textSecondary'
																		style={{ fontSize: 10 }}>{option.desc}</Typography>
														}
													/>
												</MenuItem>
											))}
										</Select>
										<Popconfirm
											title='Xóa cột'
											description='Bạn có chắc chắn muốn xóa cột này?'
											onConfirm={() => handleRemoveColumn(selectedColumnIndex)}
											okText='Xóa'
											cancelText='Hủy'
										>
											<button
												className={styles.deleteButton}
												disabled={isDeleting}
											>
												{isDeleting ? 'Đang xóa...' : 'Xóa'}
											</button>
										</Popconfirm>
										<button
											className={styles.copyButton}
											onClick={() => handleCloneColumn(selectedColumnIndex)}
										>
											Copy
										</button>
									</div>
									<div className='settings-popup__color-options'>
										<div className='color-picker-container'>
											<label>Text Color:</label>
											<div
												style={{
													padding: '5px',
													background: '#fff',
													borderRadius: '1px',
													boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
													display: 'inline-block',
													cursor: 'pointer',
												}}
												onClick={() =>
													setShowTextColorPicker(!showTextColorPicker)
												}
											>
												<div
													style={{
														width: '36px',
														height: '24px',
														borderRadius: '2px',
														background:
															sheetColumns[selectedColumnIndex].textColor ||
															'#000000',
													}}
												/>
											</div>
											{showTextColorPicker && (
												<div
													style={{
														position: 'absolute',
														zIndex: '2',
													}}
												>
													<div
														style={{
															position: 'fixed',
															top: '0px',
															right: '0px',
															bottom: '0px',
															left: '0px',
														}}
														onClick={() => setShowTextColorPicker(false)}
													/>
													<ChromePicker
														color={
															sheetColumns[selectedColumnIndex].textColor ||
															'#000000'
														}
														onChange={(color) =>
															handleColumnColorChange(
																selectedColumnIndex,
																'text',
																color.hex,
															)
														}
													/>
												</div>
											)}
										</div>

										<div className='color-picker-container'>
											<label>Background Color:</label>
											<div
												style={{
													padding: '5px',
													background: '#fff',
													borderRadius: '1px',
													boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
													display: 'inline-block',
													cursor: 'pointer',
												}}
												onClick={() => setShowBgColorPicker(!showBgColorPicker)}
											>
												<div
													style={{
														width: '36px',
														height: '24px',
														borderRadius: '2px',
														background:
															sheetColumns[selectedColumnIndex].bgColor ||
															'#ffffff',
													}}
												/>
											</div>

											{showBgColorPicker && (
												<div
													style={{
														position: 'absolute',
														zIndex: '2',
													}}
												>
													<div
														style={{
															position: 'fixed',
															top: '0px',
															right: '0px',
															bottom: '0px',
															left: '0px',
														}}
														onClick={() => setShowBgColorPicker(false)}
													/>
													<ChromePicker
														color={
															sheetColumns[selectedColumnIndex].bgColor ||
															'#ffffff'
														}
														onChange={(color) =>
															handleColumnColorChange(
																selectedColumnIndex,
																'bg',
																color.hex,
															)
														}
													/>
												</div>
											)}
										</div>
									</div>

									{sheetColumns[selectedColumnIndex]?.columnType === 'number' && (
										<div className='settings-popup__section'>
											<div className='settings-popup__checkbox-option'>
												<input
													type='checkbox'
													checked={sheetColumns[selectedColumnIndex]?.useDataBar || false}
													onChange={async (e) => {
														const newColumns = [...sheetColumns];
														newColumns[selectedColumnIndex] = {
															...newColumns[selectedColumnIndex],
															useDataBar: e.target.checked,
														};
														setSheetColumns(newColumns);

														try {
															await updateTemplateColumn({
																id: sheetColumns[selectedColumnIndex].id,
																useDataBar: e.target.checked,
															});
															toast.success('Cập nhật hiển thị thanh dữ liệu thành công');
														} catch (error) {
															console.error('Error updating useDataBar:', error);
															toast.error('Đã xảy ra lỗi khi cập nhật hiển thị thanh dữ liệu');
														}
													}}
												/>
												<label>Hiển thị dạng thanh dữ liệu</label>
											</div>
										</div>
									)}
									{/* {sheetColumns[selectedColumnIndex].columnType === 'select' && (
                                    <div className='settings-popup__dropdown-options'>
                                        <input
                                            className='settings-popup__add-option-input'
                                            type='text'
                                            value={tempColumnOptions[selectedColumnIndex] || ''}
                                            onChange={(e) =>
                                                setTempColumnOptions({
                                                    ...tempColumnOptions,
                                                    [selectedColumnIndex]: e.target.value,
                                                })
                                            }
                                            placeholder='Thêm tùy chọn'
                                        />
                                        <button
                                            className='settings-popup__add-option-button'
                                            onClick={() => handleAddOption(selectedColumnIndex)}
                                        >
                                            Thêm
                                        </button>

                                        <div className='settings-popup__option-list'>
                                            {dropdownOptions[selectedColumnIndex] &&
                                                dropdownOptions[selectedColumnIndex].map(
                                                    (option, idx) => (
                                                        <div
                                                            key={idx}
                                                            className='settings-popup__option-item'
                                                        >
                                                            <span style={{ marginLeft: '4px' }}>
                                                                {option}
                                                            </span>
                                                            <button
                                                                className='settings-popup__remove-option-button'
                                                                onClick={() =>
                                                                    handleRemoveOption(selectedColumnIndex, idx)
                                                                }
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                        </div>
                                    </div>
                                )} */}

									{sheetColumns[selectedColumnIndex].columnType === 'select' && (
										<div className={styles.dropdownOptionsRow}>
											<div className={styles.addOptionWrapper}>
												<input
													className={styles.addOptionInput}
													type='text'
													value={tempColumnOptions[selectedColumnIndex] || ''}
													onChange={(e) =>
														setTempColumnOptions({
															...tempColumnOptions,
															[selectedColumnIndex]: e.target.value,
														})
													}
													onKeyDown={(e) => {
														if (e.key === 'Enter' && tempColumnOptions[selectedColumnIndex]) {
															handleAddOption(selectedColumnIndex);
														}
													}}
													placeholder='Thêm tùy chọn'
												/>
												<button
													className={styles.addOptionButton}
													onClick={() => handleAddOption(selectedColumnIndex)}
													style={{
														backgroundColor: themeColor,
													}}
												>
													Thêm
												</button>
											</div>

											<div className={styles.optionList}>
												{(sheetColumns[selectedColumnIndex].selectOptions || dropdownOptions[selectedColumnIndex] || []).map(
													(option, idx) => (
														<div key={idx} className={styles.optionItem}>
															<span>{option}</span>
															<button
																className={styles.removeOptionButton}
																onClick={() => handleRemoveOption(selectedColumnIndex, idx)}
															>
																Xóa
															</button>
														</div>
													),
												)}
											</div>
										</div>
									)}

									{sheetColumns[selectedColumnIndex].columnType === 'formula' && (
										<div className='settings-popup__formula-options'>
											<input
												className='settings-popup__formula-input'
												type='text'
												value={
													sheetColumns[selectedColumnIndex].selectFormula
														?.formula || ''
												}
												onChange={(e) => {
													const updatedColumns = sheetColumns.map((col) => {
														if (col.id === sheetColumns[selectedColumnIndex].id) {
															return {
																...col,
																selectFormula: {
																	...col.selectFormula,
																	formula: e.target.value,
																},
															};
														}
														return col;
													});
													setSheetColumns(updatedColumns);
												}}
												onBlur={() =>
													handleColumnFormulaSelect(
														sheetColumns[selectedColumnIndex],
													)
												}
												placeholder='Nhập công thức'
											/>
											<button
												className='settings-popup__add-variable-button'
												onClick={() => {
													const updatedColumns = sheetColumns.map((col) => {
														if (col.id === sheetColumns[selectedColumnIndex].id) {
															const newVariables =
																col.selectFormula?.variables || [];
															if (newVariables.length < 26) {
																const newVariableKey = String.fromCharCode(
																	97 + newVariables.length,
																);
																newVariables.push({ [newVariableKey]: '' });
															}
															return {
																...col,
																selectFormula: {
																	...col.selectFormula,
																	variables: newVariables,
																},
															};
														}
														return col;
													});
													setSheetColumns(updatedColumns);
												}}
											>
												[+]
											</button>
											<div className='settings-popup__variables-container'>
												{sheetColumns[selectedColumnIndex].selectFormula
														?.variables &&
													sheetColumns[
														selectedColumnIndex
														].selectFormula.variables.map((variable, varIndex) => (
														<div key={varIndex} className='formula-variable'>
															<span>{Object.keys(variable)[0]}</span>
															<select
																value={Object.values(variable)[0]}
																onChange={(e) => {
																	const updatedColumns = sheetColumns.map(
																		(col) => {
																			if (
																				col.id ===
																				sheetColumns[selectedColumnIndex].id
																			) {
																				const newVariables = [
																					...col.selectFormula.variables,
																				];
																				newVariables[varIndex][
																					Object.keys(variable)[0]
																					] = e.target.value;
																				return {
																					...col,
																					selectFormula: {
																						...col.selectFormula,
																						variables: newVariables,
																					},
																				};
																			}
																			return col;
																		},
																	);
																	setSheetColumns(updatedColumns);
																	handleColumnFormulaSelect(
																		sheetColumns[selectedColumnIndex],
																	);
																}}
															>
																<option value=''>Chọn cột số</option>
																{sheetColumns.map((numCol) => (
																	<option
																		key={numCol.id}
																		value={numCol.columnName}
																	>
																		{numCol.columnName}
																	</option>
																))}
															</select>
															<button
																className='settings-popup__remove-variable-button'
																onClick={() =>
																	handleRemoveVariable(
																		sheetColumns[selectedColumnIndex],
																		varIndex,
																	)
																}
															>
																[-]
															</button>
														</div>
													))}
											</div>
										</div>
									)}

									{sheetColumns[selectedColumnIndex].columnType === 'dateCalc' &&
										renderDateCalcSettings(sheetColumns[selectedColumnIndex])}

									{sheetColumns[selectedColumnIndex]?.columnType ===
										'email_bot' &&
										renderEmailBotSettings(sheetColumns[selectedColumnIndex])}

									{sheetColumns[selectedColumnIndex]?.columnType === 'duyet' && (
										<div className='settings-popup__duyet-options'>
											<h4>Tùy chọn duyệt</h4>
											<div className='settings-popup__duyet-default-options'>
												<p>Giá trị mặc định: Chưa Duyệt, Duyệt</p>
											</div>

											<div className='settings-popup__duyet-uc-selection'>
												<h4>Chọn User Class có quyền duyệt:</h4>
												<select
													className='settings-popup__duyet-uc-dropdown'
													value={sheetColumns[selectedColumnIndex].duyetOptions?.selectedUC || ''}
													onChange={(e) => handleDuyetOptionsChange(selectedColumnIndex, e.target.value)}
												>
													<option value=''>-- Chọn User Class --</option>
													{listUC && listUC.map(uc => (
														<option key={uc.id} value={uc.id}>
															{uc.name}
														</option>
													))}
												</select>
											</div>
										</div>
									)}

									{sheetColumns[selectedColumnIndex]?.columnType === 'duyet_dieu_kien' && (
										<div className='settings-popup__duyet-options'>
											<h4>Tùy chọn duyệt điều kiện</h4>
											<div className='settings-popup__duyet-default-options'>
												<p>Giá trị mặc định: Chưa Duyệt, Duyệt</p>
											</div>

											{/* Conditions Section */}
											<div className='settings-popup__conditions'>
												<h4>Điều kiện:</h4>
												{sheetColumns[selectedColumnIndex].duyetDieuKien?.conditions.map((condition, idx) => (
													<div key={idx} className='settings-popup__condition-row'>
														<select
															value={condition.column}
															onChange={(e) => {
																const newConditions = [...sheetColumns[selectedColumnIndex].duyetDieuKien.conditions];
																newConditions[idx] = {
																	...condition,
																	column: e.target.value,
																};
																handleDuyetDieuKienChange(selectedColumnIndex, { conditions: newConditions });
															}}
														>
															<option value=''>Chọn cột</option>
															{sheetColumns.map((col) => (
																<option key={col.id} value={col.columnName}>
																	{col.columnName}
																</option>
															))}
														</select>

														<select
															value={condition.operator}
															onChange={(e) => {
																const newConditions = [...sheetColumns[selectedColumnIndex].duyetDieuKien.conditions];
																newConditions[idx] = {
																	...condition,
																	operator: e.target.value,
																};
																handleDuyetDieuKienChange(selectedColumnIndex, { conditions: newConditions });
															}}
														>
															<option value='='>=</option>
															<option value='!='>!=</option>
															<option value='>'>&gt;</option>
															<option value='<'>&lt;</option>
														</select>

														<input
															type='text'
															value={condition.value}
															onChange={(e) => {
																const newConditions = [...sheetColumns[selectedColumnIndex].duyetDieuKien.conditions];
																newConditions[idx] = {
																	...condition,
																	value: e.target.value,
																};
																handleDuyetDieuKienChange(selectedColumnIndex, { conditions: newConditions });
															}}
															placeholder='Giá trị'
														/>

														{idx < sheetColumns[selectedColumnIndex].duyetDieuKien.conditions.length - 1 && (
															<select
																value={condition.logicOperator}
																onChange={(e) => {
																	const newConditions = [...sheetColumns[selectedColumnIndex].duyetDieuKien.conditions];
																	newConditions[idx] = {
																		...condition,
																		logicOperator: e.target.value,
																	};
																	handleDuyetDieuKienChange(selectedColumnIndex, { conditions: newConditions });
																}}
															>
																<option value='AND'>VÀ</option>
																<option value='OR'>HOẶC</option>
															</select>
														)}

														<Button
															onClick={() => {
																const newConditions = sheetColumns[selectedColumnIndex].duyetDieuKien.conditions.filter((_, i) => i !== idx);
																handleDuyetDieuKienChange(selectedColumnIndex, { conditions: newConditions });
															}}
														>
															Xóa
														</Button>
													</div>
												))}

												<Button
													onClick={() => {
														const newConditions = [...(sheetColumns[selectedColumnIndex].duyetDieuKien?.conditions || [])];
														newConditions.push({
															column: '',
															operator: '=',
															value: '',
															logicOperator: 'AND',
														});
														handleDuyetDieuKienChange(selectedColumnIndex, { conditions: newConditions });
													}}
												>
													Thêm điều kiện
												</Button>
											</div>

											{/* User Class Selection for True condition */}
											<div className='settings-popup__duyet-uc-selection'>
												<h4>User Class khi thỏa mãn điều kiện:</h4>
												<select
													className='settings-popup__duyet-uc-dropdown'
													value={sheetColumns[selectedColumnIndex].duyetDieuKien?.ucTrue || ''}
													onChange={(e) => handleDuyetDieuKienChange(selectedColumnIndex, { ucTrue: e.target.value })}
												>
													<option value=''>-- Chọn User Class --</option>
													{listUC
														.filter(uc => fileNote?.userClass?.includes(uc.name))
														.map(uc => (
															<option key={uc.id} value={uc.id}>
																{uc.name}
															</option>
														))
													}
												</select>
											</div>

											{/* User Class Selection for False condition */}
											<div className='settings-popup__duyet-uc-selection'>
												<h4>User Class khi không thỏa mãn điều kiện:</h4>
												<select
													className='settings-popup__duyet-uc-dropdown'
													value={sheetColumns[selectedColumnIndex].duyetDieuKien?.ucFalse || ''}
													onChange={(e) => handleDuyetDieuKienChange(selectedColumnIndex, { ucFalse: e.target.value })}
												>
													<option value=''>-- Chọn User Class --</option>
													{listUC
														.filter(uc => fileNote?.userClass?.includes(uc.name))
														.map(uc => (
															<option key={uc.id} value={uc.id}>
																{uc.name}
															</option>
														))
													}
												</select>
											</div>
										</div>
									)}


									{sheetColumns[selectedColumnIndex]?.columnType === 'bieu_tuong_phan_tram' && (
										<div className={styles.percentageOptions}>
											<h4>Tùy chọn kiểu phần trăm</h4>
											<div className={styles.percentageType}>
												<label>Kiểu dữ liệu: Từ 0 đến 100</label>
											</div>
											<div className={styles.colorPicker}>
												<label>Màu thanh phần trăm:</label>
												<div
													className={styles.colorPreview}
													onClick={() => setShowPercentageBarColorPicker(!showPercentageBarColorPicker)}
													style={{
														backgroundColor: sheetColumns[selectedColumnIndex].percentageBarColor || '#259C63',
														cursor: 'pointer',
														width: '30px',
														height: '30px',
														border: '1px solid #ddd',
														borderRadius: '4px',
													}}
												/>
												{showPercentageBarColorPicker && (
													<div className={styles.colorPickerPopover}>
														<div
															className={styles.colorPickerCover}
															onClick={() => setShowPercentageBarColorPicker(false)}
														/>
														<ChromePicker
															color={sheetColumns[selectedColumnIndex].percentageBarColor || '#259C63'}
															onChange={(color) => handleColumnColorChange(
																selectedColumnIndex,
																'percentageBar',
																color.hex,
															)}
														/>
													</div>
												)}
											</div>
										</div>
									)}

									{sheetColumns[selectedColumnIndex]?.columnType === 'conditional' &&
										renderConditionalOptions(selectedColumnIndex)
									}
									{sheetColumns[selectedColumnIndex]?.columnType === 'lookup' &&
										renderLookup(selectedColumnIndex)
									}

									{sheetColumns[selectedColumnIndex]?.columnType === 'date_time_picker' && (
										<div className='settings-popup__date-time-picker-options'>
											<h4>Cài đặt Date - Time Picker</h4>
											<div style={{ marginBottom: 8 }}>
												<label>Định dạng hiển thị: </label>
												<select
													value={sheetColumns[selectedColumnIndex].setting_date_time_picker?.format || 'datetime'}
													onChange={e => handleDateTimePickerOptionsChange(selectedColumnIndex, { format: e.target.value })}
												>
													<option value='datetime'>Ngày + Giờ</option>
													<option value='date'>Chỉ Ngày</option>
													<option value='time'>Chỉ Giờ</option>
												</select>
											</div>
											<div>
												<label>
													<input
														type='checkbox'
														checked={sheetColumns[selectedColumnIndex].setting_date_time_picker?.use12Hours || false}
														onChange={e => handleDateTimePickerOptionsChange(selectedColumnIndex, { use12Hours: e.target.checked })}
													/>
													Sử dụng định dạng 12 giờ (AM/PM)
												</label>
											</div>
											<div style={{ marginBottom: 8 }}>
												<label>Định dạng ngày khi nhập từ Excel: </label>
												<select
													value={sheetColumns[selectedColumnIndex].setting_date_time_picker?.formatDate || 'DD/MM/YYYY'}
													onChange={e => handleDateTimePickerOptionsChange(selectedColumnIndex, { formatDate: e.target.value })}
												>
													<option value='DD/MM/YYYY'>DD/MM/YYYY</option>
													<option value='DD/MM/YYYY HH:mm:ss'>DD/MM/YYYY HH:mm:ss</option>
													<option value='MM/DD/YYYY'>MM/DD/YYYY</option>
													<option value='MM/DD/YYYY HH:mm:ss'>MM/DD/YYYY HH:mm:ss</option>
												</select>
											</div>
										</div>
									)}

									{sheetColumns[selectedColumnIndex]?.columnType === 'time_diff' && (
										<div className='settings-popup__date-diff-options'>
											<h4>Cài đặt Tính chênh lệch thời gian</h4>
											<div style={{ marginBottom: 8 }}>
												<label>Cột bắt đầu: </label>
												<select
													value={sheetColumns[selectedColumnIndex].setting_time_diff?.startColumn || ''}
													onChange={e => handleDateDiffOptionsChange(selectedColumnIndex, { startColumn: e.target.value })}
												>
													<option value=''>-- Chọn cột --</option>
													{sheetColumns.filter(col => ['date', 'date_time_picker'].includes(col.columnType)).map(col => (
														<option key={col.id}
																value={col.columnName}>{col.columnName}</option>
													))}
												</select>
											</div>
											<div style={{ marginBottom: 8 }}>
												<label>Cột kết thúc: </label>
												<select
													value={sheetColumns[selectedColumnIndex].setting_time_diff?.endColumn || ''}
													onChange={e => handleDateDiffOptionsChange(selectedColumnIndex, { endColumn: e.target.value })}
												>
													<option value=''>-- Chọn cột --</option>
													{sheetColumns.filter(col => ['date', 'date_time_picker'].includes(col.columnType)).map(col => (
														<option key={col.id}
																value={col.columnName}>{col.columnName}</option>
													))}
												</select>
											</div>
											<div>
												<label>Đơn vị kết quả: </label>
												<select
													value={sheetColumns[selectedColumnIndex].setting_time_diff?.unit || 'days'}
													onChange={e => handleDateDiffOptionsChange(selectedColumnIndex, { unit: e.target.value })}
												>
													<option value='days'>Ngày</option>
													<option value='hours'>Giờ</option>
													<option value='minutes'>Phút</option>
												</select>
											</div>
										</div>
									)}

									{sheetColumns[selectedColumnIndex].columnType === 'date' && (
										<div className='settings-popup__date-format'>
											<label>Định dạng hiển thị ngày: </label>
											<select
												value={sheetColumns[selectedColumnIndex].dateFormat?.display || 'DD/MM/YYYY'}
												onChange={e => {
													const newColumns = [...sheetColumns];
													newColumns[selectedColumnIndex].dateFormat = {
														...newColumns[selectedColumnIndex].dateFormat,
														display: e.target.value,
													};
													setSheetColumns(newColumns);
													updateTemplateColumn({
														id: sheetColumns[selectedColumnIndex].id,
														dateFormat: {
															display: e.target.value,
															excel: newColumns[selectedColumnIndex].dateFormat?.excel || 'DD/MM/YYYY',
														},
													});
												}}
											>
												<option value='DD/MM/YYYY'>DD/MM/YYYY</option>
												<option value='MM/DD/YYYY'>MM/DD/YYYY</option>
											</select>
											<div style={{ marginTop: 8 }}>
												<label>Định dạng ngày khi nhập từ Excel: </label>
												<select
													value={sheetColumns[selectedColumnIndex].dateFormat?.excel || 'DD/MM/YYYY'}
													onChange={e => {
														const newColumns = [...sheetColumns];
														newColumns[selectedColumnIndex].dateFormat = {
															...newColumns[selectedColumnIndex].dateFormat,
															excel: e.target.value,
														};
														setSheetColumns(newColumns);
														updateTemplateColumn({
															id: sheetColumns[selectedColumnIndex].id,
															dateFormat: {
																display: newColumns[selectedColumnIndex].dateFormat?.display || 'DD/MM/YYYY',
																excel: e.target.value,
															},
														});
													}}
												>
													<option value='DD/MM/YYYY'>DD/MM/YYYY</option>
													<option value='DD/MM/YYYY HH:mm:ss'>DD/MM/YYYY HH:mm:ss</option>
													<option value='MM/DD/YYYY'>MM/DD/YYYY</option>
													<option value='MM/DD/YYYY HH:mm:ss'>MM/DD/YYYY HH:mm:ss</option>
												</select>
											</div>
										</div>
									)}

									{sheetColumns[selectedColumnIndex]?.columnType === 'date_split' &&
										renderDateSplitSettings(sheetColumns[selectedColumnIndex])
									}
								</div>
							) :
							selectedColumnIndex == -1 ? (
								<div className='settings-popup__has-column'>
									<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<Switch
												checked={!hideOrderNumber} // Inverted logic
												onChange={(checked) => handleToggleColumnVisibility('hideOrderNumber', !checked)} // Inverted logic
												style={{ backgroundColor: !hideOrderNumber ? '#0d5eab' : undefined }}
											/>
											<span>Hiển thị cột STT-Mã phiếu</span>
										</div>
									</div>
								</div>
							) : (
								<div className='settings-popup__no-column'>

								</div>
							)}
					</Box>
				</Box>
			</div>
		</div>
	);
};

export default SheetColumnSetting;

import PopUpUploadFile from '../../../../../../components/UploadFile/PopUpUploadFile.jsx';
import { evaluate } from 'mathjs';
import styles from '../sheetColumnSetting/sheetColumnSetting.module.css';
import React, { useEffect, useRef, useImperativeHandle, useState, forwardRef } from 'react';
import CustomDateTimePickerEditor from './CustomDateTimePickerEditor.jsx';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);


export function buildColumnDef({
							col,
							rowData,
							duplicateHighlightColumns,
							templateColumns,
							currentUser,
							getHeaderTemplate,
							toggleDuplicateHighlight,
							filter,
						}) {
						
	return  {
		headerName: col.columnName,
		field: col.columnName,
		width: col.columnWidth ? col.columnWidth : 100,
		cellEditor: 'agTextCellEditor',
		cellStyle: (params) => {
			const styles = {
				backgroundColor: col.bgColor || '#ffffff', color: col.textColor || '#000000',
			};

			if (duplicateHighlightColumns.includes(col.columnName) && params.data) {
				const fieldValue = params.value;
				if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
					const soLanXuatHien = rowData.filter((row) => row[col.columnName] === fieldValue).length;

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
			template: getHeaderTemplate(col.columnName), onClick: (e) => {
				e.stopPropagation();
				toggleDuplicateHighlight(col.columnName);
			},
		},
		editable: (params) => {
			// if (['Thời gian'].includes(col.columnName)) {
			// 	return false;
			// }
			if (!params.data) return false;
			const columnConfig = templateColumns.find((c) => c.columnName == params.colDef.field);
			if (!columnConfig) return true;
			if (!columnConfig.editor?.restricted) return true;
			return columnConfig.editor.users.includes(currentUser.email);
		}, ...filter(),
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
}

export function buildColumn(col, columnDef, fileNoteId, loadFetchData  ) {
	if (col.columnType == 'select' || col.columnName == 'Ngày' || col.columnName == 'Tháng') {
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
			min: 1900, max: 3000,
		};
	}

	const originalCellStyle = columnDef.cellStyle;

	if (col.columnType == 'number' && col.columnName !== 'Năm') {
		columnDef.cellEditor = 'agNumberCellEditor';
		columnDef.valueFormatter = (params) => {
			if (params.value == null || params.value == undefined || params.value == 0) return '-';
			return Number(params.value).toLocaleString('en-US', {
				useGrouping: true,
			});
		};

		if (col.useDataBar) {
            columnDef.cellRenderer = (params) => {
                // Sử dụng useMemo để cache các giá trị và chỉ tính toán lại khi data thay đổi
                const { value, minValue, maxValue, percentage, maxTextWidth } = React.useMemo(() => {
                    if (params.value == null || params.value == undefined || isNaN(params.value)) {
                        return { value: '', minValue: 0, maxValue: 0, percentage: 0, maxTextWidth: 0 };
                    }

                    // Get all values from the grid's current data
                    const columnValues = params.api.getModel().rowsToDisplay
                        .map(row => row.data[col.columnName])
                        .filter(value => value != null && !isNaN(value));
                        
                    const min = Math.min(...columnValues);
                    const max = Math.max(...columnValues);
                    const range = max - min;

                    // Calculate percentage for data bar
                    const pct = range === 0 ? 0 : ((params.value - min) / range) * 100;

                    // Calculate max text width based on the longest number
                    const maxLengthValue = columnValues.reduce((max, value) => {
                        const formatted = Number(value).toLocaleString('en-US', { useGrouping: true });
                        return formatted.length > max.length ? formatted : max;
                    }, "0");
                    
                    // Estimate text width: ~8px per character for the current font
                    const estimatedMaxWidth = maxLengthValue.length * 8 + 10; // Add padding

                    return {
                        value: params.value,
                        minValue: min,
                        maxValue: max,
                        percentage: pct,
                        maxTextWidth: estimatedMaxWidth
                    };
                }, [params.value, params.api.getModel().rowsToDisplay]);

                // Thêm useEffect để theo dõi thay đổi và render lại cột
                React.useEffect(() => {
                    // Đăng ký sự kiện lắng nghe thay đổi dữ liệu
                    const onDataChanged = () => {
                        params.api.refreshCells({
                            force: true,
                            columns: [col.columnName]
                        });
                    };

                    // Đăng ký sự kiện
                    params.api.addEventListener('cellValueChanged', onDataChanged);
                    params.api.addEventListener('rowDataUpdated', onDataChanged);

                    // Cleanup khi component unmount
                    return () => {
                        params.api.removeEventListener('cellValueChanged', onDataChanged);
                        params.api.removeEventListener('rowDataUpdated', onDataChanged);
                    };
                }, [params.api, col.columnName]);

                if (!value) return '';

                return (
                    <div className={styles.percentageCell}>
                        <div className={styles.percentageBar}>
                            <div
                                className={styles.percentageFill}
                                style={{
                                    width: `${Math.min(100, Math.max(0, percentage))}%`,
                                    backgroundColor: col.percentageBarColor || '#259C63'
                                }}
                                onMouseEnter={(e) => {
                                    const tooltip = document.createElement('div');
                                    tooltip.className = styles.tooltip;
                                    tooltip.innerHTML = `${Number(value).toLocaleString('en-US')} / ${Number(maxValue).toLocaleString('en-US')}`;
                                    tooltip.style.position = 'absolute';
                                    tooltip.style.left = `${e.clientX + 10}px`;
                                    tooltip.style.top = `${e.clientY - 25}px`;
                                    document.body.appendChild(tooltip);
                                    e.target.tooltip = tooltip;
                                }}
                                onMouseLeave={(e) => {
                                    if (e.target.tooltip) {
                                        document.body.removeChild(e.target.tooltip);
                                        e.target.tooltip = null;
                                    }
                                }}
                                onMouseMove={(e) => {
                                    if (e.target.tooltip) {
                                        e.target.tooltip.style.left = `${e.clientX + 10}px`;
                                        e.target.tooltip.style.top = `${e.clientY - 25}px`;
                                    }
                                }}
                            />
                        </div>
                        <div 
                            className={styles.percentageText} 
                            style={{ 
                                color: col.textColor,
                                minWidth: `${maxTextWidth}px` // Apply dynamic width based on the longest number
                            }}
                        >
                            {Number(value).toLocaleString('en-US', { useGrouping: true })}
                        </div>
                    </div>
                );
            };
            columnDef.autoHeight = true;
        }

		columnDef.cellStyle = (params) => {
            const originalStyles = originalCellStyle(params);
            return {
                ...originalStyles,
                textAlign: 'right',
                padding: col.useDataBar ? '0 5px ' : originalStyles.padding
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
		columnDef.editable = false;
		columnDef.cellRenderer = (params) => {
			return (<>
				<PopUpUploadFile
					id={`Template_${params.data.rowId}`}
					table={`${fileNoteId}_Template`}
					onGridReady={loadFetchData}
					card={'fileNoteId'}
				/>
			</>);
		};
	}

	if (col.columnType == 'date') {
		columnDef.cellRenderer = (params) => {
			if (!params.value) return '';
			let dateObj;
			if (typeof params.value === 'string' || typeof params.value === 'number') {
				// Handle Unix timestamp (in seconds or milliseconds)
				if (/^\d+$/.test(params.value)) {
					const timestamp = Number(params.value);
					dateObj = new Date(timestamp * (timestamp < 1e12 ? 1000 : 1)); // Convert to milliseconds if in seconds
				} else {
					// Handle ISO string (e.g., "2025-05-29T17:00:00.000Z") or other date strings
					dateObj = new Date(params.value);
				}
			} else if (params.value instanceof Date) {
				dateObj = params.value;
			} else {
				return '';
			}
			if (isNaN(dateObj.getTime())) return '';
			const format = col?.dateFormat?.display || 'DD/MM/YYYY';
			let day = String(dateObj.getDate()).padStart(2, '0');
			let month = String(dateObj.getMonth() + 1).padStart(2, '0');
			let year = dateObj.getFullYear();
			if (format === 'MM/DD/YYYY') {
				return `${month}/${day}/${year}`;
			}
			return `${day}/${month}/${year}`;
		};

		columnDef.cellEditor = AntdDatePickerEditor;
		columnDef.cellEditorParams = {
			format: col?.dateFormat?.excel || 'DD/MM/YYYY',
		};
		columnDef.valueParser = (params) => {
			if (!params.newValue) return '';
			const format = col?.dateFormat?.excel || 'DD/MM/YYYY';
			
			// Handle ISO string from Excel paste
			if (typeof params.newValue === 'string' && params.newValue.includes('T')) {
				const dateObj = new Date(params.newValue);
				if (!isNaN(dateObj.getTime())) {
					return dayjs(dateObj).format(format); // Return formatted string for immediate display
				}
			}
			
			// Handle direct date string input (like from Excel)
			const d = dayjs(params.newValue, format, true);
			return d.isValid() ? d.format(format) : '';
		};
		columnDef.valueSetter = (params) => {
			if (!params.newValue) {
				params.data[col.columnName] = null;
				return true;
			}
			const format = col?.dateFormat?.excel || 'DD/MM/YYYY';
			
			// Store as ISO string for consistency
			if (typeof params.newValue === 'string') {
				// If it's already an ISO string
				if (params.newValue.includes('T')) {
					params.data[col.columnName] = params.newValue;
					return true;
				}
				// If it's a formatted date string
				const d = dayjs(params.newValue, format, true);
				if (d.isValid()) {
					params.data[col.columnName] = d.toISOString();
					return true;
				}
			}
			
			params.data[col.columnName] = null;
			return true;
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
					acc[key] = value == null || value == undefined ? 0 : typeof value == 'string' ? value == '-' ? 0 : isNaN(parseFloat(value.replace(/,/g, ''))) ? NaN : parseFloat(value.replace(/,/g, '')) : Number(value);

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
			if (params.value == null || params.value == undefined || isNaN(params.value)) {
				return 'NaN';
			}
			return params.value.toLocaleString('en-US', {
				useGrouping: true,
			});
		};
		columnDef.valueParser = (params) => {
			if (params.newValue == null || params.newValue == undefined || params.newValue == '') {
				return NaN;
			}
			return Number(params.newValue.replace(/,/g, ''));
		};

		columnDef.editable = false;
		columnDef.cellStyle = (params) => {
			const originalStyles = originalCellStyle(params);
			return {
				...originalStyles, textAlign: 'right',
			};
		};
	}

	// if (col.columnName == 'Thời gian') {
	// 	columnDef.valueGetter = (params) => {
	// 		if (!params.data) return '';
	// 		const day = params.data['Ngày'];
	// 		const month = params.data['Tháng'];
	// 		const year = params.data['Năm'];

	// 		if (!day || !month || !year) return '';

	// 		return `${day}/${month}/${year}`;
	// 	};
	// }

	if (col.columnType === 'duyet') {
		columnDef.cellEditor = 'agSelectCellEditor';

		// Default options for duyet column
		const duyetOptions = ['Chưa Duyệt', 'Duyệt'];

		columnDef.cellEditorParams = {
			values: duyetOptions,
		};

		// Add cell renderer to show different colors based on value
		columnDef.cellStyle = (params) => {
			const originalStyles = originalCellStyle ? originalCellStyle(params) : {};

			if (params.value === 'Duyệt') {
				return {
					...originalStyles, backgroundColor: '#e6f7e6', // Light green for approved
					color: '#008000', fontWeight: 'bold',
				};
			} else if (params.value === 'Chưa Duyệt') {
				return {
					...originalStyles, backgroundColor: '#fff3cd', // Light yellow for not approved
					color: '#856404',
				};
			}

			return originalStyles;
		};

		// Check if user has permission to edit this cell
		columnDef.editable = (params) => {
			if (!params.data) return false;

			// Get the column configuration
			const columnConfig = templateColumns.find((c) => c.columnName === params.colDef.field);

			if (!columnConfig || !columnConfig.duyetOptions) return true;

			// Check if current user's UC matches the allowed UC
			const allowedUC = columnConfig.duyetOptions.selectedUC;

			// If user is admin, they can always edit
			if (currentUser.isAdmin) return true;

			// Check if user has the UC that's allowed to edit
			return listUC_CANVAS.some((uc) => uc.id === allowedUC);
		};
	}

	if (col.columnType === 'conditional') {
		// Make sure conditional columns are not editable
		columnDef.editable = false;

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

	if (col.columnType === 'duyet_dieu_kien') {
		columnDef.cellEditor = 'agSelectCellEditor';
		columnDef.cellEditorParams = {
			values: ['Chưa Duyệt', 'Duyệt'],
		};

		// Add cell renderer to show different colors based on value and conditions
		columnDef.cellStyle = (params) => {
			const originalStyles = {
				backgroundColor: col.bgColor || '#ffffff', color: col.textColor || '#000000',
			};

			if (!params.data || !col.duyetDieuKien) return originalStyles;

			// Evaluate all conditions
			const conditions = col.duyetDieuKien.conditions || [];
			const conditionsMet = conditions.reduce((result, condition, index) => {
				const sourceValue = params.data[condition.column];
				const compareValue = condition.value;

				let isConditionMet = false;
				switch (condition.operator) {
					case '=':
						isConditionMet = sourceValue === compareValue;
						break;
					case '!=':
						isConditionMet = sourceValue !== compareValue;
						break;
					case '>':
						isConditionMet = Number(sourceValue) > Number(compareValue);
						break;
					case '<':
						isConditionMet = Number(sourceValue) < Number(compareValue);
						break;
					default:
						isConditionMet = false;
				}

				if (index === 0) return isConditionMet;

				const prevOperator = conditions[index - 1].logicOperator;
				return prevOperator === 'AND' ? result && isConditionMet : result || isConditionMet;
			}, true);

			if (params.value === 'Duyệt') {
				return {
					...originalStyles, backgroundColor: '#e6f7e6', color: '#008000', fontWeight: 'bold',
				};
			} else if (params.value === 'Chưa Duyệt') {
				return {
					...originalStyles, backgroundColor: '#fff3cd', color: '#856404',
				};
			}

			return originalStyles;
		};

		// Check if user has permission to edit based on conditions
		columnDef.editable = (params) => {
			if (!params.data || !col.duyetDieuKien) return false;

			// Evaluate conditions
			const conditions = col.duyetDieuKien.conditions || [];
			const conditionsMet = conditions.reduce((result, condition, index) => {
				const sourceValue = params.data[condition.column];
				const compareValue = condition.value;

				let isConditionMet = false;
				switch (condition.operator) {
					case '=':
						isConditionMet = sourceValue === compareValue;
						break;
					case '!=':
						isConditionMet = sourceValue !== compareValue;
						break;
					case '>':
						isConditionMet = Number(sourceValue) > Number(compareValue);
						break;
					case '<':
						isConditionMet = Number(sourceValue) < Number(compareValue);
						break;
					default:
						isConditionMet = false;
				}

				if (index === 0) return isConditionMet;

				const prevOperator = conditions[index - 1].logicOperator;
				return prevOperator === 'AND' ? result && isConditionMet : result || isConditionMet;
			}, true);

			// If user is admin, they can always edit
			if (currentUser.isAdmin) return true;

			// Check if user has the appropriate UC based on conditions
			const relevantUC = conditionsMet ? col.duyetDieuKien.ucTrue : col.duyetDieuKien.ucFalse;
			return listUC_CANVAS.some(uc => uc.id === relevantUC);
		};
	}

	if (col.columnType === 'bieu_tuong_phan_tram') {
		columnDef.cellRenderer = (params) => {
			if (params.value == null || params.value == undefined || isNaN(params.value)) {
				return '';
			}

			const value = Number(params.value);
			const percentage = value;
			const formattedValue = percentage.toFixed(1);
			return (<div className={styles.percentageCell}>
				<div className={styles.percentageBar}>
					<div
						className={styles.percentageFill}
						style={{
							width: `${Math.min(100, Math.max(0, percentage))}%`,
							backgroundColor: col.percentageBarColor || '#259C63',
						}}
					/>
				</div>
				<div className={styles.percentageText} style={{ color: col.textColor }}>
					{formattedValue}
					<span className={styles.percentageSymbol}>%</span>
				</div>
			</div>);
		};
		columnDef.autoHeight = true;
	}

	if (col.columnType === 'dateCalc') {
		// Date calculation columns should not be editable
		columnDef.editable = false;

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

			return days > 0 ? `+ ${days} ngày` : days < 0 ? `- ${Math.abs(days)} ngày` : 'Hôm nay';
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
					...originalStyles, backgroundColor: '#e6f7e6', color: '#008000',
				};
			} else if (days > 0) {
				// Getting closer - yellow
				return {
					...originalStyles, backgroundColor: '#fff3cd', color: '#856404',
				};
			} else if (days === 0) {
				// Today - blue
				return {
					...originalStyles, backgroundColor: '#cce5ff', color: '#004085', fontWeight: 'bold',
				};
			} else {
				// Overdue - red
				return {
					...originalStyles, backgroundColor: '#f8d7da', color: '#721c24', fontWeight: 'bold',
				};
			}
		};
	}

	if (col.columnType === 'date_time_picker') {
		const setting = col.setting_date_time_picker || {};
		// Set default format if not specified
		const excelFormat = setting.formatDate || 'DD/MM/YYYY HH:mm:ss';
		
		// Display value in the chosen format
		columnDef.cellRenderer = (params) => {
			const value = params.value;
			if (!value) return '';
			let dateObj;
			if (typeof value === 'string' || typeof value === 'number') {
				dateObj = new Date(value);
			} else if (value instanceof Date) {
				dateObj = value;
			} else {
				return '';
			}
			if (isNaN(dateObj.getTime())) return '';
			
			// Format according to settings
			if (setting.format === 'date') {
				return dayjs(dateObj).format('DD/MM/YYYY');
			} else if (setting.format === 'time') {
				return dayjs(dateObj).format('HH:mm');
			} else {
				// datetime
				return dayjs(dateObj).format('DD/MM/YYYY HH:mm');
			}
		};

		columnDef.cellEditor = CustomDateTimePickerEditor;
		columnDef.cellEditorParams = {
			showTime: setting.format === 'datetime' || setting.format === 'time',
			format: setting.format === 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm',
			use12Hours: !!setting.use12Hours
		};

		columnDef.valueParser = (params) => {
			if (!params.newValue) return null;
			
			// Handle ISO string from paste
			if (typeof params.newValue === 'string' && params.newValue.includes('T')) {
				const dateObj = new Date(params.newValue);
				if (!isNaN(dateObj.getTime())) {
					return dayjs(dateObj).format(excelFormat);
				}
			}
			
			// Handle direct date string input (like from Excel)
			const d = dayjs(params.newValue, excelFormat, true);
			return d.isValid() ? d.format(excelFormat) : null;
		};

		columnDef.valueSetter = (params) => {
			if (!params.newValue) {
				params.data[col.columnName] = null;
				return true;
			}
			
			// Store as ISO string for consistency
			if (typeof params.newValue === 'string') {
				// If it's already an ISO string
				if (params.newValue.includes('T')) {
					params.data[col.columnName] = params.newValue;
					return true;
				}
				// If it's a formatted date string
				const d = dayjs(params.newValue, excelFormat, true);
				if (d.isValid()) {
					params.data[col.columnName] = d.toISOString();
					return true;
				}
			}
			
			params.data[col.columnName] = null;
			return true;
		};
	}

	if (col.columnType === 'time_diff') {
		// Lấy cấu hình từ setting_time_diff
		const setting = col.setting_time_diff || {};
		columnDef.editable = false;
		columnDef.valueGetter = (params) => {
			if (!params.data) return '';
			const startCol = setting.startColumn;
			const endCol = setting.endColumn;
			if (!startCol || !endCol) return '';
			const startVal = params.data[startCol];
			const endVal = params.data[endCol];
			if (!startVal || !endVal) return '';
			const startDate = new Date(startVal);
			const endDate = new Date(endVal);
			if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';
			const diffMs = endDate - startDate;
			if (setting.unit === 'minutes') {
				return diffMs / (1000 * 60);
			} else if (setting.unit === 'hours') {
				return diffMs / (1000 * 60 * 60);
			} else {
				// days
				return diffMs / (1000 * 60 * 60 * 24);
			}
		};
		columnDef.valueFormatter = (params) => {
			if (params.value === null || params.value === undefined || params.value === '') return '';
			const v = Number(params.value);
			if (isNaN(v)) return '';
			if (setting.unit === 'minutes') return v.toFixed(1) + ' phút';
			if (setting.unit === 'hours') return v.toFixed( 1) + ' giờ';
			return v.toFixed(2) + ' ngày';
		};
	}

	if (col.columnType === 'date_split') {
		// Date split columns should not be editable
		columnDef.editable = false;
		
		// Get the source column and part to extract
		const sourceColumn = col.formulaDate?.sourceColumn;
		const part = col.formulaDate?.part;
		
		columnDef.valueGetter = (params) => {
			if (!params.data || !sourceColumn || !part) return '';
			
			const sourceValue = params.data[sourceColumn];
			if (!sourceValue) return '';
			
			try {
				const date = new Date(sourceValue);
				if (isNaN(date.getTime())) return '';
				
				switch (part) {
					case 'day':
						return String(date.getDate()).padStart(2, '0');
					case 'month':
						return String(date.getMonth() + 1).padStart(2, '0');
					case 'year':
						return date.getFullYear().toString();
					default:
						return '';
				}
			} catch (error) {
				console.error('Error parsing date in date_split:', error);
				return '';
			}
		};
	}
}

const AntdDatePickerEditor = forwardRef((props, ref) => {
	const { value } = props;
	const inputRef = useRef();
	const [currentValue, setCurrentValue] = useState(value ? dayjs(value) : null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	useImperativeHandle(ref, () => ({
		getValue: () => {
			return currentValue ? currentValue.toDate().toISOString() : '';
		}
	}));

	const handleChange = (date) => {
		setCurrentValue(date);
		// Gọi stopEditing sau khi setState xong
		setTimeout(() => {
			props.api.stopEditing();
		}, 0);
	};

	return (
		<DatePicker
			ref={inputRef}
			value={currentValue}
			format={props.colDef?.dateFormat === 'MM/DD/YYYY' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
			onChange={handleChange}
			style={{ width: '100%' }}
			allowClear
		/>
	);
});

export default AntdDatePickerEditor;

import { Alert, Input, Button } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
	getTemplateColumn,
	getTemplateColumnForTemplate,
	getTemplateRow,
} from '../../../../../../apis/templateSettingService.jsx';
import { loadAndMergeData } from './logicCombine.js';
import { AgGridReact } from 'ag-grid-react';
import { formatCurrency } from '../../../../../KeToanQuanTri/functionKTQT/formatMoney.js';

const { Search } = Input;

export default function ViewCombine({ templateData, isStatusFilter, handleSaveCombineTable, isMobileMenu }) {
	const [rowData, setRowData] = useState([]);
	const [rowDB, setRowDB] = useState([]);
	const [colDefs, setColDefs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [fetchError, setFetchError] = useState(null);
	const [hasChanges, setHasChanges] = useState(false);

	const defaultColDef = useMemo(() => {
		return {
			editable: false,
			filter: isStatusFilter
				? 'agMultiColumnFilter'
				: false, // hoặc để undefined nếu không cần tắt
			floatingFilter: isStatusFilter || undefined,
			filterParams: isStatusFilter
				? {
					filters: [
						{ filter: 'agTextColumnFilter' },
						{ filter: 'agSetColumnFilter' },
					],
				}
				: undefined,
			cellStyle: {
				fontSize: '14.5px',
				color: 'var(--text-color)',
				fontFamily: 'var(--font-family)',
			},
			width: 125,
			wrapHeaderText: true,
			autoHeaderHeight: true,
		};
	}, [isStatusFilter]);


	const statusBar = useMemo(() => ({
		statusPanels: [{ statusPanel: 'agAggregationComponent' }],
	}), []);

	async function loadFetchData() {
		setLoading(true);
		setFetchError(null);
		setRowData([]);
		setColDefs([]);
		try { // Start try block
			let rowDBResponse = await getTemplateRow(templateData.id);
			let rowDB = rowDBResponse.rows || [];
			if (rowDB.length > 0) {
				rowDB = rowDB.map(e => e.data);
				setRowDB(rowDB);
			}
			if (templateData && templateData.setting && templateData.setting.selectedTemplates) {
				let tempIds = Object.keys(templateData.setting.selectedTemplates);
				if (tempIds.length === 0) {
					throw new Error('Chưa chọn template nào để kết hợp.');
				}

				let listCol = [];
				const colPromises = tempIds.map(tempId => getTemplateColumn(tempId));
				const resultsColTemps = await Promise.all(colPromises);
				resultsColTemps.forEach(colTemps => {
					if (colTemps) {
						listCol.push(...colTemps);
					}
				});
				if (listCol.length === 0 && tempIds.length > 0) {
					console.warn('Không thể lấy thông tin cột cho các template đã chọn.');
				}

				let result = await loadAndMergeData(templateData);
				if (result && result.length > 0 && result[0]) {
					setRowData(result);
					// Compare rowDB and result
					const hasDataChanges = () => {
						if (rowDB.length !== result.length) return true;
						
						// Sort both arrays by all properties to ensure consistent comparison
						const sortedRowDB = [...rowDB].sort((a, b) => {
							const keysA = Object.keys(a).sort();
							const keysB = Object.keys(b).sort();
							
							if (keysA.length !== keysB.length) {
								return keysA.length - keysB.length;
							}
							
							for (let i = 0; i < keysA.length; i++) {
								const key = keysA[i];
								if (a[key] !== b[key]) {
									return String(a[key]).localeCompare(String(b[key]));
								}
							}
							return 0;
						});
						
						const sortedResult = [...result].sort((a, b) => {
							const keysA = Object.keys(a).sort();
							const keysB = Object.keys(b).sort();
							
							if (keysA.length !== keysB.length) {
								return keysA.length - keysB.length;
							}
							
							for (let i = 0; i < keysA.length; i++) {
								const key = keysA[i];
								if (a[key] !== b[key]) {
									return String(a[key]).localeCompare(String(b[key]));
								}
							}
							return 0;
						});
						
						return JSON.stringify(sortedRowDB) !== JSON.stringify(sortedResult);
					};

					setHasChanges(hasDataChanges());

					let cols = Object.keys(result[0]);
					let newColDefs = [];
					cols.forEach(col => {
						let colDef = { field: col, headerName: col };
						if (col == 'Thời gian') {
							colDef = { field: 'Thời gian_display', headerName: col };
						}
						if (col == 'templateName') {
							colDef = { field: 'templateName', headerName: 'Tên bảng gốc' };
						}
						if (col == 'Thời gian_display') {
							return;
						}
						let colTemp = listCol.find(c => c.columnName == col);
						// colDef = {
						// 	...colDef,
						// 	columnIndex:colTemp.columnIndex
						// }
						if (((colTemp && colTemp.columnType && colTemp.columnType == 'number') || !colTemp) && col !== 'templateName') {
							colDef = {
								...colDef,
								headerClass: 'right-align-important',
								cellStyle: { textAlign: 'right' },
								valueFormatter: params => formatCurrency(params.value),
							};
						} else {
							colDef = {
								...colDef,
								width: 300,
							};
						}
						newColDefs.push(colDef);
					});
					newColDefs.sort((a, b) => {
						const nameA = a.headerName;
						const nameB = b.headerName;

						const isANumber = /^\d/.test(nameA);
						const isBNumber = /^\d/.test(nameB);

						if (isANumber && !isBNumber) return 1;
						if (!isANumber && isBNumber) return -1;
						return nameA.localeCompare(nameB);
					});
					setColDefs(newColDefs);
				} else {
					console.log('loadAndMergeData trả về kết quả rỗng hoặc không hợp lệ.');
					setRowData([]);
					setColDefs([]);
				}

			} else {
				// Handle missing templateData or settings
				console.log('Dữ liệu template không hợp lệ hoặc thiếu cấu hình.');
				throw new Error('Dữ liệu template không hợp lệ hoặc thiếu cấu hình cần thiết.');
			}
		} catch (error) {
			console.error('Lỗi khi tải dữ liệu kết hợp:', error);
			setFetchError(`Lỗi khi tải hoặc xử lý dữ liệu: Vui lòng kiểm tra lại cấu hình hoặc do dữ liệu nguồn không toàn vẹn.`);
			setRowData([]);
			setColDefs([]);
			setHasChanges(false);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadFetchData().then();
	}, [templateData]);

	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
				{hasChanges && (
					<Button
						type="primary"
						onClick={async () => {
							if (handleSaveCombineTable) {
								await handleSaveCombineTable(rowData, colDefs);
								// Reset states after successful save
								setRowDB(rowData);
								setHasChanges(false);
								window.location.reload();
							}
						}}
					>
						Lưu bảng
					</Button>
				)}
			</div>
			<div className="ag-theme-quartz" style={{  height: isMobileMenu ? '60vh' : '66vh', width: '100%', padding: 5 }}>
				<AgGridReact
					rowData={rowData}
					columnDefs={colDefs}
					defaultColDef={defaultColDef}
					statusBar={statusBar}
					enableRangeSelection={true}
				/>
			</div>
		</div>
	);
}

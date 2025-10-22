import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import AG_GRID_LOCALE_VN from '../../../../../Home/AgridTable/locale';
import { Badge, Button, Dropdown, Modal, Spin, Table, Tag } from 'antd';
import { message } from 'antd';
import {
	getTableByid,
	getTemplateByFileNoteId,
	getTemplateColumn,
	getTemplateRow, updateTemplateColumnWidth,
	deleteTemplateRowByTableId,
	createBathTemplateRow,
	deleteTemplateColByTableId,
	createTemplateColumn,
	updateColumnIndexes,
} from '../../../../../../apis/templateSettingService';
import { MyContext } from '../../../../../../MyContext';
import { getFileNotePadById } from '../../../../../../apis/public/fileNotePadService.jsx';
import { IconUser } from '../../../../../../icon/IconSVG.js';
import css from '../Template.module.css';
import { Template_Table_Type } from '../../../../../../CONST.js';
import { getFileNotePadByIdController } from '../../../../../../apis/fileNotePadService.jsx';
import ActionMenuDropdown from '../../../../../KeToanQuanTri/ActionButton/ActionMenuDropdown.jsx';
import { log } from 'mathjs';
import SettingChart from '../SettingChart/SettingChart.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const SheetDetail = ({ selectedTab, isMobileMenu }) => {
	const gridRef = useRef();
	const [loading, setLoading] = useState(false);
	const [templateData, setTemplateData] = useState(null);
	const [templateColumns, setTemplateColumns] = useState([]);
	const [rowData, setRowData] = useState([]);
	const [colDefs, setColDefs] = useState([]);
	const { currentUser } = useContext(MyContext);
	const [isStatusFilter, setIsStatusFilter] = useState(false);
	const [showSettingsChartPopup, setShowSettingsChartPopup] = useState(false);
	const [showPivotSettings, setShowPivotSettings] = useState(false);
	const [gridKey, setGridKey] = useState(Math.random());
	const statusBar = useMemo(() => ({
		statusPanels: [{ statusPanel: 'agAggregationComponent' }],
	}), []);

	function filter() {
		if (isStatusFilter) {
			return {
				filter: 'agMultiColumnFilter', floatingFilter: true, filterParams: {
					filters: [{
						filter: 'agTextColumnFilter',
					}, {
						filter: 'agSetColumnFilter',
					}],
				},
			};
		}
	}

	const onColumnResized = async (params) => {
		if (params.finished && params.column && templateData) {

			const columnWidth = params.column.getActualWidth();
			const columnId = params.column.userProvidedColDef?.realColId;

			await updateTemplateColumnWidth({ id: columnId, width: columnWidth });
		}
	};

	const loadColumnData = async (templateData) => {
		try {
			const columns = await getTemplateColumn(templateData.id);
			const sortedColumns = columns.sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
			setTemplateColumns(sortedColumns);
			const columnDefs = sortedColumns.map(col => {
				// Check if columnFields has only one element and the column name is a number
				const shouldPrefix = templateData?.mother_rotate_columns?.columnFields?.length === 1 && 
					!isNaN(col.columnName) && 
					templateData.mother_rotate_columns.columnFields[0];

				const headerName = shouldPrefix 
					? `${templateData.mother_rotate_columns.columnFields[0]} ${col.columnName}`
					: col.columnName;

				return {
					field: col.columnName,
					headerName: headerName,
					filter: true,
					sortable: true,
					resizable: true,
					realColId: col.id,
					width: col?.columnWidth || 200,
					...filter(),
					headerClass: () => {
						if (col.columnType === 'number' || col.columnType === 'formula') {
							return 'right-align-important';
						}
					},
					valueFormatter: params => {
						if (templateData?.mother_rotate_columns?.splitRowFieldsToColumns && templateData?.mother_rotate_columns?.rowFields?.includes(col.columnName)) {
							return params.value ?? '';
						}
						if (col.columnType === 'number' && params.value) {
							return params.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
						}
						if (col.columnType === 'date' && params.value) {
							const date = new Date(params.value);
							return date.toLocaleDateString('vi-VN');
						}
						if (col.columnType === 'select' && params.value) {
							return params.value;
						}
						if (col.columnType === 'formula' && params.value) {
							if (col.selectFormula?.isPercent || col.isPercent) {
								let val = Number(params.value);
								if (!isNaN(val)) {
									 val = val * 100;
									return val.toFixed(2) + '%';
								}
								return params.value;
							}
							const numValue = Number(params.value);
							return !isNaN(numValue)
								? numValue.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
								: params.value;
						}
						if (col.columnType === 'duyet' && params.value !== undefined) {
							return params.value ? 'Đã duyệt' : 'Chưa duyệt';
						}
						if (col.columnType === 'duyet_dieu_kien' && params.value !== undefined) {
							return params.value ? 'Đã duyệt' : 'Chưa duyệt';
						}
						if (col.columnType === 'bieu_tuong_phan_tram' && params.value !== undefined) {
							return params.value + '%';
						}
						return params.value;
					},
					cellStyle: (params) => {
						const styles = {
							backgroundColor: col.bgColor || '#ffffff',
							color: col.textColor || '#000000'
						};

						if (templateData?.mother_rotate_columns?.splitRowFieldsToColumns && templateData?.mother_rotate_columns?.rowFields?.includes(col.columnName)) {
							if (params.value === 'TỔNG CỘT') {
								styles.backgroundColor = '#989898';
								styles.fontWeight = 'bold';
							}
						}

						if (params.data && templateData?.mother_rotate_columns?.rowFields) {
							const rowFields = templateData.mother_rotate_columns.rowFields;
							const isTongCot = rowFields.length === 1
								? params.data[rowFields[0]] === 'TỔNG CỘT'
								: rowFields.map(field => params.data[field]).join(' | ') === 'TỔNG CỘT';
							// Thêm style cho TỔNG HÀNG
							if (isTongCot && col.columnName === 'TỔNG HÀNG') {
								styles.backgroundColor = '#ffb7ed';
								styles.fontWeight = 'bold';
							}

							else if (isTongCot) {
								styles.backgroundColor = '#d5ffdc';
								styles.fontWeight = 'bold';
							}
							else if (col.columnName === 'TỔNG HÀNG') {
								styles.backgroundColor = '#fff9e6';
								styles.fontWeight = 'bold';
							}

						}

						if (col.columnType === 'number' || col.columnType === 'formula') {
							styles.textAlign = 'right';
						}

						return styles;
					}
				};
			});

			setColDefs(columnDefs);
		} catch (error) {
			console.error('Lỗi khi tải cấu hình cột:', error);
		}
	};

	const loadInitialData = async () => {
		try {
			setLoading(true);
			const templateInfo = await getTemplateByFileNoteId(selectedTab?.id);
			if (templateInfo && templateInfo[0]) {
					setTemplateData(templateInfo[0]);
				await loadColumnData(templateInfo[0]);
				await loadRowData(templateInfo[0].id);
			}
		} catch (error) {
			console.error('Lỗi khi tải dữ liệu:', error);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		loadInitialData();
	}, [selectedTab, isStatusFilter]);

	const handleChangeStatusFilter = () => {
		setIsStatusFilter((prev) => {
			return !prev;
		});
	};

	const loadRowData = async (templateId) => {
		try {
			const dataResponse = await getTemplateRow(templateId);
			const data = dataResponse.rows || [];
			const rows = data
				.map(row => ({
					...row.data,
					rowId: row.id,
					idPhieu: row.id_DataOriginal,
				}))
				.sort((a, b) => a.rowId - b.rowId); // Sắp xếp theo rowId từ bé đến lớn
			setRowData(rows);
		} catch (error) {
			console.error('Lỗi khi tải dữ liệu hàng:', error);
		}
	};

	const defaultColDef = useMemo(() => ({
		enableCellTextSelection: true,
		resizable: true,
		sortable: true,
		filter: true,
		copyable: true,
	}), []);






	return (
		<>
			<div className="report__header">
				<div className="sheet_title">
					<span>{selectedTab && selectedTab.name}</span>
				</div>
				<div className="report__button-group">
					<div className={'buttonAction'}>

						<Button className={css.customButton}
							onClick={() => setShowSettingsChartPopup(true)}>
							<span>Tạo biểu đồ</span>
						</Button>


						<Button className={css.customButton} onClick={handleChangeStatusFilter}>
							<span>{isStatusFilter ? '❌ Tắt filter' : '✅ Bật filter'}</span>
						</Button>

						<Button className={css.customButton} onClick={() => setShowPivotSettings(true)}>
							<span>Xem cài đặt bảng pivot</span>
						</Button>



					</div>
				</div>
			</div>
			<div style={{ width: '100%', height: isMobileMenu ? '65vh' : '72vh' }}>
				<div className="report">
					<div className="ag-theme-quartz" style={{ width: '100%', height: '100%' }}>
						<AgGridReact
							key={gridKey}
							ref={gridRef}
							rowData={rowData}
							columnDefs={colDefs}
							defaultColDef={defaultColDef}
							enableRangeSelection={true}
							statusBar={statusBar}
							localeText={AG_GRID_LOCALE_VN}
							rowSelection="multiple"
							suppressRowClickSelection={true}
							suppressCellFocus={false}
							suppressMovableColumns={false}
							onColumnResized={onColumnResized}
							onColumnMoved={async (event) => {
								if (event.finished && event.api && templateColumns && templateData) {
									try {
										const allColumns = event.api
											.getColumnDefs()
											.filter((col) => col.field && col.field !== 'rowId' && col.field !== 'delete')
											.map((column, index) => ({
												id: templateColumns.find((col) => col.columnName === column.field)?.id,
												columnIndex: index,
											}))
											.filter((col) => col.id);
										await updateColumnIndexes({
											tableId: templateData.id,
											columns: allColumns,
										});
									} catch (e) {
										console.error('Error saving column indexes:', e);
									}
								}
							}}
						/>
					</div>
				</div>
			</div>
			{showSettingsChartPopup && <><SettingChart showSettingsChartPopup={showSettingsChartPopup}
				setShowSettingsChartPopup={setShowSettingsChartPopup}
				colDefs={colDefs}
				templateData={templateData}
			/>
			</>}
			{showPivotSettings && (
				<Modal
					title="Cấu hình Pivot"
					open={showPivotSettings}
					onCancel={() => setShowPivotSettings(false)}
					footer={null}
					width={600}
				>
					{templateData?.mother_rotate_columns ? (
						<div style={{lineHeight:1.8, background:'#f8fafd', border:'1px solid #e0e7ef', borderRadius:10, padding:20, marginTop:8, boxShadow:'0 2px 8px #e0e7ef55'}}>
							<div style={{display:'flex', flexWrap:'wrap', gap: '16px 32px', marginBottom: 12}}>
								<div><b>Trường hàng:</b> <span style={{color:'#1976d2'}}>{templateData.mother_rotate_columns.rowFields?.join(', ') || <span style={{color:'#888'}}>Không có</span>}</span></div>
								<div><b>Trường cột:</b> <span style={{color:'#388e3c'}}>{templateData.mother_rotate_columns.columnFields?.join(', ') || <span style={{color:'#888'}}>Không có</span>}</span></div>
								<div><b>Trường giá trị:</b> <span style={{color:'#fbc02d'}}>
									{Array.isArray(templateData.mother_rotate_columns.valueFields)
										? templateData.mother_rotate_columns.valueFields.join(', ')
										: (templateData.mother_rotate_columns.valueField || <span style={{color:'#888'}}>Không có</span>)}
								</span></div>
								{templateData.mother_rotate_columns.customValueFieldName && (
									<div><b>Tên trường giá trị mới:</b> <span style={{color:'#0288d1', fontWeight:'bold'}}>{templateData.mother_rotate_columns.customValueFieldName}</span></div>
								)}
								<div><b>Phép tính:</b> <span style={{color:'#7b1fa2'}}>{templateData.mother_rotate_columns.aggregation || <span style={{color:'#888'}}>Không có</span>}</span></div>
							</div>
							{/* Hiển thị trạng thái tách trường hàng thành cột riêng */}
							{templateData.mother_rotate_columns.splitRowFieldsToColumns && templateData.mother_rotate_columns.rowFields?.length > 1 ? (
								<div style={{marginBottom:12}}>
									<b style={{color:'#0288d1'}}>Tách từng trường hàng thành cột riêng:</b> <span style={{color:'#388e3c', fontWeight:'bold'}}>Có</span>
									<span style={{marginLeft:8, color:'#1976d2'}}>Các trường: {templateData.mother_rotate_columns.rowFields.join(', ')}</span>
								</div>
							) : (
								<div style={{marginBottom:12}}>
									<b style={{color:'#0288d1'}}>Tách từng trường hàng thành cột riêng:</b> <span style={{color:'#888', fontWeight:'bold'}}>Không</span>
								</div>
							)}
							<div style={{display:'flex', gap:32, marginBottom:12}}>
								<div><b>Σ Hiển thị tổng hàng:</b> <span style={{color: templateData.mother_rotate_columns.showRowTotal ? '#388e3c' : '#888', fontWeight:'bold'}}>{templateData.mother_rotate_columns.showRowTotal ? 'Có' : 'Không'}</span></div>
								<div><b>Σ Hiển thị tổng cột:</b> <span style={{color: templateData.mother_rotate_columns.showColumnTotal ? '#388e3c' : '#888', fontWeight:'bold'}}>{templateData.mother_rotate_columns.showColumnTotal ? 'Có' : 'Không'}</span></div>
							</div>
							{templateData.mother_rotate_columns.filters && templateData.mother_rotate_columns.filters.length > 0 && (
								<div style={{marginTop:16, background:'#fffbe6', border:'1px solid #ffe082', borderRadius:8, padding:12}}>
									<b style={{color:'#f57c00'}}>🔎 Điều kiện lọc:</b>
									<ul style={{marginLeft:20, marginTop:8}}>
										{templateData.mother_rotate_columns.filters.map((filter, idx) => {
											const operatorMap = {
												eq: '=',
												neq: '≠',
												gt: '>',
												gte: '≥',
												lt: '<',
												lte: '≤',
												contains: 'chứa',
												is_distinct: 'Không trùng lặp',
											};
											const logicMap = {
												and: 'VÀ',
												or: 'HOẶC',
											};
											return (
												<li key={idx} style={{marginBottom:4}}>
													{idx > 0 && <span style={{color:'#1976d2',marginRight:4, fontWeight:'bold'}}>[{logicMap[filter.logic?.toLowerCase()] || 'VÀ'}]</span>}
													<span style={{color:'#1976d2'}}>Cột <b>{filter.column} </b></span>
													<span style={{color:'#7b1fa2'}}>{operatorMap[filter.operator] || filter.operator}</span>
													{filter.operator === 'is_distinct'
														? <span style={{color:'#d84315', fontWeight:'bold'}}> (Chỉ lấy dòng đầu tiên của mỗi giá trị)</span>
														: <span style={{color:'#d84315', fontWeight:'bold'}}>{filter.value}</span>
													}
												</li>
											);
										})}
									</ul>
								</div>
							)}
							{templateData.mother_rotate_columns.calculatedColumns && templateData.mother_rotate_columns.calculatedColumns.length > 0 && (
								<div style={{marginTop:16, background:'#e3f2fd', border:'1px solid #90caf9', borderRadius:8, padding:12}}>
									<b style={{color:'#1976d2'}}>🧩 Các cột tính toán:</b>
									<ul style={{marginLeft:20, marginTop:8}}>
										{templateData.mother_rotate_columns.calculatedColumns.map((col, idx) => (
											<li key={idx} style={{marginBottom:4}}>
												<span style={{color:'#1976d2', fontWeight:'bold'}}>
													{col.name}
													{(col.isPercent || col.selectFormula?.isPercent) && (
														<span style={{ color: '#f50057', marginLeft: 6 }} title="Hiển thị dạng phần trăm"> (%)</span>
													)}
												</span>: <span style={{color:'#7b1fa2'}}>{col.formula}</span>
												{col.variables && (
													<div style={{fontSize:'90%',color:'#888'}}>Biến: {Object.entries(col.variables).map(([k,v]) => `${k}→${v}`).join(', ')}</div>
												)}
											</li>
										))}
									</ul>
								</div>
							)}
							{templateData?.mother_rotate_columns?.customTextColumns && templateData.mother_rotate_columns.customTextColumns.length > 0 && (
								<div style={{marginTop:16, background:'#f1f8e9', border:'1px solid #aed581', borderRadius:8, padding:12}}>
									<b style={{color:'#388e3c'}}>📝 Các cột text tuỳ chỉnh:</b>
									<ul style={{marginLeft:20, marginTop:8}}>
										{templateData.mother_rotate_columns.customTextColumns.map((col, idx) => (
											<li key={col.columnName || col.name} style={{marginBottom:4}}>
												<span style={{color:'#388e3c', fontWeight:'bold'}}>{col.columnName || col.name}</span>
												{col.referenceColumn && (
													<span style={{color:'#1976d2', marginLeft:8}}>
														(Đối chiếu với: <b>{col.referenceColumn}</b>)
													</span>
												)}
												{col.data && typeof col.data === 'object' && (
													<span style={{color:'#888', marginLeft:8}}>
														({Object.keys(col.data).length} giá trị)
													</span>
												)}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					) : (
						<div>Không có thông tin cài đặt pivot cho bảng này.</div>
					)}
				</Modal>
			)}
		</>

	);
};

export default SheetDetail;

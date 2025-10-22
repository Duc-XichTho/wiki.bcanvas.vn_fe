import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Card, message, Popconfirm, Button, Switch } from 'antd';
import { deleteKTQTImport, getAllKTQTImport, updateKTQTImport } from '../../../apis/ktqtImportService.jsx';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import '../../Home/AgridTable/agComponent.css';
import css from '../KeToanQuanTriComponent/KeToanQuanTri.module.css';
import { createSKTDM } from './createDM.js';
import { formatCurrency } from '../functionKTQT/formatMoney.js';
import { MyContext } from '../../../MyContext.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const KTQTImport = ({ type, call }) => {
	const [rowData, setRowData] = React.useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const [loading, setLoading] = useState(false);
	const [changedRows, setChangedRows] = useState([]);
	const [showMerged, setShowMerged] = useState(false);
	const gridRef = useRef();
	const {
		currentYearKTQT, currentCompanyKTQT
	} = useContext(MyContext);

	const defaultColDef = useMemo(() => {
		return {
			editable: true,
			cellStyle: {
				fontSize: '14.5px',
				color: 'var(--text-color)',
				fontFamily: 'var(--font-family)',
			},
			width: 120,
			wrapHeaderText: true,
			autoHeaderHeight: true,
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
	}, []);

	const columnDefs = useMemo(() => {
		return [
			{
				headerName: '',
				field: 'checkbox',
				width: 30,
				pinned: 'left',
				checkboxSelection: true,
				headerCheckboxSelection: true,
				suppressHeaderMenuButton: true,
				cellStyle: { textAlign: 'center' },
				filter: false
			},
			{ field: 'id', headerName: 'ID', width: 80 },	
			{ field: 'daHopNhat', headerName: 'Hợp nhất', cellRenderer: (params) => {
				return <div style={{ textAlign: 'center' }}>
					{params.data.daHopNhat ? <p style={{ color: 'green' }}	>Đã hợp nhất</p> : <p style={{ color: 'red' }}>Chưa hợp nhất</p>}
				</div>
			}},	
			{ field: 'day', headerName: 'Ngày', width: 100 },
			{ field: 'month', headerName: 'Tháng', width: 100 },
			{ field: 'year', headerName: 'Năm', width: 100 },
			{ field: 'diengiai', headerName: 'Diễn giải', width: 150 },
			{ field: 'so_tien', headerName: 'Số tiền', width: 120,
				headerClass: 'right-align-important',
				valueFormatter: (params) => formatCurrency(params.value),
				cellStyle: { textAlign: 'right' }, },
			{ field: 'kmf', headerName: 'Khoản mục KQKD', width: 150 },
			{ field: 'project', headerName: 'Vụ việc', width: 120 },
			{ field: 'unit_code', headerName: 'Bộ phận', width: 120 },
			{ field: 'product', headerName: 'Sản phẩm', width: 150 },
			{ field: 'soLuong', headerName: 'Số lượng', width: 150 },
			{ field: 'kenh', headerName: 'Kênh', width: 150 },
			{ field: 'company', headerName: 'Công ty', width: 120 },
		];
	}, []);

	const statusBar = useMemo(() => {
		return {
			statusPanels: [{ statusPanel: 'agAggregationComponent' }],
		};
	}, []);

	async function loadData() {
		let data = await getAllKTQTImport();
		data = data.filter(item => item.phan_loai === type);
		if (currentYearKTQT) {
			data = data.filter(item => item.year == currentYearKTQT);
		}
		if (currentCompanyKTQT) {
			if (currentCompanyKTQT !== 'HQ') data = data.filter(item => item.company.toLowerCase() === currentCompanyKTQT.toLowerCase());
		}
		setRowData(data);
	}

	useEffect(() => {
		loadData();
	}, [type, currentYearKTQT, currentCompanyKTQT]);

	const filteredRowData = useMemo(() => {
		if (call) {
			return rowData.filter(row => showMerged ? row.daHopNhat : !row.daHopNhat);
		}
		return rowData;
	}, [rowData, call, showMerged]);

	const onSelectionChanged = () => {
		const selectedData = gridRef.current.api.getSelectedNodes().map((node) => node.data);
		setSelectedRows(selectedData);
	};

	const handleDeleteSelected = async () => {
		if (selectedRows.length === 0) return;

		setLoading(true);
		try {
			// Delete each selected row using the API
			const deletePromises = selectedRows.map(row => deleteKTQTImport(row.id));
			await Promise.all(deletePromises);

			// Refresh the data after successful deletion
			await loadData();
			setSelectedRows([]);
		} catch (error) {
			console.error('Error deleting rows:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateSoKeToan = async () => {
		if (selectedRows.length === 0) return;

		setLoading(true);
		try {
			await createSKTDM(selectedRows);
			message.success('Hợp nhất xong!')
			await loadData();
		} catch (error) {
			console.error('Error creating SoKeToan records:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleCellValueChanged = (params) => {
		const updatedData = params.data;
		setChangedRows((prev) => {
			const existingIndex = prev.findIndex(row => row.id === updatedData.id);
			if (existingIndex > -1) {
				const newChangedRows = [...prev];
				newChangedRows[existingIndex] = updatedData;
				return newChangedRows;
			} else {
				return [...prev, updatedData];
			}
		});
	};

	const handleSaveChanges = async () => {
		try {
			await Promise.all(changedRows.map(row => updateKTQTImport(row)));
			message.success('Cập nhật thành công!');
			setChangedRows([]);
		} catch (error) {
			console.error('Lỗi khi cập nhật:', error);
			message.error('Cập nhật không thành công!');
		}
	};

	return (
		<Card
			title={
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<h2>{type === 'DT' ? 'Doanh thu' : 'Giá vốn'}</h2>
					<div className={css.headerAction} style={{ margin: 0 }}>
						{call && (
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '10px' }}>
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
										<span style={{ fontWeight: '500' }}>View Toggle</span>
										<Switch
											checked={showMerged}
											onChange={setShowMerged}
											checkedChildren="Đã hợp nhất"
											unCheckedChildren="Chưa hợp nhất"
										/>
									</div>
									<div style={{ 
										fontSize: '12px', 
										color: '#666', 
										marginTop: '4px',
										fontStyle: 'italic'
									}}>
										{showMerged 
											? 'Hiện tại: Các dòng đã được hợp nhất' 
											: 'Hiện tại: Các dòng chưa được hợp nhất, Bấm view toggle để xem các dữ liệu đã được tick hợp nhất'
										}
									</div>
								</div>
							</div>
						)}
						{selectedRows.length > 0 && (
							<>
								<Popconfirm
									title="Bạn có chắc chắn muốn xóa các mục đã chọn?"
									onConfirm={handleDeleteSelected}
									okText="Có"
									cancelText="Không"
								>
									<div className={`${css.headerActionButton} ${css.buttonOn}`}>
										<span>Xóa ({selectedRows.length})</span>
									</div>
								</Popconfirm>
								<div
									className={`${css.headerActionButton} ${css.buttonOn}`}
									onClick={handleCreateSoKeToan}
								>
									<span>Hợp nhất ({selectedRows.length})</span>
								</div>
							</>
						)}
						{changedRows.length > 0 &&
							<div
								className={`${css.headerActionButton} ${css.buttonOn}`}
								onClick={handleSaveChanges}
							>
								<span>Lưu thay đổi</span>
							</div>}
					</div>
				</div>
			}
		>
			<div className="ag-theme-quartz" style={{ height: call ? '650px' : '750px', width: '100%' }}>
				<AgGridReact
					ref={gridRef}
					rowData={filteredRowData}
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					enableRangeSelection={true}
					rowSelection="multiple"
					animateRows={true}
					localeText={AG_GRID_LOCALE_VN}
					statusBar={statusBar}
					onSelectionChanged={onSelectionChanged}
					suppressRowClickSelection={true}
					onCellValueChanged={handleCellValueChanged}
				/>
			</div>
		</Card>
	);
};

export default KTQTImport;

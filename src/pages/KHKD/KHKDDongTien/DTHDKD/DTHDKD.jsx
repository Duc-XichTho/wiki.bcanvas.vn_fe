import React, { useState, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import AG_GRID_LOCALE_VN from '../../../../pages/Home/AgridTable/locale.jsx';
import { formatMoney } from '../../../../generalFunction/format.js';
import { Button, Modal, Popconfirm } from 'antd';
import { updateKHKDTongHop } from '../../../../apis/khkdTongHopService.jsx';
import ActionCreate from '../../../Home/AgridTable/actionButton/ActionCreate.jsx';
import ActionSave from '../../../Home/AgridTable/actionButton/ActionSave.jsx';
import { useParams } from 'react-router-dom';

export default function DTHDKD({ dataKetQua, khkdTH, fetchKHTH }) {
	const { idHopKH } = useParams();
	const gridRef = useRef();
	const [rowData, setRowData] = useState([]);
	const [originalData, setOriginalData] = useState([]);
	const [resultData, setResultData] = useState([]);
	const [isViewingResult, setIsViewingResult] = useState(true);
	const [updateData, setUpdateData] = useState([]);
	useEffect(() => {
		if (khkdTH && dataKetQua) {
			let initialData;
			if (Array.isArray(khkdTH.settingDongTien) && khkdTH.settingDongTien.length > 0) {
				// Use existing saved settings
				initialData = JSON.parse(JSON.stringify(khkdTH.settingDongTien));
				// Calculate results immediately if we have saved settings
				const result = dataKetQua.map((sourceItem) => {
					const inputItem = initialData.find(item => item.name === sourceItem.name);
					const row = { name: sourceItem.name };
					for (let i = 1; i <= 12; i++) {
						const val1 = Number(sourceItem[`t${i}`] || 0);
						const val2 = Number(inputItem?.[`t${i}`] || 0);
						row[`t${i}`] = val1 * val2 / 100;
					}
					return row;
				});
				setResultData(result);
			} else {
				// Create new data structure if no saved settings exist
				initialData = dataKetQua.map(item => {
					const row = { name: item.name };
					for (let i = 1; i <= 12; i++) {
						row[`t${i}`] = '';
					}
					return row;
				});
			}
			setRowData(initialData);
			setOriginalData(JSON.parse(JSON.stringify(initialData)));
		}
		setUpdateData([]);
	}, [dataKetQua, khkdTH]);

	// Separate useEffect to handle result updates when switching views
	useEffect(() => {
		if (isViewingResult && dataKetQua && rowData.length > 0) {
			const result = dataKetQua.map((sourceItem) => {
				const inputItem = rowData.find(item => item.name === sourceItem.name);
				const row = { name: sourceItem.name };
				for (let i = 1; i <= 12; i++) {
					const val1 = Number(sourceItem[`t${i}`] || 0);
					const val2 = Number(inputItem?.[`t${i}`] || 0);
					row[`t${i}`] = val1 * val2 / 100;
				}
				return row;
			});
			setResultData(result);
		}
	}, [isViewingResult, dataKetQua, rowData]);

	const columnDefs = [
		{
			headerName: 'Chỉ tiêu',
			field: 'name',
			pinned: 'left',
			width: 460,
			editable: false,
		},
		...Array.from({ length: 12 }, (_, i) => ({
			headerName: `Tháng ${i + 1}`,
			field: `t${i + 1}`,
			width: 130,
			editable: true,
			valueFormatter: (params) => formatMoney(params.value) + '%',
			cellStyle: { textAlign: 'right' },
			headerClass: 'ag-right-aligned-header',
		})),
	];


	const columnDefsRS = [
		{
			headerName: 'Chỉ tiêu',
			field: 'name',
			pinned: 'left',
			width: 460,
			editable: false,
		},
		...Array.from({ length: 12 }, (_, i) => ({
			headerName: `Tháng ${i + 1}`,
			field: `t${i + 1}`,
			width: 130,
			editable: false,
			valueFormatter: (params) => formatMoney(params.value),
			cellStyle: { textAlign: 'right' },
			headerClass: 'ag-right-aligned-header',
		})),
	];


	const handleCellValueChanged = async (params) => {
		const allData = [];
		gridRef.current.api.forEachNode((node) => {
			allData.push(node.data);
		});
		setUpdateData([...updateData, params.data]);
	};

	const handleSave = async () => {
		try {
			const allData = [];
			gridRef.current.api.forEachNode((node) => {
				allData.push(node.data);
			});
			const updated = { ...khkdTH, settingDongTien: allData };
			await updateKHKDTongHop(updated);
			fetchKHTH();
			setOriginalData(JSON.parse(JSON.stringify(allData)));
			setUpdateData([]);
		} catch (err) {
			console.error('Lỗi khi lưu:', err);
		}
	};

	const handleViewResult = () => {
		const inputData = [];
		gridRef.current.api.forEachNode((node) => {
			inputData.push(node.data);
		});

		const result = (dataKetQua|| []).map((sourceItem) => {
			const inputItem = inputData.find(item => item.name === sourceItem.name);
			const row = { name: sourceItem.name };
			for (let i = 1; i <= 12; i++) {
				const val1 = Number(sourceItem[`t${i}`] || 0);
				const val2 = Number(inputItem?.[`t${i}`] || 0);
				row[`t${i}`] = val1 * val2 / 100;
			}
			return row;
		});

		setResultData(result);
		setIsViewingResult(true);
	};

	const [visible, setVisible] = useState(false);

	const handleClearValue = async () => {
		await updateKHKDTongHop({
			id: idHopKH,
			settingDongTien: [],
		});
		setVisible(false);
		await fetchKHTH()
	};


	const handleBackToInput = () => {
		setIsViewingResult(false);
	};

	const isDataChanged = JSON.stringify(rowData) !== JSON.stringify(originalData);

	return (
		<div style={{ marginBottom: 40 }}>
			{/* Bảng nhập liệu */}
			{!isViewingResult && (
				<>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: 16,
					}}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 16 }}>
							<h3>DÒNG TIỀN TỪ HOẠT ĐỘNG KINH DOANH</h3>
							<ActionSave handleSaveData={handleSave} updateData={updateData} />
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 10 }}>
							<Popconfirm
								title='Bạn có chắc muốn nhập lại không?'
								open={visible}
								onConfirm={handleClearValue}
								onCancel={() => setVisible(false)}
								okText='Đồng ý'
								cancelText='Hủy'
							>
								<Button onClick={() => setVisible(true)}>Nhập liệu</Button>
							</Popconfirm>
							<Button type='primary' onClick={handleViewResult}>Xem kết quả</Button>
						</div>
					</div>

					<div className='ag-theme-quartz' style={{ width: '100%' }}>
						<AgGridReact
							domLayout="autoHeight"
							ref={gridRef}
							localeText={AG_GRID_LOCALE_VN}
							rowData={rowData}
							columnDefs={columnDefs}
							defaultColDef={{
								resizable: true,
								sortable: true,
							}}
							enableRangeSelection={true}
							onCellValueChanged={handleCellValueChanged}
						/>
					</div>
				</>
			)}

			{/* Bảng kết quả */}
			{isViewingResult && (
				<>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: 16,
					}}>
						<h3 style={{ marginBottom: 16 }}>DÒNG TIỀN TỪ HOẠT ĐỘNG KINH DOANH</h3>
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
							<Button onClick={handleBackToInput}>Nhập liệu</Button>
						</div>
					</div>

					<div className='ag-theme-quartz' style={{ width: '100%' }}>
						<AgGridReact
							domLayout="autoHeight"
							localeText={AG_GRID_LOCALE_VN}
							rowData={resultData}
							columnDefs={columnDefsRS}
							defaultColDef={{
								resizable: true,
								sortable: true,
							}}
							enableRangeSelection={true}
						/>
					</div>
				</>
			)}
		</div>
	);
}

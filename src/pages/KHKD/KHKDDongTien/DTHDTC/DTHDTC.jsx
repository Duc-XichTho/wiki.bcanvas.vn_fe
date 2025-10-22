
import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import AG_GRID_LOCALE_VN from '../../../../pages/Home/AgridTable/locale.jsx';
import { formatMoney } from '../../../../generalFunction/format.js';
import { updateKHKDTongHop } from '../../../../apis/khkdTongHopService.jsx';
import ActionSave from '../../../Home/AgridTable/actionButton/ActionSave.jsx';
import { toast } from 'react-toastify';
import ActionCreate from '../../../Home/AgridTable/actionButton/ActionCreate.jsx';
import { v4 as uuidv4 } from 'uuid';

export default function DTHDTC({ khkdTH, setKhkdTH, fetchKHTH }) {
	const [rowData, setRowData] = useState([]);
	const [updateData, setUpdateData] = useState([]);

	useEffect(() => {
		setRowData(khkdTH?.settingDongTienTC || []);
		setUpdateData([])
	}, [khkdTH]);

	const columnDefs = [
		{
			headerName: 'Mô tả',
			field: 'moTa',
			width: 460,
			pinned: 'left',
			editable: true,
		},
		...Array.from({ length: 12 }, (_, i) => ({
			headerName: `Tháng ${i + 1}`,
			field: `t${i + 1}`,
			editable: true,
			valueFormatter: (params) => formatMoney(params.value),
			cellStyle: { textAlign: 'right' },
			headerClass: 'ag-right-aligned-header',
			width: 130,
		})),
	];

	// Xử lý khi dữ liệu thay đổi
	const onCellValueChanged = async (params) => {
		const updatedData = rowData.map(item =>
			item.id === params.data.id ? params.data : item,
		);
		setUpdateData([...updateData, params.data]);
		// setKhkdTH({
		// 	...khkdTH,
		// 	settingDongTienTC: updatedData,
		// });
	};

	const handleSaveData = async () => {
		try {
			await updateKHKDTongHop({ id: khkdTH.id, settingDongTienTC: rowData });
			toast.success('Cập nhật thành công', { autoClose: 1000 });
			setUpdateData([]);
			fetchKHTH()
		} catch (error) {
			console.error('Lỗi khi cập nhật dữ liệu', error);
		}
	};

	const handleAddNew = async () => {
		try {
			const newRecord = {
				id: uuidv4(),
				moTa: '',
				...Array.from({ length: 12 }).reduce((acc, _, i) => {
					acc[`t${i + 1}`] = 0;
					return acc;
				}, {}),
			};

			const updatedKhkdTH = {
				...khkdTH,
				settingDongTienTC: [newRecord, ...rowData],
			};
			setKhkdTH(updatedKhkdTH);

			await updateKHKDTongHop(updatedKhkdTH);
		} catch (error) {
			console.error('Lỗi khi thêm mới:', error);
		}
	};

	return (
		<div style={{ marginBottom: 40 }}>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
				<h3>DÒNG TIỀN TỪ HOẠT ĐỘNG TÀI CHÍNH</h3>
				<div  style={{ display: 'flex', alignItems: 'center', gap : '10px', marginRight: 10 }}>
					<ActionCreate handleAddRow={handleAddNew}/>
					<ActionSave handleSaveData={handleSaveData} updateData={updateData} />
				</div>
			</div>


			<div className='ag-theme-quartz' style={{width: '100%' }}>
				<AgGridReact
					domLayout="autoHeight"
					enableRangeSelection={true}
					statusBar={{
						statusPanels: [{ statusPanel: 'agAggregationComponent' }],
					}}
					localeText={AG_GRID_LOCALE_VN}
					rowData={rowData}
					columnDefs={columnDefs}
					headerHeight={40}
					rowHeight={35}
					onCellValueChanged={onCellValueChanged}
					defaultColDef={{
						resizable: true,
						sortable: true,
					}}
				/>
			</div>
		</div>
	);
}

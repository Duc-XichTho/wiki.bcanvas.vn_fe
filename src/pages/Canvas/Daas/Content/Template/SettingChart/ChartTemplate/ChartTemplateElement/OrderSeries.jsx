import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, message, Modal } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { getAllChartTemplate, updateChartTemplate } from '../../../../../../../../apis/chartTemplateService.jsx';

export function OrderSeries({
								selectedItem,
								showSettingsChartPopup,
								setShowSettingsChartPopup,
								listXOrder,
								setOrders,
								setListXOrder,
								listCol
							}) {
	const [rowData, setRowData] = useState([]);
	const gridRef = useRef();
	useEffect(() => {
		if (selectedItem?.info?.listOrder?.length) {
			setRowData(selectedItem.info.listOrder);
		} else {
			const initialData = listXOrder.map((name, index) => ({
				name,
				position: index + 1,
			}));
			setRowData(initialData);
		}
	}, [listXOrder, selectedItem]);


	const positionOptions = useMemo(() => {
		return listXOrder.map((_, index) => `${index + 1}`);
	}, [listXOrder]);

	const columnDefs = useMemo(() => [
		{ field: 'name', headerName: 'Tên', sortable: false, editable: false, flex: 1 },
		{
			field: 'position',
			headerName: 'Vị trí',
			editable: true,
			width: 120,
		},
	], [positionOptions]);

	const handleReset = () => {
		const resetData = listCol.map((name) => ({
			name,
			position: 0, // Xoá số thứ tự
		}));
		setRowData(resetData);
	};

	const handleOK = async () => {
		const sortedData = [...(rowData)].sort((a, b) => a.position - b.position);
		try {
			if (sortedData.length === 0) {
				message.error('Không có dữ liệu để lưu');
				return;
			}
			setOrders(sortedData);
			setShowSettingsChartPopup(false);
			const newData = {
				id: selectedItem.id,
				info: {
					...(selectedItem.info || {}),
					listOrder: sortedData,
				},
			};
			let update = await updateChartTemplate(newData);
			update = update.data
			setListXOrder(update.info?.listOrder ? update.info.listOrder.map(item => item.name) : []);
			setOrders(update.info?.listOrder || []);
			message.success('Đã lưu thứ tự thành công');
		} catch (error) {
			console.error('Lỗi khi cập nhật template:', error);
			message.error('Lỗi khi lưu: ' + error.message);
		}
	};

	return (
		<Modal
			open={showSettingsChartPopup}
			onCancel={() => setShowSettingsChartPopup(false)}
			onOk={handleOK}
			width={600}
			title="Sắp xếp X Key"
			styles={{
				body: {
					padding: 0,
					margin: 0,
					height: '70vh',
					overflow: 'hidden',
				},
			}}
			footer={[
				<Button key="reset" onClick={handleReset}>
					Reset
				</Button>,
				<Button key="cancel" onClick={() => setShowSettingsChartPopup(false)}>
					Huỷ
				</Button>,
				<Button key="ok" type="primary" onClick={handleOK}>
					Lưu
				</Button>,
			]}
		>
			<div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
				{listCol.length !== listXOrder.length &&
					<div style={{color: "red", marginBottom: '10px'}}><p>*Số lượng cột hiện tại và đã sắp xếp trước đó không khớp.</p><p> Ấn Reset để điền lại thứ tự cột!!!</p></div>}
				<AgGridReact
					ref={gridRef}
					rowData={rowData}
					columnDefs={columnDefs}
					defaultColDef={{
						resizable: true,
					}}
					stopEditingWhenCellsLoseFocus={true}
					suppressRowClickSelection={true}
					rowSelection="single"
				/>
			</div>
		</Modal>
	);
}

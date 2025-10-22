import { Button, message, Modal, Popconfirm } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { getChartTemplateDataById } from '../../../../apis/chartTemplateService';
import React, { useState, useEffect } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { deleteTemplateCol } from '../../../../apis/templateSettingService.jsx';
import { deleteFileNotePad } from '../../../../apis/fileNotePadService.jsx';

export default function CheckDuplicate({ isShowModalDuplicate, setIsShowModalDuplicate, fileNotes, fetchFileNotes }) {
	const [rowData, setRowData] = useState([]);const fetchChartTemplates = async () => {
		let fileNotes2 = fileNotes.filter(e => e.table && e.type);
		const seen = new Map();
		const seenDuplicateKeys = new Set();
		const duplicates = [];

		for (const item of fileNotes2) {
			const key = `${item.type}_${item.table}`;
			if (seen.has(key)) {
				if (!seenDuplicateKeys.has(key)) {
					duplicates.push(seen.get(key)); // lần đầu duplicate
					seenDuplicateKeys.add(key);
				}
				duplicates.push(item); // bản duplicate mới
			} else {
				seen.set(key, item);
			}
		}

		try {
			const updatedFileNotes = await Promise.all(
				duplicates.map(async (note) => {
					try {
						const chartTemplateId = note.type || '';
						const chartTemplate = await getChartTemplateDataById(chartTemplateId);
						const chartTemplateName = chartTemplate.name || '';
						return {
							...note,
							chartTemplateName,
						};
					} catch (error) {
						console.error('Error fetching chart template for ID:', note.type, error);
						return {
							...note,
							chartTemplateName: 'Error',
						};
					}
				}),
			);
			setRowData(updatedFileNotes);
		} catch (error) {
			setRowData(fileNotes);
		}
	};

	useEffect(() => {
		fetchChartTemplates();
	}, [fileNotes]);

	// Define column definitions for ag-Grid
	const columnDefs = [
		{ headerName: 'ID', field: 'id', sortable: true, filter: true , width: 100},
		{
			headerName: 'Data gốc',
			field: 'type',
			sortable: true,
			filter: true,
			valueGetter: (params) => {
				const chartTemplateId = params.data.type || null;
				if (!chartTemplateId) {
					return ''; // Return an empty string if chartTemplateId is null
				}
				const chartTemplateName = params.data.chartTemplateName || '';
				return `ID: ${chartTemplateId} - ${chartTemplateName}`; // Use pre-fetched name
			},
		},
		{ headerName: 'Loại', field: 'table', sortable: true, filter: true },
		{ headerName: 'Tên', field: 'name', sortable: true, filter: true },
		{
			headerName: 'Thư mục',
			field: 'tab',
			sortable: true,
			filter: true,
			valueGetter: (params) => {
				const tabValue = params.data.tab || '';
				return tabValue.split('-')[0];
			},
		},
		{
			headerName: '',
			field: 'delete',
			width: 40,
			pinned:'left',
			cellRenderer: (params) => (
				<div style={{ display: 'flex', gap: '8px' }}>
					<Popconfirm
						title="Xác nhận xoá"
						description="Bạn có chắc chắn muốn xoá nhân viên này?"
						onConfirm={() => handleDeleteRecord(params.data)}
						okText="Xoá"
						cancelText="Huỷ"
					>
						<Button
							icon={<DeleteOutlined />}
							type="text"
							danger
						/>
					</Popconfirm>
				</div>
			),

		},
	];

	async function handleDeleteRecord(data) {
        try {
            await deleteFileNotePad(data?.id);
            message.success(`xóa thành công bảng ${data?.name}`);
            await fetchChartTemplates();
			await fetchFileNotes()
        } catch (error) {
            console.log(error);
            message.error('Có lỗi xảy ra khi xóa bảng');
        }
    }

	return (
		<>
			<Modal
				title={'Check Duplicate'}
				open={isShowModalDuplicate}
				onCancel={() => {
					setIsShowModalDuplicate(false);
				}}
				width={1000}
				centered
			>
				{/* ag-Grid Table */}
				<div className="ag-theme-quartz" style={{ height: 400, width: '100%' }}>
					<AgGridReact
						rowData={rowData} // Use transformed row data
						columnDefs={columnDefs} // Pass the column definitions
						rowSelection="single" // Enable single row selection
					/>
				</div>
			</Modal>
		</>
	);
}

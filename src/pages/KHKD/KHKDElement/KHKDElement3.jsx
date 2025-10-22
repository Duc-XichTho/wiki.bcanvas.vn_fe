import React, { useEffect, useState } from 'react';
import { Button, Switch, Modal, Form, Input, Select } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { convertKHKDElementData, applyConvertedDataBack } from './logicKHKDElementData.js';
import ActionCreate from '../../Home/AgridTable/actionButton/ActionCreate.jsx';
import ActionSave from '../../Home/AgridTable/actionButton/ActionSave.jsx';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import { formatMoney } from '../../../generalFunction/format.js';
import { updateKHKDElement, deleteKHKDElement } from '../../../apis/khkdElementService.jsx';
import KHKDElementImportExportDropdown from './KHKDElementImportExportDropdown.jsx';
import { message } from 'antd';
import KHKDElement3Modal from './KHKDElement3Modal.jsx';
import { getSettingByType } from '../../../apis/settingService.jsx';
import { getTemplateRow } from '../../../apis/templateSettingService.jsx';
import css from '../../Home/AgridTable/DanhMuc/KeToanQuanTri.module.css';
import { log } from 'mathjs';

export default function KHKDElement3({ data, fetchKHTH, onImport }) {
	const [rowData, setRowData] = useState([]);
	const [originalData, setOriginalData] = useState([]);
	const [updateData, setUpdateData] = useState([]);
	const gridRef = React.useRef();
	const [isEditModalVisible, setIsEditModalVisible] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [formData, setFormData] = useState({
		name: '',
		boPhan: '',
		labelSoLuong: '',
		data: [],
		theoDoi: true,
		isSum: true,
	});
	const [boPhanOptions, setBoPhanOptions] = useState([]);
	const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
	const [createForm] = Form.useForm();

	useEffect(() => {
		setOriginalData(data);
		setRowData(convertKHKDElementData(data));
	}, [data]);

	useEffect(() => {
		const fetchBoPhanOptions = async () => {
			if (boPhanOptions.length === 0) {
				try {
					const settings = await getSettingByType('KHKD');
					const boPhan = settings?.setting?.boPhan;
					if (boPhan?.templateId && boPhan?.columnName) {
						const boPhanDataResponse = await getTemplateRow(boPhan.templateId);
						const boPhanData = boPhanDataResponse.rows || [];
						const filteredBoPhan = boPhanData.map(row => row.data[boPhan.columnName]);
						setBoPhanOptions(filteredBoPhan);
					}
				} catch (e) { /* ignore */ }
			}
		};

		fetchBoPhanOptions();
	}, []);

	const columnDefs = [
		// { headerName: 'Tên', field: 'name', editable: false, pinned: 'left', width: 220 },
		{ headerName: 'Chỉ số', field: 'labelSoLuong', editable: true, pinned: 'left', width: 331 },
		{ headerName: 'Bộ phận', field: 'boPhan', editable: false, pinned: 'left', width: 390 },
		// { headerName: 'Chỉ số', field: 'labelSoLuong', editable: true, width: 200 },
		...Array.from({ length: 12 }, (_, i) => ({
			headerName: `Tháng ${i + 1}`,
			field: `T${i + 1}`,
			editable: true,
			valueFormatter: (params) => formatMoney(params.value),
			cellStyle: { textAlign: 'right' },
			headerClass: 'ag-right-aligned-header',
			width: 130,
		})),
		// {
		// 	headerName: 'SUM/AVG',
		// 	field: 'isSum',
		// 	pinned: 'right',
		// 	headerClass: 'center-align-important',
		// 	width: 90,
		// 	cellRenderer: (params) => {
		//
		// 			return (
		// 				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
		// 					<Switch
		// 						checked={params.value}
		// 						checkedChildren='SUM'
		// 						unCheckedChildren='AVG'
		// 						onChange={async (checked) => {
		// 							await updateKHKDElement(params.data.id, { ...params.data, isSum: checked });
		// 							await fetchKHTH();
		// 						}}
		// 						size='small'
		// 					/>
		// 				</div>
		// 			);
		//
		// 		return '';
		// 	},
		// 	editable: false,
		// },
		{
			headerName: 'Track',
			field: 'theoDoi',
			width: 50,
			pinned: 'right',
			cellRenderer: (params) => {
				return (
					<div style={{
						display: 'flex',
						justifyContent: 'center',
						height: '35px',
					}}>
						<input
							type="checkbox"
							checked={params.data.theoDoi}
							onChange={(e) => handleTheoDoiChange(params.data.id, e.target.checked)}
						/>
					</div>
				);
			},
		},
		{
			headerName: 'Thao tác',
			field: 'actions',
			pinned: 'right',
			width: 100,
			cellRenderer: (params) => (
				<div style={{ display: 'flex', gap: '5px', height: '35px' }}>
					<Button
						style={{ display: 'flex', height: '35px' }}
						type="text"
						size="small"
						onClick={() => handleEdit(params.data)}
					>
						Sửa
					</Button>
					<Button
						style={{ display: 'flex', height: '35px' }}
						type="text"
						size="small"
						danger
						onClick={() => handleDelete(params.data.id)}
					>
						Xóa
					</Button>
				</div>
			),
		},
	];

	const onCellValueChanged = (params) => {

		setUpdateData(prev => {
			const others = prev.filter(item => item.id !== params.data.id);
			return [...others, params.data];
		});
	};

	const handleTheoDoiChange = async (id, checked) => {
		try {
			await updateKHKDElement(id, { theoDoi: checked });

			setRowData(prev =>
				prev.map(row =>
					row.id === id ? { ...row, theoDoi: checked } : row
				)
			);
		} catch (error) {
			console.error('Lỗi khi cập nhật trạng thái theo dõi:', error);
			message.error('Có lỗi xảy ra khi cập nhật trạng thái theo dõi');
		}
	};


	const handleSave = async () => {
		const updatedOriginal = applyConvertedDataBack(originalData, rowData);
		try {
			for (const item of updatedOriginal) {
				await updateKHKDElement(item.id, { id: item.id, ...item });
			}
			toast.success('Cập nhật thành công!');
			setUpdateData([])
			// fetchKHTH?.();
		} catch (error) {
			console.error('Lỗi khi lưu:', error);
			toast.error('Có lỗi khi lưu!');
		}
	};

	const handleAdd = () => {
		const newRow = {
			id: uuidv4(),
			name: 'KH mới',
			boPhan: '',
			labelSoLuong: '',
			...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`T${i + 1}`, 0])),
		};
		setRowData([newRow, ...rowData]);
	};

	const handleEdit = async (item) => {
		setEditingItem(item);
		setFormData({
			name: item.name,
			boPhan: item.boPhan,
			labelSoLuong: item.labelSoLuong,
			data: item.data || [],
			theoDoi: item.theoDoi,
		});
		setIsEditModalVisible(true);
	};

	const handleDelete = async (id) => {
		try {
			await deleteKHKDElement(id);
			setRowData(prev => prev.filter(row => row.id !== id));
			toast.success('Xóa thành công!');
		} catch (error) {
			toast.error('Lỗi khi xóa!');
			console.error(error);
		}
	};

	const handleEditInputChange = (field, value) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleEditSave = async () => {
		try {
			await updateKHKDElement(editingItem.id, { ...editingItem, ...formData });
			setRowData(prev => prev.map(row => row.id === editingItem.id ? { ...row, ...formData } : row));
			setIsEditModalVisible(false);
			toast.success('Cập nhật thành công!');
		} catch (error) {
			toast.error('Lỗi khi cập nhật!');
			console.error(error);
		}
	};

	const handleEditModalClose = () => {
		setIsEditModalVisible(false);
		setEditingItem(null);
	};

	const handleCreate = () => {
		setIsCreateModalVisible(true);
	};

	const handleCreateSave = async () => {
		try {
			const values = await createForm.validateFields();
			const newRow = {
				id: uuidv4(),
				name: values.name,
				boPhan: values.boPhan,
				labelSoLuong: values.labelSoLuong,
				...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`T${i + 1}`, 0])),
			};
			setRowData([newRow, ...rowData]);
			setIsCreateModalVisible(false);
			createForm.resetFields();
			toast.success('Tạo mới thành công!');
		} catch (error) {
			console.error('Lỗi khi tạo mới:', error);
		}
	};

	const handleCreateModalClose = () => {
		setIsCreateModalVisible(false);
		createForm.resetFields();
	};

	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
				<h3>
					{/* DỮ LIỆU KẾ HOẠCH KINH DOANH (SỐ LƯỢNG) */}
				</h3>
				<div style={{ display: 'flex', gap: 10 }}>

					<Button onClick={handleCreate}
					
						style={{
						border:'none'
						}}
					>
						<span>Thêm mục</span>
					</Button>
					<ActionSave handleSaveData={handleSave} updateData={updateData} />
					<KHKDElementImportExportDropdown
						onImportSuccess={(importedRows) => {
							if (onImport) {
								onImport(importedRows);
							} else {
								setRowData(prev => [...importedRows, ...prev]);
							}
							toast.success('Import thành công!');
						}}
					/>
				</div>
			</div>

			<div className="ag-theme-quartz" style={{ width: '100%' }}>
				<AgGridReact
					domLayout="autoHeight"
					rowData={rowData}
					columnDefs={columnDefs}
					localeText={AG_GRID_LOCALE_VN}
					onCellValueChanged={onCellValueChanged}
					defaultColDef={{ resizable: true, sortable: true, suppressHeaderMenuButton: true }}
					enableRangeSelection={true}
					statusBar={{
						statusPanels: [{ statusPanel: 'agAggregationComponent' }],
					}}
				/>
				{isEditModalVisible && (
					<KHKDElement3Modal
						isVisible={isEditModalVisible}
						onClose={handleEditModalClose}
						onSave={handleEditSave}
						formData={formData}
						onInputChange={handleEditInputChange}
						isEditing={!!editingItem}
						boPhanOptions={boPhanOptions}
					/>
				)}
				<Modal
					title="Tạo mới dữ liệu"
					visible={isCreateModalVisible}
					onOk={handleCreateSave}
					onCancel={handleCreateModalClose}
					okText="Lưu"
					cancelText="Hủy"
				>
					<Form form={createForm} layout="vertical">
						{/* <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
							<Input />
						</Form.Item> */}
						<Form.Item name="boPhan" label="Bộ phận" rules={[{ required: true, message: 'Vui lòng chọn bộ phận' }]}>
							<Select options={boPhanOptions.map(bp => ({ label: bp, value: bp }))} />
						</Form.Item>
						<Form.Item name="labelSoLuong" label="Chỉ số" rules={[{ required: true, message: 'Vui lòng nhập chỉ số' }]}>
							<Input />
						</Form.Item>
					</Form>
				</Modal>
			</div>
		</div>
	);
}

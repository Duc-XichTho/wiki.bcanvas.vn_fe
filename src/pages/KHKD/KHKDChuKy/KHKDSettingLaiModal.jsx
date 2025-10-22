import React, { useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button, message, Modal, Popover, Select } from 'antd';
import css from './KHKDChuKy.module.css';
import { formatMoney } from '../../../generalFunction/format.js';
import { updateKHKDElement } from '../../../apis/khkdElementService.jsx';
import ActionSave from '../../Home/AgridTable/actionButton/ActionSave.jsx';
import { updateSetting } from '../../../apis/settingService.jsx';
import LoadingAll from '../../../components/LoadingAll.jsx';
import { CloseOutlined } from '@ant-design/icons';
import { ICON_CHU_GIAI } from '../../../icon/svg/IconSvg.jsx';

const KHKDSettingLaiModal = ({ fetchKHTH, dataTT, isVisible, onClose }) => {
	const [rowData, setRowData] = useState([]);
	const [selectedMonth, setSelectedMonth] = useState(null);
	const [columnDefs, setColumnDefs] = useState(null);
	const [loading, setLoading] = useState(false);
	const [showCloseWarning, setShowCloseWarning] = useState(false);

	useEffect(() => {
		setLoading(true);
		if (rowData.length > 0 && columnDefs.length > 0) {
			setTimeout(() => {
				setLoading(false);
			}, 100);
		}

	}, [rowData, columnDefs]);

	function extractFields(data, fields) {
		if (!Array.isArray(data)) return [];

		return data.map(item => {
			const result = {};
			fields.forEach(field => {
				result[field] = item[field];
			});
			for (let month = 1; month <= 12; month++) {
				const monthKey = `t${month}`;
				result[monthKey] = item.lai?.[monthKey] || 0;
			}

			result.id = item.id;
			return result;
		});
	}

	useEffect(() => {
		const data = extractFields(dataTT, [
			'id',
			'name',
			'phanLoai',
			'khoanMuc',
			'boPhan',
			'labelSoLuong',
		]);

		setRowData(data);
	}, [dataTT]);

	useEffect(() => {
		getColumnDefs();
	}, [selectedMonth]);

	const getColumnDefs = () => {
		const columns = [
			{
				headerName: 'Tên',
				field: 'name',
				width: 200,
				pinned: 'left',
				editable: true,
			},
			{
				headerName: 'Khoản mục',
				field: 'khoanMuc',
				width: 200,
				pinned: 'left',
				editable: true,
			},
			{
				headerName: 'Bộ phận',
				field: 'boPhan',
				width: 200,
				pinned: 'left',
				editable: true,
			},
		];

		for (let month = 1; month <= 12; month++) {
			columns.push({
				headerName: `Tháng ${month}`,
				field: `t${month}`,
				editable: true,
				valueFormatter: (params) => formatMoney(params.value),
				cellStyle: { textAlign: 'right' },
				headerClass: 'ag-right-aligned-header',
				width: 150,
			});
		}
		setColumnDefs(columns);
	};

	const [updatedRows, setUpdatedRows] = useState([]);

	const handleCellValueChanged = (params) => {
		const { colDef, newValue, data } = params;
		const field = colDef.field;
		const id = data.id;

		if (field.startsWith('t')) {
			setUpdatedRows(prev => {
				const existing = prev.find(row => row.id === id);
				let updatedLai = {};

				if (existing) {
					// Nếu đã có trong updatedRows, lấy giá trị hiện tại
					updatedLai = { ...existing.lai };
				} else {
					// Nếu chưa có, lấy từ dataTT hoặc khởi tạo mới
					const originalItem = dataTT.find(item => item.id === id);
					updatedLai = { ...(originalItem?.lai || {}) };

					// Đảm bảo có đủ 12 tháng
					for (let month = 1; month <= 12; month++) {
						const monthKey = `t${month}`;
						if (updatedLai[monthKey] === undefined) {
							updatedLai[monthKey] = 0;
						}
					}
				}

				// Cập nhật giá trị cho tháng được thay đổi
				updatedLai[field] = newValue;

				const updatedRow = {
					id,
					lai: updatedLai, // Giữ nguyên tất cả các tháng khác
				};

				const newList = prev.filter(row => row.id !== id); // Xóa bản ghi cũ nếu có
				newList.push(updatedRow); // Thêm bản ghi mới

				return newList;
			});
		}
	};

	const handleSaveData = async () => {
		if (updatedRows.length > 0) {
			const promises = updatedRows.map((row) => {
				return updateKHKDElement(row.id, row);
			});
			await Promise.all(promises);
			await fetchKHTH();
			setLoading(!loading);
			setUpdatedRows([]);
			setShowCloseWarning(false);
		}
	};


	const titleContent = (
		<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>

			<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
				<span style={{ fontSize: '20px' }}>Cài đặt ước tính tỷ lệ lãi trực tiếp</span>
			</div>
			<div>
				{updatedRows.length > 0 &&
					<ActionSave handleSaveData={handleSaveData} updateData={updatedRows} />}

			</div>
		</div>
	);


	const handleSaveAndClose = async () => {
		await handleSaveData();
		setShowCloseWarning(false);
		onClose();
	};

	const handleIgnoreChanges = () => {
		setShowCloseWarning(false);
		onClose();
	};

	const closeWarningContent = (
		<div style={{ maxWidth: 200 }}>
			<p style={{ marginBottom: 8 }}>Bạn có dữ liệu chưa lưu!</p>
			<div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
				<Button size="small" type="primary" onClick={handleSaveAndClose}>
					Lưu & Đóng
				</Button>
				<Button size="small" danger onClick={handleIgnoreChanges}>
					Bỏ qua
				</Button>
			</div>
		</div>
	);


	return (
		<Modal
			title={titleContent}
			visible={isVisible}
			onCancel={() => {
				if (updatedRows.length > 0) {
					setShowCloseWarning(true);
				} else {
					onClose();
				}
			}} footer={null}
			centered={true}
			width={'80vw'}
			style={{ top: 20 }}
			getContainer={() => document.body}
			closeIcon={
				<Popover
					content={closeWarningContent}
					visible={showCloseWarning}
					placement="topRight"
					trigger="click"
				>
					<CloseOutlined
						onClick={(e) => {
							e.stopPropagation();
							if (updatedRows.length > 0) {
								setShowCloseWarning(true);
							} else {
								onClose();
							}
						}}
						style={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.45)', cursor: 'pointer' }}
					/>
				</Popover>
			}
		>
			<div className={'chuGiai'}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				justifyContent: 'flex-start'
			}}
			>
				<span style={{ width: 20, height: 30, display: 'inline-flex', flex: '0 0 30px', alignItems: 'center', justifyContent: 'center' }}>
					<ICON_CHU_GIAI width={20} height={20} />
				</span>
				<div>
					<p>
						Đưa vào ước tính tỷ lệ lãi của từng mục, sau khi trừ đi các chi phí trực tiếp, ví dụ như giá vốn
						trực tiếp, thưởng trực tiếp, chi phí vận chuyển hàng...
					</p>
				</div>
			</div>
			<div style={{ height: '55vh', overflow: 'auto'}}>
				{
					loading ? <LoadingAll />
						:
						<div className="ag-theme-quartz" style={{ width: '100%', height: '30vh' }}>
							<AgGridReact
								onCellValueChanged={(params) => handleCellValueChanged(params)}
								rowData={rowData}
								columnDefs={columnDefs}
								defaultColDef={{
									resizable: true,
									sortable: true,
									filter: true,
								}}
								enableRangeSelection={true}
								statusBar={{
									statusPanels: [{ statusPanel: 'agAggregationComponent' }],
								}}
								domLayout="autoHeight"
							/>
						</div>
				}

			</div>

		</Modal>
	);
};

export default KHKDSettingLaiModal;

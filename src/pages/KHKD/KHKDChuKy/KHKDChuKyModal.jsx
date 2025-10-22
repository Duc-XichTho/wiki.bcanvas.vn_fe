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

const KHKDChuKyModal = ({ fetchKHTH, dataTT, isVisible, onClose }) => {
	const [rowData, setRowData] = useState([]);
	const [selectedMonth, setSelectedMonth] = useState(null);
	const [columnDefs, setColumnDefs] = useState(null);
	const [loading, setLoading] = useState(false);
	const [showCloseWarning, setShowCloseWarning] = useState(false);

	useEffect(() => {
		setLoading(true);

		if (rowData.length > 0 && columnDefs.length > 0 && selectedMonth) {
			setTimeout(() => {
				setLoading(false);
			}, 100);
		}

	}, [rowData, columnDefs, selectedMonth]);

	function extractFields(data, fields, selectedMonth) {
		if (!Array.isArray(data)) return [];

		return data.map(item => {
			const result = {};

			fields.forEach(field => {
				result[field] = item[field];
			});

			const chuKy = item.chuKy?.find(ck => ck.month == selectedMonth);
			for (let i = 1; i <= 31; i++) {
				const key = `day_${i}`;
				result[key] = chuKy?.[key] ?? 0;
			}

			result.id = item.id;
			result.month = selectedMonth;

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
		], selectedMonth);

		setRowData(data);
	}, [dataTT, selectedMonth]);

	useEffect(() => {
		getColumnDefs();
	}, [selectedMonth]);

	const getColumnDefs = () => {
		const jsonData = logYearDataAsJson();
		const dataTime = generateRowDataFromJson(jsonData);
		const columns = [
			// { headerName: 'Month', field: 'month', pinned: 'left', editable: false },
			{
				headerName: 'Tên mục',
				field: 'name',
				width: 200,
				pinned: 'left',
				editable: true,
			},
			{
				headerName: 'Khoản mục KQKD',
				field: 'khoanMuc',
				width: 200,
				pinned: 'left',
				editable: true,
			},
			{
				headerName: 'Bộ phận / Đơn vị',
				field: 'boPhan',
				width: 200,
				pinned: 'left',
				editable: true,
			},
		];

		const monthData = dataTime.find(item => item.month == `Tháng ${selectedMonth}`);
		if (monthData) {
			for (let day = 1; day <= 31; day++) {
				const dayField = `day_${day}`;

				if (monthData.hasOwnProperty(dayField) && monthData[dayField] != '') {
					const dayLabel = monthData[`day_${day}`];
					const isWeekend = dayLabel === 'Thứ Bảy' || dayLabel === 'Chủ Nhật';

					columns.push({
						headerName: `${day}/${selectedMonth} (${dayLabel})`,
						field: dayField,
						editable: true,
						valueFormatter: (params) => formatMoney(params.value),
						cellStyle: (params) => ({
							textAlign: 'right',
							background: isWeekend ? '#d5d2d2' : '#fff',
						}),
						headerClass: isWeekend
							? 'ag-right-aligned-header weekend-header'
							: 'ag-right-aligned-header',
						width: 150,
					});
				}


			}
		}
		setColumnDefs(columns);
	};

	function generateRowDataFromJson(jsonData) {
		const dataTime = [];

		jsonData.forEach((monthData) => {
			const monthRow = { month: `Tháng ${monthData.month}` };

			for (let day = 1; day <= 31; day++) {
				monthRow[`day_${day}`] = monthData[day] || '';
			}

			dataTime.push(monthRow);

			// const editableRow = { month: `Tháng ${monthData.month}`, type: 'editable' };
			// for (let day = 1; day <= 31; day++) {
			// 	editableRow[`day_${day}`] = '';
			// }

			// rows.push(editableRow);
		});

		return dataTime;
	}

	function logYearDataAsJson() {
		const currentYear = new Date().getFullYear();
		const yearData = [];

		for (let month = 0; month < 12; month++) {
			const daysInMonth = new Date(currentYear, month + 1, 0).getDate();

			for (let day = 1; day <= daysInMonth; day++) {
				const date = new Date(currentYear, month, day);
				yearData.push({
					day: day,
					month: date.toLocaleString('vi-VN', { month: 'long' }),
					weekday: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
				});
			}
		}

		const grouped = {};

		yearData.forEach(({ day, month, weekday }) => {
			const monthNum = parseInt(month.replace('Tháng ', ''));
			if (!grouped[monthNum]) {
				grouped[monthNum] = { month: monthNum };
			}
			grouped[monthNum][day] = weekday;
		});

		return Object.values(grouped);
	}

	const [updatedRows, setUpdatedRows] = useState([]);


	const handleCellValueChanged = (params) => {
		const { colDef, newValue, data } = params;
		const field = colDef.field;
		const id = data.id;
		const month = selectedMonth;

		setUpdatedRows(prev => {
			const existing = prev.find(row => row.id === id);
			let updatedChuKys = [];

			if (existing) {
				updatedChuKys = [...(existing.chuKy || [])];
			} else {
				const originalItem = dataTT.find(item => item.id === id);
				updatedChuKys = [...(originalItem?.chuKy || [])];
			}

			const monthIndex = updatedChuKys.findIndex(ck => ck.month === month);

			if (monthIndex !== -1) {
				updatedChuKys[monthIndex] = {
					...updatedChuKys[monthIndex],
					[field]: newValue,
					month: month,
				};
			} else {
				const newMonthData = { month, [field]: newValue };
				for (let i = 1; i <= 31; i++) {
					const dayKey = `day_${i}`;
					if (dayKey !== field) newMonthData[dayKey] = 0;
				}
				updatedChuKys.push(newMonthData);
			}

			const updatedRow = { id, chuKy: updatedChuKys };

			const newList = [...prev];
			const rowIndex = newList.findIndex(row => row.id === id);

			if (rowIndex !== -1) {
				newList[rowIndex] = updatedRow;
			} else {
				newList.push(updatedRow);
			}

			return newList;
		});
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
	const [showMonthWarning, setShowMonthWarning] = useState(false);
	const [pendingMonth, setPendingMonth] = useState(null);

	const handleMonthSelect = (value) => {
		if (updatedRows.length > 0) {
			setPendingMonth(value); // lưu lại tháng muốn chọn
			setShowMonthWarning(true); // hiển thị cảnh báo
		} else {
			setSelectedMonth(value);
		}
	};

	const titleContent = (
		<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>

			<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
				<span style={{ fontSize: '20px' }}>Cài đặt chu kỳ</span>
				{!selectedMonth && (
					<span style={{ color: 'red' }}>Vui lòng chọn tháng!</span>
				)}
				<Popover
					content={
						<div>
							<div style={{ marginBottom: 5 }}>Bạn có dữ liệu chưa lưu!</div>
							<div style={{ display: 'flex', gap: 8 }}>
								<Button
									loading={loading}
									type="primary"
									size="small"
									onClick={async () => {
										setLoading(true);
										await handleSaveData();
										setSelectedMonth(pendingMonth);
										setShowMonthWarning(false);
									}}
								>
									Lưu & Chuyển
								</Button>
								<Button
									size="small"
									onClick={() => {
										setSelectedMonth(pendingMonth);
										setShowMonthWarning(false);
									}}
								>
									Bỏ qua
								</Button>
							</div>
						</div>
					}
					visible={showMonthWarning}
					trigger="click"
					placement="bottomLeft"
				>
					<Select
						value={selectedMonth}
						onChange={handleMonthSelect}
						style={{ width: 'max-content' }}
						placeholder="Vui lòng chọn tháng"
					>
						{Array.from({ length: 12 }, (_, i) => (
							<Option key={i + 1} value={i + 1}>
								Tháng {i + 1}
							</Option>
						))}
					</Select>
				</Popover>
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
			}}>
				<span style={{ width: 20, height: 30, display: 'inline-flex', flex: '0 0 30px', alignItems: 'center', justifyContent: 'center' }}>
					<ICON_CHU_GIAI width={20} height={20} />
				</span>
				<div>
				<p>
					Nhập giá trị tương đối để thể hiện trọng số doanh thu của từng ngày trong tháng, ví dụ: dựa theo
						thước đo 1-10.
				</p>
				<p>
					Nếu 1 ngày bán hàng được ghi nhận giá trị là 10, thì sẽ có doanh thu gấp đôi so với ngày được ghi
						nhận giá trị là 5.... Các giá trị này không cần phải có tổng là 100%
				</p>
				</div>
				
			</div>
			<div style={{ height: '55vh', overflow: 'auto' }}>
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

export default KHKDChuKyModal;

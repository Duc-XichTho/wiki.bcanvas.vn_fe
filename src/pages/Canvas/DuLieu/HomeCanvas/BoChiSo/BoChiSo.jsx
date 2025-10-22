import { AgGridReact } from 'ag-grid-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createNewDienGiai, getAllDienGiai, updateDienGiai } from '../../../../../apis/dienGiaiService.jsx';
import ActionSave from '../../../../Home/AgridTable/actionButton/ActionSave.jsx';
import ActionCreate from '../../../../Home/AgridTable/actionButton/ActionCreate.jsx';
import { createTimestamp } from '../../../../../generalFunction/format.js';
import { toast } from 'react-toastify';
import { getCurrentUserLogin } from '../../../../../apis/userService.jsx';
import { Button, Modal, Spin } from 'antd';
import PopupDeleteAgrid from '../../../../Home/popUpDelete/popUpDeleteAgrid.jsx';
import css from '../../../Daas/Content/Template/Template.module.css';
import style from './BoChiSo.module.css';

export default function BoChiSo() {
	const [rowData, setRowData] = useState([]);
	const [updateData, setUpdateData] = useState([]);
	const [currentUser, setCurrentUser] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [loading, setLoading] = useState(false);  // Loading state for the modal
	const [quantity, setQuantity] = useState(1);  // Quantity input state
	const table = 'DienGiai';
	const [isStatusFilter, setIsStatusFilter] = useState(false);
	const [colDefs, setColDefs] = useState([]);

	const handleChangeStatusFilter = () => {
		setIsStatusFilter((prev) => {
			return !prev;
		});
	};
	const defaultColDef = useMemo(() => ({
		editable: true,
		filter: true,
		suppressMenu: true,
		cellStyle: { fontSize: '14.5px' },
		wrapHeaderText: true,
		autoHeaderHeight: true,
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

	const getColumn = () => {
		setColDefs(
		  [
			  {
				  pinned: 'left',
				  width: '50',
				  field: 'delete',
				  suppressHeaderMenuButton: true,
				  cellStyle: {alignItems: "center", display: "flex"},
				  headerName: '',
				  editable: false,
				  cellRenderer: (params) => {
					  if (!params.data || !params.data.id) {
						  return null;
					  }
					  return (
						  <PopupDeleteAgrid
							  {...params.data}
							  id={params.data.id}
							  reload={fetchData}
							  table={table}
							  currentUser={currentUser}
						  />
					  );
				  },
			  },
			  { headerName: 'Mã chỉ tiêu', field: 'code', width: 100 , ...filter()},
			  { headerName: 'Tên chỉ tiêu', field: 'name', width: 460 ,...filter()},
			  { headerName: 'Phân loại', field: 'phan_loai', width: 200,...filter()},
			  { headerName: 'Giải thích chỉ tiêu', field: 'dien_giai', width: 660,...filter() },
			  { headerName: 'Nguồn dữ liệu tính', field: 'chu_thich', width: 460 ,...filter()},
		  ]
	  )
	}

	useEffect(() => {
		getColumn()
	}, [isStatusFilter]);

	const fetchCurrentUser = async () => {
		const {data, error} = await getCurrentUserLogin();
		if (data) {
			setCurrentUser(data);
		}
	};

	const fetchData = async () => {
		try {
			const data = await getAllDienGiai();
			console.log(data);
			setRowData(data);
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu diễn giải:', error);
		}
	};

	useEffect(() => {
		fetchCurrentUser();
		fetchData();
	}, []);

	const handleSave = async () => {
		try {
			const updatePromises = updateData.map((item) => updateDienGiai(item));
			await Promise.all(updatePromises);
			setUpdateData([])
			await fetchData();
			toast.success("Cập nhật thành công", {autoClose: 1000});
		} catch (error) {
			console.error("Lỗi khi cập nhật dữ liệu", error);
		}
	};

	const handleAddRow = async () => {
		const newData = {
			created_at: createTimestamp(),
			user_create: currentUser.email,
		};
		await createNewDienGiai(newData);
		toast.success("Tạo dòng thành công", {autoClose: 1000});
		await fetchData();
	};

	const handleCellValueChanged = async (event) => {
		const updatedRow = event.data;
		setUpdateData(prevData => {
			const existingRowIndex = prevData.findIndex(item => item.id === updatedRow.id);
			if (existingRowIndex !== -1) {
				prevData[existingRowIndex] = updatedRow;
				return [...prevData];
			} else {
				return [...prevData, updatedRow];
			}
		});
	};

	const handleAddRowMany = async () => {
		setLoading(true);  // Show loading spinner
		for (let i = 0; i < quantity; i++) {
			const newData = {
				created_at: createTimestamp(),
				user_create: currentUser.email,
			};
			await createNewDienGiai(newData);
		}
		setLoading(false);  // Hide loading spinner
		toast.success(`${quantity} dòng đã được tạo`, {autoClose: 1000});
		await fetchData();
		setShowModal(false);  // Close the modal
	};

	const handleShowModal = () => {
		setShowModal(true);
	};

	useEffect(() => {
		if (!showModal) setQuantity(1)
	}, [showModal]);

	return (
		<div className={style.wrapper}>
			<div className={style.header}>
				<div className={style.textGroup}>
					<div className={style.title}>Bộ chỉ số đo lường toàn diện</div>
					<div
						className={style.description}
						contentEditable
						suppressContentEditableWarning
					>
						Thích ứng theo ngành hàng cụ thể, xác định chính xác thứ cần đo, thứ cần cải thiện, xóa bỏ điểm mù thông tin.
					</div>
				</div>
				<ActionSave handleSaveData={handleSave} updateData={updateData} />
				<Button onClick={handleChangeStatusFilter}>
					<span>{isStatusFilter ? '❌ Tắt filter' : '✅ Bật filter'}</span>
				</Button>
				<Button onClick={handleShowModal}>+ Nhiều</Button>
				<ActionCreate handleAddRow={handleAddRow} />
			</div>

			<div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
				<AgGridReact
					onCellValueChanged={handleCellValueChanged}
					enableRangeSelection={true}
					statusBar={{
						statusPanels: [{ statusPanel: 'agAggregationComponent' }],
					}}
					defaultColDef={defaultColDef}
					columnDefs={colDefs}
					rowData={rowData}
				/>
			</div>

			<Modal
				title="Thêm nhiều dòng"
				open={showModal}
				onCancel={() => setShowModal(false)}
				onOk={handleAddRowMany}
				okText="Thêm dòng"
				cancelText="Hủy"
				centered
			>
				<div className={style.modalInputGroup}>
					<label htmlFor="rowCount">Số lượng dòng cần thêm:</label>
					<input
						id="rowCount"
						type="number"
						min="1"
						max="1000"
						value={quantity}
						onChange={(e) => {
							const value = Math.min(1000, Math.max(1, e.target.value));
							setQuantity(value);
						}}
						className={style.input}
					/>
				</div>
				{loading && <Spin size="large" className={style.loading} />}
			</Modal>
		</div>
	);

}

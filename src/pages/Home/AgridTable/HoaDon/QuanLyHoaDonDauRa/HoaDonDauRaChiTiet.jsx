'use strict';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import '../../agComponent.css';
import AG_GRID_LOCALE_VN from '../../locale.jsx';
import css from '../../DanhMuc/KeToanQuanTri.module.css';
import { message } from 'antd';
import { HOA_DON_TYPE } from '../../../../../CONST.js';
// Ag Grid Function
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
// COMPONENT
import InvoicePopup from '../../../InvoicePopup/InvoicePopup.jsx';
// FUNCTION
import { handleSave } from '../../handleAction/handleSave.js';
// import ActionCreate from '../../actionButton/ActionCreate.jsx';
// API
import { getCurrentUserLogin } from '../../../../../apis/userService.jsx';
import { createNewHoaDon, getAllHoaDon } from '../../../../../apis/hoaDonService.jsx';
import { getAllKhachHang } from '../../../../../apis/khachHangService.jsx';
import { loadColumnState, saveColumnStateToLocalStorage } from '../../logicColumnState/columnState.jsx';
import ActionResetColumn from '../../actionButton/ActionResetColumn.jsx';
import { onFilterTextBoxChanged } from '../../../../../generalFunction/quickFilter.js';
import { getItemFromIndexedDB } from '../../../../../storage/storageService.js';
import { Hoa_Don_Dau_Ra_Chi_Tiet } from '../../../../../Consts/TITLE_HEADER.js';
import { getAllHangHoa } from '../../../../../apis/hangHoaService.jsx';
import { formatMoney } from '../../../../../generalFunction/format.js';
import { getAllHoaDonSanPhamByHoaDonId } from '../../../../../apis/hoaDonSanPhamService.jsx';
import SettingRule from '../actionButton/SettingRule.jsx';
import RunRule from '../actionButton/RunRule.jsx';
import { MyContext } from '../../../../../MyContext.jsx';
import ActionClearFilter from '../../actionButton/ActionClearAllFilter.jsx';
import ActionBookMark from '../../actionButton/ActionBookMark.jsx';
import ActionSearch from '../../actionButton/ActionSearch.jsx';
import ActionChangeFilter from '../../actionButton/ActionChangeFilter.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function HoaDonDauRaChiTiet() {
	const headerTitle = Hoa_Don_Dau_Ra_Chi_Tiet;
	const table = 'HoaDonDauRaChiTiet';
	const tableStatusFilter = 'HoaDonDauRaChiTiet';
	const tableCol = 'HoaDonDauRaChiTietCol';
	const tableFilter = 'HoaDonDauRaChiTietFilter';
	const gridRef = useRef();
	const [colDefs, setColDefs] = useState([]);
	const [updatedData, setUpdatedData] = useState([]);
	const [loading, setLoading] = useState(false);
	const { currentUser , selectedCompany, } = useContext(MyContext);
	const [isInvoicePopupOpen, setIsInvoicePopupOpen] = useState(false);
	const [showClearFilter, setShowClearFilter] = useState(false);
	const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
	const [checkColumn, setCheckColumn] = useState(true);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);

	const getLocalStorageSettings = () => {
		const storedSettings = JSON.parse(localStorage.getItem(table));
		return {
			isStatusFilter: storedSettings?.isStatusFilter ?? false,
		};
	};

	const [isStatusFilter, setIsStatusFilter] = useState(getLocalStorageSettings().isStatusFilter);

	useEffect(() => {
		const tableSettings = {
			isStatusFilter,
		};

		localStorage.setItem(tableStatusFilter, JSON.stringify(tableSettings));
	}, [isStatusFilter]);

	const handleChangeStatusFilter = () => {
		setIsStatusFilter((prev) => {
			return !prev;
		});
	};

	const handleDropdownToggle = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	const defaultColDef = useMemo(() => {
		return {
			editable: true,
			filter: true,
			suppressMenu: true,
			cellStyle: { fontSize: '14.5px' },
		};
	});

	const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

	const loadData = async () => {

		const [listhoaDonData, listKhachHangData] = await Promise.all([
			getAllHoaDon(),
			getAllKhachHang()
		]);

		const data = listhoaDonData.filter(item => item.company == selectedCompany);
		const khachHangData = listKhachHangData.filter(item => item.company == selectedCompany);

		const hoaDonData = data
			.filter(item => item.type === HOA_DON_TYPE.DauRa)
			.map(item => {
				const khachHang = khachHangData.find(kh => kh.id === item.id_khach_hang);
				item.code = item.code ? item.code : `HD${item.id}`;
				return {
					...item,
					khachHang,
				};
			});

		const detailsList = await Promise.all(
			hoaDonData?.map(async (donHang) => {
				const details = await getAllHoaDonSanPhamByHoaDonId(donHang.id);
				if (!details?.data?.length) return [donHang];

				return details.data.map(({ id, code, ...restDetail }) => ({
					...donHang,
					...restDetail,
					id_detail: id
				}));
			}),
		);
		const mergedList = detailsList.flat();
		mergedList.sort((a, b) => b.id - a.id);
		const savedFilters = sessionStorage.getItem(tableFilter);
		const filters = JSON.parse(savedFilters);
		if (gridRef.current && gridRef.current.api) {
			if (savedFilters) {
				gridRef.current.api.setRowData(mergedList);
				gridRef.current.api.setFilterModel(filters);

			} else {
				gridRef.current.api.setRowData(mergedList);
			}
		} else {
			console.warn('Grid chưa được khởi tạo hoặc gridRef.current là null');
		}
		setLoading(false);
	};



	const onGridReady = useCallback(async () => {
		await loadData();
	}, []);

	useEffect(() => {
		setLoading(true);
		loadData();
	}, [selectedCompany]);

	function filter() {
		if (isStatusFilter) {
			return {
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
		}
	}


	useEffect(() => {
		const fetchData = async () => {
			try {
				const savedColumnState = await getItemFromIndexedDB(tableCol) || [];
				const [listHangHoa, listKhachHang] = await Promise.all([
					getAllHangHoa(),
					getAllKhachHang(),
				]);


				let updatedColDefs = [
					// {
					//     pinned: 'left',
					//     width: '50',
					//     field: 'delete',
					//     suppressHeaderMenuButton: true,
					//     cellStyle: { alignItems: "center", display: "flex" },
					//     headerName: '',
					//     editable: false,
					//     cellRenderer: (params) => {
					//         if (!params.data || !params.data.id) {
					//             return null;
					//         }
					//         return (
					//             <PopupDeleteAgrid
					//                 {...params.data}
					//                 id={params.data.id}
					//                 reload={loadData}
					//                 table={table}
					//                 currentUser={currentUser}
					//             />
					//         );
					//     },
					// },
					{
						headerName: '',
						headerCheckboxSelection: true,
						checkboxSelection: true,
						width: 40,
						pinned: 'left',
						suppressMenu: true,
						editable: false,
						cellStyle: {
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						},
					},

					// {
					// 	field: 'id',
					// 	headerName: 'STT',
					// 	width: 120,
					// 	...filter(),
					// },

					{
						field: 'code',
						headerName: 'Mã hóa đơn',
						width: 120,
						...filter(),
					},
					{
						field: 'khach_hang',
						headerName: 'Khách hàng',
						valueGetter: (params) => {
							if (!params.data?.khach_hang) return '';
							const code = listKhachHang.find(e => e.code == params.data.khach_hang);
							return code ? `${code.code} - ${code.name}` : '';
						},
						...filter(),
					},
					{
						field: 'hinh_thuc_tt',
						headerName: 'Phương thức thanh toán',
						width: 120,
						...filter(),
					},
					{
						field: 'note',
						headerName: 'Diễn giải',
						width: 520,
						...filter(),
					},
					{
						field: 'date',
						headerName: 'Ngày hóa đơn',
						...filter(),
					},
					{
						field: 'ky_hieu_hd',
						headerName: 'Kí hiệu hóa đơn',
						...filter(),
					},
					{
						field: 'mau_so',
						headerName: 'Mẫu số',
						...filter(),
					},
					{
						field: 'ten_hang_hoa',
						headerName: 'Tên hàng hóa',
						valueGetter: (params) => {
							const hangHoa = listHangHoa.find(e => e.code === params.data?.productCode);
							return hangHoa ? `${hangHoa.code} - ${hangHoa.name}` : '';
						},
						...filter(),

					},

					{
						field: 'dvt',
						headerName: 'Đơn vị tính',
						valueGetter: (params) => {
							const hangHoa = listHangHoa.find(e => e.code === params.data?.productCode);
							return hangHoa?.dvt || '';
						},
						...filter(),

					},
					{
						field: 'soLuong',
						headerName: 'Số lượng',
						...filter(),
					},
					{
						field: 'gia_ban',
						headerName: 'Giá bán',
						valueGetter: (params) => {
							const hangHoa = listHangHoa.find(e => e.code === params.data?.productCode);
							const giaNhap = Number(hangHoa?.gia_ban) || 0;
							return formatMoney(giaNhap);
						},
						...filter(),
					},
					{
						field: 'tong_tien',
						headerName: 'Tổng tiền',
						valueFormatter: (params) => formatMoney(params.value),
						...filter(),
					},
					{
						field: 'result_rule',
						headerName: 'Kết quả',
						...filter(),
						width: 350,
					},
				];
				if (savedColumnState.length) {
					setColDefs(loadColumnState(updatedColDefs, savedColumnState));
				} else {
					setColDefs(updatedColDefs);
				}
			} catch (error) {
				message.error('Error fetching data:', error);
			}
		};
		fetchData();
	}, [isStatusFilter, showClearFilter, checkColumn]);

	const handleCellValueChanged = async (event) => {
		let updatedRow = event.data;
		updatedRow.user_update = currentUser.email;
		setUpdatedData(prevData => {
			const existingRowIndex = prevData.findIndex(item => item.id === updatedRow.id);
			if (existingRowIndex !== -1) {
				prevData[existingRowIndex] = updatedRow;
				return [...prevData];
			} else {
				return [...prevData, updatedRow];
			}
		});
	};

	const handleSaveData = async () => {
		try {
			await handleSave(updatedData, table, setUpdatedData, currentUser);
			await loadData();
			toast.success('Cập nhật thành công', { autoClose: 10 });
		} catch (error) {
			console.error('Lỗi khi cập nhật dữ liệu', error);
		}
	};

	const handleAddRow = async () => {
		await createNewHoaDon({ type: HOA_DON_TYPE.DauRa });
		message.success('Tạo dòng thành công', { autoClose: 10 });
		await loadData();
	};

	const handleOpenInvoicePopup = () => {
		setIsInvoicePopupOpen(true);
	};

	const handleCloseInvoicePopup = () => {
		setIsInvoicePopupOpen(false);
	};

	const onFilterChanged = () => {
		const filterModel = gridRef.current.api.getFilterModel();

		if (Object.keys(filterModel).length !== 0) {
			sessionStorage.setItem(tableFilter, JSON.stringify(filterModel));
			setShowClearFilter(true);
		} else {
			sessionStorage.removeItem(tableFilter);
		}
		onSelectionChanged();

	};

	const clearFilters = () => {
		// Kiểm tra nếu grid đã sẵn sàng
		if (gridRef.current && gridRef.current.api) {
			gridRef.current.api.setFilterModel(null); // Xóa tất cả bộ lọc
		}
		setShowClearFilter(false);
	};

	const [selectedRows, setSelectedRows] = useState([]);

	const onSelectionChanged = () => {
		const selectedData = gridRef.current.api
			.getRenderedNodes() // Lấy các node đang được hiển thị sau khi filter
			.filter(node => node.isSelected()) // Chỉ giữ lại các node được chọn
			.map(node => ({ ...node.data, show: false }));

		setSelectedRows(selectedData);
	};


	return (
		<>
			<div className={css.headerPowersheet}>
				<div className={css.headerTitle}>
					<span>{headerTitle}</span>
				</div>
				<div className={css.headerActionFilter}>
					<ActionBookMark headerTitle={headerTitle} />
					<ActionSearch handleFilterTextBoxChanged={handleFilterTextBoxChanged} />
					<ActionChangeFilter isStatusFilter={isStatusFilter}
					    handleChangeStatusFilter={handleChangeStatusFilter} />
					<ActionResetColumn tableCol={tableCol} checkColumn={checkColumn} setCheckColumn={setCheckColumn} />
					<ActionClearFilter showClearFilter={showClearFilter} clearFilters={clearFilters} />
				</div>
				<div className={css.headerAction}>
					{currentUser?.isAdmin && selectedRows.length > 0 && <RunRule selectedRows={selectedRows} gridRef={gridRef} />}
					<SettingRule />


					{/*<ActionCreate handleAddRow={handleOpenInvoicePopup} />*/}
					{/*<ActionSave handleSaveData={handleSaveData} updateData={updatedData} />*/}
					{/*<div className={css.headerActionButton} ref={dropdownRef}>*/}
					{/*    <img*/}
					{/*        src={EllipsisIcon}*/}
					{/*        style={{ width: 32, height: 32, cursor: 'pointer' }}*/}
					{/*        alt="Ellipsis Icon"*/}
					{/*        onClick={handleDropdownToggle}*/}
					{/*    />*/}
					{/*    {isDropdownOpen && (*/}
					{/*        <div className={css.dropdownMenu}>*/}
					{/*            <ExportableGrid*/}
					{/*                api={gridRef.current ? gridRef.current.api : null}*/}
					{/*                columnApi={gridRef.current ? gridRef.current.columnApi : null}*/}
					{/*                table={table}*/}
					{/*                isDropdownOpen={isDropdownOpen}*/}
					{/*            />*/}
					{/*            /!*{company !== 'HQ' &&*!/*/}
					{/*            /!*    <ImportBtnLuong*!/*/}
					{/*            /!*        apiUrl={`${import.meta.env.VITE_API_URL}/api/soketoan`}*!/*/}
					{/*            /!*        onFileImported={handleFileImported}*!/*/}
					{/*            /!*        onGridReady={onGridReady}*!/*/}
					{/*            /!*        company={company}*!/*/}
					{/*            /!*        isDropdownOpen={setIsDropdownOpen}*!/*/}
					{/*            /!*        table={table}*!/*/}
					{/*            /!*    />*!/*/}
					{/*            /!*}*!/*/}

					{/*        </div>*/}
					{/*    )}*/}
					{/*</div>*/}
				</div>
			</div>
			<div
				style={{
					height: '78vh',
					display: 'flex',
					flexDirection: 'column',
					position: 'relative',
					marginTop: '15px',
				}}
			>
				{loading && (
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '100%',
							position: 'absolute',
							width: '100%',
							zIndex: '1000',
							backgroundColor: 'rgba(255, 255, 255, 0.96)',
						}}
					>
						<img src='/loading_moi_2.svg' alt='Loading...' style={{ width: '650px', height: '550px' }} />
					</div>
				)}
				<div className='ag-theme-quartz' style={{ height: '100%', width: '100%' }}>
					<AgGridReact
						statusBar={statusBar}
						enableRangeSelection={true}
						ref={gridRef}
						defaultColDef={defaultColDef}
						columnDefs={colDefs}
						rowSelection='multiple'
						onCellValueChanged={handleCellValueChanged}
						localeText={AG_GRID_LOCALE_VN}
						onGridReady={onGridReady}
						onFilterChanged={onFilterChanged}
						onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
						onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
						suppressRowClickSelection={true}
						onSelectionChanged={onSelectionChanged}
					/>
				</div>

				{/* Invoice Popup */}
				{isInvoicePopupOpen && (
					<InvoicePopup
						isOpen={isInvoicePopupOpen}
						currentUser={currentUser}
						loadData={loadData}
						onClose={handleCloseInvoicePopup}
						type={HOA_DON_TYPE.DauRa}
					/>
				)}
			</div>
		</>
	);
}

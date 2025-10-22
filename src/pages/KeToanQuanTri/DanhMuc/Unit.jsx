import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { toast } from 'react-toastify';
import '../../Home/AgridTable/agComponent.css';
import { getAllUnits } from '../../../apisKTQT/unitService.jsx';
import css from '../KeToanQuanTriComponent/KeToanQuanTri.module.css';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import TooltipHeaderIcon from '../HeaderTooltip/TooltipHeaderIcon.jsx';
import MenuItem from '@mui/material/MenuItem';
import { onFilterTextBoxChanged } from '../../../generalFunction/quickFilter.js';
import { MyContext } from '../../../MyContext.jsx';
import { handleSaveAgl } from '../functionKTQT/handleSaveAgl.js';
import { getCurrentDateTimeWithHours } from '../functionKTQT/formatDate.js';
import { handleAddAgl } from '../functionKTQT/handleAddAgl.js';
import PopupDeleteRenderer from '../popUp/popUpDelete.jsx';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import RichNoteKTQTRI from '../../Home/SelectComponent/RichNoteKTQTRI.jsx';
import { setItemInIndexedDB2 } from '../storage/storageService.js';
import SettingGroup from './SettingGroup.jsx';
import { getAllSettingGroup } from '../../../apisKTQT/settingGroupService.jsx';
import { getCurrentUserLogin } from '../../../apis/userService.jsx';
import { permissionForKtqt } from '../functionKTQT/permissionForKtqt/permissionForKtqt.js';
import '../VanHanh/cssSKT.css';
import ActionSave from '../../Home/AgridTable/actionButton/ActionSave.jsx';
import DropdownImportDM_UNIT from '../popUp/importDanhMuc/DropdownImportDM_UNIT.jsx';
import Loading from '../../Loading/Loading.jsx';
import { getAllSoKeToan } from '../../../apisKTQT/soketoanService.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function Unit({ company, call, type }) {
	let {
		sheetPermissionsInfo,
		currentUser,
		fetchAllUnits,
		loadDataSoKeToan,
		listCompany,
		userClasses,
		fetchUserClasses,
		setIsUpdateNoti,
		isUpdateNoti,
		checkUpdate,
		setCheckUpdate,
		valueUpdate,
		setValueUpdate,

	} = useContext(MyContext);
	const table = 'Unit';
	const key = 'DANHMUC_DONVI';
	const gridRef = useRef();
	const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
	const [rowData, setRowData] = useState([]);
	const [colDefs, setColDefs] = useState([]);
	const [updatedData, setUpdatedData] = useState([]);
	const [saveActive, setSaveActive] = useState(false);
	const [loading, setLoading] = useState(false);
	const [oldData, setOldData] = useState({});
	const [showProjectFormUpdate, setShowProjectFormUpdate] = useState(false);
	const [openAddDialog, setOpenAddDialog] = useState(false);  // State để mở/đóng Dialog
	const [isFormValid, setIsFormValid] = useState(false);
	const [listGroup, setListGroup] = useState([]);
	const [listEditData, setListEditData] = useState([]);
	const [listGroupNull, setListGroupNull] = useState([]);
	const [listGroupKHNull, setListGroupKHNull] = useState([]);
	const [isFilteredGroup, setIsFilteredGroup] = useState(false);
	const [isFilteredGroupKH, setIsFilteredGroupKH] = useState(false);
	const [loadingCount, setLoadingCount] = useState(false);

	async function EditTable() {
		const user = await getCurrentUserLogin();
		let permission = await permissionForKtqt(user, userClasses, fetchUserClasses);
		return { editable: permission };
	}

	const [newUnitData, setNewUnitData] = useState({
		code: '',
		group: '',
		dp: '',
		name: '',
		company: '',
	});  // State để lưu thông tin của unit mới
	const resetForm = () => {
		setNewUnitData({
			code: '',
			group: '',
			dp: '',
			name: '',
			company: '',
		});
	};
	const defaultColDef = useMemo(() => {
		return {
			filter: true,
			cellStyle: { fontSize: '14.5px' },
			editable: true,
			cellClassRules: {
				'cell-small': (params) => params.colDef.width < 150,
			},
			wrapHeaderText: true,
			autoHeaderHeight: true,
		};
	});

	const fetchUnitData = async (company) => {
		const [listSoKeToan, data] = await Promise.all([getAllSoKeToan(), getAllUnits()]);
		const relevantUnit = company === 'HQ' ? data : data.filter(v => v.company === company);
		const relevantSoKeToan = company === 'HQ' ? listSoKeToan : listSoKeToan.filter(s => s.company === company);
		const nonEditableProjects = [];
		relevantUnit.forEach(unit => {
			const matchingRecord = relevantSoKeToan.find(skt => skt.unit_code2 === unit.code && skt.company === unit.company);
			unit.isEditable = !matchingRecord;
			if (unit.isEditable) {
				nonEditableProjects.push(unit);
			}
		});
		setListEditData(nonEditableProjects);
		return relevantUnit;
	};


	const onGridReady = useCallback(async () => {
		loadData();
	}, [company]);

	const countGroupNull = async (data) => {
		const value = await getAllSettingGroup();
		let unitGroup = value.filter(e => e?.type == 'unit');
		let groupOption = unitGroup.map(item => item.name);
		let unitGroupKH = value.filter(e => e?.type == 'kh_unit');
		let groupKHOption = unitGroupKH.map(item => item.name);

		let checkGroup = [];
		let checkGroupKH = [];
		data.forEach(e => {
			if (e.group === '' || e.group === null || e.group === undefined || !groupOption.includes(e.group)) checkGroup.push(e);
			if (e.groupKH === '' || e.groupKH === null || e.groupKH === undefined || !groupKHOption.includes(e.groupKH)) checkGroupKH.push(e);

		});
		setListGroupNull(checkGroup);
		setListGroupKHNull(checkGroupKH);
	};

	const loadData = async () => {
		let data;
		if (company === 'HQ') {
			data = await fetchUnitData('HQ');
		} else {
			data = await fetchUnitData(company);
		}
		await setItemInIndexedDB2(key, data);
		// data = data.filter((e) => !e.isEditable);
		// countGroupNull(data);
		console.log(data);
		setRowData(data);
		setLoading(false);
	};


	useEffect(() => {
		setLoading(true);
		loadData();
	}, [company]);

	function filter() {
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

	useEffect(() => {
		const fetchData = async () => {
			const data = await getAllSettingGroup();
			let unitGroup = data.filter(e => e?.type == 'unit');
			setListGroup(unitGroup);
			let groupOption = unitGroup.map(item => item.stt + '-' + item.name);
			let unitGroupKH = data.filter(e => e?.type == 'kh_unit');
			let groupKHOption = unitGroupKH.map(item => item.name);
			try {
				setColDefs([
					// {
					//     field: 'id',
					//     headerName: 'ID',
					//     hide: false,
					//     width: 100,
					//     ...filter(),
					//     editable: false,
					//     cellStyle: {textAlign: "left"}
					// },
					// {
					//     field: 'company',
					//     headerName: 'Công ty',
					//     width: 90,
					//     suppressHeaderMenuButton: true,
					//     ...filter(),
					//     editable: params => params.data.isEditable,
					//     cellStyle: {textAlign: "left"},
					//     cellEditor: 'agRichSelectCellEditor',
					//     cellEditorParams: {
					//         allowTyping: true,
					//         filterList: true,
					//         highlightMatch: true,
					//         values: listCompany.map((p) => p.code),
					//     },
					//     // hide: type == 1 || type == 2,
					// },
					{
						field: 'name',
						headerName: 'Tên trên sổ hợp nhất',
						flex: 1,
						...filter(),
						editable: params => params.data.isEditable,
					},
					{
						field: 'code',
						headerName: 'Mã để tính số liệu báo cáo',
						flex: 1,
						...filter(),
						editable: params => params.data.isEditable,
					},
					{
						field: 'group',
						flex: 1,
						headerName: 'Nhóm báo cáo KQKD',
						editable: true,
						...filter(),
						cellClassRules: {
							'data-error': (params) => {
								return params.value === '' || params.value === null || params.value === undefined || !groupOption.includes(params.value);
							},
						},
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: groupOption,
						},
						...await EditTable(),
					},
					// {
					//     field: 'groupKH',
					//     flex: 1,
					//     headerName: 'Nhóm để thiết lập & theo dõi Kế hoạch KQKD',
					//     editable: true,
					//     ...filter(),
					//     cellClassRules: {
					//         'data-error': (params) => {
					//             return params.value === '' || params.value === null || params.value === undefined || !groupKHOption.includes(params.value);
					//         },
					//     },
					//     cellEditor: 'agRichSelectCellEditor',
					//     cellEditorParams: {
					//         allowTyping: true,
					//         filterList: true,
					//         highlightMatch: true,
					//         values: groupKHOption,
					//     },
					//     ...await EditTable()
					//
					// },
					// {
					//     field: 'dp',
					//     headerName: 'Tên thể hiện',
					//     flex: 1,
					//     editable: true,
					//     ...filter(),
					//     // hide: type === undefined ? true : (type == 1 ? false : true),
					// },

					// {
					//     field: "duyet",
					//     width: 80,
					//     headerName: 'Trạng thái',
					//     cellEditor: 'agRichSelectCellEditor',
					//     suppressHeaderMenuButton: true,
					//     cellEditorParams: {
					//         values: customSelectDuyet.map(item => item.id.toString()),
					//         formatValue: function (value) {
					//             const found = customSelectDuyet.find(item => item.id.toString() === value);
					//             return found ? found.name : value;
					//         }
					//     },
					//     valueFormatter: function (params) {
					//         const selectedItem = customSelectDuyet.find(item => item.id.toString() === params.value);
					//         return selectedItem ? selectedItem.name : null;
					//     },
					//     valueParser: function (params) {
					//         const found = customSelectDuyet.find(item => item.name === params.newValue);
					//         return found ? found.id.toString() : null;
					//     },
					//     cellClassRules: {
					//         'daduyet': (params) => params.data.duyet == 1,
					//     },
					//     editable: false
					// },
					{
						pinned: 'left',
						width: '40',
						field: 'action',
						cellStyle: { textAlign: 'center' },
						headerName: '',
						cellRenderer: (params) => {
							// if (!params.data || !params.data.id || params.data.duyet == 1 || !params.data.isEditable) {
							// 	return null;
							// }
							return (
								<PopupDeleteRenderer
									{...params.data}
									id={params.data.id}
									table={table}
									reloadData={onGridReady}
									// disable={params.data.duyet == 1}
								/>
							);
						},
						editable: false,
					},
				]);
			} catch (error) {
				console.log(error);
			}
		};
		fetchData();
	}, [onGridReady, rowData, table]);


	const handleCellValueChanged = (event) => {
		const updatedRow = { ...event.data };
		let newUpdatedData = [];

		setUpdatedData((prevData) => {
			const existingRowIndex = prevData.findIndex(item => item.id === updatedRow.id);
			if (existingRowIndex !== -1) {
				prevData[existingRowIndex] = updatedRow;
				newUpdatedData = [...prevData];
			} else {
				newUpdatedData = [...prevData, updatedRow];
			}
			return newUpdatedData;
		});

		setValueUpdate((prevValueUpdate) => ({
			...prevValueUpdate,
			[updatedRow.table]: newUpdatedData,
		}));

		setCheckUpdate(true);
	};


	const handleSaveData = async () => {
		setLoading(true);
		if (!updatedData.length) return;
		await handleSaveAgl(updatedData, table, setUpdatedData, setIsUpdateNoti, isUpdateNoti);
		await loadData();
		setLoading(false);
		setCheckUpdate(false);
	};


	const handleAddRow = () => {
		setOpenAddDialog(true);
		resetForm();
	};

	const handleDialogClose = () => {
		setOpenAddDialog(false);  // Đóng Dialog
	};

	useEffect(() => {
		const isValid = (newUnitData.name || '').trim() !== '';
		setIsFormValid(isValid);

		if (isValid) {
			// Tạo code tự động khi các trường hợp lệ
			const newCode = `${newUnitData.name}-${newUnitData.company}`;
			setNewUnitData(prev => ({ ...prev, code: newCode }));
		}
	}, [newUnitData.name, company]);

	const handleSaveNewUnit = async () => {
		setIsFilteredGroupKH(false);
		setIsFilteredGroup(false);
		try {
			if (!isFormValid) {
				toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
				return;
			}
			// Thêm unit mới vào cơ sở dữ liệu hoặc backend
			await handleAddAgl(
				newUnitData.company,
				{
					...newUnitData,
					system_created_at: getCurrentDateTimeWithHours(),
					show: true,
				},
				table,
				onGridReady, setIsUpdateNoti, isUpdateNoti,
			);

			// Cập nhật grid sau khi thêm mới thành công
			// await fetchAllUnits();
			// Đóng Dialog và reset form
			handleDialogClose();
		} catch (error) {
			toast.error('Lỗi xảy ra khi thêm đơn vị mới!');
		}
	};

	const onRowDoubleClicked = (event) => {
		setOldData(event.data);
		setShowProjectFormUpdate(true);
	};

	function handleFilterNotKM(type, data) {
		if (type == 'groupKH') {
			if (!isFilteredGroupKH) {
				setRowData(listGroupKHNull);
			} else {
				loadData();
			}
			setIsFilteredGroupKH(!isFilteredGroupKH);
		}

		if (type == 'group') {
			if (!isFilteredGroup) {
				setRowData(listGroupNull);
			} else {
				loadData();
			}
			setIsFilteredGroup(!isFilteredGroup);
		}
	}

	return (
		<>
			<div className={'header-powersheet'}>
				{call !== 'cdsd' && <>
					<div className={css.headerTitle}>
						<span>Quản lý đơn vị <TooltipHeaderIcon table={table} /></span>
					</div>
				</>}
				<div className={css.headerAction}>
					<SettingGroup table={table} reload={onGridReady} />
					{/*{*/}
					{/*    listEditData.length > 0 &&*/}
					{/*    <ActionDeleteDataAllowed listDataAllowDelete={listEditData} table={table}*/}
					{/*                             loadData={loadData}/>*/}

					{/*}*/}
					<ActionSave handleSaveData={handleSaveData} updateData={updatedData} />
					{/*<ActionCreate handleAddRow={handleAddRow}/>*/}
					<DropdownImportDM_UNIT
						table={table}
						reload={loadData}
						columnDefs={colDefs}
						company={company}
						data={rowData}
						title_table={'Quản lý đơn vị'}
						type_setting_group={'unit'}
						listGroup={listGroup}
						groupFieldName={'group'}
					/>
				</div>
			</div>
			<div className={css.headerPowersheet2}>
				<div className={`${css.headerActionButton}`}>
					{/*{listGroupNull.length > 0 &&*/}
					{/*	<div*/}
					{/*		className={`${css.checkKM} ${isFilteredGroup ? css.activeNotification : ''}`}*/}
					{/*		onClick={() => {*/}
					{/*			handleFilterNotKM('group', listGroupNull);*/}
					{/*		}}>*/}
					{/*		{loadingCount ? <LoadingOutlined /> : <>Có {listGroupNull.length} dòng chưa điền nhóm lên*/}
					{/*			báo*/}
					{/*			cáo KQKD hoặc sai với thiết lập nhóm*/}
					{/*		</>}*/}

					{/*	</div>}*/}
					{/*{listGroupKHNull.length > 0 &&*/}
					{/*    <div*/}
					{/*        className={`${css.checkKM} ${isFilteredGroupKH ? css.activeNotification : ''}`}*/}
					{/*        onClick={() => {*/}
					{/*            handleFilterNotKM('groupKH', listGroupKHNull)*/}
					{/*        }}>*/}
					{/*        {loadingCount ? <LoadingOutlined/> : <>Có {listGroupKHNull.length} dòng chưa điền nhóm Kế*/}
					{/*            hoạch KQKD hoặc sai với thiết lập nhóm*/}
					{/*        </>}*/}

					{/*    </div>}*/}
				</div>
			</div>

			<div style={{ width: '100%', height: '11%', boxSizing: 'border-box' }}>
				<RichNoteKTQTRI table={`${table + '-' + company}`} />
			</div>

			<div
				style={{
					height: call === 'cdsd' ? '75%' : '61vh',
					display: 'flex',
					flexDirection: 'column',
					position: 'relative',
					marginTop: '15px',
				}}
			>
				<Loading loading={loading} />
				<div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
					<AgGridReact
						ref={gridRef}
						enableRangeSelection={true}
						rowData={rowData}
						defaultColDef={defaultColDef}
						columnDefs={colDefs}
						onCellValueChanged={handleCellValueChanged}
						rowSelection="multiple"
						animateRows={true}
						localeText={AG_GRID_LOCALE_VN}
						onGridReady={onGridReady}
						onRowDoubleClicked={onRowDoubleClicked}
					/>
				</div>
				<Dialog open={openAddDialog} onClose={handleDialogClose}>
					<DialogTitle>Thêm đơn vị mới</DialogTitle>
					<DialogContent>
						<TextField
							margin="dense"
							label="Tên công ty"
							type="text"
							fullWidth
							variant="outlined"
							value={newUnitData.company}
							required
							error={(newUnitData.company || '').trim() === ''}  // Hiển thị lỗi nếu bỏ trống
							helperText={(newUnitData.company || '').trim() === '' ? 'Tên công ty là bắt buộc' : ''}
							onChange={(e) => setNewUnitData({ ...newUnitData, company: e.target.value })}
							select // Thêm thuộc tính select để biến TextField thành Select
						>
							{listCompany.map((p) => (
								<MenuItem key={p.code} value={p.code}>
									{p.name}
								</MenuItem>
							))}
						</TextField>

						<TextField
							margin="dense"
							label="Tên đơn vị"
							type="text"
							fullWidth
							variant="outlined"
							value={newUnitData.name}
							required
							error={(newUnitData.name || '').trim() === ''}  // Hiển thị lỗi nếu bỏ trống
							helperText={(newUnitData.name || '').trim() === '' ? 'Tên đơn vị là bắt buộc' : ''}
							onChange={(e) => setNewUnitData({ ...newUnitData, name: e.target.value })}
						/>
						<TextField
							margin="dense"
							label="Tên thể hiện"
							type="text"
							fullWidth
							variant="outlined"
							value={newUnitData.dp}
							onChange={(e) => setNewUnitData({ ...newUnitData, dp: e.target.value })}
						/>
						{/*<TextField*/}
						{/*    margin="dense"*/}
						{/*    label="Nhóm"*/}
						{/*    type="text"*/}
						{/*    fullWidth*/}
						{/*    variant="outlined"*/}
						{/*    value={newUnitData.group}*/}
						{/*    onChange={(e) => setNewUnitData({ ...newUnitData, group: e.target.value })}*/}
						{/*/>*/}


					</DialogContent>
					<DialogActions>
						<Button onClick={handleDialogClose} color="secondary">
							Hủy
						</Button>
						<Button onClick={handleSaveNewUnit} color="primary">
							Lưu
						</Button>
					</DialogActions>
				</Dialog>

			</div>
		</>
	);
}

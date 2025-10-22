import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
// Ag Grid Function
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import '../../Home/AgridTable/agComponent.css';
import { formatCurrency, parseCurrencyInput } from '../functionKTQT/formatMoney.js';
import './cssSKT.css';
import css from '../KeToanQuanTriComponent/KeToanQuanTri.module.css';
import pLimit from 'p-limit';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import { MyContext } from '../../../MyContext.jsx';
import { getAllKmf } from '../../../apisKTQT/kmfService.jsx';
import { getAllKmns } from '../../../apisKTQT/kmnsService.jsx';
import { getAllProduct } from '../../../apisKTQT/productService.jsx';
import { getAllProject } from '../../../apisKTQT/projectService.jsx';
import { getAllTeam } from '../../../apisKTQT/teamService.jsx';
import { getAllUnits } from '../../../apisKTQT/unitService.jsx';
import { getAllVas } from '../../../apisKTQT/vasService.jsx';
import { getAllVendor } from '../../../apisKTQT/vendorService.jsx';
import { EllipsisIcon } from '../../../icon/IconSVG.js';
import { getCurrentDateTimeWithHours } from '../functionKTQT/formatDate.js';
import { loadColumnState } from '../functionKTQT/coloumnState.jsx';
import { handleAddAgl } from '../functionKTQT/handleAddAgl.js';
import { handleSaveAgl } from '../functionKTQT/handleSaveAgl.js';
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from '../storage/storageService.js';
import { uniqueCellEditor } from '../functionKTQT/uniqueCellEditor.jsx';
import ExportableGrid from '../popUp/exportFile/ExportableGrid.jsx';
import ActionToggleSwitch from '../ActionButton/ActionToggleSwitch.jsx';
import ActionCreate from '../../Home/AgridTable/actionButton/ActionCreate.jsx';
import {
	createBulkNewSoKeToan,
	deleteBulkSoKeToan,
	getAllSoKeToan,
	updateSoKeToan,
} from '../../../apisKTQT/soketoanService.jsx';
import { getAllCostPool } from '../../../apis/costPoolService.jsx';
import { LoadingOutlined } from '@ant-design/icons';
import { Dropdown, message, Switch } from 'antd';
import { createDM } from './createDM.js';

const limit = pLimit(15);

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function SoKeToan({ company, call, type }) {
	const [editCount, setEditCount] = useState(0);
	const [isLoaded, setIsLoaded] = useState(false);
	const table = 'SoKeToan-KTQT';
	const tableCol = 'SoKeToanCol-KTQT';
	const {
		currentYearKTQT,
		loadDataSoKeToan,
		listCompany,
		userClasses,
		fetchUserClasses,
		setIsUpdateNoti,
		isUpdateNoti,
		currentCompanyKTQT,
	} = useContext(MyContext);
	const gridRef = useRef();
	const [colDefs, setColDefs] = useState([]);
	const [updatedData, setUpdatedData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [listKmns, setListKmns] = useState([]);
	const [listTeam, setListTeam] = useState([]);
	const [listKmf, setListKms] = useState([]);
	const [listCostPool, setListCostPool] = useState([]);
	const [listUnit, setListUnit] = useState([]);
	const [listProduct, setListProduct] = useState([]);
	const [listProject, setListProject] = useState([]);
	const [listNoiBo, setListNoiBo] = useState([]);
	const [listVendor, setListVendor] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const [isSyncing2, setIsSyncing2] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);
	const [selectedYear, setSelectedYear] = useState(`${currentYearKTQT}`);
	const [listYear, setListYear] = useState([]);
	const [showClearFilter, setShowClearFilter] = useState(false);
	const [checkColumn, setCheckColumn] = useState(true);
	const [countUpdate, setCountUpdate] = useState(0);
	const tableStatusButton = 'SoKeToanStatusButton';
	const [isShowAll1, setShowAll1] = useState(true);
	const [isSortByDay, setIsSortByDay] = useState(true);
	const [isSortDoanhThu, setIsSortDoanhThu] = useState(false);
	const [isSortChiPhi, setIsSortChiPhi] = useState(false);
	const [showDaHopNhat, setShowDaHopNhat] = useState(false);
	const [rowDataKMF, setRowDataKMF] = useState([]);
	const [rowDataKMNS, setRowDataKMNS] = useState([]);
	const [rowData, setRowData] = useState([]);
	const [loadingCount, setLoadingCount] = useState(false);
	// Add near other state declarations
	const [tempData, setTempData] = useState([]);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	useEffect(() => {
		setSelectedYear(currentYearKTQT);
	}, [currentYearKTQT]);

	useEffect(() => {
		const fetchSettings = async () => {
			const settings = await getItemFromIndexedDB2(tableStatusButton);
			setShowAll1(call ? false : settings?.isShowAll1 ?? true);
			setIsSortByDay(settings?.isSortByDay ?? true);
			setIsSortDoanhThu(settings?.isSortDoanhThu ?? false);
			setIsSortChiPhi(settings?.isSortChiPhi ?? false);
		};
		fetchSettings();
	}, []);

	useEffect(() => {
		const saveSettings = async () => {
			const settings = {
				isShowAll1,
				isSortByDay,
				isSortDoanhThu,
				isSortChiPhi,
			};
			await setItemInIndexedDB2(tableStatusButton, settings);
		};

		saveSettings();
	}, [isShowAll1, isSortByDay, isSortDoanhThu, isSortChiPhi]);

	const defaultColDef = useMemo(() => {
		return {
			filter: true,
			cellStyle: { fontSize: '14.5px' },
			wrapHeaderText: true,
			autoHeaderHeight: true,
			suppressMenu: true,
			// hide: isShowAll1,
		};
	});

	const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

	const handleDropdownToggle = () => {
		setIsDropdownOpen(pre => !pre);
	};

	function loadData() {
		let listYearsss = [];
		getAllSoKeToan().then((data) => {
			listYearsss = [...new Set(data.filter(e => e.year && e.year !== '').map(e => e.year))];
			setListYear(listYearsss);

			let filteredData = data;

			// Apply company filter
			if (company === 'HQ') {
				if (currentCompanyKTQT === 'HQ') filteredData = filteredData.filter((e) => e.consol?.toLowerCase() === 'consol');
				else filteredData = filteredData.filter((e) => e.company === currentCompanyKTQT);
			} else if (company === 'Group') {
				filteredData = filteredData.filter((e) => e.company === 'Group');
			} else if (company === 'Internal') {
				filteredData = filteredData.filter((e) => e.unit_code === 'Internal');
			} else {
				filteredData = filteredData.filter((e) => e.company === company);
			}
			if (call && type == 'CF') {
				filteredData = filteredData.filter(e => !e.idKTQT);
				// Add filter for daHopNhat when type is CF and call is true
				if (call) {
					if (showDaHopNhat) {
						filteredData = filteredData.filter(e => e.daHopNhat);
					} else {
						filteredData = filteredData.filter(e => !e.daHopNhat);
					}
				}
			} else {
				filteredData = filteredData.filter(e => e.daHopNhat);
			}
			// Apply year filter
			if (selectedYear !== 'toan-bo') {
				filteredData = filteredData.filter(e => e.year == selectedYear);
			}

			// Apply revenue and cost filters
			if (isSortDoanhThu && isSortChiPhi) {
				filteredData = filteredData.filter(e =>
					e.pl_value && e.pl_value !== 0 &&
					(['DT', 'DTK', 'DTTC'].includes(e.pl_type) || e.pl_type.startsWith('CF') || e.pl_type.startsWith('GV')),
				);
			} else if (isSortDoanhThu) {
				filteredData = filteredData.filter(e =>
					e.pl_value && e.pl_value !== 0 && ['DT', 'DTK', 'DTTC'].includes(e.pl_type),
				);
			} else if (isSortChiPhi) {
				filteredData = filteredData.filter(e =>
					e.pl_value && e.pl_value !== 0 && (e.pl_type.startsWith('CF') || e.pl_type.startsWith('GV')),
				);
			}

			// Process internal data
			let noiBoDuplicateList = filteredData.filter((e) => e.isDuplicated && e.unit_code === 'Internal');
			let noiBoList = filteredData.filter((e) => e.noiBo?.toLowerCase() === 'x' && e.unit_code !== 'Internal');
			setListNoiBo(
				noiBoList.filter((noiBoItem) => {
					return !noiBoDuplicateList.some((duplicateItem) => duplicateItem.isDuplicated == noiBoItem.id);
				}),
			);

			// Sort data
			if (isSortByDay) {
				filteredData = filteredData.sort((a, b) => b.id - a.id);
			} else {
				filteredData = filteredData.sort((a, b) => {
					let dateA = new Date(a.year, a.month - 1, a.day);
					let dateB = new Date(b.year, b.month - 1, b.day);
					return dateB - dateA;
				});
			}

			// Update the grid with the filtered data
			setRowData(filteredData);
			setLoading(false);
		});
	}

	function checkKMFvsKMNS() {
		setLoadingCount(true);
		getAllSoKeToan().then((filteredData) => {
			if (company === 'HQ') {
				filteredData = filteredData.filter((e) => e.consol?.toLowerCase() === 'consol');
			} else if (company === 'Group') {
				filteredData = filteredData.filter((e) => e.company === 'Group');
			} else if (company === 'Internal') {
				filteredData = filteredData.filter((e) => e.unit_code === 'Internal');
			} else {
				filteredData = filteredData.filter((e) => e.company === company);
			}

			// Áp dụng bộ lọc theo năm
			if (selectedYear !== 'toan-bo') {
				filteredData = filteredData.filter(e => e.year == selectedYear);
			}
			let notKmf = [];
			let notKmns = [];
			filteredData.forEach(e => {
				if (e.pl_value && e.pl_value != 0 && (!e.kmf || e.kmf === '')) notKmf.push(e);
				if (e.cash_value && e.cash_value != 0 && (!e.kmns || e.kmns === '')) notKmns.push(e);
			});
			setRowDataKMF(notKmf);
			setRowDataKMNS(notKmns);
			setLoadingCount(false);
		});
	}

	useEffect(() => {
		if (editCount === 0) {
			checkKMFvsKMNS();
		}
	}, [selectedYear, editCount]);

	const onGridReady = useCallback(async () => {
		loadData();
	}, [company]);

	useEffect(() => {
		setLoading(true);
		loadData();
		if (company !== 'HQ' && company !== 'Group') {
			getAllKmns().then((data) => {
				const filteredData = data.filter((e) => e.company === company);
				setListKmns(filteredData);
			});
			getAllTeam().then((data) => {
				const filteredData = data.filter((e) => e.company === company);
				setListTeam(filteredData);
			});
			getAllKmf().then((data) => {
				const filteredData = data.filter((e) => e.company === company);
				setListKms(filteredData);
			});
			getAllCostPool().then((data) => {
				const filteredData = data.filter((e) => e.company === company);
				setListCostPool(filteredData);
			});
			getAllProject().then((data) => {
				setListProject(data.filter((e) => e.company === company));
			});
			getAllUnits().then((data) => {
				setListUnit(data.filter((e) => e.company === company));
			});
			getAllProduct().then((data) => {
				setListProduct(data.filter((e) => e.company === company));
			});
			getAllVendor().then((data) => {
				setListVendor(data.filter((e) => e.company === company));
			});
		} else {
			getAllKmns().then((data) => {
				const filteredData = data;
				setListKmns(filteredData);
			});
			getAllTeam().then((data) => {
				const filteredData = data;
				setListTeam(filteredData);
			});
			getAllKmf().then((data) => {
				const filteredData = data;
				setListKms(filteredData);
			});
			getAllCostPool().then((data) => {
				setListCostPool(data);
			});
			getAllProject().then((data) => {
				setListProject(data);
			});
			getAllUnits().then((data) => {
				setListUnit(data);
			});
			getAllProduct().then((data) => {
				setListProduct(data);
			});
			getAllVendor().then((data) => {
				setListVendor(data);
			});
		}

	}, [company, selectedYear, isSortByDay, isSortDoanhThu, isSortChiPhi, type, currentCompanyKTQT]);

	useEffect(() => {
		loadData();
	}, [showDaHopNhat]);

	function checkInput(list, s) {
		// return {
		//     cellClassRules: {
		//         'data-error': (params) => {
		//             return !list.some((e) => e[s] === params.value) && (params.value == '' || params.value == null);
		//         },
		//     },
		// };
		return false;
	}

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

	async function EditTable() {
		// const user = await getCurrentUserLogin()
		// let permission = await permissionForKtqt(user, userClasses, fetchUserClasses)
		// return {editable: permission}
		return { editable: true };
	}

	useEffect(() => {
		const fetchData = async () => {
			try {
				let listVas;
				const data = await getAllVas();
				if (company !== 'HQ' && company !== 'Group') {
					listVas = data.filter((e) => e.company === company);
				} else {
					listVas = data; // Trả về toàn bộ dữ liệu nếu không thỏa if
				}
				const savedColumnState = await getItemFromIndexedDB2(tableCol);
				let updatedColDefs = [
					// {
					// 	pinned: 'left',
					// 	width: '40',
					// 	field: 'delete',
					// 	suppressHeaderMenuButton: true,
					// 	cellStyle: { textAlign: 'center' },
					// 	headerName: '',
					// 	cellRenderer: (params) => {
					// 		if (!params.data || !params.data.id) {
					// 			return null;
					// 		}
					// 		return (
					// 			<PopupDeleteRenderer {...params.data} id={params.data.id} table={table}
					// 								 reloadData={onGridReady} setLoading={setLoading} />
					// 		);
					// 	},
					// 	editable: false,
					// },
					{
						field: 'checkbox',
						headerName: '',
						width: 30,
						pinned: 'left',
						checkboxSelection: true,
						headerCheckboxSelection: true,
						suppressHeaderMenuButton: true,
						editable: false,
					},
					...(type === 'CF' ? [{
						field: 'daHopNhat',
						headerName: 'Hợp nhất',
						width: 120,
						pinned: 'left',
						cellRenderer: (params) => {
							return <div style={{ textAlign: 'center' }}>
								{params.data.daHopNhat ? <p style={{ color: 'green' }}>Đã hợp nhất</p> : <p style={{ color: 'red' }}>Chưa hợp nhất</p>}
							</div>
						},
					}] : []),
					{
						field: 'id',
						width: 70,
						pinned: 'left',
						headerName: 'ID',
						...filter(),
					},
					{
						field: 'company',
						headerName: 'Công ty',
						width: 80,
						pinned: 'left',
						suppressHeaderMenuButton: true,
						...filter(),
						...await EditTable(),
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: listCompany.map((p) => p.code),
						},
					},
					{
						field: 'day',
						headerName: 'Ngày',
						suppressHeaderMenuButton: true,
						width: 50,
						pinned: 'left',
						// cellEditor: MuiDatePickerCellEditor,
						...filter(),
						comparator: (valueA, valueB) => {
							const dayA = parseInt(valueA, 10);
							const dayB = parseInt(valueB, 10);
							if (dayA < dayB) {
								return -1;
							}
							if (dayA > dayB) {
								return 1;
							}
							return 0;
						},
						...await EditTable(),
						hide: isShowAll1,
					},
					{
						field: 'month',
						headerName: 'Tháng',
						width: 60,
						pinned: 'left',
						...filter(),
						...sortMoi(),
						...await EditTable(),
						valueFormatter: (params) => {
							return +params.value;
						},
					},
					{
						field: 'year',
						headerName: 'Năm',
						width: 50,
						pinned: 'left',
						...filter(),
						...sortMoi(),
						...await EditTable(),
						valueFormatter: (params) => {
							return +params.value;
						},
					},
					// {
					// 	field: 'phan_loai',
					// 	headerName: 'Cash Offset',
					// 	width: 80,
					// 	...filter(),
					// 	pinned: 'left',
					// 	hide: company !== 'HQ',
					// },
					// {
					// 	field: 'phan_loai2',
					// 	headerName: 'Pl',
					// 	width: 50,
					// 	...filter(),
					// 	pinned: 'left',
					// 	hide: company === 'HQ',
					// 	editable: false,
					// },
					{
						field: 'diengiai',
						headerName: 'Diễn giải',
						width: 250,
						pinned: 'left',
						...filter(),
						...await EditTable(),
					},
					{
						field: 'tk_no',
						// headerName: 'Tài khoản nợ',
						headerName: 'Tài khoản',
						width: 100,
						...filter(),
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: [...new Set(listVas.map(vas => vas?.ma_tai_khoan))],
						},
						...checkInput(listVas, 'ma_tai_khoan'),
						...await EditTable(),
					},
					{
						field: 'tk_co',
						// headerName: 'Tài khoản có',
						headerName: 'Tài khoản đối ứng',
						width: 150,
						...filter(),
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: [...new Set(listVas.map(vas => vas?.ma_tai_khoan))]
							,
						},
						...checkInput(listVas, 'ma_tai_khoan'),
						...await EditTable(),
					},


					{
						field: 'ps_no',
						headerName: 'Phát sinh nợ',
						width: 140,
						headerClass: 'right-align-important',
						valueFormatter: (params) => formatCurrency(params.value),
						cellStyle: { textAlign: 'right' },
						...filter(),
						hide: isShowAll1,
						...await EditTable(),
					},

					{
						field: 'ps_co',
						headerName: 'Phát sinh có',
						width: 140,
						headerClass: 'right-align-important',
						valueFormatter: (params) => formatCurrency(params.value),
						cellStyle: { textAlign: 'right' },
						...filter(),
						hide: isShowAll1,
						...await EditTable(),
					},
					{
						field: 'so_tien',
						headerName: 'Số tiền',
						width: 140,
						headerClass: 'right-align-important',
						valueFormatter: (params) => formatCurrency(params.value),
						cellStyle: { textAlign: 'right' },
						...filter(),
						editable: false,
						...sortMoi(),
					},
					// {
					// 	field: 'vender',
					// 	headerName: 'Khách hàng',
					// 	width: 120,
					// 	...filter(),
					// 	cellEditor: 'agRichSelectCellEditor',
					// 	cellEditorParams: {
					// 		allowTyping: true,
					// 		filterList: true,
					// 		highlightMatch: true,
					// 		values: [...new Set(listVendor.map(vas => vas?.name))],
					// 	},
					// 	...checkInput(listVendor, 'name'),
					// 	...await EditTable(),
					// 	hide: isShowAll1,
					// },
					// {
					// 	field: 'hoaDon',
					// 	headerName: 'Hóa đơn',
					// 	width: 120,
					// 	...filter(),
					// 	...await EditTable(),
					// 	hide: isShowAll1,
					// },
					// {
					// 	field: 'soChungTu',
					// 	headerName: 'Chứng từ',
					// 	width: 120,
					// 	...filter(),
					// 	...await EditTable(),
					// 	hide: isShowAll1,
					// },
					// {
					// 	field: 'kmns',
					// 	headerName: 'Khoản mục thu chi',
					// 	width: 180,
					// 	...filter(),
					// 	...uniqueCellEditor({ list: listKmns, key: 'name' }),
					// 	...checkInput(listKmns, 'name'),
					// 	...await EditTable(),
					// },

					{
						field: 'kmf',
						headerName: 'Khoản mục phí',
						width: 180,
						...filter(),
						...uniqueCellEditor({ list: listKmf, key: 'name' }),
						...checkInput(listKmf, 'name'),
						...await EditTable(),
					},
					//
					// {
					// 	field: 'costPool',
					// 	headerName: 'Nhóm chi phí',
					// 	width: 180,
					// 	...filter(),
					// 	...uniqueCellEditor({ list: listCostPool, key: 'code' }),
					// 	...checkInput(listCostPool, 'name'),
					// 	...await EditTable(),
					// },

					{
						field: 'project',
						headerName: 'Vụ việc',
						width: 140,
						...filter(),
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: [...new Set(listProject.map(vas => vas?.name))],
						},
						...checkInput(listProject, 'name'),
						...await EditTable(),
						hide: isShowAll1,
					},
					{
						field: 'unit_code',
						headerName: 'Đơn vị',
						width: 120,
						...filter(),
						...await EditTable(),
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: [...new Set(listUnit.map(vas => vas?.name))],
						},
						hide: isShowAll1,
					},
					{
						field: 'product',
						headerName: 'Sản phẩm',
						width: 120,
						...filter(),
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: [...new Set(listProduct.map(vas => vas?.name))],
						},
						...checkInput(listProduct, 'dp'),
						...await EditTable(),
						hide: isShowAll1,
					},
					// {
					// 	field: 'hopDong',
					// 	headerName: 'Hợp đồng',
					// 	width: 120,
					// 	...filter(),
					// 	...await EditTable(),
					// 	hide: isShowAll1,
					// },
					{
						field: 'chuThich',
						headerName: 'Chú thích',
						width: 120,
						...filter(),
						hide: isShowAll1,
					},
					{
						field: 'pl_type',
						headerName: 'PL Type',
						width: 140,
						...filter(),
						editable: false,
					},
					// {
					// 	field: 'cf_Check',
					// 	headerName: 'PL Check',
					// 	width: 140,
					// 	editable: false,
					// 	...filter(),
					// 	...sortMoi(),
					// },
					{
						field: 'pl_value',
						headerName: 'PL Value',
						editable: false,
						width: 140,
						valueFormatter: (params) => formatCurrency(params.value),
						...filter(),
						...sortMoi(),
					},
					// {
					// 	field: 'cash_value',
					// 	headerName: 'Cash Value',
					// 	width: 140,
					// 	editable: false,
					// 	valueFormatter: (params) => formatCurrency(params.value),
					// 	...filter(),
					// 	...await EditTable(),
					// 	...sortMoi(),
					// },

					{
						field: 'consol',
						suppressHeaderMenuButton: true,
						headerName: 'Consol',
						width: 100,
						...filter(),
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: ['CONSOL', ''],
						},
						...await EditTable(),
					},

					{
						field: 'noiBo',
						suppressHeaderMenuButton: true,
						headerName: 'Nội bộ',
						width: 100,
						...filter(),
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: ['x', ''],
						},
						hide: isShowAll1,
					},
					{
						field: 'isDuplicated',
						headerName: '',
						suppressHeaderMenuButton: true,
						width: 100,
						valueFormatter: (params) => {
							if (params.value > 0) return 'Tự tạo';
							else return '';
						},
						hide: isShowAll1,
					},
					{
						field: 'isUse',
						headerName: 'Sử dụng',
						width: 100,
						...filter(),
						cellRenderer: 'agCheckboxCellRenderer',
						cellEditor: 'agCheckboxCellEditor',
						...await EditTable(),
						hide: isShowAll1,
					},
				];
				if (savedColumnState.length) {
					setColDefs(loadColumnState(updatedColDefs, savedColumnState));
				} else {
					setColDefs(updatedColDefs);
				}

			} catch (error) {
				console.log(error);
			}
		};
		fetchData();
	}, [onGridReady, table, isShowAll1, loading, showClearFilter, checkColumn]);

	const handleAddRow = async () => {
		const dateTimeString = getCurrentDateTimeWithHours();
		const [day, month] = dateTimeString.split('/');

		const newItems = {
			show: true,
			createAt: dateTimeString,
			ps_no: 0,
			ps_co: 0,
			day: +day,
			month: +month,
			year: currentYearKTQT,
			company: company !== 'HQ' ? company : '',
			consol: company === 'HQ' ? 'CONSOL' : '',
			phan_loai2: company === 'Group' ? 'GE' : '',
		};
		await handleAddAgl(company, newItems, table, onGridReady, setIsUpdateNoti, isUpdateNoti);
		setLoading(true);
		loadData();
	};

	const handleCGCompanies = (row) => {
		row.so_tien = parseCurrencyInput(row.ps_no) - parseCurrencyInput(row.ps_co);
		let so_tien = parseFloat(row.so_tien);
		let tk_no = row.tk_no + '';
		let tk_co = row.tk_co + '';

		if (tk_no) {
			// Update PL Type based on the updated logic
			if (tk_no.startsWith('911') || tk_co.startsWith('911')) {
				row.pl_type = 'KC';
			} else if (tk_no.startsWith('511')) {
				row.pl_type = 'DT';
			} else if (tk_no.startsWith('635')) {
				row.pl_type = 'CFTC';
			} else if (tk_no.startsWith('62') || tk_no.startsWith('63')) {
				row.pl_type = 'GV';
			} else if (tk_no.startsWith('52') || tk_no.startsWith('641')) {
				row.pl_type = 'CFBH';
			} else if (tk_no.startsWith('642')) {
				row.pl_type = 'CFQL';
			} else if (tk_no.startsWith('515')) {
				row.pl_type = 'DTTC';
			} else if (tk_no.startsWith('71')) {
				row.pl_type = 'DTK';
			} else if (tk_no.startsWith('811')) {
				row.pl_type = 'CFK';
			} else if (tk_no.startsWith('821')) {
				row.pl_type = 'TAX';
			} else {
				row.pl_type = '';
			}

			// Update PL Value based on PL Type
			if (['DT', 'DTK', 'DTTC', 'GV', 'CFK', 'CFTC', 'CFBH', 'CFQL', 'TAX'].includes(row.pl_type)) {
				row.pl_value = -so_tien;
			} else {
				row.pl_value = '';
			}

			// Update Cash Value based on cash flow check
			if (tk_no.startsWith('11') && tk_co.startsWith('11')) {
				row.cash_value = 0;
			} else if (tk_no.startsWith('11')) {
				row.cash_value = so_tien;
			} else {
				row.cash_value = '';
			}
		}
	};

	const handleCellValueChanged = async (event) => {

		setHasUnsavedChanges(true);

		const updatedData = {
			...event.data,
			ps_no: parseCurrencyInput(event.data.ps_no),
			ps_co: parseCurrencyInput(event.data.ps_co),
			so_tien: parseCurrencyInput(event.data.ps_no) - parseCurrencyInput(event.data.ps_co),
		};

		// Cập nhật dữ liệu tạm thời
		setTempData(prevData => {
			const existingIndex = prevData.findIndex(row => row.id === updatedData.id);
			if (existingIndex !== -1) {
				// Cập nhật bản ghi đã tồn tại
				const newData = [...prevData];
				newData[existingIndex] = updatedData;
				return newData;
			} else {
				// Thêm bản ghi mới
				return [...prevData, updatedData];
			}
		});

		// Refresh affected cells
		event.api.refreshCells({
			rowNodes: [event.node],
			columns: ['cash_value', 'pl_value', 'pl_type', 'pl_check'],
		});
	};

	const handleSaveChanges = async () => {
		if (!hasUnsavedChanges) return;

		setLoading(true);
		try {

			tempData.forEach(row => {
				let company = row.company;
				if (row.company != null && row.company !== '' && row.company !== undefined) {
					if (row.unit_code != null && row.unit_code !== '' && row.unit_code !== undefined) {
						row.unit_code2 = `${row.unit_code}-${company}`;
						if (row.product != null && row.product !== '' && row.product !== undefined) {
							row.product2 = `${row.product}-${company}-${row.unit_code}`;
						}
						if (row.kenh != null && row.kenh !== '' && row.kenh !== undefined) {
							row.kenh2 = `${row.kenh}-${company}-${row.unit_code}`;
						}
						if (row.project != null && row.project !== '' && row.project !== undefined) {
							row.project2 = `${row.project}-${company}-${row.unit_code}`;
						}
					}

				}
			});

			await handleSaveAgl(tempData, table, setTempData, setIsUpdateNoti, isUpdateNoti);
			setTimeout(() => {
				setHasUnsavedChanges(false);
				loadData();
				setLoading(false);
			}, 300);
		} catch (error) {
			console.error('Error saving changes:', error);
		} finally {
		}
	};

	const onSelectionChanged = () => {
		const selectedData = gridRef.current.api.getSelectedNodes().map((node) => node.data);
		setSelectedRows(selectedData);
	};

	async function handleCreateNoiBo() {
		setLoading(true);
		setIsSyncing2(true); // Bắt đầu hiệu ứng xoay
		listNoiBo.map(async (e) => {
			await handleAddAgl(
				company,
				{
					...e,
					id: null,
					unit_code: 'Internal',
					unit_code2: 'Internal-' + e.company,
					isDuplicated: e.id,
					diengiai: '[AUTO_RECORD]Loại trừ giao dịch nội bộ',
					so_tien: -e.so_tien,
					pl_value: -e.pl_value,
					cash_value: -e.cash_value,
					phan_loai2: 'IE',
				},
				table,
			);
		});
		setTimeout(() => {
			localStorage.removeItem('lastIdFE');
			loadData();
			setIsSyncing2(false); // Bắt đầu hiệu ứng xoay
		}, 1000);
	}

	function sortMoi() {
		return {
			comparator: (valueA, valueB) => {
				let a = parseFloat(valueA?.replace(/[^\d.-]/g, ''));
				let b = parseFloat(valueB?.replace(/[^\d.-]/g, ''));
				const isANaN = isNaN(a);
				const isBNaN = isNaN(b);
				if (isANaN && isBNaN) {
					return 0;
				}
				if (isANaN) {
					return 1;
				}
				if (isBNaN) {
					return -1;
				}
				return a - b;
			},
		};
	}

	const handleGianLuoc = () => {
		setShowAll1(!isShowAll1);
	};

	const handleSortDoanhThu = () => {
		setIsSortDoanhThu((prev) => {
			return !prev;
		});
	};

	const handleSortChiPhi = () => {
		setIsSortChiPhi((prev) => {
			return !prev;
		});
	};

	const handleSortByDay = () => {
		setIsSortByDay(!isSortByDay);
	};

	function renderCompanyLabel() {
		let companyObject = listCompany.find(e => e.code === company);
		if (companyObject) return companyObject.code; else return company;
	}

	const onFilterChanged = () => {
		const filterModel = gridRef.current.api.getFilterModel();

		if (Object.keys(filterModel).length !== 0) {
			sessionStorage.setItem('agGridFilters', JSON.stringify(filterModel));
			setShowClearFilter(true);
		} else {
			sessionStorage.removeItem('agGridFilters');
		}
	};

	const clearFilters = () => {
		// Kiểm tra nếu grid đã sẵn sàng
		if (gridRef.current && gridRef.current.api) {
			gridRef.current.api.setFilterModel(null); // Xóa tất cả bộ lọc
			loadData();
		}
		setShowClearFilter(false);
	};

	const handleUpdatePLValue = async () => {
		const skt = await getAllSoKeToan();
		setLoading(true);
		setCountUpdate(skt.length);
		for (const e of skt) {
			handleCGCompanies(e);
			await updateSoKeToan(e).then(() => setCountUpdate(prevState => prevState - 1));
		}
		setLoading(false);
	};

	function handleFilterNotKM(dataFilter) {
		gridRef.current.api.setRowData(dataFilter);
		setShowClearFilter(true);
	}

	// Add new function to handle bulk delete
	const handleBulkDelete = async () => {
		if (!selectedRows.length) return;
		setLoading(true);
		try {
			// Get all IDs from selected rows
			const ids = selectedRows.map(row => row.id).filter(id => id);

			// Delete all selected rows at once
			await deleteBulkSoKeToan(ids);

			// Clear selection after deletion
			setSelectedRows([]);
			// Reload data
			setTimeout(() => {
				loadData();
				setLoading(false);
			}, 300);
		} catch (error) {
			console.error('Error deleting rows:', error);
		}
	};

	const handleCreateBulk = async () => {

		const dateTimeString = getCurrentDateTimeWithHours();
		const [day, month] = dateTimeString.split('/');
		const newData = [{
			show: true,
			createAt: dateTimeString,
			ps_no: 0,
			ps_co: 0,
			day: +day,
			month: +month,
			year: currentYearKTQT,
			company: currentCompanyKTQT,
			consol: company === 'HQ' ? 'CONSOL' : '',
			phan_loai2: company === 'Group' ? 'GE' : '',
		}]; // Tạo dữ liệu mới mà bạn muốn thêm vào
		try {
			setLoading(true);
			await createBulkNewSoKeToan(newData);
			setTimeout(async () => {
				loadData(); // Reload dữ liệu sau khi tạo mới
				setLoading(false);
			}, 300);
		} catch (error) {
			console.error('Error creating new records:', error);
		} finally {
		}
	};

	const handleCreateDM = async () => {
		if (selectedRows.length === 0) return;

		// Kiểm tra điều kiện kmf và kmfGoc
		// const hasInvalidKmf = selectedRows.some(item =>
		// 	(!item.kmf || item.kmf === '') && item.kmfGoc
		// );
		// if (hasInvalidKmf) {
		// 	message.error('Bạn cần đồng bộ danh mục Khoản mục phí trong bước trước mới có thể hợp nhất dữ liệu');
		// 	return;
		// }

		setLoading(true);
		try {
			await createDM(selectedRows);
			selectedRows.forEach(item => {
				item.daHopNhat = true
			})
			await handleSaveAgl(selectedRows, table, setTempData, setIsUpdateNoti, isUpdateNoti);
			message.success('Hợp nhất xong!');
			setTimeout(async () => {
				await loadData();
			}, 300)
		} catch (error) {
			console.error('Error creating SoKeToan records:', error);
		}
	};

	return (
		<div style={{ marginTop: '10px' }}>
			<div className={css.headerPowersheet}>

					{call ? type && type == 'CF' ?
						<div className={css.headerTitle} style={{ display: 'flex', alignItems: 'center', marginRight: '10px', justifyContent: 'space-between', width: '100%' }}>
								<span>Chi phí</span>

								<Switch
									checked={showDaHopNhat}
									onChange={() => {
										setShowDaHopNhat(!showDaHopNhat);
										setLoading(true);
										loadData();
									}}
									checkedChildren="Đã hợp nhất"
									unCheckedChildren="Chưa hợp nhất"
								/>
							</div>



					 :
					  <div className={css.headerTitle} style={{ display: 'flex', alignItems: 'center', marginRight: '10px', justifyContent: 'space-between', width: '100%' }}>
						<span>Hợp nhất số liệu</span>
						</div>
					 :
						<div className={css.headerTitle} style={{ display: 'flex', alignItems: 'center', marginRight: '10px', justifyContent: 'space-between', width: '100%' }}>
						<span>Sổ hợp nhất</span>
						</div>
					 }

			</div>
			<div className={css.headerPowersheet2}>
				{call ? (
					<>
						{type && type == 'CF' && (<>


							<div className={css.headerAction}>
								{hasUnsavedChanges && (
									<div
										className={`${css.headerActionButton} ${css.buttonOn}`}
										onClick={handleSaveChanges}
									>
										<span>Lưu thay đổi</span>
									</div>
								)}
								{selectedRows.length > 0 && (
									<div
										className={`${css.headerActionButton} ${css.buttonOn}`}
										onClick={handleBulkDelete}
									>
										<span>Xóa ({selectedRows.length}) dòng đã chọn</span>
									</div>
								)}
								{type && type == 'CF' && selectedRows.length > 0 && (<>
									<div
										className={`${css.headerActionButton} ${css.buttonOn}`}
										onClick={handleCreateDM}
									>
										<span>Hợp nhất ({selectedRows.length})</span>
									</div>
								</>)}


							</div>
						</>)}
					</>
				) : (
					<>
						<div className={css.toogleChange2}>
							<ActionToggleSwitch label="Đọc Doanh thu" isChecked={isSortDoanhThu}
												onChange={handleSortDoanhThu} />
							<ActionToggleSwitch label="Đọc Chi phí" isChecked={isSortChiPhi}
												onChange={handleSortChiPhi} />
							<ActionToggleSwitch label="Đọc Giản lược" isChecked={isShowAll1}
												onChange={handleGianLuoc} />
						</div>
						<div className={css.headerAction}>
							{selectedRows.length > 0 && (
								<div
									className={`${css.headerActionButton} ${css.buttonOn}`}
									onClick={handleBulkDelete}
								>
									<span>Xóa ({selectedRows.length}) dòng đã chọn</span>
								</div>
							)}
							{hasUnsavedChanges && (
								<div
									className={`${css.headerActionButton} ${css.buttonOn}`}
									onClick={handleSaveChanges}
								>
									<span>Lưu thay đổi</span>
								</div>
							)}
							{showClearFilter && (
								<div className={`${css.headerActionButton} ${css.buttonOn}`} onClick={clearFilters}>
									<span>Bỏ bộ lọc</span>
								</div>
							)}
							<div className={`${css.headerActionButton}`}>
								{rowDataKMF.length > 0 &&
									<div className={css.checkKM} onClick={() => {
										handleFilterNotKM(rowDataKMF);
									}}>
										{loadingCount ? <LoadingOutlined /> : <>Có {rowDataKMF.length} bút toán chưa
											điền KM
											KQKD</>}

									</div>}
								{rowDataKMNS.length > 0 &&
									<div className={css.checkKM} onClick={() => {
										handleFilterNotKM(rowDataKMNS);
									}}>
										{loadingCount ? <LoadingOutlined /> : <>Có {rowDataKMNS.length} bút toán chưa
											điền KM
											TC</>}

									</div>}
							</div>

							{company !== 'Internal' ? (
								<ActionCreate handleAddRow={handleCreateBulk} />
							) : (
								''
							)}
							<Dropdown
								open={isDropdownOpen}
								onOpenChange={handleDropdownToggle}
								dropdownRender={() => (
									<div className={css.dropdownMenu}>
										<ExportableGrid
											api={gridRef.current ? gridRef.current.api : null}
											columnApi={gridRef.current ? gridRef.current.columnApi : null}
											table={table}
											isDropdownOpen={isDropdownOpen}
											isSortByDay={isSortByDay}
											handleSortByDay={handleSortByDay}
											handleCreateNoiBo={handleCreateNoiBo}
										/>
										<div
											style={{
												display: 'flex',
												justifyContent: 'center',
												flexDirection: 'column',
												alignItems: 'start',
												height: '100%',
												width: '100%',
											}}
										>
											<button
												onClick={handleUpdatePLValue}
												className={css.dropdownItem}
												aria-label="Export"
											>
												<span>Cập nhật PL</span>
											</button>
										</div>
									</div>
								)}
								trigger={['click']}
							>
								<img
									src={EllipsisIcon}
									style={{ width: 32, height: 32, cursor: 'pointer' }}
									alt="Ellipsis Icon"
								/>
							</Dropdown>
							{/*)}*/}
						</div>
					</>
				)

				}

			</div>

			<div
				style={{
					height: (company === 'Group' || company === 'Internal') ? '72.5vh' : '77.5vh',
					display: 'flex',
					flexDirection: 'column',
					marginTop: '15px',
				}}
			>

				{(editCount >= 100 || loading) && (
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '100%',
							width: '100%',
							position: 'absolute',
							// top: 0,
							// left: 0,
							zIndex: '2000',
							backgroundColor: 'rgba(255, 255, 255, 0.96)',
						}}
					>
						<img src="/loading_moi_2.svg" alt="Loading..." style={{ width: '150px', height: '150px' }} />
						{editCount >= 100 && <>Đang xử lý {editCount} bản ghi</>}
						{countUpdate > 0 && <>Số bản ghi còn lại {countUpdate} bản ghi</>}
					</div>
				)}
				<div className="ag-theme-quartz" style={{ height: call ? '90%' : '95%', width: '100%' }}>
					<AgGridReact
						statusBar={statusBar}
						enableRangeSelection
						ref={gridRef}
						onSelectionChanged={onSelectionChanged}
						defaultColDef={defaultColDef}
						columnDefs={colDefs}
						rowSelection="multiple"
						animateRows={true}
						onCellValueChanged={handleCellValueChanged}
						suppressRowClickSelection={true}
						localeText={AG_GRID_LOCALE_VN}
						onGridReady={onGridReady}
						onFilterChanged={onFilterChanged}
						rowData={rowData}

						// Pagination configuration
						pagination={true}
						paginationPageSize={50000}
						paginationPageSizeSelector={[50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000]}
						suppressPaginationPanel={false}
					/>
				</div>
			</div>
		</div>
	);
}

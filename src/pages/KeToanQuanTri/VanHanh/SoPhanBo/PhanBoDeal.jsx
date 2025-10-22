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
import '../../../Home/AgridTable/agComponent.css';

// ----- MUI -----
import { getAllKmf } from '../../../../apisKTQT/kmfService.jsx';
import { getAllCoCauPhanBo } from '../../../../apisKTQT/coCauPhanBoService.jsx';
import { EllipsisIcon, RefIcon } from '../../../../icon/IconSVG.js';
import { createNewDeal, getAllDeal } from '../../../../apisKTQT/dealService.jsx';
import TooltipHeaderIcon from '../../HeaderTooltip/TooltipHeaderIcon.jsx';
import pLimit from 'p-limit';
import { MyContext } from '../../../../MyContext.jsx';
import { SortMoi } from '../../functionKTQT/SortMoi.jsx';
import AG_GRID_LOCALE_VN from '../../../Home/AgridTable/locale.jsx';
import { formatCurrency, formatCurrencyString } from '../../functionKTQT/formatMoney.js';
import { handleSaveAgl } from '../../functionKTQT/handleSaveAgl.js';
import css from '../../KeToanQuanTriComponent/KeToanQuanTri.module.css';
import { getAllSoKeToan } from '../../../../apisKTQT/soketoanService.jsx';

const limit = pLimit(5);
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function PhanBoDeal({ company, call }) {
	const [editCount, setEditCount] = useState(0);
	const [isLoaded, setIsLoaded] = useState(false);
	const table = 'SoPhanBoDeal';
	const gridRef = useRef();
	const { listCCPB, loadDataSoKeToan, currentYearKTQT, currentCompanyKTQT } = useContext(MyContext);
	const [selectedYear, setSelectedYear] = useState(`${currentYearKTQT}`);
	const [listYear, setListYear] = useState([]);
	// const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
	const [rowData, setRowData] = useState([]);
	const [colDefs, setColDefs] = useState([]);
	const [updatedData, setUpdatedData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [listDeal, setListDeal] = useState([]);
	const [show, setShow] = useState(false);
	const [listCoChePhanBo, setListCoChePhanBo] = useState([]);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);

	const [searchInput, setSearchInput] = useState('');
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	const getLocalStorageSettings = () => {
		const storedSettings = JSON.parse(localStorage.getItem(table));
		return {
			selectedButton: storedSettings?.selectedButton ?? null,
			isSortByDay: storedSettings?.isSortByDay ?? true,
		};
	};
	const [isSortByDay, setIsSortByDay] = useState(getLocalStorageSettings().isSortByDay);
	const [selectedButton, setSelectedButton] = useState(getLocalStorageSettings().selectedButton);
	useEffect(() => {
		const tableSettings = {
			selectedButton,
			isSortByDay,
		};
		localStorage.setItem(table, JSON.stringify(tableSettings));
	}, [selectedButton, isSortByDay]);

	const handleFilterText = (event) => {
		setSearchInput(event.target.value);
	};
	const handleDropdownToggle = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	const handleClickOutside = (event) => {
		if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
			setIsDropdownOpen(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);
	const defaultColDef = useMemo(() => {
		return {
			filter: true,
			cellStyle: { fontSize: '14.5px' },
			editable: false,
			cellClassRules: {
				'cell-small': (params) => params.colDef.width < 150,
			},
		};
	});
	const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

	async function loadData() {
		setLoading(true);
		let listYearsss;
		let data = await loadDataSoKeToan();
		listYearsss = [...new Set(data.filter(e => e.year && e.year !== '').map(e => e.year))];
		setListYear(listYearsss);
		if (currentCompanyKTQT === 'HQ') data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
		else data = data.filter((e) => e.company?.toLowerCase() === currentCompanyKTQT.toLowerCase())
		if (selectedYear !== 'toan-bo') {
			data = data.filter(e => e.year == selectedYear);
		}
		let listDeal = await getAllDeal();
		data = data.sort((a, b) => b.id - a.id).filter((e) => e.pl_type !== null && e.pl_type !== '');
		for (let i = 0; i < data.length; i++) {
			for (let j = 0; j < listDeal.length; j++) {
				let unitCode = listDeal[j].code;
				data[i]['pb' + unitCode] = null;
			}
		}
		for (let i = 0; i < data.length; i++) {
			if (data[i].PBDEAL !== null) {
				let parsedPBDEAL = JSON.parse(data[i].PBDEAL);
				parsedPBDEAL.teams.forEach((team) => {
					data[i]['pb' + team.team] = +team.tien || 0;
				});
				let sumTien = parsedPBDEAL.teams.reduce((total, team) => {
					const tien = parseFloat(team.tien);
					return total + (isNaN(tien) ? 0 : tien);
				}, 0);
				if (Math.abs(sumTien - data[i].pl_value) > 10) {
					data[i].check = 'Lệch ' + formatCurrency(data[i].pl_value - sumTien);
				}
			}
			if (data[i].deal2 !== null && data[i].deal2 !== '' && (!data[i].CCPBDEAL || data[i].CCPBDEAL === '')) {
				data[i]['pb' + data[i].deal2] = +data[i].pl_value || 0;
				data[i].CCPBDEAL = 'Trực tiếp';
			}
		}
		if (selectedButton) {
			if (selectedButton) {
				if (selectedButton === 'Gián tiếp') {
					data = data.filter(item => item.CCPBDEAL !== 'Tùy chỉnh' && item.CCPBDEAL !== 'Trực tiếp');
				} else {
					data = data.filter(item => item.CCPBDEAL === selectedButton);
				}
			}
		}
		if (isSortByDay) {
			// Sắp xếp theo id
			data = data.sort((a, b) => b.id - a.id);
		} else {
			// Sắp xếp theo day, month, year từ ngày gần nhất đến xa nhất
			data = data.sort((a, b) => {
				// Chuyển đổi các giá trị thành số nguyên để so sánh
				let dateA = new Date(a.year, a.month - 1, a.day);
				let dateB = new Date(b.year, b.month - 1, b.day);
				return dateB - dateA; // Ngày mới nhất đứng trước
			});
		}
		setRowData(data);
		setLoading(false);
	}

	useEffect(() => {
		loadData();
	}, [selectedButton, isSortByDay]);
	const onGridReady = useCallback(async () => {
		loadData();
	}, []);
	useEffect(() => {
		loadData();
		setLoading(true);
		getAllDeal().then((data) => {
			setListDeal(data);
		});
		getAllCoCauPhanBo().then((data) => {
			data.push({ name: 'Trực tiếp', type: 'Deal', dp2: 1 });
			setListCoChePhanBo(data);
		});
	}, [selectedYear]);
	const handleCheckPhanbo = async () => {
		try {
			let data = await getAllSoKeToan();
			let dataKmf = await getAllKmf();
			const dataFilter = data.filter(
				(item) =>
					(item.CCPBDEAL === null || item.CCPBDEAL === undefined || item.CCPBDEAL === '') &&
					(!item.deal2 || item.deal2 === ''),
			);

			const updatedData = dataFilter.map((item) => {
				const kmfMatch = dataKmf.find((kmf) => kmf.name === item.kmf);

				if (kmfMatch) {
					item.CCPBDEAL = kmfMatch.dp3;
					let ccpb = listCoChePhanBo.find((e) => e.name === kmfMatch.dp3);
					updateCCPBSPData({ data: item }, ccpb);
				}

				return item;
			});
			for (let item of updatedData) {
				if (item.CCPBDEAL) {
					await handleSaveAgl([item], table, setUpdatedData);
				}
			}
			loadData();
		} catch (error) {
			console.error('Error processing data: ', error);
		}
	};

	function createDonViField() {
		let dvField = [];
		listDeal.map((unit) => {
			dvField.push({
				field: `pb${unit.code}`,
				headerClass: 'right-align-important',
				width: 110,
				headerName: `${unit.code}`,
				cellStyle: { textAlign: 'right' },
				editable: true,
				valueFormatter: (params) => formatCurrency(params.value),
				...filter(),
			});
		});
		if (searchInput) {
			dvField = dvField.filter((field) =>
				field.headerName.toLowerCase().includes(searchInput.toLowerCase()),
			);
		}
		return dvField;
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

	useEffect(() => {
		const fetchData = async () => {
			try {
				setColDefs([
					{
						field: 'id',
						width: 70,
						headerName: 'ID',
						hide: false,
					},
					{
						field: 'diengiai',
						headerName: 'Diễn Giải',
						width: 350,
						...filter(),
					},
					{
						field: 'month',
						headerName: 'Tháng',
						width: 70,
						suppressHeaderMenuButton: true,
						...filter(),
						...SortMoi(),
					},
					{
						field: 'year',
						headerName: 'Năm',
						width: 70,
						suppressHeaderMenuButton: true,
						...filter(),
						...SortMoi(),

					},
					{
						field: 'pl_type',
						headerName: 'PL Type',
						width: 70,
						suppressHeaderMenuButton: true,
						...filter(),
					},
					{
						field: 'deal',
						headerName: 'Deal',
						suppressHeaderMenuButton: true,
						width: 110,
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: listDeal.map((p) => p.name),
						},
						...filter(),
						editable: true,
					},
					{
						field: 'pl_value',
						headerName: 'Số tiền',
						width: 140,
						headerClass: 'right-align-important',
						valueFormatter: (params) => formatCurrency(params.value),
						cellStyle: { textAlign: 'right' },
						...filter(),
						...SortMoi(),
					},
					{
						field: 'CCPBDEAL',
						headerName: 'Cơ Chế Phân Bổ',
						width: 140,
						editable: true,
						cellEditor: 'agRichSelectCellEditor',
						cellEditorParams: {
							allowTyping: true,
							filterList: true,
							highlightMatch: true,
							values: listCoChePhanBo.filter((e) => e.dp2 == 1 && e.type === 'Deal').map((p) => p.name),
						},
						...filter(),
					},
					{
						field: 'kmf',
						headerName: 'Khoản mục phí',
						width: 150,
						suppressHeaderMenuButton: true,
						...filter(),
					},
					...createDonViField(),
					{
						field: 'check',
						headerName: 'Check',
						width: 150,
						suppressHeaderMenuButton: true,
						...filter(),
						headerClass: 'right-align-important',
						cellStyle: { textAlign: 'right' },
						valueFormatter: (params) => formatCurrencyString(params.value),

					},
				]);
			} catch (error) {
				console.log(error);
			}
		};
		fetchData();
	}, [onGridReady, rowData, table, searchInput]);

	function calculateTeamsPBDEAL(teams, soTien) {
		let totalSoChot = teams.reduce((sum, team) => sum + parseInt(team.so_chot, 10), 0);
		teams.forEach((team) => {
			team.tien = (parseFloat(soTien) / totalSoChot) * parseInt(team.so_chot, 10);
		});
	}

	function updateCCPBSPData(event, ccpb) {
		const teamsMap = {};

		ccpb.PB.forEach((item) => {
			const team = item.ten_don_vi;
			const thangValue = item[`thang_${event.data.month}`];
			if (thangValue !== null) {
				teamsMap[team] = teamsMap[team] || { team: team, so_chot: 0, tien: 0 };
				teamsMap[team].so_chot = thangValue;
			}
		});

		const teamsArray = Object.values(teamsMap);
		calculateTeamsPBDEAL(teamsArray, event.data.pl_value);
		event.data.PBDEAL = JSON.stringify({ teams: teamsArray });
	}

	function updateTeamValue(teams, unit, newValue) {
		const existingTeam = teams.find((team) => team.team === unit);

		if (existingTeam) {
			existingTeam.tien = newValue;
		} else {
			teams.push({ team: unit, tien: newValue });
		}
	}

	const handleCellValueChanged = async (event) => {
		try {
			let updateField = event.colDef.field;
			if (updateField === 'CCPBDEAL') {
				if (event.newValue === 'Trực tiếp') {
					event.data.PBDEAL = null;
				} else {
					let ccpb = listCoChePhanBo.find((e) => e.name === event.newValue);
					updateCCPBSPData(event, ccpb);
				}
			}
			if (updateField.startsWith('pb')) {
				let unit = updateField.split('pb')[1];
				let newValue = event.newValue;
				if (!event.data.PBDEAL) {
					event.data.PBDEAL = '{"teams":[]}';
				}
				let teams = JSON.parse(event.data.PBDEAL).teams;
				updateTeamValue(teams, unit, newValue);
				event.data.PBDEAL = JSON.stringify({ teams: teams });
				event.data.CCPBDEAL = 'Tùy chỉnh';
			}
			if (updateField === 'deal') {
				if (event.data.company != null && event.data.company !== '' && event.data.company !== undefined) {
					if (event.data.unit_code != null && event.data.unit_code !== '' && event.data.unit_code !== undefined) {
						if (event.data.deal != null && event.data.deal !== '' && event.data.deal !== undefined) {
							event.data.deal2 = `${event.data.deal}-${event.data.company}-${event.data.unit_code}`;
							event.data.PBDEAL = null;
							event.data.CCPBDEAL = 'Trực tiếp';
						}

					}
				}
				if (event.data.deal === '' || !event.data.deal) {
					event.data.deal2 = null;
				}
				let listDeal = await getAllDeal();
				let isExistDeal = listDeal.some(e => e.code === event.data.deal2);
				if (!isExistDeal) {
					await createNewDeal({
						code: event.data.deal2,
						name: event.data.deal,
						dp: event.data.deal,
						company: event.data.company,
						unit_code: event.data.unit_code,
						group: 'Khác',
					});
				}
			}
			// Chỉ cập nhật data local, không lưu tự động
			setRowData([...rowData]);
			setHasUnsavedChanges(true);
		} catch (error) {
			console.error('Error updating cell value:', error);
		}
	};

	// Theo dõi khi `editCount` đạt 0, không lặp lại `loadData` nếu đã gọi trước đó
	useEffect(() => {
		if (editCount === 0 && !isLoaded) {
			setLoading(false);
			setIsLoaded(true); // Đặt cờ để biết loadData đã được gọi
			loadData();
		}
		// Đặt lại isLoaded khi `editCount` không còn 0 để sẵn sàng cho lần thay đổi tiếp theo
		if (editCount !== 0) {
			setIsLoaded(false);
		}
	}, [editCount, isLoaded]);

	const handleSortByDay = () => {
		setIsSortByDay(!isSortByDay);
	};

	const handleSave = async () => {
		setLoading(true);
		try {
			// Lưu tất cả data đã thay đổi
			await handleSaveAgl(rowData, 'SoKeToan');
			// Refresh data sau khi lưu
			loadData();
			loadDataSoKeToan();
			setHasUnsavedChanges(false);
		} catch (error) {
			console.error('Error saving data:', error);
		} finally {
			setLoading(false);
		}
	};

	function handleUpdate() {
		loadData();
		loadDataSoKeToan();
	}

	return (
		<>
			<div className={'header-powersheet'}>
				<div className={css.headerTitle}>
					<span>Phân Bổ Deal <TooltipHeaderIcon table={table} /></span>
					<button
						className={`${css.headerActionButton} ${hasUnsavedChanges ? css.buttonOn : css.buttonOff}`}
						onClick={handleSave}
						disabled={loading || !hasUnsavedChanges}
						style={{marginLeft: '10px'}}
					>
						<span>{loading ? 'Đang lưu...' : hasUnsavedChanges ? 'Lưu' : 'Đã lưu'}</span>
					</button>
				</div>
				{!call &&
					<div className={css.headerAction}>
						<div className={`${css.headerActionButton} ${css.selectItem}`}>
							<select className={css.selectContent}
									value={selectedYear}
									onChange={(e) => setSelectedYear(e.target.value)}
							>
								{listYear.map((year) => (<option key={year} value={year}>
									{year}
								</option>))}
								<option value="toan-bo">Toàn bộ</option>
							</select>
						</div>
						<div className={`${css.headerActionButton} ${isSortByDay ? css.buttonOn : css.buttonOn}`}
							 onClick={handleSortByDay}>
							{isSortByDay ? <span>Sắp xếp theo ngày tạo</span> : <span>Sắp xếp theo ngày nhập</span>}
						</div>
						<div
							className={`${css.headerActionButton} ${selectedButton === 'Trực tiếp' ? css.buttonOn : css.buttonOff}`}
							onClick={() => setSelectedButton(selectedButton === 'Trực tiếp' ? '' : 'Trực tiếp')}>
							<span>PB trực tiếp</span>
						</div>

						<div
							className={`${css.headerActionButton} ${selectedButton === 'Gián tiếp' ? css.buttonOn : css.buttonOff}`}
							onClick={() => setSelectedButton(selectedButton === 'Gián tiếp' ? '' : 'Gián tiếp')}>
							<span>PB gián tiếp</span>
						</div>

						<div
							className={`${css.headerActionButton} ${selectedButton === 'Tùy chỉnh' ? css.buttonOn : css.buttonOff}`}
							onClick={() => setSelectedButton(selectedButton === 'Tùy chỉnh' ? '' : 'Tùy chỉnh')}>
							<span>Tùy chỉnh</span>
						</div>
						<button
							className={`button-header-sheet-2 ${show ? 'button-active-2' : ''}`}
							onClick={() => handleCheckPhanbo()}
						>
							Phân bổ deal
						</button>
						<div className="navbar-item" ref={dropdownRef}>
							<img
								src={EllipsisIcon}
								style={{ width: 32, height: 32 }}
								alt="Ellipsis Icon"
								onClick={handleDropdownToggle}
							/>
							{isDropdownOpen && (
								<div className="dropdown-menu-button1">
									<button className="dropdown-item-button1">Xuất Excel</button>
								</div>
							)}
						</div>
					</div>}
			</div>
			<div
				style={{
					height: call === 'cdsd' ? '70vh' : '77.5vh',
					display: 'flex',
					flexDirection: 'column',
					// position: 'relative',
					marginTop: '15px',
				}}
			>
				{loading && (
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							flexDirection: 'column',
							alignItems: 'center',
							height: '100%',
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							zIndex: '2000',
							backgroundColor: 'rgba(255, 255, 255, 0.96)',
						}}
					>
						<img src="/loading_moi_2.svg" alt="Loading..." style={{ width: '650px', height: '550px' }} />
						{editCount !== 0 && <div>Đang phân bổ cho {editCount} bản ghi</div>}
						{editCount === 0 && <div>Đang tính toán phân bổ</div>}
					</div>
				)}
				<div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
					<AgGridReact
						statusBar={statusBar}
						enableRangeSelection
						ref={gridRef}
						rowData={rowData}
						defaultColDef={defaultColDef}
						columnDefs={colDefs}
						rowSelection="multiple"
						// pagination={true}
						onCellValueChanged={handleCellValueChanged}
						paginationPageSize={1000}
						animateRows={true}
						paginationPageSizeSelector={[1000, 5000, 10000, 30000, 50000]}
						localeText={AG_GRID_LOCALE_VN}
						onGridReady={onGridReady}
						domLayout={'normal'}
					/>
				</div>
			</div>
		</>
	);
}

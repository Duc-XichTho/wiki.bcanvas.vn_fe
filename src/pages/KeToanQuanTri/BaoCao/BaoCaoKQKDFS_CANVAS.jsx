import '../../../index.css';
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
import { toast } from 'react-toastify';
import '../../Home/AgridTable/agComponent.css';
import { getAllKmf } from '../../../apisKTQT/kmfService.jsx';
import { calculateDataKQKDFS, calculateDataViewKQKDFS2 } from './logic/logicKQKDFS.js';
import { Color } from './Color.js';
import { MyContext } from '../../../MyContext.jsx';
import PopupCellActionBCKD from '../popUp/cellAction/PopUpCellActionBCKD.jsx';
import { formatCurrency } from '../functionKTQT/formatMoney.js';
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from '../storage/storageService.js';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import { loadColumnState, saveColumnStateToLocalStorage } from '../functionKTQT/coloumnState.jsx';
import {
	convertToArrayForSection1,
	convertToArrayForSection1CF, filterGroup,
	sumColumns,
} from '../functionKTQT/chartSetUp/setUpSection.js';
import { createSectionData, createSeries } from '../functionKTQT/chartSetUp/setUpChart.js';
import { calSupAndT0, mergeDataByHeader } from './Plan/logicPlan.js';
import { getAllPlan } from '../../../apisKTQT/planService.jsx';
import { calculateValueTotalYear } from './logic/logicActual.js';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

import { useParams } from 'react-router-dom';
import { Typography } from 'antd';
import RichNoteKTQTRI from '../../Home/SelectComponent/RichNoteKTQTRI.jsx';
import Loading from '../../Loading/Loading.jsx';
import css from '../BaoCao/BaoCao.module.css';

export default function BaoCaoKQKDFS({
										 show,
										 isHideEmptyColumns,
										 isFullView,
										 isShowAll,
										 isHideChart,
										 listCom,
										 isShowInfo,
									 }) {
	const { listSoKeToan, loadDataSoKeToan, currentMonthCanvas, currentYearCanvas, currentCompanyKTQT } = useContext(MyContext);
	const { companySelect, tabSelect } = useParams();

	let selectedMonth = tabSelect == 'daas' ? 12 : currentMonthCanvas;
	const table = 'MaKQKDCanvas';
	const tableCol = 'MaKQKDCol';
	const key = 'TONGQUAT';
	const tableField = key + '_FIELD';
	const gridRef = useRef();
	const [rowData, setRowData] = useState([]);
	const [colDefs, setColDefs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [isSidebarVisible, setSidebarVisible] = useState(false);
	let [chartOptions, setChartOptions] = useState({});
	const statusBar = useMemo(() => {
		return {
			statusPanels: [{ statusPanel: 'agAggregationComponent' }],
		};
	}, []);
	const defaultColDef = useMemo(() => {
		return {
			editable: false,
			filter: true,
			cellStyle: {
				fontSize: '14.5px',
				color: 'var(--text-color)',
				fontFamily: 'var(--font-family)',
			},
			width: 120,
			wrapHeaderText: true,
			autoHeaderHeight: true,
		};
	});

	async function prepareData() {
		setLoading(true);
		if (listCom && listCom.length > 0) {
			let data = await loadDataSoKeToan();
			data = data.filter((e) => e.consol?.toLowerCase() == 'consol');
			data = data.filter(e => e.year == currentYearCanvas);
			let uniqueKMF = await getAllKmf();
			let AllResult = calculateDataViewKQKDFS2(data, uniqueKMF, selectedMonth);
			await setItemInIndexedDB2(key, AllResult);
			if (listCom.some(e => e.code != 'HQ')) {
				data = data.filter(e => listCom.some(c => c.code == e.company));
			}

			uniqueKMF = uniqueKMF.reduce((acc, current) => {
				if (!acc.find((unit) => unit.name === current.name)) {
					acc.push(current);
				}
				return acc;
			}, []);
			let result = show
				? calculateDataKQKDFS(data, uniqueKMF, selectedMonth)
				: calculateDataViewKQKDFS2(data, uniqueKMF, selectedMonth);

			if (isShowAll) {
				result = result.filter((item) => {
					for (let i = 0; i <= 12; i++) {
						if ((item[i] && item[i] != 0) || !item.layer.includes('.')) {
							return true;
						}
					}
					return false;
				});
			}

			setRowData(result);
			let dataChart = await loadChartData(data);
			setChartOptions(dataChart);
			setTimeout(() => {
				setLoading(false);
			}, 500);
		}


	}

	async function loadChartData(data) {
		let plans = await getAllPlan();
		let listKMF = await getAllKmf();
		let uniqueKMF = listKMF.reduce((acc, current) => {
			if (!acc.find((unit) => unit.name === current.name)) {
				acc.push(current);
			}
			return acc;
		}, []);
		let uniqueGroupsKMF = filterGroup([...new Set(uniqueKMF.map((unit) => unit.group))]).sort();
		let doanhThuData = [];
		let chiPhiData = [];
		let loiNhuanData = [];
		let planData = [];
		plans = plans.filter((item) => item.type === 'View3');
		if (!plans[0]?.rowData) {
		} else {
			plans.forEach((plan) => {
				plan?.rowData?.forEach(data => {
					planData = [...planData, ...calSupAndT0(data.data)];
				});
			});
		}
		planData = mergeDataByHeader(planData);
		let actualData = [];
		uniqueGroupsKMF.forEach((item) => {
			if (item) {
				let actualItem = { dp: item };
				for (let i = 1; i <= selectedMonth; i++) {
					actualItem[`t${i}`] = calculateValueTotalYear(item, uniqueKMF, data, i, currentYearCanvas);
					actualItem[`t${i}_ck`] = calculateValueTotalYear(item, uniqueKMF, data, i, currentYearCanvas - 1);
				}
				actualData.push(actualItem);

			}
		});
		actualData.forEach((actual) => {
			planData.forEach((plan) => {
				if (plan.header === actual.dp) {
					for (let i = 1; i <= 12; i++) {
						actual[`t${i}_kh`] = +plan[`t${i}`] || 0;
					}
				}
			});
		});
		let doanhThuList = actualData.filter((item) => item.dp.includes('Doanh Thu'));
		let chiPhiList = actualData.filter((item) => !item.dp.includes('Doanh Thu'));
		doanhThuData = sumColumns(doanhThuList);
		chiPhiData = sumColumns(chiPhiList);
		loiNhuanData = {};
		if (doanhThuData && chiPhiData) {
			for (const key in doanhThuData) {
				loiNhuanData[key] = doanhThuData[key] + chiPhiData[key];
			}
			doanhThuData = convertToArrayForSection1(doanhThuData, selectedMonth);
			chiPhiData = convertToArrayForSection1CF(chiPhiData, selectedMonth);
			loiNhuanData = convertToArrayForSection1(loiNhuanData, selectedMonth);
		}
		let thucHienSeries = createSeries('month', 'th', 'Thực hiện', 'line');
		let keHoachSeries = createSeries('month', 'kh', 'Kế hoạch', 'line');
		let cungKySeries = createSeries('month', 'ck', 'Cùng kỳ', 'line');
		let doanhThuTong = createSectionData('C1-Doanh thu tổng - TH-KH-CK', doanhThuData, [thucHienSeries, keHoachSeries, cungKySeries], 'C1-Doanh thu tổng - TH-KH-CK');
		let chiPhiTong = createSectionData('C2-Chi phí tổng - TH-KH-CK', chiPhiData, [thucHienSeries, keHoachSeries, cungKySeries], 'C2-Chi phí tổng - TH-KH-CK');
		let loiNhuanTong = createSectionData('C3-Lợi nhuận tổng - TH-KH-CK', loiNhuanData, [thucHienSeries, keHoachSeries, cungKySeries], 'C3-Lợi nhuận tổng - TH-KH-CK');
		return {
			doanhThuTong, chiPhiTong, loiNhuanTong,
		};
	}

	const onGridReady = useCallback(async () => {
		prepareData();
	}, []);

	useEffect(() => {
		prepareData();
	}, [show, isShowAll, currentYearCanvas, selectedMonth, listCom]);
	const rendHeader = (suffix) => {
		if (suffix == 0) return currentYearCanvas;
		return `Tháng ${suffix}`;
	};

	function isBold(params) {
		const isBold = params.data.layer.toString()?.includes('.');
		return {
			textAlign: 'left',
			paddingRight: 10,
			// background: isBold ? "" : 'rgb(237, 237, 237)',
			// background: isBold ? "" : 'white',
		};
	}


	function createField(field, hide) {
		return {
			field: field,
			headerName: rendHeader(field),
			headerClass: 'right-align-important-2',
			cellRenderer: (params) => {
				return (
					<div className='cell-action-group'>
						<PopupCellActionBCKD {...params} field={field} allData={rowData} type={'TQ'} company={listCom}
											 currentYear={currentYearCanvas} />
					</div>
				);
			},
			width: 150,
			cellStyle: (params) => {
				return { ...isBold(params), textAlign: 'right' };
			},
			...Color(),
			...hide,
		};
	}

	function redenderFields() {
		let fields = [
			{
				field: 'dp',
				headerName: 'Khoản mục phí',
				width: 300,
				pinned: 'left',
				...Color(),
				cellStyle: isBold,
			},
			{
				field: 'code',
				headerName: 'Code',
				width: 80,
				pinned: 'left',
				...Color(),
				cellStyle: isBold,
			},

			// {
			//     field: 'change',
			//     width: 130,
			//     columnGroupShow: 'open',
			//     headerClass: 'right-align-important',
			//     headerName: `Sparkline T1 - T${selectedMonth}`,
			//     cellRenderer: 'agSparklineCellRenderer',
			//     cellRendererParams: {
			//         sparklineOptions: {
			//             type: 'area',
			//             // marker: { size: 2 },
			//             tooltip: {
			//                 renderer: (params) => {
			//                     const {yValue, xValue} = params;
			//                     return {
			//                         content: formatCurrency((yValue / 1000).toFixed(0)),
			//                         fontSize: '12px',
			//                     };
			//                 },
			//             },
			//             fill: 'rgba(174,211,191,0.59)',
			//             line: {
			//                 stroke: '#4ca171',
			//                 strokeWidth: 1
			//             },
			//         },
			//         valueFormatter: (params) => {
			//             const changeArray = params.value || [];
			//             return changeArray.map((value) => {
			//                 return value === null || isNaN(value) ? 0 : Number(value);
			//             });
			//         },
			//     },
			//     ...Color(),
			//     cellStyle: isBold
			// },
			...renderFieldMoney(),
		];
		return fields;
	}

	function renderFieldMoney() {
		const teamFields = [];
		teamFields.push({
			...createField(`0`, { hide: false }),
		});

		for (let y = 1; y <= 12; y++) {
			const fieldName = `${y}`;
			let hide = false;
			if (!isFullView) {
				if (!(y >= selectedMonth - 2 && y <= selectedMonth)) {
					hide = true;
				}
			}
			if (isHideEmptyColumns) {
				const isAllZero = rowData.every((record) => record[fieldName] === 0);
				if (isAllZero) {
					hide = true;
				}
			}
			teamFields.push({
				...createField(fieldName, { hide }),
			});
		}
		return teamFields;
	}


	useEffect(() => {
		setSidebarVisible(false);
		const fetchData = async () => {
			try {
				let updatedColDefs = redenderFields();
				await setItemInIndexedDB2(tableField, updatedColDefs.map(item => {
					return { field: item.field, headerName: item.headerName };
				}));
				setColDefs(updatedColDefs);
			} catch (error) {
				console.log(error);
			}
		};
		fetchData();
	}, [onGridReady, rowData, table, isFullView, selectedMonth, isHideEmptyColumns]);

	return (
		<>
			{isShowInfo && <div className={css.notePad}>
				<RichNoteKTQTRI table={`${table}_Canvas_note`} />
			</div>
			}
			<div
				style={{
					height: isShowInfo ? '76vh' : '85vh',
					display: 'flex',
					flexDirection: 'column',
					position: 'relative',
					marginTop: '15px',
				}}
			>
				<Loading loading={loading}/>

				<div style={{ display: isHideChart ? 'none' : 'flex', gap: 5, marginBottom: 10 }}>
					<div style={{ flex: 1 }}>
						{/*<AgCharts options={chartOptions.doanhThuTong}/>*/}
					</div>
					<div style={{ flex: 1 }}>
						{/*<AgCharts options={chartOptions.chiPhiTong}/>*/}
					</div>
					<div style={{ flex: 1 }}>
						{/*<AgCharts options={chartOptions.loiNhuanTong}/>*/}
					</div>
				</div>
				<div className='ag-theme-quartz' style={{ height: '100%', width: '100%', display: 'flex' }}>
					<div style={{
						flex: '100%',
						// flex: isSidebarVisible ? '75%' : '100%',
						transition: 'flex 0.3s',
						height: '75vh',
						// height: isHideChart ? '75vh' : '40vh'
					}}>
						<AgGridReact
							statusBar={statusBar}
							ref={gridRef}
							rowData={rowData}
							enableRangeSelection={true}
							defaultColDef={defaultColDef}
							treeData={true}
							// groupDefaultExpanded={-1}
							getDataPath={(data) => data.layer?.toString().split('.')}
							columnDefs={colDefs}
							rowSelection='multiple'
							animateRows={true}
							localeText={AG_GRID_LOCALE_VN}
							onGridReady={onGridReady}
							autoGroupColumnDef={{
								headerName: '',
								maxWidth: 30,
								editable: false,
								floatingFilter: false,
								cellRendererParams: {
									suppressCount: true,
								},
								pinned: 'left',
							}}
							rowClassRules={{
								'row-head': (params) => {
									return params.data.layer?.toString().split('.').length === 1;
								},
							}}
							onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
							onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
						/>
					</div>
					{/*{isSidebarVisible && <AnalysisSideBar table={table + ` - ${team}`} gridRef={gridRef}/>}*/}
				</div>
			</div>
		</>
	);
}

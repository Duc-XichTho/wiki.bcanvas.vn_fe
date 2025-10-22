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
import '../../Home/AgridTable/agComponent.css';
import { getAllKmf } from '../../../apisKTQT/kmfService.jsx';
import { calculateDataKQKDFS, calculateDataViewKQKDFS2 } from './logic/logicKQKDFS.js';
import { Color } from './Color.js';
import { MyContext } from '../../../MyContext.jsx';
import PopupCellActionBCKD from '../popUp/cellAction/PopUpCellActionBCKD.jsx';
import { formatCurrency } from '../functionKTQT/formatMoney.js';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import { saveColumnStateToLocalStorage } from '../functionKTQT/coloumnState.jsx';
import {
	convertToArrayForSection1,
	convertToArrayForSection1CF,
	filterGroup,
	sumColumns,
} from '../functionKTQT/chartSetUp/setUpSection.js';
import { createSectionData, createSeries } from '../functionKTQT/chartSetUp/setUpChart.js';
import { calSupAndT0, mergeDataByHeader } from './Plan/logicPlan.js';
import { getAllPlan } from '../../../apisKTQT/planService.jsx';
import { calculateValueTotalYear } from './logic/logicActual.js';
import Loading from '../../Loading/Loading.jsx';
import KQKDFSCharts from '../../KeToanQuanTri/components/KQKDFSCharts.jsx';
import { formatUnitDisplay } from '../functionKTQT/formatUnitDisplay.js';
import { getAllSoKeToan } from '../../../apisKTQT/soketoanService.jsx';
import { getSettingByType } from '../../../apis/settingService.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function BaoCaoKQKDFS({
										 show,
										 isHideEmptyColumns,
										 company,
										 isFullView,
										 selectedMonth,
										 isShowAll,
										 isHideChart,
										 onDataChange,
									 }) {
	const { listSoKeToan, loadDataSoKeToan, currentYearKTQT, currentCompanyKTQT } = useContext(MyContext);
	const table = 'MaKQKD';
	const tableCol = 'MaKQKDCol';
	const gridRef = useRef();
	const [rowData, setRowData] = useState([]);
	const [colDefs, setColDefs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [isSidebarVisible, setSidebarVisible] = useState(false);
	let [chartOptions, setChartOptions] = useState({});
	const [chartColors, setChartColors] = useState([]);

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
		let data = await getAllSoKeToan();
		data = data.filter((e) => e.isUse && e.daHopNhat);
		if (currentCompanyKTQT.toLowerCase() === 'hq') data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
		else data = data.filter((e) => e.company?.toLowerCase() === currentCompanyKTQT?.toLowerCase());
		data = data.filter(e => currentYearKTQT === 'toan-bo' || e.year == currentYearKTQT);
		let uniqueKMF = await getAllKmf();
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
		
		// Truyền dữ liệu về component cha
		if (onDataChange) {
			onDataChange(result);
		}
		
		let dataChart = await loadChartData(data);
		setChartOptions(dataChart);
		setTimeout(() => {
			setLoading(false);
		}, 500);
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
					actualItem[`t${i}`] = calculateValueTotalYear(item, uniqueKMF, data, i, currentYearKTQT);
					actualItem[`t${i}_ck`] = calculateValueTotalYear(item, uniqueKMF, data, i, currentYearKTQT - 1);
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
	}, [company]);

	useEffect(() => {
		(async () => {
			try {
				const colorSetting = await getSettingByType('SettingColor');
				if (colorSetting && colorSetting.setting && Array.isArray(colorSetting.setting)) {
					const colors = colorSetting.setting.map(item => item.color).filter(Boolean);
					if (colors.length) setChartColors(colors);
				}
			} catch (e) {
				console.error('Error loading chart colors:', e);
			}
		})();
	}, []);

	useEffect(() => {
		prepareData();
	}, [show, company, isShowAll, currentYearKTQT, selectedMonth, currentCompanyKTQT]);
	const rendHeader = (suffix) => {
		if (suffix == 0) return 'Lũy kế năm';
		return `Tháng ${suffix}`;
	};

	function isBold(params) {
		const isBold = params.data.layer.toString()?.includes('.');
		return {
			textAlign: 'left',
			paddingRight: 10,
			// background: isBold ? "" : 'rgb(237, 237, 237)',
		};
	}


	function createField(field, hide) {
		const isLuyKeNam = field == 0;  // Kiểm tra nếu field là 0 (Lũy kế năm)

		return {
			field: field,
			headerName: rendHeader(field),
			headerClass: 'right-align-important-2',
			cellRenderer: (params) => {
				return (
					<div className="cell-action-group">
						<PopupCellActionBCKD {...params} field={field} allData={rowData} type={'TQ'}
											 company={currentCompanyKTQT} currentYear={currentYearKTQT}
											 plType={!show ? params.data.code : null} />
					</div>
				);
			},
			width: 140,
			cellStyle: (params) => {
				return { ...isBold(params), textAlign: 'right' };
			},
			...Color(),
			...(isLuyKeNam && { pinned: 'left' }),
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
			//
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

		// Sparkline column next to "Lũy kế năm" showing monthly trend
		teamFields.push({
			field: 'spark',
			width: 140,
			headerClass: 'right-align-important',
			headerName: `Sparkline T1 - T12`,
			cellRenderer: 'agSparklineCellRenderer',
			pinned: 'left',
			valueGetter: (params) => {
				const values = [];
				for (let i = 1; i <= 12; i++) {
					const v = params.data?.[`${i}`];
					let numValue = v === null || v === undefined || isNaN(v) ? 0 : Number(v);
					// Reverse sign for CF or Chi phí
					if (params.data.dp && (params.data.dp.includes('CF') || params.data.dp.includes('Chi phí'))) {
						numValue = -numValue;
					}
					values.push(numValue);
				}
				return values;
			},
			cellRendererParams: {
				sparklineOptions: {
					type: 'area',
					tooltip: {
						renderer: (p) => {
							const { yValue } = p;
							return {
								content: formatCurrency(((yValue || 0) / 1000).toFixed(0)),
								fontSize: '12px',
							};
						},
					},
					fill: chartColors[0] ? `${chartColors[0]}20` : 'rgba(174,211,191,0.59)',
					line: {
						stroke: chartColors[0] || '#4ca171',
						strokeWidth: 1,
					},
					marker: { enabled: false },
				},
			},
			...Color(),
			cellStyle: isBold,
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
				let updatedColDefs = redenderFields()
					// const savedColumnState = await getItemFromIndexedDB(tableCol);
					// if (savedColumnState.length) {
					//     setColDefs(loadColumnState(updatedColDefs, savedColumnState));
					// } else {
					//     const simplifiedColumnState = updatedColDefs.map(({field, pinned, width, hide}) => ({
					//         colId: field,
					//         pinned,
					//         width,
					//         hide,
					//     }));
					//     await setItemInIndexedDB(tableCol, simplifiedColumnState);
					//     setColDefs(updatedColDefs);
					// }
				;
				setColDefs(updatedColDefs);

			} catch (error) {
				console.log(error);
			}
		};
		fetchData();
	}, [onGridReady, rowData, table, isFullView, selectedMonth, company, isHideEmptyColumns]);

	return (
		<>
			<div
				style={{
					height: '85vh',
					display: 'flex',
					flexDirection: 'column',
					position: 'relative',
					marginTop: '15px',
				}}
			>
				<Loading loading={loading} />

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
				<KQKDFSCharts
					rowData={rowData}
					selectedMonth={selectedMonth}
					unitDisplay={undefined}
					formatUnitDisplay={formatUnitDisplay}
				/>
				<div className="ag-theme-quartz" style={{ height: '90%', width: '100%', display: 'flex' }}>
					<div style={{
						flex: '100%',
						// flex: isSidebarVisible ? '75%' : '100%',
						transition: 'flex 0.3s',
						// height: isHideChart ? '75vh' : '40vh'
						height: '75vh',
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
							rowSelection="multiple"
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

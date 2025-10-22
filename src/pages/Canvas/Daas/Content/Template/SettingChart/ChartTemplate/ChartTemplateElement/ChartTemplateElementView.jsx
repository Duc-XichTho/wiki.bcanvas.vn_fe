import React, { useEffect, useMemo, useState } from 'react';
import { getTemplateByFileNoteId, getTemplateRow } from '../../../../../../../../apis/templateSettingService.jsx';
import { AgCharts } from 'ag-charts-react';
import { createSectionData } from '../../../../../Logic/SetupChart.js';
import {
	createBarSeries2,
	createBarSeriesHorizontal,
	createHeatMap,
	createHeatMapSeries,
	createNormalisedBarTemp,
	createWaterfallSeries,
	fetchDataColor,
	filterRows,
	getUniqueValues,
	getUniqueValues2,
	prepareChartSeriesForPieChart,
	prepareChartSeriesTemp2,
	transformData,
	transformData2,
	transformDataForBarChart,
	transformDataForBarChart2,
	transformDataForHeatmap,
	transformDataForPieChart,
	transformDataForWaterfallChart,
	sortWF,
	transformDataWithV6,
	prepareChartSeriesWithV6,
	transformDataForBarChartWithV6,
	createBarSeriesWithV6,
} from '../setChartTemplate.js';
import { getAllChartTemplate, updateChartTemplate } from '../../../../../../../../apis/chartTemplateService.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import { getFileNotePadByIdController, updateFileNotePad } from '../../../../../../../../apis/fileNotePadService.jsx';
import styles from '../../../../../../CanvasFolder/KPI2Calculator/KPICalculator2.module.css';
import { Button, Modal, Select, Spin } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { loadAndMergeData } from '../../../SettingCombine/logicCombine.js';
import css from '../../../Template.module.css';
import { createAxesCB, prepareChartSeriesTemp2CB } from '../setChartTemplateCombine.js';
import { createMap } from '../setMap.js';
import { OrderSeries } from './OrderSeries.jsx';
import { getUniqueGroupsForArea, prepareAreaSeries, transformDataForArea } from '../setAreaChart.js';
import { createBubbleChartOptions, transformBubbleData } from '../setBubbleChart.js';
import ReactECharts from 'echarts-for-react';
import { createFunnelChart, transformDataForFunnel } from '../setFunnelChart.js';
import { createRadarChartOptions } from '../setRadarChart.js';
import AG_GRID_LOCALE_VN from '../../../../../../../Home/AgridTable/locale.jsx';


export default function ChartTemplateElementView({ selectedItemID }) {
	const [selectedItem, setSelectedItem] = useState(null);
	const [tableData, setTableData] = useState([]);
	const [options, setOptions] = useState(null);
	const { id, buSelect, companySelect } = useParams();
	const [selectedFileNote, setSelectedFileNote] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	// Add columns state
	const [columns, setColumns] = useState([]);
	const [gridApi, setGridApi] = useState(null);
	const [topFilter, setTopFilter] = useState('all');
	const [sortOrder, setSortOrder] = useState('none');
	const [type, setType] = useState('pie');
	const navigate = useNavigate();
	const [showKeyOrder, setShowKeyOrder] = useState(false);
	const [listXOrder, setListXOrder] = useState(null);
	const [listCol, setListCol] = useState(null);
	const [orders, setOrders] = useState([]);
	const [optionF, setOptionF] = useState(null);

	const defaultColDef = useMemo(() => {
		return {
			editable: true,
			filter: true,
			cellStyle: {fontSize: '14.5px'},
			wrapHeaderText: true,
			autoHeaderHeight: true,
		};
	});


	useEffect(() => {
		if (selectedItem?.infoSort?.top) {
			setTopFilter(selectedItem.infoSort.top);
		} else {
			setTopFilter('all');
		}
	}, [selectedItem]);

	useEffect(() => {
		if (selectedItem && selectedItem.id_filenote) loadData().then();
	}, [selectedItem, topFilter, orders]);

	const showModal = () => {
		if (tableData.length > 0) {
			const firstRow = tableData[0];
			const columnOrder = ['id', 'Thời gian'];

			const dynamicColumns = Object.keys(firstRow)
				.sort((a, b) => {
					const aIndex = columnOrder.indexOf(a);
					const bIndex = columnOrder.indexOf(b);
					if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
					if (aIndex === -1) return 1;
					if (bIndex === -1) return -1;
					return aIndex - bIndex;
				})
				.map(key => ({
					field: key,
					headerName: key,
					minWidth: 100,
					maxWidth: 600,
					width: 'auto',
					autoHeight: true,
					wrapText: true,
					headerStyle: { width: 'fit-content' },
					valueFormatter: (params) => {
						if (key === 'Thời gian' && params.value) {
							const date = new Date(params.value);
							return date instanceof Date && !isNaN(date) ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}` : '-';
						}
						return params.value?.toString() || '-';
					},
				}));
			setColumns(dynamicColumns);
		}
		setIsModalVisible(true);
	};

	const onGridReady = (params) => {
		setGridApi(params.api);
		params.api.sizeColumnsToFit();
	};

	const fetchData = async () => {
		if (id) {
			const data = await getFileNotePadByIdController(id);
			setSelectedFileNote(data);
		}
	};

	useEffect(() => {
		fetchData().then();
	}, [id]);


	async function loadItem() {
		const response = await getAllChartTemplate();
		const data = response.find(e => e.id == selectedItemID);
		if (data) {
			setSelectedItem(data);
			setListXOrder(data.info?.listOrder);
			setOrders(data.info?.listOrder);
		}
	}

	const applyTopFilter = (data, top = 'all', valueKey = 'value') => {
		if (top === 'all') return data;

		const N = Number(top.replace('top', ''));
		return [...data]
			.sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0))
			.slice(0, N);
	};

	async function loadData() {
		setLoading(true);
		let rows = [];
		let fills = await fetchDataColor();
		const templateInfo = await getTemplateByFileNoteId(selectedItem.id_filenote);
		let template = templateInfo[0];
		if (template && template.isCombine) {
			rows = await loadAndMergeData(template);
		} else {
			const dataResponse = await getTemplateRow(selectedItem.id_template);
			const data = dataResponse.rows || [];
			rows = data.map((row) => ({
				...row.data, rowId: row.id,
			}));
		}
		if (selectedItem.conditions && selectedItem.conditions.length > 0) {
			rows = filterRows(rows, selectedItem.conditions);
		}
		// Sort rows if sortOrder is set
		if (sortOrder !== 'none') {
			rows.sort((a, b) => {
				const aValue = a[selectedItem.v1];
				const bValue = b[selectedItem.v1];

				if (sortOrder === 'asc') {
					return aValue.localeCompare(bValue);
				}
				if (sortOrder === 'desc') {
					return bValue.localeCompare(aValue);
				}
				if (sortOrder === 'numAsc') {
					return parseFloat(aValue) - parseFloat(bValue);
				}
				if (sortOrder === 'numDesc') {
					return parseFloat(bValue) - parseFloat(aValue);
				}
				return 0;
			});
		}
		let dataList = [];
		let uniqueList = getUniqueValues(rows, selectedItem.v2);
		setType(selectedItem.type);
		if (selectedItem.type === 'line') {
			let xKey = selectedItem.v1;
			const hasGroup = !!selectedItem.v2;
			const data2 = selectedItem.v3 ? 
				transformData2(rows, selectedItem) : 
				transformDataWithV6(rows, selectedItem);
			const uniqueGroups2 = hasGroup ? getUniqueValues2(rows, selectedItem.v2) : [];
			const series2 = selectedItem.v3 ? 
				prepareChartSeriesTemp2(uniqueGroups2, data2, 'linear', selectedItem.v1, hasGroup, selectedItem.v3, fills) : 
				prepareChartSeriesWithV6(uniqueGroups2, data2, 'linear', selectedItem.v1, hasGroup, selectedItem.v6, fills);

			let chart = createSectionData('', data2, series2, '');
			if (orders && orders.length > 0) {
				const orderNames = orders.map(item => item.name);
				chart.data.sort((a, b) => {
					return orderNames.indexOf(a[xKey]) - orderNames.indexOf(b[xKey]);
				});
			}
			dataList = data2;
			setOptions(chart);
		}
		if (selectedItem.type === 'bubble') {
			const data = transformBubbleData(rows, selectedItem);
			const chart = createBubbleChartOptions(data, selectedItem, fills);
			dataList = data;
			setOptions(chart);
		}
		if (selectedItem.type === 'area') {
			const hasGroup = !!selectedItem.v2;
			const areaData = transformDataForArea(rows, selectedItem);
			const uniqueGroups = hasGroup ? getUniqueGroupsForArea(rows, selectedItem.v2) : [];
			const areaSeries = prepareAreaSeries(uniqueGroups, areaData, selectedItem.v1, hasGroup, selectedItem.v3, fills);
			const chart = createSectionData('', areaData, areaSeries, '');
			dataList = areaData;
			setOptions(chart);
		}
		if (selectedItem.type === 'bar') {
			const xKey = selectedItem.v1;
			const hasGroup = !!selectedItem.v2;
			let barData = selectedItem.v3 ? 
				transformDataForBarChart2(rows, selectedItem, selectedItem.isSort) : 
				transformDataForBarChartWithV6(rows, selectedItem);
			const uniqueGroups = hasGroup ? [...new Set(rows.map(row => row[selectedItem.v2]))] : [];
			const barSeries = selectedItem.v3 ? 
				createBarSeries2(uniqueGroups, xKey, hasGroup, selectedItem.v3, fills) : 
				createBarSeriesWithV6(uniqueGroups, barData, 'linear', xKey, hasGroup, selectedItem.v6, fills);
			
			let chart = createSectionData('', barData, barSeries, '');
			if (orders && orders.length > 0) {
				const orderNames = orders.map(item => item.name);
				chart.data.sort((a, b) => {
					return orderNames.indexOf(a[xKey]) - orderNames.indexOf(b[xKey]);
				});
			}
			chart.data = applyTopFilter(chart.data, topFilter, selectedItem.v3);
			setOptions(chart);
			dataList = barData;
		}
		if (selectedItem.type === 'horizontalBar') {
			const barData = transformDataForBarChart(rows, selectedItem);
			const xKey = selectedItem.v1;
			const uniqueGroups = [...new Set(rows.map(row => row[selectedItem.v2]))];
			const barSeries = createBarSeriesHorizontal(uniqueGroups, xKey);
			const chart = createSectionData('', barData, barSeries, '');
			setOptions(chart);
			dataList = barData;
		}
		if (selectedItem.type === 'normalisedBar') {
			const xKey = selectedItem.v1;
			const hasGroup = !!selectedItem.v2;
			const barData = transformDataForBarChartWithV6(rows, selectedItem);
			const uniqueGroups = hasGroup ? [...new Set(rows.map(row => row[selectedItem.v2]))] : [];
			const barSeries = createBarSeriesWithV6(uniqueGroups, barData, 'linear', xKey, hasGroup, selectedItem.v6, fills, 100).map(series => ({
				...series,
				stacked: true, // Ensure bars are stacked for normalization
			}));
			const chart = createSectionData('', barData, barSeries, '');
			setOptions(chart);
		}
		if (selectedItem.type === 'waterfall') {
			let waterfallData = transformDataForWaterfallChart(rows, selectedItem);
			const waterfallSeries = createWaterfallSeries(rows, selectedItem, fills);
			waterfallData = sortWF(waterfallData, selectedItem.v3);
			let chart = createSectionData('', waterfallData, waterfallSeries, '');
			setOptions(chart);
			dataList = waterfallData;
		}
		if (selectedItem.type === 'combine') {

			const xKey = selectedItem.v1;
			const hasGroup = !!selectedItem.v2;

			const barData = transformDataForBarChart2(rows, selectedItem, selectedItem.isSort);
			const uniqueGroups = hasGroup ? [...new Set(rows.map(function(row) {
				return row[selectedItem.v2];
			}))] : [];
			const barSeries = createBarSeries2(uniqueGroups, xKey, hasGroup, selectedItem.v3, fills);

			// Phần line chart: gán lại v2 và v3 cho selectedLineChart
			let selectedLineChart = Object.assign({}, selectedItem);
			selectedLineChart.v2 = selectedItem.v4;
			selectedLineChart.v3 = selectedItem.v5;
			const hasGroupLine = !!selectedLineChart.v2;

			// Chuyển đổi dữ liệu cho line chart (dữ liệu tổng hợp nằm trong thuộc tính "value" nếu không có group)
			const data2 = transformData2(rows, selectedLineChart);
			const uniqueGroups2 = hasGroupLine ? getUniqueValues2(rows, selectedLineChart.v2) : [];
			// Sử dụng hàm prepareChartSeriesTemp2CB thay cho prepareChartSeriesTemp2
			const series2 = prepareChartSeriesTemp2CB(uniqueGroups2, data2, 'linear', selectedItem.v1, hasGroupLine, selectedLineChart.v3, fills);

			// Gộp lại dữ liệu cho chart và khởi tạo các axes từ createAxesCB
			const options = createSectionData('', [...barData, ...data2], [...barSeries, ...series2], '', {}, { position: 'bottom' });
			options.axes = createAxesCB({});
			if (orders && orders.length > 0) {
				const orderNames = orders.map(item => item.name);
				options.data.sort((a, b) => {
					return orderNames.indexOf(a[xKey]) - orderNames.indexOf(b[xKey]);
				});
			}
			setOptions(options);
			dataList = [...barData, ...data2];
		}
		if (selectedItem.type === 'heatmap') {
			let dataChart = transformData(rows, selectedItem);
			const chart = createHeatMap('', transformDataForHeatmap(dataChart, selectedItem), [createHeatMapSeries(selectedItem.v1, selectedItem.v2)]);
			setOptions(chart);
			dataList = dataChart;
		}
		if (selectedItem.type === 'stackedBar') {
			const xKey = selectedItem.v1;
			const hasGroup = !!selectedItem.v2;
			const barData = selectedItem.v3 ? 
				transformDataForBarChart(rows, selectedItem) : 
				transformDataForBarChartWithV6(rows, selectedItem);
			const uniqueGroups = hasGroup ? [...new Set(rows.map(row => row[selectedItem.v2]))] : [];
			const barSeries = selectedItem.v3 ? 
				createNormalisedBarTemp(uniqueGroups, xKey, fills) : 
				createBarSeriesWithV6(uniqueGroups, barData, 'linear', xKey, hasGroup, selectedItem.v6, fills).map(series => ({
					...series,
					stacked: true
				}));
			
			let chart = createSectionData('', barData, barSeries, '');
			if (orders && orders.length > 0) {
				const orderNames = orders.map(item => item.name);
				chart.data.sort((a, b) => {
					return orderNames.indexOf(a[xKey]) - orderNames.indexOf(b[xKey]);
				});
			}
			setOptions(chart);
			dataList = barData;
		}
		if (selectedItem.type === 'pie') {
			let dataChart = transformDataForPieChart(rows, selectedItem);
			let series = prepareChartSeriesForPieChart(fills);
			let chart = createSectionData('', dataChart, series, '');
			setOptions(chart);
			dataList = dataChart;
		}
		if (selectedItem.type === 'map') {
			let dataChart = transformDataForPieChart(rows, selectedItem);
			setOptions(createMap(dataChart, fills));
			dataList = dataChart;
		}
		if (selectedItem.type === 'funnel') {
			let data = transformDataForFunnel(rows, selectedItem.v2, selectedItem.v3 );
			setOptionF(createFunnelChart(data, fills));
			dataList = data
		}
		if (selectedItem.type === 'radar') {
			let chart = createRadarChartOptions(rows, selectedItem, fills)
			setOptions(chart);
			dataList = chart.data
		}
		setTableData(dataList);
		setLoading(false);
	}

	useEffect(() => {
		loadItem().then();
	}, [selectedItemID]);

	const handleTopFilterChange = async (value) => {
		setTopFilter(value);
		const oldInfo = selectedFileNote?.infoSort || {};
		const updatedInfo = {
			...oldInfo, top: value,
		};
		const payload = {
			id: selectedItemID, infoSort: updatedInfo,
		};

		try {
			const result = await updateChartTemplate(payload);
			console.log('Cập nhật thành công:', result);
		} catch (error) {
			console.error('Lỗi khi cập nhật file note:', error);
		}
	};

	const handleSortChange = (value) => {
		setSortOrder(value);
	};


	const showOriginalData = () => {
		window.open(`/canvas/${companySelect}/${buSelect}/du-lieu/du-lieu-tong-hop/${selectedItem?.id_filenote}`, '_blank', 'noopener,noreferrer');
	};


	return (<>
		{loading ? (<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				top: 0,
				left: 0,
			}}
		>
			<Spin size="large" />
		</div>) : (

			<>

				<div className={styles.body}>
					<div className={styles.bodyContainer}>
						<div className={styles.title}>
							<span>{selectedFileNote?.name}</span>
							<i style={{ fontSize: 12, color: '#b8b8b8' }}>({selectedItem?.name})</i>
							<Button className={css.customButton} onClick={showModal}>Xem dữ liệu</Button>
							{/*<Button className={css.customButton} onClick={showOriginalData}>Xem bảng gốc</Button>*/}

							{selectedItem && selectedItem.type === 'bar' && (<Select
								className={css.customSelect}
								value={topFilter}
								onChange={handleTopFilterChange}
								style={{ width: 120 }}
							>
								<Option value="all">Tất cả</Option>
								{[5, 10, 15, 20, 25, 30].map((num) => (<Option key={num} value={`top${num}`}>
									Top {num}
								</Option>))}
							</Select>)}
							{selectedItem && (selectedItem.type == 'bar' || selectedItem.type == 'line' || selectedItem.type == 'stackedBar') && (
								<Button
									className={css.customButton}
									onClick={() => {
										const listOrder = selectedItem.info?.listOrder;
										const data = options?.data;
										setListCol(data.map(item => item[selectedItem.v1] || ''));
										if (listOrder?.length > 0) {
											setListXOrder(listOrder.map(item => item?.name || ''));
										} else if (data) {
											setListXOrder(data.map(item => item[selectedItem.v1] || ''));
										} else {
											console.error('listOrder or options.data is undefined');
										}

										// Ensure the modal is shown after updating the list
										setShowKeyOrder(true);
									}}
								>
									Sắp xếp các cột
								</Button>)

							}

							{showKeyOrder && listXOrder && (<OrderSeries selectedItem={selectedItem}
																		 showSettingsChartPopup={showKeyOrder}
																		 setShowSettingsChartPopup={setShowKeyOrder}
																		 listXOrder={listXOrder}
																		 orders={orders}
																		 setOrders={setOrders}
																		 setListXOrder={setListXOrder}
																		 listCol={listCol}
							></OrderSeries>)}

							{/*{(type === 'bar' || type === 'line') && <>*/}
							{/*	<Select*/}
							{/*		className={css.customSelect}*/}
							{/*		value={sortOrder}*/}
							{/*		onChange={handleSortChange}*/}
							{/*		style={{ width: 150 }}*/}
							{/*	>*/}
							{/*		<Option value="none">Mặc định</Option>*/}
							{/*		<Option value="asc">A-Z ↑</Option>*/}
							{/*		<Option value="desc">Z-A ↓</Option>*/}
							{/*		<Option value="numAsc">0-9 ↑</Option>*/}
							{/*		<Option value="numDesc">9-0 ↓</Option>*/}
							{/*	</Select>*/}
							{/*</>*/}
							{/*}*/}


						</div>
						{optionF && selectedItem.type === 'funnel' &&
							<ReactECharts option={optionF} style={{ height: '90%' }} />
						}
						{options && <div className={styles.chartContainer}>
							{options && selectedItem.type !== 'funnel' &&
								<AgCharts style={{ width: '100%', height: '95%', overflow: 'hidden' }}
										  options={{
											  ...options,
											  legend: {
												  position: 'bottom',
												  maxHeight: 60,
												  item: {
													  label: {
														  fontWeight : 500,
														  color: '#454545',
													  }
												  }
											  },
										  }} />
							}
							{type === 'map' && <>
								<div className={styles.HS}>
									<img src="/HSa.svg" alt="" />
									Hoàng Sa
								</div>
								<div className={styles.TS}>
									<img src="/HSa.svg" alt="" />
									Trường Sa
								</div>
							</>}
						</div>}
					</div>
				</div>

				<Modal
					title="Dữ liệu bảng"
					open={isModalVisible}
					onCancel={() => setIsModalVisible(false)}
					width={1200}
					footer={null}
				>
					<div className="ag-theme-quartz" style={{ height: 500, width: '100%' }}>
						<AgGridReact
							rowData={tableData}
							columnDefs={columns}
							onGridReady={onGridReady}
							pagination={true}
							paginationPageSize={50}
							defaultColDef={defaultColDef}
							localeText={AG_GRID_LOCALE_VN}

						/>
					</div>
				</Modal>
			</>)}
	</>);
}

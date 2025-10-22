import React, { useEffect, useState } from 'react';
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
	sortWF,
	transformData,
	transformData2,
	transformDataForBarChart,
	transformDataForBarChart2,
	transformDataForHeatmap,
	transformDataForPieChart,
	transformDataForWaterfallChart,
	transformDataWithV6,
	prepareChartSeriesWithV6,
	transformDataForBarChartWithV6,
	createBarSeriesWithV6,
} from '../setChartTemplate.js';
import { useParams } from 'react-router-dom';
import { getFileNotePadByIdController } from '../../../../../../../../apis/fileNotePadService.jsx';
import styles from '../../../../../../CanvasFolder/KPI2Calculator/KPICalculator2.module.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { loadAndMergeData } from '../../../SettingCombine/logicCombine.js';
import { createAxesCB, prepareChartSeriesTemp2CB } from '../setChartTemplateCombine.js';
import { createMap } from '../setMap.js';
import Loading from '../../../../../../../Loading/Loading.jsx';
import { getUniqueGroupsForArea, prepareAreaSeries, transformDataForArea } from '../setAreaChart.js';
import { createBubbleChartOptions, transformBubbleData } from '../setBubbleChart.js';
import ReactECharts from 'echarts-for-react';
import { createFunnelChart, transformDataForFunnel } from '../setFunnelChart.js';
import { createRadarChartOptions } from '../setRadarChart.js';

export default function ChartTemplateElementPreview({ selectedItem }) {
	const [options, setOptions] = useState(null);
	const { id } = useParams();
	const [selectedFileNote, setSelectedFileNote] = useState(null);
	const [loading, setLoading] = useState(false);
	const [optionF, setOptionF] = useState(null)


	const fetchData = async () => {
		if (id) {
			const data = await getFileNotePadByIdController(id);
			setSelectedFileNote(data);
		}
	};

	useEffect(() => {
		fetchData().then();
	}, [id]);

	async function loadData() {
		setLoading(false);
		let rows = [];
		const templateInfo = await getTemplateByFileNoteId(selectedItem.id_filenote);
		let template = templateInfo[0];
		const fills = await fetchDataColor();
		if (template && template.isCombine) {
			rows = await loadAndMergeData(template);
		} else {
			const dataResponse = await getTemplateRow(selectedItem.id_template);
			const data = dataResponse.rows || [];
			rows = data.map((row) => ({
				...row.data,
				rowId: row.id,
			}));
		}
		if (selectedItem.conditions && selectedItem.conditions.length > 0) {
			rows = filterRows(rows, selectedItem.conditions);
		}
		const interpolation = {
			type: 'smooth',
		};
		let uniqueList = getUniqueValues(rows, selectedItem.v2);
		if (selectedItem.type === 'area') {
			const hasGroup = !!selectedItem.v2;
			const areaData = transformDataForArea(rows, selectedItem);
			const uniqueGroups = hasGroup ? getUniqueGroupsForArea(rows, selectedItem.v2) : [];
			const areaSeries = prepareAreaSeries(uniqueGroups, areaData, selectedItem.v1, hasGroup, selectedItem.v3, fills);
			const chart = createSectionData('', areaData, areaSeries, '');
			setOptions(chart);
		}
		if (selectedItem.type === 'line') {
			const hasGroup = !!selectedItem.v2;
			const data2 = selectedItem.v3 ?
				transformData2(rows, selectedItem) :
				transformDataWithV6(rows, selectedItem);
			const uniqueGroups2 = hasGroup ? getUniqueValues2(rows, selectedItem.v2) : [];
			const series2 = selectedItem.v3 ?
				prepareChartSeriesTemp2(uniqueGroups2, data2, 'linear', selectedItem.v1, hasGroup, selectedItem.v3, fills) :
				prepareChartSeriesWithV6(uniqueGroups2, data2, 'linear', selectedItem.v1, hasGroup, selectedItem.v6, fills);
			let chart = createSectionData('', data2, series2, '');
			setOptions(chart);
		}
		if (selectedItem.type === 'bar') {
			const xKey = selectedItem.v1;
			const hasGroup = !!selectedItem.v2;
			const barData = selectedItem.v3 ?
				transformDataForBarChart2(rows, selectedItem, selectedItem.isSort) :
				transformDataForBarChartWithV6(rows, selectedItem);
			const uniqueGroups = hasGroup ? [...new Set(rows.map(row => row[selectedItem.v2]))] : [];
			const barSeries = selectedItem.v3 ?
				createBarSeries2(uniqueGroups, xKey, hasGroup, selectedItem.v3, fills) :
				createBarSeriesWithV6(uniqueGroups, barData, 'linear', xKey, hasGroup, selectedItem.v6, fills);
			const chart = createSectionData(
				'',
				barData,
				barSeries,
				'',
			);
			setOptions(chart);
		}
		if (selectedItem.type === 'horizontalBar') {
			const barData = transformDataForBarChart(rows, selectedItem);
			const xKey = selectedItem.v1;
			const uniqueGroups = [...new Set(rows.map(row => row[selectedItem.v2]))];
			const barSeries = createBarSeriesHorizontal(uniqueGroups, xKey);
			const chart = createSectionData(
				'',
				barData,
				barSeries,
				'',
			);
			setOptions(chart);
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
			waterfallData = sortWF(waterfallData)
			let chart = createSectionData('', waterfallData, waterfallSeries, '');
			setOptions(chart);
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
			const options = createSectionData(
				'',
				[...barData, ...data2],
				[...barSeries, ...series2],
				'',
				{},
				{ position: 'bottom' }
			);
			options.axes = createAxesCB({});
			setOptions(options);
		}
		if (selectedItem.type === 'heatmap') {
			let dataChart = transformData(rows, selectedItem);
			const chart = createHeatMap('', transformDataForHeatmap(dataChart, selectedItem), [createHeatMapSeries(selectedItem.v1, selectedItem.v2)]);
			setOptions(chart);
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
			setOptions(chart);
		}
		if (selectedItem.type === 'bubble') {
			const data = transformBubbleData(rows, selectedItem);
			const chart = createBubbleChartOptions(data, selectedItem, fills);
			setOptions(chart);
		}
		if (selectedItem.type === 'pie') {
			let dataChart = transformDataForPieChart(rows, selectedItem);
			let series = prepareChartSeriesForPieChart(fills);
			let chart = createSectionData('', dataChart, series, '');
			setOptions(chart);
			setOptions({
				...chart, padding: {
					top: 10,
					bottom: 10,
					left: 10,
					right: 10,
				},

			});
		}
		if (selectedItem.type === 'map') {
			let dataChart = transformDataForPieChart(rows, selectedItem);
			setOptions(createMap(dataChart, fills));
		}
		if (selectedItem.type === 'funnel') {
			let data = transformDataForFunnel(rows, selectedItem.v2, selectedItem.v3)
			setOptionF(createFunnelChart(data, fills))
		}
		if (selectedItem.type === 'radar') {
			let chart = createRadarChartOptions(rows, selectedItem, fills)
			setOptions(chart);
		}
		setLoading(false);
	}


	useEffect(() => {
		if (selectedItem && selectedItem.id_filenote) loadData().then();
	}, [selectedItem]);
	return (
		<>
			{loading
				? (
					// <div
					// 	style={{
					// 		width: '100%',
					// 		height: '100%',
					// 		display: 'flex',
					// 		justifyContent: 'center',
					// 		alignItems: 'center',
					// 		top: 0,
					// 		left: 0,
					// 	}}
					// >
						<Loading loading={loading}/>
					// 	<Spin size="large" />
					// </div>
				) : (

					<>

						<div className={styles.body}>
							<div className={styles.bodyContainer}>
								{options  && selectedItem.type !== 'funnel' && <AgCharts style={{ width: '100%', height: '90%' }} options={{
									...options, legend: {
										position: 'bottom',
										maxHeight: 60,
									},
								}} />}
								{optionF && selectedItem.type === 'funnel' &&
									<ReactECharts option={optionF} style={{ height: '90%' }} />}
							</div>
						</div>
					</>
				)
			}
		</>
	);
}

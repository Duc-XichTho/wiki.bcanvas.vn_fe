import css from './ChartTemplateElement.module.css';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { getTemplateByFileNoteId, getTemplateRow } from '../../../../../../../../apis/templateSettingService.jsx';
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
	transformDataWithV6,
	prepareChartSeriesWithV6,
	transformDataForBarChart,
	transformDataForBarChart2,
	transformDataForHeatmap,
	transformDataForPieChart,
	transformDataForWaterfallChart,
	transformDataForBarChartWithV6,
	createBarSeriesWithV6,
} from '../setChartTemplate.js';
import { AgCharts } from 'ag-charts-react';
import 'ag-charts-enterprise';
import { loadAndMergeData } from '../../../SettingCombine/logicCombine.js';
import { Button, Input, message, Modal, Popconfirm, Select } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { deleteChartTemplate, updateChartTemplate } from '../../../../../../../../apis/chartTemplateService.jsx';
import { createAxesCB, prepareChartSeriesTemp2CB } from '../setChartTemplateCombine.js';
import { getAllFileTab } from '../../../../../../../../apis/fileTabService.jsx';
import { createTimestamp } from '../../../../../../../../generalFunction/format.js';
import { MyContext } from '../../../../../../../../MyContext.jsx';
import {
	createNewFileNotePad,
	deleteFileNotePad,
	getAllFileNotePad,
} from '../../../../../../../../apis/fileNotePadService.jsx';
import { createMap } from '../setMap.js';
import Loading from '../../../../../../../Loading/Loading.jsx';
import { getUniqueGroupsForArea, prepareAreaSeries, transformDataForArea } from '../setAreaChart.js';
import { createBubbleChartOptions, transformBubbleData } from '../setBubbleChart.js';
import ReactECharts from 'echarts-for-react';
import { createFunnelChart, transformDataForFunnel } from '../setFunnelChart.js';
import { createRadarChartData, createRadarChartOptions, createRadarChartSeries } from '../setRadarChart.js';
import { deleteFile } from '../../../../../../../../apis/fileService.jsx';

export default function ChartTemplateElement({ selectedItem, fetchAllChartTemplate, justShow }) {
	const [options, setOptions] = useState(null);
	const [loading, setLoading] = useState(false);
	const [loadingCreate, setLoadingCreate] = useState(false);
	const [openModal, setOpenModal] = useState(false);
	const [tabs, setTabs] = useState([]);
	const [inputValue, setInputValue] = useState('');
	const [selectedFolder, setSelectedFolder] = useState(null);
	const { currentUser, uCSelected_CANVAS, listUC_CANVAS, loadData, setLoadData } = useContext(MyContext);
	const [optionF, setOptionF] = useState(null);
	const [reload, setReload] = useState(false);

	const confirm = async e => {
		try {
			await deleteChartTemplate(selectedItem.id);
			await fetchAllChartTemplate();
			message.success('Xóa thành công');
		} catch (error) {
			console.log('ERROR deleteChartTemplate', error);
		}
	};


	const cancel = e => {
	};

	async function fetchData() {
		setLoading(true);
		let rows = [];
		const templateInfo = await getTemplateByFileNoteId(selectedItem.id_filenote);
		let fills = await fetchDataColor();
		let template = templateInfo[0];
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
			const data2 = selectedItem.v3 ? transformData2(rows, selectedItem) : transformDataWithV6(rows, selectedItem); // Use new function if v3 is null
			const uniqueGroups2 = hasGroup ? getUniqueValues2(rows, selectedItem.v2) : [];
			const series2 = selectedItem.v3 ? prepareChartSeriesTemp2(uniqueGroups2, data2, 'linear', selectedItem.v1, hasGroup, selectedItem.v3, fills) : prepareChartSeriesWithV6(uniqueGroups2, data2, 'linear', selectedItem.v1, hasGroup, selectedItem.v6, fills); // Use new function if v3 is null
			let chart = createSectionData('', data2, series2, '');
			setOptions(chart);
		}
		if (selectedItem.type === 'bubble') {
			const data = transformBubbleData(rows, selectedItem);
			const chart = createBubbleChartOptions(data, selectedItem, fills);
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
				stacked: true,
			}));
			const chart = createSectionData('', barData, barSeries, '');
			setOptions(chart);
		}
		if (selectedItem.type === 'waterfall') {
			let waterfallData = transformDataForWaterfallChart(rows, selectedItem);
			const waterfallSeries = createWaterfallSeries(rows, selectedItem, fills);
			waterfallData = sortWF(waterfallData);
			let chart = createSectionData('', waterfallData, waterfallSeries, '');
			setOptions(chart);
		}
		if (selectedItem.type === 'combine') {
			const xKey = selectedItem.v1;
			const hasGroup = !!selectedItem.v2;

			const barData = transformDataForBarChart2(rows, selectedItem, selectedItem.isSort);
			const uniqueGroups = hasGroup ? [...new Set(rows.map(function (row) {
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
				{ position: 'bottom' },
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
		if (selectedItem.type === 'pie') {
			let dataChart = transformDataForPieChart(rows, selectedItem);
			let series = prepareChartSeriesForPieChart(fills);
			let chart = createSectionData('', dataChart, series, '');
			setOptions(chart);
		}
		if (selectedItem.type === 'funnel') {
			let data = transformDataForFunnel(rows, selectedItem.v2, selectedItem.v3);
			setOptionF(createFunnelChart(data, fills));
		}
		if (selectedItem.type === 'map') {
			let dataChart = transformDataForPieChart(rows, selectedItem);
			setOptions(createMap(dataChart, fills));
		}
		if (selectedItem.type === 'radar') {
			let chart = createRadarChartOptions(rows, selectedItem, fills);
			setOptions(chart);
		}
		setLoading(false);
	}

	useEffect(() => {
		setInputValue(selectedItem.name || '');
		Promise.all([fetchData(), loadFileTab()]);
	}, [selectedItem]);


	useEffect(() => {
		setInputValue(selectedItem.name || '');
		Promise.all([loadFileTab()]);
	}, [selectedItem, openModal]);


	const inputRef = useRef(null);

	useEffect(() => {
		if (openModal && inputRef.current) {
			setTimeout(() => {
				inputRef.current.focus();
			}, 100);
		}
	}, [openModal]);

	const loadFileTab = async () => {
		const fileTabs = await getAllFileTab();
		const filteredTabs = fileTabs.filter(tab => tab.hide == false && tab?.type == 'data');
		filteredTabs.sort((a, b) => a.position - b.position);
		setTabs(filteredTabs);
	};

	const handleOpenModal = async () => {
		try {
			let selectedFolder = tabs.find(e => e.position == 100);
			const newFileNote = {
				tab: selectedFolder.key,
				name: selectedItem.name,
				created_at: createTimestamp(),
				user_create: currentUser.email,
				userClass: [listUC_CANVAS.find(e => e.id == uCSelected_CANVAS)?.name || ''],
				table: 'ChartTemplate',
				type: selectedItem.id,
			};

			await createNewFileNotePad(newFileNote);
			await fetchAllChartTemplate();
			setReload(prev => !prev);
			message.success('Đã thêm biểu đồ vào kho!');
		} catch (error) {
			message.error('Có lỗi xảy ra khi thêm vào kho!');
		}
	};

	const handleOk = async () => {
		setLoadingCreate(true);
		try {

			const newData = {
				tab: selectedFolder,
				name: inputValue,
				created_at: createTimestamp(),
				user_create: currentUser.email,
				userClass: [listUC_CANVAS.find(e => e.id == uCSelected_CANVAS)?.name || ''],
				table: 'ChartTemplate',
				type: selectedItem.id,
			};

			await createNewFileNotePad(newData);
			setLoadData(!loadData);
			message.success('Tạo mới thành công!');
			setOpenModal(false);
		} catch (error) {
			console.error(error);
			message.error('Có lỗi xảy ra khi tạo mới. Vui lòng thử lại!');
		} finally {
			setInputValue(null);
			setSelectedFolder(null);
			setTimeout(() => {
				setLoadingCreate(false);
			}, 2000);
		}
	};


	const handleCancel = () => {
		setOpenModal(false);
		setInputValue(null);
		setSelectedFolder(null);
	};


	const handleDeleteKho = async (item) => {
		try {
			const fileNotes = await getAllFileNotePad();
			let fileNote = fileNotes.find(e => e.table == 'ChartTemplate' && e.type == item.id);
			if (fileNote) {
				await deleteFileNotePad(fileNote?.id);
				await fetchAllChartTemplate();
				setReload(prev => !prev);
				message.success('Đã xóa khỏi kho thành công');
			}
		} catch (error) {
			console.error(error);
			message.error('Có lỗi xảy ra khi xóa khỏi kho!');
		}
	};
    useEffect(() => {
        if (reload) {
            fetchData();
        }
    }, [reload]);
	return (
		<div className={css.main}>
			{!justShow && <div className={css.remove}>
				<Popconfirm
					title="Xác nhận xóa?"
					onConfirm={confirm}
					onCancel={cancel}
					okText="Xóa"
					cancelText="Hủy"
				>
					<Button
						shape="circle"
						icon={<DeleteOutlined />}
					/>
				</Popconfirm>
			</div>}

			{loading ? (
				<></>
			) : (
				<div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                }}>
                    <div style={{ flex: 1 }}>
                        {options && selectedItem.type !== 'funnel' && <AgCharts options={options} key={reload} />}
                        {optionF && selectedItem.type === 'funnel' &&
                            <ReactECharts option={optionF} style={{ height: 400 }} key={reload} />}
                    </div>
                    <div style={{
                        borderTop: '1px solid #f0f0f0',
                        padding: '16px',
                        marginTop: 'auto'
                    }}>
                        {selectedItem.created ? (
                            <Button
                                danger
                                onClick={() => handleDeleteKho(selectedItem)}
                                title="Xóa trong kho"
                            >
                                Xóa khỏi kho
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                onClick={handleOpenModal}
                            >
                                Tạo nhanh Data
                            </Button>
                        )}
                    </div>
                </div>
			)}

			<Modal
				title="Tạo mới Data Hub"
				open={openModal}
				onOk={handleOk}
				onCancel={handleCancel}
				okText="Xác nhận"
				cancelText="Hủy"
				confirmLoading={loadingCreate}
				okButtonProps={{
					style: {
						backgroundColor: !inputValue?.trim() || !selectedFolder ? '' : '#2d9d5b',
					},
					disabled: !inputValue?.trim() || !selectedFolder,

				}}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<Input
						ref={inputRef}
						placeholder="Nhập tên"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						allowClear
					/>

					<Select
						placeholder="Chọn thư mục"
						value={selectedFolder}
						onChange={(value) => setSelectedFolder(value)}
						allowClear
					>
						{tabs.map((item) => (
							<Option key={item.id} value={item.key}>
								{item.label}
							</Option>
						))}
					</Select>
				</div>
			</Modal>
		</div>
	);
}

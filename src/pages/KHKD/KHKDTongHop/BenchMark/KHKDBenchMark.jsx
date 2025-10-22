import { Button, Checkbox, List, Modal, Pagination, Dropdown, Menu } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import css from './KHKDBenchMark.module.css';
import { getKpiKQKDDataByIdKHKD, updateKpiKQKD } from '../../../../apis/kpiKQKDService.jsx';
import { AgGridReact } from 'ag-grid-react';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatCurrency, formatMoney } from '../../../../generalFunction/format.js';
import { generateChartOptions } from './../logicChartBenchMark.js';
import { AgCharts } from 'ag-charts-react';
import { MyContext } from '../../../../MyContext.jsx';
import { fetchDataColor } from '../../../Canvas/Daas/Content/Template/SettingChart/ChartTemplate/setChartTemplate.js';

export default function KHKDBenchMark({ dataDoLuong = [] }) {
	const { idHopKH } = useParams();
	const [isManageModalOpen, setIsManageModalOpen] = useState(false);
	const [kpiList, setKpiList] = useState([]);
	const [dataKPI, setDataKPI] = useState([]);
	const [selectedKpiIds, setSelectedKpiIds] = useState([]);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [selectedKpi, setSelectedKpi] = useState(null);
	const { loadData, setLoadData } = useContext(MyContext);

	const handleCancel = () => {
		setIsModalVisible(false);
		setSelectedKpi(null);
	};

	const showModal = (kpi) => {
		setSelectedKpi(kpi);
		setIsModalVisible(true);
	};

	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 3,
	});

	const defaultColDef = useMemo(() => ({
		editable: true,
		filter: true,
		suppressMenu: true,
		cellStyle: { fontSize: '14.5px' },
		wrapHeaderText: true,
		autoHeaderHeight: true,
	}), []);

	const columns = [
		{
			headerName: 'Tên', field: 'name', pinned: 'left', width: 350, editable: false, cellRenderer: (params) => {
				if (params.value === 'Benchmark 1') return 'Cao';
				if (params.value === 'Benchmark 2') return 'Thấp';
				return params.value;
			},
		},
		...Array.from({ length: 12 }, (_, i) => ({
			field: `t${i + 1}_th`,
			headerName: `Tháng ${i + 1}`,
			width: 160,
			cellStyle: { textAlign: 'right' },
			headerClass: 'ag-right-aligned-header',
			valueFormatter: (params) => formatCurrency(params.value.toFixed(2)),
			editable: (params) => {
				return params.data && !params.data.notEdit;
			},
		})),
	];

	// Lọc các KPI được chọn và áp dụng phân trang
	const selectedKpis = kpiList.filter(item => selectedKpiIds.includes(item.id));

	const paginatedKpis = selectedKpis.slice(
		(pagination.current - 1) * pagination.pageSize,
		pagination.current * pagination.pageSize,
	);

	const fetchKpiData = async () => {
		let fills = await fetchDataColor();
		if (dataDoLuong.length > 0) {
			try {
				const data = await getKpiKQKDDataByIdKHKD(Number(idHopKH));
				let rowData = [];
				let selectedIds = [];
				let kpiList = data.map(item => {
					const name = item.name;
					const benmarks = item.benmarks || [];
					const id = item.id;
					const formula = item.setting?.originalFormula || 'N/A';
					const variables = item.setting?.variables || [];
					const variableMap = Object.fromEntries(
						variables.map(v => [v.variable, v.group]),
					);
					const displayFormula = formula.replace(/\b[a-zA-Z]\b/g, match => {
						return variableMap[match] || match;
					});
					let rs = calculateFormulaResults(item.setting.processedFormula, item.setting.processedVariables);
					rs.name = displayFormula;
					rs.id = item.id;
					rs.notEdit = true;
					rowData.push(rs);
					if (item.isSelected) {
						selectedIds.push(item.id);
					}

					// Create chart data object with both rs and benchmarks
					const chartData = {
						name,
						id,
						formula,
						variables,
						displayFormula,
						rs: rs,
						benmarks: benmarks,
						benchmark1: item.benchmark1 || benchmarks[0],
						benchmark2: item.benchmark2 || benchmarks[1],
					};

					// Generate chart options with the properly structured data
					let options = generateChartOptions(chartData, fills);
					return {
						...chartData,
						options,
					};
				});
				setSelectedKpiIds(selectedIds);
				setDataKPI(rowData);
				setKpiList(kpiList);
			} catch (error) {
				console.error('Lỗi khi lấy dữ liệu KPI:', error);
			}
		}
	};

	useEffect(() => {
		fetchKpiData();
	}, [idHopKH, dataDoLuong, loadData]);

	const calculateFormulaResults = (formula, variables) => {
		const variableMap = {};
		variables.forEach(variable => {
			if (variable.group) {
				const groupData = dataDoLuong.find(item => item.name === variable.group);
				if (groupData) {
					variableMap[variable.group] = groupData;
				}
			}
		});

		const results = {};

		for (let month = 1; month <= 12; month++) {
			const processFormula = (columnSuffix = '') => {
				let evaluationFormula = formula;

				// Sort keys by length to avoid partial replacements (e.g., "Chi phí" before "Chi phí nhân sự")
				const sortedGroups = Object.keys(variableMap).sort((a, b) => b.length - a.length);

				sortedGroups.forEach(groupName => {
					const data = variableMap[groupName];
					const value = data[`t${month}${columnSuffix}`] || 0;
					const escapedGroupName = groupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

					// Replace with parentheses to ensure correct unary operator handling
					evaluationFormula = evaluationFormula.replace(
						new RegExp(`(?<![\\w])${escapedGroupName}(?![\\w])`, 'g'),
						`(${value})`,
					);
				});

				evaluationFormula = evaluationFormula
					.replace(/[()]/g, match => match) // giữ nguyên dấu ngoặc
					.replace(/\s+/g, ''); // xóa khoảng trắng

				try {
					return eval(evaluationFormula);
				} catch (e) {
					return 0;
				}
			};

			results[`t${month}`] = processFormula('');
			results[`t${month}_th`] = processFormula('_th');
			results[`t${month}_cl_th`] = processFormula('_cl_th');
			results[`t${month}_ck`] = processFormula('_ck');
			results[`t${month}_ck_cl`] = processFormula('_ck_cl');
		}

		return results;
	};

	const benchmarks = [
		{
			name: 'Benchmark 1',
			t1_th: 0, t2_th: 0, t3_th: 0, t4_th: 0,
			t5_th: 0, t6_th: 0, t7_th: 0, t8_th: 0,
			t9_th: 0, t10_th: 0, t11_th: 0, t12_th: 0,
		},
		{
			name: 'Benchmark 2',
			t1_th: 0, t2_th: 0, t3_th: 0, t4_th: 0,
			t5_th: 0, t6_th: 0, t7_th: 0, t8_th: 0,
			t9_th: 0, t10_th: 0, t11_th: 0, t12_th: 0,
		},
	];

	const handleCheckboxChange = async (checked, kpiId) => {
		const newIsSelected = checked;

		setSelectedKpiIds((prevSelected) =>
			newIsSelected
				? [...prevSelected, kpiId]
				: prevSelected.filter((id) => id !== kpiId),
		);

		try {
			await updateKpiKQKD({
				id: kpiId,
				isSelected: newIsSelected,
			});
		} catch (error) {
			console.error('Lỗi khi cập nhật KPI:', error);
		}
	};

	const createData = (data) => {
		const matched = dataKPI.find(kpi => kpi.id === data.id);
		if (!matched) return null;

		return [
			matched,
			...(data && data.benmarks?.length > 0 ? data.benmarks : JSON.parse(JSON.stringify(benchmarks))),
		];
	};

	const getRowByName = (api, targetName) => {
		const rowCount = api.getDisplayedRowCount();
		for (let i = 0; i < rowCount; i++) {
			const rowData = api.getDisplayedRowAtIndex(i)?.data;
			if (rowData?.name === targetName) {
				return rowData;
			}
		}
		return null;
	};

	const handleCellValueChanged = async (params, kpi) => {
		const updatedRow = params.data;
		if (updatedRow.name !== 'Benchmark 1' && updatedRow.name !== 'Benchmark 2') return;

		const benchmark1 = getRowByName(params.api, 'Benchmark 1');
		const benchmark2 = getRowByName(params.api, 'Benchmark 2');

		if (!benchmark1 || !benchmark2) {
			console.warn('Không tìm thấy đủ Benchmark 1 và Benchmark 2');
			return;
		}

		try {
			await updateKpiKQKD({
				id: kpi.id,
				benmarks: [benchmark1, benchmark2],
			});
			await fetchKpiData();
		} catch (err) {
			console.error('Lỗi khi cập nhật KPI:', err);
		}
	};

	const handlePaginationChange = (page, pageSize) => {
		setPagination({ current: page, pageSize });
	};

	const menuBenchmark = (
		<Menu>
			<Menu.Item key="cai-dat" onClick={() => setIsManageModalOpen(true)}>
				Cài đặt
			</Menu.Item>
		</Menu>
	);


	return (
		<div className={css.container}>
			{/* Header */}
			<div style={{ display: 'flex', marginBottom: '16px' }}>
				<h2>BENCHMARK</h2>
				<div style={{ marginLeft: 'auto', marginRight: '20px' }}>
					<Dropdown overlay={menuBenchmark} trigger={['click']} placement="bottomRight">
						<Button icon={<MoreOutlined />} />
					</Dropdown>
				</div>


				<Modal
					title="Cài đặt BENCHMARK"
					open={isManageModalOpen}
					onCancel={() => setIsManageModalOpen(false)}
					footer={null}
					width={700}
				>
					<div style={{ maxHeight: '60vh', overflow: 'auto', paddingRight: 10 }}>
						<List
							bordered
							dataSource={kpiList}
							renderItem={(item) => (
								<List.Item>
									<Checkbox
										checked={selectedKpiIds.includes(item.id)}
										onChange={(e) => handleCheckboxChange(e.target.checked, item.id)}
									>
										<strong>{item.name}</strong>: {item.displayFormula}
									</Checkbox>
								</List.Item>
							)}
						/>
					</div>
				</Modal>
			</div>

			<div className={css.containerContent}>
				{paginatedKpis.map(kpi => (
					<div className={css.kpiWrapper}>
						<div className={css.content}>
							<AgCharts
								options={{
									...kpi.options,
									legend: {
										enabled: false,
									},
								}}
								style={{ width: '100%' }}
							/>

							<Button
								className={css.updateButton}
								onClick={() => showModal(kpi)}
							>
								Cài đặt Benchmark
							</Button>
						</div>
					</div>
				))}
			</div>


			{selectedKpis.length > 3 && (
				<div style={{ display: 'flex', justifyContent: 'start', marginTop: 20 }}>
					<Pagination
						style={{ fontSize: '12px' }} // 👈 chỉnh kích cỡ nhỏ hơn
						current={pagination.current}
						pageSize={pagination.pageSize}
						total={selectedKpis.length}
						onChange={handlePaginationChange}
						showSizeChanger
						pageSizeOptions={['3', '6', '9', '12']}
						showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} KPI`}
					/>
				</div>
			)}

			<Modal
				title={`Update ${selectedKpi?.name}`}
				visible={isModalVisible}
				onCancel={handleCancel}
				footer={null}
				width={1500}
			>
				{selectedKpi && (
					<>
						<div className="ag-theme-quartz" style={{ marginBottom: 20 }}>
							<AgGridReact
								enableRangeSelection={true}
								statusBar={{
									statusPanels: [{ statusPanel: 'agAggregationComponent' }],
								}}
								defaultColDef={defaultColDef}
								columnDefs={columns}
								rowData={createData(selectedKpi)}
								domLayout="autoHeight"
								onCellValueChanged={(params) => handleCellValueChanged(params, selectedKpi)}
							/>
						</div>
					</>
				)}
			</Modal>
		</div>
	);
}

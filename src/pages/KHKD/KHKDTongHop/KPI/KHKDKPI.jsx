import React, { useContext, useEffect, useMemo, useState } from 'react';
import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, Modal, List, Input, Select } from 'antd';
import css from './KHKDKPI.module.css';
import { createNewKpiKQKD, deleteKpiKQKD, getKpiKQKDDataByIdKHKD } from '../../../../apis/kpiKQKDService.jsx';
import { AgGridReact } from 'ag-grid-react';
import { formatCurrency, formatMoney } from '../../../../generalFunction/format.js';
import { useParams } from 'react-router-dom';
import TooltipHover from './Tooltip/TooltipHover.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import { SettingLuyKeDL } from '../SettingLuyKe/SettingLuyKeDL.jsx';
import { SettingLuyKeKPI } from '../SettingLuyKe/SettingLuyKeKPI.jsx';
import { getLuyKeValue } from '../SettingLuyKe/logicLuyKe.js';

const KHKDKPI = ({ showCungKy, settingMonth, dataDoLuong = [], listDienGiai, setKPIDataAI, khkdTH, hasKH }) => {
	const { loadData, setLoadData } = useContext(MyContext);
	const { idHopKH } = useParams();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [kpiList, setKpiList] = useState([]);
	const [rowData, setRowData] = useState([]);
	const [isManageModalOpen, setIsManageModalOpen] = useState(false);
	const [formData, setFormData] = useState({
		groupName: '',
		formula: '',
		variables: [],
	});
	const [showLuyKeKPI, setShowLuyKeKPI] = useState(false);

	const defaultColDef = useMemo(() => ({
		editable: true,
		filter: true,
		suppressMenu: true,
		cellStyle: { fontSize: '14.5px' },
		wrapHeaderText: true,
		autoHeaderHeight: true,
		width: 120,
	}), []);

	const fetchKpiData = async () => {
		if (dataDoLuong.length > 0) {
			try {
				const data = await getKpiKQKDDataByIdKHKD(Number(idHopKH));
				let rowData = [];
				let kpiList = data.map(item => {
					const name = item.name;
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
					rs.name = name;
					rowData.push(rs);
					return {
						name,
						id,
						formula,
						variables,
						displayFormula,
						rs,
					};
				});
				setRowData(rowData);
				// setKPIDataAI(rowData);
				setKpiList(kpiList);

			} catch (error) {
				console.error('Error fetching KPI data:', error);
			}
		}
	};

	useEffect(() => {
		fetchKpiData();
	}, [idHopKH, dataDoLuong, settingMonth]);

	const availableGroups = [...new Set(dataDoLuong.map(item => item.name))];

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

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setFormData({
			groupName: '',
			formula: '',
			variables: [],
		});
	};

	function buildProcessedFormula(formula, variables) {
		if (!Array.isArray(variables)) return formula;

		// Bước 1: Thay thế biến bằng placeholder tạm thời
		let result = formula;
		variables.forEach(variable => {
			const escapedVar = variable.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
			result = result.replace(
				new RegExp(`\\b${escapedVar}\\b`, 'g'),
				`__VAR_${variable.name}__`,
			);
		});

		// Bước 2: Thay thế placeholder bằng group name
		variables.forEach(variable => {
			const placeholder = `__VAR_${variable.name}__`;
			result = result.replace(
				new RegExp(placeholder, 'g'),
				variable.group,
			);
		});

		return result;
	}

	const handleSave = async () => {
		if (!formData.groupName.trim() || !formData.formula.trim()) return;
		const processedFormula = buildProcessedFormula(formData.formula, formData.variables);
		const kpiData = {
			id_khkd_tong_hop: Number(idHopKH),
			name: formData.groupName, // formulaName
			setting: {
				originalFormula: formData.formula,
				variables: formData.variables.map(v => ({
					variable: v.name,
					group: v.group,
				})),
				processedFormula,
				processedVariables: formData.variables,
			},
			created_at: new Date().toISOString(),
			show: true,
			benmarks: [
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
			],
		};

		try {
			await createNewKpiKQKD(kpiData); // Save to the database
			handleCloseModal(); // Close modal and reset form
			await fetchKpiData();
		} catch (error) {
			console.error('Error saving KPI:', error);
		} finally {
			setLoadData(!loadData);
		}

		handleCloseModal();
	};

	const parseSafeNumber = (value) => {
		const n = Number(value);
		return isNaN(n) ? 0 : n;
	};

	const columns = [
		{
			headerName: 'Tên',
			field: 'name',
			pinned: 'left',
			width: 460,
			cellRenderer: (params) => (
				<TooltipHover {...params} listDienGiai={listDienGiai} />
			),
		},
		{
			headerName: 'Lũy kế',
			headerClass: 'ag-center-header-group',
			children: [
				{
					headerName: 'Thực hiện',
					field: 'total_th',
					valueGetter: (params) => getLuyKeValue(params, settingMonth, khkdTH.luyKeKPI, '_th'),
					valueFormatter: (params) => {
						const value = parseSafeNumber(params.value);
						const name = (params.data?.name || '').toLowerCase();
						const isPercentage = name.includes('tỷ lệ') || name.includes('%');

						if (isPercentage) {
							return formatCurrency((value * 100).toFixed(2)) + '%';
						}
						return formatCurrency(value.toFixed(2));
					},
					cellStyle: { textAlign: 'right' },
					headerClass: 'ag-right-aligned-header',
					width: 160,
				},
				...(hasKH ? [{
					headerName: 'Kế hoạch',
					field: 'total_kh',
					valueGetter: (params) => getLuyKeValue(params, settingMonth, khkdTH.luyKeKPI, ''),
					valueFormatter: (params) => {
						const value = parseSafeNumber(params.value);
						const name = (params.data?.name || '').toLowerCase();
						const isPercentage = name.includes('tỷ lệ') || name.includes('%');

						if (isPercentage) {
							return formatCurrency((value * 100).toFixed(2)) + '%';
						}
						return formatCurrency(value.toFixed(2));
					},
					cellStyle: { textAlign: 'right' },
					headerClass: 'ag-right-aligned-header',
					width: 160,
				},
				{
					headerName: 'Chênh lệch KH-TH',
					field: 'total_diff',
					valueGetter: (params) => {
						const th = getLuyKeValue(params, settingMonth, khkdTH.luyKeKPI, '_th');
						const kh = getLuyKeValue(params, settingMonth, khkdTH.luyKeKPI, '');
						return th - kh;
					},
					valueFormatter: (params) => {
						const value = parseSafeNumber(params.value);
						const name = (params.data?.name || '').toLowerCase();
						const isPercentage = name.includes('tỷ lệ') || name.includes('%');

						if (isPercentage) {
							return formatCurrency((value * 100).toFixed(2)) + '%';
						}
						return formatCurrency(value.toFixed(2));
					},
					cellStyle: (params) => ({
						textAlign: 'right',
						color:
							params.value < 0
								? 'red'
								: params.value > 0
									? 'green'
									: '#e48407',
					}),
					headerClass: 'ag-right-aligned-header',
					width: 160,
				}] : []),
				{
					headerName: 'Cùng kỳ',
					field: 'total_ck',
					valueGetter: (params) => getLuyKeValue(params, settingMonth, khkdTH.luyKeDL, '_ck'),
					valueFormatter: (params) => {
						const value = parseSafeNumber(params.value);
						const name = (params.data?.name || '').toLowerCase();
						const isPercentage = name.includes('tỷ lệ') || name.includes('%');

						if (isPercentage) {
							return formatCurrency((value * 100).toFixed(2)) + '%';
						}
						return formatCurrency(value.toFixed(2));
					},
					cellStyle: { textAlign: 'right' },
					headerClass: 'ag-right-aligned-header',
					width: 160,
					hide: !showCungKy,
				},
				{
					headerName: 'Chênh lệch CK',
					field: 'total_diff_ck',
					valueGetter: (params) => {
						const th = getLuyKeValue(params, settingMonth, khkdTH.luyKeDL, '_th');
						const ck = getLuyKeValue(params, settingMonth, khkdTH.luyKeDL, '_ck');
						return th - ck;
					}
					, valueFormatter: (params) => {
						const value = parseSafeNumber(params.value);
						const name = (params.data?.name || '').toLowerCase();
						const isPercentage = name.includes('tỷ lệ') || name.includes('%');

						if (isPercentage) {
							return formatCurrency((value * 100).toFixed(2)) + '%';
						}
						return formatCurrency(value.toFixed(2));
					},
					cellStyle: (params) => ({
						textAlign: 'right',
						color:
							params.value < 0
								? 'red'
								: params.value > 0
									? 'green'
									: '#e48407',
					}),
					headerClass: 'ag-right-aligned-header',
					width: 160,
					hide: !showCungKy,
				},
			],
		},
		...(settingMonth ?? [])
			.slice()
			.sort((a, b) => b - a)
			.map((month) => ({
				headerName: `Tháng ${month}`,
				headerClass: 'ag-center-header-group',
				children: [
					{
						headerName: 'Thực hiện',
						field: `t${month}_th`,
						cellStyle: { textAlign: 'right' },
						headerClass: 'ag-right-aligned-header',
						valueFormatter: (params) => {
							const value = parseSafeNumber(params.value);
							const name = (params.data?.name || '').toLowerCase();
							const isPercentage = name.includes('tỷ lệ') || name.includes('%');

							if (isPercentage) {
								return formatCurrency((value * 100).toFixed(2)) + '%';
							}
							return formatCurrency(value.toFixed(2));
						},
						width: 140,
					},
					...(hasKH ? [{
						headerName: 'Kế hoạch',
						field: `t${month}`,
						editable: true,
						cellStyle: { textAlign: 'right' },
						headerClass: 'ag-right-aligned-header',
						valueFormatter: (params) => {
							const value = parseSafeNumber(params.value);
							const name = (params.data?.name || '').toLowerCase();
							const isPercentage = name.includes('tỷ lệ') || name.includes('%');

							if (isPercentage) {
								return formatCurrency((value * 100).toFixed(2)) + '%';
							}
							return formatCurrency(value.toFixed(2));
						},
						width: 140,
					},
					{
						headerName: 'Chênh lệch KH-TH',
						editable: false,
						valueGetter: (params) => {
							const th = parseSafeNumber(params.data[`t${month}_th`]);
							const kh = parseSafeNumber(params.data[`t${month}`]);
							const diff = th - kh;
							const percent = th !== 0 ? (diff / th) * 100 : 0;
							return { diff, percent };
						},
						valueFormatter: (params) => {
							const value = parseSafeNumber(params.value.diff);
							const name = (params.data?.name || '').toLowerCase();
							const isPercentage = name.includes('tỷ lệ') || name.includes('%');
							if (isPercentage) {
								return formatCurrency((value * 100).toFixed(2)) + '%';
							}
							return formatCurrency(value.toFixed(2));
						},
						cellStyle: (params) => {
							const value = params.value?.diff;
							return {
								textAlign: 'right',
								color: value < 0 ? 'red' : value > 0 ? 'green' : '#e48407',
							};
						},
						headerClass: 'ag-right-aligned-header',
						width: 160,
					}] : []),
					{
						headerName: 'Cùng kỳ',
						field: `t${month}_ck`,
						cellStyle: { textAlign: 'right' },
						headerClass: 'ag-right-aligned-header',
						valueFormatter: (params) => {
							const value = parseSafeNumber(params.value);
							const name = (params.data?.name || '').toLowerCase();
							const isPercentage = name.includes('tỷ lệ') || name.includes('%');

							if (isPercentage) {
								return formatCurrency((value * 100).toFixed(2)) + '%';
							}
							return formatCurrency(value.toFixed(2));
						},
						width: 140,
						hide: !showCungKy,
					},
					{
						headerName: 'Chênh lệch CK',
						editable: false,
						field: `t${month}_cl_ck`,
						valueGetter: (params) => {
							const th = parseSafeNumber(params.data[`t${month}_th`]);
							const ck = parseSafeNumber(params.data[`t${month}_ck`]);
							const diff = th - ck;
							const percent = ck !== 0 ? (diff / ck) * 100 : 0;
							return { diff, percent };
						},
						valueFormatter: (params) => {
							const value = parseSafeNumber(params.value.diff);
							const name = (params.data?.name || '').toLowerCase();
							const isPercentage = name.includes('tỷ lệ') || name.includes('%');
							if (isPercentage) {
								return formatCurrency((value * 100).toFixed(2)) + '%';
							}
							return formatCurrency(value.toFixed(2));
						},
						cellStyle: (params) => {
							const value = params.value?.diff;
							return {
								textAlign: 'right',
								color: value < 0 ? 'red' : value > 0 ? 'green' : '#e48407',
							};
						},
						headerClass: 'ag-right-aligned-header',
						width: 160,
						hide: !showCungKy,
					},
				],
			})),
	];

	const menuKPI = (
		<Menu>
			<Menu.Item key="tao-moi" onClick={() => setIsModalOpen(true)}>
				Tạo mới KPI
			</Menu.Item>
			<Menu.Item key="quan-ly" onClick={() => setIsManageModalOpen(true)}>
				Quản lý KPI
			</Menu.Item>
			<Menu.Item key="cai-dat-luy-ke" onClick={() => setShowLuyKeKPI(true)}>
				Cài đặt lũy kế
			</Menu.Item>
		</Menu>
	);


	return (
		<div style={{ marginBottom: '16px' }}>
			{/* Header */}
			<div style={{ display: 'flex', marginBottom: '16px' }}>
				<h2>ĐO LƯỜNG KPI</h2>
				{showLuyKeKPI &&
					<SettingLuyKeKPI isOpen={showLuyKeKPI} setIsOpen={setShowLuyKeKPI} dataDoLuong={rowData}
									 dataKinhDoanh={[]} khkdTH={khkdTH} />}
				<div style={{ marginLeft: 'auto', marginRight: '20px' }}>
					<Dropdown overlay={menuKPI} trigger={['click']} placement="bottomRight">
						<Button icon={<MoreOutlined />} />
					</Dropdown>
				</div>

				<Modal
					title="Quản lý KPI"
					open={isManageModalOpen}
					onCancel={() => setIsManageModalOpen(false)}
					footer={null}
					width={700}
				>
					<div style={{ height: '70vh', overflow: 'auto' }}>
						<List
							bordered
							dataSource={kpiList}
							renderItem={(item) => (
								<List.Item
									actions={[
										<Button
											type="link"
											danger
											onClick={() => {
												if (!item.id) {
													console.error('Error: KPI ID is undefined');
													return;
												}
												Modal.confirm({
													title: 'Bạn có muốn xoá KPI này không?',
													content: `KPI: ${item.name}`,
													okText: 'Có',
													cancelText: 'Không',
													onOk: async () => {
														try {
															// Call the deleteKpiKQKD function with the KPI ID
															await deleteKpiKQKD(item.id);
															// Refresh the KPI list
															await fetchKpiData();
														} catch (error) {
															console.error('Error deleting KPI:', error);
														}
													},
												});
											}}
										>
											Delete
										</Button>,
									]}
								>
									<div>
										<strong>{item.name}</strong>: {item.displayFormula}
									</div>
								</List.Item>
							)}
						/>
					</div>

				</Modal>
			</div>
			{rowData && rowData.length > 0 &&
				<div className="ag-theme-quartz" style={{ marginBottom: 20 }}>
					<AgGridReact
						enableRangeSelection={true}
						statusBar={{
							statusPanels: [{ statusPanel: 'agAggregationComponent' }],
						}}
						defaultColDef={defaultColDef}
						columnDefs={columns}
						rowData={rowData}
						domLayout="autoHeight" />
				</div>}

			{/* Formula Modal */}
			<Modal
				title="Tạo mới KPI"
				open={isModalOpen}
				onCancel={() => setIsModalOpen(false)}
				onOk={handleSave}
			>
				<Input
					placeholder="Tên KPI"
					value={formData.groupName}
					onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
					style={{ marginBottom: 10 }}
				/>
				<Input
					placeholder="Công thức (ví dụ a+b)"
					value={formData.formula}
					onChange={(e) => {
						const newFormula = e.target.value;
						const variables = Array.from(new Set(
							newFormula.match(/[a-zA-Z]+/g) || [],
						)).map(varName => ({
							name: varName,
							group: '',
						}));
						setFormData({
							...formData,
							formula: newFormula,
							variables,
						});
					}}
					style={{ marginBottom: 10 }}
				/>
				{formData.variables.map(variable => (
					<div key={variable.name} style={{ marginBottom: 8 }}>
						<span style={{ marginRight: 6 }}>{variable.name}:</span>
						<Select
							showSearch
							optionFilterProp="children"
							value={variable.group}
							onChange={(value) => {
								setFormData({
									...formData,
									variables: formData.variables.map(v =>
										v.name === variable.name ? { ...v, group: value } : v,
									),
								});
							}}
							style={{ width: '96%' }}
						>
							<Select.Option value="">Select group</Select.Option>
							{availableGroups.map(group => (
								<Select.Option key={group} value={group}>
									{group}
								</Select.Option>
							))}
						</Select>
					</div>
				))}
			</Modal>
		</div>
	);
};

export default KHKDKPI;

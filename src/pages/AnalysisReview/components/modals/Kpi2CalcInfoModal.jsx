import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Modal, Typography, Space, Tag, Table, Empty } from 'antd';
import { getKpi2CalculatorById } from '../../../../apis/kpi2CalculatorService.jsx';
import {
	getAllKpiCalculator,
	getKpiCalculatorById,
	updateKpiCalculator,
} from '../../../../apis/kpiCalculatorService.jsx';
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
import { getTableByid, getTemplateRow } from '../../../../apis/templateSettingService.jsx';
import { loadAndMergeData } from '../../../Canvas/Daas/Content/Template/SettingCombine/logicCombine.js';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { evaluate } from 'mathjs';
import { getISOWeek, getISOWeekYear } from 'date-fns';

const { Text, Title } = Typography;

function Kpi2CalcInfoModal({
							   open,
							   onClose,
							   kpi2CalculatorId,
							   allKpiCalculators = [],
							   dashboardItemId,
							   dashboardItemSettings = {},
							   onSaveDashboardItemSettings,
						   }) {
	const [loading, setLoading] = useState(false);
	const [kpi2Data, setKpi2Data] = useState(null);
	const [componentKpis, setComponentKpis] = useState([]);
	const [templateDataMap, setTemplateDataMap] = useState({}); // { [kpiId]: { loading, columns, rows } }
	const computedTableMapRef = useRef({}); // { [kpiId]: [{date, value}] }

	// Determine common target period for template data (smallest granularity among component KPIs)
	const targetTemplatePeriod = useMemo(() => {
		const order = { day: 1, week: 2, month: 3 };
		let min = 3; // default month
		(componentKpis || []).forEach(k => {
			const p = k?.period;
			if (p && order[p] && order[p] < min) min = order[p];
		});
		return min === 1 ? 'day' : (min === 2 ? 'week' : 'month');
	}, [componentKpis]);

	useEffect(() => {
		if (!open || !kpi2CalculatorId) return;
		let isActive = true;

		async function load() {
			try {
				setLoading(true);
				const kpi2 = await getKpi2CalculatorById(kpi2CalculatorId);
				if (!isActive) return;
				setKpi2Data(kpi2 || null);

				const kpiIds = Array.isArray(kpi2?.kpiList) ? kpi2.kpiList : [];
				const enriched = [];
				for (const kid of kpiIds) {
					try {
						const full = await getKpiCalculatorById(kid);
						if (!isActive) return;
						enriched.push(full);
					} catch {
					}

				}
				if (isActive) setComponentKpis(enriched.filter(Boolean));
			} finally {
				if (isActive) setLoading(false);
			}
		}

		load();
		return () => {
			isActive = false;
		};
	}, [open, kpi2CalculatorId]);

	const variableMap = useMemo(() => {
		try {
			const calcObj = typeof kpi2Data?.calc === 'string' ? JSON.parse(kpi2Data.calc) : (kpi2Data?.calc || {});
			return calcObj.variables || {};
		} catch {
			return {};
		}
	}, [kpi2Data]);

	const columns = [
		{ title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
		{ title: 'Tên KPI', dataIndex: 'name', key: 'name' },
		{ title: 'Chu kỳ', dataIndex: 'period', key: 'period', width: 120 },
		{
			title: 'Biến', key: 'var', width: 140, render: (_, record) => {
				const key = Object.keys(variableMap).find(vk => variableMap[vk]?.type === 'kpi' && String(variableMap[vk]?.id) === String(record.id));
				return key ? <Tag color="blue">{key}</Tag> : <Text type="secondary">-</Text>;
			},
		},
	];

	const renderPreviewTable = (record) => {
		const entry = templateDataMap[record.id];
		if (!entry || entry.loading) return <Text type="secondary">Đang tính kết quả...</Text>;
		if (!entry.rows || entry.rows.length === 0) return <Empty description="Chưa có dữ liệu tính" />;

		// Parse calc config
		let formula = '';
		let variables = {};
		let conditions = [];
		let variableCalcTypes = {};
		try {
			const calcObj = typeof record.calc === 'string' ? JSON.parse(record.calc) : (record.calc || {});
			formula = (calcObj.formula || '').toLowerCase();
			variables = calcObj.variables || {};
			conditions = calcObj.conditions || [];
			variableCalcTypes = calcObj.variableCalcTypes || {};
		} catch {
		}

		// Helper: build period key per KPI period
		const buildPeriodKey = (raw) => {
			if (!raw) return '';
			let date = new Date(raw);
			if (isNaN(date) && typeof raw === 'string') {
				if (raw.includes('/')) {
					const parts = raw.split('/');
					if (parts.length === 3) {
						const [dd, mm, yyyy] = parts.map(Number);
						date = new Date(yyyy, (mm || 1) - 1, dd || 1);
					}
				} else if (raw.includes('-')) {
					const parts = raw.split('-');
					if (parts.length >= 2) {
						const yyyy = Number(parts[0]);
						const mm = Number(parts[1]);
						const dd = parts[2] ? Number(parts[2]) : 1;
						date = new Date(yyyy, (mm || 1) - 1, dd || 1);
					}
				}
			}
			if (isNaN(date)) return String(raw);
			const year = date.getFullYear();
			if (record.period === 'day') {
				const d = String(date.getDate()).padStart(2, '0');
				const m = String(date.getMonth() + 1).padStart(2, '0');
				return `${d}/${m}/${year}`;
			} else if (record.period === 'week') {
				const week = getISOWeek(date);
				const y = getISOWeekYear(date);
				return `Tuần ${week}/${y}`;
			} else {
				const m = date.getMonth() + 1;
				return `Tháng ${m}/${year}`;
			}
		};

		// Optional: basic conditions filtering (only equality/inequality numeric/string)
		const periodFieldKey = record.periodField;
		const filtered = Array.isArray(conditions) && conditions.length > 0 ? entry.rows.filter((row) => {
			let result = null;
			for (let i = 0; i < conditions.length; i++) {
				const cond = conditions[i];
				const field = cond.field;
				const op = cond.operator || '=';
				const val = cond.value;
				const rowVal = row[field];
				let current = true;
				if (rowVal == null) current = false; else {
					if (!isNaN(Number(rowVal)) && !isNaN(Number(val))) {
						const a = Number(rowVal), b = Number(val);
						if (op === '=') current = a === b; else if (op === '!=') current = a !== b; else if (op === '>') current = a > b; else if (op === '>=') current = a >= b; else if (op === '<') current = a < b; else if (op === '<=') current = a <= b;
					} else {
						const a = String(rowVal).toLowerCase();
						const b = String(val).toLowerCase();
						if (op === '=') current = a === b; else if (op === '!=') current = a !== b; else if (op === 'contains') current = a.includes(b); else if (op === 'not contains') current = !a.includes(b);
					}
				}
				if (i === 0) result = current; else result = (cond.logic || 'AND') === 'AND' ? (result && current) : (result || current);
			}
			return !!result;
		}) : entry.rows;

		// Aggregate by period
		const grouped = {};
		filtered.forEach((row) => {
			const pKey = buildPeriodKey(row[periodFieldKey]);
			if (!grouped[pKey]) grouped[pKey] = { _date: pKey };
			Object.keys(variables).forEach((vk) => {
				const field = variables[vk]?.field;
				if (!field) return;
				const valRaw = row[field];
				if (valRaw == null || valRaw === '' || isNaN(Number(valRaw))) return;
				const val = Number(valRaw);
				const calcType = variableCalcTypes[vk] || 'sum';
				if (!grouped[pKey][vk]) grouped[pKey][vk] = { sum: 0, count: 0 };
				if (calcType === 'count') grouped[pKey][vk].count += 1; else {
					grouped[pKey][vk].sum += val;
					grouped[pKey][vk].count += 1;
				}
			});
		});

		// Build result rows sorted by chronology
		const keys = Object.keys(grouped).sort((a, b) => {
			const parse = (key) => {
				if (key.startsWith('Tuần ')) {
					const [w, y] = key.replace('Tuần ', '').split('/').map(Number);
					return { y, m: 0, d: w };
				}
				if (key.startsWith('Tháng ')) {
					const [m, y] = key.replace('Tháng ', '').split('/').map(Number);
					return { y, m, d: 1 };
				}
				if (key.includes('/')) {
					const [d, m, y] = key.split('/').map(Number);
					return { y, m, d };
				}
				return { y: 0, m: 0, d: 0 };
			};
			const A = parse(a), B = parse(b);
			if (A.y !== B.y) return A.y - B.y;
			if (A.m !== B.m) return A.m - B.m;
			return A.d - B.d;
		});

		let rows = keys.map((k) => {
			const acc = grouped[k];
			const vars = {};
			Object.keys(variables).forEach((vk) => {
				const calcType = variableCalcTypes[vk] || 'sum';
				const cell = acc[vk];
				if (!cell) {
					vars[vk] = 0;
					return;
				}
				if (calcType === 'count') vars[vk] = cell.count; else if (calcType === 'avg') vars[vk] = cell.count ? (cell.sum / cell.count) : 0; else vars[vk] = cell.sum;
			});
			return { date: k, value: evaluate(formula || '0', vars) };
		});

		if ((record.calcType || '').toLowerCase() === 'cumulative') {
			let cumulative = 0;
			rows = rows.map((r) => {
				const v = (r.value != null && !isNaN(r.value)) ? Number(r.value) : 0;
				cumulative += v;
				return { ...r, value: cumulative };
			});
		}

		// Save computed rows so we can update back on close only via ref (avoid rerenders/loops)
		computedTableMapRef.current = { ...computedTableMapRef.current, [record.id]: rows };

		const formatNumber = (num) => {
			if (num == null || isNaN(num)) return '-';
			try {
				return Number(num).toLocaleString('vn-VN', {
					minimumFractionDigits: 0,
					maximumFractionDigits: 2,
					useGrouping: true,
				});
			} catch {
				return String(num);
			}
		};

		return (
			<div style={{ overflowX: 'auto', maxWidth: '100%' }}>
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
					<tr>
						{rows.map((item, idx) => (
							<th key={idx} style={{
								borderBottom: '1px solid #f0f0f0',
								textAlign: 'center',
								whiteSpace: 'nowrap',
							}}>{item.date}</th>
						))}
					</tr>
					</thead>
					<tbody>
					<tr>
						{rows.map((item, idx) => (
							<td key={idx} style={{ padding: 4, textAlign: 'center' }}>{formatNumber(item.value)}</td>
						))}
					</tr>
					</tbody>
				</table>
			</div>
		);
	};

	const loadTemplateForKpi = async (kpi) => {
		console.log(kpi);
		if (!kpi || !kpi.dataSource) return;
		const kpiId = kpi.id;
		setTemplateDataMap(prev => ({ ...prev, [kpiId]: { ...(prev[kpiId] || {}), loading: true } }));
		try {
			const approvedVersions = await getAllApprovedVersion();
			const selectedVersion = approvedVersions.find(v => v.id == kpi.dataSource);
			if (!selectedVersion) {
				setTemplateDataMap(prev => ({ ...prev, [kpiId]: { loading: false, columns: [], rows: [] } }));
				return;
			}
			let versionId = selectedVersion.id_version;
			const templateId = selectedVersion.id_template;
			const templateTable = await getTableByid(templateId);
			let columns = [];
			if (templateTable?.steps && templateTable.steps.length > 0) {
				const targetStep = templateTable.steps.find(step => step.id === versionId);
				if (targetStep?.config?.outputColumns) {
					columns = targetStep.config.outputColumns.map(col => ({
						dataIndex: col.name || col,
						title: col.name || col,
					}));
				} else {
					const lastStep = templateTable.steps[templateTable.steps.length - 1];
					if (lastStep?.outputColumns) {
						columns = lastStep.outputColumns.map(col => ({
							dataIndex: col.name || col,
							title: col.name || col,
						}));
					}
				}
			}
			if (versionId === 1) versionId = null;
			let rows = [];
			if (templateTable?.isCombine) {
				const dataCombine = await loadAndMergeData(templateTable);
				if (Array.isArray(dataCombine) && dataCombine.length > 0) {
					const fields = Object.keys(dataCombine[0]);
					if (columns.length === 0) {
						columns = fields.map(name => ({ dataIndex: name, title: name }));
					}
					rows = dataCombine;
				}
			} else {
				const response = await getTemplateRow(templateId, versionId);
				const rawRows = response?.rows || {};
				rows = Object.values(rawRows).map(r => r.data);
				if (rows.length > 0 && columns.length === 0) {
					const fields = Object.keys(rows[0]);
					columns = fields.map(name => ({ dataIndex: name, title: name }));
				}
			}
			setTemplateDataMap(prev => ({ ...prev, [kpiId]: { loading: false, columns, rows } }));
		} catch (e) {
			setTemplateDataMap(prev => ({ ...prev, [kpiId]: { loading: false, columns: [], rows: [] } }));
		}
	};

	const statusBar = useMemo(() => {
		return {
			statusPanels: [{ statusPanel: 'agAggregationComponent' }],
		};
	}, []);
	const renderTemplateTable = (record) => {
		const entry = templateDataMap[record.id];
		if (!record.dataSource) return <Text type="secondary">KPI chưa cấu hình nguồn dữ liệu</Text>;
		if (!entry || entry.loading) return <Text type="secondary">Đang tải dữ liệu nguồn...</Text>;
		if (!entry.rows || entry.rows.length === 0) return <Empty description="Không có dữ liệu nguồn" />;

		// Helper: period key formatting similar to KPIContent
		const buildPeriodKey = (raw) => {
			if (!raw) return '';
			let date = new Date(raw);
			if (isNaN(date)) {
				if (typeof raw === 'string') {
					if (raw.includes('/')) {
						const parts = raw.split('/');
						if (parts.length === 3) {
							const [dd, mm, yyyy] = parts.map(Number);
							date = new Date(yyyy, (mm || 1) - 1, dd || 1);
						}
					} else if (raw.includes('-')) {
						const parts = raw.split('-');
						if (parts.length >= 2) {
							const yyyy = Number(parts[0]);
							const mm = Number(parts[1]);
							const dd = parts[2] ? Number(parts[2]) : 1;
							date = new Date(yyyy, (mm || 1) - 1, dd || 1);
						}
					}
				}
			}
			if (isNaN(date)) return String(raw);
			const year = date.getFullYear();
			if (targetTemplatePeriod === 'day') {
				const d = String(date.getDate()).padStart(2, '0');
				const m = String(date.getMonth() + 1).padStart(2, '0');
				return `${d}/${m}/${year}`;
			} else if (targetTemplatePeriod === 'week') {
				const weekNumber = getISOWeek(date);
				const y = getISOWeekYear(date);
				return `Tuần ${weekNumber}/${y}`;
			} else {
				const m = date.getMonth() + 1;
				return `Tháng ${m}/${year}`;
			}
		};

		// Determine period field key used in rows; if not present, add a new derived column
		const candidate = record.periodField;
		const sample = entry.rows[0] || {};
		const hasKey = Object.prototype.hasOwnProperty.call(sample, candidate);
		const fieldKey = hasKey ? candidate : null;

		let transformedRows;
		let transformedColumns;
		if (fieldKey) {
			transformedRows = entry.rows.map(r => ({ ...r, [fieldKey]: buildPeriodKey(r[fieldKey]) }));
			transformedColumns = entry.columns;
		} else {
			const derivedKey = '_periodKey';
			transformedRows = entry.rows.map(r => ({ ...r, [derivedKey]: buildPeriodKey(r[candidate]) }));
			transformedColumns = [{ title: 'Kỳ', dataIndex: derivedKey }, ...entry.columns];
		}

		// Convert columns for ag-Grid
		const columnDefs = transformedColumns.map(col => ({
			headerName: col.title || col.dataIndex,
			field: col.dataIndex,
			minWidth: 120,
			resizable: true,
			sortable: true,
			filter: true,
		}));

		// Optional: Pivot by week/month (columns are periods, rows are selected variable fields under 'Khoản')
		let pivotContent = null;
		if (targetTemplatePeriod === 'week' || targetTemplatePeriod === 'month') {
			let variables = {};
			let variableCalcTypes = {};
			try {
				const calcObj = typeof record.calc === 'string' ? JSON.parse(record.calc) : (record.calc || {});
				variables = calcObj.variables || {};
				variableCalcTypes = calcObj.variableCalcTypes || {};
			} catch {
			}

			const periodKeyField = (Object.prototype.hasOwnProperty.call(transformedRows[0] || {}, candidate)) ? candidate : '_periodKey';
			const periods = [];
			const periodSet = new Set();
			transformedRows.forEach(r => {
				const pk = r[periodKeyField];
				if (!periodSet.has(pk)) {
					periodSet.add(pk);
					periods.push(pk);
				}
			});

			const titleByField = (f) => {
				const c = transformedColumns.find(c => c.dataIndex === f);
				return (c && c.title) || f;
			};

			// Determine variable field ids and non-time retained columns
			const variableFieldIds = Object.keys(variables).map(vk => variables[vk]?.field).filter(Boolean);
			const retainedCols = transformedColumns
				.filter(c => c.dataIndex !== periodKeyField && !variableFieldIds.includes(c.dataIndex));

			// Group by retained dimension values
			const groups = new Map(); // key -> { dims, rows: [] }
			const makeKey = (r) => JSON.stringify(retainedCols.map(c => [c.dataIndex, r[c.dataIndex]]));
			transformedRows.forEach(r => {
				const key = makeKey(r);
				if (!groups.has(key)) groups.set(key, {
					dims: Object.fromEntries(retainedCols.map(c => [c.dataIndex, r[c.dataIndex]])),
					rows: [],
				});
				groups.get(key).rows.push(r);
			});

			const pivotRows = [];
			for (const { dims, rows } of groups.values()) {
				for (const vk of Object.keys(variables)) {
					const field = variables[vk]?.field;
					if (!field) continue;
					const agg = {};
					rows.forEach(r => {
						const pk = r[periodKeyField];
						const raw = r[field];
						if (raw == null || raw === '' || isNaN(Number(raw))) return;
						const val = Number(raw);
						agg[pk] = agg[pk] || { sum: 0, count: 0 };
						agg[pk].sum += val;
						agg[pk].count += 1;
					});
					const calcType = (variableCalcTypes && variableCalcTypes[vk]) || 'sum';
					const row = { ...dims, Khoản: titleByField(field) };
					periods.forEach(pk => {
						const cell = agg[pk];
						if (!cell) {
							row[pk] = null;
							return;
						}
						if (calcType === 'count') row[pk] = cell.count; else if (calcType === 'avg') row[pk] = cell.count ? (cell.sum / cell.count) : 0; else row[pk] = cell.sum;
					});
					pivotRows.push(row);
				}
			}

			// Apply column visibility (hide retained cols that are turned off)
			const hiddenPivot = (dashboardItemSettings?.templateColumnVisibility?.[record.id]) || {};
			const pivotColumnDefs = [
				...retainedCols
					.filter(c => hiddenPivot[c.dataIndex] !== false)
					.map(c => ({ headerName: c.title || c.dataIndex, field: c.dataIndex, minWidth: 120 })),
				{ headerName: 'Khoản', field: 'Khoản', width: 120 },
				...periods.map(p => ({ headerName: p, field: p, width: 120, sortable: true, filter: true })),
			];
			console.log(pivotColumnDefs)
			pivotContent = (
				<div className="ag-theme-quartz" style={{ width: '100%', height: '500px', padding: '8x 24px	' }}>
					<AgGridReact
						columnDefs={pivotColumnDefs.filter(item => item.headerName !== 'ERROR')}
						rowData={pivotRows}
						defaultColDef={{ resizable: true }}
						pagination
						paginationPageSize={1000}
						suppressPaginationPanel={false}
						enableRangeSelection={true}
						rowSelection="multiple"
						statusBar={statusBar}
					/>
				</div>
			);
		}
		return (
			<div>
				{/* Column visibility selector */}
				{Array.isArray(transformedColumns) && transformedColumns.length > 0 && (() => {
					// Allow toggles only for non-variable and non-period columns
					let selectorVariables = {};
					try {
						const calcObjSel = typeof record.calc === 'string' ? JSON.parse(record.calc) : (record.calc || {});
						selectorVariables = calcObjSel.variables || {};
					} catch {
					}
					const periodKeyField = fieldKey ? fieldKey : '_periodKey';
					const variableFieldIds = Object.keys(selectorVariables).map(vk => selectorVariables[vk]?.field).filter(Boolean);
					const toggleCols = transformedColumns.filter(c => c.dataIndex !== periodKeyField && !variableFieldIds.includes(c.dataIndex));
					if (toggleCols.length === 0) return null;
					return (
						<div style={{ marginBottom: 8 }}>
							<Text strong>Hiển thị cột:</Text>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
								{toggleCols.map((col) => {
									const key = col.dataIndex;
									if (!key) return null;
									const hiddenCols = (dashboardItemSettings?.templateColumnVisibility?.[record.id]) || {};
									const checked = hiddenCols[key] !== false; // default true
									return (
										<label key={key} style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: 6,
											fontSize: 12,
										}}>
											<input
												type="checkbox"
												checked={checked}
												onChange={async (e) => {
													const next = {
														...dashboardItemSettings,
														templateColumnVisibility: {
															...(dashboardItemSettings.templateColumnVisibility || {}),
															[record.id]: {
																...((dashboardItemSettings.templateColumnVisibility || {})[record.id] || {}),
																[key]: e.target.checked,
															},
														},
													};
													if (onSaveDashboardItemSettings) {
														await onSaveDashboardItemSettings(next);
													}
												}}
											/>
											<span>{col.title || col.dataIndex}</span>
										</label>
									);
								})}
							</div>
						</div>
					);
				})()}
				{/*<div className="ag-theme-quartz" style={{ width: '100%', height: '500px', padding: '8x 24px	' }}>*/}
				{/*	<AgGridReact*/}
				{/*		columnDefs={columnDefs.filter(c => (dashboardItemSettings?.templateColumnVisibility?.[record.id]?.[c.field]) !== false)}*/}
				{/*		rowData={transformedRows}*/}
				{/*		defaultColDef={{ resizable: true }}*/}
				{/*		pagination*/}
				{/*		paginationPageSize={1000}*/}
				{/*		suppressPaginationPanel={false}*/}
				{/*		enableRangeSelection={true}*/}
				{/*		rowSelection="multiple"*/}
				{/*		statusBar={statusBar}*/}
				{/*	/>*/}
				{/*</div>*/}
				{pivotContent}
			</div>
		);
	};

	return (
		<Modal
			open={open}
			title={<Space direction="vertical" size={0}>
				<Text level={4} type="secondary">Cấu hình của Chỉ số
					#{kpi2CalculatorId}{kpi2Data?.name ? ` - ${kpi2Data.name}` : ''}</Text>
			</Space>}
			width={'95vw'}
			bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
			footer={null}
			onCancel={async () => {
				// Update back computed tableData for component KPIs if available
				try {
					for (const k of componentKpis) {
						const rows = computedTableMapRef.current[k.id];
						if (Array.isArray(rows) && rows.length > 0) {
							await updateKpiCalculator({
								id: k.id,
								tableVersion: (k.name || 'KPI') + ' - ' + new Date().toLocaleString(),
								tableData: rows,
							});
						}
					}
				} catch (e) {
					// swallow errors to ensure modal can close
				} finally {
					onClose && onClose();
				}
			}}
			maskClosable
			confirmLoading={loading}
		>
			<Space direction="vertical" style={{ width: '100%' }} size={12}>
				<Space size={8} wrap>
					<Tag color="geekblue">Chu kỳ hiển thị: {kpi2Data?.period || 'month'}</Tag>
					{typeof kpi2Data?.calc === 'string' || kpi2Data?.calc ? (
						<Tag color="green">Có công thức</Tag>
					) : (
						<Tag>Không có công thức</Tag>
					)}
				</Space>
				{componentKpis.length === 0 ? (
					<Empty description="Không có KPI Calculator thành phần" />
				) : (
					<Table
						dataSource={componentKpis}
						columns={columns}
						rowKey={(r) => r.id}
						pagination={false}
						loading={loading}
						scroll={{ x: 'max-content' }}
						expandable={{
							expandedRowRender: (record) => (
								<div>
									<div style={{ display: 'none' }}>
										{renderPreviewTable(record)}
									</div>
									<div style={{ marginTop: 8 }}>
										{renderTemplateTable(record)}
									</div>
								</div>
							),
							onExpand: (expanded, record) => {
								if (expanded) {
									loadTemplateForKpi(record);
								}
							},
						}}
					/>
				)}
			</Space>
		</Modal>
	);
}

export default Kpi2CalcInfoModal;



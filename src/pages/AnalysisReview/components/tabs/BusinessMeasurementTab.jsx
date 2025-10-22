import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
import {
	Button,
	Card,
	Checkbox,
	Col,
	ColorPicker,
	DatePicker,
	Dropdown,
	Flex,
	Input,
	message,
	Modal,
	Row,
	Select,
	Space,
	Tooltip,
	Typography,
} from 'antd';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Image, ListRestart, Trash } from 'lucide-react';
import {
	AppstoreOutlined,
	ArrowDownOutlined,
	ArrowUpOutlined,
	BarChartOutlined,
	CheckOutlined,
	ExportOutlined,
	EyeInvisibleOutlined,
	EyeOutlined,
	FieldTimeOutlined,
	InfoCircleOutlined,
	PieChartOutlined,
	PlusOutlined,
	SafetyOutlined,
	SearchOutlined,
	SettingOutlined,
	TableOutlined,
	TagsOutlined,
	TrophyOutlined,
} from '@ant-design/icons';
import {
	createDashBoardItem,
	deleteDashBoardItem,
	getAllDashBoardItems,
	getDashBoardItemById,
	updateDashBoardItem,
} from '../../../../apis/dashBoardItemService.jsx';
import { aiGen2 } from '../../../../apis/botService.jsx';
import { uploadFileService } from '../../../../apis/uploadFileService.jsx';
import { updateUsedTokenApp } from '../../../../utils/tokenUtils.js';
import { getAllKpi2Calculator, getKpi2CalculatorById } from '../../../../apis/kpi2CalculatorService.jsx';
import { AgCharts } from 'ag-charts-react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
	createSectionData,
	createSeries,
	createSeriesPie,
	formatNumberWithK,
	createNormalisedBar,
} from '../../../Canvas/Daas/Logic/SetupChart.js';

import { getAllKpiCalculator, getKpiCalculatorById } from '../../../../apis/kpiCalculatorService.jsx';
import { getAllTemplateTables, getTableByid, getTemplateRow } from '../../../../apis/templateSettingService.jsx';
import {
	getTemplateRowWithCache,
	preloadApprovedVersionsCache,
	TEMPLATE_ROW_CACHE_TTL,
	getAllTemplateRowsWithProgress,
} from '../../../../utils/templateRowUtils.js';
import { getAllFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
import { loadAndMergeData } from '../../../Canvas/Daas/Content/Template/SettingCombine/logicCombine.js';
import { formatCurrency } from '../../../../generalFunction/format.js';
import { evaluate } from 'mathjs';
import { MyContext } from '../../../../MyContext.jsx';
import { getAllUserClass, getUserClassByEmail } from '../../../../apis/userClassService.jsx';
import { createSetting, getSettingByType, updateSetting } from '../../../../apis/settingService.jsx';
import { DEFAULT_PROMPT_DASHBOARD, SETTING_TYPE } from '../../../../CONST.js';
import { getTypeSchema } from '../../../../apis/settingService.jsx';
import { MODEL_AI_LIST, MODEL_AI_LIST_DB } from '../../../../AI_CONST.js';
import styles from './BusinessMeasurementTab.module.css';
import MetricDetailsModal from '../modals/MetricDetailsModal.jsx';
import AuthorizationModal from '../modals/AuthorizationModal.jsx';
import ComparisonModal from '../modals/ComparisonModal.jsx';
import TagSettingsModal from '../modals/TagSettingsModal.jsx';
import EditDashboardItemModal from '../modals/EditDashboardItemModal.jsx';
import AnalysisDetailModal from '../modals/AnalysisDetailModal.jsx';
import Loading3DTower from '../../../../components/Loading3DTower.jsx';
import DefaultDashboardCardByItem from '../DefaultDashboardCardByItem.jsx';
import Kpi2CalcInfoModal from '../modals/Kpi2CalcInfoModal.jsx';
import PinInput from '../../../../components/PinInput.jsx';

// Markdown -> safe HTML renderer (for export and in-page usage)
const renderMarkdown = (content) => {
	if (!content) return '';
	try {
		const htmlContent = marked(content);
		return DOMPurify.sanitize(htmlContent);
	} catch (e) {
		console.error('Markdown render error', e);
		return content;
	}
};

const { Title, Text } = Typography;
const { Option } = Select;

function BusinessMeasurementTab() {
	// Export loading state
	const [isExporting, setIsExporting] = useState(false);

	const handleExportHtml = async () => {
		setIsExporting(true);
		try {
			// Assemble data per item
			const rows = [];
			for (const item of filteredMetrics.filter(i => i.id < 100000)) {
				const container = document.querySelector(`[data-export-card-id="card-${item.id}"]`);
				let chartImageDataUrl = null;
				if (container) {
					try {
						chartImageDataUrl = await toPng(container, { cacheBust: true, pixelRatio: 2 });
					} catch (e) {
						console.warn('Chart capture failed for item', item.id, e);
					}
				}

				// statistics fallback markup
				let statisticsHtml = '';
				if (item.type === 'statistics') {
					const kpiCalculatorIds = item.settings?.kpiCalculators || [];
					const selectedKpiCalculators = kpiCalculatorIds.map(id => kpiCalculators.find(k => k.id === id)).filter(Boolean);
					if (selectedKpiCalculators.length > 0) {
						statisticsHtml = '<div class="stats-list">' + selectedKpiCalculators.map(kpi => {
							const latest = (kpi.tableData && kpi.tableData.length > 0) ? kpi.tableData[kpi.tableData.length - 1] : null;
							const prev = (kpi.tableData && kpi.tableData.length > 1) ? kpi.tableData[kpi.tableData.length - 2] : null;
							let changeStr = '--';
							if (latest && prev && prev.value !== 0) {
								const change = ((latest.value - prev.value) / prev.value) * 100;
								changeStr = (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
							}
							const latestStr = latest ? Number(latest.value).toLocaleString('vn-VN') : '--';
							return '<div class="stats-item">'
								+ '<div class="stats-left">'
								+ '<div class="stats-name">' + String(kpi.name || '').replace(/</g, '&lt;') + '</div>'
								+ '<div class="stats-value">' + latestStr + '</div>'
								+ '</div>'
								+ '<div class="stats-right">' + changeStr + '</div>'
								+ '</div>';
						}).join('') + '</div>';
					}
				}

				// tabular data for popup/modal (for chart-like items)
				let dataTableHtml = '';
				let hasDataTable = false;
				const chartDataRows = tableData?.[item.id];
				if (Array.isArray(chartDataRows) && chartDataRows.length > 0 && item.type !== 'statistics') {
					hasDataTable = true;
					const hiddenColumns = new Set(['color', 'differences', 'percentages']);
					const columnKeys = Object.keys(chartDataRows[0]).filter(k => !hiddenColumns.has(String(k).toLowerCase()));
					const headerHtml = '<tr>' + columnKeys.map(k => `<th>${String(k).replace(/</g, '&lt;')}</th>`).join('') + '</tr>';
					const bodyHtml = chartDataRows.map(row => {
						return '<tr>' + columnKeys.map(k => {
							const v = row[k];
							let cell;
							if (typeof v === 'number') {
								const num = Number.isFinite(v) ? v : 0;
								cell = num.toLocaleString('vn-VN', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								});
							} else {
								cell = String(v ?? '').replace(/</g, '&lt;');
							}
							return `<td>${cell}</td>`;
						}).join('') + '</tr>';
					}).join('');
					dataTableHtml = `<table class=\"data-table\"><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table>`;
				}

				rows.push({
					id: item.id,
					name: item.name,
					description: item.description || '',
					analysisHtml: renderMarkdown(item.analysis?.answer || ''),
					chartImageDataUrl,
					statisticsHtml,
					dataTableHtml,
					hasDataTable,
				});
			}

			// Build HTML
			const style = `
				body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;background:#fff;color:#111;margin:16px 0;padding:0 100px}
				.card{display:flex;gap:16px;align-items:flex-start;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0;background:#fff}
				.card-left{flex:2}
				.card-right{flex:3}
				.card-title{margin:0 0 8px 0;font-size:16px;color:#111}
				.card-desc{margin:0 0 8px 0;color:#6b7280;font-size:13px}
				.card-img{width:100%;height:auto;border:1px solid #f3f4f6;border-radius:6px;background:#fafafa}
				.analysisContent{color:#374151;line-height:1.5}
				.analysisContent h1,.analysisContent h2,.analysisContent h3,.analysisContent h4,.analysisContent h5,.analysisContent h6{color:#262626;margin:24px 0 16px 0}
				.analysisContent p{margin:12px 0;text-align:justify}
				.analysisContent ul,.analysisContent ol{margin:8px 0;padding-left:24px}
				.analysisContent table{width:100%;border-collapse:collapse;margin:12px 0}
				.analysisContent table th,.analysisContent table td{border:1px solid #e5e7eb;padding:12px 16px;text-align:left}
				/* Collapsible analysis area */
				.analysis-wrapper{position:relative;max-height:60vh;overflow:hidden}
				.analysis-wrapper.expanded{max-height:none;overflow:visible}
				.analysis-fade{position:absolute;left:0;right:0;bottom:0;height:80px;background:linear-gradient(to bottom, rgba(255,255,255,0), #fff)}
				.analysis-toggle{display:inline-block;margin-top:8px;background:#6b7280;color:#fff;border:none;border-radius:4px;padding:6px 10px;font-size:12px;cursor:pointer}
				.analysis-toggle:hover{background:#4b5563}
				.data-table{width:100%;border-collapse:collapse;margin-top:12px}
				.data-table th,.data-table td{border:1px solid #e5e7eb;padding:8px 12px;text-align:left;font-size:12px}
				.data-table thead th{background:#fafafa}
				.stats-list{display:flex;flex-direction:column;gap:8px}
				.stats-item{display:flex;align-items:center;justify-content:space-between;border:1px solid #e8e8e8;border-radius:8px;padding:12px;background:#fff}
				.stats-left{display:flex;align-items:center;gap:12px}
				.stats-name{font-size:14px;color:#333;font-weight:500}
				.stats-value{font-size:22px;color:#111}
				.stats-right{font-size:14px;font-weight:600}
				.view-data-btn{background:#1890ff;color:#fff;border:none;border-radius:4px;padding:6px 12px;font-size:12px;cursor:pointer;margin-top:8px;transition:background 0.2s}
				.view-data-btn:hover{background:#40a9ff}
				.modal{display:none;position:fixed;z-index:1000;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.5)}
				.modal-content{background:#fff;margin:5% auto;padding:20px;border-radius:8px;width:90%;max-width:1200px;max-height:80vh;overflow-y:auto;position:relative}
				.close{color:#aaa;float:right;font-size:28px;font-weight:bold;cursor:pointer;position:absolute;top:10px;right:15px}
				.close:hover{color:#000}
				.modal-title{margin:0 0 16px 0;font-size:18px;color:#111}
				.expanded-data-table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
				.expanded-data-table th,.expanded-data-table td{border:1px solid #e5e7eb;padding:10px 12px;text-align:left}
				.expanded-data-table thead th{background:#f8f9fa;font-weight:600}
				.expanded-data-table tbody tr:nth-child(even){background:#f8f9fa}
				/* Section Analysis Styles */
				.section-analysis-container{margin-bottom:32px}
				.section-card{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0;background:#fff}
				.section-card h4{margin:0;color:#111;font-size:16px}
				.section-card .analysis-wrapper{position:relative;max-height:60vh;overflow:hidden}
				.section-card .analysis-wrapper.expanded{max-height:none;overflow:visible}
				.section-card .analysis-fade{position:absolute;left:0;right:0;bottom:0;height:80px;background:linear-gradient(to bottom, rgba(255,255,255,0), #fff)}
				.section-card .analysis-toggle{display:inline-block;margin-top:8px;background:#6b7280;color:#fff;border:none;border-radius:4px;padding:6px 10px;font-size:12px;cursor:pointer}
				.section-card .analysis-toggle:hover{background:#4b5563}
				.section-card .analysisContent{color:#374151;line-height:1.5}
				
				/* Responsive Design */
				@media (max-width: 768px) {
					body{padding:0 16px;margin:8px 0}
					.card{flex-direction:column;gap:12px;padding:12px}
					.card-left{flex:none}
					.card-right{flex:none}
					.card-title{font-size:14px}
					.card-desc{font-size:12px}
					.analysisContent h1,.analysisContent h2,.analysisContent h3,.analysisContent h4,.analysisContent h5,.analysisContent h6{margin:16px 0 12px 0;font-size:14px}
					.analysisContent p{font-size:13px;line-height:1.4}
					.analysisContent ul,.analysisContent ol{padding-left:16px}
					.analysisContent table{font-size:11px}
					.analysisContent table th,.analysisContent table td{padding:6px 8px}
					.stats-item{flex-direction:column;align-items:flex-start;gap:8px;padding:8px}
					.stats-left{width:100%}
					.stats-name{font-size:12px}
					.stats-value{font-size:18px}
					.stats-right{font-size:12px}
					.modal-content{margin:2% auto;padding:12px;width:95%;max-height:90vh}
					.close{font-size:20px;top:5px;right:10px}
					.modal-title{font-size:16px}
					.expanded-data-table{font-size:11px}
					.expanded-data-table th,.expanded-data-table td{padding:6px 8px}
					.section-card{padding:12px;margin:8px 0}
					.section-card h4{font-size:14px}
					.section-header{flex-direction:column;align-items:flex-start;gap:8px}
					.section-score{justify-content:flex-start}
					.analysis-toggle{padding:4px 8px;font-size:11px}
				}
				
				@media (max-width: 480px) {
					body{padding:0 8px;margin:4px 0}
					.card{padding:8px;margin:8px 0}
					.card-title{font-size:13px}
					.card-desc{font-size:11px}
					.analysisContent h1,.analysisContent h2,.analysisContent h3,.analysisContent h4,.analysisContent h5,.analysisContent h6{font-size:13px;margin:12px 0 8px 0}
					.analysisContent p{font-size:12px}
					.analysisContent table{font-size:10px}
					.analysisContent table th,.analysisContent table td{padding:4px 6px}
					.stats-item{padding:6px}
					.stats-name{font-size:11px}
					.stats-value{font-size:16px}
					.stats-right{font-size:11px}
					.modal-content{padding:8px;width:98%}
					.close{font-size:18px}
					.modal-title{font-size:14px}
					.expanded-data-table{font-size:10px}
					.expanded-data-table th,.expanded-data-table td{padding:4px 6px}
					.section-card{padding:8px}
					.section-card h4{font-size:13px}
					.section-header{flex-direction:column;align-items:flex-start;gap:6px}
					.section-score{justify-content:flex-start;gap:4px}
					.section-score span{font-size:12px}
					.analysis-toggle{padding:3px 6px;font-size:10px}
				}
			`;

			// Get analysis data from DefaultDashboardCardByItem
			const defaultCardScores = defaultDashboardCardRef?.current?.scores || {};
			const sectionAnalysis = [
				{ key: 'financial', name: 'TÀI CHÍNH', color: '#52c41a' },
				{ key: 'business', name: 'KINH DOANH', color: '#1890ff' },
				{ key: 'operation', name: 'VẬN HÀNH', color: '#fa8c16' },
				{ key: 'hr', name: 'NHÂN SỰ', color: '#eb2f96' },
			];

			const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" />
				<title>Dashboard Export</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<style>${style}</style>
			</head><body>
				<h2 style="margin:0 0 12px 0">Dashboard Export</h2>
				
				<!-- Section Analysis -->
				<div class="section-analysis-container" style="margin-bottom: 32px;">
					<h3 style="margin:0 0 16px 0; color:#111; font-size:18px;">Phân tích theo thành phần</h3>
					${sectionAnalysis.map(section => {
						const sectionData = defaultCardScores[section.key] || {};
						const analysisText = sectionData.analysisText || sectionData.analysis || '';
						const displayText = analysisText ? renderMarkdown(analysisText) : '<div style="color:#9ca3af">Chưa có phân tích</div>';
						const score = sectionData.score || 0;
						const grade = score >= 75 ? 'A' : score >= 50 ? 'B' : score >= 25 ? 'C' : score > 0 ? 'D' : 'N/A';
						const gradeColor = score >= 75 ? '#58B16A' : score >= 50 ? '#1172df' : score >= 25 ? '#fa8c16' : score > 0 ? '#f5222d' : '#d8d8d8';
						
						return `
							<div class="section-card" style="border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin:12px 0; background:#fff;">
								<div class="section-header" style="display:flex; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
									<div style="display:flex; align-items:center; flex:1; min-width:200px;">
										<div style="width:4px; height:24px; background:${section.color}; margin-right:12px; border-radius:2px; flex-shrink:0;"></div>
										<h4 style="margin:0; color:#111; font-size:16px;">${section.name}</h4>
									</div>
									<div class="section-score" style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
										<span style="font-size:14px; color:#666;">Điểm:</span>
										<span style="font-size:18px; font-weight:600; color:${gradeColor};">${score.toFixed(1)}</span>
										<span style="font-size:14px; color:${gradeColor}; font-weight:600;">(${grade})</span>
									</div>
								</div>
								<div class="analysis-wrapper" id="section-analysis-${section.key}">
									<div class="analysisContent">${displayText}</div>
									<div class="analysis-fade"></div>
								</div>
								<button class="analysis-toggle" onclick="toggleAnalysis('section-analysis-${section.key}', event)">Xem thêm</button>
							</div>
						`;
					}).join('')}
				</div>
				
				<!-- Dashboard Items -->
				<h3 style="margin:32px 0 16px 0; color:#111; font-size:18px;">Chi tiết các chỉ số</h3>
			${rows.map(r => `
					<div class="card">
						<div class="card-left">
							<h3 class="card-title">${r.name ? String(r.name).replace(/</g, '&lt;') : ''}</h3>
							${r.description ? `<div class="card-desc">${String(r.description).replace(/</g, '&lt;')}</div>` : ''}
							${r.chartImageDataUrl ? `<img class="card-img" src="${r.chartImageDataUrl}" alt="chart-${r.id}" />` : (r.statisticsHtml || '<div style="height:200px;border:1px solid #e5e7eb;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9ca3af">No chart</div>')}
							${r.hasDataTable ? `<button class="view-data-btn" onclick="openDataModal('${r.id}')">📊 Xem bảng dữ liệu</button>` : ''}
						</div>
						<div class="card-right">
							<div class="analysis-wrapper" id="analysis-${r.id}">
								<div class="analysisContent">${r.analysisHtml || '<div style=\"color:#9ca3af\">No analysis</div>'}</div>
								<div class="analysis-fade"></div>
							</div>
							<button class="analysis-toggle" onclick="toggleAnalysis('${r.id}', event)">Xem thêm</button>
						</div>
					</div>
				`).join('')}
				
				<!-- Data Modals -->
				${rows.filter(r => r.hasDataTable).map(r => `
					<div id="modal-${r.id}" class="modal">
						<div class="modal-content">
							<span class="close" onclick="closeDataModal('${r.id}')">&times;</span>
							<h3 class="modal-title">Bảng dữ liệu - ${r.name ? String(r.name).replace(/</g, '&lt;') : ''}</h3>
							<div class="expanded-data-table">${r.dataTableHtml.replace('data-table', 'expanded-data-table')}</div>
						</div>
					</div>
				`).join('')}
				
				<script>
					function toggleAnalysis(id, event){
						const wrapper = document.getElementById(id);
						const btn = event && event.currentTarget ? event.currentTarget : null;
						const expanded = wrapper.classList.toggle('expanded');
						const fade = wrapper.querySelector('.analysis-fade');
						if (expanded) {
							if (btn) btn.textContent = 'Thu gọn';
							if (fade) fade.style.display = 'none';
						} else {
							if (btn) btn.textContent = 'Xem thêm';
							if (fade) fade.style.display = '';
						}
					}
					function openDataModal(id) {
						document.getElementById('modal-' + id).style.display = 'block';
					}
					
					function closeDataModal(id) {
						document.getElementById('modal-' + id).style.display = 'none';
					}
					
					// Close modal when clicking outside of it
					window.onclick = function(event) {
						const modals = document.querySelectorAll('.modal');
						modals.forEach(modal => {
							if (event.target === modal) {
								modal.style.display = 'none';
							}
						});
					}
					
					// Close modal with Escape key
					document.addEventListener('keydown', function(event) {
						if (event.key === 'Escape') {
							const modals = document.querySelectorAll('.modal');
							modals.forEach(modal => {
								modal.style.display = 'none';
							});
						}
					});
				</script>
			</body></html>`;

			const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
			saveAs(blob, `dashboard_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.html`);
			message.success('Đã xuất HTML');
		} catch (e) {
			console.error(e);
			message.error('Xuất HTML thất bại');
		} finally {
			setIsExporting(false);
		}
	};
	const { currentUser } = useContext(MyContext);
	const [isLoading, setIsLoading] = useState(false);
	const [forceDesktop, setForceDesktop] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTags, setSelectedTags] = useState(['All']);
	const [arrangeMode, setArrangeMode] = useState(false);
	const [gridMode, setGridMode] = useState(3);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [showNewCardModal, setShowNewCardModal] = useState(false);
	const [showDefaultDashboardCard, setShowDefaultDashboardCard] = useState(true);
	const [showComparisonModal, setShowComparisonModal] = useState(false);
	const [selectedMetricForDetails, setSelectedMetricForDetails] = useState(null);
	const [showKpi2InfoModal, setShowKpi2InfoModal] = useState(false);
	const [kpi2InfoId, setKpi2InfoId] = useState(null);
	const [kpi2InfoDashboardItemId, setKpi2InfoDashboardItemId] = useState(null);
	// Order modal state
	const [showOrderModal, setShowOrderModal] = useState(false);
	const [orderItems, setOrderItems] = useState([]); // [{id,name,order}]
	const [savingOrder, setSavingOrder] = useState(false);
	const [newCard, setNewCard] = useState({
		title: '',
		type: 'chart',
		tag: '',
		storeTag: '',
		idData: null,
		selectedKpiCalculators: [],
		prompt: '',
		answer: '',
		recentPeriods: 0, // Số lượng kỳ gần nhất (0 = tất cả)
		chartViewType: 'line', // Loại chart view (line, area, bar)
	});
	const [defaultPrompt, setDefaultPrompt] = useState('');
	const [newTableDisplayColumns, setNewTableDisplayColumns] = useState([]);
	const [newTableDateColumn, setNewTableDateColumn] = useState(null);
	const [newTableDateRange, setNewTableDateRange] = useState('all');
	const [newTableColumnSettings, setNewTableColumnSettings] = useState({});
	// Advanced table filters
	const [newTableFilters, setNewTableFilters] = useState([]); // [{columnId, operator, value}]
	const [newTableFilterLogic, setNewTableFilterLogic] = useState('AND');

	// Edit states for table advanced filters
	const [editTableFilters, setEditTableFilters] = useState([]);
	const [editTableFilterLogic, setEditTableFilterLogic] = useState('AND');
	const [newTemplateColumns, setNewTemplateColumns] = useState([]);
	const [dashboardItems, setDashboardItems] = useState([]);
	const [kpi2Calculators, setKpi2Calculators] = useState([]);
	const [kpiCalculators, setKpiCalculators] = useState([]);
	const [loading, setLoading] = useState(false);
	const [chartOptions, setChartOptions] = useState({});
	const [tableData, setTableData] = useState([]);
	const [rawApprovedVersionData, setRawApprovedVersionData] = useState({});
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deletingItemId, setDeletingItemId] = useState(null);

	// AI Analysis states
	const [analyzingItems, setAnalyzingItems] = useState(new Set());
	const [analysisDetailModal, setAnalysisDetailModal] = useState({
		visible: false, item: null, analysis: null,
	});
	const [selectedAIModel, setSelectedAIModel] = useState('gpt-5-mini-2025-08-07'); // Default AI model

	// Analyze All states
	const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
	const [analyzeAllProgress, setAnalyzeAllProgress] = useState({ current: 0, total: 0 });
	const [lastAnalyzeTime, setLastAnalyzeTime] = useState(null);

	// Auto-analyze interval states
	const [isAutoAnalyzeEnabled, setIsAutoAnalyzeEnabled] = useState(false);
	const [autoAnalyzeIntervalId, setAutoAnalyzeIntervalId] = useState(null);
	const [nextAutoAnalyzeTime, setNextAutoAnalyzeTime] = useState(null);

	// Ref for DefaultDashboardCard
	const defaultDashboardCardRef = useRef(null);

	// UserClass states
	const [allUserClasses, setAllUserClasses] = useState([]);
	const [currentUserClasses, setCurrentUserClasses] = useState([]);
	const [selectedUserClasses, setSelectedUserClasses] = useState(new Set());
	const [selectedDashboardItems, setSelectedDashboardItems] = useState(new Set());
	const [userClassSearchText, setUserClassSearchText] = useState('');
	const [userClassFilter, setUserClassFilter] = useState('all');
	const [selectedDashboardItem, setSelectedDashboardItem] = useState(null);

	// For TOP type
	const [approvedVersions, setApprovedVersions] = useState([]);
	const [selectedApprovedVersion, setSelectedApprovedVersion] = useState(null);
	const [templateColumns, setTemplateColumns] = useState([]);
	const [selectedColumns, setSelectedColumns] = useState({ column1: '', column2: '' });
	const [topN, setTopN] = useState(5);
	const [settingModalVisible, setSettingModalVisible] = useState(false);
	const [editingDashboardItem, setEditingDashboardItem] = useState(null);

	// For COMPARISON type
	const [selectedKpis, setSelectedKpis] = useState([]);

	// For TABLE type date filtering
	const [tableDateRanges, setTableDateRanges] = useState({});
	const [tableQuickDateRanges, setTableQuickDateRanges] = useState({});

	// For TABLE type timeThreshold
	const [newTableTimeThreshold, setNewTableTimeThreshold] = useState(null);
	const [editTableTimeThreshold, setEditTableTimeThreshold] = useState(null);

	// For TABLE type column filtering
	const [tableColumnFilters, setTableColumnFilters] = useState({});

	// For chart colors
	const [chartColors, setChartColors] = useState([]);
	const [selectedColors, setSelectedColors] = useState([
		{ id: 1, color: '#13C2C2' },
		{ id: 2, color: '#3196D1' },
		{ id: 3, color: '#6DB8EA' },
		{ id: 4, color: '#87D2EA' },
		{ id: 5, color: '#9BAED7' },
		{ id: 6, color: '#C695B7' },
		{ id: 7, color: '#EDCCA1' },
		{ id: 8, color: '#A4CA9C' },
	]);

	// For chart view types (line, area, bar)
	const [chartViewTypes, setChartViewTypes] = useState({});

	// For column sizes
	const [newTableColumnSizes, setNewTableColumnSizes] = useState({});
	const [editTableColumnSizes, setEditTableColumnSizes] = useState({});

	// For date column width
	const [newTableDateColumnWidth, setNewTableDateColumnWidth] = useState(120);
	const [editTableDateColumnWidth, setEditTableDateColumnWidth] = useState(120);

	// For column filter settings
	const [newTableFilterColumn, setNewTableFilterColumn] = useState(null);
	const [editTableFilterColumn, setEditTableFilterColumn] = useState(null);

	// For column sort settings
	const [newTableSortColumn, setNewTableSortColumn] = useState(null);
	const [newTableSortType, setNewTableSortType] = useState('desc');
	const [editTableSortColumn, setEditTableSortColumn] = useState(null);
	const [editTableSortType, setEditTableSortType] = useState('desc');

	// For date column size (like other columns)
	const [newTableDateColumnSize, setNewTableDateColumnSize] = useState(2);
	const [editTableDateColumnSize, setEditTableDateColumnSize] = useState(2);

	// For EDIT functionality
	const [editSelectedKpis, setEditSelectedKpis] = useState([]);
	const [editSelectedApprovedVersion, setEditSelectedApprovedVersion] = useState(null);
	const [editTemplateColumns, setEditTemplateColumns] = useState([]);
	const [editSelectedColumns, setEditSelectedColumns] = useState({ column1: '', column2: '' });
	const [editTopN, setEditTopN] = useState(5);
	const [editSelectedKpiCalculators, setEditSelectedKpiCalculators] = useState([]);
	const [editRecentPeriods, setEditRecentPeriods] = useState(0); // Số lượng kỳ gần nhất cho edit
	const [editChartViewType, setEditChartViewType] = useState('line'); // Loại chart view cho edit
	// For TABLE edit functionality
	const [editTableDisplayColumns, setEditTableDisplayColumns] = useState([]);
	const [editTableDateColumn, setEditTableDateColumn] = useState(null);
	const [editTableDateRange, setEditTableDateRange] = useState('all');
	const [editTableColumnSettings, setEditTableColumnSettings] = useState({});
	const [collapsedColumns, setCollapsedColumns] = useState({});
	const [newCollapsedColumns, setNewCollapsedColumns] = useState({});

	// For TABLE_CHART type (Biểu đồ từ bảng)
	const [templateTables, setTemplateTables] = useState([]);
	const [newTableChartTable, setNewTableChartTable] = useState(null);
	const [newTableChartTimeColumn, setNewTableChartTimeColumn] = useState(null);
	const [newTableChartGroupColumn, setNewTableChartGroupColumn] = useState(null);
	const [newTableChartValueColumn, setNewTableChartValueColumn] = useState(null);
	const [newTableChartType, setNewTableChartType] = useState('line');
	const [newTableChartColumns, setNewTableChartColumns] = useState([]);
	const [newTableChartDataGrouping, setNewTableChartDataGrouping] = useState('none'); // none, month, week

	// For TABLE_CHART_2 type (Biểu đồ từ bảng - loại 2)
	const [newTableChart2Table, setNewTableChart2Table] = useState(null);
	const [newTableChart2TimeColumn, setNewTableChart2TimeColumn] = useState(null);
	const [newTableChart2GroupColumn, setNewTableChart2GroupColumn] = useState(null);
	const [newTableChart2ValueColumn, setNewTableChart2ValueColumn] = useState(null);
	const [newTableChart2Type, setNewTableChart2Type] = useState('line');
	const [newTableChart2Columns, setNewTableChart2Columns] = useState([]);
	const [newTableChart2DataGrouping, setNewTableChart2DataGrouping] = useState('none'); // none, month, week
	const [newTableChart2DateRange, setNewTableChart2DateRange] = useState('all'); // all, today, thisWeek, thisMonth, etc.

	// For TABLE_CHART edit functionality
	const [editTableChartTable, setEditTableChartTable] = useState(null);
	const [editTableChartTimeColumn, setEditTableChartTimeColumn] = useState(null);
	const [editTableChartGroupColumn, setEditTableChartGroupColumn] = useState(null);
	const [editTableChartValueColumn, setEditTableChartValueColumn] = useState(null);
	const [editTableChartType, setEditTableChartType] = useState('line');
	const [editTableChartColumns, setEditTableChartColumns] = useState([]);
	const [editTableChartDataGrouping, setEditTableChartDataGrouping] = useState('none'); // none, month, week

	// For TABLE_CHART_2 edit functionality
	const [editTableChart2Table, setEditTableChart2Table] = useState(null);
	const [editTableChart2TimeColumn, setEditTableChart2TimeColumn] = useState(null);
	const [editTableChart2GroupColumn, setEditTableChart2GroupColumn] = useState(null);
	const [editTableChart2ValueColumn, setEditTableChart2ValueColumn] = useState(null);
	const [editTableChart2Type, setEditTableChart2Type] = useState('line');
	const [editTableChart2Columns, setEditTableChart2Columns] = useState([]);
	const [editTableChart2DataGrouping, setEditTableChart2DataGrouping] = useState('none'); // none, month, week
	const [editTableChart2DateRange, setEditTableChart2DateRange] = useState('all'); // all, today, thisWeek, thisMonth, etc.

	// Tags states
	const [businessTags, setBusinessTags] = useState([]);
	const [storeTags, setStoreTags] = useState([]);
	const [selectedBusinessTags, setSelectedBusinessTags] = useState(['All']);
	const [selectedStoreTags, setSelectedStoreTags] = useState(['All']);
	const [showTagSettingsModal, setShowTagSettingsModal] = useState(false);
	const [showPromptSettingsModal, setShowPromptSettingsModal] = useState(false);
	const [promptSettingValue, setPromptSettingValue] = useState('');
	const [promptSettingData, setPromptSettingData] = useState(null);
	const [showPinModal, setShowPinModal] = useState(false);
	const [pinInput, setPinInput] = useState('');
	const [pinError, setPinError] = useState('');
	const [savedPin, setSavedPin] = useState('');
	const [isPinVerified, setIsPinVerified] = useState(false);
	const [showSetupPinModal, setShowSetupPinModal] = useState(false);
	const [showChangePinModal, setShowChangePinModal] = useState(false);
	const [newPin, setNewPin] = useState('');
	const [confirmPin, setConfirmPin] = useState('');
	const [setupPinError, setSetupPinError] = useState('');

	// Countdown states
	const [currentTime, setCurrentTime] = useState(new Date());
	const [countdownItems, setCountdownItems] = useState([]);

	// Days remaining helpers (recompute when currentTime changes)
	const { daysInMonth, daysInYear, monthDisplay, yearDisplay } = useMemo(() => {
		const now = currentTime instanceof Date ? currentTime : new Date();
		const year = now.getFullYear();
		const monthIndex = now.getMonth(); // 0-11
		const daysInCurrentMonth = new Date(year, monthIndex + 1, 0).getDate();
		const currentDay = now.getDate();
		const daysRemainingInMonth = Math.max(0, daysInCurrentMonth - currentDay);

		const endOfYear = new Date(year, 11, 31);
		const msPerDay = 1000 * 60 * 60 * 24;
		const daysRemainingInYear = Math.max(0, Math.ceil((endOfYear - now) / msPerDay));

		const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
			'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

		return {
			daysInMonth: daysRemainingInMonth,
			daysInYear: daysRemainingInYear,
			monthDisplay: monthNames[monthIndex],
			yearDisplay: year,
		};
	}, [currentTime]);

	// Compute remaining value by unit
	const computeRemaining = (targetISO, unit) => {
		if (!targetISO) return 0;
		const now = currentTime instanceof Date ? currentTime : new Date();
		const target = new Date(targetISO);
		const diff = target - now;

		if (diff <= 0) return 0;

		switch (unit) {
			case 'days':
				return Math.ceil(diff / (1000 * 60 * 60 * 24));
			case 'hours':
				return Math.ceil(diff / (1000 * 60 * 60));
			case 'minutes':
				return Math.ceil(diff / (1000 * 60));
			default:
				return Math.ceil(diff / (1000 * 60 * 60 * 24));
		}
	};
	// Analyze All configuration modal state
	const [showAnalyzeAllModal, setShowAnalyzeAllModal] = useState(false);
	const [analyzeAllPrompt, setAnalyzeAllPrompt] = useState('');
	const [analyzeAllModel, setAnalyzeAllModel] = useState('');

	const [showAllBusinessTags, setShowAllBusinessTags] = useState(false);
	const [showAllStoreTags, setShowAllStoreTags] = useState(false);
	const [expandedAnswers, setExpandedAnswers] = useState(new Set());
	const [showAnalysis, setShowAnalysis] = useState(true); // State để bật/tắt hiển thị phân tích
	const [pendingModal, setPendingModal] = useState(null);
	const [backgroundColors, setBackgroundColors] = useState({
		color: '#e2e2e2', bg_color: '#d4d4d4',
	});

	// State cho modal background colors
	const [showBackgroundModal, setShowBackgroundModal] = useState(false);
	const [dashboardColors, setDashboardColors] = useState({
		background: {
			gradient: ['#b7b7b7', '#979797', '#6c6c6c'],
			gridColor: '#ff6b6b',
			gridOpacity: 0.15,
		},
		headerTitle: {
			bgColor: '#1677ff',
			textColor: '#ffffff',
			imageUrl: '',
			useImage: false,
		},
	});

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(5000);
	const [totalRows, setTotalRows] = useState(0);

	const handlePageChange = (page, size) => {
		setCurrentPage(page);
		if (size !== pageSize) {
			setPageSize(size);
		}
	};

	// Load dashboard background colors
	useEffect(() => {
		setIsLoading(true);
		const loadDashboardColorSettings = async () => {
			try {

				const existing = await getSettingByType('ANALYSIS_REVIEW_BACKGROUND_COLORS');

				if (existing && existing.setting && typeof existing.setting === 'object') {
					const { background, headerTitle } = existing.setting;
					const safeBackground = (background &&
						Array.isArray(background.gradient) &&
						background.gradient.length > 0 &&
						background.gridColor !== undefined &&
						background.gridOpacity !== undefined)
						? background
						: { gradient: ['#b7b7b7', '#979797', '#6c6c6c'], gridColor: '#ff6b6b', gridOpacity: 0.15 };
					const safeHeaderTitle = (headerTitle && (headerTitle.bgColor || headerTitle.imageUrl) && headerTitle.textColor)
						? {
							bgColor: headerTitle.bgColor || '#1677ff',
							textColor: headerTitle.textColor || '#ffffff',
							imageUrl: headerTitle.imageUrl || '',
							useImage: !!headerTitle.useImage,
						}
						: { bgColor: '#1677ff', textColor: '#ffffff', imageUrl: '', useImage: false };
					setDashboardColors({ background: safeBackground, headerTitle: safeHeaderTitle });
				} else {
					// Ensure default values are set
					setDashboardColors({
						background: {
							gradient: ['#b7b7b7', '#979797', '#6c6c6c'],
							gridColor: '#ff6b6b',
							gridOpacity: 0.15,
						},
						headerTitle: { bgColor: '#1677ff', textColor: '#ffffff', imageUrl: '', useImage: false },
					});
				}
			} catch (error) {
				console.error('Error loading initial dashboard color settings:', error);
				// Ensure default values are set on error
				setDashboardColors({
					background: {
						gradient: ['#b7b7b7', '#979797', '#6c6c6c'],
						gridColor: '#ff6b6b',
						gridOpacity: 0.15,
					},
					headerTitle: { bgColor: '#1677ff', textColor: '#ffffff', imageUrl: '', useImage: false },
				});
			} finally {
				setTimeout(() => {
					setIsLoading(false);
				}, 1500);
			}
		};

		loadDashboardColorSettings();
	}, []);

	useEffect(() => {
		const loadDefaultPrompt = async () => {
			try {
				let settingData = await getSettingByType(SETTING_TYPE.PROMPT_DASHBOARD);
				let data = DEFAULT_PROMPT_DASHBOARD;
				if (!settingData || !settingData.setting || settingData.setting === null || settingData.setting === undefined) {
					// Fallback lấy từ schema master trước khi tạo mới
					try {
						const master = await getTypeSchema('master', SETTING_TYPE.PROMPT_DASHBOARD);
						if (master && master.setting) {
							data = master.setting;
						}
					} catch (_) {
					}

					// Nếu record đã tồn tại nhưng setting = null, CẬP NHẬT thay vì tạo mới
					if (settingData && settingData.id) {
						settingData = await updateSetting({
							id: settingData.id,
							type: SETTING_TYPE.PROMPT_DASHBOARD,
							setting: data,
						});
					} else {
						// Nếu chưa có record, tạo mới
						settingData = await createSetting({
							type: SETTING_TYPE.PROMPT_DASHBOARD, setting: data,
						});
					}
				} else {
					data = settingData.setting;
				}
				setDefaultPrompt(data);
				setPromptSettingData(settingData); // Lưu trữ toàn bộ setting data để có id
			} catch (error) {
				console.error('Error loading default prompt setting:', error);
				// Fallback: cố lấy master, nếu fail nữa thì dùng default hằng số
				try {
					const master = await getTypeSchema('master', SETTING_TYPE.PROMPT_DASHBOARD);
					if (master && master.setting && master.setting !== null && master.setting !== undefined) {
						setDefaultPrompt(master.setting);
						// Tạo setting data mới nếu không có
						if (!master.id) {
							const newSettingData = await createSetting({
								type: SETTING_TYPE.PROMPT_DASHBOARD,
								setting: master.setting,
							});
							setPromptSettingData(newSettingData);
						} else {
							setPromptSettingData(master);
						}
						return;
					}
				} catch (_) {
				}
				// Tạo setting mới với default prompt
				try {
					const newSettingData = await createSetting({
						type: SETTING_TYPE.PROMPT_DASHBOARD,
						setting: DEFAULT_PROMPT_DASHBOARD,
					});
					setDefaultPrompt(DEFAULT_PROMPT_DASHBOARD);
					setPromptSettingData(newSettingData);
				} catch (createError) {
					console.error('Error creating default prompt setting:', createError);
					setDefaultPrompt(DEFAULT_PROMPT_DASHBOARD);
					// Set một object tạm để tránh lỗi khi lưu
					setPromptSettingData({
						id: null,
						type: SETTING_TYPE.PROMPT_DASHBOARD,
						setting: DEFAULT_PROMPT_DASHBOARD,
					});
				}
			}
		};

		loadDefaultPrompt();
	}, []);

	// Load Context Instruction từ settings
	const loadContextInstruction = async () => {
		try {
			const contextSetting = await getSettingByType('CONTEXT_INSTRUCTION_SETTING');
			if (contextSetting && contextSetting.setting) {
				return contextSetting.setting.instruction || '';
			}
			return '';
		} catch (error) {
			console.error('Lỗi khi tải context instruction:', error);
			return '';
		}
	};

	// Load PIN từ settings
	useEffect(() => {
		const loadPin = async () => {
			try {
				const pinSetting = await getSettingByType('ANALYSIS_PIN_CODE');
				if (pinSetting) {
					setSavedPin(pinSetting.setting?.pin);
				}
			} catch (error) {
				console.error('Error loading PIN:', error);
			}
		};
		loadPin();
	}, []);

	// Update current time every minute
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 60000); // Update every minute

		return () => clearInterval(timer);
	}, []);

	// Load countdown items from settings
	useEffect(() => {
		const loadCountdownItems = async () => {
			try {
				const countdownSetting = await getSettingByType('DASHBOARD_COUNTDOWN_ITEMS');
				if (countdownSetting) {
					setCountdownItems(countdownSetting.setting || '[]');
				}

			} catch (error) {
				console.error('Error loading countdown items:', error);
			}
		};
		loadCountdownItems();
	}, []);

	const loadLastAnalyzeTime = async () => {
		try {
			// Tìm default dashboard item (id = 100000)
			const defaultItem = dashboardItems.find(item => item.id === 100000);
			if (defaultItem && defaultItem.createAt) {
				setLastAnalyzeTime(defaultItem.createAt);
			} else {
				setLastAnalyzeTime(null);
			}
		} catch (error) {
			console.error('Error loading last analyze time:', error);
		}
	};

	// Load data on component mount
	useEffect(() => {
		loadDashboardItems();
		loadKpi2Calculators();
		loadKpiCalculators();
		loadApprovedVersions();
		loadUserClasses();
		loadCurrentUserClasses();
		loadTags();
		loadTemplateTables();
		loadChartColors();
	}, []);

	// Load last analyze time when dashboard items are loaded
	useEffect(() => {
		if (dashboardItems.length > 0) {
			loadLastAnalyzeTime();
		}
	}, [dashboardItems]);

	// Auto-load chart data when dashboard items are loaded (only on initial load)
	useEffect(() => {
		if (dashboardItems.length > 0) {
			dashboardItems.forEach(item => {
				if (item.type === 'chart' && item.idData && !chartOptions[item.id]) {
					// Load chart data after a short delay to avoid overwhelming the API, but only if chartColors are loaded
					setTimeout(() => {
						if (chartColors.length > 0) {
							loadChartData(item);
						}
					}, 100);
				} else if (item.type === 'table_chart' && item.idData && !tableData[item.id]) {
					// Load table chart data after a short delay
					setTimeout(() => {
						loadTableChartData(item);
					}, 100);
				} else if (item.type === 'table_chart_2' && item.idData && !tableData[item.id]) {
					// Load table chart 2 data after a short delay
					setTimeout(() => {
						loadTableChart2Data(item);
					}, 100);
				} else if (item.type === 'top' && item.idData && !tableData[item.id]) {
					// Load top data after a short delay
					setTimeout(() => {
						loadTopData(item);
					}, 100);
				} else if (item.type === 'comparison' && item.settings?.kpis && item.settings.kpis.length >= 2 && !tableData[item.id]) {
					// Load comparison data after a short delay, but only if chartColors are loaded
					setTimeout(() => {
						if (chartColors.length > 0) {
							loadComparisonData(item);
						}
					}, 100);
				} else if (item.type === 'statistics' && item.settings?.kpiCalculators && item.settings.kpiCalculators.length > 0 && !tableData[item.id]) {
					// Load statistics data after a short delay, but only if kpiCalculators are loaded
					setTimeout(() => {
						if (kpiCalculators.length > 0) {
							loadStatisticsData(item);
						}
					}, 100);
				} else if (item.type === 'table' && item.idData && !tableData[item.id]) {
					// Load table data after a short delay
					setTimeout(() => {
						loadTableData(item);
					}, 100);
				}
			});
		}
	}, [dashboardItems.length]); // Chỉ trigger khi số lượng items thay đổi, không phải khi items thay đổi

	// Reload table_chart_2 data when date range changes
	useEffect(() => {
		dashboardItems.forEach(item => {
			if (item.type === 'table_chart_2' && item.idData) {
				// Reload chart data when date range changes
				loadTableChart2Data(item);
			}
		});
	}, [tableDateRanges, tableQuickDateRanges]);

	// Reload chart data when chartColors change
	useEffect(() => {
		if (chartColors.length > 0) {
			dashboardItems.forEach(item => {
				if (item.type === 'chart' && item.idData) {
					// Reload chart data when colors change
					loadChartData(item);
				} else if (item.type === 'table_chart_2' && item.idData) {
					// Reload chart data when colors change
					loadTableChart2Data(item);
				} else if (item.type === 'table_chart' && item.idDat) {
					// Reload chart data when colors change
					loadTableChartData(item);
				} else if (item.type === 'comparison' && item.settings?.kpis && item.settings.kpis.length >= 2) {
					// Reload comparison data when colors change
					loadComparisonData(item);
				}
			});
		}
	}, [chartColors]);

	// Reload statistics data when kpiCalculators change (only for items that need it)
	useEffect(() => {
		if (kpiCalculators.length > 0 && dashboardItems.length > 0) {
			dashboardItems.forEach(item => {
				if (item.type === 'statistics' && item.settings?.kpiCalculators && item.settings.kpiCalculators.length > 0) {
					// Only reload if data is not already loaded
					if (!tableData[item.id]) {
						loadStatisticsData(item);
					}
				}
			});
		}
	}, [kpiCalculators.length]); // Chỉ trigger khi số lượng kpiCalculators thay đổi

	// Reload chart data when chartViewTypes change
	useEffect(() => {
		if (Object.keys(chartViewTypes).length > 0) {
			dashboardItems.forEach(item => {
				if (item.type === 'chart' && item.idData && chartViewTypes[item.id]) {
					// Reload chart data when view type changes
					loadChartData(item);
				}
			});
		}
	}, [chartViewTypes]); // Trigger khi chartViewTypes object thay đổi

	// Load data when chartColors and kpiCalculators are first loaded
	useEffect(() => {
		if (chartColors.length > 0 && kpiCalculators.length > 0 && dashboardItems.length > 0) {
			dashboardItems.forEach(item => {
				if (item.type === 'chart' && item.idData && !chartOptions[item.id]) {
					loadChartData(item);
				} else if (item.type === 'table_chart_2' && item.idData && !tableData[item.id]) {
					loadTableChart2Data(item);
				} else if (item.type === 'comparison' && item.settings?.kpis && item.settings.kpis.length >= 2 && !tableData[item.id]) {
					loadComparisonData(item);
				} else if (item.type === 'statistics' && item.settings?.kpiCalculators && item.settings.kpiCalculators.length > 0 && !tableData[item.id]) {
					loadStatisticsData(item);
				}
			});
		}
	}, [chartColors.length, kpiCalculators.length]); // Chỉ trigger khi chartColors và kpiCalculators được load lần đầu

	// Cleanup interval when component unmounts
	useEffect(() => {
		return () => {
			if (autoAnalyzeIntervalId) {
				clearInterval(autoAnalyzeIntervalId);
			}
		};
	}, [autoAnalyzeIntervalId]);

	const loadDashboardItems = async () => {
		try {
			const items = await getAllDashBoardItems();
			console.log(items)
			if (items && items.length > 0) {
				// Đảm bảo mỗi item có tag và category, sử dụng tag hoặc category hoặc mặc định
				const processedItems = items.map(item => ({
					...item,
					tag: item.tag || item.category || '',
					category: item.category || item.tag || '',
				}));

				// Log table items specifically
				const tableItems = processedItems.filter(item => item.type !== 'table2');
				setDashboardItems(tableItems);
			} else {
			}
		} catch (error) {
			console.error('Error loading dashboard items:', error);
			message.error('Lỗi khi tải danh sách dashboard items');
		}
	};

	const loadKpi2Calculators = async () => {
		try {
			const kpis = await getAllKpi2Calculator();
			if (kpis && kpis.length > 0) {
				setKpi2Calculators(kpis);
			}
		} catch (error) {
			console.error('Error loading KPI2 calculators:', error);
			message.error('Lỗi khi tải danh sách KPI calculators');
		}
	};

	const loadKpiCalculators = async () => {
		try {
			const kpis = await getAllKpiCalculator();
			if (kpis && kpis.length > 0) {
				setKpiCalculators(kpis);
			}
		} catch (error) {
			console.error('Error loading KPI calculators:', error);
			message.error('Lỗi khi tải danh sách KPI calculators');
		}
	};
	const loadStatisticsData = async (dashboardItem) => {
		try {
			if (!dashboardItem.settings?.kpiCalculators || dashboardItem.settings.kpiCalculators.length === 0) {
				return;
			}

			const kpiCalculatorIds = dashboardItem.settings.kpiCalculators;
			const selectedKpiCalculators = kpiCalculatorIds.map(id => kpiCalculators.find(k => k.id === id)).filter(Boolean);

			// Load data for each KPI Calculator using getKpiCalculatorById
			for (const kpi of selectedKpiCalculators) {
				try {
					// Check if we already have tableData for this KPI to avoid unnecessary API calls
					if (kpi.tableData && kpi.tableData.length > 0) {
						continue; // Skip if data is already loaded
					}

					// Use getKpiCalculatorById to get complete data including tableData
					const updatedKpi = await getKpiCalculatorById(kpi.id);
					if (updatedKpi && updatedKpi.tableData) {
						// Update the kpiCalculators state with the loaded data
						setKpiCalculators(prev => prev.map(k => k.id === kpi.id ? {
							...k,
							tableData: updatedKpi.tableData,
						} : k));
					}
				} catch (error) {
					console.error(`Error loading data for KPI Calculator ${kpi.id}:`, error);
				}
			}
		} catch (error) {
			console.error('Error loading statistics data:', error);
		}
	};

	// Đảm bảo loadApprovedVersions trả về Promise
	const loadApprovedVersions = async () => {
		try {
			const approvedVersions = await getAllApprovedVersion();
			// Lọc approveVersion có apps bao gồm 'analysis-review'
			const filteredApprovedVersions = approvedVersions.filter(version => version.apps && version.apps.includes('analysis-review'));

			setApprovedVersions(filteredApprovedVersions);

			// Preload cache theo trang (20.000/ lần) và gộp
			try {
				const { preloadApprovedVersionsCombined } = await import('../../../../utils/templateRowUtils.js');
				await preloadApprovedVersionsCombined(filteredApprovedVersions, 20000);
				console.log('TemplateRow combined cache preloaded successfully for', filteredApprovedVersions.length, 'versions');
			} catch (preloadError) {
				console.warn('TemplateRow combined cache preload failed:', preloadError);
				// Không throw error, chỉ log warning để không ảnh hưởng đến UI
			}

			return filteredApprovedVersions;
		} catch (error) {
			console.error('Error loading approved versions:', error);
			message.error('Lỗi khi tải danh sách approved versions');
			return [];
		}
	};

	// Load all user classes
	const loadUserClasses = async () => {
		try {
			const userClasses = await getAllUserClass();
			setAllUserClasses(userClasses);
		} catch (error) {
			console.error('Error loading user classes:', error);
		}
	};

	// Load current user's user classes
	const loadCurrentUserClasses = async () => {
		try {
			const userClasses = await getUserClassByEmail();
			setCurrentUserClasses(userClasses);
		} catch (error) {
			console.error('Error loading current user classes:', error);
			setCurrentUserClasses([]);
		}
	};

	// Load chart colors from settings
	const loadChartColors = async () => {
		try {
			const colorSetting = await getSettingByType('SettingColor');
			if (colorSetting && colorSetting.setting && Array.isArray(colorSetting.setting)) {
				const colors = colorSetting.setting.map(item => item.color);
				setChartColors(colors);
				// Also set selectedColors for use in styling
				setSelectedColors(colorSetting.setting);
			} else {
				// Fallback to default colors if setting not found
				const defaultColors = ['#13C2C2', '#3196D1', '#6DB8EA', '#87D2EA', '#9BAED7', '#C695B7', '#EDCCA1', '#A4CA9C'];
				setChartColors(defaultColors);
			}
		} catch (error) {
			console.error('Error loading chart colors:', error);
			// Fallback to default colors on error
			const defaultColors = ['#13C2C2', '#3196D1', '#6DB8EA', '#87D2EA', '#9BAED7', '#C695B7', '#EDCCA1', '#A4CA9C'];
			setChartColors(defaultColors);
		}
	};

	// Function to change chart view type
	const changeChartViewType = (itemId, viewType) => {
		setChartViewTypes(prev => ({
			...prev,
			[itemId]: viewType,
		}));
	};

	const loadTemplateTables = async () => {
		try {
			const tables = await getAllTemplateTables();
			setTemplateTables(tables);
		} catch (error) {
			console.error('Error loading template tables:', error);
			message.error('Lỗi khi tải danh sách bảng dữ liệu');
		}
	};

	// Load tags from settings
	const loadTags = async () => {
		try {
			const businessTagsSetting = await getSettingByType('BUSINESS_TAGS');
			const storeTagsSetting = await getSettingByType('STORE_TAGS');

			if (businessTagsSetting && businessTagsSetting.setting) {
				// Ensure setting is an array
				const tags = Array.isArray(businessTagsSetting.setting) ? businessTagsSetting.setting : businessTagsSetting.setting.split(',').map(tag => tag.trim()).filter(tag => tag);
				setBusinessTags(tags);
			}

			if (storeTagsSetting && storeTagsSetting.setting) {
				// Ensure setting is an array
				const tags = Array.isArray(storeTagsSetting.setting) ? storeTagsSetting.setting : storeTagsSetting.setting.split(',').map(tag => tag.trim()).filter(tag => tag);
				setStoreTags(tags);
			}
		} catch (error) {
			console.error('Error loading tags:', error);
		}
	};

	// Open tag settings modal
	const handleOpenTagSettings = () => {
		setShowTagSettingsModal(true);
	};

	// Handle tag settings save
	const handleTagSettingsSave = (businessTagsArray, storeTagsArray) => {
		setBusinessTags(businessTagsArray);
		setStoreTags(storeTagsArray);
		setShowTagSettingsModal(false);
	};

	// Handle prompt settings
	const handleOpenPromptSettings = () => {
		setPromptSettingValue(defaultPrompt);

		// Super admin không cần nhập PIN
		if (currentUser?.isSuperAdmin) {
			setShowPromptSettingsModal(true);
			return;
		}

		// Kiểm tra xem đã có PIN chưa
		if (!savedPin || savedPin.trim() === '') {
			// Chưa có PIN → Bắt buộc cài đặt PIN trước
			setShowSetupPinModal(true);
			setNewPin('');
			setConfirmPin('');
			setSetupPinError('');
		} else {
			// Đã có PIN → Cần xác thực PIN trước khi vào prompt settings
			setShowPinModal(true);
			setPinInput('');
			setPinError('');
		}
		setPendingModal('prompt-settings');
	};

	const handleSavePromptSettings = async () => {
		try {
			let result;

			if (!promptSettingData || !promptSettingData.id) {
				// Nếu không có ID, tạo setting mới
				result = await createSetting({
					type: SETTING_TYPE.PROMPT_DASHBOARD,
					setting: promptSettingValue,
				});
			} else {
				// Cập nhật setting hiện có
				result = await updateSetting({
					id: promptSettingData.id,
					type: SETTING_TYPE.PROMPT_DASHBOARD,
					setting: promptSettingValue,
				});
			}

			// Cập nhật state với dữ liệu mới
			setDefaultPrompt(promptSettingValue);
			setPromptSettingData(result);

			setShowPromptSettingsModal(false);
			message.success('Cài đặt prompt mặc định đã được lưu thành công!');
		} catch (error) {
			console.error('Error saving prompt settings:', error);
			message.error('Có lỗi xảy ra khi lưu cài đặt!');
		}
	};

	const handleCancelPromptSettings = () => {
		setShowPromptSettingsModal(false);
		setPromptSettingValue('');
		setPendingModal(null);
		setPinInput('');
		setPinError('');
		setIsPinVerified(false);
	};

	// Handler để setup PIN lần đầu
	const handleSetupPin = async () => {
		// Validate
		if (!newPin || newPin.length !== 6) {
			setSetupPinError('Mã PIN phải có đúng 6 số!');
			return;
		}
		if (newPin !== confirmPin) {
			setSetupPinError('Mã PIN xác nhận không khớp!');
			return;
		}

		try {
			const existingPinSetting = await getSettingByType('ANALYSIS_PIN_CODE');
			if (existingPinSetting && existingPinSetting.id) {
				// Update existing PIN
				await updateSetting({
					id: existingPinSetting.id,
					type: 'ANALYSIS_PIN_CODE',
					setting: { pin: newPin },
				});
				setSavedPin(newPin);
				setShowSetupPinModal(false);
				setNewPin('');
				setConfirmPin('');
				setSetupPinError('');
				message.success('Cài đặt mã PIN thành công!');
			}
		} catch (error) {
			console.error('Error setting up PIN:', error);
			message.error('Có lỗi xảy ra khi cài đặt mã PIN!');
		}
	};

	// Handler để thay đổi PIN
	const handleChangePin = async () => {
		// Validate
		if (!newPin || newPin.length !== 6) {
			setSetupPinError('Mã PIN phải có đúng 6 số!');
			return;
		}
		if (newPin !== confirmPin) {
			setSetupPinError('Mã PIN xác nhận không khớp!');
			return;
		}

		try {
			const existingPinSetting = await getSettingByType('ANALYSIS_PIN_CODE');
			if (existingPinSetting && existingPinSetting.id) {
				// Update existing PIN
				await updateSetting({
					id: existingPinSetting.id,
					type: 'ANALYSIS_PIN_CODE',
					setting: { pin: newPin },
				});
			}

			setSavedPin(newPin);
			setShowChangePinModal(false);
			setNewPin('');
			setConfirmPin('');
			setSetupPinError('');
			message.success('Thay đổi mã PIN thành công!');
		} catch (error) {
			console.error('Error changing PIN:', error);
			message.error('Có lỗi xảy ra khi thay đổi mã PIN!');
		}
	};

	// Handle background colors modal
	const handleOpenBackgroundModal = async () => {
		try {
			const existing = await getSettingByType('ANALYSIS_REVIEW_BACKGROUND_COLORS');
			if (existing && existing.setting && typeof existing.setting === 'object') {
				const { background, headerTitle } = existing.setting;
				const safeBackground = (background && background.gradient && background.gridColor !== undefined && background.gridOpacity !== undefined)
					? background
					: { gradient: ['#b7b7b7', '#979797', '#6c6c6c'], gridColor: '#ff6b6b', gridOpacity: 0.15 };
				const safeHeaderTitle = (headerTitle && (headerTitle.bgColor || headerTitle.imageUrl) && headerTitle.textColor)
					? {
						bgColor: headerTitle.bgColor || '#1677ff',
						textColor: headerTitle.textColor || '#ffffff',
						imageUrl: headerTitle.imageUrl || '',
						useImage: !!headerTitle.useImage,
					}
					: { bgColor: '#1677ff', textColor: '#ffffff', imageUrl: '', useImage: false };
				setDashboardColors({ background: safeBackground, headerTitle: safeHeaderTitle });
			} else {
				console.log('No existing dashboard color setting found, using current state');
			}
		} catch (error) {
			console.error('Lỗi khi lấy cài đặt màu dashboard:', error);
		}
		setShowBackgroundModal(true);
	};

	const handleSaveBackgroundColors = async () => {
		try {
			const existing = await getSettingByType('ANALYSIS_REVIEW_BACKGROUND_COLORS');
			if (existing && existing.id) {
				const updatedSetting = { ...existing, setting: dashboardColors };
				await updateSetting(updatedSetting);
			} else {
				const newSetting = { type: 'ANALYSIS_REVIEW_BACKGROUND_COLORS', setting: dashboardColors };
				await createSetting(newSetting);
			}
			setShowBackgroundModal(false);
			message.success('Cài đặt màu sắc dashboard đã được lưu thành công!');
		} catch (error) {
			console.error('Lỗi khi lưu cài đặt màu dashboard:', error);
			message.error('Có lỗi xảy ra khi lưu cài đặt màu dashboard!');
		}
	};

	// Filter user classes based on search and filter
	const filteredUserClasses = allUserClasses
		.filter(userClass => userClass.module === 'DASHBOARD') // Chỉ lấy module DASHBOARD
		.filter(userClass => {
			const matchesSearch = userClass.name.toLowerCase().includes(userClassSearchText.toLowerCase());

			const matchesFilter = userClassFilter === 'all' || (userClassFilter === 'selected' && selectedUserClasses.has(userClass.id)) || (userClassFilter === 'unselected' && !selectedUserClasses.has(userClass.id));

			return matchesSearch && matchesFilter;
		});

	// Kiểm tra quyền truy cập dashboard item
	const canAccessDashboardItem = (item) => {
		// Nếu user là admin, editor hoặc super admin thì có thể truy cập tất cả
		if (currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) {
			return true;
		}

		// Nếu item chưa gắn quyền (không có userClasses), chỉ admin/superAdmin/editor mới truy cập được
		if (!item.userClasses || item.userClasses.length === 0) {
			return false; // User thường không thể truy cập item chưa gắn quyền
		}

		// Kiểm tra xem user hiện tại có trong userClasses của item không
		const userClassIds = currentUserClasses.map(uc => uc.id);
		return item.userClasses.some(userClassId => userClassIds.includes(userClassId));
	};

	// Filter metrics based on search query and selected tags
	const filteredMetrics = dashboardItems
		.filter(item => canAccessDashboardItem(item))
		.filter(item => {
			const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;

			// Check if item matches business tags
			const matchesBusinessTags = selectedBusinessTags.includes('All') || selectedBusinessTags.includes(item.category);

			// Check if item matches store tags
			const matchesStoreTags = selectedStoreTags.includes('All') || selectedStoreTags.includes(item.storeCategory);

			// Item should match BOTH business tags AND store tags (AND logic)
			const matchesTags = matchesBusinessTags && matchesStoreTags;

			return matchesSearch && matchesTags;
		})
		.sort((a, b) => (a.info?.order ?? a.order ?? 0) - (b.info?.order ?? b.order ?? 0));


	const moveMetric = async (metricId, direction) => {
		const currentIndex = dashboardItems.findIndex(m => m.id === metricId);
		if (currentIndex === -1) return;

		const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
		if (newIndex < 0 || newIndex >= dashboardItems.length) return;

		const newItems = [...dashboardItems];
		const itemA = newItems[currentIndex];
		const itemB = newItems[newIndex];
		[newItems[currentIndex], newItems[newIndex]] = [itemB, itemA];
		setDashboardItems(newItems);

		// Persist order into info.order for swapped items
		try {
			const updatedA = { ...itemA, info: { ...(itemA.info || {}), order: newIndex } };
			const updatedB = { ...itemB, info: { ...(itemB.info || {}), order: currentIndex } };
			await Promise.all([
				updateDashBoardItem(updatedA),
				updateDashBoardItem(updatedB),
			]);
		} catch (e) {
			console.error('Failed to persist order', e);
		}
	};

	const handleUserClassChange = (userClassId) => {
		setSelectedUserClasses(prev => {
			const newSet = new Set(prev);
			if (newSet.has(userClassId)) {
				newSet.delete(userClassId);
			} else {
				newSet.add(userClassId);
			}
			return newSet;
		});
	};

	const handleSelectAllVisible = () => {
		const visibleUserClassIds = filteredUserClasses.map(uc => uc.id);
		setSelectedUserClasses(prev => new Set([...prev, ...visibleUserClassIds]));
	};

	const handleDeselectAllVisible = () => {
		const visibleUserClassIds = filteredUserClasses.map(uc => uc.id);
		setSelectedUserClasses(prev => {
			const newSet = new Set(prev);
			visibleUserClassIds.forEach(id => newSet.delete(id));
			return newSet;
		});
	};

	const handleOpenUserClassModal = (item = null) => {
		if (item) {
			// Mở modal cho 1 item cụ thể
			setSelectedDashboardItem(item);
			setSelectedUserClasses(new Set(item?.userClasses || []));
			setSelectedDashboardItems(new Set());
		} else {
			// Mở modal cho tất cả items
			setSelectedDashboardItem(null);
			setSelectedUserClasses(new Set());
			setSelectedDashboardItems(new Set());
		}
		setUserClassSearchText('');
		setUserClassFilter('all');
		setShowAuthModal(true);
	};

	const handleSaveUserClass = async () => {
		try {
			if (selectedDashboardItem) {
				// Cập nhật 1 item cụ thể
				await updateDashBoardItem({
					...selectedDashboardItem, userClasses: Array.from(selectedUserClasses),
				});
				message.success('Cập nhật quyền thành công');

				// Cập nhật lại danh sách items để hiển thị quyền mới
				await loadDashboardItems();

				// Quay lại màn hình danh sách tất cả items
				setSelectedDashboardItem(null);
				setSelectedUserClasses(new Set());
				setUserClassSearchText('');
				setUserClassFilter('all');
			}
		} catch (error) {
			console.error('Error updating user class:', error);
			message.error('Có lỗi xảy ra khi cập nhật quyền');
		}
	};

	const closeDetailsModal = () => {
		setShowDetailsModal(false);
		setShowComparisonModal(false);
		setSelectedMetricForDetails(null);
	};
	const handleCreateNewCard = async () => {
		if (newCard.title.trim()) {
			try {
				let newItem = {
					name: newCard.title,
					type: newCard.type,
					category: newCard.tag,
					storeCategory: newCard.storeTag,
					userClasses: [], // Mặc định không có userClasses restriction
					settings: {},
					analysis: {
						prompt: newCard.prompt, answer: newCard.answer,
					},
				};

				if (newCard.type === 'chart') {
					if (!newCard.idData) {
						message.warning('Vui lòng chọn KPI cho loại Chart');
						return;
					}
					newItem.idData = newCard.idData;
					newItem.settings = {
						recentPeriods: newCard.recentPeriods,
						chartViewType: newCard.chartViewType,
					};
				} else if (newCard.type === 'top') {
					if (!selectedApprovedVersion) {
						message.warning('Vui lòng chọn data cho loại Top');
						return;
					}
					if (!selectedColumns.column1 || !selectedColumns.column2) {
						message.warning('Vui lòng chọn đủ 2 cột cho loại Top');
						return;
					}
					newItem.idData = selectedApprovedVersion;
					newItem.settings = {
						column1: selectedColumns.column1, column2: selectedColumns.column2, topN: topN,
					};
				} else if (newCard.type === 'comparison') {
					if (selectedKpis.length < 2) {
						message.warning('Vui lòng chọn ít nhất 2 KPI để so sánh');
						return;
					}
					// Kiểm tra xem có KPI nào bị trùng lặp không
					const uniqueKpis = [...new Set(selectedKpis)];
					if (uniqueKpis.length !== selectedKpis.length) {
						message.warning('Không thể chọn cùng một KPI nhiều lần');
						return;
					}
					newItem.settings = {
						kpis: selectedKpis,
						recentPeriods: newCard.recentPeriods,
						chartViewType: newCard.chartViewType || 'line',
					};
				} else if (newCard.type === 'table_chart') {
					if (!newCard.idData) {
						message.warning('Vui lòng chọn dữ liệu');
						return;
					}
					if (!newTableChartValueColumn) {
						message.warning('Vui lòng chọn cột giá trị');
						return;
					}

					// Validate data grouping - only allow grouping if time column is selected
					if (newTableChartDataGrouping !== 'none' && !newTableChartTimeColumn) {
						message.warning('Cần chọn cột thời gian để gộp dữ liệu theo tháng/tuần');
						return;
					}
					newItem.idData = newCard.idData;
					newItem.settings = {
						timeColumn: newTableChartTimeColumn,
						groupColumn: newTableChartGroupColumn,
						valueColumn: newTableChartValueColumn,
						chartType: newTableChartType,
						dataGrouping: newTableChartDataGrouping,
					};
				} else if (newCard.type === 'table_chart_2') {
					if (!newCard.idData) {
						message.warning('Vui lòng chọn dữ liệu');
						return;
					}
					if (!newTableChart2ValueColumn) {
						message.warning('Vui lòng chọn cột giá trị');
						return;
					}

					newItem.idData = newCard.idData;
					newItem.settings = {
						timeColumn: newTableChart2TimeColumn,
						groupColumn: newTableChart2GroupColumn,
						valueColumn: newTableChart2ValueColumn,
						chartType: newTableChart2Type,
						dateRange: newTableChart2DateRange,
					};
				} else if (newCard.type === 'statistics') {
					if (!newCard.selectedKpiCalculators || newCard.selectedKpiCalculators.length === 0) {
						message.warning('Vui lòng chọn ít nhất một KPI Calculator cho loại Thống kê');
						return;
					}
					newItem.settings = {
						kpiCalculators: newCard.selectedKpiCalculators,
					};
				} else if (newCard.type === 'table') {
					if (!newCard.idData) {
						message.warning('Vui lòng chọn dữ liệu cho loại Table');
						return;
					}
					if (!newTableDisplayColumns || newTableDisplayColumns.length === 0) {
						message.warning('Vui lòng chọn ít nhất một cột để hiển thị');
						return;
					}

					// Fetch data for the new table
					const selectedVersion = approvedVersions.find(version => version.id == newCard.idData);
					if (!selectedVersion) {
						message.error('Không tìm thấy phiên bản đã chọn');
						return;
					}

					const templateTable = await getTableByid(selectedVersion.id_template);
					if (!templateTable) {
						message.error('Không tìm thấy template table');
						return;
					}
					newItem.idData = newCard.idData;
					newItem.settings = {
						dateColumn: newTableDateColumn,
						dateRange: newTableDateRange,
						dateColumnSize: newTableDateColumnSize,
						displayColumns: newTableDisplayColumns,
						columnSettings: newTableColumnSettings,
						columnSizes: newTableColumnSizes,
						filterColumn: newTableFilterColumn,
						sortColumn: newTableSortColumn,
						sortType: newTableSortType,
						templateColumns: newTemplateColumns,
						timeThreshold: newTableTimeThreshold, // Add timeThreshold for AI analysis
						tableFilters: newTableFilters,
						tableFilterLogic: newTableFilterLogic,
					};
				}

				await createDashBoardItem(newItem);
				await loadDashboardItems();

				// Set chart view type for the new item if it's a chart type
				if (newCard.type === 'chart') {
					setChartViewTypes(prev => ({
						...prev,
						[newItem.id]: newCard.chartViewType,
					}));
				}

				setNewCard({
					title: '',
					type: 'chart',
					tag: '',
					storeTag: '',
					idData: null,
					selectedKpiCalculators: [],
					prompt: '',
					answer: '',
					recentPeriods: 0,
					chartViewType: 'line',
				});
				setSelectedApprovedVersion(null);
				setTemplateColumns([]);
				setSelectedColumns({ column1: '', column2: '' });
				setTopN(5);
				setSelectedKpis([]);
				setNewTableDisplayColumns([]);
				setNewTableDateColumn(null);
				setNewTableDateRange('all');
				setNewTableFilterColumn(null);
				setNewTableSortColumn(null);
				setNewTableSortType('desc');
				setNewTableColumnSettings({});
				setNewTableColumnSizes({});
				setNewTableTimeThreshold(null); // Reset timeThreshold
				setNewTemplateColumns([]);
				setNewTableFilters([]);
				setNewTableFilterLogic('AND');
				setShowNewCardModal(false);
				message.success('Thẻ mới đã được tạo');
			} catch (error) {
				console.error('Error creating dashboard item:', error);
				message.error('Lỗi khi tạo thẻ mới');
			}
		} else {
			message.warning('Vui lòng điền đầy đủ thông tin');
		}
	};

	const handleOpenNewCardModal = () => {
		setNewCard({
			title: '',
			type: 'chart',
			tag: '',
			storeTag: '',
			idData: null,
			selectedKpiCalculators: [],
			prompt: defaultPrompt, // Set default prompt
			answer: '',
			recentPeriods: 0,
		});
		setShowNewCardModal(true);
	};

	const handleCancelNewCard = () => {
		setNewCard({
			title: '',
			type: 'chart',
			tag: '',
			storeTag: '',
			idData: null,
			selectedKpiCalculators: [],
			prompt: '',
			answer: '',
			recentPeriods: 0,
		});
		setShowNewCardModal(false);
		setSelectedApprovedVersion(null);
		setTemplateColumns([]);
		setSelectedColumns({ column1: '', column2: '' });
		setTopN(5);
		setSelectedKpis([]);
		setNewTableDisplayColumns([]);
		setNewTableDateColumn(null);
		setNewTableDateColumnSize(2);
		setNewTableColumnSettings({});
		setNewTableTimeThreshold(null); // Reset timeThreshold
		setNewTemplateColumns([]);
		// Reset table_chart states
		setNewTableChartTimeColumn(null);
		setNewTableChartGroupColumn(null);
		setNewTableChartValueColumn(null);
		setNewTableChartType('line');
		setNewTableChartDataGrouping('none');

		// Reset table_chart_2 states
		setNewTableChart2TimeColumn(null);
		setNewTableChart2GroupColumn(null);
		setNewTableChart2ValueColumn(null);
		setNewTableChart2Type('line');
		setNewTableChart2DateRange('all');
	};

	// Function to handle approved version change for new table
	const handleNewTableApprovedVersionChange = async (approveVersionId) => {
		try {
			setLoading(true);
			setNewCard(prev => ({ ...prev, idData: approveVersionId }));

			const selectedVersion = approvedVersions.find(version => version.id == approveVersionId);
			if (!selectedVersion) {
				setNewTemplateColumns([]);
				return;
			}

			const templateId = selectedVersion.id_template;
			if (!templateId) {
				console.error('No template_id found in approveVersion');
				setNewTemplateColumns([]);
				return;
			}

			const templateTable = await getTableByid(templateId);
			if (!templateTable) {
				console.error('Template table not found');
				setNewTemplateColumns([]);
				return;
			}

			let columns = [];
			let sampleData = []; // Added to fetch actual data keys

			if (templateTable.isCombine) {
				sampleData = await loadAndMergeData(templateTable);
			} else {
				// For regular tables, get data from the specific step
				const versionId = selectedVersion.id_version;
				const targetStep = templateTable.steps?.find(step => step.id === versionId);

				if (targetStep && targetStep.data) {
					sampleData = targetStep.data;
				} else {
					// Fallback to last step data
					const lastStep = templateTable.steps?.[templateTable.steps.length - 1];
					if (lastStep && lastStep.data) {
						sampleData = lastStep.data;
					}
				}
			}

			if (sampleData.length > 0) {
				const fields = Object.keys(sampleData[0]);
				columns = fields.map((columnName) => ({
					id: columnName, // Use actual data key as id
					columnName: columnName, // Use actual data key as display name initially
				}));
			} else {
				// Fallback to existing logic if no sample data
				if (templateTable.steps && templateTable.steps.length > 0) {
					const versionId = selectedVersion.id_version;
					const targetStep = templateTable.steps.find(step => step.id === versionId);
					if (targetStep && targetStep.config.outputColumns) {
						columns = targetStep.config.outputColumns.map((column) => ({
							id: column.name || column, columnName: column.name || column,
						}));
					} else {
						const lastStep = templateTable.steps[templateTable.steps.length - 1];
						if (lastStep && lastStep.outputColumns) {
							columns = lastStep.outputColumns.map((column) => ({
								id: column.name || column, columnName: column.name || column,
							}));
						}
					}
				}
			}

			setNewTemplateColumns(columns);
		} catch (error) {
			console.error('Error loading new table template columns:', error);
			setNewTemplateColumns([]);
		} finally {
			setLoading(false);
		}
	};

	// Function to handle display columns change for new table
	const handleNewTableDisplayColumnsChange = (values) => {
		setNewTableDisplayColumns(values);

		const newColumnSettings = { ...newTableColumnSettings };
		const newCollapsedState = { ...newCollapsedColumns };

		values.forEach(columnId => {
			if (!newColumnSettings[columnId]) {
				const isDateColumn = newTemplateColumns.find(col => col.id === columnId)?.columnName.toLowerCase().includes('ngày') || newTemplateColumns.find(col => col.id === columnId)?.columnName.toLowerCase().includes('date') || newTemplateColumns.find(col => col.id === columnId)?.columnName.toLowerCase().includes('time') || newTemplateColumns.find(col => col.id === columnId)?.columnName.toLowerCase().includes('thời gian');

				newColumnSettings[columnId] = {
					type: isDateColumn ? 'date' : 'text', dateFormat: 'DD/MM/YY', valueFormat: {
						showThousands: false,
						showMillions: false,
						showPercentage: false,
						decimalPlaces: 0,
						negativeRed: false,
					},
				};
			}
			// Đặt mặc định là collapsed
			newCollapsedState[columnId] = true;
		});

		Object.keys(newColumnSettings).forEach(columnId => {
			if (!values.includes(columnId)) {
				delete newColumnSettings[columnId];
				delete newCollapsedState[columnId];
			}
		});

		setNewTableColumnSettings(newColumnSettings);
		setNewCollapsedColumns(newCollapsedState);
	};
	const handleOpenEditModal = async (item) => {

		// Đảm bảo item có đầy đủ thông tin cần thiết
		const itemToEdit = {
			...item, tag: item.tag || item.category || '', // Đảm bảo có tag mặc định
			category: item.category || item.tag || '', // Đảm bảo có category mặc định
			storeTag: item.storeCategory || item.storeTag || '', // Đảm bảo có storeTag mặc định
			analysis: item.analysis || { prompt: '', answer: '' }, // Đảm bảo có analysis field
		};
		setEditingDashboardItem(itemToEdit);

		// Khởi tạo dữ liệu edit dựa trên loại item
		if (item.type === 'chart') {
			const recentPeriods = item.settings?.recentPeriods || 0;
			const chartViewType = item.settings?.chartViewType || 'line';
			setEditRecentPeriods(recentPeriods);
			setEditChartViewType(chartViewType);
		} else if (item.type === 'comparison') {
			const recentPeriods = item.settings?.recentPeriods || 0;
			setEditSelectedKpis(item.settings?.kpis || []);
			setEditRecentPeriods(recentPeriods);
		} else if (item.type === 'top') {
			setEditSelectedApprovedVersion(item.idData);
			setEditTopN(item.settings?.topN || 5);
			setEditSelectedColumns({
				column1: item.settings?.column1 || '', column2: item.settings?.column2 || '',
			});

			// Load template columns nếu có approvedVersion
			if (item.idData) {
				try {
					const selectedVersion = approvedVersions.find(version => version.id == item.idData);
					if (selectedVersion) {
						const templateId = selectedVersion.id_template;
						if (templateId) {
							const templateTable = await getTableByid(templateId);
							if (templateTable && templateTable.steps && templateTable.steps.length > 0) {
								const versionId = selectedVersion.id_version;
								const targetStep = templateTable.steps.find(step => step.id === versionId);

								if (targetStep && targetStep.config.outputColumns) {
									const columns = targetStep.config.outputColumns.map((column, index) => ({
										id: column.name || column, columnName: column.name || column,
									}));
									setEditTemplateColumns(columns);
								} else {
									const lastStep = templateTable.steps[templateTable.steps.length - 1];
									if (lastStep && lastStep.outputColumns) {
										const columns = lastStep.outputColumns.map((column, index) => ({
											id: column.name || column, columnName: column.name || column,
										}));
										setEditTemplateColumns(columns);
									}
								}
							}
						}
					}
				} catch (error) {
					console.error('Error loading edit template columns:', error);
				}
			}
		} else if (item.type === 'statistics') {
			// For statistics type, set selected KPI Calculators
			setEditSelectedKpiCalculators(item.settings?.kpiCalculators || []);
		} else if (item.type === 'table_chart') {
			setEditSelectedApprovedVersion(item.idData);
			setEditTableChartTimeColumn(item.settings?.timeColumn || null);
			setEditTableChartGroupColumn(item.settings?.groupColumn || null);
			setEditTableChartValueColumn(item.settings?.valueColumn || null);
			setEditTableChartType(item.settings?.chartType || 'line');
			setEditTableChartDataGrouping(item.settings?.dataGrouping || 'none');
			// Load template columns for table chart
			if (item.idData) {
				try {
					const selectedVersion = approvedVersions.find(version => version.id == item.idData);

					if (selectedVersion) {
						const templateId = selectedVersion.id_template;

						if (templateId) {
							const templateTable = await getTableByid(templateId);

							if (templateTable && templateTable.steps && templateTable.steps.length > 0) {
								const versionId = selectedVersion.id_version;
								const targetStep = templateTable.steps.find(step => step.id === versionId);

								if (targetStep && targetStep.config && targetStep.config.outputColumns) {
									const columns = targetStep.config.outputColumns.map((column, index) => ({
										id: column.name || column, columnName: column.name || column,
									}));
									setEditTemplateColumns(columns);
								} else {
									const lastStep = templateTable.steps[templateTable.steps.length - 1];

									if (lastStep && lastStep.config && lastStep.config.outputColumns) {
										const columns = lastStep.config.outputColumns.map((column, index) => ({
											id: column.name || column, columnName: column.name || column,
										}));
										setEditTemplateColumns(columns);
									}
								}
							}
						}
					}
				} catch (error) {
					console.error('Error loading edit template columns for table chart:', error);
				}
			}
		} else if (item.type === 'table_chart_2') {
			setEditSelectedApprovedVersion(item.idData);
			setEditTableChart2TimeColumn(item.settings?.timeColumn || null);
			setEditTableChart2GroupColumn(item.settings?.groupColumn || null);
			setEditTableChart2ValueColumn(item.settings?.valueColumn || null);
			setEditTableChart2Type(item.settings?.chartType || 'line');
			setEditTableChart2DateRange(item.settings?.dateRange || 'all');

			// Load template columns for table chart 2
			if (item.idData) {
				try {
					const selectedVersion = approvedVersions.find(version => version.id == item.idData);

					if (selectedVersion) {
						const templateId = selectedVersion.id_template;

						if (templateId) {
							const templateTable = await getTableByid(templateId);

							if (templateTable && templateTable.steps && templateTable.steps.length > 0) {
								const versionId = selectedVersion.id_version;
								const targetStep = templateTable.steps.find(step => step.id === versionId);

								if (targetStep && targetStep.config && targetStep.config.outputColumns) {
									const columns = targetStep.config.outputColumns.map((column, index) => ({
										id: column.name || column, columnName: column.name || column,
									}));
									setEditTableChart2Columns(columns);
								} else {
									const lastStep = templateTable.steps[templateTable.steps.length - 1];

									if (lastStep && lastStep.config && lastStep.config.outputColumns) {
										const columns = lastStep.config.outputColumns.map((column, index) => ({
											id: column.name || column, columnName: column.name || column,
										}));
										setEditTableChart2Columns(columns);
									}
								}
							}
						}
					}
				} catch (error) {
					console.error('Error loading edit template columns for table chart 2:', error);
				}
			}
		} else if (item.type === 'table') {

			setEditSelectedApprovedVersion(item.idData);
			setEditTableDisplayColumns(item.settings?.displayColumns || []);
			setEditTableDateColumn(item.settings?.dateColumn || null);
			setEditTableDateRange(item.settings?.dateRange || 'all');
			setEditTableDateColumnSize(item.settings?.dateColumnSize || 2);
			setEditTableColumnSettings(item.settings?.columnSettings || {});
			setEditTableColumnSizes(item.settings?.columnSizes || {});
			setEditTableFilterColumn(item.settings?.filterColumn || null);
			setEditTableSortColumn(item.settings?.sortColumn || null);
			setEditTableSortType(item.settings?.sortType || 'desc');
			setEditTableTimeThreshold(item.settings?.timeThreshold || null); // Load timeThreshold
			setEditTemplateColumns(item.settings?.templateColumns || []);
			setEditTableFilters(item.settings?.tableFilters || []);
			setEditTableFilterLogic(item.settings?.tableFilterLogic || 'AND');

			// Load template columns for table
			if (item.idData) {
				try {
					const selectedVersion = approvedVersions.find(version => version.id == item.idData);

					if (selectedVersion) {
						const templateId = selectedVersion.id_template;

						if (templateId) {
							const templateTable = await getTableByid(templateId);
							if (templateTable && templateTable.steps && templateTable.steps.length > 0) {
								const versionId = selectedVersion.id_version;
								const targetStep = templateTable.steps.find(step => step.id === versionId);

								if (targetStep && targetStep.config.outputColumns) {
									const columns = targetStep.config.outputColumns.map((column, index) => ({
										id: column.name || column, columnName: column.name || column,
									}));
									setEditTemplateColumns(columns);
								} else {
									const lastStep = templateTable.steps[templateTable.steps.length - 1];
									if (lastStep && lastStep.outputColumns) {
										const columns = lastStep.outputColumns.map((column, index) => ({
											id: column.name || column, columnName: column.name || column,
										}));
										setEditTemplateColumns(columns);
									}
								}
							}
						}
					}
				} catch (error) {
					console.error('Error loading edit template columns for table:', error);
				}
			}
		}

		setSettingModalVisible(true);
	};

	const handleSaveEdit = async () => {

		if (!editingDashboardItem || !editingDashboardItem.name.trim()) {
			message.warning('Tên không được để trống');
			return;
		}

		try {
			let updatedItem = {
				...editingDashboardItem,
				tag: editingDashboardItem.tag || editingDashboardItem.category || '',
				category: editingDashboardItem.category || editingDashboardItem.tag || '',
				storeCategory: editingDashboardItem.storeTag || editingDashboardItem.storeCategory || '',
				analysis: editingDashboardItem.analysis || {},
			};

			// Validate và cập nhật dữ liệu theo loại item
			if (editingDashboardItem.type === 'chart') {
				// Preserve existing settings and update recentPeriods and chartViewType
				const existingSettings = editingDashboardItem.settings || {};
				const recentPeriods = editingDashboardItem.settings?.recentPeriods || 0;
				updatedItem.settings = {
					...existingSettings,
					recentPeriods: recentPeriods,
					chartViewType: editChartViewType,
				};
			} else if (editingDashboardItem.type === 'comparison') {
				if (editSelectedKpis.length < 2) {
					message.warning('Vui lòng chọn ít nhất 2 KPI để so sánh');
					return;
				}
				const uniqueKpis = [...new Set(editSelectedKpis)];
				if (uniqueKpis.length !== editSelectedKpis.length) {
					message.warning('Không thể chọn cùng một KPI nhiều lần');
					return;
				}
				// Preserve existing settings and update kpis and recentPeriods
				const existingSettings = editingDashboardItem.settings || {};
				const recentPeriods = editingDashboardItem.settings?.recentPeriods || 0;
				updatedItem.settings = {
					...existingSettings,
					kpis: editSelectedKpis,
					recentPeriods: recentPeriods,
				};
			} else if (editingDashboardItem.type === 'top') {
				if (!editSelectedApprovedVersion) {
					message.warning('Vui lòng chọn dữ liệu');
					return;
				}
				if (!editSelectedColumns.column1 || !editSelectedColumns.column2) {
					message.warning('Vui lòng chọn đủ cột tên và cột giá trị');
					return;
				}
				updatedItem.idData = editSelectedApprovedVersion;
				updatedItem.settings = {
					column1: editSelectedColumns.column1, column2: editSelectedColumns.column2, topN: editTopN,
				};
			} else if (editingDashboardItem.type === 'table_chart') {

				if (!editSelectedApprovedVersion) {
					message.warning('Vui lòng chọn dữ liệu');
					return;
				}
				if (!editTableChartValueColumn) {
					message.warning('Vui lòng chọn cột giá trị');
					return;
				}

				// Validate data grouping - only allow grouping if time column is selected
				if (editTableChartDataGrouping !== 'none' && !editTableChartTimeColumn) {
					message.warning('Cần chọn cột thời gian để gộp dữ liệu theo tháng/tuần');
					return;
				}

				// Preserve existing fetchedData if it exists
				const existingSettings = editingDashboardItem.settings || {};
				updatedItem.idData = editSelectedApprovedVersion;
				updatedItem.settings = {
					...existingSettings, // Preserve existing data like fetchedData
					timeColumn: editTableChartTimeColumn,
					groupColumn: editTableChartGroupColumn,
					valueColumn: editTableChartValueColumn,
					chartType: editTableChartType,
					dataGrouping: editTableChartDataGrouping,
				};
			} else if (editingDashboardItem.type === 'table_chart_2') {

				if (!editSelectedApprovedVersion) {
					message.warning('Vui lòng chọn dữ liệu');
					return;
				}
				if (!editTableChart2ValueColumn) {
					message.warning('Vui lòng chọn cột giá trị');
					return;
				}

				// Preserve existing fetchedData if it exists
				const existingSettings = editingDashboardItem.settings || {};
				updatedItem.idData = editSelectedApprovedVersion;
				updatedItem.settings = {
					...existingSettings, // Preserve existing data like fetchedData
					timeColumn: editTableChart2TimeColumn,
					groupColumn: editTableChart2GroupColumn,
					valueColumn: editTableChart2ValueColumn,
					chartType: editTableChart2Type,
					dateRange: editTableChart2DateRange,
				};
			} else if (editingDashboardItem.type === 'statistics') {
				if (!editSelectedKpiCalculators || editSelectedKpiCalculators.length === 0) {
					message.warning('Vui lòng chọn ít nhất một KPI Calculator');
					return;
				}
				updatedItem.settings = {
					kpiCalculators: editSelectedKpiCalculators,
				};
			} else if (editingDashboardItem.type === 'table') {

				if (!editSelectedApprovedVersion) {
					message.warning('Vui lòng chọn dữ liệu');
					return;
				}
				if (!editTableDisplayColumns || editTableDisplayColumns.length === 0) {
					message.warning('Vui lòng chọn ít nhất một cột để hiển thị');
					return;
				}

				// Preserve existing fetchedData and templateColumns if they exist
				const existingSettings = editingDashboardItem.settings || {};
				updatedItem.idData = editSelectedApprovedVersion;
				updatedItem.settings = {
					...existingSettings, // Preserve existing data like fetchedData
					dateColumn: editTableDateColumn,
					dateRange: editTableDateRange,
					dateColumnSize: editTableDateColumnSize,
					displayColumns: editTableDisplayColumns,
					columnSettings: editTableColumnSettings,
					columnSizes: editTableColumnSizes,
					filterColumn: editTableFilterColumn,
					sortColumn: editTableSortColumn,
					sortType: editTableSortType,
					templateColumns: editTemplateColumns,
					timeThreshold: editTableTimeThreshold, // Add timeThreshold for AI analysis
					tableFilters: editingDashboardItem.settings?.tableFilters || [],
					tableFilterLogic: editingDashboardItem.settings?.tableFilterLogic || 'AND',
				};
			}
			await updateDashBoardItem(updatedItem);

			// Update chartViewTypes state if it's a chart type
			if (editingDashboardItem.type === 'chart') {
				setChartViewTypes(prev => ({
					...prev,
					[editingDashboardItem.id]: editChartViewType,
				}));
			} else if (editingDashboardItem.type === 'comparison') {
				// Immediately reload comparison chart with updated settings
				try {
					await loadComparisonData(updatedItem, true);
				} catch (e) {
					console.warn('Reload comparison failed after edit, will refresh list next', e);
				}
			} else if (editingDashboardItem.type === 'table') {
				// Reload table data immediately so filters take effect
				try {
					await loadTableData(updatedItem, true);
				} catch (e) {
					console.warn('Reload table failed after edit, will refresh list next', e);
				}
			}

			message.success('Đã cập nhật thành công');
			setSettingModalVisible(false);
			setEditingDashboardItem(null);

			// Reset edit states
			setEditSelectedKpis([]);
			setEditSelectedApprovedVersion(null);
			setEditTemplateColumns([]);
			setEditSelectedColumns({ column1: '', column2: '' });
			setEditTopN(5);
			setEditRecentPeriods(0);
			setEditSelectedKpiCalculators([]);
			setEditTableDisplayColumns([]);
			setEditTableDateColumn(null);
			setEditTableDateRange('all');
			setEditTableFilterColumn(null);
			setEditTableSortColumn(null);
			setEditTableSortType('desc');
			setEditTableTimeThreshold(null); // Reset timeThreshold

			// Reset table_chart edit states
			setEditTableChartTimeColumn(null);
			setEditTableChartGroupColumn(null);
			setEditTableChartValueColumn(null);
			setEditTableChartType('line');
			setEditTableChartDataGrouping('none');

			// Reset table_chart_2 edit states
			setEditTableChart2TimeColumn(null);
			setEditTableChart2GroupColumn(null);
			setEditTableChart2ValueColumn(null);
			setEditTableChart2Type('line');
			setEditTableChart2DateRange('all');
			setEditTableChart2Columns([]);
			await loadDashboardItems();
		} catch (error) {
			console.error('Error updating dashboard item:', error);
			message.error('Lỗi khi cập nhật');
		}
	};

	const handleCancelEdit = () => {
		setSettingModalVisible(false);
		setEditingDashboardItem(null);

		// Reset edit states
		setEditSelectedKpis([]);
		setEditSelectedApprovedVersion(null);
		setEditTemplateColumns([]);
		setEditSelectedColumns({ column1: '', column2: '' });
		setEditTopN(5);
		setEditRecentPeriods(0);
		setEditSelectedKpiCalculators([]);
		setEditTableDisplayColumns([]);
		setEditTableDateColumn(null);
		setEditTableDateColumnSize(2);
		setEditTableFilterColumn(null);
		setEditTableSortColumn(null);
		setEditTableSortType('desc');
		setEditTableColumnSettings({});
		setEditTableColumnSizes({});
		setEditTableTimeThreshold(null); // Reset timeThreshold

		// Reset table_chart edit states
		setEditTableChartTimeColumn(null);
		setEditTableChartGroupColumn(null);
		setEditTableChartValueColumn(null);
		setEditTableChartType('line');
		setEditTableChartDataGrouping('none');

		// Reset table_chart_2 edit states
		setEditTableChart2TimeColumn(null);
		setEditTableChart2GroupColumn(null);
		setEditTableChart2ValueColumn(null);
		setEditTableChart2Type('line');
		setEditTableChart2DateRange('all');
		setEditTableChart2Columns([]);
	};

	// Table column settings functions
	const updateTableColumnSetting = (columnId, field, value) => {
		setEditTableColumnSettings(prev => ({
			...prev, [columnId]: {
				...prev[columnId], [field]: value,
			},
		}));
	};

	const updateTableColumnValueFormat = (columnId, field, value) => {
		setEditTableColumnSettings(prev => ({
			...prev, [columnId]: {
				...prev[columnId], valueFormat: {
					...prev[columnId].valueFormat, [field]: value,
				},
			},
		}));
	};

	const toggleColumnCollapse = (columnId) => {
		setCollapsedColumns(prev => ({
			...prev, [columnId]: !prev[columnId],
		}));
	};

	const toggleNewColumnCollapse = (columnId) => {
		setNewCollapsedColumns(prev => ({
			...prev, [columnId]: !prev[columnId],
		}));
	};

	const openAnalysisDetailModal = (item) => {
		// Mở modal trực tiếp không cần PIN
		setAnalysisDetailModal({
			visible: true, item: item, analysis: item.analysis,
		});
	};

	const closeAnalysisDetailModal = () => {
		setAnalysisDetailModal({
			visible: false, item: null, analysis: null,
		});
		setIsPinVerified(false);
	};

	// Handler để xác thực PIN
	const handleVerifyPin = () => {
		if (pinInput == savedPin) {
			// PIN đúng
			setIsPinVerified(true);
			setShowPinModal(false);
			setPinError('');

			// Kiểm tra xem đang mở gì
			if (pendingModal === 'prompt-settings') {
				// Mở modal prompt settings
				setShowPromptSettingsModal(true);
				setPendingModal(null);
			}
			// else if (pendingAnalysisItem) {
			// 	// Mở modal phân tích
			// 	setAnalysisDetailModal({
			// 		visible: true,
			// 		item: pendingAnalysisItem,
			// 		analysis: pendingAnalysisItem.analysis,
			// 	});
			// 	setPendingAnalysisItem(null);
			// }
			setPinInput('');
		} else {
			// PIN sai
			setPinError('Mã PIN không đúng. Vui lòng thử lại.');
		}
	};


	// Hàm chuyển đổi điểm số sang hệ ABCD
	const getGradeFromScore = (score) => {
		if (score >= 75) return { grade: 'A', color: '#58B16A' };
		if (score >= 50) return { grade: 'B', color: '#1172df' };
		if (score >= 25) return { grade: 'C', color: '#fa8c16' };
		if (score > 0) return { grade: 'D', color: '#f5222d' };
		return { grade: 'N/A', color: '#d8d8d8' };
	};

	const handleReanalyzeInModal = async (modalSelectedAIModel) => {
		if (analysisDetailModal.item) {
			try {
				// Sử dụng AI model được chọn từ modal
				await handleAnalyzeWithAI(analysisDetailModal.item, modalSelectedAIModel);

				// Refetch the item data from database
				const refetchedItem = await getDashBoardItemById(analysisDetailModal.item.id);

				// Cập nhật modal với dữ liệu mới từ database mà không đóng modal
				setAnalysisDetailModal(prev => ({
					...prev,
					item: refetchedItem,
					analysis: refetchedItem.analysis,
				}));

				// Cập nhật item trong dashboardItems để đồng bộ
				setDashboardItems(prev => prev.map(item =>
					item.id === refetchedItem.id ? refetchedItem : item,
				));
			} catch (error) {
				console.error('Lỗi khi phân tích lại trong modal:', error);
			}
		}
	};

	const handleAnalyzeWithAI = async (item, customAIModel = null, customPrompt = null) => {
		try {
			// Kiểm tra quyền truy cập và chỉnh sửa
			if (!canAccessDashboardItem(item)) {
				message.error('Bạn không có quyền phân tích item này');
				return;
			}

			// Kiểm tra quyền chỉnh sửa (cần để cập nhật analysis)
			const canEdit = currentUser?.role === 'admin' || (item.userClasses && item.userClasses.length > 0 && item.userClasses.some(userClass => currentUserClasses.some(currentClass => currentClass.id === userClass.id))) || (!item.userClasses || item.userClasses.length === 0);

			if (!canEdit) {
				message.error('Bạn không có quyền chỉnh sửa item này để lưu phân tích');
				return;
			}

			// Kiểm tra xem item có phải là loại được hỗ trợ không
			if (item.type !== 'table_chart' && item.type !== 'table_chart_2' && item.type !== 'table' && item.type !== 'comparison' && item.type !== 'chart' && item.type !== 'statistics') {
				message.warning('Chỉ hỗ trợ phân tích cho loại tableChart, tableChart2, table, comparison, chart và statistics');
				return;
			}

			// Kiểm tra xem item đã có answer chưa (cho phép phân tích lại)
			const isReanalyzing = item.analysis?.answer;

			// Bắt đầu phân tích
			setAnalyzingItems(prev => new Set(prev).add(item.id));

			// Lấy dữ liệu chart
			let chartData = null;
			let rawData = null;

			if (item.type === 'table_chart') {
				// Lấy dữ liệu từ tableData hoặc rawApprovedVersionData
				chartData = tableData[item.id];
				rawData = rawApprovedVersionData[item.id];
			} else if (item.type === 'table_chart_2') {
				// Lấy dữ liệu từ tableData hoặc rawApprovedVersionData
				chartData = tableData[item.id];
				rawData = rawApprovedVersionData[item.id];
			} else if (item.type === 'table') {
				// Lấy dữ liệu từ tableData hoặc rawApprovedVersionData
				chartData = tableData[item.id];
				rawData = rawApprovedVersionData[item.id];
			} else if (item.type === 'comparison') {
				// Lấy dữ liệu từ tableData hoặc rawApprovedVersionData
				chartData = tableData[item.id];
				rawData = rawApprovedVersionData[item.id];
			} else if (item.type === 'statistics') {
				// Lấy dữ liệu từ kpiCalculators state
				const kpiCalculatorIds = item.settings?.kpiCalculators || [];
				const selectedKpiCalculators = kpiCalculatorIds.map(id => kpiCalculators.find(k => k.id === id)).filter(Boolean);

				// Kết hợp dữ liệu từ tất cả KPI Calculator
				if (selectedKpiCalculators.length > 0) {
					const allData = selectedKpiCalculators.reduce((acc, kpi) => {
						if (kpi.tableData && kpi.tableData.length > 0) {
							acc.push(...kpi.tableData.map(dataItem => ({
								...dataItem, kpiName: kpi.name, kpiId: kpi.id,
							})));
						}
						return acc;
					}, []);

					chartData = allData;
				}
			} else if (item.type === 'chart') {
				// Lấy dữ liệu từ tableData hoặc rawApprovedVersionData
				chartData = tableData[item.id];
				rawData = rawApprovedVersionData[item.id];
			}

			// Kiểm tra dữ liệu
			if (!chartData || chartData.length === 0) {
				message.info('Đang tải dữ liệu để phân tích...');

				// Thử tải dữ liệu nếu chưa có
				try {
					if (item.type === 'table_chart') {
						await loadTableChartData(item, true);
						chartData = tableData[item.id];
					} else if (item.type === 'table_chart_2') {
						await loadTableChart2Data(item, true);
						chartData = tableData[item.id];
					} else if (item.type === 'table') {
						await loadTableData(item, true);
						chartData = tableData[item.id];
					} else if (item.type === 'comparison') {
						await loadComparisonData(item, true);
						chartData = tableData[item.id];
					} else if (item.type === 'statistics') {
						await loadStatisticsData(item);
						// Lấy dữ liệu từ kpiCalculators state
						const kpiCalculatorIds = item.settings?.kpiCalculators || [];
						const selectedKpiCalculators = kpiCalculatorIds.map(id => kpiCalculators.find(k => k.id === id)).filter(Boolean);

						// Kết hợp dữ liệu từ tất cả KPI Calculator để phân tích
						const allData = selectedKpiCalculators.reduce((acc, kpi) => {
							if (kpi.tableData && kpi.tableData.length > 0) {
								// Thêm tên KPI vào mỗi bản ghi dữ liệu để AI có thể phân tích theo từng KPI
								acc.push(...kpi.tableData.map(dataItem => ({
									...dataItem, kpiName: kpi.name, kpiId: kpi.id,
								})));
							}
							return acc;
						}, []);

						chartData = allData;
					} else if (item.type === 'chart') {
						await loadChartData(item, true);
						chartData = tableData[item.id];
					}
				} catch (loadError) {
					console.error('Lỗi khi tải dữ liệu:', loadError);
					message.error('Không thể tải dữ liệu. Vui lòng kiểm tra cấu hình.');
					setAnalyzingItems(prev => {
						const newSet = new Set(prev);
						newSet.delete(item.id);
						return newSet;
					});
					return;
				}

				// Kiểm tra lại sau khi tải
				if (!chartData || chartData.length === 0) {
					message.warning('Không có dữ liệu để phân tích. Vui lòng kiểm tra cấu hình và tải dữ liệu trước.');
					setAnalyzingItems(prev => {
						const newSet = new Set(prev);
						newSet.delete(item.id);
						return newSet;
					});
					return;
				}
			}

			// Tạo prompt cho AI với dữ liệu thực tế
			const basePrompt = (customPrompt && item.id !== 100000)
				? customPrompt
				: (item.analysis?.prompt || defaultPrompt || DEFAULT_PROMPT_DASHBOARD || 'Phân tích dữ liệu này và đưa ra nhận xét chi tiết về xu hướng, mẫu và insights quan trọng.');

			// Load context instruction và thêm vào đầu prompt
			const contextInstruction = await loadContextInstruction();
			const contextPrefix = contextInstruction ? `Context Instruction: ${contextInstruction}\n\n` : '';

			// Tạo mô tả dữ liệu
			let dataDescription = '';
			let systemMessage = '';

			if (item.type === 'table') {
				// Cho table type - chỉ phân tích các cột được cấu hình hiển thị
				const displayColumns = item.settings?.displayColumns || [];
				const dateColumn = item.settings?.dateColumn;
				const templateColumns = item.settings?.templateColumns || [];
				const timeThreshold = item.settings?.timeThreshold; // Get timeThreshold

				// Lọc dữ liệu chỉ bao gồm các cột được hiển thị
				let filteredData = chartData;
				if (chartData && chartData.length > 0 && displayColumns.length > 0) {
					filteredData = chartData.map(row => {
						const filteredRow = {};

						// Thêm cột thời gian nếu có
						if (dateColumn && row[dateColumn] !== undefined) {
							filteredRow[dateColumn] = row[dateColumn];
						}

						// Thêm các cột được cấu hình hiển thị
						displayColumns.forEach(columnId => {
							if (row[columnId] !== undefined) {
								filteredRow[columnId] = row[columnId];
							}
						});

						return filteredRow;
					});

					// Filter data by timeThreshold if exists
					if (timeThreshold && dateColumn) {
						const thresholdDate = new Date(timeThreshold);
						filteredData = filteredData.filter(row => {
							const rowDate = new Date(row[dateColumn]);
							return rowDate >= thresholdDate;
						});
					}
				}

				// Tạo danh sách tên cột
				const columnNames = [];
				if (dateColumn) {
					columnNames.push('Thời gian');
				}
				displayColumns.forEach(columnId => {
					const templateColumn = templateColumns.find(col => col.id === columnId);
					const columnName = templateColumn?.columnName || `Cột ${columnId}`;
					columnNames.push(columnName);
				});

				dataDescription = `
Dữ liệu bảng (chỉ các cột được cấu hình hiển thị):
- Các cột được phân tích: ${columnNames.join(', ')}
${timeThreshold ? `- Mốc thời gian phân tích: Từ ${new Date(timeThreshold).toLocaleString('vi-VN')} trở đi` : ''}
- Dữ liệu: ${filteredData && filteredData.length > 0 ? JSON.stringify(filteredData.slice(0, 100), null, 2) : 'Không có dữ liệu'}
`;

				systemMessage = `Bạn là một chuyên gia phân tích dữ liệu. Hãy phân tích dữ liệu bảng được cung cấp và đưa ra nhận xét chi tiết bằng tiếng Việt. 
				Hãy tập trung vào:
				- Cấu trúc và đặc điểm của dữ liệu trong các cột được hiển thị
				- Mẫu và xu hướng trong dữ liệu
				- Insights quan trọng từ dữ liệu
				- Khuyến nghị dựa trên phân tích
				- Hãy đưa ra phân tích ngay, không cần chào hỏi.`;
			} else if (item.type === 'statistics') {
				// Cho statistics type - phân tích các KPI Calculator được chọn
				const kpiCalculatorIds = item.settings?.kpiCalculators || [];
				const selectedKpiCalculators = kpiCalculatorIds.map(id => kpiCalculators.find(k => k.id === id)).filter(Boolean);

				// Tạo mô tả dữ liệu chi tiết cho AI phân tích
				const kpiNames = selectedKpiCalculators.map(k => k.name);
				const totalDataPoints = chartData.length;
				const dateRange = chartData.length > 0 ? {
					start: chartData[0]?.date || 'N/A', end: chartData[chartData.length - 1]?.date || 'N/A',
				} : null;

				dataDescription = `
				Thông tin thống kê:
				- Các KPI Calculator được chọn: ${kpiNames.join(', ')}
				- Số lượng KPI: ${selectedKpiCalculators.length}
				- Tổng số điểm dữ liệu: ${totalDataPoints}
				- Khoảng thời gian: ${dateRange ? `${dateRange.start} đến ${dateRange.end}` : 'Không xác định'}
				
				Dữ liệu chi tiết (bao gồm tên KPI cho mỗi bản ghi):
				${JSON.stringify(chartData, null, 2)}
				`;

				systemMessage = `Bạn là một chuyên gia phân tích dữ liệu tài chính và KPI. Hãy phân tích dữ liệu thống kê từ các KPI Calculator được chọn và đưa ra nhận xét chi tiết bằng tiếng Việt. 

				Hãy tập trung vào:
				- Tổng quan về các KPI được chọn và ý nghĩa của chúng
				- So sánh hiệu suất giữa các KPI khác nhau
				- Xu hướng và mẫu trong dữ liệu theo thời gian
				- Phân tích biến động và ổn định của từng KPI
				- Insights quan trọng từ dữ liệu thống kê
				- Khuyến nghị dựa trên phân tích để cải thiện hiệu suất
				
				Lưu ý: Mỗi bản ghi dữ liệu đều có trường 'kpiName' để bạn có thể phân tích riêng từng KPI.
				Hãy đưa ra phân tích ngay, không cần chào hỏi.`;
			} else {
				// Thêm thông tin cấu hình chart và series từ chartOptions
				const chartConfig = (chartOptions && chartOptions[item.id]) ? chartOptions[item.id] : {};
				const chartTitle = chartConfig?.title?.text || '';
				const chartSubtitle = chartConfig?.subtitle?.text || '';
				const axesInfo = Array.isArray(chartConfig?.axes) ? chartConfig.axes.map(ax => ({
					type: ax.type, position: ax.position, title: ax.title?.text || undefined,
				})) : [];
				const seriesInfo = Array.isArray(chartConfig?.series) ? chartConfig.series.map(ser => ({
					type: ser.type,
					xKey: ser.xKey,
					xName: ser.xName,
					yKey: ser.yKey,
					yName: ser.yName,
					yKeys: ser.yKeys,
					stacked: ser.stacked,
				})) : [];

				// Cấu hình được set trong item.settings
				const itemSettings = item.settings || {};
				const chartType = itemSettings.chartType || itemSettings.type || undefined;
				const timeColumn = itemSettings.timeColumn || itemSettings.dateColumn || undefined;
				const groupColumn = itemSettings.groupColumn || undefined;
				const valueColumn = itemSettings.valueColumn || undefined;
				const displayColumns = itemSettings.displayColumns || undefined;

				dataDescription = `
				Thông tin biểu đồ:
				- Series: ${seriesInfo.length ? JSON.stringify(seriesInfo, null, 2) : 'N/A'}
 				- Chart settings: ${JSON.stringify({
					chartType, timeColumn, groupColumn, valueColumn, displayColumns,
				}, null, 2)}
				
				Dữ liệu:
				${JSON.stringify(chartData, null, 2)}
				`;

				systemMessage = `Bạn là một chuyên gia phân tích dữ liệu. Hãy phân tích dữ liệu được cung cấp và đưa ra nhận xét chi tiết bằng tiếng Việt. 
                Dữ liệu này là biểu đồ từ bảng dữ liệu. Hãy tập trung vào:
                - Xu hướng chính của dữ liệu
                - Mẫu và tương quan giữa các nhóm
                - Insights quan trọng từ dữ liệu
                - Khuyến nghị dựa trên phân tích
                - Hãy đưa ra phân tích ngay, không cần chào hỏi.`;
			}

			const fullPrompt = `${contextPrefix}${basePrompt}\n\n${dataDescription + item?.info?.note}\n\n
				Evaluation & Scoring: Based on the input, provide a holistic score from 0 to 100 by weighing these factors in order of importance:
Market Context: Is the KPI value good, average, or poor for the specified industry? Use your knowledge to find relevant industry standards. This is the most important factor.
Trend Analysis: What is the direction of the trend (positive, negative, stable)? Consider if fluctuations are normal for this industry or a cause for concern. If only one data point exists, state that trend analysis is not possible.
Benchmark Comparison: How does the data perform against the provided benchmark or target?
Required Output Format (Strict JSON): Return only a JSON object.
{
  "score": 0-100,
  "analysis": "<Provide a detailed analysis in Markdown. Start with a 1-sentence executive summary. Then, use bullet points for **Strengths**, **Weaknesses**, and actionable **Recommendations** based on your analysis.>",
  "reasoning_summary": "<Briefly explain how you weighed the market context, trend, and benchmark comparison to arrive at the final score.>"
}
			`;

			// Gọi AI để phân tích với timeout
			console.log('-----------', fullPrompt);
			// Sử dụng AI model được truyền vào hoặc AI model được chọn từ state
			const aiModelToUse = customAIModel || selectedAIModel;
			const response = await Promise.race([aiGen2(fullPrompt, systemMessage, aiModelToUse, 'text'), new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: Phân tích mất quá nhiều thời gian')), 6000000))]);

			console.log('-----------', response);
			if (response && (response.result || response.data || response.content)) {
				// Cập nhật token đã sử dụng
				await updateUsedTokenApp(response, aiModelToUse, 'analysis-review');

				// Lấy kết quả từ response (hỗ trợ nhiều format khác nhau)
				const aiResult = response.result || response.data || response.content || 'Không thể phân tích dữ liệu.';

				// Thử parse JSON để lấy điểm số nếu có
				let score = null;
				let grade = null;
				let analysisText = aiResult;

				const tryParseJson = (text) => {
					try {
						return JSON.parse(text);
					} catch (_) {
						return null;
					}
				};

				let parsedResult = tryParseJson(aiResult);

				// Nếu không parse được, thử bóc code fence ```json ... ```
				if (!parsedResult) {
					const fenceMatch = aiResult.match(/```[a-zA-Z]*\s*([\s\S]*?)```/);
					if (fenceMatch && fenceMatch[1]) {
						parsedResult = tryParseJson(fenceMatch[1]);
					}
				}

				// Nếu vẫn không được, thử cắt theo dấu ngoặc nhọn đầu/cuối
				if (!parsedResult) {
					const firstBrace = aiResult.indexOf('{');
					const lastBrace = aiResult.lastIndexOf('}');
					if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
						parsedResult = tryParseJson(aiResult.substring(firstBrace, lastBrace + 1));
					}
				}

				if (parsedResult && parsedResult.score !== undefined) {
					score = Math.min(100, Math.max(0, parseFloat(parsedResult.score) || 0));
					const gradeInfo = getGradeFromScore(score);
					grade = gradeInfo.grade;
					analysisText = parsedResult.analysis || parsedResult.answer || analysisText;
				} else {
					// Nếu không parse được JSON, thử extract số từ text
					const scoreMatch = aiResult.match(/(\d+)/);
					if (scoreMatch) {
						score = Math.min(100, Math.max(0, parseFloat(scoreMatch[1])));
						const gradeInfo = getGradeFromScore(score);
						grade = gradeInfo.grade;
					}
				}

				// Cập nhật item với kết quả phân tích
				const updatedItem = {
					...item, analysis: {
						...item.analysis,
						answer: analysisText,
						prompt: basePrompt,
						score: score,
						grade: grade,
					},
				};

				// Cập nhật database
				await updateDashBoardItem(updatedItem);

				// Cập nhật state local
				setDashboardItems(prev => prev.map(dashboardItem => dashboardItem.id === item.id ? updatedItem : dashboardItem));

				message.success(isReanalyzing ? 'Phân tích lại hoàn thành!' : 'Phân tích hoàn thành!');
			} else {
				message.error('Không thể phân tích dữ liệu. Vui lòng thử lại.');
			}

		} catch (error) {
			console.error('Lỗi khi phân tích với AI:', error);

			// Xử lý các loại lỗi khác nhau
			if (error.response) {
				// Lỗi từ server
				message.error(`Lỗi server: ${error.response.data?.message || 'Không thể kết nối đến AI service'}`);
			} else if (error.request) {
				// Lỗi network
				message.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.');
			} else if (error.message) {
				// Lỗi khác
				message.error(`Lỗi: ${error.message}`);
			} else {
				message.error('Có lỗi xảy ra khi phân tích. Vui lòng thử lại.');
			}
		} finally {
			// Kết thúc phân tích
			setAnalyzingItems(prev => {
				const newSet = new Set(prev);
				newSet.delete(item.id);
				return newSet;
			});
		}
	};

	const handleAnalyzeAll = async () => {
		try {
			// Lấy danh sách items có thể phân tích
			const analyzableItems = dashboardItems.filter(item => {
				// Kiểm tra quyền truy cập
				if (!canAccessDashboardItem(item)) return false;

				// Kiểm tra loại được hỗ trợ
				const supportedTypes = ['table_chart', 'table_chart_2', 'table', 'comparison', 'chart', 'statistics'];
				if (!supportedTypes.includes(item.type)) return false;

				// Kiểm tra quyền chỉnh sửa
				const canEdit = currentUser?.role === 'admin' ||
					(item.userClasses && item.userClasses.length > 0 && item.userClasses.some(userClass =>
						currentUserClasses.some(currentClass => currentClass.id === userClass.id),
					)) ||
					(!item.userClasses || item.userClasses.length === 0);

				return canEdit;
			});

			if (analyzableItems.length === 0) {
				message.warning('Không có item nào có thể phân tích');
				return;
			}

			// Bắt đầu phân tích tất cả
			setIsAnalyzingAll(true);
			setAnalyzeAllProgress({ current: 0, total: analyzableItems.length });

			message.loading({
				content: (
					<div style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
						<div style={{ fontWeight: 'bold' }}>
							Bắt đầu phân tích {analyzableItems.length} items...
						</div>
					</div>
				),
				key: 'analyze-all',
				duration: 0,
			});

			// Phân tích từng item một cách tuần tự
			for (let i = 0; i < analyzableItems.length; i++) {
				const item = analyzableItems[i];

				// Cập nhật tiến độ
				setAnalyzeAllProgress({ current: i + 1, total: analyzableItems.length });

				message.loading({
					content: (
						<div style={{ maxWidth: '400px', wordWrap: 'break-word' }}>
							<div style={{ fontWeight: 'bold', marginBottom: '4px', textAlign: 'left' }}>
								Đang phân tích {i + 1}/{analyzableItems.length}: {item.name}
							</div>
							<div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4', textAlign: 'left' }}>
								Làm mới toàn bộ phân tích có thể mất từ 3-5 phút, trong thời gian này bạn có thể tiếp
								tục xem và sử dụng mục Dashboard nhưng không chuyển sang tab chức năng khác (Data/ Xây
								chỉ số)
							</div>
						</div>
					),
					key: 'analyze-all',
					duration: 0,
				});

				try {
					// Khi chạy all: dùng promptSettingValue cho tất cả phần tử bình thường
					// Phần tử tổng quan (id === 100000) giữ nguyên như cũ
					const promptForAll = analyzeAllPrompt && typeof analyzeAllPrompt === 'string' && analyzeAllPrompt.trim().length > 0
						? analyzeAllPrompt
						: (promptSettingValue && promptSettingValue.trim() ? promptSettingValue : (defaultPrompt || DEFAULT_PROMPT_DASHBOARD));
					const aiModelForAll = analyzeAllModel && analyzeAllModel.trim() ? analyzeAllModel : null;
					await handleAnalyzeWithAI(item, aiModelForAll, promptForAll);
					// Thêm delay nhỏ để tránh quá tải server
					await new Promise(resolve => setTimeout(resolve, 1000));
				} catch (error) {
					console.error(`Lỗi khi phân tích item ${item.title}:`, error);
					// Tiếp tục với item tiếp theo thay vì dừng lại
				}
			}

			message.success({
				content: `Hoàn thành phân tích ${analyzableItems.length} items`,
				key: 'analyze-all',
				duration: 3,
			});

			// Gọi handleSaveConfig từ DefaultDashboardCard sau khi hoàn thành phân tích tất cả items
			if (defaultDashboardCardRef.current && defaultDashboardCardRef.current.handleSaveConfig) {
				try {
					message.loading({
						content: 'Đang cập nhật dashboard tổng quan...',
						key: 'update-dashboard',
						duration: 0,
					});

					// Lưu thời gian phân tích cuối cùng vào default dashboard item
					await defaultDashboardCardRef.current.handleSaveConfig();

					// Cập nhật thời gian phân tích cuối cùng
					await defaultDashboardCardRef.current.updateLastAnalyzeTime();

					// Cập nhật state local
					const currentTime = new Date().toISOString();
					setLastAnalyzeTime(currentTime);

					message.success({
						content: 'Cập nhật dashboard tổng quan thành công',
						key: 'update-dashboard',
						duration: 3,
					});
				} catch (error) {
					console.error('Error updating default dashboard:', error);
					message.error({
						content: 'Có lỗi khi cập nhật dashboard tổng quan',
						key: 'update-dashboard',
						duration: 3,
					});
				}
			}

		} catch (error) {
			console.error('Lỗi khi phân tích tất cả items:', error);
			message.error({
				content: 'Có lỗi xảy ra khi phân tích tất cả items',
				key: 'analyze-all',
				duration: 3,
			});
		} finally {
			setIsAnalyzingAll(false);
			setAnalyzeAllProgress({ current: 0, total: 0 });

			// Cập nhật thời gian phân tích tiếp theo nếu auto-analyze đang bật
			if (isAutoAnalyzeEnabled) {
				const nextTime = new Date();
				nextTime.setHours(nextTime.getHours() + 6);
				setNextAutoAnalyzeTime(nextTime);
			}
		}
	};

	const handleAnalyzeAllWithConfirm = () => {
		// Mở modal cấu hình phân tích tất cả
		setAnalyzeAllPrompt(promptSettingValue && promptSettingValue.trim() ? promptSettingValue : (defaultPrompt || DEFAULT_PROMPT_DASHBOARD || ''));
		setAnalyzeAllModel(selectedAIModel);
		setShowAnalyzeAllModal(true);
	};

	// Auto-analyze functions
	const startAutoAnalyze = () => {
		if (autoAnalyzeIntervalId) {
			clearInterval(autoAnalyzeIntervalId);
		}

		const intervalId = setInterval(() => {
			// Chỉ chạy nếu không đang phân tích
			if (!isAnalyzingAll) {
				handleAnalyzeAll();
			}
		}, 360 * 60 * 1000);

		setAutoAnalyzeIntervalId(intervalId);
		setIsAutoAnalyzeEnabled(true);

		// Cập nhật thời gian phân tích tiếp theo
		const nextTime = new Date();
		nextTime.setHours(nextTime.getHours() + 6);
		setNextAutoAnalyzeTime(nextTime);

		message.success({
			content: 'Đã bật tự động phân tích mỗi 6h',
			duration: 3,
		});
	};

	const stopAutoAnalyze = () => {
		if (autoAnalyzeIntervalId) {
			clearInterval(autoAnalyzeIntervalId);
			setAutoAnalyzeIntervalId(null);
		}
		setIsAutoAnalyzeEnabled(false);
		setNextAutoAnalyzeTime(null);

		message.info({
			content: 'Đã tắt tự động phân tích',
			duration: 3,
		});
	};

	const toggleAutoAnalyze = () => {
		if (isAutoAnalyzeEnabled) {
			stopAutoAnalyze();
		} else {
			startAutoAnalyze();
		}
	};

	const getDateRangeFromOption = (option) => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		switch (option) {
			case 'today':
				return [today, today];
			case 'yesterday':
				const yesterday = new Date(today);
				yesterday.setDate(yesterday.getDate() - 1);
				return [yesterday, yesterday];
			case 'thisWeek':
				const startOfWeek = new Date(today);
				startOfWeek.setDate(today.getDate() - today.getDay());
				return [startOfWeek, today];
			case 'lastWeek':
				const lastWeekStart = new Date(today);
				lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
				const lastWeekEnd = new Date(lastWeekStart);
				lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
				return [lastWeekStart, lastWeekEnd];
			case 'thisMonth':
				const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
				return [startOfMonth, today];
			case 'lastMonth':
				const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
				const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
				return [lastMonthStart, lastMonthEnd];
			case 'last7Days':
				const last7Days = new Date(today);
				last7Days.setDate(today.getDate() - 7);
				return [last7Days, today];
			case 'last15Days':
				const last15Days = new Date(today);
				last15Days.setDate(today.getDate() - 15);
				return [last15Days, today];
			case 'last30Days':
				const last30Days = new Date(today);
				last30Days.setDate(today.getDate() - 30);
				return [last30Days, today];
			case 'last90Days':
				const last90Days = new Date(today);
				last90Days.setDate(today.getDate() - 90);
				return [last90Days, today];
			case 'thisYear':
				const startOfYear = new Date(today.getFullYear(), 0, 1);
				return [startOfYear, today];
			case 'lastYear':
				const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
				const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
				return [lastYearStart, lastYearEnd];
			default:
				return [null, null]; // 'all' - không filter
		}
	};

	const handleApprovedVersionChange = async (approveVersionId) => {
		try {
			setLoading(true);
			setSelectedApprovedVersion(approveVersionId);

			// 1. Lấy approveVersion data
			const selectedVersion = approvedVersions.find(version => version.id == approveVersionId);

			if (!selectedVersion) {
				setTemplateColumns([]);
				return;
			}

			const templateId = selectedVersion.id_template;

			if (!templateId) {
				console.error('No template_id found in approveVersion');
				setTemplateColumns([]);
				return;
			}

			const templateTable = await getTableByid(templateId);
			if (!templateTable) {
				console.error('Template table not found');
				setTemplateColumns([]);
				return;
			}

			// 3. Lấy version_id để tìm step cụ thể trong steps của templateTable
			const versionId = selectedVersion.id_version;
			let columns = [];

			if (templateTable.steps && templateTable.steps.length > 0) {
				// Tìm step có id_step trùng với version_id
				const targetStep = templateTable.steps.find(step => step.id === versionId);

				if (targetStep && targetStep.config.outputColumns) {
					columns = targetStep.config.outputColumns.map((column, index) => ({
						id: column.name || column, columnName: column.name || column,
					}));
				} else {
					// Fallback: lấy step cuối cùng nếu không tìm thấy step cụ thể
					const lastStep = templateTable.steps[templateTable.steps.length - 1];
					if (lastStep && lastStep.outputColumns) {
						columns = lastStep.outputColumns.map((column, index) => ({
							id: column.name || column, columnName: column.name || column,
						}));
					}
				}
			}

			if (templateTable.isCombine) {
				let dataCombine = await loadAndMergeData(templateTable);
				const fields = Object.keys(dataCombine[0]);
				columns = fields.map((columnName, index) => ({
					id: columnName, columnName,
				}));
			}

			setTemplateColumns(columns);
		} catch (error) {
			console.error('Error fetching template columns:', error);
			setTemplateColumns([]);
		} finally {
			setLoading(false);
		}
	};
	const handleEditApprovedVersionChange = async (approveVersionId) => {
		try {
			setLoading(true);
			setEditSelectedApprovedVersion(approveVersionId);

			// 1. Lấy approveVersion data
			const selectedVersion = approvedVersions.find(version => version.id == approveVersionId);

			if (!selectedVersion) {
				setEditTemplateColumns([]);
				return;
			}

			const templateId = selectedVersion.id_template;

			if (!templateId) {
				console.error('No template_id found in approveVersion');
				setEditTemplateColumns([]);
				return;
			}

			const templateTable = await getTableByid(templateId);
			if (!templateTable) {
				console.error('Template table not found');
				setEditTemplateColumns([]);
				return;
			}

			let columns = [];
			let sampleData = []; // Added to fetch actual data keys

			if (templateTable.isCombine) {
				sampleData = await loadAndMergeData(templateTable);
			} else {
				// For regular tables, get data from the specific step
				const versionId = selectedVersion.id_version;
				const targetStep = templateTable.steps?.find(step => step.id === versionId);

				if (targetStep && targetStep.data) {
					sampleData = targetStep.data;
				} else {
					// Fallback to last step data
					const lastStep = templateTable.steps?.[templateTable.steps.length - 1];
					if (lastStep && lastStep.data) {
						sampleData = lastStep.data;
					}
				}
			}

			if (sampleData.length > 0) {
				const fields = Object.keys(sampleData[0]);
				columns = fields.map((columnName) => ({
					id: columnName, // Use actual data key as id
					columnName: columnName, // Use actual data key as display name initially
				}));
			} else {
				// Fallback to existing logic if no sample data
				if (templateTable.steps && templateTable.steps.length > 0) {
					const versionId = selectedVersion.id_version;
					const targetStep = templateTable.steps.find(step => step.id === versionId);
					if (targetStep && targetStep.config.outputColumns) {
						columns = targetStep.config.outputColumns.map((column) => ({
							id: column.name || column, columnName: column.name || column,
						}));
					} else {
						const lastStep = templateTable.steps[templateTable.steps.length - 1];
						if (lastStep && lastStep.outputColumns) {
							columns = lastStep.outputColumns.map((column) => ({
								id: column.name || column, columnName: column.name || column,
							}));
						}
					}
				}
			}

			setEditTemplateColumns(columns);
			setEditSelectedColumns({ column1: '', column2: '' });
		} catch (error) {
			console.error('Error loading edit template columns:', error);
			setEditTemplateColumns([]);
		} finally {
			setLoading(false);
		}
	};

	// Function to auto-create column settings when display columns change
	const handleTableDisplayColumnsChange = (values) => {
		setEditTableDisplayColumns(values);

		// Auto-create column settings for new columns
		const newColumnSettings = { ...editTableColumnSettings };
		const newCollapsedState = { ...collapsedColumns };

		values.forEach(columnId => {
			if (!newColumnSettings[columnId]) {
				// Check if it's a date column
				const isDateColumn = editTemplateColumns.find(col => col.id === columnId)?.columnName.toLowerCase().includes('ngày') || editTemplateColumns.find(col => col.id === columnId)?.columnName.toLowerCase().includes('date') || editTemplateColumns.find(col => col.id === columnId)?.columnName.toLowerCase().includes('time') || editTemplateColumns.find(col => col.id === columnId)?.columnName.toLowerCase().includes('thời gian');

				newColumnSettings[columnId] = {
					type: isDateColumn ? 'date' : 'text', dateFormat: 'DD/MM/YY', valueFormat: {
						showThousands: false,
						showMillions: false,
						showPercentage: false,
						decimalPlaces: 0,
						negativeRed: false,
					},
				};
			}
			// Đặt mặc định là collapsed
			newCollapsedState[columnId] = true;
		});

		// Remove settings for unselected columns
		Object.keys(newColumnSettings).forEach(columnId => {
			if (!values.includes(columnId)) {
				delete newColumnSettings[columnId];
				delete newCollapsedState[columnId];
			}
		});

		setEditTableColumnSettings(newColumnSettings);
		setCollapsedColumns(newCollapsedState);
	};

	// Functions to handle KPI2Calculator data
	const convertPeriodData = (kpiData, targetPeriod) => {
		if (!kpiData || !kpiData.tableData) {
			console.warn('No tableData found in kpiData:', kpiData);
			return [];
		}

		const { period: sourcePeriod, tableData } = kpiData;

		// Kiểm tra tableData có phải là array không
		if (!Array.isArray(tableData)) {
			console.warn('tableData is not an array:', tableData);
			return [];
		}

		if (sourcePeriod === targetPeriod) {
			return tableData;
		}

		const periodConversions = {
			weekToDay: (data) => {
				const result = [];
				if (!Array.isArray(data)) return result;

				data.forEach((item) => {
					if (!item || !item.date) return;

					const matches = item.date.match(/Tuần (\d+)\/(\d+)/);
					if (!matches) return;

					const weekNum = parseInt(matches[1]);
					const year = parseInt(matches[2]);
					const firstDayOfWeek = getFirstDayOfWeek(weekNum, year);
					const dailyValue = item.value / 7;

					for (let i = 0; i < 7; i++) {
						const currentDate = new Date(firstDayOfWeek);
						currentDate.setDate(firstDayOfWeek.getDate() + i);
						result.push({
							date: formatDate(currentDate), value: dailyValue,
						});
					}
				});
				return result;
			},

			monthToDay: (data) => {
				const result = [];
				if (!Array.isArray(data)) return result;

				data.forEach((item) => {
					if (!item || !item.date) return;

					const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
					if (!matches) return;

					const monthNum = parseInt(matches[1]);
					const year = parseInt(matches[2]);
					const daysInMonth = getDaysInMonth(monthNum - 1, year);
					const dailyValue = item.value / daysInMonth;

					for (let i = 0; i < daysInMonth; i++) {
						const currentDate = new Date(year, monthNum - 1, i + 1);
						result.push({
							date: formatDate(currentDate), value: dailyValue,
						});
					}
				});
				return result;
			},

			monthToWeek: (data) => {
				const result = [];
				if (!Array.isArray(data)) return result;

				data.forEach((item) => {
					if (!item || !item.date) return;

					const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
					if (!matches) return;

					const monthNum = parseInt(matches[1]);
					const year = parseInt(matches[2]);
					const weeksInMonth = 4;
					const weeklyValue = item.value / weeksInMonth;
					const weekNumbers = getWeeksInMonth(monthNum - 1, year);

					weekNumbers.forEach((weekNum) => {
						result.push({
							date: `Tuần ${weekNum}/${year}`, value: weeklyValue,
						});
					});
				});
				return result;
			},

			dayToWeek: (data) => {
				const weekMap = new Map();
				if (!Array.isArray(data)) return [];

				data.forEach((item) => {
					if (!item || !item.date) return;

					const [day, month, year] = item.date.split('/').map(Number);
					const weekNum = getWeekNumber(new Date(year, month - 1, day));
					const weekKey = `Tuần ${weekNum}/${year}`;

					if (weekMap.has(weekKey)) {
						weekMap.set(weekKey, weekMap.get(weekKey) + item.value);
					} else {
						weekMap.set(weekKey, item.value);
					}
				});

				return Array.from(weekMap.entries()).map(([date, value]) => ({
					date, value,
				}));
			},

			dayToMonth: (data) => {
				const monthMap = new Map();
				if (!Array.isArray(data)) return [];

				data.forEach((item) => {
					if (!item || !item.date) return;

					const [day, month, year] = item.date.split('/').map(Number);
					const monthKey = `Tháng ${month}/${year}`;

					if (monthMap.has(monthKey)) {
						monthMap.set(monthKey, monthMap.get(monthKey) + item.value);
					} else {
						monthMap.set(monthKey, item.value);
					}
				});

				return Array.from(monthMap.entries()).map(([date, value]) => ({
					date, value,
				}));
			},

			weekToMonth: (data) => {
				const monthMap = new Map();
				if (!Array.isArray(data)) return [];

				data.forEach((item) => {
					if (!item || !item.date) return;

					const matches = item.date.match(/Tuần (\d+)\/(\d+)/);
					if (!matches) return;

					const weekNum = parseInt(matches[1]);
					const year = parseInt(matches[2]);
					const monthNum = Math.ceil(weekNum / 4);
					const monthKey = `Tháng ${monthNum}/${year}`;

					if (monthMap.has(monthKey)) {
						monthMap.set(monthKey, monthMap.get(monthKey) + item.value);
					} else {
						monthMap.set(monthKey, item.value);
					}
				});

				return Array.from(monthMap.entries()).map(([date, value]) => ({
					date, value,
				}));
			},
		};

		function formatDate(date) {
			return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
		}

		function getDaysInMonth(month, year) {
			return new Date(year, month + 1, 0).getDate();
		}

		function getFirstDayOfWeek(weekNum, year) {
			const firstDayOfYear = new Date(year, 0, 1);
			const daysToAdd = (weekNum - 1) * 7;
			const firstDayOfWeek = new Date(firstDayOfYear);
			firstDayOfWeek.setDate(firstDayOfYear.getDate() + daysToAdd);
			return firstDayOfWeek;
		}

		function getWeekNumber(date) {
			const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
			const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
			return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
		}

		function getWeeksInMonth(month, year) {
			const firstDayOfMonth = new Date(year, month, 1);
			const lastDayOfMonth = new Date(year, month + 1, 0);
			const firstWeek = getWeekNumber(firstDayOfMonth);
			const lastWeek = getWeekNumber(lastDayOfMonth);
			const weeks = [];
			for (let i = firstWeek; i <= lastWeek; i++) {
				weeks.push(i);
			}
			return weeks;
		}

		const conversionKey = `${sourcePeriod}To${targetPeriod.charAt(0).toUpperCase() + targetPeriod.slice(1)}`;

		if (periodConversions[conversionKey]) {
			return periodConversions[conversionKey](tableData);
		} else {
			console.error(`Conversion from ${sourcePeriod} to ${targetPeriod} is not supported`);
			return tableData; // Return original data if conversion is not supported
		}
	};

	const loadChartData = async (dashboardItem) => {
		if (dashboardItem.type !== 'chart' || !dashboardItem.idData) return;

		try {
			setLoading(true);
			const [kpi, listKpiGoc, listTable, listFileNote] = await Promise.all([getKpi2CalculatorById(dashboardItem.idData), getAllKpiCalculator(), getAllTemplateTables(), getAllFileNotePad()]);

			if (!kpi) {
				message.error('Không tìm thấy dữ liệu KPI');
				return;
			}

			let fills = await getSettingByType('SettingColor');
			fills = fills.setting.map(item => item.color);
			const rawDataByVariable = {};
			const currentYear = new Date().getFullYear();

			// Parse calc data from KPI
			let formula = '';
			let variables = {};
			if (kpi.calc) {
				try {
					const calcData = typeof kpi.calc === 'string' ? JSON.parse(kpi.calc) : kpi.calc;
					formula = calcData.formula || '';
					variables = calcData.variables || {};
				} catch (error) {
					console.error('Error parsing calc data:', error);
					formula = '';
					variables = {};
				}
			}

			// Get the target period from KPI configuration
			const targetPeriod = kpi.period || 'month';

			// Process KPI list
			const kpiList = Array.isArray(kpi.kpiList) ? kpi.kpiList : [];

			for (const kpiId of kpiList) {
				const kpiData = await getKpiCalculatorById(kpiId);

				if (kpiData && kpiData.period && kpiData.tableData) {
					const convertedData = convertPeriodData(kpiData, targetPeriod);

					const variableKey = Object.keys(variables).find((key) => variables[key].type === 'kpi' && variables[key].id == kpiId);

					if (variableKey) {
						rawDataByVariable[variableKey] = convertedData;
					} else {
					}
				} else {
				}
			}

			// Process variable list - using the varList directly from kpi
			const varList = Array.isArray(kpi.varList) ? kpi.varList : [];
			for (const varData of varList) {
				if (varData) {
					let convertedData;
					if (varData.t1 !== undefined || varData.t2 !== undefined) {
						convertedData = convertVariableData(varData, targetPeriod, currentYear);
					} else if (varData.period && varData.tableData) {
						convertedData = convertPeriodData(varData, targetPeriod);
					}

					if (convertedData) {
						const variableKey = Object.keys(variables).find((key) => variables[key].type === 'var' && variables[key].id === varData.code);
						if (variableKey) {
							rawDataByVariable[variableKey] = convertedData;
						}
					}
				}
			}

			// Create chart data
			const allDates = new Set();
			Object.values(rawDataByVariable).forEach((dataArray) => dataArray.forEach((item) => allDates.add(item.date)));

			const sortedDates = Array.from(allDates).sort((a, b) => {
				if (a.startsWith('Tuần') && b.startsWith('Tuần')) {
					const [aWeek, aYear] = a.replace('Tuần ', '').split('/').map(Number);
					const [bWeek, bYear] = b.replace('Tuần ', '').split('/').map(Number);
					return aYear !== bYear ? aYear - bYear : aWeek - bWeek;
				} else if (a.startsWith('Tháng') && b.startsWith('Tháng')) {
					const [aMonth, aYear] = a.replace('Tháng ', '').split('/').map(Number);
					const [bMonth, bYear] = b.replace('Tháng ', '').split('/').map(Number);
					return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
				} else if (a.includes('/') && b.includes('/') && a.split('/').length == 3 && b.split('/').length == 3) {
					const [aDay, aMonth, aYear] = a.split('/').map(Number);
					const [bDay, bMonth, bYear] = b.split('/').map(Number);
					if (aYear !== bYear) return aYear - bYear;
					if (aMonth !== bMonth) return aMonth - bMonth;
					return aDay - bDay;
				}
				return a.localeCompare(b);
			});

			const result = sortedDates.map((date) => {
				const row = { date };
				Object.keys(variables).forEach((varKey) => {
					if (rawDataByVariable[varKey]) {
						const dataPoint = rawDataByVariable[varKey].find((item) => item.date === date);
						row[varKey] = dataPoint ? dataPoint.value : 0;
					} else {
						row[varKey] = 0;
					}
				});
				row.value = evaluate(formula, row);
				return row;
			});

			// Create chart options - get view type from state, settings, or default to 'line'
			const currentViewType = chartViewTypes[dashboardItem.id] || dashboardItem.settings?.chartViewType || 'line';
			const series = [createSeries('date', 'value', kpi.name, currentViewType, fills[0], false, false, false, true)];
			// Kiểm tra và thêm benchmark series
			const hasBenchmark1 = kpi.benchmark1_name && kpi.benchmark1_name.trim() !== '' && Object.values(kpi.benchmark || {}).some(item => item.benchmark1 !== undefined && item.benchmark1 !== null);
			const hasBenchmark2 = kpi.benchmark2_name && kpi.benchmark2_name.trim() !== '' && Object.values(kpi.benchmark || {}).some(item => item.benchmark2 !== undefined && item.benchmark2 !== null);
			const hasBenchmark3 = (kpi.benchmark3_name && kpi.benchmark3_name.trim() !== '') || Object.values(kpi.benchmark || {}).some(item => item.benchmark3 !== undefined && item.benchmark3 !== null && item.benchmark3 !== '');

			if (hasBenchmark1) {
				series.push(createSeries('date', 'benchmark1', kpi.benchmark1_name, currentViewType, fills[1], false, false, true, true));
			}
			if (hasBenchmark2) {
				series.push(createSeries('date', 'benchmark2', kpi.benchmark2_name, currentViewType, fills[2], false, false, true, true));
			}
			if (hasBenchmark3) {
				const color = fills[3] || '#9467bd';
				const b3Name = (kpi?.benchmark && typeof kpi.benchmark.__benchmark3_name === 'string' && kpi.benchmark.__benchmark3_name.trim() !== '')
					? kpi.benchmark.__benchmark3_name
					: (kpi?.benchmark3_name && kpi.benchmark3_name.trim() !== '' ? kpi.benchmark3_name : 'Market Benchmark');
				series.push(createSeries('date', 'benchmark3', b3Name, currentViewType, color, false, false, true, true));
			}

			const chartData = result.map(item => ({
				date: item.date,
				value: item.value || NaN,
				benchmark1: parseFloat(kpi.benchmark?.[item.date]?.benchmark1) || NaN,
				benchmark2: parseFloat(kpi.benchmark?.[item.date]?.benchmark2) || NaN,
				benchmark3: kpi.benchmark?.[item.date]?.benchmark3 === '' || kpi.benchmark?.[item.date]?.benchmark3 === undefined || kpi.benchmark?.[item.date]?.benchmark3 === null ? NaN : parseFloat(kpi.benchmark?.[item.date]?.benchmark3),

			}));

			// Apply recent periods filter if specified
			let finalChartData = chartData;
			const recentPeriods = dashboardItem.settings?.recentPeriods || 0;
			if (recentPeriods > 0 && chartData.length > 0) {
				// For chart type: filter out NaN values first, then take last N periods
				const validData = chartData.filter(item => !isNaN(item.value));
				if (validData.length > recentPeriods) {
					finalChartData = validData.slice(-recentPeriods);
				} else {
					finalChartData = validData;
				}
			}
			// If no data was generated, create demo data
			if (chartData.length === 0) {
				let demoData = [];

				if (targetPeriod === 'week') {
					demoData = [
						{
							date: 'Tuần 1/2024',
							value: 15000,
							benchmark1: 14000,
							benchmark2: 16000,
						},
					]
					;
				} else if (targetPeriod === 'day') {
					demoData = [{
						date: '01/01/2024',
						value: 1500,
						benchmark1: 14000,
						benchmark2: 16000,
					}];
				} else {
					// Default to month
					demoData = [{
						date: 'Tháng 1/2024',
						value: 15000,
						benchmark1: 14000,
						benchmark2: 16000,
					}];
				}
				finalChartData = demoData;

				// Thêm benchmark series cho demo data nếu chưa có
				if (!hasBenchmark1 && !hasBenchmark2 && !hasBenchmark3) {
					// Thêm demo benchmark series
					series.push(createSeries('date', 'benchmark1', 'Benchmark 1', currentViewType, fills[1]));
					series.push(createSeries('date', 'benchmark2', 'Benchmark 2', currentViewType, fills[2]));
					series.push(createSeries('date', 'benchmark3', 'Benchmark 3', currentViewType, fills[3] || '#9467bd'));
				}
			}

			const chartOption = createSectionData('', finalChartData, series, '');
			setChartOptions(prev => ({ ...prev, [dashboardItem.id]: chartOption }));
			setTableData(prev => ({ ...prev, [dashboardItem.id]: finalChartData }));

		} catch (error) {
			console.error('Error loading chart data:', error);
			message.error('Lỗi khi tải dữ liệu biểu đồ');
		} finally {
			setLoading(false);
		}
	};

	const loadTopData = async (dashboardItem, retry = false) => {
		if (dashboardItem.type !== 'top' || !dashboardItem.idData) return;

		let versions = approvedVersions;
		if (!versions || versions.length === 0) {
			// Gọi lại API và lấy kết quả trả về
			versions = await loadApprovedVersions();
			if (!versions || versions.length === 0) {
				message.warning('Dữ liệu Approved Version chưa sẵn sàng, vui lòng thử lại sau.');
				return;
			}
		}

		try {
			setLoading(true);

			// Đảm bảo so sánh kiểu dữ liệu chính xác
			const selectedVersion = versions.find(version => String(version.id) === String(dashboardItem.idData));

			if (!selectedVersion) {
				message.error('Không tìm thấy Approved Version');
				return;
			}

			const templateId = selectedVersion.id_template;
			const versionId = selectedVersion.id_version;

			if (!templateId) {
				message.error('Không tìm thấy Template ID');
				return;
			}

			const templateTable = await getTableByid(templateId);
			if (!templateTable) {
				message.error('Không tìm thấy Template Table');
				return;
			}

			let data = [];

			if (templateTable.isCombine) {
				data = await loadAndMergeData(templateTable);
			} else {
				try {
					const all = await getAllTemplateRowsWithProgress(
						templateId,
						versionId,
						{
							pageSize: 5000,
							onProgress: ({ fetched, total, percent }) => {
								message.loading({
									content: `Đang tải dữ liệu (${fetched}/${total}) - ${percent}%`,
									key: 'load_all_rows_top',
									duration: 0,
								});
							},
						},
					);
					message.destroy('load_all_rows_top');
					data = all.rows;
				} catch (cacheError) {
					console.error('Error getting template row with cache:', cacheError);
					// Fallback to original getTemplateRow
					try {
						const rowsResponse = await getTemplateRow(templateId, versionId);
						const rows = rowsResponse.rows || [];
						data = Object.values(rows).map((row) => row.data);
					} catch (fallbackError) {
						console.error('Fallback getTemplateRow also failed:', fallbackError);
					}
				}
			}

			if (!data || data.length === 0) {
				message.error('Không có dữ liệu');
				return;
			}

			// Get settings
			const settings = dashboardItem.settings || {};
			const column1 = settings.column1;
			const column2 = settings.column2;
			const topN = settings.topN || 5;

			if (!column1 || !column2) {
				message.error('Thiếu cấu hình cột');
				return;
			}

			// Sort by column2 (value column) - show all data, not just top N
			const sortedData = data
				.filter(item => item[column2] !== undefined && item[column2] !== null)
				.sort((a, b) => {
					const aVal = typeof a[column2] === 'number' ? a[column2] : parseFloat(a[column2]) || 0;
					const bVal = typeof b[column2] === 'number' ? b[column2] : parseFloat(b[column2]) || 0;
					return bVal - aVal; // Descending order
				})
				.map((item, index) => ({
					rank: index + 1,
					name: item[column1] || 'N/A',
					value: item[column2] || 0,
					percentage: data.length > 0 ? ((item[column2] || 0) / Math.max(...data.map(d => d[column2] || 0))) * 100 : 0,
				}));

			setTableData(prev => ({ ...prev, [dashboardItem.id]: sortedData }));

		} catch (error) {
			console.error('Error loading top data:', error);
			message.error('Lỗi khi tải dữ liệu Top');
		} finally {
			setLoading(false);
		}
	};

	const loadComparisonData = async (dashboardItem, retry = false) => {

		if (dashboardItem.type !== 'comparison' || !dashboardItem.settings?.kpis || dashboardItem.settings.kpis.length < 2) {
			return;
		}

		try {
			setLoading(true);

			// Lấy thông tin tất cả KPI
			const kpiPromises = dashboardItem.settings.kpis.map(kpiId => getKpi2CalculatorById(kpiId));
			const kpis = await Promise.all(kpiPromises);

			if (kpis.some(kpi => !kpi)) {
				message.error('Không tìm thấy một hoặc nhiều KPI');
				return;
			}

			// Use chartColors state instead of fetching from API
			const fills = chartColors.length > 0 ? chartColors : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

			// Hàm helper để xử lý một KPI
			const processKpiData = async (kpi) => {
				try {
					const rawDataByVariable = {};
					const currentYear = new Date().getFullYear();

					// Parse calc data from KPI
					let formula = '';
					let variables = {};
					if (kpi.calc) {
						try {
							const calcData = typeof kpi.calc === 'string' ? JSON.parse(kpi.calc) : kpi.calc;
							formula = calcData.formula || '';
							variables = calcData.variables || {};
						} catch (error) {
							console.error('Error parsing calc data:', error);
							formula = '';
							variables = {};
						}
					}

					// Get the target period from KPI configuration
					const targetPeriod = kpi.period || 'month';

					// Process KPI list
					const kpiList = Array.isArray(kpi.kpiList) ? kpi.kpiList : [];

					for (const kpiId of kpiList) {
						const kpiData = await getKpiCalculatorById(kpiId);

						if (kpiData && kpiData.period && kpiData.tableData) {
							const convertedData = convertPeriodData(kpiData, targetPeriod);

							const variableKey = Object.keys(variables).find((key) => variables[key].type === 'kpi' && variables[key].id == kpiId);

							if (variableKey) {
								rawDataByVariable[variableKey] = convertedData;
							}
						}
					}

					// Process variable list
					const varList = Array.isArray(kpi.varList) ? kpi.varList : [];

					for (const varData of varList) {
						if (varData) {
							let convertedData;
							if (varData.t1 !== undefined || varData.t2 !== undefined) {
								convertedData = convertVariableData(varData, targetPeriod, currentYear);
							} else if (varData.period && varData.tableData) {
								convertedData = convertPeriodData(varData, targetPeriod);
							}

							if (convertedData) {
								const variableKey = Object.keys(variables).find((key) => variables[key].type === 'var' && variables[key].id === varData.code);
								if (variableKey) {
									rawDataByVariable[variableKey] = convertedData;
								}
							}
						}
					}

					// Nếu không có dữ liệu raw, tạo dữ liệu demo
					if (Object.keys(rawDataByVariable).length === 0) {
						const demoData = [{ date: 'Tháng 1/2024', value: 15000 }, {
							date: 'Tháng 2/2024',
							value: 1800000,
						}, { date: 'Tháng 3/2024', value: 2200000 }, { date: 'Tháng 4/2024', value: 25000 }];
						return demoData;
					}

					// Create chart data
					const allDates = new Set();
					Object.values(rawDataByVariable).forEach((dataArray) => dataArray.forEach((item) => allDates.add(item.date)));

					const sortedDates = Array.from(allDates).sort((a, b) => {
						if (a.startsWith('Tuần') && b.startsWith('Tuần')) {
							const [aWeek, aYear] = a.replace('Tuần ', '').split('/').map(Number);
							const [bWeek, bYear] = b.replace('Tuần ', '').split('/').map(Number);
							return aYear !== bYear ? aYear - bYear : aWeek - bWeek;
						} else if (a.startsWith('Tháng') && b.startsWith('Tháng')) {
							const [aMonth, aYear] = a.replace('Tháng ', '').split('/').map(Number);
							const [bMonth, bYear] = b.replace('Tháng ', '').split('/').map(Number);
							return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
						} else if (a.includes('/') && b.includes('/') && a.split('/').length == 3 && b.split('/').length == 3) {
							const [aDay, aMonth, aYear] = a.split('/').map(Number);
							const [bDay, bMonth, bYear] = b.split('/').map(Number);
							if (aYear !== bYear) return aYear - bYear;
							if (aMonth !== bMonth) return aMonth - bMonth;
							return aDay - bDay;
						}
						return a.localeCompare(b);
					});

					const result = sortedDates.map((date) => {
						const row = { date };
						Object.keys(variables).forEach((varKey) => {
							if (rawDataByVariable[varKey]) {
								const dataPoint = rawDataByVariable[varKey].find((item) => item.date === date);
								row[varKey] = dataPoint ? dataPoint.value : 0;
							} else {
								row[varKey] = 0;
							}
						});
						row.value = evaluate(formula, row);
						return row;
					});

					return result;
				} catch (error) {
					console.error('Error processing KPI data for', kpi.name, ':', error);
					// Trả về dữ liệu demo nếu có lỗi
					const demoData = [{ date: 'Tháng 1/2024', value: 15000 }, {
						date: 'Tháng 2/2024',
						value: 1800000,
					}, { date: 'Tháng 3/2024', value: 2200000 }, { date: 'Tháng 4/2024', value: 25000 }];
					return demoData;
				}
			};

			// Xử lý dữ liệu cho tất cả KPI
			const processedDataPromises = kpis.map(kpi => processKpiData(kpi));
			const processedDataArray = await Promise.all(processedDataPromises);

			// Tạo dữ liệu demo cho các KPI không có dữ liệu
			const finalDataArray = processedDataArray.map((data, index) => {
				if (data.length === 0) {
					// Tạo dữ liệu demo khác nhau cho mỗi KPI
					const baseValue = 1000000 + (index * 200000);
					return [{ date: 'Tháng 1/2024', value: baseValue }, {
						date: 'Tháng 2/2024',
						value: baseValue + 300000,
					}, { date: 'Tháng 3/2024', value: baseValue + 700000 }, {
						date: 'Tháng 4/2024',
						value: baseValue + 1000000,
					}];
				}
				return data;
			});

			// Kiểm tra dữ liệu đã xử lý
			if (finalDataArray.some(data => !Array.isArray(data))) {
				console.warn('Invalid processed data for comparison');
				return;
			}

			// Chuẩn hóa dữ liệu để cùng đơn vị thời gian
			// Sử dụng dữ liệu gốc thay vì ép buộc chuyển về tháng
			const chartDataArray = finalDataArray.map(data => data || []);

			// Kết hợp dữ liệu của tất cả KPI
			const allDates = new Set();
			chartDataArray.forEach(chartData => {
				chartData.forEach(item => allDates.add(item.date));
			});

			// Sắp xếp dates theo thứ tự thời gian
			const sortedDates = Array.from(allDates).sort((a, b) => {
				if (a.startsWith('Tuần') && b.startsWith('Tuần')) {
					const [aWeek, aYear] = a.replace('Tuần ', '').split('/').map(Number);
					const [bWeek, bYear] = b.replace('Tuần ', '').split('/').map(Number);
					return aYear !== bYear ? aYear - bYear : aWeek - bWeek;
				} else if (a.startsWith('Tháng') && b.startsWith('Tháng')) {
					const [aMonth, aYear] = a.replace('Tháng ', '').split('/').map(Number);
					const [bMonth, bYear] = b.replace('Tháng ', '').split('/').map(Number);
					return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
				} else if (a.includes('/') && b.includes('/') && a.split('/').length === 3 && b.split('/').length === 3) {
					const [aDay, aMonth, aYear] = a.split('/').map(Number);
					const [bDay, bMonth, bYear] = b.split('/').map(Number);
					if (aYear !== bYear) return aYear - bYear;
					if (aMonth !== bMonth) return aMonth - bMonth;
					return aDay - bDay;
				}
				return a.localeCompare(b);
			});

			// Tạo dataset kết hợp
			let combinedData = sortedDates.map(date => {
				const row = { date };
				kpis.forEach((kpi, index) => {
					const kpiData = chartDataArray[index].find(item => item.date === date);
					row[kpi.name] = kpiData ? kpiData.value : 0;
				});
				return row;
			});

			// Apply recent periods filter if specified
			const recentPeriods = dashboardItem.settings?.recentPeriods || 0;
			if (recentPeriods > 0 && combinedData.length > recentPeriods) {
				combinedData = combinedData.slice(-recentPeriods);
			}

			// Xác định kiểu hiển thị cho comparison (line, stacked_area, stacked_bar, normalizebar)
			const comparisonViewType = dashboardItem.settings?.chartViewType || 'line';

			// Tạo series theo kiểu hiển thị
			let series = [];
			if (comparisonViewType === 'normalizebar') {
				// Normalized 100% stacked bar: mỗi KPI là một yKey riêng, cần chuyển data sang { date, [kpiName]: value }
				series = kpis.map((kpi, index) => {
					const color = fills && fills[index] ? fills[index] : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][index % 8];
					return createNormalisedBar('date', kpi.name, kpi.name, color);
				});
			} else if (comparisonViewType === 'stacked_bar') {
				series = kpis.map((kpi, index) => {
					const color = fills && fills[index] ? fills[index] : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][index % 8];
					return createSeries('date', kpi.name, kpi.name, 'bar', color, true);
				});
			} else if (comparisonViewType === 'stacked_area') {
				series = kpis.map((kpi, index) => {
					const color = fills && fills[index] ? fills[index] : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][index % 8];
					return createSeries('date', kpi.name, kpi.name, 'area', color, true);
				});
			} else {
				// Mặc định line
				series = kpis.map((kpi, index) => {
					const color = fills && fills[index] ? fills[index] : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][index % 8];
					return createSeries('date', kpi.name, kpi.name, 'line', color);
				});
			}

			// Tạo chart options cho comparison sử dụng format chuẩn
			const chartOptions = createSectionData(dashboardItem.name, combinedData, series, dashboardItem.name);
			setChartOptions(prev => ({
				...prev, [dashboardItem.id]: chartOptions,
			}));

			// Lưu dữ liệu cho bảng
			const tableDataArray = [];
			const maxLength = Math.max(...finalDataArray.map(data => data.length));

			for (let i = 0; i < maxLength; i++) {
				const row = { date: '' };
				const values = [];

				kpis.forEach((kpi, index) => {
					const data = finalDataArray[index][i] || { date: '', value: 0 };
					row[`kpi${index + 1}Value`] = data.value || 0;
					row[`kpi${index + 1}Name`] = kpi.name;
					values.push(data.value || 0);
					if (index === 0) row.date = data.date || '';
				});

				// Tính toán so sánh với KPI đầu tiên làm chuẩn
				const baseValue = values[0];
				row.differences = values.slice(1).map(value => value - baseValue);
				row.percentages = values.slice(1).map(value => baseValue !== 0 ? ((value / baseValue) - 1) * 100 : 0);

				tableDataArray.push(row);
			}

			// Apply recent periods filter to table data if specified
			if (recentPeriods > 0 && tableDataArray.length > recentPeriods) {
				const filteredTableData = tableDataArray.slice(-recentPeriods);
				setTableData(prev => ({
					...prev, [dashboardItem.id]: filteredTableData,
				}));
			} else {
				setTableData(prev => ({
					...prev, [dashboardItem.id]: tableDataArray,
				}));
			}

		} catch (error) {
			console.error('Error loading comparison data:', error);
			message.error('Lỗi khi tải dữ liệu so sánh');
		} finally {
			setLoading(false);
		}
	};

	const loadTableChartData = async (dashboardItem, retry = false) => {
		// Use chartColors state instead of fetching from API again
		let colors = await getSettingByType('SettingColor');
		colors = colors.setting.map(item => item.color);
		if (dashboardItem.type !== 'table_chart') return;

		try {

			const settings = dashboardItem.settings;
			const timeColumn = settings.timeColumn;
			const groupColumn = settings.groupColumn;
			const valueColumn = settings.valueColumn;
			const chartType = settings.chartType || 'line';

			if (!dashboardItem.idData || !valueColumn) {
				console.error('Missing required settings for table chart');
				return;
			}
			// Get the approved version
			const selectedVersion = approvedVersions.find(version => version.id == dashboardItem.idData);
			if (!selectedVersion) {
				console.error('Selected version not found');
				return;
			}

			// Get template table
			const templateTable = await getTableByid(selectedVersion.id_template);
			if (!templateTable) {
				console.error('Template table not found');
				return;
			}

			let rawData = [];

			if (templateTable.isCombine) {
				rawData = await loadAndMergeData(templateTable);
			} else {
				let versionId = selectedVersion.id_version;

				const targetStep = templateTable.steps?.find(step => step.id === versionId);

				if (targetStep && targetStep.data) {
					rawData = targetStep.data;
				} else {
					const lastStep = templateTable.steps?.[templateTable.steps.length - 1];
					if (lastStep && lastStep.data) {
						rawData = lastStep.data;
					} else {
						// Try to get data using getTemplateRow with cache
						try {
							if (versionId === 1) versionId = null;
							const all = await getAllTemplateRowsWithProgress(
								selectedVersion.id_template,
								versionId,
								{
									pageSize: 5000,
									onProgress: ({ fetched, total, percent }) => {
										message.loading({
											content: `Đang tải dữ liệu bảng (${fetched}/${total}) - ${percent}%`,
											key: 'load_all_rows_chart',
											duration: 0,
										});
									},
								},
							);
							message.destroy('load_all_rows_chart');
							rawData = all.rows;
							setTotalRows(all.count);
						} catch (cacheError) {
							console.error('Error getting template row with cache:', cacheError);
							// Fallback to original getTemplateRow
							try {
								if (versionId === 1) versionId = null;
								const response = await getTemplateRow(selectedVersion.id_template, versionId, false, currentPage, pageSize);
								if (response && response.rows) {
									const rows = response.rows;
									if (rows.length > 0) {
										rawData = rows.map(item => item.data);
										setTotalRows(response.count);
									}
								}
							} catch (fallbackError) {
								console.error('Fallback getTemplateRow also failed:', fallbackError);
							}
						}
					}
				}
			}
			if (!rawData || rawData.length === 0) {
				message.warning('Không có dữ liệu trong bảng');
				return;
			}
			const chartData = processChartData(rawData, timeColumn, groupColumn, valueColumn, chartType, dashboardItem.settings.dataGrouping, colors);

			// Create chart options using createSectionData (same as CHART type)
			const chartOption = createSectionData('', chartData.data, chartData.series, '');
			setChartOptions(prev => ({ ...prev, [dashboardItem.id]: chartOption }));
			setTableData(prev => ({ ...prev, [dashboardItem.id]: chartData.data }));

			// Store raw data for detail view
			setRawApprovedVersionData(prev => ({
				...prev, [dashboardItem.id]: rawData,
			}));

		} catch (error) {
			console.error('Error loading table chart data:', error);
			if (!retry) {
				setTimeout(() => {
					loadTableChartData(dashboardItem, true);
				}, 2000);
			} else {
				message.error('Lỗi khi tải dữ liệu biểu đồ từ bảng');
			}
		}
	};
	// Helper function to process raw data into chart format
	const processChartData = (rawData, timeColumn, groupColumn, valueColumn, chartType, dataGrouping = 'none', colors = null) => {
		let chartColors = colors;
		let chartData = [];
		let series = [];

		if (chartType === 'pie') {
			// For pie chart, group by groupColumn and sum valueColumn
			const groupedData = {};
			rawData.forEach(row => {
				const groupValue = groupColumn ? row[groupColumn] : 'Tổng';
				const value = parseFloat(row[valueColumn]) || 0;
				groupedData[groupValue] = (groupedData[groupValue] || 0) + value;
			});

			// Tính tổng để tính phần trăm
			const total = Object.values(groupedData).reduce((sum, value) => sum + value, 0);

			chartData = Object.entries(groupedData).map(([name, value], index) => {
				const percent = total > 0 ? +(value / total * 100).toFixed(1) : 0;
				const formattedValue = formatNumberWithK(value);
				return {
					name,
					value,
					percent,
					formattedValue: `${formattedValue} (${percent}%)`,
					color: chartColors[index % chartColors.length], // Add color to each data point
				};
			});

			// Create pie series with custom configuration for displaying formatted values
			const pieSeries = {
				...createSeriesPie('value', 'name', chartColors), sectorLabelKey: 'formattedValue', // Hiển thị giá trị đã format bên trong
				sectorLabel: {
					color: 'white', fontWeight: 'bold', fontSize: 12,
				}, calloutLabel: {
					enabled: true, color: '#262626', fontFamily: 'Roboto Flex, sans-serif', fontSize: 11,
				}, tooltip: {
					renderer: (params) => ({
						content: `${params.datum.name}: ${params.datum.formattedValue}`,
					}),
				},
			};
			series.push(pieSeries);
		} else {
			// For line and bar charts
			if (timeColumn) {
				// Group by time and optionally by group
				const groupedByTime = {};
				rawData.forEach(row => {
					let timeValue = row[timeColumn];
					const groupValue = groupColumn ? row[groupColumn] : 'Giá trị';
					const value = parseFloat(row[valueColumn]) || 0;

					// Apply data grouping if specified
					if (dataGrouping !== 'none' && timeValue) {
						try {
							const date = new Date(timeValue);
							if (!isNaN(date.getTime())) {
								if (dataGrouping === 'month') {
									timeValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
								} else if (dataGrouping === 'week') {
									const year = date.getFullYear();
									const weekNum = getWeekNumber(date);
									timeValue = `${year}-W${String(weekNum).padStart(2, '0')}`;
								}
							}
						} catch (error) {
							console.warn('Error parsing date for grouping:', error);
						}
					}

					if (!groupedByTime[timeValue]) {
						groupedByTime[timeValue] = {};
					}
					if (!groupedByTime[timeValue][groupValue]) {
						groupedByTime[timeValue][groupValue] = 0;
					}
					groupedByTime[timeValue][groupValue] += value;
				});

				chartData = Object.entries(groupedByTime)
					.map(([time, groups]) => {
						const formattedGroups = {};
						Object.entries(groups).forEach(([groupName, value]) => {
							formattedGroups[groupName] = value;
							formattedGroups[`${groupName}_formatted`] = formatNumberWithK(value);
						});
						return {
							time, ...formattedGroups,
						};
					})
					.sort((a, b) => {
						// Sort by time for proper chart display
						if (dataGrouping === 'month') {
							return a.time.localeCompare(b.time);
						} else if (dataGrouping === 'week') {
							return a.time.localeCompare(b.time);
						} else {
							// For original data, try to sort by date if possible
							try {
								const dateA = new Date(a.time);
								const dateB = new Date(b.time);
								if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
									return dateA - dateB;
								}
							} catch (error) {
								// If date parsing fails, use string comparison
							}
							return a.time.localeCompare(b.time);
						}
					});

				// Create series for each group using createSeries function
				const allGroups = [...new Set(rawData.map(row => groupColumn ? row[groupColumn] : 'Giá trị'))];
				allGroups.forEach((group, index) => {
					const color = chartColors[index % chartColors.length];
					// Handle stacked area chart type
					if (chartType === 'stacked_area') {
						series.push(createSeries('time', group, group, 'area', color, true)); // true for stack parameter
					} else {
						series.push(createSeries('time', group, group, chartType, color));
					}
				});
			} else {
				// No time column, just group by group column
				const groupedData = {};
				rawData.forEach(row => {
					const groupValue = groupColumn ? row[groupColumn] : 'Giá trị';
					const value = parseFloat(row[valueColumn]) || 0;
					groupedData[groupValue] = (groupedData[groupValue] || 0) + value;
				});

				chartData = Object.entries(groupedData).map(([name, value]) => ({
					name, value, value_formatted: formatNumberWithK(value),
				}));

				// Handle stacked area chart type for non-time based data
				if (chartType === 'stacked_area') {
					// For stacked area without time column, create multiple series with different colors
					Object.entries(groupedData).forEach(([groupName, value], index) => {
						const color = chartColors[index % chartColors.length];
						series.push(createSeries('name', groupName, groupName, 'area', color, true)); // true for stack parameter
					});
				} else {
					series.push(createSeries('name', 'value', 'Giá trị', chartType, chartColors[0]));
				}
			}
		}

		return { data: chartData, series };
	};

	const processChart2Data = (colors, rawData, timeColumn, groupColumn, valueColumn, chartType, dataGrouping = 'none', dateRange = 'all') => {
		let chartColors = colors;
		let chartData = [];
		let series = [];

		// Filter data by time column and date range if specified
		let filteredData = rawData;
		if (timeColumn && dateRange !== 'all') {
			filteredData = rawData.filter(row => {
				const timeValue = row[timeColumn];
				if (!timeValue) return false;

				try {
					const date = new Date(timeValue);
					if (isNaN(date.getTime())) return false;

					const now = new Date();
					const startDate = new Date();

					switch (dateRange) {
						case 'custom':
							// For custom date range, we'll handle it in the calling function
							// This is just a placeholder - the actual filtering will be done with the date range from UI state
							return true;
						case 'today':
							return date.toDateString() === now.toDateString();
						case 'yesterday':
							startDate.setDate(now.getDate() - 1);
							return date.toDateString() === startDate.toDateString();
						case 'thisWeek':
							const currentWeek = getWeekNumber(now);
							const dataWeek = getWeekNumber(date);
							return date.getFullYear() === now.getFullYear() && dataWeek === currentWeek;
						case 'lastWeek':
							startDate.setDate(now.getDate() - 7);
							const lastWeek = getWeekNumber(startDate);
							const dataWeekLast = getWeekNumber(date);
							return date.getFullYear() === startDate.getFullYear() && dataWeekLast === lastWeek;
						case 'thisMonth':
							return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
						case 'lastMonth':
							startDate.setMonth(now.getMonth() - 1);
							return date.getFullYear() === startDate.getFullYear() && date.getMonth() === startDate.getMonth();
						case 'last7Days':
							startDate.setDate(now.getDate() - 7);
							return date >= startDate && date <= now;
						case 'last15Days':
							startDate.setDate(now.getDate() - 15);
							return date >= startDate && date <= now;
						case 'last30Days':
							startDate.setDate(now.getDate() - 30);
							return date >= startDate && date <= now;
						case 'last90Days':
							startDate.setDate(now.getDate() - 90);
							return date >= startDate && date <= now;
						case 'thisYear':
							return date.getFullYear() === now.getFullYear();
						case 'lastYear':
							return date.getFullYear() === now.getFullYear() - 1;
						default:
							return true;
					}
				} catch (error) {
					console.warn('Error filtering by date:', error);
				}
				return true;
			});
		}

		// Apply additional data grouping if specified
		if (timeColumn && dataGrouping !== 'none') {
			filteredData = filteredData.filter(row => {
				const timeValue = row[timeColumn];
				if (!timeValue) return false;

				try {
					const date = new Date(timeValue);
					if (isNaN(date.getTime())) return false;

					const now = new Date();
					if (dataGrouping === 'month') {
						// Filter for current month
						return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
					} else if (dataGrouping === 'week') {
						// Filter for current week
						const currentWeek = getWeekNumber(now);
						const dataWeek = getWeekNumber(date);
						return date.getFullYear() === now.getFullYear() && dataWeek === currentWeek;
					}
				} catch (error) {
					console.warn('Error filtering by date grouping:', error);
				}
				return true;
			});
		}

		if (chartType === 'pie') {
			// For pie chart, group by groupColumn and sum valueColumn
			const groupedData = {};
			filteredData.forEach(row => {
				const groupValue = groupColumn ? row[groupColumn] : 'Tổng';
				const value = parseFloat(row[valueColumn]) || 0;
				groupedData[groupValue] = (groupedData[groupValue] || 0) + value;
			});

			// Tính tổng để tính phần trăm
			const total = Object.values(groupedData).reduce((sum, value) => sum + value, 0);

			chartData = Object.entries(groupedData).map(([name, value], index) => {
				const percent = total > 0 ? +(value / total * 100).toFixed(1) : 0;
				const formattedValue = formatNumberWithK(value);
				return {
					name,
					value,
					percent,
					formattedValue: `${formattedValue} (${percent}%)`,
					color: chartColors[index % chartColors.length], // Add color to each data point
				};
			});

			// Create pie series with custom configuration for displaying formatted values
			const pieSeries = {
				...createSeriesPie('value', 'name', chartColors), sectorLabelKey: 'formattedValue', // Hiển thị giá trị đã format bên trong
				sectorLabel: {
					color: 'white', fontWeight: 'bold', fontSize: 12,
				}, calloutLabel: {
					enabled: true, color: '#262626', fontFamily: 'Roboto Flex, sans-serif', fontSize: 11,
				}, tooltip: {
					renderer: (params) => ({
						content: `${params.datum.name}: ${params.datum.formattedValue}`,
					}),
				},
			};
			series.push(pieSeries);
		} else {
			// For line, bar, and area charts - always use group column as X-axis
			if (groupColumn) {
				// Group by group column
				const groupedData = {};
				filteredData.forEach(row => {
					const groupValue = row[groupColumn];
					const value = parseFloat(row[valueColumn]) || 0;
					groupedData[groupValue] = (groupedData[groupValue] || 0) + value;
				});

				chartData = Object.entries(groupedData).map(([name, value]) => ({
					name, value, value_formatted: formatNumberWithK(value),
				}));

				// Handle stacked area chart type
				if (chartType === 'stacked_area') {
					// For stacked area, create multiple series with different colors
					Object.entries(groupedData).forEach(([groupName, value], index) => {
						const color = chartColors[index % chartColors.length];
						series.push(createSeries('name', groupName, groupName, 'area', color, true)); // true for stack parameter
					});
				} else {
					series.push(createSeries('name', 'value', 'Giá trị', chartType, chartColors[0]));
				}
			} else {
				// No group column, just show total value
				const totalValue = filteredData.reduce((sum, row) => {
					return sum + (parseFloat(row[valueColumn]) || 0);
				}, 0);

				chartData = [{
					name: 'Tổng', value: totalValue, value_formatted: formatNumberWithK(totalValue),
				}];

				series.push(createSeries('name', 'value', 'Giá trị', chartType, chartColors[0]));
			}
		}

		return { data: chartData, series };
	};

	const loadTableChart2Data = async (dashboardItem, retry = false) => {
		let colors = await getSettingByType('SettingColor');
		colors = colors.setting.map(item => item.color);
		if (dashboardItem.type !== 'table_chart_2') return;

		try {

			const settings = dashboardItem.settings;
			const timeColumn = settings.timeColumn;
			const groupColumn = settings.groupColumn;
			const valueColumn = settings.valueColumn;
			const chartType = settings.chartType || 'line';
			const dataGrouping = settings.dataGrouping || 'none';
			const dateRange = settings.dateRange || 'all';

			if (!dashboardItem.idData || !valueColumn) {
				console.error('Missing required settings for table chart 2');
				return;
			}

			// Get the approved version
			const selectedVersion = approvedVersions.find(version => version.id == dashboardItem.idData);
			if (!selectedVersion) {
				console.error('Selected version not found');
				return;
			}

			// Get template table
			const templateTable = await getTableByid(selectedVersion.id_template);
			if (!templateTable) {
				console.error('Template table not found');
				return;
			}

			let rawData = [];

			if (templateTable.isCombine) {
				rawData = await loadAndMergeData(templateTable);
			} else {
				const versionId = selectedVersion.id_version;
				const targetStep = templateTable.steps?.find(step => step.id === versionId);

				if (targetStep && targetStep.data) {
					rawData = targetStep.data;
				} else {
					const lastStep = templateTable.steps?.[templateTable.steps.length - 1];
					if (lastStep && lastStep.data) {
						rawData = lastStep.data;
					} else {
						// Try to get data using getTemplateRow with cache
						try {
							const all = await getAllTemplateRowsWithProgress(
								selectedVersion.id_template,
								versionId,
								{
									pageSize: 5000,
									onProgress: ({ fetched, total, percent }) => {
										message.loading({
											content: `Đang tải dữ liệu bảng (${fetched}/${total}) - ${percent}%`,
											key: 'load_all_rows_chart2',
											duration: 0,
										});
									},
								},
							);
							message.destroy('load_all_rows_chart2');
							rawData = all.rows;
							setTotalRows(all.count);
						} catch (cacheError) {
							console.error('Error getting template row with cache:', cacheError);
							// Fallback to original getTemplateRow
							try {
								const response = await getTemplateRow(selectedVersion.id_template, versionId, false, currentPage, pageSize);
								if (response && response.rows) {
									const rows = response.rows;
									if (rows.length > 0) {
										rawData = rows.map(item => item.data);
										setTotalRows(response.count);
									}
								}
							} catch (fallbackError) {
								console.error('Fallback getTemplateRow also failed:', fallbackError);
							}
						}
					}
				}
			}

			if (!rawData || rawData.length === 0) {
				message.warning('Không có dữ liệu trong bảng');
				return;
			}
			const chartData = processChart2Data(colors, rawData, timeColumn, groupColumn, valueColumn, chartType, dataGrouping, dateRange);
			const chartOption = createSectionData('', chartData.data, chartData.series, '');
			if (chartOption.legend) {
				chartOption.legend.enabled = false;
			}
			setChartOptions(prev => ({ ...prev, [dashboardItem.id]: chartOption }));
			setTableData(prev => ({ ...prev, [dashboardItem.id]: chartData.data }));

			// Store raw data for detail view
			setRawApprovedVersionData(prev => ({
				...prev, [dashboardItem.id]: rawData,
			}));
		} catch (error) {
			console.error('Error loading table chart 2 data:', error);
			if (!retry) {
				setTimeout(() => {
					loadTableChart2Data(dashboardItem, true);
				}, 2000);
			} else {
				message.error('Lỗi khi tải dữ liệu biểu đồ từ bảng 2');
			}
		}
	};

	const loadTableData = async (dashboardItem, retry = false) => {
		try {

			if (!dashboardItem.idData) {
				console.warn('No idData found for table item');
				return;
			}

			// Get the approved version
			const selectedVersion = approvedVersions.find(version => version.id == dashboardItem.idData);
			if (!selectedVersion) {
				console.error('Selected version not found');
				return;
			}

			// Get template table
			const templateTable = await getTableByid(selectedVersion.id_template);
			if (!templateTable) {
				console.error('Template table not found');
				return;
			}

			let tableData = [];

			if (templateTable.isCombine) {
				tableData = await loadAndMergeData(templateTable);
			} else {
				let versionId = selectedVersion.id_version;

				const targetStep = templateTable.steps?.find(step => step.id === versionId);

				if (targetStep && targetStep.data) {
					tableData = targetStep.data;
				} else {
					const lastStep = templateTable.steps?.[templateTable.steps.length - 1];
					if (lastStep && lastStep.data) {
						tableData = lastStep.data;
					} else {
						// Try to get data using getTemplateRow with cache
						if (versionId == 1) versionId = null;
						try {
							const response = await getTemplateRowWithCache(
								selectedVersion.id_template,
								versionId,
								retry, // forceRefresh nếu retry
								currentPage,
								pageSize,
								// Sử dụng TTL mặc định từ service
							);
							if (response && response.rows) {
								const rows = response.rows;
								if (rows.length > 0) {
									tableData = rows.map(item => item.data);
									setTotalRows(response.count);
								}
							}
						} catch (cacheError) {
							console.error('Error getting template row with cache:', cacheError);
							// Fallback to original getTemplateRow nếu cache fail
							try {
								const response = await getTemplateRow(selectedVersion.id_template, versionId, retry, currentPage, pageSize);
								if (response && response.rows) {
									const rows = response.rows;
									if (rows.length > 0) {
										tableData = rows.map(item => item.data);
										setTotalRows(response.count);
									}
								}
							} catch (fallbackError) {
								console.error('Fallback getTemplateRow also failed:', fallbackError);
							}
						}
					}
				}
			}

			// Apply advanced filters if present
			if (Array.isArray(dashboardItem.settings?.tableFilters) && dashboardItem.settings.tableFilters.length > 0) {
				const logic = (dashboardItem.settings.tableFilterLogic || 'AND').toUpperCase();
				tableData = tableData.filter(row => {
					const results = dashboardItem.settings.tableFilters.map(f => {
						if (!f || !f.columnId) return true;
						const colName = (dashboardItem.settings.templateColumns || []).find(c => c.id === f.columnId)?.columnName || f.columnId;
						let raw = row[colName];
						if (raw === undefined) {
							const key = Object.keys(row).find(k => k.toLowerCase() === String(colName).toLowerCase());
							raw = key ? row[key] : undefined;
						}
						const op = f.operator || '=';
						if (op === 'not_empty') {
							return raw !== undefined && raw !== null && String(raw).trim() !== '';
						}
						const leftNum = parseNumeric(raw);
						const rightNum = parseNumeric(f.value);
						const leftVal = isNaN(leftNum) ? String(raw ?? '').trim().toLowerCase() : leftNum;
						const rightVal = isNaN(rightNum) ? String(f.value ?? '').trim().toLowerCase() : rightNum;
						switch (op) {
							case '>':
								return leftVal > rightVal;
							case '<':
								return leftVal < rightVal;
							case '>=':
								return leftVal >= rightVal;
							case '<=':
								return leftVal <= rightVal;
							case '#':
								return leftVal != rightVal;
							case '=':
							default:
								return leftVal == rightVal;
						}
					});
					return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
				});
			}

			if (tableData && tableData.length > 0) {
				// Update table data state
				setTableData(prev => ({
					...prev, [dashboardItem.id]: tableData,
				}));

				// Store raw data for detail view
				setRawApprovedVersionData(prev => ({
					...prev, [dashboardItem.id]: tableData,
				}));

			}
		} catch (error) {
			console.error('Error loading table data:', error);
			if (!retry) {
				setTimeout(() => {
					loadTableData(dashboardItem, true);
				}, 2000);
			}
		}
	};

	const convertVariableData = (varData, targetPeriod, year = new Date().getFullYear()) => {
		// First, transform the t1-t12 format to a standard monthly format
		const monthlyData = [];

		for (let i = 1; i <= 12; i++) {
			const key = `t${i}`;
			if (varData[key] !== undefined) {
				monthlyData.push({
					date: `Tháng ${i}/${year}`, value: varData[key],
				});
			}
		}

		// Now use the same conversion logic as before, but starting from 'month' as the source period
		if (targetPeriod === 'month') {
			return monthlyData;
		} else if (targetPeriod === 'week') {
			return monthToWeek(monthlyData, year);
		} else if (targetPeriod === 'day') {
			return monthToDay(monthlyData);
		} else {
			console.error(`Conversion to ${targetPeriod} is not supported`);
			return monthlyData;
		}
	};

	function monthToDay(data) {
		const result = [];
		data.forEach((item) => {
			const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
			if (!matches) return;

			const monthNum = parseInt(matches[1]);
			const year = parseInt(matches[2]);
			const daysInMonth = getDaysInMonth(monthNum - 1, year);
			const dailyValue = item.value / daysInMonth;

			for (let i = 0; i < daysInMonth; i++) {
				const currentDate = new Date(year, monthNum - 1, i + 1);
				result.push({
					date: formatDate(currentDate), value: dailyValue,
				});
			}
		});
		return result;
	}

	function monthToWeek(data, year) {
		const result = [];
		data.forEach((item) => {
			const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
			if (!matches) return;

			const monthNum = parseInt(matches[1]);
			const year = parseInt(matches[2]);
			const weeksInMonth = 4;
			const weeklyValue = item.value / weeksInMonth;
			const weekNumbers = getWeeksInMonth(monthNum - 1, year);

			weekNumbers.forEach((weekNum) => {
				result.push({
					date: `Tuần ${weekNum}/${year}`, value: weeklyValue,
				});
			});
		});
		return result;
	}

	// Helper functions for convertVariableData
	function getWeeksInMonth(month, year) {
		const firstDayOfMonth = new Date(year, month, 1);
		const lastDayOfMonth = new Date(year, month + 1, 0);
		const firstWeek = getWeekNumber(firstDayOfMonth);
		const lastWeek = getWeekNumber(lastDayOfMonth);
		const weeks = [];
		for (let i = firstWeek; i <= lastWeek; i++) {
			weeks.push(i);
		}
		return weeks;
	}

	function getWeekNumber(date) {
		const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
		const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
		return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
	}

	function formatDate(date) {
		return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
	}

	function getDaysInMonth(month, year) {
		return new Date(year, month + 1, 0).getDate();
	}

	// Helper: robust numeric parsing for filters
	const parseNumeric = (value) => {
		if (typeof value === 'number') return value;
		if (value === null || value === undefined) return NaN;
		try {
			const normalized = String(value).replace(/\s/g, '').replace(/[^0-9+\-.,]/g, '');
			// Prefer dot as decimal separator: if both separators exist, remove thousands separators heuristically
			let s = normalized;
			if (s.includes(',') && s.includes('.')) {
				// Assume dot as thousands and comma as decimal (vi-VN)
				s = s.replace(/\./g, '').replace(',', '.');
			} else if (s.includes(',')) {
				// If only comma, treat as thousands (remove) or decimal; we'll try remove commas first
				s = s.replace(/,/g, '');
			}
			const n = parseFloat(s);
			return isNaN(n) ? NaN : n;
		} catch (e) {
			return NaN;
		}
	};

	// Helper function to render data bar
	const renderDataBar = (value, allValues, columnSettings, columnIndex = 0) => {
		if (value === null || value === undefined || value === '') {
			return '-';
		}

		const numValue = Number(value);
		if (isNaN(numValue)) {
			return value;
		}

		// Calculate max value for percentage
		const maxValue = Math.max(...allValues.filter(v => !isNaN(Number(v))).map(v => Number(v)));
		const minValue = Math.min(...allValues.filter(v => !isNaN(Number(v))).map(v => Number(v)));

		if (maxValue === minValue) {
			return formatValueBySettings(value, columnSettings);
		}

		// Calculate percentage (0-100)
		const percentage = ((numValue - minValue) / (maxValue - minValue)) * 100;

		// Format the value using the same logic as formatValueBySettings
		let formattedValue = value;

		// Apply value formatting if columnSettings has valueFormat
		if (columnSettings?.valueFormat) {
			const format = columnSettings.valueFormat;

			// Apply decimal places
			if (format.decimalPlaces !== undefined) {
				formattedValue = numValue.toFixed(format.decimalPlaces);
			}

			// Apply thousands/millions formatting
			if (format.showThousands && !format.showMillions) {
				formattedValue = (numValue / 1000).toFixed(format.decimalPlaces || 0) + 'K';
			} else if (format.showMillions) {
				formattedValue = (numValue / 1000000).toFixed(format.decimalPlaces || 0) + 'M';
			} else {
				// Regular number formatting with commas
				formattedValue = numValue.toLocaleString('vn-VN', {
					minimumFractionDigits: format.decimalPlaces || 0,
					maximumFractionDigits: format.decimalPlaces || 0,
					useGrouping: true,
				});
			}

			// Apply percentage
			if (format.showPercentage) {
				formattedValue += '%';
			}
		} else {
			// Fallback to basic formatting
			formattedValue = numValue.toLocaleString('vn-VN');
		}

		// Determine bar color and text color
		let barColor = '#347ee4'; // Green for positive values
		let textColor = 'inherit';

		if (numValue < 0) {
			barColor = '#ff6C68'; // Red for negative values
			textColor = '#ff6C68'; // Red text for negative values
		} else if (numValue > 0 && chartColors.length > 0) {
			// Use chart color system for positive values
			barColor = chartColors[0];
			textColor = 'inherit';
		}

		// Calculate bar width based on absolute value and scale
		const absValue = Math.abs(numValue);
		const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue));
		const barWidth = (absValue / maxAbsValue) * 100; // 100% max width single direction

		return (<div style={{
			display: 'flex', alignItems: 'center', gap: '8px', width: '100%', height: '100%', padding: '4px 8px',
		}}>
			<div style={{
				flex: 1,
				height: '25px',
				backgroundColor: '#f0f0f0',
				borderRadius: '1px',
				overflow: 'hidden',
				position: 'relative',
				display: 'flex',
				alignItems: 'center',
			}}>
				{/* Single-direction bar (left to right), color by sign */}
				<div style={{
					position: 'absolute',
					left: 0,
					top: 0,
					bottom: 0,
					width: `${barWidth}%`,
					backgroundColor: barColor,
					borderRadius: '1px',
					transition: 'width 0.3s ease',
				}} />
			</div>
			<div style={{
				minWidth: '60px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: textColor,
			}}>
				{formattedValue}
			</div>
		</div>);
	};

	// Helper function to format values according to column settings
	const formatValueBySettings = (value, columnSettings) => {
		if (value === null || value === undefined || value === '') {
			return '-';
		}

		// If no column settings, return value as is
		if (!columnSettings) {
			return value;
		}

		// Handle text formatting
		if (columnSettings.type === 'text') {
			return String(value);
		}

		// Handle date formatting
		if (columnSettings.type === 'date') {
			if (!value) return '-';
			try {
				const dateObj = new Date(value);
				if (isNaN(dateObj.getTime())) {
					return value;
				}
				const day = String(dateObj.getDate()).padStart(2, '0');
				const month = String(dateObj.getMonth() + 1).padStart(2, '0');
				const year = dateObj.getFullYear();
				const shortYear = String(year).slice(-2);

				switch (columnSettings.dateFormat) {
					case 'DD/MM/YY':
						return `${day}/${month}/${shortYear}`;
					case 'DD/MM/YYYY':
						return `${day}/${month}/${year}`;
					case 'MM/DD/YY':
						return `${month}/${day}/${shortYear}`;
					case 'MM/DD/YYYY':
						return `${month}/${day}/${year}`;
					default:
						return value;
				}
			} catch (e) {
				console.error('Error formatting date:', e);
				return value;
			}
		}

		// Handle value formatting
		if (columnSettings.type === 'value') {
			const format = columnSettings.valueFormat;
			let formattedValue = value;

			// Convert to number for formatting
			const numValue = Number(value);
			if (isNaN(numValue)) {
				return value;
			}

			// Apply decimal places
			if (format.decimalPlaces !== undefined) {
				formattedValue = numValue.toFixed(format.decimalPlaces);
			}

			// Apply thousands/millions formatting
			if (format.showThousands && !format.showMillions) {
				formattedValue = (numValue / 1000).toFixed(format.decimalPlaces || 0) + 'K';
			} else if (format.showMillions) {
				formattedValue = (numValue / 1000000).toFixed(format.decimalPlaces || 0) + 'M';
			} else {
				// Regular number formatting with commas
				formattedValue = numValue.toLocaleString('vn-VN', {
					minimumFractionDigits: format.decimalPlaces || 0,
					maximumFractionDigits: format.decimalPlaces || 0,
					useGrouping: true,
				});
			}

			// Apply percentage
			if (format.showPercentage) {
				formattedValue += '%';
			}

			return formattedValue;
		}

		return value;
	};

	const prepareTableColumns = (itemId) => {
		const data = tableData[itemId];
		if (!data || !data.length) return [];

		// Find the dashboard item to get type and settings
		const dashboardItem = dashboardItems.find(item => item.id === itemId);
		if (!dashboardItem) return [];

		if (dashboardItem.type === 'comparison') {
			// For comparison type, show KPI names and comparison data
			const kpis = dashboardItem.settings?.kpis?.map(kpiId => kpi2Calculators.find(k => k.id === kpiId)).filter(Boolean) || [];

			const columns = [{
				title: 'Thời gian', dataIndex: 'date', key: 'date', fixed: 'left', width: (() => {
					const columnWidths = { 0.5: 60, 1: 100, 2: 150, 3: 300 };
					const dateColumnSize = dashboardItem.settings?.dateColumnSize || 2;
					return columnWidths[dateColumnSize] || 150;
				})(), render: (text) => (<div style={{
					fontWeight: 500,
					padding: '8px 12px',
					backgroundColor: '#fafafa',
					borderRight: '1px solid #f0f0f0',
				}}>
					{text}
				</div>),
			}];

			// Thêm cột cho mỗi KPI
			kpis.forEach((kpi, index) => {
				columns.push({
					title: kpi.name || `KPI ${index + 1}`,
					dataIndex: `kpi${index + 1}Value`,
					key: `kpi${index + 1}Value`,
					width: 120,
					align: 'right',
					render: (text) => (<div style={{ padding: '8px 12px', textAlign: 'right' }}>
						{Number(text).toLocaleString('vn-VN', {
							minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true,
						})}
					</div>),
				});
			});

			// Thêm cột so sánh nếu có nhiều hơn 1 KPI
			if (kpis.length > 1) {
				// Cột chênh lệch so với KPI đầu tiên
				kpis.slice(1).forEach((kpi, index) => {
					columns.push({
						title: `Chênh lệch vs ${kpis[0].name}`,
						dataIndex: 'differences',
						key: `difference_${index}`,
						width: 120,
						align: 'right',
						render: (text, record) => {
							const value = record.differences?.[index] || 0;
							const color = value >= 0 ? '#52c41a' : '#ff4d4f';
							return (<div style={{
								padding: '8px 12px', textAlign: 'right', color: color, fontWeight: 500,
							}}>
								{Number(value).toLocaleString('vn-VN', {
									minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true,
								})}
							</div>);
						},
					});

					// Cột % chênh lệch
					columns.push({
						title: `% vs ${kpis[0].name}`,
						dataIndex: 'percentages',
						key: `percentage_${index}`,
						width: 100,
						align: 'right',
						render: (text, record) => {
							const value = record.percentages?.[index] || 0;
							const color = value >= 0 ? '#52c41a' : '#ff4d4f';
							return (<div style={{
								padding: '8px 12px', textAlign: 'right', color: color, fontWeight: 500,
							}}>
								{Number(value).toLocaleString('vn-VN', {
									minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true,
								})}%
							</div>);
						},
					});
				});
			}

			return columns;
		}

		if (dashboardItem.type === 'statistics') {
			// For statistics type, show KPI Calculator names and their data
			const kpiCalculatorIds = dashboardItem.settings?.kpiCalculators || [];
			const selectedKpiCalculators = kpiCalculatorIds.map(id => kpiCalculators.find(k => k.id === id)).filter(Boolean);

			const columns = [{
				title: 'Thời gian',
				dataIndex: 'date',
				key: 'date',
				fixed: 'left',
				width: 150,
				render: (text) => (<div style={{
					fontWeight: 500,
					padding: '8px 12px',
					backgroundColor: '#fafafa',
					borderRight: '1px solid #f0f0f0',
				}}>
					{text}
				</div>),
			}];

			// Thêm cột cho mỗi KPI Calculator
			selectedKpiCalculators.forEach((kpi, index) => {
				columns.push({
					title: kpi.name || `KPI ${index + 1}`,
					dataIndex: `kpi${index + 1}Value`,
					key: `kpi${index + 1}Value`,
					width: 120,
					align: 'right',
					render: (text) => (<div style={{ padding: '8px 12px', textAlign: 'right' }}>
						{Number(text).toLocaleString('vn-VN', {
							minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true,
						})}
					</div>),
				});
			});

			return columns;
		}

		if (dashboardItem.type === 'table') {
			// For table type, use column settings
			const columnSettings = dashboardItem.settings?.columnSettings || {};
			const displayColumns = dashboardItem.settings?.displayColumns || [];
			const dateColumn = dashboardItem.settings?.dateColumn;
			const templateColumns = dashboardItem.settings?.templateColumns || [];

			const columns = [];

			// Add date column if specified
			if (dateColumn) {
				const dateColumnSetting = columnSettings[dateColumn];
				columns.push({
					title: 'Thời gian',
					dataIndex: dateColumn,
					key: dateColumn,
					fixed: 'left',
					width: 120,
					render: (text) => (<div style={{
						fontWeight: 500,
						padding: '8px 12px',
						backgroundColor: '#fafafa',
						borderRight: '1px solid #f0f0f0',
					}}>
						{formatValueBySettings(text, dateColumnSetting)}
					</div>),
				});
			}

			// Add data columns based on settings
			displayColumns.forEach((columnId, index) => {
				const columnSetting = columnSettings[columnId];
				// Get column name from template columns or use default
				const templateColumn = templateColumns.find(col => col.id === columnId);
				const columnName = templateColumn?.columnName || `Cột ${index + 1}`;
				columns.push({
					title: columnName,
					dataIndex: columnId,
					key: columnId,
					width: columnSizes[columnId] ? columnSizes[columnId] * 60 : 120, // Convert size multiplier to actual width
					align: columnSetting?.type === 'text' ? 'left' : 'right',
					render: (text, record) => {
						const formattedValue = formatValueBySettings(text, columnSetting);

						// Apply color for negative values if enabled
						let textColor = 'inherit';
						if (columnSetting?.type === 'value' && columnSetting.valueFormat?.negativeRed && Number(text) < 0) {
							textColor = '#ff4d4f';
						}

						return (<div style={{
							padding: '8px 12px',
							textAlign: columnSetting?.type === 'text' ? 'left' : 'right',
							color: textColor,
						}}>
							{formattedValue}
						</div>);
					},
				});
			});
			return columns;
		}

		// Default columns for chart and top types
		return [{
			title: '', dataIndex: 'name', key: 'name', fixed: 'left', width: 150, render: (text) => (<div style={{
				fontWeight: 500, padding: '8px 12px', backgroundColor: '#fafafa', borderRight: '1px solid #f0f0f0',
			}}>
				{text}
			</div>),
		}, ...data.map((item, index) => ({
			title: item.date,
			dataIndex: `col${index}`,
			key: `col${index}`,
			width: 80,
			align: 'right',
			render: (text, record) => {
				if (text !== null && !isNaN(text)) {
					if (!isFinite(text)) {
						return (<div style={{ padding: '8px 12px', textAlign: 'right' }}>
							{text > 0 ? 'Infinite' : '-Infinite'}
						</div>);
					}
					if (text === 0) {
						return (<div style={{ padding: '8px 12px', textAlign: 'right' }}>
							0
						</div>);
					}
					if (record?.name?.startsWith('% so với')) {
						const color = text < 0 ? '#ff4d4f' : '#52c41a';
						return (<div style={{
							padding: '8px 12px', textAlign: 'right', color: color, fontWeight: 500,
						}}>
							{`${text.toFixed(1)}%`}
						</div>);
					}
					return (<div style={{ padding: '8px 12px', textAlign: 'right' }}>
						{Number(text).toLocaleString('vn-VN', {
							minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true,
						})}
					</div>);
				}
				return (<div style={{ padding: '8px 12px', textAlign: 'right' }}>
					-
				</div>);
			},
		}))];
	};

	const prepareTableData = (itemId) => {
		const data = tableData[itemId];
		if (!data || !data.length) return [];

		// Find the dashboard item to get KPI info
		const dashboardItem = dashboardItems.find(item => item.id === itemId);
		if (!dashboardItem) return [];

		if (dashboardItem.type === 'comparison') {
			// For comparison type, return the data directly as it's already in the correct format
			return data.map((item, index) => ({
				key: index.toString(), ...item,
			}));
		}

		if (dashboardItem.type === 'table') {

			const processedData = data.map((item, index) => ({
				key: index.toString(), ...item,
			}));
			return processedData;
		}

		if (dashboardItem.type === 'statistics') {
			// For statistics type, combine data from multiple KPI Calculators
			const kpiCalculatorIds = dashboardItem.settings?.kpiCalculators || [];
			const selectedKpiCalculators = kpiCalculatorIds.map(id => kpiCalculators.find(k => k.id === id)).filter(Boolean);

			if (selectedKpiCalculators.length === 0) return [];

			// Get all unique dates from all KPI data
			const allDates = new Set();
			selectedKpiCalculators.forEach(kpi => {
				if (kpi.tableData && kpi.tableData.length > 0) {
					kpi.tableData.forEach(item => allDates.add(item.date));
				}
			});

			const sortedDates = Array.from(allDates).sort((a, b) => {
				// Sort dates by month/year
				const [monthA, yearA] = a.split('/');
				const [monthB, yearB] = b.split('/');
				return new Date(parseInt(yearA), parseInt(monthA) - 1) - new Date(parseInt(yearB), parseInt(monthB) - 1);
			});

			// Create combined data
			const combinedData = sortedDates.map((date, index) => {
				const row = {
					key: index.toString(), date: date,
				};

				// Add values for each KPI Calculator
				selectedKpiCalculators.forEach((kpi, kpiIndex) => {
					const kpiData = kpi.tableData?.find(item => item.date === date);
					row[`kpi${kpiIndex + 1}Value`] = kpiData ? kpiData.value : null;
				});

				return row;
			});

			return combinedData;
		}

		// Get KPI info for benchmark names
		const kpi = kpi2Calculators.find(k => k.id === dashboardItem.idData);
		const benchmark1Name = kpi?.benchmark1_name || 'Benchmark 1';
		const benchmark2Name = kpi?.benchmark2_name || 'Benchmark 2';

		const result = [];

		// Giá trị thực hiện
		const actualRow = {
			key: '1', name: 'Giá trị thực hiện', ...data.reduce((acc, item, index) => {
				acc[`col${index}`] = item.value;
				return acc;
			}, {}),
		};
		result.push(actualRow);

		// Benchmark 1
		if (data[0]?.benchmark1 !== undefined) {
			const benchmark1Row = {
				key: '2', name: benchmark1Name, ...data.reduce((acc, item, index) => {
					acc[`col${index}`] = item.benchmark1;
					return acc;
				}, {}),
			};
			result.push(benchmark1Row);

			// % so với benchmark 1
			const percentage1Row = {
				key: '3', name: '% so với ' + benchmark1Name, ...data.reduce((acc, item, index) => {
					const percentage = item.benchmark1 !== 0 ? ((item.value - item.benchmark1) / item.benchmark1) * 100 : 0;
					acc[`col${index}`] = percentage;
					return acc;
				}, {}),
			};
			result.push(percentage1Row);
		}

		// Benchmark 2
		if (data[0]?.benchmark2 !== undefined) {
			const benchmark2Row = {
				key: '4', name: benchmark2Name, ...data.reduce((acc, item, index) => {
					acc[`col${index}`] = item.benchmark2;
					return acc;
				}, {}),
			};
			result.push(benchmark2Row);

			// % so với benchmark 2
			const percentage2Row = {
				key: '5', name: '% so với ' + benchmark2Name, ...data.reduce((acc, item, index) => {
					const percentage = item.benchmark2 !== 0 ? ((item.value - item.benchmark2) / item.benchmark2) * 100 : 0;
					acc[`col${index}`] = percentage;
					return acc;
				}, {}),
			};
			result.push(percentage2Row);
		}

		return result;
	};

	// Xóa dashboard item
	const handleDeleteDashboardItem = async (item) => {
		Modal.confirm({
			title: `Bạn có chắc muốn xóa thẻ "${item.name}"?`,
			content: 'Thao tác này không thể hoàn tác.',
			okText: 'Xóa',
			okType: 'danger',
			cancelText: 'Hủy',
			onOk: async () => {
				setDeleteLoading(true);
				setDeletingItemId(item.id);
				try {
					await deleteDashBoardItem(item.id);
					// Cập nhật UI ngay lập tức
					setDashboardItems(prev => prev.filter(i => i.id !== item.id));
					message.success('Đã xóa thẻ thành công');
					// Sau đó gọi lại API để đảm bảo đồng bộ
					await loadDashboardItems();
				} catch (error) {
					message.error('Lỗi khi xóa thẻ');
				} finally {
					setDeleteLoading(false);
					setDeletingItemId(null);
				}
			},
		});
	};

	const handleItemUpdate = (updatedItem) => {
		setDashboardItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));

		// Cập nhật modal nếu đang mở
		if (analysisDetailModal.visible && analysisDetailModal.item?.id === updatedItem.id) {
			setAnalysisDetailModal(prev => ({
				...prev,
				item: updatedItem,
				analysis: updatedItem.analysis,
			}));
		}
	};

	return (
		<div style={{
			height: '100%',
			overflow: 'auto',
			position: 'relative',
			background: `linear-gradient(45deg, ${Array.isArray(dashboardColors.background?.gradient) && dashboardColors.background.gradient.length > 0 ? dashboardColors.background.gradient.join(', ') : '#b7b7b7, #979797, #6c6c6c'})`,
			'--color': backgroundColors.color || '#e2e2e2',
			'--dashboard-grid-color': dashboardColors.background?.gridColor || '#ff6b6b',
			'--dashboard-grid-opacity': dashboardColors.background?.gridOpacity || 0.15,
		}} className={styles.container}>
			<style>
				{`
          .actual-row {
            background-color: #f6ffed !important;
          }
          .benchmark-row {
            background-color: #fff7e6 !important;
          }
          .percentage-row {
            background-color: #f0f9ff !important;
          }
          .ant-table-thead > tr > th {
            background-color: #fafafa !important;
            border-bottom: 1px solid #f0f0f0 !important;
            font-weight: 600 !important;
          }
          .ant-table-tbody > tr > td {
            border-bottom: 1px solid #f0f0f0 !important;
          }
          .ant-table-tbody > tr:hover > td {
            background-color: #f5f5f5 !important;
          }
          
          /* Grid Pattern Background - Fixed for scrolling */
          .${styles.container}::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              linear-gradient(90deg, var(--dashboard-grid-color) 1px, transparent 1px), 
              linear-gradient(0deg, var(--dashboard-grid-color) 1px, transparent 1px);
            background-size: 20px 20px;
            background-attachment: fixed;
            opacity: var(--dashboard-grid-opacity);
            pointer-events: none;
            z-index: 0;
          }
          
          /* Alternative approach: Use background-attachment: local for better scrolling */
          .${styles.container} {
            background-image: 
              linear-gradient(90deg, var(--dashboard-grid-color) 1px, transparent 1px), 
              linear-gradient(0deg, var(--dashboard-grid-color) 1px, transparent 1px);
            background-size: 20px 20px;
            background-attachment: local;
            background-position: 0 0;
            background-repeat: repeat;
          }
          
          /* Ensure content is above grid */
          .${styles.container} > * {
            position: relative;
            z-index: 1;
          }
          
          /* Fallback grid pattern if CSS variables fail */
          .${styles.container}::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              linear-gradient(90deg, rgba(255, 107, 107, 0.15) 1px, transparent 1px), 
              linear-gradient(0deg, rgba(255, 107, 107, 0.15) 1px, transparent 1px);
            background-size: 20px 20px;
            background-attachment: fixed;
            opacity: 0.15;
            pointer-events: none;
            z-index: 0;
            display: none;
          }
          
          /* Show fallback if CSS variables are not working */
          .${styles.container}:not([style*="--dashboard-grid-color"])::after {
            display: block;
          }
        `}
			</style>
			{isLoading && (
				<div style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: 'rgba(255, 255, 255, 0.5)',
					backdropFilter: 'blur(10px)',
					zIndex: 1000,
				}}>
					<Loading3DTower />
				</div>
			)}
			{/* Main Content */}
			<div className={styles.mainContent}>
				<div
					className={styles.headerTitle}
					style={{
						background: dashboardColors.headerTitle?.useImage && dashboardColors.headerTitle?.imageUrl
							? `url(${dashboardColors.headerTitle.imageUrl}) center/cover no-repeat`
							: (dashboardColors.headerTitle?.bgColor || 'blue'),
						color: dashboardColors.headerTitle?.textColor || 'white',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: '20px',
					}}
				>
					<div>
						<h1 style={{ fontSize: '30px' }}>TRUNG TÂM PHÂN TÍCH KINH DOANH</h1>
						<span style={{
							fontSize: '18px',
							fontWeight: '400',
							color: dashboardColors.headerTitle?.textColor || 'white',
						}}>Đo lường - phân tích chỉ số</span>
					</div>

					{/* Countdown Section */}
					<div style={{ display: 'flex', gap: '30px' }}>
						{/* Fixed countdowns */}
						<div style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							textAlign: 'center',
						}}>
							<div style={{
								width: '60px',
								height: '60px',
								borderRadius: '50%',
								border: '2px solid ' + (dashboardColors.headerTitle?.textColor || 'white'),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								marginBottom: '8px',
							}}>
								<div style={{
									fontSize: '28px',
									fontWeight: '700',
									color: dashboardColors.headerTitle?.textColor || 'white',
									lineHeight: 1,
								}}>
									{daysInMonth}
								</div>
							</div>
							<div style={{
								fontSize: '12px',
								fontWeight: '500',
								color: dashboardColors.headerTitle?.textColor || 'white',
								textAlign: 'center',
								maxWidth: '100px',
								lineHeight: 1.2,
							}}>
								Ngày còn lại trong tháng {monthDisplay}
							</div>
						</div>

						<div style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							textAlign: 'center',
						}}>
							<div style={{
								width: '60px',
								height: '60px',
								borderRadius: '50%',
								border: '2px solid ' + (dashboardColors.headerTitle?.textColor || 'white'),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								marginBottom: '8px',
							}}>
								<div style={{
									fontSize: '28px',
									fontWeight: '700',
									color: dashboardColors.headerTitle?.textColor || 'white',
									lineHeight: 1,
								}}>
									{daysInYear}
								</div>
							</div>
							<div style={{
								fontSize: '12px',
								fontWeight: '500',
								color: dashboardColors.headerTitle?.textColor || 'white',
								textAlign: 'center',
								maxWidth: '100px',
								lineHeight: 1.2,
							}}>
								Ngày còn lại đến hết năm {yearDisplay}
							</div>
						</div>

						{/* First 3 countdown items */}
						{Array.isArray(countdownItems) && countdownItems.length > 0 && countdownItems.slice(0, 3).map((it) => {
							const now = currentTime instanceof Date ? currentTime : new Date();
							const target = new Date(it.target);
							const isExpired = target <= now;

							return (
								<div key={it.id} style={{
									display: 'flex',
									flexDirection: 'column',
									// alignItems: 'center',
									// textAlign: 'center',
								}}>
									<div style={{
										width: '60px',
										height: '60px',
										borderRadius: '50%',
										border: '2px solid ' + (dashboardColors.headerTitle?.textColor || 'white'),
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										marginBottom: '8px',
									}}>
										<div style={{
											fontSize: '32px',
											fontWeight: '700',
											color: dashboardColors.headerTitle?.textColor || 'white',
											lineHeight: 1,
										}}>
											{computeRemaining(it.target, it.unit)}
										</div>
									</div>
									<div style={{
										fontSize: '12px',
										fontWeight: '500',
										color: dashboardColors.headerTitle?.textColor || 'white',
										textAlign: 'center',
										maxWidth: '100px',
										lineHeight: 1.2,
									}}>
										{it.description}
									</div>
								</div>
							);
						})}
					</div>
				</div>
				<div className={styles.contentContainer}>
					<Card className={styles.controlsCard}>
						<div className={styles.header}>
							{/* Business Tags Section */}
							<div className={styles.businessTagsContainer}>
								<div className={styles.businessTagsHeader}>
									<Text type="secondary" className={styles.businessTagsLabel}>
										Function:
									</Text>
									<Space size={4} wrap style={{ flex: 1 }}>
										{(showAllBusinessTags ? businessTags : businessTags.slice(0, window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6)).map((tag) => (
											<Button
												key={`business-${tag}`}
												type="default"
												size={window.innerWidth <= 480 ? 'small' : 'small'}
												style={{
													fontSize: window.innerWidth <= 480 ? '11px' : '13px',
													padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
													height: window.innerWidth <= 480 ? '24px' : '28px',
													minWidth: window.innerWidth <= 480 ? 'auto' : '60px',
													backgroundColor: selectedBusinessTags.includes(tag) ? '#ECECEC' : undefined,
													borderColor: selectedBusinessTags.includes(tag) ? '#ECECEC' : undefined,
													fontWeight: selectedBusinessTags.includes(tag) ? '600' : '400',
												}}
												onClick={() => {
													if (tag === 'All') {
														setSelectedBusinessTags(['All']);
													} else {
														const newTags = selectedBusinessTags.includes(tag) ? selectedBusinessTags.filter(t => t !== tag) : [...selectedBusinessTags.filter(t => t !== 'All'), tag];
														setSelectedBusinessTags(newTags.length === 0 ? ['All'] : newTags);
													}
												}}
											>
												{tag}
											</Button>))}
										{!showAllBusinessTags && businessTags.length > (window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6) && (window.innerWidth <= 768 ? (
											<Dropdown
												menu={{
													items: businessTags.slice(window.innerWidth <= 480 ? 3 : 4).map((tag) => ({
														key: tag, label: (<div style={{
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'space-between',
														}}>
															<span>{tag}</span>
															{selectedBusinessTags.includes(tag) &&
																<CheckOutlined
																	style={{ color: selectedColors[0]?.color || '#13C2C2' }} />}
														</div>), onClick: () => {
															if (tag === 'All') {
																setSelectedBusinessTags(['All']);
															} else {
																const newTags = selectedBusinessTags.includes(tag) ? selectedBusinessTags.filter(t => t !== tag) : [...selectedBusinessTags.filter(t => t !== 'All'), tag];
																setSelectedBusinessTags(newTags.length === 0 ? ['All'] : newTags);
															}
														},
													})),
												}}
												trigger={['click']}
												placement="bottomLeft"
											>
												<Button
													size={window.innerWidth <= 480 ? 'small' : 'small'}
													style={{
														fontSize: window.innerWidth <= 480 ? '11px' : '13px',
														padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
														height: window.innerWidth <= 480 ? '24px' : '28px',
													}}
												>
													+{businessTags.length - (window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6)}
												</Button>
											</Dropdown>) : (<Button
											size={window.innerWidth <= 480 ? 'small' : 'small'}
											style={{
												fontSize: window.innerWidth <= 480 ? '11px' : '13px',
												padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
												height: window.innerWidth <= 480 ? '24px' : '28px',
											}}
											onClick={() => setShowAllBusinessTags(true)}
										>
											+{businessTags.length - (window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6)}
										</Button>))}
										{showAllBusinessTags && (<Button
											size={window.innerWidth <= 480 ? 'small' : 'small'}
											style={{
												fontSize: window.innerWidth <= 480 ? '11px' : '13px',
												padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
												height: window.innerWidth <= 480 ? '24px' : '28px',
											}}
											onClick={() => setShowAllBusinessTags(false)}
										>
											Thu gọn
										</Button>)}
									</Space>
								</div>
							</div>

							{/* Store Tags Section */}
							<div style={{
								flex: window.innerWidth <= 768 ? '1' : '1',
								minWidth: window.innerWidth <= 768 ? 'auto' : '200px',
							}}>
								<div style={{
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									flexWrap: 'wrap',
								}}>
									<Text type="secondary" style={{
										fontSize: window.innerWidth <= 480 ? 11 : 12,
										fontWeight: 500,
										whiteSpace: 'nowrap',
									}}>
										Unit:
									</Text>
									<Space size={4} wrap style={{ flex: 1 }}>
										{(showAllStoreTags ? storeTags : storeTags.slice(0, window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6)).map((tag) => (
											<Button
												key={`store-${tag}`}
												type="default"
												size={window.innerWidth <= 480 ? 'small' : 'small'}
												style={{
													fontSize: window.innerWidth <= 480 ? '11px' : '13px',
													padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
													height: window.innerWidth <= 480 ? '24px' : '28px',
													minWidth: window.innerWidth <= 480 ? 'auto' : '60px',
													backgroundColor: selectedStoreTags.includes(tag) ? '#ECECEC' : undefined,
													borderColor: selectedStoreTags.includes(tag) ? '#ECECEC' : undefined,
													fontWeight: selectedStoreTags.includes(tag) ? '600' : '400',
												}}
												onClick={() => {
													setSelectedStoreTags([tag]);
												}}
											>
												{tag}
											</Button>))}
										{!showAllStoreTags && storeTags.length > (window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6) && (window.innerWidth <= 768 ? (
											<Dropdown
												menu={{
													items: storeTags.slice(window.innerWidth <= 480 ? 3 : 4).map((tag) => ({
														key: tag, label: (<div style={{
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'space-between',
														}}>
															<span>{tag}</span>
															{selectedStoreTags.includes(tag) &&
																<CheckOutlined
																	style={{ color: selectedColors[0]?.color || '#13C2C2' }} />}
														</div>), onClick: () => {
															setSelectedStoreTags([tag]);
														},
													})),
												}}
												trigger={['click']}
												placement="bottomLeft"
											>
												<Button
													size={window.innerWidth <= 480 ? 'small' : 'small'}
													style={{
														fontSize: window.innerWidth <= 480 ? '11px' : '13px',
														padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
														height: window.innerWidth <= 480 ? '24px' : '28px',
													}}
												>
													+{storeTags.length - (window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6)}
												</Button>
											</Dropdown>) : (<Button
											size={window.innerWidth <= 480 ? 'small' : 'small'}
											style={{
												fontSize: window.innerWidth <= 480 ? '11px' : '13px',
												padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
												height: window.innerWidth <= 480 ? '24px' : '28px',
											}}
											onClick={() => setShowAllStoreTags(true)}
										>
											+{storeTags.length - (window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6)}
										</Button>))}
										{showAllStoreTags && (<Button
											size={window.innerWidth <= 480 ? 'small' : 'small'}
											style={{
												fontSize: window.innerWidth <= 480 ? '11px' : '13px',
												padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
												height: window.innerWidth <= 480 ? '24px' : '28px',
											}}
											onClick={() => setShowAllStoreTags(false)}
										>
											Thu gọn
										</Button>)}
									</Space>
								</div>
							</div>

							<div className={styles.headerCacheButton}>
								<Button
									size="small"
									type="primary"
									style={{
										fontSize: window.innerWidth <= 480 ? '11px' : '13px',
										padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
										height: window.innerWidth <= 480 ? '24px' : '28px',
										minWidth: window.innerWidth <= 480 ? 'auto' : '60px',
									}}
									onClick={async () => {
										try {
											// Xóa toàn bộ cache trước để đảm bảo xóa hết
											const { clearAllTemplateCache } = await import('../../../../utils/templateRowUtils.js');
											const deletedCount = await clearAllTemplateCache();
											// Tải lại cache mới với forceRefresh, mặc định pageSize = 5000
											const { templateRowCacheService } = await import('../../../../utils/templateRowUtils.js');

											const requests = approvedVersions.map(version => ({
												idTemplate: version.id_template,
												idVersion: version.id_version,
												page: 1,
												pageSize: 5000, // Mặc định luôn là 5000
											}));

											await templateRowCacheService.getMultipleTemplateRows(requests, true); // forceRefresh = true
											message.success(`Cache refreshed successfully. Cleared ${deletedCount} old records, preloaded ${requests.length} new entries.`);
										} catch (error) {
											message.error('Cache refresh failed: ' + error.message);
										}
									}}
									disabled={approvedVersions.length === 0}
								>
									Refresh Cache
								</Button>
								<div>
									<Button type="default" size="small"
											style={{
												fontSize: window.innerWidth <= 480 ? '11px' : '13px',
												padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
												height: window.innerWidth <= 480 ? '24px' : '28px',
												minWidth: window.innerWidth <= 480 ? 'auto' : '60px',
											}} onClick={handleExportHtml}
											icon={<ExportOutlined />}
											loading={isExporting} disabled={isExporting}>Export HTML</Button>
								</div>
							</div>
						</div>
						<Space direction="vertical" size={0} className={styles.controlsContainer}>
							{/* Optimized Controls - All on one line */}
							<div className={styles.controlsRow}>
								<div className={styles.defaultItem}>
									<DefaultDashboardCardByItem
										ref={defaultDashboardCardRef}
										key={`default-dashboard-${selectedStoreTags.join('-')}`}
										onUpdate={() => {
											// Reload dashboard items when default card is updated
											loadDashboardItems();
										}}
										selectedStoreTags={selectedStoreTags}
										// PIN Security props (chỉ cần thiết cho modal cấu hình AI)
										setShowPinModal={setShowPinModal}
										pinInput={pinInput}
										setPinInput={setPinInput}
										pinError={pinError}
										setPinError={setPinError}
										savedPin={savedPin}
										isPinVerified={isPinVerified}
										setIsPinVerified={setIsPinVerified}
										handleVerifyPin={handleVerifyPin}
										// Setup PIN props
										showSetupPinModal={showSetupPinModal}
										setShowSetupPinModal={setShowSetupPinModal}
										newPin={newPin}
										setNewPin={setNewPin}
										confirmPin={confirmPin}
										setConfirmPin={setConfirmPin}
										setupPinError={setupPinError}
										setSetupPinError={setSetupPinError}
										handleSetupPin={handleSetupPin}
										// Change PIN props
										setShowChangePinModal={setShowChangePinModal}
									/>
								</div>
								<div style={{
									display: 'flex',
									gap: 8,
									flexWrap: 'wrap',
									justifyContent: window.innerWidth <= 768 ? 'start' : 'flex-end',
									flex: window.innerWidth <= 768 ? '2' : '0 0 auto',
								}}>
									<div className={styles.searchContainer}>
										<Input
											placeholder="Tìm kiếm chỉ số..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											prefix={<SearchOutlined />}
											className={styles.searchInput}
										/>
									</div>

									{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
										<>
											<Tooltip
												title={
													isAnalyzingAll
														? `Đang phân tích... (${analyzeAllProgress.current}/${analyzeAllProgress.total})`
														: lastAnalyzeTime
															? `Phân tích tất cả items. Lần gần nhất: ${new Date(lastAnalyzeTime).toLocaleString('vi-VN')}`
															: 'Phân tích tất cả items'
												}>
												<Button
													size={window.innerWidth <= 480 ? 'small' : 'middle'}
													loading={isAnalyzingAll}
													onClick={handleAnalyzeAllWithConfirm}
													disabled={isAnalyzingAll}
													style={{
														fontSize: window.innerWidth <= 480 ? '11px' : '13px',
													}}
												>
													{isAnalyzingAll ? `Phân tích... (${analyzeAllProgress.current}/${analyzeAllProgress.total})` : 'Phân tích tất cả'}
												</Button>
											</Tooltip>
											<Tooltip
												title={
													isAutoAnalyzeEnabled
														? `Tự động phân tích mỗi 6h. \nLần tiếp theo: ${nextAutoAnalyzeTime ? new Date(nextAutoAnalyzeTime).toLocaleString('vi-VN') : 'Đang tính...'}`
														: 'Bật tự động phân tích mỗi 6h'
												}>
												<Button
													size={window.innerWidth <= 480 ? 'small' : 'middle'}
													icon={<FieldTimeOutlined />}
													onClick={toggleAutoAnalyze}
													disabled={isAnalyzingAll}
													style={{
														fontSize: window.innerWidth <= 480 ? '11px' : '13px',
														color: isAutoAnalyzeEnabled ? '#1890ff' : '#8c8c8c',
													}}
												>
												</Button>
											</Tooltip>

										</>
									)}
									{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
										<Tooltip title="Thêm thẻ mới">
											<Button
												icon={<PlusOutlined />}
												size={window.innerWidth <= 480 ? 'small' : 'middle'}
												onClick={handleOpenNewCardModal}
												style={{
													fontSize: window.innerWidth <= 480 ? '11px' : '13px',
												}}
											/>
										</Tooltip>)}
									<Button
										type={arrangeMode ? 'primary' : 'default'}
										icon={<AppstoreOutlined />}
										size={window.innerWidth <= 480 ? 'small' : 'middle'}
										onClick={() => {
											const list = dashboardItems
												.filter(it => canAccessDashboardItem(it) && it.id < 100000)
												.map(it => ({ id: it.id, name: it.name, order: it.info?.order ?? 0 }))
												.sort((a, b) => a.order - b.order);
											setOrderItems(list);
											setShowOrderModal(true);
										}}
										style={{
											fontSize: window.innerWidth <= 480 ? '11px' : '13px',
										}}
									>

									</Button>
									{/* {window.innerWidth > 1024 && (
										<Tooltip title={`Chuyển sang ${gridMode === 3 ? '2' : '3'} thẻ mỗi hàng`}>
											<Button
												icon={gridMode === 3 ? <AppstoreAddOutlined /> : <AppstoreOutlined />}
												size={window.innerWidth <= 480 ? 'small' : 'middle'}
												onClick={() => setGridMode(gridMode === 3 ? 2 : 3)}
												style={{
													fontSize: window.innerWidth <= 480 ? '11px' : '13px',
												}}
											/>
										</Tooltip>)} */}
									<Dropdown
										menu={{
											items: [
												{
													key: 'userClass',
													label: 'Quản lý quyền truy cập',
													icon: <SafetyOutlined />,
													onClick: () => handleOpenUserClassModal(),
												},
												// {
												// 	key: 'showAnalysis',
												// 	label: showAnalysis ? 'Ẩn phân tích' : 'Hiện phân tích',
												// 	icon: showAnalysis ? <EyeInvisibleOutlined /> : <EyeOutlined />,
												// 	onClick: () => setShowAnalysis(!showAnalysis),
												// },
												...(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) ? [
													{
														key: 'tagSettings',
														label: 'Cài đặt Tags',
														icon: <TagsOutlined />,
														onClick: handleOpenTagSettings,
													},
													{
														key: 'promptSettings',
														label: 'Cài đặt Prompt mặc định',
														icon: <SettingOutlined />,
														onClick: handleOpenPromptSettings,
													},
												] : [],
												...(currentUser?.isSuperAdmin) ? [
													{
														key: 'backgroundSettings',
														label: 'Cài đặt giao diện',
														icon: <Image size={13} color="#262626" strokeWidth={1.5} />,
														onClick: handleOpenBackgroundModal,
													},
												] : [],
											],
										}}
										placement="bottomRight"
									>
										<Button
											icon={<ChevronDown fontSize={14} color="#8c8c8c" strokeWidth={1.5} />}
											size={window.innerWidth <= 480 ? 'small' : 'middle'}
											style={{
												fontSize: window.innerWidth <= 480 ? '11px' : '13px',
											}}
										>
										</Button>
									</Dropdown>
								</div>
							</div>

							{arrangeMode && (<div style={{
								backgroundColor: '#eff6ff',
								border: '1px solid #bfdbfe',
								borderRadius: 8,
								padding: 12,
							}}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Text style={{ fontSize: 12, color: '#1d4ed8' }}>
										Chế độ sắp xếp: Sử dụng nút ↑ ↓ trên mỗi thẻ để thay đổi thứ tự hiển thị
									</Text>
									<Button size="small" onClick={() => {
										const list = dashboardItems
											.filter(it => canAccessDashboardItem(it) && it.id < 100000)
											.map(it => ({ id: it.id, name: it.name, order: it.info?.order ?? 0 }))
											.sort((a, b) => a.order - b.order);
										setOrderItems(list);
										setShowOrderModal(true);
									}}>
										Cài thứ tự
									</Button>
								</div>
							</div>)}

							{/* Optimized Tag Selection Interface */}
							<div style={{
								display: 'flex',
								flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
								gap: window.innerWidth <= 768 ? 12 : 16,
								alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
								flexWrap: 'wrap',
							}}>
								{/* Business Tags Section */}
								<div style={{
									flex: window.innerWidth <= 768 ? '1' : '1',
									minWidth: window.innerWidth <= 768 ? 'auto' : '200px',
								}}>
								</div>
							</div>
						</Space>
					</Card>
				</div>

				{/* Analyze All Configuration Modal */}
				<Modal
					title="Phân tích tất cả - Cấu hình"
					open={showAnalyzeAllModal}
					onCancel={() => setShowAnalyzeAllModal(false)}
					width={800}
					footer={[
						<Button key="cancel" onClick={() => setShowAnalyzeAllModal(false)}>Hủy</Button>,
						<Button
							key="ok"
							type="primary"
							loading={isAnalyzingAll}
							onClick={() => {
								setShowAnalyzeAllModal(false);
								handleAnalyzeAll();
							}}
						>
							Bắt đầu phân tích
						</Button>,
					]}
				>
					<Space direction="vertical" size={12} style={{ width: '100%' }}>
						<div>
							<Text strong>Model AI</Text>
							<Select
								style={{ width: '100%', marginTop: 6 }}
								value={analyzeAllModel || selectedAIModel}
								onChange={(v) => setAnalyzeAllModel(v)}
								showSearch
								placeholder="Chọn model"
								filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
								options={(MODEL_AI_LIST_DB || MODEL_AI_LIST || []).map(m => ({
									label: m.name || m,
									value: m.value || m,
								}))}
							/>
							<Text type="secondary" style={{ fontSize: 12 }}>Bạn có thể để trống để dùng model đang chọn
								hiện tại.</Text>
						</div>
						<div>
							<Text strong>Prompt chung áp dụng cho tất cả phần tử (trừ tổng quan)</Text>
							<Input.TextArea
								value={analyzeAllPrompt}
								onChange={(e) => setAnalyzeAllPrompt(e.target.value)}
								rows={10}
								placeholder="Nhập prompt chung..."
							/>
							<Text type="secondary" style={{ fontSize: 12 }}>
								Nếu để trống, hệ thống sẽ dùng Prompt Cài đặt mặc định.
							</Text>
						</div>
					</Space>
				</Modal>

				{/* Order Config Modal */}
				<Modal
					open={showOrderModal}
					title="Cài đặt thứ tự thẻ"
					onCancel={() => setShowOrderModal(false)}
					footer={[
						<Button key="cancel" onClick={() => setShowOrderModal(false)}>Hủy</Button>,
						<Button key="save" type="primary" loading={savingOrder} onClick={async () => {
							try {
								setSavingOrder(true);
								// Persist all orders according to their index
								const payloads = orderItems.map((it, idx) => {
									const original = dashboardItems.find(d => d.id === it.id);
									return original ? updateDashBoardItem({
										...original,
										info: { ...(original.info || {}), order: idx },
									}) : Promise.resolve();
								});
								await Promise.all(payloads);
								// Update local state
								setDashboardItems(prev => prev.map(d => {
									const idx = orderItems.findIndex(x => x.id === d.id);
									return idx >= 0 ? { ...d, info: { ...(d.info || {}), order: idx } } : d;
								}));
								setShowOrderModal(false);
							} finally {
								setSavingOrder(false);
							}
						}}>Lưu</Button>,
					]}
					width={520}
				>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{orderItems.filter(it => it.id < 100000).map((it, idx) => (
							<div key={it.id} style={{
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								border: '1px solid #eee',
								borderRadius: 6,
								padding: 8,
							}}>
								<span style={{ width: 28, textAlign: 'center' }}>{idx + 1}</span>
								<span style={{ flex: 1 }}>{it.name}</span>
								<Button size="small" disabled={idx === 0} onClick={() => {
									const arr = [...orderItems];
									[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
									setOrderItems(arr);
								}}>↑</Button>
								<Button size="small" disabled={idx === orderItems.length - 1} onClick={() => {
									const arr = [...orderItems];
									[arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
									setOrderItems(arr);
								}}>↓</Button>
							</div>
						))}
					</div>
				</Modal>

				{/* Metrics Grid */}

				<Row gutter={[24, 24]} style={{ maxWidth: '100%', margin: '0 16px' }} className={styles.metricsGrid}>
					{filteredMetrics.filter(item => item.id < 100000).map((item, index) => (<Col
						key={item.id}
						xs={24}
						sm={24}
						md={24}
						lg={gridMode === 3 ? 8 : 0}
						xl={gridMode === 3 ? 8 : 0}
						style={{ position: 'relative' }}
						className={styles.metricsGridCol}
					>
						<Card
							className={styles.metricsGridCard}
							style={{
								cursor: 'pointer',
								border: arrangeMode ? '1px solid #93c5fd' : undefined,
								boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.2)',
								height: 500,
								overflow: 'hidden',
								position: 'relative',
								paddingBottom: '60px',
								borderRadius: 3,
								transition: 'all 0.3s ease', // thêm transition mượt

							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
								e.currentTarget.style.transform = 'translateY(-4px)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
								e.currentTarget.style.transform = 'translateY(0)';
							}}
						>

							{arrangeMode && (<div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
								<Space direction="vertical" size={4}>
									{item.id < 100000 && (<Button
										size="small"
										icon={<ArrowUpOutlined />}
										onClick={() => moveMetric(item.id, 'up')}
										disabled={index === 0}
									/>)}
									{item.id < 100000 && (<Button
										size="small"
										icon={<ArrowDownOutlined />}
										onClick={() => moveMetric(item.id, 'down')}
										disabled={index === filteredMetrics.length - 1}
									/>)}
								</Space>
							</div>)}

							{/* Main Content Container - Scrollable */}
							<div style={{
								height: 'calc(100% - 60px)', overflow: 'hidden',
								padding: 8,
							}}>
								{item.type === 'chart' ? (<>
									<div>
										<div style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: 8,
										}}>
											<Title level={4} style={{
												lineHeight: 1.4,
												margin: 0,
												flex: 1,
												fontWeight: 600,
												color: '#262626',
											}}>
												{item.name}
											</Title>
											<div style={{ display: 'flex', gap: 4 }}>
												<Button
													size="small"
													icon={<InfoCircleOutlined style={{ color: '#1677ff' }} />}
													onClick={(e) => {
														e.stopPropagation();
														setKpi2InfoId(item.idData);
														setKpi2InfoDashboardItemId(item.id);
														setShowKpi2InfoModal(true);
													}}
													title="Xem thành phần"
												/>

												{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
													<>

														<Button
															size="small"
															icon={<SettingOutlined style={{ color: '#acacac' }} />}
															onClick={(e) => {
																e.stopPropagation();
																handleOpenEditModal(item);
															}}
															title="Cài đặt"
														/>
														<Button
															size="small"
															icon={<SafetyOutlined style={{ color: '#acacac' }} />}
															onClick={(e) => {
																e.stopPropagation();
																handleOpenUserClassModal(item);
															}}
															title="Cài đặt quyền"
														/>
														<Button
															size="small"
															danger
															loading={deleteLoading && deletingItemId === item.id}
															onClick={(e) => {
																e.stopPropagation();
																handleDeleteDashboardItem(item);
															}}
														>
															<Trash color="#ff8882" size={13} />
														</Button>
													</>
												)}
											</div>
										</div>

										<Flex align="baseline" gap={8}>
											<h2 style={{ margin: 0, padding: 0 }}>
												{(() => {
													let dataArray = tableData[item.id];
													if (!dataArray || dataArray.length === 0) {
														return '-';
													}
													dataArray = dataArray.filter(item => item.value !== undefined && !isNaN(item.value) && item.value !== Infinity && item.value !== -Infinity);

													// Tìm giá trị cuối cùng có sẵn
													let lastValue;
													for (let i = dataArray.length - 1; i >= 0; i--) {
														const value = dataArray[i]?.value;
														if (value !== undefined && !isNaN(value)) {
															lastValue = value;
															break;
														}
													}

													if (lastValue !== undefined) {
														return lastValue.toLocaleString('vn-VN', {
															minimumFractionDigits: 0,
															maximumFractionDigits: 2,
															useGrouping: true,
														});
													}
													return '-';
												})()}
											</h2>
											{(() => {
												let data = tableData[item.id];
												if (data && data.length >= 2) {
													data = data.filter(item => item.value !== undefined && !isNaN(item.value) && item.value !== Infinity && item.value !== -Infinity);
													const currentValue = data[data.length - 1]?.value;
													const previousValue = data[data.length - 2]?.value;

													if (currentValue !== undefined && previousValue !== undefined && !isNaN(currentValue) && !isNaN(previousValue) && previousValue !== 0) {

														const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
														const isPositive = percentageChange >= 0;

														return (<div style={{
															display: 'flex',
															alignItems: 'center',
															gap: '4px',
															fontSize: '14px',
															fontWeight: '500',
															color: isPositive ? '#10b981' : '#ef4444',
														}}>
															<span>{isPositive ? '↗' : '↘'}</span>
															<span>{Math.abs(percentageChange).toFixed(1)}%</span>
														</div>);
													}
												}
												return null;
											})()}
										</Flex>
									</div>

									<div style={{ display: 'flex', justifyContent: 'center' }}>
										{chartOptions[item.id] ? (<div style={{
											width: '100%', height: showAnalysis ? '320px' : '400px',
										}} data-export-card-id={`card-${item.id}`}
																	   data-export-chart-id={`chart-${item.id}`}>
											{/* Recent periods indicator */}
											{item.settings?.recentPeriods > 0 && (
												<div style={{
													textAlign: 'center',
													marginBottom: '8px',
													fontSize: '12px',
													color: '#666',
													fontStyle: 'italic',
												}}>
													Đang hiển thị {item.settings.recentPeriods} kỳ gần nhất
												</div>
											)}
											<AgCharts options={chartOptions[item.id]}
													  style={{ height: showAnalysis ? '300px' : '360px' }}
											/>

										</div>) : (<div style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											height: '100%',
											backgroundColor: '#fafafa',
											borderRadius: '6px',
											border: '1px solid #d9d9d9',
										}}>
											<Button
												type="primary"
												size="small"
												onClick={() => loadChartData(item)}
												loading={loading}
											>
												Đang tải dữ liệu ...
											</Button>
										</div>)}

									</div>
								</>) : item.type === 'comparison' ? (
									<>
										<div>
											<div style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												marginBottom: 8,
											}}>
												<Title level={4} style={{
													lineHeight: 1.4,
													margin: 0,
													flex: 1,
													fontWeight: 600,
													color: '#262626',
												}}>
													{item.name}
												</Title>
												<div style={{ display: 'flex', gap: 4 }}>
													<Button
														size="small"
														icon={<SettingOutlined style={{ color: '#acacac' }} />}
														onClick={(e) => {
															e.stopPropagation();
															handleOpenEditModal(item);
														}}
														title="Cài đặt"
													/>

													{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
														<Button
															size="small"
															icon={<SafetyOutlined style={{ color: '#acacac' }} />}
															onClick={(e) => {
																e.stopPropagation();
																handleOpenUserClassModal(item);
															}}
															title="Cài đặt quyền"
														/>)}

													{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
														<Button
															size="small"
															danger
															loading={deleteLoading && deletingItemId === item.id}
															onClick={(e) => {
																e.stopPropagation();
																handleDeleteDashboardItem(item);
															}}
														>
															<Trash color="#ff8882" size={13} />
														</Button>)}
												</div>
											</div>
										</div>

										<div
											style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
											{chartOptions[item.id] ? (
												<div style={{ width: '100%' }} data-export-card-id={`card-${item.id}`}
													 data-export-chart-id={`chart-${item.id}`}>
													{/* Recent periods indicator */}
													{item.settings?.recentPeriods > 0 && (
														<div style={{
															textAlign: 'center',
															marginBottom: '8px',
															fontSize: '12px',
															color: '#666',
															fontStyle: 'italic',
														}}>
															Đang hiển thị {item.settings.recentPeriods} kỳ gần nhất
														</div>
													)}
													<AgCharts options={chartOptions[item.id]}
															  style={{ height: !showAnalysis ? '400px' : '330px' }} />

												</div>) : (<div style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												backgroundColor: '#fafafa',
												borderRadius: '6px',
												border: '1px solid #d9d9d9',
											}}>
												<Button
													type="primary"
													size="small"
													onClick={() => loadComparisonData(item)}
													loading={loading}
												>
													Đang tải dữ liệu ...
												</Button>
											</div>)}
										</div>
									</>) : item.type === 'table' ? (
									<>
										{(() => {
											return null;
										})()}
										<div>
											<div style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												marginBottom: 8,
											}}>
												<Title level={4} style={{
													lineHeight: 1.4,
													margin: 0,
													flex: 1,
													fontWeight: 600,
													color: '#262626',
												}}>
													{item.name}
												</Title>
												<div style={{ display: 'flex', gap: 4 }}>
													<Button
														size="small"
														icon={<SettingOutlined style={{ color: '#acacac' }} />}
														onClick={(e) => {
															e.stopPropagation();
															handleOpenEditModal(item);
														}}
														title="Cài đặt"
													/>

													{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
														<Button
															size="small"
															icon={<SafetyOutlined style={{ color: '#acacac' }} />}
															onClick={(e) => {
																e.stopPropagation();
																handleOpenUserClassModal(item);
															}}
															title="Cài đặt quyền"
														/>)}

													{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
														<Button
															size="small"
															danger
															loading={deleteLoading && deletingItemId === item.id}
															onClick={(e) => {
																e.stopPropagation();
																handleDeleteDashboardItem(item);
															}}
														>
															<Trash color="#ff8882" size={13} />
														</Button>)}
												</div>
											</div>
										</div>

										{/* Date Range Filter */}
										{item.settings?.dateColumn && (<div style={{
											marginBottom: 12,
											padding: '8px 12px',
											backgroundColor: '#f5f5f5',
											borderRadius: '6px',
										}}
																			className={styles.dateRangeFilter}
																			onClick={(e) => e.stopPropagation()} // Chặn click ở container
										>
											<Space size="small" align="center">
												<DatePicker.RangePicker
													className={styles.dateRangePicker}
													size="small"
													style={{ width: 180 }}
													placeholder={['Từ ngày', 'Đến ngày']}
													value={tableDateRanges[item.id] || null}
													onChange={(dates) => {
														setTableDateRanges(prev => ({
															...prev, [item.id]: dates,
														}));
														// Clear quick date range when manual date is selected
														setTableQuickDateRanges(prev => ({
															...prev, [item.id]: null,
														}));
													}}
													format="DD/MM/YYYY"
												/>
												<Select
													className={styles.dateRangeSelect}
													size="small"
													style={{ width: 'auto' }}
													placeholder="Chọn nhanh"
													value={(() => {
														const userSelection = tableQuickDateRanges[item.id];
														const defaultSetting = item.settings?.dateRange;
														const finalValue = userSelection || (defaultSetting ? defaultSetting : undefined);
														return finalValue;
													})()}
													onChange={(value) => {
														setTableQuickDateRanges(prev => ({
															...prev, [item.id]: value,
														}));
														// Clear manual date range when quick option is selected
														setTableDateRanges(prev => ({
															...prev, [item.id]: null,
														}));
													}}
													allowClear
												>
													<Option value="today">Hôm nay</Option>
													<Option value="yesterday">Hôm qua</Option>
													<Option value="thisWeek">Tuần này</Option>
													<Option value="lastWeek">Tuần trước</Option>
													<Option value="thisMonth">Tháng này</Option>
													<Option value="lastMonth">Tháng trước</Option>
													<Option value="last7Days">7 ngày gần nhất</Option>
													<Option value="last15Days">15 ngày gần nhất</Option>
													<Option value="last30Days">30 ngày gần nhất</Option>
													<Option value="all">Tất cả dữ liệu</Option>
												</Select>
												{(tableDateRanges[item.id] && (tableDateRanges[item.id][0] || tableDateRanges[item.id][1])) && (
													<Button
														size="small"
														onClick={() => {
															setTableDateRanges(prev => ({
																...prev, [item.id]: null,
															}));
														}}
													>
														<ListRestart size={16} />
													</Button>)}
												{tableQuickDateRanges[item.id] && (<Button
													size="small"
													onClick={() => {
														setTableQuickDateRanges(prev => ({
															...prev, [item.id]: null,
														}));
													}}
												>
													<ListRestart size={16} />
												</Button>)}
												{/* Column Filter */}
												{item.settings?.filterColumn && (
													<div style={{
														backgroundColor: '#f5f5f5',
														borderRadius: '6px',
													}}
														 className={styles.columnFilter}
														 onClick={(e) => e.stopPropagation()}
													>
														<Space size="small" align="center">
															<Select
																size="small"
																style={{ width: 150 }}
																placeholder="Chọn giá trị"
																value={tableColumnFilters[item.id] || 'all'}
																onChange={(value) => {
																	setTableColumnFilters(prev => ({
																		...prev, [item.id]: value,
																	}));
																}}
																allowClear
															>
																<Option value="all">Tất cả</Option>
																{(() => {
																	const data = tableData[item.id] || [];
																	const uniqueValues = [...new Set(data.map(row => row[item.settings.filterColumn]).filter(Boolean))];
																	return uniqueValues.map(value => (
																		<Option key={value} value={value}>
																			{value}
																		</Option>
																	));
																})()}
															</Select>
															{tableColumnFilters[item.id] && tableColumnFilters[item.id] !== 'all' && (
																<Button
																	size="small"
																	onClick={() => {
																		setTableColumnFilters(prev => ({
																			...prev, [item.id]: 'all',
																		}));
																	}}
																>
																	<ListRestart size={16} />
																</Button>
															)}
														</Space>
													</div>
												)}
											</Space>

										</div>)}


										<div style={{
											marginBottom: 20,
											height: !showAnalysis ? '350px' : '300px',
											overflow: 'auto',
										}}>
											{tableData[item.id] ? (
												<AgGridReact
													rowData={(() => {
														const data = tableData[item.id] || [];
														// Check if we have date column and date range settings
														if (!item.settings.dateColumn) {
															return data;
														}

														// First, check if user has manually selected a date range
														if (tableDateRanges[item.id]) {
															const [startDate, endDate] = tableDateRanges[item.id];
															return data.filter(row => {
																const dateValue = row[item.settings.dateColumn];
																if (!dateValue) return true;

																const rowDate = new Date(dateValue);
																const isAfterStart = !startDate || rowDate >= startDate.startOf('day').toDate();
																const isBeforeEnd = !endDate || rowDate <= endDate.endOf('day').toDate();

																return isAfterStart && isBeforeEnd;
															});
														}

														// Second, check if user has selected a quick date range
														if (tableQuickDateRanges[item.id]) {
															const [startDate, endDate] = getDateRangeFromOption(tableQuickDateRanges[item.id]);

															return data.filter(row => {
																const dateValue = row[item.settings.dateColumn];
																if (!dateValue) return true;

																const rowDate = new Date(dateValue);
																const isAfterStart = !startDate || rowDate >= startDate;
																const isBeforeEnd = !endDate || rowDate <= endDate;

																return isAfterStart && isBeforeEnd;
															});
														}

														// Third, if no manual or quick date range, use the default date range from settings
														if (item.settings.dateRange && item.settings.dateRange !== 'all') {
															const [startDate, endDate] = getDateRangeFromOption(item.settings.dateRange);

															return data.filter(row => {
																const dateValue = row[item.settings.dateColumn];
																if (!dateValue) return true;

																const rowDate = new Date(dateValue);
																const isAfterStart = !startDate || rowDate >= startDate;
																const isBeforeEnd = !endDate || rowDate <= endDate;

																return isAfterStart && isBeforeEnd;
															});
														}

														// If no date range specified, return all data
														let filteredData = data;

														// Apply column filter if specified
														if (item.settings?.filterColumn && tableColumnFilters[item.id]) {
															const filterValue = tableColumnFilters[item.id];
															if (filterValue && filterValue !== 'all') {
																filteredData = data.filter(row => {
																	const rowValue = row[item.settings.filterColumn];
																	return rowValue === filterValue;
																});
															}
														}

														// Apply column sorting if specified
														if (item.settings?.sortColumn) {
															filteredData.sort((a, b) => {
																const aValue = a[item.settings.sortColumn];
																const bValue = b[item.settings.sortColumn];

																// Handle numeric values
																if (typeof aValue === 'number' && typeof bValue === 'number') {
																	if (item.settings.sortType === 'desc') {
																		const result = bValue - aValue;
																		return result;
																	} else if (item.settings.sortType === 'desc_abs') {
																		// Loại 2: Sắp xếp theo thứ tự: Lớn nhất dương → Bé nhất dương → Lớn nhất âm → Bé nhất âm
																		// 100, 90, 10, -100, -20, -10
																		if (aValue >= 0 && bValue >= 0) {
																			const result = bValue - aValue;
																			return result;
																		}

																		// Nếu cả hai đều âm, sắp xếp tăng dần (gần 0 nhất trước)
																		if (aValue < 0 && bValue < 0) {
																			const result = aValue - bValue;
																			return result;
																		}

																		// Nếu một dương một âm, ưu tiên số dương trước
																		if (aValue >= 0 && bValue < 0) {
																			return -1; // a (dương) đứng trước b (âm)
																		}
																		if (aValue < 0 && bValue >= 0) {
																			return 1; // b (dương) đứng trước a (âm)
																		}
																	}
																}

																// Handle string values
																if (typeof aValue === 'string' && typeof bValue === 'string') {
																	if (item.settings.sortType === 'desc') {
																		return bValue.localeCompare(aValue);
																	} else if (item.settings.sortType === 'desc_abs') {
																		return bValue.localeCompare(aValue);
																	} else {
																		return aValue.localeCompare(bValue);
																	}
																}

																// Handle date values
																if (aValue instanceof Date && bValue instanceof Date) {
																	if (item.settings.sortType === 'desc') {
																		return bValue - aValue;
																	} else if (item.settings.sortType === 'desc_abs') {
																		return bValue - aValue;
																	} else {
																		return aValue - bValue;
																	}
																}

																// Handle mixed types or null values
																return 0;
															});
														}

														return filteredData;
													})()}
													columnDefs={(() => {

														const columns = [];
														const columnSettings = item.settings?.columnSettings || {};
														const displayColumns = item.settings?.displayColumns || [];
														const dateColumn = item.settings?.dateColumn;
														const templateColumns = item.settings?.templateColumns || [];

														// Add date column if specified
														if (dateColumn) {
															const dateColumnSetting = columnSettings[dateColumn];
															columns.push({
																field: dateColumn,
																headerName: 'Thời gian',
																width: (() => {
																	const columnWidths = {
																		0.5: 50, 1: 75, 2: 150, 3: 280,
																	};
																	const dateColumnSize = item.settings?.dateColumnSize || 2;
																	return columnWidths[dateColumnSize] || 150;
																})(),
																resizable: true,
																sortable: false, // Tắt sortable của AgGrid để sử dụng logic sắp xếp tùy chỉnh
																filter: true,
																cellStyle: {
																	fontSize: '12px',
																	fontWeight: 500,
																	backgroundColor: '#fafafa',
																},
																cellRenderer: (params) => {
																	return formatValueBySettings(params.value, dateColumnSetting);
																},
															});
														}

														// Add data columns based on settings
														if (displayColumns.length > 0) {
															displayColumns.forEach((columnId, index) => {
																const columnSetting = columnSettings[columnId];
																const templateColumn = templateColumns.find(col => col.id === columnId);
																const columnName = templateColumn?.columnName || `Cột ${index + 1}`;

																// Get column size from settings
																const columnSizes = item.settings?.columnSizes || {};
																const columnSize = columnSizes[columnId] || 2;
																const columnWidths = {
																	0.5: 50, 1: 75, 2: 150, 3: 280,
																};

																columns.push({
																	field: columnId,
																	headerName: columnName,
																	width: columnWidths[columnSize] || 150,
																	resizable: true,
																	sortable: false, // Tắt sortable của AgGrid để sử dụng logic sắp xếp tùy chỉnh
																	filter: true,
																	cellStyle: (params) => {
																		let color = 'inherit';
																		if (columnSetting?.type === 'value' && columnSetting.valueFormat?.negativeRed && Number(params.value) < 0) {
																			color = '#ff4d4f';
																		}
																		return {
																			fontSize: '12px',
																			textAlign: columnSetting?.type === 'text' ? 'left' : 'right',
																			color: color,
																		};
																	},
																	cellRenderer: (params) => {
																		// If column type is dataBar, render data bar
																		if (columnSetting?.type === 'dataBar') {
																			const allValues = params.api.getRenderedNodes().map(node => node.data[columnId]).filter(v => v !== null && v !== undefined);
																			return renderDataBar(params.value, allValues, columnSetting, index);
																		}
																		// Otherwise, use normal formatting
																		return formatValueBySettings(params.value, columnSetting);
																	},
																});
															});
														} else {
															const data = tableData[item.id] || [];
															if (data && data.length > 0) {
																const firstRow = data[0];
																Object.keys(firstRow).forEach(key => {
																	if (key !== 'rowId') { // Skip rowId column
																		columns.push({
																			field: key,
																			headerName: key,
																			width: 150,
																			resizable: true,
																			sortable: false, // Tắt sortable của AgGrid để sử dụng logic sắp xếp tùy chỉnh
																			filter: true,
																			cellStyle: { fontSize: '12px' },
																		});
																	}
																});
															}
														}

														return columns;
													})()}
													defaultColDef={{
														resizable: true,
														sortable: false,
														filter: true,
														suppressHeaderMenuButton: true, // Tắt sortable để sử dụng logic sắp xếp tùy chỉnh
													}}
													className="ag-theme-quartz"
													style={{
														height: !showAnalysis ? '350px' : '300px', width: '100%',
													}}
												/>) : (
												<div style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>
													Không có dữ liệu để hiển thị
												</div>)}
										</div>
									</>) : item.type === 'statistics' ? (
									<>
										<div>
											<div style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												marginBottom: 8,
											}}>
												<Title level={4} style={{
													lineHeight: 1.4,
													margin: 0,
													flex: 1,
													fontWeight: 600,
													color: '#262626',
												}}>
													{item.name}
												</Title>
												<div style={{ display: 'flex', gap: 4 }}>
													<Button
														size="small"
														icon={<SettingOutlined style={{ color: '#acacac' }} />}
														onClick={(e) => {
															e.stopPropagation();
															handleOpenEditModal(item);
														}}
														title="Cài đặt"
													/>

													{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
														<Button
															size="small"
															icon={<SafetyOutlined style={{ color: '#acacac' }} />}
															onClick={(e) => {
																e.stopPropagation();
																handleOpenUserClassModal(item);
															}}
															title="Cài đặt quyền"
														/>)}

													{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
														<Button
															size="small"
															danger
															loading={deleteLoading && deletingItemId === item.id}
															onClick={(e) => {
																e.stopPropagation();
																handleDeleteDashboardItem(item);
															}}
														>
															<Trash color="#ff8882" size={13} />
														</Button>)}
												</div>
											</div>
										</div>

										<div style={{ display: 'flex', justifyContent: 'center' }}>
											{(() => {
												const kpiCalculatorIds = item.settings?.kpiCalculators || [];
												const selectedKpiCalculators = kpiCalculatorIds.map(id => kpiCalculators.find(k => k.id === id)).filter(Boolean);


												if (selectedKpiCalculators.length === 0) {
													return (<div style={{
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														height: '100%',
														backgroundColor: '#fafafa',
														borderRadius: '6px',
														border: '1px solid #d9d9d9',
													}}>
														<div style={{
															textAlign: 'center', color: '#aaa', padding: 32,
														}}>
															Không có KPI Calculator nào được chọn
														</div>
													</div>);
												}

												return (<div style={{
													width: '100%',
													height: showAnalysis ? '320px' : '360px',
													overflowY: 'auto',
												}} data-export-card-id={`card-${item.id}`}
															 data-export-chart-id={`chart-${item.id}`}>
													{selectedKpiCalculators.map((kpi, index) => (
														<div key={kpi.id} style={{
															height: 95,
															marginBottom: 8,
															padding: 12,
															border: '1px solid #e8e8e8',
															borderRadius: 8,
															backgroundColor: '#ffffff',
															display: 'flex',
															alignItems: 'center',
														}}>
															{/* Nửa trái - Tên và số */}
															<div style={{
																flex: 1,
																display: 'flex',
																flexDirection: 'column',
																justifyContent: 'center',
																paddingRight: 16,
															}}>
																<div style={{
																	fontWeight: '500',
																	fontSize: 14,
																	marginBottom: 8,
																	color: '#333',
																}}>
																	{kpi.name}
																</div>
																<div style={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: 8,
																}}>
																	<div style={{
																		fontSize: 26,
																		color: '#262626',
																	}}>
																		{(() => {
																			if (kpi.tableData && kpi.tableData.length > 0) {
																				const latestData = kpi.tableData[kpi.tableData.length - 1];
																				return formatNumberWithK(latestData.value);
																			}
																			return '--';
																		})()}
																	</div>
																	<div style={{
																		fontSize: 14,
																		fontWeight: '500',
																		display: 'flex',
																		alignItems: 'center',
																		gap: 8,
																	}}>
																		{(() => {
																			if (kpi.tableData && kpi.tableData.length > 1) {
																				const latestData = kpi.tableData[kpi.tableData.length - 1];
																				const previousData = kpi.tableData[kpi.tableData.length - 2];
																				const change = ((latestData.value - previousData.value) / previousData.value) * 100;
																				const isPositive = change >= 0;
																				return (<span
																					style={{ color: isPositive ? '#52c41a' : '#ff4d4f' }}>
																							{isPositive ? '+' : ''}{change.toFixed(1)}%
																						</span>);
																			}
																			return '--';
																		})()}
																	</div>
																</div>
															</div>
															<div style={{
																display: 'flex',
																alignItems: 'center',
																gap: 5,
															}}>
																{/* 5 arrow icons for last 5 periods */}
																{(() => {
																	if (kpi.tableData && kpi.tableData.length > 1) {
																		const periods = kpi.tableData.slice(-6); // Lấy 6 kỳ gần nhất (5 so sánh)
																		const arrows = [];

																		for (let i = periods.length - 1; i > 0; i--) {
																			const current = periods[i];
																			const previous = periods[i - 1];
																			const change = ((current.value - previous.value) / previous.value) * 100;
																			const isPositive = change >= 0;
																			const periodLabel = current.date || `Kỳ ${i + 1}`;

																			arrows.push(<Tooltip
																				key={i}
																				title={`${periodLabel}: ${formatNumberWithK(current.value)} (${isPositive ? '+' : ''}${change.toFixed(1)}%)`}
																				placement="top"
																			>
																						<span
																							style={{ cursor: 'pointer' }}>
																							{isPositive ? (<ArrowUp
																									strokeWidth={'2px'}
																									size={20}
																									style={{ color: '#39B252' }}
																								/>) :
																								(<ArrowDown
																									strokeWidth={'2px'}
																									size={20}
																									style={{ color: '#ff5757' }}
																								/>)}
																						</span>
																			</Tooltip>);
																		}

																		return arrows;
																	}
																	return null;
																})()}
															</div>
														</div>))}
												</div>);
											})()}
										</div>
									</>) : item.type === 'table_chart_2' ? (
									<>
										<div>
											<div style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												marginBottom: 8,
											}}>

												<Title level={4} style={{
													lineHeight: 1.4,
													margin: 0,
													flex: 1,
													fontWeight: 600,
													color: '#262626',
												}}>
													{item.name}
												</Title>
												<div style={{ display: 'flex', gap: 4 }}>
													<Button
														size="small"
														icon={<SettingOutlined style={{ color: '#acacac' }} />}
														onClick={(e) => {
															e.stopPropagation();
															handleOpenEditModal(item);
														}}
														title="Cài đặt"
													/>

													{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
														<Button
															size="small"
															icon={<SafetyOutlined style={{ color: '#acacac' }} />}
															onClick={(e) => {
																e.stopPropagation();
																handleOpenUserClassModal(item);
															}}
															title="Cài đặt quyền"
														/>)}

													{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
														<Button
															size="small"
															danger
															loading={deleteLoading && deletingItemId === item.id}
															onClick={(e) => {
																e.stopPropagation();
																handleDeleteDashboardItem(item);
															}}
														>
															<Trash color="#ff8882" size={13} />
														</Button>)}
												</div>
											</div>
										</div>

										{/* Date Range Filter for table_chart_2 */}
										{item.settings?.timeColumn && (<div style={{
											marginBottom: 12,
											padding: '8px 12px',
											backgroundColor: '#f5f5f5',
											borderRadius: '6px',
										}}
																			className={styles.dateRangeFilter}
																			onClick={(e) => e.stopPropagation()} // Chặn click ở container
										>
											<Space size="small" align="center">
												<DatePicker.RangePicker
													className={styles.dateRangePicker}
													size="small"
													style={{ width: 200 }}
													placeholder={['Từ ngày', 'Đến ngày']}
													value={tableDateRanges[item.id] || null}
													onChange={(dates) => {
														setTableDateRanges(prev => ({
															...prev, [item.id]: dates,
														}));
														// Clear quick date range when manual date is selected
														setTableQuickDateRanges(prev => ({
															...prev, [item.id]: null,
														}));
													}}
													format="DD/MM/YYYY"
												/>
												<Select
													className={styles.dateRangeSelect}
													size="small"
													style={{ width: 'auto' }}
													placeholder="Chọn nhanh"
													value={(() => {
														const userSelection = tableQuickDateRanges[item.id];
														const defaultSetting = item.settings?.dateRange;
														const finalValue = userSelection || (defaultSetting ? defaultSetting : undefined);
														return finalValue;
													})()}
													onChange={(value) => {
														setTableQuickDateRanges(prev => ({
															...prev, [item.id]: value,
														}));
														// Clear manual date range when quick option is selected
														setTableDateRanges(prev => ({
															...prev, [item.id]: null,
														}));
													}}
													allowClear
												>
													<Option value="today">Hôm nay</Option>
													<Option value="yesterday">Hôm qua</Option>
													<Option value="thisWeek">Tuần này</Option>
													<Option value="lastWeek">Tuần trước</Option>
													<Option value="thisMonth">Tháng này</Option>
													<Option value="lastMonth">Tháng trước</Option>
													<Option value="last7Days">7 ngày gần nhất</Option>
													<Option value="last15Days">15 ngày gần nhất</Option>
													<Option value="last30Days">30 ngày gần nhất</Option>
													<Option value="all">Tất cả dữ liệu</Option>
												</Select>
												{(tableDateRanges[item.id] && (tableDateRanges[item.id][0] || tableDateRanges[item.id][1])) && (
													<Button
														size="small"
														onClick={() => {
															setTableDateRanges(prev => ({
																...prev, [item.id]: null,
															}));
														}}
													>
														<ListRestart size={16} />
													</Button>)}
												{tableQuickDateRanges[item.id] && (<Button
													size="small"
													onClick={() => {
														setTableQuickDateRanges(prev => ({
															...prev, [item.id]: null,
														}));
													}}
												>
													<ListRestart size={16} />
												</Button>)}
											</Space>
										</div>)}

										<div style={{ display: 'flex', justifyContent: 'center' }}>
											{chartOptions[item.id] ? (<div style={{
												width: '100%',
											}} data-export-card-id={`card-${item.id}`}
																		   data-export-chart-id={`chart-${item.id}`}>
												<AgCharts options={chartOptions[item.id]}
														  style={{ height: showAnalysis ? '300px' : '360px' }} />
											</div>) : (<div style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												height: '100%',
												backgroundColor: '#fafafa',
												borderRadius: '6px',
												border: '1px solid #d9d9d9',
											}}>
												<Button
													type="primary"
													size="small"
													onClick={() => loadTableChart2Data(item)}
													loading={loading}
												>
													Đang tải dữ liệu ...
												</Button>
											</div>)}
										</div>
									</>) : item.type === 'table_chart' ? (
									<>
										<div>
											<div style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												marginBottom: 8,
											}}>

												<Title level={4} style={{
													lineHeight: 1.4,
													margin: 0,
													flex: 1,
													fontWeight: 600,
													color: '#262626',
												}}>
													{item.name}
												</Title>
												<div style={{ display: 'flex', gap: 4 }}>
													<Button
														size="small"
														icon={<SettingOutlined style={{ color: '#acacac' }} />}
														onClick={() => handleOpenEditModal(item)}
														title="Cài đặt"
													/>
													{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
														<Button
															size="small"
															icon={<SafetyOutlined style={{ color: '#acacac' }} />}
															onClick={() => handleOpenUserClassModal(item)}
															title="Cài đặt quyền"
														/>
													)}
													{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
														<Button
															size="small"
															danger
															loading={deleteLoading && deletingItemId === item.id}
															onClick={() => handleDeleteDashboardItem(item)}
														>
															<Trash size={13} />
														</Button>
													)}
												</div>
											</div>

											{/* Display current value and percentage change (similar to CHART type) */}
											<Flex align="baseline" gap={8}>
											</Flex>
										</div>

										<div style={{ display: 'flex', justifyContent: 'center' }}>
											{chartOptions[item.id] ? (
												<div style={{ width: '100%' }} data-export-card-id={`card-${item.id}`}
													 data-export-chart-id={`chart-${item.id}`}>
													<AgCharts options={chartOptions[item.id]}
															  style={{ height: showAnalysis ? '300px' : '350px' }} />
												</div>
											) : (
												<div style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													height: '100%',
													backgroundColor: '#fafafa',
													borderRadius: '6px',
													border: '1px solid #d9d9d9',
												}}>
													<Button
														type="primary"
														size="small"
														onClick={() => loadTableChartData(item)}
														loading={loading}
													>
														Đang tải dữ liệu ...
													</Button>
												</div>
											)}
										</div>
									</>
								) : (
									<>
										<div>
											<Title level={5} style={{ margin: '0 0 16px 0', lineHeight: 1.4 }}>
												{item.name}
											</Title>
										</div>

										<div style={{ marginBottom: 20 }}>
											{tableData[item.id] && tableData[item.id].length > 0 ? (<div style={{
												padding: '16px',
												backgroundColor: '#f9fafb',
												borderRadius: '8px',
											}}>
												{(() => {
													const topN = item.settings?.topN || 5;
													const displayData = tableData[item.id].slice(0, topN); // Chỉ hiển thị top N trong card nhỏ
													const maxValue = Math.max(...tableData[item.id].map(d => d.value || 0));

													return displayData.map((topItem, index) => (
														<div key={index} style={{
															display: 'flex',
															flexDirection: 'column',
															marginBottom: index < displayData.length - 1 ? '12px' : 0,
															paddingBottom: index < displayData.length - 1 ? '12px' : 0,
															borderBottom: index < displayData.length - 1 ? '1px solid #e5e7eb' : 'none',
														}}>
															<div style={{
																display: 'flex',
																justifyContent: 'space-between',
																alignItems: 'center',
																marginBottom: '6px',
															}}>
																<div style={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: '8px',
																}}>
																	<div style={{
																		width: '20px',
																		height: '20px',
																		borderRadius: '50%',
																		backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#d97706' : '#6b7280',
																		display: 'flex',
																		alignItems: 'center',
																		justifyContent: 'center',
																		fontSize: '12px',
																		fontWeight: 'bold',
																		color: 'white',
																	}}>
																		{index + 1}
																	</div>
																	<Text style={{
																		fontSize: '12px', fontWeight: 500,
																	}}>
																		{topItem.name}
																	</Text>
																</div>
																<Text style={{
																	fontSize: '12px', fontWeight: 600,
																}}>
																	{formatCurrency(topItem.value)}
																</Text>
															</div>
															<div style={{
																width: '100%',
																height: '6px',
																backgroundColor: '#e5e7eb',
																borderRadius: '3px',
																overflow: 'hidden',
															}}>
																<div style={{
																	width: `${(topItem.value / maxValue) * 100}%`,
																	height: '100%',
																	backgroundColor: '#3b82f6',
																	borderRadius: '3px',
																	transition: 'width 0.3s ease',
																}} />
															</div>
														</div>));
												})()}
											</div>) : (<div style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												height: '100px',
												backgroundColor: '#fafafa',
												borderRadius: '6px',
												border: '1px solid #d9d9d9',
											}}>
												<Button
													type="primary"
													size="small"
													onClick={() => loadTopData(item)}
													loading={loading}
												>
													Đang tải dữ liệu ...
												</Button>
											</div>)}
										</div>
									</>)}
							</div>

							{/* Footer Section - Always at bottom */}
							<div style={{
								position: 'absolute',
								bottom: 0,
								left: 0,
								right: 0,
								padding: '8px 10px 10px 10px',
								backgroundColor: 'white',
								borderBottomLeftRadius: '8px',
								borderBottomRightRadius: '8px',
								borderTop: '1px solid #f0f0f0',
							}}>
								{/* Analysis Answer Preview */}
								{showAnalysis && (<div style={{
									height: '70px',
									alignItems: 'center',
								}}>
									{item.analysis?.answer ? (<>
										<div style={{
											// Thay đổi border-left và background dựa trên điểm số
											borderLeft: item.analysis.score !== null && item.analysis.score !== undefined
												? `5px solid ${getGradeFromScore(item.analysis.score).color}`
												: '5px solid #fff',
											background: item.analysis.score !== null && item.analysis.score !== undefined
												? `${getGradeFromScore(item.analysis.score).color}25`
												: 'transparent',
											padding: '4px 8px 4px 16px',
										}}
											 onClick={() => openAnalysisDetailModal(item)}
										>
											<div style={{
												fontSize: '11.5px',
												color: '#565656',
												lineHeight: 1.5,
												height: '54px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												display: '-webkit-box',
												WebkitLineClamp: 3, // Tăng từ 2 lên 3 dòng
												WebkitBoxOrient: 'vertical',
												fontWeight: '600',
												position: 'relative',
												marginTop: '4px',
											}}>
												{item.analysis.answer?.replace(/\*/g, '').replace(/#/g, '')}
												{/*<Tooltip title="Xem chi tiết phân tích AI">*/}
												{/*	<Button*/}
												{/*		type="text"*/}
												{/*		size="small"*/}
												{/*		style={{*/}
												{/*			padding: 0,*/}
												{/*			position: 'absolute',*/}
												{/*			bottom: 0,*/}
												{/*			right: 0,*/}
												{/*			height: 'auto',*/}
												{/*			fontSize: '11.5px',*/}
												{/*			background: '#fff',*/}
												{/*			fontWeight: '600',*/}
												{/*			color: '#1862eb',*/}
												{/*		}}*/}
												{/*		onClick={() => openAnalysisDetailModal(item)}*/}
												{/*	>*/}

												{/*		...Xem thêm*/}
												{/*	</Button>*/}
												{/*</Tooltip>*/}
											</div>
											{/*{(item.type === 'table_chart' || item.type === 'table_chart_2') && (*/}
											{/*	<Tooltip title="Phân tích lại dữ liệu với AI">*/}
											{/*		<Button*/}
											{/*			type="link"*/}
											{/*			size="small"*/}
											{/*			loading={analyzingItems.has(item.id)}*/}
											{/*			onClick={() => handleAnalyzeWithAI(item)}*/}
											{/*			style={{ */}
											{/*				fontSize: '11px',*/}
											{/*				padding: 0,*/}
											{/*				height: 'auto'*/}
											{/*			}}*/}
											{/*		>*/}
											{/*			Phân tích lại*/}
											{/*		</Button>*/}
											{/*	</Tooltip>*/}
											{/*)}*/}
										</div>
									</>) : (// Hiển thị nút phân tích khi chưa có answer
										(item.type === 'table_chart' || item.type === 'table_chart_2' || item.type === 'table' || item.type === 'comparison' || item.type === 'chart' || item.type === 'statistics') && (
											<div style={{
												display: 'flex',
												alignItems: 'center',
												gap: '4px',
												height: '100%',
												flexWrap: 'wrap',
											}}>
												<Select
													value={selectedAIModel}
													onChange={setSelectedAIModel}
													style={{
														width: 160,
														fontSize: '11px',
													}}
													size="small"
													placeholder="Chọn AI"
													disabled={analyzingItems.has(item.id)}
												>
													{MODEL_AI_LIST_DB.map(model => (
														<Option key={model.value} value={model.value}>
															{model.name}
														</Option>
													))}
												</Select>
												<Tooltip title="Sử dụng AI để phân tích dữ liệu biểu đồ">
													<Button
														type="primary"
														size="small"
														loading={analyzingItems.has(item.id)}
														onClick={() => handleAnalyzeWithAI(item)}
														style={{
															fontSize: '11px',
															height: '24px',
															padding: '0 8px',
														}}
													>
														{analyzingItems.has(item.id) ? 'Đang phân tích...' : 'Phân tích'}
													</Button>
												</Tooltip>
											</div>))}
								</div>)}
								{/* <Flex align="center" justify="space-between">
								<Space size={4} wrap>
									<Tag color="default">{item.category}</Tag>
									{item.storeCategory && (<Tag color="default">{item.storeCategory}</Tag>)}
									{item.type !== 'statistics' &&
										<>
											{(() => {
												const sourceInfo = getSourceInfo(item);
												return sourceInfo ? (<Tag color={sourceInfo.color} style={{
													maxWidth: '300px',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
													display: 'flex',
												}}>
													Nguồn: {sourceInfo.name}
												</Tag>) : null;
											})()}
										</>}
								</Space>
								<Button
									type="link"
									size="small"
									icon={<img src={IconViewData} alt="View Data" style={{ width: 16 }} />}
									onClick={(e) => {
										e.stopPropagation();
										handleViewDetails(item);
									}}>

								</Button>
							</Flex> */}
							</div>
						</Card>
					</Col>))}
				</Row>

				{filteredMetrics.length === 0 && (
					<div style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0' }}>
						<Text>Không tìm thấy chỉ số nào phù hợp</Text>
					</div>)}
			</div>
			{/* Details Modal */}
			<MetricDetailsModal
				visible={showDetailsModal}
				onCancel={closeDetailsModal}
				selectedMetric={selectedMetricForDetails}
				tableData={tableData}
				rawApprovedVersionData={rawApprovedVersionData}
				chartOptions={chartOptions}
				loading={loading}
				onLoadChartData={loadChartData}
				onLoadTopData={loadTopData}
				onLoadTableData={loadTableData}
				onLoadTableChartData={loadTableChartData}
				onLoadTableChart2Data={loadTableChart2Data}
				prepareTableColumns={prepareTableColumns}
				prepareTableData={prepareTableData}
			/>

			{/* Authorization Modal */}
			<AuthorizationModal
				visible={showAuthModal}
				onCancel={() => {
					setShowAuthModal(false);
					setUserClassSearchText('');
					setUserClassFilter('all');
				}}
				selectedDashboardItem={selectedDashboardItem}
				dashboardItems={dashboardItems}
				allUserClasses={allUserClasses}
				userClassSearchText={userClassSearchText}
				setUserClassSearchText={setUserClassSearchText}
				userClassFilter={userClassFilter}
				setUserClassFilter={setUserClassFilter}
				filteredUserClasses={filteredUserClasses}
				selectedUserClasses={selectedUserClasses}
				handleUserClassChange={handleUserClassChange}
				handleSelectAllVisible={handleSelectAllVisible}
				handleDeselectAllVisible={handleDeselectAllVisible}
				handleSaveUserClass={handleSaveUserClass}
				handleOpenUserClassModal={handleOpenUserClassModal}
			/>

			{/* New Card Modal */}
			<Modal
				title="Tạo thẻ mới"
				open={showNewCardModal}
				onCancel={handleCancelNewCard}
				footer={[<Button key="cancel" onClick={handleCancelNewCard}>
					Hủy bỏ
				</Button>, <Button
					key="create"
					type="primary"
					onClick={handleCreateNewCard}
					disabled={!newCard.title.trim()}
				>
					Tạo thẻ
				</Button>]}
				width={1200}
			>
				<Space direction="vertical" size={16} style={{ width: '100%' }}>
					<div>
						<Text strong>Tiêu đề thẻ *</Text>
						<Input
							value={newCard.title}
							onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
							placeholder="Nhập tiêu đề thẻ..."
							style={{ marginTop: 8 }}
						/>
					</div>

					<div>
						<Text strong>Loại thẻ *</Text>
						<div style={{ marginTop: 8 }}>
							{/* First Row */}
							<Row gutter={[12, 16]}>
								<Col span={4}>
									<Card
										size="small"
										style={{
											border: newCard.type === 'chart' ? '2px solid #3b82f6' : '1px solid #d1d5db',
											backgroundColor: newCard.type === 'chart' ? '#eff6ff' : 'white',
											cursor: 'pointer',
											height: 120,
										}}
										onClick={() => setNewCard({ ...newCard, type: 'chart' })}
									>
										<div style={{ textAlign: 'center' }}>
											<BarChartOutlined
												style={{ fontSize: 24, color: '#3b82f6', marginBottom: 8 }} />
											<div style={{ fontWeight: 500, fontSize: 14 }}>Thẻ chỉ số</div>
											<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Phân tích và
												benchmark chỉ số cụ thể
											</div>
										</div>
									</Card>
								</Col>
								<Col span={4}>
									<Card
										size="small"
										style={{
											border: newCard.type === 'table_chart' ? '2px solid #06b6d4' : '1px solid #d1d5db',
											backgroundColor: newCard.type === 'table_chart' ? '#ecfeff' : 'white',
											cursor: 'pointer',
											height: 120,
										}}
										onClick={() => setNewCard({ ...newCard, type: 'table_chart' })}
									>
										<div style={{ textAlign: 'center' }}>
											<PieChartOutlined
												style={{ fontSize: 24, color: '#06b6d4', marginBottom: 8 }} />
											<div style={{ fontWeight: 500, fontSize: 14 }}>BIỂU ĐỒ</div>
											<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Từ bảng dữ
												liệu
											</div>
										</div>
									</Card>
								</Col>
								<Col span={4}>
									<Card
										size="small"
										style={{
											border: newCard.type === 'table_chart_2' ? '2px solid #8b5cf6' : '1px solid #d1d5db',
											backgroundColor: newCard.type === 'table_chart_2' ? '#f3f4f6' : 'white',
											cursor: 'pointer',
											height: 120,
										}}
										onClick={() => setNewCard({ ...newCard, type: 'table_chart_2' })}
									>
										<div style={{ textAlign: 'center' }}>
											<BarChartOutlined
												style={{ fontSize: 24, color: '#8b5cf6', marginBottom: 8 }} />
											<div style={{ fontWeight: 500, fontSize: 14 }}>BIỂU ĐỒ</div>
											<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Từ bảng dữ
												liệu
												kết hợp lọc theo thời
												gian
											</div>
										</div>
									</Card>
								</Col>
								<Col span={4}>
									<Card
										size="small"
										style={{
											border: newCard.type === 'top' ? '2px solid #10b981' : '1px solid #d1d5db',
											backgroundColor: newCard.type === 'top' ? '#ecfdf5' : 'white',
											cursor: 'pointer',
											height: 120,
										}}
										onClick={() => setNewCard({ ...newCard, type: 'top' })}
									>
										<div style={{ textAlign: 'center' }}>
											<TrophyOutlined
												style={{ fontSize: 24, color: '#10b981', marginBottom: 8 }} />
											<div style={{ fontWeight: 500, fontSize: 14 }}>TOP</div>
											<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Danh sách xếp
												hạng
											</div>
										</div>
									</Card>
								</Col>
								<Col span={4}>
									<Card
										size="small"
										style={{
											border: newCard.type === 'comparison' ? '2px solid #f59e0b' : '1px solid #d1d5db',
											backgroundColor: newCard.type === 'comparison' ? '#fffbeb' : 'white',
											cursor: 'pointer',
											height: 120,
										}}
										onClick={() => setNewCard({ ...newCard, type: 'comparison' })}
									>
										<div style={{ textAlign: 'center' }}>
											<AppstoreOutlined
												style={{ fontSize: 24, color: '#f59e0b', marginBottom: 8 }} />
											<div style={{ fontWeight: 500, fontSize: 14 }}>SO SÁNH CHỈ SỐ</div>
											<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>So sánh 1 chỉ
												số
												cụ thể giữa nhiều đơn vị
											</div>
										</div>
									</Card>
								</Col>
								<Col span={4}>
									<Card
										size="small"
										style={{
											border: newCard.type === 'table' ? '2px solid #8b5cf6' : '1px solid #d1d5db',
											backgroundColor: newCard.type === 'table' ? '#f3f4f6' : 'white',
											cursor: 'pointer',
											height: 120,
										}}
										onClick={() => setNewCard({ ...newCard, type: 'table' })}
									>
										<div style={{ textAlign: 'center' }}>
											<TableOutlined
												style={{ fontSize: 24, color: '#8b5cf6', marginBottom: 8 }} />
											<div style={{ fontWeight: 500, fontSize: 14 }}>TABLE</div>
											<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Bảng dữ liệu
											</div>
										</div>
									</Card>
								</Col>
							</Row>

							{/* Second Row */}
							<Row gutter={[12, 16]}>
								<Col span={4}>
									<Card
										size="small"
										style={{
											border: newCard.type === 'statistics' ? '2px solid #dc2626' : '1px solid #d1d5db',
											backgroundColor: newCard.type === 'statistics' ? '#fef2f2' : 'white',
											cursor: 'pointer',
											height: 120,
										}}
										onClick={() => setNewCard({ ...newCard, type: 'statistics' })}
									>
										<div style={{ textAlign: 'center' }}>
											<BarChartOutlined
												style={{ fontSize: 24, color: '#dc2626', marginBottom: 8 }} />
											<div style={{ fontWeight: 500, fontSize: 14 }}>THỐNG KÊ</div>
											<div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Nhiều KPI
												Calculator
												theo hàng dọc
											</div>
										</div>
									</Card>
								</Col>
							</Row>
						</div>
					</div>

					{newCard.type === 'chart' && (<>
						<div>
							<Text strong>Chọn KPI *</Text>
							<Select
								value={newCard.idData}
								onChange={(value) => setNewCard({ ...newCard, idData: value })}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn KPI"
								showSearch
								filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
							>
								{kpi2Calculators.map(kpi => (<Option key={kpi.id} value={kpi.id}>
									{kpi.name}
								</Option>))}
							</Select>
						</div>
						<div>
							<Text strong>Loại biểu đồ</Text>
							<div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
								<Button
									type={newCard.chartViewType === 'line' ? 'primary' : 'default'}
									onClick={() => setNewCard({ ...newCard, chartViewType: 'line' })}
									size="small"
								>
									Line
								</Button>
								<Button
									type={newCard.chartViewType === 'area' ? 'primary' : 'default'}
									onClick={() => setNewCard({ ...newCard, chartViewType: 'area' })}
									size="small"
								>
									Area dạng Gradient + Marker
								</Button>
								<Button
									type={newCard.chartViewType === 'line_marker' ? 'primary' : 'default'}
									onClick={() => setNewCard({ ...newCard, chartViewType: 'line_marker' })}
									size="small"
								>
									Line dạng marker
								</Button>
								<Button
									type={newCard.chartViewType === 'bar' ? 'primary' : 'default'}
									onClick={() => setNewCard({ ...newCard, chartViewType: 'bar' })}
									size="small"
								>
									Bar
								</Button>
							</div>
							<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
								Chọn loại biểu đồ để hiển thị dữ liệu
							</Text>
						</div>
						<div>
							<Text strong>Số lượng kỳ gần nhất hiển thị</Text>
							<Select
								value={newCard.recentPeriods}
								onChange={(value) => setNewCard({ ...newCard, recentPeriods: value })}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn số lượng kỳ gần nhất"
							>
								<Option value={0}>Tất cả kỳ</Option>
								<Option value={3}>3 kỳ gần nhất</Option>
								<Option value={5}>5 kỳ gần nhất</Option>
								<Option value={10}>10 kỳ gần nhất</Option>
								<Option value={12}>12 kỳ gần nhất</Option>
								<Option value={24}>24 kỳ gần nhất</Option>
								<Option value={48}>48 kỳ gần nhất</Option>
							</Select>
							<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
								Chỉ hiển thị số lượng kỳ gần nhất trên biểu đồ (0 = hiển thị tất cả)
							</Text>
						</div>
					</>)}
					{newCard.type === 'table_chart' && (<>
						<div>
							<Text strong>Chọn dữ liệu *</Text>
							<Select
								value={newCard.idData}
								onChange={handleNewTableApprovedVersionChange}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn dữ liệu"
								showSearch
								filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								loading={loading}
							>
								{approvedVersions.map(version => (<Option key={version.id} value={version.id}>
									{version.name}
								</Option>))}
							</Select>
						</div>

						{newTemplateColumns.length > 0 && (<>
							<Row gutter={16}>
								<Col span={8}>
									<div>
										<Text strong>Chọn cột thời gian</Text>
										<Select
											value={newTableChartTimeColumn || undefined}
											onChange={(value) => setNewTableChartTimeColumn(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn cột thời gian (tùy chọn)"
											showSearch
											filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
											allowClear
										>
											{newTemplateColumns
												.map(col => (<Option key={col.id} value={col.id}>
													{col.columnName}
												</Option>))}
										</Select>
									</div>
								</Col>
								<Col span={8}>
									<div>
										<Text strong>Chọn cột gom nhóm</Text>
										<Select
											value={newTableChartGroupColumn || undefined}
											onChange={(value) => setNewTableChartGroupColumn(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn cột gom nhóm (tùy chọn)"
											showSearch
											filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
											allowClear
										>
											{newTemplateColumns.map(col => (<Option key={col.id} value={col.id}>
												{col.columnName}
											</Option>))}
										</Select>
									</div>
								</Col>
								<Col span={8}>
									<div>
										<Text strong>Chọn cột giá trị *</Text>
										<Select
											value={newTableChartValueColumn || undefined}
											onChange={(value) => setNewTableChartValueColumn(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn cột giá trị"
											showSearch
											filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
										>
											{newTemplateColumns.map(col => (<Option key={col.id} value={col.id}>
												{col.columnName}
											</Option>))}
										</Select>
									</div>
								</Col>
							</Row>

							<Row gutter={16}>
								<Col span={12}>
									<div>
										<Text strong>Kiểu biểu đồ</Text>
										<Select
											value={newTableChartType}
											onChange={(value) => setNewTableChartType(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn kiểu biểu đồ"
										>
											<Option value="line">Line</Option>
											<Option value="bar">Bar</Option>
											<Option value="pie">Pie</Option>
											<Option value="stacked_area">Stacked Area</Option>
										</Select>
									</div>
								</Col>
								<Col span={12}>
									<div>
										<Text strong>Gộp dữ liệu theo thời gian</Text>
										<Select
											value={newTableChartDataGrouping}
											onChange={(value) => setNewTableChartDataGrouping(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn cách gộp dữ liệu"
											disabled={!newTableChartTimeColumn}
										>
											<Option value="none">Giữ nguyên</Option>
											<Option value="month">Theo tháng</Option>
											<Option value="week">Theo tuần</Option>
										</Select>
										<Text type="secondary"
											  style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
											{newTableChartTimeColumn ? 'Chỉ áp dụng khi có cột thời gian' : 'Cần chọn cột thời gian để sử dụng tính năng này'}
										</Text>
									</div>
								</Col>
							</Row>
						</>)}
					</>)}

					{newCard.type === 'table_chart_2' && (<>
						<div>
							<Text strong>Chọn dữ liệu *</Text>
							<Select
								value={newCard.idData}
								onChange={handleNewTableApprovedVersionChange}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn dữ liệu"
								showSearch
								filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								loading={loading}
							>
								{approvedVersions.map(version => (<Option key={version.id} value={version.id}>
									{version.name}
								</Option>))}
							</Select>
						</div>

						{newTemplateColumns.length > 0 && (<>
							<Row gutter={16}>
								<Col span={8}>
									<div>
										<Text strong>Cột thời gian (lọc dữ liệu)</Text>
										<Select
											value={newTableChart2TimeColumn || undefined}
											onChange={(value) => setNewTableChart2TimeColumn(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn cột thời gian để lọc (tùy chọn)"
											showSearch
											filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
											allowClear
										>
											{newTemplateColumns
												.map(col => (<Option key={col.id} value={col.id}>
													{col.columnName}
												</Option>))}
										</Select>
									</div>
								</Col>
								<Col span={8}>
									<div>
										<Text strong>Cột nhóm (trục X)</Text>
										<Select
											value={newTableChart2GroupColumn || undefined}
											onChange={(value) => setNewTableChart2GroupColumn(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn cột nhóm cho trục X (tùy chọn)"
											showSearch
											filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
											allowClear
										>
											{newTemplateColumns.map(col => (<Option key={col.id} value={col.id}>
												{col.columnName}
											</Option>))}
										</Select>
									</div>
								</Col>
								<Col span={8}>
									<div>
										<Text strong>Cột giá trị (trục Y) *</Text>
										<Select
											value={newTableChart2ValueColumn || undefined}
											onChange={(value) => setNewTableChart2ValueColumn(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn cột giá trị cho trục Y"
											showSearch
											filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
										>
											{newTemplateColumns.map(col => (<Option key={col.id} value={col.id}>
												{col.columnName}
											</Option>))}
										</Select>
									</div>
								</Col>
							</Row>

							<Row gutter={16}>
								<Col span={8}>
									<div>
										<Text strong>Khoảng thời gian lọc</Text>
										<Select
											value={newTableChart2DateRange}
											onChange={(value) => setNewTableChart2DateRange(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn khoảng thời gian lọc"
											disabled={!newTableChart2TimeColumn}
										>
											<Option value="all">Tất cả dữ liệu</Option>
											<Option value="today">Hôm nay</Option>
											<Option value="yesterday">Hôm qua</Option>
											<Option value="thisWeek">Tuần này</Option>
											<Option value="lastWeek">Tuần trước</Option>
											<Option value="thisMonth">Tháng này</Option>
											<Option value="lastMonth">Tháng trước</Option>
											<Option value="last7Days">7 ngày gần nhất</Option>
											<Option value="last15Days">15 ngày gần nhất</Option>
											<Option value="last30Days">30 ngày gần nhất</Option>
											<Option value="last90Days">90 ngày gần nhất</Option>
											<Option value="thisYear">Năm nay</Option>
											<Option value="lastYear">Năm trước</Option>
										</Select>
										<Text type="secondary"
											  style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
											{newTableChart2TimeColumn ? 'Lọc dữ liệu theo khoảng thời gian' : 'Cần chọn cột thời gian để lọc dữ liệu'}
										</Text>
									</div>
								</Col>
								<Col span={8}>
									<div>
										<Text strong>Loại biểu đồ</Text>
										<Select
											value={newTableChart2Type}
											onChange={(value) => setNewTableChart2Type(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn loại biểu đồ"
										>
											<Option value="line">Đường</Option>
											<Option value="bar">Cột</Option>
											<Option value="pie">Tròn</Option>
										</Select>
									</div>
								</Col>

							</Row>
						</>)}
					</>)}

					{newCard.type === 'comparison' && (<>
						<div>
							<Text strong>Chọn các KPI để so sánh *</Text>
							<Select
								mode="multiple"
								value={selectedKpis}
								onChange={(values) => setSelectedKpis(values)}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn ít nhất 2 KPI để so sánh"
								showSearch
								filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								maxTagCount={5}
								maxTagTextLength={20}
							>
								{kpi2Calculators.map(kpi => (<Option key={kpi.id} value={kpi.id}>
									{kpi.name}
								</Option>))}
							</Select>
							<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
								Có thể chọn nhiều KPI để so sánh cùng lúc
							</Text>
						</div>
						<div>
							<Text strong>Số lượng kỳ gần nhất hiển thị</Text>
							<Select
								value={newCard.recentPeriods}
								onChange={(value) => setNewCard({ ...newCard, recentPeriods: value })}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn số lượng kỳ gần nhất"
							>
								<Option value={0}>Tất cả kỳ</Option>
								<Option value={3}>3 kỳ gần nhất</Option>
								<Option value={5}>5 kỳ gần nhất</Option>
								<Option value={10}>10 kỳ gần nhất</Option>
								<Option value={12}>12 kỳ gần nhất</Option>
								<Option value={24}>24 kỳ gần nhất</Option>
								<Option value={48}>48 kỳ gần nhất</Option>
							</Select>
							<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
								Chỉ hiển thị số lượng kỳ gần nhất trên biểu đồ (0 = hiển thị tất cả)
							</Text>
						</div>

						<div>
							<Text strong>Kiểu hiển thị</Text>
							<div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
								<Button
									type={newCard.chartViewType === 'line' ? 'primary' : 'default'}
									onClick={() => setNewCard({ ...newCard, chartViewType: 'line' })}
									size="small"
								>
									Line
								</Button>
								<Button
									type={newCard.chartViewType === 'stacked_area' ? 'primary' : 'default'}
									onClick={() => setNewCard({ ...newCard, chartViewType: 'stacked_area' })}
									size="small"
								>
									Stacked area
								</Button>
								<Button
									type={newCard.chartViewType === 'stacked_bar' ? 'primary' : 'default'}
									onClick={() => setNewCard({ ...newCard, chartViewType: 'stacked_bar' })}
									size="small"
								>
									Stacked bar
								</Button>
								<Button
									type={newCard.chartViewType === 'normalizebar' ? 'primary' : 'default'}
									onClick={() => setNewCard({ ...newCard, chartViewType: 'normalizebar' })}
									size="small"
								>
									Normalize 100%
								</Button>
							</div>
							<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
								Chọn kiểu hiển thị biểu đồ so sánh
							</Text>
						</div>
					</>)}

					{newCard.type === 'top' && (<>
						<div>
							<Text strong>Chọn dữ liệu *</Text>
							<Select
								value={selectedApprovedVersion}
								onChange={handleApprovedVersionChange}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn dữ liệu"
								showSearch
								filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								loading={loading}
							>
								{approvedVersions.map(version => (<Option key={version.id} value={version.id}>
									{version.name}
								</Option>))}
							</Select>
						</div>

						{templateColumns.length > 0 && (<>
							<div>
								<Text strong>Chọn cột tên *</Text>
								<Select
									value={selectedColumns.column1}
									onChange={(value) => setSelectedColumns({
										...selectedColumns, column1: value,
									})}
									style={{ width: '100%', marginTop: 8 }}
									placeholder="Chọn cột chứa tên"
								>
									{templateColumns.map(col => (<Option key={col.id} value={col.id}>
										{col.columnName}
									</Option>))}
								</Select>
							</div>

							<div>
								<Text strong>Chọn cột giá trị *</Text>
								<Select
									value={selectedColumns.column2}
									onChange={(value) => setSelectedColumns({
										...selectedColumns, column2: value,
									})}
									style={{ width: '100%', marginTop: 8 }}
									placeholder="Chọn cột chứa giá trị"
								>
									{templateColumns.map(col => (<Option key={col.id} value={col.id}>
										{col.columnName}
									</Option>))}
								</Select>
							</div>

							<div>
								<Text strong>Số lượng hiển thị (Top N)</Text>
								<Input
									type="number"
									value={topN}
									onChange={(e) => setTopN(parseInt(e.target.value) || 5)}
									style={{ width: '100%', marginTop: 8 }}
									placeholder="Nhập số lượng (mặc định: 5)"
									min={1}
									max={50}
								/>
							</div>
						</>)}
					</>)}
					{newCard.type === 'table' && (<>
						<div>
							<Text strong>Chọn dữ liệu *</Text>
							<Select
								value={newCard.idData}
								onChange={handleNewTableApprovedVersionChange}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn dữ liệu"
								showSearch
								filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								loading={loading}
							>
								{approvedVersions.map(version => (<Option key={version.id} value={version.id}>
									{version.name}
								</Option>))}
							</Select>
						</div>

						{newTemplateColumns.length > 0 && (<>
							<Row gutter={16}>
								<Col span={8}>
									<div>
										<Text strong>Thời gian</Text>
										<Select
											value={newTableDateColumn || undefined}
											onChange={(value) => setNewTableDateColumn(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn cột thời gian (tùy chọn)"
											showSearch
											filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
											allowClear
										>
											{newTemplateColumns
												.map(col => (<Option key={col.id} value={col.id}>
													{col.columnName}
												</Option>))}
										</Select>
									</div>
								</Col>
								<Col span={8}>
									<div>
										<Text strong>Mốc thời gian phân tích AI</Text>
										<Input
											type="datetime-local"
											value={newTableTimeThreshold || ''}
											onChange={(e) => setNewTableTimeThreshold(e.target.value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn mốc thời gian"
										/>
										<Text type="secondary"
											  style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
											Khi chạy AI, chỉ phân tích dữ liệu từ mốc thời gian này trở đi
										</Text>
									</div>
								</Col>
								<Col span={8}>
									<div>
										<Text strong>Khoảng thời gian mặc định</Text>
										<Select
											value={newTableDateRange}
											onChange={(value) => setNewTableDateRange(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn khoảng thời gian mặc định"
										>
											<Option value="all">Tất cả dữ liệu</Option>
											<Option value="today">Hôm nay</Option>
											<Option value="yesterday">Hôm qua</Option>
											<Option value="thisWeek">Tuần này</Option>
											<Option value="lastWeek">Tuần trước</Option>
											<Option value="thisMonth">Tháng này</Option>
											<Option value="lastMonth">Tháng trước</Option>
											<Option value="last7Days">7 ngày gần nhất</Option>
											<Option value="last15Days">15 ngày gần nhất</Option>
											<Option value="last30Days">30 ngày gần nhất</Option>
											<Option value="last90Days">90 ngày gần nhất</Option>
											<Option value="thisYear">Năm nay</Option>
											<Option value="lastYear">Năm trước</Option>
										</Select>
										<Text type="secondary"
											  style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
											Khoảng thời gian này sẽ được áp dụng mặc định khi xem bảng
										</Text>
									</div>
								</Col>
								<Col span={8}>
									<div>
										<Text strong>Kích thước cột thời gian</Text>
										<Select
											value={newTableDateColumnSize}
											onChange={(value) => setNewTableDateColumnSize(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn kích thước cột thời gian"
										>
											<Option value={0.5}>Rất nhỏ (0.5)</Option>
											<Option value={1}>Nhỏ (1)</Option>
											<Option value={2}>Vừa (2)</Option>
											<Option value={3}>Lớn (3)</Option>
										</Select>
										<Text type="secondary"
											  style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
											Kích thước cột thời gian trong bảng
										</Text>
									</div>
								</Col>
							</Row>

							<Row gutter={16}>
								<Col span={8}>
									<div>
										<Text strong>Cột lọc dữ liệu</Text>
										<Select
											value={newTableFilterColumn || undefined}
											onChange={(value) => setNewTableFilterColumn(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn cột để lọc (tùy chọn)"
											showSearch
											filterOption={(input, option) =>
												option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
											}
											allowClear
										>
											{newTemplateColumns.map(col => (
												<Option key={col.id} value={col.id}>
													{col.columnName}
												</Option>
											))}
										</Select>
										<Text type="secondary" style={{
											fontSize: '12px',
											marginTop: 4,
											display: 'block',
										}}>
											Chọn cột để hiển thị bộ lọc bên cạnh bộ lọc thời gian
										</Text>
									</div>
								</Col>
								<Col span={8}>
									<div>
										<Text strong>Cột sắp xếp dữ liệu</Text>
										<Select
											value={newTableSortColumn || undefined}
											onChange={(value) => setNewTableSortColumn(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn cột để sắp xếp (tùy chọn)"
											showSearch
											filterOption={(input, option) =>
												option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
											}
											allowClear
										>
											{newTemplateColumns.map(col => (
												<Option key={col.id} value={col.id}>
													{col.columnName}
												</Option>
											))}
										</Select>
										<Text type="secondary" style={{
											fontSize: '12px',
											marginTop: 4,
											display: 'block',
										}}>
											Chọn cột để sắp xếp dữ liệu trong bảng
										</Text>
									</div>
								</Col>
								<Col span={8}>
									<div>
										<Text strong>Kiểu sắp xếp</Text>
										<Select
											value={newTableSortType}
											onChange={(value) => setNewTableSortType(value)}
											style={{ width: '100%', marginTop: 8 }}
											placeholder="Chọn kiểu sắp xếp"
											disabled={!newTableSortColumn}
										>
											<Option value="desc">Từ lớn đến bé (100, 90, 10, 0, -10, -100)</Option>
											<Option value="desc_abs">Dương giảm dần → Âm tăng dần (100, 90, 10, -100,
												-20,
												-10)</Option>
										</Select>
										<Text type="secondary" style={{
											fontSize: '12px',
											marginTop: 4,
											display: 'block',
										}}>
											Kiểu sắp xếp dữ liệu theo cột đã chọn
										</Text>
									</div>
								</Col>
							</Row>

							{/* Advanced filters for new table */}
							<div style={{ marginTop: 12 }}>
								<Text strong>Bộ lọc</Text>
								<div style={{ marginTop: 8 }}>
									<Select
										value={newTableFilterLogic}
										onChange={(v) => setNewTableFilterLogic(v)}
										style={{ width: '260px', marginBottom: 8 }}
									>
										<Option value="AND">Kết hợp điều kiện: AND</Option>
										<Option value="OR">Kết hợp điều kiện: OR</Option>
									</Select>

									{newTableFilters.map((f, idx) => (
										<div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
											<Select
												value={f.columnId}
												onChange={(v) => {
													const copy = [...newTableFilters];
													copy[idx] = { ...copy[idx], columnId: v };
													setNewTableFilters(copy);
												}}
												style={{ flex: 1 }}
												showSearch
												filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
											>
												{newTemplateColumns.map(col => (
													<Option key={col.id} value={col.id}>{col.columnName}</Option>
												))}
											</Select>
											<Select
												value={f.operator}
												onChange={(v) => {
													const copy = [...newTableFilters];
													copy[idx] = { ...copy[idx], operator: v };
													setNewTableFilters(copy);
												}}
												style={{ width: 130 }}
											>
												<Option value=">">{'>'}</Option>
												<Option value="<">{'<'}</Option>
												<Option value=">=">{'>='}</Option>
												<Option value="<=">{'<='}</Option>
												<Option value="#"># (khác)</Option>
												<Option value="=">=</Option>
												<Option value="not_empty">is not empty</Option>
											</Select>
											<Input
												value={f.value}
												onChange={(e) => {
													const copy = [...newTableFilters];
													copy[idx] = { ...copy[idx], value: e.target.value };
													setNewTableFilters(copy);
												}}
												style={{ flex: 1 }}
												disabled={f.operator === 'not_empty'}
											/>
											<Button danger onClick={() => {
												const copy = [...newTableFilters];
												copy.splice(idx, 1);
												setNewTableFilters(copy);
											}} size="small">Xóa</Button>
										</div>
									))}

									<Button onClick={() => setNewTableFilters([...newTableFilters, {
										columnId: undefined,
										operator: '=',
										value: '',
									}])} size="small">Thêm điều kiện</Button>
								</div>
							</div>

							<div>
								<Text strong>Chọn cột hiển thị *</Text>
								<Select
									mode="multiple"
									value={newTableDisplayColumns || []}
									onChange={handleNewTableDisplayColumnsChange}
									style={{ width: '100%', marginTop: 8 }}
									placeholder="Chọn các cột để hiển thị"
									showSearch
									filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								>
									{newTemplateColumns.map(col => (<Option key={col.id} value={col.id}>
										{col.columnName}
									</Option>))}
								</Select>
							</div>


							{/* Column Settings for new table */}
							<div>
								<Text strong>Cài đặt hiển thị cột</Text>

								{newTableDisplayColumns.length === 0 && (<div style={{
									padding: '16px',
									textAlign: 'center',
									backgroundColor: '#fafafa',
									borderRadius: '6px',
									color: '#666',
									marginTop: 8,
								}}>
									Vui lòng chọn cột hiển thị để cấu hình.
								</div>)}

								{newTableDisplayColumns.map((columnId) => {
									const columnSetting = newTableColumnSettings[columnId] || {
										type: 'text', dateFormat: 'DD/MM/YY', valueFormat: {
											showThousands: false,
											showMillions: false,
											showPercentage: false,
											decimalPlaces: 0,
											negativeRed: false,
										},
									};
									const columnName = newTemplateColumns.find(col => col.id === columnId)?.columnName || `Cột ${columnId}`;
									const isCollapsed = newCollapsedColumns[columnId];

									return (<Card
										key={columnId}
										size="small"
										style={{ marginTop: 8, marginBottom: 8 }}
										bodyStyle={{ padding: 0 }}
									>
										<div style={{
											display: 'flex',
											alignItems: 'center',
											padding: '12px 16px',
											borderBottom: isCollapsed ? 'none' : '1px solid #f0f0f0',
											cursor: 'pointer',
											backgroundColor: '#fafafa',
										}}
											 onClick={() => toggleNewColumnCollapse(columnId)}
										>
											<div style={{
												width: '30%',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}>
												<Text strong style={{ margin: 0 }}>{columnName}</Text>
											</div>
											<div style={{
												width: '70%',
												paddingLeft: '16px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}>
												<Text type="secondary" style={{ fontSize: '12px' }}>
													{columnSetting.type === 'date' ? 'Ngày tháng' : columnSetting.type === 'value' ? 'Giá trị' : columnSetting.type === 'dataBar' ? 'Data Bar' : columnSetting.type === 'text' ? 'Chữ' : 'Giá trị'}
													{columnSetting.type === 'date' && ` - ${columnSetting.dateFormat}`}
													{(columnSetting.type === 'value' || columnSetting.type === 'dataBar') && (<>
														{columnSetting.valueFormat.showThousands && ' - K'}
														{columnSetting.valueFormat.showMillions && ' - M'}
														{columnSetting.valueFormat.showPercentage && ' - %'}
														{columnSetting.valueFormat.decimalPlaces > 0 && ` - ${columnSetting.valueFormat.decimalPlaces}dp`}
													</>)}
													{newTableColumnSizes[columnId] && ` - Size ${newTableColumnSizes[columnId]}`}
												</Text>
												{isCollapsed ? <ChevronRight /> : <ChevronDown />}
											</div>
										</div>

										{!isCollapsed && (<div style={{ padding: '8px 32px' }}>
											<div style={{ display: 'flex', gap: '16px' }}>
												<div style={{ width: '30%' }}>
													<Text strong>Loại dữ liệu</Text>
												</div>
												<div style={{ width: '70%' }}>
													<Select
														value={columnSetting.type}
														onChange={(value) => {
															const newSettings = { ...newTableColumnSettings };
															newSettings[columnId] = {
																...newSettings[columnId], type: value,
															};
															setNewTableColumnSettings(newSettings);
														}}
														style={{ width: '100%' }}
													>
														<Option value="date">Ngày tháng</Option>
														<Option value="value">Giá trị</Option>
														<Option value="dataBar">Data Bar</Option>
														<Option value="text">Chữ</Option>
													</Select>
												</div>
											</div>

											{columnSetting.type === 'date' && (<div style={{
												display: 'flex', gap: '16px', marginTop: '12px',
											}}>
												<div style={{ width: '30%' }}>
													<Text strong>Định dạng ngày</Text>
												</div>
												<div style={{ width: '70%' }}>
													<Select
														value={columnSetting.dateFormat}
														onChange={(value) => {
															const newSettings = { ...newTableColumnSettings };
															newSettings[columnId] = {
																...newSettings[columnId],
																dateFormat: value,
															};
															setNewTableColumnSettings(newSettings);
														}}
														style={{ width: '100%' }}
													>
														<Option value="DD/MM/YY">DD/MM/YY</Option>
														<Option
															value="DD/MM/YYYY">DD/MM/YYYY</Option>
														<Option value="MM/DD/YY">MM/DD/YY</Option>
														<Option
															value="MM/DD/YYYY">MM/DD/YYYY</Option>
													</Select>
												</div>
											</div>)}

											{(columnSetting.type === 'value' || columnSetting.type === 'dataBar') && (<>
												<div style={{
													display: 'flex', gap: '16px', marginTop: '12px',
												}}>
													<div style={{ width: '30%' }}>
														<Text strong>Định dạng hiển thị</Text>
													</div>
													<div style={{ width: '70%' }}>
														<Space direction="vertical"
															   style={{ width: '100%' }}>
															<div>
																<Checkbox
																	checked={columnSetting.valueFormat.showThousands}
																	onChange={(e) => {
																		const newSettings = { ...newTableColumnSettings };
																		newSettings[columnId] = {
																			...newSettings[columnId],
																			valueFormat: {
																				...newSettings[columnId].valueFormat,
																				showThousands: e.target.checked,
																			},
																		};
																		setNewTableColumnSettings(newSettings);
																	}}
																>
																	Thể hiện hàng nghìn (K)
																</Checkbox>
															</div>
															<div>
																<Checkbox
																	checked={columnSetting.valueFormat.showMillions}
																	onChange={(e) => {
																		const newSettings = { ...newTableColumnSettings };
																		newSettings[columnId] = {
																			...newSettings[columnId],
																			valueFormat: {
																				...newSettings[columnId].valueFormat,
																				showMillions: e.target.checked,
																			},
																		};
																		setNewTableColumnSettings(newSettings);
																	}}
																>
																	Thể hiện hàng triệu (M)
																</Checkbox>
															</div>
															<div>
																<Checkbox
																	checked={columnSetting.valueFormat.showPercentage}
																	onChange={(e) => {
																		const newSettings = { ...newTableColumnSettings };
																		newSettings[columnId] = {
																			...newSettings[columnId],
																			valueFormat: {
																				...newSettings[columnId].valueFormat,
																				showPercentage: e.target.checked,
																			},
																		};
																		setNewTableColumnSettings(newSettings);
																	}}
																>
																	Thể hiện dạng %
																</Checkbox>
															</div>
															<div>
																<Checkbox
																	checked={columnSetting.valueFormat.negativeRed}
																	onChange={(e) => {
																		const newSettings = { ...newTableColumnSettings };
																		newSettings[columnId] = {
																			...newSettings[columnId],
																			valueFormat: {
																				...newSettings[columnId].valueFormat,
																				negativeRed: e.target.checked,
																			},
																		};
																		setNewTableColumnSettings(newSettings);
																	}}
																>
																	Số âm màu đỏ
																</Checkbox>
															</div>
														</Space>
													</div>
												</div>

												<div style={{
													display: 'flex', gap: '16px', marginTop: '12px',
												}}>
													<div style={{ width: '30%' }}>
														<Text strong>Số thập phân</Text>
													</div>
													<div style={{ width: '70%' }}>
														<Select
															value={columnSetting.valueFormat.decimalPlaces}
															onChange={(value) => {
																const newSettings = { ...newTableColumnSettings };
																newSettings[columnId] = {
																	...newSettings[columnId],
																	valueFormat: {
																		...newSettings[columnId].valueFormat,
																		decimalPlaces: value,
																	},
																};
																setNewTableColumnSettings(newSettings);
															}}
															style={{ width: '100%' }}
														>
															<Option value={0}>0 (không có thập
																phân)</Option>
															<Option value={1}>1</Option>
															<Option value={2}>2</Option>
														</Select>
													</div>
												</div>

												<div style={{
													display: 'flex', gap: '16px', marginTop: '12px',
												}}>
													<div style={{ width: '30%' }}>
														<Text strong>Kích thước cột</Text>
													</div>
													<div style={{ width: '70%' }}>
														<Select
															value={newTableColumnSizes[columnId] || 2}
															onChange={(value) => {
																setNewTableColumnSizes(prev => ({
																	...prev, [columnId]: value,
																}));
															}}
															style={{ width: '100%' }}
														>
															<Option value={0.5}>Rất nhỏ
																(0.5)</Option>
															<Option value={1}>Nhỏ (1)</Option>
															<Option value={2}>Vừa (2)</Option>
															<Option value={3}>Lớn (3)</Option>
														</Select>
													</div>
												</div>
											</>)}
										</div>)}
									</Card>);
								})}
							</div>
						</>)}
					</>)}
					{newCard.type === 'statistics' && (<>
						<div>
							<Text strong>Chọn KPI Calculators *</Text>
							<Select
								mode="multiple"
								value={newCard.selectedKpiCalculators}
								onChange={(value) => setNewCard({ ...newCard, selectedKpiCalculators: value })}
								style={{ width: '100%', marginTop: 8 }}
								placeholder="Chọn nhiều KPI Calculator"
								showSearch
								filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
							>
								{kpiCalculators.map(kpi => (<Option key={kpi.id} value={kpi.id}>
									{kpi.name}
								</Option>))}
							</Select>
							<Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
								Chọn nhiều KPI Calculator để hiển thị theo hàng dọc
							</Text>
						</div>
					</>)}

					<Row gutter={16}>
						<Col span={12}>
							<div>
								<Text strong>Tag Function (Bắt buộc)</Text>
								<Select
									value={newCard.tag}
									onChange={(value) => setNewCard({ ...newCard, tag: value })}
									style={{ width: '100%', marginTop: 8 }}
								>
									{businessTags.filter(tag => tag !== 'All').map(tag => (
										<Option key={tag} value={tag}>{tag}</Option>))}
								</Select>
							</div>
						</Col>
						<Col span={12}>
							<div>
								<Text strong>Tag Unit (Bắt buộc)</Text>
								<Select
									value={newCard.storeTag}
									onChange={(value) => setNewCard({ ...newCard, storeTag: value })}
									style={{ width: '100%', marginTop: 8 }}
								>
									{storeTags.filter(tag => tag !== 'All').map(tag => (
										<Option key={tag} value={tag}>{tag}</Option>))}
								</Select>
							</div>
						</Col>
					</Row>
					{currentUser && (currentUser.isSuperAdmin) && <div>
						<Text strong>Yêu cầu cho AI</Text>
						<Input.TextArea
							value={newCard.prompt}
							onChange={(e) => setNewCard({ ...newCard, prompt: e.target.value })}
							placeholder="Nhập prompt..."
							style={{ marginTop: 8 }}
							rows={3}
						/>
					</div>}
					<div>
						<Text strong>Phân tích</Text>
						<Input.TextArea
							value={newCard.answer}
							onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
							placeholder="Nhập mô tả..."
							style={{ marginTop: 8 }}
							rows={4}
						/>
					</div>
				</Space>
			</Modal>

			{/* KPI2 Calculator Info Modal */}
			<Kpi2CalcInfoModal
				open={showKpi2InfoModal}
				onClose={() => setShowKpi2InfoModal(false)}
				kpi2CalculatorId={kpi2InfoId}
				allKpiCalculators={kpiCalculators}
				dashboardItemId={kpi2InfoDashboardItemId}
				dashboardItemSettings={dashboardItems.find(d => d.id === kpi2InfoDashboardItemId)?.settings || {}}
				onSaveDashboardItemSettings={async (newSettings) => {
					const item = dashboardItems.find(d => d.id === kpi2InfoDashboardItemId);
					if (!item) return;
					const updated = { ...item, settings: { ...(item.settings || {}), ...newSettings } };
					await updateDashBoardItem(updated);
					setDashboardItems(prev => prev.map(d => d.id === updated.id ? updated : d));
				}}
			/>

			<EditDashboardItemModal
				editingDashboardItem={editingDashboardItem}
				setEditingDashboardItem={setEditingDashboardItem}
				settingModalVisible={settingModalVisible}
				handleCancelEdit={handleCancelEdit}
				handleSaveEdit={handleSaveEdit}
				businessTags={businessTags}
				storeTags={storeTags}
				kpi2Calculators={kpi2Calculators}
				kpiCalculators={kpiCalculators}
				editSelectedKpis={editSelectedKpis}
				setEditSelectedKpis={setEditSelectedKpis}
				editSelectedKpiCalculators={editSelectedKpiCalculators}
				setEditSelectedKpiCalculators={setEditSelectedKpiCalculators}
				approvedVersions={approvedVersions}
				editSelectedApprovedVersion={editSelectedApprovedVersion}
				handleEditApprovedVersionChange={handleEditApprovedVersionChange}
				editTemplateColumns={editTemplateColumns}
				editSelectedColumns={editSelectedColumns}
				setEditSelectedColumns={setEditSelectedColumns}
				editTopN={editTopN}
				setEditTopN={setEditTopN}
				editRecentPeriods={editRecentPeriods}
				setEditRecentPeriods={setEditRecentPeriods}
				editChartViewType={editChartViewType}
				setEditChartViewType={setEditChartViewType}
				editTableChartTimeColumn={editTableChartTimeColumn}
				setEditTableChartTimeColumn={setEditTableChartTimeColumn}
				editTableChartGroupColumn={editTableChartGroupColumn}
				setEditTableChartGroupColumn={setEditTableChartGroupColumn}
				editTableChartValueColumn={editTableChartValueColumn}
				setEditTableChartValueColumn={setEditTableChartValueColumn}
				editTableChartType={editTableChartType}
				setEditTableChartType={setEditTableChartType}
				editTableChartDataGrouping={editTableChartDataGrouping}
				setEditTableChartDataGrouping={setEditTableChartDataGrouping}
				editTableChart2Columns={editTableChart2Columns}
				editTableChart2TimeColumn={editTableChart2TimeColumn}
				setEditTableChart2TimeColumn={setEditTableChart2TimeColumn}
				editTableChart2GroupColumn={editTableChart2GroupColumn}
				setEditTableChart2GroupColumn={setEditTableChart2GroupColumn}
				editTableChart2ValueColumn={editTableChart2ValueColumn}
				setEditTableChart2ValueColumn={setEditTableChart2ValueColumn}
				editTableChart2Type={editTableChart2Type}
				setEditTableChart2Type={setEditTableChart2Type}
				editTableChart2DateRange={editTableChart2DateRange}
				setEditTableChart2DateRange={setEditTableChart2DateRange}
				editTableDateColumn={editTableDateColumn}
				setEditTableDateColumn={setEditTableDateColumn}
				editTableDateRange={editTableDateRange}
				setEditTableDateRange={setEditTableDateRange}
				editTableDateColumnSize={editTableDateColumnSize}
				setEditTableDateColumnSize={setEditTableDateColumnSize}
				editTableDisplayColumns={editTableDisplayColumns}
				handleTableDisplayColumnsChange={handleTableDisplayColumnsChange}
				editTableColumnSettings={editTableColumnSettings}
				updateTableColumnSetting={updateTableColumnSetting}
				updateTableColumnValueFormat={updateTableColumnValueFormat}
				editTableColumnSizes={editTableColumnSizes}
				setEditTableColumnSizes={setEditTableColumnSizes}
				editTableFilterColumn={editTableFilterColumn}
				setEditTableFilterColumn={setEditTableFilterColumn}
				editTableSortColumn={editTableSortColumn}
				setEditTableSortColumn={setEditTableSortColumn}
				editTableSortType={editTableSortType}
				setEditTableSortType={setEditTableSortType}
				editTableTimeThreshold={editTableTimeThreshold}
				setEditTableTimeThreshold={setEditTableTimeThreshold}
				collapsedColumns={collapsedColumns}
				toggleColumnCollapse={toggleColumnCollapse}
				loading={loading}
			/>

			{/* Tag Settings Modal */}
			<TagSettingsModal
				open={showTagSettingsModal}
				onCancel={() => setShowTagSettingsModal(false)}
				onSave={handleTagSettingsSave}
				businessTags={businessTags}
				storeTags={storeTags}
			/>

			{/* Comparison Modal */}
			<ComparisonModal
				open={showComparisonModal}
				onCancel={closeDetailsModal}
				selectedMetric={selectedMetricForDetails}
				kpi2Calculators={kpi2Calculators}
			/>

			{/* Prompt Settings Modal */}
			<Modal
				title={
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						paddingRight: '40px',
					}}>
						<span>Cài đặt Prompt mặc định</span>
						<Button
							type="text"
							icon={<SettingOutlined />}
							onClick={() => {
								setShowChangePinModal(true);
								setNewPin('');
								setConfirmPin('');
								setSetupPinError('');
							}}
							style={{ fontSize: '14px', color: '#1890ff' }}
						>
							Đổi mã PIN
						</Button>
					</div>
				}
				open={showPromptSettingsModal}
				onCancel={handleCancelPromptSettings}
				footer={[<Button key="cancel" onClick={handleCancelPromptSettings}>
					Hủy
				</Button>, <Button key="save" type="primary" onClick={handleSavePromptSettings}>
					Lưu
				</Button>]}
				width={600}
			>
				<Space direction="vertical" style={{ width: '100%' }}>
					<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
						Prompt mặc định này sẽ được sử dụng khi tạo thẻ mới.
					</Text>
					<Input.TextArea
						value={promptSettingValue}
						onChange={(e) => setPromptSettingValue(e.target.value)}
						placeholder="Nhập prompt mặc định..."
						rows={8}
					/>
				</Space>
			</Modal>

			{/* Setup PIN Modal (lần đầu) */}
			{
				showSetupPinModal && (
					<Modal
						title="Cài đặt mã PIN bảo mật"
						open={showSetupPinModal}
						onCancel={() => {
							setShowSetupPinModal(false);
							setNewPin('');
							setConfirmPin('');
							setSetupPinError('');
						}}
						afterOpenChange={(open) => {
							if (open) {
								// Reset error khi mở modal
								setSetupPinError('');
							}
						}}
						onOk={handleSetupPin}
						okText="Tạo mã PIN"
						cancelText="Hủy"
						width={450}
					>
						<div style={{ padding: '20px 0' }}>
							<Text style={{ marginBottom: '24px', display: 'block', textAlign: 'center', fontSize: '14px' }}>
								Vui lòng tạo mã PIN 6 số để bảo vệ dữ liệu phân tích
							</Text>
							<div style={{ marginBottom: '24px' }}>
								<Text strong style={{ display: 'block', marginBottom: '12px', textAlign: 'center' }}>
									Nhập mã PIN:
								</Text>
								<PinInput
									length={6}
									value={newPin}
									onChange={(pin) => {
										setNewPin(pin);
									}}
									autoFocus={true}
								/>
							</div>
							<div style={{ marginBottom: '16px' }}>
								<Text strong style={{ display: 'block', marginBottom: '12px', textAlign: 'center' }}>
									Xác nhận mã PIN:
								</Text>
								<PinInput
									length={6}
									value={confirmPin}
									onChange={(pin) => {
										setConfirmPin(pin);
									}}
								/>
							</div>
							{setupPinError && (
								<div style={{
									color: '#ff4d4f',
									marginTop: '8px',
									fontSize: '12px',
									padding: '8px',
									backgroundColor: '#fff2f0',
									borderRadius: '4px',
									border: '1px solid #ffccc7',
								}}>
									{setupPinError}
								</div>
							)}
						</div>
					</Modal>
				)
			}


			{/* Change PIN Modal */}
			{
				showChangePinModal && (
					<Modal
						title="Thay đổi mã PIN"
						open={showChangePinModal}
						onCancel={() => {
							setShowChangePinModal(false);
							setNewPin('');
							setConfirmPin('');
							setSetupPinError('');
						}}
						afterOpenChange={(open) => {
							if (open) {
								// Reset error khi mở modal
								setSetupPinError('');
							}
						}}
						onOk={handleChangePin}
						okText="Đổi mã PIN"
						cancelText="Hủy"
						width={450}
					>
						<div style={{ padding: '20px 0' }}>
							<Text style={{ marginBottom: '24px', display: 'block', textAlign: 'center', fontSize: '14px' }}>
								Nhập mã PIN mới (6 số)
							</Text>
							<div style={{ marginBottom: '24px' }}>
								<Text strong style={{ display: 'block', marginBottom: '12px', textAlign: 'center' }}>
									Mã PIN mới:
								</Text>
								<PinInput
									length={6}
									value={newPin}
									onChange={(pin) => {
										setNewPin(pin);
									}}
									autoFocus={true}
								/>
							</div>
							<div style={{ marginBottom: '16px' }}>
								<Text strong style={{ display: 'block', marginBottom: '12px', textAlign: 'center' }}>
									Xác nhận mã PIN mới:
								</Text>
								<PinInput
									length={6}
									value={confirmPin}
									onChange={(pin) => {
										setConfirmPin(pin);
									}}
								/>
							</div>
							{setupPinError && (
								<div style={{
									color: '#ff4d4f',
									marginTop: '8px',
									fontSize: '12px',
									padding: '8px',
									backgroundColor: '#fff2f0',
									borderRadius: '4px',
									border: '1px solid #ffccc7',
								}}>
									{setupPinError}
								</div>
							)}
						</div>
					</Modal>
				)
			}


			{/* PIN Verification Modal */}
			{
				showPinModal && (
					<Modal
						title="Nhập mã PIN để tiếp tục"
						open={showPinModal}
						onCancel={() => {
							setShowPinModal(false);
							setPinInput('');
							setPinError('');
						}}
						afterOpenChange={(open) => {
							if (open) {
								// Reset error khi mở modal
								setPinError('');
							}
						}}
						onOk={handleVerifyPin}
						okText="Xác nhận"
						cancelText="Hủy"
						width={400}
					>
						<div style={{ padding: '20px 0' }}>
							<Text style={{ marginBottom: '24px', display: 'block', textAlign: 'center', fontSize: '14px' }}>
								Vui lòng nhập mã PIN 6 số để tiếp tục
							</Text>
							<PinInput
								length={6}
								value={pinInput}
								onChange={(pin) => {
									setPinInput(pin);
								}}
								autoFocus={true}
							/>
							{pinError && (
								<div style={{
									color: '#ff4d4f',
									marginTop: '8px',
									fontSize: '12px',
								}}>
									{pinError}
								</div>
							)}
						</div>
					</Modal>
				)
			}


			{/* Analysis Detail Modal */}
			{analysisDetailModal.visible && (<AnalysisDetailModal
				key={`${analysisDetailModal.item?.id}-${analysisDetailModal.analysis?.answer ? 'has-analysis' : 'no-analysis'}`}
				visible={analysisDetailModal.visible}
				onClose={closeAnalysisDetailModal}
				analysis={analysisDetailModal.analysis}
				item={analysisDetailModal.item}
				onReanalyze={(selectedAIModel) => handleReanalyzeInModal(selectedAIModel)}
				isAnalyzing={analyzingItems.has(analysisDetailModal.item?.id)}
				chartOptions={chartOptions}
				currentUser={currentUser}
				onItemUpdate={handleItemUpdate}
				tableData={tableData}
				// PIN Security props
				setShowPinModal={setShowPinModal}
				savedPin={savedPin}
				isPinVerified={isPinVerified}
				setIsPinVerified={setIsPinVerified}
				// Change PIN props
				setShowChangePinModal={setShowChangePinModal}
				// Setup PIN props
				setShowSetupPinModal={setShowSetupPinModal}
				setNewPin={setNewPin}
				setConfirmPin={setConfirmPin}
				setSetupPinError={setSetupPinError}

			/>)}

			{/* Background Colors Modal */}
			<Modal
				open={showBackgroundModal}
				title="Cấu hình màu sắc Dashboard"
				onCancel={() => setShowBackgroundModal(false)}
				footer={[
					<Button key="cancel" onClick={() => setShowBackgroundModal(false)}>
						Hủy
					</Button>,
					<Button key="save" type="primary" onClick={handleSaveBackgroundColors}>
						Lưu
					</Button>,
				]}
				width={600}
			>
				<div style={{ color: 'var(--text-primary)' }}>
					<div style={{ marginBottom: '20px' }}>
						<p style={{ marginBottom: '12px', fontWeight: '500' }}>Chọn màu sắc cho Dashboard:</p>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
						{/* Background Gradient Colors */}
						<div>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
								Màu nền 1 (Gradient Color 1):
							</label>
							<ColorPicker
								value={dashboardColors.background?.gradient?.[0] || '#b7b7b7'}
								onChange={(color) => {
									const newGradient = [...(dashboardColors.background?.gradient || ['#b7b7b7', '#979797', '#6c6c6c'])];
									newGradient[0] = color.toHexString();
									setDashboardColors(prev => ({
										...prev,
										background: { ...prev.background, gradient: newGradient },
									}));
								}}
								showText
								style={{ width: '100%' }}
							/>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
								Màu nền 2 (Gradient Color 2):
							</label>
							<ColorPicker
								value={dashboardColors.background?.gradient?.[1] || '#979797'}
								onChange={(color) => {
									const newGradient = [...(dashboardColors.background?.gradient || ['#b7b7b7', '#979797', '#6c6c6c'])];
									newGradient[1] = color.toHexString();
									setDashboardColors(prev => ({
										...prev,
										background: { ...prev.background, gradient: newGradient },
									}));
								}}
								showText
								style={{ width: '100%' }}
							/>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
								Màu nền 3 (Gradient Color 3):
							</label>
							<ColorPicker
								value={dashboardColors.background?.gradient?.[2] || '#6c6c6c'}
								onChange={(color) => {
									const newGradient = [...(dashboardColors.background?.gradient || ['#b7b7b7', '#979797', '#6c6c6c'])];
									newGradient[2] = color.toHexString();
									setDashboardColors(prev => ({
										...prev,
										background: { ...prev.background, gradient: newGradient },
									}));
								}}
								showText
								style={{ width: '100%' }}
							/>
						</div>

						{/* Grid Pattern Color */}
						<div>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
								Màu đường kẻ ô vuông (Grid Color):
							</label>
							<ColorPicker
								value={dashboardColors.background?.gridColor || '#ff6b6b'}
								onChange={(color) => {
									setDashboardColors(prev => ({
										...prev,
										background: { ...prev.background, gridColor: color.toHexString() },
									}));
								}}
								showText
								style={{ width: '100%' }}
							/>
						</div>

						{/* Grid Pattern Opacity */}
						<div>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
								Độ trong suốt đường kẻ ô vuông (Grid Opacity):
							</label>
							<input
								type="range"
								min="0.05"
								max="0.5"
								step="0.01"
								value={dashboardColors.background?.gridOpacity || 0.15}
								onChange={(e) => {
									const opacity = parseFloat(e.target.value);
									setDashboardColors(prev => ({
										...prev,
										background: {
											...prev.background,
											gridOpacity: opacity,
										},
									}));
								}}
								style={{ width: '100%' }}
							/>
							<span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
								{dashboardColors.background?.gridOpacity || 0.15}
							</span>
						</div>

						{/* Header Title Colors */}
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
									Màu nền tiêu đề (Header background):
								</label>
								<ColorPicker
									value={dashboardColors.headerTitle?.bgColor || '#1677ff'}
									onChange={(color) => {
										setDashboardColors(prev => ({
											...prev,
											headerTitle: {
												...(prev.headerTitle || {}),
												bgColor: color.toHexString(),
												textColor: prev.headerTitle?.textColor || '#ffffff',
											},
										}));
									}}
									showText
									style={{ width: '100%' }}
								/>
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
									Màu chữ tiêu đề (Header text color):
								</label>
								<ColorPicker
									value={dashboardColors.headerTitle?.textColor || '#ffffff'}
									onChange={(color) => {
										setDashboardColors(prev => ({
											...prev,
											headerTitle: {
												...(prev.headerTitle || {}),
												textColor: color.toHexString(),
												bgColor: prev.headerTitle?.bgColor || '#1677ff',
											},
										}));
									}}
									showText
									style={{ width: '100%' }}
								/>
							</div>
						</div>

						{/* Header Title Background Image */}
						<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
							<label style={{ display: 'block', marginTop: 8, fontWeight: '500' }}>Ảnh nền tiêu
								đề:</label>
							<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
								<Button
									onClick={async () => {
										try {
											const input = document.createElement('input');
											input.type = 'file';
											input.accept = 'image/*';
											input.onchange = async (e) => {
												const file = e.target.files && e.target.files[0];
												if (!file) return;
												const response = await uploadFileService([file]);
												if (response && response.files && response.files.length > 0) {
													const imageUrl = response.files[0].fileUrl;
													setDashboardColors(prev => ({
														...prev,
														headerTitle: {
															...(prev.headerTitle || {}),
															imageUrl,
															useImage: true,
														},
													}));
													message.success('Đã upload ảnh tiêu đề thành công');
												}
											};
											input.click();
										} catch (err) {
											console.error(err);
											message.error('Upload ảnh thất bại');
										}
									}}
								>
									Upload ảnh
								</Button>
								<Input
									placeholder="Dán link ảnh..."
									value={dashboardColors.headerTitle?.imageUrl || ''}
									onChange={(e) => {
										const url = e.target.value;
										setDashboardColors(prev => ({
											...prev,
											headerTitle: { ...(prev.headerTitle || {}), imageUrl: url },
										}));
									}}
									style={{ flex: 1 }}
								/>
								<Checkbox
									checked={!!dashboardColors.headerTitle?.useImage}
									onChange={(e) => {
										const checked = e.target.checked;
										setDashboardColors(prev => ({
											...prev,
											headerTitle: { ...(prev.headerTitle || {}), useImage: checked },
										}));
									}}
								>
									Dùng ảnh
								</Checkbox>
							</div>
							{dashboardColors.headerTitle?.imageUrl && (
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<img src={dashboardColors.headerTitle.imageUrl} alt="preview"
										 style={{ height: 40, borderRadius: 6 }} />
									<Button
										danger
										onClick={() => setDashboardColors(prev => ({
											...prev,
											headerTitle: { ...(prev.headerTitle || {}), imageUrl: '', useImage: false },
										}))}
									>
										Xóa ảnh
									</Button>
								</div>
							)}
						</div>
					</div>

					{/* Preview Section */}
					<div style={{
						marginTop: '20px',
						padding: '15px',
						border: '1px solid var(--border-secondary)',
						borderRadius: '8px',
					}}>
						<p style={{ marginBottom: '10px', fontWeight: '500' }}>Xem trước:</p>
						<div style={{
							height: '60px',
							background: `linear-gradient(45deg, ${Array.isArray(dashboardColors.background?.gradient) && dashboardColors.background.gradient.length > 0 ? dashboardColors.background.gradient.join(', ') : '#b7b7b7, #979797, #6c6c6c'})`,
							borderRadius: '8px',
							marginBottom: '10px',
							position: 'relative',
							overflow: 'hidden',
						}}>
							{/* Grid Pattern Preview */}
							<div style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								backgroundImage: `linear-gradient(90deg, ${dashboardColors.background?.gridColor || '#ff6b6b'} 1px, transparent 1px), linear-gradient(${dashboardColors.background?.gridColor || '#ff6b6b'} 1px, transparent 1px)`,
								backgroundSize: '20px 20px',
								opacity: dashboardColors.background?.gridOpacity || 0.15,
								pointerEvents: 'none',
							}} />
						</div>
						<p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
							Gradient: {Array.isArray(dashboardColors.background?.gradient) && dashboardColors.background.gradient.length > 0 ? dashboardColors.background.gradient.join(' → ') : '#b7b7b7 → #979797 → #6c6c6c'} |
							Grid: {dashboardColors.background?.gridColor || '#ff6b6b'}
						</p>

						{/* Header preview */}
						<div style={{ marginTop: '12px' }}>
							<p style={{ marginBottom: '8px', fontWeight: 500 }}>Xem trước tiêu đề:</p>
							<div style={{
								height: 50,
								borderRadius: 8,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								background: dashboardColors.headerTitle?.useImage && dashboardColors.headerTitle?.imageUrl
									? `url(${dashboardColors.headerTitle.imageUrl}) center/cover no-repeat`
									: (dashboardColors.headerTitle?.bgColor || '#1677ff'),
								color: dashboardColors.headerTitle?.textColor || '#ffffff',
							}}>
								TRUNG TÂM PHÂN TÍCH KINH DOANH
							</div>
						</div>
					</div>
				</div>
			</Modal>
		</div>);
}

export default BusinessMeasurementTab;
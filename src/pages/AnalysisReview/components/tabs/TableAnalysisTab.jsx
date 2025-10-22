import React, { useContext, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
	Button,
	Card,
	Checkbox,
	Col,
	ColorPicker,
	DatePicker,
	Dropdown,
	Input,
	message,
	Modal,
	Row,
	Select,
	Space,
	Spin,
	Tag,
	Tooltip,
	Typography,
} from 'antd';
import { Image, ListRestart, Trash } from 'lucide-react';
import {
	CheckOutlined,
	ExclamationCircleOutlined,
	InfoCircleOutlined,
	PlusOutlined,
	SafetyOutlined,
	SearchOutlined,
	SettingOutlined,
	TagsOutlined,
	DatabaseFilled,
	ExportOutlined,
} from '@ant-design/icons';
import {
	createDashBoardItem,
	deleteDashBoardItem,
	getAllDashBoardItems,
	getDashBoardItemById,
	updateDashBoardItem,
} from '../../../../apis/dashBoardItemService.jsx';
import { aiGen, aiGen2 } from '../../../../apis/botService.jsx';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { getAllTemplateTables, getTableByid, getTemplateRow } from '../../../../apis/templateSettingService.jsx';
import {
	getTemplateRowWithCache,
	preloadApprovedVersionsCache,
	TEMPLATE_ROW_CACHE_TTL,
} from '../../../../utils/templateRowUtils.js';
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
import { loadAndMergeData } from '../../../Canvas/Daas/Content/Template/SettingCombine/logicCombine.js';
import { MyContext } from '../../../../MyContext.jsx';
import { getAllUserClass, getUserClassByEmail } from '../../../../apis/userClassService.jsx';
import { createSetting, getSettingByType, updateSetting } from '../../../../apis/settingService.jsx';
import { DEFAULT_PROMPT_DASHBOARD, SETTING_TYPE } from '../../../../CONST.js';
import { getTypeSchema } from '../../../../apis/settingService.jsx';
import { MODEL_AI_LIST } from '../../../../AI_CONST.js';
import DataSplitModal from '../modals/DataSplitModal.jsx';
import styles from './BusinessMeasurementTab.module.css';
import styles2 from './../modals/AnalysisDetailModal.module.css';
import MetricDetailsModal from '../modals/MetricDetailsModal.jsx';
import AuthorizationModal from '../modals/AuthorizationModal.jsx';
import TagSettingsModal from '../modals/TagSettingsModal.jsx';
import CreateTableModal from '../modals/CreateTableModal.jsx';
import EditTableModal from '../modals/EditTableModal.jsx';
import { IconViewData } from '../../../../icon/IconSVG.js';
import AnalysisDetailModal2 from '../modals/AnalysisDetailModal2.jsx';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Loading3DTower from '../../../../components/Loading3DTower.jsx';
import { powerdrillAnalyzeData } from '../../../../apis/powerdrillService.jsx';

const { Title, Text } = Typography;
const { Option } = Select;

export default function TableAnalysisTab({ onItemCreated, scrollToItemId, isEmbedded = false, setTableItems }) {
	const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);
	const { currentUser } = useContext(MyContext);

	// Pivot configuration state
	const [pivotMode, setPivotMode] = useState({});
	const gridRefs = useRef({});
	const [searchQuery, setSearchQuery] = useState('');
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [showNewCardModal, setShowNewCardModal] = useState(false);
	const [selectedMetricForDetails, setSelectedMetricForDetails] = useState(null);
	const [newCard, setNewCard] = useState({
		title: '',
		type: 'table2',
		tag: '',
		storeTag: '',
		idData: null,
		selectedKpiCalculators: [],
		prompt: '',
		answer: '',
	});
	const [defaultPrompt, setDefaultPrompt] = useState('');
	const [newTableDisplayColumns, setNewTableDisplayColumns] = useState([]);
	const [newTableDateColumn, setNewTableDateColumn] = useState(null);
	const [newTableDateRange, setNewTableDateRange] = useState('all');
	const [newTableTimeThreshold, setNewTableTimeThreshold] = useState(null);
	const [newTableColumnSettings, setNewTableColumnSettings] = useState({});
	const [newTemplateColumns, setNewTemplateColumns] = useState([]);
	const [dashboardItems, setDashboardItems] = useState([]);
	const [kpiCalculators, setKpiCalculators] = useState([]);
	const [loading, setLoading] = useState(false);
	const [chartOptions, setChartOptions] = useState({});
	const [tableData, setTableData] = useState([]);
	const [rawApprovedVersionData, setRawApprovedVersionData] = useState({});
	const [tableLoadingStates, setTableLoadingStates] = useState({});
	const [tableErrorStates, setTableErrorStates] = useState({});
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deletingItemId, setDeletingItemId] = useState(null);
	const [tableColumns, setTableColumns] = useState([]);
	const [loadingTable, setLoadingTable] = useState(false);
	const [totalRows, setTotalRows] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(5000);
	const { RangePicker } = DatePicker;

	// AI Analysis states
	const [analyzingItems, setAnalyzingItems] = useState(new Set());
	const [analysisDetailModal, setAnalysisDetailModal] = useState({
		visible: false, item: null, analysis: null,
	});

	// Analysis editing states
	const [editingAnalysisId, setEditingAnalysisId] = useState(null);
	const [editingAnalysisContent, setEditingAnalysisContent] = useState('');

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

	// For TABLE type date filtering
	const [tableDateRanges, setTableDateRanges] = useState({});
	const [tableQuickDateRanges, setTableQuickDateRanges] = useState({});

	// For TABLE type column filtering
	const [tableColumnFilters, setTableColumnFilters] = useState({});

	// For chart colors
	const [chartColors, setChartColors] = useState([]);
	const [selectedColors, setSelectedColors] = useState([{ id: 1, color: '#13C2C2' }, {
		id: 2, color: '#3196D1',
	}, { id: 3, color: '#6DB8EA' }, { id: 4, color: '#87D2EA' }, { id: 5, color: '#9BAED7' }, {
		id: 6, color: '#C695B7',
	}, { id: 7, color: '#EDCCA1' }, { id: 8, color: '#A4CA9C' }]);


	// For column sizes
	const [newTableColumnSizes, setNewTableColumnSizes] = useState({});
	const [editTableColumnSizes, setEditTableColumnSizes] = useState({});

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
	// For TABLE edit functionality
	const [editTableDisplayColumns, setEditTableDisplayColumns] = useState([]);
	const [editTableDateColumn, setEditTableDateColumn] = useState(null);
	const [editTableDateRange, setEditTableDateRange] = useState('all');
	const [editTableTimeThreshold, setEditTableTimeThreshold] = useState(null);
	const [editTableColumnSettings, setEditTableColumnSettings] = useState({});
	const [collapsedColumns, setCollapsedColumns] = useState({});
	const [newCollapsedColumns, setNewCollapsedColumns] = useState({});

	// For TABLE_CHART type (Biểu đồ từ bảng)
	const [templateTables, setTemplateTables] = useState([]);
	// Tags states
	const [businessTags, setBusinessTags] = useState([]);
	const [storeTags, setStoreTags] = useState([]);
	const [selectedBusinessTags, setSelectedBusinessTags] = useState(['All']);
	const [selectedStoreTags, setSelectedStoreTags] = useState(['All']);
	const [showTagSettingsModal, setShowTagSettingsModal] = useState(false);
	const [showPromptSettingsModal, setShowPromptSettingsModal] = useState(false);

	// State cho modal background colors
	const [showBackgroundModal, setShowBackgroundModal] = useState(false);
	const [dashboardColors, setDashboardColors] = useState({
		background: {
			gradient: ['#1e3c72', '#2980b9', '#6dd5fa'],
			gridColor: '#ff6b6b',
			gridOpacity: 0.15,
		},
	});
	const [promptSettingValue, setPromptSettingValue] = useState('');
	const [promptSettingData, setPromptSettingData] = useState(null);

	const [showAllBusinessTags, setShowAllBusinessTags] = useState(false);
	const [showAllStoreTags, setShowAllStoreTags] = useState(false);
	const [showAnalysis, setShowAnalysis] = useState(true); // State để bật/tắt hiển thị phân tích

	const [isLoading, setIsLoading] = useState(false);

	const [backgroundColors, setBackgroundColors] = useState({
		color: '#e2e2e2', bg_color: '#d4d4d4',
	});

	const [isExporting, setIsExporting] = useState(false);

	// Load Context Instruction from settings
	const loadContextInstruction = async () => {
		try {
			const contextSetting = await getSettingByType('CONTEXT_INSTRUCTION_SETTING');
			if (contextSetting && contextSetting.setting) {
				return contextSetting.setting.instruction || '';
			}
			return '';
		} catch (error) {
			console.error('Error loading CONTEXT_INSTRUCTION_SETTING:', error);
			return '';
		}
	};

	const handleExportHtml = async () => {
		setIsExporting(true);
		try {
			// Assemble data per item
			const rows = [];
			for (const item of filteredMetrics.filter(i => i.id < 100000)) {
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
					statisticsHtml,
					dataTableHtml,
					hasDataTable,
				});
			}

			// Build HTML
			const style = `
				body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;background:#f8f9fa;color:#111;margin:0;padding:20px}
				.container{max-width:1200px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden}
				.header{background:linear-gradient(135deg,#1890ff 0%,#096dd9 100%);color:#fff;padding:24px;text-align:center}
				.header h1{margin:0;font-size:28px;font-weight:600}
				.header p{margin:8px 0 0 0;opacity:0.9;font-size:16px}
				.content{padding:24px}
				.card{display:flex;gap:24px;align-items:flex-start;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:16px 0;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);transition:box-shadow 0.2s}
				.card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.15)}
				.card-left{flex:1;min-width:0}
				.card-right{flex:2;min-width:0}
				.card-title{margin:0 0 12px 0;font-size:20px;color:#111;font-weight:600;line-height:1.3}
				.card-desc{margin:0 0 16px 0;color:#6b7280;font-size:14px;line-height:1.5}
				.analysisContent{color:#374151;line-height:1.6;font-size:14px}
				.analysisContent h1,.analysisContent h2,.analysisContent h3,.analysisContent h4,.analysisContent h5,.analysisContent h6{color:#262626;margin:20px 0 12px 0;font-weight:600}
				.analysisContent p{margin:12px 0;text-align:justify}
				.analysisContent ul,.analysisContent ol{margin:8px 0;padding-left:24px}
				.analysisContent table{width:100%;border-collapse:collapse;margin:12px 0}
				.analysisContent table th,.analysisContent table td{border:1px solid #e5e7eb;padding:12px 16px;text-align:left}
				.analysis-wrapper{position:relative;max-height:300px;overflow:hidden;border:1px solid #f0f0f0;border-radius:8px;padding:16px;background:#fafafa}
				.analysis-wrapper.expanded{max-height:none;overflow:visible}
				.analysis-fade{position:absolute;left:0;right:0;bottom:0;height:60px;background:linear-gradient(to bottom, rgba(250,250,250,0), #fafafa)}
				.button-group{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
				.analysis-toggle{display:inline-block;background:#1890ff;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;transition:background 0.2s}
				.analysis-toggle:hover{background:#40a9ff}
				.view-data-btn{background:#52c41a;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:6px}
				.view-data-btn:hover{background:#73d13d;transform:translateY(-1px)}
				.view-data-btn:before{content:"📊"}
				.stats-list{display:flex;flex-direction:column;gap:12px;margin-top:16px}
				.stats-item{display:flex;align-items:center;justify-content:space-between;border:1px solid #e8e8e8;border-radius:8px;padding:16px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05)}
				.stats-left{display:flex;flex-direction:column;gap:4px}
				.stats-name{font-size:14px;color:#333;font-weight:500}
				.stats-value{font-size:24px;color:#111;font-weight:600}
				.stats-right{font-size:14px;font-weight:600;padding:4px 8px;border-radius:4px;background:#f0f0f0}
				.modal{display:none;position:fixed;z-index:1000;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px)}
				.modal-content{background:#fff;margin:2% auto;padding:0;border-radius:12px;width:95%;max-width:1400px;max-height:90vh;overflow:hidden;position:relative;box-shadow:0 10px 30px rgba(0,0,0,0.3)}
				.modal-header{background:#f8f9fa;padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center}
				.modal-title{margin:0;font-size:20px;color:#111;font-weight:600}
				.close{color:#aaa;font-size:28px;font-weight:bold;cursor:pointer;line-height:1;transition:color 0.2s}
				.close:hover{color:#000}
				.modal-body{padding:24px;max-height:calc(90vh - 80px);overflow-y:auto}
				.expanded-data-table{width:100%;border-collapse:collapse;font-size:13px;background:#fff}
				.expanded-data-table th,.expanded-data-table td{border:1px solid #e5e7eb;padding:12px 16px;text-align:left}
				.expanded-data-table thead th{background:#f8f9fa;font-weight:600;color:#495057;position:sticky;top:0;z-index:10}
				.expanded-data-table tbody tr:nth-child(even){background:#f8f9fa}
				.expanded-data-table tbody tr:hover{background:#e6f7ff}
				.no-data{text-align:center;color:#6c757d;font-style:italic;padding:40px;background:#f8f9fa;border-radius:8px;margin:16px 0}
			`;

			const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" />
				<title>Dashboard Export</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<style>${style}</style>
			</head><body>
				<div class="container">
					<div class="header">
						<h1>📊 Dashboard Export</h1>
						<p>Báo cáo phân tích dữ liệu - ${new Date().toLocaleDateString('vi-VN')}</p>
					</div>
					<div class="content">
						${rows.map(r => `
							<div class="card">
						
								<div class="card-right">
									<div class="analysis-wrapper" id="analysis-${r.id}">
										<div class="analysisContent">${r.analysisHtml || '<div class="no-data">Không có phân tích</div>'}</div>
										<div class="analysis-fade"></div>
									</div>
									<div class="button-group">
										<button class="analysis-toggle" onclick="toggleAnalysis('${r.id}', event)">Xem thêm</button>
										${r.hasDataTable ? `<button class="view-data-btn" onclick="openDataModal('${r.id}')">Xem bảng dữ liệu</button>` : ''}
									</div>
								</div>
							</div>
						`).join('')}
					</div>
				</div>
				
				<!-- Data Modals -->
				${rows.filter(r => r.hasDataTable).map(r => `
					<div id="modal-${r.id}" class="modal">
						<div class="modal-content">
							<div class="modal-header">
								<h3 class="modal-title">📊 Bảng dữ liệu - ${r.name ? String(r.name).replace(/</g, '&lt;') : ''}</h3>
								<span class="close" onclick="closeDataModal('${r.id}')">&times;</span>
							</div>
							<div class="modal-body">
								${r.dataTableHtml.replace('data-table', 'expanded-data-table')}
							</div>
						</div>
					</div>
				`).join('')}
				
				<script>
					function toggleAnalysis(id, event){
						const wrapper = document.getElementById('analysis-' + id);
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

	// Load dashboard background colors
	useEffect(() => {
		setIsLoading(true);
		const loadDashboardColorSettings = async () => {
			try {
				const existing = await getSettingByType('TABLE_ANALYSIS_BACKGROUND_COLORS');

				if (existing && existing.setting && typeof existing.setting === 'object') {
					const { background } = existing.setting;
					if (background &&
						Array.isArray(background.gradient) &&
						background.gradient.length > 0 &&
						background.gridColor !== undefined &&
						background.gridOpacity !== undefined) {
						setDashboardColors({ background });
					} else {
						// Ensure default values are set
						setDashboardColors({
							background: {
								gradient: ['#1e3c72', '#2980b9', '#6dd5fa'],
								gridColor: '#ff6b6b',
								gridOpacity: 0.15,
							},
						});
					}
				} else {
					// Ensure default values are set
					setDashboardColors({
						background: {
							gradient: ['#1e3c72', '#2980b9', '#6dd5fa'],
							gridColor: '#ff6b6b',
							gridOpacity: 0.15,
						},
					});
				}
			} catch (error) {
				console.error('Error loading initial dashboard color settings:', error);
				// Ensure default values are set on error
				setDashboardColors({
					background: {
						gradient: ['#1e3c72', '#2980b9', '#6dd5fa'],
						gridColor: '#ff6b6b',
						gridOpacity: 0.15,
					},
				});
			} finally {
				setTimeout(() => {
					setIsLoading(false);
				}, 1500);
			}
		};
		loadDashboardColorSettings();
	}, []);

	// Load background colors
	useEffect(() => {
		const loadBackgroundColorSettings = async () => {
			try {
				const existing = await getSettingByType('TABLE_ANALYSIS_BACKGROUND_COLORS');

				if (existing && existing.setting && typeof existing.setting === 'object') {
					const { color, bg_color } = existing.setting;
					if (color && bg_color) {
						setBackgroundColors({ color, bg_color });
					} else {
						// Ensure default values are set
						setBackgroundColors({ color: '#e2e2e2', bg_color: '#d4d4d4' });
					}
				} else {
					// Ensure default values are set
					setBackgroundColors({ color: '#e2e2e2', bg_color: '#d4d4d4' });
				}
			} catch (error) {
				console.error('Error loading initial background color settings:', error);
				// Ensure default values are set on error
				setBackgroundColors({ color: '#e2e2e2', bg_color: '#d4d4d4' });
			}
		};

		loadBackgroundColorSettings();
	}, []);

	// Load color settings for tags
	useEffect(() => {
		const loadColorSettings = async () => {
			try {
				const existing = await getSettingByType('SettingColor');

				if (existing && existing.setting && Array.isArray(existing.setting)) {
					const isValidColorArray = existing.setting.every(item =>
						item && typeof item === 'object' &&
						typeof item.id === 'number' &&
						typeof item.color === 'string',
					);

					if (isValidColorArray) {
						setSelectedColors(existing.setting);
					}

				}
			} catch (error) {
				console.error('Error loading initial color settings:', error);
			}
		};

		loadColorSettings();
	}, []);

	useEffect(() => {
		const loadDefaultPrompt = async () => {
			try {
				let settingData = await getSettingByType(SETTING_TYPE.PROMPT_DASHBOARD);
				let data = DEFAULT_PROMPT_DASHBOARD;
				if (!settingData || !settingData.setting) {
					try {
						const master = await getTypeSchema('master', SETTING_TYPE.PROMPT_DASHBOARD);
						if (master && master.setting) {
							data = master.setting;
						}
					} catch (_) {}
					settingData = await createSetting({
						type: SETTING_TYPE.PROMPT_DASHBOARD, setting: data,
					});
				} else {
					data = settingData.setting;
				}
				setDefaultPrompt(data);
				setPromptSettingData(settingData); // Lưu trữ toàn bộ setting data để có id
			} catch (error) {
				console.error('Error loading default prompt setting:', error);
				try {
					const master = await getTypeSchema('master', SETTING_TYPE.PROMPT_DASHBOARD);
					if (master && master.setting) {
						setDefaultPrompt(master.setting);
						return;
					}
				} catch (_) {}
				setDefaultPrompt(DEFAULT_PROMPT_DASHBOARD);
			}
		};

		loadDefaultPrompt();
	}, []);


	// Load data on component mount
	useEffect(() => {
		loadDashboardItems();
		loadApprovedVersions();
		loadUserClasses();
		loadCurrentUserClasses();
		loadTags();
		loadTemplateTables();
	}, []);

	// Auto-load chart data when dashboard items are loaded
	useEffect(() => {
		if (dashboardItems.length > 0) {
			dashboardItems.forEach(item => {
				if (item.type === 'table2' && item.idData && !tableData[item.id]) {
					// Only load if we don't already have data for this item
					// Add a small delay to avoid race conditions
					setTimeout(() => {
						loadTableData(item);
					}, 200);
				}
			});
		}
	}, [dashboardItems, tableData]);

	// Scroll to specific item when scrollToItemId changes
	useEffect(() => {
		if (!scrollToItemId || dashboardItems.length === 0) return;

		// Find the item in dashboardItems
		const targetItem = dashboardItems.find(item => item.id === scrollToItemId);
		if (!targetItem) return;

		// Use requestAnimationFrame for better performance
		const scrollToItem = () => {
			// Try to scroll to the grid element
			const gridElement = gridRefs.current[scrollToItemId];
			if (gridElement && gridElement.eGridDiv) {
				// Scroll to the grid
				if (gridElement.api) {
					gridElement.api.ensureIndexVisible(0);
				}
				// Also scroll the page to the grid
				gridElement.eGridDiv.scrollIntoView({
					behavior: 'smooth',
					block: 'start',
				});
			} else {
				// Alternative approach: find the card element by data attribute or ID
				const cardElement = document.querySelector(`[data-item-id="${scrollToItemId}"]`) ||
					document.getElementById(`dashboard-item-${scrollToItemId}`);
				if (cardElement) {
					cardElement.style.scrollMarginTop = '140px';
					cardElement.scrollIntoView({
						behavior: 'smooth',
						block: 'start',
					});
				}
			}
		};

		// Use requestAnimationFrame for better performance
		requestAnimationFrame(() => {
			setTimeout(scrollToItem, 300); // Reduced timeout
		});
	}, [scrollToItemId, dashboardItems]);

	const loadDashboardItems = async () => {
		try {
			const items = await getAllDashBoardItems();

			if (items && items.length > 0) {
				// Đảm bảo mỗi item có tag và category, sử dụng tag hoặc category hoặc mặc định
				const processedItems = items.map(item => ({
					...item,
					tag: item.tag || item.category || '',
					category: item.category || item.tag || '',
				}));

				// Log table items specifically
				const tableItems = processedItems.filter(item => item.type === 'table2');
				setDashboardItems(tableItems);
			} else {
			}
		} catch (error) {
			console.error('Error loading dashboard items:', error);
			message.error('Lỗi khi tải danh sách dashboard items');
		}
	};
	// Đảm bảo loadApprovedVersions trả về Promise
	const loadApprovedVersions = async () => {
		try {
			const approvedVersions = await getAllApprovedVersion();
			// Lọc approveVersion có apps bao gồm 'analysis-review'
			const filteredApprovedVersions = approvedVersions.filter(version => version.apps && version.apps.includes('analysis-review'));

			setApprovedVersions(filteredApprovedVersions);

			// Preload cache cho tất cả approved versions với pageSize = 500000
			try {
				const { templateRowCacheService } = await import('../../../../utils/templateRowUtils.js');
				const requests = filteredApprovedVersions.map(version => ({
					idTemplate: version.id_template,
					idVersion: version.id_version,
					page: 1,
					pageSize: 5000, // Mặc định luôn là 500000
				}));
				await templateRowCacheService.getMultipleTemplateRows(requests, false); // forceRefresh = false
				console.log('TemplateRow cache preloaded successfully for', filteredApprovedVersions.length, 'versions');
			} catch (preloadError) {
				console.warn('TemplateRow cache preload failed:', preloadError);
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
		setShowPromptSettingsModal(true);
	};

	const handleSavePromptSettings = async () => {
		try {
			if (!promptSettingData || !promptSettingData.id) {
				message.error('Không tìm thấy dữ liệu cài đặt để cập nhật!');
				return;
			}

			await updateSetting({
				id: promptSettingData.id, // Thêm id để API có thể tìm thấy setting để update
				type: SETTING_TYPE.PROMPT_DASHBOARD, setting: promptSettingValue,
			});
			setDefaultPrompt(promptSettingValue);
			setShowPromptSettingsModal(false);
			message.success('Cài đặt prompt mặc định đã được lưu thành công!');
		} catch (error) {
			console.error('Error saving prompt settings:', error);
			message.error('Có lỗi xảy ra khi lưu cài đặt prompt!');
		}
	};

	const handleCancelPromptSettings = () => {
		setShowPromptSettingsModal(false);
		setPromptSettingValue('');
	};

	// Handle background colors modal
	const handleOpenBackgroundModal = async () => {
		try {
			const existing = await getSettingByType('TABLE_ANALYSIS_BACKGROUND_COLORS');
			if (existing && existing.setting && typeof existing.setting === 'object') {
				const { background } = existing.setting;
				if (background && background.gradient && background.gridColor !== undefined && background.gridOpacity !== undefined) {
					setDashboardColors({ background });
				} else {
					console.log('Invalid dashboard colors structure, using current state');
				}
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
			const existing = await getSettingByType('TABLE_ANALYSIS_BACKGROUND_COLORS');

			if (existing && existing.id) {
				const updatedSetting = { ...existing, setting: dashboardColors };
				await updateSetting(updatedSetting);
			} else {
				const newSetting = { type: 'TABLE_ANALYSIS_BACKGROUND_COLORS', setting: dashboardColors };
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
	const canAccessDashboardItem = useCallback((item) => {
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
	}, [currentUser, currentUserClasses]);

	// Filter metrics based on search query and selected tags
	const filteredMetrics = useMemo(() => {
		return dashboardItems
			.filter(item => canAccessDashboardItem(item))
			.filter(item => {
				const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

				// Check if item matches business tags
				const matchesBusinessTags = selectedBusinessTags.includes('All') || selectedBusinessTags.includes(item.category);

				// Check if item matches store tags
				const matchesStoreTags = selectedStoreTags.includes('All') || selectedStoreTags.includes(item.storeCategory);

				// Item should match BOTH business tags AND store tags (AND logic)
				const matchesTags = matchesBusinessTags && matchesStoreTags;

				return matchesSearch && matchesTags;
			})
			.sort((a, b) => a.order - b.order);
	}, [dashboardItems, searchQuery, selectedBusinessTags, selectedStoreTags, currentUserClasses, tableData]);

	console.log('filteredMetrics', filteredMetrics);

	const moveMetric = (metricId, direction) => {
		const currentIndex = dashboardItems.findIndex(m => m.id === metricId);
		if (currentIndex === -1) return;

		const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
		if (newIndex < 0 || newIndex >= dashboardItems.length) return;

		const newItems = [...dashboardItems];
		[newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];
		setDashboardItems(newItems);
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

	const handleViewDetails = async (metric) => {
		setSelectedMetricForDetails(metric);

		// Load data based on metric type before showing details modal
		try {
			if (metric.type === 'table2' || metric.type === 'table') {
				await loadTableData(metric);
			} else if (metric.type === 'chart') {
				await loadChartData(metric);
			} else if (metric.type === 'top') {
				await loadTopData(metric);
			} else if (metric.type === 'table_chart') {
				await loadTableChartData(metric);
			} else if (metric.type === 'table_chart_2') {
				await loadTableChart2Data(metric);
			}
		} catch (error) {
			console.error('Error loading data for metric:', error);
		}

		// Show the details modal after loading data
		setShowDetailsModal(true);
	};

	const closeDetailsModal = () => {
		setShowDetailsModal(false);
		setSelectedMetricForDetails(null);
		// Reset loading state when closing modal
		setLoading(false);
	};

	const handleCreateNewCard = async (inputData = null) => {
		// Use inputData if provided, otherwise fallback to newCard state
		const cardData = inputData || newCard;

		if (cardData.title.trim()) {
			try {
				let newItem = {
					name: cardData.title,
					type: 'table2',
					category: cardData.tag,
					storeCategory: cardData.storeTag,
					userClasses: [], // Mặc định không có userClasses restriction
					settings: {},
					analysis: {
						prompt: cardData.prompt, answer: cardData.answer,
					},
				};

				if (newItem.type === 'table2') {
					if (!cardData.idData) {
						message.warning('Vui lòng chọn dữ liệu cho loại Table');
						return;
					}
					if (!newTableDisplayColumns || newTableDisplayColumns.length === 0) {
						message.warning('Vui lòng chọn ít nhất một cột để hiển thị');
						return;
					}

					// Fetch data for the new table
					const selectedVersion = approvedVersions.find(version => version.id == cardData.idData);
					if (!selectedVersion) {
						message.error('Không tìm thấy phiên bản đã chọn');
						return;
					}

					const templateTable = await getTableByid(selectedVersion.id_template);
					if (!templateTable) {
						message.error('Không tìm thấy template table');
						return;
					}

					let tableData = [];
					if (templateTable.isCombine) {
						tableData = await loadAndMergeData(templateTable);
					} else {
						const versionId = selectedVersion.id_version;
						const targetStep = templateTable.steps?.find(step => step.id === versionId);
						if (targetStep && targetStep.data) {
							tableData = targetStep.data;
						} else {
							const lastStep = templateTable.steps?.[templateTable.steps.length - 1];
							if (lastStep && lastStep.data) {
								tableData = lastStep.data;
							} else {
								// Try to get data using getTemplateRow with cache
								try {
									const versionIdForCache = versionId == 1 ? null : versionId;
									const response = await getTemplateRowWithCache(
										selectedVersion.id_template,
										versionIdForCache,
										false,
										1,
										null,
										// Sử dụng TTL mặc định từ service
									);
									if (response && response.rows && Object.keys(response.rows).length > 0) {
										tableData = Object.values(response.rows).map((row) => row.data);
									}
								} catch (cacheError) {
									console.error('Error getting template row with cache:', cacheError);
									// Fallback to original getTemplateRow nếu cache fail
									try {
										const { rows } = await getTemplateRow(selectedVersion.id_template, versionId == 1 ? null : versionId);
										if (rows && Object.keys(rows).length > 0) {
											tableData = Object.values(rows).map((row) => row.data);
										}
									} catch (fallbackError) {
										console.error('Fallback getTemplateRow also failed:', fallbackError);
									}
								}
							}
						}
					}

					newItem.idData = newCard.idData;
					newItem.settings = {
						dateColumn: newTableDateColumn,
						dateRange: newTableDateRange,
						dateColumnSize: newTableDateColumnSize,
						timeThreshold: newTableTimeThreshold,
						displayColumns: newTableDisplayColumns,
						columnSettings: newTableColumnSettings,
						columnSizes: newTableColumnSizes,
						filterColumn: newTableFilterColumn,
						sortColumn: newTableSortColumn,
						sortType: newTableSortType,
						templateColumns: newTemplateColumns,
					};
				}
				console.log('newItem', newItem);
				await createDashBoardItem(newItem);
				await loadDashboardItems();

				setNewCard({
					title: '',
					type: 'table2',
					tag: '',
					storeTag: '',
					idData: null,
					selectedKpiCalculators: [],
					prompt: '',
					answer: '',
				});
				setSelectedApprovedVersion(null);
				setTemplateColumns([]);
				setSelectedColumns({ column1: '', column2: '' });
				setTopN(5);
				setNewTableDisplayColumns([]);
				setNewTableDateColumn(null);
				setNewTableDateRange('all');
				setNewTableTimeThreshold(null);
				setNewTableFilterColumn(null);
				setNewTableSortColumn(null);
				setNewTableSortType('desc');
				setNewTableColumnSettings({});
				setNewTableColumnSizes({});
				setNewTemplateColumns([]);
				setShowNewCardModal(false);
				message.success('Thẻ mới đã được tạo');

				// Gọi callback để thông báo cho component cha
				if (onItemCreated) {
					onItemCreated();
				}
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
		});
		setShowNewCardModal(false);
		setSelectedApprovedVersion(null);
		setTemplateColumns([]);
		setSelectedColumns({ column1: '', column2: '' });
		setNewTableDisplayColumns([]);
		setNewTableDateColumn(null);
		setNewTableDateColumnSize(2);
		setNewTableColumnSettings({});
		setNewTemplateColumns([]);

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
	const handleNewTableDisplayColumnsChange = useCallback((values) => {
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
	}, [newTableColumnSettings, newCollapsedColumns, newTemplateColumns]);

	const handleOpenEditModal = async (item) => {

		// Đảm bảo item có đầy đủ thông tin cần thiết
		const itemToEdit = {
			...item, tag: item.tag || item.category || '', // Đảm bảo có tag mặc định
			category: item.category || item.tag || '', // Đảm bảo có category mặc định
			storeTag: item.storeCategory || item.storeTag || '', // Đảm bảo có storeTag mặc định
			analysis: item.analysis || { prompt: '', answer: '' }, // Đảm bảo có analysis field
		};
		setEditingDashboardItem(itemToEdit);
		if (item.type === 'table2') {
			setEditSelectedApprovedVersion(item.idData);
			setEditTableDisplayColumns(item.settings?.displayColumns || []);
			setEditTableDateColumn(item.settings?.dateColumn || null);
			setEditTableDateRange(item.settings?.dateRange || 'all');
			setEditTableDateColumnSize(item.settings?.dateColumnSize || 2);
			setEditTableTimeThreshold(item.settings?.timeThreshold || null);
			setEditTableColumnSettings(item.settings?.columnSettings || {});
			setEditTableColumnSizes(item.settings?.columnSizes || {});
			setEditTableFilterColumn(item.settings?.filterColumn || null);
			setEditTableSortColumn(item.settings?.sortColumn || null);
			setEditTableSortType(item.settings?.sortType || 'desc');
			setEditTemplateColumns(item.settings?.templateColumns || []);

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

			if (editingDashboardItem.type === 'table2') {

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
					timeThreshold: editTableTimeThreshold,
					displayColumns: editTableDisplayColumns,
					columnSettings: editTableColumnSettings,
					columnSizes: editTableColumnSizes,
					filterColumn: editTableFilterColumn,
					sortColumn: editTableSortColumn,
					sortType: editTableSortType,
					templateColumns: editTemplateColumns,
				};
			}
			await updateDashBoardItem(updatedItem);
			message.success('Đã cập nhật thành công');
			setSettingModalVisible(false);
			setEditingDashboardItem(null);

			setEditSelectedApprovedVersion(null);
			setEditTemplateColumns([]);
			setEditSelectedColumns({ column1: '', column2: '' });
			setEditTableDisplayColumns([]);
			setEditTableDateColumn(null);
			setEditTableDateRange('all');
			setEditTableTimeThreshold(null);
			setEditTableFilterColumn(null);
			setEditTableSortColumn(null);
			setEditTableSortType('desc');
			await loadDashboardItems();
		} catch (error) {
			console.error('Error updating dashboard item:', error);
			message.error('Lỗi khi cập nhật');
		}
	};

	const handleCancelEdit = () => {
		setSettingModalVisible(false);
		setEditingDashboardItem(null);
		setEditSelectedApprovedVersion(null);
		setEditTemplateColumns([]);
		setEditSelectedColumns({ column1: '', column2: '' });
		setEditTableDisplayColumns([]);
		setEditTableDateColumn(null);
		setEditTableDateColumnSize(2);
		setEditTableFilterColumn(null);
		setEditTableSortColumn(null);
		setEditTableSortType('desc');
		setEditTableColumnSettings({});
		setEditTableColumnSizes({});
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

	const toggleNewColumnCollapse = useCallback((columnId) => {
		setNewCollapsedColumns(prev => ({
			...prev, [columnId]: !prev[columnId],
		}));
	}, []);

	// Stable callback functions for CreateTableModal
	const handleDateColumnChange = useCallback((value) => setNewTableDateColumn(value), []);
	const handleDateRangeChange = useCallback((value) => setNewTableDateRange(value), []);
	const handleDateColumnSizeChange = useCallback((value) => setNewTableDateColumnSize(value), []);
	const handleTimeThresholdChange = useCallback((value) => setNewTableTimeThreshold(value), []);
	const handleFilterColumnChange = useCallback((value) => setNewTableFilterColumn(value), []);
	const handleSortColumnChange = useCallback((value) => setNewTableSortColumn(value), []);
	const handleSortTypeChange = useCallback((value) => setNewTableSortType(value), []);

	const handleColumnSettingChange = useCallback((columnId, field, value) => {
		setNewTableColumnSettings(prev => {
			const newSettings = { ...prev };
			newSettings[columnId] = {
				...newSettings[columnId], [field]: value,
			};
			return newSettings;
		});
	}, []);

	const handleColumnSizeChange = useCallback((columnId, value) => {
		setNewTableColumnSizes(prev => ({
			...prev, [columnId]: value,
		}));
	}, []);

	const handleColumnValueFormatChange = useCallback((columnId, field, value) => {
		setNewTableColumnSettings(prev => {
			const newSettings = { ...prev };
			newSettings[columnId] = {
				...newSettings[columnId], valueFormat: {
					...newSettings[columnId].valueFormat, [field]: value,
				},
			};
			return newSettings;
		});
	}, []);

	// Stable callback for setNewCard
	const handleNewCardChange = useCallback((updates) => {
		setNewCard(prev => ({ ...prev, ...updates }));
	}, []);

	const openAnalysisDetailModal = (item) => {
		setAnalysisDetailModal({
			visible: true, item: item, analysis: item.analysis,
		});
	};

	const closeAnalysisDetailModal = () => {
		setAnalysisDetailModal({
			visible: false, item: null, analysis: null,
		});
	};

	// Handle main "Phân tích" button click: if already has answer, open detail view; otherwise, open config modal
	const handleAnalyzeButtonClick = (item) => {
		if (item?.analysis?.answer) {
			openAnalysisDetailModal(item);
		} else {
			handleOpenDataSplitModal(item);
		}
	};

	const handleReanalyzeInModal = async () => {
		if (!analysisDetailModal.item) return;
		try {
			// Đóng modal chi tiết phân tích
			setAnalysisDetailModal(prev => ({ ...prev, visible: false }));
			// Mở modal cấu hình tách dữ liệu để người dùng cấu hình lại rồi chạy
			handleOpenDataSplitModal(analysisDetailModal.item);
		} catch (error) {
			console.error('Lỗi khi mở lại cấu hình phân tích:', error);
		}
	};

	// Handle edit analysis
	const handleEditAnalysis = (item) => {
		setEditingAnalysisId(item.id);
		setEditingAnalysisContent(item.analysis?.answer || '');
	};

	// Handle save edited analysis
	const handleSaveAnalysis = async (itemId) => {
		try {
			const item = dashboardItems.find(d => d.id === itemId);
			if (!item) return;

			const updatedItem = {
				...item,
				analysis: {
					...item.analysis,
					answer: editingAnalysisContent,
				},
			};

			await updateDashBoardItem(updatedItem);
			setDashboardItems(prev => prev.map(d => d.id === itemId ? updatedItem : d));

			setEditingAnalysisId(null);
			setEditingAnalysisContent('');
			message.success('Đã lưu phân tích thành công!');
		} catch (error) {
			console.error('Error saving analysis:', error);
			message.error('Có lỗi xảy ra khi lưu phân tích');
		}
	};

	// Handle cancel edit analysis
	const handleCancelEditAnalysis = () => {
		setEditingAnalysisId(null);
		setEditingAnalysisContent('');
	};

	// Function to open data split modal
	const handleOpenDataSplitModal = (item) => {
		setSelectedItemForSplit(item);
		setShowDataSplitModal(true);
	};

	// Function to handle data splitting and analysis
	const handleSplitDataAndAnalyze = async (splitSettings) => {
		if (!selectedItemForSplit) return;

		try {

			// Validate split settings
			if (splitSettings.keepColumns.length === 0) {
				message.error('Vui lòng chọn ít nhất một cột trong "Cột giữ nguyên (không tách)"');
				return;
			}

			if (splitSettings.splitColumns.length === 0) {
				message.error('Vui lòng chọn ít nhất một cột trong "Cột được tách"');
				return;
			}

			// Save settings to dashboard item analysis
			const updatedItem = {
				...selectedItemForSplit,
				analysis: {
					...selectedItemForSplit.analysis,
					prompt: splitSettings.prompt,
					splitSettings: {
						keepColumns: splitSettings.keepColumns,
						splitColumns: splitSettings.splitColumns,
						filterSettings: splitSettings.filterSettings,
						selectedModel: splitSettings.selectedModel,
					},
				},
			};

			// Update the dashboard item in database
			await updateDashBoardItem(updatedItem);

			// Get the data for the selected item
			const chartData = tableData[selectedItemForSplit.id] || [];

			if (!chartData || chartData.length === 0) {
				message.error('Không có dữ liệu để phân tích');
				return;
			}

			// Split data based on settings
			const splitData = splitDataIntoChunks(chartData, splitSettings);

			// Close modal
			setShowDataSplitModal(false);
			setSelectedItemForSplit(null);

			// Call the original analysis function with split data
			await handleAnalyzeWithAI(updatedItem, splitData);

		} catch (error) {
			console.error('Error splitting data:', error);
			message.error('Lỗi khi tách dữ liệu');
		}
	};

	// Function to split data into column-based datasets
	const splitDataIntoChunks = (data, settings) => {
		const { keepColumns, splitColumns, filterSettings } = settings;

		if (!data || data.length === 0) {
			return null;
		}

		// Apply filter if enabled
		let filteredData = data;
		if (filterSettings.enabled && filterSettings.conditions && filterSettings.conditions.length > 0) {
			filteredData = data.filter(row => {
				// Check if all conditions are met
				return filterSettings.conditions.every((condition, index) => {
					if (!condition.column || condition.value === '') return true;

					const cellValue = row[condition.column];

					// Handle null/empty cases
					switch (condition.condition) {
						case 'is_null_or_empty':
							return cellValue === null || cellValue === undefined || cellValue === '';
						case 'is_not_null_or_empty':
							return cellValue !== null && cellValue !== undefined && cellValue !== '';
						default:
							// For other conditions, check if value is not null/empty first
							if (cellValue === null || cellValue === undefined || cellValue === '') {
								return false;
							}
					}

					const cellValueStr = String(cellValue).toLowerCase();
					const filterValueStr = String(condition.value).toLowerCase();

					switch (condition.condition) {
						case 'equals':
							return cellValueStr === filterValueStr;
						case 'not_equals':
							return cellValueStr !== filterValueStr;
						case 'contains':
							return cellValueStr.includes(filterValueStr);
						case 'not_contains':
							return !cellValueStr.includes(filterValueStr);
						case 'starts_with':
							return cellValueStr.startsWith(filterValueStr);
						case 'ends_with':
							return cellValueStr.endsWith(filterValueStr);
						case 'greater_than':
							return !isNaN(cellValue) && !isNaN(condition.value) && Number(cellValue) > Number(condition.value);
						case 'greater_than_or_equal':
							return !isNaN(cellValue) && !isNaN(condition.value) && Number(cellValue) >= Number(condition.value);
						case 'less_than':
							return !isNaN(cellValue) && !isNaN(condition.value) && Number(cellValue) < Number(condition.value);
						case 'less_than_or_equal':
							return !isNaN(cellValue) && !isNaN(condition.value) && Number(cellValue) <= Number(condition.value);
						default:
							return true;
					}
				});
			});
		}

		// Tạo các dataset riêng biệt, mỗi dataset chứa keepColumns + 1 splitColumn
		const datasets = splitColumns.map((splitColumn, index) => {
			// Lấy tất cả các cột cần thiết cho dataset này
			const columnsForDataset = [...keepColumns, splitColumn];

			// Lọc dữ liệu chỉ giữ lại các cột cần thiết
			const datasetData = filteredData.map(row => {
				const filteredRow = {};
				columnsForDataset.forEach(colId => {
					if (row.hasOwnProperty(colId)) {
						filteredRow[colId] = row[colId];
					}
				});
				return filteredRow;
			});

			return {
				datasetId: index + 1,
				columns: columnsForDataset,
				data: datasetData,
				rowCount: datasetData.length,
				splitColumn: splitColumn,
			};
		});

		return {
			keepColumns,
			splitColumns,
			filterSettings,
			datasets,
			totalRows: filteredData.length,
			originalTotalRows: data.length,
			datasetCount: datasets.length,
			selectedModel: settings.selectedModel,
			prompt: settings.prompt,
		};
	};

	const handleAnalyzeWithAI = async (item, splitData = null) => {
		try {
			// Kiểm tra quyền truy cập và chỉnh sửa
			if (!canAccessDashboardItem(item)) {
				message.error('Bạn không có quyền phân tích item này');
				return;
			}

			// Kiểm tra xem item đã có answer chưa (cho phép phân tích lại)
			const isReanalyzing = item.analysis?.answer;

			// Bắt đầu phân tích
			setAnalyzingItems(prev => new Set(prev).add(item.id));

			// Lấy dữ liệu chart
			let chartData = null;
			let rawData = null;
			if (item.type === 'table2') {
				// Lấy dữ liệu từ tableData hoặc rawApprovedVersionData
				chartData = tableData[item.id];
				rawData = rawApprovedVersionData[item.id];
			} else
				// Kiểm tra dữ liệu
			if (!chartData || chartData.length === 0) {
				message.info('Đang tải dữ liệu để phân tích...');

				// Thử tải dữ liệu nếu chưa có
				try {
					if (item.type === 'table2') {
						await loadTableData(item, true);
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
			const contextInstruction = await loadContextInstruction();
			const contextPrefix = contextInstruction ? `Context Instruction: ${contextInstruction}\n\n` : '';
			const basePrompt = contextPrefix + (splitData?.prompt || item.analysis?.prompt || defaultPrompt || DEFAULT_PROMPT_DASHBOARD || 'Phân tích dữ liệu này và đưa ra nhận xét chi tiết về xu hướng, mẫu và insights quan trọng.');

			// Tạo mô tả dữ liệu
			let dataDescription = '';
			let systemMessage = '';

			if (item.type === 'table2') {
				// Cho table type - chỉ phân tích các cột được cấu hình hiển thị
				const displayColumns = item.settings?.displayColumns || [];
				const dateColumn = item.settings?.dateColumn;
				const templateColumns = item.settings?.templateColumns || [];
				const timeThreshold = item.settings?.timeThreshold;

				// Lọc dữ liệu chỉ bao gồm các cột được hiển thị và từ mốc thời gian
				let filteredData = chartData;
				if (chartData && chartData.length > 0 && displayColumns.length > 0) {
					// Lọc dữ liệu từ mốc thời gian nếu có
					let timeFilteredData = chartData;
					if (timeThreshold && dateColumn) {
						timeFilteredData = chartData.filter(row => {
							const rowDate = new Date(row[dateColumn]);
							const thresholdDate = new Date(timeThreshold);
							return rowDate >= thresholdDate;
						});
					}

					// Xác định tất cả các cột cần có trong kết quả cuối cùng
					const allRequiredColumns = [...displayColumns];
					if (dateColumn && !allRequiredColumns.includes(dateColumn)) {
						allRequiredColumns.unshift(dateColumn);
					}

					// Chuẩn hóa dữ liệu để đảm bảo mọi bản ghi đều có đầy đủ các trường
					// và lọc bỏ những bản ghi có nhiều hơn 3 trường rỗng
					filteredData = timeFilteredData.map(row => {
						const standardizedRow = {};
						allRequiredColumns.forEach(columnId => {
							standardizedRow[columnId] = row.hasOwnProperty(columnId) ? row[columnId] : '';
						});
						return standardizedRow;
					}).filter(row => {
						const emptyFieldCount = Object.values(row).filter(value => value === '' || value === null || value === undefined).length;
						return emptyFieldCount <= 3;
					});
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

				// Nếu có dữ liệu đã tách, sử dụng dữ liệu đó
				if (splitData && splitData.datasets && splitData.datasets.length > 1) {
					// Thông tin về bộ lọc nếu có
					dataDescription = `
Dữ liệu bảng đã được tách thành ${splitData.datasetCount} dataset riêng biệt:
${timeThreshold ? `- Mốc thời gian phân tích: Từ ${new Date(timeThreshold).toLocaleDateString('vi-VN')} trở đi` : ''}
- Tổng số dòng: ${splitData.totalRows}
- Các dataset đã tách: ${JSON.stringify(splitData.datasets.map(dataset => ({
						datasetId: dataset.datasetId,
						data: dataset.data,
					})), null, 2)}
`;

					systemMessage = `Bạn là một chuyên gia phân tích dữ liệu. Dữ liệu đã được tách thành ${splitData.datasetCount} dataset riêng biệt để phân tích hiệu quả hơn. 
					Mỗi dataset chứa các cột giữ nguyên + 1 cột được tách. Hãy phân tích từng dataset và đưa ra nhận xét chi tiết bằng tiếng Việt. 
					Hãy tập trung vào:
					- Cấu trúc và đặc điểm của dữ liệu trong từng dataset
					- So sánh giữa các dataset khác nhau
					- Mẫu và xu hướng trong từng dataset và tổng thể
					- Insights quan trọng từ việc phân tích từng dataset
					- Khuyến nghị dựa trên phân tích chi tiết
					- Hãy đưa ra phân tích ngay, không cần chào hỏi.`;
				} else {
					// Sử dụng dữ liệu gốc nếu không có tách
					dataDescription = `
Dữ liệu bảng (chỉ các cột được cấu hình hiển thị):
- Các cột được phân tích: ${columnNames.join(', ')}
${timeThreshold ? `- Mốc thời gian phân tích: Từ ${new Date(timeThreshold).toLocaleDateString('vi-VN')} trở đi` : ''}
- Dữ liệu: ${filteredData && filteredData.length > 0 ? JSON.stringify(filteredData, null, 2) : 'Không có dữ liệu'}
`;

					systemMessage = `Bạn là một chuyên gia phân tích dữ liệu. Hãy phân tích dữ liệu bảng được cung cấp và đưa ra nhận xét chi tiết bằng tiếng Việt. 
					Hãy tập trung vào:
					- Cấu trúc và đặc điểm của dữ liệu trong các cột được hiển thị
					- Mẫu và xu hướng trong dữ liệu
					- Insights quan trọng từ dữ liệu
					- Khuyến nghị dựa trên phân tích
					- Hãy đưa ra phân tích ngay, không cần chào hỏi.`;
				}
			}
			const fullPrompt = `${basePrompt}\n\n${dataDescription + item?.info?.note}`;

			// Get the selected model from splitData, item analysis, or use default
			const selectedModel = splitData?.selectedModel || item.analysis?.splitSettings?.selectedModel || 'gpt-5-mini-2025-08-07';

			const response = await Promise.race([aiGen2(fullPrompt, systemMessage, selectedModel, 'text'), new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: Phân tích mất quá nhiều thời gian')), 6000000))]);
			console.log(response);
			if (response && (response.generated || response.result || response.data || response.content)) {
				// Lấy kết quả từ response (hỗ trợ nhiều format khác nhau)
				const aiResult = response.generated || response.result || response.data || response.content || 'Không thể phân tích dữ liệu.';
				// Cập nhật item với kết quả phân tích
				const updatedItem = {
					...item, analysis: {
						...item.analysis, answer: aiResult, prompt: basePrompt,
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
	const handleAnalyzeWithAIWitdPD = async (item) => {
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

			// Kiểm tra xem item đã có answer chưa (cho phép phân tích lại)
			const isReanalyzing = item.analysis?.answer;

			// Bắt đầu phân tích
			setAnalyzingItems(prev => new Set(prev).add(item.id));

			// Lấy dữ liệu chart
			let chartData = null;
			let rawData = null;
			if (item.type === 'table2') {
				// Lấy dữ liệu từ tableData hoặc rawApprovedVersionData
				chartData = tableData[item.id];
				rawData = rawApprovedVersionData[item.id];
			} else
				// Kiểm tra dữ liệu
			if (!chartData || chartData.length === 0) {
				message.info('Đang tải dữ liệu để phân tích...');

				// Thử tải dữ liệu nếu chưa có
				try {
					if (item.type === 'table2') {
						await loadTableData(item, true);
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
					message.warning('Không có dữ liệu để phân tích. Vui lòng kiểm tra cấu trúc và tải dữ liệu trước.');
					setAnalyzingItems(prev => {
						const newSet = new Set(prev);
						newSet.delete(item.id);
						return newSet;
					});
					return;
				}
			}

			// Tạo prompt cho AI với dữ liệu thực tế
			const contextInstruction = await loadContextInstruction();
			const contextPrefix = contextInstruction ? `Context Instruction: ${contextInstruction}\n\n` : '';
			const basePrompt = contextPrefix + (item.analysis?.prompt || defaultPrompt || DEFAULT_PROMPT_DASHBOARD || 'Phân tích dữ liệu này và đưa ra nhận xét chi tiết về xu hướng, mẫu và insights quan trọng.');

			// Tạo mô tả dữ liệu
			let dataDescription = '';
			let systemMessage = '';
			let filteredData = chartData;
			if (item.type === 'table2') {
				// Cho table type - chỉ phân tích các cột được cấu hình hiển thị
				const displayColumns = item.settings?.displayColumns || [];
				const dateColumn = item.settings?.dateColumn;
				const templateColumns = item.settings?.templateColumns || [];
				const timeThreshold = item.settings?.timeThreshold;

				// Lọc dữ liệu chỉ bao gồm các cột được hiển thị và từ mốc thời gian

				if (chartData && chartData.length > 0 && displayColumns.length > 0) {
					// Lọc dữ liệu từ mốc thời gian nếu có
					let timeFilteredData = chartData;
					if (timeThreshold && dateColumn) {
						timeFilteredData = chartData.filter(row => {
							const rowDate = new Date(row[dateColumn]);
							const thresholdDate = new Date(timeThreshold);
							return rowDate >= thresholdDate;
						});
					}

					// Xác định tất cả các cột cần có trong kết quả cuối cùng
					const allRequiredColumns = [...displayColumns];
					if (dateColumn && !allRequiredColumns.includes(dateColumn)) {
						allRequiredColumns.unshift(dateColumn);
					}

					// Chuẩn hóa dữ liệu để đảm bảo mọi bản ghi đều có đầy đủ các trường
					filteredData = timeFilteredData.map(row => {
						const standardizedRow = {};
						allRequiredColumns.forEach(columnId => {
							standardizedRow[columnId] = row.hasOwnProperty(columnId) ? row[columnId] : '';
						});
						return standardizedRow;
					});
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
${timeThreshold ? `- Mốc thời gian phân tích: Từ ${new Date(timeThreshold).toLocaleDateString('vi-VN')} trở đi` : ''}
`;

				systemMessage = `Bạn là một chuyên gia phân tích dữ liệu. Hãy phân tích dữ liệu bảng được cung cấp và đưa ra nhận xét chi tiết bằng tiếng Việt. 
				Hãy tập trung vào:
				- Cấu trúc và đặc điểm của dữ liệu trong các cột được hiển thị
				- Mẫu và xu hướng trong dữ liệu
				- Insights quan trọng từ dữ liệu
				- Khuyến nghị dựa trên phân tích
				- Hãy đưa ra phân tích ngay, không cần chào hỏi.`;
			}
			const fullPrompt = `${basePrompt}\n\n${dataDescription + item?.info?.note}`;
			const response = await powerdrillAnalyzeData({
				data: [{ 'filteredData': filteredData }],
				prompt: fullPrompt,
				reportName: item.name,
				sessionName: item.id,
			});


			if (response && (response.data)) {
				// Lấy kết quả từ response (hỗ trợ nhiều format khác nhau)
				const aiResult = response.data?.analysisResult?.aiAnswer || 'Không thể phân tích dữ liệu.';
				// Cập nhật item với kết quả phân tích
				const updatedItem = {
					...item, analysis: {
						...item.analysis, answer: aiResult, prompt: basePrompt,
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

	// Load chart data for chart type metrics
	const loadChartData = async (dashboardItem) => {
		if (dashboardItem.type !== 'chart' || !dashboardItem.idData) return;

		try {
			setLoading(true);
			// For now, just load table data as chart data
			await loadTableData(dashboardItem);
		} catch (error) {
			console.error('Error loading chart data:', error);
		} finally {
			setLoading(false);
		}
	};

	// Load top data for top type metrics
	const loadTopData = async (dashboardItem) => {
		if (dashboardItem.type !== 'top' || !dashboardItem.idData) return;

		try {
			setLoading(true);
			// For now, just load table data as top data
			await loadTableData(dashboardItem);
		} catch (error) {
			console.error('Error loading top data:', error);
		} finally {
			setLoading(false);
		}
	};

	// Load table chart data for table_chart type metrics
	const loadTableChartData = async (dashboardItem) => {
		if (dashboardItem.type !== 'table_chart' || !dashboardItem.idData) return;

		try {
			setLoading(true);
			// For now, just load table data as table chart data
			await loadTableData(dashboardItem);
		} catch (error) {
			console.error('Error loading table chart data:', error);
		} finally {
			setLoading(false);
		}
	};

	// Load table chart 2 data for table_chart_2 type metrics
	const loadTableChart2Data = async (dashboardItem) => {
		if (dashboardItem.type !== 'table_chart_2' || !dashboardItem.idData) return;

		try {
			setLoading(true);
			// For now, just load table data as table chart 2 data
			await loadTableData(dashboardItem);
		} catch (error) {
			console.error('Error loading table chart 2 data:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadTableData = async (dashboardItem, retry = false) => {
		try {
			if (!dashboardItem.idData) {
				setTableErrorStates(prev => ({
					...prev,
					[dashboardItem.id]: 'Không tìm thấy idData cho item này',
				}));
				return;
			}
			let approvedVersions = await getAllApprovedVersion();
			// Get the approved version
			const selectedVersion = approvedVersions.find(version => version.id == dashboardItem.idData);
			if (!selectedVersion) {
				setTableErrorStates(prev => ({
					...prev,
					[dashboardItem.id]: 'Không tìm thấy phiên bản đã duyệt',
				}));
				return;
			}

			// Get template table
			const templateTable = await getTableByid(selectedVersion.id_template);
			if (!templateTable) {
				setTableErrorStates(prev => ({
					...prev,
					[dashboardItem.id]: 'Không tìm thấy template table',
				}));
				return;
			}

			let tableData = [];
			const versionId = selectedVersion.id_version;

			const targetStep = templateTable.steps?.find(step => step.id === versionId);

			if (targetStep && targetStep.data) {
				tableData = targetStep.data;
			} else {
				const lastStep = templateTable.steps?.[templateTable.steps.length - 1];
				if (lastStep && lastStep.data) {
					tableData = lastStep.data;
				} else {
					// Try to get data using getTemplateRow with cache
					try {
						const versionIdForCache = versionId == 1 ? null : versionId;
						const response = await getTemplateRowWithCache(
							selectedVersion.id_template,
							versionIdForCache,
							retry, // forceRefresh nếu retry
							1,
							null,
							// Sử dụng TTL mặc định từ service
						);
						if (response && response.rows && Object.keys(response.rows).length > 0) {
							tableData = Object.values(response.rows).map((row) => row.data);
						}
					} catch (cacheError) {
						console.error('Error getting template row with cache:', cacheError);
						// Fallback to original getTemplateRow nếu cache fail
						try {
							const rows = await getTemplateRow(selectedVersion.id_template, versionId == 1 ? null : versionId);
							if (rows && Object.keys(rows).length > 0) {
								tableData = Object.values(rows.rows).map((row) => row.data);
							}
						} catch (fallbackError) {
							console.error('Fallback getTemplateRow also failed:', fallbackError);
						}
					}
				}
			}

			// Check if we got valid data
			if (tableData && tableData.length > 0) {
				console.log(`Successfully loaded ${tableData.length} rows for item ${dashboardItem.id}`);

				// Update table data state
				setTableData(prev => ({
					...prev, [dashboardItem.id]: tableData,
				}));

				// Store raw data for detail view
				setRawApprovedVersionData(prev => ({
					...prev, [dashboardItem.id]: tableData,
				}));

				// Update dashboard item settings with fetched data
				const updatedItem = {
					...dashboardItem, settings: {
						...dashboardItem.settings, fetchedData: tableData,
					},
				};

				// Save the updated item to preserve fetched data
				// await updateDashBoardItem(updatedItem);
			} else {
				// No data found
				console.warn(`No data found for item ${dashboardItem.id}`);
				setTableErrorStates(prev => ({
					...prev,
					[dashboardItem.id]: 'Không có dữ liệu để hiển thị',
				}));
			}
		} catch (error) {
			console.error('Error loading table data:', error);
			setTableErrorStates(prev => ({
				...prev,
				[dashboardItem.id]: `Lỗi tải dữ liệu: ${error.message}`,
			}));
			if (!retry) {
				setTimeout(() => {
					loadTableData(dashboardItem, true);
				}, 2000);
			}
		} finally {
			// Clear loading state
			setTableLoadingStates(prev => ({
				...prev,
				[dashboardItem.id]: false,
			}));
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

		if (dashboardItem.type === 'table2') {
			// For table type, use column settings
			const columnSettings = dashboardItem.settings?.columnSettings || {};
			const displayColumns = dashboardItem.settings?.displayColumns || [];
			const dateColumn = dashboardItem.settings?.dateColumn;
			const templateColumns = dashboardItem.settings?.templateColumns || [];

			const columns = [];
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
	};

	const prepareTableData = (itemId) => {
		const data = tableData[itemId];
		if (!data || !data.length) return [];
		// Find the dashboard item to get KPI info
		const dashboardItem = dashboardItems.find(item => item.id === itemId);
		if (!dashboardItem) return [];
		if (dashboardItem.type === 'table2') {
			const processedData = data.map((item, index) => ({
				key: index.toString(), ...item,
			}));
			return processedData;
		}
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
					setTableItems(prev => prev.filter(i => i.id !== item.id));
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
				...prev, item: updatedItem, analysis: updatedItem.analysis,
			}));
		}
	};

	const renderMarkdown = (content) => {
		if (!content) return '';
		try {
			const htmlContent = marked(content);
			const sanitizedHtml = DOMPurify.sanitize(htmlContent);
			return sanitizedHtml;
		} catch (error) {
			console.error('Error rendering markdown:', error);
			return content; // Fallback to plain text
		}
	};

	// Function to get color for tags based on index
	const getTagColor = useCallback((tagIndex) => {
		if (!selectedColors || selectedColors.length === 0) {
			return '#13C2C2'; // Default color
		}
		return selectedColors[tagIndex % selectedColors.length]?.color || '#13C2C2';
	}, [selectedColors]);

	// Function to get color for tags based on tag name
	const getTagColorByName = useCallback((tagName, tagList) => {
		if (!selectedColors || selectedColors.length === 0) {
			return '#13C2C2'; // Default color
		}
		const index = tagList.indexOf(tagName);
		return index >= 0 ? selectedColors[index % selectedColors.length]?.color || '#13C2C2' : '#13C2C2';
	}, [selectedColors]);

	// Pivot mode management functions
	const togglePivotMode = useCallback((itemId) => {
		setPivotMode(prev => ({
			...prev,
			[itemId]: !prev[itemId],
		}));

		// Reset grid state when toggling pivot mode
		setTimeout(() => {
			const gridApi = gridRefs.current[itemId];
			if (gridApi && gridApi.api) {
				// Clear all row groups, pivots, and values
				gridApi.api.setRowGroupColumns([]);
				gridApi.api.setPivotColumns([]);
				gridApi.api.setValueColumns([]);
			}
		}, 100);
	}, []);

	const isPivotModeEnabled = useCallback((itemId) => {
		return pivotMode[itemId] || false;
	}, [pivotMode]);
	// For data splitting modal
	const [showDataSplitModal, setShowDataSplitModal] = useState(false);
	const [selectedItemForSplit, setSelectedItemForSplit] = useState(null);

	return (<div style={{
		height: '100vh',
		overflow: 'auto',
		position: 'relative',
		// background: `linear-gradient(45deg, ${Array.isArray(dashboardColors.background?.gradient) && dashboardColors.background.gradient.length > 0 ? dashboardColors.background.gradient.join(', ') : '#1e3c72, #2980b9, #6dd5fa'})`,
		// '--color': backgroundColors.color || '#e2e2e2',
		// '--dashboard-grid-color': dashboardColors.background?.gridColor || '#ff6b6b',
		// '--dashboard-grid-opacity': dashboardColors.background?.gridOpacity || 0.15,
		backgroundColor: '#cecece',
	}} className={`${styles.container} ${styles.tableAnalysisContainer}`}>
		{!isEmbedded && (
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
          
          /* Grid Pattern Background - Only apply to standalone TableAnalysisTab */
          .${styles.tableAnalysisContainer}::before {
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
          .${styles.tableAnalysisContainer} {
            background-image: 
              linear-gradient(90deg, var(--dashboard-grid-color) 1px, transparent 1px), 
              linear-gradient(0deg, var(--dashboard-grid-color) 1px, transparent 1px);
            background-size: 20px 20px;
            background-attachment: local;
            background-position: 0 0;
            background-repeat: repeat;
          }
          
          /* Ensure content is above grid */
          .${styles.tableAnalysisContainer} > * {
            position: relative;
            z-index: 1;
          }
          
          /* Fallback grid pattern if CSS variables fail */
          .${styles.tableAnalysisContainer}::after {
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
          .${styles.tableAnalysisContainer}:not([style*="--dashboard-grid-color"])::after {
            display: block;
          }
        `}
			</style>
		)}
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
		<div className={styles.mainContent3}>
			<div className={styles.contentContainer2}>
				{/* Controls */}
				<Card className={styles.controlsCard} style={{ marginBottom: 12 }}>
					<div className={styles.titleButton}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 10 , marginRight: 10 }}>
							<h2>Bảng dữ liệu</h2>
						</div>
						
						{/* Business Tags Section */}
						<div className={styles.businessTagsContainer}>
							<div className={styles.businessTagsHeader}>
								<Text type="secondary" className={styles.businessTagsLabel}>
									Function:
								</Text>
								<Space size={4} wrap style={{ flex: 1 }}>
									{(showAllBusinessTags ? businessTags : businessTags.slice(0, window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6)).map((tag, index) => {
										const tagColor = getTagColor(index);
										return (
											<Button
												key={`business-${tag}`}
												type="default"
												size={window.innerWidth <= 480 ? 'small' : 'small'}
												style={{
													fontSize: window.innerWidth <= 480 ? '11px' : '12px',
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
											</Button>
										);
									})}
									{!showAllBusinessTags && businessTags.length > (window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6) && (window.innerWidth <= 768 ? (
										<Dropdown
											menu={{
												items: businessTags.slice(window.innerWidth <= 480 ? 3 : 4).map((tag, index) => {
													const tagColor = getTagColor(index + (window.innerWidth <= 480 ? 3 : 4));
													return {
														key: tag, label: (<div style={{
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'space-between',
														}}>
															<span>{tag}</span>
															{selectedBusinessTags.includes(tag) && <CheckOutlined
																style={{ color: tagColor }} />}
														</div>), onClick: () => {
															if (tag === 'All') {
																setSelectedBusinessTags(['All']);
															} else {
																const newTags = selectedBusinessTags.includes(tag) ? selectedBusinessTags.filter(t => t !== tag) : [...selectedBusinessTags.filter(t => t !== 'All'), tag];
																setSelectedBusinessTags(newTags.length === 0 ? ['All'] : newTags);
															}
														},
													};
												}),
											}}
											trigger={['click']}
											placement="bottomLeft"
										>
											<Button
												size={window.innerWidth <= 480 ? 'small' : 'small'}
												style={{
													fontSize: window.innerWidth <= 480 ? '11px' : '12px',
													padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
													height: window.innerWidth <= 480 ? '24px' : '28px',
												}}
											>
												+{businessTags.length - (window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6)}
											</Button>
										</Dropdown>) : (<Button
										size={window.innerWidth <= 480 ? 'small' : 'small'}
										style={{
											fontSize: window.innerWidth <= 480 ? '11px' : '12px',
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
											fontSize: window.innerWidth <= 480 ? '11px' : '12px',
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
								display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 3, marginLeft: 10
							}}>
								<Text type="secondary" style={{
									fontSize: window.innerWidth <= 480 ? 11 : 12,
									fontWeight: 500,
									whiteSpace: 'nowrap',
								}}>
									Unit:
								</Text>
								<Space size={4} wrap style={{ flex: 1 }}>
									{(showAllStoreTags ? storeTags : storeTags.slice(0, window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6)).map((tag, index) => {
										const tagColor = getTagColor(index);
										return (
											<Button
												key={`store-${tag}`}
												type="default"
												size={window.innerWidth <= 480 ? 'small' : 'small'}
												style={{
													fontSize: window.innerWidth <= 480 ? '11px' : '12px',
													padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
													height: window.innerWidth <= 480 ? '24px' : '28px',
													minWidth: window.innerWidth <= 480 ? 'auto' : '60px',
													backgroundColor: selectedStoreTags.includes(tag) ? '#ECECEC' : undefined,
													borderColor: selectedStoreTags.includes(tag) ? '#ECECEC' : undefined,
													fontWeight: selectedStoreTags.includes(tag) ? '600' : '400',
												}}
												onClick={() => {
													if (tag === 'All') {
														setSelectedStoreTags(['All']);
													} else {
														const newTags = selectedStoreTags.includes(tag) ? selectedStoreTags.filter(t => t !== tag) : [...selectedStoreTags.filter(t => t !== 'All'), tag];
														setSelectedStoreTags(newTags.length === 0 ? ['All'] : newTags);
													}
												}}
											>
												{tag}
											</Button>
										);
									})}
									{!showAllStoreTags && storeTags.length > (window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6) && (window.innerWidth <= 768 ? (
										<Dropdown
											menu={{
												items: storeTags.slice(window.innerWidth <= 480 ? 3 : 4).map((tag, index) => {
													const tagColor = getTagColor(index + (window.innerWidth <= 480 ? 3 : 4));
													return {
														key: tag, label: (<div style={{
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'space-between',
														}}>
															<span>{tag}</span>
															{selectedStoreTags.includes(tag) && <CheckOutlined
																style={{ color: tagColor }} />}
														</div>), onClick: () => {
															if (tag === 'All') {
																setSelectedStoreTags(['All']);
															} else {
																const newTags = selectedStoreTags.includes(tag) ? selectedStoreTags.filter(t => t !== tag) : [...selectedStoreTags.filter(t => t !== 'All'), tag];
																setSelectedStoreTags(newTags.length === 0 ? ['All'] : newTags);
															}
														},
													};
												}),
											}}
											trigger={['click']}
											placement="bottomLeft"
										>
											<Button
												size={window.innerWidth <= 480 ? 'small' : 'small'}
												style={{
													fontSize: window.innerWidth <= 480 ? '11px' : '12px',
													padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
													height: window.innerWidth <= 480 ? '24px' : '28px',
												}}
											>
												+{storeTags.length - (window.innerWidth <= 480 ? 3 : window.innerWidth <= 768 ? 4 : 6)}
											</Button>
										</Dropdown>) : (<Button
										size={window.innerWidth <= 480 ? 'small' : 'small'}
										style={{
											fontSize: window.innerWidth <= 480 ? '11px' : '12px',
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
											fontSize: window.innerWidth <= 480 ? '11px' : '12px',
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
						
						{/* Action Buttons */}
						<div style={{
							display: 'flex',
							gap: 8,
							flexWrap: 'wrap',
							justifyContent: window.innerWidth <= 768 ? 'center' : 'flex-end',
							flex: window.innerWidth <= 768 ? '1' : '0 0 auto',
						}}>
							{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
								<Tooltip title="Quản lý quyền truy cập">
									<Button
										icon={<SafetyOutlined />}
										size={window.innerWidth <= 480 ? 'small' : 'middle'}
										onClick={() => handleOpenUserClassModal()}
										style={{
											fontSize: window.innerWidth <= 480 ? '11px' : '12px',
										}}
									/>
								</Tooltip>)}
							{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
								<Tooltip title="Thêm thẻ mới">
									<Button
										icon={<PlusOutlined />}
										size={window.innerWidth <= 480 ? 'small' : 'middle'}
										onClick={handleOpenNewCardModal}
										style={{
											fontSize: window.innerWidth <= 480 ? '11px' : '12px',
										}}
									/>
								</Tooltip>)}
							{/* Cài đặt Tags Button */}
							{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
								<Tooltip title="Cài đặt Tags">
									<Button
										icon={<TagsOutlined />}
										size={window.innerWidth <= 480 ? 'small' : 'middle'}
										style={{
											fontSize: window.innerWidth <= 480 ? '11px' : '12px',
										}}
										onClick={handleOpenTagSettings}
									/>
								</Tooltip>)}
							{/* Cài đặt Prompt Button */}
							{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
								<Tooltip title="Cài đặt Prompt mặc định">
									<Button
										icon={<SettingOutlined />}
										size={window.innerWidth <= 480 ? 'small' : 'middle'}
										style={{
											fontSize: window.innerWidth <= 480 ? '11px' : '12px',
										}}
										onClick={handleOpenPromptSettings}
									/>
								</Tooltip>)}

							{/* Cài đặt màu sắc Dashboard */}
							{/* <Tooltip title="Cài đặt màu sắc Dashboard">
								<Button
									icon={<Image size={20} color="#262626" strokeWidth={1.5} />}
									size={window.innerWidth <= 480 ? 'small' : 'middle'}
									onClick={handleOpenBackgroundModal}
								/>
							</Tooltip> */}
						</div>
						
						<div className={styles.headerCacheButton}>
							{/* <Button type="default" size="small"
									style={{
										marginBottom: 8,
										fontSize: window.innerWidth <= 480 ? '11px' : '13px',
										padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
										height: window.innerWidth <= 480 ? '24px' : '32px',
										minWidth: window.innerWidth <= 480 ? 'auto' : '60px',
										marginLeft: 10,
									}} onClick={handleExportHtml}
									icon={<ExportOutlined />}
									loading={isExporting} disabled={isExporting}>Export HTML</Button> */}
							<Button
								size="small"
								type="primary"
								style={{
									marginBottom: 8,
									fontSize: window.innerWidth <= 480 ? '11px' : '13px',
									padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px',
									height: window.innerWidth <= 480 ? '24px' : '32px',
									minWidth: window.innerWidth <= 480 ? 'auto' : '60px',
									marginLeft: 10,
								}}
								onClick={async () => {
									try {
										// Xóa toàn bộ cache trước để đảm bảo xóa hết
										const { clearAllTemplateCache } = await import('../../../../utils/templateRowUtils.js');
										const deletedCount = await clearAllTemplateCache();

										// Tải lại cache mới với forceRefresh, mặc định pageSize = 500000
										const { templateRowCacheService } = await import('../../../../utils/templateRowUtils.js');

										const requests = approvedVersions.map(version => ({
											idTemplate: version.id_template,
											idVersion: version.id_version,
											page: 1,
											pageSize: 5000, // Mặc định luôn là 500000
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
							{/*<Button*/}
							{/*	size="small"*/}
							{/*onClick={async () => {*/}
							{/*	try {*/}
							{/*		// Preload với pageSize = 500000 mặc định*/}
							{/*		const { templateRowCacheService } = await import('../../../../utils/templateRowUtils.js');*/}
							{/*		const requests = approvedVersions.map(version => ({*/}
							{/*			idTemplate: version.id_template,*/}
							{/*			idVersion: version.id_version,*/}
							{/*			page: 1,*/}
							{/*			pageSize: 500000 // Mặc định luôn là 500000*/}
							{/*		}));*/}
							{/*		await templateRowCacheService.getMultipleTemplateRows(requests, false); // forceRefresh = false*/}
							{/*		message.success(`Cache preloaded successfully for ${requests.length} versions`);*/}
							{/*	} catch (error) {*/}
							{/*		message.error('Cache preload failed: ' + error.message);*/}
							{/*	}*/}
							{/*}}*/}
							{/*	disabled={approvedVersions.length === 0}*/}
							{/*>*/}
							{/*	Preload Cache*/}
							{/*</Button>*/}
							{/*<Button*/}
							{/*	size="small"*/}
							{/*	danger*/}
							{/*	onClick={async () => {*/}
							{/*		try {*/}
							{/*			const { clearAllTemplateCache } = await import('../../../../utils/templateRowUtils.js');*/}
							{/*			const deletedCount = await clearAllTemplateCache();*/}
							{/*			message.success(`Cleared ${deletedCount} cache records`);*/}
							{/*		} catch (error) {*/}
							{/*			message.error('Cache clear failed: ' + error.message);*/}
							{/*		}*/}
							{/*	}}*/}
							{/*>*/}
							{/*	Clear All Cache*/}
							{/*</Button>*/}
						</div>
					</div>

				</Card>

			</div>

			{/* Metrics Grid */}
			<Row gutter={[24, 24]} className={styles.metricsGrid} style={{ maxWidth: '98%', margin: '0 auto' }}>
				{filteredMetrics.map((item, index) => (<>
						<Col
							key={item.id}
							md={24}
							style={{ position: 'relative' }}
							className={styles.metricsGridCol}
						>
							<Card
								className={styles.metricsGridCard2}
								data-item-id={item.id}
								id={`dashboard-item-${item.id}`}
								style={{
									cursor: 'pointer',
									boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.2)',
									overflow: 'hidden',
									position: 'relative',
									borderRadius: 3,
									transition: 'all 0.3s ease',
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
								{/* Main Content Container - Scrollable */}
								<div>
									{item.type === 'table2' ? (<>
										{(() => {
											return null;
										})()}
										<div>

											<div style={{ background: getTagColor(0), padding: '8px 8px 8px 16px' }}>
												<Row>
													<Col md={12}>
														<Title level={4} style={{
															lineHeight: 1.4,
															margin: 0,
															flex: 1,
															fontWeight: 600,
															color: '#ffffff',
														}}>
															{item.name}
														</Title>
													</Col>
													<Col md={12}>
														<div style={{
															display: 'flex',
															gap: 4,
															justifyContent: 'end',
														}}>
															{/*<Button*/}
															{/*	type="default"*/}
															{/*	size="small"*/}
															{/*	onClick={() => openAnalysisDetailModal(item)}*/}
															{/*>*/}
															{/*	Ghi chú*/}
															{/*</Button>*/}
															{/*<Button*/}
															{/*	type="primary"*/}
															{/*	size="small"*/}
															{/*	loading={analyzingItems.has(item.id)}*/}
															{/*	onClick={() => handleAnalyzeButtonClick(item)}*/}
															{/*	style={{*/}
															{/*		fontSize: '11px',*/}
															{/*		height: '24px',*/}
															{/*		padding: '0 8px',*/}
															{/*	}}*/}
															{/*>*/}
															{/*	{analyzingItems.has(item.id) ? 'Đang phân tích...' : 'Phân tích'}*/}
															{/*</Button>*/}
															<Button
																size="small"
																icon={<DatabaseFilled style={{ color: '#ffffff' }} />}
																onClick={(e) => {
																	e.stopPropagation();
																	handleViewDetails(item);
																}}
																style={{
																	background: 'rgba(0,0,0,0)',
																}}
															>
															</Button>

															{/* <Tag
															color={getTagColorByName(item.category, businessTags)}
															style={{ margin: '0' }}
														>
															{item.category}
														</Tag>
														{item.storeCategory && (
															<Tag
																color={getTagColorByName(item.storeCategory, storeTags)}
																style={{ margin: '0' }}
															>
																{item.storeCategory}
															</Tag>
														)} */}

															{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
																<>
																	<Button
																		size="small"
																		icon={<SettingOutlined
																			style={{ color: '#ffffff' }} />}
																		onClick={(e) => {
																			e.stopPropagation();
																			handleOpenEditModal(item);
																		}}
																		title="Cài đặt"
																		style={{
																			background: 'rgba(0,0,0,0)',
																		}}
																	/>
																	<Button
																		size="small"
																		icon={<SafetyOutlined
																			style={{ color: '#ffffff' }} />}
																		onClick={(e) => {
																			e.stopPropagation();
																			handleOpenUserClassModal(item);
																		}}
																		title="Cài đặt quyền"
																		style={{
																			background: 'rgba(0,0,0,0)',
																		}}
																	/>
																	<Button
																		size="small"
																		loading={deleteLoading && deletingItemId === item.id}
																		onClick={(e) => {
																			e.stopPropagation();
																			handleDeleteDashboardItem(item);
																		}}
																		style={{
																			background: 'rgba(0,0,0,0)',
																		}}
																	>
																		<Trash color="#ffffff" size={13} />
																	</Button>
																</>
															)}
														</div>
													</Col>
												</Row>
											</div>
											<Row style={{ padding: 16 }}>
												<Col md={16}>
													<Row>
														<Col md={12}>

															{/* Date Range Filter */}
															{item.settings?.dateColumn && (<div style={{
																marginBottom: 12,
																padding: '8px 0',
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
																		<Option value="last7Days">7 ngày gần
																			nhất</Option>
																		<Option value="last15Days">15 ngày gần
																			nhất</Option>
																		<Option value="last30Days">30 ngày gần
																			nhất</Option>
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
																	{item.settings?.filterColumn && (<div style={{
																		backgroundColor: '#f5f5f5', borderRadius: '6px',
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
																						<Option key={value}
																								value={value}>
																							{value}
																						</Option>));
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
																				</Button>)}
																		</Space>
																	</div>)}
																</Space>
															</div>)}
															{/*Table*/}
														</Col>
													</Row>
													<div style={{
														height: '620px',
														overflow: 'auto',
													}}>
														{tableLoadingStates[item.id] ? (
															<div style={{
																textAlign: 'center',
																color: '#1890ff',
																padding: 32,
																display: 'flex',
																flexDirection: 'column',
																alignItems: 'center',
																gap: 8,
															}}>
																<Spin size="large" />
																<span>Đang tải dữ liệu...</span>
															</div>
														) : tableErrorStates[item.id] ? (
															<div style={{
																textAlign: 'center',
																color: '#ff4d4f',
																padding: 32,
																display: 'flex',
																flexDirection: 'column',
																alignItems: 'center',
																gap: 8,
															}}>
																<ExclamationCircleOutlined style={{ fontSize: 24 }} />
																<span>{tableErrorStates[item.id]}</span>
																<Button
																	size="small"
																	type="primary"
																	onClick={() => loadTableData(item, true)}
																>
																	Thử lại
																</Button>
															</div>
														) : tableData[item.id] ? (
															<AgGridReact
																ref={(ref) => {
																	if (ref) {
																		gridRefs.current[item.id] = ref;
																	}
																}}
																statusBar={statusBar}
																enableRangeSelection
																rowSelection="multiple"
																rowData={(() => {
																	const data = tableData[item.id] || [];

																	// Initialize filteredData with all data
																	let filteredData = data;

																	// Check if we have date column and date range settings
																	if (item.settings.dateColumn) {
																		// First, check if user has manually selected a date range
																		if (tableDateRanges[item.id]) {
																			const [startDate, endDate] = tableDateRanges[item.id];
																			filteredData = data.filter(row => {
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

																			filteredData = data.filter(row => {
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

																			filteredData = data.filter(row => {
																				const dateValue = row[item.settings.dateColumn];
																				if (!dateValue) return true;

																				const rowDate = new Date(dateValue);
																				const isAfterStart = !startDate || rowDate >= startDate;
																				const isBeforeEnd = !endDate || rowDate <= endDate;

																				return isAfterStart && isBeforeEnd;
																			});
																		}
																	}

																	// Apply column filter if specified
																	if (item.settings?.filterColumn && tableColumnFilters[item.id]) {
																		const filterValue = tableColumnFilters[item.id];
																		if (filterValue && filterValue !== 'all') {
																			filteredData = filteredData.filter(row => {
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
																			sortable: false,
																			filter: true,
																			enableRowGroup: true, // Enable for row grouping
																			enablePivot: true, // Enable for pivot columns
																			cellStyle: {
																				fontSize: '12px',
																				fontWeight: 500,
																				backgroundColor: '#fafafa',
																			},
																			cellRenderer: (params) => {
																				if (!params || !params.data || !dateColumn) {
																					return '';
																				}
																				const value = params.data[dateColumn];
																				return formatValueBySettings(value, dateColumnSetting);
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
																				sortable: false,
																				filter: true,
																				enableRowGroup: true, // Enable for row grouping
																				enablePivot: true, // Enable for pivot columns
																				enableValue: true, // Enable as value column
																				aggFunc: 'sum', // Default aggregation function
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
																					if (!params) {
																						return '';
																					}
																					// If column type is dataBar, render data bar
																					if (columnSetting?.type === 'dataBar') {
																						const allValues = params.api?.getRenderedNodes()?.map(node => node.data?.[columnId]).filter(v => v !== null && v !== undefined) || [];
																						return renderDataBar(params.value, allValues, columnSetting, index);
																					}
																					// Otherwise, use normal formatting
																					const value = params.value;
																					return formatValueBySettings(value, columnSetting);
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
																						sortable: false,
																						filter: true,
																						enableRowGroup: true, // Enable for row grouping
																						enablePivot: true, // Enable for pivot columns
																						enableValue: true, // Enable as value column
																						aggFunc: 'sum', // Default aggregation function
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
																	floatingFilter: true,
																	suppressHeaderMenuButton: true, // Tắt sortable để sử dụng logic sắp xếp tùy chỉnh
																	enableRowGroup: true,
																	enablePivot: true,
																	enableValue: true,
																	hide: false, // Hiển thị tất cả cột mặc định
																}}
																suppressRowGroupHidesColumns={false}
																suppressColumnVirtualisation={true}
																groupDisplayType="multipleColumns"
																rowGroupPanelShow="always"
																className="ag-theme-quartz"
																style={{
																	height: '300px',
																	width: '100%',
																}}
															/>) : (<div style={{
															textAlign: 'center', color: '#aaa', padding: 32,
														}}>
															Không có dữ liệu để hiển thị
														</div>)}
													</div>
												</Col>
												<Col md={8}>
													{/*<Row>*/}
													{/*	<Col md={12}*/}
													{/*		 style={{ padding: '0 8px', display: 'flex', gap: 4 }}>*/}
													{/*		<Button*/}
													{/*			type="default"*/}
													{/*			size="small"*/}
													{/*			onClick={() => openAnalysisDetailModal(item)}*/}
													{/*			style={{*/}
													{/*				fontSize: '12px',*/}
													{/*				height: '28px',*/}
													{/*				padding: '0 12px',*/}
													{/*			}}*/}
													{/*		>*/}
													{/*			Ghi chú*/}
													{/*		</Button>*/}

													{/*		<Tooltip title="Phân tích lại dữ liệu với AI">*/}
													{/*			<Button*/}
													{/*				type="default"*/}
													{/*				size="small"*/}
													{/*				loading={analyzingItems.has(item.id)}*/}
													{/*				onClick={() => handleAnalyzeButtonClick(item)}*/}
													{/*				style={{*/}
													{/*					fontSize: '12px',*/}
													{/*					height: '28px',*/}
													{/*					padding: '0 12px',*/}
													{/*				}}*/}
													{/*			>*/}
													{/*				{analyzingItems.has(item.id) ? 'Đang phân tích...' : 'Phân tích lại'}*/}
													{/*			</Button>*/}
													{/*		</Tooltip>*/}
													{/*	</Col>*/}
													{/*</Row>*/}
													<Row>
														<Col md={24}>
															{showAnalysis && (<div style={{ margin: '14px 0' }}>
																{item.analysis?.answer ? (<>
																	<div style={{
																		fontSize: '13px',
																		color: '#333',
																		lineHeight: '1.5',
																		padding: '16px 16px 0 16px',
																		maxHeight: '600px',
																		overflow: 'auto',
																		position: 'relative',
																	}}>
																		<div style={{
																			position: 'absolute',
																			right: 10,
																			top: 20,
																			display: 'flex',
																			gap: '8px',
																		}}>
																			{editingAnalysisId === item.id ? (
																				<>
																					<Tooltip title="Lưu">
																						<Button
																							type="primary"
																							size="small"
																							onClick={() => handleSaveAnalysis(item.id)}
																						>
																							Lưu
																						</Button>
																					</Tooltip>
																					<Tooltip title="Hủy">
																						<Button
																							size="small"
																							onClick={handleCancelEditAnalysis}
																						>
																							Hủy
																						</Button>
																					</Tooltip>
																				</>
																			) : (
																				<>
																					<Tooltip
																						title="Chỉnh sửa phân tích">
																						<Button
																							type="default"
																							size="small"
																							onClick={() => handleEditAnalysis(item)}
																						>
																							Chỉnh sửa
																						</Button>
																					</Tooltip>
																					<Tooltip
																						title="Xem phân tích trên popup">
																						<Button
																							type="default"
																							size="small"
																							loading={analyzingItems.has(item.id)}
																							onClick={() => handleAnalyzeButtonClick(item)}
																						>
																							<img src="/iconAiView.svg"
																								 alt=""
																								 style={{ height: '60%' }} />
																						</Button>
																					</Tooltip>
																				</>
																			)}
																		</div>
																		{editingAnalysisId === item.id ? (
																			<textarea
																				value={editingAnalysisContent}
																				onChange={(e) => setEditingAnalysisContent(e.target.value)}
																				style={{
																					width: '100%',
																					minHeight: '550px',
																					padding: '12px',
																					border: '1px solid #d9d9d9',
																					borderRadius: '6px',
																					fontSize: '14px',
																					lineHeight: '1.6',
																					resize: 'vertical',
																					marginTop: '40px',
																				}}
																				placeholder="Nhập nội dung phân tích..."
																			/>
																		) : (
																			<div
																				className={styles2.analysisContent}
																				style={{
																					lineHeight: '1.6',
																					color: '#262626',
																					fontSize: window.innerWidth <= 480 ? '13px' : '14px',
																				}}
																				dangerouslySetInnerHTML={{
																					__html: renderMarkdown(item.analysis.answer),
																				}}
																			/>
																		)}
																	</div>
																</>) : (// Hiển thị nút phân tích khi chưa có answer
																	(item.type === 'table2') && (
																		<Tooltip
																			title="Sử dụng AI để phân tích dữ liệu biểu đồ">
																			<Button
																				type="primary"
																				size="small"
																				loading={analyzingItems.has(item.id)}
																				onClick={() => handleAnalyzeButtonClick(item)}
																				style={{
																					fontSize: '11px',
																					height: '24px',
																					padding: '0 8px',
																					marginLeft: '50%',
																					marginTop: '30%',
																					transform: 'translate(-50%, -50%)',
																				}}
																			>
																				{analyzingItems.has(item.id) ? 'Đang phân tích...' : 'Phân tích'}
																			</Button>
																		</Tooltip>
																	))}
															</div>)}
														</Col>
													</Row>
												</Col>
											</Row>
										</div>

									</>) : (<>
									</>)}
								</div>
							</Card>
						</Col>
					</>

				))}
			</Row>

			{filteredMetrics.length === 0 && (<div style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0' }}>
				<Text>Không có bảng dữ liệu nào được chọn.</Text><br />
				<Text>Cần kết nối bảng dữ liệu trước.</Text>
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
		{/* Create Table Modal */}
		<CreateTableModal
			visible={showNewCardModal}
			onCancel={handleCancelNewCard}
			onCreate={handleCreateNewCard}
			loading={loading}
			approvedVersions={approvedVersions}
			newCard={newCard}
			setNewCard={handleNewCardChange}
			newTemplateColumns={newTemplateColumns}
			newTableDisplayColumns={newTableDisplayColumns}
			newTableDateColumn={newTableDateColumn}
			newTableDateRange={newTableDateRange}
			newTableDateColumnSize={newTableDateColumnSize}
			newTableTimeThreshold={newTableTimeThreshold}
			newTableColumnSettings={newTableColumnSettings}
			newTableColumnSizes={newTableColumnSizes}
			newTableFilterColumn={newTableFilterColumn}
			newTableSortColumn={newTableSortColumn}
			newTableSortType={newTableSortType}
			newCollapsedColumns={newCollapsedColumns}
			onApprovedVersionChange={handleNewTableApprovedVersionChange}
			onDisplayColumnsChange={handleNewTableDisplayColumnsChange}
			onDateColumnChange={handleDateColumnChange}
			onDateRangeChange={handleDateRangeChange}
			onDateColumnSizeChange={handleDateColumnSizeChange}
			onTimeThresholdChange={handleTimeThresholdChange}
			onFilterColumnChange={handleFilterColumnChange}
			onSortColumnChange={handleSortColumnChange}
			onSortTypeChange={handleSortTypeChange}
			onColumnSettingChange={handleColumnSettingChange}
			onColumnSizeChange={handleColumnSizeChange}
			onColumnValueFormatChange={handleColumnValueFormatChange}
			toggleColumnCollapse={toggleNewColumnCollapse}
		/>

		<EditTableModal
			editingDashboardItem={editingDashboardItem}
			setEditingDashboardItem={setEditingDashboardItem}
			settingModalVisible={settingModalVisible}
			handleCancelEdit={handleCancelEdit}
			handleSaveEdit={handleSaveEdit}
			businessTags={businessTags}
			storeTags={storeTags}
			approvedVersions={approvedVersions}
			editSelectedApprovedVersion={editSelectedApprovedVersion}
			handleEditApprovedVersionChange={handleEditApprovedVersionChange}
			editTemplateColumns={editTemplateColumns}
			editSelectedColumns={editSelectedColumns}
			setEditSelectedColumns={setEditSelectedColumns}
			editTopN={editTopN}
			setEditTopN={setEditTopN}
			editTableDateColumn={editTableDateColumn}
			setEditTableDateColumn={setEditTableDateColumn}
			editTableDateRange={editTableDateRange}
			setEditTableDateRange={setEditTableDateRange}
			editTableDateColumnSize={editTableDateColumnSize}
			setEditTableDateColumnSize={setEditTableDateColumnSize}
			editTableTimeThreshold={editTableTimeThreshold}
			setEditTableTimeThreshold={setEditTableTimeThreshold}
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

		{/* Prompt Settings Modal */}
		<Modal
			title="Cài đặt Prompt mặc định"
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
				<Text>
					Prompt mặc định này sẽ được sử dụng khi tạo thẻ mới. Bạn có thể tùy chỉnh nội dung theo nhu cầu.
				</Text>
				<Input.TextArea
					value={promptSettingValue}
					onChange={(e) => setPromptSettingValue(e.target.value)}
					placeholder="Nhập prompt mặc định..."
					rows={6}
					style={{ marginTop: 8 }}
				/>
			</Space>
		</Modal>

		{/* Analysis Detail Modal */}
		{analysisDetailModal.visible && (<AnalysisDetailModal2
			key={`${analysisDetailModal.item?.id}-${analysisDetailModal.analysis?.answer ? 'has-analysis' : 'no-analysis'}`}
			visible={analysisDetailModal.visible}
			onClose={closeAnalysisDetailModal}
			analysis={analysisDetailModal.analysis}
			item={analysisDetailModal.item}
			onReanalyze={handleReanalyzeInModal}
			isAnalyzing={analyzingItems.has(analysisDetailModal.item?.id)}
			chartOptions={chartOptions}
			currentUser={currentUser}
			onItemUpdate={handleItemUpdate}
			tableData={tableData}
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
							value={dashboardColors.background?.gradient?.[0] || '#1e3c72'}
							onChange={(color) => {
								const newGradient = [...(dashboardColors.background?.gradient || ['#1e3c72', '#2980b9', '#6dd5fa'])];
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
							value={dashboardColors.background.gradient[1]}
							onChange={(color) => {
								const newGradient = [...dashboardColors.background.gradient];
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
							value={dashboardColors.background.gradient[2]}
							onChange={(color) => {
								const newGradient = [...dashboardColors.background.gradient];
								newGradient[2] = color.toHexString();
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
							value={dashboardColors.background.gridColor}
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
							value={dashboardColors.background.gridOpacity}
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
							{dashboardColors.background.gridOpacity}
						</span>
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
						background: `linear-gradient(45deg, ${Array.isArray(dashboardColors.background?.gradient) && dashboardColors.background.gradient.length > 0 ? dashboardColors.background.gradient.join(', ') : '#1e3c72, #2980b9, #6dd5fa'})`,
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
						Gradient: {Array.isArray(dashboardColors.background?.gradient) && dashboardColors.background.gradient.length > 0 ? dashboardColors.background.gradient.join(' → ') : '#1e3c72 → #2980b9 → #6dd5fa'} |
						Grid: {dashboardColors.background?.gridColor || '#ff6b6b'}
					</p>
				</div>
			</div>
		</Modal>

		{/* Data Split Modal */}
		<DataSplitModal
			open={showDataSplitModal}
			onCancel={() => {
				setShowDataSplitModal(false);
				setSelectedItemForSplit(null);
			}}
			onConfirm={handleSplitDataAndAnalyze}
			selectedItem={selectedItemForSplit}
			modelList={MODEL_AI_LIST}
		/>
	</div>);
}



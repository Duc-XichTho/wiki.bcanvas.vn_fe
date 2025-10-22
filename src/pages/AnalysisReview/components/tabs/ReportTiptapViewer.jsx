import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button, message, Tooltip, Collapse, Spin, Modal } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Clock, User, Edit2, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { getChatExportById, updateChatExport } from '../../../../apis/aiChatExportService';
import { getCurrentUserLogin } from '../../../../apis/userService.jsx';
import { createTimestamp, formatDateToDDMMYYYY } from '../../../../generalFunction/format.js';
import TableViewer from '../../../AI/TableViewer.jsx';
import ChartComponent from '../../../AI/ChartComponent.jsx';
import KPI2ContentView from '../../../Canvas/CanvasFolder/KPI2Calculator/KPI2ContentView.jsx';
import { getAllKpi2Calculator } from '../../../../apis/kpi2CalculatorService.jsx';
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
import { getTemplateColumn, getTemplateRow, getTemplateVersion } from '../../../../apis/templateSettingService.jsx';
import styles from './ReportTiptapViewer.module.css';
import { useReportEditor } from './useReportEditor';
import { ReportTiptapToolbar } from './ReportTiptapToolbar';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import { FontSize } from './FontSize';
import { LineHeight } from './LineHeight';
import AG_GRID_LOCALE_VN from '../../../Home/AgridTable/locale.jsx';
import css from '../../../KHKD/KHKDTongHop/TitleComponent/TiptapTitle/TipTap.module.css';


const ReportTiptapViewer = () => {
	const { id } = useParams();
	const { editor } = useReportEditor();
	const [report, setReport] = useState(null);
	const [loading, setLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Tiptap toolbar states
	const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [fontMenuOpen, setFontMenuOpen] = useState(false);
	const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
	const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
	const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);

	// Data states
	const [chartData, setChartData] = useState([]);
	const [tableBlocks, setTableBlocks] = useState([]);
	const [tiptapBlocks, setTiptapBlocks] = useState([]);
	const [kpi2Calculators, setKpi2Calculators] = useState([]);
	const [approvedVersionData, setApprovedVersionData] = useState([]); // Like ReportBuilderNonPD
	const [editingBlockIndex, setEditingBlockIndex] = useState(null);
	const [editingSectionIndex, setEditingSectionIndex] = useState(null);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [currentEditingSection, setCurrentEditingSection] = useState(null);
	const [modalContent, setModalContent] = useState('');
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	// Create a separate editor for the modal
	const modalEditor = useEditor({
		extensions: [
			StarterKit,
			TextStyle,
			Color,
			Underline,
			Highlight,
			FontFamily,
			FontSize,
			LineHeight,
			Image,
			TextAlign.configure({
				types: ['heading', 'paragraph'],
			}),
			Table.configure({
				resizable: true,
			}),
			TableRow,
			TableCell,
			TableHeader,
		],
		content: '',
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			setModalContent(html);
			console.log('📝 [ReportTiptap] Modal editor content updated:', {
				contentLength: html.length,
				contentPreview: html.substring(0, 100) + '...'
			});
		},
		editable: editModalVisible, // Only editable when modal is open
	});
	const statusBar = useMemo(() => ({
		statusPanels: [
			{
				statusPanel: 'agAggregationComponent',
				statusPanelParams: {
					// possible values are: 'count', 'sum', 'min', 'max', 'avg'
					aggFuncs: ['count', 'sum'],
				},
			},
		],
	}), []);
	useEffect(() => {
		if (id) {
			loadReportData();
		}
		fetchCurrentUser();
		loadKpi2Calculators();
		loadApprovedVersionData(); // Load approved version data like ReportBuilderNonPD
	}, [id]);

	useEffect(() => {
		if (editor) {
			editor.setEditable(isEditMode);
		}
	}, [isEditMode, editor]);

	// Handle window resize for responsive design
	useEffect(() => {
		const handleResize = () => {
			setWindowWidth(window.innerWidth);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		if (report && editor) {
			// Set content from aiChatExport with Tiptap blocks structure
			let content = '';

			// Priority 1: Use output_config.sections if available (for edited content)
			if (report.output_config?.sections && Array.isArray(report.output_config.sections)) {
				const sections = report.output_config.sections
					.filter(section => section.textResult)
					.sort((a, b) => a.order - b.order);

				if (sections.length > 0) {
					content = sections.map(section => section.textResult).join('\n\n');
					console.log('📄 [ReportTiptap] Loading content from output_config.sections:', {
						sectionsCount: sections.length,
						contentLength: content.length,
						sections: sections.map(s => ({ title: s.title, order: s.order }))
					});
				}
			}

			// Priority 2: Fallback to tiptapBlocks if no output_config content
			if (!content && report.more_info?.tiptapBlocks && Array.isArray(report.more_info.tiptapBlocks)) {
				// Use Tiptap blocks structure
				const blocks = report.more_info.tiptapBlocks.sort((a, b) => a.order - b.order);
				content = blocks.map(block => block.content).join('\n\n');
				console.log('📄 [ReportTiptap] Loading content from tiptapBlocks:', {
					blocksCount: blocks.length,
					contentLength: content.length,
					blocks: blocks.map(b => ({ title: b.group_name, order: b.order }))
				});
			} else if (!content && report.content) {
				content = report.content;
				console.log('📄 [ReportTiptap] Loading content from report.content:', {
					contentLength: content.length,
					contentPreview: content.substring(0, 100) + '...',
				});
			} else if (!content && report.more_info?.analysisResult?.blocks) {
				// Extract MESSAGE blocks for content (fallback for migrated data)
				const messageBlocks = report.more_info.analysisResult.blocks.filter(
					block => block.type == 'MESSAGE' && block.group_name == 'Conclusions',
				);
				content = messageBlocks.map(block => block.content).join('\n\n');
				console.log('📄 [ReportTiptap] Loading content from analysisResult blocks:', {
					blocksCount: messageBlocks.length,
					contentLength: content.length,
				});
			} else if (!content && report.more_info?.content) {
				content = report.more_info.content;
				console.log('📄 [ReportTiptap] Loading content from more_info.content:', {
					contentLength: content.length,
				});
			} else if (!content) {
				content = '<p>Nội dung báo cáo...</p>';
				console.log('📄 [ReportTiptap] Using default content');
			}

			console.log('🔄 [ReportTiptap] Setting content to editor:', {
				contentType: typeof content,
				contentLength: content.length,
				isHTML: content.includes('<') && content.includes('>'),
			});

			editor.commands.setContent(content);
		}
	}, [report, editor]);

	const fetchCurrentUser = async () => {
		try {
			const { data } = await getCurrentUserLogin();
			if (data) {
				setCurrentUser(data);
			}
		} catch (error) {
			console.error('Error fetching current user:', error);
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
		}
	};

	// Load approved version data like ReportBuilderNonPD
	const loadApprovedVersionData = async () => {
		console.log('📁 [ReportTiptap] Loading approved version data...');
		const loadStartTime = Date.now();

		try {
			// Load approved version data with details
			const allData = await getAllApprovedVersion();
			console.log('📊 [ReportTiptap] Raw approved versions loaded:', {
				totalCount: allData.length,
				loadTime: `${Date.now() - loadStartTime}ms`
			});

			// Filter data where apps includes 'analysis-review'
			const data = allData.filter(item =>
				(Array.isArray(item.apps) && item.apps?.includes('analysis-review'))
			);

			console.log('🔍 [ReportTiptap] Filtered for analysis-review:', {
				filteredCount: data.length,
				originalCount: allData.length
			});

			const approvedVersionsWithDetails = [];

			// Load details for each approved version
			for (const item of data) {
				try {
					console.log(`📋 [ReportTiptap] Loading details for: ${item.name} (ID: ${item.id})`);

					// Get template columns and rows for the approved version
					const columns = await getTemplateColumn(item.id_template, item.id_version);
					const rowVersionResponse = await getTemplateRow(
						item.id_template,
						item.id_version == 1 ? null : item.id_version
					);
					const version = await getTemplateVersion(item.id_template, item.id_version);

					const rowData = (rowVersionResponse.rows || []).map(row => ({ ...row.data, rowId: row.id }));
					const shuffled = [...rowData].sort(() => 0.5 - Math.random());

					// Ensure no circular references by creating a clean object
					const detailedItem = {
						id: item.id,
						id_template: item.id_template,
						id_version: item.id_version,
						name: item.name,
						rows: rowData,
						rowDemo: shuffled.slice(0, 30),
						templateColumns: columns,
						desc: version?.desc || '',
						tab: 'Approved Version'
					};

					console.log(`✅ [ReportTiptap] Loaded details for ${item.name}:`, {
						rowCount: rowData.length,
						columnsCount: columns.length,
						demoRowCount: shuffled.slice(0, 30).length
					});

					approvedVersionsWithDetails.push(detailedItem);
				} catch (error) {
					console.error(`❌ [ReportTiptap] Error loading details for approved version ${item.id}:`, error);
					// Add item without details if loading fails
					approvedVersionsWithDetails.push({
						...item,
						name: item.fileNoteName,
						rows: [],
						rowDemo: [],
						desc: item.desc || '',
						tab: 'Approved Version'
					});
				}
			}

			console.log('📈 [ReportTiptap] Approved versions with details loaded:', {
				totalItems: approvedVersionsWithDetails.length,
				itemsWithData: approvedVersionsWithDetails.filter(item => item.rows.length > 0).length,
				totalLoadTime: `${Date.now() - loadStartTime}ms`
			});

			setApprovedVersionData(approvedVersionsWithDetails);
		} catch (error) {
			console.error('❌ [ReportTiptap] Error loading approved version data:', error);
		}
	};

	const loadReportData = async () => {
		try {
			setLoading(true);
			const reportData = await getChatExportById(id);
			console.log('Report data loaded:', reportData);
			setReport(reportData);
			console.log('reportData', reportData);
			// Process charts from chart_data and chart_config
			let charts = [];
			if (reportData.more_info?.multipleCharts) {
				charts = reportData.more_info.multipleCharts;
			} else if (reportData.chart_data && reportData.chart_config) {
				charts = [{
					tableName: 'Biểu đồ chính',
					chartData: reportData.chart_data,
					chartConfig: reportData.chart_config,
				}];
			}
			setChartData(charts);

			// Process table blocks from tables field
			let tables = [];
			if (reportData.tables && Array.isArray(reportData.tables)) {
				// Tables are stored directly in tables field
				tables = reportData.tables.map((table, index) => ({
					type: 'TABLE',
					content: {
						name: table.name || `Bảng ${index + 1}`,
						url: table.url,
						data: table.data,
						description: table.description,
					},
					tableData: table.data, // For direct rendering without URL
				}));
			} else if (reportData.more_info?.analysisResult?.blocks) {
				// Fallback for migrated data
				tables = reportData.more_info.analysisResult.blocks.filter(
					block => block.type == 'TABLE',
				);
			}
			setTableBlocks(tables);

			// Process Tiptap blocks
			let blocks = [];
			if (reportData.more_info?.tiptapBlocks && Array.isArray(reportData.more_info.tiptapBlocks)) {
				blocks = reportData.more_info.tiptapBlocks.sort((a, b) => a.order - b.order);
			} else if (reportData.more_info?.analysisResult?.blocks) {
				// Fallback for migrated data
				blocks = reportData.more_info.analysisResult.blocks.filter(
					block => block.type == 'MESSAGE',
				);
			}
			setTiptapBlocks(blocks);
		} catch (error) {
			console.error('Error loading report:', error);
			message.error('Lỗi khi tải báo cáo');
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!editor || !report) {
			console.log('❌ [ReportTiptap] Missing editor or report:', { editor: !!editor, report: !!report });
			return;
		}

		try {
			setIsSaving(true);
			const content = editor.getHTML();

			console.log('💾 [ReportTiptap] Saving content:', {
				reportId: id,
				contentLength: content.length,
				contentPreview: content.substring(0, 100) + '...',
				currentUser: currentUser?.email,
			});

			// Update report content
			const updatedReport = {
				...report,
				id: id,
				content: content,
				update_at: new Date().toISOString(),
				more_info: {
					...report.more_info,
					lastEditedBy: currentUser?.email,
					lastEditedAt: createTimestamp(),
				},
			};

			console.log('🔄 [ReportTiptap] Calling updateChatExport with:', {
				id: id,
				contentLength: updatedReport.content.length,
				updateAt: updatedReport.update_at,
			});

			const result = await updateChatExport(updatedReport);

			console.log('✅ [ReportTiptap] Save successful:', result);

			setReport(updatedReport);
			setIsEditMode(false);
			message.success('Đã lưu thành công!');
		} catch (error) {
			console.error('❌ [ReportTiptap] Error saving report:', {
				error: error,
				errorMessage: error?.message,
				errorResponse: error?.response?.data,
				reportId: id,
			});
			message.error(`Có lỗi khi lưu báo cáo: ${error?.message || 'Unknown error'}`);
		} finally {
			setIsSaving(false);
		}
	};

	const toggleEditMode = () => {
		setIsEditMode(!isEditMode);
		setEditingBlockIndex(null); // Reset editing block when toggling edit mode
		setEditingSectionIndex(null); // Reset editing section when toggling edit mode
		setEditModalVisible(false); // Close modal when toggling edit mode
		setCurrentEditingSection(null);
	};

	const toggleSidebar = () => {
		setIsSidebarCollapsed(!isSidebarCollapsed);
	};

	const startEditingBlock = (blockIndex) => {
		setEditingBlockIndex(blockIndex);
		// Set editor content to the specific block content
		if (tiptapBlocks[blockIndex]) {
			editor.commands.setContent(tiptapBlocks[blockIndex].content);
		}
	};

	const saveBlockContent = async (blockIndex) => {
		if (!editor || !tiptapBlocks[blockIndex]) return;

		const newContent = editor.getHTML();
		const updatedBlocks = [...tiptapBlocks];
		updatedBlocks[blockIndex] = {
			...updatedBlocks[blockIndex],
			content: newContent
		};
		setTiptapBlocks(updatedBlocks);
		setEditingBlockIndex(null);
	};

	const cancelEditingBlock = () => {
		setEditingBlockIndex(null);
	};

	// Functions for editing output_config sections
	const startEditingSection = (sectionIndex) => {
		if (report.output_config?.sections[sectionIndex]) {
			const section = report.output_config.sections[sectionIndex];
			setCurrentEditingSection({ ...section, index: sectionIndex });
			setEditModalVisible(true);

			// Set modal editor content after modal is opened
			setTimeout(() => {
				if (modalEditor) {
					modalEditor.commands.setContent(section.textResult || '');
					setModalContent(section.textResult || '');
					modalEditor.setEditable(true);
				}
			}, 100);
		}
	};

	const saveSectionContent = async () => {
		if (!modalEditor || !currentEditingSection) {
			console.log('❌ [ReportTiptap] Cannot save: missing modalEditor or currentEditingSection', {
				hasModalEditor: !!modalEditor,
				hasCurrentEditingSection: !!currentEditingSection
			});
			return;
		}

		try {
			const newContent = modalEditor.getHTML();
			console.log('💾 [ReportTiptap] Saving section content:', {
				sectionIndex: currentEditingSection.index,
				sectionTitle: currentEditingSection.title,
				contentLength: newContent.length,
				contentPreview: newContent.substring(0, 100) + '...'
			});

			const updatedReport = {
				...report,
				output_config: {
					...report.output_config,
					sections: report.output_config.sections.map((section, index) =>
						index === currentEditingSection.index
							? { ...section, textResult: newContent }
							: section
					)
				}
			};
			await updateChatExport(updatedReport);

			setReport(updatedReport);
			setEditModalVisible(false);
			setCurrentEditingSection(null);
			setModalContent('');

			// Disable editing after saving
			if (modalEditor) {
				modalEditor.setEditable(false);
			}

			message.success('Đã lưu thay đổi thành công!');
		} catch (error) {
			console.error('❌ [ReportTiptap] Error saving section content:', error);
			message.error('Có lỗi khi lưu thay đổi: ' + error.message);
		}
	};

	const cancelEditingSection = () => {
		setEditModalVisible(false);
		setCurrentEditingSection(null);
		setModalContent('');
		// Reset modal editor content and disable editing
		if (modalEditor) {
			modalEditor.commands.setContent('');
			modalEditor.setEditable(false);
		}
	};

	const formatTimeAgo = (dateString) => {
		if (!dateString) return 'Unknown';

		try {
			const date = new Date(dateString);
			const now = new Date();
			console.log('date', date);
			console.log('now', now);
			// Check if date is valid
			if (isNaN(date.getTime())) {
				return 'Invalid date';
			}

			const diffInMs = now - date;

			// If date is in the future, show as "recently"
			if (diffInMs < 0) {
				return 'Vừa xong';
			}

			const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
			const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
			const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

			if (diffInMinutes < 1) {
				return 'Vừa xong';
			} else if (diffInMinutes < 60) {
				return `${diffInMinutes} phút trước`;
			} else if (diffInHours < 24) {
				return `${diffInHours} giờ trước`;
			} else if (diffInDays < 30) {
				return `${diffInDays} ngày trước`;
			} else {
				// For very old dates, show actual date
				return date.toLocaleDateString('vi-VN');
			}
		} catch (error) {
			console.error('Error formatting date:', error);
			return 'Invalid date';
		}
	};

	// Component to render data requirements
	const DataRequirementsDisplay = ({ dataRequirements, tables, kpi2Calculators }) => {
		if (!dataRequirements) return null;

		const kpiIds = dataRequirements.kpiSelected || [];
		const tableIds = dataRequirements.tableSelected || [];

		// Add error boundary for the entire component
		try {

			return (
				<div style={{ marginTop: '16px' }}>

					{/* Display KPI Data */}
					{kpiIds.map((kpiId, idx) => {
						const kpi = kpi2Calculators.find(k => k.id == kpiId);
						if (!kpi) {
							console.log('❌ [DataRequirementsDisplay] KPI not found:', { kpiId, availableKpis: kpi2Calculators.map(k => k.id) });
							return null;
						}

						return (
							<div key={`kpi-${kpiId}`} style={{
								margin: '0 5px 16px 5px',
								backgroundColor: '#f2f2f2',
								borderRadius: '8px',
								padding: '5px'
							}}>
								<div style={{
									padding: '8px 12px',
									borderRadius: '6px',
									marginBottom: '8px'
								}}>
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										marginBottom: '4px'
									}}>
										<span style={{
											fontWeight: '600',
											color: '#1890ff',
											fontSize: '13px'
										}}>
											{kpi.name}
										</span>
									</div>
								</div>

								{/* KPI Content Display */}
								<div style={{
									border: '1px solid #f0f0f0',
									borderRadius: '6px',
									padding: '12px',
									backgroundColor: '#fafafa',
									overflow: 'auto'
								}}>
									<KPI2ContentView
										selectedKpiId={kpiId}
										showChart={true}
										compact={true}
									/>
								</div>
							</div>
						);
					})}

					{/* Display Table Data */}
					{tableIds.map((tableId, idx) => {
						console.log('🔍 [ReportTiptap] Table ID:', tableId);
						// Find table by tableId using same logic as ReportBuilderNonPD
						let table = null;

						// Use the same logic as ReportBuilderNonPD to find fileNote by AI-compatible ID
						table = tables.find(f => {
							const versionSuffix = f.id_version && f.id_version !== 1 ? `_v${f.id_version}` : '';
							const aiCompatibleId = `${f.id_template}${versionSuffix}`;

							console.log('🔍 [ReportTiptap] Comparing AI-compatible ID:', {
								tableId,
								aiCompatibleId,
								templateId: f.id_template,
								version: f.id_version,
								matches: aiCompatibleId === tableId
							});

							return aiCompatibleId === tableId;
						});

						// If not found by AI-compatible ID, try other methods
						if (!table) {
							// Try to find by name or id directly
							table = tables.find(t =>
								t.name == tableId ||
								t.id == tableId ||
								t.id_template == tableId
							);
						}

						if (!table) {
							console.log('❌ [DataRequirementsDisplay] Table not found:', {
								tableId,
								availableTables: tables.map(t => ({
									name: t.name,
									id: t.id,
									id_template: t.id_template,
									id_version: t.id_version,
									hasRows: !!t.rows,
									rowsLength: t.rows?.length
								}))
							});
							return null;
						}


						// Generate dynamic column definitions - simplified to avoid RangeError
						const dynamicColumnDefs = Object.keys(table?.rows?.[0] || {}).map(key => {
							return {
								headerName: key,
								field: key,
								minWidth: 100,
								resizable: true,
								sortable: true,
								filter: true,
								valueFormatter: (params) => {
									if (params.value == null || params.value == undefined) {
										return '';
									}
									if (typeof params.value == 'object') {
										return JSON.stringify(params.value);
									}
									return String(params.value);
								}
							};
						});

						// Ensure table data is clean and doesn't contain circular references
						const tableData = (table.rows || []).map(row => {
							// Create a clean copy of each row to avoid circular references
							const cleanRow = {};
							Object.keys(row).forEach(key => {
								const value = row[key];
								if (value !== null && value !== undefined && typeof value !== 'object') {
									cleanRow[key] = value;
								} else if (typeof value === 'object' && value !== null) {
									// For objects, stringify them to avoid circular references
									try {
										cleanRow[key] = JSON.stringify(value);
									} catch (e) {
										cleanRow[key] = '[Complex Object]';
									}
								} else {
									cleanRow[key] = value;
								}
							});
							return cleanRow;
						});

						// Debug: Check for circular references in table data
						console.log('🔍 [DataRequirementsDisplay] Table data structure:', {
							tableId,
							tableName: table.name,
							rowsCount: tableData.length,
							firstRowKeys: tableData.length > 0 ? Object.keys(tableData[0]) : [],
							sampleRow: tableData.length > 0 ? tableData[0] : null
						});

						return (
							<div key={`table-${tableId}`} style={{
								margin: '0 5px 16px 5px',
								backgroundColor: '#f2f2f2',
								borderRadius: '8px',
								padding: '5px'
							}}>
								<div style={{
									padding: '8px 12px',
									borderRadius: '6px',
									marginBottom: '8px'
								}}>
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										marginBottom: '4px'
									}}>
										<span style={{
											fontWeight: '600',
											color: '#1890ff',
											fontSize: '13px'
										}}>
											{table.name || `Bảng ${idx + 1}`}
										</span>
									</div>
								</div>

								{/* Table Content Display */}
								{tableData.length > 0 ? (
									<div className="ag-theme-quartz" style={{
										height: '400px',
										width: '100%',
										overflow: 'hidden',
										position: 'relative'
									}}>
										{(() => {
											try {
												return (
													<AgGridReact
														statusBar={statusBar}
														suppressContextMenu={true}
														enableRangeSelection={true}
														rowData={tableData}
														columnDefs={dynamicColumnDefs}
														pagination={false}
														defaultColDef={{
															resizable: true,
															sortable: true,
															filter: true,
														}}
														onGridReady={params => {
															try {
																params.api.autoSizeAllColumns();
															} catch (error) {
																console.warn('Error in grid ready:', error);
															}
														}}
														onFirstDataRendered={params => {
															try {
																params.api.autoSizeAllColumns();
															} catch (error) {
																console.warn('Error in first data rendered:', error);
															}
														}}
														localeText={AG_GRID_LOCALE_VN}
													/>
												);
											} catch (error) {
												console.error('❌ [DataRequirementsDisplay] Error rendering AgGridReact:', error);
												return (
													<div style={{
														padding: '20px',
														textAlign: 'center',
														color: '#ff4d4f',
														border: '1px solid #ffccc7',
														borderRadius: '6px',
														backgroundColor: '#fff2f0'
													}}>
														Lỗi hiển thị bảng: {error.message}
													</div>
												);
											}
										})()}
									</div>
								) : (
									<div style={{
										padding: '20px',
										textAlign: 'center',
										color: '#999',
										fontStyle: 'italic',
										border: '1px solid #f0f0f0',
										borderRadius: '6px',
										backgroundColor: '#fafafa'
									}}>
										Không có dữ liệu trong bảng này
									</div>
								)}
							</div>
						);
					})}
				</div>
			);
		} catch (error) {
			console.error('❌ [DataRequirementsDisplay] Component error:', error);
			return (
				<div style={{
					margin: '16px 0',
					padding: '12px',
					backgroundColor: '#fff2f0',
					borderRadius: '6px',
					border: '1px solid #ffccc7',
					color: '#ff4d4f'
				}}>
					Lỗi hiển thị dữ liệu: {error.message}
				</div>
			);
		}
	};


	if (loading) {
		return (
			<div className={styles.tiptapLoading}>
				<Spin size='large' />
				<div style={{ marginTop: '16px' }}>Đang tải báo cáo...</div>
			</div>
		);
	}

	if (!report) {
		return (
			<div className={styles.emptyState}>
				<div>Không tìm thấy báo cáo</div>
			</div>
		);
	}

	if (!editor) {
		return (
			<div className={styles.tiptapLoading}>
				<Spin size='large' />
				<div style={{ marginTop: '16px' }}>Đang tải editor...</div>
			</div>
		);
	}

	return (
		<div className={styles.tiptapContainer}>
			{/* Header */}
			{/* <div className={styles.tiptapHeader}
				style={{
					padding: '10px'
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						width: '100%',
						gap: '10px'
					}}
				>
					<h3 className={styles.tiptapTitle} style={{
						color: '#696969',
						fontSize: windowWidth <= 768 ? '16px' : '18px',
						margin: '0',
						lineHeight: '1.3'
					}}>
						{report.more_info?.title || report.more_info?.quest || 'Báo cáo phân tích'}
					</h3>

					<div style={{
						display: 'flex',
						flexDirection: windowWidth <= 768 ? 'column' : 'row',
						alignItems: windowWidth <= 768 ? 'flex-start' : 'center',
						gap: windowWidth <= 768 ? '8px' : '16px',
						marginTop: '8px',
						color: '#fff',
						flexWrap: 'wrap'
					}}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<User size={windowWidth <= 768 ? 12 : 14} style={{ color: '#666', fontStyle: 'italic' }} />
							<span style={{
								fontSize: windowWidth <= 768 ? '11px' : '12px',
								color: '#666',
								fontStyle: 'italic'
							}}>
								{report.user_create || 'Unknown'}
							</span>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<Clock size={windowWidth <= 768 ? 12 : 14} style={{ color: '#666', fontStyle: 'italic' }} />
							<span style={{
								fontSize: windowWidth <= 768 ? '11px' : '12px',
								color: '#666',
								fontStyle: 'italic'
							}}>
								{formatTimeAgo(report.create_at)}
							</span>
						</div>
						{report.update_at && report.update_at !== report.create_at && (
							<div style={{
								fontSize: windowWidth <= 768 ? '11px' : '12px',
								color: '#999'
							}}>
								Cập nhật: {formatTimeAgo(report.update_at)}
							</div>
						)}
						{report?.update_at && (
							<div style={{
								fontSize: windowWidth <= 768 ? '11px' : '12px',
								color: '#999'
							}}>
								Chỉnh sửa: {formatTimeAgo(report.update_at)}
							</div>
						)}
					</div>
				</div>

				{report && !report.output_config && (
					<div className={styles.tiptapActions}>
						{!isEditMode ? (
							<Tooltip title='Chỉnh sửa báo cáo'>
								<Button
									type='primary'
									icon={<Edit2 size={windowWidth <= 768 ? 14 : 16} />}
									onClick={toggleEditMode}
									className={styles.tiptapEditButton}
									size={windowWidth <= 768 ? 'small' : 'default'}
								>
									{windowWidth <= 768 ? 'Sửa' : 'Chỉnh sửa'}
								</Button>
							</Tooltip>
						) : (
							<Tooltip title='Lưu thay đổi'>
								<Button
									type='primary'
									icon={<Save size={windowWidth <= 768 ? 14 : 16} />}
									onClick={handleSave}
									loading={isSaving}
									className={styles.tiptapSaveButton}
									size={windowWidth <= 768 ? 'small' : 'default'}
								>
									Lưu
								</Button>
							</Tooltip>
						)}
					</div>
				)}
			</div> */}

			{/* Main Content */}
			<div className={styles.tiptapSplitLayout}>

				{/* Editor Content */}
				<div className={`${styles.tiptapMainContent} ${isSidebarCollapsed ? styles.tiptapMainContentExpanded : ''}`}>
					<div className={styles.tiptapEditorContainer}>

						<div className={styles.tiptapContent} style={{ padding: '0' }}>
							{/* Mobile responsive title banner */}
							<div style={{
								fontWeight: 700,
								fontSize: windowWidth <= 768 ? '18px' : '24px',
								marginBottom: 12,
								letterSpacing: 1,
								color: '#fff',
								padding: windowWidth <= 768 ? '15px 0 15px 12px' : '20px 0 20px 15px',
								backgroundColor: '#1D5FAD',
								textAlign: windowWidth <= 768 ? 'center' : 'left'
							}}>
								BÁO CÁO PHÂN TÍCH
							</div>
							{isEditMode && (
								<ReportTiptapToolbar
									editor={editor}
									headingMenuOpen={headingMenuOpen}
									setHeadingMenuOpen={setHeadingMenuOpen}
									tableMenuOpen={tableMenuOpen}
									setTableMenuOpen={setTableMenuOpen}
									fontMenuOpen={fontMenuOpen}
									setFontMenuOpen={setFontMenuOpen}
									colorPickerMenuOpen={colorPickerMenuOpen}
									setColorPickerMenuOpen={setColorPickerMenuOpen}
									fontSizeMenuOpen={fontSizeMenuOpen}
									setFontSizeMenuOpen={setFontSizeMenuOpen}
									lineHeightMenuOpen={lineHeightMenuOpen}
									setLineHeightMenuOpen={setLineHeightMenuOpen}
								/>
							)}

							{/* Display sections from output_config or fallback to tiptapBlocks */}
							{report.output_config?.sections && report.output_config.sections.length > 0 ? (
								<div style={{
									width: '100%',
									maxWidth: '100%',
									boxSizing: 'border-box'
								}}>

									{report.output_config.sections
										.map((section, index) => (
											<div key={section.id || index} style={{
												marginBottom: windowWidth <= 768 ? '20px' : '30px',
												boxShadow: '0 0 10px 0 #d2d2d2',
												borderRadius: '3px',
												border: '1px solid #d9d9d9',
												width: '100%',
												maxWidth: '100%',
												boxSizing: 'border-box'
											}}>
												{/* Section Title with Edit Button */}
												<div style={{
													fontSize: windowWidth <= 768 ? '16px' : '20px',
													fontWeight: 'bold',
													color: '#454545',
													marginBottom: '16px',
													padding: windowWidth <= 768 ? '10px 12px' : '12px 16px',
													backgroundColor: '#f2f2f2',
													borderRadius: '3px 3px 0 0',
													borderBottom: '3px solid #d9d9d9',
													display: 'flex',
													flexDirection: windowWidth <= 768 ? 'column' : 'row',
													justifyContent: 'space-between',
													alignItems: windowWidth <= 768 ? 'flex-start' : 'center',
													gap: windowWidth <= 768 ? '8px' : '0',
													width: '100%',
													boxSizing: 'border-box'
												}}>
													<div>
														{index + 1}. {section.title}
													</div>

													{/* Edit button for output_config sections */}
													<Button
														type="text"
														size="small"
														icon={<Edit2 size={14} />}
														onClick={() => startEditingSection(index)}
														style={{ color: '#1E5FAD' }}
													>
														Chỉnh sửa
													</Button>
												</div>

												{/* Section Content - Display only */}
												{section.textResult && (
													<div
														className={styles.markedContent}
														style={{
															fontSize: windowWidth <= 768 ? '14px' : '14px',
															lineHeight: windowWidth <= 768 ? '1.5' : '1.6',
															marginBottom: '16px',
															padding: windowWidth <= 768 ? '0 12px' : '0 16px',
															width: '100%',
															maxWidth: '100%',
															boxSizing: 'border-box',
															overflowWrap: 'break-word',
															wordWrap: 'break-word'
														}}
														dangerouslySetInnerHTML={{
															__html: DOMPurify.sanitize(section.textResult)
														}}
													/>
												)}

												{/* Data Requirements - Always visible, not editable */}
												{section.dataRequirements && (
													<>
														{console.log('🔍 [ReportTiptap] Rendering data requirements for section:', {
															sectionTitle: section.title,
															dataRequirements: section.dataRequirements
														})}
														<DataRequirementsDisplay
															dataRequirements={section.dataRequirements}
															tables={approvedVersionData}
															kpi2Calculators={kpi2Calculators}
														/>
													</>
												)}
											</div>
										))}
								</div>
							) : tiptapBlocks.length > 0 ? (
								<div style={{
									width: '100%',
									maxWidth: '100%',
									boxSizing: 'border-box'
								}}>
									{tiptapBlocks.map((block, index) => (
										<div key={index} style={{
											marginBottom: windowWidth <= 768 ? '20px' : '30px',
											boxShadow: '0 0 10px 0 #d2d2d2',
											borderRadius: '3px',
											border: '1px solid #d9d9d9',
											width: '100%',
											maxWidth: '100%',
											boxSizing: 'border-box'
										}}>
											{/* Section Title with Edit Button */}
											<div style={{
												fontSize: windowWidth <= 768 ? '16px' : '20px',
												fontWeight: 'bold',
												color: '#454545',
												marginBottom: '16px',
												padding: windowWidth <= 768 ? '10px 12px' : '12px 16px',
												backgroundColor: '#f2f2f2',
												borderRadius: '3px 3px 0 0',
												borderBottom: '3px solid #d9d9d9',
												display: 'flex',
												flexDirection: windowWidth <= 768 ? 'column' : 'row',
												justifyContent: 'space-between',
												alignItems: windowWidth <= 768 ? 'flex-start' : 'center',
												gap: windowWidth <= 768 ? '8px' : '0',
												width: '100%',
												boxSizing: 'border-box'
											}}>
												<div>
													{block.order}. {block.group_name}
												</div>

												{/* Only show edit buttons when there's no output_config */}
												{!report.output_config && isEditMode && editingBlockIndex !== index && (
													<Button
														type="text"
														size="small"
														icon={<Edit2 size={14} />}
														onClick={() => startEditingBlock(index)}
														style={{ color: '#1E5FAD' }}
													>
														Chỉnh sửa
													</Button>
												)}

												{!report.output_config && editingBlockIndex == index && (
													<div style={{ display: 'flex', gap: '8px' }}>
														<Button
															type="primary"
															size="small"
															onClick={() => saveBlockContent(index)}
														>
															Lưu
														</Button>
														<Button
															size="small"
															onClick={cancelEditingBlock}
														>
															Hủy
														</Button>
													</div>
												)}

											</div>

											{/* Section Content - Editable or Display */}
											{editingBlockIndex == index ? (
												<div className={styles.tiptapContent} style={{
													padding: windowWidth <= 768 ? '12px' : '16px',
													width: '100%',
													maxWidth: '100%',
													boxSizing: 'border-box'
												}}>
													<EditorContent className={styles.editorContentWrap} editor={editor} />
												</div>
											) : (
												<div
													className={styles.markedContent}
													style={{
														fontSize: windowWidth <= 768 ? '14px' : '14px',
														lineHeight: windowWidth <= 768 ? '1.5' : '1.6',
														marginBottom: '16px',
														padding: windowWidth <= 768 ? '0 12px' : '0 16px',
														width: '100%',
														maxWidth: '100%',
														boxSizing: 'border-box',
														overflowWrap: 'break-word',
														wordWrap: 'break-word'
													}}
													dangerouslySetInnerHTML={{
														__html: DOMPurify.sanitize(block.content)
													}}
												/>
											)}

											{/* Data Requirements - Always visible, not editable */}
											{block.dataRequirements && (
												<>
													{console.log('🔍 [ReportTiptap] Rendering data requirements for block:', {
														blockTitle: block.group_name,
														dataRequirements: block.dataRequirements
													})}
													<DataRequirementsDisplay
														dataRequirements={block.dataRequirements}
														tables={approvedVersionData}
														kpi2Calculators={kpi2Calculators}
													/>
												</>
											)}
										</div>
									))}
								</div>
							) : (
								<div style={{
									width: '100%',
									maxWidth: '100%',
									boxSizing: 'border-box'
								}}>
									<EditorContent
										className={styles.editorContentWrap}
										editor={editor}
										style={{
											width: '100%',
											maxWidth: '100%',
											boxSizing: 'border-box'
										}}
									/>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Sidebar with Charts and Tables */}
				{tableBlocks.length > 0 && (
					<div className={`${styles.tiptapSidebar} ${isSidebarCollapsed ? styles.tiptapSidebarCollapsed : ''}`} style={{
						overflow: 'hidden',
						position: 'relative',
						width: windowWidth <= 768 ? '100%' : '450px',
						minWidth: windowWidth <= 768 ? '100%' : '450px'
					}}>
						{/* Collapse/Expand Button */}
						<div style={{
							position: windowWidth <= 768 ? 'static' : 'absolute',
							top: windowWidth <= 768 ? 'auto' : '10px',
							left: windowWidth <= 768 ? 'auto' : (isSidebarCollapsed ? '10px' : '10px'),
							zIndex: 10,
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							marginBottom: windowWidth <= 768 ? '12px' : '0'
						}}>
						
								<div style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '8px'
								}}>
									<Button
										type="text"
										size="small"
										icon={isSidebarCollapsed ? <ChevronLeft size={windowWidth <= 768 ? 14 : 16} /> : <ChevronRight size={windowWidth <= 768 ? 14 : 16} />}
										onClick={toggleSidebar}
										style={{
											backgroundColor: '#fff',
											border: '1px solid #d9d9d9',
											borderRadius: '4px',
											boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
											minWidth: windowWidth <= 768 ? '28px' : '32px',
											height: windowWidth <= 768 ? '28px' : '32px',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											transition: 'all 0.2s ease',
										}}
										onMouseEnter={(e) => {
											e.target.style.backgroundColor = '#f5f5f5';
											e.target.style.transform = 'scale(1.05)';
										}}
										onMouseLeave={(e) => {
											e.target.style.backgroundColor = '#fff';
											e.target.style.transform = 'scale(1)';
										}}
									/>
									{isSidebarCollapsed && (
										<div
										onClick={toggleSidebar}
										className={styles.sidebarButton}
										style={{
											backgroundColor: '#fff',
											borderRadius: '4px',
											boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
											border: '1px solid #d4d4d4',
											cursor: 'pointer',
	
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											padding: ' 5px 10px',
											width: '32px',
											height: '120px', 
											transition: 'all 0.2s ease',
										}}>
											<span style={{
												color: '696969',
												rotate: '90deg', 
												textWrap: 'nowrap',
											}}>
												PHỤ LỤC
											</span>
										</div>
									)}
									
								</div>

							{!isSidebarCollapsed && (
								<span style={{
									fontSize: windowWidth <= 768 ? '14px' : '16px',
									fontWeight: '600',
									color: '#333',
									whiteSpace: 'nowrap'
								}}>
									📋 PHỤ LỤC
								</span>
							)}
						</div>

						{/* Content area with padding to avoid overlap with button */}
						<div style={{
							paddingTop: windowWidth <= 768 ? '40px' : '50px',
							opacity: isSidebarCollapsed ? 0 : 1,
							transition: 'opacity 0.3s ease',
							pointerEvents: isSidebarCollapsed ? 'none' : 'auto',
							visibility: isSidebarCollapsed ? 'hidden' : 'visible'
						}}>
							{tableBlocks.map((tableBlock, index) => (
								<Collapse
									key={index}
									size={windowWidth <= 768 ? 'small' : 'small'}
									style={{
										marginBottom: windowWidth <= 768 ? '8px' : '12px',
										borderRadius: windowWidth <= 768 ? '6px' : '8px'
									}}
									defaultActiveKey={[`table-${index}`]}
									items={[{
										key: `table-${index}`,
										label: (
											<span style={{
												color: '#0C6DC7',
												fontSize: windowWidth <= 768 ? '12px' : '13px',
												fontWeight: '500',
												lineHeight: windowWidth <= 768 ? '1.2' : '1.4'
											}}>
												{tableBlock.content?.name || `Bảng ${index + 1}`}
											</span>
										),
										children: (
											<div>
												{tableBlock.content?.url ? (
													<TableViewer url={tableBlock.content.url} />
												) : tableBlock.tableData && Array.isArray(tableBlock.tableData) && tableBlock.tableData.length > 0 ? (
													<div
														className='ag-theme-quartz'
														style={{
															height: windowWidth <= 768 ? '250px' : '300px',
															width: '100%',
															border: '1px solid #d9d9d9',
															borderRadius: windowWidth <= 768 ? '4px' : '6px',
															overflow: 'hidden',
															position: 'relative'
														}}
													>
														<AgGridReact
															statusBar={statusBar}
															rowData={tableBlock.tableData}
															columnDefs={Object.keys(tableBlock.tableData[0] || {}).map(key => ({
																headerName: key,
																field: key,
																sortable: true,
																filter: true,
																resizable: true,
																minWidth: windowWidth <= 768 ? 80 : 100,
																valueFormatter: (params) => {
																	if (typeof params.value == 'object') {
																		return JSON.stringify(params.value);
																	}
																	return String(params.value || '');
																},
															}))}
															defaultColDef={{
																flex: 1,
																minWidth: windowWidth <= 768 ? 80 : 100,
																filter: true,
																sortable: true,
																resizable: true,
															}}
															onGridReady={params => {
																try {
																	params.api.autoSizeAllColumns();
																} catch (error) {
																	console.warn('Error in grid ready:', error);
																}
															}}
															onFirstDataRendered={params => {
																try {
																	params.api.autoSizeAllColumns();
																} catch (error) {
																	console.warn('Error in first data rendered:', error);
																}
															}}
															enableRangeSelection={true}
															rowSelection='multiple'
															suppressMenuHide={true}
															suppressRowClickSelection={true}
															headerHeight={35}
															rowHeight={30}
															localeText={AG_GRID_LOCALE_VN}
														/>
													</div>
												) : (
													<div style={{
														padding: '20px',
														textAlign: 'center',
														color: '#666',
														fontSize: '12px',
													}}>
														Không có dữ liệu bảng
													</div>
												)}
											</div>
										),
									}]}
									expandIconPosition='end'
									ghost
								/>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Edit Section Modal */}
			<Modal
				title={`Chỉnh sửa: ${currentEditingSection?.title || 'Nội dung'}`}
				open={editModalVisible}
				onOk={saveSectionContent}
				onCancel={cancelEditingSection}
				width={800}
				okText="Lưu"
				cancelText="Hủy"
			>
				<div style={{ marginBottom: '16px' }}>
					<div style={{
						fontSize: '14px',
						color: '#666',
						marginBottom: '8px',
						fontWeight: '500'
					}}>
						Nội dung:
					</div>
					<div style={{
						borderRadius: '6px',
						border: '1px solid #d9d9d9',
						overflow: 'hidden'
					}}>
						{modalEditor && (
							<>
								{/* Toolbar */}
								<div style={{
									borderBottom: '1px solid #d9d9d9',
									backgroundColor: '#fafafa'
								}}>
									<ReportTiptapToolbar
										editor={modalEditor}
										headingMenuOpen={headingMenuOpen}
										setHeadingMenuOpen={setHeadingMenuOpen}
										tableMenuOpen={tableMenuOpen}
										setTableMenuOpen={setTableMenuOpen}
										fontMenuOpen={fontMenuOpen}
										setFontMenuOpen={setFontMenuOpen}
										colorPickerMenuOpen={colorPickerMenuOpen}
										setColorPickerMenuOpen={setColorPickerMenuOpen}
										fontSizeMenuOpen={fontSizeMenuOpen}
										setFontSizeMenuOpen={setFontSizeMenuOpen}
										lineHeightMenuOpen={lineHeightMenuOpen}
										setLineHeightMenuOpen={setLineHeightMenuOpen}
									/>
								</div>

								{/* Editor Content */}
								<div style={{
									padding: '12px 20px',
									height: '320px',
									overflowY: 'auto'
								}}>
									<EditorContent
										editor={modalEditor}
										style={{
											height: '100%',
											width: '100%',
										}}
									/>
								</div>
							</>
						)}
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default ReportTiptapViewer; 
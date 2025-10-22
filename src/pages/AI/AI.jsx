import { useContext, useEffect, useMemo, useState } from 'react';
import { getAllFileNotePad } from '../../apis/fileNotePadService.jsx';
import { getTemplateByFileNoteId, getTemplateColumn, getTemplateInfoByTableId, getTemplateRow } from '../../apis/templateSettingService.jsx';
import { getAllApprovedVersion, getApprovedVersionDataById } from '../../apis/approvedVersionTemp.jsx';
import { Button, Card, Dropdown, Input, List, Popconfirm, Spin, Tooltip, Switch, Checkbox, Radio } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import css from './AI.module.css';
import DataModal from './DataModal';
import { defaultMessage1, defaultMessage2, defaultMessage3 } from './default.js';
import AIForm from './AIForm';
import { createSetting, getSettingByType, updateSetting } from '../../apis/settingService.jsx';
import { Ellipsis, History, Send, Trash2, PlusCircle } from 'lucide-react';
import { analyzeData, analyzeData2, analyzeDataFinal, drawChart } from '../../apis/botService.jsx';
import { createChatHistory, deleteChatHistory, getAllChatHistory } from '../../apis/aiChatHistoryService.jsx';
import { MODEL_AI_LIST } from '../../CONST.js';
import { MyContext } from '../../MyContext.jsx';
import { loadAndMergeData } from '../Canvas/Daas/Content/Template/SettingCombine/logicCombine.js';
import AG_GRID_LOCALE_VN from '../Home/AgridTable/locale.jsx';
import ChartComponent from './ChartComponent.jsx';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { ChatBotFile } from '../Canvas/ChatBot/ChatBotFile.jsx';
import { dataTestAI3 } from '../../../data.js';
import { updateChatHistory } from '../../apis/aiChatHistoryService';
import SaveAnalysisModal from './SaveAnalysisModal';
import ManualConfigModal from './ManualConfigModal';
import { getTemplateSettingAIReportBuilderById } from '../../apis/templateSettingAIReportBuilder.jsx';
import TemplateModal from './AITemplateQuestion/TemplateModal.jsx';
import { log } from 'mathjs';
import Loading3DTower from '../../components/Loading3DTower';

const formatNumber = (num) => {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + 'm';
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + 'k';
	}
	return num.toString();
};

let processDataDefault = {};
let resultDefault = 'Kết quả AI trả lời';

// Add queue system
const analyzeQueue = [];
let isProcessingQueue = false;

export default function AI({ onQueueLengthChange, }) {
	const { currentUser, listUC_CANVAS, uCSelected_CANVAS } = useContext(MyContext);
	const [fileNotesFull, setFileNotesFull] = useState([]);
	const [fileNotes, setFileNotes] = useState([]);
	const [allFileNotes, setAllFileNotes] = useState([]);
	const [dataAI1, setDataAI1] = useState([]);
	const [prompt, setPrompt] = useState('');
	const [result, setResult] = useState(resultDefault);
	const [isLoading, setIsLoading] = useState(false);
	const [filteredData, setFilteredData] = useState(processDataDefault);
	const [selectedId, setSelectedId] = useState(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [formModalOpen, setFormModalOpen] = useState(false);
	const [selectedFileNote, setSelectedFileNote] = useState(null);
	const [checkedItems, setCheckedItems] = useState([]);
	const [systemMessage1, setSystemMessage1] = useState(defaultMessage1);
	const [systemMessage2, setSystemMessage2] = useState(defaultMessage2);
	const [systemMessage3, setSystemMessage3] = useState(defaultMessage3);
	const [model1, setModel1] = useState(MODEL_AI_LIST[0].value);
	const [model2, setModel2] = useState(MODEL_AI_LIST[0].value);
	const [model3, setModel3] = useState(MODEL_AI_LIST[0].value);
	const [chatHistory, setChatHistory] = useState([]);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [selectedHistoryId, setSelectedHistoryId] = useState(null);
	const [viewingData, setViewingData] = useState(filteredData);
	const [usedDataIds, setUsedDataIds] = useState([]);
	const [modelToken1, setModelToken1] = useState('');
	const [modelToken2, setModelToken2] = useState('');
	const [modelToken3, setModelToken3] = useState('');
	const [totalToken, setTotalToken] = useState(0);
	const [data, setData] = useState([]);
	const [chartConfig, setChartConfig] = useState(null);
	const [usePivotConfig, setUsePivotConfig] = useState(false);
	const [useCreateChart, setUseCreateChart] = useState(false);
	const [contextMenuPosition, setContextMenuPosition] = useState(null);
	const [templateModalOpen, setTemplateModalOpen] = useState(false);
	const [queueLength, setQueueLength] = useState(0);
	const [pdfModal, setPDFModal] = useState(false);
	const [selectedQueueItem, setSelectedQueueItem] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState(result);
	const [saveModalOpen, setSaveModalOpen] = useState(false);
	const [isStatusFilter, setIsStatusFilter] = useState(false);
	const [showChart, setShowChart] = useState(false);
	const [showDataBox, setShowDataBox] = useState(false);
	const [multipleCharts, setMultipleCharts] = useState([]);
	const [promptDecs, setPromptDecs] = useState('');
	const [questSetting, setQuestSetting] = useState(null);
	const statusBar = useMemo(() => ({
		statusPanels: [{
			statusPanel: 'agAggregationComponent',
			statusPanelParams: {
				aggFuncs: ['count', 'sum'], // Only show average, count, and sum
			},
		}],
	}), []);

	const filter = useMemo(() => {
		if (isStatusFilter) {
			return {
				filter: 'agMultiColumnFilter',
				floatingFilter: true,
				filterParams: {
					filters: [
						{ filter: 'agTextColumnFilter' },
						{ filter: 'agSetColumnFilter' },
					],
				},
			};
		}
		return {};
	}, [isStatusFilter]);

	useEffect(() => {
			loadData();
		
	}, [listUC_CANVAS, uCSelected_CANVAS, currentUser]);

	useEffect(() => {
	
			loadSystemMessages();
			loadChatHistory();
	
	}, []);

	useEffect(() => {
		if (onQueueLengthChange) {
			onQueueLengthChange(queueLength);
		}
	}, [queueLength, onQueueLengthChange]);

	const filterFileNotes = (notes, checkedIds) => {
		return notes.filter(item =>
			item.rows.length > 0 &&
			checkedIds.some(id => id == item.id),
		);
	};

	const mapToDataAICheck = (notes) => {
		return notes.map(item => ({
			id: item.id, // Sử dụng approved version ID: "13_v2", "11_v3", etc.
			name: item.name,
			tab: item.tab,
			created_at: item.created_at,
			rowDemo: item.rowDemo,
			description: item.desc,
			mother_table_id: item.mother_table_id,
			table_id: item.table_id,
			// Thêm metadata để AI2 hiểu context
			version_info: `Version ${item.id_version || 'base'} of template ${item.table_id}`,
			fileNoteName: item.fileNoteName
		}));
	};

	const updateFilteredStates = (notes, checkedIds) => {
		const filteredNotes = filterFileNotes(notes, checkedIds);
		const dataAICheck = mapToDataAICheck(filteredNotes);
		setFileNotes(filteredNotes);
		setDataAI1(dataAICheck);
		console.log('📊 DataAI1 updated:', dataAICheck.map(item => ({ id: item.id, name: item.name })));
	};


	const handleFileNoteUpdate = (updatedNote) => {
		setSelectedFileNote(updatedNote);
		// Update in fileNotesFull
		setFileNotesFull(prev =>
			prev.map(note =>
				note.id === updatedNote.id ? updatedNote : note,
			),
		);
		// Update in fileNotes if it exists there
		setFileNotes(prev =>
			prev.map(note =>
				note.id === updatedNote.id ? updatedNote : note,
			),
		);
		// Update in dataAI1
		setDataAI1(prev =>
			prev.map(item =>
				item.id === updatedNote.id ? {
					...item,
					description: updatedNote.desc,
				} : item,
			),
		);
	};

	async function loadData() {
		try {
			// Get approved version data like in DataTab.jsx
			const allData = await getAllApprovedVersion();
			// Filter data where apps includes 'ai-document' or 'ai' for AI functionality
			console.log('allData', allData);
			let approvedVersionData = allData.filter(item => 
				(Array.isArray(item.apps) && (item.apps?.includes('analysis-review')))
			);

			// Set basic file notes data
			setAllFileNotes(approvedVersionData.filter(e => e?.id));
			// Process approved version data to get template information
			let fileNotes = [];
			console.log('approvedVersionData', approvedVersionData);
			for (let approvedItem of approvedVersionData) {
				try {
					let detailData = await getTemplateInfoByTableId(approvedItem.id_template);
					// Use data directly from approvedVersionData - no need for additional API calls
					const versionNumber = approvedItem.id_version; // null means base version
					const versionLabel = versionNumber === null ? 'base' : `v${versionNumber}`;
					
					// Create fileNote object for this specific approved version
					let fileNote = {
						id: `${approvedItem.id}_${versionLabel}`,
						originalId: approvedItem.id,
						name: `${approvedItem.name} (${versionLabel})`,
						table: 'Template',
						id_version: versionNumber,
						fileNote_id: approvedItem.id_fileNote,
						fileNoteName: approvedItem.fileNoteName,
						apps: approvedItem.apps,
						userClass: [], // Can be filled if needed
						table_id: approvedItem.id_template,
						isCombine: false, // Will be updated if needed
						mother_table_id: null // Will be updated if needed
					};

					console.log(`Processing: ${fileNote.name} - template_id: ${approvedItem.id_template}, version: ${versionNumber}`);

					// Get rows for this specific version from the template
			
					let rowsResponse = await getTemplateRow(approvedItem.id_template, versionNumber);
					let rows = rowsResponse.rows || [];
					// Get columns for this specific version  
					const columnNames = detailData.versions[versionNumber].columns;
					
					// Filter row data to only include the columns for this version
					rows = (rows || []).map(rowObj => {
						const filtered = {};
						for (const key of columnNames) {
							if (rowObj.data && rowObj.data.hasOwnProperty(key)) {
								filtered[key] = rowObj.data[key];
							}
						}
						return filtered;
					});
					console.log('rows', rows);
					fileNote.rows = rows || [];
					fileNote.versionColumns = columnNames;
					
					// Create demo data (shuffled sample)
					const shuffled = [...(rows || [])].sort(() => 0.5 - Math.random());
					fileNote.rowDemo = shuffled.slice(0, 30);
					
					// Only add if has data
					if (fileNote.rows.length > 0) {
						fileNotes.push(fileNote);
						console.log(`✅ Added fileNote: ${fileNote.name} with ${fileNote.rows.length} rows`);
					} else {
						console.log(`❌ Skipped fileNote: ${fileNote.name} - no data`);
					}
				} catch (error) {
					console.error(`Error processing approved version ${approvedItem.id}:`, error);
					// Continue with next item even if one fails
				}
			}
			console.log('Final fileNotes:', fileNotes);

			const filteredFullNotes = fileNotes.filter(item =>
				(item.rows && item.rows.length > 0) ||
				item.isCombine ||
				item.mother_table_id,
			);

			const settings = await getSettingByType('FILE_NOTE_FOR_AI');
			if (settings) {
				setCheckedItems(settings.setting);
				updateFilteredStates(filteredFullNotes, settings.setting);
				console.log('✅ Settings loaded and filtered states updated');
				console.log('✅ Checked items:', settings.setting);
			} else {
				console.log('⚠️ No FILE_NOTE_FOR_AI settings found');
			}

			const selectedUC = listUC_CANVAS.find(uc => uc.id === uCSelected_CANVAS);
			const selectedId = selectedUC?.id;

			const filteredNotesByUC = selectedId
				? filteredFullNotes.filter(note =>
					Array.isArray(note.userClass) && note.userClass.includes(selectedId),
				)
				: [];

			setFileNotesFull(currentUser?.isAdmin ? filteredFullNotes : filteredNotesByUC);
		} catch (error) {
			console.error('Error loading data:', error);
			// Fallback to original method if new method fails
			console.log('Falling back to original data loading method...');
			await loadDataOriginal();
		}
	}

	// Keep original method as fallback
	async function loadDataOriginal() {
		let fileNotes = await getAllFileNotePad();
		setAllFileNotes(fileNotes.filter(e => e?.table));
		fileNotes = fileNotes.filter(item => item.table === 'Template');

		for (let fileNote of fileNotes) {
			let table = await getTemplateByFileNoteId(fileNote.id);
			if (table && table[0]) {
				let columns = [];
				fileNote.isCombine = table[0].isCombine;
				fileNote.mother_table_id = table[0].mother_table_id;
				fileNote.table_id = table[0].id;
				let rowsResponse = await getTemplateRow(table[0].id);
				let rows = rowsResponse.rows || [];
				if (table[0].isCombine) {
					rows = await loadAndMergeData(table[0]);
				} else {
					columns = await getTemplateColumn(table[0].id);
					const columnNames = columns.map(col => col.columnName);
					rows = rows.map(rowObj => {
						const filtered = {};
						for (const key of columnNames) {
							if (rowObj.data && rowObj.data.hasOwnProperty(key)) {
								filtered[key] = rowObj.data[key];
							}
						}
						return filtered;
					});
				}
				const rowData = table[0].isCombine ? rows : rows;
				fileNote.rows = rowData;
				const shuffled = [...rowData].sort(() => 0.5 - Math.random());
				fileNote.rowDemo = shuffled.slice(0, 30);
			}
		}
		const filteredFullNotes = fileNotes.filter(item =>
			item.rows.length > 0 ||
			item.isCombine ||
			item.mother_table_id,
		);
		const settings = await getSettingByType('FILE_NOTE_FOR_AI');
		if (settings) {
			setCheckedItems(settings.setting);
			updateFilteredStates(filteredFullNotes, settings.setting);
		}

		const selectedUC = listUC_CANVAS.find(uc => uc.id === uCSelected_CANVAS);
		const selectedId = selectedUC?.id;

		const filteredNotesByUC = selectedId
			? filteredFullNotes.filter(note =>
				Array.isArray(note.userClass) && note.userClass.includes(selectedId),
			)
			: [];

		setFileNotesFull(currentUser?.isAdmin ? filteredFullNotes : filteredNotesByUC);
	}

	useEffect(() => {
		loadChatHistory();
	}, [currentUser]);

	useEffect(() => {
		setEditedContent(result);
	}, [result]);

	useEffect(() => {
		if (selectedId) {
			const fileNote = fileNotesFull.find(note => note.id === selectedId);
			setSelectedFileNote(fileNote);
		} else {
			setSelectedFileNote(null);
		}
	}, [selectedId, fileNotesFull]);

	const loadSystemMessages = async () => {
		try {
			const message1 = await getSettingByType('SYSTEM_MESSAGE_1');
			if (message1) setSystemMessage1(message1.setting);
			const message2 = await getSettingByType('SYSTEM_MESSAGE_2');
			if (message2) setSystemMessage2(message2.setting);
			const message3 = await getSettingByType('SYSTEM_MESSAGE_3');
			if (message3) setSystemMessage3(message3.setting);
			const bot1 = await getSettingByType('MODEL_AI_1');
			if (bot1) setModel1(bot1.setting);
			const bot2 = await getSettingByType('MODEL_AI_2');
			if (bot2) setModel2(bot2.setting);
			const bot3 = await getSettingByType('MODEL_AI_3');
			if (bot3) setModel3(bot3.setting);
		} catch (error) {
			console.error('Error loading system messages:', error);
		}
	};

	const loadChatHistory = async () => {
		try {
			setLoadingHistory(true);
			const history = await getAllChatHistory();
			setChatHistory(history.filter(item => item.userCreated === currentUser?.email));
		} catch (error) {
			console.error('Error loading chat history:', error);
		} finally {
			setLoadingHistory(false);
		}
	};

	// When user selects a history item, fill prompt/result and update viewingData immediately
	const handleSelectHistory = (item) => {
		if (!item) {
			setPrompt('');
			setResult('');
			setModelToken1('');
			setModelToken2('');
			setModelToken3('');
			setSelectedHistoryId(null);
			setViewingData(filteredData);
			setUsedDataIds([]);
			setSelectedQueueItem(null);
			setData([]); // Clear chart data
			setChartConfig(null); // Clear chart config
			setMultipleCharts([]); // Clear multiple charts
			return;
		}
		setPrompt(item.quest);
		setResult(item.result);
		setData(item.chartData);
		setChartConfig(item.chartConfig);
		setSelectedHistoryId(item.id);
		setSelectedQueueItem(null);


		if (chartConfig) {
			setShowChart(true);
		}

		// Khôi phục cấu hình của các chart từ lịch sử
		if (item.more_info?.multipleCharts && Array.isArray(item.more_info.multipleCharts)) {
			setMultipleCharts(item.more_info.multipleCharts);
		} else {
			setMultipleCharts([]); // Clear multiple charts for history items
		}

		setModelToken1((item.token2 || '') + ' ' + (item.model2 || ''));
		setModelToken2((item.token3 || '') + ' ' + (item.model3 || ''));
		setModelToken3((item.token4 || '') + ' ' + (item.model4 || ''));
		setTotalToken((item.token2 || 0) + (item.token3 || 0) + (item.token4 || 0));
		const status = getShowChartStatus(item.id);
		setShowChart(status.showChart);
		setShowDataBox(status.showDataBox);
		if (item.more_info?.filteredData) {
			// Khôi phục dữ liệu và mô tả bảng
			const filteredData = item.more_info.filteredData;
			if (item.more_info?.tableDescriptions) {
				filteredData._descriptions = item.more_info.tableDescriptions;
			}
			setViewingData(filteredData);
		} else {
			setViewingData(filteredData);
		}
		if (item.more_info?.used_data) {
			setUsedDataIds(item.more_info.used_data);
		} else {
			setUsedDataIds([]);
		}
	};

	function saveShowChartStatus(historyId, showChart, showDataBox) {
		localStorage.setItem(
			`showChartStatus_${historyId}`,
			JSON.stringify({ showChart, showDataBox }),
		);
	}

	function getShowChartStatus(historyId) {
		const value = localStorage.getItem(`showChartStatus_${historyId}`);
		if (value !== null) {
			const { showChart, showDataBox } = JSON.parse(value);
			return { showChart, showDataBox };
		}
		return { showChart: true, showDataBox: false };
	}

	// When user edits prompt or sends new, clear selection
	const handlePromptChange = (e) => {
		setPrompt(e.target.value);
		setSelectedHistoryId(null);
		setSelectedQueueItem(null);
		setMultipleCharts([]); // Clear multiple charts
	};

	const isRowEmpty = (row) => {
		if (!row || typeof row !== 'object') return true;
		return Object.values(row).every(
			val => val === '' || val === 0 || val === null || val === undefined,
		);
	};

	// Helper function to apply filter operations
	const applyFilter = (rowValue, filterConfig) => {
		const { operator, value } = filterConfig;

		// Handle null checks first
		if (operator === 'is_null') {
			return rowValue === null || rowValue === undefined || rowValue === '';
		}
		if (operator === 'is_not_null') {
			return rowValue !== null && rowValue !== undefined && rowValue !== '';
		}

		// Convert rowValue to appropriate type for comparison
		const numericRowValue = !isNaN(rowValue) ? Number(rowValue) : rowValue;
		const stringRowValue = String(rowValue || '').toLowerCase();

		switch (operator) {
			case 'equals':
				const numericValue = !isNaN(value) ? Number(value) : value;
				return numericRowValue === numericValue;

			case 'not_equals':
				const numericValue2 = !isNaN(value) ? Number(value) : value;
				return numericRowValue !== numericValue2;

			case 'greater_than':
				return numericRowValue > Number(value);

			case 'less_than':
				return numericRowValue < Number(value);

			case 'greater_equal':
				return numericRowValue >= Number(value);

			case 'less_equal':
				return numericRowValue <= Number(value);

			case 'contains':
				return stringRowValue.includes(String(value).toLowerCase());

			case 'not_contains':
				return !stringRowValue.includes(String(value).toLowerCase());

			case 'starts_with':
				return stringRowValue.startsWith(String(value).toLowerCase());

			case 'ends_with':
				return stringRowValue.endsWith(String(value).toLowerCase());

			case 'in':
				const valueList = String(value).split(',').map(v => v.trim());
				return valueList.some(v => {
					const numericV = !isNaN(v) ? Number(v) : v;
					return numericRowValue === numericV;
				});

			case 'not_in':
				const valueList2 = String(value).split(',').map(v => v.trim());
				return !valueList2.some(v => {
					const numericV = !isNaN(v) ? Number(v) : v;
					return numericRowValue === numericV;
				});

			default:
				return true; // Default to include if operator is not recognized
		}
	};

	// Hàm tạo tên mô tả có ý nghĩa cho bảng
	const generateTableDescription = (fileNote, config, configIndex) => {
		if (!config) {
			return `Dữ liệu ${fileNote.name}`;
		}

		let description = '';

		// Xác định loại thao tác
		switch (config.type) {
			case 'aggregation':
				if (config.operation && config.target_column) {
					const operationNames = {
						'sum': 'Tổng',
						'average': 'Trung bình',
						'count': 'Số lượng',
						'max': 'Giá trị lớn nhất',
						'min': 'Giá trị nhỏ nhất',
					};

					const operationName = operationNames[config.operation] || config.operation;

					if (config.group_by && config.group_by.length > 0) {
						description = `${operationName} ${config.target_column} theo ${config.group_by.join(', ')}`;
					} else {
						description = `${operationName} ${config.target_column}`;
					}
				}
				break;

			case 'ranking':
				if (config.operation && config.target_column) {
					const rankingNames = {
						'top_n': 'Top',
						'bottom_n': 'Bottom',
					};

					const rankingName = rankingNames[config.ranking_type] || 'Ranking';
					const limit = config.limit || 'N';

					if (config.group_by && config.group_by.length > 0) {
						description = `${rankingName} ${limit} ${config.target_column} theo ${config.group_by.join(', ')}`;
					} else {
						description = `${rankingName} ${limit} ${config.target_column}`;
					}
				}
				break;

			case 'filter':
				if (config.operation === 'distinct' && config.group_by) {
					description = `Dữ liệu duy nhất theo ${config.group_by.join(', ')}`;
				} else {
					description = `Dữ liệu đã lọc`;
				}
				break;

			default:
				description = `Dữ liệu ${fileNote.name}`;
		}

		return `${description} (${fileNote.name})`;
	};

	const processDataWithAnalysisConfigs = (fileNotes, result) => {
		let transformedData = {};
		let tableDescriptions = {}; // Lưu mô tả cho từng bảng

		if (result && result.matched_ids) {
			let tableCounter = 1; // Global counter for unique table names
			
			result.matched_ids.forEach(id => {
				// Direct lookup using approved version ID
				// ID format: "13_v2", "11_v3", "10_v2" etc.
				const fileNote = fileNotes.find(note => note.id === id);
				
				if (fileNote) {
					console.log(`Processing approved version: ${fileNote.id} (${fileNote.name})`);
					console.log(`Using data from template ${fileNote.table_id}, version ${fileNote.id_version}`);
					const usefulColumns = result.useful_columns || [];
					let cleanedRows = fileNote.rows.map(row => {
						const cleanedRow = {};
						usefulColumns.forEach(column => {
							if (column in row) {
								cleanedRow[column] = row[column];
							}
						});
						return cleanedRow;
					});

					// Remove empty rows
					cleanedRows = cleanedRows.filter(row => !isRowEmpty(row));

					// Apply filters if they exist
					if (result.filters && result.filters[id] && result.filters[id].conditions) {
						const conditions = result.filters[id].conditions;
						cleanedRows = cleanedRows.filter(row => {
							return Object.entries(conditions).every(([key, filterConfig]) => {
								const rowValue = row[key];

								// Handle both old format (simple value) and new format (object with operator)
								if (typeof filterConfig === 'object' && filterConfig.operator) {
									return applyFilter(rowValue, filterConfig);
								} else {
									// Backward compatibility with old format
									const rowValueForCompare = !isNaN(rowValue) ? Number(rowValue) : rowValue;
									if (Array.isArray(filterConfig)) {
										return filterConfig.some(v => {
											const arrayValue = !isNaN(v) ? Number(v) : v;
											return arrayValue === rowValueForCompare;
										});
									}
									const conditionValue = !isNaN(filterConfig) ? Number(filterConfig) : filterConfig;
									return conditionValue === rowValueForCompare;
								}
							});
						});
					}

					// Process analysis_configs if they exist
					if (result.analysis_configs && result.analysis_configs.length > 0) {
						result.analysis_configs.forEach((config, configIndex) => {
							if (config.dataset === id) {
								// Apply config-specific filters
								let filteredRows = cleanedRows;
								if (config.filters && Object.keys(config.filters).length > 0) {
									filteredRows = cleanedRows.filter(row => {
										return Object.entries(config.filters).every(([key, filterConfig]) => {
											const rowValue = row[key];

											// Handle both old format (simple value) and new format (object with operator)
											if (typeof filterConfig === 'object' && filterConfig.operator) {
												return applyFilter(rowValue, filterConfig);
											} else {
												// Backward compatibility with old format
												const rowValueForCompare = !isNaN(rowValue) ? Number(rowValue) : rowValue;
												if (Array.isArray(filterConfig)) {
													return filterConfig.some(v => {
														const arrayValue = !isNaN(v) ? Number(v) : v;
														return arrayValue === rowValueForCompare;
													});
												}
												const conditionValue = !isNaN(filterConfig) ? Number(filterConfig) : filterConfig;
												return conditionValue === rowValueForCompare;
											}
										});
									});
								}

								// Handle different types of operations
								if (config.type === 'aggregation' && config.operation && config.target_column) {
									if (config.group_by && config.group_by.length > 0) {
										// Group by aggregation
										const groupedData = {};
										filteredRows.forEach(row => {
											const groupKey = config.group_by.map(col => row[col]).join('|');
											if (!groupedData[groupKey]) {
												groupedData[groupKey] = {
													...config.group_by.reduce((acc, col) => {
														acc[col] = row[col];
														return acc;
													}, {}),
													[config.target_column]: 0,
													count: 0,
												};
											}

											const value = parseFloat(row[config.target_column]) || 0;
											groupedData[groupKey][config.target_column] += value;
											groupedData[groupKey].count += 1;
										});

										// Convert to array and apply final operation
										const aggregatedRows = Object.values(groupedData).map(group => {
											const result = { ...group };
											delete result.count;

											// Apply specific operation if needed
											if (config.operation === 'average') {
												result[config.target_column] = group.count > 0 ?
													result[config.target_column] / group.count : 0;
											}

											return result;
										});

																			// Tạo tên bảng ngắn gọn với approved version suffix
									const tableName = `Table${tableCounter}`;
									const tableDescription = `${generateTableDescription(fileNote, config, configIndex)} (${fileNote.name})`;
									transformedData[tableName] = aggregatedRows;
									tableDescriptions[tableName] = tableDescription;
									tableCounter++;
									} else {
										// Simple aggregation without grouping
										let aggregatedValue = 0;
										filteredRows.forEach(row => {
											const value = parseFloat(row[config.target_column]) || 0;
											switch (config.operation) {
												case 'sum':
													aggregatedValue += value;
													break;
												case 'average':
													aggregatedValue += value;
													break;
												case 'count':
													aggregatedValue += 1;
													break;
												case 'max':
													aggregatedValue = Math.max(aggregatedValue, value);
													break;
												case 'min':
													aggregatedValue = Math.min(aggregatedValue, value);
													break;
												default:
													aggregatedValue += value;
											}
										});

										if (config.operation === 'average' && filteredRows.length > 0) {
											aggregatedValue = aggregatedValue / filteredRows.length;
										}

										const tableName = `Table${tableCounter}`;
										const tableDescription = `${generateTableDescription(fileNote, config, configIndex)} (${fileNote.name})`;
										transformedData[tableName] = [{
											[config.target_column]: aggregatedValue,
											operation: config.operation,
											record_count: filteredRows.length,
										}];
										tableDescriptions[tableName] = tableDescription;
										tableCounter++;
									}
								} else if (config.type === 'ranking' && config.operation && config.target_column) {
									// Handle ranking operations - first aggregate, then rank
									if (config.group_by && config.group_by.length > 0) {
										// First, group by and aggregate the target column based on operation
										const groupedData = {};
										filteredRows.forEach(row => {
											const groupKey = config.group_by.map(col => row[col]).join('|');
											if (!groupedData[groupKey]) {
												groupedData[groupKey] = {
													...config.group_by.reduce((acc, col) => {
														acc[col] = row[col];
														return acc;
													}, {}),
													[config.target_column]: 0,
													count: 0,
												};
											}

											const value = parseFloat(row[config.target_column]) || 0;
											groupedData[groupKey][config.target_column] += value;
											groupedData[groupKey].count += 1;
										});

										// Convert grouped data to array and apply final operation
										const aggregatedGroups = Object.values(groupedData).map(group => {
											const result = { ...group };
											delete result.count;

											// Apply specific operation if needed
											if (config.operation === 'average') {
												result[config.target_column] = group.count > 0 ?
													result[config.target_column] / group.count : 0;
											}

											return result;
										});

										// Sort by target column (top_n = descending, bottom_n = ascending)
										const sortedGroups = aggregatedGroups.sort((a, b) => {
											const aValue = parseFloat(a[config.target_column]) || 0;
											const bValue = parseFloat(b[config.target_column]) || 0;
											return config.ranking_type === 'top_n' ? bValue - aValue : aValue - bValue;
										});

										// Apply limit to number of groups
										const limit = config.limit || sortedGroups.length;
										const limitedGroups = sortedGroups.slice(0, limit);

										const tableName = `Table${tableCounter}`;
										const tableDescription = `${generateTableDescription(fileNote, config, configIndex)} (${fileNote.name})`;
										transformedData[tableName] = limitedGroups;
										tableDescriptions[tableName] = tableDescription;
										tableCounter++;
									} else {
										// Simple ranking without grouping - first aggregate, then rank
										let aggregatedValue = 0;
										filteredRows.forEach(row => {
											const value = parseFloat(row[config.target_column]) || 0;
											switch (config.operation) {
												case 'sum':
													aggregatedValue += value;
													break;
												case 'average':
													aggregatedValue += value;
													break;
												case 'count':
													aggregatedValue += 1;
													break;
												default:
													aggregatedValue += value;
											}
										});

										if (config.operation === 'average' && filteredRows.length > 0) {
											aggregatedValue = aggregatedValue / filteredRows.length;
										}

										const tableName = `Table${tableCounter}`;
										const tableDescription = `${generateTableDescription(fileNote, config, configIndex)} (${fileNote.name})`;
										transformedData[tableName] = [{
											[config.target_column]: aggregatedValue,
											operation: config.operation,
											record_count: filteredRows.length,
										}];
										tableDescriptions[tableName] = tableDescription;
										tableCounter++;
									}
								} else if (config.type === 'filter' && config.operation) {
									// Handle filter operations
									let filteredResult = filteredRows;

									if (config.operation === 'distinct' && config.group_by) {
										// Get distinct values based on group_by columns
										const distinctMap = new Map();
										filteredRows.forEach(row => {
											const key = config.group_by.map(col => row[col]).join('|');
											if (!distinctMap.has(key)) {
												distinctMap.set(key, row);
											}
										});
										filteredResult = Array.from(distinctMap.values());
									}

									// Apply limit if specified
									if (config.limit && filteredResult.length > config.limit) {
										filteredResult = filteredResult.slice(0, config.limit);
									}

									const tableName = `Table${tableCounter}`;
									const tableDescription = `${generateTableDescription(fileNote, config, configIndex)} (${fileNote.name})`;
									transformedData[tableName] = filteredResult;
									tableDescriptions[tableName] = tableDescription;
									tableCounter++;
								} else {
									// No specific operation, just return filtered data
									let resultData = filteredRows;

									// Apply limit if specified
									if (config.limit && resultData.length > config.limit) {
										resultData = resultData.slice(0, config.limit);
									}

									const tableName = `Table${tableCounter}`;
									const tableDescription = `${generateTableDescription(fileNote, config, configIndex)} (${fileNote.name})`;
									transformedData[tableName] = resultData;
									tableDescriptions[tableName] = tableDescription;
									tableCounter++;
								}
							}
						});
					} else {
						// No analysis_configs, return original filtered data
						const tableName = `Table${tableCounter}`;
						const tableDescription = `${generateTableDescription(fileNote, null, 0)} (${fileNote.name})`;
						transformedData[tableName] = cleanedRows;
						tableDescriptions[tableName] = tableDescription;
						tableCounter++;
					}
				}
			});
		}

		// Lưu mô tả bảng vào transformedData để sử dụng sau
		transformedData._descriptions = tableDescriptions;

		return transformedData;
	};

	// Add new function to process queue
	const processQueue = async () => {
		if (isProcessingQueue || analyzeQueue.length === 0) return;

		isProcessingQueue = true;
		const { prompt, sm1, sm2, sm3, m1, m2, m3, questSetting } = analyzeQueue[0];

		try {
			setIsLoading(false);
			setSelectedQueueItem(analyzeQueue[0]);
			setSelectedHistoryId(null);
			setViewingData({});

			// --- LOGIC MỚI: Nếu có manualConfigEnabled ---
			if (questSetting?.manualConfigEnabled && Array.isArray(questSetting.manualConfigs)) {
				// Lấy giá trị từ state thay vì từ queue item để tránh lỗi initialization
				let currentSm1 = systemMessage1;
				let currentSm2 = systemMessage2;
				let currentSm3 = systemMessage3;
				let currentM1 = model1;
				let currentM2 = model2;
				let currentM3 = model3;
				
				// 1. Tạo dữ liệu đầu vào cho AI 3 từ manualConfigs
				let transformedData = {};
				let tableDescriptions = {};
				const applyFilter = (rowValue, filterConfig) => {
					const { operator, value } = filterConfig;
					if (operator === 'is_null') {
						return rowValue === null || rowValue === undefined || rowValue === '';
					}
					if (operator === 'is_not_null') {
						return rowValue !== null && rowValue !== undefined && rowValue !== '';
					}
					const numericRowValue = !isNaN(rowValue) ? Number(rowValue) : rowValue;
					const stringRowValue = String(rowValue || '').toLowerCase();
					switch (operator) {
						case 'equals':
							const numericValue = !isNaN(value) ? Number(value) : value;
							return numericRowValue === numericValue;
						case 'not_equals':
							const numericValue2 = !isNaN(value) ? Number(value) : value;
							return numericRowValue !== numericValue2;
						case 'greater_than':
							return numericRowValue > Number(value);
						case 'less_than':
							return numericRowValue < Number(value);
						case 'greater_equal':
							return numericRowValue >= Number(value);
						case 'less_equal':
							return numericRowValue <= Number(value);
						case 'contains':
							return stringRowValue.includes(String(value).toLowerCase());
						case 'not_contains':
							return !stringRowValue.includes(String(value).toLowerCase());
						case 'starts_with':
							return stringRowValue.startsWith(String(value).toLowerCase());
						case 'ends_with':
							return stringRowValue.endsWith(String(value).toLowerCase());
						case 'in':
							const valueList = String(value).split(',').map(v => v.trim());
							return valueList.some(v => {
								const numericV = !isNaN(v) ? Number(v) : v;
								return numericRowValue === numericV;
							});
						case 'not_in':
							const valueList2 = String(value).split(',').map(v => v.trim());
							return !valueList2.some(v => {
								const numericV = !isNaN(v) ? Number(v) : v;
								return numericRowValue === numericV;
							});
						default:
							return true;
					}
				};
				questSetting.manualConfigs.forEach((config, idx) => {
					const fileNote = fileNotes.find(note => note.id === config.dataset);
					if (!fileNote) return;
					let rows = fileNote.rows || [];
					
					console.log(`Processing config ${idx + 1}:`, config);
					console.log(`Original rows count:`, rows.length);
					
					// Áp dụng filter nếu có
					if (config.filters && Object.keys(config.filters).length > 0) {
						console.log(`Applying filters:`, config.filters);
						rows = rows.filter(row => {
							return Object.entries(config.filters).every(([key, filterConfig]) => {
								if (typeof filterConfig === 'object' && filterConfig.operator) {
									const result = applyFilter(row[key], filterConfig);
									return result;
								} else {
									// Backward compatibility
									const rowValueForCompare = !isNaN(row[key]) ? Number(row[key]) : row[key];
									if (Array.isArray(filterConfig)) {
										return filterConfig.some(v => {
											const arrayValue = !isNaN(v) ? Number(v) : v;
											return arrayValue === rowValueForCompare;
										});
									}
									const conditionValue = !isNaN(filterConfig) ? Number(filterConfig) : filterConfig;
									return conditionValue === rowValueForCompare;
								}
							});
						});
						console.log(`Rows after filtering:`, rows.length);
					}
					// Áp dụng group_by, operation, limit, ...
					let resultRows = rows;
					if (config.type === 'aggregation' && config.operation && config.target_column) {
						// Hỗ trợ nhiều cột mục tiêu
						const targetColumns = Array.isArray(config.target_column) ? config.target_column : [config.target_column];
						
						if (config.group_by && config.group_by.length > 0) {
							// Group by aggregation với nhiều cột mục tiêu
							const groupedData = {};
							rows.forEach(row => {
								const groupKey = config.group_by.map(col => row[col]).join('|');
								if (!groupedData[groupKey]) {
									groupedData[groupKey] = {
										...config.group_by.reduce((acc, col) => {
											acc[col] = row[col];
											return acc;
										}, {}),
										...targetColumns.reduce((acc, col) => {
											acc[col] = 0;
											return acc;
										}, {}),
										count: 0,
									};
								}
								
								// Cộng giá trị cho từng cột mục tiêu
								targetColumns.forEach(col => {
									const value = parseFloat(row[col]) || 0;
									groupedData[groupKey][col] += value;
								});
								groupedData[groupKey].count += 1;
							});
							
							resultRows = Object.values(groupedData).map(group => {
								const result = { ...group };
								delete result.count;
								
								// Áp dụng operation cho từng cột mục tiêu
								if (config.operation === 'average') {
									targetColumns.forEach(col => {
										result[col] = group.count > 0 ? result[col] / group.count : 0;
									});
								}
								return result;
							});
						} else {
							// Simple aggregation với nhiều cột mục tiêu
							const aggregatedValues = targetColumns.reduce((acc, col) => {
								acc[col] = 0;
								return acc;
							}, {});
							
							rows.forEach(row => {
								targetColumns.forEach(col => {
									const value = parseFloat(row[col]) || 0;
									switch (config.operation) {
										case 'sum': aggregatedValues[col] += value; break;
										case 'average': aggregatedValues[col] += value; break;
										case 'count': aggregatedValues[col] += 1; break;
										case 'max': aggregatedValues[col] = Math.max(aggregatedValues[col], value); break;
										case 'min': aggregatedValues[col] = Math.min(aggregatedValues[col], value); break;
										default: aggregatedValues[col] += value;
									}
								});
							});
							
							if (config.operation === 'average' && rows.length > 0) {
								targetColumns.forEach(col => {
									aggregatedValues[col] = aggregatedValues[col] / rows.length;
								});
							}
							
							resultRows = [{
								...aggregatedValues,
								operation: config.operation,
								record_count: rows.length,
							}];
						}
					}
					const tableName = `Table${idx + 1}`;
					transformedData[tableName] = resultRows;
					tableDescriptions[tableName] = config.datasetName || fileNote.name;
				});
				transformedData._descriptions = tableDescriptions;
				setFilteredData(transformedData);
				setViewingData(transformedData);
				// 2. Gọi AI 3 (drawChart/analyzeDataFinal) với dữ liệu này
				let allChartsManual = [];
				let chartRSManual = {};
				let aiResultManual = '';
				let totalTokensManual = 0; // Thêm biến đếm token
				
				// Tạo bản sao của transformedData không có _descriptions để gọi AI
				const dataForAI = { ...transformedData };
				delete dataForAI._descriptions;
				
				if (useCreateChart && Object.keys(dataForAI).length > 0) {
					const tableNames = Object.keys(dataForAI);
					const tableDescriptions = transformedData._descriptions || {};
					
					// Merge multiple tables thành single table nếu cần
					const mergedDataForAI = mergeTablesForChart(dataForAI);
					const mergedTableNames = Object.keys(mergedDataForAI).filter(key => key !== '_descriptions');
					
					for (let i = 0; i < mergedTableNames.length; i++) {
						const tableName = mergedTableNames[i];
						const tableData = mergedDataForAI[tableName];
						const tableDescription = tableDescriptions[tableName] || `Dữ liệu ${tableName}`;
						const chartNameManual = `C${i + 1} - ${tableDescription}`;
						
						// Tìm config tương ứng với table này
						const config = questSetting.manualConfigs[i];
						
						if (Array.isArray(tableData) && tableData.length > 0) {
							try {
								// Validate that all target columns are present in the data
								const targetColumns = Array.isArray(config.target_column) ? config.target_column : [config.target_column];
								const numTargetColumns = targetColumns.length;
								const missingColumns = targetColumns.filter(col => {
									return !tableData.some(row => row.hasOwnProperty(col));
								});
								
								if (missingColumns.length > 0) {
									console.warn(`Missing target columns in chart data: ${missingColumns.join(', ')}`);
								}
								
								// Tự động chọn loại chart phù hợp
								const recommendedChartType = getRecommendedChartType(mergedDataForAI, tableName, tableData, config);
								
								// Tạo prompt với hướng dẫn chart type
								const chartPrompt = createChartPrompt(prompt, recommendedChartType, tableName, tableData, config);
								
								console.log(`Creating chart for ${chartNameManual} with type: ${recommendedChartType}`);
								console.log('Table data being sent to chart API:', tableData);
								console.log('Config target columns:', config.target_column);
								console.log('Chart prompt:', chartPrompt);
								
								const singleChartRS = await drawChart({
									data: { [tableName]: tableData },
									prompt: chartPrompt,
									model: currentM3,
									systemMessage: numTargetColumns > 1 
										? `${currentSm3}\n\nQUAN TRỌNG: Khi tạo chart với nhiều cột mục tiêu, LUÔN hiển thị TẤT CẢ các cột trong chartConfig.y và chartData. KHÔNG được chỉ hiển thị một cột duy nhất.`
										: currentSm3,
									desc: '',
								});
								console.log('Chart API response:', singleChartRS);
								
								// Check if the chart response includes all target columns
								let chartData = singleChartRS.chartData;
								let chartConfig = singleChartRS.chartConfig;
								
								// If we have multiple target columns but the chart only shows one, try with a more explicit prompt
								if (numTargetColumns > 1 && chartData && chartData.length > 0) {
									const firstRow = chartData[0];
									const displayedColumns = Object.keys(firstRow).filter(key => 
										targetColumns.includes(key) && firstRow[key] !== undefined && firstRow[key] !== null
									);
									
									if (displayedColumns.length < numTargetColumns) {
										console.log(`Chart only shows ${displayedColumns.length}/${numTargetColumns} target columns. Retrying with explicit prompt...`);
										
										const explicitPrompt = `${chartPrompt}\n\nYÊU CẦU CỤ THỂ: Tạo biểu đồ cột với ${numTargetColumns} cột riêng biệt: ${targetColumns.join(', ')}. Mỗi cột phải có một bar riêng với màu khác nhau. KHÔNG được chỉ hiển thị một cột duy nhất.`;
										
										try {
											const retryRS = await drawChart({
												data: { [tableName]: tableData },
												prompt: explicitPrompt,
												model: currentM3,
												systemMessage: currentSm3,
												desc: '',
											});
											
											if (retryRS.chartData && retryRS.chartConfig) {
												chartData = retryRS.chartData;
												chartConfig = retryRS.chartConfig;
												console.log('Retry successful with explicit prompt');
											}
										} catch (retryError) {
											console.error('Retry failed:', retryError);
										}
									}
								}
								
								// Final check - if still only one column, create a manual chart config
								if (numTargetColumns > 1 && chartData && chartData.length > 0) {
									const firstRow = chartData[0];
									const displayedColumns = Object.keys(firstRow).filter(key => 
										targetColumns.includes(key) && firstRow[key] !== undefined && firstRow[key] !== null
									);
									
									if (displayedColumns.length < numTargetColumns) {
										console.log(`Final attempt: Creating manual chart config for multiple columns`);
										
										// Create a manual chart config that forces multiple columns
										const manualChartConfig = {
											chart_type: "bar",
											title: `So sánh ${targetColumns.join(' và ')}`,
											description: `Biểu đồ hiển thị ${targetColumns.join(' và ')}`,
											x: config.group_by?.[0] || Object.keys(tableData[0])[0],
											y: targetColumns,
											labels: {
												x: config.group_by?.[0] || 'Nhóm',
												y: 'Giá trị'
											}
										};
										
										chartConfig = manualChartConfig;
										console.log('Applied manual chart config:', manualChartConfig);
									}
								}
								
								if (chartData && chartConfig) {
									allChartsManual.push({
										tableName: chartNameManual,
										chartData: chartData,
										chartConfig: chartConfig,
										usage: singleChartRS.usage,
										recommendedType: recommendedChartType, // Thêm thông tin loại chart được đề xuất
									});
									// Cộng token từ chart
									totalTokensManual += singleChartRS.usage?.total_tokens || 0;
								}
							} catch (error) {
								console.error(`Error creating chart for ${chartNameManual}:`, error);
							}
						}
					}
					// Chart tổng hợp
					// try {
					// 	chartRSManual = await drawChart({
					// 		data: dataForAI,
					// 		prompt,
					// 		model: currentM3,
					// 		systemMessage: currentSm3,
					// 		desc: '',
					// 	});
					// 	if (chartRSManual.chartData && chartRSManual.chartConfig) {
					// 		allChartsManual.push({
					// 			tableName: `C${tableNames.length + 1} - Biểu đồ tổng hợp`,
					// 			chartData: chartRSManual.chartData,
					// 			chartConfig: chartRSManual.chartConfig,
					// 			usage: chartRSManual.usage,
					// 		});
					// 	}
					// } catch (error) {
					// 	console.error('Error creating combined chart:', error);
					// }
					setMultipleCharts(allChartsManual);
					if (allChartsManual.length > 0) {
						setData(allChartsManual[0].chartData);
						setChartConfig(allChartsManual[0].chartConfig);
					}
					// Gọi AI 3 để lấy kết quả trả lời
					try {
						const rs2 = await analyzeDataFinal(dataForAI, prompt, currentSm2, currentM2, '');
						aiResultManual = rs2?.result || 'Có lỗi xảy ra khi AI phân tích dữ liệu!';
						setResult(aiResultManual);
						// Cộng token từ analyzeDataFinal
						totalTokensManual += rs2.usage?.total_tokens || 0;
					} catch (error) {
						aiResultManual = 'Có lỗi xảy ra khi AI phân tích dữ liệu!';
						setResult(aiResultManual);
					}
				} else {
					// Không tạo chart, chỉ gọi AI 3 để lấy kết quả trả lời
					try {
						const rs2 = await analyzeDataFinal(dataForAI, prompt, currentSm2, currentM2, '');
						aiResultManual = rs2?.result || 'Có lỗi xảy ra khi AI phân tích dữ liệu!';
						setResult(aiResultManual);
						// Cộng token từ analyzeDataFinal
						totalTokensManual += rs2.usage?.total_tokens || 0;
					} catch (error) {
						aiResultManual = 'Có lỗi xảy ra khi AI phân tích dữ liệu!';
						setResult(aiResultManual);
					}
					setMultipleCharts([]);
					setData([]);
					setChartConfig(null);
				}
				// Lưu lịch sử
				await createChatHistory({
					quest: prompt,
					result: aiResultManual,
					create_at: new Date().toISOString(),
					show: true,
					model2: currentM1,
					model3: currentM2,
					token2: 0, // Không có AI 1, AI 2
					token3: totalTokensManual, // Token từ AI 3 và drawChart
					more_info: {
						filteredData: transformedData,
						dataAI1,
						used_data: dataAI1.map(item => item.id),
						systemMessages: { sm1: currentSm1, sm2: currentSm2, sm3: currentSm3 },
						multipleCharts: allChartsManual,
						tableDescriptions: transformedData._descriptions || {},
					},
					chartData: allChartsManual.length > 0 ? allChartsManual[0].chartData : null,
					chartConfig: allChartsManual.length > 0 ? allChartsManual[0].chartConfig : null,
					userCreated: currentUser.email,
				});
				await loadChatHistory();
				
				// Save used tokens to settings
				const usedTokens = await getSettingByType('USED_TOKEN');
				const totalUsedTokens = (usedTokens?.setting || 0) + totalTokensManual;
				if (usedTokens) {
					await updateSetting({ ...usedTokens, setting: totalUsedTokens });
				} else {
					await createSetting({
						type: 'USED_TOKEN',
						setting: totalUsedTokens,
					});
				}
				analyzeQueue.shift();
				setQueueLength(analyzeQueue.length);
				isProcessingQueue = false;
				setSelectedQueueItem(null);
				processQueue();
				return;
			}
			// --- LOGIC CŨ: AI 1, AI 2, AI 3 ---
			console.log('Input AI 2: ', { dataAI1, prompt, sm1, m1 });
			const result = await analyzeData(dataAI1, prompt, sm1, m1);
			console.log('Output AI 2: ', result);
			let transformedData = processDataWithAnalysisConfigs(fileNotes, result);

			console.log('Dữ liệu sau lọc: ', transformedData);
			console.log('Input AI 3: ', { transformedData, prompt, sm2, m2, desc: result.desc || '' });
			let rs2 = await analyzeDataFinal(transformedData, prompt, sm2, m2, result.desc || '');
			console.log('Output AI 3:', rs2);
			console.log('Output AI 3 (formatted):\n' + rs2.result.replace(/\\n/g, '\n'));
			const aiResult = rs2?.result || 'Có lỗi xảy ra khi AI phân tích dữ liệu!';
			setResult(aiResult);
			setFilteredData(transformedData);
			setViewingData(transformedData);
			let chartRS = {};
			let allCharts = [];

			if (useCreateChart && Object.keys(transformedData).length > 0) {
				const tableCount = Object.keys(transformedData).length;
				const tableDescriptions = transformedData._descriptions || {};

				// Tạo chart cho tất cả các bảng (không giới hạn số lượng)
				const tableNames = Object.keys(transformedData).filter(name => name !== '_descriptions');
				for (let i = 0; i < tableNames.length; i++) {
					const tableName = tableNames[i];
					const tableData = transformedData[tableName];
					const tableDescription = tableDescriptions[tableName] || `Dữ liệu ${tableName}`;
					const chartName = `C${i + 1} - ${tableDescription}`; // Sử dụng mô tả có ý nghĩa

					if (Array.isArray(tableData) && tableData.length > 0) {
						try {
							// Tự động chọn loại chart phù hợp
							const recommendedChartType = getRecommendedChartType(transformedData, tableName, tableData, null);
							
							// Tạo prompt với hướng dẫn chart type
							const chartPrompt = createChartPrompt(prompt, recommendedChartType, tableName, tableData, null);
							
							console.log(`Input AI chart for ${chartName} with type: ${recommendedChartType}: `, {
								data: { [tableName]: tableData },
								prompt: chartPrompt,
								model: m3,
								systemMessage: sm3,
								desc: result.desc || '',
							});

							const singleChartRS = await drawChart({
								data: { [tableName]: tableData },
								prompt: chartPrompt,
								model: m3,
								systemMessage: sm3,
								desc: result.desc || '',
							});

							console.log(`Output AI chart for ${chartName}: `, singleChartRS);

							if (singleChartRS.chartData && singleChartRS.chartConfig) {
								allCharts.push({
									tableName: chartName,
									chartData: singleChartRS.chartData,
									chartConfig: singleChartRS.chartConfig,
									usage: singleChartRS.usage,
									recommendedType: recommendedChartType, // Thêm thông tin loại chart được đề xuất
								});
							}
						} catch (error) {
							console.error(`Error creating chart for ${chartName}:`, error);
						}
					}
				}

				// Tạo thêm 1 chart tổng hợp để có cái nhìn tổng quan
				try {
					// Merge multiple tables thành single table để tránh lỗi 400
					const mergedDataForChart = mergeTablesForChart(transformedData);
					
					console.log('Input AI chart tổng hợp: ', {
						data: mergedDataForChart,
						prompt,
						model: m3,
						systemMessage: sm3,
						desc: result.desc || '',
					});

					chartRS = await drawChart({
						data: mergedDataForChart,
						prompt,
						model: m3,
						systemMessage: sm3,
						desc: result.desc || '',
					});

					console.log('Output AI chart tổng hợp: ', chartRS);

					if (chartRS.chartData && chartRS.chartConfig) {
						allCharts.push({
							tableName: `C${tableNames.length + 1} - Biểu đồ tổng hợp`, // Chart tổng hợp
							chartData: chartRS.chartData,
							chartConfig: chartRS.chartConfig,
							usage: chartRS.usage,
						});
					}
				} catch (error) {
					console.error('Error creating combined chart:', error);
				}

				setMultipleCharts(allCharts);

				// Giữ lại chart đầu tiên cho backward compatibility
				if (allCharts.length > 0) {
					setData(allCharts[0].chartData);
					setChartConfig(allCharts[0].chartConfig);
				}
			} else if (useCreateChart && Object.keys(transformedData).length === 0) {
				// Không có dữ liệu để tạo chart
				setMultipleCharts([]);
				setData([]);
				setChartConfig(null);
			}

			await createChatHistory({
				quest: prompt,
				result: aiResult,
				create_at: new Date().toISOString(),
				show: true,
				model2: m1,
				model3: m2,
				token2: (result.usage?.total_tokens || 0),
				token3: (rs2.usage?.total_tokens || 0) + (allCharts.reduce((sum, chart) => sum + (chart.usage?.total_tokens || 0), 0)),
				more_info: {
					filteredData: transformedData,
					dataAI1,
					used_data: dataAI1.map(item => item.id),
					systemMessages: { sm1, sm2, sm3 },
					multipleCharts: allCharts,
					tableDescriptions: transformedData._descriptions || {},
				},
				chartData: allCharts.length > 0 ? allCharts[0].chartData : null,
				chartConfig: allCharts.length > 0 ? allCharts[0].chartConfig : null,
				userCreated: currentUser.email,
			});

			await loadChatHistory();
			// Save used tokens to settings
			const totalChartTokens = allCharts.reduce((sum, chart) => sum + (chart.usage?.total_tokens || 0), 0);
			const usedTokens = await getSettingByType('USED_TOKEN');
			const totalTokens = (usedTokens?.setting || 0) + (result.usage?.total_tokens || 0) + (rs2.usage?.total_tokens || 0) + totalChartTokens;
			if (usedTokens) {
				await updateSetting({ ...usedTokens, setting: totalTokens });
			} else {
				await createSetting({
					type: 'USED_TOKEN',
					setting: totalTokens,
				});
			}

		} catch (error) {
			let errorMessage = 'Có lỗi xảy ra khi phân tích dữ liệu!';
			const errorData = error?.response?.data?.error;
			if (
				(typeof errorData === 'string' && errorData.includes('Error code: 529')) ||
				(typeof errorData === 'string' && errorData.includes('overloaded'))
			) {
				errorMessage = 'Hệ thống AI đang quá tải, vui lòng thử lại sau!';
			} else {
				console.log(error);
				errorMessage = 'Xảy ra lỗi trong quá trình đọc dữ liệu: ' + errorData;
			}
			setResult(errorMessage);
		} finally {
			setIsLoading(false);
			analyzeQueue.shift();
			setQueueLength(analyzeQueue.length);
			isProcessingQueue = false;
			setSelectedQueueItem(null);
			processQueue();
		}
	};

	// Modify analyze function to use queue
	async function analyze() {
		let sm1 = systemMessage1;
		let sm2 = systemMessage2;
		let sm3 = systemMessage3;
		let m1 = model1;
		let m2 = model2;
		let m3 = model3;
		const message1 = await getSettingByType('SYSTEM_MESSAGE_1');
		if (message1) sm1 = message1.setting;
		const message2 = await getSettingByType('SYSTEM_MESSAGE_2');
		if (message2) sm2 = message2.setting;
		const message3 = await getSettingByType('SYSTEM_MESSAGE_3');
		if (message3) sm3 = message3.setting;
		const bot1 = await getSettingByType('MODEL_AI_1');
		if (bot1) m1 = bot1.setting;
		const bot2 = await getSettingByType('MODEL_AI_2');
		if (bot2) m2 = bot2.setting;
		const bot3 = await getSettingByType('MODEL_AI_3');
		if (bot3) m3 = bot3.setting;
		if (!prompt.trim()) {
			return;
		}

		const queueItem = {
			prompt,
			sm1,
			sm2,
			sm3,
			m1,
			m2,
			m3,
			questSetting, // Thêm questSetting vào queue
			timestamp: new Date().toISOString(),
		};
		analyzeQueue.push(queueItem);
		setQueueLength(analyzeQueue.length);
		setSelectedQueueItem(queueItem);
		setSelectedHistoryId(null);
		setViewingData({}); // Clear viewing data when adding to queue
		setData([]); // Clear chart data
		setChartConfig(null); // Clear chart config
		setMultipleCharts([]); // Clear multiple charts
		processQueue();
	}

	const handleAnalyze = () => {
		setSelectedHistoryId(null);
		setSelectedQueueItem(null);
		setViewingData(filteredData);
		setData([]); // Clear chart data
		setChartConfig(null); // Clear chart config
		setMultipleCharts([]); // Clear multiple charts
		analyze();
	};

	// When filteredData changes (e.g. after loadData), update viewingData if not viewing a history
	useEffect(() => {
		if (!selectedHistoryId && !selectedQueueItem && Object.keys(viewingData).length > 0) {
			setViewingData(filteredData);
		}
	}, [filteredData, selectedHistoryId, selectedQueueItem]);

	// Cleanup effect to prevent ag-grid errors
	useEffect(() => {
		return () => {
			// Cleanup when component unmounts
			setViewingData({});
			setFilteredData({});
			setData([]);
			setChartConfig(null);
			setMultipleCharts([]); // Clear multiple charts
		};
	}, []);

	const handleContextMenu = (e, item) => {
		e.preventDefault();
		setContextMenuPosition({ x: e.clientX, y: e.clientY });
	};

	const handleDeleteHistory = async (id) => {
		try {
			await deleteChatHistory(id);
			await loadChatHistory();
			if (selectedHistoryId === id) {
				handleSelectHistory(null);
			}
		} catch (error) {
			console.error('Error deleting chat history:', error);
		}
	};

	const handleTemplateClick = () => {
		setTemplateModalOpen(true);
	};

	const handleTemplateSelect = async (question, decs, autoCreateChart = false, templateSystemMessage = null, questSetting = null) => {
		setPrompt(question);
		setPromptDecs(decs);
		setUseCreateChart(autoCreateChart);

		if (templateSystemMessage) {
			const data = await getTemplateSettingAIReportBuilderById(Number(templateSystemMessage.selectedSystemMessageId));
			if (data.success) {
				setModel1(data.data?.setting.model1);
				setModel2(data.data?.setting.model2);
				setModel3(data.data?.setting.model3);
				setSystemMessage1(data.data?.setting.systemMessage1);
				setSystemMessage2(data.data?.setting.systemMessage2);
				setSystemMessage3(data.data?.setting.systemMessage3);
				setQuestSetting(questSetting);
			}
		} else {
			console.log('No template system message configuration found');
		}
	};

	// --- UI ---
	async function testAI3() {
		console.log('...');
		let rs3 = await analyzeData2(dataTestAI3, 'Phân tích dữ liệu về doanh thu của từng cửa hàng, xác định sản phẩm bán chạy, sản phẩm bán chậm và đưa ra các nhận định khuyến nghị', systemMessage2, model2);
		console.log(rs3);
	}

	// Thêm hàm tự động chọn loại chart phù hợp
	const getRecommendedChartType = (data, tableName, tableData, config) => {
		if (!tableData || tableData.length === 0) return 'bar';
		
		// Đếm số cột mục tiêu
		const targetColumns = Array.isArray(config?.target_column) ? config.target_column : [config?.target_column];
		const numTargetColumns = targetColumns.filter(col => col).length;
		
		// Đếm số nhóm
		const numGroups = config?.group_by?.length || 0;
		
		// Kiểm tra loại operation
		const operation = config?.operation || 'sum';
		
		// Kiểm tra có cột thời gian không
		const hasTimeColumn = tableData.some(row => {
			return Object.keys(row).some(key => {
				const value = row[key];
				return typeof value === 'string' && (
					key.toLowerCase().includes('ngày') || 
					key.toLowerCase().includes('tháng') || 
					key.toLowerCase().includes('năm') ||
					key.toLowerCase().includes('date') ||
					key.toLowerCase().includes('time')
				);
			});
		});
		
		// Logic chọn chart
		if (numTargetColumns === 2) {
			// Nếu có đúng 2 cột mục tiêu, sử dụng scatter chart
			return 'scatter';
		} else if (numTargetColumns >= 3) {
			// Nếu có 3 cột trở lên, sử dụng mixed chart (line + bar)
			return 'mixed';
		} else if (numTargetColumns === 1) {
			if (numGroups === 0) {
				// Không có group_by -> Pie/Donut
				return 'pie';
			} else if (numGroups === 1) {
				// 1 nhóm -> Bar/Line
				return hasTimeColumn ? 'line' : 'bar';
			} else {
				// Nhiều nhóm -> Bar
				return 'bar';
			}
		}
		
		// Default
		return 'bar';
	};

	// Thêm hàm tạo prompt cho chart với loại chart được đề xuất
	const createChartPrompt = (originalPrompt, recommendedChartType, tableName, tableData, config) => {
		const targetColumns = Array.isArray(config?.target_column) ? config.target_column : [config?.target_column];
		const numTargetColumns = targetColumns.filter(col => col).length;
		
		let chartTypeInstruction = '';
		switch (recommendedChartType) {
			case 'bar':
				if (numTargetColumns > 1) {
					chartTypeInstruction = `Tạo biểu đồ cột (bar chart) để so sánh ${numTargetColumns} cột cùng lúc: ${targetColumns.join(', ')}. Mỗi cột mục tiêu sẽ có một màu khác nhau và hiển thị cùng lúc trên cùng một biểu đồ. Sử dụng grouped bar chart hoặc stacked bar chart để hiển thị tất cả các cột mục tiêu.`;
				} else {
					chartTypeInstruction = 'Tạo biểu đồ cột (bar chart) để hiển thị dữ liệu.';
				}
				break;
			case 'line':
				if (numTargetColumns > 1) {
					chartTypeInstruction = `Tạo biểu đồ đường (line chart) để hiển thị xu hướng của ${numTargetColumns} cột: ${targetColumns.join(', ')}. Mỗi cột sẽ có một đường riêng với màu khác nhau.`;
				} else {
					chartTypeInstruction = 'Tạo biểu đồ đường (line chart) để hiển thị xu hướng theo thời gian.';
				}
				break;
			case 'mixed':
				chartTypeInstruction = `Tạo biểu đồ kết hợp (mixed chart) với ${numTargetColumns} cột: ${targetColumns.join(', ')}. Cột đầu tiên (${targetColumns[0]}) sẽ hiển thị dưới dạng đường (line chart) và cột thứ hai (${targetColumns[1]}) sẽ hiển thị dưới dạng cột (bar chart). Điều này giúp dễ dàng theo dõi khi có sự chênh lệch lớn giữa các giá trị. Sử dụng dual y-axis để hiển thị cả hai loại biểu đồ trên cùng một chart.`;
			break;
			case 'pie':
				chartTypeInstruction = 'Tạo biểu đồ tròn (pie chart) để hiển thị tỷ lệ phần trăm.';
				break;
			case 'scatter':
				if (numTargetColumns === 2) {
					chartTypeInstruction = `Tạo biểu đồ phân tán (scatter plot) để hiển thị mối quan hệ giữa 2 cột: ${targetColumns[0]} và ${targetColumns[1]}. Cột ${targetColumns[0]} sẽ là trục X và cột ${targetColumns[1]} sẽ là trục Y. Biểu đồ này giúp phân tích mối tương quan giữa hai biến số.`;
				} else {
					chartTypeInstruction = 'Tạo biểu đồ phân tán (scatter plot) để hiển thị mối quan hệ giữa hai cột.';
				}
				break;
			case 'heatmap':
				chartTypeInstruction = 'Tạo biểu đồ nhiệt (heatmap) để hiển thị mối quan hệ giữa nhiều cột và nhóm.';
				break;
			default:
				chartTypeInstruction = 'Tạo biểu đồ phù hợp để hiển thị dữ liệu.';
		}
		
		// Thêm hướng dẫn cụ thể cho multiple columns
		let multipleColumnsInstruction = '';
		if (numTargetColumns > 1) {
			if (recommendedChartType === 'mixed') {
				multipleColumnsInstruction = `\n\nQUAN TRỌNG: Dữ liệu có ${numTargetColumns} cột mục tiêu (${targetColumns.join(', ')}). Tạo biểu đồ kết hợp với cột đầu tiên (${targetColumns[0]}) là line chart và cột thứ hai (${targetColumns[1]}) là bar chart. Sử dụng dual y-axis để hiển thị cả hai loại biểu đồ.`;
			} else if (recommendedChartType === 'scatter' && numTargetColumns === 2) {
				multipleColumnsInstruction = `\n\nQUAN TRỌNG: Dữ liệu có 2 cột mục tiêu (${targetColumns.join(', ')}). Tạo scatter plot với cột ${targetColumns[0]} làm trục X và cột ${targetColumns[1]} làm trục Y để hiển thị mối quan hệ giữa hai biến số.`;
			} else {
				multipleColumnsInstruction = `\n\nQUAN TRỌNG: Dữ liệu có ${numTargetColumns} cột mục tiêu (${targetColumns.join(', ')}). Hãy đảm bảo hiển thị TẤT CẢ các cột này trong biểu đồ, không chỉ một cột. Mỗi cột nên có màu hoặc style khác nhau để phân biệt.`;
				
				// Thêm hướng dẫn cụ thể cho bar chart với multiple columns
				if (recommendedChartType === 'bar') {
					multipleColumnsInstruction += `\n\nĐối với bar chart: Sử dụng grouped bars hoặc stacked bars để hiển thị cả ${targetColumns.join(' và ')}. Mỗi cột mục tiêu sẽ có một bar riêng biệt với màu khác nhau. KHÔNG chỉ hiển thị một cột duy nhất.`;
				}
			}
		}
		
		// Thêm thông tin về dữ liệu thực tế
		let dataInfo = '';
		if (tableData && tableData.length > 0) {
			const sampleRow = tableData[0];
			const availableColumns = Object.keys(sampleRow);
			dataInfo = `\n\nDữ liệu có các cột: ${availableColumns.join(', ')}. Các cột mục tiêu cần hiển thị: ${targetColumns.join(', ')}.`;
		}
		
		// Thêm hướng dẫn cụ thể về cấu trúc chart
		let structureInstruction = '';
		if (numTargetColumns > 1) {
			if (recommendedChartType === 'mixed') {
				structureInstruction = `\n\nCẤU TRÚC CHART: ChartConfig phải có chart_type: "mixed", x: "${targetColumns[0] === 'Tháng' ? 'Tháng' : Object.keys(tableData[0])[0]}", y: [${targetColumns.map(col => `"${col}"`).join(', ')}]. Sử dụng dual y-axis để hiển thị line chart và bar chart.`;
			} else if (recommendedChartType === 'scatter' && numTargetColumns === 2) {
				structureInstruction = `\n\nCẤU TRÚC CHART: ChartConfig phải có chart_type: "scatter", x: "${targetColumns[0]}", y: "${targetColumns[1]}". Cột ${targetColumns[0]} làm trục X, cột ${targetColumns[1]} làm trục Y.`;
			} else {
				structureInstruction = `\n\nCẤU TRÚC CHART: ChartConfig phải có y: [${targetColumns.map(col => `"${col}"`).join(', ')}] để hiển thị tất cả các cột mục tiêu. KHÔNG chỉ có y: "${targetColumns[0]}".`;
			}
		}
		
		return `${originalPrompt}\n\n${chartTypeInstruction}${multipleColumnsInstruction}${dataInfo}${structureInstruction}\nSử dụng loại biểu đồ: ${recommendedChartType.toUpperCase()}.`;
	};

	// Thêm hàm merge multiple tables thành single table
	const mergeTablesForChart = (data) => {
		const tableNames = Object.keys(data).filter(key => key !== '_descriptions');
		if (tableNames.length <= 1) {
			return data; // Không cần merge nếu chỉ có 1 bảng
		}
		
		// Merge các bảng thành 1 bảng duy nhất
		const mergedData = {};
		const firstTableName = tableNames[0];
		const firstTableData = data[firstTableName];
		
		if (!Array.isArray(firstTableData) || firstTableData.length === 0) {
			return data;
		}
		
		// Tạo bảng merged với key chung
		const mergedTable = firstTableData.map(row => {
			const mergedRow = { ...row };
			
			// Thêm dữ liệu từ các bảng khác dựa trên key chung
			tableNames.slice(1).forEach(tableName => {
				const otherTableData = data[tableName];
				if (Array.isArray(otherTableData)) {
					// Tìm row tương ứng trong bảng khác
					const matchingRow = otherTableData.find(otherRow => {
						// Tìm key chung (có thể là "Tên sản phẩm" hoặc key đầu tiên)
						const commonKey = Object.keys(row)[0];
						return otherRow[commonKey] === row[commonKey];
					});
					
					if (matchingRow) {
						// Thêm tất cả columns từ bảng khác (trừ key chung)
						Object.keys(matchingRow).forEach(key => {
							if (key !== Object.keys(row)[0]) {
								mergedRow[key] = matchingRow[key];
							}
						});
					}
				}
			});
			
			return mergedRow;
		});
		
		mergedData[firstTableName] = mergedTable;
		mergedData._descriptions = data._descriptions;
		
		console.log('Merged data for chart API:', mergedData);
		return mergedData;
	};

	return (
		<div className={css.aiLayout}>
			{/* Sidebar */}
			<div className={css.aiSidebar}>
				<div className={css.aiSection}>
					<div className={css.aiSectionTitle}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<h3>Câu hỏi</h3>
							<div
								className={css.aiSectionTemplate}
								onClick={handleTemplateClick}
								style={{ cursor: 'pointer' }}
							>
								<span>Template</span>
							</div>
							<Button
								type='text'
								icon={<PlusCircle size={16} />}
								onClick={() => {
									setPrompt('');
									setResult(resultDefault);
									setSelectedHistoryId(null);
									setSelectedQueueItem(null);
									setViewingData({});
									setData([]); // Clear chart data
									setChartConfig(null); // Clear chart config
									setMultipleCharts([]); // Clear multiple charts
								}}
								className={css.newQuestionButton}
							/>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<input
								type='checkbox'
								checked={useCreateChart}
								onChange={e => setUseCreateChart(e.target.checked)}
								id='createChartCheckbox'
							/>
							<label htmlFor='createChartCheckbox' style={{ fontSize: 14 }}>
								Tạo chart
							</label>
						</div>
					</div>
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						gap: 12,
						width: '97%',
						height: '70%',
					}}>
						{prompt ? (
							<div style={{
								height: 'calc(100% - 30px)',
								margin: '12px 0',
								padding: '12px',
								backgroundColor: '#f8f9fa',
								border: '1px solid #e9ecef',
								borderRadius: '6px',
								width: '100%',
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'space-between',
							}}>
								<div style={{
									fontSize: 16,
									color: '#222',
									lineHeight: 1.5,
									wordBreak: 'break-word',
									flex: 1,
								}}>
									{prompt}
								</div>
								<Button
									type='text'
									size='small'
									onClick={() => {
										setPrompt('');
										setResult(resultDefault);
										setSelectedHistoryId(null);
										setSelectedQueueItem(null);
										setViewingData({});
										setMultipleCharts([]); // Clear multiple charts
									}}
									style={{ alignSelf: 'flex-end', marginTop: 8 }}
								>
									Xóa câu hỏi
								</Button>
							</div>
						) : (
							<div style={{
								height: 'calc(100% - 30px)',
								margin: '12px 0',
								padding: '12px',
								backgroundColor: '#f8f9fa',
								border: '1px solid #e9ecef',
								borderRadius: '6px',
								width: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexDirection: 'column',
								gap: '8px',
							}}>
								<div style={{
									textAlign: 'center',
									color: '#666',
									fontSize: 14,
								}}>
									<p>Chưa có câu hỏi nào được chọn</p>
									<p>Hãy click vào "Template" để chọn mẫu câu hỏi</p>
								</div>
							</div>
						)}
					</div>
					<div style={{ display: 'flex', justifyContent: 'end', width: '97%', height: '30px' }}>
						<Button
							type='primary'
							className={css.sendButton}
							onClick={handleAnalyze}
							loading={isLoading}
							icon={<Send size={16} />}
							disabled={!prompt.trim()}
						>
							{result && result !== resultDefault ? 'Gửi lại' : 'Gửi'}
						</Button>
					</div>
				</div>
				{queueLength > 0 && (
					<div className={css.aiSectionHistoryChat}>
						<div className={css.historyHeader}>
							<div className={css.historyTitle}>
								<h3>Đang xử lý ({queueLength} yêu cầu)</h3>
							</div>
						</div>
						<List
							className={css.aiList}
							dataSource={analyzeQueue}
							renderItem={item => (
								<Card
									className={css.aiCard + (selectedQueueItem === item ? ' ' + css.selectedCard : '')}
									size='small'
									bodyStyle={{
										padding: 12,
										minHeight: 40,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
									}}
									onClick={() => {
										setSelectedQueueItem(item);
										setSelectedHistoryId(null);
										setViewingData({});
										setData([]); // Clear chart data
										setChartConfig(null); // Clear chart config
										setMultipleCharts([]); // Clear multiple charts
									}}
									style={{
										cursor: 'pointer',
										borderColor: selectedQueueItem === item ? '#1677ff' : undefined,
									}}
								>
									<div style={{
										fontSize: 14,
										color: '#222',
										marginBottom: 4,
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}>{item.prompt}</div>

									<div className={css.aiDate}>
										{new Date(item.timestamp).toLocaleString('vi-VN', {
											year: 'numeric',
											month: '2-digit',
											day: '2-digit',
											hour: '2-digit',
											minute: '2-digit',
											second: '2-digit',
											hour12: false,
										})}
									</div>
								</Card>
							)}
						/>
					</div>
				)}

				<div className={css.aiSectionHistoryChat}>
					<div className={css.historyHeader}>
						<div className={css.historyTitle}>
							<h3>Lịch sử câu hỏi</h3>
						</div>
					</div>
					<List
						className={css.aiList}
						loading={loadingHistory}
						dataSource={chatHistory}
						renderItem={item => (
							<Dropdown
								menu={{
									items: [
										{
											key: 'delete',
											danger: true,
											label: (
												<Popconfirm
													title='Xóa lịch sử'
													description='Bạn có chắc chắn muốn xóa lịch sử này?'
													onConfirm={() => handleDeleteHistory(item.id)}
													okText='Có'
													cancelText='Không'
												>
													<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
														<Trash2 size={16} />
														<span>Xóa</span>
													</div>
												</Popconfirm>
											),
										},
									],
								}}
								trigger={['contextMenu']}
							>
								<Card
									className={css.aiCard + (selectedHistoryId === item.id ? ' ' + css.selectedCard : '')}
									size='small'
									bodyStyle={{
										padding: 12,
										minHeight: 40,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
									}}
									onClick={() => handleSelectHistory(item)}
									style={{
										cursor: 'pointer',
										borderColor: selectedHistoryId === item.id ? '#1677ff' : undefined,
									}}
								>
									<div style={{
										fontSize: 14,
										color: '#222',
										marginBottom: 4,
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}>{item.quest}</div>

									<div className={css.aiDate}>
										<Tooltip
											placement='right'
											style={{ width: 400 }}
											title={
												<div style={{ fontSize: 12 }}>
													<div>Token phân
														tích: {parseFloat(item.token2) || 0} ( {`${item.model2}` || ''})
													</div>
													<div>Token trả
														lời: {parseFloat(item.token3) || 0} ( {`${item.model3}` || ''})
													</div>
													<div>Tổng
														token: {(parseFloat(item.token2) || 0) + (parseFloat(item.token3) || 0)}</div>
													{item.more_info?.multipleCharts && (
														<div>Biểu đồ: {item.more_info.multipleCharts.length} chart</div>
													)}
													{item.more_info?.multipleCharts && item.more_info.multipleCharts.length > 0 && (
														<div style={{ marginTop: '4px' }}>
															<strong>Loại chart:</strong>
															<ul style={{ margin: '2px 0 0 0', paddingLeft: '16px' }}>
																{item.more_info.multipleCharts.map((chart, idx) => (
																	<li key={idx}>
																		{chart.tableName}: {chart.recommendedType || 'AUTO'}
																	</li>
																))}
															</ul>
														</div>
													)}
												</div>
											}
										>
											<span style={{ marginLeft: 8, color: '#666', cursor: 'help' }}>
												<u>{formatNumber((parseFloat(item.token2) || 0) + (parseFloat(item.token3) || 0))} tokens</u>
											</span>
										</Tooltip>
										{new Date(item.create_at).toLocaleString('vi-VN', {
											year: 'numeric',
											month: '2-digit',
											day: '2-digit',
											hour: '2-digit',
											minute: '2-digit',
											second: '2-digit',
											hour12: false,
										})}

									</div>
								</Card>
							</Dropdown>
						)}
					/>
				</div>
			</div>
			{/* Main */}
			<div className={css.aiMain}>
				<div className={css.allMainContainer}>
					<Spin spinning={isLoading} tip='Đang xử lý...'>
						<div className={css.headerAnswer}>
							<h3>
								{/*AI Output*/}
							</h3>
							<div className={css.buttonHeader}>

								<div style={{
									width: '60%',
									display: 'flex',
									justifyContent: 'flex-end',
									alignItems: 'center',
									gap: 12,
								}}>
									<Button type={'text'} onClick={() => setSaveModalOpen(true)}> Lưu dữ liệu phân
										tích</Button>
									{chartConfig && (
										<Checkbox
											checked={showChart === true}
											onChange={e => {
												const checked = e.target.checked;
												setShowChart(checked ? true : null);
												setShowDataBox(false);
												if (selectedHistoryId) saveShowChartStatus(selectedHistoryId, checked ? true : null, false);
											}}
											style={{ marginLeft: 8 }}
										>
											Biểu đồ
										</Checkbox>
									)}
									<Checkbox
										checked={showDataBox}
										onChange={e => {
											const checked = e.target.checked;
											setShowDataBox(checked);
											setShowChart(null);
											if (selectedHistoryId) saveShowChartStatus(selectedHistoryId, null, checked);
										}}
										style={{ marginLeft: 8 }}
									>
										Xem bảng dữ liệu
									</Checkbox>
								</div>
								<div style={{
									width: '50%',
									display: 'flex',
									justifyContent: 'flex-end',
									alignItems: 'center',
								}}>

									{Object.keys(viewingData || {}).length > 0 && showDataBox && (
										<Switch
											checked={isStatusFilter}
											onChange={(checked) => setIsStatusFilter(checked)}
											checkedChildren='Bật Filter'
											unCheckedChildren='Tắt Filter'
										/>
									)}
									<Button type={'text'} onClick={() => setFormModalOpen(true)}> Cấu hình AI</Button>
									<Button type={'text'} onClick={() => setModalOpen(true)}>Cấu hình dữ liệu</Button>
								</div>
							</div>
						</div>

						<div
							className={css.aiMainBottom}
							style={
								!showChart && !showDataBox
									? {
										alignItems: 'center',
										justifyContent: 'center',
										display: 'flex',
										minHeight: 400,
										height: '100%', // Optional: ensures full height for centering
									}
									: {}
							}
						>
							<div className={css.aiAnswerBox}>
								<div className={css.aiAnswerContent}>
									{selectedQueueItem ? (
										<div style={{ textAlign: 'center', padding: '20px' }}>
											{/*{chartConfig && (*/}
											{/*	<ChartComponent*/}
											{/*		chartData={data}*/}
											{/*		chartConfig={chartConfig}*/}
											{/*	/>*/}
											{/*)}*/}
											<Loading3DTower />
											<div style={{ marginTop: '10px' }}>Đang xử lý yêu cầu...</div>
										</div>
									) : (
										<>
											{/*<div>*/}
											{/*	{chartConfig && (*/}
											{/*		<ChartComponent*/}
											{/*			chartData={data}*/}
											{/*			chartConfig={chartConfig}*/}
											{/*		/>*/}
											{/*	)}*/}
											{/*</div>*/}
											<div style={{
												display: 'flex',
												justifyContent: 'flex-end',
												marginBottom: 8,
											}}>
												{!isEditing ? (
													<></>
												) : (
													<>
														<Button
															size='small'
															type='primary'
															onClick={async () => {
																setIsEditing(false);
																setResult(editedContent);
																// Call API to persist changes
																try {
																	await updateChatHistory(selectedHistoryId, { result: editedContent });
																	// Optionally show a success message or refresh data
																} catch (error) {
																	// Handle error (e.g., show notification)
																}
															}}
															style={{ marginRight: 8 }}
														>
															Save
														</Button>
														<Button
															size='small'
															onClick={() => {
																setIsEditing(false);
																setEditedContent(result);
															}}
														>
															Cancel
														</Button>
													</>
												)}
											</div>
											{isEditing ? (
												<Input.TextArea
													value={editedContent}
													onChange={e => setEditedContent(e.target.value)}
													autoSize={{ minRows: 6 }}
													style={{ marginBottom: 12 }}
												/>
											) : (
												<div
													className={css.markedContent}
													dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(result)) }}
												/>
											)}
										</>
									)}
								</div>
							</div>
							<div
								style={{
									minWidth: 0,
									display: 'flex',
									flexDirection: 'column',
									gap: 24,
									width:
										showChart || showDataBox
											? '45%'
											: !showChart && !showDataBox
												? '0%'
												: undefined,
								}}
							>
								<div style={{ width: '100%' }}>
									{showChart && multipleCharts.length > 0 && (
										<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
											{/* <div style={{
												padding: '12px 16px',
												backgroundColor: '#e6f7ff',
												border: '1px solid #91d5ff',
												borderRadius: '6px',
												marginBottom: '8px'
											}}>
												<strong>Đã tạo {multipleCharts.length} biểu đồ:</strong>
												<ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
													{multipleCharts.map((chart, index) => (
														<li key={index}>{chart.tableName}</li>
													))}
												</ul>
											</div> */}
											{multipleCharts.map((chart, index) => (
												<div key={index} style={{
													border: '1px solid #e8e8e8',
													borderRadius: '8px',
													padding: '16px',
													backgroundColor: '#fafafa',
												}}>
													<h4 style={{
														marginBottom: '12px',
														color: '#1890ff',
														fontSize: '16px',
														fontWeight: '600',
													}}>
														{chart.tableName}
														{chart.recommendedType && (
															<span style={{
																marginLeft: '8px',
																fontSize: '12px',
																color: '#52c41a',
																backgroundColor: '#f6ffed',
																padding: '2px 6px',
																borderRadius: '4px',
																border: '1px solid #b7eb8f',
															}}>
																{chart.recommendedType.toUpperCase()}
															</span>
														)}
													</h4>
													<ChartComponent
														chartData={chart.chartData}
														chartConfig={chart.chartConfig}
													/>
												</div>
											))}
										</div>
									)}
									{showChart && chartConfig && (multipleCharts.length === 0 || !multipleCharts) && (
										<div style={{
											border: '1px solid #e8e8e8',
											borderRadius: '8px',
											padding: '16px',
											backgroundColor: '#fafafa',
										}}>
											{(() => {
												console.log('Displaying single chart with:', { data, chartConfig });
												return null;
											})()}
											<h4 style={{
												marginBottom: '12px',
												color: '#1890ff',
												fontSize: '16px',
												fontWeight: '600',
											}}>
												{chartConfig.title || 'Biểu đồ'}
											</h4>
										<ChartComponent
											chartData={data}
											chartConfig={chartConfig}
										/>
										</div>
									)}
									{/* {showChart && useCreateChart && multipleCharts.length === 0 && !chartConfig && (
										<div style={{
											padding: '20px',
											textAlign: 'center',
											color: '#666',
											backgroundColor: '#f9f9f9',
											border: '1px dashed #d9d9d9',
											borderRadius: '8px'
										}}>
											<p>Không có biểu đồ nào được tạo</p>
											<p style={{ fontSize: '12px', marginTop: '8px' }}>
												Có thể do không đủ dữ liệu hoặc cấu hình biểu đồ không phù hợp
											</p>
										</div>
									)} */}
								</div>
								{showDataBox && (
									<div className={css.aiDataBox}>
										<div className={css.aiDataContent} style={{ overflowX: 'auto' }}>
											{(() => {
												if (viewingData?.filters && viewingData?.matched_ids) {
													const filters = viewingData.filters;
													const matchedIds = viewingData.matched_ids;
													return (
														<div className='ag-theme-quartz' style={{
															height: 200,
															width: '100%',
															marginBottom: 30,
															border: usedDataIds.length ? '2px solid #1677ff' : undefined,
														}}>
															<AgGridReact
																rowData={matchedIds.map(id => ({ id, ...filters[id]?.conditions }))}
																columnDefs={[
																	{ headerName: 'ID', field: 'id', width: 100 },
																	...Object.keys(filters[matchedIds[0]]?.conditions || {}).map(key => ({
																		headerName: key,
																		field: key,
																		width: 100,
																	})),
																]}
																pagination={false}
																onGridReady={params => {
																	try {
																		params.api.sizeColumnsToFit();
																	} catch (error) {
																		console.warn('Error in grid ready:', error);
																	}
																}}
																onGridDestroyed={() => {
																	// Cleanup when grid is destroyed
																}}
																defaultColDef={{
																	sortable: true,
																	filter: true,
																	resizable: true,
																	cellRenderer: params => params.value ?? '',
																	...filter,
																}}
															/>
														</div>
													);
												}
												// Handle the previous table format
												return Object.entries(viewingData || {}).map(([tableName, rows]) => {
													if (!Array.isArray(rows) || rows.length === 0) return null;

													// Bỏ qua _descriptions key
													if (tableName === '_descriptions') return null;

													// Get all unique keys from rows for this table
													const allKeys = new Set();
													rows.forEach(row => {
														if (row && typeof row === 'object') {
															Object.keys(row).forEach(key => allKeys.add(key));
														}
													});

													const columnDefs = Array.from(allKeys).map(key => ({
														headerName: key,
														field: key,
														valueGetter: params => params.data?.[key] ?? '',
													}));
													let tableId = null;
													const found = dataAI1.find(item => item.name === tableName);
													if (found) tableId = found.id;

													// Lấy mô tả bảng từ _descriptions
													const tableDescriptions = viewingData._descriptions || {};
													const tableDescription = tableDescriptions[tableName] || `Bảng dữ liệu ${tableName}`;

													return (
														<div key={tableName} className='ag-theme-quartz'
															 style={{ height: 300, width: '100%', marginBottom: 50 }}>
															<h4 style={{ marginBottom: '10px' }}>{tableDescription}</h4>
															<AgGridReact
																localeText={AG_GRID_LOCALE_VN}
																enableRangeSelection={true}
																statusBar={statusBar}
																rowData={rows}
																columnDefs={columnDefs}
																pagination={false}
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
																onGridDestroyed={() => {
																	// Cleanup when grid is destroyed
																}}
																defaultColDef={{
																	suppressHeaderMenuButton: true,
																	sortable: true,
																	filter: true,
																	resizable: true,
																	cellRenderer: params => params.value ?? '',
																	...filter,
																	// width: 100,
																}}
															/>
														</div>
													);
												});
											})()}
										</div>
									</div>
								)}
							</div>

						</div>
					</Spin>
				</div>
			</div>

			<AIForm
				isOpen={formModalOpen}
				onClose={() => setFormModalOpen(false)}
				prompt={prompt}
				setPrompt={setPrompt}
				systemMessage1={systemMessage1}
				setSystemMessage1={setSystemMessage1}
				systemMessage2={systemMessage2}
				setSystemMessage2={setSystemMessage2}
				systemMessage3={systemMessage3}
				setSystemMessage3={setSystemMessage3}
				onAnalyze={() => analyze().then()}
				onViewData={() => setModalOpen(true)}
			/>

			<DataModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				fileNotesFull={fileNotesFull}
				selectedId={selectedId}
				setSelectedId={setSelectedId}
				selectedFileNote={selectedFileNote}
				checkedItems={checkedItems}
				setCheckedItems={setCheckedItems}
				onFileNoteUpdate={handleFileNoteUpdate}
				updateFilteredStates={updateFilteredStates}
			/>

			{
				templateModalOpen && <TemplateModal
					isOpen={templateModalOpen}
					onClose={() => setTemplateModalOpen(false)}
					onSelectTemplate={handleTemplateSelect}
					currentUser={currentUser}
					fileNotesFull={dataAI1}
				/>
			}
			<SaveAnalysisModal
				open={saveModalOpen}
				onClose={() => setSaveModalOpen(false)}
				initialContent={result}
				onSave={(content) => {
					// TODO: handle save logic here
					setSaveModalOpen(false);
				}}
				currentUser={currentUser}
			/>
			{/*<button onClick={() => {*/}
			{/*	testAI3().then();*/}
			{/*}}>Test AI 3*/}
			{/*</button>*/}
			{/*<button onClick={()=> {setPDFModal(true)}}>Test AI PDF</button>*/}
			{/*{pdfModal && <ChatBotFile isModalOpen={pdfModal} setIsModalOpen={setPDFModal} />}*/}
		</div>
	);
}

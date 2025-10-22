import { useContext, useEffect, useMemo, useState } from 'react';
import { getAllFileNotePad } from '../../apis/fileNotePadService.jsx';
import { getTemplateByFileNoteId, getTemplateColumn, getTemplateRow } from '../../apis/templateSettingService.jsx';
import { Button, Card, Dropdown, Input, List, Popconfirm, Select, Spin, Tooltip, Switch, Checkbox, Radio, message, Collapse } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import css from './AI.module.css';
import DataModal from './DataModal';
import { defaultMessage1, defaultMessage2, defaultMessage3 } from './default.js';
import { createSetting, getSettingByType, updateSetting } from '../../apis/settingService.jsx';
import { Ellipsis, History, Send, Trash2, PlusCircle, Paperclip, Settings } from 'lucide-react';
import { analyzeData, analyzeData2, analyzeDataFinal, drawChart } from '../../apis/botService.jsx';
import { createAIPowerdrillHistory, deleteAIPowerdrillHistory, getAllAIPowerdrillHistory } from '../../apis/aiAnalysisPowerdrillHistoryService';
import { createNewFileNotePad, updateFileNotePad } from '../../apis/fileNotePadService.jsx';
import { createTimestamp } from '../../generalFunction/format.js';
import { getFileTabByTypeData } from '../../apis/fileTabService.jsx';
import { MODEL_AI_LIST } from '../../CONST.js';
import { MyContext } from '../../MyContext.jsx';
import { loadAndMergeData } from '../Canvas/Daas/Content/Template/SettingCombine/logicCombine.js';
import AG_GRID_LOCALE_VN from '../Home/AgridTable/locale.jsx';
import ChartComponent from './ChartComponent.jsx';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { ChatBotFile } from '../Canvas/ChatBot/ChatBotFile.jsx';
import { dataTestAI3 } from '../../../data.js';
import { updateAIPowerdrillHistory } from '../../apis/aiAnalysisPowerdrillHistoryService';
import { powerdrillAnalyzeData } from '../../apis/powerdrillService';
import ManualConfigModal from './ManualConfigModal';
import UploadFileModal from './UploadFileModal';
import PowerDrillPromptModal from './PowerDrillPromptModal';

import TableViewer from './TableViewer.jsx';
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

export default function AiBuilderMoi({ onQueueLengthChange, isActivated = false }) {
console.log( 1);
	const { currentUser, listUC_CANVAS, uCSelected_CANVAS, loadDataDuLieu, setLoadDataDuLieu } = useContext(MyContext);
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

	const [queueLength, setQueueLength] = useState(0);
	const [pdfModal, setPDFModal] = useState(false);
	const [selectedQueueItem, setSelectedQueueItem] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState(result);
	const [uploadModalOpen, setUploadModalOpen] = useState(false);
	const [uploadedFileData, setUploadedFileData] = useState(null);
	const [isUsingUploadedData, setIsUsingUploadedData] = useState(false);
	const [uploadedFiles, setUploadedFiles] = useState([]); // Thông tin file metadata
	const [promptModalOpen, setPromptModalOpen] = useState(false);
	const [defaultPrompt, setDefaultPrompt] = useState('');

	const [saveFileName, setSaveFileName] = useState('');
	const [saveFolder, setSaveFolder] = useState(undefined);
	const [tabs, setTabs] = useState([]);

	const [multipleCharts, setMultipleCharts] = useState([]);

	const statusBar = useMemo(() => ({
		statusPanels: [{
			statusPanel: 'agAggregationComponent',
			statusPanelParams: {
				aggFuncs: ['count', 'sum'], // Only show average, count, and sum
			},
		}],
	}), []);



	useEffect(() => {
		if (isActivated) {
			loadData();
		}
	}, [listUC_CANVAS, uCSelected_CANVAS, currentUser, isActivated]);

	useEffect(() => {
		if (isActivated) {
			loadSystemMessages();
			loadChatHistory();
		}
	}, [isActivated]);

	// Load tabs when component mounts
	useEffect(() => {
		if (isActivated) {
			getFileTabByTypeData().then(fileTabs => {
				let filteredTabs = fileTabs.filter(tab => tab.position < 100 && tab.table === 'du-lieu-dau-vao' && tab.type === 'data' && tab?.hide == false);
				filteredTabs = filteredTabs.sort((a, b) => a.position - b.position);
				setTabs(filteredTabs);
			});
		}
	}, [isActivated]);

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
			id: item.id,
			name: item.name,
			tab: item.tab,
			created_at: item.created_at,
			rowDemo: item.rowDemo,
			description: item.desc,
			mother_table_id: item.mother_table_id,
			table_id: item.table_id,
		}));
	};

	const updateFilteredStates = (notes, checkedIds) => {
		const filteredNotes = filterFileNotes(notes, checkedIds);
		const dataAICheck = mapToDataAICheck(filteredNotes);
		setFileNotes(filteredNotes);
		setDataAI1(dataAICheck);
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
			const defaultPromptSetting = await getSettingByType('SYSTEM_PROMT_POWER_DRILL');
			if (defaultPromptSetting) setDefaultPrompt(defaultPromptSetting.setting);
		} catch (error) {
			console.error('Error loading system messages:', error);
		}
	};

	const loadChatHistory = async () => {
		try {
			setLoadingHistory(true);
			const history = await getAllAIPowerdrillHistory();
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
			setResult(resultDefault);
			setSelectedHistoryId(null);
			setViewingData(filteredData);
			setUsedDataIds([]);
			setSelectedQueueItem(null);
			setIsUsingUploadedData(false);
			setUploadedFileData(null);
			setUploadedFiles([]);
			return;
		}
		setPrompt(item.quest);
		
		// Try to use analysisResult object from more_info, fallback to string result
		let resultToDisplay = item.result;
		if (item.more_info?.analysisResult) {
			resultToDisplay = item.more_info.analysisResult;
		} else if (typeof item.result === 'string') {
			// Try to parse JSON string back to object
			try {
				const parsed = JSON.parse(item.result);
				if (parsed && typeof parsed === 'object') {
					resultToDisplay = parsed;
				}
			} catch (e) {
				// Keep as string if parsing fails
			}
		}
		
		setResult(resultToDisplay);
		setSelectedHistoryId(item.id);
		setSelectedQueueItem(null);
		
		// Khôi phục thông tin file nếu có
		if (item.more_info?.files && item.more_info.files.length > 0) {
			setUploadedFiles(item.more_info.files);
			setIsUsingUploadedData(item.more_info.isUploadedData || false);
			// Khôi phục dữ liệu file nếu có
			if (item.more_info?.originalData && item.more_info.isUploadedData) {
				setUploadedFileData(item.more_info.originalData);
			} else {
				setUploadedFileData(null);
			}
		} else {
			setUploadedFiles([]);
			setIsUsingUploadedData(false);
			setUploadedFileData(null);
		}
		
		// Khôi phục dữ liệu hiển thị - ưu tiên dữ liệu đã xử lý
		if (item.more_info?.filteredData) {
			// Khôi phục dữ liệu đã xử lý từ AI 2
			const processedData = item.more_info.filteredData;
			if (item.more_info?.tableDescriptions) {
				processedData._descriptions = item.more_info.tableDescriptions;
			}
			setViewingData(processedData);
		} else if (item.more_info?.originalData) {
			// Khôi phục dữ liệu gốc nếu không có dữ liệu đã xử lý
			setViewingData(item.more_info.originalData);
		} else {
			setViewingData(filteredData);
		}
		
		if (item.more_info?.used_data) {
			setUsedDataIds(item.more_info.used_data);
		} else {
			setUsedDataIds([]);
		}
		
		// Khôi phục chart data nếu có
		if (item.more_info?.charts) {
			setMultipleCharts(item.more_info.charts);
		} else {
			setMultipleCharts([]);
		}
	};



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



	// Add new function to process queue
	const processQueue = async () => {
		if (isProcessingQueue || analyzeQueue.length === 0) return;

		isProcessingQueue = true;
		const { prompt } = analyzeQueue[0];

		try {
			setIsLoading(false);
			setSelectedQueueItem(analyzeQueue[0]);
			setSelectedHistoryId(null);
			setViewingData({});

			// Lấy system message/model cho từng bot (song song)
			const [filterMsgSetting, filterModelSetting, defaultPromptSetting, sysMsg1Setting, model1Setting] = await Promise.all([
				getSettingByType('SYSTEM_MESSAGE_PD_1'),
				getSettingByType('MODEL_PD_1'),
				getSettingByType('SYSTEM_PROMT_POWER_DRILL'),
				getSettingByType('SYSTEM_MESSAGE_1'),
				getSettingByType('MODEL_AI_1'),
			]);

			const descMsg = sysMsg1Setting?.setting || systemMessage1;
			const descModel = model1Setting?.setting || model1;
			const filterMsg = filterMsgSetting?.setting || systemMessage2;
			const filterModel = filterModelSetting?.setting || model2;
			const currentDefaultPrompt = defaultPromptSetting?.setting || '';

			// Hàm làm sạch tên bảng, loại bỏ các ký tự đặc biệt
			const cleanTableName = (name) => {
				if (!name) return 'Unknown_Table';
				return name
					.replace(/[:\\/\?\*\[\]]/g, '_')
					.replace(/\s+/g, '_')
					.replace(/_+/g, '_')
					.replace(/^_|_$/g, '')
					.substring(0, 50);
			};

			// Chuẩn bị toàn bộ dữ liệu gốc
			let originalData = {};
			if (isUsingUploadedData && uploadedFileData) {
				originalData = { ...uploadedFileData };
				console.log('Sử dụng dữ liệu từ file upload:', Object.keys(originalData));
			} else {
				fileNotes.forEach((fileNote, index) => {
					if (fileNote.rows && fileNote.rows.length > 0) {
						const originalName = fileNote.name || `Table_${fileNote.id}`;
						const cleanedName = cleanTableName(originalName);
						let finalName = cleanedName;
						let counter = 1;
						while (originalData[finalName]) {
							finalName = `${cleanedName}_${counter}`;
							counter++;
						}
						originalData[finalName] = fileNote.rows;
						console.log(`Mapped table: "${originalName}" -> "${finalName}"`);
					}
				});
			}
			if (Object.keys(originalData).length === 0) {
				message.error('Không có dữ liệu để phân tích');
				return;
			}
			console.log('Toàn bộ dữ liệu gốc: ', originalData);

			// --- BƯỚC 1: AI 1 (tạo mô tả) ---
			// Chuẩn bị dữ liệu cho AI 1 - sử dụng dữ liệu từ file nếu đang upload, ngược lại sử dụng dataAI1
			let dataForAI1 = dataAI1;
			if (isUsingUploadedData && uploadedFileData) {
				// Tạo cấu trúc dữ liệu tương tự dataAI1 từ uploadedFileData
				dataForAI1 = Object.entries(uploadedFileData).map(([tableName, data], index) => ({
					id: `upload_${index}`,
					name: tableName,
					tab: 'Uploaded Data',
					created_at: new Date().toISOString(),
					rowDemo: Array.isArray(data) ? data.slice(0, 30) : [],
					description: `Dữ liệu từ file upload - ${tableName}`,
					mother_table_id: null,
					table_id: `upload_${index}`,
				}));
			}
			
			console.log('Input AI 1 (tạo mô tả): ', { dataForAI1, prompt, descMsg, descModel });
			const ai2Result = await analyzeData(dataForAI1, prompt, descMsg, descModel);
			console.log('Output AI 1: ', ai2Result);

			// --- BƯỚC 2: Xử lý dữ liệu với analysis configs từ AI 1 (lọc dữ liệu) ---
			if (isUsingUploadedData && uploadedFileData) {
				// Xử lý dữ liệu từ file upload
				processedData = processDataWithAnalysisConfigsForUploadedData(uploadedFileData, ai2Result);
			} else {
				// Xử lý dữ liệu từ DB
				processedData = processDataWithAnalysisConfigs(fileNotes, ai2Result);
			}
			console.log('Dữ liệu sau xử lý: ', processedData);

			// --- BƯỚC 3: Tạo prompt nâng cao cho Power Drill ---
			const enhancedPrompt = createEnhancedPowerDrillPrompt(
				prompt, 
				originalData, 
				processedData, 
				ai2Result, 
				currentDefaultPrompt
			);
			console.log('Enhanced prompt for Power Drill:', enhancedPrompt);

			// --- BƯỚC 4: Gọi Power Drill với dữ liệu gốc và đã xử lý ---
			const powerdrillResult = await powerdrillAnalyzeData({
				data: originalData, // Gửi dữ liệu gốc
				prompt: enhancedPrompt,
				reportName: 'Báo cáo phân tích dữ liệu',
				sessionName: 'Power Drill Analysis'
			});
			console.log('Power Drill Result:', powerdrillResult);
			setResult(powerdrillResult.data.analysisResult);
			setViewingData(processedData);

			// Xử lý chart data nếu có
			if (powerdrillResult.data.analysisResult?.blocks) {
				const chartBlocks = powerdrillResult.data.analysisResult.blocks.filter(block => block.type === 'IMAGE');
				if (chartBlocks.length > 0) {
					const charts = chartBlocks.map((block, index) => ({
						tableName: block.content.title || `Biểu đồ ${index + 1}`,
						chartData: processedData,
						chartConfig: {
							chart_type: 'bar',
							x: Object.keys(processedData).find(key => key !== '_descriptions') || 'T1',
							y: 'value',
							labels: {
								x: 'Dữ liệu',
								y: 'Giá trị'
							}
						}
					}));
					setMultipleCharts(charts);
				}
			}

			const resultString = typeof powerdrillResult.data.analysisResult === 'object' 
				? JSON.stringify(powerdrillResult.data.analysisResult, null, 2)
				: powerdrillResult.data.analysisResult;

			const historyRes = await createAIPowerdrillHistory({
				quest: prompt,
				result: resultString,
				create_at: new Date().toISOString(),
				show: true,
				more_info: {
					filteredData: processedData, // Dữ liệu đã xử lý
					originalData: originalData, // Dữ liệu gốc
					dataAI1: isUsingUploadedData ? dataForAI1 : dataAI1, // Sử dụng dataForAI1 nếu upload file
					used_data: isUsingUploadedData ? [] : dataAI1.map(item => item.id),
					systemMessages: { descMsg, descModel, filterMsg, filterModel },
					analysisResult: powerdrillResult.data.analysisResult, // Keep original object in more_info
					ai2Result: ai2Result, // Lưu kết quả AI 1
					isUploadedData: isUsingUploadedData, // Đánh dấu là dữ liệu upload
					files: isUsingUploadedData ? uploadedFiles : [], // Lưu thông tin file
					charts: multipleCharts, // Lưu chart data
				},
				userCreated: currentUser.email,
			});
			const historyId = historyRes?.data?.id || historyRes?.id;

			await loadChatHistory();

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

	// Hàm tạo prompt nâng cao cho Power Drill
	const createEnhancedPowerDrillPrompt = (originalPrompt, originalData, processedData, ai2Result, defaultPrompt) => {
		// Tạo mô tả chi tiết về dữ liệu gốc
		const originalDataDescription = Object.entries(originalData).map(([tableName, data]) => {
			const rowCount = Array.isArray(data) ? data.length : 0;
			const columns = Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : [];
			return `- Bảng "${tableName}": ${rowCount} dòng, ${columns.length} cột (${columns.join(', ')})`;
		}).join('\n');

		// Tạo mô tả về dữ liệu đã xử lý
		const processedDataDescription = Object.entries(processedData).map(([tableName, data]) => {
			if (tableName === '_descriptions') return null;
			const rowCount = Array.isArray(data) ? data.length : 0;
			const columns = Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : [];
			const description = processedData._descriptions?.[tableName] || `Dữ liệu ${tableName}`;
			return `- ${description}: ${rowCount} dòng, ${columns.length} cột (${columns.join(', ')})`;
		}).filter(Boolean).join('\n');

		// Tạo thông tin về các bảng gốc được sử dụng
		const sourceTablesInfo = ai2Result?.matched_ids?.map(id => {
			// Kiểm tra xem có phải là dữ liệu upload không
			if (typeof id === 'string' && id.startsWith('upload_')) {
				const tableIndex = parseInt(id.replace('upload_', ''));
				const tableNames = Object.keys(originalData);
				const tableName = tableNames[tableIndex];
				return tableName ? `"${tableName}" (Upload)` : `Upload Table ${tableIndex}`;
			} else {
				// Dữ liệu từ DB
				const fileNote = fileNotes.find(note => note.id === id);
				return fileNote ? `"${fileNote.name}" (ID: ${id})` : `ID: ${id}`;
			}
		}).join(', ') || 'Không xác định';

		// Tạo mô tả về các cột hữu ích
		const usefulColumns = ai2Result?.useful_columns?.join(', ') || 'Tất cả các cột';

		// Tạo mô tả về các bộ lọc được áp dụng
		const filtersDescription = ai2Result?.filters ? 
			Object.entries(ai2Result.filters).map(([tableId, filterInfo]) => {
				let tableName;
				// Kiểm tra xem có phải là dữ liệu upload không
				if (tableId.startsWith('upload_')) {
					const tableIndex = parseInt(tableId.replace('upload_', ''));
					const tableNames = Object.keys(originalData);
					tableName = tableNames[tableIndex] || `Upload Table ${tableIndex}`;
				} else {
					// Dữ liệu từ DB
					const fileNote = fileNotes.find(note => note.id === tableId);
					tableName = fileNote ? fileNote.name : `Bảng ${tableId}`;
				}
				const conditions = Object.entries(filterInfo.conditions || {}).map(([col, val]) => {
					if (typeof val === 'object' && val.operator) {
						return `${col} ${val.operator} ${val.value}`;
					}
					return `${col} = ${val}`;
				}).join(', ');
				return `- ${tableName}: ${conditions}`;
			}).join('\n') : 'Không có bộ lọc';

		// Tạo mô tả về các cấu hình phân tích
		const analysisConfigsDescription = ai2Result?.analysis_configs?.map((config, index) => {
			let tableName;
			// Kiểm tra xem có phải là dữ liệu upload không
			if (typeof config.dataset === 'string' && config.dataset.startsWith('upload_')) {
				const tableIndex = parseInt(config.dataset.replace('upload_', ''));
				const tableNames = Object.keys(originalData);
				tableName = tableNames[tableIndex] || `Upload Table ${tableIndex}`;
			} else {
				// Dữ liệu từ DB
				const fileNote = fileNotes.find(note => note.id === config.dataset);
				tableName = fileNote ? fileNote.name : `Bảng ${config.dataset}`;
			}
			let configDesc = `- Cấu hình ${index + 1} (${tableName}): `;
			
			if (config.type === 'aggregation') {
				configDesc += `${config.operation} của ${config.target_column}`;
				if (config.group_by?.length > 0) {
					configDesc += ` theo ${config.group_by.join(', ')}`;
				}
			} else if (config.type === 'ranking') {
				configDesc += `${config.ranking_type} ${config.limit || 'N'} ${config.target_column}`;
				if (config.group_by?.length > 0) {
					configDesc += ` theo ${config.group_by.join(', ')}`;
				}
			} else if (config.type === 'filter') {
				configDesc += `Lọc dữ liệu`;
				if (config.operation === 'distinct' && config.group_by?.length > 0) {
					configDesc += ` duy nhất theo ${config.group_by.join(', ')}`;
				}
			}
			
			return configDesc;
		}).join('\n') || 'Không có cấu hình phân tích';

		// Tạo prompt nâng cao
		const enhancedPrompt = `
${defaultPrompt ? `${defaultPrompt}\n\n` : ''}YÊU CẦU PHÂN TÍCH: ${originalPrompt}

=== THÔNG TIN DỮ LIỆU GỐC ===
Các bảng dữ liệu gốc được sử dụng:
${originalDataDescription}

=== THÔNG TIN XỬ LÝ DỮ LIỆU ===
Bảng gốc được sử dụng: ${sourceTablesInfo}
Các cột hữu ích: ${usefulColumns}

Bộ lọc được áp dụng:
${filtersDescription}

Cấu hình phân tích:
${analysisConfigsDescription}

=== DỮ LIỆU ĐÃ XỬ LÝ ===
Các bảng dữ liệu đã được xử lý và tối ưu:
${processedDataDescription}

=== YÊU CẦU BÁO CÁO ===
Dựa trên thông tin trên, hãy tạo một báo cáo phân tích hoàn chỉnh bao gồm:

1. **Tóm tắt tổng quan**: Tóm tắt ngắn gọn về dữ liệu và mục tiêu phân tích
2. **Phân tích chi tiết**: 
   - Phân tích từng bảng dữ liệu đã xử lý
   - So sánh và đối chiếu giữa các bảng
   - Phát hiện các xu hướng, mẫu và điểm bất thường
3. **Kết luận và khuyến nghị**: 
   - Đưa ra các kết luận chính
   - Đề xuất các hành động cụ thể
   - Các khuyến nghị cho việc cải thiện

Hãy trình bày kết quả như một báo cáo chuyên nghiệp với cấu trúc rõ ràng, ngôn ngữ dễ hiểu và có các biểu đồ/visualization phù hợp để minh họa.

Lưu ý: Sử dụng cả dữ liệu gốc và dữ liệu đã xử lý để có cái nhìn toàn diện nhất.
`;

		return enhancedPrompt;
	};

	// Modify analyze function to use queue
	async function analyze() {
		let sm1 = systemMessage1;
		let sm2 = systemMessage2;
		let m1 = model1;
		let m2 = model2;
		
		const message1 = await getSettingByType('SYSTEM_MESSAGE_1');
		if (message1) sm1 = message1.setting;
		
		const message2 = await getSettingByType('SYSTEM_MESSAGE_2');
		if (message2) sm2 = message2.setting;
		
		const bot1 = await getSettingByType('MODEL_AI_1');
		if (bot1) m1 = bot1.setting;
		
		const bot2 = await getSettingByType('MODEL_AI_2');
		if (bot2) m2 = bot2.setting;
		
		if (!prompt.trim()) {
			return;
		}

		const queueItem = {
			prompt,
			sm1,
			sm2,
			m1,
			m2,
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
		setSelectedQueueItem(null)
		// Chỉ set viewingData về filteredData nếu không đang sử dụng dữ liệu upload
		if (!isUsingUploadedData) {
			setViewingData(filteredData);
		}
		setData([]); // Clear chart data
		setChartConfig(null); // Clear chart config
		setMultipleCharts([]); // Clear multiple charts
		analyze();
	};

	// When filteredData changes (e.g. after loadData), update viewingData if not viewing a history
	useEffect(() => {
		if (!selectedHistoryId && !selectedQueueItem && Object.keys(viewingData).length > 0 && !isUsingUploadedData) {
			setViewingData(filteredData);
		}
	}, [filteredData, selectedHistoryId, selectedQueueItem, isUsingUploadedData]);

	// Cleanup effect to prevent ag-grid errors
	useEffect(() => {
		return () => {
			// Cleanup when component unmounts
			setViewingData({});
			setFilteredData({});
			setData([]);
			setChartConfig(null);
			setMultipleCharts([]); // Clear multiple charts
			setSaveFileName('');
			setSaveFolder(undefined);
		};
	}, []);

	const handleContextMenu = (e, item) => {
		e.preventDefault();
		setContextMenuPosition({ x: e.clientX, y: e.clientY });
	};

	const handleDeleteHistory = async (id) => {
		try {
			await deleteAIPowerdrillHistory(id);
			await loadChatHistory();
			if (selectedHistoryId === id) {
				handleSelectHistory(null);
			}
		} catch (error) {
			console.error('Error deleting chat history:', error);
		}
	};

	// Handle uploaded files
	const handleFilesUploaded = (parsedData, filesMetadata = []) => {
		console.log('Files uploaded and parsed:', parsedData);
		console.log('Files metadata:', filesMetadata);
		
		setUploadedFileData(parsedData);
		setIsUsingUploadedData(true);
		setUploadedFiles(filesMetadata);
		
		// Clear current data selection
		setSelectedHistoryId(null);
		setSelectedQueueItem(null);
		setViewingData(parsedData);
		setData([]);
		setChartConfig(null);
		setMultipleCharts([]);
		
		message.success(`Đã tải lên thành công ${Object.keys(parsedData).length} bảng dữ liệu!`);
	};

	// Switch back to database data
	const handleUseDatabaseData = () => {
		setIsUsingUploadedData(false);
		setUploadedFileData(null);
		setUploadedFiles([]);
		setViewingData(filteredData);
		message.info('Chuyển về sử dụng dữ liệu từ cơ sở dữ liệu');
	};

	return (
		<div className={css.aiLayout}>
			{/* Sidebar */}
			<div className={css.aiSidebar}>
				<div className={css.aiSection}>
										<div className={css.aiSectionTitle}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px' }}>
							<h3>Câu hỏi</h3>
							<Button
								type='text'
								icon={<Settings size={16} />}
								onClick={() => setPromptModalOpen(true)}
								className={css.newQuestionButton}
								title="Cấu hình prompt mặc định"
							/>
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
									setIsUsingUploadedData(false);
									setUploadedFileData(null);
									setUploadedFiles([]);
								}}
								className={css.newQuestionButton}
							/>
						</div>
					</div>
					<div style={{
						display: 'flex',
						justifyContent: 'center',
					
						width: '100%',
						height: 'calc(100% - 140px)',
					}}>
						<Input.TextArea
							value={prompt}
							onChange={handlePromptChange}
							placeholder="Nhập câu hỏi phân tích dữ liệu của bạn..."
							style={{
								height: 'calc(100% - 30px)',
								margin: '12px 0',
								resize: 'none',
								width: '95%',
							}}
						/>
					</div>
					
					{/* File upload indicator */}
		
						<div style={{
					
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							
						
							width: '100%',
							height: '40px',
							opacity: isUsingUploadedData ? 1 : 0,
							pointerEvents: isUsingUploadedData ? 'auto' : 'none',
						}}>
							{isUsingUploadedData && uploadedFileData && (
							<div style={{		backgroundColor: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #b7eb8f', borderRadius: '6px',	fontSize: '12px',
								padding: '8px', height: '100%', width: '95%' }}>
								<span style={{ color: '#389e0d', fontWeight: '500', fontSize: '12px' }}>
									📁 Đang sử dụng {Object.keys(uploadedFileData).length} bảng từ file
									{uploadedFiles.length > 0 && ` (${uploadedFiles.length} file)`}
								</span>
								
								<Dropdown
									trigger={['click']}
									placement="bottomRight"
									menu={{
										items: [
											{
												key: 'files',
												type: 'group',
												label: 'File gốc',
												children: uploadedFiles.map((file, index) => ({
													key: `file-${index}`,
													label: (
														<div style={{
															display: 'flex',
															justifyContent: 'space-between',
															alignItems: 'center',
															minWidth: '200px'
														}}>
															<span style={{ fontSize: '11px' }}>📄 {file.name}</span>
															{file.url && (
																<a 
																	href={file.url} 
																	target="_blank" 
																	rel="noopener noreferrer"
																	style={{ color: '#1890ff', fontSize: '10px' }}
																	onClick={(e) => e.stopPropagation()}
																>
																	Tải về
																</a>
															)}
														</div>
													),
												}))
											},
											uploadedFiles.length > 0 && {
												type: 'divider'
											},
											{
												key: 'tables',
												type: 'group',
												label: 'Bảng dữ liệu',
												children: Object.keys(uploadedFileData).map((tableName, index) => ({
													key: `table-${index}`,
													label: (
														<span style={{ fontSize: '11px' }}>
															📊 {tableName} ({uploadedFileData[tableName]?.length || 0} dòng)
														</span>
													),
												}))
											}
										].filter(Boolean)
									}}
								>
									<Button 
										type="text" 
										size="small" 
										style={{ 
											color: '#389e0d',
											padding: '2px 6px',
											height: '20px',
											fontSize: '10px'
										}}
									>
										Chi tiết ▼
									</Button>
								</Dropdown>
							</div>
							)}
						</div>
						<div style={{ 
						display: 'flex', 
						justifyContent: 'space-between', 
						alignItems: 'center',
						width: '100%', 
						height: '50px',
						padding: '0 10px',
						
					}}>
					
							<Button
								type='text'
								size='small'
								icon={<Paperclip size={14} />}
								onClick={() => setUploadModalOpen(true)}
								style={{ 
									color: '#666',
									padding: '4px 8px',
									height: '28px',
									fontSize: '12px'
								}}
							>
								Tải file
							</Button>
							{isUsingUploadedData && (
								<Button
									type='text'
									size='small'
									onClick={handleUseDatabaseData}
									style={{ 
										color: '#1890ff',
										padding: '4px 8px',
										height: '28px',
										fontSize: '12px'
									}}
								>
									Dùng DB
								</Button>
							)}
							{isUsingUploadedData && (
								<Button
									type='text'
									size='small'
									danger
									onClick={() => {
										setIsUsingUploadedData(false);
										setUploadedFileData(null);
										setUploadedFiles([]);
										setViewingData(filteredData);
										message.info('Đã xóa file đã tải lên');
									}}
									style={{ 
										padding: '4px 8px',
										height: '28px',
										fontSize: '12px'
									}}
								>
									Xóa file
								</Button>
							)}
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
						renderItem={item => {
							const hasFiles = item.more_info?.files && item.more_info.files.length > 0;
							const menuItems = [
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
								}
							];

							// Add "Use files" option if this history has files
							if (hasFiles) {
								menuItems.unshift({
									key: 'useFiles',
									label: (
										<div 
											style={{ display: 'flex', alignItems: 'center', gap: 8 }}
											onClick={() => {
												// Use files from this history for new question
												setUploadedFiles(item.more_info.files);
												setIsUsingUploadedData(true);
												if (item.more_info?.originalData && item.more_info.isUploadedData) {
													setUploadedFileData(item.more_info.originalData);
													setViewingData(item.more_info.originalData);
												}
												// Clear current selection and prepare for new question
												setPrompt('');
												setResult(resultDefault);
												setSelectedHistoryId(null);
												setSelectedQueueItem(null);
												setData([]);
												setChartConfig(null);
												setMultipleCharts([]);
												message.success(`Đã tái sử dụng ${item.more_info.files.length} file từ lịch sử`);
											}}
										>
											<Paperclip size={16} />
											<span>Dùng file này</span>
										</div>
									),
								});
							}

							return (
								<Dropdown
									menu={{ items: menuItems }}
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
										}}>
											{hasFiles && (
												<span style={{ 
													color: '#1890ff', 
													marginRight: 4,
													fontSize: '12px'
												}}>
													📎
												</span>
											)}
											{item.quest}
										</div>

										<div className={css.aiDate}>
											{new Date(item.create_at).toLocaleString('vi-VN', {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
												hour: '2-digit',
												minute: '2-digit',
												second: '2-digit',
												hour12: false,
											})}
											{hasFiles && (
												<span style={{ 
													color: '#52c41a', 
													fontSize: '10px',
													marginLeft: '8px'
												}}>
													{item.more_info.files.length} file
												</span>
											)}
										</div>
									</Card>
								</Dropdown>
							);
						}}
					/>
				</div>
			</div>
			{/* Main */}
			<div className={css.aiMain}>
				<div className={css.allMainContainer}>
					{isLoading ? (
						<div style={{ textAlign: 'center', padding: '20px' }}>
							<Loading3DTower />
							<div style={{ marginTop: '10px' }}>Đang xử lý yêu cầu...</div>
						</div>
					) : (
						<>
						<div className={css.headerAnswer}>
							<h3>
								{/*AI Output*/}
							</h3>
							<div className={css.buttonHeader}>
															<div style={{
								width: '100%',
								display: 'flex',
								justifyContent: 'flex-end',
								alignItems: 'center',
								gap: 12,
							}}>
								<Popconfirm
									title="Lưu dữ liệu phân tích"
									placement="bottomRight"
									onConfirm={async () => {
										if (!saveFileName || !saveFolder) {
											message.error('Vui lòng nhập tên và chọn folder!');
											return;
										}
										
										try {
											// Xử lý nội dung từ result blocks theo thứ tự IMAGE và MESSAGE
											let content = '';
											let imageBlocks = [];
											let tableBlocks = [];
											
											if (result?.blocks) {
												// Lọc các blocks có group_name là "Conclusions" và type là MESSAGE hoặc IMAGE
												const orderedBlocks = result.blocks.filter(block => 
													(block.type === 'MESSAGE' || block.type === 'IMAGE') && 
													block.group_name === 'Conclusions'
												);
												
												// Tách riêng các loại blocks để lưu thông tin (tất cả blocks)
												imageBlocks = result.blocks.filter(block => block.type === 'IMAGE');
												tableBlocks = result.blocks.filter(block => block.type === 'TABLE');
												
												// Tạo content theo thứ tự MESSAGE và IMAGE từ Conclusions group
												content = orderedBlocks.map(block => {
													if (block.type === 'MESSAGE') {
														return block.content;
													} else if (block.type === 'IMAGE') {
														// Tạo thẻ img HTML cho image với title và url
														const title = block.content.title || 'Biểu đồ';
														const url = block.content.url || '';
														return `<img src="${url}" alt="${title}" title="${title}" style="max-width: 100%; height: auto; border: 1px solid #e8e8e8; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />`;
													}
													return '';
												}).join('\n\n');
												
												// Sử dụng marked để parse markdown sang HTML
												content = marked(content);
											} else {
												content = typeof result === 'string' ? marked(result) : JSON.stringify(result, null, 2);
											}
											
											// Tạo file mới với nội dung đã xử lý
											const newData = {
												name: saveFileName,
												tab: saveFolder,
												table: 'TiptapWithChart',
												user_create: currentUser?.email,
												created_at: createTimestamp(),
												url: content,
												show: true,
												chart: multipleCharts || [],
												info: { historyId: selectedHistoryId, hide: false },
											};
											
											const res = await createNewFileNotePad(newData);
											if (res.status === 201) {
												await updateFileNotePad({
													id: res.data.id,
													code: `Tiptap_${res.data.id}`,
												});
												message.success('Lưu dữ liệu phân tích thành công!');
												// Refresh data
												setLoadDataDuLieu(!loadDataDuLieu);
												// Reset form
												setSaveFileName('');
												setSaveFolder(undefined);
											} else {
												message.error('Có lỗi khi lưu dữ liệu!');
											}
										} catch (error) {
											console.error('Error saving analysis:', error);
											message.error('Có lỗi khi lưu dữ liệu!');
										}
									}}
									okText="Lưu"
									cancelText="Hủy"
									description={
										<div 
											style={{ minWidth: 300 }} 
										>
											<Input
												placeholder="Nhập tên dữ liệu"
												value={saveFileName}
												onChange={e => setSaveFileName(e.target.value)}
												style={{ marginBottom: 8 }}
											/>
											<Select
												placeholder="Chọn folder"
												value={saveFolder}
												onChange={setSaveFolder}
												style={{ width: '100%' }}
												options={tabs.map(tab => ({ value: tab.key, label: tab.label }))}
												showSearch
												optionFilterProp="label"
											/>
										</div>
									}
								>
									<Button type={'text'} onClick={() => {
										// Auto-fill default filename
										setSaveFileName(`Phân tích AI - ${new Date().toLocaleString('vi-VN')}`);
									}}> Lưu dữ liệu phân tích</Button>
								</Popconfirm>
								{isUsingUploadedData ? (
									<Button type={'text'} onClick={handleUseDatabaseData}>Dùng dữ liệu DB</Button>
								) : (
									<Button type={'text'} onClick={() => setModalOpen(true)}>Cấu hình dữ liệu</Button>
								)}
							</div>
							</div>
						</div>

						<div
							className={css.aiMainBottom}
						>
														<div className={css.aiAnswerBox}>
								<div className={css.aiAnswerContent}>
									{selectedQueueItem ? (
										<div style={{ textAlign: 'center', padding: '20px' }}>
									<Loading3DTower />
											<div style={{ marginTop: '10px' }}>Đang xử lý yêu cầu...</div>
										</div>
									) : (
										<>
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
																	await updateAIPowerdrillHistory(selectedHistoryId, { result: editedContent });
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
												<div >
													{result?.blocks ? (
														<>
															{/* Hiển thị theo blocks - chỉ MESSAGE và IMAGE từ group "Conclusions" */}
															{result.blocks
																.filter(block => 
																	(block.type === 'MESSAGE' || block.type === 'IMAGE') && 
																	block.group_name === 'Conclusions'
																)
																.map((block, index) => {
																	if (block.type === 'MESSAGE') {
																		return (
																			<div 
																				key={`message-${index}`} 
																				className={css.markedContent}
																				dangerouslySetInnerHTML={{ 
																					__html: DOMPurify.sanitize(marked(block.content)) 
																				}}
																			/>
																		);
																	} else if (block.type === 'IMAGE') {
																		return (
																			<div key={`image-${index}`} style={{ margin: '20px 0' }}>
																				<img 
																					src={block.content.url} 
																					alt={block.content.alt || block.content.title || 'Chart'} 
																					style={{ 
																						maxWidth: '100%', 
																						height: 'auto',
																						border: '1px solid #e8e8e8',
																						borderRadius: '8px',
																						boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
																					}} 
																				/>
																				{(block.content.caption || block.content.title) && (
																					<p style={{ 
																						textAlign: 'center', 
																						fontStyle: 'italic', 
																						color: '#666', 
																						marginTop: '8px',
																						fontSize: '14px'
																					}}>
																						{block.content.caption || block.content.title}
																					</p>
																				)}
																			</div>
																		);
																	}
																	return null;
																})
															}
														</>
													) : result?.aiAnswer ? (
														<div
															className={css.markedContent}
															dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(result.aiAnswer)) }}
														/>
													) : (
														<div
															className={css.markedContent}
															dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(result)) }}
														/>
													)}
												</div>
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
									paddingLeft:'10px',
									gap: 24,
									width: result?.blocks?.some(block => block.type === 'TABLE') ? '45%' : '0%',
									height: 'calc(90vh - 165px)',
									overflowY: 'auto',
								}}
							>
								{/* Chỉ hiển thị TABLE blocks từ powerdrill result (các bảng được AI tạo ra) */}
								{ result?.blocks?.some(block => block.type === 'TABLE') && (() => {
									// Filter các bảng để chỉ lấy 1 bảng cho mỗi tên
									const tableBlocks = result?.blocks?.filter(block => block.type === 'TABLE') || [];
									const uniqueTableBlocks = [];
									const seenNames = new Set();
									
									tableBlocks.forEach(tableBlock => {
										const tableName = tableBlock.content.name || `Bảng ${tableBlocks.indexOf(tableBlock) + 1}`;
										if (!seenNames.has(tableName)) {
											seenNames.add(tableName);
											uniqueTableBlocks.push(tableBlock);
										}
									});
									
									// Tạo items cho Collapse
									const collapseItems = uniqueTableBlocks.map((tableBlock, index) => ({
										key: `table-${index}`,
										label: (
											<span style={{
												color: '#0C6DC7',
												fontSize: '14px',
												fontWeight: '500',
											}}>
												{tableBlock.content.name || `Bảng ${index + 1}`}
											</span>
										),
										children: (
											<div>
												<TableViewer url={tableBlock.content.url} />
											</div>
										),
									}));
									
									return (
										<Collapse
											items={collapseItems}
											style={{
											
												border: 'none',

											}}
											className={css.collapseTable}
											expandIconPosition="end"
											ghost
										/>
									);
								})()}
							</div>
						</div>
				</> 
			)}				
				</div>
			</div>



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


			<UploadFileModal
				open={uploadModalOpen}
				onClose={() => setUploadModalOpen(false)}
				onFilesUploaded={handleFilesUploaded}
			/>



			<PowerDrillPromptModal
				open={promptModalOpen}
				onClose={() => {
					setPromptModalOpen(false);
					// Reload default prompt after saving
					loadSystemMessages();
				}}
			/>
		</div>
	);
} 
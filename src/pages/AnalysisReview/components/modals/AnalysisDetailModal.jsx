import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Input, message, Modal, Select, Space, Tooltip, Typography } from 'antd';
import {
	ArrowDownOutlined,
	ArrowUpOutlined,
	EditOutlined,
	RobotOutlined,
	SendOutlined,
	UserOutlined,
	SettingOutlined,
	PlusOutlined,
} from '@ant-design/icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { AgCharts } from 'ag-charts-react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import styles from './AnalysisDetailModal.module.css';
import css from '../../../Canvas/CongCu/CanvasWebPage/ContentWebPage/TipTap.module.css';
import { TiptapToolbar } from '../../../Canvas/CongCu/CanvasWebPage/ContentWebPage/TiptapToolbar.jsx';
import { EditorContent } from '@tiptap/react';
import { useEditor } from '../../../Canvas/CongCu/CanvasWebPage/ContentWebPage/useEditor';
import { updateDashBoardItem } from '../../../../apis/dashBoardItemService';
import { getKpiCalculatorById } from '../../../../apis/kpiCalculatorService';
import { fetchAllBusinessCategories } from '../../../../apis/businessCategoryService';
import { MODEL_AI_LIST_DB } from '../../../../AI_CONST.js';
import { aiChat, webSearchChat } from '../../../../apis/botService.jsx';
import { getSettingByType, createSetting, updateSetting } from '../../../../apis/settingService.jsx';
import {
	createAIChatHistoryList,
	deleteAIChatHistoryList,
	getAllAIChatHistoryList,
	updateAIChatHistoryList,
} from '../../../../apis/aiChatHistoryListService.jsx';
import Kpi2CalcInfoModal from './Kpi2CalcInfoModal.jsx';
import PinInput from '../../../../components/PinInput.jsx';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Hàm format số dạng 1000k, 1.5M
const formatNumberWithK = (value) => {
	if (typeof value !== 'number') {
		value = parseFloat(value);
	}
	if (isNaN(value) || value === 0) return '-';

	if (value >= 1000000) {
		return (value / 1000000).toFixed(1) + 'M';
	} else if (value >= 1000) {
		return (value / 1000).toFixed(1) + 'k';
	}
	return value.toString();
};

// Chart colors for data bars
const chartColors = ['#52c41a', '#1890ff', '#722ed1', '#eb2f96', '#fa8c16', '#fadb14', '#13c2c2', '#fa541c'];

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
	let barColor = '#52c41a'; // Green for positive values
	let textColor = 'inherit';

	if (numValue < 0) {
		barColor = '#ff4d4f'; // Red for negative values
		textColor = '#ff4d4f'; // Red text for negative values
	} else if (numValue > 0 && chartColors.length > 0) {
		// Use chart color system for positive values
		barColor = chartColors[columnIndex % chartColors.length];
		textColor = 'inherit';
	}

	// Calculate bar width based on absolute value and scale
	const absValue = Math.abs(numValue);
	const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue));
	const barWidth = (absValue / maxAbsValue) * 40; // Giảm từ 50% xuống 40% để nhỏ hơn

	return (<div style={{
		display: 'flex', alignItems: 'center', gap: '6px', width: '100%', height: '100%', padding: '2px 4px',
	}}>
		<div style={{
			flex: 1,
			height: '20px', // Giảm từ 25px xuống 20px
			backgroundColor: '#f0f0f0',
			borderRadius: '1px',
			overflow: 'hidden',
			position: 'relative',
			display: 'flex',
			alignItems: 'center',
		}}>
			{/* Zero line indicator */}
			<div style={{
				position: 'absolute',
				left: '50%',
				top: '0',
				bottom: '0',
				width: '1px', // Giảm từ 2px xuống 1px
				backgroundColor: '#d9d9d9',
				zIndex: 1,
			}} />

			{/* Bar for negative values (left side) */}
			{numValue < 0 && (
				<div style={{
					position: 'absolute',
					right: '50%',
					width: `${barWidth}%`,
					height: '100%',
					backgroundColor: barColor,
					borderRadius: '1px',
					transition: 'width 0.3s ease',
					opacity: 0.8, // Thêm opacity để nhẹ hơn
				}} />
			)}

			{/* Bar for positive values (right side) */}
			{numValue > 0 && (
				<div style={{
					position: 'absolute',
					left: '50%',
					width: `${barWidth}%`,
					height: '100%',
					backgroundColor: barColor,
					borderRadius: '1px',
					transition: 'width 0.3s ease',
					opacity: 0.8, // Thêm opacity để nhẹ hơn
				}} />
			)}
		</div>
		<div style={{
			minWidth: '50px', // Giảm từ 60px xuống 50px
			textAlign: 'right',
			fontSize: '11px', // Giảm từ 12px xuống 11px
			fontWeight: '500',
			color: textColor,
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

const AnalysisDetailModal = ({
	visible,
	onClose,
	analysis,
	item,
	onReanalyze,
	isAnalyzing = false,
	chartOptions = {},
	currentUser,
	onItemUpdate, // Thêm callback để cập nhật item trong list
	tableData = {}, // Thêm tableData để hiển thị dữ liệu bảng
	// PIN Security props
	setShowPinModal,
	savedPin,
	isPinVerified,
	setIsPinVerified,
	// Change PIN props
	setShowChangePinModal,
	// Setup PIN props
	setShowSetupPinModal,
	setNewPin,
	setConfirmPin,
	setSetupPinError,
}) => {

	
	// Function để kiểm tra xem note có nội dung thực sự không
	const hasNoteContent = (htmlContent) => {
		if (!htmlContent) return false;
		// Loại bỏ tất cả HTML tags và kiểm tra xem có text thực sự không
		const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
		return textContent.length > 0;
	};
	
	// State for Tiptap editor
	const [isEditMode, setIsEditMode] = useState(false);
	const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [fontMenuOpen, setFontMenuOpen] = useState(false);
	const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
	const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
	const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);

	// Local state để quản lý note content
	const [localNoteContent, setLocalNoteContent] = useState(item?.info?.note || '');

	// State để lưu trữ KPI data cho item type statistics
	const [kpiData, setKpiData] = useState(null);
	const [isLoadingKpi, setIsLoadingKpi] = useState(false);
	const [kpiCalculators, setKpiCalculators] = useState([]);

	// State để lưu AI model được chọn
	const [selectedAIModel, setSelectedAIModel] = useState('gpt-5-mini-2025-08-07');

	// State cho AI Chat functionality
	const [chatMessages, setChatMessages] = useState([]);
	const [inputMessage, setInputMessage] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const [useWebSearch, setUseWebSearch] = useState(false);

	// System message setting state
	const [isSysMsgModalOpen, setIsSysMsgModalOpen] = useState(false);
	const [systemMessageText, setSystemMessageText] = useState('');
	const [isSavingSystemMsg, setIsSavingSystemMsg] = useState(false);
	const [systemMsgSettingRecord, setSystemMsgSettingRecord] = useState(null);

	// Selection → Discuss in AI Chat
	const [selectedDiscussText, setSelectedDiscussText] = useState('');
	const [selectionBtnPos, setSelectionBtnPos] = useState({ x: 0, y: 0, show: false });

	// KPI2 Calculator Info Modal state
	const [showKpi2InfoModal, setShowKpi2InfoModal] = useState(false);

	// State để theo dõi việc mở modal System Message
	const [pendingSystemMessage, setPendingSystemMessage] = useState(false);


	const clearSelectionOverlay = useCallback(() => {
		setSelectionBtnPos(prev => ({ ...prev, show: false }));
	}, []);

	const handleSelectionMouseUp = useCallback((e) => {
		try {
			const sel = window.getSelection();
			if (!sel || sel.rangeCount === 0) {
				clearSelectionOverlay();
				return;
			}
			const text = sel.toString().trim();
			if (!text) {
				clearSelectionOverlay();
				return;
			}
			const range = sel.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			// Position button near selection (viewport coords)
			const x = Math.min(window.innerWidth - 120, Math.max(8, rect.right + 8));
			const y = Math.min(window.innerHeight - 40, Math.max(8, rect.top - 10));
			setSelectedDiscussText(text);
			setSelectionBtnPos({ x, y, show: true });
		} catch (err) {
			clearSelectionOverlay();
		}
	}, [clearSelectionOverlay]);

	// NOTE: handleDiscussMoreClick is declared after handleSendMessage to avoid TDZ issues
	const [chatHistoryId, setChatHistoryId] = useState(null);
	const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);

	// State để quản lý analysis trong modal (để cập nhật real-time)
	const [localAnalysis, setLocalAnalysis] = useState(analysis);

	// Setup Tiptap editor - must be called before any conditional returns
	const { editor } = useEditor();

	// Setup Tiptap editor for note viewing
	useEffect(() => {
		if (editor) {
			editor.setEditable(isEditMode);
			const content = localNoteContent || '<p style="color: #999; font-style: italic;">Chưa có ghi chú. Click vào icon edit để thêm ghi chú.</p>';
			editor.commands.setContent(content);
		}
	}, [editor, localNoteContent, isEditMode]);

	// Cập nhật localNoteContent khi item thay đổi
	useEffect(() => {
		setLocalNoteContent(item?.info?.note || '');
	}, [item?.info?.note]);

	// Cập nhật localAnalysis khi analysis prop thay đổi
	useEffect(() => {
		setLocalAnalysis(analysis);
	}, [analysis]);

	// Load KPI data khi item type là statistics
	useEffect(() => {
		const loadKpiData = async () => {
			if (item?.type === 'statistics' && item?.settings?.kpiCalculators && Array.isArray(item.settings.kpiCalculators)) {
				setIsLoadingKpi(true);
				try {
					// Load tất cả KPI calculators được chọn
					const kpiIds = item.settings.kpiCalculators;
					const kpiPromises = kpiIds.map(id => getKpiCalculatorById(id));
					const kpiResults = await Promise.all(kpiPromises);

					// Lọc ra những KPI có dữ liệu
					const validKpis = kpiResults.filter(kpi => kpi && kpi.tableData && Array.isArray(kpi.tableData) && kpi.tableData.length > 0);

					setKpiCalculators(validKpis);

					// Giữ lại kpiData cho backward compatibility
					if (validKpis.length > 0) {
						setKpiData(validKpis[0]);
					}
				} catch (error) {
					console.error('Error loading KPI data:', error);
				} finally {
					setIsLoadingKpi(false);
				}
			}
		};

		loadKpiData();
	}, [item?.type, item?.settings?.kpiCalculators]);


	// Load chat history từ database khi mở modal
	useEffect(() => {
		const loadChatHistory = async () => {
			if (!visible || !item?.id || !currentUser?.id) return;

			setIsLoadingChatHistory(true);
			try {
				// Tìm chat history cho item này và user hiện tại
				const allChatHistories = await getAllAIChatHistoryList();
				const existingChatHistory = allChatHistories.find(history =>
					history.info?.itemId === item.id &&
					history.user_create === currentUser.id &&
					history.show === true
				);

				if (existingChatHistory) {
					setChatHistoryId(existingChatHistory.id);
					// Load chat messages từ chatHistory
					const chatHistory = existingChatHistory.chatHistory || [];
					const messages = chatHistory.map((chat, index) => ({
						id: Date.now() + index + 1,
						type: chat.role === 'user' ? 'user' : 'assistant',
						content: chat.content,
						timestamp: new Date(chat.timestamp || Date.now()),
						citations: chat.citations || null,
					}));
					setChatMessages(messages);
				} else {
					// Nếu không có chat history, fallback về chats cũ trong item.analysis
					const existingChats = localAnalysis?.chats || [];
					const existingMessages = existingChats.map((chat, index) => ({
						id: Date.now() + index + 1,
						type: chat.role === 'user' ? 'user' : 'assistant',
						content: chat.content,
						timestamp: new Date(chat.timestamp || Date.now()),
					}));
					setChatMessages(existingMessages);
				}
			} catch (error) {
				console.error('Error loading chat history:', error);
				// Fallback về chats cũ nếu có lỗi
				const existingChats = localAnalysis?.chats || [];
				const existingMessages = existingChats.map((chat, index) => ({
					id: Date.now() + index + 1,
					type: chat.role === 'user' ? 'user' : 'assistant',
					content: chat.content,
					timestamp: new Date(chat.timestamp || Date.now()),
				}));
				setChatMessages(existingMessages);
			} finally {
				setIsLoadingChatHistory(false);
			}
		};

		loadChatHistory();
	}, [visible, item?.id, currentUser?.id, localAnalysis?.chats]);

	// Load system message setting on modal open
	useEffect(() => {
		const loadSystemMessage = async () => {
			if (!visible) return;
			try {
				const data = await getSettingByType('SYSTEM_MESS_AI_CHAT_DETAIL_DASHBOARD');
				if (data) {
					setSystemMsgSettingRecord(data);
					const content = typeof data.setting === 'string' ? data.setting : (data.setting?.message || data.setting?.content || '');
					setSystemMessageText(content || '');
				}
			} catch (e) {
				console.warn('Cannot load system message setting:', e);
			}
		};
		loadSystemMessage();
	}, [visible]);


	// Memoize MODEL_AI_LIST để tránh re-render không cần thiết
	const memoizedModelList = useMemo(() => MODEL_AI_LIST_DB, []);

	// Scroll to bottom khi có tin nhắn mới
	useEffect(() => {
		if (chatMessages.length > 0) {
			const chatContainer = document.querySelector('[data-chat-container]');
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}
	}, [chatMessages]);

	// Debug: Log khi selectedAIModel thay đổi
	useEffect(() => {
		console.log('selectedAIModel changed to:', selectedAIModel);
	}, [selectedAIModel]);

	// Debug: Log khi item thay đổi
	useEffect(() => {
		console.log('item changed:', item?.id);
	}, [item?.id]);

	// Đảm bảo selectedAIModel luôn có giá trị hợp lệ
	useEffect(() => {
		if (!selectedAIModel || !memoizedModelList.find(model => model.value === selectedAIModel)) {
			const defaultModel = memoizedModelList[0]?.value || 'gpt-5-mini-2025-08-07';
			setSelectedAIModel(defaultModel);
			console.log('Reset selectedAIModel to default:', defaultModel);
		}
	}, [selectedAIModel, memoizedModelList]);

	if (!visible || !analysis || !item) return null;

	// Configure marked options for better rendering
	marked.setOptions({
		breaks: true, // Convert line breaks to <br>
		gfm: true, // GitHub Flavored Markdown
	});

	// Function to render markdown content safely
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


	const toggleEditMode = () => {
		setIsEditMode(!isEditMode);
	};

	// Hàm xử lý mở modal System Message với kiểm tra PIN
	const handleOpenSystemMessageModal = () => {
		if (savedPin && savedPin.trim() !== '') {
			// Có PIN → Yêu cầu nhập PIN trước
			setPendingSystemMessage(true);
			setShowPinModal(true);
			setIsPinVerified(false);
		} else {
			// Không có PIN → Bắt buộc cài đặt PIN trước
			setShowSetupPinModal(true);
			setNewPin('');
			setConfirmPin('');
			setSetupPinError('');
		}
	};

	// Xử lý sau khi verify PIN thành công
	useEffect(() => {
		if (isPinVerified && pendingSystemMessage) {
			// Mở modal System Message sau khi verify PIN
			setIsSysMsgModalOpen(true);
			setPendingSystemMessage(false);
		}
	}, [isPinVerified, pendingSystemMessage]);



	const handleSaveNote = async () => {
		try {
			const updatedNote = editor.getHTML();

			// Cập nhật local state trước
			setLocalNoteContent(updatedNote);

			// Cập nhật database
			await updateDashBoardItem({
				...item,
				info: {
					...item.info,
					note: updatedNote,
				},
			});

			// Cập nhật item trong list nếu có callback
			if (onItemUpdate) {
				const updatedItem = {
					...item,
					info: {
						...item.info,
						note: updatedNote,
					},
				};
				onItemUpdate(updatedItem);
			}

			setIsEditMode(false);
		} catch (error) {
			console.error('Error saving note:', error);
			// Có thể thêm thông báo lỗi cho user ở đây
		}
	};

	// Hàm xử lý gửi tin nhắn chat
	const handleSendMessage = async () => {
		if (!inputMessage.trim()) return;

		// Kiểm tra giới hạn 5 tin nhắn người dùng (chỉ đếm tin nhắn hiển thị)
		const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isSystem);
		if (userMessages.length >= 5) {
			message.warning('Bạn đã đạt giới hạn 5 tin nhắn. Vui lòng reset chat để tiếp tục.');
			return;
		}

		const userMessage = {
			id: Date.now(),
			type: 'user',
			content: inputMessage,
			timestamp: new Date(),
		};

		// Thêm tin nhắn user vào chat
		setChatMessages(prev => [...prev, userMessage]);
		setInputMessage('');
		setIsTyping(true);

		try {
			// Chuẩn bị context đầy đủ cho AI
			const fullContext = [];

			// Thêm item.info nếu có
			if (item?.info) {
				fullContext.push({
					role: 'user',
					content: `Thông tin item: ${JSON.stringify(item.info, null, 2)}`,
				});
			}

			// Thêm analysis.prompt nếu có
			if (localAnalysis?.prompt) {
				fullContext.push({
					role: 'user',
					content: `Prompt phân tích: ${localAnalysis.prompt}`,
				});
			}

			// Thêm analysis.answer nếu có
			if (localAnalysis?.answer) {
				fullContext.push({
					role: 'assistant',
					content: localAnalysis.answer,
				});
			}

			// Thêm chat history (loại bỏ tin nhắn hệ thống)
			const chatHistory = chatMessages
				.filter(msg => !msg.isSystem)
				.map(msg => ({
					role: msg.type === 'user' ? 'user' : 'assistant',
					content: msg.content,
				}));

			// Kết hợp context và chat history
			const fullChatHistory = [...fullContext, ...chatHistory];

			// Thêm tin nhắn user mới
			fullChatHistory.push({
				role: 'user',
				content: inputMessage,
			});

			let response;
			if (useWebSearch) {
				// Sử dụng webSearchChat nếu bật websearch
				try {
					const webSearchResponse = await webSearchChat({
						prompt: inputMessage,
						model: selectedAIModel,
						chat_history: fullChatHistory,
					});
					response = {
						response: webSearchResponse.ai_response || webSearchResponse.message || 'Không có phản hồi từ websearch',
						success: webSearchResponse.success,
						citations: webSearchResponse.citations,
					};
				} catch (webSearchError) {
					console.error('Lỗi websearch, fallback về aiChat:', webSearchError);
					// Fallback về aiChat nếu websearch lỗi
					response = await aiChat(fullChatHistory, inputMessage, selectedAIModel, {
						name: 'assistant',
						model: selectedAIModel,
						systemMessage: '',
					});
				}
			} else {
				// Sử dụng aiChat bình thường
				response = await aiChat(fullChatHistory, inputMessage, selectedAIModel, {
					name: 'assistant',
					model: selectedAIModel,
					systemMessage: (systemMessageText && systemMessageText.trim()) ? systemMessageText.trim() : '',
				});
			}

			const assistantMessage = {
				id: Date.now() + 1,
				type: 'assistant',
				content: response.response || response.message || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
				timestamp: new Date(),
				citations: response.citations || null,
			};

			// Thêm tin nhắn AI vào chat
			setChatMessages(prev => [...prev, assistantMessage]);

			// Lưu chat history vào database
			const newChatHistory = [
				...chatHistory, // Chỉ lưu chat history thực sự
				{ role: 'user', content: inputMessage, timestamp: new Date().toISOString() },
				{ role: 'assistant', content: assistantMessage.content, timestamp: new Date().toISOString(), citations: assistantMessage.citations },
			];

			try {
				if (chatHistoryId) {
					// Cập nhật chat history hiện có
					await updateAIChatHistoryList({
						id: chatHistoryId,
						chatHistory: newChatHistory,
						user_update: currentUser.id,
					});
				} else {
					// Tạo chat history mới
					const newChatHistoryData = {
						info: {
							itemId: item.id,
							itemName: item.name,
							analysisId: localAnalysis?.id,
						},
						chatHistory: newChatHistory,
						type: 'analysis_chat',
						user_create: currentUser.id,
						show: true,
					};

					const createdHistory = await createAIChatHistoryList(newChatHistoryData);
					setChatHistoryId(createdHistory.id);
				}
			} catch (error) {
				console.error('Error saving chat history:', error);
				// Fallback: lưu vào item.analysis.chats như cũ
				const updatedItem = {
					...item,
					analysis: {
						...localAnalysis,
						chats: newChatHistory,
					},
				};

				await updateDashBoardItem(updatedItem);

				// Cập nhật item trong list nếu có callback
				if (onItemUpdate) {
					onItemUpdate(updatedItem);
				}
			}

		} catch (error) {
			console.error('Error in chat:', error);
			// Thêm tin nhắn lỗi
			const errorMessage = {
				id: Date.now() + 1,
				type: 'assistant',
				content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.',
				timestamp: new Date(),
			};
			setChatMessages(prev => [...prev, errorMessage]);
			message.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
		} finally {
			setIsTyping(false);
		}
	};

	// Selection → discuss button click (declared after handleSendMessage)
	const handleDiscussMoreClick = useCallback(() => {
		if (!selectedDiscussText) return;
		setInputMessage(selectedDiscussText);
		setTimeout(() => {
			handleSendMessage();
		}, 0);
		setSelectedDiscussText('');
		clearSelectionOverlay();
		try { const sel = window.getSelection(); sel && sel.removeAllRanges && sel.removeAllRanges(); } catch (_) { }
	}, [selectedDiscussText, handleSendMessage, clearSelectionOverlay]);

	// Hàm reset chat history
	const handleResetChat = async () => {
		try {
			// Xác nhận trước khi reset
			const confirmed = window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat? Hành động này không thể hoàn tác.');
			if (!confirmed) return;

			// Giữ lại tin nhắn hệ thống và tin nhắn ban đầu
			const systemMessages = chatMessages.filter(msg => msg.isSystem || msg.isInitial);

			// Cập nhật state
			setChatMessages(systemMessages);

			// Xóa chat history trong database
			if (chatHistoryId) {
				try {
					await deleteAIChatHistoryList(chatHistoryId);
					setChatHistoryId(null);
					message.success('Đã xóa lịch sử chat thành công!');
				} catch (error) {
					console.error('Error deleting chat history:', error);
					// Fallback: xóa chats trong item.analysis
					const updatedItem = {
						...item,
						analysis: {
							...localAnalysis,
							chats: [],
						},
					};

					await updateDashBoardItem(updatedItem);

					// Cập nhật item trong list nếu có callback
					if (onItemUpdate) {
						onItemUpdate(updatedItem);
					}
					message.success('Đã xóa lịch sử chat thành công!');
				}
			} else {
				// Nếu không có chatHistoryId, xóa chats trong item.analysis
				const updatedItem = {
					...item,
					analysis: {
						...localAnalysis,
						chats: [],
					},
				};

				await updateDashBoardItem(updatedItem);

				// Cập nhật item trong list nếu có callback
				if (onItemUpdate) {
					onItemUpdate(updatedItem);
				}
				message.success('Đã xóa lịch sử chat thành công!');
			}
		} catch (error) {
			console.error('Error resetting chat:', error);
			message.error('Không thể xóa lịch sử chat. Vui lòng thử lại.');
		}
	};

	// Save system message setting
	const handleSaveSystemMessage = async () => {
		try {
			setIsSavingSystemMsg(true);
			const payload = {
				id: systemMsgSettingRecord?.id,
				type: 'SYSTEM_MESS_AI_CHAT_DETAIL_DASHBOARD',
				setting: systemMessageText,
			};
			if (payload.id) {
				const res = await updateSetting(payload);
				setSystemMsgSettingRecord(res);
			} else {
				const res = await createSetting({ type: payload.type, setting: payload.setting });
				setSystemMsgSettingRecord(res);
			}
			message.success('Đã lưu System Message cho AI Chat');
			setIsSysMsgModalOpen(false);
		} catch (e) {
			console.error('Error saving system message:', e);
			message.error('Không thể lưu System Message');
		} finally {
			setIsSavingSystemMsg(false);
		}
	};

	// Hàm xử lý key press trong input
	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	// Responsive width calculation
	const getModalWidth = () => {
		if (window.innerWidth <= 480) return '95vw';
		if (window.innerWidth <= 768) return '90vw';
		if (window.innerWidth <= 1024) return '95vw';
		return '95vw';
	};

	// Responsive height calculation
	const getModalHeight = () => {
		if (window.innerWidth <= 480) return '100vh';
		if (window.innerWidth <= 768) return '95vh';
		return '80vh';
	};

	// Responsive layout styles
	const getLayoutStyles = () => {
		if (window.innerWidth <= 768) {
			// Mobile layout - stack vertically
			return {
				container: {
					padding: window.innerWidth <= 480 ? '8px' : '12px 0',
					display: 'flex',
					flexDirection: 'column',
					gap: window.innerWidth <= 480 ? 8 : 12,
					height: '100%',
					minHeight: 0,
				},
				leftColumn: {
					display: 'flex',
					flexDirection: 'column',
					gap: 12,
					height: 'auto',
					width: '100%',
				},
				dataTableContainer: {
					backgroundColor: '#fff',
					borderRadius: '8px',
					border: '1px solid #e8e8e8',
					overflow: 'visible',
					display: 'flex',
					flexDirection: 'column'
				},
				chartContainer: {
					backgroundColor: '#fff',
					borderRadius: '8px',
					border: '1px solid #e8e8e8',
					overflow: 'hidden',
					minHeight: window.innerWidth <= 480 ? '180px' : '200px',
					display: 'flex',
					flexDirection: 'column'
				},
				notesContainer: {
					backgroundColor: '#fff',
					borderRadius: '8px',
					border: '1px solid #e8e8e8',
					overflow: 'hidden',
					minHeight: window.innerWidth <= 480 ? '120px' : '150px',
					display: 'flex',
					flexDirection: 'column'
				},
				analysisContainer: {
					flex: 1,
					minHeight: window.innerWidth <= 480 ? '180px' : '200px',
					overflow: 'auto',
					height: 'auto',
					backgroundColor: '#fff',
					borderRadius: '8px',
					border: '1px solid #e8e8e8',
					display: 'flex',
					flexDirection: 'column'
				},
				aiChatContainer: {
					flex: 1,
					minHeight: window.innerWidth <= 480 ? '180px' : '200px',
					overflow: 'auto',
					height: 'auto',
					backgroundColor: '#fff',
					borderRadius: '8px',
					border: '1px solid #e8e8e8',
					display: 'flex',
					flexDirection: 'column'
				}
			};
		} else {
			// Desktop/tablet layout - side by side
			return {
				container: {
					padding: '16px 0',
					display: 'flex',
					gap: 16,
					height: '100%',
					minHeight: 0,
				},
				leftColumn: {
					display: 'flex',
					flexDirection: 'column',
					gap: 16,
					height: '100%',
					flexShrink: 0,
					width: '41%',
					minHeight: '100%',
					maxHeight: '100%',
					overflow: 'auto',
					padding: '16px',
				},
				dataTableContainer: {
					backgroundColor: '#fff',
					borderRadius: '8px',
					border: '1px solid #e8e8e8',
					overflow: 'hidden',
					minHeight: '400px',
					maxHeight: '400px',
					display: 'flex',
					flexDirection: 'column'
				},
				chartContainer: {
					backgroundColor: '#fff',
					borderRadius: '8px',
					border: '1px solid #e8e8e8',
					overflow: 'hidden',
					minHeight: '500px',
					maxHeight: '500px',
					display: 'flex',
					flexDirection: 'column'
				},
				notesContainer: {
					backgroundColor: '#fff',
					borderRadius: '8px',
					border: '1px solid #e8e8e8',
					overflow: 'visible',
					display: 'flex',
					flexDirection: 'column',
					marginBottom: '16px'
				},
				analysisContainer: {
					flex: 1,
					minHeight: 0,
					overflow: 'auto',
					height: '100%',
					backgroundColor: '#fff',
					borderRadius: '8px',
					border: '1px solid #e8e8e8',
					display: 'flex',
					flexDirection: 'column',
				},
				aiChatContainer: {
					minHeight: 0,
					overflow: 'auto',
					height: '100%',
					backgroundColor: '#fff',
					borderRadius: '8px',
					border: '1px solid #e8e8e8',
					display: 'flex',
					flexDirection: 'column',
					width: '27%',
				},
			};
		}
	};

	const layoutStyles = getLayoutStyles();

	return (
		<>
			<Modal
				title={
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{
							fontSize: window.innerWidth <= 480 ? '14px' : '16px',
							fontWeight: 500
						}}>
							Phân tích AI - {item.name}
						</span>
					</div>
				}
				open={visible}
				onCancel={onClose}
				footer={[
					<div key='reanalyze-container' style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
						{currentUser.isSuperAdmin &&
							<Select
								value={selectedAIModel}
								onChange={setSelectedAIModel}
								style={{
									width: 160,
									fontSize: '11px',
								}}
								placeholder="Chọn AI"
								disabled={isAnalyzing}
							>
								{memoizedModelList.map(model => (
									<Option key={model.value} value={model.value}>
										{model.name}
									</Option>
								))}
							</Select>
						}
						{(currentUser.isSuperAdmin || currentUser.isAdmin || currentUser.isEditor) &&
							<Button
								key='reanalyze'
								type='primary'
								loading={isAnalyzing}
								onClick={() => onReanalyze(selectedAIModel)}
								size={window.innerWidth <= 480 ? 'small' : 'middle'}
							>
								{isAnalyzing ? 'Đang phân tích...' : 'Phân tích lại'}
							</Button>}
					</div>,
				]}
				width={getModalWidth()}
				bodyStyle={{
					height: getModalHeight(),
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden',
					padding: window.innerWidth <= 480 ? '0' : '16px'
				}}
				centered={true}
			>
				<div style={layoutStyles.container}>
					{/* Left column: Data Table, Chart and Notes */}
					<div style={layoutStyles.leftColumn}>

						{/* Chart */}
						<div style={layoutStyles.chartContainer}>
							{chartOptions[item.id] && (
								<>
									<div style={{
										padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px',
										borderBottom: '1px solid #f0f0f0',
										backgroundColor: '#fafafa',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										gap: 8
									}}>
										<Title level={5} style={{
											margin: 0,
											fontSize: window.innerWidth <= 480 ? '12px' : '14px',
											color: '#262626'
										}}>
											Biểu đồ
										</Title>
										{item.type === 'chart' && (
											<Tooltip title="Xem thành phần">
												<Button
													size={'small'}
													onClick={(e) => {
														e.stopPropagation();
														setShowKpi2InfoModal(true);
													}}
													disabled={!item?.idData}
												>
													Xem thành phần
												</Button>
											</Tooltip>
										)}
									</div>
									<div style={{
										flex: 1,
										overflow: 'hidden',
										width: '100%',
										height: '100%',
										display: 'flex',
										flexDirection: 'column'
									}}>
										<AgCharts
											options={chartOptions[item.id]}
											style={{
												width: '100%',
												height: '100%',
												flex: 1
											}}
										/>
									</div>
								</>
							)}
							{/* Table Data Preview */}
							{(item.type === 'table') && (
								<div style={{ marginBottom: window.innerWidth <= 480 ? '12px' : '20px', padding: 8 }}>
									<Title level={5} style={{
										marginBottom: window.innerWidth <= 480 ? '8px' : '12px',
										fontSize: window.innerWidth <= 480 ? '12px' : '14px',
										pading: 8,
									}}>
										{item.type === 'table' ? 'Dữ liệu bảng' :
											item.type === 'table_chart' ? 'Dữ liệu bảng biểu đồ' :
												'Dữ liệu bảng biểu đồ 2'}
									</Title>
									<div style={{
										backgroundColor: '#fff',
										borderRadius: '8px',
										border: '1px solid #e8e8e8',
										overflow: 'hidden',
										height: '350px', // Cố định chiều cao 300px cho tất cả
									}}>
										{tableData[item.id] && Array.isArray(tableData[item.id]) && tableData[item.id].length > 0 ? (
											<div style={{ width: '100%', height: '100%' }} className={'ag-theme-quartz'}>
												<AgGridReact
													rowData={tableData[item.id]}
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
																sortable: true,
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
																	sortable: true,
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
															// Fallback to auto-generated columns if no displayColumns specified
															const data = tableData[item.id] || [];
															if (data && data.length > 0) {
																const firstRow = data[0];
																Object.keys(firstRow).forEach(key => {
																	if (key !== 'rowId') { // Skip rowId column
																		columns.push({
																			field: key,
																			headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
																			width: 150,
																			resizable: true,
																			sortable: true,
																			filter: true,
																			cellStyle: { fontSize: '12px' },
																			cellRenderer: (params) => {
																				const value = params.value;
																				if (typeof value === 'number') {
																					return formatNumberWithK(value);
																				}
																				return value || '-';
																			}
																		});
																	}
																});
															}
														}

														return columns;
													})()}
													domLayout="normal" // Thay đổi từ autoHeight sang normal để có scroll
													rowSelection="multiple"
													animateRows={true}
													style={{ width: '100%', height: '100%' }}
													defaultColDef={{
														sortable: true,
														filter: true,
														resizable: true,
														suppressHeaderMenuButton: true
													}}
												/>
											</div>
										) : item?.data && Array.isArray(item.data) && item.data.length > 0 ? (
											<div style={{ width: '100%', height: '100%' }}
												className="ag-theme-quartz" >
												<AgGridReact
													rowData={item.data}
													columnDefs={(() => {
														if (item.data && item.data.length > 0) {
															const firstRow = item.data[0];
															return Object.keys(firstRow).map(key => ({
																field: key,
																headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
																sortable: true,
																filter: true,
																resizable: true,
																width: 150, // Thay đổi từ flex sang width cố định
																cellRenderer: (params) => {
																	const value = params.value;
																	if (typeof value === 'number') {
																		return formatNumberWithK(value);
																	}
																	return value || '-';
																}
															}));
														}
														return [];
													})()}
													domLayout="normal" // Thay đổi từ autoHeight sang normal
													rowSelection="multiple"
													animateRows={true}
													enableCellTextSelection={true}
													style={{ width: '100%', height: '100%' }}
													className="ag-theme-quartz" // Đảm bảo sử dụng theme quartz
													defaultColDef={{
														sortable: true,
														filter: true,
														resizable: true,
														suppressHeaderMenuButton: true // Thêm suppressHeaderMenuButton
													}}
												/>
											</div>
										) : item?.settings?.tableData && Array.isArray(item.settings.tableData) && item.settings.tableData.length > 0 ? (
											<div style={{ width: '100%', height: '100%' }}
												className="ag-theme-quartz" >
												<AgGridReact
													rowData={item.settings.tableData}
													columnDefs={(() => {
														if (item.settings.tableData && item.settings.tableData.length > 0) {
															const firstRow = item.settings.tableData[0];
															return Object.keys(firstRow).map(key => ({
																field: key,
																headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
																sortable: true,
																filter: true,
																resizable: true,
																flex: 1,
																minWidth: 100,
																cellRenderer: (params) => {
																	const value = params.value;
																	if (typeof value === 'number') {
																		return formatNumberWithK(value);
																	}
																	return value || '-';
																}
															}));
														}
														return [];
													})()}
													domLayout="autoHeight"
													rowSelection="multiple"
													animateRows={true}
													enableCellTextSelection={true}
													style={{ width: '100%', height: '100%' }}
													// className="ag-theme-quartz"
													defaultColDef={{
														sortable: true,
														filter: true,
														resizable: true,
														flex: 1,
													}}
												/>
											</div>
										) : (
											<div style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												height: '200px',
												backgroundColor: '#fafafa',
												borderRadius: '6px',
												border: '1px dashed #d9d9d9',
												margin: '16px'
											}}>
												<div style={{ textAlign: 'center', color: '#8c8c8c' }}>
													<Text type='secondary' style={{
														fontSize: window.innerWidth <= 480 ? '11px' : '12px'
													}}>
														Không có dữ liệu bảng để hiển thị
													</Text>
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Chart Data Preview for comparison and chart types */}
							{(item.type === 'comparison' || item.type === 'chart') && !chartOptions[item.id] && (
								<div style={{ marginBottom: window.innerWidth <= 480 ? '12px' : '20px' }}>
									<Title level={5} style={{
										marginBottom: window.innerWidth <= 480 ? '8px' : '12px',
										fontSize: window.innerWidth <= 480 ? '12px' : '14px'
									}}>
										{item.type === 'comparison' ? 'Dữ liệu so sánh' : 'Dữ liệu biểu đồ'}
									</Title>
									<div style={{
										backgroundColor: '#fff',
										borderRadius: '8px',
										border: '1px solid #e8e8e8',
										overflow: 'hidden',
										maxHeight: window.innerWidth <= 480 ? '300px' : '400px',
									}}>
										{tableData[item.id] && Array.isArray(tableData[item.id]) && tableData[item.id].length > 0 ? (
											<div style={{ width: '100%', height: '100%' }}>
												<AgGridReact
													rowData={tableData[item.id]}
													columnDefs={(() => {
														if (tableData[item.id] && tableData[item.id].length > 0) {
															const firstRow = tableData[item.id][0];
															return Object.keys(firstRow).map(key => ({
																field: key,
																headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
																sortable: true,
																filter: true,
																resizable: true,
																flex: 1,
																minWidth: 100,
																cellRenderer: (params) => {
																	const value = params.value;
																	if (typeof value === 'number') {
																		return formatNumberWithK(value);
																	}
																	return value || '-';
																}
															}));
														}
														return [];
													})()}
													domLayout="autoHeight"
													rowSelection="multiple"
													animateRows={true}
													enableCellTextSelection={true}
													style={{ width: '100%', height: '100%' }}
													// className="ag-theme-quartz"
													defaultColDef={{
														sortable: true,
														filter: true,
														resizable: true,
														flex: 1,
														minWidth: 100,
													}}
												/>
											</div>
										) : (
											<div style={{
												backgroundColor: '#fff',
												borderRadius: '8px',
												border: '1px solid #e8e8e8',
												padding: window.innerWidth <= 480 ? '12px' : '16px',
												maxHeight: window.innerWidth <= 480 ? '200px' : '300px',
												overflow: 'auto',
											}}>
												<Text type='secondary' style={{
													fontSize: window.innerWidth <= 480 ? '11px' : '12px'
												}}>
													{item.type === 'comparison'
														? 'Dữ liệu so sánh sẽ được phân tích bởi AI để đưa ra insights và nhận xét chi tiết.'
														: 'Dữ liệu biểu đồ sẽ được phân tích bởi AI để đưa ra insights và nhận xét chi tiết.'
													}
												</Text>
											</div>
										)}
									</div>
								</div>
							)}

							{/* KPI Statistics Data Display */}
							{item.type === 'statistics' && (
								<div style={{ marginBottom: window.innerWidth <= 480 ? '12px' : '20px', padding: 16 }}>
									<Title level={5} style={{
										marginBottom: window.innerWidth <= 480 ? '8px' : '12px',
										fontSize: window.innerWidth <= 480 ? '12px' : '14px'
									}}>
										KPI Statistics Data
									</Title>
									{isLoadingKpi ? (
										<div style={{
											backgroundColor: '#fff',
											borderRadius: '8px',
											border: '1px solid #e8e8e8',
											padding: window.innerWidth <= 480 ? '12px' : '16px',
											textAlign: 'center',
											color: '#8c8c8c'
										}}>
											<Text type='secondary' style={{
												fontSize: window.innerWidth <= 480 ? '11px' : '12px'
											}}>
												Đang tải dữ liệu KPI...
											</Text>
										</div>
									) : kpiCalculators && kpiCalculators.length > 0 ? (
										<div style={{
											backgroundColor: '#fff',
											borderRadius: '8px',
											overflow: 'hidden',
											maxHeight: window.innerWidth <= 480 ? '300px' : '400px',
										}}>
											{(() => {
												const kpiCalculatorIds = item.settings?.kpiCalculators || [];
												const selectedKpiCalculators = kpiCalculatorIds.map(id =>
													kpiCalculators.find(k => k.id === id)
												).filter(Boolean);

												if (selectedKpiCalculators.length === 0) {
													return (
														<div style={{
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															height: '100%',
															backgroundColor: '#fafafa',
															borderRadius: '6px',
															border: '1px dashed #d9d9d9',
														}}>
															<div style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>
																Không có KPI Calculator nào được chọn
															</div>
														</div>
													);
												}

												return (
													<div style={{ width: '100%', height: '320px', overflowY: 'auto' }}>
														{selectedKpiCalculators.map((kpi, index) => (
															<div key={kpi.id} style={{
																height: 100,
																marginBottom: 16,
																padding: 16,
																border: '1px solid #e8e8e8',
																borderRadius: 8,
																backgroundColor: '#ffffff',
																display: 'flex',
																alignItems: 'center'
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

																{/* Nửa phải - Chart nhỏ */}
																<div>
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
																					<span style={{ cursor: 'pointer' }}>
																						{isPositive ? (<ArrowUpOutlined
																							style={{
																								color: '#48a31c', fontSize: 16, marginRight: 5, fontWeight: 'bold'
																							}}
																						/>) : (<ArrowDownOutlined
																							style={{
																								color: '#ff4d4f', fontSize: 16, marginRight: 5, fontWeight: '1000'
																							}}
																						/>)}
																					</span>
																				</Tooltip>);
																			}

																			return arrows;
																		}
																		return null;
																	})()}
																</div>
															</div>
														))}
													</div>
												);
											})()}
										</div>
									) : (
										<div style={{
											backgroundColor: '#fff',
											borderRadius: '8px',
											border: '1px solid #e8e8e8',
											padding: window.innerWidth <= 480 ? '12px' : '16px',
											textAlign: 'center',
											color: '#8c8c8c'
										}}>
											<Text type='secondary' style={{
												fontSize: window.innerWidth <= 480 ? '11px' : '12px'
											}}>
												Không có dữ liệu KPI để hiển thị
											</Text>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Notes */}
						<div style={layoutStyles.notesContainer}>
							{/* Header with title and buttons */}
							<div style={{
								height: 'max-content',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px',
								borderBottom: '1px solid #f0f0f0',
								backgroundColor: '#fafafa'
							}}>
								<Title level={5} style={{
									margin: 0,
									fontSize: window.innerWidth <= 480 ? '12px' : '14px',
									color: '#262626'
								}}>
									Ghi chú
								</Title>

								{!isEditMode ? (
									(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
										hasNoteContent(localNoteContent) ? (
											<Tooltip title="Chỉnh sửa ghi chú">
												<EditOutlined
													onClick={toggleEditMode}
													style={{
														fontSize: window.innerWidth <= 480 ? '14px' : '16px',
														color: '#1890ff',
														cursor: 'pointer',
														padding: '4px',
														borderRadius: '4px',
														transition: 'all 0.2s'
													}}
													onMouseEnter={(e) => {
														e.target.style.backgroundColor = '#e6f7ff';
													}}
													onMouseLeave={(e) => {
														e.target.style.backgroundColor = 'transparent';
													}}
												/>
											</Tooltip>
										) : (
											<Tooltip title="Thêm ghi chú">
												<Button
													type="text"
													icon={<PlusOutlined />}
													onClick={toggleEditMode}
													size="small"
													style={{
														fontSize: window.innerWidth <= 480 ? '12px' : '14px',
														color: '#1890ff',
														padding: '4px 8px',
														height: 'auto',
														display: 'flex',
														alignItems: 'center',
														gap: '4px'
													}}
												>
													Ghi chú
												</Button>
											</Tooltip>
										)
									)
								) : (
									<div style={{
										display: 'flex',
										gap: '6px'
									}}>
										<Button
											size="small"
											onClick={toggleEditMode}
											style={{
												fontSize: window.innerWidth <= 480 ? '10px' : '12px',
												padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px'
											}}
										>
											Hủy
										</Button>
										<Button
											size="small"
											type="primary"
											onClick={handleSaveNote}
											style={{
												fontSize: window.innerWidth <= 480 ? '10px' : '12px',
												padding: window.innerWidth <= 480 ? '2px 6px' : '4px 8px'
											}}
										>
											Lưu
										</Button>
									</div>
								)}
							</div>

							{/* Tiptap editor container */}
							<div style={{
								height: 'max-content',
								display: 'flex',
								flexDirection: 'column',
								overflow: 'hidden'
							}}>
								<div className={css.tiptap} style={{ height: 'max-content', display: 'flex', flexDirection: 'column' }}>
									{isEditMode && (
										<div style={{
											padding: window.innerWidth <= 480 ? '6px' : '10px',
											borderBottom: '1px solid #f0f0f0',
											backgroundColor: '#fafafa'
										}}>
											<div style={{
												display: 'flex',
												flexWrap: 'wrap',
												gap: window.innerWidth <= 480 ? '2px' : '4px',
												alignItems: 'center',
												maxWidth: '100%',
												overflow: 'hidden'
											}}>
												<div style={{
													display: 'flex',
													flexWrap: 'wrap',
													gap: window.innerWidth <= 480 ? '2px' : '4px',
													alignItems: 'center',
													width: '100%'
												}}>
													<TiptapToolbar
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
												</div>
											</div>
										</div>
									)}

									<div className={isEditMode ? css.editorContent : css.editorContentFull} style={{ flex: 1, overflow: 'auto' }}>
										<EditorContent className={css.editorContentWrap} editor={editor} />
									</div>
								</div>
							</div>
						</div>

						{/* Data Table Panel */}
						<div style={layoutStyles.dataTableContainer}>
							<div style={{
								padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px',
								borderBottom: '1px solid #f0f0f0',
								backgroundColor: '#fafafa',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 8
							}}>
								<Title level={5} style={{
									margin: 0,
									fontSize: window.innerWidth <= 480 ? '12px' : '14px',
									color: '#262626'
								}}>
									Data Chart
								</Title>
							</div>
							<div style={{
								flex: 1,
								overflow: 'hidden',
								width: '100%',
								height: '100%',
								display: 'flex',
								flexDirection: 'column'
							}}>
								{/* Table Data Display */}
								
									<div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
										{tableData[item.id] && Array.isArray(tableData[item.id]) && tableData[item.id].length > 0 ? (
											<div style={{ width: '100%', height: '100%', minHeight: '300px' }} className={'ag-theme-quartz'}>
												<AgGridReact
													rowData={tableData[item.id]}
													columnDefs={(() => {
														const columns = [];
														if (item.id) {
															// Fallback: Lấy key của dữ liệu làm tên cột
															const data = tableData[item.id] || [];
															if (data && data.length > 0) {
																const firstRow = data[0];
																Object.keys(firstRow).forEach(key => {
																	if (key !== 'rowId') { // Skip rowId column
																		columns.push({
																			field: key,
																			headerName: key, // Lấy key làm tên cột, không format
																			width: 150,
																			resizable: true,
																			sortable: true,
																			filter: true,
																			cellStyle: { fontSize: '12px' },
																			cellRenderer: (params) => {
																				const value = params.value;
																				if (typeof value === 'number') {
																					return formatNumberWithK(value);
																				}
																				return value || '-';
																			}
																		});
																	}
																});
															}
														}

														return columns;
													})()}
													domLayout="normal"
													rowSelection="multiple"
													animateRows={true}
													style={{ width: '100%', height: '100%', minHeight: '300px' }}
													defaultColDef={{
														sortable: true,
														filter: true,
														resizable: true,
														suppressHeaderMenuButton: true
													}}
												/>
											</div>
								
										) : (
											<div style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												height: '100%',
												backgroundColor: '#fafafa',
												borderRadius: '6px',
												border: '1px dashed #d9d9d9',
											}}>
												<div style={{ textAlign: 'center', color: '#8c8c8c' }}>
													<Text type='secondary' style={{
														fontSize: window.innerWidth <= 480 ? '11px' : '12px'
													}}>
														Không có dữ liệu bảng để hiển thị
													</Text>
												</div>
											</div>
										)}
									</div>
								
							</div>
						</div>
					</div>
					{/* Right column: Analysis Results */}
					<div style={layoutStyles.analysisContainer}>
						{/* Floating action for selected text → AI Chat */}
						{selectionBtnPos.show && (
							<div
								style={{
									position: 'fixed',
									left: selectionBtnPos.x,
									top: selectionBtnPos.y,
									zIndex: 10000,
									background: '#fff',
									border: '1px solid #d9d9d9',
									borderRadius: 6,
									boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
									padding: 6
								}}
								onMouseDown={(e) => e.stopPropagation()}
								onClick={(e) => { e.stopPropagation(); }}
							>
								<Button size="small" type="primary" onClick={handleDiscussMoreClick}>
									Thảo luận thêm
								</Button>
							</div>
						)}
						{/* Header */}
						<div style={{
							padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px',
							borderBottom: '1px solid #f0f0f0',
							backgroundColor: '#fafafa',
							borderRadius: '8px 8px 0 0'
						}}>
							<Title level={5} style={{
								margin: 0,
								fontSize: window.innerWidth <= 480 ? '12px' : '14px',
								color: '#262626'
							}}>
								Kết quả phân tích
							</Title>
						</div>

						{/* Content */}
						<div style={{
							flex: 1,
							overflow: 'auto',
							padding: window.innerWidth <= 480 ? '12px' : '16px'
						}}>
							{localAnalysis?.answer ? (
								<div
									className={styles.analysisContent}
									style={{
										lineHeight: '1.6',
										color: '#262626',
										fontSize: window.innerWidth <= 480 ? '13px' : '14px'
									}}
									onMouseUp={(e) => handleSelectionMouseUp(e)}
									onKeyUp={(e) => handleSelectionMouseUp(e)}
									dangerouslySetInnerHTML={{
										__html: renderMarkdown(localAnalysis.answer),
									}}
								/>
							) : (
								<div style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									height: '100%',
									minHeight: window.innerWidth <= 480 ? '150px' : '200px',
									backgroundColor: '#fafafa',
									borderRadius: '6px',
									border: '2px dashed #d9d9d9'
								}}>
									<div style={{ textAlign: 'center' }}>
										<RobotOutlined style={{
											fontSize: window.innerWidth <= 480 ? '36px' : '48px',
											color: '#d9d9d9',
											marginBottom: window.innerWidth <= 480 ? '12px' : '16px'
										}} />
										<Paragraph
											style={{
												margin: 0,
												color: '#8c8c8c',
												fontSize: window.innerWidth <= 480 ? '12px' : '14px'
											}}
										>
											Chưa có kết quả phân tích. Vui lòng thử phân tích lại.
										</Paragraph>
									</div>
								</div>
							)}
						</div>
					</div>
					{/* AI Chat Container */}
					<div style={layoutStyles.aiChatContainer}>
						{/* Header */}
						<div style={{
							padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px',
							borderBottom: '1px solid #f0f0f0',
							backgroundColor: '#fafafa',
							borderRadius: '8px 8px 0 0'
						}}>
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center'
							}}>
								<Title level={5} style={{
									margin: 0,
									fontSize: window.innerWidth <= 480 ? '12px' : '14px',
									color: '#262626'
								}}>
									AI Chat
									{(() => {
										const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isInitial && !msg.isSystem);
										const remainingMessages = 5 - userMessages.length;
										return (
											<span style={{
												fontSize: '11px',
												fontWeight: 'normal',
												color: remainingMessages <= 1 ? '#ff4d4f' : remainingMessages <= 2 ? '#fa8c16' : '#8c8c8c',
												marginLeft: '8px'
											}}>
												({userMessages.length}/5)
											</span>
										);
									})()}
								</Title>

								<Space>
									{(currentUser.isAdmin || currentUser.isSuperAdmin) &&
										<Tooltip title="Cấu hình System Message">
											<Button
												type="default"
												size="small"
												onClick={handleOpenSystemMessageModal}
												style={{ fontSize: '11px' }}
												icon={<SettingOutlined />}
											>
											</Button>
										</Tooltip>
									}
									{currentUser.isSuperAdmin &&
										<Select
											value={selectedAIModel}
											onChange={setSelectedAIModel}
											size="small"
											style={{ width: window.innerWidth <= 480 ? '70px' : '100px' }}
										>
											{memoizedModelList.map(model => (
												<Option key={model.value} value={model.value}>
													{model.name}
												</Option>
											))}
										</Select>}
									<Button
										type={useWebSearch ? 'primary' : 'default'}
										size="small"
										onClick={() => setUseWebSearch(!useWebSearch)}
										title={useWebSearch ? 'Tắt Websearch' : 'Bật Websearch'}
										style={{ fontSize: '11px' }}
									>
										🌐
									</Button>
									<Button
										type="default"
										size="small"
										onClick={handleResetChat}
										title="Reset chat history"
										style={{ fontSize: '11px' }}
										danger
									>
										Reset
									</Button>
								</Space>
							</div>
						</div>

						{/* Chat Messages */}
						<div
							data-chat-container
							style={{
								flex: 1,
								overflow: 'auto',
								padding: window.innerWidth <= 480 ? '8px' : '12px',
								display: 'flex',
								flexDirection: 'column',
								gap: '12px'
							}}
						>
							{/* Loading indicator */}
							{isLoadingChatHistory ? (
								<div style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									height: '100%',
									minHeight: '150px',
									backgroundColor: '#fafafa',
									borderRadius: '6px',
									border: '2px dashed #d9d9d9',
									flexDirection: 'column',
									gap: '8px'
								}}>
									<RobotOutlined style={{
										fontSize: '32px',
										color: '#d9d9d9',
										animation: 'spin 1s linear infinite'
									}} />
									<style>
										{`
										@keyframes spin {
											from { transform: rotate(0deg); }
											to { transform: rotate(360deg); }
										}
									`}
									</style>
									<Text style={{
										color: '#8c8c8c',
										fontSize: '12px',
										textAlign: 'center'
									}}>
										Đang tải lịch sử chat...
									</Text>
								</div>
							) : (
								<>
									{/* Hiển thị tin nhắn chat */}
									{(() => {
										// Lọc ra chỉ những tin nhắn hiển thị (không phải tin nhắn hệ thống)
										const visibleMessages = chatMessages.filter(msg => !msg.isSystem);
										return visibleMessages.length === 0;
									})() ? (
										<div style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											height: '100%',
											minHeight: '150px',
											backgroundColor: '#fafafa',
											borderRadius: '6px',
											border: '2px dashed #d9d9d9',
											flexDirection: 'column',
											gap: '8px'
										}}>
											<RobotOutlined style={{
												fontSize: '32px',
												color: '#d9d9d9'
											}} />
											<Text style={{
												color: '#8c8c8c',
												fontSize: '12px',
												textAlign: 'center'
											}}>
												Chưa có cuộc trò chuyện nào.<br />
												Bắt đầu hỏi AI để có thông tin chi tiết hơn!
											</Text>
										</div>
									) : (
										chatMessages.filter(msg => !msg.isSystem).map((message) => (
											<div
												key={message.id}
												style={{
													display: 'flex',
													gap: '8px',
													alignItems: 'flex-start',
													opacity: message.isInitial ? 0.7 : message.isSystem ? 0.6 : 1,
												}}
											>
												<Avatar
													size={32}
													icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
													style={{
														background: message.isSystem ? '#722ed1' : message.type === 'user' ? '#1890ff' : '#52c41a',
														flexShrink: 0
													}}
												/>
												<div style={{
													flex: 1,
													backgroundColor: message.isSystem ? '#f9f0ff' : message.type === 'user' ? '#f0f8ff' : '#f6ffed',
													padding: '8px 12px',
													borderRadius: '8px',
													border: `1px solid ${message.isSystem ? '#d3adf7' : message.type === 'user' ? '#d6e4ff' : '#b7eb8f'}`,
													maxWidth: '85%',
													wordBreak: 'break-word'
												}}>
													{message.isInitial && (
														<div style={{
															fontSize: '11px',
															color: '#8c8c8c',
															marginBottom: '4px',
															fontStyle: 'italic'
														}}>
															Phân tích ban đầu
														</div>
													)}
													{message.isSystem && (
														<div style={{
															fontSize: '11px',
															color: '#722ed1',
															marginBottom: '4px',
															fontWeight: '500'
														}}>
															📋 Thông tin hệ thống
														</div>
													)}
													<div
														className={styles.analysisContent}
														style={{
															lineHeight: '1.5',
															color: message.isSystem ? '#722ed1' : '#262626',
															fontSize: window.innerWidth <= 480 ? '12px' : '13px',
															fontFamily: message.isSystem ? 'monospace' : 'inherit'
														}}
														dangerouslySetInnerHTML={{
															__html: renderMarkdown(message.content),
														}}
													/>
													{message.citations && (
														<div style={{
															marginTop: '8px',
															padding: '6px 8px',
															backgroundColor: '#fff',
															borderRadius: '4px',
															border: '1px solid #e8e8e8',
															fontSize: '11px',
															color: '#8c8c8c'
														}}>
															📎 Nguồn tham khảo: {message.citations.length} nguồn
														</div>
													)}
													<div style={{
														fontSize: '10px',
														color: message.isSystem ? '#722ed1' : '#8c8c8c',
														marginTop: '6px',
														textAlign: 'right'
													}}>
														{message.timestamp.toLocaleTimeString('vi-VN', {
															hour: '2-digit',
															minute: '2-digit'
														})}
													</div>
												</div>
											</div>
										))
									)}
								</>
							)}

							{/* Typing indicator */}
							{isTyping && (
								<div style={{
									display: 'flex',
									gap: '8px',
									alignItems: 'flex-start'
								}}>
									<Avatar
										size={32}
										icon={<RobotOutlined />}
										style={{ background: '#52c41a', flexShrink: 0 }}
									/>
									<div style={{
										backgroundColor: '#f6ffed',
										padding: '8px 12px',
										borderRadius: '8px',
										border: '1px solid #b7eb8f'
									}}>
										<div style={{
											display: 'flex',
											gap: '4px',
											alignItems: 'center'
										}}>
											<span style={{ fontSize: '12px', color: '#8c8c8c' }}>AI đang trả lời</span>
											<div style={{
												display: 'flex',
												gap: '2px'
											}}>
												<span style={{
													width: '4px',
													height: '4px',
													borderRadius: '50%',
													backgroundColor: '#52c41a',
													animation: 'typing 1.4s infinite ease-in-out'
												}}></span>
												<span style={{
													width: '4px',
													height: '4px',
													borderRadius: '50%',
													backgroundColor: '#52c41a',
													animation: 'typing 1.4s infinite ease-in-out 0.2s'
												}}></span>
												<span style={{
													width: '4px',
													height: '4px',
													borderRadius: '50%',
													backgroundColor: '#52c41a',
													animation: 'typing 1.4s infinite ease-in-out 0.4s'
												}}></span>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Chat Input */}
						<div style={{
							padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px',
							borderTop: '1px solid #f0f0f0',
							backgroundColor: '#fafafa',
							borderRadius: '0 0 8px 8px'
						}}>
							{/* Thông báo khi đạt giới hạn */}
							{(() => {
								const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isInitial && !msg.isSystem);
								const remainingMessages = 5 - userMessages.length;
								if (remainingMessages <= 0) {
									return (
										<div style={{
											marginBottom: '12px',
											padding: '8px 12px',
											backgroundColor: '#fff2f0',
											border: '1px solid #ffccc7',
											borderRadius: '6px',
											display: 'flex',
											alignItems: 'center',
											gap: '8px'
										}}>
											<RobotOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
											<Text style={{
												color: '#ff4d4f',
												fontSize: '12px',
												fontWeight: '500'
											}}>
												Bạn đã đạt giới hạn 5 tin nhắn! Nhấn nút "Reset" để bắt đầu cuộc trò chuyện mới.
											</Text>
										</div>
									);
								}
								return null;
							})()}

							<div style={{
								display: 'flex',
								gap: '8px',
								alignItems: 'flex-end'
							}}>
								<Input.TextArea
									value={inputMessage}
									onChange={(e) => setInputMessage(e.target.value)}
									onKeyPress={handleKeyPress}
									placeholder={(() => {
										const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isInitial && !msg.isSystem);
										const remainingMessages = 5 - userMessages.length;
										if (remainingMessages <= 0) {
											return 'Đã đạt giới hạn 5 tin nhắn. Nhấn Reset để tiếp tục.';
										}
										return `Nhập câu hỏi... (Enter để gửi, Shift+Enter để xuống dòng) - Còn ${remainingMessages} tin nhắn`;
									})()}
									autoSize={{ minRows: 1, maxRows: 3 }}
									style={{
										flex: 1,
										resize: 'none'
									}}
									disabled={isTyping || (() => {
										const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isInitial && !msg.isSystem);
										return userMessages.length >= 5;
									})()}
								/>
								<Button
									type="primary"
									icon={<SendOutlined />}
									onClick={handleSendMessage}
									disabled={!inputMessage.trim() || isTyping || (() => {
										const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isInitial && !msg.isSystem);
										return userMessages.length >= 5;
									})()}
									size="small"
								>
									Gửi
								</Button>
							</div>
						</div>
					</div>
				</div>
			</Modal>
			{/* Modal cấu hình System Message cho AI Chat */}
			<Modal
				open={isSysMsgModalOpen}
				title={
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '40px' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<SettingOutlined /> Cấu hình System Message cho AI Chat
						</div>
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
				onCancel={() => setIsSysMsgModalOpen(false)}
				onOk={handleSaveSystemMessage}
				okText="Lưu"
				confirmLoading={isSavingSystemMsg}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						Tin nhắn hệ thống sẽ được gửi kèm mỗi yêu cầu tới AI để định hướng trả lời.
					</Typography.Text>
					<Input.TextArea
						value={systemMessageText}
						onChange={(e) => setSystemMessageText(e.target.value)}
						placeholder="Nhập System Message..."
						autoSize={{ minRows: 4, maxRows: 8 }}
					/>
				</div>
			</Modal>

		
			<Kpi2CalcInfoModal
				open={showKpi2InfoModal}
				onClose={() => setShowKpi2InfoModal(false)}
				kpi2CalculatorId={item?.idData}
				allKpiCalculators={[]}
				dashboardItemId={item?.id}
				dashboardItemSettings={item?.settings || {}}
				onSaveDashboardItemSettings={async (newSettings) => {
					try {
						const updatedItem = { ...item, settings: { ...(item.settings || {}), ...newSettings } };
						await updateDashBoardItem(updatedItem);
						if (onItemUpdate) onItemUpdate(updatedItem);
					} catch (e) {
						console.error('Error saving dashboard item settings from KPI2 modal:', e);
					}
				}}
			/>
		</>
	);
};

export default AnalysisDetailModal; 

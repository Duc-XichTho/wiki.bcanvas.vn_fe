import {
	BookOutlined,
	DeleteOutlined,
	GlobalOutlined,
	HistoryOutlined,
	MenuOutlined,
	MessageOutlined,
	PlusOutlined,
	QuestionCircleOutlined,
	RobotOutlined,
	SendOutlined,
	SettingOutlined,
} from '@ant-design/icons';
import {
	Alert,
	Avatar,
	Button,
	Empty,
	Form,
	Input,
	List,
	message,
	Modal,
	Popconfirm,
	Select,
	Space,
	Switch,
	Tooltip,
} from 'antd';
import DOMPurify from 'dompurify';
import { Sparkles } from 'lucide-react';
import { marked } from 'marked';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { aiChat, aiGen, webSearchChat } from '../../../apis/botService.jsx';
import {
	addMessageToChat,
	createNewChatSession,
	deleteAiChatHistory,
	getActiveChatSessions,
	getAiChatHistoryById,
	getAISummaryById,
	getK9Id,
	updateAiChatHistory,
	getAllThesis,
	createThesis,
	updateThesis,
	getSettingByTypeExternal,
	createOrUpdateSettingByTypeExternal,
	aiGenWithEmbedding, getEmbedingDataBySourceId, searchEmbedingDataByTextForTable,
} from '../../../apis/serviceApi/k9Service';
import { MyContext } from '../../../MyContext';
import styles from '../K9.module.css';
import AdvisorSettingModal from './AdvisorSettingModal';
import AiPipelineSettingModal from './AiPipelineSettingModal';
import TemplateSettingModal from './TemplateSettingModal';
import TemplateEditModal from './TemplateEditModal';

// Component để hiển thị title với async data
const SourceTitle = ({ sourceId, table, fallbackTitle }) => {
	const [title, setTitle] = useState(fallbackTitle);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchTitle = async () => {
			if (!sourceId || !table) return;

			setLoading(true);
			try {
				let data;
				if (table === 'news') {
					data = await getK9Id(sourceId);
				} else if (table === 'report') {
					data = await getAISummaryById(sourceId);
				}

				if (data && data.data && data.data.title) {
					setTitle(data.data.title);
				}
			} catch (error) {
				console.error('Error fetching title:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchTitle();
	}, [sourceId, table]);

	return (
		<span>
			{loading ? 'Đang tải...' : title}
		</span>
	);
};

// Constants for localStorage keys
const STORAGE_KEYS = {
	LAST_SELECTED_SESSION: 'ai_chat_last_selected_session',
	LAST_SELECTED_ADVISOR: 'ai_chat_last_selected_advisor',
};

const { TextArea } = Input;
const { Option } = Select;

// Hàm tính thời gian đã tạo (giống như tab news)
const formatTimeAgo = (createdAt) => {
	if (!createdAt) return '-';

	const date = new Date(createdAt);
	if (isNaN(date.getTime())) return '-';

	const now = new Date();
	const diffMs = now - date;
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays > 0) {
		return `${diffDays} ngày trước`;
	} else if (diffHours > 0) {
		return `${diffHours} giờ trước`;
	} else {
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		return diffMinutes > 0 ? `${diffMinutes} phút trước` : 'Vừa xong';
	}
};

const advisors = [
	{
		key: 'Chọn Advisor',
		name: 'Analyst',
		systemMessage: '',
	},
];

const jobTemplates = [
	{
		key: 'stock-news',
		label: 'Tóm tắt tin tức cổ phiếu',
		template: 'Hãy tóm tắt và phân tích những tin tức gần đây liên quan đến cổ phiếu &&&. Đánh giá tác động đến giá cổ phiếu và đưa ra khuyến nghị đầu tư.',
	},
	{
		key: 'sector-analysis',
		label: 'Phân tích ngành và cơ hội',
		template: 'Phân tích tình hình ngành &&& hiện tại, xác định các cơ hội đầu tư tiềm năng và những rủi ro cần lưu ý.',
	},
	{
		key: 'financial-comparison',
		label: 'So sánh tỷ số tài chính',
		template: 'So sánh các tỷ số tài chính chính của &&& trong cùng ngành. Phân tích điểm mạnh, điểm yếu và đưa ra khuyến nghị đầu tư.',
	},
	{
		key: 'valuation-analysis',
		label: 'Phân tích định giá',
		template: 'Thực hiện phân tích định giá cho cổ phiếu &&& sử dụng các phương pháp DCF, P/E, P/B. Đánh giá liệu cổ phiếu có đang được định giá thấp hay cao.',
	},
	{
		key: 'risk-assessment',
		label: 'Đánh giá rủi ro',
		template: 'Đánh giá các rủi ro tiềm ẩn khi đầu tư vào &&&. Đưa ra chiến lược quản lý rủi ro phù hợp.',
	},
];

const AiChatTab = () => {
	const { currentUser } = useContext(MyContext);
	const [selectedAdvisor, setSelectedAdvisor] = useState('Chọn Advisor');
	const [inputMessage, setInputMessage] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const [messages, setMessages] = useState([]);
	const [currentSessionId, setCurrentSessionId] = useState(null);
	const [chatSessions, setChatSessions] = useState([]);
	const [loadingSessions, setLoadingSessions] = useState(false);

	const [advisorModalVisible, setAdvisorModalVisible] = useState(false);
	const [templateModalVisible, setTemplateModalVisible] = useState(false);
	const [pipelineModalVisible, setPipelineModalVisible] = useState(false);
	const [templateEditModalVisible, setTemplateEditModalVisible] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [advisorList, setAdvisorList] = useState([]);
	const [pipelineList, setPipelineList] = useState([]);
	const [advisorLoading, setAdvisorLoading] = useState(false);
	const [templateList, setTemplateList] = useState(jobTemplates);
	const [showTemplateSuggestions, setShowTemplateSuggestions] = useState(false);
	const [templateSuggestions, setTemplateSuggestions] = useState([]);
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
	const [cursorPosition, setCursorPosition] = useState(0);
	const suggestionsRef = useRef(null);
	const [editingKey, setEditingKey] = useState('');
	const [form] = Form.useForm();
	const [advisorEditModal, setAdvisorEditModal] = useState({ visible: false, editing: null });
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
	const [templateError, setTemplateError] = useState(false);

	// Embedding search states
	const [useEmbeddingSearch, setUseEmbeddingSearch] = useState(false);
	const [embeddingSearchLoading, setEmbeddingSearchLoading] = useState(false);
	const [noEmbeddingResults, setNoEmbeddingResults] = useState(false);

	// Embedding detail popup states
	const [embeddingDetailModal, setEmbeddingDetailModal] = useState({ visible: false, data: null });
	const [embeddingDetailLoading, setEmbeddingDetailLoading] = useState(false);
	const [hasRestoredSession, setHasRestoredSession] = useState(false);

	// Thesis states
	const [thesisModalVisible, setThesisModalVisible] = useState(false);
	const [thesisForm] = Form.useForm();
	const [creatingThesis, setCreatingThesis] = useState(false);
	const [thesisData, setThesisData] = useState({ content: '', summary: '', name: '' });
	const [thesisList, setThesisList] = useState([]);
	const [selectedThesisId, setSelectedThesisId] = useState(null);
	const [isCreatingNewThesis, setIsCreatingNewThesis] = useState(true);
	const [generatingSummary, setGeneratingSummary] = useState(false);
	const [thesisMode, setThesisMode] = useState('original'); // 'original' hoặc 'summarized'
	const [isChatThesis, setIsChatThesis] = useState(false); // Phân biệt lưu 1 chat hay cả hội thoại
	const [summarizePrompt, setSummarizePrompt] = useState('Dựa vào nội dung nhận được, tổng hợp và tóm tắt lại điểm chính theo cấu trúc, trong đó nội dung gồm TITLE, các header cấp 1, và các short paragraph. Tạo ra định dạng tóm tắt là markdown style.\n\nYêu cầu:\n- Đảm bảo định dạng bản tổng hợp tóm tắt là Markdown\n- Rút gọn, nhưng giữ đủ ý chính, lối viết súc tích ngắn gọn, loại bỏ đi câu từ thừa thãi\n- Cấu trúc phù hợp, logic');

	// Template sidebar states
	const [templateSidebarCollapsed, setTemplateSidebarCollapsed] = useState(false);

	// Hàm load danh sách thesis
	const loadThesisList = async () => {
		try {
			const data = await getAllThesis();
			const thesisArray = Array.isArray(data) ? data : (data?.data || data?.thesis || []);

			setThesisList(thesisArray);
		} catch (error) {
			console.error('Error loading thesis list:', error);
			setThesisList([]);
		}
	};

	// Hàm tạo tên sổ theo ngày
	const getDailyThesisTitle = (date = new Date()) => {
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		return `Sổ ngày ${day}/${month}/${year}`;
	};

	// Hàm tạo tên thesis mặc định
	const getDefaultThesisName = (date = new Date()) => {
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		return `Sổ ngày ${day}/${month}/${year}`;
	};

	// Hàm tìm hoặc tạo thesis theo ngày
	const findOrCreateDailyThesis = async (targetDate = new Date()) => {
		const dailyTitle = getDailyThesisTitle(targetDate);
		const userEmail = currentUser?.email || currentUser?.id;

		// Tìm thesis theo ngày đã tồn tại
		const existingThesis = thesisList.find(thesis =>
			thesis.summary === dailyTitle &&
			thesis.userCreated === userEmail
		);

		if (existingThesis) {
			console.log('📅 Found existing daily thesis:', existingThesis.id);
			return existingThesis.id;
		}

		// Tạo thesis mới theo ngày
		try {
			const newDailyThesis = {
				content: `Sổ cá nhân ngày ${targetDate.toLocaleDateString('vi-VN')}`,
				summary: dailyTitle,
				name: dailyTitle, // Sử dụng dailyTitle làm tên
				userCreated: userEmail,
				list_chat: [],
				createAt: new Date().toISOString(),
			};

			console.log('📅 Creating new daily thesis:', newDailyThesis);
			const result = await createThesis(newDailyThesis);

			if (result && result.data && result.data.id) {
				// Reload thesis list để cập nhật
				await loadThesisList();
				console.log('✅ Daily thesis created successfully:', result.data.id);
				return result.data.id;
			}
		} catch (error) {
			console.error('❌ Error creating daily thesis:', error);
			throw error;
		}

		return null;
	};

	// Hàm loại bỏ markdown code block wrapper
	const cleanMarkdownWrapper = (text) => {
		if (!text) return text;

		// Loại bỏ ```markdown ... ``` hoặc ``` ... ```
		const markdownBlockRegex = /^```(?:markdown)?\s*\n?([\s\S]*?)\n?```$/;
		const match = text.trim().match(markdownBlockRegex);

		if (match) {
			console.log('🧹 Cleaned markdown wrapper from AI response');
			return match[1].trim();
		}

		return text;
	};

	// Hàm rút gọn nội dung bằng AI
	const summarizeContent = async (content) => {
		try {
			const response = await aiGen(
				`${summarizePrompt}

${content}`,
				'Bạn là một trợ lý AI chuyên tóm tắt nội dung một cách ngắn gọn và chính xác. Sử dụng ngôn ngữ Việt Nam, câu từ trịnh trọng.',
				'gpt-4.1-2025-04-14',
				'text',
			);

			if (response && response.result) {
				const cleanedResult = cleanMarkdownWrapper(response.result.trim());
				return cleanedResult;
			}
		} catch (error) {
			console.error('❌ Error summarizing content:', error);
		}
		return content; // Fallback về nội dung gốc nếu không tóm tắt được
	};

	// Hàm mở modal tạo thesis cho 1 chat
	const openThesisModal = async (messageContent, messageId) => {
		if (!messageContent || !currentUser) return;

		// Load danh sách thesis
		await loadThesisList();

		// Set mode cho lưu 1 chat (mặc định là nguyên văn)
		setIsChatThesis(false);
		setThesisMode('original');

		// Tạo summary tạm thời từ nội dung (lấy 100 ký tự đầu)
		const tempSummary = messageContent.length > 100
			? messageContent.substring(0, 100) + '...'
			: messageContent;

		// Tạo tên thesis mặc định
		const defaultName = getDefaultThesisName();

		// Mở modal trước với summary tạm thời
		setThesisData({
			content: messageContent,
			summary: tempSummary,
			name: defaultName,
		});

		thesisForm.setFieldsValue({
			content: messageContent,
			summary: tempSummary,
			name: defaultName,
		});

		// Mặc định chọn sổ theo ngày
		setIsCreatingNewThesis(false);

		// Chỉ tìm thesis theo ngày (không tạo mới), sẽ tạo khi user bấm lưu
		const dailyTitle = getDailyThesisTitle();
		const userEmail = currentUser?.email || currentUser?.id;
		const existingThesis = thesisList.find(thesis =>
			thesis.summary === dailyTitle &&
			thesis.userCreated === userEmail
		);

		if (existingThesis) {
			setSelectedThesisId(existingThesis.id);
			console.log('📅 Found existing daily thesis:', existingThesis.id);
		} else {
			// Nếu chưa có sổ ngày hôm nay, sẽ tạo khi user bấm lưu
			setSelectedThesisId(null);
			console.log('📅 No daily thesis found, will create when user saves');
		}

		setThesisModalVisible(true);

		// Sau khi mở modal, bắt đầu tạo tóm tắt bằng AI
		setGeneratingSummary(true);
		try {
			console.log('🤖 Generating AI summary for single chat thesis modal...');

			// Sử dụng AI để tạo tóm tắt
			const prompt = `Hãy tạo một tóm tắt ngắn gọn và súc tích cho nội dung sau đây. Tóm tắt nên có độ dài khoảng 100-150 ký tự và nêu bật những điểm chính:

${messageContent}

Tóm tắt:`;

			const response = await aiGen(
				prompt,
				'Bạn là một trợ lý AI chuyên tạo tóm tắt ngắn gọn và chính xác. Sử dụng ngôn ngữ Việt Nam, câu từ trịnh trọng.',
				'gpt-4.1-2025-04-14',
				'text',
			);
			console.log('🤖 AI summary response:', response);

			if (response && response.result) {
				const rawSummary = response.result.trim();
				const aiSummary = cleanMarkdownWrapper(rawSummary);
				console.log('✅ AI summary generated successfully:', aiSummary);

				// Cập nhật form và state với AI summary
				thesisForm.setFieldValue('summary', aiSummary);
				setThesisData(prev => ({ ...prev, summary: aiSummary }));
			} else {
				console.log('⚠️ AI summary generation failed, keeping temp summary');
				message.warning('Không thể tạo tóm tắt tự động. Vui lòng chỉnh sửa tóm tắt thủ công.');
			}
		} catch (error) {
			console.error('❌ Error generating AI summary:', error);
			message.warning('Không thể tạo tóm tắt tự động. Vui lòng chỉnh sửa tóm tắt thủ công.');
		} finally {
			setGeneratingSummary(false);
		}
	};

	// Hàm chuyển đổi toàn bộ chat thành định dạng thesis
	const formatChatForThesis = (chatMessages) => {
		const chatContent = chatMessages
			.filter(msg => msg.type !== 'data-sources' && msg.id !== 1) // Loại bỏ tin nhắn chào và data sources
			.map(msg => {
				const timestamp = msg.timestamp.toLocaleString('vi-VN', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				});

				if (msg.type === 'user') {
					return `**Người dùng** (${timestamp}):\n${msg.content}\n`;
				} else if (msg.type === 'assistant') {
					const advisorName = msg.advisor?.name || 'AI Assistant';
					return `**${advisorName}** (${timestamp}):\n${msg.content}\n`;
				}
				return '';
			})
			.filter(content => content.length > 0)
			.join('\n---\n\n');

		return chatContent;
	};

	// Hàm mở modal tạo thesis cho toàn bộ cuộc trò chuyện
	const openChatThesisModal = async () => {
		if (!currentUser || !messages || messages.length <= 1) {
			message.warning('Không có cuộc trò chuyện nào để lưu');
			return;
		}

		// Load danh sách thesis
		await loadThesisList();

		// Set mode cho lưu cả hội thoại (mặc định là rút gọn)
		setIsChatThesis(true);
		setThesisMode('summarized');

		// Chuyển đổi toàn bộ chat thành định dạng thesis
		const chatContent = formatChatForThesis(messages);

		// Tạo summary tạm thời từ session title hoặc tin nhắn đầu tiên
		const currentSession = chatSessions.find(s => s.id === currentSessionId);
		const sessionTitle = currentSession?.title || 'Cuộc trò chuyện';
		const tempSummary = `Cuộc trò chuyện: ${sessionTitle}`;

		// Tạo tên thesis mặc định
		const defaultName = getDefaultThesisName();

		// Mở modal trước với summary tạm thời
		setThesisData({
			content: chatContent,
			summary: tempSummary,
			name: defaultName,
		});

		thesisForm.setFieldsValue({
			content: chatContent,
			summary: tempSummary,
			name: defaultName,
		});

		// Mặc định chọn sổ theo ngày
		setIsCreatingNewThesis(false);

		// Chỉ tìm thesis theo ngày (không tạo mới), sẽ tạo khi user bấm lưu
		const dailyTitle = getDailyThesisTitle();
		const userEmail = currentUser?.email || currentUser?.id;
		const existingThesis = thesisList.find(thesis =>
			thesis.summary === dailyTitle &&
			thesis.userCreated === userEmail
		);

		if (existingThesis) {
			setSelectedThesisId(existingThesis.id);
			console.log('📅 Found existing daily thesis for chat:', existingThesis.id);
		} else {
			// Nếu chưa có sổ ngày hôm nay, sẽ tạo khi user bấm lưu
			setSelectedThesisId(null);
			console.log('📅 No daily thesis found for chat, will create when user saves');
		}

		setThesisModalVisible(true);

		// Sau khi mở modal, bắt đầu tạo tóm tắt bằng AI
		setGeneratingSummary(true);
		try {
			console.log('🤖 Generating AI summary for full chat thesis modal...');

			// Lấy nội dung chính từ cuộc trò chuyện để tạo tóm tắt
			const mainContent = messages
				.filter(msg => msg.type !== 'data-sources' && msg.id !== 1)
				.slice(0, 3) // Lấy 3 tin nhắn đầu tiên
				.map(msg => msg.content)
				.join(' ');

			const prompt = `Hãy tạo một tóm tắt ngắn gọn cho cuộc trò chuyện sau đây. Tóm tắt nên có độ dài khoảng 100-150 ký tự và nêu bật chủ đề chính của cuộc trò chuyện:

${mainContent}

Tóm tắt cuộc trò chuyện:`;

			const response = await aiGen(
				prompt,
				'Bạn là một trợ lý AI chuyên tạo tóm tắt ngắn gọn và chính xác cho các cuộc trò chuyện. Sử dụng ngôn ngữ Việt Nam, câu từ trịnh trọng.',
				'gpt-4.1-2025-04-14',
				'text',
			);
			console.log('🤖 AI chat summary response:', response);

			if (response && response.result) {
				const rawSummary = response.result.trim();
				const aiSummary = cleanMarkdownWrapper(rawSummary);
				console.log('✅ AI chat summary generated successfully:', aiSummary);

				// Cập nhật form và state với AI summary
				thesisForm.setFieldValue('summary', aiSummary);
				setThesisData(prev => ({ ...prev, summary: aiSummary }));
			} else {
				console.log('⚠️ AI chat summary generation failed, keeping temp summary');
				message.warning('Không thể tạo tóm tắt tự động. Vui lòng chỉnh sửa tóm tắt thủ công.');
			}
		} catch (error) {
			console.error('❌ Error generating AI chat summary:', error);
			message.warning('Không thể tạo tóm tắt tự động. Vui lòng chỉnh sửa tóm tắt thủ công.');
		} finally {
			setGeneratingSummary(false);
		}
	};

	// Hàm tạo thesis từ modal
	const createThesisFromModal = async (values) => {
		if (!currentUser) return;

		// Validation
		if (!isCreatingNewThesis && !selectedThesisId) {
			message.error('Vui lòng chọn thesis để thêm vào');
			return;
		}

		setCreatingThesis(true);
		try {
			console.log('Creating thesis with values:', values);
			console.log('Thesis mode:', thesisMode);
			console.log('Is chat thesis:', isChatThesis);

			// Xử lý nội dung dựa trên mode
			let finalContent = values.content;

			// Nếu mode là rút gọn, sử dụng AI để rút gọn
			if (thesisMode === 'summarized') {
				finalContent = await summarizeContent(values.content);
			}

			const chatData = {
				order: 1, // Sẽ được cập nhật nếu thêm vào thesis sẵn có
				content: finalContent,
				summary: values.summary,
				mode: thesisMode, // Lưu thông tin mode
				originalContent: thesisMode === 'summarized' ? values.content : null, // Lưu nội dung gốc nếu rút gọn
			};

			if (isCreatingNewThesis) {
				// Tạo thesis mới với summary từ form
				const newThesisData = {
					content: finalContent, // Lưu content đã xử lý vào thesis chính
					summary: values.summary, // Lưu summary vào thesis chính
					name: values.name || getDefaultThesisName(), // Lưu tên thesis
					userCreated: currentUser?.email || currentUser?.id,
					list_chat: [chatData],
					createAt: new Date().toISOString(),
				};
				const result = await createThesis(newThesisData);
				console.log('Thesis creation result:', result);
				message.success('Đã tạo thesis mới thành công!');
				loadThesisList(); // Reload the list
			} else {
				// Thêm vào thesis sẵn có hoặc tạo mới thesis theo ngày
				let targetThesisId = selectedThesisId;

				// Nếu không có selectedThesisId, tạo thesis theo ngày mới
				if (!targetThesisId) {
					console.log('📅 Creating new daily thesis...');
					const dailyThesisId = await findOrCreateDailyThesis();
					if (dailyThesisId) {
						targetThesisId = dailyThesisId;
						console.log('📅 Created daily thesis:', dailyThesisId);
					} else {
						message.error('Không thể tạo sổ theo ngày');
						return;
					}
				}

				const selectedThesis = thesisList.find(t => t.id === targetThesisId);
				if (!selectedThesis) {
					// Reload thesis list và thử lại
					await loadThesisList();
					const reloadedThesis = thesisList.find(t => t.id === targetThesisId);
					if (!reloadedThesis) {
						message.error('Không tìm thấy thesis đã chọn');
						return;
					}
				}

				const currentThesis = selectedThesis || thesisList.find(t => t.id === targetThesisId);
				const existingListChat = currentThesis.list_chat || [];
				const newOrder = existingListChat.length + 1;
				chatData.order = newOrder;

				const updatedListChat = [...existingListChat, chatData];
				console.log('Updated list chat:', { ...currentThesis, list_chat: updatedListChat });
				const updateResult = await updateThesis(targetThesisId, {
					...currentThesis,
					list_chat: updatedListChat,
					updateAt: new Date().toISOString(),
				});
				console.log('Update thesis result:', updateResult);
				console.log('Updated thesis list_chat:', updateResult?.data?.list_chat);

				const thesisName = currentThesis.name || currentThesis.summary || ` Sổ ngày #${targetThesisId}`;
				message.success(`Đã lưu vào ${thesisName} thành công!`);
				loadThesisList(); // Reload the list
			}

			setThesisModalVisible(false);
			thesisForm.resetFields();
			setIsCreatingNewThesis(true);
			setSelectedThesisId(null);
			setThesisMode('original');
			setIsChatThesis(false);
		} catch (error) {
			console.error('Error creating/updating thesis:', error);
			message.error('Lỗi khi tạo/cập nhật thesis');
		} finally {
			setCreatingThesis(false);
		}
	};

	// Hàm đóng modal thesis
	const closeThesisModal = () => {
		setThesisModalVisible(false);
		thesisForm.resetFields();
		setThesisData({ content: '', summary: '', name: '' });
		setThesisMode('original');
		setIsChatThesis(false);
		setIsCreatingNewThesis(true);
		setSelectedThesisId(null);
	};

	// Hàm tạo tóm tắt bằng AI
	const generateSummaryWithAI = async () => {
		const content = thesisForm.getFieldValue('content');
		if (!content || content.trim().length === 0) {
			message.warning('Vui lòng nhập nội dung trước khi tạo tóm tắt');
			return;
		}

		setGeneratingSummary(true);
		try {
			// Sử dụng AI để tạo tóm tắt
			const prompt = `Hãy tạo một tóm tắt ngắn gọn và súc tích cho nội dung sau đây. Tóm tắt nên có độ dài khoảng 100-150 ký tự và nêu bật những điểm chính:

${content}

Tóm tắt:`;

			const response = await aiGen(
				prompt,
				'Bạn là một trợ lý AI chuyên tạo tóm tắt ngắn gọn và chính xác. Sử dụng ngôn ngữ Việt Nam, câu từ trịnh trọng.',
				'gemini-2.5-flash',
				'text',
			);
			console.log(response);

			if (response && response.result) {
				const rawSummary = response.result.trim();
				const aiSummary = cleanMarkdownWrapper(rawSummary);
				thesisForm.setFieldValue('summary', aiSummary);
				setThesisData(prev => ({ ...prev, summary: aiSummary }));
				message.success('Đã tạo tóm tắt thành công!');
			} else {
				message.error('Không thể tạo tóm tắt. Vui lòng thử lại.');
			}
		} catch (error) {
			console.error('Error generating summary:', error);
			message.error('Lỗi khi tạo tóm tắt. Vui lòng thử lại.');
		} finally {
			setGeneratingSummary(false);
		}
	};

	useEffect(() => {
		if (currentUser) {
			// Debug: Kiểm tra localStorage khi component mount
			const debugSessionId = localStorage.getItem(STORAGE_KEYS.LAST_SELECTED_SESSION);
			const debugAdvisorKey = localStorage.getItem(STORAGE_KEYS.LAST_SELECTED_ADVISOR);
			console.log('Component mount - localStorage check:', { debugSessionId, debugAdvisorKey });

			loadChatSessions();
			// Reset hasRestoredSession khi component mount lại
			setHasRestoredSession(false);
		}
	}, [currentUser]);

	// Khôi phục session đã chọn sau khi chatSessions được load
	useEffect(() => {
		if (chatSessions.length > 0 && currentUser) {
			restoreLastSelectedSession();
		}
	}, [chatSessions]);

	// Đảm bảo advisor được chọn khi advisorList hoặc pipelineList thay đổi
	useEffect(() => {
		const allAdvisors = [...advisorList, ...pipelineList];
		if (allAdvisors.length > 0 && (!selectedAdvisor || selectedAdvisor === 'Chọn Advisor')) {
			setSelectedAdvisor(allAdvisors[0].key);
		}
	}, [advisorList, pipelineList, selectedAdvisor]);

	// Lưu session khi currentSessionId thay đổi
	useEffect(() => {
		if (currentUser && currentSessionId) {
			saveLastSelectedSession(currentSessionId, selectedAdvisor);
		}
	}, [currentSessionId, selectedAdvisor]);

	// Lưu session khi component unmount hoặc khi user rời khỏi tab
	useEffect(() => {
		const handleBeforeUnload = () => {
			if (currentUser && currentSessionId) {
				saveLastSelectedSession(currentSessionId, selectedAdvisor);
			}
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden' && currentUser && currentSessionId) {
				saveLastSelectedSession(currentSessionId, selectedAdvisor);
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			// Lưu session khi component unmount
			if (currentUser && currentSessionId) {
				saveLastSelectedSession(currentSessionId, selectedAdvisor);
			}
			window.removeEventListener('beforeunload', handleBeforeUnload);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [currentSessionId, selectedAdvisor, currentUser]);

	// Lưu session định kỳ mỗi 30 giây để đảm bảo không bị mất
	useEffect(() => {
		if (currentUser && currentSessionId) {
			const interval = setInterval(() => {
				saveLastSelectedSession(currentSessionId, selectedAdvisor);
			}, 30000); // 30 giây

			return () => clearInterval(interval);
		}
	}, [currentSessionId, selectedAdvisor, currentUser]);

	useEffect(() => {
		if (advisorModalVisible) {
			loadAdvisorList();
		}
	}, [advisorModalVisible]);

	useEffect(() => {
		if (pipelineModalVisible) {
			loadPipelineList();
		}
	}, [pipelineModalVisible]);

	useEffect(() => {
		const handleResize = () => {
			const newIsMobile = window.innerWidth <= 768;
			setIsMobile(newIsMobile);
		};

		// Initial setup
		handleResize();

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		const fetchAdvisors = async () => {
			try {
				const setting = await getSettingByTypeExternal('ADVISOR_SETTING');
				const advisorData = setting?.setting && Array.isArray(setting.setting) && setting.setting.length > 0 ? setting.setting : advisors;
				setAdvisorList(advisorData);

				// Tự động chọn advisor đầu tiên nếu chưa có advisor nào được chọn
				if (advisorData.length > 0 && (!selectedAdvisor || selectedAdvisor === 'Chọn Advisor')) {
					setSelectedAdvisor(advisorData[0].key);
				}
			} catch {
				setAdvisorList(advisors);
				// Tự động chọn advisor đầu tiên từ danh sách mặc định
				if (advisors.length > 0 && (!selectedAdvisor || selectedAdvisor === 'Chọn Advisor')) {
					setSelectedAdvisor(advisors[0].key);
				}
			}
		};
		fetchAdvisors();
	}, [selectedAdvisor]);

	useEffect(() => {
		const fetchPipelines = async () => {
			try {
				const setting = await getSettingByTypeExternal('AI_PIPELINE_SETTING');
				setPipelineList(setting?.setting && Array.isArray(setting.setting) && setting.setting.length > 0 ? setting.setting : []);
			} catch {
				setPipelineList([]);
			}
		};
		fetchPipelines();
	}, []);

	useEffect(() => {
		const fetchTemplates = async () => {
			try {
				const setting = await getSettingByTypeExternal('TEMPLATE_AI_SETTING');
				const allTemplates = setting?.setting && Array.isArray(setting.setting) && setting.setting.length > 0 ? setting.setting : jobTemplates;

				// Lọc template theo user hiện tại: hiển thị template của user hoặc template chung (không có userEmail)
				const userEmail = currentUser?.email || currentUser?.id;
				const filteredTemplates = allTemplates.filter(template =>
					!template.userEmail || template.userEmail === userEmail
				);

				setTemplateList(filteredTemplates);
			} catch {
				setTemplateList(jobTemplates);
			}
		};
		fetchTemplates();
	}, [currentUser]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (showTemplateSuggestions) {
				const inputWrapper = document.querySelector(`.${styles.inputWrapper}`);
				if (inputWrapper && !inputWrapper.contains(event.target)) {
					setShowTemplateSuggestions(false);
					setSelectedSuggestionIndex(-1);
				}
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showTemplateSuggestions]);

	// Auto-scroll khi selectedSuggestionIndex thay đổi
	useEffect(() => {
		if (showTemplateSuggestions && selectedSuggestionIndex >= 0 && suggestionsRef.current) {
			const selectedElement = suggestionsRef.current.children[selectedSuggestionIndex];
			if (selectedElement) {
				selectedElement.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest'
				});
			}
		}
	}, [selectedSuggestionIndex, showTemplateSuggestions]);

	// Scroll đến session active khi currentSessionId thay đổi
	useEffect(() => {
		if (currentSessionId && chatSessions.length > 0) {
			setTimeout(() => {
				const activeSessionElement = document.querySelector(`.${styles.activeSession}`);
				if (activeSessionElement) {
					activeSessionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				}
			}, 100);
		}
	}, [currentSessionId, chatSessions]);

	// Hàm lưu session đã chọn vào localStorage
	const saveLastSelectedSession = (sessionId, advisorKey) => {
		try {
			// Chỉ lưu nếu có sessionId hợp lệ
			if (sessionId) {
				localStorage.setItem(STORAGE_KEYS.LAST_SELECTED_SESSION, sessionId.toString());
				localStorage.setItem(STORAGE_KEYS.LAST_SELECTED_ADVISOR, advisorKey || '');

				// Verify lưu thành công
				const savedSessionId = localStorage.getItem(STORAGE_KEYS.LAST_SELECTED_SESSION);
				const savedAdvisorKey = localStorage.getItem(STORAGE_KEYS.LAST_SELECTED_ADVISOR);
			} else {
				// Xóa localStorage nếu không có session
				localStorage.removeItem(STORAGE_KEYS.LAST_SELECTED_SESSION);
				localStorage.removeItem(STORAGE_KEYS.LAST_SELECTED_ADVISOR);
				console.log('Cleared localStorage - no session');
			}
		} catch (error) {
			console.error('Error saving to localStorage:', error);
		}
	};

	// Hàm khôi phục session đã chọn từ localStorage
	const restoreLastSelectedSession = async () => {
		try {
			const lastSessionId = localStorage.getItem(STORAGE_KEYS.LAST_SELECTED_SESSION);
			const lastAdvisorKey = localStorage.getItem(STORAGE_KEYS.LAST_SELECTED_ADVISOR);

			console.log('Restoring from localStorage:', {
				lastSessionId,
				lastAdvisorKey,
				chatSessionsLength: chatSessions.length,
			});

			// Khôi phục advisor từ localStorage nếu có, nếu không thì dùng advisor đầu tiên
			const allAdvisors = [...advisorList, ...pipelineList];
			if (lastAdvisorKey && allAdvisors.some(a => a.key === lastAdvisorKey)) {
				setSelectedAdvisor(lastAdvisorKey);
			} else if (allAdvisors.length > 0 && (!selectedAdvisor || selectedAdvisor === 'Chọn Advisor')) {
				setSelectedAdvisor(allAdvisors[0].key);
			}

			// Chỉ khôi phục session nếu có session ID và danh sách sessions đã được load
			if (lastSessionId && chatSessions.length > 0) {
				const sessionExists = chatSessions.find(s => s.id.toString() === lastSessionId);
				console.log('Session exists:', sessionExists);
				if (sessionExists) {
					setCurrentSessionId(parseInt(lastSessionId));
					await loadChatHistory(parseInt(lastSessionId));
					setHasRestoredSession(true);
					console.log('Session restored successfully');
				}
			}
		} catch (error) {
			console.error('Error restoring from localStorage:', error);
		}
	};

	const loadChatSessions = async () => {
		setLoadingSessions(true);
		try {
			const sessions = await getActiveChatSessions(currentUser.email || currentUser.id);
			// Sắp xếp theo ID mới nhất ở trên cùng
			const sortedSessions = (sessions || []).sort((a, b) => b.id - a.id);
			setChatSessions(sortedSessions);
		} catch {
			message.error('Không thể tải danh sách chat sessions');
		} finally {
			setLoadingSessions(false);
		}
	};

	const loadChatHistory = async (sessionId) => {
		try {
			const chatData = await getAiChatHistoryById(sessionId);
			if (chatData?.chatHistory) {
				setMessages(chatData.chatHistory.map((msg, idx) => ({
					id: idx + 1,
					type: msg.role === 'user' ? 'user' : 'assistant',
					content: msg.content,
					timestamp: new Date(msg.timestamp || new Date()),
					canSave: msg.role === 'assistant',
					// Lấy advisor info từ database nếu có
					advisor: msg.advisor ? {
						...msg.advisor,
						enableWebsearch: msg.advisor.enableWebsearch || false,
					} : null,
					citations: msg.citations || null,
					embeddingResults: msg.embeddingResults || null,
				})));
				// Chỉ set advisor từ database nếu chưa khôi phục session từ localStorage và chưa có advisor nào được chọn
				if (!hasRestoredSession && (!selectedAdvisor || selectedAdvisor === 'Chọn Advisor')) {
					const allAdvisors = [...advisorList, ...pipelineList];
					setSelectedAdvisor(chatData.advisorType || allAdvisors[0]?.key || 'Chọn Advisor');
				}
			}
		} catch {
			message.error('Không thể tải lịch sử chat');
		}
	};


	// Tạo chat mới nhanh không cần modal
	const createNewSessionQuick = async () => {
		try {
			const sessionTitle = `Chat ${new Date().toLocaleString('vi-VN')}`;
			const newSession = await createNewChatSession(
				currentUser.email || currentUser.id,
				selectedAdvisor,
				sessionTitle,
				'claude-3-5-haiku-20241022',
			);
			if (newSession.success) {
				// Set currentSessionId trước để đảm bảo session mới được highlight
				setCurrentSessionId(newSession.data.id);
				// Set message chào mừng cho session mới
				setMessages([{
					id: 1,
					type: 'assistant',
					content: 'Xin chào! Tôi là AI assistant. Bạn có thể chọn job template hoặc đặt câu hỏi trực tiếp.',
					timestamp: new Date(),
					canSave: false,
				}]);
				setHasRestoredSession(false); // Reset khi tạo session mới
				// Clear input và template selection
				setInputMessage('');
				setTemplateError(false);
				// Lưu ngay lập tức khi tạo session mới
				saveLastSelectedSession(newSession.data.id, selectedAdvisor);

				// Load chat sessions sau khi đã set currentSessionId
				await loadChatSessions();

				// Close sidebar on mobile when creating a new session
				closeSidebar();
				message.success('Đã tạo chat mới!');

				// Focus vào input field để user có thể bắt đầu gõ ngay
				setTimeout(() => {
					const inputElement = document.querySelector(`.${styles.messageInput}`);
					if (inputElement) {
						inputElement.focus();
					}
				}, 100);
			}
		} catch {
			message.error('Không thể tạo chat session mới');
		}
	};

	// Cập nhật tên chat session bằng tin nhắn đầu tiên
	const updateChatSessionTitle = async (sessionId, firstMessage) => {
		try {
			const currentChat = await getAiChatHistoryById(sessionId);
			const truncatedTitle = firstMessage.length > 20 ?
				firstMessage.substring(0, 20) + '...' : firstMessage;

			const updatedChatData = {
				...currentChat,
				title: truncatedTitle,
			};

			await updateAiChatHistory(updatedChatData);
			await loadChatSessions(); // Refresh sessions list
		} catch (error) {
			console.error('Error updating chat session title:', error);
		}
	};

	const selectChatSession = (sessionId) => {
		setCurrentSessionId(sessionId);
		setHasRestoredSession(false); // Reset khi user chọn session mới
		// Lưu ngay lập tức khi user chọn session
		saveLastSelectedSession(sessionId, selectedAdvisor);
		loadChatHistory(sessionId);
		// Close both sidebars on mobile when selecting a session
		closeSidebar();
		closeTemplateSidebar();
	};

	const deleteChatSession = async (sessionId) => {
		try {
			await deleteAiChatHistory(sessionId);
			if (currentSessionId === sessionId) {
				setCurrentSessionId(null);
				setMessages([{
					id: 1,
					type: 'assistant',
					content: 'Xin chào! Bạn có thể chọn job template hoặc đặt câu hỏi trực tiếp.',
					timestamp: new Date(),
					canSave: false,
				}]);
			}
			await loadChatSessions();
		} catch {
			message.error('Không thể xóa chat session');
		}
	};

	const handleJobSelect = (jobKey) => {
		if (!jobKey) {
			// Khi clear template
			setInputMessage('');
			setTemplateError(false);
			return;
		}
		const job = templateList.find(j => j.key === jobKey);
		if (job) {
			// Tự động chọn advisor mặc định nếu có
			if (job.defaultAdvisor) {
				// Kiểm tra xem advisor có tồn tại trong danh sách không
				const allAdvisors = [...advisorList, ...pipelineList];
				const advisorExists = allAdvisors.some(a => a.key === job.defaultAdvisor);

				if (advisorExists) {
					setSelectedAdvisor(job.defaultAdvisor);
					// Lưu ngay lập tức khi thay đổi advisor
					saveLastSelectedSession(currentSessionId, job.defaultAdvisor);
					console.log(`🎯 Auto-selected advisor: ${job.defaultAdvisor} for template: ${job.label}`);
				}
			}

			// Kiểm tra xem template có chứa &&& không
			if (job.template.includes('&&&')) {
				// Mở modal để edit template
				setSelectedTemplate(job);
				setTemplateEditModalVisible(true);
			} else {
				// Template không có &&&, điền trực tiếp vào input
				setInputMessage(job.template);
				setTemplateError(false);
			}
		}
		// Close template sidebar on mobile when selecting a template
		closeTemplateSidebar();
	};

	// Cập nhật advisor selection
	const handleAdvisorChange = (advisorKey) => {
		setSelectedAdvisor(advisorKey);
		// Lưu ngay lập tức khi thay đổi advisor
		saveLastSelectedSession(currentSessionId, advisorKey);
	};

	const handleInputChange = (e) => {
		const value = e.target.value;
		setInputMessage(value);

		// Kiểm tra xem template có chứa &&& không
		setTemplateError(value.includes('&&&'));

		// Xử lý gợi ý template khi gõ @
		const cursorPos = e.target.selectionStart || 0;
		setCursorPosition(cursorPos);

		// Tìm từ cuối cùng trước con trỏ
		const textBeforeCursor = value.substring(0, cursorPos);
		const words = textBeforeCursor.split(/\s/);
		const lastWord = words[words.length - 1];

		if (lastWord.startsWith('@')) {
			const searchTerm = lastWord.substring(1).toLowerCase();
			const suggestions = templateList.filter(template =>
				template.label.toLowerCase().includes(searchTerm),
			);

			if (suggestions.length > 0) {
				setTemplateSuggestions(suggestions);
				setShowTemplateSuggestions(true);
				setSelectedSuggestionIndex(0); // Reset về item đầu tiên
			} else {
				setShowTemplateSuggestions(false);
				setSelectedSuggestionIndex(-1);
			}
		} else {
			setShowTemplateSuggestions(false);
			setSelectedSuggestionIndex(-1);
		}
	};

	const handleTemplateSuggestionClick = (template) => {
		setShowTemplateSuggestions(false);
		setSelectedSuggestionIndex(-1);

		// Tự động chọn advisor mặc định nếu có
		if (template.defaultAdvisor) {
			// Kiểm tra xem advisor có tồn tại trong danh sách không
			const allAdvisors = [...advisorList, ...pipelineList];
			const advisorExists = allAdvisors.some(a => a.key === template.defaultAdvisor);

			if (advisorExists) {
				setSelectedAdvisor(template.defaultAdvisor);
				// Lưu ngay lập tức khi thay đổi advisor
				saveLastSelectedSession(currentSessionId, template.defaultAdvisor);
				console.log(`🎯 Auto-selected advisor: ${template.defaultAdvisor} for template suggestion: ${template.label}`);
			}
		}

		// Kiểm tra xem template có chứa &&& không
		if (template.template.includes('&&&')) {
			// Mở modal để edit template
			setSelectedTemplate(template);
			setTemplateEditModalVisible(true);
		} else {
			// Template không có &&&, điền trực tiếp vào input
			const textBeforeCursor = inputMessage.substring(0, cursorPosition);
			const textAfterCursor = inputMessage.substring(cursorPosition);

			// Tìm từ cuối cùng trước con trỏ
			const words = textBeforeCursor.split(/\s/);
			words[words.length - 1] = template.template; // Thay thế từ cuối (bao gồm @) bằng template

			const newText = words.join(' ') + textAfterCursor;
			setInputMessage(newText);
			setTemplateError(false);
		}
	};

	const handleClickOutside = () => {
		setShowTemplateSuggestions(false);
		setSelectedSuggestionIndex(-1);
	};

	// Template Edit Modal handlers
	const handleTemplateEditCancel = () => {
		setTemplateEditModalVisible(false);
		setSelectedTemplate(null);
	};

	const handleTemplateEditConfirm = (filledTemplate) => {
		// Tự động chọn advisor mặc định nếu có từ template đã chọn
		if (selectedTemplate && selectedTemplate.defaultAdvisor) {
			// Kiểm tra xem advisor có tồn tại trong danh sách không
			const allAdvisors = [...advisorList, ...pipelineList];
			const advisorExists = allAdvisors.some(a => a.key === selectedTemplate.defaultAdvisor);

			if (advisorExists) {
				setSelectedAdvisor(selectedTemplate.defaultAdvisor);
				// Lưu ngay lập tức khi thay đổi advisor
				saveLastSelectedSession(currentSessionId, selectedTemplate.defaultAdvisor);
				console.log(`🎯 Auto-selected advisor: ${selectedTemplate.defaultAdvisor} for template edit: ${selectedTemplate.label}`);
			}
		}

		setInputMessage(filledTemplate);
		setTemplateError(false);
		setTemplateEditModalVisible(false);
		setSelectedTemplate(null);
	};

	const sendMessage = async () => {
		if (!inputMessage.trim()) return;
		if (templateError) {
			message.error('Cần điền/ thay thế thông tin trong &&& trước khi gửi. Prompt không hỗ trợ kí tự &');
			return;
		}
		console.log('inputMessage', inputMessage);
		const userMessage = {
			id: Date.now(),
			type: 'user',
			content: inputMessage,
			timestamp: new Date(),
			canSave: false,
		};
		setMessages(prev => [...prev, userMessage]);
		setInputMessage('');
		setIsTyping(true);
		setNoEmbeddingResults(false); // Reset no results state

		try {
			// Kiểm tra xem selectedAdvisor có phải là pipeline không
			const selectedPipeline = pipelineList.find(p => p.key === selectedAdvisor);
			let finalResponse = null;
			let finalCitations = null;
			let finalEmbeddingResults = null;
			let advisorInfo = null;

			if (selectedPipeline && selectedPipeline.isPipeline) {
				// Xử lý AI Pipeline
				console.log('🚀 Processing AI Pipeline:', selectedPipeline.name);
				let currentInput = userMessage.content;
				const pipelineSteps = selectedPipeline.steps || [];
				const stepResults = [];

				for (let i = 0; i < pipelineSteps.length; i++) {
					const step = pipelineSteps[i];
					console.log(`🔧 Processing step ${i + 1}: ${step.name}`);

					// Tìm kiếm thông tin từ embedding nếu được bật cho step này
					// Lưu ý: Khi bật chế độ "Kho dữ liệu", câu hỏi sẽ được xử lý độc lập
					// không bao gồm context của cuộc hội thoại trước đó
					let embeddingContext = null;
					if (useEmbeddingSearch && i === 0) { // Chỉ tìm kiếm embedding ở bước đầu tiên
						// Sử dụng AI generation với embedding thay vì chỉ search
						const aiResponse = await generateAIResponseWithEmbedding(inputMessage, 5, 0.02, 'gpt-4.1-2025-04-14', 'text');
						if (aiResponse) {
							setNoEmbeddingResults(false);
							embeddingContext = {
								context: aiResponse.answer,
								results: aiResponse.chunks,
								totalFound: aiResponse.searchStats.totalFound,
								searchMethod: 'AI Generation with Embedding',
							};
							finalEmbeddingResults = {
								totalFound: aiResponse.searchStats.totalFound,
								results: aiResponse.chunks,
								searchMethod: 'AI Generation with Embedding',
								answer: aiResponse.answer,
							};
						} else {
							setNoEmbeddingResults(true);
						}
					}

					// Chuẩn bị system message cho step này
					let systemMessage = step.systemMessage || '';
					if (embeddingContext) {
						systemMessage += `\n\n=== THÔNG TIN THAM KHẢO TỪ HỆ THỐNG ===\n${embeddingContext.context}\n\nHãy sử dụng thông tin trên để trả lời câu hỏi của người dùng một cách chính xác và chi tiết.`;
					}

					// Chuẩn bị chat history cho step này
					// Nếu bật chế độ kho dữ liệu, chỉ sử dụng câu hỏi hiện tại
					let chatHistory;
					if (useEmbeddingSearch && i === 0) {
						// Chế độ kho dữ liệu: chỉ sử dụng câu hỏi hiện tại
						chatHistory = [
							{ role: 'system', content: systemMessage },
							{ role: 'user', content: currentInput },
						];
					} else {
						// Chế độ bình thường: sử dụng toàn bộ chat history
						const previousChatHistory = [...messages, userMessage].filter(m => m.type !== 'assistant' || m.id !== 1).map(m => ({
							role: m.type === 'user' ? 'user' : 'assistant',
							content: m.content,
							advisor: m.advisor,
						}));

						chatHistory = [
							{ role: 'system', content: systemMessage },
							...previousChatHistory, // Thêm chat history từ các tin nhắn trước
							...stepResults.map(result => ({
								role: 'assistant',
								content: result.content,
							})),
							{ role: 'user', content: currentInput },
						];
					}

					let stepResponse;
					if (step.enableWebsearch) {
						// Sử dụng webSearchChat nếu step có bật websearch
						try {
							const webSearchResponse = await webSearchChat({
								prompt: currentInput,
								model: step.model,
								chat_history: chatHistory,
							});
							console.log('🌐 WebSearch (pipeline) raw response:', webSearchResponse);
							stepResponse = {
								response: webSearchResponse.ai_response || webSearchResponse.message || 'Không có phản hồi từ websearch',
								success: webSearchResponse.success,
								citations: webSearchResponse.citations,
							};
						} catch (webSearchError) {
							console.error('Lỗi websearch ở step', i + 1, 'fallback về aiChat:', webSearchError);
							// Chỉ truyền thông tin cần thiết, không bao gồm description
							const stepInfo = {
								name: step.name,
								model: step.model,
								systemMessage: step.systemMessage,
								enableWebsearch: step.enableWebsearch,
							};
							stepResponse = await aiChat(chatHistory, currentInput, step.model, stepInfo);
							console.log('🧠 aiChat (pipeline) raw response:', stepResponse);
						}
					} else {
						// Sử dụng aiChat bình thường
						// Chỉ truyền thông tin cần thiết, không bao gồm description
						const stepInfo = {
							name: step.name,
							model: step.model,
							systemMessage: step.systemMessage,
							enableWebsearch: step.enableWebsearch,
						};
						stepResponse = await aiChat(chatHistory, currentInput, step.model, stepInfo);
						console.log('🧠 aiChat (pipeline) raw response:', stepResponse);
					}

					const stepResult = {
						stepName: step.name,
						content: stepResponse.response || stepResponse.message || 'Không có phản hồi từ AI',
						citations: stepResponse.citations,
					};

					stepResults.push(stepResult);
					currentInput = stepResult.content; // Output của step này sẽ là input của step tiếp theo

					// Lưu citations từ step cuối cùng
					if (i === pipelineSteps.length - 1) {
						finalCitations = stepResponse.citations;
					}

					console.log(`✅ Step ${i + 1} completed:`, stepResult.content.substring(0, 100) + '...');
				}

				finalResponse = currentInput; // Kết quả cuối cùng là output của step cuối cùng
				advisorInfo = {
					key: selectedAdvisor,
					name: selectedPipeline.name,
					enableWebsearch: false, // Pipeline không có websearch riêng
					isPipeline: true,
					steps: stepResults,
				};

				console.log('🎉 Pipeline completed successfully');
			} else {
				// Xử lý advisor đơn lẻ hoặc pipeline đơn lẻ
				let advisorKey = selectedAdvisor;
				let advisorObj = advisorList.find(a => a.key === advisorKey) || advisors.find(a => a.key === advisorKey);
				let pipelineObj = pipelineList.find(p => p.key === advisorKey);

				// Nếu là pipeline đơn lẻ
				if (pipelineObj && !pipelineObj.isPipeline) {
					advisorObj = pipelineObj;
				}

				let model = advisorObj?.model || 'claude-3-5-haiku-20241022';
				let systemMessage = advisorObj?.systemMessage || '';

				// Tìm kiếm thông tin từ embedding nếu được bật
				// Lưu ý: Khi bật chế độ "Kho dữ liệu", câu hỏi sẽ được xử lý độc lập
				// không bao gồm context của cuộc hội thoại trước đó
				let embeddingContext = null;
				if (useEmbeddingSearch) {
					// Sử dụng AI generation với embedding thay vì chỉ search
					const aiResponse = await generateAIResponseWithEmbedding(userMessage.content);
					console.log('🤖 aiResponse:', aiResponse);
					if (aiResponse && aiResponse.searchStats && aiResponse.searchStats.totalFound > 0) {
						console.log('📚 Found AI response with embedding context, enhancing prompt...');
						setNoEmbeddingResults(false);
						// Thêm context vào system message
						systemMessage += `\n\n=== THÔNG TIN THAM KHẢO TỪ HỆ THỐNG ===\n${aiResponse.answer}\n\nHãy sử dụng thông tin trên để trả lời câu hỏi của người dùng một cách chính xác và chi tiết.`;

						// Lưu thông tin về phương pháp tìm kiếm
						console.log(`🔍 AI Generation method used with embedding`);

						// Lưu thông tin embedding cho hiển thị
						finalEmbeddingResults = {
							totalFound: aiResponse.searchStats.totalFound,
							results: aiResponse.chunks,
							searchMethod: 'AI Generation with Embedding',
							answer: aiResponse.answer,
						};
					} else {
						console.log('📚 No relevant information found in database, proceeding without context');
						setNoEmbeddingResults(true);

						// Thêm thông báo rõ ràng khi bật kho dữ liệu nhưng không tìm thấy
						systemMessage += `\n\n=== THÔNG BÁO ===\nTôi đã tìm kiếm trong kho dữ liệu của hệ thống nhưng không tìm thấy thông tin liên quan đến câu hỏi của bạn. Tôi sẽ trả lời dựa trên kiến thức chung của mình.`;
					}
				}

				const currentAdvisorInfo = advisorList.find(a => a.key === advisorKey) || advisors.find(a => a.key === advisorKey);

				// Kiểm tra xem advisor có bật websearch không
				let response;

				// Chuẩn bị chat history cho cả websearch và aiChat
				// Nếu bật chế độ kho dữ liệu, chỉ sử dụng câu hỏi hiện tại
				let chatHistory;
				if (useEmbeddingSearch) {
					// Chế độ kho dữ liệu: chỉ sử dụng câu hỏi hiện tại
					chatHistory = [
						{ role: 'system', content: systemMessage },
						{ role: 'user', content: userMessage.content },
					];
				} else {
					// Chế độ bình thường: sử dụng toàn bộ chat history
					chatHistory = [
						{ role: 'system', content: systemMessage },
						...[...messages, userMessage].filter(m => m.type !== 'assistant' || m.id !== 1).map(m => ({
							role: m.type === 'user' ? 'user' : 'assistant',
							content: m.content,
							advisor: m.advisor,
						})),
					];
				}

				if (currentAdvisorInfo?.enableWebsearch) {
					// Sử dụng webSearchChat với chat history nếu advisor có bật websearch
					try {
						const webSearchResponse = await webSearchChat({
							prompt: userMessage.content,
							model: model,
							chat_history: chatHistory,
						});
						console.log('🌐 WebSearch raw response:', webSearchResponse);
						// Websearch trả về cấu trúc khác với aiChat
						response = {
							response: webSearchResponse.ai_response || webSearchResponse.message || 'Không có phản hồi từ websearch',
							success: webSearchResponse.success,
							citations: webSearchResponse.citations,
						};
					} catch (webSearchError) {
						console.error('Lỗi websearch, fallback về aiChat:', webSearchError);
						// Fallback về aiChat nếu websearch lỗi
						// Chỉ truyền thông tin cần thiết, không bao gồm description
						const advisorInfo = {
							name: currentAdvisorInfo?.name,
							model: currentAdvisorInfo?.model,
							systemMessage: currentAdvisorInfo?.systemMessage,
							enableWebsearch: currentAdvisorInfo?.enableWebsearch,
						};
						response = await aiChat(chatHistory, userMessage.content, model, advisorInfo);
						console.log('🧠 aiChat (fallback) raw response:', response);
					}
				} else {
					// Sử dụng aiChat bình thường
					// Chỉ truyền thông tin cần thiết, không bao gồm description
					const advisorInfo = {
						name: currentAdvisorInfo?.name,
						model: currentAdvisorInfo?.model,
						systemMessage: currentAdvisorInfo?.systemMessage,
						enableWebsearch: currentAdvisorInfo?.enableWebsearch,
					};
					response = await aiChat(chatHistory, userMessage.content, model, advisorInfo);
					console.log('🧠 aiChat raw response:', response);
				}

				finalResponse = response.response || response.message || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
				finalCitations = response.citations || null;
				// Chỉ set finalEmbeddingResults nếu chưa được set từ AI generation
				if (!finalEmbeddingResults) {
					finalEmbeddingResults = embeddingContext ? {
						totalFound: embeddingContext.totalFound,
						results: embeddingContext.results,
						searchMethod: embeddingContext.searchMethod,
					} : null;
				}
				advisorInfo = {
					key: advisorKey,
					name: currentAdvisorInfo?.name || advisorKey,
					enableWebsearch: currentAdvisorInfo?.enableWebsearch || false,
				};
			}

			// Tạo session mới nếu chưa có
			if (!currentSessionId) {
				const sessionTitle = `Chat ${new Date().toLocaleString('vi-VN')}`;
				const newSession = await createNewChatSession(
					currentUser.email || currentUser.id,
					selectedAdvisor,
					sessionTitle,
					advisorInfo.model || 'claude-3-5-haiku-20241022',
				);
				if (newSession.success) {
					setCurrentSessionId(newSession.data.id);
					await loadChatSessions();
				}
			}

			const assistantMessage = {
				id: Date.now() + 1,
				type: 'assistant',
				content: finalResponse,
				timestamp: new Date(),
				canSave: true,
				advisor: advisorInfo,
				citations: finalCitations,
				embeddingResults: finalEmbeddingResults,
			};
			console.log('✅ Final assistantMessage:', assistantMessage);
			if (finalCitations) {
				console.log('📎 Citations:', finalCitations);
			}
			if (finalEmbeddingResults) {
				console.log('📚 Embedding results summary:', {
					totalFound: finalEmbeddingResults.totalFound,
					method: finalEmbeddingResults.searchMethod,
					chunks: (finalEmbeddingResults.results || []).length,
				});
			}

			// Tạo tin nhắn cho nguồn dữ liệu nếu có
			let dataSourcesMessage = null;
			if (finalEmbeddingResults && finalEmbeddingResults.results && finalEmbeddingResults.results.length > 0) {
				console.log('📋 Creating data sources message with:', finalEmbeddingResults.results.length, 'results');
				dataSourcesMessage = {
					id: Date.now() + 2,
					type: 'data-sources',
					content: '📋 Nguồn dữ liệu được sử dụng:',
					timestamp: new Date(),
					canSave: false,
					advisor: advisorInfo,
					embeddingResults: finalEmbeddingResults,
				};
				console.log('📝 Data sources message:', dataSourcesMessage);
			} else {
				console.log('📋 No data sources message created. finalEmbeddingResults:', finalEmbeddingResults);
			}

			// Thêm tin nhắn AI trước, sau đó thêm tin nhắn nguồn dữ liệu nếu có
			setMessages(prev => {
				const newMessages = [...prev, assistantMessage];
				if (dataSourcesMessage) {
					newMessages.push(dataSourcesMessage);
				}
				return newMessages;
			});

			if (currentSessionId) {
				await addMessageToChat(currentSessionId, {
					role: 'user',
					content: userMessage.content,
					timestamp: new Date().toISOString(),
				});
				await addMessageToChat(currentSessionId, {
					role: 'assistant',
					content: assistantMessage.content,
					timestamp: new Date().toISOString(),
					advisor: {
						key: selectedAdvisor,
						name: advisorInfo.name,
						avatar: advisorInfo.avatar || '🤖',
						enableWebsearch: advisorInfo.enableWebsearch || false,
						isPipeline: advisorInfo.isPipeline || false,
						steps: advisorInfo.steps || null,
					},
					citations: assistantMessage.citations,
					embeddingResults: assistantMessage.embeddingResults,
				});
				// Không lưu tin nhắn data-sources vào database vì nó chỉ là hiển thị UI

				// Update session title with first message if this is the first user message
				const currentSession = await getAiChatHistoryById(currentSessionId);
				const userMsgCount = currentSession?.chatHistory?.filter(m => m.role === 'user').length || 0;

				if (userMsgCount === 1) {
					await updateChatSessionTitle(currentSessionId, userMessage.content);
				}

				await loadChatSessions();

				// Close sidebar on mobile after sending message
				closeSidebar();
			}
		} catch (error) {
			console.error('Error in sendMessage:', error);
			setMessages(prev => [...prev, {
				id: Date.now() + 1,
				type: 'assistant',
				content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.',
				timestamp: new Date(),
				canSave: false,
			}]);
			message.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
		} finally {
			setIsTyping(false);
		}
	};

	const handleKeyPress = (e) => {
		// Nếu đang hiển thị gợi ý template
		if (showTemplateSuggestions && templateSuggestions.length > 0) {
			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					setSelectedSuggestionIndex(prev => 
						prev < templateSuggestions.length - 1 ? prev + 1 : 0
					);
					break;
				case 'ArrowUp':
					e.preventDefault();
					setSelectedSuggestionIndex(prev => 
						prev > 0 ? prev - 1 : templateSuggestions.length - 1
					);
					break;
				case 'Enter':
				case 'Tab':
					e.preventDefault();
					if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < templateSuggestions.length) {
						handleTemplateSuggestionClick(templateSuggestions[selectedSuggestionIndex]);
					}
					break;
				case 'Escape':
					e.preventDefault();
					setShowTemplateSuggestions(false);
					setSelectedSuggestionIndex(-1);
					break;
				default:
					// Nếu không phải Enter thông thường, cho phép xử lý bình thường
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						sendMessage();
					}
					break;
			}
		} else {
			// Xử lý bình thường khi không có gợi ý
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		}
	};


	const loadAdvisorList = async () => {
		setAdvisorLoading(true);
		try {
			const setting = await getSettingByTypeExternal('ADVISOR_SETTING');
			setAdvisorList(setting?.setting && Array.isArray(setting.setting) && setting.setting.length > 0 ? setting.setting : advisors);
		} catch (e) {
			setAdvisorList(advisors);
		} finally {
			setAdvisorLoading(false);
		}
	};

	const loadPipelineList = async () => {
		try {
			const setting = await getSettingByTypeExternal('AI_PIPELINE_SETTING');
			setPipelineList(setting?.setting && Array.isArray(setting.setting) && setting.setting.length > 0 ? setting.setting : []);
		} catch (e) {
			setPipelineList([]);
		}
	};

	const saveAdvisorList = async (newList) => {
		setAdvisorLoading(true);
		try {
			await createOrUpdateSettingByTypeExternal({
				type: 'ADVISOR_SETTING',
				setting: newList,
			});
			setAdvisorList(newList);
			message.success('Đã lưu cấu hình Advisor!');
		} catch (e) {
			message.error('Lỗi khi lưu Advisor!');
		} finally {
			setAdvisorLoading(false);
		}
	};

	const isEditing = (record) => record.key === editingKey;

	const edit = (record) => {
		form.setFieldsValue({ ...record });
		setEditingKey(record.key);
	};

	const cancel = () => {
		setEditingKey('');
	};

	const save = async (key) => {
		try {
			const row = await form.validateFields();
			const newData = [...advisorList];
			const index = newData.findIndex((item) => key === item.key);
			if (index > -1) {
				newData[index] = { ...newData[index], ...row };
				await saveAdvisorList(newData);
				setEditingKey('');
			}
		} catch (errInfo) {
			// ignore
		}
	};

	const handleDelete = async (key) => {
		const newList = advisorList.filter(item => item.key !== key);
		await saveAdvisorList(newList);
	};

	const handleAdd = () => {
		setAdvisorEditModal({ visible: true, editing: null });
	};

	const handleEdit = (record) => {
		setAdvisorEditModal({ visible: true, editing: record });
	};

	const handleSaveAdvisor = async (values) => {
		let newList;
		if (advisorEditModal.editing) {
			// Edit
			newList = advisorList.map(item =>
				item.key === advisorEditModal.editing.key ? { ...item, ...values } : item,
			);
		} else {
			// Add
			newList = [...advisorList, { ...values, key: Date.now().toString() }];
		}
		await saveAdvisorList(newList);
		setAdvisorEditModal({ visible: false, editing: null });
	};

	// Callback để refresh advisor list khi có thay đổi từ modal
	const handleAdvisorUpdate = (newAdvisorList) => {
		setAdvisorList(newAdvisorList && Array.isArray(newAdvisorList) && newAdvisorList.length > 0 ? newAdvisorList : advisors);
	};

	// Callback để refresh template list khi có thay đổi từ modal
	const handleTemplateUpdate = (newTemplateList) => {
		if (newTemplateList && Array.isArray(newTemplateList) && newTemplateList.length > 0) {
			// Lọc template theo user hiện tại khi có cập nhật từ modal
			const userEmail = currentUser?.email || currentUser?.id;
			const filteredTemplates = newTemplateList.filter(template =>
				!template.userEmail || template.userEmail === userEmail
			);
			setTemplateList(filteredTemplates);
		} else {
			setTemplateList(jobTemplates);
		}
	};

	// Callback để refresh pipeline list khi có thay đổi từ modal
	const handlePipelineUpdate = (newPipelineList) => {
		setPipelineList(newPipelineList && Array.isArray(newPipelineList) && newPipelineList.length > 0 ? newPipelineList : []);
	};

	const toggleSidebar = () => {
		// Only allow toggling on mobile devices
		if (isMobile) {
			setSidebarCollapsed(!sidebarCollapsed);
		}
	};

	const closeSidebar = () => {
		if (isMobile) {
			setSidebarCollapsed(true);
		}
	};

	const toggleTemplateSidebar = () => {
		// Only allow toggling on mobile devices
		if (isMobile) {
			setTemplateSidebarCollapsed(!templateSidebarCollapsed);
		}
	};

	const closeTemplateSidebar = () => {
		if (isMobile) {
			setTemplateSidebarCollapsed(true);
		}
	};

	// Function để tách từ khóa quan trọng từ câu hỏi
	const extractKeywords = (query) => {
		// Loại bỏ các từ phổ biến không quan trọng
		const stopWords = [
			'khái niệm', 'nguồn gốc', 'định nghĩa', 'giải thích', 'là gì', 'của', 'và', 'hoặc', 'trong', 'về', 'cho', 'từ', 'đến', 'tại', 'ở', 'với', 'theo', 'như', 'cũng', 'này', 'đó', 'ấy', 'nọ', 'kia', 'đây', 'đó', 'kia', 'nọ', 'ấy', 'này', 'của', 'và', 'hoặc', 'trong', 'về', 'cho', 'từ', 'đến', 'tại', 'ở', 'với', 'theo', 'như', 'cũng', 'này', 'đó', 'ấy', 'nọ', 'kia', 'đây', 'đó', 'kia', 'nọ', 'ấy', 'này',
		];

		// Tách từ và lọc
		const words = query.toLowerCase().split(/\s+/);
		const keywords = words.filter(word =>
			word.length > 2 &&
			!stopWords.includes(word) &&
			!/^[0-9\s\-\_\.\,\!\?]+$/.test(word),
		);

		// Ưu tiên các từ viết hoa (thường là tên riêng, thuật ngữ)
		const priorityKeywords = words.filter(word =>
			word.length > 2 &&
			/[A-Z]/.test(word) &&
			!stopWords.includes(word.toLowerCase()),
		);

		return {
			allKeywords: keywords,
			priorityKeywords: priorityKeywords,
			originalQuery: query,
		};
	};

	// Function để tìm kiếm thông tin từ embedding
	const searchEmbeddingInfo = async (query) => {
		if (!useEmbeddingSearch || !query.trim()) {
			return null;
		}

		setEmbeddingSearchLoading(true);
		try {
			console.log('🔍 Original query:', query);

			// Tách từ khóa
			const keywords = extractKeywords(query);
			console.log('🔍 Extracted keywords:', keywords);

			// Thử nhiều cách tìm kiếm khác nhau
			const searchAttempts = [];

			// 1. Tìm kiếm với từ khóa ưu tiên (nếu có)
			if (keywords.priorityKeywords.length > 0) {
				searchAttempts.push({
					query: keywords.priorityKeywords.join(' '),
					description: 'Priority keywords',
				});
			}

			// 2. Tìm kiếm với tất cả từ khóa
			if (keywords.allKeywords.length > 0) {
				searchAttempts.push({
					query: keywords.allKeywords.join(' '),
					description: 'All keywords',
				});
			}

			// 3. Tìm kiếm với query gốc (fallback)
			searchAttempts.push({
				query: query,
				description: 'Original query',
			});

			// Thử từng cách tìm kiếm
			for (const attempt of searchAttempts) {
				console.log(`🔍 Trying search: ${attempt.description} - "${attempt.query}"`);

				try {
					// Sử dụng embedingDataService thay vì k9Service
					const response = await searchEmbedingDataByTextForTable(attempt.query, 'k9', 5, 0.3);
					console.log(`🔍 Response for ${attempt.description}:`, response);

					if (response.data && response.data.results && response.data.results.length > 0) {
						console.log(`📊 Found results with ${attempt.description}:`, response.data.results.length);

						// Tạo context từ kết quả tìm kiếm (sử dụng cấu trúc mới)
						const contextInfo = response.data.results.map((item, index) => {
							// Lấy chunk có similarity cao nhất cho mỗi K9Service
							const bestChunk = item.chunks && item.chunks.length > 0
								? item.chunks.reduce((best, chunk) =>
									chunk.similarity > best.similarity ? chunk : best,
								)
								: null;

							return `[Thông tin ${index + 1} - Độ tương đồng: ${(item.bestSimilarity * 100).toFixed(1)}%]
Tiêu đề: ${item.title}
Loại: ${item.type}
Danh mục: ${item.category}
Nội dung: ${bestChunk ? bestChunk.chunkText : 'Không có nội dung chi tiết'}`;
						}).join('\n\n');

						return {
							context: contextInfo,
							results: response.data.results,
							totalFound: response.data.totalFound,
							searchMethod: attempt.description,
						};
					}
				} catch (error) {
					console.error(`❌ Error with ${attempt.description}:`, error);
					continue; // Thử cách tiếp theo
				}
			}

			console.log('❌ No embedding results found with any search method');
			return null;
		} catch (error) {
			console.error('❌ Embedding search error:', error);
			return null;
		} finally {
			setEmbeddingSearchLoading(false);
		}
	};

	// Function để tạo câu trả lời AI dựa trên embedding
	const generateAIResponseWithEmbedding = async (query, limit = 5, threshold = 0.02, model = 'gpt-4.1-2025-04-14', type = 'text') => {
		if (!useEmbeddingSearch || !query.trim()) {
			return null;
		}
		setEmbeddingSearchLoading(true);
		try {
			console.log('🤖 Generating AI response with embedding for query:', query);
			// Không truyền table để tìm trên tất cả các chunk
			const response = await aiGenWithEmbedding(query);
			console.log('🤖 AI generation response:', response);

			// Kiểm tra response structure - handle both direct answer and nested answer.generated
			if (response && response.success && response.data) {
				let answer = response.data.answer;

				// Handle nested answer structure (answer.generated)
				if (answer && typeof answer === 'object' && answer.generated) {
					answer = answer.generated;
				}

				return {
					answer: answer,
					chunks: response.data.chunks || [],
					searchStats: response.data.searchStats || {},
					question: response.data.question,
					table: response.data.table,
				};
			} else if (response && response.data && response.data.answer) {
				// Fallback cho cấu trúc khác
				let answer = response.data.answer;

				// Handle nested answer structure (answer.generated)
				if (answer && typeof answer === 'object' && answer.generated) {
					answer = answer.generated;
				}

				return {
					answer: answer,
					chunks: response.data.chunks || [],
					searchStats: response.data.searchStats || {},
					question: response.data.question,
					table: response.data.table,
				};
			}

			console.log('❌ No valid response structure found:', response);
			return null;
		} catch (error) {
			console.error('❌ AI generation with embedding error:', error);
			return null;
		} finally {
			setEmbeddingSearchLoading(false);
		}
	};

	// Function để hiển thị chi tiết tài liệu
	const showEmbeddingDetail = async (item) => {
		console.log('🔍 Showing embedding detail:', item);
		console.log('🔍 Item structure:', {
			sourceId: item.sourceId,
			table: item.table,
			title: item.title,
			chunkText: item.chunkText,
			similarity: item.similarity,
			bestSimilarity: item.bestSimilarity,
		});
		setEmbeddingDetailLoading(true);
		try {
			let fullData = null;

			// Lấy thông tin đầy đủ từ database dựa trên table type
			if (item.table === 'news') {
				// Lấy từ k9Service với type là news
				const k9Data = await getK9ById(item.sourceId);
				console.log('📰 K9Service Data:', k9Data);
				if (k9Data && k9Data.data) {
					fullData = {
						...k9Data.data,
						title: k9Data.data.title || item.chunkText.split('\n')[0],
						type: 'news',
						category: 'Kho dữ liệu',
						bestSimilarity: item.similarity,
						chunks: [item],
					};
				}
			} else if (item.table === 'report') {
				// Lấy từ aiSummaryService với các trường dữ liệu khác
				console.log('📊 Fetching AI Summary for ID:', item.sourceId);
				const aiSummaryData = await getAISummaryById(item.sourceId);
				console.log('📊 AI Summary Data:', aiSummaryData);

				// Xử lý cả trường hợp trả về trực tiếp hoặc trong data property
				const summaryData = aiSummaryData?.data || aiSummaryData;

				if (summaryData) {
					// Lấy thông tin từ trường info nếu có
					let info = {};
					try {
						info = typeof summaryData.info === 'string'
							? JSON.parse(summaryData.info)
							: summaryData.info || {};
					} catch (e) {
						console.error('Error parsing info:', e);
						info = {};
					}

					fullData = {
						id: summaryData.id,
						title: info.title || summaryData.title || 'AI Summary',
						info: summaryData.info,
						summary1: summaryData.summary1,
						summary2: summaryData.summary2,
						tables: summaryData.tables,
						created_at: summaryData.created_at,
						type: 'report',
						category: 'AI Summary',
						bestSimilarity: item.similarity || 0,
						chunks: [item],
						// Thêm các trường khác từ summaryData nếu cần
						...summaryData,
					};
					console.log('📊 Full Data created:', fullData);
				} else {
					console.error('❌ No AI Summary data found for ID:', item.sourceId);
					console.error('❌ AI Summary response:', aiSummaryData);
				}
			}

			if (fullData) {
				// Lấy embedding data cho source này
				const embeddingData = await getEmbedingDataBySourceId(item.sourceId, item.table);
				console.log('📄 Embedding data:', embeddingData);

				// Kết hợp thông tin từ embedding search với dữ liệu đầy đủ
				const combinedData = {
					...fullData,
					embeddingData: embeddingData.data, // Thêm embedding data
				};

				setEmbeddingDetailModal({ visible: true, data: combinedData });
			} else {
				console.error('❌ No fullData created for item:', item);
				message.error('Không tìm thấy thông tin chi tiết cho tài liệu này');
			}
		} catch (error) {
			console.error('❌ Error fetching detail:', error);
			message.error('Không thể tải thông tin chi tiết tài liệu');
		} finally {
			setEmbeddingDetailLoading(false);
		}
	};

	// Function để đóng popup
	const closeEmbeddingDetail = () => {
		setEmbeddingDetailModal({ visible: false, data: null });
	};

	return (
		<>
			{/* Toggle button and Current Session Info - moved above playgroundContainer */}
			<div className={styles.controlsContainer} style={{

				display: 'flex',
				alignItems: 'center',
				padding: '0 16px',
				// gap: '16px',
				justifyContent: 'space-between'
			}}>
				{/* Left side - Toggle buttons and session controls */}
				<div style={{
					display: 'flex',
					alignItems: 'center',
					gap: '8px'
				}}>
					{/* Toggle button for template sidebar - only show on mobile */}
					{isMobile && (
						<button
							className={`${styles.toggleButton} ${styles.mobileToggleButton}`}
							onClick={toggleTemplateSidebar}
							title={templateSidebarCollapsed ? 'Mở template sidebar' : 'Đóng template sidebar'}
							style={{ left: '6px' }}
						>
							<BookOutlined />
						</button>
					)}

					{/* Toggle button for chat sessions sidebar - only show on mobile */}
					{isMobile && (
						<button
							className={`${styles.toggleButton} ${styles.mobileToggleButton}`}
							onClick={toggleSidebar}
							title={sidebarCollapsed ? 'Mở chat sidebar' : 'Đóng chat sidebar'}
							style={{ left: '45px' }}
						>
							<MenuOutlined />
						</button>
					)}

					{/* Current Session Info */}

				</div>

				{/* Right side - Embedding Search Switch */}
				{/* {currentSessionId && (
					<div className={styles.embeddingSwitchContainer}>
						<Space>
							<Switch
								checked={useEmbeddingSearch}
								onChange={setUseEmbeddingSearch}
								loading={embeddingSearchLoading}
								size='small'
							/>
							<span className={styles.embeddingSwitchLabel}>
								{embeddingSearchLoading ? '🔍 Đang tìm kiếm...' : '📚 Kho dữ liệu'}
							</span>
						</Space>
					</div>
				)} */}
			</div>

			<div className={styles.playgroundContainer}>
				{/* Overlay for mobile when sidebar is open */}
				<div
					className={`${styles.sidebarOverlay} ${(!sidebarCollapsed || !templateSidebarCollapsed) && isMobile ? styles.mobileOpen : ''}`}
					onClick={() => { closeSidebar(); closeTemplateSidebar(); }}
				/>
				<div
					className={`${styles.playgroundContent} ${sidebarCollapsed && templateSidebarCollapsed && !isMobile ? styles.sidebarCollapsed : ''} ${(!sidebarCollapsed || !templateSidebarCollapsed) && isMobile ? styles.mobileSidebarOpen : ''}`}>

					{/* Template Sidebar - Left */}
					<div
						className={`${styles.templateSidebar} ${templateSidebarCollapsed ? styles.collapsed : ''} ${!templateSidebarCollapsed && isMobile ? styles.mobileOpen : ''}`}>
						<div className={styles.sidebarHeader}>
							<h3><BookOutlined /> Templates</h3>
							<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
								{/* Mobile close button */}
								{isMobile && (
									<Button
										type="text"
										size="small"
										onClick={closeTemplateSidebar}
										className={styles.mobileCloseButton}
									>
										✕
									</Button>
								)}
							</div>
						</div>
						<div className={styles.templateList}>
							{templateList.length === 0 ? (
								<Empty description="Chưa có template nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
							) : (
								<List
									size="small"
									dataSource={templateList}
									renderItem={(template) => (
										<List.Item
											className={`${styles.templateItem} ${templateList.find(j => j.template === inputMessage)?.key === template.key ? styles.activeTemplate : ''}`}
											onClick={() => handleJobSelect(template.key)}
										>
											<div className={styles.templateContent}>
												<div className={styles.templateTitle}>{template.label}</div>
												<div className={styles.templatePreview}>
													{template.template.length > 60
														? template.template.substring(0, 60) + '...'
														: template.template
													}
												</div>
											</div>
										</List.Item>
									)}
								/>
							)}
						</div>

						{currentUser?.isAdmin && (
							<div style={{ padding: '16px 16px 8px 16px', width: '100%' }}>
								<Button
									icon={<SettingOutlined />}
									style={{ width: '100%' }}
									onClick={() => setTemplateModalVisible(true)}
								>
									Cài đặt Template
								</Button>
							</div>
						)}
					</div>

					{/* Chat Sessions Sidebar - Right */}
					<div
						className={`${styles.chatSessionsSidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${!sidebarCollapsed && isMobile ? styles.mobileOpen : ''}`}>
						<div className={styles.sidebarHeader}>
							<h3><HistoryOutlined /> Lịch sử Chat</h3>
							<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
								{/* Mobile close button */}
								{isMobile && (
									<Button
										type="text"
										size="small"
										onClick={closeSidebar}
										className={styles.mobileCloseButton}
									>
										✕
									</Button>
								)}
							</div>
						</div>
						<div className={styles.sessionsList}>
							{loadingSessions ? (
								<div className={styles.loadingText}>Đang tải...</div>
							) : chatSessions.length === 0 ? (
								<Empty description="Chưa có chat session nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
							) : (
								<List
									size="small"
									dataSource={chatSessions}
									renderItem={(session) => (
										<List.Item
											className={`${styles.sessionItem} ${currentSessionId === session.id ? styles.activeSession : ''}`}
											onClick={() => selectChatSession(session.id)}
										>
											<div className={styles.sessionContent}>
												<div className={styles.sessionTitle}><MessageOutlined /> {session.title}
												</div>
												<div className={styles.sessionInfo}>
													<span className={styles.sessionTime}>
														{formatTimeAgo(session.createAt)}
													</span>
												</div>
											</div>
											<Popconfirm
												title="Xóa chat session?"
												onConfirm={(e) => {
													e.stopPropagation();
													deleteChatSession(session.id);
												}}
												okText="Xóa"
												cancelText="Hủy"
											>
												<Button type='text' icon={<DeleteOutlined />} size='small'
													className={styles.deleteButton}
													onClick={e => e.stopPropagation()} />
											</Popconfirm>
										</List.Item>
									)}
								/>
							)}
						</div>


						{(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
							<div style={{ padding: '16px 16px 8px 16px', width: '100%' }}>
								<Button
									icon={<SettingOutlined />}
									style={{ width: '100%', marginBottom: '8px' }}
									onClick={() => setAdvisorModalVisible(true)}
								>
									Cài đặt Advisor
								</Button>
								<Button
									icon={<SettingOutlined />}
									style={{ width: '100%', marginBottom: '8px' }}
									onClick={() => setPipelineModalVisible(true)}
								>
									Cài đặt Pipeline
								</Button>
								<Button
									icon={<SettingOutlined />}
									style={{ width: '100%' }}
									onClick={() => setTemplateModalVisible(true)}
								>
									Cài đặt Template
								</Button>
							</div>
						)}
					</div>
					{/* Main Chat Area */}
					<div className={`${styles.chatMainArea} ${sidebarCollapsed ? styles.expanded : ''}`}>
						{/* Chat Interface */}
						<div className={styles.chatContainer}>
							{currentSessionId && (
								<div className={styles.currentSessionInfo} style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
									marginTop: -10,
									position: 'absolute',
									top: '10px',
									left: '0',
								}}>
									<Button
										type='primary'
										icon={<PlusOutlined />}
										onClick={createNewSessionQuick}
										className={styles.createChatSmall}
									>
										Chat mới
									</Button>

									{/* Template selector removed - now in left sidebar */}
								</div>
							)}
							<div className={styles.messagesArea}>
								{messages.map((message) => (
									<div
										key={message.id}
										className={`${styles.messageWrapper} ${message.type === 'user' ? styles.userMessage :
												message.type === 'data-sources' ? styles.dataSourcesMessage :
													styles.assistantMessage
											}`}
									>
										<div className={styles.messageContent}>
											{message.type === 'assistant' && (
												<div className={styles.advisorInfo}>
													<span className={styles.advisorName}>
														{message.advisor?.name || 'AI Assistant'}
														{message.advisor?.enableWebsearch && (
															<GlobalOutlined
																style={{ marginLeft: 8, color: '#1890ff' }}
																title='Sử dụng Websearch'
															/>
														)}
														{message.advisor?.isPipeline && (
															<span style={{
																backgroundColor: '#52c41a',
																color: 'white',
																padding: '2px 6px',
																borderRadius: '4px',
																fontSize: '10px',
																marginLeft: 8,
															}}>
																Pipeline ({message.advisor?.steps?.length || 0} bước)
															</span>
														)}
													</span>
												</div>
											)}
											{message.type === 'data-sources' && (
												<div className={styles.dataSourcesInfo}>
													<span className={styles.dataSourcesName}>
														📋 Nguồn dữ liệu
													</span>
												</div>
											)}
											<div className={styles.messageText}>
												{message.type === 'assistant' ?
													<div
														className={styles.markdownContent}
														dangerouslySetInnerHTML={{
															__html: DOMPurify.sanitize(marked.parse(message.content || '')),
														}}
													/> :
													message.type === 'data-sources' ? (
														<div className={styles.dataSourcesContent}>
															<div className={styles.dataSourcesList}>
																{(() => {
																	// Gộp các chunks theo sourceId
																	const groupedBySource = {};
																	message.embeddingResults.results.forEach(chunk => {
																		const sourceKey = `${chunk.table}_${chunk.sourceId}`;
																		if (!groupedBySource[sourceKey]) {
																			groupedBySource[sourceKey] = {
																				sourceId: chunk.sourceId,
																				table: chunk.table,
																				chunks: [],
																				bestSimilarity: 0,
																				title: chunk.chunkText.split('\n')[0] || `Nguồn ${chunk.table} ID ${chunk.sourceId}`,
																			};
																		}
																		groupedBySource[sourceKey].chunks.push(chunk);
																		// Cập nhật similarity cao nhất
																		if (chunk.similarity > groupedBySource[sourceKey].bestSimilarity) {
																			groupedBySource[sourceKey].bestSimilarity = chunk.similarity;
																			groupedBySource[sourceKey].title = chunk.chunkText.split('\n')[0] || `Nguồn ${chunk.table} ID ${chunk.sourceId}`;
																		}
																	});

																	// Chuyển thành array và sắp xếp theo similarity
																	const groupedResults = Object.values(groupedBySource)
																		.sort((a, b) => b.bestSimilarity - a.bestSimilarity);

																	return groupedResults.map((source, index) => (
																		<div
																			key={index}
																			className={styles.dataSourceItem}
																			onClick={() => showEmbeddingDetail({
																				sourceId: source.sourceId,
																				table: source.table,
																				title: source.title,
																				type: source.table,
																				category: 'Kho dữ liệu',
																				bestSimilarity: source.bestSimilarity,
																				chunks: source.chunks,
																			})}
																			title='Click để xem chi tiết nguồn'
																		>
																			<div className={styles.dataSourceHeader}>
																				<span className={styles.dataSourceTitle}>
																					<SourceTitle
																						sourceId={source.sourceId}
																						table={source.table}
																						fallbackTitle={source.title}
																					/>
																				</span>
																				<span
																					className={styles.dataSourceSimilarity}>
																					{(source.bestSimilarity * 100).toFixed(1)}%
																				</span>
																			</div>
																			<div className={styles.dataSourceMeta}>
																				<span
																					className={styles.dataSourceType}>{source.table}</span>
																				<span
																					className={styles.dataSourceId}>ID: {source.sourceId}</span>
																				{source.chunks.length > 1 && (
																					<span
																						className={styles.dataSourceChunks}>
																						({source.chunks.length} đoạn)
																					</span>
																				)}
																			</div>
																			<div className={styles.dataSourcePreview}>
																				{/* Hiển thị preview từ chunk có similarity cao nhất */}
																				{(() => {
																					const bestChunk = source.chunks.reduce((best, chunk) =>
																						chunk.similarity > best.similarity ? chunk : best,
																					);
																					return bestChunk.chunkText.length > 150
																						? bestChunk.chunkText.substring(0, 150) + '...'
																						: bestChunk.chunkText;
																				})()}
																			</div>
																		</div>
																	));
																})()}
															</div>
														</div>
													) : (
														<>{message.content}</>
													)}
											</div>
											{message.citations && message.citations.groundingChunks && (
												<div className={styles.citationsSection}>
													<div className={styles.citationsTitle}>
														<GlobalOutlined style={{ marginRight: 4 }} />
														Nguồn tham khảo:
													</div>
													<div className={styles.citationsList}>
														{message.citations.groundingChunks.map((chunk, index) => (
															<div key={index} className={styles.citationItem}>
																<a
																	href={chunk.web?.uri}
																	target='_blank'
																	rel='noopener noreferrer'
																	className={styles.citationLink}
																	title={chunk.web?.uri || `Nguồn ${index + 1}`}
																>
																	{(() => {
																		const text = chunk.web?.uri || `Nguồn ${index + 1}`;
																		return chunk.web?.title + ' ( ' + text.substring(0, 70) + '...)';
																	})()}
																</a>
															</div>
														))}
													</div>
												</div>
											)}

											{/* Embedding Results Section - Only show when found */}
											{message.embeddingResults && message.embeddingResults.totalFound > 0 && (
												<div className={styles.embeddingResultsSection}>
													<div className={styles.embeddingResultsTitle}>
														📚 Thông tin từ kho dữ liệu
														({message.embeddingResults.totalFound} nguồn)
														{message.embeddingResults.searchMethod && (
															<span className={styles.searchMethodInfo}>
																- Tìm kiếm: {message.embeddingResults.searchMethod}
															</span>
														)}:
													</div>
													<div className={styles.embeddingResultsList}>
														{(() => {
															// Gộp các chunks theo sourceId
															const groupedBySource = {};
															message.embeddingResults.results.forEach(item => {
																const sourceKey = `${item.table}_${item.sourceId}`;
																if (!groupedBySource[sourceKey]) {
																	groupedBySource[sourceKey] = {
																		sourceId: item.sourceId,
																		table: item.table,
																		chunks: [],
																		bestSimilarity: 0,
																		title: item?.chunkText?.split('\n')[0] || `Nguồn ${item.table} ID ${item.sourceId}` || '',
																	};
																}
																groupedBySource[sourceKey].chunks.push(item);
																// Cập nhật similarity cao nhất
																if (item.similarity > groupedBySource[sourceKey].bestSimilarity) {
																	groupedBySource[sourceKey].bestSimilarity = item.similarity;
																	groupedBySource[sourceKey].title = item?.chunkText?.split('\n')[0] || `Nguồn ${item.table} ID ${item.sourceId}` || '';
																}
															});

															// Chuyển thành array và sắp xếp theo similarity
															const groupedResults = Object.values(groupedBySource)
																.sort((a, b) => b.bestSimilarity - a.bestSimilarity);

															return groupedResults.map((source, index) => (
																<div
																	key={index}
																	className={styles.embeddingResultItem}
																	onClick={() => showEmbeddingDetail({
																		sourceId: source.sourceId,
																		table: source.table,
																		title: source.title,
																		type: source.table,
																		category: 'Kho dữ liệu',
																		bestSimilarity: source.bestSimilarity,
																		chunks: source.chunks,
																	})}
																	title='Click để xem chi tiết'
																>
																	<div className={styles.embeddingResultTitle}>
																		<SourceTitle
																			sourceId={source.sourceId}
																			table={source.table}
																			fallbackTitle={source.title}
																		/>
																	</div>
																	<div className={styles.embeddingResultMeta}>
																		<span className={styles.embeddingResultType}>
																			{source.table}
																		</span>
																		<span className={styles.embeddingResultId}>
																			ID: {source.sourceId}
																		</span>
																		<span className={styles.embeddingResultSimilarity}>
																			{(source.bestSimilarity * 100).toFixed(1)}%
																		</span>
																		{source.chunks.length > 1 && (
																			<span className={styles.embeddingResultChunks}>
																				({source.chunks.length} đoạn)
																			</span>
																		)}
																	</div>
																</div>
															));
														})()}
													</div>
												</div>
											)}


											{/* No Embedding Results Notice - Only show when embedding search is enabled and no results found */}
											{useEmbeddingSearch && noEmbeddingResults && message.type === 'assistant' && (
												<div className={styles.noEmbeddingResultsSection}>
													<div className={styles.noEmbeddingResultsTitle}>
														🔍 Không tìm thấy thông tin liên quan trong kho dữ liệu
													</div>
													<div className={styles.noEmbeddingResultsText}>
														Tôi đã tìm kiếm trong kho dữ liệu của hệ thống nhưng không tìm thấy
														thông tin phù hợp với câu hỏi của bạn.
														Trả lời trên đây dựa trên kiến thức chung của tôi.
													</div>
													<div className={styles.noEmbeddingResultsSuggestion}>
														💡 Gợi ý: Thử đặt câu hỏi khác hoặc sử dụng từ khóa khác để tìm kiếm.
													</div>
												</div>
											)}
											<div className={styles.messageTime}>
												{/*Nút tạo thesis chỉ hiển thị cho tin nhắn assistant*/}
												{/* {message.type === 'assistant' && (
													<Button
														type='text'
														size='small'
														icon={<BookOutlined />}
														onClick={(e) => {
															e.stopPropagation();
															openThesisModal(message.content, message.id);
														}}
														title='Tạo Sổ ngày từ nội dung này'
														className={styles.thesisButton}
													>
														Lưu vào sổ cá nhân
													</Button>
												)} */}
												{message.timestamp.toLocaleTimeString('vi-VN', {
													hour: '2-digit',
													minute: '2-digit',
												})}
											</div>
										</div>
									</div>
								))}
								{isTyping && (
									<div className={`${styles.messageWrapper} ${styles.assistantMessage}`}>
										<Avatar size={32} icon={<RobotOutlined />} className={styles.messageAvatar}
											style={{ background: '#667eea' }} />
										<div className={styles.messageContent}>
											<div className={styles.typingIndicator}><span></span><span></span><span></span>
											</div>
										</div>
									</div>
								)}
							</div>
							{/* Advisor Selection Buttons */}
							{currentSessionId && (
								<div className={styles.advisorButtonsContainer}>
									<div className={styles.advisorButtons}>
										{/* Regular Advisors */}
										{advisorList.map((advisor) => (
											<Button
												key={advisor.key}
												type={selectedAdvisor == advisor.key ? 'primary' : 'default'}
												size='small'
												onClick={() => handleAdvisorChange(advisor.key)}
												className={`${styles.advisorButton} ${selectedAdvisor == advisor.key ? styles.advisorButtonSelected : ''}`}
											>
												<span
													style={{
														marginLeft: 4,
														fontWeight: selectedAdvisor == advisor.key ? '600' : '500',
													}}>
													{advisor.name}
													{advisor.enableWebsearch && (
														<GlobalOutlined
															title='Sử dụng Websearch'
															style={{ marginLeft: 4 }}
														/>
													)}
													{advisor.description && (
														<Tooltip title={advisor.description} placement="top">
															<QuestionCircleOutlined
																style={{ marginLeft: 4, fontSize: '12px', color: '#8c8c8c' }}
															/>
														</Tooltip>
													)}</span>
											</Button>
										))}

										{/* Pipeline Advisors */}
										{pipelineList.map((pipeline) => (
											<Button
												key={pipeline.key}
												type={selectedAdvisor == pipeline.key ? 'primary' : 'default'}
												size='small'
												onClick={() => handleAdvisorChange(pipeline.key)}
												className={`${styles.advisorButton} ${pipeline.isPipeline ? styles.pipelineButton : ''} ${selectedAdvisor == pipeline.key ? (pipeline.isPipeline ? styles.pipelineButtonSelected : styles.advisorButtonSelected) : ''}`}
											>
												<span
													style={{
														marginLeft: 4,
														fontWeight: selectedAdvisor == pipeline.key ? '600' : '500',
													}}>
													{pipeline.name}
													{pipeline.isPipeline && (
														<svg width="10" height="10" viewBox="0 0 41 45" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px' }}>
															<path d="M8.0971 14.1239C9.71415 14.1239 11.265 13.4815 12.4084 12.3381C13.5518 11.1947 14.1942 9.64384 14.1942 8.02678C14.1942 6.40973 13.5518 4.85891 12.4084 3.71549C11.265 2.57206 9.71415 1.92969 8.0971 1.92969C6.48005 1.92969 4.92923 2.57206 3.7858 3.71549C2.64237 4.85891 2 6.40973 2 8.02678C2 9.64384 2.64237 11.1947 3.7858 12.3381C4.92923 13.4815 6.48005 14.1239 8.0971 14.1239ZM8.0971 14.1239V30.3828M8.0971 30.3828C6.48005 30.3828 4.92923 31.0252 3.7858 32.1686C2.64237 33.312 2 34.8629 2 36.4799C2 38.097 2.64237 39.6478 3.7858 40.7912C4.92923 41.9346 6.48005 42.577 8.0971 42.577C9.71415 42.577 11.265 41.9346 12.4084 40.7912C13.5518 39.6478 14.1942 38.097 14.1942 36.4799C14.1942 34.8629 13.5518 33.312 12.4084 32.1686C11.265 31.0252 9.71415 30.3828 8.0971 30.3828ZM38.5826 26.3181C38.5826 27.9351 37.9402 29.4859 36.7968 30.6294C35.6534 31.7728 34.1025 32.4152 32.4855 32.4152C30.8684 32.4152 29.3176 31.7728 28.1742 30.6294C27.0308 29.4859 26.3884 27.9351 26.3884 26.3181C26.3884 24.701 27.0308 23.1502 28.1742 22.0068C29.3176 20.8633 30.8684 20.221 32.4855 20.221C34.1025 20.221 35.6534 20.8633 36.7968 22.0068C37.9402 23.1502 38.5826 24.701 38.5826 26.3181Z" stroke="#7D7D7D" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
															<path d="M26.3889 26.3192H20.2919C17.0577 26.3192 13.9561 25.0345 11.6693 22.7476C9.3824 20.4607 8.09766 17.3591 8.09766 14.125" stroke="#7D7D7D" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
														</svg>
													)}
													{pipeline.description && (
														<Tooltip title={pipeline.description} placement="top">
															<QuestionCircleOutlined
																style={{ marginLeft: 4, fontSize: '12px', color: '#8c8c8c' }}
															/>
														</Tooltip>
													)}
												</span>
											</Button>
										))}
									</div>
								</div>
							)}
							<div className={styles.inputArea}>
								<div className={styles.inputWrapper} style={{ position: 'relative' }}>
									<TextArea
										value={inputMessage}
										onChange={handleInputChange}
										onKeyDown={handleKeyPress}
										placeholder={currentSessionId ? 'Nhập câu hỏi... (Gõ @ để chọn template)' : 'Tạo chat để bắt đầu...'}
										autoSize={{ minRows: 1, maxRows: 4, minWidth: 120 }}
										className={`${styles.messageInput} ${templateError ? styles.templateError : ''}`}
										disabled={!currentSessionId}
									/>
									{showTemplateSuggestions && (
										<div className={styles.templateSuggestions} ref={suggestionsRef}>
											{templateSuggestions.map((template, index) => (
												<div
													key={template.key}
													className={`${styles.suggestionItem} ${
														index === selectedSuggestionIndex ? styles.suggestionItemSelected : ''
													}`}
													onClick={() => handleTemplateSuggestionClick(template)}
												>
													<div className={styles.suggestionLabel}>{template.label}</div>
													<div className={styles.suggestionPreview}>
														{template.template.length > 50
															? template.template.substring(0, 50) + '...'
															: template.template
														}
													</div>
												</div>
											))}
										</div>
									)}
									<div className={styles.inputButtons}>
										{/* Nút lưu toàn bộ cuộc trò chuyện vào thesis */}
										<Button
											type='primary'
											icon={<SendOutlined />}
											onClick={sendMessage}
											disabled={!inputMessage.trim() || isTyping || !currentSessionId || templateError}
											className={styles.sendButton}
											title={templateError ? '' : ''}
										/>
										{currentSessionId && messages.length > 1 && (
											<Button
												type='default'
												icon={<BookOutlined />}
												onClick={openChatThesisModal}
												disabled={isTyping}
												className={styles.chatThesisButton}
												title='Lưu toàn bộ cuộc trò chuyện vào sổ cá nhân'
												size='small'
											>
												Lưu
											</Button>
										)}
									</div>
								</div>
							</div>
							<i>
								<small style={{ fontSize: 11.5 }}>
									* Cần điền/ thay thế thông tin trong &&& trước khi gửi. Prompt không hỗ trợ kí tự &
								</small>
							</i>
						</div>
						{!currentSessionId && (
							<div className={styles.welcomeSection}>
								<div className={styles.welcomeText}>
									<h3>Chào mừng đến với AI Chat</h3>
									<p>Tạo chat mới để bắt đầu trò chuyện
										<br />với AI advisor</p>
								</div>
								<Button
									size='large'
									icon={<PlusOutlined />}
									onClick={createNewSessionQuick}
									className={styles.createChatBtn}
								>
									CHAT MỚI
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
			{
				(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
					<>
						<AdvisorSettingModal
							visible={advisorModalVisible}
							onClose={() => setAdvisorModalVisible(false)}
							onAdvisorUpdate={handleAdvisorUpdate}
						/>
						<TemplateSettingModal
							visible={templateModalVisible}
							onClose={() => setTemplateModalVisible(false)}
							onTemplateUpdate={handleTemplateUpdate}
						/>
						<AiPipelineSettingModal
							visible={pipelineModalVisible}
							onClose={() => setPipelineModalVisible(false)}
							onPipelineUpdate={handlePipelineUpdate}
						/>
					</>
				)

			}


			{/* Thesis Creation Modal */}
			<Modal
				title={
					<div className={styles.thesisModalTitle}>
						<BookOutlined />
						{isCreatingNewThesis ? 'Tạo Sổ ngày mới' : 'Thêm vào Sổ ngày'}
					</div>
				}
				open={thesisModalVisible}
				onCancel={closeThesisModal}
				footer={[
					<Button key='cancel' onClick={closeThesisModal}>
						Hủy
					</Button>,
					<Button
						key='submit'
						type='primary'
						loading={creatingThesis}
						onClick={() => thesisForm.submit()}
					>
						{isCreatingNewThesis ? 'Tạo Sổ ngày' : 'Thêm vào Sổ ngày'}
					</Button>,
				]}
				width={700}
				confirmLoading={creatingThesis || generatingSummary}
			>
				<div style={{ marginBottom: 16 }}>
					<Alert
						message='Thông tin'
						description={generatingSummary
							? 'Đang tạo tóm tắt tự động bằng AI...'
							: isChatThesis
								? 'Đang lưu toàn bộ cuộc trò chuyện với chế độ rút gọn mặc định.'
								: 'Nội dung và tóm tắt đã được tạo tự động từ câu trả lời của AI. Bạn có thể chỉnh sửa trước khi lưu.'
						}
						type='info'
						showIcon
						style={{ marginBottom: 16 }}
					/>
				</div>

				{/* Mode Selection - chỉ hiển thị cho lưu 1 chat */}
				{!isChatThesis && (
					<div style={{ marginBottom: 16 }}>
						<div style={{ fontWeight: 500, marginBottom: 8 }}>Chế độ lưu:</div>
						<Space>
							<Button
								type={thesisMode === 'original' ? 'primary' : 'default'}
								onClick={() => setThesisMode('original')}
								size='small'
							>
								📝 Nguyên văn
							</Button>
							<Button
								type={thesisMode === 'summarized' ? 'primary' : 'default'}
								onClick={() => setThesisMode('summarized')}
								size='small'
							>
								📋 Rút gọn
							</Button>
						</Space>
						<div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
							{thesisMode === 'original'
								? 'Lưu nội dung nguyên văn không thay đổi'
								: 'Sử dụng AI để rút gọn nội dung trước khi lưu'
							}
						</div>
					</div>
				)}

				{/* Prompt Setting cho rút gọn */}
				{thesisMode === 'summarized' && (
					<div style={{ marginBottom: 16 }}>
						<div style={{ fontWeight: 500, marginBottom: 4 }}>Prompt rút gọn:</div>
						<Input.TextArea
							value={summarizePrompt}
							onChange={(e) => setSummarizePrompt(e.target.value)}
							rows={6}
							placeholder="Nhập prompt để AI rút gọn nội dung..."
							style={{ fontSize: '13px', lineHeight: '1.4' }}
						/>
						<div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
							Prompt này sẽ được sử dụng để AI rút gọn nội dung thành định dạng Markdown có cấu trúc
						</div>
					</div>
				)}

				{/* Thesis Selection */}
				<div style={{ marginBottom: 16 }}>
					<Space direction='vertical' style={{ width: '100%' }}>
						<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
							<Switch
								checked={isCreatingNewThesis}
								onChange={(checked) => {
									setIsCreatingNewThesis(checked);
									if (checked) {
										setSelectedThesisId(null);
									}
								}}
								size='small'
							/>
							<span style={{ fontSize: '14px', fontWeight: 500 }}>
								{isCreatingNewThesis ? 'Tạo Sổ ngày mới' : 'Thêm vào Sổ ngày sẵn có'}
							</span>
						</div>

						{!isCreatingNewThesis && (
							<Select
								placeholder='Chọn Sổ ngày để thêm vào...'
								value={selectedThesisId}
								onChange={setSelectedThesisId}
								style={{ width: '100%' }}
								showSearch
								filterOption={(input, option) =>
									option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
								}
							>
								{thesisList.filter(thesis => thesis.userCreated === (currentUser?.email || currentUser?.id)).map(thesis => (
									<Select.Option key={thesis.id} value={thesis.id}>
										{thesis.name || `Sổ ngày #${thesis.id}`}
									</Select.Option>
								))}
							</Select>
						)}
					</Space>
				</div>

				<Form
					form={thesisForm}
					layout='vertical'
					onFinish={createThesisFromModal}
				>
					{/* Trường tên thesis - chỉ hiển thị khi tạo mới */}
					{isCreatingNewThesis && (
						<Form.Item
							name='name'
							label='Tên thesis'
							rules={[{ required: true, message: 'Vui lòng nhập tên thesis' }]}
						>
							<Input
								placeholder='Nhập tên Sổ ngày...'
								onChange={(e) => {
									setThesisData(prev => ({ ...prev, name: e.target.value }));
								}}
							/>
						</Form.Item>
					)}

					<Form.Item
						name='content'
						label={
							<div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
								<span>Nội dung</span>
								<span style={{ fontSize: '12px', color: '#666' }}>
									{thesisData.content.length} ký tự
								</span>
							</div>
						}
						rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
					>
						<TextArea
							rows={10}
							placeholder='Nội dung Sổ ngày sẽ được tạo từ câu trả lời của AI'
							style={{
								fontFamily: 'monospace',
								fontSize: '13px',
								lineHeight: '1.5',
							}}
							onChange={(e) => {
								setThesisData(prev => ({ ...prev, content: e.target.value }));
							}}
						/>
					</Form.Item>

					{/* Tạm ẩn phần Tóm tắt */}
					{false && (
						<Form.Item
							name='summary'
							label={
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span>Tóm tắt</span>
									<span style={{ fontSize: '12px', color: '#666' }}>
										{thesisData.summary.length} ký tự
									</span>
									<Button
										type='text'
										size='small'
										icon={<Sparkles size={14} />}
										onClick={generateSummaryWithAI}
										loading={generatingSummary}
										title='Sử dụng AI để tạo tóm tắt tự động'
										className={styles.aiSummaryButton}
									>
										AI Tóm tắt
									</Button>
								</div>
							}
							rules={[{ required: true, message: 'Vui lòng nhập tóm tắt' }]}
						>
							<TextArea
								rows={4}
								placeholder={generatingSummary
									? 'Đang tạo tóm tắt tự động...'
									: 'Tóm tắt ngắn gọn về nội dung Sổ ngày (hoặc click nút AI Tóm tắt để tạo tự động)'
								}
								disabled={generatingSummary}
								onChange={(e) => {
									setThesisData(prev => ({ ...prev, summary: e.target.value }));
								}}
							/>
						</Form.Item>
					)}
				</Form>
			</Modal>

			{/* Embedding Detail Modal */}
			<Modal
				title={
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						📚 Chi tiết tài liệu
					</div>
				}
				open={embeddingDetailModal.visible}
				onCancel={closeEmbeddingDetail}
				footer={[
					<Button key='close' onClick={closeEmbeddingDetail}>
						Đóng
					</Button>,
				]}
				width={'80vw'}
				confirmLoading={embeddingDetailLoading}
			>
				<div style={{ height: '90vh' }}>
					{embeddingDetailLoading ? (
						<div style={{ textAlign: 'center', padding: '40px 20px' }}>
							<div className={styles.typingIndicator}>
								<span></span><span></span><span></span>
							</div>
							<p style={{ marginTop: '16px', color: '#666' }}>Đang tải thông tin chi tiết...</p>
						</div>
					) : embeddingDetailModal.data && (
						<div className={styles.embeddingDetailContent}>
							<div className={styles.embeddingDetailHeader}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<h3>{embeddingDetailModal.data.title}</h3>

								</div>
								<div className={styles.embeddingDetailMeta}>
									<span className={styles.embeddingDetailType}>
										Loại: {embeddingDetailModal.data.type}
									</span>
									<span className={styles.embeddingDetailCategory}>
										Danh mục: {embeddingDetailModal.data.category}
									</span>
									<span className={styles.embeddingDetailSimilarity}>
										Độ tương đồng: {(embeddingDetailModal.data.chunks[0].bestSimilarity * 100).toFixed(1)}%
									</span>
									{embeddingDetailModal.data.createdAt && (
										<span className={styles.embeddingDetailDate}>
											Ngày tạo: {new Date(embeddingDetailModal.data.createdAt).toLocaleDateString('vi-VN')}
										</span>
									)}
									{embeddingDetailModal.data.source && (
										<span className={styles.embeddingDetailSource}>
											Nguồn: {embeddingDetailModal.data.source}
										</span>
									)}
									{embeddingDetailModal.data.emoji && (
										<span className={styles.embeddingDetailEmoji}>
											Emoji: {embeddingDetailModal.data.emoji}
										</span>
									)}
								</div>
							</div>
							<div style={{ height: 'calc(85vh - 370px)', overflow: 'auto' }}>
								{/* Hiển thị thông tin chi tiết dựa trên loại tài liệu */}
								{embeddingDetailModal.data.type === 'report' ? (
									// Hiển thị thông tin AI Summary cho report
									<div style={{ fontSize: 15 }}>
										<div><b>ID:</b> {embeddingDetailModal.data.id}</div>
										<div><b>Title:</b> {(() => {
											try {
												const info = typeof embeddingDetailModal.data.info === 'string' ? JSON.parse(embeddingDetailModal.data.info) : embeddingDetailModal.data.info;
												return info?.title || '-';
											} catch {
												return '-';
											}
										})()}</div>
										<div><b>URLReport:</b> {(() => {
											try {
												const info = typeof embeddingDetailModal.data.info === 'string' ? JSON.parse(embeddingDetailModal.data.info) : embeddingDetailModal.data.info;
												return info?.URLReport ? <a href={info.URLReport} target='_blank'
													rel='noopener noreferrer'>{info.URLReport}</a> : '-';
											} catch {
												return '-';
											}
										})()}</div>
										<div style={{ margin: '12px 0' }}><b>Summary:</b><br />
											<div style={{
												background: '#f6f8fa',
												padding: 10,
												borderRadius: 6,
												whiteSpace: 'pre-wrap',
											}}>{embeddingDetailModal.data.summary1 || '-'}</div>
										</div>
										<div style={{ margin: '12px 0' }}><b>Detail:</b><br />
											<div style={{
												background: '#f6f8fa',
												padding: 10,
												borderRadius: 6,
												whiteSpace: 'pre-wrap',
											}}>{embeddingDetailModal.data.summary2 || '-'}</div>
										</div>

										{/* Display Tables */}
										{embeddingDetailModal.data.tables && (() => {
											try {
												const tables = typeof embeddingDetailModal.data.tables === 'string' ? JSON.parse(embeddingDetailModal.data.tables) : embeddingDetailModal.data.tables;
												if (Array.isArray(tables) && tables.length > 0) {
													return (
														<div style={{ margin: '12px 0' }}>
															<b>📊 Bảng thông số:</b><br />
															<div style={{ marginTop: '8px' }}>
																{tables.map((table, index) => (
																	<div key={table.id || index} style={{
																		background: '#f6f8fa',
																		padding: '12px',
																		borderRadius: '6px',
																		marginBottom: '12px',
																		border: '1px solid #e1e4e8',
																	}}>
																		<div style={{
																			display: 'flex',
																			justifyContent: 'space-between',
																			alignItems: 'center',
																			marginBottom: '8px',
																		}}>
																			<h4 style={{ margin: 0, color: '#1890ff' }}>
																				{table.name || `Bảng ${index + 1}`}
																			</h4>
																			<span style={{
																				padding: '2px 8px',
																				backgroundColor: '#e6f7ff',
																				borderRadius: '4px',
																				fontSize: '12px',
																				color: '#1890ff',
																			}}>
																				{table.type === 'quarterly' ? 'Theo quý' :
																					table.type === 'monthly' ? 'Theo tháng' :
																						'Theo năm'}
																			</span>
																		</div>

																		{table.data && Object.keys(table.data).length > 0 ? (
																			<div style={{
																				display: 'grid',
																				gridTemplateColumns:
																					table.type === 'quarterly' ? 'repeat(4, 1fr)' :
																						table.type === 'monthly' ? 'repeat(6, 1fr)' :
																							'repeat(3, 1fr)',
																				gap: '8px',
																				backgroundColor: '#fff',
																				padding: '12px',
																				borderRadius: '4px',
																			}}>
																				{Object.entries(table.data).map(([key, value]) => (
																					<div key={key} style={{
																						textAlign: 'center',
																						padding: '8px',
																						backgroundColor: '#f5f5f5',
																						borderRadius: '3px',
																					}}>
																						<div style={{
																							fontWeight: 'bold',
																							fontSize: '12px',
																						}}>{key}</div>
																						<div style={{
																							fontSize: '14px',
																							color: '#1890ff',
																						}}>
																							{value || '-'}
																						</div>
																					</div>
																				))}
																			</div>
																		) : (
																			<div style={{
																				textAlign: 'center',
																				color: '#999',
																				padding: '20px',
																				backgroundColor: '#fff',
																				borderRadius: '4px',
																			}}>
																				Chưa có dữ liệu
																			</div>
																		)}
																	</div>
																))}
															</div>
														</div>
													);
												}
											} catch (e) {
												console.error('Error parsing tables:', e);
											}
											return null;
										})()}

										<div><b>Created
											At:</b> {embeddingDetailModal.data.created_at ? new Date(embeddingDetailModal.data.created_at).toLocaleString() : '-'}
										</div>
									</div>
								) : (
									// Hiển thị thông tin thông thường cho các loại khác
									<>
										{embeddingDetailModal.data.summary && (
											<div className={styles.embeddingDetailSummary}>
												<h4>📋 Tóm tắt:</h4>
												<p>{embeddingDetailModal.data.summary}</p>
											</div>
										)}

										{embeddingDetailModal.data.detail && (
											<div className={styles.embeddingDetailBody}>
												<h4>📄 Nội dung chi tiết:</h4>
												<div
													className={styles.markdownContent}
													dangerouslySetInnerHTML={{
														__html: DOMPurify.sanitize(marked.parse(embeddingDetailModal.data.detail || '')),
													}}
												/>
											</div>
										)}

										{!embeddingDetailModal.data.detail && !embeddingDetailModal.data.summary && (
											<div className={styles.embeddingDetailEmpty}>
												<p>Không có nội dung chi tiết cho tài liệu này.</p>
											</div>
										)}
									</>
								)}
							</div>
						</div>
					)}
				</div>
			</Modal>

			{/* Template Edit Modal */}
			<TemplateEditModal
				visible={templateEditModalVisible}
				onCancel={handleTemplateEditCancel}
				onConfirm={handleTemplateEditConfirm}
				template={selectedTemplate}
			/>
		</>
	);
};

export default AiChatTab;

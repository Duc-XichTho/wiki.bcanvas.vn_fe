import { useContext, useEffect, useState } from 'react';
import { Button, Card, Empty, Input, List, Spin, Tooltip, message, Popconfirm, Dropdown, Select, Switch } from 'antd';
import css from './AIFreeChat.module.css';
import { History, MessageSquare, Send, Settings, PlusCircle, Trash2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { MyContext } from '../../../MyContext.jsx';
import { createTimestamp, formatDateToDDMMYYYY } from '../../../generalFunction/format.js';
import {
	getAllFreeChatHistory,
	createAIFreeChatHistory,
	deleteAIFreeChatHistory,
	updateAIFreeChatHistory,
	getAIFreeChatHistoryById,
} from '../../../apis/aiFreeChatHistoryService.jsx';
import { getSettingByType, updateSetting, createSetting } from '../../../apis/settingService.jsx';
import ModelConfigModal from './ModelConfigModal.jsx';
import { sendQuestionToAI, webSearch } from '../../../apis/botService.jsx';
import { MODEL_AI_LIST, MODEL_AI_LIST_SEARCH } from '../../../CONST.js';
import TemplateModal from './TemplateModal.jsx';
import SaveAnalysisModal from '../SaveAnalysisModal.jsx';
import { Save } from 'lucide-react';
import Loading3DTower from '../../../components/Loading3DTower';

let resultDefault = 'Kết quả AI trả lời';

// Add queue system
const analyzeQueue = [];
let isProcessingQueue = false;

export default function AIFreeChat({ onQueueLengthChange, isActivated = false }) {
    const { currentUser } = useContext(MyContext);
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState(resultDefault);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [queueLength, setQueueLength] = useState(0);
    const [modelConfig, setModelConfig] = useState({
        model: MODEL_AI_LIST[0].value,
        // model: MODEL_AI_LIST_SEARCH[0].value,
        enable_web_search: false,
        system_message: `Bạn là một trợ lý AI thời sự thông minh, có quyền truy cập internet để tìm kiếm thông tin.
Nhiệm vụ của bạn:
1. Luôn sử dụng tìm kiếm web nếu người dùng yêu cầu thông tin cập nhật (kinh tế, chính trị, xã hội...).
2. Chỉ sử dụng thông tin mới, **không sử dụng thông tin cũ trước năm {new Date().getFullYear()}**.
3. Luôn dẫn nguồn cụ thể (báo chí, website uy tín).
4. Nếu không chắc chắn, phải thông báo rõ thay vì phỏng đoán.
5. Không sử dụng thông tin cũ trước năm ${new Date().getFullYear()}.
Hôm nay là: ${new Date().toLocaleDateString('vi-VN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		})}`,
	});
	const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
	const [templateModalOpen, setTemplateModalOpen] = useState(false);
	const [selectedQueueItem, setSelectedQueueItem] = useState(null);
	const [isSaveAnalysisModalOpen, setIsSaveAnalysisModalOpen] = useState(false);
	useEffect(() => {
		if (currentUser?.email && isActivated) {
			fetchChatHistory(currentUser);
			getAIConfig();
		}
	}, [currentUser, isActivated]);

	useEffect(() => {
		if (onQueueLengthChange) {
			onQueueLengthChange(queueLength);
		}
	}, [queueLength, onQueueLengthChange]);

	const getAIConfig = async () => {
		try {
			const defaultConfig = {
				model: MODEL_AI_LIST[0].value,
				enable_web_search: false,
				system_message: `
Bạn là một trợ lý AI thời sự thông minh, có quyền truy cập internet để tìm kiếm thông tin.
Nhiệm vụ của bạn:
1. Luôn sử dụng tìm kiếm web nếu người dùng yêu cầu thông tin cập nhật (kinh tế, chính trị, xã hội...).
2. Chỉ sử dụng thông tin mới, **không sử dụng thông tin cũ trước năm {new Date().getFullYear()}**.
3. Luôn dẫn nguồn cụ thể (báo chí, website uy tín).
4. Nếu không chắc chắn, phải thông báo rõ thay vì phỏng đoán.
5. Không sử dụng thông tin cũ trước năm ${new Date().getFullYear()}.
Hôm nay là: ${new Date().toLocaleDateString('vi-VN', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
				})}`,
			};
			setModelConfig(defaultConfig);

		} catch (error) {
			console.error('Error loading AI config:', error);
			message.error('Không thể tải cấu hình AI');
		}
	};

	const handlePromptChange = (e) => {
		setPrompt(e.target.value);
		setSelectedHistoryId(null);
	};

	const handleConfigSave = async (newConfig) => {
		try {
			const data = await getSettingByType('AI_FREE_CHAT_CONFIG');
			if (data && data.setting) {
				// Update existing config
				const response = await updateSetting({
					...data,
					setting: newConfig,
				});
				if (response.success) {
					setModelConfig(newConfig);
					message.success('Đã lưu cấu hình AI');
				}
			} else {
				// Create new config
				const response = await createSetting({
					type: 'AI_FREE_CHAT_CONFIG',
					setting: newConfig,
				});
				if (response.success) {
					setModelConfig(newConfig);
					message.success('Đã tạo cấu hình AI');
				}
			}
		} catch (error) {
			console.error('Error saving AI config:', error);
			message.error('Không thể lưu cấu hình AI');
		}
	};

	const fetchChatHistory = async (data) => {
		try {
			setIsHistoryLoading(true);
			const response = await getAllFreeChatHistory();
			if (response.success && Array.isArray(response.data)) {
				setChatHistory(response.data.filter(item => item.userCreated === currentUser?.email));
			}
		} catch (error) {
			console.error('Error fetching chat history:', error);
			message.error('Không thể tải lịch sử chat');
		} finally {
			setIsHistoryLoading(false);
		}
	};

	const processQueue = async () => {
		if (isProcessingQueue || analyzeQueue.length === 0) return;

		isProcessingQueue = true;
		const request = analyzeQueue[0];

		try {
			setIsLoading(true);
			console.log(request);

			let data;
			if (request.config.enable_web_search) {
				// Khi bật tìm kiếm web, gọi webSearch với model gemini 2.5 flash
				data = await webSearch({
					prompt: request.prompt,
					model: 'gpt-5-mini-2025-08-07',
				});
			} else {
				// Logic cũ
				data = await sendQuestionToAI({
					prompt: request.prompt,
					model: request.model,
					system_message: request.system_message,
					config: request.config,
				});
			}
			console.log(data);

			let answer;
			let annotations = [];

					if (request.config.enable_web_search) {
			// Xử lý kết quả từ webSearch
			if (data?.success && data?.ai_response) {
				answer = data.ai_response;
			} else {
				answer = 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.';
			}
		} else if (data?.status === 200 && data?.data?.result) {
				// Handle GPT-4.1 response format
				if (request.model === 'gpt-4.1-2025-04-14' || request.model === 'gpt-4.1-mini-2025-04-14') {
					if (Array.isArray(data.data.result)) {
						const resultItem = data.data.result[0];
						if (resultItem.type === 'text') {
							answer = resultItem.text;
							annotations = resultItem.annotations || [];
						}
					}
				} else {
					// Handle regular response format
					answer = data.data.result;
				}
			} else {
				answer = 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.';
			}

			if (answer) {
				setResult(answer);

				// Save to chat history
				await createAIFreeChatHistory({
					quest: request.prompt,
					result: answer,
					email: currentUser?.email,
					create_at: createTimestamp(),
					model: request.config.enable_web_search ? 'gemini 2.5 flash' : request.model,
					userCreated: currentUser?.email,
					more_info: {
						enable_web_search: request.config.enable_web_search,
						system_message: request.system_message,
						annotations: annotations, // Add annotations to more_info
					},
				});

				// Refresh chat history
				await fetchChatHistory(currentUser);
			} else {
				setResult('Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.');
			}
		} catch (error) {
			console.error('Error processing queue:', error);
			setResult('Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.');
		} finally {
			setIsLoading(false);
			analyzeQueue.shift(); // Xóa request đã xử lý
			setQueueLength(analyzeQueue.length); // Cập nhật độ dài queue
			isProcessingQueue = false;
			processQueue(); // Xử lý request tiếp theo nếu có
		}
	};

	async function analyze() {
		try {
			// Thêm request vào queue
			analyzeQueue.push({
				prompt,
				model: modelConfig.model,
				system_message: modelConfig.system_message,
				config: {
					enable_web_search: modelConfig.enable_web_search,
					tools: modelConfig.enable_web_search ? [
						{
							type: 'web_search',
							description: 'Search the web for current information',
						},
					] : [],
				},
				timestamp: new Date().toISOString(),
			});
			setQueueLength(analyzeQueue.length);

			// Bắt đầu xử lý queue
			processQueue();
		} catch (error) {
			console.error('Error analyzing:', error);
			setResult('Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.');
		}
	}

	const handleAnalyze = () => {
		if (!prompt.trim()) return;
		analyze();
	};

	const handleSelectHistory = async (item) => {
		try {
			setSelectedHistoryId(item.id);
			setPrompt(item.quest);
			setResult(item.result);
			if (item.model) {
				setModelConfig(prev => ({
					...prev,
					model: item.model,
					...item.config,
				}));
			}

			// Fetch full details if needed
			const response = await getAIFreeChatHistoryById(item.id);
			if (response.success) {
				// Update local state with full details if needed
				const updatedHistory = chatHistory.map(history =>
					history.id === item.id ? response.data : history,
				);
				setChatHistory(updatedHistory);
			}
		} catch (error) {
			console.error('Error fetching chat history details:', error);
			message.error('Không thể tải chi tiết lịch sử chat');
		}
	};

	const handleDeleteHistory = async (id, e) => {
		try {
			await deleteAIFreeChatHistory(id).then(res => {

				message.success('Đã xóa lịch sử chat');
				fetchChatHistory(currentUser);

			});

		} catch (error) {
			console.error('Error deleting chat history:', error);
			message.error('Không thể xóa lịch sử chat');
		}
	};

	const handleUpdateHistory = async (id, updatedData) => {
		try {
			const response = await updateAIFreeChatHistory({
				id,
				...updatedData,
			});
			if (response.success) {
				message.success('Đã cập nhật lịch sử chat');
				await fetchChatHistory(currentUser);
			}
		} catch (error) {
			console.error('Error updating chat history:', error);
			message.error('Không thể cập nhật lịch sử chat');
		}
	};

	const calculateProcessTime = (questionTime, answerTime) => {
		const start = new Date(questionTime);
		const end = new Date(answerTime);
		const diffInSeconds = (end - start) / 1000;
		return `${diffInSeconds.toFixed(2)}s`;
	};

	const handleModelChange = (value) => {
		setModelConfig(prev => ({
			...prev,
			model: value,
		}));
	};

	const handleTemplateClick = () => {
		setTemplateModalOpen(true);
	};

	const handleTemplateSelect = (question) => {
		setPrompt(question);
	};

	const handleWebSearchChange = (checked) => {
		setModelConfig(prev => ({
			...prev,
			enable_web_search: checked,
			model: checked ? MODEL_AI_LIST_SEARCH[0].value : MODEL_AI_LIST[0].value,
		}));
	};

	return (
		<div className={css.aiLayout}>
			<div className={css.aiSidebar}>
				<div className={css.aiSection}>
					<div className={css.aiSectionTitle}>
						<div style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							justifyContent: 'space-between',
							width: '100%',
						}}>
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
									}}
									className={css.newQuestionButton}
								/>
							</div>
						</div>
					</div>
					<div className={css.questionContainer}>
						<Input.TextArea
							value={prompt}
							onChange={handlePromptChange}
							style={{
								height: 'calc(100% - 30px)',
								margin: '12px 0',
								fontSize: 16,
								border: 'none',
								boxShadow: 'none',
								resize: 'none',
								padding: '12px',
								backgroundColor: '#fff',
							}}
							placeholder='Nhập câu hỏi (lưu ý: AI Navigator chưa hỗ trợ tìm kiếm thông tin thời gian thực)'
							onPressEnter={e => {
								if (!e.shiftKey) {
									e.preventDefault();
									handleAnalyze();
								}
							}}
						/>
					</div>
					<div style={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: 'center',
						width: '97%',
						padding: '8px 0',
						borderTop: '1px solid #f0f0f0',
						marginTop: '8px',
						gap: '12px',
					}}>
						<div style={{
							display: 'flex',
							alignItems: 'center',
							gap: '16px',
						}}>
							<div style={{
							    display: 'flex',
							    alignItems: 'center',
							    gap: '8px',
							    padding: '4px 8px',
							    borderRadius: '4px',
							}}>
							    <span style={{ fontSize: '12px' }}>Tìm kiếm web</span>
							    <Switch
							        checked={modelConfig.enable_web_search}
							        onChange={handleWebSearchChange}
							        size="small"
							    />
							</div>
							{!modelConfig.enable_web_search && (
								<Select
									value={modelConfig.model || MODEL_AI_LIST_SEARCH[0].value}
									onChange={handleModelChange}
									style={{ width: 160 }}
									options={modelConfig.enable_web_search ? MODEL_AI_LIST_SEARCH : MODEL_AI_LIST}
									fieldNames={{ label: 'name', value: 'value' }}
								/>
							)}
						</div>
						<Button
							type='primary'
							className={css.sendButton}
							onClick={handleAnalyze}
							loading={isLoading}
							icon={<Send size={16} />}
						>
							Gửi
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
						loading={isHistoryLoading}
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
										{formatDateToDDMMYYYY(item.create_at)}
									</div>
								</Card>
							</Dropdown>
						)}
					/>
				</div>
			</div>

			<div className={css.aiMain}>
				<div className={css.allMainContainer}>
					<div className={css.aiAnswerBox}>
						{isLoading ? (
							<div style={{ textAlign: 'center', padding: '20px' }}>
								<Loading3DTower />
								<div style={{ marginTop: '10px' }}>Đang xử lý yêu cầu...</div>
							</div>
						):(
							<>
							{result && result !== resultDefault ?
								<div>
									<div style={{
										height: '30px',
										width: '100%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'end',
										marginBottom: '10px',
									}}>
										<Button
											style={{
												color: '#1677ff',
												width: 'fit-content',
												height: '100%',
											}}
											type='text' icon={<Save size={16} />}
											onClick={() => setIsSaveAnalysisModalOpen(true)}>
											Lưu văn bản phân tích
										</Button>
									</div>
									<div
										className={css.markedContent}
										dangerouslySetInnerHTML={{
											__html: DOMPurify.sanitize(marked(result)),
										}}
									/>
								</div>
								: <div className={css.markedContent}>
									<p>{result}</p>
								</div>}
								</>
						)}
					</div>
				</div>
			</div>

			<ModelConfigModal
				isOpen={isConfigModalOpen}
				onClose={() => setIsConfigModalOpen(false)}
				config={modelConfig}
				onSave={handleConfigSave}
			/>

			<TemplateModal
				isOpen={templateModalOpen}
				onClose={() => setTemplateModalOpen(false)}
				onSelectTemplate={handleTemplateSelect}
				currentUser={currentUser}
			/>

			<SaveAnalysisModal
				open={isSaveAnalysisModalOpen}
				onClose={() => setIsSaveAnalysisModalOpen(false)}
				initialContent={result}
				currentUser={currentUser}
			/>
		</div>
	);
}

import { useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { getFileChildDataById, updateFileChild } from '../../../../../apis/fileChildService.jsx';
import { Button, Card, Input, List, message, Select, Spin, Modal, Progress } from 'antd';
import { FileText, History, MessageSquare, Send, Settings, BookOpenCheck, Trash2, Clock, User } from 'lucide-react';
import {
	sendQuestionSourceIDToAIDataFileOne,
	sendRequestEmbedDataFile,
} from '../../../../../apis/serviceApi/serviceApi.jsx';
import DOMPurify from 'dompurify';
import css from './DocAnalyst.module.css';
import { createTimestamp, formatDateToDDMMYYYY } from '../../../../../generalFunction/format.js';
import { uploadPdfFile } from '../../../../../apis/botService.jsx';
import { getUserChatHistoryFile, deleteChatHistoryFile } from '../../../../../apis/chatHistoryFileService.jsx';
import { MyContext } from '../../../../../MyContext.jsx';
import { getSettingByType, updateSetting, createSetting } from '../../../../../apis/settingService.jsx';
import FileTemplateModal from '../File/FileLayout/FileTemplateModal.jsx';
import DocAnalystConfigModal from '../../../../../components/DocAnalystConfigModal/DocAnalystConfigModal.jsx';

const FILE_TEMPLATE_SETTING_TYPE = 'FILE_LAYOUT_TEMPLATE';
const DOC_ANALYST_CONFIG_TYPE = 'DOC_ANALYST_CONFIG';

export default function DocAnalyst() {
	const { idFile } = useParams();
	const { currentUser, loadData, setLoadData } = useContext(MyContext);
	const [data, setData] = useState();
	const [prompt, setPrompt] = useState('');
	const [prompt2, setPrompt2] = useState('');
	const [results, setResults] = useState({});
	const [isLoading, setIsLoading] = useState({});
	const [ocrModalOpen, setOcrModalOpen] = useState(false);
	const [processingFiles, setProcessingFiles] = useState([]);
	const [chatHistories, setChatHistories] = useState({});
	const [isHistoryLoading, setIsHistoryLoading] = useState({});
	const [templates, setTemplates] = useState([]);
	const [settingId, setSettingId] = useState(null);
	const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
	const [isDocAnalystConfigModalOpen, setIsDocAnalystConfigModalOpen] = useState(false);
	const [docAnalystConfig, setDocAnalystConfig] = useState({
		setting: 'Bạn là một trợ lý AI chuyên phân tích tài liệu. Hãy trả lời câu hỏi dựa trên nội dung tài liệu được cung cấp.',
	});
	const [docAnalystSettingId, setDocAnalystSettingId] = useState(null);
	const [selectedHistoryId, setSelectedHistoryId] = useState(null);
	const [fileStates, setFileStates] = useState({});
	const [ocrStates, setOcrStates] = useState({});
	const [ongoingQuestions, setOngoingQuestions] = useState({});

	const fetchTemplates = async () => {
		try {
			const data = await getSettingByType(FILE_TEMPLATE_SETTING_TYPE);
			if (data) {
				setTemplates(data.setting || []);
				setSettingId(data.id);
			} else {
				setTemplates([]);
				setSettingId(null);
			}
		} catch (error) {
			console.error('Error fetching templates:', error);
		}
	};

	const fetchDataFileChild = async () => {
		try {
			const value = await getFileChildDataById(idFile);
			if (value?.id) {
				if (value.url) {
					value.url = encodeURI(value.url);
				}
				setData(value);
			}
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu file con:', error);
		}
	};

	const fetchChatHistory = async () => {
		try {
			setIsHistoryLoading(prev => ({
				...prev,
				[idFile]: true,
			}));
			const response = await getUserChatHistoryFile(currentUser, idFile);
			if (response.success && Array.isArray(response.data)) {
				setChatHistories(prev => ({
					...prev,
					[idFile]: response.data.sort((a, b) => b.id - a.id),
				}));
			}
		} catch (error) {
			console.error('Error fetching chat history:', error);
		} finally {
			setIsHistoryLoading(prev => ({
				...prev,
				[idFile]: false,
			}));
		}
	};

	const fetchDocAnalystConfig = async () => {
		try {
			const data = await getSettingByType(DOC_ANALYST_CONFIG_TYPE);
			if (data) {
				setDocAnalystConfig({ setting: data.setting.systemMessage } || {
					setting: 'Bạn là một trợ lý AI chuyên phân tích tài liệu. Hãy trả lời câu hỏi dựa trên nội dung tài liệu được cung cấp.',
				});
				setDocAnalystSettingId(data.id);
			}
		} catch (error) {
			console.error('Error fetching doc analyst config:', error);
		}
	};

	const handleDocAnalystConfigSave = async (newConfig) => {
		try {
			if (docAnalystSettingId) {
				await updateSetting({
					id: docAnalystSettingId,
					type: DOC_ANALYST_CONFIG_TYPE,
					setting: newConfig,
				});
			} else {
				const response = await createSetting({
					type: DOC_ANALYST_CONFIG_TYPE,
					setting: newConfig,
				});
				setDocAnalystSettingId(response.id);
			}
			setDocAnalystConfig(newConfig);
			message.success('Đã cập nhật cấu hình phân tích');
		} catch (error) {
			console.error('Error saving doc analyst config:', error);
			message.error('Không thể lưu cấu hình');
		}
	};

	useEffect(() => {
		if (idFile) {
			fetchDataFileChild();
			if (!fileStates[idFile]) {
				setFileStates(prev => ({
					...prev,
					[idFile]: {
						prompt: '',
						result: '',
						selectedHistoryId: null,
					},
				}));
			} else {
				setPrompt(fileStates[idFile].prompt);
				setResults(prev => ({
					...prev,
					[idFile]: fileStates[idFile].result,
				}));
				setSelectedHistoryId(fileStates[idFile].selectedHistoryId);
			}
			setIsLoading(prev => ({
				...prev,
				[idFile]: prev[idFile] === undefined ? false : prev[idFile],
			}));
			fetchChatHistory();
		}
	}, [idFile]);

	useEffect(() => {
		fetchDataFileChild();
	}, [loadData]);

	useEffect(() => {
		fetchTemplates();
		fetchDocAnalystConfig();
	}, []);

	const handleAnalyze = async () => {
		if (!prompt.trim()) {
			message.warning('Vui lòng nhập câu hỏi cần phân tích');
			return;
		}
		const questionId = Date.now();
		try {
			setIsLoading(prev => ({
				...prev,
				[idFile]: true,
			}));
			setOngoingQuestions(prev => ({
				...prev,
				[idFile]: [
					...prev[idFile] || [],
					{
						id: questionId,
						question: prompt,
						status: 'processing',
						created_at: createTimestamp(),
						fileId: idFile,
					},
				],
			}));

			const response = await sendQuestionSourceIDToAIDataFileOne({
				question: prompt,
				systemMessage: docAnalystConfig.setting,
				template: prompt2,
				sourceIds: [idFile],
				email: currentUser?.email,
				timeAsk: createTimestamp(),
			});

			if (response?.success && response?.data?.success) {
				const newResult = response.data.data.answer;
				setResults(prev => ({
					...prev,
					[idFile]: newResult,
				}));
				setFileStates(prev => ({
					...prev,
					[idFile]: {
						...prev[idFile],
						prompt,
						result: newResult,
					},
				}));
				setOngoingQuestions(prev => ({
					...prev,
					[idFile]: prev[idFile].filter(q => q.id !== questionId),
				}));
				const chatHistoryResponse = await getUserChatHistoryFile(currentUser, idFile);
				if (chatHistoryResponse.success && Array.isArray(chatHistoryResponse.data)) {
					setChatHistories(prev => ({
						...prev,
						[idFile]: chatHistoryResponse.data.sort((a, b) => b.id - a.id),
					}));
				}
			} else {
				setOngoingQuestions(prev => ({
					...prev,
					[idFile]: prev[idFile].map(q =>
						q.id === questionId
							? { ...q, status: 'error', error: 'Có lỗi xảy ra khi phân tích tài liệu' }
							: q,
					),
				}));
				message.error('Có lỗi xảy ra khi phân tích tài liệu');
			}
		} catch (error) {
			setOngoingQuestions(prev => ({
				...prev,
				[idFile]: prev[idFile].map(q =>
					q.id === questionId
						? { ...q, status: 'error', error: 'Có lỗi xảy ra khi phân tích tài liệu' }
						: q,
				),
			}));
			console.error('Lỗi khi phân tích:', error);
			message.error('Có lỗi xảy ra khi phân tích tài liệu');
		} finally {
			setIsLoading(prev => ({
				...prev,
				[idFile]: false,
			}));
		}
	};

	const handleSelectHistory = (item) => {
		setPrompt(item.question);
		setResults(prev => ({
			...prev,
			[idFile]: item.answer,
		}));
		setSelectedHistoryId(item.id);
		setFileStates(prev => ({
			...prev,
			[idFile]: {
				...prev[idFile],
				prompt: item.question,
				result: item.answer,
				selectedHistoryId: item.id,
			},
		}));
	};

	const processFiles = async (files) => {
		try {
			const results = [];
			files.forEach(file => {
				setOcrStates(prev => ({
					...prev,
					[file.id]: {
						status: 'processing',
						progress: 0,
					},
				}));
			});

			for (const file of files) {
				try {
					const response = await fetch(file.url);
					const blob = await response.blob();
					const fileObj = new File([blob], file.name, { type: 'application/pdf' });

					setOcrStates(prev => ({
						...prev,
						[file.id]: {
							status: 'processing',
							progress: 50,
						},
					}));

					const result = await uploadPdfFile(fileObj);
					results.push({
						id: file.id,
						type: file.type,
						name: file.name,
						text: result.text,
						url: file.url,
					});

					setOcrStates(prev => ({
						...prev,
						[file.id]: {
							status: 'processing',
							progress: 75,
						},
					}));
				} catch (error) {
					setProcessingFiles(prev => prev.filter(f => f.id !== file.id));
					setOcrStates(prev => ({
						...prev,
						[file.id]: {
							status: 'error',
							error: `Lỗi khi xử lý OCR file "${file.name}"`,
						},
					}));
					message.error(`Lỗi khi xử lý OCR file "${file.name}"`);
					console.error(`Error processing file ${file.name}:`, error);
					return;
				}
			}

			const invalidFiles = results.filter(file => !file.text || file.text.trim() === '');
			invalidFiles.forEach(file => {
				setProcessingFiles(prev => prev.filter(f => f.id !== file.id));
				setOcrStates(prev => ({
					...prev,
					[file.id]: {
						status: 'error',
						error: `File "${file.name}" không có dữ liệu`,
					},
				}));
				message.error(`File "${file.name}" không có dữ liệu`);
			});

			const validFiles = results.filter(file => file.text && file.text.trim() !== '');

			if (validFiles.length > 0) {
				const data = await sendRequestEmbedDataFile(validFiles);
				if (data.success) {
					for (const file of data.data.data) {
						await updateFileChild({ ...file, embed: true });
						setLoadData(prev => !prev);
						setOcrStates(prev => ({
							...prev,
							[file.id]: {
								status: 'completed',
								progress: 100,
							},
						}));
					}
				}

				message.success(`Đã OCR và embedding thành công file ${validFiles[0].name}`);
			} else {
				message.warning('Không có file hợp lệ để gửi lên embedding');
			}

			setProcessingFiles(prev => prev.filter(f => !files.some(pf => pf.id === f.id)));
			if (processingFiles.length === files.length) {
				setIsLoading(prev => ({
					...prev,
					[idFile]: false,
				}));
			}
		} catch (error) {
			console.error('Error in processFiles:', error);
			message.error('Có lỗi xảy ra khi xử lý file');
			setProcessingFiles(prev => prev.filter(f => !files.some(pf => pf.id === f.id)));
			if (processingFiles.length === files.length) {
				setIsLoading(prev => ({
					...prev,
					[idFile]: false,
				}));
			}
		}
	};

	const handleOCR = async () => {
		if (!isLoading[idFile]) {
			setProcessingFiles(prev => [...prev, data]);
			processFiles([data]);
		}
	};

	const handleDeleteHistory = async (id) => {
		try {
			const response = await deleteChatHistoryFile(id);
			if (response.success) {
				message.success('Đã xóa câu hỏi khỏi lịch sử');
				if (selectedHistoryId === id) {
					setSelectedHistoryId(null);
					setFileStates(prev => ({
						...prev,
						[idFile]: {
							...prev[idFile],
							selectedHistoryId: null,
						},
					}));
				}
				fetchChatHistory();
			} else {
				message.error('Không thể xóa câu hỏi');
			}
		} catch (error) {
			console.error('Error deleting history:', error);
			message.error('Không thể xóa câu hỏi');
		}
	};

	useEffect(() => {
		return () => {
			if (idFile) {
				setFileStates(prev => ({
					...prev,
					[idFile]: {
						prompt,
						result: results[idFile],
						selectedHistoryId,
					},
				}));
			}
		};
	}, [idFile, prompt, results, selectedHistoryId]);

	// View khi chưa embed
	if (!data?.embed) {
		// Kiểm tra định dạng file
		if (!data?.type?.includes('pdf')) {
			return (
				<div className={css.docAnalystContainer}>
					<div className={css.notEmbeddedView}>
						<h3>Định dạng file không phù hợp</h3>
						<p>Hiện tại chỉ hỗ trợ phân tích file PDF</p>
						<p>Định dạng file hiện tại: {data?.type || 'Không xác định'}</p>
					</div>
				</div>
			);
		}

		// Check if file is being processed
		const currentOcrState = ocrStates[data.id];
		const isProcessing = currentOcrState?.status === 'processing';

		return (
			<div className={css.docAnalystContainer}>
				<div className={css.notEmbeddedView}>
					<h3>Tài liệu chưa được OCR và Embed</h3>
					<p>Vui lòng OCR và Embed tài liệu để có thể phân tích</p>
					{isProcessing ? (
						<div className={css.ocrProgress}>
							<Progress percent={currentOcrState.progress} status='active' />
							<p>Đang xử lý OCR và Embedding...</p>
						</div>
					) : (
						<Button
							type='primary'
							onClick={handleOCR}
							loading={isProcessing}
						>
							OCR và Embed
						</Button>
					)}
				</div>
			</div>
		);
	}

	// Add component to display ongoing questions
	const OngoingQuestionsList = () => {
		const currentFileQuestions = ongoingQuestions[idFile] || [];
		const activeQuestions = currentFileQuestions.filter(q => q.status !== 'completed');
		if (activeQuestions.length === 0) return null;

		return (
			<div className={css.ongoingQuestionsSection}>
				<div className={css.ongoingQuestionsHeader}>
					<h4>Câu hỏi đang xử lý</h4>
				</div>
				<div className={css.ongoingQuestionsList}>
					{activeQuestions.map(question => (
						<Card
							key={question.id}
							className={css.ongoingQuestionCard}
						>
							<div className={css.ongoingQuestionContent}>
								<div className={css.ongoingQuestionText}>
									<MessageSquare size={14} />
									<span>{question.question}</span>
								</div>
								<div className={css.ongoingQuestionStatus}>
									{question.status === 'processing' && (
										<Spin size='small' />
									)}
									{question.status === 'error' && (
										<span className={css.statusError}>Lỗi</span>
									)}
								</div>
							</div>
						</Card>
					))}
				</div>
			</div>
		);
	};

	// View khi đã embed
	return (
		<div className={css.docAnalystContainer}>
			<div className={css.analysisLayout}>
				{/* Left side - Question input and history */}
				<div className={css.leftSide}>
					<div className={css.questionSection}>
						<div style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: '8px',
							marginBottom: '16px',
						}}>
							<h3>Document AI Assistant</h3>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<BookOpenCheck size={20}
											   onClick={() => setIsTemplateModalOpen(true)}
											   style={{ cursor: 'pointer' }} />

								<Settings size={20}
										  onClick={() => setIsDocAnalystConfigModalOpen(true)}
										  style={{ cursor: 'pointer' }}
								/>
							</div>

						</div>
						<Input.TextArea
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder='Nhập câu hỏi cần phân tích...'
							style={{ height: 100, marginBottom: 16 }}
						/>
						<div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
							<Select
								style={{ width: 200, height: 40 }}
								placeholder='Chọn template'
								onChange={(value) => {
									const selectedTemplate = templates.find(t => t.id === value);
									if (selectedTemplate) {
										setPrompt2(selectedTemplate.prompt);
									}
								}}
							>
								{templates.map(template => (
									<Select.Option key={template.id} value={template.id}>
										{template.name}
									</Select.Option>
								))}
							</Select>
							<Button
								type='primary'
								icon={<Send size={16} />}
								onClick={handleAnalyze}
								// loading={isLoading}
							>
								Phân tích
							</Button>
						</div>
					</div>

					<OngoingQuestionsList />

					<div className={css.historySection}>
						<div className={css.historyHeader}>
							<History size={16} />
							<h4>Lịch sử câu hỏi</h4>
						</div>
						<Spin spinning={isHistoryLoading[idFile]}>
							{chatHistories[idFile]?.length > 0 ? (
								<div className={css.historyList}>
									{chatHistories[idFile].map(item => (
										<Card
											key={item.id}
											className={`${css.historyCard} ${selectedHistoryId === item.id ? css.selectedHistoryCard : ''}`}
											onClick={() => handleSelectHistory(item)}
										>
											<div className={css.historyQuestion}>
												<MessageSquare size={14} />
												<span>{item.question}</span>
											</div>
											<div className={css.historyFooter}>
												<div className={css.historyInfo}>
													<div className={css.historyUser}>
														<User size={12} style={{ marginRight: 4 }} />
														{item.user_email || 'Người dùng'}
													</div>
													<div className={css.historyTime}>
														<Clock size={12} style={{ marginRight: 4 }} />
														{formatDateToDDMMYYYY(item.created_at)}
													</div>
												</div>
												<div className={css.historyActions}>
													<div
														className={css.deleteButton}
														onClick={(e) => {
															e.stopPropagation();
															Modal.confirm({
																title: 'Xác nhận xóa',
																content: 'Bạn có chắc chắn muốn xóa câu hỏi này khỏi lịch sử?',
																okText: 'Xóa',
																okType: 'danger',
																cancelText: 'Hủy',
																onOk: () => handleDeleteHistory(item.id),
															});
														}}
													>
														<Trash2 size={14} />
													</div>
												</div>
											</div>
										</Card>
									))}
								</div>
							) : (
								<div className={css.emptyHistory}>
									<div className={css.emptyHistoryIcon}>
										<History size={24} />
									</div>
									<div className={css.emptyHistoryText}>
										Chưa có lịch sử câu hỏi
									</div>
								</div>
							)}
						</Spin>
					</div>
				</div>

				{/* Right side - Analysis result */}
				<div className={css.rightSide}>
					<Spin spinning={isLoading[idFile] === true}>
						{results[idFile] && (
							<div
								className={css.markedContent}
								dangerouslySetInnerHTML={{
									__html: DOMPurify.sanitize(results[idFile]),
								}}
							/>
						)}
					</Spin>
				</div>
			</div>

			<FileTemplateModal
				isOpen={isTemplateModalOpen}
				onClose={() => setIsTemplateModalOpen(false)}
				currentUser={currentUser}
				onSelectTemplate={(prompt) => {
					setPrompt2(prompt);
					setIsTemplateModalOpen(false);
				}}
				onSuccess={() => {
					fetchTemplates();
					setIsTemplateModalOpen(false);
				}}
			/>

			<DocAnalystConfigModal
				isOpen={isDocAnalystConfigModalOpen}
				onClose={() => setIsDocAnalystConfigModalOpen(false)}
				config={docAnalystConfig}
				onSave={handleDocAnalystConfigSave}
			/>
		</div>
	);
}

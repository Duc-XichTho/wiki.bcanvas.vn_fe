import { useContext, useEffect, useState } from 'react';
import { Button, Card, Empty, Input, List, Spin, Tooltip, Checkbox, message, Dropdown, Popconfirm } from 'antd';
import css from './ExternalAI.module.css';
import { History, MessageSquare, Send, Settings, PlusCircle, Trash2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { MyContext } from '../../../MyContext.jsx';
import {
	sendQuestionSourceIDToAIDataFile,
	sendQuestionToAIDPAS,
	sendRequestEmbedDataFile,
} from '../../../apis/serviceApi/serviceApi.jsx';
import { createTimestamp, formatDateToDDMMYYYY } from '../../../generalFunction/format.js';
import { deleteExternalChatHistory,getUserExternalChatHistory } from '../../../apis/externalChatHistoryService.jsx';

import TemplateModalExternal from './TemplateModalExternal.jsx';
import { getAllFileChild, updateFileChild } from '../../../apis/fileChildService.jsx';
import { getSettingByType, updateSetting, createSetting } from '../../../apis/settingService.jsx';
import { uploadPdfFile } from '../../../apis/botService.jsx';
import { toast } from 'react-toastify';
import { getAllFileNotePad } from '../../../apis/fileNotePadService.jsx';
import { DownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import OCRModal from './OCRModal.jsx';
import Loading3DTower from '../../../components/Loading3DTower';

let resultDefault = 'Kết quả AI trả lời';

// Add queue system
const analyzeQueue = [];
let isProcessingQueue = false;

export default function ExternalAI({ onQueueLengthChange, isActivated = false }) {
	const { currentUser, loadData, listUC_CANVAS, uCSelected_CANVAS } = useContext(MyContext);
	const [prompt, setPrompt] = useState('');
	const [result, setResult] = useState(resultDefault);
	const [isLoading, setIsLoading] = useState(false);
	const [isHistoryLoading, setIsHistoryLoading] = useState(false);
	const [usePivotConfig, setUsePivotConfig] = useState(false);
	const [useCreateChart, setUseCreateChart] = useState(false);
	const [templateModalOpen, setTemplateModalOpen] = useState(false);
	const [selectedHistoryId, setSelectedHistoryId] = useState(null);
	const [chatHistory, setChatHistory] = useState([]);
	const [fileList, setFileList] = useState([]);
	const [fileSelected, setFileSelected] = useState([]);
	const [fileNoteList, setFileNoteList] = useState([]);
	const [expandedFileId, setExpandedFileId] = useState(null);
	const [ocrModalOpen, setOcrModalOpen] = useState(false);
	const [processingFiles, setProcessingFiles] = useState([]);
	const [queueLength, setQueueLength] = useState(0);
	const [selectedQueueItem, setSelectedQueueItem] = useState(null);

	const handlePromptChange = (e) => {
		setPrompt(e.target.value);
		setSelectedHistoryId(null);
	};


	async function fetchFileList() {
		try {
			let response = await getAllFileChild();
			console.log(response);
			const data = await getAllFileNotePad();
			if (data && Array.isArray(data)) {
				setFileNoteList(data);
			}
			// First filter PDF files that are shown
			response = response.filter(item => item.name.includes('.pdf') && item.show == true);

			// Get the selected user class name from listUC_CANVAS
			if (!currentUser?.isAdmin) {
				const selectedUC = listUC_CANVAS.find(uc => uc.id === uCSelected_CANVAS);
				const selectedUCName = selectedUC ? selectedUC.name : null;
				// Filter files based on permissions
				if (selectedUCName) {
					response = response.filter(file => {
						// Find the corresponding fileNoteList item
						const fileNote = data.find(note => note.id == file.table_id);
						if (!fileNote) return false;

						// Check if the fileNote's userClass array contains the selected user class name
						return fileNote.userClass && fileNote.userClass.some(uc => uc == selectedUCName);
					});
				}
			}
			if (Array.isArray(response)) {
				setFileList(response);
			}

		} catch (error) {
			console.error('Error fetching file list:', error);
		}
	}

	const fetchChatHistory = async (data) => {
		try {
			setIsHistoryLoading(true);
			const response = await getUserExternalChatHistory(data);
			if (response.success && Array.isArray(response.data)) {
				setChatHistory(response.data.sort((a, b) => b.id - a.id));
			}
		} catch (error) {
			console.error('Error fetching chat history:', error);
		} finally {
			setIsHistoryLoading(false);
		}
	};

	const handleDeleteHistory = (id) => {
		deleteExternalChatHistory(id).then(res => {
			console.log(res);
			if (res.status == 200) {
				fetchChatHistory(currentUser);
			}
		});
	};

	async function getSetting() {
		const data = await getSettingByType('EXTERNAL_AI_FILE_SELECTED');
		if (data && data.setting) {
			setFileSelected(data.setting);
		}
	}

	const handleFileSelect = async (id) => {
		let data = await getSettingByType('EXTERNAL_AI_FILE_SELECTED');
		if (data && data.setting) {
			const newSelection = fileSelected.includes(id)
				? fileSelected.filter(fileId => fileId !== id)
				: [...fileSelected, id];

			setFileSelected(newSelection);
			await updateSetting({
				...data,
				setting: newSelection,
			});
		} else {
			await createSetting({
				type: 'EXTERNAL_AI_FILE_SELECTED',
				setting: [id],
			});
			setFileSelected([id]);
		}
	};

	useEffect(() => {
		if (currentUser?.email && isActivated) {
			fetchChatHistory(currentUser);
			fetchFileList();
			getSetting();
		}
	}, [currentUser, loadData, isActivated]);

	useEffect(() => {
		if (currentUser?.email && isActivated) {
			fetchFileList();
		}
	}, [currentUser, listUC_CANVAS, uCSelected_CANVAS, isActivated]);

	const processQueue = async () => {
		if (isProcessingQueue || analyzeQueue.length === 0) return;

		isProcessingQueue = true;
		const request = analyzeQueue[0];

		try {
			setIsLoading(true);
			const selectedFiles = fileList.filter(file => fileSelected.includes(file.id));

			let data;
			if (selectedFiles.length > 0) {
				// Nếu có file được chọn, gọi API với sources
				data = await sendQuestionSourceIDToAIDataFile({
					question: request.prompt,
					email: currentUser?.email,
					timeAsk: createTimestamp(),
					sourceIds: selectedFiles.map(file => file.id),
				});
			} else {
				// Nếu không có file được chọn, gọi API thông thường
				data = await sendQuestionToAIDPAS({
					question: request.prompt,
					email: currentUser?.email,
					timeAsk: createTimestamp(),
				});
			}

			if (data?.success && data?.data?.success) {
				setResult(data.data.data.answer);
				// Refresh chat history after new question
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

			// Kiểm tra và xử lý request tiếp theo nếu có
			if (analyzeQueue.length > 0) {
				setTimeout(() => {
					processQueue();
				}, 100); // Thêm delay nhỏ để tránh stack overflow
			}
		}
	};

	async function analyze() {
		if (!prompt.trim()) return;

		try {
			// Thêm request vào queue
			analyzeQueue.push({
				prompt,
				selectedFiles: fileList.filter(file => fileSelected.includes(file.id)),
			});
			setQueueLength(analyzeQueue.length);

			// Nếu đây là request đầu tiên, bắt đầu xử lý queue
			if (!isProcessingQueue) {
				processQueue();
			}
		} catch (error) {
			console.error('Error analyzing:', error);
			setResult('Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.');
		}
	}

	const handleAnalyze = () => {
		setSelectedHistoryId(null);
		analyze();
	};

	const handleTemplateClick = () => {
		setTemplateModalOpen(true);
	};

	const handleTemplateSelect = (question) => {
		setPrompt(question);
	};

	const handleSelectHistory = (item) => {
		setSelectedHistoryId(item.id);
		setPrompt(item.question);
		setResult(item.answer);
	};



	const calculateProcessTime = (questionTime, answerTime) => {
		const start = new Date(questionTime);
		const end = new Date(answerTime);
		const diffInSeconds = (end - start) / 1000;
		return `${diffInSeconds.toFixed(2)}s`;
	};

	useEffect(() => {
		if (onQueueLengthChange) {
			onQueueLengthChange(queueLength);
		}
	}, [queueLength, onQueueLengthChange]);

	return (
		<div className={css.aiLayout}>
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
								type="text"
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
							placeholder='Nhập câu hỏi cho AI...'
							onPressEnter={e => {
								if (!e.shiftKey) {
									e.preventDefault();
									handleAnalyze();
								}
							}}
						/>
					</div>
					<div style={{ display: 'flex', justifyContent: 'end', width: '97%', height: '30px' }}>
						<Button
							type='primary'
							className={css.sendButton}
							onClick={handleAnalyze}
							// loading={isLoading}
							icon={<Send size={16} />}
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
									}}>{item.question}</div>

									<div style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center'
									}}>
										<div className={css.aiDate}>
											{formatDateToDDMMYYYY(item.created_at)}
										</div>
										<Tooltip title='Thời gian xử lý'>
											<span className={css.processTime}>
												{calculateProcessTime(item.question_time, item.answer_time)}
											</span>
										</Tooltip>
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
						{isLoading && !selectedHistoryId ? (
							<div style={{ textAlign: 'center', padding: '20px' }}>
								<Loading3DTower /> 
								<div style={{ marginTop: '10px' }}>Đang xử lý yêu cầu...</div>
							</div>
						) : (
					
					
							<div
								className={css.markedContent}
								dangerouslySetInnerHTML={{
									__html: DOMPurify.sanitize(result),
								}}
							/>
						)}
					</div>
					<div className={css.listFile}>
						<div className={css.listFileTitle}>
							<span>Danh sách file</span>

							<Button
								type='text'
								icon={<Settings size={16} />}
								onClick={() => setOcrModalOpen(true)}
								className={css.settingsButton}
							/>
						</div>
						<div className={css.listFileContent}>
							{processingFiles.length > 0 && (
								<div className={css.processedCount}>
									Đang OCR: {processingFiles.length} file
								</div>
							)}

							{fileList.filter(item => item.embed).map((item) => (
								<div key={item.id}>
									<div className={css.listFileItem}>
										<div className={css.listFileItemTitle}>
											<div className={css.listFileItemName}>
												<Checkbox
													checked={fileSelected.includes(item.id)}
													onChange={() => handleFileSelect(item.id)}
													disabled={processingFiles.includes(item.id)}
												/>
												<span>{item.name}</span>
											</div>
											<div className={css.listFileItemActions}>
												<span className={'chuGiai2'}>Embed</span>
											</div>
											<div className={css.listFileItemActions}>
												{item.table_id && (
													<div className={css.fileNoteDropdown}>
														<Tooltip
															title={
																<div className={css.fileNotePath}>
																	<span>Thư mục:</span>
																	<span className={css.fileNoteName}>
																		{fileNoteList.find(note => note.id == item.table_id)?.name}
																	</span>
																</div>
															}
														>
															<Button
																type='text'
																icon={<InfoCircleOutlined />}
															/>
														</Tooltip>
													</div>
												)}
											</div>
										</div>
									</div>
									{expandedFileId === item.id && item.table_id && (
										<div className={css.fileNoteInfo}>
											<div className={css.fileNotePath}>
												<span>Thư mục:</span>
												<span className={css.fileNoteName}>
													{fileNoteList.find(note => note.id == item.table_id)?.name}
												</span>
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>

			</div>

			{templateModalOpen && (
				<TemplateModalExternal
					isOpen={templateModalOpen}
					onClose={() => setTemplateModalOpen(false)}
					onSelectTemplate={handleTemplateSelect}
					currentUser={currentUser}
				/>
			)}

			<OCRModal
				fileListData={fileList}
				isOpen={ocrModalOpen}
				onClose={() => setOcrModalOpen(false)}
				onSuccess={() => {
					fetchFileList();
					fetchChatHistory(currentUser);
				}}
				onProcessingChange={(files) => setProcessingFiles(files)}
			/>
		</div>
	);
}

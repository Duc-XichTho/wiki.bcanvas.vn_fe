import { useContext, useEffect, useMemo, useState, useRef } from 'react';
import {
	Button,
	Card,
	Checkbox,
	Dropdown,
	Input,
	List,
	Popconfirm,
	Spin,
	Switch,
	Tooltip,
	Select,
	Modal,
	message,
} from 'antd';
import { PlusCircle, Send, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { getAllAiGenConfigList } from '../../apis/aiGenConfigListService.jsx';
import { aiGen, aiGen2, improveText } from '../../apis/botService.jsx';
import { MyContext } from '../../MyContext.jsx';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import SaveAnalysisModal from './SaveAnalysisModal';
import TemplateModalGen from './TemplateModalGen.jsx';
import AIGenForm from './AIGenForm.jsx';
import css from './AIForm.module.css';
import { createAiGenHistory, getAllAiGenHistory, deleteAiGenHistory, updateAiGenHistory } from '../../apis/aiGenHistoryService.jsx';
import { uploadFiles } from '../../apisKTQT/uploadImageWikiNoteService.jsx';
import { MODEL_AI_LIST } from '../../CONST.js';
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

let resultDefault = 'Kết quả AI trả lời';

// Add queue system
const analyzeQueue = [];
let isProcessingQueue = false;

// Options cho tone và writing style
const toneOptions = [
	{ value: 'neutral', label: 'Trung tính' },
	{ value: 'friendly', label: 'Thân thiện' },
	{ value: 'professional', label: 'Chuyên nghiệp' },
	{ value: 'casual', label: 'Thân mật' },
	{ value: 'formal', label: 'Trang trọng' },
	{ value: 'enthusiastic', label: 'Nhiệt huyết' },
	{ value: 'serious', label: 'Nghiêm túc' },
];

const writingStyleOptions = [
	{ value: 'formal', label: 'Trang trọng' },
	{ value: 'casual', label: 'Thân mật' },
	{ value: 'academic', label: 'Học thuật' },
	{ value: 'business', label: 'Kinh doanh' },
	{ value: 'creative', label: 'Sáng tạo' },
	{ value: 'technical', label: 'Kỹ thuật' },
	{ value: 'conversational', label: 'Hội thoại' },
];

// Tiện ích chuyển base64 sang Uint8Array
function base64ToUint8Array(base64) {
	const binaryString = atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}
// Tiện ích làm sạch base64
function cleanBase64(str) {
	return str.replace(/^"+|"+$/g, '');
}
// Tiện ích lấy extension từ mime
function getExtensionFromMimeType(mimeType) {
	const map = {
		'audio/mpeg': 'mp3',
		'audio/mp3': 'mp3',
		'audio/wav': 'wav',
		'audio/x-wav': 'wav',
		'audio/wave': 'wav',
		'audio/x-pn-wav': 'wav',
	};
	return map[mimeType] || '';
}
function ensureFileNameWithExtension(fileName, mimeType) {
	if (/\.[a-z0-9]+$/i.test(fileName)) return fileName;
	const ext = getExtensionFromMimeType(mimeType);
	return ext ? `${fileName}.${ext}` : fileName;
}

export default function AIGen({ onQueueLengthChange, isActivated = false }) {
	const { currentUser } = useContext(MyContext);
	const [prompt, setPrompt] = useState('');
	const [result, setResult] = useState(resultDefault);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedId, setSelectedId] = useState(null);
	const [formModalOpen, setFormModalOpen] = useState(false);
	const [checkedItems, setCheckedItems] = useState([]);
	const [aiGenHistory, setAiGenHistory] = useState([]);
	const [loadingAiGenHistory, setLoadingAiGenHistory] = useState(false);
	const [selectedAiGenHistoryId, setSelectedAiGenHistoryId] = useState(null);
	const [modelToken1, setModelToken1] = useState('');
	const [modelToken2, setModelToken2] = useState('');
	const [modelToken3, setModelToken3] = useState('');
	const [totalToken, setTotalToken] = useState(0);
	const [templateModalOpen, setTemplateModalOpen] = useState(false);
	const [queueLength, setQueueLength] = useState(0);
	const [selectedQueueItem, setSelectedQueueItem] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState(result);
	const [saveModalOpen, setSaveModalOpen] = useState(false);
	const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true);

	// State cho flow selection
	const [aiConfigList, setAiConfigList] = useState([]);
	const [selectedFlowId, setSelectedFlowId] = useState(null);
	const [loadingFlowList, setLoadingFlowList] = useState(false);

	// State cho các cấu hình bổ sung
	const [expectedLength, setExpectedLength] = useState(500);
	const [tone, setTone] = useState('neutral');
	const [writingStyle, setWritingStyle] = useState('');
	const [imageCount, setImageCount] = useState(1);

	// State cho image result từ AI4
	const [imageResult, setImageResult] = useState(null);
	const [imageUrls, setImageUrls] = useState([]);

	// State cho audio result từ AI5
	const [audioResult, setAudioResult] = useState(null);
	const [audioUrl, setAudioUrl] = useState('');

	// Improve feature state
	const [showImproveBtn, setShowImproveBtn] = useState(false);
	const [improveBtnPos, setImproveBtnPos] = useState({ top: 0, left: 0 });
	const [selectedText, setSelectedText] = useState('');
	const [selectedTextRange, setSelectedTextRange] = useState(null);
	const [improveModalOpen, setImproveModalOpen] = useState(false);
	const [improveInput, setImproveInput] = useState('');
	const [improveLoading, setImproveLoading] = useState(false);
	const [improvePreview, setImprovePreview] = useState(null);

	// Add state for improve all functionality
	const [improveAllModalOpen, setImproveAllModalOpen] = useState(false);
	const [improveAllInput, setImproveAllInput] = useState('');
	const [improveAllLoading, setImproveAllLoading] = useState(false);

	// Add state for batch processing functionality
	const [batchModalOpen, setBatchModalOpen] = useState(false);
	const [batchConfig, setBatchConfig] = useState({
		selectedFlowId: null,
		expectedLength: 500,
		writingStyle: '',
		imageCount: 1
	});
	const [batchQuestions, setBatchQuestions] = useState([]);
	const [batchLoading, setBatchLoading] = useState(false);

	const markedContentRef = useRef(null);

	useEffect(() => {
		if (isActivated) {
			loadAiGenHistory();
			loadAiConfigList();
		}
	}, [currentUser, isActivated]);

	useEffect(() => {
		if (onQueueLengthChange) {
			onQueueLengthChange(queueLength);
		}
	}, [queueLength, onQueueLengthChange]);

	useEffect(() => {
		setEditedContent(result);
	}, [result]);

	const loadAiGenHistory = async () => {
		try {
			setLoadingAiGenHistory(true);
			const history = await getAllAiGenHistory();
			const filteredHistory = history.filter(item => item.userCreated === currentUser?.email);
			setAiGenHistory(filteredHistory);
		} catch (error) {
			console.error('Error loading AI Gen history:', error);
		} finally {
			setLoadingAiGenHistory(false);
		}
	};

	const loadAiConfigList = async () => {
		try {
			setLoadingFlowList(true);
			const data = await getAllAiGenConfigList();
			setAiConfigList(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error('Error loading AI config list:', error);
			setAiConfigList([]);
		} finally {
			setLoadingFlowList(false);
		}
	};

	// When user selects a history item, fill prompt/result
	const handleSelectAiGenHistory = (item) => {
		if (!item) {
			setPrompt('');
			setResult('');
			setSelectedAiGenHistoryId(null);
			setSelectedQueueItem(null);
			setSelectedFlowId(null);
			setExpectedLength(500);
			setWritingStyle('');
			setImageResult(null);
			setImageUrls([]);
			setAudioResult(null);
			setAudioUrl('');
			return;
		}

		setPrompt(item.prompt);
		setResult(item.anwser);
		setSelectedAiGenHistoryId(item.id);
		setSelectedQueueItem(null);

		// Restore image if available
		if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
			setImageUrls(item.imageUrls);
			// For backward compatibility, also set imageResult if it's a single image
			if (item.imageUrls.length === 1 && typeof item.imageUrls[0] === 'string') {
				setImageResult({ image_url: item.imageUrls[0] });
			} else {
				setImageResult(null);
			}
		} else {
			setImageUrls([]);
			setImageResult(null);
		}

		// Restore audio if available
		if (item.audioUrl) {
			setAudioUrl(item.audioUrl);
			// We don't have the full audioResult object, so we clear it to prevent showing stale metadata
			setAudioResult(null);
		} else {
			setAudioUrl('');
			setAudioResult(null);
		}

		// Restore settings from history
		setSelectedFlowId(item.AIGenConfigId);
		setExpectedLength(item.settings?.expectedLength || 500);
		setWritingStyle(item.settings?.writingStyle || '');
		setImageCount(item.settings?.imageCount || 1);

		// Clear old token info
		setModelToken1('');
		setModelToken2('');
		setModelToken3('');
		setTotalToken(0);
	};

	// Add new function to process queue
	const processQueue = async () => {
		if (isProcessingQueue || analyzeQueue.length === 0) return;

		isProcessingQueue = true;
		const { prompt, config } = analyzeQueue[0];

		// Log the queue item being processed
		console.log('=== PROCESSING QUEUE ITEM ===');
		console.log('Queue Item:', {
			prompt,
			configId: config?.id,
			configName: config?.name,
			timestamp: analyzeQueue[0].timestamp
		});
		console.log('============================');

		try {
			setIsLoading(true);
			setSelectedQueueItem(analyzeQueue[0]);
			setSelectedAiGenHistoryId(null);

			let finalResult = '';
			let aiResults = [];
			let imageUrlToSave = null;
			let audioUrlToSave = null;
			let lastTextOutput = prompt;

			// Process each AI in the flow sequentially
			if (config && config.aiConfigs) {
				const activeAIs = config.aiConfigs.filter(ai => ai.isUse);

				for (let i = 0; i < activeAIs.length; i++) {
					const ai = activeAIs[i];

					// BỎ QUA AI5 (Voice AI) KHÔNG CHẠY Ở ĐÂY
					if (ai.name.startsWith('AI5')) {
						continue;
					}

					try {
						// --- START: NEW LOGIC for determining AI input ---
						let currentInput;

						// If it's a media AI, its input is the last text output.
						if (ai.name.startsWith('AI4') || ai.name.startsWith('AI5')) {
							currentInput = lastTextOutput;
						} else {
							// Special logic for AI3 when AI1 has sendDirectToOutput = true
							if (ai.name.startsWith('AI3') && i > 0) {
								const ai1Config = activeAIs.find(a => a.name.startsWith('AI1'));
								const ai2Config = activeAIs.find(a => a.name.startsWith('AI2'));

								// Check if AI1 has sendDirectToOutput = true
								if (ai1Config && ai1Config.sendDirectToOutput) {
									console.log('🔄 AI1 has sendDirectToOutput = true, combining outputs for AI3');
									const ai1Result = aiResults.find(r => r.aiName.startsWith('AI1'));
									const ai2Result = aiResults.find(r => r.aiName.startsWith('AI2'));

									// Combine AI1 and AI2 outputs if both exist
									if (ai1Result && ai2Result) {
										currentInput = `Kết quả từ AI1:\n${ai1Result.result}\n\nKết quả từ AI2:\n${ai2Result.result}`;
										console.log('📝 Combining AI1 and AI2 outputs for AI3');
									} else if (ai1Result) {
										// Only AI1 result available
										currentInput = ai1Result.result;
										console.log('📝 Using only AI1 output for AI3');
									} else if (ai2Result) {
										// Only AI2 result available
										currentInput = ai2Result.result;
										console.log('📝 Using only AI2 output for AI3');
									} else {
										// Fallback to previous logic
										currentInput = (i > 0) ? aiResults[i - 1].result : prompt;
										console.log('📝 Fallback: using previous AI result for AI3');
									}
								} else {
									// Normal flow: use previous AI result
									currentInput = (i > 0) ? aiResults[i - 1].result : prompt;
									console.log('📝 Normal flow: using previous AI result for AI3');
								}
							} else if (ai.name.startsWith('AI2') && i > 0) {
								// Special logic for AI2 when AI1 has sendDirectToOutput = true
								const ai1Config = activeAIs.find(a => a.name.startsWith('AI1'));

								if (ai1Config && ai1Config.sendDirectToOutput) {
									// AI2 receives original prompt instead of AI1's output
									currentInput = prompt;
									console.log('🔄 AI1 has sendDirectToOutput = true, AI2 receives original prompt');
								} else {
									// Normal flow: use previous AI result
									currentInput = (i > 0) ? aiResults[i - 1].result : prompt;
								}
							} else {
								// Normal flow for other AIs
								currentInput = (i > 0) ? aiResults[i - 1].result : prompt;
							}
						}

						let aiPrompt = currentInput;

						// For subsequent AIs, check if we should combine with user prompt
						if (ai.useUserPrompt && i > 0) {
							const connector = getConnectorPhrase(ai.name, ai.systemMessage);
							// Avoid duplicating the prompt if the input is already the original prompt
							if (currentInput !== prompt) {
								aiPrompt = `${currentInput}\n\n${connector}\n\n${prompt}`;
							}
						}
						// --- END: NEW LOGIC ---

						// For the final text AI (AI1, AI2, AI3), add length and writing style requirements
						if (i === activeAIs.length - 1 && /^AI[123]/.test(ai.name)) {
							const additionalRequirements = `\n\nYêu cầu về độ dài: ${config.additionalSettings?.expectedLength || 500} từ.\nYêu cầu về phong cách viết: ${config.additionalSettings?.writingStyle || 'Trang trọng'}.`;
							aiPrompt += additionalRequirements;
						}

						console.log(`Processing AI ${i + 1}: ${ai.name}`, {
							prompt: aiPrompt,
							systemMessage: ai.systemMessage,
							model: ai.model,
							useUserPrompt: ai.useUserPrompt
						});

						let type = 'text';
						if (ai.name.startsWith('AI4')) type = 'img';
						if (ai.name.startsWith('AI5')) type = 'mp3';

						// Skip initial aiGen call for AI4 since we'll call it in the loop
						let aiResult = null;
						if (!ai.name.startsWith('AI4')) {
							const response = await aiGen(
								aiPrompt,
								ai.systemMessage,
								ai.model,
								type
							);
							aiResult = response.result || response.answer || response.content || response;
						}

						// Handle different result types
						if (ai.name.startsWith('AI4')) {
							// Handle multiple image generation for AI4
							const imageUrls = [];
							const imageResults = [];

							// Generate multiple images based on imageCount
							for (let j = 0; j < imageCount; j++) {
								try {
									console.log(`Generating image ${j + 1}/${imageCount} for AI4`);

									const imageResponse = await aiGen2(
										aiPrompt,
										ai.systemMessage,
										ai.model,
										'img'
									);
									console.log(imageResponse);
									const imageResult = imageResponse.result || imageResponse.answer || imageResponse.content || imageResponse;

									if (imageResult.image_url) {
										imageUrls.push(imageResult.image_url);
										imageResults.push(imageResult);
									}
								} catch (error) {
									console.error(`Error generating image ${j + 1}:`, error);
								}
							}

							// Store all image URLs
							setImageUrls(imageUrls);
							setImageResult(imageResults.length > 0 ? imageResults[0] : null); // Keep first result for metadata
							imageUrlToSave = imageUrls; // Save array of URLs

							aiResults.push({
								aiName: ai.name,
								model: ai.model,
								result: imageUrls,
								prompt: aiPrompt,
								type: 'images'
							});
						} else if (ai.name.startsWith('AI5') && aiResult && aiResult.audio_data) {
							// Xử lý upload audio base64 lên cloud
							const contentType = aiResult.audio_format === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';
							const base64 = cleanBase64(aiResult.audio_data);
							const bytes = base64ToUint8Array(base64);
							const blob = new Blob([bytes], { type: contentType });
							const finalFileName = ensureFileNameWithExtension(Date.now().toString(), contentType);
							const fileObj = new File([blob], finalFileName, { type: contentType });
							let url = '';
							try {
								const res = await uploadFiles([fileObj]);
								// Giả sử res.files[0].fileUrl là url file
								url = res.files?.[0]?.fileUrl || res.files?.[0]?.url || '';
								setAudioUrl(url);
								audioUrlToSave = url;
							} catch (e) {
								console.error('Upload audio failed', e);
							}
							setAudioResult(aiResult);
							aiResults.push({
								aiName: ai.name,
								model: ai.model,
								result: url,
								prompt: aiPrompt,
								type: 'audio'
							});
						} else {
							aiResults.push({
								aiName: ai.name,
								model: ai.model,
								result: aiResult,
								prompt: aiPrompt
							});
						}

						// Only update finalResult and lastTextOutput for text AIs
						if (ai.name.startsWith('AI1') || ai.name.startsWith('AI2') || ai.name.startsWith('AI3')) {
							finalResult = aiResult;
							lastTextOutput = aiResult;
						}

						console.log(`AI ${i + 1} completed:`, { aiResult });

					} catch (error) {
						console.error(`Error processing AI ${i + 1} (${ai.name}):`, error);
						const errorMessage = `Lỗi khi xử lý AI ${i + 1} (${ai.name}): ${error.message || 'Unknown error'}`;
						aiResults.push({
							aiName: ai.name,
							model: ai.model,
							result: errorMessage,
							error: true
						});
						finalResult = errorMessage;
						break; // Stop processing if one AI fails
					}
				}
			} else {
				// Fallback: no config or no active AIs
				finalResult = 'Không có cấu hình AI nào được chọn hoặc không có AI nào được kích hoạt.';
			}

			setResult(finalResult);

			// Post to aiGenHistory table
			const historyData = {
				AIGenConfigId: config?.id,
				prompt,
				userCreated: currentUser?.email,
				create_at: new Date().toISOString(),
				settings: {
					expectedLength,
					writingStyle,
					imageCount
				},
				anwser: finalResult || 'Chưa có kết quả',
				audioUrl: audioUrlToSave,
				imageUrls: imageUrlToSave,
			};

			// Debug log để kiểm tra dữ liệu audioUrl khi lưu
			console.log('Saving to database:', {
				audioUrlToSave,
				audioUrlType: typeof audioUrlToSave,
				hasAudioUrl: !!audioUrlToSave,
				historyData
			});

			const newHistory = await createAiGenHistory(historyData);

			// Update selectedAiGenHistoryId to the newly created record
			if (newHistory && newHistory.id) {
				setSelectedAiGenHistoryId(newHistory.id);
			}

			await loadAiGenHistory();

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
				errorMessage = 'Xảy ra lỗi trong quá trình phân tích: ' + errorData;
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

	// Helper function to get appropriate connector phrases
	const getConnectorPhrase = (aiName, systemMessage) => {
		// Default connector
		let connector = "Dựa trên kết quả phân tích trên, ";

		// Customize connector based on AI type or system message
		if (aiName === 'AI1') {
			connector = "Dựa trên phân tích ban đầu, ";
		} else if (aiName === 'AI2') {
			connector = "Từ kết quả phân tích chi tiết, ";
		} else if (aiName === 'AI3') {
			connector = "Dựa trên toàn bộ quá trình phân tích, ";
		} else if (aiName === 'AI4') {
			connector = "Dựa trên nội dung đã phân tích, ";
		} else if (aiName === 'AI5') {
			connector = "Từ kết quả phân tích cuối cùng, ";
		}

		// If system message contains specific instructions, adjust connector
		if (systemMessage && systemMessage.toLowerCase().includes('tổng hợp')) {
			connector = "Tổng hợp từ các phân tích trên, ";
		} else if (systemMessage && systemMessage.toLowerCase().includes('cải thiện')) {
			connector = "Cải thiện dựa trên kết quả trên, ";
		} else if (systemMessage && systemMessage.toLowerCase().includes('hoàn thiện')) {
			connector = "Hoàn thiện dựa trên phân tích trên, ";
		}

		return connector;
	};

	// Helper function to replace text at specific position
	const replaceTextAtPosition = (originalText, rangeInfo, newText) => {
		if (!rangeInfo) return originalText;

		try {
			// Chuẩn hóa text để so sánh
			const normalizeText = (text) => {
				return text
					.replace(/\r\n/g, '\n')
					.replace(/\r/g, '\n')
					.replace(/\s+/g, ' ')
					.trim();
			};

			const normalizedOriginal = normalizeText(originalText);
			const normalizedSelected = normalizeText(rangeInfo.text);

			// Tìm vị trí của selected text trong original text
			const startIndex = normalizedOriginal.indexOf(normalizedSelected);

			if (startIndex === -1) {
				// Fallback: tìm kiếm theo từng dòng
				const lines = originalText.split('\n');
				const selectedLines = rangeInfo.text.split('\n');

				for (let i = 0; i < lines.length; i++) {
					if (lines[i].includes(selectedLines[0])) {
						// Tìm thấy dòng đầu tiên, thay thế từng dòng
						let newLines = [...lines];
						for (let j = 0; j < selectedLines.length && i + j < lines.length; j++) {
							if (j < newText.split('\n').length) {
								newLines[i + j] = newText.split('\n')[j];
							}
						}
						return newLines.join('\n');
					}
				}

				// Nếu vẫn không tìm thấy, thử thay thế trực tiếp
				return originalText.replace(rangeInfo.text, newText);
			}

			// Thay thế tại vị trí tìm được
			const beforeSelected = originalText.substring(0, startIndex);
			const afterSelected = originalText.substring(startIndex + rangeInfo.text.length);
			return beforeSelected + newText + afterSelected;

		} catch (error) {
			console.error('Error replacing text at position:', error);
			// Fallback: thay thế bằng string replace
			return originalText.replace(rangeInfo.text, newText);
		}
	};

	// Helper function to generate preview with context
	const generatePreview = (originalText, rangeInfo, newText) => {
		if (!rangeInfo) return null;

		const lines = originalText.split('\n');
		const selectedLines = rangeInfo.text.split('\n');

		// Tìm vị trí của selected text trong original text
		let startLineIndex = -1;
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].includes(selectedLines[0])) {
				startLineIndex = i;
				break;
			}
		}

		if (startLineIndex === -1) return null;

		// Tạo context (2 dòng trước và sau)
		const contextStart = Math.max(0, startLineIndex - 2);
		const contextEnd = Math.min(lines.length, startLineIndex + selectedLines.length + 2);
		const context = lines.slice(contextStart, contextEnd);

		// Tạo preview với highlight
		const previewLines = [];
		for (let i = contextStart; i < contextEnd; i++) {
			if (i >= startLineIndex && i < startLineIndex + selectedLines.length) {
				// Dòng được chọn - hiển thị nội dung mới
				const lineIndex = i - startLineIndex;
				if (lineIndex < newText.split('\n').length) {
					previewLines.push(`→ ${newText.split('\n')[lineIndex]}`);
				}
			} else {
				// Dòng context
				previewLines.push(`  ${lines[i]}`);
			}
		}

		return {
			context: context.join('\n'),
			preview: previewLines.join('\n'),
			startLine: startLineIndex + 1,
			endLine: startLineIndex + selectedLines.length
		};
	};

	// Helper function to log current state and selections
	const logCurrentState = (config = null) => {
		const selectedFlow = getSelectedFlowConfig();
		const flowConfig = config || selectedFlow;
		if (flowConfig) {
			const activeAIs = flowConfig.aiConfigs?.filter(ai => ai.isUse) || [];
			console.log('Active AIs:', activeAIs.map(ai => ai.name));
		} else {
			console.log('No flow configuration selected');
		}
	};

	const handleTemplateSelect = async (question, decs) => {
		setPrompt(question);
	};

	const handleFlowSelect = (flowId) => {
		setSelectedFlowId(flowId);
		// Log state when flow selection changes
		setTimeout(() => logCurrentState(), 100);
	};

	const getSelectedFlowConfig = () => {
		if (!selectedFlowId) return null;
		return aiConfigList.find(config => config.id == selectedFlowId);
	};

	// Helper function to check if AI4 is enabled in selected flow
	const isAI4Enabled = () => {
		const flowConfig = getSelectedFlowConfig();
		return flowConfig?.aiConfigs?.some(ai => ai.name.startsWith('AI4') && ai.isUse) || false;
	};

	// Modify analyze function to use queue
	async function analyze(config = null) {
		if (!prompt.trim()) {
			return;
		}

		// Reset image/audio result for new analysis
		setImageResult(null);
		setImageUrls([]);
		setAudioResult(null);
		setAudioUrl('');

		// Log current state before processing
		logCurrentState(config);

		// Sử dụng config từ selected flow nếu không có config được truyền vào
		const flowConfig = config || getSelectedFlowConfig();

		// Thêm các cấu hình bổ sung vào config
		const enhancedConfig = flowConfig ? {
			...flowConfig,
			additionalSettings: {
				expectedLength,
				tone,
				writingStyle,
			},
		} : {
			additionalSettings: {
				expectedLength,
				tone,
				writingStyle,
			},
		};

		const queueItem = {
			prompt,
			config: enhancedConfig,
			timestamp: new Date().toISOString(),
		};
		analyzeQueue.push(queueItem);
		setQueueLength(analyzeQueue.length);
		setSelectedQueueItem(queueItem);
		setSelectedAiGenHistoryId(null);
		processQueue();
	}

	const handleAnalyze = (config) => {
		setSelectedAiGenHistoryId(null);
		setSelectedQueueItem(null);
		analyze(config);
	};

	const handleContextMenu = (e, item) => {
		e.preventDefault();
	};

	const handleDeleteAiGenHistory = async (id) => {
		try {
			await deleteAiGenHistory(id);
			await loadAiGenHistory();
			if (selectedAiGenHistoryId === id) {
				handleSelectAiGenHistory(null);
			}
		} catch (error) {
			console.error('Error deleting AI Gen history:', error);
		}
	};

	const handleTemplateClick = () => {
		setTemplateModalOpen(true);
	};

	// Batch processing functions
	const addQuestion = () => {
		const newQuestion = {
			id: Date.now(),
			question: '',
			status: 'pending' // pending, processing, completed, error
		};
		setBatchQuestions([...batchQuestions, newQuestion]);
	};

	const removeQuestion = (id) => {
		setBatchQuestions(batchQuestions.filter(q => q.id !== id));
	};

	const updateQuestion = (id, field, value) => {
		setBatchQuestions(batchQuestions.map(q =>
			q.id === id ? { ...q, [field]: value } : q
		));
	};

	const runBatchProcessing = async () => {
		if (batchQuestions.length === 0) {
			message.warning('Vui lòng thêm ít nhất một câu hỏi!');
			return;
		}

		const validQuestions = batchQuestions.filter(q => q.question.trim());
		if (validQuestions.length === 0) {
			message.warning('Vui lòng nhập nội dung cho ít nhất một câu hỏi!');
			return;
		}

		setBatchLoading(true);
		try {
			// Get the selected flow configuration
			const flowConfig = aiConfigList.find(config => config.id == batchConfig.selectedFlowId);
			if (!flowConfig) {
				message.error('Vui lòng chọn luồng AI!');
				return;
			}

			// Add each question to the queue
			for (const question of validQuestions) {
				const enhancedConfig = {
					...flowConfig,
					additionalSettings: {
						expectedLength: batchConfig.expectedLength,
						tone: 'neutral',
						writingStyle: batchConfig.writingStyle,
					},
				};

				const queueItem = {
					prompt: question.question,
					config: enhancedConfig,
					timestamp: new Date().toISOString(),
					batchId: Date.now(), // Add batch identifier
				};

				analyzeQueue.push(queueItem);
			}

			setQueueLength(analyzeQueue.length);
			setBatchModalOpen(false);
			setBatchQuestions([]);
			message.success(`Đã thêm ${validQuestions.length} câu hỏi vào hàng đợi!`);

			// Start processing if not already processing
			if (!isProcessingQueue) {
				processQueue();
			}
		} catch (error) {
			console.error('Error adding batch questions to queue:', error);
			message.error('Có lỗi xảy ra khi thêm câu hỏi vào hàng đợi!');
		} finally {
			setBatchLoading(false);
		}
	};

	// Handler for mouseup in text area
	const handleTextMouseUp = (e) => {
		const selection = window.getSelection();
		const text = selection.toString();
		if (text && markedContentRef.current && markedContentRef.current.contains(selection.anchorNode)) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();

			// Lưu thông tin vị trí chính xác
			const rangeInfo = {
				startContainer: range.startContainer,
				startOffset: range.startOffset,
				endContainer: range.endContainer,
				endOffset: range.endOffset,
				text: text
			};

			setImproveBtnPos({
				top: window.scrollY + rect.bottom + 8,
				left: window.scrollX + rect.left + rect.width / 2 - 30,
			});
			setSelectedText(text);
			setSelectedTextRange(rangeInfo);
			setShowImproveBtn(true);
		} else {
			setShowImproveBtn(false);
			setSelectedTextRange(null);
		}
	};

	// Đóng Improve khi click ngoài
	useEffect(() => {
		const handleClick = (e) => {
			if (!markedContentRef.current?.contains(e.target)) {
				setShowImproveBtn(false);
			}
		};
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	}, []);

	return (
		<div className={css.aiLayout}>
			{/* Sidebar */}
			<div className={css.aiSidebar}>
				<div className={css.aiSection}
					 style={{
						 height: isHistoryCollapsed ? '80%' : 'calc(50% - 24px)',
					 }}>
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
								size="small"
								onClick={() => {
									setBatchModalOpen(true);
									// Initialize batch config with current settings
									setBatchConfig({
										selectedFlowId: selectedFlowId,
										expectedLength: expectedLength,
										writingStyle: writingStyle,
										imageCount: imageCount
									});
								}}
								style={{ fontSize: 12, padding: '2px 8px' }}
							>
								Hỏi hàng loạt
							</Button>
							<Button
								type="text"
								icon={<PlusCircle size={16} />}
								onClick={() => {
									setPrompt('');
									setResult(resultDefault);
									setSelectedAiGenHistoryId(null);
									setSelectedQueueItem(null);
									setSelectedFlowId(null);
									setImageResult(null);
									setImageUrls([]);
									setAudioResult(null);
									setAudioUrl('');
								}}
								className={css.newQuestionButton}
							/>
						</div>
					</div>
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						gap: 12,
						width: '97%',
						height: isHistoryCollapsed ? '95%' : '90%',
					}}>
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
							overflowY: 'auto'
						}}>
							{/* Content Area */}
							<div style={{ flex: 1, display: 'flex' }}>
								<textarea
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									style={{
										fontSize: 16,
										color: '#222',
										lineHeight: 1.5,
										wordBreak: 'break-word',
										flex: 1,
										border: 'none',
										backgroundColor: 'transparent',
										resize: 'none',
										outline: 'none',
										fontFamily: 'inherit',
									}}
									placeholder="Nhập câu hỏi của bạn hoặc click vào 'Template' để chọn mẫu câu hỏi..."
								/>
							</div>

							{/* Config Area */}
							<div style={{
								marginTop: 12,
								padding: '12px',
								borderRadius: '4px',
								border: '1px solid #d9d9d9',
							}}>
								<div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
									Cấu hình:
								</div>
								<div style={{
									display: 'flex',
									gap: 12,
									flexWrap: 'wrap',
									justifyContent: isHistoryCollapsed ? 'space-between' : 'flex-start',
								}}>
									{/* Chọn luồng */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#666' }}>Luồng AI:</label>
										<Dropdown
											menu={{
												items: aiConfigList.map(config => ({
													key: config.id,
													label: config.name,
													onClick: () => handleFlowSelect(config.id),
												})),
											}}
											trigger={['click']}
											placement="bottomLeft"
										>
											<Button
												size="small"
												style={{
													backgroundColor: selectedFlowId ? '#e6f7ff' : undefined,
													borderColor: selectedFlowId ? '#1890ff' : undefined,
													minWidth: 120,
												}}
											>
												{loadingFlowList ? 'Đang tải...' :
													selectedFlowId ?
														aiConfigList.find(c => c.id === selectedFlowId)?.name || 'Chọn luồng' :
														'Chọn luồng'
												}
											</Button>
										</Dropdown>
									</div>

									{/* Độ dài dự kiến */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#666' }}>Độ dài (chữ):</label>
										<Input
											size="small"
											type="number"
											value={expectedLength}
											onChange={(e) => setExpectedLength(parseInt(e.target.value) || 500)}
											style={{ width: 80 }}
											min={100}
											max={50000}
										/>
									</div>

									{/* Tone giọng */}
									{/* <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#666' }}>Tone giọng:</label>
										<Select
											size="small"
											value={tone}
											onChange={setTone}
											options={toneOptions}
											style={{ width: 120 }}
										/>
									</div> */}

									{/* Kiểu viết */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
										<label style={{ fontSize: 12, color: '#666' }}>Kiểu viết:</label>
										<Input
											size="small"
											value={writingStyle}
											onChange={e => setWritingStyle(e.target.value)}
											placeholder="Ví dụ: Trang trọng, Thân mật, Học thuật, ..."
											style={{ width: 300 }}
										/>
									</div>

									{/* Số lượng ảnh - chỉ hiển thị khi AI4 được bật */}
									{isAI4Enabled() && (
										<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
											<label style={{ fontSize: 12, color: '#666' }}>Số ảnh:</label>
											<Select
												size="small"
												value={imageCount}
												onChange={setImageCount}
												options={Array.from({ length: 10 }, (_, i) => ({
													value: i + 1,
													label: `${i + 1} ảnh`
												}))}
												style={{ width: 100 }}
											/>
										</div>
									)}
								</div>
							</div>

							{/* Button Area */}
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginTop: 8,
							}}>
								<Button
									type="text"
									size="small"
									onClick={() => {
										setPrompt('');
										setResult(resultDefault);
										setSelectedAiGenHistoryId(null);
										setSelectedQueueItem(null);
										setSelectedFlowId(null);
										setExpectedLength('');
										setWritingStyle('');
										setImageResult(null);
										setAudioResult(null);
										setAudioUrl('');
									}}
								>
									Đặt lại
								</Button>
								<div style={{ display: 'flex', gap: 8 }}>
									<Button
										type="primary"
										size="small"
										onClick={() => handleAnalyze(null)}
										loading={isLoading}
										icon={<Send size={16} />}
										disabled={!prompt.trim()}
									>
										{result && result !== resultDefault ? 'Gửi lại' : 'Gửi'}
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
				{queueLength > 0 && (
					<div className={css.aiSectionHistoryChat}
					>
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
									size="small"
									bodyStyle={{
										padding: 12,
										minHeight: 40,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
									}}
									onClick={() => {
										setSelectedQueueItem(item);
										setSelectedAiGenHistoryId(null);
										setSelectedFlowId(null);
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

				<div className={css.aiSectionHistoryChat}
					 style={{
						 height: isHistoryCollapsed ? '10%' : 'calc(50% - 24px)',
					 }}>
					<div className={css.historyHeader}>
						<div className={css.historyTitle}
							 style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
							 onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}>
							{isHistoryCollapsed ? <ChevronRight size={16} style={{ marginRight: 8 }} /> :
								<ChevronDown size={16} style={{ marginRight: 8 }} />}
							<h3>Lịch sử câu hỏi</h3>
						</div>
					</div>
					{!isHistoryCollapsed && (
						<List
							className={css.aiList}
							loading={loadingAiGenHistory}
							dataSource={aiGenHistory}
							renderItem={item => (
								<Dropdown
									menu={{
										items: [
											{
												key: 'delete',
												danger: true,
												label: (
													<Popconfirm
														title="Xóa lịch sử"
														description="Bạn có chắc chắn muốn xóa lịch sử này?"
														onConfirm={() => handleDeleteAiGenHistory(item.id)}
														okText="Có"
														cancelText="Không"
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
										className={css.aiCard + (selectedAiGenHistoryId === item.id ? ' ' + css.selectedCard : '')}
										size="small"
										bodyStyle={{
											padding: 12,
											minHeight: 40,
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'space-between',
										}}
										onClick={() => handleSelectAiGenHistory(item)}
										style={{
											cursor: 'pointer',
											borderColor: selectedAiGenHistoryId === item.id ? '#1677ff' : undefined,
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
					)}
				</div>
			</div>
			{/* Main */}
			<div className={css.aiMain}>
				<div className={css.allMainContainer}>
					{selectedQueueItem && isLoading ? (
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
										{result && result !== resultDefault && (
											<Button
												type="text"
												onClick={() => {
													setImproveAllInput('');
													setImproveAllModalOpen(true);
												}}
												disabled={!result || result === resultDefault}
											>
												Cải thiện toàn bộ
											</Button>
										)}
										<Button type={'text'} onClick={() => setSaveModalOpen(true)}> Lưu dữ liệu phân tích</Button>
										<Button type={'text'} onClick={() => setFormModalOpen(true)}> Cấu hình AI</Button>
									</div>
								</div>
							</div>

							<div className={css.aiMainBottom}
								style={{
									justifyContent: 'center',
									display: 'flex',
									minHeight: 400,
									height: '100%',
								}}
							>
								<div style={{ display: 'flex', width: '100%', gap: 24 }}>
									{/* Left: Text Content (65%) */}
									<div style={{ flex: 65, maxWidth: '65%', minWidth: 0 }}>
										<div className={css.aiAnswerBox2}>
											<div className={css.aiAnswerContent}>
												{isEditing ? (
													<Input.TextArea
														value={editedContent}
														onChange={e => setEditedContent(e.target.value)}
														autoSize={{ minRows: 6 }}
														style={{ marginBottom: 12 }}
													/>
												) : (
													<>
														{/* Text Content - Always show if available */}
														{result && result !== resultDefault && (
															<div
																className={css.markedContent}
																ref={markedContentRef}
																onMouseUp={handleTextMouseUp}
																dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(result)) }}
																style={{ marginBottom: 0, position: 'relative' }}
															/>
														)}
														{/* Improve Button */}
														{showImproveBtn && (
															<button
																onClick={e => {
																	e.stopPropagation();
																	setImproveInput(selectedText);
																	setImproveModalOpen(true);
																	setShowImproveBtn(false);
																}}
																style={{
																	position: 'fixed',
																	top: improveBtnPos.top,
																	left: improveBtnPos.left,
																	zIndex: 9999,
																	background: '#1677ff',
																	color: '#fff',
																	border: 'none',
																	borderRadius: 4,
																	padding: '2px 8px',
																	fontSize: 12,
																	cursor: 'pointer',
																	boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
																}}
															>
																Improve
															</button>
														)}
													</>
												)}
											</div>
										</div>
									</div>
									{/* Right: Audio + Image (35%) */}
									<div style={{ flex: 35, maxWidth: '35%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
										{/* Audio Result from AI5 */}
										{(() => {
											// Ưu tiên lấy flow của bản ghi lịch sử nếu đang xem lại, còn không lấy flow hiện tại
											let flowConfig = null;
											let audioUrlToCheck = audioUrl;
											let updateId = selectedAiGenHistoryId;
											if (selectedAiGenHistoryId) {
												const historyItem = aiGenHistory.find(h => h.id == selectedAiGenHistoryId);
												if (historyItem) {
													flowConfig = aiConfigList.find(config => config.id == historyItem.AIGenConfigId);
													audioUrlToCheck = historyItem.audioUrl || audioUrl; // Ưu tiên audioUrl từ lịch sử
													updateId = historyItem.id;
												}
											} else {
												flowConfig = getSelectedFlowConfig();
											}
											const hasAI5 = flowConfig?.aiConfigs?.some(ai => ai.name.startsWith('AI5') && ai.isUse);
											const hasAudioUrl = audioUrlToCheck && audioUrlToCheck.trim() !== '';
											if (
												hasAI5 &&
												!hasAudioUrl &&
												result &&
												result !== resultDefault
											) {
												return (
													<Button
														type="primary"
														loading={isLoading}
														style={{ marginBottom: 12 }}
														onClick={async () => {
															setIsLoading(true);
															try {
																const ai5 = flowConfig.aiConfigs.find(ai => ai.name.startsWith('AI5') && ai.isUse);
																const aiPrompt = result;
																const response = await aiGen2(aiPrompt, ai5.systemMessage, 'gemini-2.5-flash-preview-tts', 'audio');
																console.log(response);
																const aiResult = response.result || response.answer || response.content || response;
																if (aiResult && aiResult.audio_base64) {
																	const contentType = aiResult.audio_format === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';
																	const base64 = cleanBase64(aiResult.audio_base64);
																	const bytes = base64ToUint8Array(base64);
																	const blob = new Blob([bytes], { type: contentType });
																	const finalFileName = ensureFileNameWithExtension(Date.now().toString(), contentType);
																	const fileObj = new File([blob], finalFileName, { type: contentType });
																	let url = '';
																	try {
																		const res = await uploadFiles([fileObj]);
																		url = res.files?.[0]?.fileUrl || res.files?.[0]?.url || '';
																		setAudioUrl(url);
																		// Nếu đang xem lại lịch sử thì update vào bản ghi đó, còn không thì update bản ghi mới nhất của user
																		let idToUpdate = updateId;
																		if (!idToUpdate) {
																			// Tìm bản ghi mới nhất của user với prompt/result hiện tại
																			const last = aiGenHistory
																				.filter(h => h.userCreated === currentUser?.email && h.prompt === prompt && h.anwser === result)
																				.sort((a, b) => new Date(b.create_at) - new Date(a.create_at))[0];
																			idToUpdate = last?.id;
																		}
																		if (idToUpdate) {
																			await updateAiGenHistory({
																				id: idToUpdate,
																				audioUrl: url,
																			});
																		}
																		message.success('Đã tạo audio thành công!');
																	} catch (e) {
																		console.error('Upload audio failed', e);
																		message.error('Upload audio thất bại!');
																	}
																} else {
																	message.error('Không tạo được audio!');
																}
															} catch (err) {
																console.error('Error creating audio:', err);
																message.error('Có lỗi khi tạo audio!');
															} finally {
																setIsLoading(false);
															}
														}}
													>
														Tạo audio
													</Button>
												);
											}
											return null;
										})()}
										{/* Hiển thị audio player nếu có audioUrl */}
										{(() => {
											// Kiểm tra audioUrl từ cả state và lịch sử
											let audioUrlToDisplay = audioUrl;
											if (selectedAiGenHistoryId) {
												const historyItem = aiGenHistory.find(h => h.id == selectedAiGenHistoryId);
												if (historyItem && historyItem.audioUrl) {
													audioUrlToDisplay = historyItem.audioUrl;
												}
											}

											if (audioUrlToDisplay && audioUrlToDisplay.trim() !== '') {
												return (
													<div style={{
														marginBottom: 12,
														padding: 20,
														border: '1px solid #e9ecef',
														borderRadius: 8,
														backgroundColor: '#f8f9fa'
													}}>
														<h4 style={{ marginBottom: 16, color: '#333' }}>
															🎵 Kết quả âm thanh từ AI5
														</h4>
														<div style={{ textAlign: 'center' }}>
															<audio
																controls
																src={audioUrlToDisplay}
																style={{ width: '100%' }}
															>
																Your browser does not support the audio element.
															</audio>
														</div>
													</div>
												);
											}
											return null;
										})()}
										{/* Image Result from AI4 */}
										{imageUrls && imageUrls.length > 0 && (
											<div style={{
												marginTop: 12,
												padding: 20,
												border: '1px solid #e9ecef',
												borderRadius: 8,
												backgroundColor: '#f8f9fa'
											}}>
												<h4 style={{ marginBottom: 16, color: '#333' }}>
													🖼️ Kết quả tạo ảnh từ AI4 ({imageUrls.length} ảnh)
												</h4>
												<div style={{
													display: 'flex',
													flexDirection: 'column',
													gap: 12,
													maxHeight: '400px',
													overflowY: 'auto'
												}}>
													{imageUrls.map((imageUrl, index) => (
														<div key={index} style={{ textAlign: 'center' }}>
															<img
																src={imageUrl}
																alt={`AI Generated Image ${index + 1}`}
																style={{
																	maxWidth: '100%',
																	maxHeight: '300px',
																	borderRadius: 8,
																	boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
																	cursor: 'pointer'
																}}
																onClick={() => {
																	// Open image in new tab
																	window.open(imageUrl, '_blank');
																}}
															/>
															<div style={{
																marginTop: 8,
																fontSize: 12,
																color: '#666'
															}}>
																Ảnh {index + 1}
															</div>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			<AIGenForm
				isOpen={formModalOpen}
				onClose={() => setFormModalOpen(false)}
				onAnalyze={handleAnalyze}
				onConfigListChange={loadAiConfigList}
			/>

			{
				templateModalOpen && <TemplateModalGen
					isOpen={templateModalOpen}
					onClose={() => setTemplateModalOpen(false)}
					onSelectTemplate={handleTemplateSelect}
					currentUser={currentUser}
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
			{/* Improve Modal đặt ngoài cùng để luôn hiển thị đúng */}
			<Modal
				open={improveModalOpen}
				onCancel={() => {
					setImproveModalOpen(false);
					setImprovePreview(null);
				}}
				title="Improve Selected Text"
				footer={null}
				style={{ top: 120 }}
				destroyOnClose
				width={800}
			>

				<div style={{ marginBottom: 16 }}>
					<div style={{ marginBottom: 8, fontWeight: 'bold' }}>Đoạn văn đã chọn:</div>
					<Input.TextArea
						value={selectedText}
						readOnly
						autoSize={{ minRows: 3 }}
						style={{
							backgroundColor: '#f5f5f5',
							borderColor: '#d9d9d9',
							color: '#666'
						}}
					/>
				</div>

				<div style={{ marginBottom: 16 }}>
					<div style={{ marginBottom: 8, fontWeight: 'bold' }}>Yêu cầu cải thiện:</div>
					<Input.TextArea
						value={improveInput}
						onChange={e => {
							setImproveInput(e.target.value);
							// Generate preview when input changes
							if (e.target.value.trim() && selectedTextRange) {
								const preview = generatePreview(result, selectedTextRange, e.target.value);
								setImprovePreview(preview);
							} else {
								setImprovePreview(null);
							}
						}}
						autoSize={{ minRows: 3 }}
						placeholder="Nhập yêu cầu cải thiện đoạn văn đã chọn..."
					/>
				</div>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<Button
						onClick={() => {
							setImproveModalOpen(false);
							setImprovePreview(null);
						}}
					>
						Hủy
					</Button>
					<Button
						type="primary"
						loading={improveLoading}
						disabled={!improveInput.trim() || !selectedTextRange}
						onClick={async () => {
							if (!selectedTextRange) {
								alert('Không thể xác định vị trí đoạn văn đã chọn!');
								return;
							}

							setImproveLoading(true);
							try {
								const model = MODEL_AI_LIST[0].value;
								const response = await improveText(result, selectedText, improveInput, model);
								const improvedText = response.result || response.improved_text || response.content || response;

								// Use the complete improved content instead of replacing at position
								if (improvedText && improvedText !== result) {
									// Tìm ID của bản ghi lịch sử để cập nhật
									let historyIdToUpdate = selectedAiGenHistoryId;

									// Nếu không có selectedAiGenHistoryId, tìm bản ghi mới nhất phù hợp
									if (!historyIdToUpdate) {
										const matchingHistory = aiGenHistory
											.filter(h => h.userCreated === currentUser?.email && h.prompt === prompt && h.anwser === result)
											.sort((a, b) => new Date(b.create_at) - new Date(a.create_at))[0];

										if (matchingHistory) {
											historyIdToUpdate = matchingHistory.id;
											setSelectedAiGenHistoryId(matchingHistory.id);
										}
									}

									// Cập nhật database nếu có ID
									if (historyIdToUpdate) {
										await updateAiGenHistory({
											id: historyIdToUpdate,
											anwser: improvedText,
										});
									}

									setResult(improvedText);
									setImproveModalOpen(false);
									setImprovePreview(null);
									setSelectedTextRange(null);
									message.success('Đã cải thiện văn bản.')
								} else {
									alert('Không có thay đổi nào được thực hiện!');
								}
							} catch (error) {
								console.error('Error improving text:', error);
								alert('Có lỗi xảy ra khi cải thiện văn bản: ' + error.message);
							} finally {
								setImproveLoading(false);
							}
						}}
					>
						Cải thiện
					</Button>
				</div>
			</Modal>
			{/* Improve All Modal */}
			<Modal
				open={improveAllModalOpen}
				onCancel={() => {
					setImproveAllModalOpen(false);
					setImproveAllInput('');
				}}
				title="Cải thiện toàn bộ nội dung"
				footer={null}
				destroyOnClose
				width={800}
				height={'90vh'}
				centered={true}
			>
				<div style={{ marginBottom: 8, fontWeight: 'bold' }}>Nội dung hiện tại:</div>
				<div style={{
					marginBottom: 16,
					height: '45vh',
					overflow: 'auto',
				}}>
					<Input.TextArea
						value={result}
						readOnly
						autoSize={{ minRows: 6 }}
						style={{
							backgroundColor: '#f5f5f5',
							borderColor: '#d9d9d9',
							color: '#666',
						}}
					/>
				</div>

				<div style={{ marginBottom: 16 }}>
					<div style={{ marginBottom: 8, fontWeight: 'bold' }}>Yêu cầu cải thiện:</div>
					<Input.TextArea
						value={improveAllInput}
						onChange={e => setImproveAllInput(e.target.value)}
						autoSize={{ minRows: 4 }}
						placeholder="Nhập yêu cầu cải thiện toàn bộ nội dung (ví dụ: Viết lại ngắn gọn hơn, Thêm ví dụ cụ thể, Cải thiện cấu trúc văn bản...)"
					/>
				</div>

				<div style={{ marginBottom: 16 }}>
					<div style={{ marginBottom: 8, fontWeight: 'bold', color: '#666' }}>
						💡 Gợi ý:
					</div>
					<div style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>
						• "Viết lại ngắn gọn và dễ hiểu hơn"<br />
						• "Thêm ví dụ cụ thể và minh họa"<br />
						• "Cải thiện cấu trúc và bố cục văn bản"<br />
						• "Sử dụng ngôn ngữ chuyên nghiệp hơn"<br />
						• "Thêm các điểm quan trọng còn thiếu"
					</div>
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<Button
						onClick={() => {
							setImproveAllModalOpen(false);
							setImproveAllInput('');
						}}
					>
						Hủy
					</Button>
					<Button
						type="primary"
						loading={improveAllLoading}
						disabled={!improveAllInput.trim() || !result || result === resultDefault}
						onClick={async () => {
							setImproveAllLoading(true);
							try {
								const model = MODEL_AI_LIST[0].value;
								const response = await improveText(result, result, improveAllInput, model);
								const improvedText = response.result || response.improved_text || response.content || response;

								if (improvedText && improvedText !== result) {
									// Tìm ID của bản ghi lịch sử để cập nhật
									let historyIdToUpdate = selectedAiGenHistoryId;

									// Nếu không có selectedAiGenHistoryId, tìm bản ghi mới nhất phù hợp
									if (!historyIdToUpdate) {
										const matchingHistory = aiGenHistory
											.filter(h => h.userCreated === currentUser?.email && h.prompt === prompt && h.anwser === result)
											.sort((a, b) => new Date(b.create_at) - new Date(a.create_at))[0];

										if (matchingHistory) {
											historyIdToUpdate = matchingHistory.id;
											setSelectedAiGenHistoryId(matchingHistory.id);
										}
									}

									// Cập nhật database nếu có ID
									if (historyIdToUpdate) {
										await updateAiGenHistory({
											id: historyIdToUpdate,
											anwser: improvedText,
										});
									}

									setResult(improvedText);
									setImproveAllModalOpen(false);
									setImproveAllInput('');
									message.success('Đã cải thiện toàn bộ nội dung thành công!');
								} else {
									message.warning('Không có thay đổi nào được thực hiện!');
								}
							} catch (error) {
								console.error('Error improving all text:', error);
								message.error('Có lỗi xảy ra khi cải thiện nội dung: ' + error.message);
							} finally {
								setImproveAllLoading(false);
							}
						}}
					>
						Cải thiện toàn bộ
					</Button>
				</div>
			</Modal>
			{/* Batch Processing Modal */}
			<Modal
				open={batchModalOpen}
				onCancel={() => {
					setBatchModalOpen(false);
					setBatchQuestions([]);
				}}
				title="Hỏi hàng loạt"
				footer={null}
				style={{ top: 20 }}
				destroyOnClose
				width={1200}
			>
				<div style={{ display: 'flex', gap: 24, height: '70vh' }}>
					{/* Left: Configuration */}
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
						<div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
							Cấu hình chung
						</div>

						{/* Flow Selection */}
						<div>
							<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
								Luồng AI:
							</label>
							<Dropdown
								menu={{
									items: aiConfigList.map(config => ({
										key: config.id,
										label: config.name,
										onClick: () => setBatchConfig(prev => ({ ...prev, selectedFlowId: config.id })),
									})),
								}}
								trigger={['click']}
								placement="bottomLeft"
							>
								<Button
									size="large"
									style={{
										backgroundColor: batchConfig.selectedFlowId ? '#e6f7ff' : undefined,
										borderColor: batchConfig.selectedFlowId ? '#1890ff' : undefined,
										width: '100%',
										textAlign: 'left',
									}}
								>
									{loadingFlowList ? 'Đang tải...' :
										batchConfig.selectedFlowId ?
											aiConfigList.find(c => c.id === batchConfig.selectedFlowId)?.name || 'Chọn luồng' :
											'Chọn luồng'
									}
								</Button>
							</Dropdown>
						</div>

						{/* Expected Length */}
						<div>
							<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
								Độ dài (chữ):
							</label>
							<Input
								size="large"
								type="number"
								value={batchConfig.expectedLength}
								onChange={(e) => setBatchConfig(prev => ({
									...prev,
									expectedLength: parseInt(e.target.value) || 500
								}))}
								min={100}
								max={50000}
							/>
						</div>

						{/* Writing Style */}
						<div>
							<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
								Kiểu viết:
							</label>
							<Input
								size="large"
								value={batchConfig.writingStyle}
								onChange={e => setBatchConfig(prev => ({
									...prev,
									writingStyle: e.target.value
								}))}
								placeholder="Ví dụ: Trang trọng, Thân mật, Học thuật, ..."
							/>
						</div>

						{/* Image Count - only show if AI4 is enabled */}
						{(() => {
							const flowConfig = aiConfigList.find(config => config.id == batchConfig.selectedFlowId);
							const hasAI4 = flowConfig?.aiConfigs?.some(ai => ai.name.startsWith('AI4') && ai.isUse);
							if (hasAI4) {
								return (
									<div>
										<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
											Số lượng ảnh:
										</label>
										<Select
											size="large"
											value={batchConfig.imageCount}
											onChange={value => setBatchConfig(prev => ({
												...prev,
												imageCount: value
											}))}
											options={Array.from({ length: 10 }, (_, i) => ({
												value: i + 1,
												label: `${i + 1} ảnh`
											}))}
											style={{ width: '100%' }}
										/>
									</div>
								);
							}
							return null;
						})()}

						{/* Action Buttons */}
						<div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
							<Button
								type="primary"
								size="large"
								loading={batchLoading}
								onClick={runBatchProcessing}
								disabled={!batchConfig.selectedFlowId || batchQuestions.length === 0}
								style={{ flex: 1 }}
							>
								Chạy hàng loạt ({batchQuestions.filter(q => q.question.trim()).length} câu hỏi)
							</Button>
						</div>
					</div>

					{/* Right: Questions Table */}
					<div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<div style={{ fontWeight: 'bold', fontSize: 16 }}>
								Danh sách câu hỏi ({batchQuestions.length})
							</div>
							<Button
								type="primary"
								icon={<PlusCircle size={16} />}
								onClick={addQuestion}
							>
								Thêm câu hỏi
							</Button>
						</div>

						{/* Questions List */}
						<div style={{
							flex: 1,
							border: '1px solid #d9d9d9',
							borderRadius: 6,
							overflow: 'auto',
							maxHeight: '500px'
						}}>
							{batchQuestions.length === 0 ? (
								<div style={{
									textAlign: 'center',
									padding: 40,
									color: '#999',
									fontStyle: 'italic'
								}}>
									Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.
								</div>
							) : (
								<div style={{ padding: 16 }}>
									{batchQuestions.map((question, index) => (
										<div
											key={question.id}
											style={{
												border: '1px solid #e8e8e8',
												borderRadius: 6,
												padding: 12,
												marginBottom: 12,
												backgroundColor: '#fafafa'
											}}
										>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
												<div style={{ flex: 1 }}>
													<div style={{ marginBottom: 8, fontWeight: 'bold', color: '#666' }}>
														Câu hỏi {index + 1}:
													</div>
													<Input.TextArea
														value={question.question}
														onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
														placeholder="Nhập câu hỏi của bạn..."
														autoSize={{ minRows: 3, maxRows: 6 }}
														style={{ marginBottom: 8 }}
													/>
													<div style={{ fontSize: 12, color: '#999' }}>
														{question.question.length} ký tự
													</div>
												</div>
												<Button
													type="text"
													danger
													icon={<Trash2 size={16} />}
													onClick={() => removeQuestion(question.id)}
													style={{ flexShrink: 0 }}
												/>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Summary */}
						{batchQuestions.length > 0 && (
							<div style={{
								padding: 12,
								backgroundColor: '#f0f8ff',
								borderRadius: 6,
								border: '1px solid #91d5ff'
							}}>
								<div style={{ fontWeight: 'bold', marginBottom: 4 }}>
									Tóm tắt:
								</div>
								<div style={{ fontSize: 14, color: '#666' }}>
									• Tổng câu hỏi: {batchQuestions.length}<br/>
									• Câu hỏi hợp lệ: {batchQuestions.filter(q => q.question.trim()).length}<br/>
									• Câu hỏi trống: {batchQuestions.filter(q => !q.question.trim()).length}
								</div>
							</div>
						)}
					</div>
				</div>
			</Modal>
		</div>
	);
}

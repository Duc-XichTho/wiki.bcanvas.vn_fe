import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Typography, Button, Select, Input, message, Space, Spin, Card, Progress, Popconfirm } from 'antd';
import { RobotOutlined, FileTextOutlined, CheckCircleOutlined, DragOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { getAllAIChatHistoryList, createAIChatHistoryList } from '../../../apis/aiChatHistoryListService.jsx';
import { aiGen2 } from '../../../apis/botService.jsx';
import { MODEL_AI_LIST } from '../../../AI_CONST.js';
import css from '../BaoCao/BaoCao.module.css';
import styles from '../../../components/ResourcePanel/ResourcePanel.module.css';
import { getSettingByType } from '../../../apis/settingService.jsx';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AnalysisModalBCNhomVV = ({
	visible,
	onClose,
	rowData = [],
	groups = [],
	currentYearKTQT,
	currentCompanyKTQT,
	currentUser
}) => {
	// State cho phân tích
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysisResult, setAnalysisResult] = useState('');
	const [hasAnalysis, setHasAnalysis] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);

	// State cho form phân tích
	const [selectedAIModel, setSelectedAIModel] = useState('gpt-5-mini-2025-08-07');
	const [customPrompt, setCustomPrompt] = useState('');

	// State cho drag & drop
	const [isDragging, setIsDragging] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const modalRef = useRef(null);

	const [chartColors, setChartColors] = useState([]);

	// Memoize MODEL_AI_LIST để tránh re-render không cần thiết
	const memoizedModelList = useMemo(() => MODEL_AI_LIST, []);

	// Default prompt cho phân tích báo cáo BCNhomVV
	const defaultPrompt = `Hãy phân tích báo cáo KQKD Vụ việc với các thông tin sau:
- Năm: ${currentYearKTQT}
- Công ty: ${currentCompanyKTQT}
- Dữ liệu báo cáo: ${rowData.length} khoản mục
- Các nhóm vụ việc: ${groups.join(', ')}

Vui lòng đưa ra:
1. Tổng quan về tình hình kinh doanh theo nhóm vụ việc
2. Phân tích các khoản mục chính (doanh thu, chi phí, lợi nhuận) theo từng nhóm
3. Phân tích xu hướng theo tháng (T1-T12) và lũy kế năm
4. So sánh hiệu quả giữa các nhóm vụ việc
5. Nhận xét và đánh giá hiệu quả hoạt động
6. Đề xuất các biện pháp cải thiện nếu cần

Hãy trình bày một cách chi tiết, dễ hiểu và có tính thực tiễn.`;

	useEffect(() => {
		(async () => {
			try {
				const colorSetting = await getSettingByType('SettingColor');
				if (colorSetting && colorSetting.setting && Array.isArray(colorSetting.setting)) {
					const colors = colorSetting.setting.map(item => item.color).filter(Boolean);
					if (colors.length) setChartColors(colors);
				}
			} catch (e) {
				console.error('Error loading chart colors:', e);
			}
		})();
	}, []);

	// Load phân tích từ database khi mở modal
	useEffect(() => {
		const loadAnalysisHistory = async () => {
			if (!visible) return;
			
			setIsLoadingHistory(true);
			try {
				// Tìm phân tích cho báo cáo BCNhomVV (không lọc theo user)
				const allChatHistories = await getAllAIChatHistoryList();
				const existingAnalysis = allChatHistories.find(history => 
					history.type === 'PHAN_TICH_BAO_CAO' &&
					history.info?.baoCao === 'BCNhomVV' &&
					history.show === true
				);
				
				if (existingAnalysis && existingAnalysis.chatHistory && existingAnalysis.chatHistory.length > 0) {
					// Lấy kết quả phân tích cuối cùng
					const lastAnalysis = existingAnalysis.chatHistory[existingAnalysis.chatHistory.length - 1];
					if (lastAnalysis.role === 'assistant') {
						setAnalysisResult(lastAnalysis.content);
						setHasAnalysis(true);
					}
				} else {
					// Nếu không có phân tích, hiển thị form phân tích mới
					setHasAnalysis(false);
					setCustomPrompt(defaultPrompt);
				}
			} catch (error) {
				console.error('Error loading analysis history:', error);
				// Fallback: hiển thị form phân tích mới
				setHasAnalysis(false);
				setCustomPrompt(defaultPrompt);
			} finally {
				setIsLoadingHistory(false);
			}
		};

		loadAnalysisHistory();
	}, [visible, currentYearKTQT, currentCompanyKTQT]);

	// Đảm bảo selectedAIModel luôn có giá trị hợp lệ
	useEffect(() => {
		if (!selectedAIModel || !memoizedModelList.find(model => model.value === selectedAIModel)) {
			const defaultModel = memoizedModelList[0]?.value || 'gpt-5-mini-2025-08-07';
			setSelectedAIModel(defaultModel);
		}
	}, [selectedAIModel, memoizedModelList]);

	// Hàm render markdown
	const renderMarkdown = (content) => {
		try {
			const html = marked(content);
			return DOMPurify.sanitize(html);
		} catch (error) {
			console.error('Error rendering markdown:', error);
			return content;
		}
	};

	// Hàm lọc dữ liệu để chỉ giữ lại dp và các cột group theo tháng
	const filterDataForAnalysis = (data) => {
		if (!data || !Array.isArray(data)) return [];
		
		// Lấy danh sách các cột group theo tháng
		const groupColumns = [];
		groups.forEach(group => {
			for (let i = 0; i <= 12; i++) {
				const columnName = `${group}_${i}`;
				groupColumns.push(columnName);
			}
		});
		
		// Lọc bỏ các cột mà tất cả dòng tổng hợp (layer không có dấu .) đều có giá trị = 0
		const validColumns = groupColumns.filter(columnName => {
			// Lấy tất cả dòng tổng hợp (layer không chứa dấu .)
			const summaryRows = data.filter(row => !row.layer || !row.layer.includes('.'));
			
			// Kiểm tra xem có ít nhất 1 dòng tổng hợp có giá trị khác 0 không
			return summaryRows.some(row => {
				const value = row[columnName];
				return value !== undefined && value !== null && value !== 0;
			});
		});
		
		console.log('Valid columns after filtering:', validColumns);
		
		return data.map(row => {
			const filteredRow = {
				dp: row.dp,
				layer: row.layer
			};
			
			// Chỉ thêm các cột có dữ liệu
			validColumns.forEach(columnName => {
				if (row[columnName] !== undefined) {
					filteredRow[columnName] = row[columnName];
				}
			});
			
			return filteredRow;
		});
	};

	// Hàm xử lý phân tích một lần
	const handleAnalyze = async () => {
		if (!customPrompt.trim()) {
			message.warning('Vui lòng nhập prompt phân tích');
			return;
		}

		setIsAnalyzing(true);
		try {
			// Lọc dữ liệu để chỉ giữ lại dp và các cột group theo tháng
			const filteredData = filterDataForAnalysis(rowData);
			
			// Log dữ liệu đã lọc
			console.log('=== FILTERED DATA FOR AI ===');
			console.log('Original data length:', rowData.length);
			console.log('Filtered data length:', filteredData.length);
			console.log('Filtered data sample (first 3 rows):', filteredData.slice(0, 3));
			console.log('All filtered data:', filteredData);
			console.log('=== END FILTERED DATA ===');
			
			// Chuẩn bị dữ liệu báo cáo đầy đủ
			const reportData = {
				currentYearKTQT,
				currentCompanyKTQT,
				groups: groups,
				rowData: filteredData,
				summary: {
					totalItems: filteredData.length,
					groups: groups.length,
					revenueItems: filteredData.filter(item => item.dp && item.dp.includes('Doanh Thu')).length,
					costItems: filteredData.filter(item => item.dp && (item.dp.includes('CF') || item.dp.includes('Chi phí'))).length,
				}
			};

			// Tạo prompt với dữ liệu đầy đủ
			const fullPrompt = `${customPrompt}

Dữ liệu báo cáo chi tiết:
${JSON.stringify(reportData, null, 2)}

Hãy phân tích dữ liệu này một cách toàn diện và đưa ra nhận xét chi tiết.`;

			// Gọi AI để phân tích
			const response = await aiGen2(
				fullPrompt,
				`Bạn là chuyên gia phân tích tài chính. Hãy phân tích báo cáo KQKD Vụ việc một cách chi tiết và chuyên nghiệp dựa trên dữ liệu được cung cấp.`,
				selectedAIModel,
				'text'
			);

			// Debug log để xem response
			console.log('AI Response:', response);

			// Lưu kết quả phân tích
			let analysisContent = '';
			
			// Xử lý response từ AI
			if (response.generated) {
				analysisContent = response.generated;
			} else if (response.response) {
				analysisContent = response.response;
			} else if (response.message) {
				analysisContent = response.message;
			} else if (typeof response === 'string') {
				analysisContent = response;
			} else {
				analysisContent = 'Không thể phân tích dữ liệu.';
			}
			
			console.log('Analysis Content:', analysisContent);
			
			setAnalysisResult(analysisContent);
			setHasAnalysis(true);

			// Lưu phân tích vào database
			const newChatHistory = [
				{ role: 'user', content: customPrompt, timestamp: new Date().toISOString() },
				{ role: 'assistant', content: analysisContent, timestamp: new Date().toISOString() },
			];

			try {
				const newChatHistoryData = {
					info: {
						baoCao: 'BCNhomVV',
						currentYearKTQT,
						currentCompanyKTQT,
						groups: groups,
						rowDataCount: filteredData.length,
					},
					chatHistory: newChatHistory,
					type: 'PHAN_TICH_BAO_CAO',
					user_create: currentUser.id,
					show: true,
				};
				
				await createAIChatHistoryList(newChatHistoryData);
			} catch (error) {
				console.error('Error saving analysis:', error);
			}

			message.success('Phân tích hoàn thành!');
		} catch (error) {
			console.error('Error analyzing data:', error);
			message.error('Không thể phân tích dữ liệu. Vui lòng thử lại.');
		} finally {
			setIsAnalyzing(false);
		}
	};

	// Hàm reset phân tích
	const handleResetAnalysis = async () => {
		try {
			// Reset state
			setAnalysisResult('');
			setHasAnalysis(false);
			setCustomPrompt(defaultPrompt);

			message.success('Đã xóa phân tích thành công!');
		} catch (error) {
			console.error('Error resetting analysis:', error);
			message.error('Không thể xóa phân tích. Vui lòng thử lại.');
		}
	};

	// Hàm xử lý drag & drop
	const handleMouseDown = (e) => {
		if (e.target.closest('.ant-modal-body') || e.target.closest('.ant-modal-footer')) {
			return; // Không drag khi click vào body hoặc footer
		}
		
		setIsDragging(true);
		const rect = modalRef.current.getBoundingClientRect();
		setDragOffset({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		});
		e.preventDefault();
	};

	const handleMouseMove = (e) => {
		if (!isDragging) return;
		
		const newX = e.clientX - dragOffset.x;
		const newY = e.clientY - dragOffset.y;
		
		// Giới hạn trong viewport
		const maxX = window.innerWidth - 600; // 600px là width modal
		const maxY = window.innerHeight - 600; // 600px là height modal
		
		setPosition({
			x: Math.max(0, Math.min(newX, maxX)),
			y: Math.max(0, Math.min(newY, maxY))
		});
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	// Event listeners cho drag
	useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, dragOffset]);

	if (!visible) return null;

	return (
		<div className={css.modalOverlay} onClick={onClose}>
			<div
				ref={modalRef}
				className={`${css.draggableModal} ${isDragging ? css.dragging : ''}`}
				style={{
					left: position.x,
					top: position.y,
					width: '600px',
					height: '600px',
					cursor: isDragging ? 'grabbing' : 'default'
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header với drag handle */}
				<div
					className={css.modalHeader}
					onMouseDown={handleMouseDown}
					style={{
						cursor: 'grab',
						userSelect: 'none',
						backgroundColor: chartColors[0] || '#f0f0f0',
						color: '#fff'
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{ fontWeight: '500' }}>Phân tích AI - Vụ việc</span>
					</div>
					<Button
						type="text"
						size="small"
						onClick={onClose}
						style={{ padding: '4px' }}
					>
						×
					</Button>
				</div>

				{/* Body */}
				<div className={css.modalBody}>
					{isLoadingHistory ? (
						<div style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							height: '100%',
							flexDirection: 'column',
							gap: '12px'
						}}>
							<Spin size="large" />
							<Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
								Đang tải...
							</Text>
						</div>
					) : hasAnalysis ? (
						/* Hiển thị kết quả phân tích */
						<>
							<div style={{ 
								display: 'flex', 
								alignItems: 'center', 
								gap: '6px',
								marginBottom: '12px',
								padding: '8px 12px',
								backgroundColor: '#f6ffed',
								borderRadius: '6px',
								border: '1px solid #b7eb8f'
							}}>
								<CheckCircleOutlined style={{ color: '#52c41a' }} />
								<Text strong style={{ fontSize: '13px' }}>Kết quả phân tích</Text>
							</div>
							<div
								className={styles.markdownContent}
								style={{ 
									height: '90%',
									overflow: 'auto',
									padding: '8px',
									backgroundColor: '#fafafa',
									borderRadius: '6px',
									lineHeight: '1.5',
									color: '#262626',
									fontSize: '13px',
									border: '1px solid #f0f0f0'
								}}
								dangerouslySetInnerHTML={{
									__html: renderMarkdown(analysisResult),
								}}
							/>
						</>
					) : (
						/* Form phân tích mới */
						<div>
							<div style={{ 
								marginBottom: '12px',
								padding: '8px 12px',
								backgroundColor: '#f0f8ff',
								borderRadius: '6px',
								border: '1px solid #d6e4ff'
							}}>
								<Text strong style={{ fontSize: '13px' }}>Phân tích mới</Text>
							</div>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
								<div>
									<Text strong style={{ fontSize: '12px' }}>AI Model:</Text>
									<Select
										value={selectedAIModel}
										onChange={setSelectedAIModel}
										style={{ width: '100%', marginTop: '4px' }}
										size="small"
									>
										{memoizedModelList.map(model => (
											<Option key={model.value} value={model.value}>
												{model.name}
											</Option>
										))}
									</Select>
								</div>
								<div>
									<Text strong style={{ fontSize: '12px' }}>Prompt:</Text>
									<TextArea
										value={customPrompt}
										onChange={(e) => setCustomPrompt(e.target.value)}
										placeholder="Nhập prompt phân tích..."
										rows={4}
										style={{ marginTop: '4px', fontSize: '12px' }}
									/>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Text type="secondary" style={{ fontSize: '10px' }}>
										{rowData.length} khoản mục, {groups.length} nhóm vụ việc
									</Text>
									<Button
										type="primary"
										onClick={handleAnalyze}
										loading={isAnalyzing}
										icon={<RobotOutlined />}
										size="small"
									>
										{isAnalyzing ? 'Phân tích...' : 'Phân tích'}
									</Button>
								</div>
								{isAnalyzing && (
									<div style={{ textAlign: 'center' }}>
										<Progress 
											percent={50} 
											status="active" 
											strokeColor="#1890ff"
											size="small"
											style={{ marginBottom: '4px' }}
										/>
										<Text type="secondary" style={{ fontSize: '10px' }}>
											AI đang phân tích...
										</Text>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className={css.modalFooter}>
					<Popconfirm
						title="Xóa phân tích"
						description="Bạn có chắc chắn muốn xóa phân tích hiện tại? Hành động này không thể hoàn tác."
						onConfirm={handleResetAnalysis}
						okText="Xóa"
						cancelText="Hủy"
						okButtonProps={{ danger: true }}
						icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
					>
						<Button
							size="small"
							danger
						>
							Reset
						</Button>
					</Popconfirm>
					<Button
						size="small"
						onClick={onClose}
					>
						Đóng
					</Button>
				</div>
			</div>
		</div>
	);
};

export default AnalysisModalBCNhomVV;

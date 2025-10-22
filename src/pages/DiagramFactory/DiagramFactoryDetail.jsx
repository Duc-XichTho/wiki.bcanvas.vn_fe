import { Modal as AntdModal, Button, Card, message } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { aiGen, aiGen2 } from '../../apis/botService';
import { createNewDiagramFactoryDetail, deleteDiagramFactoryDetail, getListDiagramFactoryDetailDataByDiagramFactoryId } from '../../apis/diagramFactoryDetailService';
import { createTimestamp, formatDateFromTimestamp } from '../../generalFunction/format';
import { MyContext } from '../../MyContext.jsx';
import styles from './DiagramFactory.module.css';
import CreatePromptModal from './modals/CreatePromptModal';

export default function DiagramFactoryDetail() {
	const { currentUser } = useContext(MyContext);
	const isAdmin = currentUser?.isAdmin || currentUser?.isSuperAdmin;
	const { fileId, contentId } = useParams();
	const navigate = useNavigate();

	// Get temporary items từ context
	const { temporaryItems, setTemporaryItems } = useOutletContext();

	const [contentList, setContentList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showPromptModal, setShowPromptModal] = useState(false);
	const [processingItems, setProcessingItems] = useState(new Set());

	// Load content list từ API
	useEffect(() => {
		if (fileId) {
			loadContentListAndTemporaryItems();
		}
	}, [fileId]);


	// Gộp logic load content list và temporary items
	const loadContentListAndTemporaryItems = async () => {
		try {
			setLoading(true);

			// Load saved items từ API
			const response = await getListDiagramFactoryDetailDataByDiagramFactoryId(fileId);
			const savedItems = response ? response.filter(item => !item.isTemporary) : [];

			// Load temporary items từ context
			let fileTemporaryItems = [];
			if (Array.isArray(temporaryItems)) {
				fileTemporaryItems = temporaryItems;
			} else if (temporaryItems && typeof temporaryItems === 'object') {
				fileTemporaryItems = temporaryItems[fileId] || [];
			}

			// Gộp saved items và temporary items
			const allItems = [...fileTemporaryItems, ...savedItems];
			setContentList(allItems);

			// Set processing items từ temporary items
			const processingIds = new Set();
			fileTemporaryItems.forEach(item => {
				if (item.status === 'processing') {
					processingIds.add(item.id);
				}
			});
			setProcessingItems(processingIds);

		} catch (error) {
			console.error('Lỗi khi load content list và temporary items:', error);
		} finally {
			setLoading(false);
		}
	};


	// Save temporary items vào context
	const saveTemporaryItems = (items) => {
		try {
			const fileTemporaryItems = items.filter(item => item.isTemporary);

			// Nếu temporaryItems hiện tại là array, chuyển đổi sang object format
			if (Array.isArray(temporaryItems)) {
				setTemporaryItems({
					[fileId]: fileTemporaryItems
				});
			} else {
				setTemporaryItems(prev => ({
					...prev,
					[fileId]: fileTemporaryItems
				}));
			}
		} catch (error) {
			console.error('Lỗi khi save temporary items:', error);
		}
	};

	const handleSelectContent = (content) => {
		navigate(`/diagram-factory/${fileId}/content/${content.id}`);
	};

	const handleDeleteContent = (content) => {
		AntdModal.confirm({
			title: 'Xác nhận xóa nội dung',
			content: `Bạn có chắc chắn muốn xóa nội dung này? Hành động này không thể hoàn tác.`,
			okText: 'Xóa',
			okType: 'danger',
			cancelText: 'Hủy',
			onOk: async () => {
				try {
					// Nếu là temporary item, chỉ xóa khỏi UI và context
					if (content.isTemporary) {
						setContentList(prev => prev.filter(item => item.id !== content.id));
						setProcessingItems(prev => {
							const newSet = new Set(prev);
							newSet.delete(content.id);
							return newSet;
						});
						// Cập nhật context
						if (Array.isArray(temporaryItems)) {
							setTemporaryItems(prev => prev.filter(item => item.id !== content.id));
						} else {
							setTemporaryItems(prev => ({
								...prev,
								[fileId]: (prev[fileId] || []).filter(item => item.id !== content.id)
							}));
						}
						message.success('Xóa nội dung thành công');
					} else {
						// Nếu là saved item, xóa khỏi database
						const response = await deleteDiagramFactoryDetail(content.id);
						if (response) {
							message.success('Xóa nội dung thành công');
							// Cập nhật state thay vì reload
							setContentList(prev => prev.filter(item => item.id !== content.id));
							// Xóa khỏi processing items nếu có
							setProcessingItems(prev => {
								const newSet = new Set(prev);
								newSet.delete(content.id);
								return newSet;
							});
						}
					}
				} catch (error) {
					console.error('Lỗi khi xóa nội dung:', error);
					message.error('Không thể xóa nội dung');
				}
			}
		});
	};

	const handleRetryContent = (content) => {
		AntdModal.confirm({
			title: 'Xác nhận thử lại',
			content: `Bạn có chắc chắn muốn thử lại xử lý nội dung này?`,
			okText: 'Thử lại',
			okType: 'primary',
			cancelText: 'Hủy',
			onOk: async () => {
				try {
					// Thêm vào processing items
					setProcessingItems(prev => new Set([...prev, content.id]));

					// Cập nhật status thành processing
					setContentList(prev => prev.map(item =>
						item.id === content.id
							? { ...item, status: "processing" }
							: item
					));

					// Thử lại với AI
					const retryData = {
						prompt: content.prompt,
						systemMessage: content.systemMessage,
						model: content.info?.model || 'gpt-3.5-turbo',
						type: content.info?.type || 'text'
					};

					// Tạm thời tắt cấu hình AI2 cho Excalidraw
					// if (content.info?.type === 'excalidraw') {
					// 	retryData.reviewModel = content.info?.ai2Model || 'gpt-4o-mini';
					// 	retryData.reviewSystemMessage = content.info?.ai2SystemMessage;
					// }

					await processPromptWithAI(content, retryData);

				} catch (error) {
					console.error('Lỗi khi thử lại:', error);
					message.error('Không thể thử lại');
				}
			}
		});
	};

	const handleCreateNewPrompt = () => {
		setShowPromptModal(true);
	};


	const handleSavePrompt = async (promptData) => {
		try {
			setShowPromptModal(false);

			// Tạo temporary content để hiển thị trong UI (không lưu vào DB)
			const tempId = Date.now(); // Temporary ID
			const tempContent = {
				id: tempId,
				id_diagramFactory: parseInt(fileId),
				prompt: promptData.prompt,
				result: "",
				status: "processing",
				created_at: createTimestamp(),
				updated_at: createTimestamp(),
				user_create: currentUser?.email,
				user_update: currentUser?.email,
				show: true,
				systemMessage: promptData.systemMessage,
				info: {
					type: promptData.type || 'text',
					model: promptData.model || 'gpt-3.5-turbo',
					systemMessage: promptData.systemMessage,
					// Tạm thời tắt cấu hình AI2 cho Excalidraw
					// ...(promptData.type === 'excalidraw' && {
					// 	ai1Model: promptData.model,
					// 	ai1SystemMessage: promptData.systemMessage,
					// 	ai2Model: promptData.reviewModel || 'gpt-4o-mini',
					// 	ai2SystemMessage: promptData.reviewSystemMessage
					// })
				},
				isTemporary: true // Đánh dấu là temporary
			};

			// Thêm vào UI với status processing
			setContentList(prev => {
				const newList = [tempContent, ...prev];
				// Save temporary items vào localStorage
				saveTemporaryItems(newList);
				return newList;
			});
			setProcessingItems(prev => new Set([...prev, tempId]));

			message.success('Đang xử lý AI...');

			// Gọi AI API trước
			await processPromptWithAI(tempContent, promptData);

		} catch (error) {
			console.error('Lỗi khi tạo prompt:', error);
			message.error('Không thể tạo prompt mới');
		}
	};

	const processPromptWithAI = async (contentItem, promptData) => {
		try {
			let aiResponse;

			if (promptData.type === 'image') {
				// Xử lý Image type: 2 bước
				// Bước 1: Tạo ảnh với aiGen (type = "img")
				const imageResponse = await aiGen(
					promptData.prompt,
					promptData.systemMessage,
					promptData.model,
					"img" // Đổi type thành "img" cho aiGen
				);

				// Bước 2: Tạo chú thích cho ảnh
				const captionResponse = await aiGen(
					`Tạo chú thích cho ảnh này: ${promptData.prompt}`,
					promptData.captionSystemMessage || "Bạn là chuyên gia tạo chú thích ảnh. Hãy tạo chú thích ngắn gọn, súc tích cho ảnh được mô tả.",
					promptData.captionModel || promptData.model,
					"text"
				);


				// Lưu ảnh vào result, caption vào info
				const imageUrl = imageResponse.result?.image_url || imageResponse.result || imageResponse;
				const caption = captionResponse.result || captionResponse;

				aiResponse = {
					result: imageUrl,
					caption: caption // Lưu caption riêng để đưa vào info
				};

			} else if (promptData.type === 'excalidraw') {
				// Tạm thời tắt chức năng Excalidraw
				aiResponse = {
					result: { 
						type: "excalidraw", 
						version: 2, 
						elements: [], 
						appState: { viewBackgroundColor: "#ffffff" },
						message: "Chức năng Excalidraw đang được bảo trì"
					}
				};
			} else {
				// Xử lý HTML type: sử dụng aiGen2 như cũ
				aiResponse = await aiGen2(
					promptData.prompt,
					promptData.systemMessage,
					promptData.model,
				);
			}

			// Tạo data để lưu vào database với kết quả AI
			const newContentData = {
				id_diagramFactory: parseInt(fileId),
				prompt: promptData.prompt,
				result: promptData.type === 'image' 
					? (aiResponse.result.image_url || aiResponse.result || aiResponse)
					: (aiResponse.result || aiResponse),
				status: "completed",
				created_at: createTimestamp(),
				updated_at: createTimestamp(),
				user_create: currentUser?.email,
				user_update: currentUser?.email,
				show: true,
				systemMessage: promptData.systemMessage,
				info: {
					type: promptData.type || 'text',
					model: promptData.model || 'gpt-3.5-turbo',
					systemMessage: promptData.systemMessage,
					// Thêm thông tin cho Image type
					...(promptData.type === 'image' && {
						imageModel: promptData.model,
						captionModel: promptData.captionModel || promptData.model,
						captionSystemMessage: promptData.captionSystemMessage,
						caption: aiResponse.caption // Lưu caption vào info
					}),
					// Tạm thời tắt thông tin cho Excalidraw type (2 AI)
					// ...(promptData.type === 'excalidraw' && {
					// 	ai1Model: promptData.model,
					// 	ai1SystemMessage: promptData.systemMessage,
					// 	ai2Model: promptData.reviewModel || 'gpt-4o-mini',
					// 	ai2SystemMessage: promptData.reviewSystemMessage
					// })
				}
			};

			// Lưu vào database với kết quả AI
			const response = await createNewDiagramFactoryDetail(newContentData);
			if (response && response.data) {
				const savedContent = response.data;

				// Cập nhật state: thay thế temporary content bằng content đã lưu
				setContentList(prev => {
					const newList = prev.map(item =>
						item.id === contentItem.id
							? { ...savedContent, status: "completed", isTemporary: false }
							: item
					);
					// Save temporary items vào localStorage
					saveTemporaryItems(newList);
					return newList;
				});

				message.success('Xử lý hoàn thành và đã lưu!');
			}

		} catch (error) {
			console.error('Lỗi:', error);

			// Cập nhật UI với lỗi (không lưu vào database)
			setContentList(prev => prev.map(item =>
				item.id === contentItem.id
					? {
						...item,
						status: "error",
						result: error.message,
						isTemporary: true
					}
					: item
			));

			message.error('Có lỗi xảy ra khi xử lý');
		} finally {
			// Luôn xóa khỏi processing list khi hoàn thành (thành công hoặc lỗi)
			setProcessingItems(prev => {
				const newSet = new Set(prev);
				newSet.delete(contentItem.id);
				return newSet;
			});
		}
	};

	if (loading) {
		return (
			<div className={styles.contentArea}>
				<div className={styles.contentSidebar}>
					<div className={styles.sidebarHeader}>
						<h2>Lịch sử nội dung</h2>
					</div>
					<div className={styles.contentList}>
						<div className={styles.loadingState}>
							<div className={styles.loadingSpinner}></div>
							<p>Đang tải...</p>
						</div>
					</div>
				</div>
				<div className={styles.contentDetail}>
					<div className={styles.loadingState}>
						<div className={styles.loadingSpinner}></div>
						<p>Đang tải...</p>
					</div>
				</div>
			</div>
		);
	}


	return (
		<div className={styles.contentArea}>
			{/* Content Sidebar */}
			<div className={styles.contentSidebar}>
				<div className={styles.sidebarHeader}>
					<h2>Lịch sử nội dung</h2>
					<button
						className={styles.addButton}
						onClick={handleCreateNewPrompt}
					>
						+ Tạo mới
					</button>
				</div>
				<div className={styles.contentList}>
					{contentList.map((item, index) => (
						<Card
							key={item.id}
							size="small"
							hoverable
							className={`${styles.contentCard} ${contentId == item.id ? styles.selected : ''} ${processingItems.has(item.id) ? styles.processing : ''}`}
							onClick={() => handleSelectContent(item)}
							actions={isAdmin ? [
								item.status === 'error' ? (
									<Button
										key="retry"
										type="text"
										size="small"
										icon="🔄"
										onClick={(e) => {
											e.stopPropagation();
											handleRetryContent(item);
										}}
										title="Thử lại"
										disabled={processingItems.has(item.id)}
									/>
								) : null,
								<Button
									key="delete"
									type="text"
									size="small"
									danger
									icon="🗑️"
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteContent(item);
									}}
									title="Xóa nội dung"
									disabled={processingItems.has(item.id)}
								/>
							].filter(Boolean) : undefined}
						>
							<Card.Meta

								description={
									<div>
										<div style={{
											fontSize: '0.9rem',
											marginBottom: '8px',
											lineHeight: '1.4',
											display: '-webkit-box',
											WebkitLineClamp: 2,
											WebkitBoxOrient: 'vertical',
											overflow: 'hidden'
										}}>
											{item.prompt}
										</div>
										<div style={{
											display: 'flex',
											justifyContent: 'flex-end',
											marginTop: '8px',
											gap: '10px'
										}}>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<span style={{ fontSize: '0.8rem', color: '#666' }}>
													{formatDateFromTimestamp(item.created_at)}
												</span>
											</div>
											<span style={{
												padding: '2px 6px',
												borderRadius: '4px',
												fontSize: '0.7rem',
												backgroundColor: item.status === 'completed' ? '#d4edda' :
													item.status === 'processing' ? '#e3f2fd' :
														item.status === 'error' ? '#ffebee' : '#fff3cd',
												color: item.status === 'completed' ? '#155724' :
													item.status === 'processing' ? '#1976d2' :
														item.status === 'error' ? '#c62828' : '#856404'
											}}>
												{processingItems.has(item.id) ? '⏳ Đang xử lý...' : item.status}
											</span>
										</div>
									</div>
								}
							/>
						</Card>
					))}
				</div>
			</div>

			{/* Content Detail */}
			<Outlet />

			{/* Create Prompt Modal */}
			{
				showPromptModal && (
					<CreatePromptModal
						visible={showPromptModal}
						onCancel={() => setShowPromptModal(false)}
						onSave={handleSavePrompt}
					/>
				)}
		</div>
	);
}
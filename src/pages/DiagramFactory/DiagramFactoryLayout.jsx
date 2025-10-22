import { Modal as AntdModal, Button, Card, Input, message } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { createNewDiagramFactoryDetail } from '../../apis/diagramFactoryDetailService';
import { createNewDiagramFactory, deleteDiagramFactory, getAllDiagramFactory, updateDiagramFactory } from '../../apis/diagramFactoryService';
import { getSettingByType, updateSetting } from '../../apis/settingService';
import { MODEL_AI_LIST } from '../../CONST.js';
import { createTimestamp, formatDateToDDMMYYYY } from '../../generalFunction/format';
import { MyContext } from '../../MyContext.jsx';
import styles from './DiagramFactory.module.css';
import Header from './header/Header';
import ConfigTemplateModal from './modals/ConfigTemplateModal';
import CreateFileModal from './modals/CreateFileModal';

export default function DiagramFactoryLayout() {
	const { currentUser } = useContext(MyContext);
	const { fileId } = useParams();
	const navigate = useNavigate();
	
	const [showModal, setShowModal] = useState(false);
	const [showConfigModal, setShowConfigModal] = useState(false);
	const [showPromptModal, setShowPromptModal] = useState(false);
	const [configType, setConfigType] = useState('image');
	const [editingFile, setEditingFile] = useState(null);
	
	// State cho form tạo prompt
	const [promptFormData, setPromptFormData] = useState({
		prompt: '',
		systemMessage: ''
	});

	// Danh sách các file đã tạo - Load từ API
	const [createdFiles, setCreatedFiles] = useState([]);
	const [loading, setLoading] = useState(true);
	
	// Temporary items state để lưu trữ các items đang processing
	const [temporaryItems, setTemporaryItems] = useState({});

	// Template config cho từng type - Load từ API
	const [templateConfigs, setTemplateConfigs] = useState({});

	// Load settings và files từ API khi component mount
	useEffect(() => {
		loadSettings();
		loadDiagramFiles();
	}, []);

	const loadSettings = async () => {
		try {
			const settings = await getSettingByType('DIAGRAM_FACTORY');
			if (settings?.setting) {
				setTemplateConfigs(prev => ({
					image: {
						...prev.image,
						...(settings.setting.image || {})
					},
					html: {
						...prev.html,
						...(settings.setting.html || {})
					},
					excalidraw: {
						...prev.excalidraw,
						...(settings.setting.excalidraw || {})
					}
				}));
			}
		} catch (error) {
			console.error('Lỗi khi load settings:', error);
		}
	};

	const loadDiagramFiles = async () => {
		try {
			setLoading(true);
			const response = await getAllDiagramFactory();
			if (response) {
				setCreatedFiles(response);
			}
		} catch (error) {
			console.error('Lỗi khi load diagram files:', error);
			message.error('Không thể tải danh sách files');
		} finally {
			setLoading(false);
		}
	};

	const handleCreateNew = () => {
		setShowModal(true);
	};

	const handleSaveFile = async (fileData) => {
		try {
			const newFileData = {
				name: fileData.name,
				type: fileData.type,
				created_at: createTimestamp(),
				updated_at: createTimestamp(),
				content: [],
				user_create: currentUser?.email
			};
			
			const response = await createNewDiagramFactory(newFileData);
			if (response && response.data) {
				message.success('Tạo file thành công');
				loadDiagramFiles();
				// Navigate to new file
				navigate(`/diagram-factory/${response.data.id}`);
				setShowModal(false);
			}
		} catch (error) {
			console.error('Lỗi khi tạo file:', error);
			message.error('Không thể tạo file mới');
		}
	};

	const handleConfigureTemplate = () => {
		setShowConfigModal(true);
	};

	const handleSaveConfig = async (configData, type) => {
		try {
			const data = await getSettingByType('DIAGRAM_FACTORY');
			const currentSetting = data?.setting || {};

			let newConfig;
			if (type === 'image') {
				// Image type có 4 fields
				newConfig = {
					systemMessage: configData.systemMessage,
					imageModel: configData.imageModel,
					captionSystemMessage: configData.captionSystemMessage,
					captionModel: configData.captionModel
				};
			} else if (type === 'excalidraw') {
				// Excalidraw type có 2 fields
				newConfig = {
					systemMessage: configData.systemMessage,
					model: configData.model,
					reviewModel: configData.reviewModel,
					reviewSystemMessage: configData.reviewSystemMessage
				};
			} else {
				// HTML type có 2 fields
				newConfig = {
					systemMessage: configData.systemMessage,
					model: configData.model,
					description: configData.description
				};
			}

			const newSetting = {
				...currentSetting,
				[type]: newConfig
			};

			const settingData = {
				id: data.id,
				type: 'DIAGRAM_FACTORY',
				setting: newSetting
			};

			try {
				await updateSetting(settingData);
				message.success('Cấu hình đã được lưu thành công');
			} catch (updateError) {
				message.error('Lỗi khi cập nhật cấu hình');
			}

			const newConfigs = {
				...templateConfigs,
				[type]: newConfig
			};
			setTemplateConfigs(newConfigs);
			setShowConfigModal(false);
		} catch (error) {
			console.error('Lỗi khi lưu cấu hình:', error);
			message.error('Có lỗi xảy ra khi lưu cấu hình. Vui lòng thử lại.');
		}
	};

	const handleCreateNewPrompt = () => {
		if (fileId) {
			const selectedFile = createdFiles.find(f => f.id == fileId);
			if (selectedFile) {
				setPromptFormData({
					prompt: '',
					systemMessage: templateConfigs[selectedFile.type]?.systemMessage || ''
				});
				setShowPromptModal(true);
			}
		}
	};

	const handleSavePrompt = async (promptData) => {
		if (fileId) {
			try {
				const selectedFile = createdFiles.find(f => f.id == fileId);
				if (!selectedFile) return;

				// Tạo content mới trong bảng detail
				const newContentData = {
					id_diagramFactory: parseInt(fileId),
					prompt: promptData.prompt,
					result: "",
					status: "processing",
					created_at: createTimestamp(),
					updated_at: createTimestamp(),
					user_create: currentUser?.email,
					user_update: currentUser?.email,
					show: true,
					info: {
						type: selectedFile.type,
						model: templateConfigs[selectedFile.type]?.model || 'gpt-3.5-turbo',
                        systemMessage: promptData.systemMessage,
					}
				};

				const response = await createNewDiagramFactoryDetail(newContentData);
				if (response && response.data) {
					message.success('Tạo prompt thành công');
					// Thông báo cho child components có content mới
					setNewContentCreated(response.data);
				}
			} catch (error) {
				console.error('Lỗi khi tạo prompt:', error);
				message.error('Không thể tạo prompt mới');
			}
		}
		setShowPromptModal(false);
	};

	// Handler cho edit file name
	const handleEditFile = (file) => {
		setEditingFile(file);
	};

	// Handler cho save file name
	const handleSaveEditFile = async (newName) => {
		if (!editingFile || !newName.trim()) return;
		
		try {
			const updatedFile = {
				...editingFile,
				name: newName.trim(),
				updated_at: createTimestamp(),
				user_update: currentUser?.email
			};

			const response = await updateDiagramFactory(updatedFile);
			if (response && response.data) {
				message.success('Cập nhật tên file thành công');
				loadDiagramFiles();
				setEditingFile(null);
			}
		} catch (error) {
			console.error('Lỗi khi cập nhật file:', error);
			message.error('Không thể cập nhật tên file');
		}
	};

	// Handler cho delete file
	const handleDeleteFile = (file) => {
		AntdModal.confirm({
			title: 'Xác nhận xóa file',
			content: `Bạn có chắc chắn muốn xóa file "${file.name}"? Hành động này không thể hoàn tác.`,
			okText: 'Xóa',
			okType: 'danger',
			cancelText: 'Hủy',
			onOk: async () => {
				try {
					const response = await deleteDiagramFactory(file.id);
					if (response) {
						message.success('Xóa file thành công');
						loadDiagramFiles();
						// Nếu đang xem file bị xóa, navigate về list
						if (fileId == file.id) {
							navigate('/diagram-factory');
						}
					}
				} catch (error) {
					console.error('Lỗi khi xóa file:', error);
					message.error('Không thể xóa file');
				}
			}
		});
	};

	// Check quyền admin
	const isAdmin = currentUser?.isAdmin || currentUser?.isSuperAdmin;

	// Callback để thông báo cho child components khi có content mới
	const [newContentCreated, setNewContentCreated] = useState(null);

	// Context value để share data với child components
	const contextValue = {
		createdFiles,
		loading,
		templateConfigs,
		fileId,
		handleCreateNew,
		handleConfigureTemplate,
		handleCreateNewPrompt,
		handleSaveFile,
		handleSaveConfig,
		handleSavePrompt,
		configType,
		setConfigType,
		promptFormData,
		setPromptFormData,
		showModal,
		setShowModal,
		showConfigModal,
		setShowConfigModal,
		showPromptModal,
		setShowPromptModal,
		currentUser,
		newContentCreated,
		setNewContentCreated,
		temporaryItems,
		setTemporaryItems
	};

	return (
		<div className={styles.pageContainer}>
			<div className={styles.diagramFactoryHeader}>
				<Header />
			</div>

			<div className={styles.container}>
				{/* Files Sidebar - Luôn hiển thị */}
				<div className={styles.filesSidebar}>
					<div className={styles.sidebarHeader}>
						<h2>Danh sách Files</h2>
						<div className={styles.headerActions}>
							<button
								className={styles.configIconButton}
								onClick={handleConfigureTemplate}
								title="Cấu hình Template"
							>
								⚙️
							</button>
							<button
								className={styles.addButton}
								onClick={handleCreateNew}
							>
								+ Tạo mới
							</button>
						</div>
					</div>

					<div className={styles.fileList}>
						{loading ? (
							<div className={styles.loadingState}>
								<div className={styles.loadingSpinner}></div>
								<p>Đang tải danh sách files...</p>
							</div>
						) : createdFiles.length === 0 ? (
							<div className={styles.emptyState}>
								<div className={styles.emptyIcon}>📁</div>
								<h3>Chưa có file nào</h3>
								<p>Nhấn "Tạo mới" để bắt đầu</p>
							</div>
						) : (
							createdFiles.map(file => (
								<Card
									key={file.id}
									size="small"
									hoverable
									className={`${styles.fileCard} ${fileId == file.id ? styles.selected : ''}`}
									onClick={() => navigate(`/diagram-factory/${file.id}`)}
									actions={isAdmin ? [
										<Button
											key="edit"
											type="text"
											size="small"
											icon="✏️"
											onClick={(e) => {
												e.stopPropagation();
												handleEditFile(file);
											}}
											title="Sửa tên"
										/>,
										<Button
											key="delete"
											type="text"
											size="small"
											danger
											icon="🗑️"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteFile(file);
											}}
											title="Xóa file"
										/>
									] : undefined}
								>
									<Card.Meta
										avatar={
											<div className={styles.fileIcon}>
												{file.type === 'image' ? '🎨' : file.type === 'excalidraw' ? '✏️' : '🌐'}
											</div>
										}
										title={
											editingFile?.id === file.id ? (
												<Input
													defaultValue={file.name}
													size="small"
													onBlur={(e) => handleSaveEditFile(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															handleSaveEditFile(e.target.value);
														} else if (e.key === 'Escape') {
															setEditingFile(null);
														}
													}}
													autoFocus
													onClick={(e) => e.stopPropagation()}
												/>
											) : (
												file.name
											)
										}
										description={
											<div>
												<div className={styles.fileType}>
													{file.type === 'image' ? 'Image Generator' : file.type === 'excalidraw' ? 'Excalidraw Generator' : 'HTML Generator'}
												</div>
												<div className={styles.fileDate}>
													{formatDateToDDMMYYYY(file.updated_at)}
												</div>
											</div>
										}
									/>
								</Card>
							))
						)}
					</div>
				</div>

				{/* Outlet cho Content Sidebar + Main Content */}
				<Outlet context={contextValue} />
			</div>

			{/* Modal tạo file mới */}
			<CreateFileModal
				visible={showModal}
				onCancel={() => setShowModal(false)}
				onSave={handleSaveFile}
			/>

			{/* Modal cấu hình template */}
			<ConfigTemplateModal
				visible={showConfigModal}
				onCancel={() => setShowConfigModal(false)}
				onSave={handleSaveConfig}
				templateConfigs={templateConfigs}
				configType={configType}
				setConfigType={setConfigType}
			/>

		</div>
	);
}

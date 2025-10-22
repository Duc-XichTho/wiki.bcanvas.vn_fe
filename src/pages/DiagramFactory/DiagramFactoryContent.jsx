import { Card } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDiagramFactoryDetailDataById } from '../../apis/diagramFactoryDetailService';
import { formatDateToDDMMYYYY } from '../../generalFunction/format';
import { MyContext } from '../../MyContext.jsx';
// import ExcalidrawViewer from './ExcalidrawViewer'; // Tạm thời tắt
import styles from './DiagramFactory.module.css';

export default function DiagramFactoryContent() {
	const { fileId, contentId } = useParams();
	const navigate = useNavigate();
	const { currentUser } = useContext(MyContext);
	const [selectedContent, setSelectedContent] = useState(null);
	const [loading, setLoading] = useState(true);
	
	const isAdmin = currentUser?.isAdmin || currentUser?.isSuperAdmin;

	// Load content detail khi có contentId
	useEffect(() => {
		if (contentId) {
			loadContentDetail();
		}
	}, [contentId]);

	const loadContentDetail = async () => {
		try {
			setLoading(true);
			const response = await getDiagramFactoryDetailDataById(contentId);
			if (response ) {
				setSelectedContent(response);
			}
		} catch (error) {
			console.error('Lỗi khi load content detail:', error);
		} finally {
			setLoading(false);
		}
	};


	if (loading) {
		return (
			<div className={styles.contentDetail}>
				<div className={styles.loadingState}>
					<div className={styles.loadingSpinner}></div>
					<p>Đang tải...</p>
				</div>
			</div>
		);
	}

	if (!selectedContent) {
		return (
			<div className={styles.contentDetail}>
				<div className={styles.emptyState}>
					<p>Chọn một nội dung để xem chi tiết</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.contentDetail}>
			{/* Header với thông tin và actions */}
			<div className={styles.contentHeader}>
				<div className={styles.headerLeft}>
					<h2>Chi tiết nội dung</h2>
					<div className={styles.metaInfo}>
						<span className={styles.contentDate}>
							{formatDateToDDMMYYYY(selectedContent?.created_at)}
						</span>
						<span className={styles.separator}>•</span>
						<span className={`${styles.statusTag} ${styles[selectedContent.status]}`}>
							{selectedContent.status === 'completed' ? '✅ Hoàn thành' :
							 selectedContent.status === 'processing' ? '⏳ Đang xử lý' :
							 selectedContent.status === 'error' ? '❌ Lỗi' : selectedContent.status}
						</span>
					</div>
				</div>
		
			</div>

			{/* Content Body */}
			<div className={styles.contentBody}>
				{/* Prompt Section */}
			

				{/* System Message Section */}
				{selectedContent.systemMessage && (
					<Card 
						title="⚙️ System Message" 
						size="small" 
						className={styles.sectionCard}
						headStyle={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
					>
						<div className={styles.systemMessageText}>
							{selectedContent.systemMessage}
						</div>
					</Card>
				)}

				{/* Info Section */}
				{selectedContent.info && (
					<Card 
						title="ℹ️ Thông tin cấu hình" 
						size="small" 
						className={styles.sectionCard}
						headStyle={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
					>
						<div className={styles.infoGrid}>
							<div className={styles.infoItem}>
								<span className={styles.infoLabel}>Type:</span>
								<span className={styles.infoValue}>
									{selectedContent.info.type === 'image' ? '🎨 Image Generator' : selectedContent.info.type === 'excalidraw' ? '🎨 Excalidraw Generator' : '🌐 HTML Generator'}
								</span>
							</div>
							<div className={styles.infoItem}>
								<span className={styles.infoLabel}>Model:</span>
								<span className={styles.infoValue}>{selectedContent.info.model}</span>
							</div>
						</div>
					</Card>
				)}

				{/* Result Section */}
				<Card 
					title="🎯 Kết quả" 
					size="small" 
					className={styles.sectionCard}
					headStyle={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
				>
					<div className={styles.resultContent}>
						{selectedContent.result ? (
							selectedContent.info?.type === 'html' ? (
								<div className={styles.htmlContainer}>
									<iframe
										srcDoc={selectedContent.result}
										title="Generated HTML"
										className={styles.htmlPreview}
									/>
								</div>
							) : selectedContent.info?.type === 'excalidraw' ? (
								<div style={{ 
									padding: '20px', 
									border: '1px solid #e8e8e8', 
									borderRadius: '8px',
									backgroundColor: '#fafafa',
									textAlign: 'center'
								}}>
									<h3>Excalidraw Viewer (Tạm thời tắt)</h3>
									<p>Chức năng Excalidraw đang được bảo trì</p>
									<pre style={{ 
										backgroundColor: '#f5f5f5', 
										padding: '10px', 
										borderRadius: '4px',
										fontSize: '12px',
										overflow: 'auto',
										maxHeight: '200px'
									}}>
										{JSON.stringify(selectedContent.result, null, 2)}
									</pre>
								</div>
							) : (
								<div className={styles.imageContainer}>
									<img 
										src={selectedContent.result} 
										alt="Generated Image" 
										className={styles.generatedImage}
									/>
								</div>
							)
						) : (
							<div className={styles.noResult}>
								<div className={styles.noResultIcon}>📭</div>
								<p>Chưa có kết quả</p>
							</div>
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}
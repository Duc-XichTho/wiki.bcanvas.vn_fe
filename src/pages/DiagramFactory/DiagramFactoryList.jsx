import React from 'react';
import { useOutletContext } from 'react-router-dom';
import styles from './DiagramFactory.module.css';

export default function DiagramFactoryList() {
	const { createdFiles, loading } = useOutletContext();

	return (
		<>
			{/* Content Sidebar - Empty State */}
			<div className={styles.contentSidebar}>
				<div className={styles.sidebarHeader}>
					<h2>Lịch sử nội dung</h2>
				</div>
				<div className={styles.contentList}>
					<div className={styles.emptyContent}>
						<div className={styles.emptyIcon}>📝</div>
						<p>Chọn file để xem lịch sử</p>
					</div>
				</div>
			</div>

			{/* Main Content - Empty State */}
			<div className={styles.mainContent}>
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}>📁</div>
					<h2>Chọn một file để bắt đầu</h2>
					<p>Chọn file từ sidebar hoặc tạo file mới</p>
				</div>
			</div>
		</>
	);
}

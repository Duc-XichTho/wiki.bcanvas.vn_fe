import React from 'react';
import { Image, Avatar } from 'antd';
import styles from '../K9.module.css';
import { FileList } from '../../../components/PreviewFile';
import { Paperclip } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const NewsItem = ({
					  item,
					  expandedItem,
					  showDetailId,
					  onItemClick,
					  onShowDetail,
					  onOpenSource,
					  isBookmarked = false,
					  onToggleBookmark,
				  }) => {
	const getCategoryLabel = (category) => {
		switch (category) {
			case 'economy':
				return 'Kinh tế';
			case 'world':
				return 'Thế giới';
			case 'politics':
				return 'Chính trị';
			case 'tech':
				return 'Công nghệ';
			case 'culture':
				return 'Văn hóa';
			default:
				return category;
		}
	};

	const getTimeAgo = (createdAt) => {
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

	return (<div
		className={`${styles.newsItem} ${item.impact !== 'important' ? styles.noImpact : ''} ${isBookmarked ? styles.hasBookmark : ''}`}
        onClick={(e) => onShowDetail(item, e)}
	>
		{/* Avatar on the left */}
		{item.avatarUrl && (<div className={styles.avatarWrapper}>
			<img src={item.avatarUrl} />
		</div>)}
		<div
			className={`${styles.newsContent}`}
		>
			<div className={styles.newsTitle}>
				{item.title}
				<div className={styles.newsActions}>
					<button
						className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
						title={isBookmarked ? 'Bỏ bookmark' : 'Thêm bookmark'}
						onClick={(e) => {
							e.stopPropagation();
							onToggleBookmark(item);
						}}
					>
						{isBookmarked ? '🔖' : '📖'}
					</button>
					{item.source && (
						<button className={styles.actionBtn} title="Đến nguồn" onClick={(e) => onOpenSource(item, e)}>
							🔗
						</button>)}
				</div>
			</div>
			{/* Always expanded by default, so show expanded content */}
			<div className={styles.newsExpandedContent}>
				<div className={styles.newsSummary}>{item.summary}</div>

				{/* Video Section - Hiển thị đầu tiên */}
				{item.videoUrl && (<div
					className={styles.newsVideoSection}
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
					<video
						controls
						onClick={(e) => {
							e.stopPropagation();
						}}
						style={{
							width: '100%',
							maxWidth: '500px',
							height: 'auto',
							borderRadius: '8px',
							marginBottom: '20px',
						}}
					>
						<source src={item.videoUrl} type="video/mp4" />
						<source src={item.videoUrl} type="video/webm" />
						<source src={item.videoUrl} type="video/ogg" />
						Trình duyệt của bạn không hỗ trợ video.
					</video>
				</div>)}

				{/* Display files if available */}
				{item.fileUrls && Array.isArray(item.fileUrls) && item.fileUrls.length > 0 && (
					<div style={{ marginTop: '12px', marginBottom: '12px' }}>
						<FileList
							fileUrls={item.fileUrls}
							title="File đính kèm"
							showCount={true}
						/>
					</div>)}

				<div className={styles.newsMeta}>
					{item.impact === 'important' &&
						<span className={styles.impactIcon} style={{ marginLeft: 6 }}></span>}
					<span className={styles.categoryTag}>
                      <span className={styles.categoryEmoji}>
                        {item.emoji}
                      </span>
						{getCategoryLabel(item.category)}
                     </span>
					<span className={styles.newsTime}>
                      {getTimeAgo(item.createdAt)}
                    </span>
					{item.source && <span className={styles.newsSource}>| {item.source}</span>}
					{/* Hiển thị indicator có media trong meta */}
					{item.videoUrl && (<span style={{ color: '#8c8c8c', fontSize: '12px' }}> • 🎥 Có video</span>)}
					{item.imgUrls && item.imgUrls.length > 0 && (<span
						style={{ color: '#8c8c8c', fontSize: '12px' }}> • 🖼️ {item.imgUrls.length} ảnh</span>)}
					{item.fileUrls && Array.isArray(item.fileUrls) && item.fileUrls.length > 0 && (
						<span className={styles.fileIndicator} title={`${item.fileUrls.length} file đính kèm`}>
              <Paperclip size={12} />
							{item.fileUrls.length}
            </span>)}
					{/* Move important icon to the end, same level as category and time */}
				</div>
				{showDetailId === item.id && item.detail && (<div className={styles.newsDetail}>
					<div
						className={styles.markdownContent}
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(marked.parse(item.detail || '')),
						}}
					/>
				</div>)}

				{/* Images Section - Hiển thị cuối cùng */}
				{item.imgUrls && Array.isArray(item.imgUrls) && item.imgUrls.length > 0 && (<div
					className={styles.newsImagesSection}
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
					<div style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
						gap: '10px',
						marginTop: '10px',
					}}>
						{item.imgUrls.map((url, index) => (<div
							key={index}
							style={{ position: 'relative' }}
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							<Image
								src={url}
								alt={`Hình ${index + 1}`}
								style={{
									width: '100%',
									height: '150px',
									objectFit: 'cover',
									borderRadius: '8px',
									cursor: 'pointer',
									transition: 'transform 0.2s',
								}}
								onClick={(e) => {
									e.stopPropagation();
								}}
								onMouseOver={(e) => {
									e.target.style.transform = 'scale(1.05)';
								}}
								onMouseOut={(e) => {
									e.target.style.transform = 'scale(1)';
								}}
								preview={{
									mask: <div style={{ fontSize: '16px' }}>🔍 Xem</div>,
									onVisibleChange: (visible) => {
										// Prevent event bubbling when closing preview
										if (!visible) {
											setTimeout(() => {
												const previewMask = document.querySelector('.ant-image-preview-mask');
												if (previewMask) {
													previewMask.onclick = (e) => {
														e.stopPropagation();
													};
												}
											}, 0);
										}
									},
								}}
								placeholder={<div style={{
									width: '100%',
									height: '150px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									backgroundColor: '#f0f0f0',
									borderRadius: '8px',
								}}>
									Loading...
								</div>}
							/>
						</div>))}
					</div>
				</div>)}
			</div>
		</div>
	</div>);
};

export default NewsItem;

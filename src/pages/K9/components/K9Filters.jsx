import React from 'react';
import styles from '../K9.module.css';
import { Bookmark, Star } from 'lucide-react';
import { Search } from 'lucide-react';

const K9Filters = ({
					   filters,
					   onFilterChange,
					   onSearchChange,
					   filterConfig,
					   activeTab,
					   showBookmarkFilter = false,
					   onBookmarkFilterChange,
					   bookmarkFilter = 'all',
					   showImportantFilter = false,
					   filteredCount = 0,
					   totalCount = 0,
					   categoryCounts = [],
				   }) => {
	const { searchPlaceholder, categories, showTimeFilter = false, showSentimentFilter = false } = filterConfig;

	return (
		<div className={styles.filters}>
			<div className={styles.filterRow}>
				<div className={styles.searchContainer}>
					<div  className={styles.searchContainer2}>
						<Search size={20} />
						<input
							type="text"
							placeholder={searchPlaceholder}
							value={filters.search}
							onChange={onSearchChange}
							style={{ width: '180px' }}
						/>
					</div>
					<div style={{ display: 'flex', justifyContent: 'end', gap: 5 }}>

						{showBookmarkFilter && (
							<button
								className={`${styles.bookmarkBtn} ${bookmarkFilter === 'bookmarked' ? styles.active : ''}`}
								onClick={() => onBookmarkFilterChange(bookmarkFilter === 'bookmarked' ? 'all' : 'bookmarked')}
								title={bookmarkFilter === 'bookmarked' ? 'Hiển thị tất cả' : 'Chỉ hiển thị đã bookmark'}
							>
								<Bookmark size={16} />
							</button>
						)}
						{showImportantFilter && (
							<button
								className={`${styles.importantBtn} ${filters.filter === 'important' ? styles.active : ''}`}
								onClick={() => onFilterChange('filter', filters.filter === 'important' ? 'all' : 'important')}
								title={filters.filter === 'important' ? 'Hiển thị tất cả' : 'Chỉ hiển thị tin quan trọng'}
							>
								Quan trọng
							</button>
						)}
					</div>
				</div>
			</div>

			{showTimeFilter && (
				<div className={styles.filterRow}>
					<div className={styles.filterLabel}>Thời gian</div>
					<div className={styles.filterButtons}>
						{[
							{ key: 'all', label: 'Tất cả' },
							{ key: 'today', label: 'Hôm nay' },
							{ key: 'yesterday', label: 'Hôm qua' },
							{ key: 'week', label: 'Tuần qua' },
						].map(time => (
							<button
								key={time.key}
								className={`${styles.filterBtn} ${filters.time === time.key ? styles.active : ''}`}
								onClick={() => onFilterChange('time', time.key)}
							>
								{time.label}
							</button>
						))}
					</div>
					<select
						className={styles.filterSelect}
						value={filters.time}
						onChange={(e) => onFilterChange('time', e.target.value)}
					>
						{[
							{ key: 'all', label: 'Tất cả' },
							{ key: 'today', label: 'Hôm nay' },
							{ key: 'yesterday', label: 'Hôm qua' },
							{ key: 'week', label: 'Tuần qua' },
						].map(time => (
							<option key={time.key} value={time.key}>
								{time.label}
							</option>
						))}
					</select>
				</div>
			)}

			<div className={styles.filterRow}>
				<div className={styles.filterButtons}>
					{categories.map(cat => {
						const countObj = Array.isArray(categoryCounts)
							? categoryCounts.find(c => c.key === cat.key)
							: (categoryCounts && categoryCounts[cat.key]);
						const count = countObj ? (countObj.count ?? countObj) : 0;
						if (cat.key !== 'all' && count === 0) return null;
						return (
							<button
								key={cat.key}
								className={`${styles.filterBtn} ${filters.category === cat.key ? styles.active : ''}`}
								onClick={() => onFilterChange('category', cat.key)}
							>
								<span className={styles.chipCountInBtn}>{count}</span>
								{cat.label}
							</button>
						);
					})}
				</div>
				<select
					className={styles.filterSelect}
					value={filters.category}
					onChange={(e) => onFilterChange('category', e.target.value)}
				>
					{categories.map(cat => {
						const countObj = Array.isArray(categoryCounts)
							? categoryCounts.find(c => c.key === cat.key)
							: (categoryCounts && categoryCounts[cat.key]);
						const count = countObj ? (countObj.count ?? countObj) : 0;
						if (cat.key !== 'all' && count === 0) return null;
						return (
							<option key={cat.key} value={cat.key} style={{ width: 100, fontSize: 14 }}>
								{`(${count}) ${cat.label}`}
							</option>
						);
					})}
				</select>
			</div>


			{/* Sentiment filter - only for stream tab */}
			{/*{activeTab === 'stream' && (*/}
			{/*	<div className={styles.filterRow}>*/}
			{/*		<div className={styles.filterLabel}>Sentiment</div>*/}
			{/*		<div className={styles.filterButtons}>*/}
			{/*			{[*/}
			{/*				{ key: 'all', label: 'Tất cả' },*/}
			{/*				{ key: 'positive', label: 'Tích cực' },*/}
			{/*				{ key: 'negative', label: 'Tiêu cực' },*/}
			{/*				{ key: 'neutral', label: 'Trung tính' },*/}
			{/*			].map(filter => (*/}
			{/*				<button*/}
			{/*					key={filter.key}*/}
			{/*					className={`${styles.filterBtn} ${filters.filter === filter.key ? styles.active : ''}`}*/}
			{/*					onClick={() => onFilterChange('filter', filter.key)}*/}
			{/*				>*/}
			{/*					{filter.label}*/}
			{/*				</button>*/}
			{/*			))}*/}
			{/*		</div>*/}
			{/*		<select*/}
			{/*			className={styles.filterSelect}*/}
			{/*			value={filters.filter}*/}
			{/*			onChange={(e) => onFilterChange('filter', e.target.value)}*/}
			{/*		>*/}
			{/*			{[*/}
			{/*				{ key: 'all', label: 'Tất cả' },*/}
			{/*				{ key: 'positive', label: 'Tích cực' },*/}
			{/*				{ key: 'negative', label: 'Tiêu cực' },*/}
			{/*				{ key: 'neutral', label: 'Trung tính' },*/}
			{/*			].map(filter => (*/}
			{/*				<option key={filter.key} value={filter.key}>*/}
			{/*					{filter.label}*/}
			{/*				</option>*/}
			{/*			))}*/}
			{/*		</select>*/}
			{/*	</div>*/}
			{/*)}*/}
		</div>
	);
};

export default K9Filters;

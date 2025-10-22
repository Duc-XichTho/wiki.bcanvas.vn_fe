import React, { useState, useEffect, useContext } from 'react';
import { MyContext } from '../../../MyContext';
import {getCurrentUserLogin, updateUser} from '../../../apis/userService';
import styles from '../K9.module.css';
import K9Filters from './K9Filters';
import NewsItem from './NewsItem';

const NewsTab = ({ 
  loading, 
  filteredNews, 
  filters, 
  expandedItem, 
  showDetailId,
  onFilterChange, 
  onSearchChange, 
  onItemClick, 
  onShowDetail, 
  onOpenSource,
  activeTab,
  totalCount = 0,
  newsItems = []
}) => {

  // Bookmark states
  const [bookmarkedItems, setBookmarkedItems] = useState([]);
  const [bookmarkFilter, setBookmarkFilter] = useState('all');

  // Load bookmarked items from user info
  const fetchFavorites = async () => {
    try {
      const user = (await getCurrentUserLogin()).data;
      setBookmarkedItems(user.info?.bookmarks_stream || []);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu bookmark:', error);
      setBookmarkedItems([]);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);


  // Bookmark functions
  const handleToggleBookmark = async (item) => {
    try {
      const itemId = item.id;
      const currentBookmarks = bookmarkedItems || [];
      const isCurrentlyBookmarked = currentBookmarks.includes(itemId);
      
      let newBookmarkedItems;
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        newBookmarkedItems = currentBookmarks.filter(id => id !== itemId);
      } else {
        // Add bookmark
        newBookmarkedItems = [...currentBookmarks, itemId];
      }
      
      setBookmarkedItems(newBookmarkedItems);
      
      // Update user info in database
      const user = (await getCurrentUserLogin()).data;

      if (user && user.email) {
        await updateUser(user.email, {
          info: {
            ...user.info,
            bookmarks_stream: newBookmarkedItems
          }
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert state if update fails
      setBookmarkedItems(bookmarkedItems || []);
    }
  };

  const handleBookmarkFilterChange = (value) => {
    setBookmarkFilter(value);
  };

  // Filter news based on bookmark filter
  const getFilteredNewsWithBookmark = () => {
    if (bookmarkFilter === 'bookmarked') {
      return filteredNews.filter(item => (bookmarkedItems || []).includes(item.id));
    }
    return filteredNews;
  };

  // Get current filtered count
  const getCurrentFilteredCount = () => {
    return getFilteredNewsWithBookmark().length;
  };

  // Lấy danh sách đã lọc theo các điều kiện khác, KHÔNG filter theo category
  const getNewsListForCategoryCount = () => {
    let list = newsItems.filter(item => item.status === 'published');
    if (bookmarkFilter === 'bookmarked') {
      list = list.filter(item => (bookmarkedItems || []).includes(item.id));
    }
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      list = list.filter(item => {
        const searchableText = `${item.title} ${item.summary || ''} ${item.description || ''} ${item.detail || ''}`.toLowerCase();
        return searchableText.includes(searchTerm);
      });
    }
    // Các filter khác (time, filter) nếu muốn áp dụng vào count thì thêm ở đây
    return list;
  };

  // Tính số lượng từng danh mục đúng logic
  const getCategoryCounts = () => {
    const list = getNewsListForCategoryCount();
    return filterConfig.categories.map(cat => ({
      key: cat.key,
      label: cat.label,
      count: cat.key === 'all'
        ? list.length
        : list.filter(item => item.category === cat.key).length
    }));
  };

  const filterConfig = {
    searchPlaceholder: "Nhập từ khóa...",
    categories: [
      { key: 'all', label: 'Tất cả' },
      { key: 'Lý thuyết (Theory)', label: 'Lý thuyết (Theory)' },
      { key: 'Khái niệm (Concept)', label: 'Khái niệm (Concept)' },
      { key: 'Nguyên tắc kinh doanh (Principle)', label: 'Nguyên tắc kinh doanh (Principle)' },
      { key: 'Khung phân tích (Framework)', label: 'Khung phân tích (Framework)' },
      { key: 'Mô hình (Business model)', label: 'Mô hình (Business model)' },
      { key: 'Phương pháp luận (Methodology)', label: 'Phương pháp luận (Methodology)' },
      { key: 'Công cụ & kỹ thuật (Tools & Technique)', label: 'Công cụ & kỹ thuật (Tools & Technique)' },
      { key: 'Các báo cáo ngành - vĩ mô', label: 'Các báo cáo ngành - vĩ mô' },
      { key: 'Best Practices', label: 'Best Practices' },
      { key: 'Case Studies', label: 'Case Studies' },
      { key: 'Tài nguyên khác', label: 'Tài nguyên khác' }
    ],
    showTimeFilter: false,
    showSentimentFilter: false
  };

  return (
    <div className={styles.tabContent}>
      <K9Filters 
        filters={filters}
        onFilterChange={onFilterChange}
        onSearchChange={onSearchChange}
        filterConfig={filterConfig}
        activeTab={activeTab}
        showBookmarkFilter={true}
        onBookmarkFilterChange={handleBookmarkFilterChange}
        bookmarkFilter={bookmarkFilter}
        showImportantFilter={true}
        filteredCount={getCurrentFilteredCount()}
        totalCount={totalCount}
        categoryCounts={getCategoryCounts()}
      />
      <div className={styles.newsPanel}>
        {loading ? (
          <div className={styles.emptyState}>
            <div>Đang tải dữ liệu...</div>
          </div>
        ) : getFilteredNewsWithBookmark().length === 0 ? (
          <div className={styles.emptyState}>
            <div>Không tìm thấy tin tức phù hợp</div>
          </div>
        ) : (
          getFilteredNewsWithBookmark().map(item => (
            <NewsItem
              key={item.id}
              item={item}
              expandedItem={item.id}
              showDetailId={showDetailId}
              // onItemClick={onItemClick} // Remove expansion logic
              onShowDetail={onShowDetail}
              onOpenSource={onOpenSource}
              isBookmarked={(bookmarkedItems || []).includes(item.id)}
              onToggleBookmark={handleToggleBookmark}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NewsTab; 

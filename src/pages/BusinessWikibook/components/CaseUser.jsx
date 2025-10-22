import DOMPurify from 'dompurify';
import { marked } from 'marked';
import React, { useContext, useEffect, useState } from 'react';
import { Modal } from 'antd';
import { getCurrentUserLogin, updateUser } from '../../../apis/userService';
import styles from './CaseUser.module.css';
import NewsItem from './NewsItem';
import QuizCaseCreateComponent from './QuizCaseCreateComponent.jsx';
import { MyContext } from '../../../MyContext.jsx';
// import { getAllCasePublicByUser } from '../../../apis/casePublicService.jsx';
import Toolbar from './Toolbar';
import SettingsModal from './SettingsModal';
import AddCaseModal from './AddCaseModal';

const CaseUser = ({
  selectedProgram,
  loading,
  filteredNews,
  filters,
  showDetailId,
  onFilterChange,
  onSearchChange,
  onItemClick,
  onShowDetail,
  onOpenSource,
  activeTab,
  totalCount = 0,
  newsItems = [],
  isHome = false, // Thêm prop isHome với default false
}) => {

  // Bookmark states
  const [bookmarkedItems, setBookmarkedItems] = useState([]);
  const [bookmarkFilter, setBookmarkFilter] = useState('all');

  // Read states (tick functionality)
  const [readItems, setReadItems] = useState([]);
  const [readFilter, setReadFilter] = useState('all');

  // Quiz status filter state: 'all' | 'completed' | 'incomplete'
  const [quizStatusFilter, setQuizStatusFilter] = useState('all');

  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [questionScoreMap, setQuestionScoreMap] = useState({});
  const [caseUser, setCaseUser] = useState([]);
  const { currentUser, setCurrentUser } = useContext(MyContext);

  // Toolbar states
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [caseToCopy, setCaseToCopy] = useState(null); // Thêm state cho case cần copy

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchUserData = async (currentUser) => {
    try {
      if (currentUser && currentUser.id) {
        try {
          const histories = await getAllCasePublicByUser({ where: { user_id: currentUser.id, show: true } });
          setCaseUser(histories);
        } catch (err) {
          console.error('Lỗi khi lấy lịch sử quiz:', err);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu user:', error);

    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserData(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    if (caseUser && caseUser.length > 0) {
      if (caseUser[0]) {
        setSelectedItem(caseUser[0]);
        // Trigger onShowDetail if available with a mock event
        if (onShowDetail) {
          const mockEvent = {
            stopPropagation: () => { }
          };
          onShowDetail(caseUser[0], mockEvent);
        }
      }
    }
  }, [caseUser]);

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

      if (user && user.id) {
        await updateUser(user.id, {
          info: {
            ...user.info,
            bookmarks_stream: newBookmarkedItems,
          },
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert state if update fails
      setBookmarkedItems(bookmarkedItems || []);
    }
  };

  // Read functions (tick functionality)
  const handleToggleRead = async (item) => {
    try {
      const itemId = item.id;
      const currentReadItems = readItems || [];
      const isCurrentlyRead = currentReadItems.includes(itemId);

      let newReadItems;
      if (isCurrentlyRead) {
        // Mark as unread
        newReadItems = currentReadItems.filter(id => id !== itemId);
      } else {
        // Mark as read
        newReadItems = [...currentReadItems, itemId];
      }

      setReadItems(newReadItems);

      // Update user info in database
      const user = (await getCurrentUserLogin()).data;

      if (user && user.id) {
        await updateUser(user.id, {
          info: {
            ...user.info,
            read_items_stream: newReadItems,
          },
        });
      }
    } catch (error) {
      console.error('Error toggling read status:', error);
      // Revert state if update fails
      setReadItems(readItems || []);
    }
  };

  // Handle item selection
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    if (isMobile) {
      setShowMobileModal(true);
    }
  };

  // Close mobile modal
  const closeMobileModal = () => {
    setShowMobileModal(false);
    setSelectedItem(null);
  };

  // Toolbar handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // You can add search logic here
  };

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
  };

  const handleOpenAdd = () => {
    setShowAddModal(true);
    setCaseToCopy(null); // Reset case to copy
  };

  const handleCloseAdd = () => {
    setShowAddModal(false);
    setCaseToCopy(null); // Reset case to copy
  };

  // Handler cho copy case
  const handleCopyCase = (caseItem) => {
    setCaseToCopy(caseItem);
    setShowAddModal(true);
  };

  const handleAddCaseSubmit = (formData) => {
    setCaseUser([formData, ...caseUser]);
    handleCloseAdd();
  };

  // Filter news based on bookmark and read filters
  const getFilteredNewsWithFilters = () => {
    let filtered = filteredNews;

    if (selectedProgram && selectedProgram !== 'all') {
      filtered = filtered.filter(item => {
        if (!Array.isArray(item.tag4)) return false; // bỏ qua nếu không phải mảng
        return item.tag4.includes(selectedProgram);
      });
    }

    // Apply bookmark filter
    if (bookmarkFilter === 'bookmarked') {
      filtered = filtered.filter(item => (bookmarkedItems || []).includes(item.id));
    }

    // Apply read filter
    if (readFilter === 'read') {
      filtered = filtered.filter(item => (readItems || []).includes(item.id));
    } else if (readFilter === 'unread') {
      filtered = filtered.filter(item => !(readItems || []).includes(item.id));
    }

    // Apply quiz status filter (>60 completed)
    if (quizStatusFilter === 'completed') {
      filtered = filtered.filter(item => {
        const score = questionScoreMap[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return !isNaN(n) && n >= 60;
      });
    } else if (quizStatusFilter === 'incomplete') {
      filtered = filtered.filter(item => {
        const score = questionScoreMap[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return isNaN(n) || n < 60;
      });
    }

    return filtered;
  };

  // Render content panel
  const renderContentPanel = (item) => {
    if (!item) return null;

    return (
      <div className={styles.contentPanel}>
        {/*<div className={styles.contentHeader}>*/}
        {/*  <span className={styles.contentTitle}>{item.title}</span>*/}
        {/*</div>*/}

        {/*{(item.coverImage || item.avatarUrl) && (*/}
        {/*  <div className={styles.coverImageContainer}>*/}
        {/*    <img*/}
        {/*      src={item.coverImage || item.avatarUrl}*/}
        {/*      alt={item.title}*/}
        {/*      className={styles.coverImageDetail}*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*)}*/}

        <div className={styles.contentBody}>
          {item.detail && (
            <div className={styles.contentDetail}>
              <div
                className={styles.markdownContent}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(item.detail || '')),
                }}
              />
            </div>
          )}

          {/* Quiz Component - Hiển thị cuối cùng khi xem chi tiết */}
          {item.questionContent && (
            <QuizCaseCreateComponent
              quizData={item.questionContent?.questionContent}
              questionId={item.id}
              onScoreUpdate={(qid, score) => setQuestionScoreMap(prev => ({ ...prev, [qid]: score }))}
            />
          )}
        </div>
      </div>
    );
  };



  // Render empty state with guidance
  const renderEmptyState = () => {
    return (
      <div className={styles.emptyStateContainer}>
        <div className={styles.emptyStateContent}>
          <div className={styles.emptyStateIcon}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#1890ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="#1890ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="#1890ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className={styles.emptyStateTitle}>Chưa có case nào được tạo</h3>
          <p className={styles.emptyStateDescription}>
            Bắt đầu tạo case đầu tiên để xây dựng bộ sưu tập tình huống thực tế của bạn
          </p>
          <div className={styles.emptyStateActions}>
            <button
              className={styles.createCaseButton}
              onClick={handleOpenAdd}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tạo case đầu tiên
            </button>
          </div>
          <div className={styles.emptyStateFeatures}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>💼</div>
              <div className={styles.featureText}>
                <strong>Case Study Thực Tế</strong>
                <span>Xây dựng bộ sưu tập tình huống từ công việc hàng ngày</span>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🧠</div>
              <div className={styles.featureText}>
                <strong>Phân Tích & Đánh Giá</strong>
                <span>Ghi chép chi tiết cách xử lý và kết quả đạt được</span>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🎓</div>
              <div className={styles.featureText}>
                <strong>Học Từ Kinh Nghiệm</strong>
                <span>Rút ra bài học và áp dụng cho các tình huống tương lai</span>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>📊</div>
              <div className={styles.featureText}>
                <strong>Quiz Tương Tác</strong>
                <span>Tạo câu hỏi để kiểm tra và củng cố kiến thức</span>
              </div>
            </div>
            
          </div>
        </div>
        <AddCaseModal
          isMobile={isMobile}
          currentUser={currentUser}
          isOpen={showAddModal}
          onClose={handleCloseAdd}
          onSubmit={handleAddCaseSubmit}
        />
      </div>
    );
  };

  if (caseUser.length === 0) {
    return renderEmptyState();
  }

  return (
    <div className={styles.tabContent}>
      {/* Chỉ hiển thị K9Filters khi không phải là Home tab */}
      {/*{!isHome && (*/}
      {/*  <K9Filters*/}
      {/*    filters={filters}*/}
      {/*    onFilterChange={onFilterChange}*/}
      {/*    onSearchChange={onSearchChange}*/}
      {/*    filterConfig={filterConfig}*/}
      {/*    activeTab={activeTab}*/}
      {/*    showBookmarkFilter={true}*/}
      {/*    onBookmarkFilterChange={handleBookmarkFilterChange}*/}
      {/*    bookmarkFilter={bookmarkFilter}*/}
      {/*    showReadFilter={true}*/}
      {/*    onReadFilterChange={handleReadFilterChange}*/}
      {/*    readFilter={readFilter}*/}
      {/*    showImportantFilter={true}*/}
      {/*    showQuizStatusFilter={true}*/}
      {/*    onQuizStatusFilterChange={handleQuizStatusFilterChange}*/}
      {/*    quizStatusFilter={quizStatusFilter}*/}
      {/*    filteredCount={getCurrentFilteredCount()}*/}
      {/*    totalCount={totalCount}*/}
      {/*    categoryCounts={getCategoryCounts()}*/}
      {/*    newsItems={newsItems}*/}
      {/*    onItemSelect={handleItemSelectFromDropdown}*/}
      {/*    onResetAllFilters={handleResetAllFilters}*/}
      {/*    filteredNews={filteredNews}*/}
      {/*  />*/}
      {/*)}*/}

      {isMobile ? (
        // Mobile view: Single panel with modal
        <div className={styles.newsPanel}>
          <Toolbar
            currentUser={currentUser}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onOpenSettings={handleOpenSettings}
            onOpenAdd={handleOpenAdd}
          />
          {loading ? (
            <div className={styles.loadingState}>
              <div>Đang tải dữ liệu...</div>
            </div>
          ) : caseUser.length === 0 ? (
            <div className={styles.emptyState}>
              <div>Không tìm thấy tin tức phù hợp</div>
            </div>
          ) : (
            caseUser.map(item => (
              <NewsItem
                key={item.id}
                item={(item)}
                expandedItem={item.id}
                showDetailId={showDetailId}
                onItemClick={() => handleItemSelect(item)}
                onShowDetail={onShowDetail}
                onOpenSource={onOpenSource}
                isBookmarked={(bookmarkedItems || []).includes(item.id)}
                onToggleBookmark={handleToggleBookmark}
                isRead={(readItems || []).includes(item.id)}
                onToggleRead={handleToggleRead}
                quizScore={questionScoreMap[item.id]}
                data-item-id={item.id}
                isHome={true}
                isCase={true}
              />
            ))
          )}
          <Modal
            open={showMobileModal}
            onCancel={closeMobileModal}
            footer={null}
            width={'100%'}
            destroyOnClose={true}
            maskClosable={true}
            closable={true}
            centered={true}
            className={styles.modalContent}
          >
            {renderContentPanel(selectedItem)}
          </Modal>
        </div>
      ) : (
        // Desktop view: Dual panel
        <div className={styles.dualPanelContainer}>
          <div className={styles.leftPanel}>
            <Toolbar
              currentUser={currentUser}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onOpenSettings={handleOpenSettings}
              onOpenAdd={handleOpenAdd}
            />
            {loading ? (
              <div className={styles.emptyState}>
                <div>Đang tải dữ liệu...</div>
              </div>
            ) : caseUser.length === 0 ? (
              <div className={styles.emptyState}>
                <div>Không tìm thấy tin tức phù hợp</div>
              </div>
            ) : (
              <div className={styles.caseUserList}>
                {caseUser.map(item => (
                  <NewsItem
                    key={item.id}
                    item={item}
                    expandedItem={item.id}
                    showDetailId={showDetailId}
                    onItemClick={() => handleItemSelect(item)}
                    onShowDetail={onShowDetail}
                    onOpenSource={onOpenSource}
                    isBookmarked={(bookmarkedItems || []).includes(item.id)}
                    onToggleBookmark={handleToggleBookmark}
                    isRead={(readItems || []).includes(item.id)}
                    onToggleRead={handleToggleRead}
                    isSelected={selectedItem?.id === item.id}
                    quizScore={questionScoreMap[item.id]}
                    data-item-id={item.id}
                    isHome={true}
                    isCase={true}
                    onCopyCase={handleCopyCase}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.rightPanel}>
            {selectedItem ? (
              renderContentPanel(selectedItem)
            ) : (
              <div className={styles.emptyContentState}>
                <div className={styles.emptyContentIcon}>📰</div>
                <h3>Chọn một bài viết để xem nội dung</h3>
                <p>Nhấp vào bất kỳ bài viết nào ở bên trái để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render modals */}
      <SettingsModal
        isMobile={isMobile}
        isOpen={showSettingsModal}
        onClose={handleCloseSettings}
      />
      <AddCaseModal
        isMobile={isMobile}
        currentUser={currentUser}
        isOpen={showAddModal}
        onClose={handleCloseAdd}
        onSubmit={handleAddCaseSubmit}
        existingCases={caseUser}
        caseToCopy={caseToCopy}
      />
    </div>
  );
};

export default CaseUser;

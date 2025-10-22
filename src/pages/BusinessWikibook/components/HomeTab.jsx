import DOMPurify from 'dompurify';
import { marked } from 'marked';
import React, { useEffect, useState, useRef } from 'react';
import { Modal, Image } from 'antd';
// import { getListQuestionHistoryByUser } from '../../../apis/questionHistoryService.jsx';
import { getCurrentUserLogin, updateUser } from '../../../apis/userService';
import styles from '../K9.module.css';
import newsTabStyles from './NewsTab.module.css';
import K9Filters from './K9Filters';
import NewsItem from './NewsItem';
// import QuizComponent from './QuizComponent.jsx';
import HomeItem from './HomeItem.jsx';
import { getK9Id } from '../../../apis/serviceApi/hongKyService.jsx';
import ShareButton from './ShareButton.jsx';
import PreviewFileModal from '../../../components/PreviewFile/PreviewFileModal';

const HomeTab = ({
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
                   onShare,
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

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const contentPanelRef = useRef(null);

  // File preview modal states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Persist filters to localStorage
  const NEWS_FILTERS_KEY = 'k9_news_filters_v1';
  const NEWS_PARENT_FILTERS_KEY = 'k9_news_parent_filters_v1';

  // Animation effect when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setIsAnimating(true);

      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 800); // Match the longest animation duration

      return () => clearTimeout(timer);
    }
  }, [selectedItem?.id]);

  // Load filters from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NEWS_FILTERS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          if (saved.bookmarkFilter) setBookmarkFilter(saved.bookmarkFilter);
          if (saved.readFilter) setReadFilter(saved.readFilter);
          if (saved.quizStatusFilter) setQuizStatusFilter(saved.quizStatusFilter);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      const toSave = {
        bookmarkFilter,
        readFilter,
        quizStatusFilter,
      };
      localStorage.setItem(NEWS_FILTERS_KEY, JSON.stringify(toSave));
    } catch (e) {
      // ignore
    }
  }, [bookmarkFilter, readFilter, quizStatusFilter]);

  // Persist parent-provided filters (search/category/time/filter)
  useEffect(() => {
    try {
      localStorage.setItem(NEWS_PARENT_FILTERS_KEY, JSON.stringify(filters || {}));
    } catch (e) {
      // ignore
    }
  }, [filters]);

  // Restore parent-provided filters on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NEWS_PARENT_FILTERS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          if (saved.time) onFilterChange('time', saved.time);
          if (saved.category) onFilterChange('category', saved.category);
          if (saved.filter) onFilterChange('filter', saved.filter);
          if (typeof saved.search === 'string') {
            onSearchChange({ target: { value: saved.search } });
          }
        }
      }
    } catch (e) {
      // ignore
    }
    // we only want to run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load bookmarked, read items, and quiz history scores
  const fetchUserData = async () => {
    try {
      const user = (await getCurrentUserLogin()).data;
      setBookmarkedItems(user.info?.bookmarks_stream || []);
      setReadItems(user.info?.read_items_stream || []);

      // Fetch all quiz histories for this user and build score map
      // if (user && user.id) {
      //   try {
      //     const histories = await getListQuestionHistoryByUser({ where: { user_id: user.id } });
      //     if (Array.isArray(histories)) {
      //       const map = histories.reduce((acc, h) => {
      //         const qid = h.question_id ?? h.questionId ?? h.idQuestion;
      //         if (!qid) return acc;
      //         const prev = acc[qid];
      //         // Choose the latest by updated_at/created_at
      //         const currTime = new Date(h.updated_at || h.created_at || 0).getTime();
      //         const prevTime = prev ? new Date(prev.updated_at || prev.created_at || 0).getTime() : -1;
      //         if (!prev || currTime >= prevTime) {
      //           acc[qid] = h;
      //         }
      //         return acc;
      //       }, {});
      //       const scoreMap = Object.fromEntries(
      //           Object.entries(map).map(([qid, hist]) => {
      //             const raw = hist.score;
      //             const num = typeof raw === 'number' ? raw : parseFloat(raw);
      //             return [qid, isNaN(num) ? undefined : num];
      //           })
      //       );
      //       setQuestionScoreMap(scoreMap);
      //     } else {
      //       setQuestionScoreMap({});
      //     }
      //   } catch (err) {
      //     console.error('Lỗi khi lấy lịch sử quiz:', err);
      //     setQuestionScoreMap({});
      //   }
      // }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu user:', error);
      setBookmarkedItems([]);
      setReadItems([]);
      setQuestionScoreMap({});
    }
  };

  // Status is rendered as a separate pill in NewsItem, not appended to title

  useEffect(() => {
    fetchUserData();
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

      if (user && user.id) {
        await updateUser(user.id, {
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
            read_items_stream: newReadItems
          }
        });
      }
    } catch (error) {
      console.error('Error toggling read status:', error);
      // Revert state if update fails
      setReadItems(readItems || []);
    }
  };

  const handleBookmarkFilterChange = (value) => {
    setBookmarkFilter(value);
  };

  const handleReadFilterChange = (value) => {
    setReadFilter(value);
  };

  const handleQuizStatusFilterChange = (value) => {
    setQuizStatusFilter(value);
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

  // Handle item selection from dropdown
  const handleItemSelectFromDropdown = (itemId, event) => {
    // Find the item from the complete newsItems list
    const item = newsItems.find(item => item.id === itemId);
    if (item) {
      // Set as selected item
      setSelectedItem(item);

      // Show detail content
      if (onShowDetail) {
        onShowDetail(item, event);
      }

      // If mobile, open modal
      if (isMobile) {
        setShowMobileModal(true);
      }

      // Wait a bit for the category filter to update and DOM to re-render
      setTimeout(() => {
        // Scroll to the item in the sidebar
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        console.log('Looking for item:', itemId, 'Found:', !!itemElement);
        if (itemElement) {
          itemElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Add highlight effect
          itemElement.style.backgroundColor = '#e6f7ff';
          setTimeout(() => {
            itemElement.style.backgroundColor = '';
          }, 2000);
        } else {
          // If not found, try again after a longer delay
          setTimeout(() => {
            const retryElement = document.querySelector(`[data-item-id="${itemId}"]`);
            console.log('Retry looking for item:', itemId, 'Found:', !!retryElement);
            if (retryElement) {
              retryElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
              retryElement.style.backgroundColor = '#e6f7ff';
              setTimeout(() => {
                retryElement.style.backgroundColor = '';
              }, 2000);
            }
          }, 1000);
        }
      }, 500);
    }
  };

  // Filter news based on bookmark and read filters
  const getFilteredNewsWithFilters = () => {
    let filtered = filteredNews;

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

  // Get current filtered count
  const getCurrentFilteredCount = () => {
    return getFilteredNewsWithFilters().length;
  };

  // Lấy danh sách đã lọc theo các điều kiện khác, KHÔNG filter theo category
  const getNewsListForCategoryCount = () => {
    let list = newsItems.filter(item => item.status === 'published');

    // Apply bookmark filter
    if (bookmarkFilter === 'bookmarked') {
      list = list.filter(item => (bookmarkedItems || []).includes(item.id));
    }

    // Apply read filter
    if (readFilter === 'read') {
      list = list.filter(item => (readItems || []).includes(item.id));
    } else if (readFilter === 'unread') {
      list = list.filter(item => !(readItems || []).includes(item.id));
    }

    // Apply quiz status filter (>60 completed)
    if (quizStatusFilter === 'completed') {
      list = list.filter(item => {
        const score = questionScoreMap[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return !isNaN(n) && n >= 60;
      });
    } else if (quizStatusFilter === 'incomplete') {
      list = list.filter(item => {
        const score = questionScoreMap[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return isNaN(n) || n < 60;
      });
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
      { key: 'Tư duy & Kỹ năng', label: 'Tư duy & Kỹ năng' },
      { key: 'Mô hình & Công cụ ứng dụng', label: 'Mô hình & Công cụ ứng dụng' },
      // { key: 'Lý thuyết (Theory)', label: 'Lý thuyết (Theory)' },
      // { key: 'Khái niệm (Concept)', label: 'Khái niệm (Concept)' },
      // { key: 'Nguyên tắc kinh doanh (Principle)', label: 'Nguyên tắc kinh doanh (Principle)' },
      // { key: 'Khung phân tích (Framework)', label: 'Khung phân tích (Framework)' },
      // { key: 'Mô hình (Business model)', label: 'Mô hình (Business model)' },
      // { key: 'Phương pháp luận (Methodology)', label: 'Phương pháp luận (Methodology)' },
      // { key: 'Công cụ & kỹ thuật (Tools & Technique)', label: 'Công cụ & kỹ thuật (Tools & Technique)' },
      // { key: 'Các báo cáo ngành - vĩ mô', label: 'Các báo cáo ngành - vĩ mô' },
      // { key: 'Best Practices', label: 'Best Practices' },
      // { key: 'Case Studies', label: 'Case Studies' },
      // { key: 'Tài nguyên khác', label: 'Tài nguyên khác' }
    ],
    showTimeFilter: false,
    showSentimentFilter: false
  };

  // Helper function to get file icon based on extension
  const getFileIcon = (extension) => {
    const iconMap = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📽️',
      pptx: '📽️',
      txt: '📄',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎥',
      avi: '🎥',
      mov: '🎥',
      mp3: '🎵',
      wav: '🎵',
      zip: '📦',
      rar: '📦',
      '7z': '📦'
    };
    return iconMap[extension] || '📄';
  };

  // Helper function to open file preview
  const openFilePreview = (fileUrl, fileName) => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    setPreviewFile({
      url: fileUrl,
      name: fileName,
      extension: fileExtension
    });
    setPreviewModalVisible(true);
  };

  // Render content panel
  const renderSkeleton = () => (
      <div className={`${styles.contentPanel} ${newsTabStyles.contentPanel}`}>
        <div className={`${styles.contentHeader} ${newsTabStyles.contentHeader}`}>
          <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`} style={{ width: '70%' }}></div>
          <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`} style={{ width: '20%' }}></div>
        </div>

        <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonImage}`}></div>

        <div className={`${styles.contentBody} ${newsTabStyles.contentBody}`}>
          <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`}></div>
          <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`}></div>
          <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`} style={{ width: '80%' }}></div>
        </div>
      </div>
  );

  // Render content panel
  const renderContentPanel = (item) => {
    if (!item) return null;
    // Show skeleton while animating
    if (isAnimating) {
      return renderSkeleton();
    }

    return (
        <div
            ref={contentPanelRef}
            className={`${styles.contentPanel} ${newsTabStyles.contentPanel}`}
        >
          <div className={`${styles.contentHeader} ${newsTabStyles.contentHeader}`}>
            <span className={`${styles.contentTitle} ${newsTabStyles.contentTitle}`}>{item.title}</span>
            <span style={{ fontSize: '16px', color: '#6b7280', fontWeight: '500', marginLeft: '10px' }}>ID: {item.id}</span>
            <ShareButton onShare={() => onShare(selectedItem)} />
          </div>

          {/* File URLs Section */}
          {item.fileUrls && item.fileUrls.length > 0 && (
              <div className={`${styles.fileTagsContainer} ${newsTabStyles.fileTagsContainer}`}>
                {item.fileUrls.map((fileUrl, index) => {
                  const fileName = fileUrl.split('/').pop() || `file-${index + 1}`;
                  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

                  return (
                      <div
                          key={index}
                          className={`${styles.fileTag} ${newsTabStyles.fileTag}`}
                          onClick={() => openFilePreview(fileUrl, fileName)}
                          title={fileName}
                      >
                  <span className={`${styles.fileTagIcon} ${newsTabStyles.fileTagIcon}`}>
                    {getFileIcon(fileExtension)}
                  </span>
                        <span className={`${styles.fileTagName} ${newsTabStyles.fileTagName}`}>
                    {fileName}
                  </span>
                        <span className={`${styles.fileTagExtension} ${newsTabStyles.fileTagExtension}`}>
                    {fileExtension.toUpperCase()}
                  </span>
                      </div>
                  );
                })}
              </div>
          )}

          {/*{(item.avatarUrl || item.summary) && (*/}
          {/*    <div className={`${styles.valueSection} ${newsTabStyles.valueSection}`}>*/}
          {/*      /!* <h3 className={`${styles.valueSectionTitle} ${newsTabStyles.valueSectionTitle}`}>*/}
          {/*        WHAT / WHY*/}
          {/*      </h3> *!/*/}
          {/*      <div className={`${styles.valueSectionContent} ${newsTabStyles.valueSectionContent}`}>*/}
          {/*        {*/}
          {/*            item.summary && (*/}
          {/*                <div className={`${styles.valueSummary} ${newsTabStyles.valueSummary}`}>*/}
          {/*                  {item.summary}*/}
          {/*                </div>*/}
          {/*            )*/}
          {/*        }*/}
          {/*        {*/}
          {/*            item.avatarUrl && (*/}
          {/*                <div className={`${styles.valueImage} ${newsTabStyles.valueImage}`}>*/}
          {/*                  <Image*/}
          {/*                      src={item.avatarUrl}*/}
          {/*                      alt={item.title}*/}
          {/*                      className={`${styles.coverImageDetail} ${newsTabStyles.coverImageDetail}`}*/}
          {/*                  />*/}
          {/*                </div>*/}
          {/*            )*/}
          {/*        }*/}

          {/*      </div>*/}
          {/*    </div>*/}
          {/*)}*/}
          {/* Diagram Section */}
          {(item.diagramUrl || item.diagramHtmlCode || item.diagramNote) && (
              <div className={`${styles.valueSection} ${newsTabStyles.valueSection}`}>
                {/* <h3 className={`${styles.valueSectionTitle} ${newsTabStyles.valueSectionTitle}`}>
                  INFOGRAM - BẢN VẼ TRỰC QUAN HÓA
                </h3> */}
                <div className={`${styles.diagramSectionContent} ${newsTabStyles.diagramSectionContent}`}>
                  {/* Handle HTML Code Diagrams */}
                  {item.diagramHtmlCode && Array.isArray(item.diagramHtmlCode) && (
                      item.diagramHtmlCode.map((htmlCode, index) => (
                          <div key={`html-${index}`}>
                            <div className={`${styles.diagramHtmlCode} ${newsTabStyles.diagramHtmlCode}`}>
                              <div
                                  dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(htmlCode || ''),
                                  }}
                              />
                            </div>
                          </div>
                      ))
                  )}

                  {/* Handle Kroki Image Diagrams */}
                  {item.diagramUrl && (
                      Array.isArray(item.diagramUrl) ? (
                          item.diagramUrl.map((diagramUrl, index) => (
                              <div key={`kroki-${index}`} style={{ marginBottom: '20px' }}>
                                <div className={`${styles.diagramImage} ${newsTabStyles.diagramImage}`}>
                                  <Image
                                      src={diagramUrl}
                                      alt={`Diagram ${index + 1}`}
                                      className={`${styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
                                      preview={{
                                        mask: 'Xem ảnh',
                                        maskClassName: 'custom-mask'
                                      }}
                                  />
                                </div>
                                {/* Show corresponding note if available */}
                                {Array.isArray(item.diagramNote) && item.diagramNote.length > 0 && item.diagramNote[index] && (
                                    <div className={`${styles.diagramNote} ${newsTabStyles.diagramNote}`}>
                                      <div
                                          className={styles.markdownContent}
                                          dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(marked.parse(item.diagramNote[index] || '')),
                                          }}
                                      />
                                    </div>
                                )}
                              </div>
                          ))
                      ) : (
                          /* Handle single diagram (backward compatibility) */
                          <>
                            <div className={`${styles.diagramImage} ${newsTabStyles.diagramImage}`}>
                              <Image
                                  src={item.diagramUrl}
                                  alt="Diagram"
                                  className={`${styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
                                  preview={{
                                    mask: 'Xem ảnh',
                                    maskClassName: 'custom-mask'
                                  }}
                              />
                            </div>
                            {item.diagramNote && (
                                <div className={`${styles.diagramNote} ${newsTabStyles.diagramNote}`}>
                                  <div
                                      className={styles.markdownContent}
                                      dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(marked.parse(
                                            Array.isArray(item.diagramNote)
                                                ? item.diagramNote[0] || ''
                                                : item.diagramNote || ''
                                        )),
                                      }}
                                  />
                                </div>
                            )}
                          </>
                      )
                  )}
                </div>
              </div>
          )}

          <div className={`${styles.contentBody} ${newsTabStyles.contentBody}`}>
            {item.detail && (
                <div className={`${styles.contentDetail} ${newsTabStyles.contentDetail}`}>
                  <div
                      className={styles.markdownContent}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked.parse(item.detail || '')),
                      }}
                  />
                </div>
            )}


            {/* Quiz Component - Hiển thị cuối cùng khi xem chi tiết */}
            {/*{item.questionContent && (*/}
            {/*    <QuizComponent*/}
            {/*        quizData={item.questionContent}*/}
            {/*        questionId={item.id}*/}
            {/*        onScoreUpdate={(qid, score) => setQuestionScoreMap(prev => ({ ...prev, [qid]: score }))}*/}
            {/*    />*/}
            {/*)}*/}
          </div>
        </div>
    );
  };

  const fetchItem = async (id) => {
    const item = await getK9Id(id);
    if (item) {
      setSelectedItem(item);
      setShowMobileModal(true);
      setTimeout(() => {
        const targetElement = document.querySelector(`[data-item-id="${id}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100); // Small delay to ensure the item is rendered
      return;
    }
  }

  // Auto-select first item when newsItems changes or on mount
  useEffect(() => {
    if (expandedItem) {
      fetchItem(expandedItem)
    }
    if (!isMobile && newsItems && newsItems.length > 0 && !selectedItem) {
      const firstItem = getFilteredNewsWithFilters()[0];
      if (firstItem) {
        setSelectedItem(firstItem);
        // Trigger onShowDetail if available with a mock event
        if (onShowDetail) {
          const mockEvent = {
            stopPropagation: () => { }
          };
          onShowDetail(firstItem, mockEvent);
        }
      }
    }

  }, [newsItems, filteredNews, bookmarkFilter, readFilter, quizStatusFilter, questionScoreMap, selectedItem, expandedItem, isMobile]);

  return (
      <div className={styles.tabContent}>
        <PreviewFileModal
            open={previewModalVisible}
            onClose={() => setPreviewModalVisible(false)}
            fileUrl={previewFile?.url}
            fileName={previewFile?.name}
            title={previewFile ? `${getFileIcon(previewFile.extension)} ${previewFile.name}` : 'Preview File'}
        />
        {/* Chỉ hiển thị K9Filters khi không phải là Home tab */}
        {!isHome && (
            <K9Filters
                filters={filters}
                onFilterChange={onFilterChange}
                onSearchChange={onSearchChange}
                filterConfig={filterConfig}
                activeTab={activeTab}
                showBookmarkFilter={true}
                onBookmarkFilterChange={handleBookmarkFilterChange}
                bookmarkFilter={bookmarkFilter}
                showReadFilter={true}
                onReadFilterChange={handleReadFilterChange}
                readFilter={readFilter}
                showImportantFilter={true}
                showQuizStatusFilter={true}
                onQuizStatusFilterChange={handleQuizStatusFilterChange}
                quizStatusFilter={quizStatusFilter}
                filteredCount={getCurrentFilteredCount()}
                totalCount={totalCount}
                categoryCounts={getCategoryCounts()}
                newsItems={newsItems}
                onItemSelect={handleItemSelectFromDropdown}
            />
        )}

        {isMobile ? (
            // Mobile view: Single panel with modal
            <div className={styles.newsPanel}>
              {loading ? (
                  <div className={styles.emptyState}>
                    <div>Đang tải dữ liệu...</div>
                  </div>
              ) : getFilteredNewsWithFilters().length === 0 ? (
                  <div className={styles.emptyState}>
                    <div>Không tìm thấy tin tức phù hợp</div>
                  </div>
              ) : (
                  getFilteredNewsWithFilters().map(item => (
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
                      />
                  ))
              )}
              <Modal
                  open={showMobileModal && selectedItem}
                  onCancel={closeMobileModal}
                  footer={null}
                  width={'100%'}
                  style={{
                    top: '10'
                  }}
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
                {loading ? (
                    <div className={styles.emptyState}>
                      <div>Đang tải dữ liệu...</div>
                    </div>
                ) : getFilteredNewsWithFilters().length === 0 ? (
                    <div className={styles.emptyState}>
                      <div>Không tìm thấy tin tức phù hợp</div>
                    </div>
                ) : (
                    getFilteredNewsWithFilters().map(item => (
                        <HomeItem
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
                        />
                    ))
                )}
              </div>

              <div className={styles.rightPanelHome}>
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
      </div>
  );
};

export default HomeTab;

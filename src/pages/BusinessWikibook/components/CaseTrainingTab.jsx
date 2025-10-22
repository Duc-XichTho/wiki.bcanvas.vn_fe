import { FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { Menu } from 'lucide-react';

import { Button, Empty, Image, Input, Modal, Popover, Select, Space, Spin, Tag, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import styles from './CaseTrainingTab.module.css';
import newsTabStyles from './NewsTab.module.css';
// import QuizComponent from './QuizComponent.jsx';
// import { InfoMore_Icon } from '../../../icon/IconSvg.jsx';
import { getK9ByCidType, getK9Id , getSettingByTypeExternal} from '../../../apis/serviceApi/hongKyService.jsx';
import ShareButton from './ShareButton.jsx';
import PreviewFileModal from '../../../components/PreviewFile/PreviewFileModal';

const { Option } = Select;
const { Text, Title } = Typography;
const CaseTrainingTab = ({
  parseURLParams,
  applyURLState,
  selectedProgram,
  tag4Filter,
  loading,
  filteredCaseTraining,
  filters,
  expandedItem,
  showDetailId,
  onFilterChange,
  onSearchChange,
  onItemClick,
  onShowDetail,
  onOpenSource,
  activeTab,
  totalCount,
  caseTrainingItems,
  tag1Options: propTag1Options,
  tag2Options: propTag2Options,
  tag3Options: propTag3Options,
  onShare,
  showSearchSection = true
}) => {
  const [localFilters, setLocalFilters] = useState({
    tag1: [],
    tag2: [],
    tag3: [],
    search: '',
    impact: 'all',
    quizStatus: 'all'
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null); // Track which dropdown is open
  const [showHoverPopup, setShowHoverPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [hoveredItemId, setHoveredItemId] = useState(null);

  // State for CID source info
  const [cidSourceInfo, setCidSourceInfo] = useState([]);

  // Local state for tag options
  const [tag1Options, setTag1Options] = useState([]);
  const [tag2Options, setTag2Options] = useState([]);
  const [tag3Options, setTag3Options] = useState([]);
  // Quiz score state
  const [quizScores, setQuizScores] = useState({});

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const contentPanelRef = useRef(null);
  const markdownContentRef = useRef(null);

  // File preview modal states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // State for category expansion
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Table of Contents sidebar states
  const [showTOCSidebar, setShowTOCSidebar] = useState(false);
  const [headings, setHeadings] = useState([]);
  const [activeHeadingIndex, setActiveHeadingIndex] = useState(-1);


  // Persist filters for CaseTraining
  const CASE_FILTERS_KEY = 'k9_case_training_filters_v1';

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

  // Extract headings when selectedItem changes
  useEffect(() => {
    if (selectedItem && selectedItem.detail) {
      const extractedHeadings = extractHeadings(selectedItem.detail);
      setHeadings(extractedHeadings);
      setActiveHeadingIndex(-1); // Reset active heading
    } else {
      setHeadings([]);
      setActiveHeadingIndex(-1);
    }
  }, [selectedItem]);

  // Helper function to format time ago (same as NewsItem.jsx)
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

  // Extract headings from markdown content
  const extractHeadings = (content) => {
    if (!content) return [];

    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const extractedHeadings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();

      extractedHeadings.push({
        level,
        text
      });
    }

    return extractedHeadings;
  };

  // Scroll to heading by index
  const scrollToHeading = (headingIndex) => {
    // Set active heading
    setActiveHeadingIndex(headingIndex);

    // Use the markdown content ref directly
    const markdownContent = markdownContentRef.current;
    if (!markdownContent) {
      return;
    }

    const headings = markdownContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const element = headings[headingIndex];

    if (element) {
      // Remove previous highlight
      headings.forEach(h => h.classList.remove(newsTabStyles.headingHighlight));

      // Add highlight to current heading
      element.classList.add(newsTabStyles.headingHighlight);

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    } else {
      console.log('Element not found at index:', headingIndex);
    }
  };

  // Toggle TOC sidebar
  const toggleTOCSidebar = () => {
    setShowTOCSidebar(!showTOCSidebar);
  };

  // Load saved filters on mount and propagate to parent
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CASE_FILTERS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          setLocalFilters(prev => ({ ...prev, ...saved }));
          // Push to parent handlers so K9 keeps in sync
          Object.entries(saved).forEach(([k, v]) => {
            if (['tag1', 'tag2', 'tag3', 'search', 'impact', 'quizStatus'].includes(k)) {
              onFilterChange(k, v);
            }
          });
          if (typeof saved.search === 'string') {
            onSearchChange({ target: { value: saved.search } });
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save filters when they change
  useEffect(() => {
    try {
      localStorage.setItem(CASE_FILTERS_KEY, JSON.stringify(localFilters));
    } catch (e) {
      // ignore
    }
  }, [localFilters]);

  useEffect(() => {
    // Merge filters prop with local defaults, ensuring impact is always 'all' by default
    const mergedFilters = {
      tag1: [],
      tag2: [],
      tag3: [],
      search: '',
      impact: 'all',
      quizStatus: 'all',
      ...filters
    };
    setLocalFilters(mergedFilters);
  }, [filters]);

  // Load tag options from settings
  useEffect(() => {
    loadTagOptions();
  }, []);


  // Load quiz scores from localStorage
  useEffect(() => {
    const savedQuizScores = localStorage.getItem('caseTrainingQuizScores');
    if (savedQuizScores) {
      try {
        const parsedScores = JSON.parse(savedQuizScores);
        setQuizScores(parsedScores);
      } catch (error) {
        console.error('❌ Error parsing quiz scores from localStorage:', error);
      }
    }
  }, []);

  const fetchCidSourceInfo = async (cid) => {
    const data = await getK9ByCidType(cid, 'news');
    if (data) {
      setCidSourceInfo(data);
    } else {
      setCidSourceInfo([]);
    }
  }

  const fetchItem = async (id) => {
    const item = await getK9Id(id);
    if (item) {
      setSelectedItem(item);
      fetchCidSourceInfo(item.cid);
      setShowMobileModal(true);

      // Scroll to the specific item in the sidebar list
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

  useEffect(() => {
    if (expandedItem) {
      fetchItem(expandedItem)
    }
    if (!isMobile && caseTrainingItems && caseTrainingItems.length > 0) {
      const firstItem = getFilteredItems()[0];
      if (firstItem) {
        setSelectedItem(firstItem);
        fetchCidSourceInfo(firstItem.cid);
        // Trigger onShowDetail if available with a mock event
        if (onShowDetail) {
          const mockEvent = {
            stopPropagation: () => { }
          };
          onShowDetail(firstItem, mockEvent);
        }
      }
    }
  }, [caseTrainingItems, selectedProgram, expandedItem, isMobile]);


  // Load tag options from settings
  const loadTagOptions = async () => {
    try {

      // Load TAG1_OPTIONS (Categories)
      const tag1Setting = await getSettingByTypeExternal('TAG1_OPTIONS');


      if (tag1Setting?.setting && Array.isArray(tag1Setting.setting) && tag1Setting.setting.length > 0) {
        setTag1Options(tag1Setting.setting);
      } else {
        // Set default options if none exist
        const defaultTag1Options = [
          { value: 'Business Strategy', label: 'Business Strategy' },
          { value: 'Marketing', label: 'Marketing' },
          { value: 'Finance', label: 'Finance' },
          { value: 'Operations', label: 'Operations' },
          { value: 'Technology', label: 'Technology' },
          { value: 'Leadership', label: 'Leadership' },
          { value: 'Innovation', label: 'Innovation' },
          { value: 'Customer Experience', label: 'Customer Experience' }
        ];
        setTag1Options(defaultTag1Options);
      }

      // Load TAG2_OPTIONS (Levels)
      const tag2Setting = await getSettingByTypeExternal('TAG2_OPTIONS');


      if (tag2Setting?.setting && Array.isArray(tag2Setting.setting) && tag2Setting.setting.length > 0) {
        setTag2Options(tag2Setting.setting);
      } else {
        // Set default options if none exist
        const defaultTag2Options = [
          { value: 'Beginner', label: 'Beginner' },
          { value: 'Intermediate', label: 'Intermediate' },
          { value: 'Advanced', label: 'Advanced' },
          { value: 'Expert', label: 'Expert' },
          { value: 'Case Study', label: 'Case Study' },
          { value: 'Tool', label: 'Tool' }
        ];
        setTag2Options(defaultTag2Options);
      }

      // Load TAG3_OPTIONS (Series)
      const tag3Setting = await getSettingByTypeExternal('TAG3_OPTIONS');

      if (tag3Setting?.setting && Array.isArray(tag3Setting.setting) && tag3Setting.setting.length > 0) {
        setTag3Options(tag3Setting.setting);
      } else {
        // Set default options if none exist
        const defaultTag3Options = [
          { value: 'Industry', label: 'Industry' },
          { value: 'Startup', label: 'Startup' },
          { value: 'Enterprise', label: 'Enterprise' },
          { value: 'SME', label: 'SME' },
          { value: 'Global', label: 'Global' },
          { value: 'Local', label: 'Local' },
          { value: 'Digital', label: 'Digital' },
          { value: 'Traditional', label: 'Traditional' }
        ];
        setTag3Options(defaultTag3Options);
      }
    } catch (error) {
      console.error('❌ Error loading tag options:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      // Set default options on error
      setTag1Options([
        { value: 'Business Strategy', label: 'Business Strategy' },
        { value: 'Marketing', label: 'Marketing' },
        { value: 'Finance', label: 'Finance' },
        { value: 'Operations', label: 'Operations' }
      ]);
      setTag2Options([
        { value: 'Beginner', label: 'Beginner' },
        { value: 'Intermediate', label: 'Intermediate' },
        { value: 'Advanced', label: 'Advanced' },
        { value: 'Expert', label: 'Expert' }
      ]);
      setTag3Options([
        { value: 'Industry', label: 'Industry' },
        { value: 'Startup', label: 'Startup' },
        { value: 'Enterprise', label: 'Enterprise' },
        { value: 'SME', label: 'SME' }
      ]);
    }
  };

  // Use local state (from settings) if available, otherwise use prop options
  const finalTag1Options = tag1Options.length > 0 ? tag1Options : (propTag1Options || []);
  const finalTag2Options = tag2Options.length > 0 ? tag2Options : (propTag2Options || []);
  const finalTag3Options = tag3Options.length > 0 ? tag3Options : (propTag3Options || []);

  // Debug log for final options



  // Render quiz status function - giống hệt NewsItem.jsx
  const renderQuizStatus = (item) => {
    if (!item) return null;
    if (item.questionContent === undefined || item.questionContent === null) {
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: '#E9FBFF',
            color: '#88B7CD',
            border: '1px solid #9ED5D8',
          }}
          title='Tham khảo'
        >
          Tham khảo
        </span>
      );
    }
    const quizScore = quizScores[item.id];

    if (quizScore === undefined || quizScore === null) {
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: '#FFE9ED',
            color: '#E39191',
            border: '1px solid #F3B2B2',
          }}
          title='Chưa làm'
        >
          Chưa làm
        </span>);
    }
    const numeric = Number(quizScore);
    const pass = !isNaN(numeric) && numeric >= 60;
    return (
      <span
        style={{
          marginLeft: 8,
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: pass ? '#E5F6DD' : '#E9EEFF',
          color: pass ? '#75C341' : '#7A8ED7',
          border: pass ? '1px solid #9FDE7D' : '1px solid #B9C4F7',
        }}
        title={'Đạt ' + numeric + '/' + 100}
      >
        {'Đạt ' + numeric + '/' + 100}
      </span>
    );
  };

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the dropdown menu and not on a dropdown item
      if (!event.target.closest(`.${styles.dropdownMenu}`) &&
        !event.target.closest(`.${styles.dropdownToggle}`)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...localFilters,
      [filterType]: value,
    };
    setLocalFilters(newFilters);
    onFilterChange(filterType, value);
  };

  const handleTagToggle = (filterType, tagValue) => {
    const currentTags = localFilters[filterType] || [];
    const newTags = currentTags.includes(tagValue)
      ? currentTags.filter(tag => tag !== tagValue)
      : [...currentTags, tagValue];

    const newFilters = {
      ...localFilters,
      [filterType]: newTags,
    };
    setLocalFilters(newFilters);
    onFilterChange(filterType, newTags);
  };

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setLocalFilters(prev => ({
      ...prev,
      search: searchTerm,
    }));
    onSearchChange(e);
  };


  // Toggle dropdown for a tag
  const toggleDropdown = (tagType, tagValue, event) => {
    event.stopPropagation();
    const dropdownKey = `${tagType}-${tagValue}`;
    setDropdownOpen(dropdownOpen === dropdownKey ? null : dropdownKey);
  };

  // Handle item selection from dropdown
  const handleItemSelectFromDropdown = (itemId, event) => {
    const item = caseTrainingItems.find(item => item.id === itemId);
    if (item) {
      setSelectedItem(item);
      fetchCidSourceInfo(item.cid);
      if (onShowDetail) {
        onShowDetail(item, event);
      }
      if (isMobile) {
        setShowMobileModal(true);
      }

      // Wait for DOM to re-render then scroll to item
      setTimeout(() => {
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
          itemElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          itemElement.style.backgroundColor = '#e6f7ff';
          setTimeout(() => {
            itemElement.style.backgroundColor = '';
          }, 2000);
        }
      }, 300);
    }
    setDropdownOpen(null);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.tag1 && localFilters.tag1.length > 0) count += 1;
    if (localFilters.tag2 && localFilters.tag2.length > 0) count += 1;
    if (localFilters.tag3 && localFilters.tag3.length > 0) count += 1;
    if (localFilters.impact && localFilters.impact !== 'all') count += 1;
    if (localFilters.quizStatus && localFilters.quizStatus !== 'all') count += 1;
    return count;
  };

  const renderMobileFiltersContent = () => (
    <div className={styles.filterPopoverContent}>
      <div className={styles.filterPopoverHeader}>
        <Title level={5} className={styles.filterPopoverTitle}>Bộ lọc tìm kiếm</Title>
        <Text type="secondary" className={styles.filterPopoverDescription}>Chọn các tiêu chí để lọc case training</Text>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterSectionHeader}>
          <span className={styles.filterSectionIcon}>📂</span>
          <Text strong className={styles.filterSectionTitle}>Phân loại</Text>
        </div>

        <div className={styles.categoryFilterGroup}>
          {/* Danh mục */}
          {
            isMobile && (
              <>   <div className={styles.categoryFilterCard}>
                <div className={styles.categoryFilterHeader}>
                  <span className={`${styles.categoryFilterIndicator} ${styles.tag1}`}></span>
                  <Text strong className={styles.categoryFilterLabel}>Danh mục</Text>
                </div>
                <div className={styles.categoryFilterTags}>
                  {finalTag1Options.map(option => {
                    const titlesInTag = getTitlesForTag('tag1', option.value);
                    const hasItems = titlesInTag.length > 0;
                    const tagCount = getTagCount('tag1', option.value);

                    return (
                      <div key={option.value} className={styles.categoryButtonContainer}>
                        <Tag
                          color={localFilters.tag1?.includes(option.value) ? 'blue' : 'default'}
                          className={`${styles.categoryFilterTag} ${localFilters.tag1?.includes(option.value) ? styles.tag1Selected : styles.tag1Unselected}`}
                          onClick={() => handleTagToggle('tag1', option.value)}
                        >   {tagCount > 0 && (
                          <span style={{
                            marginLeft: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: localFilters.tag1?.includes(option.value) ? '#0958d9' : '#666'
                          }}>
                            ({tagCount})
                          </span>
                        )}
                          {option.label}

                          {hasItems && (
                            <button
                              className={styles.dropdownToggle}
                              onClick={(e) => toggleDropdown('tag1', option.value, e)}
                              title={`Xem danh sách ${option.label}`}
                            >
                              <Menu size={14} color={localFilters.tag1?.includes(option.value) ? '#0958d9' : '#000'} />
                            </button>
                          )}
                        </Tag>

                        {hasItems && dropdownOpen === `tag1-${option.value}` && (
                          <div className={styles.dropdownMenu}>
                            <div className={styles.dropdownHeader}>
                              <span>{option.label}</span>
                              <button
                                className={styles.closeDropdown}
                                onClick={(e) => toggleDropdown('tag1', option.value, e)}
                              >
                                ×
                              </button>
                            </div>
                            <div className={styles.dropdownItems}>
                              {titlesInTag.map(item => (
                                <button
                                  key={item.id}
                                  className={styles.dropdownItem}
                                  onClick={(e) => handleItemSelectFromDropdown(item.id, e)}
                                >
                                  {item.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              </>
            )
          }


          {/* Cấp độ */}
          <div className={styles.categoryFilterCard}>
            <div className={styles.categoryFilterHeader}>
              <span className={`${styles.categoryFilterIndicator} ${styles.tag2}`}></span>
              <Text strong className={styles.categoryFilterLabel}>Cấp độ</Text>
            </div>
            <div className={styles.categoryFilterTags}>
              {finalTag2Options.map(option => (
                <Tag
                  key={option.value}
                  color={localFilters.tag2?.includes(option.value) ? 'green' : 'default'}
                  className={`${styles.categoryFilterTag} ${localFilters.tag2?.includes(option.value) ? styles.tag2Selected : styles.tag2Unselected
                    }`}
                  onClick={() => handleTagToggle('tag2', option.value)}
                >
                  {option.label}
                </Tag>
              ))}
            </div>
          </div>

          {/* Loại bài - chỉ hiển thị trên mobile */}
          {/*{isMobile && (*/}
          {/*  <div className={styles.categoryFilterCard}>*/}
          {/*    <div className={styles.categoryFilterHeader}>*/}
          {/*      <span className={`${styles.categoryFilterIndicator} ${styles.tag3}`}></span>*/}
          {/*      <Text strong className={styles.categoryFilterLabel}>Loại bài</Text>*/}
          {/*    </div>*/}
          {/*    <div className={styles.categoryFilterTags}>*/}
          {/*      {finalTag3Options.map(option => (*/}
          {/*        <Tag*/}
          {/*          key={option.value}*/}
          {/*          color={localFilters.tag3?.includes(option.value) ? 'orange' : 'default'}*/}
          {/*          className={`${styles.categoryFilterTag} ${localFilters.tag3?.includes(option.value) ? styles.tag3Selected : styles.tag3Unselected*/}
          {/*            }`}*/}
          {/*          onClick={() => handleTagToggle('tag3', option.value)}*/}
          {/*        >*/}
          {/*          {option.label}*/}
          {/*        </Tag>*/}
          {/*      ))}*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>
      </div>

      {/* <div className={styles.filterSection}>
        <div className={styles.filterSectionHeader}>
          <span className={styles.filterSectionIcon}>🎯</span>
          <Text strong className={styles.filterSectionTitle}>Độ phức tạp</Text>
        </div>
        <div className={styles.impactFilterContainer}>
          <Space size="small" wrap className={styles.impactFilterButtons}>
            <Button
                type={localFilters.impact === 'all' ? 'primary' : 'default'}
                onClick={() => handleFilterChange('impact', 'all')}
                size="middle"
                className={styles.impactFilterButton}
            >
              Tất cả
            </Button>
            <Button
                type={localFilters.impact === 'high' ? 'primary' : 'default'}
                onClick={() => handleFilterChange('impact', 'high')}
                size="middle"
                className={styles.impactFilterButton}
            >
              Cao
            </Button>
            <Button
                type={localFilters.impact === 'normal' ? 'primary' : 'default'}
                onClick={() => handleFilterChange('impact', 'normal')}
                size="middle"
                className={styles.impactFilterButton}
            >
              Tiêu chuẩn
            </Button>
          </Space>
        </div>
      </div> */}
      {
        isMobile && (
          <> <div className={styles.filterSection}>
            <div className={styles.filterSectionHeader}>
              <span className={styles.filterSectionIcon}>📝</span>
              <Text strong className={styles.filterSectionTitle}>Trạng thái Quiz</Text>
            </div>
            <div className={styles.quizStatusFilterContainer}>
              <Select
                value={localFilters.quizStatus}
                onChange={(value) => handleFilterChange('quizStatus', value)}
                placeholder="Chọn trạng thái Quiz"
                className={styles.quizStatusSelect}
                size="middle"
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="completed">✅ Đã hoàn thành Quiz</Option>
                <Option value="incomplete">⏳ Chưa hoàn thành Quiz</Option>
              </Select>
            </div>
          </div>
          </>
        )
      }

      {
        isMobile && (
          <div className={styles.filterActions}>
            <Button
              onClick={resetFilters}
              size="middle"
              className={styles.filterResetButton}
            >
              <span style={{ fontSize: '13px' }}>🗑️ Xóa tất cả bộ lọc</span>
            </Button>
          </div>
        )
      }
    </div>
  );

  const resetFilters = () => {
    const resetFilters = {
      tag1: [],
      tag2: [],
      tag3: [],
      search: '',
      impact: 'all',
      quizStatus: 'all'
    };
    setLocalFilters(resetFilters);
    Object.keys(resetFilters).forEach(key => {
      onFilterChange(key, resetFilters[key]);
    });
  };

  const resetQuizScores = () => {
    setQuizScores({});
    localStorage.removeItem('caseTrainingQuizScores');
  };


  const getFilteredItems = () => {
    let filtered = caseTrainingItems.filter(item =>
      item.status === 'published' && item.impact !== 'skip'
    );

    if (selectedProgram && selectedProgram !== 'all') {
      filtered = filtered.filter(item => {
        if (!Array.isArray(item.tag4)) return false; // bỏ qua nếu không phải mảng
        return item.tag4.includes(selectedProgram);
      });
    }

    if (tag4Filter && tag4Filter !== 'all') {
      filtered = filtered.filter(item => item.tag4?.includes(tag4Filter));
    }

    // Tag1 filter
    if (localFilters.tag1 && localFilters.tag1.length > 0) {
      filtered = filtered.filter(item => localFilters.tag1.includes(item.tag1));
    }

    // Tag2 filter
    if (localFilters.tag2 && localFilters.tag2.length > 0) {
      filtered = filtered.filter(item => localFilters.tag2.includes(item.tag2));
    }

    // Tag3 filter
    if (localFilters.tag3 && localFilters.tag3.length > 0) {
      filtered = filtered.filter(item => localFilters.tag3.includes(item.tag3));
    }

    // Impact filter
    if (localFilters.impact !== 'all') {
      filtered = filtered.filter(item => item.impact === localFilters.impact);
    }

    // Quiz status filter (>=60 is completed)
    if (localFilters.quizStatus === 'completed') {
      filtered = filtered.filter(item => {
        const score = quizScores[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return !isNaN(n) && n >= 60;
      });
    } else if (localFilters.quizStatus === 'incomplete') {
      filtered = filtered.filter(item => {
        const score = quizScores[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return isNaN(n) || n < 60;
      });
    }

    // Search filter
    if (localFilters.search) {
      const searchTerm = localFilters.search.toLowerCase();
      filtered = filtered.filter(item => {
        const id = (item.id || "");   // ép id sang string để tránh lỗi
        const title = item.title || "";
        const summary = item.summary || "";
        const description = item.description || "";
        const detail = item.detail || "";

        const searchableText = `${id} ${title} ${summary} ${description} ${detail}`.toLowerCase();
        return searchableText.includes(searchTerm);
      });
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();

  // Get titles for a specific tag
  const getTitlesForTag = (tagType, tagValue) => {
    const dataCase = selectedProgram === 'all' ? filteredItems : filteredItems.filter(item => item.tag4.includes(selectedProgram));

    if (!tagValue) return dataCase;
    return filteredItems.filter(item => item[tagType] == tagValue).map(item => ({
      id: item.id,
      title: item.title,
      tagType: tagType
    }));
  };

  // Get count for a specific tag
  const getTagCount = (tagType, tagValue) => {
    if (!tagValue) return 0;
    return filteredItems.filter(item => {
      // Filter by selectedProgram first
      const matchesProgram = selectedProgram === 'all' || (item.tag4 && item.tag4.includes(selectedProgram));
      // Then filter by tag value
      return matchesProgram && item[tagType] === tagValue;
    }).length;
  };


  const handleIconMouseEnter = (e, itemId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setHoveredItemId(itemId);
    setShowHoverPopup(true);
  };

  const handleIconMouseLeave = () => {
    setShowHoverPopup(false);
    setHoveredItemId(null);
  };

  // Handle item selection
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    fetchCidSourceInfo(item.cid);
    if (isMobile) {
      setShowMobileModal(true);
    }
  };

  // Handle quiz score update
  const handleQuizScoreUpdate = (itemId, score) => {
    const newQuizScores = {
      ...quizScores,
      [itemId]: score
    };
    setQuizScores(newQuizScores);

    // Save to localStorage
    try {
      localStorage.setItem('caseTrainingQuizScores', JSON.stringify(newQuizScores));
      console.log('💾 Saved quiz scores to localStorage:', newQuizScores);
    } catch (error) {
      console.error('❌ Error saving quiz scores to localStorage:', error);
    }

    console.log('Quiz score updated:', itemId, score);
  };

  // Mobile modal controls
  const closeMobileModal = () => {
    setShowMobileModal(false);
    setSelectedItem(null);
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


  const handleCidSourceInfoClick = (data) => {
    if (data) {
      const url = `${window.location.origin}/business-wikibook?tab=stream&item=${data.id}`;
      window.open(url, '_blank');
    }
  }

  // Render TOC Sidebar
  const renderTOCSidebar = () => {
    if (headings.length === 0) return null;

    return (
      <>
        {/* Sidebar */}
        <div className={`${newsTabStyles.tocSidebar} ${showTOCSidebar ? newsTabStyles.show : ''}`}>
          <div className={newsTabStyles.tocSidebarHeader}>
            <h4>Mục lục</h4>
            {/* <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={toggleTOCSidebar}
              title="Đóng mục lục"
              className={newsTabStyles.tocSidebarCloseButton}
            /> */}
          </div>
          <div className={newsTabStyles.tocSidebarList}>
            {headings.map((heading, index) => (
              <div
                key={index}
                className={`${newsTabStyles.tocSidebarItem} ${newsTabStyles[`tocSidebarLevel${heading.level}`]} ${activeHeadingIndex === index ? newsTabStyles.tocSidebarItemActive : ''
                  }`}
                onClick={() => scrollToHeading(index)}
                title={`Cuộn đến: ${heading.text}`}
              >
                {heading.text}
              </div>
            ))}
          </div>
        </div>
      </>
    );
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

  // Render content panel (right panel)
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', marginTop: '10px' }}>
            {/* {item.hasTitle && headings.length > 0 && (
                <IconButton
                  style={{ padding: '4px' }}
                  title={showTOCSidebar ? "Ẩn mục lục" : "Hiện mục lục"}
                  onClick={toggleTOCSidebar}
                >
                  <MenuOutlined style={{ fontSize: '16px' }} />
                </IconButton>
              )} */}
            <span style={{ fontSize: '16px', color: '#6b7280', fontWeight: '500', marginLeft: '10px' }}>ID: {item.id}</span>

            {/* Hiển thị thông tin CID source nếu có */}
            {cidSourceInfo && cidSourceInfo.length > 0 && (
              cidSourceInfo.map((item) => (
              <span style={{
                fontSize: '14px',
                color: '#1890ff',
                fontWeight: '500',
                backgroundColor: '#f0f8ff',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #d6e4ff',
                marginLeft: '8px',
                cursor: 'pointer'
              }}
                onClick={() => {
                  handleCidSourceInfoClick(item);
                }}
              >
                {item.title} - CID {item.cid} - {item.id}
              </span>
              ))
            )}

            <ShareButton onShare={() => onShare(selectedItem)} />
          </div>
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

        {/* {( item.avatarUrl || item.summary) && (
          <div className={`${styles.valueSection} ${newsTabStyles.valueSection}`}>

            <div className={`${styles.valueSectionContent} ${newsTabStyles.valueSectionContent}`}>
              {
                item.summary && (
                  <div className={`${styles.valueSummary} ${newsTabStyles.valueSummary}`}>
                    {item.summary}
                  </div>
                )
              }
              {
                item.avatarUrl && (
                  <div className={`${styles.valueImage} ${newsTabStyles.valueImage}`}>
                    <Image
                      src={item.avatarUrl}
                      alt={item.title}
                      className={`${styles.coverImageDetail} ${newsTabStyles.coverImageDetail}`}
                    />
                  </div>
                )
              }
            </div>
          </div>
        )} */}


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
                  <div key={`html-${index}`} >
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
                      {Array.isArray(item.diagramNote) && item.diagramNote[index] && (
                        <div className={`${styles.diagramNote} ${newsTabStyles.diagramNote}`}>
                          <div
                            style={{ color: 'white' }}
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
                          style={{ color: 'white' }}
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

          {item.description && (
            <div className={styles.contentDescription}>
              <Text strong>Description:</Text>
              <Text>{item.description}</Text>
            </div>
          )}

          {item.detail && (
            <div className={`${styles.contentDetail} ${newsTabStyles.contentDetail}`}>
              <div
                ref={markdownContentRef}
                className={styles.markdownContent}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(item.detail || '', {
                    headerIds: true,
                    mangle: false,
                    headerPrefix: '',
                    breaks: false,
                    gfm: true
                  })),
                }}
              />
            </div>
          )}

          {/* Quiz Component - Hiển thị cuối cùng khi xem chi tiết */}
          {/*{item.questionContent && (*/}
          {/*  <QuizComponent*/}
          {/*    quizData={item.questionContent}*/}
          {/*    questionId={item.id}*/}
          {/*    onScoreUpdate={handleQuizScoreUpdate}*/}
          {/*  />*/}
          {/*)}*/}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <Text>Loading case training data...</Text>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <PreviewFileModal
        open={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        fileUrl={previewFile?.url}
        fileName={previewFile?.name}
        title={previewFile ? `${getFileIcon(previewFile.extension)} ${previewFile.name}` : 'Preview File'}
      />
      {/* Header with count */}

      {/* Filters Section - Matching NewsTab.jsx Layout */}
      {showSearchSection && (
        <div className={styles.filters}>
          {/* Search Row */}
          <div className={styles.searchRow}>
            <div className={styles.searchGroup}>
              <Input
                placeholder="Tìm kiếm case training..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
                size="large"
                style={{
                  width: '100%',
                  ...(localFilters.search && { backgroundColor: 'rgb(245, 231, 231)' })
                }}
              />
            </div>
            {
              isMobile ? (
                <>   {isFilterPopoverOpen && isMobile && (
                  <div className={styles.popoverOverlay} onClick={() => setIsFilterPopoverOpen(false)} />
                )}
                  <Popover
                    placement="bottomRight"
                    trigger="click"
                    open={isFilterPopoverOpen}
                    onOpenChange={setIsFilterPopoverOpen}
                    overlayStyle={{ zIndex: 1001 }}
                    content={renderMobileFiltersContent()}
                  >
                    <Button icon={<FilterOutlined />} size="large">
                      <span style={{ fontSize: '13px' }}>Bộ lọc{getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}</span>
                    </Button>
                  </Popover>
                </>
              )
                : (
                  <>
                    {/* Loại bài filter cho PC */}
                    {/*<div className={styles.filterGroup}>*/}
                    {/*  <strong>Loại bài:</strong>*/}
                    {/*  <div className={styles.filterTags}>*/}
                    {/*    {finalTag3Options.map(option => (*/}
                    {/*      <Tag*/}
                    {/*        key={option.value}*/}
                    {/*        color={localFilters.tag3?.includes(option.value) ? 'orange' : 'default'}*/}
                    {/*        className={`${styles.filterTag} ${localFilters.tag3?.includes(option.value) ? styles.tagSelected : styles.tagUnselected}`}*/}
                    {/*        onClick={() => handleTagToggle('tag3', option.value)}*/}
                    {/*        style={{*/}
                    {/*          cursor: 'pointer',*/}
                    {/*          height: '35px'*/}
                    {/*        }}*/}
                    {/*      >*/}
                    {/*        <span style={{ fontSize: '13px' }}>{option.label}</span>*/}
                    {/*      </Tag>*/}
                    {/*    ))}*/}
                    {/*  </div>*/}
                    {/*</div>*/}

                    <div className={styles.filterGroup}>
                      <strong>Trạng thái Quiz:</strong>
                      <Select
                        value={localFilters.quizStatus}
                        onChange={(value) => handleFilterChange('quizStatus', value)}
                        placeholder="Chọn trạng thái"
                        size="middle"
                        style={{ minWidth: '160px' }}
                      >
                        <Option value="all">Tất cả trạng thái</Option>
                        <Option value="completed">✅ Đã hoàn thành</Option>
                        <Option value="incomplete">⏳ Chưa hoàn thành</Option>
                      </Select>
                    </div>

                    {/* Advanced Filters Button */}
                    <div className={styles.actionGroup}>
                      <Popover
                        content={renderMobileFiltersContent}
                        trigger="click"
                        placement="bottomRight"
                        overlayClassName={styles.filterPopover}
                      >
                        <Button
                          icon={<FilterOutlined />}
                          size="large"
                        >
                          <span style={{ fontSize: '13px' }}>Bộ lọc{getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}</span>
                        </Button>
                      </Popover>

                    </div>
                    <div>
                      <Button
                        onClick={resetFilters}
                        size="middle"
                        className={styles.filterResetButton}
                      >
                        <span style={{ fontSize: '13px' }}>🗑️ Xóa tất cả bộ lọc</span>
                      </Button>
                    </div>
                  </>
                )
            }


            {/* Controls Row */}

          </div>
          {
            !isMobile && (
              <>   <div className={styles.controlsRow}>
                {/* Category Filter */}
                <div className={styles.filterGroup}>
                  <strong>Danh mục:</strong>
                  <div className={styles.filterTags}>
                    {finalTag1Options.slice(0, showAllCategories ? finalTag1Options.length : 5).map(option => {
                      const titlesInTag = getTitlesForTag('tag1', option.value);
                      const hasItems = titlesInTag.length > 0;
                      const tagCount = getTagCount('tag1', option.value);

                      return (
                        <div key={option.value} className={styles.categoryButtonContainer}>
                          <Tag
                            color={localFilters.tag1?.includes(option.value) ? 'blue' : 'default'}
                            className={`${styles.filterTag} ${localFilters.tag1?.includes(option.value) ? styles.tagSelected : styles.tagUnselected}`}
                            onClick={() => handleTagToggle('tag1', option.value)}
                            style={{
                              cursor: 'pointer',
                              height: '35px'
                            }}
                          >
                            {tagCount > 0 && (
                              <span style={{
                                marginLeft: '4px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: localFilters.tag1?.includes(option.value) ? '#0958d9' : '#666'
                              }}>
                                ({tagCount})
                              </span>
                            )}
                            <span style={{ fontSize: '13px' }}>
                              {option.label}
                            </span>
                            {hasItems && (
                              <button
                                className={styles.dropdownToggle}
                                onClick={(e) => toggleDropdown('tag1', option.value, e)}
                                title={`Xem danh sách ${option.label}`}
                              >
                                <Menu size={14} color={localFilters.tag1?.includes(option.value) ? '#0958d9' : '#000'} />
                              </button>
                            )}
                          </Tag>

                          {hasItems && dropdownOpen === `tag1-${option.value}` && (
                            <div className={styles.dropdownMenu}>
                              <div className={styles.dropdownHeader}>
                                <span>{option.label}</span>
                                <button
                                  className={styles.closeDropdown}
                                  onClick={(e) => toggleDropdown('tag1', option.value, e)}
                                >
                                  ×
                                </button>
                              </div>
                              <div className={styles.dropdownItems}>
                                {titlesInTag.map(item => (
                                  <button
                                    key={item.id}
                                    className={styles.dropdownItem}
                                    onClick={(e) => handleItemSelectFromDropdown(item.id, e)}
                                  >
                                    {item.title}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Show more/less button */}
                    {finalTag1Options.length > 5 && (
                      <Button
                        type="text"
                        size="small"
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          color: '#1890ff',
                          padding: '4px 8px',
                          height: 'auto'
                        }}
                      >
                        {showAllCategories ? 'Thu gọn' : `Xem thêm (${finalTag1Options.length - 5})`}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              </>
            )
          }
        </div>
      )}


      {isMobile ? (
        // Mobile view: Single panel with modal
        <div className={styles.caseTrainingPanel}>
          {filteredItems.length === 0 ? (
            <Empty
              description="No case training items found"
              className={styles.emptyState}
            />
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className={`${styles.caseTrainingItem} ${expandedItem === item.id ? styles.expanded : ''}`}
                onClick={() => handleItemSelect(item)}
                data-item-id={item.id}
              >
                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <Title level={5} className={styles.title}>{item.title}</Title>
                    <div className={styles.metaInfo}>
                      {renderQuizStatus(item)}
                      <Space size="small">
                        {item.tag1 && <Tag color="purple">{item.tag1}</Tag>}
                        {/* {item.tag2 && <Tag color="cyan">{item.tag2}</Tag>} */}
                        {item.tag3 && <Tag color="red">{item.tag3}</Tag>}
                      </Space>
                    </div>
                  </div>

                  {item.summary && (
                    <div className={styles.summary}>
                      <p>{item.summary}</p>
                    </div>
                  )}

                  {item.description && (
                    <div className={styles.description}>
                      <Text type="secondary">{item.description}</Text>
                    </div>
                  )}
                </div>
              </div>
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
            {filteredItems.length === 0 ? (
              <Empty
                description="No case training items found"
                className={styles.emptyState}
              />
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`${styles.caseTrainingItem} ${expandedItem === item.id ? styles.expanded : ''} ${selectedItem?.id === item.id ? styles.selected : ''}`}
                  onClick={() => handleItemSelect(item)}
                  data-item-id={item.id}
                >
                  {/* Hover Popup */}
                  {showHoverPopup && hoveredItemId === item.id && (item.summary || item.description || item.source) && (
                    <div
                      style={{
                        left: `${popupPosition.x}px`,
                        top: `${popupPosition.y}px`,
                        transform: 'translateX(-50%) translateY(-100%)',
                        zIndex: 9999,
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                        padding: '16px',
                        maxWidth: '350px',
                        minWidth: '280px',
                        pointerEvents: 'none',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(229, 231, 235, 0.9)',
                        isolation: 'isolate',
                        position: 'fixed',
                        transformOrigin: 'bottom center',
                      }}
                    >
                      {/* Arrow pointing down */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-8px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: '8px solid #ffffff',
                          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
                        }}
                      />

                      {/* Summary */}
                      {item.summary && (
                        <div style={{
                          marginBottom: (item.description || item.source || item.createdAt) ? '12px' : '0',
                          paddingBottom: (item.description || item.source || item.createdAt) ? '12px' : '0',
                          borderBottom: (item.description || item.source || item.createdAt) ? '1px solid #f1f5f9' : 'none'
                        }}>
                          <div style={{
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: '#374151',
                            fontWeight: '400'
                          }}>
                            {item.summary}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {item.description && (
                        <div style={{
                          marginBottom: (item.source || item.createdAt) ? '12px' : '0',
                          paddingBottom: (item.source || item.createdAt) ? '12px' : '0',
                          borderBottom: (item.source || item.createdAt) ? '1px solid #f1f5f9' : 'none'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            lineHeight: '1.4',
                            color: '#6b7280',
                            fontStyle: 'italic'
                          }}>
                            {item.description}
                          </div>
                        </div>
                      )}

                      {/* Time */}
                      {item.createdAt && (
                        <div style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          marginBottom: item.source ? '8px' : '0',
                          fontStyle: 'italic',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>🕒</span>
                          {getTimeAgo(item.createdAt)}
                        </div>
                      )}

                      {/* Source */}
                      {item.source && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          paddingTop: (item.summary || item.description || item.createdAt) ? '8px' : '0',
                          borderTop: (item.summary || item.description || item.createdAt) ? '1px solid #f1f5f9' : 'none'
                        }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>
                            🔗 Nguồn:
                          </span>
                          <span style={{
                            fontSize: '11px',
                            color: '#3b82f6',
                            fontWeight: '600',
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}>
                            {item.source}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                        {item.avatarUrl && (
                          <div className={styles.avatarWrapper}>
                            <Image src={item.avatarUrl} alt="Avatar" style={{
                              width: '120px',
                              height: '120px',
                              objectFit: 'cover',
                              objectPosition: 'center',
                              display: 'block',
                            }}
                            />                  
                                    </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div className={styles.title} style={{
                            display: 'inline-block',
                            lineHeight: '1.4'
                          }}>
                            <span style={{ display: 'inline' }}>{item.title}</span>
                            <span style={{
                              color: '#868686',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              marginLeft: '4px',
                              display: 'inline'
                            }}
                              // onClick={async (e) => {
                              //   e.preventDefault();
                              //   e.stopPropagation();
                              //   const data = await getK9ByCidType(item.cid, 'news');
                              //   handleCidSourceInfoClick(data);
                              // }}
                            >
                              CID: {item.cid}
                            </span>
                          </div>
                          {item.summary && (
                            <div className={styles.summary}>
                              <p title={item.summary}>{item.summary}</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    <div className={styles.metaInfo} style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>

                        {renderQuizStatus(item)}

                        <Space size="small">
                          {item.tag1 && <Tag color="purple">{item.tag1}</Tag>}
                          {/* {item.tag2 && <Tag color="cyan">{item.tag2}</Tag>} */}
                          {item.tag3 && <Tag color="red">{item.tag3}</Tag>}
                        </Space>
                      </div>

                      {/* {(item.summary || item.description || item.source) && (
                        <IconButton
                          onMouseEnter={(e) => handleIconMouseEnter(e, item.id)}
                          onMouseLeave={handleIconMouseLeave}
                          title="Xem thêm thông tin"
                          style={{ zIndex: 10 }}
                        >
                          <InfoMore_Icon
                            width={16}
                            height={16}
                          />
                        </IconButton>
                      )} */}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.rightPanel} style={{ padding: selectedItem?.hasTitle ? '20px 55px 20px 55px' : '20px 150px 20px 150px' }}>
            {selectedItem ? (
              renderContentPanel(selectedItem)
            ) : (
              <div className={styles.emptyContentState}>
                <div className={styles.emptyContentIcon}>📚</div>
                <h3>Chọn một case training để xem nội dung</h3>
                <p>Nhấp vào bất kỳ case training nào ở bên trái để xem chi tiết</p>
              </div>
            )}
          </div>
          {selectedItem?.hasTitle && renderTOCSidebar()}
        </div>
      )}

    </div>
  );
};

export default CaseTrainingTab;

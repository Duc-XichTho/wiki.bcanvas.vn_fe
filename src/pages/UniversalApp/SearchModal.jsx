import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, List, Typography, Button, Spin, Empty } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './SearchModal.module.css';

const { Text, Paragraph } = Typography;

const SearchModal = ({ 
  visible, 
  onClose, 
  processItems, 
  processes, 
  onItemSelect 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const resultsContainerRef = useRef(null);

  // Search function to find content in process items
  const searchProcessItems = (term) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    const results = [];
    let resultCounter = 0; // Counter to ensure unique keys
    const searchLower = term.toLowerCase();

    // Search through all process items
    for (const processId in processItems) {
      const process = processes.find(p => p.id.toString() === processId);
      const items = processItems[processId] || [];
      
      items.forEach(item => {
        // Search in content - check if content contains the exact word
        if (item.content) {
          const escapedSearchTerm = searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Use custom word boundary that handles Vietnamese characters properly
          const exactWordRegex = new RegExp(`(?<![a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ])${escapedSearchTerm}(?![a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ])`, 'g');
          const hasExactMatch = exactWordRegex.test(item.content.toLowerCase());
          
          if (hasExactMatch) {
            const contentLower = item.content.toLowerCase();
            
            // Find all occurrences and extract paragraphs containing the search term
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = item.content;
            
            // Get all paragraphs, headings, and other text elements
            const textElements = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span, li');
            
            // Track added content to prevent duplicates
            const addedContent = new Set();
            
            textElements.forEach(element => {
              const elementText = element.textContent.trim();
              if (elementText.toLowerCase().includes(searchLower)) {
                // Count exact word occurrences in this paragraph using custom word boundaries
                const exactWordRegex = new RegExp(`(?<![a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ])${escapedSearchTerm}(?![a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ])`, 'g');
                const matches = elementText.toLowerCase().match(exactWordRegex);
                const occurrenceCount = matches ? matches.length : 0;
                
                // Only add if there are exact word matches and content hasn't been added before
                if (occurrenceCount > 0 && !addedContent.has(elementText)) {
                  // Add to set to prevent duplicates
                  addedContent.add(elementText);
                  
                  // Highlight the exact search term in the paragraph
                  const exactWordHighlightRegex = new RegExp(`(?<![a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ])${escapedSearchTerm}(?![a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ])`, 'gi');
                  const highlightedText = elementText.replace(
                    exactWordHighlightRegex,
                    match => `<mark style="background-color: #ffd54f; padding: 0 2px; border-radius: 2px;">${match}</mark>`
                  );
                  
                  results.push({
                    key: `result-${++resultCounter}-${item.id}-${elementText.substring(0, 30).replace(/[^a-zA-Z0-9\s-]/g, '')}`,
                    itemTitle: item.text,
                    processName: process?.text,
                    paragraph: highlightedText,
                    originalParagraph: elementText,
                    occurrenceCount,
                    processItem: item,
                    process: process
                  });
                }
              }
            });
          }
        }
      });
    }

    // Sort by occurrence count (descending) and then by item title
    results.sort((a, b) => {
      if (a.occurrenceCount !== b.occurrenceCount) {
        return b.occurrenceCount - a.occurrenceCount;
      }
      return a.itemTitle.localeCompare(b.itemTitle);
    });

    setSearchResults(results);
    setSelectedIndex(-1); // Reset selection when new results are loaded
    setLoading(false);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchProcessItems(value);
  };

  // Handle item selection
  const handleItemSelect = (result) => {
    onItemSelect(result);
    onClose();
  };

  // Clear search when modal closes and focus input when modal opens
  useEffect(() => {
    if (!visible) {
      setSearchTerm('');
      setSearchResults([]);
    } else {
      // Focus the search input when modal opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [visible]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!visible) return;

      // Escape key to close modal
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Arrow key navigation
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < searchResults.length - 1 ? prev + 1 : 0;
          return newIndex;
        });
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : searchResults.length - 1;
          return newIndex;
        });
        return;
      }

      // Enter key to select highlighted item
      if (event.key === 'Enter' && selectedIndex >= 0 && searchResults[selectedIndex]) {
        event.preventDefault();
        handleItemSelect(searchResults[selectedIndex]);
        return;
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose, selectedIndex, searchResults]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedIndex >= 0 && resultsContainerRef.current) {
      const selectedElement = resultsContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SearchOutlined />
          Tìm kiếm trong tài liệu
          <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
            (Ctrl+Shift+F)
          </Text>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className={styles.searchModal}
      destroyOnHidden
    >
      <div className={styles.searchContainer}>
        <Input
          ref={searchInputRef}
          placeholder="Nhập từ khóa để tìm kiếm..."
          value={searchTerm}
          onChange={handleSearchChange}
          prefix={<SearchOutlined />}
          suffix={
            searchTerm && (
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setSearchTerm('');
                  setSearchResults([]);
                }}
              />
            )
          }
          size="large"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.resultsContainer} ref={resultsContainerRef}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <Text type="secondary">Đang tìm kiếm...</Text>
          </div>
        ) : searchTerm.length >= 2 ? (
          searchResults.length > 0 ? (
            <List
              dataSource={searchResults}
              renderItem={(result, index) => (
                <List.Item
                  className={`${styles.resultItem} ${selectedIndex === index ? styles.selectedItem : ''}`}
                  onClick={() => handleItemSelect(result)}
                  style={{
                    backgroundColor: selectedIndex === index ? '#e6f7ff' : 'white',
                    borderLeft: selectedIndex === index ? '3px solid #1890ff' : '3px solid transparent'
                  }}
                  data-index={index}
                >
                  <div className={styles.resultContent}>
                    <div className={styles.resultHeader}>
                      <Text strong className={styles.itemTitle}>
                        {result.itemTitle}
                      </Text>
                      <Text type="secondary" className={styles.processName}>
                        {result.processName}
                      </Text>
                      {/* <Text className={styles.occurrenceCount}>
                        ({result.occurrenceCount} lần)
                      </Text> */}
                    </div>
                    <div 
                      className={styles.paragraph}
                      dangerouslySetInnerHTML={{ __html: result.paragraph }}
                    />
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty
              description="Không tìm thấy kết quả nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )
        ) : (
          <div className={styles.placeholderContainer}>
            <Text type="secondary">
              Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SearchModal;

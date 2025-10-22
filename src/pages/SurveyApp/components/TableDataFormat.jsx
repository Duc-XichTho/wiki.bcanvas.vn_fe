import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, Filter, Table } from 'lucide-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import styles from '../CustomerSurveyApp.module.css';
import { getSurveyById } from '../../../apis/surveyService';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const TableDataFormat = ({ surveyFiles, templates, onClose }) => {
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState('');
  const [surveyContentGridData, setSurveyContentGridData] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const gridRef = useRef();
  const contentGridRef = useRef();

  // Get unique tags from all surveys
  const allTags = useMemo(() => {
    const tags = new Set();
    surveyFiles.forEach(survey => {
      survey.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [surveyFiles]);

  // Get unique template types
  const templateTypes = useMemo(() => {
    const types = new Set();
    surveyFiles.forEach(survey => {
      if (survey.template) {
        types.add(survey.template);
      } else if (survey.templateId) {
        // Find template name by templateId
        const template = templates.find(t => t.id === survey.templateId);
        if (template) {
          types.add(template.name);
        }
      }
    });
    return Array.from(types).sort();
  }, [surveyFiles, templates]);

  // Filter surveys based on search and filters
  const filteredSurveys = useMemo(() => {
    return surveyFiles.filter(survey => {
      // Search query filter
      const matchesSearch = !searchQuery || 
        survey.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        survey.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Tags filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => survey.tags.includes(tag));

      // Template type filter
      const matchesTemplate = !selectedTemplateType || 
        survey.template === selectedTemplateType ||
        (survey.templateId && templates.find(t => t.id === survey.templateId)?.name === selectedTemplateType);

      return matchesSearch && matchesTags && matchesTemplate;
    });
  }, [surveyFiles, searchQuery, selectedTags, selectedTemplateType]);

  // Column definitions for survey list
  const surveyColumnDefs = useMemo(() => [
    {
      field: 'tags',
      headerName: 'Tags',
      flex: 1.5,
      cellRenderer: (params) => (
        <div className={styles.surveyTagsCell}>
          {params.data.tags && params.data.tags.length > 0 ? (
            params.data.tags.map((tag, index) => (
              <span key={index} className={styles.surveyTag}>{tag}</span>
            ))
          ) : (
            <span className={styles.noTags}>Không có tags</span>
          )}
        </div>
      )
    },
    {
      field: 'name',
      headerName: 'Tên Survey',
      flex: 2,
      cellRenderer: (params) => (
        <div className={styles.surveyNameCell}>
          <div className={styles.surveyName}>{params.value}</div>
        </div>
      )
    },
    {
      field: 'sections',
      headerName: 'Sections',
      flex: 2,
      cellRenderer: (params) => (
        <div className={styles.sectionsCell}>
          {params.data.sections && params.data.sections.length > 0 ? (
            params.data.sections.map((section, index) => (
              <span 
                key={section.id || index} 
                className={`${styles.sectionText} ${section.completed ? styles.sectionCompleted : styles.sectionIncomplete}`}
              >
                {section.title} ({section.completedItems}/{section.totalItems})
                {index < params.data.sections.length - 1 ? ', ' : ''}
              </span>
            ))
          ) : (
            <span className={styles.noSections}>Không có sections</span>
          )}
        </div>
      )
    },
    {
      field: 'template',
      headerName: 'Template',
      flex: 1,
      cellRenderer: (params) => {
        let templateName = params.value;
        console.log('Template cell renderer:', {
          value: params.value,
          templateId: params.data.templateId,
          templates: templates
        });
        
        if (!templateName && params.data.templateId) {
          const template = templates.find(t => t.id === params.data.templateId);
          templateName = template ? template.name : 'N/A';
        }
        
        return (
          <span className={styles.templateType}>{templateName || 'N/A'}</span>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 1,
      cellRenderer: (params) => {
        const statusLabels = {
          'progressing': 'Đang triển khai',
          'waiting': 'Đang chờ',
          'frozen': 'Đóng băng'
        };
        return (
          <span className={`${styles.statusBadge} ${styles[params.value]}`}>
            {statusLabels[params.value] || 'N/A'}
          </span>
        );
      }
    },
    {
      field: 'successScore',
      headerName: 'Điểm',
      flex: 1,
      cellRenderer: (params) => (
        <span className={styles.scoreText}>
          {params.value > 0 ? `${params.value}/5` : 'N/A'}
        </span>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      flex: 1,
      cellRenderer: (params) => {
        if (!params.value) return 'N/A';
        
        try {
          const date = new Date(params.value);
          if (isNaN(date.getTime())) return 'N/A';
          
          // Format date as DD/MM/YYYY HH:mm
          return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (error) {
          return 'N/A';
        }
      }
    }
  ], []);

  // Function to extract table data from survey items (same as TableViewModal)
  const extractTableData = (items) => {
    const tableData = [];
    
    // Filter out section headers but keep them for section name lookup
    const sectionHeaders = items.filter(item => item.type === 'section_header');
    const nonSectionItems = items.filter(item => item.type !== 'section_header');
    
    // Create a map of sectionId to section title for quick lookup
    const sectionMap = {};
    sectionHeaders.forEach(header => {
      sectionMap[header.sectionId] = header.title;
    });
    
    nonSectionItems.forEach((item, index) => {
      const row = {
        'STT': index + 1,
        'Section': item.sectionId ? (sectionMap[item.sectionId] || 'N/A') : 'N/A',
        'Loại': getTypeLabel(item.type),
        'Tiêu đề': item.title || '',
        'Mô tả': item.description || '',
        'Trả lời': getAnswerValue(item),
        'Ghi chú': getNoteValue(item),
        'Trạng thái': getStatusValue(item)
      };
      tableData.push(row);
    });
    
    return tableData;
  };

  // Function to get type labels (same as TableViewModal)
  const getTypeLabel = (type) => {
    switch (type) {
      case 'title_desc':
        return 'Title & Description';
      case 'mcq':
        return 'Multiple Choice';
      case 'qa':
        return 'Question & Answer';
      default:
        return type;
    }
  };

  // Function to get answer value based on item type (same as TableViewModal)
  const getAnswerValue = (item) => {
    switch (item.type) {
      case 'mcq':
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          return item.selectedOptions.join(', ');
        }
        return '';
      case 'qa':
        return item.answer || '';
      case 'title_desc':
        return ''; // No answer for title/description items
      default:
        return '';
    }
  };

  // Function to get note value based on item type (same as TableViewModal)
  const getNoteValue = (item) => {
    switch (item.type) {
      case 'title_desc':
        return item.noteValue || '';
      case 'mcq':
      case 'qa':
        return item.note || '';
      default:
        return item.note || '';
    }
  };

  // Function to get status value (same as TableViewModal)
  const getStatusValue = (item) => {
    if (item.type === 'title_desc') {
      return 'N/A'; // Title/description items don't have completion status
    }
    return item.completed ? 'Hoàn thành' : 'Chưa hoàn thành';
  };

  // Column definitions for survey content (same structure as TableViewModal)
  const contentColumnDefs = useMemo(() => [
    {
      field: 'STT',
      headerName: 'STT',
      width: 80,
      sortable: true,
      filter: true
    },
    {
      field: 'Section',
      headerName: 'Section',
      width: 150,
      sortable: true,
      filter: true
    },
    {
      field: 'Loại',
      headerName: 'Loại',
      width: 150,
      sortable: true,
      filter: true
    },
    {
      field: 'Tiêu đề',
      headerName: 'Tiêu đề',
      flex: 2,
      sortable: true,
      filter: true
    },
    {
      field: 'Mô tả',
      headerName: 'Mô tả',
      flex: 2,
      sortable: true,
      filter: true
    },
    {
      field: 'Trả lời',
      headerName: 'Trả lời',
      flex: 2,
      sortable: true,
      filter: true
    },
    {
      field: 'Ghi chú',
      headerName: 'Ghi chú',
      flex: 2,
      sortable: true,
      filter: true
    },
    {
      field: 'Trạng thái',
      headerName: 'Trạng thái',
      width: 120,
      sortable: true,
      filter: true
    }
  ], []);

  // Get processed table data for content display
  const contentTableData = useMemo(() => {
    return extractTableData(surveyContentGridData);
  }, [surveyContentGridData]);

  // Default column definitions
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100
  }), []);

  // Handle survey row click
  const onSurveyRowClicked = async (event) => {
    const survey = event.data;
    setSelectedSurvey(survey);
    setLoadingContent(true);
    
    try {
      // Fetch survey content from API
      const surveyResponse = await getSurveyById(survey.id);
      if (surveyResponse && surveyResponse.content) {
        // If content is a string, parse it to array
        let contentArray = surveyResponse.content;
        if (typeof contentArray === 'string') {
          try {
            contentArray = JSON.parse(contentArray);
          } catch (e) {
            console.error('Error parsing survey content:', e);
            contentArray = [];
          }
        }
        
        // Ensure content is an array
        if (Array.isArray(contentArray)) {
          setSurveyContentGridData(contentArray);
        } else if (typeof contentArray === 'object') {
          setSurveyContentGridData([contentArray]);
        } else {
          setSurveyContentGridData([{ content: contentArray }]);
        }
      } else {
        setSurveyContentGridData([]);
      }
    } catch (error) {
      console.error('Error fetching survey content:', error);
      setSurveyContentGridData([]);
    } finally {
      setLoadingContent(false);
    }
  };

  // Handle tag selection
  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedTemplateType('');
  };

  // Handle close
  const handleClose = () => {
    setSelectedSurvey(null);
    setSurveyContentGridData([]);
    setLoadingContent(false);
    onClose();
  };

  return (
    <div className={styles.tableDataContent}>

      <div className={styles.tableDataBody}>
        {/* Filters Section */}
        <div className={styles.filtersSection}>
          <div className={styles.searchSection}>
            <div className={styles.searchInput}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm kiếm survey..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterOptions}>
            {/* Tags Filter */}
            <div className={styles.filterGroup}>
              <label>Tags:</label>
              <div className={styles.tagsFilter}>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`${styles.tagFilterButton} ${
                      selectedTags.includes(tag) ? styles.selected : ''
                    }`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Type Filter */}
            <div className={styles.filterGroup}>
              <label>Template:</label>
              <select
                value={selectedTemplateType}
                onChange={(e) => setSelectedTemplateType(e.target.value)}
                className={styles.templateSelect}
              >
                <option value="">Tất cả</option>
                {templateTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <button onClick={clearFilters} className={styles.clearFiltersButton}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className={styles.tableDataGrid}>
          {!selectedSurvey ? (
            /* Survey List Grid */
            <div className={styles.surveyListSection}>
              <h3>Danh sách Survey ({filteredSurveys.length})</h3>
                              <div className="ag-theme-quartz" style={{ height: '670px', width: '100%' }}>
                <AgGridReact
                  ref={gridRef}
                  rowData={filteredSurveys}
                  columnDefs={surveyColumnDefs}
                  defaultColDef={defaultColDef}
                  onRowClicked={onSurveyRowClicked}
                  rowSelection="single"
                  pagination={true}
                  paginationPageSize={10}
                  localeText={{
                    noRowsToShow: 'Không có dữ liệu'
                  }}
                />
              </div>
            </div>
          ) : (
            /* Survey Content Grid */
            <div className={styles.surveyContentSection}>
              <div className={styles.contentHeader}>
                <button 
                  onClick={() => setSelectedSurvey(null)}
                  className={styles.backButton}
                >
                  ← Quay lại danh sách
                </button>
                <h3>Nội dung Survey: {selectedSurvey.name}</h3>
              </div>
              
              {loadingContent ? (
                <div className={styles.noContent}>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : contentTableData.length > 0 ? (
                <div className="ag-theme-quartz" style={{ height: '500px', width: '100%' }}>
                  <AgGridReact
                    ref={contentGridRef}
                    rowData={contentTableData}
                    columnDefs={contentColumnDefs}
                    defaultColDef={defaultColDef}
                    pagination={true}
                    paginationPageSize={20}
                    localeText={{
                      noRowsToShow: 'Không có dữ liệu'
                    }}
                  />
                </div>
              ) : (
                <div className={styles.noContent}>
                  <p>Không có nội dung để hiển thị</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableDataFormat;

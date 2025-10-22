import React from 'react';
import { X } from 'lucide-react';
import styles from '../CustomerSurveyApp.module.css';

const TableViewModal = ({ isOpen, onClose, surveyItems, surveyTitle }) => {
  if (!isOpen) return null;

  // Function to extract table data from survey items
  const extractTableData = (items) => {
    const tableData = [];
    
    items.forEach((item, index) => {
      const row = {
        'STT': index + 1,
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

  // Function to get type labels (keeping in English)
  const getTypeLabel = (type) => {
    switch (type) {
      case 'section_header':
        return 'Section Header';
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

  // Function to get answer value based on item type
  const getAnswerValue = (item) => {
    switch (item.type) {
      case 'section_header':
        return ''; // No answer for section headers
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

  // Function to get note value based on item type
  const getNoteValue = (item) => {
    switch (item.type) {
      case 'section_header':
        return ''; // No notes for section headers
      case 'title_desc':
        return item.noteValue || '';
      case 'mcq':
      case 'qa':
        return item.note || '';
      default:
        return item.note || '';
    }
  };

  // Function to get status value
  const getStatusValue = (item) => {
    if (item.type === 'section_header' || item.type === 'title_desc') {
      return 'N/A'; // Section headers and title/description items don't have completion status
    }
    return item.completed ? 'Hoàn thành' : 'Chưa hoàn thành';
  };

  const tableData = extractTableData(surveyItems);
  const columns = ['STT', 'Loại', 'Tiêu đề', 'Mô tả', 'Trả lời', 'Ghi chú', 'Trạng thái'];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.tableViewModal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Dữ liệu dạng bảng - {surveyTitle}</h2>
          <button
            onClick={onClose}
            className={styles.modalCloseButton}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {tableData.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Không có dữ liệu để hiển thị</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className={styles.tableHeader}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index} className={styles.tableRow}>
                      {columns.map((column) => (
                        <td key={column} className={styles.tableCell}>
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableViewModal;

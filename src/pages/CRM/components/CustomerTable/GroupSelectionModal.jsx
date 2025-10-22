import { Button, Checkbox, Modal } from 'antd';
import React, { useState, useEffect } from 'react';
import styles from './GroupSelectionModal.module.css';

const GroupSelectionModal = ({
  open,
  onCancel,
  onSave,
  groupType,
  groupConfig,
  currentValues = [],
  customerData
}) => {
  const [selectedValues, setSelectedValues] = useState([]);

  useEffect(() => {
    // Initialize selected values when modal opens
    if (open && currentValues) {
      if (Array.isArray(currentValues)) {
        setSelectedValues([...currentValues]);
      } else if (typeof currentValues === 'string' && currentValues.trim()) {
        setSelectedValues(currentValues.split(',').map(v => v.trim()).filter(v => v));
      } else {
        setSelectedValues([]);
      }
    }
  }, [open, currentValues]);

  const handleCheckboxChange = (value, checked) => {
    if (checked) {
      setSelectedValues(prev => [...prev, value]);
    } else {
      setSelectedValues(prev => prev.filter(v => v !== value));
    }
  };

  const handleSave = () => {
    onSave(selectedValues);
    onCancel();
  };

  const handleClearAll = () => {
    setSelectedValues([]);
  };

  const handleRemoveValue = (valueToRemove) => {
    setSelectedValues(prev => prev.filter(v => v !== valueToRemove));
  };

  const handleRemoveInvalid = () => {
    const validOptions = groupConfig?.options || [];
    setSelectedValues(prev => prev.filter(v => validOptions.includes(v)));
  };

  // Lấy danh sách giá trị không hợp lệ (có trong currentValues nhưng không có trong options)
  const getInvalidValues = () => {
    const validOptions = groupConfig?.options || [];
    return selectedValues.filter(value => !validOptions.includes(value));
  };

  const invalidValues = getInvalidValues();

  const getGroupIcon = () => {
    switch (groupType) {
      case 'group1': return '📊';
      case 'group2': return '📈';
      case 'group3': return '📋';
      default: return '📋';
    }
  };

  const getGroupTitle = () => {
    switch (groupType) {
      case 'group1': return 'Group 1';
      case 'group2': return 'Group 2';
      case 'group3': return 'Group 3';
      default: return 'Group';
    }
  };

  const getGroupColor = () => {
    switch (groupType) {
      case 'group1': return '#10b981';
      case 'group2': return '#3b82f6';
      case 'group3': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <span className={styles.modalTitleIcon}>{getGroupIcon()}</span>
          <span className={styles.modalTitleText}>
            Chọn {getGroupTitle()} - {customerData?.name || 'Khách hàng'}
          </span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          size="large"
          className={styles.cancelButton}
        >
          Hủy
        </Button>,
        invalidValues.length > 0 && (
          <Button
            key="removeInvalid"
            onClick={handleRemoveInvalid}
            size="large"
            danger
            style={{ backgroundColor: '#fff2f0', color: '#ff4d4f', borderColor: '#ff4d4f' }}
          >
            🗑️ Remove Invalid ({invalidValues.length})
          </Button>
        ),
        <Button
          key="clear"
          onClick={handleClearAll}
          size="large"
          className={styles.clearButton}
          disabled={selectedValues.length === 0}
        >
          🗑️ Clear All
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          size="large"
          className={styles.saveButton}
          style={{ backgroundColor: getGroupColor(), borderColor: getGroupColor() }}
        >
          💾 Lưu lựa chọn
        </Button>
      ].filter(Boolean)}
      width={600}
    >
      <div className={styles.modalContent}>
        {/* Instructions */}
        <div className={styles.instructionsContainer}>
          <div className={styles.instructionsHeader}>
            <span className={styles.instructionsIcon}>💡</span>
            <span className={styles.instructionsTitle}>Hướng dẫn:</span>
          </div>
          <div className={styles.instructionsContent}>
            • <strong>Chọn nhiều:</strong> Click checkbox để chọn/bỏ chọn<br />
            • <strong>Xóa từng giá trị:</strong> Click nút "×" trên tag để xóa<br />
            • <strong>Xóa giá trị lỗi:</strong> Click "Remove Invalid" để xóa các giá trị không hợp lệ<br />
            • <strong>Lưu:</strong> Click "Lưu lựa chọn" để áp dụng
          </div>
        </div>

        {/* Current Selection Display */}
        {selectedValues.length > 0 && (
          <div className={styles.currentSelection}>
            <div className={styles.currentSelectionTitle}>
              Đã chọn ({selectedValues.length}):
            </div>
            <div className={styles.selectedTags}>
              {selectedValues.map((value, index) => {
                const isValid = groupConfig?.options?.includes(value);
                return (
                  <span 
                    key={index} 
                    className={styles.selectedTag} 
                    style={{ 
                      backgroundColor: isValid ? '#10b981' : '#ff4d4f',
                      color: 'white',
                      border: isValid ? '1px solid #10b981' : '1px solid #ff4d4f',
                      fontWeight: '500',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{value}</span>
                    {!isValid && <span>⚠️</span>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveValue(value);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0',
                        marginLeft: '2px',
                        fontSize: '14px',
                        lineHeight: '1',
                        fontWeight: 'bold'
                      }}
                      title="Xóa"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
            {invalidValues.length > 0 && (
              <div className={styles.invalidWarning}>
                <span style={{ color: '#ff4d4f', fontSize: '12px' }}>
                  ⚠️ {invalidValues.length} giá trị không tồn tại trong danh sách: {invalidValues.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Options List */}
        <div className={styles.optionsContainer}>
          <div className={styles.optionsTitle}>
            Danh sách tùy chọn:
          </div>
          <div className={styles.optionsList}>
            {groupConfig?.options?.length > 0 ? (
              groupConfig.options.map((option, index) => (
                <div key={index} className={styles.optionItem}>
                  <Checkbox
                    checked={selectedValues.includes(option)}
                    onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                    className={styles.checkbox}
                  >
                    <span className={styles.optionText}>{option}</span>
                  </Checkbox>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                Chưa có tùy chọn nào được cấu hình
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default GroupSelectionModal;

import { Button, Checkbox, Modal } from 'antd';
import React, { useState, useEffect } from 'react';
import styles from './GroupSelectionModal.module.css';

const ScriptSelectionModal = ({
  open,
  onCancel,
  onSave,
  scriptOptions = [],
  currentValues = [],
  customerData
}) => {

  const [selectedValues, setSelectedValues] = useState([]);


  useEffect(() => {
    // Initialize selected values when modal opens
    if (open && currentValues) {
      if (Array.isArray(currentValues)) {
        // Chuyển đổi objects thành script IDs
        const scriptIds = currentValues.map(value => {
          if (typeof value === 'object' && value !== null) {
            return value.emailSchedulerScript_id || null;
          }
          return null;
        }).filter(id => id);
        setSelectedValues(scriptIds);
      } else if (typeof currentValues === 'string' && currentValues.trim()) {
        setSelectedValues(currentValues.split(',').map(v => v.trim()).filter(v => v));
      } else {
        setSelectedValues([]);
      }
    } else if (open) {
      setSelectedValues([]);
    }
  }, [open, currentValues]);

  const handleCheckboxChange = (value, checked) => {
    if (checked) {
      setSelectedValues(prev => [...prev, value.id]);
    } else {
      setSelectedValues(prev => prev.filter(v => v !== value.id));
    }
  };

  const handleSave = () => {

    // Scripts cần THÊM (có trong selectedValues nhưng không có trong currentValues)
    const currentScriptIds = (currentValues || []).map(script => script.emailSchedulerScript_id);
    const scriptsToAdd = selectedValues.filter(scriptId => !currentScriptIds.includes(scriptId));

    // Scripts cần XÓA (có trong currentValues nhưng không có trong selectedValues)
    const scriptsToRemove = (currentValues || []).filter(script => !selectedValues.includes(script.emailSchedulerScript_id));



    // Tạo danh sách scripts cần thêm với đầy đủ thông tin
    const selectedScripts = scriptsToAdd.map(scriptId => {
      const scriptOption = scriptOptions.find(option => option.id === scriptId);
      return {
        script_name: scriptOption?.name || '',
        emailSchedulerScript_id: scriptId
      };
    });

    // Tạo danh sách scripts cần xóa với ID gốc
    const unselectedScripts = scriptsToRemove.map(script => ({
      id: script.id, // ID gốc của bản ghi customer_script để xóa
      script_name: script.script_name,
      emailSchedulerScript_id: script.emailSchedulerScript_id
    }));

    // Gửi cả 2 danh sách
    onSave({
      selected: selectedScripts,
      unselected: unselectedScripts
    });
    onCancel();
  };

  const handleClearAll = () => {
    setSelectedValues([]);
  };

  const handleRemoveValue = (valueToRemove) => {
    setSelectedValues(prev => prev.filter(v => v !== valueToRemove));
  };

  const handleRemoveInvalid = () => {
    const validIds = scriptOptions.map(option => option.id);
    setSelectedValues(prev => prev.filter(v => validIds.includes(v)));
  };

  // Lấy danh sách giá trị không hợp lệ (có trong currentValues nhưng không có trong options)
  const getInvalidValues = () => {
    const validIds = scriptOptions.map(option => option.id);
    return selectedValues.filter(value => !validIds.includes(value));
  };

  const invalidValues = getInvalidValues();

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <span className={styles.modalTitleIcon}>📧</span>
          <span className={styles.modalTitleText}>
            Chọn Kịch bản chăm sóc - {customerData?.name || 'Khách hàng'}
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
          style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
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
            • <strong>Chọn nhiều:</strong> Click checkbox để chọn/bỏ chọn nhiều kịch bản<br />
            • <strong>Xóa từng kịch bản:</strong> Click nút "×" trên tag để xóa<br />
            • <strong>Xóa kịch bản lỗi:</strong> Click "Remove Invalid" để xóa các kịch bản không hợp lệ<br />
            • <strong>Lưu:</strong> Click "Lưu lựa chọn" để áp dụng<br />
            • <strong>Lưu ý:</strong> Khách hàng có thể có nhiều kịch bản cùng lúc
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
                const scriptOption = scriptOptions.find(option => option.id === value);
                const isValid = !!scriptOption;
                const displayName = scriptOption?.name || `ID: ${value}`;
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
                    <span>{displayName}</span>
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
                  ⚠️ {invalidValues.length} kịch bản không tồn tại: {invalidValues.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Options List */}
        <div className={styles.optionsContainer}>
          <div className={styles.optionsTitle}>
            Danh sách kịch bản:
          </div>
          <div className={styles.optionsList}>
            {scriptOptions?.length > 0 ? (
              scriptOptions.map((option, index) => {
                const isChecked = selectedValues.includes(option.id);
                return (
                  <div key={index} className={styles.optionItem}>
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                      className={styles.checkbox}
                    >
                      <span className={styles.optionText}>📧 {typeof option === 'string' ? option : option.name || option}</span>
                    </Checkbox>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                Chưa có kịch bản nào được tạo
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ScriptSelectionModal;


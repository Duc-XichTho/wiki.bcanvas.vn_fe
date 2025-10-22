import React, { useState } from 'react';
import { createNewCustomerFolder } from '../../../../apis/customerFolderService';
import { createTimestamp } from '../../../../generalFunction/format';
import styles from './Sidebar.module.css';

const AddFolderModal = ({ isVisible, onClose, onSuccess }) => {
  const [folderName, setFolderName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      setSaving(true);
      await createNewCustomerFolder({ 
        name: folderName.trim(), 
        created_at: createTimestamp()
      });
      onClose();
      setFolderName('');
      onSuccess(); // Reload data
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Có lỗi xảy ra khi tạo folder. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Thêm Folder Mới</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Tên folder"
            className={styles.modalInput}
            autoFocus
          />
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.modalButton}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || !folderName.trim()}
              className={styles.modalButtonPrimary}
            >
              {saving ? 'Đang tạo...' : 'Tạo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFolderModal;

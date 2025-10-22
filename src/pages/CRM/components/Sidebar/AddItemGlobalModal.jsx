import React, { useState } from 'react';
import { createNewCustomerItem } from '../../../../apis/customerItemService';
import { createTimestamp } from '../../../../generalFunction/format';
import styles from './Sidebar.module.css';

const AddItemGlobalModal = ({ isVisible, onClose, onSuccess, folders }) => {
  const [itemName, setItemName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !selectedFolderId) return;

    try {
      setSaving(true);
      await createNewCustomerItem({
        name: itemName.trim(),
        customerFolder_id: selectedFolderId,
        created_at: createTimestamp()
      });
      onClose();
      setItemName('');
      setSelectedFolderId('');
      onSuccess(); // Reload data
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Có lỗi xảy ra khi tạo item. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Thêm Item Mới</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Chọn folder:</label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className={styles.modalSelect}
              required
            >
              <option value="">-- Chọn folder --</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tên item:</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Tên item"
              className={styles.modalInput}
              autoFocus
            />
          </div>

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
              disabled={saving || !itemName.trim() || !selectedFolderId}
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

export default AddItemGlobalModal;

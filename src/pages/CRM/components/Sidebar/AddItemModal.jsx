import React, { useState } from 'react';
import { createNewCustomerItem } from '../../../../apis/customerItemService';
import { createTimestamp } from '../../../../generalFunction/format';
import styles from './Sidebar.module.css';

const AddItemModal = ({ isVisible, onClose, onSuccess, selectedFolderId }) => {
  const [itemName, setItemName] = useState('');
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
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Tên item"
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
              disabled={saving || !itemName.trim()}
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

export default AddItemModal;

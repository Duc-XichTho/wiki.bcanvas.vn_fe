import React from 'react';
import styles from './MeasureForm.module.css';

const MeasureForm = ({ onSave, onCancel, initialData = {}, selectedCategory }) => {

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const measureData = {
      name: formData.get('name'),
      description: formData.get('description'),
      source: formData.get('source'),
      business_category_id: selectedCategory
    };
    onSave(measureData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>
          {initialData.id ? 'Chỉnh sửa thống kê' : 'Thêm thống kê mới'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên thống kê</label>
            <input 
              name="name" 
              defaultValue={initialData.name || ''}
              className={styles.input} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Mô tả</label>
            <textarea 
              name="description" 
              defaultValue={initialData.description || ''}
              className={styles.textarea} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nguồn dữ liệu</label>
            <input 
              name="source" 
              defaultValue={initialData.source || ''}
              className={styles.input} 
              required 
            />
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.saveButton}>
              Lưu
            </button>
            <button type="button" onClick={onCancel} className={styles.cancelButton}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeasureForm;

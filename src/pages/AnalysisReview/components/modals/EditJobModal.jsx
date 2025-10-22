import React from 'react';
import Modal from '../common/Modal';
import styles from '../../AnalysisReview.module.css';

export default function EditJobModal({ 
  editingJob, 
  setEditingJob, 
  onSave, 
  onCancel 
}) {
  const handleSave = () => {
    if (editingJob && editingJob.title?.trim() && editingJob.prompt?.trim()) {
      onSave();
    }
  };

  const handleCancel = () => {
    setEditingJob(null);
    onCancel();
  };

  return (
    <Modal
      isOpen={!!editingJob}
      title="Edit Job"
      onClose={handleCancel}
      onSave={handleSave}
      onCancel={handleCancel}
      saveText="Save"
      cancelText="Cancel"
      saveDisabled={!editingJob?.title?.trim() || !editingJob?.prompt?.trim()}
    >
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Job Title
        </label>
        <input
          type="text"
          value={editingJob?.title || ''}
          onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
          className={styles.formInput}
          placeholder="Enter job title"
        />
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Prompt
        </label>
        <textarea
          value={editingJob?.prompt || ''}
          onChange={(e) => setEditingJob({...editingJob, prompt: e.target.value})}
          className={styles.formTextarea}
          rows="4"
          placeholder="Enter job prompt"
        />
      </div>
    </Modal>
  );
} 
import React from 'react';
import styles from './UnsavedChangesModal.module.css';

const UnsavedChangesModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>Unsaved Changes</h2>
                <p>Bạn có thay đổi chưa được lưu. Bạn có muốn chuyển mà không lưu không?</p>
                <div className={styles.buttonContainer}>
                    <button
                        className={`${styles.button} ${styles.cancelButton}`}
                        onClick={onClose}
                    >
                        Ở lại
                    </button>
                    <button
                        className={`${styles.button} ${styles.confirmButton}`}
                        onClick={onConfirm}
                    >
                        Đi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnsavedChangesModal;
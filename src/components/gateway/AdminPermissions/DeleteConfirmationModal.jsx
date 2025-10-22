import React from 'react';
import styles from './AdminPermissions.module.css';
import { Trash2 } from 'lucide-react';
import Loading3DTower from '../../Loading3DTower';

function DeleteConfirmationModal({ permissionToDelete, isLoading, onConfirm, onCancel }) {
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.confirmModalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.confirmModalHeader}>
                    <h3><Trash2 size={18} className={styles.modalHeaderIcon} /> Confirm Removal</h3>
                </div>

                <div className={styles.confirmModalBody}>
                    <p>Are you sure you want to remove <strong>{permissionToDelete?.user_email}</strong>'s permissions?</p>
                    <p>This action cannot be undone.</p>
                </div>

                <div className={styles.confirmModalFooter}>
                    <button
                        className={styles.cancelButton}
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.deleteButton}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div ><Loading3DTower /> </div> Removing...
                            </>
                        ) : (
                            <>Remove</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeleteConfirmationModal; 
import React, { useState, useEffect } from 'react';
import styles from './AdminPermissions.module.css';
import {
    ChevronDown, Plus, X, Edit2, Save,
    Shield, UserPlus, Trash2,
    Users, Building, RefreshCw
} from 'lucide-react';
import { getPermissionsByTicketId, createPermission, updatePermission, deletePermission } from '../../../apis/gateway/permissonService';
import DeleteConfirmationModal from './DeleteConfirmationModal';

function AdminPermissions({ currentUser, companyList, userList }) {
    const [showAdminDropdown, setShowAdminDropdown] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [selectedCompanyForPermissions, setSelectedCompanyForPermissions] = useState('');
    const [permissions, setPermissions] = useState([]);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
    const [permissionsChanged, setPermissionsChanged] = useState(false);
    const [editedPermissions, setEditedPermissions] = useState({});
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [permissionToDelete, setPermissionToDelete] = useState(null);

    // ... Copy all the permission-related functions from Header.jsx ...
    // (openPermissionsModal, closePermissionsModal, fetchPermissions, etc.)

    return (
        <>
            {/* Admin Icon and Dropdown */}
            <div className={styles.adminContainer}>
                <button className={styles.adminButton} onClick={toggleAdminDropdown} title="Admin Settings">
                    <Shield size={20} />
                </button>

                {showAdminDropdown && (
                    <div className={styles.adminDropdownMenu}>
                        <div className={styles.dropdownItem} onClick={openPermissionsModal}>
                            <Users size={16} className={styles.dropdownItemIcon} />
                            <span>Manage User Permissions</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Permissions Management Modal */}
            {showPermissionModal && (
                <div className={styles.modalOverlay} onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        closePermissionsModal();
                    }
                }}>
                    <div className={styles.modalContent}>
                        {/* ... Copy the modal content from Header.jsx ... */}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmModal && (
                <DeleteConfirmationModal
                    permissionToDelete={permissionToDelete}
                    isLoading={isLoadingPermissions}
                    onConfirm={executeDeletePermission}
                    onCancel={cancelDeletePermission}
                />
            )}
        </>
    );
}

export default AdminPermissions; 
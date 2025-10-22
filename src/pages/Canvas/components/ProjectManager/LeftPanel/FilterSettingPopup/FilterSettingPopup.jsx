import React, { useEffect, useState } from 'react';
import css from './FilterSettingPopup.module.css';
import { X, Plus, Trash2 } from 'lucide-react';
// API
import { getAllUser } from '../../../../../../apis/userService';

const FilterSettingsPopup = ({ isOpen, onClose, progress, onUpdateProgress }) => {
    const [activeTab, setActiveTab] = useState('pic');
    const [allUser, setAllUser] = useState([]);
    const [newItem, setNewItem] = useState('');
    const [localProgress, setLocalProgress] = useState(progress);

    useEffect(() => {
        const fetchAllUser = async () => {
            const response = await getAllUser();
            setAllUser(response.result);
        };
        fetchAllUser();
    }, []);

    useEffect(() => {
        setLocalProgress(progress);
    }, [progress]);

    const handleAddItem = () => {
        if (!newItem.trim()) return;

        const updatedProgress = { ...localProgress };
        switch (activeTab) {
            case 'pic':
                const picArray = Array.isArray(updatedProgress.pic) ? updatedProgress.pic : [];
                updatedProgress.pic = [...picArray, newItem];
                break;
            case 'category':
                updatedProgress.cat = [...(localProgress.cat || []), newItem];
                break;
            case 'tag':
                updatedProgress.tag = [...(localProgress.tag || []), newItem];
                break;
        }

        setLocalProgress(updatedProgress);
        onUpdateProgress(updatedProgress);
        setNewItem('');
    };

    const handleRemoveItem = (item) => {
        const updatedProgress = { ...localProgress };
        switch (activeTab) {
            case 'pic':
                updatedProgress.pic = localProgress.pic.filter(pic => pic !== item);
                break;
            case 'category':
                updatedProgress.cat = localProgress.cat.filter(cat => cat !== item);
                break;
            case 'tag':
                updatedProgress.tag = localProgress.tag.filter(tag => tag !== item);
                break;
        }

        setLocalProgress(updatedProgress);
        onUpdateProgress(updatedProgress);
    };

    // Helper function to get username from email
    const getUsernameFromEmail = (email) => email.split('@')[0];

    const handleUserSelect = (email) => {
        const username = getUsernameFromEmail(email);
        if (!username) return;

        const updatedProgress = { ...localProgress };
        const picArray = Array.isArray(updatedProgress.pic) ? updatedProgress.pic : [];

        // Check if username already exists
        if (!picArray.includes(username)) {
            updatedProgress.pic = [...picArray, username];
            setLocalProgress(updatedProgress);
            onUpdateProgress(updatedProgress);
        }

        setNewItem(''); // Reset select after adding
    };

    // Filter out already selected users
    const getAvailableUsers = () => {
        const selectedUsernames = localProgress?.pic || [];
        return allUser.filter(user => {
            const username = getUsernameFromEmail(user.email);
            return !selectedUsernames.includes(username);
        });
    };

    if (!isOpen) return null;

    const getCurrentItems = () => {
        switch (activeTab) {
            case 'pic':
                return localProgress?.pic || [];
            case 'category':
                return localProgress?.cat || [];
            case 'tag':
                return localProgress?.tag || [];
            default:
                return [];
        }
    };

    return (
        <div className={css.modalOverlay}>
            <div className={css.modal}>
                <div className={css.modalHeader}>
                    <h2>Filter Settings</h2>
                    <button className={css.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={css.modalTabs}>
                    <button
                        className={`${css.tabButton} ${activeTab === 'pic' ? css.activeTab : ''}`}
                        onClick={() => setActiveTab('pic')}
                    >
                        PICs
                    </button>
                    {/* <button
                        className={`${css.tabButton} ${activeTab === 'category' ? css.activeTab : ''}`}
                        onClick={() => setActiveTab('category')}
                    >
                        Categories
                    </button> */}
                    <button
                        className={`${css.tabButton} ${activeTab === 'tag' ? css.activeTab : ''}`}
                        onClick={() => setActiveTab('tag')}
                    >
                        Tags
                    </button>
                </div>

                <div className={css.modalContent}>
                    <div className={css.addItemForm}>
                        {activeTab === 'pic' ? (
                            <div className={css.selectWrapper}>
                                <select
                                    value={newItem}
                                    onChange={(e) => handleUserSelect(e.target.value)}
                                    className={css.addItemInput}
                                >
                                    <option value="">Select a user...</option>
                                    {getAvailableUsers().map((user, index) => (
                                        <option key={index} value={user.email}>
                                            {user.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    placeholder={`Add new ${activeTab}...`}
                                    className={css.addItemInput}
                                />
                                <button className={css.addButton} onClick={handleAddItem}>
                                    <Plus size={20} />
                                </button>
                            </>
                        )}
                    </div>

                    <div className={css.itemsList}>
                        {getCurrentItems().map((item, index) => (
                            <div key={index} className={css.item}>
                                <span>{item}</span>
                                <button
                                    className={css.removeButton}
                                    onClick={() => handleRemoveItem(item)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterSettingsPopup;
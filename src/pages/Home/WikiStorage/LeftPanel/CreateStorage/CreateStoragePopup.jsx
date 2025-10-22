import React, { useState } from 'react';
import './CreateStoragePopup.css';

const CreateStoragePopup = ({ isOpen, onClose, onConfirm }) => {
    const [storageName, setStorageName] = useState('');

    const handleSubmit = () => {
        if (storageName.trim()) {
            onConfirm(storageName);
            setStorageName('');
            onClose();
        }
    };

    return (
        <div className={`createStoragePopup ${isOpen ? 'show' : ''}`}>
            <div className="createPopupContent">
                <h2 className="createPopupTitle">Tạo Storage</h2>

                <input
                    type="text"
                    value={storageName}
                    onChange={(e) => setStorageName(e.target.value)}
                    placeholder="Nhập tên Storage"
                    className="createPopupInput"
                />

                <div className="createPopupButtons">
                    <button
                        onClick={onClose}
                        className="createPopupButton createButtonCancel"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="createPopupButton createButtonConfirm"
                    >
                        Tạo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateStoragePopup;
import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import css from './NewAnalysisDialog.module.css';
import { im } from 'mathjs';
// API
import { createNewCanvasBot } from '../../../../apis/canvasBotService';

const NewAnalysisDialog = ({ isOpen, onClose, dataPacks, loadData, models }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedPacks, setSelectedPacks] = useState([]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const handleSubmit = async () => {
        if (!name || !description || !selectedModel) return;

        const newData = {
            name,
            description,
            model: selectedModel,
            dataPacks: selectedPacks,
            isEditing: false
        };

        await createNewCanvasBot(newData);

        setName('');
        setDescription('');
        setSelectedModel('');
        setSelectedPacks([]);
        loadData();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className={`${css.overlay} ${isOpen ? css.overlayVisible : ''}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className={css.dialog}>
                <div className={css.header}>
                    <h2 className={css.title}>Tạo mới Bot</h2>
                </div>

                <div className={css.content}>
                    <div className={css.formGroup}>
                        <label className={css.label}>Tên: </label>
                        <input
                            type="text"
                            className={css.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập tên"
                        />
                    </div>

                    <div className={css.formGroup}>
                        <label className={css.label}>Mô tả</label>
                        <textarea
                            className={css.textarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Nhập mô tả"
                        />
                    </div>

                    <div className={css.formGroup}>
                        <label className={css.label}>Mô hình</label>
                        <select
                            className={css.select}
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                        >
                            <option value="">Chọn mô hình AI</option>
                            {models.map((model) => (
                                <option key={model.key} value={model.key}>
                                    {model.value}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        className={`${css.buttonPrimary} ${!name || !description || !selectedModel 
                            ? css.buttonDisabled
                            : ''
                            }`}
                        onClick={handleSubmit}
                        disabled={!name || !description || !selectedModel }
                    >
                        Create Bot
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewAnalysisDialog;

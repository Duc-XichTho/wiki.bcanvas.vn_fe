// ProgressSettingsPopup.jsx
import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronRight, Lock, Unlock, Trash2, Edit2, X, Plus } from 'lucide-react';
import styles from './ProgressSettingsPopup.module.css';

const ProgressSettingsPopup = ({ progressSteps, isOpen, onClose, onUpdateStep, onRemoveStep, onCreateStep }) => {
    const [expandedSteps, setExpandedSteps] = useState({});
    const [isCreating, setIsCreating] = useState(false);
    const [newStepName, setNewStepName] = useState('');

    const toggleExpand = (stepId) => {
        setExpandedSteps(prev => ({
            ...prev,
            [stepId]: !prev[stepId]
        }));
    };

    const handleRename = async (stepId, newTitle) => {
        onUpdateStep(stepId, { title: newTitle });
    };

    const handleToggleLock = async (stepId, isLocked) => {
        onUpdateStep(stepId, { isLocked: !isLocked });
    };

    const handleCreateStep = (e) => {
        e.preventDefault();
        if (newStepName.trim()) {
            onCreateStep(newStepName.trim());
            setNewStepName('');
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <div className={styles.header}>
                    <h2>Progress Settings</h2>
                    <button
                        onClick={onClose}
                        className={styles.closeButton}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Create New Step Section */}
                    <div className={styles.createSection}>
                        {isCreating ? (
                            <form onSubmit={handleCreateStep} className={styles.createForm}>
                                <input
                                    type="text"
                                    value={newStepName}
                                    onChange={(e) => setNewStepName(e.target.value)}
                                    placeholder="Enter step name"
                                    autoFocus
                                    className={styles.createInput}
                                />
                                <div className={styles.createActions}>
                                    <button type="submit" className={styles.createButton}>
                                        Create
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreating(false);
                                            setNewStepName('');
                                        }}
                                        className={styles.cancelButton}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                                Add New Step
                            </button>
                        )}
                    </div>

                    {progressSteps.map((step) => (
                        <div key={step.id} className={styles.step}>
                            <div
                                className={styles.stepHeader}
                                onClick={() => toggleExpand(step.id)}
                            >
                                {expandedSteps[step.id] ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                                <span>{step.title}</span>
                                {step.isLocked ? (
                                    <Lock size={16} style={{ color: 'red' }} />
                                ) : (
                                    <Unlock size={16} style={{ color: 'green' }} />
                                )}
                            </div>

                            {expandedSteps[step.id] && (
                                <div className={styles.stepContent}>
                                    <div className={styles.renameField}>
                                        <Edit2 size={16} className={step.isLocked ? styles.editIconDisabled : ''} />
                                        <div className={styles.inputWrapper}>
                                            <input
                                                type="text"
                                                value={step.title}
                                                onChange={(e) => handleRename(step.id, e.target.value)}
                                                disabled={step.isLocked}
                                                maxLength={23}
                                                className={step.isLocked ? styles.inputDisabled : ''}
                                            />
                                            <span className={styles.charCount}>
                                                {step.title.length}/23
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.actions}>
                                        <button
                                            onClick={() => handleToggleLock(step.id, step.isLocked)}
                                            className={styles.lockButton}
                                        >
                                            {step.isLocked ? 'Unlock Phase' : 'Lock Phase'}
                                            {step.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                                        </button>

                                        {!step.isLocked && (
                                            <button
                                                onClick={() => onRemoveStep(step.id)}
                                                className={styles.removeButton}
                                            >
                                                Remove Phase
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProgressSettingsPopup;
import React, { useState, useEffect } from 'react';
import { Trash2, Edit3, Check, X, Save } from 'lucide-react';
import { message } from 'antd';
import css from './MainContent.module.css';
// API
import { updateCanvasData, deleteCanvasData } from '../../../../apis/canvasDataService';
import { getFileNotePadByIdController } from '../../../../apis/fileNotePadService';
// COMPONENTS
import NotePad from '../../Daas/Content/NotePad/NotePad';
import File from '../../Daas/Content/File/File';
import Data from '../../Daas/Content/Data/Data';
import KPI2ContentView from "../../CanvasFolder/KPI2Calculator/KPI2ContentView.jsx";
import ChartTemplateElementView
    from "../../Daas/Content/Template/SettingChart/ChartTemplate/ChartTemplateElement/ChartTemplateElementView.jsx";

const MainContent = ({
    selectedComponent,
    departments,
    aiDatapacks,
    loadData
}) => {
    if (!selectedComponent) return null;

    const [modifiedComponent, setModifiedComponent] = useState(selectedComponent);
    const [originalComponent, setOriginalComponent] = useState(selectedComponent);
    const [editedDescription, setEditedDescription] = useState(selectedComponent?.description || '');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [ComponentToRender, setComponentToRender] = useState(null);
    const [fileNotePad, setFileNotePad] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const componentsMap = {
        FileUpLoad: File,
        NotePad: NotePad,
        Data: Data,
        KPI: KPI2ContentView,
        ChartTemplate: ChartTemplateElementView
    };

    useEffect(() => {
        setModifiedComponent(selectedComponent);
        setOriginalComponent(selectedComponent);
        setHasChanges(false);
        loadVisual();
    }, [selectedComponent]);

    const loadVisual = async () => {
        try {
            const fileNotePadData = await getFileNotePadByIdController(selectedComponent.aiDatapackId);
            setFileNotePad(fileNotePadData);
            const Component = componentsMap?.[fileNotePadData?.table];
            setComponentToRender(() => Component);
        } catch (error) {
            console.error('Error loading visual:', error);
            setComponentToRender(null);
        }
    };

    const checkForChanges = (updatedComponent) => {
        const hasDatapackChange = updatedComponent.aiDatapackId !== originalComponent.aiDatapackId;
        const hasDepartmentsChange = JSON.stringify(updatedComponent.departments) !== JSON.stringify(originalComponent.departments);
        const hasDescriptionChange = updatedComponent.description !== originalComponent.description;

        return hasDatapackChange || hasDepartmentsChange || hasDescriptionChange;
    };

    const handleDatapackChange = (e) => {
        const updated = {
            ...modifiedComponent,
            aiDatapackId: e.target.value
        };
        setModifiedComponent(updated);
        setHasChanges(checkForChanges(updated));
    };

    const handleDepartmentChange = (dept) => {
        const updated = {
            ...modifiedComponent,
            departments: modifiedComponent.departments.includes(dept)
                ? modifiedComponent.departments.filter(d => d !== dept)
                : [...modifiedComponent.departments, dept]
        };
        setModifiedComponent(updated);
        setHasChanges(checkForChanges(updated));
    };

    useEffect(() => {
        if (isEditingDescription) {
            const updated = {
                ...modifiedComponent,
                description: editedDescription
            };
            setModifiedComponent(updated);
            setHasChanges(checkForChanges(updated));
        }
    }, [editedDescription]);

    const handleSave = async () => {
        setOriginalComponent(modifiedComponent);
        await updateCanvasData(modifiedComponent);
        setHasChanges(false);
        loadData();
    };

    const handleSaveDescription = async () => {
        setIsEditingDescription(false);
        await updateCanvasData({
            id: modifiedComponent.id,
            description: editedDescription
        });
        loadData();
    };

    const handleCancelEdit = () => {
        setIsEditingDescription(false);
        setEditedDescription(modifiedComponent.description);
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteCanvasData(selectedComponent.id);
            setShowDeleteConfirm(false);
            loadData();
            message.success('Canvas deleted successfully!');
        } catch (error) {
            console.error('Error deleting canvas:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={css.mainPanel}>
            <div>
                <div className={css.mainHeader}>
                    <div>
                        <h1 className={css.componentTitle}>{modifiedComponent.name}</h1>
                        <div className={css.descriptionContainer}>
                            <span className={css.componentId}>{modifiedComponent.code}</span>
                            <div className="flex-1 relative">
                                {isEditingDescription ? (
                                    <div className={css.descriptionContainer}>
                                        <textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            className={css.descriptionTextarea}
                                            placeholder="Enter description..."
                                        />
                                        <div className={css.buttonGroup}>
                                            <button onClick={handleSaveDescription} className={css.saveButton}>
                                                <Check size={16} />
                                            </button>
                                            <button onClick={handleCancelEdit} className={css.cancelButton}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={css.descriptionContainer}>
                                        <p>{modifiedComponent.description}</p>
                                        <button
                                            onClick={() => setIsEditingDescription(true)}
                                            className={css.cancelButton}
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={css.buttonGroup} style={{ flexDirection: 'row' }}>
                        {hasChanges && (
                            <button
                                onClick={handleSave}
                                className={css.saveButton}
                                title="Save changes"
                            >
                                <Save size={20} />
                            </button>
                        )}
                        <button
                            className={css.deleteButton}
                            onClick={() => setShowDeleteConfirm(true)}
                            title="Delete component"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                <div className={css.formSection}>
                    <div className={css.formGroup}>
                        <label className={css.label}>Data</label>
                        <select
                            className={css.select}
                            value={modifiedComponent.aiDatapackId}
                            onChange={handleDatapackChange}
                        >
                            {aiDatapacks.map(pack => (
                                <option key={pack.id} value={pack.id}>{pack.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={css.preview}>
                    <h3 className={css.previewTitle}>Component Preview</h3>
                    <div className={css.previewWrapper}>
                        <div className={css.previewContent}>
                            {ComponentToRender && fileNotePad && (
                                <ComponentToRender
                                    fileNotePad={fileNotePad}
                                    fetchData={loadData}
                                    selectedKpiId={fileNotePad.type}
                                    selectedItemID={fileNotePad.type}
                                />
                            )}
                        </div>
                        {/* <div className={css.overlay}></div> */}
                    </div>
                </div>

                {showDeleteConfirm && (
                    <div className={css.modalOverlay}>
                        <div className={css.modal}>
                            <h3 className={css.modalTitle}>Delete Component</h3>
                            <p className={css.modalText}>
                                Are you sure you want to delete "{modifiedComponent.name}"?
                                This action cannot be undone.
                            </p>
                            <div className={css.modalButtons}>
                                <button
                                    className={css.cancelModalButton}
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={css.confirmDeleteButton}
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainContent;
